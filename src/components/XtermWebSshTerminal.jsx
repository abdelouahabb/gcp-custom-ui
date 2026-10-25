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
}) {
  const isCloudRun = targetType === 'CLOUD_RUN';
  const containerRef = useRef(null);
  const xtermRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);

  const [viewMode, setViewMode] = useState('LIVE_SSH_PTY'); // 'LIVE_SSH_PTY' | 'SERIAL_PORT_1'
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
    () => sanitizeUsername(defaultUsername) || 'abdelouahab'
  );
  const [userManuallyPicked, setUserManuallyPicked] = useState(false);
  const [customPort, setCustomPort] = useState('22');
  const [customPassword, setCustomPassword] = useState('');
  const [customPrivateKey, setCustomPrivateKey] = useState('');
  const [reconnectNonce, setReconnectNonce] = useState(0);

  // GCP SSH Identity Mode (Standard Metadata SSH User vs IAM OS Login POSIX User)
  const [identityInfo, setIdentityInfo] = useState(null);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [identityToast, setIdentityToast] = useState('');

  // Visual SCP / SFTP Remote File Browser, Drag-and-Drop Uploader, Downloader & In-Place Editor State
  const scpFileInputRef = useRef(null);
  const [scpPath, setScpPath] = useState('~');
  const [scpPathInput, setScpPathInput] = useState('~');
  const [scpParentPath, setScpParentPath] = useState('/home');
  const [scpEntries, setScpEntries] = useState([]);
  const [scpEngineUsed, setScpEngineUsed] = useState('');
  const [scpCliUpload, setScpCliUpload] = useState('');
  const [scpCliDownload, setScpCliDownload] = useState('');
  const [scpLoading, setScpLoading] = useState(false);
  const [scpActionBusy, setScpActionBusy] = useState('');
  const [scpError, setScpError] = useState('');
  const [scpStatusMsg, setScpStatusMsg] = useState('');
  const [scpFilter, setScpFilter] = useState('');
  const [scpDragOver, setScpDragOver] = useState(false);
  const [scpEditorFile, setScpEditorFile] = useState(null); // { path, fileName, content, isBinary, sizeBytes, isNew }
  const [scpNewFolderPrompt, setScpNewFolderPrompt] = useState(false);
  const [scpNewFolderName, setScpNewFolderName] = useState('');
  const [scpConfirmDeletePath, setScpConfirmDeletePath] = useState(null);
  const [copiedScpCli, setCopiedScpCli] = useState('');

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
          : data.localOsUser || sanitizeUsername(defaultUsername) || 'abdelouahab';
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
    async (targetPath = scpPath) => {
      const targetVm = activeVm || focusedVm;
      if (isCloudRun || !projectId || !targetVm?.name) return;
      setScpLoading(true);
      setScpError('');
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/vms/${encodeURIComponent(targetVm.name)}/scp/list`,
          {
            params: {
              zone: targetVm.zone || 'us-central1-f',
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
        setScpLoading(false);
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
    if (viewMode === 'SCP_FILE_MANAGER' && (activeVm || focusedVm)) {
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
    setScpActionBusy(`preview:${entry.path}`);
    setScpError('');
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/download`,
        {
          params: {
            zone: targetVm.zone || 'us-central1-f',
            username: customUsername || defaultUsername || 'ubuntu',
            path: entry.path,
            mode: 'preview',
          },
        }
      );
      setScpEditorFile({
        path: res.data?.path || entry.path,
        fileName: res.data?.fileName || entry.name,
        content: res.data?.content || '',
        isBinary: Boolean(res.data?.isBinary),
        sizeBytes: res.data?.sizeBytes ?? entry.sizeBytes,
        isNew: false,
      });
    } catch (err) {
      setScpError(
        err.response?.data?.error ||
          err.message ||
          `Failed to read ${entry.name} via SCP/SFTP.`
      );
    } finally {
      setScpActionBusy('');
    }
  };

  const handleDownloadScpFileRaw = (entry) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !entry?.path) return;
    const qs = new URLSearchParams({
      zone: targetVm.zone || 'us-central1-f',
      username: customUsername || defaultUsername || 'ubuntu',
      path: entry.path,
      mode: 'raw',
    });
    const url = `/api/project/${encodeURIComponent(
      projectId
    )}/vms/${encodeURIComponent(targetVm.name)}/scp/download?${qs.toString()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleUploadScpFiles = async (fileList) => {
    const targetVm = activeVm || focusedVm;
    if (!targetVm || !fileList || fileList.length === 0) return;
    setScpActionBusy('upload');
    setScpError('');
    setScpStatusMsg(`Uploading ${fileList.length} file(s) via SCP/SFTP...`);
    try {
      const encodedFiles = await Promise.all(
        Array.from(fileList).map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
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

      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/upload`,
        {
          zone: targetVm.zone || 'us-central1-f',
          username: customUsername || defaultUsername || 'ubuntu',
          targetDir: scpPath || '~',
          files: encodedFiles,
        }
      );
      setScpStatusMsg(res.data?.message || 'SCP upload complete!');
      setTimeout(() => setScpStatusMsg(''), 5000);
      await fetchScpDirectory(scpPath);
    } catch (err) {
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
    setScpActionBusy('save-file');
    setScpError('');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          targetVm.name
        )}/scp/action`,
        {
          zone: targetVm.zone || 'us-central1-f',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'WRITE_FILE',
          targetPath: scpEditorFile.path,
          content: scpEditorFile.content,
        }
      );
      setScpStatusMsg(
        res.data?.message || `Saved ${scpEditorFile.fileName} to VM!`
      );
      setTimeout(() => setScpStatusMsg(''), 4500);
      setScpEditorFile(null);
      await fetchScpDirectory(scpPath);
    } catch (err) {
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
          zone: targetVm.zone || 'us-central1-f',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'MKDIR',
          targetPath: fullTarget,
        }
      );
      setScpNewFolderName('');
      setScpNewFolderPrompt(false);
      setScpStatusMsg(res.data?.message || `Created folder ${cleanName}`);
      setTimeout(() => setScpStatusMsg(''), 4000);
      await fetchScpDirectory(scpPath);
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
          zone: targetVm.zone || 'us-central1-f',
          username: customUsername || defaultUsername || 'ubuntu',
          action: 'DELETE',
          targetPath: entryPath,
        }
      );
      setScpConfirmDeletePath(null);
      setScpStatusMsg(res.data?.message || `Deleted ${entryPath}`);
      setTimeout(() => setScpStatusMsg(''), 4000);
      await fetchScpDirectory(scpPath);
    } catch (err) {
      setScpError(
        err.response?.data?.error || err.message || 'Failed to delete item.'
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

  // Only initialize XTerm.js & WebSocket when `isSessionEnabled` is true
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
    viewMode,
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
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md border ${
                    isFocusedVmTransitional
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                      : isFocusedVmRunning
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isFocusedVmTransitional
                        ? 'bg-amber-400'
                        : isFocusedVmRunning
                        ? 'bg-emerald-400'
                        : 'bg-rose-400'
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
                    title={`Stop VM "${focusedVm.name}" directly from Xterm.js`}
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop VM</span>
                  </button>

                  <button
                    type="button"
                    disabled={isFocusedVmTransitional}
                    onClick={() => handleTriggerVmPower('RESET', false)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
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
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
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
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
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
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
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
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-zinc-200/80 dark:bg-zinc-800 hover:bg-rose-600 text-zinc-700 dark:text-zinc-300 hover:text-white border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
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
          {!isCloudRun && focusedVm && (
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'SCP_FILE_MANAGER') {
                  setViewMode('LIVE_SSH_PTY');
                } else {
                  setViewMode('SCP_FILE_MANAGER');
                }
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold transition-colors cursor-pointer border ${
                viewMode === 'SCP_FILE_MANAGER'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              }`}
              title={`Open Visual SCP / SFTP File Browser, Drag-and-Drop Uploader, Downloader & In-Place Editor for ${
                (activeVm || focusedVm).name
              }`}
            >
              <FolderOpen className="w-3 h-3" />
              <span>
                {viewMode === 'SCP_FILE_MANAGER'
                  ? 'Back to SSH PTY'
                  : 'SCP / SFTP Files'}
              </span>
            </button>
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

          {!isCloudRun && (
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'SERIAL_PORT_1') {
                  setViewMode('LIVE_SSH_PTY');
                } else {
                  setViewMode('SERIAL_PORT_1');
                  if (focusedVm && onFetchSerialConsole) {
                    onFetchSerialConsole(focusedVm);
                  }
                }
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 border ${
                viewMode === 'SERIAL_PORT_1'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border-zinc-200 dark:border-zinc-800'
              }`}
              title="Toggle Compute Engine Serial Port 1 boot console logs"
            >
              <FileText className="w-3 h-3" />
              <span>
                {viewMode === 'SERIAL_PORT_1' ? 'Back to SSH PTY' : 'Serial Port 1'}
              </span>
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

      {identityToast && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3.5 py-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
          ✓ {identityToast}
        </div>
      )}

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
                placeholder="abdelouahab"
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

      {/* Main Content Area */}
      {viewMode === 'SCP_FILE_MANAGER' && !isCloudRun ? (
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
          className={`p-3.5 space-y-3 flex-1 flex flex-col font-mono bg-white dark:bg-[#09090c] relative ${
            scpDragOver
              ? 'ring-2 ring-emerald-500 bg-emerald-500/5'
              : ''
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

          {/* Top SCP / SFTP Control & Path Bar */}
          <div className="bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-zinc-900 dark:text-white">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    SCP / SFTP File Studio ({customUsername}@
                    {(activeVm || focusedVm)?.name})
                  </span>
                </span>
                {scpEngineUsed && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold border ${
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
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={Boolean(scpActionBusy)}
                  onClick={() => scpFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
                  title="Upload one or more files from your laptop to this VM directory (or drag-and-drop files anywhere)"
                >
                  <Upload className="w-3 h-3" />
                  <span>
                    {scpActionBusy === 'upload'
                      ? 'Uploading...'
                      : '+ Upload File(s)'}
                  </span>
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
                      content: '#!/usr/bin/env bash\nset -euo pipefail\n\n',
                      isBinary: false,
                      sizeBytes: 0,
                      isNew: true,
                    });
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ New File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScpNewFolderPrompt((v) => !v)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer"
                >
                  <Folder className="w-3 h-3 text-amber-400" />
                  <span>+ Folder</span>
                </button>

                <button
                  type="button"
                  disabled={scpLoading}
                  onClick={() => fetchScpDirectory(scpPath)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${scpLoading ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Path Navigation + Quick Bookmark Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => fetchScpDirectory(scpParentPath || '/')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer"
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
                className="flex-1 min-w-[200px] flex items-center gap-1"
              >
                <input
                  type="text"
                  value={scpPathInput}
                  onChange={(e) => setScpPathInput(e.target.value)}
                  placeholder="/home/abdelouahab"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold cursor-pointer shrink-0"
                >
                  Go
                </button>
              </form>

              {[
                { label: '~ Home', path: `/home/${customUsername || 'ubuntu'}` },
                { label: '/var/log', path: '/var/log' },
                { label: '/etc', path: '/etc' },
                { label: '/tmp', path: '/tmp' },
                { label: '/opt', path: '/opt' },
              ].map((bm) => (
                <button
                  key={bm.label}
                  type="button"
                  onClick={() => fetchScpDirectory(bm.path)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
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
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                >
                  {scpActionBusy === 'mkdir' ? 'Creating...' : 'Create Folder'}
                </button>
                <button
                  type="button"
                  onClick={() => setScpNewFolderPrompt(false)}
                  className="px-2 py-1 rounded-lg text-zinc-400 hover:text-white text-[10px]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {scpStatusMsg && (
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-[11px] font-bold">
              ✓ {scpStatusMsg}
            </div>
          )}

          {scpError && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-[11px] flex items-center justify-between gap-2">
              <span>✕ {scpError}</span>
              {!isFocusedVmRunning && onVmPowerAction && focusedVm && (
                <button
                  type="button"
                  onClick={() => handleTriggerVmPower('START', false)}
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-extrabold shrink-0 cursor-pointer"
                >
                  Start VM Now
                </button>
              )}
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
                            e.target.value.split('/').pop() || 'new-file.txt',
                        }))
                      }
                      className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs text-zinc-900 dark:text-white"
                    />
                  ) : (
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-white truncate">
                      {scpEditorFile.path} ({formatBytes(scpEditorFile.sizeBytes)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {!scpEditorFile.isBinary && (
                    <button
                      type="button"
                      disabled={scpActionBusy === 'save-file'}
                      onClick={handleSaveScpEditorFile}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      <span>
                        {scpActionBusy === 'save-file'
                          ? 'Saving via SCP...'
                          : 'Save to VM via SCP/SFTP'}
                      </span>
                    </button>
                  )}
                  {!scpEditorFile.isNew && (
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadScpFileRaw({
                          path: scpEditorFile.path,
                          name: scpEditorFile.fileName,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download to Laptop</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setScpEditorFile(null)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[11px] font-bold cursor-pointer"
                  >
                    ✕ Close Editor
                  </button>
                </div>
              </div>
              <textarea
                rows={15}
                readOnly={scpEditorFile.isBinary}
                value={scpEditorFile.content}
                onChange={(e) =>
                  setScpEditorFile((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                className="w-full flex-1 bg-white dark:bg-[#050507] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-900 dark:text-emerald-300 focus:outline-none focus:border-emerald-500 min-h-[280px]"
              />
            </div>
          ) : (
            /* Directory Entries Table */
            <div className="flex-1 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col min-h-[300px] max-h-[440px]">
              <div className="bg-zinc-100 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 px-3 py-1.5 grid grid-cols-12 gap-2 text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                <div className="col-span-5">Name (Drag &amp; Drop Files Here)</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Permissions / Owner</div>
                <div className="col-span-3 text-right">SCP / SFTP Actions</div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/70 bg-white dark:bg-[#070709]">
                {scpLoading ? (
                  <div className="p-8 text-center text-xs text-zinc-400">
                    Connecting to {(activeVm || focusedVm)?.name} over SCP/SFTP...
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
                      return (
                        <div
                          key={entry.path}
                          className="px-3 py-2 grid grid-cols-12 gap-2 items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/60 transition-colors text-xs"
                        >
                          <div className="col-span-5 flex items-center gap-2 min-w-0">
                            {isDir ? (
                              <Folder className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400/20" />
                            ) : (
                              <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                isDir
                                  ? fetchScpDirectory(entry.path)
                                  : handleOpenScpFilePreview(entry)
                              }
                              className={`truncate text-left font-bold hover:underline cursor-pointer ${
                                isDir
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : 'text-zinc-900 dark:text-zinc-100'
                              }`}
                              title={entry.path}
                            >
                              {entry.name}
                              {isDir ? '/' : ''}
                            </button>
                          </div>

                          <div className="col-span-2 text-[11px] text-zinc-500">
                            {isDir ? 'DIR' : formatBytes(entry.sizeBytes)}
                          </div>

                          <div className="col-span-2 text-[10px] text-zinc-500 truncate">
                            {entry.modeOctal || '644'} · {entry.owner}
                          </div>

                          <div className="col-span-3 flex items-center justify-end gap-1 flex-wrap">
                            {isDir ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => fetchScpDirectory(entry.path)}
                                  className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                                >
                                  Open
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewMode('LIVE_SSH_PTY');
                                    if (!isSessionEnabled && onSelectVm && focusedVm) {
                                      onSelectVm(focusedVm);
                                    }
                                    setTimeout(
                                      () => sendToPty(`cd "${entry.path}" && ls -la\r`),
                                      350
                                    );
                                  }}
                                  className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer"
                                  title="Open this folder inside the live Xterm.js SSH terminal"
                                >
                                  cd in SSH
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  disabled={
                                    scpActionBusy === `preview:${entry.path}`
                                  }
                                  onClick={() => handleOpenScpFilePreview(entry)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer"
                                  title="View or edit file in-place via SCP/SFTP"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                  <span>
                                    {scpActionBusy === `preview:${entry.path}`
                                      ? '...'
                                      : 'View/Edit'}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadScpFileRaw(entry)}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer"
                                  title="Download file to your laptop via SCP/SFTP"
                                >
                                  <Download className="w-2.5 h-2.5" />
                                  <span>Download</span>
                                </button>
                              </>
                            )}

                            {scpConfirmDeletePath === entry.path ? (
                              <button
                                type="button"
                                disabled={scpActionBusy === `del:${entry.path}`}
                                onClick={() => handleDeleteScpEntry(entry.path)}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-extrabold cursor-pointer"
                              >
                                Confirm
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setScpConfirmDeletePath(entry.path)}
                                className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 cursor-pointer"
                                title={`Delete ${entry.name}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
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
                    {copiedScpCli === 'down' ? '✓ Copied' : 'Copy Download SCP'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : viewMode === 'SERIAL_PORT_1' ? (
        <div className="p-4 space-y-3 flex-1 flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300 font-bold">
              Compute Engine Serial Port 1 Output ({(activeVm || focusedVm)?.name || 'VM'})
            </div>
            <button
              type="button"
              disabled={serialLoading}
              onClick={() => onFetchSerialConsole && onFetchSerialConsole(activeVm || focusedVm)}
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
      ) : !isSessionEnabled ? (
        <div className="p-6 flex-1 flex flex-col items-center justify-center text-center min-h-[390px] bg-white dark:bg-[#070709] font-mono">
          {!isCloudRun && focusedVm ? (
            <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800/90 bg-zinc-50/70 dark:bg-zinc-900/50 p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3 text-left">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                      isFocusedVmRunning
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    <Server className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-zinc-900 dark:text-white truncate">
                      {focusedVm.name}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {focusedVm.zone} · {focusedVm.machineType} ·{' '}
                      {focusedVm.externalIp && focusedVm.externalIp !== 'None'
                        ? focusedVm.externalIp
                        : focusedVm.internalIp || 'Private IP'}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 ${
                    isFocusedVmTransitional
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse'
                      : isFocusedVmRunning
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {focusedVmEffectiveStatus}
                </span>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Target Linux User &amp; Home Directory:
                </div>
                <div className="grid grid-cols-2 gap-1.5">
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
                    return (
                      <button
                        key={cand.username}
                        type="button"
                        disabled={identityBusy}
                        onClick={() => handleSelectSshUserProfile(cand)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300'
                            : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-extrabold truncate">
                          {cand.username}
                        </div>
                        <div className="text-[10px] opacity-75 truncate">
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
                      className="flex-1 min-w-[180px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
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
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-lg shadow-teal-600/20 transition-all cursor-pointer"
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
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
                        className="flex-1 min-w-[220px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
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
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors cursor-pointer"
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/25 text-[10px] font-bold transition-colors cursor-pointer"
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
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        <Shield className="w-3 h-3 text-emerald-500" />
                        <span>VPC Firewall / IAP (0.0.0.0/0 ↔ IAP)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectTab('CLOUD_RUN')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold transition-colors cursor-pointer"
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
      ) : (
        <div className="p-3 space-y-2.5 flex-1 flex flex-col">
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
              isExpanded ? 'min-h-[540px]' : 'min-h-[390px]'
            }`}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
            <span>
              {isCloudRun
                ? 'Real Cloud Run Interactive Container SSH (@xterm/xterm + gcloud beta run services ssh PTY)'
                : 'Real Full-Duplex PTY (@xterm/xterm + WebSocket SSH2 / Linux pty.openpty) — supports interactive apt update, vim, htop, nano, tab-completion & Ctrl+C'}
            </span>
            <span>{connStatus.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
