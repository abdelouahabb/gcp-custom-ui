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
  const [errorBanner, setErrorBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

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
    // I. Global Command & Topology
    {
      id: 'OVERVIEW',
      group: 'COMMAND',
      label: '2026 SRE Cockpit',
      tip: 'Unified 2026 SRE Cockpit: KPIs, Beyond-Console Innovation Lab, Cloud Run, VM Fleet, VPCs, Resources, API Kill-Switch, Telemetry & Cloud Shell',
      icon: LayoutDashboard,
    },
    {
      id: 'GLOBAL_MAP',
      group: 'COMMAND',
      label: 'Global Map 🌍',
      tip: 'Interactive 40-Region & 121-Zone Global Subsea Cable, Carbon Intensity & Chaos Failover Map with click-to-deploy',
      icon: Globe,
    },

    // II. Compute, Serverless & Network Studios
    {
      id: 'CLOUD_RUN',
      group: 'COMPUTE_NET',
      label: 'Cloud Run Studio ★',
      tip: 'Cloud Run Serverless Fleet Manager: Deploy containers, attach NVIDIA L4 GPUs, tune min/max autoscaling, and switch Request vs Instance billing',
      icon: Rocket,
    },
    {
      id: 'FUNCTIONS_STUDIO',
      group: 'COMPUTE_NET',
      label: 'Functions & Eventarc ⚡',
      tip: 'Cloud Functions (1st Gen v1 & 2nd Gen v2) + Demystified Eventarc Trigger Studio: Plain-English trigger picker, 4-stage visual Eventarc X-Ray, 1-Tap Eventarc IAM Auto-Doctor & v1→v2 concurrency upgrader',
      icon: Zap,
    },
    {
      id: 'GKE_STUDIO',
      group: 'COMPUTE_NET',
      label: 'GKE Studio ☸️',
      tip: 'Dedicated Google Kubernetes Engine (GKE) Studio: 1-Click Autopilot & Spot GPU Cluster Provisioner, strict SEC/GDPR/HIPAA compliance locks, K8s Workload YAML Composer & kubeconfig Fleet Manager',
      icon: Cpu,
    },
    {
      id: 'VM_SSH',
      group: 'COMPUTE_NET',
      label: 'VM Fleet & Web SSH',
      tip: 'Compute Engine VM Fleet & Browser Web-SSH Terminal: Start, stop, resize, or SSH directly into your Linux VMs',
      icon: Server,
    },
    {
      id: 'VPC_NETWORKS',
      group: 'COMPUTE_NET',
      label: 'VPC & Firewalls',
      tip: 'VPC Backbone & Firewall Perimeter Manager: Inspect subnets, BGP routing, MTU, and audit or lock 0.0.0.0/0 ingress rules to IAP',
      icon: Network,
    },

    // III. Data Lakehouse & Storage Studios
    {
      id: 'CLOUD_STORAGE',
      group: 'DATA_LAKEHOUSE',
      label: 'Cloud Storage ★',
      tip: 'Cloud Storage Studio: 5-Step Compliance Bucket Wizard, strict SEC/GDPR/HIPAA locks, Soft-Delete & WORM retention, and live object explorer',
      icon: HardDrive,
    },
    {
      id: 'BIGQUERY_STUDIO',
      group: 'DATA_LAKEHOUSE',
      label: 'BigQuery & BigLake 🌊',
      tip: 'BigQuery & BigLake 2026 Enterprise Lakehouse Studio: BigLake Apache Iceberg & Parquet over gs:// buckets, Physical vs Logical Compressed Billing (-54%), Pre-Crime SQL Dry-Run X-Ray, and 168h Time-Machine',
      icon: Database,
    },
    {
      id: 'CLOUD_SQL_STUDIO',
      group: 'DATA_LAKEHOUSE',
      label: 'Cloud SQL & AlloyDB 🐘',
      tip: 'Dedicated Cloud SQL (MySQL 8.4 LTS & PostgreSQL 16/17) + Google Cloud AlloyDB Studio: Classic Cloud SQL vs. AlloyDB Architecture Fork, strict SEC/GDPR/HIPAA compliance locks, AI Vector (alloydb_scann / pgvector / MySQL 8.4 VECTOR) Surgeon & Zero-Password IAM Auth Proxy v2 Vault',
      icon: Database,
    },
    {
      id: 'WAVE9_STUDIO',
      group: 'DATA_LAKEHOUSE',
      label: 'Cloud Build & Artifact SBOM 🏗️',
      tip: 'Cloud Build GitHub CI/CD + Artifact Registry SLSA-3 Supply-Chain Studio: 1-Click GitHub Repo → Cloud Build (Dockerfile or Zero-Dockerfile Buildpacks) → Artifact Registry → Auto-Deploy to Cloud Run or GKE + 1-Click Orphan Digest Sweeper',
      icon: PackageCheck,
    },
    {
      id: 'WAVE10_FRONTIER',
      group: 'DATA_LAKEHOUSE',
      label: 'Spanner Graph & Spark 🚀',
      tip: 'Wave-10 2026 Frontier Studio: Cloud Spanner Graph + Vector ($65/mo 100-PU Granular Engine), Zero-Cluster Dataproc Serverless Spark on BigLake Iceberg, Eventarc/PubSub/Tasks/Workflows Choreographer & Vertex AI Model Armor Firewall',
      icon: Sparkles,
    },

    // IV. Zero-Trust Sovereignty, Incident SRE & 2026 Lab
    {
      id: 'SOVEREIGN_STUDIO',
      group: 'SECURITY_SRE',
      label: 'Sovereign & Drift 🧬',
      tip: 'Wave-7 Sovereign Cloud Time-Machine, Autonomous IAM Least-Privilege Surgeon (24h JIT CEL Conditions), SHA-256 Merkle Drift Radar & Secret/KMS/WAF Vault',
      icon: ShieldCheck,
    },
    {
      id: 'SRE_WAR_ROOM',
      group: 'SECURITY_SRE',
      label: 'SRE War-Room 🚨',
      tip: 'Wave-8 Autonomous SRE Incident War-Room, Cloud Logging Root-Cause Correlator, 14.4x SLO Burn Radar, VPC Service Controls (VPC-SC) Exfiltration Shield & Pub/Sub DLQ Studio',
      icon: Flame,
    },
    {
      id: 'INNOVATION_LAB',
      group: 'SECURITY_SRE',
      label: '2026 Lab ✦',
      tip: '14 Exclusive Beyond-Console Engineering Tools: Pre-Crime Billing, Topology Blast Radius, Night-Mode Sleep, Reverse-Terraform, DLP X-Ray, Cold-Start Surgeon & Zero-Sniffing Gemini 3.8 Vault',
      icon: Sparkles,
    },

    // V. Inventory, FinOps, Cloud Shell & Docs
    {
      id: 'RESOURCES',
      group: 'OPS_DOCS',
      label: 'Live Resources',
      tip: 'Unified Live GCP Resource Inventory & Emergency Service Usage API Kill-Switch',
      icon: Layers,
    },
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
      label: 'Docs & Guide 📖',
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
            <div className="w-20 h-4 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[9px] text-emerald-400">
              LIVE OAUTH
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-emerald-400" />
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        )}

        {/* Header Row */}
        <header className="relative z-30 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#0c0c0f]/90 backdrop-blur-md px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 via-emerald-500/20 to-amber-500/20 border border-blue-500/30 flex items-center justify-center shadow-sm">
                <Cloud className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                    CloudPulse <span className="text-blue-500">2026</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
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
                className="inline-flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 rounded-[8px] px-2.5 py-2 text-xs font-mono font-bold transition-colors shadow-sm"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
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
                className="inline-flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 rounded-[8px] px-3 py-2 text-xs font-mono font-bold transition-colors shadow-sm"
              >
                <Command className="w-3.5 h-3.5 text-violet-500" />
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
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
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
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
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
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-3.5 py-2 text-xs font-bold transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Provision Resource</span>
              </button>

              {/* 1-Tap Project Health, Drift & FinOps Scanner Button */}
              <button
                type="button"
                onClick={() => handleOpenCopilotWithPrompt('')}
                title="Run 1-Tap Project Health, Zombie Waste, Firewall Perimeter & Live Pricing Drift Scan"
                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] px-3 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Health & Drift Scan</span>
              </button>

              {/* Deploy to Cloud Run Modal Button */}
              <button
                type="button"
                onClick={() => setCloudRunModalOpen(true)}
                title="Deploy this CloudPulse 2026 cockpit as a serverless container on Google Cloud Run"
                className="inline-flex items-center gap-1.5 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-2.5 py-2 text-xs font-medium transition-colors shadow-sm"
              >
                <Rocket className="w-3.5 h-3.5 text-blue-500" />
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
                  <Monitor className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
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
                  className={`w-4 h-4 ${
                    loadingOverview ? 'animate-spin text-blue-500' : ''
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
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-700" />
                )}
              </button>

              {/* Disconnect / Switch Account Button */}
              <button
                type="button"
                onClick={handleDisconnect}
                title="Disconnect active session & switch Google Cloud account"
                className="inline-flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          {/* Underline Navigation Tabs (Single-Row Horizontal Scroll with Large Mouse-Friendly Handle) */}
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
                    className={`inline-flex items-center gap-1.5 pb-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 cursor-pointer shrink-0 ${
                      isActive
                        ? 'border-[#3b82f6] text-[#2563eb] dark:text-[#60a5fa]'
                        : 'text-zinc-500 hover:text-[#334155] dark:hover:text-[#e2e8f0] border-transparent hover:border-[#3b82f6]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
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
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
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
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />

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

                  <VmFleetAndSsh
                    projectId={selectedProjectId}
                    account={contextData.account}
                    onOpenProvisionVm={() => handleOpenProvision('COMPUTE_VM')}
                    refreshTrigger={vmRefreshTrigger}
                    onVmDeleted={() => fetchProjectOverview(selectedProjectId)}
                  />

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
                  />

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

                  <TelemetryCharts
                    telemetry={overview?.telemetry}
                    projectId={selectedProjectId}
                    onOpenCopilot={handleOpenCopilotWithPrompt}
                  />

                  <LogStreamerAndShell
                    logs={overview?.logs || []}
                    projectId={selectedProjectId}
                    account={contextData.account}
                    initialCommand={shellSeedCommand}
                    onRefreshLogs={() => fetchProjectOverview(selectedProjectId)}
                    onAskCopilot={handleOpenCopilotWithPrompt}
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

      <GlobalInstantTooltipHud />
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
