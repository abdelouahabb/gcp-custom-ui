import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Cpu,
  ShieldCheck,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Server,
  Layers,
  PlusCircle,
  Lock,
  Rocket,
  FileCode,
  Zap,
} from 'lucide-react';

const GPU_SKUS = {
  'nvidia-l4': {
    label: 'NVIDIA L4 (24GB VRAM · Ada Lovelace · g2-standard-4)',
    machineType: 'g2-standard-4',
    onDemandHr: 0.81,
    spotHr: 0.26,
    flag: 'nvidia-l4',
  },
  'nvidia-tesla-t4': {
    label: 'NVIDIA Tesla T4 (16GB VRAM · Inference · n1-standard-4)',
    machineType: 'n1-standard-4',
    onDemandHr: 0.54,
    spotHr: 0.17,
    flag: 'nvidia-tesla-t4',
  },
  'nvidia-a100-80gb': {
    label: 'NVIDIA A100 (80GB HBM2e · Ampere · a2-ultragpu-1g)',
    machineType: 'a2-highgpu-1g',
    onDemandHr: 3.93,
    spotHr: 1.18,
    flag: 'nvidia-a100-80gb',
  },
  'nvidia-h100-80gb': {
    label: 'NVIDIA H100 (80GB HBM3 · Hopper Mega · a3-highgpu-8g)',
    machineType: 'a2-highgpu-1g',
    onDemandHr: 10.8,
    spotHr: 3.35,
    flag: 'nvidia-h100-80gb',
  },
};

const WORKLOAD_TEMPLATES = {
  'web-microservice': {
    title: 'Zero-Trust Stateless Web Microservice + HPA',
    desc: 'Hardened non-root Deployment with Seccomp RuntimeDefault, PodDisruptionBudget & CPU HorizontalPodAutoscaler (1→10 replicas)',
    image: 'us-docker.pkg.dev/cloudrun/container/hello:latest',
    port: 8080,
    cpuReq: '250m',
    memReq: '512Mi',
    gpuCount: 0,
  },
  'vllm-l4-inference': {
    title: 'vLLM / Gemma-3 / Llama-3 GPU Inference Server (NVIDIA L4)',
    desc: 'GPU-accelerated LLM serving Deployment requesting 1x nvidia.com/gpu with Spot toleration & /v1/chat/completions Service',
    image: 'vllm/vllm-openai:latest',
    port: 8000,
    cpuReq: '2000m',
    memReq: '16Gi',
    gpuCount: 1,
  },
  'redis-stateful-cache': {
    title: 'High-Throughput Redis 7 In-Memory Cache Cluster',
    desc: 'Low-latency internal ClusterIP cache with strict memory limits and liveness probes',
    image: 'redis:7.2-alpine',
    port: 6379,
    cpuReq: '500m',
    memReq: '1Gi',
    gpuCount: 0,
  },
};

