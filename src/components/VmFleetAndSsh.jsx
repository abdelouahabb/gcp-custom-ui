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
  AlertTriangle,
  FolderOpen,
  Search,
} from 'lucide-react';
import XtermWebSshTerminal from './XtermWebSshTerminal';
import LocalDevTunnelBar from './LocalDevTunnelBar';
import VisualCronScheduleBuilder, {
  describeCronInPlainEnglish,
} from './VisualCronScheduleBuilder';

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
  const [splitLayoutMode, setSplitLayoutMode] = useState('4_8'); // '4_8' (33% VM / 67% SSH) | '5_7' (42% / 58%) | '6_6' (50% / 50%)
  const [serialConsoleOutput, setSerialConsoleOutput] = useState('');
  const [serialLoading, setSerialLoading] = useState(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState('ALL');
  const [vmSearchQuery, setVmSearchQuery] = useState('');
  const [vmStatusFilter, setVmStatusFilter] = useState('ALL');
  const [vmMachineFilter, setVmMachineFilter] = useState('ALL');
  const [vmAcceleratorFilter, setVmAcceleratorFilter] = useState('ALL');
  const [vmDiskModelFilter, setVmDiskModelFilter] = useState('ALL');
  const [vmMetadataTagFilter, setVmMetadataTagFilter] = useState('ALL');
  const [quickDeployingLabel, setQuickDeployingLabel] = useState(null);
  const [openResizeVm, setOpenResizeVm] = useState(null);
  const [resizeMachineTarget, setResizeMachineTarget] = useState('e2-medium');
  const [openTunnelVm, setOpenTunnelVm] = useState(null);
  const [openScpTrigger, setOpenScpTrigger] = useState(0);
  const [scpTargetVmName, setScpTargetVmName] = useState('');

  // Live VM -> Cloud Run v2 Serverless Migrator state
  const [openMigrateCloudRunVm, setOpenMigrateCloudRunVm] = useState(null);
  const [migrateForm, setMigrateForm] = useState({
    serviceName: '',
    region: 'us-central1',
    targetPath: '/var/www/html',
    migrationMode: 'MOUNT_GCS_FUSE_DISK', // 'MOUNT_GCS_FUSE_DISK' | 'HYDRATE_VM_FILES' | 'CUSTOM_IMAGE'
    diskBucketName: '',
    diskMountPath: '/mnt/gce-disk',
    diskReadOnly: false,
    containerImage: 'mirror.gcr.io/library/python:3.12-slim',
    containerPort: 8080,
    cpu: '1',
    memory: '1Gi',
    maxInstances: 10,
    stopSourceVmAfterDeploy: true,
    primaryFileName: 'index.html',
    primaryFilePreview: '',
    extractedBundleB64: '',
  });
  const [inspectingVmContainers, setInspectingVmContainers] = useState(false);
  const [detectedVmRuntimeInfo, setDetectedVmRuntimeInfo] = useState(null);
  const [activeExtractPreviewTab, setActiveExtractPreviewTab] = useState('FILES'); // 'FILES' | 'DOCKERFILE'
  const [migratingToCloudRun, setMigratingToCloudRun] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [migrationError, setMigrationError] = useState(null);

  const userShort =
    account &&
    String(account).includes('@') &&
    !/connected.oauth.user/i.test(String(account))
      ? String(account).split('@')[0]
      : '';

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
  }, [
    activeSshVm?.name,
    activeSshVm?.externalIp,
    activeSshVm?.status,
    projectId,
  ]);

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
    setPowerError(null);
    setConfirmDeleteVm(null);
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

    try {
      await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          vm.name
        )}/power`,
        {
          action,
          zone: vm.zone,
          ...extraPayload,
        },
        {
          __onGatekeeperConfirmed: () => {
            setPowerBusyVm(vm.name);
            setPendingOps((prev) => ({
              ...prev,
              [vm.name]: {
                type: opLabelMap[action] || 'UPDATING',
                startedAt: Date.now(),
                zone: vm.zone,
              },
            }));
          },
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
      if (!err?.__cancelledByUser && err?.response?.status !== 499) {
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

  const handleFetchSerialConsole = useCallback(
    async (vmOverride = null) => {
      const targetVm = vmOverride && vmOverride.name ? vmOverride : activeSshVm;
      if (!targetVm) return;
      setSerialLoading(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(
            projectId
          )}/vms/${encodeURIComponent(targetVm.name)}/ssh`,
          {
            command: 'serial-console',
            zone: targetVm.zone,
          }
        );
        setSerialConsoleOutput(res.data?.output || '(Empty serial port output)');
      } catch (err) {
        setSerialConsoleOutput(
          err.response?.data?.error ||
            err.message ||
            'Failed to read Serial Port 1.'
        );
      } finally {
        setSerialLoading(false);
      }
    },
    [activeSshVm, projectId]
  );

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
    const defaultBucket = `${projectId}-vmdisk-${cleanName}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 62);
    return {
      serviceName: `${cleanName}-cloudrun`,
      region: vmReg,
      targetPath: '/var/www/html',
      migrationMode: 'MOUNT_GCS_FUSE_DISK',
      diskBucketName: defaultBucket,
      diskMountPath: '/mnt/gce-disk',
      diskReadOnly: false,
      useDirectVmGcsRsync: false,
      enableCloudRunGpu:
        mt.startsWith('g2-') || mt.startsWith('a2-') || mt.startsWith('a3-'),
      enableMultiContainerSidecar: false,
      autoConvertCronToScheduler: false,
      cronScheduleExpression: '*/15 * * * *',
      simulatedHardwareScenario: 'AUTO',
      containerImage: 'mirror.gcr.io/library/python:3.12-slim',
      containerPort: 8080,
      cpu,
      memory,
      maxInstances: 10,
      stopSourceVmAfterDeploy: true,
      estMonthlyVmUsd,
      primaryFileName: 'index.html',
      primaryFilePreview: '',
      extractedBundleB64: '',
    };
  };

  const CLOUD_RUN_GPU_SUPPORTED_REGIONS = [
    'us-central1',
    'us-east4',
    'europe-west1',
    'europe-west4',
    'asia-east1',
    'asia-northeast1',
    'asia-southeast1',
  ];

  const getNearestGpuCompatibleRegion = (reg) => {
    const r = String(reg || 'us-east1').toLowerCase();
    if (CLOUD_RUN_GPU_SUPPORTED_REGIONS.includes(r)) return r;
    if (r.startsWith('us-east') || r.startsWith('southamerica')) return 'us-east4';
    if (r.startsWith('us-') || r.startsWith('northamerica')) return 'us-central1';
    if (r.startsWith('europe-') || r.startsWith('me-')) return 'europe-west4';
    return 'asia-southeast1';
  };

  const handleInspectVmForCloudRun = async (vm, customPath) => {
    setInspectingVmContainers(true);
    setMigrationError(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          vm.name
        )}/extract-workload`,
        {
          zone: vm.zone,
          targetPath: customPath || migrateForm.targetPath || '/var/www/html',
        }
      );
      const data = res.data || {};
      setDetectedVmRuntimeInfo(data);
      const guardrails = data.diskMigrationGuardrails || {};
      setMigrateForm((prev) => ({
        ...prev,
        targetPath: data.resolvedDir || prev.targetPath,
        diskBucketName: data.defaultDiskBucketName || prev.diskBucketName,
        migrationMode: data.detectedDockerImage
          ? 'CUSTOM_IMAGE'
          : 'MOUNT_GCS_FUSE_DISK',
        useDirectVmGcsRsync: Boolean(
          guardrails.exceedsInlineHttpSyncLimit ||
            guardrails.isLargeProvisionedDisk
        ),
        containerImage:
          data.detectedDockerImage ||
          'mirror.gcr.io/library/python:3.12-slim',
        containerPort: data.detectedPort || prev.containerPort || 8080,
        primaryFileName: data.primaryFileName || 'index.html',
        primaryFilePreview: data.primaryFilePreview || '',
        extractedBundleB64: data.extractedBundleB64 || '',
      }));
    } catch (err) {
      setMigrationError(
        err.response?.data?.error ||
          err.message ||
          'Failed to extract workload from VM.'
      );
    } finally {
      setInspectingVmContainers(false);
    }
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
    // Automatically extract files & runtime from the VM when opening the migrator
    handleInspectVmForCloudRun(vm, spec.targetPath);
  };

  const handleExecuteVmToCloudRunMigration = async (vm) => {
    setMigratingToCloudRun(true);
    setMigrationError(null);
    setMigrationResult(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/vms/${encodeURIComponent(
          vm.name
        )}/migrate-to-cloudrun`,
        {
          zone: vm.zone,
          region: migrateForm.region,
          serviceName: migrateForm.serviceName,
          cpu: migrateForm.cpu,
          memory: migrateForm.memory,
          maxInstances: Number(migrateForm.maxInstances) || 10,
          containerPort: Number(migrateForm.containerPort) || 8080,
          migrationMode: migrateForm.migrationMode,
          diskBucketName: migrateForm.diskBucketName,
          diskMountPath: migrateForm.diskMountPath || '/mnt/gce-disk',
          diskReadOnly: Boolean(migrateForm.diskReadOnly),
          useDirectVmGcsRsync: Boolean(migrateForm.useDirectVmGcsRsync),
          enableCloudRunGpu: Boolean(migrateForm.enableCloudRunGpu),
          gpuAcceleratorType: 'nvidia-l4',
          enableMultiContainerSidecar: Boolean(
            migrateForm.enableMultiContainerSidecar
          ),
          autoConvertCronToScheduler: Boolean(
            migrateForm.autoConvertCronToScheduler
          ),
          cronScheduleExpression:
            migrateForm.cronScheduleExpression || '*/15 * * * *',
          targetPath: migrateForm.targetPath || '/var/www/html',
          containerImage: migrateForm.containerImage,
          extractedBundleB64: migrateForm.extractedBundleB64,
          primaryFileName: migrateForm.primaryFileName || 'index.html',
          primaryFilePreview: migrateForm.primaryFilePreview,
          stopSourceVmAfterDeploy: migrateForm.stopSourceVmAfterDeploy,
        }
      );

      if (res.data?.vmStopped) {
        fetchVms(true);
      }

      setMigrationResult({
        serviceName: res.data?.serviceName || migrateForm.serviceName,
        region: res.data?.region || migrateForm.region,
        uri:
          res.data?.uri ||
          `https://${migrateForm.serviceName}-${projectId}.${migrateForm.region}.run.app`,
        vmStopped: Boolean(res.data?.vmStopped),
        mountedDiskBucket: res.data?.mountedDiskBucket || null,
        diskMountPath: res.data?.diskMountPath || '/mnt/gce-disk',
        syncedDiskFilesCount: res.data?.syncedDiskFilesCount || 0,
        multiContainerSidecarDeployed: Boolean(
          res.data?.multiContainerSidecarDeployed
        ),
        cloudSchedulerJobName: res.data?.cloudSchedulerJobName || null,
        canaryVerification: res.data?.canaryVerification || null,
        message:
          res.data?.message ||
          `Migrated real files from VM ${vm.name} into Cloud Run Gen2 service ${migrateForm.serviceName}!`,
      });
      if (onShowToast) {
        onShowToast(
          `Migrated VM ${vm.name} content -> Cloud Run service ${migrateForm.serviceName} in ${migrateForm.region}!`,
          'success'
        );
      }
    } catch (err) {
      setMigrationError(
        err.response?.data?.error ||
          err.message ||
          'Failed to migrate VM content to Cloud Run v2.'
      );
    } finally {
      setMigratingToCloudRun(false);
    }
  };

  const getVmAcceleratorProfile = (v) => {
    const accList = Array.isArray(v.guestAccelerators)
      ? v.guestAccelerators
      : [];
    const mt = String(v.machineType || '').toLowerCase();
    const hasGpu =
      accList.some((a) =>
        /nvidia|gpu|l4|t4|v100|p100|p4|a100|h100|h200|b200/i.test(
          String(a?.type || '')
        )
      ) || /^(g2-|a2-|a3-|a4-)/i.test(mt);
    const hasTpu =
      accList.some((a) => /tpu/i.test(String(a?.type || ''))) ||
      /^(ct3|ct4|ct5|ct6|tpu-)/i.test(mt) ||
      (v.metadataKeys || []).some((k) => /tpu/i.test(String(k))) ||
      Object.keys(v.labels || {}).some((k) => /tpu/i.test(String(k)));
    const types = Array.from(
      new Set([
        ...accList.map((a) => String(a?.type || '')).filter(Boolean),
        ...(mt.startsWith('g2-') && accList.length === 0 ? ['nvidia-l4'] : []),
        ...(mt.startsWith('a2-') && accList.length === 0
          ? ['nvidia-tesla-a100']
          : []),
        ...(mt.startsWith('a3-') && accList.length === 0
          ? ['nvidia-h100-80gb']
          : []),
        ...(/^(ct3|ct4|ct5|ct6|tpu-)/i.test(mt) && accList.length === 0
          ? [mt]
          : []),
      ])
    );
    return {
      hasGpu,
      hasTpu,
      hasAnyAccelerator: hasGpu || hasTpu,
      types,
    };
  };

  const gpuVmCount = vms.filter((v) => getVmAcceleratorProfile(v).hasGpu).length;
  const tpuVmCount = vms.filter((v) => getVmAcceleratorProfile(v).hasTpu).length;
  const acceleratedVmCount = vms.filter(
    (v) => getVmAcceleratorProfile(v).hasAnyAccelerator
  ).length;
  const cpuOnlyVmCount = vms.length - acceleratedVmCount;
  const uniqueAcceleratorTypes = Array.from(
    new Set(vms.flatMap((v) => getVmAcceleratorProfile(v).types))
  );

  const uniqueRegions = Array.from(
    new Set(vms.map((v) => v.region || v.zone.split('-').slice(0, 2).join('-')))
  );
  const uniqueMachineTypes = Array.from(
    new Set(vms.map((v) => v.machineType).filter(Boolean))
  );
  const uniqueMetadataTokens = Array.from(
    new Set(
      vms.flatMap((v) => [
        ...(v.tags || []).map((t) => `tag:${t}`),
        ...Object.entries(v.labels || {}).map(([k, val]) => `label:${k}=${val}`),
        ...(v.metadataKeys || []).map((k) => `meta:${k}`),
      ])
    )
  );

  const hasActiveVmFilters =
    selectedRegionFilter !== 'ALL' ||
    vmSearchQuery.trim() !== '' ||
    vmStatusFilter !== 'ALL' ||
    vmMachineFilter !== 'ALL' ||
    vmAcceleratorFilter !== 'ALL' ||
    vmDiskModelFilter !== 'ALL' ||
    vmMetadataTagFilter !== 'ALL';

  const resetAllVmFilters = () => {
    setSelectedRegionFilter('ALL');
    setVmSearchQuery('');
    setVmStatusFilter('ALL');
    setVmMachineFilter('ALL');
    setVmAcceleratorFilter('ALL');
    setVmDiskModelFilter('ALL');
    setVmMetadataTagFilter('ALL');
  };

  const filteredVms = vms.filter((v) => {
    const vmReg = v.region || v.zone.split('-').slice(0, 2).join('-');
    if (selectedRegionFilter !== 'ALL' && vmReg !== selectedRegionFilter) {
      return false;
    }
    if (vmStatusFilter !== 'ALL') {
      if (
        vmStatusFilter === 'STOPPED' &&
        v.status !== 'TERMINATED' &&
        v.status !== 'STOPPED'
      ) {
        return false;
      }
      if (vmStatusFilter !== 'STOPPED' && v.status !== vmStatusFilter) {
        return false;
      }
    }
    if (vmMachineFilter !== 'ALL' && v.machineType !== vmMachineFilter) {
      return false;
    }
    if (vmAcceleratorFilter !== 'ALL') {
      const acc = getVmAcceleratorProfile(v);
      if (vmAcceleratorFilter === 'CPU_ONLY' && acc.hasAnyAccelerator) {
        return false;
      }
      if (vmAcceleratorFilter === 'ANY_ACCELERATOR' && !acc.hasAnyAccelerator) {
        return false;
      }
      if (vmAcceleratorFilter === 'GPU_ONLY' && !acc.hasGpu) {
        return false;
      }
      if (vmAcceleratorFilter === 'TPU_ONLY' && !acc.hasTpu) {
        return false;
      }
      if (
        vmAcceleratorFilter.startsWith('TYPE:') &&
        !acc.types.includes(vmAcceleratorFilter.slice(5))
      ) {
        return false;
      }
    }
    if (vmDiskModelFilter !== 'ALL') {
      if (vmDiskModelFilter === 'PD_STANDARD' && v.diskType !== 'pd-standard') {
        return false;
      }
      if (
        vmDiskModelFilter === 'SSD' &&
        v.diskType !== 'pd-balanced' &&
        v.diskType !== 'pd-ssd' &&
        !String(v.diskType || '').includes('hyperdisk')
      ) {
        return false;
      }
      if (vmDiskModelFilter === 'SPOT' && !v.spotInstance) {
        return false;
      }
      if (vmDiskModelFilter === 'STANDARD_MODEL' && v.spotInstance) {
        return false;
      }
    }
    if (vmMetadataTagFilter !== 'ALL') {
      const tokens = [
        ...(v.tags || []).map((t) => `tag:${t}`),
        ...Object.entries(v.labels || {}).map(([k, val]) => `label:${k}=${val}`),
        ...(v.metadataKeys || []).map((k) => `meta:${k}`),
      ];
      if (!tokens.includes(vmMetadataTagFilter)) return false;
    }
    if (vmSearchQuery.trim()) {
      const q = vmSearchQuery.trim().toLowerCase();
      const acc = getVmAcceleratorProfile(v);
      const hay = [
        v.name,
        v.zone,
        vmReg,
        v.machineType,
        v.status,
        v.internalIp,
        v.externalIp,
        v.osImage,
        v.diskType,
        v.network,
        v.serviceAccountEmail || '',
        ...acc.types,
        acc.hasGpu ? 'gpu nvidia' : 'cpu-only',
        acc.hasTpu ? 'tpu cloud-tpu' : '',
        ...(v.tags || []),
        ...Object.entries(v.labels || {}).map(([k, val]) => `${k}=${val}`),
        ...(v.metadataKeys || []),
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

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
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full">
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
                data-feature-id="VM_MIGRATE_TO_CLOUD_RUN"
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

            {onSelectTab && (
              <>
                <button
                  type="button"
                  data-feature-id="RECYCLE_BIN"
                  onClick={() => onSelectTab('RECYCLE_BIN', 'COMPUTE_VM')}
                  title="Open 30-Day Cloud Recycle Bin filtered to Deleted Compute Engine VMs (Empty Resource Shell Re-Creation vs. Snapshot Recovery)"
                  className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Deleted VMs (30d)</span>
                </button>
                <button
                  type="button"
                  data-feature-id="ENTERPRISE_STACK_PIPELINE"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('cloudpulse:open-terraform-drawer', {
                        detail: { artifactTab: 'mainTf' },
                      })
                    )
                  }
                  title="Reverse-engineer this VM fleet and project infrastructure into live HashiCorp Terraform HCL (main.tf)"
                  className="inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Reverse-Engineer to .tf (`main.tf`)</span>
                </button>
              </>
            )}

            <button
              type="button"
              data-feature-id="VM_REFRESH_FLEET"
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
              data-feature-id="VM_OPEN_PROVISION_STUDIO"
              onClick={onOpenProvisionVm}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-4 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Open Compute VM Studio</span>
            </button>
          </div>
        </div>

        {/* Full-Width Flat Region Filter Bar + VM Metadata & Attribute Filter Bar */}
        {vms.length > 0 && (
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
            {/* Row 1: Flat Region Filter Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 mr-1">
                  Region Filter:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRegionFilter('ALL')}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold border transition-colors cursor-pointer ${
                    selectedRegionFilter === 'ALL'
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-500/50'
                  }`}
                >
                  ALL ({vms.length})
                </button>
                {uniqueRegions.map((reg) => {
                  const countInReg = vms.filter(
                    (v) =>
                      (v.region || v.zone.split('-').slice(0, 2).join('-')) ===
                      reg
                  ).length;
                  return (
                    <button
                      key={reg}
                      type="button"
                      onClick={() => setSelectedRegionFilter(reg)}
                      className={`px-3 py-1 rounded-md text-xs font-mono font-bold border transition-colors cursor-pointer ${
                        selectedRegionFilter === reg
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-500/50'
                      }`}
                    >
                      {reg} ({countInReg})
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasActiveVmFilters && (
                  <button
                    type="button"
                    onClick={resetAllVmFilters}
                    className="px-2.5 py-1 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
                <span className="text-[11px] font-mono text-zinc-500">
                  Showing <strong>{filteredVms.length}</strong> of{' '}
                  <strong>{vms.length}</strong> instances
                </span>
              </div>
            </div>

            {/* Row 2: Responsive 6-Column VM Metadata, Search, Status, Machine, GPU/TPU, Disk & Tag/Label Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/70">
              <div className="relative w-full min-w-0">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={vmSearchQuery}
                  onChange={(e) => setVmSearchQuery(e.target.value)}
                  placeholder="Search VM, IP, tag, label..."
                  className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 min-w-0"
                />
              </div>

              <select
                aria-label="Filter by VM Status"
                value={vmStatusFilter}
                onChange={(e) => setVmStatusFilter(e.target.value)}
                className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer truncate"
              >
                <option value="ALL">Status: All</option>
                <option value="RUNNING">● RUNNING</option>
                <option value="STOPPED">■ STOPPED / TERMINATED</option>
                <option value="SUSPENDED">❚❚ SUSPENDED</option>
              </select>

              <select
                aria-label="Filter by Machine Type"
                value={vmMachineFilter}
                onChange={(e) => setVmMachineFilter(e.target.value)}
                className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer truncate"
              >
                <option value="ALL">
                  Machine: All ({uniqueMachineTypes.length})
                </option>
                {uniqueMachineTypes.map((mt) => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by GPU or TPU Accelerator"
                value={vmAcceleratorFilter}
                onChange={(e) => setVmAcceleratorFilter(e.target.value)}
                className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer truncate"
              >
                <option value="ALL">GPU / TPU: All ({vms.length})</option>
                <option value="CPU_ONLY">
                  No GPU/TPU · CPU Only ({cpuOnlyVmCount})
                </option>
                <option value="ANY_ACCELERATOR">
                  With GPU or TPU ({acceleratedVmCount})
                </option>
                <option value="GPU_ONLY">
                  With NVIDIA GPU ({gpuVmCount})
                </option>
                <option value="TPU_ONLY">
                  With Cloud TPU ({tpuVmCount})
                </option>
                {uniqueAcceleratorTypes.map((accType) => (
                  <option key={accType} value={`TYPE:${accType}`}>
                    Accelerator: {accType}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by Disk & Provisioning Model"
                value={vmDiskModelFilter}
                onChange={(e) => setVmDiskModelFilter(e.target.value)}
                className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer truncate"
              >
                <option value="ALL">Disk / Tier: All</option>
                <option value="PD_STANDARD">
                  pd-standard (HDD · Free Tier)
                </option>
                <option value="SSD">pd-balanced / pd-ssd (SSD)</option>
                <option value="STANDARD_MODEL">On-Demand Provisioning</option>
                <option value="SPOT">Spot / Preemptible VM</option>
              </select>

              <select
                aria-label="Filter by Network Tag, GCP Label, or Metadata Key"
                value={vmMetadataTagFilter}
                onChange={(e) => setVmMetadataTagFilter(e.target.value)}
                className="w-full min-w-0 h-8 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer truncate"
              >
                <option value="ALL">
                  Tags / Metadata ({uniqueMetadataTokens.length})
                </option>
                {uniqueMetadataTokens.map((tok) => (
                  <option key={tok} value={tok}>
                    {tok}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
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
              : 'No virtual machines are currently provisioned across any zone in this project. Click "+ Open Compute VM Studio" to configure Region, Zone, Machine Family (e2-micro Always Free with pd-standard HDD, N2/C3/C4/Arm64/GPU), Spot VM, Shielded VM, and Startup Scripts.'}
          </p>
          <div className="pt-1 flex flex-wrap items-center justify-center gap-2">
            {hasActiveVmFilters && (
              <button
                type="button"
                onClick={resetAllVmFilters}
                className="inline-flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-[8px] px-4 py-2.5 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                <span>Reset VM Filters (Show All {vms.length} VMs)</span>
              </button>
            )}
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
        <div className="space-y-2.5">
          {/* Asymmetric Master-Detail Workspace Split Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <Server className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="font-bold text-zinc-800 dark:text-zinc-200">
                Master-Detail Workspace Layout:
              </span>
              <span className="hidden sm:inline text-zinc-500">
                {openMigrateCloudRunVm || openTunnelVm
                  ? 'Auto-expanded 50% / 50% while VM drawer is open'
                  : splitLayoutMode === '4_8'
                  ? 'Compact VM Sidebar (33%) · Wide SSH & SCP Workbench (67%)'
                  : splitLayoutMode === '5_7'
                  ? 'Balanced VM Sidebar (42%) · SSH & SCP Workbench (58%)'
                  : 'Equal Split (50% / 50%)'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: '4_8', label: '33% VM / 67% SSH (Recommended)' },
                { id: '5_7', label: '42% / 58%' },
                { id: '6_6', label: '50% / 50%' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSshTerminalExpanded(false);
                    setSplitLayoutMode(opt.id);
                  }}
                  className={`px-2 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                    !sshTerminalExpanded && splitLayoutMode === opt.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSshTerminalExpanded((prev) => !prev)}
                className={`px-2 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  sshTerminalExpanded
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                }`}
              >
                {sshTerminalExpanded ? 'Exit Full-Width (100%)' : '100% Full SSH'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            {/* Compact Left VM Fleet Sidebar (Default 4/12 = 33%, auto-widens to 6/12 when a VM drawer is open) */}
            <div
              className={`${
                sshTerminalExpanded
                  ? 'xl:col-span-12 order-2'
                  : openMigrateCloudRunVm || openTunnelVm || splitLayoutMode === '6_6'
                  ? 'xl:col-span-6'
                  : splitLayoutMode === '5_7'
                  ? 'xl:col-span-5'
                  : 'xl:col-span-4'
              } space-y-3 transition-all duration-200`}
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
                    className={`relative overflow-hidden bg-white dark:bg-[#202124] border rounded-xl p-4 shadow-sm transition-all duration-300 ${
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
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
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
                          <span className="text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                            SPOT VM
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded-full">
                            STANDARD VM
                          </span>
                        )}

                        {vm.shieldedVm && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 px-1.5 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            <span>SHIELDED</span>
                          </span>
                        )}

                        {(() => {
                          const acc = getVmAcceleratorProfile(vm);
                          if (acc.hasGpu) {
                            const label =
                              vm.guestAccelerators?.length > 0
                                ? `${vm.guestAccelerators[0].count}x ${vm.guestAccelerators[0].type}`
                                : acc.types[0] || 'NVIDIA GPU';
                            return (
                              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                                GPU: {label}
                              </span>
                            );
                          }
                          if (acc.hasTpu) {
                            const label = acc.types[0] || 'Cloud TPU';
                            return (
                              <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                                TPU: {label}
                              </span>
                            );
                          }
                          return (
                            <span className="text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/80 px-1.5 py-0.5 rounded-full">
                              CPU-ONLY
                            </span>
                          );
                        })()}

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
                        <span className="font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[11px]">
                          {vmReg}
                        </span>
                        <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full text-[11px]">
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

                    <div
                      className={`w-full grid grid-cols-2 ${
                        sshTerminalExpanded || splitLayoutMode === '6_6'
                          ? 'sm:grid-cols-4'
                          : ''
                      } gap-1.5 pt-1`}
                    >
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
                        className={`inline-flex items-center justify-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSshActive
                            ? 'bg-blue-600 hover:bg-red-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        <Terminal className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {isDeleting
                            ? 'Deprovisioning...'
                            : isSshActive
                            ? 'SSH Active (Off)'
                            : 'SSH / Console'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => {
                          setScpTargetVmName(vm.name);
                          setOpenScpTrigger((n) => n + 1);
                        }}
                        title={`Open Visual SCP / SFTP Remote File Browser, Drag-and-Drop Uploader & In-Place Editor for ${vm.name}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-bold border bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">SCP / SFTP Files</span>
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
                        className={`inline-flex items-center justify-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
                          openTunnelVm === vm.name
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                      >
                        <Wifi className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">127.0.0.1 IAP Tunnel</span>
                      </button>

                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleToggleMigrateVm(vm)}
                        title="Migrate this Compute Engine VM instance to a Scale-to-$0.00 Cloud Run Gen2 Serverless Service (run.googleapis.com/v2)"
                        className={`inline-flex items-center justify-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-bold border transition-colors cursor-pointer disabled:opacity-40 ${
                          openMigrateCloudRunVm === vm.name
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Migrate → Cloud Run</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className={`grid grid-cols-2 ${
                      sshTerminalExpanded || splitLayoutMode === '6_6'
                        ? 'sm:grid-cols-4'
                        : ''
                    } gap-2 mb-3.5`}
                  >
                    <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] uppercase text-zinc-500">
                        Internal VPC IP ({vm.network || 'default'})
                      </div>
                      <div className="text-xs font-mono font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {vm.internalIp}
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] uppercase text-zinc-500">
                        External NAT IP
                      </div>
                      <div className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                        {vm.externalIp}
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
                      <div className="text-[10px] uppercase text-zinc-500">
                        Boot Disk ({vm.diskType || 'pd-balanced'})
                      </div>
                      <div className="text-xs font-mono text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                        {vm.diskSizeGb} GB · {vm.osImage}
                      </div>
                    </div>
                    <div className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
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
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded-md"
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
                            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                              LIVE VM FILESYSTEM EXTRACTOR → CLOUD RUN GEN2 MIGRATOR
                            </span>
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                              {vm.name} ({vm.machineType} in {vm.zone}) →{' '}
                              {migrateForm.serviceName} ({migrateForm.region})
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                            <strong>How We Extract &amp; Migrate Your VM Content:</strong>{' '}
                            1) Connects to <span className="font-mono">{vm.name}</span> via SSH / Compute API and extracts your actual application directory (<span className="font-mono">{migrateForm.targetPath}</span>, <span className="font-mono">tar.gz</span> bundle, listening ports, and GCE <span className="font-mono">startup-script</span>).{' '}
                            2) Either <strong>hydrates your extracted VM files directly into an in-memory <span className="font-mono">/workspace</span> volume on Cloud Run Gen2</strong> (serves your VM&apos;s real files in &lt;8s) OR builds a custom container image via <strong>Google Cloud Build (<span className="font-mono">gcloud builds submit</span>)</strong>.
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setOpenMigrateCloudRunVm(null)}
                            className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {/* Stage 1: Target Directory on VM & Live Content Extraction */}
                      <div className="p-3 rounded-xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                          <div className="flex-1 min-w-[220px]">
                            <label className="block text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                              Stage 1 · Source Application / Web Directory Inside VM ({vm.name})
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={migrateForm.targetPath}
                                onChange={(e) =>
                                  setMigrateForm((prev) => ({
                                    ...prev,
                                    targetPath: e.target.value,
                                  }))
                                }
                                placeholder="/var/www/html or /opt/app or /home/ubuntu"
                                className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                              <button
                                type="button"
                                disabled={inspectingVmContainers}
                                onClick={() =>
                                  handleInspectVmForCloudRun(
                                    vm,
                                    migrateForm.targetPath
                                  )
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                              >
                                {inspectingVmContainers ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <HardDrive className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {inspectingVmContainers
                                    ? `Extracting ${migrateForm.targetPath} from VM...`
                                    : 'Extract Files & Workload from VM'}
                                </span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {['/var/www/html', '/srv', '/opt', '/etc/nginx'].map(
                              (presetPath) => (
                                <button
                                  key={presetPath}
                                  type="button"
                                  onClick={() => {
                                    setMigrateForm((prev) => ({
                                      ...prev,
                                      targetPath: presetPath,
                                    }));
                                    handleInspectVmForCloudRun(vm, presetPath);
                                  }}
                                  className="px-2 py-1 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-500/15 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                                >
                                  {presetPath}
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        {inspectingVmContainers && (
                          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-mono text-blue-500 flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>
                              Connecting to {vm.name} ({vm.zone}) to extract files from{' '}
                              {migrateForm.targetPath}, inspect listening ports, and generate Dockerfile...
                            </span>
                          </div>
                        )}

                        {detectedVmRuntimeInfo && !inspectingVmContainers && (
                          <div className="space-y-2 pt-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold ${
                                    detectedVmRuntimeInfo.sshSucceeded
                                      ? 'bg-emerald-500/20 text-emerald-500'
                                      : 'bg-amber-500/20 text-amber-500'
                                  }`}
                                >
                                  {detectedVmRuntimeInfo.sshSucceeded
                                    ? `LIVE SSH TAR.GZ EXTRACTED (${detectedVmRuntimeInfo.resolvedDir})`
                                    : `EXTRACTED FROM GCE VM METADATA / STARTUP-SCRIPT (${vm.status})`}
                                </span>
                                {(detectedVmRuntimeInfo.extractedFilesList || [])
                                  .length > 0 && (
                                  <span className="text-zinc-500">
                                    Files Staged:{' '}
                                    {detectedVmRuntimeInfo.extractedFilesList
                                      .map(
                                        (f) => `${f.name} (${f.sizeBytes}B)`
                                      )
                                      .join(', ')}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveExtractPreviewTab('FILES')
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                    activeExtractPreviewTab === 'FILES'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  Extracted VM File ({migrateForm.primaryFileName})
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveExtractPreviewTab('DOCKERFILE')
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                    activeExtractPreviewTab === 'DOCKERFILE'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  Dockerfile ({detectedVmRuntimeInfo?.mfitAssessment?.detectedRuntimePlugin || 'm2c'})
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveExtractPreviewTab('M2C_PLAN')
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                    activeExtractPreviewTab === 'M2C_PLAN'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  m2c migration-plan.yaml
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveExtractPreviewTab('KNATIVE_SKAFFOLD')
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                    activeExtractPreviewTab === 'KNATIVE_SKAFFOLD'
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                                  }`}
                                >
                                  service.knative.yaml + skaffold.yaml
                                </button>
                              </div>
                            </div>

                            {activeExtractPreviewTab === 'FILES' ? (
                              <div>
                                <div className="text-[10px] font-mono text-zinc-500 mb-1">
                                  Live Content of{' '}
                                  <span className="font-bold text-zinc-700 dark:text-zinc-200">
                                    {detectedVmRuntimeInfo.resolvedDir}/
                                    {migrateForm.primaryFileName}
                                  </span>{' '}
                                  (you can inspect or edit before hydrating into Cloud Run):
                                </div>
                                <textarea
                                  rows={5}
                                  value={migrateForm.primaryFilePreview}
                                  onChange={(e) =>
                                    setMigrateForm((prev) => ({
                                      ...prev,
                                      primaryFilePreview: e.target.value,
                                      extractedBundleB64: '', // use updated file content
                                    }))
                                  }
                                  className="w-full rounded-lg bg-zinc-950 text-emerald-300 border border-zinc-800 p-2.5 text-[11px] font-mono"
                                />
                              </div>
                            ) : activeExtractPreviewTab === 'M2C_PLAN' ? (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-mono text-zinc-500">
                                  Generated <strong>Migrate to Containers (m2c)</strong> plan at{' '}
                                  <span className="text-zinc-700 dark:text-zinc-200 font-bold">
                                    {detectedVmRuntimeInfo.stagingDir}/migration-plan.yaml
                                  </span>
                                  :
                                </div>
                                <pre className="w-full rounded-lg bg-zinc-950 text-amber-300 border border-zinc-800 p-2.5 text-[11px] font-mono overflow-x-auto max-h-48">
                                  {detectedVmRuntimeInfo?.m2cArtifacts?.migrationPlanYaml}
                                </pre>
                              </div>
                            ) : activeExtractPreviewTab === 'KNATIVE_SKAFFOLD' ? (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-mono text-zinc-500">
                                  Declarative <strong>Knative v1 + Skaffold CI/CD</strong> manifests at{' '}
                                  <span className="text-zinc-700 dark:text-zinc-200 font-bold">
                                    {detectedVmRuntimeInfo.stagingDir}/service.knative.yaml
                                  </span>
                                  :
                                </div>
                                <pre className="w-full rounded-lg bg-zinc-950 text-blue-300 border border-zinc-800 p-2.5 text-[11px] font-mono overflow-x-auto max-h-48">
                                  {`${detectedVmRuntimeInfo?.m2cArtifacts?.knativeServiceYaml || ''}\n---\n${detectedVmRuntimeInfo?.m2cArtifacts?.skaffoldYaml || ''}`}
                                </pre>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <div className="text-[10px] font-mono text-zinc-500">
                                  Staged on disk at{' '}
                                  <span className="text-zinc-700 dark:text-zinc-200 font-bold">
                                    {detectedVmRuntimeInfo.stagingDir}/Dockerfile
                                  </span>
                                  :
                                </div>
                                <pre className="w-full rounded-lg bg-zinc-950 text-blue-300 border border-zinc-800 p-2.5 text-[11px] font-mono overflow-x-auto">
                                  {detectedVmRuntimeInfo.generatedDockerfile}
                                </pre>
                              </div>
                            )}

                            {/* mfit 6-DIMENSION READINESS SCORECARD & "ON STEROIDS" AUTO-REMEDIATORS */}
                            {detectedVmRuntimeInfo?.mfitAssessment && (
                              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/35 space-y-2.5 text-xs">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-bold font-mono text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[11px]">
                                      mfit Score: {detectedVmRuntimeInfo.mfitAssessment.overallFitScore}/100
                                    </span>
                                    <span>
                                      GOOGLE mfit + m2c MODERNIZATION ENGINE ON STEROIDS (
                                      {detectedVmRuntimeInfo.mfitAssessment.verdict})
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                                    Runtime Plugin:{' '}
                                    <strong className="text-emerald-600 dark:text-emerald-400">
                                      {detectedVmRuntimeInfo.mfitAssessment.detectedRuntimePlugin}
                                    </strong>
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                                  {(detectedVmRuntimeInfo.mfitAssessment.dimensions || []).map(
                                    (dim) => (
                                      <div
                                        key={dim.id}
                                        className="p-2 rounded border bg-white/80 dark:bg-zinc-900/80 border-emerald-500/25"
                                      >
                                        <div className="flex items-center justify-between gap-1 font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">
                                          <span>{dim.label}</span>
                                          <span
                                            className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                                              dim.status === 'PASS'
                                                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                            }`}
                                          >
                                            {dim.status}
                                          </span>
                                        </div>
                                        <div className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                                          {dim.summary}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1.5 border-t border-emerald-500/25">
                                  <label className="inline-flex items-center gap-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(
                                        migrateForm.enableMultiContainerSidecar
                                      )}
                                      onChange={(e) =>
                                        setMigrateForm((prev) => ({
                                          ...prev,
                                          enableMultiContainerSidecar:
                                            e.target.checked,
                                        }))
                                      }
                                      className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>
                                      <strong>
                                        Multi-Container Sidecar Pod (
                                        <code>containers: [ingress, worker:9090]</code>)
                                      </strong>{' '}
                                      — Run background helper &amp; web server together sharing <code>127.0.0.1</code> &amp; <code>{migrateForm.diskMountPath}</code>
                                    </span>
                                  </label>

                                  <label className="inline-flex items-center gap-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(
                                        migrateForm.autoConvertCronToScheduler
                                      )}
                                      onChange={(e) =>
                                        setMigrateForm((prev) => ({
                                          ...prev,
                                          autoConvertCronToScheduler:
                                            e.target.checked,
                                        }))
                                      }
                                      className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span>
                                      <strong>
                                        Auto-Convert VM Cron → Cloud Run v2 Batch Job + Cloud Scheduler (
                                        {describeCronInPlainEnglish(
                                          migrateForm.cronScheduleExpression
                                        )}
                                        )
                                      </strong>{' '}
                                      — Deploys a native Cloud Run v2 Job (up to 24h timeout + shared FUSE disk) triggered via Scheduler <code>:run</code> API
                                    </span>
                                  </label>
                                </div>

                                {migrateForm.autoConvertCronToScheduler && (
                                  <VisualCronScheduleBuilder
                                    compact
                                    value={
                                      migrateForm.cronScheduleExpression ||
                                      '*/15 * * * *'
                                    }
                                    onChange={(newCron) =>
                                      setMigrateForm((prev) => ({
                                        ...prev,
                                        cronScheduleExpression: newCron,
                                      }))
                                    }
                                    label="Visual Schedule Picker for Migrated VM Cron Job (No Cron Syntax Needed)"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Stage 2: Cloud Run Target Configuration & Packaging Mode */}
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
                            Stage 2 · How to Attach / Package Extracted VM Disk Content
                          </label>
                          <select
                            value={migrateForm.migrationMode}
                            onChange={(e) =>
                              setMigrateForm((prev) => ({
                                ...prev,
                                migrationMode: e.target.value,
                              }))
                            }
                            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                          >
                            <option value="MOUNT_GCS_FUSE_DISK">
                              Attach Persistent Cloud Storage FUSE Disk (volumes[].gcs → {migrateForm.diskMountPath})
                            </option>
                            <option value="HYDRATE_VM_FILES">
                              Hydrate Extracted VM Files into Ephemeral RAM Volume (/workspace)
                            </option>
                            <option value="CUSTOM_IMAGE">
                              Deploy Container Image ({migrateForm.containerImage})
                            </option>
                          </select>
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
                              <option value="32Gi">32Gi</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            Target Cloud Run Region &amp; Max Scale
                          </label>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={migrateForm.region}
                              onChange={(e) =>
                                setMigrateForm((prev) => ({
                                  ...prev,
                                  region: e.target.value,
                                }))
                              }
                              title="Target Cloud Run Region (L4 GPU supported regions marked)"
                              className="w-2/3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            >
                              <option value="us-east1">
                                us-east1 (S. Carolina · CPU Only)
                              </option>
                              <option value="us-east4">
                                us-east4 (N. Virginia · L4 GPU Ready)
                              </option>
                              <option value="us-central1">
                                us-central1 (Iowa · L4 GPU Ready)
                              </option>
                              <option value="us-west1">
                                us-west1 (Oregon · CPU Only)
                              </option>
                              <option value="europe-west1">
                                europe-west1 (Belgium · L4 GPU Ready)
                              </option>
                              <option value="europe-west4">
                                europe-west4 (Netherlands · L4 GPU Ready)
                              </option>
                              <option value="asia-east1">
                                asia-east1 (Taiwan · L4 GPU Ready)
                              </option>
                              <option value="asia-northeast1">
                                asia-northeast1 (Tokyo · L4 GPU Ready)
                              </option>
                              <option value="asia-southeast1">
                                asia-southeast1 (Singapore · L4 GPU Ready)
                              </option>
                            </select>
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
                              className="w-1/3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                        </div>
                      </div>

                      {/* GCE MACHINE TYPE, HIGH-END GPU / TPU ACCELERATOR CONVERSION & REGION COMPATIBILITY GUARDRAILS */}
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/35 space-y-2.5 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="font-bold font-mono text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                            <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
                            <span>
                              GCE MACHINE FAMILY, GPU / TPU ACCELERATOR CONVERSION &amp; REGION COMPATIBILITY GUARDRAILS
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono uppercase text-zinc-500">
                              Test / Override Source Hardware Profile:
                            </span>
                            <select
                              value={migrateForm.simulatedHardwareScenario || 'AUTO'}
                              onChange={(e) => {
                                const val = e.target.value;
                                const needsGpu =
                                  val === 'HIGH_END_GPU_A100_H100' ||
                                  val === 'CLOUD_TPU_V5E_V6E' ||
                                  val === 'GCE_L4_GPU';
                                setMigrateForm((prev) => ({
                                  ...prev,
                                  simulatedHardwareScenario: val,
                                  enableCloudRunGpu: needsGpu
                                    ? true
                                    : prev.enableCloudRunGpu,
                                  cpu: needsGpu
                                    ? String(Math.max(4, Number(prev.cpu || 4)))
                                    : val === 'ULTRA_CPU_RAM'
                                    ? '8'
                                    : prev.cpu,
                                  memory: needsGpu
                                    ? ['16Gi', '32Gi'].includes(prev.memory)
                                      ? prev.memory
                                      : '16Gi'
                                    : val === 'ULTRA_CPU_RAM'
                                    ? '32Gi'
                                    : prev.memory,
                                }));
                              }}
                              className="bg-white dark:bg-zinc-900 border border-blue-500/40 rounded-lg px-2 py-1 text-[11px] font-mono text-zinc-900 dark:text-zinc-100"
                            >
                              <option value="AUTO">
                                Auto-Detected VM ({vm.machineType} in {vm.zone})
                              </option>
                              <option value="HIGH_END_GPU_A100_H100">
                                High-End GPU VM (a3-highgpu-8g H100 80GB / a2-highgpu A100)
                              </option>
                              <option value="CLOUD_TPU_V5E_V6E">
                                Cloud TPU VM (ct5lp-hightpu-4t TPU v5e / v6e Trillium)
                              </option>
                              <option value="GCE_L4_GPU">
                                GCE L4 GPU VM (g2-standard-8 · 1x NVIDIA L4 24GB)
                              </option>
                              <option value="ULTRA_CPU_RAM">
                                Ultra-Scale CPU VM (c3-standard-88 / n2-standard-64 · 64 vCPU / 256GB)
                              </option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                          {/* Card 1: Accelerator Conversion Matrix */}
                          <div
                            className={`p-2.5 rounded-lg border ${
                              migrateForm.simulatedHardwareScenario ===
                                'HIGH_END_GPU_A100_H100' ||
                              migrateForm.simulatedHardwareScenario ===
                                'CLOUD_TPU_V5E_V6E' ||
                              detectedVmRuntimeInfo
                                ?.acceleratorAndRegionGuardrails
                                ?.isHighEndGpuFamily ||
                              detectedVmRuntimeInfo
                                ?.acceleratorAndRegionGuardrails?.isTpuFamily
                                ? 'bg-amber-500/15 border-amber-500/45 text-amber-800 dark:text-amber-200'
                                : 'bg-white/70 dark:bg-zinc-900/70 border-blue-500/25 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                              1. GPU / TPU → Cloud Run L4 Conversion
                            </div>
                            {migrateForm.simulatedHardwareScenario ===
                              'CLOUD_TPU_V5E_V6E' ||
                            detectedVmRuntimeInfo
                              ?.acceleratorAndRegionGuardrails?.isTpuFamily ? (
                              <p className="leading-relaxed">
                                <strong>CRITICAL TPU LIMITATION:</strong> Cloud Run does{' '}
                                <strong>NOT</strong> support Cloud TPUs (<code>libtpu</code> /{' '}
                                <code>/dev/accel0</code>). To run on Cloud Run Gen2, convert the XLA backend from{' '}
                                <code>jax[tpu]</code> / <code>torch_xla</code> to{' '}
                                <strong>
                                  CUDA on 1x <code>nvidia-l4</code> (24 GB VRAM)
                                </strong>
                                , or keep multi-host TPU slices on GKE Autopilot.
                              </p>
                            ) : migrateForm.simulatedHardwareScenario ===
                                'HIGH_END_GPU_A100_H100' ||
                              detectedVmRuntimeInfo
                                ?.acceleratorAndRegionGuardrails
                                ?.isHighEndGpuFamily ? (
                              <p className="leading-relaxed">
                                <strong>HIGH-END GPU DOWN-CONVERSION:</strong> Source VM uses{' '}
                                <strong>A100 / H100 (80 GB HBM3)</strong>, but Cloud Run Gen2 only supports{' '}
                                <strong>
                                  1x <code>nvidia-l4</code> (24 GB GDDR6 VRAM)
                                </strong>{' '}
                                per instance. Models &gt;24 GB VRAM must be quantized (FP8 / AWQ INT4) to fit on L4, or deployed to GKE <code>a3-highgpu</code>.
                              </p>
                            ) : (
                              <p className="leading-relaxed">
                                Cloud Run Gen2 supports attaching{' '}
                                <strong>
                                  1x <code>nvidia-l4</code> GPU (24 GB VRAM)
                                </strong>{' '}
                                per container instance (requires minimum{' '}
                                <code>4 vCPU</code> &amp; <code>16 GiB RAM</code>). Any A100/H100 or TPU VM must convert to <code>nvidia-l4</code>.
                              </p>
                            )}
                          </div>

                          {/* Card 2: Region Compatibility Conflict Check */}
                          {(() => {
                            const isGpuRegionOk =
                              CLOUD_RUN_GPU_SUPPORTED_REGIONS.includes(
                                migrateForm.region
                              );
                            const nearestGpuReg =
                              getNearestGpuCompatibleRegion(migrateForm.region);
                            return (
                              <div
                                className={`p-2.5 rounded-lg border ${
                                  migrateForm.enableCloudRunGpu && !isGpuRegionOk
                                    ? 'bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-300'
                                    : 'bg-white/70 dark:bg-zinc-900/70 border-blue-500/25 text-zinc-700 dark:text-zinc-300'
                                }`}
                              >
                                <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                                  2. GPU Region &amp; Disk Co-Location Limit
                                </div>
                                {!isGpuRegionOk ? (
                                  <div className="space-y-1.5">
                                    <p className="leading-relaxed">
                                      <strong>
                                        REGION CONFLICT ({migrateForm.region}):
                                      </strong>{' '}
                                      Region <code>{migrateForm.region}</code> does{' '}
                                      <strong>NOT</strong> have Cloud Run{' '}
                                      <code>nvidia-l4</code> GPUs! Nearest GPU region is{' '}
                                      <strong>{nearestGpuReg}</strong>, and your{' '}
                                      <code>volumes[].gcs</code> disk bucket will also be provisioned in{' '}
                                      <strong>{nearestGpuReg}</strong> for $0 egress.
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setMigrateForm((prev) => ({
                                          ...prev,
                                          region: nearestGpuReg,
                                          enableCloudRunGpu: true,
                                          cpu: String(
                                            Math.max(4, Number(prev.cpu || 4))
                                          ),
                                          memory: ['16Gi', '32Gi'].includes(
                                            prev.memory
                                          )
                                            ? prev.memory
                                            : '16Gi',
                                        }))
                                      }
                                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[10px] cursor-pointer"
                                    >
                                      Auto-Switch Region &amp; Disk Bucket → {nearestGpuReg} (4 vCPU / 16Gi)
                                    </button>
                                  </div>
                                ) : (
                                  <p className="leading-relaxed">
                                    Target region <code>{migrateForm.region}</code> is{' '}
                                    <strong>Cloud Run L4 GPU Compatible</strong> (
                                    <code>{CLOUD_RUN_GPU_SUPPORTED_REGIONS.join(', ')}</code>
                                    ), and your <code>volumes[].gcs</code> disk bucket is co-located in{' '}
                                    <code>{migrateForm.region}</code>.
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {/* Card 3: vCPU / RAM Vertical Ceiling (8 vCPU / 32 GiB Max) */}
                          <div
                            className={`p-2.5 rounded-lg border ${
                              migrateForm.simulatedHardwareScenario ===
                                'ULTRA_CPU_RAM' ||
                              detectedVmRuntimeInfo
                                ?.acceleratorAndRegionGuardrails
                                ?.exceedsCloudRunCpuRamCeiling
                                ? 'bg-amber-500/15 border-amber-500/45 text-amber-800 dark:text-amber-200'
                                : 'bg-white/70 dark:bg-zinc-900/70 border-blue-500/25 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                              3. Per-Instance Ceiling (Max 8 vCPU / 32 GiB)
                            </div>
                            <p className="leading-relaxed">
                              Cloud Run Gen2 caps a single container instance at{' '}
                              <strong>8 vCPU &amp; 32 GiB RAM</strong>. If migrating a large vertical GCE VM (e.g., 32–88 vCPUs), Cloud Run replaces vertical scale-up with horizontal scale-out (<code>0 → {migrateForm.maxInstances}</code> instances of 8 vCPU / 32 GiB).
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-500/20">
                          <label className="inline-flex items-center gap-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(migrateForm.enableCloudRunGpu)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const nearestReg = checked
                                  ? getNearestGpuCompatibleRegion(
                                      migrateForm.region
                                    )
                                  : migrateForm.region;
                                setMigrateForm((prev) => ({
                                  ...prev,
                                  enableCloudRunGpu: checked,
                                  region: nearestReg,
                                  cpu: checked
                                    ? String(Math.max(4, Number(prev.cpu || 4)))
                                    : prev.cpu,
                                  memory: checked
                                    ? ['16Gi', '32Gi'].includes(prev.memory)
                                      ? prev.memory
                                      : '16Gi'
                                    : prev.memory,
                                }));
                              }}
                              className="rounded border-blue-400 text-blue-600 focus:ring-blue-500"
                            />
                            <span>
                              <strong>
                                Convert &amp; Attach Cloud Run Gen2 GPU (
                                <code>1x nvidia-l4 · 24 GB VRAM</code>)
                              </strong>{' '}
                              — Auto-enforces min <code>4 vCPU / 16Gi RAM</code> &amp; switches region to nearest GPU-supported region (
                              <code>
                                {getNearestGpuCompatibleRegion(migrateForm.region)}
                              </code>
                              )
                            </span>
                          </label>
                        </div>
                      </div>

                      {migrateForm.migrationMode === 'MOUNT_GCS_FUSE_DISK' && (
                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/30 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                            <div className="font-bold text-blue-600 dark:text-blue-400">
                              PERSISTENT CLOUD RUN GEN2 DISK MOUNT (volumes[].gcs via Cloud Storage FUSE)
                            </div>
                            {(detectedVmRuntimeInfo?.attachedGceDisks || []).length >
                              0 && (
                              <span className="text-[11px] text-zinc-500">
                                Source GCE Disk:{' '}
                                {detectedVmRuntimeInfo.attachedGceDisks
                                  .map(
                                    (d) =>
                                      `${d.sourceDiskName} (${d.diskSizeGb}GB ${d.diskType})`
                                  )
                                  .join(', ')}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                                Persistent Disk Bucket (Auto-Created in {migrateForm.region})
                              </label>
                              <input
                                type="text"
                                value={migrateForm.diskBucketName}
                                onChange={(e) =>
                                  setMigrateForm((prev) => ({
                                    ...prev,
                                    diskBucketName: e.target.value
                                      .toLowerCase()
                                      .replace(/[^a-z0-9-]/g, '-'),
                                  }))
                                }
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                                Container Volume Mount Path
                              </label>
                              <input
                                type="text"
                                value={migrateForm.diskMountPath}
                                onChange={(e) =>
                                  setMigrateForm((prev) => ({
                                    ...prev,
                                    diskMountPath: e.target.value,
                                  }))
                                }
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                                Disk Access Mode
                              </label>
                              <select
                                value={migrateForm.diskReadOnly ? 'RO' : 'RW'}
                                onChange={(e) =>
                                  setMigrateForm((prev) => ({
                                    ...prev,
                                    diskReadOnly: e.target.value === 'RO',
                                  }))
                                }
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              >
                                <option value="RW">
                                  Read / Write (Shared POSIX Disk across 0→1000 instances)
                                </option>
                                <option value="RO">
                                  Read-Only (Immutable Disk Mount)
                                </option>
                              </select>
                            </div>
                          </div>

                          {/* LARGE DISK (e.g. 2 TB GCE Disk) & CLOUD STORAGE FUSE ARCHITECTURAL GUARDRAILS */}
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/35 space-y-2.5 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="font-bold font-mono text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                                <span>
                                  LARGE GCE DISK &amp; CLOUD STORAGE FUSE GUARDRAILS (100 GB – 2 TB+ DISK LIMITS)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                                <span className="px-2 py-0.5 rounded-full bg-zinc-900/80 text-zinc-100">
                                  Provisioned Disk:{' '}
                                  {detectedVmRuntimeInfo?.diskMigrationGuardrails
                                    ?.totalProvisionedDiskGb || 15}{' '}
                                  GB ($
                                  {detectedVmRuntimeInfo?.diskMigrationGuardrails
                                    ?.provisionedGceMonthlyUsd ?? '1.50'}
                                  /mo GCE PD)
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                                  Target Dir Used:{' '}
                                  {(
                                    (detectedVmRuntimeInfo?.diskMigrationGuardrails
                                      ?.targetDirSizeBytes || 4096) / 1024
                                  ).toFixed(1)}{' '}
                                  KB (
                                  {detectedVmRuntimeInfo?.diskMigrationGuardrails
                                    ?.targetDirFileCount || 1}{' '}
                                  files)
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                              {(
                                detectedVmRuntimeInfo?.diskMigrationGuardrails
                                  ?.architecturalWarnings || [
                                  {
                                    id: 'LARGE_DISK_TRANSFER_BOTTLENECK',
                                    severity: 'WARNING',
                                    title:
                                      '1. What if this VM has a 2 TB Disk? (50 MB Browser Cap vs. Direct Andromeda Rsync)',
                                    detail:
                                      'Browser-mediated SSH extraction is capped at 50 MB so a 2 TB disk never crashes local RAM or times out HTTP. For 100 GB – 2 TB+ disks, enable "Direct VM → GCS Andromeda Parallel Rsync" below to stream directly from the VM to GCS at 20–100 Gbps ($0 regional egress).',
                                  },
                                  {
                                    id: 'POSIX_LOCK_AND_DATABASE_WARNING',
                                    severity: 'WARNING',
                                    title:
                                      '2. Object FUSE vs. Block Storage (No SQLite / PostgreSQL / MySQL on volumes[].gcs)',
                                    detail:
                                      'Cloud Storage FUSE has ~10–30 ms first-byte latency and no cross-instance POSIX file locks (flock/fcntl). Use volumes[].gcs for media, web assets, and blobs (up to Petabytes)—never for transactional database files (/var/lib/mysql, PG_VERSION, .sqlite).',
                                  },
                                  {
                                    id: 'CLOUD_RUN_MEMORY_CACHE_AND_SMALL_FILES',
                                    severity: 'INFO',
                                    title:
                                      '3. Cloud Run 32 GiB RAM Ceiling & Small-File Metadata Overhead',
                                    detail:
                                      'Cloud Run Gen2 caps container RAM at 32 GiB (shared with GCS FUSE metadata cache). Avoid mounting millions of tiny files (raw node_modules or .git) on FUSE; bake static dependencies into the container image and keep data/uploads on the mounted disk.',
                                  },
                                  {
                                    id: 'PROVISIONED_VS_USED_COST_MATH',
                                    severity: 'INFO',
                                    title:
                                      '4. 2 TB Provisioned Disk Cost Trap ($204.80/mo GCE PD vs. Pay-Per-Byte GCS FUSE)',
                                    detail:
                                      'A 2 TB (2,048 GB) GCE pd-balanced disk bills $204.80/mo even if 99% empty. On Cloud Run volumes[].gcs, you pay $0.020/GB/mo ONLY for actual bytes stored ($40.96/mo if all 2 TB are full—80% cheaper—or <$0.01/mo if only a few MB are used).',
                                  },
                                ]
                              ).map((w) => (
                                <div
                                  key={w.id}
                                  className={`p-2 rounded border ${
                                    w.severity === 'CRITICAL'
                                      ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300'
                                      : 'bg-white/70 dark:bg-zinc-900/70 border-amber-500/25 text-zinc-700 dark:text-zinc-300'
                                  }`}
                                >
                                  <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">
                                    {w.title}
                                  </div>
                                  <div className="leading-relaxed text-[11px]">
                                    {w.detail}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
                              <label className="inline-flex items-center gap-2 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={Boolean(migrateForm.useDirectVmGcsRsync)}
                                  onChange={(e) =>
                                    setMigrateForm((prev) => ({
                                      ...prev,
                                      useDirectVmGcsRsync: e.target.checked,
                                    }))
                                  }
                                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                                />
                                <span>
                                  <strong>
                                    Direct VM → GCS Andromeda Parallel Sync (
                                    <code>gcloud storage rsync -r</code>)
                                  </strong>{' '}
                                  — Bypass browser 50 MB limit &amp; stream large disks directly from VM to{' '}
                                  <code>gs://{migrateForm.diskBucketName}</code> at 20+ Gbps
                                </span>
                              </label>

                              {onRunInShell && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onRunInShell(
                                      `gcloud compute ssh ${vm.name} --zone=${vm.zone} --project=${projectId} --command="gcloud storage rsync -r ${migrateForm.targetPath || '/var/www/html'} gs://${migrateForm.diskBucketName} || gsutil -m rsync -r ${migrateForm.targetPath || '/var/www/html'} gs://${migrateForm.diskBucketName}"`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-semibold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                                >
                                  <Terminal className="w-3 h-3" />
                                  <span>Run Direct 20Gbps VM→GCS Rsync in Shell</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {migrateForm.migrationMode === 'CUSTOM_IMAGE' && (
                        <div>
                          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                            Container Image URI (Artifact Registry / GCR / Docker Hub)
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
                      )}

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
                          {onRunInShell && detectedVmRuntimeInfo?.cloudBuildCliCommand && (
                            <button
                              type="button"
                              onClick={() =>
                                onRunInShell(
                                  detectedVmRuntimeInfo.cloudBuildCliCommand
                                )
                              }
                              title="Build a permanent Docker image from the extracted VM directory via Google Cloud Build (gcloud builds submit) and deploy to Cloud Run"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 cursor-pointer"
                            >
                              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Build Image via Cloud Build in Shell</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={migratingToCloudRun || !migrateForm.serviceName}
                            onClick={() => handleExecuteVmToCloudRunMigration(vm)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {migratingToCloudRun ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                            <span>
                              {migratingToCloudRun
                                ? `Hydrating VM Files & Deploying ${migrateForm.serviceName}...`
                                : `Migrate Extracted VM Content → Cloud Run Now`}
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
                              Live Migrated Endpoint:{' '}
                              <a
                                href={migrationResult.uri}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-blue-600 dark:text-blue-400 font-bold"
                              >
                                {migrationResult.uri}
                              </a>
                              {migrationResult.mountedDiskBucket && (
                                <span>
                                  {' '}
                                  · Attached Persistent Disk:{' '}
                                  <strong>
                                    gs://{migrationResult.mountedDiskBucket}
                                  </strong>{' '}
                                  mounted at{' '}
                                  <strong>{migrationResult.diskMountPath}</strong> (
                                  {migrationResult.syncedDiskFilesCount} file(s) synced)
                                </span>
                              )}
                              {migrationResult.multiContainerSidecarDeployed && (
                                <span>
                                  {' '}
                                  · <strong>2-Container Sidecar Pod Active</strong>
                                </span>
                              )}
                              {migrationResult.cloudSchedulerJobName && (
                                <span>
                                  {' '}
                                  · <strong>Cloud Scheduler: {migrationResult.cloudSchedulerJobName}</strong>
                                </span>
                              )}
                              {migrationResult.canaryVerification && (
                                <span className="inline-block ml-1.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px]">
                                  Canary Probe: HTTP {migrationResult.canaryVerification.httpStatus} ({migrationResult.canaryVerification.latencyMs}ms) Verified
                                </span>
                              )}
                              {migrationResult.vmStopped
                                ? ` · Source VM ${vm.name} automatically STOPPED.`
                                : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {migrationResult.vmStopped && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await handlePowerAction(vm, 'START');
                                  setActiveSshVm(vm);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs cursor-pointer"
                                title={`Start stopped VM "${vm.name}" and reconnect Xterm.js SSH`}
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Restart VM &amp; Open SSH</span>
                              </button>
                            )}
                            {onSelectTab && migrationResult.mountedDiskBucket && (
                              <button
                                type="button"
                                onClick={() => onSelectTab('CLOUD_STORAGE')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                              >
                                <HardDrive className="w-3 h-3" />
                                <span>Inspect Disk Bucket</span>
                              </button>
                            )}
                            {onSelectTab && (
                              <button
                                type="button"
                                onClick={() => onSelectTab('CLOUD_RUN')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
                              >
                                <span>Open Cloud Run Fleet &amp; Jobs</span>
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
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-red-500 bg-red-500/10 border border-red-500/25 px-3 py-1 rounded-full">
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

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handlePowerAction(vm, 'DELETE')}
                            className="inline-flex items-center gap-1 bg-[#d93025] hover:bg-[#b31412] text-white px-2.5 py-1 rounded-md text-xs font-semibold transition-colors shadow-sm disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete VM</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Wide Right Interactive Web-SSH & Visual SCP/SFTP Studio (Default 8/12 = 67%) */}
          <div
            className={`${
              sshTerminalExpanded
                ? 'xl:col-span-12 order-1'
                : openMigrateCloudRunVm || openTunnelVm || splitLayoutMode === '6_6'
                ? 'xl:col-span-6'
                : splitLayoutMode === '5_7'
                ? 'xl:col-span-7'
                : 'xl:col-span-8'
            } w-full transition-all duration-200`}
          >
            <XtermWebSshTerminal
              projectId={projectId}
              activeVm={activeSshVm}
              vms={vms}
              onSelectVm={(vm) => setActiveSshVm(vm)}
              onVmPowerAction={handlePowerAction}
              onOpenMigrateVm={handleToggleMigrateVm}
              onSelectTab={onSelectTab}
              powerBusyVm={powerBusyVm}
              pendingOps={pendingOps}
              defaultUsername={userShort || 'ubuntu'}
              isExpanded={sshTerminalExpanded}
              onToggleExpand={() => setSshTerminalExpanded((prev) => !prev)}
              onDisconnect={() => setActiveSshVm(null)}
              onFetchSerialConsole={handleFetchSerialConsole}
              serialConsoleOutput={serialConsoleOutput}
              serialLoading={serialLoading}
              openScpTrigger={openScpTrigger}
              scpTargetVmName={scpTargetVmName}
            />
          </div>
          </div>
        </div>
      )}
    </div>
  );
}

