import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import axios from 'axios';
import {
  Compass,
  FileCode2,
  Network,
  Sparkles,
  Activity,
  RefreshCw,
  Copy,
  Check,
  Download,
  Save,
  GitCompareArrows,
  Trash2,
  Play,
  Loader2,
  AlertTriangle,
  Search,
  Cloud,
  Wifi,
  Gauge,
  ShieldAlert,
  Clock,
  Radar,
  Layers,
  Eraser,
  Target,
  ExternalLink,
} from 'lucide-react';

/* ============================================================================
 * Static UI metadata only. Every resource, graph node, probe result, model
 * response and timeline event is fetched live from /api/project/:id/nexus/*.
 * ============================================================================ */

const SUB_TABS = [
  {
    id: 'TERRAFORM_DRIFT',
    label: 'Terraform Reverse-Compiler & Drift',
    shortDesc:
      'Reverse-compile live Google Cloud resources into Terraform HCL and detect ClickOps drift between snapshots',
    icon: FileCode2,
  },
  {
    id: 'BLAST_RADIUS',
    label: 'Blast-Radius Graph & Packet X-Ray',
    shortDesc:
      'Live IAM/VPC/resource dependency graph with downstream blast radius and real packet-path probes',
    icon: Network,
  },
  {
    id: 'VERTEX_ARENA',
    label: 'Vertex AI Model Arena',
    shortDesc:
      'Benchmark Gemini models side by side for latency, token cost, JSON validity and judge score',
    icon: Sparkles,
  },
  {
    id: 'FLIGHT_RECORDER',
    label: 'Flight Recorder & Canary Rehearsal',
    shortDesc:
      'Scrub audit changes against runtime errors and rehearse Cloud Run canary traffic shifts',
    icon: Activity,
  },
];

const STANDALONE_TAB_IDS = new Set(['TERRAFORM_DRIFT', 'VERTEX_ARENA']);

const HCL_FILES = [
  { id: 'mainTf', label: 'main.tf' },
  { id: 'importsTf', label: 'imports.tf' },
  { id: 'variablesTf', label: 'variables.tf' },
  { id: 'outputsTf', label: 'outputs.tf' },
];

const WINDOW_OPTIONS = [
  { minutes: 15, label: '15 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 360, label: '6 hours' },
  { minutes: 1440, label: '24 hours' },
];

const KIND_COLORS = {
  default: '#a1a1aa',
  PROJECT: '#f59e0b',
  SERVICE_ACCOUNT: '#a855f7',
  IAM_PRINCIPAL: '#a855f7',
  VM: '#3b82f6',
  INSTANCE: '#3b82f6',
  CLOUD_RUN: '#10b981',
  BUCKET: '#14b8a6',
  DATASET: '#06b6d4',
  VPC: '#6366f1',
  FIREWALL: '#f43f5e',
  SUBNET: '#818cf8',
};

const INPUT_CLS =
  'w-full px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500';

const LABEL_CLS =
  'block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1';

const TAB_ACTIVE =
  'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300';
const TAB_INACTIVE =
  'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500/45 hover:text-zinc-900 dark:hover:text-zinc-100';

/* ----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------- */

function isCancelled(err) {
  return Boolean(err?.__cancelledByUser || err?.response?.status === 499);
}

function errorText(err, fallback) {
  const data = err?.response?.data;
  return data?.error || data?.message || err?.message || fallback;
}

function fmtNum(v, suffix = '') {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'n/a';
  return `${v}${suffix}`;
}

function fmtUsd(v, digits = 4) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'n/a';
  return `$${Number(v).toFixed(digits)}`;
}

function shortId(v) {
  const s = String(v || '');
  return s.includes('/') ? s.split('/').pop() : s;
}

function asList(x) {
  if (Array.isArray(x)) return x;
  if (x && typeof x === 'object') {
    return Object.values(x).flatMap((v) => (Array.isArray(v) ? v : []));
  }
  return [];
}

function itemLabel(x) {
  if (x === null || x === undefined) return '';
  if (typeof x === 'string' || typeof x === 'number') return String(x);
  return (
    x.address ||
    x.id ||
    x.name ||
    x.resourceName ||
    x.label ||
    JSON.stringify(x)
  );
}

function Chip({ children, className = '' }) {
  return (
    <code
      className={`px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 ${className}`}
    >
      {children}
    </code>
  );
}

