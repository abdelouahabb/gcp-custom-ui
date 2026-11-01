import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal,
  Wifi,
  WifiOff,
  RefreshCw,
  Maximize2,
  Minimize2,
  KeyRound,
  Copy,
  Check,
  Shield,
  FileText,
  PowerOff,
  User,
  Lock,
  Unlock,
  Play,
  Square,
  RotateCcw,
  Server,
  Rocket,
  ArrowUpRight,
  Folder,
  FolderOpen,
  FileCode,
  Upload,
  Download,
  Trash2,
  Plus,
  Save,
  CornerLeftUp,
  Edit3,
  HardDrive,
} from 'lucide-react';

const VM_PTY_MACROS = [
  { label: 'sudo apt update', cmd: 'sudo apt update\r' },
  { label: 'Top / Processes', cmd: 'top -b -n 1 | head -n 25\r' },
  { label: 'Disk & RAM', cmd: 'df -h && echo "---" && free -h\r' },
  { label: 'Open Ports', cmd: 'sudo ss -tulpn\r' },
  { label: 'Docker Containers', cmd: 'sudo docker ps -a\r' },
  { label: 'Systemd Errors', cmd: 'sudo journalctl -p 3 -xb --no-pager | tail -n 40\r' },
  { label: 'OS & Kernel', cmd: 'uname -a && cat /etc/os-release | head -n 6\r' },
  { label: 'Ctrl+C (Interrupt)', cmd: '\x03' },
];

const CLOUD_RUN_PTY_MACROS = [
  { label: 'Container Processes (ps aux)', cmd: 'ps aux\r' },
  { label: 'Environment Vars', cmd: 'env | sort\r' },
  { label: 'Filesystem & Mounts', cmd: 'df -h && ls -la\r' },
  { label: 'Memory & Cgroups', cmd: 'free -h || cat /sys/fs/cgroup/memory.current\r' },
  { label: 'Probe Container :8080', cmd: 'curl -is http://127.0.0.1:8080 | head -n 20\r' },
  { label: 'apt update', cmd: 'apt-get update\r' },
  { label: 'OS Release', cmd: 'uname -a && cat /etc/os-release\r' },
  { label: 'Ctrl+C (Interrupt)', cmd: '\x03' },
];

