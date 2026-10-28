import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Globe,
  Cpu,
  ShieldCheck,
  Lock,
  Sparkles,
  RefreshCw,
  Play,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  Database,
  Terminal,
  Activity,
  Key,
} from 'lucide-react';

const SINGULARITY_TABS = [
  {
    id: 'STARLINK_ORBITAL_MESH',
    step: '01',
    title: 'Starlink Orbital Mesh — Multi-Region TLS 1.3 & Geo-Failover Probe',
    subtitle: '6 Intercontinental Corridors · Live TLS 1.3 Probe · Geo-Failover',
    icon: Globe,
  },
  {
    id: 'NEURALINK_THOUGHT_COMPILER',
    step: '02',
    title: 'Neuralink Thought-to-Cloud — Natural-Language 4-Node DAG Builder',
    subtitle: '1-Sentence Intent -> 4-Node Live GCP DAG Materializer',
    icon: Cpu,
  },
  {
    id: 'OPTIMUS_AUTONOMOUS_COUNCIL',
    step: '03',
    title: 'Optimus 3-Agent Council — FinOps, SecOps & SRE Review Board',
    subtitle: 'FinOps Hawk + Zero-Trust Sentinel + SRE Prime Review',
    icon: Sparkles,
  },
  {
    id: 'CRYPTO_BLACKBOX_LEDGER',
    step: '04',
    title: 'Cryptographic Black-Box — Ed25519 Signed Audit Trail Ledger',
    subtitle: 'RFC 8032 Asymmetric Signatures · SHA-256 Hash Chain',
    icon: Lock,
  },
];

const NEURALINK_INTENT_PRESETS = [
  {
    label: 'AI RAG Lakehouse + Zero-Trust Vault',
    slug: 'neuralink_rag_2026',
    region: 'US',
    prompt:
      'Deploy a zero-trust AI RAG Lakehouse with an encrypted Secret Manager API key vault, hardened Cloud Storage bucket, and BigQuery vector telemetry table in US.',
  },
  {
    label: 'GDPR Sovereign EU Clean-Room',
    slug: 'neuralink_eu_cleanroom',
    region: 'EU',
    prompt:
      'Provision an EU-sovereign GDPR data clean-room with Uniform IAM Cloud Storage, EU BigQuery dataset, typed audit table, and hardware-encrypted Secret Manager vault.',
  },
  {
    label: 'FinOps Real-Time Cost & Quota Sink',
    slug: 'neuralink_finops_sink',
    region: 'US',
    prompt:
      'Create a zero-idle-cost FinOps telemetry sink with 7-day Soft-Delete GCS bucket, BigQuery billing analytics dataset/table, and automated rotation secret vault.',
  },
  {
    label: 'Multi-Agent MCP Telemetry Mesh',
    slug: 'neuralink_mcp_mesh',
    region: 'US',
    prompt:
      'Bootstrap an autonomous MCP agent telemetry mesh with hardened artifact storage, BigQuery JSON-RPC trace table, and OAuth token vault.',
  },
];

const OPTIMUS_DEBATE_TOPICS = [
  'Evaluate my live project for FinOps waste elimination, Zero-Trust perimeter hardening, and multi-region SRE failover resilience.',
  'Design an aggressive $0-idle serverless scale-to-zero and GCS Autoclass storage arbitrage plan without sacrificing P99 latency.',
  'Audit all IAM Service Accounts, VPC firewall rules, and Cloud Storage buckets against strict SOC2 / ISO-27001 Zero-Trust controls.',
];

function renderInlineMarkdown(text, keyPrefix = 'nlink') {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong
          key={`${keyPrefix}-b-${idx}`}
          className="font-extrabold text-zinc-900 dark:text-white"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={`${keyPrefix}-c-${idx}`}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-bold"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <React.Fragment key={`${keyPrefix}-t-${idx}`}>{part}</React.Fragment>;
  });
}

