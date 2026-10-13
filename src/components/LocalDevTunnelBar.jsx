import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Network,
  Play,
  Square,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  DollarSign,
  Lock,
} from 'lucide-react';

const PRESET_PORTS_BY_TYPE = {
  CLOUD_RUN_PROXY: [
    { label: 'Local Proxy :8085 → Container :8080', localPort: 8085, remotePort: 8080 },
    { label: 'Local Proxy :8088 → Container :8080', localPort: 8088, remotePort: 8080 },
    { label: 'Local Proxy :3005 → Container :8080', localPort: 3005, remotePort: 8080 },
  ],
  COMPUTE_IAP_TCP: [
    { label: 'IAP SSH Tunnel (127.0.0.1:2222 → VM :22)', localPort: 2222, remotePort: 22 },
    { label: 'IAP Web / API (127.0.0.1:8086 → VM :8080)', localPort: 8086, remotePort: 8080 },
    { label: 'IAP Postgres (127.0.0.1:5433 → VM :5432)', localPort: 5433, remotePort: 5432 },
    { label: 'IAP Redis (127.0.0.1:6380 → VM :6379)', localPort: 6380, remotePort: 6379 },
    { label: 'IAP Jupyter / vLLM (127.0.0.1:8888 → VM :8888)', localPort: 8888, remotePort: 8888 },
  ],
  CLOUD_SQL_IAP: [
    { label: 'PostgreSQL / AlloyDB IAM Proxy (127.0.0.1:5432 → :5432)', localPort: 5432, remotePort: 5432 },
    { label: 'PostgreSQL Alt Port (127.0.0.1:5434 → :5432)', localPort: 5434, remotePort: 5432 },
    { label: 'MySQL 8.4 IAM Proxy (127.0.0.1:3306 → :3306)', localPort: 3306, remotePort: 3306 },
  ],
};

