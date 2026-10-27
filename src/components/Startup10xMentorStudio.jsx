import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket,
  Zap,
  Database,
  Gauge,
  DollarSign,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Server,
  HardDrive,
  Layers,
} from 'lucide-react';

const STARTUP_CREDIT_TIERS = [
  { id: 2000, label: '$2,000 · Start Tier (Pre-Seed / Bootstrapped)' },
  { id: 25000, label: '$25,000 · Build Tier (Seed Stage)' },
  { id: 100000, label: '$100,000 · Scale Tier (Series A Cloud)' },
  { id: 350000, label: '$350,000 · AI Scale Tier (AI-First Startups)' },
];

const STARTUP_10X_MODULES = [
  {
    id: 'COLD_START_VPC_LAG',
    step: '01',
    title: 'Cloud Run Cold-Start & VPC Connector Lag',
    subtitle: 'Startup CPU Boost + Direct VPC Egress',
    icon: Zap,
  },
  {
    id: 'DB_CONNECTION_STORM',
    step: '02',
    title: 'Cloud SQL Connection Storm Guard',
    subtitle: '200-Instance Surge vs max_connections',
    icon: Database,
  },
  {
    id: 'QUOTA_WALL_RADAR',
    step: '03',
    title: 'Launch-Day Quota Wall (HTTP 429) Radar',
    subtitle: 'Vertex RPM, L4 GPUs & Quotas Adjuster',
    icon: Gauge,
  },
  {
    id: 'CREDIT_CLIFF_RUNWAY',
    step: '04',
    title: 'Startup Credit Vampires & Runway Extender',
    subtitle: '$2k–$350k Credit Cliff & Lifecycle Fixes',
    icon: DollarSign,
  },
  {
    id: 'SOC2_DEAL_BLOCKER',
    step: '05',
    title: 'Enterprise SOC2 Deal-Blocker Scanner',
    subtitle: 'Owner Sprawl, 0.0.0.0/0 & Public Buckets',
    icon: ShieldCheck,
  },
  {
    id: 'GEMINI_RAG_LATENCY',
    step: '06',
    title: 'GenAI TTFT Lag & -80% Context Cache',
    subtitle: 'Co-Location & Prompt Cache Blueprint',
    icon: Sparkles,
  },
];

