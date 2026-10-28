import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket,
  ShieldCheck,
  Zap,
  Globe,
  Sparkles,
  RefreshCw,
  Play,
  Copy,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Layers,
  Database,
  Activity,
} from 'lucide-react';

const FLIGHT_DECK_TABS = [
  {
    id: 'AUTOPILOT_FSD',
    step: '01',
    title: 'FSD Cloud Autopilot — Automated Drift Reconciler',
    subtitle: '6-Vector Telemetry · Self-Healing Actions · SHA-256 Receipts',
    icon: ShieldCheck,
  },
  {
    id: 'ZERO_GRAVITY_TELEPORTER',
    step: '02',
    title: 'Zero-Gravity Teleporter — Cross-Project Migrator',
    subtitle: 'GCS rewriteTo · BigQuery Copy Jobs · Secret Vault Sync',
    icon: Rocket,
  },
  {
    id: 'LUDICROUS_MEGACAST',
    step: '03',
    title: 'Ludicrous Megacast — 12-Service Parallel MCP Probe',
    subtitle: '12 Concurrent *.googleapis.com/mcp Lanes · Latency Waterfall',
    icon: Zap,
  },
  {
    id: 'FLIGHT_DIRECTOR',
    step: '04',
    title: 'Gemini 3.8 Flash Flight Director — Ops Advisor',
    subtitle: 'Live Telemetry + Developer Knowledge MCP Briefing',
    icon: Sparkles,
  },
];

const MISSION_PRESETS = [
  {
    label: 'Full Autopilot & FinOps Flight Plan',
    brief:
      'Synthesize a complete Zero-Gravity Autopilot Flight Plan, FinOps cost-drag elimination roadmap, and Zero-Trust perimeter hardening commands for my project.',
  },
  {
    label: 'Zero-Trust Perimeter & IAM Shield',
    brief:
      'Analyze open 0.0.0.0/0 firewall rules, Cloud Storage public access prevention, and IAM service accounts, and output prioritized gcloud remediation commands.',
  },
  {
    label: 'Multi-Region Disaster Recovery & Teleport',
    brief:
      'Design a cross-project and cross-region disaster recovery strategy for my BigQuery datasets, Cloud Storage buckets, and Secret Manager vaults.',
  },
  {
    label: 'Serverless Scale-to-Zero & Quota Tuning',
    brief:
      'Evaluate my Cloud Run, Compute Engine, and BigQuery estate for scale-to-zero efficiency and HTTP 429 quota resilience.',
  },
];

