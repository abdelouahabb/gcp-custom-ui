import React, { useState } from 'react';
import {
  Network,
  Shield,
  PlusCircle,
  Trash2,
  RefreshCw,
  Globe,
  Lock,
  Layers,
} from 'lucide-react';

export default function VpcNetworksAndFirewalls({
  projectId,
  vpcs = [],
  firewalls = [],
  onOpenProvisionVpc,
  onOpenProvisionFirewall,
  onDeleteResource,
  onRefresh,
  loading = false,
}) {
  const [confirmDeleteKey, setConfirmDeleteKey] = useState(null);
  const [deletingMap, setDeletingMap] = useState({});

  const handleConfirmDelete = async (resourceType, name) => {
    const key = `${resourceType}:${name}`;
    setDeletingMap((prev) => ({ ...prev, [key]: true }));
    setConfirmDeleteKey(null);
    try {
      await onDeleteResource({
        type: resourceType,
        name,
        region: 'global',
      });
    } finally {
      setTimeout(() => {
        setDeletingMap((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 6000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-500">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 flex-wrap">
              <span>Live VPC Networks, Subnets & Firewall Rules</span>
              <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                {vpcs.length} VPC{vpcs.length === 1 ? '' : 's'} · {firewalls.length} Firewall Rule{firewalls.length === 1 ? '' : 's'}
              </span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Queried directly from <code className="font-mono">compute.googleapis.com/compute/v1/projects/{projectId}/global/networks</code> & <code className="font-mono">/global/firewalls</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={loading}
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-3 py-2 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh VPC</span>
          </button>

          <button
            type="button"
            onClick={onOpenProvisionFirewall}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-3.5 py-2 text-xs font-bold transition-colors shadow-sm"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>+ Firewall Rule</span>
          </button>

          <button
            type="button"
            onClick={onOpenProvisionVpc}
            className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-[8px] px-4 py-2 text-xs font-bold transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Create VPC Network</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Live VPC Networks & Regional Subnets */}
        <div className="xl:col-span-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1 flex items-center justify-between">
            <span>VPC Networks ({vpcs.length})</span>
            <span className="font-mono text-[11px]">global/networks</span>
          </div>

          {vpcs.length === 0 ? (
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center space-y-2">
              <Network className="w-6 h-6 text-zinc-400 mx-auto" />
              <div className="text-sm font-bold">
                No VPC Networks Found in <span className="font-mono text-blue-500">{projectId}</span>
              </div>
              <p className="text-xs text-zinc-500">
                Ensure Compute Engine API is enabled in this project or click <strong>+ Create VPC Network</strong> above.
              </p>
            </div>
          ) : (
            vpcs.map((vpc) => {
              const delKey = `VPC Network:${vpc.name}`;
              const isDeleting = Boolean(deletingMap[delKey]);

              return (
                <div
                  key={vpc.id}
                  className={`relative overflow-hidden bg-white dark:bg-[#0c0c0f] border rounded-xl p-4 shadow-sm transition-all ${
                    isDeleting
                      ? 'border-rose-500/40 opacity-60 grayscale select-none'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {isDeleting && (
                    <div className="mb-3 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-mono flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>DELETING VPC NETWORK {vpc.name.toUpperCase()}...</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Globe className="w-4 h-4 text-cyan-500" />
                        <span
                          className={`text-sm font-bold font-mono ${
                            isDeleting
                              ? 'line-through text-zinc-400'
                              : 'text-zinc-950 dark:text-zinc-50'
                          }`}
                        >
                          {vpc.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                          {vpc.autoCreateSubnetworks ? 'AUTO SUBNETS' : 'CUSTOM SUBNETS'}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          BGP: {vpc.routingMode}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                          MTU: {vpc.mtu}
                        </span>
                      </div>
                      {vpc.description && (
                        <p className="text-xs text-zinc-500 mt-1">{vpc.description}</p>
                      )}
                    </div>

                    {!isDeleting && (
                      <div>
                        {confirmDeleteKey === delKey ? (
                          <div className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 rounded-md px-2 py-1">
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete('VPC Network', vpc.name)}
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded text-[11px] font-bold"
                            >
                              Confirm Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(null)}
                              className="text-[11px] text-zinc-500 px-1.5"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(delKey)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-2.5 py-1 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Regional Subnets Pills */}
                  <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="text-[11px] text-zinc-500 mb-1.5 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        Attached Subnetworks ({vpc.subnetsCount || 0} regional subnets):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                      {(vpc.subnetworks || []).slice(0, 14).map((sub, i) => (
                        <span
                          key={`${sub.region}-${i}`}
                          className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded"
                        >
                          {sub.region}
                        </span>
                      ))}
                      {(vpc.subnetworks || []).length > 14 && (
                        <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.5">
                          +{(vpc.subnetworks || []).length - 14} more regions
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Live VPC Firewall Rules */}
        <div className="xl:col-span-6 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 px-1 flex items-center justify-between">
            <span>VPC Firewall Rules ({firewalls.length})</span>
            <span className="font-mono text-[11px]">global/firewalls</span>
          </div>

          {firewalls.length === 0 ? (
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 text-center space-y-2">
              <Shield className="w-6 h-6 text-zinc-400 mx-auto" />
              <div className="text-sm font-bold">
                No VPC Firewall Rules Found in <span className="font-mono text-blue-500">{projectId}</span>
              </div>
              <p className="text-xs text-zinc-500">
                Click <strong>+ Firewall Rule</strong> above to allow TCP/UDP/ICMP ingress on your VPC network.
              </p>
            </div>
          ) : (
            firewalls.map((fw) => {
              const delKey = `VPC Firewall Rule:${fw.name}`;
              const isDeleting = Boolean(deletingMap[delKey]);
              const protocols = (fw.allowed || fw.denied || [])
                .map(
                  (r) =>
                    `${r.IPProtocol}${
                      r.ports?.length ? ':' + r.ports.join(',') : ''
                    }`
                )
                .join(' ');

              return (
                <div
                  key={fw.id}
                  className={`bg-white dark:bg-[#0c0c0f] border rounded-xl p-4 shadow-sm transition-all ${
                    isDeleting
                      ? 'border-rose-500/40 opacity-60 grayscale select-none'
                      : 'border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Lock className="w-3.5 h-3.5 text-emerald-500" />
                        <span
                          className={`text-xs font-bold font-mono ${
                            isDeleting
                              ? 'line-through text-zinc-400'
                              : 'text-zinc-950 dark:text-zinc-50'
                          }`}
                        >
                          {fw.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          vpc:{fw.network}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                          {fw.direction} · Priority {fw.priority}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-500 flex flex-wrap items-center gap-2">
                        <span>
                          Allow: <strong className="text-zinc-800 dark:text-zinc-200">{protocols || 'all'}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Sources: <strong className="text-zinc-800 dark:text-zinc-200">{(fw.sourceRanges || []).join(', ') || '0.0.0.0/0'}</strong>
                        </span>
                      </div>
                    </div>

                    {!isDeleting && (
                      <div>
                        {confirmDeleteKey === delKey ? (
                          <div className="inline-flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 rounded-md px-2 py-0.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleConfirmDelete('VPC Firewall Rule', fw.name)
                              }
                              className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded text-[11px] font-bold"
                            >
                              Yes, Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteKey(null)}
                              className="text-[11px] text-zinc-500 px-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteKey(delKey)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-2 py-1 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
