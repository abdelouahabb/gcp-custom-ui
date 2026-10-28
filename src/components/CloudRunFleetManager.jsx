import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Cpu,
  Globe,
  Lock,
  Unlock,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Copy,
  Check,
  Sliders,
  GitBranch,
  Trash2,
  AlertTriangle,
  Zap,
  Terminal,
  Layers,
  Rocket,
  Network,
  HardDrive,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import XtermWebSshTerminal from './XtermWebSshTerminal';
import LocalDevTunnelBar from './LocalDevTunnelBar';
import VisualCronScheduleBuilder, {
  describeCronInPlainEnglish,
} from './VisualCronScheduleBuilder';

const QUICK_TEMPLATES = [
  {
    label: 'Hello Cloud Run (Request-based · $0 Idle)',
    namePrefix: 'hello-run',
    image: 'us-docker.pkg.dev/cloudrun/container/hello',
    port: 8080,
    cpu: '1',
    memory: '512Mi',
    minInstances: 0,
    maxInstances: 5,
    billingMode: 'REQUEST_BASED',
    gpuCount: 0,
    gpuType: 'nvidia-l4',
  },
  {
    label: 'Always-On Worker (Instance-based Billing)',
    namePrefix: 'worker-run',
    image: 'gcr.io/google-samples/hello-app:1.0',
    port: 8080,
    cpu: '1',
    memory: '512Mi',
    minInstances: 0,
    maxInstances: 5,
    billingMode: 'INSTANCE_BASED',
    gpuCount: 0,
    gpuType: 'nvidia-l4',
  },
  {
    label: 'AI GPU Inference (NVIDIA L4 · 4vCPU/16Gi)',
    namePrefix: 'gpu-ai-run',
    image: 'us-docker.pkg.dev/cloudrun/container/hello',
    port: 8080,
    cpu: '4',
    memory: '16Gi',
    minInstances: 0,
    maxInstances: 3,
    billingMode: 'INSTANCE_BASED',
    gpuCount: 1,
    gpuType: 'nvidia-l4',
  },
];

