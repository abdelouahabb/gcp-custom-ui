import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  Gauge,
  KeyRound,
  Globe,
  Radio,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Play,
  Loader2,
  AlertTriangle,
  BellPlus,
  Plus,
  Search,
  Cloud,
  Lock,
  History,
  Send,
  Eye,
  Camera,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Cpu,
} from 'lucide-react';

/* ============================================================================
 * Wave 26 - 4-Pillar Cloud Ops Frontier Studio
 * Static UI metadata only. Every quota metric, IAM service account key,
 * Workload Identity Pool, Cloud DNS zone, Certificate Manager cert, DNS/TLS
 * probe, and Pub/Sub topic/subscription/snapshot is queried live from
 * /api/project/:id/frontier/*.
 * ============================================================================ */

const INPUT_CLS =
  'w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500';

const LABEL_CLS =
  'block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1';

/* ----------------------------------------------------------------------------
 * Pure Helpers
 * ---------------------------------------------------------------------------- */

function isCancelled(err) {
  return Boolean(err?.__cancelledByUser || err?.response?.status === 499);
}

function extractError(err, fallback) {
  const data = err?.response?.data;
  return {
    error: data?.error || data?.message || err?.message || fallback,
    cmd: data?.enableApiCmd || data?.remediationCmd || data?.cliHint || '',
  };
}

function fmtNum(v, suffix = '') {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'n/a';
  return `${v}${suffix}`;
}

function fmtPct(v, digits = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '0.0%';
  return `${Number(v).toFixed(digits)}%`;
}

function shortId(v) {
  const s = String(v || '');
  return s.includes('/') ? s.split('/').pop() : s;
}

function decodeBase64Safe(b64) {
  if (!b64 || typeof b64 !== 'string') return '';
  try {
    const bin = window.atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    return b64;
  }
}

function parseAttributesInput(raw) {
  const out = {};
  String(raw || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const eq = pair.indexOf('=');
      if (eq > 0) {
        const k = pair.slice(0, eq).trim();
        const v = pair.slice(eq + 1).trim();
        if (k) out[k] = v;
      }
    });
  return out;
}

function normalizeQuotaEntry(q, defaultScope = 'PROJECT', defaultRegion = 'global') {
  if (!q || typeof q !== 'object') return null;
  const usage = Number(q.usage ?? 0);
  const limit = Number(q.limit ?? 0);
  const computedPct =
    q.utilizationPct !== undefined && q.utilizationPct !== null
      ? Number(q.utilizationPct)
      : limit > 0
      ? (usage / limit) * 100
      : 0;
  const utilizationPct = Number.isFinite(computedPct) ? computedPct : 0;
  const severity =
    q.severity ||
    (utilizationPct >= 85
      ? 'CRITICAL'
      : utilizationPct >= 70
      ? 'WARNING'
      : 'HEALTHY');
  const metric = String(q.metric || q.name || 'UNKNOWN_METRIC');
  const region = String(q.region || q.location || defaultRegion);
  const scope = q.scope || (region === 'global' ? defaultScope : 'REGIONAL');
  const isGpu = Boolean(
    q.isGpu || /GPU|NVIDIA|A100|H100|H200|B200|L4|T4|V100|P100|P4/i.test(metric)
  );
  return {
    metric,
    usage,
    limit,
    utilizationPct,
    severity,
    region,
    scope,
    isGpu,
  };
}

function flattenQuotas(quotasData) {
  if (!quotasData) return [];
  const rows = [];
  const projList = Array.isArray(quotasData.projectQuotas)
    ? quotasData.projectQuotas
    : [];
  projList.forEach((q) => {
    const n = normalizeQuotaEntry(q, 'PROJECT', q?.region || 'global');
    if (n) rows.push(n);
  });

  const regRaw = quotasData.regionalQuotas;
  if (Array.isArray(regRaw)) {
    regRaw.forEach((item) => {
      if (item && Array.isArray(item.quotas)) {
        item.quotas.forEach((q) => {
          const n = normalizeQuotaEntry(q, 'REGIONAL', item.region || item.name || 'regional');
          if (n) rows.push(n);
        });
      } else {
        const n = normalizeQuotaEntry(item, 'REGIONAL', item?.region || 'regional');
        if (n) rows.push(n);
      }
    });
  } else if (regRaw && typeof regRaw === 'object') {
    Object.entries(regRaw).forEach(([region, list]) => {
      if (Array.isArray(list)) {
        list.forEach((q) => {
          const n = normalizeQuotaEntry(q, 'REGIONAL', region);
          if (n) rows.push(n);
        });
      }
    });
  }

  if (rows.length === 0 && Array.isArray(quotasData.gpuQuotas)) {
    quotasData.gpuQuotas.forEach((q) => {
      const n = normalizeQuotaEntry(q, q?.region ? 'REGIONAL' : 'PROJECT', q?.region || 'global');
      if (n) rows.push(n);
    });
  }

  return rows.sort((a, b) => b.utilizationPct - a.utilizationPct || b.usage - a.usage);
}

function extractResolverRecords(resolverObj) {
  if (!resolverObj || typeof resolverObj !== 'object') {
    return { rttMs: null, byType: {}, errors: {} };
  }
  const rttMs =
    resolverObj.rttMs ?? resolverObj.latencyMs ?? resolverObj.durationMs ?? null;
  const src =
    resolverObj.records && typeof resolverObj.records === 'object'
      ? resolverObj.records
      : resolverObj;
  const types = ['A', 'AAAA', 'MX', 'TXT', 'CAA', 'NS'];
  const byType = {};
  types.forEach((t) => {
    const val = src[t] ?? src[t.toLowerCase()];
    if (Array.isArray(val)) {
      byType[t] = val.map((entry) => {
        if (entry === null || entry === undefined) return '';
        if (Array.isArray(entry)) return entry.join('');
        if (typeof entry === 'object') {
          if (entry.exchange !== undefined) {
            return `${entry.priority ?? 0} ${entry.exchange}`;
          }
          if (entry.issue || entry.iodef) {
            return `${entry.critical ?? 0} ${entry.issue ? `issue "${entry.issue}"` : `iodef "${entry.iodef}"`}`;
          }
          return entry.value || entry.address || JSON.stringify(entry);
        }
        return String(entry);
      }).filter(Boolean);
    } else {
      byType[t] = [];
    }
  });
  return { rttMs, byType, errors: resolverObj.errors || {} };
}

/* ----------------------------------------------------------------------------
 * Shared Presentational Primitives
 * ---------------------------------------------------------------------------- */

function Chip({ children, className = '' }) {
  return (
    <code
      className={`px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 ${className}`}
    >
      {children}
    </code>
  );
}

function StatusPill({ tone = 'zinc', children }) {
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
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5">
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

function ErrorBanner({ errState }) {
  if (!errState?.error) return null;
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
      <div className="flex items-start gap-2 text-xs text-zinc-900 dark:text-zinc-100">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <span className="font-semibold">{errState.error}</span>
      </div>
      {errState.cmd && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400">
          <span>Remediation CLI:</span>
          <Chip className="break-all select-all">{errState.cmd}</Chip>
        </div>
      )}
    </div>
  );
}

function ApiStatusPills({ apiStatus }) {
  if (!apiStatus || typeof apiStatus !== 'object') return null;
  return (
    <>
      {Object.entries(apiStatus)
        .filter(
          ([k, v]) =>
            v !== null &&
            v !== undefined &&
            k !== 'error' &&
            k !== 'enableApiCmd' &&
            k !== 'remediationCmd'
        )
        .map(([k, v]) => {
          const statusStr =
            typeof v === 'object'
              ? v?.status || (v?.ok ? 'ENABLED' : 'RESTRICTED')
              : String(v);
          const isGood = /ENABLED|OK|ACTIVE|READY|true/i.test(statusStr);
          return (
            <StatusPill key={k} tone={isGood ? 'emerald' : 'amber'}>
              {k}: {statusStr}
            </StatusPill>
          );
        })}
    </>
  );
}

