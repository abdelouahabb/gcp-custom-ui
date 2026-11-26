#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const LOG_DIR = path.resolve(process.cwd(), '.cloudpulse-logs');
const LOG_FILE = path.join(LOG_DIR, 'agent-tasks.log');
const MAX_BYTES = 256 * 1024; // 256 KB per file
const MAX_ROTATIONS = 5;

function ensureDir() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function rotateIfNeeded() {
  if (!fs.existsSync(LOG_FILE)) return;
  const { size } = fs.statSync(LOG_FILE);
  if (size < MAX_BYTES) return;

  for (let i = MAX_ROTATIONS - 1; i >= 1; i--) {
    const src = path.join(LOG_DIR, `agent-tasks.${i}.log`);
    const dst = path.join(LOG_DIR, `agent-tasks.${i + 1}.log`);
    if (fs.existsSync(src)) {
      if (i + 1 > MAX_ROTATIONS) fs.unlinkSync(src);
      else fs.renameSync(src, dst);
    }
  }
  fs.renameSync(LOG_FILE, path.join(LOG_DIR, 'agent-tasks.1.log'));
}

function appendEntry({ category = 'TASK', summary, files = [], commit = '' }) {
  ensureDir();
  rotateIfNeeded();
  const entry = {
    ts: new Date().toISOString(),
    category,
    summary: String(summary || '').trim(),
    commit: String(commit || '').trim() || undefined,
    files: Array.isArray(files) ? files.filter(Boolean).slice(0, 12) : [],
  };
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
  return entry;
}

const [, , cmd = 'tail', ...rest] = process.argv;

if (cmd === 'add') {
  const [category = 'TASK', summary = '', filesCsv = ''] = rest;
  if (!summary.trim()) {
    console.error('Usage: node scripts/task-log.mjs add <category> <summary> [comma,separated,files]');
    process.exit(1);
  }
  const files = filesCsv ? filesCsv.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const entry = appendEntry({ category, summary, files });
  console.log('Logged:', JSON.stringify(entry));
} else if (cmd === 'from-git-head') {
  try {
    const hash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    const subject = execSync('git log -1 --pretty=%s', { encoding: 'utf8' }).trim();
    const filesRaw = execSync('git diff-tree --no-commit-id --name-only -r HEAD', { encoding: 'utf8' }).trim();
    const files = filesRaw ? filesRaw.split('\n').filter(Boolean) : [];
    const catMatch = subject.match(/^([a-z]+)(?:\(([^)]+)\))?:/i);
    const category = catMatch ? `${catMatch[1].toUpperCase()}${catMatch[2] ? '/' + catMatch[2].toUpperCase() : ''}` : 'COMMIT';
    appendEntry({ category, summary: subject, files, commit: hash });
  } catch {
    // Never block git commit if logging fails
  }
} else if (cmd === 'seed-recent') {
  const count = Math.min(50, Math.max(1, Number(rest[0]) || 15));
  const raw = execSync(`git log -n ${count} --reverse --pretty=format:%h%x09%aI%x09%s`, { encoding: 'utf8' }).trim();
  ensureDir();
  for (const line of raw.split('\n').filter(Boolean)) {
    const [hash, ts, subject] = line.split('\t');
    const filesRaw = execSync(`git diff-tree --no-commit-id --name-only -r ${hash}`, { encoding: 'utf8' }).trim();
    const files = filesRaw ? filesRaw.split('\n').filter(Boolean).slice(0, 12) : [];
    const catMatch = subject.match(/^([a-z]+)(?:\(([^)]+)\))?:/i);
    const category = catMatch ? `${catMatch[1].toUpperCase()}${catMatch[2] ? '/' + catMatch[2].toUpperCase() : ''}` : 'COMMIT';
    rotateIfNeeded();
    fs.appendFileSync(LOG_FILE, JSON.stringify({ ts, category, summary: subject, commit: hash, files }) + '\n', 'utf8');
  }
  console.log(`Seeded ${count} recent commits into .cloudpulse-logs/agent-tasks.log`);
} else if (cmd === 'tail') {
  const n = Math.min(100, Math.max(1, Number(rest[0]) || 20));
  if (!fs.existsSync(LOG_FILE)) {
    console.log('(no task log entries yet)');
    process.exit(0);
  }
  const lines = fs.readFileSync(LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
  for (const line of lines.slice(-n)) {
    try {
      const e = JSON.parse(line);
      console.log(`[${e.ts.slice(0, 19).replace('T', ' ')}] [${e.category}] ${e.commit ? `(${e.commit}) ` : ''}${e.summary}${e.files?.length ? ` :: ${e.files.join(', ')}` : ''}`);
    } catch {
      console.log(line);
    }
  }
} else {
  console.error(`Unknown command: ${cmd}. Use: add | from-git-head | seed-recent | tail`);
  process.exit(1);
}
