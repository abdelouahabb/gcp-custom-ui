import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  PackageCheck,
  Database,
  Cpu,
  ShieldCheck,
  Lock,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  Trash2,
  Sparkles,
  Server,
  Layers,
  AlertTriangle,
} from 'lucide-react';

const GPU_SKUS = {
  'nvidia-l4': {
    label: 'NVIDIA L4 (24GB VRAM · Ada Lovelace)',
    onDemandHr: 0.81,
    spotHr: 0.26,
    flag: 'nvidia-l4',
  },
  'nvidia-a100-80gb': {
    label: 'NVIDIA A100 (80GB HBM2e · Ampere)',
    onDemandHr: 3.93,
    spotHr: 1.18,
    flag: 'nvidia-a100-80gb',
  },
  'nvidia-h100-80gb': {
    label: 'NVIDIA H100 (80GB HBM3 · Hopper Mega)',
    onDemandHr: 10.8,
    spotHr: 3.35,
    flag: 'nvidia-h100-80gb',
  },
  'tpu-v5litepod': {
    label: 'Google Cloud TPU v5e (16GB HBM · 197 TFLOPS)',
    onDemandHr: 1.2,
    spotHr: 0.36,
    flag: 'tpu-v5-lite-podslice',
  },
};

export default function Wave9AiGkeSqlSupplyChainStudio({
  projectId,
  onTriggerToast,
  onRefreshOverview,
}) {
  const [activeSubTab, setActiveSubTab] = useState('SUPPLY_CHAIN_AR');
  const [copiedText, setCopiedText] = useState('');

  // --- Tab 1: Artifact Registry & Supply Chain State ---
  const [arData, setArData] = useState(null);
  const [loadingAr, setLoadingAr] = useState(false);
  const [arBlueprint, setArBlueprint] = useState('slsa3-immutable');
  const [repoId, setRepoId] = useState('');
  const [repoLocation, setRepoLocation] = useState('us-central1');
  const [repoFormat, setRepoFormat] = useState('DOCKER');
  const [immutableTags, setImmutableTags] = useState(true);
  const [creatingRepo, setCreatingRepo] = useState(false);

  // --- Tab 2: Cloud SQL & AlloyDB Zero-Trust State ---
  const [sqlData, setSqlData] = useState(null);
  const [loadingSql, setLoadingSql] = useState(false);
  const [sqlBlueprint, setSqlBlueprint] = useState('pci-sec-ledger');
  const [sqlName, setSqlName] = useState('cloudpulse-pg16-vault');
  const [sqlEngine, setSqlEngine] = useState('POSTGRES_16');
  const [sqlRegion, setSqlRegion] = useState('us-central1');
  const [sqlAvailability, setSqlAvailability] = useState('REGIONAL');
  const [sqlNetworkMode, setSqlNetworkMode] = useState('PRIVATE_VPC_ONLY');
  const [sqlSslMode, setSqlSslMode] = useState('ENCRYPTED_ONLY');
  const [sqlPitrDays, setSqlPitrDays] = useState(35);
  const [sqlIamAuth, setSqlIamAuth] = useState(true);

  // --- Tab 3: GKE Autopilot & Vertex AI GPU State ---
  const [gkeData, setGkeData] = useState(null);
  const [loadingGke, setLoadingGke] = useState(false);
  const [gkeBlueprint, setGkeBlueprint] = useState('zero-trust-autopilot');
  const [clusterName, setClusterName] = useState('cloudpulse-ai-autopilot');
  const [clusterRegion, setClusterRegion] = useState('us-central1');
  const [gpuSku, setGpuSku] = useState('nvidia-l4');
  const [gpuCount, setGpuCount] = useState(2);
  const [useSpotGpu, setUseSpotGpu] = useState(true);
  const [privateNodes, setPrivateNodes] = useState(true);
  const [binaryAuth, setBinaryAuth] = useState(true);
  const [workloadIdentity, setWorkloadIdentity] = useState(true);

  const handleCopy = (text, label = 'command') => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    if (onTriggerToast) onTriggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

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

  const fetchCloudSql = useCallback(async () => {
    if (!projectId) return;
    setLoadingSql(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave9/cloud-sql`
      );
      setSqlData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to inspect Cloud SQL instances'
        );
      }
    } finally {
      setLoadingSql(false);
    }
  }, [projectId, onTriggerToast]);

  const fetchGkeVertex = useCallback(async () => {
    if (!projectId) return;
    setLoadingGke(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave9/gke-vertex`
      );
      setGkeData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to inspect GKE Autopilot & Vertex AI'
        );
      }
    } finally {
      setLoadingGke(false);
    }
  }, [projectId, onTriggerToast]);

  useEffect(() => {
    if (activeSubTab === 'SUPPLY_CHAIN_AR') fetchSupplyChain();
    if (activeSubTab === 'CLOUD_SQL_STUDIO') fetchCloudSql();
    if (activeSubTab === 'GKE_VERTEX_STUDIO') fetchGkeVertex();
  }, [activeSubTab, fetchSupplyChain, fetchCloudSql, fetchGkeVertex]);

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

  const applySqlBlueprint = (bp) => {
    setSqlBlueprint(bp);
    if (bp === 'pci-sec-ledger') {
      setSqlRegion('us-central1');
      setSqlAvailability('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('TRUSTED_CLIENT_CERTIFICATE_REQUIRED');
      setSqlPitrDays(35);
      setSqlIamAuth(true);
    } else if (bp === 'gdpr-eu-postgres') {
      setSqlRegion('europe-west1');
      setSqlAvailability('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlPitrDays(14);
      setSqlIamAuth(true);
    } else if (bp === 'hipaa-clinical-db') {
      setSqlRegion('us-east4');
      setSqlAvailability('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlPitrDays(30);
      setSqlIamAuth(true);
    }
  };

  const applyGkeBlueprint = (bp) => {
    setGkeBlueprint(bp);
    if (bp !== 'custom') {
      setPrivateNodes(true);
      setBinaryAuth(true);
      setWorkloadIdentity(true);
      if (bp === 'gdpr-eu-ai-cluster') {
        setClusterRegion('europe-west1');
      } else {
        setClusterRegion('us-central1');
      }
    }
  };

  // Strict compliance lock booleans
  const isArCustom = arBlueprint === 'custom';
  const isArGdpr = arBlueprint === 'gdpr-eu-registry';
  const isArUsOnly =
    arBlueprint === 'slsa3-immutable' || arBlueprint === 'hipaa-signed-oci';

  const isSqlCustom = sqlBlueprint === 'custom';
  const isSqlGdpr = sqlBlueprint === 'gdpr-eu-postgres';
  const isSqlUsOnly =
    sqlBlueprint === 'pci-sec-ledger' || sqlBlueprint === 'hipaa-clinical-db';

  const isGkeCustom = gkeBlueprint === 'custom';
  const isGkeGdpr = gkeBlueprint === 'gdpr-eu-ai-cluster';

  // GPU FinOps math
  const selectedGpuObj = GPU_SKUS[gpuSku] || GPU_SKUS['nvidia-l4'];
  const monthlyOnDemandUsd = Math.round(
    selectedGpuObj.onDemandHr * gpuCount * 730
  );
  const monthlySpotUsd = Math.round(selectedGpuObj.spotHr * gpuCount * 730);
  const monthlyGpuSavingsUsd = monthlyOnDemandUsd - monthlySpotUsd;

  const cloudSqlCli = `gcloud sql instances create ${sqlName} \\
  --database-version=${sqlEngine} \\
  --region=${sqlRegion} \\
  --availability-type=${sqlAvailability} \\
  --no-assign-ip \\
  --network=projects/${projectId}/global/networks/default \\
  --ssl-mode=${sqlSslMode} \\
  --enable-point-in-time-recovery \\
  --retained-backups-count=${sqlPitrDays} \\
  --database-flags=cloudsql.iam_authentication=${sqlIamAuth ? 'on' : 'off'} \\
  --deletion-protection \\
  --project=${projectId}`;

  const gkeCli = `gcloud container clusters create-auto ${clusterName} \\
  --region=${clusterRegion} \\
  --enable-private-nodes \\
  --binauthz-evaluation-mode=PROJECT_SINGLETON_POLICY_ENFORCE \\
  --workload-pool=${projectId}.svc.id.goog \\
  --project=${projectId}`;

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="rounded-[12px] border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-indigo-950/50 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                WAVE-9 SUPPLY-CHAIN SBOM, ZERO-TRUST CLOUD SQL & GKE AUTOPILOT / GPU STUDIO
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              ☸️ Artifact Registry SLSA-3 Supply-Chain, Sovereign Cloud SQL & GKE Autopilot / AI GPU Studio
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl">
              Audits live `artifactregistry.googleapis.com/v1` container digests & untagged orphan bloat, enforces strict compliance locks (`🔒`) on Cloud SQL (`sqladmin.googleapis.com/v1`) Private IP / mTLS / PITR, and optimizes GKE Autopilot (`container.googleapis.com/v1`) + Spot GPU fleets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (activeSubTab === 'SUPPLY_CHAIN_AR') fetchSupplyChain();
              if (activeSubTab === 'CLOUD_SQL_STUDIO') fetchCloudSql();
              if (activeSubTab === 'GKE_VERTEX_STUDIO') fetchGkeVertex();
            }}
            title="Refresh live Artifact Registry, Cloud SQL, and GKE Autopilot telemetry"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-bold cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingAr || loadingSql || loadingGke
                  ? 'animate-spin text-cyan-400'
                  : ''
              }`}
            />
            <span>Sync Telemetry</span>
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-800/80">
          {[
            {
              id: 'SUPPLY_CHAIN_AR',
              label: '📦 1. Artifact Registry & SLSA-3 Supply-Chain',
              badge: arData
                ? `${arData.summary?.totalImagesCount || 0} Images (${
                    arData.summary?.orphanDigestCount || 0
                  } Orphans)`
                : 'OCI / SBOM',
              tip: 'Inspect live Artifact Registry container digests, sweep untagged orphan layers, and provision immutable SLSA-3 repositories',
            },
            {
              id: 'CLOUD_SQL_STUDIO',
              label: '🐘 2. Cloud SQL & AlloyDB Zero-Trust DB Studio',
              badge: sqlData
                ? `${sqlData.summary?.instancesCount || 0} DBs`
                : 'Private VPC + PITR',
              tip: 'Audit Cloud SQL instances and enforce Private IP Only, mTLS, Regional HA, and 35-day PITR with strict compliance locks',
            },
            {
              id: 'GKE_VERTEX_STUDIO',
              label: '☸️ 3. GKE Autopilot, Vertex AI & Spot GPU Studio',
              badge: gkeData
                ? `${gkeData.summary?.clustersCount || 0} Clusters`
                : '-68% Spot GPU',
              tip: 'Audit GKE Autopilot & Vertex AI endpoints, enforce Binary Authorization + Workload Identity, and calculate Spot L4/A100/H100/TPU savings',
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
                    ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active
                      ? 'bg-black/30 text-cyan-100'
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
          TAB 1: ARTIFACT REGISTRY, ORPHAN DIGEST SWEEPER & SLSA-3 STUDIO
         ===================================================================== */}
      {activeSubTab === 'SUPPLY_CHAIN_AR' && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417]">
              <div className="text-[11px] font-mono text-zinc-500">
                Live Artifact Repositories
              </div>
              <div className="text-2xl font-black text-cyan-500 mt-1">
                {arData?.summary?.repositoriesCount ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Immutable Tag Repos: {arData?.summary?.immutableReposCount ?? 0}
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417]">
              <div className="text-[11px] font-mono text-zinc-500">
                Total Container Image Footprint
              </div>
              <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
                {arData?.summary?.totalSizeGb ?? 0} GB
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                {arData?.summary?.totalImagesCount ?? 0} Digests · $
                {arData?.summary?.monthlyStorageUsd ?? 0}/mo
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-amber-500/30 bg-amber-500/5">
              <div className="text-[11px] font-mono text-amber-500">
                Untagged Orphan Image Digests
              </div>
              <div className="text-2xl font-black text-amber-500 mt-1">
                {arData?.summary?.orphanDigestCount ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                {arData?.summary?.orphanSizeGb ?? 0} GB ($
                {arData?.summary?.reclaimableMonthlyUsd ?? 0}/mo waste)
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-emerald-500/30 bg-emerald-500/5">
              <div className="text-[11px] font-mono text-emerald-400">
                Supply-Chain SLSA Level
              </div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                SLSA L3
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Cloud Build Provenance Ready
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Provision Immutable Artifact Registry with Strict Compliance Locks */}
            <form
              onSubmit={handleCreateArRepo}
              className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-cyan-400" />
                  <span>Provision Artifact Registry (`artifactregistry.googleapis.com`)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  🔒 Tag-Mutation Lock
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'slsa3-immutable',
                    label: '🏛️ SEC / FedRAMP Immutable SLSA-3',
                    desc: 'Locks immutableTags=true + US jurisdiction',
                  },
                  {
                    id: 'gdpr-eu-registry',
                    label: '🇪🇺 GDPR EU Sovereign Registry',
                    desc: 'Locks europe-* residency + immutableTags=true',
                  },
                  {
                    id: 'hipaa-signed-oci',
                    label: '🏥 HIPAA Signed Container Vault',
                    desc: 'Locks US BAA region + immutable image tags',
                  },
                  {
                    id: 'custom',
                    label: '🎛️ Custom GCP Standard',
                    desc: 'Unlocks mutable tags & all formats',
                  },
                ].map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => applyArBlueprint(bp.id)}
                    className={`p-2.5 rounded-[8px] border text-left cursor-pointer ${
                      arBlueprint === bp.id
                        ? 'bg-cyan-600/15 border-cyan-500 text-zinc-900 dark:text-zinc-100'
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
                    Jurisdiction Location {!isArCustom ? '🔒' : ''}
                  </label>
                  <select
                    value={repoLocation}
                    onChange={(e) => setRepoLocation(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="us-central1" disabled={isArGdpr}>
                      {isArGdpr ? '🔒 ' : ''}us-central1 (Iowa — US Sovereign)
                    </option>
                    <option value="us-east4" disabled={isArGdpr}>
                      {isArGdpr ? '🔒 ' : ''}us-east4 (N. Virginia — US Sovereign)
                    </option>
                    <option value="europe-west1" disabled={isArUsOnly}>
                      {isArUsOnly ? '🔒 ' : ''}europe-west1 (Belgium — EU GDPR)
                    </option>
                    <option value="europe-west3" disabled={isArUsOnly}>
                      {isArUsOnly ? '🔒 ' : ''}europe-west3 (Frankfurt — EU GDPR)
                    </option>
                  </select>
                </div>
              </div>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold ${
                  !isArCustom ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
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
                    ? '— 🔒 Locked ON (Prevents :v1.0 Tag Hijacking)'
                    : ''}
                </span>
              </label>

              <button
                type="submit"
                disabled={creatingRepo || !repoId.trim()}
                className="w-full py-2 rounded-[8px] bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {creatingRepo
                  ? 'Provisioning Artifact Registry...'
                  : '📦 Provision SLSA-3 Artifact Registry Repository'}
              </button>
            </form>

            {/* Right: Live Container Digests & Orphan Sweeper */}
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Live Container Digests ({arData?.images?.length || 0})
                </div>
                <span className="text-[10px] font-mono text-amber-400">
                  Untagged Orphans: {arData?.summary?.orphanDigestCount || 0} ({arData?.summary?.orphanSizeGb || 0} GB)
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {(arData?.images || []).map((img) => (
                  <div
                    key={img.name}
                    className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {img.repository} · {img.sizeMb} MB
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {img.tags?.length > 0
                          ? `Tags: ${img.tags.join(', ')}`
                          : '⚠️ UNTAGGED ORPHAN DIGEST'}
                      </div>
                    </div>

                    {img.isOrphan && (
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            `gcloud artifacts docker images delete "${img.uri}" --quiet`,
                            'Orphan digest cleanup CLI'
                          )
                        }
                        title="Copy gcloud command to delete this untagged orphan container digest"
                        className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        Sweep CLI
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: CLOUD SQL & ALLOYDB ZERO-TRUST RELATIONAL DATABASE STUDIO
         ===================================================================== */}
      {activeSubTab === 'CLOUD_SQL_STUDIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Zero-Trust Cloud SQL Blueprint Compiler with Strict Compliance Locks */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Zero-Trust Cloud SQL / AlloyDB Compliance Compiler</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 text-[10px] font-mono">
                🔒 Strict DB Compliance Locks
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: 'pci-sec-ledger',
                  label: '🏛️ PCI-DSS / SEC Financial DB',
                  desc: 'Locks Private IP, mTLS, Regional HA & 35d PITR',
                },
                {
                  id: 'gdpr-eu-postgres',
                  label: '🇪🇺 GDPR EU Sovereign Postgres',
                  desc: 'Locks europe-* residency, Private VPC & Encrypted TLS',
                },
                {
                  id: 'hipaa-clinical-db',
                  label: '🏥 HIPAA BAA Clinical DB',
                  desc: 'Locks US BAA region, Regional HA & 30d PITR',
                },
                {
                  id: 'custom',
                  label: '🎛️ Custom Cloud SQL',
                  desc: 'Unlocks Zonal & Public IP options',
                },
              ].map((bp) => (
                <button
                  key={bp.id}
                  type="button"
                  onClick={() => applySqlBlueprint(bp.id)}
                  className={`p-2.5 rounded-[8px] border text-left cursor-pointer ${
                    sqlBlueprint === bp.id
                      ? 'bg-indigo-600/15 border-indigo-500 text-zinc-900 dark:text-zinc-100'
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
                  Instance Name
                </label>
                <input
                  type="text"
                  value={sqlName}
                  onChange={(e) => setSqlName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Sovereign Region {!isSqlCustom ? '🔒' : ''}
                </label>
                <select
                  value={sqlRegion}
                  onChange={(e) => setSqlRegion(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="us-central1" disabled={isSqlGdpr}>
                    {isSqlGdpr ? '🔒 ' : ''}us-central1 (Iowa — US SEC/HIPAA)
                  </option>
                  <option value="us-east4" disabled={isSqlGdpr}>
                    {isSqlGdpr ? '🔒 ' : ''}us-east4 (N. Virginia — US SEC/HIPAA)
                  </option>
                  <option value="europe-west1" disabled={isSqlUsOnly}>
                    {isSqlUsOnly ? '🔒 ' : ''}europe-west1 (Belgium — EU GDPR)
                  </option>
                  <option value="europe-west3" disabled={isSqlUsOnly}>
                    {isSqlUsOnly ? '🔒 ' : ''}europe-west3 (Frankfurt — EU GDPR)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Network Exposure {!isSqlCustom ? '🔒' : ''}
                </label>
                <select
                  value={sqlNetworkMode}
                  disabled={!isSqlCustom}
                  onChange={(e) => setSqlNetworkMode(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60"
                >
                  <option value="PRIVATE_VPC_ONLY">
                    Private VPC Peering Only (--no-assign-ip)
                  </option>
                  <option value="PUBLIC_IPV4" disabled={!isSqlCustom}>
                    🔒 Public IPv4 Exposed (Forbidden by Zero-Trust Blueprint)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  High-Availability Topology {!isSqlCustom ? '🔒' : ''}
                </label>
                <select
                  value={sqlAvailability}
                  disabled={!isSqlCustom}
                  onChange={(e) => setSqlAvailability(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60"
                >
                  <option value="REGIONAL">
                    REGIONAL (Multi-Zone Automatic Failover)
                  </option>
                  <option value="ZONAL" disabled={!isSqlCustom}>
                    🔒 ZONAL (Single Zone — Forbidden for Production SLA)
                  </option>
                </select>
              </div>
            </div>

            <div className="p-2.5 rounded-[8px] bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto">
              {cloudSqlCli}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(cloudSqlCli, 'Cloud SQL Zero-Trust CLI')}
              className="w-full py-2 rounded-[8px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
            >
              📋 Copy Hardened Cloud SQL Provisioning Command
            </button>
          </div>

          {/* Right: Live Cloud SQL Fleet Posture */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-3">
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Live Cloud SQL Instances ({sqlData?.summary?.instancesCount || 0})
            </div>

            {sqlData?.instances?.length > 0 ? (
              <div className="space-y-2.5">
                {sqlData.instances.map((inst) => (
                  <div
                    key={inst.name}
                    className="p-3 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono">
                        {inst.name} ({inst.databaseVersion} · {inst.region})
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                        Score: {inst.postureScore}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs font-mono text-zinc-500 py-8 text-center">
                No Cloud SQL instances running in `{projectId}` ($0.00/hr idle DB burn). Use the Zero-Trust Cloud SQL Compiler on the left to generate a hardened Private-IP + Regional-HA Postgres 16 deployment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: GKE AUTOPILOT, VERTEX AI & SPOT GPU NODE-POOL FINOPS STUDIO
         ===================================================================== */}
      {activeSubTab === 'GKE_VERTEX_STUDIO' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: GKE Autopilot & Spot GPU FinOps Architect */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>GKE Autopilot & Spot GPU FinOps Architect</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                Save ${monthlyGpuSavingsUsd.toLocaleString()}/mo with Spot GPUs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  AI / GPU Accelerator SKU
                </label>
                <select
                  value={gpuSku}
                  onChange={(e) => setGpuSku(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
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
                  Accelerator Count (`1–16 GPUs`)
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
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Spot vs On-Demand Comparison Receipt */}
            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 font-mono text-xs">
              <div>
                <div className="text-[10px] text-zinc-500">On-Demand 24/7</div>
                <div className="font-bold text-rose-400">
                  ${monthlyOnDemandUsd.toLocaleString()}/mo
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500">Spot GPU (-69%)</div>
                <div className="font-bold text-emerald-400">
                  ${monthlySpotUsd.toLocaleString()}/mo
                </div>
              </div>
              <div>
                <div className="text-[10px] text-zinc-500">Monthly FinOps Delta</div>
                <div className="font-extrabold text-cyan-400">
                  -${monthlyGpuSavingsUsd.toLocaleString()}/mo
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-[8px] bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto">
              {gkeCli}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(gkeCli, 'GKE Autopilot Zero-Trust CLI')}
              className="w-full py-2 rounded-[8px] bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer"
            >
              📋 Copy GKE Autopilot + Binary Authorization Deployment CLI
            </button>
          </div>

          {/* Right: Live GKE Clusters & Vertex AI Endpoints */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-3">
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Live GKE Clusters ({gkeData?.summary?.clustersCount || 0}) & Vertex AI Endpoints ({gkeData?.summary?.vertexEndpointsCount || 0})
            </div>
            <div className="text-xs font-mono text-zinc-500 py-8 text-center">
              Zero idle GKE control-plane management fees ($0.10/hr saved per cluster while running serverless Cloud Run Gen2 on `{projectId}`).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
