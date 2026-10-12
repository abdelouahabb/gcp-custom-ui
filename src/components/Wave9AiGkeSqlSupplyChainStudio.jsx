import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  PackageCheck,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Rocket,
  Cpu,
  GitBranch,
  Play,
  ExternalLink,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

export default function Wave9AiGkeSqlSupplyChainStudio({
  projectId,
  onTriggerToast,
  onRefreshOverview,
}) {
  const [activeSubTab, setActiveSubTab] = useState('CLOUD_BUILD_GITHUB');
  const [copiedText, setCopiedText] = useState('');

  // --- Sub-Tab 1: Cloud Build & GitHub-to-Container CI/CD State ---
  const [cbData, setCbData] = useState(null);
  const [loadingCb, setLoadingCb] = useState(false);
  const [triggeringBuild, setTriggeringBuild] = useState(false);
  const [cbBlueprint, setCbBlueprint] = useState('slsa3-verified');
  const [gitUrl, setGitUrl] = useState(
    'https://github.com/GoogleCloudPlatform/cloud-run-hello.git'
  );
  const [gitBranch, setGitBranch] = useState('main');
  const [contextDir, setContextDir] = useState('.');
  const [buildMode, setBuildMode] = useState('DOCKERFILE'); // DOCKERFILE | BUILDPACKS
  const [dockerfilePath, setDockerfilePath] = useState('Dockerfile');
  const [arLocation, setArLocation] = useState('us-central1');
  const [arRepository, setArRepository] = useState('cloudpulse-containers');
  const [imageName, setImageName] = useState('cloudpulse-service');
  const [imageTag, setImageTag] = useState('v1.0.0');
  const [deployTarget, setDeployTarget] = useState('CLOUD_RUN'); // NONE | CLOUD_RUN | GKE
  const [cloudRunService, setCloudRunService] = useState('cloudpulse-github-app');
  const [cloudRunPort, setCloudRunPort] = useState(8080);
  const [gkeCluster, setGkeCluster] = useState('cloudpulse-autopilot-prod');
  const [gkeDeployment, setGkeDeployment] = useState('cloudpulse-web');
  const [gkeNamespace, setGkeNamespace] = useState('default');
  const [machineType, setMachineType] = useState('E2_HIGHCPU_8');
  const [slsaProvenance, setSlsaProvenance] = useState(true);
  const [immutableRepo, setImmutableRepo] = useState(true);

  // --- Sub-Tab 2: Artifact Registry & Supply Chain State ---
  const [arData, setArData] = useState(null);
  const [loadingAr, setLoadingAr] = useState(false);
  const [arBlueprint, setArBlueprint] = useState('slsa3-immutable');
  const [repoId, setRepoId] = useState('');
  const [repoLocation, setRepoLocation] = useState('us-central1');
  const [repoFormat, setRepoFormat] = useState('DOCKER');
  const [immutableTags, setImmutableTags] = useState(true);
  const [creatingRepo, setCreatingRepo] = useState(false);
  const [deletingDigestName, setDeletingDigestName] = useState(null);
  const [confirmDigestName, setConfirmDigestName] = useState(null);
  const [sweepingOrphans, setSweepingOrphans] = useState(false);
  const [confirmSweepAll, setConfirmSweepAll] = useState(false);
  const [deletingRepoName, setDeletingRepoName] = useState(null);
  const [confirmRepoName, setConfirmRepoName] = useState(null);

  const handleCopy = (text, label = 'command') => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    if (onTriggerToast) onTriggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const fetchCloudBuild = useCallback(async () => {
    if (!projectId) return;
    setLoadingCb(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/cloud-build/builds`
      );
      setCbData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to load Cloud Build history'
        );
      }
    } finally {
      setLoadingCb(false);
    }
  }, [projectId, onTriggerToast]);

  const fetchSupplyChain = useCallback(async () => {
    if (!projectId) return;
    setLoadingAr(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave9/supply-chain`
      );
      setArData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to load Artifact Registry Supply-Chain'
        );
      }
    } finally {
      setLoadingAr(false);
    }
  }, [projectId, onTriggerToast]);

  useEffect(() => {
    fetchCloudBuild();
    fetchSupplyChain();
  }, [fetchCloudBuild, fetchSupplyChain]);

  const applyCbBlueprint = (bp) => {
    setCbBlueprint(bp);
    if (bp === 'slsa3-verified') {
      setArLocation('us-central1');
      setSlsaProvenance(true);
      setImmutableRepo(true);
      setMachineType('E2_HIGHCPU_8');
    } else if (bp === 'gdpr-eu-build') {
      setArLocation('europe-west1');
      setSlsaProvenance(true);
      setImmutableRepo(true);
      setMachineType('E2_HIGHCPU_8');
    } else if (bp === 'hipaa-clinical-build') {
      setArLocation('us-east4');
      setSlsaProvenance(true);
      setImmutableRepo(true);
      setMachineType('E2_HIGHCPU_32');
    }
  };

  const handleTriggerGitHubBuild = async (e) => {
    e.preventDefault();
    if (!projectId || !gitUrl.trim() || triggeringBuild) return;
    setTriggeringBuild(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloud-build/trigger-github`,
        {
          gitUrl: gitUrl.trim(),
          branch: gitBranch.trim() || 'main',
          contextDir: contextDir.trim() || '.',
          buildMode,
          dockerfilePath: dockerfilePath.trim() || 'Dockerfile',
          arLocation,
          arRepository: arRepository.trim() || 'cloudpulse-containers',
          imageName: imageName.trim() || 'cloudpulse-service',
          imageTag: imageTag.trim() || 'latest',
          deployTarget,
          cloudRunService: cloudRunService.trim(),
          cloudRunRegion: arLocation,
          cloudRunPort: Number(cloudRunPort || 8080),
          allowUnauthenticated: true,
          gkeCluster: gkeCluster.trim(),
          gkeLocation: arLocation,
          gkeDeployment: gkeDeployment.trim(),
          gkeNamespace: gkeNamespace.trim() || 'default',
          gkePort: Number(cloudRunPort || 8080),
          machineType,
          slsaProvenance,
          immutableRepo,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message || 'Triggered live Cloud Build pipeline from GitHub!'
        );
      }
      await Promise.all([fetchCloudBuild(), fetchSupplyChain()]);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to trigger Cloud Build from GitHub repository'
        );
      }
    } finally {
      setTriggeringBuild(false);
    }
  };

  const applyArBlueprint = (bp) => {
    setArBlueprint(bp);
    if (bp === 'slsa3-immutable') {
      setImmutableTags(true);
      setRepoLocation('us-central1');
      setRepoFormat('DOCKER');
    } else if (bp === 'gdpr-eu-registry') {
      setImmutableTags(true);
      setRepoLocation('europe-west1');
      setRepoFormat('DOCKER');
    } else if (bp === 'hipaa-signed-oci') {
      setImmutableTags(true);
      setRepoLocation('us-east4');
      setRepoFormat('DOCKER');
    }
  };

  const handleCreateArRepo = async (e) => {
    e.preventDefault();
    if (!repoId.trim()) return;
    setCreatingRepo(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave9/supply-chain/create-repo`,
        {
          repositoryId: repoId.trim(),
          location: repoLocation,
          format: repoFormat,
          immutableTags,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message || 'Provisioned Artifact Registry repository'
        );
      }
      setRepoId('');
      await fetchSupplyChain();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to create Artifact Registry repository'
        );
      }
    } finally {
      setCreatingRepo(false);
    }
  };

  const handleDeleteDigest = async (img) => {
    if (!projectId || !img) return;
    setDeletingDigestName(img.name);
    setConfirmDigestName(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave9/supply-chain/delete-image`,
        {
          name: img.name,
          uri: img.uri,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            'Deleted container image digest from Artifact Registry'
        );
      }
      await fetchSupplyChain();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to delete container image digest'
        );
      }
    } finally {
      setDeletingDigestName(null);
    }
  };

  const handleSweepAllOrphans = async () => {
    const orphans = (arData?.images || []).filter((i) => i.isOrphan);
    if (!projectId || orphans.length === 0) return;
    setSweepingOrphans(true);
    setConfirmSweepAll(false);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave9/supply-chain/sweep-orphans`,
        {
          orphans: orphans.map((o) => ({ name: o.name, uri: o.uri })),
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message || `Swept ${orphans.length} untagged orphan digests`
        );
      }
      await fetchSupplyChain();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to sweep untagged orphan digests'
        );
      }
    } finally {
      setSweepingOrphans(false);
    }
  };

  const handleDeleteRepository = async (repo) => {
    if (!projectId || !repo) return;
    setDeletingRepoName(repo.name);
    setConfirmRepoName(null);
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave9/supply-chain/repositories/${encodeURIComponent(
          repo.location
        )}/${encodeURIComponent(repo.shortName)}`
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            `Deleted Artifact Registry repository ${repo.shortName}`
        );
      }
      await fetchSupplyChain();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            `Failed to delete repository ${repo.shortName}`
        );
      }
    } finally {
      setDeletingRepoName(null);
    }
  };

  // Strict compliance lock booleans
  const isCbCustom = cbBlueprint === 'custom';
  const isCbGdpr = cbBlueprint === 'gdpr-eu-build';
  const isCbUsOnly =
    cbBlueprint === 'slsa3-verified' || cbBlueprint === 'hipaa-clinical-build';

  const isArCustom = arBlueprint === 'custom';
  const isArGdpr = arBlueprint === 'gdpr-eu-registry';
  const isArUsOnly =
    arBlueprint === 'slsa3-immutable' || arBlueprint === 'hipaa-signed-oci';
  const orphanImages = (arData?.images || []).filter((i) => i.isOrphan);

  const targetImageUriPreview = `${arLocation}-docker.pkg.dev/${projectId}/${
    arRepository.trim() || 'cloudpulse-containers'
  }/${imageName.trim() || 'cloudpulse-service'}:${imageTag.trim() || 'v1.0.0'}`;

  const cloudBuildYamlPreview = `# Generated by CloudPulse 2026 · GitHub → Cloud Build → Artifact Registry${
    deployTarget !== 'NONE' ? ` → ${deployTarget}` : ''
  }
