import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import AwsAzureEnvySuiteStudio from './AwsAzureEnvySuiteStudio';

export default function SreWarRoomPerimeterStudio({
  projectId,
  onTriggerToast,
  onRefreshOverview,
}) {
  const [activeSubTab, setActiveSubTab] = useState('SRE_WAR_ROOM');
  const [copiedText, setCopiedText] = useState('');

  // --- Tab 1: SRE Incident War-Room State ---
  const [warRoomData, setWarRoomData] = useState(null);
  const [loadingWarRoom, setLoadingWarRoom] = useState(false);
  const [drillBusy, setDrillBusy] = useState(false);
  const [showPostmortemPreview, setShowPostmortemPreview] = useState(false);

  // --- Tab 2: VPC-SC Data Exfiltration Perimeter State ---
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

  // --- Tab 3: Pub/Sub & Dead-Letter Queue (DLQ) Studio State ---
  const [pubsubData, setPubsubData] = useState(null);
  const [loadingPubsub, setLoadingPubsub] = useState(false);
  const [dlqBlueprint, setDlqBlueprint] = useState('zero-loss-financial');
  const [topicName, setTopicName] = useState('');
  const [maxDeliveryAttempts, setMaxDeliveryAttempts] = useState(5);
  const [ackDeadlineSeconds, setAckDeadlineSeconds] = useState(30);
  const [exactlyOnce, setExactlyOnce] = useState(true);
  const [retentionDays, setRetentionDays] = useState(7);
  const [provisioningPubsub, setProvisioningPubsub] = useState(false);

  const handleCopy = (text, label = 'command') => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    if (onTriggerToast) onTriggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const fetchWarRoom = useCallback(async () => {
    if (!projectId) return;
    setLoadingWarRoom(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave8/war-room`
      );
      setWarRoomData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to load SRE Incident War-Room'
        );
      }
    } finally {
      setLoadingWarRoom(false);
    }
  }, [projectId, onTriggerToast]);

  const fetchVpcSc = useCallback(async () => {
    if (!projectId) return;
    setLoadingVpcSc(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave8/vpc-sc-perimeter`
      );
      setVpcScData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to inspect VPC Service Controls & Private Google Access'
        );
      }
    } finally {
      setLoadingVpcSc(false);
    }
  }, [projectId, onTriggerToast]);

  const fetchPubsubDlq = useCallback(async () => {
    if (!projectId) return;
    setLoadingPubsub(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave8/pubsub-dlq`
      );
      setPubsubData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to load Pub/Sub & DLQ inventory'
        );
      }
    } finally {
      setLoadingPubsub(false);
    }
  }, [projectId, onTriggerToast]);

  useEffect(() => {
    if (activeSubTab === 'SRE_WAR_ROOM') fetchWarRoom();
    if (activeSubTab === 'VPCSC_PERIMETER') fetchVpcSc();
    if (activeSubTab === 'PUBSUB_DLQ') fetchPubsubDlq();
  }, [activeSubTab, fetchWarRoom, fetchVpcSc, fetchPubsubDlq]);

  const handleToggleIncidentDrill = async (action) => {
    setDrillBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave8/war-room/incident-drill`,
        { action }
      );
      if (onTriggerToast) onTriggerToast(res.data?.message || 'Drill updated');
      await fetchWarRoom();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(err.response?.data?.error || 'Drill action failed');
      }
    } finally {
      setDrillBusy(false);
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
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message || `Enabled Private Google Access on ${subnetName}`
        );
      }
      await fetchVpcSc();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to enable Private Google Access on subnet'
        );
      }
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
    e.preventDefault();
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
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message || 'Provisioned Pub/Sub Topic + DLQ Pair'
        );
      }
      setTopicName('');
      await fetchPubsubDlq();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to provision Pub/Sub Topic + DLQ Pair'
        );
      }
    } finally {
      setProvisioningPubsub(false);
    }
  };

  const isPerimeterCustom = perimeterBlueprint === 'custom';
  const isDlqCustom = dlqBlueprint === 'custom';
  const slo = warRoomData?.sloBurnRadar;

  const vpcScCli = `gcloud access-context-manager perimeters create ${perimeterName} \\
  --title="${perimeterName}" \\
  --resources="projects/${projectId}" \\
  --restricted-services="${restrictedServices.join(',')}" \\
  --enable-vpc-accessible-services \\
  --vpc-allowed-services="RESTRICTED-SERVICES"`;

  return (
    <div className="space-y-5">
      {/* Top Hero Header */}
      <div className="rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-[11px] font-mono">
              <Flame className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                WAVE-8 PRINCIPAL SRE WAR-ROOM, VPC-SC EXFILTRATION SHIELD & PUB/SUB DLQ STUDIO
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Autonomous Incident War-Room, Multi-Window SLO Burn Radar & VPC-SC Perimeter Architect
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Correlates live `logging.googleapis.com/v2` stack traces & IAM-403s into root-cause clusters, calculates Google SRE Book `14.4x` 1-Hour / `6.0x` 6-Hour Error-Budget Burn Rates, hardens subnets with Private Google Access (`199.36.153.4/30`), and provisions Exactly-Once Pub/Sub Dead-Letter Queues.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeSubTab === 'SRE_WAR_ROOM') fetchWarRoom();
              if (activeSubTab === 'VPCSC_PERIMETER') fetchVpcSc();
              if (activeSubTab === 'PUBSUB_DLQ') fetchPubsubDlq();
            }}
            title="Sync live Cloud Logging, Subnet Private Google Access, and Pub/Sub Dead-Letter telemetry"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingWarRoom || loadingVpcSc || loadingPubsub
                  ? 'animate-spin text-zinc-500 dark:text-zinc-400'
                  : ''
              }`}
            />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          {[
            {
              id: 'SRE_WAR_ROOM',
              label: '1. Autonomous SRE War-Room & SLO Burn Radar',
              badge:
                slo?.alertStatus === 'P1_PAGE_FAST_BURN'
                  ? `${slo.fastBurn1h}x P1 BURN`
                  : `${slo?.budgetRemainingPct ?? 100}% Budget`,
              tip: 'Correlate live Cloud Logging entries into root-cause clusters, monitor 1h/6h Google SRE Error-Budget Burn Rate, and export blameless postmortems',
            },
            {
              id: 'VPCSC_PERIMETER',
              label: '2. VPC Service Controls (VPC-SC) & Private Google Access',
              badge: vpcScData
                ? `${vpcScData.pgaCoveragePct}% PGA`
                : 'Zero-Exfil',
              tip: 'Prevent stolen OAuth tokens or compromised VMs from exfiltrating Cloud Storage & BigQuery data to external GCP projects',
            },
            {
              id: 'PUBSUB_DLQ',
              label: '3. Pub/Sub Exactly-Once & Dead-Letter Queue (DLQ) Studio',
              badge: pubsubData
                ? `${pubsubData.summary?.topicsCount || 0} Topics`
                : 'Event Mesh',
              tip: 'Inspect and provision resilient Pub/Sub topics with mandatory Dead-Letter Queue (-dlq) topics and Exactly-Once delivery',
            },
            {
              id: 'AWS_AZURE_PARITY',
              label: 'AWS & Azure Parity',
              badge: '16-in-1 Bridge',
              tip: 'AWS & Azure Enterprise Parity Suite: Azure Resource Groups + RBAC + 1-Click Teardown, Hard-Spend Fuse, Global HTTPS LB, CloudFormation/ARM Drift, SSM Fleet, GuardDuty/Sentinel SOAR & 16 Multi-Cloud Bridges',
            },
          ].map((tab) => {
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                title={tab.tip}
                onClick={() => setActiveSubTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer border ${
                  active
                    ? 'bg-red-600 text-white border-red-400 shadow-md'
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active
                      ? 'bg-black/30 text-red-100'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          TAB 1: AUTONOMOUS SRE INCIDENT WAR-ROOM & SLO BURN RADAR
         ===================================================================== */}
      {activeSubTab === 'SRE_WAR_ROOM' && (
        <div className="space-y-4">
          {/* Multi-Window SLO Error-Budget Burn Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]">
              <div className="text-[11px] font-mono text-zinc-500">
                30-Day SLO Error Budget (`99.9%`)
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  (slo?.budgetRemainingPct ?? 100) >= 75
                    ? 'text-emerald-500'
                    : 'text-amber-500'
                }`}
              >
                {slo ? `${slo.budgetRemainingPct}%` : '...'}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                {slo?.budgetMinutesRemaining ?? 43.2}m / 43.2m remaining
              </div>
            </div>

            <div
              className={`p-3.5 rounded-[10px] border ${
                (slo?.fastBurn1h ?? 0) >= 14.4
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]'
              }`}
            >
              <div className="text-[11px] font-mono text-zinc-500">
                1-Hour Fast-Burn Rate (`14.4x` Page Cap)
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  (slo?.fastBurn1h ?? 0) >= 14.4
                    ? 'text-red-500'
                    : 'text-emerald-500'
                }`}
              >
                {slo ? `${slo.fastBurn1h}x` : '0.0x'}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                {slo?.fastBurn1h >= 14.4
                  ? 'P1 PAGE: Exhausts monthly budget in 50h!'
                  : '✓ Below 14.4x P1 paging threshold'}
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]">
              <div className="text-[11px] font-mono text-zinc-500">
                6-Hour Slow-Burn Rate (`6.0x` Ticket Cap)
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  (slo?.slowBurn6h ?? 0) >= 6.0
                    ? 'text-amber-500'
                    : 'text-blue-400'
                }`}
              >
                {slo ? `${slo.slowBurn6h}x` : '0.0x'}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Multi-window sustained burn rate
              </div>
            </div>

            {/* Incident Drill & Postmortem Trigger */}
            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] flex flex-col justify-between gap-2">
              <div className="text-[11px] font-mono text-zinc-500">
                Chaos Cascade Drill & Postmortem
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {!warRoomData?.drillActive ? (
                  <button
                    type="button"
                    disabled={drillBusy}
                    onClick={() =>
                      handleToggleIncidentDrill('INJECT_CASCADE_DRILL')
                    }
                    title="Simulate a correlated P1 Multi-Service Cascade Incident (Cloud Run Exit 137 OOM + BigQuery 403 + 16.8x Fast Error-Budget Burn)"
                    className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Inject P1 Cascade Drill
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={drillBusy}
                    onClick={() =>
                      handleToggleIncidentDrill('RESOLVE_INCIDENT')
                    }
                    title="Mitigate active P1 cascade drill and restore SLO burn rate to nominal"
                    className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                  >
                    Mitigate & Resolve P1
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowPostmortemPreview((p) => !p)}
                  title="Preview and copy auto-synthesized Google SRE Blameless Postmortem Markdown"
                  className="px-2.5 py-1.5 rounded-[8px] border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-mono cursor-pointer"
                >
                  Postmortem
                </button>
              </div>
            </div>
          </div>

          {/* Blameless Postmortem Markdown Drawer */}
          {showPostmortemPreview && warRoomData?.postmortemMarkdown && (
            <div className="p-4 rounded-[10px] border border-blue-500/40 bg-zinc-950 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-blue-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>Auto-Synthesized Google SRE Blameless Postmortem (`postmortem.md`)</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      warRoomData.postmortemMarkdown,
                      'Blameless Postmortem Markdown'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                >
                  Copy Postmortem.md
                </button>
              </div>
              <pre className="text-[11px] font-mono text-zinc-200 whitespace-pre-wrap bg-zinc-900/90 p-3 rounded-[8px] border border-zinc-800 max-h-60 overflow-y-auto">
                {warRoomData.postmortemMarkdown}
              </pre>
            </div>
          )}

          {/* Correlated LogRCA Root-Cause Clusters */}
          <div className="space-y-2.5">
            <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
              Correlated Cloud Logging Root-Cause Signatures ({warRoomData?.clusters?.length || 0} Clusters)
            </div>
            {(warRoomData?.clusters || []).map((c) => {
              const isCrit =
                c.severity === 'CRITICAL' || c.severity === 'ERROR';
              return (
                <div
                  key={c.clusterKey}
                  className={`p-3.5 rounded-[10px] border space-y-2 ${
                    isCrit
                      ? 'border-red-500/40 bg-red-950/10'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          isCrit
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {c.severity} · {c.count} Events
                      </span>
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        {c.clusterTitle}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        Services: {c.affectedServices?.join(', ')}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(c.hotfixCli, 'Hotfix CLI')}
                      title="Copy recommended SRE mitigation command"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-zinc-900 text-zinc-100 border border-zinc-700 text-[11px] font-mono cursor-pointer hover:bg-zinc-800"
                    >
                      {copiedText === c.hotfixCli ? (
                        <Check className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      ) : (
                        <Terminal className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      )}
                      <span>Copy 1-Tap Hotfix CLI</span>
                    </button>
                  </div>

                  <div className="text-xs font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900/80 p-2 rounded border border-zinc-200 dark:border-zinc-800">
                    {c.sampleSummary}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: VPC SERVICE CONTROLS (VPC-SC) & PRIVATE GOOGLE ACCESS ARCHITECT
         ===================================================================== */}
      {activeSubTab === 'VPCSC_PERIMETER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: VPC-SC Perimeter Synthesizer with Strict Compliance Locks */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>VPC-SC Exfiltration Perimeter Architect</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                Compliance Enforcement Active
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
                  className={`p-2.5 rounded-[8px] border text-left cursor-pointer transition-all ${
                    perimeterBlueprint === bp.id
                      ? 'bg-emerald-600/15 border-emerald-500 text-zinc-900 dark:text-zinc-100'
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
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
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
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="RESTRICTED_VIP">
                    restricted.googleapis.com (199.36.153.4/30 — VPC-SC Enforced)
                  </option>
                  <option value="PRIVATE_VIP" disabled={!isPerimeterCustom}>
                    private.googleapis.com (199.36.153.8/30 — Allows Non-VPC-SC APIs)
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-zinc-500">
                Restricted Data-Plane APIs Shielded Inside Perimeter{' '}
                {!isPerimeterCustom ? '(Locked by Compliance)' : ''}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  'storage.googleapis.com',
                  'bigquery.googleapis.com',
                  'secretmanager.googleapis.com',
                  'cloudkms.googleapis.com',
                  'aiplatform.googleapis.com',
                  'run.googleapis.com',
                ].map((svc) => {
                  const checked = restrictedServices.includes(svc);
                  return (
                    <label
                      key={svc}
                      className={`flex items-center gap-2 p-2 rounded border text-xs font-mono ${
                        !isPerimeterCustom
                          ? 'opacity-75 cursor-not-allowed border-emerald-500/30 bg-emerald-500/5 text-zinc-800 dark:text-zinc-200'
                          : 'cursor-pointer border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!isPerimeterCustom}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRestrictedServices((prev) => [...prev, svc]);
                          } else {
                            setRestrictedServices((prev) =>
                              prev.filter((s) => s !== svc)
                            );
                          }
                        }}
                      />
                      <span className="truncate">
                        {!isPerimeterCustom ? '[LOCKED] ' : ''}
                        {svc}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-2.5 rounded-[8px] bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto">
              {vpcScCli}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(vpcScCli, 'VPC-SC Perimeter CLI')}
              className="w-full py-2 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
            >
              Copy VPC Service Controls Perimeter Spec (`access-context-manager`)
            </button>
          </div>

          {/* Right: Live Subnet Private Google Access Auditor & 1-Tap Enabler */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Live Regional Subnets — Private Google Access (`privateIpGoogleAccess`)
                </div>
                <div className="text-[11px] font-mono text-zinc-500">
                  Coverage: {vpcScData?.pgaCoveragePct ?? 0}% ({vpcScData?.summary?.pgaEnabledSubnets ?? 0}/{vpcScData?.summary?.totalSubnets ?? 0} subnets hardened)
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-mono font-bold">
                Score: {vpcScData?.exfiltrationScore ?? 100}/100
              </span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {(vpcScData?.subnets || []).map((sn) => {
                const key = `${sn.region}/${sn.name}`;
                const busy = enablingPgaSubnet === key;
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-center justify-between gap-2"
                  >
                    <div className="text-xs font-mono">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {sn.name} ({sn.region})
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        VPC: {sn.network} · CIDR: {sn.ipCidrRange}
                      </div>
                    </div>

                    {sn.privateIpGoogleAccess ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                        ✓ PGA ENABLED
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleEnableSubnetPga(sn.region, sn.name)}
                        title={`Enable Private Google Access on subnet ${sn.name} in ${sn.region} via POST /subnetworks/${sn.name}/setPrivateIpGoogleAccess`}
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

      {/* =====================================================================
          TAB 3: EVENTARC & PUB/SUB DEAD-LETTER QUEUE (DLQ) AUTOPSY STUDIO
         ===================================================================== */}
      {activeSubTab === 'PUBSUB_DLQ' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Resilient Topic + DLQ Pair Provisioner with Strict Compliance Locks */}
          <form
            onSubmit={handleProvisionPubsubPair}
            className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Provision Resilient Pub/Sub Topic + Dead-Letter Queue (`-dlq`)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
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
                  className={`p-2 rounded-[8px] border text-left cursor-pointer ${
                    dlqBlueprint === bp.id
                      ? 'bg-red-600/15 border-red-500 text-zinc-900 dark:text-zinc-100'
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
                Primary Topic Name (Auto-creates companion `-dlq` topic & `-sub` subscription)
              </label>
              <input
                type="text"
                required
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="orders-settlement-events"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Max Delivery Attempts Before DLQ {!isDlqCustom ? '[LOCKED]' : ''}
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
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60"
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
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <label
              className={`flex items-center gap-2 p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold ${
                !isDlqCustom ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={exactlyOnce}
                disabled={!isDlqCustom}
                onChange={(e) => setExactlyOnce(e.target.checked)}
              />
              <span>
                Enable Pub/Sub Exactly-Once Delivery (`enableExactlyOnceDelivery: true`){' '}
                {!isDlqCustom ? '— Enforced by Blueprint' : ''}
              </span>
            </label>

            <button
              type="submit"
              disabled={provisioningPubsub || !topicName.trim()}
              className="w-full py-2 rounded-[8px] bg-red-600 hover:bg-red-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {provisioningPubsub
                ? 'Provisioning Topic + DLQ + Subscription...'
                : 'Provision Topic + Companion Dead-Letter Queue (-dlq)'}
            </button>
          </form>

          {/* Right: Live Pub/Sub Topics & Subscriptions DLQ Posture */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live Pub/Sub Topics ({pubsubData?.summary?.topicsCount || 0}) & Subscriptions ({pubsubData?.summary?.subscriptionsCount || 0})
              </div>
              <span className="text-[10px] font-mono text-emerald-400">
                DLQ Protected: {pubsubData?.summary?.dlqProtectedCount || 0} · Exactly-Once: {pubsubData?.summary?.exactlyOnceCount || 0}
              </span>
            </div>

            {pubsubData?.subscriptions?.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {pubsubData.subscriptions.map((s) => (
                  <div
                    key={s.name}
                    className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {s.shortName} → Topic: {s.topic}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Ack: {s.ackDeadlineSeconds}s ·{' '}
                        {s.deadLetterTopic
                          ? `DLQ: ${s.deadLetterTopic} (${s.maxDeliveryAttempts} retries)`
                          : 'No Dead-Letter Topic configured'}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.hasDlqProtection
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {s.hasDlqProtection ? 'DLQ SHIELDED' : 'NO DLQ'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-zinc-500 py-6 text-center">
                No Pub/Sub subscriptions found in `{projectId}`. Use the form on the left to provision a Topic + Dead-Letter Queue (`-dlq`) + Subscription triad in 1 tap!
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'AWS_AZURE_PARITY' && (
        <AwsAzureEnvySuiteStudio
          projectId={projectId}
          initialTab="RESOURCE_GROUPS"
          onShowToast={onTriggerToast}
        />
      )}
    </div>
  );
}
