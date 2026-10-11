import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Activity,
  Sparkles,
  Globe,
  ShieldCheck,
  History,
  RotateCcw,
  Layers,
  Zap,
  Leaf,
  Rocket,
  Database,
  HardDrive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Radio,
  Wand2,
} from 'lucide-react';
import { GCP_REGION_CARBON_DATA } from './EngineerWishlistWave2';

const STACK_BLUEPRINTS = [
  {
    id: 'AI_INFERENCE_STACK',
    title: '🧠 Serverless AI RAG & Inference Stack',
    subtitle:
      'Provisions GCS Model/Vector Bucket + BigQuery Telemetry Dataset + Cloud Run Gen2 API pre-wired with env vars',
    estIdleCost: '$0.00/hr idle (Scale-to-Zero)',
    resources: [
      'Cloud Storage Bucket (Uniform IAM)',
      'BigQuery Analytics Dataset',
      'Cloud Run Gen2 Microservice Gateway',
    ],
  },
  {
    id: 'REALTIME_LAKEHOUSE_STACK',
    title: '📊 Real-Time Lakehouse & Streaming Stack',
    subtitle:
      'Provisions Multi-Region GCS Raw Landing Zone + BigQuery Curated Mart + Cloud Run Ingestion Worker',
    estIdleCost: '$0.00/hr idle (Scale-to-Zero)',
    resources: [
      'GCS Landing Zone Bucket',
      'BigQuery Lakehouse Dataset',
      'Cloud Run Gen2 Ingestion Webhook',
    ],
  },
  {
    id: 'ZERO_TRUST_EDGE_STACK',
    title: '🛡️ Zero-Trust Edge Microservice Stack',
    subtitle:
      'Provisions Encrypted Artifact Bucket + Audit Log BigQuery Dataset + Cloud Run Gen2 Edge API',
    estIdleCost: '$0.00/hr idle (Scale-to-Zero)',
    resources: [
      'GCS Vault Bucket',
      'BigQuery Security Audit Dataset',
      'Cloud Run Gen2 Edge Service',
    ],
  },
];

