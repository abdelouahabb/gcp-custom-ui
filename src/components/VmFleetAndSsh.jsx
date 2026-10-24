import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Server,
  Terminal,
  Play,
  Square,
  RotateCcw,
  PlusCircle,
  Copy,
  Check,
  HardDrive,
  RefreshCw,
  Wifi,
  FileText,
  Trash2,
  Zap,
  ShieldCheck,
  Sliders,
  Lock,
  Unlock,
  PauseCircle,
  Cpu,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import XtermWebSshTerminal from './XtermWebSshTerminal';
import LocalDevTunnelBar from './LocalDevTunnelBar';

const SSH_QUICK_CHIPS = [
  { label: 'Serial Console Logs (REST API)', cmd: 'serial-console' },
  { label: 'Kernel (uname -a)', cmd: 'uname -a' },
  { label: 'Disk Space (df -h)', cmd: 'df -h' },
  { label: 'System Load (uptime)', cmd: 'uptime' },
  { label: 'Memory (free -m)', cmd: 'free -m' },
  { label: 'GPU Status (nvidia-smi)', cmd: 'nvidia-smi || lspci | grep -i nvidia' },
  { label: 'Docker Containers', cmd: 'docker ps' },
  { label: 'Network (ip addr)', cmd: 'ip addr' },
];

const QUICK_VM_TEMPLATES = [
  {
    label: 'Free-Tier Spot Micro (us-east1-b · e2-micro)',
    prefix: 'spot-micro',
    region: 'us-east1',
    zone: 'us-east1-b',
    machineType: 'e2-micro',
    osImage: 'Debian 12 Bookworm',
    diskSizeGb: 15,
    diskType: 'pd-balanced',
    spotInstance: true,
    allowHttp: true,
    allowHttps: true,
  },
  {
    label: 'EU Web & Docker Host (europe-west1-b · e2-medium)',
    prefix: 'eu-docker',
    region: 'europe-west1',
    zone: 'europe-west1-b',
    machineType: 'e2-medium',
    osImage: 'Ubuntu 24.04 LTS',
    diskSizeGb: 25,
    diskType: 'pd-ssd',
    spotInstance: true,
    allowHttp: true,
    allowHttps: true,
    startupScript:
      '#!/bin/bash\napt-get update && apt-get install -y nginx\nsystemctl enable --now nginx',
  },
  {
    label: 'Arm64 Cloud-Native Node (us-central1-a · t2a-standard-1)',
    prefix: 'arm64-node',
    region: 'us-central1',
    zone: 'us-central1-a',
    machineType: 't2a-standard-1',
    osImage: 'Ubuntu 24.04 LTS',
    diskSizeGb: 20,
    diskType: 'pd-balanced',
    spotInstance: true,
    allowHttp: true,
    allowHttps: true,
  },
];

const RESIZE_MACHINE_TYPES = [
  'e2-micro',
  'e2-small',
  'e2-medium',
  'e2-standard-2',
  'e2-standard-4',
  'n2-standard-2',
  'n2-standard-4',
  'c3-standard-4',
];