export default function LocalDevTunnelBar({
  projectId,
  defaultTargetType = 'CLOUD_RUN_PROXY', // 'CLOUD_RUN_PROXY' | 'COMPUTE_IAP_TCP' | 'CLOUD_SQL_IAP'
  defaultResourceName = '',
  defaultRegion = 'us-central1',
  defaultZone = 'us-central1-a',
  defaultRemotePort = 8080,
  defaultLocalPort = 8085,
  defaultDbEngine = 'POSTGRES',
  availableResources = [], // [{ name, region, zone, port, dbEngine, isPublic }]
  onShowToast,
  onClose,
}) {
  const [tunnelsData, setTunnelsData] = useState({ activeCount: 0, tunnels: [] });
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [probingId, setProbingId] = useState(null);
  const [probeResultMap, setProbeResultMap] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);

  const [targetType, setTargetType] = useState(defaultTargetType);
  const [resourceName, setResourceName] = useState(
    defaultResourceName || availableResources[0]?.name || ''
  );
  const [region, setRegion] = useState(
    defaultRegion || availableResources[0]?.region || 'us-central1'
  );
  const [zone, setZone] = useState(
    defaultZone || availableResources[0]?.zone || 'us-central1-a'
  );
  const [remotePort, setRemotePort] = useState(defaultRemotePort || 8080);
  const [preferredLocalPort, setPreferredLocalPort] = useState(defaultLocalPort || 8085);
  const [dbEngine, setDbEngine] = useState(defaultDbEngine || 'POSTGRES');

  useEffect(() => {
    if (defaultResourceName) setResourceName(defaultResourceName);
    if (defaultRegion) setRegion(defaultRegion);
    if (defaultZone) setZone(defaultZone);
    if (defaultRemotePort) setRemotePort(defaultRemotePort);
    if (defaultLocalPort) setPreferredLocalPort(defaultLocalPort);
  }, [
    defaultResourceName,
    defaultRegion,
    defaultZone,
    defaultRemotePort,
    defaultLocalPort,
  ]);

  const fetchTunnels = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/tunnels`
      );
      setTunnelsData(res.data || { activeCount: 0, tunnels: [] });
    } catch {
      // ignore silent poll errors
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTunnels();
  }, [fetchTunnels]);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    if (onShowToast) onShowToast('Copied local tunnel command / endpoint!');
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleStartTunnel = async (overrideSpec = null) => {
    const spec = overrideSpec || {
      targetType,
      resourceName: resourceName.trim(),
      region,
      zone,
      remotePort: Number(remotePort) || 8080,
      preferredLocalPort: Number(preferredLocalPort) || 8085,
      dbEngine,
    };

    if (!spec.resourceName) {
      if (onShowToast) onShowToast('Select or enter a target resource name first.');
      return;
    }

    setStarting(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/tunnels/start`,
        spec
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      await fetchTunnels();
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error || err.message || 'Failed to start local tunnel'
        );
      }
    } finally {
      setStarting(false);
    }
  };

  const handleStopTunnel = async (tunnelId) => {
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/tunnels/stop`,
        { tunnelId }
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      await fetchTunnels();
    } catch {
      // ignore
    }
  };

  const handleProbeTunnel = async (tunnelId) => {
    setProbingId(tunnelId);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/tunnels/probe`,
        { tunnelId, pathSuffix: '/' }
      );
      setProbeResultMap((prev) => ({ ...prev, [tunnelId]: res.data }));
    } catch (err) {
      setProbeResultMap((prev) => ({
        ...prev,
        [tunnelId]: {
          tcpReachable: false,
          detail: err.response?.data?.error || err.message,
        },
      }));
    } finally {
      setProbingId(null);
    }
  };

  const presets = PRESET_PORTS_BY_TYPE[targetType] || PRESET_PORTS_BY_TYPE.CLOUD_RUN_PROXY;
  const activeTunnels = tunnelsData.tunnels || [];

  return (
    <div className="p-4 rounded-xl bg-zinc-950 border border-emerald-500/35 text-zinc-100 space-y-3.5 shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-extrabold">
            <Network className="w-3.5 h-3.5" />
            <span>127.0.0.1 ZERO-PUBLIC-IP DEVELOPER BRIDGE</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-mono font-bold">
            <DollarSign className="w-3 h-3" />
            <span>Saves $7.30/mo per Private VM / DB (No Public IPv4 Needed)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-mono">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>IAP TCP 35.235.240.0/20 + Automatic OIDC Bearer Injection</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTunnels}
            disabled={loading}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10.5px] font-mono cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh ({activeTunnels.length})</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 px-1.5 cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Connect your local browser, IDE, Postman, or ORM (`Prisma`, `psql`, `mysql`, `curl`, `ssh`) directly to <strong>Private IAM-Locked Cloud Run services</strong>, <strong>Zero-External-IP Compute Engine VMs</strong>, or <strong>Private VPC Cloud SQL / AlloyDB</strong> over `127.0.0.1` without opening `0.0.0.0/0` firewall ports or paying `$7.30/mo` for static public IPv4 addresses.
      </p>

      {/* 1-Click Port-Forward Launcher Form */}
      <div className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-1">
              1. Tunnel Engine Mode
            </label>
            <select
              value={targetType}
              onChange={(e) => {
                const nextType = e.target.value;
                setTargetType(nextType);
                if (nextType === 'CLOUD_RUN_PROXY') {
                  setRemotePort(8080);
                  setPreferredLocalPort(8085);
                } else if (nextType === 'COMPUTE_IAP_TCP') {
                  setRemotePort(22);
                  setPreferredLocalPort(2222);
                } else {
                  setRemotePort(5432);
                  setPreferredLocalPort(5432);
                }
              }}
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-white"
            >
              <option value="CLOUD_RUN_PROXY">
                Cloud Run Auth Proxy (OIDC Bearer)
              </option>
              <option value="COMPUTE_IAP_TCP">
                Compute VM IAP TCP Tunnel (:22 / :8080 / :5432)
              </option>
              <option value="CLOUD_SQL_IAP">
                Cloud SQL / AlloyDB IAM Auth Proxy v2
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-1">
              2. Target Resource Name
            </label>
            {availableResources.length > 0 ? (
              <select
                value={resourceName}
                onChange={(e) => {
                  const chosen = availableResources.find(
                    (r) => r.name === e.target.value
                  );
                  setResourceName(e.target.value);
                  if (chosen?.region) setRegion(chosen.region);
                  if (chosen?.zone) setZone(chosen.zone);
                  if (chosen?.port) setRemotePort(chosen.port);
                  if (chosen?.dbEngine) setDbEngine(chosen.dbEngine);
                }}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-white"
              >
                {availableResources.map((r) => (
                  <option key={r.name} value={r.name}>
                    {r.name} ({r.zone || r.region || 'global'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                placeholder="e.g. api-gateway or prod-vm"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-white"
              />
            )}
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-400 mb-1">
              3. {targetType === 'COMPUTE_IAP_TCP' ? 'GCP Zone' : 'GCP Region'}
            </label>
            <input
              type="text"
              value={targetType === 'COMPUTE_IAP_TCP' ? zone : region}
              onChange={(e) =>
                targetType === 'COMPUTE_IAP_TCP'
                  ? setZone(e.target.value)
                  : setRegion(e.target.value)
              }
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                Local 127.0.0.1
              </label>
              <input
                type="number"
                value={preferredLocalPort}
                onChange={(e) => setPreferredLocalPort(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-emerald-500/40 rounded px-2 py-1.5 text-xs font-mono text-emerald-300 font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                Remote Port
              </label>
              <input
                type="number"
                value={remotePort}
                onChange={(e) => setRemotePort(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs font-mono text-white"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled={starting || !resourceName.trim()}
              onClick={() => handleStartTunnel()}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>
                {starting
                  ? 'Binding 127.0.0.1...'
                  : `Bind 127.0.0.1:${preferredLocalPort}`}
              </span>
            </button>
          </div>
        </div>

        {/* Preset Port Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-zinc-500">
            Quick Port Presets:
          </span>
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setPreferredLocalPort(p.localPort);
                setRemotePort(p.remotePort);
              }}
              className="px-2 py-0.5 rounded bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[10px] font-mono cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Tunnels List */}
      {activeTunnels.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10.5px] font-mono font-extrabold uppercase tracking-wider text-emerald-400">
            Active Local Developer Tunnels ({activeTunnels.length})
          </div>
          {activeTunnels.map((t) => {
            const probe = probeResultMap[t.tunnelId];
            return (
              <div
                key={t.tunnelId}
                className="p-3 rounded-lg bg-zinc-900 border border-emerald-500/30 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-mono font-extrabold">
                      ● 127.0.0.1:{t.localPort} ➔ {t.resourceName}:{t.remotePort}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      {t.engine}
                    </span>
                    {t.pid && (
                      <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[9.5px] font-mono">
                        PID {t.pid}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {t.localUrl?.startsWith('http://') && (
                      <a
                        href={t.localUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-mono font-bold inline-flex items-center gap-1"
                      >
                        <span>Open {t.localUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={probingId === t.tunnelId}
                      onClick={() => handleProbeTunnel(t.tunnelId)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>
                        {probingId === t.tunnelId
                          ? 'Testing...'
                          : 'Test 127.0.0.1 Socket'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(t.cliCommand, `cli-${t.tunnelId}`)
                      }
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10.5px] font-mono inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === `cli-${t.tunnelId}` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied CLI</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Tunnel CLI</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStopTunnel(t.tunnelId)}
                      className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-[10.5px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span>Stop</span>
                    </button>
                  </div>
                </div>

                {/* CLI + Client Snippets */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-[10px] text-emerald-300 overflow-x-auto">
                    <div className="text-zinc-500 mb-0.5">
                      Underlying Zero-Trust Tunnel Command:
                    </div>
                    <code>{t.cliCommand}</code>
                  </div>

                  <div className="p-2 rounded bg-zinc-950 border border-zinc-800 font-mono text-[10px] text-blue-300 space-y-1 overflow-x-auto">
                    <div className="text-zinc-500">
                      Copy-Ready Local Client / ORM Connection:
                    </div>
                    {Object.entries(t.clientSnippets || {}).map(([k, val]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between gap-2 bg-zinc-900/80 px-2 py-0.5 rounded"
                      >
                        <code className="truncate">{val}</code>
                        <button
                          type="button"
                          onClick={() => handleCopy(val, `snip-${t.tunnelId}-${k}`)}
                          className="text-[9.5px] text-zinc-400 hover:text-white shrink-0 cursor-pointer"
                        >
                          {copiedKey === `snip-${t.tunnelId}-${k}` ? '✓' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Probe Output */}
                {probe && (
                  <div
                    className={`p-2 rounded border text-[10.5px] font-mono flex flex-wrap items-center justify-between gap-2 ${
                      probe.tcpReachable
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}
                  >
                    <div>
                      <strong>
                        {probe.tcpReachable
                          ? `✓ 127.0.0.1:${t.localPort} Socket Reachable (${probe.rttMs}ms)`
                          : `ℹ️ Local Socket Info:`}
                      </strong>{' '}
                      {probe.detail}
                      {probe.httpProbe?.statusCode && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-white">
                          HTTP {probe.httpProbe.statusCode}
                        </span>
                      )}
                    </div>
                    {probe.httpProbe?.bodyPreview && (
                      <code className="text-[10px] text-zinc-300 truncate max-w-md">
                        {probe.httpProbe.bodyPreview}
                      </code>
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
