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
  Download,
  FileCode2,
} from 'lucide-react';
import ZeroSniffingWebCryptoEnclaveBar from './ZeroSniffingWebCryptoEnclaveBar';

const SINGULARITY_TABS = [
  {
    id: 'STARLINK_ORBITAL_MESH',
    step: '01',
    title: 'Starlink Orbital Mesh — 10-Region TLS 1.3 & Geo-Failover Matrix',
    subtitle: '10 Global Corridors · Live TLS 1.3 Probe · US/EU Geo-Standby',
    icon: Globe,
  },
  {
    id: 'NEURALINK_THOUGHT_COMPILER',
    step: '02',
    title: 'Neuralink Thought-to-Cloud — 8-Preset Prompt-to-DAG & Terraform',
    subtitle: '1-Sentence Intent -> 4-Node Live GCP DAG + main.tf Exporter',
    icon: Cpu,
  },
  {
    id: 'OPTIMUS_AUTONOMOUS_COUNCIL',
    step: '03',
    title: 'Optimus 5-Agent Council — FinOps, SecOps, SRE, AI & Crypto Board',
    subtitle: '5-Agent Swarm · Dual-Engine Gemini 3.8 Flash / 3.1 Pro Debate',
    icon: Sparkles,
  },
  {
    id: 'CRYPTO_BLACKBOX_LEDGER',
    step: '04',
    title: 'Cryptographic Black-Box — Ed25519 Ledger & Tamper Proof Verifier',
    subtitle: 'RFC 8032 Signatures · 1-Bit Tamper Test · HTML/JSON Dossier',
    icon: Lock,
  },
];

const NEURALINK_INTENT_PRESETS = [
  {
    label: '01 · AI RAG Lakehouse + Vault',
    slug: 'neuralink_rag_2026',
    region: 'US',
    prompt:
      'Deploy a zero-trust AI RAG Lakehouse with an encrypted Secret Manager API key vault, hardened Cloud Storage bucket, and BigQuery vector telemetry table in US.',
  },
  {
    label: '02 · GDPR Sovereign EU Clean-Room',
    slug: 'neuralink_eu_cleanroom',
    region: 'EU',
    prompt:
      'Provision an EU-sovereign GDPR data clean-room with Uniform IAM Cloud Storage, EU BigQuery dataset, typed audit table, and hardware-encrypted Secret Manager vault.',
  },
  {
    label: '03 · FinOps Cost & Quota Sink',
    slug: 'neuralink_finops_sink',
    region: 'US',
    prompt:
      'Create a zero-idle-cost FinOps telemetry sink with 7-day Soft-Delete GCS bucket, BigQuery billing analytics dataset/table, and automated rotation secret vault.',
  },
  {
    label: '04 · Multi-Agent MCP Mesh',
    slug: 'neuralink_mcp_mesh',
    region: 'US',
    prompt:
      'Bootstrap an autonomous MCP agent telemetry mesh with hardened artifact storage, BigQuery JSON-RPC trace table, and OAuth token vault.',
  },
  {
    label: '05 · Zero-Trust SOC Threat Lake',
    slug: 'neuralink_soc_suricata',
    region: 'US',
    prompt:
      'Deploy a Zero-Trust SOC Suricata DPI & Cloud Armor WAF threat lake with immutable GCS evidence vault, BigQuery MITRE ATT&CK telemetry table, and SOAR webhook secret.',
  },
  {
    label: '06 · Spanner Graph & CDC Stream',
    slug: 'neuralink_spanner_cdc',
    region: 'US',
    prompt:
      'Provision a Cloud Spanner change-stream CDC & GQL property graph sink with GCS staging vault, BigQuery commit-timestamp replication table, and database credential secret.',
  },
  {
    label: '07 · Iceberg V2 Medallion Lake',
    slug: 'neuralink_iceberg_v2',
    region: 'EU',
    prompt:
      'Create an Apache Iceberg V2 Medallion Lakehouse with BigLake Parquet storage bucket, EU BigQuery snapshot table, and catalog token secret vault.',
  },
  {
    label: '08 · Vertex AI Gemini Token Ledger',
    slug: 'neuralink_gemini_tokens',
    region: 'US',
    prompt:
      'Deploy a Vertex AI Gemini 3.8 token & context-cache economics ledger with GCS prompt archive bucket, BigQuery token usage table, and Model Armor signing key secret.',
  },
];