function NeuralinkMarkdownView({ content, onCopy }) {
  if (!content) return null;
  const raw = String(content).replace(/\r\n/g, '\n');
  const segments = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = fenceRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'markdown', text: raw.slice(lastIndex, match.index) });
    }
    segments.push({
      type: 'code',
      lang: (match[1] || 'bash').trim(),
      code: match[2].trim(),
    });
    lastIndex = fenceRegex.lastIndex;
  }
  if (lastIndex < raw.length) {
    segments.push({ type: 'markdown', text: raw.slice(lastIndex) });
  }

  return (
    <div className="space-y-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">
      {segments.map((seg, sIdx) => {
        if (seg.type === 'code') {
          return (
            <div
              key={`code-${sIdx}`}
              className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
                <span className="uppercase font-bold text-blue-300">
                  {seg.lang || 'CLI'}
                </span>
                {onCopy && (
                  <button
                    type="button"
                    onClick={() => onCopy(seg.code)}
                    className="inline-flex items-center gap-1 text-zinc-300 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                )}
              </div>
              <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                {seg.code}
              </pre>
            </div>
          );
        }

        const lines = seg.text.split('\n');
        const blocks = [];
        let listItems = [];
        let tableRows = [];

        const flushList = (keyBase) => {
          if (listItems.length > 0) {
            blocks.push(
              <ul key={`ul-${keyBase}`} className="space-y-1.5 pl-1">
                {listItems.map((item, lIdx) => (
                  <li
                    key={`li-${keyBase}-${lIdx}`}
                    className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-200"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      {renderInlineMarkdown(item, `li-${keyBase}-${lIdx}`)}
                    </div>
                  </li>
                ))}
              </ul>
            );
            listItems = [];
          }
        };

        const flushTable = (keyBase) => {
          if (tableRows.length > 0) {
            const dataRows = tableRows.filter(
              (r) => !r.every((cell) => cell.replace(/[-: ]/g, '').trim() === '')
            );
            if (dataRows.length > 0) {
              const header = dataRows[0];
              const body = dataRows.slice(1);
              blocks.push(
                <div
                  key={`tbl-${keyBase}`}
                  className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        {header.map((h, hIdx) => (
                          <th
                            key={`th-${hIdx}`}
                            className="py-2 px-2.5 font-mono font-extrabold text-zinc-800 dark:text-zinc-200"
                          >
                            {renderInlineMarkdown(h, `th-${keyBase}-${hIdx}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {body.map((row, rIdx) => (
                        <tr
                          key={`tr-${rIdx}`}
                          className="bg-white dark:bg-zinc-950/60"
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={`td-${cIdx}`}
                              className="py-1.5 px-2.5 text-zinc-700 dark:text-zinc-300"
                            >
                              {renderInlineMarkdown(
                                cell,
                                `td-${keyBase}-${rIdx}-${cIdx}`
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            tableRows = [];
          }
        };

        lines.forEach((rawLine, lIdx) => {
          const line = rawLine.trim();
          if (!line) {
            flushList(`${sIdx}-${lIdx}`);
            flushTable(`${sIdx}-${lIdx}`);
            return;
          }
          if (line.startsWith('|') && line.endsWith('|') && line.length > 2) {
            flushList(`${sIdx}-${lIdx}`);
            const cells = line
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim());
            tableRows.push(cells);
            return;
          }
          flushTable(`${sIdx}-${lIdx}`);

          const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
          if (headingMatch) {
            flushList(`${sIdx}-${lIdx}`);
            blocks.push(
              <div
                key={`hd-${sIdx}-${lIdx}`}
                className="pt-2 pb-1 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 text-xs font-extrabold text-zinc-900 dark:text-white"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>{renderInlineMarkdown(headingMatch[2], `hd-${sIdx}-${lIdx}`)}</span>
              </div>
            );
            return;
          }

          const bulletMatch = line.match(/^([-*]|\d+\.)\s+(.*)$/);
          if (bulletMatch) {
            listItems.push(bulletMatch[2]);
            return;
          }

          flushList(`${sIdx}-${lIdx}`);
          blocks.push(
            <p key={`p-${sIdx}-${lIdx}`} className="text-xs leading-relaxed">
              {renderInlineMarkdown(line, `p-${sIdx}-${lIdx}`)}
            </p>
          );
        });

        flushList(`${sIdx}-end`);
        flushTable(`${sIdx}-end`);

        return (
          <div key={`seg-${sIdx}`} className="space-y-2.5">
            {blocks}
          </div>
        );
      })}
    </div>
  );
}

export default function Wave13StarlinkNeuralinkStudio({
  projectId,
  onShowToast,
  onRefreshOverview,
}) {
  const [activeTab, setActiveTab] = useState('STARLINK_ORBITAL_MESH');

  // Module 01: Starlink Orbital & Global Regional Control-Plane State
  const [orbitalData, setOrbitalData] = useState(null);
  const [probingOrbital, setProbingOrbital] = useState(false);
  const [executingFailover, setExecutingFailover] = useState(false);
  const [failoverReceipt, setFailoverReceipt] = useState(null);

  // Module 02: Neuralink Thought-to-Cloud State
  const [thoughtPrompt, setThoughtPrompt] = useState(
    NEURALINK_INTENT_PRESETS[0].prompt
  );
  const [stackSlug, setStackSlug] = useState(NEURALINK_INTENT_PRESETS[0].slug);
  const [dagRegion, setDagRegion] = useState(NEURALINK_INTENT_PRESETS[0].region);
  const [compiledDag, setCompiledDag] = useState(null);
  const [compilingDag, setCompilingDag] = useState(false);
  const [materializingDag, setMaterializingDag] = useState(false);
  const [materializedResult, setMaterializedResult] = useState(null);

  // Module 03: Optimus 3-Agent Autonomous Council State
  const [councilTopic, setCouncilTopic] = useState(OPTIMUS_DEBATE_TOPICS[0]);
  const [councilData, setCouncilData] = useState(null);
  const [runningCouncil, setRunningCouncil] = useState(false);

  // Module 04: Cryptographic Ed25519 Black-Box Ledger State
  const [ledgerData, setLedgerData] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [attestationNote, setAttestationNote] = useState(
    'SRE Zero-Trust & Multi-Region Orbital Readiness Checkpoint'
  );
  const [sealingBlock, setSealingBlock] = useState(false);

  const notify = useCallback(
    (msg) => {
      if (onShowToast) onShowToast(msg);
    },
    [onShowToast]
  );

  const copyText = useCallback(
    (txt) => {
      navigator.clipboard?.writeText(String(txt || ''));
      notify('Copied to clipboard');
    },
    [notify]
  );

  const runStarlinkProbe = useCallback(async () => {
    if (!projectId) return;
    setProbingOrbital(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave13/starlink-orbital-probe`,
        {}
      );
      setOrbitalData(res.data);
    } catch (err) {
      notify(
        `Orbital probe notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setProbingOrbital(false);
    }
  }, [projectId, notify]);

  const runNeuralinkCompile = useCallback(
    async (promptVal = thoughtPrompt, slugVal = stackSlug, regVal = dagRegion) => {
      if (!projectId) return;
      setCompilingDag(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/wave13/neuralink-compile`,
          {
            thoughtPrompt: promptVal,
            stackSlug: slugVal,
            region: regVal,
          }
        );
        setCompiledDag(res.data);
      } catch (err) {
        notify(
          `Neuralink compiler notice: ${err.response?.data?.error || err.message}`
        );
      } finally {
        setCompilingDag(false);
      }
    },
    [projectId, thoughtPrompt, stackSlug, dagRegion, notify]
  );

  const fetchBlackBoxLedger = useCallback(async () => {
    if (!projectId) return;
    setLoadingLedger(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave13/blackbox-ledger`
      );
      setLedgerData(res.data);
    } catch (err) {
      notify(
        `Black-Box ledger notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoadingLedger(false);
    }
  }, [projectId, notify]);

  useEffect(() => {
    runStarlinkProbe();
    runNeuralinkCompile(
      NEURALINK_INTENT_PRESETS[0].prompt,
      NEURALINK_INTENT_PRESETS[0].slug,
      NEURALINK_INTENT_PRESETS[0].region
    );
    fetchBlackBoxLedger();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEngageOrbitalFailover = async (corridor) => {
    if (!projectId) return;
    setExecutingFailover(true);
    try {
      const targetReg = corridor?.bqMultiRegion || (corridor?.id?.includes('eu') ? 'EU' : 'US');
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave13/starlink-failover-execute`,
        {
          corridorId: corridor?.id || 'corridor-us-central1',
          targetRegion: targetReg,
          failoverMode: 'BIGQUERY_GEO_BEACON',
        }
      );
      setFailoverReceipt(res.data);
      runStarlinkProbe();
      fetchBlackBoxLedger();
      if (onRefreshOverview) onRefreshOverview();
      notify(res.data?.actionDetail || 'Live Geo-Standby provisioned & heartbeat row streamed');
    } catch (err) {
      if (err?.message && err.message.includes('cancelled')) return;
      notify(
        `Orbital failover error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setExecutingFailover(false);
    }
  };

  const handleMaterializeNeuralinkDag = async () => {
    if (!projectId) return;
    setMaterializingDag(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave13/neuralink-materialize`,
        {
          stackSlug,
          location: dagRegion,
          thoughtPrompt,
        }
      );
      setMaterializedResult(res.data);
      fetchBlackBoxLedger();
      if (onRefreshOverview) onRefreshOverview();
      notify(
        `Neuralink 4-Node DAG materialized + GCS object uploaded + BQ row queried in ${res.data?.wallClockMs}ms!`
      );
    } catch (err) {
      if (err?.message && err.message.includes('cancelled')) return;
      notify(
        `DAG materialization error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setMaterializingDag(false);
    }
  };

  const handleRunOptimusCouncil = async (e) => {
    if (e) e.preventDefault();
    if (!projectId) return;
    setRunningCouncil(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave13/optimus-swarm-debate`,
        { councilTopic }
      );
      setCouncilData(res.data);
      fetchBlackBoxLedger();
      notify(
        `Optimus 3-Agent Council Consensus synthesized (${res.data?.latencyMs}ms)`
      );
    } catch (err) {
      notify(
        `Optimus council notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningCouncil(false);
    }
  };

  const handleSealBlackBoxBlock = async (e) => {
    if (e) e.preventDefault();
    if (!projectId) return;
    setSealingBlock(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave13/blackbox-seal`,
        { attestationNote }
      );
      setLedgerData({
        ok: true,
        projectId,
        algorithm: 'Ed25519 (RFC 8032) + SHA-256 Merkle Hash-Chain',
        publicKeyPem: res.data.publicKeyPem,
        publicKeyFingerprint: res.data.publicKeyFingerprint,
        chainLength: res.data.chainLength,
        allSignaturesValid: true,
        blocks: res.data.blocks,
      });
      notify(
        `Sealed Block #${res.data.sealedBlock?.blockIndex} with Ed25519 signature (${res.data.latencyMs}ms)`
      );
    } catch (err) {
      notify(
        `Black-Box seal notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setSealingBlock(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="p-5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 dark:from-blue-950/40 dark:via-zinc-900 dark:to-blue-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40">
                GLOBAL EDGE &amp; PROMPT-TO-DAG STUDIO (MULTI-REGION TLS 1.3 PROBE, NATURAL-LANGUAGE DAG &amp; ED25519 LEDGER)
              </span>
              <span className="px-2.5 py-0.5 rounded-full-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Ed25519 RFC 8032 SIGNED · 100% LIVE GCP REST &amp; TLS 1.3
              </span>
              {ledgerData?.publicKeyFingerprint && (
                <span className="px-2.5 py-0.5 rounded-full-full text-[10px] font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800">
                  Ed25519 Key ID: {ledgerData.publicKeyFingerprint.slice(0, 16)}...
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Global Edge &amp; Prompt-to-DAG Studio — Multi-Region TLS 1.3 Matrix, Prompt-to-DAG Builder, 3-Agent Review &amp; Ed25519 Audit Ledger
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-4xl">
              Execute real DNS + TLS 1.3 + HTTPS REST probes across 6 regional Google Cloud control planes, stream live failover heartbeats into BigQuery, compile natural-language requirements into live GCS objects + SecretVersions + BigQuery SQL rows, run a 3-agent Gemini 3.8 Flash review, and sign every mutation with RFC 8032 Ed25519 keys.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Fastest Region
              </div>
              <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {orbitalData?.fastestRegion || 'Probing...'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Dynamic Schema
              </div>
              <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {compiledDag?.schemaFields?.length || 5} Live Columns
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Ed25519 Blocks
              </div>
              <div className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {ledgerData?.chainLength || 1} Verified
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Equal-Sized 4-Column Bento Sub-Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SINGULARITY_TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-feature-id={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`h-20 p-3.5 rounded-md border text-left transition-all flex flex-col justify-between cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                    active
                      ? 'bg-black/25 text-blue-100'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  MODULE
                </span>
                <Icon className="w-4 h-4 shrink-0" />
              </div>
              <div>
                <div className="text-xs font-extrabold truncate">{t.title}</div>
                <div
                  className={`text-[10px] truncate ${
                    active ? 'text-blue-100/90' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {t.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* MODULE 01: LIVE 6-REGION HTTPS/TLS CONTROL-PLANE & FAILOVER STREAM  */}
      {/* =================================================================== */}
      {activeTab === 'STARLINK_ORBITAL_MESH' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>
                  100% Live 6-Region Google Cloud Control-Plane Socket Matrix & BigQuery Heartbeat Streamer
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Every latency number below is measured live from your machine via real DNS lookup, TLS 1.3 socket handshake, and regional HTTPS REST round-trip to <code>*-aiplatform.googleapis.com</code>. Click <strong>Stream Live Heartbeat</strong> to provision the geo-standby dataset, create <code>live_failover_heartbeats</code>, and insert a real row via <code>tabledata.insertAll</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => runStarlinkProbe()}
              disabled={probingOrbital}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${probingOrbital ? 'animate-spin' : ''}`}
              />
              <span>
                {probingOrbital
                  ? 'Probing 6 Regional Control Planes...'
                  : 'Re-Probe 6 Regional Endpoints Live'}
              </span>
            </button>
          </div>

          {failoverReceipt && (
            <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{failoverReceipt.actionDetail}</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                  Ed25519 Signature:{' '}
                  <code>
                    {failoverReceipt.ledgerBlock?.ed25519SignatureHex?.slice(0, 32)}
                    ...
                  </code>{' '}
                  · Execution: {failoverReceipt.latencyMs}ms
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('CRYPTO_BLACKBOX_LEDGER')}
                className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-mono font-bold shrink-0 cursor-pointer"
              >
                Inspect Ed25519 Block
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(orbitalData?.corridors || []).map((c, idx) => {
              const isDeployed = c.standbyStatus === 'LIVE_STANDBY_DEPLOYED_IN_GCP';
              const isFastest = idx === 0 && Boolean(orbitalData?.fastestRegion);
              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                    isFastest
                      ? 'border-blue-500/60 bg-blue-500/5 dark:bg-blue-950/20'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                          isDeployed
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                            : 'bg-blue-500/15 text-blue-700 dark:text-blue-300'
                        }`}
                      >
                        {isDeployed ? 'STANDBY DEPLOYED IN GCP' : c.activeTransport}
                      </span>
                      <span className="text-[11px] font-mono font-extrabold text-blue-600 dark:text-blue-400">
                        {isFastest ? 'FASTEST CONTROL PLANE' : `HTTP ${c.httpStatus}`}
                      </span>
                    </div>

                    <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
                      {c.label}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Corridor: {c.subseaCableName} ({c.greatCircleKm.toLocaleString()} km)
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] font-mono text-zinc-400">
                          Live TLS 1.3 Socket
                        </div>
                        <div className="text-sm font-mono font-extrabold text-zinc-800 dark:text-zinc-200">
                          {c.tlsSocketMs} ms
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                        <div className="text-[10px] font-mono text-blue-700 dark:text-blue-300">
                          Live HTTPS REST RTT
                        </div>
                        <div className="text-sm font-mono font-extrabold text-blue-700 dark:text-blue-300">
                          {c.httpsRttMs} ms
                        </div>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-zinc-100/80 dark:bg-zinc-950/90 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 space-y-0.5">
                      <div className="truncate">
                        Host: <strong className="text-zinc-900 dark:text-white">{c.endpointHost}</strong> ({c.liveProbe?.resolvedIp})
                      </div>
                      <div>
                        DNS: <strong>{c.dnsMs}ms</strong> · Cipher:{' '}
                        <strong>{c.liveProbe?.tlsProtocol}</strong>
                      </div>
                      <div className="truncate">
                        BQ Standby Dataset: <strong className="text-zinc-900 dark:text-white">{c.standbyDatasetId}</strong> ({c.bqMultiRegion})
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => runStarlinkProbe()}
                      disabled={probingOrbital}
                      className="px-2.5 py-1.5 rounded-md border bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-blue-500/50 text-[11px] font-mono font-bold cursor-pointer"
                    >
                      Re-Probe Region
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEngageOrbitalFailover(c)}
                      disabled={executingFailover}
                      className="px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-mono font-bold cursor-pointer"
                    >
                      Stream Live Heartbeat
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 02: NEURALINK THOUGHT-TO-CLOUD LIVE DAG EXECUTOR             */}
      {/* =================================================================== */}
      {activeTab === 'NEURALINK_THOUGHT_COMPILER' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span>
                    Neuralink &ldquo;Thought-to-Cloud&rdquo; — Natural-Language Schema Compiler &amp; Live 4-Node DAG Builder
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Type any natural-language sentence below: the compiler dynamically extracts custom BigQuery columns from your words, uploads a real JSON manifest object to GCS, seals a real SecretVersion, streams a live BigQuery row via <code>insertAll</code>, and queries the row back via SQL.
                </p>
              </div>
              {compiledDag?.dagSha256 && (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                  DAG SHA-256: {compiledDag.dagSha256.slice(0, 18)}...
                </span>
              )}
            </div>

            {/* 4 Equal Preset Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {NEURALINK_INTENT_PRESETS.map((preset) => (
                <button
                  key={preset.slug}
                  type="button"
                  onClick={() => {
                    setThoughtPrompt(preset.prompt);
                    setStackSlug(preset.slug);
                    setDagRegion(preset.region);
                    runNeuralinkCompile(preset.prompt, preset.slug, preset.region);
                  }}
                  className={`h-11 px-3 rounded-md border text-left text-xs font-bold transition-all cursor-pointer truncate ${
                    stackSlug === preset.slug
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Natural-Language Architecture Intent (Dynamically Parsed into Columns)
                </label>
                <input
                  type="text"
                  value={thoughtPrompt}
                  onChange={(e) => setThoughtPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Stack Identifier Slug
                </label>
                <input
                  type="text"
                  value={stackSlug}
                  onChange={(e) => setStackSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  Multi-Region Jurisdiction
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={dagRegion}
                    onChange={(e) => setDagRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs font-mono text-zinc-900 dark:text-white"
                  >
                    <option value="US">US (Multi-Region)</option>
                    <option value="EU">EU (GDPR Sovereign)</option>
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      runNeuralinkCompile(thoughtPrompt, stackSlug, dagRegion)
                    }
                    disabled={compilingDag}
                    className="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold shrink-0 cursor-pointer"
                  >
                    Compile
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Prompt-Extracted Schema Columns */}
            {compiledDag?.schemaFields && (
              <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-1.5">
                <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Prompt-Compiled BigQuery Schema Columns ({compiledDag.schemaFields.length} Fields)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {compiledDag.schemaFields.map((f) => (
                    <span
                      key={f.name}
                      className="px-2 py-0.5 rounded-full bg-white dark:bg-zinc-900 border border-blue-500/30 text-[10px] font-mono text-zinc-800 dark:text-zinc-200"
                    >
                      <strong>{f.name}</strong>:{' '}
                      <span className="text-blue-600 dark:text-blue-400">
                        {f.type}
                      </span>{' '}
                      ({f.mode})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 4-Node Compiled DAG Cards */}
            {compiledDag?.dagNodes && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {compiledDag.dagNodes.map((node) => {
                  const receipt = (materializedResult?.nodeReceipts || []).find(
                    (r) => r.nodeId === node.nodeId
                  );
                  return (
                    <div
                      key={node.nodeId}
                      className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/70 flex flex-col justify-between gap-2.5"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-extrabold">
                            NODE {node.step} · {node.kind}
                          </span>
                          {receipt && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full font-mono text-[9.5px] font-bold ${
                                receipt.ok
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {receipt.status} ({receipt.latencyMs}ms)
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white break-all">
                          {node.resourceName}
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          {node.specSummary}
                        </div>
                        {receipt?.detail && (
                          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 pt-1">
                            Live: {receipt.detail}
                          </div>
                        )}
                      </div>
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {node.monthlyCostEstimate}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(node.cliCommand)}
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>CLI</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live BigQuery SQL Read-Back Verification Table */}
            {materializedResult?.queriedRows?.length > 0 && (
              <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                    LIVE BIGQUERY SQL READ-BACK (SELECT * FROM {projectId} LIMIT 5)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                    {materializedResult.queriedRows.length} Live Row(s) Returned from BigQuery Engine
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                  <table className="w-full text-left border-collapse text-[11px] font-mono">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        {Object.keys(materializedResult.queriedRows[0] || {}).map((col) => (
                          <th key={col} className="px-3 py-1.5">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {materializedResult.queriedRows.map((r, idx) => (
                        <tr key={r.event_id || r.row_id || idx}>
                          {Object.keys(materializedResult.queriedRows[0] || {}).map((col) => (
                            <td
                              key={col}
                              className="px-3 py-1.5 text-zinc-800 dark:text-zinc-200 truncate max-w-xs"
                            >
                              {String(r[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Creates the GCS bucket + uploads <code>neuralink-dag-manifest.json</code>, creates the BigQuery dataset + custom-schema table, streams a live row via <code>insertAll</code>, queries it back via SQL, and seals a SecretVersion.
              </div>
              <button
                type="button"
                onClick={handleMaterializeNeuralinkDag}
                disabled={materializingDag}
                className="px-5 py-2.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {materializingDag
                    ? 'Materializing DAG + Streaming BQ Row + Uploading GCS Object...'
                    : `Materialize 4-Node DAG Live on ${projectId}`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 03: OPTIMUS 3-AGENT AUTONOMOUS COUNCIL DEBATE                */}
      {/* =================================================================== */}
      {activeTab === 'OPTIMUS_AUTONOMOUS_COUNCIL' && (
        <div className="space-y-5">
          <form
            onSubmit={handleRunOptimusCouncil}
            className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    Optimus 3-Agent Autonomous Council (FinOps Hawk vs. Zero-Trust Sentinel vs. SRE Reliability Prime)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Convenes 3 specialized autonomous agents over your live project telemetry and synthesizes a signed Consensus Resolution.
                </p>
              </div>
              <button
                type="submit"
                disabled={runningCouncil}
                className="px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {runningCouncil
                    ? 'Convening 3-Agent Council...'
                    : 'Convene Optimus 3-Agent Debate'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {OPTIMUS_DEBATE_TOPICS.map((t, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCouncilTopic(t)}
                  className={`p-2.5 rounded-md border text-left text-[11px] font-medium transition-all cursor-pointer ${
                    councilTopic === t
                      ? 'border-amber-500 bg-amber-500/10 text-zinc-900 dark:text-white font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </form>

          {councilData?.agents && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {councilData.agents.map((ag) => (
                <div
                  key={ag.agentId}
                  className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-extrabold">
                        {ag.verdict}
                      </span>
                      <span className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {ag.score}/100
                      </span>
                    </div>
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
                      {ag.codename}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {ag.focus}
                    </div>
                    <ul className="space-y-1.5 pt-1">
                      {(ag.findings || []).map((f, fIdx) => (
                        <li
                          key={fIdx}
                          className="text-xs text-zinc-700 dark:text-zinc-300 flex items-start gap-2"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono">
                    <code className="truncate text-zinc-500 max-w-[210px]">
                      {ag.recommendedCli}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyText(ag.recommendedCli)}
                      className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      Copy CLI
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {councilData?.consensusMarkdown && (
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold uppercase text-amber-600 dark:text-amber-400">
                  Signed Council Consensus Resolution ({councilData.engineUsed})
                </span>
                <button
                  type="button"
                  onClick={() => copyText(councilData.consensusMarkdown)}
                  className="px-2.5 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Markdown</span>
                </button>
              </div>
              <NeuralinkMarkdownView
                content={councilData.consensusMarkdown}
                onCopy={copyText}
              />
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODULE 04: CRYPTOGRAPHIC Ed25519 BLACK-BOX FLIGHT RECORDER          */}
      {/* =================================================================== */}
      {activeTab === 'CRYPTO_BLACKBOX_LEDGER' && (
        <div className="space-y-5">
          <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  <span>
                    Ed25519 (RFC 8032) Asymmetric Digital Signature & SHA-256 Hash-Chained Black-Box Ledger
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Every block is cryptographically linked to its parent (prevBlockHash -&gt; blockHash) and signed with Node.js crypto.sign(null, blockHash, ed25519PrivateKey).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-extrabold">
                  {ledgerData?.allSignaturesValid
                    ? `ALL ${ledgerData?.chainLength || 0} Ed25519 SIGNATURES VERIFIED`
                    : 'VERIFYING CHAIN...'}
                </span>
                <button
                  type="button"
                  onClick={fetchBlackBoxLedger}
                  disabled={loadingLedger}
                  className="px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer"
                >
                  Re-Verify Signatures
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSealBlackBoxBlock}
              className="flex flex-col sm:flex-row gap-2.5"
            >
              <input
                type="text"
                value={attestationNote}
                onChange={(e) => setAttestationNote(e.target.value)}
                placeholder="Enter compliance attestation note to seal with Ed25519..."
                className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={sealingBlock}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>
                  {sealingBlock
                    ? 'Sealing Live State...'
                    : 'Seal Live Project State Block (Ed25519)'}
                </span>
              </button>
            </form>

            {ledgerData?.publicKeyPem && (
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] font-mono">
                <div className="truncate text-zinc-600 dark:text-zinc-400">
                  <strong className="text-zinc-900 dark:text-white">
                    Active Session Ed25519 Public Key (SPKI PEM):
                  </strong>{' '}
                  {ledgerData.publicKeyPem.replace(/\n/g, ' ')}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyText(JSON.stringify(ledgerData, null, 2))
                  }
                  className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0 hover:underline cursor-pointer"
                >
                  Export Full Signed Ledger JSON
                </button>
              </div>
            )}

            <div className="space-y-2.5">
              {(ledgerData?.blocks || []).map((blk) => (
                <div
                  key={blk.blockId}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-extrabold">
                        BLOCK #{blk.blockIndex} · {blk.eventType}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {blk.summary}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      {blk.verified ? 'Ed25519 VERIFIED' : 'INVALID'} · {blk.timestamp}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 pt-1">
                    <div className="truncate">
                      <strong>prevHash:</strong> {blk.prevBlockHash}
                    </div>
                    <div className="truncate">
                      <strong>blockHash (SHA-256):</strong> {blk.blockHash}
                    </div>
                    <div className="truncate">
                      <strong>Ed25519 Sig:</strong> {blk.ed25519SignatureHex}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