/* ============================================================================
 * Main Studio Component
 * ============================================================================ */

export default function OpsFrontierPanel({
  projectId,
  onShowToast,
  onNavigateStudio,
  panel,
}) {
  const [activeSubTabState, setActiveSubTab] = useState(panel || 'QUOTA_RADAR');
  const activeSubTab = panel || activeSubTabState;
  const projLabel = projectId || 'no-project-selected';
  const [busy, setBusy] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);

  // Pillar 1: QUOTA_RADAR
  const [quotasData, setQuotasData] = useState(null);
  const [quotasErr, setQuotasErr] = useState({ error: '', cmd: '' });
  const [quotaScopeFilter, setQuotaScopeFilter] = useState('ALL');
  const [quotaRegionFilter, setQuotaRegionFilter] = useState('ALL');
  const [quotaSearch, setQuotaSearch] = useState('');
  const [alertMetric, setAlertMetric] = useState('');
  const [alertThreshold, setAlertThreshold] = useState(80);
  const [lastCreatedAlert, setLastCreatedAlert] = useState(null);

  // Pillar 2: WIF_KEYLESS
  const [wifData, setWifData] = useState(null);
  const [wifErr, setWifErr] = useState({ error: '', cmd: '' });
  const [poolIdInput, setPoolIdInput] = useState('github-actions-pool');
  const [poolDisplayInput, setPoolDisplayInput] = useState('GitHub Actions OIDC Pool');
  const [oidcPlatform, setOidcPlatform] = useState('githubActions');

  // Pillar 3: CLOUD_DNS_TLS
  const [dnsData, setDnsData] = useState(null);
  const [dnsErr, setDnsErr] = useState({ error: '', cmd: '' });
  const [probeDomain, setProbeDomain] = useState('cloud.google.com');
  const [probeResult, setProbeResult] = useState(null);

  // Pillar 4: PUBSUB_TIMEMACHINE
  const [pubsubData, setPubsubData] = useState(null);
  const [pubsubErr, setPubsubErr] = useState({ error: '', cmd: '' });
  const [selectedTopic, setSelectedTopic] = useState('');
  const [publishPayload, setPublishPayload] = useState(
    '{"event":"ops.frontier.heartbeat","severity":"INFO"}'
  );
  const [publishAttrs, setPublishAttrs] = useState('source=cloudpulse,wave=26');
  const [lastPublishReceipt, setLastPublishReceipt] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState('');
  const [peekedMessages, setPeekedMessages] = useState([]);
  const [newSnapshotId, setNewSnapshotId] = useState('');
  const [seekSnapshotTarget, setSeekSnapshotTarget] = useState('');

  const loadedTabsRef = useRef({ project: '', tabs: new Set() });

  const base = useMemo(
    () =>
      projectId
        ? `/api/project/${encodeURIComponent(projectId)}/frontier`
        : '',
    [projectId]
  );

  const toast = useCallback(
    (msg, type = 'success') => {
      if (typeof onShowToast === 'function') onShowToast(msg, type);
    },
    [onShowToast]
  );

  const copyText = useCallback(
    (key, text, label = 'Copied to clipboard.') => {
      if (!text) return;
      navigator.clipboard?.writeText(String(text));
      setCopiedKey(key);
      toast(label);
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1800);
    },
    [toast]
  );

  /* --------------------------------------------------------------------------
   * Pillar 1 Handlers: Cloud Quota & GPU Capacity Radar
   * -------------------------------------------------------------------------- */

  const loadQuotas = useCallback(async () => {
    if (!projectId) return;
    setBusy('quotas');
    setQuotasErr({ error: '', cmd: '' });
    try {
      const res = await axios.get(`${base}/quotas`);
      setQuotasData(res.data);
      const flat = flattenQuotas(res.data);
      if (flat[0]) {
        setAlertMetric((cur) => cur || flat[0].metric);
      }
    } catch (err) {
      if (isCancelled(err)) return;
      setQuotasErr(extractError(err, 'Failed to fetch live Compute & GPU quotas.'));
    } finally {
      setBusy('');
    }
  }, [base, projectId]);

  const handleCreateQuotaAlert = useCallback(async () => {
    if (!projectId || !alertMetric.trim()) return;
    setBusy('quota-alert');
    setQuotasErr({ error: '', cmd: '' });
    try {
      const res = await axios.post(`${base}/quota-alert`, {
        metricName: alertMetric.trim(),
        thresholdPct: Number(alertThreshold) || 80,
      });
      setLastCreatedAlert(res.data);
      toast(
        `Cloud Monitoring quota alert created for ${alertMetric.trim()} at ${
          Number(alertThreshold) || 80
        }%.`
      );
    } catch (err) {
      if (isCancelled(err)) return;
      setQuotasErr(
        extractError(err, 'Failed to create Cloud Monitoring quota alert policy.')
      );
    } finally {
      setBusy('');
    }
  }, [alertMetric, alertThreshold, base, projectId, toast]);

  /* --------------------------------------------------------------------------
   * Pillar 2 Handlers: Zero-Trust WIF & SA Key Hunter
   * -------------------------------------------------------------------------- */

  const loadWif = useCallback(async () => {
    if (!projectId) return;
    setBusy('wif');
    setWifErr({ error: '', cmd: '' });
    try {
      const res = await axios.get(`${base}/wif-overview`);
      setWifData(res.data);
    } catch (err) {
      if (isCancelled(err)) return;
      setWifErr(
        extractError(
          err,
          'Failed to scan IAM Service Account keys and Workload Identity Pools.'
        )
      );
    } finally {
      setBusy('');
    }
  }, [base, projectId]);

  const handleCreateWifPool = useCallback(async () => {
    if (!projectId || !poolIdInput.trim()) return;
    setBusy('create-wif-pool');
    setWifErr({ error: '', cmd: '' });
    try {
      await axios.post(`${base}/wif-action`, {
        action: 'CREATE_WIF_POOL',
        poolId: poolIdInput.trim(),
        displayName: poolDisplayInput.trim() || poolIdInput.trim(),
      });
      toast(`Workload Identity Pool "${poolIdInput.trim()}" created.`);
      await loadWif();
    } catch (err) {
      if (isCancelled(err)) return;
      setWifErr(extractError(err, 'Failed to create Workload Identity Pool.'));
    } finally {
      setBusy('');
    }
  }, [base, loadWif, poolDisplayInput, poolIdInput, projectId, toast]);

  /* --------------------------------------------------------------------------
   * Pillar 3 Handlers: Cloud DNS, Certs & Multi-Resolver X-Ray
   * -------------------------------------------------------------------------- */

  const loadDns = useCallback(async () => {
    if (!projectId) return;
    setBusy('dns');
    setDnsErr({ error: '', cmd: '' });
    try {
      const res = await axios.get(`${base}/dns-overview`);
      setDnsData(res.data);
    } catch (err) {
      if (isCancelled(err)) return;
      setDnsErr(
        extractError(err, 'Failed to load Cloud DNS zones and Certificate Manager inventory.')
      );
    } finally {
      setBusy('');
    }
  }, [base, projectId]);

  const handleRunDnsProbe = useCallback(async () => {
    const cleanDomain = probeDomain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '').replace(/\.$/, '');
    if (!projectId || !cleanDomain) return;
    setBusy('dns-probe');
    setDnsErr({ error: '', cmd: '' });
    try {
      const res = await axios.post(`${base}/dns-probe`, { domain: cleanDomain });
      setProbeResult(res.data);
      toast(`Completed multi-resolver & :443 TLS probe for ${cleanDomain}.`);
    } catch (err) {
      if (isCancelled(err)) return;
      setDnsErr(extractError(err, `DNS/TLS probe failed for ${cleanDomain}.`));
    } finally {
      setBusy('');
    }
  }, [base, probeDomain, projectId, toast]);

  /* --------------------------------------------------------------------------
   * Pillar 4 Handlers: Pub/Sub DLQ & Seek Time-Machine
   * -------------------------------------------------------------------------- */

  const loadPubsub = useCallback(async () => {
    if (!projectId) return;
    setBusy('pubsub');
    setPubsubErr({ error: '', cmd: '' });
    try {
      const res = await axios.get(`${base}/pubsub-overview`);
      setPubsubData(res.data);
      const topics = Array.isArray(res.data?.topics) ? res.data.topics : [];
      const subs = Array.isArray(res.data?.subscriptions) ? res.data.subscriptions : [];
      const snaps = Array.isArray(res.data?.snapshots) ? res.data.snapshots : [];
      if (topics[0]) {
        const firstTopic = topics[0].name || topics[0].topicName || String(topics[0]);
        setSelectedTopic((cur) => cur || firstTopic);
      }
      if (subs[0]) {
        const firstSub = subs[0].name || subs[0].subscriptionName || String(subs[0]);
        setSelectedSubscription((cur) => cur || firstSub);
      }
      if (snaps[0]) {
        const firstSnap = snaps[0].name || snaps[0].snapshotName || String(snaps[0]);
        setSeekSnapshotTarget((cur) => cur || firstSnap);
      }
    } catch (err) {
      if (isCancelled(err)) return;
      setPubsubErr(
        extractError(err, 'Failed to query Pub/Sub topics, subscriptions, and snapshots.')
      );
    } finally {
      setBusy('');
    }
  }, [base, projectId]);

  const handlePublishEvent = useCallback(async () => {
    if (!projectId || !selectedTopic.trim()) return;
    setBusy('publish');
    setPubsubErr({ error: '', cmd: '' });
    try {
      const attributes = parseAttributesInput(publishAttrs);
      const res = await axios.post(`${base}/pubsub-action`, {
        action: 'PUBLISH_EVENT',
        topicName: selectedTopic.trim(),
        payload: publishPayload,
        attributes,
      });
      setLastPublishReceipt(res.data);
      toast(`Published message to ${shortId(selectedTopic.trim())}.`);
    } catch (err) {
      if (isCancelled(err)) return;
      setPubsubErr(extractError(err, 'Failed to publish Pub/Sub event.'));
    } finally {
      setBusy('');
    }
  }, [base, projectId, publishAttrs, publishPayload, selectedTopic, toast]);

  const handlePullPeek = useCallback(async () => {
    if (!projectId || !selectedSubscription.trim()) return;
    setBusy('peek');
    setPubsubErr({ error: '', cmd: '' });
    try {
      const res = await axios.post(`${base}/pubsub-action`, {
        action: 'PULL_PEEK',
        subscriptionName: selectedSubscription.trim(),
      });
      const msgs =
        res.data?.messages ||
        res.data?.receivedMessages ||
        res.data?.result?.receivedMessages ||
        [];
      setPeekedMessages(Array.isArray(msgs) ? msgs : []);
      toast(
        `Peeked ${Array.isArray(msgs) ? msgs.length : 0} message(s) without acknowledging.`
      );
    } catch (err) {
      if (isCancelled(err)) return;
      setPubsubErr(extractError(err, 'Failed to peek Pub/Sub subscription messages.'));
    } finally {
      setBusy('');
    }
  }, [base, projectId, selectedSubscription, toast]);

  const handleCreateSnapshot = useCallback(async () => {
    if (!projectId || !selectedSubscription.trim() || !newSnapshotId.trim()) return;
    setBusy('create-snap');
    setPubsubErr({ error: '', cmd: '' });
    try {
      await axios.post(`${base}/pubsub-action`, {
        action: 'CREATE_SNAPSHOT',
        subscriptionName: selectedSubscription.trim(),
        snapshotName: newSnapshotId.trim(),
      });
      toast(`Created Pub/Sub snapshot "${shortId(newSnapshotId.trim())}".`);
      setNewSnapshotId('');
      await loadPubsub();
    } catch (err) {
      if (isCancelled(err)) return;
      setPubsubErr(extractError(err, 'Failed to create Pub/Sub snapshot.'));
    } finally {
      setBusy('');
    }
  }, [base, loadPubsub, newSnapshotId, projectId, selectedSubscription, toast]);

  const handleSeekSnapshot = useCallback(async () => {
    if (!projectId || !selectedSubscription.trim() || !seekSnapshotTarget.trim()) return;
    setBusy('seek-snap');
    setPubsubErr({ error: '', cmd: '' });
    try {
      await axios.post(`${base}/pubsub-action`, {
        action: 'SEEK_SNAPSHOT',
        subscriptionName: selectedSubscription.trim(),
        snapshotName: seekSnapshotTarget.trim(),
      });
      toast(
        `Rewound subscription ${shortId(selectedSubscription.trim())} to snapshot ${shortId(
          seekSnapshotTarget.trim()
        )}.`
      );
    } catch (err) {
      if (isCancelled(err)) return;
      setPubsubErr(extractError(err, 'Failed to seek subscription to snapshot.'));
    } finally {
      setBusy('');
    }
  }, [base, projectId, seekSnapshotTarget, selectedSubscription, toast]);

  const handleDeleteSnapshot = useCallback(
    async (snapName) => {
      if (!projectId || !snapName) return;
      setBusy(`del-snap-${snapName}`);
      setPubsubErr({ error: '', cmd: '' });
      try {
        await axios.post(`${base}/pubsub-action`, {
          action: 'DELETE_SNAPSHOT',
          snapshotName: snapName,
        });
        toast(`Deleted Pub/Sub snapshot ${shortId(snapName)}.`);
        if (seekSnapshotTarget === snapName) setSeekSnapshotTarget('');
        await loadPubsub();
      } catch (err) {
        if (isCancelled(err)) return;
        setPubsubErr(extractError(err, 'Failed to delete Pub/Sub snapshot.'));
      } finally {
        setBusy('');
      }
    },
    [base, loadPubsub, projectId, seekSnapshotTarget, toast]
  );

  /* --------------------------------------------------------------------------
   * Auto-load active tab on project or sub-tab change
   * -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!projectId) return;
    if (loadedTabsRef.current.project !== projectId) {
      loadedTabsRef.current = { project: projectId, tabs: new Set() };
      setQuotasData(null);
      setWifData(null);
      setDnsData(null);
      setPubsubData(null);
      setProbeResult(null);
      setPeekedMessages([]);
      setLastCreatedAlert(null);
      setLastPublishReceipt(null);
      setSelectedTopic('');
      setSelectedSubscription('');
      setSeekSnapshotTarget('');
    }
    if (loadedTabsRef.current.tabs.has(activeSubTab)) return;
    loadedTabsRef.current.tabs.add(activeSubTab);

    if (activeSubTab === 'QUOTA_RADAR') loadQuotas();
    else if (activeSubTab === 'WIF_KEYLESS') loadWif();
    else if (activeSubTab === 'CLOUD_DNS_TLS') loadDns();
    else if (activeSubTab === 'PUBSUB_TIMEMACHINE') loadPubsub();
  }, [activeSubTab, loadDns, loadPubsub, loadQuotas, loadWif, projectId]);

  /* --------------------------------------------------------------------------
   * Derived View Models
   * -------------------------------------------------------------------------- */

  const allQuotaRows = useMemo(() => flattenQuotas(quotasData), [quotasData]);

  const quotaRegions = useMemo(
    () =>
      Array.from(
        new Set(allQuotaRows.map((r) => r.region).filter((r) => r && r !== 'global'))
      ).sort(),
    [allQuotaRows]
  );

  const filteredQuotaRows = useMemo(() => {
    const q = quotaSearch.trim().toLowerCase();
    return allQuotaRows.filter((row) => {
      if (quotaScopeFilter === 'PROJECT' && row.scope !== 'PROJECT') return false;
      if (quotaScopeFilter === 'REGIONAL' && row.scope !== 'REGIONAL') return false;
      if (quotaScopeFilter === 'GPU' && !row.isGpu) return false;
      if (quotaScopeFilter === 'NON_ZERO' && row.usage <= 0) return false;
      if (quotaRegionFilter !== 'ALL' && row.region !== quotaRegionFilter) return false;
      if (q && !row.metric.toLowerCase().includes(q) && !row.region.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [allQuotaRows, quotaRegionFilter, quotaScopeFilter, quotaSearch]);

  const quotaCliText = useMemo(() => {
    if (quotasData?.quotaCli) return quotasData.quotaCli;
    if (!projectId) return '';
    return `gcloud alpha services quota list --service=compute.googleapis.com --consumer=projects/${projectId}`;
  }, [projectId, quotasData]);

  const quotaMetricOptions = useMemo(
    () => Array.from(new Set(allQuotaRows.map((r) => r.metric))).slice(0, 120),
    [allQuotaRows]
  );

  const riskyKeys = useMemo(
    () => (Array.isArray(wifData?.riskyKeys) ? wifData.riskyKeys : []),
    [wifData]
  );
  const wifPools = useMemo(
    () => (Array.isArray(wifData?.pools) ? wifData.pools : []),
    [wifData]
  );
  const serviceAccounts = useMemo(
    () => (Array.isArray(wifData?.serviceAccounts) ? wifData.serviceAccounts : []),
    [wifData]
  );

  const activeOidcYaml = useMemo(() => {
    const tpl = wifData?.oidcYamlTemplates?.[oidcPlatform];
    if (tpl) return tpl;
    if (!projectId) return '# Select a live GCP project to generate keyless OIDC workflow YAML.';
    if (oidcPlatform === 'gitlabCi') {
      return [
        'gcp-keyless-auth:',
        '  image: google/cloud-sdk:slim',
        '  id_tokens:',
        '    GITLAB_OIDC_TOKEN:',
        `      aud: //iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/${poolIdInput || 'gitlab-pool'}/providers/gitlab-oidc`,
        '  script:',
        '    - echo "$GITLAB_OIDC_TOKEN" > /tmp/oidc_token.jwt',
        `    - gcloud iam workload-identity-pools create-cred-config projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/${poolIdInput || 'gitlab-pool'}/providers/gitlab-oidc --credential-source-file=/tmp/oidc_token.jwt --output-file=/tmp/gcp_cred.json`,
        `    - gcloud auth login --cred-file=/tmp/gcp_cred.json --project=${projectId}`,
      ].join('\n');
    }
    return [
      'name: GCP Keyless OIDC Deploy',
      'on: [push]',
      'permissions:',
      '  contents: read',
      '  id-token: write',
      'jobs:',
      '  deploy:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      '      - uses: actions/checkout@v4',
      '      - uses: google-github-actions/auth@v2',
      '        with:',
      `          project_id: '${projectId}'`,
      `          workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/${poolIdInput || 'github-actions-pool'}/providers/github-oidc'`,
    ].join('\n');
  }, [oidcPlatform, poolIdInput, projectId, wifData]);

  const dnsZones = useMemo(
    () => (Array.isArray(dnsData?.zones) ? dnsData.zones : []),
    [dnsData]
  );
  const managedCerts = useMemo(
    () => (Array.isArray(dnsData?.certificates) ? dnsData.certificates : []),
    [dnsData]
  );

  const googleRes = useMemo(
    () => extractResolverRecords(probeResult?.resolvers?.google),
    [probeResult]
  );
  const cloudflareRes = useMemo(
    () => extractResolverRecords(probeResult?.resolvers?.cloudflare),
    [probeResult]
  );

  const resolverParity = useMemo(() => {
    if (!probeResult) return null;
    const gA = [...(googleRes.byType.A || [])].sort().join(',');
    const cA = [...(cloudflareRes.byType.A || [])].sort().join(',');
    return gA === cA;
  }, [cloudflareRes, googleRes, probeResult]);

  const topics = useMemo(
    () => (Array.isArray(pubsubData?.topics) ? pubsubData.topics : []),
    [pubsubData]
  );
  const subscriptions = useMemo(
    () => (Array.isArray(pubsubData?.subscriptions) ? pubsubData.subscriptions : []),
    [pubsubData]
  );
  const snapshots = useMemo(
    () => (Array.isArray(pubsubData?.snapshots) ? pubsubData.snapshots : []),
    [pubsubData]
  );
  const dlqSubCount = useMemo(
    () =>
      subscriptions.filter(
        (s) => Boolean(s?.deadLetterPolicy?.deadLetterTopic || s?.deadLetterTopic)
      ).length,
    [subscriptions]
  );

  /* ==========================================================================
   * Sub-Tab 1: QUOTA_RADAR (Cloud Quota & GPU Capacity Radar)
   * ========================================================================== */

  const quotaSummary = quotasData?.summary || {};
  const totalMetrics = quotaSummary.totalMetrics ?? allQuotaRows.length;
  const criticalCount =
    quotaSummary.criticalCount ??
    allQuotaRows.filter((r) => r.utilizationPct >= 85).length;
  const warningCount =
    quotaSummary.warningCount ??
    allQuotaRows.filter((r) => r.utilizationPct >= 70 && r.utilizationPct < 85).length;
  const peakPct =
    quotaSummary.maxUtilizationPct ??
    (allQuotaRows[0] ? allQuotaRows[0].utilizationPct : 0);
  const gpuCount = Array.isArray(quotasData?.gpuQuotas)
    ? quotasData.gpuQuotas.length
    : allQuotaRows.filter((r) => r.isGpu).length;

  const quotaTab = (
    <div className="space-y-3">
      <KpiStrip
        cells={[
          { label: 'Total Metrics', value: fmtNum(totalMetrics), sub: `${gpuCount} GPU` },
          { label: 'Critical >=85%', value: fmtNum(criticalCount), sub: 'exhaustion risk' },
          { label: 'Warning >=70%', value: fmtNum(warningCount), sub: 'headroom watch' },
          { label: 'Peak Utilization %', value: fmtPct(peakPct) },
          {
            label: 'Last Scan',
            value: quotasData?.timestamp
              ? new Date(quotasData.timestamp).toLocaleTimeString()
              : 'n/a',
          },
        ]}
      />

      <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
        <Btn
          variant="primary"
          icon={RefreshCw}
          busy={busy === 'quotas'}
          disabled={!projectId}
          onClick={loadQuotas}
          featureId="W26_BTN_REFRESH_QUOTAS"
        >
          Refresh Quotas
        </Btn>
        <Btn
          variant="secondary"
          icon={copiedKey === 'quota-cli' ? Check : Copy}
          disabled={!quotaCliText}
          onClick={() =>
            copyText('quota-cli', quotaCliText, 'Copied gcloud quota CLI command.')
          }
          featureId="W26_BTN_COPY_QUOTA_CLI"
        >
          {copiedKey === 'quota-cli' ? 'Copied Quota CLI' : 'Copy Quota CLI'}
        </Btn>
        <ApiStatusPills apiStatus={quotasData?.apiStatus} />
      </div>

      <ErrorBanner errState={quotasErr} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Panel
          title="Live Compute, Regional & GPU Quota Utilization"
          icon={Gauge}
          className="xl:col-span-2"
          right={
            <StatusPill tone="zinc">
              Showing {Math.min(filteredQuotaRows.length, 150)} of {filteredQuotaRows.length}
            </StatusPill>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className={LABEL_CLS}>Scope / Accelerator Filter</label>
              <select
                aria-label="Quota scope filter"
                className={INPUT_CLS}
                value={quotaScopeFilter}
                onChange={(e) => setQuotaScopeFilter(e.target.value)}
              >
                <option value="ALL">All Quotas ({allQuotaRows.length})</option>
                <option value="PROJECT">Project-Wide Only</option>
                <option value="REGIONAL">Regional Quotas Only</option>
                <option value="GPU">GPU & Accelerator Quotas ({gpuCount})</option>
                <option value="NON_ZERO">Active Usage &gt; 0 Only</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Region Filter</label>
              <select
                aria-label="Quota region filter"
                className={INPUT_CLS}
                value={quotaRegionFilter}
                onChange={(e) => setQuotaRegionFilter(e.target.value)}
              >
                <option value="ALL">All Regions & Global</option>
                <option value="global">global (Project-level)</option>
                {quotaRegions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Search Metric</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2 pointer-events-none" />
                <input
                  className={`${INPUT_CLS} pl-8`}
                  value={quotaSearch}
                  onChange={(e) => setQuotaSearch(e.target.value)}
                  placeholder="CPUS, NVIDIA_L4, SSD..."
                />
              </div>
            </div>
          </div>

          <div className="overflow-auto max-h-96 rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-[11px] font-mono">
              <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                <tr>
                  <th className="text-left px-2.5 py-1.5">Metric</th>
                  <th className="text-left px-2.5 py-1.5">Scope</th>
                  <th className="text-right px-2.5 py-1.5">Usage / Limit</th>
                  <th className="text-left px-2.5 py-1.5 w-44">Utilization</th>
                  <th className="text-left px-2.5 py-1.5">Severity</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuotaRows.slice(0, 150).map((row, idx) => {
                  const pctClamped = Math.max(0, Math.min(100, row.utilizationPct));
                  const barTone =
                    row.severity === 'CRITICAL'
                      ? 'bg-rose-500'
                      : row.severity === 'WARNING'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';
                  const pillTone =
                    row.severity === 'CRITICAL'
                      ? 'rose'
                      : row.severity === 'WARNING'
                      ? 'amber'
                      : 'emerald';
                  return (
                    <tr
                      key={`${row.metric}-${row.region}-${idx}`}
                      className="border-t border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                    >
                      <td className="px-2.5 py-1.5">
                        <div className="flex items-center gap-1.5">
                          {row.isGpu && <Cpu className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span className="font-semibold">{row.metric}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <Chip>{row.region}</Chip>
                      </td>
                      <td className="px-2.5 py-1.5 text-right whitespace-nowrap">
                        {row.usage} / {row.limit}
                      </td>
                      <td className="px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full ${barTone}`}
                              style={{ width: `${pctClamped}%` }}
                            />
                          </div>
                          <span className="w-12 text-right">{fmtPct(row.utilizationPct)}</span>
                        </div>
                      </td>
                      <td className="px-2.5 py-1.5">
                        <StatusPill tone={pillTone}>{row.severity}</StatusPill>
                      </td>
                    </tr>
                  );
                })}
                {filteredQuotaRows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-4 text-zinc-500">
                      {busy === 'quotas'
                        ? 'Scanning live Compute & GPU quotas...'
                        : 'No matching quota metrics found for the current filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Cloud Monitoring Quota Alert Synthesizer" icon={BellPlus}>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Creates a live Cloud Monitoring alert policy on{' '}
            <Chip>monitoring.googleapis.com/v3</Chip> before regional or project
            quotas hit hard saturation.
          </p>
          {quotaMetricOptions.length > 0 && (
            <div>
              <label className={LABEL_CLS}>Pick Discovered Quota Metric</label>
              <select
                aria-label="Discovered quota metric"
                className={INPUT_CLS}
                value={quotaMetricOptions.includes(alertMetric) ? alertMetric : ''}
                onChange={(e) => {
                  if (e.target.value) setAlertMetric(e.target.value);
                }}
              >
                <option value="">-- Select from live metrics --</option>
                {quotaMetricOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className={LABEL_CLS}>Quota Metric Name</label>
            <input
              className={INPUT_CLS}
              value={alertMetric}
              onChange={(e) => setAlertMetric(e.target.value)}
              placeholder="CPUS or NVIDIA_L4_GPUS"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Alert Threshold (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              className={INPUT_CLS}
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
            />
          </div>
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              variant="primary"
              icon={BellPlus}
              busy={busy === 'quota-alert'}
              disabled={!projectId || !alertMetric.trim()}
              onClick={handleCreateQuotaAlert}
              featureId="W26_BTN_CREATE_QUOTA_ALERT"
            >
              Create Quota Alert
            </Btn>
          </div>
          {lastCreatedAlert && (
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-[11px] font-mono space-y-1">
              <div className="text-emerald-700 dark:text-emerald-300 font-bold">
                Alert Policy Provisioned
              </div>
              <div className="break-all text-zinc-700 dark:text-zinc-300">
                {lastCreatedAlert?.policy?.name ||
                  lastCreatedAlert?.alertPolicy?.name ||
                  lastCreatedAlert?.name ||
                  `${alertMetric} >= ${alertThreshold}%`}
              </div>
            </div>
          )}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
            <div className={LABEL_CLS}>Equivalent Quota Audit CLI</div>
            <pre className="p-2 rounded bg-zinc-100 dark:bg-zinc-900 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto">
              {quotaCliText}
            </pre>
          </div>
        </Panel>
      </div>
    </div>
  );

  /* ==========================================================================
   * Sub-Tab 2: WIF_KEYLESS (Zero-Trust WIF & SA Key Hunter)
   * ========================================================================== */

  const aged90KeysCount = riskyKeys.filter((k) => Number(k.ageDays ?? 0) >= 90).length;

  const wifTab = (
    <div className="space-y-3">
      <KpiStrip
        cells={[
          {
            label: 'User-Managed SA Keys',
            value: fmtNum(riskyKeys.length),
            sub: riskyKeys.length === 0 ? 'zero-trust clean' : 'long-lived credentials',
          },
          { label: 'Keys >= 90d Old', value: fmtNum(aged90KeysCount) },
          { label: 'WIF Pools', value: fmtNum(wifPools.length), sub: 'global OIDC' },
          { label: 'Service Accounts', value: fmtNum(serviceAccounts.length) },
          {
            label: 'Posture',
            value: riskyKeys.length === 0 && wifPools.length > 0 ? 'KEYLESS' : riskyKeys.length === 0 ? 'NO KEYS' : 'AT RISK',
          },
        ]}
      />

      <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
        <Btn
          variant="primary"
          icon={RefreshCw}
          busy={busy === 'wif'}
          disabled={!projectId}
          onClick={loadWif}
          featureId="W26_BTN_REFRESH_WIF"
        >
          Refresh WIF &amp; Keys
        </Btn>
        <ApiStatusPills apiStatus={wifData?.apiStatus} />
      </div>

      <ErrorBanner errState={wifErr} />

      <Panel
        title="Service Account Key Hunter"
        icon={KeyRound}
        right={
          <StatusPill tone={riskyKeys.length === 0 ? 'emerald' : 'rose'}>
            {riskyKeys.length === 0
              ? '0 USER-MANAGED KEYS'
              : `${riskyKeys.length} STATIC KEY(S) EXPOSED`}
          </StatusPill>
        }
      >
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {riskyKeys.length === 0
            ? 'No user-managed Service Account JSON keys detected across inspected accounts.'
            : `${aged90KeysCount} of ${riskyKeys.length} user-managed key(s) are 90 days or older.`}{' '}
          Key inspection, rotation and deletion live in the IAM, KMS &amp;
          Time-Machine Studio so there is a single place to revoke credentials.
        </p>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            variant="secondary"
            icon={ExternalLink}
            disabled={typeof onNavigateStudio !== 'function'}
            onClick={() => onNavigateStudio('SOVEREIGN_STUDIO', 'IAM_SURGEON_SA_VAULT')}
            featureId="W26_BTN_OPEN_SA_VAULT"
          >
            Manage SA Keys in IAM Studio
          </Btn>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Workload Identity Pools & Provisioner" icon={Lock}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className={LABEL_CLS}>Workload Identity Pool ID</label>
              <input
                className={INPUT_CLS}
                value={poolIdInput}
                onChange={(e) => setPoolIdInput(e.target.value)}
                placeholder="github-actions-pool"
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Display Name</label>
              <input
                className={INPUT_CLS}
                value={poolDisplayInput}
                onChange={(e) => setPoolDisplayInput(e.target.value)}
                placeholder="GitHub Actions OIDC Pool"
              />
            </div>
          </div>
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              variant="primary"
              icon={Plus}
              busy={busy === 'create-wif-pool'}
              disabled={!projectId || !poolIdInput.trim()}
              onClick={handleCreateWifPool}
              featureId="W26_BTN_CREATE_WIF_POOL"
            >
              Create WIF Pool
            </Btn>
          </div>

          <div className="space-y-1.5 max-h-60 overflow-auto pt-1">
            {wifPools.map((pool, idx) => {
              const pName = pool.name || pool.workloadIdentityPoolId || `pool-${idx}`;
              const providers = Array.isArray(pool.providers) ? pool.providers : [];
              return (
                <div
                  key={pName}
                  className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {pool.displayName || shortId(pName)}
                    </span>
                    <StatusPill tone={pool.disabled ? 'amber' : 'emerald'}>
                      {pool.state || (pool.disabled ? 'DISABLED' : 'ACTIVE')}
                    </StatusPill>
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 break-all">
                    {pName}
                  </div>
                  {providers.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {providers.map((pr, pIdx) => (
                        <Chip key={`${pr.name || pIdx}`}>
                          provider: {shortId(pr.name || pr.displayName || pr)}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {wifPools.length === 0 && (
              <div className="text-xs text-zinc-500 py-2">
                No Workload Identity Pools discovered in global location yet.
              </div>
            )}
          </div>
        </Panel>

        <Panel
          title="Keyless CI/CD OIDC Workflow Exporter"
          icon={ShieldCheck}
          right={
            <select
              aria-label="OIDC CI platform"
              className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              value={oidcPlatform}
              onChange={(e) => setOidcPlatform(e.target.value)}
            >
              <option value="githubActions">GitHub Actions OIDC</option>
              <option value="gitlabCi">GitLab CI Keyless OIDC</option>
            </select>
          }
        >
          <pre className="p-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-auto max-h-64 leading-relaxed">
            {activeOidcYaml}
          </pre>
          <div data-action-toolbar="true" className="flex flex-wrap gap-2">
            <Btn
              variant="secondary"
              icon={copiedKey === 'oidc-yaml' ? Check : Copy}
              disabled={!activeOidcYaml}
              onClick={() =>
                copyText(
                  'oidc-yaml',
                  activeOidcYaml,
                  `Copied ${
                    oidcPlatform === 'gitlabCi' ? 'GitLab CI' : 'GitHub Actions'
                  } OIDC YAML.`
                )
              }
              featureId="W26_BTN_COPY_OIDC_YAML"
            >
              {copiedKey === 'oidc-yaml' ? 'Copied OIDC YAML' : 'Copy OIDC YAML'}
            </Btn>
          </div>
        </Panel>
      </div>
    </div>
  );

  /* ==========================================================================
   * Sub-Tab 3: CLOUD_DNS_TLS (Cloud DNS, Certs & Multi-Resolver X-Ray)
   * ========================================================================== */

  const totalRecordSets =
    dnsData?.summary?.totalRecordSets ??
    dnsZones.reduce(
      (sum, z) =>
        sum +
        (Array.isArray(z.recordSets)
          ? z.recordSets.length
          : Number(z.recordCount ?? z.recordSetCount ?? 0)),
      0
    );
  const tlsCert = probeResult?.tlsCert || null;
  const tlsDays = tlsCert?.daysRemaining ?? null;
  const posture = probeResult?.securityPosture || null;

  const dnsTab = (
    <div className="space-y-3">
      <KpiStrip
        cells={[
          { label: 'Cloud DNS Zones', value: fmtNum(dnsZones.length) },
          { label: 'Record Sets', value: fmtNum(totalRecordSets) },
          { label: 'Cert Manager Certs', value: fmtNum(managedCerts.length) },
          { label: 'Probed Domain', value: probeResult?.domain || probeDomain || 'n/a' },
          {
            label: ':443 TLS Expiry',
            value: tlsDays !== null ? `${tlsDays}d` : 'not probed',
            sub: tlsCert?.protocol || '',
          },
        ]}
      />

      <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
        <Btn
          variant="primary"
          icon={RefreshCw}
          busy={busy === 'dns'}
          disabled={!projectId}
          onClick={loadDns}
          featureId="W26_BTN_REFRESH_DNS"
        >
          Refresh DNS &amp; Certs
        </Btn>
        <ApiStatusPills apiStatus={dnsData?.apiStatus} />
      </div>

      <ErrorBanner errState={dnsErr} />

      <Panel title="Multi-Resolver (8.8.8.8 vs 1.1.1.1) & :443 TLS Chain Prober" icon={Globe}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <div className="sm:col-span-2">
            <label className={LABEL_CLS}>Domain / Hostname</label>
            <input
              className={INPUT_CLS}
              value={probeDomain}
              onChange={(e) => setProbeDomain(e.target.value)}
              placeholder="cloud.google.com"
            />
          </div>
          {dnsZones.length > 0 && (
            <div>
              <label className={LABEL_CLS}>Load From Cloud DNS Zone</label>
              <select
                aria-label="Select domain from Cloud DNS zone"
                className={INPUT_CLS}
                value=""
                onChange={(e) => {
                  if (e.target.value) setProbeDomain(e.target.value.replace(/\.$/, ''));
                }}
              >
                <option value="">-- Pick managed zone --</option>
                {dnsZones.map((z, idx) => (
                  <option key={z.id || z.name || idx} value={z.dnsName || ''}>
                    {z.name} ({z.dnsName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
          <Btn
            variant="primary"
            icon={Play}
            busy={busy === 'dns-probe'}
            disabled={!projectId || !probeDomain.trim()}
            onClick={handleRunDnsProbe}
            featureId="W26_BTN_RUN_DNS_PROBE"
          >
            Run DNS &amp; TLS Probe
          </Btn>

          {posture && (
            <>
              <StatusPill tone={posture.hasSpf ? 'emerald' : 'amber'}>
                {posture.hasSpf ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                SPF: {posture.hasSpf ? 'PRESENT' : 'MISSING'}
              </StatusPill>
              <StatusPill tone={posture.hasDmarc ? 'emerald' : 'amber'}>
                {posture.hasDmarc ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                DMARC: {posture.hasDmarc ? 'PRESENT' : 'MISSING'}
              </StatusPill>
              <StatusPill tone={posture.hasCaa ? 'emerald' : 'zinc'}>
                CAA: {posture.hasCaa ? 'RESTRICTED' : 'OPEN'}
              </StatusPill>
              {resolverParity !== null && (
                <StatusPill tone={resolverParity ? 'emerald' : 'amber'}>
                  A-RECORD PARITY: {resolverParity ? 'MATCH' : 'SPLIT/ANYCAST'}
                </StatusPill>
              )}
            </>
          )}
        </div>

        {probeResult && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 pt-1">
            {[
              { title: 'Google Public DNS (8.8.8.8)', model: googleRes },
              { title: 'Cloudflare DNS (1.1.1.1)', model: cloudflareRes },
            ].map(({ title, model }) => (
              <div
                key={title}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {title}
                  </span>
                  <StatusPill tone="blue">
                    RTT {model.rttMs !== null ? `${model.rttMs} ms` : 'n/a'}
                  </StatusPill>
                </div>
                <div className="space-y-1.5 text-[11px] font-mono">
                  {['A', 'AAAA', 'MX', 'NS', 'CAA', 'TXT'].map((rType) => {
                    const vals = model.byType[rType] || [];
                    return (
                      <div key={rType} className="flex items-start gap-2">
                        <span className="w-10 shrink-0 font-bold text-amber-600 dark:text-amber-400">
                          {rType}
                        </span>
                        <div className="flex flex-wrap gap-1 min-w-0">
                          {vals.length > 0 ? (
                            vals.slice(0, 6).map((v, i) => (
                              <Chip key={`${rType}-${i}`} className="break-all">
                                {v}
                              </Chip>
                            ))
                          ) : (
                            <span className="text-zinc-500">--</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  :443 Live TLS Handshake
                </span>
                {tlsDays !== null ? (
                  <StatusPill
                    tone={tlsDays < 14 ? 'rose' : tlsDays < 30 ? 'amber' : 'emerald'}
                  >
                    {tlsDays}d REMAINING
                  </StatusPill>
                ) : (
                  <StatusPill tone="zinc">NO TLS CERT</StatusPill>
                )}
              </div>
              {tlsCert && !tlsCert.error ? (
                <div className="space-y-1.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                  <div>
                    <span className="text-zinc-500">Subject: </span>
                    <Chip className="break-all">
                      {typeof tlsCert.subject === 'object'
                        ? tlsCert.subject?.CN || JSON.stringify(tlsCert.subject)
                        : String(tlsCert.subject || probeResult.domain)}
                    </Chip>
                  </div>
                  <div>
                    <span className="text-zinc-500">Issuer: </span>
                    <Chip className="break-all">
                      {typeof tlsCert.issuer === 'object'
                        ? tlsCert.issuer?.O || tlsCert.issuer?.CN || JSON.stringify(tlsCert.issuer)
                        : String(tlsCert.issuer || 'n/a')}
                    </Chip>
                  </div>
                  <div>
                    <span className="text-zinc-500">Protocol: </span>
                    <Chip>{tlsCert.protocol || 'TLS'}</Chip>
                  </div>
                  <div>
                    <span className="text-zinc-500">Expires: </span>
                    <span>{tlsCert.valid_to || tlsCert.validTo || 'n/a'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500">
                  {tlsCert?.error || 'TLS handshake metadata unavailable for this host.'}
                </div>
              )}
            </div>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Cloud DNS Managed Zones" icon={Globe}>
          <div className="space-y-2 max-h-72 overflow-auto">
            {dnsZones.map((z, idx) => {
              const recs = Array.isArray(z.recordSets) ? z.recordSets : [];
              return (
                <div
                  key={z.id || z.name || idx}
                  className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {z.name}
                      </span>
                      <Chip>{z.dnsName}</Chip>
                    </div>
                    <StatusPill tone={z.visibility === 'private' ? 'amber' : 'emerald'}>
                      {(z.visibility || 'public').toUpperCase()}
                    </StatusPill>
                  </div>
                  {recs.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recs.slice(0, 12).map((r, rIdx) => (
                        <Chip key={`${r.name}-${r.type}-${rIdx}`}>
                          {r.type} {r.name}
                        </Chip>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {dnsZones.length === 0 && (
              <div className="text-xs text-zinc-500 py-2">
                No Cloud DNS managed zones found in {projLabel}.
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Certificate Manager Inventory" icon={Lock}>
          <div className="space-y-2 max-h-72 overflow-auto">
            {managedCerts.map((c, idx) => {
              const domains =
                c.sanDnsnames ||
                c.managed?.domains ||
                c.domains ||
                [];
              const state = c.managed?.state || c.state || 'ACTIVE';
              return (
                <div
                  key={c.name || idx}
                  className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {shortId(c.name)}
                    </span>
                    <StatusPill tone={state === 'ACTIVE' ? 'emerald' : 'amber'}>
                      {state}
                    </StatusPill>
                  </div>
                  {Array.isArray(domains) && domains.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {domains.map((d) => (
                        <Chip key={d}>{d}</Chip>
                      ))}
                    </div>
                  )}
                  {c.expireTime && (
                    <div className="text-[11px] font-mono text-zinc-500">
                      Expires: {c.expireTime}
                    </div>
                  )}
                </div>
              );
            })}
            {managedCerts.length === 0 && (
              <div className="text-xs text-zinc-500 py-2">
                No Certificate Manager global certificates discovered in {projLabel}.
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );

  /* ==========================================================================
   * Sub-Tab 4: PUBSUB_TIMEMACHINE (Pub/Sub DLQ & Seek Time-Machine)
   * ========================================================================== */

  const pubsubTab = (
    <div className="space-y-3">
      <KpiStrip
        cells={[
          { label: 'Live Topics', value: fmtNum(topics.length) },
          { label: 'Subscriptions', value: fmtNum(subscriptions.length) },
          {
            label: 'DLQ Protected',
            value: fmtNum(dlqSubCount),
            sub: subscriptions.length > 0 ? `of ${subscriptions.length}` : '',
          },
          { label: 'Saved Snapshots', value: fmtNum(snapshots.length) },
          { label: 'Peeked Buffer', value: fmtNum(peekedMessages.length), sub: 'non-acked' },
        ]}
      />

      <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
        <Btn
          variant="primary"
          icon={RefreshCw}
          busy={busy === 'pubsub'}
          disabled={!projectId}
          onClick={loadPubsub}
          featureId="W26_BTN_REFRESH_PUBSUB"
        >
          Refresh Pub/Sub
        </Btn>
        <ApiStatusPills apiStatus={pubsubData?.apiStatus} />
      </div>

      <ErrorBanner errState={pubsubErr} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel title="Publish Event & Non-Destructive Peek" icon={Send}>
          <div className="space-y-2">
            <div>
              <label className={LABEL_CLS}>Target Topic</label>
              {topics.length > 0 ? (
                <select
                  aria-label="Pub/Sub topic"
                  className={INPUT_CLS}
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                >
                  {topics.map((t, idx) => {
                    const tName = t.name || t.topicName || String(t);
                    return (
                      <option key={`${tName}-${idx}`} value={tName}>
                        {shortId(tName)} ({tName})
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  className={INPUT_CLS}
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  placeholder={
                    projectId
                      ? `projects/${projectId}/topics/my-topic`
                      : 'projects/<project>/topics/my-topic'
                  }
                />
              )}
            </div>
            <div>
              <label className={LABEL_CLS}>Event Payload (UTF-8 / JSON)</label>
              <textarea
                rows={3}
                className={INPUT_CLS}
                value={publishPayload}
                onChange={(e) => setPublishPayload(e.target.value)}
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Attributes (comma-separated key=value)</label>
              <input
                className={INPUT_CLS}
                value={publishAttrs}
                onChange={(e) => setPublishAttrs(e.target.value)}
                placeholder="source=cloudpulse,env=prod"
              />
            </div>
            <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
              <Btn
                variant="primary"
                icon={Send}
                busy={busy === 'publish'}
                disabled={!projectId || !selectedTopic.trim()}
                onClick={handlePublishEvent}
                featureId="W26_BTN_PUBLISH_EVENT"
              >
                Publish Event
              </Btn>
              {lastPublishReceipt && (
                <Chip>
                  msgId:{' '}
                  {lastPublishReceipt.messageId ||
                    lastPublishReceipt.messageIds?.[0] ||
                    'published'}
                </Chip>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div>
              <label className={LABEL_CLS}>
                Target Subscription (Peek Without Ack &amp; Snapshot Source)
              </label>
              {subscriptions.length > 0 ? (
                <select
                  aria-label="Pub/Sub subscription"
                  className={INPUT_CLS}
                  value={selectedSubscription}
                  onChange={(e) => setSelectedSubscription(e.target.value)}
                >
                  {subscriptions.map((s, idx) => {
                    const sName = s.name || s.subscriptionName || String(s);
                    return (
                      <option key={`${sName}-${idx}`} value={sName}>
                        {shortId(sName)}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  className={INPUT_CLS}
                  value={selectedSubscription}
                  onChange={(e) => setSelectedSubscription(e.target.value)}
                  placeholder={
                    projectId
                      ? `projects/${projectId}/subscriptions/my-sub`
                      : 'projects/<project>/subscriptions/my-sub'
                  }
                />
              )}
            </div>
            <div data-action-toolbar="true" className="flex flex-wrap gap-2">
              <Btn
                variant="secondary"
                icon={Eye}
                busy={busy === 'peek'}
                disabled={!projectId || !selectedSubscription.trim()}
                onClick={handlePullPeek}
                featureId="W26_BTN_PULL_PEEK"
              >
                Peek Messages (Zero-Ack)
              </Btn>
            </div>
            {peekedMessages.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-auto">
                {peekedMessages.map((item, idx) => {
                  const msg = item.message || item;
                  const decoded =
                    item.decodedData ??
                    msg.decodedData ??
                    (msg.data ? decodeBase64Safe(msg.data) : '');
                  return (
                    <div
                      key={msg.messageId || idx}
                      className="rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 text-[11px] font-mono space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Chip>id: {msg.messageId || idx + 1}</Chip>
                        <span className="text-zinc-500">
                          {msg.publishTime || ''}
                          {item.deliveryAttempt
                            ? ` (attempt #${item.deliveryAttempt})`
                            : ''}
                        </span>
                      </div>
                      <pre className="whitespace-pre-wrap break-all text-zinc-800 dark:text-zinc-200">
                        {decoded || '(empty payload)'}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="Snapshot & Seek Time-Machine" icon={History}>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Capture point-in-time Subscription cursor checkpoints via{' '}
            <Chip>pubsub.googleapis.com/v1</Chip> and replay messages by seeking{' '}
            <Chip>{shortId(selectedSubscription) || 'selected-subscription'}</Chip> back
            to any saved snapshot.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>New Snapshot ID</label>
              <input
                className={INPUT_CLS}
                value={newSnapshotId}
                onChange={(e) => setNewSnapshotId(e.target.value)}
                placeholder="snap-pre-deploy-01"
              />
            </div>
            <div data-action-toolbar="true">
              <Btn
                variant="primary"
                icon={Camera}
                busy={busy === 'create-snap'}
                disabled={
                  !projectId || !selectedSubscription.trim() || !newSnapshotId.trim()
                }
                onClick={handleCreateSnapshot}
                featureId="W26_BTN_CREATE_SNAPSHOT"
                className="w-full justify-center"
              >
                Create Snapshot
              </Btn>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="sm:col-span-2">
              <label className={LABEL_CLS}>Seek Target Snapshot</label>
              {snapshots.length > 0 ? (
                <select
                  aria-label="Target snapshot to seek"
                  className={INPUT_CLS}
                  value={seekSnapshotTarget}
                  onChange={(e) => setSeekSnapshotTarget(e.target.value)}
                >
                  <option value="">-- Choose snapshot --</option>
                  {snapshots.map((sn, idx) => {
                    const snName = sn.name || sn.snapshotName || String(sn);
                    return (
                      <option key={`${snName}-${idx}`} value={snName}>
                        {shortId(snName)}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  className={INPUT_CLS}
                  value={seekSnapshotTarget}
                  onChange={(e) => setSeekSnapshotTarget(e.target.value)}
                  placeholder={
                    projectId
                      ? `projects/${projectId}/snapshots/snap-01`
                      : 'projects/<project>/snapshots/snap-01'
                  }
                />
              )}
            </div>
            <div data-action-toolbar="true">
              <Btn
                variant="secondary"
                icon={RotateCcw}
                busy={busy === 'seek-snap'}
                disabled={
                  !projectId ||
                  !selectedSubscription.trim() ||
                  !seekSnapshotTarget.trim()
                }
                onClick={handleSeekSnapshot}
                featureId="W26_BTN_SEEK_SNAPSHOT"
                className="w-full justify-center"
              >
                Seek Snapshot
              </Btn>
            </div>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-auto pt-2">
            {snapshots.map((sn, idx) => {
              const snName = sn.name || sn.snapshotName || String(sn);
              return (
                <div
                  key={`${snName}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-2 text-[11px] font-mono"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      {shortId(snName)}
                    </div>
                    {sn.topic && (
                      <div className="text-zinc-500">topic: {shortId(sn.topic)}</div>
                    )}
                    {sn.expireTime && (
                      <div className="text-zinc-500">expires: {sn.expireTime}</div>
                    )}
                  </div>
                  <Btn
                    variant="danger"
                    icon={Trash2}
                    busy={busy === `del-snap-${snName}`}
                    onClick={() => handleDeleteSnapshot(snName)}
                    featureId="W26_BTN_DELETE_PUBSUB_SNAPSHOT"
                  >
                    Delete Snapshot
                  </Btn>
                </div>
              );
            })}
            {snapshots.length === 0 && (
              <div className="text-xs text-zinc-500 py-2">
                No Pub/Sub snapshots currently saved in {projLabel}.
              </div>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Subscriptions & Dead-Letter Queue (DLQ) Posture" icon={Radio}>
        <div className="overflow-auto max-h-64 rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-[11px] font-mono">
            <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="text-left px-2.5 py-1.5">Subscription</th>
                <th className="text-left px-2.5 py-1.5">Topic</th>
                <th className="text-left px-2.5 py-1.5">Ack Deadline</th>
                <th className="text-left px-2.5 py-1.5">Retain Acked</th>
                <th className="text-left px-2.5 py-1.5">Dead-Letter Policy</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s, idx) => {
                const sName = s.name || s.subscriptionName || `sub-${idx}`;
                const dlqTopic =
                  s.deadLetterPolicy?.deadLetterTopic || s.deadLetterTopic || '';
                const maxDeliveries =
                  s.deadLetterPolicy?.maxDeliveryAttempts || s.maxDeliveryAttempts;
                return (
                  <tr
                    key={`${sName}-${idx}`}
                    className="border-t border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                  >
                    <td className="px-2.5 py-1.5 font-semibold">{shortId(sName)}</td>
                    <td className="px-2.5 py-1.5">
                      <Chip>{shortId(s.topic || 'n/a')}</Chip>
                    </td>
                    <td className="px-2.5 py-1.5">
                      {fmtNum(s.ackDeadlineSeconds, 's')}
                    </td>
                    <td className="px-2.5 py-1.5">
                      <StatusPill tone={s.retainAckedMessages ? 'emerald' : 'zinc'}>
                        {s.retainAckedMessages ? 'RETAINED' : 'STANDARD'}
                      </StatusPill>
                    </td>
                    <td className="px-2.5 py-1.5">
                      {dlqTopic ? (
                        <StatusPill tone="emerald">
                          DLQ: {shortId(dlqTopic)}
                          {maxDeliveries ? ` (${maxDeliveries}x)` : ''}
                        </StatusPill>
                      ) : (
                        <StatusPill tone="amber">NO DLQ CONFIGURED</StatusPill>
                      )}
                    </td>
                  </tr>
                );
              })}
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-zinc-500">
                    {busy === 'pubsub'
                      ? 'Loading live Pub/Sub subscriptions...'
                      : `No Pub/Sub subscriptions discovered in ${projLabel}.`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );

  return (
    <div className="space-y-3">
      {activeSubTab === 'QUOTA_RADAR' && quotaTab}
      {activeSubTab === 'WIF_KEYLESS' && wifTab}
      {activeSubTab === 'CLOUD_DNS_TLS' && dnsTab}
      {activeSubTab === 'PUBSUB_TIMEMACHINE' && pubsubTab}
    </div>
  );
}

/* Embedded single-pillar panels hosted inside canonical studios. */
export function QuotaRadarPanel(props) {
  return <OpsFrontierPanel {...props} panel="QUOTA_RADAR" />;
}
export function WifKeylessPanel(props) {
  return <OpsFrontierPanel {...props} panel="WIF_KEYLESS" />;
}
export function DnsTlsPanel(props) {
  return <OpsFrontierPanel {...props} panel="CLOUD_DNS_TLS" />;
}
export function PubSubTimeMachinePanel(props) {
  return <OpsFrontierPanel {...props} panel="PUBSUB_TIMEMACHINE" />;
}
