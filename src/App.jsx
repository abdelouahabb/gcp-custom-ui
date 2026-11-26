import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Cloud,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  Terminal,
  BarChart3,
  Layers,
  LayoutDashboard,
  Smartphone,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Lock,
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
  CreditCard,
  AlertTriangle,
  History,
  Wand2,
  Trash2,
  Search,
  Star,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  ArrowRight,
  X,
  LayoutGrid,
  Activity,
  Boxes,
  Compass,
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  TimezoneProvider,
  useTimezone,
  TimezoneSelectorPill,
} from './context/TimezoneContext';
import SortableKpiRow from './components/SortableKpiRow';
import TelemetryCharts from './components/TelemetryCharts';
import ResourceControlCenter from './components/ResourceControlCenter';
import PersonaContextualHelper from './components/PersonaContextualHelper';
import LogStreamerAndShell from './components/LogStreamerAndShell';
import GeminiCopilotModal from './components/GeminiCopilotModal';
import ResourceProvisionModal from './components/ResourceProvisionModal';
import VmFleetAndSsh from './components/VmFleetAndSsh';
import VpcNetworksAndFirewalls from './components/VpcNetworksAndFirewalls';
import EmergencyApiKillSwitch from './components/EmergencyApiKillSwitch';
import CloudRunFleetManager from './components/CloudRunFleetManager';
import CloudFunctionsEventarcStudio from './components/CloudFunctionsEventarcStudio';
import GkeFleetStudio from './components/GkeFleetStudio';
import AlloyDbMasteryStudio from './components/AlloyDbMasteryStudio';
import CloudStorageStudio from './components/CloudStorageStudio';
import BigQueryStudio from './components/BigQueryStudio';
import BigLakeIcebergStudio from './components/BigLakeIcebergStudio';
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
import OrbitalControlPlaneDrawer, {
  computeOrbitalTelemetry,
} from './components/OrbitalControlPlaneDrawer';
import InteractiveDocsGuide from './components/InteractiveDocsGuide';
import GlobalNetworkWorldMap from './components/GlobalNetworkWorldMap';
import DataEngineeringStudio from './components/DataEngineeringStudio';
import ManagedSparkStudio from './components/ManagedSparkStudio';
import BillingAccountCreditGuardian, {
  summarizeCreditLedger,
  syncAndAggregateBillingIndexedDb,
} from './components/BillingAccountCreditGuardian';
import GdeStreamerPrivacyShield, {
  loadGdePrivacyConfig,
  redactTextForGdeMode,
} from './components/GdeStreamerPrivacyShield';
import AwsAzureEnvySuiteStudio from './components/AwsAzureEnvySuiteStudio';
import GoogleCloudRemoteMcpStudio from './components/GoogleCloudRemoteMcpStudio';
import LocalCloudEmulatorsStudio from './components/LocalCloudEmulatorsStudio';
import CloudFlightDeckNexusStudio from './components/CloudFlightDeckNexusStudio';
import AutonomousCloudSocStudio from './components/AutonomousCloudSocStudio';
import StudioGcpAdvantageBar from './components/StudioGcpAdvantageBar';
import GlobalInnovationHoverExplainer from './components/InnovationHoverExplainer';
import Startup10xMentorStudio from './components/Startup10xMentorStudio';
import CloudRecycleBinStudio from './components/CloudRecycleBinStudio';
import EnterpriseStackPipelineBar from './components/EnterpriseStackPipelineBar';
import DataLakehouseAiPipelineBar from './components/DataLakehouseAiPipelineBar';
import SecOpsSreForensicsPipelineBar from './components/SecOpsSreForensicsPipelineBar';
import OltpDatabaseContinuityBar from './components/OltpDatabaseContinuityBar';
import FinOpsCostKillPipelineBar from './components/FinOpsCostKillPipelineBar';
import AutonomousFinOpsAutopilotMatrix from './components/AutonomousFinOpsAutopilotMatrix';
import AgenticIncidentCommanderPanel from './components/AgenticIncidentCommanderPanel';
import SovereignComplianceBlueprintCompiler from './components/SovereignComplianceBlueprintCompiler';
import KeynoteAutopilotModal from './components/KeynoteAutopilotModal';
import SccVulnerabilityMissionControl from './components/SccVulnerabilityMissionControl';
import LoggingFinOpsAuditorPanel from './components/LoggingFinOpsAuditorPanel';
import FinOpsZombieExecutorPanel from './components/FinOpsZombieExecutorPanel';
import BigQueryDataLineagePanel from './components/BigQueryDataLineagePanel';
import IamPamGovernancePanel from './components/IamPamGovernancePanel';
import SreSliSloCockpitPanel from './components/SreSliSloCockpitPanel';
import StudioWorkspaceTabs from './components/StudioWorkspaceTabs';
import SpatialOverviewHero from './components/SpatialOverviewHero';
import FloatingSpatialDock from './components/FloatingSpatialDock';
import { classifyDestructiveAxiosConfig } from './utils/destructiveGatekeeper';
import GitOpsReleaseFactoryPipelineBar from './components/GitOpsReleaseFactoryPipelineBar';
import MultiCloudGlobalParityPipelineBar from './components/MultiCloudGlobalParityPipelineBar';

/**
 * Progressive-disclosure wrapper for the 6-Stage Cross-Studio Architecture Pipeline Bars.
 * Keeps focused Studio tabs clean by default (1-line bar) so the Studio workspace itself
 * is immediately front-and-center, while allowing 1-click expansion of the 6-stage chain
 * and Terraform/SOAR/SQL playbook synthesizers.
 */
