import React, { useState, useEffect } from 'react';
import {
  Presentation,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Download,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const KEYNOTE_STOPS = [
  {
    id: 'ALLOYDB_EXPRESS',
    durationMin: 2,
    studioTab: 'ALLOYDB_STUDIO',
    title: '1. AlloyDB Express (PG 18) & Zero-Lock-in Enterprise Upgrade',
    headline: 'Start at Scale-to-Zero, Upgrade In-Place to 288 vCPU Enterprise with Zero Downtime',
    talkingPoints: [
      'Show live AlloyDB Express PG 18 provisioning (1 vCPU / 4 GB, auto-storage to 20 GB) + 1-click --no-enable-express in-place upgrade.',
      'Prove zero lock-in live: click "Introspect Live Extensions & Flags" against local AlloyDB Omni Docker (alloydb_scann + vector + columnar).',
    ],
    objectionKiller: 'Q: "Are we locked into Google?" → A: 100% PostgreSQL wire-compatible + live pglogical exit standby + AlloyDB Omni runs anywhere via Docker.',
  },
  {
    id: 'DATA_FABRIC_RAG',
    durationMin: 2,
    studioTab: 'DATA_ENGINEER_STUDIO',
    subTab: 'DATA_FABRIC_MESH',
    title: '2. 6-Engine Data Fabric Mesh & Live 4-Stage RAG Loop',
    headline: 'GCS Document → BigQuery Gemini 4 + 768-d Embed → AlloyDB Omni SCaNN (<5ms Search)',
    talkingPoints: [
      'Show live 6-engine topology + $0.00/GB same-region Data-Gravity Verdict.',
      'Run Stage 1–4 Live RAG Loop and show real PostgreSQL EXPLAIN ANALYZE latency + Gemini 4 grounded answer, then compile to Cloud Workflows YAML.',
    ],
    objectionKiller: 'Q: "Do we need Pinecone/Weaviate?" → A: Zero external vector DB—SCaNN runs natively inside AlloyDB with full ACID transactions.',
  },
  {
    id: 'BQ_GQL_HYBRID',
    durationMin: 2,
    studioTab: 'DATA_ENGINEER_STUDIO',
    subTab: 'BQ_PROPERTY_GRAPH',
    title: '3. BigQuery Property Graph (GQL) + Hybrid Vector Fusion',
    headline: 'Native GoogleSQL GQL Multi-Hop Fraud Detection + Semantic Vector-to-Graph Fusion',
    talkingPoints: [
      'Switch to BigQuery Property Graph (GQL) Workbench → run Multi-Hop 1..3 Fraud Path or Hybrid Vector + Graph Fusion.',
      'Show live auto-rendered Mermaid traversal topology + Gemini 4 NL2GQL.',
    ],
    objectionKiller: 'Q: "Do we need Neo4j?" → A: Native ISO GQL runs directly over your existing BigQuery tables with zero ETL duplication.',
  },
  {
    id: 'BQ_OBSERVABILITY',
    durationMin: 1,
    studioTab: 'BIGQUERY_STUDIO',
    title: '4. BigQuery Observability & Cost-Spike Doctor',
    headline: 'Instant INFORMATION_SCHEMA.JOBS Telemetry + Gemini 4 FinOps Triage',
    talkingPoints: [
      'Open Live Jobs & Slots → click "Scan + Gemini 4 Triage" to surface live billed GB, slot-seconds, queue wait ms, and failing jobs.',
      'Click "Inspect" on any job to jump straight into $0.00 Dry-Run SQL Pre-Crime X-Ray.',
    ],
    objectionKiller: 'Q: "What if analysts lack admin rights?" → A: Auto-falls back to least-privilege JOBS_BY_USER on HTTP 403.',
  },
  {
    id: 'FINOPS_AUTOPILOT',
    durationMin: 1.5,
    studioTab: 'FINOPS',
    title: '5. Autonomous 5-Engine FinOps Autopilot',
    headline: 'BigQuery + Spark + Cloud Logging _Default + Compute + AlloyDB Cost-Kill Matrix',
    talkingPoints: [
      'Show live recoverable $/mo across all 5 engines + 1-click live _Default log exclusion filter ($0.50/GiB saved) + Terraform .tf export.',
    ],
    objectionKiller: 'Q: "Is this read-only reporting?" → A: No—every action has a confirmation modal and executes live against Google Cloud REST APIs.',
  },
  {
    id: 'INCIDENT_SOVEREIGN',
    durationMin: 1.5,
    studioTab: 'SRE_WAR_ROOM',
    title: '6. Agentic War-Room, 10X SCC v2 / Zero-Org Vulnerability Control & Sovereign Blueprint',
    headline: 'Gemini 4 Incident Commander + 4-Engine Zero-Org Attack-Path Topology + Sovereign DORA/GDPR Dossier',
    talkingPoints: [
      'Correlate live Cloud Logging errors, failed BigQuery jobs, and Cloud Run revision drift into a single Gemini 4 SITREP.',
      'Run 10X Security Command Center v2 / 4-Engine Zero-Org Vulnerability Mission Control (OS Config VM CVEs + Artifact Registry + VPC 0.0.0.0/0 + GCS/IAM), expand the 3-Layer Attack-Path Topology, and click AI Fix (Vertex AI gemini-4-neon).',
      'Switch to Sovereign Studio to export the board-ready DORA/GDPR Dossier (.md) and Terraform CMEK bundle (.tf).',
    ],
    objectionKiller: 'Q: "Does this pass European CISO review?" → A: Live 5-control CMEK/PAP/UBLA/IAM/Residency audit with zero hardcoded secrets.',
  },
];

export default function KeynoteAutopilotModal({
  isOpen,
  onClose,
  projectId,
  onNavigateTab,
  onShowToast,
}) {
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!isOpen) return undefined;
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        setStepIdx((i) => Math.min(KEYNOTE_STOPS.length - 1, i + 1));
      }
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        setStepIdx((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const stop = KEYNOTE_STOPS[stepIdx];
  const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const secs = String(elapsedSec % 60).padStart(2, '0');

  const exportScript = () => {
    const md = [
      `# CloudPulse 2026 — 10-Minute Executive Live Keynote Script`,
      `Project: \`${projectId || 'dynamic'}\``,
      '',
      ...KEYNOTE_STOPS.map(
        (s) =>
          `## ${s.title} (${s.durationMin} min)\n**${s.headline}**\n${s.talkingPoints
            .map((p) => `- ${p}`)
            .join('\n')}\n> ${s.objectionKiller}\n`
      ),
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudpulse-keynote-autopilot-${projectId || 'demo'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast?.('Exported 10-Minute Keynote Script (.md)');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl rounded-2xl border border-amber-500/40 bg-white dark:bg-[#10141d] shadow-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Presentation className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Platform-Wide Keynote Autopilot (6-Studio Live Director)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-xs font-mono font-bold inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {mins}:{secs}
            </span>
            <button
              type="button"
              onClick={exportScript}
              className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export .md
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 6 Stop Pills */}
        <div className="px-5 pt-3 flex flex-wrap gap-1.5">
          {KEYNOTE_STOPS.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStepIdx(idx)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                idx === stepIdx
                  ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {idx + 1}. {s.id.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Active Beat Card */}
        <div className="p-5 space-y-3.5">
          <div className="space-y-1">
            <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
              STOP {stepIdx + 1} OF {KEYNOTE_STOPS.length} · ~{stop.durationMin} MIN · SHORTCUTS: Alt+← / Alt+→
            </div>
            <h4 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">{stop.title}</h4>
            <div className="text-xs font-bold text-zinc-600 dark:text-zinc-300">{stop.headline}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
            <div className="font-mono font-bold text-zinc-500 uppercase text-[10.5px]">
              Presenter Teleprompter &amp; Live Click Path
            </div>
            {stop.talkingPoints.map((pt, i) => (
              <div key={i} className="flex items-start gap-2 text-zinc-800 dark:text-zinc-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-900 dark:text-amber-200">
            <strong>Executive Q&amp;A Objection Killer:</strong> {stop.objectionKiller}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={stepIdx === 0}
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </button>
              <button
                type="button"
                disabled={stepIdx === KEYNOTE_STOPS.length - 1}
                onClick={() => setStepIdx((i) => Math.min(KEYNOTE_STOPS.length - 1, i + 1))}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 disabled:opacity-40 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1 cursor-pointer"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              {stop.id === 'INCIDENT_SOVEREIGN' && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigateTab?.('SOVEREIGN_STUDIO');
                    onClose?.();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  Open Sovereign Studio →
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onNavigateTab?.(stop.studioTab, stop.subTab || null);
                  onClose?.();
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                Jump to Live Studio →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
