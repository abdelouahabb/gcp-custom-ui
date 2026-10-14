import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FolderKanban,
  Flame,
  ShieldCheck,
  Link2,
  Globe,
  RefreshCw,
  Plus,
  Trash2,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Copy,
  ExternalLink,
  Terminal,
  Lock,
  Sparkles,
  Play,
  UserCheck,
  Layers,
} from 'lucide-react';

export default function AwsAzureEnvySuiteStudio({
  projectId,
  onShowToast,
  onShowError,
}) {
  const [activeSubTab, setActiveSubTab] = useState('RESOURCE_GROUPS');
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState('');
  const [data, setData] = useState(null);

  // Module 1: Azure-Style Resource Groups state
  const [newRgSlug, setNewRgSlug] = useState('');
  const [newRgDesc, setNewRgDesc] = useState('');
  const [newRgEnv, setNewRgEnv] = useState('dev');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [deletingGroupSlugs, setDeletingGroupSlugs] = useState({});
  const [hibernatingGroupSlugs, setHibernatingGroupSlugs] = useState({});
  const [cascadeDeleteGcp, setCascadeDeleteGcp] = useState(false);

  // Module 2: Hard-Spend Stop-Loss Fuse state
  const [fuseBudgetUsd, setFuseBudgetUsd] = useState(50);
  const [fuseSoftPct, setFuseSoftPct] = useState(80);
  const [fuseParkPct, setFuseParkPct] = useState(95);
  const [fuseHardPct, setFuseHardPct] = useState(100);
  const [autoCapRun, setAutoCapRun] = useState(true);
  const [autoStopVms, setAutoStopVms] = useState(true);

  // Module 3: AWS IAM Policy Simulator state
  const [selectedPrincipalKey, setSelectedPrincipalKey] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [impersonatingBannerPrincipal, setImpersonatingBannerPrincipal] =
    useState('');

  // Module 4: Azure SAS / AWS S3 Presigned URL & Browser Upload state
  const [selectedBucket, setSelectedBucket] = useState('');
  const [bucketObjects, setBucketObjects] = useState([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [uploadObjectName, setUploadObjectName] = useState('demo-artifact.txt');
  const [uploadTextContent, setUploadTextContent] = useState(
    'Hello from CloudPulse 2026 Browser Upload & SAS Presigned Studio!'
  );
  const [uploadBase64, setUploadBase64] = useState(null);
  const [uploadContentType, setUploadContentType] = useState(
    'text/plain; charset=utf-8'
  );
  const [sasDurationSec, setSasDurationSec] = useState(3600);
  const [sasMethod, setSasMethod] = useState('GET');
  const [generatedSasResult, setGeneratedSasResult] = useState(null);

  // Module 5: 1-Screen Global HTTPS Load Balancer Wizard state
  const [lbStackName, setLbStackName] = useState('cloudpulse-global-edge');
  const [lbDomainName, setLbDomainName] = useState('api.example.com');
  const [lbTargetRunService, setLbTargetRunService] = useState('');
  const [lbTargetRegion, setLbTargetRegion] = useState('us-central1');
  const [lbEnableArmor, setLbEnableArmor] = useState(true);
  const [lbRateLimitRpm, setLbRateLimitRpm] = useState(600);
  const [lbReceipt, setLbReceipt] = useState(null);

  const fetchOverview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/overview`
      );
      const payload = res.data;
      setData(payload);

      if (payload?.spendFuse) {
        setFuseBudgetUsd(payload.spendFuse.monthlyBudgetUsd ?? 50);
        setFuseSoftPct(payload.spendFuse.softBrakePct ?? 80);
        setFuseParkPct(payload.spendFuse.parkComputePct ?? 95);
        setFuseHardPct(payload.spendFuse.hardFusePct ?? 100);
        setAutoCapRun(Boolean(payload.spendFuse.autoCapCloudRunMaxInstances));
        setAutoStopVms(Boolean(payload.spendFuse.autoStopRunningVms));
      }

      const principals = payload?.iamSimulator?.principals || [];
      if (principals.length > 0 && !selectedPrincipalKey) {
        setSelectedPrincipalKey(principals[0].memberKey);
      }

      const buckets = payload?.storageStudio?.buckets || [];
      if (buckets.length > 0 && !selectedBucket) {
        setSelectedBucket(buckets[0].name);
      }

      const runServices = (payload?.unifiedResources || []).filter(
        (r) => r.type === 'CLOUD_RUN'
      );
      if (runServices.length > 0 && !lbTargetRunService) {
        setLbTargetRunService(runServices[0].name);
        setLbTargetRegion(runServices[0].location || 'us-central1');
      }
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to load AWS & Azure Parity Suite.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    projectId,
    selectedPrincipalKey,
    selectedBucket,
    lbTargetRunService,
    onShowError,
  ]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Fetch bucket objects when selectedBucket changes
  const fetchBucketObjects = useCallback(
    async (bucketName) => {
      if (!projectId || !bucketName) return;
      setLoadingObjects(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
          {
            action: 'LIST_BUCKET_OBJECTS',
            bucket: bucketName,
          }
        );
        setBucketObjects(res.data?.objects || []);
      } catch {
        setBucketObjects([]);
      } finally {
        setLoadingObjects(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (selectedBucket && activeSubTab === 'SAS_PRESIGNED') {
      fetchBucketObjects(selectedBucket);
    }
  }, [selectedBucket, activeSubTab, fetchBucketObjects]);

  const toggleMemberSelection = (resId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(resId) ? prev.filter((x) => x !== resId) : [...prev, resId]
    );
  };

  // Module 1 handlers
  const handleUpsertResourceGroup = async (e) => {
    e?.preventDefault();
    if (!newRgSlug.trim()) return;
    setActionBusy('UPSERT_RG');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'UPSERT_RESOURCE_GROUP',
          slug: newRgSlug.trim(),
          displayName: newRgSlug.trim(),
          description: newRgDesc.trim(),
          environment: newRgEnv,
          memberIds: selectedMemberIds,
        }
      );
      onShowToast?.(res.data?.message || 'Resource Group saved!');
      setNewRgSlug('');
      setNewRgDesc('');
      setSelectedMemberIds([]);
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to save Resource Group.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleHibernateGroup = async (grp) => {
    const memberIds = (grp.members || []).map((m) => m.id);
    setHibernatingGroupSlugs((prev) => ({ ...prev, [grp.slug]: true }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'HIBERNATE_RESOURCE_GROUP',
          slug: grp.slug,
          memberIds,
        }
      );
      onShowToast?.(res.data?.message || `Hibernated ${grp.slug}`);
      await fetchOverview();
    } catch (err) {
      if (err?.message === 'ACTION_CANCELLED_BY_USER') return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to hibernate Resource Group.'
      );
    } finally {
      setHibernatingGroupSlugs((prev) => ({ ...prev, [grp.slug]: false }));
    }
  };

  const handleDeleteGroup = async (grp, deleteUnderlying) => {
    const memberIds = (grp.members || []).map((m) => m.id);
    setDeletingGroupSlugs((prev) => ({ ...prev, [grp.slug]: true }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'DELETE_RESOURCE_GROUP',
          slug: grp.slug,
          deleteGcpResources: Boolean(deleteUnderlying),
          memberIds,
        }
      );
      onShowToast?.(res.data?.message || `Deleted Resource Group ${grp.slug}`);
      await fetchOverview();
    } catch (err) {
      setDeletingGroupSlugs((prev) => ({ ...prev, [grp.slug]: false }));
      if (err?.message === 'ACTION_CANCELLED_BY_USER') return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to delete Resource Group.'
      );
    }
  };

  // Module 2 handlers
  const handleSaveSpendFuse = async () => {
    setActionBusy('SAVE_FUSE');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'SAVE_SPEND_FUSE_CONFIG',
          enabled: true,
          monthlyBudgetUsd: Number(fuseBudgetUsd),
          softBrakePct: Number(fuseSoftPct),
          parkComputePct: Number(fuseParkPct),
          hardFusePct: Number(fuseHardPct),
          autoCapCloudRunMaxInstances: autoCapRun,
          autoStopRunningVms: autoStopVms,
        }
      );
      onShowToast?.(res.data?.message || 'Hard-Spend Fuse armed!');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Failed to save Spend Fuse.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleExecuteSpendFuse = async (fuseLevel) => {
    setActionBusy(`FUSE_${fuseLevel}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'EXECUTE_SPEND_FUSE',
          fuseLevel,
        }
      );
      onShowToast?.(res.data?.message || `Executed ${fuseLevel}`);
      await fetchOverview();
    } catch (err) {
      if (err?.message === 'ACTION_CANCELLED_BY_USER') return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to execute Spend Fuse action.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 3 handlers
  const handleRunIamSimulation = useCallback(
    async (principalKeyToTest) => {
      const targetKey = principalKeyToTest || selectedPrincipalKey;
      if (!targetKey) return;
      setActionBusy('IAM_SIM');
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
          {
            action: 'SIMULATE_IAM_POLICY',
            memberKey: targetKey,
          }
        );
        setSimResult(res.data);
      } catch (err) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            'Failed to run IAM Policy Simulator.'
        );
      } finally {
        setActionBusy('');
      }
    },
    [projectId, selectedPrincipalKey, onShowError]
  );

  useEffect(() => {
    if (activeSubTab === 'IAM_SIMULATOR' && selectedPrincipalKey && !simResult) {
      handleRunIamSimulation(selectedPrincipalKey);
    }
  }, [activeSubTab, selectedPrincipalKey, simResult, handleRunIamSimulation]);

  const handleGrantMissingRole = async (role) => {
    if (!selectedPrincipalKey || !role) return;
    setActionBusy(`GRANT_${role}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'GRANT_SIMULATOR_ROLE',
          memberKey: selectedPrincipalKey,
          role,
        }
      );
      onShowToast?.(res.data?.message || `Granted ${role}`);
      await handleRunIamSimulation(selectedPrincipalKey);
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Failed to grant IAM role.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 4 handlers
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadObjectName(file.name);
    setUploadContentType(file.type || 'application/octet-stream');
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = String(reader.result || '');
      const base64Part = resultStr.includes(',')
        ? resultStr.split(',')[1]
        : resultStr;
      setUploadBase64(base64Part);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadObject = async (e) => {
    e?.preventDefault();
    if (!selectedBucket || !uploadObjectName.trim()) return;
    setActionBusy('UPLOAD_OBJ');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'UPLOAD_BUCKET_OBJECT',
          bucket: selectedBucket,
          objectName: uploadObjectName.trim(),
          contentType: uploadContentType,
          base64Data: uploadBase64 || undefined,
          textContent: uploadBase64 ? undefined : uploadTextContent,
        }
      );
      onShowToast?.(res.data?.message || 'Uploaded object to Cloud Storage!');
      setUploadBase64(null);
      await fetchBucketObjects(selectedBucket);
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to upload object to Cloud Storage.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleGeneratePresignedUrl = async (objectName) => {
    if (!selectedBucket || !objectName) return;
    setActionBusy(`SAS_${objectName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'GENERATE_PRESIGNED_URL',
          bucket: selectedBucket,
          objectName,
          method: sasMethod,
          durationSec: Number(sasDurationSec),
        }
      );
      setGeneratedSasResult(res.data);
      onShowToast?.(res.data?.message || 'Generated Presigned / SAS URL!');
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to generate Presigned URL.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 5 handlers
  const handleProvisionGlobalLb = async (e) => {
    e?.preventDefault();
    setActionBusy('PROVISION_LB');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'PROVISION_GLOBAL_LB_STACK',
          stackName: lbStackName,
          domainName: lbDomainName,
          targetRegion: lbTargetRegion,
          targetCloudRunService: lbTargetRunService,
          enableCloudArmor: lbEnableArmor,
          rateLimitRpm: Number(lbRateLimitRpm),
        }
      );
      setLbReceipt(res.data);
      onShowToast?.(res.data?.message || 'Provisioned Global HTTPS Load Balancer!');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to run Global Load Balancer Wizard.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const copyText = (txt, label = 'Copied to clipboard!') => {
    navigator.clipboard?.writeText(txt);
    onShowToast?.(label);
  };

  const unifiedResources = data?.unifiedResources || [];
  const resourceGroups = data?.resourceGroups || [];
  const spendFuse = data?.spendFuse || {};
  const principals = data?.iamSimulator?.principals || [];
  const buckets = data?.storageStudio?.buckets || [];
  const cloudRunServices = unifiedResources.filter(
    (r) => r.type === 'CLOUD_RUN'
  );

  return (
    <div className="space-y-6">
      {/* Active Switch-Role Impersonation Banner (if enabled in Tab 3) */}
      {impersonatingBannerPrincipal && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-extrabold text-amber-600 dark:text-amber-300">
              🎭 AWS-STYLE SWITCH ROLE PREVIEW ACTIVE:
            </span>
            <span className="text-zinc-800 dark:text-zinc-200 font-bold">
              {impersonatingBannerPrincipal}
            </span>
            <span className="text-[11px] text-zinc-500">
              (Evaluating permissions & blast radius as this identity)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setImpersonatingBannerPrincipal('')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
          >
            Exit Switch-Role View
          </button>
        </div>
      )}

      {/* Studio Header Card */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                INNOVATION #39 · AWS &amp; AZURE DREAM FEATURES FOR GOOGLE CLOUD
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
              AWS &amp; Azure Parity Super-Studio for Google Cloud
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-4xl">
              The 5 iconic cloud workflows engineers love in{' '}
              <strong>Microsoft Azure</strong> and <strong>Amazon Web Services</strong>{' '}
              that standard Google Cloud Console lacks: logical{' '}
              <strong>Azure Resource Groups</strong> with 1-click group teardown,{' '}
              <strong>Automated Hard-Spend Stop-Loss Fuses</strong>, an interactive{' '}
              <strong>AWS IAM Policy Simulator &amp; Switch-Role Preview</strong>,{' '}
              <strong>1-Click Azure SAS / S3 Presigned Share Links</strong>, and a{' '}
              <strong>1-Screen Global HTTPS Load Balancer + Cloud Armor Wizard</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Sync Live Project</span>
          </button>
        </div>

        {/* 5 Sub-Studio Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {[
            {
              id: 'RESOURCE_GROUPS',
              label: '📦 1. Azure Resource Groups & Bulk Tagger',
              badge: `${resourceGroups.length} Groups`,
              icon: FolderKanban,
            },
            {
              id: 'SPEND_FUSE',
              label: '🛑 2. Hard-Spend Stop-Loss Fuse',
              badge: `$${spendFuse.monthlyBudgetUsd || 50}/mo Cap`,
              icon: Flame,
            },
            {
              id: 'IAM_SIMULATOR',
              label: '🕵️‍♂️ 3. AWS IAM Policy Simulator & Switch Role',
              badge: `${principals.length} Identities`,
              icon: ShieldCheck,
            },
            {
              id: 'SAS_PRESIGNED',
              label: '🔗 4. Azure SAS / S3 Presigned URLs & Upload',
              badge: `${buckets.length} Buckets`,
              icon: Link2,
            },
            {
              id: 'GLOBAL_LB_WIZARD',
              label: '🌐 5. 1-Screen Global Load Balancer & WAF',
              badge: '7-in-1 Wizard',
              icon: Globe,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100 shadow-sm'
                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    active
                      ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
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
          MODULE 1: AZURE-STYLE RESOURCE GROUPS & BULK LABEL TAGGER
         ===================================================================== */}
      {activeSubTab === 'RESOURCE_GROUPS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Existing Resource Groups */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-emerald-500" />
                    <span>
                      Active Azure-Style Resource Groups (`labels.resource_group`)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Group related VMs, Cloud Run services, GCS Buckets, BigQuery
                    Datasets &amp; Secrets into a single folder with per-group{' '}
                    <code>$/mo</code> burn, 1-click hibernation, and 1-click
                    cascade teardown.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cascadeDeleteGcp}
                    onChange={(e) => setCascadeDeleteGcp(e.target.checked)}
                    className="rounded accent-rose-600"
                  />
                  <span>Cascade-delete underlying GCP resources on teardown</span>
                </label>
              </div>

              <div className="space-y-3">
                {resourceGroups.map((grp) => {
                  const isDeleting = Boolean(deletingGroupSlugs[grp.slug]);
                  const isHibernating = Boolean(hibernatingGroupSlugs[grp.slug]);
                  return (
                    <div
                      key={grp.slug}
                      className={`rounded-xl border p-4 transition-all ${
                        isDeleting
                          ? 'opacity-50 bg-zinc-100/70 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-800 pointer-events-none select-none'
                          : 'bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-sm font-extrabold text-zinc-900 dark:text-zinc-100 ${
                                isDeleting ? 'line-through' : ''
                              }`}
                            >
                              📁 {grp.displayName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              {grp.environment}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              ${grp.totalMonthlyUsd.toFixed(2)}/mo ·{' '}
                              {grp.memberCount} resource(s)
                            </span>
                            {isDeleting && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse">
                                ⏳ DELETING GROUP...
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs text-zinc-500 mt-1 ${
                              isDeleting ? 'line-through' : ''
                            }`}
                          >
                            {grp.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isDeleting || isHibernating}
                            onClick={() => handleHibernateGroup(grp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 cursor-pointer"
                          >
                            <Moon className="w-3.5 h-3.5" />
                            <span>
                              {isHibernating ? 'Parking...' : 'Hibernate Group'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() =>
                              handleDeleteGroup(grp, cascadeDeleteGcp)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {isDeleting
                                ? '⏳ DELETING...'
                                : cascadeDeleteGcp
                                ? 'Teardown Group + Resources'
                                : 'Remove Group'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Member chips */}
                      <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-wrap gap-1.5">
                        {grp.members?.length > 0 ? (
                          grp.members.map((m) => (
                            <span
                              key={m.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 ${
                                isDeleting ? 'line-through opacity-60' : ''
                              }`}
                            >
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                [{m.typeBadge}]
                              </span>
                              <span>{m.name}</span>
                              <span className="text-[10px] text-zinc-400">
                                ({m.location})
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-400">
                            No resources assigned yet — select resources on the
                            right and assign them to{' '}
                            <code>{grp.displayName}</code>.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Create / Assign Resources to Resource Group */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleUpsertResourceGroup}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Create / Update Resource Group &amp; Bulk-Tag GCP Labels</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Resource Group Name (Slug)
                  </label>
                  <input
                    type="text"
                    value={newRgSlug}
                    onChange={(e) => setNewRgSlug(e.target.value)}
                    placeholder="e.g. rg-rag-workshop or rg-ai-tutorial-lab"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Environment
                  </label>
                  <select
                    value={newRgEnv}
                    onChange={(e) => setNewRgEnv(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="dev">dev / tutorial</option>
                    <option value="staging">staging</option>
                    <option value="prod">production</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={newRgDesc}
                  onChange={(e) => setNewRgDesc(e.target.value)}
                  placeholder="e.g. All Cloud Run + GCS + BigQuery resources for Friday's GDE demo"
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-zinc-500">
                    Select Project Resources to Group ({selectedMemberIds.length}{' '}
                    selected)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMemberIds(
                        selectedMemberIds.length === unifiedResources.length
                          ? []
                          : unifiedResources.map((r) => r.id)
                      )
                    }
                    className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 underline cursor-pointer"
                  >
                    {selectedMemberIds.length === unifiedResources.length
                      ? 'Clear All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                  {unifiedResources.length === 0 ? (
                    <div className="p-4 text-xs font-mono text-zinc-400">
                      No live resources detected yet in {projectId}.
                    </div>
                  ) : (
                    unifiedResources.map((resItem) => {
                      const checked = selectedMemberIds.includes(resItem.id);
                      return (
                        <label
                          key={resItem.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-mono hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMemberSelection(resItem.id)}
                              className="rounded accent-emerald-600"
                            />
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                              {resItem.typeBadge}
                            </span>
                            <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                              {resItem.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {resItem.location} · $
                            {Number(resItem.estMonthlyUsd || 0).toFixed(2)}/mo
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={actionBusy === 'UPSERT_RG' || !newRgSlug.trim()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm cursor-pointer"
              >
                {actionBusy === 'UPSERT_RG'
                  ? 'Syncing Resource Group & GCP Labels...'
                  : '💾 Save Resource Group & Sync GCP resource_group Labels'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 2: HARD-SPEND STOP-LOSS FUSE (AWS BUDGETS ACTIONS / AZURE AUTO-SHUTDOWN)
         ===================================================================== */}
      {activeSubTab === 'SPEND_FUSE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>
                      Automated Hard-Spend Stop-Loss Fuse (Beyond Email-Only GCP
                      Budgets)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    In standard Google Cloud, Budget Alerts{' '}
                    <strong>only send emails</strong> while runaway loops or
                    forgotten GPUs keep billing. Here you arm{' '}
                    <strong>AWS Budgets Actions / Azure Auto-Shutdown</strong>{' '}
                    stop-loss fuses that automatically throttle or park compute.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  Live Burn: $
                  {Number(spendFuse.currentEstimatedMonthlyUsd || 0).toFixed(2)}
                  /mo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Monthly Hard Cap ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={fuseBudgetUsd}
                    onChange={(e) => setFuseBudgetUsd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-amber-500 mb-1">
                    Stage 1 Soft Brake (%)
                  </label>
                  <input
                    type="number"
                    value={fuseSoftPct}
                    onChange={(e) => setFuseSoftPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-orange-500 mb-1">
                    Stage 2 Compute Park (%)
                  </label>
                  <input
                    type="number"
                    value={fuseParkPct}
                    onChange={(e) => setFuseParkPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-rose-500 mb-1">
                    Stage 3 Hard Fuse (%)
                  </label>
                  <input
                    type="number"
                    value={fuseHardPct}
                    onChange={(e) => setFuseHardPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCapRun}
                    onChange={(e) => setAutoCapRun(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>
                    Auto-cap Cloud Run <code>minInstances=0, maxInstances=3</code>{' '}
                    at Stage 1 ({fuseSoftPct}%)
                  </span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStopVms}
                    onChange={(e) => setAutoStopVms(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>
                    Auto-stop all <code>RUNNING</code> Compute Engine VMs at
                    Stage 2 ({fuseParkPct}%)
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSaveSpendFuse}
                disabled={actionBusy === 'SAVE_FUSE'}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 cursor-pointer"
              >
                {actionBusy === 'SAVE_FUSE'
                  ? 'Saving Stop-Loss Policy...'
                  : '🛡️ Arm Automated Stop-Loss Budget Fuse Policy'}
              </button>
            </div>
          </div>

          {/* Right Column: 1-Click Live Enforcement Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                ⚡ 1-Click Execute / Test Stop-Loss Fuse Actions Now
              </h3>
              <p className="text-xs text-zinc-500">
                Trigger any stop-loss stage immediately against live{' '}
                <code>{projectId}</code> resources or provision the native
                Pub/Sub stop-loss wire:
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleExecuteSpendFuse('PROVISION_PUBSUB_BUDGET_WIRE')
                  }
                  disabled={Boolean(actionBusy)}
                  className="w-full text-left p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer"
                >
                  <div className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                    1. Wire Live Pub/Sub Budget Stop-Loss Topic (
                    <code>cloudpulse-hard-spend-fuse</code>)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Creates the real Google Cloud Pub/Sub topic for programmatic
                    Billing Budget threshold alerts.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteSpendFuse('SOFT_BRAKE')}
                  disabled={Boolean(actionBusy)}
                  className="w-full text-left p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <div className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    2. Execute Stage 1 Soft Brake ({fuseSoftPct}% — Cap Cloud Run
                    Scaling)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Scales all warm Cloud Run services to <code>min=0</code> and
                    caps <code>maxInstances=3</code> to block viral bill spikes.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteSpendFuse('COMPUTE_PARK')}
                  disabled={Boolean(actionBusy)}
                  className="w-full text-left p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  <div className="text-xs font-mono font-extrabold text-rose-600 dark:text-rose-400">
                    3. Execute Stage 2 Compute Park ({fuseParkPct}% — Stop VMs +
                    Zero Cloud Run)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Stops all <code>RUNNING</code> Compute Engine VMs across all
                    zones and zeroes warm Cloud Run instances.
                  </div>
                </button>
              </div>

              {spendFuse.lastActionSummary && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  <strong>Last Fuse Execution:</strong>{' '}
                  {spendFuse.lastActionSummary}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 3: AWS IAM POLICY SIMULATOR & SWITCH-ROLE IMPERSONATOR
         ===================================================================== */}
      {activeSubTab === 'IAM_SIMULATOR' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>
                    AWS-Style IAM Policy Simulator &amp; &ldquo;Switch
                    Role&rdquo; Service Account Impersonator
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Select any Service Account or user principal in{' '}
                  <code>{projectId}</code> to simulate 16 core GCP permissions (
                  <code>ALLOW</code> vs <code>DENY</code>), preview the cockpit
                  as that identity, and grant missing least-privilege roles in 1
                  click.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedPrincipalKey}
                  onChange={(e) => {
                    setSelectedPrincipalKey(e.target.value);
                    handleRunIamSimulation(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                >
                  {principals.map((p) => (
                    <option key={p.memberKey} value={p.memberKey}>
                      {p.memberKey} ({p.roles?.length || 0} roles)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRunIamSimulation(selectedPrincipalKey)}
                  disabled={actionBusy === 'IAM_SIM'}
                  className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  {actionBusy === 'IAM_SIM'
                    ? 'Simulating...'
                    : '🔍 Run Policy Simulation'}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setImpersonatingBannerPrincipal(
                      impersonatingBannerPrincipal === selectedPrincipalKey
                        ? ''
                        : selectedPrincipalKey
                    )
                  }
                  className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-pointer"
                >
                  🎭{' '}
                  {impersonatingBannerPrincipal === selectedPrincipalKey
                    ? 'Exit Switch-Role View'
                    : 'Switch Role Preview'}
                </button>
              </div>
            </div>

            {simResult && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                    ✅ {simResult.allowedCount} ALLOWED
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                    ❌ {simResult.deniedCount} DENIED (Implicit)
                  </span>
                  <span className="text-zinc-500">
                    Active Bound Roles:{' '}
                    {simResult.principalRoles?.length > 0
                      ? simResult.principalRoles.join(', ')
                      : 'None (Zero project-level bindings)'}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">GCP Permission</th>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3">What It Controls</th>
                        <th className="py-2.5 px-3">Simulation Result</th>
                        <th className="py-2.5 px-3">
                          Matching / Remediation Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {(simResult.simulationMatrix || []).map((row) => {
                        const isAllowed = row.decision === 'ALLOWED';
                        return (
                          <tr
                            key={row.permission}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          >
                            <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                              {row.permission}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500">
                              {row.service}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                              {row.description}
                            </td>
                            <td className="py-2.5 px-3">
                              {isAllowed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  ALLOWED
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  DENIED
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isAllowed ? (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                  Granted via {row.matchingRoles.join(', ')}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleGrantMissingRole(
                                      row.recommendedLeastPrivilegeRole
                                    )
                                  }
                                  disabled={
                                    actionBusy ===
                                    `GRANT_${row.recommendedLeastPrivilegeRole}`
                                  }
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 cursor-pointer"
                                >
                                  + Grant {row.recommendedLeastPrivilegeRole}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 4: AZURE SAS / AWS S3 1-CLICK PRESIGNED URL & BROWSER UPLOAD STUDIO
         ===================================================================== */}
      {activeSubTab === 'SAS_PRESIGNED' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Bucket Object Browser + 1-Click SAS Link Generator */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-sky-500" />
                    <span>
                      1-Click Azure SAS / AWS S3 Presigned Share Link Generator
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Generate expiring download/upload links (<code>15m</code>,{' '}
                    <code>1h</code>, <code>24h</code>, <code>7d</code>) right
                    from the browser—including a{' '}
                    <strong>Zero-SA-Key Instant SAS Bridge URL</strong> that
                    works even when signed in with a personal user account!
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedBucket}
                    onChange={(e) => setSelectedBucket(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    {buckets.map((b) => (
                      <option key={b.name} value={b.name}>
                        gs://{b.name} ({b.location})
                      </option>
                    ))}
                  </select>

                  <select
                    value={sasDurationSec}
                    onChange={(e) => setSasDurationSec(Number(e.target.value))}
                    className="px-2.5 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    <option value={900}>Expires: 15 min</option>
                    <option value={3600}>Expires: 1 hour</option>
                    <option value={86400}>Expires: 24 hours</option>
                    <option value={604800}>Expires: 7 days</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Object Name</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Content-Type</th>
                      <th className="py-2.5 px-3 text-right">
                        1-Click Presigned / SAS Link
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {loadingObjects ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-zinc-400"
                        >
                          Loading objects in gs://{selectedBucket}...
                        </td>
                      </tr>
                    ) : bucketObjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-zinc-400"
                        >
                          Bucket is empty — upload a file on the right to test
                          1-Click Presigned URLs!
                        </td>
                      </tr>
                    ) : (
                      bucketObjects.map((obj) => (
                        <tr
                          key={obj.name}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                        >
                          <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                            {obj.name}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-500">
                            {(obj.sizeBytes / 1024).toFixed(1)} KB
                          </td>
                          <td className="py-2.5 px-3 text-zinc-500">
                            {obj.contentType}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleGeneratePresignedUrl(obj.name)
                              }
                              disabled={actionBusy === `SAS_${obj.name}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 border border-sky-500/30 cursor-pointer"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>Generate Share Link</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {generatedSasResult && (
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-sky-600 dark:text-sky-400">
                      🔗 Expiring SAS / Presigned Link Ready (
                      gs://{generatedSasResult.bucket}/
                      {generatedSasResult.objectName})
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Expires: {generatedSasResult.expiresAt}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={generatedSasResult.bridgePath}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open / Download via SAS Link</span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `${window.location.origin}${generatedSasResult.bridgePath}`,
                          'Copied expiring browser SAS URL!'
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Share URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          generatedSasResult.gcloudCli,
                          'Copied gcloud storage sign-url V4 command!'
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Copy V4 sign-url CLI</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Direct Browser Object Uploader */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleUploadObject}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-500" />
                <span>Direct Browser Upload to gs://{selectedBucket || '...'}</span>
              </h3>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Pick a Local File (or compose text below)
                </label>
                <input
                  type="file"
                  onChange={handleFileInputChange}
                  className="w-full text-xs font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-bold file:bg-sky-500/15 file:text-sky-600 dark:file:text-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Destination Object Path in Bucket
                </label>
                <input
                  type="text"
                  value={uploadObjectName}
                  onChange={(e) => setUploadObjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
              </div>

              {!uploadBase64 && (
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Inline Text / JSON Payload
                  </label>
                  <textarea
                    rows={4}
                    value={uploadTextContent}
                    onChange={(e) => setUploadTextContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={actionBusy === 'UPLOAD_OBJ' || !selectedBucket}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white cursor-pointer"
              >
                {actionBusy === 'UPLOAD_OBJ'
                  ? 'Uploading to Cloud Storage...'
                  : `⬆️ Upload to gs://${selectedBucket}/${uploadObjectName}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 5: 1-SCREEN GLOBAL HTTPS LOAD BALANCER + SSL + CLOUD ARMOR WIZARD
         ===================================================================== */}
      {activeSubTab === 'GLOBAL_LB_WIZARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <form
              onSubmit={handleProvisionGlobalLb}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-500" />
                <span>
                  1-Screen Global HTTPS Load Balancer, Managed SSL &amp; Cloud
                  Armor WAF Wizard
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                In Google Cloud Console, putting a custom domain + SSL + WAF in
                front of Cloud Run requires configuring{' '}
                <strong>7 separate networking objects</strong>. This wizard
                collapses all 7 steps into a single form.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Load Balancer Stack Name
                  </label>
                  <input
                    type="text"
                    value={lbStackName}
                    onChange={(e) => setLbStackName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Custom HTTPS Domain (Managed SSL)
                  </label>
                  <input
                    type="text"
                    value={lbDomainName}
                    onChange={(e) => setLbDomainName(e.target.value)}
                    placeholder="api.yourdomain.com"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Target Cloud Run Service
                  </label>
                  <input
                    type="text"
                    value={lbTargetRunService}
                    onChange={(e) => setLbTargetRunService(e.target.value)}
                    placeholder="e.g. cloudpulse-api"
                    list="cloudrun-services-list"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                  <datalist id="cloudrun-services-list">
                    {cloudRunServices.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Serverless NEG Region
                  </label>
                  <input
                    type="text"
                    value={lbTargetRegion}
                    onChange={(e) => setLbTargetRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lbEnableArmor}
                    onChange={(e) => setLbEnableArmor(e.target.checked)}
                    className="rounded accent-violet-600"
                  />
                  <span className="font-bold">
                    Attach Cloud Armor L7 DDoS &amp; Rate-Limit WAF Policy
                  </span>
                </label>
                {lbEnableArmor && (
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-zinc-500">Rate Limit:</span>
                    <input
                      type="number"
                      value={lbRateLimitRpm}
                      onChange={(e) => setLbRateLimitRpm(e.target.value)}
                      className="w-20 px-2 py-1 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                    />
                    <span className="text-zinc-500">req/min</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  actionBusy === 'PROVISION_LB' || !lbTargetRunService.trim()
                }
                className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white cursor-pointer"
              >
                {actionBusy === 'PROVISION_LB'
                  ? 'Provisioning Global LB, Serverless NEG, SSL & WAF...'
                  : '🚀 1-Click Provision Global HTTPS Load Balancer + SSL + WAF'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                📋 7-Step Global Load Balancer Execution Receipt &amp; CLI
                Blueprint
              </h3>

              {lbReceipt ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {(lbReceipt.stepsReceipt || []).map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                      >
                        <span className="font-bold">{s.step}</span>
                        <span className="text-zinc-500">{s.resource}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-64">
                      {lbReceipt.full7StepCli}
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          lbReceipt.full7StepCli,
                          'Copied 7-step Global Load Balancer CLI!'
                        )
                      }
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      Copy CLI
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 space-y-2">
                  <div>
                    <strong>Active Global Forwarding Rules:</strong>{' '}
                    {data?.globalLoadBalancers?.forwardingRules?.length || 0}
                  </div>
                  <div>
                    <strong>Active URL Maps:</strong>{' '}
                    {data?.globalLoadBalancers?.urlMaps?.length || 0}
                  </div>
                  <div>
                    <strong>Active Managed SSL Certificates:</strong>{' '}
                    {data?.globalLoadBalancers?.sslCertificates?.length || 0}
                  </div>
                  <div>
                    <strong>Active Cloud Armor Security Policies:</strong>{' '}
                    {data?.globalLoadBalancers?.armorPolicies?.length || 0}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
