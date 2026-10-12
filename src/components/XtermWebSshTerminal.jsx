import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal,
  Wifi,
  RefreshCw,
  Maximize2,
  Minimize2,
  KeyRound,
  Copy,
  Check,
  Shield,
  Sliders,
  Trash2,
  FileText,
} from 'lucide-react';

const LIVE_PTY_MACROS = [
  { label: 'sudo apt update', cmd: 'sudo apt update\r' },
  { label: 'Top / Processes', cmd: 'top -b -n 1 | head -n 25\r' },
  { label: 'Disk & RAM', cmd: 'df -h && echo "---" && free -h\r' },
  { label: 'Open Ports', cmd: 'sudo ss -tulpn\r' },
  { label: 'Docker Containers', cmd: 'sudo docker ps -a\r' },
  { label: 'Systemd Errors', cmd: 'sudo journalctl -p 3 -xb --no-pager | tail -n 40\r' },
  { label: 'OS & Kernel', cmd: 'uname -a && cat /etc/os-release | head -n 6\r' },
  { label: 'Ctrl+C (Interrupt)', cmd: '\x03' },
];

export default function XtermWebSshTerminal({
  projectId,
  activeVm,
  defaultUsername = 'ubuntu',
  isExpanded = false,
  onToggleExpand,
  onFetchSerialConsole,
  serialConsoleOutput = '',
  serialLoading = false,
}) {
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);

  const [viewMode, setViewMode] = useState('LIVE_SSH_PTY'); // 'LIVE_SSH_PTY' | 'SERIAL_PORT_1'
  const [sshEngine, setSshEngine] = useState('auto'); // 'auto' | 'ssh2' | 'gcloud_pty' | 'iap' | 'cloud_shell'
  const [connStatus, setConnStatus] = useState({
    status: 'IDLE',
    engine: 'AUTO',
    message: 'Ready to connect',
  });
  const [copiedCli, setCopiedCli] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customUsername, setCustomUsername] = useState(defaultUsername);
  const [customPort, setCustomPort] = useState('22');
  const [customPassword, setCustomPassword] = useState('');
  const [customPrivateKey, setCustomPrivateKey] = useState('');
  const [reconnectNonce, setReconnectNonce] = useState(0);

  useEffect(() => {
    if (defaultUsername && !customUsername) {
      setCustomUsername(defaultUsername);
    }
  }, [defaultUsername, customUsername]);

  const sendToPty = useCallback((dataStr) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: dataStr }));
    }
    xtermRef.current?.focus();
  }, []);

  // Initialize XTerm.js instance & WebSocket connection whenever VM or engine changes
  useEffect(() => {
    if (viewMode !== 'LIVE_SSH_PTY') return undefined;
    if (!containerRef.current) return undefined;

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily:
        '"JetBrains Mono", "Fira Code", "Cascadia Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: 12.5,
      lineHeight: 1.28,
      scrollback: 10000,
      allowProposedApi: true,
      convertEol: true,
      theme: {
        background: '#070709',
        foreground: '#e4e4e7',
        cursor: '#10b981',
        cursorAccent: '#070709',
        selectionBackground: 'rgba(16, 185, 129, 0.28)',
        black: '#18181b',
        red: '#f43f5e',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f4f4f5',
        brightBlack: '#52525b',
        brightRed: '#fb7185',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(containerRef.current);

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch {
        // ignore
      }
    }, 50);

    const targetVmName =
      sshEngine === 'cloud_shell' || !activeVm
        ? '__CLOUD_SHELL__'
        : activeVm.name;
    const targetZone = activeVm?.zone || 'us-east1-b';
    const targetHost =
      activeVm?.externalIp && activeVm.externalIp !== 'None'
        ? activeVm.externalIp
        : activeVm?.internalIp || '';

    term.writeln(
      `\x1b[1;32m╔══════════════════════════════════════════════════════════════════════════╗\x1b[0m`
    );
    term.writeln(
      `\x1b[1;32m║  CloudPulse 2026 · Open-Source Xterm.js + SSH2 / PTY Interactive Client  ║\x1b[0m`
    );
    term.writeln(
      `\x1b[1;32m╚══════════════════════════════════════════════════════════════════════════╝\x1b[0m`
    );

    if (targetVmName !== '__CLOUD_SHELL__' && activeVm && activeVm.status !== 'RUNNING') {
      term.writeln(
        `\x1b[38;5;214m⚠️  VM "${activeVm.name}" is currently ${activeVm.status}. Start the VM to SSH into it, or switch engine to "Local GCloud / Bash PTY".\x1b[0m`
      );
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const query = new URLSearchParams({
      projectId: projectId || '',
      vmName: targetVmName,
      zone: targetZone,
      host: targetHost,
      username: customUsername || defaultUsername || 'ubuntu',
      engine:
        sshEngine === 'iap'
          ? 'gcloud_pty'
          : sshEngine === 'cloud_shell'
          ? 'gcloud_pty'
          : sshEngine,
      iap: sshEngine === 'iap' ? 'true' : 'false',
      cols: String(term.cols || 100),
      rows: String(term.rows || 28),
    });

    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/ssh?${query.toString()}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      try {
        fitAddon.fit();
        ws.send(
          JSON.stringify({
            type: 'resize',
            cols: term.cols || 100,
            rows: term.rows || 28,
          })
        );
      } catch {
        // ignore
      }
      if (customPassword || customPrivateKey) {
        ws.send(
          JSON.stringify({
            type: 'custom_auth',
            username: customUsername || defaultUsername,
            port: Number(customPort || 22),
            password: customPassword,
            privateKey: customPrivateKey,
          })
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'output' && typeof msg.data === 'string') {
          term.write(msg.data);
        } else if (msg.type === 'status') {
          setConnStatus({
            status: msg.status || 'CONNECTED',
            engine: msg.engine || 'SSH2_PTY',
            message: msg.message || '',
          });
        }
      } catch {
        term.write(String(event.data));
      }
    };

    ws.onclose = () => {
      setConnStatus((prev) => ({
        ...prev,
        status: 'DISCONNECTED',
        message: 'WebSocket SSH stream closed',
      }));
    };

    ws.onerror = () => {
      setConnStatus((prev) => ({
        ...prev,
        status: 'ERROR',
        message: 'WebSocket SSH stream error',
      }));
    };

    const onDataDisposable = term.onData((inputData) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data: inputData }));
      }
    });

    const onResizeDisposable = term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {
        // ignore
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      onDataDisposable.dispose();
      onResizeDisposable.dispose();
      try {
        ws.close();
      } catch {
        // ignore
      }
      try {
        term.dispose();
      } catch {
        // ignore
      }
    };
  }, [
    projectId,
    activeVm?.name,
    activeVm?.zone,
    activeVm?.externalIp,
    activeVm?.internalIp,
    activeVm?.status,
    sshEngine,
    viewMode,
    reconnectNonce,
  ]);

  return (
    <div className="bg-[#09090b] border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Top Terminal Window Bar */}
      <div className="bg-zinc-900/95 border-b border-zinc-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 mr-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-mono text-xs font-bold text-zinc-100 truncate">
            {sshEngine === 'cloud_shell'
              ? `${customUsername}@cloud-shell (${projectId})`
              : activeVm
              ? `${customUsername}@${activeVm.name} (${activeVm.zone} · ${
                  activeVm.externalIp !== 'None'
                    ? activeVm.externalIp
                    : activeVm.internalIp
                })`
              : 'Select a VM'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
              connStatus.status === 'CONNECTED'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : connStatus.status === 'CONNECTING'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            <Wifi className="w-3 h-3" />
            <span>
              {connStatus.status === 'CONNECTED'
                ? `LIVE · ${connStatus.engine}`
                : connStatus.status}
            </span>
          </span>

          <button
            type="button"
            onClick={() => setShowAuthModal((v) => !v)}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-colors cursor-pointer ${
              showAuthModal
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
            }`}
            title="Configure SSH Username, Port, Password, or Private Key PEM"
          >
            <KeyRound className="w-3 h-3" />
            <span>SSH Auth / Key</span>
          </button>

          <button
            type="button"
            onClick={() => setReconnectNonce((n) => n + 1)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
            title="Reconnect interactive Web-SSH PTY session"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reconnect</span>
          </button>

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
              title={
                isExpanded
                  ? 'Restore split-pane layout'
                  : 'Expand Web-SSH terminal to full-width cinema mode'
              }
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span>Split View</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3 h-3" />
                  <span>Full Width</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher + SSH Engine Selector Bar */}
      <div className="bg-zinc-950 border-b border-zinc-800/90 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('LIVE_SSH_PTY')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'LIVE_SSH_PTY'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Terminal className="w-3 h-3" />
            <span>Interactive Xterm.js SSH PTY</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('SERIAL_PORT_1');
              if (onFetchSerialConsole) onFetchSerialConsole();
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'SERIAL_PORT_1'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <FileText className="w-3 h-3" />
            <span>Serial Port 1 Console (REST)</span>
          </button>
        </div>

        {viewMode === 'LIVE_SSH_PTY' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-zinc-500">
              SSH Engine:
            </span>
            <select
              value={sshEngine}
              onChange={(e) => setSshEngine(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="auto">
                ⚡ Auto (Native SSH2 + gcloud PTY Fallback)
              </option>
              <option value="ssh2">
                🔑 Direct SSH2 Protocol (Node.js ssh2 :22)
              </option>
              <option value="gcloud_pty">
                🛡️ gcloud compute ssh Full Linux PTY
              </option>
              <option value="iap">
                🔒 Cloud IAP TCP Tunnel (--tunnel-through-iap)
              </option>
              <option value="cloud_shell">
                💻 Local GCloud / Bash PTY Shell
              </option>
            </select>
          </div>
        )}
      </div>

      {/* Optional Custom SSH Credentials Drawer */}
      {showAuthModal && (
        <div className="bg-zinc-900/95 border-b border-zinc-800 p-3.5 space-y-2.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>
                SSH2 Authentication & Credentials (Defaults to ~/.ssh/google_compute_engine)
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="text-zinc-400 hover:text-white text-[11px]"
            >
              ✕ Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">
                SSH Username
              </label>
              <input
                type="text"
                value={customUsername}
                onChange={(e) => setCustomUsername(e.target.value)}
                placeholder="ubuntu"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">
                SSH Port
              </label>
              <input
                type="number"
                value={customPort}
                onChange={(e) => setCustomPort(e.target.value)}
                placeholder="22"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">
                Optional Password (if password auth enabled)
              </label>
              <input
                type="password"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                placeholder="Leave blank for SSH key auth"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-zinc-400 mb-1">
              Optional Custom Private Key PEM (Leave blank to use ~/.ssh/google_compute_engine)
            </label>
            <textarea
              rows={2}
              value={customPrivateKey}
              onChange={(e) => setCustomPrivateKey(e.target.value)}
              placeholder="-----BEGIN OPENSSH PRIVATE KEY----- ..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-[11px] text-zinc-100 font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAuthModal(false);
                setReconnectNonce((n) => n + 1);
              }}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
            >
              Apply Credentials & Reconnect SSH2
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'LIVE_SSH_PTY' ? (
        <div className="p-3 space-y-2.5 flex-1 flex flex-col">
          {/* CLI Copy & Quick PTY Macro Injection Bar */}
          {activeVm && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2">
              <code className="text-[11px] font-mono text-zinc-300 truncate">
                $ {activeVm.sshCommand}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(activeVm.sshCommand);
                  setCopiedCli(true);
                  setTimeout(() => setCopiedCli(false), 1500);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-400 hover:text-blue-300 shrink-0 cursor-pointer"
              >
                {copiedCli ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy CLI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* 1-Tap PTY Stream Macros */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mr-1">
              Inject into PTY:
            </span>
            {LIVE_PTY_MACROS.map((m) => (
              <button
                key={m.label}
                type="button"
                onClick={() => sendToPty(m.cmd)}
                className="text-[10px] font-mono bg-zinc-900 hover:bg-emerald-500/15 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
              >
                {m.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                xtermRef.current?.clear();
                xtermRef.current?.focus();
              }}
              className="text-[10px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-2 py-0.5 rounded transition-colors cursor-pointer ml-auto"
            >
              Clear Screen
            </button>
          </div>

          {/* Real @xterm/xterm Interactive Terminal Canvas */}
          <div
            ref={containerRef}
            onClick={() => xtermRef.current?.focus()}
            className={`w-full flex-1 rounded-lg border border-zinc-800 bg-[#070709] p-1.5 overflow-hidden ${
              isExpanded ? 'min-h-[540px]' : 'min-h-[410px]'
            }`}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
            <span>
              🟢 Real Full-Duplex PTY (@xterm/xterm + WebSocket SSH2 / Linux pty.openpty) — supports interactive apt update, vim, htop, nano, tab-completion & Ctrl+C
            </span>
            <span>{connStatus.message}</span>
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-mono text-zinc-300 font-bold">
              Compute Engine Serial Port 1 Output ({activeVm?.name || 'VM'})
            </div>
            <button
              type="button"
              disabled={serialLoading}
              onClick={onFetchSerialConsole}
              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold cursor-pointer disabled:opacity-50"
            >
              {serialLoading ? 'Fetching...' : 'Refresh Serial Port 1'}
            </button>
          </div>
          <pre className="flex-1 bg-black/80 border border-zinc-800 rounded-lg p-3.5 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap break-words overflow-y-auto min-h-[380px] max-h-[520px]">
            {serialConsoleOutput ||
              'Click "Refresh Serial Port 1" to read live kernel & systemd boot logs directly from the Compute Engine REST API without requiring port 22.'}
          </pre>
        </div>
      )}
    </div>
  );
}
