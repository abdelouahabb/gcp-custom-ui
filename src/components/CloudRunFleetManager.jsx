import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Cpu,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Copy,
  Check,
  Sliders,
  GitBranch,
  Trash2,
  AlertTriangle,
  Zap,
  Terminal,
  Layers,
  Rocket,
} from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    label: 'Hello Cloud Run (Request-based · $0 Idle)',
    namePrefix: 'hello-run',
    image: 'us-docker.pkg.dev/cloudrun/container/hello',
    port: 8080,
    cpu: '1',
    memory: '512Mi',
    minInstances: 0,
    maxInstances: 5,
    billingMode: 'REQUEST_BASED',
    gpuCount: 0,
    gpuType: 'nvidia-l4',
  },
  {
    label: 'Always-On Worker (Instance-based Billing)',
    namePrefix: 'worker-run',
    image: 'gcr.io/google-samples/hello-app:1.0',
    port: 8080,
    cpu: '1',
    memory: '512Mi',
    minInstances: 0,
    maxInstances: 5,
    billingMode: 'INSTANCE_BASED',
    gpuCount: 0,
    gpuType: 'nvidia-l4',
  },
  {
    label: 'AI GPU Inference (NVIDIA L4 · 4vCPU/16Gi)',
    namePrefix: 'gpu-ai-run',
    image: 'us-docker.pkg.dev/cloudrun/container/hello',
    port: 8080,
    cpu: '4',
    memory: '16Gi',
    minInstances: 0,
    maxInstances: 3,
    billingMode: 'INSTANCE_BASED',
    gpuCount: 1,
    gpuType: 'nvidia-l4',
  },
];