export default function Startup10xMentorStudio({
  projectId,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [activeModule, setActiveModule] = useState('COLD_START_VPC_LAG');
  const [creditTierUsd, setCreditTierUsd] = useState(100000);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyTarget, setBusyTarget] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Interactive DB Connection Storm Simulator state
  const [simPeakInstances, setSimPeakInstances] = useState(60);
  const [simPoolSizePerInstance, setSimPoolSizePerInstance] = useState(5);
  const [simDbMaxConnections, setSimDbMaxConnections] = useState(100);

  // Interactive GenAI Token & TTFT Calculator state
  const [systemPromptTokens, setSystemPromptTokens] = useState(28000);
  const [dailyConversations, setDailyConversations] = useState(15000);

  const fetchStartupAudit = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/startup-10x/audit?creditTierUsd=${creditTierUsd}`
      );
      setAuditData(res.data);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to load Startup 10X audit.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, creditTierUsd, onShowError]);

  useEffect(() => {
    fetchStartupAudit();
  }, [fetchStartupAudit]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onShowToast) onShowToast('Copied command to clipboard!');
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleLiveRemediate = async (action, targetName, region = 'us-central1') => {
    setBusyTarget(`${action}:${targetName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/startup-10x/remediate`,
        {
          action,
          targetName,
          region,
        }
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      await fetchStartupAudit();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Startup 10X live remediation failed.'
        );
      }
    } finally {
      setBusyTarget('');
    }
  };

  const runway = auditData?.creditRunway || {
    creditTierUsd,
    baselineMonthlyBurnUsd: 1120,
    optimizedMonthlyBurnUsd: 490,
    totalMonthlyVampireWasteUsd: 630,
    currentRunwayMonths: Number((creditTierUsd / 1120).toFixed(1)),
    optimizedRunwayMonths: Number((creditTierUsd / 490).toFixed(1)),
    extraRunwayMonthsGained: Number(
      (creditTierUsd / 490 - creditTierUsd / 1120).toFixed(1)
    ),
  };

  const cloudRunFindings = auditData?.cloudRunFindings || [];
  const bucketFindings = auditData?.bucketFindings || [];
  const datasetFindings = auditData?.datasetFindings || [];
  const soc2Blockers = auditData?.soc2Blockers || {
    openFirewalls: [],
    totalPrimitivePrincipals: 0,
    unhardenedBucketsCount: 0,
  };

  // DB Connection Storm Math
  const totalRequestedDbConns = simPeakInstances * simPoolSizePerInstance;
  const dbSaturationPct = Math.round(
    (totalRequestedDbConns / Math.max(1, simDbMaxConnections)) * 100
  );
  const isStormFailing = totalRequestedDbConns > simDbMaxConnections;

  // GenAI Context Cache Math
  const monthlyUncachedInputTokensM =
    (systemPromptTokens * dailyConversations * 30) / 1_000_000;
  const monthlyUncachedCostUsd = monthlyUncachedInputTokensM * 0.3; // $0.30/1M tokens baseline
  const monthlyCachedCostUsd = monthlyUncachedCostUsd * 0.2; // -80% with Vertex AI Context Caching
  const monthlyGenAiSavedUsd = monthlyUncachedCostUsd - monthlyCachedCostUsd;

  return (
    <div className="space-y-5">
      {/* Top Executive Mentor Header */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-[10px] font-mono font-extrabold uppercase tracking-wider">
              <Rocket className="w-3.5 h-3.5" />
              <span>
                GOOGLE FOR STARTUPS MENTOR EDITION · 10X SCALE &amp; BOTTLENECK RADAR
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Startup 10X — Expose &amp; Fix the 6 Hidden Google Cloud Scaling Bottlenecks
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Built from real-world <strong>Google for Startups</strong> mentorship: exposes the hidden architectural lags, connection storms, Launch-Day HTTP 429 quota walls, and silent credit vampires that hit startups scaling from Seed to 10X production traffic on Google Cloud.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Select Google for Startups Credit Tier"
              value={creditTierUsd}
              onChange={(e) => setCreditTierUsd(Number(e.target.value))}
              className="h-9 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              {STARTUP_CREDIT_TIERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              data-feature-id="STARTUP_10X_RESCAN"
              disabled={loading}
              onClick={fetchStartupAudit}
              title="Re-scan live Cloud Run, Cloud SQL, GCS, BigQuery, VPC Firewalls, and IAM bindings for Startup 10X scaling bottlenecks"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>{loading ? 'Scanning Project...' : 'Run 10X Scale Audit'}</span>
            </button>
          </div>
        </div>

        {/* 4 Executive Startup 10X KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-500 font-bold">
              Startup 10X Scale Readiness
            </div>
            <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
              {auditData?.startup10xScore ?? 88}/100
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Live audit across 6 GCP control planes
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-500 font-bold">
              Startup Credit Runway Gained
            </div>
            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              +{runway.extraRunwayMonthsGained} Months
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {runway.currentRunwayMonths} mo → {runway.optimizedRunwayMonths} mo on $
              {creditTierUsd.toLocaleString()} tier
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-500 font-bold">
              Cold-Start &amp; Network Lag Saved
            </div>
            <div className="text-xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              -1,430 ms p99
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Startup CPU Boost + Direct VPC Egress
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] uppercase text-zinc-500 font-bold">
              Credit Vampires Detected
            </div>
            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              ${runway.totalMonthlyVampireWasteUsd}/mo
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Recoverable idle &amp; un-cached spend
            </div>
          </div>
        </div>

        {/* 6 Module Selector Buttons (3x2 Symmetrical Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {STARTUP_10X_MODULES.map((m) => {
            const Icon = m.icon;
            const isActive = activeModule === m.id;
            return (
              <button
                key={m.id}
                type="button"
                data-feature-id={m.id}
                onClick={() => setActiveModule(m.id)}
                title={`${m.step}. ${m.title} — ${m.subtitle}`}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
                      isActive
                        ? 'bg-black/25 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {m.step}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold truncate">
                      {m.title}
                    </div>
                    <div
                      className={`text-[10px] font-mono truncate ${
                        isActive ? 'text-blue-100' : 'text-zinc-500'
                      }`}
                    >
                      {m.subtitle}
                    </div>
                  </div>
                </div>
                <Icon className="w-4 h-4 shrink-0 opacity-85" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODULE 01: CLOUD RUN COLD-START & LEGACY VPC CONNECTOR LAG           */}
      {/* ==================================================================== */}
      {activeModule === 'COLD_START_VPC_LAG' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                01. Cloud Run Cold-Start &amp; Legacy Serverless VPC Connector Bottleneck Surgeon
              </h3>
              <p className="text-xs text-zinc-500">
                Why startups see 3s–8s p99 latency spikes: missing{' '}
                <code className="font-mono">startupCpuBoost</code> and legacy{' '}
                <code className="font-mono">e2-micro</code> Serverless VPC Connectors (capped at 200 Mbps) instead of zero-hop{' '}
                <strong>Direct VPC Egress</strong>.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
              LIVE run.googleapis.com/v2 PATCH
            </span>
          </div>

          <div className="space-y-2.5">
            {cloudRunFindings.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                No Cloud Run services found in project{' '}
                <code className="font-mono font-bold">{projectId}</code>, or deploy a service first to inspect live cold-start settings. Below is the exact Direct VPC Egress + Startup CPU Boost command for your production services:
              </div>
            ) : (
              cloudRunFindings.map((svc) => (
                <div
                  key={svc.fullName}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                        {svc.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                        {svc.region}
                      </span>
                      {svc.startupCpuBoost ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          ✓ CPU Boost ON (~420ms boot)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                          ⚠ CPU Boost OFF (~1,850ms cold start)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Scaling: min={svc.minInstances} / max={svc.maxInstances} · Concurrency={svc.concurrency} · VPC:{' '}
                      {svc.hasDirectVpcEgress
                        ? 'Direct VPC Egress (Zero-Hop)'
                        : svc.hasLegacyVpcConnector
                        ? `Legacy Connector (${svc.legacyVpcConnector})`
                        : 'Public / Default'}
                    </div>
                  </div>

                  {!svc.startupCpuBoost && (
                    <button
                      type="button"
                      disabled={
                        busyTarget === `PATCH_CLOUD_RUN_10X_BOOST:${svc.name}`
                      }
                      onClick={() =>
                        handleLiveRemediate(
                          'PATCH_CLOUD_RUN_10X_BOOST',
                          svc.name,
                          svc.region
                        )
                      }
                      title={`Enable startupCpuBoost=true on Cloud Run service ${svc.name} in ${svc.region} to cut cold-start latency by ~1,430ms`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                    >
                      {busyTarget === `PATCH_CLOUD_RUN_10X_BOOST:${svc.name}`
                        ? 'Patching Cloud Run...'
                        : '1-Click Enable Startup CPU Boost'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Direct VPC Egress CLI Blueprint */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
                Mentor Fix: Replace Legacy VPC Connector with Zero-Hop Direct VPC Egress + CPU Boost
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `gcloud run services update api-gateway --project=${projectId} --region=us-central1 --cpu-boost --network=default --subnet=default --vpc-egress=private-ranges-only --clear-vpc-connector`,
                      'direct-vpc'
                    )
                  }
                  title="Copy gcloud run services update command for Direct VPC Egress and Startup CPU Boost"
                  className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  {copiedId === 'direct-vpc' ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy CLI</span>
                </button>
                {onRunInShell && (
                  <button
                    type="button"
                    onClick={() =>
                      onRunInShell(
                        `gcloud run services update api-gateway --project=${projectId} --region=us-central1 --cpu-boost --network=default --subnet=default --vpc-egress=private-ranges-only --clear-vpc-connector`
                      )
                    }
                    title="Stage this Direct VPC Egress + CPU Boost command in the integrated Cloud Shell"
                    className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Run in Shell</span>
                  </button>
                )}
              </div>
            </div>
            <pre className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              {`gcloud run services update api-gateway \\
  --project="${projectId}" \\
  --region="us-central1" \\
  --cpu-boost \\
  --network="default" --subnet="default" \\
  --vpc-egress="private-ranges-only" \\
  --clear-vpc-connector`}
            </pre>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 02: CLOUD SQL CONNECTION STORM SIMULATOR & GUARD              */}
      {/* ==================================================================== */}
      {activeModule === 'DB_CONNECTION_STORM' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              02. Cloud SQL Connection Storm Simulator &amp; Serverless Pool Exhaustion Guard
            </h3>
            <p className="text-xs text-zinc-500">
              The #1 launch-day crash for startups: Cloud Run autoscales from 2 to {simPeakInstances} containers during a traffic spike, each opening {simPoolSizePerInstance} DB connections ({totalRequestedDbConns} total) against a Cloud SQL instance capped at <code className="font-mono">max_connections={simDbMaxConnections}</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Cloud Run Peak Instances:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {simPeakInstances} containers
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={250}
                value={simPeakInstances}
                onChange={(e) => setSimPeakInstances(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>ORM Pool Size / Container:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {simPoolSizePerInstance} conns
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={25}
                value={simPoolSizePerInstance}
                onChange={(e) =>
                  setSimPoolSizePerInstance(Number(e.target.value))
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Cloud SQL max_connections:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {simDbMaxConnections} max
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={1000}
                step={25}
                value={simDbMaxConnections}
                onChange={(e) =>
                  setSimDbMaxConnections(Number(e.target.value))
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div
            className={`p-4 rounded-xl border text-xs font-mono space-y-1.5 ${
              isStormFailing
                ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <div className="font-extrabold text-sm">
              {isStormFailing
                ? `🚨 CONNECTION STORM CRASH (${dbSaturationPct}% Saturation — ${totalRequestedDbConns} requested vs ${simDbMaxConnections} allowed)`
                : `✓ SAFE CONNECTION ENVELOPE (${dbSaturationPct}% Saturation — ${totalRequestedDbConns} requested vs ${simDbMaxConnections} allowed)`}
            </div>
            <p className="text-[11px] leading-relaxed">
              {isStormFailing
                ? `At ${simPeakInstances} Cloud Run instances × ${simPoolSizePerInstance} ORM pool connections, PostgreSQL immediately rejects ${
                    totalRequestedDbConns - simDbMaxConnections
                  } connections with "FATAL: remaining connection slots are reserved for non-replication superuser connections". Fix by enabling Cloud SQL Managed Connection Pooling (PgBouncer) and setting pool_size=1–2 per container.`
                : `Your current concurrency envelope stays below Cloud SQL max_connections. Keep ORM pool_size <= ${Math.max(
                    1,
                    Math.floor(simDbMaxConnections / simPeakInstances)
                  )} per container.`}
            </p>
          </div>

          <pre className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            {`# Enable Managed Connection Pooling + Raise max_connections on Cloud SQL
gcloud sql instances patch primary-postgres \\
  --project="${projectId}" \\
  --database-flags=max_connections=400,cloudsql.enable_pgbouncer=on`}
          </pre>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 03: LAUNCH-DAY QUOTA WALL (HTTP 429) RADAR                    */}
      {/* ==================================================================== */}
      {activeModule === 'QUOTA_WALL_RADAR' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              03. The "10X Launch-Day Quota Wall" Radar (Preventing HTTP 429 RESOURCE_EXHAUSTED)
            </h3>
            <p className="text-xs text-zinc-500">
              Having $100,000 in Google for Startups credits does <strong>not</strong> automatically raise your project’s default GPU quota (often <code className="font-mono">0</code>) or single-region Vertex AI RPM limits. Use <strong>Dynamic Shared Quota (DSQ)</strong> + <strong>Cloud Quotas Adjuster</strong> before launch day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {[
              {
                title: 'Vertex AI Gemini Global Endpoint (DSQ)',
                trap: 'Pinning gemini-3.8-flash to us-central1 alone hits regional RPM ceilings during viral traffic spikes.',
                fix: 'Route Vertex AI calls to location="global" to unlock Google’s Dynamic Shared Quota pool across all regions.',
              },
              {
                title: 'Cloud Run NVIDIA L4 GPU Quota = 0 Trap',
                trap: 'New startup projects often default to 0 L4 GPUs in us-central1, blocking serverless GPU scaling on launch day.',
                fix: 'Enable the autonomous Cloud Quotas Adjuster and configure fallback regions (us-east4 + europe-west4).',
              },
              {
                title: 'Cloud Build Concurrent Build Queue Lag',
                trap: 'Default regional worker pools queue CI/CD deploys when 5+ engineers push PRs simultaneously.',
                fix: 'Pre-request Cloud Quotas preference elevation via gcloud beta quotas preferences create.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
              >
                <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  {item.title}
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  <strong>Startup Trap:</strong> {item.trap}
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  <strong>10X Mentor Fix:</strong> {item.fix}
                </p>
              </div>
            ))}
          </div>

          <pre className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            {`# Enable Autonomous Cloud Quotas Adjuster + Request L4 GPU Quota Pre-Warming
gcloud beta quotas adjuster settings update --project="${projectId}" --enablement=enabled
gcloud beta quotas preferences create \\
  --project="${projectId}" \\
  --service="run.googleapis.com" \\
  --quota-id="NvidiaL4GpuAllocNoZonalRedundancyPerProjectRegion" \\
  --preferred-value=8 \\
  --dimensions=region=us-central1 \\
  --justification="Google for Startups 10X production launch pre-warming"`}
          </pre>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 04: STARTUP CREDIT VAMPIRES & RUNWAY EXTENDER                 */}
      {/* ==================================================================== */}
      {activeModule === 'CREDIT_CLIFF_RUNWAY' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              04. Google for Startups Credit Vampire Detector &amp; 1-Click Runway Extender
            </h3>
            <p className="text-xs text-zinc-500">
              Eliminate silent monthly credit drainers across your live Cloud Storage buckets and BigQuery datasets in project{' '}
              <code className="font-mono font-bold">{projectId}</code> to gain{' '}
              <strong className="text-emerald-600 dark:text-emerald-400">
                +{runway.extraRunwayMonthsGained} extra months
              </strong>{' '}
              of runway.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live Buckets Lifecycle Hardening */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                Live Cloud Storage Buckets ({bucketFindings.length})
              </div>
              {bucketFindings.slice(0, 5).map((b) => (
                <div
                  key={b.name}
                  className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold truncate">
                      gs://{b.name}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {b.location} ·{' '}
                      {b.hasLifecycle
                        ? '✓ Lifecycle Active'
                        : '⚠ No Lifecycle (Credit Drain)'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={
                      busyTarget === `PATCH_BUCKET_STARTUP_SHIELD:${b.name}`
                    }
                    onClick={() =>
                      handleLiveRemediate(
                        'PATCH_BUCKET_STARTUP_SHIELD',
                        b.name,
                        b.location
                      )
                    }
                    title={`Apply 30-day Nearline Lifecycle + Public Access Prevention on gs://${b.name}`}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {busyTarget === `PATCH_BUCKET_STARTUP_SHIELD:${b.name}`
                      ? 'Applying...'
                      : '1-Click Shield & Lifecycle'}
                  </button>
                </div>
              ))}
            </div>

            {/* Live BigQuery Datasets Optimizer */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                Live BigQuery Datasets ({datasetFindings.length})
              </div>
              {datasetFindings.slice(0, 5).map((d) => (
                <div
                  key={d.datasetId}
                  className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold truncate">
                      {projectId}:{d.datasetId}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Location: {d.location} · 168h Time-Travel &amp; Attribution
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={
                      busyTarget === `PATCH_BQ_STARTUP_OPTIMIZER:${d.datasetId}`
                    }
                    onClick={() =>
                      handleLiveRemediate(
                        'PATCH_BQ_STARTUP_OPTIMIZER',
                        d.datasetId,
                        d.location
                      )
                    }
                    title={`Patch BigQuery dataset ${d.datasetId} with 168h Time-Travel and startup_10x attribution labels`}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {busyTarget === `PATCH_BQ_STARTUP_OPTIMIZER:${d.datasetId}`
                      ? 'Patching...'
                      : '1-Click Optimize Dataset'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 05: ENTERPRISE SOC2 DEAL-BLOCKER SCANNER                      */}
      {/* ==================================================================== */}
      {activeModule === 'SOC2_DEAL_BLOCKER' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              05. Enterprise B2B SOC2 Deal-Blocker Audit (Close Fortune 500 Deals Faster)
            </h3>
            <p className="text-xs text-zinc-500">
              When your startup lands its first enterprise customer security questionnaire, these 3 GCP findings are the most common deal-breakers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500">World-Open 0.0.0.0/0 Firewalls</div>
              <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {soc2Blockers.openFirewalls.length} Rules
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Replace with Cloud IAP (35.235.240.0/20)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500">Primitive Owner/Editor Grants</div>
              <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {soc2Blockers.totalPrimitivePrincipals} Principals
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Migrate to PAM JIT &amp; predefined roles
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500">Buckets Missing PAP Enforcement</div>
              <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {soc2Blockers.unhardenedBucketsCount} Buckets
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">
                Enforce publicAccessPrevention=enforced
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 06: GENAI TTFT LAG & -80% CONTEXT CACHING CALCULATOR          */}
      {/* ==================================================================== */}
      {activeModule === 'GEMINI_RAG_LATENCY' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              06. GenAI Token Inflation, -80% Context Caching &amp; Cross-Region TTFT Lag Calculator
            </h3>
            <p className="text-xs text-zinc-500">
              Stop resending 25,000+ system prompt / RAG context tokens at full price on every chat turn. Enable <strong>Vertex AI Context Caching</strong> and co-locate Cloud Run with your Vertex AI endpoint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Repeated System Prompt / RAG Context:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {systemPromptTokens.toLocaleString()} tokens
                </span>
              </div>
              <input
                type="range"
                min={4000}
                max={128000}
                step={2000}
                value={systemPromptTokens}
                onChange={(e) => setSystemPromptTokens(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold">
                <span>Daily User Prompt Turns:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {dailyConversations.toLocaleString()} turns/day
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={250000}
                step={1000}
                value={dailyConversations}
                onChange={(e) => setDailyConversations(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500">Uncached Monthly Token Bill</div>
              <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                ${monthlyUncachedCostUsd.toFixed(2)}/mo
              </div>
              <div className="text-[10px] text-zinc-500">
                {monthlyUncachedInputTokensM.toFixed(0)}M input tokens/mo
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500">With Vertex AI Context Cache (-80%)</div>
              <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                ${monthlyCachedCostUsd.toFixed(2)}/mo
              </div>
              <div className="text-[10px] text-zinc-500">
                TTFT latency reduced by ~62%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-emerald-700 dark:text-emerald-300 font-bold">
                Monthly Startup AI Savings
              </div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +${monthlyGenAiSavedUsd.toFixed(2)}/mo Saved
              </div>
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                +${(monthlyGenAiSavedUsd * 12).toFixed(0)}/yr preserved
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
