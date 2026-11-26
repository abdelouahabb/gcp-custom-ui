import React, { useState } from 'react';
import axios from 'axios';
import {
  ShieldCheck,
  RefreshCw,
  Loader2,
  KeyRound,
  UserCheck,
  Clock,
  Terminal,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';

export default function IamPamGovernancePanel({
  projectId,
  onRunInShell,
  onNavigateTab,
  onShowToast,
  onShowError,
}) {
  const [loading, setLoading] = useState(false);
  const [requestingEnt, setRequestingEnt] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('STANDING');
  const [data, setData] = useState(null);

  const runAudit = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/iam-pam`,
        { action: 'AUDIT' }
      );
      setData(res.data || null);
      if (onShowToast) {
        onShowToast(
          `IAM & PAM audit complete: ${res.data?.summary?.standingPrivilegedCount ?? 0} standing high-priv principals, ${res.data?.summary?.pamEntitlementsCount ?? 0} PAM entitlements.`
        );
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'IAM & PAM audit failed';
      if (onShowError) onShowError(msg);
    } finally {
      setLoading(false);
    }
  };

  const requestPamGrant = async (ent) => {
    if (!projectId || !ent?.name) return;
    setRequestingEnt(ent.name);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave27/iam-pam`,
        {
          action: 'REQUEST_PAM_GRANT',
          entitlementName: ent.name,
          entitlementShort: ent.shortName,
          durationSeconds: 1800,
          justification: 'CloudPulse JIT operational access (30m)',
        }
      );
      if (onShowToast) {
        onShowToast(`PAM JIT grant requested for "${ent.shortName}" (state: ${res.data?.grant?.state || 'SUBMITTED'}).`);
      }
    } catch (e) {
      if (e?.__cancelledByGatekeeper) return;
      const msg = e.response?.data?.error || e.message || 'PAM grant request failed';
      if (onShowError) onShowError(msg);
    } finally {
      setRequestingEnt(null);
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 dark:border-[#1e2433] bg-white dark:bg-[#0d111a] p-4 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              IAM Least-Privilege & PAM Just-in-Time Access Control
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Live IAM Policy audit, GCP IAM Recommender findings, stale &gt;90d SA keys, and Privileged Access Manager (PAM) JIT grants.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading || !projectId}
          onClick={runAudit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium shadow-sm transition"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {loading ? 'Auditing IAM & PAM...' : 'Audit IAM & PAM'}
        </button>
      </div>

      {!data && !loading && (
        <div className="rounded-lg border border-dashed border-zinc-300 dark:border-[#242c3f] p-4 text-xs text-zinc-500 dark:text-zinc-400">
          Click <strong>Audit IAM & PAM</strong> to inspect live `roles/owner` & `roles/editor` bindings, IAM Recommender unused-permission findings, stale user-managed SA keys, and PAM entitlements.
        </div>
      )}

      {data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'STANDING',
                label: 'Standing High-Priv',
                icon: UserCheck,
                value: data.summary.standingPrivilegedCount,
                sub: 'Click to inspect bindings',
              },
              {
                id: 'RECOMMENDER',
                label: 'IAM Recommender',
                icon: ShieldCheck,
                value: data.summary.recommenderFindings,
                sub: data.apiStatus?.iamRecommender,
              },
              {
                id: 'KEYS',
                label: 'Stale SA Keys (>90d)',
                icon: KeyRound,
                value: `${data.summary.staleKeysOver90d} / ${data.summary.userManagedKeys}`,
                sub: 'Click to inspect keys',
              },
              {
                id: 'PAM',
                label: 'PAM JIT Entitlements',
                icon: Clock,
                value: data.summary.pamEntitlementsCount,
                sub: data.apiStatus?.pamEntitlements,
              },
            ].map((card) => {
              const Icon = card.icon;
              const active = activeSubTab === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setActiveSubTab(card.id)}
                  className={`text-left rounded-lg border p-3 transition cursor-pointer ${
                    active
                      ? 'border-amber-500 bg-amber-500/12'
                      : 'border-zinc-200 dark:border-[#1e2433] bg-zinc-50 dark:bg-[#0a0e17] hover:border-zinc-300 dark:hover:border-[#2c364d]'
                  }`}
                >
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Icon className="w-3.5 h-3.5" /> {card.label}
                  </div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {card.value}
                  </div>
                  <div className="text-[11px] text-zinc-500">{card.sub}</div>
                </button>
              );
            })}
          </div>

          <MermaidArchitectureDiagram
            title="IAM Standing Privileges & PAM Just-in-Time Access Graph"
            code={data.mermaidGraph}
            defaultExpanded={false}
          />

          <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-200 dark:border-[#1e2433] pb-2">
            {[
              { id: 'STANDING', label: `Standing Privileges (${data.standingPrivileged.length})` },
              { id: 'RECOMMENDER', label: `IAM Recommender (${data.recommendations.length})` },
              { id: 'KEYS', label: `SA Keys (${data.staleKeys.length})` },
              { id: 'PAM', label: `PAM Entitlements (${data.entitlements.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveSubTab(t.id)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                  activeSubTab === t.id
                    ? 'bg-amber-500 text-zinc-950 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#161e2e]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeSubTab === 'STANDING' && (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-[#1e2433]">
              {data.standingPrivileged.length === 0 ? (
                <div className="p-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Zero standing Owner/Editor principals detected.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-[#0a0e17] text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-[#1e2433]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Principal</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium">Risk</th>
                      <th className="px-3 py-2 font-medium text-right">CLI Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-[#1e2433]">
                    {data.standingPrivileged.map((sp, i) => (
                      <tr key={`${sp.member}-${sp.role}-${i}`} className="hover:bg-zinc-50/70 dark:hover:bg-[#111726]">
                        <td className="px-3 py-2 font-mono text-[11px] text-zinc-900 dark:text-zinc-100">{sp.member}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{sp.role}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-3 h-3" /> {sp.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() => onRunInShell(sp.removeCmd)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-200 dark:border-[#1e2433] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161e2e] text-[11px]"
                            >
                              <Terminal className="w-3 h-3" /> Revoke in Shell
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeSubTab === 'RECOMMENDER' && (
            <div className="space-y-2">
              {data.recommendations.length === 0 ? (
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-[#1e2433] text-xs text-zinc-500">
                  No active IAM Recommender findings (API status: {data.apiStatus?.iamRecommender}).
                </div>
              ) : (
                data.recommendations.map((rec) => (
                  <div key={rec.id} className="rounded-lg border border-zinc-200 dark:border-[#1e2433] p-3 text-xs flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        [{rec.priority}] {rec.subtype}
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 mt-0.5">{rec.description}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                      {rec.state}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'KEYS' && (
            <div className="space-y-2">
              {data.staleKeys.length === 0 ? (
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Zero user-managed Service Account keys found (keyless ADC/WIF posture).
                </div>
              ) : (
                data.staleKeys.map((k) => (
                  <div key={k.keyId} className="rounded-lg border border-zinc-200 dark:border-[#1e2433] p-3 text-xs flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-zinc-900 dark:text-zinc-100">{k.serviceAccount}</div>
                      <div className="text-zinc-500 mt-0.5">
                        Key {k.keyId.slice(0, 12)}… · Age: <strong>{k.ageDays}d</strong> {k.stale ? '(STALE > 90d)' : ''}
                      </div>
                    </div>
                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(k.deleteCmd)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-[#1e2433] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161e2e] text-[11px]"
                      >
                        <Terminal className="w-3 h-3" /> Delete Key in Shell
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeSubTab === 'PAM' && (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                <span>
                  Quick 30m JIT grants for existing entitlements — create or approve new PAM entitlements in Sovereign IAM Studio.
                </span>
                {onNavigateTab && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onNavigateTab('SRE_WAR_ROOM', 'SCC_VULNS')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-[#242c3f] text-zinc-700 dark:text-zinc-200 hover:border-amber-500 text-[11px] font-medium cursor-pointer"
                    >
                      Check SCC v2 →
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigateTab('SOVEREIGN_STUDIO')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-[#242c3f] text-zinc-700 dark:text-zinc-200 hover:border-amber-500 text-[11px] font-medium cursor-pointer"
                    >
                      Open Full PAM Builder →
                    </button>
                  </div>
                )}
              </div>
              {data.entitlements.length === 0 ? (
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-[#1e2433] text-xs text-zinc-500 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    No PAM Entitlements found in global location (API status: {data.apiStatus?.pamEntitlements}).
                  </span>
                  {onRunInShell && (
                    <button
                      type="button"
                      onClick={() =>
                        onRunInShell(
                          `gcloud pam entitlements list --project=${projectId} --location=global`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-[#1e2433] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#161e2e] text-[11px]"
                    >
                      <Terminal className="w-3 h-3" /> Check PAM in Shell
                    </button>
                  )}
                </div>
              ) : (
                data.entitlements.map((e) => (
                  <div key={e.name} className="rounded-lg border border-zinc-200 dark:border-[#1e2433] p-3 text-xs flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">{e.shortName}</div>
                      <div className="text-zinc-500 mt-0.5">
                        Max duration: {e.maxRequestDuration} · Roles: {e.roles.join(', ') || 'Configured'}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={requestingEnt === e.name}
                      onClick={() => requestPamGrant(e)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[11px] font-medium"
                    >
                      {requestingEnt === e.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                      Request 30m JIT Grant
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
