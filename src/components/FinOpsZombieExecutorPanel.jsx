import React, { useState } from 'react';
import axios from 'axios';
import {
  Trash2,
  RefreshCw,
  Loader2,
  DollarSign,
  HardDrive,
  Globe,
  Server,
  Database,
  Terminal,
  CheckCircle2,
  PowerOff,
} from 'lucide-react';

export default function FinOpsZombieExecutorPanel({
  projectId,
  onRunInShell,
  onNavigateTab,
  onShowToast,
  onShowError,
}) {
  const [loading, setLoading] = useState(false);
  const [executingId, setExecutingId] = useState(null);
  const [data, setData] = useState(null);

  const runScan = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/zombie-reaper`,
        { action: 'SCAN' }
      );
      setData(res.data || null);
      if (onShowToast) {
        onShowToast(
          `Zombie scan finished: ${res.data?.summary?.totalZombies ?? 0} idle resources ($${res.data?.summary?.totalMonthlySavingsUsd ?? 0}/mo recoverable).`
        );
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Idle-zombie scan failed';
      if (onShowError) onShowError(msg);
    } finally {
      setLoading(false);
    }
  };

  const executeRemediation = async (z) => {
    if (!projectId || !z?.remediationAction) return;
    setExecutingId(z.id);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/zombie-reaper`,
        {
          action: z.remediationAction,
          name: z.name,
          zone: z.zone,
          region: z.region,
          monthlySavingsUsd: z.monthlySavingsUsd,
        }
      );
      if (onShowToast) {
        onShowToast(
          `Executed ${z.remediationLabel} on "${z.name}" (op: ${res.data?.operation || 'submitted'}).`
        );
      }
      runScan();
    } catch (e) {
      if (e?.__cancelledByGatekeeper) return;
      const msg = e.response?.data?.error || e.message || `Failed to execute ${z.remediationLabel}`;
      if (onShowError) onShowError(msg);
    } finally {
      setExecutingId(null);
    }
  };

  const iconForType = (t) => {
    if (t === 'UNATTACHED_DISK') return <HardDrive className="w-4 h-4 text-amber-500" />;
    if (t === 'UNUSED_STATIC_IP') return <Globe className="w-4 h-4 text-blue-500" />;
    if (t === 'ALWAYS_ON_SQL') return <Database className="w-4 h-4 text-emerald-500" />;
    return <Server className="w-4 h-4 text-zinc-500" />;
  };

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              FinOps Idle-Zombie Executor (Live Remediation)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live scan of unattached Persistent Disks, unused Static External IPs, Compute Idle Recommender VMs, and always-on Cloud SQL with 1-click gated cleanup.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading || !projectId}
          onClick={runScan}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? 'Scanning Zombies...' : 'Scan Idle Zombies'}
        </button>
      </div>

      {!data && !loading && (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-[#242c3f] p-4 text-xs text-zinc-500 dark:text-zinc-400">
          Click <strong>Scan Idle Zombies</strong> to inspect live Compute Engine disks, static IPs, idle VMs, and Cloud SQL instances for recoverable monthly spend.
        </div>
      )}

      {data && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] p-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Idle Zombies Found</div>
              <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {data.summary.totalZombies}
              </div>
              <div className="text-[11px] text-zinc-500">
                {data.summary.actionableCount} 1-click remediable
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] p-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Monthly Savings
              </div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${data.summary.totalMonthlySavingsUsd.toFixed(2)}/mo
              </div>
              <div className="text-[11px] text-zinc-500">
                ${data.summary.totalAnnualSavingsUsd.toFixed(2)}/yr annualized
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] p-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Compute API</div>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                Disks: {data.apiStatus?.computeDisks} · IPs: {data.apiStatus?.computeAddresses}
              </div>
            </div>
            <div className="rounded-lg border border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] p-3">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">SQL & Instances</div>
              <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
                VMs: {data.apiStatus?.computeInstances} · SQL: {data.apiStatus?.cloudSql}
              </div>
            </div>
          </div>

          {data.zombies?.length === 0 ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Zero idle zombies detected across Persistent Disks, Static External IPs, stopped VMs, and Cloud SQL.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-[#1e2433]">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-[#0a0e17] text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#1e2433]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Resource</th>
                    <th className="px-3 py-2 font-medium">Location</th>
                    <th className="px-3 py-2 font-medium">Details</th>
                    <th className="px-3 py-2 font-medium">Est. Savings</th>
                    <th className="px-3 py-2 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-[#1e2433]">
                  {data.zombies.map((z) => (
                    <tr key={z.id} className="hover:bg-zinc-50/70 dark:hover:bg-[#111726]">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {iconForType(z.resourceType)}
                          <div>
                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{z.name}</div>
                            <div className="text-[11px] text-zinc-500">{z.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                        {z.location}
                      </td>
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300 max-w-xs">
                        {z.detail}
                      </td>
                      <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">
                        ${Number(z.monthlySavingsUsd || 0).toFixed(2)}/mo
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {z.remediationAction ? (
                            <button
                              type="button"
                              disabled={executingId === z.id}
                              onClick={() => executeRemediation(z)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-medium"
                            >
                              {executingId === z.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : z.remediationAction === 'STOP_VM' ? (
                                <PowerOff className="w-3 h-3" />
                              ) : (
                                <Trash2 className="w-3 h-3" />
                              )}
                              {z.remediationLabel}
                            </button>
                          ) : (
                            onNavigateTab &&
                            (z.resourceType === 'STOPPED_VM_STORAGE' || z.resourceType === 'ALWAYS_ON_SQL') && (
                              <button
                                type="button"
                                onClick={() =>
                                  onNavigateTab(
                                    z.resourceType === 'ALWAYS_ON_SQL' ? 'CLOUD_SQL_STUDIO' : 'VM_SSH'
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-[#1e2433] text-zinc-700 dark:text-zinc-200 hover:border-amber-500 text-[11px] font-medium cursor-pointer"
                              >
                                {z.resourceType === 'ALWAYS_ON_SQL' ? 'Open Cloud SQL →' : 'Open VM Studio →'}
                              </button>
                            )
                          )}
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() => onRunInShell(z.gcloudCmd)}
                              className="p-1.5 rounded-md border border-zinc-200 dark:border-[#1e2433] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#161e2e]"
                              title="Run gcloud in Cloud Shell"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
