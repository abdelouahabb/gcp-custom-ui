import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  History,
  GitCompare,
  Lock,
  Unlock,
  Clock,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  UserCheck,
  FileCode2,
  Trash2,
  PlusCircle,
  Globe,
  Fingerprint,
  Layers,
  Zap,
} from 'lucide-react';

export default function SovereignTimeMachineIamStudio({
  projectId,
  onTriggerToast,
  onRefreshOverview,
}) {
  const [activeSubTab, setActiveSubTab] = useState('IAM_SURGEON');
  const [copiedText, setCopiedText] = useState('');

  // --- Tab 1: IAM Least-Privilege Surgeon State ---
  const [iamData, setIamData] = useState(null);
  const [loadingIam, setLoadingIam] = useState(false);
  const [iamFilter, setIamFilter] = useState('ALL');
  const [iamSearch, setIamSearch] = useState('');
  const [remediatingId, setRemediatingId] = useState(null);
  const [selectedJitHours, setSelectedJitHours] = useState(24);

  // --- Tab 2: Cryptographic State Time-Machine & Drift Radar State ---
  const [tmData, setTmData] = useState(null);
  const [loadingTm, setLoadingTm] = useState(false);
  const [selectedBaselineId, setSelectedBaselineId] = useState('');
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [tmActionBusy, setTmActionBusy] = useState(false);

  // --- Tab 3: Secret Manager, KMS & Cloud Armor WAF State ---
  const [vaultData, setVaultData] = useState(null);
  const [loadingVault, setLoadingVault] = useState(false);
  const [secretId, setSecretId] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [secretBlueprint, setSecretBlueprint] = useState('gdpr-sovereign');
  const [secretReplicationMode, setSecretReplicationMode] =
    useState('SOVEREIGN_REGION');
  const [secretRegion, setSecretRegion] = useState('europe-west1');
  const [secretRotationDays, setSecretRotationDays] = useState(30);
  const [creatingSecret, setCreatingSecret] = useState(false);

  const handleCopy = (text, label = 'CLI command') => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    if (onTriggerToast) onTriggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const fetchIamSurgeon = useCallback(async () => {
    if (!projectId) return;
    setLoadingIam(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/sovereign/iam-surgeon`
      );
      setIamData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to scan project IAM bindings'
        );
      }
    } finally {
      setLoadingIam(false);
    }
  }, [projectId, onTriggerToast]);

  const fetchTimeMachine = useCallback(
    async (baselineIdOverride) => {
      if (!projectId) return;
      setLoadingTm(true);
      try {
        const targetBase =
          baselineIdOverride !== undefined
            ? baselineIdOverride
            : selectedBaselineId;
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/sovereign/time-machine`,
          {
            params: targetBase ? { baselineSnapshotId: targetBase } : {},
          }
        );
        setTmData(res.data);
        if (!selectedBaselineId && res.data?.baselineSnapshot?.snapshotId) {
          setSelectedBaselineId(res.data.baselineSnapshot.snapshotId);
        }
      } catch (err) {
        if (onTriggerToast) {
          onTriggerToast(
            err.response?.data?.error ||
              'Failed to compute Cryptographic State Time-Machine'
          );
        }
      } finally {
        setLoadingTm(false);
      }
    },
    [projectId, selectedBaselineId, onTriggerToast]
  );

  const fetchVaultStudio = useCallback(async () => {
    if (!projectId) return;
    setLoadingVault(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/sovereign/secrets-kms`
      );
      setVaultData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to load Secret Manager & KMS status'
        );
      }
    } finally {
      setLoadingVault(false);
    }
  }, [projectId, onTriggerToast]);

  useEffect(() => {
    if (activeSubTab === 'IAM_SURGEON') fetchIamSurgeon();
    if (activeSubTab === 'TIME_MACHINE') fetchTimeMachine();
    if (activeSubTab === 'SECRETS_KMS_WAF') fetchVaultStudio();
  }, [activeSubTab, fetchIamSurgeon, fetchTimeMachine, fetchVaultStudio]);

  const handleIamRemediate = async (payload, findingId) => {
    setRemediatingId(findingId);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/iam-surgeon/remediate`,
        payload
      );
      if (onTriggerToast) {
        onTriggerToast(res.data?.message || 'IAM policy updated');
      }
      await fetchIamSurgeon();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'IAM remediation requires resourcemanager.projects.setIamPolicy permission'
        );
      }
    } finally {
      setRemediatingId(null);
    }
  };

  const handleTimeMachineAction = async (action, label = '') => {
    setTmActionBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/time-machine/snapshot`,
        { action, label }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            `Sealed SHA-256 snapshot ${res.data?.snapshot?.merkleRootShort || ''}`
        );
      }
      setNewSnapshotLabel('');
      await fetchTimeMachine();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Time-Machine operation failed'
        );
      }
    } finally {
      setTmActionBusy(false);
    }
  };

  const applySecretBlueprint = (bp) => {
    setSecretBlueprint(bp);
    if (bp === 'gdpr-sovereign') {
      setSecretReplicationMode('SOVEREIGN_REGION');
      setSecretRegion('europe-west1');
      setSecretRotationDays(30);
    } else if (bp === 'sec-finra-us') {
      setSecretReplicationMode('SOVEREIGN_REGION');
      setSecretRegion('us-central1');
      setSecretRotationDays(30);
    } else if (bp === 'hipaa-vault') {
      setSecretReplicationMode('SOVEREIGN_REGION');
      setSecretRegion('us-east4');
      setSecretRotationDays(60);
    } else {
      // custom
    }
  };

  const handleCreateSecret = async (e) => {
    e.preventDefault();
    if (!secretId.trim()) return;
    setCreatingSecret(true);
    try {
      await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/create-secret`,
        {
          secretId: secretId.trim(),
          secretValue,
          replicationMode: secretReplicationMode,
          region: secretRegion,
          rotationDays: secretRotationDays,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          `Sealed secret "${secretId.trim()}" in Secret Manager (${secretReplicationMode})`
        );
      }
      setSecretId('');
      setSecretValue('');
      await fetchVaultStudio();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to create Secret Manager secret'
        );
      }
    } finally {
      setCreatingSecret(false);
    }
  };

  const filteredFindings = (iamData?.findings || []).filter((f) => {
    if (iamFilter === 'CRITICAL' && f.severity !== 'CRITICAL') return false;
    if (iamFilter === 'HIGH' && f.severity !== 'HIGH') return false;
    if (iamFilter === 'JIT_ONLY' && !f.condition) return false;
    if (iamSearch.trim()) {
      const q = iamSearch.toLowerCase();
      return (
        f.role.toLowerCase().includes(q) ||
        f.member.toLowerCase().includes(q) ||
        f.riskLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Strict compliance locks for Secret Manager blueprint
  const isSecretCustom = secretBlueprint === 'custom';
  const isSecretGdpr = secretBlueprint === 'gdpr-sovereign';
  const isSecretSec = secretBlueprint === 'sec-finra-us';
  const isSecretHipaa = secretBlueprint === 'hipaa-vault';

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="rounded-[12px] border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-zinc-900 to-emerald-950/50 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>WAVE-7 SOVEREIGN ZERO-TRUST & MERKLE TIME-MACHINE STUDIO</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              🧬 Sovereign Cloud Time-Machine, IAM Least-Privilege Surgeon & GitOps Drift Radar
            </h2>
            <p className="text-xs text-zinc-300 max-w-3xl">
              Live project IAM privilege-escalation surgery (`:getIamPolicy` / `:setIamPolicy` v3 with 24h auto-expiring JIT leases), SHA-256 Merkle-tree configuration drift detection across 6 GCP planes, and strict sovereign Secret Manager / KMS / Cloud Armor WAF provisioning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeSubTab === 'IAM_SURGEON') fetchIamSurgeon();
                if (activeSubTab === 'TIME_MACHINE') fetchTimeMachine();
                if (activeSubTab === 'SECRETS_KMS_WAF') fetchVaultStudio();
              }}
              title="Refresh live Wave-7 Sovereign telemetry from Google Cloud REST APIs"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-bold cursor-pointer transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingIam || loadingTm || loadingVault ? 'animate-spin text-indigo-400' : ''
                }`}
              />
              <span>Sync Live State</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-800/80">
          {[
            {
              id: 'IAM_SURGEON',
              label: '🔐 1. Autonomous IAM Least-Privilege Surgeon',
              badge: iamData
                ? `${iamData.summary?.criticalCount || 0} Critical`
                : 'Live IAM v3',
              tip: 'Scan project IAM bindings for primitive Owner/Editor god-roles, attach 24h auto-expiring JIT IAM Conditions, and purge static Service Account JSON keys',
            },
            {
              id: 'TIME_MACHINE',
              label: '🕰️ 2. SHA-256 Cloud State Time-Machine & Drift Radar',
              badge: tmData
                ? tmData.inSync
                  ? 'SYNCED ✓'
                  : `${tmData.drifts?.length || 0} DRIFTS`
                : 'Merkle Diff',
              tip: 'Seal SHA-256 Merkle-signed snapshots of VMs, Cloud Run, Storage, BigQuery, Firewalls & IAM, detect out-of-band console tampering, and heal drift in 1 tap',
            },
            {
              id: 'SECRETS_KMS_WAF',
              label: '🔑 3. Sovereign Secret Manager, KMS & Cloud Armor WAF',
              badge: vaultData
                ? `${vaultData.secrets?.length || 0} Secrets`
                : 'Zero-Trust Vault',
              tip: 'Provision regionally-pinned GDPR/SEC/HIPAA secrets in Secret Manager, audit Cloud KMS rotation, and synthesize Cloud Armor OWASP Top-10 WAF policies',
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
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active
                      ? 'bg-black/30 text-indigo-100'
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
          TAB 1: AUTONOMOUS IAM LEAST-PRIVILEGE SURGEON
         ===================================================================== */}
      {activeSubTab === 'IAM_SURGEON' && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417]">
              <div className="text-[11px] font-mono text-zinc-500">
                IAM Least-Privilege Score
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  (iamData?.iamScore ?? 100) >= 80
                    ? 'text-emerald-500'
                    : (iamData?.iamScore ?? 100) >= 50
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }`}
              >
                {iamData ? `${iamData.iamScore}/100` : '...'}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Policy ETag: {iamData?.etag ? iamData.etag.slice(0, 10) : 'v3'}
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-rose-500/30 bg-rose-500/5">
              <div className="text-[11px] font-mono text-rose-500">
                Critical God-Role Bindings
              </div>
              <div className="text-2xl font-black text-rose-500 mt-1">
                {iamData?.summary?.criticalCount ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                roles/owner, roles/editor, allUsers
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-amber-500/30 bg-amber-500/5">
              <div className="text-[11px] font-mono text-amber-500">
                Escalation & Wildcard Roles
              </div>
              <div className="text-2xl font-black text-amber-500 mt-1">
                {(iamData?.summary?.highCount ?? 0) +
                  (iamData?.summary?.mediumCount ?? 0)}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                TokenCreator / KeyAdmin / *Admin
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-indigo-500/30 bg-indigo-500/5">
              <div className="text-[11px] font-mono text-indigo-400">
                24h JIT Condition Protected
              </div>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {iamData?.summary?.jitProtectedCount ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Time-bounded CEL expressions
              </div>
            </div>

            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417]">
              <div className="text-[11px] font-mono text-zinc-500">
                Static User-Managed SA Keys
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  (iamData?.summary?.userManagedKeysCount ?? 0) > 0
                    ? 'text-rose-500'
                    : 'text-emerald-500'
                }`}
              >
                {iamData?.summary?.userManagedKeysCount ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Across {iamData?.summary?.serviceAccountsCount ?? 0} Service Accounts
              </div>
            </div>
          </div>

          {/* Filter & JIT Lease Duration Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417]">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: `All Bindings (${iamData?.findings?.length || 0})` },
                {
                  id: 'CRITICAL',
                  label: `🚨 Critical God-Roles (${iamData?.summary?.criticalCount || 0})`,
                },
                {
                  id: 'HIGH',
                  label: `⚠️ Escalation Vectors (${iamData?.summary?.highCount || 0})`,
                },
                {
                  id: 'JIT_ONLY',
                  label: `⏱️ Active JIT Leases (${iamData?.summary?.jitProtectedCount || 0})`,
                },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setIamFilter(f.id)}
                  className={`px-2.5 py-1.5 rounded-[8px] text-xs font-mono border cursor-pointer transition-colors ${
                    iamFilter === f.id
                      ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>JIT Lease Duration:</span>
                {[4, 12, 24, 72].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedJitHours(h)}
                    title={`Configure 1-Tap Just-In-Time (JIT) IAM Condition to auto-expire after ${h} hours`}
                    className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                      selectedJitHours === h
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 font-bold'
                        : 'border-zinc-300 dark:border-zinc-700 text-zinc-500'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={iamSearch}
                onChange={(e) => setIamSearch(e.target.value)}
                placeholder="Filter principal or role..."
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* IAM Findings List */}
          <div className="space-y-2.5">
            {filteredFindings.map((item) => {
              const isBusy = remediatingId === item.findingId;
              const badgeColor =
                item.severity === 'CRITICAL'
                  ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                  : item.severity === 'HIGH'
                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  : item.severity === 'MEDIUM'
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';

              return (
                <div
                  key={item.findingId}
                  className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}
                        >
                          {item.severity} · Blast {item.blastRadiusScore}/100
                        </span>
                        <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                          {item.role}
                        </span>
                        <span className="text-xs font-mono text-indigo-500 dark:text-indigo-400">
                          → {item.member}
                        </span>
                        {item.condition && (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                            ⏱️ JIT Condition Active: {item.condition.title}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {item.riskLabel}
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        {item.remediationReason}
                      </p>
                    </div>

                    {/* 1-Tap Surgical Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.condition && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            handleIamRemediate(
                              {
                                action: 'APPLY_JIT_CONDITION',
                                role: item.role,
                                member: item.member,
                                jitHours: selectedJitHours,
                              },
                              item.findingId
                            )
                          }
                          title={`Attach a ${selectedJitHours}-hour auto-expiring CEL condition (request.time < timestamp(...)) to ${item.role} via :setIamPolicy`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Enforce {selectedJitHours}h JIT Lease</span>
                        </button>
                      )}

                      {item.recommendedRole &&
                        item.recommendedRole !== item.role && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleIamRemediate(
                                {
                                  action: 'DOWNGRADE_ROLE',
                                  role: item.role,
                                  member: item.member,
                                  newRole: item.recommendedRole,
                                },
                                item.findingId
                              )
                            }
                            title={`Atomically downgrade ${item.member} from ${item.role} to least-privilege ${item.recommendedRole}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Scope → {item.recommendedRole}</span>
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(item.gcloudDowngradeCli, 'IAM surgery CLI')
                        }
                        title="Copy reproducible gcloud IAM least-privilege remediation command"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[11px] font-mono cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        {copiedText === item.gcloudDowngradeCli ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>CLI</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* User-Managed Service Account Key Hunter */}
          {iamData?.userManagedKeys?.length > 0 && (
            <div className="p-4 rounded-[10px] border border-rose-500/40 bg-rose-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold text-rose-400 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  <span>
                    Static User-Managed Service Account JSON Keys Detected ({iamData.userManagedKeys.length})
                  </span>
                </div>
                <span className="text-[10px] font-mono text-rose-300">
                  CIS GCP Benchmark 1.4 — Static JSON keys never expire unless rotated or deleted
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {iamData.userManagedKeys.map((k) => (
                  <div
                    key={k.name}
                    className="p-2.5 rounded-[8px] border border-rose-500/30 bg-zinc-900/90 flex items-center justify-between gap-2"
                  >
                    <div className="text-xs font-mono">
                      <div className="font-bold text-zinc-100">
                        {k.serviceAccountEmail}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Key ID: {k.keyId?.slice(0, 12)}... · Age: {k.ageDays} days ({k.keyAlgorithm})
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleIamRemediate(
                          { action: 'DELETE_SA_KEY', keyName: k.name },
                          k.name
                        )
                      }
                      title="Delete this static Service Account JSON key from IAM"
                      className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Revoke Key</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: CRYPTOGRAPHIC CLOUD STATE TIME-MACHINE & GITOPS DRIFT RADAR
         ===================================================================== */}
      {activeSubTab === 'TIME_MACHINE' && (
        <div className="space-y-4">
          {/* Merkle Root Comparison Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">
                  SIGNED BASELINE SNAPSHOT MERKLE ROOT
                </span>
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <div className="text-sm font-mono font-black text-indigo-500 dark:text-indigo-400 truncate">
                {tmData?.baselineSnapshot?.merkleRootShort || '0x...'}
              </div>
              <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                {tmData?.baselineSnapshot?.label || 'Genesis Baseline'}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                SHA-256: {tmData?.baselineSnapshot?.sha256?.slice(0, 28)}...
              </div>
            </div>

            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">
                  LIVE GCP INFRASTRUCTURE MERKLE ROOT
                </span>
                <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div
                className={`text-sm font-mono font-black truncate ${
                  tmData?.inSync ? 'text-emerald-500' : 'text-rose-500'
                }`}
              >
                {tmData?.liveState?.merkleRootShort || '0x...'}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    tmData?.inSync
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {tmData?.inSync
                    ? '✓ ZERO OUT-OF-BAND DRIFT (100% MERKLE MATCH)'
                    : `⚠️ ${tmData?.drifts?.length || 0} CONFIGURATION DRIFTS DETECTED`}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                6 Planes: VMs ({tmData?.liveState?.counts?.vms || 0}) · Run (
                {tmData?.liveState?.counts?.cloudRun || 0}) · GCS (
                {tmData?.liveState?.counts?.buckets || 0}) · BQ (
                {tmData?.liveState?.counts?.datasets || 0}) · FW (
                {tmData?.liveState?.counts?.firewalls || 0})
              </div>
            </div>

            {/* Seal New Checkpoint or Trigger Drift Drill */}
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-2.5">
              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                Seal Immutable SHA-256 Checkpoint & Chaos Drift Drill
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSnapshotLabel}
                  onChange={(e) => setNewSnapshotLabel(e.target.value)}
                  placeholder="Checkpoint name (e.g. Prod v3.2 Anchor)..."
                  className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  disabled={tmActionBusy}
                  onClick={() =>
                    handleTimeMachineAction('SEAL_SNAPSHOT', newSnapshotLabel)
                  }
                  title="Capture and sign a new SHA-256 Merkle snapshot of your entire live GCP project"
                  className="px-3 py-1.5 rounded-[8px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  📸 Seal Snapshot
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={tmActionBusy}
                  onClick={() =>
                    handleTimeMachineAction('SIMULATE_DRIFT_DRILL')
                  }
                  title="Simulate an out-of-band console tampering event (rogue 0.0.0.0/0 SSH firewall + bucket Soft-Delete tampering + BigQuery LOGICAL billing regression) to test the Drift Radar"
                  className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-bold cursor-pointer"
                >
                  ⚡ Inject Out-of-Band Drift Drill
                </button>
                {!tmData?.inSync && (
                  <button
                    type="button"
                    disabled={tmActionBusy}
                    onClick={() => handleTimeMachineAction('HEAL_DRIFT')}
                    title="Reconcile and heal all detected configuration drift back to the signed SHA-256 baseline snapshot"
                    className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                  >
                    🛡️ 1-Tap Heal Drift to Baseline
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Snapshot Timeline Selector */}
          {tmData?.snapshots?.length > 0 && (
            <div className="p-3 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Compare Live State Against Snapshot:</span>
              </span>
              {tmData.snapshots.map((snap) => {
                const active =
                  (selectedBaselineId ||
                    tmData.baselineSnapshot?.snapshotId) === snap.snapshotId;
                return (
                  <button
                    key={snap.snapshotId}
                    type="button"
                    onClick={() => {
                      setSelectedBaselineId(snap.snapshotId);
                      fetchTimeMachine(snap.snapshotId);
                    }}
                    className={`px-2.5 py-1 rounded-[8px] text-xs font-mono border cursor-pointer transition-all ${
                      active
                        ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {snap.merkleRootShort} · {snap.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Side-by-Side Drift Diff Cards */}
          {tmData?.drifts?.length > 0 ? (
            <div className="space-y-2.5">
              {tmData.drifts.map((d) => (
                <div
                  key={d.driftId}
                  className="p-3.5 rounded-[10px] border border-rose-500/35 bg-rose-950/10 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40 text-[10px] font-mono font-bold">
                        {d.type} · {d.severity}
                      </span>
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        {d.planeLabel}: {d.resourceId}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        (Field: `{d.field}`)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(d.healCli, 'Drift rollback CLI')}
                      title="Copy exact gcloud/bq command to roll this drifted property back to the signed baseline snapshot"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-zinc-900 text-zinc-200 border border-zinc-700 text-[11px] font-mono cursor-pointer hover:bg-zinc-800"
                    >
                      {copiedText === d.healCli ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                      <span>Copy Rollback CLI</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      <div className="text-[10px] text-emerald-400 font-bold mb-0.5">
                        ✓ SIGNED SNAPSHOT BASELINE (EXPECTED)
                      </div>
                      <div className="break-all">{d.beforeValue}</div>
                    </div>
                    <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300">
                      <div className="text-[10px] text-rose-400 font-bold mb-0.5">
                        ⚠️ CURRENT LIVE GCP STATE (DRIFTED)
                      </div>
                      <div className="break-all">{d.afterValue}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-[10px] border border-emerald-500/30 bg-emerald-950/10 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-extrabold text-emerald-400">
                100% Cryptographic Merkle State Integrity Verified
              </div>
              <p className="text-xs text-zinc-400 max-w-xl mx-auto">
                Every Compute VM, Cloud Run service, Cloud Storage bucket, BigQuery dataset, VPC Firewall rule, and IAM binding matches the signed SHA-256 baseline snapshot (`{tmData?.baselineSnapshot?.merkleRootShort}`). Click **"⚡ Inject Out-of-Band Drift Drill"** above to test live drift detection and rollback!
              </p>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: SOVEREIGN SECRET MANAGER, KMS & CLOUD ARMOR WAF STUDIO
         ===================================================================== */}
      {activeSubTab === 'SECRETS_KMS_WAF' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column: Sovereign Secret Manager Provisioner with Strict Compliance Locks */}
          <form
            onSubmit={handleCreateSecret}
            className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <span>Provision Sovereign Secret (`secretmanager.googleapis.com`)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                 Strict Compliance Locks Active
              </span>
            </div>

            {/* Regulatory Blueprint Selector */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono text-zinc-500">
                1. Choose Secret Regulatory & Residency Blueprint
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'gdpr-sovereign',
                    label: '🇪🇺 GDPR EU Sovereign Lock',
                    desc: 'Locks userManaged EU replication + ≤30d rotation',
                  },
                  {
                    id: 'sec-finra-us',
                    label: '🏛️ SEC / FINRA US Vault',
                    desc: 'Locks US regional residency + 30d rotation',
                  },
                  {
                    id: 'hipaa-vault',
                    label: '🏥 HIPAA Clinical Secret',
                    desc: 'Locks US BAA regional residency + ≤60d rotation',
                  },
                  {
                    id: 'custom',
                    label: '🎛️ Custom GCP Standard',
                    desc: 'Unlocks global automatic replication',
                  },
                ].map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => applySecretBlueprint(bp.id)}
                    className={`p-2.5 rounded-[8px] border text-left cursor-pointer transition-all ${
                      secretBlueprint === bp.id
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Secret ID (`projects/{projectId}/secrets/...`)
                </label>
                <input
                  type="text"
                  required
                  value={secretId}
                  onChange={(e) => setSecretId(e.target.value)}
                  placeholder="prod-stripe-webhook-signing-key"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Replication Policy {!isSecretCustom ? '🔒' : ''}
                </label>
                <select
                  value={secretReplicationMode}
                  disabled={!isSecretCustom}
                  onChange={(e) => setSecretReplicationMode(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="SOVEREIGN_REGION">
                    Sovereign Regional Pinning (userManaged)
                  </option>
                  <option value="AUTOMATIC" disabled={!isSecretCustom}>
                    🔒 Global Automatic Multi-Continent (Forbidden by Sovereign Blueprint)
                  </option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Pinned Sovereign Region {!isSecretCustom ? '🔒' : ''}
                </label>
                <select
                  value={secretRegion}
                  disabled={secretReplicationMode === 'AUTOMATIC'}
                  onChange={(e) => setSecretRegion(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option
                    value="europe-west1"
                    disabled={isSecretSec || isSecretHipaa}
                  >
                    {isSecretSec || isSecretHipaa ? '🔒 ' : ''}europe-west1 (Belgium — EU GDPR)
                  </option>
                  <option
                    value="europe-west3"
                    disabled={isSecretSec || isSecretHipaa}
                  >
                    {isSecretSec || isSecretHipaa ? '🔒 ' : ''}europe-west3 (Frankfurt — EU GDPR)
                  </option>
                  <option value="us-central1" disabled={isSecretGdpr}>
                    {isSecretGdpr ? '🔒 ' : ''}us-central1 (Iowa — US SEC/HIPAA)
                  </option>
                  <option value="us-east4" disabled={isSecretGdpr}>
                    {isSecretGdpr ? '🔒 ' : ''}us-east4 (N. Virginia — US SEC/HIPAA)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Max Rotation Interval (Days) {!isSecretCustom ? '🔒' : ''}
                </label>
                <select
                  value={secretRotationDays}
                  onChange={(e) => setSecretRotationDays(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value={30}>30 Days (Strict Zero-Trust)</option>
                  <option value={60} disabled={isSecretGdpr || isSecretSec}>
                    {isSecretGdpr || isSecretSec ? '🔒 ' : ''}60 Days (HIPAA Standard)
                  </option>
                  <option value={90} disabled={!isSecretCustom}>
                    {!isSecretCustom ? '🔒 ' : ''}90 Days (CIS Max)
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Initial Secret Payload (`Version 1` — Base64 TLS Sealed)
              </label>
              <input
                type="password"
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                placeholder="whsec_... or database connection URI"
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <button
              type="submit"
              disabled={creatingSecret || !secretId.trim()}
              className="w-full py-2 rounded-[8px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {creatingSecret
                ? 'Sealing in Secret Manager...'
                : '🔐 Create & Seal Sovereign Secret Version 1'}
            </button>
          </form>

          {/* Right Column: Live Secrets Inventory + Cloud Armor WAF Synthesizer */}
          <div className="space-y-4">
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-2.5">
              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                <span>
                  Live Secret Manager Inventory ({vaultData?.secrets?.length || 0})
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  KMS KeyRings: {vaultData?.keyRings?.length || 0}
                </span>
              </div>

              {vaultData?.secrets?.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {vaultData.secrets.map((s) => (
                    <div
                      key={s.name}
                      className="p-2.5 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {s.secretId}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {s.replicationMode}{' '}
                          {s.locations?.length > 0
                            ? `(${s.locations.join(', ')})`
                            : ''}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px]">
                        ENCRYPTED
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-500 font-mono py-3">
                  No secrets provisioned yet in `{projectId}`. Use the Sovereign Secret Provisioner on the left to create one.
                </div>
              )}
            </div>

            {/* Cloud Armor OWASP Top-10 & Adaptive DDoS Rate-Limit Synthesizer */}
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-[#ffffff] dark:bg-[#141417] space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  🛡️ Cloud Armor Edge WAF & Layer-7 DDoS Rate-Limit Synthesizer
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  OWASP Top-10 ModSecurity CRS 3.3
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">
                Synthesizes a complete Google Cloud Armor edge security policy blocking SQLi (`sqli-v33-stable`), XSS (`xss-v33-stable`), LFI/RCE scanners, and throttling abusive IPs at `100 req/min` (`429 Too Many Requests`).
              </p>
              <div className="p-2.5 rounded-[8px] bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto">
                {`gcloud compute security-policies create cloudpulse-zero-trust-waf --project=${projectId} && \\
gcloud compute security-policies rules create 1000 --security-policy=cloudpulse-zero-trust-waf --expression="evaluatePreconfiguredWaf('sqli-v33-stable') || evaluatePreconfiguredWaf('xss-v33-stable')" --action=deny-403 --project=${projectId} && \\
gcloud compute security-policies rules create 2000 --security-policy=cloudpulse-zero-trust-waf --src-ip-ranges="*" --action=throttle --rate-limit-threshold-count=100 --rate-limit-threshold-interval-sec=60 --conform-action=allow --exceed-action=deny-429 --enforce-on-key=IP --project=${projectId}`}
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    `gcloud compute security-policies create cloudpulse-zero-trust-waf --project=${projectId} && gcloud compute security-policies rules create 1000 --security-policy=cloudpulse-zero-trust-waf --expression="evaluatePreconfiguredWaf('sqli-v33-stable') || evaluatePreconfiguredWaf('xss-v33-stable')" --action=deny-403 --project=${projectId} && gcloud compute security-policies rules create 2000 --security-policy=cloudpulse-zero-trust-waf --src-ip-ranges="*" --action=throttle --rate-limit-threshold-count=100 --rate-limit-threshold-interval-sec=60 --conform-action=allow --exceed-action=deny-429 --enforce-on-key=IP --project=${projectId}`,
                    'Cloud Armor WAF policy CLI'
                  )
                }
                className="w-full py-1.5 rounded-[8px] border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-mono font-bold cursor-pointer"
              >
                📋 Copy 1-Tap Cloud Armor OWASP + Rate-Limit Deployment CLI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
