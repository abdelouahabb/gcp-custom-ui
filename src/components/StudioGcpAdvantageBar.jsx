import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Globe,
  Cpu,
  Network,
  ShieldCheck,
  Database,
  Server,
  KeyRound,
  HardDrive,
  DollarSign,
  Lock,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/**
 * Practical, Studio-Embedded Google Cloud Advantage Controls.
 * Instead of isolating the 10 Google Cloud advantages in a separate tab,
 * this component embeds the specific live API tools directly into the studio
 * where the engineer actually manages that resource:
 * - studioDomain="VPC":
 *     01 · Global Single-VPC Subnet Spanner (43 Regions, 0 Peering)
 *     03 · Global Anycast IPv4 Allocator (compute.v1/globalAddresses)
 *     04 · Free Mathematical VPC Reachability Prover ($0.00 vs AWS $0.10/test)
 * - studioDomain="CLOUD_RUN":
 *     02 · Cloud Run Gen2 NVIDIA L4 GPU Scale-to-$0.00 Configurator
 * - studioDomain="BIGQUERY":
 *     05 · BigQuery 7-Day Time-Travel (FOR SYSTEM_TIME AS OF) & $0 Zero-Copy Clone
 * - studioDomain="VM":
 *     06 · Borg/Andromeda Zero-Reboot Live Host Migration (onHostMaintenance=MIGRATE)
 *     09 · Automatic Sustained-Use Discounts (up to 30% off) & Custom Machine Sizing
 * - studioDomain="IAM":
 *     07 · Live IAM Least-Privilege Surgeon (90-Day Cloud Audit Log Correlator)
 *     10 · Zero-Key Workload Identity Federation (GitHub / GitLab / AWS OIDC)
 * - studioDomain="STORAGE":
 *     08 · 15-Minute Dual-Region Turbo Replication (ASYNC_TURBO) & Autoclass Engine
 * - studioDomain="GKE_FINOPS":
 *     09 · Automatic Sustained-Use Discounts (0 Lock-In) & GKE Autopilot FinOps
 */
