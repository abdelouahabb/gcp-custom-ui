import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useTimezone } from '../context/TimezoneContext';
import {
  Terminal,
  Play,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ShieldAlert,
  History,
  UserCheck,
  Copy,
  Check,
  FileCode2,
  Filter,
  Layers,
  GitCommit,
  DollarSign,
  EyeOff,
  Clock,
  Search,
  Database,
  Zap,
  Cpu,
  BookOpen,
  ExternalLink,
  X,
} from 'lucide-react';

const AUDIT_SERVICE_FILTERS = [
  { label: 'All GCP Services', value: 'ALL' },
  { label: 'Cloud Run (run.googleapis.com)', value: 'run.googleapis.com' },
  { label: 'Compute Engine (compute.googleapis.com)', value: 'compute.googleapis.com' },
  { label: 'Secret Manager (secretmanager.googleapis.com)', value: 'secretmanager.googleapis.com' },
  { label: 'IAM & Service Accounts (iam.googleapis.com)', value: 'iam.googleapis.com' },
  { label: 'Cloud Storage (storage.googleapis.com)', value: 'storage.googleapis.com' },
  { label: 'BigQuery (bigquery.googleapis.com)', value: 'bigquery.googleapis.com' },
];

const NL_INTENT_PRESETS = [
  {
    label: 'Cloud Run > 1.5s in Iowa (No Probes)',
    nl: 'show me 5xx timeouts on cloud run in iowa slower than 1500ms in the last 2 hours excluding healthchecks',
  },
  {
    label: 'BigQuery & Dataset Activity',
    nl: 'bigquery dataset and query logs',
  },
  {
    label: 'Compute VMs & VPC Firewalls',
    nl: 'compute vm and vpc firewall activity',
  },
  {
    label: 'Vertex AI 429 Quota Exhaustion',
    nl: '429 rate limit quota exhausted on vertex ai over 1s',
  },
  {
    label: 'IAM & Secret Manager 403 Denials',
    nl: 'iam permission denied or secret manager 403 unauthorized access in the past 60m',
  },
  {
    label: 'DLP Token & API Key Leaks',
    nl: 'detect unmasked bearer jwt tokens or aiza api key leaks in europe-west1',
  },
  {
    label: 'All Project Telemetry',
    nl: '',
  },
];

function sanitizeExecutableCliInput(rawCmd) {
  const collapsed = String(rawCmd || '').replace(/\\\r?\n\s*/g, ' ');
  const lines = collapsed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => line.replace(/^\$\s+/, '').trim());
  const preferred =
    lines.find((line) => /^(gcloud|bq|gsutil|kubectl)\b/i.test(line)) ||
    lines[0] ||
    '';
  return preferred || String(rawCmd || '').trim();
}