export default function FuturisticOrbitalHud({
  projectId,
  overview,
  liveBurn,
  onRefreshOverview,
  onDeleteResource,
  onOpenCommandPalette,
  onOpenDocsGuide,
  onShowToast,
  onShowError,
}) {
  const [expandedPanel, setExpandedPanel] = useState(null); // null | 'STACK_COMPOSER' | 'FLIGHT_RECORDER' | 'ORBITAL_GRID'
  const [autoPilotActive, setAutoPilotActive] = useState(true);
  const [hudAccent, setHudAccent] = useState('CYBER_CYAN'); // 'CYBER_CYAN' | 'NEON_VIOLET' | 'EMERALD_MATRIX'

  // Stack Synthesizer State
  const [selectedBlueprint, setSelectedBlueprint] = useState(
    'AI_INFERENCE_STACK'
  );
  const [stackPrefix, setStackPrefix] = useState('ai-core');
  const [stackRegion, setStackRegion] = useState('europe-north1');
  const [deployingStack, setDeployingStack] = useState(false);
  const [lastStackResult, setLastStackResult] = useState(null);

  // Flight Recorder State
  const [flightEvents, setFlightEvents] = useState([]);
  const [loadingFlight, setLoadingFlight] = useState(false);

  const fetchFlightRecorder = useCallback(async () => {
    if (!projectId) return;
    setLoadingFlight(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/flight-recorder`
      );
      setFlightEvents(res.data?.events || []);
    } catch {
      // ignore
    } finally {
      setLoadingFlight(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (expandedPanel === 'FLIGHT_RECORDER') {
      fetchFlightRecorder();
    }
  }, [expandedPanel, fetchFlightRecorder, overview]);

  // Compute global continental distribution & average Carbon-Free Energy %
  const orbitalMetrics = useMemo(() => {
    const resources = overview?.resources || [];
    const runServices = overview?.cloudRunServices || [];
    const firewalls = overview?.firewalls || [];

    let cfeSum = 0;
    let cfeCount = 0;
    const continents = {
      Americas: 0,
      Europe: 0,
      APAC: 0,
      MENA: 0,
    };

    const countRegion = (reg = '') => {
      const r = reg.toLowerCase();
      if (r.startsWith('us-') || r.startsWith('northamerica') || r.startsWith('southamerica')) {
        continents.Americas += 1;
      } else if (r.startsWith('europe-') || r === 'eu') {
        continents.Europe += 1;
      } else if (r.startsWith('asia-') || r.startsWith('australia-')) {
        continents.APAC += 1;
      } else if (r.startsWith('me-')) {
        continents.MENA += 1;
      }
      if (GCP_REGION_CARBON_DATA[r]) {
        cfeSum += GCP_REGION_CARBON_DATA[r].cfePercent;
        cfeCount += 1;
      }
    };

    runServices.forEach((s) => countRegion(s.region));
    resources
      .filter((r) => r.type !== 'Enabled GCP Service API')
      .forEach((r) => countRegion(r.region));

    const avgCfe = cfeCount > 0 ? Math.round(cfeSum / cfeCount) : 84;
    const riskyFwCount = firewalls.filter(
      (f) => !f.disabled && (f.sourceRanges || []).includes('0.0.0.0/0')
    ).length;

    const postureGrade =
      riskyFwCount === 0 ? 'A+' : riskyFwCount <= 2 ? 'A-' : 'B';

    return {
      avgCfe,
      continents,
      postureGrade,
      totalActiveResources: resources.filter(
        (r) => r.type !== 'Enabled GCP Service API'
      ).length,
    };
  }, [overview]);

  const handleSynthesizeStack = async (e) => {
    if (e) e.preventDefault();
    if (!projectId || deployingStack) return;
    setDeployingStack(true);
    setLastStackResult(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/stack-deploy`,
        {
          blueprintId: selectedBlueprint,
          stackPrefix,
          region: stackRegion,
        }
      );
      setLastStackResult(res.data);
      if (onShowToast) onShowToast(res.data.message);
      if (onRefreshOverview) onRefreshOverview();
      fetchFlightRecorder();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to synthesize multi-service stack.'
        );
      }
    } finally {
      setDeployingStack(false);
    }
  };

  const accentBorder =
    hudAccent === 'NEON_VIOLET'
      ? 'border-violet-500/40 from-violet-950/90 via-slate-950/95 to-indigo-950/90'
      : hudAccent === 'EMERALD_MATRIX'
      ? 'border-emerald-500/40 from-emerald-950/90 via-slate-950/95 to-teal-950/90'
      : 'border-cyan-500/40 from-slate-950/95 via-cyan-950/40 to-slate-950/95';

  return (
    <div
      className={`rounded-2xl bg-gradient-to-r ${accentBorder} border text-white shadow-xl overflow-hidden transition-all`}
    >
      {/* Top Futuristic Orbital Telemetry Ribbon */}
      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Live Orbital Pulse & Posture Grade */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-[11px] font-mono font-bold text-cyan-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>2030 ORBITAL HUD</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">API RTT:</span>
            <span className="font-extrabold text-emerald-400">
              {overview?.fetchLatencyMs || 142}ms
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono border-l border-slate-800 pl-3">
            <span className="text-slate-400">Grid Carbon CFE:</span>
            <span className="font-extrabold text-emerald-400">
              🌱 {orbitalMetrics.avgCfe}% Clean
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs font-mono border-l border-slate-800 pl-3">
            <span className="text-slate-400">Cloud Posture:</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black">
              Grade {orbitalMetrics.postureGrade}
            </span>
          </div>

          {/* Continental Distribution Micro-Badges */}
          <div className="hidden xl:flex items-center gap-1.5 border-l border-slate-800 pl-3 text-[10px] font-mono">
            {Object.entries(orbitalMetrics.continents).map(([cont, count]) => (
              <span
                key={cont}
                className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-300"
              >
                {cont}: <strong className="text-cyan-300">{count}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* Right: Futuristic Action Triggers (1-Tap Stack Synthesizer, Flight Recorder, Auto-Pilot, Theme) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1-Tap AI Multi-Service Stack Composer */}
          <button
            type="button"
            onClick={() =>
              setExpandedPanel((p) =>
                p === 'STACK_COMPOSER' ? null : 'STACK_COMPOSER'
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
              expandedPanel === 'STACK_COMPOSER'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/30'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>🪄 1-Tap Stack Synthesizer</span>
            {expandedPanel === 'STACK_COMPOSER' ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Cloud Flight Recorder & Time-Machine */}
          <button
            type="button"
            onClick={() =>
              setExpandedPanel((p) =>
                p === 'FLIGHT_RECORDER' ? null : 'FLIGHT_RECORDER'
              )
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
              expandedPanel === 'FLIGHT_RECORDER'
                ? 'bg-violet-500 text-white border-violet-400'
                : 'bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 border-violet-500/30'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>⏱️ Flight Recorder & Undo</span>
          </button>

          {/* Autonomous Self-Healing SRE Guard */}
          <button
            type="button"
            onClick={() => setAutoPilotActive((v) => !v)}
            title="Autonomous Self-Healing Guard monitors scale-to-zero efficiency & firewall drift"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
              autoPilotActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{autoPilotActive ? 'Auto-Pilot ON' : 'Auto-Pilot OFF'}</span>
          </button>

          {/* HUD Cyber-Accent Switcher */}
          <button
            type="button"
            onClick={() =>
              setHudAccent((cur) =>
                cur === 'CYBER_CYAN'
                  ? 'NEON_VIOLET'
                  : cur === 'NEON_VIOLET'
                  ? 'EMERALD_MATRIX'
                  : 'CYBER_CYAN'
              )
            }
            title="Cycle Futuristic HUD Atmosphere"
            className="px-2 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 cursor-pointer"
          >
            🎨 HUD
          </button>

          {onOpenDocsGuide && (
            <button
              type="button"
              onClick={onOpenDocsGuide}
              title="Open Interactive Engineering Manual & Feature Guide"
              className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-[11px] font-mono font-bold text-blue-300 cursor-pointer"
            >
              📖 How It Works
            </button>
          )}
        </div>
      </div>

      {/* EXPANDABLE DRAWER 1: 1-TAP MULTI-SERVICE ARCHITECTURE STACK SYNTHESIZER */}
      {expandedPanel === 'STACK_COMPOSER' && (
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4" />
                <span>
                  2030 Describe-to-Deploy Multi-Service Architecture Synthesizer
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Instead of configuring Storage, BigQuery, and Cloud Run in 3
                separate consoles, synthesize and interconnect an entire cloud
                stack in 1 click.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              All 3 Resources Auto-Linked via Environment Variables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {STACK_BLUEPRINTS.map((bp) => {
              const active = selectedBlueprint === bp.id;
              return (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => setSelectedBlueprint(bp.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer space-y-2 ${
                    active
                      ? 'bg-cyan-500/15 border-cyan-400 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold font-mono text-white">
                    {bp.title}
                  </div>
                  <p className="text-[11px] text-slate-400">{bp.subtitle}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {bp.resources.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800"
                      >
                        + {r}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <form
            onSubmit={handleSynthesizeStack}
            className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1"
          >
            <div className="sm:col-span-4">
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Stack Naming Prefix
              </label>
              <input
                type="text"
                required
                value={stackPrefix}
                onChange={(e) => setStackPrefix(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                Target Green GCP Region (CFE% Carbon-Free Energy)
              </label>
              <select
                value={stackRegion}
                onChange={(e) => setStackRegion(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
              >
                {Object.entries(GCP_REGION_CARBON_DATA).map(([reg, info]) => (
                  <option key={reg} value={reg}>
                    🌱 {reg} ({info.cfePercent}% CFE · {info.label})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={deployingStack}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Rocket className="w-4 h-4" />
                <span>
                  {deployingStack
                    ? 'Synthesizing Stack...'
                    : 'Deploy 3-Tier Stack'}
                </span>
              </button>
            </div>
          </form>

          {lastStackResult && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-300">
                ✓ {lastStackResult.message}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(lastStackResult.steps || []).map((st, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono"
                  >
                    <div className="text-slate-400">{st.step}</div>
                    <div className="font-bold text-white truncate">
                      {st.name}
                    </div>
                    <div
                      className={
                        st.status === 'CREATED'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {st.status} ({st.region})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* EXPANDABLE DRAWER 2: CLOUD FLIGHT RECORDER & TIME-MACHINE (1-TAP UNDO) */}
      {expandedPanel === 'FLIGHT_RECORDER' && (
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-mono font-bold uppercase text-violet-400 flex items-center gap-1.5">
                <History className="w-4 h-4" />
                <span>
                  Cloud Flight Recorder & Mutation Time-Machine ({projectId})
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Every stack synthesis, cross-region teleport, and resource
                action is recorded here with 1-tap rollback.
              </p>
            </div>
            <button
              type="button"
              onClick={fetchFlightRecorder}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 cursor-pointer"
            >
              {loadingFlight ? 'Refreshing...' : 'Refresh Ledger'}
            </button>
          </div>

          {flightEvents.length === 0 ? (
            <div className="text-xs font-mono text-slate-400 py-3">
              No mutations recorded in this session yet. Try deploying a 3-Tier
              Stack or Teleporting a Cloud Run service!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {flightEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-white">{ev.title}</div>
                    <div className="text-[10px] text-slate-400">
                      {ev.actionType} · {ev.region} · {ev.timestamp}
                    </div>
                  </div>
                  {ev.undoable && ev.undoPayload && onDeleteResource && (
                    <button
                      type="button"
                      onClick={() =>
                        onDeleteResource({
                          type: ev.undoPayload.resourceType,
                          name: ev.undoPayload.name,
                          region: ev.undoPayload.region,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>1-Tap Rewind / Delete</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