export default function CloudRunFleetManager({
  projectId,
  initialServices = [],
  onOpenProvisionCloudRun,
  onRefreshOverview,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [services, setServices] = useState(initialServices);
  const [loading, setLoading] = useState(false);
  const [quickDeploying, setQuickDeploying] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Per-service interactive drawer state: { [serviceId]: 'TUNE' | 'TRAFFIC' | null }
  const [openDrawer, setOpenDrawer] = useState({});
  // Per-service edit form state
  const [editForms, setEditForms] = useState({});
  // Per-service traffic split form state
  const [trafficForms, setTrafficForms] = useState({});
  // Per-service transitional busy state: { [serviceId]: 'UPDATING' | 'DELETING' | 'IAM' | 'TRAFFIC' }
  const [busyMap, setBusyMap] = useState({});
  // 2-step delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (Array.isArray(initialServices) && initialServices.length > 0 && services.length === 0) {
      setServices(initialServices);
    }
  }, [initialServices, services.length]);

  const fetchCloudRunFleet = useCallback(
    async (silent = false) => {
      if (!projectId) return;
      if (!silent) setLoading(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/cloudrun`
        );
        if (Array.isArray(res.data?.services)) {
          setServices(res.data.services);
          // Clear DELETING state for services that have finished deprovisioning
          setBusyMap((prev) => {
            const next = { ...prev };
            const currentIds = new Set(res.data.services.map((s) => s.id));
            Object.keys(next).forEach((id) => {
              if (next[id] === 'DELETING' && !currentIds.has(id)) {
                delete next[id];
              }
            });
            return next;
          });
        }
      } catch {
        // ignore silent poll errors
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchCloudRunFleet(false);
  }, [fetchCloudRunFleet]);

  // Auto-poll every 3.5s while any service is reconciling or has a pending operation
  const hasActiveOps =
    Object.keys(busyMap).length > 0 ||
    services.some((s) => s.reconciling || s.status === 'DEPLOYING');

  useEffect(() => {
    if (!hasActiveOps) return undefined;
    const timer = setInterval(() => {
      fetchCloudRunFleet(true);
    }, 3500);
    return () => clearInterval(timer);
  }, [hasActiveOps, fetchCloudRunFleet]);

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const toggleServiceDrawer = (srv, mode) => {
    const current = openDrawer[srv.id];
    if (current === mode) {
      setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }));
      return;
    }
    setOpenDrawer((prev) => ({ ...prev, [srv.id]: mode }));

    if (mode === 'TUNE') {
      const hasGpu = Number(srv.gpuCount || 0) > 0;
      setEditForms((prev) => ({
        ...prev,
        [srv.id]: {
          containerImage: srv.containerImage,
          containerPort: srv.containerPort || 8080,
          cpu: srv.cpu || '1',
          memory: srv.memory || '512Mi',
          billingMode:
            srv.billingMode ||
            (srv.cpuIdle !== false ? 'REQUEST_BASED' : 'INSTANCE_BASED'),
          cpuIdle: srv.cpuIdle !== false,
          gpuAccelerator: hasGpu ? srv.gpuType || 'nvidia-l4' : 'NONE',
          gpuZonalRedundancy: Boolean(srv.gpuZonalRedundancy),
          startupCpuBoost: Boolean(srv.startupCpuBoost),
          minInstances: srv.minInstances ?? 0,
          maxInstances: srv.maxInstances ?? 10,
          concurrency: srv.concurrency ?? 80,
          timeoutSeconds: srv.timeoutSeconds ?? 300,
          ingress: srv.ingress || 'INGRESS_TRAFFIC_ALL',
          executionEnvironment:
            srv.executionEnvironment || 'EXECUTION_ENVIRONMENT_GEN2',
          envVarsText: (srv.envVars || [])
            .map((e) => `${e.name}=${e.value}`)
            .join('\n'),
        },
      }));
    } else if (mode === 'TRAFFIC') {
      const secondRev = srv.revisions?.[1]?.shortName || '';
      setTrafficForms((prev) => ({
        ...prev,
        [srv.id]: {
          targetRevision: 'LATEST',
          canaryRevision: secondRev,
          canaryPercent: 0,
        },
      }));
    }
  };

  const handleQuickDeployTemplate = async (tpl) => {
    if (quickDeploying) return;
    const suffix = Math.floor(100 + Math.random() * 899);
    const serviceName = `${tpl.namePrefix}-${suffix}`;
    setQuickDeploying(tpl.label);
    const hasGpu = Number(tpl.gpuCount || 0) > 0;
    const billingMode = hasGpu
      ? 'INSTANCE_BASED'
      : tpl.billingMode || 'REQUEST_BASED';
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType: 'CLOUD_RUN',
          name: serviceName,
          region: 'us-east1',
          config: {
            containerImage: tpl.image,
            containerPort: tpl.port,
            cpu: tpl.cpu,
            memory: tpl.memory,
            minInstances: tpl.minInstances,
            maxInstances: tpl.maxInstances,
            concurrency: 80,
            timeoutSeconds: 300,
            ingress: 'INGRESS_TRAFFIC_ALL',
            executionEnvironment: 'EXECUTION_ENVIRONMENT_GEN2',
            allowUnauthenticated: true,
            billingMode,
            cpuIdle: billingMode === 'REQUEST_BASED' && !hasGpu,
            gpuCount: hasGpu ? 1 : 0,
            gpuType: tpl.gpuType || 'nvidia-l4',
            gpuZonalRedundancy: false,
            startupCpuBoost: true,
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Deployed Cloud Run service ${serviceName}!`
        );
      }
      await fetchCloudRunFleet(false);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to deploy Cloud Run template.'
        );
      }
    } finally {
      setQuickDeploying(null);
    }
  };

  const handleSaveTuneConfig = async (srv) => {
    const form = editForms[srv.id];
    if (!form) return;
    const hasGpu = form.gpuAccelerator && form.gpuAccelerator !== 'NONE';
    const billingMode = hasGpu
      ? 'INSTANCE_BASED'
      : form.billingMode || 'REQUEST_BASED';
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'UPDATING' }));
    try {
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}`,
        {
          ...form,
          billingMode,
          cpuIdle: billingMode === 'REQUEST_BASED' && !hasGpu,
          gpuCount: hasGpu ? 1 : 0,
          gpuType: hasGpu ? form.gpuAccelerator : 'nvidia-l4',
          gpuZonalRedundancy: Boolean(form.gpuZonalRedundancy),
          envVars: form.envVarsText,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Updated Cloud Run service ${srv.name}!`
        );
      }
      setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }));
      await fetchCloudRunFleet(true);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to update ${srv.name}`
        );
      }
    } finally {
      setTimeout(() => {
        setBusyMap((prev) => {
          const next = { ...prev };
          delete next[srv.id];
          return next;
        });
      }, 2500);
    }
  };

  const handleTogglePublicIam = async (srv) => {
    const nextPublic = !srv.allowUnauthenticated;
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'IAM' }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}/iam`,
        {
          allowUnauthenticated: nextPublic,
        }
      );
      if (onShowToast) {
        onShowToast(res.data?.message);
      }
      await fetchCloudRunFleet(true);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to update IAM policy for ${srv.name}`
        );
      }
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
    }
  };

  const handleApplyTraffic = async (srv, overrideRevision = null) => {
    const tf = trafficForms[srv.id] || {};
    const targetRevision = overrideRevision || tf.targetRevision || 'LATEST';
    const canaryPercent = overrideRevision ? 0 : Number(tf.canaryPercent || 0);
    const canaryRevision = overrideRevision ? '' : tf.canaryRevision || '';

    setBusyMap((prev) => ({ ...prev, [srv.id]: 'TRAFFIC' }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}/traffic`,
        {
          targetRevision,
          canaryPercent,
          canaryRevision,
        }
      );
      if (onShowToast) {
        onShowToast(res.data?.message);
      }
      setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }));
      await fetchCloudRunFleet(true);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to update traffic routing on ${srv.name}`
        );
      }
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
    }
  };

  const handleDeleteService = async (srv) => {
    setConfirmDeleteId(null);
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'DELETING' }));
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(projectId)}/resource`,
        {
          data: {
            resourceType: 'Cloud Run Service',
            name: srv.name,
            region: srv.region,
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Deleting Cloud Run service ${srv.name}...`
        );
      }
      await fetchCloudRunFleet(true);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to delete Cloud Run service ${srv.name}`
        );
      }
    }
  };

  const selfDeployCmd = `gcloud run deploy cloudpulse-2026 --source . --project=${projectId} --region=us-east1 --allow-unauthenticated`;

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Rocket className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
              Cloud Run Serverless Command Center ({services.length} Services)
            </h3>
            <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
              run.googleapis.com/v2 · GEN2
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Deploy containers, tune live autoscaling (Min/Max instances, CPU,
            Memory, Concurrency), toggle Public/IAM access, and split traffic
            across revisions on{' '}
            <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
              {projectId}
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchCloudRunFleet(false)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading || hasActiveOps ? 'animate-spin text-blue-500' : ''
              }`}
            />
            <span>Sync Cloud Run</span>
          </button>

          <button
            type="button"
            onClick={onOpenProvisionCloudRun}
            className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-[8px] px-3.5 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Deploy Cloud Run Service</span>
          </button>
        </div>
      </div>

      {/* Quick 1-Tap Cloud Run Templates & Self-Deploy Banner */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Tap Instant Deploy:</span>
          </span>
          {QUICK_TEMPLATES.map((tpl) => {
            const isDeployingThis = quickDeploying === tpl.label;
            return (
              <button
                key={tpl.label}
                type="button"
                disabled={Boolean(quickDeploying)}
                onClick={() => handleQuickDeployTemplate(tpl)}
                className="inline-flex items-center gap-1.5 text-xs font-mono bg-white dark:bg-zinc-900 hover:bg-blue-500/10 text-zinc-800 dark:text-zinc-200 hover:text-blue-500 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isDeployingThis ? (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                ) : (
                  <Rocket className="w-3 h-3 text-blue-500" />
                )}
                <span>
                  {isDeployingThis ? `Deploying ${tpl.namePrefix}...` : tpl.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Copy command to deploy CloudPulse 2026 itself to Cloud Run */}
        <div className="flex items-center gap-2 bg-zinc-900/95 text-zinc-200 px-3 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-mono">
          <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate max-w-xs sm:max-w-md" title={selfDeployCmd}>
            {selfDeployCmd}
          </span>
          <button
            type="button"
            onClick={() => handleCopy(selfDeployCmd, 'self-deploy')}
            className="text-blue-400 hover:text-blue-300 shrink-0 inline-flex items-center gap-1 ml-1"
          >
            {copiedId === 'self-deploy' ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Cloud Run Services Grid */}
      {loading && services.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
          <span>
            Querying live Cloud Run services across all regions in{' '}
            <span className="font-mono font-semibold">{projectId}</span>...
          </span>
        </div>
      ) : services.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              No Cloud Run Services Deployed Yet in {projectId}
            </h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Click <strong>+ Deploy Cloud Run Service</strong> to customize
              CPU, Memory, Min/Max Autoscaling, Concurrency, Port, Ingress &
              Environment Variables, or use a <strong>1-Tap Instant Deploy</strong>{' '}
              template above!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenProvisionCloudRun}
              className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Open Cloud Run Deployment Studio</span>
            </button>
            <button
              type="button"
              disabled={Boolean(quickDeploying)}
              onClick={() => handleQuickDeployTemplate(QUICK_TEMPLATES[0])}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>1-Tap Deploy Hello Cloud Run</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {services.map((srv) => {
            const busyState = busyMap[srv.id];
            const isDeleting = busyState === 'DELETING';
            const isUpdating =
              busyState === 'UPDATING' ||
              srv.reconciling ||
              srv.status === 'DEPLOYING';
            const activeDrawer = openDrawer[srv.id];
            const form = editForms[srv.id] || {};
            const tf = trafficForms[srv.id] || {};
            const isConfirmingDelete = confirmDeleteId === srv.id;

            return (
              <div
                key={srv.id}
                className={`relative overflow-hidden rounded-xl border p-4 transition-all space-y-3.5 ${
                  isDeleting
                    ? 'border-rose-500/40 bg-rose-500/5 opacity-55 grayscale select-none pointer-events-none'
                    : isUpdating
                    ? 'border-blue-500/40 bg-blue-500/[0.03] dark:bg-[#09090b]'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-[#09090b]'
                }`}
              >
                {(isDeleting || isUpdating) && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 overflow-hidden">
                    <div
                      className={`h-full w-1/2 animate-pulse ${
                        isDeleting ? 'bg-rose-500' : 'bg-blue-500'
                      }`}
                    />
                  </div>
                )}

                {/* Top Row: Service Name, Badges, URL & Quick Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold font-mono ${
                          isDeleting
                            ? 'line-through text-zinc-400'
                            : 'text-zinc-950 dark:text-zinc-50'
                        }`}
                      >
                        {srv.name}
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded">
                        {srv.region}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isDeleting
                            ? 'bg-rose-500/20 text-rose-500'
                            : isUpdating
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        }`}
                      >
                        {isDeleting
                          ? 'DELETING SERVICE...'
                          : isUpdating
                          ? 'DEPLOYING REVISION...'
                          : 'READY'}
                      </span>

                      {/* Public vs Private IAM Badge */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublicIam(srv)}
                        disabled={Boolean(busyState)}
                        title="Click to toggle Public Unauthenticated (allUsers) vs Private IAM Authenticated access"
                        className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          srv.allowUnauthenticated
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 hover:bg-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                        }`}
                      >
                        {srv.allowUnauthenticated ? (
                          <>
                            <Globe className="w-3 h-3" />
                            <span>PUBLIC HTTPS (allUsers)</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span>PRIVATE (IAM AUTH)</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Live HTTPS URL */}
                    <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 flex-wrap">
                      <a
                        href={srv.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center gap-1 break-all"
                      >
                        <span>{srv.uri}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(srv.uri, `uri-${srv.id}`)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-0.5"
                      >
                        {copiedId === `uri-${srv.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleServiceDrawer(srv, 'TUNE')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        activeDrawer === 'TUNE'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Scale & Tune</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleServiceDrawer(srv, 'TRAFFIC')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        activeDrawer === 'TRAFFIC'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                      }`}
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>
                        Revisions & Traffic ({srv.revisions?.length || 1})
                      </span>
                    </button>

                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() =>
                          onRunInShell(
                            `gcloud run services describe ${srv.name} --region=${srv.region} --project=${projectId}`
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 cursor-pointer"
                        title="Inspect in Mobile Cloud Shell"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>CLI</span>
                      </button>
                    )}

                    {isConfirmingDelete ? (
                      <div className="inline-flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg px-2.5 py-1">
                        <span className="text-[11px] font-bold text-rose-500">
                          Delete {srv.name}?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteService(srv)}
                          className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-2 py-0.5 rounded"
                        >
                          Yes, Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-[11px] text-zinc-500 px-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(srv.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Spec Summary Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      CPU, RAM & GPU
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>
                        {srv.cpu} vCPU · {srv.memory}
                      </span>
                      {Number(srv.gpuCount || 0) > 0 && (
                        <span className="text-[10px] bg-violet-500/20 text-violet-500 border border-violet-500/30 px-1.5 py-0.2 rounded">
                          {srv.gpuCount}x {srv.gpuType || 'nvidia-l4'}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] font-mono font-semibold ${
                        srv.cpuIdle
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {srv.cpuIdle
                        ? 'Request-based Billing ($0 Idle)'
                        : 'Instance-based Billing (Always-On)'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Autoscaling
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      Min {srv.minInstances} → Max {srv.maxInstances}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-medium">
                      {srv.minInstances === 0
                        ? 'Scale-to-$0 Enabled'
                        : `${srv.minInstances} Warm Instances`}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Concurrency & Port
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {srv.concurrency} req/inst · :{srv.containerPort}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Timeout: {srv.timeoutSeconds}s
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Ingress & Runtime
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                      {srv.ingress.replace('INGRESS_TRAFFIC_', '')}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {srv.executionEnvironment.replace(
                        'EXECUTION_ENVIRONMENT_',
                        ''
                      )}
                      {Number(srv.gpuCount || 0) > 0 &&
                        (srv.gpuZonalRedundancy
                          ? ' · Zonal Redundant GPU'
                          : ' · No GPU Zonal Redundancy')}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 col-span-2">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Container Image & Active Revision
                    </div>
                    <div
                      className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 truncate"
                      title={srv.containerImage}
                    >
                      {srv.containerImage}
                    </div>
                    <div className="text-[10px] font-mono text-blue-500 truncate">
                      Rev: {srv.latestReadyRevision}
                      {srv.envVars?.length > 0 &&
                        ` · ${srv.envVars.length} Env Var(s)`}
                    </div>
                  </div>
                </div>

                {/* DRAWER 1: LIVE SCALE & TUNE CONFIGURATION */}
                {activeDrawer === 'TUNE' && (
                  <div className="mt-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-950 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-blue-500 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>
                          Live Cloud Run Revision Tuner — {srv.name} ({srv.region})
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }))
                        }
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Close
                      </button>
                    </div>

                    {/* 2026 Billing Mode & Serverless GPU Accelerator Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                      <div>
                        <label className="block text-[11px] font-bold font-mono uppercase text-zinc-600 dark:text-zinc-300 mb-1.5">
                          2026 Billing Mode (Request-based vs Instance-based)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                            onClick={() =>
                              setEditForms((prev) => ({
                                ...prev,
                                [srv.id]: {
                                  ...form,
                                  billingMode: 'REQUEST_BASED',
                                  cpuIdle: true,
                                },
                              }))
                            }
                            className={`p-2 rounded-lg border text-left text-xs font-mono transition-colors ${
                              form.billingMode === 'REQUEST_BASED' &&
                              (!form.gpuAccelerator ||
                                form.gpuAccelerator === 'NONE')
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-40'
                            }`}
                          >
                            <div>Request-based</div>
                            <div className="text-[10px] opacity-80">
                              CPU during reqs ($0 Idle)
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForms((prev) => ({
                                ...prev,
                                [srv.id]: {
                                  ...form,
                                  billingMode: 'INSTANCE_BASED',
                                  cpuIdle: false,
                                },
                              }))
                            }
                            className={`p-2 rounded-lg border text-left text-xs font-mono transition-colors ${
                              form.billingMode === 'INSTANCE_BASED' ||
                              (form.gpuAccelerator &&
                                form.gpuAccelerator !== 'NONE')
                                ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                            }`}
                          >
                            <div>Instance-based</div>
                            <div className="text-[10px] opacity-80">
                              Always-On CPU/GPU
                            </div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold font-mono uppercase text-violet-600 dark:text-violet-400 mb-1.5">
                          2026 Serverless GPU Accelerator
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'NONE', label: 'No GPU' },
                            { id: 'nvidia-l4', label: '1x NVIDIA L4' },
                            {
                              id: 'nvidia-rtx-pro-6000',
                              label: '1x RTX 6000',
                            },
                          ].map((g) => {
                            const active =
                              (form.gpuAccelerator || 'NONE') === g.id;
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  const nextCpu =
                                    g.id !== 'NONE' && Number(form.cpu) < 4
                                      ? '4'
                                      : form.cpu;
                                  const nextMem =
                                    g.id !== 'NONE' &&
                                    !['16Gi', '32Gi'].includes(form.memory)
                                      ? '16Gi'
                                      : form.memory;
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      gpuAccelerator: g.id,
                                      cpu: nextCpu,
                                      memory: nextMem,
                                      billingMode:
                                        g.id !== 'NONE'
                                          ? 'INSTANCE_BASED'
                                          : form.billingMode,
                                      cpuIdle:
                                        g.id !== 'NONE' ? false : form.cpuIdle,
                                    },
                                  }));
                                }}
                                className={`p-2 rounded-lg border text-xs font-mono transition-colors ${
                                  active
                                    ? 'bg-violet-500/15 border-violet-500 text-violet-700 dark:text-violet-300 font-bold'
                                    : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                                }`}
                              >
                                {g.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          vCPU Allocation
                        </label>
                        <select
                          value={form.cpu || '1'}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: { ...form, cpu: e.target.value },
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        >
                          <option
                            value="1"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            1 vCPU
                          </option>
                          <option
                            value="2"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            2 vCPU
                          </option>
                          <option value="4">4 vCPU (GPU Min)</option>
                          <option value="8">8 vCPU</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Memory Limit
                        </label>
                        <select
                          value={form.memory || '512Mi'}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: { ...form, memory: e.target.value },
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        >
                          <option
                            value="256Mi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            256Mi
                          </option>
                          <option
                            value="512Mi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            512Mi
                          </option>
                          <option
                            value="1Gi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            1Gi
                          </option>
                          <option
                            value="2Gi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            2Gi
                          </option>
                          <option
                            value="4Gi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            4Gi
                          </option>
                          <option
                            value="8Gi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            8Gi
                          </option>
                          <option value="16Gi">16Gi (GPU Min)</option>
                          <option value="32Gi">32Gi</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Min Instances (0 = Scale to $0)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={form.minInstances ?? 0}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                minInstances: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Max Instances (Cost Cap)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={form.maxInstances ?? 10}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                maxInstances: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Max Concurrency (req/inst)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={form.concurrency ?? 80}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                concurrency: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Container Port
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={65535}
                          value={form.containerPort ?? 8080}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                containerPort: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Ingress Network Policy
                        </label>
                        <select
                          value={form.ingress || 'INGRESS_TRAFFIC_ALL'}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: { ...form, ingress: e.target.value },
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="INGRESS_TRAFFIC_ALL">
                            All Traffic (Public Internet)
                          </option>
                          <option value="INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER">
                            Internal + Cloud Load Balancer
                          </option>
                          <option value="INGRESS_TRAFFIC_INTERNAL_ONLY">
                            Internal VPC Traffic Only
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Startup CPU Boost
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                startupCpuBoost: !form.startupCpuBoost,
                              },
                            }))
                          }
                          className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono border text-left ${
                            form.startupCpuBoost
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {form.startupCpuBoost
                            ? 'Startup CPU Boost ON'
                            : 'Startup CPU Boost OFF'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Container Image URI
                        </label>
                        <input
                          type="text"
                          value={form.containerImage || ''}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                containerImage: e.target.value,
                              },
                            }))
                          }
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                          Environment Variables (KEY=VALUE per line or comma)
                        </label>
                        <input
                          type="text"
                          value={form.envVarsText || ''}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                envVarsText: e.target.value,
                              },
                            }))
                          }
                          placeholder="NODE_ENV=production, PORT_MODE=fast"
                          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveTuneConfig(srv)}
                        disabled={Boolean(busyState)}
                        className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-[#000000] font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Deploy Updated Revision</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* DRAWER 2: REVISIONS & TRAFFIC SPLITTING / ROLLBACK */}
                {activeDrawer === 'TRAFFIC' && (
                  <div className="mt-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-950 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-blue-500 flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>
                          Revisions, Traffic Splitting & 1-Tap Rollback —{' '}
                          {srv.name}
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }))
                        }
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        Close
                      </button>
                    </div>

                    {/* Current Traffic Allocation Bar */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono text-zinc-500">
                        Active HTTPS Traffic Routing:
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(srv.traffic || []).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-md"
                          >
                            <strong>{t.percent}%</strong> →{' '}
                            {t.revision === 'LATEST'
                              ? `LATEST (${srv.latestReadyRevision})`
                              : t.revision}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Revisions List with 1-Tap Rollback */}
                    {srv.revisions && srv.revisions.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[11px] font-mono text-zinc-500">
                          Deployed Revisions ({srv.revisions.length}):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {srv.revisions.map((rev) => {
                            const isLatest =
                              rev.shortName === srv.latestReadyRevision;
                            return (
                              <div
                                key={rev.shortName}
                                className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <span className="truncate">
                                      {rev.shortName}
                                    </span>
                                    {isLatest && (
                                      <span className="text-[9px] bg-emerald-500/15 text-emerald-500 px-1.5 py-0.5 rounded">
                                        LATEST
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-500 truncate">
                                    {rev.cpu} vCPU · {rev.memory} · scale{' '}
                                    {rev.minInstances}→{rev.maxInstances}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleApplyTraffic(srv, rev.shortName)
                                  }
                                  className="text-[11px] font-mono bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded shrink-0 cursor-pointer"
                                >
                                  Route 100% Here
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Canary Traffic Splitter */}
                    {srv.revisions && srv.revisions.length > 1 && (
                      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                            Canary Revision
                          </label>
                          <select
                            value={tf.canaryRevision || ''}
                            onChange={(e) =>
                              setTrafficForms((prev) => ({
                                ...prev,
                                [srv.id]: {
                                  ...tf,
                                  canaryRevision: e.target.value,
                                },
                              }))
                            }
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                          >
                            {srv.revisions.map((r) => (
                              <option key={r.shortName} value={r.shortName}>
                                {r.shortName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                            Canary Traffic % (0–90%)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={90}
                            step={5}
                            value={tf.canaryPercent ?? 0}
                            onChange={(e) =>
                              setTrafficForms((prev) => ({
                                ...prev,
                                [srv.id]: {
                                  ...tf,
                                  canaryPercent: Number(e.target.value),
                                },
                              }))
                            }
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyTraffic(srv)}
                          className="bg-[#059669] hover:bg-[#047857] text-[#000000] font-bold text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Apply Canary Split
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
