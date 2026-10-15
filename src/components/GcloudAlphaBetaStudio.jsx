import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Terminal,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Cpu,
  Globe,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Play,
  KeyRound,
  Radar,
  Server,
  FileCode2,
  Sparkles,
} from 'lucide-react';

export function ReleaseTrackBadge({ track = 'ALPHA' }) {
  const normalized = String(track || 'ALPHA').toUpperCase();
  if (normalized === 'BETA') {
    return (
      <span
        title="Google Cloud BETA Track (gcloud beta / v1beta): Public Preview capability undergoing final stabilization before GA."
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>[BETA · PUBLIC PREVIEW]</span>
      </span>
    );
  }
  if (normalized === 'ALPHA_AND_BETA') {
    return (
      <span
        title="Combined Google Cloud ALPHA + BETA Track (gcloud alpha + gcloud beta)"
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40 shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
        <span>[ALPHA + BETA PRE-GA]</span>
      </span>
    );
  }
  return (
    <span
      title="Google Cloud ALPHA Track (gcloud alpha / v1alpha): Early Access Preview with no SLA; flags and schemas may evolve without notice."
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-extrabold uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/40 shrink-0"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
      <span>[ALPHA · EARLY ACCESS]</span>
    </span>
  );
}

const STUDIO_TABS = [
  {
    id: 'BETA_CLOUD_RUN',
    track: 'BETA',
    shortLabel: '[BETA] Cloud Run 4-Primitive Lab',
    subtitle: 'worker-pools · multi-region-services · compose · instances',
    icon: Server,
  },
  {
    id: 'ALPHA_AGENT_MCP',
    track: 'ALPHA',
    shortLabel: '[ALPHA] Agent Registry & MCP Control Plane',
    subtitle: 'agent-registry mcp-servers · agents · skills · agent-identity',
    icon: Cpu,
  },
  {
    id: 'ALPHA_PAM_TROUBLESHOOT',
    track: 'ALPHA',
    shortLabel: '[ALPHA] PAM JIT IAM & 403 Troubleshooter',
    subtitle: 'gcloud alpha pam · gcloud alpha policy-troubleshoot iam',
    icon: KeyRound,
  },
  {
    id: 'ALPHA_HEALTH_FAULT',
    track: 'ALPHA',
    shortLabel: '[ALPHA] Service Health & Chaos Fault-Testing',
    subtitle: 'gcloud alpha service-health · gcloud alpha fault-testing',
    icon: Radar,
  },
  {
    id: 'ALPHA_BETA_PLATFORM',
    track: 'ALPHA_AND_BETA',
    shortLabel: '[BETA/ALPHA] App Optimize, Location Finder & TF Vet',
    subtitle: 'beta app-optimize · alpha cloudlocationfinder · alpha terraform vet',
    icon: Layers,
  },
];

