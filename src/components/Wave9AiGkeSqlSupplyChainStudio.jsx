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
    fetchSupplyChain();
  }, [fetchSupplyChain]);

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
          res.data?.message || 'Deleted container image digest from Artifact Registry'
        );
      }
      await fetchSupplyChain();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to delete container image digest'
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
          res.data?.message || `Deleted Artifact Registry repository ${repo.shortName}`
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
  const isArCustom = arBlueprint === 'custom';
  const isArGdpr = arBlueprint === 'gdpr-eu-registry';
  const isArUsOnly =
    arBlueprint === 'slsa3-immutable' || arBlueprint === 'hipaa-signed-oci';
  const orphanImages = (arData?.images || []).filter((i) => i.isOrphan);

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="rounded-[12px] border border-cyan-500/30 bg-gradient-to-r from-cyan-950/60 via-zinc-900 to-indigo-950/50 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                ARTIFACT REGISTRY SLSA-3 SUPPLY-CHAIN & ORPHAN DIGEST SWEEPER STUDIO
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              📦 Artifact Registry SLSA-3 Supply-Chain & OCI SBOM Studio
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl">
              Audits live `artifactregistry.googleapis.com/v1` container digests & untagged orphan bloat, executes 1-click live digest & orphan sweeping, and enforces strict compliance locks (`🔒`) on `dockerConfig.immutableTags`.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSupplyChain}
            title="Refresh live Artifact Registry telemetry"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-bold cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingAr ? 'animate-spin text-cyan-400' : ''
              }`}
            />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          ARTIFACT REGISTRY, ORPHAN DIGEST SWEEPER & SLSA-3 STUDIO
         ===================================================================== */}
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
          {/* Left: Provision Immutable Artifact Registry with Strict Compliance Locks + Live Repositories */}
          <div className="space-y-4">
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

            {/* Live Repositories List with 1-Click Delete */}
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
                  Live Artifact Registry Repositories ({arData?.repositories?.length || 0})
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
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
                            {repo.location}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              repo.immutableTags
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-amber-500/15 text-amber-400'
                            }`}
                          >
                            {repo.immutableTags ? '🔒 Immutable Tags' : 'Mutable Tags'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          {repo.imagesCount} Digests ({repo.orphanDigestsCount} Orphans) · {repo.totalSizeGb} GB · Score {repo.postureScore}/100
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {confirmRepoName === repo.name ? (
                          <>
                            <button
                              type="button"
                              disabled={deletingRepoName === repo.name}
                              onClick={() => handleDeleteRepository(repo)}
                              className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-[10px] font-bold cursor-pointer"
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
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Live Container Digests ({arData?.images?.length || 0})
                </div>
                <div className="text-[10px] font-mono text-amber-400">
                  Untagged Orphans: {arData?.summary?.orphanDigestCount || 0} ({arData?.summary?.orphanSizeGb || 0} GB · ${arData?.summary?.reclaimableMonthlyUsd || 0}/mo waste)
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
                        className="px-2.5 py-1.5 rounded-[8px] bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
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
                          : '⚠️ UNTAGGED ORPHAN DIGEST'}
                      </div>
                      <div className="text-[9.5px] text-zinc-400 truncate">
                        {img.shortImage}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isConfirmingThis ? (
                        <>
                          <button
                            type="button"
                            disabled={isDeletingThis}
                            onClick={() => handleDeleteDigest(img)}
                            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
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
                                : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border-rose-500/30'
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

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                `gcloud artifacts docker images delete "${img.uri}" --delete-tags --quiet`,
                                'Image digest delete CLI'
                              )
                            }
                            title="Copy equivalent gcloud delete command"
                            className="px-1.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[10px] cursor-pointer"
                          >
                            CLI
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
    </div>
  );
}
