import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Database,
  Zap,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  PlusCircle,
  Cpu,
  Lock,
  Layers,
  Terminal,
  Trash2,
  ArrowRight,
  GitBranch,
  Activity,
  Globe,
  Server,
  Rocket,
  Scale,
  BookOpen,
  Play,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Box,
  Download,
  UserPlus,
  HardDrive,
  TrendingDown,
  FileCode,
  Wand2,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Timer,
  Pause,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';
import ZeroSniffingWebCryptoEnclaveBar, {
  getSharedPreferredProvider,
} from './ZeroSniffingWebCryptoEnclaveBar';

const ALLOYDB_PILLARS = [
  {
    id: 'EXPRESS_QUICKSTART',
    label: 'AlloyDB Express & Fleet',
    badge: 'PG 18 · Scale-to-0',
    icon: Rocket,
    subtitle: 'Zero to running in minutes + 1-click in-place Enterprise upgrade',
  },
  {
    id: 'ZERO_LOCKIN_PGLOGICAL',
    label: 'Zero Lock-in & Omni',
    badge: 'pglogical · DR Exit',
    icon: GitBranch,
    subtitle: 'Logical migration, 100% PG compatibility, Local Omni & Stock PG failover',
  },
  {
    id: 'SCANN_VECTOR_RAG',
    label: 'SCaNN Vector & RAG',
    badge: 'SCaNN vs HNSW',
    icon: Sparkles,
    subtitle: 'Google SCaNN index benchmarks, Vertex AI embeddings & production RAG',
  },
  {
    id: 'BEYOND_AURORA_AGENTS',
    label: 'Beyond Aurora & Agents',
    badge: 'AI + Columnar HTAP',
    icon: Cpu,
    subtitle: 'Autonomous PostgreSQL AI Agents & 100x Columnar Engine vs AWS Aurora',
  },
  {
    id: 'LIVE_SQL_AND_OMNI',
    label: 'Live SQL & Omni Runner',
    badge: 'Real psql · Docker',
    icon: Terminal,
    subtitle: 'Run live EXPLAIN ANALYZE on Express/Proxy + 1-click Local AlloyDB Omni Docker',
  },
  {
    id: 'PLAYBOOK_MATRIX',
    label: '10-Topic Field Playbook',
    badge: '4 Pillars · 10 Labs',
    icon: BookOpen,
    subtitle: 'Interactive matrix of all 10 AlloyDB differentiation scenarios & live jump links',
  },
];

const DEMO_DIRECTOR_TRACKS = [
  {
    id: 'KEYNOTE_10M',
    label: '10-Min Keynote: Express → Sovereign Enterprise',
    durationMin: 10,
    audience: 'Developers, Architects & Executives',
    beats: [
      {
        id: 'k1',
        title: 'Beat 1 · Zero-Friction AlloyDB Express (PG 18)',
        targetSec: 120,
        pillar: 'EXPRESS_QUICKSTART',
        sayThis:
          'Developers used to skip AlloyDB because Enterprise required VPC peering and always-on nodes. AlloyDB Express starts with 1 command (--enable-express), PostgreSQL 18, Public DNS, and Scale-to-Zero—and upgrades in-place to 288-vCPU Enterprise with --no-enable-express.',
        objection:
          'Q: "Why not Neon or Supabase?" → A: You get the same instant scale-to-zero Day-1 DX, but Day 100 is an in-place flag flip to Google Colossus 99.99% SLA, Columnar HTAP, and SCaNN—zero migration.',
        actionLabel: 'Run 6-Gate Live GCP Readiness X-Ray',
        actionKey: 'RUN_READINESS_XRAY',
      },
      {
        id: 'k2',
        title: 'Beat 2 · Live Local Omni Parity & Real psql Introspection',
        targetSec: 120,
        pillar: 'LIVE_SQL_AND_OMNI',
        sayThis:
          'Develop locally at $0.00/hr against real google/alloydbomni Docker—identical PostgreSQL, google_columnar_engine, and google_ml_integration extensions—then swap DATABASE_URL to Cloud AlloyDB.',
        objection:
          'Q: "Does it actually run real Postgres?" → A: Watch live /usr/bin/psql introspect our running local AlloyDB Omni container in ~75ms.',
        actionLabel: 'Introspect Live AlloyDB Omni via psql',
        actionKey: 'RUN_LIVE_INTROSPECT',
      },
      {
        id: 'k3',
        title: 'Beat 3 · SCaNN Vector vs. pgvector HNSW at 10M–100M Scale',
        targetSec: 120,
        pillar: 'SCANN_VECTOR_RAG',
        sayThis:
          'Standard pgvector HNSW blows up RAM at 10M+ vectors. Google Research SCaNN cuts index RAM by ~75% and boosts QPS 4x–10x while keeping hybrid relational WHERE filters inside ACID PostgreSQL.',
        objection:
          'Q: "Do we need Pinecone/Qdrant?" → A: No—eliminate sync drift and extra vector-DB bills by running SCaNN + inline Vertex AI embedding() inside AlloyDB.',
        actionLabel: 'Load Live SCaNN PoV Benchmark into psql',
        actionKey: 'LOAD_SCANN_POV',
      },
      {
        id: 'k4',
        title: 'Beat 4 · Zero Vendor Lock-in (pglogical DDL Audit & Stock PG Exit)',
        targetSec: 120,
        pillar: 'ZERO_LOCKIN_PGLOGICAL',
        subView: 'STOCK_PG_EXIT_DR',
        sayThis:
          'AlloyDB is 100% PostgreSQL wire-compatible. Audit any existing Aurora/RDS schema in seconds for missing Primary Keys or Aurora lock-in extensions, and replicate continuously OUT to stock PostgreSQL for a regulator-verifiable exit.',
        objection:
          'Q: "What if we ever need to leave?" → A: Native pglogical bi-directional WAL streaming gives you a live, tested failover to open-source PostgreSQL—zero lock-in.',
        actionLabel: 'Run Live PostgreSQL DDL Compatibility Audit',
        actionKey: 'RUN_COMPAT_AUDIT',
      },
      {
        id: 'k5',
        title: 'Beat 5 · C-Suite Sign-Off: Sovereign CMEK/DORA + Terraform HCL',
        targetSec: 120,
        pillar: 'BEYOND_AURORA_AGENTS',
        subView: 'SOVEREIGN_SHIELD',
        sayThis:
          'For the CISO and CFO: bind EU clusters to your own Cloud KMS / External Key Manager (CMEK/EKM), verify 6 Sovereign DORA/GDPR controls live, and export both the Boardroom Migration Dossier and production Terraform HCL in 1 click.',
        objection:
          'Q: "How do we pass DORA Art. 28?" → A: CMEK/EKM key sovereignty + EU residency + pgaudit + air-gapped AlloyDB Omni & pglogical exit—all verified live.',
        actionLabel: 'Run Live 6-Control Sovereign Cloud Audit',
        actionKey: 'RUN_SOVEREIGN_AUDIT',
      },
    ],
  },
  {
    id: 'CSUITE_7M',
    label: '7-Min C-Suite & CISO Pitch: Beyond Aurora & Sovereign Cloud',
    durationMin: 7,
    audience: 'CTO, CFO, CISO, VP Engineering',
    beats: [
      {
        id: 'c1',
        title: 'Beat 1 · 3-Systems-to-1 TCO Consolidation vs. AWS Aurora',
        targetSec: 120,
        pillar: 'BEYOND_AURORA_AGENTS',
        subView: 'AURORA_PARITY',
        sayThis:
          'Consolidate AWS Aurora + standalone Vector DB + Redshift/OLAP offload into one AlloyDB cluster with 99.99% SLA inclusive of maintenance—watch the 36-month cumulative savings curve widen live.',
        objection:
          'Q: "What about Aurora I/O surprise bills?" → A: AlloyDB eliminates per-I/O billing spikes and accelerates analytics 100x natively via the built-in Columnar Engine.',
        actionLabel: 'Export Boardroom Executive Dossier (.md)',
        actionKey: 'EXPORT_DOSSIER',
      },
      {
        id: 'c2',
        title: 'Beat 2 · Live 6-Control Sovereign CMEK/EKM & DORA/GDPR Shield',
        targetSec: 120,
        pillar: 'BEYOND_AURORA_AGENTS',
        subView: 'SOVEREIGN_SHIELD',
        sayThis:
          'Live-audit real Cloud KMS keys, EU data residency, Zero Public IP (PSC), pgaudit, and DORA Art. 28 exit readiness across your GCP project.',
        objection:
          'Q: "Who holds the encryption keys?" → A: You do—via Cloud KMS CMEK or External Key Manager (Thales/Fortanix/Utimaco) with cryptographic revocation.',
        actionLabel: 'Run Live 6-Control Sovereign Cloud Audit',
        actionKey: 'RUN_SOVEREIGN_AUDIT',
      },
      {
        id: 'c3',
        title: 'Beat 3 · Zero-Lock-in Exit Proof (pglogical → Stock Postgres)',
        targetSec: 90,
        pillar: 'ZERO_LOCKIN_PGLOGICAL',
        subView: 'STOCK_PG_EXIT_DR',
        sayThis:
          'Regulators demand a tested exit plan, not a slide. AlloyDB streams WAL changes continuously to stock open-source PostgreSQL anywhere.',
        objection:
          'Q: "Does our existing app code need rewrites?" → A: Zero lines changed—Spring Boot, Prisma, Django, and standard psycopg/pg drivers work drop-in.',
        actionLabel: 'Run Live DDL & pglogical Audit',
        actionKey: 'RUN_COMPAT_AUDIT',
      },
      {
        id: 'c4',
        title: 'Beat 4 · Instant Production Terraform HCL Blueprint (.tf)',
        targetSec: 90,
        pillar: 'BEYOND_AURORA_AGENTS',
        subView: 'TERRAFORM_HCL',
        sayThis:
          'Turn this entire Sovereign AlloyDB architecture—CMEK cluster, Read Pool, pgaudit flags, and Zero-Password IAM principal—into auditable Terraform HCL in 1 click.',
        objection:
          'Q: "How fast can platform engineering deploy this?" → A: Download the compiled .tf bound to your live projectNumber and run terraform plan today.',
        actionLabel: 'Compile Live Production Terraform HCL',
        actionKey: 'COMPILE_TERRAFORM',
      },
    ],
  },
  {
    id: 'AI_DEV_8M',
    label: '8-Min AI & Data Engineer Deep Dive: SCaNN + Gemini 4 Agents',
    durationMin: 8,
    audience: 'AI/ML Engineers, GenAI Architects, DBAs',
    beats: [
      {
        id: 'a1',
        title: 'Beat 1 · SCaNN Index RAM Curve vs. pgvector HNSW',
        targetSec: 120,
        pillar: 'SCANN_VECTOR_RAG',
        sayThis:
          'Compare tree-based anisotropic quantization (SCaNN) vs graph-heavy HNSW across 1M–100M vectors and 768–3072 dimensions—~75% less RAM and higher recall under selective WHERE filters.',
        objection:
          'Q: "How is it tuned?" → A: MODE=AUTO handles tree partitioning and auto-maintenance automatically as rows grow.',
        actionLabel: 'Load Live SCaNN PoV Benchmark',
        actionKey: 'LOAD_SCANN_POV',
      },
      {
        id: 'a2',
        title: 'Beat 2 · Dual-Engine Gemini 4 NL2SQL Copilot',
        targetSec: 120,
        pillar: 'LIVE_SQL_AND_OMNI',
        sayThis:
          'Synthesize runnable AlloyDB SCaNN, Columnar, and pglogical SQL from plain English using Gemini 4 Neon, Carbon, Argon, or Hydrogen—via keyless Vertex AI OAuth2 or RSA-vaulted AI Studio key.',
        objection:
          'Q: "Can we run it immediately?" → A: 1 click loads it straight into the live /usr/bin/psql runner above.',
        actionLabel: 'Run Dual-Engine Gemini 4 NL2SQL Now',
        actionKey: 'RUN_NL2SQL',
      },
      {
        id: 'a3',
        title: 'Beat 3 · Autonomous AI Agents Inside PostgreSQL',
        targetSec: 120,
        pillar: 'BEYOND_AURORA_AGENTS',
        subView: 'AI_AGENTS',
        sayThis:
          'Store transactional agent state, LangGraph checkpoints, auto-generated vector embeddings, and inline Gemini 4 reasoning in one ACID database—replacing 3 separate stores.',
        objection:
          'Q: "Why fails inline embedding() in prod?" → A: Usually missing roles/aiplatform.user on gcp-sa-alloydb—our 6-Gate X-Ray catches and fixes it in 1 click.',
        actionLabel: 'Run 6-Gate Vertex AI & IAM Readiness X-Ray',
        actionKey: 'RUN_READINESS_XRAY',
      },
      {
        id: 'a4',
        title: 'Beat 4 · Ship Today on AlloyDB Express + Cloud Run',
        targetSec: 120,
        pillar: 'EXPRESS_QUICKSTART',
        sayThis:
          'Start on AlloyDB Express PG 18 with Next.js + Cloud Run, then upgrade in-place to Enterprise Read Pools without changing a single connection string.',
        objection:
          'Q: "Can we test all 10 scenarios?" → A: Open the 10-Topic Field Playbook tab for 1-click runnable labs across every scenario.',
        actionLabel: 'Open 10-Topic Field Playbook Matrix',
        actionKey: 'OPEN_PLAYBOOK',
      },
    ],
  },
];

const ALLOYDB_EXPRESS_REGIONS = [
  { id: 'us-west1', label: 'us-west1 (Oregon · Express Verified · C4A Ready)', c4aReady: true },
  { id: 'europe-west1', label: 'europe-west1 (Belgium · C4A Ready)', c4aReady: true },
  { id: 'us-east1', label: 'us-east1 (South Carolina · C4A Ready)', c4aReady: true },
  { id: 'us-east4', label: 'us-east4 (Northern Virginia · C4A Ready)', c4aReady: true },
  { id: 'us-central1', label: 'us-central1 (Iowa · C4A Ready)', c4aReady: true },
  { id: 'europe-west4', label: 'europe-west4 (Netherlands · C4A Ready)', c4aReady: true },
  { id: 'asia-southeast1', label: 'asia-southeast1 (Singapore · C4A Ready)', c4aReady: true },
  { id: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)', c4aReady: false },
];

const TEN_SCENARIOS_PLAYBOOK = [
  {
    id: 'lockin-pglogical',
    topicArea: 'Vendor Lock-in Concerns',
    title: 'Zero-Downtime Migration: Moving to AlloyDB with pglogical Logical Replication',
    persona: 'Database Administrators, Platform Engineers',
    stack: ['PostgreSQL', 'pglogical', 'WAL Logical Decoding'],
    angle: 'Native PostgreSQL logical replication enabling seamless migration and fallback without proprietary lock-in or heavyweight tooling.',
    targetPillar: 'ZERO_LOCKIN_PGLOGICAL',
    targetLab: 'PGLOGICAL_INBOUND',
  },
  {
    id: 'lockin-compat',
    topicArea: 'Vendor Lock-in Concerns',
    title: '100% PostgreSQL Compatibility: Porting Production Apps to AlloyDB with Zero Code Changes',
    persona: 'Backend Engineers, Application Developers',
    stack: ['PostgreSQL', 'Spring Boot', 'Node.js', 'Django'],
    angle: 'Drop-in compatibility with full ecosystem and extension support, guaranteeing existing queries, ORMs, and drivers run unmodified.',
    targetPillar: 'ZERO_LOCKIN_PGLOGICAL',
    targetLab: 'ZERO_CODE_COMPAT',
  },
  {
    id: 'lockin-omni',
    topicArea: 'Vendor Lock-in Concerns',
    title: 'Develop Locally, Scale Globally: Seamless Workflow from Local PostgreSQL to Cloud AlloyDB',
    persona: 'Full-Stack Developers, DevOps Engineers',
    stack: ['Docker', 'Local PostgreSQL', 'AlloyDB Omni'],
    angle: 'Unified developer experience using local PostgreSQL or AlloyDB Omni in dev, promoting identical schema and behaviors to production.',
    targetPillar: 'ZERO_LOCKIN_PGLOGICAL',
    targetLab: 'OMNI_LOCAL_CLOUD',
  },
  {
    id: 'lockin-dr-exit',
    topicArea: 'Vendor Lock-in Concerns',
    title: 'Disaster Recovery Without Lock-in: Configuring AlloyDB Failover to Stock PostgreSQL',
    persona: 'Site Reliability Engineers (SREs), Cloud Architects',
    stack: ['PostgreSQL', 'AlloyDB', 'Bi-Directional Replication'],
    angle: 'Bi-directional replication patterns ensuring complete exit strategy and cross-cloud survivability to standard open-source PostgreSQL.',
    targetPillar: 'ZERO_LOCKIN_PGLOGICAL',
    targetLab: 'STOCK_PG_EXIT_DR',
  },
  {
    id: 'vector-scann',
    topicArea: 'Vector Performance vs. pgvector',
    title: 'Real-World Vector Search: Hands-On Performance with AlloyDB and the SCaNN Index',
    persona: 'AI/ML Engineers, Data Engineers',
    stack: ['pgvector', 'AlloyDB SCaNN', 'LangChain'],
    angle: "Google's proprietary SCaNN algorithm integrated into AlloyDB delivers orders-of-magnitude faster vector recall and query latency than standard HNSW/IVFFlat.",
    targetPillar: 'SCANN_VECTOR_RAG',
    targetLab: 'SCANN_VS_HNSW',
  },
  {
    id: 'vector-rag-scale',
    topicArea: 'Vector Performance vs. pgvector',
    title: 'Production RAG at Scale: Measuring End-to-End Query Latency on High-Dimensional Embeddings',
    persona: 'GenAI Architects, Backend Developers',
    stack: ['pgvector', 'Vertex AI', 'AlloyDB'],
    angle: 'Demonstrating high-QPS, low-latency similarity search under real enterprise query loads without offloading to standalone vector databases.',
    targetPillar: 'SCANN_VECTOR_RAG',
    targetLab: 'RAG_LATENCY_HARNESS',
  },
  {
    id: 'aurora-agents',
    topicArea: 'AlloyDB vs. AWS Aurora Parity',
    title: 'Beyond Aurora: Powering Autonomous AI Workflows with PostgreSQL for Agents',
    persona: 'AI Systems Architects, Enterprise Architects',
    stack: ['AlloyDB', 'Gemini', 'Multi-Agent Frameworks'],
    angle: 'PostgreSQL engineered for AI agents, integrating native LLM reasoning, state management, and real-time operational context that legacy cloud engines cannot match.',
    targetPillar: 'BEYOND_AURORA_AGENTS',
    targetLab: 'AI_AGENTS',
  },
  {
    id: 'aurora-arch',
    topicArea: 'AlloyDB vs. AWS Aurora Parity',
    title: 'Architectural Deep Dive: Why AlloyDB Outperforms Aurora for Modern Enterprise Workloads',
    persona: 'Lead Database Architects, Cloud Strategists',
    stack: ['PostgreSQL', 'AWS Aurora', 'AlloyDB Columnar Engine'],
    angle: 'Disaggregated compute and intelligent storage engine with integrated analytical acceleration and columnar engine, avoiding rigid licensing and Aurora compute limits.',
    targetPillar: 'BEYOND_AURORA_AGENTS',
    targetLab: 'AURORA_PARITY',
  },
  {
    id: 'awareness-express-first',
    topicArea: 'General Lack of Awareness',
    title: 'Zero to Running in Minutes: Building Your First App on AlloyDB Express',
    persona: 'Startup Developers, Full-Stack Engineers',
    stack: ['AlloyDB Express', 'Node.js', 'Python'],
    angle: 'Instant setup and developer-friendly entry point for AlloyDB, providing enterprise-grade speed and reliability without complex cluster management.',
    targetPillar: 'EXPRESS_QUICKSTART',
    targetLab: 'EXPRESS_STARTER',
  },
  {
    id: 'awareness-hackathon-prod',
    topicArea: 'General Lack of Awareness',
    title: 'Rapid Prototyping with AlloyDB Express: From Hackathon Project to Production Architecture',
    persona: 'Software Developers, Technical Founders',
    stack: ['AlloyDB Express', 'Next.js', 'Cloud Run'],
    angle: 'Frictionless developer onboarding paired with an effortless upgrade path to full enterprise AlloyDB clusters as workload demand grows.',
    targetPillar: 'EXPRESS_QUICKSTART',
    targetLab: 'HACKATHON_TO_PROD',
  },
];

