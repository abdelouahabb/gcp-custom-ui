import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Cloud,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Check,
  CheckCircle2,
  Terminal,
  BarChart3,
  Layers,
  LayoutDashboard,
  Smartphone,
  Monitor,
  ShieldCheck,
  Wifi,
  BatteryCharging,
  PlusCircle,
  Server,
  LogOut,
  Rocket,
  Network,
  Command,
  DollarSign,
  BookOpen,
  Globe,
  HardDrive,
  Database,
  Flame,
  PackageCheck,
  Cpu,
  Zap,
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import SortableKpiRow from './components/SortableKpiRow';
import TelemetryCharts from './components/TelemetryCharts';
import ResourceControlCenter from './components/ResourceControlCenter';
import LogStreamerAndShell from './components/LogStreamerAndShell';
import GeminiCopilotModal from './components/GeminiCopilotModal';
import ResourceProvisionModal from './components/ResourceProvisionModal';
import VmFleetAndSsh from './components/VmFleetAndSsh';
import VpcNetworksAndFirewalls from './components/VpcNetworksAndFirewalls';
import EmergencyApiKillSwitch from './components/EmergencyApiKillSwitch';
import CloudRunFleetManager from './components/CloudRunFleetManager';
import CloudFunctionsEventarcStudio from './components/CloudFunctionsEventarcStudio';
import GkeFleetStudio from './components/GkeFleetStudio';
import CloudStorageStudio from './components/CloudStorageStudio';
import BigQueryStudio from './components/BigQueryStudio';
import CloudSqlAndAlloyDbStudio from './components/CloudSqlAndAlloyDbStudio';
import SovereignTimeMachineIamStudio from './components/SovereignTimeMachineIamStudio';
import SreWarRoomPerimeterStudio from './components/SreWarRoomPerimeterStudio';
import Wave9AiGkeSqlSupplyChainStudio from './components/Wave9AiGkeSqlSupplyChainStudio';
import Wave10Frontier2026Studio from './components/Wave10Frontier2026Studio';
import AuthOnboardingGate from './components/AuthOnboardingGate';
import CloudRunDeployModal from './components/CloudRunDeployModal';
import Revolutionary2026Suite, {
  calculateLiveBurnRate,
} from './components/Revolutionary2026Suite';
import CommandPaletteModal from './components/CommandPaletteModal';
import FuturisticOrbitalHud from './components/FuturisticOrbitalHud';
import InteractiveDocsGuide from './components/InteractiveDocsGuide';
import GlobalNetworkWorldMap from './components/GlobalNetworkWorldMap';
import DataEngineeringStudio from './components/DataEngineeringStudio';

/**
 * Classifies any outgoing Axios request to determine if it performs a permanent
 * deletion or destructive resource teardown on Google Cloud.
 * Every matching request is paused until the engineer explicitly confirms it in
 * the Mandatory Delete & Destructive Action Confirmation Modal.
 */