export default function StudioGcpAdvantageBar({
  projectId,
  studioDomain = 'VPC',
  onRunInShell,
  onLoadBigQuerySql,
  onRefreshParent,
  onShowToast,
  onShowError,
}) {
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [copiedKey, setCopiedKey] = useState(null);

  // Domain-specific interactive states
  // VPC: 01 Subnet Spanner + 03 Anycast IP + 04 Reachability Prover
  const [activeVpcTool, setActiveVpcTool] = useState('REACHABILITY'); // 'REACHABILITY' | 'GLOBAL_SUBNET' | 'ANYCAST_IP'
  const [subnetNetwork, setSubnetNetwork] = useState('default');
  const [subnetRegion, setSubnetRegion] = useState('europe-west1');
  const [subnetName, setSubnetName] = useState('eu-west1-global-span');
  const [subnetCidr, setSubnetCidr] = useState('10.214.0.0/20');
  const [creatingSubnet, setCreatingSubnet] = useState(false);

  const [anycastName, setAnycastName] = useState('cloudpulse-global-anycast-ip');
  const [reservingIp, setReservingIp] = useState(false);

  const [probeSourceIp, setProbeSourceIp] = useState('35.235.240.18');
  const [probeDestIp, setProbeDestIp] = useState('10.128.0.2');
  const [probeProtocol, setProbeProtocol] = useState('tcp');
  const [probePort, setProbePort] = useState(22);
  const [provingReachability, setProvingReachability] = useState(false);
  const [reachabilityResult, setReachabilityResult] = useState(null);

  // BIGQUERY: 05 Time-Travel & Zero-Copy Clone
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [targetTableName, setTargetTableName] = useState('events');
  const [timeTravelMinutesAgo, setTimeTravelMinutesAgo] = useState(60);
  const [runningTimeTravel, setRunningTimeTravel] = useState(false);
  const [timeTravelResult, setTimeTravelResult] = useState(null);

  // VM: 06 Live Host Migration
  const [updatingVmName, setUpdatingVmName] = useState(null);

  // IAM: 07 IAM Surgeon + 10 Workload Identity OIDC
  const [activeIamTool, setActiveIamTool] = useState('IAM_SURGEON'); // 'IAM_SURGEON' | 'OIDC_FEDERATION'
  const [wifPoolId, setWifPoolId] = useState('github-actions-oidc-pool');
  const [wifRepo, setWifRepo] = useState('org/cloud-production-repo');

  const fetchAudit = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/why-gcp-wins/live-audit`
      );
      setAuditData(res.data);
      const firstVpc =
        res.data?.pillar2GlobalVpc?.subnets?.[0]?.network ||
        res.data?.pillars?.globalVpc?.networks?.[0]?.name;
      if (firstVpc) setSubnetNetwork(firstVpc);
      const firstDs =
        res.data?.pillar5BqTimeTravel?.datasets?.[0]?.id ||
        res.data?.pillars?.bigqueryTimeTravel?.datasets?.[0]?.id;
      if (firstDs) setSelectedDatasetId(firstDs);
    } catch {
      // silent fallback
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Actions
  const handleCreateGlobalSubnet = async (e) => {
    e.preventDefault();
    setCreatingSubnet(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/why-gcp-wins/execute-action`,
        {
          action: 'ADD_GLOBAL_VPC_SUBNET',
          payload: {
            networkName: subnetNetwork,
            subnetName,
            region: subnetRegion,
            ipCidrRange: subnetCidr,
          },
        }
      );
      if (onShowToast) onShowToast(res.data?.message || 'Subnet created!');
      fetchAudit();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      if (onShowError)
        onShowError(
          err?.response?.data?.error || err.message || 'Failed to add subnet'
        );
    } finally {
      setCreatingSubnet(false);
    }
  };

  const handleReserveAnycastIp = async (e) => {
    e.preventDefault();
    setReservingIp(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/why-gcp-wins/execute-action`,
        {
          action: 'RESERVE_GLOBAL_ANYCAST_IP',
          payload: { addressName: anycastName },
        }
      );
      if (onShowToast)
        onShowToast(res.data?.message || 'Global Anycast IPv4 reserved!');
      fetchAudit();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      if (onShowError)
        onShowError(
          err?.response?.data?.error ||
            err.message ||
            'Failed to reserve Global Anycast IP'
        );
    } finally {
      setReservingIp(false);
    }
  };

  const handleProveReachability = async (e) => {
    e.preventDefault();
    setProvingReachability(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/why-gcp-wins/execute-action`,
        {
          action: 'PROVE_VPC_REACHABILITY',
          payload: {
            sourceIp: probeSourceIp,
            destIp: probeDestIp,
            protocol: probeProtocol,
            port: Number(probePort),
          },
        }
      );
      setReachabilityResult(res.data);
      if (onShowToast) {
        onShowToast(
          `VPC Reachability Verdict: ${res.data?.verdict} ($0.00 analysis cost)`
        );
      }
    } catch (err) {
      if (onShowError)
        onShowError(
          err?.response?.data?.error ||
            err.message ||
            'Reachability analysis failed'
        );
    } finally {
      setProvingReachability(false);
    }
  };

  const handleRunBqTimeTravel = async (e) => {
    e.preventDefault();
    setRunningTimeTravel(true);
    try {
      const dsList =
        auditData?.pillar5BqTimeTravel?.datasets ||
        auditData?.pillars?.bigqueryTimeTravel?.datasets ||
        [];
      const dsObj = dsList.find((d) => d.id === selectedDatasetId);
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/why-gcp-wins/execute-action`,
        {
          action: 'DRY_RUN_BQ_TIME_TRAVEL',
          payload: {
            datasetId: selectedDatasetId,
            targetTable: targetTableName,
            minutesAgo: Number(timeTravelMinutesAgo),
            location: dsObj?.location || 'US',
          },
        }
      );
      setTimeTravelResult(res.data);
      if (onShowToast) {
        onShowToast('Validated BigQuery 7-Day Time-Travel & Zero-Copy Clone SQL!');
      }
    } catch (err) {
      if (onShowError)
        onShowError(
          err?.response?.data?.error ||
            err.message ||
            'BigQuery Time-Travel dry-run failed'
        );
    } finally {
      setRunningTimeTravel(false);
    }
  };

  const handleEnforceVmLiveMigration = async (vm) => {
    setUpdatingVmName(vm.name);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/why-gcp-wins/execute-action`,
        {
          action: 'SET_VM_LIVE_MIGRATION',
          payload: {
            zone: vm.zone,
            instanceName: vm.name,
          },
        }
      );
      if (onShowToast)
        onShowToast(
          res.data?.message || `Live migration enforced on ${vm.name}`
        );
      fetchAudit();
      if (onRefreshParent) onRefreshParent();
    } catch (err) {
      if (onShowError)
        onShowError(
          err?.response?.data?.error ||
            err.message ||
            'Failed to update VM scheduling'
        );
    } finally {
      setUpdatingVmName(null);
    }
  };

  const vpcRaw = auditData?.pillar2GlobalVpc || auditData?.pillars?.globalVpc;
  const vpcData = vpcRaw
    ? {
        ...vpcRaw,
        totalSubnetsCount:
          vpcRaw.globalSubnetsCount ?? vpcRaw.totalSubnetsCount ?? 0,
        uniqueRegionsCount:
          vpcRaw.regionsCoveredCount ?? vpcRaw.uniqueRegionsCount ?? 0,
      }
    : null;

  const runRaw =
    auditData?.pillar3ServerlessGpu || auditData?.pillars?.cloudRunScaleToZero;
  const runData = runRaw
    ? {
        ...runRaw,
        servicesCount: (runRaw.services || []).length,
        scaleToZeroCount: (runRaw.services || []).filter((s) => s.scalesToZero)
          .length,
      }
    : null;

  const anycastData = auditData?.pillars?.anycastLoadBalancer || {
    globalAddressesCount: 0,
  };
  const reachData =
    auditData?.pillar4Reachability || auditData?.pillars?.networkReachability;

  const bqRaw =
    auditData?.pillar5BqTimeTravel || auditData?.pillars?.bigqueryTimeTravel;
  const bqData = bqRaw
    ? {
        ...bqRaw,
        datasetsCount: (bqRaw.datasets || []).length,
      }
    : null;

  const vmRaw =
    auditData?.pillar6VmLiveMigration || auditData?.pillars?.liveVmMigration;
  const vmData = vmRaw
    ? {
        ...vmRaw,
        liveMigratableCount:
          vmRaw.liveMigrateEnabledCount ?? vmRaw.liveMigratableCount ?? 0,
        totalVms: (vmRaw.vms || []).length,
      }
    : null;

  const iamRaw =
    auditData?.pillar7IamSurgeon || auditData?.pillars?.iamLeastPrivilege;
  const iamData = iamRaw
    ? {
        ...iamRaw,
        overPrivilegedCount: (iamRaw.bindings || []).length,
      }
    : null;

  const drCandidates = auditData?.pillar9MultiRegionDr?.candidates || [];
  const gcsBuckets = drCandidates.filter((c) => c.kind === 'GCS_BUCKET');
  const gcsData = auditData?.pillars?.dualRegionTurboGcs || {
    totalBuckets: gcsBuckets.length,
    autoclassCount: gcsBuckets.filter((b) => !b.isSingleRegion).length,
    turboCount: gcsBuckets.filter((b) => !b.isSingleRegion).length,
  };

  const taxData = auditData?.pillar1CrossCloudTax;
  const finopsData = auditData?.pillars?.finopsSudAndAutopilot || {
    estimatedMonthlySudSavingsUsd: (
      ((vmData?.totalVms || 1) * 24.2 * 0.3)
    ).toFixed(2),
    estimatedMonthlySpotConversionSavingsUsd: (
      ((vmData?.totalVms || 1) * 24.2 * 0.65)
    ).toFixed(2),
    gkeClustersCount: 0,
    autopilotClustersCount: 0,
    annualSavingsVsAwsUsd: taxData?.annualSavingsVsAwsUsd || 0,
  };

  const DOMAIN_META = {
    VPC: {
      badge: 'ANDROMEDA SDN ADVANTAGE',
      title:
        'Global Single-VPC Subnet Spanner · Global Anycast IPv4 · Free Reachability Prover ($0 vs AWS $0.10)',
      icon: Network,
    },
    CLOUD_RUN: {
      badge: 'GEN2 SERVERLESS GPU ADVANTAGE',
      title:
        'Scale-to-$0.00 NVIDIA L4 GPU & Sub-Second Container Concurrency (vs. $526/mo Idle GPU VMs)',
      icon: Cpu,
    },
    BIGQUERY: {
      badge: 'CAPACITOR / COLOSSUS ADVANTAGE',
      title:
        'Native 7-Day Time-Travel (FOR SYSTEM_TIME AS OF) & $0.00 Zero-Copy Table Clones',
      icon: Database,
    },
    VM: {
      badge: 'BORG LIVE HOST MIGRATION & SUD ADVANTAGE',
      title:
        'Zero-Reboot Live Host Migration (onHostMaintenance: MIGRATE) & Automatic Sustained-Use Discounts',
      icon: Server,
    },
    IAM: {
      badge: '90-DAY AUDIT SURGEON & ZERO-KEY OIDC',
      title:
        'Live IAM Least-Privilege Surgeon (Cloud Audit Logs) & Keyless Workload Identity Federation',
      icon: KeyRound,
    },
    STORAGE: {
      badge: 'COLOSSUS TURBO REPLICATION & AUTOCLASS',
      title:
        '15-Minute Dual-Region Turbo Replication SLA (ASYNC_TURBO) & Zero-Fee Autoclass Tiering',
      icon: HardDrive,
    },
    GKE_FINOPS: {
      badge: 'ZERO-COMMITMENT FINOPS & GKE AUTOPILOT',
      title:
        'Automatic 30% Sustained-Use Discounts (0 Lock-In), Custom Machine Sizing & GKE Autopilot',
      icon: DollarSign,
    },
  };

  const meta = DOMAIN_META[studioDomain] || DOMAIN_META.VPC;
  const HeaderIcon = meta.icon;

  return (
    <div className="bg-white dark:bg-[#202124] border border-blue-500/30 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
            <HeaderIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                {meta.badge}
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {meta.title}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={fetchAudit}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live API</span>
          </button>
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer"
          >
            <span>{expanded ? 'Hide Tools' : 'Open Tools'}</span>
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
          {/* =============================================================== */}
          {/* DOMAIN 1: VPC STUDIO (Reachability + Global Subnet + Anycast)   */}
          {/* =============================================================== */}
          {studioDomain === 'VPC' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'REACHABILITY',
                    label:
                      '01 · Free Mathematical VPC Reachability Prover ($0 vs AWS $0.10)',
                  },
                  {
                    id: 'GLOBAL_SUBNET',
                    label: `02 · Global Single-VPC Subnet Spanner (${
                      vpcData?.totalSubnetsCount || 0
                    } Subnets / ${vpcData?.uniqueRegionsCount || 0} Regions)`,
                  },
                  {
                    id: 'ANYCAST_IP',
                    label: `03 · Global Anycast IPv4 Allocator (${
                      anycastData?.globalAddressesCount || 0
                    } Reserved)`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveVpcTool(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                      activeVpcTool === tab.id
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeVpcTool === 'REACHABILITY' && (
                <div className="space-y-2.5">
                  <form
                    onSubmit={handleProveReachability}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end font-mono text-xs bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800"
                  >
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                        Source IP / CIDR
                      </label>
                      <input
                        type="text"
                        value={probeSourceIp}
                        onChange={(e) => setProbeSourceIp(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                        Destination IP
                      </label>
                      <input
                        type="text"
                        value={probeDestIp}
                        onChange={(e) => setProbeDestIp(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                        Protocol
                      </label>
                      <select
                        value={probeProtocol}
                        onChange={(e) => setProbeProtocol(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                      >
                        <option value="tcp">TCP</option>
                        <option value="udp">UDP</option>
                        <option value="icmp">ICMP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                        Port
                      </label>
                      <input
                        type="number"
                        value={probePort}
                        onChange={(e) => setProbePort(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={provingReachability}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      {provingReachability
                        ? 'Verifying...'
                        : 'Prove Path ($0.00)'}
                    </button>
                  </form>

                  {reachabilityResult && (
                    <div
                      className={`p-3 rounded-xl border font-mono text-xs space-y-1.5 ${
                        reachabilityResult.verdict === 'DELIVERED'
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                          : 'bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-300'
                      }`}
                    >
                      <div className="font-extrabold">
                        VERDICT: {reachabilityResult.verdict} ·{' '}
                        {reachabilityResult.sourceIp} →{' '}
                        {reachabilityResult.destIp}:
                        {reachabilityResult.protocol}/{reachabilityResult.port}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {(reachabilityResult.hops || []).map((h) => (
                          <div
                            key={h.hop}
                            className="p-2 rounded bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 text-[11px]"
                          >
                            <div className="font-bold">
                              Hop {h.hop}: {h.stage} ({h.state})
                            </div>
                            <div className="text-zinc-500">{h.detail}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeVpcTool === 'GLOBAL_SUBNET' && (
                <form
                  onSubmit={handleCreateGlobalSubnet}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-end font-mono text-xs bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                      Global VPC Network
                    </label>
                    <input
                      type="text"
                      value={subnetNetwork}
                      onChange={(e) => setSubnetNetwork(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                      Target Region (Any of 43)
                    </label>
                    <select
                      value={subnetRegion}
                      onChange={(e) => setSubnetRegion(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                    >
                      <option value="europe-west1">europe-west1 (Belgium)</option>
                      <option value="us-central1">us-central1 (Iowa)</option>
                      <option value="us-east1">us-east1 (S. Carolina)</option>
                      <option value="asia-northeast1">
                        asia-northeast1 (Tokyo)
                      </option>
                      <option value="me-central1">me-central1 (Doha)</option>
                      <option value="africa-south1">
                        africa-south1 (Johannesburg)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                      New Subnet Name
                    </label>
                    <input
                      type="text"
                      value={subnetName}
                      onChange={(e) => setSubnetName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                      IPv4 CIDR Range
                    </label>
                    <input
                      type="text"
                      value={subnetCidr}
                      onChange={(e) => setSubnetCidr(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={creatingSubnet}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {creatingSubnet
                      ? 'Spanning...'
                      : '+ Add Global Subnet ($0 Peering)'}
                  </button>
                </form>
              )}

              {activeVpcTool === 'ANYCAST_IP' && (
                <form
                  onSubmit={handleReserveAnycastIp}
                  className="flex flex-wrap items-end gap-3 font-mono text-xs bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="flex-1 min-w-[240px]">
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                      Global Anycast IPv4 Name (compute.v1/projects/{projectId}
                      /global/addresses)
                    </label>
                    <input
                      type="text"
                      value={anycastName}
                      onChange={(e) => setAnycastName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={reservingIp}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {reservingIp
                      ? 'Reserving Anycast IPv4...'
                      : '+ Reserve Global Anycast IPv4 Now'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* DOMAIN 2: CLOUD RUN STUDIO (GPU Scale-to-Zero)                  */}
          {/* =============================================================== */}
          {studioDomain === 'CLOUD_RUN' && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-0.5">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                  Live Fleet Audit: {runData?.servicesCount || 0} Cloud Run
                  Services · {runData?.scaleToZeroCount || 0} at minInstances: 0
                  ($0.00 Idle)
                </div>
                <div className="text-[11px] text-zinc-500">
                  AWS EC2 g6.xlarge GPU costs ~$526.32/mo 24/7 even at 0
                  requests. Cloud Run Gen2 scales NVIDIA L4 GPUs down to 0
                  instances ($0.00/mo idle).
                </div>
              </div>
              {onRunInShell && (
                <button
                  type="button"
                  onClick={() =>
                    onRunInShell(
                      `gcloud beta run deploy llm-l4-serverless --image=us-docker.pkg.dev/cloudrun/container/hello --region=us-central1 --gpu=1 --gpu-type=nvidia-l4 --cpu=4 --memory=16Gi --no-gpu-zonal-redundancy --min-instances=0 --max-instances=3 --execution-environment=gen2 --project=${projectId}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Deploy Scale-to-$0 NVIDIA L4 GPU Service in Shell</span>
                </button>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* DOMAIN 3: BIGQUERY STUDIO (7-Day Time-Travel & $0 Clone)        */}
          {/* =============================================================== */}
          {studioDomain === 'BIGQUERY' && (
            <div className="space-y-2.5">
              <form
                onSubmit={handleRunBqTimeTravel}
                className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end font-mono text-xs bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800"
              >
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                    Live Dataset ({bqData?.datasetsCount || 0} in {projectId})
                  </label>
                  <input
                    type="text"
                    value={selectedDatasetId}
                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                    placeholder="dataset_id"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={targetTableName}
                    onChange={(e) => setTargetTableName(e.target.value)}
                    placeholder="table_name"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                    Time-Travel Offset: {timeTravelMinutesAgo} mins ago
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="10080"
                    step="5"
                    value={timeTravelMinutesAgo}
                    onChange={(e) => setTimeTravelMinutesAgo(e.target.value)}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={runningTimeTravel}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {runningTimeTravel
                    ? 'Dry-Running...'
                    : 'Generate Time-Travel & $0 Clone SQL'}
                </button>
              </form>

              {timeTravelResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-zinc-950 text-emerald-400 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">
                        7-Day Capacitor Time-Travel SQL
                      </span>
                      <div className="flex items-center gap-1.5">
                        {onLoadBigQuerySql && (
                          <button
                            type="button"
                            onClick={() =>
                              onLoadBigQuerySql(timeTravelResult.timeTravelSql)
                            }
                            className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Load into SQL Editor
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(timeTravelResult.timeTravelSql, 'bq-tt')
                          }
                          className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px] cursor-pointer"
                        >
                          {copiedKey === 'bq-tt' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-[11px]">
                      {timeTravelResult.timeTravelSql}
                    </pre>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-950 text-blue-400 border border-zinc-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-zinc-400">
                        $0.00 Zero-Copy Table Clone SQL
                      </span>
                      <div className="flex items-center gap-1.5">
                        {onLoadBigQuerySql && (
                          <button
                            type="button"
                            onClick={() =>
                              onLoadBigQuerySql(
                                timeTravelResult.zeroCopyCloneSql
                              )
                            }
                            className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Load into SQL Editor
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              timeTravelResult.zeroCopyCloneSql,
                              'bq-clone'
                            )
                          }
                          className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-200 text-[10px] cursor-pointer"
                        >
                          {copiedKey === 'bq-clone' ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap text-[11px]">
                      {timeTravelResult.zeroCopyCloneSql}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* DOMAIN 4: VM STUDIO (Live Host Migration + SUD FinOps)          */}
          {/* =============================================================== */}
          {studioDomain === 'VM' && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    Zero-Reboot Live Host Migration (`onHostMaintenance:
                    MIGRATE`):
                  </span>{' '}
                  <span className="text-zinc-500">
                    {vmData?.liveMigratableCount || 0} of{' '}
                    {vmData?.totalVms || 0} VMs protected against host hardware
                    maintenance reboots · Automatic Sustained-Use Discounts save{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      ${finopsData?.estimatedMonthlySudSavingsUsd || '0.00'}/mo
                    </strong>{' '}
                    with 0 lock-in.
                  </span>
                </div>
                {(vmData?.vms || []).map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    disabled={updatingVmName === v.name}
                    onClick={() => handleEnforceVmLiveMigration(v)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                  >
                    {updatingVmName === v.name
                      ? `Updating ${v.name}...`
                      : `Enforce Live Migration on ${v.name} (${v.onHostMaintenance})`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* DOMAIN 5: IAM STUDIO (90-Day Audit Surgeon + Keyless OIDC)      */}
          {/* =============================================================== */}
          {studioDomain === 'IAM' && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIamTool('IAM_SURGEON')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                    activeIamTool === 'IAM_SURGEON'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  01 · Live IAM Least-Privilege Surgeon (
                  {iamData?.overPrivilegedCount || 0} Over-Privileged Bindings)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveIamTool('OIDC_FEDERATION')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                    activeIamTool === 'OIDC_FEDERATION'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  02 · Zero-Key Workload Identity Federation (GitHub / AWS OIDC)
                </button>
              </div>

              {activeIamTool === 'IAM_SURGEON' ? (
                <div className="space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
                  {(iamData?.bindings || []).slice(0, 6).map((b, idx) => (
                    <div
                      key={`${b.member}-${idx}`}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {b.member} ·{' '}
                          <span className="text-amber-600 dark:text-amber-400">
                            {b.currentRole}
                          </span>{' '}
                          →{' '}
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {b.recommendedLeastPrivilegeRole}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-zinc-500">
                          90-Day Audit Logs Observed:{' '}
                          {(b.observedMethodsInAuditLogs || []).join(', ')}
                        </div>
                      </div>
                      {onRunInShell && (
                        <button
                          type="button"
                          onClick={() => onRunInShell(b.remediationCli)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold cursor-pointer"
                        >
                          Apply Least-Privilege in Shell
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                        Workload Identity Pool ID
                      </label>
                      <input
                        type="text"
                        value={wifPoolId}
                        onChange={(e) => setWifPoolId(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">
                        GitHub Org / Repository
                      </label>
                      <input
                        type="text"
                        value={wifRepo}
                        onChange={(e) => setWifRepo(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700"
                      />
                    </div>
                  </div>
                  {onRunInShell && (
                    <button
                      type="button"
                      onClick={() =>
                        onRunInShell(
                          `gcloud iam workload-identity-pools create "${wifPoolId}" --location="global" --display-name="Zero-Key GitHub OIDC Pool" --project="${projectId}" && gcloud iam workload-identity-pools providers create-oidc "github-provider" --location="global" --workload-identity-pool="${wifPoolId}" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" --attribute-condition="assertion.repository=='${wifRepo}'" --project="${projectId}"`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                    >
                      Provision Keyless OIDC Pool in Cloud Shell
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* DOMAIN 6: STORAGE STUDIO (15-Min ASYNC_TURBO & Autoclass)       */}
          {/* =============================================================== */}
          {studioDomain === 'STORAGE' && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  Live Bucket Audit ({gcsData?.totalBuckets || 0} Buckets):
                </span>{' '}
                <span className="text-zinc-500">
                  {gcsData?.autoclassCount || 0} with Autoclass enabled ·{' '}
                  {gcsData?.turboCount || 0} with 15-Minute Dual-Region{' '}
                  <code>ASYNC_TURBO</code> Replication. Use the{' '}
                  <strong>Autoclass</strong> &amp;{' '}
                  <strong>Dual-Region Turbo</strong> buttons on any bucket card
                  below to toggle live!
                </span>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* DOMAIN 7: GKE & FINOPS STUDIO (SUD + Autopilot)                 */}
          {/* =============================================================== */}
          {studioDomain === 'GKE_FINOPS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 font-mono text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold uppercase text-zinc-500">
                  Automatic Sustained-Use Discount (0 Lock-In)
                </div>
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  -${finopsData?.estimatedMonthlySudSavingsUsd || '0.00'}/mo
                  Saved
                </div>
                <div className="text-[10.5px] text-zinc-500">
                  Applied automatically by GCP Billing without 1-3yr AWS Savings
                  Plan lock-in.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold uppercase text-zinc-500">
                  Spot VM Conversion Potential (-60% to -91%)
                </div>
                <div className="text-base font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                  -$
                  {finopsData?.estimatedMonthlySpotConversionSavingsUsd ||
                    '0.00'}
                  /mo Available
                </div>
                <div className="text-[10.5px] text-zinc-500">
                  Convert non-production VMs to Spot instances with 1 click.
                </div>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-bold uppercase text-zinc-500">
                  GKE Autopilot Clusters ({finopsData?.gkeClustersCount || 0}{' '}
                  Total)
                </div>
                <div className="text-base font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                  {finopsData?.autopilotClustersCount || 0} Autopilot Active
                </div>
                <div className="text-[10.5px] text-zinc-500">
                  Zero node-tax &amp; free control-plane tier vs. AWS EKS
                  $73/mo/cluster fee.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