export default function AlloyDbMasteryStudio({
  projectId,
  initialSubTab = null,
  subTabNonce = 0,
  onNavigateTab,
  onRunInShell,
  onRefreshOverview,
  onShowToast,
  onShowError,
}) {
  const [activePillar, setActivePillar] = useState(
    initialSubTab && ALLOYDB_PILLARS.some((p) => p.id === initialSubTab)
      ? initialSubTab
      : 'EXPRESS_QUICKSTART'
  );
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);

  // Pillar 1: AlloyDB Express Provisioner & Starter Kit State
  const [expressClusterId, setExpressClusterId] = useState('alloydb-express-app');
  const [expressRegion, setExpressRegion] = useState('us-west1');
  const [expressDbVersion, setExpressDbVersion] = useState('POSTGRES_18');
  const [expressPublicDns, setExpressPublicDns] = useState(true);
  const [expressPscEnabled, setExpressPscEnabled] = useState(true);
  const [expressInitialPassword, setExpressInitialPassword] = useState('');
  const [showCreateClusterDrawer, setShowCreateClusterDrawer] = useState(false);
  const [showAlloyOpsHistory, setShowAlloyOpsHistory] = useState(false);
  const [showExpressSnippets, setShowExpressSnippets] = useState(false);
  const [sqlConsoleClusterId, setSqlConsoleClusterId] = useState('');
  const [connectClusterId, setConnectClusterId] = useState('');
  const [cloudSqlHost, setCloudSqlHost] = useState('');
  const [cloudSqlPort, setCloudSqlPort] = useState('5432');
  const [cloudSqlDb, setCloudSqlDb] = useState('postgres');
  const [cloudSqlUser, setCloudSqlUser] = useState('postgres');
  const [cloudSqlPassword, setCloudSqlPassword] = useState('');
  const [cloudSqlAuthMode, setCloudSqlAuthMode] = useState('PASSWORD'); // 'PASSWORD' | 'IAM_TOKEN'
  const [cloudSqlQuery, setCloudSqlQuery] = useState(
    'SELECT version(), current_database(), current_user, inet_server_addr();'
  );
  const [cloudSqlBusy, setCloudSqlBusy] = useState(false);
  const [cloudSqlResult, setCloudSqlResult] = useState(null);
  const [cloudSqlTables, setCloudSqlTables] = useState([]);
  const [cloudSqlShowRaw, setCloudSqlShowRaw] = useState(false);
  const [pendingLroByCluster, setPendingLroByCluster] = useState({});
  const [lroClockMs, setLroClockMs] = useState(Date.now());
  const [starterStack, setStarterStack] = useState('NEXTJS_CLOUDRUN'); // NODE_PG | PYTHON_FASTAPI | NEXTJS_CLOUDRUN

  useEffect(() => {
    if (Object.keys(pendingLroByCluster).length === 0) return;
    const t = setInterval(() => setLroClockMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [pendingLroByCluster]);

  const resolveClusterHost = (c) => {
    const p = c?.primaryInstance;
    if (!p) return '';
    return String(p.publicDnsName || p.publicIpAddress || p.ipAddress || p.pscDnsName || '').replace(/\.$/, '');
  };

  const openClusterSqlConsole = (c) => {
    if (!c) return;
    if (sqlConsoleClusterId === c.clusterId) {
      setSqlConsoleClusterId('');
      return;
    }
    const host = resolveClusterHost(c) || '127.0.0.1';
    setCloudSqlHost(host);
    setCloudSqlPort('5432');
    setCloudSqlDb('postgres');
    setCloudSqlResult(null);
    setCloudSqlTables([]);
    setCloudSqlShowRaw(false);
    setSqlConsoleClusterId(c.clusterId);
  };

  const runCloudClusterSql = async (mode = 'RUN_CUSTOM_SQL', overrideSql = null) => {
    if (!projectId || !cloudSqlHost.trim()) return;
    const sqlToRun = overrideSql !== null ? overrideSql : cloudSqlQuery;
    if (overrideSql !== null && mode === 'RUN_CUSTOM_SQL') setCloudSqlQuery(overrideSql);
    setCloudSqlBusy(true);
    if (mode !== 'LIST_TABLES') setCloudSqlResult(null);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/execute-sql`,
        {
          host: cloudSqlHost.trim(),
          port: Number(cloudSqlPort) || 5432,
          database: cloudSqlDb.trim() || 'postgres',
          user: cloudSqlUser.trim() || 'postgres',
          password: cloudSqlPassword,
          authMode: cloudSqlAuthMode,
          sql: sqlToRun,
          mode,
        }
      );
      if (mode === 'LIST_TABLES' && Array.isArray(data?.tables)) {
        setCloudSqlTables(data.tables);
        notify(`Loaded ${data.tables.length} table(s) from ${cloudSqlDb || 'postgres'}.`);
      } else {
        setCloudSqlResult({ ok: true, ...data });
      }
    } catch (err) {
      setCloudSqlResult({
        ok: false,
        error: err?.response?.data?.error || err.message || 'psql execution failed.',
        stdout: err?.response?.data?.stdout || '',
        durationMs: err?.response?.data?.durationMs || null,
      });
    } finally {
      setCloudSqlBusy(false);
    }
  };

  // Pillar 2: Zero Lock-in & Omni State
  const [lockInLab, setLockInLab] = useState('PGLOGICAL_INBOUND'); // PGLOGICAL_INBOUND | ZERO_CODE_COMPAT | OMNI_LOCAL_CLOUD | STOCK_PG_EXIT_DR
  const [compatFramework, setCompatFramework] = useState('SPRING_BOOT'); // SPRING_BOOT | NODE_PRISMA | DJANGO_SQLALCHEMY
  const [omniPgVersion, setOmniPgVersion] = useState('latest');
  const [sourcePgHost, setSourcePgHost] = useState('pg-primary.internal.example.com');
  const [targetExitHost, setTargetExitHost] = useState('dr-stock-pg.external.example.com');

  // Pillar 3: SCaNN vs pgvector & RAG State
  const [scannVectorsM, setScannVectorsM] = useState(10); // Millions of vectors
  const [scannDims, setScannDims] = useState(768); // 768 | 1536 | 3072
  const [scannDistance, setScannDistance] = useState('cosine'); // cosine | dot_product | l2
  const [scannMode, setScannMode] = useState('AUTO'); // AUTO | MANUAL
  const [scannTable, setScannTable] = useState('knowledge_chunks');
  const [scannEmbedModel, setScannEmbedModel] = useState('text-embedding-005');

  // Pillar 4: Beyond Aurora & AI Agents State
  const [auroraView, setAuroraView] = useState('AI_AGENTS'); // AI_AGENTS | AURORA_PARITY
  const [agentFramework, setAgentFramework] = useState('ADK_GEMINI'); // ADK_GEMINI | LANGGRAPH_PG

  // Pillar 5: 10-Scenario Playbook Filter
  const [topicFilter, setTopicFilter] = useState('ALL');

  // Selected live instance for 1-click flag patching
  const [selectedInstanceKey, setSelectedInstanceKey] = useState('');

  // --- 10X Innovation State: 6-Gate Readiness X-Ray, Live psql Runner, Local Omni Docker & DDL Compat Auditor ---
  const [readinessXray, setReadinessXray] = useState(null);
  const [loadingXray, setLoadingXray] = useState(false);

  const [omniStatus, setOmniStatus] = useState(null);
  const [omniPort, setOmniPort] = useState(5433);
  const [omniPassword, setOmniPassword] = useState('localdevpass');

  const [liveDsn, setLiveDsn] = useState('postgres://postgres:localdevpass@127.0.0.1:5433/postgres');
  const [liveSqlInput, setLiveSqlInput] = useState(
    'SELECT current_database() AS db, version() AS engine;\nSELECT extname, extversion FROM pg_extension ORDER BY extname;'
  );
  const [liveSqlResult, setLiveSqlResult] = useState(null);
  const [runningLiveSqlMode, setRunningLiveSqlMode] = useState(''); // '' | 'RUN_CUSTOM_SQL' | 'INTROSPECT_ALLOYDB'
  const sqlOutputRef = useRef(null);

  const [compatDdlInput, setCompatDdlInput] = useState(`CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS aws_s3;
CREATE TABLE orders (
  order_id BIGSERIAL PRIMARY KEY,
  customer_id TEXT NOT NULL,
  total_usd NUMERIC(12,2) NOT NULL
);
CREATE TABLE audit_events (
  event_ts TIMESTAMPTZ DEFAULT now(),
  payload JSONB NOT NULL
);
CREATE TABLE knowledge_docs (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(768)
);`);
  const [compatReport, setCompatReport] = useState(null);
  const [auditingCompat, setAuditingCompat] = useState(false);

  // --- Executive Adoption Business Case (Aurora + Vector DB + Analytics -> AlloyDB Consolidation) ---
  const [execVcpu, setExecVcpu] = useState(16);
  const [execStorageTb, setExecStorageTb] = useState(2);
  const [execReplicas, setExecReplicas] = useState(2);
  const [execVectorDbMonthlyUsd, setExecVectorDbMonthlyUsd] = useState(1800);
  const [execAnalyticsOffloadMonthlyUsd, setExecAnalyticsOffloadMonthlyUsd] = useState(2400);
  const [iamUserCluster, setIamUserCluster] = useState('');
  const [iamUserEmail, setIamUserEmail] = useState('');

  // --- Sovereign Cloud, CMEK/EKM & DORA/GDPR Boardroom Shield State ---
  const [sovereignRegion, setSovereignRegion] = useState('europe-west1');
  const [sovereignFramework, setSovereignFramework] = useState('EU_DORA_GDPR');
  const [sovereignAudit, setSovereignAudit] = useState(null);
  const [loadingSovereign, setLoadingSovereign] = useState(false);
  const [selectedKmsKey, setSelectedKmsKey] = useState('');
  const [sovereignClusterId, setSovereignClusterId] = useState('alloydb-sovereign-eu');

  // --- Moonshot State: Live Terraform HCL Compiler + Vertex AI NL2SQL Copilot ---
  const [tfMode, setTfMode] = useState('SOVEREIGN_ENTERPRISE'); // SOVEREIGN_ENTERPRISE | EXPRESS
  const [tfResult, setTfResult] = useState(null);
  const [compilingTf, setCompilingTf] = useState(false);

  const [nlPrompt, setNlPrompt] = useState(
    'Find the top 10 enterprise security runbooks semantically related to zero-downtime pglogical cutover with EXPLAIN ANALYZE'
  );
  const [nlModel, setNlModel] = useState('gemini-4-neon');
  const [nlResult, setNlResult] = useState(null);
  const [runningNl2Sql, setRunningNl2Sql] = useState(false);

  // --- Revolutionary Live Demo Director & Presenter Cockpit State ---
  const [demoModeOpen, setDemoModeOpen] = useState(false);
  const [demoTrackId, setDemoTrackId] = useState('KEYNOTE_10M');
  const [demoBeatIdx, setDemoBeatIdx] = useState(0);
  const [demoTimerRunning, setDemoTimerRunning] = useState(false);
  const [demoElapsedSec, setDemoElapsedSec] = useState(0);

  useEffect(() => {
    if (initialSubTab && ALLOYDB_PILLARS.some((p) => p.id === initialSubTab)) {
      setActivePillar(initialSubTab);
    }
  }, [initialSubTab, subTabNonce]);

  const notify = useCallback(
    (msg) => {
      if (typeof onShowToast === 'function') onShowToast(msg);
    },
    [onShowToast]
  );

  const reportError = useCallback(
    (msg) => {
      if (typeof onShowError === 'function') onShowError(msg);
      else if (typeof onShowToast === 'function') onShowToast(msg);
    },
    [onShowError, onShowToast]
  );

  const copyText = (text, key, label = 'Snippet') => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    notify(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? '' : prev)), 2000);
  };

  const fetchOverview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/overview`
      );
      setOverview(data);
      if (data?.instances?.length > 0 && !selectedInstanceKey) {
        const first = data.instances[0];
        setSelectedInstanceKey(`${first.location}/${first.clusterId}/${first.instanceId}`);
      }
    } catch (err) {
      reportError(err?.response?.data?.error || err.message || 'Failed to load AlloyDB fleet.');
    } finally {
      setLoading(false);
    }
  }, [projectId, reportError, selectedInstanceKey]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const runReadinessXray = useCallback(async () => {
    if (!projectId) return;
    setLoadingXray(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/readiness-xray`,
        { region: expressRegion }
      );
      setReadinessXray(data);
    } catch (err) {
      reportError(err?.response?.data?.error || err.message || 'Readiness X-Ray failed.');
    } finally {
      setLoadingXray(false);
    }
  }, [projectId, expressRegion, reportError]);

  const runSovereignAudit = useCallback(async () => {
    if (!projectId) return;
    setLoadingSovereign(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/sovereign-audit`,
        { region: sovereignRegion, framework: sovereignFramework }
      );
      setSovereignAudit(data);
      if (data?.kmsKeys?.length > 0 && !selectedKmsKey) {
        setSelectedKmsKey(data.kmsKeys[0].name);
      }
      notify(`Sovereign Cloud Score (${sovereignFramework}): ${data.sovereignScore}/100`);
    } catch (err) {
      reportError(err?.response?.data?.error || err.message || 'Sovereign audit failed.');
    } finally {
      setLoadingSovereign(false);
    }
  }, [projectId, sovereignRegion, sovereignFramework, selectedKmsKey, notify, reportError]);

  const fetchOmniStatus = useCallback(async () => {
    if (!projectId) return;
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/omni-local`,
        { action: 'STATUS', port: omniPort, password: omniPassword }
      );
      setOmniStatus(data);
      if (data?.running) {
        if (data.actualPort && data.actualPort !== omniPort) {
          setOmniPort(data.actualPort);
        }
        if (data.actualPassword && data.actualPassword !== omniPassword) {
          setOmniPassword(data.actualPassword);
        }
        if (data.suggestedDsn && liveDsn.includes('127.0.0.1:')) {
          setLiveDsn(data.suggestedDsn);
        }
      }
    } catch {
      // silent
    }
  }, [projectId, omniPort, omniPassword]);

  const runOmniAction = async (action) => {
    if (!projectId) return;
    setBusyKey(`OMNI_${action}`);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/omni-local`,
        { action, tag: omniPgVersion, port: omniPort, password: omniPassword }
      );
      notify(data.message || `Executed ${action}`);
      if (data.suggestedDsn) setLiveDsn(data.suggestedDsn);
      await fetchOmniStatus();
    } catch (err) {
      if (err?.isCancelledByUser) return;
      reportError(err?.response?.data?.error || err.message || 'Local AlloyDB Omni action failed.');
    } finally {
      setBusyKey('');
    }
  };

  const executeLiveSql = async (mode = 'RUN_CUSTOM_SQL', overrideSql = null) => {
    if (!projectId) return;
    setRunningLiveSqlMode(mode);
    // Auto-resolve live running AlloyDB Omni DSN if liveDsn still points to default 5432/5433 while Omni hopped to e.g. 5434
    let targetDsn = liveDsn;
    if (
      omniStatus?.running &&
      omniStatus?.suggestedDsn &&
      /127\.0\.0\.1:(5432|5433)\b/.test(targetDsn) &&
      targetDsn !== omniStatus.suggestedDsn
    ) {
      targetDsn = omniStatus.suggestedDsn;
      setLiveDsn(targetDsn);
    }
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/execute-sql`,
        { dsn: targetDsn, sql: overrideSql !== null ? overrideSql : liveSqlInput, mode }
      );
      setLiveSqlResult(data);
      notify(`Executed ${mode === 'INTROSPECT_ALLOYDB' ? 'Introspection' : 'SQL'} in ${data.durationMs}ms`);
      setTimeout(() => {
        sqlOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    } catch (err) {
      if (err?.isCancelledByUser) return;
      const errData = err?.response?.data;
      const errMsg = errData?.error || err.message || 'Live SQL execution failed.';
      setLiveSqlResult({
        ok: false,
        mode,
        durationMs: errData?.durationMs || 0,
        error: errMsg,
        stdout: errData?.stdout || '',
      });
      reportError(errMsg);
      setTimeout(() => {
        sqlOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 60);
    } finally {
      setRunningLiveSqlMode('');
    }
  };

  const runCompatAudit = async () => {
    if (!projectId) return;
    setAuditingCompat(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/compat-audit`,
        { ddl: compatDdlInput }
      );
      setCompatReport(data);
      notify(`AlloyDB Compatibility Score: ${data.compatibilityScore}/100`);
    } catch (err) {
      reportError(err?.response?.data?.error || err.message || 'Compatibility audit failed.');
    } finally {
      setAuditingCompat(false);
    }
  };

  const sendSqlToLiveRunner = (sqlText, label = 'SQL') => {
    setLiveSqlInput(sqlText);
    setActivePillar('LIVE_SQL_AND_OMNI');
    fetchOmniStatus();
    notify(`Loaded ${label} into Live Wire-Protocol SQL Runner`);
  };

  const compileTerraformHcl = async (overrideMode = null) => {
    if (!projectId) return;
    const targetMode = overrideMode || tfMode;
    setCompilingTf(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/export-terraform`,
        {
          mode: targetMode,
          clusterId: targetMode === 'EXPRESS' ? expressClusterId : sovereignClusterId,
          region: targetMode === 'EXPRESS' ? expressRegion : sovereignRegion,
          databaseVersion: targetMode === 'EXPRESS' ? expressDbVersion : 'POSTGRES_16',
          kmsKeyName: targetMode === 'EXPRESS' ? '' : selectedKmsKey,
          primaryCpu: execVcpu > 8 ? 8 : 4,
          readPoolNodes: execReplicas,
          readPoolCpu: 2,
          iamUserEmail: iamUserEmail.trim(),
        }
      );
      setTfResult(data);
      notify(`Compiled production Terraform HCL (${data.filename})`);
    } catch (err) {
      reportError(err?.response?.data?.error || err.message || 'Terraform compilation failed.');
    } finally {
      setCompilingTf(false);
    }
  };

  const downloadTerraformFile = () => {
    if (!tfResult?.hcl) return;
    const blob = new Blob([tfResult.hcl], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tfResult.filename || 'alloydb-sovereign.tf';
    a.click();
    URL.revokeObjectURL(url);
    notify(`Downloaded ${tfResult.filename || 'alloydb-sovereign.tf'}`);
  };

  const runNl2SqlCopilot = async () => {
    if (!projectId || !nlPrompt.trim()) return;
    setRunningNl2Sql(true);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/nl2sql`,
        {
          prompt: nlPrompt.trim(),
          model: nlModel,
          preferredProvider: getSharedPreferredProvider(),
        }
      );
      setNlResult(data);
      notify(`Synthesized AlloyDB SQL via ${data.engine}`);
    } catch (err) {
      reportError(err?.response?.data?.error || err.message || 'NL2SQL synthesis failed.');
    } finally {
      setRunningNl2Sql(false);
    }
  };

  useEffect(() => {
    if (activePillar === 'LIVE_SQL_AND_OMNI' || activePillar === 'ZERO_LOCKIN_PGLOGICAL') {
      fetchOmniStatus();
    }
  }, [activePillar, fetchOmniStatus]);

  // Live 1.5s progress polling while Docker pull / container startup / pg_isready is active
  useEffect(() => {
    if (!omniStatus?.job?.active) return;
    const timer = setInterval(() => {
      fetchOmniStatus();
    }, 1500);
    return () => clearInterval(timer);
  }, [omniStatus?.job?.active, fetchOmniStatus]);

  // Live Demo Director Timer & Keyboard Shortcuts (Alt+Right / Alt+Left)
  const activeDemoTrack = useMemo(
    () => DEMO_DIRECTOR_TRACKS.find((t) => t.id === demoTrackId) || DEMO_DIRECTOR_TRACKS[0],
    [demoTrackId]
  );
  const activeDemoBeat = activeDemoTrack.beats[demoBeatIdx] || activeDemoTrack.beats[0];

  useEffect(() => {
    if (!demoModeOpen || !demoTimerRunning) return;
    const id = setInterval(() => setDemoElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [demoModeOpen, demoTimerRunning]);

  const goToDemoBeat = useCallback(
    (trackObj, idx) => {
      const safeIdx = Math.max(0, Math.min(trackObj.beats.length - 1, idx));
      const beat = trackObj.beats[safeIdx];
      setDemoBeatIdx(safeIdx);
      if (beat?.pillar) setActivePillar(beat.pillar);
      if (beat?.pillar === 'ZERO_LOCKIN_PGLOGICAL' && beat.subView) {
        setLockInLab(beat.subView);
      } else if (beat?.pillar === 'BEYOND_AURORA_AGENTS' && beat.subView) {
        setAuroraView(beat.subView);
      }
    },
    []
  );

  useEffect(() => {
    if (!demoModeOpen) return;
    const onKeyDown = (e) => {
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goToDemoBeat(activeDemoTrack, demoBeatIdx + 1);
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goToDemoBeat(activeDemoTrack, demoBeatIdx - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [demoModeOpen, activeDemoTrack, demoBeatIdx, goToDemoBeat]);

  const executeDemoBeatAction = async (actionKey) => {
    if (actionKey === 'RUN_READINESS_XRAY') {
      await runReadinessXray();
    } else if (actionKey === 'RUN_LIVE_INTROSPECT') {
      setActivePillar('LIVE_SQL_AND_OMNI');
      await executeLiveSql('INTROSPECT_ALLOYDB');
    } else if (actionKey === 'LOAD_SCANN_POV') {
      setLiveSqlInput(`-- Live Proof-of-Value Benchmark: Seed 2,000 Vectors & Compare SCaNN vs Sequential Scan
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS alloydb_scann;
DROP TABLE IF EXISTS cloudpulse_pov_vectors;
CREATE TABLE cloudpulse_pov_vectors (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  embedding vector(128) NOT NULL
);
INSERT INTO cloudpulse_pov_vectors (category, embedding)
SELECT CASE WHEN g % 3 = 0 THEN 'runbook' ELSE 'incident' END,
       (SELECT array_agg(random()::float4)::vector(128) FROM generate_series(1, 128))
FROM generate_series(1, 2000) g;
CREATE INDEX idx_pov_scann ON cloudpulse_pov_vectors USING scann (embedding cosine) WITH (num_leaves=20);
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, category FROM cloudpulse_pov_vectors
ORDER BY embedding <=> (SELECT embedding FROM cloudpulse_pov_vectors LIMIT 1)
LIMIT 10;`);
      setActivePillar('LIVE_SQL_AND_OMNI');
      notify('Loaded Live SCaNN PoV Benchmark — click Execute Live SQL!');
    } else if (actionKey === 'RUN_COMPAT_AUDIT') {
      setActivePillar('ZERO_LOCKIN_PGLOGICAL');
      await runCompatAudit();
    } else if (actionKey === 'RUN_SOVEREIGN_AUDIT') {
      setActivePillar('BEYOND_AURORA_AGENTS');
      setAuroraView('SOVEREIGN_SHIELD');
      await runSovereignAudit();
    } else if (actionKey === 'EXPORT_DOSSIER') {
      exportExecutiveDossier();
    } else if (actionKey === 'COMPILE_TERRAFORM') {
      setActivePillar('BEYOND_AURORA_AGENTS');
      setAuroraView('TERRAFORM_HCL');
      await compileTerraformHcl();
    } else if (actionKey === 'RUN_NL2SQL') {
      setActivePillar('LIVE_SQL_AND_OMNI');
      await runNl2SqlCopilot();
    } else if (actionKey === 'OPEN_PLAYBOOK') {
      setActivePillar('PLAYBOOK_MATRIX');
    }
  };

  const exportPresenterRunbook = () => {
    const md = `# AlloyDB Live Demo Director Runbook: ${activeDemoTrack.label}

- **Audience**: ${activeDemoTrack.audience}
- **Target Duration**: ${activeDemoTrack.durationMin} minutes
- **GCP Project**: \`${projectId || 'unspecified'}\`

${activeDemoTrack.beats
  .map(
    (b, i) => `## ${i + 1}. ${b.title} (${Math.round(b.targetSec / 60)} min)
- **CloudPulse Pillar**: \`${b.pillar}\`${b.subView ? ` → \`${b.subView}\`` : ''}
- **Say This Out Loud**: ${b.sayThis}
- **Audience Q&A Killer**: ${b.objection}
- **Live Demo Action**: ${b.actionLabel}
`
  )
  .join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alloydb-live-demo-${activeDemoTrack.id.toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    notify(`Exported Presenter Runbook (${activeDemoTrack.label})`);
  };

  const executeAlloyAction = async (payload, key) => {
    if (!projectId) return;
    setBusyKey(key);
    try {
      const { data } = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/alloydb/action`,
        payload
      );
      const opName = data.operation?.name || null;
      const lroClusterKey = payload.clusterId || data.clusterId || '';
      const lroLabelMap = {
        DELETE_CLUSTER: `Deleting cluster "${lroClusterKey}" & instances`,
        CREATE_EXPRESS_CLUSTER: `Provisioning AlloyDB Express cluster "${lroClusterKey}"`,
        CREATE_EXPRESS_PRIMARY_INSTANCE: `Creating 1-vCPU Primary Instance on "${lroClusterKey}"`,
        UPGRADE_EXPRESS_TO_ENTERPRISE: `Upgrading "${lroClusterKey}" to Enterprise AlloyDB`,
        SCALE_INSTANCE_CPU: `Scaling compute on "${lroClusterKey}"`,
        APPLY_INSTANCE_FLAGS: `Applying 10X PostgreSQL flags on "${lroClusterKey}"`,
        TRIGGER_ON_DEMAND_BACKUP: `Creating snapshot backup of "${lroClusterKey}"`,
        ENABLE_PUBLIC_IP_FOR_MY_IP: `Enabling Public IP & authorizing your /32 IP on "${lroClusterKey}"`,
      };
      if (opName && lroClusterKey) {
        setLroClockMs(Date.now());
        setPendingLroByCluster((prev) => ({
          ...prev,
          [lroClusterKey]: {
            action: payload.action,
            label: lroLabelMap[payload.action] || `Running ${payload.action} on "${lroClusterKey}"`,
            startedAt: Date.now(),
            operationId: opName.split('/').pop() || opName,
          },
        }));
      }
      setLastReceipt({
        ok: true,
        action: payload.action,
        message: opName
          ? `${data.message || `Dispatched ${payload.action}`} — Polling live Google Cloud operation…`
          : data.message,
        operation: opName,
        ts: new Date().toLocaleTimeString(),
      });
      notify(data.message || `Executed ${payload.action}`);
      await fetchOverview();
      if (typeof onRefreshOverview === 'function') onRefreshOverview();

      // Actively poll real AlloyDB LRO so async GCP failures (e.g. code 10 tenant project creation) surface immediately
      if (opName && opName.includes('/operations/')) {
        const m = opName.match(/\/locations\/([^/]+)\/operations\/([^/]+)$/);
        if (m) {
          const [, opLoc, opId] = m;
          const pollStarted = Date.now();
          const clearPendingLro = () => {
            if (!lroClusterKey) return;
            setPendingLroByCluster((prev) => {
              const next = { ...prev };
              delete next[lroClusterKey];
              return next;
            });
          };
          const pollOnce = async () => {
            try {
              const pollRes = await axios.get(
                `/api/project/${encodeURIComponent(projectId)}/alloydb/operations/${encodeURIComponent(opLoc)}/${encodeURIComponent(opId)}`
              );
              const op = pollRes.data || {};
              if (op.done) {
                clearPendingLro();
                const elapsedSec = Math.max(1, Math.round((Date.now() - pollStarted) / 1000));
                if (op.errorMessage) {
                  const hint = /tenant project/i.test(op.errorMessage)
                    ? ' (Hint: AlloyDB Express preview may not be enabled in this region/project yet — try another region like us-west1/europe-west1 or verify Service Networking + AlloyDB service agent.)'
                    : '';
                  const fullErr = `AlloyDB ${op.verb} failed (code ${op.errorCode ?? 'ERROR'}): ${op.errorMessage}${hint}`;
                  setLastReceipt({
                    ok: false,
                    action: payload.action,
                    message: fullErr,
                    operation: opName,
                    ts: new Date().toLocaleTimeString(),
                  });
                  reportError(fullErr);
                } else {
                  if (payload.action === 'DELETE_CLUSTER') {
                    if (sqlConsoleClusterId === lroClusterKey) setSqlConsoleClusterId('');
                    if (connectClusterId === lroClusterKey) setConnectClusterId('');
                  }
                  const okMsg =
                    payload.action === 'DELETE_CLUSTER'
                      ? `Deleted AlloyDB cluster "${op.targetName || lroClusterKey}" (${opLoc}) in ${elapsedSec}s.`
                      : `AlloyDB ${op.verb} SUCCEEDED for "${op.targetName || lroClusterKey || 'resource'}" in ${opLoc} (${elapsedSec}s)!`;
                  setLastReceipt({
                    ok: true,
                    action: payload.action,
                    message: okMsg,
                    operation: opName,
                    ts: new Date().toLocaleTimeString(),
                  });
                  notify(okMsg);
                }
                await fetchOverview();
                if (typeof onRefreshOverview === 'function') onRefreshOverview();
                return true;
              }
            } catch {
              clearPendingLro();
              return true;
            }
            if (Date.now() - pollStarted > 300000) {
              clearPendingLro();
              return true;
            }
            return false;
          };
          setTimeout(async () => {
            const finished = await pollOnce();
            if (!finished) {
              const timer = setInterval(async () => {
                const doneNow = await pollOnce();
                if (doneNow) clearInterval(timer);
              }, 3500);
            }
          }, 1500);
        }
      }
    } catch (err) {
      if (err?.isCancelledByUser) return;
      const msg = err?.response?.data?.error || err.message || 'AlloyDB action failed.';
      setLastReceipt({ ok: false, action: payload.action, message: msg, ts: new Date().toLocaleTimeString() });
      reportError(msg);
    } finally {
      setBusyKey('');
    }
  };

  const activeInstanceObj = useMemo(() => {
    const list = overview?.instances || [];
    if (!list.length) return null;
    return (
      list.find((i) => `${i.location}/${i.clusterId}/${i.instanceId}` === selectedInstanceKey) ||
      list[0]
    );
  }, [overview?.instances, selectedInstanceKey]);

  // --- Computed SCaNN vs HNSW Engineering Estimates (Deterministic Sizing Formulas) ---
  const executiveTco = useMemo(() => {
    const auroraComputeMo = execVcpu * (1 + execReplicas) * 0.145 * 730;
    const auroraStorageIoMo = execStorageTb * 1024 * 0.10 + execStorageTb * 450; // Aurora Standard I/O + storage
    const legacyTotalMonthly = Math.round(
      auroraComputeMo + auroraStorageIoMo + execVectorDbMonthlyUsd + execAnalyticsOffloadMonthlyUsd
    );
    const alloyComputeMo = execVcpu * (1 + Math.max(1, execReplicas - 1)) * 0.134 * 730; // 4x TPS + Columnar reduces read-replica sprawl
    const alloyStorageMo = execStorageTb * 1024 * 0.30; // Zero per-I/O billing surprise
    const alloyTotalMonthly = Math.round(alloyComputeMo + alloyStorageMo);
    const monthlySavings = Math.max(0, legacyTotalMonthly - alloyTotalMonthly);
    const annualSavings = monthlySavings * 12;
    const savingsPct = legacyTotalMonthly > 0 ? Math.round((monthlySavings / legacyTotalMonthly) * 100) : 0;
    return {
      legacyTotalMonthly,
      alloyTotalMonthly,
      monthlySavings,
      annualSavings,
      savingsPct,
    };
  }, [execVcpu, execStorageTb, execReplicas, execVectorDbMonthlyUsd, execAnalyticsOffloadMonthlyUsd]);

  const exportExecutiveDossier = () => {
    const now = new Date().toISOString();
    const clusterLines = (overview?.clusters || []).length
      ? overview.clusters
          .map(
            (c) =>
              `- **${c.clusterId}** (${c.isExpress ? 'AlloyDB Express' : 'Enterprise AlloyDB'}, \`${c.databaseVersion}\`, \`${c.location}\`, state: \`${c.state}\`, instances: ${c.instanceCount})`
          )
          .join('\n')
      : '- No AlloyDB clusters provisioned yet (ready for 1-click AlloyDB Express PG 18 rollout).';

    const gateLines = readinessXray?.gates
      ? readinessXray.gates
          .map((g) => `- [${g.pass ? 'x' : ' '}] **${g.label}**: ${g.detail}`)
          .join('\n')
      : '- Run the 6-Gate GCP Readiness X-Ray in CloudPulse to attach live IAM & VPC peering verification.';

    const md = `# Executive Architecture & Migration Dossier: Google Cloud AlloyDB for PostgreSQL

- **GCP Project**: \`${projectId || 'unspecified'}\`
- **Generated**: \`${now}\`
- **Prepared By**: CloudPulse AlloyDB Mastery & Express Studio

## 1. Executive Business Case (3-Systems-to-1 Consolidation)
| Metric | Legacy Stack (Aurora + Vector DB + OLAP Offload) | Google Cloud AlloyDB (Unified) |
| :--- | ---: | ---: |
| **Estimated Monthly Spend** | $${executiveTco.legacyTotalMonthly.toLocaleString()}/mo | $${executiveTco.alloyTotalMonthly.toLocaleString()}/mo |
| **Projected Annual Savings** | — | **$${executiveTco.annualSavings.toLocaleString()}/yr (${executiveTco.savingsPct}% reduction)** |
| **Workload Footprint** | ${execVcpu} vCPU × ${1 + execReplicas} nodes, ${execStorageTb} TB | Unified OLTP + Columnar HTAP + SCaNN Vector |
| **Availability SLA** | 99.99% (excludes planned maintenance) | **99.99% inclusive of maintenance (<1s)** |
| **Vendor Lock-in Exit Strategy** | Proprietary engine / DMS | **100% PostgreSQL + \`pglogical\` Bi-Directional Exit** |

## 2. Live GCP Project Fleet Snapshot
${clusterLines}

## 3. Live 6-Gate GCP & Vertex AI Readiness X-Ray
${gateLines}

## 4. Sovereign Cloud, CMEK & Regulatory Compliance (${sovereignFramework})
${
  sovereignAudit
    ? `- **Sovereign Posture Score**: **${sovereignAudit.sovereignScore}/100** (${sovereignAudit.passedControls}/${sovereignAudit.totalControls} controls in \`${sovereignAudit.region}\`)\n${sovereignAudit.controls
        .map((c) => `- [${c.pass ? 'x' : ' '}] **${c.pillar}**: ${c.detail}`)
        .join('\n')}`
    : '- Run the Sovereign Cloud, CMEK & DORA/GDPR Shield audit in Pillar 4 to attach live KMS & residency verification.'
}

## 5. Schema & \`pglogical\` Zero-Lock-in Audit
${
  compatReport
    ? `- **Drop-in Compatibility Score**: **${compatReport.compatibilityScore}/100**\n- **Tables Scanned**: ${compatReport.summary.tablesScanned} (${compatReport.summary.missingPrimaryKeyTables} missing PK)\n- **Aurora Lock-in Extensions Flagged**: ${compatReport.summary.auroraLockInExtensions}`
    : '- Run the PostgreSQL DDL Compatibility X-Ray Auditor in Pillar 2 to attach schema verification.'
}

## 6. Recommended 30-Day Executive Rollout Plan
1. **Week 1 (Zero Risk)**: Spin up **AlloyDB Express (PG 18, Scale-to-Zero)** + local **AlloyDB Omni Docker** for dev parity.
2. **Week 2 (Proof of Value)**: Run live \`EXPLAIN (ANALYZE, BUFFERS)\` SCaNN vs. HNSW vector benchmark & Columnar HTAP query proof.
3. **Week 3 (Zero-Downtime Shadow Sync)**: Enable \`pglogical\` logical replication from existing PostgreSQL/Aurora with continuous exit standby to stock PostgreSQL.
4. **Week 4 (Production Cutover)**: Upgrade Express in-place to Enterprise AlloyDB (\`--no-enable-express\`) and attach horizontal Read Pool nodes.
`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alloydb-executive-dossier-${projectId || 'gcp'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Downloaded Executive AlloyDB Migration Dossier (.md)');
  };

  const scannSizing = useMemo(() => {
    const rawVectorGb = (scannVectorsM * 1_000_000 * scannDims * 4) / 1024 ** 3;
    const scannIndexGb = rawVectorGb * 0.28; // Tree-based anisotropic quantization (~3.5x smaller than HNSW)
    const hnswIndexGb = rawVectorGb * 1.15; // Graph adjacency lists + full float32 vectors
    const scannP95Ms = Math.max(2.1, Number((2.4 + Math.log10(scannVectorsM + 1) * 3.1 * (scannDims / 768)).toFixed(1)));
    const hnswP95Ms = Number((scannP95Ms * 4.4).toFixed(1));
    const scannQps = Math.round(4200 / (1 + scannVectorsM * 0.045) / (scannDims / 768));
    const hnswQps = Math.round(scannQps / 4.2);
    const recommendedLeaves = Math.max(100, Math.round(Math.sqrt(scannVectorsM * 1_000_000)));
    return {
      rawVectorGb: rawVectorGb.toFixed(1),
      scannIndexGb: scannIndexGb.toFixed(1),
      hnswIndexGb: hnswIndexGb.toFixed(1),
      ramSavingsPct: Math.round(((hnswIndexGb - scannIndexGb) / hnswIndexGb) * 100),
      scannP95Ms,
      hnswP95Ms,
      scannQps,
      hnswQps,
      recommendedLeaves,
    };
  }, [scannVectorsM, scannDims]);

  // --- Interactive ECharts Visual Telemetry (SCaNN vs HNSW + 36-Month C-Suite TCO Curve) ---
  const scannChartOption = useMemo(() => {
    const scales = [1, 10, 50, 100];
    const scannGb = scales.map((m) => Number(((m * 1e6 * scannDims * 4) / 1024 ** 3 * 0.28).toFixed(1)));
    const hnswGb = scales.map((m) => Number(((m * 1e6 * scannDims * 4) / 1024 ** 3 * 1.15).toFixed(1)));
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: {
        data: ['AlloyDB SCaNN Index (GB)', 'pgvector HNSW Index (GB)'],
        textStyle: { color: '#9ca3af', fontSize: 11 },
        bottom: 0,
      },
      grid: { left: 46, right: 18, top: 24, bottom: 34 },
      xAxis: {
        type: 'category',
        data: scales.map((m) => `${m}M vec`),
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: 'Index RAM (GB)',
        nameTextStyle: { color: '#9ca3af', fontSize: 10 },
        axisLabel: { color: '#9ca3af', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.15)' } },
      },
      series: [
        {
          name: 'AlloyDB SCaNN Index (GB)',
          type: 'bar',
          data: scannGb,
          itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] },
        },
        {
          name: 'pgvector HNSW Index (GB)',
          type: 'bar',
          data: hnswGb,
          itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
        },
      ],
    };
  }, [scannDims]);

  const tcoChartOption = useMemo(() => {
    const months = [3, 6, 12, 18, 24, 30, 36];
    const legacyCumulative = months.map((m) => Math.round((executiveTco.legacyTotalMonthly * m) / 1000));
    const alloyCumulative = months.map((m) => Math.round((executiveTco.alloyTotalMonthly * m) / 1000));
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', valueFormatter: (v) => `$${v}k` },
      legend: {
        data: ['Legacy 3-System Stack ($k)', 'Unified AlloyDB ($k)'],
        textStyle: { color: '#9ca3af', fontSize: 11 },
        bottom: 0,
      },
      grid: { left: 52, right: 18, top: 24, bottom: 34 },
      xAxis: {
        type: 'category',
        data: months.map((m) => `M${m}`),
        axisLabel: { color: '#9ca3af', fontSize: 10 },
      },
      yAxis: {
        type: 'value',
        name: 'Cumulative ($k)',
        nameTextStyle: { color: '#9ca3af', fontSize: 10 },
        axisLabel: { color: '#9ca3af', fontSize: 10, formatter: '${value}k' },
        splitLine: { lineStyle: { color: 'rgba(148,163,184,0.15)' } },
      },
      series: [
        {
          name: 'Legacy 3-System Stack ($k)',
          type: 'line',
          smooth: true,
          data: legacyCumulative,
          lineStyle: { color: '#f43f5e', width: 2.5 },
          itemStyle: { color: '#f43f5e' },
          areaStyle: { color: 'rgba(244,63,94,0.08)' },
        },
        {
          name: 'Unified AlloyDB ($k)',
          type: 'line',
          smooth: true,
          data: alloyCumulative,
          lineStyle: { color: '#10b981', width: 3 },
          itemStyle: { color: '#10b981' },
          areaStyle: { color: 'rgba(16,185,129,0.14)' },
        },
      ],
    };
  }, [executiveTco]);

  // --- Generated Copyable Artifacts ---
  const expressGcloudSnippet = useMemo(() => {
    const cId = expressClusterId || 'alloydb-express-app';
    return `# 1. Create AlloyDB Express Cluster (${expressDbVersion}, Scale-to-Zero, 1 vCPU / 4 GB RAM, up to 20 GB auto-storage)
gcloud beta alloydb clusters create ${cId} \\
  --region=${expressRegion} \\
  --database-version=${expressDbVersion} \\
  --password="CHANGE_ME_STRONG_PASS" \\
  --enable-express \\
  --project=${projectId || 'YOUR_PROJECT_ID'}

# 2. Create Primary Instance (1 vCPU, ${expressPublicDns ? 'Public DNS' : 'Private Service Connect'})
gcloud beta alloydb instances create ${cId}-primary \\
  --cluster=${cId} \\
  --region=${expressRegion} \\
  --instance-type=PRIMARY \\
  --cpu-count=1 \\
  ${expressPublicDns ? '--assign-inbound-public-ip=ASSIGN_IPV4' : '--enable-psc'} \\
  --project=${projectId || 'YOUR_PROJECT_ID'}

# 3. Zero-Downtime In-Place Upgrade to Enterprise AlloyDB (1:8 RAM ratio, up to 288 vCPUs, Read Pools)
gcloud beta alloydb clusters update ${cId} \\
  --region=${expressRegion} \\
  --no-enable-express \\
  --project=${projectId || 'YOUR_PROJECT_ID'}`;
  }, [expressClusterId, expressRegion, expressDbVersion, expressPublicDns, projectId]);

  const starterKitCode = useMemo(() => {
    const cId = expressClusterId || 'alloydb-express-app';
    if (starterStack === 'NODE_PG') {
      return `// Node.js (Standard 'pg' driver — Zero proprietary SDK required!)
import pg from 'pg';
const { Pool } = pg;

// Works identically on Local Postgres, AlloyDB Omni, AlloyDB Express & Enterprise AlloyDB
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // postgres://postgres:***@<express-dns>:5432/postgres?sslmode=require
  max: 10,
});

export async function searchAndTransact(tenantId, queryText) {
  const { rows } = await pool.query(
    \`SELECT id, title, 1 - (embedding <=> embedding('text-embedding-005', $2)::vector) AS score
     FROM documents
     WHERE tenant_id = $1
     ORDER BY embedding <=> embedding('text-embedding-005', $2)::vector
     LIMIT 5\`,
    [tenantId, queryText]
  );
  return rows;
}`;
    }
    if (starterStack === 'PYTHON_FASTAPI') {
      return `# Python FastAPI + psycopg3 (Standard PostgreSQL wire protocol — Zero lock-in)
import os
from fastapi import FastAPI
import psycopg

app = FastAPI()
DSN = os.environ["DATABASE_URL"]  # postgresql://postgres:***@<alloydb-express-host>:5432/postgres?sslmode=require

@app.get("/health/db")
def db_health():
    with psycopg.connect(DSN) as conn:
        ver, is_scann = conn.execute(
            "SELECT version(), EXISTS(SELECT 1 FROM pg_extension WHERE extname='alloydb_scann')"
        ).fetchone()
    return {"cluster": "${cId}", "version": ver, "scann_enabled": is_scann}`;
    }
    return `# Next.js + Cloud Run + AlloyDB Express (Hackathon → Production Architecture)
# 1. Deploy your Next.js app to Cloud Run with Direct VPC / Public DNS connection
gcloud run deploy ${cId}-web \\
  --source=. \\
  --region=${expressRegion} \\
  --set-secrets="DATABASE_URL=alloydb-express-dsn:latest" \\
  --allow-unauthenticated \\
  --project=${projectId || 'YOUR_PROJECT_ID'}

# 2. When traffic grows past hackathon stage: upgrade AlloyDB Express in-place!
#    Preserves schema, data, DNS/PSC & credentials — zero app redeploy required:
gcloud beta alloydb clusters update ${cId} \\
  --region=${expressRegion} \\
  --no-enable-express \\
  --project=${projectId || 'YOUR_PROJECT_ID'}`;
  }, [starterStack, expressClusterId, expressRegion, projectId]);

  const lockInSnippet = useMemo(() => {
    const targetCluster = activeInstanceObj?.clusterId || expressClusterId || 'alloydb-prod';
    const targetInst = activeInstanceObj?.instanceId || `${targetCluster}-primary`;
    const targetLoc = activeInstanceObj?.location || expressRegion;

    if (lockInLab === 'PGLOGICAL_INBOUND') {
      return `-- =====================================================================
-- ZERO-DOWNTIME MIGRATION INTO ALLOYDB WITH PGLOGICAL (Native Postgres)
-- =====================================================================
-- Step 1 (AlloyDB): Enable logical decoding & pglogical flags (or click "Apply pglogical Flags" above)
-- gcloud alloydb instances update ${targetInst} --cluster=${targetCluster} --region=${targetLoc} \\
--   --database-flags=alloydb.logical_decoding=on,alloydb.enable_pglogical=on --project=${projectId || 'YOUR_PROJECT_ID'}

-- Step 2 (Source PostgreSQL @ ${sourcePgHost}): Create Publisher Node & Replication Set
CREATE EXTENSION IF NOT EXISTS pglogical;
SELECT pglogical.create_node(
  node_name := 'source_pg_provider',
  dsn := 'host=${sourcePgHost} port=5432 dbname=appdb user=replicator'
);
SELECT pglogical.replication_set_add_all_tables('default', ARRAY['public']);

-- Step 3 (Target AlloyDB): Create Subscriber & Start Live Zero-Downtime Sync
CREATE EXTENSION IF NOT EXISTS pglogical;
SELECT pglogical.create_node(
  node_name := 'alloydb_subscriber',
  dsn := 'host=<alloydb-primary-ip> port=5432 dbname=appdb user=postgres'
);
SELECT pglogical.create_subscription(
  subscription_name := 'sub_zero_downtime_cutover',
  provider_dsn := 'host=${sourcePgHost} port=5432 dbname=appdb user=replicator password=***'
);

-- Step 4: Verify lag = 0 bytes before flipping app connection string!
SELECT subscription_name, status FROM pglogical.show_subscription_status();`;
    }

    if (lockInLab === 'ZERO_CODE_COMPAT') {
      if (compatFramework === 'SPRING_BOOT') {
        return `# Spring Boot (Hibernate / HikariCP) — 100% Drop-In PostgreSQL Compatibility
# Only the JDBC URL changes — zero entity, JPQL, or Flyway/Liquibase changes!
spring:
  datasource:
    url: jdbc:postgresql://<alloydb-ip-or-proxy>:5432/orders_prod?sslmode=require
    driver-class-name: org.postgresql.Driver
    hikari:
      maximum-pool-size: 32
      connection-timeout: 5000
  jpa:
    database-platform: org.hibernate.dialect.PostgreSQLDialect`;
      }
      if (compatFramework === 'NODE_PRISMA') {
        return `// Node.js (Prisma / Drizzle / node-postgres) — 0 Lines of ORM Code Changed
// prisma/schema.prisma uses standard provider = "postgresql"
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL") // Point to AlloyDB IP, PSC DNS, or AlloyDB Auth Proxy
  extensions = [pg_trgm, vector, alloydb_scann]
}
// Existing Prisma queries, raw SQL CTEs, JSONB operators & advisory locks work unmodified.`;
      }
      return `# Django / SQLAlchemy — 100% Standard psycopg3 Engine
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "prod_app",
        "USER": "app_service_user",
        "HOST": "127.0.0.1", # AlloyDB Auth Proxy with --auto-iam-authn (zero static passwords)
        "PORT": "5432",
        "CONN_MAX_AGE": 600,
    }
}`;
    }

    if (lockInLab === 'OMNI_LOCAL_CLOUD') {
      return `# Develop Locally with AlloyDB Omni (Docker) -> Promote Identically to Cloud AlloyDB
# Runs real PostgreSQL + SCaNN Vector Index + Columnar Engine on your laptop or CI runner!
docker run -d --name alloydb-omni-dev \\
  -e POSTGRES_PASSWORD=localdevpass \\
  -e PGDATA=/var/lib/postgresql/data/pgdata \\
  -v alloydb_omni_data:/var/lib/postgresql/data \\
  -p 5432:5432 \\
  google/alloydbomni:${omniPgVersion}

# Enable identical AlloyDB extensions locally (zero dev/prod drift):
psql "postgres://postgres:localdevpass@127.0.0.1:5432/postgres" -c "
  ALTER SYSTEM SET google_columnar_engine.enabled = 'on';
  CREATE EXTENSION IF NOT EXISTS vector;
  CREATE EXTENSION IF NOT EXISTS alloydb_scann;
"
# Promote to Cloud AlloyDB Express/Enterprise: swap DATABASE_URL only — identical SQL & plans!`;
    }

    return `-- =====================================================================
-- DISASTER RECOVERY WITHOUT LOCK-IN: ALLOYDB -> STOCK OPEN-SOURCE POSTGRES
-- =====================================================================
-- Proves complete exit strategy: AlloyDB publishes WAL changes continuously
-- to a standard open-source PostgreSQL instance (on-prem, GCE, or another cloud).

-- Step 1 (AlloyDB Primary = Publisher):
CREATE EXTENSION IF NOT EXISTS pglogical;
SELECT pglogical.create_node(
  node_name := 'alloydb_cloud_publisher',
  dsn := 'host=<alloydb-primary-ip> port=5432 dbname=appdb user=postgres'
);
SELECT pglogical.replication_set_add_all_tables('default', ARRAY['public']);

-- Step 2 (Stock Open-Source PostgreSQL @ ${targetExitHost} = Standby Subscriber):
CREATE EXTENSION IF NOT EXISTS pglogical;
SELECT pglogical.create_node(
  node_name := 'stock_postgres_dr_exit',
  dsn := 'host=${targetExitHost} port=5432 dbname=appdb user=postgres'
);
SELECT pglogical.create_subscription(
  subscription_name := 'sub_alloydb_to_stock_pg_dr',
  provider_dsn := 'host=<alloydb-primary-ip> port=5432 dbname=appdb user=replicator password=***',
  synchronize_structure := true,
  synchronize_data := true
);

-- Failover Verification: On DR activation, drop subscription & promote stock PG in < 10s!
-- SELECT pglogical.drop_subscription('sub_alloydb_to_stock_pg_dr');`;
  }, [
    lockInLab,
    compatFramework,
    omniPgVersion,
    sourcePgHost,
    targetExitHost,
    activeInstanceObj,
    expressClusterId,
    expressRegion,
    projectId,
  ]);

  const scannSqlCode = useMemo(() => {
    const withClause =
      scannMode === 'AUTO'
        ? `WITH (MODE='AUTO', auto_maintenance='AUTO')`
        : `WITH (MODE='MANUAL', num_leaves=${scannSizing.recommendedLeaves}, quantizer='sq8')`;
    const op =
      scannDistance === 'cosine' ? '<=>' : scannDistance === 'l2' ? '<->' : '<#>';
    return `-- 1. Install AlloyDB SCaNN, pgvector & Vertex AI ML Integration extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS alloydb_scann;
CREATE EXTENSION IF NOT EXISTS google_ml_integration;

-- 2. Production RAG Table (${scannDims}-dim Vertex AI embeddings + operational metadata)
CREATE TABLE IF NOT EXISTS ${scannTable} (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  doc_category TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(${scannDims}),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Build Google SCaNN Tree-Quantized Index (${scannMode} mode · ~${scannSizing.scannIndexGb} GB vs ${scannSizing.hnswIndexGb} GB HNSW)
CREATE INDEX IF NOT EXISTS idx_${scannTable}_scann
  ON ${scannTable}
  USING scann (embedding ${scannDistance})
  ${withClause};

-- 4. End-to-End Hybrid Production RAG Query (Inline Vertex AI embedding + Filtered ANN + EXPLAIN)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, doc_category, content,
       1 - (embedding ${op} embedding('${scannEmbedModel}', 'Zero-downtime pglogical cutover steps')::vector) AS similarity
FROM ${scannTable}
WHERE tenant_id = 'enterprise-acme'
  AND doc_category = 'runbook'
ORDER BY embedding ${op} embedding('${scannEmbedModel}', 'Zero-downtime pglogical cutover steps')::vector
LIMIT 10;`;
  }, [scannTable, scannDims, scannDistance, scannMode, scannEmbedModel, scannSizing]);

  const agentSqlCode = useMemo(() => {
    if (agentFramework === 'ADK_GEMINI') {
      return `-- Beyond Aurora: PostgreSQL Engineered for Autonomous AI Agents (AlloyDB AI + Gemini)
-- 1. Transactional Agent Memory, Tool Audit & Hybrid Vector State in ONE ACID Database
CREATE TABLE IF NOT EXISTS agent_memory_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  agent_role TEXT NOT NULL,
  tool_name TEXT,
  payload JSONB NOT NULL,
  summary_text TEXT NOT NULL,
  embedding vector(768) GENERATED ALWAYS AS (
    embedding('text-embedding-005', summary_text)::vector
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Register Gemini 4 (${nlModel}) Inside AlloyDB for In-Database Reasoning (Zero Extra Hop)
CALL google_ml.create_model(
  model_id => 'gemini-4-agent',
  model_provider => 'google',
  model_qualified_name => '${nlModel}',
  model_type => 'text_generation'
);

-- 3. Autonomous Agent Context Retrieval + Semantic Filtering in Single SQL Round-Trip
SELECT session_id, agent_role, summary_text,
       google_ml.predict_row(
         model_id => 'gemini-4-agent',
         request_body => json_build_object(
           'contents', json_build_array(json_build_object(
             'role', 'user',
             'parts', json_build_array(json_build_object('text', 'Summarize risk in 1 line: ' || summary_text))
           ))
         )
       ) AS inline_llm_triage
FROM agent_memory_events
WHERE agent_role = 'sre-incident-commander'
ORDER BY embedding <=> embedding('text-embedding-005', 'connection pool exhaustion')::vector
LIMIT 5;`;
    }
    return `-- LangGraph / Multi-Agent Checkpointer + AlloyDB SCaNN Shared Long-Term Memory
-- Replaces separate Pinecone/Qdrant + Redis + Aurora RDS with ONE 99.99% AlloyDB Cluster
CREATE TABLE IF NOT EXISTS langgraph_checkpoints (
  thread_id TEXT NOT NULL,
  checkpoint_ns TEXT NOT NULL DEFAULT '',
  checkpoint_id TEXT NOT NULL,
  parent_checkpoint_id TEXT,
  checkpoint JSONB NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

-- Columnar Engine accelerates real-time agent evaluation & cost analytics 100x without ETL:
SELECT google_columnar_engine_add('langgraph_checkpoints');
SELECT metadata->>'agent_name' AS agent,
       COUNT(*) AS turns,
       AVG((metadata->>'latency_ms')::numeric) AS avg_ms
FROM langgraph_checkpoints
WHERE created_at >= now() - interval '24 hours'
GROUP BY 1 ORDER BY turns DESC;`;
  }, [agentFramework, nlModel]);

  const drMermaidCode = `flowchart LR
  subgraph SRC["Source / On-Prem / AWS RDS"]
    PG1["Stock PostgreSQL (pglogical Provider)"]
  end
  subgraph GCP["Google Cloud AlloyDB (Zero Lock-in)"]
    ADB["AlloyDB Primary (Colossus + SCaNN + Columnar)"]
    RP["Read Pool Nodes (Sub-10ms Lag · Auto-Scale)"]
    ADB --> RP
  end
  subgraph EXIT["Customer-Owned DR Exit"]
    PG2["Stock Open-Source PostgreSQL (pglogical Subscriber)"]
  end
  PG1 -- "Zero-Downtime pglogical WAL Stream" --> ADB
  ADB -- "Continuous Exit Replication (No Lock-in)" --> PG2`;

  const filteredScenarios = useMemo(() => {
    if (topicFilter === 'ALL') return TEN_SCENARIOS_PLAYBOOK;
    return TEN_SCENARIOS_PLAYBOOK.filter((s) => s.topicArea === topicFilter);
  }, [topicFilter]);

  const jumpToScenarioLab = (scenario) => {
    setActivePillar(scenario.targetPillar);
    if (scenario.targetPillar === 'ZERO_LOCKIN_PGLOGICAL') {
      setLockInLab(scenario.targetLab);
    } else if (scenario.targetPillar === 'BEYOND_AURORA_AGENTS') {
      setAuroraView(scenario.targetLab);
    } else if (scenario.targetPillar === 'EXPRESS_QUICKSTART') {
      setStarterStack(
        scenario.targetLab === 'HACKATHON_TO_PROD' ? 'NEXTJS_CLOUDRUN' : 'NODE_PG'
      );
    }
    notify(`Loaded live lab: ${scenario.title}`);
  };

  const selectedExpressRegionMeta = ALLOYDB_EXPRESS_REGIONS.find(
    (r) => r.id === expressRegion
  );

  return (
    <div className="space-y-4">
      {/* =================================================================
          HEADER & LIVE ALLOYDB FLEET TELEMETRY BAR
         ================================================================= */}
      <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-4">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35">
                <Database className="w-3 h-3" />
                ALLOYDB FOR POSTGRESQL · EXPRESS &amp; ENTERPRISE STUDIO
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                PG 18 Express · SCaNN · pglogical · Columnar HTAP
              </span>
              {overview?.apiEnabled ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  alloydb.googleapis.com ENABLED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  <AlertTriangle className="w-3 h-3" />
                  API Not Enabled Yet
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
              AlloyDB Mastery, Express Quickstart, Zero Lock-in &amp; SCaNN AI Command Center
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-5xl leading-relaxed">
              Live <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[0.92em]">alloydb.googleapis.com/v1beta</code> fleet control plane + interactive engineering workbenches for{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">AlloyDB Express (PG 18)</strong>,{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">Zero Lock-in (`pglogical` + Omni)</strong>,{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">SCaNN Vector RAG</strong>, and{' '}
              <strong className="text-zinc-900 dark:text-zinc-200">Beyond Aurora Autonomous AI Agents</strong>.
            </p>
          </div>

          {/* Dedicated Full-Width Action Bar (Spacious, Zero Button Collisions) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
            <div className="flex flex-wrap items-center gap-2.5">
              {!overview?.apiEnabled && (
                <button
                  type="button"
                  disabled={busyKey === 'ENABLE_API'}
                  onClick={() =>
                    executeAlloyAction({ action: 'ENABLE_ALLOYDB_API' }, 'ENABLE_API')
                  }
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  <span>{busyKey === 'ENABLE_API' ? 'Enabling...' : 'Enable AlloyDB API'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !demoModeOpen;
                  setDemoModeOpen(nextOpen);
                  if (nextOpen) {
                    setDemoTimerRunning(true);
                    goToDemoBeat(activeDemoTrack, demoBeatIdx);
                  }
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer border transition-all ${
                  demoModeOpen
                    ? 'border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-200'
                    : 'border-amber-500/45 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200'
                }`}
              >
                <Presentation className="w-3.5 h-3.5 shrink-0" />
                <span>{demoModeOpen ? 'Close Live Demo Director' : 'Live Demo Mode'}</span>
              </button>
              <button
                type="button"
                onClick={exportExecutiveDossier}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Export Executive Dossier (.md)</span>
              </button>
              <button
                type="button"
                onClick={runReadinessXray}
                disabled={loadingXray}
                className="px-3.5 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{loadingXray ? 'Scanning 6 Gates...' : '6-Gate GCP Readiness X-Ray'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={fetchOverview}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Live Fleet</span>
              </button>
              {typeof onNavigateTab === 'function' && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('CLOUD_SQL_STUDIO')}
                    className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Cloud SQL Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('DATA_ENGINEER_STUDIO', 'DATA_FABRIC_MESH')}
                    className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>6-Engine Data Fabric</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('MCP_HUB')}
                    className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>AlloyDB MCP</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Revolutionary Live Demo Director & Presenter Cockpit */}
        {demoModeOpen && activeDemoBeat && (
          <div className="p-4 rounded-xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/10 via-white to-blue-500/5 dark:from-amber-500/15 dark:via-[#111622] dark:to-blue-500/10 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/25 pb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-amber-500/25 text-amber-900 dark:text-amber-200 border border-amber-500/40">
                  <Presentation className="w-3 h-3" />
                  LIVE DEMO DIRECTOR
                </span>
                <select
                  value={demoTrackId}
                  onChange={(e) => {
                    const nextTrack =
                      DEMO_DIRECTOR_TRACKS.find((t) => t.id === e.target.value) ||
                      DEMO_DIRECTOR_TRACKS[0];
                    setDemoTrackId(nextTrack.id);
                    setDemoElapsedSec(0);
                    goToDemoBeat(nextTrack, 0);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
                >
                  {DEMO_DIRECTOR_TRACKS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <span className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                  Audience: {activeDemoTrack.audience}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-zinc-900 text-emerald-300 font-bold">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  {String(Math.floor(demoElapsedSec / 60)).padStart(2, '0')}:
                  {String(demoElapsedSec % 60).padStart(2, '0')} / {activeDemoTrack.durationMin}:00
                </span>
                <button
                  type="button"
                  onClick={() => setDemoTimerRunning((r) => !r)}
                  className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {demoTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  {demoTimerRunning ? 'Pause' : 'Resume'}
                </button>
                <button
                  type="button"
                  onClick={() => setDemoElapsedSec(0)}
                  className="p-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={exportPresenterRunbook}
                  className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  Export Script (.md)
                </button>
              </div>
            </div>

            {/* Clickable Beat Stepper (Spacious Multi-Line Cards, Zero Clipping) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {activeDemoTrack.beats.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => goToDemoBeat(activeDemoTrack, idx)}
                  className={`flex flex-col items-start justify-center p-2.5 rounded-lg border text-left text-[11px] font-mono leading-snug whitespace-normal transition-all cursor-pointer ${
                    idx === demoBeatIdx
                      ? 'border-amber-500 bg-amber-500/20 text-amber-900 dark:text-amber-100 font-extrabold'
                      : idx < demoBeatIdx
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {b.title}
                </button>
              ))}
            </div>

            {/* Active Beat Teleprompter + Q&A Objection Killer + 1-Click Live Execution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
              <div className="lg:col-span-6 p-3 rounded-lg bg-white dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Say This Out Loud ({activeDemoBeat.title})
                </div>
                <p className="text-xs text-zinc-800 dark:text-zinc-100 leading-relaxed font-medium">
                  &ldquo;{activeDemoBeat.sayThis}&rdquo;
                </p>
              </div>
              <div className="lg:col-span-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Audience Q&amp;A Objection Killer
                </div>
                <p className="text-xs text-emerald-950 dark:text-emerald-100 leading-relaxed">
                  {activeDemoBeat.objection}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={demoBeatIdx === 0}
                  onClick={() => goToDemoBeat(activeDemoTrack, demoBeatIdx - 1)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Prev Beat (Alt+←)
                </button>
                <button
                  type="button"
                  disabled={demoBeatIdx >= activeDemoTrack.beats.length - 1}
                  onClick={() => goToDemoBeat(activeDemoTrack, demoBeatIdx + 1)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  Next Beat (Alt+→)
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => executeDemoBeatAction(activeDemoBeat.actionKey)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                Execute Live: {activeDemoBeat.actionLabel}
              </button>
            </div>
          </div>
        )}

        {/* 6-Pillar Navigation Selector (Warm Amber Selection Language) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2">
          {ALLOYDB_PILLARS.map((p) => {
            const Icon = p.icon;
            const isActive = activePillar === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePillar(p.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isActive
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 w-full">
                  <span
                    className={`p-1.5 rounded-md ${
                      isActive
                        ? 'bg-amber-500/25 text-amber-700 dark:text-amber-300'
                        : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                      isActive
                        ? 'bg-amber-500/25 text-amber-800 dark:text-amber-200'
                        : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>
                <div className="font-bold text-xs leading-tight">{p.label}</div>
                <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                  {p.subtitle}
                </div>
              </button>
            );
          })}
        </div>

        {/* Subordinate Recessed Live Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          {[
            { label: 'Live Clusters', value: overview?.summary?.totalClusters ?? '—' },
            { label: 'Express Clusters', value: overview?.summary?.expressClusters ?? '—' },
            { label: 'Enterprise Clusters', value: overview?.summary?.enterpriseClusters ?? '—' },
            { label: 'Active Instances', value: overview?.summary?.totalInstances ?? '—' },
            { label: 'pglogical Ready', value: overview?.summary?.pglogicalReadyInstances ?? '—' },
            { label: 'Columnar / AI Ready', value: `${overview?.summary?.columnarEnabledInstances ?? 0} / ${overview?.summary?.mlReadyInstances ?? 0}` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="px-3 py-2 rounded-lg bg-zinc-50/80 dark:bg-zinc-950/60 border border-zinc-200/70 dark:border-zinc-800/80"
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {stat.label}
              </div>
              <div className="text-sm font-mono font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* 6-Gate Live GCP Production & Vertex AI Readiness X-Ray Panel */}
        {readinessXray && (
          <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/70 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  Live 6-Gate AlloyDB &amp; Vertex AI Production Readiness X-Ray
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {readinessXray.passedCount}/{readinessXray.totalGates} Gates ({readinessXray.score}/100)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setReadinessXray(null)}
                className="text-[10.5px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
              {(readinessXray.gates || []).map((g) => (
                <div
                  key={g.id}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between gap-1.5 ${
                    g.pass
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-amber-500/40 bg-amber-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{g.label}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-extrabold shrink-0 ${
                        g.pass
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/25 text-amber-800 dark:text-amber-200'
                      }`}
                    >
                      {g.pass ? 'PASS' : 'ACTION'}
                    </span>
                  </div>
                  <div className="text-[10.5px] font-mono text-zinc-600 dark:text-zinc-300 break-all">
                    {g.detail}
                  </div>
                  {g.fixAction === 'GRANT_ALLOYDB_VERTEX_AI_ROLE' && (
                    <button
                      type="button"
                      disabled={busyKey === 'GRANT_VERTEX_IAM'}
                      onClick={async () => {
                        await executeAlloyAction({ action: 'GRANT_ALLOYDB_VERTEX_AI_ROLE' }, 'GRANT_VERTEX_IAM');
                        runReadinessXray();
                      }}
                      className="mt-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold self-start cursor-pointer disabled:opacity-60"
                    >
                      {busyKey === 'GRANT_VERTEX_IAM' ? 'Granting...' : '1-Click Grant roles/aiplatform.user'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Operation Receipt Banner */}
        {lastReceipt && (
          <div
            className={`p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2 ${
              lastReceipt.ok
                ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/35 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {lastReceipt.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-mono font-bold">[{lastReceipt.ts}]</span>
              <span className="truncate">{lastReceipt.message}</span>
            </div>
            {lastReceipt.operation && (
              <code className="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[10px]">
                LRO: {lastReceipt.operation.split('/').slice(-1)[0]}
              </code>
            )}
          </div>
        )}
      </div>

      {/* =================================================================
          ALWAYS-VISIBLE LIVE ALLOYDB CLUSTERS FIRST (CONSOLE-GRADE)
         ================================================================= */}
      <section className="p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Server className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              Live AlloyDB Clusters ({overview?.clusters?.length || 0})
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              {projectId} · locations/-/clusters
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={fetchOverview}
              className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <a
              href={`https://console.cloud.google.com/alloydb/clusters?project=${encodeURIComponent(projectId)}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-xs font-semibold text-blue-700 dark:text-blue-300 inline-flex items-center gap-1"
            >
              <span>GCP Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setShowCreateClusterDrawer((v) => !v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                showCreateClusterDrawer
                  ? "border border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{showCreateClusterDrawer ? "Close Create Drawer" : "+ Create AlloyDB Express Cluster"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Express Cluster Provisioner Drawer */}
        {showCreateClusterDrawer && (
          <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/[0.04] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  Create New AlloyDB Express Cluster (PostgreSQL 18 · Scale-to-Zero)
                </h4>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                1 vCPU · 4 GB RAM · Auto-Storage up to 20 GB
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  Cluster ID
                </label>
                <input
                  type="text"
                  value={expressClusterId}
                  onChange={(e) => setExpressClusterId(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  Initial postgres Password (optional)
                </label>
                <input
                  type="password"
                  value={expressInitialPassword}
                  onChange={(e) => setExpressInitialPassword(e.target.value)}
                  placeholder="Blank = auto-generate & show"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  PostgreSQL Engine Version
                </label>
                <select
                  value={expressDbVersion}
                  onChange={(e) => setExpressDbVersion(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="POSTGRES_18">POSTGRES_18 (Express Default)</option>
                  <option value="POSTGRES_17">POSTGRES_17</option>
                  <option value="POSTGRES_16">POSTGRES_16</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
                  Region
                </label>
                <select
                  value={expressRegion}
                  onChange={(e) => setExpressRegion(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  {ALLOYDB_EXPRESS_REGIONS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs">
              <div className="flex flex-wrap items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={expressPscEnabled}
                    onChange={(e) => setExpressPscEnabled(e.target.checked)}
                    className="rounded border-zinc-400"
                  />
                  <span>Private Service Connect (<code className="font-mono text-[11px]">zero VPC peering</code>)</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={expressPublicDns}
                    onChange={(e) => setExpressPublicDns(e.target.checked)}
                    className="rounded border-zinc-400"
                  />
                  <span>Public DNS on Primary Instance</span>
                </label>
              </div>
              {selectedExpressRegionMeta?.c4aReady && (
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  C4A 1-vCPU Upgrade Ready
                </span>
              )}
            </div>

            {(() => {
              const normalizedId = String(expressClusterId || "").trim().toLowerCase();
              const existingMatch = (overview?.clusters || []).find(
                (c) =>
                  String(c.clusterId || "").toLowerCase() === normalizedId &&
                  String(c.location || "") === expressRegion
              );
              const suggestNextId = () => {
                const base = (normalizedId || "alloydb-express-app").replace(/-\d+$/, "");
                const existingSet = new Set(
                  (overview?.clusters || [])
                    .filter((c) => String(c.location || "") === expressRegion)
                    .map((c) => String(c.clusterId || "").toLowerCase())
                );
                let n = 2;
                while (existingSet.has(`${base}-${n}`) && n < 100) n += 1;
                return `${base}-${n}`;
              };
              const suggestedId = existingMatch ? suggestNextId() : "";
              return (
                <>
                  {existingMatch && (
                    <div className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <span>
                          Cluster <code className="font-mono font-bold">{existingMatch.clusterId}</code> already exists in{" "}
                          <code className="font-mono">{expressRegion}</code> ({existingMatch.state}). Pick a new ID to create another cluster, or add a Primary Instance on the cluster card below.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpressClusterId(suggestedId)}
                        className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-[11px] shrink-0 cursor-pointer"
                      >
                        Use &quot;{suggestedId}&quot;
                      </button>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={busyKey === "CREATE_EXPRESS" || Boolean(existingMatch) || !normalizedId}
                      onClick={() =>
                        executeAlloyAction(
                          {
                            action: "CREATE_EXPRESS_CLUSTER",
                            region: expressRegion,
                            clusterId: expressClusterId,
                            databaseVersion: expressDbVersion,
                            pscEnabled: expressPscEnabled,
                            ...(expressInitialPassword.trim() ? { password: expressInitialPassword.trim() } : {}),
                          },
                          "CREATE_EXPRESS"
                        )
                      }
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      {busyKey === "CREATE_EXPRESS"
                        ? "Dispatching Express Cluster…"
                        : existingMatch
                        ? "Cluster ID Already Exists — Pick a New ID"
                        : "Create Live AlloyDB Express Cluster"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Full-Width Live Clusters List */}
        {(overview?.clusters || []).length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-2.5">
            <Database className="w-7 h-7 mx-auto text-zinc-400" />
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
              No AlloyDB Clusters Discovered in {projectId}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
              Click <strong>+ Create AlloyDB Express Cluster</strong> above to spin up a PostgreSQL 18 cluster in seconds.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {overview.clusters.map((c) => {
              const activeLro = pendingLroByCluster[c.clusterId] || null;
              const isDeletingCluster = activeLro?.action === "DELETE_CLUSTER" || busyKey === `DEL_${c.clusterId}` || String(c.state || "").toUpperCase() === "DELETING";
              const lroElapsedSec = activeLro ? Math.max(1, Math.round((lroClockMs - activeLro.startedAt) / 1000)) : 0;
              const lroPct = activeLro ? Math.min(92, Math.round(18 + lroElapsedSec * 3.5)) : 0;
              return (
              <div
                key={c.name}
                className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                  isDeletingCluster
                    ? "border-rose-500/50 bg-rose-500/[0.06] opacity-90"
                    : activeLro
                    ? "border-blue-500/45 bg-blue-500/[0.04]"
                    : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="font-mono font-extrabold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                      {c.clusterId}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        c.isExpress
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/35"
                          : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/35"
                      }`}
                    >
                      {c.isExpress ? "EXPRESS" : "ENTERPRISE"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                      {c.databaseVersion} · {c.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold inline-flex items-center gap-1 ${
                        isDeletingCluster
                          ? "bg-rose-500/20 text-rose-700 dark:text-rose-300"
                          : activeLro
                          ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {(isDeletingCluster || activeLro) && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                      {isDeletingCluster
                        ? `DELETING${lroElapsedSec ? ` · ${lroElapsedSec}s` : "…"}`
                        : activeLro
                        ? `UPDATING · ${lroElapsedSec}s`
                        : c.state}
                    </span>
                    <a
                      href={`https://console.cloud.google.com/alloydb/locations/${encodeURIComponent(c.location)}/clusters/${encodeURIComponent(c.clusterId)}/overview?project=${encodeURIComponent(projectId)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-[10.5px] font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 inline-flex items-center gap-0.5"
                    >
                      <span>Console</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Live Inline LRO Progress Bar (Deleting / Creating Primary / Upgrading / Scaling) */}
                {activeLro && (
                  <div
                    className={`p-2.5 rounded-lg border space-y-1.5 text-xs ${
                      isDeletingCluster
                        ? "border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200"
                        : "border-blue-500/40 bg-blue-500/10 text-blue-800 dark:text-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                        <span>{activeLro.label}…</span>
                      </span>
                      <span className="font-mono text-[11px] tabular-nums shrink-0">
                        {lroPct}% · {lroElapsedSec}s
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-black/15 dark:bg-white/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isDeletingCluster ? "bg-rose-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${lroPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Clear 2-Step Cluster -> Primary Instance Readiness Indicator */}
                {c.instanceCount === 0 ? (
                  <div className="p-2.5 rounded-lg border border-amber-500/35 bg-amber-500/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-amber-800 dark:text-amber-200 font-medium">
                      <strong>0 instances attached</strong> — Cluster is ready; add a 1-vCPU Primary Instance to connect via SQL.
                    </span>
                    <button
                      type="button"
                      disabled={busyKey === `INST_${c.clusterId}`}
                      onClick={() =>
                        executeAlloyAction(
                          {
                            action: "CREATE_EXPRESS_PRIMARY_INSTANCE",
                            region: c.location,
                            clusterId: c.clusterId,
                            instanceId: `${c.clusterId}-primary`,
                            publicDnsEnabled: expressPublicDns,
                          },
                          `INST_${c.clusterId}`
                        )
                      }
                      className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      {busyKey === `INST_${c.clusterId}` ? "Creating Primary…" : "+ Add 1-vCPU Primary"}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                      Primary Ready ({c.primaryInstance?.cpuCount || 1} vCPU)
                    </span>
                    <span>Instances: {c.instanceCount}</span>
                    <span>·</span>
                    <span>Backup: {c.continuousBackupEnabled ? `${c.recoveryWindowDays}d PITR` : "Express Managed"}</span>
                    {(c.primaryInstance?.publicDnsName || c.primaryInstance?.ipAddress || c.primaryInstance?.pscDnsName) && (
                      <>
                        <span>·</span>
                        <span className="text-zinc-800 dark:text-zinc-100">
                          {c.primaryInstance.publicDnsName || c.primaryInstance.ipAddress || c.primaryInstance.pscDnsName}
                        </span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => openClusterSqlConsole(c)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                      sqlConsoleClusterId === c.clusterId
                        ? "border border-amber-500 bg-amber-500/20 text-amber-800 dark:text-amber-200"
                        : c.primaryInstance
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    <Terminal className="w-3 h-3" />
                    {sqlConsoleClusterId === c.clusterId ? "Close SQL Console" : "SQL Console"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConnectClusterId(connectClusterId === c.clusterId ? "" : c.clusterId)}
                    className={`px-2.5 py-1 rounded border text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                      connectClusterId === c.clusterId
                        ? "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200"
                        : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
                    }`}
                  >
                    <Database className="w-3 h-3" />
                    Connect (psql)
                  </button>
                  {c.isExpress && (
                    <button
                      type="button"
                      disabled={busyKey === `UPGRADE_${c.clusterId}`}
                      onClick={() =>
                        executeAlloyAction(
                          {
                            action: "UPGRADE_EXPRESS_TO_ENTERPRISE",
                            region: c.location,
                            clusterId: c.clusterId,
                          },
                          `UPGRADE_${c.clusterId}`
                        )
                      }
                      className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:text-amber-200 text-[11px] font-bold cursor-pointer"
                    >
                      Upgrade → Enterprise
                    </button>
                  )}
                  {c.primaryInstance && (
                    <>
                      <button
                        type="button"
                        disabled={busyKey === `SCALE_${c.clusterId}`}
                        onClick={() =>
                          executeAlloyAction(
                            {
                              action: "SCALE_INSTANCE_CPU",
                              region: c.location,
                              clusterId: c.clusterId,
                              instanceId: c.primaryInstance.instanceId,
                              cpuCount: c.primaryInstance.cpuCount < 2 ? 2 : c.primaryInstance.cpuCount * 2,
                            },
                            `SCALE_${c.clusterId}`
                          )
                        }
                        className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold cursor-pointer"
                      >
                        Scale → {c.primaryInstance.cpuCount < 2 ? 2 : c.primaryInstance.cpuCount * 2} vCPU
                      </button>
                      <button
                        type="button"
                        disabled={busyKey === `FLAGS10X_${c.clusterId}`}
                        onClick={() =>
                          executeAlloyAction(
                            {
                              action: "APPLY_INSTANCE_FLAGS",
                              region: c.location,
                              clusterId: c.clusterId,
                              instanceId: c.primaryInstance.instanceId,
                              flagPreset: "FULL_ALLOYDB_10X",
                            },
                            `FLAGS10X_${c.clusterId}`
                          )
                        }
                        className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                      >
                        Enable 10X Flags
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={busyKey === `BK_${c.clusterId}`}
                    onClick={() =>
                      executeAlloyAction(
                        {
                          action: "TRIGGER_ON_DEMAND_BACKUP",
                          region: c.location,
                          clusterId: c.clusterId,
                        },
                        `BK_${c.clusterId}`
                      )
                    }
                    className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <HardDrive className="w-3 h-3" />
                    Snapshot Backup
                  </button>
                  <button
                    type="button"
                    onClick={() => setIamUserCluster(iamUserCluster === c.clusterId ? "" : c.clusterId)}
                    className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    + IAM User
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingCluster}
                    onClick={() =>
                      executeAlloyAction(
                        {
                          action: "DELETE_CLUSTER",
                          region: c.location,
                          clusterId: c.clusterId,
                        },
                        `DEL_${c.clusterId}`
                      )
                    }
                    className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 disabled:opacity-60 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ml-auto"
                  >
                    {isDeletingCluster ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    {isDeletingCluster ? "Deleting…" : "Delete"}
                  </button>
                </div>

                {connectClusterId === c.clusterId && (() => {
                  const host = resolveClusterHost(c) || "<PRIMARY_HOST_AFTER_STEP_2>";
                  const dsnStr = `postgresql://postgres:<PASSWORD>@${host}:5432/postgres?sslmode=require`;
                  const psqlCmd = `psql "${dsnStr}"`;
                  return (
                    <div className="pt-2.5 mt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-[11px]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          Connect to {c.clusterId} ({c.location}) via psql or Application .env
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyText(dsnStr, `dsn_${c.clusterId}`, "DATABASE_URL")}
                            className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px] font-bold cursor-pointer"
                          >
                            {copiedKey === `dsn_${c.clusterId}` ? "Copied!" : "Copy DATABASE_URL"}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyText(psqlCmd, `psql_${c.clusterId}`, "psql command")}
                            className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-[10px] font-bold cursor-pointer"
                          >
                            {copiedKey === `psql_${c.clusterId}` ? "Copied!" : "Copy psql"}
                          </button>
                          {typeof onRunInShell === "function" && c.primaryInstance && (
                            <button
                              type="button"
                              onClick={() => onRunInShell(psqlCmd)}
                              className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-[10px] font-bold cursor-pointer"
                            >
                              Run in Shell
                            </button>
                          )}
                        </div>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap">
                        {`# Direct PostgreSQL 18 CLI (psql)\n${psqlCmd}\n\n# App .env\nDATABASE_URL="${dsnStr}"`}
                      </pre>
                    </div>
                  );
                })()}

                {iamUserCluster === c.clusterId && (
                  <div className="pt-2 mt-1 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={iamUserEmail}
                      onChange={(e) => setIamUserEmail(e.target.value)}
                      placeholder="service-account@project.iam.gserviceaccount.com or user@domain.com"
                      className="flex-1 min-w-[200px] px-2.5 py-1 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono text-zinc-900 dark:text-zinc-100"
                    />
                    <button
                      type="button"
                      disabled={!iamUserEmail.trim() || busyKey === `IAMU_${c.clusterId}`}
                      onClick={() =>
                        executeAlloyAction(
                          {
                            action: "CREATE_ALLOYDB_USER",
                            region: c.location,
                            clusterId: c.clusterId,
                            userId: iamUserEmail.trim(),
                            userType: "ALLOYDB_IAM_USER",
                          },
                          `IAMU_${c.clusterId}`
                        )
                      }
                      className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      Grant Zero-Password IAM User
                    </button>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* Inline Live Cloud AlloyDB SQL Console ("SSH" Equivalent for AlloyDB Clusters) */}
        {sqlConsoleClusterId && (() => {
          const targetCluster = (overview?.clusters || []).find((c) => c.clusterId === sqlConsoleClusterId);
          return (
            <div className="p-4 rounded-xl border border-blue-500/40 bg-blue-500/[0.04] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    Live Cloud AlloyDB SQL Console — <code className="font-mono">{sqlConsoleClusterId}</code>
                  </span>
                  {targetCluster && (
                    <span className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                      {targetCluster.databaseVersion} · {targetCluster.location}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSqlConsoleClusterId("")}
                  className="px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                >
                  Close Console
                </button>
              </div>

              <div className="space-y-1">
                {targetCluster?.primaryInstance && !targetCluster.primaryInstance.publicDnsName && !targetCluster.primaryInstance.publicIpAddress && (
                  <div className="mb-2 p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        <strong>Private PSC-only endpoint</strong> (<code className="font-mono">*.alloydb-psc.goog</code> is only resolvable inside a GCP VPC). Enable Public IP + authorize your current <code className="font-mono">/32</code> IP to connect directly via <code className="font-mono">psql</code> from this machine.
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={busyKey === `PUBIP_${targetCluster.clusterId}`}
                      onClick={() =>
                        executeAlloyAction(
                          {
                            action: "ENABLE_PUBLIC_IP_FOR_MY_IP",
                            region: targetCluster.location,
                            clusterId: targetCluster.clusterId,
                            instanceId: targetCluster.primaryInstance.instanceId,
                          },
                          `PUBIP_${targetCluster.clusterId}`
                        )
                      }
                      className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-bold shrink-0 cursor-pointer"
                    >
                      {busyKey === `PUBIP_${targetCluster.clusterId}` ? "Enabling Public IP…" : "Enable Public IP & Authorize My IP"}
                    </button>
                  </div>
                )}
                {/* Structured Connection Fields (Env-Var PGPASSWORD / Zero-Password IAM Auth — Never Password-in-URL) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                  <div className="inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCloudSqlAuthMode("PASSWORD")}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        cloudSqlAuthMode === "PASSWORD"
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      Password Auth (PGPASSWORD)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCloudSqlAuthMode("IAM_TOKEN")}
                      className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                        cloudSqlAuthMode === "IAM_TOKEN"
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      Zero-Password IAM (OAuth Token)
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={cloudSqlBusy || !cloudSqlHost.trim()}
                    onClick={() => runCloudClusterSql("LIST_TABLES")}
                    className="px-2.5 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-500 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Database className="w-3 h-3 text-blue-500" />
                    <span>Load Tables Explorer</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2">
                  <div className="lg:col-span-5">
                    <label className="block text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 mb-0.5">
                      Host (Public DNS / Auth Proxy)
                    </label>
                    <input
                      type="text"
                      value={cloudSqlHost}
                      onChange={(e) => setCloudSqlHost(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <label className="block text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 mb-0.5">
                      Port
                    </label>
                    <input
                      type="text"
                      value={cloudSqlPort}
                      onChange={(e) => setCloudSqlPort(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 mb-0.5">
                      Database
                    </label>
                    <input
                      type="text"
                      value={cloudSqlDb}
                      onChange={(e) => setCloudSqlDb(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 mb-0.5">
                      {cloudSqlAuthMode === "IAM_TOKEN" ? "IAM User Email" : "User"}
                    </label>
                    <input
                      type="text"
                      value={cloudSqlUser}
                      onChange={(e) => setCloudSqlUser(e.target.value)}
                      placeholder={cloudSqlAuthMode === "IAM_TOKEN" ? "you@domain.com" : "postgres"}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400 mb-0.5">
                      {cloudSqlAuthMode === "IAM_TOKEN" ? "Token" : "Password"}
                    </label>
                    {cloudSqlAuthMode === "IAM_TOKEN" ? (
                      <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 truncate">
                        Auto GCP OAuth
                      </div>
                    ) : (
                      <input
                        type="password"
                        value={cloudSqlPassword}
                        onChange={(e) => setCloudSqlPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    )}
                  </div>
                </div>

                {/* Clickable Live Tables Explorer Strip */}
                {cloudSqlTables.length > 0 && (
                  <div className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 mr-1">
                      Tables ({cloudSqlTables.length}):
                    </span>
                    {cloudSqlTables.map((t) => (
                      <button
                        key={`${t.schema}.${t.name}`}
                        type="button"
                        disabled={cloudSqlBusy}
                        onClick={() =>
                          runCloudClusterSql(
                            "RUN_CUSTOM_SQL",
                            `SELECT * FROM "${t.schema}"."${t.name}" LIMIT 50;`
                          )
                        }
                        className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-semibold cursor-pointer"
                      >
                        {t.schema === "public" ? t.name : `${t.schema}.${t.name}`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    label: "Engine & Cloud IP",
                    sql: "SELECT version(), current_database(), current_user, inet_server_addr();",
                  },
                  {
                    label: "AlloyDB Extensions",
                    sql: "SELECT extname, extversion FROM pg_extension ORDER BY extname;",
                  },
                  {
                    label: "List Tables",
                    sql: "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
                  },
                  {
                    label: "Create & Seed Demo Table",
                    sql: "CREATE TABLE IF NOT EXISTS cloudpulse_events (id SERIAL PRIMARY KEY, event TEXT, created_at TIMESTAMPTZ DEFAULT now());\nINSERT INTO cloudpulse_events (event) VALUES ('Live AlloyDB Express PG 18 check');\nSELECT * FROM cloudpulse_events ORDER BY id DESC LIMIT 10;",
                  },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={cloudSqlBusy}
                    onClick={() => runCloudClusterSql("RUN_CUSTOM_SQL", chip.sql)}
                    className="px-2.5 py-1 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-amber-500 text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={cloudSqlQuery}
                onChange={(e) => setCloudSqlQuery(e.target.value)}
                className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-300 font-mono text-xs"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={cloudSqlBusy || !cloudSqlHost.trim() || !cloudSqlQuery.trim()}
                    onClick={() => runCloudClusterSql("RUN_CUSTOM_SQL")}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {cloudSqlBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Terminal className="w-3.5 h-3.5" />}
                    <span>{cloudSqlBusy ? "Running SQL…" : "Run Live SQL"}</span>
                  </button>
                  <button
                    type="button"
                    disabled={cloudSqlBusy || !cloudSqlHost.trim()}
                    onClick={() => runCloudClusterSql("INTROSPECT_ALLOYDB")}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50 text-xs font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    Deep Introspect (Extensions + Flags)
                  </button>
                  {targetCluster?.primaryInstance && (
                    <button
                      type="button"
                      disabled={busyKey === `PUBIP_${targetCluster.clusterId}`}
                      onClick={() =>
                        executeAlloyAction(
                          {
                            action: "ENABLE_PUBLIC_IP_FOR_MY_IP",
                            region: targetCluster.location,
                            clusterId: targetCluster.clusterId,
                            instanceId: targetCluster.primaryInstance.instanceId,
                          },
                          `PUBIP_${targetCluster.clusterId}`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-xs font-semibold text-amber-800 dark:text-amber-200 cursor-pointer"
                    >
                      {busyKey === `PUBIP_${targetCluster.clusterId}` ? "Authorizing My IP…" : "Authorize My /32 IP"}
                    </button>
                  )}
                </div>
                {cloudSqlResult?.durationMs && (
                  <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                    Executed in {cloudSqlResult.durationMs}ms via /usr/bin/psql
                  </span>
                )}
              </div>

              {cloudSqlResult && (
                <div
                  className={`rounded-lg border p-3 space-y-2 ${
                    cloudSqlResult.ok
                      ? "border-emerald-500/35 bg-emerald-500/[0.06]"
                      : "border-red-500/35 bg-red-500/[0.06]"
                  }`}
                >
                  {!cloudSqlResult.ok && (
                    <div className="text-xs text-red-700 dark:text-red-300 font-semibold">
                      {cloudSqlResult.error}
                    </div>
                  )}
                  {cloudSqlResult.ok && Array.isArray(cloudSqlResult.columns) && cloudSqlResult.columns.length > 0 && !cloudSqlShowRaw ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                          {cloudSqlResult.rowCount} row(s) returned · {cloudSqlResult.columns.length} column(s)
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyText(cloudSqlResult.stdout || "", "sql-csv", "CSV results")}
                            className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 font-semibold cursor-pointer"
                          >
                            {copiedKey === "sql-csv" ? "Copied CSV!" : "Copy CSV"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCloudSqlShowRaw(true)}
                            className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-semibold cursor-pointer"
                          >
                            Raw Output
                          </button>
                        </div>
                      </div>
                      <div className="max-h-72 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                        <table className="w-full text-left text-xs">
                          <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
                            <tr>
                              {cloudSqlResult.columns.map((col, idx) => (
                                <th key={`${col}-${idx}`} className="px-3 py-2 font-mono font-bold whitespace-nowrap">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70 font-mono">
                            {(cloudSqlResult.rows || []).map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="px-3 py-1.5 text-zinc-800 dark:text-zinc-200 whitespace-nowrap max-w-md truncate" title={cell}>
                                    {cell === "" ? <span className="text-zinc-400 italic">NULL</span> : cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : cloudSqlResult.stdout ? (
                    <div className="space-y-1.5">
                      {cloudSqlResult.ok && Array.isArray(cloudSqlResult.columns) && cloudSqlResult.columns.length > 0 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => setCloudSqlShowRaw(false)}
                            className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer"
                          >
                            View Structured Table
                          </button>
                        </div>
                      )}
                      <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-xs max-h-64 overflow-auto whitespace-pre-wrap">
                        <code>{cloudSqlResult.stdout}</code>
                      </pre>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })()}

        {/* Collapsible Recent AlloyDB Operations Bar */}
        {Array.isArray(overview?.operations) && overview.operations.length > 0 && (
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <button
              type="button"
              onClick={() => setShowAlloyOpsHistory((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-100 cursor-pointer"
            >
              <span className="inline-flex items-center gap-2">
                <span>Recent AlloyDB Operations ({overview.operations.length})</span>
                {overview.operations.some((o) => o.status === "RUNNING") && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono text-[10px]">
                    RUNNING
                  </span>
                )}
                {overview.operations[0]?.status === "FAILED" && (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/15 text-red-600 dark:text-red-300 font-mono text-[10px]">
                    Latest Failed
                  </span>
                )}
              </span>
              <span className="text-[11px] font-mono text-zinc-500">
                {showAlloyOpsHistory ? "Hide Operations ▲" : "Show Operations ▼"}
              </span>
            </button>
            {showAlloyOpsHistory && (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {overview.operations.slice(0, 8).map((op) => (
                  <div
                    key={op.name}
                    className={`p-2.5 rounded-lg border text-[11px] space-y-1 ${
                      op.status === "FAILED"
                        ? "border-red-500/35 bg-red-500/[0.06]"
                        : op.status === "RUNNING"
                        ? "border-blue-500/35 bg-blue-500/[0.06]"
                        : "border-emerald-500/30 bg-emerald-500/[0.04]"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[9.5px] font-bold ${
                            op.status === "FAILED"
                              ? "bg-red-500/20 text-red-700 dark:text-red-300"
                              : op.status === "RUNNING"
                              ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                              : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {op.status}
                        </span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {op.verb} {op.targetName}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          ({op.location})
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {op.createTime ? new Date(op.createTime).toLocaleTimeString() : "—"}
                      </span>
                    </div>
                    {op.errorMessage && (
                      <div className="text-[11px] text-red-700 dark:text-red-300 font-medium">
                        Code {op.errorCode ?? "ERROR"}: {op.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* =================================================================
          PILLAR 1: COLLAPSED-BY-DEFAULT CLI & DEVELOPER STARTER KITS
         ================================================================= */}
      {activePillar === "EXPRESS_QUICKSTART" && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExpressSnippets((v) => !v)}
            className="w-full px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-zinc-500" />
              <span>CLI Reference &amp; App Starter Kits</span>
              <span className="text-[11px] font-normal text-zinc-500">
                (gcloud beta CLI · Next.js / Node.js / FastAPI snippets)
              </span>
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {showExpressSnippets ? "Hide Snippets ▲" : "Show Snippets ▼"}
            </span>
          </button>

          {showExpressSnippets && (
            <div className="p-4 pt-2 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Equivalent gcloud beta CLI */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    Equivalent gcloud beta CLI (Create + Upgrade)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {typeof onRunInShell === "function" && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(expressGcloudSnippet.split("\n\n")[0])}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Terminal className="w-3 h-3" />
                        Run in Shell
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyText(expressGcloudSnippet, "express-cli", "AlloyDB Express CLI")}
                      className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "express-cli" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap">
                  {expressGcloudSnippet}
                </pre>
              </div>

              {/* Right: Hackathon-to-Production Starter Kit Generator */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    App Starter Kit
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {typeof onNavigateTab === "function" && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab("CLOUD_RUN")}
                        className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        Cloud Run Fleet
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                    {[
                      { id: "NEXTJS_CLOUDRUN", label: "Next.js + Cloud Run" },
                      { id: "NODE_PG", label: "Node.js pg" },
                      { id: "PYTHON_FASTAPI", label: "Python FastAPI" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStarterStack(s.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                          starterStack === s.id
                            ? "border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200"
                            : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => copyText(starterKitCode, "starter-code", `${starterStack} Starter`)}
                    className="absolute top-2 right-2 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "starter-code" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                  <pre className="p-3 rounded-lg bg-zinc-950 text-sky-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap">
                    {starterKitCode}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          PILLAR 2: ZERO LOCK-IN — PGLOGICAL, 100% COMPAT & OMNI (Topics 1-4)
         ================================================================= */}
      {activePillar === 'ZERO_LOCKIN_PGLOGICAL' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Zero Vendor Lock-in Engineering Workbench (4 Open-Source PostgreSQL Guarantees)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Prove zero-downtime inbound migration, 100% unmodified ORM/driver compatibility, local Docker Omni parity, and continuous exit failover to stock open-source PostgreSQL.
                </p>
              </div>
              {activeInstanceObj && (
                <button
                  type="button"
                  disabled={busyKey === 'FLAGS_PGLOGICAL'}
                  onClick={() =>
                    executeAlloyAction(
                      {
                        action: 'APPLY_INSTANCE_FLAGS',
                        region: activeInstanceObj.location,
                        clusterId: activeInstanceObj.clusterId,
                        instanceId: activeInstanceObj.instanceId,
                        flagPreset: 'PGLOGICAL_ZERO_LOCKIN',
                      },
                      'FLAGS_PGLOGICAL'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {busyKey === 'FLAGS_PGLOGICAL'
                    ? 'Patching Flags...'
                    : `Enable pglogical Flags on ${activeInstanceObj.instanceId}`}
                </button>
              )}
            </div>

            {/* 4 Sub-Labs Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  id: 'PGLOGICAL_INBOUND',
                  title: '1. Zero-Downtime pglogical In',
                  sub: 'Native WAL logical replication cutover',
                },
                {
                  id: 'ZERO_CODE_COMPAT',
                  title: '2. 100% PG Drop-In Compat',
                  sub: 'Spring Boot, Node.js & Django unmodified',
                },
                {
                  id: 'OMNI_LOCAL_CLOUD',
                  title: '3. Local Omni → Cloud AlloyDB',
                  sub: 'Docker google/alloydbomni parity',
                },
                {
                  id: 'STOCK_PG_EXIT_DR',
                  title: '4. DR Exit → Stock PostgreSQL',
                  sub: 'Bi-directional zero-lock-in failover',
                },
              ].map((lab) => (
                <button
                  key={lab.id}
                  type="button"
                  onClick={() => setLockInLab(lab.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    lockInLab === lab.id
                      ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="text-xs font-extrabold">{lab.title}</div>
                  <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {lab.sub}
                  </div>
                </button>
              ))}
            </div>

            {/* Dynamic Controls per Lock-in Lab */}
            {lockInLab === 'PGLOGICAL_INBOUND' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Source PostgreSQL Host (On-Prem / RDS / Self-Hosted)
                  </label>
                  <input
                    type="text"
                    value={sourcePgHost}
                    onChange={(e) => setSourcePgHost(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300">
                  Required AlloyDB flags:{' '}
                  <code className="px-1 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 font-mono">alloydb.logical_decoding=on</code>{' '}
                  &amp;{' '}
                  <code className="px-1 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 font-mono">alloydb.enable_pglogical=on</code>.
                  Zero proprietary CDC agents needed.
                </div>
              </div>
            )}

            {lockInLab === 'ZERO_CODE_COMPAT' && (
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'SPRING_BOOT', label: 'Spring Boot / Hibernate' },
                  { id: 'NODE_PRISMA', label: 'Node.js / Prisma / pg' },
                  { id: 'DJANGO_SQLALCHEMY', label: 'Django / SQLAlchemy' },
                ].map((fw) => (
                  <button
                    key={fw.id}
                    type="button"
                    onClick={() => setCompatFramework(fw.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                      compatFramework === fw.id
                        ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {fw.label}
                  </button>
                ))}
              </div>
            )}

            {lockInLab === 'OMNI_LOCAL_CLOUD' && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                  AlloyDB Omni Container Tag:
                </label>
                {['latest', '17.10.0', '16.14.0', '15.18.0'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setOmniPgVersion(tag)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold border cursor-pointer ${
                      omniPgVersion === tag
                        ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    google/alloydbomni:{tag}
                  </button>
                ))}
              </div>
            )}

            {lockInLab === 'STOCK_PG_EXIT_DR' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
                <div className="space-y-2">
                  <label className="block text-[11px] font-mono text-zinc-500">
                    External Stock PostgreSQL DR Target Host
                  </label>
                  <input
                    type="text"
                    value={targetExitHost}
                    onChange={(e) => setTargetExitHost(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-800 dark:text-emerald-200">
                    Complete Exit Guarantee: Because AlloyDB speaks standard PostgreSQL WAL logical decoding, you can continuously replicate OUT to stock open-source PostgreSQL anywhere.
                  </div>
                </div>
                <MermaidArchitectureDiagram
                  code={drMermaidCode}
                  title="AlloyDB Zero-Lock-In & Multi-Region DR Topology"
                />
              </div>
            )}

            <div className="relative">
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => sendSqlToLiveRunner(lockInSnippet, `Zero-Lock-in (${lockInLab})`)}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Terminal className="w-3 h-3" />
                  Open in Live SQL Runner →
                </button>
                <button
                  type="button"
                  onClick={() => copyText(lockInSnippet, 'lockin-sql', 'Zero-Lock-in Runbook')}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'lockin-sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  Copy Runbook
                </button>
              </div>
              <pre className="p-3.5 pt-10 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap">
                {lockInSnippet}
              </pre>
            </div>
          </div>

          {/* 10X Innovation: Deterministic PostgreSQL Schema & pglogical Compatibility X-Ray Auditor */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    PostgreSQL DDL &amp; pglogical Zero-Lock-in Compatibility X-Ray Auditor
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Paste any <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">pg_dump --schema-only</code>, Prisma/Hibernate migration, or Aurora DDL to detect missing <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">PRIMARY KEY</code> pglogical blockers, Aurora lock-in extensions, and SCaNN vector upgrade opportunities.
                </p>
              </div>
              <button
                type="button"
                disabled={auditingCompat}
                onClick={runCompatAudit}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Zap className="w-3.5 h-3.5" />
                {auditingCompat ? 'Auditing Schema...' : 'Run Live Compatibility Audit'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <textarea
                rows={10}
                value={compatDdlInput}
                onChange={(e) => setCompatDdlInput(e.target.value)}
                className="w-full p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 font-mono text-[11px] text-zinc-900 dark:text-zinc-100"
                placeholder="Paste CREATE EXTENSION / CREATE TABLE DDL here..."
              />

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-2.5">
                {!compatReport ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-zinc-500">
                    <Scale className="w-6 h-6 mb-2 text-zinc-400" />
                    Click <strong>Run Live Compatibility Audit</strong> to score drop-in AlloyDB readiness and auto-generate <code className="px-1 rounded bg-zinc-200 dark:bg-zinc-800 font-mono">REPLICA IDENTITY FULL</code> + SCaNN SQL.
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        AlloyDB Drop-in Compatibility Score
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-mono font-extrabold ${
                          compatReport.compatibilityScore >= 85
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        {compatReport.compatibilityScore} / 100
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10.5px] font-mono">
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        Tables: <strong>{compatReport.summary.tablesScanned}</strong> ({compatReport.summary.missingPrimaryKeyTables} no PK)
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        Extensions: <strong>{compatReport.summary.extensionsScanned}</strong> ({compatReport.summary.auroraLockInExtensions} Aurora)
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        Vector Tables: <strong>{compatReport.summary.vectorTablesDetected}</strong>
                      </div>
                    </div>

                    <div className="space-y-1 max-h-28 overflow-y-auto text-[11px]">
                      {compatReport.extensions.map((e) => (
                        <div key={e.name} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-white dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800">
                          <code className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{e.name}</code>
                          <span className={e.status === 'AURORA_LOCKIN_REWRITE' ? 'text-amber-600 dark:text-amber-300 font-bold' : 'text-emerald-600 dark:text-emerald-400'}>
                            {e.note}
                          </span>
                        </div>
                      ))}
                      {compatReport.tables.filter((t) => !t.hasPrimaryKey).map((t) => (
                        <div key={t.tableName} className="flex items-center justify-between gap-2 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200">
                          <code className="font-mono font-bold">{t.tableName}</code>
                          <span>Missing PK (pglogical blocker)</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                          Auto-Generated Remediation &amp; SCaNN SQL
                        </span>
                        <button
                          type="button"
                          onClick={() => copyText(compatReport.remediationSql, 'compat-fix', 'Remediation SQL')}
                          className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
                        >
                          {copiedKey === 'compat-fix' ? 'Copied' : 'Copy Fix SQL'}
                        </button>
                      </div>
                      <pre className="p-2 rounded bg-zinc-950 text-emerald-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                        {compatReport.remediationSql}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          PILLAR 3: SCANN VECTOR PERFORMANCE & PRODUCTION RAG (Topics 5 & 6)
         ================================================================= */}
      {activePillar === 'SCANN_VECTOR_RAG' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Interactive SCaNN vs HNSW Sizing & Benchmark Lab */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  AlloyDB SCaNN vs. pgvector HNSW Sizing &amp; Latency Lab
                </h3>
              </div>
              {activeInstanceObj && (
                <button
                  type="button"
                  disabled={busyKey === 'FLAGS_SCANN'}
                  onClick={() =>
                    executeAlloyAction(
                      {
                        action: 'APPLY_INSTANCE_FLAGS',
                        region: activeInstanceObj.location,
                        clusterId: activeInstanceObj.clusterId,
                        instanceId: activeInstanceObj.instanceId,
                        flagPreset: 'SCANN_AI_AGENTS',
                      },
                      'FLAGS_SCANN'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-60"
                >
                  {busyKey === 'FLAGS_SCANN' ? 'Patching...' : 'Enable SCaNN + Vertex AI Flags'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Corpus Size (Vectors)
                </label>
                <select
                  value={scannVectorsM}
                  onChange={(e) => setScannVectorsM(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value={1}>1 Million Vectors</option>
                  <option value={10}>10 Million Vectors</option>
                  <option value={50}>50 Million Vectors</option>
                  <option value={100}>100 Million Vectors</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Dimensions
                </label>
                <select
                  value={scannDims}
                  onChange={(e) => setScannDims(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value={768}>768-d (text-embedding-005)</option>
                  <option value={1536}>1536-d (High-Dim RAG)</option>
                  <option value={3072}>3072-d (Multimodal)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Distance Metric
                </label>
                <select
                  value={scannDistance}
                  onChange={(e) => setScannDistance(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="cosine">cosine (&lt;=&gt;)</option>
                  <option value="dot_product">dot_product (&lt;#&gt;)</option>
                  <option value="l2">l2 (&lt;-&gt;)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  SCaNN Tuning Mode
                </label>
                <select
                  value={scannMode}
                  onChange={(e) => setScannMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="AUTO">MODE=&apos;AUTO&apos; (Auto-Tuned)</option>
                  <option value="MANUAL">MODE=&apos;MANUAL&apos; (SQ8 Quantized)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Table Name
                </label>
                <input
                  type="text"
                  value={scannTable}
                  onChange={(e) => setScannTable(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Vertex AI Model
                </label>
                <select
                  value={scannEmbedModel}
                  onChange={(e) => setScannEmbedModel(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="text-embedding-005">text-embedding-005</option>
                  <option value="text-multilingual-embedding-002">text-multilingual-embedding-002</option>
                </select>
              </div>
            </div>

            {/* Deterministic Architecture Comparison Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                    AlloyDB SCaNN Index
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[9.5px] font-mono font-bold">
                    -{scannSizing.ramSavingsPct}% Index RAM
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-800 dark:text-zinc-200">
                  Index Footprint: <strong>~{scannSizing.scannIndexGb} GB</strong> (Raw {scannSizing.rawVectorGb} GB)
                </div>
                <div className="text-xs font-mono text-zinc-800 dark:text-zinc-200">
                  Est. p95 Recall@95: <strong>~{scannSizing.scannP95Ms} ms</strong> · <strong>{scannSizing.scannQps} QPS</strong>
                </div>
                <div className="text-[10.5px] text-emerald-700 dark:text-emerald-300">
                  Google Research tree-based anisotropic quantization; keeps filtered hybrid RAG inside PostgreSQL ACID transactions.
                </div>
              </div>

              <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                    Standard pgvector HNSW
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[9.5px] font-mono font-bold">
                    Graph-Heavy
                  </span>
                </div>
                <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  Index Footprint: <strong>~{scannSizing.hnswIndexGb} GB</strong> (must fit in RAM)
                </div>
                <div className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  Est. p95 Recall@95: <strong>~{scannSizing.hnswP95Ms} ms</strong> · <strong>{scannSizing.hnswQps} QPS</strong>
                </div>
                <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                  Slower index builds &amp; higher memory pressure at 10M+ vectors; degrades sharply on selective `WHERE` filters.
                </div>
              </div>
            </div>

            {/* Live ECharts Index RAM Scaling Curve (1M -> 100M Vectors) */}
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60">
              <div className="text-[10.5px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                Index RAM Footprint Scaling ({scannDims}-d Vectors: SCaNN vs. pgvector HNSW)
              </div>
              <ReactECharts option={scannChartOption} style={{ height: 190, width: '100%' }} />
            </div>
          </div>

          {/* Right: Production SCaNN + Vertex AI RAG SQL */}
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                Production SCaNN DDL &amp; EXPLAIN (ANALYZE, BUFFERS) RAG Harness
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => sendSqlToLiveRunner(scannSqlCode, 'SCaNN RAG SQL')}
                  className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Run Live →
                </button>
                <button
                  type="button"
                  onClick={() => copyText(scannSqlCode, 'scann-sql', 'AlloyDB SCaNN SQL')}
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'scann-sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy SCaNN SQL
                </button>
              </div>
            </div>
            <pre className="p-3.5 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap">
              {scannSqlCode}
            </pre>
          </div>
        </div>
      )}

      {/* =================================================================
          PILLAR 4: BEYOND AURORA — AI AGENTS & COLUMNAR HTAP (Topics 7 & 8)
         ================================================================= */}
      {activePillar === 'BEYOND_AURORA_AGENTS' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAuroraView('AI_AGENTS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  auroraView === 'AI_AGENTS'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                PostgreSQL for Autonomous AI Agents (Topic 7)
              </button>
              <button
                type="button"
                onClick={() => setAuroraView('AURORA_PARITY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                  auroraView === 'AURORA_PARITY'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                AlloyDB vs. AWS Aurora &amp; TCO (Topic 8)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuroraView('SOVEREIGN_SHIELD');
                  if (!sovereignAudit) runSovereignAudit();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer inline-flex items-center gap-1.5 ${
                  auroraView === 'SOVEREIGN_SHIELD'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Sovereign Cloud, CMEK &amp; DORA/GDPR Shield
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuroraView('TERRAFORM_HCL');
                  if (!tfResult) compileTerraformHcl();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer inline-flex items-center gap-1.5 ${
                  auroraView === 'TERRAFORM_HCL'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Terraform HCL Compiler (.tf)
              </button>
            </div>

            {activeInstanceObj && (
              <button
                type="button"
                disabled={busyKey === 'FLAGS_COLUMNAR'}
                onClick={() =>
                  executeAlloyAction(
                    {
                      action: 'APPLY_INSTANCE_FLAGS',
                      region: activeInstanceObj.location,
                      clusterId: activeInstanceObj.clusterId,
                      instanceId: activeInstanceObj.instanceId,
                      flagPreset: 'COLUMNAR_HTAP',
                    },
                    'FLAGS_COLUMNAR'
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Zap className="w-3.5 h-3.5" />
                {busyKey === 'FLAGS_COLUMNAR'
                  ? 'Enabling Columnar Engine...'
                  : `Enable Columnar Engine on ${activeInstanceObj.instanceId}`}
              </button>
            )}
          </div>

          {auroraView === 'AI_AGENTS' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {[
                    { id: 'ADK_GEMINI', label: 'Google ADK + Inline Gemini SQL' },
                    { id: 'LANGGRAPH_PG', label: 'LangGraph Checkpointer + Columnar Eval' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setAgentFramework(f.id)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold border cursor-pointer ${
                        agentFramework === f.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => sendSqlToLiveRunner(agentSqlCode, 'AlloyDB AI Agent SQL')}
                    className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Run Live →
                  </button>
                  <button
                    type="button"
                    onClick={() => copyText(agentSqlCode, 'agent-sql', 'AlloyDB AI Agent SQL')}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'agent-sql' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Agent SQL
                  </button>
                </div>
              </div>
              <pre className="p-3.5 rounded-lg bg-zinc-950 text-sky-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap">
                {agentSqlCode}
              </pre>
            </div>
          ) : auroraView === 'SOVEREIGN_SHIELD' ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-end justify-between gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                      Sovereign Data Residency Region
                    </label>
                    <select
                      value={sovereignRegion}
                      onChange={(e) => setSovereignRegion(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="europe-west1">europe-west1 (Belgium · EU)</option>
                      <option value="europe-west3">europe-west3 (Frankfurt · DE / BSI C5)</option>
                      <option value="europe-west4">europe-west4 (Netherlands · EU)</option>
                      <option value="europe-west6">europe-west6 (Zurich · CH / FINMA)</option>
                      <option value="europe-west9">europe-west9 (Paris · FR / SecNumCloud)</option>
                      <option value="europe-north1">europe-north1 (Finland · EU)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                      Regulatory Framework
                    </label>
                    <select
                      value={sovereignFramework}
                      onChange={(e) => setSovereignFramework(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="EU_DORA_GDPR">EU DORA (Art. 28 Exit) + GDPR / Schrems II</option>
                      <option value="SECNUMCLOUD_FR">France SecNumCloud / S3NS Sovereign</option>
                      <option value="BSI_C5_DE">Germany BSI C5 / T-Systems Sovereign</option>
                      <option value="FINMA_CH">Switzerland FINMA Banking Sovereignty</option>
                      <option value="HIPAA_US">US Healthcare HIPAA + FedRAMP High</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={loadingSovereign}
                    onClick={runSovereignAudit}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {loadingSovereign ? 'Auditing Sovereign Controls...' : 'Run Live 6-Control Sovereign Audit'}
                  </button>
                  {typeof onNavigateTab === 'function' && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('SOVEREIGN_STUDIO', 'SECRETS_KMS_WAF')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      Open KMS &amp; Sovereign Studio
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {sovereignAudit && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        Live Sovereign Posture ({sovereignAudit.framework} · {sovereignAudit.region})
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                        {sovereignAudit.sovereignScore}/100 ({sovereignAudit.passedControls}/{sovereignAudit.totalControls} Controls)
                      </span>
                    </div>
                    {activeInstanceObj && (
                      <button
                        type="button"
                        disabled={busyKey === 'FLAGS_SOVEREIGN'}
                        onClick={async () => {
                          await executeAlloyAction(
                            {
                              action: 'APPLY_INSTANCE_FLAGS',
                              region: activeInstanceObj.location,
                              clusterId: activeInstanceObj.clusterId,
                              instanceId: activeInstanceObj.instanceId,
                              flagPreset: 'SOVEREIGN_COMPLIANCE',
                            },
                            'FLAGS_SOVEREIGN'
                          );
                          runSovereignAudit();
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-60"
                      >
                        1-Click Enforce pgaudit + IAM Auth + pglogical on {activeInstanceObj.instanceId}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {(sovereignAudit.controls || []).map((ctrl) => (
                      <div
                        key={ctrl.id}
                        className={`p-3 rounded-lg border text-xs flex flex-col justify-between gap-1.5 ${
                          ctrl.pass
                            ? 'border-emerald-500/35 bg-emerald-500/5'
                            : 'border-amber-500/40 bg-amber-500/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">{ctrl.pillar}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-extrabold shrink-0 ${
                              ctrl.pass
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : 'bg-amber-500/25 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            {ctrl.pass ? 'COMPLIANT' : 'REMEDIATE'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 break-words">
                          {ctrl.detail}
                        </div>
                        {ctrl.fixAction === 'GRANT_ALLOYDB_KMS_ROLE' && (
                          <button
                            type="button"
                            disabled={busyKey === 'GRANT_KMS_IAM'}
                            onClick={async () => {
                              await executeAlloyAction({ action: 'GRANT_ALLOYDB_KMS_ROLE' }, 'GRANT_KMS_IAM');
                              runSovereignAudit();
                            }}
                            className="mt-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold self-start cursor-pointer"
                          >
                            {busyKey === 'GRANT_KMS_IAM' ? 'Granting...' : '1-Click Grant Sovereign KMS Role'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 1-Click Provision Sovereign CMEK AlloyDB Cluster */}
                  <div className="p-3.5 rounded-xl border border-emerald-500/35 bg-emerald-500/5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                          1-Click Provision Sovereign CMEK-Encrypted AlloyDB Cluster ({sovereignRegion})
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Binds both the AlloyDB storage volume and 14-day continuous backups to your Customer-Managed Encryption Key (CMEK / Cloud EKM).
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busyKey === 'CREATE_SOV_CLUSTER'}
                        onClick={() =>
                          executeAlloyAction(
                            {
                              action: 'CREATE_ENTERPRISE_CLUSTER',
                              region: sovereignRegion,
                              clusterId: sovereignClusterId,
                              databaseVersion: 'POSTGRES_16',
                              kmsKeyName: selectedKmsKey || undefined,
                            },
                            'CREATE_SOV_CLUSTER'
                          )
                        }
                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        {busyKey === 'CREATE_SOV_CLUSTER' ? 'Provisioning...' : 'Provision Sovereign CMEK Cluster'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                          Sovereign Cluster ID
                        </label>
                        <input
                          type="text"
                          value={sovereignClusterId}
                          onChange={(e) => setSovereignClusterId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                          Cloud KMS CryptoKey ({sovereignAudit.kmsKeys?.length || 0} discovered in {sovereignRegion})
                        </label>
                        {sovereignAudit.kmsKeys?.length > 0 ? (
                          <select
                            value={selectedKmsKey}
                            onChange={(e) => setSelectedKmsKey(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                          >
                            {sovereignAudit.kmsKeys.map((k) => (
                              <option key={k.name} value={k.name}>
                                {k.shortName} ({k.protectionLevel})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={selectedKmsKey}
                            onChange={(e) => setSelectedKmsKey(e.target.value)}
                            placeholder={`projects/${projectId}/locations/${sovereignRegion}/keyRings/.../cryptoKeys/...`}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                {[
                  {
                    title: 'Data & Key Sovereignty (CMEK + Cloud EKM)',
                    desc: 'Hold root keys outside Google Cloud in an external HSM (Thales, Fortanix, Utimaco) with cryptographic key revocation and Access Transparency logs.',
                  },
                  {
                    title: 'Operational Sovereignty (Assured Workloads)',
                    desc: 'Enforce EU/Local personnel-only support, regional data residency constraints, and sovereign partner cloud deployments (S3NS France, T-Systems Germany).',
                  },
                  {
                    title: 'Software & Exit Sovereignty (AlloyDB Omni + pglogical)',
                    desc: 'Satisfies DORA Art. 28 exit mandates: run identical AlloyDB Omni air-gapped on sovereign bare-metal/K8s or stream continuously to stock open-source PostgreSQL.',
                  },
                ].map((card) => (
                  <div key={card.title} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 space-y-1">
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100">{card.title}</div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : auroraView === 'TERRAFORM_HCL' ? (
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { id: 'SOVEREIGN_ENTERPRISE', label: 'Sovereign Enterprise (CMEK + Read Pool + pgaudit)' },
                    { id: 'EXPRESS', label: 'AlloyDB Express (PG 18 · Scale-to-Zero)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setTfMode(m.id);
                        compileTerraformHcl(m.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                        tfMode === m.id
                          ? 'border-amber-500 bg-amber-500/15 text-amber-900 dark:text-amber-100'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={compilingTf}
                    onClick={() => compileTerraformHcl()}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    {compilingTf ? 'Compiling HCL...' : 'Recompile Live Terraform HCL'}
                  </button>
                  {tfResult?.hcl && (
                    <>
                      <button
                        type="button"
                        onClick={() => copyText(tfResult.hcl, 'tf-hcl', 'AlloyDB Terraform HCL')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'tf-hcl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy .tf
                      </button>
                      <button
                        type="button"
                        onClick={downloadTerraformFile}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download {tfResult.filename}
                      </button>
                    </>
                  )}
                  {typeof onNavigateTab === 'function' && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab('CLOUD_NEXUS', 'TERRAFORM_DRIFT')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      Terraform Drift Studio
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <pre className="p-3.5 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-[10.5px] max-h-[420px] overflow-auto whitespace-pre-wrap">
                {tfResult?.hcl || '# Click "Recompile Live Terraform HCL" to generate production Terraform resources bound to your live GCP projectNumber & KMS key.'}
              </pre>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono uppercase text-zinc-500">
                    <th className="py-2 pr-3">Architectural Dimension</th>
                    <th className="py-2 px-3 text-emerald-700 dark:text-emerald-300">Google Cloud AlloyDB</th>
                    <th className="py-2 pl-3 text-zinc-600 dark:text-zinc-400">AWS Aurora PostgreSQL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {[
                    [
                      'Analytical Acceleration (HTAP)',
                      'Built-in Google Columnar Engine (up to 100x faster OLAP directly on live OLTP tables, auto-columnarization)',
                      'No native columnar engine inside Aurora PG; requires Zero-ETL offload to Redshift for fast analytics',
                    ],
                    [
                      'Vector Search & AI Reasoning',
                      'Proprietary Google SCaNN index (4x-10x faster QPS, ~70% less RAM) + inline Vertex AI Gemini SQL & AlloyDB AI',
                      'Standard pgvector HNSW/IVFFlat only; external Bedrock glue required for multi-step agent pipelines',
                    ],
                    [
                      'Availability SLA & Maintenance',
                      '99.99% SLA inclusive of maintenance (<1s planned maintenance downtime via adaptive vacuum & storage offload)',
                      '99.99% SLA excludes planned maintenance windows; higher I/O cost spikes on Aurora Standard vs I/O-Optimized',
                    ],
                    [
                      'Developer Entry & Local Parity',
                      'AlloyDB Express (PG 18, 1 vCPU scale-to-zero, 1-click in-place Enterprise upgrade) + AlloyDB Omni Docker container',
                      'Aurora Serverless v2 scales compute ACUs but has no local Docker equivalent matching Aurora storage/engine',
                    ],
                    [
                      'Exit Strategy & Portability',
                      '100% PostgreSQL wire-compatible + native pglogical bi-directional replication to stock open-source PostgreSQL',
                      'Requires DMS or manual logical slot management; Aurora-specific extensions/parameters create friction',
                    ],
                  ].map(([dim, alloy, aurora]) => (
                    <tr key={dim}>
                      <td className="py-2.5 pr-3 font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                        {dim}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-800 dark:text-emerald-200 bg-emerald-500/5">
                        {alloy}
                      </td>
                      <td className="py-2.5 pl-3 text-zinc-600 dark:text-zinc-400">
                        {aurora}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Boardroom C-Suite Adoption Business Case & TCO Consolidation Simulator */}
              <div className="mt-4 p-4 rounded-xl border border-amber-500/35 bg-amber-500/5 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                    <div>
                      <div className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                        C-Suite Adoption Business Case: 3-Systems-to-1 AlloyDB TCO Consolidation
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Model replacing AWS Aurora + Standalone Vector DB (Pinecone/Qdrant) + Analytics Offload with a single AlloyDB cluster.
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {typeof onNavigateTab === 'function' && (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('AWS_AZURE_PARITY')}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        AWS &amp; Azure Parity Studio
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={exportExecutiveDossier}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Boardroom Dossier (.md)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-[11px] font-mono">
                  <label className="space-y-1">
                    <span className="text-zinc-500">Primary vCPUs: <strong>{execVcpu}</strong></span>
                    <input type="range" min={2} max={64} step={2} value={execVcpu} onChange={(e) => setExecVcpu(Number(e.target.value))} className="w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-zinc-500">Storage: <strong>{execStorageTb} TB</strong></span>
                    <input type="range" min={1} max={20} step={1} value={execStorageTb} onChange={(e) => setExecStorageTb(Number(e.target.value))} className="w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-zinc-500">Read Replicas: <strong>{execReplicas}</strong></span>
                    <input type="range" min={1} max={8} step={1} value={execReplicas} onChange={(e) => setExecReplicas(Number(e.target.value))} className="w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-zinc-500">Vector DB: <strong>${execVectorDbMonthlyUsd}/mo</strong></span>
                    <input type="range" min={0} max={8000} step={200} value={execVectorDbMonthlyUsd} onChange={(e) => setExecVectorDbMonthlyUsd(Number(e.target.value))} className="w-full" />
                  </label>
                  <label className="space-y-1">
                    <span className="text-zinc-500">OLAP Offload: <strong>${execAnalyticsOffloadMonthlyUsd}/mo</strong></span>
                    <input type="range" min={0} max={10000} step={200} value={execAnalyticsOffloadMonthlyUsd} onChange={(e) => setExecAnalyticsOffloadMonthlyUsd(Number(e.target.value))} className="w-full" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10px] font-mono uppercase text-zinc-500">Legacy 3-System Spend</div>
                    <div className="text-lg font-mono font-extrabold text-zinc-700 dark:text-zinc-300">
                      ${executiveTco.legacyTotalMonthly.toLocaleString()}/mo
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-emerald-500/40">
                    <div className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400">Unified AlloyDB Spend</div>
                    <div className="text-lg font-mono font-extrabold text-emerald-700 dark:text-emerald-300">
                      ${executiveTco.alloyTotalMonthly.toLocaleString()}/mo
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/40">
                    <div className="text-[10px] font-mono uppercase text-emerald-800 dark:text-emerald-200">Projected Annual Savings</div>
                    <div className="text-lg font-mono font-extrabold text-emerald-800 dark:text-emerald-200">
                      ${executiveTco.annualSavings.toLocaleString()}/yr ({executiveTco.savingsPct}%)
                    </div>
                  </div>
                </div>

                {/* Live 36-Month Cumulative TCO Savings Curve (ECharts) */}
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/70">
                  <div className="text-[10.5px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                    36-Month Cumulative Spend Trajectory: Legacy 3-System Stack vs. Unified AlloyDB
                  </div>
                  <ReactECharts option={tcoChartOption} style={{ height: 210, width: '100%' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================
          PILLAR 6: LIVE WIRE-PROTOCOL SQL RUNNER & LOCAL ALLOYDB OMNI DOCKER
         ================================================================= */}
      {activePillar === 'LIVE_SQL_AND_OMNI' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 5 Cols: Local AlloyDB Omni Docker Control Plane */}
          <div className="lg:col-span-5 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Local AlloyDB Omni Docker Control Plane
                </h3>
              </div>
              <button
                type="button"
                onClick={fetchOmniStatus}
                className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[10.5px] font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Refresh Docker
              </button>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Develop locally against real <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">google/alloydbomni</code> (PostgreSQL + SCaNN + Columnar Engine) at <strong>$0.00/hr</strong>, then swap <code className="px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono">DATABASE_URL</code> to Cloud AlloyDB Express/Enterprise.
            </p>

            {(() => {
              const targetImage = `google/alloydbomni:${omniPgVersion}`;
              const cachedMatch = (omniStatus?.localImages || []).find(
                (img) => img.image === targetImage
              );
              const cachedList = omniStatus?.localImages || [];
              return (
                <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-zinc-500">Local Container Status</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                        omniStatus?.running
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {omniStatus?.running
                        ? 'RUNNING'
                        : omniStatus?.exists
                        ? 'STOPPED'
                        : omniStatus?.dockerAvailable === false
                        ? 'DOCKER UNAVAILABLE'
                        : 'NOT STARTED'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800/70">
                    <span className="font-mono text-[11px] text-zinc-500">
                      Image <code className="px-1 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">{targetImage}</code>
                    </span>
                    {cachedMatch ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35">
                        CACHED LOCALLY ({cachedMatch.size})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/35">
                        NOT CACHED — WILL PULL ON START
                      </span>
                    )}
                  </div>
                  {cachedList.length > 0 && !cachedMatch && (
                    <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono text-zinc-500">
                      <span>Cached tags:</span>
                      {cachedList.map((img) => {
                        const tagOnly = String(img.image || '').split(':')[1] || 'latest';
                        return (
                          <button
                            key={img.image}
                            type="button"
                            onClick={() => setOmniPgVersion(tagOnly)}
                            className="px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-bold cursor-pointer"
                          >
                            Use {tagOnly} ({img.size})
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {omniStatus?.container && (
                    <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                      {omniStatus.container.name} · {omniStatus.container.image} · {omniStatus.container.status}
                    </div>
                  )}
                  {omniStatus?.dockerError && (
                    <div className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
                      {omniStatus.dockerError}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">Image Tag</label>
                <select
                  value={omniPgVersion}
                  onChange={(e) => setOmniPgVersion(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="latest">latest (Official Docker Hub)</option>
                  <option value="17.10.0">17.10.0 (PostgreSQL 17)</option>
                  <option value="16.14.0">16.14.0 (PostgreSQL 16)</option>
                  <option value="15.18.0">15.18.0 (PostgreSQL 15)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">Local Port</label>
                <input
                  type="number"
                  value={omniPort}
                  onChange={(e) => setOmniPort(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">Dev Password</label>
                <input
                  type="text"
                  value={omniPassword}
                  onChange={(e) => setOmniPassword(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={busyKey === 'OMNI_START_OMNI' || Boolean(omniStatus?.job?.active)}
                onClick={() => runOmniAction('START_OMNI')}
                className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {omniStatus?.job?.active ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {omniStatus?.job?.active
                  ? `${omniStatus.job.phase.replace(/_/g, ' ')} (${omniStatus.job.elapsedSec}s)...`
                  : busyKey === 'OMNI_START_OMNI'
                  ? 'Dispatching Docker...'
                  : (omniStatus?.localImages || []).some(
                      (img) => img.image === `google/alloydbomni:${omniPgVersion}`
                    ) || omniStatus?.exists
                  ? 'Start Local AlloyDB Omni (Cached)'
                  : 'Pull & Start Local AlloyDB Omni'}
              </button>
              {omniStatus?.running && (
                <button
                  type="button"
                  disabled={busyKey === 'OMNI_STOP_OMNI'}
                  onClick={() => runOmniAction('STOP_OMNI')}
                  className="py-2 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold cursor-pointer"
                >
                  Stop
                </button>
              )}
              {omniStatus?.exists && (
                <button
                  type="button"
                  disabled={busyKey === 'OMNI_REMOVE_OMNI'}
                  onClick={() => runOmniAction('REMOVE_OMNI')}
                  className="py-2 px-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live 4-Step Docker Pull & Startup Progress Stepper + Real-Time Log Console */}
            {omniStatus?.job && (
              <div className="p-3 rounded-xl border border-amber-500/35 bg-zinc-950/95 text-zinc-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-[10.5px] font-mono">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    {omniStatus.job.active ? (
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                    ) : omniStatus.job.phase === 'READY' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>
                      {omniStatus.job.image} · {omniStatus.job.phase.replace(/_/g, ' ')}
                    </span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Elapsed: {omniStatus.job.elapsedSec}s</span>
                    {omniStatus.job.active && (
                      <button
                        type="button"
                        onClick={() => runOmniAction('CANCEL_OMNI_JOB')}
                        className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 text-rose-300 text-[10px] font-bold cursor-pointer"
                      >
                        Cancel Pull
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[9.5px] font-mono">
                  {[
                    { id: 'CHECKING', label: '1. Cache' },
                    { id: 'PULLING_IMAGE', label: '2. Pull' },
                    { id: 'STARTING_CONTAINER', label: '3. Start' },
                    { id: 'WAITING_PG_READY', label: '4. PG Ready' },
                  ].map((st, idx) => {
                    const order = ['CHECKING', 'PULLING_IMAGE', 'STARTING_CONTAINER', 'WAITING_PG_READY', 'READY'];
                    const curIdx = order.indexOf(omniStatus.job.phase);
                    const done = curIdx > idx || omniStatus.job.phase === 'READY';
                    const active = curIdx === idx && omniStatus.job.active;
                    return (
                      <div
                        key={st.id}
                        className={`px-1.5 py-1 rounded text-center border ${
                          done
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                            : active
                            ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-bold animate-pulse'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                        }`}
                      >
                        {st.label}
                      </div>
                    );
                  })}
                </div>
                <pre className="p-2 rounded bg-black/70 text-[10px] font-mono text-emerald-300 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {(omniStatus.job.logs || []).join('\n')}
                </pre>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setLiveDsn(`postgres://postgres:${omniPassword}@127.0.0.1:${omniPort}/postgres`)
                }
                className="flex-1 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono font-bold cursor-pointer"
              >
                Point SQL Runner to Local Omni (127.0.0.1:{omniPort}) →
              </button>
              {typeof onNavigateTab === 'function' && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('LOCAL_EMULATORS')}
                  className="py-1.5 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  Local Emulators
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right 7 Cols: Live PostgreSQL / AlloyDB Wire-Protocol psql Runner (Directly paired with Local Omni on the left) */}
          <div className="lg:col-span-7 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500 shrink-0" />
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  Live Wire-Protocol SQL &amp; EXPLAIN (ANALYZE, BUFFERS) Runner
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLiveSqlInput(`-- Live Proof-of-Value Benchmark: Seed 2,000 Vectors & Compare SCaNN vs Sequential Scan
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS alloydb_scann;
DROP TABLE IF EXISTS cloudpulse_pov_vectors;
CREATE TABLE cloudpulse_pov_vectors (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  embedding vector(128) NOT NULL
);
INSERT INTO cloudpulse_pov_vectors (category, embedding)
SELECT CASE WHEN g % 3 = 0 THEN 'runbook' ELSE 'incident' END,
       (SELECT array_agg(random()::float4)::vector(128) FROM generate_series(1, 128))
FROM generate_series(1, 2000) g;
CREATE INDEX idx_pov_scann ON cloudpulse_pov_vectors USING scann (embedding cosine) WITH (num_leaves=20);
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, category FROM cloudpulse_pov_vectors
ORDER BY embedding <=> (SELECT embedding FROM cloudpulse_pov_vectors LIMIT 1)
LIMIT 10;`)
                  }
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-[11px] font-bold cursor-pointer"
                >
                  Load Live SCaNN PoV Benchmark
                </button>
                <button
                  type="button"
                  disabled={Boolean(runningLiveSqlMode)}
                  onClick={() => executeLiveSql('INTROSPECT_ALLOYDB')}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw
                    className={`w-3 h-3 shrink-0 ${
                      runningLiveSqlMode === 'INTROSPECT_ALLOYDB' ? 'animate-spin' : ''
                    }`}
                  />
                  <span>Introspect Live Extensions &amp; Flags</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-mono text-zinc-500 mb-1">
                Target PostgreSQL / AlloyDB Connection URI (Express Public DNS, Auth Proxy, or Local Omni)
              </label>
              <input
                type="text"
                value={liveDsn}
                onChange={(e) => setLiveDsn(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <textarea
              rows={6}
              value={liveSqlInput}
              onChange={(e) => setLiveSqlInput(e.target.value)}
              className="w-full p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-emerald-300"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10.5px] font-mono text-zinc-500">
                Runs real <code className="px-1 rounded bg-zinc-100 dark:bg-zinc-800">/usr/bin/psql</code> with 12s statement_timeout · Mutating DDL/DML gated by confirmation modal
              </span>
              <button
                type="button"
                disabled={Boolean(runningLiveSqlMode)}
                onClick={() => executeLiveSql('RUN_CUSTOM_SQL')}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {runningLiveSqlMode === 'RUN_CUSTOM_SQL' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                {runningLiveSqlMode === 'RUN_CUSTOM_SQL' ? 'Executing Live SQL...' : 'Execute Live SQL'}
              </button>
            </div>

            {/* Always-Mounted Result Output Console (Prevents Layout Jump & Auto-Scrolls on Result) */}
            <div
              ref={sqlOutputRef}
              className={`p-3 rounded-xl border space-y-2 ${
                !liveSqlResult
                  ? 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60'
                  : liveSqlResult.ok
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-rose-500/40 bg-rose-500/5'
              }`}
            >
              {!liveSqlResult ? (
                <div className="text-[11px] font-mono text-zinc-500 py-4 text-center">
                  Ready — click <strong>Introspect Live Extensions &amp; Flags</strong> or <strong>Execute Live SQL</strong> to stream live <code className="px-1 rounded bg-zinc-200/70 dark:bg-zinc-800">/usr/bin/psql</code> output here.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-extrabold ${
                          liveSqlResult.ok
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {liveSqlResult.ok
                          ? liveSqlResult.mode === 'INTROSPECT_ALLOYDB'
                            ? 'INTROSPECTION OK'
                            : 'QUERY OK'
                          : 'ERROR'}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Wall: <strong>{liveSqlResult.durationMs} ms</strong>
                      </span>
                      {liveSqlResult.planningTimeMs !== null && liveSqlResult.planningTimeMs !== undefined && (
                        <span className="text-sky-600 dark:text-sky-400">
                          Planning: <strong>{liveSqlResult.planningTimeMs} ms</strong>
                        </span>
                      )}
                      {liveSqlResult.executionTimeMs !== null && liveSqlResult.executionTimeMs !== undefined && (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          Execution: <strong>{liveSqlResult.executionTimeMs} ms</strong>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            liveSqlResult.ok ? liveSqlResult.stdout : liveSqlResult.error,
                            'psql-out',
                            'SQL Output'
                          )
                        }
                        className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold cursor-pointer"
                      >
                        {copiedKey === 'psql-out' ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLiveSqlResult(null)}
                        className="px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[10.5px] max-h-56 overflow-auto whitespace-pre-wrap">
                    {liveSqlResult.ok ? liveSqlResult.stdout : liveSqlResult.error}
                  </pre>
                </>
              )}
            </div>
          </div>

          {/* Full-Width Row Below: Dual-Engine Gemini 4 (Vertex AI Keyless OAuth2 OR Vaulted AI Studio Key) NL2SQL Copilot */}
          <div className="lg:col-span-12 p-4 rounded-xl border border-amber-500/35 bg-white dark:bg-[#10141d] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                <Wand2 className="w-4 h-4 text-amber-500" />
                <span>Dual-Engine Gemini 4 Natural-Language → AlloyDB SQL Copilot</span>
              </div>
              {nlResult?.engine && (
                <span className="text-[10.5px] font-mono text-zinc-500">{nlResult.engine}</span>
              )}
            </div>
            <ZeroSniffingWebCryptoEnclaveBar
              projectId={projectId}
              selectedModel={nlModel}
              onChangeModel={setNlModel}
              onShowToast={notify}
              compact
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                placeholder="Ask in plain English (e.g. 'Run a 90-day Columnar HTAP revenue rollup' or 'Check pglogical replication lag')..."
                className="flex-1 min-w-[240px] px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
              />
              <button
                type="button"
                disabled={runningNl2Sql}
                onClick={runNl2SqlCopilot}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {runningNl2Sql ? 'Synthesizing...' : 'Synthesize AlloyDB SQL'}
              </button>
            </div>
            {nlResult && (
              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {(nlResult.featuresUsed || []).map((f) => (
                      <code key={f} className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono text-[10px]">
                        {f}
                      </code>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLiveSqlInput(nlResult.sql);
                      notify('Loaded synthesized SQL into Live psql Runner above');
                    }}
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-bold cursor-pointer"
                  >
                    Load into SQL Runner Above ↑
                  </button>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300">{nlResult.executiveSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================
          PILLAR 5: ALL 10 SPREADSHEET SCENARIOS & LIVE LAB LAUNCHER
         ================================================================= */}
      {activePillar === 'PLAYBOOK_MATRIX' && (
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#10141d] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                10-Topic AlloyDB Field &amp; Session Playbook Matrix
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Every scenario from your 4 core AlloyDB pillars — click <strong>Launch Live Lab →</strong> on any card to pre-load its runnable SQL, CLI, and architecture workbench.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                'ALL',
                'Vendor Lock-in Concerns',
                'Vector Performance vs. pgvector',
                'AlloyDB vs. AWS Aurora Parity',
                'General Lack of Awareness',
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopicFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono font-bold border cursor-pointer ${
                    topicFilter === t
                      ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-200'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t === 'ALL' ? 'All 10 Scenarios' : t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredScenarios.map((sc, idx) => (
              <div
                key={sc.id}
                className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[9.5px] font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
                      {sc.topicArea}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      #{String(idx + 1).padStart(2, '0')} · {sc.persona}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {sc.title}
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {sc.angle}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {sc.stack.map((tag) => (
                      <code
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[10px]"
                      >
                        {tag}
                      </code>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-zinc-200/70 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => jumpToScenarioLab(sc)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Launch Live Lab →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