steps:
  - id: 'clone-github-repository'
    name: 'gcr.io/cloud-builders/git'
    args: ['clone', '--depth', '1', '--branch', '${gitBranch}', '${gitUrl}', '/workspace/repo']
${
  buildMode === 'BUILDPACKS'
    ? `  - id: 'buildpack-compile-and-push'
    name: 'gcr.io/k8s-skaffold/pack'
    dir: '/workspace/repo${contextDir !== '.' ? '/' + contextDir : ''}'
    args: ['build', '${targetImageUriPreview}', '--builder=gcr.io/buildpacks/builder:latest', '--publish']`
    : `  - id: 'docker-build-image'
    name: 'gcr.io/cloud-builders/docker'
    dir: '/workspace/repo${contextDir !== '.' ? '/' + contextDir : ''}'
    args: ['build', '-t', '${targetImageUriPreview}', '-f', '${dockerfilePath}', '.']
  - id: 'docker-push-artifact-registry'
    name: 'gcr.io/cloud-builders/docker'
    args: ['push', '${targetImageUriPreview}']`
}${
    deployTarget === 'CLOUD_RUN'
      ? `
  - id: 'deploy-to-cloud-run'
    name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: ['run', 'deploy', '${cloudRunService}', '--image=${targetImageUriPreview}', '--region=${arLocation}', '--port=${cloudRunPort}', '--allow-unauthenticated']`
      : deployTarget === 'GKE'
      ? `
  - id: 'deploy-to-gke-cluster'
    name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        gcloud container clusters get-credentials "${gkeCluster}" --location="${arLocation}" --project="${projectId}"
        kubectl set image deployment/${gkeDeployment} *=${targetImageUriPreview} -n ${gkeNamespace}`
      : ''
  }