export default function GcloudAlphaBetaStudio({
  projectId,
  onShowToast,
  onOpenShellWithCommand,
}) {
  const [activeSubTab, setActiveSubTab] = useState('BETA_CLOUD_RUN');
  const [trackFilter, setTrackFilter] = useState('ALL');
  const [region, setRegion] = useState('us-central1');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [actionRunning, setActionRunning] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);

  // Form states for Wave 1 Alpha/Beta actions
  const [workerPoolName, setWorkerPoolName] = useState('cp-kafka-worker-pool');
  const [workerImage, setWorkerImage] = useState(
    'us-docker.pkg.dev/cloudrun/container/hello:latest'
  );
  const [workerInstances, setWorkerInstances] = useState(1);
  const [multiRegionName, setMultiRegionName] = useState('cp-global-edge-svc');
  const [multiRegionsInput, setMultiRegionsInput] = useState(
    'us-central1,europe-west1,asia-east1'
  );
  const [composeServiceName, setComposeServiceName] =
    useState('cp-compose-gateway');

  const [troubleshootPrincipal, setTroubleshootPrincipal] = useState('');
  const [troubleshootPermission, setTroubleshootPermission] = useState(
    'run.services.create'
  );
  const [troubleshootResource, setTroubleshootResource] = useState('');

  const [pamEntitlementId, setPamEntitlementId] = useState('jit-sre-responder');
  const [pamRole, setPamRole] = useState('roles/run.admin');
  const [pamDurationSeconds, setPamDurationSeconds] = useState(3600);
  const [pamJustification, setPamJustification] = useState(
    'Emergency incident response via CloudPulse 2026 JIT elevation'
  );

  const notify = useCallback(
    (msg) => {
      if (typeof onShowToast === 'function') onShowToast(msg);
    },
    [onShowToast]
  );

  const fetchOverview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/alpha-beta/overview`,
        { params: { region } }
      );
      setOverview(res.data);
      if (
        !troubleshootPrincipal &&
        res.data?.alphaZeroStandingIam?.serviceAccounts?.[0]?.email
      ) {
        setTroubleshootPrincipal(
          res.data.alphaZeroStandingIam.serviceAccounts[0].email
        );
      }
      if (!troubleshootResource) {
        setTroubleshootResource(
          `//cloudresourcemanager.googleapis.com/projects/${projectId}`
        );
      }
    } catch (err) {
      notify(
        err.response?.data?.error ||
          err.message ||
          'Failed to load gcloud Alpha/Beta overview'
      );
    } finally {
      setLoading(false);
    }
  }, [projectId, region, notify, troubleshootPrincipal, troubleshootResource]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const executeAlphaBetaAction = async (actionKey, payload = {}) => {
    if (!projectId) return;
    setActionRunning(actionKey);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alpha-beta/action`,
        {
          action: actionKey,
          region,
          ...payload,
        }
      );
      setLastReceipt({
        actionKey,
        timestamp: new Date().toLocaleTimeString(),
        ...res.data,
      });
      notify(
        `${res.data?.releaseBadge || '[ALPHA/BETA]'} executed (${
          res.data?.durationMs || 0
        }ms)`
      );
      fetchOverview();
    } catch (err) {
      notify(
        err.response?.data?.error ||
          err.message ||
          `Failed to execute ${actionKey}`
      );
    } finally {
      setActionRunning('');
    }
  };

  const copyText = (txt, label = 'CLI command') => {
    navigator.clipboard.writeText(txt);
    notify(`Copied ${label} to clipboard`);
  };

  const visibleTabs = STUDIO_TABS.filter((t) => {
    if (trackFilter === 'ALL') return true;
    if (trackFilter === 'BETA')
      return t.track === 'BETA' || t.track === 'ALPHA_AND_BETA';
    if (trackFilter === 'ALPHA')
      return t.track === 'ALPHA' || t.track === 'ALPHA_AND_BETA';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Pre-GA Release Channel Disclosure & SDK Version Banner */}
      <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-extrabold">
                <Terminal className="w-3.5 h-3.5" />
                <span>
                  GCLOUD {overview?.sdk?.coreVersion || '588.0.0'} FRONTIER LAB
                  (WAVE 1)
                </span>
              </span>
              <ReleaseTrackBadge track="BETA" />
              <ReleaseTrackBadge track="ALPHA" />
              <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                alpha={overview?.sdk?.alphaVersion || '2026.10.02'} · beta=
                {overview?.sdk?.betaVersion || '2026.10.02'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Pre-GA Google Cloud [ALPHA] &amp; [BETA] Underground Capabilities
              — Explicit Release-Track Flagging
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Every feature below is explicitly badged with{' '}
              <strong className="text-amber-600 dark:text-amber-400 font-mono">
                [BETA · PUBLIC PREVIEW]
              </strong>{' '}
              (feature-complete pre-GA commands under{' '}
              <code className="font-mono">gcloud beta</code>) or{' '}
              <strong className="text-rose-600 dark:text-rose-400 font-mono">
                [ALPHA · EARLY ACCESS]
              </strong>{' '}
              (experimental commands under{' '}
              <code className="font-mono">gcloud alpha</code> /{' '}
              <code className="font-mono">v1alpha</code> that carry no SLA and
              may change flags or schemas without notice).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200"
              title="Select target GCP Region for gcloud alpha/beta operations"
            >
              <option value="us-central1">us-central1 (Iowa)</option>
              <option value="us-east1">us-east1 (S. Carolina)</option>
              <option value="us-west1">us-west1 (Oregon)</option>
              <option value="europe-west1">europe-west1 (Belgium)</option>
              <option value="europe-west4">europe-west4 (Netherlands)</option>
              <option value="asia-east1">asia-east1 (Taiwan)</option>
              <option value="asia-northeast1">asia-northeast1 (Tokyo)</option>
            </select>

            <button
              type="button"
              onClick={fetchOverview}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3.5 py-2 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh Alpha/Beta Telemetry</span>
            </button>
          </div>
        </div>

        {/* Release Track Filter Bar */}
        <div className="mt-3 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400 mr-1">
              Filter by Release Track:
            </span>
            {[
              { id: 'ALL', label: 'ALL TRACKS (ALPHA + BETA)' },
              { id: 'BETA', label: '[BETA] PUBLIC PREVIEW ONLY' },
              { id: 'ALPHA', label: '[ALPHA] EARLY ACCESS ONLY' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTrackFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  trackFilter === f.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-white/80 dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
            Active Project: <strong className="text-zinc-900 dark:text-zinc-100">{projectId}</strong> · Region: <strong className="text-zinc-900 dark:text-zinc-100">{region}</strong>
          </div>
        </div>
      </div>

      {/* Sub-Tab Switcher with Explicit [BETA] and [ALPHA] Flags */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isActive
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md'
                  : 'bg-white dark:bg-[#18181b] text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <Icon className="w-4 h-4 shrink-0 opacity-80" />
                <ReleaseTrackBadge track={tab.track} />
              </div>
              <div>
                <div className="text-xs font-extrabold leading-snug">
                  {tab.shortLabel}
                </div>
                <div
                  className={`text-[10px] font-mono mt-0.5 truncate ${
                    isActive
                      ? 'text-zinc-300 dark:text-zinc-600'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {tab.subtitle}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* TAB 1: [BETA] CLOUD RUN 4-PRIMITIVE LAB */}
      {activeSubTab === 'BETA_CLOUD_RUN' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: [BETA] Cloud Run Worker Pools */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                01 · NON-HTTP PULL WORKERS
              </span>
              <ReleaseTrackBadge track="BETA" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              [BETA] Cloud Run Worker Pools (
              <code className="font-mono text-xs">
                gcloud beta run worker-pools
              </code>
              )
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Run continuous background pull consumers (Kafka, Pub/Sub, Redis
              Streams, RabbitMQ) on Cloud Run without opening a dummy HTTP{' '}
              <code className="font-mono">$PORT</code> listener.
            </p>

            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={workerPoolName}
                onChange={(e) => setWorkerPoolName(e.target.value)}
                placeholder="Worker pool name (e.g. cp-kafka-worker-pool)"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
              />
              <input
                type="text"
                value={workerImage}
                onChange={(e) => setWorkerImage(e.target.value)}
                placeholder="Container image URI"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
              />
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-mono text-zinc-500">
                  Worker Instances:
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={workerInstances}
                  onChange={(e) => setWorkerInstances(Number(e.target.value))}
                  className="w-20 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 break-all">
              gcloud beta run worker-pools deploy {workerPoolName} --project=
              {projectId} --region={region} --image={workerImage} --instances=
              {workerInstances}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={actionRunning === 'DEPLOY_BETA_WORKER_POOL'}
                onClick={() =>
                  executeAlphaBetaAction('DEPLOY_BETA_WORKER_POOL', {
                    workerPoolName,
                    image: workerImage,
                    instances: workerInstances,
                  })
                }
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {actionRunning === 'DEPLOY_BETA_WORKER_POOL'
                    ? 'Running [BETA]...'
                    : '[BETA] Deploy Worker Pool'}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    `gcloud beta run worker-pools deploy ${workerPoolName} --project=${projectId} --region=${region} --image=${workerImage} --instances=${workerInstances}`,
                    '[BETA] worker-pools deploy CLI'
                  )
                }
                className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                title="Copy [BETA] CLI command"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-zinc-500">
              Discovered Worker Pools in {region}:{' '}
              <strong>
                {overview?.betaCloudRun?.workerPools?.length || 0}
              </strong>
            </div>
          </div>

          {/* Card 2: [BETA] Multi-Region Cloud Run Services */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                02 · MULTI-CONTINENT ACTIVE-ACTIVE
              </span>
              <ReleaseTrackBadge track="BETA" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              [BETA] Multi-Region Services (
              <code className="font-mono text-xs">
                gcloud beta run multi-region-services
              </code>
              )
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Deploy and manage a single logical Cloud Run service replicated
              across multiple continents with unified{' '}
              <code className="font-mono">run.googleapis.com/regions</code>{' '}
              annotations.
            </p>

            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={multiRegionName}
                onChange={(e) => setMultiRegionName(e.target.value)}
                placeholder="Multi-region service name"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
              />
              <input
                type="text"
                value={multiRegionsInput}
                onChange={(e) => setMultiRegionsInput(e.target.value)}
                placeholder="Comma-separated regions (us-central1,europe-west1)"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 break-all">
              gcloud beta run multi-region-services list --project={projectId}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={actionRunning === 'DEPLOY_BETA_MULTI_REGION_SERVICE'}
                onClick={() =>
                  executeAlphaBetaAction('DEPLOY_BETA_MULTI_REGION_SERVICE', {
                    multiRegionName,
                    image: workerImage,
                    regions: multiRegionsInput
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>
                  {actionRunning === 'DEPLOY_BETA_MULTI_REGION_SERVICE'
                    ? 'Probing [BETA]...'
                    : '[BETA] Probe & Synthesize Multi-Region'}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    `gcloud beta run multi-region-services list --project=${projectId}`,
                    '[BETA] multi-region-services CLI'
                  )
                }
                className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-[11px] font-mono text-zinc-500">
              Discovered Multi-Region Services:{' '}
              <strong>
                {overview?.betaCloudRun?.multiRegionServices?.length || 0}
              </strong>
            </div>
          </div>

          {/* Card 3: [BETA] Cloud Run Instances & Docker Compose Bridge */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                03 · LIVE INSTANCES &amp; COMPOSE UP
              </span>
              <ReleaseTrackBadge track="BETA" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              [BETA] Direct Instance Control &amp; Compose (
              <code className="font-mono text-xs">
                gcloud beta run instances / compose
              </code>
              )
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Inspect, SSH, or restart individual container instances via{' '}
              <code className="font-mono">gcloud beta run instances</code>, or
              deploy a <code className="font-mono">docker-compose.yaml</code>{' '}
              straight to Cloud Run via{' '}
              <code className="font-mono">gcloud beta run compose up</code>.
            </p>

            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={composeServiceName}
                onChange={(e) => setComposeServiceName(e.target.value)}
                placeholder="Compose service name"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 break-all">
              gcloud beta run instances list --project={projectId} --region=
              {region}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={actionRunning === 'INSPECT_BETA_RUN_INSTANCES'}
                onClick={() =>
                  executeAlphaBetaAction('INSPECT_BETA_RUN_INSTANCES', {
                    composeServiceName,
                    image: workerImage,
                  })
                }
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>
                  {actionRunning === 'INSPECT_BETA_RUN_INSTANCES'
                    ? 'Inspecting [BETA]...'
                    : '[BETA] List Instances & Compose Spec'}
                </span>
              </button>
              {typeof onOpenShellWithCommand === 'function' && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenShellWithCommand(
                      `gcloud beta run instances list --project=${projectId} --region=${region}`
                    )
                  }
                  className="px-2.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-mono font-semibold cursor-pointer"
                  title="Run in Cloud Shell"
                >
                  $ Shell
                </button>
              )}
            </div>

            <div className="text-[11px] font-mono text-zinc-500">
              Active Cloud Run Services in Project:{' '}
              <strong>
                {overview?.betaCloudRun?.existingServices?.length || 0}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: [ALPHA] AGENT REGISTRY (MCP SERVERS & SKILLS) & AGENT IDENTITY */}
      {activeSubTab === 'ALPHA_AGENT_MCP' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ReleaseTrackBadge track="ALPHA" />
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  agentregistry.googleapis.com/v1alpha ·
                  agentidentity.googleapis.com/v1alpha
                </span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                [ALPHA] Google Cloud Agent Registry (MCP Servers, Agents,
                Skills) &amp; Agent Identity Access Audit
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Probes Google Cloud&apos;s brand-new 2026{' '}
                <code className="font-mono">gcloud alpha agent-registry</code>{' '}
                and{' '}
                <code className="font-mono">gcloud alpha agent-identity</code>{' '}
                control planes for Model Context Protocol (MCP) servers,
                autonomous agents, skills, and identity access events.
              </p>
            </div>

            <button
              type="button"
              disabled={actionRunning === 'SCAN_ALPHA_AGENT_REGISTRY'}
              onClick={() =>
                executeAlphaBetaAction('SCAN_ALPHA_AGENT_REGISTRY')
              }
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 text-xs font-mono font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {actionRunning === 'SCAN_ALPHA_AGENT_REGISTRY'
                  ? 'Running 4-Way [ALPHA] Agent & MCP Scan...'
                  : '[ALPHA] Run Live 4-Way Agent & MCP Registry Probe'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(overview?.alphaAgenticMcp?.capabilities || []).map((cap) => (
              <div
                key={cap.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {cap.id}
                  </span>
                  <ReleaseTrackBadge track="ALPHA" />
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {cap.description}
                </p>
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[10.5px] text-zinc-700 dark:text-zinc-300 break-all">
                  {cap.command}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(cap.command, `[ALPHA] ${cap.id}`)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy [ALPHA] CLI</span>
                  </button>
                  {typeof onOpenShellWithCommand === 'function' && (
                    <button
                      type="button"
                      onClick={() => onOpenShellWithCommand(cap.command)}
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      <Terminal className="w-3 h-3" />
                      <span>Run in Cloud Shell</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: [ALPHA] PAM JIT IAM & 403 POLICY TROUBLESHOOTER */}
      {activeSubTab === 'ALPHA_PAM_TROUBLESHOOT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: [ALPHA] IAM Policy Troubleshooter */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                policytroubleshooter.googleapis.com/v1
              </span>
              <ReleaseTrackBadge track="ALPHA" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              [ALPHA] Live 403 IAM Policy Troubleshooter (
              <code className="font-mono text-xs">
                gcloud alpha policy-troubleshoot iam
              </code>
              )
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Evaluates why a principal is granted or denied a specific GCP
              permission on a target resource across project, folder, and
              organization bindings.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-zinc-500">
                Principal Email (User or Service Account):
              </label>
              <input
                type="text"
                value={troubleshootPrincipal}
                onChange={(e) => setTroubleshootPrincipal(e.target.value)}
                placeholder="e.g. my-sa@project.iam.gserviceaccount.com"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
              />
              <label className="block text-[11px] font-mono text-zinc-500">
                Permission to Test:
              </label>
              <input
                type="text"
                value={troubleshootPermission}
                onChange={(e) => setTroubleshootPermission(e.target.value)}
                placeholder="e.g. run.services.create or storage.objects.get"
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
              />
              <label className="block text-[11px] font-mono text-zinc-500">
                Full Resource Name:
              </label>
              <input
                type="text"
                value={troubleshootResource}
                onChange={(e) => setTroubleshootResource(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
              />
            </div>

            <button
              type="button"
              disabled={actionRunning === 'TROUBLESHOOT_ALPHA_IAM_POLICY'}
              onClick={() =>
                executeAlphaBetaAction('TROUBLESHOOT_ALPHA_IAM_POLICY', {
                  principalEmail: troubleshootPrincipal,
                  permission: troubleshootPermission,
                  resourceName: troubleshootResource,
                })
              }
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2.5 text-xs font-mono font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {actionRunning === 'TROUBLESHOOT_ALPHA_IAM_POLICY'
                  ? 'Evaluating [ALPHA] Policy Tuple...'
                  : '[ALPHA] Troubleshoot IAM Access Tuple Live'}
              </span>
            </button>
          </div>

          {/* Right: [ALPHA] Privileged Access Manager (PAM) JIT Elevation */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                privilegedaccessmanager.googleapis.com/v1
              </span>
              <ReleaseTrackBadge track="ALPHA" />
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              [ALPHA] Zero Standing Privileges — PAM Just-In-Time (JIT) Grants (
              <code className="font-mono text-xs">gcloud alpha pam</code>)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Check PAM onboarding status, list active JIT entitlements, and
              synthesize time-boxed temporary IAM elevation grants that
              auto-expire when the timer ends.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500">
                  Entitlement ID:
                </label>
                <input
                  type="text"
                  value={pamEntitlementId}
                  onChange={(e) => setPamEntitlementId(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500">
                  Target JIT Role:
                </label>
                <input
                  type="text"
                  value={pamRole}
                  onChange={(e) => setPamRole(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500">
                  TTL Duration (Seconds):
                </label>
                <input
                  type="number"
                  min={600}
                  max={14400}
                  step={600}
                  value={pamDurationSeconds}
                  onChange={(e) =>
                    setPamDurationSeconds(Number(e.target.value))
                  }
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500">
                  Audit Justification:
                </label>
                <input
                  type="text"
                  value={pamJustification}
                  onChange={(e) => setPamJustification(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={actionRunning === 'CHECK_OR_CREATE_ALPHA_PAM_JIT'}
              onClick={() =>
                executeAlphaBetaAction('CHECK_OR_CREATE_ALPHA_PAM_JIT', {
                  pamEntitlementId,
                  pamRole,
                  pamDurationSeconds,
                  pamJustification,
                })
              }
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-2.5 text-xs font-mono font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>
                {actionRunning === 'CHECK_OR_CREATE_ALPHA_PAM_JIT'
                  ? 'Checking [ALPHA] PAM Status...'
                  : '[ALPHA] Check PAM Onboarding & Synthesize JIT Grant'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: [ALPHA] SERVICE HEALTH & CHAOS FAULT-TESTING */}
      {activeSubTab === 'ALPHA_HEALTH_FAULT' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ReleaseTrackBadge track="ALPHA" />
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  servicehealth.googleapis.com/v1 ·
                  faulttesting.googleapis.com/v1alpha
                </span>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                [ALPHA] Personalized Google Cloud Service Health Outage Radar
                &amp; Native Chaos Fault-Testing
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Queries{' '}
                <code className="font-mono">
                  gcloud alpha service-health events list
                </code>{' '}
                to verify if an incident is caused by an upstream Google Cloud
                regional outage, and inspects{' '}
                <code className="font-mono">
                  gcloud alpha fault-testing experiments / exclusion-windows
                </code>
                .
              </p>
            </div>

            <button
              type="button"
              disabled={
                actionRunning === 'SCAN_ALPHA_SERVICE_HEALTH_AND_FAULT_TESTING'
              }
              onClick={() =>
                executeAlphaBetaAction(
                  'SCAN_ALPHA_SERVICE_HEALTH_AND_FAULT_TESTING'
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 text-xs font-mono font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Activity className="w-4 h-4" />
              <span>
                {actionRunning === 'SCAN_ALPHA_SERVICE_HEALTH_AND_FAULT_TESTING'
                  ? 'Scanning [ALPHA] Service Health & Faults...'
                  : '[ALPHA] Scan Upstream GCP Incidents & Fault Experiments'}
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold">
                  Upstream GCP Service Health Events ({projectId})
                </span>
                <ReleaseTrackBadge track="ALPHA" />
              </div>
              {(overview?.alphaResilienceAndHealth?.serviceHealthEvents || [])
                .length === 0 ? (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-mono py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>
                    0 active upstream Google Cloud incidents impacting{' '}
                    {projectId}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {overview.alphaResilienceAndHealth.serviceHealthEvents.map(
                    (ev) => (
                      <div
                        key={ev.name}
                        className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs"
                      >
                        <div className="font-bold">{ev.title}</div>
                        <div className="text-[10.5px] font-mono text-zinc-500">
                          {ev.state} · {ev.category}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold">
                  Chaos Fault-Testing CLI Commands
                </span>
                <ReleaseTrackBadge track="ALPHA" />
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[10.5px] break-all">
                gcloud alpha fault-testing experiments list --project=
                {projectId} --location={region}
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 font-mono text-[10.5px] break-all">
                gcloud alpha fault-testing exclusion-windows list --project=
                {projectId} --location={region}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: [BETA + ALPHA] APP OPTIMIZE, CLOUD LOCATION FINDER & TERRAFORM VET */}
      {activeSubTab === 'ALPHA_BETA_PLATFORM' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <ReleaseTrackBadge track="BETA" />
                <ReleaseTrackBadge track="ALPHA" />
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                [BETA] App Optimize Reports + [ALPHA] Cloud Location Finder
                &amp; Declarative Resource-Config / Terraform Vet
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Runs{' '}
                <code className="font-mono">
                  gcloud beta app-optimize reports list
                </code>{' '}
                (<strong className="font-mono">[BETA]</strong>),{' '}
                <code className="font-mono">
                  gcloud alpha cloudlocationfinder cloud-locations list
                </code>{' '}
                (<strong className="font-mono">[ALPHA]</strong>), and{' '}
                <code className="font-mono">
                  gcloud alpha resource-config list-resource-types
                </code>{' '}
                (<strong className="font-mono">[ALPHA]</strong>) in parallel.
              </p>
            </div>

            <button
              type="button"
              disabled={
                actionRunning === 'RUN_ALPHA_BETA_PLATFORM_INTELLIGENCE'
              }
              onClick={() =>
                executeAlphaBetaAction('RUN_ALPHA_BETA_PLATFORM_INTELLIGENCE')
              }
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-mono font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileCode2 className="w-4 h-4" />
              <span>
                {actionRunning === 'RUN_ALPHA_BETA_PLATFORM_INTELLIGENCE'
                  ? 'Executing [BETA + ALPHA] Suite...'
                  : '[BETA + ALPHA] Run App Optimize, Location Finder & Resource-Config'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Live Execution Receipt & Pre-GA Audit Drawer */}
      {lastReceipt && (
        <div className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-[#141417] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ReleaseTrackBadge track={lastReceipt.releaseTrack || 'ALPHA'} />
              <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                {lastReceipt.releaseBadge || lastReceipt.actionKey}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                · {lastReceipt.durationMs || 0}ms · {lastReceipt.timestamp}
              </span>
            </div>
            {lastReceipt.executedCommand && (
              <button
                type="button"
                onClick={() =>
                  copyText(
                    lastReceipt.executedCommand,
                    'executed gcloud alpha/beta command'
                  )
                }
                className="inline-flex items-center gap-1 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:underline cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Executed Command</span>
              </button>
            )}
          </div>

          {lastReceipt.preGaNotice && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{lastReceipt.preGaNotice}</span>
            </div>
          )}

          {lastReceipt.executedCommand && (
            <div className="p-2.5 rounded-xl bg-zinc-900 text-emerald-400 font-mono text-xs break-all">
              $ {lastReceipt.executedCommand}
            </div>
          )}

          <pre className="max-h-72 overflow-auto p-3 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
            {JSON.stringify(lastReceipt, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