function StatusPill({ tone, children }) {
  const tones = {
    emerald:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    zinc: 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
    amber:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
    rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
        tones[tone] || tones.zinc
      }`}
    >
      {children}
    </span>
  );
}

function Btn({
  variant = 'secondary',
  icon: Icon,
  children,
  disabled = false,
  busy = false,
  onClick,
  featureId,
  ariaLabel,
  title,
  className = '',
}) {
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition';
  const isOff = disabled || busy;
  let tone;
  if (isOff) {
    tone =
      'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800 cursor-not-allowed';
  } else if (variant === 'primary') {
    tone =
      'bg-blue-600 hover:bg-blue-500 text-white border-blue-700 cursor-pointer';
  } else if (variant === 'danger') {
    tone =
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 cursor-pointer';
  } else {
    tone =
      'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 cursor-pointer';
  }
  return (
    <button
      type="button"
      onClick={isOff ? undefined : onClick}
      disabled={isOff}
      aria-label={ariaLabel}
      title={title}
      data-feature-id={featureId}
      className={`${base} ${tone} ${className}`}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

function Panel({ title, icon: Icon, right, children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 space-y-3 ${className}`}
    >
      {(title || right) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {Icon && <Icon className="w-4 h-4 text-amber-500" />}
            <span>{title}</span>
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function KpiStrip({ cells }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5">
      {cells.map((c) => (
        <div key={c.label}>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
            {c.label}
          </div>
          <div className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
            {c.value}
            {c.sub && (
              <span className="ml-1.5 text-[10px] font-normal text-zinc-500">
                {c.sub}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorBanner({ error, cmd }) {
  if (!error) return null;
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-start gap-2 text-xs text-zinc-900 dark:text-zinc-100">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span className="font-semibold">{error}</span>
      </div>
      {cmd && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
          <span>Run this command to fix it:</span>
          <Chip className="break-all select-all">{cmd}</Chip>
        </div>
      )}
    </div>
  );
}

function ListChips({ title, items, tone }) {
  const color =
    tone === 'emerald'
      ? 'border-emerald-500/40 bg-emerald-500/10'
      : tone === 'rose'
      ? 'border-rose-500/40 bg-rose-500/10'
      : 'border-amber-500/40 bg-amber-500/10';
  const list = Array.isArray(items) ? items : null;
  const count = list ? list.length : Number(items) || 0;
  return (
    <div className={`rounded-md border p-2.5 space-y-1.5 ${color}`}>
      <div className="text-[10px] font-mono font-bold uppercase text-zinc-600 dark:text-zinc-300">
        {title} ({count})
      </div>
      <div className="flex flex-wrap gap-1 max-h-32 overflow-auto">
        {list &&
          list.slice(0, 40).map((it, idx) => (
            <Chip key={`${itemLabel(it)}-${idx}`}>{itemLabel(it)}</Chip>
          ))}
        {list && list.length > 40 && (
          <span className="text-[10px] text-zinc-500">+{list.length - 40} more</span>
        )}
        {count === 0 && <span className="text-[10px] text-zinc-500">None</span>}
      </div>
    </div>
  );
}

/* ============================================================================
 * Main Studio
 * ============================================================================ */

export default function CloudFlightDeckNexusStudio({
  projectId,
  onShowToast,
  onNavigateStudio,
  embeddedTab,
}) {
  const [activeSubTabState, setActiveSubTab] = useState(
    embeddedTab || 'TERRAFORM_DRIFT'
  );
  const activeSubTab = embeddedTab || activeSubTabState;
  const [busy, setBusy] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Pillar 1
  const [tf, setTf] = useState(null);
  const [tfError, setTfError] = useState('');
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [diffA, setDiffA] = useState('');
  const [diffB, setDiffB] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [hclFile, setHclFile] = useState('mainTf');
  const [resourceFilter, setResourceFilter] = useState('ALL');

  // Pillar 2
  const [graph, setGraph] = useState(null);
  const [graphError, setGraphError] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [kindFilter, setKindFilter] = useState('ALL');
  const [probeHost, setProbeHost] = useState('');
  const [probePort, setProbePort] = useState('');
  const [probeProtocol, setProbeProtocol] = useState('TCP');
  const [probeResult, setProbeResult] = useState(null);
  const [ctSourceVm, setCtSourceVm] = useState('');
  const [ctDestIp, setCtDestIp] = useState('');
  const [ctPort, setCtPort] = useState('');
  const [ctProtocol, setCtProtocol] = useState('TCP');

  // Pillar 3
  const [vertex, setVertex] = useState(null);
  const [vertexError, setVertexError] = useState({ error: '', cmd: '' });
  const [arenaRegion, setArenaRegion] = useState('');
  const [selectedModels, setSelectedModels] = useState([]);
  const [systemInstruction, setSystemInstruction] = useState('');
  const [arenaPrompt, setArenaPrompt] = useState('');
  const [requireJson, setRequireJson] = useState(false);
  const [judgeEnabled, setJudgeEnabled] = useState(true);
  const [redTeamIdx, setRedTeamIdx] = useState('');
  const [arenaRun, setArenaRun] = useState(null);

  // Pillar 4
  const [windowMinutes, setWindowMinutes] = useState(60);
  const [recorder, setRecorder] = useState(null);
  const [recorderError, setRecorderError] = useState('');
  const [cursor, setCursor] = useState(1000);
  const [eventFilter, setEventFilter] = useState('ALL');
  const [canaryService, setCanaryService] = useState('');
  const [probeUrl, setProbeUrl] = useState('');
  const [burstCount, setBurstCount] = useState(5);
  const [resilience, setResilience] = useState(null);

  const toast = useCallback(
    (msg) => {
      if (onShowToast && msg) onShowToast(msg);
    },
    [onShowToast]
  );

  const base = `/api/project/${encodeURIComponent(projectId || '')}/nexus`;
  const proj = projectId || 'your-gcp-project';

  const copy = useCallback(
    (key, text, label = 'Copied to clipboard.') => {
      navigator.clipboard?.writeText(String(text || ''));
      setCopiedKey(key);
      toast(label);
      setTimeout(() => setCopiedKey((p) => (p === key ? null : p)), 1800);
    },
    [toast]
  );

  /* ---------------- Loaders ---------------- */

  const loadTerraform = useCallback(async () => {
    if (!projectId) return;
    setBusy('scan-tf');
    setTfError('');
    try {
      const res = await axios.get(`${base}/terraform-scan`);
      setTf(res.data);
      const snaps = res.data?.snapshots || [];
      if (snaps[0]) {
        setDiffA((cur) => cur || snaps[0].snapshotId || snaps[0].id || '');
      }
      toast(
        `Terraform scan complete: ${
          asList(res.data?.resources).length
        } live resource(s) reverse-compiled.`
      );
    } catch (err) {
      if (isCancelled(err)) return;
      setTfError(errorText(err, 'Terraform scan failed.'));
    } finally {
      setBusy('');
    }
  }, [base, projectId, toast]);

  const loadGraph = useCallback(async () => {
    if (!projectId) return;
    setBusy('graph');
    setGraphError('');
    try {
      const res = await axios.get(`${base}/blast-radius`);
      setGraph(res.data);
      toast(
        `Blast-radius graph built: ${res.data?.summary?.nodeCount ?? 0} node(s), ${
          res.data?.summary?.edgeCount ?? 0
        } edge(s).`
      );
    } catch (err) {
      if (isCancelled(err)) return;
      setGraphError(errorText(err, 'Blast-radius scan failed.'));
    } finally {
      setBusy('');
    }
  }, [base, projectId, toast]);

  const loadVertex = useCallback(async () => {
    if (!projectId) return;
    setBusy('vertex-overview');
    try {
      const res = await axios.get(`${base}/vertex-overview`);
      setVertex(res.data);
      setVertexError({ error: '', cmd: '' });
      setArenaRegion((cur) => cur || res.data?.region || '');
      setSelectedModels((cur) =>
        cur.length > 0
          ? cur
          : (res.data?.availableModels || [])
              .slice(0, 2)
              .map((m) => m.id || m.model || m.name)
      );
    } catch (err) {
      if (isCancelled(err)) return;
      setVertexError({
        error: errorText(err, 'Failed to load Vertex AI overview.'),
        cmd: err?.response?.data?.enableApiCmd || '',
      });
    } finally {
      setBusy('');
    }
  }, [base, projectId]);

  const loadRecorder = useCallback(
    async (minutes) => {
      if (!projectId) return;
      setBusy('recorder');
      setRecorderError('');
      try {
        const res = await axios.get(
          `${base}/flight-recorder?windowMinutes=${minutes}`
        );
        setRecorder(res.data);
        setCursor(1000);
        const targets = res.data?.cloudRunCanaryTargets || [];
        if (targets[0]) {
          setCanaryService((cur) => cur || targets[0].serviceName || targets[0].name || '');
        }
      } catch (err) {
        if (isCancelled(err)) return;
        setRecorderError(errorText(err, 'Failed to load flight-recorder timeline.'));
      } finally {
        setBusy('');
      }
    },
    [base, projectId]
  );

  // Reset on project change
  useEffect(() => {
    setTf(null);
    setGraph(null);
    setVertex(null);
    setRecorder(null);
    setDiffResult(null);
    setProbeResult(null);
    setArenaRun(null);
    setResilience(null);
    setSelectedNodeId('');
  }, [projectId]);

  // Lazy-load each pillar the first time it is opened
  useEffect(() => {
    if (!projectId) return;
    if (activeSubTab === 'TERRAFORM_DRIFT' && !tf && !tfError && !busy) loadTerraform();
    if (activeSubTab === 'BLAST_RADIUS' && !graph && !graphError && !busy) loadGraph();
    if (activeSubTab === 'VERTEX_ARENA' && !vertex && !vertexError.error && !busy) loadVertex();
    if (activeSubTab === 'FLIGHT_RECORDER' && !recorder && !recorderError && !busy)
      loadRecorder(windowMinutes);
  }, [activeSubTab, projectId, tf, graph, vertex, recorder, busy]);

  useEffect(() => {
    const onOpen = (ev) => {
      const sub = ev?.detail?.subTab;
      if (sub && STANDALONE_TAB_IDS.has(sub)) setActiveSubTab(sub);
    };
    window.addEventListener('cloudpulse:open-cloud-nexus', onOpen);
    return () => window.removeEventListener('cloudpulse:open-cloud-nexus', onOpen);
  }, []);

  /* ---------------- Pillar 1 actions ---------------- */

  const snapshots = tf?.snapshots || [];
  const snapId = (s) => s.snapshotId || s.id || '';

  const postSnapshot = async (body, busyKey) => {
    setBusy(busyKey);
    try {
      const res = await axios.post(`${base}/terraform-snapshot`, body);
      setTf((prev) => ({
        ...(prev || {}),
        snapshots: res.data?.snapshots || prev?.snapshots || [],
      }));
      return res.data;
    } catch (err) {
      if (!isCancelled(err)) toast(errorText(err, 'Snapshot operation failed.'));
      return null;
    } finally {
      setBusy('');
    }
  };

  const handleSaveSnapshot = async () => {
    const data = await postSnapshot(
      { action: 'SAVE_SNAPSHOT', label: snapshotLabel.trim() || undefined },
      'save-snap'
    );
    if (data) {
      toast(`Saved Terraform state snapshot ${snapId(data.snapshot || {})}.`);
      setSnapshotLabel('');
    }
  };

  const handleDiff = async () => {
    const data = await postSnapshot(
      {
        action: 'DIFF_SNAPSHOTS',
        snapshotId: diffA,
        compareToId: diffB || undefined,
      },
      'diff-snap'
    );
    if (data) {
      setDiffResult(data.drift || null);
      toast(data.drift?.hasDrift ? 'Drift detected between snapshots.' : 'No drift between snapshots.');
    }
  };

  const handleDeleteSnapshot = async (id) => {
    const data = await postSnapshot(
      { action: 'DELETE_SNAPSHOT', snapshotId: id },
      `del-snap-${id}`
    );
    if (data) {
      toast(`Deleted snapshot ${id}.`);
      if (diffA === id) setDiffA('');
      if (diffB === id) setDiffB('');
    }
  };

  const bundleText = (file) => (tf?.hclBundle ? tf.hclBundle[file] || '' : '');
  const fullBundle = HCL_FILES.map(
    (f) => `# ---- ${f.label} ----\n${bundleText(f.id)}`
  ).join('\n\n');

  const handleDownloadBundle = () => {
    const blob = new Blob([fullBundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudpulse-${proj}-terraform-bundle.tf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Downloaded Terraform bundle.');
  };

  /* ---------------- Pillar 2 actions ---------------- */

  const nodes = useMemo(() => graph?.nodes || [], [graph]);
  const edges = useMemo(() => graph?.edges || [], [graph]);
  const nodeById = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  const reach = useMemo(() => {
    if (!selectedNodeId) return { down: new Set(), up: new Set() };
    const out = {};
    const inc = {};
    edges.forEach((e) => {
      (out[e.source] = out[e.source] || []).push(e.target);
      (inc[e.target] = inc[e.target] || []).push(e.source);
    });
    const walk = (adj) => {
      const seen = new Set();
      const stack = [selectedNodeId];
      while (stack.length) {
        const cur = stack.pop();
        (adj[cur] || []).forEach((n) => {
          if (!seen.has(n) && n !== selectedNodeId) {
            seen.add(n);
            stack.push(n);
          }
        });
      }
      return seen;
    };
    return { down: walk(out), up: walk(inc) };
  }, [selectedNodeId, edges]);

  const nodeKinds = useMemo(
    () => Array.from(new Set(nodes.map((n) => n.kind).filter(Boolean))).sort(),
    [nodes]
  );

  const postProbe = async (body, busyKey) => {
    setBusy(busyKey);
    try {
      const res = await axios.post(`${base}/packet-probe`, body);
      return res.data;
    } catch (err) {
      if (!isCancelled(err)) toast(errorText(err, 'Packet probe failed.'));
      return null;
    } finally {
      setBusy('');
    }
  };

  const handleProbe = async () => {
    const data = await postProbe(
      {
        action: 'LIVE_REACHABILITY_PROBE',
        targetHost: probeHost.trim(),
        targetPort: Number(probePort) || 443,
        protocol: probeProtocol,
      },
      'probe'
    );
    if (data) {
      setProbeResult(data);
      toast(
        data.tcpOpen
          ? `${data.targetHost}:${data.targetPort} reachable (${data.tcpRttMs} ms).`
          : `${data.targetHost}:${data.targetPort} is not reachable over TCP.`
      );
    }
  };

  const handleCreateConnTest = async () => {
    const data = await postProbe(
      {
        action: 'CREATE_CONNECTIVITY_TEST',
        sourceVm: ctSourceVm.trim(),
        destIp: ctDestIp.trim(),
        targetPort: Number(ctPort) || 443,
        protocol: ctProtocol,
      },
      'create-ct'
    );
    if (data) {
      toast('Connectivity Test created in Network Intelligence Center.');
      await loadGraph();
    }
  };

  const handleDeleteConnTest = async (testId) => {
    const data = await postProbe(
      { action: 'DELETE_CONNECTIVITY_TEST', testId },
      `del-ct-${testId}`
    );
    if (data) {
      toast(`Deleted Connectivity Test ${testId}.`);
      await loadGraph();
    }
  };

  /* ---------------- Pillar 3 actions ---------------- */

  const models = vertex?.availableModels || [];
  const modelId = (m) => m.id || m.model || m.name;
  const redTeamPrompts = vertex?.redTeamPrompts || [];
  const rtText = (p) => (typeof p === 'string' ? p : p.prompt || p.text || '');
  const rtLabel = (p, i) =>
    typeof p === 'string' ? p.slice(0, 80) : p.label || p.title || p.id || `Prompt ${i + 1}`;

  const runVertex = async (action) => {
    const redTeamPick = redTeamIdx !== '' ? redTeamPrompts[Number(redTeamIdx)] : null;
    const prompt = action === 'RUN_REDTEAM_PROBE' ? rtText(redTeamPick || '') : arenaPrompt;
    setBusy(action);
    try {
      const res = await axios.post(`${base}/vertex-benchmark`, {
        action,
        region: arenaRegion || undefined,
        models: selectedModels,
        systemInstruction: systemInstruction || undefined,
        prompt,
        requireJson,
        judgeEnabled,
      });
      setArenaRun(res.data);
      setVertexError({ error: '', cmd: '' });
      toast(
        action === 'RUN_REDTEAM_PROBE'
          ? 'Red-team probe finished across selected models.'
          : 'Model arena run finished.'
      );
      await loadVertex();
    } catch (err) {
      if (isCancelled(err)) return;
      setVertexError({
        error: errorText(err, 'Vertex AI benchmark failed.'),
        cmd: err?.response?.data?.enableApiCmd || '',
      });
      toast(errorText(err, 'Vertex AI benchmark failed.'));
    } finally {
      setBusy('');
    }
  };

  const handleClearHistory = async () => {
    setBusy('clear-eval');
    try {
      await axios.post(`${base}/vertex-benchmark`, { action: 'CLEAR_EVAL_HISTORY' });
      toast('Cleared saved arena evaluation history.');
      setArenaRun(null);
      await loadVertex();
    } catch (err) {
      if (!isCancelled(err)) toast(errorText(err, 'Failed to clear history.'));
    } finally {
      setBusy('');
    }
  };

  /* ---------------- Pillar 4 actions ---------------- */

  const events = useMemo(
    () => [...(recorder?.events || [])].sort((a, b) => (a.epochMs || 0) - (b.epochMs || 0)),
    [recorder]
  );
  const endMs = recorder?.timestamp ? Date.parse(recorder.timestamp) : Date.now();
  const startMs = endMs - (recorder?.windowMinutes || windowMinutes) * 60000;
  const cursorMs = startMs + (cursor / 1000) * (endMs - startMs);
  const categories = useMemo(
    () => Array.from(new Set(events.map((e) => e.category).filter(Boolean))).sort(),
    [events]
  );
  const visibleEvents = events.filter(
    (e) => eventFilter === 'ALL' || e.category === eventFilter
  );
  const eventsAtCursor = visibleEvents.filter((e) => (e.epochMs || 0) <= cursorMs);
  const errorsAtCursor = eventsAtCursor.filter((e) =>
    /ERROR|CRITICAL|ALERT|EMERGENCY/i.test(e.severity || '')
  ).length;

  const canaryTargets = recorder?.cloudRunCanaryTargets || [];
  const targetName = (t) => t.serviceName || t.name || '';
  const selectedTarget = canaryTargets.find((t) => targetName(t) === canaryService);
  const targetRegion = selectedTarget?.region || selectedTarget?.location || '';
  const targetUrlGuess = selectedTarget?.uri || selectedTarget?.url || '';

  useEffect(() => {
    if (targetUrlGuess) setProbeUrl(targetUrlGuess);
  }, [targetUrlGuess]);

  const handleWindow = async (minutes) => {
    setWindowMinutes(minutes);
    await loadRecorder(minutes);
  };

  const handleResilience = async () => {
    setBusy('resilience');
    try {
      const res = await axios.post(`${base}/canary-rehearsal`, {
        action: 'HTTP_RESILIENCE_PROBE',
        targetUrl: probeUrl.trim(),
        burstCount: Math.min(10, Math.max(1, Number(burstCount) || 1)),
      });
      setResilience(res.data);
      toast(`Resilience probe: p50 ${res.data?.p50Ms} ms, p95 ${res.data?.p95Ms} ms.`);
    } catch (err) {
      if (!isCancelled(err)) toast(errorText(err, 'Resilience probe failed.'));
    } finally {
      setBusy('');
    }
  };

  /* ============================================================================
   * Header
   * ============================================================================ */

  const header = (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
      <div className="space-y-1.5 max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill tone="amber">
            <Compass className="w-3 h-3" />
            CLOUD FLIGHT-DECK NEXUS
          </StatusPill>
          <StatusPill tone="blue">
            <Cloud className="w-3 h-3" />
            2-IN-1 LIVE CONTROL PLANE
          </StatusPill>
        </div>
        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Cloud Flight-Deck Nexus Studio
        </h2>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Reverse-compile <Chip>{proj}</Chip> into Terraform and catch ClickOps
          drift and benchmark Gemini models side by side on Vertex AI.
        </p>
      </div>
      <div
        role="tablist"
        aria-label="Cloud Flight-Deck Modules"
        className="cp-segmented-menu flex flex-wrap gap-1.5"
      >
        {SUB_TABS.filter((t) => STANDALONE_TAB_IDS.has(t.id)).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-subtab-id={tab.id}
              data-feature-id={`NEXUS_TAB_${tab.id}`}
              title={tab.shortDesc}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 h-9 rounded-md border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition ${
                isActive ? TAB_ACTIVE : TAB_INACTIVE
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ============================================================================
   * Tab 1: TERRAFORM_DRIFT
   * ============================================================================ */

  const tfResources = asList(tf?.resources);
  const resKind = (r) => r.type || r.kind || r.resourceType || 'resource';
  const resKinds = Array.from(new Set(tfResources.map(resKind))).sort();
  const filteredResources = tfResources.filter(
    (r) => resourceFilter === 'ALL' || resKind(r) === resourceFilter
  );
  const drift = diffResult || tf?.latestDrift;

  const terraformTab = (
    <div className="space-y-3">
      <KpiStrip
        cells={[
          {
            label: 'Live Resources',
            value: tfResources.length,
            sub: 'reverse-compiled',
          },
          {
            label: 'State SHA-256',
            value: tf?.stateSha256 ? tf.stateSha256.slice(0, 12) : 'n/a',
            sub: 'canonical',
          },
          {
            label: 'Saved Snapshots',
            value: snapshots.length,
            sub: 'on this host',
          },
          {
            label: 'Drift Status',
            value: drift ? (drift.hasDrift ? 'DRIFT' : 'CLEAN') : 'n/a',
            sub: drift?.baselineSnapshotId ? `vs ${drift.baselineSnapshotId}` : 'no baseline',
          },
          {
            label: 'Last Scan',
            value: tf?.timestamp ? new Date(tf.timestamp).toLocaleTimeString() : 'n/a',
          },
        ]}
      />

      <div data-action-toolbar="true" className="flex flex-wrap items-end gap-2">
        <Btn
          variant="primary"
          icon={Search}
          busy={busy === 'scan-tf'}
          onClick={loadTerraform}
          featureId="NEXUS_BTN_SCAN_TERRAFORM"
        >
          Scan Live Infrastructure
        </Btn>
        <div className="w-48">
          <label className={LABEL_CLS}>Snapshot Label</label>
          <input
            className={INPUT_CLS}
            value={snapshotLabel}
            onChange={(e) => setSnapshotLabel(e.target.value)}
            placeholder="before-release"
          />
        </div>
        <Btn
          icon={Save}
          busy={busy === 'save-snap'}
          disabled={!tf}
          onClick={handleSaveSnapshot}
          featureId="NEXUS_BTN_SAVE_SNAPSHOT"
        >
          Save Snapshot
        </Btn>
        <Btn
          icon={copiedKey === 'hcl' ? Check : Copy}
          disabled={!tf?.hclBundle}
          onClick={() => copy('hcl', bundleText(hclFile), `Copied ${hclFile} HCL.`)}
          featureId="NEXUS_BTN_COPY_HCL"
        >
          Copy HCL
        </Btn>
        <Btn
          icon={Download}
          disabled={!tf?.hclBundle}
          onClick={handleDownloadBundle}
          featureId="NEXUS_BTN_DOWNLOAD_TF_BUNDLE"
        >
          Download .tf Bundle
        </Btn>
      </div>

      <ErrorBanner error={tfError} />

      {tf?.resourceCounts && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(tf.resourceCounts).map(([k, v]) => (
            <Chip key={k}>
              {k}: {String(v)}
            </Chip>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel
          title="Reverse-Compiled Terraform HCL"
          icon={FileCode2}
          right={
            <select
              aria-label="HCL file"
              className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              value={hclFile}
              onChange={(e) => setHclFile(e.target.value)}
            >
              {HCL_FILES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          }
        >
          <pre className="h-96 overflow-auto rounded-md border border-zinc-300 dark:border-zinc-800 bg-zinc-950 text-zinc-200 p-2.5 text-[11px] font-mono whitespace-pre">
            {tf?.hclBundle
              ? bundleText(hclFile) || `# ${hclFile} is empty for the current scan.`
              : busy === 'scan-tf'
              ? 'Scanning live Google Cloud APIs...'
              : 'Run a live scan to generate HCL.'}
          </pre>
        </Panel>

        <div className="space-y-3">
          <Panel title="ClickOps Drift Time-Machine" icon={Clock}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className={LABEL_CLS}>Baseline Snapshot</label>
                <select
                  className={INPUT_CLS}
                  value={diffA}
                  onChange={(e) => setDiffA(e.target.value)}
                >
                  <option value="">Select snapshot</option>
                  {snapshots.map((s) => (
                    <option key={snapId(s)} value={snapId(s)}>
                      {s.label ? `${s.label} (${snapId(s)})` : snapId(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Compare To</label>
                <select
                  className={INPUT_CLS}
                  value={diffB}
                  onChange={(e) => setDiffB(e.target.value)}
                >
                  <option value="">Current live state</option>
                  {snapshots.map((s) => (
                    <option key={snapId(s)} value={snapId(s)}>
                      {s.label ? `${s.label} (${snapId(s)})` : snapId(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div data-action-toolbar="true" className="flex flex-wrap gap-2">
              <Btn
                variant="primary"
                icon={GitCompareArrows}
                busy={busy === 'diff-snap'}
                disabled={!diffA}
                onClick={handleDiff}
                featureId="NEXUS_BTN_DIFF_SNAPSHOT"
              >
                Diff Snapshots
              </Btn>
            </div>
            {drift && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StatusPill tone={drift.hasDrift ? 'amber' : 'emerald'}>
                    {drift.hasDrift ? 'DRIFT DETECTED' : 'NO DRIFT'}
                  </StatusPill>
                  {drift.baselineSnapshotId && (
                    <Chip>baseline {drift.baselineSnapshotId}</Chip>
                  )}
                  {drift.comparedTo && <Chip>compared to {drift.comparedTo}</Chip>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <ListChips title="Added" items={drift.added} tone="emerald" />
                  <ListChips title="Modified" items={drift.modified} tone="amber" />
                  <ListChips title="Removed" items={drift.removed} tone="rose" />
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Saved State Snapshots" icon={Layers}>
            {snapshots.length === 0 && (
              <div className="text-[11px] text-zinc-500">
                No snapshots saved yet. Save one before a risky change to diff against it later.
              </div>
            )}
            {snapshots.map((s) => (
              <div
                key={snapId(s)}
                className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Chip>{snapId(s)}</Chip>
                    {s.label && <span className="text-xs font-semibold">{s.label}</span>}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {s.createdAt || s.timestamp || ''}{' '}
                    {s.stateSha256 ? `sha256 ${String(s.stateSha256).slice(0, 12)}` : ''}{' '}
                    {s.resourceCounts
                      ? `${Object.values(s.resourceCounts).reduce((a, b) => a + (Number(b) || 0), 0)} resources`
                      : ''}
                  </div>
                </div>
                <Btn
                  variant="danger"
                  icon={Trash2}
                  busy={busy === `del-snap-${snapId(s)}`}
                  onClick={() => handleDeleteSnapshot(snapId(s))}
                  featureId="NEXUS_BTN_DELETE_SNAPSHOT"
                  ariaLabel={`Delete Snapshot ${snapId(s)}`}
                >
                  Delete Snapshot
                </Btn>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      <Panel
        title="Discovered Live Resources"
        icon={Cloud}
        right={
          <select
            aria-label="Resource type filter"
            className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100"
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
          >
            <option value="ALL">All types ({tfResources.length})</option>
            {resKinds.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        }
      >
        <div className="overflow-auto max-h-80 rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-[11px] font-mono">
            <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="text-left px-2.5 py-1.5">Type</th>
                <th className="text-left px-2.5 py-1.5">Name</th>
                <th className="text-left px-2.5 py-1.5">Location</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.slice(0, 300).map((r, idx) => (
                <tr
                  key={`${resKind(r)}-${itemLabel(r)}-${idx}`}
                  className="border-t border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <td className="px-2.5 py-1.5">{resKind(r)}</td>
                  <td className="px-2.5 py-1.5">{r.name || r.id || itemLabel(r)}</td>
                  <td className="px-2.5 py-1.5">
                    {r.attrs?.location || r.attrs?.region || r.attrs?.zone || r.region || r.location || 'global'}
                  </td>
                </tr>
              ))}
              {filteredResources.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-2.5 py-3 text-zinc-500">
                    No resources to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  /* ============================================================================
   * Tab 2: BLAST_RADIUS
   * ============================================================================ */

  const svgModel = useMemo(() => {
    const filtered = nodes.filter((n) => kindFilter === 'ALL' || n.kind === kindFilter);
    const kinds = Array.from(new Set(filtered.map((n) => n.kind || 'OTHER'))).sort();
    const MAX_ROWS = 28;
    const pos = {};
    let hidden = 0;
    let maxRows = 1;
    const colW = 170;
    kinds.forEach((k, ci) => {
      const col = filtered
        .filter((n) => (n.kind || 'OTHER') === k)
        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
      hidden += Math.max(0, col.length - MAX_ROWS);
      col.slice(0, MAX_ROWS).forEach((n, ri) => {
        pos[n.id] = { x: 90 + ci * colW, y: 46 + ri * 22, n };
      });
      maxRows = Math.max(maxRows, Math.min(col.length, MAX_ROWS));
    });
    const shownEdges = edges.filter((e) => pos[e.source] && pos[e.target]);
    return {
      kinds,
      pos,
      hidden,
      shownEdges,
      width: Math.max(380, 90 + kinds.length * colW),
      height: 60 + maxRows * 22,
    };
  }, [nodes, edges, kindFilter]);

  const selectedNode = nodeById[selectedNodeId];
  const topNodes = graph?.topHighImpactNodes || [];
  const connTests = graph?.connectivityTests || [];

  const nodeFill = (n) => KIND_COLORS[n.kind] || KIND_COLORS.default;

  const blastTab = (
    <div className="space-y-3">
      <KpiStrip
        cells={[
          { label: 'Graph Nodes', value: fmtNum(graph?.summary?.nodeCount) },
          { label: 'Graph Edges', value: fmtNum(graph?.summary?.edgeCount) },
          { label: 'Critical Paths', value: fmtNum(graph?.summary?.criticalPaths) },
          { label: 'Public Ingress', value: fmtNum(graph?.summary?.publicIngressCount) },
          {
            label: 'Last Scan',
            value: graph?.timestamp ? new Date(graph.timestamp).toLocaleTimeString() : 'n/a',
          },
        ]}
      />

      <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
        <Btn
          variant="primary"
          icon={RefreshCw}
          busy={busy === 'graph'}
          onClick={loadGraph}
          featureId="NEXUS_BTN_REFRESH_GRAPH"
        >
          Refresh Graph
        </Btn>
        <select
          aria-label="Node kind filter"
          className="px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100"
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
        >
          <option value="ALL">All node kinds</option>
          {nodeKinds.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        {graph?.apiStatus &&
          Object.entries(graph.apiStatus).map(([k, v]) => (
            <StatusPill key={k} tone={v === 'ENABLED' ? 'emerald' : 'amber'}>
              {k}: {String(v)}
            </StatusPill>
          ))}
      </div>

      <ErrorBanner error={graphError} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel
          title="Dependency & IAM Graph"
          icon={Network}
          className="xl:col-span-2"
        >
          <div className="overflow-auto max-h-[34rem] rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
            {svgModel.kinds.length === 0 ? (
              <div className="p-4 text-xs text-zinc-500">
                {busy === 'graph'
                  ? 'Building graph from live IAM, Compute, Cloud Run, Storage, BigQuery and VPC APIs...'
                  : 'No graph nodes. Refresh the graph.'}
              </div>
            ) : (
              <svg
                width={svgModel.width}
                height={svgModel.height}
                viewBox={`0 0 ${svgModel.width} ${svgModel.height}`}
                role="img"
                aria-label="Infrastructure dependency graph"
              >
                {svgModel.kinds.map((k, ci) => (
                  <text
                    key={k}
                    x={90 + ci * 170}
                    y={20}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="700"
                    fill="#a1a1aa"
                  >
                    {k}
                  </text>
                ))}
                {svgModel.shownEdges.map((e, idx) => {
                  const a = svgModel.pos[e.source];
                  const b = svgModel.pos[e.target];
                  const hot =
                    selectedNodeId &&
                    (e.source === selectedNodeId ||
                      e.target === selectedNodeId ||
                      (reach.down.has(e.source) && reach.down.has(e.target)));
                  return (
                    <line
                      key={`${e.source}-${e.target}-${idx}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={hot ? '#f59e0b' : '#71717a'}
                      strokeOpacity={hot ? 0.95 : selectedNodeId ? 0.12 : 0.35}
                      strokeWidth={hot ? 1.6 : 1}
                    />
                  );
                })}
                {Object.values(svgModel.pos).map(({ x, y, n }) => {
                  const isSel = n.id === selectedNodeId;
                  const isDown = reach.down.has(n.id);
                  const isUp = reach.up.has(n.id);
                  const dim = selectedNodeId && !isSel && !isDown && !isUp;
                  return (
                    <g key={n.id} opacity={dim ? 0.3 : 1}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isSel ? 8 : 5 + Math.min(3, (n.riskScore || 0) / 35)}
                        fill={nodeFill(n)}
                        stroke={isSel ? '#f59e0b' : isDown ? '#f43f5e' : 'none'}
                        strokeWidth={2}
                      />
                      <text
                        x={x + 11}
                        y={y + 3}
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                        fill="#a1a1aa"
                      >
                        {String(n.label || shortId(n.id)).slice(0, 18)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          {svgModel.hidden > 0 && (
            <div className="text-[10px] text-zinc-500">
              {svgModel.hidden} lower-risk node(s) hidden in the drawing; they remain in the node list below.
            </div>
          )}
          <div className="text-[10px] font-mono text-zinc-500">
            Amber = selected node and its edges. Red ring = downstream blast radius. Larger dot = higher risk score.
          </div>
        </Panel>

        <Panel title="Top High-Impact Nodes" icon={ShieldAlert}>
          <div className="space-y-1.5 max-h-[34rem] overflow-auto">
            {topNodes.length === 0 && (
              <div className="text-[11px] text-zinc-500">No ranked nodes yet.</div>
            )}
            {topNodes.map((t) => (
              <div
                key={t.nodeId}
                className={`rounded-md border p-2 space-y-1 ${
                  selectedNodeId === t.nodeId
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {t.label || shortId(t.nodeId)}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {t.kind} | {fmtNum(t.downstreamCount)} downstream
                    </div>
                  </div>
                  <Btn
                    icon={Target}
                    onClick={() => setSelectedNodeId(t.nodeId)}
                    featureId="NEXUS_BTN_SELECT_NODE"
                    ariaLabel={`Select Node ${t.label || t.nodeId}`}
                  >
                    Inspect
                  </Btn>
                </div>
                {t.blastSummary && (
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    {t.blastSummary}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {selectedNode && (
        <Panel title={`Node Detail: ${selectedNode.label || selectedNode.id}`} icon={Radar}>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <Chip>{selectedNode.kind}</Chip>
            {selectedNode.region && <Chip>{selectedNode.region}</Chip>}
            <Chip>risk {fmtNum(selectedNode.riskScore)}</Chip>
            {selectedNode.exposure && <Chip>exposure {String(selectedNode.exposure)}</Chip>}
            <Chip>{reach.down.size} downstream</Chip>
            <Chip>{reach.up.size} upstream</Chip>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <ListChips
              title="Downstream (blast radius)"
              items={Array.from(reach.down).map((id) => nodeById[id]?.label || shortId(id))}
              tone="rose"
            />
            <ListChips
              title="Upstream (who can reach it)"
              items={Array.from(reach.up).map((id) => nodeById[id]?.label || shortId(id))}
              tone="amber"
            />
          </div>
          {selectedNode.metadata && (
            <pre className="max-h-40 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">
              {JSON.stringify(selectedNode.metadata, null, 2)}
            </pre>
          )}
        </Panel>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Live Packet-Path X-Ray" icon={Wifi}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Target Host</label>
              <input
                className={INPUT_CLS}
                value={probeHost}
                onChange={(e) => setProbeHost(e.target.value)}
                placeholder="api.example.com"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Port</label>
              <input
                className={INPUT_CLS}
                inputMode="numeric"
                value={probePort}
                onChange={(e) => setProbePort(e.target.value.replace(/\D/g, ''))}
                placeholder="443"
              />
            </div>
          </div>
          <div className="w-40">
            <label className={LABEL_CLS}>Protocol</label>
            <select
              className={INPUT_CLS}
              value={probeProtocol}
              onChange={(e) => setProbeProtocol(e.target.value)}
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="ICMP">ICMP</option>
            </select>
          </div>
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              variant="primary"
              icon={Play}
              busy={busy === 'probe'}
              disabled={!probeHost.trim()}
              onClick={handleProbe}
              featureId="NEXUS_BTN_RUN_PACKET_PROBE"
            >
              Run Packet-Path Probe
            </Btn>
          </div>
          {probeResult && (
            <div className="space-y-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill tone={probeResult.tcpOpen ? 'emerald' : 'rose'}>
                  {probeResult.tcpOpen ? 'TCP OPEN' : 'TCP CLOSED'}
                </StatusPill>
                <span>
                  {probeResult.targetHost}:{probeResult.targetPort}
                </span>
                {probeResult.resolvedIp && <Chip>{probeResult.resolvedIp}</Chip>}
                <span>RTT {fmtNum(probeResult.tcpRttMs, ' ms')}</span>
              </div>
              {probeResult.tlsInfo && (
                <pre className="max-h-32 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 whitespace-pre-wrap break-all">
                  {JSON.stringify(probeResult.tlsInfo, null, 2)}
                </pre>
              )}
              {(probeResult.hopTrace || []).length > 0 && (
                <ol className="space-y-0.5 list-decimal list-inside">
                  {probeResult.hopTrace.map((h, idx) => (
                    <li key={idx}>{typeof h === 'string' ? h : h.detail || h.hop || JSON.stringify(h)}</li>
                  ))}
                </ol>
              )}
              <div>
                <div className="text-[10px] uppercase text-zinc-500 mb-1">
                  Matched VPC firewall rules (
                  {(probeResult.matchedFirewallRules || []).length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {(probeResult.matchedFirewallRules || []).map((r, idx) => (
                    <Chip key={`${itemLabel(r)}-${idx}`}>
                      {typeof r === 'string'
                        ? r
                        : `${r.name}${r.direction ? ` ${r.direction}` : ''}${
                            r.action ? ` ${r.action}` : ''
                          }`}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Network Intelligence Connectivity Tests" icon={Radar}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLS}>Source VM</label>
              <select
                className={INPUT_CLS}
                value={ctSourceVm}
                onChange={(e) => setCtSourceVm(e.target.value)}
              >
                <option value="">Select a VM node</option>
                {nodes
                  .filter((n) => /VM|INSTANCE/i.test(n.kind || ''))
                  .map((n) => (
                    <option key={n.id} value={n.label || shortId(n.id)}>
                      {n.label || shortId(n.id)}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Destination IP</label>
              <input
                className={INPUT_CLS}
                value={ctDestIp}
                onChange={(e) => setCtDestIp(e.target.value)}
                placeholder="10.0.0.5"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Destination Port</label>
              <input
                className={INPUT_CLS}
                inputMode="numeric"
                value={ctPort}
                onChange={(e) => setCtPort(e.target.value.replace(/\D/g, ''))}
                placeholder="443"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Protocol</label>
              <select
                className={INPUT_CLS}
                value={ctProtocol}
                onChange={(e) => setCtProtocol(e.target.value)}
              >
                <option value="TCP">TCP</option>
                <option value="UDP">UDP</option>
                <option value="ICMP">ICMP</option>
              </select>
            </div>
          </div>
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              icon={Play}
              busy={busy === 'create-ct'}
              disabled={!ctSourceVm || !ctDestIp.trim()}
              onClick={handleCreateConnTest}
              featureId="NEXUS_BTN_CREATE_CONN_TEST"
            >
              Create Connectivity Test
            </Btn>
          </div>
          <div className="space-y-1.5">
            {connTests.length === 0 && (
              <div className="text-[11px] text-zinc-500">
                No Connectivity Tests exist in this project.
              </div>
            )}
            {connTests.map((t, idx) => {
              const id = t.testId || shortId(t.name);
              const result = t.reachability;
              return (
                <div
                  key={`${id}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5"
                >
                  <div className="min-w-0 space-y-0.5">
                    <Chip>{id}</Chip>
                    {result && (
                      <span className="ml-2 text-[10px] font-mono text-zinc-500">{String(result)}</span>
                    )}
                  </div>
                  <Btn
                    variant="danger"
                    icon={Trash2}
                    busy={busy === `del-ct-${id}`}
                    onClick={() => handleDeleteConnTest(id)}
                    featureId="NEXUS_BTN_DELETE_CONN_TEST"
                    ariaLabel={`Delete Connectivity Test ${id}`}
                  >
                    Delete Connectivity Test
                  </Btn>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );

  /* ============================================================================
   * Tab 3: VERTEX_ARENA
   * ============================================================================ */

  const runResults = (() => {
    const run = arenaRun?.run || arenaRun;
    return run?.results || arenaRun?.results || [];
  })();
  const history = vertex?.history || [];
  const maxLatency = Math.max(1, ...runResults.map((r) => Number(r.latencyMs) || 0));
  const maxCost = Math.max(1e-9, ...runResults.map((r) => Number(r.estimatedCostUsd) || 0));
  const apiEnabled = vertex ? vertex.vertexApiEnabled !== false : true;
  const enableCmd = `gcloud services enable aiplatform.googleapis.com --project=${proj}`;

  const arenaTab = (
    <div className="space-y-3">
      <KpiStrip
        cells={[
          {
            label: 'Vertex AI API',
            value: vertex ? (apiEnabled ? 'ENABLED' : 'DISABLED') : 'n/a',
            sub: 'aiplatform.googleapis.com',
          },
          { label: 'Region', value: vertex?.region || arenaRegion || 'n/a' },
          { label: 'Catalog Models', value: models.length },
          { label: 'Selected Models', value: selectedModels.length },
          { label: 'Saved Runs', value: history.length },
        ]}
      />

      {!apiEnabled && (
        <ErrorBanner
          error="Vertex AI API is not enabled on this project, so arena runs will fail until it is enabled."
          cmd={enableCmd}
        />
      )}
      <ErrorBanner
        error={vertexError.error}
        cmd={vertexError.cmd}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Arena Configuration" icon={Gauge}>
          <div>
            <label className={LABEL_CLS}>Vertex AI Region</label>
            <input
              className={INPUT_CLS}
              value={arenaRegion}
              onChange={(e) => setArenaRegion(e.target.value)}
              placeholder="us-central1"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Models to Compare</label>
            <div className="space-y-1">
              {models.map((m) => {
                const id = modelId(m);
                const rates = Object.entries(m).filter(
                  ([k, v]) => typeof v === 'number' && /usd|per1m|rate|price/i.test(k)
                );
                return (
                  <label
                    key={id}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      className="accent-amber-500"
                      checked={selectedModels.includes(id)}
                      onChange={(e) =>
                        setSelectedModels((cur) =>
                          e.target.checked ? [...cur, id] : cur.filter((x) => x !== id)
                        )
                      }
                    />
                    <span className="font-bold">{id}</span>
                    {rates.map(([k, v]) => (
                      <Chip key={k}>
                        {k}: {fmtUsd(v, 3)}
                      </Chip>
                    ))}
                  </label>
                );
              })}
              {models.length === 0 && (
                <div className="text-[11px] text-zinc-500">
                  No model catalog loaded yet.
                </div>
              )}
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>System Instruction (optional)</label>
            <textarea
              rows={2}
              className={INPUT_CLS}
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="You are a concise cloud architecture assistant."
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Prompt</label>
            <textarea
              rows={4}
              className={INPUT_CLS}
              value={arenaPrompt}
              onChange={(e) => setArenaPrompt(e.target.value)}
              placeholder="Explain the difference between a Cloud Run revision and a service."
            />
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-amber-500"
                checked={requireJson}
                onChange={(e) => setRequireJson(e.target.checked)}
              />
              Require valid JSON output
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-amber-500"
                checked={judgeEnabled}
                onChange={(e) => setJudgeEnabled(e.target.checked)}
              />
              Gemini rubric judge
            </label>
          </div>
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              variant="primary"
              icon={Play}
              busy={busy === 'RUN_ARENA'}
              disabled={selectedModels.length === 0 || !arenaPrompt.trim() || !apiEnabled}
              onClick={() => runVertex('RUN_ARENA')}
              featureId="NEXUS_BTN_RUN_ARENA"
            >
              Run Arena
            </Btn>
          </div>
        </Panel>

        <Panel title="Red-Team Probe" icon={ShieldAlert}>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Sends a curated adversarial prompt to every selected model and
            records how each one responds, with the same latency, cost and judge
            scoring as the arena.
          </p>
          <div>
            <label className={LABEL_CLS}>Curated Red-Team Prompt</label>
            <select
              className={INPUT_CLS}
              value={redTeamIdx}
              onChange={(e) => setRedTeamIdx(e.target.value)}
            >
              <option value="">Select a prompt</option>
              {redTeamPrompts.map((p, i) => (
                <option key={i} value={i}>
                  {rtLabel(p, i)}
                </option>
              ))}
            </select>
          </div>
          {redTeamIdx !== '' && redTeamPrompts[Number(redTeamIdx)] && (
            <pre className="max-h-32 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
              {rtText(redTeamPrompts[Number(redTeamIdx)])}
            </pre>
          )}
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              icon={ShieldAlert}
              busy={busy === 'RUN_REDTEAM_PROBE'}
              disabled={selectedModels.length === 0 || redTeamIdx === '' || !apiEnabled}
              onClick={() => runVertex('RUN_REDTEAM_PROBE')}
              featureId="NEXUS_BTN_RUN_REDTEAM"
            >
              Run Red-Team Probe
            </Btn>
            <Btn
              variant="danger"
              icon={Eraser}
              busy={busy === 'clear-eval'}
              disabled={history.length === 0}
              onClick={handleClearHistory}
              featureId="NEXUS_BTN_CLEAR_EVAL_HISTORY"
            >
              Clear Eval History
            </Btn>
          </div>
        </Panel>
      </div>

      {runResults.length > 0 && (
        <Panel title="Latest Run Results" icon={Sparkles}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {runResults.map((r, idx) => (
              <div
                key={`${r.model}-${idx}`}
                className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {r.model}
                    </span>
                    {r.resolvedModelId && r.resolvedModelId !== r.model && (
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                        ({r.resolvedModelId})
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.error && <StatusPill tone="rose">ERROR</StatusPill>}
                    {r.jsonValid !== undefined && r.jsonValid !== null && (
                      <StatusPill tone={r.jsonValid ? 'emerald' : 'amber'}>
                        {r.jsonValid ? 'VALID JSON' : 'INVALID JSON'}
                      </StatusPill>
                    )}
                    {r.judge && (
                      <StatusPill tone="blue">
                        JUDGE {fmtNum(r.judge.scoreOutOf10)}/10
                      </StatusPill>
                    )}
                  </div>
                </div>
                <div className="space-y-1 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <span className="w-16">Latency</span>
                    <div className="flex-1 h-2 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${((Number(r.latencyMs) || 0) / maxLatency) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right">{fmtNum(r.latencyMs, ' ms')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16">Cost</span>
                    <div className="flex-1 h-2 rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${((Number(r.estimatedCostUsd) || 0) / maxCost) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right">{fmtUsd(r.estimatedCostUsd, 5)}</span>
                  </div>
                  <div>
                    Tokens in {fmtNum(r.usage?.promptTokenCount ?? r.inputTokens ?? r.promptTokens)} / out{' '}
                    {fmtNum(r.usage?.candidatesTokenCount ?? r.outputTokens ?? r.completionTokens)}
                  </div>
                </div>
                <pre className="max-h-48 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                  {r.error || r.text || r.response || ''}
                </pre>
                {r.judge && (
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-0.5">
                    <div className="font-mono">
                      accuracy {fmtNum(r.judge.accuracy)} | completeness{' '}
                      {fmtNum(r.judge.completeness)} | safety {fmtNum(r.judge.safety)}
                    </div>
                    {r.judge.rationale && <div>{r.judge.rationale}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Saved Evaluation History" icon={Clock}>
        {history.length === 0 && (
          <div className="text-[11px] text-zinc-500">No saved arena runs yet.</div>
        )}
        <div className="space-y-1.5 max-h-72 overflow-auto">
          {history.map((h, idx) => (
            <div
              key={h.runId || h.id || idx}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 space-y-0.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Chip>{h.mode || h.action || 'RUN'}</Chip>
                <span className="text-zinc-500">{h.timestamp || h.createdAt}</span>
              </div>
              <div className="truncate">{h.prompt}</div>
              <div className="text-zinc-500">
                {(h.results || [])
                  .map(
                    (r) =>
                      `${r.model}: ${fmtNum(r.latencyMs, 'ms')} ${fmtUsd(r.estimatedCostUsd, 5)}`
                  )
                  .join(' | ')}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );

  /* ============================================================================
   * Tab 4: FLIGHT_RECORDER
   * ============================================================================ */

  const sevColor = (s) =>
    /ERROR|CRITICAL|ALERT|EMERGENCY/i.test(s || '')
      ? '#f43f5e'
      : /WARN/i.test(s || '')
      ? '#f59e0b'
      : '#3b82f6';

  const recorderTab = (
    <div className="space-y-3">
      <KpiStrip
        cells={[
          { label: 'Window', value: `${recorder?.windowMinutes ?? windowMinutes} min` },
          { label: 'Events', value: events.length },
          ...Object.entries(recorder?.counts || {})
            .slice(0, 3)
            .map(([k, v]) => ({ label: k, value: String(v) })),
          { label: 'Correlations', value: (recorder?.correlations || []).length },
        ].slice(0, 5)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Timeline window"
          className="cp-segmented-menu flex flex-wrap gap-1.5"
        >
          {WINDOW_OPTIONS.map((w) => {
            const isActive = windowMinutes === w.minutes;
            return (
              <button
                key={w.minutes}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Scrub Window ${w.label}`}
                data-feature-id="NEXUS_BTN_SCRUB_WINDOW"
                onClick={() => handleWindow(w.minutes)}
                className={`px-3 h-8 rounded-md border text-xs font-mono font-bold cursor-pointer transition ${
                  isActive ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {w.label}
              </button>
            );
          })}
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
          <Btn
            variant="primary"
            icon={RefreshCw}
            busy={busy === 'recorder'}
            onClick={() => loadRecorder(windowMinutes)}
            featureId="NEXUS_BTN_REFRESH_TIMELINE"
          >
            Refresh Timeline
          </Btn>
          <select
            aria-label="Event category filter"
            className="px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="ALL">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ErrorBanner error={recorderError} />

      <Panel title="Black-Box Timeline" icon={Activity}>
        <svg
          viewBox="0 0 1000 56"
          className="w-full h-14 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
          preserveAspectRatio="none"
          role="img"
          aria-label="Event density timeline"
        >
          {visibleEvents.map((e, idx) => {
            const x = ((e.epochMs - startMs) / (endMs - startMs || 1)) * 1000;
            if (x < 0 || x > 1000) return null;
            return (
              <line
                key={e.id || idx}
                x1={x}
                x2={x}
                y1={/ERROR|CRITICAL/i.test(e.severity || '') ? 6 : 26}
                y2={/ERROR|CRITICAL/i.test(e.severity || '') ? 26 : 50}
                stroke={sevColor(e.severity)}
                strokeWidth="2"
                opacity={e.epochMs <= cursorMs ? 1 : 0.25}
              />
            );
          })}
          <line x1={cursor} x2={cursor} y1="0" y2="56" stroke="#f59e0b" strokeWidth="2" />
        </svg>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="range"
            min="0"
            max="1000"
            value={cursor}
            onChange={(e) => setCursor(Number(e.target.value))}
            aria-label="Timeline scrubber"
            className="flex-1 min-w-[200px] accent-amber-500"
          />
          <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            {new Date(cursorMs).toLocaleTimeString()} | {eventsAtCursor.length} event(s),{' '}
            {errorsAtCursor} error(s) so far
          </span>
        </div>

        <div className="max-h-96 overflow-auto space-y-1">
          {visibleEvents.length === 0 && (
            <div className="text-[11px] text-zinc-500">
              {busy === 'recorder'
                ? 'Reading Cloud Audit and runtime error logs...'
                : 'No events in this window.'}
            </div>
          )}
          {visibleEvents.map((e, idx) => (
            <div
              key={e.id || idx}
              className={`flex flex-wrap items-start gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 ${
                e.epochMs <= cursorMs ? '' : 'opacity-40'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                style={{ backgroundColor: sevColor(e.severity) }}
              />
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                  <span>{e.timestamp}</span>
                  <Chip>{e.category}</Chip>
                  <Chip>{e.severity}</Chip>
                  {e.actor && <span>{e.actor}</span>}
                </div>
                <div className="text-xs text-zinc-900 dark:text-zinc-100">{e.summary}</div>
                <div className="text-[10px] font-mono text-zinc-500 truncate">
                  {e.methodName} {e.resourceName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Causal Correlations" icon={Radar}>
        {(recorder?.correlations || []).length === 0 && (
          <div className="text-[11px] text-zinc-500">
            No change event was followed by a burst of runtime errors in this window.
          </div>
        )}
        {(recorder?.correlations || []).map((c, idx) => (
          <div
            key={c.id || idx}
            className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 space-y-1"
          >
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <StatusPill tone="amber">
                CONFIDENCE {typeof c.confidence === 'number' ? `${Math.round(c.confidence * (c.confidence <= 1 ? 100 : 1))}%` : String(c.confidence ?? 'n/a')}
              </StatusPill>
              <span>{fmtNum(c.errorCount)} error(s) within {fmtNum(c.windowSec, 's')}</span>
            </div>
            <div className="text-xs text-zinc-900 dark:text-zinc-100">
              {typeof c.triggerEvent === 'string'
                ? c.triggerEvent
                : c.triggerEvent?.summary || itemLabel(c.triggerEvent)}
            </div>
            {c.explanation && (
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400">{c.explanation}</div>
            )}
          </div>
        ))}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Cloud Run Resilience Probe" icon={Gauge}>
          <div>
            <label className={LABEL_CLS}>Cloud Run Service</label>
            <select
              className={INPUT_CLS}
              value={canaryService}
              onChange={(e) => setCanaryService(e.target.value)}
            >
              <option value="">Select a service</option>
              {canaryTargets.map((t) => (
                <option key={targetName(t)} value={targetName(t)}>
                  {targetName(t)} {t.region || t.location ? `(${t.region || t.location})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Target URL</label>
              <input
                className={INPUT_CLS}
                value={probeUrl}
                onChange={(e) => setProbeUrl(e.target.value)}
                placeholder="https://service-abc123-uc.a.run.app"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Burst (1-10)</label>
              <input
                className={INPUT_CLS}
                type="number"
                min="1"
                max="10"
                value={burstCount}
                onChange={(e) => setBurstCount(e.target.value)}
              />
            </div>
          </div>
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              variant="primary"
              icon={Play}
              busy={busy === 'resilience'}
              disabled={!probeUrl.trim()}
              onClick={handleResilience}
              featureId="NEXUS_BTN_RUN_RESILIENCE_PROBE"
            >
              Run Resilience Probe
            </Btn>
          </div>
          {resilience && (
            <div className="space-y-1.5 text-[11px] font-mono text-zinc-800 dark:text-zinc-200">
              <div className="flex flex-wrap gap-2">
                <Chip>p50 {fmtNum(resilience.p50Ms, ' ms')}</Chip>
                <Chip>p95 {fmtNum(resilience.p95Ms, ' ms')}</Chip>
                {Object.entries(resilience.statusCounts || {}).map(([k, v]) => (
                  <Chip key={k}>
                    HTTP {k}: {String(v)}
                  </Chip>
                ))}
              </div>
              <div className="space-y-0.5 max-h-32 overflow-auto">
                {(resilience.samples || []).map((s, idx) => (
                  <div key={idx} className="text-zinc-600 dark:text-zinc-400">
                    #{idx + 1} {typeof s === 'object' ? `HTTP ${s.status ?? s.statusCode} ${fmtNum(s.latencyMs ?? s.ms, ' ms')}` : String(s)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Canary Traffic Shift" icon={Target}>
          <div className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Live traffic splits for{' '}
            <Chip>{canaryService || 'your Cloud Run services'}</Chip> are managed
            in the Cloud Run Fleet Manager, so there is a single place to shift
            revisions.
          </div>
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              variant="secondary"
              icon={ExternalLink}
              disabled={typeof onNavigateStudio !== 'function'}
              onClick={() => onNavigateStudio('CLOUD_RUN')}
              featureId="NEXUS_BTN_OPEN_CLOUD_RUN_CANARY"
            >
              Open Cloud Run Fleet Manager
            </Btn>
          </div>
        </Panel>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {!embeddedTab && header}
      {activeSubTab === 'TERRAFORM_DRIFT' && terraformTab}
      {activeSubTab === 'BLAST_RADIUS' && blastTab}
      {activeSubTab === 'VERTEX_ARENA' && arenaTab}
      {activeSubTab === 'FLIGHT_RECORDER' && recorderTab}
    </div>
  );
}

/* Embedded single-pillar panels hosted inside canonical studios. */
export function BlastRadiusPanel(props) {
  return <CloudFlightDeckNexusStudio {...props} embeddedTab="BLAST_RADIUS" />;
}
export function FlightRecorderPanel(props) {
  return <CloudFlightDeckNexusStudio {...props} embeddedTab="FLIGHT_RECORDER" />;
}