options:
  logging: CLOUD_LOGGING_ONLY
  machineType: '${machineType}'${
    slsaProvenance ? `\n  requestedVerifyOption: 'VERIFIED'` : ''
  }`;

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                GITHUB → GOOGLE CLOUD BUILD (`cloudbuild.googleapis.com`) → ARTIFACT REGISTRY → CLOUD RUN / GKE
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Cloud Build CI/CD, GitHub Repo Builder & Artifact Registry SBOM Studio
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Clone any GitHub repository into Google Cloud Build (`Dockerfile` or Zero-Dockerfile `Google Buildpacks`), push SLSA-3 attested images into `artifactregistry.googleapis.com/v1`, auto-deploy straight to Cloud Run or GKE, and sweep untagged orphan digests in 1 click.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchCloudBuild();
              fetchSupplyChain();
            }}
            title="Refresh live Cloud Build jobs and Artifact Registry container digests"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingCb || loadingAr ? 'animate-spin text-zinc-500 dark:text-zinc-400' : ''
              }`}
            />
            <span>Sync Build & Registry</span>
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          {[
            {
              id: 'CLOUD_BUILD_GITHUB',
              label:
                '1. GitHub → Cloud Build → Artifact Registry → Cloud Run / GKE',
              badge: `${cbData?.summary?.totalBuilds || 0} Builds`,
              tip: 'Build container images directly from a GitHub repository via Google Cloud Build and push to Artifact Registry + deploy to Cloud Run or GKE',
            },
            {
              id: 'SUPPLY_CHAIN_AR',
              label:
                '2. Artifact Registry Repositories & 1-Click Orphan Digest Sweeper',
              badge: `${arData?.summary?.totalImagesCount || 0} Digests (${
                arData?.summary?.orphanDigestCount || 0
              } Orphans)`,
              tip: 'Inspect live Artifact Registry repositories and container digests, sweep untagged orphans in 1 click, and enforce immutable tag locks',
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
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active
                      ? 'bg-black/30 text-blue-100'
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
          SUB-TAB 1: GITHUB -> CLOUD BUILD -> ARTIFACT REGISTRY -> CLOUD RUN / GKE
         ===================================================================== */}
      {activeSubTab === 'CLOUD_BUILD_GITHUB' && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]">
              <div className="text-[11px] font-mono text-zinc-500">
                Recent Cloud Builds
              </div>
              <div className="text-2xl font-black text-blue-500 mt-1">
                {cbData?.summary?.totalBuilds ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Active / Queued: {cbData?.summary?.workingBuilds ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-emerald-500/30 bg-emerald-500/5">
              <div className="text-[11px] font-mono text-emerald-400">
                Succeeded Builds
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {cbData?.summary?.successBuilds ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Failed: {cbData?.summary?.failedBuilds ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-blue-500/30 bg-blue-500/5">
              <div className="text-[11px] font-mono text-blue-400">
                Artifact Registry Images Ready
              </div>
              <div className="text-2xl font-black text-blue-400 mt-1">
                {arData?.summary?.totalImagesCount ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Across {arData?.summary?.repositoriesCount ?? 0} Repo(s)
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-blue-500/30 bg-blue-500/5">
              <div className="text-[11px] font-mono text-blue-400">
                Cloud Build Free Tier
              </div>
              <div className="text-2xl font-black text-blue-400 mt-1">
                120 min/day
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                SLSA Level 3 Provenance Ready
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 7 Cols: GitHub -> Cloud Build -> Artifact Registry -> Cloud Run/GKE Form */}
            <form
              onSubmit={handleTriggerGitHubBuild}
              className="lg:col-span-7 p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>
                    1-Click GitHub Repo → Cloud Build → Artifact Registry Pipeline
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-mono">
                  SLSA L3 Provenance Lock
                </span>
              </div>

              {/* Step 0: Compliance Blueprints */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    id: 'slsa3-verified',
                    label: 'SLSA L3 Attested',
                    desc: 'Locks US + VERIFIED provenance',
                  },
                  {
                    id: 'gdpr-eu-build',
                    label: 'GDPR EU Build',
                    desc: 'Locks europe-west1 + Immutable',
                  },
                  {
                    id: 'hipaa-clinical-build',
                    label: 'HIPAA BAA Build',
                    desc: 'Locks us-east4 + 32-vCPU + SLSA',
                  },
                  {
                    id: 'custom',
                    label: 'Custom Pipeline',
                    desc: 'Unlocks all regions & options',
                  },
                ].map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => applyCbBlueprint(bp.id)}
                    className={`p-2 rounded-[8px] border text-left cursor-pointer ${
                      cbBlueprint === bp.id
                        ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{bp.label}</div>
                    <div className="text-[9.5px] font-mono text-zinc-400 mt-0.5">
                      {bp.desc}
                    </div>
                  </button>
                ))}
              </div>

              {/* Step 1: GitHub Repository URL, Branch & Context Dir */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    GitHub Repository HTTPS URL
                  </label>
                  <input
                    type="text"
                    required
                    value={gitUrl}
                    onChange={(e) => setGitUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo.git"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Branch / Tag
                  </label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    placeholder="main"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Context Dir
                  </label>
                  <input
                    type="text"
                    value={contextDir}
                    onChange={(e) => setContextDir(e.target.value)}
                    placeholder="."
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Step 2: Build Strategy (Dockerfile vs Zero-Dockerfile Google Cloud Buildpacks) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setBuildMode('DOCKERFILE')}
                  className={`p-2.5 rounded-[8px] border text-left cursor-pointer ${
                    buildMode === 'DOCKERFILE'
                      ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center justify-between">
                    <span>Standard Dockerfile Build</span>
                    <span className="text-[10px] font-mono text-blue-400">
                      gcr.io/cloud-builders/docker
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    Builds using your repository&apos;s `Dockerfile` with full SLSA L3 attestation.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBuildMode('BUILDPACKS')}
                  className={`p-2.5 rounded-[8px] border text-left cursor-pointer ${
                    buildMode === 'BUILDPACKS'
                      ? 'bg-emerald-600/15 border-emerald-500 text-zinc-900 dark:text-zinc-100'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center justify-between">
                    <span>Zero-Dockerfile Google Buildpacks</span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      Auto-Detect Language
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    No Dockerfile needed! Auto-compiles Node.js, Python, Go, Java, or Rust into an OCI image.
                  </div>
                </button>
              </div>

              {/* Step 3: Target Artifact Registry Destination */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Registry Region {!isCbCustom ? '[LOCKED]' : ''}
                  </label>
                  <select
                    value={arLocation}
                    onChange={(e) => setArLocation(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="us-central1" disabled={isCbGdpr}>
                      {isCbGdpr ? '[LOCKED] ' : ''}us-central1 (Iowa)
                    </option>
                    <option value="us-east4" disabled={isCbGdpr}>
                      {isCbGdpr ? '[LOCKED] ' : ''}us-east4 (Virginia)
                    </option>
                    <option value="europe-west1" disabled={isCbUsOnly}>
                      {isCbUsOnly ? '[LOCKED] ' : ''}europe-west1 (EU GDPR)
                    </option>
                    <option value="europe-west3" disabled={isCbUsOnly}>
                      {isCbUsOnly ? '[LOCKED] ' : ''}europe-west3 (Frankfurt)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    AR Repository
                  </label>
                  <input
                    type="text"
                    value={arRepository}
                    onChange={(e) => setArRepository(e.target.value)}
                    placeholder="cloudpulse-containers"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Container Image Name
                  </label>
                  <input
                    type="text"
                    value={imageName}
                    onChange={(e) => setImageName(e.target.value)}
                    placeholder="cloudpulse-service"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Image Tag
                  </label>
                  <input
                    type="text"
                    value={imageTag}
                    onChange={(e) => setImageTag(e.target.value)}
                    placeholder="v1.0.0"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Step 4: Auto-Deploy After Build (Artifact Registry Only vs Cloud Run vs GKE) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-zinc-500">
                  Step 4 · Post-Build Continuous Deployment Target
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'CLOUD_RUN',
                      label: 'Build + Deploy to Cloud Run',
                      sub: 'Runs gcloud run deploy automatically',
                    },
                    {
                      id: 'GKE',
                      label: 'Build + Deploy to GKE Cluster',
                      sub: 'Updates K8s Deployment image in-place',
                    },
                    {
                      id: 'NONE',
                      label: 'Push to Artifact Registry Only',
                      sub: 'Stores OCI image for later use',
                    },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setDeployTarget(t.id)}
                      className={`p-2.5 rounded-[8px] border text-left cursor-pointer ${
                        deployTarget === t.id
                          ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <div className="text-xs font-bold">{t.label}</div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        {t.sub}
                      </div>
                    </button>
                  ))}
                </div>

                {deployTarget === 'CLOUD_RUN' && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        Target Cloud Run Service Name
                      </label>
                      <input
                        type="text"
                        value={cloudRunService}
                        onChange={(e) => setCloudRunService(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        Container Port
                      </label>
                      <input
                        type="number"
                        value={cloudRunPort}
                        onChange={(e) => setCloudRunPort(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}

                {deployTarget === 'GKE' && (
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        Target GKE Cluster Name
                      </label>
                      <input
                        type="text"
                        value={gkeCluster}
                        onChange={(e) => setGkeCluster(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        K8s Deployment Name
                      </label>
                      <input
                        type="text"
                        value={gkeDeployment}
                        onChange={(e) => setGkeDeployment(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                        K8s Namespace
                      </label>
                      <input
                        type="text"
                        value={gkeNamespace}
                        onChange={(e) => setGkeNamespace(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-[8px] bg-zinc-950 border border-zinc-800 text-[10.5px] font-mono text-blue-300 flex items-center justify-between gap-2">
                <span className="truncate">
                  Output Image URI: {targetImageUriPreview}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(targetImageUriPreview, 'Artifact Registry Image URI')
                  }
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] shrink-0 cursor-pointer"
                >
                  Copy URI
                </button>
              </div>

              <button
                type="submit"
                disabled={triggeringBuild || !gitUrl.trim()}
                className="w-full py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {triggeringBuild
                    ? 'Dispatching GitHub → Cloud Build Pipeline...'
                    : `Trigger Live Cloud Build from GitHub${
                        deployTarget === 'CLOUD_RUN'
                          ? ` + Deploy to Cloud Run (${cloudRunService})`
                          : deployTarget === 'GKE'
                          ? ` + Deploy to GKE (${gkeCluster})`
                          : ''
                      }`}
                </span>
              </button>
            </form>

            {/* Right 5 Cols: Live Cloud Build Execution History + cloudbuild.yaml Compiler */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    Live Cloud Build Jobs ({cbData?.builds?.length || 0})
                  </div>
                  <span className="text-[10px] font-mono text-blue-400">
                    cloudbuild.googleapis.com/v1
                  </span>
                </div>

                {(cbData?.builds || []).length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {cbData.builds.map((b) => (
                      <div
                        key={b.id}
                        className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 space-y-1.5 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            Build #{String(b.id).slice(0, 8)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              b.status === 'SUCCESS'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : b.status === 'WORKING' || b.status === 'QUEUED'
                                ? 'bg-blue-500/20 text-blue-300 animate-pulse'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {b.status} · {b.durationSeconds}s
                          </span>
                        </div>
                        {b.images?.length > 0 && (
                          <div className="text-[10px] text-zinc-400 truncate">
                            Image: {b.images[0]}
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[10px] text-zinc-500">
                            {b.machineType} · {b.stepsCount} step(s)
                          </span>
                          <div className="flex items-center gap-1.5">
                            {b.images?.[0] && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(b.images[0], 'Built Image URI')
                                }
                                className="px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 text-[10px] cursor-pointer"
                              >
                                Copy Image URI
                              </button>
                            )}
                            {b.logUrl && (
                              <a
                                href={b.logUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px]"
                              >
                                <span>Logs</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-zinc-500 py-6 text-center">
                    No Cloud Build executions yet in `{projectId}`. Enter a GitHub repository URL on the left and click &quot;Trigger Live Cloud Build from GitHub&quot;!
                  </div>
                )}
              </div>

              {/* Generated cloudbuild.yaml */}
              <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>Generated `cloudbuild.yaml` Pipeline Spec</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(cloudBuildYamlPreview, 'cloudbuild.yaml')
                    }
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-300 text-[10px] font-mono cursor-pointer"
                  >
                    {copiedText === cloudBuildYamlPreview ? (
                      <Check className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy YAML</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded-[8px] bg-zinc-950 text-emerald-300 font-mono text-[10px] overflow-x-auto max-h-52">
                  {cloudBuildYamlPreview}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: ARTIFACT REGISTRY, ORPHAN DIGEST SWEEPER & SLSA-3 STUDIO
         ===================================================================== */}
      {activeSubTab === 'SUPPLY_CHAIN_AR' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Provision Immutable Artifact Registry with Strict Compliance Locks + Live Repositories */}
            <div className="space-y-4">
              <form
                onSubmit={handleCreateArRepo}
                className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <PackageCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>
                      Provision Artifact Registry (`artifactregistry.googleapis.com`)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Tag-Mutation Lock
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'slsa3-immutable',
                      label: 'SEC / FedRAMP Immutable SLSA-3',
                      desc: 'Locks immutableTags=true + US jurisdiction',
                    },
                    {
                      id: 'gdpr-eu-registry',
                      label: 'GDPR EU Sovereign Registry',
                      desc: 'Locks europe-* residency + immutableTags=true',
                    },
                    {
                      id: 'hipaa-signed-oci',
                      label: 'HIPAA Signed Container Vault',
                      desc: 'Locks US BAA region + immutable image tags',
                    },
                    {
                      id: 'custom',
                      label: 'Custom GCP Standard',
                      desc: 'Unlocks mutable tags & all formats',
                    },
                  ].map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => applyArBlueprint(bp.id)}
                      className={`p-2.5 rounded-[8px] border text-left cursor-pointer ${
                        arBlueprint === bp.id
                          ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100'
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
                      Repository ID
                    </label>
                    <input
                      type="text"
                      required
                      value={repoId}
                      onChange={(e) => setRepoId(e.target.value)}
                      placeholder="prod-signed-containers"
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                      Jurisdiction Location {!isArCustom ? '[LOCKED]' : ''}
                    </label>
                    <select
                      value={repoLocation}
                      onChange={(e) => setRepoLocation(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="us-central1" disabled={isArGdpr}>
                        {isArGdpr ? '[LOCKED] ' : ''}us-central1 (Iowa — US Sovereign)
                      </option>
                      <option value="us-east4" disabled={isArGdpr}>
                        {isArGdpr ? '[LOCKED] ' : ''}us-east4 (N. Virginia — US Sovereign)
                      </option>
                      <option value="europe-west1" disabled={isArUsOnly}>
                        {isArUsOnly ? '[LOCKED] ' : ''}europe-west1 (Belgium — EU GDPR)
                      </option>
                      <option value="europe-west3" disabled={isArUsOnly}>
                        {isArUsOnly ? '[LOCKED] ' : ''}europe-west3 (Frankfurt — EU GDPR)
                      </option>
                    </select>
                  </div>
                </div>

                <label
                  className={`flex items-center gap-2 p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold ${
                    !isArCustom
                      ? 'opacity-75 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={immutableTags}
                    disabled={!isArCustom}
                    onChange={(e) => setImmutableTags(e.target.checked)}
                  />
                  <span>
                    Enforce Immutable Image Tags (`dockerConfig.immutableTags = true`){' '}
                    {!isArCustom
                      ? '— Locked ON (Prevents :v1.0 Tag Hijacking)'
                      : ''}
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={creatingRepo || !repoId.trim()}
                  className="w-full py-2 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {creatingRepo
                    ? 'Provisioning Artifact Registry...'
                    : 'Provision SLSA-3 Artifact Registry Repository'}
                </button>
              </form>

              {/* Live Repositories List with 1-Click Delete */}
              <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                    Live Artifact Registry Repositories (
                    {arData?.repositories?.length || 0})
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    1-Click Repository Control
                  </span>
                </div>

                {(arData?.repositories || []).length > 0 ? (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {arData.repositories.map((repo) => (
                      <div
                        key={repo.name}
                        className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-center justify-between gap-2 text-xs font-mono"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 flex-wrap">
                            <span>{repo.shortName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400">
                              {repo.location}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded ${
                                repo.immutableTags
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-amber-500/15 text-amber-400'
                              }`}
                            >
                              {repo.immutableTags
                                ? 'Immutable Tags'
                                : 'Mutable Tags'}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            {repo.imagesCount} Digests ({repo.orphanDigestsCount}{' '}
                            Orphans) · {repo.totalSizeGb} GB · Score{' '}
                            {repo.postureScore}/100
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {confirmRepoName === repo.name ? (
                            <>
                              <button
                                type="button"
                                disabled={deletingRepoName === repo.name}
                                onClick={() => handleDeleteRepository(repo)}
                                className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
                              >
                                {deletingRepoName === repo.name
                                  ? 'Deleting...'
                                  : 'Confirm Delete'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmRepoName(null)}
                                className="px-2 py-1 rounded bg-zinc-700 text-zinc-200 text-[10px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              disabled={deletingRepoName === repo.name}
                              onClick={() => setConfirmRepoName(repo.name)}
                              title={`Delete repository ${repo.shortName} (${repo.location})`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-[10px] font-bold cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete Repo</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-zinc-500 py-4 text-center">
                    No Artifact Registry repositories found in `{projectId}`.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Container Digests & 1-Click Orphan Sweeper */}
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    Live Container Digests ({arData?.images?.length || 0})
                  </div>
                  <div className="text-[10px] font-mono text-amber-400">
                    Untagged Orphans: {arData?.summary?.orphanDigestCount || 0} (
                    {arData?.summary?.orphanSizeGb || 0} GB · $
                    {arData?.summary?.reclaimableMonthlyUsd || 0}/mo waste)
                  </div>
                </div>

                {/* 1-Click Batch Orphan Sweeper Button */}
                {orphanImages.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    {confirmSweepAll ? (
                      <>
                        <button
                          type="button"
                          disabled={sweepingOrphans}
                          onClick={handleSweepAllOrphans}
                          className="px-2.5 py-1.5 rounded-[8px] bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          {sweepingOrphans
                            ? 'Sweeping Orphans...'
                            : `Confirm Sweep (${orphanImages.length})`}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmSweepAll(false)}
                          className="px-2 py-1.5 rounded-[8px] bg-zinc-700 text-zinc-200 text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={sweepingOrphans}
                        onClick={() => setConfirmSweepAll(true)}
                        title="Delete all untagged orphan container digests directly from Artifact Registry"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-extrabold cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          Sweep All {orphanImages.length} Orphans Now
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
                {(arData?.images || []).map((img) => {
                  const isDeletingThis = deletingDigestName === img.name;
                  const isConfirmingThis = confirmDigestName === img.name;
                  const taggedUri =
                    img.tags?.length > 0
                      ? `${img.uri.split('@')[0]}:${img.tags[0]}`
                      : img.uri;
                  return (
                    <div
                      key={img.name}
                      className={`p-2.5 rounded-[8px] border flex items-center justify-between gap-2 text-xs font-mono ${
                        img.isOrphan
                          ? 'border-amber-500/30 bg-amber-500/5'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {img.repository} · {img.sizeMb} MB
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">
                          {img.tags?.length > 0
                            ? `Tags: ${img.tags.join(', ')}`
                            : 'UNTAGGED ORPHAN DIGEST'}
                        </div>
                        <div className="text-[9.5px] text-zinc-400 truncate">
                          {taggedUri}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(taggedUri, 'Artifact Registry Image URI')
                          }
                          title="Copy full Artifact Registry Image URI for Cloud Run or GKE"
                          className="px-2 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-[10px] font-bold cursor-pointer"
                        >
                          Copy URI
                        </button>

                        {isConfirmingThis ? (
                          <>
                            <button
                              type="button"
                              disabled={isDeletingThis}
                              onClick={() => handleDeleteDigest(img)}
                              className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold cursor-pointer"
                            >
                              {isDeletingThis ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDigestName(null)}
                              className="px-2 py-1 rounded bg-zinc-700 text-zinc-200 text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              disabled={isDeletingThis}
                              onClick={() => setConfirmDigestName(img.name)}
                              title={
                                img.isOrphan
                                  ? 'Delete this untagged orphan container digest directly from Artifact Registry'
                                  : 'Delete this container image digest (and its tags) directly from Artifact Registry'
                              }
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold cursor-pointer border ${
                                img.isOrphan
                                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                  : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30'
                              }`}
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>
                                {isDeletingThis
                                  ? 'Deleting...'
                                  : img.isOrphan
                                  ? 'Sweep Now'
                                  : 'Delete'}
                              </span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
