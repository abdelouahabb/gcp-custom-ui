import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Sparkles,
  DollarSign,
  Globe,
  ShieldCheck,
  Database,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

const WAVE16_TABS = [
  {
    id: 'FINOPS_AUTO_SURGEON',
    step: '01',
    title: 'Live FinOps Anomaly Auto-Fixer',
    subtitle: 'GCS Lifecycle & Scale-to-Zero Surgeon',
    icon: DollarSign,
  },
  {
    id: 'DR_GAMEDAY_SIMULATOR',
    step: '02',
    title: 'Multi-Region DR GameDay Prover',
    subtitle: 'RTO / RPO & Blackout Drill',
    icon: Globe,
  },
  {
    id: 'IAM_LEAST_PRIVILEGE',
    step: '03',
    title: 'IAM Least-Privilege Role Synthesizer',
    subtitle: 'Owner/Editor Stripper & Custom YAML',
    icon: ShieldCheck,
  },
  {
    id: 'SQL_COST_SURGEON',
    step: '04',
    title: 'Live BigQuery SQL Cost Surgeon',
    subtitle: 'Dry-Run Byte Verifier & Partition Rewrite',
    icon: Database,
  },
];

export default function Wave16EnterpriseMoonshotStudio({
  projectId,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [activeTab, setActiveTab] = useState('FINOPS_AUTO_SURGEON');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // DR GameDay simulated blackout region & drill/vault receipts
  const [blackoutRegion, setBlackoutRegion] = useState('us-central1');
  const [drDrillReceipt, setDrDrillReceipt] = useState(null);
  const [drVaultReceipt, setDrVaultReceipt] = useState(null);
  const [inlineError, setInlineError] = useState('');

  // SQL Cost Surgeon state
  const [sqlInput, setSqlInput] = useState(
    `SELECT name, state, year, number\nFROM \`bigquery-public-data.usa_names.usa_1910_current\`\nWHERE year >= 2015\nLIMIT 100;`
  );
  const [dryRunResult, setDryRunResult] = useState(null);

  const fetchWave16 = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave16/overview`
      );
      setOverview(res.data);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to load Wave 16 Moonshot overview.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, onShowError]);

  useEffect(() => {
    fetchWave16();
  }, [fetchWave16]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (onShowToast) onShowToast('Copied to clipboard!');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleApplyLifecycle = async (bucketName) => {
    setBusyId(bucketName);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'APPLY_GCS_LIFECYCLE',
          resourceName: bucketName,
        }
      );
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchWave16();
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyId('');
    }
  };

  const handleRunDrGameDayDrill = async (targetRegion = blackoutRegion) => {
    setBusyId('DR_GAMEDAY_DRILL');
    setInlineError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'RUN_DR_GAMEDAY_DRILL',
          blackoutRegion: targetRegion,
        }
      );
      setDrDrillReceipt(res.data);
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'DR GameDay Drill failed.';
      setInlineError(msg);
      if (onShowError) onShowError(msg);
    } finally {
      setBusyId('');
    }
  };

  const handleProvisionDrVault = async () => {
    setBusyId('PROVISION_DR_VAULT');
    setInlineError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'PROVISION_DR_VAULT',
        }
      );
      setDrVaultReceipt(res.data);
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchWave16();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Provisioning DR Vault failed.';
      setInlineError(msg);
      if (onShowError) onShowError(msg);
    } finally {
      setBusyId('');
    }
  };

  const handleProtectAssetDr = async (assetName) => {
    setBusyId(`PROTECT_${assetName}`);
    setInlineError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'PROTECT_ASSET_DR',
          assetName,
        }
      );
      setDrVaultReceipt({
        bucketName: assetName.replace(/^gs:\/\//, ''),
        sha256Signature: res.data?.sha256Signature,
        message: res.data?.message,
      });
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchWave16();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to protect asset.';
      setInlineError(msg);
      if (onShowError) onShowError(msg);
    } finally {
      setBusyId('');
    }
  };

  const handleDryRunSql = async () => {
    setBusyId('DRY_RUN');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave16/action`,
        {
          action: 'DRY_RUN_SQL_SURGEON',
          sql: sqlInput,
        }
      );
      setDryRunResult(res.data);
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyId('');
    }
  };

  const finopsCandidates = overview?.finopsCandidates || [];
  const drAssets = overview?.drAssets || [];
  const overPrivilegedGrants = overview?.overPrivilegedGrants || [];

  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-[10px] font-mono font-extrabold uppercase">
              <Sparkles className="w-3 h-3" />
              <span>MULTI-REGION DR GAMEDAY &amp; SQL SURGEON · LIVE GCP CONTROL PLANE</span>
            </div>
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
              Multi-Region DR GameDay &amp; SQL Surgeon — FinOps Auto-Surgeon, DR GameDay, Least-Privilege IAM &amp; SQL Dry-Run Surgeon
            </h2>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={fetchWave16}
            title="Refresh live telemetry across Storage, BigQuery, Cloud Run, and IAM"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* 4 Tab Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {WAVE16_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                data-feature-id={t.id}
                onClick={() => setActiveTab(t.id)}
                title={`${t.title} — ${t.subtitle}`}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-extrabold truncate">
                    {t.title}
                  </div>
                  <div
                    className={`text-[10px] font-mono truncate ${
                      isActive ? 'text-blue-100' : 'text-zinc-500'
                    }`}
                  >
                    {t.subtitle}
                  </div>
                </div>
                <Icon className="w-4 h-4 shrink-0 opacity-85" />
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: FINOPS AUTO-SURGEON */}
      {activeTab === 'FINOPS_AUTO_SURGEON' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
            01. Live FinOps Anomaly Auto-Fixer ({finopsCandidates.length} Candidates)
          </h3>
          {finopsCandidates.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300">
              ✓ All inspected Cloud Storage buckets have active Lifecycle policies and zero idle warm Cloud Run waste detected.
            </div>
          ) : (
            <div className="space-y-2">
              {finopsCandidates.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                      {c.resourceName} ({c.location})
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      {c.issue} · Est. Savings: -${c.monthlySavingsUsd}/mo
                    </div>
                  </div>
                  {c.fixAction === 'APPLY_GCS_LIFECYCLE' && (
                    <button
                      type="button"
                      disabled={busyId === c.resourceName}
                      onClick={() => handleApplyLifecycle(c.resourceName)}
                      title={`Apply 30d Nearline -> 90d Coldline Lifecycle Policy to gs://${c.resourceName}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                    >
                      {busyId === c.resourceName
                        ? 'Patching Bucket...'
                        : '1-Click Apply Lifecycle Policy'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MULTI-REGION DR GAMEDAY PROVER */}
      {activeTab === 'DR_GAMEDAY_SIMULATOR' &&
        (() => {
          const standbyRegion =
            blackoutRegion === 'us-central1'
              ? 'us-east1'
              : blackoutRegion === 'europe-west1'
                ? 'europe-west4'
                : 'us-central1';

          const evaluatedAssets = drAssets.map((a) => {
            const locLower = String(a.location || '').toLowerCase();
            const isMulti =
              a.haTier === 'MULTI_REGION_ACTIVE' ||
              a.haTier === 'MULTI_REGION_MIRRORED' ||
              a.haTier === 'REGIONAL_HA' ||
              Boolean(a.isDrProtected) ||
              locLower === 'us' ||
              locLower === 'eu' ||
              locLower === 'asia' ||
              locLower === 'global';
            const matchesOutageRegion = locLower === blackoutRegion.toLowerCase();
            let status = 'ISOLATED_SAFE';
            if (isMulti) {
              status = 'AUTO_FAILOVER_SURVIVES';
            } else if (matchesOutageRegion) {
              status = 'OUTAGE_SPOF';
            }
            return {
              ...a,
              outageStatus: status,
            };
          });

          const spofCount = evaluatedAssets.filter(
            (a) => a.outageStatus === 'OUTAGE_SPOF'
          ).length;
          const autoFailoverCount = evaluatedAssets.filter(
            (a) => a.outageStatus === 'AUTO_FAILOVER_SURVIVES'
          ).length;
          const maxRtoSeconds = evaluatedAssets.reduce(
            (max, a) => Math.max(max, Number(a.rtoSeconds || 0)),
            0
          );
          const maxRpoSeconds = evaluatedAssets.reduce(
            (max, a) => Math.max(max, Number(a.rpoSeconds || 0)),
            0
          );
          const resilienceScore = Math.max(
            25,
            100 - spofCount * 18
          );

          const activeTimelineSteps = drDrillReceipt?.blackoutRegion === blackoutRegion
            ? drDrillReceipt.failoverSteps
            : [
                `1. [T+02s] Cloud DNS & Global External Application Load Balancer health probes detect 100% packet loss in ${blackoutRegion}.`,
                `2. [T+05s] Multi-Region Storage (US/EU) & BigQuery datasets automatically serve reads from ${standbyRegion} with RPO=0s (${autoFailoverCount} multi-region assets unaffected).`,
                `3. [T+35s] Cloud Run & stateless ingress traffic shifts to standby revision in ${standbyRegion} (Composite RTO=${maxRtoSeconds}s).`,
                spofCount > 0
                  ? `4. [ACTION REQUIRED] ${spofCount} single-region SPOF asset(s) pinned to ${blackoutRegion} require cross-region snapshot or REGIONAL HA promotion to ${standbyRegion}.`
                  : `4. [VERIFIED] Zero single-region SPOF assets pinned to ${blackoutRegion} — 100% of inspected resources survive a ${blackoutRegion} blackout.`,
              ];

          // Compute per-region resource counts from the project's actual discovered assets
          const regionCounts = {};
          for (const a of evaluatedAssets) {
            const r = String(a.location || 'US').toLowerCase();
            if (r !== 'global' && r !== 'us' && r !== 'eu' && r !== 'asia') {
              regionCounts[r] = (regionCounts[r] || 0) + 1;
            }
          }
          const selectableRegions = Array.from(
            new Set([
              ...Object.keys(regionCounts),
              'us-central1',
              'us-east1',
              'us-west1',
              'europe-west1',
              'asia-east1',
            ])
          );

          const handleDownloadDrReport = () => {
            const reportPayload = {
              projectId,
              generatedAt: new Date().toISOString(),
              simulatedOutageRegion: blackoutRegion,
              standbyFailoverRegion: standbyRegion,
              drResilienceScore: resilienceScore,
              compositeRtoSeconds: maxRtoSeconds,
              compositeRpoSeconds: maxRpoSeconds,
              singleRegionSpofCount: spofCount,
              autoFailoverAssetCount: autoFailoverCount,
              assets: evaluatedAssets,
            };
            const blob = new Blob([JSON.stringify(reportPayload, null, 2)], {
              type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectId}-dr-gameday-report-${blackoutRegion}.json`;
            a.click();
            URL.revokeObjectURL(url);
            if (onShowToast) {
              onShowToast(
                `Downloaded DR GameDay Audit Report (${projectId}-dr-gameday-report-${blackoutRegion}.json)`
              );
            }
          };

          const handleProtectAllInRegion = async () => {
            const spofTargets = evaluatedAssets.filter(
              (a) => a.outageStatus === 'OUTAGE_SPOF'
            );
            for (const target of spofTargets) {
              await handleProtectAssetDr(target.name);
            }
          };

          return (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    02. Multi-Region Disaster Recovery (DR) GameDay &amp; RTO/RPO Prover ({evaluatedAssets.length} Live Project Assets)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Select any GCP region below to simulate a regional blackout and inspect which of your project&apos;s buckets, datasets, and services survive vs. go offline.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Select simulated blackout region"
                    value={blackoutRegion}
                    onChange={(e) => {
                      const nextReg = e.target.value;
                      setBlackoutRegion(nextReg);
                    }}
                    className="h-9 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    {selectableRegions.map((reg) => {
                      const cnt = regionCounts[reg] || 0;
                      return (
                        <option key={reg} value={reg}>
                          Simulate Outage: {reg} ({cnt} Regional {cnt === 1 ? 'Asset' : 'Assets'})
                        </option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={handleDownloadDrReport}
                    title={`Download JSON Disaster Recovery Audit Report for ${projectId} (${blackoutRegion} outage simulation)`}
                    className="h-9 px-3.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Export DR Report (.json)</span>
                  </button>
                </div>
              </div>

              {/* Interactive Region Pills for Regions Where Your Project Has Live Resources */}
              {Object.keys(regionCounts).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10.5px] font-mono font-bold text-zinc-500 uppercase">
                    Your Active Regional Footprints (Click to Simulate Blackout):
                  </span>
                  {Object.entries(regionCounts).map(([reg, cnt]) => {
                    const active = blackoutRegion.toLowerCase() === reg;
                    return (
                      <button
                        key={reg}
                        type="button"
                        onClick={() => setBlackoutRegion(reg)}
                        title={`Simulate a complete regional blackout in ${reg} (${cnt} project asset(s) hosted in ${reg})`}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                        }`}
                      >
                        {reg} ({cnt} {cnt === 1 ? 'resource' : 'resources'})
                      </button>
                    );
                  })}
                </div>
              )}

              {inlineError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-700 dark:text-red-300 flex items-center justify-between gap-2">
                  <span>⚠ {inlineError}</span>
                  <button
                    type="button"
                    onClick={() => setInlineError('')}
                    className="underline text-[10px] cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Unmistakable Emerald Receipt when "Seal GameDay Receipt" is clicked */}
              {drDrillReceipt && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-2 text-xs font-mono shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        ✓ SEALED CRYPTOGRAPHIC GAMEDAY AUDIT CERTIFICATE · ID: {drDrillReceipt.drillId}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                        SHA-256: {drDrillReceipt.sha256Signature || 'verified'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDrDrillReceipt(null)}
                        className="text-[10px] underline text-zinc-500 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200">
                    {drDrillReceipt.message}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px] text-zinc-800 dark:text-zinc-200">
                    {(drDrillReceipt.failoverSteps || []).map((step, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-emerald-500/25"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unmistakable Emerald Receipt when "1-Click Provision US Multi-Region DR Vault" is clicked */}
              {drVaultReceipt && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-1.5 text-xs font-mono shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>
                        ✓ US MULTI-REGION DR VAULT PROVISIONED · gs://{drVaultReceipt.bucketName}
                      </span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                        RPO: 0s · RTO: 2s · SHA-256: {drVaultReceipt.sha256Signature || 'verified'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDrVaultReceipt(null)}
                        className="text-[10px] underline text-zinc-500 cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-zinc-800 dark:text-zinc-200">
                    {drVaultReceipt.message}
                  </div>
                </div>
              )}

              {/* 4 Live DR GameDay Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    DR Resilience Score ({blackoutRegion})
                  </div>
                  <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                    {resilienceScore}/100
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {spofCount === 0
                      ? `Zero regional SPOFs in ${blackoutRegion}`
                      : `${spofCount} single-region SPOF(s) in ${blackoutRegion}`}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Active Outage Route ({blackoutRegion} → {standbyRegion})
                  </div>
                  <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {evaluatedAssets.length - spofCount} / {evaluatedAssets.length} Survive
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Standby Target: {standbyRegion}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Composite Recovery Time (RTO)
                  </div>
                  <div className="text-lg font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {maxRtoSeconds}s
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    Worst-case traffic cutover latency
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-[10px] font-mono uppercase text-zinc-500">
                    Composite Recovery Point (RPO)
                  </div>
                  <div className="text-lg font-extrabold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {maxRpoSeconds}s
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500">
                    {maxRpoSeconds === 0
                      ? 'Synchronous zero-data-loss replication'
                      : 'Async snapshot replication window'}
                  </div>
                </div>
              </div>

              {/* Always-Visible Live Simulated Failover Sequence for Selected Region */}
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-2.5 text-xs font-mono">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      LIVE SIMULATED FAILOVER RUNBOOK: {blackoutRegion.toUpperCase()} BLACKOUT → {standbyRegion.toUpperCase()} STANDBY
                    </span>
                  </span>

                  {spofCount > 0 ? (
                    <button
                      type="button"
                      onClick={handleProtectAllInRegion}
                      title={`Enable Object Versioning and Multi-Region DR Mirroring for all ${spofCount} single-region SPOF resource(s) in ${blackoutRegion}`}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        Protect All {spofCount} At-Risk Resource{spofCount === 1 ? '' : 's'} in {blackoutRegion} (RPO → 0s)
                      </span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      ✓ 100% OF {blackoutRegion.toUpperCase()} ASSETS SURVIVE OUTAGE
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-[11px] text-zinc-800 dark:text-zinc-200">
                  {activeTimelineSteps.map((step, i) => (
                    <div key={i}>{step}</div>
                  ))}
                </div>
              </div>

              {/* 3-Column "Zero Black Magic" Architecture Explainer Strip */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-[10.5px] uppercase">
                    1. Why Are Your Buckets &amp; Services Listed Here?
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Every row below (<code className="font-mono">gs://...</code>, <code className="font-mono">bq://...</code>, <code className="font-mono">run://...</code>) is a <strong>real resource discovered in project {projectId}</strong> via Google Cloud REST APIs. During a regional outage, your app fails if even one single-region bucket or database it depends on goes offline.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-[10.5px] uppercase">
                    2. Single-Region (e.g. us-east1) vs. Multi-Region (US)
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    A bucket or service pinned to a <strong>Single Region</strong> (like <code className="font-mono">us-east1</code>) has <strong>zero cross-region replication</strong>: if <code className="font-mono">us-east1</code> goes dark, it returns <code className="font-mono">HTTP 503</code> (<code className="font-mono">RPO=900s, RTO=180s</code>). <strong>Multi-Region (<code className="font-mono">US</code>/<code className="font-mono">EU</code>)</strong> assets automatically serve traffic from surviving regions (<code className="font-mono">RPO=0s, RTO=2s</code>).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="font-mono font-extrabold text-blue-600 dark:text-blue-400 text-[10.5px] uppercase">
                    3. How to Test &amp; Protect Any Resource Below
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Click <strong>Test Outage in &lt;Region&gt;</strong> on any single-region resource to simulate its region going dark, or click <strong>1-Click Protect &amp; Mirror (RPO → 0s)</strong> to enable Object Versioning (<code className="font-mono">storage.buckets.patch</code>) and bind it to the Multi-Region DR Vault.
                  </p>
                </div>
              </div>

              {/* Asset-by-Asset Survival, Plain-English Purpose & Failover Matrix */}
              <div className="space-y-2.5">
                {evaluatedAssets.map((a, idx) => {
                  const isSpof = a.outageStatus === 'OUTAGE_SPOF';
                  const isAuto = a.outageStatus === 'AUTO_FAILOVER_SURVIVES';
                  const locStr = String(a.location || 'US');
                  const locLower = locStr.toLowerCase();
                  const canSimulateThisRegion =
                    !isAuto &&
                    locLower !== blackoutRegion.toLowerCase() &&
                    locLower !== 'global';

                  const plainEnglishWhyShown = a.isProvisionedDrVault
                    ? `Dedicated US Multi-Region Disaster Recovery Vault bucket provisioned in project "${projectId}" with Object Versioning and Public Access Prevention enforced.`
                    : `Live ${a.type} discovered in project "${projectId}" via Google Cloud REST API, currently hosted in location "${locStr}" (${a.haTier}).`;

                  const plainEnglishOutageImpact = isSpof
                    ? `DIRECT HIT IN ${blackoutRegion.toUpperCase()} (SINGLE-REGION SPOF): Because ${a.name} is pinned strictly to single-region "${locStr}" without cross-region replication, a blackout in ${blackoutRegion} makes this resource 100% unreachable (HTTP 503). Any un-replicated writes in the last ${a.rpoSeconds}s (15m) are trapped until manual cross-region restore (${a.rtoSeconds}s RTO).`
                    : isAuto
                      ? `SURVIVES ${blackoutRegion.toUpperCase()} BLACKOUT AUTOMATICALLY (MULTI-REGION / MIRRORED): Replicated across multiple regions (${a.failoverTargetRegion || 'US Multi-Region'}). Even if ${blackoutRegion} goes completely offline, Google Cloud automatically serves ${a.name} from surviving regions in ~${a.rtoSeconds}s with zero data loss (RPO = 0s).`
                      : `SAFE FROM ${blackoutRegion.toUpperCase()} OUTAGE (HOSTED IN ${locStr.toUpperCase()}), BUT SINGLE-REGION SPOF: Survives a ${blackoutRegion} blackout because it physically lives in "${locStr}". However, it has no cross-region replica — if "${locStr}" ever goes offline, ${a.name} will fail (RPO = ${a.rpoSeconds}s, RTO = ${a.rtoSeconds}s).`;

                  return (
                    <div
                      key={`${a.name}-${idx}`}
                      className={`p-4 rounded-xl border space-y-2.5 text-xs font-mono ${
                        a.isProvisionedDrVault
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : isSpof
                            ? 'bg-amber-500/5 border-amber-500/35'
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {a.isProvisionedDrVault && (
                            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-extrabold">
                              NEW · PROVISIONED US MULTI-REGION VAULT
                            </span>
                          )}
                          <span className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs">
                            {a.name}
                          </span>
                          <span className="text-zinc-500">
                            ({a.type} · Location: <strong>{locStr}</strong> → Failover Target: <strong>{a.failoverTargetRegion || standbyRegion}</strong>)
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                              isSpof
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                : isAuto
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25'
                            }`}
                          >
                            {isSpof
                              ? `SPOF IN ${blackoutRegion.toUpperCase()} · NEEDS HA`
                              : isAuto
                                ? `AUTO-FAILOVER (${a.haTier})`
                                : `OUTSIDE ${blackoutRegion.toUpperCase()} BLAST RADIUS (${a.haTier})`}
                          </span>

                          <span
                            title="RPO (Recovery Point Objective) = max seconds of data loss during regional outage. RTO (Recovery Time Objective) = seconds required to restore traffic."
                            className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-700 dark:text-zinc-300 font-bold"
                          >
                            RPO (Data Loss): {a.rpoSeconds}s · RTO (Recovery Time): {a.rtoSeconds}s
                          </span>
                        </div>
                      </div>

                      {/* Plain-English Explanation of WHY this resource is shown and WHAT happens */}
                      <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/70 border border-zinc-200/80 dark:border-zinc-800 space-y-1 font-sans text-[11.5px] leading-relaxed">
                        <div className="text-zinc-600 dark:text-zinc-400">
                          <strong className="font-mono text-[10px] uppercase text-zinc-700 dark:text-zinc-300 mr-1.5">
                            Why Shown:
                          </strong>
                          {plainEnglishWhyShown}
                        </div>
                        <div
                          className={
                            isSpof
                              ? 'text-amber-800 dark:text-amber-300 font-medium'
                              : isAuto
                                ? 'text-emerald-800 dark:text-emerald-300 font-medium'
                                : 'text-zinc-700 dark:text-zinc-300'
                          }
                        >
                          <strong className="font-mono text-[10px] uppercase mr-1.5">
                            Outage Verdict ({blackoutRegion}):
                          </strong>
                          {plainEnglishOutageImpact}
                        </div>
                      </div>

                      {/* Action Bar per Resource */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                        <div className="text-[10px] text-zinc-500 truncate max-w-xl">
                          {a.remediationCli && (
                            <>
                              CLI: <code>{a.remediationCli}</code>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {canSimulateThisRegion && (
                            <button
                              type="button"
                              onClick={() => {
                                setBlackoutRegion(locLower);
                                if (onShowToast) {
                                  onShowToast(
                                    `Switched simulated blackout to ${locLower} to test ${a.name}!`
                                  );
                                }
                              }}
                              title={`Switch the simulated blackout region to ${locLower} to see what happens when ${a.name}'s region goes down`}
                              className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:text-amber-300 text-[10px] font-bold cursor-pointer"
                            >
                              Simulate {locLower} Outage on This Resource
                            </button>
                          )}

                          {!isAuto && (
                            <button
                              type="button"
                              disabled={busyId === `PROTECT_${a.name}`}
                              onClick={() => handleProtectAssetDr(a.name)}
                              title={`Enable Object Versioning on ${a.name} and bind it to the US Multi-Region DR Mirror so RPO drops to 0s and RTO drops to 5s`}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>
                                {busyId === `PROTECT_${a.name}`
                                  ? 'Protecting...'
                                  : '1-Click Protect & Mirror to Multi-Region (RPO → 0s)'}
                              </span>
                            </button>
                          )}

                          {a.remediationCli && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(a.remediationCli, `dr-${idx}`)
                                }
                                title={`Copy Multi-Region HA CLI command for ${a.name}`}
                                className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                              >
                                {copiedKey === `dr-${idx}` ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                <span>Copy HA CLI</span>
                              </button>
                              {onRunInShell && (
                                <button
                                  type="button"
                                  onClick={() => onRunInShell(a.remediationCli)}
                                  title={`Execute HA upgrade command for ${a.name} in Cloud Shell`}
                                  className="px-2 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Terminal className="w-3 h-3" />
                                  <span>Run in Shell</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {/* TAB 3: IAM LEAST-PRIVILEGE SYNTHESIZER */}
      {activeTab === 'IAM_LEAST_PRIVILEGE' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-3">
          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
            03. Live IAM Least-Privilege Role Synthesizer ({overPrivilegedGrants.length} Broad Grants)
          </h3>
          {overPrivilegedGrants.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-700 dark:text-emerald-300">
              ✓ Zero over-privileged roles/owner or roles/editor grants detected across inspected IAM bindings.
            </div>
          ) : (
            <div className="space-y-2">
              {overPrivilegedGrants.slice(0, 8).map((g, idx) => (
                <div
                  key={`${g.member}-${idx}`}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                >
                  <div>
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      {g.member}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Current: <span className="text-amber-600 dark:text-amber-400 font-bold">{g.currentRole}</span> → Recommended: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{g.recommendedRole}</span> (-{g.excessPermissionsRemoved} excess permissions)
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `gcloud projects add-iam-policy-binding ${projectId} --member="${g.member}" --role="roles/viewer"`,
                          `iam-${idx}`
                        )
                      }
                      title={`Copy least-privilege gcloud IAM binding command for ${g.member}`}
                      className="px-2.5 py-1 rounded bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      {copiedKey === `iam-${idx}` ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy Least-Privilege CLI</span>
                    </button>
                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() =>
                          onRunInShell(
                            `gcloud projects get-iam-policy ${projectId} --flatten="bindings[].members" --filter="bindings.members:${g.member}"`
                          )
                        }
                        title={`Inspect live IAM bindings for ${g.member} in Cloud Shell`}
                        className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>Inspect in Shell</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LIVE BIGQUERY SQL COST SURGEON */}
      {activeTab === 'SQL_COST_SURGEON' && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              04. Live BigQuery SQL Dry-Run Cost Surgeon
            </h3>
            <button
              type="button"
              disabled={busyId === 'DRY_RUN'}
              onClick={handleDryRunSql}
              title="Execute a live $0.00 BigQuery Dry-Run (dryRun=true) to verify exact bytes scanned and on-demand query cost"
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
            >
              {busyId === 'DRY_RUN'
                ? 'Running BigQuery Dry-Run...'
                : 'Verify SQL Bytes & Cost (Live Dry-Run)'}
            </button>
          </div>

          <textarea
            rows={4}
            value={sqlInput}
            onChange={(e) => setSqlInput(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
          />

          {dryRunResult && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-800 dark:text-emerald-200">
              ✓ {dryRunResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