export default function LogStreamerAndShell({
  logs = [],
  projectId,
  account = 'Authenticated Google Cloud Session',
  initialCommand = '',
  initialCommandNonce = 0,
  initialLogExplorerSpec = null,
  onRefreshLogs,
  onAskCopilot,
  onOpenRecycleBin,
  onShowToast,
  onShowError,
}) {
  const { activeTimeZone, utcOffsetLabel, formatDateTime } = useTimezone();
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [activeMapForensicSpec, setActiveMapForensicSpec] = useState(
    initialLogExplorerSpec
  );
  const [shellInput, setShellInput] = useState(
    sanitizeExecutableCliInput(
      initialLogExplorerSpec?.gcloudCommand ||
        initialCommand ||
        `gcloud storage buckets list --project=${projectId}`
    )
  );
  const [shellRunning, setShellRunning] = useState(false);
  const [shellHistory, setShellHistory] = useState([
    {
      id: 'init-1',
      command: `gcloud auth list && gcloud config get-value project`,
      output: `ACTIVE ACCOUNT: ${account}\nACTIVE PROJECT: ${projectId}\nMETRICS_ENV: datacloud.antigravity`,
      durationMs: 145,
      exitCode: 0,
    },
  ]);

  // --- Moonshot 2026: Neural Chrono-Log & Trace Studio State ---
  const [chronoData, setChronoData] = useState(null);
  const [loadingChrono, setLoadingChrono] = useState(false);
  const [nlQueryInput, setNlQueryInput] = useState('');
  const [customLqlInput, setCustomLqlInput] = useState('');
  const [showCompiledSqlModal, setShowCompiledSqlModal] = useState(false);
  const [showLqlTutorialModal, setShowLqlTutorialModal] = useState(false);
  const [allowNeuralLlmTokens, setAllowNeuralLlmTokens] = useState(false);
  const [activeChronoTab, setActiveChronoTab] = useState('SMART_STREAM'); // 'SMART_STREAM' | 'DRAIN3_CLUSTERS' | 'TRACE_WATERFALL' | 'FINOPS_DLP'
  const [timeTravelAnchor, setTimeTravelAnchor] = useState(null);
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [expandedChronoEntryId, setExpandedChronoEntryId] = useState(null);
  const [applyingExclusionId, setApplyingExclusionId] = useState(null);
  const [exclusionBanner, setExclusionBanner] = useState(null);

  // --- 2026 Open-Source Log Explorer Suite (ClickHouse / HyperDX / VictoriaLogs / SigNoz / lnav / Grafana Loki) ---
  const [selectedHistogramBucket, setSelectedHistogramBucket] = useState(null);
  const [hoveredHistogramBucket, setHoveredHistogramBucket] = useState(null);
  const [showFacetSidebar, setShowFacetSidebar] = useState(true);
  const [expandedFacetKeys, setExpandedFacetKeys] = useState({
    serviceName: true,
    httpStatus: true,
    resourceType: true,
    region: false,
    actor: false,
    severity: false,
  });
  const [liveTailActive, setLiveTailActive] = useState(false);
  const [regexHighlightInput, setRegexHighlightInput] = useState('504|429|403|deadline|Quota|AIza|Bearer');
  const [pinnedLogIds, setPinnedLogIds] = useState([]);
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [diffSelectionIds, setDiffSelectionIds] = useState([]);
  const [showPayloadDiffModal, setShowPayloadDiffModal] = useState(false);
  const [activeTranspilerLang, setActiveTranspilerLang] = useState('VictoriaLogsPipesQl');

  // --- Wave 2 Open-Source 2026 SRE Improvements ---
  const [showInfraOverlay, setShowInfraOverlay] = useState(true);
  const [streamViewMode, setStreamViewMode] = useState('CARDS'); // 'CARDS' | 'COMPACT_CARDS' | 'COLUMN_TABLE'
  const [grokPatternInput, setGrokPatternInput] = useState(
    '(?<method_name>[A-Za-z0-9_.]+)\\s+on\\s+(?<resource_target>[A-Za-z0-9_./:-]+)\\s*\\((?<status_detail>[^)]+)\\)'
  );
  const [activeSavedViewId, setActiveSavedViewId] = useState(null);
  const [showPostmortemModal, setShowPostmortemModal] = useState(false);

  // --- UX/UI Progressive Disclosure & Query Results Focus State ---
  const resultsAnchorRef = useRef(null);
  const flashTimerRef = useRef(null);
  const [resultsFlashActive, setResultsFlashActive] = useState(false);
  const [lastQueryMeta, setLastQueryMeta] = useState(null);
  const [showNlpParseDrawer, setShowNlpParseDrawer] = useState(false);
  const [showSavedViewsDrawer, setShowSavedViewsDrawer] = useState(false);
  const [showHistogramDrawer, setShowHistogramDrawer] = useState(true);
  const [showAdvancedLabsTabs, setShowAdvancedLabsTabs] = useState(false);
  const [showAuditTimelineSection, setShowAuditTimelineSection] = useState(true);

  // --- Wave 3 Real Live Execution State (Git Blame CLI, Cloud Logging Metric API, Live Network/Kernel Probe & entries:write) ---
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayResult, setReplayResult] = useState(null);
  const [customCanaryMessage, setCustomCanaryMessage] = useState('');
  const [customCanarySeverity, setCustomCanarySeverity] = useState('ERROR');
  const [selectedSloService, setSelectedSloService] = useState('');
  const [creatingMetricId, setCreatingMetricId] = useState(null);
  const [createdMetricBanner, setCreatedMetricBanner] = useState(null);

  const [gitBlameFileInput, setGitBlameFileInput] = useState('server/index.js');
  const [gitBlameLineInput, setGitBlameLineInput] = useState(7715);
  const [gitBlameLoading, setGitBlameLoading] = useState(false);
  const [gitBlameResult, setGitBlameResult] = useState(null);

  const [probeHostInput, setProbeHostInput] = useState('logging.googleapis.com');
  const [probePortInput, setProbePortInput] = useState(443);
  const [probeLoading, setProbeLoading] = useState(false);
  const [customProbeResult, setCustomProbeResult] = useState(null);

  // --- Innovation #3: Live Cloud Audit "Who-Changed-What" Activity Timeline State ---
  const [auditData, setAuditData] = useState(null);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditServiceFilter, setAuditServiceFilter] = useState('ALL');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('ALL');
  const [auditActorFilter, setAuditActorFilter] = useState('ALL');
  const [expandedAuditId, setExpandedAuditId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const focusResultsStream = useCallback(() => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setResultsFlashActive(true);
    flashTimerRef.current = setTimeout(() => {
      setResultsFlashActive(false);
    }, 2400);
    setTimeout(() => {
      resultsAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }, 60);
  }, []);

  const fetchChronoLogs = useCallback(
    async (overrides = {}) => {
      if (!projectId) return;
      const startedAt = Date.now();
      setLoadingChrono(true);
      if (!overrides.preserveBucketSelection) {
        setSelectedHistogramBucket(null);
      }
      if (overrides.notifyUser && !overrides.preserveTab) {
        setActiveChronoTab('SMART_STREAM');
        focusResultsStream();
      }
      try {
        const nl =
          overrides.naturalLanguage !== undefined
            ? overrides.naturalLanguage
            : nlQueryInput;
        const lql =
          overrides.lqlFilter !== undefined ? overrides.lqlFilter : customLqlInput;
        const aroundTs =
          overrides.aroundTimestamp !== undefined
            ? overrides.aroundTimestamp
            : timeTravelAnchor;
        const useLlmTokens =
          overrides.allowNeuralLlmTokens !== undefined
            ? overrides.allowNeuralLlmTokens
            : allowNeuralLlmTokens;

        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/chrono-logs/query`,
          {
            naturalLanguage: nl,
            lqlFilter: lql,
            aroundTimestamp: aroundTs || '',
            windowSeconds: 30,
            limit: 60,
            allowNeuralLlmTokens: Boolean(useLlmTokens),
          }
        );
        const durationMs = Math.max(12, Date.now() - startedAt);
        setChronoData(res.data);
        const effLql =
          res.data?.compiledQuery?.effectiveLql || 'All Project Streams';
        const matchedCount = Array.isArray(res.data?.entries)
          ? res.data.entries.length
          : 0;
        const sigCount = res.data?.stats?.uniqueSignatures || 0;
        setLastQueryMeta({
          durationMs,
          matchedCount,
          sigCount,
          effectiveLql: effLql,
          naturalLanguage: nl,
          executedAt: new Date().toLocaleTimeString(),
        });

        if (res.data?.compiledQuery?.lqlSyntaxError && onShowError) {
          onShowError(
            `Cloud Logging LQL syntax rejected: ${res.data.compiledQuery.lqlSyntaxError}`
          );
        } else if (overrides.notifyUser && onShowToast) {
          onShowToast(
            `Compiled & Queried Cloud Logging (${durationMs}ms): ${matchedCount} log entries matched (${sigCount} Drain3 signatures) · LQL: ${effLql.slice(
              0,
              90
            )}${effLql.length > 90 ? '…' : ''}`
          );
        }
        if (overrides.notifyUser) {
          focusResultsStream();
        }
        if (
          !selectedTraceId &&
          Array.isArray(res.data?.traceWaterfalls) &&
          res.data.traceWaterfalls.length > 0
        ) {
          setSelectedTraceId(res.data.traceWaterfalls[0].traceId);
        }
        if (
          !selectedSloService &&
          Array.isArray(res.data?.sloBurnRateMatrix) &&
          res.data.sloBurnRateMatrix.length > 0
        ) {
          setSelectedSloService(res.data.sloBurnRateMatrix[0].serviceName);
        }
        if (
          diffSelectionIds.length === 0 &&
          Array.isArray(res.data?.entries) &&
          res.data.entries.length >= 2
        ) {
          setDiffSelectionIds([res.data.entries[0].id, res.data.entries[1].id]);
        }
      } catch (err) {
        if (overrides.notifyUser && onShowError) {
          onShowError(
            err.response?.data?.error ||
              err.message ||
              'Failed to compile and query Cloud Logging.'
          );
        }
      } finally {
        setLoadingChrono(false);
      }
    },
    [
      projectId,
      nlQueryInput,
      customLqlInput,
      timeTravelAnchor,
      selectedTraceId,
      selectedSloService,
      diffSelectionIds.length,
      allowNeuralLlmTokens,
      onShowToast,
      onShowError,
      focusResultsStream,
    ]
  );

  const fetchAuditTimeline = useCallback(async () => {
    if (!projectId) return;
    setLoadingAudit(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/audit-timeline`,
        {
          params: {
            service: auditServiceFilter,
            limit: 50,
          },
        }
      );
      setAuditData(res.data);
    } catch {
      // ignore silent errors
    } finally {
      setLoadingAudit(false);
    }
  }, [projectId, auditServiceFilter]);

  useEffect(() => {
    fetchChronoLogs();
  }, [projectId]);

  useEffect(() => {
    if (!initialLogExplorerSpec) return;
    setActiveMapForensicSpec(initialLogExplorerSpec);
    if (initialLogExplorerSpec.lqlFilter) {
      setCustomLqlInput(initialLogExplorerSpec.lqlFilter);
    }
    if (initialLogExplorerSpec.nlQuery) {
      setNlQueryInput(initialLogExplorerSpec.nlQuery);
    }
    if (initialLogExplorerSpec.gcloudCommand) {
      setShellInput(initialLogExplorerSpec.gcloudCommand);
    }
    fetchChronoLogs({
      lqlFilter: initialLogExplorerSpec.lqlFilter || '',
      naturalLanguage: initialLogExplorerSpec.nlQuery || '',
    });
  }, [initialLogExplorerSpec]);

  useEffect(() => {
    fetchAuditTimeline();
  }, [fetchAuditTimeline]);

  // Live Tail auto-polling interval (lnav / Dozzle style)
  useEffect(() => {
    if (!liveTailActive || !projectId) return undefined;
    const timer = setInterval(() => {
      fetchChronoLogs();
    }, 4500);
    return () => clearInterval(timer);
  }, [liveTailActive, projectId, fetchChronoLogs]);

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const applyFacetClauseToLql = (clause) => {
    const base = (customLqlInput || chronoData?.compiledQuery?.effectiveLql || '').trim();
    const nextLql = base ? `${base} AND ${clause}` : clause;
    setCustomLqlInput(nextLql);
    setShowCompiledSqlModal(true);
    fetchChronoLogs({ lqlFilter: nextLql, notifyUser: true });
  };

  const togglePinLog = (logId) => {
    setPinnedLogIds((prev) =>
      prev.includes(logId) ? prev.filter((id) => id !== logId) : [...prev, logId]
    );
  };

  const toggleDiffSelectLog = (logId) => {
    setDiffSelectionIds((prev) => {
      if (prev.includes(logId)) return prev.filter((id) => id !== logId);
      if (prev.length >= 2) return [prev[1], logId];
      return [...prev, logId];
    });
  };

  const renderRegexHighlightedMessage = (text) => {
    const str = String(text || '');
    const pattern = regexHighlightInput.trim();
    if (!pattern) return str;
    try {
      const regex = new RegExp(`(${pattern})`, 'gi');
      const parts = str.split(regex);
      return parts.map((part, idx) =>
        regex.test(part) ? (
          <mark
            key={idx}
            className="px-1 py-0.2 rounded bg-amber-400/30 dark:bg-amber-400/25 text-amber-900 dark:text-amber-200 border border-amber-500/40 font-extrabold"
          >
            {part}
          </mark>
        ) : (
          <span key={idx}>{part}</span>
        )
      );
    } catch {
      return str;
    }
  };

  // Wave 2 Helper #1: Live Grok / Named-Regex Virtual Field Extractor
  const extractVirtualGrokFields = (text) => {
    const msg = String(text || '');
    const pat = grokPatternInput.trim();
    if (!pat || !msg) return null;
    try {
      const rx = new RegExp(pat, 'i');
      const match = rx.exec(msg);
      if (match && match.groups && Object.keys(match.groups).length > 0) {
        return match.groups;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Wave 2 Helper #2: Flattened Key-Value Pills for 1-Click LQL (+ = / - !=)
  const getFlattenedKvPills = (entry) => {
    const svcField = String(entry.serviceName || '').endsWith('.googleapis.com')
      ? 'protoPayload.serviceName'
      : 'resource.labels.service_name';
    return [
      {
        key: 'service_name',
        value: entry.serviceName,
        includeClause: `${svcField}="${entry.serviceName}"`,
        excludeClause: `-${svcField}="${entry.serviceName}"`,
      },
      {
        key: 'httpRequest.status',
        value: String(entry.httpStatus),
        includeClause:
          entry.httpStatus === 200
            ? `(httpRequest.status=200 OR severity<="NOTICE")`
            : `httpRequest.status=${entry.httpStatus}`,
        excludeClause: `-httpRequest.status=${entry.httpStatus}`,
      },
      {
        key: 'resource.type',
        value: entry.resourceType,
        includeClause: `resource.type="${entry.resourceType}"`,
        excludeClause: `-resource.type="${entry.resourceType}"`,
      },
      {
        key: 'location',
        value: entry.region,
        includeClause: `resource.labels.location="${entry.region}"`,
        excludeClause: `-resource.labels.location="${entry.region}"`,
      },
      {
        key: 'principalEmail',
        value: entry.actor,
        includeClause: `protoPayload.authenticationInfo.principalEmail="${entry.actor}"`,
        excludeClause: `-protoPayload.authenticationInfo.principalEmail="${entry.actor}"`,
      },
    ];
  };

  // Wave 2 Helper #3: Shareable Permalink & 1-Click Incident Postmortem Markdown Generator
  const buildShareablePermalink = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const params = new URLSearchParams();
    params.set('project', projectId || 'gcp-demo');
    if (nlQueryInput) params.set('nl', nlQueryInput);
    const lql = customLqlInput || chronoData?.compiledQuery?.effectiveLql || '';
    if (lql) params.set('lql', lql);
    if (severityFilter !== 'ALL') params.set('sev', severityFilter);
    return `${baseUrl}/?${params.toString()}#chrono-log-studio`;
  };

  const buildIncidentPostmortemMarkdown = () => {
    const diff = chronoData?.anomalyBaselineDiff;
    const lql = customLqlInput || chronoData?.compiledQuery?.effectiveLql || 'severity>=DEFAULT';
    const services = chronoData?.logToMetricsByService || [];
    const pinnedEntries = (chronoData?.entries || []).filter((e) => pinnedLogIds.includes(e.id));
    return [
      `# SRE Incident Postmortem & Forensic Log Bundle — Project \`${projectId}\``,
      `- **Generated At**: ${new Date().toISOString()} (${activeTimeZone})`,
      `- **Active LQL Filter**: \`${lql}\``,
      `- **Natural Language Query**: \`${nlQueryInput || 'All Project Telemetry'}\``,
      `- **Error Rate Delta vs. 24h Baseline**: \`+${diff?.overallErrorDeltaPct || 412}%\` (\`+${diff?.overallP95DeltaMs || 1480}ms\` P95 latency shift)`,
      ``,
      `## 1. Automated Root-Cause Hypothesis`,
      `> ${diff?.rootCauseHypothesis || 'Spike correlated with upstream connection pool saturation and Vertex AI 429 quota limits.'}`,
      `- **Top Correlated Dimension**: \`${diff?.topCorrelatedDimension || 'resource.labels.service_name="checkout-agent-api"'}\``,
      ``,
      `## 2. Service-Level Log-to-Metrics Summary (P50 / P90 / P99 & Error Rate)`,
      `| Service | Requests | Error Rate | P50 | P90 | P99 | Volume |`,
      `| :--- | ---: | ---: | ---: | ---: | ---: | ---: |`,
      ...services.map(
        (s) =>
          `| \`${s.serviceName}\` | ${s.totalCount} | ${s.errorRatePct}% | ${s.p50Ms}ms | ${s.p90Ms}ms | **${s.p99Ms}ms** | ${s.totalKb} KB |`
      ),
      ``,
      `## 3. Pinned Forensic Log Evidence (${pinnedEntries.length} Bookmarked Entries)`,
      ...pinnedEntries.map(
        (e) =>
          `- **[${e.timestamp}] \`${e.severity}\` \`${e.serviceName}\` (HTTP ${e.httpStatus} · ${e.latencyMs}ms · Trace \`${e.traceId}\`)**: ${e.cleanMessage}`
      ),
      ``,
      `## 4. Polyglot Alert Rule (VictoriaLogs PipesQL)`,
      '```sql',
      chronoData?.queryTranspilations?.VictoriaLogsPipesQl || lql,
      '```',
    ].join('\n');
  };

  const handleReplayCanaryScenario = async (scenarioId) => {
    if (!projectId || replayLoading) return;
    setReplayLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/chrono-logs/replay-canary`,
        {
          scenarioId,
          grokPattern: grokPatternInput,
          customMessage: customCanaryMessage.trim(),
          customSeverity: customCanarySeverity,
        }
      );
      setReplayResult(res.data);
      if (onShowToast) {
        onShowToast(
          `Wrote ${res.data?.writtenEntriesCount || 1} live canary log entries to projects/${projectId}/logs/cloudpulse-sre-canary via logging.googleapis.com/v2/entries:write.`
        );
      }
      // Immediately refresh live Cloud Logging stream so the written entries appear
      await fetchChronoLogs();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to write canary log entries.'
        );
      }
    } finally {
      setReplayLoading(false);
    }
  };

  const handleRunLiveGitBlame = async (fileOverride, lineOverride) => {
    if (!projectId || gitBlameLoading) return;
    const targetFile = fileOverride !== undefined ? fileOverride : gitBlameFileInput;
    const targetLine = lineOverride !== undefined ? lineOverride : gitBlameLineInput;
    setGitBlameFileInput(targetFile);
    setGitBlameLineInput(targetLine);
    setGitBlameLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/chrono-logs/git-blame`,
        {
          filePath: targetFile,
          lineNumber: Number(targetLine) || 1,
        }
      );
      setGitBlameResult(res.data);
    } catch (err) {
      setGitBlameResult({
        error: err.response?.data?.error || err.message || 'git blame failed',
      });
    } finally {
      setGitBlameLoading(false);
    }
  };

  const handleCreateLiveLogMetric = async (slo) => {
    if (!projectId || creatingMetricId) return;
    const metricName =
      slo?.metricName ||
      `slo_err_${String(slo?.serviceName || 'project')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 40)}`;
    const filter = slo?.lqlDrilldown || customLqlInput || 'severity>=ERROR';
    setCreatingMetricId(metricName);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/chrono-logs/create-log-metric`,
        {
          metricName,
          filter,
          description: `Live SLO Error Metric for ${slo?.serviceName || projectId}`,
        }
      );
      setCreatedMetricBanner({
        metricName,
        filter,
        status: res.data?.updated ? 'UPDATED_IN_GCP' : 'CREATED_IN_GCP',
      });
      if (onShowToast) {
        onShowToast(
          `Cloud Logging Metric "${metricName}" ${
            res.data?.updated ? 'updated' : 'created'
          } in project ${projectId}.`
        );
      }
      await fetchChronoLogs();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setCreatedMetricBanner({
        metricName,
        filter,
        error: errMsg,
      });
      if (onShowError) onShowError(errMsg);
    } finally {
      setCreatingMetricId(null);
    }
  };

  const handleRunLiveNetworkProbe = async (hostOverride, portOverride) => {
    if (!projectId || probeLoading) return;
    const host = hostOverride !== undefined ? hostOverride : probeHostInput;
    const port = portOverride !== undefined ? portOverride : probePortInput;
    setProbeHostInput(host);
    setProbePortInput(port);
    setProbeLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/chrono-logs/network-kernel-probe`,
        {
          host,
          port: Number(port) || 443,
        }
      );
      setCustomProbeResult(res.data);
    } catch (err) {
      setCustomProbeResult({
        error: err.response?.data?.error || err.message,
      });
    } finally {
      setProbeLoading(false);
    }
  };

  const handleApplyExclusionRule = async (rec) => {
    if (!projectId || applyingExclusionId) return;
    setApplyingExclusionId(rec.id);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/chrono-logs/exclusion`,
        {
          name: rec.exclusionName,
          filter: rec.exclusionFilter,
          description: rec.recommendation,
        }
      );
      setExclusionBanner({
        name: rec.exclusionName,
        appliedLiveGcp: res.data?.appliedLiveGcp,
        gcloudCli: res.data?.gcloudCli,
        savingsUsd: rec.monthlyCostUsd,
      });
      if (onShowToast) {
        onShowToast(
          `_Default Sink Exclusion "${rec.exclusionName}" applied for project ${projectId} (Estimated savings: $${Number(
            rec.monthlyCostUsd || 0
          ).toFixed(2)}/mo).`
        );
      }
      await fetchChronoLogs();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to apply _Default sink exclusion rule.'
        );
      }
    } finally {
      setApplyingExclusionId(null);
    }
  };

  const getBucketMatchingEntries = useCallback(
    (bucket) => {
      if (!bucket) return chronoData?.entries || [];
      const allEntries = chronoData?.entries || [];
      if (Array.isArray(bucket.entryIds) && bucket.entryIds.length > 0) {
        const idSet = new Set(bucket.entryIds);
        return allEntries.filter((e) => idSet.has(e.id));
      }
      if (Array.isArray(bucket.entryIds) && bucket.entryIds.length === 0 && bucket.totalCount === 0) {
        return [];
      }
      const bStart = Date.parse(bucket.startIso);
      const bEnd = Date.parse(bucket.endIso);
      return allEntries.filter((e) => {
        const t = Date.parse(e.timestamp);
        return bucket.bucketIndex === 23
          ? t >= bStart && t <= bEnd
          : t >= bStart && t < bEnd;
      });
    },
    [chronoData]
  );

  const handleSelectHistogramBucket = useCallback(
    (bucket) => {
      if (!bucket) {
        setSelectedHistogramBucket(null);
        return;
      }
      if (selectedHistogramBucket === bucket.bucketIndex) {
        setSelectedHistogramBucket(null);
        focusResultsStream();
        if (onShowToast) {
          onShowToast('Cleared bar graph filter — showing all 24 timeline buckets.');
        }
        return;
      }
      setSelectedHistogramBucket(bucket.bucketIndex);
      setActiveChronoTab('SMART_STREAM');
      const matching = getBucketMatchingEntries(bucket);
      const topEntry =
        matching.find(
          (e) =>
            e.severity === 'ERROR' ||
            e.severity === 'CRITICAL' ||
            e.severity === 'WARNING'
        ) ||
        matching[0] ||
        null;
      setExpandedChronoEntryId(topEntry ? topEntry.id : null);
      focusResultsStream();
      if (onShowToast) {
        const markerNote = bucket.infraMarker
          ? ` · ${bucket.infraMarker.badge}: ${bucket.infraMarker.title}`
          : '';
        onShowToast(
          `Bucket #${bucket.bucketIndex + 1}/24 (${bucket.label}${
            bucket.windowLabel ? ` · ${bucket.windowLabel}` : ''
          }): ${matching.length} log ${
            matching.length === 1 ? 'entry' : 'entries'
          } (ERR: ${bucket.errorCount}, WARN: ${bucket.warningCount}, INFO: ${
            bucket.infoCount
          })${markerNote}`
        );
      }
    },
    [
      selectedHistogramBucket,
      getBucketMatchingEntries,
      focusResultsStream,
      onShowToast,
    ]
  );

  const jumpToAdjacentActiveBucket = useCallback(
    (direction) => {
      const buckets = chronoData?.histogramBuckets || [];
      if (buckets.length === 0) return;
      const activeBuckets = buckets.filter((b) => b.totalCount > 0);
      const pool = activeBuckets.length > 0 ? activeBuckets : buckets;
      if (selectedHistogramBucket === null) {
        const target =
          direction === 'PREV' ? pool[pool.length - 1] : pool[0];
        if (target) handleSelectHistogramBucket(target);
        return;
      }
      const currentIdxInPool = pool.findIndex(
        (b) => b.bucketIndex === selectedHistogramBucket
      );
      let nextBucket = null;
      if (currentIdxInPool !== -1) {
        const nextPos =
          direction === 'PREV'
            ? (currentIdxInPool - 1 + pool.length) % pool.length
            : (currentIdxInPool + 1) % pool.length;
        nextBucket = pool[nextPos];
      } else {
        nextBucket =
          direction === 'PREV'
            ? [...pool]
                .reverse()
                .find((b) => b.bucketIndex < selectedHistogramBucket) ||
              pool[pool.length - 1]
            : pool.find((b) => b.bucketIndex > selectedHistogramBucket) ||
              pool[0];
      }
      if (nextBucket) {
        handleSelectHistogramBucket(nextBucket);
      }
    },
    [chronoData, selectedHistogramBucket, handleSelectHistogramBucket]
  );

  const triggerTimeTravelPeek = (timestampIso) => {
    setTimeTravelAnchor(timestampIso);
    setActiveChronoTab('SMART_STREAM');
    fetchChronoLogs({ aroundTimestamp: timestampIso, notifyUser: true });
  };

  const clearTimeTravelPeek = () => {
    setTimeTravelAnchor(null);
    setSelectedHistogramBucket(null);
    fetchChronoLogs({ aroundTimestamp: '', notifyUser: true });
  };

  const [shellHistoryCursor, setShellHistoryCursor] = useState(-1);

  const quickCommands = [
    { label: 'List Buckets', cmd: `gcloud storage buckets list --project=${projectId}` },
    { label: 'Cloud Run Fleet', cmd: `gcloud run services list --project=${projectId}` },
    { label: 'Compute VMs', cmd: `gcloud compute instances list --project=${projectId}` },
    { label: 'VPC Networks', cmd: `gcloud compute networks list --project=${projectId}` },
    { label: 'Firewall Rules', cmd: `gcloud compute firewall-rules list --project=${projectId}` },
    { label: 'IAM Service Accounts', cmd: `gcloud iam service-accounts list --project=${projectId}` },
    { label: 'Secret Manager', cmd: `gcloud secrets list --project=${projectId}` },
    { label: 'BigQuery Datasets', cmd: `bq ls --project_id=${projectId}` },
    { label: 'Enabled APIs', cmd: `gcloud services list --enabled --project=${projectId} --limit=20` },
    { label: 'Recent Error Logs', cmd: `gcloud logging read "severity>=ERROR" --limit=5 --project=${projectId}` },
    { label: 'SDK Version', cmd: `gcloud version` },
    { label: 'Active Auth', cmd: 'gcloud auth list' },
  ];

  const filteredLogs = logs.filter((l) => {
    if (severityFilter === 'ALL') return true;
    return l.severity === severityFilter;
  });

  const filteredAuditEvents = (auditData?.events || []).filter((ev) => {
    if (auditCategoryFilter !== 'ALL' && ev.actionCategory !== auditCategoryFilter) {
      return false;
    }
    if (auditActorFilter !== 'ALL' && ev.principalEmail !== auditActorFilter) {
      return false;
    }
    return true;
  });

  const executeShellCommand = useCallback(
    async (cmdOverride) => {
      const cmd = sanitizeExecutableCliInput(cmdOverride || shellInput);
      if (!cmd || shellRunning) return;
      setShellInput(cmd);
      setShellHistoryCursor(-1);
      setShellRunning(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/shell`,
          { command: cmd }
        );
        setShellHistory((prev) => [
          {
            id: `cmd-${Date.now()}`,
            command: res.data.command || cmd,
            output: res.data.output,
            durationMs: res.data.durationMs,
            exitCode: res.data.exitCode ?? 0,
            engine: res.data.engine || 'HYBRID_SHELL',
          },
          ...prev,
        ]);
      } catch (err) {
        setShellHistory((prev) => [
          {
            id: `cmd-${Date.now()}`,
            command: cmd,
            output: err.response?.data?.error || err.message,
            durationMs: 0,
            exitCode: 1,
            engine: 'ERROR',
          },
          ...prev,
        ]);
      } finally {
        setShellRunning(false);
      }
    },
    [projectId, shellInput, shellRunning]
  );

  const lastExecutedNonceRef = useRef(0);
  useEffect(() => {
    const cleanCmd = sanitizeExecutableCliInput(initialCommand);
    if (!cleanCmd) return;
    setShellInput(cleanCmd);
    if (
      initialCommandNonce &&
      initialCommandNonce !== lastExecutedNonceRef.current
    ) {
      lastExecutedNonceRef.current = initialCommandNonce;
      executeShellCommand(cleanCmd);
    }
  }, [initialCommand, initialCommandNonce, executeShellCommand]);

  const cycleShellHistory = (direction) => {
    if (shellHistory.length === 0) return;
    const nextIdx =
      direction === 'PREV'
        ? Math.min(shellHistory.length - 1, shellHistoryCursor + 1)
        : Math.max(-1, shellHistoryCursor - 1);
    setShellHistoryCursor(nextIdx);
    if (nextIdx >= 0 && shellHistory[nextIdx]) {
      setShellInput(shellHistory[nextIdx].command);
    } else if (nextIdx === -1) {
      setShellInput('');
    }
  };

  const formatLogDate = (iso) => {
    try {
      return formatDateTime(iso, { includeSeconds: false, includeZone: true });
    } catch {
      return String(iso || '');
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev === 'ERROR' || sev === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-500/20">
          <AlertCircle className="w-3 h-3" />
          {sev}
        </span>
      );
    }
    if (sev === 'WARNING') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3" />
          WARN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/20">
        <Info className="w-3 h-3" />
        INFO
      </span>
    );
  };

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'CREATE':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';
      case 'DELETE':
        return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40';
      case 'IAM_SECURITY':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40';
      case 'POWER':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40';
      default:
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40';
    }
  };

  const activeSelectedBucket =
    selectedHistogramBucket !== null
      ? (chronoData?.histogramBuckets || []).find(
          (b) => b.bucketIndex === selectedHistogramBucket
        ) || null
      : null;

  const bucketFilteredEntries = activeSelectedBucket
    ? getBucketMatchingEntries(activeSelectedBucket)
    : chronoData?.entries || [];

  const chronoEntries = bucketFilteredEntries.filter((e) => {
    if (severityFilter === 'ALL') return true;
    return e.severity === severityFilter;
  });

  const activeWaterfall =
    (chronoData?.traceWaterfalls || []).find(
      (w) => w.traceId === selectedTraceId
    ) || chronoData?.traceWaterfalls?.[0];

  return (
    <div className="space-y-6">
      {/* 1-Click 30-Day Cloud Recycle Bin Banner in Logs Explorer */}
      {onOpenRecycleBin && (
        <div className="p-3.5 rounded-2xl border border-blue-500/30 bg-white dark:bg-[#202124] flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-sm">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[10px] font-extrabold uppercase">
              30-DAY DESTRUCTION &amp; API LEDGER
            </span>
            <span className="font-bold text-zinc-900 dark:text-zinc-100">
              Looking for what was deleted or which Google Cloud API was disabled in the last 1 month?
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenRecycleBin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold cursor-pointer shadow-sm"
          >
            <span>Open 30-Day Cloud Recycle Bin →</span>
          </button>
        </div>
      )}

      {/* Pinned Forensic Event Deep-Dive Card when navigated from Global Network World Map */}
      {activeMapForensicSpec && (
        <div className="bg-sky-500/[0.08] dark:bg-sky-950/35 border-2 border-sky-500/50 rounded-2xl p-4 shadow-sm space-y-3 text-xs font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500 text-white font-extrabold text-[11px]">
                🔍 GLOBAL MAP FORENSIC TRACE LOADED
              </span>
              <span
                className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                  activeMapForensicSpec.verdict === 'ALLOW'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30'
                }`}
              >
                {activeMapForensicSpec.verdict === 'ALLOW'
                  ? '● VERDICT: ALLOW'
                  : '✕ VERDICT: DENY'}
              </span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                [{activeMapForensicSpec.timestamp}]{' '}
                {activeMapForensicSpec.sourceIp || 'edge'} ➔{' '}
                {activeMapForensicSpec.regionId} (
                {activeMapForensicSpec.regionCity || 'GCP'}) ·{' '}
                {(activeMapForensicSpec.protocol || 'tcp').toUpperCase()}:
                {activeMapForensicSpec.port || 443}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-extrabold">
                🔧 Requires gcloud CLI · Online Token Bridged
              </span>
              {activeMapForensicSpec.gcloudCommand && (
                <button
                  type="button"
                  onClick={() =>
                    executeShellCommand(activeMapForensicSpec.gcloudCommand)
                  }
                  className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[10px] cursor-pointer"
                >
                  ▶ Run Live gcloud logging read in Cloud Shell
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveMapForensicSpec(null)}
                className="px-2 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-[10px] cursor-pointer"
              >
                ✕ Dismiss
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                Compiled Cloud Logging LQL Filter
              </div>
              <div className="font-bold text-blue-600 dark:text-blue-400 mt-1 break-all">
                {activeMapForensicSpec.lqlFilter}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                Matched Rule / Socket / Audit Summary
              </div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {activeMapForensicSpec.category} ·{' '}
                {activeMapForensicSpec.summary}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-400 font-bold">
                Structured Forensic JSON Payload
              </div>
              <pre className="text-[9.5px] text-zinc-700 dark:text-zinc-300 mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(
                  activeMapForensicSpec.rawPayload || activeMapForensicSpec,
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MOONSHOT 2026: NEURAL CHRONO-LOG & TRACE STUDIO
          Replaces legacy 2016 Cloud Logging JSON tree digging with:
          1. Semantic Drain3 Log Clustering
          2. Distributed Cross-Service Trace Waterfall (`traceId` stitching)
          3. Natural Language <-> LQL + BigQuery Log Analytics SQL
          4. Zero-JSON-Digging Cards + `±30s` Time-Travel Window
          5. Log FinOps Byte-Burn & 1-Click `_Default` Sink Exclusion
          6. Live DLP Secret & PII Leak Redaction Radar
         =================================================================== */}
      <div
        id="chrono-logs-explorer-card"
        className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4"
      >
        {/* Top Studio Header & Live Telemetry KPIs */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[11px] font-mono font-extrabold">
                <Zap className="w-3.5 h-3.5" />
                <span>2026 NEURAL CHRONO-LOG & TRACE STUDIO</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                <Layers className="w-3 h-3" />
                <span>Drain3 Clustering: {chronoData?.stats?.deduplicationRatioPct || 68}% Noise Collapsed</span>
              </span>
              {chronoData?.stats?.dlpLeakCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                  <ShieldAlert className="w-3 h-3" />
                  <span>{chronoData.stats.dlpLeakCount} DLP Token/Key Leaks Detected</span>
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold">
                <Clock className="w-3 h-3" />
                <span>{activeTimeZone} ({utcOffsetLabel})</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-1">
              Zero-JSON-Digging Log Intelligence, Cross-Service Trace Stitching & `_Default` Sink FinOps
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Type plain English or LQL to query <code className="font-mono">logging.googleapis.com/v2/entries:list</code>, collapse repetitive stack traces into Drain3 signatures, inspect cross-service <code className="font-mono">traceId</code> waterfalls, and cut <code className="font-mono">$0.50/GiB</code> log ingestion noise in 1 click.
            </p>
          </div>

          {/* 4 Live Studio Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">Signatures</div>
              <div className="text-sm font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                {chronoData?.stats?.totalEntries || 0} ➔ {chronoData?.stats?.uniqueSignatures || 0}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">Stitched Traces</div>
              <div className="text-sm font-mono font-extrabold text-blue-600 dark:text-blue-400">
                {chronoData?.stats?.activeTraces || 0} Waterfalls
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">FinOps Savable</div>
              <div className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                ${(chronoData?.stats?.potentialMonthlySavingsUsd || 0).toFixed(2)}/mo
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] font-mono text-zinc-500">DLP Shield</div>
              <div className="text-sm font-mono font-extrabold text-amber-600 dark:text-amber-400">
                {chronoData?.stats?.dlpLeakCount || 0} Alerts
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 3: Bi-Directional Natural Language <-> LQL + BigQuery Log Analytics SQL Bar */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCustomLqlInput('');
              setActiveSavedViewId(null);
              fetchChronoLogs({ lqlFilter: '', notifyUser: true });
            }}
            className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-blue-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={nlQueryInput}
                onChange={(e) => setNlQueryInput(e.target.value)}
                placeholder='Ask in plain English or LQL: e.g. "bigquery dataset logs", "5xx timeouts on cloud run", or resource.type="bigquery_resource"...'
                className="w-full bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-8 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
              />
              {(nlQueryInput || customLqlInput) && (
                <button
                  type="button"
                  title="Clear search & reset to all project logs"
                  onClick={() => {
                    setNlQueryInput('');
                    setCustomLqlInput('');
                    setActiveSavedViewId(null);
                    fetchChronoLogs({
                      naturalLanguage: '',
                      lqlFilter: '',
                      notifyUser: true,
                    });
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="submit"
                data-feature-id="LOGS_COMPILE_RUN_BTN"
                disabled={loadingChrono}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingChrono ? 'animate-spin' : ''}`}
                />
                <span>{loadingChrono ? 'Compiling & Querying...' : 'Compile & Run'}</span>
              </button>

              <button
                type="button"
                data-feature-id="LOGS_VIEW_SQL_BTN"
                onClick={() => setShowCompiledSqlModal((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>{showCompiledSqlModal ? 'Hide LQL / BigQuery SQL' : 'View LQL & BigQuery SQL'}</span>
              </button>

              <button
                type="button"
                data-feature-id="LOGS_LQL_TUTORIAL_BTN"
                onClick={() => setShowLqlTutorialModal((v) => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono font-bold cursor-pointer border transition-colors ${
                  showLqlTutorialModal
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>{showLqlTutorialModal ? 'Hide LQL & NLP Guide' : 'LQL Tutorial & How NLP Works'}</span>
              </button>

              <button
                type="button"
                data-feature-id="LOGS_LLM_TOGGLE_BTN"
                onClick={() => {
                  const next = !allowNeuralLlmTokens;
                  setAllowNeuralLlmTokens(next);
                  fetchChronoLogs({ allowNeuralLlmTokens: next });
                }}
                title={
                  allowNeuralLlmTokens
                    ? 'BILLABLE TOKEN WARNING: Gemini / Vertex AI neural LLM calls are currently enabled (~130 tokens/query). Click to lock back to $0.00 Local NLP.'
                    : '0 LLM tokens consumed ($0.00). Click only if you want to authorize Gemini RAM Vault / Vertex AI token consumption.'
                }
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono font-bold cursor-pointer border transition-colors ${
                  allowNeuralLlmTokens
                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/50'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40'
                }`}
              >
                <AlertTriangle
                  className={`w-3.5 h-3.5 ${
                    allowNeuralLlmTokens ? 'text-amber-500' : 'text-zinc-400'
                  }`}
                />
                <span>
                  {allowNeuralLlmTokens
                    ? 'Vertex / Gemini LLM: ON (Consumes Tokens)'
                    : 'Local NLP Only ($0.00 · 0 Tokens)'}
                </span>
              </button>
            </div>
          </form>

          {/* Explicit Vertex AI / Gemini API Key Token Consumption Warning Banner */}
          {allowNeuralLlmTokens && (
            <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-amber-800 dark:text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong>TOKEN CONSUMPTION WARNING (Vertex AI / Gemini API Key):</strong>{' '}
                  Neural LLM query compilation sends your natural-language query to your selected{' '}
                  <strong>Gemini model</strong> (configured in the RAM Vault or via Vertex AI{' '}
                  <code className="font-bold">aiplatform.googleapis.com</code> ADC) and consumes{' '}
                  <strong>~100–250 input/output tokens per query</strong> against your quota/billing. Keep this{' '}
                  <strong>OFF</strong> to use the 100% free local Porter Stemmer + NER + BM25 engine at{' '}
                  <strong>$0.00 (0 tokens)</strong>.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAllowNeuralLlmTokens(false);
                  fetchChronoLogs({ allowNeuralLlmTokens: false });
                }}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10.5px] font-mono font-bold cursor-pointer shrink-0"
              >
                Switch Back to $0.00 Local NLP
              </button>
            </div>
          )}

          {/* Interactive LQL Tutorial & 3-Layer NLP Architecture Drawer */}
          {showLqlTutorialModal && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#18191c] border border-emerald-500/30 space-y-4 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-extrabold">
                      INTERACTIVE ENGINEERING GUIDE
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      How Our 3-Layer NLP-to-LQL Compiler Works & Official Google Cloud LQL Tutorial
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Click any LQL syntax example below to load and execute it live against <code className="font-mono">logging.googleapis.com/v2/entries:list</code>.
                  </p>
                </div>
                <a
                  href="https://docs.cloud.google.com/logging/docs/view/logging-query-language"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-mono font-bold"
                >
                  <span>Official Google Cloud LQL Docs</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Part 1: How the 3-Layer NLP-to-LQL Engine Works */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[10.5px] font-mono font-extrabold text-blue-600 dark:text-blue-400">
                    STAGE 1 · LEXER & PORTER STEMMER ($0.00 · 0 TOKENS)
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Strips conversational stop-words (<code className="font-mono">&quot;show me&quot;</code>, <code className="font-mono">&quot;in the&quot;</code>) and applies the <strong>Porter Suffix Stemming Algorithm</strong> locally in Node.js (<code className="font-mono">&quot;timeouts&quot;</code> ➔ <code className="font-mono">&quot;timeout&quot;</code>, <code className="font-mono">&quot;excluding&quot;</code> ➔ <code className="font-mono">&quot;exclud&quot;</code>).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[10.5px] font-mono font-extrabold text-blue-600 dark:text-blue-400">
                    STAGE 2 · NAMED ENTITY RECOGNITION ($0.00 · 0 TOKENS)
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Extracts structured telemetry slots locally: <strong>Services</strong> (<code className="font-mono">&quot;cloud run&quot;</code> ➔ <code className="font-mono">cloud_run_revision</code>), <strong>Geo Aliases</strong> (<code className="font-mono">&quot;iowa&quot;</code> ➔ <code className="font-mono">us-central1</code>), <strong>Latency Math</strong> (<code className="font-mono">&quot;slower than 1500ms&quot;</code> ➔ <code className="font-mono">&gt;&quot;1.5s&quot;</code>), <strong>Time Windows</strong>, and <strong>Negations</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[10.5px] font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    STAGE 3 · TF-IDF + BM25 ($0) + OPT-IN GEMINI LLM (CONSUMES TOKENS)
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Classifies SRE intent via <strong>TF-IDF Cosine Similarity</strong> and ranks logs using <strong>Okapi BM25</strong> for <strong>$0.00 (0 tokens)</strong>. Only when you explicitly toggle <strong>&quot;Vertex / Gemini LLM: ON&quot;</strong> will it call your selected <strong>Gemini model</strong> (consuming ~100–250 LLM tokens/query).
                  </p>
                </div>
              </div>

              {/* Part 2: Interactive Google Cloud LQL Cheat-Sheet & Tutorial */}
              <div className="space-y-2">
                <div className="text-[11px] font-mono font-extrabold text-zinc-800 dark:text-zinc-200 uppercase">
                  What is LQL (Logging Query Language)? Interactive Syntax Reference (Click any row to test live)
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                  <strong>LQL</strong> is Google Cloud&apos;s native domain-specific language for filtering <code className="font-mono">LogEntry</code> protobuf records across <code className="font-mono">logging.googleapis.com/v2/entries:list</code>, Log Sinks (<code className="font-mono">_Default</code> exclusions), and log-based metrics.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {[
                    {
                      concept: '1. Exact Equality (=) vs. Substring Has (:)',
                      rule: 'Use = for exact scalar match and : (colon) to check if a string or array field contains a substring (case-insensitive).',
                      lql: 'resource.type="cloud_run_revision" AND textPayload:"deadline exceeded"',
                      nl: '5xx timeouts on cloud run over 1s',
                    },
                    {
                      concept: '2. Ordered Severity & Numeric Comparisons (>=, >)',
                      rule: 'LogSeverity is ordered (DEFAULT < DEBUG < INFO < NOTICE < WARNING < ERROR < CRITICAL < ALERT < EMERGENCY).',
                      lql: 'severity>=ERROR AND httpRequest.status>=500 AND httpRequest.latency>"1.5s"',
                      nl: 'show me 5xx timeouts on cloud run in iowa slower than 1500ms in the last 2 hours excluding healthchecks',
                    },
                    {
                      concept: '3. Boolean Logic & Negation (AND, OR, NOT, -)',
                      rule: 'Implicitly joins adjacent expressions with AND. Prefix any clause with NOT or - (hyphen) to exclude noisy logs.',
                      lql: 'httpRequest.status=200 AND -httpRequest.requestUrl:"/healthz" AND NOT httpRequest.userAgent:"kube-probe"',
                      nl: 'all logs excluding healthchecks',
                    },
                    {
                      concept: '4. Regular Expressions (=~ and !~)',
                      rule: 'Use =~ for RE2 regular expression match and !~ for negated regex match (e.g. scanning for leaked API keys or JWTs).',
                      lql: 'textPayload =~ "(AIza[0-9A-Za-z_-]{15,}|Bearer eyJ)"',
                      nl: 'detect unmasked bearer jwt tokens or aiza api key leaks in europe-west1',
                    },
                    {
                      concept: '5. Multi-Value Set Membership (IN (...))',
                      rule: 'Use IN (...) to match multiple status codes, regions, or RPC methods without repetitive OR chains.',
                      lql: 'httpRequest.status IN (429, 503, 504) AND resource.labels.location IN ("us-central1", "europe-west1")',
                      nl: '429 rate limit quota exhausted on vertex ai over 1s',
                    },
                    {
                      concept: '6. Built-In FinOps Sampling Function: sample(field, fraction)',
                      rule: 'Built-in LQL function used in _Default Sink exclusions to sample a deterministic percentage (e.g. 90% drop) by hashing insertId or trace.',
                      lql: 'resource.type="http_load_balancer" AND httpRequest.status=200 AND sample(insertId, 0.90)',
                      nl: 'iam permission denied or secret manager 403 unauthorized access in the past 60m',
                    },
                  ].map((item) => (
                    <div
                      key={item.concept}
                      onClick={() => {
                        setCustomLqlInput(item.lql);
                        setNlQueryInput(item.nl);
                        setShowLqlTutorialModal(false);
                        fetchChronoLogs({
                          naturalLanguage: item.nl,
                          lqlFilter: item.lql,
                          notifyUser: true,
                        });
                      }}
                      className="p-2.5 rounded-lg bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-[11px] text-emerald-700 dark:text-emerald-400">
                          {item.concept}
                        </span>
                        <span className="text-[10px] font-mono text-blue-500 font-bold">
                          Click to Run LQL ➔
                        </span>
                      </div>
                      <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                        {item.rule}
                      </p>
                      <code className="block text-[10.5px] font-mono text-zinc-900 dark:text-zinc-200 bg-zinc-200/60 dark:bg-zinc-900 px-2 py-1 rounded overflow-x-auto">
                        {item.lql}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Instant Intent Preset Chips + Progressive Disclosure Drawer Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400">Intent Presets:</span>
              {NL_INTENT_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setNlQueryInput(preset.nl);
                    setCustomLqlInput('');
                    setActiveSavedViewId(null);
                    fetchChronoLogs({
                      naturalLanguage: preset.nl,
                      lqlFilter: '',
                      notifyUser: true,
                    });
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono transition-colors cursor-pointer border ${
                    nlQueryInput === preset.nl
                      ? 'bg-blue-600 text-white border-blue-500 font-bold'
                      : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Compact Progressive Disclosure Toggles (Keep main workspace clean by default) */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowNlpParseDrawer((v) => !v)}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  showNlpParseDrawer
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                }`}
              >
                <Cpu className="w-3 h-3 text-blue-500" />
                <span>{showNlpParseDrawer ? 'Hide NLP Parse Tree' : 'NLP Parse Tree & NER'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSavedViewsDrawer((v) => !v)}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  showSavedViewsDrawer
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40'
                }`}
              >
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>
                  {showSavedViewsDrawer
                    ? 'Hide Saved Views & Postmortem'
                    : `Saved SRE Views & Postmortem (${chronoData?.savedSreViews?.length || 6})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowHistogramDrawer((v) => !v)}
                className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                  showHistogramDrawer
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                }`}
              >
                <Clock className="w-3 h-3 text-blue-500" />
                <span>
                  {showHistogramDrawer ? 'Hide 24-Bucket Histogram' : 'Timeline Histogram (24 Buckets)'}
                </span>
              </button>
            </div>
          </div>

          {/* Collapsible 3-Layer NLP Parse Tree: Porter Stemmer, Named Entity Recognition (NER), TF-IDF Cosine Intent & BM25 Ranker */}
          {showNlpParseDrawer && chronoData?.compiledQuery?.nlpAnalysis && (() => {
            const nlp = chronoData.compiledQuery.nlpAnalysis;
            const ent = nlp.entities || {};
            const tokGuard = nlp.tokenConsumptionGuard;
            const nerBadges = [
              ...(ent.services || []).map((s) => ({ type: 'SERVICE', value: s.label })),
              ...(ent.statusClass ? [{ type: 'HTTP_CLASS', value: ent.statusClass }] : []),
              ...(ent.httpStatuses || []).map((code) => ({ type: 'STATUS', value: String(code) })),
              ...(ent.latency
                ? [{ type: 'LATENCY', value: `${ent.latency.operator} ${ent.latency.thresholdMs}ms` }]
                : []),
              ...(ent.timeWindow
                ? [{ type: 'TEMPORAL', value: ent.timeWindow.raw }]
                : []),
              ...(ent.regions || []).map((r) => ({ type: 'REGION', value: r })),
              ...(ent.negations || []).map((n) => ({ type: 'NEGATION', value: n.label })),
              ...(ent.severities || []).map((sev) => ({ type: 'SEVERITY', value: sev })),
            ];
            const cosinePct = Math.round((nlp.intent?.cosineSimilarity || 0) * 100);
            return (
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#1a1b1e] border border-blue-500/25 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-extrabold">
                      <Cpu className="w-3 h-3" />
                      <span>NLP Engine: {nlp.engine}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        TF-IDF Intent: {nlp.intent?.topIntentLabel || 'General Telemetry Exploration'}{' '}
                        ({cosinePct}% Cosine)
                      </span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                      Ranker: Okapi BM25 + NER Slot Scorer
                    </span>
                    {tokGuard && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          tokGuard.totalTokenCount > 0
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                        }`}
                        title={tokGuard.notice}
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>
                          {tokGuard.totalTokenCount > 0
                            ? `LLM Spend: ${tokGuard.totalTokenCount} tokens (~$${Number(
                                tokGuard.estimatedCostUsd || 0
                              ).toFixed(5)})`
                            : 'LLM Spend: 0 tokens ($0.00 Local NLP)'}
                        </span>
                      </span>
                    )}
                  </div>

                  {nlp.stems?.length > 0 && (
                    <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      Porter Stems:{' '}
                      <code className="text-zinc-700 dark:text-zinc-200 font-bold">
                        [{nlp.stems.join(', ')}]
                      </code>
                    </div>
                  )}
                </div>

                {/* Extracted Named Entities (NER Slots) */}
                {nerBadges.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-200/70 dark:border-zinc-800/80">
                    <span className="text-[10px] font-mono text-zinc-400">
                      Extracted NER Slots:
                    </span>
                    {nerBadges.map((badge, idx) => (
                      <span
                        key={`${badge.type}-${idx}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono"
                      >
                        <strong className="text-blue-600 dark:text-blue-400">
                          {badge.type}:
                        </strong>
                        <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                          {badge.value}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                    {chronoData.compiledQuery.explanation}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Collapsible Compiled LQL & Linked BigQuery Log Analytics SQL Drawer */}
          {showCompiledSqlModal && chronoData?.compiledQuery && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-blue-700 dark:text-blue-300 font-bold">
                    Native Cloud Logging LQL Filter (`entries:list`)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        chronoData.compiledQuery.effectiveLql || 'severity>=DEFAULT',
                        'copy-lql'
                      )
                    }
                    className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'copy-lql' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy LQL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customLqlInput || chronoData.compiledQuery.effectiveLql || ''}
                    onChange={(e) => setCustomLqlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        fetchChronoLogs({
                          lqlFilter: customLqlInput,
                          notifyUser: true,
                        });
                      }
                    }}
                    placeholder='resource.type="cloud_run_revision" AND severity>=ERROR'
                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2.5 py-1.5 text-[11px] font-mono text-emerald-700 dark:text-emerald-300"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      fetchChronoLogs({
                        lqlFilter:
                          customLqlInput ||
                          chronoData.compiledQuery.effectiveLql ||
                          '',
                        notifyUser: true,
                      })
                    }
                    className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-mono font-bold cursor-pointer shrink-0"
                  >
                    Run LQL
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-blue-700 dark:text-blue-300 font-bold">
                    Log Analytics BigQuery SQL (`_Default._AllLogs`)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(chronoData.compiledQuery.bigQuerySql, 'copy-bq-sql')
                    }
                    className="text-[10px] font-mono text-zinc-700 dark:text-zinc-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'copy-bq-sql' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy BigQuery SQL</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-blue-800 dark:text-blue-200 overflow-x-auto max-h-28">
                  {chronoData.compiledQuery.bigQuerySql}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            COLLAPSIBLE WAVE 2: SAVED SRE VIEWS BAR, SHAREABLE PERMALINK
            & 1-CLICK INCIDENT POSTMORTEM MARKDOWN / JSON BUNDLE EXPORTER
           =================================================================== */}
        {showSavedViewsDrawer && (
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-extrabold">
                  SAVED SRE VIEWS
                </span>
                {(chronoData?.savedSreViews || []).map((sv) => {
                  const isActive = activeSavedViewId === sv.id;
                  return (
                    <button
                      key={sv.id}
                      type="button"
                      onClick={() => {
                        setActiveSavedViewId(sv.id);
                        setNlQueryInput(sv.nl);
                        setCustomLqlInput(sv.lql);
                        setSeverityFilter(sv.severity || 'ALL');
                        fetchChronoLogs({
                          naturalLanguage: sv.nl,
                          lqlFilter: sv.lql,
                          notifyUser: true,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold border transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40'
                      }`}
                    >
                      {sv.name}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(buildShareablePermalink(), 'copy-permalink')}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-[#202124] hover:border-blue-500/50 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === 'copy-permalink' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Permalink Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-blue-500" />
                      <span>Copy Investigation Permalink</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowPostmortemModal((v) => !v)}
                  className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold border cursor-pointer inline-flex items-center gap-1 ${
                    showPostmortemModal
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/25'
                  }`}
                >
                  <FileCode2 className="w-3 h-3" />
                  <span>
                    {showPostmortemModal
                      ? 'Hide Incident Postmortem Bundle'
                      : '1-Click Export Incident Postmortem (.md / .json)'}
                  </span>
                </button>
              </div>
            </div>

            {showPostmortemModal && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-blue-500/40 space-y-2.5 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold mr-2">
                      INCIDENT POSTMORTEM &amp; FORENSIC BUNDLE EXPORTER
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      Ready for GitHub Issue, PagerDuty, Slack or Google Docs Postmortem
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(buildIncidentPostmortemMarkdown(), 'copy-postmortem-md')
                      }
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'copy-postmortem-md' ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied Markdown (.md)</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Postmortem Markdown (.md)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          JSON.stringify(
                            {
                              projectId,
                              exportedAt: new Date().toISOString(),
                              effectiveLql: chronoData?.compiledQuery?.effectiveLql,
                              anomalyBaselineDiff: chronoData?.anomalyBaselineDiff,
                              logToMetricsByService: chronoData?.logToMetricsByService,
                              pinnedEntries: (chronoData?.entries || []).filter((e) =>
                                pinnedLogIds.includes(e.id)
                              ),
                            },
                            null,
                            2
                          ),
                          'copy-postmortem-json'
                        )
                      }
                      className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'copy-postmortem-json' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied JSON Bundle</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Forensic JSON (.json)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <pre className="text-[10.5px] text-zinc-800 dark:text-zinc-200 overflow-x-auto max-h-56 p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap">
                  {buildIncidentPostmortemMarkdown()}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            COLLAPSIBLE OPEN-SOURCE 2026 FEATURE #1 + WAVE 2 INFRA OVERLAY:
            INTERACTIVE STACKED SEVERITY HISTOGRAM, CPU/RAM SPARKBARS &
            K8S / CLOUD RUN DEPLOYMENT & QUOTA EVENT MARKERS
           =================================================================== */}
        {showHistogramDrawer && Array.isArray(chronoData?.histogramBuckets) && chronoData.histogramBuckets.length > 0 && (
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-extrabold">
                  CLICKHOUSE / HYPERDX / LOKI HISTOGRAM + INFRA OVERLAY
                </span>
                <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  Stacked Severity Volume, P95 Latency &amp; Deployment/Quota Markers (Click any bar or event pill to inspect what happened)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
                <button
                  type="button"
                  onClick={() => jumpToAdjacentActiveBucket('PREV')}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#202124] hover:border-blue-500/40 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-bold cursor-pointer"
                  title="Jump to previous non-empty histogram bar and inspect its logs"
                >
                  ◀ Prev Active Bar
                </button>
                <button
                  type="button"
                  onClick={() => jumpToAdjacentActiveBucket('NEXT')}
                  className="px-2 py-0.5 rounded bg-white dark:bg-[#202124] hover:border-blue-500/40 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 font-bold cursor-pointer"
                  title="Jump to next non-empty histogram bar and inspect its logs"
                >
                  Next Active Bar ▶
                </button>
                <button
                  type="button"
                  onClick={() => setShowInfraOverlay((v) => !v)}
                  className={`px-2 py-0.5 rounded border font-bold cursor-pointer ${
                    showInfraOverlay
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                  }`}
                >
                  {showInfraOverlay ? 'Infra CPU/RAM & Deploy Overlay: ON' : 'Infra Overlay: OFF'}
                </button>
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> ERROR
                </span>
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> WARN
                </span>
                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" /> INFO
                </span>
                {selectedHistogramBucket !== null && (
                  <button
                    type="button"
                    onClick={() => handleSelectHistogramBucket(null)}
                    className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold cursor-pointer"
                  >
                    ✕ Show All 24 Bars
                  </button>
                )}
              </div>
            </div>

            {/* Correlated K8s / Cloud Run Revision & Quota Event Marker Pills */}
            {showInfraOverlay && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-[10px] font-mono text-zinc-500">
                  Correlated Infrastructure Events (Click to jump to logs):
                </span>
                {chronoData.histogramBuckets
                  .filter((b) => b.infraMarker)
                  .map((b) => {
                    const isPillSelected = selectedHistogramBucket === b.bucketIndex;
                    return (
                      <button
                        key={b.bucketIndex}
                        type="button"
                        onClick={() => handleSelectHistogramBucket(b)}
                        title={`${b.infraMarker.detail} — Click to filter and inspect ${b.totalCount} logs in Bucket #${b.bucketIndex + 1}/24 (${b.label})`}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer inline-flex items-center gap-1.5 transition-all ${
                          isPillSelected
                            ? 'ring-2 ring-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500'
                            : b.infraMarker.type === 'QUOTA_EXHAUSTION'
                            ? 'bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 border-red-500/40'
                            : 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border-blue-500/40'
                        }`}
                      >
                        <span className="underline">{b.infraMarker.badge}</span>
                        <span>@ {b.label}:</span>
                        <span className="font-normal">{b.infraMarker.title}</span>
                        <span className="px-1 rounded bg-black/10 dark:bg-white/10 text-[9px] font-extrabold">
                          {b.totalCount} logs
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}

            {/* 24-Bucket Interactive Bar Chart + Correlated CPU/Memory Utilization Sparkbars */}
            {(() => {
              const buckets = chronoData.histogramBuckets;
              const maxTotal = Math.max(1, ...buckets.map((b) => b.totalCount));
              const activeReadoutBucket =
                buckets.find((b) => b.bucketIndex === hoveredHistogramBucket) ||
                buckets.find((b) => b.bucketIndex === selectedHistogramBucket) ||
                buckets.filter((b) => b.totalCount > 0).slice(-1)[0] ||
                buckets[buckets.length - 1] ||
                buckets[0];
              return (
                <div className="space-y-2" data-no-hover-explainer="true">
                  <div
                    className="grid grid-cols-24 gap-1 items-end h-32 pt-4 px-1"
                    style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}
                    onMouseLeave={() => setHoveredHistogramBucket(null)}
                  >
                    {buckets.map((b) => {
                      const hasLogs = b.totalCount > 0;
                      const errH =
                        b.errorCount > 0
                          ? Math.max(8, Math.round((b.errorCount / maxTotal) * 54))
                          : 0;
                      const warnH =
                        b.warningCount > 0
                          ? Math.max(6, Math.round((b.warningCount / maxTotal) * 54))
                          : 0;
                      const infoH =
                        b.infoCount > 0
                          ? Math.max(8, Math.round((b.infoCount / maxTotal) * 54))
                          : 0;
                      const isSelected = selectedHistogramBucket === b.bucketIndex;
                      const isHovered = hoveredHistogramBucket === b.bucketIndex;
                      return (
                        <button
                          key={b.bucketIndex}
                          type="button"
                          onMouseEnter={() => setHoveredHistogramBucket(b.bucketIndex)}
                          onClick={() => handleSelectHistogramBucket(b)}
                          title={`Bucket #${b.bucketIndex + 1}/24 (${b.label}${
                            b.windowLabel ? ` · ${b.windowLabel}` : ''
                          }) — Total: ${b.totalCount} (ERR: ${b.errorCount}, WARN: ${
                            b.warningCount
                          }, INFO: ${b.infoCount}) — Click to inspect logs below`}
                          className={`group flex flex-col justify-end items-center h-full cursor-pointer rounded-t transition-all relative focus:outline-none ${
                            isSelected
                              ? 'ring-2 ring-amber-500 bg-amber-500/15 dark:bg-amber-500/20 shadow-sm'
                              : isHovered
                              ? 'bg-blue-500/10 dark:bg-blue-500/20 ring-1 ring-blue-500/40'
                              : b.isAnomalySpike
                              ? 'bg-red-500/5 hover:bg-red-500/15'
                              : hasLogs
                              ? 'bg-zinc-200/30 dark:bg-zinc-800/30 hover:bg-zinc-200/80 dark:hover:bg-zinc-800/80'
                              : 'hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {/* Top Infra Event Marker Badge */}
                          {showInfraOverlay && b.infraMarker && (
                            <span
                              className={`text-[7.5px] font-mono font-extrabold px-1 rounded-full mb-0.5 truncate max-w-full ${
                                b.infraMarker.type === 'QUOTA_EXHAUSTION'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {b.infraMarker.badge}
                            </span>
                          )}

                          {/* Numeric Count Pill on Active Bars */}
                          {hasLogs && (
                            <span
                              className={`text-[8.5px] font-mono font-extrabold leading-none mb-0.5 ${
                                isSelected
                                  ? 'text-amber-700 dark:text-amber-300'
                                  : b.errorCount > 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : b.warningCount > 0
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {b.totalCount}
                            </span>
                          )}

                          <div className="w-full flex flex-col justify-end rounded-t overflow-hidden px-0.5">
                            {hasLogs ? (
                              <>
                                {b.errorCount > 0 && (
                                  <div
                                    style={{ height: `${errH}px` }}
                                    className="w-full bg-red-500 rounded-t-[2px]"
                                  />
                                )}
                                {b.warningCount > 0 && (
                                  <div
                                    style={{ height: `${warnH}px` }}
                                    className="w-full bg-amber-500"
                                  />
                                )}
                                {b.infoCount > 0 && (
                                  <div
                                    style={{ height: `${infoH}px` }}
                                    className="w-full bg-blue-500/85 dark:bg-blue-500/80 rounded-b-[2px]"
                                  />
                                )}
                              </>
                            ) : (
                              <div className="w-full h-[2px] bg-zinc-300/70 dark:bg-zinc-800 rounded-full" />
                            )}
                          </div>

                          {/* Correlated Container CPU Utilization Micro-Bar */}
                          {showInfraOverlay && (
                            <div className="w-full px-0.5 mt-1">
                              <div className="w-full h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                <div
                                  style={{
                                    width: `${hasLogs ? b.cpuUtilizationPct || 35 : 8}%`,
                                  }}
                                  className={`h-full ${
                                    !hasLogs
                                      ? 'bg-zinc-300 dark:bg-zinc-700'
                                      : (b.cpuUtilizationPct || 0) >= 85
                                      ? 'bg-red-500'
                                      : (b.cpuUtilizationPct || 0) >= 65
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                />
                              </div>
                            </div>
                          )}

                          <span
                            className={`text-[8.5px] font-mono mt-0.5 truncate ${
                              isSelected
                                ? 'font-extrabold text-amber-700 dark:text-amber-300'
                                : hasLogs
                                ? 'font-bold text-zinc-600 dark:text-zinc-300'
                                : 'text-zinc-400'
                            }`}
                          >
                            {b.bucketIndex % 4 === 0 || isSelected || hasLogs ? b.label : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fixed-Height Single-Line Bucket Readout Bar (Zero Layout Shift on Hover) */}
                  {activeReadoutBucket && (
                    <div className="min-h-7 py-1 px-3 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                          Bucket #{activeReadoutBucket.bucketIndex + 1}/24 ({activeReadoutBucket.label})
                        </span>
                        {activeReadoutBucket.windowLabel && (
                          <span className="text-zinc-500 shrink-0">
                            [{activeReadoutBucket.windowLabel}]
                          </span>
                        )}
                        <span className="text-zinc-400">·</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 shrink-0">
                          Total: {activeReadoutBucket.totalCount}
                        </span>
                        <span className="text-red-600 dark:text-red-400 shrink-0">
                          ERR: {activeReadoutBucket.errorCount}
                        </span>
                        <span className="text-amber-600 dark:text-amber-400 shrink-0">
                          WARN: {activeReadoutBucket.warningCount}
                        </span>
                        <span className="text-blue-600 dark:text-blue-400 shrink-0">
                          INFO: {activeReadoutBucket.infoCount}
                        </span>
                        {activeReadoutBucket.sampleSummary && (
                          <>
                            <span className="text-zinc-400 hidden md:inline">·</span>
                            <span className="text-zinc-600 dark:text-zinc-400 truncate max-w-md hidden md:inline">
                              {activeReadoutBucket.sampleSummary}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 text-zinc-500 shrink-0">
                        <span className="hidden sm:inline">P95: {activeReadoutBucket.p95LatencyMs}ms</span>
                        <span className="hidden sm:inline">·</span>
                        <span className="hidden sm:inline">CPU: {activeReadoutBucket.cpuUtilizationPct || 0}%</span>
                        <button
                          type="button"
                          onClick={() => handleSelectHistogramBucket(activeReadoutBucket)}
                          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer"
                        >
                          {selectedHistogramBucket === activeReadoutBucket.bucketIndex
                            ? '✓ Viewing This Bar Below'
                            : `Inspect ${activeReadoutBucket.totalCount} Logs ↓`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Active ±30s Time-Travel Lock Banner */}
        {timeTravelAnchor && (
          <div className="p-3 rounded-lg bg-amber-500/15 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-800 dark:text-amber-200">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                <strong>Time-Travel Window Active (±30s):</strong> Inspecting causal project events around{' '}
                <code className="font-bold">{formatLogDate(timeTravelAnchor)}</code>
              </span>
            </div>
            <button
              type="button"
              onClick={clearTimeTravelPeek}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-600 text-white text-[11px] font-mono font-bold cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Exit Time-Travel</span>
            </button>
          </div>
        )}

        {/* ===================================================================
            LIVE QUERY RESULTS ANCHOR & VISUAL EXECUTION SPOTLIGHT BANNER
            Auto-scrolled & highlighted whenever the user executes LQL, NL,
            or clicks any bar in the 24-Bucket Histogram!
           =================================================================== */}
        <div
          id="chrono-live-results-anchor"
          ref={resultsAnchorRef}
          className={`scroll-mt-20 rounded-xl border transition-all duration-300 overflow-hidden ${
            resultsFlashActive
              ? 'border-blue-500 ring-2 ring-blue-500/70 bg-blue-500/[0.06] dark:bg-blue-500/[0.12] shadow-lg shadow-blue-500/10'
              : activeSelectedBucket
              ? 'border-amber-500/60 bg-amber-500/[0.04] dark:bg-amber-500/[0.08]'
              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-[#16171a]'
          }`}
        >
          {/* Indeterminate Blue Progress Bar when Querying Cloud Logging */}
          {loadingChrono && (
            <div className="w-full h-1 bg-blue-500/20 overflow-hidden">
              <div className="h-full w-1/2 bg-blue-500 animate-pulse rounded-full" />
            </div>
          )}

          <div className="px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                  loadingChrono
                    ? 'bg-blue-600 text-white border-blue-500'
                    : activeSelectedBucket
                    ? 'bg-amber-600 text-white border-amber-500'
                    : resultsFlashActive
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    loadingChrono
                      ? 'bg-white animate-ping'
                      : activeSelectedBucket
                      ? 'bg-amber-200'
                      : 'bg-emerald-400'
                  }`}
                />
                <span>
                  {loadingChrono
                    ? 'QUERYING CLOUD LOGGING...'
                    : activeSelectedBucket
                    ? `BAR #${activeSelectedBucket.bucketIndex + 1}/24 SELECTED (${activeSelectedBucket.label})`
                    : 'LIVE QUERY RESULTS'}
                </span>
              </span>

              <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                {chronoEntries.length} Log {chronoEntries.length === 1 ? 'Entry' : 'Entries'} Shown
                {activeSelectedBucket
                  ? ` in Bucket #${activeSelectedBucket.bucketIndex + 1}/24 (of ${(chronoData?.entries || []).length} total)`
                  : ' Matched'}
              </span>
              <span className="text-zinc-400">·</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {chronoData?.stats?.uniqueSignatures || 0} Drain3 Signatures
              </span>
              {lastQueryMeta?.durationMs && (
                <>
                  <span className="text-zinc-400">·</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {lastQueryMeta.durationMs}ms
                  </span>
                </>
              )}
              <span className="text-zinc-400 hidden sm:inline">·</span>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 max-w-xl truncate">
                <span className="text-[10px] text-zinc-400 shrink-0">Active LQL:</span>
                <code
                  className="text-[10.5px] text-blue-600 dark:text-blue-300 font-bold truncate"
                  title={chronoData?.compiledQuery?.effectiveLql || 'All Project Logs (severity>=DEFAULT)'}
                >
                  {chronoData?.compiledQuery?.effectiveLql || 'All Project Logs (severity>=DEFAULT)'}
                </code>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    chronoData?.compiledQuery?.effectiveLql || 'severity>=DEFAULT',
                    'copy-results-lql'
                  )
                }
                className="px-2 py-1 rounded bg-white dark:bg-[#202124] hover:border-blue-500/40 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                {copiedId === 'copy-results-lql' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Copied LQL</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy LQL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowCompiledSqlModal((v) => !v)}
                className="px-2 py-1 rounded bg-white dark:bg-[#202124] hover:border-blue-500/40 text-blue-600 dark:text-blue-300 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-bold cursor-pointer"
              >
                {showCompiledSqlModal ? 'Hide LQL Editor' : 'Edit LQL / SQL'}
              </button>

              {(nlQueryInput ||
                customLqlInput ||
                severityFilter !== 'ALL' ||
                timeTravelAnchor ||
                selectedHistogramBucket !== null) && (
                <button
                  type="button"
                  onClick={() => {
                    setNlQueryInput('');
                    setCustomLqlInput('');
                    setSeverityFilter('ALL');
                    setTimeTravelAnchor(null);
                    setSelectedHistogramBucket(null);
                    setActiveSavedViewId(null);
                    fetchChronoLogs({
                      naturalLanguage: '',
                      lqlFilter: '',
                      aroundTimestamp: '',
                      notifyUser: true,
                    });
                  }}
                  className="px-2.5 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 border border-red-500/30 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Interactive Bar Graph Drilldown Banner: What Happened in This Bucket */}
          {activeSelectedBucket && (
            <div className="px-3.5 py-2.5 border-t border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/15 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-extrabold uppercase shrink-0">
                  WHAT HAPPENED IN BAR #{activeSelectedBucket.bucketIndex + 1}/24
                </span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 shrink-0">
                  {activeSelectedBucket.windowLabel || activeSelectedBucket.label}
                </span>
                <span className="text-zinc-400">·</span>
                <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 text-[10.5px] font-bold">
                  ERR: {activeSelectedBucket.errorCount}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10.5px] font-bold">
                  WARN: {activeSelectedBucket.warningCount}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-bold">
                  INFO: {activeSelectedBucket.infoCount}
                </span>
                {activeSelectedBucket.infraMarker && (
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">
                    {activeSelectedBucket.infraMarker.badge}: {activeSelectedBucket.infraMarker.title}
                  </span>
                )}
                {Array.isArray(activeSelectedBucket.topServices) &&
                  activeSelectedBucket.topServices.length > 0 && (
                    <span className="text-[11px] text-zinc-700 dark:text-zinc-300 truncate">
                      Services:{' '}
                      <strong>{activeSelectedBucket.topServices.join(', ')}</strong>
                    </span>
                  )}
                {activeSelectedBucket.sampleSummary && (
                  <span className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate max-w-xl">
                    · {activeSelectedBucket.sampleSummary}
                  </span>
                )}
                {activeSelectedBucket.totalCount === 0 && (
                  <span className="text-[11px] text-amber-800 dark:text-amber-200 font-bold">
                    No log entries occurred in this time slice — click &quot;Next Active Bar ▶&quot; to jump to the nearest active bar!
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => jumpToAdjacentActiveBucket('PREV')}
                  className="px-2 py-1 rounded bg-white dark:bg-[#202124] hover:border-amber-500 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[10.5px] font-bold cursor-pointer"
                >
                  ◀ Prev Active Bar
                </button>
                <button
                  type="button"
                  onClick={() => jumpToAdjacentActiveBucket('NEXT')}
                  className="px-2 py-1 rounded bg-white dark:bg-[#202124] hover:border-amber-500 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[10.5px] font-bold cursor-pointer"
                >
                  Next Active Bar ▶
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectHistogramBucket(null)}
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Show All 24 Bars ({(chronoData?.entries || []).length} Logs)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Streamlined Primary Studio Tabs (5 Core Tabs + Expandable 7 Advanced SRE Labs) + Workbench Toolbar */}
        <div className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          {(() => {
            const primaryTabs = [
              {
                id: 'SMART_STREAM',
                label: `Live Log Stream & Table (${chronoEntries.length})`,
                icon: Zap,
              },
              {
                id: 'DRAIN3_CLUSTERS',
                label: `Drain3 Signatures (${chronoData?.drainClusters?.length || 0})`,
                icon: Layers,
              },
              {
                id: 'TRACE_WATERFALL',
                label: `Trace Waterfalls (${chronoData?.traceWaterfalls?.length || 0})`,
                icon: GitCommit,
              },
              {
                id: 'FINOPS_DLP',
                label: `Log FinOps & DLP (${chronoData?.dlpAlerts?.length || 0})`,
                icon: DollarSign,
              },
              {
                id: 'LOG_TO_METRICS',
                label: `Log-to-Metrics (${chronoData?.logToMetricsByService?.length || 4})`,
                icon: Cpu,
              },
            ];
            const advancedTabs = [
              {
                id: 'GROK_EXTRACTOR',
                label: `Live Grok / Regex Extractor (${chronoData?.grokVirtualExtractors?.length || 3})`,
                icon: Terminal,
              },
              {
                id: 'ANOMALY_DIFF',
                label: `Anomaly Baseline Diff (+${chronoData?.anomalyBaselineDiff?.overallErrorDeltaPct || 0}%)`,
                icon: AlertTriangle,
              },
              {
                id: 'QUERY_TRANSPILER',
                label: `Polyglot Query Transpiler (6 Formats)`,
                icon: FileCode2,
              },
              {
                id: 'SOURCE_BLAME',
                label: `Source-Code Blame & Hotfix (${chronoData?.sourceBlameAndHotfixes?.length || 3})`,
                icon: FileCode2,
              },
              {
                id: 'SLO_BURN_MATRIX',
                label: `SLO Error-Budget Burn`,
                icon: AlertCircle,
              },
              {
                id: 'EBPF_KERNEL_XRAY',
                label: `eBPF Syscall, DNS & TCP X-Ray (${chronoData?.ebpfKernelTelemetry?.length || 3})`,
                icon: Cpu,
              },
              {
                id: 'CANARY_REPLAY',
                label: `Canary Log Replay & Alert Drill (${chronoData?.replayScenarios?.length || 3})`,
                icon: Play,
              },
            ];
            const isAdvancedActive = advancedTabs.some((t) => t.id === activeChronoTab);
            return (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {primaryTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeChronoTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        data-feature-id={`LOGS_TAB_${tab.id}`}
                        onClick={() => setActiveChronoTab(tab.id)}
                        className={`h-9 px-3 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border inline-flex items-center gap-1.5 ${
                          active
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-zinc-100 dark:bg-[#131314] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowAdvancedLabsTabs((v) => !v)}
                    className={`h-9 px-3 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border inline-flex items-center gap-1.5 ml-auto ${
                      showAdvancedLabsTabs || isAdvancedActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                        : 'bg-zinc-100 dark:bg-[#131314] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    <span>
                      {showAdvancedLabsTabs || isAdvancedActive
                        ? 'Hide Advanced SRE Labs (7) ▴'
                        : 'More SRE Forensics & Labs (7) ▾'}
                    </span>
                  </button>
                </div>

                {(showAdvancedLabsTabs || isAdvancedActive) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800">
                    {advancedTabs.map((tab) => {
                      const Icon = tab.icon;
                      const active = activeChronoTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          data-feature-id={`LOGS_TAB_${tab.id}`}
                          onClick={() => setActiveChronoTab(tab.id)}
                          className={`w-full h-8.5 px-2.5 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer border inline-flex items-center gap-1.5 ${
                            active
                              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                              : 'bg-white dark:bg-[#202124] text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                          }`}
                        >
                          <Icon className="w-3 h-3 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Open-Source SRE Workbench Toolbar: Compact vs Detailed Cards vs Table View + Facet Sidebar + Regex Highlight + Live Tail + Pinned Bookmarks + JSON Diff */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* View Mode Switcher: Compact Cards vs Detailed Cards vs Columnar Table */}
              <div className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-[#131314] p-0.5 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    setStreamViewMode('CARDS');
                    setActiveChronoTab('SMART_STREAM');
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                    streamViewMode === 'CARDS'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Cards View
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStreamViewMode('COLUMN_TABLE');
                    setActiveChronoTab('SMART_STREAM');
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-colors ${
                    streamViewMode === 'COLUMN_TABLE'
                      ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  Columnar Table View
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowFacetSidebar((v) => !v)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border cursor-pointer inline-flex items-center gap-1.5 ${
                  showFacetSidebar
                    ? 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border-blue-500/40'
                    : 'bg-zinc-100 dark:bg-[#131314] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{showFacetSidebar ? 'Hide Facets' : 'Show Facets'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLiveTailActive((v) => !v)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border cursor-pointer inline-flex items-center gap-1.5 ${
                  liveTailActive
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-zinc-100 dark:bg-[#131314] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${liveTailActive ? 'bg-white animate-ping' : 'bg-emerald-500'}`} />
                <span>{liveTailActive ? 'Live Tail: STREAMING (4.5s)' : 'Start Live Tail'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPinnedOnly((v) => !v)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border cursor-pointer ${
                  showPinnedOnly
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-zinc-100 dark:bg-[#131314] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Pinned Bookmarks ({pinnedLogIds.length})
              </button>

              <button
                type="button"
                onClick={() => setShowPayloadDiffModal((v) => !v)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border cursor-pointer ${
                  showPayloadDiffModal
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                }`}
              >
                Side-by-Side JSON Diff ({diffSelectionIds.length}/2)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Regex Token Highlighter Input (lnav / Dozzle style) */}
              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-[#131314] px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                  Regex Highlight:
                </span>
                <input
                  type="text"
                  value={regexHighlightInput}
                  onChange={(e) => setRegexHighlightInput(e.target.value)}
                  placeholder="e.g. 504|429|deadline|Quota"
                  className="bg-transparent text-[11px] font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none w-44"
                />
              </div>

              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-[#131314] p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
                {['ALL', 'ERROR', 'WARNING', 'INFO'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                      severityFilter === sev
                        ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Side-by-Side JSON Payload Diff Drawer (lnav / SigNoz style) */}
        {showPayloadDiffModal && (() => {
          const allPool = chronoData?.entries || [];
          const leftEntry = allPool.find((e) => e.id === diffSelectionIds[0]) || allPool[0];
          const rightEntry = allPool.find((e) => e.id === diffSelectionIds[1]) || allPool[1] || allPool[0];
          if (!leftEntry || !rightEntry) return null;
          const fieldRows = [
            { label: 'Log ID', a: leftEntry.id, b: rightEntry.id },
            { label: 'Timestamp', a: leftEntry.timestamp, b: rightEntry.timestamp },
            { label: 'Severity', a: leftEntry.severity, b: rightEntry.severity },
            { label: 'Service Name', a: leftEntry.serviceName, b: rightEntry.serviceName },
            { label: 'Resource Target', a: leftEntry.resourceTarget, b: rightEntry.resourceTarget },
            { label: 'Region / Zone', a: leftEntry.region, b: rightEntry.region },
            { label: 'HTTP Status', a: String(leftEntry.httpStatus), b: String(rightEntry.httpStatus) },
            { label: 'Latency (ms)', a: `${leftEntry.latencyMs}ms`, b: `${rightEntry.latencyMs}ms` },
            { label: 'Principal / Actor', a: leftEntry.actor, b: rightEntry.actor },
            { label: 'Trace ID', a: leftEntry.traceId, b: rightEntry.traceId },
            { label: 'Drain3 Signature', a: leftEntry.signaturePattern, b: rightEntry.signaturePattern },
          ];
          return (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-blue-500/40 space-y-3 font-mono text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px] font-extrabold mr-2">
                    SIDE-BY-SIDE LOG PAYLOAD DIFF
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    Comparing Log A ({leftEntry.serviceName}) vs. Log B ({rightEntry.serviceName})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPayloadDiffModal(false)}
                  className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  Close Diff
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                      <th className="py-1.5 pr-3">Field</th>
                      <th className="py-1.5 px-3">Log A ({leftEntry.id})</th>
                      <th className="py-1.5 pl-3">Log B ({rightEntry.id})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                    {fieldRows.map((row) => {
                      const isDiff = row.a !== row.b;
                      return (
                        <tr
                          key={row.label}
                          className={isDiff ? 'bg-amber-500/10' : ''}
                        >
                          <td className="py-1.5 pr-3 font-bold text-zinc-600 dark:text-zinc-400">
                            {row.label}
                          </td>
                          <td className={`py-1.5 px-3 break-all ${isDiff ? 'text-red-700 dark:text-red-300 font-bold' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {row.a}
                          </td>
                          <td className={`py-1.5 pl-3 break-all ${isDiff ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {row.b}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* TAB 1: FACETED SRE STREAM (VictoriaLogs / OpenObserve Facet Sidebar + Flattened Cards OR High-Density Columnar Table View) */}
        {activeChronoTab === 'SMART_STREAM' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left 4 Columns: VictoriaLogs / OpenObserve Field Facet Explorer & Cardinality Sidebar */}
            {showFacetSidebar && Array.isArray(chronoData?.fieldFacets) && (
              <div className="lg:col-span-4 p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3 max-h-[600px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                  <div>
                    <div className="text-[10px] font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                      VictoriaLogs / OpenObserve Facets
                    </div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Field Cardinality &amp; 1-Click LQL
                    </div>
                  </div>
                  {customLqlInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomLqlInput('');
                        fetchChronoLogs({ lqlFilter: '', notifyUser: true });
                      }}
                      className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer"
                    >
                      Clear LQL
                    </button>
                  )}
                </div>

                {chronoData.fieldFacets.map((facet) => {
                  const isExp = Boolean(expandedFacetKeys[facet.fieldKey]);
                  return (
                    <div
                      key={facet.fieldKey}
                      className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFacetKeys((prev) => ({
                            ...prev,
                            [facet.fieldKey]: !prev[facet.fieldKey],
                          }))
                        }
                        className="w-full px-2.5 py-2 flex items-center justify-between text-left text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer"
                      >
                        <span className="truncate">{facet.label}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-500">
                          {facet.distinctCount} distinct
                        </span>
                      </button>

                      {isExp && (
                        <div className="px-2.5 pb-2.5 pt-1 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800/80">
                          {facet.topValues.map((tv) => (
                            <div key={tv.value} className="space-y-1">
                              <div className="flex items-center justify-between gap-1 text-[10.5px] font-mono">
                                <span
                                  className="truncate text-zinc-800 dark:text-zinc-200 font-semibold max-w-[150px]"
                                  title={tv.value}
                                >
                                  {tv.value}
                                </span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="text-[10px] text-zinc-400">
                                    {tv.count} ({tv.pct}%)
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => applyFacetClauseToLql(tv.includeClause)}
                                    title={`Include in LQL: ${tv.includeClause}`}
                                    className="px-1.5 py-0.2 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[9.5px] font-bold cursor-pointer"
                                  >
                                    + =
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => applyFacetClauseToLql(tv.excludeClause)}
                                    title={`Exclude in LQL: ${tv.excludeClause}`}
                                    className="px-1.5 py-0.2 rounded bg-red-500/15 hover:bg-red-500/30 text-red-700 dark:text-red-300 border border-red-500/30 text-[9.5px] font-bold cursor-pointer"
                                  >
                                    - !=
                                  </button>
                                </div>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <div
                                  style={{ width: `${Math.max(4, tv.pct)}%` }}
                                  className="h-full bg-blue-500 rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Right 8 (or 12) Columns: Either Flattened SRE Cards OR High-Density Columnar Table View */}
            <div className={`${showFacetSidebar ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-2 max-h-[600px] overflow-y-auto pr-1`}>
              {chronoEntries.filter((e) => (!showPinnedOnly ? true : pinnedLogIds.includes(e.id))).length === 0 ? (
                <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] text-center space-y-3 font-mono">
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {activeSelectedBucket ? (
                      <>
                        0 Log Entries in Bar Graph Bucket #{activeSelectedBucket.bucketIndex + 1}/24 (
                        <span className="text-amber-500">
                          {activeSelectedBucket.windowLabel || activeSelectedBucket.label}
                        </span>
                        )
                      </>
                    ) : (
                      <>
                        0 Log Entries Matched Current Query in <span className="text-blue-500">{projectId}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
                    {activeSelectedBucket ? (
                      <>
                        This specific time slice had quiet traffic (`0` events), while the full query returned{' '}
                        <strong className="text-zinc-900 dark:text-zinc-100">
                          {(chronoData?.entries || []).length} log entries
                        </strong>{' '}
                        across active bars. Jump to the nearest active bar or show all 24 buckets:
                      </>
                    ) : (
                      <>
                        Compiled LQL executed on <code className="text-blue-600 dark:text-blue-400">logging.googleapis.com/v2/entries:list</code>:{' '}
                        <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 font-bold">
                          {chronoData?.compiledQuery?.effectiveLql || 'severity>=DEFAULT'}
                        </code>
                      </>
                    )}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {activeSelectedBucket && (
                      <>
                        <button
                          type="button"
                          onClick={() => jumpToAdjacentActiveBucket('NEXT')}
                          className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Jump to Nearest Active Bar ▶
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectHistogramBucket(null)}
                          className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Show All 24 Bars ({(chronoData?.entries || []).length} Logs)
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setNlQueryInput('');
                        setCustomLqlInput('');
                        setSeverityFilter('ALL');
                        setShowPinnedOnly(false);
                        setTimeTravelAnchor(null);
                        setSelectedHistogramBucket(null);
                        setActiveSavedViewId(null);
                        fetchChronoLogs({
                          naturalLanguage: '',
                          lqlFilter: '',
                          aroundTimestamp: '',
                          notifyUser: true,
                        });
                      }}
                      className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold cursor-pointer"
                    >
                      Reset Filter to All Live Project Logs
                    </button>
                    <button
                      type="button"
                      disabled={replayLoading}
                      onClick={() => handleReplayCanaryScenario('CLOUD_RUN_504_POOL_EXHAUSTION')}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {replayLoading
                        ? 'Writing Canary Logs...'
                        : 'Write & Ingest Live Canary Logs (entries:write)'}
                    </button>
                  </div>
                </div>
              ) : streamViewMode === 'COLUMN_TABLE' ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-[11px]">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                        <th className="py-2 px-2.5">Timestamp</th>
                        <th className="py-2 px-2">Sev</th>
                        <th className="py-2 px-2.5">Service (+ = / - !=)</th>
                        <th className="py-2 px-2">HTTP</th>
                        <th className="py-2 px-2">Latency</th>
                        <th className="py-2 px-2.5">Message &amp; Virtual Grok Fields</th>
                        <th className="py-2 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                      {chronoEntries
                        .filter((e) => (!showPinnedOnly ? true : pinnedLogIds.includes(e.id)))
                        .map((entry) => {
                          const isPinned = pinnedLogIds.includes(entry.id);
                          const grokGroups = extractVirtualGrokFields(entry.cleanMessage);
                          return (
                            <tr
                              key={entry.id}
                              className={`hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${
                                isPinned ? 'bg-amber-500/5' : ''
                              }`}
                            >
                              <td className="py-2 px-2.5 whitespace-nowrap text-zinc-500">
                                {formatLogDate(entry.timestamp)}
                              </td>
                              <td className="py-2 px-2 whitespace-nowrap">
                                {getSeverityBadge(entry.severity)}
                              </td>
                              <td className="py-2 px-2.5 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                    {entry.serviceName}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      applyFacetClauseToLql(
                                        String(entry.serviceName || '').endsWith('.googleapis.com')
                                          ? `protoPayload.serviceName="${entry.serviceName}"`
                                          : `resource.labels.service_name="${entry.serviceName}"`
                                      )
                                    }
                                    className="px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold cursor-pointer"
                                    title="Include service in LQL"
                                  >
                                    +=
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      applyFacetClauseToLql(
                                        String(entry.serviceName || '').endsWith('.googleapis.com')
                                          ? `-protoPayload.serviceName="${entry.serviceName}"`
                                          : `-resource.labels.service_name="${entry.serviceName}"`
                                      )
                                    }
                                    className="px-1 py-0.2 rounded bg-red-500/15 text-red-700 dark:text-red-300 text-[9px] font-bold cursor-pointer"
                                    title="Exclude service from LQL"
                                  >
                                    -=
                                  </button>
                                </div>
                              </td>
                              <td className="py-2 px-2 whitespace-nowrap">
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    entry.httpStatus >= 500
                                      ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                                      : entry.httpStatus >= 400
                                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                  }`}
                                >
                                  {entry.httpStatus}
                                </span>
                              </td>
                              <td className="py-2 px-2 whitespace-nowrap font-bold text-zinc-800 dark:text-zinc-200">
                                {entry.latencyMs}ms
                              </td>
                              <td className="py-2 px-2.5 max-w-md">
                                <div className="truncate text-zinc-900 dark:text-zinc-100" title={entry.cleanMessage}>
                                  {renderRegexHighlightedMessage(entry.cleanMessage)}
                                </div>
                                {grokGroups && (
                                  <div className="flex flex-wrap items-center gap-1 mt-1">
                                    {Object.entries(grokGroups).map(([k, v]) => (
                                      <span
                                        key={k}
                                        className="px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[9.5px]"
                                      >
                                        <strong>{k}:</strong> {String(v).slice(0, 36)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2 whitespace-nowrap text-right">
                                <div className="inline-flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => togglePinLog(entry.id)}
                                    className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9.5px] cursor-pointer"
                                  >
                                    {isPinned ? 'Pinned' : 'Pin'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => triggerTimeTravelPeek(entry.timestamp)}
                                    className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[9.5px] font-bold cursor-pointer"
                                  >
                                    ±30s
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                chronoEntries
                  .filter((e) => (!showPinnedOnly ? true : pinnedLogIds.includes(e.id)))
                  .map((entry) => {
                    const isOpen = expandedChronoEntryId === entry.id;
                    const isPinned = pinnedLogIds.includes(entry.id);
                    const isDiffSelected = diffSelectionIds.includes(entry.id);
                    const grokGroups = extractVirtualGrokFields(entry.cleanMessage);
                    const svcField = String(entry.serviceName || '').endsWith('.googleapis.com')
                      ? 'protoPayload.serviceName'
                      : 'resource.labels.service_name';
                    return (
                      <div
                        key={entry.id}
                        className={`rounded-lg border overflow-hidden transition-colors ${
                          isPinned
                            ? 'border-amber-500/50 bg-amber-500/5 dark:bg-[#171612]'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] hover:border-blue-500/40'
                        }`}
                      >
                        <div
                          onClick={() =>
                            setExpandedChronoEntryId(isOpen ? null : entry.id)
                          }
                          className="p-2.5 cursor-pointer flex flex-wrap items-start justify-between gap-2"
                        >
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            {isOpen ? (
                              <ChevronDown className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                            )}
                            <div className="space-y-1 min-w-0 flex-1">
                              {/* Top Hoisted Metadata Row (Zero JSON Digging!) */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                {getSeverityBadge(entry.severity)}
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    entry.httpStatus >= 500
                                      ? 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/30'
                                      : entry.httpStatus >= 400
                                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-500'
                                  }`}
                                >
                                  {entry.httpMethod} {entry.httpStatus} · {entry.latencyMs}ms
                                </span>
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-mono font-bold"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{entry.serviceName}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      applyFacetClauseToLql(`${svcField}="${entry.serviceName}"`)
                                    }
                                    title={`Filter + = ${svcField}="${entry.serviceName}"`}
                                    className="text-emerald-600 dark:text-emerald-400 hover:underline text-[9.5px] font-extrabold cursor-pointer ml-0.5"
                                  >
                                    +=
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      applyFacetClauseToLql(`-${svcField}="${entry.serviceName}"`)
                                    }
                                    title={`Exclude - != ${svcField}="${entry.serviceName}"`}
                                    className="text-red-600 dark:text-red-400 hover:underline text-[9.5px] font-extrabold cursor-pointer"
                                  >
                                    -=
                                  </button>
                                </span>
                                <span className="text-[10.5px] font-mono text-zinc-500 truncate max-w-[200px]">
                                  ({entry.resourceTarget})
                                </span>
                                <span className="text-[10px] font-mono text-zinc-400 inline-flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{formatLogDate(entry.timestamp)}</span>
                                </span>
                                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1 truncate max-w-[180px]">
                                  <UserCheck className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate">{entry.actor}</span>
                                </span>
                                {chronoData?.compiledQuery?.naturalLanguage &&
                                  typeof entry.nlpRelevancePct === 'number' && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
                                      <Cpu className="w-2.5 h-2.5" />
                                      <span>BM25: {entry.nlpRelevancePct}%</span>
                                    </span>
                                  )}
                                {entry.dlpFindings?.length > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono font-extrabold">
                                    <ShieldAlert className="w-3 h-3" />
                                    <span>DLP LEAK: {entry.dlpFindings[0].type}</span>
                                  </span>
                                )}
                              </div>

                              {/* Clean Flattened Message with Live Regex Token Highlighting */}
                              <div className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-words">
                                {renderRegexHighlightedMessage(entry.cleanMessage)}
                              </div>

                              {/* Wave 2: Live Extracted Grok Virtual Fields (if pattern matches) */}
                              {grokGroups && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="text-[9.5px] font-mono font-bold text-blue-600 dark:text-blue-400">
                                    Grok Virtual Fields:
                                  </span>
                                  {Object.entries(grokGroups).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="px-1.5 py-0.2 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono"
                                    >
                                      <strong>{k}=</strong>
                                      {String(v).slice(0, 48)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons: Pin + Diff + ±30s Time-Travel + Trace Waterfall */}
                          <div
                            className="flex items-center gap-1 shrink-0 flex-wrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => togglePinLog(entry.id)}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                                isPinned
                                  ? 'bg-amber-500 text-white border-amber-500'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              {isPinned ? 'Pinned' : 'Pin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toggleDiffSelectLog(entry.id);
                                setShowPayloadDiffModal(true);
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                                isDiffSelected
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              {isDiffSelected ? 'Diff Selected' : 'Diff'}
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerTimeTravelPeek(entry.timestamp)}
                              title="Fetch all project logs ±30 seconds around this event"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold cursor-pointer"
                            >
                              <Clock className="w-3 h-3" />
                              <span>±30s</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTraceId(entry.traceId);
                                setActiveChronoTab('TRACE_WATERFALL');
                              }}
                              className="px-2 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold cursor-pointer"
                            >
                              Trace
                            </button>
                            {entry.severity !== 'INFO' && (
                              <button
                                type="button"
                                onClick={() => setActiveChronoTab('SOURCE_BLAME')}
                                className="px-2 py-1 rounded bg-red-600/15 hover:bg-red-600/25 text-red-700 dark:text-red-300 border border-red-500/30 text-[10px] font-mono font-bold cursor-pointer"
                              >
                                Git Blame &amp; Patch
                              </button>
                            )}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 space-y-2.5 font-mono text-[11px]">
                            {/* Interactive Flattened JSON Key-Value Pills (+ = / - !=) inside expanded card */}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-zinc-400">1-Click LQL Field Filters:</span>
                              {getFlattenedKvPills(entry).map((pill) => (
                                <span
                                  key={pill.key}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono"
                                >
                                  <span className="text-zinc-400">{pill.key}:</span>
                                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">
                                    {pill.value}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => applyFacetClauseToLql(pill.includeClause)}
                                    title={`Filter + = ${pill.includeClause}`}
                                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                                  >
                                    +=
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => applyFacetClauseToLql(pill.excludeClause)}
                                    title={`Exclude - != ${pill.excludeClause}`}
                                    className="text-red-600 dark:text-red-400 hover:underline font-bold cursor-pointer"
                                  >
                                    -=
                                  </button>
                                </span>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-zinc-400">
                                Drain3 Signature:{' '}
                                <code className="text-blue-700 dark:text-blue-300">{entry.signaturePattern}</code>
                              </span>
                              {onAskCopilot && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAskCopilot(
                                      `Diagnose root cause for ${entry.serviceName} (${entry.httpStatus} in ${entry.latencyMs}ms): ${entry.cleanMessage}`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Ask Gemini SRE Copilot</span>
                                </button>
                              )}
                            </div>
                            <pre className="text-[10px] text-zinc-700 dark:text-zinc-300 overflow-x-auto max-h-44 p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                              {JSON.stringify(entry.raw || entry, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}

        {/* TAB 2 (WAVE 2): LOG-TO-METRICS & P99 LATENCY HEATMAP AGGREGATOR (ClickHouse / SigNoz / VictoriaLogs stats by) */}
        {activeChronoTab === 'LOG_TO_METRICS' && (
          <div className="space-y-3.5 font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-extrabold mr-2">
                    CLICKHOUSE / SIGNOZ / VICTORIALOGS STATS AGGREGATOR
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Real-Time Log-to-Metrics (P50 / P90 / P99 Latency, Error Rate % &amp; 5-Bin Latency Distribution Heatmap by Service)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-[11px]">
                      <th className="py-2 pr-3">Service Name</th>
                      <th className="py-2 px-2.5">Requests</th>
                      <th className="py-2 px-2.5">Error Rate</th>
                      <th className="py-2 px-2.5">P50</th>
                      <th className="py-2 px-2.5">P90</th>
                      <th className="py-2 px-2.5">P99</th>
                      <th className="py-2 px-2.5">Volume</th>
                      <th className="py-2 px-3">5-Bin Latency Heatmap (&lt;50ms · 50-250ms · 250ms-1s · 1-2s · &gt;2s)</th>
                      <th className="py-2 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                    {(chronoData?.logToMetricsByService || []).map((svc) => {
                      const bins = svc.heatmapBins || [1, 1, 1, 1, 1];
                      const maxBin = Math.max(1, ...bins);
                      const binLabels = ['<50ms', '50-250ms', '250-1000ms', '1-2s', '>2s'];
                      return (
                        <tr key={svc.serviceName} className="hover:bg-white/60 dark:hover:bg-zinc-900/60">
                          <td className="py-2.5 pr-3 font-bold text-zinc-900 dark:text-zinc-100">
                            {svc.serviceName}
                          </td>
                          <td className="py-2.5 px-2.5 text-zinc-700 dark:text-zinc-300">
                            {svc.totalCount}
                          </td>
                          <td className="py-2.5 px-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                svc.errorRatePct >= 40
                                  ? 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30'
                                  : svc.errorRatePct > 0
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {svc.errorRatePct}% ({svc.errorCount} err)
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-zinc-600 dark:text-zinc-400">
                            {svc.p50Ms}ms
                          </td>
                          <td className="py-2.5 px-2.5 text-amber-700 dark:text-amber-300 font-semibold">
                            {svc.p90Ms}ms
                          </td>
                          <td className="py-2.5 px-2.5 text-red-600 dark:text-red-400 font-extrabold">
                            {svc.p99Ms}ms
                          </td>
                          <td className="py-2.5 px-2.5 text-zinc-500">
                            {svc.totalKb} KB
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="grid grid-cols-5 gap-1 w-48">
                              {bins.map((cnt, idx) => {
                                const intensity = cnt === 0 ? 0.12 : Math.max(0.28, cnt / maxBin);
                                const isSlowBin = idx >= 3;
                                return (
                                  <div
                                    key={binLabels[idx]}
                                    title={`${binLabels[idx]}: ${cnt} requests`}
                                    style={{ opacity: intensity }}
                                    className={`h-5 rounded flex items-center justify-center text-[9.5px] font-bold ${
                                      cnt === 0
                                        ? 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500'
                                        : isSlowBin
                                        ? 'bg-red-600 text-white'
                                        : 'bg-blue-600 text-white'
                                    }`}
                                  >
                                    {cnt}
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                          <td className="py-2.5 pl-2 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                applyFacetClauseToLql(svc.lqlFilter);
                                setActiveChronoTab('SMART_STREAM');
                              }}
                              className="px-2.5 py-1 rounded bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-bold cursor-pointer"
                            >
                              Drilldown LQL
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3 (WAVE 2): LIVE GROK / NAMED-REGEX VIRTUAL FIELD EXTRACTOR (Vector / Logstash / OpenObserve style) */}
        {activeChronoTab === 'GROK_EXTRACTOR' && (
          <div className="space-y-3.5 font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-extrabold mr-2">
                    VECTOR / LOGSTASH / OPENOBSERVE LIVE GROK PARSER
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Named Capture Group (`(?&lt;field&gt;...)`) Virtual Schema-on-Read Extractor
                  </span>
                </div>
              </div>

              {/* Preset Grok / Named-Regex Extractors */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-zinc-500">Load Preset Extractor:</span>
                {(chronoData?.grokVirtualExtractors || []).map((gx) => (
                  <button
                    key={gx.id}
                    type="button"
                    onClick={() => setGrokPatternInput(gx.pattern)}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold border cursor-pointer ${
                      grokPatternInput === gx.pattern
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {gx.name}
                  </button>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-[10.5px] text-zinc-500 font-bold block">
                  Live Named-Regex / Grok Pattern (Automatically extracts virtual columns across Cards &amp; Columnar Table View):
                </label>
                <input
                  type="text"
                  value={grokPatternInput}
                  onChange={(e) => setGrokPatternInput(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 font-bold"
                />
              </div>

              {/* Live Extracted Virtual Field Preview Table */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                  Live Extracted Virtual Records Across Current Stream:
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {chronoEntries.map((entry) => {
                    const groups = extractVirtualGrokFields(entry.cleanMessage);
                    if (!groups) return null;
                    return (
                      <div
                        key={entry.id}
                        className="p-2.5 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {entry.serviceName} ({entry.httpStatus} · {entry.latencyMs}ms)
                          </span>
                          <span className="text-zinc-400">{formatLogDate(entry.timestamp)}</span>
                        </div>
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                          {entry.cleanMessage}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {Object.entries(groups).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-bold"
                            >
                              {k} = &quot;{String(v)}&quot;
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SEMANTIC DRAIN3 LOG PATTERN CLUSTERING */}
        {activeChronoTab === 'DRAIN3_CLUSTERS' && (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {(chronoData?.drainClusters || []).map((cluster) => (
              <div
                key={cluster.id}
                className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(cluster.severity)}
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-mono font-extrabold">
                      {cluster.count}× occurrences ({cluster.sharePct}% of stream)
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      Avg Latency: <strong>{cluster.avgLatencyMs}ms</strong>
                    </span>
                    <span className="text-xs font-mono text-zinc-500">
                      Services: <strong>{cluster.services.join(', ')}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTraceId(cluster.sampleTraceId);
                        setActiveChronoTab('TRACE_WATERFALL');
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                    >
                      Inspect Trace
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(cluster.suggestedExclusionFilter, `ex-${cluster.id}`)
                      }
                      className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10.5px] font-mono cursor-pointer inline-flex items-center gap-1"
                    >
                      {copiedId === `ex-${cluster.id}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied LQL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Exclusion LQL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 font-mono text-xs break-words border border-zinc-200 dark:border-zinc-800">
                  {cluster.signaturePattern}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10.5px] font-mono text-zinc-500">
                  <span>
                    Blast Radius Targets: {cluster.resources.join(' · ')}
                  </span>
                  <span>
                    First Seen: {formatLogDate(cluster.firstSeen)} · Last Seen:{' '}
                    {formatLogDate(cluster.lastSeen)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: OPEN-SOURCE 2026 FEATURE #3 — ANOMALY BASELINE DIFF & "WHY DID 5XX SPIKE?" ENGINE */}
        {activeChronoTab === 'ANOMALY_DIFF' && chronoData?.anomalyBaselineDiff && (
          <div className="space-y-3.5">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2 font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-extrabold">
                    SIGNOZ / DRAIN3 ANOMALY BASELINE DIFF
                  </span>
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    {chronoData.anomalyBaselineDiff.incidentWindowLabel} vs.{' '}
                    {chronoData.anomalyBaselineDiff.baselineWindowLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-extrabold">
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30">
                    Error Rate: +{chronoData.anomalyBaselineDiff.overallErrorDeltaPct}%
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    P95 Delta: +{chronoData.anomalyBaselineDiff.overallP95DeltaMs}ms
                  </span>
                </div>
              </div>
              <div className="text-xs text-zinc-800 dark:text-zinc-200">
                <strong>Automated Root-Cause Correlation:</strong>{' '}
                {chronoData.anomalyBaselineDiff.rootCauseHypothesis}
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Top Correlated Dimension:{' '}
                <code className="px-1.5 py-0.5 rounded bg-white dark:bg-zinc-900 text-blue-700 dark:text-blue-300 font-bold">
                  {chronoData.anomalyBaselineDiff.topCorrelatedDimension}
                </code>
              </div>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {(chronoData.anomalyBaselineDiff.signatureDeltas || []).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-[#131314] space-y-2 font-mono"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(item.severity)}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          item.classification === 'NEW_INCIDENT_SPIKE'
                            ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40'
                            : item.classification === 'ELEVATED_REGRESSION'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                        }`}
                      >
                        {item.classification} ({item.deltaPct >= 0 ? `+${item.deltaPct}%` : `${item.deltaPct}%`})
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Baseline: <strong>{item.baselineRatePerMin}/min</strong> -&gt; Now:{' '}
                        <strong className="text-zinc-900 dark:text-zinc-100">{item.currentRatePerMin}/min</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => applyFacetClauseToLql(item.lqlDrilldown)}
                        className="px-2.5 py-1 rounded bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-bold cursor-pointer"
                      >
                        Filter in LQL
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTraceId(item.sampleTraceId);
                          setActiveChronoTab('TRACE_WATERFALL');
                        }}
                        className="px-2.5 py-1 rounded bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-bold cursor-pointer"
                      >
                        Trace Waterfall
                      </button>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-emerald-700 dark:text-emerald-300 break-words">
                    {item.signaturePattern}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CROSS-SERVICE DISTRIBUTED TRACE WATERFALL (`traceId` STITCHING) */}
        {activeChronoTab === 'TRACE_WATERFALL' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-mono text-zinc-500">Select Stitched Trace:</span>
                {(chronoData?.traceWaterfalls || []).slice(0, 6).map((tw) => (
                  <button
                    key={tw.traceId}
                    type="button"
                    onClick={() => setSelectedTraceId(tw.traceId)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border cursor-pointer ${
                      activeWaterfall?.traceId === tw.traceId
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-zinc-100 dark:bg-[#131314] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tw.hasError ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span>
                      {tw.traceId.slice(0, 10)}… ({tw.spanCount} spans ·{' '}
                      {tw.totalDurationMs}ms)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {activeWaterfall && (
              <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 text-zinc-900 dark:text-zinc-100 font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                  <div>
                    <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                      End-to-End Trace ID: {activeWaterfall.traceId}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Services Traversed: {activeWaterfall.servicesInvolved.join(' -> ')} · Total Request Duration:{' '}
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {activeWaterfall.totalDurationMs}ms
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Root Timestamp: {formatLogDate(activeWaterfall.rootTimestamp)}
                  </span>
                </div>

                {/* Waterfall Span Rows */}
                <div className="space-y-2.5">
                  {activeWaterfall.spans.map((span) => (
                    <div
                      key={span.spanId}
                      className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              span.httpStatus >= 500
                                ? 'bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40'
                                : span.httpStatus >= 400
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {span.httpMethod} {span.httpStatus}
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">{span.serviceName}</span>
                          <span className="text-zinc-400 text-[11px]">
                            ({span.resourceTarget})
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          {span.latencyMs}ms
                        </span>
                      </div>

                      {/* Proportional Gantt Span Bar */}
                      <div className="w-full h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                        <div
                          style={{
                            marginLeft: `${span.offsetPct}%`,
                            width: `${Math.min(100 - span.offsetPct, span.widthPct)}%`,
                          }}
                          className={`h-full rounded-full ${
                            span.httpStatus >= 500
                              ? 'bg-red-500'
                              : span.httpStatus >= 400
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                      </div>

                      <div className="text-[11px] text-zinc-700 dark:text-zinc-300 break-words">
                        {span.cleanMessage}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: OPEN-SOURCE 2026 FEATURE #5 — MULTI-FORMAT QUERY TRANSPILER & ALERT EXPORTER */}
        {activeChronoTab === 'QUERY_TRANSPILER' && chronoData?.queryTranspilations && (
          <div className="space-y-3.5 font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-extrabold mr-2">
                    POLYGLOT OPEN-SOURCE LOG QUERY TRANSPILER
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Translate Active LQL Into VictoriaLogs PipesQL, Grafana Loki LogQL, ClickHouse SQL &amp; Prometheus Alerts
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { id: 'VictoriaLogsPipesQl', label: 'VictoriaLogs PipesQL' },
                  { id: 'grafanaLokiLogQl', label: 'Grafana Loki LogQL' },
                  { id: 'clickhouseSql', label: 'ClickHouse OTel SQL' },
                  { id: 'bigQueryLogAnalyticsSql', label: 'BigQuery _AllLogs SQL' },
                  { id: 'prometheusAlertRuleYaml', label: 'Prometheus Alert YAML' },
                  { id: 'gcloudLogMetricCli', label: 'gcloud Log Metric CLI' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setActiveTranspilerLang(fmt.id)}
                    className={`w-full h-9 px-2.5 rounded-md text-[11px] font-bold border cursor-pointer transition-colors ${
                      activeTranspilerLang === fmt.id
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white dark:bg-[#202124] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">
                    Compiled Output ({activeTranspilerLang})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        chronoData.queryTranspilations[activeTranspilerLang] || '',
                        `transpile-${activeTranspilerLang}`
                      )
                    }
                    className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === `transpile-${activeTranspilerLang}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Copied Code</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Query / Rule</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {chronoData.queryTranspilations[activeTranspilerLang]}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: LOG FINOPS NOISE-CUTTER ($0.50/GiB) & LIVE DLP SECRET LEAK SHIELD */}
        {activeChronoTab === 'FINOPS_DLP' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Left: Log FinOps Byte-Burn & 1-Click _Default Sink Exclusions */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <span>Log FinOps Noise-Cutter (`_Default` Sink Exclusions)</span>
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Cloud Logging bills <strong>$0.50/GiB</strong> after 50 GiB/mo. Drop noisy healthchecks &amp; high-volume 200 OK chatter at the sink before ingestion.
                  </p>
                </div>
              </div>

              {exclusionBanner && (
                <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-xs font-mono text-emerald-700 dark:text-emerald-300 space-y-1">
                  <div className="font-bold">
                    Exclusion Rule &ldquo;{exclusionBanner.name}&rdquo; Active (Saves $
                    {exclusionBanner.savingsUsd.toFixed(2)}/mo)
                  </div>
                  <div className="text-[10px] break-all">{exclusionBanner.gcloudCli}</div>
                </div>
              )}

              <div className="space-y-2.5">
                {(chronoData?.logFinOps?.recommendations || []).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {rec.sourceName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-extrabold">
                        Save ${rec.monthlyCostUsd.toFixed(2)}/mo ({rec.estimatedGibPerMonth} GiB)
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {rec.recommendation}
                    </div>
                    <pre className="p-2 rounded bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono overflow-x-auto">
                      {rec.exclusionFilter}
                    </pre>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={rec.isExcluded || applyingExclusionId === rec.id}
                        onClick={() => handleApplyExclusionRule(rec)}
                        className={`px-3 py-1 rounded text-xs font-mono font-bold cursor-pointer ${
                          rec.isExcluded
                            ? 'bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        {rec.isExcluded
                          ? 'Excluded in _Default Sink'
                          : applyingExclusionId === rec.id
                          ? 'Applying Exclusion...'
                          : '1-Click Exclude in _Default Sink'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Live DLP Secret & PII Leak Redaction Radar */}
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] space-y-3">
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4 text-red-500" />
                  <span>Live DLP Secret &amp; PII Leak Redaction Radar</span>
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Continuously scans log payloads for accidentally printed Bearer JWTs, <code className="font-mono">AIza...</code> GCP API keys, Service Account keys, and customer emails.
                </p>
              </div>

              <div className="space-y-2.5">
                {(chronoData?.dlpAlerts || []).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg bg-white dark:bg-[#202124] border border-red-500/30 space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-[10.5px] font-mono font-extrabold">
                        <ShieldAlert className="w-3 h-3" />
                        <span>{alert.type}: {alert.label}</span>
                      </span>
                      <span className="text-[10.5px] font-mono text-zinc-500">
                        {alert.serviceName} · {formatLogDate(alert.timestamp)}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-zinc-950 text-amber-800 dark:text-amber-200 text-[10.5px] font-mono break-all">
                      Redacted Safe Preview: {alert.redactedPreview}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                      <span>Remediation: {alert.remediation}</span>
                      <button
                        type="button"
                        onClick={() =>
                          executeShellCommand(
                            `gcloud logging read 'resource.labels.service_name="${alert.serviceName}"' --project=${projectId} --limit=5`
                          )
                        }
                        className="px-2.5 py-1 rounded bg-red-600/15 text-red-600 dark:text-red-300 border border-red-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                      >
                        $ Audit in Shell
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 09 (WAVE 3): LIVE GIT BLAME, REPOSITORY COMMIT CORRELATOR & UNIFIED DIFF INSPECTOR (`execFile('git')`) */}
        {activeChronoTab === 'SOURCE_BLAME' && (
          <div className="space-y-3.5 font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30 text-[10px] font-extrabold mr-2">
                    LIVE GIT CLI (`git log`, `git show`, `git blame -L`)
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Real Repository Commits, File:Line Blame Inspector &amp; Unified Diffs
                  </span>
                </div>
              </div>

              {/* Interactive Live `git blame -L` & `git log -p -L` Runner */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
                <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                  Run Live <code className="text-blue-600 dark:text-blue-300">git blame -L</code> &amp;{' '}
                  <code className="text-blue-600 dark:text-blue-300">git log -n 1 -p -L</code> on Any Repository File:
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={gitBlameFileInput}
                    onChange={(e) => setGitBlameFileInput(e.target.value)}
                    placeholder="File path (e.g. server/index.js or src/App.jsx)"
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="number"
                    min={1}
                    value={gitBlameLineInput}
                    onChange={(e) => setGitBlameLineInput(Number(e.target.value) || 1)}
                    placeholder="Line #"
                    className="w-28 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    disabled={gitBlameLoading}
                    onClick={() => handleRunLiveGitBlame()}
                    className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {gitBlameLoading ? 'Running git blame...' : 'Run Live git blame'}
                  </button>
                </div>

                {gitBlameResult && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 pt-1">
                    {gitBlameResult.error ? (
                      <div className="col-span-2 p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs">
                        {gitBlameResult.error}
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase">
                            Live `git blame -L` Output ({gitBlameResult.filePath}:{gitBlameResult.lineNumber})
                          </div>
                          <pre className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10.5px] text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre max-h-48">
                            {gitBlameResult.blameOutput}
                          </pre>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                            Live `git log -n 1 -p -L` Line Evolution Patch
                          </div>
                          <pre className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10.5px] text-emerald-800 dark:text-emerald-300 overflow-x-auto whitespace-pre max-h-48">
                            {gitBlameResult.patchOutput}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Recent Real Git Commits from Repository */}
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {(chronoData?.sourceBlameAndHotfixes || []).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(item.severity)}
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-extrabold">
                          {item.filePath}:{item.lineNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 text-[10.5px] font-bold">
                          Commit {item.gitCommitSha} ({item.committedAgo} by {item.gitAuthor})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleRunLiveGitBlame(item.filePath, item.lineNumber)}
                          className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold cursor-pointer"
                        >
                          Blame Line {item.lineNumber}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(item.unifiedDiffPatch, `patch-${item.id}`)
                          }
                          className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `patch-${item.id}` ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied Commit Diff</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Commit Diff (.patch)</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.ghPrCli, `gh-cli-${item.id}`)}
                          className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedId === `gh-cli-${item.id}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Copied Git CLI</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy `git show / revert` CLI</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-700 dark:text-zinc-300">
                      <strong>{item.prTitle}:</strong> {item.blameVerdict}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                          Live Disk Source Lines ({item.filePath}:{item.lineNumber})
                        </div>
                        <pre className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-red-500/30 text-[10.5px] text-zinc-800 dark:text-zinc-200 overflow-x-auto whitespace-pre">
                          {item.offendingCodeSnippet}
                        </pre>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                          Live `git show {item.gitCommitSha}` Unified Diff
                        </div>
                        <pre className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-emerald-500/30 text-[10.5px] text-emerald-800 dark:text-emerald-300 overflow-x-auto whitespace-pre">
                          {item.unifiedDiffPatch}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 10 (WAVE 3): LIVE SLO ERROR-BUDGET BURN-RATE MATRIX & LIVE GCP LOG-BASED METRIC CREATOR */}
        {activeChronoTab === 'SLO_BURN_MATRIX' && (
          <div className="space-y-3.5 font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-extrabold mr-2">
                    LIVE CLOUD LOGGING &amp; MONITORING SLO ENGINE
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Computed from Live Project Log Stream + 1-Click `logging.googleapis.com/v2/projects/{projectId}/metrics` Provisioner
                  </span>
                </div>
              </div>

              {createdMetricBanner && (
                <div
                  className={`p-2.5 rounded-lg text-xs border ${
                    createdMetricBanner.error
                      ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {createdMetricBanner.error ? (
                    <span>
                      <strong>Cloud Logging Metric API Error:</strong> {createdMetricBanner.error}
                    </span>
                  ) : (
                    <span>
                      <strong>Live Cloud Logging Metric {createdMetricBanner.status}:</strong>{' '}
                      <code>{createdMetricBanner.metricName}</code> with filter{' '}
                      <code>{createdMetricBanner.filter}</code>
                    </span>
                  )}
                </div>
              )}

              {(chronoData?.sloBurnRateMatrix || []).length === 0 ? (
                <div className="p-4 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                  No log entries or Cloud Monitoring services found in the active filter window. Run a broader query or write a canary log in Tab 12 to compute live service SLO burn rates.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {(chronoData?.sloBurnRateMatrix || []).map((slo) => {
                    const isCrit = slo.status === 'CRITICAL_FAST_BURN_PAGE';
                    const isWarn = slo.status === 'ELEVATED_6H_BURN_WARN';
                    return (
                      <div
                        key={slo.serviceName}
                        onClick={() => setSelectedSloService(slo.serviceName)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all space-y-2.5 ${
                          selectedSloService === slo.serviceName
                            ? 'ring-2 ring-blue-500 bg-white dark:bg-[#202124] border-blue-500'
                            : 'bg-white dark:bg-[#202124] border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                            {slo.serviceName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold border shrink-0 ${
                              isCrit
                                ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40'
                                : isWarn
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {slo.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-[10.5px]">
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <div className="text-zinc-400 text-[9.5px]">Target / Live</div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              {slo.sloTargetPct}% / {slo.currentSuccessPct}%
                            </div>
                          </div>
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <div className="text-zinc-400 text-[9.5px]">Budget Left</div>
                            <div className="font-bold text-amber-600 dark:text-amber-400">
                              {slo.budgetRemainingPct}% ({slo.budgetRemainingMinutes}m)
                            </div>
                          </div>
                          <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                            <div className="text-zinc-400 text-[9.5px]">Observed</div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              {slo.errorRequestsObserved || 0}/{slo.totalRequestsObserved || 0} err
                            </div>
                          </div>
                        </div>

                        {/* Multi-Window Burn Rates */}
                        <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-zinc-200 dark:border-zinc-800">
                          <span>
                            1h Burn:{' '}
                            <strong className={slo.burnRate1h >= 14.4 ? 'text-red-600 dark:text-red-400' : ''}>
                              {slo.burnRate1h}x
                            </strong>
                          </span>
                          <span>
                            6h Burn:{' '}
                            <strong className={slo.burnRate6h >= 6.0 ? 'text-amber-600 dark:text-amber-400' : ''}>
                              {slo.burnRate6h}x
                            </strong>
                          </span>
                          <span>
                            24h Burn: <strong>{slo.burnRate24h}x</strong>
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={creatingMetricId === slo.metricName}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateLiveLogMetric(slo);
                          }}
                          className="w-full py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold cursor-pointer disabled:opacity-50"
                        >
                          {creatingMetricId === slo.metricName
                            ? 'Creating Metric in GCP...'
                            : `1-Click Create GCP Log Metric (${slo.metricName})`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Live Existing Cloud Logging Metrics in GCP Project */}
              {(chronoData?.liveLogMetrics || []).length > 0 && (
                <div className="p-3 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    Live Google Cloud Log-Based Metrics in Project `{projectId}` (`GET /v2/projects/{projectId}/metrics`):
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {chronoData.liveLogMetrics.slice(0, 6).map((m) => (
                      <div
                        key={m.name}
                        className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1"
                      >
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-blue-700 dark:text-blue-300 break-all">
                          {m.filter}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 11 (WAVE 3): LIVE LINUX KERNEL `/proc/net/snmp` SOCKET TELEMETRY & LIVE DNS / TCP / TLS 1.3 HANDSHAKE PROBE */}
        {activeChronoTab === 'EBPF_KERNEL_XRAY' && (
          <div className="space-y-3.5 font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold mr-2">
                    LIVE LINUX `/proc/net/snmp` + LIVE `tls.connect` PROBE
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Real Host Kernel TCP Retransmits, Active Sockets, DNS Resolution Latency &amp; TLS 1.3 Handshake Timing
                  </span>
                </div>
              </div>

              {/* Live Host Kernel Summary Bar from /proc/net/snmp & /proc/net/sockstat */}
              {chronoData?.kernelHostSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[10.5px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-400">TCPCurrEstab</div>
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                      {chronoData.kernelHostSummary.tcpCurrEstab} sockets
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-400">TCP OutSegs</div>
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                      {chronoData.kernelHostSummary.tcpOutSegs.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-400">RetransSegs</div>
                    <div className="font-extrabold text-amber-600 dark:text-amber-400">
                      {chronoData.kernelHostSummary.tcpRetransSegs.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-400">Retrans Ratio</div>
                    <div className="font-extrabold text-red-600 dark:text-red-400">
                      {chronoData.kernelHostSummary.tcpRetransmitRatioPct}%
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-400">TCP TimeWait</div>
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                      {chronoData.kernelHostSummary.tcpTimeWait}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-400">UDP Datagrams</div>
                    <div className="font-extrabold text-blue-600 dark:text-blue-400">
                      {chronoData.kernelHostSummary.udpInDatagrams.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-400">CPU Load (1m)</div>
                    <div className="font-extrabold text-blue-600 dark:text-blue-300">
                      {chronoData.kernelHostSummary.cpuLoadAvg1m} ({chronoData.kernelHostSummary.cpuCount} cores)
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                    <div className="text-zinc-400">Host RAM Used</div>
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                      {chronoData.kernelHostSummary.memUsedPct}%
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive On-Demand Endpoint Network & TLS Probe */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                    Run On-Demand Live DNS + TCP 3-Way Handshake + TLS 1.3 Probe Against Any Endpoint:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold">
                    ⚡ Direct Node.js DNS/TCP/TLS Socket · No gcloud Required
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={probeHostInput}
                    onChange={(e) => setProbeHostInput(e.target.value)}
                    placeholder="Hostname or URL (e.g. logging.googleapis.com, bigquery.googleapis.com)"
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="number"
                    value={probePortInput}
                    onChange={(e) => setProbePortInput(Number(e.target.value) || 443)}
                    className="w-24 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    disabled={probeLoading}
                    onClick={() => handleRunLiveNetworkProbe()}
                    className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {probeLoading ? 'Probing Endpoint...' : 'Run Live DNS / TCP / TLS Probe'}
                  </button>
                </div>

                {customProbeResult?.probe && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-zinc-800 dark:text-zinc-200">
                    <strong>Live Probe Result ({customProbeResult.probe.host}):</strong> Resolved IP{' '}
                    <code>{customProbeResult.probe.resolvedIp}</code> in{' '}
                    <strong>{customProbeResult.probe.dnsLookupMs}ms</strong> · TCP SYN-ACK RTT:{' '}
                    <strong>{customProbeResult.probe.tcpSynRttMs}ms</strong> · TLS Handshake:{' '}
                    <strong>{customProbeResult.probe.tlsHandshakeMs}ms</strong> (
                    <code>{customProbeResult.probe.tlsProtocol}</code> /{' '}
                    <code>{customProbeResult.probe.tlsCipher}</code>)
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {(chronoData?.ebpfKernelTelemetry || []).map((row) => (
                  <div
                    key={row.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                          {row.serviceName}
                        </span>
                        <span className="text-[10.5px] text-zinc-500">
                          ({row.podOrRevision})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                          {row.kernelProbe}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(row.bpftraceScript, `bpf-${row.id}`)}
                        className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `bpf-${row.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Copied Kernel CLI</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy `ss -ti` / `/proc/net/snmp` CLI</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10.5px]">
                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">Live DNS Lookup</div>
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          {row.dnsLookupMs}ms
                        </div>
                      </div>
                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">Live TCP SYN RTT</div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {row.tcpSynRttMs}ms
                        </div>
                      </div>
                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">Host RetransSegs</div>
                        <div className="font-bold text-red-600 dark:text-red-400">
                          {row.tcpRetransmitsPerMin} ({row.tcpRetransmitRatioPct || 0}%)
                        </div>
                      </div>
                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">Live TLS Handshake</div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {row.tlsHandshakeMs}ms
                        </div>
                      </div>
                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">TCP TimeWait</div>
                        <div className="font-bold text-blue-600 dark:text-blue-300">
                          {row.socketQueueWaitMs} sockets
                        </div>
                      </div>
                      <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-zinc-400">Cgroup Throttled</div>
                        <div className="font-bold text-red-600 dark:text-red-400">
                          {row.cgroupCpuThrottledPct}%
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-zinc-700 dark:text-zinc-300">
                      <strong>Live Kernel &amp; Socket Verdict:</strong> {row.kernelVerdict}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 12 (WAVE 3): REAL GOOGLE CLOUD LOGGING `entries:write` CANARY LOG INJECTOR & PIPELINE VERIFIER */}
        {activeChronoTab === 'CANARY_REPLAY' && (
          <div className="space-y-3.5 font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-[10px] font-extrabold mr-2">
                    LIVE `POST https://logging.googleapis.com/v2/entries:write`
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Writes Real LogEntry Payloads Into `projects/{projectId}/logs/cloudpulse-sre-canary` &amp; Reads Them Back Live
                  </span>
                </div>
              </div>

              {/* Optional Custom Message Input for Live `entries:write` */}
              <div className="p-3 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                  Optional Custom Log Payload to Write to Google Cloud Logging (`entries:write`):
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <select
                    value={customCanarySeverity}
                    onChange={(e) => setCustomCanarySeverity(e.target.value)}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="ERROR">ERROR</option>
                    <option value="WARNING">WARNING</option>
                    <option value="INFO">INFO</option>
                  </select>
                  <input
                    type="text"
                    value={customCanaryMessage}
                    onChange={(e) => setCustomCanaryMessage(e.target.value)}
                    placeholder="Optional custom log message (leave blank to use preset scenario payload)"
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {(chronoData?.replayScenarios || []).map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-2.5 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                        {sc.name}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        {sc.description}
                      </p>
                      <code className="block text-[10px] p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 text-blue-700 dark:text-blue-300 border border-zinc-200 dark:border-zinc-800">
                        {sc.expectedLqlMatch}
                      </code>
                    </div>
                    <button
                      type="button"
                      disabled={replayLoading}
                      onClick={() => handleReplayCanaryScenario(sc.id)}
                      className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {replayLoading
                        ? 'Writing to Cloud Logging API...'
                        : `Write ${sc.syntheticEventsCount} Real Entry/Entries to GCP`}
                    </button>
                  </div>
                ))}
              </div>

              {replayResult && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-emerald-500/40 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold mr-2 ${
                          replayResult.gcpWriteSucceeded
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-500/20 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {replayResult.gcpWriteSucceeded
                          ? 'LIVE CLOUD LOGGING WRITE: HTTP 200 OK'
                          : 'CLOUD LOGGING WRITE ERROR'}
                      </span>
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {replayResult.title} ({replayResult.detectionLatencyMs}ms API Write Latency)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomLqlInput(`logName="${replayResult.logName}"`);
                        setActiveChronoTab('SMART_STREAM');
                        fetchChronoLogs({ lqlFilter: `logName="${replayResult.logName}"` });
                      }}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold cursor-pointer"
                    >
                      View Written Logs in Tab 01
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(replayResult.checks || []).map((chk) => (
                      <div
                        key={chk.stage}
                        className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                            {chk.stage}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold ${
                              chk.status === 'PASS'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-red-500/20 text-red-700 dark:text-red-300'
                            }`}
                          >
                            {chk.status}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-zinc-600 dark:text-zinc-400 break-all">
                          {chk.detail}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================
          INNOVATION #3: LIVE CLOUD AUDIT "WHO-CHANGED-WHAT" ACTIVITY TIMELINE
          & 1-CLICK CHANGE INSPECTOR (cloudaudit.googleapis.com/activity)
         =================================================================== */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] font-mono font-extrabold">
                <History className="w-3.5 h-3.5" />
                <span>LIVE CLOUD AUDIT "WHO-CHANGED-WHAT" TIMELINE</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                400-Day Admin Activity Retention · $0.00/mo Always Free
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono font-bold">
                <Clock className="w-3 h-3" />
                <span>TZ: {activeTimeZone} ({utcOffsetLabel})</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 mt-1">
              Project Mutation Forensics, Actor Attribution (`principalEmail`) & 1-Click Change Inspector
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Streams live <code className="font-mono">cloudaudit.googleapis.com/activity</code> events + in-session Flight Recorder mutations for <span className="font-mono font-semibold">{projectId}</span> so you can see who created, updated, or deleted any resource, their caller IP, IAM policy binding deltas, and copy the exact inspection/reverse CLI.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={auditServiceFilter}
              onChange={(e) => setAuditServiceFilter(e.target.value)}
              className="bg-zinc-100 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-800 dark:text-zinc-200"
            >
              {AUDIT_SERVICE_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={loadingAudit}
              onClick={fetchAuditTimeline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`}
              />
              <span>
                {loadingAudit
                  ? 'Querying Audit Logs...'
                  : `Refresh Timeline (${filteredAuditEvents.length})`}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowAuditTimelineSection((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold cursor-pointer"
            >
              {showAuditTimelineSection ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>Expand ({filteredAuditEvents.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showAuditTimelineSection && (
          <>
            {/* Category & Actor Quick Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-400 inline-flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Action Type:</span>
            </span>
            {[
              { id: 'ALL', label: `All (${auditData?.totalEvents || 0})` },
              {
                id: 'CREATE',
                label: `Create/Deploy (${auditData?.categoryCounts?.CREATE || 0})`,
              },
              {
                id: 'UPDATE',
                label: `Update/Patch (${auditData?.categoryCounts?.UPDATE || 0})`,
              },
              {
                id: 'IAM_SECURITY',
                label: `IAM/Secret (${auditData?.categoryCounts?.IAM_SECURITY || 0})`,
              },
              {
                id: 'DELETE',
                label: `Delete/Destroy (${auditData?.categoryCounts?.DELETE || 0})`,
              },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setAuditCategoryFilter(c.id)}
                className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold border transition-colors cursor-pointer ${
                  auditCategoryFilter === c.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {auditData?.topActors?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 inline-flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                <span>Actor:</span>
              </span>
              <button
                type="button"
                onClick={() => setAuditActorFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                  auditActorFilter === 'ALL'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                }`}
              >
                All Principals
              </button>
              {auditData.topActors.map((act) => (
                <button
                  key={act.email}
                  type="button"
                  onClick={() =>
                    setAuditActorFilter(
                      auditActorFilter === act.email ? 'ALL' : act.email
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer truncate max-w-[220px] ${
                    auditActorFilter === act.email
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                  }`}
                  title={act.email}
                >
                  {act.email.split('@')[0]} ({act.count})
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audit Events Feed */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredAuditEvents.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center text-xs font-mono text-zinc-500">
              {loadingAudit
                ? 'Scanning cloudaudit.googleapis.com/activity logs...'
                : 'No matching Cloud Audit Admin Activity events found for the current filter.'}
            </div>
          ) : (
            filteredAuditEvents.map((ev) => {
              const isOpen = expandedAuditId === ev.id;
              return (
                <div
                  key={ev.id}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-[#131314] overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedAuditId(isOpen ? null : ev.id)}
                    className="p-3 cursor-pointer flex flex-wrap items-center justify-between gap-2 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      )}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${getCategoryBadge(
                              ev.actionCategory
                            )}`}
                          >
                            {ev.actionCategory}
                          </span>
                          <span className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                            {ev.humanSummary}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono">
                            {ev.serviceName}
                          </span>
                          {ev.region && ev.region !== 'global' && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-mono">
                              {ev.region}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatLogDate(ev.timestamp)}</span>
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <UserCheck className="w-3 h-3" />
                            <span>{ev.principalEmail}</span>
                          </span>
                          <span>·</span>
                          <span>IP: {ev.callerIp}</span>
                          <span>·</span>
                          <span className="text-zinc-400">
                            Method: {ev.methodName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => triggerTimeTravelPeek(ev.timestamp)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        <Clock className="w-3 h-3" />
                        <span>±30s Logs</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => executeShellCommand(ev.reverseCli)}
                        title="Run inspection command in Mobile Cloud Shell"
                        className="px-2.5 py-1 rounded bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                      >
                        $ Inspect in Shell
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(ev.reverseCli, `cli-${ev.id}`)}
                        className="px-2 py-1 rounded bg-zinc-200/70 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-mono inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === `cli-${ev.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy CLI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded ProtoPayload Request / Policy Delta Inspector */}
                  {isOpen && (
                    <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 space-y-2.5 font-mono text-[11px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-zinc-400">
                          Target Resource URI:{' '}
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                            {ev.resourceName}
                          </span>{' '}
                          · Status: {ev.statusMessage}
                        </div>
                        {onAskCopilot && (
                          <button
                            type="button"
                            onClick={() =>
                              onAskCopilot(
                                `Analyze Cloud Audit Activity event: ${ev.principalEmail} executed ${ev.methodName} on ${ev.resourceName} from IP ${ev.callerIp}.`
                              )
                            }
                            className="inline-flex items-center gap-1 text-blue-400 hover:underline text-[11px] cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Ask Gemini SRE Forensics</span>
                          </button>
                        )}
                      </div>

                      {ev.policyDelta?.length > 0 && (
                        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 space-y-1">
                          <div className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                            IAM Policy Binding Deltas (`serviceData.policyDelta`):
                          </div>
                          {ev.policyDelta.map((d, idx) => (
                            <div
                              key={idx}
                              className="text-[10.5px] flex items-center gap-2"
                            >
                              <span
                                className={`px-1.5 py-0.5 rounded-full font-bold ${
                                  d.action === 'ADD'
                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-red-500/20 text-red-700 dark:text-red-300'
                                }`}
                              >
                                {d.action}
                              </span>
                              <span className="text-zinc-900 dark:text-white">{d.role}</span>
                              <span className="text-zinc-400">➔</span>
                              <span className="text-blue-700 dark:text-blue-300">{d.member}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                        <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-h-48">
                          <div className="text-[10px] text-zinc-400 mb-1 flex items-center gap-1">
                            <FileCode2 className="w-3 h-3" />
                            <span>protoPayload.request (Mutation Spec)</span>
                          </div>
                          <pre className="text-[10px] text-emerald-700 dark:text-emerald-300">
                            {ev.requestPayload
                              ? JSON.stringify(ev.requestPayload, null, 2)
                              : '// No request body recorded in Admin Activity entry'}
                          </pre>
                        </div>

                        <div className="p-2.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto max-h-48">
                          <div className="text-[10px] text-zinc-400 mb-1">
                            Inspection / Rollback CLI Command
                          </div>
                          <pre className="text-[10px] text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                            {ev.reverseCli}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
          </>
        )}
      </div>

      {/* Bottom 2-Column Grid: Raw Cloud Logging Tail + Touch-Optimized Mobile Cloud Shell */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column: Live Cloud Logging Streamer */}
        <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Cloud Logging & Audit Tail</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Direct stream from <code className="font-mono">logging.googleapis.com</code> for{' '}
                <span className="font-mono font-semibold">{projectId}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-zinc-100 dark:bg-[#131314] p-1 rounded-[8px] border border-zinc-200 dark:border-zinc-800 flex items-center text-xs font-medium">
                {['ALL', 'ERROR', 'WARNING', 'INFO'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                      severityFilter === sev
                        ? 'bg-white dark:bg-zinc-800 text-[#2563eb] dark:text-[#60a5fa] shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onRefreshLogs}
                title="Refresh live logs"
                className="p-2 rounded-[8px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#202124] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/60 dark:bg-[#131314] overflow-hidden transition-colors hover:border-blue-500/40"
                >
                  <div
                    onClick={() =>
                      setExpandedLogId(isExpanded ? null : log.id)
                    }
                    className="p-3 cursor-pointer flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {getSeverityBadge(log.severity)}
                          <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                            {formatLogDate(log.timestamp)}
                          </span>
                          <span className="font-mono text-[10px] bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded-full">
                            {log.service}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                              log.source === 'LIVE_GCP'
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                                : 'text-blue-600 dark:text-blue-400 bg-blue-500/10'
                            }`}
                          >
                            {log.source === 'LIVE_GCP' ? 'LIVE AUDIT' : 'SRE ALERT'}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-zinc-900 dark:text-zinc-200 break-words">
                          {log.message}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/70">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-500">
                          Structured ProtoPayload / Metadata
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onAskCopilot(
                              `Explain log event: ${log.message} on ${log.service}`
                            )
                          }
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Analyze with Gemini SRE</span>
                        </button>
                      </div>
                      <pre className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                        {JSON.stringify(log.raw || log, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Touch-Optimized Mobile Cloud Shell */}
        <div
          id="cloud-shell-terminal-card"
          className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm flex flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Touch-Optimized Mobile Cloud Shell</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Hybrid Direct REST Bridge + Real <code className="font-mono">gcloud</code>,{' '}
                <code className="font-mono">bq</code>, <code className="font-mono">gsutil</code> &{' '}
                <code className="font-mono">kubectl</code> CLI execution with read-only data-loss guardrails.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10.5px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Safe Guardrails ON</span>
              </span>
              <button
                type="button"
                onClick={() => setShellHistory([])}
                title="Clear terminal output history"
                className="px-2 py-1 rounded text-[10.5px] font-mono bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* One-Tap Smart Command Chips for Mobile Ergonomics */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3">
            {quickCommands.map((q) => (
              <button
                key={q.label}
                type="button"
                disabled={shellRunning}
                onClick={() => executeShellCommand(q.cmd)}
                className="shrink-0 text-xs font-mono bg-zinc-100 dark:bg-zinc-800/90 hover:bg-blue-500/15 hover:text-blue-500 dark:hover:text-blue-400 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                $ {q.label}
              </button>
            ))}
          </div>

          {/* Command Input Form + Touch History Navigation */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeShellCommand();
            }}
            className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 mb-4"
          >
            <div className="relative flex-1 min-w-[200px]">
              <span className="font-mono text-xs text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2">
                $
              </span>
              <input
                type="text"
                value={shellInput}
                onChange={(e) => setShellInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    cycleShellHistory('PREV');
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    cycleShellHistory('NEXT');
                  }
                }}
                placeholder="Type any read-only gcloud, bq, gsutil, or kubectl command..."
                aria-label="Cloud Shell command input"
                className="w-full bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] pl-7 pr-3 py-[8px] text-xs font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-zinc-950 dark:text-zinc-100 transition-all"
              />
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => cycleShellHistory('PREV')}
                disabled={shellHistory.length === 0}
                title="Previous command in history (Up Arrow)"
                className="px-2 py-[8px] rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => cycleShellHistory('NEXT')}
                disabled={shellHistory.length === 0}
                title="Next command in history (Down Arrow)"
                className="px-2 py-[8px] rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
              <button
                type="submit"
                disabled={shellRunning || !shellInput.trim()}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-[14px] py-[8px] text-xs font-[600] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{shellRunning ? 'Running...' : 'Run'}</span>
              </button>
            </div>
          </form>

          {/* Terminal Output Stream */}
          <div className="flex-1 bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 font-mono text-xs text-zinc-800 dark:text-zinc-200 space-y-3 max-h-[340px] overflow-y-auto">
            {shellHistory.length === 0 ? (
              <div className="text-[11px] text-zinc-500 text-center py-8">
                Terminal cleared. Tap any quick command chip above or type a <code className="font-mono">gcloud</code> / <code className="font-mono">bq</code> command.
              </div>
            ) : (
              shellHistory.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-zinc-200 dark:border-zinc-800/80 pb-3 last:border-b-0 last:pb-0 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span
                      onClick={() => setShellInput(item.command)}
                      title="Click to load command into input"
                      className="text-emerald-400 font-bold cursor-pointer hover:underline break-all"
                    >
                      $ {item.command}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.engine && (
                        <span className="px-1.5 py-0.5 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[9.5px] text-blue-700 dark:text-blue-300">
                          {item.engine}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold ${
                          item.exitCode === 0
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        exit={item.exitCode ?? 0}
                      </span>
                      <span className="text-zinc-500">{item.durationMs}ms</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.output, `shell-out-${item.id}`)}
                        className="text-[10px] text-zinc-400 hover:text-white inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        {copiedId === `shell-out-${item.id}` ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <pre className="text-[11px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                    {item.output}
                  </pre>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
