import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Flame,
  ShieldCheck,
  ShieldAlert,
  Activity,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  FileText,
  Lock,
  Network,
  Radio,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Server,
  Globe,
  Cpu,
  Clock,
  Play,
  Sparkles,
  GitBranch,
  Layers,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Eye,
} from 'lucide-react';

const SRE_PILLARS = [
  {
    id: 'SLO_BURN_AND_RCA',
    num: '01',
    shortTitle: 'SLO Burn & LogRCA',
    subtitle: '14.4x / 6.0x Multi-Window Burn & Root-Cause Autopsy',
  },
  {
    id: 'GOLDEN_SIGNALS_FLEET',
    num: '02',
    shortTitle: '4 Golden Signals Fleet',
    subtitle: 'Latency, Traffic, Errors & Saturation Matrix',
  },
  {
    id: 'UPTIME_AND_ALERT_POLICIES',
    num: '03',
    shortTitle: 'Uptime & Alert Policies',
    subtitle: 'Cloud Monitoring v3 Global Probes & P1 Alerts',
  },
  {
    id: 'BLACKBOX_SYNTHETIC_PROBER',
    num: '04',
    shortTitle: 'Live Synthetic Prober',
    subtitle: 'DNS + TCP + TLS 1.3 + HTTPS TTFB Stopwatch',
  },
  {
    id: 'LOG_BASED_METRICS_SLI',
    num: '05',
    shortTitle: 'Log-Based SLI Metrics',
    subtitle: 'Cloud Logging v2 Counter Metrics (5xx/OOM/403)',
  },
  {
    id: 'CHAOS_GAME_DAY_LAB',
    num: '06',
    shortTitle: 'Chaos Game-Day Lab',
    subtitle: 'Live Fault Injection & MTTD / MTTR Stopwatch',
  },
  {
    id: 'GEMINI_SRE_COMMANDER',
    num: '07',
    shortTitle: 'Gemini 3.8/3.1 Commander',
    subtitle: 'AI Root-Cause Hypothesis & Blameless Postmortem',
  },
  {
    id: 'CHANGE_CORRELATION_TIMELINE',
    num: '08',
    shortTitle: 'Change & Event Timeline',
    subtitle: 'Live 50-Event Log + Config Mutation Correlator',
  },
  {
    id: 'VPCSC_ZERO_EXFIL_ARCHITECT',
    num: '09',
    shortTitle: 'VPC-SC & Subnet PGA',
    subtitle: 'restricted.googleapis.com (199.36.153.4/30) Guard',
  },
  {
    id: 'PUBSUB_DLQ_AUTOPSY',
    num: '10',
    shortTitle: 'Pub/Sub & DLQ Studio',
    subtitle: 'Exactly-Once Delivery & Dead-Letter Queue (-dlq)',
  },
  {
    id: 'TOIL_AUTOMATION_RUNBOOKS',
    num: '11',
    shortTitle: '1-Click SRE Runbooks',
    subtitle: '6 Autonomous Toil-Elimination & Self-Healing Flows',
  },
  {
    id: 'HEALTH_DRIFT_SOC_BRIDGE',
    num: '12',
    shortTitle: 'Health, Drift & SOC Bridge',
    subtitle: 'Merkle State Vault, GitOps HCL & Wave 16 SOC Link',
  },
];