export default function VmFleetAndSsh({
  projectId,
  account = 'user',
  onOpenProvisionVm,
  onVmDeleted,
  onRunInShell,
  onSelectTab,
  onShowToast,
  refreshTrigger = 0,
}) {
  const [vms, setVms] = useState([]);
  const [computeApiMessage, setComputeApiMessage] = useState('');
  const [loadingVms, setLoadingVms] = useState(true);
  const [powerBusyVm, setPowerBusyVm] = useState(null);
  const [confirmDeleteVm, setConfirmDeleteVm] = useState(null);
  const [pendingOps, setPendingOps] = useState({});
  const [powerError, setPowerError] = useState(null);
  const [activeSshVm, setActiveSshVm] = useState(null);
  const [sshCommandInput, setSshCommandInput] = useState('uname -a');
  const [sshRunning, setSshRunning] = useState(false);
  const [copiedSshCli, setCopiedSshCli] = useState(false);
  const [sshTranscript, setSshTranscript] = useState([]);
  const [sshTerminalExpanded, setSshTerminalExpanded] = useState(false);
  const [serialConsoleOutput, setSerialConsoleOutput] = useState('');
  const [serialLoading, setSerialLoading] = useState(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL');
  const [quickDeployingLabel, setQuickDeployingLabel] = useState(null);
  const [openResizeVm, setOpenResizeVm] = useState(null);
  const [resizeMachineTarget, setResizeMachineTarget] = useState('e2-medium');
  const [openTunnelVm, setOpenTunnelVm] = useState(null);

  // Live VM -> Cloud Run v2 Serverless Migrator state
  const [openMigrateCloudRunVm, setOpenMigrateCloudRunVm] = useState(null);
  const [migrateForm, setMigrateForm] = useState({
    serviceName: '',
    region: 'us-central1',
    containerImage: 'us-docker.pkg.dev/cloudrun/container/hello',
    containerPort: 8080,
    cpu: '1',
    memory: '1Gi',
    maxInstances: 10,
    stopSourceVmAfterDeploy: true,
  });
  const [inspectingVmContainers, setInspectingVmContainers] = useState(false);
  const [detectedVmRuntimeInfo, setDetectedVmRuntimeInfo] = useState(null);
  const [migratingToCloudRun, setMigratingToCloudRun] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [migrationError, setMigrationError] = useState(null);

  const userShort = (account || 'user').split('@')[0];

  const fetchVms = useCallback(
    async (silent = false) => {
      if (!silent) setLoadingVms(true);
      setPowerError(null);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/vms`
        );
        const list = res.data.vms || [];
        setVms(list);
        setComputeApiMessage(res.data.computeApiMessage || '');

        // Clean up pendingOps once the VM is either gone (for DELETE) or settled
        setPendingOps((prev) => {
          const next = { ...prev };
          let changed = false;
          for (const [vmName, op] of Object.entries(next)) {
            const found = list.find((v) => v.name === vmName);
            if (op.type === 'DELETING' && !found) {
              delete next[vmName];
              changed = true;
            } else if (
              op.type === 'STOPPING' &&
              found &&
              (found.status === 'TERMINATED' || found.status === 'STOPPED')
            ) {
              delete next[vmName];
              changed = true;
            } else if (
              op.type === 'SUSPENDING' &&
              found &&
              found.status === 'SUSPENDED'
            ) {
              delete next[vmName];
              changed = true;
            } else if (
              (op.type === 'STARTING' || op.type === 'RESUMING') &&
              found &&
              found.status === 'RUNNING'
            ) {
              delete next[vmName];
              changed = true;
            } else if (
              (op.type === 'REBOOTING' || op.type === 'RESIZING') &&
              Date.now() - op.startedAt > 6000
            ) {
              delete next[vmName];
              changed = true;
            }
          }
          return changed ? next : prev;
        });

        // Keep SSH OFF by default when landing on the tab; only refresh activeSshVm metadata if the user already activated SSH on a VM
        setActiveSshVm((prev) => {
          if (!prev) return null;
          return list.find((v) => v.name === prev.name) || null;
        });
      } catch (err) {
        setComputeApiMessage(err.response?.data?.error || err.message);
      } finally {
        if (!silent) setLoadingVms(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchVms();
  }, [fetchVms, refreshTrigger]);

  // Automatically poll GCP every 3 seconds while any VM is in a transitional state
  const hasTransitionalVm =
    Object.keys(pendingOps).length > 0 ||
    vms.some((v) =>
      ['STOPPING', 'PROVISIONING', 'STAGING', 'SUSPENDING', 'DEPROVISIONING'].includes(
        v.status
      )
    );

  useEffect(() => {
    if (!hasTransitionalVm) return;
    const timer = setInterval(() => {
      fetchVms(true);
      if (onVmDeleted) onVmDeleted();
    }, 3000);
    return () => clearInterval(timer);
  }, [hasTransitionalVm, fetchVms, onVmDeleted]);

  useEffect(() => {
    if (!activeSshVm) {
      setSshTranscript([]);
      return;
    }
    setSshTranscript([
      {
        id: `welcome-${activeSshVm.name}`,
        command: activeSshVm.sshCommand,
        output: `Ready to execute live SSH commands or inspect Serial Port 1 Console Output on:\nInstance: ${activeSshVm.name} (${activeSshVm.zone})\nInternal IP: ${activeSshVm.internalIp} · External IP: ${activeSshVm.externalIp}\nStatus: ${activeSshVm.status} · Machine: ${activeSshVm.machineType} · Disk: ${activeSshVm.diskSizeGb}GB ${activeSshVm.diskType || 'pd-balanced'}`,
        durationMs: 42,
      },
    ]);
  }, [activeSshVm?.name, projectId]);

  const handleQuickDeployVm = async (tpl) => {
    if (quickDeployingLabel) return;
    const suffix = Math.floor(100 + Math.random() * 899);
    const vmName = `${tpl.prefix}-${suffix}`;
    setQuickDeployingLabel(tpl.label);
    setPowerError(null);
    try {
      await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType: 'COMPUTE_VM',
          name: vmName,
          region: tpl.region,
          zone: tpl.zone,
          config: {
            machineType: tpl.machineType,
            osImage: tpl.osImage,
            diskSizeGb: tpl.diskSizeGb,
            diskType: tpl.diskType,
            spotInstance: tpl.spotInstance,
            terminationAction: 'STOP',
            vmNetwork: 'default',
            externalIpEnabled: true,
            allowHttp: tpl.allowHttp,
            allowHttps: tpl.allowHttps,
            shieldedVtpm: true,
            startupScript: tpl.startupScript || '',
          },
        }
      );
      await fetchVms(false);
      if (onVmDeleted) onVmDeleted();
    } catch (err) {
      setPowerError(
        err.response?.data?.error ||
          err.message ||
          'Failed to quick-provision Compute Engine VM.'
      );
    } finally {
      setQuickDeployingLabel(null);
    }
  };

  const handlePowerAction = async (vm, action, extraPayload = {}) => {
    setPowerBusyVm(vm.name);
    setPowerError(null);
    const opLabelMap = {
      DELETE: 'DELETING',
      STOP: 'STOPPING',
      START: 'STARTING',
      RESET: 'REBOOTING',
      SUSPEND: 'SUSPENDING',
      RESUME: 'RESUMING',
      SET_MACHINE_TYPE: 'RESIZING',
      SET_DELETION_PROTECTION: 'UPDATING',
    };
    setPendingOps((prev) => ({
      ...prev,
      [vm.name]: {
        type: opLabelMap[action] || 'UPDATING',
        startedAt: Date.now(),
        zone: vm.zone,
      },
    }));
    setConfirmDeleteVm(null);

    try {
      await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          vm.name
        )}/power`,
        {
          action,
          zone: vm.zone,
          ...extraPayload,
        }
      );
      if (action === 'SET_MACHINE_TYPE') {
        setOpenResizeVm(null);
      }
      await fetchVms(true);
      if (onVmDeleted) {
        onVmDeleted();
      }
    } catch (err) {
      setPendingOps((prev) => {
        const next = { ...prev };
        delete next[vm.name];
        return next;
      });
      if (!err?.__cancelledByUser) {
        setPowerError(err.response?.data?.error || err.message);
      }
    } finally {
      setPowerBusyVm(null);
    }
  };

  const handleRunSshCommand = async (cmdOverride) => {
    if (!activeSshVm || sshRunning) return;
    const cmd = (cmdOverride ?? sshCommandInput).trim();
    if (!cmd) return;
    setSshCommandInput(cmd);
    setSshRunning(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          activeSshVm.name
        )}/ssh`,
        {
          command: cmd,
          zone: activeSshVm.zone,
        }
      );
      setSshTranscript((prev) => [
        {
          id: `ssh-${Date.now()}`,
          command: res.data.command || cmd,
          output: res.data.output,
          durationMs: res.data.durationMs,
        },
        ...prev,
      ]);
    } catch (err) {
      setSshTranscript((prev) => [
        {
          id: `ssh-${Date.now()}`,
          command: cmd,
          output: err.response?.data?.error || err.message,
          durationMs: 0,
        },
        ...prev,
      ]);
    } finally {
      setSshRunning(false);
    }
  };

  const handleFetchSerialConsole = useCallback(async () => {
    if (!activeSshVm) return;
    setSerialLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          activeSshVm.name
        )}/ssh`,
        {
          command: 'serial-console',
          zone: activeSshVm.zone,
        }
      );
      setSerialConsoleOutput(res.data?.output || '(Empty serial port output)');
    } catch (err) {
      setSerialConsoleOutput(
        err.response?.data?.error || err.message || 'Failed to read Serial Port 1.'
      );
    } finally {
      setSerialLoading(false);
    }
  }, [activeSshVm, projectId]);

  const formatVmDate = (iso) => {
    try {
      return format(new Date(iso), 'MMM dd, yyyy');
    } catch {
      return 'Oct 09, 2026';
    }
  };

  // Helper to map Compute Engine Machine Type -> Cloud Run v2 CPU & Memory
  const deriveCloudRunSpecFromVm = (vm) => {
    const mt = (vm?.machineType || 'e2-micro').toLowerCase();
    const vmReg =
      vm?.region || (vm?.zone ? vm.zone.split('-').slice(0, 2).join('-') : 'us-central1');
    let cpu = '1';
    let memory = '1Gi';
    let estMonthlyVmUsd = 7.11;
    if (mt.includes('micro')) {
      cpu = '1';
      memory = '1Gi';
      estMonthlyVmUsd = 7.11;
    } else if (mt.includes('small')) {
      cpu = '1';
      memory = '2Gi';
      estMonthlyVmUsd = 14.22;
    } else if (mt.includes('medium')) {
      cpu = '2';
      memory = '4Gi';
      estMonthlyVmUsd = 24.46;
    } else if (mt.includes('-4')) {
      cpu = '4';
      memory = '16Gi';
      estMonthlyVmUsd = 97.82;
    } else if (mt.includes('-8')) {
      cpu = '8';
      memory = '32Gi';
      estMonthlyVmUsd = 195.64;
    } else if (mt.includes('-2')) {
      cpu = '2';
      memory = '8Gi';
      estMonthlyVmUsd = 48.91;
    }
    const cleanName = String(vm?.name || 'vm-workload')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 38);
    return {
      serviceName: `${cleanName}-cloudrun`,
      region: vmReg,
      containerImage: 'us-docker.pkg.dev/cloudrun/container/hello',
      containerPort: 8080,
      cpu,
      memory,
      maxInstances: 10,
      stopSourceVmAfterDeploy: true,
      estMonthlyVmUsd,
    };
  };

  const handleToggleMigrateVm = (vm) => {
    if (openMigrateCloudRunVm === vm.name) {
      setOpenMigrateCloudRunVm(null);
      return;
    }
    const spec = deriveCloudRunSpecFromVm(vm);
    setMigrateForm(spec);
    setDetectedVmRuntimeInfo(null);
    setMigrationResult(null);
    setMigrationError(null);
    setOpenMigrateCloudRunVm(vm.name);
  };

  const handleInspectVmForCloudRun = async (vm) => {
    setInspectingVmContainers(true);
    setMigrationError(null);
    try {
      const probeCmd =
        'docker ps --format "{{.Image}}|{{.Ports}}|{{.Names}}" 2>/dev/null || ss -tulpn 2>/dev/null | grep LISTEN | head -n 6 || uname -a';
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          vm.name
        )}/ssh`,
        {
          command: probeCmd,
          zone: vm.zone,
        }
      );
      const rawOut = String(res.data?.output || '').trim();
      let detectedImage = null;
      let detectedPort = null;
      const firstLine = rawOut.split('\n')[0] || '';
      if (firstLine.includes('|')) {
        const [img, ports] = firstLine.split('|');
        if (img && !img.includes('command not found')) {
          detectedImage = img.trim();
        }
        const portMatch = (ports || '').match(/:(\d+)->(\d+)/);
        if (portMatch) {
          detectedPort = Number(portMatch[2] || portMatch[1]);
        }
      } else {
        const listenMatch = rawOut.match(/:(8080|3000|5000|8000|80|8443)\b/);
        if (listenMatch) {
          detectedPort = Number(listenMatch[1]);
        }
      }
      setDetectedVmRuntimeInfo({
        rawOutput: rawOut || 'No active Docker containers returned; ready for container image deployment.',
        detectedImage,
        detectedPort,
      });
      setMigrateForm((prev) => ({
        ...prev,
        containerImage: detectedImage || prev.containerImage,
        containerPort: detectedPort || prev.containerPort,
      }));
    } catch (err) {
      setDetectedVmRuntimeInfo({
        rawOutput:
          err.response?.data?.error ||
          err.message ||
          'VM SSH inspection skipped (VM may be stopped or booting). Using default Cloud Run container configuration.',
      });
    } finally {
      setInspectingVmContainers(false);
    }
  };

  const handleExecuteVmToCloudRunMigration = async (vm) => {
    setMigratingToCloudRun(true);
    setMigrationError(null);
    setMigrationResult(null);
    try {
      const payload = {
        serviceType: 'CLOUD_RUN',
        serviceName: migrateForm.serviceName,
        region: migrateForm.region,
        containerImage: migrateForm.containerImage,
        containerPort: Number(migrateForm.containerPort) || 8080,
        cpu: migrateForm.cpu,
        memory: migrateForm.memory,
        minInstances: 0,
        maxInstances: Number(migrateForm.maxInstances) || 10,
        allowUnauthenticated: true,
        ingress: 'INGRESS_TRAFFIC_ALL',
        executionEnvironment: 'EXECUTION_ENVIRONMENT_GEN2',
        cpuThrottling: true,
        startupCpuBoost: true,
        envVars: {
          MIGRATED_FROM_GCE_VM: vm.name,
          SOURCE_VM_ZONE: vm.zone,
          SOURCE_MACHINE_TYPE: vm.machineType,
        },
      };
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        payload
      );

      let vmStopped = false;
      if (migrateForm.stopSourceVmAfterDeploy && vm.status === 'RUNNING') {
        try {
          await axios.post(
            `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
              vm.name
            )}/power`,
            {
              action: 'STOP',
              zone: vm.zone,
            }
          );
          vmStopped = true;
          fetchVms(true);
        } catch {
          // Non-fatal if stop fails
        }
      }

      const createdRes = res.data?.resource || {};
      setMigrationResult({
        serviceName: createdRes.name || migrateForm.serviceName,
        region: createdRes.region || migrateForm.region,
        uri:
          createdRes.uri ||
          `https://${migrateForm.serviceName}-${projectId}.${migrateForm.region}.run.app`,
        vmStopped,
        message:
          res.data?.message ||
          `Migrated VM ${vm.name} (${vm.machineType}) to Cloud Run Gen2 service ${migrateForm.serviceName} (${migrateForm.cpu} vCPU / ${migrateForm.memory}, minInstances=0 Scale-to-$0.00).`,
      });
      if (onShowToast) {
        onShowToast(
          `Migrated VM ${vm.name} -> Cloud Run service ${migrateForm.serviceName} in ${migrateForm.region}!`,
          'success'
        );
      }
    } catch (err) {
      setMigrationError(
        err.response?.data?.error ||
          err.message ||
          'Failed to deploy Cloud Run v2 service from VM spec.'
      );
    } finally {
      setMigratingToCloudRun(false);
    }
  };

  const uniqueRegions = Array.from(
    new Set(vms.map((v) => v.region || v.zone.split('-').slice(0, 2).join('-')))
  );
  const filteredVms =
    selectedRegionFilter === 'ALL'
      ? vms
      : vms.filter(
          (v) =>
            (v.region || v.zone.split('-').slice(0, 2).join('-')) ===
            selectedRegionFilter
        );

  return (
    <div className="space-y-4">
      {/* Top Fleet Action Bar */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-500">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2 flex-wrap">
                <span>Compute Engine Studio & Live Web SSH</span>
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">
                  {vms.length} live VM{vms.length === 1 ? '' : 's'} in {projectId}
                </span>
                <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  13 Global Regions · E2/N2/C3/C4/Arm64/GPU
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Multi-region VM fleet manager with Spot VMs, GPU accelerators,
                Hyperdisk/SSD boot volumes, Shielded VM, Suspend/Resume, live
                Machine Type resizing, and Web SSH on{' '}
                <span className="font-mono font-semibold">{projectId}</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {vms.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const targetVm =
                    filteredVms[0] || vms[0];
                  if (targetVm) {
                    handleToggleMigrateVm(targetVm);
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[8px] px-3.5 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
                title="Convert a 24/7 Compute Engine VM into an auto-scaling Cloud Run Gen2 service (minInstances: 0 -> $0.00/mo idle)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Migrate VM → Cloud Run (Scale-to-$0)</span>
              </button>
            )}

            <button
              type="button"
              disabled={loadingVms}
              onClick={() => fetchVms(false)}
              className="inline-flex items-center gap-1.5 bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-3 py-2 text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingVms || hasTransitionalVm
                    ? 'animate-spin text-zinc-500 dark:text-zinc-400'
                    : ''
                }`}
              />
              <span>Refresh Fleet</span>
            </button>

            <button
              type="button"
              onClick={onOpenProvisionVm}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-4 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Open Compute VM Studio</span>
            </button>
          </div>
        </div>

        {/* 1-Tap Quick Multi-Region VM Templates & Region Filter Bar */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 flex items-center gap-1 mr-1">
              <Zap className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>1-Tap Multi-Region Presets:</span>
            </span>
            {QUICK_VM_TEMPLATES.map((tpl) => {
              const isDeploying = quickDeployingLabel === tpl.label;
              return (
                <button
                  key={tpl.label}
                  type="button"
                  disabled={Boolean(quickDeployingLabel)}
                  onClick={() => handleQuickDeployVm(tpl)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-blue-500/10 text-zinc-800 dark:text-zinc-200 hover:text-blue-500 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeploying ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-zinc-500 dark:text-zinc-400" />
                  ) : (
                    <Cpu className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                  )}
                  <span>{isDeploying ? `Provisioning...` : tpl.label}</span>
                </button>
              );
            })}
          </div>

          {uniqueRegions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono uppercase text-zinc-400">
                Region Filter:
              </span>
              <button
                type="button"
                onClick={() => setSelectedRegionFilter('ALL')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                  selectedRegionFilter === 'ALL'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                }`}
              >
                ALL ({vms.length})
              </button>
              {uniqueRegions.map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegionFilter(reg)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                    selectedRegionFilter === reg
                      ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-500'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {powerError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500">
          {powerError}
        </div>
      )}

      {filteredVms.length === 0 ? (
        <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
            <Server className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            0 Compute Engine VM Instances Currently Running in{' '}
            <span className="font-mono text-blue-500">{projectId}</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            {computeApiMessage
              ? `GCP API Status: ${computeApiMessage}`
              : 'No virtual machines are currently provisioned across any zone in this project. Use the 1-Tap Multi-Region Presets above or open the Compute VM Studio to customize Region, Zone, Machine Family (E2/N2/C3/C4/Arm64/GPU), Disk Type, Spot VM, Shielded VM, and Startup Scripts.'}
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenProvisionVm}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-5 py-2.5 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Open Compute Engine VM Studio</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* VM Fleet List */}
          <div
            className={`${
              sshTerminalExpanded
                ? 'xl:col-span-12 order-2'
                : 'xl:col-span-6'
            } space-y-3`}
          >
            {filteredVms.map((vm) => {
              const pendingOp = pendingOps[vm.name];
              const isDeleting =
                pendingOp?.type === 'DELETING' ||
                vm.status === 'DEPROVISIONING';
              const isTransitional =
                Boolean(pendingOp) ||
                ['STOPPING', 'PROVISIONING', 'STAGING', 'SUSPENDING', 'DEPROVISIONING'].includes(
                  vm.status
                );
              const effectiveStatus = pendingOp?.type || vm.status;
              const isRunning =
                vm.status === 'RUNNING' && !isDeleting && !pendingOp;
              const isSuspended = vm.status === 'SUSPENDED' && !pendingOp;
              const isStopped =
                (vm.status === 'TERMINATED' || vm.status === 'STOPPED') &&
                !isDeleting &&
                !pendingOp;
              const isSshActive = activeSshVm?.name === vm.name && !isDeleting;
              const isBusy = powerBusyVm === vm.name || isTransitional;
              const vmReg =
                vm.region || vm.zone.split('-').slice(0, 2).join('-');

              return (
                <div
                  key={vm.id}
                  className={`relative overflow-hidden bg-white dark:bg-[#202124] border rounded-xl p-5 shadow-sm transition-all duration-300 ${
                    isDeleting
                      ? 'border-red-500/40 bg-zinc-100/70 dark:bg-zinc-900/60 opacity-65 grayscale-[60%] select-none'
                      : isTransitional
                      ? 'border-amber-500/40 opacity-85'
                      : isSshActive
                      ? 'border-blue-500 ring-1 ring-blue-500/40'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Animated Top Progress Strip during GCP Zonal Operation */}
                  {isTransitional && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full w-1/2 animate-pulse ${
                          isDeleting ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  )}

                  {/* Advanced GCP Zonal Operation Banner */}
                  {isTransitional && (
                    <div
                      className={`mb-3.5 px-3 py-2 rounded-lg border flex items-center justify-between gap-2 text-xs font-mono ${
                        isDeleting
                          ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                          : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span className="font-bold">
                          {isDeleting
                            ? `DELETING INSTANCE IN ${vm.zone.toUpperCase()}...`
                            : `${effectiveStatus} INSTANCE IN ${vm.zone.toUpperCase()}...`}
                        </span>
                      </div>
                      <span className="text-[10px] opacity-80">
                        Auto-syncing GCP Zonal Op (3s)
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isDeleting
                              ? 'bg-red-500 animate-ping'
                              : isTransitional
                              ? 'bg-amber-500 animate-ping'
                              : isRunning
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-zinc-500'
                          }`}
                        />
                        <h4
                          className={`text-sm font-bold font-mono ${
                            isDeleting
                              ? 'line-through text-zinc-400 dark:text-zinc-500'
                              : 'text-zinc-950 dark:text-zinc-50'
                          }`}
                        >
                          {vm.name}
                        </h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isDeleting
                              ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                              : isTransitional
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : isRunning
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {effectiveStatus}
                        </span>

                        {vm.spotInstance ? (
                          <span className="text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            SPOT VM
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded">
                            STANDARD VM
                          </span>
                        )}

                        {vm.shieldedVm && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            <span>SHIELDED</span>
                          </span>
                        )}

                        {vm.guestAccelerators?.length > 0 && (
                          <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30 px-1.5 py-0.5 rounded">
                            {vm.guestAccelerators[0].count}x{' '}
                            {vm.guestAccelerators[0].type}
                          </span>
                        )}

                        {/* Deletion Protection Toggle Pill */}
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            handlePowerAction(vm, 'SET_DELETION_PROTECTION', {
                              deletionProtection: !vm.deletionProtection,
                            })
                          }
                          title="Click to toggle Compute Engine Deletion Protection"
                          className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            vm.deletionProtection
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          {vm.deletionProtection ? (
                            <>
                              <Lock className="w-2.5 h-2.5" />
                              <span>PROTECTED</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-2.5 h-2.5" />
                              <span>UNPROTECTED</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[11px]">
                          {vmReg}
                        </span>
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">
                          {vm.zone}
                        </span>
                        <span>·</span>
                        <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                          {vm.machineType}
                        </span>
                        <span>·</span>
                        <span>Created {formatVmDate(vm.createdAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleToggleMigrateVm(vm)}
                        title="Migrate this Compute Engine VM instance to a Scale-to-$0.00 Cloud Run Gen2 Serverless Service (run.googleapis.com/v2)"
                        className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
                          openMigrateCloudRunVm === vm.name
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Migrate VM → Cloud Run</span>
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() =>
                          setOpenTunnelVm((prev) =>
                            prev === vm.name ? null : vm.name
                          )
                        }
                        title="Open 127.0.0.1 Zero-Public-IP IAP TCP Port-Forward Tunnel (gcloud compute start-iap-tunnel for :22 SSH, :8080 Web, :5432 Postgres, :6379 Redis)"
                        className={`inline-flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-xs font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
                          openTunnelVm === vm.name
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        <span>127.0.0.1 IAP Tunnel</span>
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() =>
                          setActiveSshVm((prev) =>
                            prev?.name === vm.name ? null : vm
                          )
                        }
                        title={
                          isSshActive
                            ? `SSH is active on ${vm.name} — click to disconnect & turn SSH off`
                            : `Click to enable & connect live interactive SSH to ${vm.name}`
                        }
                        className={`inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-1.5 text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSshActive
                            ? 'bg-blue-600 hover:bg-red-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>
                          {isDeleting
                            ? 'Deprovisioning...'
                            : isSshActive
                            ? 'SSH Active (Turn Off)'
                            : 'SSH / Console'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                    <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
                      <div className="text-[10px] uppercase text-zinc-500">
                        Internal VPC IP ({vm.network || 'default'})
                      </div>
                      <div className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {vm.internalIp}
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
                      <div className="text-[10px] uppercase text-zinc-500">
                        External NAT IP
                      </div>
                      <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {vm.externalIp}
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
                      <div className="text-[10px] uppercase text-zinc-500">
                        Boot Disk ({vm.diskType || 'pd-balanced'})
                      </div>
                      <div className="text-xs font-mono text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                        {vm.diskSizeGb} GB · {vm.osImage}
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5">
                      <div className="text-[10px] uppercase text-zinc-500">
                        CPU Platform & Tags
                      </div>
                      <div className="text-xs font-mono text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                        {vm.tags?.length > 0
                          ? vm.tags.join(', ')
                          : vm.cpuPlatform || 'Standard vCPU'}
                      </div>
                    </div>
                  </div>

                  {/* Live Machine Type Resizer Drawer (Available when VM is STOPPED/TERMINATED) */}
                  {openResizeVm === vm.name && isStopped && (
                    <div className="mb-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/30 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sliders className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                        <span className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          Resize Stopped VM Machine Type:
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={resizeMachineTarget}
                          onChange={(e) =>
                            setResizeMachineTarget(e.target.value)
                          }
                          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        >
                          {RESIZE_MACHINE_TYPES.map((mt) => (
                            <option key={mt} value={mt}>
                              {mt}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            handlePowerAction(vm, 'SET_MACHINE_TYPE', {
                              machineType: resizeMachineTarget,
                            })
                          }
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-lg"
                        >
                          Apply Resize
                        </button>
                        <button
                          type="button"
                          onClick={() => setOpenResizeVm(null)}
                          className="text-xs text-zinc-500 px-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 127.0.0.1 Zero-Public-IP IAP TCP Port-Forward Tunnel Drawer */}
                  {openTunnelVm === vm.name && (
                    <div className="mb-3">
                      <LocalDevTunnelBar
                        projectId={projectId}
                        defaultTargetType="COMPUTE_IAP_TCP"
                        defaultResourceName={vm.name}
                        defaultZone={vm.zone}
                        defaultRemotePort={22}
                        defaultLocalPort={2222}
                        availableResources={vms.map((v) => ({
                          name: v.name,
                          zone: v.zone,
                          port: 22,
                        }))}
                        onClose={() => setOpenTunnelVm(null)}
                      />
                    </div>
                  )}

                  {/* Live VM -> Cloud Run Gen2 Serverless Containerizer & Migrator Drawer */}
                  {openMigrateCloudRunVm === vm.name && (
                    <div className="mb-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/35 space-y-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                              LIVE VM → CLOUD RUN GEN2 MIGRATOR
                            </span>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                              {vm.name} ({vm.machineType} in {vm.zone}) →{' '}
                              {migrateForm.serviceName} ({migrateForm.region})
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                            <strong>Under the Hood:</strong> Converts your 24/7 Compute Engine VM (
                            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                              ~${(migrateForm.estMonthlyVmUsd || 14.22).toFixed(2)}/mo fixed
                            </span>
                            ) into an auto-scaling{' '}
                            <span className="font-mono">run.googleapis.com/v2</span> Gen2 Linux microVM service in{' '}
                            <span className="font-mono font-bold">{migrateForm.region}</span> with{' '}
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              minInstances: 0 ($0.00/mo when idle)
                            </span>
                            , Startup CPU Boost, and automatic HTTPS TLS termination.
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isRunning && (
                            <button
                              type="button"
                              disabled={inspectingVmContainers}
                              onClick={() => handleInspectVmForCloudRun(vm)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-blue-600/15 hover:bg-blue-600/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 cursor-pointer disabled:opacity-50"
                            >
                              {inspectingVmContainers ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Terminal className="w-3 h-3" />
                              )}
                              <span>
                                {inspectingVmContainers
                                  ? 'Probing VM via SSH...'
                                  : 'Auto-Detect Docker Image / Port on VM'}
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setOpenMigrateCloudRunVm(null)}
                            className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {detectedVmRuntimeInfo && (
                        <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[11px] font-mono text-zinc-200 space-y-1">
                          <div className="flex items-center justify-between text-[10px] uppercase text-emerald-400 font-bold">
                            <span>Live SSH Runtime Probe ({vm.name})</span>
                            {detectedVmRuntimeInfo.detectedImage && (
                              <span>
                                Auto-Filled Image: {detectedVmRuntimeInfo.detectedImage}
                              </span>
                            )}
                          </div>
                          <div className="text-zinc-300 whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                            {detectedVmRuntimeInfo.rawOutput}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            Cloud Run Service Name
                          </label>
                          <input
                            type="text"
                            value={migrateForm.serviceName}
                            onChange={(e) =>
                              setMigrateForm((prev) => ({
                                ...prev,
                                serviceName: e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, '-'),
                              }))
                            }
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                          />
                        </div>

                        <div className="lg:col-span-2">
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            Container Image (Artifact Registry / Docker / GCR)
                          </label>
                          <input
                            type="text"
                            value={migrateForm.containerImage}
                            onChange={(e) =>
                              setMigrateForm((prev) => ({
                                ...prev,
                                containerImage: e.target.value,
                              }))
                            }
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            vCPU / Memory (Mapped from {vm.machineType})
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={migrateForm.cpu}
                              onChange={(e) =>
                                setMigrateForm((prev) => ({
                                  ...prev,
                                  cpu: e.target.value,
                                }))
                              }
                              className="w-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            >
                              <option value="1">1 vCPU</option>
                              <option value="2">2 vCPU</option>
                              <option value="4">4 vCPU</option>
                              <option value="8">8 vCPU</option>
                            </select>
                            <select
                              value={migrateForm.memory}
                              onChange={(e) =>
                                setMigrateForm((prev) => ({
                                  ...prev,
                                  memory: e.target.value,
                                }))
                              }
                              className="w-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            >
                              <option value="512Mi">512Mi</option>
                              <option value="1Gi">1Gi</option>
                              <option value="2Gi">2Gi</option>
                              <option value="4Gi">4Gi</option>
                              <option value="8Gi">8Gi</option>
                              <option value="16Gi">16Gi</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            Port & Max Scale
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={migrateForm.containerPort}
                              onChange={(e) =>
                                setMigrateForm((prev) => ({
                                  ...prev,
                                  containerPort: e.target.value,
                                }))
                              }
                              title="Container listening port"
                              className="w-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            />
                            <input
                              type="number"
                              value={migrateForm.maxInstances}
                              onChange={(e) =>
                                setMigrateForm((prev) => ({
                                  ...prev,
                                  maxInstances: e.target.value,
                                }))
                              }
                              title="Max auto-scaling Cloud Run instances"
                              className="w-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <label className="inline-flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={migrateForm.stopSourceVmAfterDeploy}
                            onChange={(e) =>
                              setMigrateForm((prev) => ({
                                ...prev,
                                stopSourceVmAfterDeploy: e.target.checked,
                              }))
                            }
                            className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>
                            Auto-Stop source VM (<span className="font-mono">{vm.name}</span>) after Cloud Run service is live to eliminate 24/7 compute billing
                          </span>
                        </label>

                        <div className="flex items-center gap-2 flex-wrap">
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() =>
                                onRunInShell(
                                  `gcloud run deploy ${migrateForm.serviceName} --image=${migrateForm.containerImage} --region=${migrateForm.region} --port=${migrateForm.containerPort} --cpu=${migrateForm.cpu} --memory=${migrateForm.memory} --min-instances=0 --max-instances=${migrateForm.maxInstances} --execution-environment=gen2 --allow-unauthenticated --project=${projectId}`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 cursor-pointer"
                            >
                              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Run gcloud run deploy in Shell</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={migratingToCloudRun || !migrateForm.serviceName}
                            onClick={() => handleExecuteVmToCloudRunMigration(vm)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {migratingToCloudRun ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {migratingToCloudRun
                                ? `Deploying ${migrateForm.serviceName} in ${migrateForm.region}...`
                                : `Deploy Cloud Run v2 Service Now (Scale-to-$0.00)`}
                            </span>
                          </button>
                        </div>
                      </div>

                      {migrationError && (
                        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-500 font-mono">
                          {migrationError}
                        </div>
                      )}

                      {migrationResult && (
                        <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="space-y-0.5">
                            <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                              <Check className="w-4 h-4" />
                              <span>{migrationResult.message}</span>
                            </div>
                            <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                              Endpoint:{' '}
                              <a
                                href={migrationResult.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-blue-600 dark:text-blue-400 font-bold"
                              >
                                {migrationResult.uri}
                              </a>
                              {migrationResult.vmStopped
                                ? ` · Source VM ${vm.name} automatically STOPPED.`
                                : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {onSelectTab && (
                              <button
                                type="button"
                                onClick={() => onSelectTab('CLOUD_RUN')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                              >
                                <span>Open Cloud Run Fleet</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => {
                        setActiveSshVm(vm);
                        handleRunSshCommand('serial-console');
                      }}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-40 disabled:no-underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Read Serial Port 1 Logs</span>
                    </button>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isDeleting ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-red-500 bg-red-500/10 border border-red-500/25 px-3 py-1 rounded-md">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Terminating & Releasing Disk/IP...</span>
                        </span>
                      ) : (
                        <>
                          {isSuspended ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handlePowerAction(vm, 'RESUME')}
                              className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Resume VM</span>
                            </button>
                          ) : !isRunning ? (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handlePowerAction(vm, 'START')}
                                className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>
                                  {isBusy ? `${effectiveStatus}...` : 'Start VM'}
                                </span>
                              </button>
                              {isStopped && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setResizeMachineTarget(vm.machineType);
                                    setOpenResizeVm(
                                      openResizeVm === vm.name ? null : vm.name
                                    );
                                  }}
                                  className="inline-flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
                                >
                                  <Sliders className="w-3 h-3" />
                                  <span>Resize Machine</span>
                                </button>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handlePowerAction(vm, 'RESET')}
                                className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Reboot</span>
                              </button>
                              {!vm.spotInstance && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handlePowerAction(vm, 'SUSPEND')}
                                  className="inline-flex items-center gap-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  <PauseCircle className="w-3 h-3" />
                                  <span>Suspend</span>
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handlePowerAction(vm, 'STOP')}
                                className="inline-flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                              >
                                <Square className="w-3 h-3 fill-current" />
                                <span>Stop</span>
                              </button>
                            </>
                          )}

                          {confirmDeleteVm === vm.name ? (
                            <div className="inline-flex items-center gap-1 bg-red-500/10 border border-red-500/40 rounded-md px-2 py-0.5">
                              <span className="text-[11px] font-bold text-red-500">
                                Confirm Delete?
                              </span>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handlePowerAction(vm, 'DELETE')}
                                className="bg-[#e11d48] hover:bg-[#be123c] text-white px-2 py-0.5 rounded text-[11px] font-bold transition-colors disabled:opacity-50"
                              >
                                Yes, Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteVm(null)}
                                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 px-1.5 py-0.5 text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDeleteVm(vm.name)}
                              className="inline-flex items-center gap-1 bg-[#e11d48] hover:bg-[#be123c] text-white px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete VM</span>
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

          {/* Real Open-Source Interactive Web-SSH (@xterm/xterm + SSH2 / Linux PTY) */}
          <div
            className={`${
              sshTerminalExpanded
                ? 'xl:col-span-12 order-1'
                : 'xl:col-span-6'
            } w-full`}
          >
            <XtermWebSshTerminal
              projectId={projectId}
              activeVm={activeSshVm}
              defaultUsername={userShort || 'ubuntu'}
              isExpanded={sshTerminalExpanded}
              onToggleExpand={() => setSshTerminalExpanded((prev) => !prev)}
              onDisconnect={() => setActiveSshVm(null)}
              onFetchSerialConsole={handleFetchSerialConsole}
              serialConsoleOutput={serialConsoleOutput}
              serialLoading={serialLoading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