export default function XtermWebSshTerminal({
  projectId,
  targetType = 'VM', // 'VM' | 'CLOUD_RUN'
  activeVm = null,
  vms = [],
  onSelectVm,
  onVmPowerAction,
  powerBusyVm = null,
  pendingOps = {},
  cloudRunService = null,
  defaultUsername = 'ubuntu',
  isExpanded = false,
  onToggleExpand,
  onDisconnect,
  onFetchSerialConsole,
  serialConsoleOutput = '',
  serialLoading = false,
  onOpenMigrateVm,
  onSelectTab,
  openScpTrigger = 0,
  openSshTrigger = 0,
  scpTargetVmName = '',
  activeViewMode,
  onViewModeChange,
  onShowToast,
  onShowError,
}) {
  const isCloudRun = targetType === 'CLOUD_RUN';
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);

  const [viewMode, setViewModeState] = useState(
    activeViewMode || 'LIVE_SSH_PTY'
  ); // 'LIVE_SSH_PTY' | 'SCP_FILE_MANAGER' | 'SERIAL_PORT_1'

  const setViewMode = useCallback(
    (nextMode) => {
      setViewModeState((prev) => {
        const resolved =
          typeof nextMode === 'function' ? nextMode(prev) : nextMode;
        if (onViewModeChange) {
          onViewModeChange(resolved);
        }
        return resolved;
      });
    },
    [onViewModeChange]
  );

  useEffect(() => {
    if (openScpTrigger > 0) {
      if (scpTargetVmName) {
        setSelectedVmName(scpTargetVmName);
      }
      setViewMode('SCP_FILE_MANAGER');
    }
  }, [openScpTrigger, scpTargetVmName, setViewMode]);

  useEffect(() => {
    if (openSshTrigger > 0) {
      setViewMode('LIVE_SSH_PTY');
    }
  }, [openSshTrigger, setViewMode]);
  const [sshEngine, setSshEngine] = useState(
    isCloudRun ? 'cloudrun_ssh' : 'auto'
  );
  const [selectedRevision, setSelectedRevision] = useState('LATEST');
  const [selectedContainer, setSelectedContainer] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState('');
  const [selectedVmName, setSelectedVmName] = useState('');
  const [autoConnectOnRunning, setAutoConnectOnRunning] = useState(false);

  // Sync selectedVmName when activeVm or vms list changes
  useEffect(() => {
    if (activeVm?.name) {
      setSelectedVmName(activeVm.name);
    } else if (!selectedVmName && vms.length > 0) {
      setSelectedVmName(vms[0].name);
    }
  }, [activeVm?.name, vms, selectedVmName]);

  const focusedVm =
    activeVm ||
    vms.find((v) => v.name === selectedVmName) ||
    vms[0] ||
    null;

  const focusedVmPendingOp = focusedVm ? pendingOps[focusedVm.name] : null;
  const focusedVmEffectiveStatus = focusedVmPendingOp
    ? focusedVmPendingOp.type
    : focusedVm?.status || 'UNKNOWN';
  const isFocusedVmRunning =
    focusedVm?.status === 'RUNNING' &&
    !['STOPPING', 'DELETING', 'SUSPENDING'].includes(focusedVmEffectiveStatus);
  const isFocusedVmTransitional =
    Boolean(focusedVmPendingOp) ||
    ['PROVISIONING', 'STAGING', 'STOPPING', 'SUSPENDING', 'REBOOTING'].includes(
      focusedVmEffectiveStatus
    ) ||
    (focusedVm && powerBusyVm === focusedVm.name);

  // Auto-connect SSH once a VM started from Xterm reaches RUNNING
  useEffect(() => {
    if (
      autoConnectOnRunning &&
      focusedVm &&
      focusedVm.status === 'RUNNING' &&
      !focusedVmPendingOp &&
      onSelectVm
    ) {
      setAutoConnectOnRunning(false);
      onSelectVm(focusedVm);
    }
  }, [autoConnectOnRunning, focusedVm, focusedVmPendingOp, onSelectVm]);

  const [connStatus, setConnStatus] = useState({
    status: 'OFF',
    engine: 'STANDBY',
    message: isCloudRun
      ? 'Cloud Run SSH is off until enabled on a service card'
      : 'SSH is off until enabled on a VM card',
  });
  const sanitizeUsername = (u) => {
    const s = String(u || '').trim();
    if (
      !s ||
      /^(connected[\s_]*oauth[\s_]*user|user|default)$/i.test(s) ||
      /\s/.test(s)
    ) {
      return '';
    }
    return s;
  };

  const [copiedCli, setCopiedCli] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customUsername, setCustomUsername] = useState(
    () => sanitizeUsername(defaultUsername) || 'ubuntu'
  );
  const [userManuallyPicked, setUserManuallyPicked] = useState(false);
  const [customPort, setCustomPort] = useState('22');
  const [customPassword, setCustomPassword] = useState('');
  const [customPrivateKey, setCustomPrivateKey] = useState('');
  const [reconnectNonce, setReconnectNonce] = useState(0);

  // GCP SSH Identity Mode (Standard Metadata SSH User vs IAM OS Login POSIX User)
  const [identityInfo, setIdentityInfo] = useState(null);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityToast, setRawIdentityToast] = useState('');

  // Visual SCP / SFTP Remote File Browser, Drag-and-Drop Uploader, Downloader & In-Place Editor State
  const scpFileInputRef = useRef(null);
  const scpTransferTimerRef = useRef(null);
  const [scpPath, setScpPath] = useState('~');
  const [scpPathInput, setScpPathInput] = useState('~');
  const [scpParentPath, setScpParentPath] = useState('/home');
  const [scpEntries, setScpEntries] = useState([]);
  const [scpEngineUsed, setScpEngineUsed] = useState('');
  const [scpCliUpload, setScpCliUpload] = useState('');
  const [scpCliDownload, setScpCliDownload] = useState('');
  const [scpLoading, setScpLoading] = useState(false);
  const [scpActionBusy, setScpActionBusy] = useState('');
  const [scpError, setRawScpError] = useState('');
  const [scpStatusMsg, setRawScpStatusMsg] = useState('');

  const setIdentityToast = useCallback(
    (msg) => {
      const clean = String(msg || '').trim();
      setRawIdentityToast(clean);
      if (clean && onShowToast) {
        onShowToast(clean);
      }
    },
    [onShowToast]
  );

  const setScpStatusMsg = useCallback(
    (msg) => {
      const clean = String(msg || '').trim();
      setRawScpStatusMsg(clean);
      if (clean && onShowToast) {
        onShowToast(clean);
      }
    },
    [onShowToast]
  );

  const setScpError = useCallback(
    (msg) => {
      const clean = String(msg || '').trim();
      setRawScpError(clean);
      if (clean && onShowError) {
        onShowError(clean);
      }
    },
    [onShowError]
  );
  const [scpFilter, setScpFilter] = useState('');
  const [scpDragOver, setScpDragOver] = useState(false);
  const [scpEditorFile, setScpEditorFile] = useState(null); // { path, fileName, content, isBinary, sizeBytes, isNew }
  const [scpNewFolderPrompt, setScpNewFolderPrompt] = useState(false);
  const [scpNewFolderName, setScpNewFolderName] = useState('');
  const [scpConfirmDeletePath, setScpConfirmDeletePath] = useState(null);
  const [copiedScpCli, setCopiedScpCli] = useState('');
  const [scpTransferProgress, setScpTransferProgress] = useState(null);
  const [scpDiskUsage, setScpDiskUsage] = useState(null);
  const [scpSelectedPaths, setScpSelectedPaths] = useState([]);
  const [scpTransferHistory, setScpTransferHistory] = useState([]);
  const [showScpHistory, setShowScpHistory] = useState(false);
  const [scpChmodTarget, setScpChmodTarget] = useState(null); // { path, name, modeOctal }
  const [scpRenameTarget, setScpRenameTarget] = useState(null); // { path, name, newName }
  const [scpChecksumResult, setScpChecksumResult] = useState(null); // { path, name, sha256, md5, sizeBytes, lineCount }
  const [copiedShaPath, setCopiedShaPath] = useState('');

  const appendTransferHistory = useCallback((item) => {
    setScpTransferHistory((prev) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          timestamp: new Date().toLocaleTimeString(),
          ...item,
        },
        ...prev,
      ].slice(0, 25)
    );
  }, []);

  const clearScpTransferTimer = useCallback(() => {
    if (scpTransferTimerRef.current) {
      clearInterval(scpTransferTimerRef.current);
      clearTimeout(scpTransferTimerRef.current);
      scpTransferTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearScpTransferTimer();
  }, [clearScpTransferTimer]);

  const isSessionEnabled = isCloudRun
    ? Boolean(cloudRunService)
    : Boolean(activeVm) || sshEngine === 'cloud_shell';

  useEffect(() => {
    const cleanDefault = sanitizeUsername(defaultUsername);
    if (cleanDefault && !customUsername) {
      setCustomUsername(cleanDefault);
    }
  }, [defaultUsername, customUsername]);

  const fetchSshIdentityMode = useCallback(async () => {
    if (isCloudRun || !projectId) return;
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/vms/ssh-identity-mode`
      );
      const data = res.data || null;
      setIdentityInfo(data);
      if (data && !userManuallyPicked) {
        const preferred = data.osLoginEnabled
          ? data.osLoginPosixUser
          : data.localOsUser || sanitizeUsername(defaultUsername) || 'ubuntu';
        if (preferred) {
          setCustomUsername(preferred);
        }
      }
    } catch {
      // ignore
    }
  }, [isCloudRun, projectId, userManuallyPicked, defaultUsername]);

  useEffect(() => {
    fetchSshIdentityMode();
  }, [fetchSshIdentityMode]);

  const handleSelectSshUserProfile = async (candidate) => {
    if (!candidate?.username) return;
    setUserManuallyPicked(true);
    setCustomUsername(candidate.username);
    const needsOsLogin = candidate.requiresMode === 'OS_LOGIN';

    if (
      identityInfo &&
      projectId &&
      Boolean(identityInfo.osLoginEnabled) !== needsOsLogin
    ) {
      setIdentityBusy(true);
      setIdentityToast(
        needsOsLogin
          ? `Switching project to IAM OS Login (enable-oslogin=TRUE) for ${candidate.username}...`
          : `Unlocking Standard Metadata SSH (enable-oslogin=FALSE) so you connect as "${candidate.username}" (/home/${candidate.username})...`
      );
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/vms/ssh-identity-mode`,
          {
            enableOsLogin: needsOsLogin,
            enableSerialPort: true,
          }
        );
        setIdentityInfo((prev) =>
          prev
            ? {
                ...prev,
                osLoginEnabled: Boolean(res.data?.osLoginEnabled),
                identityMode: res.data?.identityMode || prev.identityMode,
              }
            : prev
        );
        setIdentityToast(res.data?.message || '');
        setTimeout(() => setIdentityToast(''), 5000);
      } catch {
        setIdentityToast('');
      } finally {
        setIdentityBusy(false);
      }
    }

    if (isSessionEnabled) {
      setReconnectNonce((n) => n + 1);
    }
  };

  const handleToggleOsLoginMode = async () => {
    if (!projectId || identityBusy) return;
    const nextOsLogin = !identityInfo?.osLoginEnabled;
    setIdentityBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/ssh-identity-mode`,
        {
          enableOsLogin: nextOsLogin,
          enableSerialPort: true,
        }
      );
      const nextUser = nextOsLogin
        ? identityInfo?.osLoginPosixUser || customUsername
        : identityInfo?.localOsUser || defaultUsername;
      setIdentityInfo((prev) =>
        prev
          ? {
              ...prev,
              osLoginEnabled: nextOsLogin,
              identityMode: nextOsLogin ? 'OS_LOGIN' : 'METADATA_SSH',
            }
          : prev
      );
      if (nextUser) {
        setCustomUsername(nextUser);
      }
      setIdentityToast(res.data?.message || '');
      setTimeout(() => setIdentityToast(''), 5000);
      if (isSessionEnabled) {
        setReconnectNonce((n) => n + 1);
      }
    } catch {
      // ignore
    } finally {
      setIdentityBusy(false);
    }
  };

  const sendToPty = useCallback((dataStr) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input', data: dataStr }));
    }
    xtermRef.current?.focus();
  }, []);

  const formatBytes = (bytes) => {
    const n = Number(bytes || 0);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const fetchScpDirectory = useCallback(
    async (targetPath = scpPath, options = {}) => {
      const targetVm = activeVm || focusedVm;
      if (isCloudRun || !projectId || !targetVm?.name) return;
      const isSilent = Boolean(options?.silent);
      if (!isSilent) {
        setScpLoading(true);
        setScpConfirmDeletePath(null);
        setScpChmodTarget(null);
        setScpRenameTarget(null);
      }
      setScpError('');
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/vms/${encodeURIComponent(targetVm.name)}/scp/list`,
          {
            params: {
              zone: targetVm.zone || '',
              username: customUsername || defaultUsername || 'ubuntu',
              path: targetPath || '~',
            },
          }
        );
        const data = res.data || {};
        const resolved = data.currentPath || targetPath || '~';
        setScpPath(resolved);
        setScpPathInput(resolved);
        setScpParentPath(data.parentPath || '/');
        setScpEntries(Array.isArray(data.entries) ? data.entries : []);
        setScpDiskUsage(data.diskUsage || null);
        setScpSelectedPaths([]);
        setScpEngineUsed(data.engineUsed || 'SSH2_SFTP_DIRECT');
        setScpCliUpload(data.cliUploadExample || '');
        setScpCliDownload(data.cliDownloadExample || '');
      } catch (err) {
        setScpError(
          err.response?.data?.error ||
            err.message ||
            'Failed to list remote directory via SCP/SFTP.'
        );
      } finally {
        if (!isSilent) {
          setScpLoading(false);
        }
      }
    },
    [
      activeVm,
      focusedVm,
      isCloudRun,
      projectId,
      customUsername,
      defaultUsername,
      scpPath,
    ]
  );

  useEffect(() => {
    if (
      (viewMode === 'SCP_FILE_MANAGER' || viewMode === 'SPLIT_SSH_AND_SCP') &&
      (activeVm || focusedVm)
    ) {
      fetchScpDirectory(scpPath || '~');
    }
  }, [
    viewMode,
    activeVm?.name,
    focusedVm?.name,
    customUsername,
    fetchScpDirectory,
  ]);

  const handleOpenScpFilePreview = async (entry) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !entry?.path) return;
    const expectedBytes = Number(entry.sizeBytes || 0);
    const startedAt = Date.now();
    setScpActionBusy(`preview:${entry.path}`);
    setScpError('');
    clearScpTransferTimer();

    setScpTransferProgress({
      active: true,
      completed: false,
      direction: 'PREVIEW',
      fileName: entry.name || entry.path,
      fileCount: 1,
      loadedBytes: 0,
      totalBytes: expectedBytes,
      percent: 12,
      speedBps: 0,
      stage: `Reading "${entry.name}" from ${targetVm.name} into in-place editor...`,
      engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
    });

    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/download`,
        {
          params: {
            zone: targetVm.zone || '',
            username: customUsername || defaultUsername || 'ubuntu',
            path: entry.path,
            mode: 'preview',
          },
          onDownloadProgress: (progressEvent) => {
            const total = Number(
              progressEvent.total || expectedBytes || progressEvent.loaded || 0
            );
            const loaded = Number(progressEvent.loaded || 0);
            const ratio = total > 0 ? Math.min(1, loaded / total) : 1;
            const elapsedSec = Math.max(0.1, (Date.now() - startedAt) / 1000);
            setScpTransferProgress((prev) => ({
              ...(prev || {}),
              active: true,
              completed: false,
              direction: 'PREVIEW',
              fileName: entry.name || entry.path,
              fileCount: 1,
              loadedBytes: loaded,
              totalBytes: total,
              percent: Math.min(98, Math.max(25, Math.round(25 + ratio * 73))),
              speedBps: Math.round(loaded / elapsedSec),
              stage: `Streaming "${entry.name}" into editor...`,
              engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
            }));
          },
        }
      );
      const finalBytes = Number(res.data?.sizeBytes ?? expectedBytes);
      setScpTransferProgress({
        active: true,
        completed: true,
        direction: 'PREVIEW',
        fileName: res.data?.fileName || entry.name,
        fileCount: 1,
        loadedBytes: finalBytes,
        totalBytes: finalBytes,
        percent: 100,
        speedBps: Math.round(
          finalBytes / Math.max(0.12, (Date.now() - startedAt) / 1000)
        ),
        stage: `✓ Loaded "${res.data?.fileName || entry.name}" (${formatBytes(
          finalBytes
        )}) into editor`,
        engine: res.data?.engineUsed || scpEngineUsed || 'SSH2_SFTP_DIRECT',
      });
      scpTransferTimerRef.current = setTimeout(() => {
        setScpTransferProgress(null);
      }, 1800);

      setScpEditorFile({
        path: res.data?.path || entry.path,
        fileName: res.data?.fileName || entry.name,
        content: res.data?.content || '',
        isBinary: Boolean(res.data?.isBinary),
        sizeBytes: res.data?.sizeBytes ?? entry.sizeBytes,
        isNew: false,
      });
    } catch (err) {
      clearScpTransferTimer();
      setScpTransferProgress(null);
      setScpError(
        err.response?.data?.error ||
          err.message ||
          `Failed to read ${entry.name} via SCP/SFTP.`
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleDownloadScpFileRaw = async (entry) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !entry?.path) return;
    const expectedBytes = Number(entry.sizeBytes || 0);
    const fileName =
      entry.name || entry.path.split('/').pop() || 'download.bin';
    const startedAt = Date.now();
    setScpActionBusy(`download:${entry.path}`);
    setScpError('');
    clearScpTransferTimer();

    setScpTransferProgress({
      active: true,
      completed: false,
      direction: 'DOWNLOAD',
      fileName,
      fileCount: 1,
      loadedBytes: 0,
      totalBytes: expectedBytes,
      percent: 6,
      speedBps: 0,
      stage: `Stage 1/3 · Connecting to ${targetVm.name} & staging "${fileName}" over SCP/SFTP...`,
      engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
    });

    let receivedFirstChunk = false;
    scpTransferTimerRef.current = setInterval(() => {
      if (receivedFirstChunk) return;
      setScpTransferProgress((prev) => {
        if (!prev || !prev.active || prev.completed || prev.percent >= 38) {
          return prev;
        }
        const nextPct = Math.min(38, prev.percent + 4);
        const nextLoaded =
          expectedBytes > 0 ? Math.round((nextPct / 100) * expectedBytes) : 0;
        return {
          ...prev,
          percent: nextPct,
          loadedBytes: nextLoaded,
          stage: `Stage 2/3 · Reading "${fileName}" from VM disk over SSH2 SFTP / IAP Tunnel...`,
        };
      });
    }, 220);

    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/download`,
        {
          params: {
            zone: targetVm.zone || '',
            username: customUsername || defaultUsername || 'ubuntu',
            path: entry.path,
            mode: 'raw',
          },
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            receivedFirstChunk = true;
            clearScpTransferTimer();
            const total = Number(
              progressEvent.total || expectedBytes || progressEvent.loaded || 0
            );
            const loaded = Number(progressEvent.loaded || 0);
            const ratio = total > 0 ? Math.min(1, loaded / total) : 1;
            const elapsedSec = Math.max(0.12, (Date.now() - startedAt) / 1000);
            const speedBps = Math.round(loaded / elapsedSec);
            const pct = Math.min(99, Math.max(40, Math.round(40 + ratio * 59)));
            setScpTransferProgress((prev) => ({
              ...(prev || {}),
              active: true,
              completed: false,
              direction: 'DOWNLOAD',
              fileName,
              fileCount: 1,
              loadedBytes: loaded,
              totalBytes: total,
              percent: pct,
              speedBps,
              stage: `Stage 3/3 · Streaming "${fileName}" to browser (${formatBytes(
                loaded
              )} / ${formatBytes(total)})...`,
              engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
            }));
          },
        }
      );

      clearScpTransferTimer();
      const blob =
        res.data instanceof Blob ? res.data : new Blob([res.data || '']);
      const finalBytes = blob.size || expectedBytes;
      const engineHeader =
        res.headers?.['x-scp-engine-used'] ||
        scpEngineUsed ||
        'SSH2_SFTP_DIRECT';
      const sha256Header = res.headers?.['x-scp-sha256'] || '';
      const elapsedSec = Math.max(0.15, (Date.now() - startedAt) / 1000);
      const finalSpeed = Math.round(finalBytes / elapsedSec);

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);

      setScpTransferProgress({
        active: true,
        completed: true,
        direction: 'DOWNLOAD',
        fileName,
        fileCount: 1,
        loadedBytes: finalBytes,
        totalBytes: finalBytes,
        percent: 100,
        speedBps: finalSpeed,
        sha256: sha256Header,
        stage: `✓ Downloaded "${fileName}" (${formatBytes(
          finalBytes
        )}) to your laptop!`,
        engine: engineHeader,
      });
      appendTransferHistory({
        direction: 'DOWNLOAD',
        fileName,
        sizeBytes: finalBytes,
        speedBps: finalSpeed,
        engine: engineHeader,
        sha256: sha256Header,
        vmName: targetVm.name,
      });
      setScpStatusMsg(
        `Downloaded "${fileName}" (${formatBytes(finalBytes)}) via SCP/SFTP.`
      );
      setTimeout(() => setScpStatusMsg(''), 5000);
      scpTransferTimerRef.current = setTimeout(() => {
        setScpTransferProgress(null);
      }, 3200);
    } catch (err) {
      clearScpTransferTimer();
      setScpTransferProgress(null);
      let errMsg =
        err.message || `Failed to download ${fileName} via SCP/SFTP.`;
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.error) errMsg = parsed.error;
        } catch {
          // ignore
        }
      } else if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      }
      setScpError(errMsg);
    } finally {
      setScpActionBusy('');
    }
  };

  const handleUploadScpFiles = async (fileList) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !fileList || fileList.length === 0) return;
    const filesArr = Array.from(fileList);
    const totalRawBytes = filesArr.reduce(
      (sum, f) => sum + Number(f.size || 0),
      0
    );
    const labelName =
      filesArr.length === 1
        ? filesArr[0].name
        : `${filesArr[0].name} + ${filesArr.length - 1} more (${
            filesArr.length
          } files)`;
    const startedAt = Date.now();

    setScpActionBusy('upload');
    setScpError('');
    setScpStatusMsg('');
    clearScpTransferTimer();

    setScpTransferProgress({
      active: true,
      completed: false,
      direction: 'UPLOAD',
      fileName: labelName,
      fileCount: filesArr.length,
      loadedBytes: 0,
      totalBytes: totalRawBytes,
      percent: 3,
      speedBps: 0,
      stage: `Stage 1/3 · Reading & Base64-encoding ${filesArr.length} local file(s)...`,
      engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
    });

    try {
      const perFileLoaded = new Array(filesArr.length).fill(0);
      const encodedFiles = await Promise.all(
        filesArr.map(
          (file, idx) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onprogress = (ev) => {
                if (ev.lengthComputable && totalRawBytes > 0) {
                  perFileLoaded[idx] = ev.loaded;
                  const readSum = perFileLoaded.reduce((a, b) => a + b, 0);
                  const readRatio = Math.min(1, readSum / totalRawBytes);
                  const pct = Math.max(4, Math.round(readRatio * 24));
                  setScpTransferProgress((prev) =>
                    prev
                      ? {
                          ...prev,
                          loadedBytes: Math.round(readSum * 0.25),
                          percent: pct,
                          stage: `Stage 1/3 · Reading local file(s) (${Math.round(
                            readRatio * 100
                          )}%)...`,
                        }
                      : prev
                  );
                }
              };
              reader.onload = () => {
                perFileLoaded[idx] = file.size || 0;
                const resultStr = String(reader.result || '');
                const base64 = resultStr.includes(',')
                  ? resultStr.split(',')[1]
                  : '';
                resolve({
                  name: file.name,
                  sizeBytes: file.size,
                  contentBase64: base64,
                });
              };
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );

      let startedRemoteWriteTimer = false;
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/upload`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          targetDir: scpPath || '~',
          files: encodedFiles,
        },
        {
          onUploadProgress: (progressEvent) => {
            const total = Number(
              progressEvent.total || progressEvent.loaded || 1
            );
            const ratio = Math.min(1, Number(progressEvent.loaded || 0) / total);
            const elapsedSec = Math.max(0.12, (Date.now() - startedAt) / 1000);
            const effectiveBytes = Math.min(
              totalRawBytes,
              Math.round(totalRawBytes * (0.25 + ratio * 0.57))
            );
            const speedBps = Math.round(effectiveBytes / elapsedSec);
            const pct = Math.min(82, Math.max(25, Math.round(25 + ratio * 57)));

            setScpTransferProgress((prev) => ({
              ...(prev || {}),
              active: true,
              completed: false,
              direction: 'UPLOAD',
              fileName: labelName,
              fileCount: filesArr.length,
              loadedBytes: effectiveBytes,
              totalBytes: totalRawBytes,
              percent: pct,
              speedBps,
              stage:
                ratio < 1
                  ? `Stage 2/3 · Streaming SFTP payload (${formatBytes(
                      effectiveBytes
                    )} / ${formatBytes(totalRawBytes)})...`
                  : `Stage 3/3 · Writing ${filesArr.length} file(s) to ${targetVm.name}:${
                      scpPath || '~'
                    } over SFTP / IAP...`,
              engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
            }));

            if (ratio >= 1 && !startedRemoteWriteTimer) {
              startedRemoteWriteTimer = true;
              clearScpTransferTimer();
              scpTransferTimerRef.current = setInterval(() => {
                setScpTransferProgress((prev) => {
                  if (
                    !prev ||
                    !prev.active ||
                    prev.completed ||
                    prev.percent >= 97
                  ) {
                    return prev;
                  }
                  const nextPct = Math.min(97, prev.percent + 2);
                  return {
                    ...prev,
                    percent: nextPct,
                    loadedBytes: Math.round((nextPct / 100) * totalRawBytes),
                    stage: `Stage 3/3 · Writing blocks to ${targetVm.name} disk over SSH2 SFTP / IAP Tunnel...`,
                  };
                });
              }, 240);
            }
          },
        }
      );

      clearScpTransferTimer();
      const elapsedSec = Math.max(0.15, (Date.now() - startedAt) / 1000);
      const finalEngine =
        res.data?.engineUsed || scpEngineUsed || 'SSH2_SFTP_DIRECT';
      const uploadSha256 = res.data?.sha256 || '';
      const finalSpeed = Math.round(totalRawBytes / elapsedSec);

      setScpTransferProgress({
        active: true,
        completed: true,
        direction: 'UPLOAD',
        fileName: labelName,
        fileCount: filesArr.length,
        loadedBytes: totalRawBytes,
        totalBytes: totalRawBytes,
        percent: 100,
        speedBps: finalSpeed,
        sha256: uploadSha256,
        stage:
          res.data?.message ||
          `✓ Uploaded ${filesArr.length} file(s) (${formatBytes(
            totalRawBytes
          )}) to ${scpPath || '~'}!`,
        engine: finalEngine,
      });
      appendTransferHistory({
        direction: 'UPLOAD',
        fileName: labelName,
        sizeBytes: totalRawBytes,
        speedBps: finalSpeed,
        engine: finalEngine,
        sha256: uploadSha256,
        vmName: targetVm.name,
      });
      setScpStatusMsg(res.data?.message || 'SCP upload complete!');
      setTimeout(() => setScpStatusMsg(''), 5000);
      scpTransferTimerRef.current = setTimeout(() => {
        setScpTransferProgress(null);
      }, 3400);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      clearScpTransferTimer();
      setScpTransferProgress(null);
      setScpStatusMsg('');
      setScpError(
        err.response?.data?.error ||
          err.message ||
          'Failed to upload file(s) via SCP/SFTP.'
      );
    } finally {
      setScpActionBusy('');
      if (scpFileInputRef.current) {
        scpFileInputRef.current.value = '';
      }
    }
  };

  const handleSaveScpEditorFile = async () => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !scpEditorFile?.path) return;
    const contentBytes = new Blob([String(scpEditorFile.content || '')]).size;
    const startedAt = Date.now();
    setScpActionBusy('save-file');
    setScpError('');
    clearScpTransferTimer();

    setScpTransferProgress({
      active: true,
      completed: false,
      direction: 'SAVE',
      fileName: scpEditorFile.fileName || scpEditorFile.path,
      fileCount: 1,
      loadedBytes: Math.round(contentBytes * 0.35),
      totalBytes: contentBytes,
      percent: 35,
      speedBps: 0,
      stage: `Writing "${
        scpEditorFile.fileName || scpEditorFile.path
      }" to ${targetVm.name} via SCP/SFTP...`,
      engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
    });

    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'WRITE_FILE',
          targetPath: scpEditorFile.path,
          content: scpEditorFile.content,
        }
      );
      const elapsedSec = Math.max(0.12, (Date.now() - startedAt) / 1000);
      const savedSha256 = res.data?.sha256 || '';
      setScpTransferProgress({
        active: true,
        completed: true,
        direction: 'SAVE',
        fileName: scpEditorFile.fileName || scpEditorFile.path,
        fileCount: 1,
        loadedBytes: contentBytes,
        totalBytes: contentBytes,
        percent: 100,
        speedBps: Math.round(contentBytes / elapsedSec),
        sha256: savedSha256,
        stage:
          res.data?.message ||
          `✓ Saved "${scpEditorFile.fileName}" (${formatBytes(
            contentBytes
          )}) to VM!`,
        engine: res.data?.engineUsed || scpEngineUsed || 'SSH2_SFTP_DIRECT',
      });
      appendTransferHistory({
        direction: 'SAVE',
        fileName: scpEditorFile.fileName || scpEditorFile.path,
        sizeBytes: contentBytes,
        speedBps: Math.round(contentBytes / elapsedSec),
        engine: res.data?.engineUsed || scpEngineUsed || 'SSH2_SFTP_DIRECT',
        sha256: savedSha256,
        vmName: targetVm.name,
      });
      scpTransferTimerRef.current = setTimeout(() => {
        setScpTransferProgress(null);
      }, 2800);

      setScpStatusMsg(
        res.data?.message || `Saved ${scpEditorFile.fileName} to VM!`
      );
      setTimeout(() => setScpStatusMsg(''), 4500);
      setScpEditorFile(null);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      clearScpTransferTimer();
      setScpTransferProgress(null);
      setScpError(
        err.response?.data?.error ||
          err.message ||
          'Failed to save remote file via SCP/SFTP.'
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleCreateScpFolder = async () => {
    const targetVm = activeVm || focusedVm;
    const cleanName = scpNewFolderName.trim();
    if (!targetVm || !cleanName) return;
    const fullTarget =
      scpPath === '/' ? `/${cleanName}` : `${scpPath}/${cleanName}`;
    setScpActionBusy('mkdir');
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'MKDIR',
          targetPath: fullTarget,
        }
      );
      setScpNewFolderName('');
      setScpNewFolderPrompt(false);
      setScpStatusMsg(res.data?.message || `Created folder ${cleanName}`);
      setTimeout(() => setScpStatusMsg(''), 4000);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      setScpError(
        err.response?.data?.error || err.message || 'Failed to create folder.'
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleDeleteScpEntry = async (entryPath) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !entryPath) return;
    setScpActionBusy(`del:${entryPath}`);
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'DELETE',
          targetPath: entryPath,
        }
      );
      setScpConfirmDeletePath(null);
      if (scpChecksumResult?.path === entryPath) {
        setScpChecksumResult(null);
      }
      if (scpChmodTarget?.path === entryPath) {
        setScpChmodTarget(null);
      }
      if (scpRenameTarget?.path === entryPath) {
        setScpRenameTarget(null);
      }
      setScpStatusMsg(res.data?.message || `Deleted ${entryPath}`);
      setTimeout(() => setScpStatusMsg(''), 4000);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      setScpError(
        err.response?.data?.error || err.message || 'Failed to delete item.'
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleDownloadScpTarGz = async (pathOrPaths, customLabel = '') => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !pathOrPaths) return;
    const isMulti = Array.isArray(pathOrPaths);
    const serializedPath = isMulti
      ? JSON.stringify(pathOrPaths)
      : String(pathOrPaths);
    const archiveName =
      customLabel ||
      (isMulti
        ? `${targetVm.name}-${pathOrPaths.length}-items.tar.gz`
        : `${
            String(pathOrPaths).split('/').filter(Boolean).pop() ||
            targetVm.name
          }.tar.gz`);
    const busyKey = isMulti ? 'batch-tar' : `tar:${serializedPath}`;
    const startedAt = Date.now();

    setScpActionBusy(busyKey);
    setScpError('');
    clearScpTransferTimer();

    setScpTransferProgress({
      active: true,
      completed: false,
      direction: 'DOWNLOAD',
      fileName: archiveName,
      fileCount: isMulti ? pathOrPaths.length : 1,
      loadedBytes: 0,
      totalBytes: 0,
      percent: 8,
      speedBps: 0,
      stage: `Stage 1/3 · Compressing "${archiveName}" on ${targetVm.name} (tar -czf)...`,
      engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
    });

    let receivedFirstChunk = false;
    scpTransferTimerRef.current = setInterval(() => {
      if (receivedFirstChunk) return;
      setScpTransferProgress((prev) => {
        if (!prev || !prev.active || prev.completed || prev.percent >= 42) {
          return prev;
        }
        return {
          ...prev,
          percent: Math.min(42, prev.percent + 5),
          stage: `Stage 2/3 · Building gzip archive & streaming over SSH2 SFTP / IAP Tunnel...`,
        };
      });
    }, 240);

    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/download`,
        {
          params: {
            zone: targetVm.zone || '',
            username: customUsername || defaultUsername || 'ubuntu',
            path: serializedPath,
            mode: 'tar_gz',
          },
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            receivedFirstChunk = true;
            clearScpTransferTimer();
            const total = Number(
              progressEvent.total || progressEvent.loaded || 0
            );
            const loaded = Number(progressEvent.loaded || 0);
            const ratio = total > 0 ? Math.min(1, loaded / total) : 1;
            const elapsedSec = Math.max(0.12, (Date.now() - startedAt) / 1000);
            const speedBps = Math.round(loaded / elapsedSec);
            const pct = Math.min(99, Math.max(45, Math.round(45 + ratio * 54)));
            setScpTransferProgress((prev) => ({
              ...(prev || {}),
              active: true,
              completed: false,
              direction: 'DOWNLOAD',
              fileName: archiveName,
              loadedBytes: loaded,
              totalBytes: total,
              percent: pct,
              speedBps,
              stage: `Stage 3/3 · Streaming archive "${archiveName}" (${formatBytes(
                loaded
              )})...`,
              engine: scpEngineUsed || 'SSH2_SFTP_DIRECT',
            }));
          },
        }
      );

      clearScpTransferTimer();
      const blob =
        res.data instanceof Blob ? res.data : new Blob([res.data || '']);
      const finalBytes = blob.size || 0;
      const engineHeader =
        res.headers?.['x-scp-engine-used'] ||
        scpEngineUsed ||
        'SSH2_SFTP_DIRECT';
      const sha256Header = res.headers?.['x-scp-sha256'] || '';
      const elapsedSec = Math.max(0.15, (Date.now() - startedAt) / 1000);
      const finalSpeed = Math.round(finalBytes / elapsedSec);

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', archiveName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 5000);

      setScpTransferProgress({
        active: true,
        completed: true,
        direction: 'DOWNLOAD',
        fileName: archiveName,
        fileCount: isMulti ? pathOrPaths.length : 1,
        loadedBytes: finalBytes,
        totalBytes: finalBytes,
        percent: 100,
        speedBps: finalSpeed,
        sha256: sha256Header,
        stage: `✓ Downloaded archive "${archiveName}" (${formatBytes(
          finalBytes
        )})!`,
        engine: engineHeader,
      });
      appendTransferHistory({
        direction: 'ARCHIVE (.tar.gz)',
        fileName: archiveName,
        sizeBytes: finalBytes,
        speedBps: finalSpeed,
        engine: engineHeader,
        sha256: sha256Header,
        vmName: targetVm.name,
      });
      scpTransferTimerRef.current = setTimeout(() => {
        setScpTransferProgress(null);
      }, 3400);
    } catch (err) {
      clearScpTransferTimer();
      setScpTransferProgress(null);
      let errMsg =
        err.message || `Failed to download ${archiveName} via SCP/SFTP.`;
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed?.error) errMsg = parsed.error;
        } catch {
          // ignore
        }
      } else if (err.response?.data?.error) {
        errMsg = err.response.data.error;
      }
      setScpError(errMsg);
    } finally {
      setScpActionBusy('');
    }
  };

  const handleTailScpLogFile = async (entry, lines = 150) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !entry?.path) return;
    setScpActionBusy(`tail:${entry.path}`);
    setScpError('');
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/download`,
        {
          params: {
            zone: targetVm.zone || '',
            username: customUsername || defaultUsername || 'ubuntu',
            path: entry.path,
            mode: 'tail',
            lines,
          },
        }
      );
      setScpEditorFile({
        path: res.data?.path || entry.path,
        fileName: `${res.data?.fileName || entry.name} (last ${
          res.data?.tailLines || lines
        } lines)`,
        content: res.data?.content || '',
        isBinary: false,
        sizeBytes: res.data?.sizeBytes ?? entry.sizeBytes,
        sha256: res.data?.sha256 || '',
        isNew: false,
        isTailMode: true,
      });
    } catch (err) {
      setScpError(
        err.response?.data?.error ||
          err.message ||
          `Failed to tail ${entry.name}.`
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleExtractScpArchive = async (entry) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !entry?.path) return;
    setScpActionBusy(`extract:${entry.path}`);
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'EXTRACT_ARCHIVE',
          targetPath: entry.path,
        }
      );
      setScpStatusMsg(res.data?.message || `Extracted ${entry.name}!`);
      setTimeout(() => setScpStatusMsg(''), 4500);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      setScpError(
        err.response?.data?.error ||
          err.message ||
          `Failed to extract ${entry.name}.`
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleCompressScpOnVm = async (pathsArr, customName = '') => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !Array.isArray(pathsArr) || pathsArr.length === 0) return;
    const outName =
      customName ||
      (pathsArr.length === 1
        ? `${pathsArr[0].split('/').filter(Boolean).pop()}.tar.gz`
        : `bundle-${pathsArr.length}-items.tar.gz`);
    setScpActionBusy('compress');
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'COMPRESS_TAR_GZ',
          targetPath: outName,
          paths: pathsArr,
        }
      );
      setScpStatusMsg(res.data?.message || `Created ${outName} on VM!`);
      setTimeout(() => setScpStatusMsg(''), 4500);
      setScpSelectedPaths([]);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      setScpError(
        err.response?.data?.error ||
          err.message ||
          'Failed to compress archive on VM.'
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleChmodScpEntry = async (entryPath, nextModeOctal) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !entryPath || !nextModeOctal) return;
    setScpActionBusy(`chmod:${entryPath}`);
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'CHMOD',
          targetPath: entryPath,
          modeOctal: nextModeOctal,
        }
      );
      setScpChmodTarget(null);
      setScpStatusMsg(res.data?.message || `chmod ${nextModeOctal} applied!`);
      setTimeout(() => setScpStatusMsg(''), 4000);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      setScpError(
        err.response?.data?.error || err.message || 'Failed to chmod item.'
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleRenameScpEntry = async () => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !scpRenameTarget?.path || !scpRenameTarget?.newName?.trim())
      return;
    const cleanNew = scpRenameTarget.newName.trim();
    const parentDir =
      scpRenameTarget.path.split('/').slice(0, -1).join('/') || '/';
    const fullNewPath =
      parentDir === '/' ? `/${cleanNew}` : `${parentDir}/${cleanNew}`;
    setScpActionBusy(`rename:${scpRenameTarget.path}`);
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'RENAME',
          targetPath: scpRenameTarget.path,
          newPath: fullNewPath,
        }
      );
      if (scpChecksumResult?.path === scpRenameTarget.path) {
        setScpChecksumResult((prev) =>
          prev ? { ...prev, path: fullNewPath, name: cleanNew } : null
        );
      }
      setScpRenameTarget(null);
      setScpStatusMsg(res.data?.message || `Renamed to ${cleanNew}`);
      setTimeout(() => setScpStatusMsg(''), 4000);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      setScpError(
        err.response?.data?.error || err.message || 'Failed to rename item.'
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleInspectScpChecksum = async (entry) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !entry?.path) return;
    setScpActionBusy(`sha:${entry.path}`);
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'CHECKSUM_SHA256',
          targetPath: entry.path,
        }
      );
      setScpChecksumResult({
        path: entry.path,
        name: entry.name,
        sha256: res.data?.sha256 || '',
        md5: res.data?.md5 || '',
        sizeBytes: res.data?.sizeBytes ?? entry.sizeBytes,
        lineCount: res.data?.lineCount ?? 0,
      });
    } catch (err) {
      setScpError(
        err.response?.data?.error ||
          err.message ||
          `Failed to compute SHA-256 for ${entry.name}.`
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleBatchDeleteScpEntries = async () => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || scpSelectedPaths.length === 0) return;
    setScpActionBusy('batch-delete');
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || '',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'BATCH_DELETE',
          targetPath: scpSelectedPaths[0],
          paths: scpSelectedPaths,
        }
      );
      if (
        scpChecksumResult?.path &&
        scpSelectedPaths.includes(scpChecksumResult.path)
      ) {
        setScpChecksumResult(null);
      }
      setScpSelectedPaths([]);
      setScpStatusMsg(
        res.data?.message || `Deleted ${scpSelectedPaths.length} item(s).`
      );
      setTimeout(() => setScpStatusMsg(''), 4000);
      await fetchScpDirectory(scpPath, { silent: true });
    } catch (err) {
      setScpError(
        err.response?.data?.error ||
          err.message ||
          'Failed to batch-delete selected items.'
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const cloudRunSshCli = cloudRunService
    ? `gcloud beta run services ssh ${cloudRunService.name} --region=${
        cloudRunService.region || 'us-east1'
      } --project=${projectId}${
        selectedRevision && selectedRevision !== 'LATEST'
          ? ` --revision=${selectedRevision}`
          : ''
      }${selectedContainer ? ` --container=${selectedContainer}` : ''}${
        selectedInstanceId ? ` --instance=${selectedInstanceId}` : ''
      }`
    : '';

  const displayCli = isCloudRun
    ? cloudRunSshCli
    : (activeVm || focusedVm)
    ? `gcloud compute ssh ${
        customUsername ? `${customUsername}@` : ''
      }${(activeVm || focusedVm).name} --zone=${(activeVm || focusedVm).zone} --project=${projectId}`
    : '';

  // Re-fit XTerm.js whenever viewMode switches back to LIVE_SSH_PTY or SPLIT_SSH_AND_SCP
  useEffect(() => {
    if (viewMode === 'LIVE_SSH_PTY' || viewMode === 'SPLIT_SSH_AND_SCP') {
      const timer = setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch {
          // ignore
        }
      }, 60);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [viewMode]);

  // Only initialize XTerm.js & WebSocket when `isSessionEnabled` is true (stays persistent across SCP/Serial tab switches!)
  useEffect(() => {
    if (!isSessionEnabled) {
      setConnStatus({
        status: 'OFF',
        engine: 'STANDBY',
        message: isCloudRun
          ? 'SSH is off — click "SSH / Container Shell" on a Cloud Run service to connect'
          : 'SSH is off — click "SSH / Console" on a VM card to connect',
      });
      return undefined;
    }
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
        red: '#ea4335',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        magenta: '#4285f4',
        cyan: '#1a73e8',
        white: '#f4f4f5',
        brightBlack: '#52525b',
        brightRed: '#fb7185',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#60a5fa',
        brightMagenta: '#8ab4f8',
        brightCyan: '#669df6',
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
        term.focus();
      } catch {
        // ignore
      }
    }, 50);

    term.writeln(
      `\x1b[1;32m╔══════════════════════════════════════════════════════════════════════════╗\x1b[0m`
    );
    term.writeln(
      isCloudRun
        ? `\x1b[1;32m║  CloudPulse 2026 · Cloud Run Interactive Container SSH (@xterm/xterm)    ║\x1b[0m`
        : `\x1b[1;32m║  CloudPulse 2026 · Open-Source Xterm.js + SSH2 / PTY Interactive Client  ║\x1b[0m`
    );
    term.writeln(
      `\x1b[1;32m╚══════════════════════════════════════════════════════════════════════════╝\x1b[0m`
    );

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let query;

    if (isCloudRun && cloudRunService) {
      query = new URLSearchParams({
        targetType: 'CLOUD_RUN',
        projectId: projectId || '',
        serviceName: cloudRunService.name || '',
        region: cloudRunService.region || 'us-east1',
        revision: selectedRevision || 'LATEST',
        container: selectedContainer || '',
        instance: selectedInstanceId || '',
        serviceUri: cloudRunService.uri || '',
        engine: sshEngine || 'cloudrun_ssh',
        cols: String(term.cols || 100),
        rows: String(term.rows || 28),
      });
    } else {
      const targetVmName =
        sshEngine === 'cloud_shell' || !activeVm
          ? '__CLOUD_SHELL__'
          : activeVm.name;
      const targetZone = activeVm?.zone || 'us-east1-b';
      const targetHost =
        activeVm?.externalIp && activeVm.externalIp !== 'None'
          ? activeVm.externalIp
          : activeVm?.internalIp || '';

      if (
        targetVmName !== '__CLOUD_SHELL__' &&
        activeVm &&
        activeVm.status !== 'RUNNING'
      ) {
        term.writeln(
          `\x1b[38;5;214mVM "${activeVm.name}" is currently ${activeVm.status}. Start the VM to SSH into it, or switch engine to "Local GCloud / Bash PTY".\x1b[0m`
        );
      }

      query = new URLSearchParams({
        targetType: 'VM',
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
    }

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
      if (!isCloudRun && (customPassword || customPrivateKey)) {
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
    isSessionEnabled,
    isCloudRun,
    projectId,
    activeVm?.name,
    activeVm?.zone,
    activeVm?.externalIp,
    activeVm?.internalIp,
    activeVm?.status,
    cloudRunService?.name,
    cloudRunService?.region,
    cloudRunService?.uri,
    selectedRevision,
    selectedContainer,
    selectedInstanceId,
    sshEngine,
    customUsername,
    reconnectNonce,
  ]);

  const macrosToRender = isCloudRun ? CLOUD_RUN_PTY_MACROS : VM_PTY_MACROS;

  const handleTriggerVmPower = async (action, connectAfterStart = false) => {
    if (!focusedVm || !onVmPowerAction) return;
    if (action === 'STOP' && isSessionEnabled && onDisconnect) {
      onDisconnect();
    }
    if (action === 'START' && connectAfterStart) {
      setAutoConnectOnRunning(true);
    }
    await onVmPowerAction(focusedVm, action);
  };

  return (
    <div className="bg-white dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Row 1: Top Terminal Window Bar + Target VM Selector + Inline Start/Stop VM & SSH Session Controls */}
      <div className="bg-zinc-50 dark:bg-zinc-900/95 border-b border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className="flex items-center gap-1.5 mr-0.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <Terminal className="w-4 h-4 text-emerald-500 shrink-0" />

          {isCloudRun && cloudRunService ? (
            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {`root@${cloudRunService.name} (${cloudRunService.region} · Cloud Run Container SSH)`}
            </span>
          ) : !isCloudRun && vms.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={focusedVm?.name || ''}
                onChange={(e) => {
                  const picked = vms.find((v) => v.name === e.target.value);
                  setSelectedVmName(e.target.value);
                  if (picked && isSessionEnabled && onSelectVm) {
                    onSelectVm(picked);
                  }
                }}
                className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                title="Select target Compute Engine VM directly from Xterm.js"
              >
                {vms.map((v) => (
                  <option key={v.name} value={v.name}>
                    {customUsername || 'ubuntu'}@{v.name} ({v.zone} ·{' '}
                    {v.externalIp && v.externalIp !== 'None'
                      ? v.externalIp
                      : v.internalIp || 'No IP'}
                    )
                  </option>
                ))}
              </select>

              {focusedVm && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full border ${
                    isFocusedVmTransitional
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                      : isFocusedVmRunning
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border-red-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFocusedVmTransitional
                        ? 'bg-amber-400'
                        : isFocusedVmRunning
                        ? 'bg-emerald-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <span>VM: {focusedVmEffectiveStatus}</span>
                </span>
              )}
            </div>
          ) : (
            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
              {sshEngine === 'cloud_shell'
                ? `${customUsername}@cloud-shell (${projectId})`
                : 'No Compute Engine VMs in Project'}
            </span>
          )}
        </div>

        {/* Inline VM Start / Stop / Reboot + Connect / Disconnect SSH Buttons right inside Xterm Header */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isCloudRun && focusedVm && onVmPowerAction && (
            <>
              {isFocusedVmRunning ? (
                <>
                  {!isSessionEnabled && onSelectVm && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('LIVE_SSH_PTY');
                        onSelectVm(focusedVm);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
                      title={`Connect interactive Xterm.js SSH to ${customUsername}@${focusedVm.name}`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Connect SSH</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={isFocusedVmTransitional}
                    onClick={() => handleTriggerVmPower('STOP', false)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-red-500/15 hover:bg-red-600 text-red-600 dark:text-red-300 hover:text-white border border-red-500/30 transition-colors cursor-pointer disabled:opacity-50"
                    title={`Stop VM "${focusedVm.name}" directly from Xterm.js`}
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop VM</span>
                  </button>

                  <button
                    type="button"
                    disabled={isFocusedVmTransitional}
                    onClick={() => handleTriggerVmPower('RESET', false)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                    title={`Reboot VM "${focusedVm.name}"`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reboot</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isFocusedVmTransitional}
                    onClick={() => handleTriggerVmPower('START', true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    title={`Start VM "${focusedVm.name}" and automatically launch SSH once RUNNING`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>
                      {isFocusedVmTransitional
                        ? 'Starting VM...'
                        : 'Start VM & Connect SSH'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isFocusedVmTransitional}
                    onClick={() => handleTriggerVmPower('START', false)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                    title={`Start VM "${focusedVm.name}" without opening SSH`}
                  >
                    <Play className="w-2.5 h-2.5" />
                    <span>Start Only</span>
                  </button>
                </>
              )}
            </>
          )}

          {isSessionEnabled && (
            <>
              <button
                type="button"
                onClick={() => setReconnectNonce((n) => n + 1)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
                title="Reconnect interactive Web-SSH PTY session"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reconnect</span>
              </button>

              {onDisconnect && (
                <button
                  type="button"
                  onClick={() => {
                    if (sshEngine === 'cloud_shell') {
                      setSshEngine('auto');
                    }
                    onDisconnect();
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-zinc-200/80 dark:bg-zinc-800 hover:bg-red-600 text-zinc-700 dark:text-zinc-300 hover:text-white border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
                  title="Disconnect the active SSH session"
                >
                  <PowerOff className="w-3 h-3" />
                  <span>Disconnect SSH</span>
                </button>
              )}
            </>
          )}

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
              title={
                isExpanded
                  ? 'Restore split-pane layout'
                  : 'Expand Web-SSH terminal to full-width cinema mode'
              }
            >
              {isExpanded ? (
                <>
                  <Minimize2 className="w-3 h-3" />
                  <span>Split</span>
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

      {/* Row 2: Compact Single-Bar User Picker + Identity Toggle + Engine + Serial Port */}
      <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/90 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          {!isCloudRun && (
            <>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500">
                <User className="w-3 h-3 text-emerald-500" />
                <span>User:</span>
              </span>
              <div className="inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-900 p-0.5 border border-zinc-200 dark:border-zinc-800">
                {(
                  identityInfo?.candidateUsers || [
                    {
                      username: customUsername || defaultUsername || 'ubuntu',
                      label: `${customUsername || defaultUsername || 'ubuntu'}`,
                      homeDir: `/home/${customUsername || defaultUsername || 'ubuntu'}`,
                      requiresMode: 'METADATA_SSH',
                    },
                  ]
                ).map((cand) => {
                  const isSelected = customUsername === cand.username;
                  const isOsLoginCand = cand.requiresMode === 'OS_LOGIN';
                  return (
                    <button
                      key={cand.username}
                      type="button"
                      disabled={identityBusy}
                      onClick={() => handleSelectSshUserProfile(cand)}
                      title={`${cand.label} (${cand.homeDir})`}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                      }`}
                    >
                      {cand.username}
                      {isOsLoginCand ? ' (IAM)' : ''}
                    </button>
                  );
                })}
              </div>

              {isSessionEnabled && connStatus.status === 'CONNECTED' && customUsername && (
                <button
                  type="button"
                  onClick={() => sendToPty(`sudo su - ${customUsername}\r`)}
                  title={`Run "sudo su - ${customUsername}" inside the active terminal`}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 cursor-pointer"
                >
                  su - {customUsername}
                </button>
              )}

              {identityInfo && (
                <button
                  type="button"
                  disabled={identityBusy}
                  onClick={handleToggleOsLoginMode}
                  title={
                    identityInfo.osLoginEnabled
                      ? `IAM OS Login is ON (enable-oslogin=TRUE, forces ${identityInfo.osLoginPosixUser}). Click to switch to Standard Metadata SSH so "${identityInfo.localOsUser}" is used.`
                      : `Standard Metadata SSH is ON (enable-oslogin=FALSE, "${identityInfo.localOsUser}" unlocked). Click to toggle IAM OS Login.`
                  }
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer disabled:opacity-50 ${
                    identityInfo.osLoginEnabled
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                  }`}
                >
                  {identityInfo.osLoginEnabled ? (
                    <>
                      <Lock className="w-2.5 h-2.5" />
                      <span>OS Login: ON</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-2.5 h-2.5" />
                      <span>OS Login: OFF</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {isCloudRun && cloudRunService && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500">Revision:</span>
              <select
                value={selectedRevision}
                onChange={(e) => setSelectedRevision(e.target.value)}
                className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-0.5 text-[11px] text-zinc-800 dark:text-zinc-200"
              >
                <option value="LATEST">
                  LATEST ({cloudRunService.latestReadyRevision || 'active'})
                </option>
                {(cloudRunService.revisions || []).map((r) => (
                  <option key={r.shortName} value={r.shortName}>
                    {r.shortName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {!isCloudRun && (
            <div
              className="inline-flex items-center rounded-lg bg-zinc-200/80 dark:bg-zinc-900 p-0.5 border border-zinc-300 dark:border-zinc-800"
              role="tablist"
              aria-label="VM Workspace Mode Switcher"
            >
              <button
                type="button"
                onClick={() => setViewMode('LIVE_SSH_PTY')}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                  viewMode === 'LIVE_SSH_PTY'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title="Interactive Xterm.js Web-SSH PTY Terminal"
              >
                <Terminal className="w-3 h-3" />
                <span>SSH Console</span>
                {isSessionEnabled && connStatus.status === 'CONNECTED' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                )}
              </button>

              {focusedVm && (
                <>
                  <button
                    type="button"
                    onClick={() => setViewMode('SCP_FILE_MANAGER')}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                      viewMode === 'SCP_FILE_MANAGER'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                    title={`Visual SCP / SFTP File Browser, Drag-and-Drop Uploader, Downloader & In-Place Editor for ${
                      (activeVm || focusedVm).name
                    }`}
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>SCP / SFTP Files</span>
                    {scpTransferProgress?.active &&
                      !scpTransferProgress.completed && (
                        <span className="px-1 rounded bg-white/20 text-[9px] font-mono">
                          {scpTransferProgress.percent}%
                        </span>
                      )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('SPLIT_SSH_AND_SCP');
                      if (!isSessionEnabled && onSelectVm && focusedVm) {
                        onSelectVm(focusedVm);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                      viewMode === 'SPLIT_SSH_AND_SCP'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                    title="Dual Split-Screen Workbench: Live Xterm.js SSH Terminal + Visual SCP/SFTP File Studio side-by-side"
                  >
                    <HardDrive className="w-3 h-3" />
                    <span>⚡ Split: SSH + SCP</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setViewMode('SERIAL_PORT_1');
                  if (focusedVm && onFetchSerialConsole) {
                    onFetchSerialConsole(focusedVm);
                  }
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  viewMode === 'SERIAL_PORT_1'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
                title="Compute Engine Serial Port 1 boot & kernel console logs"
              >
                <FileText className="w-3 h-3" />
                <span>Serial Port 1</span>
              </button>
            </div>
          )}

          {!isCloudRun && focusedVm && onOpenMigrateVm && (
            <button
              type="button"
              onClick={() => onOpenMigrateVm(focusedVm)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
              title={`Open GCE → Cloud Run Modernization (mfit + m2c + GCS FUSE Disk Mount) for ${focusedVm.name}`}
            >
              <Rocket className="w-3 h-3" />
              <span>Modernize → Cloud Run</span>
            </button>
          )}

          {!isCloudRun && onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('VPC_NETWORKS')}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
              title="Open Enterprise VPC Firewall & IAP Zero-Trust Studio (0.0.0.0/0 ↔ 35.235.240.0/20)"
            >
              <Shield className="w-3 h-3 text-emerald-500" />
              <span>Firewall / IAP</span>
            </button>
          )}

          {viewMode === 'LIVE_SSH_PTY' && (
            <select
              value={sshEngine}
              onChange={(e) => setSshEngine(e.target.value)}
              className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md px-2 py-0.5 text-[10px] text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
              title="Select SSH transport engine"
            >
              {isCloudRun ? (
                <>
                  <option value="cloudrun_ssh">Engine: Cloud Run SSH PTY</option>
                  <option value="cloudrun_proxy">Engine: Auth Proxy PTY</option>
                  <option value="cloudrun_logs">Engine: Live Logs + PTY</option>
                </>
              ) : (
                <>
                  <option value="auto">Engine: Auto (SSH2 + IAP/PTY)</option>
                  <option value="ssh2">Engine: Direct SSH2 (:22)</option>
                  <option value="gcloud_pty">Engine: gcloud compute ssh</option>
                  <option value="iap">Engine: Cloud IAP Tunnel</option>
                  <option value="cloud_shell">Engine: Local Bash Shell</option>
                </>
              )}
            </select>
          )}

          {!isCloudRun && (
            <button
              type="button"
              onClick={() => setShowAuthModal((v) => !v)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border transition-colors cursor-pointer ${
                showAuthModal
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
              }`}
              title="Custom SSH Port, Password, or Private Key PEM"
            >
              <KeyRound className="w-3 h-3" />
              <span>Key/Port</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Custom SSH Credentials Drawer (for VM SSH2) */}
      {!isCloudRun && showAuthModal && (
        <div className="bg-zinc-50 dark:bg-zinc-900/95 border-b border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2.5 text-xs font-mono">
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
                onChange={(e) => {
                  setUserManuallyPicked(true);
                  setCustomUsername(e.target.value);
                }}
                placeholder={identityInfo?.localOsUser || defaultUsername || 'ubuntu'}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
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
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
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
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
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
              className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-[11px] text-zinc-900 dark:text-zinc-100 font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAuthModal(false);
                if (isSessionEnabled) {
                  setReconnectNonce((n) => n + 1);
                } else if (focusedVm && onSelectVm) {
                  onSelectVm(focusedVm);
                }
              }}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
            >
              Apply Credentials & Connect SSH
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area (Persistent SSH PTY + 10X SCP/SFTP Studio + Dual Split Mode) */}
      <div
        className={`flex-1 flex flex-col ${
          viewMode === 'SPLIT_SSH_AND_SCP' && !isCloudRun
            ? 'divide-y divide-zinc-200 dark:divide-zinc-800'
            : ''
        }`}
      >
        {(viewMode === 'SCP_FILE_MANAGER' || viewMode === 'SPLIT_SSH_AND_SCP') &&
          !isCloudRun && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setScpDragOver(true);
              }}
              onDragLeave={() => setScpDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setScpDragOver(false);
                if (e.dataTransfer?.files?.length) {
                  handleUploadScpFiles(e.dataTransfer.files);
                }
              }}
              className={`p-3.5 space-y-2.5 flex-1 flex flex-col font-mono bg-white dark:bg-[#09090c] relative ${
                scpDragOver ? 'ring-2 ring-emerald-500 bg-emerald-500/5' : ''
              }`}
            >
              <input
                ref={scpFileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleUploadScpFiles(e.target.files);
                  }
                }}
              />

              {/* Top SCP / SFTP Control, Live VM Disk Telemetry & Breadcrumb Path Bar */}
              <div className="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-zinc-900 dark:text-white">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                      <span>
                        10X SCP / SFTP Studio ({customUsername}@
                        {(activeVm || focusedVm)?.name})
                      </span>
                    </span>
                    {scpEngineUsed && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          scpEngineUsed.includes('IAP')
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {scpEngineUsed === 'SSH2_SFTP_DIRECT'
                          ? 'SSH2 SFTP Direct (:22)'
                          : scpEngineUsed.includes('IAP')
                          ? 'gcloud compute scp / IAP Tunnel'
                          : 'gcloud compute scp Direct'}
                      </span>
                    )}

                    {/* Live VM Filesystem Disk Usage Telemetry Badge */}
                    {scpDiskUsage && scpDiskUsage.totalBytes > 0 && (
                      <div
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-200/70 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-[10px]"
                        title={`VM Filesystem (${scpPath}): ${formatBytes(
                          scpDiskUsage.usedBytes
                        )} used / ${formatBytes(
                          scpDiskUsage.totalBytes
                        )} total (${formatBytes(scpDiskUsage.freeBytes)} free)`}
                      >
                        <span className="text-zinc-500 dark:text-zinc-400 font-bold">
                          VM Disk:
                        </span>
                        <div className="w-14 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              scpDiskUsage.usedPercent > 85
                                ? 'bg-red-500'
                                : scpDiskUsage.usedPercent > 70
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(4, scpDiskUsage.usedPercent || 0)
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
                          {formatBytes(scpDiskUsage.usedBytes)} /{' '}
                          {formatBytes(scpDiskUsage.totalBytes)} (
                          {scpDiskUsage.usedPercent}%)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {viewMode !== 'SPLIT_SSH_AND_SCP' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode('SPLIT_SSH_AND_SCP');
                          if (!isSessionEnabled && onSelectVm && focusedVm) {
                            onSelectVm(focusedVm);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-500/15 hover:bg-teal-500/25 text-teal-600 dark:text-teal-300 border border-teal-500/30 text-[10px] font-extrabold cursor-pointer"
                        title="Open Live SSH Terminal + SCP/SFTP File Studio side-by-side"
                      >
                        <Terminal className="w-3 h-3" />
                        <span>⚡ Split SSH + SCP</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setViewMode('SCP_FILE_MANAGER')}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-600 text-white text-[10px] font-extrabold cursor-pointer"
                        title="Maximize SCP/SFTP File Studio"
                      >
                        <span>Full SCP View</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={Boolean(scpActionBusy)}
                      onClick={() => scpFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
                      title="Upload one or more files from your laptop to this VM directory (or drag-and-drop files anywhere)"
                    >
                      <Upload className="w-3 h-3" />
                      <span>
                        {scpActionBusy === 'upload'
                          ? `Uploading ${
                              scpTransferProgress?.percent
                                ? `${scpTransferProgress.percent}%`
                                : '...'
                            }`
                          : '+ Upload File(s)'}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(scpActionBusy)}
                      onClick={() =>
                        handleDownloadScpTarGz(
                          scpPath || '~',
                          `${(activeVm || focusedVm)?.name}-${
                            (scpPath || 'home')
                              .split('/')
                              .filter(Boolean)
                              .pop() || 'root'
                          }.tar.gz`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold cursor-pointer disabled:opacity-50"
                      title="Compress entire current VM directory on-the-fly and download as .tar.gz with SHA-256 verification"
                    >
                      <Download className="w-3 h-3" />
                      <span>📦 Folder .tar.gz</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const defaultFilePath =
                          scpPath === '/'
                            ? '/new-script.sh'
                            : `${scpPath}/new-script.sh`;
                        setScpEditorFile({
                          path: defaultFilePath,
                          fileName: 'new-script.sh',
                          content:
                            '#!/usr/bin/env bash\nset -euo pipefail\n\n',
                          isBinary: false,
                          sizeBytes: 0,
                          isNew: true,
                        });
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ New File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setScpNewFolderPrompt((v) => !v)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer"
                    >
                      <Folder className="w-3 h-3 text-amber-400" />
                      <span>+ Folder</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowScpHistory((v) => !v)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold border cursor-pointer ${
                        showScpHistory
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                      }`}
                      title="Toggle Session SCP/SFTP Transfer History & SHA-256 Checksum Ledger"
                    >
                      <span>📊 Ledger ({scpTransferHistory.length})</span>
                    </button>

                    <button
                      type="button"
                      disabled={scpLoading}
                      onClick={() => fetchScpDirectory(scpPath)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${
                          scpLoading ? 'animate-spin' : ''
                        }`}
                      />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Clickable Breadcrumb Path Pills */}
                <div className="flex items-center gap-1 flex-wrap text-[10px] pt-0.5">
                  <span className="text-zinc-400 font-bold mr-0.5">Path:</span>
                  <button
                    type="button"
                    onClick={() => fetchScpDirectory('/')}
                    className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                      scpPath === '/'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-emerald-400'
                    }`}
                  >
                    / (root)
                  </button>
                  {String(scpPath || '')
                    .split('/')
                    .filter(Boolean)
                    .map((seg, idx, arr) => {
                      const targetCrumb = '/' + arr.slice(0, idx + 1).join('/');
                      const isLast = idx === arr.length - 1;
                      return (
                        <React.Fragment key={targetCrumb}>
                          <span className="text-zinc-500">›</span>
                          <button
                            type="button"
                            onClick={() => fetchScpDirectory(targetCrumb)}
                            className={`px-1.5 py-0.5 rounded font-bold cursor-pointer ${
                              isLast
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-emerald-400'
                            }`}
                          >
                            {seg}
                          </button>
                        </React.Fragment>
                      );
                    })}
                </div>

                {/* Path Navigation + Quick Bookmark Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fetchScpDirectory(scpParentPath || '/')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer"
                    title="Go to parent directory (..)"
                  >
                    <CornerLeftUp className="w-3 h-3" />
                    <span>Up (..)</span>
                  </button>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchScpDirectory(scpPathInput || '~');
                    }}
                    className="flex-1 min-w-[180px] flex items-center gap-1"
                  >
                    <input
                      type="text"
                      value={scpPathInput}
                      onChange={(e) => setScpPathInput(e.target.value)}
                      placeholder={`/home/${customUsername || 'ubuntu'}`}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold cursor-pointer shrink-0"
                    >
                      Go
                    </button>
                  </form>

                  {[
                    {
                      label: '~ Home',
                      path: `/home/${customUsername || 'ubuntu'}`,
                    },
                    { label: '/var/log', path: '/var/log' },
                    { label: '/etc', path: '/etc' },
                    { label: '/tmp', path: '/tmp' },
                    { label: '/opt', path: '/opt' },
                  ].map((bm) => (
                    <button
                      key={bm.label}
                      type="button"
                      onClick={() => fetchScpDirectory(bm.path)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                        scpPath === bm.path
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {bm.label}
                    </button>
                  ))}

                  <input
                    type="text"
                    value={scpFilter}
                    onChange={(e) => setScpFilter(e.target.value)}
                    placeholder="Filter files..."
                    className="w-32 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2 py-1 text-[10px] text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {scpNewFolderPrompt && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={scpNewFolderName}
                      onChange={(e) => setScpNewFolderName(e.target.value)}
                      placeholder="New folder name (e.g. backups)"
                      className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      disabled={scpActionBusy === 'mkdir'}
                      onClick={handleCreateScpFolder}
                      className="px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                    >
                      {scpActionBusy === 'mkdir'
                        ? 'Creating...'
                        : 'Create Folder'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScpNewFolderPrompt(false)}
                      className="px-2 py-1 rounded-md text-zinc-400 hover:text-white text-[10px]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Multi-Select Batch Operations Bar */}
              {scpSelectedPaths.length > 0 && (
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/35 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold">
                      {scpSelectedPaths.length} Selected
                    </span>
                    <span className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold">
                      Batch SCP / SFTP Operations:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      disabled={Boolean(scpActionBusy)}
                      onClick={() =>
                        handleDownloadScpTarGz(
                          scpSelectedPaths,
                          `${(activeVm || focusedVm)?.name}-selected-${
                            scpSelectedPaths.length
                          }.tar.gz`
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download Selected (.tar.gz)</span>
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(scpActionBusy)}
                      onClick={() => handleCompressScpOnVm(scpSelectedPaths)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      <span>📦 Compress on VM (.tar.gz)</span>
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(scpActionBusy)}
                      onClick={handleBatchDeleteScpEntries}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-500 text-white text-[10px] font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete ({scpSelectedPaths.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScpSelectedPaths([])}
                      className="px-2 py-1 text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Live Multi-Stage SCP / SFTP Upload & Download Progress Bar + SHA-256 Verification */}
              {scpTransferProgress && (
                <div
                  className={`rounded-xl border p-3 space-y-2 transition-all shadow-sm ${
                    scpTransferProgress.completed
                      ? 'bg-emerald-500/10 border-emerald-500/40'
                      : scpTransferProgress.direction === 'DOWNLOAD'
                      ? 'bg-blue-500/10 border-blue-500/40'
                      : 'bg-emerald-500/10 border-emerald-500/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                          scpTransferProgress.completed
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : scpTransferProgress.direction === 'DOWNLOAD'
                            ? 'bg-blue-600 text-white border-blue-500'
                            : 'bg-emerald-600 text-white border-emerald-500'
                        }`}
                      >
                        {scpTransferProgress.direction === 'DOWNLOAD' ? (
                          <Download
                            className={`w-3 h-3 ${
                              !scpTransferProgress.completed
                                ? 'animate-bounce'
                                : ''
                            }`}
                          />
                        ) : (
                          <Upload
                            className={`w-3 h-3 ${
                              !scpTransferProgress.completed
                                ? 'animate-bounce'
                                : ''
                            }`}
                          />
                        )}
                        <span>
                          {scpTransferProgress.direction === 'DOWNLOAD'
                            ? 'SCP / SFTP Download'
                            : scpTransferProgress.direction === 'UPLOAD'
                            ? 'SCP / SFTP Upload'
                            : scpTransferProgress.direction === 'SAVE'
                            ? 'SCP Remote Write'
                            : 'SCP Remote Read'}
                        </span>
                      </span>

                      <span className="text-xs font-extrabold text-zinc-900 dark:text-white truncate max-w-[260px] sm:max-w-[360px]">
                        {scpTransferProgress.fileName}
                      </span>

                      {scpTransferProgress.engine && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-900/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-300">
                          {scpTransferProgress.engine === 'SSH2_SFTP_DIRECT'
                            ? 'SSH2 SFTP (:22)'
                            : String(scpTransferProgress.engine).includes('IAP')
                            ? 'gcloud SCP / IAP Tunnel'
                            : 'gcloud compute scp'}
                        </span>
                      )}

                      {scpTransferProgress.sha256 && (
                        <span
                          className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                          title={`Verified SHA-256 Digest: ${scpTransferProgress.sha256}`}
                        >
                          🔒 SHA-256: {scpTransferProgress.sha256.slice(0, 12)}…
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 text-[11px] font-mono">
                      {scpTransferProgress.totalBytes > 0 && (
                        <span className="text-zinc-600 dark:text-zinc-300 font-bold">
                          {formatBytes(scpTransferProgress.loadedBytes)} /{' '}
                          {formatBytes(scpTransferProgress.totalBytes)}
                        </span>
                      )}
                      {scpTransferProgress.speedBps > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-900/10 dark:bg-white/10 text-zinc-700 dark:text-zinc-200 font-bold text-[10px]">
                          {formatBytes(scpTransferProgress.speedBps)}/s
                        </span>
                      )}
                      <span
                        className={`text-sm font-extrabold ${
                          scpTransferProgress.completed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : scpTransferProgress.direction === 'DOWNLOAD'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {scpTransferProgress.percent}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="w-full h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-200 ${
                        scpTransferProgress.completed
                          ? 'bg-emerald-500'
                          : scpTransferProgress.direction === 'DOWNLOAD'
                          ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 animate-pulse'
                          : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 animate-pulse'
                      }`}
                      style={{
                        width: `${Math.max(
                          4,
                          Math.min(
                            100,
                            Number(scpTransferProgress.percent || 0)
                          )
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-zinc-600 dark:text-zinc-400">
                    <span className="font-bold truncate">
                      {scpTransferProgress.stage}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[9px]">
                      <span
                        className={
                          scpTransferProgress.percent >= 5
                            ? 'text-emerald-500 font-bold'
                            : 'opacity-50'
                        }
                      >
                        ● 1. Buffer
                      </span>
                      <span>→</span>
                      <span
                        className={
                          scpTransferProgress.percent >= 35
                            ? 'text-emerald-500 font-bold'
                            : 'opacity-50'
                        }
                      >
                        ● 2. SFTP/IAP Stream
                      </span>
                      <span>→</span>
                      <span
                        className={
                          scpTransferProgress.percent >= 90
                            ? 'text-emerald-500 font-bold'
                            : 'opacity-50'
                        }
                      >
                        ● 3.{' '}
                        {scpTransferProgress.direction === 'DOWNLOAD'
                          ? 'Browser Save'
                          : 'VM Disk Write'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Transfer History & SHA-256 Audit Ledger Drawer */}
              {showScpHistory && (
                <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-zinc-900 dark:text-white">
                      📊 Session SCP / SFTP Transfer &amp; SHA-256 Checksum
                      Ledger
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowScpHistory(false)}
                      className="text-zinc-400 hover:text-white text-[10px]"
                    >
                      ✕ Close
                    </button>
                  </div>
                  {scpTransferHistory.length === 0 ? (
                    <div className="text-zinc-500 text-[10px] py-2">
                      No file transfers recorded yet in this session — upload or
                      download any file/folder to see its speed and SHA-256
                      receipt.
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
                      {scpTransferHistory.map((h) => (
                        <div
                          key={h.id}
                          className="py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded font-extrabold ${
                                h.direction.includes('UPLOAD') ||
                                h.direction === 'SAVE'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {h.direction}
                            </span>
                            <span className="font-bold text-zinc-900 dark:text-white truncate max-w-[220px]">
                              {h.fileName}
                            </span>
                            <span className="text-zinc-500">
                              ({formatBytes(h.sizeBytes)} ·{' '}
                              {formatBytes(h.speedBps)}/s)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {h.sha256 && (
                              <button
                                type="button"
                                onClick={() =>
                                  navigator.clipboard?.writeText(h.sha256)
                                }
                                className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-emerald-500 font-mono cursor-pointer"
                                title={`Click to copy full SHA-256: ${h.sha256}`}
                              >
                                SHA256: {h.sha256.slice(0, 10)}…
                              </button>
                            )}
                            <span className="text-zinc-400">{h.timestamp}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inline Remote Checksum / Chmod / Rename Popovers */}
              {scpChecksumResult && (
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-extrabold text-emerald-600 dark:text-emerald-300">
                      🔒 Remote File Integrity ({scpChecksumResult.name} ·{' '}
                      {formatBytes(scpChecksumResult.sizeBytes)} ·{' '}
                      {scpChecksumResult.lineCount} lines)
                    </div>
                    <div className="font-mono text-zinc-700 dark:text-zinc-300 truncate">
                      SHA-256: {scpChecksumResult.sha256} | MD5:{' '}
                      {scpChecksumResult.md5}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          scpChecksumResult.sha256
                        );
                        setCopiedShaPath(scpChecksumResult.path);
                        setTimeout(() => setCopiedShaPath(''), 1800);
                      }}
                      className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                    >
                      {copiedShaPath === scpChecksumResult.path
                        ? '✓ Copied SHA-256'
                        : 'Copy SHA-256'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScpChecksumResult(null)}
                      className="px-2 py-1 text-zinc-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {scpChmodTarget && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <span className="font-bold text-amber-600 dark:text-amber-300">
                    chmod Permissions for &quot;{scpChmodTarget.name}&quot;
                    (current: {scpChmodTarget.modeOctal}):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { oct: '644', label: '644 (rw-r--r--)' },
                      { oct: '755', label: '755 (rwxr-xr-x +x)' },
                      { oct: '600', label: '600 (rw------- Private)' },
                      { oct: '777', label: '777 (rwxrwxrwx)' },
                    ].map((preset) => (
                      <button
                        key={preset.oct}
                        type="button"
                        onClick={() =>
                          handleChmodScpEntry(scpChmodTarget.path, preset.oct)
                        }
                        className={`px-2 py-1 rounded font-bold cursor-pointer ${
                          scpChmodTarget.modeOctal === preset.oct
                            ? 'bg-amber-600 text-white'
                            : 'bg-white dark:bg-zinc-900 border border-amber-500/30 text-zinc-800 dark:text-zinc-200 hover:bg-amber-500/20'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setScpChmodTarget(null)}
                      className="px-2 py-1 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {scpRenameTarget && (
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-2.5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <span className="font-bold text-blue-600 dark:text-blue-300">
                    Rename &quot;{scpRenameTarget.name}&quot;:
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 max-w-md">
                    <input
                      type="text"
                      value={scpRenameTarget.newName}
                      onChange={(e) =>
                        setScpRenameTarget((prev) => ({
                          ...prev,
                          newName: e.target.value,
                        }))
                      }
                      className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleRenameScpEntry}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold cursor-pointer"
                    >
                      Apply Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setScpRenameTarget(null)}
                      className="px-2 py-1 text-zinc-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {scpError && !isFocusedVmRunning && onVmPowerAction && focusedVm && (
                <div className="p-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-[11px] flex items-center justify-between gap-2">
                  <span>
                    VM &ldquo;{focusedVm.name}&rdquo; is currently stopped — start it to browse files via SCP/SFTP.
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTriggerVmPower('START', false)}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold cursor-pointer"
                    >
                      Start VM Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setRawScpError('')}
                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer"
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                </div>
              )}

              {!onShowToast && (identityToast || scpStatusMsg) && (
                <div className="fixed bottom-5 right-5 z-[120] max-w-md bg-zinc-950/95 border border-emerald-500/60 text-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-mono shadow-2xl backdrop-blur-md">
                  <span>✓ {scpStatusMsg || identityToast}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setRawIdentityToast('');
                      setRawScpStatusMsg('');
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 text-[10px] font-bold cursor-pointer shrink-0"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              )}

              {/* In-Place Remote File Editor / Viewer Drawer */}
              {scpEditorFile ? (
                <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-zinc-900/90 border border-blue-500/40 rounded-xl p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                      {scpEditorFile.isNew ? (
                        <input
                          type="text"
                          value={scpEditorFile.path}
                          onChange={(e) =>
                            setScpEditorFile((prev) => ({
                              ...prev,
                              path: e.target.value,
                              fileName:
                                e.target.value.split('/').pop() ||
                                'new-file.txt',
                            }))
                          }
                          className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-white"
                        />
                      ) : (
                        <span className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">
                          {scpEditorFile.path} (
                          {formatBytes(scpEditorFile.sizeBytes)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!scpEditorFile.isBinary && !scpEditorFile.isTailMode && (
                        <button
                          type="button"
                          disabled={scpActionBusy === 'save-file'}
                          onClick={handleSaveScpEditorFile}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold cursor-pointer disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          <span>
                            {scpActionBusy === 'save-file'
                              ? 'Saving via SCP...'
                              : 'Save to VM via SCP/SFTP'}
                          </span>
                        </button>
                      )}
                      {scpEditorFile.isTailMode && (
                        <button
                          type="button"
                          onClick={() =>
                            handleTailScpLogFile(
                              {
                                path: scpEditorFile.path,
                                name: scpEditorFile.fileName,
                                sizeBytes: scpEditorFile.sizeBytes,
                              },
                              200
                            )
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Refresh Tail (200 lines)</span>
                        </button>
                      )}
                      {!scpEditorFile.isNew && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadScpFileRaw({
                              path: scpEditorFile.path,
                              name: scpEditorFile.path.split('/').pop(),
                              sizeBytes: scpEditorFile.sizeBytes,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download to Laptop</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setScpEditorFile(null)}
                        className="px-2.5 py-1 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold cursor-pointer"
                      >
                        ✕ Close Editor
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={viewMode === 'SPLIT_SSH_AND_SCP' ? 9 : 15}
                    readOnly={scpEditorFile.isBinary}
                    value={scpEditorFile.content}
                    onChange={(e) =>
                      setScpEditorFile((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="w-full flex-1 bg-white dark:bg-[#050507] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-900 dark:text-emerald-300 focus:outline-none focus:border-emerald-500 min-h-[200px]"
                  />
                </div>
              ) : (
                /* Directory Entries Table */
                <div
                  className={`flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col ${
                    viewMode === 'SPLIT_SSH_AND_SCP'
                      ? 'min-h-[220px] max-h-[300px]'
                      : 'min-h-[300px] max-h-[440px]'
                  }`}
                >
                  <div className="bg-zinc-100 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 px-3 py-1.5 grid grid-cols-12 gap-2 items-center text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                    <div className="col-span-5 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={
                          scpEntries.length > 0 &&
                          scpSelectedPaths.length === scpEntries.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setScpSelectedPaths(scpEntries.map((x) => x.path));
                          } else {
                            setScpSelectedPaths([]);
                          }
                        }}
                        className="rounded border-zinc-400 cursor-pointer"
                        title="Select all files & folders in directory"
                      />
                      <span>Name (Drag &amp; Drop Files Here)</span>
                    </div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Mode / Owner</div>
                    <div className="col-span-3 text-right">
                      10X SCP / SFTP Actions
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/70 bg-white dark:bg-[#070709]">
                    {scpLoading ? (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        Connecting to {(activeVm || focusedVm)?.name} over
                        SCP/SFTP...
                      </div>
                    ) : scpEntries.length === 0 ? (
                      <div className="p-8 text-center text-xs text-zinc-500">
                        Directory is empty — drag &amp; drop files here or click{' '}
                        <strong>+ Upload File(s)</strong> above.
                      </div>
                    ) : (
                      scpEntries
                        .filter((item) =>
                          !scpFilter.trim()
                            ? true
                            : item.name
                                .toLowerCase()
                                .includes(scpFilter.trim().toLowerCase())
                        )
                        .map((entry) => {
                          const isDir = entry.type === 'dir';
                          const isChecked = scpSelectedPaths.includes(
                            entry.path
                          );
                          const isArchive =
                            !isDir &&
                            /\.(tar\.gz|tgz|tar|zip)$/i.test(entry.name);
                          const isLogOrText =
                            !isDir &&
                            (/\.(log|out|err|txt|json|yaml|yml|conf|ini)$/i.test(
                              entry.name
                            ) ||
                              scpPath.startsWith('/var/log'));
                          const isScript =
                            !isDir && /\.(sh|py|bash)$/i.test(entry.name);

                          // Row-level active operation states
                          const isRowDeleting =
                            scpActionBusy === `del:${entry.path}` ||
                            (scpActionBusy === 'batch-delete' && isChecked);
                          const isRowHashing =
                            scpActionBusy === `sha:${entry.path}`;
                          const isRowDownloading =
                            scpActionBusy === `download:${entry.path}`;
                          const isRowArchiving =
                            scpActionBusy === `tar:${entry.path}` ||
                            ((scpActionBusy === 'batch-tar' ||
                              scpActionBusy === 'compress') &&
                              isChecked);
                          const isRowExtracting =
                            scpActionBusy === `extract:${entry.path}`;
                          const isRowChmodding =
                            scpActionBusy === `chmod:${entry.path}`;
                          const isRowRenaming =
                            scpActionBusy === `rename:${entry.path}`;
                          const isRowReading =
                            scpActionBusy === `preview:${entry.path}` ||
                            scpActionBusy === `tail:${entry.path}`;
                          const isRowBusy =
                            isRowDeleting ||
                            isRowHashing ||
                            isRowDownloading ||
                            isRowArchiving ||
                            isRowExtracting ||
                            isRowChmodding ||
                            isRowRenaming ||
                            isRowReading;
                          const isPendingDeleteConfirm =
                            scpConfirmDeletePath === entry.path &&
                            !isRowDeleting;
                          const hasVerifiedChecksum =
                            scpChecksumResult?.path === entry.path &&
                            !isRowHashing;

                          const rowStatusLabel = isRowDeleting
                            ? 'Deleting from VM...'
                            : isRowHashing
                            ? 'Computing SHA-256 & MD5...'
                            : isRowExtracting
                            ? 'Extracting archive...'
                            : isRowArchiving
                            ? 'Compressing .tar.gz...'
                            : isRowDownloading
                            ? `Downloading${
                                scpTransferProgress?.percent
                                  ? ` (${scpTransferProgress.percent}%)`
                                  : '...'
                              }`
                            : isRowChmodding
                            ? 'Applying chmod...'
                            : isRowRenaming
                            ? 'Renaming...'
                            : isRowReading
                            ? 'Reading file...'
                            : '';

                          return (
                            <div
                              key={entry.path}
                              aria-busy={isRowBusy}
                              className={`relative overflow-hidden px-3 py-2 grid grid-cols-12 gap-2 items-center transition-all duration-200 text-xs ${
                                isRowDeleting
                                  ? 'bg-red-500/15 dark:bg-red-950/35 ring-1 ring-inset ring-red-500/40 opacity-65 select-none pointer-events-none'
                                  : isRowHashing
                                  ? 'bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-inset ring-emerald-500/40 opacity-80 select-none pointer-events-none'
                                  : isRowBusy
                                  ? 'bg-blue-500/10 dark:bg-blue-950/25 ring-1 ring-inset ring-blue-500/35 opacity-80 select-none pointer-events-none'
                                  : isPendingDeleteConfirm
                                  ? 'bg-red-500/10 dark:bg-red-950/25 ring-1 ring-inset ring-red-500/35'
                                  : hasVerifiedChecksum
                                  ? 'bg-emerald-500/5 ring-1 ring-inset ring-emerald-500/25 hover:bg-emerald-500/10'
                                  : isChecked
                                  ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
                                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                              }`}
                            >
                              {/* Animated Top Progress Strip when a file/folder operation is running on this row */}
                              {isRowBusy && (
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                                  <div
                                    className={`h-full w-full animate-pulse ${
                                      isRowDeleting
                                        ? 'bg-gradient-to-r from-red-500 via-rose-400 to-amber-500'
                                        : isRowHashing
                                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400'
                                        : 'bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400'
                                    }`}
                                  />
                                </div>
                              )}

                              <div className="col-span-5 flex items-center gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  disabled={isRowBusy}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setScpSelectedPaths((prev) => [
                                        ...prev,
                                        entry.path,
                                      ]);
                                    } else {
                                      setScpSelectedPaths((prev) =>
                                        prev.filter((p) => p !== entry.path)
                                      );
                                    }
                                  }}
                                  className="rounded border-zinc-400 cursor-pointer shrink-0 disabled:opacity-40"
                                />
                                {isRowBusy ? (
                                  <RefreshCw
                                    className={`w-4 h-4 shrink-0 animate-spin ${
                                      isRowDeleting
                                        ? 'text-red-400'
                                        : isRowHashing
                                        ? 'text-emerald-400'
                                        : 'text-blue-400'
                                    }`}
                                  />
                                ) : isDir ? (
                                  <Folder className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                                ) : (
                                  <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                                )}
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={() =>
                                    isDir
                                      ? fetchScpDirectory(entry.path)
                                      : handleOpenScpFilePreview(entry)
                                  }
                                  className={`truncate text-left font-bold hover:underline cursor-pointer disabled:no-underline ${
                                    isRowDeleting
                                      ? 'line-through text-red-500 dark:text-red-400'
                                      : isDir
                                      ? 'text-amber-600 dark:text-amber-300'
                                      : 'text-zinc-900 dark:text-zinc-100'
                                  }`}
                                  title={entry.path}
                                >
                                  {entry.name}
                                  {isDir ? '/' : ''}
                                </button>

                                {/* Inline Live Operation Status Badge on the File Row */}
                                {rowStatusLabel && (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 border animate-pulse ${
                                      isRowDeleting
                                        ? 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40'
                                        : isRowHashing
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                                        : 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/40'
                                    }`}
                                  >
                                    {rowStatusLabel}
                                  </span>
                                )}

                                {/* Pending Delete Confirmation Warning Pill */}
                                {isPendingDeleteConfirm && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold shrink-0 bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40">
                                    ⚠️ Confirm delete?
                                  </span>
                                )}

                                {/* Verified SHA-256 Digest Badge directly on the File Row */}
                                {hasVerifiedChecksum &&
                                  scpChecksumResult?.sha256 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard?.writeText(
                                          scpChecksumResult.sha256
                                        );
                                        setCopiedShaPath(entry.path);
                                        setTimeout(
                                          () => setCopiedShaPath(''),
                                          1800
                                        );
                                      }}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold shrink-0 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 border border-emerald-500/35 cursor-pointer"
                                      title={`Verified SHA-256: ${scpChecksumResult.sha256} (click to copy)`}
                                    >
                                      {copiedShaPath === entry.path
                                        ? '✓ Copied SHA-256!'
                                        : `🔒 SHA-256: ${scpChecksumResult.sha256.slice(
                                            0,
                                            8
                                          )}…`}
                                    </button>
                                  )}
                              </div>

                              <div className="col-span-2 text-[11px] text-zinc-500">
                                {isDir ? 'DIR' : formatBytes(entry.sizeBytes)}
                              </div>

                              <div className="col-span-2 text-[10px] text-zinc-500 truncate">
                                <button
                                  type="button"
                                  disabled={isRowBusy}
                                  onClick={() =>
                                    setScpChmodTarget({
                                      path: entry.path,
                                      name: entry.name,
                                      modeOctal: entry.modeOctal || '644',
                                    })
                                  }
                                  className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-amber-500/20 hover:text-amber-400 border border-zinc-200 dark:border-zinc-800 font-mono cursor-pointer disabled:opacity-40"
                                  title="Click to change permissions (chmod 644 / 755 / 600 / 777)"
                                >
                                  {isRowChmodding
                                    ? 'chmod...'
                                    : `${entry.modeOctal || '644'} · ${
                                        entry.owner
                                      }`}
                                </button>
                              </div>

                              <div className="col-span-3 flex items-center justify-end gap-1 flex-wrap">
                                {isPendingDeleteConfirm ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isRowDeleting}
                                      onClick={() =>
                                        handleDeleteScpEntry(entry.path)
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
                                      title={`Permanently delete ${entry.name} from VM`}
                                    >
                                      <Trash2 className="w-2.5 h-2.5" />
                                      <span>Confirm Delete</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setScpConfirmDeletePath(null)
                                      }
                                      className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : isRowDeleting ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-red-600/80 text-white text-[10px] font-extrabold">
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    <span>Deleting...</span>
                                  </span>
                                ) : (
                                  <>
                                    {isDir ? (
                                      <>
                                        <button
                                          type="button"
                                          disabled={isRowBusy}
                                          onClick={() =>
                                            fetchScpDirectory(entry.path)
                                          }
                                          className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                        >
                                          Open
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isRowBusy}
                                          onClick={() =>
                                            handleDownloadScpTarGz(
                                              entry.path,
                                              `${entry.name}.tar.gz`
                                            )
                                          }
                                          className="px-2 py-0.5 rounded bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                          title={`Compress folder "${entry.name}" on VM and download as .tar.gz with progress bar`}
                                        >
                                          {isRowArchiving
                                            ? `${
                                                scpTransferProgress?.percent
                                                  ? `${scpTransferProgress.percent}%`
                                                  : 'Compressing...'
                                              }`
                                            : '📦 .tar.gz'}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isRowBusy}
                                          onClick={() => {
                                            if (
                                              viewMode !== 'SPLIT_SSH_AND_SCP'
                                            ) {
                                              setViewMode('LIVE_SSH_PTY');
                                            }
                                            if (
                                              !isSessionEnabled &&
                                              onSelectVm &&
                                              focusedVm
                                            ) {
                                              onSelectVm(focusedVm);
                                            }
                                            setTimeout(
                                              () =>
                                                sendToPty(
                                                  `cd "${entry.path}" && ls -la\r`
                                                ),
                                              350
                                            );
                                          }}
                                          className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                          title="cd into this folder inside the live Xterm.js SSH terminal"
                                        >
                                          cd in SSH
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          disabled={isRowBusy}
                                          onClick={() =>
                                            handleOpenScpFilePreview(entry)
                                          }
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                          title="View or edit file in-place via SCP/SFTP"
                                        >
                                          <Edit3 className="w-2.5 h-2.5" />
                                          <span>
                                            {scpActionBusy ===
                                            `preview:${entry.path}`
                                              ? 'Opening...'
                                              : 'Edit'}
                                          </span>
                                        </button>

                                        {isLogOrText && (
                                          <button
                                            type="button"
                                            disabled={isRowBusy}
                                            onClick={() =>
                                              handleTailScpLogFile(entry, 150)
                                            }
                                            className="px-1.5 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                            title="Tail last 150 lines of this log/text file"
                                          >
                                            {scpActionBusy ===
                                            `tail:${entry.path}`
                                              ? 'Tailing...'
                                              : 'Tail'}
                                          </button>
                                        )}

                                        {isArchive && (
                                          <button
                                            type="button"
                                            disabled={isRowBusy}
                                            onClick={() =>
                                              handleExtractScpArchive(entry)
                                            }
                                            className="px-1.5 py-0.5 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                            title={`Extract archive "${entry.name}" directly on VM`}
                                          >
                                            {isRowExtracting
                                              ? 'Extracting...'
                                              : 'Extract'}
                                          </button>
                                        )}

                                        {isScript && (
                                          <button
                                            type="button"
                                            disabled={isRowBusy}
                                            onClick={() => {
                                              if (
                                                viewMode !== 'SPLIT_SSH_AND_SCP'
                                              ) {
                                                setViewMode('LIVE_SSH_PTY');
                                              }
                                              if (
                                                !isSessionEnabled &&
                                                onSelectVm &&
                                                focusedVm
                                              ) {
                                                onSelectVm(focusedVm);
                                              }
                                              const runner =
                                                entry.name.endsWith('.py')
                                                  ? 'python3'
                                                  : 'bash';
                                              setTimeout(
                                                () =>
                                                  sendToPty(
                                                    `${runner} "${entry.path}"\r`
                                                  ),
                                                350
                                              );
                                            }}
                                            className="px-1.5 py-0.5 rounded bg-teal-500/15 hover:bg-teal-500/25 text-teal-600 dark:text-teal-300 border border-teal-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                                            title="Execute script inside the live SSH terminal"
                                          >
                                            ▶ Run
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          disabled={isRowBusy}
                                          onClick={() =>
                                            handleDownloadScpFileRaw(entry)
                                          }
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer disabled:opacity-60"
                                          title="Download file to your laptop via SCP/SFTP with live progress & SHA-256 verification"
                                        >
                                          <Download
                                            className={`w-2.5 h-2.5 ${
                                              isRowDownloading
                                                ? 'animate-bounce'
                                                : ''
                                            }`}
                                          />
                                          <span>
                                            {isRowDownloading
                                              ? `${
                                                  scpTransferProgress?.percent
                                                    ? `${scpTransferProgress.percent}%`
                                                    : '...'
                                                }`
                                              : 'Download'}
                                          </span>
                                        </button>

                                        <button
                                          type="button"
                                          disabled={isRowBusy}
                                          onClick={() =>
                                            handleInspectScpChecksum(entry)
                                          }
                                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer disabled:opacity-70 ${
                                            isRowHashing
                                              ? 'bg-emerald-600 text-white'
                                              : hasVerifiedChecksum
                                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40'
                                              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/20 text-zinc-500 hover:text-emerald-400'
                                          }`}
                                          title="Verify remote SHA-256 & MD5 checksum on VM"
                                        >
                                          {isRowHashing ? (
                                            <>
                                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                              <span>Hashing...</span>
                                            </>
                                          ) : hasVerifiedChecksum ? (
                                            '✓ SHA'
                                          ) : (
                                            'SHA'
                                          )}
                                        </button>
                                      </>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isRowBusy}
                                      onClick={() =>
                                        setScpRenameTarget({
                                          path: entry.path,
                                          name: entry.name,
                                          newName: entry.name,
                                        })
                                      }
                                      className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-500/20 text-zinc-500 hover:text-blue-400 text-[9px] font-bold cursor-pointer disabled:opacity-40"
                                      title={`Rename ${entry.name}`}
                                    >
                                      {isRowRenaming ? 'mv...' : 'mv'}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isRowBusy}
                                      onClick={() =>
                                        setScpConfirmDeletePath(entry.path)
                                      }
                                      className="p-1 rounded hover:bg-red-500/20 text-zinc-400 hover:text-red-400 cursor-pointer disabled:opacity-40"
                                      title={`Delete ${entry.name}`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* Copy-Ready gcloud compute scp CLI Commands Bar */}
              {(scpCliUpload || scpCliDownload) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 pt-0.5">
                  {scpCliUpload && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                      <code className="text-[10px] text-zinc-600 dark:text-zinc-300 truncate">
                        $ {scpCliUpload}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(scpCliUpload);
                          setCopiedScpCli('up');
                          setTimeout(() => setCopiedScpCli(''), 1500);
                        }}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 shrink-0 cursor-pointer"
                      >
                        {copiedScpCli === 'up' ? '✓ Copied' : 'Copy Upload SCP'}
                      </button>
                    </div>
                  )}
                  {scpCliDownload && (
                    <div className="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                      <code className="text-[10px] text-zinc-600 dark:text-zinc-300 truncate">
                        $ {scpCliDownload}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(scpCliDownload);
                          setCopiedScpCli('down');
                          setTimeout(() => setCopiedScpCli(''), 1500);
                        }}
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 shrink-0 cursor-pointer"
                      >
                        {copiedScpCli === 'down'
                          ? '✓ Copied'
                          : 'Copy Download SCP'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        {viewMode === 'SERIAL_PORT_1' && (
          <div className="p-4 space-y-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                Compute Engine Serial Port 1 Output (
                {(activeVm || focusedVm)?.name || 'VM'})
              </div>
              <button
                type="button"
                disabled={serialLoading}
                onClick={() =>
                  onFetchSerialConsole &&
                  onFetchSerialConsole(activeVm || focusedVm)
                }
                className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                {serialLoading ? 'Fetching...' : 'Refresh Serial Port 1'}
              </button>
            </div>
            <pre className="flex-1 bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap break-words overflow-y-auto min-h-[380px] max-h-[520px]">
              {serialConsoleOutput ||
                'Click "Refresh Serial Port 1" to read live kernel & systemd boot logs directly from the Compute Engine REST API without requiring port 22.'}
            </pre>
          </div>
        )}

        {!isSessionEnabled &&
          (viewMode === 'LIVE_SSH_PTY' || viewMode === 'SPLIT_SSH_AND_SCP') && (
            <div className="p-5 sm:p-6 flex-1 flex flex-col items-center justify-center text-center min-h-[390px] bg-white dark:bg-[#070709] font-mono">
              {!isCloudRun && focusedVm ? (
                <div className="w-full max-w-4xl rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-zinc-900/50 p-5 sm:p-6 space-y-4 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5 text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
                          isFocusedVmRunning
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        <Server className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base font-extrabold text-zinc-900 dark:text-white truncate">
                          {focusedVm.name}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {focusedVm.zone} · {focusedVm.machineType} ·{' '}
                          {focusedVm.osImage || 'Linux VM'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold">
                        {identityInfo?.osLoginEnabled
                          ? 'Auth: GCP IAM OS Login'
                          : 'Auth: Metadata SSH Keys'}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${
                          isFocusedVmTransitional
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                            : isFocusedVmRunning
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border-red-500/30'
                        }`}
                      >
                        {focusedVmEffectiveStatus}
                      </span>
                    </div>
                  </div>

                  {/* Adaptive 4-Column VM Telemetry Strip inside the Wide Launchpad Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[9px] uppercase text-zinc-400">
                        External NAT IP
                      </div>
                      <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                        {focusedVm.externalIp && focusedVm.externalIp !== 'None'
                          ? focusedVm.externalIp
                          : 'None (IAP Tunnel)'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[9px] uppercase text-zinc-400">
                        Internal VPC IP
                      </div>
                      <div className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                        {focusedVm.internalIp || '10.128.0.x'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[9px] uppercase text-zinc-400">
                        Boot Disk &amp; OS
                      </div>
                      <div className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                        {focusedVm.diskSizeGb || 10} GB ·{' '}
                        {focusedVm.diskType || 'pd-balanced'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[9px] uppercase text-zinc-400">
                        Selected SSH Target
                      </div>
                      <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                        {customUsername}@{focusedVm.name}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Target Linux User &amp; Home Directory (1-Click Switch):
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                      {(
                        identityInfo?.candidateUsers || [
                          {
                            username:
                              customUsername || defaultUsername || 'ubuntu',
                            label: `${
                              customUsername || defaultUsername || 'ubuntu'
                            }`,
                            homeDir: `/home/${
                              customUsername || defaultUsername || 'ubuntu'
                            }`,
                            requiresMode: 'METADATA_SSH',
                          },
                        ]
                      ).map((cand) => {
                        const isSelected = customUsername === cand.username;
                        return (
                          <button
                            key={cand.username}
                            type="button"
                            disabled={identityBusy}
                            onClick={() => handleSelectSshUserProfile(cand)}
                            className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 shadow-sm'
                                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700'
                            }`}
                          >
                            <div className="text-xs font-extrabold truncate">
                              {cand.username}
                            </div>
                            <div className="text-[10px] opacity-75 truncate mt-0.5">
                              {cand.homeDir}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct VM Start/Stop & SSH / SCP Launch Buttons inside Xterm Canvas */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {isFocusedVmRunning ? (
                      <>
                        <button
                          type="button"
                          onClick={() => onSelectVm && onSelectVm(focusedVm)}
                          className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>
                            Connect SSH as {customUsername}@{focusedVm.name}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setViewMode('SCP_FILE_MANAGER');
                            fetchScpDirectory(scpPath || '~');
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                          title="Open Visual SCP / SFTP Remote File Browser, Uploader & In-Place Editor"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span>SCP / SFTP Files</span>
                        </button>

                        {onVmPowerAction && (
                          <button
                            type="button"
                            disabled={isFocusedVmTransitional}
                            onClick={() => handleTriggerVmPower('STOP', false)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-md bg-red-500/15 hover:bg-red-600 text-red-600 dark:text-red-300 hover:text-white border border-red-500/30 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <Square className="w-3 h-3 fill-current" />
                            <span>Stop VM</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {onVmPowerAction && (
                          <button
                            type="button"
                            disabled={isFocusedVmTransitional}
                            onClick={() => handleTriggerVmPower('START', true)}
                            className="flex-1 min-w-[220px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>
                              {isFocusedVmTransitional
                                ? `Starting ${focusedVm.name}... (Auto-Connecting SSH)`
                                : `Start VM "${focusedVm.name}" & Connect SSH`}
                            </span>
                          </button>
                        )}

                        {onVmPowerAction && !isFocusedVmTransitional && (
                          <button
                            type="button"
                            onClick={() => handleTriggerVmPower('START', false)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Start VM Only</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Cross-Studio Modernization & Firewall Quick Bridges */}
                  {(onOpenMigrateVm || onSelectTab) && (
                    <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-wrap items-center justify-center gap-1.5">
                      {onOpenMigrateVm && (
                        <button
                          type="button"
                          onClick={() => onOpenMigrateVm(focusedVm)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/25 text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <Rocket className="w-3 h-3" />
                          <span>Modernize {focusedVm.name} → Cloud Run</span>
                        </button>
                      )}
                      {onSelectTab && (
                        <>
                          <button
                            type="button"
                            onClick={() => onSelectTab('VPC_NETWORKS')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            <Shield className="w-3 h-3 text-emerald-500" />
                            <span>VPC Firewall / IAP (0.0.0.0/0 ↔ IAP)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectTab('CLOUD_RUN')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            <span>Cloud Run Fleet</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-3 text-zinc-500">
                    <WifiOff className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 mb-1.5">
                    {isCloudRun
                      ? 'Select a Cloud Run Service to Open Container SSH'
                      : 'No Compute Engine VMs Found in Project'}
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                    {isCloudRun
                      ? 'Click "SSH / Container Shell" on any Cloud Run service card to open an interactive container terminal.'
                      : 'Provision a Compute Engine VM or switch Engine to "Local Bash Shell" above.'}
                  </p>
                </>
              )}
            </div>
          )}

        {/* Persistent Xterm.js SSH PTY Container (Stays mounted when session is enabled so switching to SCP/Serial never kills the shell!) */}
        {isSessionEnabled && (
          <div
            className={`p-3 space-y-2.5 flex-1 flex flex-col ${
              viewMode === 'LIVE_SSH_PTY' || viewMode === 'SPLIT_SSH_AND_SCP'
                ? ''
                : 'hidden'
            }`}
          >
            {/* CLI Copy Bar */}
            {displayCli && (
              <div className="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2">
                <code className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 truncate">
                  $ {displayCli}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(displayCli);
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
              {macrosToRender.map((m) => (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => sendToPty(m.cmd)}
                  className="text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-emerald-500/15 text-zinc-700 dark:text-zinc-300 hover:text-emerald-300 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
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
                className="text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded transition-colors cursor-pointer ml-auto"
              >
                Clear Screen
              </button>
            </div>

            {/* Real @xterm/xterm Interactive Terminal Canvas */}
            <div
              ref={containerRef}
              onClick={() => xtermRef.current?.focus()}
              className={`w-full flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#070709] p-1.5 overflow-hidden ${
                viewMode === 'SPLIT_SSH_AND_SCP'
                  ? 'min-h-[260px]'
                  : isExpanded
                  ? 'min-h-[540px]'
                  : 'min-h-[390px]'
              }`}
            />

            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
              <span>
                {isCloudRun
                  ? 'Real Cloud Run Interactive Container SSH (@xterm/xterm + gcloud beta run services ssh PTY)'
                  : 'Persistent Full-Duplex PTY (@xterm/xterm + WebSocket SSH2 / Linux pty.openpty) — stays connected while browsing SCP/SFTP files'}
              </span>
              <span>{connStatus.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