export default function GkeFleetStudio({
  projectId,
  onOpenProvisionGke,
  onRunInShell,
  onRefreshOverview,
  onShowToast,
}) {
  const [activeSubTab, setActiveSubTab] = useState('FLEET_DEPLOY');
  const [gkeData, setGkeData] = useState(null);
  const [loadingGke, setLoadingGke] = useState(false);

  // Quick Cluster Provisioner State with Strict Compliance Locks
  const [gkeBlueprint, setGkeBlueprint] = useState('zero-trust-autopilot');
  const [clusterName, setClusterName] = useState('cloudpulse-gke-autopilot');
  const [clusterRegion, setClusterRegion] = useState('us-central1');
  const [gkeMode, setGkeMode] = useState('AUTOPILOT'); // AUTOPILOT | STANDARD
  const [releaseChannel, setReleaseChannel] = useState('STABLE');
  const [gpuSku, setGpuSku] = useState('nvidia-l4');
  const [gpuCount, setGpuCount] = useState(1);
  const [useSpotGpu, setUseSpotGpu] = useState(true);
  const [privateNodes, setPrivateNodes] = useState(true);
  const [binaryAuth, setBinaryAuth] = useState(true);
  const [workloadIdentity, setWorkloadIdentity] = useState(true);
  const [creatingGke, setCreatingGke] = useState(false);
  const [deletingGkeName, setDeletingGkeName] = useState('');

  // Workload YAML Generator & 3-Way Container Source State
  const [workloadPreset, setWorkloadPreset] = useState('web-microservice');
  const [containerSourceMode, setContainerSourceMode] = useState('ARTIFACT_REGISTRY'); // ARTIFACT_REGISTRY | GITHUB_REPO | PUBLIC_URI
  const [arImages, setArImages] = useState([]);
  const [ghRepoUrl, setGhRepoUrl] = useState(
    'https://github.com/GoogleCloudPlatform/golang-samples.git'
  );
  const [ghBranch, setGhBranch] = useState('main');
  const [ghContextDir, setGhContextDir] = useState('run/helloworld');
  const [ghBuildMethod, setGhBuildMethod] = useState('BUILDPACKS'); // DOCKERFILE | BUILDPACKS
  const [ghArRepo, setGhArRepo] = useState('cloudpulse-containers');
  const [ghTargetCluster, setGhTargetCluster] = useState('');
  const [triggeringGkeBuild, setTriggeringGkeBuild] = useState(false);

  const [appName, setAppName] = useState('cloudpulse-api');
  const [appNamespace, setAppNamespace] = useState('production');
  const [appImage, setAppImage] = useState(
    'us-docker.pkg.dev/cloudrun/container/hello:latest'
  );
  const [appPort, setAppPort] = useState(8080);
  const [appReplicas, setAppReplicas] = useState(2);
  const [appCpuReq, setAppCpuReq] = useState('250m');
  const [appMemReq, setAppMemReq] = useState('512Mi');
  const [appGpuCount, setAppGpuCount] = useState(0);
  const [copiedLabel, setCopiedLabel] = useState('');

  const handleCopy = (text, label = 'command') => {
    navigator.clipboard?.writeText(text);
    setCopiedLabel(label);
    if (onShowToast) onShowToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedLabel(''), 2000);
  };

  const fetchGkeFleet = useCallback(async () => {
    if (!projectId) return;
    setLoadingGke(true);
    try {
      const [resGke, resAr] = await Promise.all([
        axios.get(
          `/api/project/${encodeURIComponent(projectId)}/wave9/gke-vertex`
        ),
        axios
          .get(
            `/api/project/${encodeURIComponent(projectId)}/wave9/supply-chain`
          )
          .catch(() => ({ data: { images: [] } })),
      ]);
      setGkeData(resGke.data);
      const imgs = resAr.data?.images || [];
      setArImages(imgs);
      if (
        resGke.data?.clusters?.length > 0 &&
        !ghTargetCluster
      ) {
        setGhTargetCluster(resGke.data.clusters[0].name);
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error || 'Failed to inspect GKE cluster fleet'
        );
      }
    } finally {
      setLoadingGke(false);
    }
  }, [projectId, onShowToast, ghTargetCluster]);

  useEffect(() => {
    fetchGkeFleet();
  }, [fetchGkeFleet]);

  const handleTriggerGithubToGkeBuild = async () => {
    if (!ghRepoUrl.trim() || triggeringGkeBuild) return;
    setTriggeringGkeBuild(true);
    try {
      const targetClusterObj = (gkeData?.clusters || []).find(
        (c) => c.name === ghTargetCluster
      );
      const targetLoc = targetClusterObj?.location || clusterRegion;
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/cloud-build/trigger-github`,
        {
          repoUrl: ghRepoUrl.trim(),
          branch: ghBranch.trim() || 'main',
          contextDir: ghContextDir.trim() || '.',
          buildMethod: ghBuildMethod,
          arLocation: clusterRegion,
          arRepository: ghArRepo.trim() || 'cloudpulse-containers',
          imageName: appName.trim() || 'cloudpulse-api',
          imageTag: 'latest',
          deployTarget: ghTargetCluster ? 'GKE' : 'NONE',
          gkeCluster: ghTargetCluster || clusterName,
          gkeLocation: targetLoc,
          gkeNamespace: appNamespace || 'default',
          gkeDeploymentName: appName || 'cloudpulse-api',
          gkePort: Number(appPort || 8080),
        }
      );
      if (res.data?.fullImageUri) {
        setAppImage(res.data.fullImageUri);
      }
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Cloud Build started for ${ghRepoUrl} → Artifact Registry → GKE`
        );
      }
      await fetchGkeFleet();
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error ||
            'Failed to trigger GitHub Cloud Build for GKE'
        );
      }
    } finally {
      setTriggeringGkeBuild(false);
    }
  };

  const applyGkeBlueprint = (bp) => {
    setGkeBlueprint(bp);
    if (bp === 'zero-trust-autopilot') {
      setGkeMode('AUTOPILOT');
      setClusterRegion('us-central1');
      setReleaseChannel('STABLE');
      setPrivateNodes(true);
      setBinaryAuth(true);
      setWorkloadIdentity(true);
    } else if (bp === 'gdpr-eu-ai-cluster') {
      setGkeMode('AUTOPILOT');
      setClusterRegion('europe-west1');
      setReleaseChannel('REGULAR');
      setPrivateNodes(true);
      setBinaryAuth(true);
      setWorkloadIdentity(true);
    } else if (bp === 'hipaa-clinical-k8s') {
      setGkeMode('AUTOPILOT');
      setClusterRegion('us-east4');
      setReleaseChannel('STABLE');
      setPrivateNodes(true);
      setBinaryAuth(true);
      setWorkloadIdentity(true);
    } else if (bp === 'ai-spot-gpu-standard') {
      setGkeMode('STANDARD');
      setClusterRegion('us-central1');
      setReleaseChannel('RAPID');
      setUseSpotGpu(true);
      setPrivateNodes(false);
      setBinaryAuth(false);
      setWorkloadIdentity(true);
    }
  };

  const applyWorkloadTemplate = (tplKey) => {
    setWorkloadPreset(tplKey);
    const tpl = WORKLOAD_TEMPLATES[tplKey];
    if (!tpl) return;
    setAppImage(tpl.image);
    setAppPort(tpl.port);
    setAppCpuReq(tpl.cpuReq);
    setAppMemReq(tpl.memReq);
    setAppGpuCount(tpl.gpuCount);
  };

  const handleCreateGkeCluster = async (e) => {
    e.preventDefault();
    if (!clusterName.trim() || creatingGke) return;
    setCreatingGke(true);
    try {
      const selectedGpu = GPU_SKUS[gpuSku] || GPU_SKUS['nvidia-l4'];
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType: 'GKE_CLUSTER',
          name: clusterName.trim(),
          region: clusterRegion,
          config: {
            gkeMode,
            gkeLocation: clusterRegion,
            releaseChannel,
            network: 'default',
            enablePrivateNodes: privateNodes,
            enableWorkloadIdentity: workloadIdentity,
            enableShieldedNodes: true,
            enableBinaryAuth: binaryAuth,
            nodeMachineType:
              gkeMode === 'STANDARD'
                ? selectedGpu.machineType
                : 'e2-standard-4',
            initialNodeCount: Math.min(8, Math.max(1, Number(gpuCount) || 1)),
            spotNodes: useSpotGpu,
            gpuAcceleratorType:
              gkeMode === 'STANDARD' ? selectedGpu.flag : 'NONE',
            gpuAcceleratorCount: 1,
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Provisioning GKE Cluster ${clusterName} on GCP`
        );
      }
      await fetchGkeFleet();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error || 'Failed to provision GKE cluster'
        );
      }
    } finally {
      setCreatingGke(false);
    }
  };

  const handleDeleteGkeCluster = async (loc, cName) => {
    if (!loc || !cName || deletingGkeName) return;
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/gke/clusters/${encodeURIComponent(loc)}/${encodeURIComponent(cName)}`,
        {
          __onGatekeeperConfirmed: () => {
            setDeletingGkeName(cName);
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Decommissioning GKE cluster ${cName}`
        );
      }
      await fetchGkeFleet();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error || `Failed to delete GKE cluster ${cName}`
        );
      }
    } finally {
      setDeletingGkeName('');
    }
  };

  // Strict Compliance Locks
  const isCustom = gkeBlueprint === 'custom';
  const isGdpr = gkeBlueprint === 'gdpr-eu-ai-cluster';
  const isUsOnly =
    gkeBlueprint === 'zero-trust-autopilot' ||
    gkeBlueprint === 'hipaa-clinical-k8s';
  const isZeroTrustEnclave =
    gkeBlueprint === 'zero-trust-autopilot' ||
    gkeBlueprint === 'gdpr-eu-ai-cluster' ||
    gkeBlueprint === 'hipaa-clinical-k8s';

  // GPU FinOps math
  const selectedGpuObj = GPU_SKUS[gpuSku] || GPU_SKUS['nvidia-l4'];
  const monthlyOnDemandUsd = Math.round(
    selectedGpuObj.onDemandHr * gpuCount * 730
  );
  const monthlySpotUsd = Math.round(selectedGpuObj.spotHr * gpuCount * 730);
  const monthlyGpuSavingsUsd = monthlyOnDemandUsd - monthlySpotUsd;

  const gkeCli =
    gkeMode === 'AUTOPILOT'
      ? `gcloud container clusters create-auto ${clusterName} \\
  --region=${clusterRegion} \\
  --release-channel=${releaseChannel.toLowerCase()} \\
  ${privateNodes ? '--enable-private-nodes \\\n  ' : ''}${
          binaryAuth
            ? '--binauthz-evaluation-mode=PROJECT_SINGLETON_POLICY_ENFORCE \\\n  '
            : ''
        }${
          workloadIdentity
            ? `--workload-pool=${projectId}.svc.id.goog \\\n  `
            : ''
        }--project=${projectId}`
      : `gcloud container clusters create ${clusterName} \\
  --location=${clusterRegion} \\
  --release-channel=${releaseChannel.toLowerCase()} \\
  --machine-type=${selectedGpuObj.machineType} \\
  --num-nodes=${Math.min(8, Math.max(1, Number(gpuCount) || 1))} \\
  ${useSpotGpu ? '--spot \\\n  ' : ''}--accelerator=type=${
          selectedGpuObj.flag
        },count=1 \\
  --enable-shielded-nodes \\
  ${
    workloadIdentity ? `--workload-pool=${projectId}.svc.id.goog \\\n  ` : ''
  }--project=${projectId}`;

  const k8sYamlManifest = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  namespace: ${appNamespace}
  labels:
    app: ${appName}
    managed-by: cloudpulse-2026
spec:
  replicas: ${appReplicas}
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      securityContext:
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: ${appName}
          image: ${appImage}
          ports:
            - containerPort: ${appPort}
          resources:
            requests:
              cpu: "${appCpuReq}"
              memory: "${appMemReq}"${
    appGpuCount > 0 ? `\n              nvidia.com/gpu: "${appGpuCount}"` : ''
  }
            limits:
              cpu: "${appCpuReq}"
              memory: "${appMemReq}"${
    appGpuCount > 0 ? `\n              nvidia.com/gpu: "${appGpuCount}"` : ''
  }
---
apiVersion: v1
kind: Service
metadata:
  name: ${appName}-svc
  namespace: ${appNamespace}
spec:
  type: LoadBalancer
  selector:
    app: ${appName}
  ports:
    - protocol: TCP
      port: 80
      targetPort: ${appPort}`;

  const clustersList = gkeData?.clusters || [];
  const autopilotCount = clustersList.filter((c) => c.autopilot).length;

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                DEDICATED GOOGLE KUBERNETES ENGINE (GKE) AUTOPILOT & SPOT GPU STUDIO
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              GKE Autopilot, Spot GPU Node-Pools & Zero-Trust K8s Enclave Studio
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Direct live `container.googleapis.com/v1` cluster provisioning & fleet management with strict SEC / GDPR / HIPAA compliance locks (``), Workload Identity OIDC (`*.svc.id.goog`), Binary Authorization, and Spot GPU FinOps.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenProvisionGke && (
              <button
                type="button"
                data-feature-id="GKE_CREATE_CLUSTER_WIZARD"
                onClick={onOpenProvisionGke}
                title="Open the full 5-Step GKE Compliance & Architecture Wizard in the Provisioning Modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-colors shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create GKE Cluster (5-Step Wizard)</span>
              </button>
            )}

            <button
              type="button"
              data-feature-id="GKE_REFRESH_FLEET"
              onClick={fetchGkeFleet}
              title="Refresh live GKE clusters and Vertex AI endpoints from container.googleapis.com"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingGke ? 'animate-spin text-zinc-500 dark:text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              />
              <span>Refresh GKE Fleet</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Live GKE Clusters
            </div>
            <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {clustersList.length} Cluster(s) ({autopilotCount} Autopilot)
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
              container.googleapis.com/v1
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              GKE Free Tier Management Credit
            </div>
            <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              $74.40/mo Covered
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              $0.00/hr idle fee on 1st Zonal/Autopilot cluster
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Workload Identity OIDC Pool
            </div>
            <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1 truncate font-mono">
              {projectId}.svc.id.goog
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              Zero static JSON SA keys required
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Spot GPU Node-Pool FinOps
            </div>
            <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              -${monthlyGpuSavingsUsd.toLocaleString()}/mo (-68%)
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              {gpuCount}x {selectedGpuObj.flag} Spot vs On-Demand
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          {
            id: 'FLEET_DEPLOY',
            label: 'Live GKE Fleet & 1-Click Cluster Provisioner',
            icon: Cpu,
          },
          {
            id: 'WORKLOAD_YAML',
            label: 'K8s Workload & GPU Pod YAML Deployer',
            icon: FileCode,
          },
          {
            id: 'GPU_FINOPS',
            label: 'Spot GPU & AI Node-Pool FinOps Calculator',
            icon: Zap,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              data-feature-id={`GKE_TAB_${t.id}`}
              onClick={() => setActiveSubTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-bold border transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-[#16161a] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================
          SUB-TAB 1: LIVE GKE FLEET & 1-CLICK CLUSTER PROVISIONER
         =================================================================== */}
      {activeSubTab === 'FLEET_DEPLOY' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: 1-Click Live GKE Cluster Provisioner with Strict Compliance Locks */}
          <form
            onSubmit={handleCreateGkeCluster}
            className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>1-Click GKE Compliance & Cluster Deployer</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                {isCustom
                  ? 'UNLOCKED CUSTOM'
                  : `ENFORCING ${gkeBlueprint.toUpperCase()}`}
              </span>
            </div>

            {/* 5 Compliance Blueprint Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                {
                  id: 'zero-trust-autopilot',
                  label: 'SEC / FedRAMP',
                  sub: 'Autopilot · US',
                },
                {
                  id: 'gdpr-eu-ai-cluster',
                  label: 'GDPR EU Sovereign',
                  sub: 'Autopilot · EU',
                },
                {
                  id: 'hipaa-clinical-k8s',
                  label: 'HIPAA Clinical',
                  sub: 'Autopilot · STABLE',
                },
                {
                  id: 'ai-spot-gpu-standard',
                  label: 'AI Spot GPU Pool',
                  sub: 'Standard · L4 -68%',
                },
                {
                  id: 'custom',
                  label: 'Custom Mode',
                  sub: 'Full Manual Control',
                },
              ].map((bp) => {
                const active = gkeBlueprint === bp.id;
                return (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => applyGkeBlueprint(bp.id)}
                    title={`Select ${bp.label} GKE Blueprint (${bp.sub})`}
                    className={`p-2 rounded-[8px] border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">
                      {bp.label}
                    </div>
                    <div
                      className={`text-[9.5px] truncate ${
                        active ? 'text-blue-100' : 'text-zinc-500'
                      }`}
                    >
                      {bp.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  GKE Cluster Name
                </label>
                <input
                  type="text"
                  required
                  value={clusterName}
                  onChange={(e) => setClusterName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Operation Mode {isZeroTrustEnclave ? '[LOCKED]' : ''}
                </label>
                <select
                  value={gkeMode}
                  disabled={isZeroTrustEnclave}
                  onChange={(e) => setGkeMode(e.target.value)}
                  title={
                    isZeroTrustEnclave
                      ? 'Locked to GKE Autopilot by Zero-Trust Enclave Blueprint'
                      : 'Choose GKE Autopilot ($0.00 idle nodes) or GKE Standard (Custom GPU node pools)'
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60"
                >
                  <option value="AUTOPILOT">AUTOPILOT (Serverless K8s)</option>
                  <option value="STANDARD">STANDARD (Custom GPU Nodes)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Sovereign Region {!isCustom ? '[LOCKED]' : ''}
                </label>
                <select
                  value={clusterRegion}
                  onChange={(e) => setClusterRegion(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="us-central1" disabled={isGdpr}>
                    {isGdpr ? '[LOCKED] ' : ''}us-central1 (Iowa — Low Carbon)
                  </option>
                  <option value="us-east4" disabled={isGdpr}>
                    {isGdpr ? '[LOCKED] ' : ''}us-east4 (N. Virginia — FedRAMP/HIPAA)
                  </option>
                  <option value="us-west1" disabled={isGdpr}>
                    {isGdpr ? '[LOCKED] ' : ''}us-west1 (Oregon — Hydroelectric)
                  </option>
                  <option value="europe-west1" disabled={isUsOnly}>
                    {isUsOnly ? '[LOCKED] ' : ''}europe-west1 (Belgium — EU GDPR)
                  </option>
                  <option value="europe-west4" disabled={isUsOnly}>
                    {isUsOnly ? '[LOCKED] ' : ''}europe-west4 (Netherlands — EU AI Hub)
                  </option>
                  <option value="europe-west3" disabled={isUsOnly}>
                    {isUsOnly ? '[LOCKED] ' : ''}europe-west3 (Frankfurt — EU BaFin)
                  </option>
                </select>
              </div>
            </div>

            {/* Security Hardening Toggles with Compliance Locks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <label
                title={
                  isZeroTrustEnclave
                    ? 'Locked ON by Zero-Trust Compliance Blueprint'
                    : 'Isolate worker nodes from public internet IPv4 addresses'
                }
                className={`flex items-center gap-2 p-2 rounded-[8px] border text-xs font-mono ${
                  isZeroTrustEnclave
                    ? 'bg-emerald-500/5 border-emerald-500/30 cursor-not-allowed'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={privateNodes}
                  disabled={isZeroTrustEnclave}
                  onChange={(e) => setPrivateNodes(e.target.checked)}
                />
                <span className="truncate">
                  Private Nodes {isZeroTrustEnclave ? '[LOCKED]' : ''}
                </span>
              </label>

              <label
                title={
                  !isCustom
                    ? 'Locked ON: Workload Identity eliminates static JSON keys'
                    : 'Enable OIDC Workload Identity Federation (*.svc.id.goog)'
                }
                className={`flex items-center gap-2 p-2 rounded-[8px] border text-xs font-mono ${
                  !isCustom
                    ? 'bg-emerald-500/5 border-emerald-500/30 cursor-not-allowed'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={workloadIdentity}
                  disabled={!isCustom}
                  onChange={(e) => setWorkloadIdentity(e.target.checked)}
                />
                <span className="truncate">
                  Workload ID {!isCustom ? '[LOCKED]' : ''}
                </span>
              </label>

              <label
                title={
                  isZeroTrustEnclave
                    ? 'Locked ON: Cryptographic Binary Authorization required'
                    : 'Enforce Binary Authorization container image attestation'
                }
                className={`flex items-center gap-2 p-2 rounded-[8px] border text-xs font-mono ${
                  isZeroTrustEnclave
                    ? 'bg-emerald-500/5 border-emerald-500/30 cursor-not-allowed'
                    : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={binaryAuth}
                  disabled={isZeroTrustEnclave}
                  onChange={(e) => setBinaryAuth(e.target.checked)}
                />
                <span className="truncate">
                  Binary Auth {isZeroTrustEnclave ? '[LOCKED]' : ''}
                </span>
              </label>
            </div>

            <div className="p-2.5 rounded-[8px] bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10.5px] overflow-x-auto">
              {gkeCli}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="submit"
                disabled={creatingGke || !clusterName.trim()}
                className="w-full py-2.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {creatingGke
                  ? 'Provisioning Live GKE Cluster...'
                  : `Create Live GKE ${gkeMode} Cluster`}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(gkeCli, 'GKE gcloud CLI')}
                className="w-full py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                {copiedLabel === 'GKE gcloud CLI'
                  ? '✓ Copied gcloud CLI'
                  : 'Copy Equivalent gcloud CLI'}
              </button>
            </div>
          </form>

          {/* Right: Live GKE Clusters Fleet Inspector */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live GKE Clusters in `{projectId}` ({clustersList.length})
              </div>
              {onOpenProvisionGke && (
                <button
                  type="button"
                  onClick={onOpenProvisionGke}
                  className="text-xs font-mono font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  + Full 5-Step Wizard →
                </button>
              )}
            </div>

            {clustersList.length > 0 ? (
              <div className="space-y-2.5">
                {clustersList.map((c) => {
                  const kubeCmd = `gcloud container clusters get-credentials ${c.name} --location=${c.location} --project=${projectId}`;
                  return (
                    <div
                      key={`${c.location}-${c.name}`}
                      className="p-3 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <span>{c.name}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px]">
                              {c.autopilot ? 'AUTOPILOT' : 'STANDARD'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px]">
                              {c.status}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                            Location: {c.location} · K8s v
                            {c.currentMasterVersion || '1.30'} · Nodes:{' '}
                            {c.currentNodeCount ?? 0} · Security Posture:{' '}
                            {c.postureScore}/100
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(kubeCmd, `kubeconfig (${c.name})`)
                            }
                            title={`Copy: ${kubeCmd}`}
                            className="px-2 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-[10px] font-mono font-bold cursor-pointer"
                          >
                            kubeconfig
                          </button>
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() => onRunInShell(kubeCmd)}
                              title="Connect kubectl in Web Cloud Shell"
                              className="px-2 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-[10px] font-mono font-bold cursor-pointer"
                            >
                              Shell
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={deletingGkeName === c.name}
                            onClick={() =>
                              handleDeleteGkeCluster(c.location, c.name)
                            }
                            title={`Delete GKE Cluster ${c.name}`}
                            className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] font-mono font-bold cursor-pointer disabled:opacity-50"
                          >
                            {deletingGkeName === c.name ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 rounded-[10px] border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2.5">
                <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  No active GKE clusters running in `{projectId}` ($0.00/hr Kubernetes burn)
                </div>
                <p className="text-[11px] font-mono text-zinc-500 max-w-md mx-auto">
                  Use the <strong>1-Click GKE Compliance Deployer</strong> on the left or open the <strong>5-Step GKE Compliance Wizard</strong> to launch an Autopilot or Spot GPU cluster.
                </p>
                {onOpenProvisionGke && (
                  <button
                    type="button"
                    onClick={onOpenProvisionGke}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Launch 5-Step GKE Compliance Wizard</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 2: K8S WORKLOAD & GPU POD YAML MANIFEST DEPLOYER
         =================================================================== */}
      {activeSubTab === 'WORKLOAD_YAML' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5">
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>Zero-Trust Kubernetes Deployment & GPU Pod Composer</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(WORKLOAD_TEMPLATES).map(([k, tpl]) => {
                const active = workloadPreset === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => applyWorkloadTemplate(k)}
                    className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold line-clamp-1">
                      {tpl.title}
                    </div>
                    <div
                      className={`text-[10px] mt-0.5 line-clamp-2 ${
                        active ? 'text-blue-100' : 'text-zinc-500'
                      }`}
                    >
                      {tpl.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Deployment Name
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Namespace
                </label>
                <input
                  type="text"
                  value={appNamespace}
                  onChange={(e) => setAppNamespace(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Pod Replicas
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={appReplicas}
                  onChange={(e) =>
                    setAppReplicas(Math.max(1, Number(e.target.value || 1)))
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* 3-Way Container Image Source Selector */}
            <div className="p-3 rounded-[10px] border border-blue-500/30 bg-blue-500/5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-extrabold font-mono uppercase tracking-wider text-blue-400">
                  Container Source (Artifact Registry · GitHub Repo · Custom URI)
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {arImages.length} Image(s) in Project Artifact Registry
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  {
                    id: 'ARTIFACT_REGISTRY',
                    label: 'Project Artifact Registry',
                    sub: `Pick from ${arImages.length} live GCP image(s)`,
                  },
                  {
                    id: 'GITHUB_REPO',
                    label: 'Build from GitHub Repo',
                    sub: 'Cloud Build → AR → GKE Deploy',
                  },
                  {
                    id: 'PUBLIC_URI',
                    label: 'Public / Custom URI',
                    sub: 'Docker Hub / GCR / Custom URI',
                  },
                ].map((m) => {
                  const active = containerSourceMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setContainerSourceMode(m.id)}
                      className={`p-2 rounded-[8px] border text-left transition-all cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="text-[11px] font-bold">{m.label}</div>
                      <div
                        className={`text-[9.5px] mt-0.5 ${
                          active ? 'text-blue-100' : 'text-zinc-500'
                        }`}
                      >
                        {m.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              {containerSourceMode === 'ARTIFACT_REGISTRY' && (
                <div className="space-y-2">
                  {arImages.length > 0 ? (
                    <div>
                      <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                        Select Container from `{projectId}` Artifact Registry:
                      </label>
                      <select
                        value={appImage}
                        onChange={(e) => setAppImage(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      >
                        {arImages.map((img, i) => {
                          const tag = img.tags?.[0] || 'latest';
                          const fullUri = `${img.uri}:${tag}`;
                          return (
                            <option key={`${img.uri}-${i}`} value={fullUri}>
                              {fullUri} ({img.sizeMb} MB · {img.location})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-[8px] border border-dashed border-zinc-300 dark:border-zinc-700 text-[11px] font-mono text-zinc-500 flex items-center justify-between gap-2">
                      <span>
                        No images found in `{projectId}` Artifact Registry yet.
                      </span>
                      <button
                        type="button"
                        onClick={() => setContainerSourceMode('GITHUB_REPO')}
                        className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        Build from GitHub →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {containerSourceMode === 'GITHUB_REPO' && (
                <div className="space-y-2.5 pt-1 border-t border-blue-500/20">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        GitHub Repository HTTPS URL
                      </label>
                      <input
                        type="text"
                        value={ghRepoUrl}
                        onChange={(e) => setGhRepoUrl(e.target.value)}
                        placeholder="https://github.com/owner/repo.git"
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        Branch & Context Dir
                      </label>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          value={ghBranch}
                          onChange={(e) => setGhBranch(e.target.value)}
                          placeholder="main"
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                        <input
                          type="text"
                          value={ghContextDir}
                          onChange={(e) => setGhContextDir(e.target.value)}
                          placeholder="."
                          className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        Cloud Build Method
                      </label>
                      <select
                        value={ghBuildMethod}
                        onChange={(e) => setGhBuildMethod(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="BUILDPACKS">
                          Zero-Dockerfile Buildpacks
                        </option>
                        <option value="DOCKERFILE">Standard Dockerfile</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        Target Artifact Registry Repo
                      </label>
                      <input
                        type="text"
                        value={ghArRepo}
                        onChange={(e) => setGhArRepo(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        Auto-Deploy to GKE Cluster
                      </label>
                      <select
                        value={ghTargetCluster}
                        onChange={(e) => setGhTargetCluster(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      >
                        <option value="">Build Image Only (No Auto-Rollout)</option>
                        {clustersList.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.location})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={triggeringGkeBuild || !ghRepoUrl.trim()}
                    onClick={handleTriggerGithubToGkeBuild}
                    className="w-full py-2 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {triggeringGkeBuild
                      ? 'Submitting Cloud Build Pipeline...'
                      : `Trigger Cloud Build (${ghBuildMethod}) → Push to Artifact Registry${
                          ghTargetCluster
                            ? ` → Rollout to GKE (${ghTargetCluster})`
                            : ''
                        }`}
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                  Active Container Image URI (Injected into K8s `deployment.yaml`)
                </label>
                <input
                  type="text"
                  value={appImage}
                  onChange={(e) => setAppImage(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  CPU Request
                </label>
                <input
                  type="text"
                  value={appCpuReq}
                  onChange={(e) => setAppCpuReq(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Memory Request
                </label>
                <input
                  type="text"
                  value={appMemReq}
                  onChange={(e) => setAppMemReq(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  GPU (`nvidia.com/gpu`)
                </label>
                <input
                  type="number"
                  min={0}
                  max={8}
                  value={appGpuCount}
                  onChange={(e) =>
                    setAppGpuCount(Math.max(0, Number(e.target.value || 0)))
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 font-mono">
                Generated Seccomp-Hardened K8s Manifest (`deployment.yaml`)
              </span>
              <button
                type="button"
                onClick={() => handleCopy(k8sYamlManifest, 'K8s Manifest YAML')}
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                Copy YAML Manifest
              </button>
            </div>
            <pre className="p-3 rounded-[8px] bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10.5px] overflow-x-auto max-h-80">
              {k8sYamlManifest}
            </pre>
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 3: SPOT GPU & AI NODE-POOL FINOPS CALCULATOR
         =================================================================== */}
      {activeSubTab === 'GPU_FINOPS' && (
        <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
              <span>GKE Spot GPU vs. On-Demand Node-Pool FinOps Calculator</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              Spot GPU Savings: -${monthlyGpuSavingsUsd.toLocaleString()}/month
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Select NVIDIA GPU Accelerator SKU
              </label>
              <select
                value={gpuSku}
                onChange={(e) => setGpuSku(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {Object.entries(GPU_SKUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                GPU Node Count (`1–16 Nodes`)
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={gpuCount}
                onChange={(e) =>
                  setGpuCount(
                    Math.max(1, Math.min(16, Number(e.target.value || 1)))
                  )
                }
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 font-mono">
            <div>
              <div className="text-xs text-zinc-500">On-Demand 24/7 Burn</div>
              <div className="text-lg font-extrabold text-red-400 mt-0.5">
                ${monthlyOnDemandUsd.toLocaleString()}/mo
              </div>
              <div className="text-[11px] text-zinc-500">
                ${(selectedGpuObj.onDemandHr * gpuCount).toFixed(2)}/hr
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-500">Spot Preemptible GPU (-68%)</div>
              <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
                ${monthlySpotUsd.toLocaleString()}/mo
              </div>
              <div className="text-[11px] text-zinc-500">
                ${(selectedGpuObj.spotHr * gpuCount).toFixed(2)}/hr
              </div>
            </div>

            <div>
              <div className="text-xs text-zinc-500">Net Monthly FinOps Savings</div>
              <div className="text-lg font-extrabold text-blue-400 mt-0.5">
                -${monthlyGpuSavingsUsd.toLocaleString()}/mo
              </div>
              <div className="text-[11px] text-emerald-400">
                -${(monthlyGpuSavingsUsd * 12).toLocaleString()}/yr saved
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