function classifyDestructiveAxiosConfig(config) {
  if (!config || !config.url) return null;
  if (config.headers && config.headers['x-confirmed-delete'] === 'true') {
    return null;
  }

  const method = String(config.method || 'get').toLowerCase();
  const rawUrl = String(config.url || '');
  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};
  const params = config.params || {};

  // Decode project from URL if present
  const projMatch = rawUrl.match(/\/api\/project\/([^/]+)/);
  const projectId = projMatch ? decodeURIComponent(projMatch[1]) : 'Active GCP Project';

  // 1. All HTTP DELETE requests
  if (method === 'delete') {
    // Generic resource delete (/api/project/:id/resource)
    if (rawUrl.endsWith('/resource')) {
      const rType = body.resourceType || 'Google Cloud Resource';
      const rName = body.name || 'selected-resource';
      const rRegion = body.region || 'global';
      return {
        title: `Permanently Delete ${rType}`,
        resourceKind: rType,
        targetName: rName,
        location: rRegion,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This action will permanently delete the ${rType} "${rName}" (${rRegion}) from Google Cloud project "${projectId}". Associated data, endpoints, or network bindings cannot be recovered once destroyed.`,
      };
    }

    // Cloud Storage object delete (/storage/buckets/:bucket/objects)
    const gcsObjMatch = rawUrl.match(/\/storage\/buckets\/([^/]+)\/objects/);
    if (gcsObjMatch) {
      const bucket = decodeURIComponent(gcsObjMatch[1]);
      const objName =
        params.objectName ||
        body.objectName ||
        new URLSearchParams(rawUrl.split('?')[1] || '').get('objectName') ||
        'selected-object';
      return {
        title: 'Permanently Delete Cloud Storage Object',
        resourceKind: 'GCS Object',
        targetName: `gs://${bucket}/${objName}`,
        location: bucket,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete object "${objName}" from bucket "gs://${bucket}". Unless Object Versioning or a WORM Retention Lock is active on this bucket, this file cannot be recovered.`,
      };
    }

    // BigQuery dataset delete (/bigquery/datasets/:datasetId)
    const bqMatch = rawUrl.match(/\/bigquery\/datasets\/([^/?]+)/);
    if (bqMatch) {
      const datasetId = decodeURIComponent(bqMatch[1]);
      return {
        title: 'Permanently Delete BigQuery Dataset & All Tables',
        resourceKind: 'BigQuery Dataset',
        targetName: `${projectId}:${datasetId}`,
        location: 'Multi-Region / Regional',
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This executes a forced recursive deletion (deleteContents=true) on BigQuery dataset "${datasetId}", permanently destroying all tables, views, routines, and stored analytical data inside it.`,
      };
    }

    // BigLake Metastore catalog delete (/biglake/metastore/catalogs/:loc/:catalogId)
    const blMatch = rawUrl.match(/\/biglake\/metastore\/catalogs\/([^/]+)\/([^/?]+)/);
    if (blMatch) {
      const loc = decodeURIComponent(blMatch[1]);
      const catalogId = decodeURIComponent(blMatch[2]);
      return {
        title: 'Permanently Delete BigLake Metastore Catalog',
        resourceKind: 'BigLake Catalog',
        targetName: catalogId,
        location: loc,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete BigLake Metastore Catalog "${catalogId}" in ${loc} (${projectId}). Iceberg table metadata registrations inside this catalog will be removed.`,
      };
    }

    // Cloud SQL instance delete (/cloudsql/instances/:name)
    const sqlMatch = rawUrl.match(/\/cloudsql\/instances\/([^/?]+)/);
    if (sqlMatch) {
      const instanceName = decodeURIComponent(sqlMatch[1]);
      return {
        title: 'Permanently Delete Cloud SQL Database Instance',
        resourceKind: 'Cloud SQL Instance',
        targetName: instanceName,
        location: 'Regional Relational DB',
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently destroy Cloud SQL instance "${instanceName}", including all relational databases, users, and automatic backups associated with the instance.`,
      };
    }

    // AlloyDB cluster delete (/alloydb/clusters/:region/:clusterId)
    const alloyMatch = rawUrl.match(/\/alloydb\/clusters\/([^/]+)\/([^/?]+)/);
    if (alloyMatch) {
      const region = decodeURIComponent(alloyMatch[1]);
      const clusterId = decodeURIComponent(alloyMatch[2]);
      return {
        title: 'Permanently Delete AlloyDB PostgreSQL Cluster',
        resourceKind: 'AlloyDB Cluster',
        targetName: clusterId,
        location: region,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will force-delete AlloyDB cluster "${clusterId}" in ${region}, tearing down its primary instance, read pool nodes, and cluster storage volume.`,
      };
    }

    // GKE cluster delete (/gke/clusters/:location/:name or /wave9/gke/cluster)
    const gkeMatch = rawUrl.match(/\/gke\/clusters\/([^/]+)\/([^/?]+)/);
    if (gkeMatch) {
      const location = decodeURIComponent(gkeMatch[1]);
      const clusterName = decodeURIComponent(gkeMatch[2]);
      return {
        title: 'Permanently Delete GKE Kubernetes Cluster',
        resourceKind: 'GKE Cluster',
        targetName: clusterName,
        location,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete GKE cluster "${clusterName}" (${location}), terminating all running Kubernetes deployments, pods, services, and node pools.`,
      };
    }

    if (rawUrl.includes('/wave9/gke/cluster')) {
      const clusterName = body.clusterName || params.clusterName || 'gke-cluster';
      const location = body.location || params.location || 'us-central1';
      return {
        title: 'Permanently Delete GKE Kubernetes Cluster',
        resourceKind: 'GKE Cluster',
        targetName: clusterName,
        location,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete GKE cluster "${clusterName}" (${location}), terminating all running Kubernetes workloads and control plane endpoints.`,
      };
    }

    // Cloud Functions delete (/functions/:region/:name)
    const fnMatch = rawUrl.match(/\/functions\/([^/]+)\/([^/?]+)/);
    if (fnMatch) {
      const region = decodeURIComponent(fnMatch[1]);
      const fnName = decodeURIComponent(fnMatch[2]);
      return {
        title: 'Permanently Delete Cloud Function',
        resourceKind: 'Cloud Function (Gen2 / Gen1)',
        targetName: fnName,
        location: region,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete Cloud Function "${fnName}" in ${region} and disconnect its HTTP trigger or Eventarc event subscription.`,
      };
    }

    // Data Engineering Studio resource delete (/data-engineer/resource)
    if (rawUrl.includes('/data-engineer/resource')) {
      const kind = body.resourceKind || 'Data Engineering Resource';
      const target = body.id || 'selected-pipeline';
      const region = body.region || 'us-central1';
      return {
        title: `Permanently Delete ${kind}`,
        resourceKind: kind,
        targetName: target,
        location: region,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete the ${kind} "${target}" (${region}) from project "${projectId}".`,
      };
    }

    // Fallback for any other HTTP DELETE endpoint
    return {
      title: 'Confirm Permanent Resource Deletion',
      resourceKind: body.resourceType || 'Cloud Resource',
      targetName: body.name || body.id || rawUrl.split('/').pop() || rawUrl,
      location: body.region || body.zone || body.location || 'GCP',
      projectId,
      method: 'DELETE',
      endpoint: rawUrl,
      impactWarning: `You are about to execute a permanent HTTP DELETE operation on Google Cloud project "${projectId}". Please confirm you want to proceed.`,
    };
  }

  // 2. Destructive HTTP POST endpoints
  if (method === 'post') {
    // Cloud Storage Empty & Delete Bucket
    const emptyBucketMatch = rawUrl.match(/\/storage\/buckets\/([^/]+)\/empty-and-delete/);
    if (emptyBucketMatch) {
      const bucket = decodeURIComponent(emptyBucketMatch[1]);
      return {
        title: 'Force Empty & Permanently Delete Cloud Storage Bucket',
        resourceKind: 'Cloud Storage Bucket (Recursive Purge)',
        targetName: `gs://${bucket}`,
        location: 'Global / Multi-Region',
        projectId,
        method: 'POST',
        endpoint: rawUrl,
        impactWarning: `DANGER: This operation will first permanently delete EVERY object and file stored inside "gs://${bucket}" and then permanently destroy the bucket itself. This action is irreversible.`,
      };
    }

    // Compute Engine VM Power -> DELETE
    const vmPowerMatch = rawUrl.match(/\/vms\/([^/]+)\/power/);
    if (vmPowerMatch && String(body.action || '').toUpperCase() === 'DELETE') {
      const vmName = decodeURIComponent(vmPowerMatch[1]);
      const zone = body.zone || 'gcp-zone';
      return {
        title: 'Permanently Delete Compute Engine VM Instance',
        resourceKind: 'Compute Engine VM',
        targetName: vmName,
        location: zone,
        projectId,
        method: 'POST (DELETE VM)',
        endpoint: rawUrl,
        impactWarning: `This will permanently terminate and delete Compute Engine VM "${vmName}" in zone "${zone}", including its auto-delete boot persistent disk.`,
      };
    }

    // Zombie Resource Exterminator
    if (rawUrl.includes('/zombies/exterminate')) {
      const zName = body.zombieId || body.name || 'orphaned-resource';
      const zType = body.type || 'Orphaned Cloud Resource';
      const zZone = body.zone || 'global';
      return {
        title: `Exterminate & Delete ${zType}`,
        resourceKind: zType,
        targetName: zName,
        location: zZone,
        projectId,
        method: 'POST (EXTERMINATE)',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete the unattached/orphaned ${zType} "${zName}" (${zZone}) from project "${projectId}" to reclaim wasted FinOps spend.`,
      };
    }

    // Artifact Registry Supply-Chain Delete Image / Sweep Orphans
    if (rawUrl.includes('/wave9/supply-chain/delete-image')) {
      const img = body.image || 'container-image';
      return {
        title: 'Permanently Delete Artifact Registry Container Image',
        resourceKind: 'Artifact Registry Image',
        targetName: img,
        location: 'Artifact Registry',
        projectId,
        method: 'POST (DELETE IMAGE)',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete container image "${img}" (and its digest/tags) from Google Cloud Artifact Registry.`,
      };
    }

    if (rawUrl.includes('/wave9/supply-chain/sweep-orphans')) {
      const count = Array.isArray(body.images) ? body.images.length : 'all untagged';
      return {
        title: 'Sweep & Delete Orphaned Container Images',
        resourceKind: 'Artifact Registry Orphan Sweep',
        targetName: `${count} Untagged / Orphaned Images`,
        location: 'Artifact Registry',
        projectId,
        method: 'POST (SWEEP ORPHANS)',
        endpoint: rawUrl,
        impactWarning: `This will permanently purge ${count} untagged/orphaned container image digests from Artifact Registry.`,
      };
    }

    // Sovereign IAM Service Account Key Deletion / Emergency Revocation
    if (rawUrl.includes('/sovereign-iam/credentials/action')) {
      const act = String(body.actionType || '').toUpperCase();
      if (
        act === 'DELETE_SA_KEY' ||
        act === 'EMERGENCY_REVOKE_ALL_SA_KEYS' ||
        act === 'REVOKE_ACTIVE_OAUTH_TOKEN'
      ) {
        const target =
          body.keyId || body.targetSa || body.principal || 'IAM Credential';
        return {
          title: `Confirm Destructive IAM Credential Action (${act})`,
          resourceKind: 'IAM Service Account Key / Token',
          targetName: target,
          location: 'Global IAM',
          projectId,
          method: `POST (${act})`,
          endpoint: rawUrl,
          impactWarning: `This will immediately and permanently delete or revoke "${target}" in Google Cloud IAM. Any workload authenticating with this key will lose access immediately.`,
        };
      }
    }

    // 2026 Quantum Nexus Ephemeral PR Shadow Environment Teardown
    if (
      rawUrl.includes('/quantum-nexus/action') &&
      String(body.action || '').toUpperCase() === 'DELETE_EPHEMERAL_PR_ENV'
    ) {
      const target =
        body.serviceName ||
        (body.prNumber ? `PR #${body.prNumber} Shadow Env` : 'Ephemeral PR Env');
      return {
        title: 'Tear Down & Delete Ephemeral PR Shadow Environment',
        resourceKind: 'Cloud Run Ephemeral PR Environment',
        targetName: target,
        location: body.region || 'us-central1',
        projectId,
        method: 'POST (DELETE PR ENV)',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete the ephemeral Cloud Run preview service "${target}" and release its preview URL.`,
      };
    }

    // Cloud Run Public (allUsers) vs Private (IAM Authenticated) Access Toggle
    const cloudRunIamMatch = rawUrl.match(
      /\/cloudrun\/([^/]+)\/([^/]+)\/iam(?:\?|$)/
    );
    if (cloudRunIamMatch) {
      const region = decodeURIComponent(cloudRunIamMatch[1]);
      const serviceName = decodeURIComponent(cloudRunIamMatch[2]);
      const makePublic = Boolean(body.allowUnauthenticated);
      if (makePublic) {
        return {
          title: 'Expose Cloud Run Service to Public Internet (allUsers)?',
          headerBadge: 'CloudPulse 2026 IAM Security & Exposure Gatekeeper',
          targetLabel: 'Target Cloud Run Service to Expose Publicly',
          resourceKind: 'Cloud Run IAM Policy (roles/run.invoker)',
          targetName: `${serviceName} (PRIVATE IAM → PUBLIC allUsers)`,
          location: region,
          projectId,
          method: 'GRANT allUsers',
          endpoint: rawUrl,
          confirmLabel: 'Yes, Expose Service to Public (allUsers)',
          cancelToast: `Access change cancelled — "${serviceName}" remains Private (IAM Authenticated).`,
          impactWarning: `PUBLIC EXPOSURE WARNING: This grants "roles/run.invoker" to "allUsers" on Cloud Run service "${serviceName}" (${region}). Anyone on the public internet will be able to invoke its HTTPS URL without Google Cloud IAM authentication.`,
        };
      }
      return {
        title: 'Restrict Cloud Run Service to Authenticated IAM Only (Private)?',
        headerBadge: 'CloudPulse 2026 IAM Security & Access Gatekeeper',
        targetLabel: 'Target Cloud Run Service to Lock Down (Private)',
        resourceKind: 'Cloud Run IAM Policy (roles/run.invoker)',
        targetName: `${serviceName} (PUBLIC allUsers → PRIVATE IAM AUTH)`,
        location: region,
        projectId,
        method: 'REVOKE allUsers',
        endpoint: rawUrl,
        confirmLabel: 'Yes, Switch to Private (IAM Auth Required)',
        cancelToast: `Access change cancelled — "${serviceName}" remains Public (allUsers).`,
        impactWarning: `AUTHENTICATION LOCKDOWN WARNING: This removes "allUsers" (roles/run.invoker) from Cloud Run service "${serviceName}" (${region}). Unauthenticated browsers, webhooks, or external clients calling this URL without a valid Google IAM Bearer token will immediately receive HTTP 403 Forbidden.`,
      };
    }
  }

  return null;
}

function CloudPulseCockpit() {
  const { isDark, toggleTheme, mobilePreview, setMobilePreview } = useTheme();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contextData, setContextData] = useState({
    authenticated: false,
    account: '',
    defaultProject: '',
    projects: [],
  });
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorBanner, setRawErrorBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [pendingDeleteQueue, setPendingDeleteQueue] = useState([]);

  const setErrorBanner = useCallback((msg) => {
    if (
      typeof msg === 'string' &&
      (msg.includes('') || msg.includes('__cancelledByUser'))
    ) {
      return;
    }
    setRawErrorBanner(msg);
  }, []);

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [innovationSubTab, setInnovationSubTab] = useState('TOPOLOGY');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState('');
  const [shellSeedCommand, setShellSeedCommand] = useState('');

  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionInitialService, setProvisionInitialService] =
    useState('GCS_BUCKET');
  const [provisionInitialLocation, setProvisionInitialLocation] = useState(null);
  const [vmRefreshTrigger, setVmRefreshTrigger] = useState(0);
  const [cloudRunModalOpen, setCloudRunModalOpen] = useState(false);

  // Global Cmd+K / Ctrl+K shortcut for 2026 Command & Voice Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  // Global Mandatory Delete & Destructive Action Confirmation Gatekeeper
  useEffect(() => {
    const interceptorId = axios.interceptors.request.use(
      (config) => {
        const descriptor = classifyDestructiveAxiosConfig(config);
        if (!descriptor) {
          return config;
        }
        return new Promise((resolve, reject) => {
          setPendingDeleteQueue((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              descriptor,
              onConfirm: () => {
                config.headers = {
                  ...(config.headers || {}),
                  'x-confirmed-delete': 'true',
                };
                resolve(config);
              },
              onCancel: () => {
                const cancelText =
                  descriptor.cancelToast ||
                  'Deletion cancelled — resource kept safe.';
                const cancelErr = new Error(cancelText);
                cancelErr.__cancelledByUser = true;
                cancelErr.response = {
                  status: 499,
                  data: {
                    error: cancelText,
                  },
                };
                showToast(cancelText);
                reject(cancelErr);
              },
            },
          ]);
        });
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [showToast]);

  // Restore browser token from sessionStorage or URL hash (OAuth 2.0 redirect)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const hashToken = params.get('access_token');
      if (hashToken) {
        sessionStorage.setItem('cloudpulse_access_token', hashToken);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const storedToken = sessionStorage.getItem('cloudpulse_access_token');
    const storedAccount = sessionStorage.getItem('cloudpulse_account');
    if (storedToken) {
      axios.defaults.headers.common['x-gcp-access-token'] = storedToken;
      if (storedAccount) {
        axios.defaults.headers.common['x-gcp-account'] = storedAccount;
      }
    }

    axios
      .get('/api/context')
      .then((res) => {
        if (res.data.authenticated) {
          setContextData(res.data);
          const storedProj = sessionStorage.getItem('cloudpulse_project');
          const projToUse =
            storedProj ||
            res.data.defaultProject ||
            res.data.projects?.[0]?.projectId ||
            '';
          setSelectedProjectId(projToUse);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  const fetchProjectOverview = useCallback(async (projId) => {
    if (!projId) return;
    setLoadingOverview(true);
    setErrorBanner(null);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projId)}/overview`
      );
      setOverview(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
      } else {
        setErrorBanner(
          err.response?.data?.error ||
            `Failed to fetch live telemetry for project ${projId}`
        );
      }
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && selectedProjectId) {
      sessionStorage.setItem('cloudpulse_project', selectedProjectId);
      fetchProjectOverview(selectedProjectId);
    }
  }, [isAuthenticated, selectedProjectId, fetchProjectOverview]);

  const handleDisconnect = async () => {
    sessionStorage.removeItem('cloudpulse_access_token');
    sessionStorage.removeItem('cloudpulse_account');
    sessionStorage.removeItem('cloudpulse_project');
    delete axios.defaults.headers.common['x-gcp-access-token'];
    delete axios.defaults.headers.common['x-gcp-account'];
    try {
      await axios.post('/api/auth/disconnect');
    } catch {
      // ignore
    }
    setOverview(null);
    setIsAuthenticated(false);
  };

  const handleSessionEstablished = (sessionData) => {
    if (sessionData.accessToken) {
      sessionStorage.setItem('cloudpulse_access_token', sessionData.accessToken);
      sessionStorage.setItem('cloudpulse_account', sessionData.account || '');
      axios.defaults.headers.common['x-gcp-access-token'] =
        sessionData.accessToken;
      axios.defaults.headers.common['x-gcp-account'] =
        sessionData.account || '';
    }
    setContextData({
      authenticated: true,
      account: sessionData.account,
      defaultProject: sessionData.selectedProjectId,
      projects: sessionData.projects || [],
    });
    setSelectedProjectId(sessionData.selectedProjectId);
    setIsAuthenticated(true);
    showToast(
      `Connected as ${sessionData.account} on project ${sessionData.selectedProjectId}`
    );
  };

  const handleTriggerAction = async ({ actionType, targetId, payload }) => {
    setActionLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(selectedProjectId)}/action`,
        {
          actionType,
          targetId,
          payload,
        }
      );
      showToast(res.data.message || 'Action applied to GCP project.');
      await fetchProjectOverview(selectedProjectId);
    } catch (err) {
      setErrorBanner(
        err.response?.data?.error || 'Failed to apply remediation action.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCopilotWithPrompt = (promptText) => {
    setCopilotInitialPrompt(promptText || '');
    setCopilotOpen(true);
  };

  const handleRunInShell = (cmd) => {
    setShellSeedCommand(cmd);
    setActiveTab('LOGS_SHELL');
    showToast(`Loaded command into Mobile Cloud Shell: ${cmd}`);
  };

  const handleOpenProvision = (serviceType = 'GCS_BUCKET', locationSpec = null) => {
    setProvisionInitialService(serviceType);
    setProvisionInitialLocation(locationSpec);
    setProvisionOpen(true);
  };

  const handleProvisionSuccess = async (data, serviceType) => {
    showToast(data.message || 'Resource provisioned on Google Cloud!');
    await fetchProjectOverview(selectedProjectId);
    setVmRefreshTrigger((c) => c + 1);
    if (serviceType === 'CLOUD_RUN') {
      setActiveTab('CLOUD_RUN');
    } else if (serviceType === 'GKE_CLUSTER') {
      setActiveTab('GKE_STUDIO');
    } else if (serviceType === 'CLOUD_SQL') {
      setActiveTab('CLOUD_SQL_STUDIO');
    } else if (serviceType === 'GCS_BUCKET') {
      setActiveTab('CLOUD_STORAGE');
    } else if (serviceType === 'BIGQUERY_DATASET') {
      setActiveTab('BIGQUERY_STUDIO');
    } else if (serviceType === 'COMPUTE_VM') {
      setActiveTab('VM_SSH');
    } else if (serviceType === 'VPC_NETWORK' || serviceType === 'VPC_FIREWALL') {
      setActiveTab('VPC_NETWORKS');
    }
  };

  const handleDeleteResource = async (resource) => {
    setActionLoading(true);
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(selectedProjectId)}/resource`,
        {
          data: {
            resourceType: resource.type,
            name: resource.name,
            region: resource.region,
          },
        }
      );
      showToast(res.data.message || `Deleted ${resource.name} from ${selectedProjectId}`);
      await fetchProjectOverview(selectedProjectId);
      setVmRefreshTrigger((c) => c + 1);
    } catch (err) {
      setErrorBanner(
        err.response?.data?.error || `Failed to delete ${resource.name}`
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] flex items-center justify-center p-6">
        <div className="text-xs font-mono text-zinc-500 animate-pulse">
          Initializing CloudPulse 2026 Multi-Account Bridge...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthOnboardingGate onSessionEstablished={handleSessionEstablished} />
    );
  }

  const liveBurn = calculateLiveBurnRate(overview);

  const navTabs = [
    // I. Flagship Command & 2026 Beyond-Console Innovation Lab
    {
      id: 'OVERVIEW',
      group: 'COMMAND',
      label: '2026 SRE Cockpit',
      tip: 'Executive 2026 SRE Cockpit: Live Project KPIs, Featured 2026 Innovation Lab, 5-Domain Architecture Hub, Live Resource Inventory & API Kill-Switch',
      icon: LayoutDashboard,
    },
    {
      id: 'INNOVATION_LAB',
      group: 'COMMAND',
      label: '2026 Innovation Lab',
      isStar: true,
      tip: '14 Exclusive Beyond-Console Engineering Tools: Pre-Crime Billing, Topology Blast Radius, Night-Mode Sleep, Reverse-Terraform, Storage RAM DLP, Cold-Start Surgeon & AES-256-GCM Gemini 3.8 Vault',
      icon: Sparkles,
    },
    {
      id: 'GLOBAL_MAP',
      group: 'COMMAND',
      label: 'Global Map',
      tip: 'Interactive 40-Region & 121-Zone Global Subsea Cable, Carbon Intensity & Chaos Failover Map with click-to-deploy',
      icon: Globe,
    },

    // II. Compute, Serverless & CI/CD Studios
    {
      id: 'CLOUD_RUN',
      group: 'COMPUTE_CICD',
      label: 'Cloud Run',
      tip: 'Cloud Run Serverless Fleet Manager: Deploy containers, attach NVIDIA L4 GPUs, tune min/max autoscaling, and switch Request vs Instance billing',
      icon: Rocket,
    },
    {
      id: 'FUNCTIONS_STUDIO',
      group: 'COMPUTE_CICD',
      label: 'Functions & Eventarc',
      tip: 'Cloud Functions (1st Gen v1 & 2nd Gen v2) + Demystified Eventarc Trigger Studio: Beginner & 90+ Universal GCP Audit Log triggers',
      icon: Zap,
    },
    {
      id: 'GKE_STUDIO',
      group: 'COMPUTE_CICD',
      label: 'GKE Studio',
      tip: 'Google Kubernetes Engine (GKE) Studio: 1-Click Autopilot & Spot GPU Cluster Provisioner, compliance locks & K8s YAML Composer',
      icon: Cpu,
    },
    {
      id: 'VM_SSH',
      group: 'COMPUTE_CICD',
      label: 'VM Fleet & SSH',
      tip: 'Compute Engine VM Fleet & Browser Web-SSH Terminal: Start, stop, resize, or SSH directly into your Linux VMs',
      icon: Server,
    },
    {
      id: 'WAVE9_STUDIO',
      group: 'COMPUTE_CICD',
      label: 'Cloud Build & SBOM',
      tip: 'Cloud Build GitHub CI/CD + Artifact Registry SLSA-3 Supply-Chain Studio: Buildpacks/Dockerfiles, Auto-Deploy & Orphan Digest Sweeper',
      icon: PackageCheck,
    },

    // III. Data Lakehouse, Databases & AI Frontier
    {
      id: 'CLOUD_STORAGE',
      group: 'DATA_AI',
      label: 'Cloud Storage',
      tip: 'Cloud Storage Studio: 5-Step Compliance Bucket Wizard, strict SEC/GDPR/HIPAA locks, Soft-Delete & WORM retention, and live object explorer',
      icon: HardDrive,
    },
    {
      id: 'BIGQUERY_STUDIO',
      group: 'DATA_AI',
      label: 'BigQuery & BigLake',
      tip: 'BigQuery & BigLake 2026 Enterprise Lakehouse Studio: BigLake Apache Iceberg & Parquet over gs:// buckets, Physical Billing (-54%), SQL X-Ray & 168h Time-Machine',
      icon: Database,
    },
    {
      id: 'DATA_ENGINEER_STUDIO',
      group: 'DATA_AI',
      label: 'Data Engineer',
      tip: '2026 Data Engineering Studio (GCloud SDK 588.0.0 & Data Agent Kit): 1-Canvas Bronze→Silver→Gold Medallion Builder, Dataform/dbt Auto-Clean SQLX, Dataplex Auto-Profiling & Data Products, Visual Schema Mapper & -$348/mo Serverless ELT DAGs',
      icon: Layers,
    },
    {
      id: 'CLOUD_SQL_STUDIO',
      group: 'DATA_AI',
      label: 'Cloud SQL & AlloyDB',
      tip: 'Cloud SQL (MySQL 8.4 & PostgreSQL 16/17) + AlloyDB Studio: Architecture Fork, AI Vector (alloydb_scann / pgvector) Surgeon & IAM Auth Proxy v2',
      icon: Database,
    },
    {
      id: 'WAVE10_FRONTIER',
      group: 'DATA_AI',
      label: 'Spanner Graph & Spark',
      tip: '2026 Frontier Studio: Cloud Spanner Graph + Vector ($65/mo 100-PU Engine), Zero-Cluster Serverless Spark on BigLake Iceberg, Workflows Choreographer & Vertex AI Model Armor',
      icon: Sparkles,
    },

    // IV. Network, Zero-Trust IAM & Incident SRE
    {
      id: 'VPC_NETWORKS',
      group: 'SECURITY_SRE',
      label: 'VPC & Firewalls',
      tip: 'VPC Backbone & Firewall Perimeter Manager: Inspect subnets, BGP routing, MTU, and audit or lock 0.0.0.0/0 ingress rules to IAP',
      icon: Network,
    },
    {
      id: 'SOVEREIGN_STUDIO',
      group: 'SECURITY_SRE',
      label: 'IAM & Sovereign Drift',
      tip: 'Autonomous IAM Least-Privilege Surgeon (24h JIT CEL + Service Account Key & OAuth2 Token Kill-Switch), SHA-256 Merkle Drift Radar & Secret/KMS/WAF Vault',
      icon: ShieldCheck,
    },
    {
      id: 'SRE_WAR_ROOM',
      group: 'SECURITY_SRE',
      label: 'SRE War-Room',
      tip: 'Autonomous SRE Incident War-Room, Cloud Logging Root-Cause Correlator, 14.4x SLO Burn Radar, VPC Service Controls (VPC-SC) & Pub/Sub DLQ Studio',
      icon: Flame,
    },

    // V. FinOps, Cloud Shell & Docs
    {
      id: 'FINOPS',
      group: 'OPS_DOCS',
      label: 'FinOps & Telemetry',
      tip: 'Real-Time Cloud Monitoring Metrics, CPU/Memory/Network Telemetry Charts & FinOps Footprint',
      icon: BarChart3,
    },
    {
      id: 'LOGS_SHELL',
      group: 'OPS_DOCS',
      label: 'Logs & Cloud Shell',
      tip: 'Live Cloud Logging Streamer & Interactive gcloud / bq / gsutil Web Cloud Shell',
      icon: Terminal,
    },
    {
      id: 'DOCS_GUIDE',
      group: 'OPS_DOCS',
      label: 'Docs & Guide',
      tip: 'Interactive Architecture Documentation, Security Model & Feature Walkthrough Guide',
      icon: BookOpen,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090b] text-zinc-950 dark:text-zinc-50 transition-colors duration-300">
      <div
        className={
          mobilePreview
            ? 'max-w-[430px] mx-auto my-4 border-[6px] border-zinc-800 dark:border-zinc-700 rounded-[40px] shadow-2xl overflow-hidden bg-zinc-50 dark:bg-[#09090b] min-h-[860px] flex flex-col relative'
            : 'max-w-[1600px] mx-auto pb-20 md:pb-10'
        }
      >
        {mobilePreview && (
          <div className="bg-[#09090b] text-zinc-200 px-6 py-2 flex items-center justify-between text-[11px] font-mono border-b border-zinc-800">
            <span>23:35 · GCP 5G+</span>
            <div className="w-20 h-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] text-zinc-300">
              LIVE OAUTH
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-zinc-400" />
              <BatteryCharging className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
        )}

        {/* Header Row */}
        <header className="relative z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#0c0c0f]/90 backdrop-blur-md px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shadow-sm">
                <Cloud className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                    CloudPulse <span className="text-zinc-500 dark:text-zinc-400">2026</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    REAL PROJECT MODE
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[230px] sm:max-w-none">
                  {contextData.account} · {format(new Date(), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Live Burn-Rate Radar Ticker Pill */}
              <button
                type="button"
                onClick={() => {
                  setInnovationSubTab('FINOPS_SLEEP');
                  setActiveTab('INNOVATION_LAB');
                }}
                title="Open Live Wallet Burn-Rate Radar & Night-Mode Sleep Switch ($0/hr overnight hibernation)"
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-2 text-xs font-mono font-bold transition-colors shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>${liveBurn.hourly.toFixed(4)}/hr</span>
                <span className="hidden xl:inline text-[10px] opacity-75">
                  (~${liveBurn.monthly.toFixed(2)}/mo)
                </span>
              </button>

              {/* ⌘K Global Command & Voice Action Bar */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                title="Open ⌘K Natural Language & Voice-to-Cloud Command Palette (Shortcut: Ctrl+K or Cmd+K)"
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-3 py-2 text-xs font-mono font-bold transition-colors shadow-sm"
              >
                <Command className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>⌘K Ops</span>
              </button>

              {/* Live GCP Project Dropdown */}
              <div className="relative z-40">
                <button
                  type="button"
                  onClick={() => setProjectMenuOpen((o) => !o)}
                  title={`Active GCP Project: ${selectedProjectId} — Click to switch between your authenticated Google Cloud projects`}
                  className="inline-flex items-center gap-2 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-3 py-2 text-xs font-mono font-medium transition-colors shadow-sm"
                >
                  <span className="w-2 h-2 rounded-full bg-zinc-500 dark:bg-zinc-400" />
                  <span>{selectedProjectId}</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {projectMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-[#ffffff] dark:bg-[#0c0c0f] shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-[12px] py-1.5 z-50 max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                      Real GCP Projects ({contextData.projects?.length || 1})
                    </div>
                    {(contextData.projects || []).map((proj) => (
                      <button
                        key={proj.projectId}
                        type="button"
                        onClick={() => {
                          setSelectedProjectId(proj.projectId);
                          setProjectMenuOpen(false);
                          showToast(
                            `Switched live GCP project to ${proj.projectId}`
                          );
                        }}
                        title={`Switch active telemetry & control plane to project ${proj.projectId} (${proj.name})`}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between ${
                          selectedProjectId === proj.projectId
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div>
                          <div className="font-mono">{proj.projectId}</div>
                          <div className="text-[10px] text-zinc-500">
                            {proj.name} · #{proj.projectNumber}
                          </div>
                        </div>
                        {selectedProjectId === proj.projectId && (
                          <Check className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* + Provision Resource Button */}
              <button
                type="button"
                onClick={() => handleOpenProvision('GCS_BUCKET')}
                title="Provision a live GCP resource (Cloud Storage Bucket, Cloud Run Service, Compute Engine VM, VPC Network, Firewall Rule, BigQuery Dataset, or Enable API)"
                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-[8px] px-3.5 py-2 text-xs font-bold transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Provision Resource</span>
              </button>

              {/* 1-Tap Project Health, Drift & FinOps Scanner Button */}
              <button
                type="button"
                onClick={() => handleOpenCopilotWithPrompt('')}
                title="Run 1-Tap Project Health, Zombie Waste, Firewall Perimeter & Live Pricing Drift Scan"
                className="inline-flex items-center gap-1.5 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-3 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Health &amp; Drift Scan</span>
              </button>

              {/* Deploy to Cloud Run Modal Button */}
              <button
                type="button"
                onClick={() => setCloudRunModalOpen(true)}
                title="Deploy this CloudPulse 2026 cockpit as a serverless container on Google Cloud Run"
                className="inline-flex items-center gap-1.5 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-2.5 py-2 text-xs font-medium transition-colors shadow-sm"
              >
                <Rocket className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span className="hidden lg:inline">Cloud Run</span>
              </button>

              {/* Phone / Desktop Viewport Mode Switcher */}
              <button
                type="button"
                onClick={() => setMobilePreview((m) => !m)}
                title="Toggle Android 2026 Mobile Phone Frame vs Full Widescreen Cockpit"
                className="inline-flex items-center gap-1.5 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-2.5 py-2 text-xs font-medium transition-colors shadow-sm"
              >
                {mobilePreview ? (
                  <Monitor className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                )}
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                disabled={loadingOverview}
                onClick={() => {
                  fetchProjectOverview(selectedProjectId);
                  setVmRefreshTrigger((c) => c + 1);
                }}
                title={`Refresh live GCP telemetry, VMs, Cloud Run services, Storage buckets, and VPCs for ${selectedProjectId}`}
                aria-label="Refresh GCP telemetry"
                className="p-2 rounded-[8px] bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 text-zinc-500 dark:text-zinc-400 ${
                    loadingOverview ? 'animate-spin' : ''
                  }`}
                />
              </button>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={
                  isDark
                    ? 'Switch to Daylight High-Contrast Mode'
                    : 'Switch to 2026 OLED Dark Cockpit Mode'
                }
                aria-label="Toggle Dark or Light Mode"
                className="p-2 rounded-[8px] bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-zinc-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600" />
                )}
              </button>

              {/* Disconnect / Switch Account Button */}
              <button
                type="button"
                onClick={handleDisconnect}
                title="Disconnect active session & switch Google Cloud account"
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          {/* Underline Navigation Tabs (Single-Row Horizontal Scroll with Monochrome SVG Icons) */}
          <nav className="flex items-center gap-4 sm:gap-5 mt-4 pb-2.5 border-b border-zinc-200 dark:border-zinc-800 -mb-2 overflow-x-auto">
            {navTabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const showGroupDivider =
                idx > 0 && navTabs[idx - 1].group !== tab.group;
              return (
                <React.Fragment key={tab.id}>
                  {showGroupDivider && (
                    <span
                      className="h-4 w-px bg-zinc-300 dark:bg-zinc-700/80 mb-2 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.tip}
                    className={`inline-flex items-center gap-1.5 text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 pb-2 font-semibold border-b-2 ${
                      isActive
                        ? 'border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border-transparent hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-current opacity-80" />
                    <span>{tab.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </header>

        {/* Main Content Body */}
        <main className="p-4 sm:p-6 space-y-6 flex-1">
          {toastMessage && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300 rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs shadow-sm transition-all">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-zinc-600 dark:text-zinc-300 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                title="Dismiss notification banner"
                className="text-xs underline opacity-75 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {errorBanner && (
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/30 text-rose-800 dark:text-rose-300 rounded-lg p-4 flex items-center justify-between gap-3 text-xs">
              <span>{errorBanner}</span>
              <button
                type="button"
                onClick={() => fetchProjectOverview(selectedProjectId)}
                title="Retry fetching live GCP telemetry"
                className="underline font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {loadingOverview && !overview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className="h-32 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-xl"
                  />
                ))}
              </div>
              <div className="h-72 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
            </div>
          ) : (
            <>
              <FuturisticOrbitalHud
                projectId={selectedProjectId}
                overview={overview}
                liveBurn={liveBurn}
                onRefreshOverview={() => {
                  fetchProjectOverview(selectedProjectId);
                  setVmRefreshTrigger((c) => c + 1);
                }}
                onDeleteResource={handleDeleteResource}
                onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                onOpenDocsGuide={() => setActiveTab('DOCS_GUIDE')}
                onShowToast={showToast}
                onShowError={setErrorBanner}
              />

              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <SortableKpiRow
                    summary={overview?.summary}
                    fetchLatencyMs={overview?.fetchLatencyMs}
                  />

                  {/* 2026 Beyond-Console Innovation Lab */}
                  <Revolutionary2026Suite
                    projectId={selectedProjectId}
                    overview={overview}
                    initialSubTab={innovationSubTab}
                    onRefreshOverview={() => {
                      fetchProjectOverview(selectedProjectId);
                      setVmRefreshTrigger((c) => c + 1);
                    }}
                    onOpenProvision={handleOpenProvision}
                    onDeleteResource={handleDeleteResource}
                    onSelectStudioTab={(tabId) => setActiveTab(tabId)}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />

                  {/* 5-Domain Organized Studio Hub (Zero Duplication Across Standard GCP Services) */}
                  <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                          <span>
                            CloudPulse 2026 Architectural Domain Navigator
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Every Google Cloud technology is organized into 5 dedicated, non-overlapping engineering domains — click any studio below to open its full control plane.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                        5 DOMAINS · 16 DEDICATED STUDIOS · ZERO DUPLICATES
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                      {[
                        {
                          domain: 'I. Compute, Serverless & CI/CD',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'CLOUD_RUN', label: 'Cloud Run Studio', meta: `${overview?.cloudRunServices?.length || 0} Services · L4 GPUs` },
                            { id: 'FUNCTIONS_STUDIO', label: 'Functions & Eventarc', meta: 'v1/v2 + 90+ GCP Events' },
                            { id: 'GKE_STUDIO', label: 'GKE Autopilot & GPUs', meta: 'K8s Fleet & YAML' },
                            { id: 'VM_SSH', label: 'VM Fleet & Web-SSH', meta: `${overview?.summary?.totalVms ?? 0} VMs · Browser SSH` },
                            { id: 'WAVE9_STUDIO', label: 'Cloud Build & SBOM', meta: 'GitHub CI/CD & SLSA-3' },
                          ],
                        },
                        {
                          domain: 'II. Data, Lakehouse & AI',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'CLOUD_STORAGE', label: 'Cloud Storage Studio', meta: `${overview?.summary?.storageBuckets ?? 0} Buckets · WORM` },
                            { id: 'BIGQUERY_STUDIO', label: 'BigQuery & BigLake', meta: 'Capacitor + Apache Iceberg' },
                            { id: 'DATA_ENGINEER_STUDIO', label: 'Data Engineer Studio', meta: 'Medallion, Dataform & DAK' },
                            { id: 'CLOUD_SQL_STUDIO', label: 'Cloud SQL & AlloyDB', meta: 'PG 17, MySQL 8.4 & Vectors' },
                            { id: 'WAVE10_FRONTIER', label: 'Spanner Graph & Spark', meta: '100-PU Graph, Spark & Workflows' },
                          ],
                        },
                        {
                          domain: 'III. Network & Global Edge',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'GLOBAL_MAP', label: '40-Region Global Map', meta: 'Subsea Cables & Carbon' },
                            { id: 'VPC_NETWORKS', label: 'VPC & Firewalls', meta: `${overview?.vpcs?.length || 0} VPCs · ${overview?.firewalls?.length || 0} Rules` },
                          ],
                        },
                        {
                          domain: 'IV. Zero-Trust IAM & SRE',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'SOVEREIGN_STUDIO', label: 'IAM, Keys & Drift', meta: 'SA Key Kill-Switch & JIT' },
                            { id: 'SRE_WAR_ROOM', label: 'SRE War-Room & VPC-SC', meta: 'SLO Burn & Perimeter' },
                          ],
                        },
                        {
                          domain: 'V. FinOps, 2026 Lab & Shell',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'FINOPS', label: 'FinOps & Telemetry', meta: `$${liveBurn.monthly.toFixed(2)}/mo Run-Rate` },
                            { id: 'INNOVATION_LAB', label: '2026 Innovation Lab', meta: '14 Categorized Tools' },
                            { id: 'LOGS_SHELL', label: 'Logs & Cloud Shell', meta: 'Live gcloud / bq / gsutil' },
                            { id: 'DOCS_GUIDE', label: 'Docs & Guide', meta: 'Architecture & Security' },
                          ],
                        },
                      ].map((group) => (
                        <div
                          key={group.domain}
                          className={`p-3.5 rounded-xl border ${group.color} space-y-2`}
                        >
                          <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                            {group.domain}
                          </div>
                          <div className="space-y-1.5">
                            {group.items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setActiveTab(item.id)}
                                className="w-full text-left p-2 rounded-lg bg-white/90 dark:bg-zinc-950/90 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                    {item.label}
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-500 truncate">
                                    {item.meta}
                                  </div>
                                </div>
                                <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 shrink-0">
                                  →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <ResourceControlCenter
                    resources={overview?.resources || []}
                    projectId={selectedProjectId}
                    onTriggerAction={handleTriggerAction}
                    onDeleteResource={handleDeleteResource}
                    actionLoading={actionLoading}
                    onRunInShell={handleRunInShell}
                    onAskCopilot={handleOpenCopilotWithPrompt}
                  />

                  <EmergencyApiKillSwitch
                    projectId={selectedProjectId}
                    enabledApis={overview?.enabledApis || []}
                    onRefresh={() => fetchProjectOverview(selectedProjectId)}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'GLOBAL_MAP' && (
                <GlobalNetworkWorldMap
                  projectId={selectedProjectId}
                  overview={overview}
                  firewalls={overview?.firewalls || []}
                  vpcs={overview?.vpcs || []}
                  onOpenProvision={handleOpenProvision}
                  onRunInShell={handleRunInShell}
                  onSelectTab={(tabId) => setActiveTab(tabId)}
                  onRefresh={() => fetchProjectOverview(selectedProjectId)}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'INNOVATION_LAB' && (
                <Revolutionary2026Suite
                  projectId={selectedProjectId}
                  overview={overview}
                  initialSubTab={innovationSubTab}
                  onRefreshOverview={() => {
                    fetchProjectOverview(selectedProjectId);
                    setVmRefreshTrigger((c) => c + 1);
                  }}
                  onOpenProvision={handleOpenProvision}
                  onDeleteResource={handleDeleteResource}
                  onSelectStudioTab={(tabId) => setActiveTab(tabId)}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'CLOUD_STORAGE' && (
                <CloudStorageStudio
                  projectId={selectedProjectId}
                  onOpenProvision={handleOpenProvision}
                  onRunInShell={handleRunInShell}
                  onRefreshGlobal={() =>
                    fetchProjectOverview(selectedProjectId)
                  }
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'BIGQUERY_STUDIO' && (
                <BigQueryStudio
                  projectId={selectedProjectId}
                  onOpenProvision={handleOpenProvision}
                  onRunInShell={handleRunInShell}
                  onRefreshGlobal={() =>
                    fetchProjectOverview(selectedProjectId)
                  }
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'DATA_ENGINEER_STUDIO' && (
                <DataEngineeringStudio
                  projectId={selectedProjectId}
                  onRunInShell={handleRunInShell}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'CLOUD_SQL_STUDIO' && (
                <CloudSqlAndAlloyDbStudio
                  projectId={selectedProjectId}
                  onOpenProvisionCloudSql={() =>
                    handleOpenProvision('CLOUD_SQL')
                  }
                  onRunInShell={handleRunInShell}
                  onRefreshOverview={() =>
                    fetchProjectOverview(selectedProjectId)
                  }
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'WAVE9_STUDIO' && (
                <Wave9AiGkeSqlSupplyChainStudio
                  projectId={selectedProjectId}
                  onTriggerToast={showToast}
                  onRefreshOverview={() =>
                    fetchProjectOverview(selectedProjectId)
                  }
                />
              )}

              {activeTab === 'WAVE10_FRONTIER' && (
                <Wave10Frontier2026Studio
                  projectId={selectedProjectId}
                  onRunInShell={handleRunInShell}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'SOVEREIGN_STUDIO' && (
                <SovereignTimeMachineIamStudio
                  projectId={selectedProjectId}
                  onTriggerToast={showToast}
                  onRefreshOverview={() =>
                    fetchProjectOverview(selectedProjectId)
                  }
                />
              )}

              {activeTab === 'SRE_WAR_ROOM' && (
                <SreWarRoomPerimeterStudio
                  projectId={selectedProjectId}
                  onTriggerToast={showToast}
                  onRefreshOverview={() =>
                    fetchProjectOverview(selectedProjectId)
                  }
                />
              )}

              {activeTab === 'CLOUD_RUN' && (
                <CloudRunFleetManager
                  projectId={selectedProjectId}
                  initialServices={overview?.cloudRunServices || []}
                  onOpenProvisionCloudRun={() =>
                    handleOpenProvision('CLOUD_RUN')
                  }
                  onRefreshOverview={() =>
                    fetchProjectOverview(selectedProjectId)
                  }
                  onRunInShell={handleRunInShell}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'FUNCTIONS_STUDIO' && (
                <CloudFunctionsEventarcStudio
                  projectId={selectedProjectId}
                  onRunInShell={handleRunInShell}
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'GKE_STUDIO' && (
                <GkeFleetStudio
                  projectId={selectedProjectId}
                  onOpenProvisionGke={() => handleOpenProvision('GKE_CLUSTER')}
                  onRunInShell={handleRunInShell}
                  onRefreshOverview={() =>
                    fetchProjectOverview(selectedProjectId)
                  }
                  onShowToast={showToast}
                />
              )}

              {activeTab === 'VM_SSH' && (
                <VmFleetAndSsh
                  projectId={selectedProjectId}
                  account={contextData.account}
                  onOpenProvisionVm={() => handleOpenProvision('COMPUTE_VM')}
                  refreshTrigger={vmRefreshTrigger}
                  onVmDeleted={() => fetchProjectOverview(selectedProjectId)}
                />
              )}

              {activeTab === 'VPC_NETWORKS' && (
                <VpcNetworksAndFirewalls
                  projectId={selectedProjectId}
                  vpcs={overview?.vpcs || []}
                  firewalls={overview?.firewalls || []}
                  onOpenProvisionVpc={() => handleOpenProvision('VPC_NETWORK')}
                  onOpenProvisionFirewall={() =>
                    handleOpenProvision('VPC_FIREWALL')
                  }
                  onDeleteResource={handleDeleteResource}
                  onRefresh={() => fetchProjectOverview(selectedProjectId)}
                  loading={loadingOverview}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'RESOURCES' && (
                <div className="space-y-6">
                  <ResourceControlCenter
                    resources={overview?.resources || []}
                    projectId={selectedProjectId}
                    onTriggerAction={handleTriggerAction}
                    onDeleteResource={handleDeleteResource}
                    actionLoading={actionLoading}
                    onRunInShell={handleRunInShell}
                    onAskCopilot={handleOpenCopilotWithPrompt}
                  />

                  <EmergencyApiKillSwitch
                    projectId={selectedProjectId}
                    enabledApis={overview?.enabledApis || []}
                    onRefresh={() => fetchProjectOverview(selectedProjectId)}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'FINOPS' && (
                <div className="space-y-6">
                  <SortableKpiRow
                    summary={overview?.summary}
                    fetchLatencyMs={overview?.fetchLatencyMs}
                  />
                  <TelemetryCharts
                    telemetry={overview?.telemetry}
                    projectId={selectedProjectId}
                    onOpenCopilot={handleOpenCopilotWithPrompt}
                  />
                </div>
              )}

              {activeTab === 'LOGS_SHELL' && (
                <LogStreamerAndShell
                  logs={overview?.logs || []}
                  projectId={selectedProjectId}
                  account={contextData.account}
                  initialCommand={shellSeedCommand}
                  onRefreshLogs={() => fetchProjectOverview(selectedProjectId)}
                  onAskCopilot={handleOpenCopilotWithPrompt}
                />
              )}

              {activeTab === 'DOCS_GUIDE' && (
                <InteractiveDocsGuide
                  onNavigateToFeature={(tabId, subTab) => {
                    if (subTab) setInnovationSubTab(subTab);
                    setActiveTab(tabId);
                  }}
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />
              )}
            </>
          )}
        </main>

        <div
          className={`${
            mobilePreview
              ? 'sticky bottom-0'
              : 'fixed bottom-0 left-0 right-0 md:hidden'
          } z-40 bg-white/95 dark:bg-[#0c0c0f]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-around`}
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.tip}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projectId={selectedProjectId}
        overview={{
          ...overview,
          cloudRun: overview?.cloudRunServices || [],
        }}
        vms={(overview?.resources || []).filter(
          (r) => r.type === 'Compute Engine VM'
        )}
        onSelectTab={(tabId, subTab) => {
          if (subTab) setInnovationSubTab(subTab);
          setActiveTab(tabId);
        }}
        onOpenCreateModal={(type) => {
          if (type === 'CLOUD_RUN') handleOpenProvision('CLOUD_RUN');
          else if (type === 'GKE_CLUSTER') handleOpenProvision('GKE_CLUSTER');
          else if (type === 'CLOUD_SQL') handleOpenProvision('CLOUD_SQL');
          else if (type === 'BIGQUERY_DATASET')
            handleOpenProvision('BIGQUERY_DATASET');
          else if (type === 'VM' || type === 'COMPUTE_VM')
            handleOpenProvision('COMPUTE_VM');
          else if (type === 'VPC_NETWORK') handleOpenProvision('VPC_NETWORK');
          else if (type === 'VPC_FIREWALL') handleOpenProvision('VPC_FIREWALL');
          else if (type === 'BUCKET' || type === 'GCS_BUCKET')
            handleOpenProvision('GCS_BUCKET');
          else if (type === 'API') setActiveTab('RESOURCES');
          else handleOpenProvision(type || 'GCS_BUCKET');
        }}
        onOpenKillSwitch={() => setActiveTab('RESOURCES')}
        onOpenCopilot={() => handleOpenCopilotWithPrompt('')}
        onRefreshAll={() => {
          fetchProjectOverview(selectedProjectId);
          setVmRefreshTrigger((c) => c + 1);
        }}
      />

      <ResourceProvisionModal
        isOpen={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        projectId={selectedProjectId}
        initialServiceType={provisionInitialService}
        initialLocation={provisionInitialLocation}
        onProvisionSuccess={handleProvisionSuccess}
      />

      <CloudRunDeployModal
        isOpen={cloudRunModalOpen}
        onClose={() => setCloudRunModalOpen(false)}
        projectId={selectedProjectId}
      />

      <GeminiCopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        projectId={selectedProjectId}
        overview={overview}
        liveBurn={liveBurn}
        onRefresh={() => {
          fetchProjectOverview(selectedProjectId);
          setVmRefreshTrigger((c) => c + 1);
        }}
        onSelectTab={(tab) => setActiveTab(tab)}
        onShowToast={showToast}
      />

      <MandatoryDeleteConfirmationModal
        activeItem={pendingDeleteQueue[0] || null}
        queueLength={pendingDeleteQueue.length}
        onConfirm={() => {
          const current = pendingDeleteQueue[0];
          setPendingDeleteQueue((prev) => prev.slice(1));
          if (current?.onConfirm) current.onConfirm();
        }}
        onCancel={() => {
          const current = pendingDeleteQueue[0];
          setPendingDeleteQueue((prev) => prev.slice(1));
          if (current?.onCancel) current.onCancel();
        }}
      />

      <GlobalInstantTooltipHud />
    </div>
  );
}

/**
 * MandatoryDeleteConfirmationModal:
 * High-visibility Zero-Trust Safety Gatekeeper that intercepts every destructive
 * DELETE or teardown action across all 16 CloudPulse 2026 studios and requires
 * explicit human confirmation before any request reaches Google Cloud.
 */
function MandatoryDeleteConfirmationModal({
  activeItem,
  queueLength = 0,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!activeItem) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, onCancel]);

  if (!activeItem || !activeItem.descriptor) return null;
  const {
    title,
    headerBadge,
    targetLabel,
    resourceKind,
    targetName,
    location,
    projectId,
    method,
    endpoint,
    confirmLabel,
    impactWarning,
  } = activeItem.descriptor;

  return (
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0c0c0f] border-2 border-red-500/80 shadow-2xl shadow-red-950/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hazard Header */}
        <div className="bg-zinc-900 dark:bg-zinc-950 border-b border-red-500/40 px-5 py-3.5 flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-zinc-300" />
            </span>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                {headerBadge ||
                  'CloudPulse 2026 Destructive Action Gatekeeper'}
              </div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          {queueLength > 1 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/30 border border-white/20">
              1 of {queueLength} queued
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Resource Target Summary Card */}
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                {targetLabel || 'Target Resource to Destroy'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white">
                {method}
              </span>
            </div>
            <div className="text-sm sm:text-base font-mono font-extrabold text-zinc-950 dark:text-white break-all">
              {targetName}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[9px] uppercase text-zinc-400">
                  Resource Kind
                </div>
                <div className="font-bold truncate">{resourceKind}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[9px] uppercase text-zinc-400">
                  Location / Scope
                </div>
                <div className="font-bold truncate">{location}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[9px] uppercase text-zinc-400">
                  GCP Project
                </div>
                <div className="font-bold truncate">{projectId}</div>
              </div>
            </div>
          </div>

          {/* Impact Warning */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-1.5">
            <div className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span>Permanent Google Cloud Impact Warning</span>
            </div>
            <p>{impactWarning}</p>
            <div className="text-[10px] font-mono text-zinc-500 truncate pt-1">
              API Endpoint: {endpoint}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-extrabold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              Cancel (Keep Safe) [Esc]
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-extrabold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>
                {confirmLabel || 'Confirm & Permanently Delete'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * GlobalInstantTooltipHud:
 * Guarantees 100% of buttons, links, selects, and inputs across all 18 CloudPulse 2026
 * modules display an instant (<20ms), high-contrast 2026 Cyber HUD tooltip on hover/focus,
 * and automatically synthesizes contextual engineer tooltips for any button that lacks
 * an explicit `title` attribute.
 */
function synthesizeButtonTooltip(el) {
  const existing =
    el.getAttribute('data-hud-tip') ||
    el.getAttribute('data-tooltip') ||
    el.getAttribute('title') ||
    el.getAttribute('aria-label');
  if (existing && existing.trim()) return existing.trim();

  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input') {
    const ph = el.getAttribute('placeholder');
    if (ph) return ph.trim();
    return '';
  }

  const rawText = (el.innerText || el.textContent || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!rawText || rawText.length > 140) return '';

  const lower = rawText.toLowerCase();
  if (lower.includes('copy')) {
    return `Copy "${rawText}" to your system clipboard`;
  }
  if (lower.includes('delete') || lower.includes('destroy') || lower.includes('remove')) {
    return `Execute live GCP deletion / teardown action: ${rawText}`;
  }
  if (lower.includes('deploy') || lower.includes('provision') || lower.includes('create') || lower.includes('launch')) {
    return `Provision or deploy live Google Cloud resource: ${rawText}`;
  }
  if (lower.includes('scan') || lower.includes('audit') || lower.includes('x-ray')) {
    return `Run live security, compliance & telemetry inspection: ${rawText}`;
  }
  if (lower.includes('ssh') || lower.includes('shell') || lower.includes('terminal')) {
    return `Open interactive Cloud Shell / Web-SSH session: ${rawText}`;
  }
  if (lower.includes('refresh') || lower.includes('sync') || lower.includes('reload')) {
    return `Sync latest live telemetry from Google Cloud APIs: ${rawText}`;
  }
  if (tag === 'select') {
    return `Select configuration option (${rawText.slice(0, 60)})`;
  }
  return `Click to execute action: ${rawText}`;
}

function GlobalInstantTooltipHud() {
  const [tipState, setTipState] = useState(null);

  useEffect(() => {
    let activeEl = null;

    const restoreNativeTitle = (el) => {
      if (!el) return;
      const saved = el.getAttribute('data-hud-tip');
      if (saved && !el.getAttribute('title')) {
        el.setAttribute('title', saved);
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target?.closest?.(
        'button, a, select, input[title], [data-tooltip], [title]'
      );
      if (!target) {
        if (activeEl) {
          restoreNativeTitle(activeEl);
          activeEl = null;
        }
        setTipState(null);
        return;
      }

      const tipText = synthesizeButtonTooltip(target);
      if (!tipText) {
        setTipState(null);
        return;
      }

      // Cache in data-hud-tip & suppress native delayed browser tooltip while hovered so they don't double-render
      if (target.getAttribute('title')) {
        target.setAttribute('data-hud-tip', target.getAttribute('title'));
        target.removeAttribute('title');
      } else if (!target.getAttribute('data-hud-tip')) {
        target.setAttribute('data-hud-tip', tipText);
      }

      if (activeEl && activeEl !== target) {
        restoreNativeTitle(activeEl);
      }
      activeEl = target;

      const rect = target.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const showBelow = rect.top < 76;
      const centerX = Math.min(
        window.innerWidth - 190,
        Math.max(190, rect.left + rect.width / 2)
      );
      const anchorY = showBelow ? rect.bottom + 8 : rect.top - 8;

      setTipState({
        text: tipText,
        x: centerX,
        y: anchorY,
        showBelow,
      });
    };

    const handleClear = () => {
      if (activeEl) {
        restoreNativeTitle(activeEl);
        activeEl = null;
      }
      setTipState(null);
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleClear, { passive: true });
    window.addEventListener('scroll', handleClear, {
      passive: true,
      capture: true,
    });
    window.addEventListener('keydown', handleClear, { passive: true });

    return () => {
      if (activeEl) restoreNativeTitle(activeEl);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleClear);
      window.removeEventListener('scroll', handleClear, { capture: true });
      window.removeEventListener('keydown', handleClear);
    };
  }, []);

  if (!tipState) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${tipState.x}px`,
        top: `${tipState.y}px`,
        transform: tipState.showBelow
          ? 'translate(-50%, 0)'
          : 'translate(-50%, -100%)',
        zIndex: 99999,
        pointerEvents: 'none',
      }}
      className="max-w-[360px] px-3 py-1.5 rounded-lg bg-zinc-950/95 text-zinc-100 border border-emerald-500/40 shadow-xl shadow-black/50 backdrop-blur-md text-[11px] font-mono leading-snug transition-opacity duration-75"
    >
      <div className="flex items-start gap-1.5">
        <span className="text-emerald-400 font-extrabold shrink-0">ℹ</span>
        <span>{tipState.text}</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CloudPulseCockpit />
    </ThemeProvider>
  );
}