export default function CloudRunFleetManager({
  projectId,
  initialServices = [],
  onOpenProvisionCloudRun,
  onOpenSecretManagerStudio,
  onSelectTab,
  onRefreshOverview,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [services, setServices] = useState(initialServices);
  const [loading, setLoading] = useState(false);
  const [quickDeploying, setQuickDeploying] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Per-service interactive drawer state: { [serviceId]: 'TUNE' | 'TRAFFIC' | 'CONVERT_GKE' | null }
  const [openDrawer, setOpenDrawer] = useState({});
  // Per-service edit form state
  const [editForms, setEditForms] = useState({});
  // Per-service traffic split form state
  const [trafficForms, setTrafficForms] = useState({});
  // Per-service Cloud Run -> GKE Graduation state
  const [gkeConvertForms, setGkeConvertForms] = useState({});
  const [gkeClusters, setGkeClusters] = useState([]);
  const [projectVpcs, setProjectVpcs] = useState(['default']);
  const [projectBuckets, setProjectBuckets] = useState([]);
  const [serviceAccounts, setServiceAccounts] = useState([]);
  const [selectedQuickSa, setSelectedQuickSa] = useState('');
  const [defaultComputeSaMissing, setDefaultComputeSaMissing] = useState(false);
  const [showGlobalGkeTranspiler, setShowGlobalGkeTranspiler] = useState(false);
  // Per-service transitional busy state: { [serviceId]: 'UPDATING' | 'DELETING' | 'IAM' | 'IAP' | 'TRAFFIC' | 'GRADUATING_GKE' | 'TIME_MACHINE' }
  const [busyMap, setBusyMap] = useState({});
  // Per-service App Engine-Style 1-Click Cloud IAP state: { [serviceId]: { loading, data, accessorsInput, steps, error } }
  const [iapStateMap, setIapStateMap] = useState({});
  // Per-service Revision Time-Machine & Crash-Loop Autopsy state: { [serviceId]: { loading, selectedRevision, report, error } }
  const [revisionAutopsyMap, setRevisionAutopsyMap] = useState({});
  // 2-step delete confirmation + smart associated resource cleanup options
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleteCleanupOpts, setDeleteCleanupOpts] = useState({
    deleteAssociatedScheduler: true,
    deleteCompanionRunJob: false,
    deleteAttachedDiskBucket: false,
  });
  // Dead Container (Artifact Registry) & Cloud Storage Artifact Hunter state
  const [showArtifactHunter, setShowArtifactHunter] = useState(false);
  const [artifactScanState, setArtifactScanState] = useState({
    loading: false,
    data: null,
    error: null,
  });
  const [artifactHunterTab, setArtifactHunterTab] = useState('CONTAINERS'); // 'CONTAINERS' | 'STORAGE'
  const [artifactHunterSearch, setArtifactHunterSearch] = useState('');
  const [artifactOnlyDead, setArtifactOnlyDead] = useState(false);
  const [artifactActionBusy, setArtifactActionBusy] = useState(null);
  const [deletingArtifactsMap, setDeletingArtifactsMap] = useState({});
  // App Engine Service & Version Exterminator + Default Service $0/mo Neutralizer state
  const [showAppEngineExterminator, setShowAppEngineExterminator] = useState(false);
  const [appEngineState, setAppEngineState] = useState({
    loading: false,
    data: null,
    error: null,
  });
  const [appEngineActionBusy, setAppEngineActionBusy] = useState(null);
  const [appEngineMigrateIapMap, setAppEngineMigrateIapMap] = useState({});
  const [showRawTombstoneMetadata, setShowRawTombstoneMetadata] = useState(false);

  // Google Cloud SDK 590.0.0 GA `gcloud run compose up` Multi-Container & Sidecar Studio state
  const [showComposeStudio, setShowComposeStudio] = useState(false);
  const [composeYamlText, setComposeYamlText] = useState(`name: cloudpulse-compose-stack
services:
  web:
    image: us-docker.pkg.dev/cloudrun/container/hello:latest
    ports:
      - "8080:8080"
    environment:
      REDIS_HOST: "127.0.0.1"
      REDIS_PORT: "6379"
      STACK_MODE: "gcloud-run-compose-ga"
    depends_on:
      - redis-cache
    volumes:
      - shared-ram:/data
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: "512Mi"
    x-google-cloudrun:
      ingress-container: true

  redis-cache:
    image: mirror.gcr.io/library/redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - shared-ram:/data
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: "512Mi"

volumes:
  shared-ram:`);
  const [composeRegion, setComposeRegion] = useState('us-central1');
  const [composeAllowUnauthenticated, setComposeAllowUnauthenticated] = useState(true);
  const [composeEnableDirectIap, setComposeEnableDirectIap] = useState(false);
  const [composeMinInstances, setComposeMinInstances] = useState(0);
  const [composeMaxInstances, setComposeMaxInstances] = useState(10);
  const [composeExportServiceId, setComposeExportServiceId] = useState('');
  const [composeActionBusy, setComposeActionBusy] = useState(null);
  const [composeResult, setComposeResult] = useState(null);
  const [composeError, setComposeError] = useState(null);

  // Cloud Scheduler -> Cloud Run v2 Jobs Converter & Parallel Batch Studio state
  const [showSchedulerToJobsStudio, setShowSchedulerToJobsStudio] =
    useState(false);
  const [schedulerJobsState, setSchedulerJobsState] = useState({
    loading: false,
    data: null,
    error: null,
  });
  const [jobConvertForm, setJobConvertForm] = useState({
    jobName: 'nightly-etl-run-job',
    region: 'us-east1',
    sourceSchedulerJobName: '',
    sourceSchedulerRegion: '',
    sourceServiceUrl: '',
    schedule: '*/15 * * * *',
    timeZone: 'Etc/UTC',
    containerImage: 'mirror.gcr.io/library/python:3.12-slim',
    inlinePythonScript: '',
    cpu: '1',
    memory: '512Mi',
    taskCount: 4,
    maxRetries: 3,
    taskTimeoutSec: 3600,
    attachPersistentDisk: true,
    diskBucketName: `${projectId}-jobdisk-batch`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 60),
    diskMountPath: '/mnt/gce-disk',
    enableCloudRunGpu: false,
    rewireCloudScheduler: true,
    executeImmediately: true,
  });
  const [convertingToJob, setConvertingToJob] = useState(false);
  const [jobConversionResult, setJobConversionResult] = useState(null);
  const [jobConversionError, setJobConversionError] = useState(null);
  const [runningJobMap, setRunningJobMap] = useState({});

  useEffect(() => {
    if (Array.isArray(initialServices) && initialServices.length > 0 && services.length === 0) {
      setServices(initialServices);
    }
  }, [initialServices, services.length]);

  const fetchCloudRunFleet = useCallback(
    async (silent = false) => {
      if (!projectId) return;
      if (!silent) setLoading(true);
      try {
        const [res, gkeRes, ovRes, saRes] = await Promise.all([
          axios.get(`/api/project/${encodeURIComponent(projectId)}/cloudrun`),
          axios
            .get(
              `/api/project/${encodeURIComponent(projectId)}/wave9/gke-vertex`
            )
            .catch(() => ({ data: { clusters: [] } })),
          axios
            .get(`/api/project/${encodeURIComponent(projectId)}/overview`)
            .catch(() => ({ data: { resources: [] } })),
          axios
            .get(
              `/api/project/${encodeURIComponent(projectId)}/service-accounts`
            )
            .catch(() => ({ data: { serviceAccounts: [] } })),
        ]);
        const saList =
          saRes.data?.serviceAccounts || saRes.data?.accounts || [];
        if (Array.isArray(saList)) {
          setServiceAccounts(saList);
          setDefaultComputeSaMissing(Boolean(saRes.data?.defaultComputeSaMissing));
          if (saRes.data?.recommendedServiceAccount) {
            setSelectedQuickSa((prev) => prev || saRes.data.recommendedServiceAccount);
          } else if (saList.length > 0) {
            const firstActive = saList.find((sa) => !sa.disabled) || saList[0];
            if (firstActive?.email) {
              setSelectedQuickSa((prev) => prev || firstActive.email);
            }
          }
        }
        if (Array.isArray(gkeRes.data?.clusters)) {
          setGkeClusters(gkeRes.data.clusters);
        }
        const ovResources = ovRes.data?.resources || [];
        const vpcs = ovResources
          .filter((r) => r.type === 'VPC Network' && r.name)
          .map((r) => r.name);
        if (vpcs.length > 0) setProjectVpcs(vpcs);
        const buckets = ovResources
          .filter((r) => r.type === 'Cloud Storage Bucket' && r.name)
          .map((r) => r.name);
        if (buckets.length > 0) setProjectBuckets(buckets);
        if (Array.isArray(res.data?.services)) {
          setServices(res.data.services);
          // Clear DELETING state for services that have finished deprovisioning
          setBusyMap((prev) => {
            const next = { ...prev };
            const currentIds = new Set(res.data.services.map((s) => s.id));
            Object.keys(next).forEach((id) => {
              if (next[id] === 'DELETING' && !currentIds.has(id)) {
                delete next[id];
              }
            });
            return next;
          });
        }
      } catch {
        // ignore silent poll errors
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [projectId]
  );

  const refreshServiceAccountsOnly = useCallback(async () => {
    if (!projectId) return;
    try {
      const saRes = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/service-accounts?refresh=true`
      );
      const saList = saRes.data?.serviceAccounts || saRes.data?.accounts || [];
      setServiceAccounts(saList);
      setDefaultComputeSaMissing(Boolean(saRes.data?.defaultComputeSaMissing));
      if (saRes.data?.recommendedServiceAccount) {
        setSelectedQuickSa((prev) => prev || saRes.data.recommendedServiceAccount);
      }
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    fetchCloudRunFleet(false);
  }, [fetchCloudRunFleet]);

  // Auto-poll every 3.5s while any service is reconciling or has a pending operation
  const hasActiveOps =
    Object.keys(busyMap).length > 0 ||
    services.some((s) => s.reconciling || s.status === 'DEPLOYING');

  useEffect(() => {
    if (!hasActiveOps) return undefined;
    const timer = setInterval(() => {
      fetchCloudRunFleet(true);
    }, 3500);
    return () => clearInterval(timer);
  }, [hasActiveOps, fetchCloudRunFleet]);

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const buildGkeGraduationBundle = (srv, cfg = {}) => {
    const k8sName = String(srv.name || 'cloudrun-app')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const namespace = cfg.namespace || 'production';
    const image = srv.containerImage || 'us-docker.pkg.dev/cloudrun/container/hello';
    const port = Number(srv.containerPort || 8080);
    const cpu = String(srv.cpu || '1');
    const memory = String(srv.memory || '512Mi');
    const minReplicas = Math.max(1, Number(srv.minInstances || 2));
    const maxReplicas = Math.max(minReplicas + 1, Number(srv.maxInstances || 10));
    const gpuCount = Number(srv.gpuCount || 0);
    const gpuType = srv.gpuType || 'nvidia-l4';
    const enableSpot = cfg.enableSpot !== false;
    const enableZeroTrustNetPol = cfg.enableZeroTrustNetPol !== false;
    const enableShmRamDisk = cfg.enableShmRamDisk !== false;
    const enableHpaPdb = cfg.enableHpaPdb !== false;
    const enableWorkloadIdentity = cfg.enableWorkloadIdentity !== false;
    const isInternalLoadBalancer =
      srv.ingress === 'INGRESS_TRAFFIC_INTERNAL_ONLY';

    // Translate attached Cloud Run 2026 Storage Volumes (GCS FUSE / In-Memory / NFS) into native GKE volumes
    const volType = srv.storageVolumeType || 'NONE';
    const volName = (srv.storageVolumeName || 'cloudrun-vol-1')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-');
    const volMountPath = srv.storageMountPath || '/mnt/storage';

    const k8sVolumeEntries = [];
    const k8sMountEntries = [];
    if (enableShmRamDisk) {
      k8sVolumeEntries.push(
        `        - name: dshm-ram\n          emptyDir:\n            medium: Memory\n            sizeLimit: 8Gi`
      );
      k8sMountEntries.push(
        `            - mountPath: /dev/shm\n              name: dshm-ram`
      );
    }
    if (volType === 'GCS_BUCKET' && srv.storageGcsBucket) {
      k8sVolumeEntries.push(
        `        - name: ${volName}\n          csi:\n            driver: gcsfuse.csi.storage.gke.io\n            readOnly: ${Boolean(
          srv.storageReadOnly
        )}\n            volumeAttributes:\n              bucketName: "${
          srv.storageGcsBucket
        }"`
      );
      k8sMountEntries.push(
        `            - mountPath: ${volMountPath}\n              name: ${volName}\n              readOnly: ${Boolean(
          srv.storageReadOnly
        )}`
      );
    } else if (volType === 'IN_MEMORY') {
      k8sVolumeEntries.push(
        `        - name: ${volName}\n          emptyDir:\n            medium: Memory\n            sizeLimit: ${
          srv.storageMemorySizeLimit || '1Gi'
        }`
      );
      k8sMountEntries.push(
        `            - mountPath: ${volMountPath}\n              name: ${volName}`
      );
    } else if (volType === 'NFS_FILESTORE' && srv.storageNfsServer) {
      k8sVolumeEntries.push(
        `        - name: ${volName}\n          nfs:\n            server: "${
          srv.storageNfsServer
        }"\n            path: "${
          srv.storageNfsPath || '/vol1'
        }"\n            readOnly: ${Boolean(srv.storageReadOnly)}`
      );
      k8sMountEntries.push(
        `            - mountPath: ${volMountPath}\n              name: ${volName}\n              readOnly: ${Boolean(
          srv.storageReadOnly
        )}`
      );
    }

    const volumesBlock =
      k8sVolumeEntries.length > 0
        ? `\n      volumes:\n${k8sVolumeEntries.join('\n')}`
        : '';
    const volumeMountsBlock =
      k8sMountEntries.length > 0
        ? `\n          volumeMounts:\n${k8sMountEntries.join('\n')}`
        : '';

    const envYamlLines =
      Array.isArray(srv.envVars) && srv.envVars.length > 0
        ? `\n          env:\n` +
          srv.envVars
            .map(
              (e) =>
                `            - name: "${e.name}"\n              value: "${String(
                  e.value || ''
                ).replace(/"/g, '\\"')}"`
            )
            .join('\n')
        : '';

    // 1. Raw Knative YAML (What Google Cloud Console exports)
    const rawKnativeYaml = `# Standard Google Cloud Console Export (Knative serving.knative.dev/v1 ONLY)
# Cannot run on standard Kubernetes without Knative Serving + lacks HPA, PDB, NetworkPolicy, Spot GPU & /dev/shm
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: ${k8sName}
  annotations:
    run.googleapis.com/ingress: ${srv.ingress || 'all'}
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "${srv.minInstances ?? 0}"
        autoscaling.knative.dev/maxScale: "${srv.maxInstances ?? 10}"
        run.googleapis.com/cpu-throttling: "${srv.cpuIdle !== false}"
    spec:
      containerConcurrency: ${srv.concurrency || 80}
      timeoutSeconds: ${srv.timeoutSeconds || 300}
      containers:
        - image: ${image}
          ports:
            - containerPort: ${port}
          resources:
            limits:
              cpu: "${cpu}"
              memory: "${memory}"${
      gpuCount > 0 ? `\n              nvidia.com/gpu: "${gpuCount}"` : ''
    }`;

    // 2. Full 6-Resource Production GKE Kubernetes Bundle
    const k8sBundleYaml = `# ============================================================================
# CloudPulse 2026: Cloud Run (${k8sName}) → Production GKE Kubernetes Bundle
# Source Cloud Run Service : ${srv.name} (${srv.region})
# Active Container Image   : ${image}
# Unlocks: ${enableSpot ? 'Spot VM/GPU (-68% Cost) · ' : ''}${
      enableHpaPdb ? 'HPA v2 + PDB HA · ' : ''
    }${enableZeroTrustNetPol ? 'Seccomp + NetworkPolicy · ' : ''}${
      enableShmRamDisk ? '8Gi /dev/shm RAM Disk' : ''
    }
# ============================================================================
apiVersion: v1
kind: Namespace
metadata:
  name: ${namespace}
  labels:
    managed-by: cloudpulse-2026
    graduated-from: cloud-run
${
  enableWorkloadIdentity
    ? `---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${k8sName}-sa
  namespace: ${namespace}
  annotations:
    iam.gke.io/gcp-service-account: "${
      srv.serviceAccount || `${k8sName}-sa@${projectId}.iam.gserviceaccount.com`
    }"
`
    : ''
}---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${k8sName}
  namespace: ${namespace}
  labels:
    app: ${k8sName}
    graduated-from: cloud-run
spec:
  replicas: ${minReplicas}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ${k8sName}
  template:
    metadata:
      labels:
        app: ${k8sName}${
      volType === 'GCS_BUCKET'
        ? `\n      annotations:\n        gke-gcsfuse/volumes: "true"`
        : ''
    }
    spec:${
      enableWorkloadIdentity
        ? `\n      serviceAccountName: ${k8sName}-sa`
        : ''
    }${
      enableSpot || gpuCount > 0
        ? `\n      nodeSelector:${
            enableSpot ? `\n        cloud.google.com/gke-spot: "true"` : ''
          }${
            gpuCount > 0
              ? `\n        cloud.google.com/gke-accelerator: "${gpuType}"`
              : ''
          }\n      tolerations:\n        - key: "cloud.google.com/gke-spot"\n          operator: "Equal"\n          value: "true"\n          effect: "NoSchedule"${
            gpuCount > 0
              ? `\n        - key: "nvidia.com/gpu"\n          operator: "Exists"\n          effect: "NoSchedule"`
              : ''
          }`
        : ''
    }
      securityContext:
        seccompProfile:
          type: RuntimeDefault
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: ${k8sName}${volumesBlock}
      containers:
        - name: ${k8sName}
          image: ${image}
          ports:
            - containerPort: ${port}
              protocol: TCP${envYamlLines}${volumeMountsBlock}
          readinessProbe:
            tcpSocket:
              port: ${port}
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            tcpSocket:
              port: ${port}
            initialDelaySeconds: 15
            periodSeconds: 20
          resources:
            requests:
              cpu: "${cpu}"
              memory: "${memory}"${
      gpuCount > 0 ? `\n              nvidia.com/gpu: "${gpuCount}"` : ''
    }
            limits:
              cpu: "${cpu}"
              memory: "${memory}"${
      gpuCount > 0 ? `\n              nvidia.com/gpu: "${gpuCount}"` : ''
    }
---
apiVersion: v1
kind: Service
metadata:
  name: ${k8sName}-svc
  namespace: ${namespace}${
      isInternalLoadBalancer
        ? `\n  annotations:\n    networking.gke.io/load-balancer-type: "Internal"`
        : ''
    }
spec:
  type: LoadBalancer
  selector:
    app: ${k8sName}
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: ${port}${
      enableHpaPdb
        ? `
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${k8sName}-hpa
  namespace: ${namespace}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${k8sName}
  minReplicas: ${minReplicas}
  maxReplicas: ${maxReplicas}
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 120
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: ${k8sName}-pdb
  namespace: ${namespace}
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: ${k8sName}`
        : ''
    }${
      enableZeroTrustNetPol
        ? `
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ${k8sName}-zero-trust-netpol
  namespace: ${namespace}
spec:
  podSelector:
    matchLabels:
      app: ${k8sName}
  policyTypes:
    - Ingress
  ingress:
    - ports:
        - protocol: TCP
          port: ${port}`
        : ''
    }`;

    // 3. FinOps Cost Math (24/7 equivalent for minReplicas warm instances)
    const cpuNum = Number(cpu) || 1;
    const memGb = String(memory).includes('Mi')
      ? parseFloat(memory) / 1024
      : parseFloat(memory) || 0.5;
    const gpuHrRun = gpuCount > 0 ? 0.67 * gpuCount : 0;
    const cloudRunSingleHr = cpuNum * 0.0864 + memGb * 0.009 + gpuHrRun;
    const cloudRunMonthly = Math.round(cloudRunSingleHr * minReplicas * 730);
    const gkeAutopilotMonthly = Math.round(cloudRunMonthly * 0.58); // -42% vs Cloud Run instance billing
    const gkeSpotMonthly = Math.round(cloudRunMonthly * 0.32); // -68% on GKE Spot VM / Spot GPU nodes

    return {
      k8sBundleYaml,
      rawKnativeYaml,
      cloudRunMonthly,
      gkeAutopilotMonthly,
      gkeSpotMonthly,
      monthlySavingsSpot: Math.max(0, cloudRunMonthly - gkeSpotMonthly),
      minReplicas,
      maxReplicas,
    };
  };

  const toggleServiceDrawer = (srv, mode) => {
    const current = openDrawer[srv.id];
    if (current === mode) {
      setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }));
      return;
    }
    setOpenDrawer((prev) => ({ ...prev, [srv.id]: mode }));

    if (mode === 'TUNE') {
      const hasGpu = Number(srv.gpuCount || 0) > 0;
      setEditForms((prev) => ({
        ...prev,
        [srv.id]: {
          serviceAccount: srv.serviceAccount || selectedQuickSa || '',
          containerImage: srv.containerImage,
          containerPort: srv.containerPort || 8080,
          cpu: srv.cpu || '1',
          memory: srv.memory || '512Mi',
          billingMode:
            srv.billingMode ||
            (srv.cpuIdle !== false ? 'REQUEST_BASED' : 'INSTANCE_BASED'),
          cpuIdle: srv.cpuIdle !== false,
          gpuAccelerator: hasGpu ? srv.gpuType || 'nvidia-l4' : 'NONE',
          gpuZonalRedundancy: Boolean(srv.gpuZonalRedundancy),
          startupCpuBoost: Boolean(srv.startupCpuBoost),
          minInstances: srv.minInstances ?? 0,
          maxInstances: srv.maxInstances ?? 10,
          concurrency: srv.concurrency ?? 80,
          timeoutSeconds: srv.timeoutSeconds ?? 300,
          ingress: srv.ingress || 'INGRESS_TRAFFIC_ALL',
          executionEnvironment:
            srv.executionEnvironment || 'EXECUTION_ENVIRONMENT_GEN2',
          enableDirectVpc: Boolean(srv.enableDirectVpc),
          vpcNetwork: srv.vpcNetwork || projectVpcs[0] || 'default',
          vpcSubnetwork: srv.vpcSubnetwork || 'default',
          vpcEgress: srv.vpcEgress || 'PRIVATE_RANGES_ONLY',
          vpcNetworkTags: srv.vpcNetworkTags || 'cloud-run-egress',
          storageVolumeType: srv.storageVolumeType || 'NONE',
          storageVolumeName: srv.storageVolumeName || 'cloudrun-vol-1',
          storageMountPath:
            srv.storageMountPath ||
            (srv.storageVolumeType === 'IN_MEMORY'
              ? '/mnt/ramdisk'
              : srv.storageVolumeType === 'NFS_FILESTORE'
              ? '/mnt/nfs'
              : '/mnt/gcs'),
          storageGcsBucket:
            srv.storageGcsBucket || projectBuckets[0] || '',
          storageReadOnly: Boolean(srv.storageReadOnly),
          storageMemorySizeLimit: srv.storageMemorySizeLimit || '1Gi',
          storageNfsServer: srv.storageNfsServer || '10.0.0.2',
          storageNfsPath: srv.storageNfsPath || '/vol1',
          envVarsText: (srv.envVars || [])
            .map((e) => `${e.name}=${e.value}`)
            .join('\n'),
        },
      }));
    } else if (mode === 'TRAFFIC') {
      const secondRev = srv.revisions?.[1]?.shortName || '';
      setTrafficForms((prev) => ({
        ...prev,
        [srv.id]: {
          targetRevision: 'LATEST',
          canaryRevision: secondRev,
          canaryPercent: 0,
        },
      }));
      const crashedRev = (srv.revisions || []).find(
        (r) => r.healthStatus === 'CRASHED'
      );
      const defaultRev =
        crashedRev?.shortName ||
        srv.revisions?.[0]?.shortName ||
        srv.latestCreatedRevision ||
        srv.latestReadyRevision;
      if (defaultRev) {
        handleFetchRevisionAutopsy(srv, defaultRev);
      }
    } else if (mode === 'IAP') {
      handleInspectServiceIap(srv);
    } else if (mode === 'CONVERT_GKE') {
      const defaultCluster = gkeClusters[0]?.name || '';
      const defaultLoc = gkeClusters[0]?.location || srv.region || 'us-central1';
      setGkeConvertForms((prev) => ({
        ...prev,
        [srv.id]: prev[srv.id] || {
          namespace: 'production',
          targetCluster: defaultCluster,
          targetLocation: defaultLoc,
          createAutopilotCluster: gkeClusters.length === 0,
          newClusterName: `${srv.name}-gke-autopilot`,
          enableSpot: true,
          enableZeroTrustNetPol: true,
          enableShmRamDisk: true,
          enableHpaPdb: true,
          enableWorkloadIdentity: true,
          manifestViewMode: 'K8S_BUNDLE', // K8S_BUNDLE | KNATIVE_CONSOLE
        },
      }));
    }
  };

  const handleFetchRevisionAutopsy = async (srv, revisionName) => {
    if (!projectId || !srv || !revisionName) return;
    setRevisionAutopsyMap((prev) => ({
      ...prev,
      [srv.id]: {
        ...(prev[srv.id] || {}),
        loading: true,
        selectedRevision: revisionName,
        error: null,
      },
    }));
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(
          srv.region || 'us-central1'
        )}/${encodeURIComponent(srv.name)}/revisions/${encodeURIComponent(
          revisionName
        )}/autopsy`
      );
      setRevisionAutopsyMap((prev) => ({
        ...prev,
        [srv.id]: {
          loading: false,
          selectedRevision: revisionName,
          report: res.data,
          error: null,
        },
      }));
    } catch (err) {
      setRevisionAutopsyMap((prev) => ({
        ...prev,
        [srv.id]: {
          ...(prev[srv.id] || {}),
          loading: false,
          selectedRevision: revisionName,
          error:
            err.response?.data?.error ||
            err.message ||
            `Failed to load autopsy for ${revisionName}`,
        },
      }));
    }
  };

  const handleTimeMachineRestore = async (
    srv,
    { targetRevision, mode = 'INSTANT_TRAFFIC_PIN', fixPayload = {} }
  ) => {
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'TIME_MACHINE' }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(
          srv.region || 'us-central1'
        )}/${encodeURIComponent(srv.name)}/time-machine-restore`,
        {
          targetRevision,
          mode,
          fixPayload,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Executed Time-Machine restore (${mode}) on ${srv.name}!`
        );
      }
      await fetchCloudRunFleet(true);
      if (onRefreshOverview) onRefreshOverview();
      if (targetRevision) {
        handleFetchRevisionAutopsy(srv, targetRevision);
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Time-Machine restore failed on ${srv.name}`
        );
      }
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
    }
  };


  const handleGraduateServiceToGke = async (srv) => {
    const cfg = gkeConvertForms[srv.id] || {};
    const bundle = buildGkeGraduationBundle(srv, cfg);
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'GRADUATING_GKE' }));
    try {
      const selectedClusterObj = gkeClusters.find(
        (c) => c.name === cfg.targetCluster
      );
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(
          srv.region || 'us-central1'
        )}/${encodeURIComponent(srv.name)}/convert-to-gke`,
        {
          gkeCluster: cfg.targetCluster,
          gkeLocation:
            selectedClusterObj?.location ||
            cfg.targetLocation ||
            srv.region ||
            'us-central1',
          namespace: cfg.namespace || 'production',
          manifestYaml: bundle.k8sBundleYaml,
          createAutopilotCluster: Boolean(cfg.createAutopilotCluster),
          newClusterName: cfg.newClusterName || `${srv.name}-gke-autopilot`,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Graduated Cloud Run service ${srv.name} to GKE Kubernetes!`
        );
      }
      await fetchCloudRunFleet(true);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to graduate ${srv.name} to GKE.`
        );
      }
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
    }
  };


  const handleQuickDeployTemplate = async (tpl) => {
    if (quickDeploying) return;
    const suffix = Math.floor(100 + Math.random() * 899);
    const serviceName = `${tpl.namePrefix}-${suffix}`;
    setQuickDeploying(tpl.label);
    const hasGpu = Number(tpl.gpuCount || 0) > 0;
    const billingMode = hasGpu
      ? 'INSTANCE_BASED'
      : tpl.billingMode || 'REQUEST_BASED';
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType: 'CLOUD_RUN',
          name: serviceName,
          region: 'us-east1',
          config: {
            serviceAccount: selectedQuickSa,
            containerImage: tpl.image,
            containerPort: tpl.port,
            cpu: tpl.cpu,
            memory: tpl.memory,
            minInstances: tpl.minInstances,
            maxInstances: tpl.maxInstances,
            concurrency: 80,
            timeoutSeconds: 300,
            ingress: 'INGRESS_TRAFFIC_ALL',
            executionEnvironment: 'EXECUTION_ENVIRONMENT_GEN2',
            allowUnauthenticated: true,
            billingMode,
            cpuIdle: billingMode === 'REQUEST_BASED' && !hasGpu,
            gpuCount: hasGpu ? 1 : 0,
            gpuType: tpl.gpuType || 'nvidia-l4',
            gpuZonalRedundancy: false,
            startupCpuBoost: true,
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Deployed Cloud Run service ${serviceName}!`
        );
      }
      await fetchCloudRunFleet(false);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to deploy Cloud Run template.'
        );
      }
    } finally {
      setQuickDeploying(null);
    }
  };

  const handleSaveTuneConfig = async (srv) => {
    const form = editForms[srv.id];
    if (!form) return;
    const hasGpu = form.gpuAccelerator && form.gpuAccelerator !== 'NONE';
    const billingMode = hasGpu
      ? 'INSTANCE_BASED'
      : form.billingMode || 'REQUEST_BASED';
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'UPDATING' }));
    try {
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}`,
        {
          ...form,
          billingMode,
          cpuIdle: billingMode === 'REQUEST_BASED' && !hasGpu,
          gpuCount: hasGpu ? 1 : 0,
          gpuType: hasGpu ? form.gpuAccelerator : 'nvidia-l4',
          gpuZonalRedundancy: Boolean(form.gpuZonalRedundancy),
          envVars: form.envVarsText,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Updated Cloud Run service ${srv.name}!`
        );
      }
      setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }));
      await fetchCloudRunFleet(true);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to update ${srv.name}`
        );
      }
    } finally {
      setTimeout(() => {
        setBusyMap((prev) => {
          const next = { ...prev };
          delete next[srv.id];
          return next;
        });
      }, 2500);
    }
  };

  const handleSealSecretsInSecretManager = async (srv, envNames = []) => {
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'SEALING_SECRETS' }));
    try {
      const currentForm = editForms[srv.id];
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}/seal-secrets`,
        {
          envNames: Array.isArray(envNames) ? envNames : [],
          ...(currentForm?.envVarsText !== undefined
            ? { inlineEnvVars: currentForm.envVarsText }
            : {}),
        }
      );
      const sealedSet = new Set(
        (res.data?.sealedSecrets || []).map((s) => s.envName)
      );
      if (currentForm && sealedSet.size > 0) {
        const remainingLines = String(currentForm.envVarsText || '')
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .filter((pair) => {
            const eqIdx = pair.indexOf('=');
            const k = eqIdx > 0 ? pair.slice(0, eqIdx).trim() : pair;
            return !sealedSet.has(k);
          });
        setEditForms((prev) => ({
          ...prev,
          [srv.id]: {
            ...prev[srv.id],
            envVarsText: remainingLines.join('\n'),
          },
        }));
      }
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Sealed plaintext env var(s) into Secret Manager on ${srv.name}!`
        );
      }
      await fetchCloudRunFleet(true);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to seal plaintext secrets into Secret Manager for ${srv.name}`
        );
      }
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
    }
  };

  const handleInspectServiceIap = async (srv) => {
    if (!projectId || !srv) return;
    setIapStateMap((prev) => ({
      ...prev,
      [srv.id]: {
        ...(prev[srv.id] || {}),
        loading: true,
        error: null,
      },
    }));
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}/iap`
      );
      const suggested =
        res.data?.suggestedAccessors?.length > 0
          ? res.data.suggestedAccessors.join(', ')
          : res.data?.activeAccount
          ? `user:${res.data.activeAccount}`
          : '';
      setIapStateMap((prev) => ({
        ...prev,
        [srv.id]: {
          loading: false,
          data: res.data,
          accessorsInput: prev[srv.id]?.accessorsInput || suggested,
          steps: prev[srv.id]?.steps || [],
          error: null,
        },
      }));
    } catch (err) {
      setIapStateMap((prev) => ({
        ...prev,
        [srv.id]: {
          ...(prev[srv.id] || {}),
          loading: false,
          error:
            err.response?.data?.error ||
            err.message ||
            `Failed to inspect Cloud IAP state for ${srv.name}`,
        },
      }));
    }
  };

  const handleToggleServiceIap = async (
    srv,
    targetEnabled,
    customAccessorsText = null
  ) => {
    if (!projectId || !srv) return;
    const rawAccText =
      customAccessorsText !== null
        ? customAccessorsText
        : iapStateMap[srv.id]?.accessorsInput || '';
    const accessors = String(rawAccText || '')
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    setBusyMap((prev) => ({ ...prev, [srv.id]: 'IAP' }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}/iap`,
        {
          enabled: Boolean(targetEnabled),
          accessors,
          oauthClientId: iapStateMap[srv.id]?.oauthClientId || '',
          oauthClientSecret: iapStateMap[srv.id]?.oauthClientSecret || '',
        }
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      setIapStateMap((prev) => ({
        ...prev,
        [srv.id]: {
          ...(prev[srv.id] || {}),
          loading: false,
          steps: res.data?.steps || [],
          error: null,
        },
      }));
      await Promise.all([
        fetchCloudRunFleet(true),
        handleInspectServiceIap(srv),
      ]);
    } catch (err) {
      if (err?.__cancelledByUser || String(err?.message || '').includes('cancelled')) {
        return;
      }
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to configure Cloud IAP for ${srv.name}`
        );
      }
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
    }
  };

  const handleTogglePublicIam = async (srv) => {
    const nextPublic = !srv.allowUnauthenticated;
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'IAM' }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}/iam`,
        {
          allowUnauthenticated: nextPublic,
        }
      );
      if (onShowToast) {
        onShowToast(res.data?.message);
      }
      await fetchCloudRunFleet(true);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to update IAM policy for ${srv.name}`
        );
      }
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
    }
  };


  const handleApplyTraffic = async (srv, overrideRevision = null) => {
    const tf = trafficForms[srv.id] || {};
    const targetRevision = overrideRevision || tf.targetRevision || 'LATEST';
    const canaryPercent = overrideRevision ? 0 : Number(tf.canaryPercent || 0);
    const canaryRevision = overrideRevision ? '' : tf.canaryRevision || '';

    setBusyMap((prev) => ({ ...prev, [srv.id]: 'TRAFFIC' }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/${encodeURIComponent(srv.region)}/${encodeURIComponent(
          srv.name
        )}/traffic`,
        {
          targetRevision,
          canaryPercent,
          canaryRevision,
        }
      );
      if (onShowToast) {
        onShowToast(res.data?.message);
      }
      setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }));
      await fetchCloudRunFleet(true);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to update traffic routing on ${srv.name}`
        );
      }
    } finally {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
    }
  };


  const handleDeleteService = async (srv) => {
    const attachedBkt =
      srv.persistentDiskBuckets?.[0] || srv.storageGcsBucket || '';
    setConfirmDeleteId(null);
    setBusyMap((prev) => ({ ...prev, [srv.id]: 'DELETING' }));
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(projectId)}/resource`,
        {
          headers: {
            'x-confirmed-delete': 'true',
          },
          data: {
            confirmedByModal: true,
            resourceType: 'Cloud Run Service',
            name: srv.name,
            region: srv.region,
            deleteAssociatedScheduler: Boolean(
              deleteCleanupOpts.deleteAssociatedScheduler
            ),
            deleteCompanionRunJob: Boolean(
              deleteCleanupOpts.deleteCompanionRunJob
            ),
            deleteAttachedDiskBucket: Boolean(
              deleteCleanupOpts.deleteAttachedDiskBucket
            ),
            attachedDiskBucketName: attachedBkt,
          },
        }
      );
      setServices((prev) =>
        prev.filter((s) => s.id !== srv.id && s.name !== srv.name)
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Deleted Cloud Run service ${srv.name}.`
        );
      }
      await fetchCloudRunFleet(true);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      setBusyMap((prev) => {
        const next = { ...prev };
        delete next[srv.id];
        return next;
      });
      if (!err?.__cancelledByUser && onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to delete Cloud Run service ${srv.name}`
        );
      }
    }
  };

  const handleScanDeadArtifacts = useCallback(
    async (silent = false) => {
      if (!projectId) return;
      if (!silent) {
        setArtifactScanState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));
      }
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/cloudrun/dead-artifacts-scan`
        );
        setArtifactScanState({
          loading: false,
          data: res.data,
          error: null,
        });
        // Prune deletingArtifactsMap entries that have fully vanished from GCP
        const liveKeys = new Set();
        (res.data?.containerImages || []).forEach((img) => {
          if (img.uri) liveKeys.add(`img:${img.uri}`);
          if (img.name) liveKeys.add(`img:${img.name}`);
        });
        (res.data?.storageArtifacts || []).forEach((obj) => {
          if (obj.id) liveKeys.add(`gcs:${obj.id}`);
        });
        (res.data?.storageBuckets || []).forEach((b) => {
          if (b.name) liveKeys.add(`bucket:${b.name}`);
        });
        setDeletingArtifactsMap((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            if (!liveKeys.has(k)) {
              delete next[k];
            }
          });
          return next;
        });
      } catch (err) {
        if (!silent) {
          setArtifactScanState({
            loading: false,
            data: null,
            error:
              err.response?.data?.error ||
              err.message ||
              'Failed to scan Artifact Registry & Cloud Storage artifacts.',
          });
        }
      }
    },
    [projectId]
  );

  const scheduleFollowUpArtifactRescans = useCallback(() => {
    setTimeout(() => handleScanDeadArtifacts(true), 4000);
    setTimeout(() => handleScanDeadArtifacts(true), 11000);
  }, [handleScanDeadArtifacts]);

  const handleToggleArtifactHunter = () => {
    const nextOpen = !showArtifactHunter;
    setShowArtifactHunter(nextOpen);
    if (nextOpen && !artifactScanState.data && !artifactScanState.loading) {
      handleScanDeadArtifacts(false);
    }
  };

  const handleDeleteDeadContainerImage = async (img) => {
    if (!img || !img.isDead) return;
    const keyUri = img.uri ? `img:${img.uri}` : null;
    const keyName = img.name ? `img:${img.name}` : null;
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave9/supply-chain/delete-image`,
        {
          name: img.name,
          uri: img.uri,
          tags: img.tags || [],
        },
        {
          __onGatekeeperConfirmed: () => {
            setArtifactActionBusy(`img:${img.uri || img.name}`);
            setDeletingArtifactsMap((prev) => ({
              ...prev,
              ...(keyUri ? { [keyUri]: true } : {}),
              ...(keyName ? { [keyName]: true } : {}),
            }));
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Deleted dead container image ${img.shortPackage} from Artifact Registry.`
        );
      }
      await handleScanDeadArtifacts(true);
      scheduleFollowUpArtifactRescans();
    } catch (err) {
      setDeletingArtifactsMap((prev) => {
        const next = { ...prev };
        if (keyUri) delete next[keyUri];
        if (keyName) delete next[keyName];
        return next;
      });
      if (!err?.__cancelledByUser && err?.response?.status !== 499 && onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to delete dead container image.'
        );
      }
    } finally {
      setArtifactActionBusy(null);
    }
  };

  const handleSweepAllDeadContainers = async (deadImagesList = []) => {
    if (!Array.isArray(deadImagesList) || deadImagesList.length === 0) return;
    const batchMap = {};
    deadImagesList.forEach((img) => {
      if (img.uri) batchMap[`img:${img.uri}`] = true;
      if (img.name) batchMap[`img:${img.name}`] = true;
    });
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave9/supply-chain/sweep-orphans`,
        {
          orphans: deadImagesList.map((img) => ({
            name: img.name,
            uri: img.uri,
            tags: img.tags || [],
          })),
        },
        {
          __onGatekeeperConfirmed: () => {
            setArtifactActionBusy('SWEEP_ALL_CONTAINERS');
            setDeletingArtifactsMap((prev) => ({ ...prev, ...batchMap }));
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Swept ${deadImagesList.length} dead container image(s) from Artifact Registry!`
        );
      }
      await handleScanDeadArtifacts(true);
      scheduleFollowUpArtifactRescans();
    } catch (err) {
      setDeletingArtifactsMap((prev) => {
        const next = { ...prev };
        Object.keys(batchMap).forEach((k) => delete next[k]);
        return next;
      });
      if (!err?.__cancelledByUser && err?.response?.status !== 499 && onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to sweep dead container images.'
        );
      }
    } finally {
      setArtifactActionBusy(null);
    }
  };

  const handleDeleteSingleGcsArtifact = async (obj) => {
    if (!obj?.bucket || !obj?.name) return;
    const objKey = `gcs:${obj.id}`;
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          obj.bucket
        )}/objects?objectName=${encodeURIComponent(obj.name)}`,
        {
          __onGatekeeperConfirmed: () => {
            setArtifactActionBusy(objKey);
            setDeletingArtifactsMap((prev) => ({ ...prev, [objKey]: true }));
          },
          data: {
            objectName: obj.name,
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Deleted artifact gs://${obj.bucket}/${obj.name}.`
        );
      }
      await handleScanDeadArtifacts(true);
      scheduleFollowUpArtifactRescans();
    } catch (err) {
      setDeletingArtifactsMap((prev) => {
        const next = { ...prev };
        delete next[objKey];
        return next;
      });
      if (!err?.__cancelledByUser && err?.response?.status !== 499 && onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to delete Cloud Storage artifact.'
        );
      }
    } finally {
      setArtifactActionBusy(null);
    }
  };

  const handlePurgeGcsArtifacts = async (objectsToPurge = []) => {
    if (!Array.isArray(objectsToPurge) || objectsToPurge.length === 0) return;
    const batchMap = {};
    objectsToPurge.forEach((o) => {
      if (o.id) batchMap[`gcs:${o.id}`] = true;
    });
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/dead-artifacts-purge-gcs`,
        {
          objects: objectsToPurge.map((o) => ({
            bucket: o.bucket,
            name: o.name,
          })),
        },
        {
          __onGatekeeperConfirmed: () => {
            setArtifactActionBusy('PURGE_ALL_GCS');
            setDeletingArtifactsMap((prev) => ({ ...prev, ...batchMap }));
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Purged ${objectsToPurge.length} Cloud Storage artifact object(s)!`
        );
      }
      await handleScanDeadArtifacts(true);
      scheduleFollowUpArtifactRescans();
    } catch (err) {
      setDeletingArtifactsMap((prev) => {
        const next = { ...prev };
        Object.keys(batchMap).forEach((k) => delete next[k]);
        return next;
      });
      if (!err?.__cancelledByUser && err?.response?.status !== 499 && onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to purge Cloud Storage artifacts.'
        );
      }
    } finally {
      setArtifactActionBusy(null);
    }
  };

  const handleEmptyAndDeleteStagingBucket = async (bucketName) => {
    if (!bucketName) return;
    const bKey = `bucket:${bucketName}`;
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(bucketName)}/empty-and-delete`,
        {},
        {
          __onGatekeeperConfirmed: () => {
            setArtifactActionBusy(bKey);
            setDeletingArtifactsMap((prev) => ({ ...prev, [bKey]: true }));
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Emptied and deleted staging bucket gs://${bucketName}.`
        );
      }
      await handleScanDeadArtifacts(true);
      scheduleFollowUpArtifactRescans();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      setDeletingArtifactsMap((prev) => {
        const next = { ...prev };
        delete next[bKey];
        return next;
      });
      if (!err?.__cancelledByUser && onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to empty and delete bucket gs://${bucketName}.`
        );
      }
    } finally {
      setArtifactActionBusy(null);
    }
  };

  const handleFetchAppEngineOverview = useCallback(
    async (silent = false) => {
      if (!projectId) return;
      if (!silent) {
        setAppEngineState((prev) => ({ ...prev, loading: true, error: null }));
      }
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/appengine/overview`
        );
        setAppEngineState({
          loading: false,
          data: res.data,
          error: null,
        });
      } catch (err) {
        setAppEngineState((prev) => ({
          ...prev,
          loading: false,
          error:
            err.response?.data?.error ||
            err.message ||
            'Failed to inspect App Engine application & services.',
        }));
      }
    },
    [projectId]
  );

  const handleToggleAppEngineExterminator = () => {
    setShowAppEngineExterminator((prev) => {
      const next = !prev;
      if (next && !appEngineState.data && !appEngineState.loading) {
        handleFetchAppEngineOverview(false);
      }
      return next;
    });
  };

  const handleExecuteAppEngineAction = async (actionKey, payload) => {
    setAppEngineActionBusy(actionKey);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/appengine/action`,
        payload
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Executed App Engine action ${payload?.action} on ${projectId}.`
        );
      }
      await handleFetchAppEngineOverview(true);
      if (payload?.action === 'MIGRATE_TO_CLOUD_RUN') {
        await fetchCloudRunFleet(true);
      }
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (!err?.__cancelledByUser && onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to execute App Engine action (${payload?.action}).`
        );
      }
    } finally {
      setAppEngineActionBusy(null);
    }
  };

  const handleExecuteComposeAction = async (action, extraPayload = {}) => {
    setComposeActionBusy(action);
    setComposeError(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/cloudrun/compose`,
        {
          action,
          composeYaml: composeYamlText,
          region: composeRegion,
          allowUnauthenticated: composeAllowUnauthenticated,
          enableDirectIap: composeEnableDirectIap,
          minInstances: composeMinInstances,
          maxInstances: composeMaxInstances,
          ...extraPayload,
        }
      );
      if (action === 'EXPORT_SERVICE_TO_COMPOSE' && res.data?.exportedComposeYaml) {
        setComposeYamlText(res.data.exportedComposeYaml);
      }
      setComposeResult(res.data);
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Executed Cloud Run Compose action (${action}) on ${projectId}.`
        );
      }
      if (action === 'DEPLOY_COMPOSE_UP') {
        await fetchCloudRunFleet(true);
        if (onRefreshOverview) onRefreshOverview();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        `Failed to execute Cloud Run Compose action (${action}).`;
      setComposeError(errMsg);
      if (!err?.__cancelledByUser && onShowError) {
        onShowError(errMsg);
      }
    } finally {
      setComposeActionBusy(null);
    }
  };

  const handleFetchSchedulerAndJobs = useCallback(
    async (silent = false) => {
      if (!projectId) return;
      if (!silent) {
        setSchedulerJobsState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));
      }
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/cloudrun/scheduler-and-jobs`
        );
        const data = res.data || {};
        setSchedulerJobsState({
          loading: false,
          data,
          error: null,
        });
        // Auto-populate form from the first fragile scheduler job if not yet customized
        const firstFragile = (data.schedulerJobs || []).find(
          (sj) => !sj.isAlreadyCloudRunJobTrigger
        );
        if (firstFragile && firstFragile.recommendedJobSpec) {
          const spec = firstFragile.recommendedJobSpec;
          setJobConvertForm((prev) =>
            prev.sourceSchedulerJobName
              ? prev
              : {
                  ...prev,
                  jobName: spec.jobName || prev.jobName,
                  region: spec.region || prev.region,
                  sourceSchedulerJobName: firstFragile.name,
                  sourceSchedulerRegion: firstFragile.region,
                  sourceServiceUrl: firstFragile.targetUri || '',
                  schedule: firstFragile.schedule || prev.schedule,
                  timeZone: firstFragile.timeZone || prev.timeZone,
                  containerImage: spec.containerImage || prev.containerImage,
                  cpu: spec.cpu || prev.cpu,
                  memory: spec.memory || prev.memory,
                  diskBucketName: spec.diskBucketName || prev.diskBucketName,
                }
          );
        }
      } catch (err) {
        setSchedulerJobsState((prev) => ({
          ...prev,
          loading: false,
          error:
            err.response?.data?.error ||
            err.message ||
            'Failed to scan Cloud Scheduler & Cloud Run v2 Jobs.',
        }));
      }
    },
    [projectId]
  );

  const handleToggleSchedulerToJobsStudio = () => {
    setShowSchedulerToJobsStudio((prev) => {
      const next = !prev;
      if (next && !schedulerJobsState.data && !schedulerJobsState.loading) {
        handleFetchSchedulerAndJobs(false);
      }
      return next;
    });
  };

  const handleLoadSchedulerIntoJobForm = (sj) => {
    const spec = sj.recommendedJobSpec || {};
    setJobConversionResult(null);
    setJobConversionError(null);
    setJobConvertForm((prev) => ({
      ...prev,
      jobName: spec.jobName || `${sj.name}-job`,
      region: spec.region || sj.region || 'us-east1',
      sourceSchedulerJobName: sj.name,
      sourceSchedulerRegion: sj.region,
      sourceServiceUrl: sj.targetUri || '',
      schedule: sj.schedule || '*/15 * * * *',
      timeZone: sj.timeZone || 'Etc/UTC',
      containerImage:
        spec.containerImage || 'mirror.gcr.io/library/python:3.12-slim',
      cpu: spec.cpu || '1',
      memory: spec.memory || '512Mi',
      diskBucketName: spec.diskBucketName || prev.diskBucketName,
    }));
  };

  const handleLoadServiceIntoJobForm = (srv) => {
    if (!srv) return;
    setShowSchedulerToJobsStudio(true);
    if (!schedulerJobsState.data && !schedulerJobsState.loading) {
      handleFetchSchedulerAndJobs(false);
    }
    setJobConversionResult(null);
    setJobConversionError(null);
    const cleanName = `${String(srv.name || 'service')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .slice(0, 38)}-batch-job`;
    setJobConvertForm((prev) => ({
      ...prev,
      jobName: cleanName,
      region: srv.region || 'us-east1',
      sourceSchedulerJobName: `${srv.name}-cron`,
      sourceSchedulerRegion: srv.region || 'us-east1',
      sourceServiceUrl: srv.uri || '',
      containerImage:
        srv.containerImage || 'mirror.gcr.io/library/python:3.12-slim',
      cpu: srv.cpu || '1',
      memory: srv.memory || '512Mi',
      attachPersistentDisk:
        (srv.persistentDiskBuckets || []).length > 0 ||
        Boolean(srv.storageGcsBucket),
      diskBucketName:
        srv.persistentDiskBuckets?.[0] ||
        srv.storageGcsBucket ||
        `${projectId}-jobdisk-${srv.name}`
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .slice(0, 60),
    }));
  };

  const handleConvertSchedulerToJob = async () => {
    setConvertingToJob(true);
    setJobConversionError(null);
    setJobConversionResult(null);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/convert-scheduler-to-job`,
        jobConvertForm
      );
      setJobConversionResult(res.data);
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      await handleFetchSchedulerAndJobs(true);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      const errMsg =
        err.response?.data?.error ||
        err.message ||
        'Failed to convert Cloud Scheduler job into Cloud Run v2 Job.';
      setJobConversionError(errMsg);
      if (onShowError) onShowError(errMsg);
    } finally {
      setConvertingToJob(false);
    }
  };

  const handleRunCloudRunJobNow = async (jb) => {
    const key = `${jb.region}/${jb.name}`;
    setRunningJobMap((prev) => ({ ...prev, [key]: 'RUNNING' }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/jobs/${encodeURIComponent(jb.region)}/${encodeURIComponent(
          jb.name
        )}/run`
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      await handleFetchSchedulerAndJobs(true);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to execute Cloud Run Job ${jb.name}.`
        );
      }
    } finally {
      setRunningJobMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleDeleteCloudRunJob = async (jb) => {
    const key = `${jb.region}/${jb.name}`;
    setRunningJobMap((prev) => ({ ...prev, [key]: 'DELETING' }));
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloudrun/jobs/${encodeURIComponent(jb.region)}/${encodeURIComponent(
          jb.name
        )}`
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      await handleFetchSchedulerAndJobs(true);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            `Failed to delete Cloud Run Job ${jb.name}.`
        );
      }
    } finally {
      setRunningJobMap((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  return (
    <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-5">
      {/* Header: Top Title & Primary Actions + Structured 6-Module Workbench Bar */}
      <div className="space-y-3.5 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
                <Rocket className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                Cloud Run Serverless Command Center ({services.length} Services)
              </h3>
              <span className="text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                run.googleapis.com/v2 · GEN2
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Deploy containers, tune live autoscaling (Min/Max instances, CPU,
              Memory, Concurrency), toggle Public/IAM access, and split traffic
              across revisions on{' '}
              <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                {projectId}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-feature-id="CLOUDRUN_SYNC_FLEET"
              onClick={() => fetchCloudRunFleet(false)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loading || hasActiveOps
                    ? 'animate-spin text-zinc-500 dark:text-zinc-400'
                    : ''
                }`}
              />
              <span>Sync Cloud Run</span>
            </button>

            <button
              type="button"
              data-feature-id="CLOUDRUN_CREATE_JOB_BTN"
              onClick={() => {
                setShowSchedulerToJobsStudio(true);
                if (!schedulerJobsState.data && !schedulerJobsState.loading) {
                  handleFetchSchedulerAndJobs(false);
                }
              }}
              className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-md px-3.5 py-2 text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>+ Create Cloud Run Job</span>
            </button>

            <button
              type="button"
              data-feature-id="CLOUDRUN_DEPLOY_SERVICE_BTN"
              onClick={onOpenProvisionCloudRun}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md px-3.5 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Deploy Cloud Run Service</span>
            </button>
          </div>
        </div>

        {/* 6-Module Serverless Workbench & Migration Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2 pt-1">
          {onSelectTab && (
            <button
              type="button"
              data-feature-id="VM_MIGRATE_TO_CLOUD_RUN"
              onClick={() => onSelectTab('VM_SSH')}
              title="Open GCE VM -> Cloud Run Gen2 Modernization Engine (mfit 6-Dimension Readiness Scorecard + m2c Runtime Analyzer + Persistent volumes[].gcs FUSE Disk Mount)"
              className="w-full p-2.5 rounded-md border bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 border-zinc-200 dark:border-zinc-800 text-left transition-colors cursor-pointer flex flex-col justify-between gap-1"
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  <HardDrive className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">VM → Cloud Run</span>
                </span>
                <span className="text-[9.5px] font-mono font-bold text-zinc-500 shrink-0">
                  mfit + m2c
                </span>
              </div>
              <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                Migrate GCE VM + Disk
              </div>
            </button>
          )}

          <button
            type="button"
            data-feature-id="CLOUDRUN_SCHEDULER_TO_JOBS"
            onClick={handleToggleSchedulerToJobsStudio}
            title="Convert fragile Cloud Scheduler HTTP webhooks (30m timeout cap) or Cloud Run Services into native Cloud Run v2 Jobs (up to 24h timeout, 0 open ports, 1-10,000 parallel shards via CLOUD_RUN_TASK_INDEX, volumes[].gcs FUSE disk & L4 GPU) and rewire Scheduler to :run API"
            className={`w-full p-2.5 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1 ${
              showSchedulerToJobsStudio
                ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold truncate">
                <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">Scheduler → Jobs</span>
              </span>
              <span className="text-[9.5px] font-mono font-bold text-zinc-500 shrink-0">
                {schedulerJobsState.data
                  ? `${schedulerJobsState.data.cloudRunJobsCount || 0} Jobs`
                  : '24h Batch'}
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
              24h Timeout &amp; Task Shards
            </div>
          </button>

          <button
            type="button"
            data-feature-id="CLOUDRUN_DOCKER_COMPOSE_GA"
            onClick={() => setShowComposeStudio((v) => !v)}
            title="Google Cloud SDK 590.0.0 GA: Deploy multi-container Docker Compose (compose.yaml with x-google-cloudrun: ingress-container: true) stacks to Cloud Run v2 or export live Cloud Run services to compose.yaml"
            className={`w-full p-2.5 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1 ${
              showComposeStudio
                ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold truncate">
                <Layers className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Docker Compose</span>
              </span>
              <span className="text-[9.5px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                SDK GA
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
              gcloud run compose up
            </div>
          </button>

          <button
            type="button"
            data-feature-id="CLOUDRUN_APP_ENGINE_EXTERMINATOR"
            onClick={handleToggleAppEngineExterminator}
            title="Delete non-default App Engine services directly (missing from GCP Console UI), Tombstone the non-deletable default service to Unavailable ($0.00/mo), or migrate App Engine services to Cloud Run in 1 click"
            className={`w-full p-2.5 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1 ${
              showAppEngineExterminator
                ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold truncate">
                <Trash2 className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">App Engine $0/mo</span>
              </span>
              <span className="text-[9.5px] font-mono font-bold text-zinc-500 shrink-0">
                {appEngineState.data?.summary
                  ? appEngineState.data.summary.activeServicesCount === 0
                    ? '0 Active'
                    : `${appEngineState.data.summary.activeServicesCount} Active`
                  : 'Neutralize'}
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
              Service Exterminator &amp; Vault
            </div>
          </button>

          <button
            type="button"
            data-feature-id="CLOUDRUN_DEAD_ARTIFACT_HUNTER"
            onClick={handleToggleArtifactHunter}
            title="Search Artifact Registry for dead/unused container images & Cloud Storage for leftover build/staging artifacts"
            className={`w-full p-2.5 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1 ${
              showArtifactHunter
                ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold truncate">
                <HardDrive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Dead Artifacts</span>
              </span>
              <span className="text-[9.5px] font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0">
                {artifactScanState.data?.summary
                  ? `${artifactScanState.data.summary.deadContainerImagesCount} Dead`
                  : 'AR + GCS'}
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
              Orphan Containers &amp; Staging
            </div>
          </button>

          <button
            type="button"
            data-feature-id="CLOUDRUN_TO_GKE_TRANSPILER"
            onClick={() => setShowGlobalGkeTranspiler((v) => !v)}
            title="Convert any Cloud Run Service into a 6-Resource Production GKE Kubernetes Bundle (Deployment + HPA + PDB + NetworkPolicy + Spot GPU + /dev/shm) & deploy to GKE in 1 click"
            className={`w-full p-2.5 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between gap-1 ${
              showGlobalGkeTranspiler
                ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-300 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800/90 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100'
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold truncate">
                <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">Cloud Run → GKE</span>
              </span>
              <span className="text-[9.5px] font-mono font-bold text-zinc-500 shrink-0">
                K8s YAML
              </span>
            </div>
            <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
              6-Resource K8s Transpiler
            </div>
          </button>
        </div>
      </div>

      {/* CLOUD SCHEDULER -> CLOUD RUN V2 JOBS CONVERTER & PARALLEL BATCH STUDIO */}
      {showSchedulerToJobsStudio && (
        <div className="p-4 rounded-xl border border-blue-500/40 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-extrabold">
                  <Zap className="w-3 h-3" />
                  <span>CLOUD SCHEDULER → CLOUD RUN V2 JOBS CONVERTER</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span>Up to 24h (86,400s) Timeout · 0 Open Ports · CLOUD_RUN_TASK_INDEX Sharding · volumes[].gcs FUSE</span>
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white mt-1">
                Convert Fragile Cloud Scheduler HTTP Webhooks &amp; Services → Native Cloud Run v2 Batch Jobs (`:run` API)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Eliminate the <strong>30-minute Cloud Scheduler HTTP timeout ceiling</strong> and exposed port <code>8080</code> web servers: convert any Cloud Scheduler cron job or Cloud Run Service into a native <strong>Cloud Run v2 Job</strong> (<code>run.googleapis.com/v2/.../jobs</code>) with up to <strong>24 hours execution timeout</strong>, <strong>1–100 parallel task shards</strong> (<code>CLOUD_RUN_TASK_INDEX</code>), <strong>persistent GCS FUSE disk mount</strong> (<code>volumes[].gcs</code>), and automatic Cloud Scheduler rewiring to the official OAuth <code>:run</code> API.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFetchSchedulerAndJobs(false)}
                disabled={schedulerJobsState.loading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-300 text-xs font-mono font-bold cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    schedulerJobsState.loading ? 'animate-spin' : ''
                  }`}
                />
                <span>Rescan Scheduler &amp; Jobs</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSchedulerToJobsStudio(false)}
                className="px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* 4-Dimension Architectural Upgrade Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
            {(
              schedulerJobsState.data?.architecturalComparison || [
                {
                  dimension: '1. Max Execution Timeout',
                  legacySchedulerHttp: '30m Scheduler HTTP Cap / 60m Service Cap',
                  cloudRunJobV2: 'Up to 24 Hours (86,400s) Native Batch Timeout',
                },
                {
                  dimension: '2. Network & Attack Surface',
                  legacySchedulerHttp: 'Requires Open HTTP Port ($PORT 8080) & Web URL',
                  cloudRunJobV2: 'Zero Open Ports · Runs to Exit(0) · IAM OAuth :run API',
                },
                {
                  dimension: '3. Parallelism & Sharding',
                  legacySchedulerHttp: '1 Sequential HTTP Request per Cron Tick',
                  cloudRunJobV2: '1 to 10,000 Parallel Shards (CLOUD_RUN_TASK_INDEX)',
                },
                {
                  dimension: '4. Storage & GPU Support',
                  legacySchedulerHttp: 'Stateless HTTP Handler',
                  cloudRunJobV2: 'Persistent volumes[].gcs FUSE Disk + 1x nvidia-l4 GPU',
                },
              ]
            ).map((item) => (
              <div
                key={item.dimension}
                className="p-2.5 rounded-lg border border-blue-500/25 bg-blue-500/5 space-y-1"
              >
                <div className="font-mono font-bold text-blue-700 dark:text-blue-300 text-[11px]">
                  {item.dimension}
                </div>
                <div className="text-[10px] font-mono text-red-500 line-through">
                  Legacy: {item.legacySchedulerHttp}
                </div>
                <div className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Cloud Run Job: {item.cloudRunJobV2}
                </div>
              </div>
            ))}
          </div>

          {/* Discovered Cloud Scheduler Jobs & Quick Service Loader */}
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
                1. Discovered Cloud Scheduler Cron Jobs ({schedulerJobsState.data?.schedulerJobsCount || 0}) &amp; Cloud Run Services ({services.length})
              </div>
              {services.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                  <span className="text-zinc-500">Or Load from Service:</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const found = services.find((s) => s.name === e.target.value);
                      if (found) handleLoadServiceIntoJobForm(found);
                    }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-[11px] font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">-- Select Cloud Run Service to Convert to Batch Job --</option>
                    {services.map((s) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name} ({s.region} · {s.containerImage?.split('/').pop()})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {schedulerJobsState.loading ? (
              <div className="text-xs font-mono text-blue-500 flex items-center gap-2 py-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning Cloud Scheduler locations &amp; Cloud Run v2 Jobs across {projectId}...</span>
              </div>
            ) : (schedulerJobsState.data?.schedulerJobs || []).length === 0 ? (
              <div className="text-xs font-mono text-zinc-500 py-1">
                No existing Cloud Scheduler jobs detected in {projectId} (or configure a new Schedule + Cloud Run v2 Job below—both the Cloud Run v2 Job and the Cloud Scheduler <code>:run</code> trigger will be provisioned together!).
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(schedulerJobsState.data?.schedulerJobs || []).map((sj) => (
                  <div
                    key={sj.fullName || sj.name}
                    className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between gap-2 ${
                      sj.isAlreadyCloudRunJobTrigger
                        ? 'bg-emerald-500/10 border-emerald-500/35'
                        : 'bg-amber-500/10 border-amber-500/35'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2 font-mono font-bold">
                        <span className="text-zinc-900 dark:text-zinc-100">
                          {sj.name} ({sj.region})
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            sj.isAlreadyCloudRunJobTrigger
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-500 text-zinc-950'
                          }`}
                        >
                          {sj.isAlreadyCloudRunJobTrigger
                            ? `NATIVE :run TRIGGER (${sj.targetRunJobName})`
                            : `${sj.targetType} · 30m Cap`}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 break-all">
                        Schedule:{' '}
                        <strong className="text-blue-600 dark:text-blue-400">
                          {describeCronInPlainEnglish(sj.schedule)}
                        </strong>{' '}
                        (<code>{sj.schedule}</code> · {sj.timeZone}) · Target:{' '}
                        <code>{sj.targetUri || 'N/A'}</code>
                      </div>
                      {sj.antiPatternWarning && (
                        <div className="text-[10px] text-amber-700 dark:text-amber-300">
                          {sj.antiPatternWarning}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleLoadSchedulerIntoJobForm(sj)}
                        className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-[10px] cursor-pointer"
                      >
                        Load into Cloud Run v2 Job Converter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Interactive Cloud Run v2 Job Creator & Scheduler Rewirer */}
          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/30 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
                2. Create New Cloud Run v2 Batch Job or Convert Scheduler Cron (<code>run.googleapis.com/v2/projects/{projectId}/locations/{jobConvertForm.region}/jobs</code>)
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-500">
                  Quick Job Presets:
                </span>
                {[
                  {
                    label: 'Sharded Python ETL (4 Shards · 1h)',
                    spec: {
                      jobName: `sharded-etl-job-${Math.floor(Date.now() / 1000) % 1000}`,
                      taskCount: 4,
                      taskTimeoutSec: 3600,
                      cpu: '1',
                      memory: '1Gi',
                      attachPersistentDisk: true,
                      enableCloudRunGpu: false,
                      schedule: '0 * * * *',
                    },
                  },
                  {
                    label: 'Nightly GCS Disk Compactor (24h Timeout)',
                    spec: {
                      jobName: `gcs-disk-compactor-${Math.floor(Date.now() / 1000) % 1000}`,
                      taskCount: 1,
                      taskTimeoutSec: 86400,
                      cpu: '2',
                      memory: '4Gi',
                      attachPersistentDisk: true,
                      enableCloudRunGpu: false,
                      schedule: '0 2 * * *',
                    },
                  },
                  {
                    label: 'Serverless Batch AI GPU (1x nvidia-l4)',
                    spec: {
                      jobName: `batch-gpu-inference-${Math.floor(Date.now() / 1000) % 1000}`,
                      region: 'us-east4',
                      taskCount: 2,
                      taskTimeoutSec: 14400,
                      cpu: '4',
                      memory: '16Gi',
                      attachPersistentDisk: true,
                      enableCloudRunGpu: true,
                      schedule: '0 */6 * * *',
                    },
                  },
                ].map((tpl) => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() =>
                      setJobConvertForm((prev) => ({
                        ...prev,
                        ...tpl.spec,
                      }))
                    }
                    className="px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    + {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Cloud Run v2 Job Name
                </label>
                <input
                  type="text"
                  value={jobConvertForm.jobName}
                  onChange={(e) =>
                    setJobConvertForm((prev) => ({
                      ...prev,
                      jobName: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-'),
                    }))
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Target Region
                </label>
                <select
                  value={jobConvertForm.region}
                  onChange={(e) =>
                    setJobConvertForm((prev) => ({
                      ...prev,
                      region: e.target.value,
                    }))
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="us-east1">us-east1 (S. Carolina)</option>
                  <option value="us-east4">us-east4 (N. Virginia · L4 GPU)</option>
                  <option value="us-central1">us-central1 (Iowa · L4 GPU)</option>
                  <option value="us-west1">us-west1 (Oregon)</option>
                  <option value="europe-west1">europe-west1 (Belgium · L4 GPU)</option>
                  <option value="europe-west4">europe-west4 (Netherlands · L4 GPU)</option>
                  <option value="asia-southeast1">asia-southeast1 (Singapore · L4 GPU)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Parallel Shards &amp; Max Timeout
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={jobConvertForm.taskCount}
                    onChange={(e) =>
                      setJobConvertForm((prev) => ({
                        ...prev,
                        taskCount: Number(e.target.value),
                      }))
                    }
                    title="Parallel shards (CLOUD_RUN_TASK_INDEX 0..N-1)"
                    className="w-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value={1}>1 Task Shard</option>
                    <option value={2}>2 Shards</option>
                    <option value={4}>4 Shards</option>
                    <option value={8}>8 Shards</option>
                    <option value={16}>16 Shards</option>
                    <option value={50}>50 Shards</option>
                  </select>
                  <select
                    value={jobConvertForm.taskTimeoutSec}
                    onChange={(e) =>
                      setJobConvertForm((prev) => ({
                        ...prev,
                        taskTimeoutSec: Number(e.target.value),
                      }))
                    }
                    title="Max execution timeout (up to 24 hours / 86,400s)"
                    className="w-1/2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value={1800}>30m (1,800s)</option>
                    <option value={3600}>1 Hour (3,600s)</option>
                    <option value={14400}>4 Hours (14,400s)</option>
                    <option value={43200}>12 Hours (43,200s)</option>
                    <option value={86400}>24 Hours (86,400s Max)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Per-Shard vCPU &amp; Memory
                </label>
                <div className="flex items-center gap-1.5">
                  <select
                    value={jobConvertForm.cpu}
                    onChange={(e) =>
                      setJobConvertForm((prev) => ({
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
                    value={jobConvertForm.memory}
                    onChange={(e) =>
                      setJobConvertForm((prev) => ({
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Container Image URI (Extracted from Service or Batch Runner)
                </label>
                <input
                  type="text"
                  value={jobConvertForm.containerImage}
                  onChange={(e) =>
                    setJobConvertForm((prev) => ({
                      ...prev,
                      containerImage: e.target.value,
                    }))
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-1">
                  Persistent GCS FUSE Disk Bucket (<code>volumes[].gcs</code> → <code>{jobConvertForm.diskMountPath}</code>)
                </label>
                <input
                  type="text"
                  value={jobConvertForm.diskBucketName}
                  onChange={(e) =>
                    setJobConvertForm((prev) => ({
                      ...prev,
                      diskBucketName: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-'),
                    }))
                  }
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {jobConvertForm.rewireCloudScheduler && (
              <VisualCronScheduleBuilder
                value={jobConvertForm.schedule}
                onChange={(newCron) =>
                  setJobConvertForm((prev) => ({ ...prev, schedule: newCron }))
                }
                label="When Should Cloud Scheduler Trigger This Cloud Run Job? (Visual Schedule Picker)"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-blue-500/20">
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-zinc-800 dark:text-zinc-200">
                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(jobConvertForm.attachPersistentDisk)}
                    onChange={(e) =>
                      setJobConvertForm((prev) => ({
                        ...prev,
                        attachPersistentDisk: e.target.checked,
                      }))
                    }
                    className="rounded border-blue-400 text-blue-600"
                  />
                  <span>
                    Attach Persistent FUSE Disk (<code>volumes[].gcs</code>)
                  </span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(jobConvertForm.enableCloudRunGpu)}
                    onChange={(e) =>
                      setJobConvertForm((prev) => ({
                        ...prev,
                        enableCloudRunGpu: e.target.checked,
                        cpu: e.target.checked
                          ? String(Math.max(4, Number(prev.cpu || 4)))
                          : prev.cpu,
                        memory: e.target.checked ? '16Gi' : prev.memory,
                      }))
                    }
                    className="rounded border-blue-400 text-blue-600"
                  />
                  <span>
                    Attach <code>1x nvidia-l4</code> GPU (Batch AI/ML)
                  </span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(jobConvertForm.rewireCloudScheduler)}
                    onChange={(e) =>
                      setJobConvertForm((prev) => ({
                        ...prev,
                        rewireCloudScheduler: e.target.checked,
                      }))
                    }
                    className="rounded border-blue-400 text-blue-600"
                  />
                  <span>
                    Auto-Rewire Cloud Scheduler → Native <code>:run</code> API
                  </span>
                </label>

                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(jobConvertForm.executeImmediately)}
                    onChange={(e) =>
                      setJobConvertForm((prev) => ({
                        ...prev,
                        executeImmediately: e.target.checked,
                      }))
                    }
                    className="rounded border-blue-400 text-blue-600"
                  />
                  <span>
                    Execute First Run Immediately (<code>:run</code>)
                  </span>
                </label>
              </div>

              <button
                type="button"
                disabled={convertingToJob || !jobConvertForm.jobName}
                onClick={handleConvertSchedulerToJob}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
              >
                {convertingToJob ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>
                  {convertingToJob
                    ? `Deploying Cloud Run v2 Job ${jobConvertForm.jobName}...`
                    : `Convert & Deploy Cloud Run v2 Job (${jobConvertForm.taskCount} Shard${jobConvertForm.taskCount > 1 ? 's' : ''})`}
                </span>
              </button>
            </div>

            {jobConversionError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-500">
                {jobConversionError}
              </div>
            )}

            {jobConversionResult && (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-xs space-y-1">
                <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>{jobConversionResult.message}</span>
                </div>
                <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300 break-all">
                  Cloud Scheduler <code>:run</code> Target:{' '}
                  <code>{jobConversionResult.schedulerTargetRunUri}</code>
                  {jobConversionResult.gpuQuotaFallbackNote && (
                    <span className="block text-amber-600 dark:text-amber-300 mt-0.5">
                      Note: {jobConversionResult.gpuQuotaFallbackNote}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 3. Live Cloud Run v2 Jobs Fleet Table */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200">
              3. Deployed Cloud Run v2 Batch Jobs ({schedulerJobsState.data?.cloudRunJobsCount || 0})
            </div>
            {(schedulerJobsState.data?.cloudRunJobs || []).length === 0 ? (
              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500">
                No Cloud Run v2 Jobs deployed yet—click &ldquo;Convert &amp; Deploy Cloud Run v2 Job&rdquo; above to create your first parallel batch job!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {(schedulerJobsState.data?.cloudRunJobs || []).map((jb) => {
                  const key = `${jb.region}/${jb.name}`;
                  const busyState = runningJobMap[key];
                  return (
                    <div
                      key={jb.id || key}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/70 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            {jb.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-bold">
                            {jb.region} · {jb.taskCount} Shard(s) · Timeout {jb.taskTimeout}
                          </span>
                          {(jb.persistentDiskBuckets || []).map((bkt) => (
                            <span
                              key={bkt}
                              className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-mono text-[10px] font-bold"
                            >
                              Disk: gs://{bkt}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={Boolean(busyState)}
                            onClick={() => handleRunCloudRunJobNow(jb)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] cursor-pointer disabled:opacity-50"
                          >
                            {busyState === 'RUNNING' ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                            <span>Execute Now (:run)</span>
                          </button>
                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() => onRunInShell(jb.gcloudExecuteCli)}
                              title={jb.gcloudExecuteCli}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-mono text-[10px] cursor-pointer"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>CLI</span>
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={Boolean(busyState)}
                            onClick={() => handleDeleteCloudRunJob(jb)}
                            className="p-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-500 cursor-pointer disabled:opacity-50"
                            title="Delete Cloud Run v2 Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="text-[11px] font-mono text-zinc-500 flex flex-wrap items-center gap-3">
                        <span>
                          Resources: <strong>{jb.cpu} vCPU / {jb.memory}</strong>
                        </span>
                        <span>
                          Image: <code>{jb.containerImage}</code>
                        </span>
                        <span>
                          Total Runs: <strong>{jb.executionCount}</strong>
                        </span>
                      </div>

                      {(jb.recentExecutions || []).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-200/70 dark:border-zinc-800">
                          <span className="text-[10px] font-mono text-zinc-400">
                            Recent Executions:
                          </span>
                          {jb.recentExecutions.slice(0, 3).map((ex) => (
                            <span
                              key={ex.name}
                              className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] ${
                                ex.failedCount > 0
                                  ? 'bg-red-500/15 text-red-500'
                                  : ex.runningCount > 0
                                  ? 'bg-blue-500/15 text-blue-500'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {ex.shortName} ({ex.succeededCount}/{ex.taskCount} OK)
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GOOGLE CLOUD SDK 590.0.0 GA `gcloud run compose up` MULTI-CONTAINER & SIDECAR STUDIO */}
      {showComposeStudio && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-extrabold">
                  <Layers className="w-3 h-3" />
                  <span>GCLOUD 590.0.0 GA · GCLOUD RUN COMPOSE UP STUDIO</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-500 bg-blue-500/10 border border-blue-500/30 px-2 py-0.5 rounded-full">
                  <span>x-google-cloudrun: ingress-container: true · Multi-Container Sidecars · Shared RAM Volumes</span>
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white mt-1">
                Docker Compose (`compose.yaml`) ↔ Cloud Run v2 Multi-Container Sidecar Deployer & Reverse Exporter
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Promoted to <strong>GA</strong> in Google Cloud SDK <code>590.0.0</code>: deploy multi-service <code>compose.yaml</code> files into a single scale-to-zero Cloud Run v2 revision where your primary service (marked with <code>x-google-cloudrun: ingress-container: true</code>) receives HTTPS traffic and sidecar services (e.g. Redis, OTel Collector) communicate over <code>127.0.0.1</code> with automatic <code>dependsOn</code> TCP <code>startupProbe</code> synthesis and shared in-memory volumes—or reverse-export any live Cloud Run service into a <code>compose.yaml</code> file.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowComposeStudio(false)}
              className="px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Preset Compose Blueprints + Reverse Export from Live Service */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
                Blueprints:
              </span>
              <button
                type="button"
                onClick={() =>
                  setComposeYamlText(`name: cloudpulse-compose-stack
services:
  web:
    image: us-docker.pkg.dev/cloudrun/container/hello:latest
    ports:
      - "8080:8080"
    environment:
      REDIS_HOST: "127.0.0.1"
      REDIS_PORT: "6379"
      STACK_MODE: "gcloud-run-compose-ga"
    depends_on:
      - redis-cache
    volumes:
      - shared-ram:/data
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: "512Mi"
    x-google-cloudrun:
      ingress-container: true

  redis-cache:
    image: mirror.gcr.io/library/redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - shared-ram:/data
    deploy:
      resources:
        limits:
          cpus: "1"
          memory: "512Mi"

volumes:
  shared-ram:`)
                }
                className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-mono font-bold cursor-pointer"
              >
                1. Web Ingress + Redis 7 Sidecar + Shared RAM
              </button>
              <button
                type="button"
                onClick={() =>
                  setComposeYamlText(`name: otel-instrumented-service
services:
  api-gateway:
    image: us-docker.pkg.dev/cloudrun/container/hello:latest
    ports:
      - "8080:8080"
    environment:
      OTEL_EXPORTER_OTLP_ENDPOINT: "http://127.0.0.1:4318"
    depends_on:
      - otel-collector
    x-google-cloudrun:
      ingress-container: true

  otel-collector:
    image: mirror.gcr.io/otel/opentelemetry-collector-contrib:latest
    ports:
      - "4318:4318"`)
                }
                className="px-2.5 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-mono font-bold cursor-pointer"
              >
                2. API Ingress + OTel Collector Sidecar
              </button>
              <button
                type="button"
                onClick={() =>
                  setComposeYamlText(`name: single-compose-app
services:
  app:
    image: us-docker.pkg.dev/cloudrun/container/hello:latest
    ports:
      - "8080:8080"
    environment:
      NODE_ENV: "production"
    x-google-cloudrun:
      ingress-container: true`)
                }
                className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-bold cursor-pointer"
              >
                3. Single-Container Scale-to-Zero
              </button>
            </div>

            {services.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={composeExportServiceId || services[0]?.id || ''}
                  onChange={(e) => setComposeExportServiceId(e.target.value)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.region})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const chosen =
                      services.find(
                        (s) => s.id === (composeExportServiceId || services[0]?.id)
                      ) || services[0];
                    if (!chosen) return;
                    setComposeRegion(chosen.region || 'us-central1');
                    handleExecuteComposeAction('EXPORT_SERVICE_TO_COMPOSE', {
                      serviceName: chosen.name,
                      region: chosen.region || 'us-central1',
                    });
                  }}
                  disabled={Boolean(composeActionBusy)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {composeActionBusy === 'EXPORT_SERVICE_TO_COMPOSE'
                    ? 'Exporting...'
                    : 'Export Live Service → compose.yaml'}
                </button>
              </div>
            )}
          </div>

          {composeError && (
            <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{composeError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: compose.yaml Editor + Deployment Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  compose.yaml Specification (x-google-cloudrun)
                </label>
                <span className="text-[10px] font-mono text-zinc-400">
                  managed-by: runcompose
                </span>
              </div>
              <textarea
                rows={16}
                value={composeYamlText}
                onChange={(e) => setComposeYamlText(e.target.value)}
                spellCheck={false}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/90 p-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    Target Region
                  </label>
                  <select
                    value={composeRegion}
                    onChange={(e) => setComposeRegion(e.target.value)}
                    className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs font-mono"
                  >
                    <option value="us-central1">us-central1</option>
                    <option value="us-east1">us-east1</option>
                    <option value="us-west1">us-west1</option>
                    <option value="europe-west1">europe-west1</option>
                    <option value="asia-northeast1">asia-northeast1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    Min Instances
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={composeMinInstances}
                    onChange={(e) => setComposeMinInstances(Number(e.target.value || 0))}
                    className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                    Max Instances
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={composeMaxInstances}
                    onChange={(e) => setComposeMaxInstances(Number(e.target.value || 10))}
                    className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs font-mono"
                  />
                </div>
                <div className="flex flex-col justify-end gap-1">
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-mono cursor-pointer">
                    <input
                      type="checkbox"
                      checked={composeAllowUnauthenticated}
                      onChange={(e) => {
                        setComposeAllowUnauthenticated(e.target.checked);
                        if (e.target.checked) setComposeEnableDirectIap(false);
                      }}
                    />
                    <span>--allow-unauthenticated</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-600 dark:text-blue-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={composeEnableDirectIap}
                      onChange={(e) => {
                        setComposeEnableDirectIap(e.target.checked);
                        if (e.target.checked) setComposeAllowUnauthenticated(false);
                      }}
                    />
                    <span>+ Direct Cloud IAP ($0/mo)</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecuteComposeAction('VALIDATE_DRY_RUN')}
                  disabled={Boolean(composeActionBusy)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    {composeActionBusy === 'VALIDATE_DRY_RUN'
                      ? 'Validating (--dry-run)...'
                      : 'Validate compose.yaml (--dry-run)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteComposeAction('DEPLOY_COMPOSE_UP')}
                  disabled={Boolean(composeActionBusy)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>
                    {composeActionBusy === 'DEPLOY_COMPOSE_UP'
                      ? 'Deploying Multi-Container Stack...'
                      : 'Deploy to Cloud Run (gcloud run compose up)'}
                  </span>
                </button>

                {onRunInShell && (
                  <button
                    type="button"
                    onClick={() =>
                      onRunInShell(
                        `gcloud run compose up compose.yaml --project=${projectId} --region=${composeRegion}${
                          composeAllowUnauthenticated
                            ? ' --allow-unauthenticated'
                            : ' --no-allow-unauthenticated'
                        }`
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Run CLI in Shell</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Live Multi-Container Sidecar Breakdown & Cloud Run v2 Spec */}
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                Multi-Container Sidecar Architecture & Translated Cloud Run v2 Spec
              </div>

              {!composeResult ? (
                <div className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
                  <p>
                    Click <strong>Validate compose.yaml (--dry-run)</strong> to inspect how CloudPulse &amp; <code>gcloud run compose up</code> translate your Docker Compose services into a Cloud Run Gen2 multi-container revision:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[11px]">
                    <li>
                      <strong>Ingress Container</strong>: The service marked with <code>x-google-cloudrun.ingress-container: true</code> receives public/IAP HTTPS traffic on its declared containerPort.
                    </li>
                    <li>
                      <strong>Sidecar Containers</strong>: All other services in <code>compose.yaml</code> run in the same Cloud Run instance and bind to <code>127.0.0.1:&lt;port&gt;</code> with automatic TCP <code>startupProbe</code> synthesis when referenced in <code>depends_on</code>.
                    </li>
                    <li>
                      <strong>Shared Volumes</strong>: Named volumes mount across containers as shared in-memory <code>emptyDir</code> RAM disks.
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 font-mono">
                    {composeResult.message}
                  </div>

                  {Array.isArray(composeResult.parsedServices) &&
                    composeResult.parsedServices.length > 0 && (
                      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <table className="w-full text-left border-collapse text-[11px] font-mono">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 text-[10px] uppercase">
                              <th className="py-1.5 px-2.5">Service</th>
                              <th className="py-1.5 px-2.5">Role</th>
                              <th className="py-1.5 px-2.5">Port</th>
                              <th className="py-1.5 px-2.5">DependsOn / Probe</th>
                              <th className="py-1.5 px-2.5">Limits</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {composeResult.parsedServices.map((ps) => (
                              <tr key={ps.name}>
                                <td className="py-1.5 px-2.5 font-bold">
                                  {ps.name}
                                  <div className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                                    {ps.image}
                                  </div>
                                </td>
                                <td className="py-1.5 px-2.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                      ps.role === 'INGRESS_CONTAINER'
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                                        : 'bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                                    }`}
                                  >
                                    {ps.role}
                                  </span>
                                </td>
                                <td className="py-1.5 px-2.5">{ps.port}</td>
                                <td className="py-1.5 px-2.5">
                                  {ps.dependsOn?.length > 0
                                    ? `-> ${ps.dependsOn.join(', ')}`
                                    : ps.hasStartupProbe
                                    ? 'TCP startupProbe (Auto)'
                                    : '—'}
                                </td>
                                <td className="py-1.5 px-2.5">
                                  {ps.cpu} vCPU / {ps.memory}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                  {composeResult.gcloudCliCommand && (
                    <div className="p-2.5 rounded-lg bg-zinc-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                      $ {composeResult.gcloudCliCommand}
                    </div>
                  )}

                  {composeResult.translatedCloudRunV2Spec && (
                    <pre className="p-3 rounded-lg bg-zinc-900 text-zinc-200 font-mono text-[10px] max-h-56 overflow-auto border border-zinc-800">
                      {JSON.stringify(
                        composeResult.translatedCloudRunV2Spec,
                        null,
                        2
                      )}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* APP ENGINE SERVICE & VERSION EXTERMINATOR + DEFAULT SERVICE $0.00/MO NEUTRALIZER */}
      {showAppEngineExterminator && (() => {
        const aeData = appEngineState.data;
        const appInfo = aeData?.app;
        const aeServices = aeData?.services || [];
        const aeBuckets = aeData?.appspotBuckets || [];
        const aeSummary = aeData?.summary || {
          totalServicesCount: 0,
          deletableServicesCount: 0,
          totalVersionsCount: 0,
          zombieVersionsCount: 0,
          totalEstimatedMonthlyUsd: 0,
          appServingStatus: 'NOT_INITIALIZED',
        };
        const isAppServing = aeSummary.appServingStatus === 'SERVING';

        return (
          <div
            className={`p-4 rounded-xl border bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 space-y-4 shadow-xl ${
              !isAppServing
                ? 'border-zinc-300 dark:border-zinc-800'
                : 'border-red-500/40'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                      !isAppServing
                        ? 'bg-zinc-200 dark:bg-zinc-800/90 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                        : 'bg-red-500/20 border-red-400/40 text-red-700 dark:text-red-300'
                    }`}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>
                      {!isAppServing
                        ? 'APP ENGINE DISABLED & TOMBSTONED (OFFLINE · $0.00/MO)'
                        : 'APP ENGINE SERVICE & VERSION EXTERMINATOR (MISSING FROM GCP CONSOLE UI)'}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Direct REST v1 Service Delete + Default Service $0.00/mo Neutralizer</span>
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white mt-1">
                  The Architectural Truth About Deleting App Engine Services (`default` vs Non-`default`)
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  1) <strong>Non-<code>default</code> services</strong> (e.g., <code>api</code>, <code>worker</code>) CAN be deleted via{' '}
                  <code className="text-zinc-700 dark:text-zinc-300">DELETE https://appengine.googleapis.com/v1/apps/{projectId}/services/:serviceId</code>, and extra <code>0%</code>-traffic versions can be deleted via <code>DELETE .../versions/:v</code>.{' '}
                  2) <strong>Why <code>default</code> &amp; Its Last 100%-Traffic Version Can NEVER Be Deleted</strong>: Once App Engine is initialized in a GCP project, Google Cloud hard-codes an unbreakable invariant: the <code>default</code> service can <strong>never</strong> be deleted, and <code>default</code> can <strong>never have 0 versions</strong> (at least 1 version must hold <code>100%</code> traffic forever, even when the app is <code>USER_DISABLED</code>). The only way to reach <strong>$0.00/mo</strong> on <code>default</code> is to delete all extra 0%-traffic versions, set the remaining version to <code>STOPPED</code>, delete the <code>*.appspot.com</code> GCS buckets, and set the app to <code>USER_DISABLED</code>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {aeData?.appInitialized && (
                  <button
                    type="button"
                    onClick={() =>
                      handleExecuteAppEngineAction('TOGGLE_APP_STATUS', {
                        action: 'TOGGLE_APP_SERVING_STATUS',
                        servingStatus: isAppServing ? 'USER_DISABLED' : 'SERVING',
                      })
                    }
                    disabled={Boolean(appEngineActionBusy)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50 ${
                      isAppServing
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>
                      {appEngineActionBusy === 'TOGGLE_APP_STATUS'
                        ? 'Updating App Status...'
                        : isAppServing
                        ? 'Disable Entire App Engine ($0.00/mo Kill-Switch)'
                        : 'App Disabled (Click to Re-Enable SERVING)'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleFetchAppEngineOverview(false)}
                  disabled={appEngineState.loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      appEngineState.loading ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {appEngineState.loading ? 'Scanning App Engine...' : 'Rescan App Engine'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAppEngineExterminator(false)}
                  className="px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {appEngineState.error && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{appEngineState.error}</span>
              </div>
            )}

            {/* 4 Live KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  1. App Engine Application Status
                </div>
                <div
                  className={`text-base font-extrabold mt-0.5 ${
                    !aeData?.appInitialized
                      ? 'text-zinc-500 dark:text-zinc-400'
                      : isAppServing
                      ? 'text-amber-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {!aeData?.appInitialized
                    ? 'NOT INITIALIZED ($0.00/mo)'
                    : `${aeSummary.appServingStatus} (${appInfo?.locationId || 'regional'})`}
                </div>
                <div
                  className={`text-[10px] font-mono text-zinc-400 mt-0.5 ${
                    !isAppServing ? 'line-through opacity-60' : ''
                  }`}
                >
                  {appInfo?.defaultHostname || 'No *.appspot.com hostname provisioned'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  2. Active Services vs Tombstoned Default Shell
                </div>
                <div
                  className={`text-base font-extrabold mt-0.5 ${
                    (aeSummary.activeServicesCount ?? aeSummary.totalServicesCount) === 0
                      ? 'text-zinc-500 dark:text-zinc-400'
                      : 'text-red-400'
                  }`}
                >
                  {aeSummary.activeServicesCount ?? aeSummary.totalServicesCount} Active ·{' '}
                  {aeSummary.unavailableServicesCount || 0} Disabled
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {(aeSummary.activeServicesCount ?? aeSummary.totalServicesCount) === 0
                    ? '0 Active App Engine services (default disabled & offline)'
                    : 'Non-default services delete via REST v1 · Default tombstones to $0/mo'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  3. Edge Firewall & Serving Versions
                </div>
                <div
                  className={`text-base font-extrabold mt-0.5 ${
                    aeSummary.edgeFirewallDenyAll && !isAppServing
                      ? 'text-zinc-500 dark:text-zinc-400'
                      : 'text-amber-400'
                  }`}
                >
                  {isAppServing ? `${aeSummary.totalVersionsCount} Serving` : '0 Active Ver'} ·{' '}
                  Firewall: {aeSummary.edgeFirewallDefaultAction || 'ALLOW'} *
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {aeSummary.edgeFirewallDenyAll
                    ? 'Edge Firewall default rule (*) is DENY (100% ingress blocked)'
                    : '0%-traffic versions delete directly · Lock Edge Firewall to DENY *'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  4. Estimated App Engine Burn & Staging Buckets
                </div>
                <div
                  className={`text-base font-extrabold mt-0.5 ${
                    !isAppServing && Number(aeSummary.totalEstimatedMonthlyUsd || 0) === 0
                      ? 'text-zinc-500 dark:text-zinc-400'
                      : 'text-amber-400'
                  }`}
                >
                  ${Number(aeSummary.totalEstimatedMonthlyUsd || 0).toFixed(2)}/mo · {aeBuckets.length} Bucket(s)
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  Includes Flex/Manual/Basic resident instances & *.appspot.com GCS
                </div>
              </div>
            </div>

            {!aeData?.appInitialized && !appEngineState.loading ? (
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 flex items-center justify-between gap-3">
                <div>
                  <div className="font-extrabold text-sm">
                    Clean Slate: No App Engine Application Initialized in {projectId} ($0.00/mo)
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    This project does not have a legacy App Engine application or permanent <code>default</code> service. All serverless workloads are running cleanly on Cloud Run v2!
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-mono font-bold text-[11px] shrink-0">
                  $0.00/mo App Engine Burn
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {aeServices.map((svc) => {
                  const isDefault = Boolean(svc.isDefaultService);
                  const migrateIap = Boolean(appEngineMigrateIapMap[svc.id]);
                  const isAlreadyMinimalFloor =
                    isDefault &&
                    svc.versionsCount <= 1 &&
                    !isAppServing;
                  return (
                    <div
                      key={svc.id}
                      className={`p-3.5 rounded-xl border space-y-3 ${
                        isAlreadyMinimalFloor
                          ? 'border-zinc-300 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/40'
                          : isDefault
                          ? 'border-amber-500/40 bg-amber-500/5'
                          : 'border-red-500/35 bg-zinc-50 dark:bg-zinc-900/70'
                      }`}
                    >
                      {isAlreadyMinimalFloor && (
                        <div className="p-3.5 rounded-xl bg-zinc-200/60 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-full bg-zinc-300/80 dark:bg-zinc-800 border border-zinc-400/50 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono font-extrabold text-[11px]">
                                DISABLED · 0 ACTIVE SERVICES
                              </span>
                              <span className="font-mono text-xs line-through text-zinc-400 dark:text-zinc-500">
                                service/default ({svc.primaryVersionId || 'last-version'})
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-zinc-300/60 dark:bg-zinc-800/90 border border-zinc-400/40 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-mono font-bold text-[10px]">
                                UNAVAILABLE · OFFLINE ($0.00/MO)
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!aeSummary.edgeFirewallDenyAll && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleExecuteAppEngineAction(`TOMBSTONE:${svc.id}`, {
                                      action: 'TOMBSTONE_DEFAULT_SERVICE',
                                      disableEntireApp: true,
                                    })
                                  }
                                  disabled={Boolean(appEngineActionBusy)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-extrabold cursor-pointer disabled:opacity-50"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>
                                    {appEngineActionBusy === `TOMBSTONE:${svc.id}`
                                      ? 'Locking Edge Firewall (*) -> DENY...'
                                      : 'Lock Edge Firewall (*) -> DENY ALL'}
                                  </span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowRawTombstoneMetadata((v) => !v)}
                                className="px-2.5 py-1 rounded-md bg-zinc-300/60 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 border border-zinc-400/40 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-bold cursor-pointer"
                              >
                                {showRawTombstoneMetadata
                                  ? 'Hide Raw GCP API Tombstone Shell'
                                  : 'Inspect Raw GCP API Metadata Shell (Hidden)'}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                            <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-950/70 border border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
                              <span className="text-zinc-400">1. App Serving:</span>
                              <span className="font-bold text-zinc-600 dark:text-zinc-400">
                                USER_DISABLED (HTTP 404)
                              </span>
                            </div>
                            <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-950/70 border border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
                              <span className="text-zinc-400">2. Edge Firewall (*):</span>
                              <span
                                className={`font-bold ${
                                  aeSummary.edgeFirewallDenyAll
                                    ? 'text-zinc-600 dark:text-zinc-400'
                                    : 'text-amber-600 dark:text-amber-300'
                                }`}
                              >
                                {aeSummary.edgeFirewallDenyAll
                                  ? 'DENY ALL (0.0.0.0/0 Blocked)'
                                  : 'ALLOW (Click Lock Above -> DENY)'}
                              </span>
                            </div>
                            <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-950/70 border border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
                              <span className="text-zinc-400">3. Compute & Storage:</span>
                              <span className="font-bold text-zinc-600 dark:text-zinc-400">
                                0 Instances · {aeBuckets.length} Buckets ($0/mo)
                              </span>
                            </div>
                          </div>

                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Because Google Cloud&apos;s API permanently forbids deleting <code>service/default</code> or reducing it to 0 versions, CloudPulse has <strong>Disabled &amp; Tombstoned</strong> it as <strong>Unavailable (`0 Active Services`)</strong>. Its raw GCP API metadata shell is grayed out and hidden from your active workspace unless you click <em>Inspect Raw GCP API Metadata Shell</em> above.
                          </div>
                        </div>
                      )}

                      {(!isAlreadyMinimalFloor || showRawTombstoneMetadata) && (
                        <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono text-sm font-extrabold ${
                                isAlreadyMinimalFloor
                                  ? 'line-through text-zinc-400 dark:text-zinc-500'
                                  : 'text-zinc-900 dark:text-white'
                              }`}
                            >
                              service/{svc.id}
                            </span>
                            {isAlreadyMinimalFloor ? (
                              <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 text-[10px] font-mono font-bold">
                                DISABLED · UNAVAILABLE IN GCP ($0.00/MO)
                              </span>
                            ) : isDefault ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                                DEFAULT SERVICE (API-LOCKED FROM DIRECT DELETE · USE $0/MO TOMBSTONE)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-700 dark:text-red-300 text-[10px] font-mono font-bold">
                                NON-DEFAULT SERVICE (DIRECT REST DELETE UNLOCKED)
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono">
                              {svc.versionsCount} Version(s) · {svc.zombieVersionsCount} Zombie(s) · ${Number(svc.estimatedMonthlyUsd || 0).toFixed(2)}/mo
                            </span>
                            {svc.iapEnabled && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-[10px] font-mono font-bold">
                                App Engine IAP Enabled
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                            {svc.deleteExplanation}
                          </p>
                          {svc.migrationReadiness && (
                            <div
                              className={`mt-2 p-2.5 rounded-lg border text-[11px] font-mono ${
                                svc.migrationReadiness.canMigrateAutomatically
                                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200'
                                  : 'bg-zinc-200/70 dark:bg-zinc-800/70 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              <div className="flex flex-wrap items-center gap-2 font-bold">
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                                    svc.migrationReadiness.canMigrateAutomatically
                                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  view=FULL Spec: {svc.migrationReadiness.migrationMode}
                                </span>
                                <span>
                                  Source Files: {svc.migrationReadiness.sourceFilesCount || 0}
                                  {Array.isArray(svc.migrationReadiness.sourceFilesSample) &&
                                  svc.migrationReadiness.sourceFilesSample.length > 0
                                    ? ` (${svc.migrationReadiness.sourceFilesSample.slice(0, 4).join(', ')})`
                                    : ''}
                                </span>
                                <span>·</span>
                                <span>
                                  Staging Bucket: {svc.migrationReadiness.sourceBucket || 'n/a'} (
                                  {svc.migrationReadiness.sourceBucketExists ? 'INTACT' : 'DELETED'})
                                </span>
                                <span>·</span>
                                <span>
                                  Env Vars: {svc.migrationReadiness.envVariablesCount || 0}
                                </span>
                                {svc.migrationReadiness.mappedCloudRunLimits && (
                                  <>
                                    <span>·</span>
                                    <span>
                                      Target Sizing: {svc.migrationReadiness.mappedCloudRunLimits.cpu} vCPU /{' '}
                                      {svc.migrationReadiness.mappedCloudRunLimits.memory}
                                    </span>
                                  </>
                                )}
                              </div>
                              {svc.migrationReadiness.migrationBlockReason && (
                                <div className="mt-1 text-[10px] text-amber-700 dark:text-amber-300">
                                  {svc.migrationReadiness.migrationBlockReason}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {/* 1-Click Migrate to Cloud Run (Real view=FULL container or Cloud Build Buildpacks from GCS source) */}
                          <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg px-2.5 py-1">
                            <label className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-700 dark:text-blue-300 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={migrateIap}
                                onChange={(e) =>
                                  setAppEngineMigrateIapMap((prev) => ({
                                    ...prev,
                                    [svc.id]: e.target.checked,
                                  }))
                                }
                                className="rounded border-blue-400"
                              />
                              <span>+ Direct Cloud Run IAP ($0 LB)</span>
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                handleExecuteAppEngineAction(`MIGRATE:${svc.id}`, {
                                  action: 'MIGRATE_TO_CLOUD_RUN',
                                  serviceId: svc.id,
                                  versionId: svc.primaryVersionId || undefined,
                                  targetCloudRunServiceName: `ae-${svc.id}`
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, '-')
                                    .slice(0, 45),
                                  region:
                                    appInfo?.cloudRunRegion ||
                                    'us-central1',
                                  iapEnabled: migrateIap,
                                })
                              }
                              disabled={
                                Boolean(appEngineActionBusy) ||
                                svc.migrationReadiness?.canMigrateAutomatically === false
                              }
                              title={
                                svc.migrationReadiness?.canMigrateAutomatically === false
                                  ? svc.migrationReadiness.migrationBlockReason
                                  : 'Migrates real container image or builds real GCS staging source files via Cloud Build Buildpacks into Cloud Run v2 with all envVariables, serviceAccount, and VPC connector settings'
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Rocket className="w-3 h-3" />
                              <span>
                                {appEngineActionBusy === `MIGRATE:${svc.id}`
                                  ? 'Building & Migrating...'
                                  : svc.migrationReadiness?.canMigrateAutomatically === false
                                  ? 'Migration Blocked (Source Blobs Deleted)'
                                  : `1-Click Migrate → Cloud Run (ae-${svc.id})`}
                              </span>
                            </button>
                          </div>

                          {/* Direct Delete (Non-default) OR Neutralize Default to $0.00/mo Floor */}
                          {isDefault ? (
                            !(
                              !isAppServing &&
                              svc.versionsCount === 1 &&
                              svc.servingVersionCount === 0
                            ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleExecuteAppEngineAction(`NEUTRALIZE:${svc.id}`, {
                                    action: 'NEUTRALIZE_DEFAULT_SERVICE_TO_ZERO',
                                    disableEntireApp: true,
                                  })
                                }
                                disabled={Boolean(appEngineActionBusy)}
                                title="Deletes all 0%-traffic versions in default, stops the remaining required version, and locks App Engine to USER_DISABLED ($0.00/mo)"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                <span>
                                  {appEngineActionBusy === `NEUTRALIZE:${svc.id}`
                                    ? 'Neutralizing default to $0.00/mo...'
                                    : 'Neutralize default to $0.00/mo Floor'}
                                </span>
                              </button>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleExecuteAppEngineAction(`DELETE_SVC:${svc.id}`, {
                                  action: 'DELETE_SERVICE',
                                  serviceId: svc.id,
                                })
                              }
                              disabled={Boolean(appEngineActionBusy)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>
                                {appEngineActionBusy === `DELETE_SVC:${svc.id}`
                                  ? 'Deleting Service...'
                                  : `Delete Service "${svc.id}" (REST v1)`}
                              </span>
                            </button>
                          )}

                          {onRunInShell && (
                            <button
                              type="button"
                              onClick={() =>
                                onRunInShell(
                                  isDefault
                                    ? `gcloud app versions list --service=default --project=${projectId}`
                                    : `gcloud app services delete ${svc.id} --project=${projectId} --quiet`
                                )
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 cursor-pointer"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>CLI</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Versions Table inside Service */}
                      {Array.isArray(svc.versions) && svc.versions.length > 0 && (
                        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] font-mono uppercase text-zinc-400">
                                <th className="py-2 px-3">Version ID</th>
                                <th className="py-2 px-3">Runtime / Env</th>
                                <th className="py-2 px-3">Serving Status</th>
                                <th className="py-2 px-3">Traffic Share</th>
                                <th className="py-2 px-3">Scaling / Est. Burn</th>
                                <th className="py-2 px-3 text-right">Version Controls</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/70">
                              {svc.versions.map((ver) => {
                                const verBusyKey = `VER:${svc.id}/${ver.id}`;
                                return (
                                  <tr key={ver.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                    <td className="py-2 px-3 font-mono font-bold text-zinc-900 dark:text-zinc-100">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span>{ver.id}</span>
                                      </div>
                                    </td>
                                    <td className="py-2 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                                      {ver.runtime} · {ver.env} ({ver.instanceClass})
                                    </td>
                                    <td className="py-2 px-3">
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                          ver.servingStatus === 'SERVING'
                                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                                            : 'bg-zinc-500/20 text-zinc-500 dark:text-zinc-400 border border-zinc-500/30'
                                        }`}
                                      >
                                        {ver.servingStatus}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-mono text-[11px]">
                                      <span
                                        className={
                                          ver.trafficPercent > 0
                                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                                            : 'text-amber-600 dark:text-amber-400'
                                        }
                                      >
                                        {ver.trafficPercent}%{' '}
                                        {ver.trafficPercent === 0
                                          ? '(0% Zombie · Direct Delete)'
                                          : isDefault
                                          ? '(100% Traffic Lock on default)'
                                          : '(Live Traffic)'}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                                      {ver.scalingType} · ${Number(ver.estimatedMonthlyUsd || 0).toFixed(2)}/mo
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      <div className="inline-flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleExecuteAppEngineAction(
                                              `STOP_START:${svc.id}/${ver.id}`,
                                              {
                                                action: 'STOP_OR_START_VERSION',
                                                serviceId: svc.id,
                                                versionId: ver.id,
                                                servingStatus:
                                                  ver.servingStatus === 'SERVING'
                                                    ? 'STOPPED'
                                                    : 'SERVING',
                                              }
                                            )
                                          }
                                          disabled={Boolean(appEngineActionBusy)}
                                          className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer disabled:opacity-50"
                                        >
                                          {ver.servingStatus === 'SERVING' ? 'Stop Version' : 'Start Version'}
                                        </button>
                                        {isDefault && ver.trafficPercent === 100 && svc.versionsCount === 1 ? (
                                          <span
                                            title="Google Cloud API permanently forbids deleting the sole 100%-traffic version inside the default service (default can never have 0 versions). Because the version is STOPPED and the app is USER_DISABLED, it costs $0.00/mo."
                                            className="px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold"
                                          >
                                            GCP API Lock (Last Version in default · $0/mo)
                                          </span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleExecuteAppEngineAction(verBusyKey, {
                                                action: 'DELETE_VERSION',
                                                serviceId: svc.id,
                                                versionId: ver.id,
                                              })
                                            }
                                            disabled={Boolean(appEngineActionBusy)}
                                            title={`Delete version ${ver.id} from service ${svc.id}`}
                                            className="px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-mono font-bold cursor-pointer disabled:opacity-40"
                                          >
                                            {appEngineActionBusy === verBusyKey
                                              ? 'Deleting...'
                                              : 'Delete Version'}
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* *.appspot.com Staging / Default GCS Buckets */}
            {aeBuckets.length > 0 && (
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-zinc-600 dark:text-zinc-300">
                  <span className="font-bold text-zinc-900 dark:text-white">
                    App Engine Staging & Default GCS Buckets ({aeBuckets.length}):
                  </span>{' '}
                  {aeBuckets.map((b) => `gs://${b.name}`).join(', ')}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {aeBuckets.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      onClick={() => handleEmptyAndDeleteStagingBucket(b.name)}
                      disabled={Boolean(artifactActionBusy)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/35 text-red-700 dark:text-red-300 text-[11px] font-mono font-bold cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Empty & Delete gs://{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* DEAD CONTAINER (ARTIFACT REGISTRY) & CLOUD STORAGE ARTIFACT HUNTER STUDIO */}
      {showArtifactHunter && (() => {
        const scanData = artifactScanState.data;
        const summary = scanData?.summary || {
          activeCloudRunServicesCount: services.length,
          repositoriesScannedCount: 0,
          totalContainerImagesCount: 0,
          activeContainerImagesCount: 0,
          deadContainerImagesCount: 0,
          deadContainerSizeMb: 0,
          deadContainerSizeGb: 0,
          bucketsScannedCount: 0,
          totalStorageObjectsCount: 0,
          buildStagingArtifactsCount: 0,
          totalStorageSizeMb: 0,
          buildStagingSizeMb: 0,
          reclaimableMonthlyUsd: 0,
        };
        const rawContainers = scanData?.containerImages || [];
        const rawStorage = scanData?.storageArtifacts || [];
        const storageBuckets = scanData?.storageBuckets || [];
        const q = artifactHunterSearch.trim().toLowerCase();

        const filteredContainers = rawContainers.filter((img) => {
          if (artifactOnlyDead && !img.isDead) return false;
          if (!q) return true;
          const hay = `${img.shortPackage} ${img.uri} ${img.repository} ${img.location} ${(img.tags || []).join(' ')} ${img.statusLabel}`.toLowerCase();
          return hay.includes(q);
        });

        const filteredStorage = rawStorage.filter((obj) => {
          if (artifactOnlyDead && !obj.isBuildStagingArtifact) return false;
          if (!q) return true;
          const hay = `${obj.bucket} ${obj.name} ${obj.location} ${obj.bucketLabel} ${obj.contentType}`.toLowerCase();
          return hay.includes(q);
        });

        const deadContainersList = rawContainers.filter(
          (img) =>
            img.isDead &&
            !img.isDeleting &&
            !deletingArtifactsMap[`img:${img.uri}`] &&
            !deletingArtifactsMap[`img:${img.name}`]
        );
        const buildStagingObjectsList = rawStorage.filter(
          (obj) =>
            obj.isBuildStagingArtifact &&
            !obj.isDeleting &&
            !deletingArtifactsMap[`gcs:${obj.id}`]
        );

        return (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-extrabold">
                    <HardDrive className="w-3 h-3" />
                    <span>ARTIFACT REGISTRY & CLOUD STORAGE HYGIENE SCANNER</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    <span>Active Cloud Run Containers Protected from Deletion</span>
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white mt-1">
                  Dead Container Images (Artifact Registry) & Build / Staging Artifacts (Cloud Storage)
                </h4>
                <p className="text-xs text-zinc-400">
                  Cross-references all live Cloud Run services against{' '}
                  <code className="text-amber-700 dark:text-amber-300">artifactregistry.googleapis.com/v1</code>{' '}
                  repositories and <code className="text-blue-700 dark:text-blue-300">storage.googleapis.com/v1</code>{' '}
                  buckets (`_cloudbuild`, `run-sources-*`, `gcf-v2-*`, and project buckets) to find unused container digests and leftover build tarballs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleScanDeadArtifacts(false)}
                  disabled={artifactScanState.loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      artifactScanState.loading ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {artifactScanState.loading ? 'Scanning GCP...' : 'Rescan Now'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowArtifactHunter(false)}
                  className="px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {artifactScanState.error && (
              <div className="p-3 rounded-lg bg-red-500/15 border border-red-500/40 text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{artifactScanState.error}</span>
              </div>
            )}

            {/* 4 Live KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  1. Dead Container Images (Artifact Registry)
                </div>
                <div className="text-base font-extrabold text-amber-400 mt-0.5">
                  {summary.deadContainerImagesCount} Dead / Unused ({summary.deadContainerSizeMb} MB)
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {summary.activeContainerImagesCount} Active in Cloud Run · {summary.repositoriesScannedCount} Repo(s)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  2. Cloud Storage Build & Staging Artifacts
                </div>
                <div className="text-base font-extrabold text-blue-400 mt-0.5">
                  {summary.buildStagingArtifactsCount} Staging · {summary.totalStorageObjectsCount} Total Objects
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {summary.totalStorageSizeMb} MB across {summary.bucketsScannedCount} Bucket(s)
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  3. Reclaimable Storage Spend
                </div>
                <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                  ${summary.reclaimableMonthlyUsd}/mo Reclaimable
                </div>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  $0.10/GB Artifact Registry · $0.02/GB Cloud Storage
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-1.5">
                <div className="text-[10px] font-mono text-zinc-400">
                  4. 1-Click Bulk Cleanup Actions
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={
                      deadContainersList.length === 0 ||
                      artifactActionBusy === 'SWEEP_ALL_CONTAINERS'
                    }
                    onClick={() => handleSweepAllDeadContainers(deadContainersList)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[11px] font-mono font-bold cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Sweep {deadContainersList.length} Dead Container(s)</span>
                  </button>
                  <button
                    type="button"
                    disabled={
                      buildStagingObjectsList.length === 0 ||
                      artifactActionBusy === 'PURGE_ALL_GCS'
                    }
                    onClick={() => handlePurgeGcsArtifacts(buildStagingObjectsList)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-700 dark:text-red-300 text-[11px] font-mono font-bold cursor-pointer disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Purge {buildStagingObjectsList.length} Build Tarball(s)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-Tab Switcher + Search + Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setArtifactHunterTab('CONTAINERS')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
                    artifactHunterTab === 'CONTAINERS'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Artifact Registry Containers ({filteredContainers.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setArtifactHunterTab('STORAGE')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-colors cursor-pointer ${
                    artifactHunterTab === 'STORAGE'
                      ? 'bg-blue-500 text-white'
                      : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Cloud Storage Artifacts ({filteredStorage.length})</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={artifactHunterSearch}
                  onChange={(e) => setArtifactHunterSearch(e.target.value)}
                  placeholder="Filter by image, repo, bucket, digest, or .tgz..."
                  className="px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 font-mono w-64"
                />
                <label className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer select-none bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <input
                    type="checkbox"
                    checked={artifactOnlyDead}
                    onChange={(e) => setArtifactOnlyDead(e.target.checked)}
                    className="rounded border-zinc-300 dark:border-zinc-700"
                  />
                  <span>Only Dead / Staging Artifacts</span>
                </label>
              </div>
            </div>

            {/* TAB 1: ARTIFACT REGISTRY CONTAINER IMAGES */}
            {artifactHunterTab === 'CONTAINERS' && (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {artifactScanState.loading && !scanData ? (
                  <div className="p-6 text-center text-xs font-mono text-zinc-400">
                    Scanning Artifact Registry repositories across regions and cross-referencing live Cloud Run revisions...
                  </div>
                ) : filteredContainers.length === 0 ? (
                  <div className="p-6 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center text-xs font-mono text-zinc-400">
                    No matching container images found in Artifact Registry.
                  </div>
                ) : (
                  filteredContainers.map((img) => {
                    const busyThis =
                      artifactActionBusy === `img:${img.uri || img.name}`;
                    const isDeletingImg = Boolean(
                      img.isDeleting ||
                        busyThis ||
                        deletingArtifactsMap[`img:${img.uri}`] ||
                        deletingArtifactsMap[`img:${img.name}`]
                    );
                    return (
                      <div
                        key={img.name || img.uri}
                        className={`relative overflow-hidden p-3 rounded-lg border flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all ${
                          isDeletingImg
                            ? 'border-red-500/40 bg-red-500/5 opacity-55 grayscale select-none pointer-events-none'
                            : img.isDead
                            ? 'bg-zinc-50 dark:bg-zinc-900/90 border-amber-500/30'
                            : 'bg-zinc-50 dark:bg-zinc-900/40 border-emerald-500/25'
                        }`}
                      >
                        {isDeletingImg && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/20 overflow-hidden">
                            <div className="h-full w-1/2 animate-pulse bg-red-500" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                isDeletingImg
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : !img.isDead
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : img.statusCategory === 'DEAD_DELETED_SERVICE'
                                  ? 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                              }`}
                            >
                              {isDeletingImg
                                ? 'DELETING CONTAINER...'
                                : !img.isDead
                                ? `PROTECTED · ${img.statusLabel}`
                                : `DEAD · ${img.statusLabel}`}
                            </span>
                            <span
                              className={`text-xs font-mono font-bold truncate ${
                                isDeletingImg
                                  ? 'line-through text-zinc-400'
                                  : 'text-zinc-900 dark:text-white'
                              }`}
                            >
                              {img.shortPackage}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              ({img.repository} · {img.location})
                            </span>
                            <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300">
                              {img.sizeMb} MB
                            </span>
                            {img.ageDays !== null && (
                              <span className="text-[10px] font-mono text-zinc-500">
                                · {img.ageDays}d old
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[11px] font-mono truncate ${
                              isDeletingImg
                                ? 'line-through text-zinc-500'
                                : 'text-zinc-400'
                            }`}
                          >
                            Digest:{' '}
                            <span className="text-zinc-700 dark:text-zinc-300">
                              {img.digestShort}
                            </span>{' '}
                            · Tags:{' '}
                            {img.tags?.length > 0 ? (
                              <span className="text-blue-700 dark:text-blue-300">
                                {img.tags.join(', ')}
                              </span>
                            ) : (
                              <span className="text-amber-400">
                                &lt;untagged orphan&gt;
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {isDeletingImg
                              ? 'Async GCP Artifact Registry deletion in progress — purging manifest & layers...'
                              : img.reason}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isDeletingImg ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-mono font-bold text-red-700 dark:text-red-300">
                              Deleting in GCP...
                            </span>
                          ) : img.isDead ? (
                            <button
                              type="button"
                              disabled={busyThis}
                              onClick={() => handleDeleteDeadContainerImage(img)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-700 dark:text-red-300 text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>
                                {busyThis ? 'Deleting...' : 'Delete Dead Container'}
                              </span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                              <Lock className="w-3 h-3" />
                              <span>Protected (Serving Cloud Run)</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: CLOUD STORAGE BUILD & STAGING ARTIFACTS */}
            {artifactHunterTab === 'STORAGE' && (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {/* Bucket Summary Strip */}
                {storageBuckets.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-1">
                    {storageBuckets.map((b) => {
                      const isDeletingBucket = Boolean(
                        b.isDeleting ||
                          artifactActionBusy === `bucket:${b.name}` ||
                          deletingArtifactsMap[`bucket:${b.name}`]
                      );
                      return (
                        <div
                          key={b.name}
                          className={`relative overflow-hidden px-2.5 py-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-2 transition-all ${
                            isDeletingBucket
                              ? 'border-red-500/40 bg-red-500/5 opacity-55 grayscale select-none pointer-events-none'
                              : b.isBuildStagingBucket
                              ? 'bg-amber-500/10 border-amber-500/35 text-amber-800 dark:text-amber-200'
                              : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span
                            className={
                              isDeletingBucket
                                ? 'line-through text-zinc-400'
                                : ''
                            }
                          >
                            gs://{b.name} ({b.objectsCount} obj · {b.totalSizeMb} MB)
                          </span>
                          {isDeletingBucket ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-700 dark:text-red-300 text-[10px] font-bold">
                              DELETING BUCKET...
                            </span>
                          ) : (
                            b.isBuildStagingBucket && (
                              <button
                                type="button"
                                disabled={artifactActionBusy === `bucket:${b.name}`}
                                onClick={() =>
                                  handleEmptyAndDeleteStagingBucket(b.name)
                                }
                                title="Force-empty and delete this entire staging bucket"
                                className="px-1.5 py-0.5 rounded bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-700 dark:text-red-300 text-[10px] font-bold cursor-pointer"
                              >
                                Empty & Delete Bucket
                              </button>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {artifactScanState.loading && !scanData ? (
                  <div className="p-6 text-center text-xs font-mono text-zinc-400">
                    Scanning Cloud Storage buckets (`_cloudbuild`, `run-sources-*`, `gcf-v2-*`, and project buckets) for build artifacts...
                  </div>
                ) : filteredStorage.length === 0 ? (
                  <div className="p-6 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center text-xs font-mono text-zinc-400">
                    No matching artifacts found in Cloud Storage buckets.
                  </div>
                ) : (
                  filteredStorage.map((obj) => {
                    const busyObj = artifactActionBusy === `gcs:${obj.id}`;
                    const isDeletingObj = Boolean(
                      obj.isDeleting ||
                        busyObj ||
                        deletingArtifactsMap[`gcs:${obj.id}`]
                    );
                    return (
                      <div
                        key={obj.id}
                        className={`relative overflow-hidden p-3 rounded-lg border flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-all ${
                          isDeletingObj
                            ? 'border-red-500/40 bg-red-500/5 opacity-55 grayscale select-none pointer-events-none'
                            : obj.isBuildStagingArtifact
                            ? 'bg-zinc-50 dark:bg-zinc-900/90 border-amber-500/30'
                            : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                        }`}
                      >
                        {isDeletingObj && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/20 overflow-hidden">
                            <div className="h-full w-1/2 animate-pulse bg-red-500" />
                          </div>
                        )}

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                isDeletingObj
                                  ? 'bg-red-500/20 text-red-400 border-red-500/40'
                                  : obj.isBuildStagingArtifact
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                                  : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
                              }`}
                            >
                              {isDeletingObj
                                ? 'DELETING ARTIFACT...'
                                : obj.isBuildStagingArtifact
                                ? 'BUILD / STAGING ARTIFACT'
                                : 'GCS ARTIFACT OBJECT'}
                            </span>
                            <span
                              className={`text-xs font-mono font-bold truncate ${
                                isDeletingObj
                                  ? 'line-through text-zinc-400'
                                  : 'text-zinc-900 dark:text-white'
                              }`}
                            >
                              gs://{obj.bucket}/{obj.name}
                            </span>
                            <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300">
                              {obj.sizeMb} MB
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              ({obj.location} · {obj.storageClass})
                            </span>
                            {obj.ageDays !== null && (
                              <span className="text-[10px] font-mono text-zinc-500">
                                · {obj.ageDays}d old
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {isDeletingObj
                              ? 'Deleting Cloud Storage artifact from GCP bucket...'
                              : obj.reason}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isDeletingObj ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-[10px] font-mono font-bold text-red-700 dark:text-red-300">
                              Deleting in GCP...
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busyObj}
                              onClick={() => handleDeleteSingleGcsArtifact(obj)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-700 dark:text-red-300 text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>
                                {busyObj ? 'Deleting...' : 'Delete Artifact'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* GLOBAL CLOUD RUN -> GKE KUBERNETES TRANSPILER & 1-CLICK MIGRATOR STUDIO */}
      {showGlobalGkeTranspiler && (() => {
        const sampleSrv = services[0] || {
          id: 'sample-cloudrun-service',
          name: 'cloudpulse-api',
          region: 'us-central1',
          containerImage: 'us-docker.pkg.dev/cloudrun/container/hello',
          containerPort: 8080,
          cpu: '2',
          memory: '4Gi',
          minInstances: 2,
          maxInstances: 12,
          concurrency: 80,
          timeoutSeconds: 300,
          ingress: 'INGRESS_TRAFFIC_ALL',
          gpuCount: 0,
          gpuType: 'nvidia-l4',
          envVars: [{ name: 'NODE_ENV', value: 'production' }],
        };
        const cfg = gkeConvertForms[sampleSrv.id] || {
          namespace: 'production',
          targetCluster: gkeClusters[0]?.name || '',
          targetLocation: gkeClusters[0]?.location || sampleSrv.region || 'us-central1',
          createAutopilotCluster: gkeClusters.length === 0,
          newClusterName: `${sampleSrv.name}-gke-autopilot`,
          enableSpot: true,
          enableZeroTrustNetPol: true,
          enableShmRamDisk: true,
          enableHpaPdb: true,
          enableWorkloadIdentity: true,
          manifestViewMode: 'K8S_BUNDLE',
        };
        const bundle = buildGkeGraduationBundle(sampleSrv, cfg);
        const isGraduating = busyMap[sampleSrv.id] === 'GRADUATING_GKE';

        return (
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold">
                  <span>BEYOND GCP CONSOLE YAML EXPORT · LIVE KNATIVE → KUBERNETES AST TRANSPILER</span>
                </div>
                <h4 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white mt-1">
                  Graduate Cloud Run Service (`{sampleSrv.name}`) → Production GKE Kubernetes Cluster
                </h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-300">
                  Google Cloud Console only gives you a raw Knative `serving.knative.dev/v1` YAML and leaves you on your own. CloudPulse transpiles your Cloud Run service into a <strong>6-Resource Native Kubernetes Bundle</strong> (`Deployment` + `HPA v2` + `PDB` + `Service` + `NetworkPolicy` + `Workload Identity SA`) and deploys it to a live GKE cluster in 1 click.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGlobalGkeTranspiler(false)}
                className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Close Studio
              </button>
            </div>

            {/* 4 Architectural & FinOps Benefits Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  1. Compute & GPU FinOps Arbitrage
                </div>
                <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                  ${bundle.gkeSpotMonthly}/mo on GKE Spot (-68%)
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  vs ${bundle.cloudRunMonthly}/mo Cloud Run Warm · Save ${bundle.monthlySavingsSpot}/mo
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  2. Shared RAM `/dev/shm` & Stateful CSI
                </div>
                <div className="text-sm font-extrabold text-blue-400 mt-0.5">
                  8Gi In-Memory `/dev/shm` Mounted
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  Prevents PyTorch, vLLM & Chromium IPC OOM crashes
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  3. Native HPA v2 + PodDisruptionBudget
                </div>
                <div className="text-sm font-extrabold text-blue-700 dark:text-blue-300 mt-0.5">
                  Scale {bundle.minReplicas} → {bundle.maxReplicas} Pods (Zero-Downtime)
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  Multi-zone spread + `minAvailable: 1` PDB protection
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[10px] font-mono text-zinc-400">
                  4. Zero-Timeout WebSockets & L3/L4 NetPol
                </div>
                <div className="text-sm font-extrabold text-amber-400 mt-0.5">
                  Unlimited Stream Duration + Seccomp
                </div>
                <div className="text-[10px] font-mono text-zinc-400">
                  No 3600s Cloud Run request timeout ceiling
                </div>
              </div>
            </div>

            {/* 5 Interactive GKE Superpower Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {[
                {
                  key: 'enableSpot',
                  label: 'Spot VM / GPU (-68%)',
                  sub: 'cloud.google.com/gke-spot',
                },
                {
                  key: 'enableHpaPdb',
                  label: 'HPA v2 + PDB HA',
                  sub: 'Autoscaler + Disruption Budget',
                },
                {
                  key: 'enableZeroTrustNetPol',
                  label: 'L3/L4 NetworkPolicy',
                  sub: 'Strict port firewall + Seccomp',
                },
                {
                  key: 'enableShmRamDisk',
                  label: '8Gi /dev/shm RAM Disk',
                  sub: 'For vLLM / PyTorch / Chrome',
                },
                {
                  key: 'enableWorkloadIdentity',
                  label: 'Workload Identity SA',
                  sub: `${projectId}.svc.id.goog`,
                },
              ].map((tog) => {
                const active = cfg[tog.key] !== false;
                return (
                  <button
                    key={tog.key}
                    type="button"
                    onClick={() =>
                      setGkeConvertForms((prev) => ({
                        ...prev,
                        [sampleSrv.id]: { ...cfg, [tog.key]: !active },
                      }))
                    }
                    className={`p-2 rounded-md border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600/30 border-blue-400 text-white'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <div className="text-[11px] font-bold font-mono">
                      {active ? '✓ ' : '○ '}
                      {tog.label}
                    </div>
                    <div className="text-[9.5px] text-zinc-400 mt-0.5">
                      {tog.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Target GKE Cluster & 1-Click Live Rollout Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <div className="text-xs font-extrabold text-blue-700 dark:text-blue-300 font-mono">
                  Target GKE Cluster & Namespace Rollout
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      Kubernetes Namespace
                    </label>
                    <input
                      type="text"
                      value={cfg.namespace || 'production'}
                      onChange={(e) =>
                        setGkeConvertForms((prev) => ({
                          ...prev,
                          [sampleSrv.id]: { ...cfg, namespace: e.target.value },
                        }))
                      }
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                      Target GKE Cluster ({gkeClusters.length} Active)
                    </label>
                    {gkeClusters.length > 0 && !cfg.createAutopilotCluster ? (
                      <select
                        value={cfg.targetCluster || gkeClusters[0]?.name || ''}
                        onChange={(e) =>
                          setGkeConvertForms((prev) => ({
                            ...prev,
                            [sampleSrv.id]: {
                              ...cfg,
                              targetCluster: e.target.value,
                            },
                          }))
                        }
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
                      >
                        {gkeClusters.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.location})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={cfg.newClusterName || `${sampleSrv.name}-gke-autopilot`}
                        onChange={(e) =>
                          setGkeConvertForms((prev) => ({
                            ...prev,
                            [sampleSrv.id]: {
                              ...cfg,
                              createAutopilotCluster: true,
                              newClusterName: e.target.value,
                            },
                          }))
                        }
                        placeholder="new-gke-autopilot-cluster"
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
                      />
                    )}
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(cfg.createAutopilotCluster)}
                    onChange={(e) =>
                      setGkeConvertForms((prev) => ({
                        ...prev,
                        [sampleSrv.id]: {
                          ...cfg,
                          createAutopilotCluster: e.target.checked,
                        },
                      }))
                    }
                  />
                  <span>
                    Auto-Provision New GKE Autopilot Cluster ($0.00/hr management fee covered by GKE Free Tier)
                  </span>
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isGraduating}
                    onClick={() => handleGraduateServiceToGke(sampleSrv)}
                    className="flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {isGraduating
                      ? 'Graduating Cloud Run Service to GKE...'
                      : cfg.createAutopilotCluster
                      ? `1-Click Create GKE Autopilot Cluster & Graduate ${sampleSrv.name}`
                      : `1-Click Apply 6-Resource K8s Bundle to GKE (${
                          cfg.targetCluster || gkeClusters[0]?.name
                        })`}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        bundle.k8sBundleYaml,
                        `global-gke-yaml-${sampleSrv.id}`
                      )
                    }
                    className="py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                  >
                    {copiedId === `global-gke-yaml-${sampleSrv.id}`
                      ? '✓ Copied K8s YAML'
                      : 'Copy 6-Resource YAML'}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setGkeConvertForms((prev) => ({
                          ...prev,
                          [sampleSrv.id]: {
                            ...cfg,
                            manifestViewMode: 'K8S_BUNDLE',
                          },
                        }))
                      }
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                        cfg.manifestViewMode !== 'KNATIVE_CONSOLE'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      CloudPulse 6-Resource GKE Bundle
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setGkeConvertForms((prev) => ({
                          ...prev,
                          [sampleSrv.id]: {
                            ...cfg,
                            manifestViewMode: 'KNATIVE_CONSOLE',
                          },
                        }))
                      }
                      className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                        cfg.manifestViewMode === 'KNATIVE_CONSOLE'
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      Raw GCP Console Knative YAML
                    </button>
                  </div>
                </div>
                <pre className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-52">
                  {cfg.manifestViewMode === 'KNATIVE_CONSOLE'
                    ? bundle.rawKnativeYaml
                    : bundle.k8sBundleYaml}
                </pre>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick 1-Tap Cloud Run Templates & Runtime Service Account Bar */}
      <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 shrink-0">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span>1-Tap Instant Deploy:</span>
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
            {QUICK_TEMPLATES.map((tpl) => {
              const isDeployingThis = quickDeploying === tpl.label;
              return (
                <button
                  key={tpl.label}
                  type="button"
                  disabled={Boolean(quickDeploying)}
                  onClick={() => handleQuickDeployTemplate(tpl)}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-mono font-semibold bg-white dark:bg-zinc-900 hover:bg-blue-500/10 text-zinc-800 dark:text-zinc-200 hover:text-blue-500 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 px-3 py-2 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeployingThis ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />
                  ) : (
                    <Rocket className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  )}
                  <span className="truncate">
                    {isDeployingThis ? `Deploying ${tpl.namePrefix}...` : tpl.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Runtime Service Account Selector for 1-Tap Instant Deploy */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="text-[11px] font-mono font-bold text-zinc-700 dark:text-zinc-300">
              Runtime Service Account (iam.serviceAccounts.actAs):
            </span>
            {defaultComputeSaMissing && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Default Compute SA Deleted · Using Custom SA
              </span>
            )}
          </div>
          <select
            value={selectedQuickSa}
            onMouseDown={() => {
              if (serviceAccounts.length === 0) {
                refreshServiceAccountsOnly();
              }
            }}
            onFocus={() => {
              if (serviceAccounts.length === 0) {
                refreshServiceAccountsOnly();
              }
            }}
            onChange={(e) => setSelectedQuickSa(e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100 max-w-full sm:max-w-md cursor-pointer"
          >
            {serviceAccounts.filter((sa) => !sa.disabled).length === 0 && (
              <option value="">
                Select Available Service Account ({projectId})
              </option>
            )}
            {serviceAccounts
              .filter((sa) => !sa.disabled)
              .map((sa) => (
                <option key={sa.email} value={sa.email}>
                  {sa.isCustom ? '★ [CUSTOM SA] ' : '[DEFAULT SA] '}
                  {sa.email}
                  {sa.displayName ? ` — ${sa.displayName}` : ''}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Live Cloud Run Services Grid */}
      {loading && services.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-zinc-500 dark:text-zinc-400" />
          <span>
            Querying live Cloud Run services across all regions in{' '}
            <span className="font-mono font-semibold">{projectId}</span>...
          </span>
        </div>
      ) : services.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 space-y-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              No Cloud Run Services Deployed Yet in {projectId}
            </h4>
            <p className="text-xs text-zinc-500 max-w-md mx-auto">
              Click <strong>+ Deploy Cloud Run Service</strong> to customize
              CPU, Memory, Min/Max Autoscaling, Concurrency, Port, Ingress &
              Environment Variables, or use a <strong>1-Tap Instant Deploy</strong>{' '}
              template above!
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenProvisionCloudRun}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Open Cloud Run Deployment Studio</span>
            </button>
            <button
              type="button"
              disabled={Boolean(quickDeploying)}
              onClick={() => handleQuickDeployTemplate(QUICK_TEMPLATES[0])}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span>1-Tap Deploy Hello Cloud Run</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGlobalGkeTranspiler(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md px-4 py-2 text-xs font-bold transition-colors cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Open Cloud Run → GKE Transpiler</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {services.map((srv) => {
            const busyState = busyMap[srv.id];
            const isDeleting = busyState === 'DELETING';
            const isUpdating =
              busyState === 'UPDATING' ||
              srv.reconciling ||
              srv.status === 'DEPLOYING';
            const activeDrawer = openDrawer[srv.id];
            const form = editForms[srv.id] || {};
            const tf = trafficForms[srv.id] || {};
            const isConfirmingDelete = confirmDeleteId === srv.id;

            return (
              <div
                key={srv.id}
                className={`relative overflow-hidden rounded-xl border p-4 transition-all space-y-3.5 ${
                  isDeleting
                    ? 'border-red-500/40 bg-red-500/5 opacity-55 grayscale select-none pointer-events-none'
                    : isUpdating
                    ? 'border-blue-500/40 bg-blue-500/[0.03] dark:bg-[#131314]'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-[#131314]'
                }`}
              >
                {(isDeleting || isUpdating) && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/20 overflow-hidden">
                    <div
                      className={`h-full w-1/2 animate-pulse ${
                        isDeleting ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                    />
                  </div>
                )}

                {/* Top Row: Service Name, Badges, URL & Quick Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold font-mono ${
                          isDeleting
                            ? 'line-through text-zinc-400'
                            : 'text-zinc-950 dark:text-zinc-50'
                        }`}
                      >
                        {srv.name}
                      </span>
                      <span className="text-[10px] font-mono bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded-full">
                        {srv.region}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isDeleting
                            ? 'bg-red-500/20 text-red-500'
                            : isUpdating
                            ? 'bg-amber-500/20 text-amber-500'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        }`}
                      >
                        {isDeleting
                          ? 'DELETING SERVICE...'
                          : isUpdating
                          ? 'DEPLOYING REVISION...'
                          : 'READY'}
                      </span>

                      {/* Public vs Private IAM Badge */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublicIam(srv)}
                        disabled={Boolean(busyState)}
                        title={
                          srv.allowUnauthenticated
                            ? `Current State: PUBLIC HTTPS (Unauthenticated / allUsers). Click to switch "${srv.name}" to Private (IAM Authenticated) — confirmation required.`
                            : `Current State: PRIVATE (IAM Authenticated). Click to switch "${srv.name}" to Public HTTPS (allUsers) — confirmation required.`
                        }
                        className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          srv.allowUnauthenticated
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 hover:bg-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 hover:bg-amber-500/20'
                        }`}
                      >
                        {srv.allowUnauthenticated ? (
                          <>
                            <Globe className="w-3 h-3" />
                            <span className="font-extrabold">
                              PUBLIC (Unauthenticated)
                            </span>
                            <span className="opacity-65 text-[9px]">
                              · Switch to Private
                            </span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3" />
                            <span className="font-extrabold">
                              PRIVATE (IAM Auth)
                            </span>
                            <span className="opacity-65 text-[9px]">
                              · Switch to Public
                            </span>
                          </>
                        )}
                      </button>

                      {/* App Engine-Style 1-Click Cloud IAP Toggle Badge ($0/mo Zero-LB) */}
                      <button
                        type="button"
                        onClick={() => handleToggleServiceIap(srv, !srv.iapEnabled)}
                        disabled={Boolean(busyState)}
                        title={
                          srv.iapEnabled
                            ? `App Engine-Style Direct Cloud IAP is ACTIVE on "${srv.name}" ($0.00/mo · Zero Load Balancer). Click to disable Direct Cloud IAP.`
                            : `App Engine-Style 1-Click Direct Cloud IAP ($0.00/mo · No $18/mo Load Balancer needed): Click to enable Google Sign-In IAP (run.googleapis.com/iap-enabled + IAP Service Agent Invoker + roles/iap.httpsResourceAccessor) in 1 click!`
                        }
                        className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          srv.iapEnabled
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                        }`}
                      >
                        <ShieldCheck className="w-3 h-3" />
                        <span className="font-extrabold">
                          {busyState === 'IAP'
                            ? 'CONFIGURING IAP...'
                            : srv.iapEnabled
                            ? 'CLOUD IAP ON (Zero-LB · $0/mo)'
                            : 'CLOUD IAP OFF'}
                        </span>
                        <span className="opacity-70 text-[9px]">
                          {srv.iapEnabled ? '· 1-Click Disable' : '· 1-Click Enable'}
                        </span>
                      </button>

                      {/* 2026 Direct VPC Egress Badge */}
                      {srv.enableDirectVpc && (
                        <span
                          title={`Direct VPC Egress Network: ${srv.vpcNetwork} / Subnet: ${srv.vpcSubnetwork} (${srv.vpcEgress})`}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                        >
                          <Network className="w-3 h-3" />
                          <span>
                            VPC: {srv.vpcNetwork || 'default'} (
                            {srv.vpcEgress === 'ALL_TRAFFIC'
                              ? 'All Traffic'
                              : 'Private Ranges'}
                            )
                          </span>
                        </span>
                      )}

                      {/* 2026 Storage Volume Mount Badge */}
                      {srv.storageVolumeType &&
                        srv.storageVolumeType !== 'NONE' && (
                          <button
                            type="button"
                            onClick={() =>
                              onSelectTab &&
                              srv.storageVolumeType === 'GCS_BUCKET' &&
                              onSelectTab('CLOUD_STORAGE')
                            }
                            title={`Mounted Volume (${srv.storageVolumeType}) at ${srv.storageMountPath}. Click to inspect persistent disk bucket in Cloud Storage Studio.`}
                            className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 cursor-pointer"
                          >
                            <HardDrive className="w-3 h-3" />
                            <span>
                              {srv.storageVolumeType === 'GCS_BUCKET'
                                ? `Persistent Disk: gs://${srv.storageGcsBucket} → ${srv.storageMountPath}`
                                : srv.storageVolumeType === 'IN_MEMORY'
                                ? `RAM (${srv.storageMemorySizeLimit || '1Gi'}) → ${srv.storageMountPath}`
                                : `NFS ${srv.storageNfsServer}:${srv.storageNfsPath} → ${srv.storageMountPath}`}
                            </span>
                          </button>
                        )}

                      {/* Migrated from GCE VM Badge */}
                      {srv.migratedFromVm && (
                        <button
                          type="button"
                          onClick={() => onSelectTab && onSelectTab('VM_SSH')}
                          title={`Migrated from Compute Engine VM "${srv.migratedFromVm}" (${srv.sourceVmZone || 'GCE'}) via CloudPulse mfit + m2c Modernization Engine`}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 cursor-pointer"
                        >
                          <Cpu className="w-3 h-3" />
                          <span>
                            Migrated VM: {srv.migratedFromVm}
                          </span>
                        </button>
                      )}

                      {/* Multi-Container Sidecar Pod Badge */}
                      {(srv.multiContainerCount || 1) > 1 && (
                        <span
                          title={`Multi-Container Sidecar Pod (${srv.multiContainerCount} containers sharing 127.0.0.1 and volume mounts)`}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                        >
                          <Layers className="w-3 h-3" />
                          <span>{srv.multiContainerCount}-Container Sidecar Pod</span>
                        </span>
                      )}

                      {/* Runtime Service Account Badge */}
                      {srv.serviceAccount && (
                        <span
                          title={`Runtime Service Account: ${srv.serviceAccount}`}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>
                            SA: {srv.serviceAccount.split('@')[0]}
                          </span>
                        </span>
                      )}

                      {/* Secret Manager Mounted Secrets Badge */}
                      {(srv.secretEnvRefs || []).length > 0 && (
                        <span
                          title={`Mounted Secret Manager references: ${(srv.secretEnvRefs || [])
                            .map((s) => `${s.name} → ${s.secretName}:${s.version}`)
                            .join(', ')}`}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>
                            {srv.secretEnvRefs.length} Secret Manager Ref
                            {srv.secretEnvRefs.length === 1 ? '' : 's'}
                          </span>
                        </span>
                      )}

                      {/* Plaintext Secret Leak Surgeon 1-Click Badge */}
                      {Number(srv.plaintextSecretCount || 0) > 0 && (
                        <button
                          type="button"
                          disabled={Boolean(busyState)}
                          onClick={() => handleSealSecretsInSecretManager(srv)}
                          title="Plaintext secret/key detected in container.env! Click to migrate to Google Cloud Secret Manager (secretmanager.googleapis.com/v1), bind roles/secretmanager.secretAccessor, and replace with secretKeyRef in 1 click."
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-300 border border-red-500/40 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>
                            {busyState === 'SEALING_SECRETS'
                              ? 'Sealing in Secret Manager...'
                              : `${srv.plaintextSecretCount} Plaintext Secret(s) · 1-Click Seal`}
                          </span>
                        </button>
                      )}

                      {/* Crash-Loop / Failed Revision Alert Badge */}
                      {srv.hasCrashedRevision && (
                        <button
                          type="button"
                          onClick={() => {
                            if (openDrawer[srv.id] !== 'TRAFFIC') {
                              toggleServiceDrawer(srv, 'TRAFFIC');
                            }
                          }}
                          title="One or more revisions on this Cloud Run service failed readiness checks! Click to open the Crash-Loop Autopsy & 1-Click Time-Machine Rollback."
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-600 text-white border border-red-500 shadow-sm animate-pulse cursor-pointer"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>
                            Crash-Loop Detected ({srv.crashedRevisionsCount || 1}) · 1-Click Autopsy & Rollback
                          </span>
                        </button>
                      )}
                    </div>

                    {/* Live HTTPS URL */}
                    <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-blue-400 flex-wrap">
                      <a
                        href={srv.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline inline-flex items-center gap-1 break-all"
                      >
                        <span>{srv.uri}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(srv.uri, `uri-${srv.id}`)}
                        className="text-[10px] text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 inline-flex items-center gap-0.5"
                      >
                        {copiedId === `uri-${srv.id}` ? (
                          <>
                            <Check className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleServiceDrawer(srv, 'IAP')}
                      title="App Engine-Style 1-Click Direct Cloud IAP Control Plane ($0.00/mo · Zero Load Balancer): Toggle Google Sign-In IAP and manage roles/iap.httpsResourceAccessor principals"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                        activeDrawer === 'IAP'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : srv.iapEnabled
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                          : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {srv.iapEnabled ? 'Cloud IAP (ON)' : '1-Click Cloud IAP'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleLoadServiceIntoJobForm(srv)}
                      title="Convert this Cloud Run Service into a Cloud Run v2 Batch Job (up to 24h timeout, parallel task sharding via CLOUD_RUN_TASK_INDEX, persistent GCS FUSE disk, and Cloud Scheduler :run trigger)"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20 transition-colors cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>→ Cloud Run Job</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleServiceDrawer(srv, 'CONVERT_GKE')}
                      title="Convert this Cloud Run service into a 6-Resource Production GKE Kubernetes Bundle (Deployment + HPA + PDB + NetworkPolicy + Spot GPU) & deploy to GKE in 1 click"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                        activeDrawer === 'CONVERT_GKE'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Graduate to GKE</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleServiceDrawer(srv, 'TUNE')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                        activeDrawer === 'TUNE'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Scale & Tune</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleServiceDrawer(srv, 'TRAFFIC')}
                      title="Open Cloud Run Revision Time-Machine, Crash-Loop Log Autopsy, Revision-to-Revision Diff & 1-Click Rollback"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                        activeDrawer === 'TRAFFIC'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : srv.hasCrashedRevision
                          ? 'bg-red-500/15 text-red-600 dark:text-red-300 border-red-500/40 hover:bg-red-500/25 font-bold'
                          : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                      }`}
                    >
                      <GitBranch className="w-3.5 h-3.5" />
                      <span>
                         Time-Machine & Autopsy ({srv.revisions?.length || 1})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleServiceDrawer(srv, 'LOCAL_TUNNEL')}
                      title="Open 127.0.0.1 Zero-Public-IP Developer Port-Forward Tunnel (gcloud run services proxy with automatic OIDC Bearer token injection)"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                        activeDrawer === 'LOCAL_TUNNEL'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Network className="w-3.5 h-3.5" />
                      <span>127.0.0.1 Proxy</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleServiceDrawer(srv, 'SSH_TERMINAL')}
                      title={
                        activeDrawer === 'SSH_TERMINAL'
                          ? `SSH is active on ${srv.name} — click to disconnect & turn SSH off`
                          : `Open interactive @xterm/xterm Container SSH session (gcloud beta run services ssh ${srv.name})`
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm cursor-pointer ${
                        activeDrawer === 'SSH_TERMINAL'
                          ? 'bg-blue-600 hover:bg-red-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>
                        {activeDrawer === 'SSH_TERMINAL'
                          ? 'SSH Active (Turn Off)'
                          : 'SSH / Container Shell'}
                      </span>
                    </button>

                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() =>
                          onRunInShell(
                            `gcloud run services describe ${srv.name} --region=${srv.region} --project=${projectId}`
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 cursor-pointer"
                        title="Inspect in Mobile Cloud Shell"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>CLI</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (isConfirmingDelete) {
                          setConfirmDeleteId(null);
                        } else {
                          setDeleteCleanupOpts({
                            deleteAssociatedScheduler: true,
                            deleteCompanionRunJob: false,
                            deleteAttachedDiskBucket: false,
                          });
                          setConfirmDeleteId(srv.id);
                        }
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors cursor-pointer ${
                        isConfirmingDelete
                          ? 'bg-red-600 text-white border-red-500 shadow-sm'
                          : 'text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isConfirmingDelete ? 'Cancel Delete' : 'Delete'}</span>
                    </button>
                  </div>
                </div>

                {/* DEDICATED CLOUD RUN SERVICE DECOMMISSION & SMART CLEANUP DRAWER */}
                {isConfirmingDelete && (() => {
                  const attachedDiskBkt =
                    srv.persistentDiskBuckets?.[0] || srv.storageGcsBucket || '';
                  const recreateCli = `gcloud run deploy ${srv.name} --project=${projectId} --region=${srv.region} --image=${srv.containerImage || 'us-docker.pkg.dev/cloudrun/container/hello'} --cpu=${srv.cpu || '1'} --memory=${srv.memory || '512Mi'} --min-instances=${srv.minInstances || 0} --max-instances=${srv.maxInstances || 10}${
                    attachedDiskBkt
                      ? ` --add-volume=name=disk-vol,type=cloud-storage,bucket=${attachedDiskBkt} --add-volume-mount=volume=disk-vol,mount-path=${srv.storageMountPath || '/mnt/gce-disk'}`
                      : ''
                  } --allow-unauthenticated`;

                  return (
                    <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500/40 space-y-3 text-xs animate-in fade-in duration-150">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/25 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mono font-extrabold text-red-700 dark:text-red-300 text-xs sm:text-sm">
                              Decommission Cloud Run Service &ldquo;{srv.name}&rdquo; ({srv.region})?
                            </div>
                            <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                              Review blast radius, copy a 1-click recreate command if needed, and choose which associated resources to clean up.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(recreateCli, `recreate-${srv.id}`)
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-zinc-700 font-mono text-[11px] font-bold cursor-pointer"
                          title={recreateCli}
                        >
                          {copiedId === `recreate-${srv.id}` ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">
                                Copied Recreate CLI!
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                              <span>Copy 1-Click Recreate CLI Before Deleting</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* 3-Card Blast Radius Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-red-500/25 space-y-0.5">
                          <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            1. HTTPS Endpoint &amp; Revisions
                          </div>
                          <div className="text-zinc-600 dark:text-zinc-300 break-all">
                            Terminates <code>{srv.uri}</code> and all{' '}
                            <strong>{(srv.revisions || []).length || 1} revision(s)</strong> in{' '}
                            <code>{srv.region}</code>.
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-red-500/25 space-y-0.5">
                          <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            2. Compute &amp; Container Image
                          </div>
                          <div className="text-zinc-600 dark:text-zinc-300 break-all">
                            Releases <strong>{srv.cpu} vCPU / {srv.memory}</strong> (Min {srv.minInstances} → Max {srv.maxInstances}). Container image{' '}
                            <code>{srv.containerImage?.split('/').pop()}</code> remains intact in registry.
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/80 border border-red-500/25 space-y-0.5">
                          <div className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                            3. Persistent Storage Safety
                          </div>
                          <div className="text-zinc-600 dark:text-zinc-300">
                            {attachedDiskBkt ? (
                              <>
                                Attached FUSE Disk{' '}
                                <strong className="text-emerald-600 dark:text-emerald-400">
                                  gs://{attachedDiskBkt}
                                </strong>{' '}
                                is <strong>KEPT SAFE</strong> by default unless you check bucket deletion below.
                              </>
                            ) : (
                              'Stateless service (no external persistent GCS FUSE disk attached).'
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Smart Associated Resource Cleanup Checkboxes */}
                      <div className="p-2.5 rounded-lg bg-white/60 dark:bg-zinc-950/60 border border-red-500/20 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-zinc-800 dark:text-zinc-200">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                deleteCleanupOpts.deleteAssociatedScheduler
                              )}
                              onChange={(e) =>
                                setDeleteCleanupOpts((prev) => ({
                                  ...prev,
                                  deleteAssociatedScheduler: e.target.checked,
                                }))
                              }
                              className="rounded border-red-400 text-red-600"
                            />
                            <span>
                              Clean up associated Cloud Scheduler trigger (
                              <code>{srv.name}-cron</code>)
                            </span>
                          </label>

                          <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(
                                deleteCleanupOpts.deleteCompanionRunJob
                              )}
                              onChange={(e) =>
                                setDeleteCleanupOpts((prev) => ({
                                  ...prev,
                                  deleteCompanionRunJob: e.target.checked,
                                }))
                              }
                              className="rounded border-red-400 text-red-600"
                            />
                            <span>
                              Also delete companion Cloud Run Batch Job (
                              <code>{srv.name}-batch-job</code>)
                            </span>
                          </label>

                          {attachedDiskBkt && (
                            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-red-600 dark:text-red-400 font-bold">
                              <input
                                type="checkbox"
                                checked={Boolean(
                                  deleteCleanupOpts.deleteAttachedDiskBucket
                                )}
                                onChange={(e) =>
                                  setDeleteCleanupOpts((prev) => ({
                                    ...prev,
                                    deleteAttachedDiskBucket: e.target.checked,
                                  }))
                                }
                                className="rounded border-red-500 text-red-600"
                              />
                              <span>
                                Also permanently delete attached Disk Bucket (
                                <code>gs://{attachedDiskBkt}</code>)
                              </span>
                            </label>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-mono font-semibold text-xs cursor-pointer"
                          >
                            Keep Service Safe
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(srv)}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white font-mono font-bold text-xs shadow-sm cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              Permanently Delete {srv.name}
                              {deleteCleanupOpts.deleteAttachedDiskBucket && attachedDiskBkt
                                ? ` + gs://${attachedDiskBkt}`
                                : ''}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Spec Summary Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      CPU, RAM & GPU
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>
                        {srv.cpu} vCPU · {srv.memory}
                      </span>
                      {Number(srv.gpuCount || 0) > 0 && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-500 border border-blue-500/30 px-1.5 py-0.2 rounded-full">
                          {srv.gpuCount}x {srv.gpuType || 'nvidia-l4'}
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-[10px] font-mono font-semibold ${
                        srv.cpuIdle
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {srv.cpuIdle
                        ? 'Request-based Billing ($0 Idle)'
                        : 'Instance-based Billing (Always-On)'}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Autoscaling
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      Min {srv.minInstances} → Max {srv.maxInstances}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-medium">
                      {srv.minInstances === 0
                        ? 'Scale-to-$0 Enabled'
                        : `${srv.minInstances} Warm Instances`}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Concurrency & Port
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {srv.concurrency} req/inst · :{srv.containerPort}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Timeout: {srv.timeoutSeconds}s
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Ingress & Runtime
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                      {srv.ingress.replace('INGRESS_TRAFFIC_', '')}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {srv.executionEnvironment.replace(
                        'EXECUTION_ENVIRONMENT_',
                        ''
                      )}
                      {Number(srv.gpuCount || 0) > 0 &&
                        (srv.gpuZonalRedundancy
                          ? ' · Zonal Redundant GPU'
                          : ' · No GPU Zonal Redundancy')}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 col-span-2">
                    <div className="text-[10px] font-mono uppercase text-zinc-400">
                      Container Image & Active Revision
                    </div>
                    <div
                      className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5 truncate"
                      title={srv.containerImage}
                    >
                      {srv.containerImage}
                    </div>
                    <div className="text-[10px] font-mono text-blue-500 truncate">
                      Rev: {srv.latestReadyRevision}
                      {srv.envVars?.length > 0 &&
                        ` · ${srv.envVars.length} Env Var(s)`}
                    </div>
                  </div>
                </div>

                {/* DRAWER 0: APP ENGINE-STYLE 1-CLICK CLOUD RUN IAP (ZERO-LB SHIELD & ACCESSOR CONTROL PLANE) */}
                {activeDrawer === 'IAP' && (() => {
                  const iapEntry = iapStateMap[srv.id] || {};
                  const iapData = iapEntry.data || {};
                  const isIapOn =
                    iapData.iapEnabled !== undefined
                      ? Boolean(iapData.iapEnabled)
                      : Boolean(srv.iapEnabled);
                  const currentAccessors =
                    iapData.iapAccessors || iapData.suggestedAccessors || [];
                  const steps = iapEntry.steps || [];

                  return (
                    <div className="mt-3 pt-4 border-t border-blue-500/30 space-y-4 bg-gradient-to-br from-blue-500/5 via-white to-emerald-500/5 dark:from-blue-950/25 dark:via-zinc-950 dark:to-emerald-950/20 p-4 rounded-xl">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/40">
                              APP ENGINE-STYLE 1-CLICK CLOUD IAP · ZERO LOAD BALANCER ($0.00/MO)
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                isIapOn
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                  : 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30'
                              }`}
                            >
                              {isIapOn
                                ? 'DIRECT CLOUD IAP: ACTIVE (GOOGLE SIGN-IN ENFORCED)'
                                : 'DIRECT CLOUD IAP: INACTIVE'}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-extrabold font-mono text-zinc-900 dark:text-white flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-blue-500" />
                            <span>
                              Direct Identity-Aware Proxy (IAP) Shield — {srv.name} ({srv.region})
                            </span>
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleInspectServiceIap(srv)}
                            disabled={iapEntry.loading}
                            className="px-2.5 py-1 rounded-md text-[11px] font-mono border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/50 cursor-pointer"
                          >
                            {iapEntry.loading ? 'Inspecting...' : 'Refresh IAP State'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }))
                            }
                            className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {/* Architectural Comparison Callout: Why CloudPulse 1-Click IAP beats legacy GCP Console */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">
                            Legacy Cloud Run IAP (Old Way)
                          </div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            ~$18.25+/mo + 6 Networking Resources
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Required provisioning a Global External Application Load Balancer, Forwarding Rule, Target HTTPS Proxy, Managed SSL Cert, Backend Service, and Serverless NEG.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-blue-500/30 space-y-1">
                          <div className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">
                            CloudPulse 1-Click Direct IAP (New Way)
                          </div>
                          <div className="font-bold text-emerald-600 dark:text-emerald-400">
                            $0.00/mo · Native .run.app IAP Shield
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Orchestrates all 4 control-plane steps in 1 click: enables <code className="font-mono">iap.googleapis.com</code>, sets <code className="font-mono">run.googleapis.com/iap-enabled=true</code>, binds the IAP Service Agent to <code className="font-mono">roles/run.invoker</code>, and grants <code className="font-mono">roles/iap.httpsResourceAccessor</code>.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1 font-mono">
                          <div className="text-[10px] font-bold uppercase text-zinc-400">
                            Live IAP Service Agent &amp; Status
                          </div>
                          <div className="text-[11px] text-zinc-800 dark:text-zinc-200 break-all">
                            {iapData.iapServiceAgent ||
                              srv.iapServiceAgentEmail ||
                              'service-<PROJECT_NUMBER>@gcp-sa-iap.iam.gserviceaccount.com'}
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9.5px] ${
                                iapData.annotationEnabled || srv.iapEnabled
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                  : 'bg-zinc-500/15 text-zinc-500'
                              }`}
                            >
                              Annotation: {iapData.annotationEnabled || srv.iapEnabled ? 'TRUE' : 'FALSE'}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9.5px] ${
                                iapData.iapServiceAgentHasInvoker || srv.iapServiceAgentBound
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                  : 'bg-zinc-500/15 text-zinc-500'
                              }`}
                            >
                              SA Invoker: {iapData.iapServiceAgentHasInvoker || srv.iapServiceAgentBound ? 'BOUND' : 'UNBOUND'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Accessor Input & 1-Click Enable / Disable Actions */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end bg-white dark:bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="lg:col-span-7 space-y-1">
                          <label className="block text-[11px] font-mono font-bold uppercase text-zinc-600 dark:text-zinc-300">
                            Authorized Google Sign-In Principals (roles/iap.httpsResourceAccessor)
                          </label>
                          <input
                            type="text"
                            value={
                              iapEntry.accessorsInput !== undefined
                                ? iapEntry.accessorsInput
                                : currentAccessors.join(', ')
                            }
                            onChange={(e) =>
                              setIapStateMap((prev) => ({
                                ...prev,
                                [srv.id]: {
                                  ...(prev[srv.id] || {}),
                                  accessorsInput: e.target.value,
                                },
                              }))
                            }
                            placeholder="user:you@gmail.com, domain:yourcompany.com, group:sre@yourcompany.com"
                            className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                          />
                          <div className="text-[10px] font-mono text-zinc-500">
                            Comma-separated emails or domains (auto-prefixed with <code className="text-blue-500">user:</code> or <code className="text-blue-500">domain:</code>). Defaults to your active Google account so you are never locked out.
                          </div>
                        </div>

                        <div className="lg:col-span-5 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={Boolean(busyState)}
                            onClick={() =>
                              handleToggleServiceIap(
                                srv,
                                true,
                                iapEntry.accessorsInput !== undefined
                                  ? iapEntry.accessorsInput
                                  : currentAccessors.join(', ')
                              )
                            }
                            className="px-3.5 py-2 rounded-md text-xs font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {busyState === 'IAP'
                              ? 'Orchestrating 4-Step IAP...'
                              : isIapOn
                              ? 'Update IAP & Sync Accessors ($0/mo)'
                              : 'Enable 1-Click Cloud IAP ($0/mo)'}
                          </button>

                          {isIapOn && (
                            <button
                              type="button"
                              disabled={Boolean(busyState)}
                              onClick={() => handleToggleServiceIap(srv, false)}
                              className="px-3 py-2 rounded-md text-xs font-mono font-bold bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-300 border border-red-500/30 cursor-pointer disabled:opacity-50"
                            >
                              Disable Cloud IAP
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Org-Less (@gmail.com) Project Custom OAuth 2.0 Client Binder (accessSettings.oauthSettings) */}
                      {iapData.isOrglessProject !== false && (
                        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300">
                              Org-Less (@gmail.com) Project OAuth 2.0 Client Binder (projects/{iapData.projectNumber || '<PROJECT_NUMBER>'}/iap_web:iapSettings)
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                iapData.oauthClientConfigured
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                              }`}
                            >
                              {iapData.oauthClientConfigured
                                ? `OAuth Client Bound (${iapData.oauthClientId.slice(0, 18)}...)`
                                : 'Optional: Bind Web OAuth 2.0 Client ID & Secret for Non-Org Projects'}
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Standalone personal projects outside a Google Workspace Organization require a custom Web Application OAuth 2.0 Client ID &amp; Secret bound to <code className="font-mono">iap_web:iapSettings</code> (otherwise Google Frontend returns <code className="font-mono">Empty Google Account OAuth client ID(s)/secret(s)</code>). Add Authorized Redirect URI:{' '}
                            <code className="font-mono text-blue-600 dark:text-blue-300">
                              https://iap.googleapis.com/v1/oauth/clientIds/{iapEntry.oauthClientId || iapData.oauthClientId || '<CLIENT_ID>'}:handleRedirect
                            </code>
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                            <input
                              type="text"
                              value={
                                iapEntry.oauthClientId !== undefined
                                  ? iapEntry.oauthClientId
                                  : iapData.oauthClientId || ''
                              }
                              onChange={(e) =>
                                setIapStateMap((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    ...(prev[srv.id] || {}),
                                    oauthClientId: e.target.value,
                                  },
                                }))
                              }
                              placeholder="OAuth 2.0 Client ID (e.g. 386324601185-xxxx.apps.googleusercontent.com)"
                              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            />
                            <input
                              type="password"
                              value={iapEntry.oauthClientSecret || ''}
                              onChange={(e) =>
                                setIapStateMap((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    ...(prev[srv.id] || {}),
                                    oauthClientSecret: e.target.value,
                                  },
                                }))
                              }
                              placeholder="OAuth 2.0 Client Secret (GOCSPX-...)"
                              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                            />
                          </div>
                        </div>
                      )}

                      {/* 4-Step Orchestration Receipt (if executed) */}
                      {steps.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {steps.map((st) => (
                            <div
                              key={st.id}
                              className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-500/30 space-y-1 font-mono"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                  STEP 0{st.step}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                    st.status === 'COMPLETED'
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                                  }`}
                                >
                                  {st.status}
                                </span>
                              </div>
                              <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                                {st.title}
                              </div>
                              <div className="text-[10px] text-zinc-500 dark:text-zinc-400 break-words">
                                {st.detail}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Equivalent gcloud 590.0.0 GA CLI Commands */}
                      {iapData.cliCommands && (
                        <div className="p-3 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-[11px] space-y-1.5 border border-zinc-800">
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span>
                              EQUIVALENT GCLOUD 590.0.0 GA DIRECT CLOUD RUN IAP COMMANDS (AUTOMATED ABOVE):
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  `${iapData.cliCommands.enableDirectIap}\n${iapData.cliCommands.grantAccessor}`,
                                  `iap-cli-${srv.id}`
                                )
                              }
                              className="text-blue-400 hover:text-blue-300 cursor-pointer"
                            >
                              {copiedId === `iap-cli-${srv.id}`
                                ? 'Copied!'
                                : 'Copy CLI Bundle'}
                            </button>
                          </div>
                          <div className="text-emerald-300 break-all">
                            $ {iapData.cliCommands.enableDirectIap}
                          </div>
                          <div className="text-blue-300 break-all">
                            $ {iapData.cliCommands.grantAccessor}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* DRAWER 1: LIVE SCALE & TUNE CONFIGURATION */}
                {activeDrawer === 'TUNE' && (
                  <div className="mt-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-950 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-blue-500 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5" />
                        <span>
                          Live Cloud Run Revision Tuner — {srv.name} ({srv.region})
                        </span>
                      </h4>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }))
                        }
                        className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                      >
                        Close
                      </button>
                    </div>

                    {/* 2026 Billing Mode & Serverless GPU Accelerator Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
                      <div>
                        <label className="block text-[11px] font-bold font-mono uppercase text-zinc-600 dark:text-zinc-300 mb-1.5">
                          2026 Billing Mode (Request-based vs Instance-based)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                            onClick={() =>
                              setEditForms((prev) => ({
                                ...prev,
                                [srv.id]: {
                                  ...form,
                                  billingMode: 'REQUEST_BASED',
                                  cpuIdle: true,
                                },
                              }))
                            }
                            className={`p-2 rounded-md border text-left text-xs font-mono transition-colors ${
                              form.billingMode === 'REQUEST_BASED' &&
                              (!form.gpuAccelerator ||
                                form.gpuAccelerator === 'NONE')
                                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 disabled:opacity-40'
                            }`}
                          >
                            <div>Request-based</div>
                            <div className="text-[10px] opacity-80">
                              CPU during reqs ($0 Idle)
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setEditForms((prev) => ({
                                ...prev,
                                [srv.id]: {
                                  ...form,
                                  billingMode: 'INSTANCE_BASED',
                                  cpuIdle: false,
                                },
                              }))
                            }
                            className={`p-2 rounded-md border text-left text-xs font-mono transition-colors ${
                              form.billingMode === 'INSTANCE_BASED' ||
                              (form.gpuAccelerator &&
                                form.gpuAccelerator !== 'NONE')
                                ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                                : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                            }`}
                          >
                            <div>Instance-based</div>
                            <div className="text-[10px] opacity-80">
                              Always-On CPU/GPU
                            </div>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold font-mono uppercase text-blue-600 dark:text-blue-400 mb-1.5">
                          2026 Serverless GPU Accelerator
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { id: 'NONE', label: 'No GPU' },
                            { id: 'nvidia-l4', label: '1x NVIDIA L4' },
                            {
                              id: 'nvidia-rtx-pro-6000',
                              label: '1x RTX 6000',
                            },
                          ].map((g) => {
                            const active =
                              (form.gpuAccelerator || 'NONE') === g.id;
                            return (
                              <button
                                key={g.id}
                                type="button"
                                onClick={() => {
                                  const nextCpu =
                                    g.id !== 'NONE' && Number(form.cpu) < 4
                                      ? '4'
                                      : form.cpu;
                                  const nextMem =
                                    g.id !== 'NONE' &&
                                    !['16Gi', '32Gi'].includes(form.memory)
                                      ? '16Gi'
                                      : form.memory;
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      gpuAccelerator: g.id,
                                      cpu: nextCpu,
                                      memory: nextMem,
                                      billingMode:
                                        g.id !== 'NONE'
                                          ? 'INSTANCE_BASED'
                                          : form.billingMode,
                                      cpuIdle:
                                        g.id !== 'NONE' ? false : form.cpuIdle,
                                    },
                                  }));
                                }}
                                className={`p-2 rounded-md border text-xs font-mono transition-colors ${
                                  active
                                    ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                                    : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                                }`}
                              >
                                {g.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                      <div className="min-w-0">
                        <label
                          title="vCPU Allocation per Container Instance"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          vCPU Allocation
                        </label>
                        <select
                          value={form.cpu || '1'}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: { ...form, cpu: e.target.value },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        >
                          <option
                            value="1"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            1 vCPU
                          </option>
                          <option
                            value="2"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            2 vCPU
                          </option>
                          <option value="4">4 vCPU (GPU Min)</option>
                          <option value="8">8 vCPU</option>
                        </select>
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Memory Limit per Container Instance"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Memory Limit
                        </label>
                        <select
                          value={form.memory || '512Mi'}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: { ...form, memory: e.target.value },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        >
                          <option
                            value="256Mi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            256Mi
                          </option>
                          <option
                            value="512Mi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            512Mi
                          </option>
                          <option
                            value="1Gi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            1Gi
                          </option>
                          <option
                            value="2Gi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            2Gi
                          </option>
                          <option
                            value="4Gi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            4Gi
                          </option>
                          <option
                            value="8Gi"
                            disabled={
                              form.gpuAccelerator &&
                              form.gpuAccelerator !== 'NONE'
                            }
                          >
                            8Gi
                          </option>
                          <option value="16Gi">16Gi (GPU Min)</option>
                          <option value="32Gi">32Gi</option>
                        </select>
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Min Instances (0 = Scale to $0 Idle)"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Min Instances (0=$0)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={form.minInstances ?? 0}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                minInstances: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Max Instances (Cost Cap)"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Max Instances (Cap)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={form.maxInstances ?? 10}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                maxInstances: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Max Concurrent Requests per Instance"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Concurrency (req/inst)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={form.concurrency ?? 80}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                concurrency: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Container Listening Port"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Container Port
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={65535}
                          value={form.containerPort ?? 8080}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                containerPort: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Ingress Network Policy"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Ingress Policy
                        </label>
                        <select
                          value={form.ingress || 'INGRESS_TRAFFIC_ALL'}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: { ...form, ingress: e.target.value },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        >
                          <option value="INGRESS_TRAFFIC_ALL">
                            All Traffic (Public Internet)
                          </option>
                          <option value="INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER">
                            Internal + Cloud Load Balancer
                          </option>
                          <option value="INGRESS_TRAFFIC_INTERNAL_ONLY">
                            Internal VPC Traffic Only
                          </option>
                        </select>
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Startup CPU Boost"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Startup CPU Boost
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                startupCpuBoost: !form.startupCpuBoost,
                              },
                            }))
                          }
                          className={`w-full h-[34px] rounded-md px-2.5 text-xs font-mono border text-left flex items-center truncate ${
                            form.startupCpuBoost
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-500'
                          }`}
                        >
                          {form.startupCpuBoost
                            ? 'Startup CPU Boost ON'
                            : 'Startup CPU Boost OFF'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div className="min-w-0">
                        <label
                          title="Runtime Service Account (iam.serviceAccounts.actAs)"
                          className="block text-[11px] font-medium text-blue-600 dark:text-blue-400 mb-1 truncate whitespace-nowrap"
                        >
                          Runtime Service Account (iam.serviceAccounts.actAs)
                        </label>
                        <select
                          value={form.serviceAccount || ''}
                          onMouseDown={() => {
                            if (serviceAccounts.length === 0) {
                              refreshServiceAccountsOnly();
                            }
                          }}
                          onFocus={() => {
                            if (serviceAccounts.length === 0) {
                              refreshServiceAccountsOnly();
                            }
                          }}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                serviceAccount: e.target.value,
                              },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 cursor-pointer"
                        >
                          {serviceAccounts.filter((sa) => !sa.disabled).length ===
                            0 && (
                            <option value={form.serviceAccount || ''}>
                              {form.serviceAccount ||
                                `Auto-Resolve Custom SA (${projectId})`}
                            </option>
                          )}
                          {serviceAccounts
                            .filter((sa) => !sa.disabled)
                            .map((sa) => (
                              <option key={sa.email} value={sa.email}>
                                {sa.isCustom ? '★ [CUSTOM SA] ' : '[DEFAULT SA] '}
                                {sa.email}
                                {sa.displayName ? ` — ${sa.displayName}` : ''}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Container Image URI"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Container Image URI
                        </label>
                        <input
                          type="text"
                          value={form.containerImage || ''}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                containerImage: e.target.value,
                              },
                            }))
                          }
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>

                      <div className="min-w-0">
                        <label
                          title="Environment Variables (KEY=VALUE per line or comma)"
                          className="block text-[11px] font-medium text-zinc-500 mb-1 truncate whitespace-nowrap"
                        >
                          Environment Variables (KEY=VALUE)
                        </label>
                        <input
                          type="text"
                          value={form.envVarsText || ''}
                          onChange={(e) =>
                            setEditForms((prev) => ({
                              ...prev,
                              [srv.id]: {
                                ...form,
                                envVarsText: e.target.value,
                              },
                            }))
                          }
                          placeholder="NODE_ENV=production, OPENAI_API_KEY=sk-..."
                          className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    {/* Secret Manager (secretmanager.googleapis.com/v1) & Plaintext Env-Var Leak Surgeon */}
                    {(() => {
                      const sensitiveRe =
                        /(?:SECRET|TOKEN|PASSWORD|PASSWD|API_KEY|PRIVATE_KEY|AUTH_KEY|CLIENT_SECRET|DB_PASS|DATABASE_URL|REDIS_URL|STRIPE_KEY|OPENAI_API_KEY|GEMINI_API_KEY|JWT)/i;
                      const valueSecretRe =
                        /^(?:AIzaSy|sk-[a-zA-Z0-9]{16,}|ghp_[a-zA-Z0-9]{16,}|postgres(?:ql)?:\/\/[^:]+:[^@]+@)/i;
                      const livePairs = String(form.envVarsText || '')
                        .split(/[\n,]/)
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((pair) => {
                          const eqIdx = pair.indexOf('=');
                          if (eqIdx <= 0) return null;
                          const name = pair.slice(0, eqIdx).trim();
                          const value = pair.slice(eqIdx + 1).trim();
                          const isSensitive =
                            sensitiveRe.test(name) || valueSecretRe.test(value);
                          return { name, value, isSensitive };
                        })
                        .filter(Boolean);
                      const sensitivePairs = livePairs.filter(
                        (p) => p.isSensitive
                      );
                      const mountedRefs = srv.secretEnvRefs || [];

                      if (livePairs.length === 0 && mountedRefs.length === 0) {
                        return null;
                      }

                      return (
                        <div
                          className={`p-3 rounded-xl border space-y-2.5 ${
                            sensitivePairs.length > 0
                              ? 'bg-red-500/[0.06] border-red-500/35'
                              : 'bg-emerald-500/[0.05] border-emerald-500/30'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold font-mono uppercase tracking-wider text-zinc-800 dark:text-zinc-100">
                              <KeyRound
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  sensitivePairs.length > 0
                                    ? 'text-red-500'
                                    : 'text-emerald-500'
                                }`}
                              />
                              <span>
                                Secret Manager Plaintext Leak Surgeon (
                                `secretmanager.googleapis.com/v1`)
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {onOpenSecretManagerStudio && (
                                <button
                                  type="button"
                                  onClick={() => onOpenSecretManagerStudio()}
                                  title="Open Dedicated Secret Manager Lifecycle Studio to rotate versions, disable old versions ($0/mo), manage IAM secretAccessor bindings, and track your 6 Free Active Versions quota"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
                                >
                                  <KeyRound className="w-3 h-3 text-amber-400" />
                                  <span>
                                    Open Secret Manager Studio (Rotate & Versions) →
                                  </span>
                                </button>
                              )}

                              {livePairs.length > 0 && (
                                <button
                                  type="button"
                                  disabled={Boolean(busyState)}
                                  onClick={() =>
                                    handleSealSecretsInSecretManager(
                                      srv,
                                      sensitivePairs.length > 0
                                        ? sensitivePairs.map((p) => p.name)
                                        : livePairs.map((p) => p.name)
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm transition-colors cursor-pointer"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>
                                    {busyState === 'SEALING_SECRETS'
                                      ? 'Sealing in Secret Manager & Binding IAM...'
                                      : sensitivePairs.length > 0
                                      ? `1-Click Seal ${sensitivePairs.length} Detected Secret(s) in Secret Manager`
                                      : `Seal All ${livePairs.length} Env Var(s) in Secret Manager`}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* FinOps Free Tier vs Paid Tier Transparency Box */}
                          <div className="p-2.5 rounded-lg bg-white/80 dark:bg-zinc-950/70 border border-emerald-500/25 text-[10.5px] leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                                Monthly Free Tier: First 6 Active Secret Versions FREE + 10,000 Access Ops FREE + 3 Rotations FREE / month
                              </span>
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono font-bold text-[9.5px]">
                                Beyond 6 Free: $0.06 / active version / mo · $0.03 / 10k access ops
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                              <strong>FinOps Rotation Tip:</strong> Only{' '}
                              <code className="text-emerald-600 dark:text-emerald-400 font-bold">
                                ENABLED
                              </code>{' '}
                              versions count toward your 6 free versions or the $0.06/mo fee.{' '}
                              <code className="font-bold">DISABLED</code> and{' '}
                              <code className="font-bold">DESTROYED</code> versions cost{' '}
                              <strong className="text-emerald-600 dark:text-emerald-400">
                                $0.00/mo
                              </strong>
                              ! Use the{' '}
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenSecretManagerStudio &&
                                  onOpenSecretManagerStudio()
                                }
                                className="underline font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 cursor-pointer"
                              >
                                Dedicated Secret Manager Studio
                              </button>{' '}
                              to rotate secrets and auto-disable old versions so you stay inside the Free Tier.
                            </div>
                            <div className="pt-1 border-t border-emerald-500/20 text-[10px] text-amber-800 dark:text-amber-300 font-mono">
                              <strong>Important — Does Delete/Destroy Revert Back to Plaintext? NO!</strong> Sealing a variable removes the plaintext from Cloud Run and replaces it with a <code className="font-bold">secretKeyRef</code> pointer. If you later <strong>Destroy</strong> a version or <strong>Delete</strong> the secret in Secret Manager, it <strong>disappears forever</strong> (it never reverts to plaintext). Use <strong>Disable ($0/mo)</strong> to pause a version safely without losing its value!
                            </div>
                          </div>

                          <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {sensitivePairs.length > 0 ? (
                              <>
                                Detected{' '}
                                <strong className="text-red-600 dark:text-red-400 font-mono">
                                  {sensitivePairs.map((p) => p.name).join(', ')}
                                </strong>{' '}
                                as plaintext environment variable(s). Click to
                                create encrypted Secret Manager secrets, grant{' '}
                                <code className="font-mono">
                                  roles/secretmanager.secretAccessor
                                </code>{' '}
                                to the runtime Service Account, and replace
                                plaintext values with{' '}
                                <code className="font-mono">
                                  valueSource.secretKeyRef
                                </code>
                                .
                              </>
                            ) : (
                              <>
                                All sensitive secrets are sealed via{' '}
                                <code className="font-mono">
                                  valueSource.secretKeyRef
                                </code>
                                . Click any plaintext variable pill below to
                                migrate it into Secret Manager individually.
                              </>
                            )}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {mountedRefs.map((ref) => (
                              <span
                                key={`mounted-${ref.name}`}
                                title={`Mounted from Secret Manager: ${ref.secret} (version: ${ref.version})`}
                                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                              >
                                <Lock className="w-2.5 h-2.5" />
                                <span>
                                  {ref.name} → secretKeyRef:{ref.secretName}:
                                  {ref.version}
                                </span>
                              </span>
                            ))}

                            {livePairs.map((p) => (
                              <button
                                key={`plain-${p.name}`}
                                type="button"
                                disabled={Boolean(busyState)}
                                onClick={() =>
                                  handleSealSecretsInSecretManager(srv, [
                                    p.name,
                                  ])
                                }
                                title={`Click to seal ${p.name} into Google Cloud Secret Manager (${srv.name}-${p.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-')})`}
                                className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                  p.isSensitive
                                    ? 'bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 border-red-500/40'
                                    : 'bg-white dark:bg-zinc-900 hover:border-emerald-500/50 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                                }`}
                              >
                                <KeyRound className="w-2.5 h-2.5" />
                                <span>
                                  {p.isSensitive ? '' : ''}
                                  {p.name} · Seal </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2026 Direct VPC Egress & Attached Storage Volumes inside Scale & Tune */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Direct VPC Egress */}
                      <div className="p-3 rounded-xl bg-blue-500/[0.05] border border-blue-500/30 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-blue-600 dark:text-blue-300 flex items-center gap-1.5 truncate">
                            <Network className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">2026 Direct VPC Egress (`template.vpcAccess`)</span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForms((prev) => ({
                                ...prev,
                                [srv.id]: {
                                  ...form,
                                  enableDirectVpc: !form.enableDirectVpc,
                                },
                              }))
                            }
                            className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer shrink-0 ${
                              form.enableDirectVpc
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 text-zinc-500'
                            }`}
                          >
                            {form.enableDirectVpc
                              ? '✓ Direct VPC ON'
                              : '+ Enable VPC'}
                          </button>
                        </div>

                        {form.enableDirectVpc && (
                          <div className="grid grid-cols-2 gap-2 pt-1 items-end">
                            <div className="min-w-0">
                              <label
                                title="VPC Network (--network)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                VPC Network
                              </label>
                              <select
                                value={form.vpcNetwork || 'default'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      vpcNetwork: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              >
                                {projectVpcs.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="min-w-0">
                              <label
                                title="Subnetwork (--subnet)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                Subnetwork
                              </label>
                              <input
                                type="text"
                                value={form.vpcSubnetwork ?? 'default'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      vpcSubnetwork: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div className="min-w-0">
                              <label
                                title="Egress Routing (--vpc-egress)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                Egress Routing
                              </label>
                              <select
                                value={form.vpcEgress || 'PRIVATE_RANGES_ONLY'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      vpcEgress: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              >
                                <option value="PRIVATE_RANGES_ONLY">
                                  private-ranges-only
                                </option>
                                <option value="ALL_TRAFFIC">
                                  all-traffic (Cloud NAT)
                                </option>
                              </select>
                            </div>

                            <div className="min-w-0">
                              <label
                                title="VPC Firewall Network Tags (--network-tags)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                Network Tags
                              </label>
                              <input
                                type="text"
                                value={form.vpcNetworkTags ?? ''}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      vpcNetworkTags: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="cloud-run-egress"
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2026 Storage Volume Mounts (Beta) */}
                      <div className="p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/30 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-amber-600 dark:text-amber-300 flex items-center gap-1.5 truncate">
                            <HardDrive className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              2026 Storage Volume Mounts (Beta · GCS / RAM / NFS)
                            </span>
                          </span>
                          <span className="text-[9.5px] font-mono text-zinc-500 shrink-0">
                            {form.storageVolumeType &&
                            form.storageVolumeType !== 'NONE'
                              ? form.storageMountPath
                              : 'Stateless'}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { id: 'NONE', label: 'No Vol' },
                            { id: 'GCS_BUCKET', label: 'GCS FUSE' },
                            { id: 'IN_MEMORY', label: 'RAM Disk' },
                            { id: 'NFS_FILESTORE', label: 'NFS' },
                          ].map((vOpt) => {
                            const active =
                              (form.storageVolumeType || 'NONE') === vOpt.id;
                            return (
                              <button
                                key={vOpt.id}
                                type="button"
                                onClick={() =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      storageVolumeType: vOpt.id,
                                      storageMountPath:
                                        vOpt.id === 'GCS_BUCKET'
                                          ? '/mnt/gcs'
                                          : vOpt.id === 'IN_MEMORY'
                                          ? '/mnt/ramdisk'
                                          : vOpt.id === 'NFS_FILESTORE'
                                          ? '/mnt/nfs'
                                          : form.storageMountPath,
                                      storageGcsBucket:
                                        form.storageGcsBucket ||
                                        projectBuckets[0] ||
                                        '',
                                      enableDirectVpc:
                                        vOpt.id === 'NFS_FILESTORE'
                                          ? true
                                          : form.enableDirectVpc,
                                    },
                                  }))
                                }
                                className={`p-1.5 rounded border text-[10px] font-mono font-bold cursor-pointer truncate ${
                                  active
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-600 dark:text-amber-300'
                                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                                }`}
                              >
                                {vOpt.label}
                              </button>
                            );
                          })}
                        </div>

                        {form.storageVolumeType === 'GCS_BUCKET' && (
                          <div className="grid grid-cols-3 gap-2 pt-1 items-end">
                            <div className="min-w-0">
                              <label
                                title="Cloud Storage Bucket (gcs.bucket)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                GCS Bucket
                              </label>
                              {projectBuckets.length > 0 ? (
                                <select
                                  value={form.storageGcsBucket || ''}
                                  onChange={(e) =>
                                    setEditForms((prev) => ({
                                      ...prev,
                                      [srv.id]: {
                                        ...form,
                                        storageGcsBucket: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                                >
                                  {projectBuckets.map((b) => (
                                    <option key={b} value={b}>
                                      gs://{b}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={form.storageGcsBucket || ''}
                                  onChange={(e) =>
                                    setEditForms((prev) => ({
                                      ...prev,
                                      [srv.id]: {
                                        ...form,
                                        storageGcsBucket: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder={`${projectId}-bucket`}
                                  className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <label
                                title="Container Mount Path (mountPath)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                Mount Path
                              </label>
                              <input
                                type="text"
                                value={form.storageMountPath || '/mnt/gcs'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      storageMountPath: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div className="min-w-0">
                              <label
                                title="Access Mode (readOnly)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                Access Mode
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      storageReadOnly: !form.storageReadOnly,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 cursor-pointer flex items-center justify-center truncate"
                              >
                                {form.storageReadOnly
                                  ? 'Read-Only'
                                  : 'Read-Write'}
                              </button>
                            </div>
                          </div>
                        )}

                        {form.storageVolumeType === 'IN_MEMORY' && (
                          <div className="grid grid-cols-2 gap-2 pt-1 items-end">
                            <div className="min-w-0">
                              <label
                                title="RAM Disk Size Limit (emptyDir.sizeLimit)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                RAM Size Limit
                              </label>
                              <select
                                value={form.storageMemorySizeLimit || '1Gi'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      storageMemorySizeLimit: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              >
                                <option value="256Mi">256Mi</option>
                                <option value="512Mi">512Mi</option>
                                <option value="1Gi">1Gi</option>
                                <option value="2Gi">2Gi</option>
                                <option value="4Gi">4Gi</option>
                                <option value="8Gi">8Gi</option>
                              </select>
                            </div>

                            <div className="min-w-0">
                              <label
                                title="Container Mount Path (mountPath)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                Mount Path
                              </label>
                              <input
                                type="text"
                                value={form.storageMountPath || '/mnt/ramdisk'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      storageMountPath: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>
                          </div>
                        )}

                        {form.storageVolumeType === 'NFS_FILESTORE' && (
                          <div className="grid grid-cols-3 gap-2 pt-1 items-end">
                            <div className="min-w-0">
                              <label
                                title="Filestore / NFS Server IP (nfs.server)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                NFS Server IP
                              </label>
                              <input
                                type="text"
                                value={form.storageNfsServer || '10.0.0.2'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      storageNfsServer: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div className="min-w-0">
                              <label
                                title="NFS Export Share Path (nfs.path)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                Export Path
                              </label>
                              <input
                                type="text"
                                value={form.storageNfsPath || '/vol1'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      storageNfsPath: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>

                            <div className="min-w-0">
                              <label
                                title="Container Mount Path (mountPath)"
                                className="block text-[10px] font-mono text-zinc-500 mb-0.5 truncate whitespace-nowrap"
                              >
                                Mount Path
                              </label>
                              <input
                                type="text"
                                value={form.storageMountPath || '/mnt/nfs'}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...form,
                                      storageMountPath: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full h-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSaveTuneConfig(srv)}
                        disabled={Boolean(busyState)}
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Deploy Updated Revision</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* DRAWER 2: CLOUD RUN REVISION TIME-MACHINE, CRASH-LOOP AUTOPSY & 1-CLICK INSTANT ROLLBACK */}
                {activeDrawer === 'TRAFFIC' && (() => {
                  const autopsyState = revisionAutopsyMap[srv.id] || {};
                  const report = autopsyState.report || null;
                  const diagnosis = report?.diagnosis || null;
                  const diff = report?.diffFromBaseline || null;
                  const revLogs = report?.logs || [];
                  const isTimeMachineBusy =
                    busyState === 'TIME_MACHINE' || busyState === 'TRAFFIC';

                  return (
                    <div className="mt-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4 bg-white dark:bg-zinc-950 p-4 rounded-xl">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-300 text-[10px] font-mono font-bold mb-1">
                            <span>
                               CLOUD RUN REVISION TIME-MACHINE · CRASH-LOOP AUTOPSY · CONFIG & SECRET DIFF
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5 text-blue-500" />
                            <span>
                              Revision Time-Machine, Crash-Loop Autopsy & Canary Splitter — {srv.name} ({srv.region})
                            </span>
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          {srv.lastHealthyRevision && (
                            <button
                              type="button"
                              disabled={isTimeMachineBusy}
                              onClick={() =>
                                handleTimeMachineRestore(srv, {
                                  targetRevision: srv.lastHealthyRevision,
                                  mode: 'INSTANT_TRAFFIC_PIN',
                                })
                              }
                              title={`Shift 100% of live traffic on ${srv.name} to known-healthy revision ${srv.lastHealthyRevision} in <2 seconds`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm cursor-pointer"
                            >
                              <Zap className="w-3 h-3" />
                              <span>
                                 1-Click Rollback 100% Traffic → {srv.lastHealthyRevision} (&lt;2s)
                              </span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setOpenDrawer((prev) => ({
                                ...prev,
                                [srv.id]: null,
                              }))
                            }
                            className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 px-2 py-1"
                          >
                            Close
                          </button>
                        </div>
                      </div>

                      {/* Current Traffic Allocation Bar */}
                      <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase">
                            Active HTTPS Traffic Routing:
                          </span>
                          {(srv.traffic || []).map((t, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-mono bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-full font-bold"
                            >
                              <strong>{t.percent}%</strong> →{' '}
                              {t.revision === 'LATEST'
                                ? `LATEST (${srv.latestReadyRevision})`
                                : t.revision}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          disabled={isTimeMachineBusy}
                          onClick={() => handleApplyTraffic(srv, 'LATEST')}
                          className="text-[10.5px] font-mono font-semibold px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                        >
                          Route 100% to Latest Ready ({srv.latestReadyRevision})
                        </button>
                      </div>

                      {/* Deployed Revisions Timeline with Health Badges, 1-Click Autopsy, Instant Traffic Pin & Spec Clone */}
                      {srv.revisions && srv.revisions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold uppercase text-zinc-500">
                              Revision Timeline ({srv.revisions.length} Revisions) — Click Any Revision to Inspect Diff & Container Logs:
                            </span>
                          </div>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                            {srv.revisions.map((rev) => {
                              const isLatestReady =
                                rev.shortName === srv.latestReadyRevision;
                              const isCrashed = rev.healthStatus === 'CRASHED';
                              const isReconciling =
                                rev.healthStatus === 'RECONCILING';
                              const isSelectedForAutopsy =
                                autopsyState.selectedRevision === rev.shortName;
                              const trafficPct = Number(rev.trafficPercent || 0);

                              return (
                                <div
                                  key={rev.shortName}
                                  className={`p-3 rounded-xl border transition-all space-y-2 ${
                                    isSelectedForAutopsy
                                      ? isCrashed
                                        ? 'border-red-500 bg-red-500/[0.07] shadow-sm'
                                        : 'border-blue-500 bg-blue-500/[0.06] shadow-sm'
                                      : isCrashed
                                      ? 'border-red-500/40 bg-red-500/[0.03]'
                                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70'
                                  }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                      <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                                        {rev.shortName}
                                      </span>
                                      {isCrashed ? (
                                        <span className="text-[9.5px] font-mono font-extrabold bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded-full">
                                          CRASHED ({rev.failureReason || 'FAILED'})
                                        </span>
                                      ) : isReconciling ? (
                                        <span className="text-[9.5px] font-mono font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full">
                                          DEPLOYING
                                        </span>
                                      ) : (
                                        <span className="text-[9.5px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                                          ✓ HEALTHY
                                        </span>
                                      )}
                                      {isLatestReady && (
                                        <span className="text-[9.5px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                                          LATEST READY
                                        </span>
                                      )}
                                      {trafficPct > 0 && (
                                        <span className="text-[9.5px] font-mono font-extrabold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
                                          {trafficPct}% LIVE TRAFFIC
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-400">
                                      {rev.createTime
                                        ? new Date(rev.createTime).toLocaleString()
                                        : ''}
                                    </span>
                                  </div>

                                  <div className="text-[10.5px] font-mono text-zinc-600 dark:text-zinc-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                    <span>
                                      {rev.cpu} vCPU · {rev.memory}
                                    </span>
                                    <span>· Port :{rev.containerPort || 8080}</span>
                                    <span>
                                      · Scale {rev.minInstances}→{rev.maxInstances}
                                    </span>
                                    {(rev.secretRefs || []).length > 0 && (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        · {rev.secretRefs.length} Secret Ref(s)
                                      </span>
                                    )}
                                  </div>

                                  {rev.failureMessage && (
                                    <div className="p-2 rounded bg-red-500/10 border border-red-500/25 text-[10px] font-mono text-red-700 dark:text-red-300 leading-relaxed">
                                      {rev.failureMessage}
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleFetchRevisionAutopsy(
                                          srv,
                                          rev.shortName
                                        )
                                      }
                                      className={`text-[10.5px] font-mono font-bold px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                                        isSelectedForAutopsy
                                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                                          : 'bg-white dark:bg-zinc-950 hover:border-blue-500/50 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                                      }`}
                                    >
                                      {isSelectedForAutopsy ? 'Inspecting Autopsy & Diff' : 'Run Autopsy & Diff'}
                                    </button>

                                    {!isCrashed && (
                                      <button
                                        type="button"
                                        disabled={isTimeMachineBusy}
                                        onClick={() =>
                                          handleTimeMachineRestore(srv, {
                                            targetRevision: rev.shortName,
                                            mode: 'INSTANT_TRAFFIC_PIN',
                                          })
                                        }
                                        title="Route 100% of live HTTPS traffic to this revision immediately (<2s) without rebuilding"
                                        className="text-[10.5px] font-mono font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-2.5 py-1 rounded cursor-pointer"
                                      >
                                         Route 100% Here (&lt;2s)
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      disabled={isTimeMachineBusy}
                                      onClick={() =>
                                        handleTimeMachineRestore(srv, {
                                          targetRevision: rev.shortName,
                                          mode: 'CLONE_REVISION_SPEC',
                                        })
                                      }
                                      title="Clone this revision's exact Container Image, CPU/RAM, Port, SA, and Secret Refs into a brand-new LATEST revision"
                                      className="text-[10.5px] font-mono font-bold bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded cursor-pointer"
                                    >
                                      Clone Spec → New LATEST
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* LIVE CRASH-LOOP AUTOPSY, ROOT-CAUSE CLASSIFIER, CONFIG DIFF & CONTAINER LOG STREAM */}
                      <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/90 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                              Revision Autopsy & Config Diff Inspector
                              {autopsyState.selectedRevision
                                ? ` — ${autopsyState.selectedRevision}`
                                : ''}
                            </span>
                            {autopsyState.loading && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-500">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Scanning Cloud Logging & Revision Spec...</span>
                              </span>
                            )}
                          </div>
                          {autopsyState.selectedRevision && (
                            <button
                              type="button"
                              onClick={() =>
                                handleFetchRevisionAutopsy(
                                  srv,
                                  autopsyState.selectedRevision
                                )
                              }
                              className="text-[10px] font-mono text-blue-500 hover:underline cursor-pointer"
                            >
                              ↻ Refresh Autopsy & Logs
                            </button>
                          )}
                        </div>

                        {autopsyState.error && (
                          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-600 dark:text-red-300">
                            {autopsyState.error}
                          </div>
                        )}

                        {diagnosis && (
                          <div
                            className={`p-3 rounded-xl border space-y-2 ${
                              diagnosis.severity === 'CRITICAL'
                                ? 'bg-red-500/[0.08] border-red-500/40'
                                : 'bg-emerald-500/[0.06] border-emerald-500/30'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                                  Automated Root-Cause Classification: {diagnosis.category}
                                </div>
                                <div
                                  className={`text-xs sm:text-sm font-mono font-extrabold mt-0.5 ${
                                    diagnosis.severity === 'CRITICAL'
                                      ? 'text-red-600 dark:text-red-300'
                                      : 'text-emerald-700 dark:text-emerald-300'
                                  }`}
                                >
                                  {diagnosis.headline}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                {diagnosis.recommendedActionType ===
                                  'AUTO_FIX_CRASH' && (
                                  <button
                                    type="button"
                                    disabled={isTimeMachineBusy}
                                    onClick={() =>
                                      handleTimeMachineRestore(srv, {
                                        targetRevision:
                                          autopsyState.selectedRevision,
                                        mode: 'AUTO_FIX_CRASH',
                                        fixPayload: diagnosis.fixPayload || {},
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-md text-[11px] font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                                  >
                                    {diagnosis.recommendedActionLabel}
                                  </button>
                                )}

                                {diagnosis.recommendedActionType ===
                                  'OPEN_SECRET_STUDIO' &&
                                  onOpenSecretManagerStudio && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenSecretManagerStudio()}
                                      className="px-3 py-1.5 rounded-md text-[11px] font-mono font-extrabold bg-amber-600 hover:bg-amber-500 text-white shadow-sm cursor-pointer"
                                    >
                                      {diagnosis.recommendedActionLabel}
                                    </button>
                                  )}

                                {report?.baselineRevision?.shortName && (
                                  <button
                                    type="button"
                                    disabled={isTimeMachineBusy}
                                    onClick={() =>
                                      handleTimeMachineRestore(srv, {
                                        targetRevision:
                                          report.baselineRevision.shortName,
                                        mode: 'INSTANT_TRAFFIC_PIN',
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-md text-[11px] font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer disabled:opacity-50"
                                  >
                                     Rollback 100% Traffic to {report.baselineRevision.shortName}
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed">
                              {diagnosis.explanation}
                            </p>
                          </div>
                        )}

                        {/* Side-by-Side Revision-to-Revision Config & Secret Diff */}
                        {diff && (
                          <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="text-[10.5px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">
                                Revision Config & Secret Diff: {diff.baselineRevision} (Previous) → {report?.revisionName} (Selected)
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/25 font-bold">
                                {diff.totalChangesCount} Spec Change(s) Detected
                              </span>
                            </div>

                            {diff.totalChangesCount === 0 ? (
                              <div className="text-[11px] font-mono text-zinc-500">
                                No container image, CPU/memory, port, Service Account, or environment/secret key changes between {diff.baselineRevision} and {report?.revisionName}.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px] font-mono">
                                {diff.imageChanged?.changed && (
                                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/25">
                                    <div className="font-bold text-amber-600 dark:text-amber-300">
                                      Container Image Changed:
                                    </div>
                                    <div className="text-zinc-500 truncate">
                                      - {diff.imageChanged.from}
                                    </div>
                                    <div className="text-emerald-600 dark:text-emerald-400 truncate font-bold">
                                      + {diff.imageChanged.to}
                                    </div>
                                  </div>
                                )}

                                {diff.resourcesChanged?.changed && (
                                  <div className="p-2 rounded bg-blue-500/10 border border-blue-500/25">
                                    <div className="font-bold text-blue-600 dark:text-blue-300">
                                      CPU / Memory Changed:
                                    </div>
                                    <div className="text-zinc-500">
                                      {diff.resourcesChanged.from} →{' '}
                                      <strong className="text-zinc-900 dark:text-zinc-100">
                                        {diff.resourcesChanged.to}
                                      </strong>
                                    </div>
                                  </div>
                                )}

                                {diff.portChanged?.changed && (
                                  <div className="p-2 rounded bg-red-500/10 border border-red-500/25">
                                    <div className="font-bold text-red-600 dark:text-red-300">
                                      Container Port Changed:
                                    </div>
                                    <div>
                                      TCP :{diff.portChanged.from} →{' '}
                                      <strong>TCP :{diff.portChanged.to}</strong>
                                    </div>
                                  </div>
                                )}

                                {diff.serviceAccountChanged?.changed && (
                                  <div className="p-2 rounded bg-blue-500/10 border border-blue-500/25">
                                    <div className="font-bold text-blue-600 dark:text-blue-300">
                                      Runtime Service Account Changed:
                                    </div>
                                    <div className="truncate">
                                      {diff.serviceAccountChanged.from} →{' '}
                                      <strong>{diff.serviceAccountChanged.to}</strong>
                                    </div>
                                  </div>
                                )}

                                {(diff.addedEnvKeys?.length > 0 ||
                                  diff.removedEnvKeys?.length > 0 ||
                                  diff.modifiedEnvKeys?.length > 0) && (
                                  <div className="p-2 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                    <div className="font-bold text-zinc-700 dark:text-zinc-200">
                                      Environment Variables Diff:
                                    </div>
                                    {diff.addedEnvKeys?.length > 0 && (
                                      <div className="text-emerald-600 dark:text-emerald-400">
                                        + Added: {diff.addedEnvKeys.join(', ')}
                                      </div>
                                    )}
                                    {diff.modifiedEnvKeys?.length > 0 && (
                                      <div className="text-amber-600 dark:text-amber-400">
                                        ~ Modified: {diff.modifiedEnvKeys.join(', ')}
                                      </div>
                                    )}
                                    {diff.removedEnvKeys?.length > 0 && (
                                      <div className="text-red-600 dark:text-red-400">
                                        - Removed: {diff.removedEnvKeys.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {(diff.secretRefDiffs || []).length > 0 && (
                                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/25">
                                    <div className="font-bold text-emerald-700 dark:text-emerald-300">
                                      Secret Manager `secretKeyRef` Diff:
                                    </div>
                                    {diff.secretRefDiffs.map((sd) => (
                                      <div key={sd.envKey} className="truncate">
                                        {sd.envKey}: {sd.from} →{' '}
                                        <strong>{sd.to}</strong>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Live Cloud Logging Container Stderr/Stdout Stream for Selected Revision */}
                        <div className="space-y-1.5">
                          <div className="text-[10.5px] font-mono font-bold uppercase text-zinc-500">
                            Live Cloud Logging Stream (`logging.googleapis.com/v2` · {revLogs.length} Recent Entries for {autopsyState.selectedRevision || srv.latestReadyRevision}):
                          </div>
                          {revLogs.length === 0 && !autopsyState.loading ? (
                            <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 text-zinc-400 font-mono text-[10.5px]">
                              No recent container stderr/stdout or startup error logs recorded for this revision.
                            </div>
                          ) : (
                            <div className="max-h-48 overflow-y-auto rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-2.5 space-y-1 font-mono text-[10.5px]">
                              {revLogs.map((l) => {
                                const isErr =
                                  l.severity === 'ERROR' ||
                                  l.severity === 'CRITICAL' ||
                                  l.stream === 'stderr';
                                const isWarn = l.severity === 'WARNING';
                                return (
                                  <div
                                    key={l.id}
                                    className={`flex items-start gap-2 leading-relaxed ${
                                      isErr
                                        ? 'text-red-400'
                                        : isWarn
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-zinc-700 dark:text-zinc-300'
                                    }`}
                                  >
                                    <span className="text-zinc-500 shrink-0">
                                      {l.timestamp
                                        ? new Date(l.timestamp).toLocaleTimeString()
                                        : ''}
                                    </span>
                                    <span
                                      className={`px-1 rounded-full text-[9px] uppercase font-bold shrink-0 ${
                                        isErr
                                          ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                                          : isWarn
                                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                      }`}
                                    >
                                      {l.stream}:{l.severity}
                                    </span>
                                    <span className="break-all">{l.message}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Canary Traffic Splitter */}
                      {srv.revisions && srv.revisions.length > 1 && (
                        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                              Canary Revision
                            </label>
                            <select
                              value={tf.canaryRevision || ''}
                              onChange={(e) =>
                                setTrafficForms((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    ...tf,
                                    canaryRevision: e.target.value,
                                  },
                                }))
                              }
                              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            >
                              {srv.revisions.map((r) => (
                                <option key={r.shortName} value={r.shortName}>
                                  {r.shortName} ({r.healthStatus || 'HEALTHY'})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                              Canary Traffic % (0–90%)
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={90}
                              step={5}
                              value={tf.canaryPercent ?? 0}
                              onChange={(e) =>
                                setTrafficForms((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    ...tf,
                                    canaryPercent: Number(e.target.value),
                                  },
                                }))
                              }
                              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                            />
                          </div>

                          <button
                            type="button"
                            disabled={isTimeMachineBusy}
                            onClick={() => handleApplyTraffic(srv)}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-md transition-colors cursor-pointer"
                          >
                            Apply Canary Split
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* DRAWER 3: GRADUATE CLOUD RUN SERVICE TO GKE KUBERNETES */}
                {activeDrawer === 'CONVERT_GKE' && (() => {
                  const cfg = gkeConvertForms[srv.id] || {
                    namespace: 'production',
                    targetCluster: gkeClusters[0]?.name || '',
                    targetLocation:
                      gkeClusters[0]?.location || srv.region || 'us-central1',
                    createAutopilotCluster: gkeClusters.length === 0,
                    newClusterName: `${srv.name}-gke-autopilot`,
                    enableSpot: true,
                    enableZeroTrustNetPol: true,
                    enableShmRamDisk: true,
                    enableHpaPdb: true,
                    enableWorkloadIdentity: true,
                    manifestViewMode: 'K8S_BUNDLE',
                  };
                  const bundle = buildGkeGraduationBundle(srv, cfg);
                  const isGraduating = busyState === 'GRADUATING_GKE';

                  return (
                    <div className="mt-3 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-4 bg-zinc-50 dark:bg-zinc-900/90 p-4 rounded-xl text-zinc-900 dark:text-zinc-100">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider font-mono text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                            <span>
                              Graduate `{srv.name}` ({srv.region}) → Production GKE Kubernetes Cluster
                            </span>
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            Transpiles this Cloud Run service into a <strong>6-Resource Native Kubernetes Bundle</strong> (`Deployment` + `HPA v2` + `PDB` + `Service` + `NetworkPolicy` + `Workload Identity SA`) and deploys it directly to GKE.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }))
                          }
                          className="text-xs font-mono text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          Close
                        </button>
                      </div>

                      {/* FinOps & Architecture Advantage Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                          <div className="text-[10px] font-mono text-zinc-400">
                            Cloud Run Warm Burn ({bundle.minReplicas}x {srv.cpu}vCPU/{srv.memory})
                          </div>
                          <div className="text-sm font-extrabold text-red-400 mt-0.5 font-mono">
                            ${bundle.cloudRunMonthly}/mo
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                          <div className="text-[10px] font-mono text-zinc-400">
                            GKE Autopilot Pod Billing (-42%)
                          </div>
                          <div className="text-sm font-extrabold text-blue-400 mt-0.5 font-mono">
                            ${bundle.gkeAutopilotMonthly}/mo
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-emerald-500/30">
                          <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                            GKE Spot VM / Spot GPU Pool (-68%)
                          </div>
                          <div className="text-sm font-extrabold text-emerald-400 mt-0.5 font-mono">
                            ${bundle.gkeSpotMonthly}/mo (Save ${bundle.monthlySavingsSpot}/mo)
                          </div>
                        </div>
                      </div>

                      {/* 5 Interactive GKE Superpower Toggles */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {[
                          {
                            key: 'enableSpot',
                            label: 'Spot VM/GPU (-68%)',
                            sub: 'gke-spot toleration',
                          },
                          {
                            key: 'enableHpaPdb',
                            label: 'HPA v2 + PDB HA',
                            sub: `Scale ${bundle.minReplicas}→${bundle.maxReplicas}`,
                          },
                          {
                            key: 'enableZeroTrustNetPol',
                            label: 'L3/L4 NetworkPolicy',
                            sub: `Strict port :${srv.containerPort}`,
                          },
                          {
                            key: 'enableShmRamDisk',
                            label: '8Gi /dev/shm RAM',
                            sub: 'PyTorch / vLLM / Chrome',
                          },
                          {
                            key: 'enableWorkloadIdentity',
                            label: 'Workload Identity',
                            sub: `${projectId}.svc.id.goog`,
                          },
                        ].map((tog) => {
                          const active = cfg[tog.key] !== false;
                          return (
                            <button
                              key={tog.key}
                              type="button"
                              onClick={() =>
                                setGkeConvertForms((prev) => ({
                                  ...prev,
                                  [srv.id]: { ...cfg, [tog.key]: !active },
                                }))
                              }
                              className={`p-2 rounded-md border text-left transition-all cursor-pointer ${
                                active
                                  ? 'bg-blue-600/30 border-blue-400 text-white'
                                  : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                              }`}
                            >
                              <div className="text-[10.5px] font-bold font-mono">
                                {active ? '✓ ' : '○ '}
                                {tog.label}
                              </div>
                              <div className="text-[9.5px] text-zinc-400 mt-0.5">
                                {tog.sub}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Target GKE Cluster + Side-by-Side YAML Preview */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                                Target Kubernetes Namespace
                              </label>
                              <input
                                type="text"
                                value={cfg.namespace || 'production'}
                                onChange={(e) =>
                                  setGkeConvertForms((prev) => ({
                                    ...prev,
                                    [srv.id]: {
                                      ...cfg,
                                      namespace: e.target.value,
                                    },
                                  }))
                                }
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-mono text-zinc-400 mb-1">
                                Target GKE Cluster ({gkeClusters.length} Active)
                              </label>
                              {gkeClusters.length > 0 &&
                              !cfg.createAutopilotCluster ? (
                                <select
                                  value={
                                    cfg.targetCluster ||
                                    gkeClusters[0]?.name ||
                                    ''
                                  }
                                  onChange={(e) =>
                                    setGkeConvertForms((prev) => ({
                                      ...prev,
                                      [srv.id]: {
                                        ...cfg,
                                        targetCluster: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
                                >
                                  {gkeClusters.map((c) => (
                                    <option key={c.name} value={c.name}>
                                      {c.name} ({c.location})
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={
                                    cfg.newClusterName ||
                                    `${srv.name}-gke-autopilot`
                                  }
                                  onChange={(e) =>
                                    setGkeConvertForms((prev) => ({
                                      ...prev,
                                      [srv.id]: {
                                        ...cfg,
                                        createAutopilotCluster: true,
                                        newClusterName: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-white"
                                />
                              )}
                            </div>
                          </div>

                          <label className="flex items-center gap-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(cfg.createAutopilotCluster)}
                              onChange={(e) =>
                                setGkeConvertForms((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    ...cfg,
                                    createAutopilotCluster: e.target.checked,
                                  },
                                }))
                              }
                            />
                            <span>
                              Auto-Create New GKE Autopilot Cluster ($0.00/hr management fee covered by GKE Free Tier)
                            </span>
                          </label>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={isGraduating}
                              onClick={() => handleGraduateServiceToGke(srv)}
                              className="flex-1 py-2 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
                            >
                              {isGraduating
                                ? 'Graduating to GKE...'
                                : cfg.createAutopilotCluster
                                ? `1-Click Create GKE Autopilot Cluster & Graduate ${srv.name}`
                                : `1-Click Apply to Live GKE (${
                                    cfg.targetCluster || gkeClusters[0]?.name
                                  })`}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  bundle.k8sBundleYaml,
                                  `gke-yaml-${srv.id}`
                                )
                              }
                              className="py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
                            >
                              {copiedId === `gke-yaml-${srv.id}`
                                ? '✓ Copied YAML'
                                : 'Copy K8s YAML'}
                            </button>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setGkeConvertForms((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    ...cfg,
                                    manifestViewMode: 'K8S_BUNDLE',
                                  },
                                }))
                              }
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                cfg.manifestViewMode !== 'KNATIVE_CONSOLE'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              CloudPulse 6-Resource GKE Bundle
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setGkeConvertForms((prev) => ({
                                  ...prev,
                                  [srv.id]: {
                                    ...cfg,
                                    manifestViewMode: 'KNATIVE_CONSOLE',
                                  },
                                }))
                              }
                              className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                                cfg.manifestViewMode === 'KNATIVE_CONSOLE'
                                  ? 'bg-red-600 text-white'
                                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              Raw GCP Console Knative YAML
                            </button>
                          </div>
                          <pre className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-48">
                            {cfg.manifestViewMode === 'KNATIVE_CONSOLE'
                              ? bundle.rawKnativeYaml
                              : bundle.k8sBundleYaml}
                          </pre>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Live Interactive Cloud Run Container SSH Drawer (Off by Default; Toggled by SSH / Container Shell button) */}
                {activeDrawer === 'SSH_TERMINAL' && (
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <XtermWebSshTerminal
                      projectId={projectId}
                      targetType="CLOUD_RUN"
                      cloudRunService={srv}
                      onDisconnect={() => toggleServiceDrawer(srv, 'SSH_TERMINAL')}
                    />
                  </div>
                )}

                {/* DRAWER 5: 127.0.0.1 ZERO-PUBLIC-IP DEVELOPER PORT-FORWARD TUNNEL */}
                {activeDrawer === 'LOCAL_TUNNEL' && (
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <LocalDevTunnelBar
                      projectId={projectId}
                      defaultTargetType="CLOUD_RUN_PROXY"
                      defaultResourceName={srv.name}
                      defaultRegion={srv.region}
                      defaultRemotePort={srv.containerPort || 8080}
                      defaultLocalPort={8085}
                      availableResources={services.map((s) => ({
                        name: s.name,
                        region: s.region,
                        port: s.containerPort || 8080,
                        isPublic: s.isPublic,
                      }))}
                      onShowToast={onShowToast}
                      onClose={() =>
                        setOpenDrawer((prev) => ({ ...prev, [srv.id]: null }))
                      }
                    />
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
