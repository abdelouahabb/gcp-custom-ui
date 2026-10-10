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
import AuthOnboardingGate from './components/AuthOnboardingGate';
import CloudRunDeployModal from './components/CloudRunDeployModal';

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
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState('');
  const [shellSeedCommand, setShellSeedCommand] = useState('');

  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionInitialService, setProvisionInitialService] =
    useState('GCS_BUCKET');
  const [vmRefreshTrigger, setVmRefreshTrigger] = useState(0);
  const [cloudRunModalOpen, setCloudRunModalOpen] = useState(false);

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

  const handleOpenProvision = (serviceType = 'GCS_BUCKET') => {
    setProvisionInitialService(serviceType);
    setProvisionOpen(true);
  };

  const handleProvisionSuccess = async (data, serviceType) => {
    showToast(data.message || 'Resource provisioned on Google Cloud!');
    await fetchProjectOverview(selectedProjectId);
    setVmRefreshTrigger((c) => c + 1);
    if (serviceType === 'CLOUD_RUN') {
      setActiveTab('CLOUD_RUN');
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

  const navTabs = [
    { id: 'OVERVIEW', label: '2026 SRE Cockpit', icon: LayoutDashboard },
    { id: 'CLOUD_RUN', label: 'Cloud Run Studio ★', icon: Rocket },
    { id: 'VM_SSH', label: 'VM Fleet & Web SSH', icon: Server },
    { id: 'VPC_NETWORKS', label: 'VPC Networks & Firewalls', icon: Network },
    { id: 'RESOURCES', label: 'Live GCP Resources', icon: Layers },
    { id: 'FINOPS', label: 'Footprint & Telemetry', icon: BarChart3 },
    { id: 'LOGS_SHELL', label: 'Logs & Cloud Shell', icon: Terminal },
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
              {/* Live GCP Project Dropdown */}
              <div className="relative z-40">
                <button
                  type="button"
                  onClick={() => setProjectMenuOpen((o) => !o)}
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
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-3.5 py-2 text-xs font-bold transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Provision Resource</span>
              </button>

              {/* Gemini SRE Co-Pilot Button */}
              <button
                type="button"
                onClick={() => handleOpenCopilotWithPrompt('')}
                className="inline-flex items-center gap-1.5 bg-[#059669] hover:bg-[#047857] text-[#000000] rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini SRE</span>
              </button>

              {/* Deploy to Cloud Run Modal Button */}
              <button
                type="button"
                onClick={() => setCloudRunModalOpen(true)}
                title="Deploy your own CloudPulse 2026 on Google Cloud Run"
                className="inline-flex items-center gap-1.5 bg-[#ffffff] dark:bg-[#262626] hover:bg-[#f8fafc] dark:hover:bg-zinc-800 text-[#334155] dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-2.5 py-2 text-xs font-medium transition-colors shadow-sm"
              >
                <Rocket className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden lg:inline">Cloud Run</span>
              </button>

              {/* Phone / Desktop Viewport Mode Switcher */}
              <button
                type="button"
                onClick={() => setMobilePreview((m) => !m)}
                title="Toggle Android 2026 Mobile Phone Frame vs Full Cockpit"
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
                title="Disconnect & Switch Google Cloud Account"
                className="inline-flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-[8px] px-3 py-2 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          {/* Underline Navigation Tabs */}
          <nav className="flex items-center gap-6 mt-4 border-b border-zinc-200 dark:border-zinc-800 -mb-4 overflow-x-auto">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 pb-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                    isActive
                      ? 'border-[#3b82f6] text-[#2563eb] dark:text-[#60a5fa]'
                      : 'text-zinc-500 hover:text-[#334155] dark:hover:text-[#e2e8f0] border-transparent hover:border-[#3b82f6]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
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
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <SortableKpiRow
                    summary={overview?.summary}
                    fetchLatencyMs={overview?.fetchLatencyMs}
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

      <ResourceProvisionModal
        isOpen={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        projectId={selectedProjectId}
        initialServiceType={provisionInitialService}
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
        initialPrompt={copilotInitialPrompt}
        contextSummary={{
          buckets: (overview?.resources || [])
            .filter((r) => r.category === 'storage')
            .map((r) => r.name),
          datasets: (overview?.resources || [])
            .filter((r) => r.category === 'data')
            .map((r) => r.name),
          vms: (overview?.resources || [])
            .filter((r) => r.type === 'Compute Engine VM')
            .map((r) => r.name),
          enabledApisCount: overview?.summary?.enabledApisCount || 0,
        }}
        onTriggerAction={handleTriggerAction}
      />
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