export default function SreWarRoomPerimeterStudio({
  projectId,
  onTriggerToast,
  onRunInShell,
  onNavigateTab,
  onOpenHealthAndDrift,
  onRefreshOverview,
}) {
  const [activePillar, setActivePillar] = useState('SLO_BURN_AND_RCA');
  const [sloTarget, setSloTarget] = useState(99.9);
  const [copiedText, setCopiedText] = useState('');

  // Core SRE War-Room State
  const [warRoomData, setWarRoomData] = useState(null);
  const [loadingWarRoom, setLoadingWarRoom] = useState(false);
  const [actionBusy, setActionBusy] = useState('');
  const [drillBusy, setDrillBusy] = useState('');
  const [expandedClusters, setExpandedClusters] = useState({});
  const [showPostmortemPreview, setShowPostmortemPreview] = useState(false);

  // Pillar 03: Uptime Check & Alert Policy Builder State
  const [newUptimeHost, setNewUptimeHost] = useState('');
  const [newUptimePath, setNewUptimePath] = useState('/');
  const [newAlertTitle, setNewAlertTitle] = useState('');

  // Pillar 04: Synthetic Blackbox Prober State
  const [syntheticResult, setSyntheticResult] = useState(null);
  const [syntheticLoading, setSyntheticLoading] = useState(false);
  const [customProbeUrl, setCustomProbeUrl] = useState('');

  // Pillar 05: Custom Log-Based SLI Metric State
  const [customMetricName, setCustomMetricName] = useState(
    'cloudpulse_sre_custom_sli'
  );
  const [customMetricFilter, setCustomMetricFilter] = useState(
    'severity>=ERROR'
  );

  // Pillar 07: Gemini 3.8 Flash / 3.1 Pro SRE Commander State
  const [aiModel, setAiModel] = useState('gemini-3.8-flash');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCommanderResult, setAiCommanderResult] = useState(null);
  const [aiCommanderLoading, setAiCommanderLoading] = useState(false);

  // Pillar 08: Timeline Filter & Search State
  const [timelineFilter, setTimelineFilter] = useState('ALL');
  const [timelineSearch, setTimelineSearch] = useState('');

  // Pillar 09: VPC-SC Data Exfiltration Perimeter State
  const [vpcScData, setVpcScData] = useState(null);
  const [loadingVpcSc, setLoadingVpcSc] = useState(false);
  const [enablingPgaSubnet, setEnablingPgaSubnet] = useState(null);
  const [perimeterBlueprint, setPerimeterBlueprint] =
    useState('sec-17a4-enclave');
  const [perimeterName, setPerimeterName] = useState(
    'cloudpulse_zero_exfil_perimeter'
  );
  const [vipMode, setVipMode] = useState('RESTRICTED_VIP');
  const [restrictedServices, setRestrictedServices] = useState([
    'storage.googleapis.com',
    'bigquery.googleapis.com',
    'secretmanager.googleapis.com',
    'cloudkms.googleapis.com',
    'aiplatform.googleapis.com',
    'run.googleapis.com',
  ]);

  // Pillar 10: Pub/Sub & Dead-Letter Queue (DLQ) Studio State
  const [pubsubData, setPubsubData] = useState(null);
  const [loadingPubsub, setLoadingPubsub] = useState(false);
  const [dlqBlueprint, setDlqBlueprint] = useState('zero-loss-financial');
  const [topicName, setTopicName] = useState('sre-incident-events');
  const [maxDeliveryAttempts, setMaxDeliveryAttempts] = useState(5);
  const [ackDeadlineSeconds, setAckDeadlineSeconds] = useState(30);
  const [exactlyOnce, setExactlyOnce] = useState(true);
  const [retentionDays, setRetentionDays] = useState(7);
  const [provisioningPubsub, setProvisioningPubsub] = useState(false);

  const notify = useCallback(
    (msg) => {
      if (onTriggerToast && msg) onTriggerToast(msg);
    },
    [onTriggerToast]
  );

  const handleCopy = (text, label = 'command') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    notify(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const fetchWarRoom = useCallback(
    async (targetOverride) => {
      if (!projectId) return;
      const targetSlo = targetOverride ?? sloTarget;
      setLoadingWarRoom(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/wave8/war-room?sloTarget=${encodeURIComponent(targetSlo)}`
        );
        setWarRoomData(res.data);
      } catch (err) {
        notify(
          err.response?.data?.error || 'Failed to load SRE Incident War-Room'
        );
      } finally {
        setLoadingWarRoom(false);
      }
    },
    [projectId, sloTarget, notify]
  );

  const fetchVpcSc = useCallback(async () => {
    if (!projectId) return;
    setLoadingVpcSc(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave8/vpc-sc-perimeter`
      );
      setVpcScData(res.data);
    } catch (err) {
      notify(
        err.response?.data?.error ||
          'Failed to inspect VPC Service Controls & Private Google Access'
      );
    } finally {
      setLoadingVpcSc(false);
    }
  }, [projectId, notify]);

  const fetchPubsubDlq = useCallback(async () => {
    if (!projectId) return;
    setLoadingPubsub(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave8/pubsub-dlq`
      );
      setPubsubData(res.data);
    } catch (err) {
      notify(
        err.response?.data?.error || 'Failed to load Pub/Sub & DLQ inventory'
      );
    } finally {
      setLoadingPubsub(false);
    }
  }, [projectId, notify]);

  const fetchAllTelemetry = useCallback(async () => {
    await Promise.all([fetchWarRoom(), fetchVpcSc(), fetchPubsubDlq()]);
  }, [fetchWarRoom, fetchVpcSc, fetchPubsubDlq]);

  useEffect(() => {
    fetchAllTelemetry();
  }, [fetchAllTelemetry]);

  const handleExecuteSreAction = async (busyKey, payload) => {
    if (!projectId) return;
    setActionBusy(busyKey);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave8/war-room/sre-action`,
        payload
      );
      notify(res.data?.message || 'Executed SRE control-plane action');
      await fetchAllTelemetry();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      notify(err.response?.data?.error || 'SRE control-plane action failed');
    } finally {
      setActionBusy('');
    }
  };

  const handleIncidentDrill = async (action) => {
    if (!projectId) return;
    setDrillBusy(action);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave8/war-room/incident-drill`,
        { action }
      );
      notify(res.data?.message || 'Updated SRE Chaos Drill');
      await fetchWarRoom();
    } catch (err) {
      notify(err.response?.data?.error || 'Chaos drill action failed');
    } finally {
      setDrillBusy('');
    }
  };

  const handleRunSyntheticProbe = async (overrideUrl) => {
    if (!projectId) return;
    setSyntheticLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave8/war-room/synthetic-probe`,
        {
          customUrl:
            overrideUrl !== undefined ? overrideUrl : customProbeUrl.trim(),
        }
      );
      setSyntheticResult(res.data);
      notify(res.data?.message || 'Completed live synthetic blackbox probe');
    } catch (err) {
      notify(err.response?.data?.error || 'Synthetic blackbox probe failed');
    } finally {
      setSyntheticLoading(false);
    }
  };

  const handleRunAiSreCommander = async (customDirective) => {
    if (!projectId) return;
    setAiCommanderLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave8/war-room/ai-sre-commander`,
        {
          model: aiModel,
          prompt:
            customDirective !== undefined ? customDirective : aiPrompt.trim(),
          sloBurnRadar: warRoomData?.sloBurnRadar || {},
          clusters: warRoomData?.clusters || [],
        }
      );
      setAiCommanderResult(res.data);
      notify(res.data?.message || `Synthesized briefing with ${aiModel}`);
    } catch (err) {
      notify(err.response?.data?.error || 'AI SRE Commander synthesis failed');
    } finally {
      setAiCommanderLoading(false);
    }
  };

  const handleEnableSubnetPga = async (region, subnetName) => {
    const key = `${region}/${subnetName}`;
    setEnablingPgaSubnet(key);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave8/vpc-sc-perimeter/enable-pga`,
        { region, subnetName }
      );
      notify(
        res.data?.message || `Enabled Private Google Access on ${subnetName}`
      );
      await fetchVpcSc();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      notify(
        err.response?.data?.error ||
          'Failed to enable Private Google Access on subnet'
      );
    } finally {
      setEnablingPgaSubnet(null);
    }
  };

  const applyPerimeterBlueprint = (bp) => {
    setPerimeterBlueprint(bp);
    if (bp !== 'custom') {
      setVipMode('RESTRICTED_VIP');
      setRestrictedServices([
        'storage.googleapis.com',
        'bigquery.googleapis.com',
        'secretmanager.googleapis.com',
        'cloudkms.googleapis.com',
        'aiplatform.googleapis.com',
        'run.googleapis.com',
      ]);
    }
  };

  const applyDlqBlueprint = (bp) => {
    setDlqBlueprint(bp);
    if (bp === 'zero-loss-financial') {
      setExactlyOnce(true);
      setMaxDeliveryAttempts(5);
      setAckDeadlineSeconds(30);
      setRetentionDays(7);
    } else if (bp === 'hipaa-clinical-events') {
      setExactlyOnce(true);
      setMaxDeliveryAttempts(5);
      setAckDeadlineSeconds(60);
      setRetentionDays(7);
    }
  };

  const handleProvisionPubsubPair = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!topicName.trim()) return;
    setProvisioningPubsub(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave8/pubsub-dlq/provision-pair`,
        {
          topicName: topicName.trim(),
          maxDeliveryAttempts,
          ackDeadlineSeconds,
          enableExactlyOnceDelivery: exactlyOnce,
          retentionDays,
        }
      );
      notify(res.data?.message || 'Provisioned Pub/Sub Topic + DLQ Pair');
      await fetchPubsubDlq();
    } catch (err) {
      notify(
        err.response?.data?.error ||
          'Failed to provision Pub/Sub Topic + DLQ Pair'
      );
    } finally {
      setProvisioningPubsub(false);
    }
  };

  const slo = warRoomData?.sloBurnRadar || {
    sloTargetPct: sloTarget,
    monthlyBudgetMinutes: 43.2,
    budgetRemainingPct: 100,
    budgetMinutesRemaining: 43.2,
    fastBurn1h: 0,
    fastBurnPagingThreshold: 14.4,
    slowBurn6h: 0,
    slowBurnTicketThreshold: 6.0,
    burn24h: 0,
    burn72h: 0,
    timeToExhaustionHours: 720,
    activeErrorCount: 0,
    alertStatus: 'NOMINAL_WITHIN_SLO',
  };

  const clusters = warRoomData?.clusters || [];
  const timeline = warRoomData?.timeline || [];
  const goldenFleetWorkloads = warRoomData?.goldenFleetWorkloads || [];
  const uptimeChecks = warRoomData?.uptimeChecks || [];
  const alertPolicies = warRoomData?.alertPolicies || [];
  const logBasedMetrics = warRoomData?.logBasedMetrics || [];
  const healthAndSocBridge = warRoomData?.healthAndSocBridge || {};

  // Auto-run read-only diagnostics when switching to Synthetic Prober (Pillar 04) or AI Commander (Pillar 07)
  useEffect(() => {
    if (
      activePillar === 'BLACKBOX_SYNTHETIC_PROBER' &&
      !syntheticResult &&
      !syntheticLoading &&
      projectId
    ) {
      handleRunSyntheticProbe();
    } else if (
      activePillar === 'GEMINI_SRE_COMMANDER' &&
      !aiCommanderResult &&
      !aiCommanderLoading &&
      warRoomData &&
      projectId
    ) {
      handleRunAiSreCommander(
        'Diagnose top SLO error-budget burn cluster & output exact gcloud hotfix'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePillar, projectId]);

  const GOLDEN_SLI_IDS = [
    'cloudpulse_sre_5xx_errors',
    'cloudpulse_sre_oom_exit137',
    'cloudpulse_sre_iam_403_denied',
  ];
  const goldenSlisCount = GOLDEN_SLI_IDS.filter((id) =>
    logBasedMetrics.some((m) => m.name === id || String(m.name || '').endsWith(`/${id}`))
  ).length;
  const allGoldenSlisActive = goldenSlisCount >= 3 || logBasedMetrics.length >= 3;
  const hasActiveUptimeCheck = uptimeChecks.length > 0;
  const hasActiveAlertPolicy = alertPolicies.some((ap) => ap.enabled !== false);
  const allSubnetsPgaEnabled = (vpcScData?.pgaCoveragePct ?? 100) === 100;
  const unshieldedSubs = (pubsubData?.subscriptions || []).filter(
    (s) => !s.hasDlqProtection && !String(s.shortName || '').endsWith('-dlq-sub')
  );
  const allPubsubDlqProtected =
    (pubsubData?.summary?.subscriptionsCount || 0) > 0 &&
    unshieldedSubs.length === 0;
  const noActiveP1ChaosDrill = !warRoomData?.drillActive;

  const sreReadinessInvariants = [
    {
      id: 'SRE-INV-01',
      key: 'RB_UPTIME',
      title: 'Global 60s HTTPS Uptime Check Prober',
      compliant: hasActiveUptimeCheck,
      statusDetail: hasActiveUptimeCheck
        ? `${uptimeChecks.length} Global HTTPS Probe(s) Active (${uptimeChecks[0]?.displayName || uptimeChecks[0]?.host})`
        : `0 Uptime Checks configured in monitoring.googleapis.com/v3`,
      desc: `Provisions a 60s SSL-validated global HTTPS probe in monitoring.googleapis.com/v3 for ${projectId}.appspot.com.`,
      pillarId: 'UPTIME_AND_ALERT_POLICIES',
      pillarLabel: 'Inspect Uptime & Alerts',
      onRemediate: () =>
        handleExecuteSreAction('RB_UPTIME', {
          action: 'CREATE_CLOUD_MONITORING_UPTIME_CHECK',
          host: `${projectId}.appspot.com`,
          path: '/',
        }),
    },
    {
      id: 'SRE-INV-02',
      key: 'RB_ALERT',
      title: '14.4x Multi-Window P1 SLO Burn Alert Policy',
      compliant: hasActiveAlertPolicy,
      statusDetail: hasActiveAlertPolicy
        ? `${alertPolicies.filter((a) => a.enabled !== false).length} Enabled Alert Policy (${alertPolicies[0]?.displayName})`
        : `No enabled P1 SLO Alert Policy in monitoring.googleapis.com/v3`,
      desc: 'Provisions a Cloud Monitoring Alert Policy watching for P1 CRITICAL/ERROR War-Room cascades.',
      pillarId: 'UPTIME_AND_ALERT_POLICIES',
      pillarLabel: 'Inspect Uptime & Alerts',
      onRemediate: () =>
        handleExecuteSreAction('RB_ALERT', {
          action: 'CREATE_SLO_ALERT_POLICY',
        }),
    },
    {
      id: 'SRE-INV-03',
      key: 'RB_SLI_METRICS',
      title: '3 Golden Log-Based SLI Counter Metrics',
      compliant: allGoldenSlisActive,
      statusDetail: allGoldenSlisActive
        ? `${logBasedMetrics.length} Log-Based SLI Counter Metric(s) Active (5xx, OOM-137, IAM-403)`
        : `${goldenSlisCount}/3 Golden SLI Counter Metrics provisioned in Cloud Logging v2`,
      desc: 'Provisions cloudpulse_sre_5xx_errors, cloudpulse_sre_oom_exit137, and cloudpulse_sre_iam_403_denied in Cloud Logging v2.',
      pillarId: 'LOG_BASED_METRICS_SLI',
      pillarLabel: 'Inspect Log-Based SLIs',
      onRemediate: () =>
        handleExecuteSreAction('RB_SLI_METRICS', {
          action: 'BOOTSTRAP_ALL_GOLDEN_SLI_METRICS',
        }),
    },
    {
      id: 'SRE-INV-04',
      key: 'RB_PGA_ALL',
      title: '100% Regional VPC Subnet Private Google Access',
      compliant: allSubnetsPgaEnabled,
      statusDetail: `${vpcScData?.summary?.pgaEnabledSubnets ?? 0}/${vpcScData?.summary?.totalSubnets ?? 0} Subnets Hardened (${vpcScData?.pgaCoveragePct ?? 100}% PGA Coverage)`,
      desc: 'Batch-enables privateIpGoogleAccess=true across all regional VPC subnetworks for VPC-SC readiness.',
      pillarId: 'VPCSC_ZERO_EXFIL_ARCHITECT',
      pillarLabel: 'Inspect VPC-SC Architect',
      onRemediate: () =>
        handleExecuteSreAction('RB_PGA_ALL', {
          action: 'ENFORCE_ALL_SUBNETS_PGA',
        }),
    },
    {
      id: 'SRE-INV-05',
      key: 'RB_DLQ_SHIELD',
      title: 'Resilient Pub/Sub Dead-Letter Queue (-dlq) Shield',
      compliant: allPubsubDlqProtected,
      statusDetail: allPubsubDlqProtected
        ? `${pubsubData?.summary?.dlqProtectedCount || 0}/${pubsubData?.summary?.subscriptionsCount || 0} Subscription(s) DLQ-Protected`
        : (pubsubData?.summary?.subscriptionsCount || 0) === 0
        ? '0 Pub/Sub Subscriptions provisioned yet'
        : `${unshieldedSubs.length} Subscription(s) missing Dead-Letter Queue protection`,
      desc: 'Provisions or attaches a Dead-Letter Queue (-dlq) topic (maxDeliveryAttempts=5) so poison-pill messages never block subscribers.',
      pillarId: 'PUBSUB_DLQ_AUTOPSY',
      pillarLabel: 'Inspect Pub/Sub DLQ',
      onRemediate: () => {
        if ((pubsubData?.summary?.subscriptionsCount || 0) === 0) {
          return handleProvisionPubsubPair();
        }
        return handleExecuteSreAction('RB_DLQ_SHIELD', {
          action: 'ATTACH_DLQ_TO_SUBSCRIPTION',
          subscriptionName: unshieldedSubs[0]?.shortName,
        });
      },
    },
    {
      id: 'SRE-INV-06',
      key: 'RB_RESOLVE_P1',
      title: 'Zero Active P1 Chaos Cascades & Merkle Baseline Sealed',
      compliant:
        noActiveP1ChaosDrill &&
        (healthAndSocBridge.merkleSnapshotsCount || 0) > 0,
      statusDetail: !noActiveP1ChaosDrill
        ? `ACTIVE P1 CHAOS DRILL IN PROGRESS (${slo.fastBurn1h}x Burn Rate)`
        : (healthAndSocBridge.merkleSnapshotsCount || 0) > 0
        ? `Nominal (${slo.fastBurn1h}x Burn) · ${healthAndSocBridge.merkleSnapshotsCount} Merkle Checkpoint(s) Sealed`
        : `Nominal (${slo.fastBurn1h}x Burn) · 0 Merkle Checkpoints Sealed Yet`,
      desc: 'Mitigates active P1 Chaos Drills and seals a SHA-256 Merkle state checkpoint into the shared Health & Drift vault.',
      pillarId: !noActiveP1ChaosDrill
        ? 'CHAOS_GAME_DAY_LAB'
        : 'HEALTH_DRIFT_SOC_BRIDGE',
      pillarLabel: !noActiveP1ChaosDrill
        ? 'Inspect Chaos Game-Day'
        : 'Inspect Health & SOC Bridge',
      onRemediate: () => {
        if (!noActiveP1ChaosDrill) {
          return handleIncidentDrill('RESOLVE_INCIDENT');
        }
        return handleExecuteSreAction('RB_MERKLE_SNAP', {
          action: 'CAPTURE_SRE_MERKLE_SNAPSHOT',
        });
      },
    },
  ];

  const compliantSreCount = sreReadinessInvariants.filter(
    (inv) => inv.compliant
  ).length;
  const nonCompliantSreInvariants = sreReadinessInvariants.filter(
    (inv) => !inv.compliant
  );

  const handleReconcileAllSreInvariants = async () => {
    if (nonCompliantSreInvariants.length === 0) {
      await handleExecuteSreAction('RB_MERKLE_SNAP', {
        action: 'CAPTURE_SRE_MERKLE_SNAPSHOT',
      });
      return;
    }
    for (const inv of nonCompliantSreInvariants) {
      await inv.onRemediate();
    }
  };

  const filteredTimeline = useMemo(() => {
    return timeline.filter((ev) => {
      if (timelineFilter === 'ERRORS' && !ev.effectiveIsTrueError) return false;
      if (
        timelineFilter === 'MUTATIONS' &&
        ev.clusterKey !== 'CONFIG_MUTATION_AUDIT_EVENT'
      ) {
        return false;
      }
      if (timelineFilter === 'DRILLS' && !ev.isWarRoomDrill) return false;
      if (timelineSearch.trim()) {
        const q = timelineSearch.trim().toLowerCase();
        const hay = `${ev.clusterTitle} ${ev.serviceName} ${ev.methodName} ${ev.principal} ${ev.summary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [timeline, timelineFilter, timelineSearch]);

  const isPerimeterCustom = perimeterBlueprint === 'custom';
  const isDlqCustom = dlqBlueprint === 'custom';

  const vpcScCli = `gcloud access-context-manager perimeters create ${perimeterName} \\
  --title="${perimeterName}" \\
  --resources="projects/${projectId}" \\
  --restricted-services="${restrictedServices.join(',')}" \\
  --enable-vpc-accessible-services \\
  --vpc-allowed-services="RESTRICTED-SERVICES"`;

  const getPillarBadge = (pId) => {
    switch (pId) {
      case 'SLO_BURN_AND_RCA':
        return slo.alertStatus === 'P1_PAGE_FAST_BURN'
          ? `P1 ${slo.fastBurn1h}x BURN`
          : `${slo.budgetRemainingPct}% SLO`;
      case 'GOLDEN_SIGNALS_FLEET':
        return `${goldenFleetWorkloads.length} Workloads`;
      case 'UPTIME_AND_ALERT_POLICIES':
        return `${uptimeChecks.length} Probes · ${alertPolicies.length} Alerts`;
      case 'BLACKBOX_SYNTHETIC_PROBER':
        return syntheticResult
          ? `${syntheticResult.avgLatencyMs}ms Avg`
          : '5 Live Targets';
      case 'LOG_BASED_METRICS_SLI':
        return `${logBasedMetrics.length} SLI Metrics`;
      case 'CHAOS_GAME_DAY_LAB':
        return warRoomData?.drillActive ? 'DRILL ACTIVE' : '4 Scenarios';
      case 'GEMINI_SRE_COMMANDER':
        return aiModel === 'gemini-3.1-pro' ? '3.1 Pro' : '3.8 Flash';
      case 'CHANGE_CORRELATION_TIMELINE':
        return `${timeline.length} Events`;
      case 'VPCSC_ZERO_EXFIL_ARCHITECT':
        return `${vpcScData?.pgaCoveragePct ?? 100}% PGA`;
      case 'PUBSUB_DLQ_AUTOPSY':
        return `${pubsubData?.summary?.topicsCount || 0} Topics`;
      case 'TOIL_AUTOMATION_RUNBOOKS':
        return `${compliantSreCount}/6 Compliant`;
      case 'HEALTH_DRIFT_SOC_BRIDGE':
        return `${healthAndSocBridge.flightMutationsCount || 0} HCL Diffs`;
      default:
        return 'LIVE';
    }
  };

  return (
    <div className="space-y-4">
      {/* ====================================================================
          TOP HERO COMMAND BAR & MULTI-WINDOW SLO TELEMETRY STRIP
         ==================================================================== */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141518] p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] font-mono font-bold">
              <Flame className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>
                WAVE-8 · 12-PILLAR PRINCIPAL SRE INCIDENT WAR-ROOM, MULTI-WINDOW SLO BURN RADAR &amp; ZERO-EXFIL ARCHITECT
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Autonomous SRE Incident Command Center, Live Blackbox Synthetic Prober &amp; Self-Healing Runbook Engine
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-4xl">
              Real-time Google SRE Book Chapter 5 Multi-Window Error-Budget Burn (`14.4x` 1h Page / `6.0x` 6h Ticket), live `logging.googleapis.com/v2` root-cause autopsy, `monitoring.googleapis.com/v3` Global Uptime &amp; Alert Policy provisioner, DNS/TLS 1.3/HTTPS synthetic prober, VPC-SC `199.36.153.4/30` guard, and Exactly-Once Pub/Sub Dead-Letter Queue (`-dlq`) studio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selectable SLO Target */}
            <div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1 text-[11px] font-mono">
              {[
                { val: 99.5, label: '99.5% (216m)' },
                { val: 99.9, label: '99.9% (43.2m)' },
                { val: 99.99, label: '99.99% (4.32m)' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => {
                    setSloTarget(opt.val);
                    fetchWarRoom(opt.val);
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer transition-all ${
                    sloTarget === opt.val
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {!warRoomData?.drillActive ? (
              <button
                type="button"
                data-feature-id="SRE_FIRE_CHAOS_DRILL_BTN"
                disabled={Boolean(drillBusy)}
                onClick={() => handleIncidentDrill('INJECT_CASCADE_DRILL')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {drillBusy === 'INJECT_CASCADE_DRILL'
                    ? 'Injecting P1 Cascade...'
                    : '1-Click Fire P1 Chaos Drill'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                data-feature-id="SRE_FIRE_CHAOS_DRILL_BTN"
                disabled={Boolean(drillBusy)}
                onClick={() => handleIncidentDrill('RESOLVE_INCIDENT')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {drillBusy === 'RESOLVE_INCIDENT'
                    ? 'Mitigating P1...'
                    : '1-Click Mitigate & Resolve P1'}
                </span>
              </button>
            )}

            <button
              type="button"
              data-feature-id="SRE_POSTMORTEM_MD_BTN"
              onClick={() => setShowPostmortemPreview((p) => !p)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-xs font-bold cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Blameless Postmortem.md</span>
            </button>

            <button
              type="button"
              data-feature-id="SRE_SYNC_ALL_PILLARS_BTN"
              onClick={fetchAllTelemetry}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingWarRoom || loadingVpcSc || loadingPubsub
                    ? 'animate-spin text-red-500'
                    : ''
                }`}
              />
              <span>Sync All 12 Pillars</span>
            </button>
          </div>
        </div>

        {/* 6-Card Executive SRE Telemetry Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
            <div className="text-[10px] font-mono text-zinc-500">
              30-Day Error Budget ({slo.sloTargetPct}%)
            </div>
            <div
              className={`text-xl font-black mt-0.5 ${
                slo.budgetRemainingPct >= 75
                  ? 'text-emerald-500'
                  : slo.budgetRemainingPct >= 40
                  ? 'text-amber-500'
                  : 'text-red-500'
              }`}
            >
              {slo.budgetRemainingPct}%
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {slo.budgetMinutesRemaining}m / {slo.monthlyBudgetMinutes}m left
            </div>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              slo.fastBurn1h >= 14.4
                ? 'border-red-500 bg-red-500/10'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70'
            }`}
          >
            <div className="text-[10px] font-mono text-zinc-500">
              1h Fast-Burn (`14.4x` Page)
            </div>
            <div
              className={`text-xl font-black mt-0.5 ${
                slo.fastBurn1h >= 14.4 ? 'text-red-500' : 'text-emerald-500'
              }`}
            >
              {slo.fastBurn1h}x
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {slo.fastBurn1h >= 14.4
                ? `P1 PAGE (Exhausts in ${slo.timeToExhaustionHours}h)`
                : 'Within 14.4x P1 threshold'}
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
            <div className="text-[10px] font-mono text-zinc-500">
              6h / 24h Multi-Window Burn
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
              {slo.slowBurn6h}x / {slo.burn24h}x
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              6h Ticket Cap: 6.0x · 72h: {slo.burn72h}x
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
            <div className="text-[10px] font-mono text-zinc-500">
              Monitoring Uptime &amp; Alerts
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
              {uptimeChecks.length} / {alertPolicies.length}
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {logBasedMetrics.length} Log-Based SLI Metric(s)
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
            <div className="text-[10px] font-mono text-zinc-500">
              VPC-SC &amp; Subnet PGA Shield
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
              {vpcScData?.pgaCoveragePct ?? 100}% PGA
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {vpcScData?.summary?.pgaEnabledSubnets ?? 0}/
              {vpcScData?.summary?.totalSubnets ?? 0} Subnets Hardened
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70">
            <div className="text-[10px] font-mono text-zinc-500">
              Pub/Sub &amp; DLQ Resilience
            </div>
            <div className="text-xl font-black text-zinc-900 dark:text-zinc-100 mt-0.5">
              {pubsubData?.summary?.dlqProtectedCount || 0}/
              {pubsubData?.summary?.subscriptionsCount || 0} DLQ
            </div>
            <div className="text-[10px] font-mono text-zinc-400">
              {pubsubData?.summary?.topicsCount || 0} Topic(s) · Exactly-Once:{' '}
              {pubsubData?.summary?.exactlyOnceCount || 0}
            </div>
          </div>
        </div>

        {/* Auto-Synthesized Blameless Postmortem Drawer */}
        {showPostmortemPreview && warRoomData?.postmortemMarkdown && (
          <div className="p-4 rounded-xl border border-blue-500/40 bg-zinc-50 dark:bg-zinc-950 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>
                  Auto-Synthesized Google SRE Book Blameless Postmortem (`postmortem.md`)
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    warRoomData.postmortemMarkdown,
                    'Blameless Postmortem Markdown'
                  )
                }
                className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer"
              >
                Copy Postmortem.md
              </button>
            </div>
            <pre className="text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-64 overflow-y-auto">
              {warRoomData.postmortemMarkdown}
            </pre>
          </div>
        )}

        {/* ==================================================================
            12-PILLAR (3x4 BENTO GRID) NAVIGATION MATRIX
           ================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {SRE_PILLARS.map((p) => {
            const active = activePillar === p.id;
            const badge = getPillarBadge(p.id);
            const isAlert =
              (p.id === 'SLO_BURN_AND_RCA' &&
                slo.alertStatus === 'P1_PAGE_FAST_BURN') ||
              (p.id === 'CHAOS_GAME_DAY_LAB' && warRoomData?.drillActive);
            return (
              <button
                key={p.id}
                type="button"
                data-feature-id={`SRE_PILLAR_${p.id}`}
                onClick={() => setActivePillar(p.id)}
                className={`p-2.5 rounded-md border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isAlert
                    ? 'bg-red-500/10 border-red-500/40 text-zinc-900 dark:text-white'
                    : 'bg-zinc-50/90 dark:bg-zinc-900/80 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full truncate ${
                      active
                        ? 'bg-white/20 text-white'
                        : isAlert
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-zinc-200/70 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <div className="text-xs font-extrabold truncate mt-0.5">
                  {p.shortTitle}
                </div>
                <div
                  className={`text-[10px] font-mono truncate ${
                    active ? 'text-red-100' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {p.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          PILLAR 01: MULTI-WINDOW SLO ERROR-BUDGET BURN RADAR & LogRCA AUTOPSY
         ==================================================================== */}
      {activePillar === 'SLO_BURN_AND_RCA' && (
        <div className="space-y-4">
          {/* Google SRE Book Chapter 5 Multi-Window Burn Rate Table */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />
                  <span>
                    Google SRE Book Multi-Window Multi-Burn-Rate Matrix (`{slo.sloTargetPct}%` Target · `{slo.monthlyBudgetMinutes}m` Monthly Budget)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Pages only when both short and long windows exceed burn thresholds, preventing false-positive alert fatigue while catching catastrophic 1-hour cascades in under 2 minutes.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {hasActiveAlertPolicy ? (
                  <button
                    type="button"
                    onClick={() => setActivePillar('UPTIME_AND_ALERT_POLICIES')}
                    className="px-3 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-extrabold cursor-pointer"
                  >
                    [ARMED · {alertPolicies.length} Alert Policy Active] Manage Uptime &amp; Alerts &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(actionBusy)}
                    onClick={() =>
                      handleExecuteSreAction('SLO_ARM_ALERT', {
                        action: 'CREATE_SLO_ALERT_POLICY',
                      })
                    }
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {actionBusy === 'SLO_ARM_ALERT'
                      ? 'Arming P1 Alert...'
                      : '1-Click Arm 14.4x SLO Burn Alert Policy'}
                  </button>
                )}

                {allGoldenSlisActive ? (
                  <button
                    type="button"
                    onClick={() => setActivePillar('LOG_BASED_METRICS_SLI')}
                    className="px-3 py-1.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-600 dark:text-blue-400 text-xs font-mono font-extrabold cursor-pointer"
                  >
                    [VERIFIED · {logBasedMetrics.length} Golden SLIs Active] Manage Log-Based SLIs &rarr;
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={Boolean(actionBusy)}
                    onClick={() =>
                      handleExecuteSreAction('SLO_BOOT_SLI', {
                        action: 'BOOTSTRAP_ALL_GOLDEN_SLI_METRICS',
                      })
                    }
                    className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {actionBusy === 'SLO_BOOT_SLI'
                      ? 'Provisioning SLIs...'
                      : '1-Click Bootstrap 3 Golden SLI Metrics'}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              {[
                {
                  window: '1-Hour / 5-Min Fast Burn',
                  rate: slo.fastBurn1h,
                  cap: 14.4,
                  action: 'P1 PagerDuty / SMS Page (2% budget in 1h)',
                },
                {
                  window: '6-Hour / 30-Min Medium Burn',
                  rate: slo.slowBurn6h,
                  cap: 6.0,
                  action: 'P2 Urgent On-Call Page (5% budget in 6h)',
                },
                {
                  window: '24-Hour / 2-Hour Slow Burn',
                  rate: slo.burn24h,
                  cap: 3.0,
                  action: 'P3 Jira / Buganizer Ticket (10% budget in 24h)',
                },
                {
                  window: '72-Hour / 6-Hour Trend',
                  rate: slo.burn72h,
                  cap: 1.0,
                  action: 'Baseline Weekly Error-Budget Review',
                },
              ].map((w) => {
                const breached = w.rate >= w.cap;
                return (
                  <div
                    key={w.window}
                    className={`p-3 rounded-xl border ${
                      breached
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900'
                    }`}
                  >
                    <div className="text-[10px] text-zinc-500">{w.window}</div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span
                        className={`text-lg font-black ${
                          breached ? 'text-red-500' : 'text-emerald-500'
                        }`}
                      >
                        {w.rate}x
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Threshold: {w.cap}x
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      {w.action}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correlated LogRCA Root-Cause Clusters with Forensic Autopsy Drawer & 1-Click Actions */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Correlated Cloud Logging Root-Cause Signatures (`logging.googleapis.com/v2` · {clusters.length} Cluster(s))
                </h3>
                <p className="text-xs text-zinc-500">
                  Every signature distinguishes true SLO-burning errors from benign idempotent `409 ALREADY_EXISTS` checks and includes a 1-click control-plane remediation button.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePillar('CHANGE_CORRELATION_TIMELINE')}
                className="px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold cursor-pointer"
              >
                Inspect All {timeline.length} Raw Events &rarr;
              </button>
            </div>

            <div className="space-y-3">
              {clusters.map((c) => {
                const isCrit =
                  (c.severity === 'CRITICAL' || c.severity === 'ERROR') &&
                  c.activeUnmitigatedCount > 0;
                const isExpanded = Boolean(expandedClusters[c.clusterKey]);

                const handleClusterRemediate = () => {
                  if (c.remediationAction === 'RESOLVE_INCIDENT_OR_SCALE') {
                    return handleIncidentDrill('RESOLVE_INCIDENT');
                  }
                  return handleExecuteSreAction(`RCA_${c.clusterKey}`, {
                    action:
                      c.remediationAction ||
                      'CREATE_CLOUD_MONITORING_UPTIME_CHECK',
                  });
                };

                return (
                  <div
                    key={c.clusterKey}
                    className={`p-3.5 rounded-xl border space-y-2.5 ${
                      isCrit
                        ? 'border-red-500/40 bg-red-500/5'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                            isCrit
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          }`}
                        >
                          {c.severity} · {c.count} Event(s) (
                          {c.activeUnmitigatedCount} Active SLO-Burning)
                        </span>
                        <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                          {c.clusterTitle}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          Services: {(c.affectedServices || []).join(', ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {c.activeUnmitigatedCount > 0 ? (
                          <button
                            type="button"
                            disabled={
                              Boolean(actionBusy) || Boolean(drillBusy)
                            }
                            onClick={handleClusterRemediate}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {c.remediationLabel || '1-Click Remediate'}
                            </span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-extrabold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>NOMINAL · 0 Active Burn</span>
                          </span>
                        )}

                        {onNavigateTab &&
                          (String(c.clusterKey || '').includes('IAM') ||
                            String(c.clusterKey || '').includes('403')) && (
                            <button
                              type="button"
                              onClick={() => onNavigateTab('CLOUD_SOC')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
                            >
                              <span>Inspect in Cloud SOC &rarr;</span>
                            </button>
                          )}

                        {onRunInShell && (
                          <button
                            type="button"
                            onClick={() => onRunInShell(c.hotfixCli)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>Run in Shell</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(c.hotfixCli, 'Hotfix CLI')
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono cursor-pointer"
                        >
                          {copiedText === c.hotfixCli ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>Copy CLI</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setExpandedClusters((prev) => ({
                              ...prev,
                              [c.clusterKey]: !prev[c.clusterKey],
                            }))
                          }
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                          <span>Why Flagged?</span>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                      {c.sampleSummary}
                    </div>

                    {isExpanded && (
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-950 border border-blue-500/30 space-y-2 text-xs font-mono">
                        <div className="text-blue-600 dark:text-blue-400 font-bold">
                          Root-Cause Forensic Autopsy (`{c.clusterKey}`):
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-300 font-sans text-xs">
                          {c.whyFlagged}
                        </p>
                        <div className="text-[11px] text-zinc-500">
                          Principals Involved:{' '}
                          <span className="text-zinc-800 dark:text-zinc-200 font-bold">
                            {(c.principals || []).join(', ') || 'system'}
                          </span>
                        </div>
                        {(c.sampleEvents || []).length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="text-[10px] text-zinc-500 uppercase">
                              Recent Correlated Log Samples:
                            </div>
                            {c.sampleEvents.map((ev) => (
                              <div
                                key={ev.id}
                                className="p-1.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                              >
                                <span className="truncate max-w-xl">
                                  [{ev.serviceName}] {ev.summary}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {ev.timestamp}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 02: LIVE 4-GOLDEN-SIGNALS WORKLOAD FLEET MATRIX
         ==================================================================== */}
      {activePillar === 'GOLDEN_SIGNALS_FLEET' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <span>
                  Live 4-Golden-Signals Workload Fleet Matrix (Latency · Traffic · Errors · Saturation)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Live inspection across Compute Engine VMs, Cloud Run v2 Services, App Engine, and BigQuery Datasets on `{projectId}` with 1-click lifecycle and shell actions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePillar('BLACKBOX_SYNTHETIC_PROBER')}
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
            >
              Run Live Synthetic Probe Across Fleet &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goldenFleetWorkloads.map((w) => (
              <div
                key={w.id}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-2.5 text-xs font-mono"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold mr-2">
                      {w.type}
                    </span>
                    <span className="font-extrabold text-zinc-900 dark:text-white">
                      {w.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 ml-1.5">
                      ({w.region})
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      String(w.status).includes('HEALTHY') ||
                      String(w.status).includes('ONLINE')
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : 'bg-amber-500/20 text-amber-500'
                    }`}
                  >
                    {w.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-400">
                      1. Latency Signal
                    </div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {w.goldenSignals?.latencyTarget}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-400">
                      2. Traffic / Routing
                    </div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {w.goldenSignals?.trafficSplit}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-400">
                      3. Error Signal
                    </div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                      {w.goldenSignals?.errorSignal}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] text-zinc-400">
                      4. Saturation Spec
                    </div>
                    <div className="font-bold text-zinc-800 dark:text-zinc-200 truncate">
                      {w.goldenSignals?.saturationSpec}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-[10px] text-zinc-500 truncate max-w-xs">
                    Endpoint: {w.uri}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {w.type === 'COMPUTE_ENGINE_VM' && (
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          handleExecuteSreAction(`VM_${w.name}`, {
                            action: 'START_OR_RESET_GCE_VM',
                            vmName: w.name,
                            zone: w.region,
                            vmVerb:
                              w.status === 'HEALTHY_RUNNING'
                                ? 'reset'
                                : 'start',
                          })
                        }
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold cursor-pointer disabled:opacity-50"
                      >
                        {w.status === 'HEALTHY_RUNNING'
                          ? '1-Click Reset VM'
                          : '1-Click Start VM'}
                      </button>
                    )}

                    {uptimeChecks.some(
                      (u) =>
                        (w.uri && u.host && w.uri.includes(u.host)) ||
                        String(u.displayName || '').includes(w.name)
                    ) ? (
                      <button
                        type="button"
                        onClick={() => {
                          const targetUrl =
                            w.uri && w.uri.startsWith('http')
                              ? w.uri
                              : `https://${projectId}.appspot.com`;
                          setCustomProbeUrl(targetUrl);
                          setActivePillar('BLACKBOX_SYNTHETIC_PROBER');
                          handleRunSyntheticProbe(targetUrl);
                        }}
                        className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-extrabold cursor-pointer"
                      >
                        [UPTIME MONITORED] Probe Live &rarr;
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          handleExecuteSreAction(`UPTIME_${w.id}`, {
                            action: 'CREATE_CLOUD_MONITORING_UPTIME_CHECK',
                            displayName: `CloudPulse SRE Probe (${w.name})`,
                            host:
                              w.uri && w.uri.startsWith('http')
                                ? w.uri
                                : `${projectId}.appspot.com`,
                          })
                        }
                        className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold cursor-pointer disabled:opacity-50"
                      >
                        + Monitor Uptime
                      </button>
                    )}

                    {onNavigateTab && w.studioTab && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab(w.studioTab)}
                        className="px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                      >
                        Open Studio &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 03: CLOUD MONITORING UPTIME CHECKS & P1 ALERT POLICIES
         ==================================================================== */}
      {activePillar === 'UPTIME_AND_ALERT_POLICIES' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Global HTTPS Uptime Check Configs (`monitoring.googleapis.com/v3`) */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>
                    Global HTTPS Uptime Checks (`monitoring.googleapis.com/v3` · {uptimeChecks.length})
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Provisions real 60-second SSL-validated global HTTPS probes across Google Cloud Monitoring POPs.
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() =>
                  handleExecuteSreAction('CREATE_DEFAULT_UPTIME', {
                    action: 'CREATE_CLOUD_MONITORING_UPTIME_CHECK',
                    host: newUptimeHost.trim() || `${projectId}.appspot.com`,
                    path: newUptimePath.trim() || '/',
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'CREATE_DEFAULT_UPTIME'
                    ? 'Provisioning Probe...'
                    : '1-Click Create Global HTTPS Uptime Check'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                value={newUptimeHost}
                onChange={(e) => setNewUptimeHost(e.target.value)}
                placeholder={`${projectId}.appspot.com`}
                className="sm:col-span-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
              />
              <input
                type="text"
                value={newUptimePath}
                onChange={(e) => setNewUptimePath(e.target.value)}
                placeholder="/healthz"
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
              />
            </div>

            {uptimeChecks.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-zinc-500">
                  Zero Cloud Monitoring Uptime Checks configured on `{projectId}`.
                </span>
                <button
                  type="button"
                  disabled={Boolean(actionBusy)}
                  onClick={() =>
                    handleExecuteSreAction('CREATE_UPTIME_EMPTY', {
                      action: 'CREATE_CLOUD_MONITORING_UPTIME_CHECK',
                      host: `${projectId}.appspot.com`,
                      path: '/',
                    })
                  }
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer"
                >
                  Bootstrap Global HTTPS Uptime Check Now
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {uptimeChecks.map((u) => (
                  <div
                    key={u.name}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-extrabold text-zinc-900 dark:text-white">
                        {u.displayName}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Target: https://{u.host}
                        {u.path} (Port {u.port}) · Period: {u.period} · Timeout:{' '}
                        {u.timeout}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomProbeUrl(`https://${u.host}${u.path}`);
                          setActivePillar('BLACKBOX_SYNTHETIC_PROBER');
                          handleRunSyntheticProbe(`https://${u.host}${u.path}`);
                        }}
                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Probe Live
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          handleExecuteSreAction(`DEL_UPTIME_${u.shortId}`, {
                            action: 'DELETE_CLOUD_MONITORING_UPTIME_CHECK',
                            checkName: u.name,
                          })
                        }
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Cloud Monitoring Alerting Policies (`monitoring.googleapis.com/v3`) */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>
                    Cloud Monitoring P1 Alert Policies (`alertPolicies` · {alertPolicies.length})
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Real Google Cloud Monitoring alerting rules watching P1 War-Room cascades &amp; SLO error-budget burn.
                </p>
              </div>
              <button
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() =>
                  handleExecuteSreAction('CREATE_ALERT_POL', {
                    action: 'CREATE_SLO_ALERT_POLICY',
                    displayName:
                      newAlertTitle.trim() ||
                      `CloudPulse SRE P1 Fast-Burn Alert (${projectId})`,
                  })
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'CREATE_ALERT_POL'
                    ? 'Creating Policy...'
                    : '1-Click Create P1 SLO Alert Policy'}
                </span>
              </button>
            </div>

            <input
              type="text"
              value={newAlertTitle}
              onChange={(e) => setNewAlertTitle(e.target.value)}
              placeholder={`CloudPulse SRE P1 Fast-Burn Alert (${projectId})`}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
            />

            {alertPolicies.length === 0 ? (
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-zinc-500">
                  Zero Cloud Monitoring Alert Policies found on `{projectId}`.
                </span>
                <button
                  type="button"
                  disabled={Boolean(actionBusy)}
                  onClick={() =>
                    handleExecuteSreAction('CREATE_ALERT_EMPTY', {
                      action: 'CREATE_SLO_ALERT_POLICY',
                    })
                  }
                  className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer"
                >
                  Arm 14.4x P1 Alert Policy Now
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {alertPolicies.map((ap) => (
                  <div
                    key={ap.name}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-extrabold text-zinc-900 dark:text-white">
                        {ap.displayName}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Condition: {ap.conditionSummary} · Combiner:{' '}
                        {ap.combiner}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          handleExecuteSreAction(`TOGGLE_AP_${ap.shortId}`, {
                            action: 'TOGGLE_ALERT_POLICY',
                            policyName: ap.name,
                            enabled: !ap.enabled,
                          })
                        }
                        className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                          ap.enabled
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-zinc-600 hover:bg-zinc-500 text-white'
                        }`}
                      >
                        {ap.enabled ? 'ENABLED (Mute)' : 'MUTED (Enable)'}
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          handleExecuteSreAction(`DEL_AP_${ap.shortId}`, {
                            action: 'DELETE_ALERT_POLICY',
                            policyName: ap.name,
                          })
                        }
                        className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 04: LIVE MULTI-ENDPOINT BLACKBOX SYNTHETIC PROBER
         ==================================================================== */}
      {activePillar === 'BLACKBOX_SYNTHETIC_PROBER' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>
                  Live Multi-Endpoint Blackbox Synthetic Prober (DNS Lookup + TCP + TLS 1.3 + HTTPS TTFB)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Executes real outbound sockets from the CloudPulse server to measure exact DNS resolution, TLS 1.3 handshake, X.509 certificate expiry, and Time-To-First-Byte across your project endpoints.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={customProbeUrl}
                onChange={(e) => setCustomProbeUrl(e.target.value)}
                placeholder="Optional custom URL (e.g. https://run.googleapis.com)"
                className="w-64 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
              />
              <button
                type="button"
                disabled={syntheticLoading}
                onClick={() => handleRunSyntheticProbe()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {syntheticLoading
                    ? 'Probing Live Endpoints...'
                    : 'Execute Live Blackbox Synthetic Sweep'}
                </span>
              </button>
            </div>
          </div>

          {!syntheticResult ? (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <span className="text-zinc-500">
                Click &ldquo;Execute Live Blackbox Synthetic Sweep&rdquo; to benchmark live DNS, TCP, TLS 1.3, and HTTPS TTFB latency across 5 project &amp; GCP endpoints.
              </span>
              <button
                type="button"
                disabled={syntheticLoading}
                onClick={() => handleRunSyntheticProbe()}
                className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
              >
                Launch 5-Endpoint Synthetic Sweep Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500">
                    Endpoints Reachable
                  </div>
                  <div className="text-base font-extrabold text-emerald-500 mt-0.5">
                    {syntheticResult.reachableCount} /{' '}
                    {syntheticResult.totalCount} Reachable
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500">
                    Average Round-Trip Latency
                  </div>
                  <div className="text-base font-extrabold text-blue-500 mt-0.5">
                    {syntheticResult.avgLatencyMs} ms
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] text-zinc-500">
                    Parallel Sweep Duration
                  </div>
                  <div className="text-base font-extrabold text-blue-500 mt-0.5">
                    {syntheticResult.totalSweepMs} ms
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {(syntheticResult.probes || []).map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            p.reachable
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          HTTP {p.httpStatus} · {p.sliVerdict}
                        </span>
                        <span className="font-extrabold text-zinc-900 dark:text-white">
                          {p.label}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          IP: {p.resolvedIp}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        DNS: <strong>{p.dnsMs}ms</strong> · TLS Handshake:{' '}
                        <strong>{p.tcpTlsMs}ms</strong> · TTFB:{' '}
                        <strong>{p.ttfbMs}ms</strong> · Total:{' '}
                        <strong className="text-blue-500">{p.totalMs}ms</strong>{' '}
                        · Cipher: <code>{p.tlsProtocol} / {p.cipherName}</code>{' '}
                        · Cert Expiry: <strong>{p.certDaysRemaining}d</strong>
                      </div>
                    </div>

                    {uptimeChecks.some((u) => u.host === p.hostname) ? (
                      <button
                        type="button"
                        onClick={() =>
                          setActivePillar('UPTIME_AND_ALERT_POLICIES')
                        }
                        className="px-3 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-extrabold cursor-pointer"
                      >
                        [60s UPTIME CHECK ACTIVE] View Uptime &amp; Alerts &rarr;
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          handleExecuteSreAction(`PROMOTE_UPTIME_${p.id}`, {
                            action: 'CREATE_CLOUD_MONITORING_UPTIME_CHECK',
                            displayName: `CloudPulse SRE Probe (${p.hostname})`,
                            host: p.hostname,
                            path: p.path || '/',
                          })
                        }
                        className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold cursor-pointer disabled:opacity-50"
                      >
                        + Register as 60s Cloud Monitoring Uptime Check
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PILLAR 05: CLOUD LOGGING SLI COUNTER METRICS ARCHITECT
         ==================================================================== */}
      {activePillar === 'LOG_BASED_METRICS_SLI' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>
                  Cloud Logging SLI Counter Metrics Architect (`logging.googleapis.com/v2/projects/{projectId}/metrics`)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Converts raw Cloud Logging streams into low-overhead numeric time-series SLIs (`5xx_errors`, `oom_exit137`, `iam_403_denied`) for multi-window SLO error-budget calculation.
              </p>
            </div>
            <button
              type="button"
              disabled={Boolean(actionBusy)}
              onClick={() =>
                handleExecuteSreAction('BOOT_ALL_SLI', {
                  action: 'BOOTSTRAP_ALL_GOLDEN_SLI_METRICS',
                })
              }
              className={`px-3.5 py-2 rounded-md text-xs font-extrabold cursor-pointer disabled:opacity-50 ${
                allGoldenSlisActive
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {actionBusy === 'BOOT_ALL_SLI'
                ? 'Bootstrapping 3 Golden SLIs...'
                : allGoldenSlisActive
                ? `[3/3 GOLDEN SLIs VERIFIED LIVE] Re-Sync Golden SLIs`
                : '1-Click Bootstrap All 3 Golden SLI Metrics (5xx, OOM-137, IAM-403)'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <input
              type="text"
              value={customMetricName}
              onChange={(e) => setCustomMetricName(e.target.value)}
              placeholder="cloudpulse_sre_custom_sli"
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
            />
            <input
              type="text"
              value={customMetricFilter}
              onChange={(e) => setCustomMetricFilter(e.target.value)}
              placeholder="severity>=ERROR"
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
            />
            <button
              type="button"
              disabled={Boolean(actionBusy)}
              onClick={() =>
                handleExecuteSreAction('CREATE_CUSTOM_SLI', {
                  action: 'CREATE_LOG_BASED_SLI_METRIC',
                  metricName: customMetricName,
                  metricFilter: customMetricFilter,
                })
              }
              className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
            >
              + Create Custom Log-Based SLI Metric
            </button>
          </div>

          {logBasedMetrics.length === 0 ? (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-zinc-500">
                No user-defined Cloud Logging SLI metrics configured yet on `{projectId}`.
              </span>
              <button
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() =>
                  handleExecuteSreAction('BOOT_SLI_EMPTY', {
                    action: 'BOOTSTRAP_ALL_GOLDEN_SLI_METRICS',
                  })
                }
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
              >
                Provision 3 Golden SLI Metrics Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {logBasedMetrics.map((m) => (
                <div
                  key={m.name}
                  className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="space-y-0.5 max-w-md">
                    <div className="font-extrabold text-zinc-900 dark:text-white">
                      {m.name}
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 truncate">
                      Filter: <code>{m.filter}</code>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {m.description}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={Boolean(actionBusy)}
                    onClick={() =>
                      handleExecuteSreAction(`DEL_SLI_${m.name}`, {
                        action: 'DELETE_LOG_BASED_SLI_METRIC',
                        metricName: m.name,
                      })
                    }
                    className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PILLAR 06: CHAOS GAME-DAY LAB & P1 CASCADE STOPWATCH
         ==================================================================== */}
      {activePillar === 'CHAOS_GAME_DAY_LAB' && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span>
                  Live SRE Chaos Game-Day Fault-Injection Lab (`logging.googleapis.com/v2/entries:write`)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Injects real structured failure telemetry into `projects/{projectId}/logs/cloudpulse-sre-war-room` to verify your LogRCA clustering, 14.4x SLO Burn alerting, and 1-click MTTR recovery without harming production data.
              </p>
            </div>
            {warRoomData?.drillActive ? (
              <button
                type="button"
                disabled={Boolean(drillBusy)}
                onClick={() => handleIncidentDrill('RESOLVE_INCIDENT')}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                {drillBusy === 'RESOLVE_INCIDENT'
                  ? 'Mitigating All Drills...'
                  : '1-Click Mitigate & Resolve Active Chaos Drill (Reset SLO Burn)'}
              </button>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-extrabold">
                [ALL DRILLS NOMINAL · 0 ACTIVE FAULTS]
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                id: 'INJECT_CASCADE_DRILL',
                title: 'Scenario 1: P1 Multi-Service Cascade (OOM + 403 + 429)',
                desc: 'Writes 3 correlated CRITICAL/ERROR/WARNING entries across Cloud Run, BigQuery, and Service Usage to trigger a 16.8x P1 Fast-Burn Page.',
                badge: '16.8x P1 BURN',
              },
              {
                id: 'INJECT_OOM_EXIT137_DRILL',
                title: 'Scenario 2: Cloud Run SIGKILL OOM (Exit 137) + 504 Timeout',
                desc: 'Simulates a 512MiB container RSS memory spike terminated by Linux SIGKILL (Exit 137) paired with cold-start 504 gateway timeouts.',
                badge: 'EXIT 137 + 504',
              },
              {
                id: 'INJECT_IAM_403_DRILL',
                title: 'Scenario 3: BigQuery & Secret Manager 403 Permission-Denied',
                desc: 'Simulates an ETL service account losing bigquery.jobs.create and secretmanager.versions.access permissions mid-pipeline.',
                badge: 'IAM 403 BLOCK',
              },
              {
                id: 'INJECT_QUOTA_429_DRILL',
                title: 'Scenario 4: Regional API 429 Resource-Exhausted Storm',
                desc: 'Simulates concurrent BigQuery slot exhaustion and Vertex AI online prediction RPM rate limiting (HTTP 429 / gRPC code 8).',
                badge: 'QUOTA 429 STORM',
              },
            ].map((sc) => (
              <div
                key={sc.id}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                      {sc.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-mono font-bold">
                      {sc.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{sc.desc}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={Boolean(drillBusy)}
                    onClick={() => handleIncidentDrill(sc.id)}
                    className="flex-1 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {drillBusy === sc.id
                      ? 'Injecting Live Telemetry...'
                      : '1-Click Fire Chaos Scenario'}
                  </button>
                  {warRoomData?.drillActive && (
                    <button
                      type="button"
                      disabled={Boolean(drillBusy)}
                      onClick={() => handleIncidentDrill('RESOLVE_INCIDENT')}
                      className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      Resolve Active Drill
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 07: GEMINI 3.8 FLASH & 3.1 PRO SRE INCIDENT COMMANDER
         ==================================================================== */}
      {activePillar === 'GEMINI_SRE_COMMANDER' && (
        <div className="p-4 rounded-xl border border-blue-500/40 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <span>
                  Gemini 3.8 Flash &amp; Gemini 3.1 Pro Autonomous SRE Incident Commander
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Synthesizes live LogRCA clusters, multi-window SLO error-budget burn rates, and production workload saturation into an executable incident response plan.
              </p>
            </div>

            <div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1 text-xs font-mono">
              {[
                { id: 'gemini-3.8-flash', label: 'gemini-3.8-flash (Sub-s)' },
                { id: 'gemini-3.1-pro', label: 'gemini-3.1-pro (Deep RCA)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiModel(m.id)}
                  className={`px-3 py-1 rounded-md font-bold cursor-pointer ${
                    aiModel === m.id
                      ? 'bg-blue-600 text-white'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              'Diagnose top SLO error-budget burn cluster & output exact gcloud hotfix',
              'Generate 5-step P1 OOM Exit 137 & Cold-Start 504 mitigation runbook',
              'Draft executive customer status-page update & blameless postmortem',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAiPrompt(preset);
                  handleRunAiSreCommander(preset);
                }}
                className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-blue-500/20 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ask Gemini 3.8 Flash / 3.1 Pro SRE Commander to analyze a spike or draft a runbook..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-white"
            />
            <button
              type="button"
              disabled={aiCommanderLoading}
              onClick={() => handleRunAiSreCommander()}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
            >
              {aiCommanderLoading
                ? `Synthesizing with ${aiModel}...`
                : `Synthesize Incident Plan (${aiModel})`}
            </button>
          </div>

          {aiCommanderResult ? (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-blue-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-500">
                  Model: {aiCommanderResult.modelUsed} · Latency:{' '}
                  {aiCommanderResult.latencyMs}ms
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      aiCommanderResult.synthesisMarkdown,
                      'AI SRE Briefing'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                >
                  Copy Briefing
                </button>
              </div>
              <pre className="text-xs font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {aiCommanderResult.synthesisMarkdown}
              </pre>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-zinc-500">
                Click any preset above or &ldquo;Synthesize Incident Plan&rdquo; to generate a live Principal SRE briefing with `{aiModel}`.
              </span>
              <button
                type="button"
                disabled={aiCommanderLoading}
                onClick={() =>
                  handleRunAiSreCommander(
                    'Analyze live project SLO posture and output immediate remediation steps'
                  )
                }
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
              >
                Generate Live SRE Briefing Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PILLAR 08: CHANGE-FAILURE CORRELATOR & UNIFIED 50-EVENT TIMELINE
         ==================================================================== */}
      {activePillar === 'CHANGE_CORRELATION_TIMELINE' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>
                  Live Change-Failure Correlator &amp; Unified Event Timeline ({filteredTimeline.length} of {timeline.length} Events)
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Correlates live `cloudaudit.googleapis.com` configuration mutations alongside runtime error logs to isolate change-induced regressions immediately.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'ALL', label: `All (${timeline.length})` },
                {
                  id: 'ERRORS',
                  label: `Active Errors (${
                    timeline.filter((e) => e.effectiveIsTrueError).length
                  })`,
                },
                {
                  id: 'MUTATIONS',
                  label: `Config Changes (${
                    timeline.filter(
                      (e) => e.clusterKey === 'CONFIG_MUTATION_AUDIT_EVENT'
                    ).length
                  })`,
                },
                {
                  id: 'DRILLS',
                  label: `Chaos Drills (${
                    timeline.filter((e) => e.isWarRoomDrill).length
                  })`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTimelineFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold cursor-pointer ${
                    timelineFilter === f.id
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={timelineSearch}
              onChange={(e) => setTimelineSearch(e.target.value)}
              placeholder="Filter timeline by service, method, principal, or error message..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
            />
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredTimeline.map((ev) => (
              <div
                key={ev.id}
                className={`p-2.5 rounded-xl border text-xs font-mono flex flex-wrap items-center justify-between gap-2 ${
                  ev.effectiveIsTrueError
                    ? 'border-red-500/40 bg-red-500/5'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60'
                }`}
              >
                <div className="space-y-0.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.effectiveIsTrueError
                          ? 'bg-red-500/20 text-red-400'
                          : ev.mitigated
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {ev.mitigated ? 'MITIGATED_DRILL' : ev.severity}
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {ev.clusterTitle}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400">
                      {ev.serviceName} · {ev.methodName}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {ev.timestamp}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-300 truncate">
                    [{ev.principal}] {ev.summary}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {onRunInShell && (
                    <button
                      type="button"
                      onClick={() => onRunInShell(ev.hotfixCli)}
                      className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                    >
                      Inspect CLI
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(ev.hotfixCli, 'Event CLI')}
                    className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 09: VPC SERVICE CONTROLS (VPC-SC) & SUBNET PGA ARCHITECT
         ==================================================================== */}
      {activePillar === 'VPCSC_ZERO_EXFIL_ARCHITECT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>VPC-SC Exfiltration Perimeter Architect</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                199.36.153.4/30 Enforced
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'sec-17a4-enclave',
                  label: 'SEC 17a-4 Air-Gapped Enclave',
                  desc: 'Locks Restricted VIP 199.36.153.4/30 + 6 core APIs',
                },
                {
                  id: 'gdpr-eu-boundary',
                  label: 'GDPR EU Sovereign Boundary',
                  desc: 'Prevents cross-project bucket/BQ exfiltration',
                },
                {
                  id: 'hipaa-enclave',
                  label: 'HIPAA PHI Zero-Exfil Enclave',
                  desc: 'Locks Storage, BigQuery, Secret Manager & KMS',
                },
                {
                  id: 'custom',
                  label: 'Custom VPC-SC Perimeter',
                  desc: 'Unlocks individual service selection',
                },
              ].map((bp) => (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => applyPerimeterBlueprint(bp.id)}
                  className={`p-2.5 rounded-md border text-left cursor-pointer transition-all ${
                    perimeterBlueprint === bp.id
                      ? 'bg-emerald-600/15 border-emerald-500 text-zinc-900 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="text-xs font-bold">{bp.label}</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {bp.desc}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Perimeter Name
                </label>
                <input
                  type="text"
                  value={perimeterName}
                  onChange={(e) => setPerimeterName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Google API VIP Routing {!isPerimeterCustom ? '[LOCKED]' : ''}
                </label>
                <select
                  value={vipMode}
                  disabled={!isPerimeterCustom}
                  onChange={(e) => setVipMode(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-60"
                >
                  <option value="RESTRICTED_VIP">
                    restricted.googleapis.com (199.36.153.4/30 — VPC-SC Enforced)
                  </option>
                  <option value="PRIVATE_VIP" disabled={!isPerimeterCustom}>
                    private.googleapis.com (199.36.153.8/30)
                  </option>
                </select>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-emerald-700 dark:text-emerald-300 font-mono text-[10.5px] overflow-x-auto border border-zinc-200 dark:border-zinc-800">
              {vpcScCli}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopy(vpcScCli, 'VPC-SC Perimeter CLI')}
                className="flex-1 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
              >
                Copy VPC-SC Perimeter Spec (`access-context-manager`)
              </button>
              {onRunInShell && (
                <button
                  type="button"
                  onClick={() => onRunInShell(vpcScCli)}
                  className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                >
                  Run in Shell
                </button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-white">
                  Live Regional Subnets — Private Google Access (`privateIpGoogleAccess`)
                </div>
                <div className="text-[11px] font-mono text-zinc-500">
                  Coverage: {vpcScData?.pgaCoveragePct ?? 100}% (
                  {vpcScData?.summary?.pgaEnabledSubnets ?? 0}/
                  {vpcScData?.summary?.totalSubnets ?? 0} subnets hardened)
                </div>
              </div>
              <button
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() =>
                  handleExecuteSreAction('BATCH_PGA_ALL', {
                    action: 'ENFORCE_ALL_SUBNETS_PGA',
                  })
                }
                className={`px-3 py-1.5 rounded-md text-white text-xs font-extrabold cursor-pointer disabled:opacity-50 ${
                  allSubnetsPgaEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 border border-emerald-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {actionBusy === 'BATCH_PGA_ALL'
                  ? 'Enforcing All Subnets...'
                  : allSubnetsPgaEnabled
                    ? `[100% PGA ENFORCED (${vpcScData?.summary?.pgaEnabledSubnets || 0}/${vpcScData?.summary?.totalSubnets || 0} Subnets)] Re-Verify`
                    : '1-Click Enforce PGA on All Subnets'}
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {(vpcScData?.subnets || []).map((sn) => {
                const key = `${sn.region}/${sn.name}`;
                const busy = enablingPgaSubnet === key;
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-center justify-between gap-2"
                  >
                    <div className="text-xs font-mono">
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {sn.name} ({sn.region})
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        VPC: {sn.network} · CIDR: {sn.ipCidrRange}
                      </div>
                    </div>

                    {sn.privateIpGoogleAccess ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        PGA ENABLED
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleEnableSubnetPga(sn.region, sn.name)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold cursor-pointer disabled:opacity-50"
                      >
                        {busy ? 'Enabling...' : '1-Tap Enable PGA'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 10: EVENTARC & PUB/SUB DEAD-LETTER QUEUE (DLQ) STUDIO
         ==================================================================== */}
      {activePillar === 'PUBSUB_DLQ_AUTOPSY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form
            onSubmit={handleProvisionPubsubPair}
            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-red-500" />
                <span>
                  Provision Resilient Pub/Sub Topic + Dead-Letter Queue (`-dlq`)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                Zero-Message-Loss Lock
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'zero-loss-financial',
                  label: 'Financial Ledger Stream',
                  desc: 'Locks Exactly-Once + DLQ (5 retries)',
                },
                {
                  id: 'hipaa-clinical-events',
                  label: 'HIPAA HL7/FHIR Stream',
                  desc: 'Locks Exactly-Once + 60s Ack + DLQ',
                },
                {
                  id: 'custom',
                  label: 'Custom Event Stream',
                  desc: 'Unlocks delivery & retry knobs',
                },
              ].map((bp) => (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => applyDlqBlueprint(bp.id)}
                  className={`p-2 rounded-md border text-left cursor-pointer ${
                    dlqBlueprint === bp.id
                      ? 'bg-red-600/15 border-red-500 text-zinc-900 dark:text-white'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="text-xs font-bold">{bp.label}</div>
                  <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                    {bp.desc}
                  </div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Primary Topic Name (Auto-creates companion `-dlq` topic &amp; `-sub` subscription)
              </label>
              <input
                type="text"
                required
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="sre-incident-events"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Max Delivery Attempts {!isDlqCustom ? '[LOCKED]' : ''}
                </label>
                <input
                  type="number"
                  min={5}
                  max={isDlqCustom ? 100 : 10}
                  disabled={!isDlqCustom}
                  value={maxDeliveryAttempts}
                  onChange={(e) =>
                    setMaxDeliveryAttempts(
                      Math.max(5, Number(e.target.value || 5))
                    )
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Ack Deadline Seconds (`10–600s`)
                </label>
                <input
                  type="number"
                  min={10}
                  max={600}
                  value={ackDeadlineSeconds}
                  onChange={(e) =>
                    setAckDeadlineSeconds(
                      Math.max(10, Math.min(600, Number(e.target.value || 20)))
                    )
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={provisioningPubsub || !topicName.trim()}
              className="w-full py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
            >
              {provisioningPubsub
                ? 'Provisioning Topic + DLQ + Subscription...'
                : '1-Click Provision Topic + Companion Dead-Letter Queue (-dlq)'}
            </button>
          </form>

          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Live Pub/Sub Topics ({pubsubData?.summary?.topicsCount || 0}) &amp; Subscriptions ({pubsubData?.summary?.subscriptionsCount || 0})
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                DLQ Protected: {pubsubData?.summary?.dlqProtectedCount || 0} ·
                Exactly-Once: {pubsubData?.summary?.exactlyOnceCount || 0}
              </span>
            </div>

            {pubsubData?.subscriptions?.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {pubsubData.subscriptions.map((s) => (
                  <div
                    key={s.name}
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {s.shortName} &rarr; Topic: {s.topic}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Ack: {s.ackDeadlineSeconds}s ·{' '}
                        {s.deadLetterTopic
                          ? `DLQ: ${s.deadLetterTopic} (${s.maxDeliveryAttempts} retries)`
                          : 'No Dead-Letter Topic configured'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={Boolean(actionBusy)}
                        onClick={() =>
                          handleExecuteSreAction(`PUB_TEST_${s.topic}`, {
                            action: 'PUBLISH_TEST_PUBSUB_EVENT',
                            topicName: s.topic,
                          })
                        }
                        className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold cursor-pointer"
                      >
                        Publish Test Event
                      </button>
                      {!s.hasDlqProtection && (
                        <button
                          type="button"
                          disabled={Boolean(actionBusy)}
                          onClick={() =>
                            handleExecuteSreAction(`ATTACH_DLQ_${s.shortName}`, {
                              action: 'ATTACH_DLQ_TO_SUBSCRIPTION',
                              subscriptionName: s.shortName,
                            })
                          }
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold cursor-pointer"
                        >
                          1-Click Attach DLQ
                        </button>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.hasDlqProtection
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {s.hasDlqProtection ? 'DLQ SHIELDED' : 'NO DLQ'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <span className="text-zinc-500">
                  No Pub/Sub subscriptions found in `{projectId}`.
                </span>
                <button
                  type="button"
                  disabled={provisioningPubsub}
                  onClick={() => handleProvisionPubsubPair()}
                  className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer"
                >
                  1-Click Bootstrap `sre-incident-events` + `-dlq` Triad
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          PILLAR 11: 1-CLICK AUTONOMOUS SRE TOIL-ELIMINATION & INVARIANT AUDITOR
         ==================================================================== */}
      {activePillar === 'TOIL_AUTOMATION_RUNBOOKS' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  Autonomous SRE Readiness Invariant Auditor &amp; Non-Compliant Reconciler ({compliantSreCount}/{sreReadinessInvariants.length} Compliant)
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Live state-aware verification across all 6 SRE reliability invariants on `{projectId}`. Compliant invariants link directly to their owning pillar instead of repeating duplicate bootstrap buttons.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={Boolean(actionBusy) || Boolean(drillBusy)}
                onClick={handleReconcileAllSreInvariants}
                className={`px-3 py-1.5 rounded-md text-white text-xs font-extrabold cursor-pointer disabled:opacity-50 ${
                  compliantSreCount === sreReadinessInvariants.length
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {actionBusy === 'RECONCILE_ALL_SRE'
                  ? 'Reconciling SRE Invariants...'
                  : compliantSreCount === sreReadinessInvariants.length
                    ? '[6/6 INVARIANTS COMPLIANT] Seal Merkle Readiness Proof'
                    : `1-Click Reconcile ${sreReadinessInvariants.length - compliantSreCount} Non-Compliant Invariant(s)`}
              </button>
              <button
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() =>
                  handleExecuteSreAction('RB_MERKLE_SNAP', {
                    action: 'CAPTURE_SRE_MERKLE_SNAPSHOT',
                  })
                }
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                {actionBusy === 'RB_MERKLE_SNAP'
                  ? 'Sealing Checkpoint...'
                  : 'Seal Cryptographic Merkle Checkpoint'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sreReadinessInvariants.map((inv) => (
              <div
                key={inv.id}
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 ${
                  inv.compliant
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-amber-500/40 bg-amber-500/10'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-400">
                      {inv.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        inv.compliant
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {inv.compliant ? 'COMPLIANT · VERIFIED LIVE' : 'DRIFT / ACTION REQUIRED'}
                    </span>
                  </div>
                  <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
                    {inv.title}
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500">
                    {inv.statusLabel}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!inv.compliant ? (
                    <button
                      type="button"
                      disabled={Boolean(actionBusy) || Boolean(drillBusy)}
                      onClick={inv.onReconcile}
                      className="flex-1 py-1.5 px-2.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      {inv.reconcileLabel}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActivePillar(inv.pillar)}
                      className="flex-1 py-1.5 px-2.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold cursor-pointer"
                    >
                      Inspect Live Resource &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(healthAndSocBridge.sreRunbookReceipts || []).length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="text-xs font-extrabold text-zinc-900 dark:text-white">
                SHA-256 Hash-Chained SRE Runbook Execution Receipts ({healthAndSocBridge.sreRunbookReceipts.length})
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {healthAndSocBridge.sreRunbookReceipts.map((r) => (
                  <div
                    key={r.id}
                    className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <span className="font-bold text-emerald-500 mr-2">
                        [{r.action}]
                      </span>
                      <span className="text-zinc-800 dark:text-zinc-200">
                        {r.details}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400">
                      sha256:{String(r.receiptHash || '').slice(0, 14)} ·{' '}
                      {r.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          PILLAR 12: BIDIRECTIONAL HEALTH & DRIFT + WAVE 16 SOC + GITOPS BRIDGE
         ==================================================================== */}
      {activePillar === 'HEALTH_DRIFT_SOC_BRIDGE' && (
        <div className="p-4 rounded-xl border border-blue-500/40 bg-white dark:bg-zinc-950 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-blue-500" />
                <span>
                  Bidirectional Bridge: SRE War-Room &harr; Health &amp; Drift Merkle Vault &harr; Wave 16 Autonomous Cloud SOC
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Every SRE War-Room control-plane action (Uptime Checks, Alert Policies, SLI Metrics, Subnet PGA, Pub/Sub DLQ) is automatically recorded in the Flight Recorder and exported as declarative Terraform HCL so your Git repository never drifts from live production.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={Boolean(actionBusy)}
                onClick={() =>
                  handleExecuteSreAction('BRIDGE_MERKLE', {
                    action: 'CAPTURE_SRE_MERKLE_SNAPSHOT',
                  })
                }
                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer"
              >
                1-Click Seal Merkle State Snapshot
              </button>

              {onOpenHealthAndDrift && (
                <button
                  type="button"
                  onClick={() => onOpenHealthAndDrift()}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                >
                  Open 1-Tap Health &amp; Drift Hub &rarr;
                </button>
              )}

              {onNavigateTab && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('INNOVATION_LAB', 'TERRAFORM')}
                    className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Open 2026 Innovation Lab (GitOps &amp; Moonshots) &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('SOVEREIGN_STUDIO', 'TIME_MACHINE')}
                    className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Open SHA-256 Time-Machine &amp; Drift Radar &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('CLOUD_SOC')}
                    className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Open Wave 16 Autonomous Cloud SOC &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateTab('AWS_AZURE_PARITY', 'EVENTBRIDGE_PIPES')
                    }
                    className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    AWS &amp; Azure Parity (EventBridge &amp; Route 53) &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateTab(
                        'ALIBABA_HUAWEI_PARITY',
                        'ALIYUN_PTS_MSE_FLASH_SALE_SURGE'
                      )
                    }
                    className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold cursor-pointer"
                  >
                    Alibaba 11.11 Surge &amp; Huawei DataV NOC &rarr;
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-zinc-500">
                Latest Merkle State Digest
              </div>
              <div className="text-xs font-extrabold text-emerald-500 truncate mt-0.5">
                merkle:{String(healthAndSocBridge.merkleLatestSha256 || '').slice(0, 16)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-zinc-500">
                Merkle Vault Checkpoints
              </div>
              <div className="text-base font-extrabold text-blue-500 mt-0.5">
                {healthAndSocBridge.merkleSnapshotsCount || 0} Snapshot(s)
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-zinc-500">
                Session Flight Mutations
              </div>
              <div className="text-base font-extrabold text-blue-500 mt-0.5">
                {healthAndSocBridge.flightMutationsCount || 0} Mutation(s)
              </div>
            </div>
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-zinc-500">
                Wave 16 SOC Receipts
              </div>
              <div className="text-base font-extrabold text-amber-500 mt-0.5">
                {healthAndSocBridge.socForensicReceiptsCount || 0} Signed Receipt(s)
              </div>
            </div>
          </div>

          {healthAndSocBridge.gitOpsBridge?.terraformPatchHcl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                  Live ClickOps-to-GitOps Terraform Patch (`sre_war_room_session.tf`)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      healthAndSocBridge.gitOpsBridge.terraformPatchHcl,
                      'Session Terraform HCL'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                >
                  Copy Terraform .tf Patch
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto max-h-64">
                {healthAndSocBridge.gitOpsBridge.terraformPatchHcl}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