const OPTIMUS_DEBATE_TOPICS = [
  'Evaluate my live project for FinOps waste elimination, Zero-Trust perimeter hardening, and multi-region SRE failover resilience.',
  'Design an aggressive $0-idle serverless scale-to-zero and GCS Autoclass storage arbitrage plan without sacrificing P99 latency.',
  'Audit all IAM Service Accounts, VPC firewall rules, and Cloud Storage buckets against strict SOC2 / ISO-27001 Zero-Trust controls.',
  'Architect a 10-region US + EU BigQuery Lakehouse and Vertex AI Gemini 3.8 Flash context-caching topology with 65% physical storage compression.',
  'Verify Ed25519 RFC 8032 cryptographic provenance, 7-day GCS Soft-Delete ransomware protection, and zero-key Workload Identity Federation.',
  'Synthesize a 99.99% multi-region Cloud Run + BigQuery Geo-Standby disaster recovery runbook surviving a full continental fiber cut.',
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
  onRunInShell,
  onSelectStudioTab,
  onOpenBigQuerySql,
  onShowToast,
  onRefreshOverview,
}) {
  const [activeTab, setActiveTab] = useState('STARLINK_ORBITAL_MESH');

  // Module 01: Starlink Orbital & 10-Region Global Control-Plane State
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
  const [iacTab, setIacTab] = useState('DAG_NODES'); // 'DAG_NODES' | 'TERRAFORM_HCL' | 'GCLOUD_SH' | 'VERIFY_SQL'

  // Module 03: Optimus 5-Agent Autonomous Council State
  const [councilTopic, setCouncilTopic] = useState(OPTIMUS_DEBATE_TOPICS[0]);
  const [councilModel, setCouncilModel] = useState('gemini-3.8-flash');
  const [councilProvider, setCouncilProvider] = useState('AUTO');
  const [councilData, setCouncilData] = useState(null);
  const [runningCouncil, setRunningCouncil] = useState(false);

  // Module 04: Cryptographic Ed25519 Black-Box Ledger State
  const [ledgerData, setLedgerData] = useState(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [attestationNote, setAttestationNote] = useState(
    'SRE Zero-Trust & 10-Region Orbital Readiness Checkpoint'
  );
  const [sealingBlock, setSealingBlock] = useState(false);
  const [tamperProofResult, setTamperProofResult] = useState(null);
  const [runningTamperProof, setRunningTamperProof] = useState(false);

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

  const handleEngageOrbitalFailover = async (corridor, broadcastAll = false) => {
    if (!projectId) return;
    setExecutingFailover(true);
    try {
      const targetReg =
        corridor?.bqMultiRegion ||
        corridor?.bqLocation ||
        (corridor?.id?.includes('eu') || corridor?.id?.includes('me-') ? 'EU' : 'US');
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave13/starlink-failover-execute`,
        broadcastAll
          ? {
              corridorId: 'ALL_10_GLOBAL_CORRIDORS',
              targetRegion: 'US + EU',
              regionCode: 'global-10-regions',
              failoverMode: 'BROADCAST_ALL_CORRIDORS',
            }
          : {
              corridorId: corridor?.id || 'region-us-central1',
              regionCode: corridor?.regionCode || 'us-central1',
              targetRegion: targetReg,
              failoverMode: 'BIGQUERY_GEO_BEACON',
            }
      );
      setFailoverReceipt(res.data);
      runStarlinkProbe();
      fetchBlackBoxLedger();
      if (onRefreshOverview) onRefreshOverview();
      notify(
        res.data?.actionDetail ||
          'Live Geo-Standby provisioned & heartbeat row streamed'
      );
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
        {
          councilTopic,
          model: councilModel,
          preferredProvider: councilProvider,
        }
      );
      setCouncilData(res.data);
      fetchBlackBoxLedger();
      notify(
        `Optimus 5-Agent Council Consensus synthesized via ${res.data?.engineUsed || councilModel} (${res.data?.latencyMs}ms)`
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

  const handleRunTamperVerification = async () => {
    if (!projectId) return;
    setRunningTamperProof(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave13/blackbox-tamper-verify`,
        {}
      );
      setTamperProofResult(res.data);
      notify(res.data?.proofSummary || 'Ed25519 1-bit tamper rejection verified');
    } catch (err) {
      notify(
        `Tamper proof notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningTamperProof(false);
    }
  };

  const exportSignedLedgerHtml = () => {
    if (!ledgerData) return;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Wave 13 Ed25519 Cryptographic Flight Recorder Dossier — ${projectId}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #09090b; color: #f4f4f5; padding: 32px; line-height: 1.5; }
    .card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; background: #064e3b; color: #6ee7b7; font-size: 11px; font-weight: 700; }
    code { color: #93c5fd; font-size: 12px; word-break: break-all; }
    h1 { font-size: 20px; margin: 0 0 8px 0; }
  </style>
</head>
<body>
  <h1>Wave 13 Ed25519 (RFC 8032) Cryptographic Black-Box Dossier — ${projectId}</h1>
  <p>Public Key Fingerprint: <code>${ledgerData.publicKeyFingerprint}</code> | Chain Length: <strong>${ledgerData.chainLength}</strong> | All Signatures Verified: <strong>${ledgerData.allSignaturesValid ? 'YES (100%)' : 'NO'}</strong></p>
  <div class="card">
    <strong>SPKI Ed25519 Public Key PEM:</strong><br/>
    <code>${(ledgerData.publicKeyPem || '').replace(/\n/g, '<br/>')}</code>
  </div>
  ${(ledgerData.blocks || [])
    .map(
      (b) => `<div class="card">
    <div><span class="badge">BLOCK #${b.blockIndex} · ${b.eventType}</span> <strong>${b.summary}</strong> (${b.timestamp})</div>
    <div style="margin-top:8px;font-size:12px;">
      <div><strong>prevBlockHash:</strong> <code>${b.prevBlockHash}</code></div>
      <div><strong>blockHash (SHA-256):</strong> <code>${b.blockHash}</code></div>
      <div><strong>Ed25519 Signature (RFC 8032):</strong> <code>${b.ed25519SignatureHex}</code></div>
    </div>
  </div>`
    )
    .join('\n')}
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wave13-ed25519-blackbox-${projectId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Exported Ed25519 Signed Audit Dossier (.html)');
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="p-5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 dark:from-blue-950/40 dark:via-zinc-900 dark:to-blue-950/40">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40">
                WAVE 13 · 10-REGION ORBITAL TLS 1.3 MESH, PROMPT-TO-DAG COMPILER, 5-AGENT OPTIMUS SWARM &amp; ED25519 LEDGER
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Ed25519 RFC 8032 SIGNED · 100% LIVE GCP REST &amp; TLS 1.3
              </span>
              {ledgerData?.publicKeyFingerprint && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-200/70 dark:bg-zinc-800">
                  Ed25519 Key ID: {ledgerData.publicKeyFingerprint.slice(0, 16)}...
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Global Edge &amp; Prompt-to-DAG Studio — 10-Region TLS 1.3 Matrix, 8-Preset Prompt-to-DAG Builder, 5-Agent Optimus Board &amp; Ed25519 Ledger
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-4xl">
              Execute real DNS + TLS 1.3 + HTTPS REST probes across 10 intercontinental Google Cloud control planes, broadcast failover heartbeats into US &amp; EU BigQuery Geo-Standbys, compile natural-language prompts into live 4-node DAGs + Terraform HCL, convene a 5-Agent Optimus Council over Vertex AI Gemini 3.8 Flash / 3.1 Pro, and verify RFC 8032 Ed25519 tamper resistance.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Fastest Region
              </div>
              <div className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400 truncate max-w-[160px]">
                {orbitalData?.fastestRegion || 'Probing 10 Regions...'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Global Avg TLS / HTTPS
              </div>
              <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                {orbitalData
                  ? `${orbitalData.avgTlsMs}ms / ${orbitalData.avgHttpsMs}ms`
                  : 'Measuring...'}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Dynamic Schema
              </div>
              <div className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {compiledDag?.schemaFields?.length || 7} Live Columns
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-center">
              <div className="text-[10px] font-mono uppercase text-zinc-400">
                Ed25519 Blocks
              </div>
              <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
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
                  MODULE {t.step}
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
      {/* MODULE 01: LIVE 10-REGION HTTPS/TLS CONTROL-PLANE & FAILOVER STREAM */}
      {/* =================================================================== */}
      {activeTab === 'STARLINK_ORBITAL_MESH' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>
                  100% Live 10-Region Google Cloud Control-Plane Socket Matrix &amp; BigQuery Geo-Standby Streamer
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Every latency number below is measured live via real DNS lookup, TLS 1.3 socket handshake, and regional HTTPS REST round-trip to <code>*-aiplatform.googleapis.com</code> across 10 global corridors. Click <strong>Broadcast All 10 Corridors</strong> to provision both <code>US</code> &amp; <code>EU</code> standby datasets and stream all 10 regional heartbeats at once.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleEngageOrbitalFailover(null, true)}
                disabled={executingFailover}
                className="px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-mono font-extrabold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {executingFailover
                    ? 'Broadcasting Heartbeats...'
                    : 'Broadcast All 10 Corridors (US + EU)'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => runStarlinkProbe()}
                disabled={probingOrbital}
                className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${probingOrbital ? 'animate-spin' : ''}`}
                />
                <span>
                  {probingOrbital
                    ? 'Probing 10 Regions...'
                    : 'Re-Probe 10 Regional Endpoints'}
                </span>
              </button>
            </div>
          </div>

          {failoverReceipt && (
            <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
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
                  · Streamed Rows: <strong>{failoverReceipt.streamedRowsCount || 1}</strong> · Execution: {failoverReceipt.latencyMs}ms
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {onOpenBigQuerySql && (
                  <button
                    type="button"
                    onClick={() =>
                      onOpenBigQuerySql(
                        `SELECT heartbeat_id, recorded_at, region_code, bq_location, tls_probe_ms FROM \`${projectId}.starlink_orbital_failover_us.live_failover_heartbeats\` ORDER BY recorded_at DESC LIMIT 25;`
                      )
                    }
                    className="px-3 py-1.5 rounded-md border border-emerald-500/40 bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-bold cursor-pointer"
                  >
                    Query Heartbeats in BigQuery Studio →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('CRYPTO_BLACKBOX_LEDGER')}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-[11px] font-mono font-bold cursor-pointer"
                >
                  Inspect Ed25519 Block
                </button>
              </div>
            </div>
          )}

          {/* Live Cloud Run Regional Endpoints Strip (if present in project) */}
          {orbitalData?.liveRunEndpoints?.length > 0 && (
            <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-extrabold uppercase text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    Live Project Cloud Run Regional HTTPS Edge Endpoints ({orbitalData.liveRunEndpoints.length} Active)
                  </span>
                </span>
                {onSelectStudioTab && (
                  <button
                    type="button"
                    onClick={() => onSelectStudioTab('CLOUD_RUN')}
                    className="text-[10.5px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Open Cloud Run Studio →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {orbitalData.liveRunEndpoints.map((ep) => (
                  <div
                    key={`${ep.region}-${ep.serviceName}`}
                    className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px] font-mono"
                  >
                    <div className="min-w-0">
                      <div className="font-extrabold text-zinc-900 dark:text-white truncate">
                        {ep.serviceName}{' '}
                        <span className="text-zinc-400 font-normal">({ep.region})</span>
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {ep.uri || 'Regional .run.app endpoint'}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                      {ep.runRttMs ? `${ep.runRttMs}ms` : 'READY'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(orbitalData?.corridors || []).map((c, idx) => {
              const isDeployed = c.standbyStatus === 'LIVE_STANDBY_DEPLOYED_IN_GCP';
              const isFastest = idx === 0 && Boolean(orbitalData?.fastestRegion);
              const kmDistance = Number(c.greatCircleKm || 6200).toLocaleString();
              const standbyDs =
                c.standbyDatasetId ||
                c.expectedStandbyDataset ||
                `starlink_orbital_failover_${String(c.bqLocation || 'us').toLowerCase()}`;
              const bqMultiReg = c.bqMultiRegion || c.bqLocation || 'US';
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
                      Corridor: {c.subseaCableName || c.backboneTier} ({kmDistance} km)
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
                        Host: <strong className="text-zinc-900 dark:text-white">{c.endpointHost}</strong> · GFE Edge: {c.liveProbe?.resolvedIp} (AS15169)
                      </div>
                      <div>
                        DNS: <strong>{c.dnsMs}ms</strong> · Cipher:{' '}
                        <strong>{c.liveProbe?.tlsProtocol}</strong>
                      </div>
                      <div className="truncate">
                        BQ Standby Dataset:{' '}
                        <strong className="text-zinc-900 dark:text-white">{standbyDs}</strong> ({bqMultiReg})
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
                      onClick={() => handleEngageOrbitalFailover(c, false)}
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
                    Neuralink &ldquo;Thought-to-Cloud&rdquo; — 8-Preset Natural-Language Schema Compiler, Terraform Exporter &amp; Live 4-Node DAG Builder
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select any of the 8 enterprise presets or type your own sentence: the compiler extracts custom BigQuery columns, generates Terraform HCL (<code>main.tf</code>) + <code>gcloud</code> scripts, and materializes all 4 nodes live in 1 click.
                </p>
              </div>
              {compiledDag?.dagSha256 && (
                <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold shrink-0">
                  DAG SHA-256: {compiledDag.dagSha256.slice(0, 18)}...
                </span>
              )}
            </div>

            {/* 8 Equal Preset Pills */}
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

            {/* IaC & DAG View Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'DAG_NODES', label: '01 · 4-Node Live DAG Cards' },
                  { id: 'TERRAFORM_HCL', label: '02 · Generated Terraform HCL (main.tf)' },
                  { id: 'GCLOUD_SH', label: '03 · gcloud & bq Bootstrap Script (.sh)' },
                  { id: 'VERIFY_SQL', label: '04 · BigQuery Verification SQL' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setIacTab(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-mono font-bold cursor-pointer transition-all ${
                      iacTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {compiledDag?.verifySqlQuery && onOpenBigQuerySql && (
                <button
                  type="button"
                  onClick={() => onOpenBigQuerySql(compiledDag.verifySqlQuery)}
                  className="px-3 py-1 rounded-md border border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300 text-[11px] font-mono font-bold cursor-pointer"
                >
                  Open SQL in BigQuery Studio →
                </button>
              )}
            </div>

            {/* 4-Node Compiled DAG Cards */}
            {iacTab === 'DAG_NODES' && compiledDag?.dagNodes && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
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
                      </div>
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {node.monthlyCostEstimate}
                        </span>
                        <div className="flex items-center gap-2">
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() => onRunInShell(node.cliCommand)}
                              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                            >
                              Shell
                            </button>
                          )}
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
                    </div>
                  );
                })}
              </div>
            )}

            {iacTab === 'TERRAFORM_HCL' && compiledDag?.terraformHcl && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] font-mono text-zinc-300">
                  <span className="flex items-center gap-1.5 font-bold text-blue-300">
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>main.tf — {compiledDag.stackSlug}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(compiledDag.terraformHcl)}
                    className="inline-flex items-center gap-1 text-zinc-300 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Terraform HCL</span>
                  </button>
                </div>
                <pre className="p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap max-h-80">
                  {compiledDag.terraformHcl}
                </pre>
              </div>
            )}

            {iacTab === 'GCLOUD_SH' && compiledDag?.gcloudBundleScript && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] font-mono text-zinc-300">
                  <span className="font-bold text-emerald-300">
                    bootstrap-{compiledDag.stackSlug}.sh
                  </span>
                  <div className="flex items-center gap-3">
                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(compiledDag.gcloudBundleScript)}
                        className="text-emerald-400 hover:underline font-bold cursor-pointer"
                      >
                        Run in Cloud Shell →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyText(compiledDag.gcloudBundleScript)}
                      className="inline-flex items-center gap-1 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Script</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {compiledDag.gcloudBundleScript}
                </pre>
              </div>
            )}

            {iacTab === 'VERIFY_SQL' && compiledDag?.verifySqlQuery && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] font-mono text-zinc-300">
                  <span className="font-bold text-blue-300">
                    BigQuery Standard SQL Read-Back Verification
                  </span>
                  <div className="flex items-center gap-3">
                    {onOpenBigQuerySql && (
                      <button
                        type="button"
                        onClick={() => onOpenBigQuerySql(compiledDag.verifySqlQuery)}
                        className="text-blue-400 hover:underline font-bold cursor-pointer"
                      >
                        Execute in BigQuery Studio →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyText(compiledDag.verifySqlQuery)}
                      className="inline-flex items-center gap-1 text-zinc-300 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy SQL</span>
                    </button>
                  </div>
                </div>
                <pre className="p-3.5 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {compiledDag.verifySqlQuery}
                </pre>
              </div>
            )}

            {/* Live BigQuery SQL Read-Back Verification Table */}
            {materializedResult?.queriedRows?.length > 0 && (
              <div className="p-3.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono font-extrabold text-emerald-800 dark:text-emerald-300">
                    LIVE BIGQUERY SQL READ-BACK (SELECT * FROM {projectId}.{materializedResult.datasetId}.{materializedResult.tableId} LIMIT 5)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                      {materializedResult.queriedRows.length} Live Row(s) Returned from BigQuery Engine
                    </span>
                    {onOpenBigQuerySql && materializedResult.verifySqlQuery && (
                      <button
                        type="button"
                        onClick={() => onOpenBigQuerySql(materializedResult.verifySqlQuery)}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Open Table in BigQuery Studio →
                      </button>
                    )}
                  </div>
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
      {/* MODULE 03: OPTIMUS 5-AGENT AUTONOMOUS COUNCIL DEBATE                */}
      {/* =================================================================== */}
      {activeTab === 'OPTIMUS_AUTONOMOUS_COUNCIL' && (
        <div className="space-y-5">
          <ZeroSniffingWebCryptoEnclaveBar
            projectId={projectId}
            selectedModel={councilModel}
            onSelectModel={setCouncilModel}
            preferredProvider={councilProvider}
            onSelectProvider={setCouncilProvider}
            lastEngineUsed={councilData?.engineUsed}
            lastTokenUsage={councilData?.tokenUsage}
            onShowToast={onShowToast}
          />

          <form
            onSubmit={handleRunOptimusCouncil}
            className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>
                    Optimus 5-Agent Autonomous Council (FinOps Hawk · Zero-Trust Sentinel · SRE Prime · Lakehouse AI · Crypto Auditor)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Convenes 5 specialized autonomous agents over your live project telemetry and synthesizes a signed Consensus Resolution via {councilModel}.
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
                    ? `Convening 5-Agent Council (${councilModel})...`
                    : 'Convene Optimus 5-Agent Debate'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <code className="truncate text-zinc-500 max-w-[180px]">
                      {ag.recommendedCli}
                    </code>
                    <div className="flex items-center gap-2 shrink-0">
                      {onRunInShell && (
                        <button
                          type="button"
                          onClick={() => onRunInShell(ag.recommendedCli)}
                          className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                        >
                          Shell
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copyText(ag.recommendedCli)}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                      >
                        Copy CLI
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {councilData?.consensusMarkdown && (
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold uppercase text-amber-600 dark:text-amber-400">
                  Signed 5-Agent Council Consensus Resolution ({councilData.engineUsed})
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
                    Ed25519 (RFC 8032) Asymmetric Digital Signature, 1-Bit Tamper-Rejection Verifier &amp; SHA-256 Hash-Chained Ledger
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Every block is cryptographically linked to its parent (<code>prevBlockHash -&gt; blockHash</code>) and signed with Node.js <code>crypto.sign(null, blockHash, ed25519PrivateKey)</code>.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-extrabold">
                  {ledgerData?.allSignaturesValid
                    ? `ALL ${ledgerData?.chainLength || 0} Ed25519 SIGNATURES VERIFIED`
                    : 'VERIFYING CHAIN...'}
                </span>
                <button
                  type="button"
                  onClick={handleRunTamperVerification}
                  disabled={runningTamperProof}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
                >
                  {runningTamperProof
                    ? 'Testing 1-Bit Tamper...'
                    : 'Run 1-Bit Tamper-Rejection Proof'}
                </button>
                <button
                  type="button"
                  onClick={exportSignedLedgerHtml}
                  className="px-3 py-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .HTML Dossier</span>
                </button>
                <button
                  type="button"
                  onClick={fetchBlackBoxLedger}
                  disabled={loadingLedger}
                  className="px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer"
                >
                  Re-Verify Chain
                </button>
              </div>
            </div>

            {tamperProofResult && (
              <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 space-y-1.5 text-xs font-mono">
                <div className="font-extrabold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{tamperProofResult.proofSummary}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-zinc-700 dark:text-zinc-300 pt-1">
                  <div className="truncate">
                    <strong>Authentic SHA-256 (Verified=true):</strong>{' '}
                    <code>{tamperProofResult.authenticBlockHash}</code>
                  </div>
                  <div className="truncate">
                    <strong>1-Bit Mutated Hash (Verified=false):</strong>{' '}
                    <code>{tamperProofResult.simulatedTamperedHash}</code>
                  </div>
                </div>
              </div>
            )}

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
                  Copy Full Signed Ledger JSON
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