function CollapsibleArchitecturePipelineBar({
  label = '6-Stage Cross-Studio Architecture Chain',
  chainSummary = 'Click to expand end-to-end 6-stage pipeline & IaC/SOAR playbook synthesizer',
  children,
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-lg border border-zinc-200/70 dark:border-[#1a2130] bg-zinc-50/70 dark:bg-[#0b0f18] px-3 py-1.5 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 truncate">
            {label}
          </span>
          {chainSummary && (
            <span className="hidden xl:inline text-[10.5px] font-mono text-zinc-400 dark:text-[#647087] truncate">
              · {chainSummary}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer inline-flex items-center gap-1 shrink-0 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-[#161e2e] transition-colors"
        >
          <span>{expanded ? 'Hide Chain' : 'Expand Chain'}</span>
          {expanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
        </button>
      </div>
      {expanded && (
        <div className="pt-3 mt-2 border-t border-zinc-200/70 dark:border-[#1e2433] cp-studio-enter">
          {children}
        </div>
      )}
    </div>
  );
}

function CloudPulseCockpit() {
  const { isDark, toggleTheme, mobilePreview, setMobilePreview } = useTheme();
  const {
    activeTimeZone,
    utcOffsetLabel,
    shortTzName,
    liveShortClockText,
    liveDateText,
  } = useTimezone();

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
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [headerToolsExpanded, setHeaderToolsExpanded] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('cloudpulse_rail_collapsed_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [railSearchQuery, setRailSearchQuery] = useState('');
  const railSearchInputRef = useRef(null);
  const [mobileStudioDrawerOpen, setMobileStudioDrawerOpen] = useState(false);
  const [pinnedStudios, setPinnedStudios] = useState(() => {
    const defaults = ['OVERVIEW', 'VM_SSH', 'CLOUD_RUN', 'CLOUD_STORAGE', 'MCP_HUB'];
    try {
      const saved = JSON.parse(
        localStorage.getItem('cloudpulse_pinned_studios_v1') || 'null'
      );
      if (Array.isArray(saved)) return saved;
    } catch {
      // ignore
    }
    return defaults;
  });
  const [collapsedRailGroups, setCollapsedRailGroups] = useState(() => {
    const calmDefaults = {
      INFRA_COMPUTE: true,
      DATA_AI: true,
      SECURITY_SRE: true,
      OPS_DOCS: true,
    };
    try {
      const raw = localStorage.getItem('cloudpulse_collapsed_groups_v2');
      if (!raw) return calmDefaults;
      const saved = JSON.parse(raw);
      return saved && typeof saved === 'object' ? saved : calmDefaults;
    } catch {
      return calmDefaults;
    }
  });

  const handleToggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cloudpulse_rail_collapsed_v1', next ? 'true' : 'false');
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleTogglePinStudio = useCallback((studioId, e) => {
    if (e) e.stopPropagation();
    setPinnedStudios((prev) => {
      const exists = prev.includes(studioId);
      const next = exists ? prev.filter((id) => id !== studioId) : [...prev, studioId];
      try {
        localStorage.setItem('cloudpulse_pinned_studios_v1', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleToggleRailGroup = useCallback((groupId) => {
    setCollapsedRailGroups((prev) => {
      const next = { ...prev, [groupId]: !prev[groupId] };
      try {
        localStorage.setItem('cloudpulse_collapsed_groups_v2', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorBanner, setRawErrorBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [pendingDeleteQueue, setPendingDeleteQueue] = useState([]);
  const [pendingCrossTabNav, setPendingCrossTabNav] = useState(null);
  const toastTimerRef = useRef(null);
  const errorTimerRef = useRef(null);

  const setErrorBanner = useCallback((msg) => {
    if (
      typeof msg === 'string' &&
      (msg.toLowerCase().includes('cancelled') ||
        msg.includes('remains enabled') ||
        msg.includes('__cancelledByUser'))
    ) {
      return;
    }
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
    setRawErrorBanner(msg);
    if (msg) {
      errorTimerRef.current = setTimeout(() => {
        setRawErrorBanner(null);
        errorTimerRef.current = null;
      }, 12000);
    }
  }, []);

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [studioHistory, setStudioHistory] = useState({
    stack: ['OVERVIEW'],
    index: 0,
  });
  const isHistoryNavRef = useRef(false);
  useEffect(() => {
    if (isHistoryNavRef.current) {
      isHistoryNavRef.current = false;
      return;
    }
    setStudioHistory((prev) => {
      if (prev.stack[prev.index] === activeTab) return prev;
      const truncated = prev.stack.slice(0, prev.index + 1);
      const nextStack = [...truncated, activeTab].slice(-24);
      return {
        stack: nextStack,
        index: nextStack.length - 1,
      };
    });
  }, [activeTab]);

  const handleStudioHistoryBack = useCallback(() => {
    setStudioHistory((prev) => {
      if (prev.index <= 0) return prev;
      const nextIndex = prev.index - 1;
      const target = prev.stack[nextIndex];
      if (target) {
        isHistoryNavRef.current = true;
        setActiveTab(target);
      }
      return { ...prev, index: nextIndex };
    });
  }, []);

  const handleStudioHistoryForward = useCallback(() => {
    setStudioHistory((prev) => {
      if (prev.index >= prev.stack.length - 1) return prev;
      const nextIndex = prev.index + 1;
      const target = prev.stack[nextIndex];
      if (target) {
        isHistoryNavRef.current = true;
        setActiveTab(target);
      }
      return { ...prev, index: nextIndex };
    });
  }, []);
  const [activeOrbitalDrawer, setActiveOrbitalDrawer] = useState(null); // null | 'STACK_COMPOSER' | 'FLIGHT_RECORDER' | 'AUTOPILOT_GUARD'
  const [innovationSubTab, setInnovationSubTab] = useState('WAVE11_MOONSHOT');
  const [sovereignSubTab, setSovereignSubTab] = useState('IAM_SURGEON');
  const [awsAzureSubTab, setAwsAzureSubTab] = useState('RESOURCE_GROUPS');
  const [alibabaHuaweiSubTab, setAlibabaHuaweiSubTab] = useState(
    'ALIYUN_PTS_MSE_FLASH_SALE_SURGE'
  );
  const [dataEngineerSubTab, setDataEngineerSubTab] =
    useState('ICEBERG_50_MATRIX');
  const [managedSparkSubTab, setManagedSparkSubTab] =
    useState('SERVERLESS_BATCHES');
  const [localEmulatorsSubTab, setLocalEmulatorsSubTab] =
    useState('FLEET_CONTROL');
  const [cloudNexusSubTab, setCloudNexusSubTab] = useState('TERRAFORM_DRIFT');
  const [vpcSubTab, setVpcSubTab] = useState('');
  const [bigLakeSubTab, setBigLakeSubTab] = useState('METASTORE_CATALOGS');
  const [alloyDbSubTab, setAlloyDbSubTab] = useState('EXPRESS_QUICKSTART');
  const [wave9SubTab, setWave9SubTab] = useState('CLOUD_BUILD_GITHUB');
  const [storageSubTab, setStorageSubTab] = useState('BUCKETS');
  const [storageTargetBucket, setStorageTargetBucket] = useState('');
  const [storageTargetObject, setStorageTargetObject] = useState('');
  const [recycleBinCategory, setRecycleBinCategory] = useState('ALL');
  const [bigQuerySubTab, setBigQuerySubTab] = useState('TABLES_SQL');
  const [sreSubTab, setSreSubTab] = useState('SLO_BURN_AND_RCA');
  const [finopsSubTab, setFinopsSubTab] = useState('BILLING_CREDITS');
  const [gkeSubTab, setGkeSubTab] = useState('FLEET_DEPLOY');
  const [functionsSubTab, setFunctionsSubTab] = useState('TRIGGER_WIZARD');
  const [studioSubTabNonce, setStudioSubTabNonce] = useState(0);
  const [bigQuerySqlNonce, setBigQuerySqlNonce] = useState(0);

  // Universal Cross-UI Feature Spotlight & Return Breadcrumb State (Prevents getting lost after clicking deep-links across Studios)
  const [featureSpotlightEnabled, setFeatureSpotlightEnabled] = useState(() => {
    try {
      return localStorage.getItem('cloudpulse_feature_spotlight_v1') !== 'false';
    } catch {
      return true;
    }
  });
  const [activeSpotlightBanner, setActiveSpotlightBanner] = useState(null);
  const spotlightCleanupTimerRef = useRef(null);
  const spotlightBannerTimerRef = useRef(null);
  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const STUDIO_DISPLAY_NAMES = {
    OVERVIEW: 'Project Overview & Control Center',
    GLOBAL_MAP: '40-Region Global Subsea Map',
    INNOVATION_LAB: '2026 Innovation Lab (16 Studios)',
    STARTUP_10X: 'Startup 10X Mentor Studio',
    MCP_HUB: 'Google Cloud Remote MCP Hub',
    LOCAL_EMULATORS: 'Local Cloud Emulators Studio',
    CLOUD_NEXUS: 'Terraform & Vertex Eval (Flight-Deck Nexus) Studio',
    CLOUD_STORAGE: 'Cloud Storage & WORM Studio',
    BIGQUERY_STUDIO: 'BigQuery Lakehouse Studio',
    BIGLAKE_STUDIO: 'BigLake & Apache Iceberg Studio',
    DATA_ENGINEER_STUDIO: 'Data Engineering & Medallion Studio',
    MANAGED_SPARK_STUDIO: 'Managed Service for Apache Spark & Serverless Studio',
    CLOUD_SQL_STUDIO: 'Cloud SQL & AlloyDB Studio',
    ALLOYDB_STUDIO: 'AlloyDB Mastery & Express Studio',
    WAVE9_STUDIO: 'Cloud Build & Supply Chain Studio',
    WAVE10_FRONTIER: 'Cloud Spanner Graph & Frontier DB Studio',
    SOVEREIGN_STUDIO: 'IAM, KMS & Time-Machine Studio',
    SRE_WAR_ROOM: 'SRE Incident War-Room & Perimeter Studio',
    CLOUD_RUN: 'Cloud Run Serverless Fleet Studio',
    FUNCTIONS_STUDIO: 'Cloud Functions Gen2 & Eventarc Studio',
    GKE_STUDIO: 'GKE Autopilot & Kubernetes Studio',
    VM_SSH: 'Compute Engine VM Fleet & Browser SSH',
    VPC_NETWORKS: 'VPC Networks & Firewall Rules Studio',
    FINOPS: 'FinOps, Billing & Zombie Reaper Studio',
    LOGS_SHELL: 'Neural Chrono-Logs & Cloud Shell Studio',
    RECYCLE_BIN: '30-Day Cloud Recycle Bin & Recovery Vault',
    AWS_AZURE_PARITY: 'AWS & Azure Enterprise Parity Studio',
    ALIBABA_HUAWEI_PARITY: 'Alibaba & Huawei Hyperscale Parity Studio',
    CLOUD_SOC: 'Autonomous Cloud SOC & SOAR War-Room',
    DOCS_GUIDE: 'Interactive Architecture & API Guide',
  };

  const SUBTAB_DISPLAY_LABELS = {
    BUCKETS: 'Bucket Governance (M01)',
    OBJECTS: 'Object Workbench (M02)',
    OBJECT_WORKBENCH: 'Object Workbench (M02)',
    S3_COMPATIBLE_IMPORT: 'S3 / MinIO / Ceph Importer (M03)',
    FINOPS_LIFECYCLE: '4-Tier Lifecycle FinOps (M04)',
    WORM_LOCK: 'SEC 17a-4 WORM Lock (M05)',
    DLP_XRAY: 'RAM DLP Secret & PII X-Ray (M06)',
    RAM_DLP: 'RAM DLP Secret & PII X-Ray (M06)',
    DATASETS: 'Dataset Fleet & Compliance Hardener',
    TABLES_SQL: 'SQL Pre-Crime X-Ray & Optimizer',
    LIVE_JOBS: 'Live Jobs & Slot Telemetry (jobs.list)',
    FINOPS_CRYSTAL: 'Slot FinOps & Capacitor 5:1 Simulator',
    TIME_TRAVEL: 'FOR SYSTEM_TIME AS OF 7-Day Time-Machine',
    TIMETRAVEL_LINEAGE: 'FOR SYSTEM_TIME AS OF 7-Day Time-Machine',
    AI_VECTOR_STREAMING: 'BigQuery AI, ScaNN Vectors & Continuous SQL',
    LINEAGE_BLAST_RADIUS: 'Data Lineage Blast-Radius & Partition Surgeon',
    LINEAGE_FINOPS: 'Data Lineage Blast-Radius & Partition Surgeon',
    METASTORE_CATALOGS: 'BigLake Metastore & Iceberg Catalogs',
    ICEBERG_50_MATRIX: '50-Feature Lakehouse Matrix',
    COMPACTION_DOCTOR: 'Iceberg Small-File Compaction Doctor',
    DATABRICKS_UNITY_BRIDGE: 'Federated Databricks Unity & AWS Glue Bridge',
    MEDALLION_ELT: 'Bronze-Silver-Gold Medallion ELT',
    DATA_FABRIC_MESH: 'Live 6-Engine Data Fabric Mesh & Cross-Studio Bridge',
    BQ_PROPERTY_GRAPH: 'BigQuery Property Graph (GoogleSQL GQL) Workbench',
    SCHEMA_CONTRACTS: 'Live Schema Contracts & Drift Firewall',
    SERVERLESS_SPARK: 'Serverless Spark Pipeline Builder',
    SERVERLESS_BATCHES: 'Serverless Spark 3.5 Batches',
    SPARK_CONNECT_NOTEBOOKS: 'Spark Connect & PySpark IDE',
    DIAGNOSTICS_RCA: 'SparkApplications 3-Pillar RCA & Logs',
    KNOWLEDGE_LINEAGE_BIGFRAMES: 'Lightning Engine, BigFrames v2 & Lineage',
    EXPRESS_QUICKSTART: 'AlloyDB Express (PG 18) & Live Fleet',
    ZERO_LOCKIN_PGLOGICAL: 'Zero Lock-in (pglogical, 100% Compat & Omni)',
    SCANN_VECTOR_RAG: 'SCaNN Vector Performance & Production RAG',
    BEYOND_AURORA_AGENTS: 'Beyond Aurora: AI Agents & Columnar HTAP',
    LIVE_SQL_AND_OMNI: 'Live psql SQL Runner & Local Omni Docker',
    PLAYBOOK_MATRIX: '10-Topic AlloyDB Field Playbook Matrix',
    FLEET_CONTROL: 'Emulator Fleet & Host Readiness',
    LIVE_WORKBENCH: 'Interactive Local REST Workbench',
    CLOUD_SCHEMA_SYNC: 'Cloud-to-Local $0.00 Twin Sync',
    ENV_AND_LOGS: '*_EMULATOR_HOST Exporter & Live Process Logs',
    TERRAFORM_DRIFT: 'Cloud-to-Terraform Reverse-Compiler & Drift Time-Machine',
    BLAST_RADIUS: 'Blast-Radius Graph & VPC Packet-Path X-Ray',
    VERTEX_ARENA: 'Vertex AI Multi-Model Arena & LLM Judge',
    FLIGHT_RECORDER: 'Causal Flight-Recorder & Canary Rehearsal',
    GPU_QUOTA_RADAR: 'Cloud Quota & GPU Capacity Radar',
    CAUSAL_FLIGHT_RECORDER: 'Causal Flight-Recorder & Audit-to-Error Correlator',
    WIF_KEYLESS: 'Keyless Workload Identity Federation & OIDC YAML',
    CLOUD_DNS_TLS: 'Cloud DNS, Certs & Multi-Resolver X-Ray',
    PUBSUB_TIMEMACHINE: 'Pub/Sub DLQ Peek & Seek Time-Machine',
    IAM_SURGEON: 'Autonomous IAM Least-Privilege Surgeon',
    TIME_MACHINE: 'IAM Policy Time-Machine & Drift Rollback',
    SECRETS_KMS_WAF: 'Secret Manager Lifecycle & KMS Vault',
    SLO_BURN_AND_RCA: '14.4x SLO Burn Gate & Change Correlator',
    TOXIC_GRAPH: 'Toxic Combination Attack Graph & SOAR',
    FLEET_DEPLOY: 'GKE Autopilot & Spot GPU Fleet',
    COMPUTECLASS_GATEWAY_2027: 'GKE ComputeClass & Gateway API Mesh',
    EVENTARC_BUS_3ENGINE_2027: 'Eventarc Advanced Bus & 3-Engine Router',
    TRIGGER_WIZARD: 'Eventarc 130+ Service Trigger Wizard',
    CLOUD_BUILD_GITHUB: 'GitHub OIDC & SLSA-3 Cloud Build',
    SUPPLY_CHAIN_AR: 'Artifact Registry & SLSA-3 Supply Chain',
    CLOUDRUN_TO_GKE: 'Cloud Run to GKE Autopilot Graduator',
    DEAD_ARTIFACTS: 'Stale Revision & Container ImageSweeper',
    WORKER_POOLS: 'Cloud Run Pull-Based Worker Pools',
    EVENTBRIDGE_PIPES: 'EventBridge Pipes vs Eventarc Parity',
    ALIYUN_PTS_MSE_FLASH_SALE_SURGE: 'Flash-Sale Surge & MSE Traffic Parity',
    TOPOLOGY: 'App Hub & 4-Layer Cloud Topology Studio',
    TERRAFORM: 'Reverse-Terraform .tf Exporter',
    BENCHMARK: 'Cross-Cloud Latency & Throughput Benchmark',
    FINOPS_SLEEP: 'Dev/Staging Night & Weekend Sleep Scheduler',
    FIVE_PERSONA_COUNCIL: '10-Persona Enterprise Launch Council',
    GCLOUD_ALPHA_BETA: 'Google Cloud SDK Frontier & Alpha/Beta Lab',
    QUANTUM_NEXUS: 'Post-Quantum KMS & Sovereign Nexus',
    SECURITY: 'Zero-Trust Perimeter & Ransomware X-Ray',
    TELEPORT_DIFF: 'Cross-Region Config & Drift Diff',
    ZOMBIES: 'Idle Compute & Unattached Disk Sweeper',
    WAVE11_MOONSHOT: 'Wave 11 Moonshot Engineering Lab',
    WAVE12_ROADSTER: 'Roadster Flight Deck & Sub-ms Telemetry',
    WAVE13_STARLINK_NEURALINK: 'Edge LEO & Neural Telemetry Bridge',
    WAVE14_QUANTUM_DOCTOR: 'Quantum Time-Travel & Incident Doctor',
    WAVE15_DYSON_MOONSHOT: 'Supply Chain, Logging & TLS Inspector',
    WAVE16_ENTERPRISE_MOONSHOT: 'Enterprise FinOps, DR GameDay & SQL Surgeon',
    ALL: 'All Recoverable Resources',
    CLOUD_RUN: 'Soft-Deleted Cloud Run Services',
    COMPUTE_VM: 'Stopped / Terminated GCE VMs',
    DISABLED_API: 'Recently Disabled GCP APIs',
    VPC_FIREWALL: 'Archived VPC Firewall Rules',
  };

  const activeSubTabsRef = useRef({});
  useEffect(() => {
    activeSubTabsRef.current = {
      CLOUD_STORAGE: storageSubTab,
      BIGQUERY_STUDIO: bigQuerySubTab,
      BIGLAKE_STUDIO: bigLakeSubTab,
      ALLOYDB_STUDIO: alloyDbSubTab,
      DATA_ENGINEER_STUDIO: dataEngineerSubTab,
      MANAGED_SPARK_STUDIO: managedSparkSubTab,
      LOCAL_EMULATORS: localEmulatorsSubTab,
      CLOUD_NEXUS: cloudNexusSubTab,
      VPC_NETWORKS: vpcSubTab,
      SOVEREIGN_STUDIO: sovereignSubTab,
      INNOVATION_LAB: innovationSubTab,
      SRE_WAR_ROOM: sreSubTab,
      GKE_STUDIO: gkeSubTab,
      FUNCTIONS_STUDIO: functionsSubTab,
      WAVE9_STUDIO: wave9SubTab,
      AWS_AZURE_PARITY: awsAzureSubTab,
      ALIBABA_HUAWEI_PARITY: alibabaHuaweiSubTab,
      RECYCLE_BIN: recycleBinCategory,
    };
  }, [
    storageSubTab,
    bigQuerySubTab,
    bigLakeSubTab,
    alloyDbSubTab,
    dataEngineerSubTab,
    managedSparkSubTab,
    localEmulatorsSubTab,
    cloudNexusSubTab,
    vpcSubTab,
    sovereignSubTab,
    innovationSubTab,
    sreSubTab,
    gkeSubTab,
    functionsSubTab,
    wave9SubTab,
    awsAzureSubTab,
    alibabaHuaweiSubTab,
    recycleBinCategory,
  ]);

  const resolveActiveSubTabLabel = useCallback((tabId) => {
    const subId = activeSubTabsRef.current?.[tabId];
    if (!subId) return null;
    if (tabId === 'BIGQUERY_STUDIO' && subId === 'TIME_MACHINE') {
      return 'FOR SYSTEM_TIME AS OF 7-Day Time-Machine';
    }
    return SUBTAB_DISPLAY_LABELS[subId] || subId;
  }, []);

  const pulseSpotlightTargetDom = useCallback((spec = {}) => {
    const clearExistingHighlight = () => {
      document
        .querySelectorAll('.cloudpulse-target-spotlight-active, .cloudpulse-nav-spotlight-active')
        .forEach((el) => {
          el.classList.remove(
            'cloudpulse-target-spotlight-active',
            'cloudpulse-nav-spotlight-active'
          );
          el.removeAttribute('data-spotlight-badge');
        });
    };

    const runLocateAndHighlight = (shouldScroll = true) => {
      clearExistingHighlight();
      const targetTab = spec.targetTab || activeTabRef.current;
      const badgeLabel =
        spec.badgeText ||
        spec.targetSubTab ||
        spec.ruleName ||
        spec.targetLabel ||
        STUDIO_DISPLAY_NAMES[targetTab] ||
        targetTab;

      // 1. Highlight left rail / top navigation tab button (or top-bar shortcut button)
      const navBtn = document.querySelector(
        `aside button[data-feature-id="${targetTab}"], nav button[data-feature-id="${targetTab}"], header button[data-feature-id="${targetTab}"]`
      );
      if (navBtn) {
        navBtn.classList.add('cloudpulse-nav-spotlight-active');
      }

      // 2. Locate the primary Studio root element below the Pipeline Bar
      const mainEl = document.getElementById('cloudpulse-main-workspace');
      let studioRoot = null;
      let studioChildren = [];
      if (mainEl) {
        studioChildren = Array.from(
          mainEl.querySelectorAll(
            ':scope > div.space-y-4 > *, :scope > div.space-y-6 > *'
          )
        );
        if (targetTab === 'OVERVIEW') {
          // In OVERVIEW: [0]=SortableKpiRow, [1]=EnterpriseStackPipelineBar, [2]=ResourceControlCenter, [3]=5-Domain Hub
          studioRoot = studioChildren[2] || studioChildren[0] || null;
        } else if (studioChildren.length >= 2) {
          studioRoot = studioChildren[1];
        } else if (studioChildren.length === 1) {
          studioRoot = studioChildren[0];
        } else {
          studioRoot = mainEl.querySelector(':scope > div:not([data-spotlight-breadcrumb])');
        }
      }

      // 3. Highlight active in-Studio Sub-Tab / Pillar / Module button if present
      if (studioRoot) {
        let activeSubBtn = null;
        if (spec.targetSubTab) {
          activeSubBtn = studioRoot.querySelector(
            `button[data-soc-pillar="${spec.targetSubTab}"], button[data-subtab-id="${spec.targetSubTab}"], button[data-feature-id*="${spec.targetSubTab}"]`
          );
        }
        if (!activeSubBtn && spec.sqlSeeded && targetTab === 'BIGQUERY_STUDIO') {
          activeSubBtn = studioRoot.querySelector('button[data-feature-id="BQ_TAB_TABLES_SQL"]');
        }
        if (!activeSubBtn) {
          // Auto-detect active sub-tab button inside the Studio header or sub-tab navigation grid
          const topCandidates = [
            studioRoot.children?.[0],
            studioRoot.children?.[1],
          ].filter(Boolean);
          for (const container of topCandidates) {
            const buttons = Array.from(container.querySelectorAll('button'));
            const found = buttons.find((btn) => {
              const cls = String(btn.className || '');
              const parentBtns = btn.parentElement?.querySelectorAll(':scope > button')?.length || 0;
              if (parentBtns < 2) return false;
              return (
                (cls.includes('bg-blue-600') && cls.includes('text-white')) ||
                (cls.includes('bg-indigo-600') && cls.includes('text-white')) ||
                (cls.includes('bg-emerald-600') && cls.includes('text-white')) ||
                (cls.includes('bg-rose-600') && cls.includes('text-white')) ||
                (cls.includes('bg-amber-600') && cls.includes('text-white')) ||
                (cls.includes('bg-purple-600') && cls.includes('text-white')) ||
                (cls.includes('bg-teal-600') && cls.includes('text-white')) ||
                cls.includes('ring-2')
              );
            });
            if (found) {
              activeSubBtn = found;
              break;
            }
          }
        }
        if (activeSubBtn) {
          activeSubBtn.classList.add('cloudpulse-nav-spotlight-active');
        }
      }

      // 4. Locate exact target container or focused feature card inside the destination Studio
      let targetEl = null;
      if (spec.targetElementId) {
        targetEl = document.getElementById(spec.targetElementId);
      }
      if (!targetEl && targetTab === 'CLOUD_SOC') {
        targetEl = document.getElementById('soc-active-pillar-panel');
      }
      if (!targetEl && targetTab === 'GLOBAL_MAP' && spec.isXRay) {
        targetEl = document.getElementById('global-map-xray-dock');
      }
      if (!targetEl && targetTab === 'VPC_NETWORKS') {
        if (spec.ruleName) {
          targetEl = document.getElementById(`vpc-fw-card-${spec.ruleName}`);
        }
        if (!targetEl) {
          targetEl = document.getElementById('live-vpc-firewall-rules-section');
        }
      }
      if (!targetEl && targetTab === 'BIGQUERY_STUDIO' && spec.sqlSeeded) {
        targetEl = document.getElementById('bigquery-sql-workbench-card');
        if (!targetEl && studioRoot) {
          const sqlTextarea = studioRoot.querySelector('textarea');
          if (sqlTextarea) {
            targetEl = sqlTextarea.closest('.rounded-2xl, .rounded-xl') || sqlTextarea.parentElement;
          }
        }
      }
      if (!targetEl && targetTab === 'LOGS_SHELL') {
        targetEl = document.getElementById(
          spec.isShellCommand ? 'cloud-shell-terminal-card' : 'chrono-logs-explorer-card'
        );
      }
      if (!targetEl && targetTab === 'FINOPS') {
        targetEl = document.getElementById('finops-billing-guardian-section');
      }

      // 5. Universal Smart Studio Panel Resolver (Never highlight a giant 3,000px+ outer wrapper!)
      if (!targetEl && studioRoot) {
        const visibleKids = Array.from(studioRoot.children || []).filter(
          (el) => el.getBoundingClientRect().height > 24
        );
        if (visibleKids.length >= 3) {
          // Only skip visibleKids[1] if visibleKids[1] is genuinely a compact sub-tab selector bar
          // (and NOT a substantive studio panel with forms, code blocks, or tables)
          const secondKidButtons = visibleKids[1].querySelectorAll('button').length;
          const secondKidHeight = visibleKids[1].getBoundingClientRect().height;
          const secondKidHasFormOrCode = Boolean(
            visibleKids[1].querySelector('input, select, textarea, table, pre')
          );
          if (
            secondKidButtons >= 3 &&
            secondKidHeight < 320 &&
            !secondKidHasFormOrCode
          ) {
            targetEl = visibleKids[2];
          } else {
            targetEl = visibleKids[1];
          }
        } else if (visibleKids.length === 2) {
          // visibleKids[0] is Studio Header + Sub-Tab Bar; visibleKids[1] is the active feature panel
          targetEl = visibleKids[1];
          if (!spec.targetSubTab) {
            visibleKids[0].classList.add('cloudpulse-nav-spotlight-active');
          }
        } else if (visibleKids.length === 1) {
          targetEl = visibleKids[0];
        } else {
          targetEl = studioRoot;
        }

        // Drill-down guardrail: if the selected panel is still a multi-section wrapper taller than 1,500px,
        // focus its first substantive feature card so the border + floating badge are 100% visible in the viewport.
        let drillCount = 0;
        while (
          targetEl &&
          drillCount < 2 &&
          targetEl.getBoundingClientRect().height > 1500 &&
          targetEl.children &&
          targetEl.children.length >= 1
        ) {
          const substantiveChild = Array.from(targetEl.children).find(
            (c) => c.getBoundingClientRect().height > 90
          );
          if (!substantiveChild) break;
          targetEl = substantiveChild;
          drillCount += 1;
        }
      }

      if (targetEl) {
        targetEl.setAttribute(
          'data-spotlight-badge',
          `SPOTLIGHT TARGET — ${String(badgeLabel).slice(0, 52)}`
        );
        targetEl.classList.add('cloudpulse-target-spotlight-active');
        if (shouldScroll) {
          const rect = targetEl.getBoundingClientRect();
          const isTallPanel = rect.height > window.innerHeight * 0.65;
          const isAlreadyVisibleNearTop =
            rect.top >= 56 && rect.top <= window.innerHeight * 0.55;
          if (!isAlreadyVisibleNearTop) {
            targetEl.scrollIntoView({
              behavior: 'smooth',
              block:
                !isTallPanel &&
                !spec.isShellCommand &&
                (spec.targetElementId ||
                  spec.ruleName ||
                  spec.isXRay ||
                  spec.sqlSeeded)
                  ? 'center'
                  : 'start',
            });
          }
        }
      }

      if (spotlightCleanupTimerRef.current) {
        clearTimeout(spotlightCleanupTimerRef.current);
      }
      spotlightCleanupTimerRef.current = setTimeout(() => {
        clearExistingHighlight();
      }, 6500);
    };

    setTimeout(() => runLocateAndHighlight(true), 140);
    setTimeout(() => runLocateAndHighlight(false), 500);
  }, []);

  const triggerCrossUiSpotlight = useCallback(
    (spec = {}) => {
      let enabled = true;
      try {
        enabled =
          localStorage.getItem('cloudpulse_feature_spotlight_v1') !== 'false';
      } catch {
        enabled = true;
      }
      if (!enabled) return;

      const fromTab = spec.fromTab || activeTabRef.current;
      const targetTab = spec.targetTab || activeTabRef.current;
      const studioTitle = STUDIO_DISPLAY_NAMES[targetTab] || targetTab;
      const bannerPayload = {
        fromTab,
        targetTab,
        targetSubTab: spec.targetSubTab || null,
        targetElementId: spec.targetElementId || null,
        ruleName: spec.ruleName || null,
        isXRay: Boolean(spec.isXRay),
        sqlSeeded: Boolean(spec.sqlSeeded),
        isShellCommand: Boolean(spec.isShellCommand),
        targetLabel:
          spec.targetLabel ||
          (spec.targetSubTab
            ? `${studioTitle} → ${spec.targetSubTab}`
            : studioTitle),
        badgeText:
          spec.badgeText ||
          spec.targetSubTab ||
          spec.ruleName ||
          spec.targetLabel ||
          studioTitle,
        triggeredAt: Date.now(),
      };
      setActiveSpotlightBanner((prev) => ({
        ...bannerPayload,
        fromTab:
          fromTab === targetTab && prev?.fromTab && prev.fromTab !== targetTab
            ? prev.fromTab
            : fromTab,
      }));
      pulseSpotlightTargetDom(bannerPayload);

      if (spotlightBannerTimerRef.current) {
        clearTimeout(spotlightBannerTimerRef.current);
      }
      spotlightBannerTimerRef.current = setTimeout(() => {
        setActiveSpotlightBanner(null);
      }, 10000);
    },
    [pulseSpotlightTargetDom]
  );

  const executeOpenBigQuerySql = useCallback(
    (sqlText, contextLabel = 'SQL Query Workbench & Optimizer') => {
      const prevTab = activeTabRef.current;
      if (sqlText) {
        setBigQueryInitialSql(sqlText);
        setBigQuerySqlNonce((n) => n + 1);
      }
      setBigQuerySubTab('TABLES_SQL');
      setStudioSubTabNonce((n) => n + 1);
      setActiveTab('BIGQUERY_STUDIO');
      triggerCrossUiSpotlight({
        fromTab: prevTab,
        targetTab: 'BIGQUERY_STUDIO',
        sqlSeeded: true,
        targetElementId: 'bigquery-sql-workbench-card',
        targetLabel: `BigQuery Studio → ${contextLabel}`,
        badgeText: 'SQL Loaded in Query Workbench',
      });
    },
    [triggerCrossUiSpotlight]
  );

  const handleOpenBigQuerySql = useCallback(
    (sqlText, contextLabel = 'SQL Query Workbench & Optimizer', options = {}) => {
      const prevTab = activeTabRef.current;
      const prevSubLabel = resolveActiveSubTabLabel(prevTab);
      if (
        options?.skipConfirm ||
        (prevTab === 'BIGQUERY_STUDIO' &&
          activeSubTabsRef.current?.BIGQUERY_STUDIO === 'TABLES_SQL')
      ) {
        executeOpenBigQuerySql(sqlText, contextLabel);
        return;
      }
      setPendingCrossTabNav({
        fromStudioTitle: STUDIO_DISPLAY_NAMES[prevTab] || prevTab,
        fromSubTabTitle: prevSubLabel,
        toStudioTitle: STUDIO_DISPLAY_NAMES.BIGQUERY_STUDIO,
        toSubTabTitle: contextLabel || 'SQL Query Workbench & Optimizer',
        actionLabel: 'Open Target in BigQuery SQL Studio',
        targetResourceLabel: 'Pre-Seeded BigQuery SQL Query',
        payloadPreview: sqlText ? String(sqlText).trim().slice(0, 260) : null,
        hasUnsavedWarning: Boolean(options?.hasUnsavedWarning),
        onConfirm: () => executeOpenBigQuerySql(sqlText, contextLabel),
      });
    },
    [executeOpenBigQuerySql, resolveActiveSubTabLabel]
  );

  const executeScrollToApisWithSpotlight = useCallback(() => {
    const prevTab = activeTabRef.current;
    if (prevTab !== 'OVERVIEW') {
      setActiveTab('OVERVIEW');
    }
    triggerCrossUiSpotlight({
      fromTab: prevTab,
      targetTab: 'OVERVIEW',
      targetElementId: 'emergency-api-killswitch-section',
      targetLabel: 'Project Overview → Emergency Paid API Kill-Switch',
      badgeText: 'Emergency Paid API Kill-Switch',
    });
  }, [triggerCrossUiSpotlight]);

  const handleScrollToApisWithSpotlight = useCallback(
    (options = {}) => {
      const prevTab = activeTabRef.current;
      if (options?.skipConfirm || prevTab === 'OVERVIEW') {
        executeScrollToApisWithSpotlight();
        return;
      }
      setPendingCrossTabNav({
        fromStudioTitle: STUDIO_DISPLAY_NAMES[prevTab] || prevTab,
        fromSubTabTitle: resolveActiveSubTabLabel(prevTab),
        toStudioTitle: STUDIO_DISPLAY_NAMES.OVERVIEW,
        toSubTabTitle: 'Emergency Paid API Kill-Switch',
        actionLabel: 'Open Emergency Paid API Kill-Switch',
        targetResourceLabel: 'Project Paid API Governance',
        payloadPreview: null,
        onConfirm: () => executeScrollToApisWithSpotlight(),
      });
    },
    [executeScrollToApisWithSpotlight, resolveActiveSubTabLabel]
  );

  const resolveNavigationTargetMeta = useCallback((tabId, subTab, extraTarget = null) => {
    if (tabId === 'TIME_MACHINE') {
      return {
        normalizedTab: 'SOVEREIGN_STUDIO',
        resolvedSubTab: 'TIME_MACHINE',
        toStudioTitle: STUDIO_DISPLAY_NAMES.SOVEREIGN_STUDIO,
        toSubTabTitle: SUBTAB_DISPLAY_LABELS.TIME_MACHINE,
      };
    }
    if (tabId === 'ZOMBIE_HUNTER') {
      return {
        normalizedTab: 'FINOPS',
        resolvedSubTab: 'ZOMBIE_HUNTER',
        toStudioTitle: STUDIO_DISPLAY_NAMES.FINOPS,
        toSubTabTitle: 'Idle VM & Zombie Resource Reaper',
      };
    }
    if (tabId === 'SECRETS_KMS') {
      return {
        normalizedTab: 'SOVEREIGN_STUDIO',
        resolvedSubTab: 'SECRETS_KMS_WAF',
        toStudioTitle: STUDIO_DISPLAY_NAMES.SOVEREIGN_STUDIO,
        toSubTabTitle: SUBTAB_DISPLAY_LABELS.SECRETS_KMS_WAF,
      };
    }
    if (tabId === 'IAM_SURGEON') {
      return {
        normalizedTab: 'SOVEREIGN_STUDIO',
        resolvedSubTab: 'IAM_SURGEON',
        toStudioTitle: STUDIO_DISPLAY_NAMES.SOVEREIGN_STUDIO,
        toSubTabTitle: SUBTAB_DISPLAY_LABELS.IAM_SURGEON,
      };
    }
    const innovationSubTabAliases = {
      APPHUB_GDC: 'TOPOLOGY',
      APP_TOPOLOGY: 'TOPOLOGY',
      DESIGN_CENTER: 'TOPOLOGY',
      TOPOLOGY: 'TOPOLOGY',
      WAVE11_MOONSHOT: 'WAVE11_MOONSHOT',
      WAVE12_ROADSTER: 'WAVE12_ROADSTER',
      WAVE13_STARLINK_NEURALINK: 'WAVE13_STARLINK_NEURALINK',
      WAVE14_QUANTUM_DOCTOR: 'WAVE14_QUANTUM_DOCTOR',
      WAVE15_DYSON_MOONSHOT: 'WAVE15_DYSON_MOONSHOT',
      WAVE16_ENTERPRISE_MOONSHOT: 'WAVE16_ENTERPRISE_MOONSHOT',
      FIVE_PERSONA_COUNCIL: 'FIVE_PERSONA_COUNCIL',
      GCLOUD_ALPHA_BETA: 'GCLOUD_ALPHA_BETA',
      QUANTUM_NEXUS: 'QUANTUM_NEXUS',
      FINOPS_SLEEP: 'FINOPS_SLEEP',
      TELEPORT_DIFF: 'TELEPORT_DIFF',
      X3: 'X3',
      BENCHMARK: 'BENCHMARK',
      DREAM_BRAIN: 'DREAM_BRAIN',
      TERRAFORM: 'TERRAFORM',
      REVERSE_TERRAFORM: 'TERRAFORM',
    };
    const isDirectPersonaSubTab = String(tabId || '').startsWith('FIVE_PERSONA_');
    const isDirectInnovationSubTab =
      Boolean(innovationSubTabAliases[tabId]) || isDirectPersonaSubTab;
    // Wave 27: legacy CLOUD_OPS_FRONTIER / Nexus pillar aliases redirect to each pillar's canonical studio
    const OPS_PILLAR_REDIRECTS = {
      QUOTA_RADAR: ['SRE_WAR_ROOM', 'GPU_QUOTA_RADAR'],
      FLIGHT_RECORDER: ['SRE_WAR_ROOM', 'CAUSAL_FLIGHT_RECORDER'],
      WIF_KEYLESS: ['SOVEREIGN_STUDIO', 'WIF_KEYLESS'],
      PUBSUB_TIMEMACHINE: ['FUNCTIONS_STUDIO', 'PUBSUB_TIMEMACHINE'],
      BLAST_RADIUS: ['VPC_NETWORKS', 'BLAST_RADIUS'],
      CLOUD_DNS_TLS: ['VPC_NETWORKS', 'CLOUD_DNS_TLS'],
    };
    const opsPillarKey =
      tabId === 'OPS_FRONTIER' || tabId === 'CLOUD_OPS_FRONTIER'
        ? OPS_PILLAR_REDIRECTS[subTab]
          ? subTab
          : 'QUOTA_RADAR'
        : tabId === 'WIF_STUDIO'
        ? 'WIF_KEYLESS'
        : (tabId === 'CLOUD_NEXUS' || tabId === 'NEXUS' || tabId === 'FLIGHT_DECK' || tabId === 'CLOUD_FLIGHT_DECK') &&
          OPS_PILLAR_REDIRECTS[subTab]
        ? subTab
        : OPS_PILLAR_REDIRECTS[tabId]
        ? tabId
        : null;
    const opsPillarRedirect = opsPillarKey ? OPS_PILLAR_REDIRECTS[opsPillarKey] : null;
    const rawResolvedSubTab = opsPillarRedirect
      ? opsPillarRedirect[1]
      : isDirectInnovationSubTab
      ? subTab || innovationSubTabAliases[tabId] || tabId
      : tabId === 'BIGLAKE_ICEBERG'
      ? subTab || 'METASTORE_CATALOGS'
      : tabId === 'DATA_PIPELINES'
      ? subTab || 'MEDALLION_ELT'
      : subTab;

    const rawNormalizedTab = opsPillarRedirect
      ? opsPillarRedirect[0]
      : isDirectInnovationSubTab
      ? 'INNOVATION_LAB'
      : tabId === 'DATA_ENGINEER' || tabId === 'DATA_PIPELINES'
      ? 'DATA_ENGINEER_STUDIO'
      : tabId === 'MANAGED_SPARK' || tabId === 'SPARK' || tabId === 'DATAPROC_SPARK'
      ? 'MANAGED_SPARK_STUDIO'
      : tabId === 'BIGQUERY' || tabId === 'BIGQUERY_LAKEHOUSE'
      ? 'BIGQUERY_STUDIO'
      : tabId === 'BIGLAKE' || tabId === 'BIGLAKE_ICEBERG'
      ? 'BIGLAKE_STUDIO'
      : tabId === 'CLOUD_SQL'
      ? 'CLOUD_SQL_STUDIO'
      : tabId === 'ALLOYDB' || tabId === 'ALLOYDB_EXPRESS' || tabId === 'ALLOYDB_MASTERY'
      ? 'ALLOYDB_STUDIO'
      : tabId === 'SPANNER' || tabId === 'WAVE10_STUDIO'
      ? 'WAVE10_FRONTIER'
      : tabId === 'VPC_FIREWALL' || tabId === 'VPC' || tabId === 'NETWORK_VPC_FIREWALL'
      ? 'VPC_NETWORKS'
      : tabId === 'VM_FLEET' ||
        tabId === 'VMS' ||
        tabId === 'COMPUTE_VM_FLEET' ||
        tabId === 'VM_FLEET_SSH'
      ? 'VM_SSH'
      : tabId === 'STORAGE' || tabId === 'CLOUD_STORAGE_BUCKETS'
      ? 'CLOUD_STORAGE'
      : tabId === 'SOVEREIGN_IAM' || tabId === 'IAM_SECURITY'
      ? 'SOVEREIGN_STUDIO'
      : tabId === 'BILLING_GUARDIAN' ||
        tabId === 'BILLING_CREDITS' ||
        tabId === 'FINOPS_BILLING_RADAR' ||
        tabId === 'BILLING_APIS'
      ? 'FINOPS'
      : tabId === 'CLOUD_RUN_FLEET'
      ? 'CLOUD_RUN'
      : tabId === 'VERTEX_AI' || tabId === 'VERTEX_AI_STUDIO' || tabId === 'CLOUD_BUILD'
      ? 'WAVE9_STUDIO'
      : tabId === 'CLOUD_FUNCTIONS' || tabId === 'FUNCTIONS'
      ? 'FUNCTIONS_STUDIO'
      : tabId === 'GKE_KUBERNETES'
      ? 'GKE_STUDIO'
      : tabId === 'REMOTE_MCP' || tabId === 'MCP_SERVERS' || tabId === 'AGENT_MCP'
      ? 'MCP_HUB'
      : tabId === 'EMULATORS' ||
        tabId === 'CLOUD_EMULATORS' ||
        tabId === 'LOCAL_CLOUD_EMULATORS'
      ? 'LOCAL_EMULATORS'
      : tabId === 'NEXUS' || tabId === 'FLIGHT_DECK' || tabId === 'CLOUD_FLIGHT_DECK'
      ? 'CLOUD_NEXUS'
      : tabId;

    const VALID_TOP_LEVEL_TABS = new Set([
      'OVERVIEW',
      'INNOVATION_LAB',
      'STARTUP_10X',
      'MCP_HUB',
      'LOCAL_EMULATORS',
      'CLOUD_NEXUS',
      'GLOBAL_MAP',
      'VPC_NETWORKS',
      'VM_SSH',
      'CLOUD_STORAGE',
      'CLOUD_RUN',
      'GKE_STUDIO',
      'WAVE9_STUDIO',
      'FUNCTIONS_STUDIO',
      'CLOUD_SQL_STUDIO',
      'ALLOYDB_STUDIO',
      'DATA_ENGINEER_STUDIO',
      'MANAGED_SPARK_STUDIO',
      'BIGQUERY_STUDIO',
      'BIGLAKE_STUDIO',
      'WAVE10_FRONTIER',
      'CLOUD_SOC',
      'SOVEREIGN_STUDIO',
      'AWS_AZURE_PARITY',
      'ALIBABA_HUAWEI_PARITY',
      'SRE_WAR_ROOM',
      'FINOPS',
      'LOGS_SHELL',
      'RECYCLE_BIN',
      'DOCS_GUIDE',
    ]);
    const normalizedTab = VALID_TOP_LEVEL_TABS.has(rawNormalizedTab)
      ? rawNormalizedTab
      : 'INNOVATION_LAB';
    const resolvedSubTab =
      normalizedTab === 'CLOUD_STORAGE' && rawResolvedSubTab === 'OBJECT_WORKBENCH'
        ? 'OBJECTS'
        : normalizedTab === 'CLOUD_STORAGE' && rawResolvedSubTab === 'RAM_DLP'
        ? 'DLP_XRAY'
        : normalizedTab === 'BIGQUERY_STUDIO' &&
          (rawResolvedSubTab === 'TIMETRAVEL_LINEAGE' ||
            rawResolvedSubTab === 'TIME_TRAVEL')
        ? 'TIME_MACHINE'
        : normalizedTab === 'BIGQUERY_STUDIO' &&
          rawResolvedSubTab === 'LINEAGE_FINOPS'
        ? 'LINEAGE_BLAST_RADIUS'
        : rawResolvedSubTab;
    const toStudioTitle = STUDIO_DISPLAY_NAMES[normalizedTab] || normalizedTab;
    const toSubTabTitle = resolvedSubTab
      ? normalizedTab === 'BIGQUERY_STUDIO' && resolvedSubTab === 'TIME_MACHINE'
        ? 'FOR SYSTEM_TIME AS OF 7-Day Time-Machine'
        : SUBTAB_DISPLAY_LABELS[resolvedSubTab] || resolvedSubTab
      : extraTarget?.targetLabel || null;
    return {
      normalizedTab,
      resolvedSubTab,
      toStudioTitle,
      toSubTabTitle,
    };
  }, []);

  const executeNavigateStudioTab = useCallback((tabId, subTab, extraTarget = null) => {
    if (!tabId) return;
    const prevTab = activeTabRef.current;
    setStudioSubTabNonce((n) => n + 1);
    if (tabId === 'TIME_MACHINE') {
      setSovereignSubTab('TIME_MACHINE');
      setActiveTab('SOVEREIGN_STUDIO');
      triggerCrossUiSpotlight({
        fromTab: prevTab,
        targetTab: 'SOVEREIGN_STUDIO',
        targetSubTab: 'TIME_MACHINE',
        targetLabel: 'IAM & Sovereign Studio → IAM Policy Time-Machine',
        badgeText: 'IAM Policy Time-Machine',
      });
      return;
    }
    if (tabId === 'ZOMBIE_HUNTER') {
      setActiveTab('FINOPS');
      setTimeout(() => {
        document
          .getElementById('finops-zombie-reaper-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.dispatchEvent(
          new CustomEvent('cloudpulse:scan-zombies', {
            detail: { projectId: selectedProjectId },
          })
        );
      }, 150);
      triggerCrossUiSpotlight({
        fromTab: prevTab,
        targetTab: 'FINOPS',
        targetElementId: 'finops-zombie-reaper-section',
        targetLabel: 'FinOps Studio → Idle VM & Zombie Resource Reaper',
        badgeText: 'Zombie Resource Reaper',
      });
      return;
    }
    if (tabId === 'SECRETS_KMS') {
      setSovereignSubTab('SECRETS_KMS_WAF');
      setActiveTab('SOVEREIGN_STUDIO');
      triggerCrossUiSpotlight({
        fromTab: prevTab,
        targetTab: 'SOVEREIGN_STUDIO',
        targetSubTab: 'SECRETS_KMS_WAF',
        targetLabel: 'IAM & Sovereign Studio → Secret Manager & KMS Vault',
        badgeText: 'Secret Manager & KMS Vault',
      });
      return;
    }
    if (tabId === 'IAM_SURGEON') {
      setSovereignSubTab('IAM_SURGEON');
      setActiveTab('SOVEREIGN_STUDIO');
      triggerCrossUiSpotlight({
        fromTab: prevTab,
        targetTab: 'SOVEREIGN_STUDIO',
        targetSubTab: 'IAM_SURGEON',
        targetLabel: 'IAM & Sovereign Studio → Autonomous IAM Surgeon',
        badgeText: 'Autonomous IAM Surgeon',
      });
      return;
    }
    const { normalizedTab, resolvedSubTab } = resolveNavigationTargetMeta(
      tabId,
      subTab,
      extraTarget
    );

    if (resolvedSubTab && normalizedTab === 'SOVEREIGN_STUDIO') {
      setSovereignSubTab(resolvedSubTab);
    } else if (resolvedSubTab && normalizedTab === 'INNOVATION_LAB') {
      setInnovationSubTab(resolvedSubTab);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:innovation-subtab', {
            detail: { subTab: resolvedSubTab },
          })
        );
      }, 30);
    } else if (resolvedSubTab && normalizedTab === 'AWS_AZURE_PARITY') {
      setAwsAzureSubTab(resolvedSubTab);
    } else if (resolvedSubTab && normalizedTab === 'ALIBABA_HUAWEI_PARITY') {
      setAlibabaHuaweiSubTab(resolvedSubTab);
    } else if (resolvedSubTab && normalizedTab === 'DATA_ENGINEER_STUDIO') {
      setDataEngineerSubTab(resolvedSubTab);
    } else if (normalizedTab === 'CLOUD_NEXUS') {
      if (resolvedSubTab) {
        setCloudNexusSubTab(resolvedSubTab);
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('cloudpulse:open-cloud-nexus', {
              detail: { subTab: resolvedSubTab },
            })
          );
        }, 45);
      }
    } else if (normalizedTab === 'LOCAL_EMULATORS') {
      if (resolvedSubTab) {
        setLocalEmulatorsSubTab(resolvedSubTab);
      }
      if (resolvedSubTab || (extraTarget && typeof extraTarget === 'object')) {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('cloudpulse:open-local-emulators', {
              detail: {
                subTab: resolvedSubTab,
                ...(extraTarget && typeof extraTarget === 'object' ? extraTarget : {}),
              },
            })
          );
        }, 45);
      }
    } else if (normalizedTab === 'MANAGED_SPARK_STUDIO') {
      if (resolvedSubTab) {
        setManagedSparkSubTab(resolvedSubTab);
      }
      if (extraTarget && typeof extraTarget === 'object') {
        setTimeout(() => {
          window.dispatchEvent(
            new CustomEvent('cloudpulse:open-managed-spark', {
              detail: { subTab: resolvedSubTab, ...extraTarget },
            })
          );
        }, 45);
      }
    } else if (resolvedSubTab && normalizedTab === 'BIGLAKE_STUDIO') {
      setBigLakeSubTab(resolvedSubTab);
    } else if (resolvedSubTab && normalizedTab === 'ALLOYDB_STUDIO') {
      setAlloyDbSubTab(resolvedSubTab);
    } else if (resolvedSubTab && normalizedTab === 'BIGQUERY_STUDIO') {
      setBigQuerySubTab(resolvedSubTab);
    } else if (normalizedTab === 'VPC_NETWORKS') {
      setVpcSubTab(resolvedSubTab || '');
    } else if (resolvedSubTab && normalizedTab === 'SRE_WAR_ROOM') {
      setSreSubTab(resolvedSubTab);
    } else if (resolvedSubTab && normalizedTab === 'FINOPS') {
      setFinopsSubTab(resolvedSubTab);
    } else if (resolvedSubTab && normalizedTab === 'WAVE9_STUDIO') {
      setWave9SubTab(resolvedSubTab);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:wave9-subtab', {
            detail: { subTab: resolvedSubTab },
          })
        );
      }, 30);
    } else if (resolvedSubTab && normalizedTab === 'CLOUD_RUN') {
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:open-cloudrun-workbench', {
            detail: { studio: resolvedSubTab },
          })
        );
      }, 50);
    } else if (resolvedSubTab && normalizedTab === 'GKE_STUDIO') {
      setGkeSubTab(resolvedSubTab);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:gke-subtab', {
            detail: { subTab: resolvedSubTab },
          })
        );
      }, 40);
    } else if (resolvedSubTab && normalizedTab === 'FUNCTIONS_STUDIO') {
      setFunctionsSubTab(resolvedSubTab);
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:functions-focus', {
            detail: { subTab: resolvedSubTab },
          })
        );
      }, 40);
    } else if (resolvedSubTab && normalizedTab === 'CLOUD_SOC') {
      setCloudSocSeed({ targetPillar: resolvedSubTab, nonce: Date.now() });
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('cloudpulse:soc-subtab', {
            detail: { subTab: resolvedSubTab },
          })
        );
      }, 40);
    } else if (normalizedTab === 'RECYCLE_BIN') {
      setRecycleBinCategory(resolvedSubTab || 'ALL');
    } else if (normalizedTab === 'CLOUD_STORAGE') {
      if (resolvedSubTab) setStorageSubTab(resolvedSubTab);
      if (extraTarget && typeof extraTarget === 'object') {
        if (extraTarget.bucketName) setStorageTargetBucket(extraTarget.bucketName);
        if (typeof extraTarget.objectName === 'string') {
          setStorageTargetObject(extraTarget.objectName);
        }
      }
    }
    setActiveTab(normalizedTab);
    const studioTitle = STUDIO_DISPLAY_NAMES[normalizedTab] || normalizedTab;
    const displaySubTab =
      tabId === 'APPHUB_GDC' || resolvedSubTab === 'TOPOLOGY'
        ? 'App Hub & 4-Layer Cloud Topology Studio'
        : SUBTAB_DISPLAY_LABELS[resolvedSubTab] || resolvedSubTab;
    triggerCrossUiSpotlight({
      fromTab: prevTab,
      targetTab: normalizedTab,
      targetSubTab: resolvedSubTab || null,
      targetElementId: extraTarget?.targetElementId || null,
      ruleName: extraTarget?.ruleName || null,
      targetLabel:
        extraTarget?.targetLabel ||
        (displaySubTab
          ? `${studioTitle} → ${displaySubTab}`
          : extraTarget?.bucketName
          ? `${studioTitle} → Bucket "${extraTarget.bucketName}"`
          : extraTarget?.ruleName
          ? `${studioTitle} → Firewall Rule "${extraTarget.ruleName}"`
          : studioTitle),
      badgeText:
        extraTarget?.badgeText ||
        displaySubTab ||
        extraTarget?.bucketName ||
        extraTarget?.ruleName ||
        studioTitle,
    });
  }, [selectedProjectId, triggerCrossUiSpotlight, resolveNavigationTargetMeta]);

  const handleNavigateStudioTab = useCallback(
    (tabId, subTab, extraTarget = null, options = {}) => {
      if (!tabId) return;
      const prevTab = activeTabRef.current;
      const { normalizedTab, resolvedSubTab, toStudioTitle, toSubTabTitle } =
        resolveNavigationTargetMeta(tabId, subTab, extraTarget);
      const currentSubId = activeSubTabsRef.current?.[prevTab] || null;
      const isSameDestination =
        normalizedTab === prevTab &&
        (!resolvedSubTab || resolvedSubTab === currentSubId);

      if (options?.skipConfirm || isSameDestination) {
        executeNavigateStudioTab(tabId, subTab, extraTarget);
        return;
      }

      const targetUriOrContext = extraTarget?.bucketName
        ? `gs://${extraTarget.bucketName}${
            extraTarget.objectName ? `/${extraTarget.objectName}` : ''
          }`
        : extraTarget?.ruleName
        ? `Firewall Rule: ${extraTarget.ruleName}`
        : extraTarget?.targetLabel || null;

      const destinationSummary = toSubTabTitle
        ? `${toStudioTitle} (${toSubTabTitle})`
        : toStudioTitle;

      setPendingCrossTabNav({
        fromStudioTitle: STUDIO_DISPLAY_NAMES[prevTab] || prevTab,
        fromSubTabTitle: resolveActiveSubTabLabel(prevTab),
        toStudioTitle,
        toSubTabTitle,
        actionLabel: targetUriOrContext
          ? `Open "${targetUriOrContext}" inside ${destinationSummary}`
          : `Navigate to ${destinationSummary}`,
        targetResourceLabel: targetUriOrContext,
        payloadPreview: null,
        hasUnsavedWarning: Boolean(extraTarget?.hasUnsavedWarning || options?.hasUnsavedWarning),
        onConfirm: () => executeNavigateStudioTab(tabId, subTab, extraTarget),
      });
    },
    [
      executeNavigateStudioTab,
      resolveNavigationTargetMeta,
      resolveActiveSubTabLabel,
    ]
  );

  // Listen for custom focus events across Pipeline Bars & Studios so intra-studio deep-links also spotlight their target
  useEffect(() => {
    const handleStartupFocus = (evt) => {
      const mod = evt?.detail?.module;
      const scrollToId = evt?.detail?.scrollToId;
      triggerCrossUiSpotlight({
        fromTab: activeTabRef.current,
        targetTab: 'STARTUP_10X',
        targetSubTab: mod || null,
        targetElementId: scrollToId || null,
        targetLabel: `Startup 10X Mentor Studio → ${mod || 'Launch Guardrail'}`,
        badgeText: mod || 'Startup 10X Module',
      });
    };
    const handleWave9Focus = (evt) => {
      const subTab = evt?.detail?.subTab;
      triggerCrossUiSpotlight({
        fromTab: activeTabRef.current,
        targetTab: 'WAVE9_STUDIO',
        targetSubTab: subTab || null,
        targetLabel: `Cloud Build & Supply Chain → ${subTab || 'CI/CD Pipeline'}`,
        badgeText: subTab || 'Cloud Build & Supply Chain',
      });
    };
    const handleFunctionsFocus = (evt) => {
      const section = evt?.detail?.section || 'Eventarc & Gen2 Functions';
      triggerCrossUiSpotlight({
        fromTab: activeTabRef.current,
        targetTab: 'FUNCTIONS_STUDIO',
        targetLabel: `Cloud Functions & Eventarc → ${section}`,
        badgeText: section,
      });
    };
    const handleCrossUiNavigate = (evt) => {
      const studioId = evt?.detail?.studioId || evt?.detail?.tabId;
      const subTab = evt?.detail?.subTab || null;
      const extraTarget = evt?.detail?.extraTarget || null;
      if (studioId) {
        handleNavigateStudioTab(studioId, subTab, extraTarget);
      }
    };
    const handleRequestCrossTabNavModal = (evt) => {
      const detail = evt?.detail;
      if (detail && typeof detail.onConfirm === 'function') {
        const prevTab = activeTabRef.current;
        const rawDest = String(detail.destinationLabel || '').trim();
        let parsedDestStudio = detail.toStudioTitle || '';
        let parsedDestSubTab = detail.toSubTabTitle || null;
        if (!parsedDestStudio && rawDest) {
          if (rawDest.includes(' · ')) {
            const [sPart, ...subParts] = rawDest.split(' · ');
            const cleanS = sPart.trim();
            const cleanSub = subParts.join(' · ').trim();
            parsedDestStudio = STUDIO_DISPLAY_NAMES[cleanS] || cleanS;
            parsedDestSubTab = SUBTAB_DISPLAY_LABELS[cleanSub] || cleanSub || null;
          } else {
            parsedDestStudio = STUDIO_DISPLAY_NAMES[rawDest] || rawDest;
          }
        }
        const resolvedToStudio =
          parsedDestStudio || STUDIO_DISPLAY_NAMES[prevTab] || prevTab;
        const resolvedTargetLabel =
          detail.targetResourceLabel || detail.targetDetail || null;
        const destFullLabel = parsedDestSubTab
          ? `${resolvedToStudio} (${parsedDestSubTab})`
          : resolvedToStudio;

        setPendingCrossTabNav({
          fromStudioTitle:
            detail.fromStudioTitle ||
            detail.fromStudio ||
            STUDIO_DISPLAY_NAMES[prevTab] ||
            prevTab,
          fromSubTabTitle:
            detail.fromSubTabTitle || resolveActiveSubTabLabel(prevTab),
          toStudioTitle: resolvedToStudio,
          toSubTabTitle: parsedDestSubTab,
          actionLabel:
            detail.actionLabel ||
            (resolvedTargetLabel
              ? `Open "${resolvedTargetLabel}" in ${destFullLabel}`
              : `Open ${destFullLabel}`),
          targetResourceLabel: resolvedTargetLabel,
          payloadPreview: detail.payloadPreview || null,
          hasUnsavedWarning: Boolean(detail.hasUnsavedWarning),
          onConfirm: detail.onConfirm,
        });
      }
    };

    // In-studio sub-tab clicks swap panels in-place without triggering cross-UI scroll jumps or banners
    const handleWorkspaceSubTabClick = () => {};

    window.addEventListener('cloudpulse:startup-10x-focus', handleStartupFocus);
    window.addEventListener('cloudpulse:wave9-subtab', handleWave9Focus);
    window.addEventListener('cloudpulse:functions-focus', handleFunctionsFocus);
    window.addEventListener('cloudpulse:cross-ui-navigate', handleCrossUiNavigate);
    window.addEventListener(
      'cloudpulse:request-cross-tab-nav',
      handleRequestCrossTabNavModal
    );
    document.addEventListener('click', handleWorkspaceSubTabClick);
    return () => {
      window.removeEventListener('cloudpulse:startup-10x-focus', handleStartupFocus);
      window.removeEventListener('cloudpulse:wave9-subtab', handleWave9Focus);
      window.removeEventListener('cloudpulse:functions-focus', handleFunctionsFocus);
      window.removeEventListener('cloudpulse:cross-ui-navigate', handleCrossUiNavigate);
      window.removeEventListener(
        'cloudpulse:request-cross-tab-nav',
        handleRequestCrossTabNavModal
      );
      document.removeEventListener('click', handleWorkspaceSubTabClick);
    };
  }, [triggerCrossUiSpotlight, handleNavigateStudioTab, resolveActiveSubTabLabel]);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [keynoteAutopilotOpen, setKeynoteAutopilotOpen] = useState(false);

  useEffect(() => {
    const onKeynoteShortcut = (e) => {
      if (e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setKeynoteAutopilotOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeynoteShortcut);
    return () => window.removeEventListener('keydown', onKeynoteShortcut);
  }, []);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState('');
  const [shellSeedCommand, setShellSeedCommand] = useState('');
  const [bigQueryInitialSql, setBigQueryInitialSql] = useState('');

  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionInitialService, setProvisionInitialService] =
    useState('COMPUTE_VM');
  const [provisionInitialLocation, setProvisionInitialLocation] = useState(null);
  const [vmRefreshTrigger, setVmRefreshTrigger] = useState(0);
  const [cloudRunModalOpen, setCloudRunModalOpen] = useState(false);
  const [gdePrivacyConfig, setGdePrivacyConfig] = useState(() =>
    loadGdePrivacyConfig()
  );

  // Global Cmd+K / Ctrl+K shortcut + '[' Rail Toggle + '/' Studio Rail Filter
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.altKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        setZenMode((prev) => !prev);
        return;
      }
      if (
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') ||
        (e.altKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }
      const tag = String(e.target?.tagName || '').toLowerCase();
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        e.target?.isContentEditable ||
        e.target?.closest?.('.xterm');
      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '[') {
        e.preventDefault();
        handleToggleSidebarCollapsed();
      } else if (e.key === '/' && railSearchInputRef.current) {
        e.preventDefault();
        railSearchInputRef.current.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleToggleSidebarCollapsed]);

  const showToast = useCallback((msg, durationMs = 8000) => {
    if (!msg) {
      setToastMessage(null);
      return;
    }
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    const text =
      typeof msg === 'string'
        ? msg
        : msg?.message || msg?.text || String(msg);
    setToastMessage(text);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, durationMs);
  }, []);

  const pauseToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const resumeToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 4500);
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
                if (typeof config.__onGatekeeperConfirmed === 'function') {
                  try {
                    config.__onGatekeeperConfirmed();
                  } catch {
                    // ignore callback errors
                  }
                }
                if (config.headers && typeof config.headers.set === 'function') {
                  config.headers.set('x-confirmed-delete', 'true');
                } else {
                  config.headers = {
                    ...(config.headers || {}),
                    'x-confirmed-delete': 'true',
                  };
                }
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
  }, []);

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
    const storedAccount =
      sessionStorage.getItem('cloudpulse_account') ||
      localStorage.getItem('cloudpulse_account');
    const explicitUserProj =
      sessionStorage.getItem('cloudpulse_user_selected_project_v2') ||
      localStorage.getItem('cloudpulse_user_selected_project_v2') ||
      '';
    const legacyStoredProj =
      sessionStorage.getItem('cloudpulse_project') ||
      localStorage.getItem('cloudpulse_project') ||
      '';
    const storedProj = explicitUserProj || legacyStoredProj || '';
    if (storedToken) {
      axios.defaults.headers.common['x-gcp-access-token'] = storedToken;
    }
    if (storedAccount) {
      axios.defaults.headers.common['x-gcp-account'] = storedAccount;
    }

    axios
      .get('/api/context', {
        params: storedProj
          ? {
              preferredProject: storedProj,
              explicitProject: explicitUserProj ? 'true' : 'false',
            }
          : {},
      })
      .then((res) => {
        if (res.data.authenticated) {
          if (res.data.accessToken) {
            sessionStorage.setItem(
              'cloudpulse_access_token',
              res.data.accessToken
            );
            axios.defaults.headers.common['x-gcp-access-token'] =
              res.data.accessToken;
          }
          if (res.data.account) {
            sessionStorage.setItem('cloudpulse_account', res.data.account);
            localStorage.setItem('cloudpulse_account', res.data.account);
            axios.defaults.headers.common['x-gcp-account'] = res.data.account;
          }

          let mergedProjects = Array.isArray(res.data.projects)
            ? [...res.data.projects]
            : [];
          try {
            const cachedProjectsRaw = localStorage.getItem(
              'cloudpulse_projects_list_v1'
            );
            if (cachedProjectsRaw) {
              const cachedProjects = JSON.parse(cachedProjectsRaw);
              if (Array.isArray(cachedProjects)) {
                const seenIds = new Set(mergedProjects.map((p) => p.projectId));
                cachedProjects.forEach((cp) => {
                  if (cp?.projectId && !seenIds.has(cp.projectId)) {
                    seenIds.add(cp.projectId);
                    mergedProjects.push(cp);
                  }
                });
              }
            }
            if (mergedProjects.length > 0) {
              localStorage.setItem(
                'cloudpulse_projects_list_v1',
                JSON.stringify(mergedProjects)
              );
            }
          } catch {
            // ignore storage errors
          }

          setContextData({
            ...res.data,
            projects: mergedProjects,
          });

          const validProjectIds = new Set(
            mergedProjects.map((p) => p.projectId)
          );
          const canUseStored =
            Boolean(storedProj) &&
            (validProjectIds.size === 0 || validProjectIds.has(storedProj));

          const projToUse =
            (canUseStored ? storedProj : '') ||
            res.data.defaultProject ||
            mergedProjects[0]?.projectId ||
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

  const handleRefreshProjectsList = useCallback(async () => {
    try {
      const res = await axios.get('/api/context', {
        params: selectedProjectId
          ? { preferredProject: selectedProjectId }
          : {},
      });
      if (res.data?.authenticated && Array.isArray(res.data.projects)) {
        if (res.data.accessToken) {
          sessionStorage.setItem(
            'cloudpulse_access_token',
            res.data.accessToken
          );
          axios.defaults.headers.common['x-gcp-access-token'] =
            res.data.accessToken;
        }
        try {
          if (res.data.projects.length > 0) {
            localStorage.setItem(
              'cloudpulse_projects_list_v1',
              JSON.stringify(res.data.projects)
            );
          }
        } catch {
          // ignore
        }
        setContextData((prev) => ({
          ...prev,
          ...res.data,
          projects:
            res.data.projects.length > 0
              ? res.data.projects
              : prev.projects || [],
        }));
        showToast(
          `Synced ${res.data.projects.length} active GCP projects for ${
            res.data.account || 'session'
          }`
        );
      }
    } catch {
      showToast('Could not refresh GCP projects list.');
    }
  }, [selectedProjectId, showToast]);

  const fetchProjectOverview = useCallback(
    async (projId, { force = false, silent = false } = {}) => {
      if (!projId) return;
      const swrStorageKey = `cloudpulse_overview_swr_v2_${projId}`;
      if (!force) {
        try {
          const cachedRaw = localStorage.getItem(swrStorageKey);
          if (cachedRaw) {
            const parsed = JSON.parse(cachedRaw);
            if (parsed && parsed.projectId === projId) {
              setOverview((prev) => prev || parsed);
            }
          }
        } catch {
          // Ignore storage read errors
        }
      }
      if (!silent) {
        setLoadingOverview(true);
        setErrorBanner(null);
      }
      const requestUrl = `/api/project/${encodeURIComponent(projId)}/overview${
        force ? '?force=true' : ''
      }`;
      try {
        let res;
        try {
          res = await axios.get(requestUrl, { timeout: 15000 });
        } catch (firstErr) {
          if (firstErr.response?.status === 401) throw firstErr;
          await new Promise((r) => setTimeout(r, 450));
          res = await axios.get(requestUrl, { timeout: 15000 });
        }
        setOverview(res.data);
        try {
          localStorage.setItem(swrStorageKey, JSON.stringify(res.data));
        } catch {
          // Ignore storage quota errors
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setIsAuthenticated(false);
        } else if (!silent) {
          setOverview((prev) =>
            prev || {
              projectId: projId,
              fetchLatencyMs: 0,
              summary: {
                totalResources: 0,
                totalVms: 0,
                runningVms: 0,
                cloudRunServices: 0,
                storageBuckets: 0,
                bigqueryDatasets: 0,
                gkeClusters: 0,
                vpcNetworks: 0,
                firewallRules: 0,
                enabledApisCount: 0,
              },
              resources: [],
              vpcs: [],
              firewalls: [],
              cloudRunServices: [],
              enabledApis: [],
              logs: [],
            }
          );
          setErrorBanner(
            err.response?.data?.error ||
              `Failed to fetch live telemetry for project ${projId}`
          );
        }
      } finally {
        if (!silent) {
          setLoadingOverview(false);
        }
      }
    },
    []
  );

  // Immediately reconcile Overview resources with the live VM list from VmFleetAndSsh so deleted VMs never linger as DELETING in Overview
  const handleSyncLiveVms = useCallback(
    (liveVmList) => {
      if (!Array.isArray(liveVmList) || !selectedProjectId) return;
      setOverview((prev) => {
        if (!prev || !Array.isArray(prev.resources)) return prev;
        const currentVmRows = prev.resources.filter(
          (r) => r.type === 'Compute Engine VM'
        );
        const liveSig = liveVmList
          .map(
            (v) =>
              `${v.name}:${v.status === 'RUNNING' ? 'HEALTHY' : v.status}:${
                v.machineType || ''
              }`
          )
          .sort()
          .join('|');
        const currentSig = currentVmRows
          .map((r) => `${r.name}:${r.status}:${r.machineType || ''}`)
          .sort()
          .join('|');
        if (liveSig === currentSig) return prev;

        const mappedVmRows = liveVmList.map((v) => {
          const existing = currentVmRows.find((r) => r.name === v.name);
          const natIp =
            v.externalIp && v.externalIp !== 'None'
              ? v.externalIp
              : 'Internal Only';
          const netIp = v.internalIp || '10.128.0.2';
          const machineShort = v.machineType || 'e2-medium';
          const normalizedStatus =
            v.status === 'RUNNING' ? 'HEALTHY' : v.status || 'HEALTHY';
          return {
            ...(existing || {}),
            id: existing?.id || `gce-${v.name}`,
            name: v.name,
            type: 'Compute Engine VM',
            category: 'compute',
            region: v.zone || v.region || 'us-east1-b',
            zone: v.zone || 'us-east1-b',
            machineType: machineShort,
            externalIp: natIp,
            internalIp: netIp,
            spotInstance: Boolean(v.spotInstance),
            diskSizeGb: Number(v.diskSizeGb || 20),
            status: normalizedStatus,
            source: 'LIVE_GCP',
            createdAt:
              v.createdAt || existing?.createdAt || new Date().toISOString(),
            storageClass: `${machineShort} (${netIp})`,
            utilizationScore: v.status === 'RUNNING' ? 45 : 0,
            monthlyCostUsd: existing?.monthlyCostUsd ?? 24.5,
            requestsPerMin: v.status === 'RUNNING' ? 120 : 0,
            p95LatencyMs: 14,
            uri:
              v.sshCommand ||
              `gcloud compute ssh ${v.name} --zone=${v.zone || 'us-east1-b'} --project=${selectedProjectId}`,
            details: {
              ...(existing?.details || {}),
              zone: v.zone || 'us-east1-b',
              status: v.status || 'RUNNING',
              internalIp: netIp,
              externalIp: natIp,
              machineType: machineShort,
              spotInstance: Boolean(v.spotInstance),
              diskSizeGb: Number(v.diskSizeGb || 20),
            },
          };
        });

        const nonVmRows = prev.resources.filter(
          (r) => r.type !== 'Compute Engine VM'
        );
        const nextResources = [...mappedVmRows, ...nonVmRows];
        const nextOverview = {
          ...prev,
          summary: {
            ...(prev.summary || {}),
            liveVmsCount: liveVmList.length,
            totalVms: liveVmList.length,
            totalResourcesCount: nextResources.length,
          },
          resources: nextResources,
        };
        try {
          localStorage.setItem(
            `cloudpulse_overview_swr_v2_${selectedProjectId}`,
            JSON.stringify(nextOverview)
          );
        } catch {
          // ignore storage quota errors
        }
        return nextOverview;
      });
    },
    [selectedProjectId]
  );

  // Automatically poll Project Overview when any resource in Overview is in a transitional state (DEPROVISIONING, STOPPING, PROVISIONING, STAGING, SUSPENDING)
  const hasTransitionalOverviewResource = Boolean(
    overview?.resources?.some((r) =>
      [
        'DEPROVISIONING',
        'STOPPING',
        'PROVISIONING',
        'STAGING',
        'SUSPENDING',
        'DELETING',
      ].includes(r?.status)
    )
  );

  useEffect(() => {
    if (!isAuthenticated || !selectedProjectId || !hasTransitionalOverviewResource) {
      return;
    }
    if (activeTab === 'OVERVIEW') {
      fetchProjectOverview(selectedProjectId, { force: true, silent: true });
    }
    const timer = setInterval(() => {
      fetchProjectOverview(selectedProjectId, { force: true, silent: true });
    }, 3500);
    return () => clearInterval(timer);
  }, [
    isAuthenticated,
    selectedProjectId,
    activeTab,
    hasTransitionalOverviewResource,
    fetchProjectOverview,
  ]);

  const [gdeSummary, setGdeSummary] = useState(() =>
    summarizeCreditLedger([], 0)
  );

  useEffect(() => {
    if (isAuthenticated && selectedProjectId) {
      sessionStorage.setItem('cloudpulse_project', selectedProjectId);
      try {
        localStorage.setItem('cloudpulse_project', selectedProjectId);
      } catch {
        // ignore
      }
      fetchProjectOverview(selectedProjectId);
      axios
        .get(
          `/api/project/${encodeURIComponent(
            selectedProjectId
          )}/billing-guardian`
        )
        .then(async (res) => {
          let envelopeOverride = {};
          const savedEnv = localStorage.getItem(
            'cloudpulse_gde_bonus_envelope_v2'
          );
          if (savedEnv) {
            try {
              envelopeOverride = JSON.parse(savedEnv) || {};
            } catch {
              // ignore
            }
          }
          const aggregated = await syncAndAggregateBillingIndexedDb({
            projectId: selectedProjectId,
            billingInfo: res.data?.billingInfo || {},
            billingAccounts: res.data?.billingAccounts || [],
            liveBillingInsights: res.data?.liveBillingInsights || null,
            syncedConsoleCredits:
              res.data?.liveBillingInsights?.consoleCredits || [],
            envelopeOverride,
            dailyBurnUsd: 0,
          });
          setGdeSummary(aggregated);
        })
        .catch(() => null);
    }
  }, [isAuthenticated, selectedProjectId, fetchProjectOverview]);

  const handleDisconnect = async () => {
    sessionStorage.removeItem('cloudpulse_access_token');
    sessionStorage.removeItem('cloudpulse_account');
    sessionStorage.removeItem('cloudpulse_project');
    sessionStorage.removeItem('cloudpulse_project_explicit');
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
      try {
        localStorage.setItem('cloudpulse_account', sessionData.account || '');
      } catch {
        // ignore
      }
      axios.defaults.headers.common['x-gcp-access-token'] =
        sessionData.accessToken;
      axios.defaults.headers.common['x-gcp-account'] =
        sessionData.account || '';
    }
    const incomingProjects = sessionData.projects || [];
    try {
      if (incomingProjects.length > 0) {
        localStorage.setItem(
          'cloudpulse_projects_list_v1',
          JSON.stringify(incomingProjects)
        );
      }
    } catch {
      // ignore
    }
    setContextData({
      authenticated: true,
      account: sessionData.account,
      defaultProject: sessionData.selectedProjectId,
      projects: incomingProjects,
    });
    sessionStorage.setItem('cloudpulse_project', sessionData.selectedProjectId);
    sessionStorage.setItem('cloudpulse_project_explicit', 'true');
    try {
      localStorage.setItem('cloudpulse_project', sessionData.selectedProjectId);
      localStorage.setItem('cloudpulse_project_explicit', 'true');
    } catch {
      // ignore
    }
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

  const [logExplorerSeedSpec, setLogExplorerSeedSpec] = useState(null);
  const [shellSeedNonce, setShellSeedNonce] = useState(0);
  const [globalMapXRaySeed, setGlobalMapXRaySeed] = useState(null);
  const [vpcStudioRuleSeed, setVpcStudioRuleSeed] = useState(null);
  const [cloudSocSeed, setCloudSocSeed] = useState(null);

  const sanitizeExecutableCliForShell = (rawCmd) => {
    const collapsed = String(rawCmd || '').replace(/\\\r?\n\s*/g, ' ');
    const lines = collapsed
      .split(/\r?\n|\s*&&\s*/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'))
      .map((line) => line.replace(/^\$\s+/, '').trim());
    const preferred =
      lines.find((line) => /^(gcloud|bq|gsutil|kubectl)\b/i.test(line)) ||
      lines[0] ||
      '';
    return preferred || String(rawCmd || '').trim();
  };

  const executeRunInShell = (cmd) => {
    const prevTab = activeTabRef.current;
    const cleanCmd = sanitizeExecutableCliForShell(cmd);
    setShellSeedCommand(cleanCmd);
    setShellSeedNonce(Date.now());
    setActiveTab('LOGS_SHELL');
    showToast(`Executing in Cloud Shell: ${cleanCmd}`);
    triggerCrossUiSpotlight({
      fromTab: prevTab,
      targetTab: 'LOGS_SHELL',
      isShellCommand: true,
      targetElementId: 'cloud-shell-terminal-card',
      targetLabel: `Logs & Cloud Shell → "${String(cleanCmd || '').slice(0, 44)}"`,
      badgeText: 'Cloud Shell Terminal',
    });
  };

  const handleRunInShell = (cmd, options = {}) => {
    const prevTab = activeTabRef.current;
    const cleanCmd = sanitizeExecutableCliForShell(cmd);
    if (options?.skipConfirm || prevTab === 'LOGS_SHELL') {
      executeRunInShell(cmd);
      return;
    }
    setPendingCrossTabNav({
      fromStudioTitle: STUDIO_DISPLAY_NAMES[prevTab] || prevTab,
      fromSubTabTitle: resolveActiveSubTabLabel(prevTab),
      toStudioTitle: STUDIO_DISPLAY_NAMES.LOGS_SHELL,
      toSubTabTitle: 'Interactive Cloud Shell Terminal',
      actionLabel: 'Open & Execute in Cloud Shell Studio',
      targetResourceLabel: 'gcloud / bq / gsutil CLI Command',
      payloadPreview: cleanCmd ? `$ ${cleanCmd.slice(0, 220)}` : null,
      onConfirm: () => executeRunInShell(cmd),
    });
  };

  const executeOpenInLogsExplorer = (spec) => {
    const prevTab = activeTabRef.current;
    setLogExplorerSeedSpec({ ...spec, triggeredAt: Date.now() });
    if (spec?.gcloudCommand) {
      setShellSeedCommand(spec.gcloudCommand);
    }
    setActiveTab('LOGS_SHELL');
    showToast(
      `Opened Cloud Logs Explorer & Shell for ${spec?.regionId || 'event'} (${
        spec?.summary || spec?.category || 'Forensic Trace'
      })`
    );
    triggerCrossUiSpotlight({
      fromTab: prevTab,
      targetTab: 'LOGS_SHELL',
      targetElementId: 'chrono-logs-explorer-card',
      targetLabel: `Cloud Logs Explorer → ${spec?.summary || spec?.regionId || 'Forensic Trace'}`,
      badgeText: spec?.regionId || 'Logs Explorer',
    });
  };

  const handleOpenInLogsExplorer = (spec, options = {}) => {
    const prevTab = activeTabRef.current;
    if (options?.skipConfirm || prevTab === 'LOGS_SHELL') {
      executeOpenInLogsExplorer(spec);
      return;
    }
    setPendingCrossTabNav({
      fromStudioTitle: STUDIO_DISPLAY_NAMES[prevTab] || prevTab,
      fromSubTabTitle: resolveActiveSubTabLabel(prevTab),
      toStudioTitle: STUDIO_DISPLAY_NAMES.LOGS_SHELL,
      toSubTabTitle: 'Chrono-Logs Time-Machine & SRE Triage',
      actionLabel: 'Open in Neural Chrono-Logs Explorer',
      targetResourceLabel:
        spec?.summary || spec?.regionId || spec?.category || 'Cloud Logging Forensic Query',
      payloadPreview: spec?.filter || spec?.gcloudCommand || null,
      onConfirm: () => executeOpenInLogsExplorer(spec),
    });
  };

  const executeTestRuleOnGlobalMap = (seed) => {
    const prevTab = activeTabRef.current;
    setGlobalMapXRaySeed({ ...seed, nonce: Date.now() });
    setActiveTab('GLOBAL_MAP');
    const ruleTag = `${seed?.ruleName || 'Packet'} (${String(
      seed?.protocol || 'tcp'
    ).toUpperCase()}:${seed?.port || 22})`;
    showToast(
      `Tracing firewall rule "${seed?.ruleName || 'custom'}" (${String(
        seed?.protocol || 'tcp'
      ).toUpperCase()}:${seed?.port || 22}) in Global Map Firewall X-Ray`
    );
    triggerCrossUiSpotlight({
      fromTab: prevTab,
      targetTab: 'GLOBAL_MAP',
      targetElementId: 'global-map-xray-dock',
      isXRay: true,
      targetLabel: `Global Map → Live Firewall X-Ray Debugger (${ruleTag})`,
      badgeText: `Firewall X-Ray: ${ruleTag}`,
    });
  };

  const handleTestRuleOnGlobalMap = (seed, options = {}) => {
    const prevTab = activeTabRef.current;
    if (options?.skipConfirm || prevTab === 'GLOBAL_MAP') {
      executeTestRuleOnGlobalMap(seed);
      return;
    }
    const ruleTag = `${seed?.ruleName || 'Packet'} (${String(
      seed?.protocol || 'tcp'
    ).toUpperCase()}:${seed?.port || 22})`;
    setPendingCrossTabNav({
      fromStudioTitle: STUDIO_DISPLAY_NAMES[prevTab] || prevTab,
      fromSubTabTitle: resolveActiveSubTabLabel(prevTab),
      toStudioTitle: STUDIO_DISPLAY_NAMES.GLOBAL_MAP,
      toSubTabTitle: 'Live Firewall X-Ray Packet Debugger',
      actionLabel: 'Trace Rule on 40-Region Global Map',
      targetResourceLabel: ruleTag,
      payloadPreview: null,
      onConfirm: () => executeTestRuleOnGlobalMap(seed),
    });
  };

  const executeOpenInVpcFirewallStudio = (seed) => {
    const prevTab = activeTabRef.current;
    setVpcStudioRuleSeed({ ...seed, nonce: Date.now() });
    setActiveTab('VPC_NETWORKS');
    showToast(
      `Opened "${seed?.ruleName || seed?.vpcName || 'Firewall Policy'}" in VPC & Firewalls Studio`
    );
    triggerCrossUiSpotlight({
      fromTab: prevTab,
      targetTab: 'VPC_NETWORKS',
      ruleName: seed?.ruleName || null,
      targetElementId: seed?.ruleName
        ? `vpc-fw-card-${seed.ruleName}`
        : 'live-vpc-firewall-rules-section',
      targetLabel: `VPC & Firewalls Studio → ${
        seed?.ruleName ? `Rule "${seed.ruleName}"` : seed?.vpcName || 'Firewall Rules'
      }`,
      badgeText: seed?.ruleName ? `Rule: ${seed.ruleName}` : 'VPC Firewall Rules',
    });
  };

  const handleOpenInVpcFirewallStudio = (seed, options = {}) => {
    const prevTab = activeTabRef.current;
    if (options?.skipConfirm || prevTab === 'VPC_NETWORKS') {
      executeOpenInVpcFirewallStudio(seed);
      return;
    }
    setPendingCrossTabNav({
      fromStudioTitle: STUDIO_DISPLAY_NAMES[prevTab] || prevTab,
      fromSubTabTitle: resolveActiveSubTabLabel(prevTab),
      toStudioTitle: STUDIO_DISPLAY_NAMES.VPC_NETWORKS,
      toSubTabTitle: seed?.ruleName
        ? `Firewall Rule "${seed.ruleName}"`
        : 'VPC Subnets & Firewall Rules',
      actionLabel: 'Open in VPC & Firewall Rules Studio',
      targetResourceLabel: seed?.ruleName || seed?.vpcName || 'VPC Firewall Policy',
      payloadPreview: null,
      onConfirm: () => executeOpenInVpcFirewallStudio(seed),
    });
  };

  const executeOpenInCloudSoc = (seed) => {
    const prevTab = activeTabRef.current;
    setCloudSocSeed({ ...seed, nonce: Date.now() });
    setActiveTab('CLOUD_SOC');
    showToast(
      `Opened "${seed?.ruleName || seed?.vpcName || 'VPC Perimeter'}" in Cloud SOC & SOAR War-Room`
    );
    triggerCrossUiSpotlight({
      fromTab: prevTab,
      targetTab: 'CLOUD_SOC',
      targetSubTab: seed?.targetPillar || 'TOXIC_GRAPH',
      targetElementId: 'soc-active-pillar-panel',
      targetLabel: `Cloud SOC → ${
        seed?.ruleName
          ? `Rule "${seed.ruleName}" in Toxic Attack Graph`
          : seed?.targetPillar || 'SOAR War-Room'
      }`,
      badgeText: seed?.ruleName || seed?.targetPillar || 'Cloud SOC Pillar',
    });
  };

  const handleOpenInCloudSoc = (seed, options = {}) => {
    const prevTab = activeTabRef.current;
    if (options?.skipConfirm || prevTab === 'CLOUD_SOC') {
      executeOpenInCloudSoc(seed);
      return;
    }
    setPendingCrossTabNav({
      fromStudioTitle: STUDIO_DISPLAY_NAMES[prevTab] || prevTab,
      fromSubTabTitle: resolveActiveSubTabLabel(prevTab),
      toStudioTitle: STUDIO_DISPLAY_NAMES.CLOUD_SOC,
      toSubTabTitle:
        SUBTAB_DISPLAY_LABELS[seed?.targetPillar || 'TOXIC_GRAPH'] ||
        seed?.targetPillar ||
        'Toxic Combination Attack Graph & SOAR',
      actionLabel: 'Open in Cloud SOC & SOAR War-Room',
      targetResourceLabel: seed?.ruleName || seed?.vpcName || 'VPC Security Perimeter',
      payloadPreview: null,
      onConfirm: () => executeOpenInCloudSoc(seed),
    });
  };

  const handleOpenProvision = (serviceType = 'COMPUTE_VM', locationSpec = null) => {
    setProvisionInitialService(serviceType);
    setProvisionInitialLocation(locationSpec);
    setProvisionOpen(true);
  };

  const handleProvisionSuccess = async (data, serviceType) => {
    showToast(data.message || 'Resource provisioned on Google Cloud!');
    await fetchProjectOverview(selectedProjectId);
    setVmRefreshTrigger((c) => c + 1);
    if (serviceType === 'CLOUD_RUN') {
      handleNavigateStudioTab('CLOUD_RUN', null, null, { skipConfirm: true });
    } else if (serviceType === 'GKE_CLUSTER') {
      handleNavigateStudioTab('GKE_STUDIO', null, null, { skipConfirm: true });
    } else if (serviceType === 'CLOUD_SQL') {
      handleNavigateStudioTab('CLOUD_SQL_STUDIO', null, null, { skipConfirm: true });
    } else if (serviceType === 'GCS_BUCKET') {
      handleNavigateStudioTab('CLOUD_STORAGE', null, null, { skipConfirm: true });
    } else if (serviceType === 'BIGQUERY_DATASET') {
      handleNavigateStudioTab('BIGQUERY_STUDIO', null, null, { skipConfirm: true });
    } else if (serviceType === 'COMPUTE_VM') {
      handleNavigateStudioTab('VM_SSH', null, null, { skipConfirm: true });
    } else if (serviceType === 'VPC_NETWORK' || serviceType === 'VPC_FIREWALL') {
      handleNavigateStudioTab('VPC_NETWORKS', null, null, { skipConfirm: true });
    }
  };

  const handleDeleteResource = async (resource, options = {}) => {
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(selectedProjectId)}/resource`,
        {
          __onGatekeeperConfirmed: () => {
            setActionLoading(true);
            if (typeof options.onConfirmed === 'function') {
              options.onConfirmed();
            }
          },
          data: {
            resourceType: resource.type,
            name: resource.name,
            region: resource.region,
          },
        }
      );
      // Immediately evict deleted resource from client state & sessionStorage/localStorage SWR cache
      try {
        sessionStorage.removeItem(`cloudpulse_overview_swr_v2_${selectedProjectId}`);
        localStorage.removeItem(`cloudpulse_overview_swr_v2_${selectedProjectId}`);
      } catch {
        // ignore storage quota errors
      }
      setOverview((prev) => {
        if (!prev) return prev;
        const nextResources = (prev.resources || []).filter(
          (r) => r.id !== resource.id && !(r.name === resource.name && r.type === resource.type)
        );
        return {
          ...prev,
          resources: nextResources,
        };
      });
      showToast(res.data.message || `Deleted ${resource.name} from ${selectedProjectId}`);
      await fetchProjectOverview(selectedProjectId, { force: true });
      setVmRefreshTrigger((c) => c + 1);
      return true;
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) {
        return false;
      }
      setErrorBanner(
        err.response?.data?.error || `Failed to delete ${resource.name}`
      );
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#131314] flex items-center justify-center p-6">
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
    // I. Command & Global Topology
    {
      id: 'OVERVIEW',
      group: 'COMMAND',
      label: 'Overview',
      tip: 'Project Overview & Resource Lineage: Live Project KPIs, Stale/Orphaned Resource Detector, Live Resource Inventory, 5-Domain Architecture Hub & API Kill-Switch',
      icon: LayoutDashboard,
    },
    {
      id: 'INNOVATION_LAB',
      group: 'COMMAND',
      label: '2026 Innovation',
      isStar: true,
      tip: '24 Beyond-Console Enterprise Tools: Pre-Crime 30-Day Billing Forecaster, Dream Stack Compiler, Wave 16 Moonshot, 2026 Quantum Nexus (Resilience Suite), Night-Mode Sleep, Reverse-Terraform, Storage RAM DLP, Cold-Start Surgeon & AES-256-GCM Gemini 3.8 Vault',
      icon: Sparkles,
    },
    {
      id: 'STARTUP_10X',
      group: 'COMMAND',
      label: 'Startup 10X',
      isStar: true,
      tip: 'Google for Startups Mentor Edition — Dedicated Startup 10X Scale & Bottleneck Radar: Expose and remediate Cloud Run Cold-Start & Legacy VPC Connector lags, Cloud SQL 200-instance Connection Storms, Launch-Day HTTP 429 Quota Walls, $2k–$350k Credit Vampires, SOC2 Deal-Blockers & GenAI -80% Context Caching',
      icon: Rocket,
    },
    {
      id: 'MCP_HUB',
      group: 'COMMAND',
      label: 'MCP Servers',
      isStar: true,
      tip: '2026 Google Cloud Official Remote MCP Control Plane: 48 *.googleapis.com/mcp Servers, 505 Live JSON-RPC 2.0 Tools, 4-Server Autonomous Triage Chains, Gemini 3.8 Flash MCP Tool-Calling Agent & 1-Click IDE Config Exporter',
      icon: Cpu,
    },
    {
      id: 'LOCAL_EMULATORS',
      group: 'COMMAND',
      label: 'Local Cloud Emulators',
      isStar: true,
      tip: 'Google Cloud Local Emulators Studio ($0.00/hr 127.0.0.1 Inner-Loop Twin): Manage Pub/Sub, Firestore, Datastore, Spanner & Bigtable Local Emulators, Interactive Local REST Workbench, Cloud-to-Local Schema Sync & *_EMULATOR_HOST Exporter',
      icon: Boxes,
    },
    {
      id: 'CLOUD_NEXUS',
      group: 'COMMAND',
      label: 'Terraform & Vertex Eval',
      isStar: true,
      tip: 'Cloud Flight-Deck Nexus (2-in-1): Live Cloud-to-Terraform Reverse-Compiler & ClickOps Drift Time-Machine, and Vertex AI Multi-Model Arena with LLM Judge & Red-Team Probe',
      icon: Compass,
    },
    {
      id: 'GLOBAL_MAP',
      group: 'COMMAND',
      label: 'Global Map',
      tip: 'Interactive 40-Region & 121-Zone Global Subsea Cable, Carbon Intensity & Chaos Failover Map with click-to-deploy',
      icon: Globe,
    },

    // II. Core Infrastructure, Compute & VPC (Ordered logically starting with GCE VM #1 -> VPC #2)
    {
      id: 'VM_SSH',
      group: 'INFRA_COMPUTE',
      label: 'VM (GCE)',
      tip: 'Compute Engine (GCE) VM Fleet & Browser Web-SSH Terminal: Provision 1 GB to 32 TB RAM VMs, start, stop, resize, or SSH directly into your Linux VMs',
      icon: Server,
    },
    {
      id: 'VPC_NETWORKS',
      group: 'INFRA_COMPUTE',
      label: 'VPC',
      tip: 'VPC Backbone & Firewall Perimeter Manager: Inspect subnets, BGP routing, MTU, and audit or lock 0.0.0.0/0 ingress rules to IAP',
      icon: Network,
    },
    {
      id: 'CLOUD_RUN',
      group: 'INFRA_COMPUTE',
      label: 'Cloud Run',
      tip: 'Cloud Run Serverless Fleet Manager: Deploy containers, attach NVIDIA L4 GPUs, 1-Click Direct Cloud IAP ($0/mo Zero-LB), App Engine Service Exterminator & $0/mo Default Neutralizer, and Request vs Instance billing',
      icon: Rocket,
    },
    {
      id: 'GKE_STUDIO',
      group: 'INFRA_COMPUTE',
      label: 'GKE',
      tip: 'Google Kubernetes Engine (GKE) Studio: 1-Click Autopilot & Spot GPU Cluster Provisioner, compliance locks & K8s YAML Composer',
      icon: Cpu,
    },
    {
      id: 'FUNCTIONS_STUDIO',
      group: 'INFRA_COMPUTE',
      label: 'Functions',
      tip: 'Cloud Functions (1st Gen v1 & 2nd Gen v2) + Eventarc Trigger Studio & Cloud Workflows / Messaging Decision Matrix (Eventarc vs Pub/Sub vs Tasks vs Workflows)',
      icon: Zap,
    },
    {
      id: 'WAVE9_STUDIO',
      group: 'INFRA_COMPUTE',
      label: 'Cloud Build',
      tip: 'Cloud Build GitHub CI/CD + Artifact Registry SLSA-3 Supply-Chain Studio: Buildpacks/Dockerfiles, Auto-Deploy & Orphan Digest Sweeper',
      icon: PackageCheck,
    },
    {
      id: 'CLOUD_STORAGE',
      group: 'INFRA_COMPUTE',
      label: 'Cloud Storage',
      tip: 'Cloud Storage Studio: 5-Step Compliance Bucket Wizard, strict SEC/GDPR/HIPAA locks, Soft-Delete & WORM retention, and live object explorer',
      icon: HardDrive,
    },

    // III. Databases, Data Engineering & Lakehouse
    {
      id: 'CLOUD_SQL_STUDIO',
      group: 'DATA_AI',
      label: 'Cloud SQL',
      tip: 'Cloud SQL (MySQL 8.4 & PostgreSQL 16/17) + AlloyDB Studio: Architecture Fork, AI Vector (alloydb_scann / pgvector) Surgeon & IAM Auth Proxy v2',
      icon: Database,
    },
    {
      id: 'ALLOYDB_STUDIO',
      group: 'DATA_AI',
      label: 'AlloyDB',
      tip: 'AlloyDB Mastery & Express Studio: AlloyDB Express (PG 18) 1-Click Provisioner & In-Place Enterprise Upgrade, Zero Lock-in pglogical + Omni + Stock PG DR Exit, SCaNN Vector RAG & Beyond Aurora AI Agents',
      icon: Database,
    },
    {
      id: 'DATA_ENGINEER_STUDIO',
      group: 'DATA_AI',
      label: 'Data Engineer',
      tip: '2026 Data Engineering Studio (GCloud SDK 591.0.0 & Data Agent Kit): Medallion Builder, Dataform/dbt SQLX, Dataplex Profiling, Schema Mapper, Serverless DAGs & Zero-Cluster Serverless Spark on BigLake Iceberg',
      icon: Layers,
    },
    {
      id: 'MANAGED_SPARK_STUDIO',
      group: 'DATA_AI',
      label: 'Managed Spark',
      tip: 'Google Cloud Managed Service for Apache Spark & Dataproc Serverless Studio: Serverless Spark 3.5 Batches ($0/hr Idle), Interactive ManagedSparkSession (Spark Connect) Notebooks, sparkApplications Stage/SQL Diagnostics, GCS Driver Output RCA & 7-Role Spark IAM Doctor',
      icon: Flame,
    },
    {
      id: 'BIGQUERY_STUDIO',
      group: 'DATA_AI',
      label: 'BigQuery',
      tip: 'BigQuery Capacitor Warehouse & SQL Optimizer Studio: Dataset Compliance Hardener, Physical Billing (-54%), Dry-Run SQL X-Ray, Slot FinOps & 168h Time-Machine',
      icon: Database,
    },
    {
      id: 'BIGLAKE_STUDIO',
      group: 'DATA_AI',
      label: 'BigLake',
      tip: 'BigLake & Apache Iceberg Open Lakehouse Studio: Metastore REST Catalogs (/biglake/metastore/catalogs), 1-Click CLOUD_RESOURCE Connection & Zero-Trust Bucket IAM, Iceberg Small-File Compaction Doctor & Cross-Cloud Omni (AWS S3 / Azure)',
      icon: Layers,
    },
    {
      id: 'WAVE10_FRONTIER',
      group: 'DATA_AI',
      label: 'Spanner',
      tip: 'Cloud Spanner Unified Database Studio: Granular 100-PU Sizer ($65.70/mo), Spanner Graph (ISO GQL) & Interleaved Schema Architect, ScaNN Vector Search & Hybrid GraphRAG, and 99.999% TrueTime Change Streams CDC',
      icon: Database,
    },

    // IV. Security, Incident SRE, FinOps, Logs & Docs
    {
      id: 'CLOUD_SOC',
      group: 'SECURITY_SRE',
      label: 'Cloud SOC',
      isStar: true,
      tip: 'Wave 16 Next-Gen Autonomous Google Cloud SOC & SOAR War-Room ($0/mo SIEM Tax): Live cloudaudit MITRE ATT&CK Kill-Chains, 3-Vector Toxic Combinations Graph, @sha256 Supply-Chain & .json Key Disabler, $0/mo Active Canary Deception Grid, and Gemini 3.8/3.1 Incident Commander + Ed25519 Ledger',
      icon: ShieldCheck,
    },
    {
      id: 'SOVEREIGN_STUDIO',
      group: 'SECURITY_SRE',
      label: 'IAM',
      tip: 'Autonomous IAM Least-Privilege Surgeon (24h JIT CEL + Service Account Key & OAuth2 Token Kill-Switch), SHA-256 Merkle Drift Radar & Secret/KMS/WAF Vault',
      icon: ShieldCheck,
    },
    {
      id: 'AWS_AZURE_PARITY',
      group: 'SECURITY_SRE',
      label: 'AWS & Azure Parity',
      isStar: true,
      tip: '20-in-1 AWS & Azure Enterprise Parity Suite for GCP: Azure Resource Groups + RBAC + 1-Click Teardown, Hard-Spend Fuse, AWS IAM Policy Simulator, S3/SAS Presigned URLs, 1-Screen Global LB + WAF, CloudFormation/ARM Drift, SSM Fleet Command, Multi-Brand OAuth, Route 53/Front Door DNS, CloudTrail Lake, AWS RAM/Lighthouse & Bedrock/AI Foundry Gateway',
      icon: Layers,
    },
    {
      id: 'ALIBABA_HUAWEI_PARITY',
      group: 'SECURITY_SRE',
      label: 'Alibaba & Huawei Parity',
      isStar: true,
      tip: '8-in-1 Alibaba Cloud (Aliyun) & Huawei Cloud Hyperscale Parity Suite for GCP: 11.11 Singles-Day PTS + MSE Sentinel Surge Engine, CEN + Global Accelerator QoS Slicer, PolarDB / GaussDB Serverless HTAP & 1.6s Clone, Huawei CCE Volcano + PAI Fractional vGPU Pool, RocketMQ 5.0 2PC Half-Messages, Nacos + Higress Zero-Restart Config Mesh, Hologres + MaxCompute Sub-Second OLAP, and DataV / Astro War-Room NOC Wall',
      icon: Globe,
    },
    {
      id: 'SRE_WAR_ROOM',
      group: 'SECURITY_SRE',
      label: 'SRE War-room',
      tip: 'Autonomous SRE Incident War-Room, Cloud Logging Root-Cause Correlator, 14.4x SLO Burn Radar, VPC Service Controls (VPC-SC) & Pub/Sub DLQ Studio',
      icon: Flame,
    },
    {
      id: 'FINOPS',
      group: 'OPS_DOCS',
      label: 'Finops',
      tip: 'Real-Time Cloud Monitoring Metrics, CPU/Memory/Network Telemetry Charts & FinOps Footprint',
      icon: BarChart3,
    },
    {
      id: 'LOGS_SHELL',
      group: 'OPS_DOCS',
      label: 'Logs',
      tip: '2026 Neural Chrono-Log & Trace Studio (Drain3 Clustering, Trace Waterfall, NL-to-LQL, Log FinOps, DLP Shield & Cloud Shell)',
      icon: Terminal,
    },
    {
      id: 'RECYCLE_BIN',
      group: 'OPS_DOCS',
      label: 'Recycle Bin',
      tip: '30-Day Cloud Recycle Bin: Inspect what resources were deleted and which Google Cloud APIs were disabled over the last 30 days (cloudaudit.googleapis.com/activity + Soft-Delete Vaults) with 1-Click Restore / Re-Enable',
      icon: Trash2,
    },
    {
      id: 'DOCS_GUIDE',
      group: 'OPS_DOCS',
      label: 'Architecture & Docs',
      tip: 'Interactive Architecture Documentation, Zero-Simulation Security Model, Live GCP API Reference & Studio Walkthrough Guide',
      icon: BookOpen,
    },
  ];

  const getTabResourceCount = (tabId) => {
    if (tabId === 'VM_SSH') {
      return overview?.summary?.liveVmsCount ?? overview?.summary?.totalVms;
    }
    if (tabId === 'VPC_NETWORKS') {
      return overview?.vpcs?.length;
    }
    if (tabId === 'CLOUD_RUN') {
      return overview?.cloudRunServices?.length;
    }
    if (tabId === 'GKE_STUDIO') {
      return overview?.summary?.liveClustersCount ?? overview?.summary?.gkeClusters;
    }
    if (tabId === 'CLOUD_STORAGE') {
      return overview?.summary?.liveBucketsCount ?? overview?.summary?.storageBuckets;
    }
    if (tabId === 'BIGQUERY_STUDIO') {
      return overview?.summary?.liveDatasetsCount ?? overview?.summary?.bigqueryDatasets;
    }
    if (tabId === 'MCP_HUB') {
      return 48;
    }
    if (tabId === 'LOCAL_EMULATORS') {
      return 5;
    }
    if (tabId === 'CLOUD_NEXUS') {
      return '2-IN-1';
    }
    return null;
  };

  const filteredProjectsList = (contextData.projects || []).filter((proj) => {
    const q = projectSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      String(proj.projectId || '').toLowerCase().includes(q) ||
      String(proj.name || '').toLowerCase().includes(q) ||
      String(proj.projectNumber || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#090b10] text-zinc-950 dark:text-zinc-50 transition-colors duration-300">
      <div
        className={
          mobilePreview
            ? 'max-w-[430px] mx-auto my-4 border-[6px] border-zinc-200 dark:border-[#262e42] rounded-[40px] shadow-2xl overflow-hidden bg-[#f4f6f9] dark:bg-[#090b10] min-h-[860px] flex flex-col relative'
            : 'w-full max-w-none pb-20 md:pb-9'
        }
      >
        {mobilePreview && (
          <div className="bg-white dark:bg-[#0c0f16] text-zinc-800 dark:text-zinc-200 px-6 py-2 flex items-center justify-between text-[11px] font-mono border-b border-zinc-200 dark:border-[#1e2433]">
            <span>
              {liveShortClockText} {shortTzName} · GCP 5G+
            </span>
            <div className="w-24 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center gap-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>LIVE OAUTH</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-zinc-400" />
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        )}

        {/* Slim 3-Zone Cloud Command Header (hidden in Full-Bleed Zen Canvas Alt+Z) */}
        {!zenMode && (
        <header className="sticky top-0 z-40 border-b border-zinc-200/80 dark:border-[#1a2130] bg-white/95 dark:bg-[#0c0f16]/95 backdrop-blur-md px-4 sm:px-5 py-2">
          {/* Primary Command Row: [Left: Rail + Brand + Project Context] · [Center: Omnibox Search] · [Right: Telemetry + Actions] */}
          <div className="relative z-50 flex items-center justify-between gap-2.5 flex-wrap sm:flex-nowrap">
            {/* LEFT ZONE: Rail Toggle + Brand Mark + Searchable Active GCP Project Switcher */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                data-feature-id="RAIL_TOGGLE"
                onClick={handleToggleSidebarCollapsed}
                title={
                  sidebarCollapsed
                    ? 'Expand Left Architectural Navigation Rail (Shortcut: [)'
                    : 'Collapse Left Architectural Navigation Rail to Icon Mode (Shortcut: [)'
                }
                className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151a25] dark:hover:bg-[#1e2636] border border-zinc-300 dark:border-[#262e42] text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                data-feature-id="OVERVIEW"
                onClick={() =>
                  handleNavigateStudioTab('OVERVIEW', null, null, {
                    skipConfirm: true,
                  })
                }
                title="CloudPulse 2026 — Return to Project Overview & Resource Control Center"
                className="flex items-center gap-2 min-w-0 text-left bg-transparent border-none p-0 shadow-none cursor-pointer group"
              >
                <div className="w-8 h-8 rounded bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/30 group-hover:border-blue-500/60 flex items-center justify-center shrink-0 transition-colors">
                  <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="hidden sm:block min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                      CloudPulse
                    </span>
                  </div>
                  <div
                    data-gde-ignore="true"
                    className="text-[10px] text-zinc-500 dark:text-[#7c879c] font-mono truncate max-w-[160px]"
                  >
                    {gdePrivacyConfig.enabled
                      ? redactTextForGdeMode(
                          contextData.account,
                          gdePrivacyConfig,
                          {
                            accountEmail: contextData.account,
                            projects: contextData.projects,
                          }
                        )
                      : contextData.account}
                  </div>
                </div>
              </button>

              <span className="hidden sm:inline text-zinc-300 dark:text-[#262e42] select-none font-light text-lg">
                /
              </span>

              {/* Searchable Live GCP Project Context Switcher */}
              <div className={`relative shrink-0 ${projectMenuOpen ? 'z-[70]' : 'z-50'}`}>
                <button
                  type="button"
                  data-feature-id="PROJECT_SWITCHER_TRIGGER"
                  onClick={() => {
                    const nextOpen = !projectMenuOpen;
                    setProjectMenuOpen(nextOpen);
                    if (nextOpen) {
                      setProjectSearchQuery('');
                      if ((contextData.projects?.length || 0) <= 1) {
                        handleRefreshProjectsList();
                      }
                    }
                  }}
                  title={`Active GCP Project: ${selectedProjectId} — Click to filter & switch between your authenticated Google Cloud projects`}
                  className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151a25] dark:hover:bg-[#1e2636] text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-[#262e42] rounded-md px-2.5 h-8 text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="max-w-[130px] sm:max-w-[175px] truncate">
                    {selectedProjectId}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
                </button>

                {projectMenuOpen && (
                  <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-[#10141d] shadow-2xl border border-zinc-200 dark:border-[#262e42] rounded-lg py-1.5 z-[80] overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 dark:text-[#7c879c] border-b border-zinc-100 dark:border-[#1e2433] flex items-center justify-between gap-2">
                      <span>
                        GCP Projects ({contextData.projects?.length || 1})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefreshProjectsList();
                        }}
                        className="px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 font-bold text-[10px] cursor-pointer normal-case inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Sync Projects</span>
                      </button>
                    </div>
                    {(contextData.projects?.length || 0) > 2 && (
                      <div className="p-2 border-b border-zinc-100 dark:border-[#1e2433]">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={projectSearchQuery}
                            onChange={(e) => setProjectSearchQuery(e.target.value)}
                            placeholder="Filter project ID or number..."
                            aria-label="Filter GCP projects"
                            className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono rounded bg-zinc-50 dark:bg-[#07090d] border border-zinc-200 dark:border-[#263044] text-zinc-900 dark:text-zinc-100 focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                    <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-[#1e2433]/60">
                      {filteredProjectsList.length === 0 ? (
                        <div className="px-3.5 py-4 text-center text-xs text-zinc-500">
                          No projects match &ldquo;{projectSearchQuery}&rdquo;
                        </div>
                      ) : (
                        filteredProjectsList.map((proj) => (
                          <button
                            key={proj.projectId}
                            type="button"
                            onClick={() => {
                              sessionStorage.setItem(
                                'cloudpulse_project',
                                proj.projectId
                              );
                              sessionStorage.setItem(
                                'cloudpulse_project_explicit',
                                'true'
                              );
                              sessionStorage.setItem(
                                'cloudpulse_user_selected_project_v2',
                                proj.projectId
                              );
                              try {
                                localStorage.setItem(
                                  'cloudpulse_project',
                                  proj.projectId
                                );
                                localStorage.setItem(
                                  'cloudpulse_project_explicit',
                                  'true'
                                );
                                localStorage.setItem(
                                  'cloudpulse_user_selected_project_v2',
                                  proj.projectId
                                );
                              } catch {
                                // ignore
                              }
                              setSelectedProjectId(proj.projectId);
                              setProjectMenuOpen(false);
                              showToast(
                                `Switched live GCP project to ${proj.projectId}`
                              );
                            }}
                            title={`Switch active telemetry & control plane to project ${proj.projectId} (${proj.name})`}
                            className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                              selectedProjectId === proj.projectId
                                ? 'bg-amber-500/12 text-zinc-950 dark:text-white font-semibold'
                                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#151a25]'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="font-mono truncate">{proj.projectId}</div>
                              <div className="text-[10px] text-zinc-500 dark:text-[#7c879c] truncate">
                                {proj.name} · #{proj.projectNumber}
                              </div>
                            </div>
                            {selectedProjectId === proj.projectId && (
                              <Check className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setKeynoteAutopilotOpen(true)}
                title="Open Keynote Autopilot (Shortcut: Alt+K)"
                className="hidden xl:inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-[#151a25] px-2 h-8 rounded-md shrink-0 cursor-pointer transition-colors"
              >
                <span>Keynote</span>
              </button>

              {gdePrivacyConfig.enabled && (
                <span
                  title="GDE Streamer & Tutorial Privacy Mode is active (Shortcut: Alt+G)"
                  className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>GDE SHIELD</span>
                </span>
              )}
            </div>

            {/* CENTER ZONE: Raycast / Pantheon Global Omnibox Search & Voice Ops Bar */}
            {!mobilePreview && (
              <div className="hidden lg:flex flex-1 max-w-md xl:max-w-lg mx-2">
                <button
                  type="button"
                  data-feature-id="CMD_PALETTE"
                  onClick={() => setCommandPaletteOpen(true)}
                  title="Open Global Cloud Command, Search & Voice Ops Palette (Shortcut: Cmd+K or Ctrl+K)"
                  className="w-full h-8 px-3 rounded-md bg-zinc-100/90 hover:bg-zinc-200/70 dark:bg-[#07090d] dark:hover:bg-[#111622] border border-zinc-300/90 dark:border-[#263044] hover:border-blue-500/50 dark:hover:border-blue-500/50 flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-[#8b95a5] transition-all cursor-pointer shadow-inner"
                >
                  <span className="flex items-center gap-2 min-w-0 truncate">
                    <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-[#647087] shrink-0" />
                    <span className="truncate">
                      Search studios, live GCP resources, or run ops...
                    </span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <kbd className="cp-kbd">⌘K</kbd>
                  </span>
                </button>
              </div>
            )}

            {/* RIGHT ZONE: Live Burn Ticker + Shield + Cockpit Tools + Provision CTA + Sync + Viewport/Theme */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              {/* Compact ⌘K button for < lg viewports or mobile preview */}
              <button
                type="button"
                data-feature-id="CMD_PALETTE"
                onClick={() => setCommandPaletteOpen(true)}
                title="Open ⌘K Natural Language & Voice-to-Cloud Command Palette (Shortcut: Ctrl+K or Cmd+K)"
                className={`${
                  mobilePreview ? 'inline-flex' : 'inline-flex lg:hidden'
                } items-center gap-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151a25] dark:hover:bg-[#1e2636] text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-[#262e42] rounded-md px-2.5 h-8 text-[11px] font-mono font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer`}
              >
                <Search className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>⌘K</span>
              </button>

              {/* Live Burn-Rate Radar Ticker Pill */}
              <button
                type="button"
                data-feature-id="BURN_RATE_TICKER"
                onClick={() =>
                  handleNavigateStudioTab('INNOVATION_LAB', 'FINOPS_SLEEP', {
                    targetLabel: '2026 Innovation Lab → Night-Mode FinOps Sleep Switch',
                    badgeText: 'FinOps Night-Mode Sleep Switch',
                  })
                }
                title="Open Live Wallet Burn-Rate Radar & Night-Mode FinOps Sleep Switch"
                className="inline-flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151a25] dark:hover:bg-[#1e2636] text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-[#262e42] rounded-md px-2.5 h-8 text-[11px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>${liveBurn.hourly.toFixed(4)}/hr</span>
              </button>

              {/* GDE Streamer & Tutorial Privacy Shield */}
              <GdeStreamerPrivacyShield
                config={gdePrivacyConfig}
                onChangeConfig={setGdePrivacyConfig}
                accountEmail={contextData.account}
                projects={contextData.projects}
                selectedProjectId={selectedProjectId}
              />

              {/* Progressive Disclosure Toggle for Secondary Cockpit Tools & Telemetry */}
              <button
                type="button"
                onClick={() => setHeaderToolsExpanded((v) => !v)}
                title="Expand or collapse Cockpit Telemetry, Flight Recorder, Auto-Pilot Guard, 10-Persona Board, SDK 592 Lab & Timezone controls"
                className={`inline-flex items-center gap-1 rounded-md px-2.5 h-8 text-[11px] font-mono font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  headerToolsExpanded || activeOrbitalDrawer
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151a25] dark:hover:bg-[#1e2636] text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-[#262e42]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Cockpit</span>
                {headerToolsExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                )}
              </button>

              {/* Primary Provision CTA */}
              <button
                type="button"
                onClick={() => handleOpenProvision('COMPUTE_VM')}
                title="Provision a live GCP resource (1. Compute Engine VM [Default], 2. VPC Network, 3. Firewall Rule, 4. Cloud Run Service, 5. GKE Cluster, 6. Cloud SQL / AlloyDB, 7. Cloud Storage Bucket, or 8. BigQuery Dataset)"
                className="inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 rounded-md px-3 h-8 text-xs font-extrabold tracking-tight transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Provision</span>
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                disabled={loadingOverview}
                onClick={() => {
                  fetchProjectOverview(selectedProjectId, { force: true });
                  setVmRefreshTrigger((c) => c + 1);
                }}
                title={`Refresh live GCP telemetry, VMs, Cloud Run services, Storage buckets, and VPCs for ${selectedProjectId}`}
                aria-label="Refresh GCP telemetry"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-white dark:bg-[#151a25] hover:bg-zinc-50 dark:hover:bg-[#1e2636] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-[#262e42] transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ${
                    loadingOverview ? 'animate-spin text-blue-500' : ''
                  }`}
                />
              </button>

              {/* Responsive Mobile / Desktop PWA Preview Toggle */}
              <button
                type="button"
                data-feature-id="MOBILE_PREVIEW_TOGGLE"
                onClick={() => setMobilePreview((v) => !v)}
                title={
                  mobilePreview
                    ? 'Exit Mobile PWA Simulator & Return to Full Widescreen Control Plane'
                    : 'Preview Responsive Mobile PWA Frame (430px iPhone / Android Cockpit)'
                }
                aria-label="Toggle Mobile PWA Frame Preview"
                className={`hidden md:inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors shrink-0 cursor-pointer ${
                  mobilePreview
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white dark:bg-[#151a25] hover:bg-zinc-50 dark:hover:bg-[#1e2636] text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-[#262e42]'
                }`}
              >
                {mobilePreview ? (
                  <Monitor className="w-3.5 h-3.5" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                )}
              </button>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={
                  isDark
                    ? 'Switch to Daylight High-Contrast Mode'
                    : 'Switch to 2026 Obsidian Dark Cockpit Mode'
                }
                aria-label="Toggle Dark or Light Mode"
                className="h-8 w-8 inline-flex items-center justify-center rounded-md bg-white dark:bg-[#151a25] hover:bg-zinc-50 dark:hover:bg-[#1e2636] text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-[#262e42] transition-colors shrink-0 cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </button>
            </div>
          </div>

          {/* Secondary Telemetry & Cockpit Controls Bar (Collapsible via "Cockpit Tools" button; stays mounted in DOM) */}
          <div
            className={`relative z-30 items-center justify-between gap-1.5 lg:flex-nowrap flex-wrap mt-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 ${
              headerToolsExpanded ? 'flex' : 'hidden'
            }`}
          >
            <div className="flex items-center gap-1.5 lg:flex-nowrap flex-wrap min-w-0">
              {/* 1-Click Overview Button */}
              <button
                type="button"
                data-feature-id="OVERVIEW"
                onClick={() => handleNavigateStudioTab('OVERVIEW')}
                title="Open Project Overview, Resource Lineage & Stale/Orphaned Resource Detector"
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-blue-600 text-white border-blue-400/40'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Overview</span>
              </button>

              {/* 1-Click 10-Persona Enterprise Architecture Board Launcher */}
              <button
                type="button"
                onClick={() =>
                  handleNavigateStudioTab('INNOVATION_LAB', 'FIVE_PERSONA_COUNCIL', {
                    targetLabel: '2026 Innovation Lab → 10-Persona Enterprise Architecture Board',
                    badgeText: '10-Persona Architecture Board',
                  })
                }
                title="Open 10-Persona Enterprise Architecture Board & Pre-Flight War-Room"
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>10-Persona Board</span>
              </button>

              {/* 1-Click [GA/BETA/ALPHA] gcloud 592.0.0 Frontier Lab Launcher */}
              <button
                type="button"
                onClick={() =>
                  handleNavigateStudioTab('INNOVATION_LAB', 'GCLOUD_ALPHA_BETA', {
                    targetLabel: '2026 Innovation Lab → gcloud SDK 592.0.0 Frontier Lab',
                    badgeText: 'gcloud SDK 592.0.0 Lab',
                  })
                }
                title="Open [GA/BETA/ALPHA] gcloud 592.0.0 Frontier Lab"
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>SDK 592.0.0 Lab</span>
              </button>

              {/* 1-Click 30-Day Cloud Recycle Bin Launcher */}
              <button
                type="button"
                data-feature-id="RECYCLE_BIN"
                onClick={() => handleNavigateStudioTab('RECYCLE_BIN')}
                title="Open 30-Day Cloud Recycle Bin"
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-bold transition-colors cursor-pointer whitespace-nowrap border ${
                  activeTab === 'RECYCLE_BIN'
                    ? 'bg-blue-600 text-white border-blue-400/40'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Recycle Bin</span>
              </button>

              {/* 1-Click Docs & Architecture Guide Button */}
              <button
                type="button"
                data-feature-id="DOCS_GUIDE"
                onClick={() => handleNavigateStudioTab('DOCS_GUIDE')}
                title="Interactive Architecture Documentation, Security Model & Feature Walkthrough Guide"
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  activeTab === 'DOCS_GUIDE'
                    ? 'bg-blue-600 text-white border-blue-400/40'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Docs</span>
              </button>

              {/* Cloud Billing Account & Promotional Credits Pill */}
              <button
                type="button"
                onClick={() =>
                  handleNavigateStudioTab('FINOPS', null, {
                    targetElementId: 'finops-billing-guardian-section',
                    targetLabel: 'FinOps Studio → Billing Account & Promotional Credits Guardian',
                    badgeText: 'Billing & Promotional Credits Guardian',
                  })
                }
                title="Open Cloud Billing Account & Promotional Credits Guardian"
                className={`inline-flex items-center gap-1 rounded-[8px] px-2 py-1.5 text-[11px] font-mono font-bold transition-colors shadow-sm border cursor-pointer whitespace-nowrap shrink-0 ${
                  gdeSummary.hasImportedCredits &&
                  gdeSummary.nearestExpiryDays !== null &&
                  gdeSummary.nearestExpiryDays <= 14 &&
                  gdeSummary.totalRemainingUsd > 0
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : gdeSummary.hasImportedCredits ||
                      gdeSummary.liveCostMetrics?.hasLiveRows
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {gdeSummary.hasImportedCredits &&
                gdeSummary.urgentWarningsCount > 0 &&
                gdeSummary.totalRemainingUsd > 0 ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>
                  {gdePrivacyConfig.enabled &&
                  gdePrivacyConfig.hideCreditBalances !== false
                    ? 'Bonus: $•••.••'
                    : gdeSummary.hasImportedCredits
                      ? `Bonus: $${gdeSummary.totalRemainingUsd.toLocaleString(
                          'en-US',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}`
                      : 'Bonus: $0.00'}
                </span>
              </button>

              {/* Reincarnated Orbital Telemetry & Zero-Mock Control-Plane Triggers */}
              {(() => {
                const orb = computeOrbitalTelemetry(overview);
                return (
                  <>
                    <button
                      type="button"
                      data-feature-id="CFE_POSTURE"
                      onClick={() => handleNavigateStudioTab('GLOBAL_MAP')}
                      title="Live Grid Carbon-Free Energy (CFE%) & Zero-Trust Posture Grade — Click to open 40-Region Global Map"
                      className="hidden xl:inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>CFE {orb.avgCfe}%</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        · Grade {orb.postureGrade}
                      </span>
                    </button>

                    <button
                      type="button"
                      data-feature-id="STACK_COMPOSER"
                      onClick={() =>
                        setActiveOrbitalDrawer((cur) =>
                          cur === 'STACK_COMPOSER' ? null : 'STACK_COMPOSER'
                        )
                      }
                      title="1-Tap 3-Tier Cloud Stack Synthesizer (Provisions GCS Bucket + BigQuery Dataset + Cloud Run Gen2 Service)"
                      className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold border transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer ${
                        activeOrbitalDrawer === 'STACK_COMPOSER'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <Wand2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>1-Tap Stack</span>
                    </button>

                    <button
                      type="button"
                      data-feature-id="FLIGHT_RECORDER"
                      onClick={() =>
                        setActiveOrbitalDrawer((cur) =>
                          cur === 'FLIGHT_RECORDER' ? null : 'FLIGHT_RECORDER'
                        )
                      }
                      title="Open Cloud Flight Recorder & 1-Tap Mutation Time-Machine"
                      className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold border transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer ${
                        activeOrbitalDrawer === 'FLIGHT_RECORDER'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                      <span>Flight Recorder</span>
                    </button>

                    <button
                      type="button"
                      data-feature-id="AUTOPILOT_GUARD"
                      onClick={() =>
                        setActiveOrbitalDrawer((cur) =>
                          cur === 'AUTOPILOT_GUARD' ? null : 'AUTOPILOT_GUARD'
                        )
                      }
                      title="Open Real Autonomous FinOps & Zero-Trust Control-Plane Enforcer (Scale-to-Zero, 12-Invariant Self-Healer & Night-Mode Sleep)"
                      className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold border transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer ${
                        activeOrbitalDrawer === 'AUTOPILOT_GUARD'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Auto-Pilot Guard</span>
                    </button>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-1.5 lg:flex-nowrap flex-wrap shrink-0">
              {/* Global UI Timezone & Live Clock Selector Pill */}
              <TimezoneSelectorPill onShowToast={showToast} />

              {/* Cross-UI Target Spotlight Toggle Button */}
              <button
                type="button"
                data-feature-id="SPOTLIGHT_GUIDE_TOGGLE"
                onClick={() => {
                  const nextVal = !featureSpotlightEnabled;
                  setFeatureSpotlightEnabled(nextVal);
                  try {
                    localStorage.setItem(
                      'cloudpulse_feature_spotlight_v1',
                      nextVal ? 'true' : 'false'
                    );
                  } catch {
                    // ignore
                  }
                  if (!nextVal) {
                    setActiveSpotlightBanner(null);
                    document
                      .querySelectorAll(
                        '.cloudpulse-target-spotlight-active, .cloudpulse-nav-spotlight-active'
                      )
                      .forEach((el) => {
                        el.classList.remove(
                          'cloudpulse-target-spotlight-active',
                          'cloudpulse-nav-spotlight-active'
                        );
                        el.removeAttribute('data-spotlight-badge');
                      });
                  }
                  showToast(
                    nextVal
                      ? 'Cross-UI Feature Spotlight ENABLED — Jumping between Studios will highlight the destination feature & show a return breadcrumb.'
                      : 'Cross-UI Feature Spotlight disabled.'
                  );
                }}
                title="Toggle Temporary Cross-UI Feature Spotlight & Return Breadcrumb when clicking features that jump to another Studio"
                className={`inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold border transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0 ${
                  featureSpotlightEnabled
                    ? 'bg-blue-600/15 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/50 hover:bg-blue-600/25'
                    : 'bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Spotlight: {featureSpotlightEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {/* 1-Tap Project Health, Drift & FinOps Scanner Button */}
              <button
                type="button"
                data-feature-id="HEALTH_DRIFT"
                onClick={() => handleOpenCopilotWithPrompt('')}
                title="Run 1-Tap Project Health, Zombie Waste, Firewall Perimeter & Live Pricing Drift Scan"
                className="inline-flex items-center gap-1.5 bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-[11px] font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>Health &amp; Drift</span>
              </button>

              {/* Disconnect / Switch Account Button */}
              <button
                type="button"
                onClick={handleDisconnect}
                title="Disconnect active session & switch Google Cloud account"
                className="inline-flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span className="hidden xl:inline">Disconnect</span>
              </button>
            </div>
          </div>

        </header>
        )}

        {/* Architectural Control Plane Shell: Left Domain Rail + Main Workspace */}
        <div className="flex items-start min-h-[calc(100vh-3.25rem)]">
          {/* Smart Left Architectural Navigation Rail (Pantheon / Linear / Cloudflare Zero-Trust Style) */}
          {!mobilePreview && !zenMode && (
            <aside
              aria-label="Google Cloud Architectural Studios Navigation"
              className={`hidden md:flex flex-col shrink-0 sticky top-[52px] h-[calc(100vh-76px)] overflow-y-auto border-r border-zinc-200/80 dark:border-[#1a2130] bg-white dark:bg-[#0b0f17] select-none transition-all duration-150 ${
                sidebarCollapsed ? 'w-14' : 'w-64'
              }`}
            >
              {/* Inline Quick Studio Filter (Expanded Mode) */}
              {!sidebarCollapsed && (
                <div className="p-2.5 pb-1.5 sticky top-0 z-10 bg-white/95 dark:bg-[#0c0f16]/95 backdrop-blur-xs border-b border-zinc-100 dark:border-[#1e2433]/70">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-[#647087] absolute left-2.5 pointer-events-none" />
                    <input
                      ref={railSearchInputRef}
                      type="text"
                      value={railSearchQuery}
                      onChange={(e) => setRailSearchQuery(e.target.value)}
                      placeholder="Filter 26 studios..."
                      aria-label="Filter engineering studios"
                      className="w-full h-7 pl-7 pr-7 text-[11px] rounded bg-zinc-100/80 dark:bg-[#07090d] border border-zinc-200 dark:border-[#263044] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-[#647087] focus:outline-none"
                    />
                    {railSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => setRailSearchQuery('')}
                        title="Clear studio filter"
                        className="cp-nav-rail-item absolute right-1.5 p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 bg-transparent border-none shadow-none cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <kbd className="cp-kbd absolute right-1.5 pointer-events-none text-[9px] px-1 py-0">
                        /
                      </kbd>
                    )}
                  </div>
                </div>
              )}

              <div className="py-2 space-y-3 flex-1 overflow-y-auto">
                {/* Pinned / Favorite Studios Quick-Jump Group */}
                {!sidebarCollapsed &&
                  !railSearchQuery.trim() &&
                  pinnedStudios.length > 0 && (
                    <div className="space-y-0.5 pb-2 border-b border-zinc-100 dark:border-[#1e2433]/80">
                      <div className="px-3 pb-1 flex items-center justify-between text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400/90">
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Pinned Studios</span>
                        </span>
                        <span className="text-[9px] text-zinc-400 dark:text-[#647087]">
                          {pinnedStudios.length}
                        </span>
                      </div>
                      {pinnedStudios
                        .map((id) => navTabs.find((t) => t.id === id))
                        .filter(Boolean)
                        .map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          const countBadge = getTabResourceCount(tab.id);
                          return (
                            <div
                              key={`pin-${tab.id}`}
                              className={`group flex items-center pr-1.5 border-l-2 transition-colors ${
                                isActive
                                  ? 'border-l-amber-500 bg-amber-500/15'
                                  : 'border-l-transparent hover:bg-amber-500/[0.06]'
                              }`}
                            >
                              <button
                                type="button"
                                data-feature-id={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.tip}
                                className={`cp-nav-rail-item flex-1 min-w-0 flex items-center justify-between pl-3 pr-1 h-7 text-[12px] bg-transparent border-none shadow-none cursor-pointer ${
                                  isActive
                                    ? 'text-zinc-950 dark:text-white font-semibold'
                                    : 'text-zinc-700 dark:text-[#b0bac9] hover:text-zinc-950 dark:hover:text-white font-medium'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <Icon
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isActive
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-zinc-400 dark:text-[#7c879c]'
                                    }`}
                                  />
                                  <span className="truncate">{tab.label}</span>
                                </span>
                                {countBadge !== null && countBadge !== undefined && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                                      isActive
                                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold'
                                        : 'text-zinc-400 dark:text-[#647087]'
                                    }`}
                                  >
                                    {countBadge}
                                  </span>
                                )}
                              </button>
                              <button
                                type="button"
                                data-feature-id="RAIL_PIN_STUDIO"
                                onClick={(e) => handleTogglePinStudio(tab.id, e)}
                                title={`Unpin ${tab.label} from top of navigation rail`}
                                className="cp-nav-rail-item p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 text-amber-500 hover:text-amber-400 bg-transparent border-none shadow-none cursor-pointer transition-opacity shrink-0"
                              >
                                <Star className="w-3 h-3 fill-current" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  )}

                {/* 5 Domain Groups (Collapsible + Instant Filter) */}
                {[
                  { id: 'COMMAND', title: 'Command & Global' },
                  { id: 'INFRA_COMPUTE', title: 'Compute, VPC & Storage' },
                  { id: 'DATA_AI', title: 'Data & Lakehouse' },
                  { id: 'SECURITY_SRE', title: 'Security, IAM & SRE' },
                  { id: 'OPS_DOCS', title: 'FinOps, Logs & Docs' },
                ].map((section) => {
                  const q = railSearchQuery.trim().toLowerCase();
                  const groupTabs = navTabs.filter((t) => {
                    if (t.group !== section.id) return false;
                    if (!q) return true;
                    return (
                      t.label.toLowerCase().includes(q) ||
                      t.id.toLowerCase().includes(q) ||
                      String(t.tip || '').toLowerCase().includes(q)
                    );
                  });
                  if (!groupTabs.length) return null;
                  const isGroupCollapsed =
                    !sidebarCollapsed && !q && Boolean(collapsedRailGroups[section.id]);

                  return (
                    <div key={section.id} className="space-y-0.5">
                      {!sidebarCollapsed && (
                        <button
                          type="button"
                          onClick={() => handleToggleRailGroup(section.id)}
                          title={`Toggle ${section.title} section`}
                          className="cp-nav-rail-item w-full px-3 py-1 flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-[#647087] hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent border-none shadow-none cursor-pointer"
                        >
                          <span className="inline-flex items-center gap-1.5">
                            <span>{section.title}</span>
                            {isGroupCollapsed && (
                              <span className="text-[9.5px] font-mono font-normal px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-[#151a25] text-zinc-400 dark:text-[#647087]">
                                {groupTabs.length}
                              </span>
                            )}
                          </span>
                          <ChevronDown
                            className={`w-3 h-3 transition-transform ${
                              isGroupCollapsed ? '-rotate-90' : ''
                            }`}
                          />
                        </button>
                      )}
                      {!isGroupCollapsed &&
                        groupTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          const isPinned = pinnedStudios.includes(tab.id);
                          const countBadge = getTabResourceCount(tab.id);

                          if (sidebarCollapsed) {
                            return (
                              <button
                                key={tab.id}
                                type="button"
                                data-feature-id={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.tip}
                                className={`cp-nav-rail-item w-full flex items-center justify-center px-0 h-8 text-[12px] border-l-2 transition-colors cursor-pointer ${
                                  isActive
                                    ? 'border-l-amber-500 bg-amber-500/15 text-zinc-950 dark:text-white font-semibold'
                                    : 'border-l-transparent text-zinc-600 dark:text-[#8b95a5] hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-amber-500/[0.06] font-medium'
                                }`}
                              >
                                <Icon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isActive
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-zinc-400 dark:text-[#687387]'
                                  }`}
                                />
                              </button>
                            );
                          }

                          return (
                            <div
                              key={tab.id}
                              className={`group flex items-center pr-1.5 border-l-2 transition-colors ${
                                isActive
                                  ? 'border-l-amber-500 bg-amber-500/15'
                                  : 'border-l-transparent hover:bg-amber-500/[0.06]'
                              }`}
                            >
                              <button
                                type="button"
                                data-feature-id={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                title={tab.tip}
                                className={`cp-nav-rail-item flex-1 min-w-0 flex items-center justify-between pl-3 pr-1 h-9 text-[13px] bg-transparent border-none shadow-none cursor-pointer ${
                                  isActive
                                    ? 'text-zinc-950 dark:text-white font-semibold'
                                    : 'text-zinc-600 dark:text-[#b0bac9] hover:text-zinc-950 dark:hover:text-zinc-100 font-medium'
                                }`}
                              >
                                <span className="flex items-center gap-2.5 min-w-0">
                                  <Icon
                                    className={`w-3.5 h-3.5 shrink-0 ${
                                      isActive
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-zinc-400 dark:text-[#687387]'
                                    }`}
                                  />
                                  <span className="truncate">{tab.label}</span>
                                </span>
                                {countBadge !== null && countBadge !== undefined && (
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono tabular-nums ${
                                      isActive
                                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 font-semibold'
                                        : 'text-zinc-400 dark:text-[#647087]'
                                    }`}
                                  >
                                    {countBadge}
                                  </span>
                                )}
                              </button>
                              <button
                                type="button"
                                data-feature-id="RAIL_PIN_STUDIO"
                                onClick={(e) => handleTogglePinStudio(tab.id, e)}
                                title={
                                  isPinned
                                    ? `Unpin ${tab.label} from Pinned Studios`
                                    : `Pin ${tab.label} to top of navigation rail`
                                }
                                className={`cp-nav-rail-item p-1 rounded bg-transparent border-none shadow-none cursor-pointer transition-opacity shrink-0 ${
                                  isPinned
                                    ? 'opacity-80 hover:opacity-100 text-amber-500'
                                    : 'opacity-0 group-hover:opacity-100 focus:opacity-100 text-zinc-400 hover:text-amber-500'
                                }`}
                              >
                                <Star
                                  className={`w-3 h-3 ${
                                    isPinned ? 'fill-current' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>

              {/* Rail Footer: Collapse / Expand Toggle with Shortcut Hint */}
              <div className="p-2 border-t border-zinc-200 dark:border-[#1e2433]">
                <button
                  type="button"
                  data-feature-id="RAIL_TOGGLE"
                  onClick={handleToggleSidebarCollapsed}
                  title={
                    sidebarCollapsed
                      ? 'Expand Navigation Sidebar (Shortcut: [)'
                      : 'Collapse Navigation Sidebar (Shortcut: [)'
                  }
                  className="cp-nav-rail-item w-full flex items-center justify-between px-2 h-7 rounded text-[11px] font-mono text-zinc-500 dark:text-[#7c879c] hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.04] bg-transparent border-none shadow-none cursor-pointer"
                >
                  <span className="flex items-center gap-1.5 mx-auto sm:mx-0">
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${
                        sidebarCollapsed ? '' : 'rotate-180'
                      }`}
                    />
                    {!sidebarCollapsed && <span>Collapse Rail</span>}
                  </span>
                  {!sidebarCollapsed && <kbd className="cp-kbd text-[9px]">[</kbd>}
                </button>
              </div>
            </aside>
          )}

          {/* Main Content Body */}
          <main
            id="cloudpulse-main-workspace"
            className={`min-w-0 flex-1 overflow-x-hidden px-5 sm:px-8 lg:px-10 py-6 sm:py-8 space-y-7 ${
              zenMode ? 'max-w-[1600px] mx-auto pb-28' : ''
            }`}
          >
            {/* Architectural Workspace Context, Studio History & Telemetry Header */}
            {(() => {
              const currentTabObj =
                navTabs.find((t) => t.id === activeTab) || navTabs[0];
              const CurrentIcon = currentTabObj?.icon || Layers;
              const activeSubLabel = resolveActiveSubTabLabel(activeTab);
              const isPinnedCurrent = pinnedStudios.includes(activeTab);
              const canGoBack = studioHistory.index > 0;
              const canGoForward =
                studioHistory.index < studioHistory.stack.length - 1;
              const groupNameMap = {
                COMMAND: 'Command & Global Edge',
                INFRA_COMPUTE: 'Compute, VPC & Storage',
                DATA_AI: 'Data & Lakehouse',
                SECURITY_SRE: 'Security, IAM & SRE',
                OPS_DOCS: 'FinOps, Logs & Docs',
              };
              const domainLabel =
                groupNameMap[currentTabObj?.group] || 'Google Cloud Control Plane';
              return (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-200 dark:border-[#1e2433]">
                  <div className="flex items-center gap-1.5 min-w-0 text-xs flex-wrap">
                    {/* Browser-Style Back / Forward Studio History Controls */}
                    <div
                      data-action-toolbar="true"
                      className="inline-flex items-center gap-0.5 mr-1"
                    >
                      <button
                        type="button"
                        data-feature-id="STUDIO_HISTORY_BACK"
                        disabled={!canGoBack}
                        onClick={handleStudioHistoryBack}
                        title="Navigate back to previous studio in session history"
                        className="w-6 h-6 inline-flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151a25] dark:hover:bg-[#1e2636] border border-zinc-200 dark:border-[#262e42] text-zinc-600 dark:text-zinc-300 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        data-feature-id="STUDIO_HISTORY_FORWARD"
                        disabled={!canGoForward}
                        onClick={handleStudioHistoryForward}
                        title="Navigate forward to next studio in session history"
                        className="w-6 h-6 inline-flex items-center justify-center rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-[#151a25] dark:hover:bg-[#1e2636] border border-zinc-200 dark:border-[#262e42] text-zinc-600 dark:text-zinc-300 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      data-feature-id="OVERVIEW"
                      onClick={() => setActiveTab('OVERVIEW')}
                      title="Return to Project Overview"
                      className="font-mono text-[11px] text-zinc-500 hover:text-blue-600 dark:text-[#7c879c] dark:hover:text-blue-400 truncate max-w-[160px] bg-transparent border-none shadow-none p-0 cursor-pointer transition-colors"
                    >
                      {selectedProjectId || 'gcp-project'}
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                    <span className="hidden sm:inline text-zinc-500 dark:text-[#8b95a5] font-medium">
                      {domainLabel}
                    </span>
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">
                      /
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-zinc-950 dark:text-zinc-100">
                      <CurrentIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                      <span>{currentTabObj?.label || activeTab}</span>
                    </span>
                    {activeSubLabel && (
                      <>
                        <span className="hidden md:inline text-zinc-300 dark:text-zinc-700">
                          /
                        </span>
                        <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-mono font-semibold bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-500/30 truncate max-w-[240px]">
                          {activeSubLabel}
                        </span>
                      </>
                    )}
                    <button
                      type="button"
                      data-feature-id="RAIL_PIN_STUDIO"
                      onClick={(e) => handleTogglePinStudio(activeTab, e)}
                      title={
                        isPinnedCurrent
                          ? `Unpin ${currentTabObj?.label || activeTab} from Left Rail`
                          : `Pin ${currentTabObj?.label || activeTab} to Pinned Studios in Left Rail`
                      }
                      className={`w-6 h-6 inline-flex items-center justify-center rounded border transition-colors cursor-pointer ${
                        isPinnedCurrent
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-500'
                          : 'bg-zinc-100 dark:bg-[#151a25] border-zinc-200 dark:border-[#262e42] text-zinc-400 hover:text-amber-500'
                      }`}
                    >
                      <Star
                        className={`w-3 h-3 ${
                          isPinnedCurrent ? 'fill-current' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="hidden 2xl:block text-[11px] text-zinc-500 dark:text-[#7c879c] truncate max-w-lg">
                      {currentTabObj?.tip}
                    </p>
                    <span
                      className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        loadingOverview
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                      }`}
                    >
                      <Activity className="w-3 h-3 shrink-0" />
                      <span>
                        {loadingOverview
                          ? 'SYNCING'
                          : overview?.fetchLatencyMs === 0
                            ? 'SWR <16ms'
                            : `${overview?.fetchLatencyMs || 180}ms`}
                      </span>
                    </span>
                    <button
                      type="button"
                      data-feature-id="DOCS_GUIDE"
                      onClick={() => handleNavigateStudioTab('DOCS_GUIDE')}
                      title="Open Interactive Architecture & API Reference"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-semibold text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-[#151a25] border border-zinc-200 dark:border-[#262e42] hover:border-blue-500/40 cursor-pointer shrink-0 transition-colors"
                    >
                      <BookOpen className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>Docs</span>
                    </button>
                  </div>
                </div>
              );
            })()}

          {/* Sticky Cross-UI Feature Spotlight Arrival Beacon & 1-Click Return Breadcrumb */}
          {featureSpotlightEnabled && activeSpotlightBanner && (
            <div
              data-spotlight-breadcrumb="true"
              className="sticky top-14 z-40 rounded-lg border border-amber-500/80 bg-[#0c0f16]/95 text-zinc-100 px-3.5 py-2 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 font-mono text-xs"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-zinc-950 text-[10px] font-extrabold uppercase tracking-wider">
                  SPOTLIGHT TARGET
                </span>
                <span className="text-zinc-300 inline-flex items-center gap-1.5 flex-wrap">
                  <span>Jumped from</span>
                  <strong className="text-blue-300">
                    {navTabs.find((t) => t.id === activeSpotlightBanner.fromTab)
                      ?.label || activeSpotlightBanner.fromTab}
                  </strong>
                  <ArrowRight className="w-3 h-3 text-zinc-500" />
                  <strong className="text-amber-300">
                    {activeSpotlightBanner.targetLabel}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => pulseSpotlightTargetDom(activeSpotlightBanner)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-extrabold cursor-pointer inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Flash Target</span>
                </button>

                {activeSpotlightBanner.fromTab &&
                  activeSpotlightBanner.fromTab !== activeTab && (
                    <button
                      type="button"
                      onClick={() => {
                        const returnTo = activeSpotlightBanner.fromTab;
                        setActiveSpotlightBanner(null);
                        setActiveTab(returnTo);
                      }}
                      className="px-2.5 py-1 rounded bg-[#1a2130] hover:bg-[#232c40] border border-[#323d56] text-zinc-100 text-[10.5px] font-extrabold cursor-pointer inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>
                        Back to{' '}
                        {navTabs.find((t) => t.id === activeSpotlightBanner.fromTab)
                          ?.label || activeSpotlightBanner.fromTab}
                      </span>
                    </button>
                  )}

                <button
                  type="button"
                  onClick={() => setActiveSpotlightBanner(null)}
                  className="px-2 py-1 rounded bg-[#151a25] hover:bg-[#1e2636] text-zinc-400 hover:text-white text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  <span>Dismiss</span>
                </button>
              </div>
            </div>
          )}

          {/* Glassmorphic Toast & Error Notification Stack with Countdown Bar */}
          {(toastMessage || errorBanner) && (
            <div className="fixed bottom-9 right-5 z-[120] flex flex-col items-end gap-2.5 max-w-md w-[calc(100vw-2.5rem)] sm:w-auto pointer-events-none">
              {toastMessage && (
                <div
                  role="status"
                  aria-live="polite"
                  onMouseEnter={pauseToastTimer}
                  onMouseLeave={resumeToastTimer}
                  className="pointer-events-auto relative overflow-hidden w-full bg-[#0c0f16]/95 border border-emerald-500/60 text-emerald-100 rounded-lg px-4 py-3 flex items-start justify-between gap-3 text-xs font-mono shadow-2xl backdrop-blur-md cp-studio-enter"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed break-words">
                      {toastMessage}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      pauseToastTimer();
                      setToastMessage(null);
                    }}
                    title="Dismiss notification"
                    className="p-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-white cursor-pointer shrink-0 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/70 cp-toast-progress" />
                </div>
              )}

              {errorBanner && (
                <div
                  role="alert"
                  onMouseEnter={() => {
                    if (errorTimerRef.current) {
                      clearTimeout(errorTimerRef.current);
                      errorTimerRef.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    if (errorTimerRef.current) {
                      clearTimeout(errorTimerRef.current);
                    }
                    errorTimerRef.current = setTimeout(() => {
                      setRawErrorBanner(null);
                      errorTimerRef.current = null;
                    }, 6000);
                  }}
                  className="pointer-events-auto w-full bg-[#0c0f16]/95 border border-red-500/60 text-red-100 rounded-lg p-3.5 flex flex-col gap-2.5 text-xs font-mono shadow-2xl backdrop-blur-md cp-studio-enter"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed break-words">
                        {errorBanner}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setErrorBanner(null)}
                      title="Dismiss error notification"
                      className="p-1 rounded bg-[#151a25] hover:bg-[#1e2636] text-zinc-300 hover:text-white cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    {(() => {
                      const errText = String(errorBanner || '');
                      const isProjectScopedGcpError =
                        /permission|denied|forbidden|billing|not enabled|403|quota|project/i.test(
                          errText
                        ) &&
                        !/docker|psql|manifest|localhost|127\.0\.0\.1/i.test(
                          errText
                        );
                      if (!isProjectScopedGcpError) return null;
                      const primaryProj =
                        (contextData?.defaultProject &&
                        contextData.defaultProject !== selectedProjectId
                          ? contextData.defaultProject
                          : '') ||
                        contextData?.projects?.find(
                          (p) => p.projectId !== selectedProjectId
                        )?.projectId ||
                        '';
                      if (primaryProj && primaryProj !== selectedProjectId) {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              sessionStorage.setItem(
                                'cloudpulse_project_explicit',
                                'true'
                              );
                              setErrorBanner(null);
                              setSelectedProjectId(primaryProj);
                              showToast(
                                `Switched active project to ${primaryProj}`
                              );
                            }}
                            title={`Switch active GCP project to ${primaryProj}`}
                            className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors cursor-pointer text-[10px]"
                          >
                            Switch to {primaryProj}
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button
                      type="button"
                      onClick={() => fetchProjectOverview(selectedProjectId)}
                      title="Retry fetching live GCP telemetry"
                      className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/35 text-red-300 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setErrorBanner(null)}
                      title="Dismiss banner"
                      className="px-2.5 py-0.5 rounded bg-[#151a25] hover:bg-[#1e2636] text-zinc-300 hover:text-white text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <X className="w-2.5 h-2.5" />
                      <span>Dismiss</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-blocking asynchronous page render: Studios and KPI cards mount immediately (<16ms) while live GCP telemetry streams in the background */}
          <>
              {activeOrbitalDrawer && (
                <OrbitalControlPlaneDrawer
                  activeDrawer={activeOrbitalDrawer}
                  onCloseDrawer={() => setActiveOrbitalDrawer(null)}
                  onSelectDrawer={(d) => setActiveOrbitalDrawer(d)}
                  projectId={selectedProjectId}
                  overview={overview}
                  onRefreshOverview={() => {
                    fetchProjectOverview(selectedProjectId, { force: true });
                    setVmRefreshTrigger((c) => c + 1);
                  }}
                  onDeleteResource={handleDeleteResource}
                  onNavigateTab={handleNavigateStudioTab}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              <div key={activeTab} className="cp-studio-enter">
              {activeTab === 'OVERVIEW' && (
                <StudioWorkspaceTabs
                  studioTitle="Project Overview & Control Center"
                  studioSubtitle="Live KPIs, active GCP resources, enabled APIs, and quick studio navigation."
                  defaultTabId="RESOURCES_KPIS"
                  tabs={[
                    {
                      id: 'RESOURCES_KPIS',
                      label: 'Resources & KPIs',
                      icon: LayoutDashboard,
                      render: () => (
                        <div className="space-y-10">
                          <SpatialOverviewHero
                            projectId={selectedProjectId}
                            overview={overview}
                            liveBurn={liveBurn}
                            onNavigateTab={handleNavigateStudioTab}
                            onOpenProvision={handleOpenProvision}
                            onOpenCommandPalette={() =>
                              setCommandPaletteOpen(true)
                            }
                            onToggleZenMode={() => setZenMode((v) => !v)}
                          />
                          <ResourceControlCenter
                            resources={overview?.resources || []}
                            projectId={selectedProjectId}
                            onTriggerAction={handleTriggerAction}
                            onDeleteResource={handleDeleteResource}
                            actionLoading={actionLoading}
                            onRunInShell={handleRunInShell}
                            onAskCopilot={handleOpenCopilotWithPrompt}
                            onSelectTab={handleNavigateStudioTab}
                          />
                        </div>
                      ),
                    },
                    {
                      id: 'APIS_KILLSWITCH',
                      label: 'Enabled APIs & Kill-Switch',
                      badge: String(overview?.enabledApis?.length || 0),
                      icon: ShieldAlert,
                      render: () => (
                        <div id="emergency-api-killswitch-section">
                          <EmergencyApiKillSwitch
                            projectId={selectedProjectId}
                            enabledApis={overview?.enabledApis || []}
                            onRefresh={() =>
                              fetchProjectOverview(selectedProjectId)
                            }
                            onOpenFinOps={() =>
                              handleNavigateStudioTab('FINOPS')
                            }
                            onNavigateTab={handleNavigateStudioTab}
                            onRunInShell={handleRunInShell}
                            onShowToast={showToast}
                            onShowError={setErrorBanner}
                          />
                        </div>
                      ),
                    },
                    {
                      id: 'STUDIO_DIRECTORY',
                      label: 'All 26 Studios',
                      icon: Layers,
                      render: () => (
                        <div className="bg-white dark:bg-[#10141d] border border-zinc-200 dark:border-[#1e2433] rounded-xl p-5 shadow-sm space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                            {[
                              {
                                domain: 'I. Innovation & Global Edge',
                                color:
                                  'border-zinc-200 dark:border-[#1e2433] bg-zinc-50/50 dark:bg-[#151a25]/60',
                                items: [
                                  { id: 'STARTUP_10X', label: 'Startup 10X', meta: 'Scale & Credit Radar' },
                                  { id: 'INNOVATION_LAB', label: '2026 Innovation', meta: 'Beyond-Console Studios' },
                                  { id: 'MCP_HUB', label: 'MCP Servers', meta: 'Official MCP Hub' },
                                  { id: 'LOCAL_EMULATORS', label: 'Local Emulators', meta: '5 Local $0/hr Emulators' },
                                  { id: 'CLOUD_NEXUS', label: 'Terraform & Vertex', meta: 'Drift & Multi-Model Arena' },
                                  { id: 'GLOBAL_MAP', label: 'Global Map', meta: '40 Regions & Carbon' },
                                ],
                              },
                              {
                                domain: 'II. Compute, VPC & Storage',
                                color:
                                  'border-zinc-200 dark:border-[#1e2433] bg-zinc-50/50 dark:bg-[#151a25]/60',
                                items: [
                                  { id: 'VM_SSH', label: 'VM (GCE)', meta: `${overview?.summary?.liveVmsCount ?? overview?.summary?.totalVms ?? 0} VMs · SSH & CVEs` },
                                  { id: 'VPC_NETWORKS', label: 'VPC', meta: `${overview?.vpcs?.length || 0} VPCs · ${overview?.firewalls?.length || 0} Rules` },
                                  { id: 'CLOUD_RUN', label: 'Cloud Run', meta: `${overview?.cloudRunServices?.length || 0} Services` },
                                  { id: 'GKE_STUDIO', label: 'GKE', meta: 'Autopilot & Spot GPUs' },
                                  { id: 'FUNCTIONS_STUDIO', label: 'Functions', meta: 'Gen2 + Eventarc' },
                                  { id: 'WAVE9_STUDIO', label: 'Cloud Build', meta: 'CI/CD & SLSA-3' },
                                  { id: 'CLOUD_STORAGE', label: 'Cloud Storage', meta: `${overview?.summary?.liveBucketsCount ?? overview?.summary?.storageBuckets ?? 0} Buckets` },
                                ],
                              },
                              {
                                domain: 'III. Databases, Data & AI',
                                color:
                                  'border-zinc-200 dark:border-[#1e2433] bg-zinc-50/50 dark:bg-[#151a25]/60',
                                items: [
                                  { id: 'CLOUD_SQL_STUDIO', label: 'Cloud SQL', meta: 'PG 17 & MySQL 8.4' },
                                  { id: 'ALLOYDB_STUDIO', label: 'AlloyDB', meta: 'PG 18 Express & SCaNN' },
                                  { id: 'DATA_ENGINEER_STUDIO', label: 'Data Engineer', meta: 'Data Fabric & GQL' },
                                  { id: 'MANAGED_SPARK_STUDIO', label: 'Managed Spark', meta: 'Serverless Spark 3.5' },
                                  { id: 'BIGQUERY_STUDIO', label: 'BigQuery', meta: 'SQL, FinOps & Lineage' },
                                  { id: 'BIGLAKE_STUDIO', label: 'BigLake', meta: 'Iceberg REST Catalogs' },
                                  { id: 'WAVE10_FRONTIER', label: 'Spanner', meta: 'Graph & ScaNN RAG' },
                                ],
                              },
                              {
                                domain: 'IV. Zero-Trust IAM & SRE',
                                color:
                                  'border-zinc-200 dark:border-[#1e2433] bg-zinc-50/50 dark:bg-[#151a25]/60',
                                items: [
                                  { id: 'SOVEREIGN_STUDIO', label: 'IAM & Compliance', meta: 'Time-Machine & DORA' },
                                  { id: 'CLOUD_SOC', label: 'Cloud SOC', meta: 'Kill-Chains & SOAR' },
                                  { id: 'SRE_WAR_ROOM', label: 'SRE War-Room', meta: 'SLOs, SCC v2 & PAM' },
                                  { id: 'AWS_AZURE_PARITY', label: 'AWS & Azure Parity', meta: 'Multi-Cloud Bridge' },
                                  { id: 'ALIBABA_HUAWEI_PARITY', label: 'Alibaba & Huawei', meta: 'Hyperscale Parity' },
                                ],
                              },
                              {
                                domain: 'V. FinOps, Logs & Docs',
                                color:
                                  'border-zinc-200 dark:border-[#1e2433] bg-zinc-50/50 dark:bg-[#151a25]/60',
                                items: [
                                  { id: 'FINOPS', label: 'FinOps', meta: `$${liveBurn.monthly.toFixed(2)}/mo Run-Rate` },
                                  { id: 'LOGS_SHELL', label: 'Logs & Shell', meta: 'Chrono-Logs & Xterm' },
                                  { id: 'RECYCLE_BIN', label: 'Recycle Bin', meta: '30-Day Restore' },
                                  { id: 'DOCS_GUIDE', label: 'Architecture Docs', meta: 'Interactive Guide' },
                                ],
                              },
                            ].map((group) => (
                              <div
                                key={group.domain}
                                className={`p-3.5 rounded-xl border ${group.color} space-y-2`}
                              >
                                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                                  {group.domain}
                                </div>
                                <div className="space-y-1.5">
                                  {group.items.map((item) => (
                                    <button
                                      key={item.id}
                                      type="button"
                                      data-feature-id={item.id}
                                      onClick={() => handleNavigateStudioTab(item.id)}
                                      className="w-full text-left p-2 rounded-md bg-white/90 dark:bg-[#0c0f16]/90 hover:bg-zinc-100 dark:hover:bg-[#1a2130] border border-zinc-200/80 dark:border-[#262e42] transition-all flex items-center justify-between gap-2 cursor-pointer group"
                                    >
                                      <div className="min-w-0">
                                        <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                          {item.label}
                                        </div>
                                        <div className="text-[10px] font-mono text-zinc-500 dark:text-[#7c879c] truncate">
                                          {item.meta}
                                        </div>
                                      </div>
                                      <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-500 shrink-0" />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="Enterprise Cloud Architecture & Stack Pipeline"
                        chainSummary="IAM & VPC → Compute / GKE / Cloud Run → Storage / Databases / BigQuery → Cloud SOC & SRE"
                      >
                        <EnterpriseStackPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          overview={overview}
                          onOpenProvision={handleOpenProvision}
                          onSelectTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <PersonaContextualHelper
                          persona="ARCHITECT"
                          projectId={selectedProjectId}
                          studioContextLabel="Overview · SPOF Blast-Radius & FinOps"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                        <PersonaContextualHelper
                          persona="CLOUD_ENG"
                          projectId={selectedProjectId}
                          studioContextLabel="Resource Table · .tf Exporter & 5-Gate Pre-Flight"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      </div>
                    </>
                  }
                />
              )}

              {activeTab === 'GLOBAL_MAP' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Multi-Cloud & Global Subsea Fiber Architecture Chain"
                    chainSummary="40 GCP Regions · Subsea Fiber · Cross-Cloud Latency & DR"
                  >
                    <MultiCloudGlobalParityPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onSelectTab={handleNavigateStudioTab}
                      onTestRuleOnGlobalMap={handleTestRuleOnGlobalMap}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <GlobalNetworkWorldMap
                    projectId={selectedProjectId}
                    overview={overview}
                    firewalls={overview?.firewalls || []}
                    vpcs={overview?.vpcs || []}
                    initialXRaySeed={globalMapXRaySeed}
                    onOpenProvision={handleOpenProvision}
                    onRunInShell={handleRunInShell}
                    onOpenLogsExplorer={handleOpenInLogsExplorer}
                    onOpenVpcFirewallStudio={handleOpenInVpcFirewallStudio}
                    onSelectTab={handleNavigateStudioTab}
                    onRefresh={() => fetchProjectOverview(selectedProjectId)}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="NETOPS"
                    projectId={selectedProjectId}
                    studioContextLabel="Global Network World Map · 4-Hop Tracer & IPAM"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'INNOVATION_LAB' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="2026 Beyond-Console Innovation & Multi-Cloud Chain"
                    chainSummary="Reverse-Terraform · Blast-Radius · DLP X-Ray · Gcloud 592"
                  >
                    <MultiCloudGlobalParityPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      activeSubTab={innovationSubTab}
                      onSelectTab={handleNavigateStudioTab}
                      onTestRuleOnGlobalMap={handleTestRuleOnGlobalMap}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <Revolutionary2026Suite
                    projectId={selectedProjectId}
                    overview={overview}
                    initialSubTab={innovationSubTab}
                    subTabNonce={studioSubTabNonce}
                    onSubTabChange={setInnovationSubTab}
                    onRefreshOverview={() => {
                      fetchProjectOverview(selectedProjectId);
                      setVmRefreshTrigger((c) => c + 1);
                    }}
                    onOpenProvision={handleOpenProvision}
                    onDeleteResource={handleDeleteResource}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onOpenTimeMachine={() => handleNavigateStudioTab('TIME_MACHINE')}
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onSelectStudioTab={handleNavigateStudioTab}
                    onSelectProject={(pid) => {
                      sessionStorage.setItem(
                        'cloudpulse_project_explicit',
                        'true'
                      );
                      setSelectedProjectId(pid);
                      showToast(`Switched active project to ${pid}`);
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'STARTUP_10X' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="FinOps, Credit Runway & Cost-Kill Architecture Chain"
                    chainSummary="Billing Budgets · Credit Guardian · Zombie Reaper · CUDs"
                  >
                    <FinOpsCostKillPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <Startup10xMentorStudio
                    projectId={selectedProjectId}
                    onNavigateTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="ARCHITECT"
                    projectId={selectedProjectId}
                    studioContextLabel="Startup 10X Mentor Studio · Scale Readiness, Credit Runway & Launch-Day Guardrails"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'MCP_HUB' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Data Lakehouse, Spark & Agentic AI Architecture Chain"
                    chainSummary="GCS → BigLake → BigQuery → Managed Spark → Vertex AI & MCP"
                  >
                    <DataLakehouseAiPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onOpenProvision={handleOpenProvision}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <GoogleCloudRemoteMcpStudio
                    projectId={selectedProjectId}
                    onShowToast={showToast}
                    onNavigateToStudio={handleNavigateStudioTab}
                    onOpenStorageBucket={(bucketName) => {
                      if (bucketName) {
                        setSelectedStorageBucket(bucketName);
                      }
                      handleNavigateStudioTab('CLOUD_STORAGE', 'OBJECT_WORKBENCH');
                    }}
                  />
                  <PersonaContextualHelper
                    persona="AI_MLOPS"
                    projectId={selectedProjectId}
                    studioContextLabel="MCP & Agent Hub · Model Armor Firewall, Smart Router & RAG Recall"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'LOCAL_EMULATORS' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Local 127.0.0.1 $0.00 Twin -> Cloud Serverless & Database Architecture Chain"
                    chainSummary="Pub/Sub · Firestore · Datastore · Spanner · Bigtable Local Emulators -> Cloud Run & Lakehouse"
                  >
                    <DataLakehouseAiPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onOpenProvision={handleOpenProvision}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <LocalCloudEmulatorsStudio
                    projectId={selectedProjectId}
                    initialSubTab={localEmulatorsSubTab}
                    subTabNonce={studioSubTabNonce}
                    onSubTabChange={setLocalEmulatorsSubTab}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                    onNavigateStudio={handleNavigateStudioTab}
                    onNavigateTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                  />
                  <PersonaContextualHelper
                    persona="CLOUD_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Local Cloud Emulators Studio · $0.00/hr 127.0.0.1 Twin, REST Workbench & Schema Sync"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'CLOUD_NEXUS' && (
                <div className="space-y-4">
                  <CloudFlightDeckNexusStudio
                    projectId={selectedProjectId}
                    onShowToast={showToast}
                    onNavigateStudio={handleNavigateStudioTab}
                  />
                  <PersonaContextualHelper
                    persona="CLOUD_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Cloud Flight-Deck Nexus Studio · Terraform Drift, Blast-Radius Graph, Vertex Arena & Flight Recorder"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'CLOUD_STORAGE' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Data Lakehouse, Storage & AI Architecture Chain"
                    chainSummary="Cloud Storage → BigLake Iceberg → BigQuery → Serverless Spark → Vertex AI"
                  >
                    <DataLakehouseAiPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onOpenProvision={handleOpenProvision}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <CloudStorageStudio
                    projectId={selectedProjectId}
                    initialSubTab={storageSubTab}
                    subTabNonce={studioSubTabNonce}
                    onSubTabChange={setStorageSubTab}
                    initialBucketName={storageTargetBucket}
                    initialObjectName={storageTargetObject}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onRunInShell={handleRunInShell}
                    onRefreshGlobal={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="STORAGE"
                    onRunInShell={handleRunInShell}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="CLOUD_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Cloud Storage Studio · .tf Exporter & Undo Saga"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'BIGQUERY_STUDIO' && (
                <StudioWorkspaceTabs
                  studioTitle="BigQuery Analytics & Lineage Studio"
                  studioSubtitle="Run Dry-Run cost-guarded SQL, inspect Dremel jobs, and trace live Data Lineage blast radius."
                  defaultTabId="SQL_WORKBENCH"
                  externalTabId={
                    bigQuerySubTab === 'DATA_LINEAGE' || bigQuerySubTab === 'SQL_WORKBENCH'
                      ? bigQuerySubTab
                      : undefined
                  }
                  externalTabNonce={studioSubTabNonce}
                  tabs={[
                    {
                      id: 'SQL_WORKBENCH',
                      label: 'SQL Workbench',
                      icon: Database,
                      render: () => (
                        <BigQueryStudio
                          projectId={selectedProjectId}
                          initialSql={bigQueryInitialSql}
                          sqlSeedNonce={bigQuerySqlNonce}
                          initialSubTab={bigQuerySubTab}
                          subTabNonce={studioSubTabNonce}
                          onOpenBigLakeStudio={(sub) =>
                            handleNavigateStudioTab(
                              'BIGLAKE_STUDIO',
                              sub || 'METASTORE_CATALOGS'
                            )
                          }
                          onOpenDataEngineerStudio={(sub) =>
                            handleNavigateStudioTab(
                              'DATA_ENGINEER_STUDIO',
                              sub || 'MEDALLION_ELT'
                            )
                          }
                          onNavigateTab={handleNavigateStudioTab}
                          onOpenHealthAndDrift={() => setCopilotOpen(true)}
                          onOpenTimeMachine={() =>
                            handleNavigateStudioTab('TIME_MACHINE')
                          }
                          onOpenProvision={handleOpenProvision}
                          onRunInShell={handleRunInShell}
                          onRefreshGlobal={() =>
                            fetchProjectOverview(selectedProjectId)
                          }
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                    {
                      id: 'DATA_LINEAGE',
                      label: 'Data Lineage & Blast Radius',
                      icon: Layers,
                      render: () => (
                        <BigQueryDataLineagePanel
                          projectId={selectedProjectId}
                          onOpenBigQuerySql={(sql) => {
                            setBigQuerySubTab('SQL_WORKBENCH');
                            setStudioSubTabNonce((n) => n + 1);
                            handleOpenBigQuerySql(sql);
                          }}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="Data Lakehouse, BigQuery & AI Architecture Chain"
                        chainSummary="GCS → BigLake → BigQuery Capacitor → Serverless Spark → BQML"
                      >
                        <DataLakehouseAiPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          onOpenProvision={handleOpenProvision}
                          onSelectTab={handleNavigateStudioTab}
                          onOpenBigQuerySql={handleOpenBigQuerySql}
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <StudioGcpAdvantageBar
                        projectId={selectedProjectId}
                        studioDomain="BIGQUERY"
                        onRunInShell={handleRunInShell}
                        onLoadBigQuerySql={handleOpenBigQuerySql}
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                      <PersonaContextualHelper
                        persona="DATA_ENG"
                        projectId={selectedProjectId}
                        studioContextLabel="BigQuery Studio · Column Lineage Guard & DLQ Replay"
                        defaultExpanded={false}
                        onOpenFullBoard={(p) =>
                          handleNavigateStudioTab(
                            'INNOVATION_LAB',
                            `FIVE_PERSONA_${p}`
                          )
                        }
                        onOpenBigQuerySql={handleOpenBigQuerySql}
                        onRunInShell={handleRunInShell}
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                    </>
                  }
                />
              )}

              {activeTab === 'BIGLAKE_STUDIO' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Data Lakehouse, BigLake Iceberg & AI Architecture Chain"
                    chainSummary="Cloud Storage → BigLake Metastore → BigQuery → Serverless Spark → Vertex AI"
                  >
                    <DataLakehouseAiPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onOpenProvision={handleOpenProvision}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <BigLakeIcebergStudio
                    projectId={selectedProjectId}
                    initialSubTab={bigLakeSubTab}
                    subTabNonce={studioSubTabNonce}
                    onRunInShell={handleRunInShell}
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onOpenDataEngineerStudio={(sub) =>
                      handleNavigateStudioTab(
                        'DATA_ENGINEER_STUDIO',
                        sub || 'SERVERLESS_SPARK'
                      )
                    }
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onOpenTimeMachine={() => handleNavigateStudioTab('TIME_MACHINE')}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DATA_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="BigLake & Iceberg · Schema Evolution & Spark Offload"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'DATA_ENGINEER_STUDIO' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Data Engineering, Medallion ELT & Spark Architecture Chain"
                    chainSummary="GCS → BigLake → Dataform / dbt → Serverless Spark → BigQuery"
                  >
                    <DataLakehouseAiPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onOpenProvision={handleOpenProvision}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <DataEngineeringStudio
                    projectId={selectedProjectId}
                    initialSubTab={dataEngineerSubTab}
                    subTabNonce={studioSubTabNonce}
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onOpenBigLakeStudio={(sub) =>
                      handleNavigateStudioTab(
                        'BIGLAKE_STUDIO',
                        sub || 'METASTORE_CATALOGS'
                      )
                    }
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onOpenTimeMachine={() => handleNavigateStudioTab('TIME_MACHINE')}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DATA_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Data Engineering Studio · Column Lineage, DLQ & Spark"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'MANAGED_SPARK_STUDIO' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Managed Service for Apache Spark & Lakehouse Architecture Chain"
                    chainSummary="GCS → BigLake → Serverless Spark 3.5 / Lightning Engine → BigQuery"
                  >
                    <DataLakehouseAiPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onOpenProvision={handleOpenProvision}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <ManagedSparkStudio
                    projectId={selectedProjectId}
                    initialSubTab={managedSparkSubTab}
                    subTabNonce={studioSubTabNonce}
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onOpenLogsExplorer={handleOpenInLogsExplorer}
                    onRunInShell={handleRunInShell}
                    onOpenShellWithCommand={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="SPARK"
                    onRunInShell={handleRunInShell}
                    onLoadBigQuerySql={handleOpenBigQuerySql}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DATA_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Managed Service for Apache Spark · Serverless Batches, Spark Connect & RCA"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'ALLOYDB_STUDIO' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="OLTP Database, AlloyDB Express, Sovereign CMEK & Spanner Continuity Chain"
                    chainSummary="AlloyDB Express (PG 18) → SCaNN Vector / Columnar HTAP → pglogical Exit → Sovereign CMEK → Spanner"
                  >
                    <OltpDatabaseContinuityBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenProvision={handleOpenProvision}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <AlloyDbMasteryStudio
                    projectId={selectedProjectId}
                    initialSubTab={alloyDbSubTab}
                    subTabNonce={studioSubTabNonce}
                    onNavigateTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="DATA_ENG"
                      projectId={selectedProjectId}
                      studioContextLabel="AlloyDB Mastery & Express · SCaNN Vector RAG, Columnar HTAP & pglogical"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="SECURITY"
                      projectId={selectedProjectId}
                      studioContextLabel="AlloyDB Sovereign Cloud · CMEK/EKM, pgaudit, Zero-Password IAM & DORA Exit"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'CLOUD_SQL_STUDIO' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="OLTP Database, AlloyDB & Spanner Continuity Chain"
                    chainSummary="Cloud SQL PG 17 / MySQL 8.4 → AlloyDB Vector → Spanner → PITR"
                  >
                    <OltpDatabaseContinuityBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenProvision={handleOpenProvision}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <CloudSqlAndAlloyDbStudio
                    projectId={selectedProjectId}
                    onOpenProvisionCloudSql={() =>
                      handleOpenProvision('CLOUD_SQL')
                    }
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onRunInShell={handleRunInShell}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="DBRE"
                      projectId={selectedProjectId}
                      studioContextLabel="Cloud SQL & AlloyDB · Lock-Tree, Concurrent Index & 1.6s PITR Clone"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="DATA_ENG"
                      projectId={selectedProjectId}
                      studioContextLabel="Cloud SQL & AlloyDB · Federated Lineage & Pre-Flight"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'WAVE9_STUDIO' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="GitOps, Cloud Build & SLSA-3 Release Factory Chain"
                    chainSummary="GitHub OIDC → Cloud Build → Artifact Registry → Cloud Run / GKE"
                  >
                    <GitOpsReleaseFactoryPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      activeSubTab={wave9SubTab}
                      onSelectTab={handleNavigateStudioTab}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <Wave9AiGkeSqlSupplyChainStudio
                    projectId={selectedProjectId}
                    initialSubTab={wave9SubTab}
                    subTabNonce={studioSubTabNonce}
                    onSubTabChange={setWave9SubTab}
                    onSelectTab={handleNavigateStudioTab}
                    onTriggerToast={showToast}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="DEVSECOPS"
                      projectId={selectedProjectId}
                      studioContextLabel="Cloud Build & Supply Chain · SLSA-3 @sha256 & Zero-Key OIDC"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="AI_MLOPS"
                      projectId={selectedProjectId}
                      studioContextLabel="Vertex AI Pipeline · Model Armor & Accelerator Zone Finder"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'WAVE10_FRONTIER' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Spanner Graph, Vector & OLTP Continuity Chain"
                    chainSummary="100-PU Sizer · ISO GQL Graph · ScaNN RAG · Zero-Downtime DDL"
                  >
                    <OltpDatabaseContinuityBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onSelectTab={handleNavigateStudioTab}
                      onOpenProvision={handleOpenProvision}
                      onOpenBigQuerySql={handleOpenBigQuerySql}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <Wave10Frontier2026Studio
                    projectId={selectedProjectId}
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={handleOpenBigQuerySql}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DBRE"
                    projectId={selectedProjectId}
                    studioContextLabel="Spanner Graph & Vector Studio · Hot-Key Inspector & Zero-Downtime DDL"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'SOVEREIGN_STUDIO' && (
                <StudioWorkspaceTabs
                  studioTitle="Sovereign IAM, KMS & Compliance Studio"
                  studioSubtitle="Zero-trust IAM time-machine snapshots, KMS/Secrets governance, and DORA/GDPR compliance blueprints."
                  defaultTabId="IAM_TIME_MACHINE"
                  tabs={[
                    {
                      id: 'IAM_TIME_MACHINE',
                      label: 'IAM & Time Machine',
                      icon: ShieldCheck,
                      render: () => (
                        <SovereignTimeMachineIamStudio
                          projectId={selectedProjectId}
                          initialSubTab={sovereignSubTab}
                          subTabNonce={studioSubTabNonce}
                          onTriggerToast={showToast}
                          onOpenHealthAndDrift={() => setCopilotOpen(true)}
                          onNavigateTab={handleNavigateStudioTab}
                          onRefreshOverview={() =>
                            fetchProjectOverview(selectedProjectId)
                          }
                        />
                      ),
                    },
                    {
                      id: 'COMPLIANCE_BLUEPRINT',
                      label: 'DORA / GDPR Blueprint',
                      icon: Lock,
                      render: () => (
                        <SovereignComplianceBlueprintCompiler
                          projectId={selectedProjectId}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="Wave 4 · 6-Stage Zero-Trust SecOps, Incident SRE & Forensics Chain"
                        chainSummary="IAM & Secret Vault → Perimeter & Toxic Graph → Cloud Audit → SOAR → SRE Burn Gate"
                      >
                        <SecOpsSreForensicsPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          onSelectTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <StudioGcpAdvantageBar
                        projectId={selectedProjectId}
                        studioDomain="IAM"
                        onRunInShell={handleRunInShell}
                        onRefreshParent={() =>
                          fetchProjectOverview(selectedProjectId)
                        }
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                      <PersonaContextualHelper
                        persona="DEVSECOPS"
                        projectId={selectedProjectId}
                        studioContextLabel="IAM & Zero-Trust Studio · Escalation Paths, @sha256 & OIDC WIF"
                        defaultExpanded={false}
                        onOpenFullBoard={(p) =>
                          handleNavigateStudioTab(
                            'INNOVATION_LAB',
                            `FIVE_PERSONA_${p}`
                          )
                        }
                        onRunInShell={handleRunInShell}
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                    </>
                  }
                />
              )}

              {activeTab === 'SRE_WAR_ROOM' && (
                <StudioWorkspaceTabs
                  studioTitle="SRE War-Room & Security Mission Control"
                  studioSubtitle="Track live SLI/SLO attainment & error budgets, SLO incident response, SCC v2 vulnerabilities, and IAM/PAM JIT."
                  defaultTabId="SLI_SLO_ATTAINMENT"
                  externalTabId={
                    ['SLI_SLO_ATTAINMENT', 'WAR_ROOM_SLOS', 'SCC_VULNS', 'IAM_PAM_JIT', 'AGENTIC_COMMANDER'].includes(sreSubTab)
                      ? sreSubTab
                      : undefined
                  }
                  externalTabNonce={studioSubTabNonce}
                  tabs={[
                    {
                      id: 'SLI_SLO_ATTAINMENT',
                      label: 'SLI / SLO Attainment',
                      icon: Activity,
                      render: () => (
                        <SreSliSloCockpitPanel
                          projectId={selectedProjectId}
                          onNavigateTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                    {
                      id: 'WAR_ROOM_SLOS',
                      label: 'War-Room & Perimeter',
                      icon: ShieldCheck,
                      render: () => (
                        <SreWarRoomPerimeterStudio
                          projectId={selectedProjectId}
                          initialSubTab={sreSubTab}
                          subTabNonce={studioSubTabNonce}
                          onTriggerToast={showToast}
                          onRunInShell={handleRunInShell}
                          onOpenHealthAndDrift={() => setCopilotOpen(true)}
                          onNavigateTab={handleNavigateStudioTab}
                          onRefreshOverview={() =>
                            fetchProjectOverview(selectedProjectId)
                          }
                        />
                      ),
                    },
                    {
                      id: 'SCC_VULNS',
                      label: 'SCC v2 Vulnerabilities',
                      icon: ShieldAlert,
                      render: () => (
                        <SccVulnerabilityMissionControl
                          projectId={selectedProjectId}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                          onNavigateTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                        />
                      ),
                    },
                    {
                      id: 'IAM_PAM_JIT',
                      label: 'IAM & PAM JIT',
                      icon: ShieldCheck,
                      render: () => (
                        <IamPamGovernancePanel
                          projectId={selectedProjectId}
                          onRunInShell={handleRunInShell}
                          onNavigateTab={handleNavigateStudioTab}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                    {
                      id: 'AGENTIC_COMMANDER',
                      label: 'Agentic Commander',
                      icon: Sparkles,
                      render: () => (
                        <AgenticIncidentCommanderPanel
                          projectId={selectedProjectId}
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="6-Stage Zero-Trust SecOps, Incident SRE & Forensics Chain"
                        chainSummary="IAM & Secrets → Perimeter → Cloud Audit → SOAR → 14.4x SLO Burn Gate"
                      >
                        <SecOpsSreForensicsPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          onSelectTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <PersonaContextualHelper
                          persona="SRE_ONCALL"
                          projectId={selectedProjectId}
                          studioContextLabel="SRE War-Room · 14.4x SLO Freeze Gate, Change Correlator & Chaos"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                        <PersonaContextualHelper
                          persona="ARCHITECT"
                          projectId={selectedProjectId}
                          studioContextLabel="SRE War-Room · Region Blackout SPOF Drill & Org Guardrails"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      </div>
                    </>
                  }
                />
              )}

              {activeTab === 'CLOUD_RUN' && (
                <StudioWorkspaceTabs
                  studioTitle="Cloud Run Serverless Fleet"
                  studioSubtitle="Manage revisions, direct IAP, L4 GPUs, and scale-to-zero services."
                  defaultTabId="FLEET"
                  tabs={[
                    {
                      id: 'FLEET',
                      label: 'Services & Revisions',
                      icon: Cloud,
                      render: () => (
                        <CloudRunFleetManager
                          projectId={selectedProjectId}
                          initialServices={overview?.cloudRunServices || []}
                          onOpenProvisionCloudRun={() =>
                            handleOpenProvision('CLOUD_RUN')
                          }
                          onOpenSecretManagerStudio={() =>
                            handleNavigateStudioTab('SECRETS_KMS')
                          }
                          onSelectTab={handleNavigateStudioTab}
                          onRefreshOverview={() =>
                            fetchProjectOverview(selectedProjectId)
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="GitOps, Cloud Build & Serverless Release Factory Chain"
                        chainSummary="GitHub OIDC → Cloud Build → Artifact Registry → Cloud Run Revisions"
                      >
                        <GitOpsReleaseFactoryPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          onSelectTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <StudioGcpAdvantageBar
                        projectId={selectedProjectId}
                        studioDomain="CLOUD_RUN"
                        onRunInShell={handleRunInShell}
                        onRefreshParent={() =>
                          fetchProjectOverview(selectedProjectId)
                        }
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <PersonaContextualHelper
                          persona="CLOUD_ENG"
                          projectId={selectedProjectId}
                          studioContextLabel="Cloud Run Fleet · Pre-Flight Validator & .tf Export"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                        <PersonaContextualHelper
                          persona="DEVSECOPS"
                          projectId={selectedProjectId}
                          studioContextLabel="Cloud Run Revisions · Binary Authz @sha256 Digest Gate"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      </div>
                    </>
                  }
                />
              )}

              {activeTab === 'FUNCTIONS_STUDIO' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Eventarc, Pub/Sub & Cloud Functions Release Chain"
                    chainSummary="GitHub → Cloud Build → Cloud Functions Gen2 → 90+ Eventarc Triggers"
                  >
                    <GitOpsReleaseFactoryPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onSelectTab={handleNavigateStudioTab}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <CloudFunctionsEventarcStudio
                    projectId={selectedProjectId}
                    initialSubTab={functionsSubTab}
                    onSelectTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                  />
                  <PersonaContextualHelper
                    persona="CLOUD_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Cloud Functions & Eventarc · Pre-Flight & .tf Export"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'GKE_STUDIO' && (
                <StudioWorkspaceTabs
                  studioTitle="Google Kubernetes Engine (GKE) Fleet"
                  studioSubtitle="Autopilot & Standard clusters, Spot GPUs, and live workload inspection."
                  defaultTabId="CLUSTERS"
                  tabs={[
                    {
                      id: 'CLUSTERS',
                      label: 'Clusters & Workloads',
                      icon: Cpu,
                      render: () => (
                        <GkeFleetStudio
                          projectId={selectedProjectId}
                          initialSubTab={gkeSubTab}
                          onSelectTab={handleNavigateStudioTab}
                          onOpenProvisionGke={() =>
                            handleOpenProvision('GKE_CLUSTER')
                          }
                          onRunInShell={handleRunInShell}
                          onRefreshOverview={() =>
                            fetchProjectOverview(selectedProjectId)
                          }
                          onShowToast={showToast}
                        />
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="Kubernetes (GKE), Artifact Registry & GitOps Chain"
                        chainSummary="Cloud Build → Artifact Registry → GKE Autopilot / Standard → Mesh"
                      >
                        <GitOpsReleaseFactoryPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          onSelectTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <StudioGcpAdvantageBar
                        projectId={selectedProjectId}
                        studioDomain="GKE_FINOPS"
                        onRunInShell={handleRunInShell}
                        onRefreshParent={() =>
                          fetchProjectOverview(selectedProjectId)
                        }
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <PersonaContextualHelper
                          persona="PLATFORM_K8S"
                          projectId={selectedProjectId}
                          studioContextLabel="GKE Fleet · Pod OOM/CPU Right-Sizer, Scale-Down Blocker & STRICT mTLS"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                        <PersonaContextualHelper
                          persona="CLOUD_ENG"
                          projectId={selectedProjectId}
                          studioContextLabel="GKE Kubernetes Fleet · Pre-Flight Quota & .tf Export"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      </div>
                    </>
                  }
                />
              )}

              {activeTab === 'VM_SSH' && (
                <StudioWorkspaceTabs
                  studioTitle="Compute Engine VM Fleet & SSH"
                  studioSubtitle="Live VM lifecycle, IAP SSH terminal, OS Config CVE scanner & patcher, and snapshots."
                  defaultTabId="VM_FLEET"
                  tabs={[
                    {
                      id: 'VM_FLEET',
                      label: 'VM Fleet & SSH',
                      icon: Server,
                      render: () => (
                        <VmFleetAndSsh
                          projectId={selectedProjectId}
                          account={contextData.account}
                          onOpenProvisionVm={() =>
                            handleOpenProvision('COMPUTE_VM')
                          }
                          refreshTrigger={vmRefreshTrigger}
                          onVmDeleted={() =>
                            fetchProjectOverview(selectedProjectId, {
                              force: true,
                              silent: true,
                            })
                          }
                          onSyncLiveVms={handleSyncLiveVms}
                          onSelectProject={(pid) => {
                            if (!pid) return;
                            sessionStorage.setItem('cloudpulse_project', pid);
                            sessionStorage.setItem(
                              'cloudpulse_project_explicit',
                              'true'
                            );
                            sessionStorage.setItem(
                              'cloudpulse_user_selected_project_v2',
                              pid
                            );
                            try {
                              localStorage.setItem('cloudpulse_project', pid);
                              localStorage.setItem(
                                'cloudpulse_project_explicit',
                                'true'
                              );
                              localStorage.setItem(
                                'cloudpulse_user_selected_project_v2',
                                pid
                              );
                            } catch {
                              // ignore
                            }
                            setSelectedProjectId(pid);
                            showToast(`Switched active GCP project to ${pid}`);
                          }}
                          onRunInShell={handleRunInShell}
                          onSelectTab={handleNavigateStudioTab}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="Enterprise Compute, VPC, Storage & Recovery Chain"
                        chainSummary="VPC & Firewalls → Compute Engine VMs → Cloud Storage → 30-Day Recycle Bin"
                      >
                        <EnterpriseStackPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          overview={overview}
                          onOpenProvision={handleOpenProvision}
                          onSelectTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <StudioGcpAdvantageBar
                        projectId={selectedProjectId}
                        studioDomain="VM"
                        onRunInShell={handleRunInShell}
                        onRefreshParent={() => {
                          fetchProjectOverview(selectedProjectId);
                          setVmRefreshTrigger((c) => c + 1);
                        }}
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                      <PersonaContextualHelper
                        persona="CLOUD_ENG"
                        projectId={selectedProjectId}
                        studioContextLabel="Compute Engine VM Fleet · Pre-Flight, .tf Export & Undo Saga"
                        defaultExpanded={false}
                        onOpenFullBoard={(p) =>
                          handleNavigateStudioTab(
                            'INNOVATION_LAB',
                            `FIVE_PERSONA_${p}`
                          )
                        }
                        onRunInShell={handleRunInShell}
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                    </>
                  }
                />
              )}

              {activeTab === 'VPC_NETWORKS' && (
                <StudioWorkspaceTabs
                  studioTitle="VPC Networks & Firewall Rules"
                  studioSubtitle="Global VPC subnets, firewall posture, and live packet reachability."
                  defaultTabId="VPC_RULES"
                  tabs={[
                    {
                      id: 'VPC_RULES',
                      label: 'VPCs & Firewalls',
                      icon: Network,
                      render: () => (
                        <VpcNetworksAndFirewalls
                          projectId={selectedProjectId}
                          vpcs={overview?.vpcs || []}
                          firewalls={overview?.firewalls || []}
                          initialRuleSeed={vpcStudioRuleSeed}
                          initialSubTab={vpcSubTab}
                          subTabNonce={studioSubTabNonce}
                          onOpenProvisionVpc={() =>
                            handleOpenProvision('VPC_NETWORK')
                          }
                          onOpenProvisionFirewall={() =>
                            handleOpenProvision('VPC_FIREWALL')
                          }
                          onTestOnGlobalMap={handleTestRuleOnGlobalMap}
                          onOpenLogsExplorer={handleOpenInLogsExplorer}
                          onOpenCloudSoc={handleOpenInCloudSoc}
                          onDeleteResource={handleDeleteResource}
                          onRefresh={() =>
                            fetchProjectOverview(selectedProjectId)
                          }
                          loading={loadingOverview}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                          onSelectTab={handleNavigateStudioTab}
                        />
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="Enterprise VPC, Firewall, Compute & Recovery Chain"
                        chainSummary="VPC Subnets → Firewall Rules → Compute Fleet → Cloud SOC → Recycle Bin"
                      >
                        <EnterpriseStackPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          overview={overview}
                          onOpenProvision={handleOpenProvision}
                          onSelectTab={handleNavigateStudioTab}
                          onRunInShell={handleRunInShell}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <StudioGcpAdvantageBar
                        projectId={selectedProjectId}
                        studioDomain="VPC"
                        onRunInShell={handleRunInShell}
                        onRefreshParent={() =>
                          fetchProjectOverview(selectedProjectId)
                        }
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                      <PersonaContextualHelper
                        persona="NETOPS"
                        projectId={selectedProjectId}
                        studioContextLabel="VPC & Firewall Studio · 4-Hop Packet Tracer & IPAM CIDR Guard"
                        defaultExpanded={false}
                        onOpenFullBoard={(p) =>
                          handleNavigateStudioTab(
                            'INNOVATION_LAB',
                            `FIVE_PERSONA_${p}`
                          )
                        }
                        onRunInShell={handleRunInShell}
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                    </>
                  }
                />
              )}

              {activeTab === 'FINOPS' && (
                <StudioWorkspaceTabs
                  studioTitle="FinOps & Cost Control Center"
                  studioSubtitle="One focused workspace at a time — billing & credits, autonomous cost autopilot, logging spend, and idle-zombie cleanup."
                  defaultTabId="BILLING_CREDITS"
                  externalTabId={
                    ['BILLING_CREDITS', 'FINOPS_AUTOPILOT', 'LOGGING_FINOPS', 'ZOMBIE_EXECUTOR'].includes(finopsSubTab)
                      ? finopsSubTab
                      : undefined
                  }
                  externalTabNonce={studioSubTabNonce}
                  tabs={[
                    {
                      id: 'BILLING_CREDITS',
                      label: 'Billing & Credits',
                      icon: DollarSign,
                      render: () => (
                        <div className="space-y-5">
                          <div
                            id="finops-billing-guardian-section"
                            className="scroll-mt-24"
                          >
                            <BillingAccountCreditGuardian
                              projectId={selectedProjectId}
                              liveBurn={liveBurn}
                              gdePrivacyConfig={gdePrivacyConfig}
                              onOpenBigQuerySql={handleOpenBigQuerySql}
                              onOpenProvision={handleOpenProvision}
                              onOpenSecretManagerStudio={() =>
                                handleNavigateStudioTab('SECRETS_KMS')
                              }
                              onOpenEmergencyKillSwitch={
                                handleScrollToApisWithSpotlight
                              }
                              onRunInShell={handleRunInShell}
                              onShowToast={showToast}
                              onGrantsSummaryChange={setGdeSummary}
                            />
                          </div>
                          <SortableKpiRow
                            summary={overview?.summary}
                            fetchLatencyMs={overview?.fetchLatencyMs}
                            isSyncing={loadingOverview}
                            onRefreshOverview={() =>
                              fetchProjectOverview(selectedProjectId, {
                                force: true,
                              })
                            }
                            onNavigateTab={handleNavigateStudioTab}
                            onScrollToApis={handleScrollToApisWithSpotlight}
                          />
                          <TelemetryCharts
                            telemetry={overview?.telemetry}
                            projectId={selectedProjectId}
                            onOpenCopilot={handleOpenCopilotWithPrompt}
                            onSelectTab={handleNavigateStudioTab}
                          />
                        </div>
                      ),
                    },
                    {
                      id: 'FINOPS_AUTOPILOT',
                      label: 'FinOps Autopilot',
                      icon: Sparkles,
                      render: () => (
                        <AutonomousFinOpsAutopilotMatrix
                          projectId={selectedProjectId}
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                    {
                      id: 'LOGGING_FINOPS',
                      label: 'Logging FinOps',
                      icon: Activity,
                      render: () => (
                        <LoggingFinOpsAuditorPanel
                          projectId={selectedProjectId}
                          onRunInShell={handleRunInShell}
                          onNavigateTab={handleNavigateStudioTab}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      ),
                    },
                    {
                      id: 'ZOMBIE_EXECUTOR',
                      label: 'Idle-Zombie Executor',
                      icon: Trash2,
                      render: () => (
                        <div
                          id="finops-zombie-reaper-section"
                          className="scroll-mt-24"
                        >
                          <FinOpsZombieExecutorPanel
                            projectId={selectedProjectId}
                            onRunInShell={handleRunInShell}
                            onNavigateTab={handleNavigateStudioTab}
                            onShowToast={showToast}
                            onShowError={setErrorBanner}
                          />
                        </div>
                      ),
                    },
                  ]}
                  secondaryTools={
                    <>
                      <CollapsibleArchitecturePipelineBar
                        label="6-Stage FinOps, Credit Guardian & Zombie Reaper Chain"
                        chainSummary="Billing Export → Credit Ledger → Zombie Reaper → CUDs → Emergency API Kill-Switch"
                      >
                        <FinOpsCostKillPipelineBar
                          projectId={selectedProjectId}
                          activeTab={activeTab}
                          onSelectTab={handleNavigateStudioTab}
                          onOpenBigQuerySql={handleOpenBigQuerySql}
                          onRunInShell={handleRunInShell}
                        />
                      </CollapsibleArchitecturePipelineBar>
                      <StudioGcpAdvantageBar
                        projectId={selectedProjectId}
                        studioDomain="GKE_FINOPS"
                        onRunInShell={handleRunInShell}
                        onRefreshParent={() =>
                          fetchProjectOverview(selectedProjectId)
                        }
                        onShowToast={showToast}
                        onShowError={setErrorBanner}
                      />
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <PersonaContextualHelper
                          persona="FINOPS_ENG"
                          projectId={selectedProjectId}
                          studioContextLabel="FinOps & GreenOps · Unit Cost ($/1k req), Zombie Reaper & 98% CFE"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                        <PersonaContextualHelper
                          persona="ARCHITECT"
                          projectId={selectedProjectId}
                          studioContextLabel="FinOps Studio · 3-Cloud Arbitrage (GCP vs AWS vs Azure) & Guardrails"
                          defaultExpanded={false}
                          onOpenFullBoard={(p) =>
                            handleNavigateStudioTab(
                              'INNOVATION_LAB',
                              `FIVE_PERSONA_${p}`
                            )
                          }
                          onRunInShell={handleRunInShell}
                          onShowToast={showToast}
                          onShowError={setErrorBanner}
                        />
                      </div>
                    </>
                  }
                />
              )}

              {activeTab === 'LOGS_SHELL' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="6-Stage SecOps, Cloud Audit & SRE Forensics Chain"
                    chainSummary="IAM & Secrets → Perimeter → 400d Cloud Audit Logs → SOAR → SRE Burn Gate"
                  >
                    <SecOpsSreForensicsPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onSelectTab={handleNavigateStudioTab}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <LogStreamerAndShell
                    logs={overview?.logs || []}
                    projectId={selectedProjectId}
                    account={contextData.account}
                    initialCommand={shellSeedCommand}
                    initialCommandNonce={shellSeedNonce}
                    initialLogExplorerSpec={logExplorerSeedSpec}
                    onSelectTab={handleNavigateStudioTab}
                    onRefreshLogs={() => fetchProjectOverview(selectedProjectId, { force: true })}
                    onAskCopilot={handleOpenCopilotWithPrompt}
                    onOpenRecycleBin={() => handleNavigateStudioTab('RECYCLE_BIN')}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="SRE_ONCALL"
                    projectId={selectedProjectId}
                    studioContextLabel="Logs & Cloud Shell · Golden-Signal Change Correlator & SLO Burn Gate"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'RECYCLE_BIN' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Enterprise Recovery & 30-Day Cloud Recycle Bin Chain"
                    chainSummary="Compute VMs · Cloud Storage Soft-Delete · BigQuery Time-Travel · Secret Versions"
                  >
                    <EnterpriseStackPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      overview={overview}
                      onOpenProvision={handleOpenProvision}
                      onSelectTab={handleNavigateStudioTab}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <CloudRecycleBinStudio
                    projectId={selectedProjectId}
                    initialCategory={recycleBinCategory}
                    subTabNonce={studioSubTabNonce}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId, { force: true })
                    }
                  />
                </div>
              )}

              {activeTab === 'AWS_AZURE_PARITY' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Multi-Cloud Parity & Migration Architecture Chain"
                    chainSummary="AWS / Azure / Alibaba / Huawei → GCP Service Mapping & Terraform Synthesizer"
                  >
                    <MultiCloudGlobalParityPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      activeSubTab={awsAzureSubTab}
                      onSelectTab={handleNavigateStudioTab}
                      onTestRuleOnGlobalMap={handleTestRuleOnGlobalMap}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <AwsAzureEnvySuiteStudio
                    key="aws-azure-parity"
                    cloudFamily="AWS_AZURE"
                    initialTab={awsAzureSubTab}
                    subTabNonce={studioSubTabNonce}
                    onSubTabChange={setAwsAzureSubTab}
                    projectId={selectedProjectId}
                    onSwitchCloudFamily={(family) =>
                      handleNavigateStudioTab(
                        family === 'ALIBABA_HUAWEI'
                          ? 'ALIBABA_HUAWEI_PARITY'
                          : 'AWS_AZURE_PARITY'
                      )
                    }
                    onNavigateToGcpTab={handleNavigateStudioTab}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'ALIBABA_HUAWEI_PARITY' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="Alibaba Cloud & Huawei Cloud Parity Architecture Chain"
                    chainSummary="ECS / OSS / MaxCompute / ModelArts → GCE / GCS / BigQuery / Vertex AI"
                  >
                    <MultiCloudGlobalParityPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      activeSubTab={alibabaHuaweiSubTab}
                      onSelectTab={handleNavigateStudioTab}
                      onTestRuleOnGlobalMap={handleTestRuleOnGlobalMap}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <AwsAzureEnvySuiteStudio
                    key="alibaba-huawei-parity"
                    cloudFamily="ALIBABA_HUAWEI"
                    initialTab={alibabaHuaweiSubTab}
                    subTabNonce={studioSubTabNonce}
                    onSubTabChange={setAlibabaHuaweiSubTab}
                    projectId={selectedProjectId}
                    onSwitchCloudFamily={(family) =>
                      handleNavigateStudioTab(
                        family === 'ALIBABA_HUAWEI'
                          ? 'ALIBABA_HUAWEI_PARITY'
                          : 'AWS_AZURE_PARITY'
                      )
                    }
                    onNavigateToGcpTab={handleNavigateStudioTab}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'CLOUD_SOC' && (
                <div className="space-y-4">
                  <CollapsibleArchitecturePipelineBar
                    label="6-Stage Zero-Trust Cloud SOC, IDS/IPS & SOAR Chain"
                    chainSummary="IAM & Secret Hygiene → Toxic Graph → Cloud Audit → Cloud IDS/WAF → SOAR Quarantine"
                  >
                    <SecOpsSreForensicsPipelineBar
                      projectId={selectedProjectId}
                      activeTab={activeTab}
                      onSelectTab={handleNavigateStudioTab}
                      onRunInShell={handleRunInShell}
                    />
                  </CollapsibleArchitecturePipelineBar>
                  <AutonomousCloudSocStudio
                    projectId={selectedProjectId}
                    initialSocSeed={cloudSocSeed}
                    onClearSocSeed={() => setCloudSocSeed(null)}
                    onOpenVpcFirewallStudio={handleOpenInVpcFirewallStudio}
                    onTestRuleOnGlobalMap={handleTestRuleOnGlobalMap}
                    onRunInShell={handleRunInShell}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onNavigateTab={handleNavigateStudioTab}
                    onRefreshGlobal={() => {
                      fetchProjectOverview(selectedProjectId, { force: true });
                      setVmRefreshTrigger((c) => c + 1);
                    }}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'DOCS_GUIDE' && (
                <InteractiveDocsGuide
                  onNavigateToFeature={handleNavigateStudioTab}
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />
              )}
              </div>
          </>
        </main>
        </div>

        {/* Slide-Up Searchable 26-Studio Sheet for Mobile & PWA Preview */}
        {mobileStudioDrawerOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="All 26 CloudPulse Studios"
            onClick={() => setMobileStudioDrawerOpen(false)}
            className={`${
              mobilePreview ? 'absolute inset-0' : 'fixed inset-0 md:hidden'
            } z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end`}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-h-[80vh] bg-white dark:bg-[#0c0f16] border-t border-zinc-200 dark:border-[#262e42] rounded-t-2xl flex flex-col overflow-hidden shadow-2xl cp-studio-enter"
            >
              <div className="px-4 py-3 border-b border-zinc-200 dark:border-[#1e2433] flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 font-mono">
                    All {navTabs.length} Engineering Studios
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileStudioDrawerOpen(false)}
                  className="p-1.5 rounded bg-zinc-100 dark:bg-[#151a25] text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-3 border-b border-zinc-100 dark:border-[#1e2433]">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={railSearchQuery}
                    onChange={(e) => setRailSearchQuery(e.target.value)}
                    placeholder="Search any Google Cloud studio..."
                    className="w-full pl-8 pr-8 py-2 text-xs rounded-md bg-zinc-100 dark:bg-[#07090d] border border-zinc-200 dark:border-[#263044] text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                  {railSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setRailSearchQuery('')}
                      className="cp-nav-rail-item absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-400 bg-transparent border-none shadow-none"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3 overflow-y-auto space-y-4">
                {[
                  { id: 'COMMAND', title: 'Command & Global' },
                  { id: 'INFRA_COMPUTE', title: 'Compute, VPC & Storage' },
                  { id: 'DATA_AI', title: 'Data & Lakehouse' },
                  { id: 'SECURITY_SRE', title: 'Security, IAM & SRE' },
                  { id: 'OPS_DOCS', title: 'FinOps, Logs & Docs' },
                ].map((section) => {
                  const q = railSearchQuery.trim().toLowerCase();
                  const groupTabs = navTabs.filter((t) => {
                    if (t.group !== section.id) return false;
                    if (!q) return true;
                    return (
                      t.label.toLowerCase().includes(q) ||
                      String(t.tip || '').toLowerCase().includes(q)
                    );
                  });
                  if (!groupTabs.length) return null;
                  return (
                    <div key={section.id} className="space-y-1.5">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-[#647087] px-1">
                        {section.title}
                      </div>
                      <div
                        data-action-toolbar="true"
                        className="grid grid-cols-2 gap-1.5"
                      >
                        {groupTabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          const countBadge = getTabResourceCount(tab.id);
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setMobileStudioDrawerOpen(false);
                                handleNavigateStudioTab(tab.id, null, null, {
                                  skipConfirm: true,
                                });
                              }}
                              className={`cp-nav-rail-item flex items-center justify-between gap-2 px-2.5 py-2 rounded-md text-left text-xs border transition-colors cursor-pointer ${
                                isActive
                                  ? 'bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-white font-bold'
                                  : 'bg-zinc-50 dark:bg-[#10141d] border-zinc-200 dark:border-[#1e2433] text-zinc-700 dark:text-zinc-200'
                              }`}
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <Icon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isActive
                                      ? 'text-amber-500'
                                      : 'text-zinc-400 dark:text-[#7c879c]'
                                  }`}
                                />
                                <span className="truncate">{tab.label}</span>
                              </span>
                              {countBadge !== null && countBadge !== undefined && (
                                <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                                  {countBadge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Fixed 5-Slot Mobile & PWA Bottom Dock (Replaces overflowing 25-button mobile bar) */}
        <div
          data-action-toolbar="true"
          className={`${
            mobilePreview
              ? 'sticky bottom-0'
              : 'fixed bottom-0 left-0 right-0 md:hidden'
          } z-40 bg-white/95 dark:bg-[#0c0f16]/95 backdrop-blur-md border-t border-zinc-200 dark:border-[#1e2433] px-2 py-1.5 grid grid-cols-5 gap-1`}
        >
          {[
            { id: 'OVERVIEW', shortLabel: 'Overview', icon: LayoutDashboard },
            { id: 'VM_SSH', shortLabel: 'VMs & SSH', icon: Server },
            { id: 'CLOUD_RUN', shortLabel: 'Cloud Run', icon: Rocket },
            { id: 'LOGS_SHELL', shortLabel: 'Logs', icon: Terminal },
          ].map((slot) => {
            const Icon = slot.icon;
            const isActive = activeTab === slot.id && !mobileStudioDrawerOpen;
            return (
              <button
                key={slot.id}
                type="button"
                data-feature-id={slot.id}
                onClick={() => {
                  setMobileStudioDrawerOpen(false);
                  handleNavigateStudioTab(slot.id, null, null, {
                    skipConfirm: true,
                  });
                }}
                className={`cp-nav-rail-item flex flex-col items-center justify-center gap-0.5 py-1 rounded text-[10px] font-semibold bg-transparent border-none shadow-none transition-colors cursor-pointer ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-zinc-500 dark:text-[#8b95a5]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{slot.shortLabel}</span>
              </button>
            );
          })}
          <button
            type="button"
            data-feature-id="MOBILE_STUDIO_DRAWER"
            onClick={() => setMobileStudioDrawerOpen((v) => !v)}
            title="Browse & Search All 26 Google Cloud Engineering Studios"
            className={`cp-nav-rail-item flex flex-col items-center justify-center gap-0.5 py-1 rounded text-[10px] font-semibold bg-transparent border-none shadow-none transition-colors cursor-pointer ${
              mobileStudioDrawerOpen ||
              !['OVERVIEW', 'VM_SSH', 'CLOUD_RUN', 'LOGS_SHELL'].includes(
                activeTab
              )
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-zinc-500 dark:text-[#8b95a5]'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="truncate">Studios ({navTabs.length})</span>
          </button>
        </div>

        {/* 24px IDE-Style Desktop Live Telemetry Status Bar */}
        {!mobilePreview && (
          <footer
            aria-label="Live Google Cloud Telemetry Status Bar"
            className="hidden md:flex fixed bottom-0 left-0 right-0 z-30 h-6 px-3 bg-white/95 dark:bg-[#080a0f]/95 backdrop-blur-md border-t border-zinc-200 dark:border-[#1a202e] items-center justify-between gap-4 text-[10.5px] font-mono text-zinc-500 dark:text-[#7c879c] select-none"
          >
            <div className="flex items-center gap-3 min-w-0 truncate">
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>OAUTH2 LIVE</span>
              </span>
              <span className="text-zinc-300 dark:text-[#1e2433]">|</span>
              <span className="truncate text-zinc-700 dark:text-zinc-300 font-semibold">
                {selectedProjectId || 'no-project'}
              </span>
              <span className="text-zinc-300 dark:text-[#1e2433]">|</span>
              <span className="hidden lg:inline truncate">
                {liveDateText} · {activeTimeZone} ({utcOffsetLabel})
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden xl:inline-flex items-center gap-2">
                <span>
                  VMs:{' '}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {overview?.summary?.liveVmsCount ??
                      overview?.summary?.totalVms ??
                      0}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Run:{' '}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {overview?.cloudRunServices?.length ?? 0}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Buckets:{' '}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {overview?.summary?.liveBucketsCount ??
                      overview?.summary?.storageBuckets ??
                      0}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  APIs:{' '}
                  <strong className="text-zinc-800 dark:text-zinc-200">
                    {overview?.summary?.enabledApisCount ?? 0}
                  </strong>
                </span>
              </span>
              <span className="hidden xl:inline text-zinc-300 dark:text-[#1e2433]">
                |
              </span>
              {(() => {
                const orb = computeOrbitalTelemetry(overview);
                return (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    CFE {orb.avgCfe}% · {orb.postureGrade}
                  </span>
                );
              })()}
              <span className="hidden lg:inline text-zinc-300 dark:text-[#1e2433]">
                |
              </span>
              <span className="hidden lg:inline text-[10px]">
                ⌘K / Alt+P Search · [ Rail · / Filter · Alt+G Shield · Alt+K Keynote
              </span>
            </div>
          </footer>
        )}
      </div>

      {zenMode && (
        <FloatingSpatialDock
          activeTab={activeTab}
          zenMode={zenMode}
          onSelectTab={(tabId) =>
            handleNavigateStudioTab(tabId, null, null, { skipConfirm: true })
          }
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleZenMode={() => setZenMode((v) => !v)}
        />
      )}

      <KeynoteAutopilotModal
        isOpen={keynoteAutopilotOpen}
        onClose={() => setKeynoteAutopilotOpen(false)}
        projectId={selectedProjectId}
        onNavigateTab={handleNavigateStudioTab}
        onShowToast={showToast}
      />

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
          handleNavigateStudioTab(tabId, subTab, null, { skipConfirm: true });
        }}
        onOpenCreateModal={(type) => {
          if (type === 'VM' || type === 'COMPUTE_VM')
            handleOpenProvision('COMPUTE_VM');
          else if (type === 'CLOUD_RUN') handleOpenProvision('CLOUD_RUN');
          else if (type === 'GKE_CLUSTER') handleOpenProvision('GKE_CLUSTER');
          else if (type === 'CLOUD_SQL') handleOpenProvision('CLOUD_SQL');
          else if (type === 'BUCKET' || type === 'GCS_BUCKET')
            handleOpenProvision('GCS_BUCKET');
          else if (type === 'BIGQUERY_DATASET')
            handleOpenProvision('BIGQUERY_DATASET');
          else if (type === 'VPC_NETWORK') handleOpenProvision('VPC_NETWORK');
          else if (type === 'VPC_FIREWALL') handleOpenProvision('VPC_FIREWALL');
          else if (type === 'API') handleScrollToApisWithSpotlight();
          else handleOpenProvision(type || 'COMPUTE_VM');
        }}
        onOpenKillSwitch={handleScrollToApisWithSpotlight}
        onOpenCopilot={() => handleOpenCopilotWithPrompt('')}
        onToggleGdeMode={() => {
          setGdePrivacyConfig((prev) => {
            const next = { ...prev, enabled: !prev.enabled };
            try {
              localStorage.setItem(
                'cloudpulse_gde_tutorial_mode_v1',
                JSON.stringify(next)
              );
            } catch {
              // ignore
            }
            showToast(
              next.enabled
                ? 'GDE Tutorial Privacy Shield ENABLED — Emails, Billing IDs & Public IPs are now masked for screen recording.'
                : 'GDE Tutorial Privacy Shield disabled.'
            );
            return next;
          });
        }}
        onRefreshAll={() => {
          fetchProjectOverview(selectedProjectId);
          setVmRefreshTrigger((c) => c + 1);
        }}
        onShowToast={showToast}
        onShowError={setErrorBanner}
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
        gdeSummary={gdeSummary}
        onDeleteResource={handleDeleteResource}
        onSwitchProject={(nextProjId) => {
          if (nextProjId) {
            sessionStorage.setItem('cloudpulse_project_explicit', 'true');
            setSelectedProjectId(nextProjId);
          }
        }}
        onRefresh={() => {
          fetchProjectOverview(selectedProjectId, { force: true });
          setVmRefreshTrigger((c) => c + 1);
        }}
        onSelectTab={handleNavigateStudioTab}
        onShowToast={showToast}
        onShowError={setErrorBanner}
      />

      <MandatoryDeleteConfirmationModal
        activeItem={pendingDeleteQueue[0] || null}
        queueLength={pendingDeleteQueue.length}
        overview={overview}
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

      <CrossTabNavigationGuardModal
        activeNav={pendingCrossTabNav}
        onConfirm={() => {
          const nav = pendingCrossTabNav;
          setPendingCrossTabNav(null);
          if (nav?.onConfirm) nav.onConfirm();
        }}
        onCancel={() => {
          const nav = pendingCrossTabNav;
          setPendingCrossTabNav(null);
          if (nav?.onCancel) nav.onCancel();
        }}
      />

      <GlobalInnovationHoverExplainer />
    </div>
  );
}

/**
 * CrossTabNavigationGuardModal:
 * Intercepts cross-tab / cross-studio action buttons (such as "Open Target In: BigQuery SQL /
 * BigLake Iceberg / Managed Spark 3.5 / Medallion ELT / RAM DLP X-Ray / S3 Import", "Browse in GCS →",
 * "Run in Cloud Shell", etc.) to warn the user that clicking the button will switch them away
 * from their current page into a different Studio or Sub-Tab. If they refuse ("Stay on This Page"),
 * nothing changes and they remain on their current workspace.
 */
function CrossTabNavigationGuardModal({ activeNav, onConfirm, onCancel }) {
  useEffect(() => {
    if (!activeNav) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (onCancel) onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNav, onCancel]);

  if (!activeNav) return null;

  const {
    fromStudioTitle = 'Current Workspace',
    fromSubTabTitle = null,
    toStudioTitle = 'Destination Workspace',
    toSubTabTitle = null,
    actionLabel = 'Switch Workspace View',
    targetResourceLabel = null,
    payloadPreview = null,
    hasUnsavedWarning = false,
  } = activeNav;

  const fromDisplayName = fromSubTabTitle
    ? `${fromStudioTitle} · ${fromSubTabTitle}`
    : fromStudioTitle;
  const toDisplayName = toSubTabTitle
    ? `${toStudioTitle} · ${toSubTabTitle}`
    : toStudioTitle;
  const toShortButtonLabel = toSubTabTitle || toStudioTitle;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cross-tab-nav-guard-title"
      onClick={onCancel}
      className="fixed inset-0 z-[195] bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl border-2 border-amber-500/80 bg-white dark:bg-[#1a1c20] text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Warning Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-white flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/25 border border-white/25 flex items-center justify-center shrink-0 mt-0.5">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-black/30 text-white border border-white/25">
                  WORKSPACE DEEP-LINK GUARD · $0.00 ZERO CLOUD MUTATION
                </span>
              </div>
              <h3
                id="cross-tab-nav-guard-title"
                className="text-sm sm:text-base font-extrabold mt-1 leading-snug"
              >
                Leave &ldquo;{fromStudioTitle}&rdquo; and open &ldquo;{toDisplayName}&rdquo;?
              </h3>
              <p className="text-[11px] text-white/90 mt-0.5">
                {actionLabel}
                {targetResourceLabel
                  ? ` — pre-selecting ${targetResourceLabel} in the destination studio without modifying any Google Cloud resource.`
                  : ' — switches your active UI workspace only ($0.00 read-only navigation).'}
              </p>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Unsaved File Edits Alert (if editing a file in Object Workbench) */}
          {hasUnsavedWarning && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-900 dark:text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-extrabold uppercase tracking-wider text-[10px] font-mono text-red-600 dark:text-red-400">
                  Unsaved File Edits Detected in Code Editor
                </div>
                <p className="text-xs leading-relaxed">
                  You have unsaved text modifications in the current editor. If you leave this page now without saving, your unsaved edits may be lost.
                </p>
              </div>
            </div>
          )}

          {/* Visual From -> To Workspace Transition Card */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-stretch gap-2.5">
            {/* Current Workspace Card */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Current Page
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  STAY HERE IF REFUSED
                </span>
              </div>
              <div>
                <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {fromStudioTitle}
                </div>
                {fromSubTabTitle && (
                  <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {fromSubTabTitle}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow Connector */}
            <div className="flex items-center justify-center py-1 sm:py-0">
              <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Destination Workspace Card */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/45 flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Destination UI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                  NEW TAB VIEW
                </span>
              </div>
              <div>
                <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                  {toStudioTitle}
                </div>
                {toSubTabTitle && (
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 mt-0.5">
                    {toSubTabTitle}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Target Context / Payload Preview */}
          {(targetResourceLabel || payloadPreview) && (
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                <span className="font-bold uppercase tracking-wider text-zinc-500">
                  Context Carried to New Workspace
                </span>
                {targetResourceLabel && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold truncate max-w-[280px]">
                    {targetResourceLabel}
                  </span>
                )}
              </div>
              {payloadPreview && (
                <pre className="p-2 rounded-lg bg-zinc-900 text-emerald-300 text-[10.5px] font-mono overflow-x-auto whitespace-pre-wrap max-h-24">
                  {payloadPreview}
                </pre>
              )}
            </div>
          )}

          {/* Plain-English Explanation */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-[11.5px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Clicking <strong className="text-zinc-900 dark:text-white">Stay on This Page</strong> will cancel the tab switch and keep you on{' '}
            <strong className="text-zinc-900 dark:text-white">{fromDisplayName}</strong>. Clicking{' '}
            <strong className="text-blue-600 dark:text-blue-400">Switch to {toShortButtonLabel}</strong> will open{' '}
            <strong className="text-zinc-900 dark:text-white">{toDisplayName}</strong> with a 1-click{' '}
            <code className="font-mono text-[10.5px] px-1 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800">
              &larr; Back
            </code>{' '}
            button at the top so you can return anytime.
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              Stay on This Page (Cancel) [Esc]
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Switch to {toShortButtonLabel} &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * buildPlainEnglishModalSummary:
 * Translates any cloud action or deletion descriptor into a friendly, non-technical
 * "In Plain English" explanation + 3 quick layman pills (Reversibility, Cost, Scope)
 * so every user immediately understands what clicking Confirm will do.
 */
function buildPlainEnglishModalSummary(descriptor = {}) {
  const {
    gateType,
    laymanSummary,
    title = '',
    resourceKind = '',
    targetName = 'this resource',
    location = 'your project',
    projectId = 'your GCP project',
    method = '',
    endpoint = '',
    costWarning = '',
    impactWarning = '',
    whatHappensNext = '',
  } = descriptor;

  const isDelete = gateType !== 'ONE_TAP_CLOUD_ACTION';
  const combinedText = `${title} ${resourceKind} ${method} ${endpoint} ${impactWarning} ${whatHappensNext}`.toLowerCase();
  const costText = String(costWarning || '').toLowerCase();

  // 1. Determine Plain-English Cost Pill
  let costPill = 'Standard GCP Usage Applies';
  let costPillTone = 'amber';
  if (
    costText.includes('$0.00/mo') ||
    costText.includes('zero cost') ||
    costText.includes('100% free') ||
    costText.includes('costs $0.00') ||
    costText.includes('incur $0.00')
  ) {
    costPill = 'Free ($0.00 Control-Plane)';
    costPillTone = 'emerald';
  } else if (
    costText.includes('savings') ||
    costText.includes('stops') ||
    costText.includes('eliminates') ||
    costText.includes('reduces') ||
    isDelete
  ) {
    costPill = isDelete ? 'Stops Active Billing ($0.00/hr after)' : 'Saves Money / Cuts Waste';
    costPillTone = 'emerald';
  } else if (costText.includes('free tier') || costText.includes('$0.00 idle')) {
    costPill = '$0.00 When Idle (Free Tier Eligible)';
    costPillTone = 'emerald';
  }

  // 2. Determine Plain-English Reversibility Pill
  let undoPill = isDelete
    ? 'Permanent (Check 7–30 Day Recycle Bin)'
    : 'Reversible Anytime in 1 Click';
  let undoPillTone = isDelete ? 'red' : 'emerald';
  if (isDelete && combinedText.includes('soft-delete')) {
    undoPill = 'Recoverable from Trash Vault';
    undoPillTone = 'amber';
  } else if (!isDelete && (combinedText.includes('quarantine') || combinedText.includes('deny') || combinedText.includes('block'))) {
    undoPill = 'Reversible (Can Delete Rule Anytime)';
    undoPillTone = 'emerald';
  }

  // 3. Determine Plain-English Scope Pill
  let scopePill = isDelete ? 'Deletes Live Cloud Resource' : 'Updates Live Cloud Setting';
  if (combinedText.includes('firewall') || combinedText.includes('waf') || combinedText.includes('armor') || combinedText.includes('ids') || combinedText.includes('ips')) {
    scopePill = isDelete ? 'Removes Network/WAF Shield Rule' : 'Updates Network / WAF Security Shield';
  } else if (combinedText.includes('iam') || combinedText.includes('serviceaccount') || combinedText.includes('role')) {
    scopePill = 'Updates Who Has Access (IAM)';
  } else if (combinedText.includes('cloud run') || combinedText.includes('/cloudrun/')) {
    scopePill = isDelete ? 'Takes Serverless App Offline' : 'Updates Serverless App Container';
  } else if (combinedText.includes('compute') || combinedText.includes('/vms/')) {
    scopePill = isDelete ? 'Deletes Virtual Machine Server' : 'Changes Virtual Machine State';
  } else if (combinedText.includes('storage') || combinedText.includes('bucket')) {
    scopePill = isDelete ? 'Deletes Storage Bucket / File' : 'Updates Cloud Storage Folder';
  } else if (combinedText.includes('bigquery') || combinedText.includes('dataset')) {
    scopePill = isDelete ? 'Deletes BigQuery Table / Dataset' : 'Runs BigQuery Data Operation';
  } else if (combinedText.includes('/emulators/') || String(location || '').includes('127.0.0.1')) {
    scopePill = isDelete
      ? 'Mutates Local 127.0.0.1 Emulator (Zero Cloud Impact)'
      : 'Updates Local 127.0.0.1 SDK (Zero Cloud Impact)';
  }

  // 4. Use explicit laymanSummary if provided, otherwise synthesize a crystal-clear layman paragraph
  if (laymanSummary && String(laymanSummary).trim().length > 0) {
    return {
      paragraph: String(laymanSummary).replace(/^In Plain English:\s*/i, '').trim(),
      costPill,
      costPillTone,
      undoPill,
      undoPillTone,
      scopePill,
    };
  }

  const firstStep = String(whatHappensNext || '')
    .split('\n')[0]
    ?.replace(/^[0-9]+\.\s*/, '')
    .trim();
  const cleanImpact = String(impactWarning || '').trim();
  const cleanTitle = String(title || '').replace(/\?$/, '').trim();

  let paragraph = '';
  if (cleanImpact && firstStep && !firstStep.includes(cleanImpact.slice(0, 28))) {
    paragraph = `${cleanImpact} Specifically, ${firstStep.charAt(0).toLowerCase()}${firstStep.slice(1)}`;
  } else if (cleanImpact) {
    paragraph = cleanImpact;
  } else if (firstStep) {
    paragraph = `${cleanTitle ? `${cleanTitle}: ` : ''}${firstStep}`;
  } else if (isDelete) {
    paragraph = `Permanently deletes "${targetName}" (${resourceKind || 'Cloud Resource'}) in ${location} on project "${projectId}" and stops any associated runtime or storage billing.`;
  } else {
    paragraph = `Executes ${method || 'live configuration update'} on "${targetName}" (${resourceKind || location}) in project "${projectId}".`;
  }

  return {
    paragraph,
    costPill,
    costPillTone,
    undoPill,
    undoPillTone,
    scopePill,
  };
}

/**
 * MandatoryDeleteConfirmationModal:
 * High-visibility Zero-Trust Safety Gatekeeper that intercepts every destructive
 * DELETE or 1-tap mutating action across all 22 CloudPulse 2026 studios and explains
 * in both Plain English (Layman Summary) and exact technical steps what will happen.
 */
function MandatoryDeleteConfirmationModal({
  activeItem,
  queueLength = 0,
  overview = null,
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
    gateType,
    releaseTrack = 'GA',
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
    whatHappensNext,
    costWarning,
    impactWarning,
  } = activeItem.descriptor;

  const isOneTapAction = gateType === 'ONE_TAP_CLOUD_ACTION';
  const normalizedTrack = String(releaseTrack || 'GA').toUpperCase();
  const laymanInfo = buildPlainEnglishModalSummary(activeItem.descriptor);

  // Compute live dependency blast radius from project overview state
  const blastRadiusItems = [];
  const vms = overview?.compute?.vms || overview?.vms || [];
  const runServices = overview?.cloudRun?.services || overview?.cloudRunServices || [];
  const cleanTarget = String(targetName || '')
    .split(' ')[0]
    .split('@')[0]
    .trim();

  if (String(resourceKind || '').includes('Secret Manager')) {
    if (!isOneTapAction) {
      blastRadiusItems.push(
        `Secret payload "${cleanTarget}" will NEVER revert to plaintext — encrypted bytes are permanently erased.`
      );
    } else {
      blastRadiusItems.push(
        `Hardware-encrypted AES-256 operation on "${cleanTarget}" via secretmanager.googleapis.com/v1.`
      );
    }
    const matchingRun = runServices.filter((svc) =>
      JSON.stringify(svc || {}).includes(cleanTarget)
    );
    if (matchingRun.length > 0) {
      blastRadiusItems.push(
        isOneTapAction
          ? `${matchingRun.length} Cloud Run service(s) (${matchingRun
              .map((s) => s.name)
              .join(', ')}) mount secretKeyRef "${cleanTarget}".`
          : `${matchingRun.length} Cloud Run service(s) (${matchingRun
              .map((s) => s.name)
              .join(', ')}) reference "${cleanTarget}" and will fail to start until healed!`
      );
    } else if (runServices.length > 0 && !isOneTapAction) {
      blastRadiusItems.push(
        `Scanned ${runServices.length} live Cloud Run service(s) in project "${projectId}" — verify no container mounts secretKeyRef "${cleanTarget}".`
      );
    }
  } else if (String(resourceKind || '').includes('VPC')) {
    const attachedVms = vms.filter((vm) =>
      String(vm.network || 'default').includes(cleanTarget)
    );
    if (attachedVms.length > 0) {
      blastRadiusItems.push(
        `${attachedVms.length} live Compute VM(s) (${attachedVms
          .map((v) => v.name)
          .join(', ')}) are attached to VPC "${cleanTarget}".`
      );
    } else {
      blastRadiusItems.push(
        `Scanned ${vms.length} Compute VM(s) — zero active VM NICs blocking VPC teardown.`
      );
    }
  } else if (String(resourceKind || '').includes('Compute Engine')) {
    const matchedVm = vms.find((v) => v.name === cleanTarget);
    if (matchedVm) {
      blastRadiusItems.push(
        `Live VM State: ${matchedVm.status || 'RUNNING'} · Machine: ${
          matchedVm.machineType || 'unknown'
        } · External IP: ${matchedVm.externalIp || 'None (Internal Only)'}`
      );
    }
  } else if (String(resourceKind || '').includes('Cloud Run')) {
    const matchedRun = runServices.find((s) => s.name === cleanTarget);
    if (matchedRun?.uri) {
      blastRadiusItems.push(
        `Live HTTPS Traffic Endpoint ${matchedRun.uri} ${
          isOneTapAction
            ? 'will receive this live configuration / traffic update.'
            : 'will immediately return 404.'
        }`
      );
    }
  }

  const rkLower = `${resourceKind || ''} ${endpoint || ''} ${method || ''}`.toLowerCase();

  const effectiveWhatHappens =
    whatHappensNext ||
    `1. Authenticates against the Google Cloud REST control plane for "${resourceKind || 'Target Resource'}" in project "${projectId}" (${location || 'Global'}).\n2. Executes ${method || 'DELETE'} on "${targetName}".\n3. ${
      impactWarning
        ? String(impactWarning).replace(/^\d+\.\s*/, '')
        : `Verifies resource state convergence and records the audit entry in the Flight Recorder.`
    }`;

  const parsedExecutionSteps = String(effectiveWhatHappens || '')
    .split(/\n+|(?=\b[1-9]\.\s)/)
    .map((line) => line.replace(/^[0-9]+\.\s*/, '').trim())
    .filter(Boolean);

  const showSeparateImpactBox =
    Boolean(impactWarning) &&
    Boolean(whatHappensNext) &&
    String(impactWarning).trim() !== String(whatHappensNext).trim();

  const synthesizedDomainCostWarning = (() => {
    if (rkLower.includes('secret')) {
      return isOneTapAction
        ? `SECRET MANAGER PRICING ($0.00 FREE TIER): Google Cloud Secret Manager includes 6 active versions and 10,000 access operations/month for $0.00/mo ($0.06/version-month beyond 6; disabled versions cost $0.00/mo).`
        : `SECRET MANAGER BILLING STOP ($0.00/MO AFTER DELETION): Deleting "${targetName}" immediately stops all $0.06/version-month Secret Manager storage charges.`;
    }
    if (rkLower.includes('storage') || rkLower.includes('bucket') || rkLower.includes('object')) {
      return isOneTapAction
        ? `CLOUD STORAGE PRICING ($0.00 SAME-REGION EGRESS): Standard storage includes 5 GB-month Always-Free in US regions ($0.020/GB-mo beyond Free Tier) with $0.00/GB intra-region transfer.`
        : `CLOUD STORAGE BILLING STOP ($0.00/GB-MO AFTER DELETION): Deleting "${targetName}" stops ongoing $/GB-month object storage charges (unless Soft-Delete retention keeps a temporary trash copy).`;
    }
    if (rkLower.includes('bigquery') || rkLower.includes('dataset')) {
      return isOneTapAction
        ? `BIGQUERY ALWAYS-FREE TIER: Includes 10 GiB of free active storage and 1 TiB of free SQL querying every month.`
        : `BIGQUERY STORAGE BILLING STOP ($0.00/MO AFTER DELETION): Deleting "${targetName}" stops active ($0.02/GiB-mo) and long-term ($0.01/GiB-mo) BigQuery table storage billing.`;
    }
    if (rkLower.includes('cloud run') || rkLower.includes('/cloudrun/')) {
      return isOneTapAction
        ? `SERVERLESS SCALE-TO-ZERO ($0.00/HR IDLE): Cloud Run v2 includes 2 million free requests/month and bills $0.00/hr when minInstanceCount=0.`
        : `SERVERLESS TEARDOWN ($0.00/HR AFTER DELETION): Deleting "${targetName}" stops any warm min-instance compute billing immediately.`;
    }
    if (rkLower.includes('firewall') || rkLower.includes('iam') || rkLower.includes('serviceaccount') || rkLower.includes('role') || rkLower.includes('vpc')) {
      return `ZERO CONTROL-PLANE COST ($0.00/MO): VPC firewall rules, routes, and IAM policy/service-account bindings are 100% free in Google Cloud.`;
    }
    if (rkLower.includes('sql') || rkLower.includes('alloydb') || rkLower.includes('spanner') || rkLower.includes('gke') || rkLower.includes('dataproc')) {
      return isOneTapAction
        ? `DEDICATED INFRASTRUCTURE BILLING NOTICE: Managed database and cluster instances accrue hourly vCPU/RAM and storage charges in project "${projectId}" while running.`
        : `HOURLY CLUSTER/DB BILLING STOP ($0.00/HR AFTER TEARDOWN): Deleting "${targetName}" terminates its hourly compute and storage billing immediately.`;
    }
    return isOneTapAction
      ? `CLOUD BILLING & COST NOTICE: Control-plane policy updates cost $0.00/mo; compute or storage changes follow standard Google Cloud pricing and Always-Free Tier allowances on "${projectId}".`
      : `COMPUTE & RESOURCE TEARDOWN NOTICE: Deleting "${targetName}" terminates its active hourly runtime billing; verify no unattached static external IPv4 addresses ($0.01/hr) or orphaned disks remain in "${projectId}".`;
  })();

  const effectiveCostWarning = costWarning || synthesizedDomainCostWarning;

  return (
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className={`w-full max-w-xl rounded-2xl bg-white dark:bg-[#202124] border-2 ${
          isOneTapAction
            ? 'border-amber-500/80 shadow-2xl shadow-amber-950/50'
            : 'border-red-500/80 shadow-2xl shadow-red-950/50'
        } overflow-hidden max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hazard / Cost Gatekeeper Header */}
        <div
          className={`bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-950 border-b ${
            isOneTapAction ? 'border-amber-500/40' : 'border-red-500/40'
          } px-5 py-3.5 flex items-center justify-between gap-3 text-white shrink-0`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                isOneTapAction
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  {headerBadge ||
                    (isOneTapAction
                      ? 'CloudPulse 2026 1-Tap Cloud Action & Cost Gatekeeper'
                      : 'CloudPulse 2026 Destructive Action Gatekeeper')}
                </span>
                {normalizedTrack === 'ALPHA' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">
                    [ALPHA · EARLY ACCESS]
                  </span>
                )}
                {normalizedTrack === 'BETA' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                    [BETA · PUBLIC PREVIEW]
                  </span>
                )}
                {normalizedTrack === 'GA' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                    [GA · LIVE GCP API]
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                {title}
              </h3>
            </div>
          </div>
          {queueLength > 1 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/30 border border-white/20 shrink-0">
              1 of {queueLength} queued
            </span>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto">
          {/* Resource Target Summary Card */}
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              isOneTapAction
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isOneTapAction
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {targetLabel ||
                  (isOneTapAction
                    ? 'Target Cloud Resource & 1-Tap Operation'
                    : 'Target Resource to Destroy')}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white ${
                  isOneTapAction ? 'bg-amber-600' : 'bg-red-600'
                }`}
              >
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

          {/* Plain-English Layman Summary Card (What This Actually Does & Why) */}
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/35 text-xs text-zinc-900 dark:text-zinc-100 leading-relaxed space-y-2.5">
            <div className="font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider text-[10px] font-mono flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                In Plain English · What This Actually Does
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40">
                LAYMAN TRANSLATION
              </span>
            </div>
            <p className="text-xs sm:text-[13px] font-semibold leading-relaxed text-zinc-900 dark:text-zinc-100">
              {laymanInfo.paragraph}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-0.5 text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-white/85 dark:bg-zinc-900/90 border border-emerald-500/25">
                <div className="text-[9px] uppercase text-zinc-400">
                  What It Touches
                </div>
                <div className="font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                  {laymanInfo.scopePill}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white/85 dark:bg-zinc-900/90 border border-emerald-500/25">
                <div className="text-[9px] uppercase text-zinc-400">
                  Cost / Billing Impact
                </div>
                <div
                  className={`font-extrabold truncate ${
                    laymanInfo.costPillTone === 'emerald'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {laymanInfo.costPill}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-white/85 dark:bg-zinc-900/90 border border-emerald-500/25">
                <div className="text-[9px] uppercase text-zinc-400">
                  Can I Undo It?
                </div>
                <div
                  className={`font-extrabold truncate ${
                    laymanInfo.undoPillTone === 'emerald'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : laymanInfo.undoPillTone === 'amber'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {laymanInfo.undoPill}
                </div>
              </div>
            </div>
          </div>

          {/* 1. What Happens Next (Step-by-Step Cloud Execution) */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-2">
            <div className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] font-mono flex items-center justify-between gap-2">
              <span>1. What Happens Next (Live Cloud Execution Sequence)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30">
                PRE-EXECUTION PREVIEW
              </span>
            </div>
            {parsedExecutionSteps.length > 1 ? (
              <div className="space-y-1.5">
                {parsedExecutionSteps.map((stepText, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-white/75 dark:bg-zinc-900/80 border border-blue-500/20"
                  >
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0 mt-0.5">
                      STEP 0{idx + 1}
                    </span>
                    <span className="font-medium text-[11px] sm:text-xs break-words">
                      {stepText}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-medium">{effectiveWhatHappens}</p>
            )}
            {showSeparateImpactBox && (
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/25 text-[11px] font-medium text-blue-950 dark:text-blue-200">
                <span className="font-mono font-extrabold uppercase text-[9px] tracking-wider text-blue-600 dark:text-blue-400 mr-1.5">
                  Operational Impact:
                </span>
                {impactWarning}
              </div>
            )}
            <div className="text-[10px] font-mono text-zinc-500 truncate pt-0.5">
              Control-Plane Route: {endpoint}
            </div>
          </div>

          {/* 2. Cloud Billing & Cost Impact Warning */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-1.5">
            <div className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px] font-mono flex items-center justify-between gap-2">
              <span>2. Google Cloud Billing & Cost Impact Warning</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                FINOPS GUARDRAIL
              </span>
            </div>
            <p className="font-medium">{effectiveCostWarning}</p>
          </div>

          {/* Live Dependency & Blast-Radius Pre-Flight Scan */}
          {blastRadiusItems.length > 0 && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 space-y-1">
              <div className="font-extrabold text-blue-600 dark:text-blue-400">
                Live Dependency & Blast-Radius Pre-Flight Scan
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {blastRadiusItems.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-md text-xs font-mono font-extrabold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              Cancel (Do Not Execute) [Esc]
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2.5 rounded-md text-xs font-mono font-extrabold text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isOneTapAction
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
              }`}
            >
              <span>
                {confirmLabel ||
                  (isOneTapAction
                    ? 'Acknowledge Cost & Execute 1-Tap Action'
                    : 'Confirm & Permanently Delete')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TimezoneProvider>
        <CloudPulseCockpit />
      </TimezoneProvider>
    </ThemeProvider>
  );
}