function renderInlineNodes(text, keyPrefix = 'inl') {
  if (!text) return null;
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  const parts = String(text).split(tokenRegex);
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

function RoadsterMarkdownView({ content, onCopy }) {
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
                      {renderInlineNodes(item, `li-${keyBase}-${lIdx}`)}
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
                            {renderInlineNodes(h, `th-${keyBase}-${hIdx}`)}
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
                              {renderInlineNodes(
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
                <span>{renderInlineNodes(headingMatch[2], `hd-${sIdx}-${lIdx}`)}</span>
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
              {renderInlineNodes(line, `p-${sIdx}-${lIdx}`)}
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

export default function Wave12RoadsterFlightDeckStudio({
  projectId,
  onShowToast,
  onRefreshOverview,
}) {
  const [activeTab, setActiveTab] = useState('AUTOPILOT_FSD');

  // Module 01: Autopilot FSD State
  const [autopilotData, setAutopilotData] = useState(null);
  const [loadingAutopilot, setLoadingAutopilot] = useState(false);
  const [executingManeuverId, setExecutingManeuverId] = useState(null);

  // Module 02: Zero-Gravity Cross-Project Teleporter State
  const [teleportInventory, setTeleportInventory] = useState(null);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [teleportKind, setTeleportKind] = useState('BIGQUERY_DATASET_CLONE');
  const [destProjectId, setDestProjectId] = useState(projectId || '');
  const [sourceResourceName, setSourceResourceName] = useState('');
  const [destResourceName, setDestResourceName] = useState('');
  const [teleportLocation, setTeleportLocation] = useState('US');
  const [teleporting, setTeleporting] = useState(false);
  const [teleportReceipt, setTeleportReceipt] = useState(null);

  // Module 03: Ludicrous-Mode 12-Way Megacast State
  const [missionQuery, setMissionQuery] = useState(
    'cloud run zero trust autoscaling best practices'
  );
  const [megacastData, setMegacastData] = useState(null);
  const [runningMegacast, setRunningMegacast] = useState(false);

  // Module 04: Flight Director State
  const [missionBrief, setMissionBrief] = useState(MISSION_PRESETS[0].brief);
  const [directorResult, setDirectorResult] = useState(null);
  const [runningDirector, setRunningDirector] = useState(false);

  const notify = useCallback(
    (msg) => {
      if (onShowToast) onShowToast(msg);
    },
    [onShowToast]
  );

  const copyText = useCallback(
    (text) => {
      navigator.clipboard?.writeText(String(text || ''));
      notify('Copied to clipboard');
    },
    [notify]
  );

  const fetchAutopilotRadar = useCallback(async () => {
    if (!projectId) return;
    setLoadingAutopilot(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave12/autopilot-radar`
      );
      setAutopilotData(res.data);
    } catch (err) {
      notify(
        `Autopilot radar warning: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoadingAutopilot(false);
    }
  }, [projectId, notify]);

  const fetchTeleportInventory = useCallback(async () => {
    if (!projectId) return;
    setLoadingInventory(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave12/teleport-inventory`
      );
      setTeleportInventory(res.data);
      const otherProj = (res.data?.activeProjects || []).find(
        (p) => p.projectId !== projectId
      );
      setDestProjectId(otherProj?.projectId || projectId);
      if (res.data?.datasets?.length > 0) {
        setSourceResourceName(res.data.datasets[0].datasetId);
      } else if (res.data?.buckets?.length > 0) {
        setSourceResourceName(res.data.buckets[0].name);
      }
    } catch (err) {
      notify(
        `Teleport inventory notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setLoadingInventory(false);
    }
  }, [projectId, notify]);

  useEffect(() => {
    fetchAutopilotRadar();
    fetchTeleportInventory();
  }, [fetchAutopilotRadar, fetchTeleportInventory]);

  // Keep sourceResourceName synced when switching teleportKind
  useEffect(() => {
    if (!teleportInventory) return;
    if (teleportKind === 'BIGQUERY_DATASET_CLONE') {
      const firstDs = teleportInventory.datasets?.[0]?.datasetId || 'autopilot_flight_deck_2026';
      setSourceResourceName(firstDs);
      setDestResourceName(`${firstDs}_teleported`);
      setTeleportLocation('US');
    } else if (teleportKind === 'GCS_BUCKET_CLONE') {
      const firstBkt = teleportInventory.buckets?.[0]?.name || `${projectId}-autopilot`;
      setSourceResourceName(firstBkt);
      setDestResourceName(
        `${destProjectId || projectId}-teleported-${String(firstBkt).slice(-10)}`.toLowerCase()
      );
      setTeleportLocation('US');
    } else if (teleportKind === 'SECRET_MANAGER_SYNC') {
      const firstSec = teleportInventory.secrets?.[0]?.secretId || 'cloudpulse-autopilot-key';
      setSourceResourceName(firstSec);
      setDestResourceName(`${firstSec}-teleported`);
    }
  }, [teleportKind, teleportInventory, projectId, destProjectId]);

  const handleExecuteManeuver = async (maneuver) => {
    if (!projectId || !maneuver) return;
    setExecutingManeuverId(maneuver.id);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave12/autopilot-execute`,
        {
          maneuverType: maneuver.maneuverType,
          payload: maneuver.payload,
          title: maneuver.title,
          targetResource: maneuver.targetResource,
        }
      );
      if (res.data?.updatedState) {
        setAutopilotData(res.data.updatedState);
      }
      if (onRefreshOverview) onRefreshOverview();
      notify(
        res.data?.receipt?.executionSummary ||
          `Executed Autopilot maneuver: ${maneuver.title}`
      );
    } catch (err) {
      if (err?.message && err.message.includes('cancelled')) return;
      notify(
        `Maneuver failed: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setExecutingManeuverId(null);
    }
  };

  const handleExecuteTeleport = async (e) => {
    if (e) e.preventDefault();
    if (!projectId) return;
    setTeleporting(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave12/cross-project-teleport`,
        {
          teleportKind,
          destProjectId: destProjectId || projectId,
          sourceResourceName,
          destResourceName,
          location: teleportLocation,
        }
      );
      setTeleportReceipt(res.data);
      fetchTeleportInventory();
      if (onRefreshOverview) onRefreshOverview();
      notify(
        `Zero-Gravity Teleport complete (${res.data?.latencyMs || 0}ms): ${
          res.data?.sourceResourceName
        } -> ${res.data?.destProjectId}:${res.data?.destResourceName}`
      );
    } catch (err) {
      if (err?.message && err.message.includes('cancelled')) return;
      notify(
        `Teleport error: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setTeleporting(false);
    }
  };

  const handleRunLudicrousMegacast = useCallback(async () => {
    if (!projectId) return;
    setRunningMegacast(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave12/ludicrous-megacast`,
        { missionQuery }
      );
      setMegacastData(res.data);
      notify(
        `Ludicrous 12-Way Megacast completed in ${res.data?.wallClockMs}ms (${res.data?.speedupMultiplier}x parallel speedup)!`
      );
    } catch (err) {
      notify(
        `Megacast notice: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningMegacast(false);
    }
  }, [projectId, missionQuery, notify]);

  const handleRunFlightDirector = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (!projectId) return;
      setRunningDirector(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/wave12/flight-director`,
          { missionBrief }
        );
        setDirectorResult(res.data);
        notify(`Flight Director Mission Briefing synthesized (${res.data?.latencyMs}ms)`);
      } catch (err) {
        notify(
          `Flight Director notice: ${err.response?.data?.error || err.message}`
        );
      } finally {
        setRunningDirector(false);
      }
    },
    [projectId, missionBrief, notify]
  );

  const inv = autopilotData?.inventorySummary || {};

  return (
    <div className="space-y-5">
      {/* ORBITAL FLIGHT DECK HEADER */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-blue-600 text-white">
                AUTONOMOUS DRIFT &amp; MIGRATION DECK (DRIFT RECONCILER, CROSS-PROJECT MIGRATOR &amp; 12-WAY MCP PROBE)
              </span>
              <span className="px-2.5 py-0.5 rounded-full-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                100% LIVE GCP REST + 12-LANE MCP TELEMETRY
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
              <Rocket className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Autonomous Drift &amp; Migration Deck — Closed-Loop Drift Reconciler, Cross-Project Migrator &amp; 12-Way MCP Probe
              </span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-4xl">
              Continuous closed-loop SRE &amp; FinOps drift remediation with cryptographic{' '}
              <code className="font-mono font-bold">SHA-256</code> state receipts, server-side
              cross-project resource migration over Google&apos;s backbone, and a 12-service
              concurrent <code className="font-mono font-bold">*.googleapis.com/mcp</code> latency
              waterfall.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loadingAutopilot}
              onClick={fetchAutopilotRadar}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 text-xs font-mono font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingAutopilot ? 'animate-spin' : ''}`}
              />
              <span>
                {loadingAutopilot
                  ? 'Sweeping 9 Control Planes...'
                  : 'Sweep Autopilot Radar Live'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Speedometer & Flight Telemetry Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500">Autopilot Flight Readiness</div>
            <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {autopilotData?.flightReadinessScore ?? 92} / 100
            </div>
            <div className="text-[10px] text-zinc-500">
              {autopilotData?.scanWallTimeMs || 0}ms 9-API parallel radar sweep
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500">Self-Healing Maneuvers Queued</div>
            <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {(autopilotData?.maneuvers || []).length} Flight Actions
            </div>
            <div className="text-[10px] text-zinc-500">
              {inv.riskyFirewallsCount || 0} open firewalls · {inv.unhardenedBucketsCount || 0} unhardened buckets
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500">Cross-Project Teleport Targets</div>
            <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {(teleportInventory?.activeProjects || []).length || 1} Active GCP Projects
            </div>
            <div className="text-[10px] text-zinc-500">
              {inv.bucketsCount || 0} buckets · {inv.datasetsCount || 0} BQ datasets · {inv.secretsCount || 0} secrets
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
            <div className="text-zinc-500">Canonical State Merkle Digest</div>
            <div
              className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 truncate"
              title={autopilotData?.stateSha256 || ''}
            >
              SHA-256: {(autopilotData?.stateSha256 || 'calibrating...').slice(0, 18)}...
            </div>
            <div className="text-[10px] text-zinc-500">
              {(autopilotData?.flightReceipts || []).length} verified flight receipts
            </div>
          </div>
        </div>

        {/* 4-Tab Equal-Sized Bento Flight Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {FLIGHT_DECK_TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                data-feature-id={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`p-3 rounded-md border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white/90 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-blue-500/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono font-extrabold truncate flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{t.title}</span>
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 truncate ${
                      active ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {t.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 01: FSD CLOUD AUTOPILOT & CLOSED-LOOP RECONCILER */}
      {activeTab === 'AUTOPILOT_FSD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 5 Cols: 6 Flight Telemetry Vectors */}
          <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  6-VECTOR REAL-TIME FLIGHT TELEMETRY
                </div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Live Aerodynamic &amp; Zero-Trust Hull Vectors
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                Score: {autopilotData?.flightReadinessScore ?? 92}/100
              </span>
            </div>

            <div className="space-y-2.5">
              {(autopilotData?.vectors || []).map((vec) => (
                <div
                  key={vec.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                      {vec.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        vec.status === 'OPTIMAL'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {vec.score}/100 · {vec.status}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        vec.score >= 85
                          ? 'bg-emerald-500'
                          : vec.score >= 60
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, vec.score))}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                    {vec.metric}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 7 Cols: 1-Click Self-Healing Flight Maneuvers & SHA-256 Receipts */}
          <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <div className="text-[10px] font-mono font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                  CLOSED-LOOP SELF-HEALING FLIGHT MANEUVERS
                </div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Autonomous 1-Tap Remediation Queue ({projectId})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Protected by Universal 1-Tap Cost Gatekeeper
              </span>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {(autopilotData?.maneuvers || []).map((man) => {
                const isBusy = executingManeuverId === man.id;
                return (
                  <div
                    key={man.id}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                            man.severity === 'CRITICAL'
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                              : man.severity === 'HIGH'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {man.severity}
                        </span>
                        <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                          {man.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        {man.estimatedMonthlySavingsUsd > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                            Saves ${man.estimatedMonthlySavingsUsd}/mo
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold">
                          +{man.securityGainPts} Posture Pts
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      API: {man.apiEndpoint}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleExecuteManeuver(man)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {isBusy
                            ? 'Executing Autopilot Maneuver...'
                            : 'Engage 1-Tap Autopilot Maneuver'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => copyText(man.cliEquivalent)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy gcloud CLI</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cryptographic SHA-256 Flight Receipts */}
            {(autopilotData?.flightReceipts || []).length > 0 && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                  Verified Closed-Loop SHA-256 Flight Receipts:
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {autopilotData.flightReceipts.map((rc) => (
                    <div
                      key={rc.receiptId}
                      className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                        <span>
                          {rc.maneuverType} &rarr; {rc.targetResource}
                        </span>
                        <span>{rc.latencyMs}ms</span>
                      </div>
                      <div className="text-zinc-700 dark:text-zinc-200">
                        {rc.executionSummary}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        SHA-256 Delta: {rc.beforeSha256?.slice(0, 12)}... &rarr;{' '}
                        {rc.afterSha256?.slice(0, 12)}...
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 02: ZERO-GRAVITY CROSS-PROJECT LIVE TELEPORTER */}
      {activeTab === 'ZERO_GRAVITY_TELEPORTER' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="text-[10px] font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                GOOGLE JUPITER BACKBONE · ZERO LOCAL BANDWIDTH
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Zero-Gravity Cross-Project Live Resource Teleporter
              </h3>
              <p className="text-xs text-zinc-500">
                Clone live BigQuery Datasets + Tables, Cloud Storage Buckets + Objects (
                <code className="font-mono">rewriteTo</code>), or Secret Manager Vaults directly
                between your authenticated GCP projects.
              </p>
            </div>
            <button
              type="button"
              disabled={loadingInventory}
              onClick={fetchTeleportInventory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingInventory ? 'animate-spin' : ''}`}
              />
              <span>Refresh Project Inventory</span>
            </button>
          </div>

          <form onSubmit={handleExecuteTeleport} className="space-y-4">
            {/* 3 Teleport Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'BIGQUERY_DATASET_CLONE',
                  label: 'BigQuery Dataset + Tables Clone',
                  desc: 'Creates destination dataset and runs BigQuery jobs.insert copy jobs across projects.',
                },
                {
                  id: 'GCS_BUCKET_CLONE',
                  label: 'Cloud Storage Bucket + Objects Rewrite',
                  desc: 'Creates destination bucket and rewrites objects directly over Google Jupiter fiber.',
                },
                {
                  id: 'SECRET_MANAGER_SYNC',
                  label: 'Secret Manager Cross-Project Vault Sync',
                  desc: 'Replicates secret container and seals the latest encrypted payload in destination project.',
                },
              ].map((mode) => {
                const active = teleportKind === mode.id;
                return (
                  <div
                    key={mode.id}
                    onClick={() => setTeleportKind(mode.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      active
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60'
                    }`}
                  >
                    <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                      {mode.label}
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-1">{mode.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Source GCP Project
                </label>
                <input
                  type="text"
                  readOnly
                  value={projectId}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Source Resource ({teleportKind.split('_')[0]})
                </label>
                <input
                  type="text"
                  value={sourceResourceName}
                  onChange={(e) => setSourceResourceName(e.target.value)}
                  placeholder="Source dataset / bucket / secret"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Destination GCP Project
                </label>
                <select
                  value={destProjectId}
                  onChange={(e) => setDestProjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                >
                  {(teleportInventory?.activeProjects || [{ projectId }]).map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectId} ({p.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Destination Resource Name
                </label>
                <input
                  type="text"
                  value={destResourceName}
                  onChange={(e) => setDestResourceName(e.target.value)}
                  placeholder="Target dataset / bucket / secret"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-[11px] font-mono text-zinc-500">
                Quick-Pick Discovered Source:{' '}
                {teleportKind === 'BIGQUERY_DATASET_CLONE' &&
                  (teleportInventory?.datasets || []).map((d) => (
                    <button
                      key={d.datasetId}
                      type="button"
                      onClick={() => {
                        setSourceResourceName(d.datasetId);
                        setDestResourceName(`${d.datasetId}_teleported`);
                      }}
                      className="mr-1.5 px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold cursor-pointer"
                    >
                      {d.datasetId}
                    </button>
                  ))}
                {teleportKind === 'GCS_BUCKET_CLONE' &&
                  (teleportInventory?.buckets || []).map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => {
                        setSourceResourceName(b.name);
                        setDestResourceName(
                          `${destProjectId}-teleported-${String(b.name).slice(-8)}`.toLowerCase()
                        );
                      }}
                      className="mr-1.5 px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold cursor-pointer"
                    >
                      gs://{b.name}
                    </button>
                  ))}
                {teleportKind === 'SECRET_MANAGER_SYNC' &&
                  (teleportInventory?.secrets || []).map((s) => (
                    <button
                      key={s.secretId}
                      type="button"
                      onClick={() => {
                        setSourceResourceName(s.secretId);
                        setDestResourceName(`${s.secretId}-teleported`);
                      }}
                      className="mr-1.5 px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold cursor-pointer"
                    >
                      {s.secretId}
                    </button>
                  ))}
              </div>

              <button
                type="submit"
                disabled={teleporting}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>
                  {teleporting
                    ? 'Teleporting Across Google Backbone...'
                    : `Engage Zero-Gravity Teleport (${projectId} -> ${destProjectId})`}
                </span>
              </button>
            </div>
          </form>

          {teleportReceipt && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between font-extrabold text-emerald-700 dark:text-emerald-300">
                <span>
                  ZERO-GRAVITY TELEPORT RECEIPT · {teleportReceipt.teleportKind}
                </span>
                <span>{teleportReceipt.latencyMs}ms</span>
              </div>
              <ul className="space-y-1 text-zinc-700 dark:text-zinc-200">
                {(teleportReceipt.steps || []).map((st, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB 03: LUDICROUS-MODE 12-WAY PARALLEL MCP & REST MEGACAST */}
      {activeTab === 'LUDICROUS_MEGACAST' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="text-[10px] font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                12 CONCURRENT OFFICIAL *.GOOGLEAPIS.COM/MCP LANES
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                12-Service Parallel MCP Probe &amp; Latency Waterfall
              </h3>
              <p className="text-xs text-zinc-500">
                Fires 12 authenticated JSON-RPC 2.0 requests simultaneously across Billing,
                Storage, BigQuery, Compute, Cloud Run, GKE, IAM, Logging, Monitoring,
                Recommender, Resource Manager, and Developer Knowledge MCP servers.
              </p>
            </div>

            <button
              type="button"
              disabled={runningMegacast}
              onClick={handleRunLudicrousMegacast}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {runningMegacast
                  ? 'Firing 12 Concurrent MCP Lanes...'
                  : 'Run 12-Service Parallel MCP Probe'}
              </span>
            </button>
          </div>

          {megacastData && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-500">Ludicrous Parallel Burst</div>
                  <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    {megacastData.wallClockMs}ms Wall Time
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-500">Sequential Equivalent</div>
                  <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    {megacastData.sequentialSumMs}ms Sum
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-500">Sonic-Boom Speedup</div>
                  <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                    {megacastData.speedupMultiplier}x Faster
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-zinc-500">Endpoints Responded</div>
                  <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                    {megacastData.onlineLanes} / {megacastData.totalLanes} Online
                  </div>
                </div>
              </div>

              {/* 12-Lane Waterfall Gantt Matrix */}
              <div className="space-y-2">
                {(megacastData.lanes || []).map((lane) => {
                  const maxMs = Math.max(500, megacastData.wallClockMs || 1000);
                  const widthPct = Math.min(
                    100,
                    Math.max(8, Math.round(((lane.latencyMs || 50) / maxMs) * 100))
                  );
                  return (
                    <div
                      key={lane.laneId}
                      className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1.5 font-mono text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold">
                            {lane.laneId}
                          </span>
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                            {lane.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10.5px]">
                          <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                            {lane.badge}
                          </span>
                          <span className="text-zinc-500">
                            {lane.latencyMs}ms (HTTP {lane.httpStatus})
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            lane.ok ? 'bg-blue-600' : 'bg-zinc-400 dark:bg-zinc-600'
                          }`}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                        {lane.preview}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 04: GEMINI 3.8 FLASH GROUNDED FLIGHT DIRECTOR */}
      {activeTab === 'FLIGHT_DIRECTOR' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
          <div>
            <div className="text-[10px] font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
              VERTEX AI GEMINI 3.8 FLASH + DEVELOPER KNOWLEDGE MCP + AUTOPILOT SHA-256
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              Grounded Flight Director Mission Briefing
            </h3>
            <p className="text-xs text-zinc-500">
              Combines your live 6-vector Autopilot telemetry and official Google Cloud
              documentation into an actionable mission plan.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {MISSION_PRESETS.map((pr) => (
              <button
                key={pr.label}
                type="button"
                onClick={() => setMissionBrief(pr.brief)}
                className="px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10.5px] font-mono font-bold cursor-pointer"
              >
                {pr.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleRunFlightDirector} className="space-y-2.5">
            <textarea
              rows={3}
              value={missionBrief}
              onChange={(e) => setMissionBrief(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-2.5 text-xs font-mono"
            />
            <button
              type="submit"
              disabled={runningDirector}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {runningDirector
                  ? 'Synthesizing Grounded Flight Briefing...'
                  : 'Generate Grounded Flight Director Briefing'}
              </span>
            </button>
          </form>

          {directorResult && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                <span>Engine: {directorResult.engineUsed}</span>
                <span>
                  Latency: {directorResult.latencyMs}ms · SHA-256:{' '}
                  {(directorResult.stateSha256 || '').slice(0, 14)}...
                </span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 max-h-[480px] overflow-y-auto">
                <RoadsterMarkdownView
                  content={directorResult.briefingMarkdown}
                  onCopy={copyText}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
