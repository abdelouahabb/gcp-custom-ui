import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Database,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  PlusCircle,
  Zap,
  Cpu,
  Lock,
  Key,
  FileCode,
  Layers,
  Terminal,
  Trash2,
  Play,
  ArrowRight,
  GitBranch,
  Activity,
  Globe,
} from 'lucide-react';
import LocalDevTunnelBar from './LocalDevTunnelBar';
import MermaidArchitectureDiagram from './MermaidArchitectureDiagram';

const SQL_TIERS = {
  ENTERPRISE: [
    {
      id: 'db-f1-micro',
      label: 'db-f1-micro (Shared vCPU · 0.6 GB RAM · Dev/Test)',
      vcpu: 0.5,
      ramGb: 0.6,
      hourlyUsd: 0.015,
    },
    {
      id: 'db-custom-2-8192',
      label: 'db-custom-2-8192 (2 vCPU · 8 GB RAM · Standard Prod)',
      vcpu: 2,
      ramGb: 8,
      hourlyUsd: 0.135,
    },
    {
      id: 'db-custom-4-16384',
      label: 'db-custom-4-16384 (4 vCPU · 16 GB RAM · High Throughput)',
      vcpu: 4,
      ramGb: 16,
      hourlyUsd: 0.27,
    },
    {
      id: 'db-custom-8-32768',
      label: 'db-custom-8-32768 (8 vCPU · 32 GB RAM · Heavy OLTP)',
      vcpu: 8,
      ramGb: 32,
      hourlyUsd: 0.54,
    },
  ],
  ENTERPRISE_PLUS: [
    {
      id: 'db-perf-optimized-N-2',
      label: 'db-perf-optimized-N-2 (2 vCPU · 16 GB RAM + NVMe Data Cache)',
      vcpu: 2,
      ramGb: 16,
      hourlyUsd: 0.235,
    },
    {
      id: 'db-perf-optimized-N-4',
      label: 'db-perf-optimized-N-4 (4 vCPU · 32 GB RAM + NVMe Data Cache)',
      vcpu: 4,
      ramGb: 32,
      hourlyUsd: 0.47,
    },
    {
      id: 'db-perf-optimized-N-8',
      label: 'db-perf-optimized-N-8 (8 vCPU · 64 GB RAM + NVMe Data Cache)',
      vcpu: 8,
      ramGb: 64,
      hourlyUsd: 0.94,
    },
  ],
  ALLOYDB: [
    {
      id: 'alloydb-2vcpu-16gb',
      label: 'AlloyDB Primary 2 vCPU · 16 GB RAM (Colossus Storage + Columnar)',
      vcpu: 2,
      ramGb: 16,
      hourlyUsd: 0.268,
    },
    {
      id: 'alloydb-4vcpu-32gb',
      label: 'AlloyDB Primary 4 vCPU · 32 GB RAM (4x Postgres TPS + ScaNN)',
      vcpu: 4,
      ramGb: 32,
      hourlyUsd: 0.536,
    },
    {
      id: 'alloydb-8vcpu-64gb',
      label: 'AlloyDB Primary 8 vCPU · 64 GB RAM (100x Analytics + AI RAG)',
      vcpu: 8,
      ramGb: 64,
      hourlyUsd: 1.072,
    },
  ],
};

export default function CloudSqlAndAlloyDbStudio({
  projectId,
  onOpenProvisionSql,
  onOpenProvisionCloudSql,
  onNavigateTab,
  onOpenBigQuerySql,
  onOpenHealthAndDrift,
  onRunInShell,
  onRefreshOverview,
  onShowToast,
  initialSubTab = null,
}) {
  const [activeSubTab, setActiveSubTab] = useState(
    initialSubTab || 'FLEET_PROVISION'
  );
  const [sqlData, setSqlData] = useState(null);
  const [loadingSql, setLoadingSql] = useState(false);

  // --- Engine Family, Architecture Fork & Compliance Blueprint State ---
  const [sqlBlueprint, setSqlBlueprint] = useState('pci-sec-ledger');
  const [sqlEngineFamily, setSqlEngineFamily] = useState('POSTGRES'); // POSTGRES | MYSQL
  const [sqlArchitecture, setSqlArchitecture] = useState('CLOUD_SQL'); // CLOUD_SQL | ALLOYDB (PostgreSQL only)
  const [databaseVersion, setDatabaseVersion] = useState('POSTGRES_16');
  const [edition, setEdition] = useState('ENTERPRISE_PLUS'); // ENTERPRISE | ENTERPRISE_PLUS
  const [tier, setTier] = useState('db-perf-optimized-N-2');
  const [sqlName, setSqlName] = useState('cloudpulse-pg16-vault');
  const [sqlRegion, setSqlRegion] = useState('us-central1');
  const [sqlAvailability, setSqlAvailability] = useState('REGIONAL'); // REGIONAL | ZONAL
  const [sqlNetworkMode, setSqlNetworkMode] = useState('PRIVATE_VPC_ONLY'); // PRIVATE_VPC_ONLY | PUBLIC_IPV4
  const [sqlSslMode, setSqlSslMode] = useState(
    'TRUSTED_CLIENT_CERTIFICATE_REQUIRED'
  );
  const [sqlPitrDays, setSqlPitrDays] = useState(35);
  const [storageSizeGb, setStorageSizeGb] = useState(50);
  const [sqlIamAuth, setSqlIamAuth] = useState(true);
  const [enablePgAudit, setEnablePgAudit] = useState(true);
  const [enableVectorScann, setEnableVectorScann] = useState(true);
  const [enableColumnarEngine, setEnableColumnarEngine] = useState(true);
  const [creatingDb, setCreatingDb] = useState(false);
  const [deletingDbName, setDeletingDbName] = useState('');
  const [copiedLabel, setCopiedLabel] = useState('');

  // --- Sub-Tab 2: Actionable Architecture Comparator & TCO Action Matrix State ---
  const [simVcpu, setSimVcpu] = useState(4);
  const [simStorageGb, setSimStorageGb] = useState(250);
  const [simVectorCountMillions, setSimVectorCountMillions] = useState(10);
  const [simOlapScanGbDay, setSimOlapScanGbDay] = useState(120);
  const [simReadReplicas, setSimReadReplicas] = useState(2);
  const [selectedComparatorArch, setSelectedComparatorArch] =
    useState('ALLOYDB'); // 'ENTERPRISE' | 'ENTERPRISE_PLUS' | 'ALLOYDB'
  const [provisioningComparatorArch, setProvisioningComparatorArch] =
    useState(null);

  // --- Sub-Tab 3: AI Vector & Index Surgeon State ---
  const [vectorTableName, setVectorTableName] = useState('knowledge_chunks');
  const [vectorDimensions, setVectorDimensions] = useState(768);
  const [embeddingModel, setEmbeddingModel] = useState('text-embedding-005');

  // --- Sub-Tab 5: Spanner Graph (ISO GQL) & TrueTime Global ACID State ---
  const [spannerInstanceId, setSpannerInstanceId] = useState(
    'cloudpulse-fin-graph'
  );
  const [spannerDatabaseId, setSpannerDatabaseId] = useState('ledger_graph_db');
  const [spannerConfig, setSpannerConfig] = useState('nam-eur-asia1'); // 'regional-us-central1' | 'nam3' | 'nam-eur-asia1'
  const [spannerProcessingUnits, setSpannerProcessingUnits] = useState(300); // 100 PU = 0.1 node
  const [spannerGraphName, setSpannerGraphName] = useState('FinTechFraudGraph');
  const [spannerHopDepth, setSpannerHopDepth] = useState(3);
  const [spannerGqlRunCount, setSpannerGqlRunCount] = useState(0);
  const [spannerGqlCommitTs, setSpannerGqlCommitTs] = useState('');

  // --- Sub-Tab 6: Datastream Zero-ETL CDC into BigQuery & BigLake State ---
  const [cdcStreamId, setCdcStreamId] = useState('alloydb-to-bq-realtime-cdc');
  const [cdcSourceEngine, setCdcSourceEngine] = useState('ALLOYDB_PG'); // 'ALLOYDB_PG' | 'CLOUDSQL_PG' | 'CLOUDSQL_MYSQL'
  const [cdcTargetDataset, setCdcTargetDataset] = useState(
    'analytics_lakehouse'
  );
  const [cdcTargetTable, setCdcTargetTable] = useState(
    'cdc_orders_realtime'
  );
  const [cdcMaxStalenessMins, setCdcMaxStalenessMins] = useState(5);
  const [cdcTargetFormat, setCdcTargetFormat] = useState('BQ_UPSERT'); // 'BQ_UPSERT' | 'BIGLAKE_ICEBERG'
  const [provisioningCdcTable, setProvisioningCdcTable] = useState(false);

  const handleCopy = (text, label = 'command') => {
    navigator.clipboard?.writeText(text);
    setCopiedLabel(label);
    if (onShowToast) onShowToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedLabel(''), 2000);
  };

  const fetchCloudSqlFleet = useCallback(async () => {
    if (!projectId) return;
    setLoadingSql(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave9/cloud-sql`
      );
      setSqlData(res.data);
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error ||
            'Failed to inspect Cloud SQL & AlloyDB fleet'
        );
      }
    } finally {
      setLoadingSql(false);
    }
  }, [projectId, onShowToast]);

  useEffect(() => {
    fetchCloudSqlFleet();
  }, [fetchCloudSqlFleet]);

  const handleSelectEngineFamily = (fam) => {
    setSqlEngineFamily(fam);
    if (fam === 'MYSQL') {
      // AlloyDB is strictly PostgreSQL-compatible; lock MySQL to Cloud SQL
      setSqlArchitecture('CLOUD_SQL');
      setDatabaseVersion('MYSQL_8_4');
      setSqlName('cloudpulse-mysql84-vault');
      if (edition === 'ENTERPRISE_PLUS') {
        setTier('db-perf-optimized-N-2');
      } else {
        setTier('db-custom-2-8192');
      }
    } else {
      setDatabaseVersion('POSTGRES_16');
      setSqlName(
        sqlArchitecture === 'ALLOYDB'
          ? 'cloudpulse-alloydb-pg16'
          : 'cloudpulse-pg16-vault'
      );
    }
  };

  const handleSelectArchitecture = (arch) => {
    if (sqlEngineFamily === 'MYSQL' && arch === 'ALLOYDB') return;
    setSqlArchitecture(arch);
    if (arch === 'ALLOYDB') {
      setSqlEngineFamily('POSTGRES');
      setDatabaseVersion('POSTGRES_16');
      setTier('alloydb-4vcpu-32gb');
      setSqlName('cloudpulse-alloydb-pg16');
      setSqlAvailability('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
    } else {
      setTier(
        edition === 'ENTERPRISE_PLUS'
          ? 'db-perf-optimized-N-2'
          : 'db-custom-2-8192'
      );
      setSqlName(
        sqlEngineFamily === 'MYSQL'
          ? 'cloudpulse-mysql84-vault'
          : 'cloudpulse-pg16-vault'
      );
    }
  };

  const applySqlBlueprint = (bp) => {
    setSqlBlueprint(bp);
    if (bp === 'pci-sec-ledger') {
      setSqlRegion('us-central1');
      setSqlAvailability('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('TRUSTED_CLIENT_CERTIFICATE_REQUIRED');
      setSqlPitrDays(35);
      setSqlIamAuth(true);
      setEnablePgAudit(true);
    } else if (bp === 'gdpr-eu-postgres') {
      setSqlRegion('europe-west1');
      setSqlAvailability('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlPitrDays(14);
      setSqlIamAuth(true);
      setEnablePgAudit(true);
    } else if (bp === 'hipaa-clinical-db') {
      setSqlRegion('us-east4');
      setSqlAvailability('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlPitrDays(30);
      setSqlIamAuth(true);
      setEnablePgAudit(true);
    } else if (bp === 'ai-scann-alloydb') {
      setSqlEngineFamily('POSTGRES');
      setSqlArchitecture('ALLOYDB');
      setDatabaseVersion('POSTGRES_16');
      setTier('alloydb-4vcpu-32gb');
      setSqlName('cloudpulse-alloydb-ai-rag');
      setSqlRegion('us-central1');
      setSqlAvailability('REGIONAL');
      setSqlNetworkMode('PRIVATE_VPC_ONLY');
      setSqlSslMode('ENCRYPTED_ONLY');
      setSqlPitrDays(14);
      setSqlIamAuth(true);
      setEnableVectorScann(true);
      setEnableColumnarEngine(true);
    }
  };

  const handleProvisionDatabase = async (e) => {
    e.preventDefault();
    if (!sqlName.trim() || creatingDb) return;
    setCreatingDb(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType: 'CLOUD_SQL',
          name: sqlName.trim(),
          region: sqlRegion,
          config: {
            sqlArchitecture,
            sqlEngineFamily,
            databaseVersion,
            edition,
            tier,
            sqlRegion,
            availabilityType: sqlAvailability,
            storageSizeGb: Number(storageSizeGb || 50),
            networkMode: sqlNetworkMode,
            sslMode: sqlSslMode,
            pitrDays: Number(sqlPitrDays || 14),
            iamAuth: sqlIamAuth,
            enablePgAudit,
            enableVectorScann,
            enableColumnarEngine,
            deletionProtection: true,
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Dispatched ${sqlArchitecture} (${databaseVersion}) provisioning on GCP`
        );
      }
      await fetchCloudSqlFleet();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error || 'Failed to provision database instance'
        );
      }
    } finally {
      setCreatingDb(false);
    }
  };

  const handleDeleteCloudSql = async (instName) => {
    if (!instName || deletingDbName) return;
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloud-sql/instances/${encodeURIComponent(instName)}`,
        {
          __onGatekeeperConfirmed: () => {
            setDeletingDbName(instName);
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Decommissioning Cloud SQL instance ${instName}`
        );
      }
      await fetchCloudSqlFleet();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error ||
            `Failed to delete Cloud SQL instance ${instName}`
        );
      }
    } finally {
      setDeletingDbName('');
    }
  };

  const handleDeleteAlloyDb = async (loc, cName) => {
    if (!loc || !cName || deletingDbName) return;
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/alloydb/clusters/${encodeURIComponent(loc)}/${encodeURIComponent(
          cName
        )}`,
        {
          __onGatekeeperConfirmed: () => {
            setDeletingDbName(cName);
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Decommissioning AlloyDB cluster ${cName}`
        );
      }
      await fetchCloudSqlFleet();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error ||
            `Failed to delete AlloyDB cluster ${cName}`
        );
      }
    } finally {
      setDeletingDbName('');
    }
  };

  // Strict Compliance Locks
  const isCustom = sqlBlueprint === 'custom';
  const isGdpr = sqlBlueprint === 'gdpr-eu-postgres';
  const isUsOnly =
    sqlBlueprint === 'pci-sec-ledger' || sqlBlueprint === 'hipaa-clinical-db';
  const isAiAlloyBlueprint = sqlBlueprint === 'ai-scann-alloydb';
  const isZeroTrust = !isCustom;

  // Equivalent gcloud CLI
  const gcloudCli =
    sqlArchitecture === 'ALLOYDB' && sqlEngineFamily === 'POSTGRES'
      ? `# 1. Provision Disaggregated Google Cloud AlloyDB Cluster (${databaseVersion})
gcloud alloydb clusters create ${sqlName} \\
  --region=${sqlRegion} \\
  --database-version=${databaseVersion} \\
  --network=projects/${projectId}/global/networks/default \\
  --continuous-backup-recovery-window-days=${sqlPitrDays} \\
  --project=${projectId} && \\
# 2. Provision Primary Compute Instance with Columnar Engine & ScaNN Vector Index
gcloud alloydb instances create ${sqlName}-primary \\
  --cluster=${sqlName} \\
  --region=${sqlRegion} \\
  --instance-type=PRIMARY \\
  --cpu-count=${tier.includes('8vcpu') ? 8 : tier.includes('4vcpu') ? 4 : 2} \\
  --availability-type=${sqlAvailability} \\
  --ssl-mode=ENCRYPTED_ONLY \\
  --database-flags=alloydb.iam_authentication=on,google_columnar_engine.enabled=${
    enableColumnarEngine ? 'on' : 'off'
  } \\
  --project=${projectId}`
      : `gcloud sql instances create ${sqlName} \\
  --database-version=${databaseVersion} \\
  --edition=${edition} \\
  --tier=${tier} \\
  --region=${sqlRegion} \\
  --availability-type=${sqlAvailability} \\
  --storage-size=${storageSizeGb}GB \\
  --storage-type=SSD \\
  --storage-auto-increase \\
  ${sqlNetworkMode === 'PRIVATE_VPC_ONLY' ? '--no-assign-ip \\\n  ' : ''}--network=projects/${projectId}/global/networks/default \\
  --ssl-mode=${sqlSslMode} \\
  ${
    sqlEngineFamily === 'MYSQL'
      ? '--enable-bin-log'
      : '--enable-point-in-time-recovery'
  } \\
  --retained-backups-count=${sqlPitrDays} \\
  ${
    sqlEngineFamily === 'POSTGRES'
      ? `--database-flags=cloudsql.iam_authentication=${
          sqlIamAuth ? 'on' : 'off'
        }${enablePgAudit ? ',cloudsql.enable_pgaudit=on' : ''} \\\n  `
      : ''
  }--deletion-protection \\
  --project=${projectId}`;

  // Vector & Slow-Query SQL Generator
  const generatedVectorSql =
    sqlEngineFamily === 'MYSQL'
      ? `-- MySQL 8.4 LTS Native VECTOR & InnoDB Buffer Pool Tuning (${sqlName})
CREATE TABLE IF NOT EXISTS ${vectorTableName} (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  doc_uri VARCHAR(512) NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(${vectorDimensions}) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Inspect Top 5 Slowest MySQL Statements via performance_schema
SELECT DIGEST_TEXT, COUNT_STAR,
       ROUND(AVG_TIMER_WAIT / 1000000000, 2) AS avg_latency_ms,
       SUM_ROWS_EXAMINED
FROM performance_schema.events_statements_summary_by_digest
ORDER BY AVG_TIMER_WAIT DESC LIMIT 5;`
      : sqlArchitecture === 'ALLOYDB'
      ? `-- Google Cloud AlloyDB for PostgreSQL: ScaNN Vector Index + Vertex AI Inline Embeddings + Columnar Engine
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS alloydb_scann;
CREATE EXTENSION IF NOT EXISTS google_ml_integration;

CREATE TABLE IF NOT EXISTS ${vectorTableName} (
  id BIGSERIAL PRIMARY KEY,
  doc_uri TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(${vectorDimensions}) GENERATED ALWAYS AS (
    embedding('${embeddingModel}', chunk_text)::vector(${vectorDimensions})
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Build Google Research ScaNN Index (10x faster QPS than HNSW, 4x smaller memory footprint)
CREATE INDEX IF NOT EXISTS idx_${vectorTableName}_scann
ON ${vectorTableName} USING scann (embedding cosine)
WITH (num_leaves = 1000, quantizer = 'SQ8');

-- Auto-populate AlloyDB Columnar Engine for 100x faster hybrid OLAP + Vector filtering
SELECT google_columnar_engine_add('${vectorTableName}');`
      : `-- Cloud SQL for PostgreSQL (${edition}): pgvector HNSW Index + pg_stat_statements Surgeon
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

CREATE TABLE IF NOT EXISTS ${vectorTableName} (
  id BIGSERIAL PRIMARY KEY,
  doc_uri TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(${vectorDimensions}) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Build HNSW Cosine Similarity Index for Cloud SQL PostgreSQL
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${vectorTableName}_hnsw
ON ${vectorTableName} USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);`;

  const instancesList = sqlData?.instances || [];
  const alloyClustersList = sqlData?.alloyDbClusters || [];
  const totalCount = instancesList.length + alloyClustersList.length;

  // Actionable Architecture & TCO Comparator Math + Live Execution Blueprints
  const archComparatorMetrics = useMemo(() => {
    const vcpu = Math.max(2, Number(simVcpu || 4));
    const storageGb = Math.max(50, Number(simStorageGb || 250));
    const vectorsM = Math.max(1, Number(simVectorCountMillions || 10));
    const olapGb = Math.max(10, Number(simOlapScanGbDay || 120));
    const replicas = Math.max(0, Number(simReadReplicas || 2));

    // Classic Cloud SQL duplicates PD-SSD storage for HA standby + every Read Replica
    const cloudSqlStorageCopies = 2 + replicas; // Primary + Regional HA Standby + Read Replicas
    const cloudSqlEntStorageUsd = Math.round(
      storageGb * 0.17 * cloudSqlStorageCopies
    );
    const cloudSqlEntComputeUsd = Math.round(
      vcpu * 0.068 * (2 + replicas) * 730
    );
    const cloudSqlEntMonthly = cloudSqlEntComputeUsd + cloudSqlEntStorageUsd;

    const cloudSqlPlusComputeUsd = Math.round(
      vcpu * 0.115 * (2 + replicas) * 730
    );
    const cloudSqlPlusStorageUsd = Math.round(
      storageGb * 0.17 * cloudSqlStorageCopies
    );
    const cloudSqlPlusMonthly = cloudSqlPlusComputeUsd + cloudSqlPlusStorageUsd;

    // AlloyDB Disaggregated Colossus Storage: Pay ONLY ONCE for storage ($0.30/GB-mo regional) regardless of HA or Read Pool nodes!
    const alloyDbStorageUsd = Math.round(storageGb * 0.3);
    const alloyDbComputeUsd = Math.round(
      vcpu * 0.134 * (1 + Math.max(1, replicas)) * 730
    );
    const alloyDbMonthly = alloyDbComputeUsd + alloyDbStorageUsd;

    const replicaStorageSavedUsd = Math.max(
      0,
      cloudSqlPlusStorageUsd - alloyDbStorageUsd
    );

    const entTierId =
      vcpu >= 8
        ? 'db-custom-8-32768'
        : vcpu >= 4
        ? 'db-custom-4-16384'
        : 'db-custom-2-8192';
    const entPlusTierId =
      vcpu >= 8
        ? 'db-perf-optimized-N-8'
        : vcpu >= 4
        ? 'db-perf-optimized-N-4'
        : 'db-perf-optimized-N-2';
    const alloyTierId =
      vcpu >= 8
        ? 'alloydb-8vcpu-64gb'
        : vcpu >= 4
        ? 'alloydb-4vcpu-32gb'
        : 'alloydb-2vcpu-16gb';

    const winnerArch =
      sqlEngineFamily === 'MYSQL'
        ? 'ENTERPRISE_PLUS'
        : vectorsM >= 5 || olapGb >= 60 || replicas >= 2
        ? 'ALLOYDB'
        : 'ENTERPRISE_PLUS';

    const targetSqlInst = instancesList[0]?.name || sqlName || 'cloudpulse-pg16-vault';
    const targetAlloyCluster =
      alloyClustersList[0]?.name || 'cloudpulse-alloydb-pg16';

    const blueprints = {
      ENTERPRISE: {
        id: 'ENTERPRISE',
        title: `Cloud SQL Enterprise (${entTierId}) · Baseline OLTP + In-Place Upgrade Path`,
        badge: '99.95% SLA · $0 LICENSE FEE · IN-PLACE UPGRADE READY',
        tierId: entTierId,
        provisionName: `cloudpulse-ent-${vcpu}vcpu`,
        sql: `-- Cloud SQL Enterprise (${databaseVersion}) Baseline Tuning + pgvector HNSW
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 1. Create Transactional + Vector Table (${storageGb} GB PD-SSD)
CREATE TABLE IF NOT EXISTS ${vectorTableName} (
  id BIGSERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  doc_uri TEXT NOT NULL,
  embedding vector(${vectorDimensions}) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Standard HNSW Index (Baseline ${vectorsM * 45} QPS)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_${vectorTableName}_ent_hnsw
ON ${vectorTableName} USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);`,
        cli: `# 1. Provision Cloud SQL Enterprise (${vcpu} vCPU · ${vcpu * 4} GB RAM · Regional HA)
gcloud sql instances create cloudpulse-ent-${vcpu}vcpu \\
  --database-version=${databaseVersion} \\
  --edition=ENTERPRISE \\
  --tier=${entTierId} \\
  --region=${sqlRegion} \\
  --availability-type=REGIONAL \\
  --storage-size=${storageGb}GB \\
  --storage-type=SSD \\
  --no-assign-ip \\
  --network=projects/${projectId}/global/networks/default \\
  --enable-point-in-time-recovery \\
  --retained-backups-count=7 \\
  --project=${projectId}`,
        upgradeCli: `# In-Place Upgrade Existing Cloud SQL Instance (${targetSqlInst}) → ENTERPRISE_PLUS (<5s Near-Zero Downtime)
gcloud sql instances patch ${targetSqlInst} \\
  --edition=ENTERPRISE_PLUS \\
  --tier=${entPlusTierId} \\
  --enable-data-cache \\
  --retained-backups-count=35 \\
  --project=${projectId}`,
        xrayQuery: `-- Federated BigQuery EXTERNAL_QUERY → Cloud SQL Enterprise (${targetSqlInst})
SELECT
  bq.region,
  COUNT(*) AS lakehouse_events,
  ROUND(AVG(bq.latency_ms), 2) AS avg_latency_ms,
   ROUND(SUM(bq.revenue_usd), 2) AS total_revenue_usd
FROM \`${projectId}.analytics_lakehouse.open_iceberg_events\` AS bq
WHERE bq.event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY bq.region
ORDER BY total_revenue_usd DESC
LIMIT 25;`,
      },
      ENTERPRISE_PLUS: {
        id: 'ENTERPRISE_PLUS',
        title: `Cloud SQL Enterprise Plus (${entPlusTierId}) · Local NVMe Data Cache + 35d PITR`,
        badge: '99.99% SLA · <5s DOWNTIME · 3x NVMe READ CACHE',
        tierId: entPlusTierId,
        provisionName: `cloudpulse-entplus-${vcpu}vcpu`,
        sql: `-- Cloud SQL Enterprise Plus (${databaseVersion}) · NVMe Data Cache Acceleration + HNSW
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS google_db_advisor;

-- 1. Pin Hot Vector & Ledger Pages in Local NVMe Data Cache (3x Read / 2x Write TPS)
ALTER SYSTEM SET shared_buffers = '${Math.round(vcpu * 3.2)}GB';
ALTER SYSTEM SET effective_cache_size = '${vcpu * 8}GB';

-- 2. Query Google DB Advisor for Missing Composite Indexes & Lock Contention
SELECT * FROM google_db_advisor_recommended_indexes LIMIT 10;`,
        cli: `# Provision Cloud SQL Enterprise Plus with Local NVMe Data Cache & 35-Day PITR
gcloud sql instances create cloudpulse-entplus-${vcpu}vcpu \\
  --database-version=${databaseVersion} \\
  --edition=ENTERPRISE_PLUS \\
  --tier=${entPlusTierId} \\
  --region=${sqlRegion} \\
  --availability-type=REGIONAL \\
  --enable-data-cache \\
  --storage-size=${storageGb}GB \\
  --storage-type=SSD \\
  --no-assign-ip \\
  --network=projects/${projectId}/global/networks/default \\
  --enable-point-in-time-recovery \\
  --retained-backups-count=35 \\
  --project=${projectId}`,
        upgradeCli: `# Enable Local NVMe Data Cache & 35-Day PITR on ${targetSqlInst}
gcloud sql instances patch ${targetSqlInst} \\
  --edition=ENTERPRISE_PLUS \\
  --tier=${entPlusTierId} \\
  --enable-data-cache \\
  --retained-backups-count=35 \\
  --availability-type=REGIONAL \\
  --project=${projectId}`,
        xrayQuery: `-- Hybrid BigQuery + Cloud SQL Enterprise Plus Federated Analytics
SELECT
  service_name,
  region,
  COUNT(*) AS tx_count,
  ROUND(AVG(latency_ms), 2) AS p50_latency_ms,
  ROUND(SUM(revenue_usd), 2) AS gross_volume_usd
FROM \`${projectId}.analytics_lakehouse.open_iceberg_events\`
WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY service_name, region
ORDER BY gross_volume_usd DESC
LIMIT 25;`,
      },
      ALLOYDB: {
        id: 'ALLOYDB',
        title: `Google Cloud AlloyDB (${alloyTierId}) · Disaggregated Colossus + 100x Columnar + ScaNN`,
        badge: '99.99% (<1s FAILOVER) · 100x COLUMNAR · 10x SCANN VECTOR QPS',
        tierId: alloyTierId,
        provisionName: `cloudpulse-alloy-${vcpu}vcpu`,
        sql: `-- Google Cloud AlloyDB (${databaseVersion}) · Columnar Engine + Google Research ScaNN + Vertex AI Inline
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS alloydb_scann;
CREATE EXTENSION IF NOT EXISTS google_ml_integration;
CREATE EXTENSION IF NOT EXISTS google_columnar_engine;

-- 1. Create RAG + Transactional Ledger Table with Auto-Generated Vertex AI Embeddings
CREATE TABLE IF NOT EXISTS ${vectorTableName} (
  id BIGSERIAL PRIMARY KEY,
  region TEXT NOT NULL,
  chunk_text TEXT NOT NULL,
  revenue_usd NUMERIC(12,2) DEFAULT 0.00,
  embedding vector(${vectorDimensions}) GENERATED ALWAYS AS (
    embedding('${embeddingModel}', chunk_text)::vector(${vectorDimensions})
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Build Google Research ScaNN Index (${vectorsM * 480} QPS · 10x faster than HNSW · 4x smaller RAM)
CREATE INDEX IF NOT EXISTS idx_${vectorTableName}_scann
ON ${vectorTableName} USING scann (embedding cosine)
WITH (num_leaves = ${Math.min(4000, Math.max(500, vectorsM * 100))}, quantizer = 'SQ8');

-- 3. Populate AlloyDB In-Memory Columnar Engine for 100x faster Hybrid OLAP scans (${olapGb} GB/day)
SELECT google_columnar_engine_add('${vectorTableName}');`,
        cli: `# 1. Provision Disaggregated AlloyDB Cluster (Zero Replica Storage Duplication — Saves $${replicaStorageSavedUsd}/mo on Storage)
gcloud alloydb clusters create cloudpulse-alloy-${vcpu}vcpu \\
  --region=${sqlRegion} \\
  --database-version=POSTGRES_16 \\
  --network=projects/${projectId}/global/networks/default \\
  --continuous-backup-recovery-window-days=35 \\
  --project=${projectId} && \\
gcloud alloydb instances create cloudpulse-alloy-${vcpu}vcpu-primary \\
  --cluster=cloudpulse-alloy-${vcpu}vcpu \\
  --region=${sqlRegion} \\
  --instance-type=PRIMARY \\
  --cpu-count=${vcpu} \\
  --availability-type=REGIONAL \\
  --ssl-mode=ENCRYPTED_ONLY \\
  --database-flags=alloydb.iam_authentication=on,google_columnar_engine.enabled=on,alloydb.enable_pgaudit=on \\
  --project=${projectId}`,
        upgradeCli: `# Zero-Downtime Database Migration Service (DMS) Continuous CDC: Cloud SQL (${targetSqlInst}) → AlloyDB (${targetAlloyCluster})
gcloud database-migration migration-jobs create cloudsql-to-alloydb-cdc \\
  --region=${sqlRegion} \\
  --type=CONTINUOUS \\
  --source=cloudsql-pg-source \\
  --destination=alloydb-cluster-dest \\
  --project=${projectId}`,
        xrayQuery: `-- Hybrid AlloyDB ScaNN + BigQuery Lakehouse Federated Join (Zero-ETL Analytics)
SELECT
  evt.region,
  evt.service_name,
  COUNT(evt.event_id) AS total_events,
  ROUND(AVG(evt.latency_ms), 2) AS avg_latency_ms,
  ROUND(SUM(evt.revenue_usd), 2) AS lakehouse_revenue_usd
FROM \`${projectId}.analytics_lakehouse.open_iceberg_events\` AS evt
WHERE evt.event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY evt.region, evt.service_name
ORDER BY lakehouse_revenue_usd DESC
LIMIT 25;`,
      },
    };

    return {
      vcpu,
      storageGb,
      vectorsM,
      olapGb,
      replicas,
      cloudSqlEntMonthly,
      cloudSqlEntComputeUsd,
      cloudSqlEntStorageUsd,
      cloudSqlPlusMonthly,
      cloudSqlPlusComputeUsd,
      cloudSqlPlusStorageUsd,
      alloyDbMonthly,
      alloyDbComputeUsd,
      alloyDbStorageUsd,
      replicaStorageSavedUsd,
      entTierId,
      entPlusTierId,
      alloyTierId,
      winnerArch,
      targetSqlInst,
      targetAlloyCluster,
      blueprints,
    };
  }, [
    simVcpu,
    simStorageGb,
    simVectorCountMillions,
    simOlapScanGbDay,
    simReadReplicas,
    sqlEngineFamily,
    databaseVersion,
    vectorTableName,
    vectorDimensions,
    embeddingModel,
    sqlRegion,
    projectId,
    instancesList,
    alloyClustersList,
    sqlName,
  ]);

  const handleLoadComparatorIntoProvisioner = (archKey) => {
    const bp = archComparatorMetrics.blueprints[archKey];
    if (!bp) return;
    setSelectedComparatorArch(archKey);
    setStorageSizeGb(archComparatorMetrics.storageGb);
    if (archKey === 'ALLOYDB') {
      setSqlEngineFamily('POSTGRES');
      setSqlArchitecture('ALLOYDB');
      setDatabaseVersion('POSTGRES_16');
      setTier(bp.tierId);
      setSqlName(bp.provisionName);
      setSqlPitrDays(35);
      setEnableColumnarEngine(true);
      setEnableVectorScann(true);
    } else if (archKey === 'ENTERPRISE_PLUS') {
      setSqlArchitecture('CLOUD_SQL');
      setEdition('ENTERPRISE_PLUS');
      setTier(bp.tierId);
      setSqlName(bp.provisionName);
      setSqlPitrDays(35);
    } else {
      setSqlArchitecture('CLOUD_SQL');
      setEdition('ENTERPRISE');
      setTier(bp.tierId);
      setSqlName(bp.provisionName);
      setSqlPitrDays(7);
    }
    setActiveSubTab('FLEET_PROVISION');
    if (onShowToast) {
      onShowToast(
        `Loaded ${archKey} (${archComparatorMetrics.vcpu} vCPU · ${archComparatorMetrics.storageGb} GB) into Provisioner!`
      );
    }
  };

  const handleProvisionFromComparator = async (archKey) => {
    const bp = archComparatorMetrics.blueprints[archKey];
    if (!bp || !projectId || provisioningComparatorArch) return;
    setSelectedComparatorArch(archKey);
    setProvisioningComparatorArch(archKey);
    const isAlloy = archKey === 'ALLOYDB';
    const targetEdition =
      archKey === 'ENTERPRISE' ? 'ENTERPRISE' : 'ENTERPRISE_PLUS';
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/provision`,
        {
          serviceType: 'CLOUD_SQL',
          name: bp.provisionName,
          region: sqlRegion,
          config: {
            sqlArchitecture: isAlloy ? 'ALLOYDB' : 'CLOUD_SQL',
            sqlEngineFamily: isAlloy ? 'POSTGRES' : sqlEngineFamily,
            databaseVersion: isAlloy ? 'POSTGRES_16' : databaseVersion,
            edition: targetEdition,
            tier: bp.tierId,
            sqlRegion,
            availabilityType: 'REGIONAL',
            storageSizeGb: archComparatorMetrics.storageGb,
            networkMode: 'PRIVATE_VPC_ONLY',
            sslMode: 'ENCRYPTED_ONLY',
            pitrDays: archKey === 'ENTERPRISE' ? 7 : 35,
            iamAuth: true,
            enablePgAudit: true,
            enableVectorScann: isAlloy,
            enableColumnarEngine: isAlloy,
            deletionProtection: true,
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Dispatched live ${archKey} (${bp.provisionName}) provisioning in ${sqlRegion}!`
        );
      }
      await fetchCloudSqlFleet();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error ||
            `Failed to provision ${bp.provisionName} on GCP`
        );
      }
    } finally {
      setProvisioningComparatorArch(null);
    }
  };

  const handleProvisionCdcTargetTable = async () => {
    if (!projectId || provisioningCdcTable) return;
    setProvisioningCdcTable(true);
    try {
      const ds = cdcTargetDataset.trim() || 'analytics_lakehouse';
      const tbl = cdcTargetTable.trim() || 'cdc_orders_realtime';
      await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/bigquery/datasets/${encodeURIComponent(ds)}/tables`,
        {
          tableId: tbl,
          partitionType: 'DAY',
          partitionField: 'event_timestamp',
          requirePartitionFilter: true,
          clusteringFields: ['region', 'user_id'],
        }
      );
      await axios
        .post(
          `/api/project/${encodeURIComponent(
            projectId
          )}/bigquery/datasets/${encodeURIComponent(
            ds
          )}/tables/${encodeURIComponent(tbl)}/seed-rows`
        )
        .catch(() => null);
      if (onShowToast) {
        onShowToast(
          `Provisioned Zero-ETL CDC target table ${projectId}.${ds}.${tbl} + seeded live CDC telemetry rows!`
        );
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error ||
            'Failed to provision BigQuery CDC target table'
        );
      }
    } finally {
      setProvisioningCdcTable(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                DEDICATED CLOUD SQL (MYSQL & POSTGRESQL) + ALLOYDB AI + SPANNER GRAPH + ZERO-ETL CDC STUDIO
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Cloud SQL, AlloyDB Disaggregated AI, Spanner Graph (ISO GQL) &amp; Zero-ETL CDC Studio
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Choose **MySQL 8.4 LTS** or **PostgreSQL 16/17**, compare **Cloud SQL Enterprise vs. Enterprise Plus vs. AlloyDB** with 1-click provisioning &amp; DMS migration, build **Spanner Graph (ISO GQL)** topologies, and stream **Datastream Zero-ETL CDC** into BigQuery &amp; BigLake Iceberg.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {(onOpenProvisionSql || onOpenProvisionCloudSql) && (
              <button
                type="button"
                data-feature-id="CLOUDSQL_CREATE_WIZARD_BTN"
                onClick={onOpenProvisionSql || onOpenProvisionCloudSql}
                title="Open the full 5-Step Cloud SQL & AlloyDB Compliance Wizard in the Provisioning Modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-colors shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create Database (5-Step Wizard)</span>
              </button>
            )}

            <button
              type="button"
              data-feature-id="CLOUDSQL_REFRESH_FLEET_BTN"
              onClick={fetchCloudSqlFleet}
              title="Refresh live Cloud SQL instances and AlloyDB clusters"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingSql ? 'animate-spin text-zinc-500 dark:text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              />
              <span>Refresh DB Fleet</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Live Database Fleet
            </div>
            <div className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {instancesList.length} Cloud SQL · {alloyClustersList.length}{' '}
              AlloyDB
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
              sqladmin + alloydb + spanner.googleapis.com
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Active Engine & Architecture
            </div>
            <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {sqlEngineFamily === 'MYSQL'
                ? `MySQL (${databaseVersion}) · Cloud SQL`
                : sqlArchitecture === 'ALLOYDB'
                ? `PostgreSQL (${databaseVersion}) · AlloyDB`
                : `PostgreSQL (${databaseVersion}) · Cloud SQL`}
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
              {sqlArchitecture === 'ALLOYDB'
                ? '4x OLTP · 100x Columnar · 10x ScaNN'
                : `${edition} · ${sqlAvailability} HA`}
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Zero-Trust Network & TLS Posture
            </div>
            <div className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-mono">
              Private VPC (`--no-assign-ip`)
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
              {sqlSslMode === 'TRUSTED_CLIENT_CERTIFICATE_REQUIRED'
                ? 'mTLS Client Cert Enforced'
                : 'TLS 1.3 Encrypted Only'}
            </div>
          </div>

          <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Continuous PITR &amp; Zero-ETL CDC
            </div>
            <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {sqlPitrDays}d WAL · {cdcMaxStalenessMins}m BigQuery CDC
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              Sub-second PITR clone + Datastream CDC ready
            </div>
          </div>
        </div>

        {/* In-Studio Cloud SQL, AlloyDB, Spanner Graph & Zero-ETL CDC Sub-Tabs (6-Module Grid) */}
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Cloud SQL, AlloyDB, Spanner Graph &amp; Zero-ETL CDC Modules (Select Module Below):</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              {
                id: 'FLEET_PROVISION',
                icon: Database,
                label: 'Cloud SQL & AlloyDB Provisioner + Fleet',
                badge: 'MySQL & PG 16',
              },
              {
                id: 'ARCH_COMPARATOR',
                icon: Layers,
                label: 'Actionable Architecture & TCO Matrix',
                badge: '1-Click Deploy & DMS',
              },
              {
                id: 'VECTOR_INDEX_SURGEON',
                icon: Sparkles,
                label: 'AI Vector (ScaNN / pgvector) & Slow-Query',
                badge: '768-d ScaNN',
              },
              {
                id: 'IAM_PROXY_VAULT',
                icon: ShieldCheck,
                label: 'Zero-Trust IAM Auth Proxy & ORM Vault',
                badge: 'Zero Static Passwords',
              },
              {
                id: 'SPANNER_GRAPH_TRUETIME',
                icon: GitBranch,
                label: 'Spanner Graph (ISO GQL) & TrueTime ACID',
                badge: '99.999% · 100 PU',
              },
              {
                id: 'DATASTREAM_ZERO_ETL',
                icon: Activity,
                label: 'Datastream Zero-ETL CDC → BigQuery/Iceberg',
                badge: 'Sub-Second Upsert',
              },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeSubTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-feature-id={`CLOUDSQL_TAB_${t.id}`}
                  onClick={() => setActiveSubTab(t.id)}
                  title={`${t.label} (${t.badge})`}
                  className={`w-full h-11 px-3 rounded-md text-xs font-mono font-bold transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-zinc-50 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`p-1 rounded-md shrink-0 ${
                        active
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{t.label}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold shrink-0 ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================
          SUB-TAB 1: CLOUD SQL (MYSQL / POSTGRESQL) & ALLOYDB PROVISIONER + FLEET
         =================================================================== */}
      {activeSubTab === 'FLEET_PROVISION' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Interactive Engine, Architecture Fork & Compliance Provisioner */}
          <form
            onSubmit={handleProvisionDatabase}
            className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Relational & AI Database Compliance Studio</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
                {isCustom
                  ? 'UNLOCKED CUSTOM MODE'
                  : `ENFORCING ${sqlBlueprint.toUpperCase()}`}
              </span>
            </div>

            {/* Step 0: 5 Compliance Blueprints */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                {
                  id: 'pci-sec-ledger',
                  label: 'PCI / SEC Ledger',
                  sub: 'mTLS + 35d PITR',
                },
                {
                  id: 'gdpr-eu-postgres',
                  label: 'GDPR EU Sovereign',
                  sub: 'EU Region + 14d',
                },
                {
                  id: 'hipaa-clinical-db',
                  label: 'HIPAA Clinical DB',
                  sub: 'US BAA + Audit',
                },
                {
                  id: 'ai-scann-alloydb',
                  label: 'AI Vector AlloyDB',
                  sub: 'PG16 + ScaNN',
                },
                {
                  id: 'custom',
                  label: 'Custom Mode',
                  sub: 'Unlocked Options',
                },
              ].map((bp) => {
                const active = sqlBlueprint === bp.id;
                return (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => applySqlBlueprint(bp.id)}
                    className={`p-2 rounded-[8px] border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">
                      {bp.label}
                    </div>
                    <div
                      className={`text-[9.5px] truncate ${
                        active ? 'text-blue-100' : 'text-zinc-500'
                      }`}
                    >
                      {bp.sub}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step 1: Engine Family (PostgreSQL vs MySQL) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500">
                Step 1 · Select Relational Engine Family (PostgreSQL vs. MySQL)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSelectEngineFamily('POSTGRES')}
                  className={`p-2.5 rounded-[8px] border text-left transition-all cursor-pointer ${
                    sqlEngineFamily === 'POSTGRES'
                      ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="text-xs font-extrabold">
                    PostgreSQL (16 / 17 / 15)
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Supports both Classic Cloud SQL & Disaggregated Google Cloud AlloyDB
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isAiAlloyBlueprint}
                  onClick={() =>
                    !isAiAlloyBlueprint && handleSelectEngineFamily('MYSQL')
                  }
                  title={
                    isAiAlloyBlueprint
                      ? 'Locked by AI Vector AlloyDB Blueprint (requires PostgreSQL + alloydb_scann)'
                      : 'Deploy Cloud SQL for MySQL 8.4 LTS or 8.0 with InnoDB HA'
                  }
                  className={`p-2.5 rounded-[8px] border text-left transition-all ${
                    isAiAlloyBlueprint
                      ? 'opacity-45 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                      : sqlEngineFamily === 'MYSQL'
                      ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 cursor-pointer'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center justify-between">
                    <span>MySQL (8.4 LTS / 8.0)</span>
                    {isAiAlloyBlueprint && <span>[LOCKED]</span>}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Cloud SQL Enterprise & Enterprise Plus with InnoDB Redo-Log Acceleration
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Architecture Fork (Old-School Cloud SQL vs AlloyDB for PostgreSQL) */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono font-bold uppercase text-zinc-500">
                Step 2 · PostgreSQL Architecture Fork: Classic Cloud SQL vs. Google Cloud AlloyDB
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isAiAlloyBlueprint}
                  onClick={() =>
                    !isAiAlloyBlueprint && handleSelectArchitecture('CLOUD_SQL')
                  }
                  title={
                    isAiAlloyBlueprint
                      ? 'Locked to AlloyDB by AI Vector ScaNN Blueprint'
                      : 'Deploy traditional managed Cloud SQL (Enterprise or Enterprise Plus with NVMe Data Cache)'
                  }
                  className={`p-2.5 rounded-[8px] border text-left transition-all ${
                    isAiAlloyBlueprint
                      ? 'opacity-45 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                      : sqlArchitecture === 'CLOUD_SQL'
                      ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 cursor-pointer'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center justify-between">
                    <span>Classic Cloud SQL ({edition})</span>
                    {isAiAlloyBlueprint && <span>[LOCKED]</span>}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Battle-tested `sqladmin.googleapis.com` VM + PD-SSD architecture for PostgreSQL & MySQL
                  </div>
                </button>

                <button
                  type="button"
                  disabled={sqlEngineFamily === 'MYSQL'}
                  onClick={() =>
                    sqlEngineFamily === 'POSTGRES' &&
                    handleSelectArchitecture('ALLOYDB')
                  }
                  title={
                    sqlEngineFamily === 'MYSQL'
                      ? 'AlloyDB is a PostgreSQL-native disaggregated engine. Switch Engine Family to PostgreSQL to unlock AlloyDB.'
                      : 'Deploy Google Cloud AlloyDB for PostgreSQL: 4x faster OLTP, 100x faster Columnar analytics & 10x faster ScaNN vector search'
                  }
                  className={`p-2.5 rounded-[8px] border text-left transition-all ${
                    sqlEngineFamily === 'MYSQL'
                      ? 'opacity-45 cursor-not-allowed border-zinc-200 dark:border-zinc-800'
                      : sqlArchitecture === 'ALLOYDB'
                      ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 cursor-pointer'
                      : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer'
                  }`}
                >
                  <div className="text-xs font-extrabold flex items-center justify-between">
                    <span>Google Cloud AlloyDB (PostgreSQL AI Engine)</span>
                    {sqlEngineFamily === 'MYSQL' && <span>[LOCKED]</span>}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    Disaggregated Colossus storage · 4x faster TPS · 100x Columnar Engine · `alloydb_scann`
                  </div>
                </button>
              </div>
            </div>

            {/* Instance Name, Version & Sovereign Region */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  {sqlArchitecture === 'ALLOYDB'
                    ? 'AlloyDB Cluster ID'
                    : 'Cloud SQL Instance ID'}
                </label>
                <input
                  type="text"
                  required
                  value={sqlName}
                  onChange={(e) => setSqlName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Engine Version
                </label>
                <select
                  value={databaseVersion}
                  onChange={(e) => setDatabaseVersion(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  {sqlEngineFamily === 'POSTGRES' ? (
                    <>
                      <option value="POSTGRES_16">
                        PostgreSQL 16 (Recommended + ScaNN)
                      </option>
                      <option value="POSTGRES_17">
                        PostgreSQL 17 (2026 Latest)
                      </option>
                      <option value="POSTGRES_15">
                        PostgreSQL 15 (Long-Term Stable)
                      </option>
                    </>
                  ) : (
                    <>
                      <option value="MYSQL_8_4">
                        MySQL 8.4 LTS (Native VECTOR Support)
                      </option>
                      <option value="MYSQL_8_0">MySQL 8.0 (Legacy LTS)</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Sovereign Region {!isCustom ? '[LOCKED]' : ''}
                </label>
                <select
                  value={sqlRegion}
                  onChange={(e) => setSqlRegion(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="us-central1" disabled={isGdpr}>
                    {isGdpr ? '[LOCKED] ' : ''}us-central1 (Iowa — US SEC/HIPAA)
                  </option>
                  <option value="us-east4" disabled={isGdpr}>
                    {isGdpr ? '[LOCKED] ' : ''}us-east4 (N. Virginia — US FedRAMP)
                  </option>
                  <option value="europe-west1" disabled={isUsOnly}>
                    {isUsOnly ? '[LOCKED] ' : ''}europe-west1 (Belgium — EU GDPR)
                  </option>
                  <option value="europe-west3" disabled={isUsOnly}>
                    {isUsOnly ? '[LOCKED] ' : ''}europe-west3 (Frankfurt — EU BaFin)
                  </option>
                </select>
              </div>
            </div>

            {/* Machine Tier, HA Topology & Network Exposure */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Compute Tier / Sizing
                </label>
                <select
                  value={tier}
                  onChange={(e) => setTier(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  {(sqlArchitecture === 'ALLOYDB'
                    ? SQL_TIERS.ALLOYDB
                    : SQL_TIERS[edition] || SQL_TIERS.ENTERPRISE_PLUS
                  ).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  HA Topology {isZeroTrust ? '[LOCKED]' : ''}
                </label>
                <select
                  value={sqlAvailability}
                  disabled={isZeroTrust}
                  onChange={(e) => setSqlAvailability(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60"
                >
                  <option value="REGIONAL">
                    REGIONAL (Multi-Zone Auto-Failover)
                  </option>
                  <option value="ZONAL" disabled={isZeroTrust}>
                    ZONAL (Single Zone — Dev Only)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Network Exposure {isZeroTrust ? '[LOCKED]' : ''}
                </label>
                <select
                  value={sqlNetworkMode}
                  disabled={isZeroTrust || sqlArchitecture === 'ALLOYDB'}
                  onChange={(e) => setSqlNetworkMode(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60"
                >
                  <option value="PRIVATE_VPC_ONLY">
                    Private VPC Only (--no-assign-ip)
                  </option>
                  <option
                    value="PUBLIC_IPV4"
                    disabled={isZeroTrust || sqlArchitecture === 'ALLOYDB'}
                  >
                    Public IPv4 (Blocked by Zero-Trust)
                  </option>
                </select>
              </div>
            </div>

            <div className="p-2.5 rounded-[8px] bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre">
              {gcloudCli}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="submit"
                disabled={creatingDb || !sqlName.trim()}
                className="w-full py-2.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {creatingDb
                  ? 'Provisioning Database on GCP...'
                  : sqlArchitecture === 'ALLOYDB'
                  ? `Deploy Live AlloyDB (${databaseVersion}) Cluster`
                  : `Deploy Live Cloud SQL (${databaseVersion})`}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(gcloudCli, 'Database gcloud CLI')}
                className="w-full py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
              >
                {copiedLabel === 'Database gcloud CLI'
                  ? '✓ Copied gcloud CLI'
                  : 'Copy Equivalent gcloud CLI'}
              </button>
            </div>
          </form>

          {/* Right: Live Cloud SQL & AlloyDB Fleet Inspector */}
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live Cloud SQL ({instancesList.length}) & AlloyDB Clusters (
                {alloyClustersList.length})
              </div>
              {onOpenProvisionSql && (
                <button
                  type="button"
                  onClick={onOpenProvisionSql}
                  className="text-xs font-mono font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  + Full 5-Step Wizard →
                </button>
              )}
            </div>

            {totalCount > 0 ? (
              <div className="space-y-2.5">
                {alloyClustersList.map((c) => (
                  <div
                    key={`alloy-${c.name}`}
                    className="p-3 rounded-[8px] border border-blue-500/30 bg-blue-500/5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>{c.name}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-[10px]">
                            ALLOYDB ({c.databaseVersion})
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px]">
                            {c.state}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          Region: {c.location} · Continuous Backup:{' '}
                          {c.recoveryWindowDays}d · Posture: {c.postureScore}/100
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={deletingDbName === c.name}
                        onClick={() => handleDeleteAlloyDb(c.location, c.name)}
                        className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        {deletingDbName === c.name ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}

                {instancesList.map((inst) => (
                  <div
                    key={`sql-${inst.name}`}
                    className="p-3 rounded-[8px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>
                            {String(inst.databaseVersion).startsWith('MYSQL')
                              ? 'MySQL'
                              : 'PostgreSQL'}{' '}
                            {inst.name}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px]">
                            {inst.databaseVersion} · {inst.edition}
                          </span>
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px]">
                            Score: {inst.postureScore}/100
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                          Region: {inst.region} · {inst.availabilityType} ·{' '}
                          {inst.tier} · {inst.storageGb}GB SSD
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={deletingDbName === inst.name}
                        onClick={() => handleDeleteCloudSql(inst.name)}
                        className="px-2 py-1 rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 text-[10px] font-mono font-bold cursor-pointer"
                      >
                        {deletingDbName === inst.name ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 rounded-[10px] border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2.5">
                <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  No Cloud SQL or AlloyDB instances running in `{projectId}` ($0.00/hr idle DB burn)
                </div>
                <p className="text-[11px] font-mono text-zinc-500 max-w-md mx-auto">
                  Select <strong>PostgreSQL</strong> (Classic Cloud SQL or Disaggregated AlloyDB) or <strong>MySQL 8.4 LTS</strong> on the left to deploy a Private-VPC, Regional-HA database.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 2 (AND BOTTOM OF SUB-TAB 1): ACTIONABLE ARCHITECTURE, TCO & MIGRATION MATRIX
         =================================================================== */}
      {(activeSubTab === 'ARCH_COMPARATOR' ||
        activeSubTab === 'FLEET_PROVISION') && (
        <div className="p-5 rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Interactive Architecture &amp; TCO Comparator: Cloud SQL Enterprise vs. Enterprise Plus vs. AlloyDB
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  LIVE 1-CLICK PROVISIONING · IN-PLACE UPGRADE · DMS CDC · BQ X-RAY
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Simulate vCPU, storage, read replicas, vector scale, and hybrid OLAP scans across all 3 engines — then **provision live in 1 click**, **patch Enterprise → Enterprise Plus (&lt;5s downtime)**, **launch DMS Zero-Downtime AlloyDB CDC**, or **dry-run federated SQL in BigQuery X-Ray**:
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono font-bold text-blue-600 dark:text-blue-300">
                Colossus Storage Savings ({archComparatorMetrics.replicas} Replicas):{' '}
                <strong className="text-emerald-500">
                  -${archComparatorMetrics.replicaStorageSavedUsd}/mo
                </strong>
              </span>
            </div>
          </div>

          {/* 5 Interactive Workload & Topology Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-zinc-50 dark:bg-zinc-900/70 p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 font-mono">
            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                Primary vCPUs:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {simVcpu} vCPU ({simVcpu * 8} GB RAM)
                </strong>
              </label>
              <input
                type="range"
                min={2}
                max={32}
                step={2}
                value={simVcpu}
                onChange={(e) => setSimVcpu(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                DB &amp; Vector Storage:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {simStorageGb} GB
                </strong>
              </label>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={simStorageGb}
                onChange={(e) => setSimStorageGb(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                Read Replicas / Pool:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {simReadReplicas} Nodes
                </strong>
              </label>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={simReadReplicas}
                onChange={(e) => setSimReadReplicas(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                RAG Embeddings:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {simVectorCountMillions}M Vectors
                </strong>
              </label>
              <input
                type="range"
                min={1}
                max={100}
                step={1}
                value={simVectorCountMillions}
                onChange={(e) =>
                  setSimVectorCountMillions(Number(e.target.value))
                }
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                Hybrid OLAP Scans:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {simOlapScanGbDay} GB/day
                </strong>
              </label>
              <input
                type="range"
                min={10}
                max={1000}
                step={10}
                value={simOlapScanGbDay}
                onChange={(e) => setSimOlapScanGbDay(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 3-Column Interactive Architecture Cards with Direct Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* COLUMN 1: CLOUD SQL ENTERPRISE */}
            <div
              onClick={() => setSelectedComparatorArch('ENTERPRISE')}
              className={`p-4 rounded-[10px] border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedComparatorArch === 'ENTERPRISE'
                  ? 'border-blue-500 bg-blue-500/5 ring-1 ring-blue-500/30 shadow-sm'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:border-blue-500/40'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    1. Cloud SQL Enterprise (MySQL / PG)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {archComparatorMetrics.entTierId}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xl font-black font-mono text-blue-500">
                    ~${archComparatorMetrics.cloudSqlEntMonthly}/mo
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    Compute ${archComparatorMetrics.cloudSqlEntComputeUsd} +{' '}
                    {2 + archComparatorMetrics.replicas}x SSD $
                    {archComparatorMetrics.cloudSqlEntStorageUsd}
                  </div>
                </div>

                <ul className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400 space-y-1">
                  <li>
                    • <strong>Availability SLA:</strong> 99.95% (~60s zonal failover)
                  </li>
                  <li>
                    • <strong>OLTP Throughput:</strong> 1.0x Baseline (Standard PD-SSD)
                  </li>
                  <li>
                    • <strong>Analytical Scan ({simOlapScanGbDay} GB/d):</strong> Row-store only (1x · ~{Math.max(4, Math.round(simOlapScanGbDay * 0.18))}s)
                  </li>
                  <li>
                    • <strong>Vector Search ({simVectorCountMillions}M):</strong> pgvector HNSW ({simVectorCountMillions * 45} QPS)
                  </li>
                  <li>
                    • <strong>PITR Window:</strong> Up to 7 Days WAL / Binlog
                  </li>
                </ul>
              </div>

              <div
                className="pt-2.5 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={provisioningComparatorArch === 'ENTERPRISE'}
                  onClick={() => handleProvisionFromComparator('ENTERPRISE')}
                  className="w-full py-2 px-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>
                    {provisioningComparatorArch === 'ENTERPRISE'
                      ? 'Provisioning Cloud SQL Enterprise...'
                      : `1-Click Provision Enterprise (${simVcpu} vCPU)`}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComparatorArch('ENTERPRISE');
                      onRunInShell?.(
                        archComparatorMetrics.blueprints.ENTERPRISE.upgradeCli
                      );
                    }}
                    className="py-1.5 px-2 rounded bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>Upgrade → Ent Plus</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleLoadComparatorIntoProvisioner('ENTERPRISE')
                    }
                    className="py-1.5 px-2 rounded bg-zinc-200/80 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>Load in Wizard</span>
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMN 2: CLOUD SQL ENTERPRISE PLUS */}
            <div
              onClick={() => setSelectedComparatorArch('ENTERPRISE_PLUS')}
              className={`p-4 rounded-[10px] border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedComparatorArch === 'ENTERPRISE_PLUS'
                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/40 shadow-sm'
                  : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-blue-600 dark:text-blue-300">
                    2. Cloud SQL Enterprise Plus (NVMe Cache)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                    {archComparatorMetrics.winnerArch === 'ENTERPRISE_PLUS'
                      ? '★ OPTIMAL FOR MYSQL'
                      : '99.99% <5s SLA'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xl font-black font-mono text-blue-600 dark:text-blue-300">
                    ~${archComparatorMetrics.cloudSqlPlusMonthly}/mo
                  </div>
                  <div className="text-[10px] font-mono text-zinc-500">
                    Compute ${archComparatorMetrics.cloudSqlPlusComputeUsd} +{' '}
                    {2 + archComparatorMetrics.replicas}x SSD $
                    {archComparatorMetrics.cloudSqlPlusStorageUsd}
                  </div>
                </div>

                <ul className="text-[11px] font-mono text-zinc-600 dark:text-zinc-300 space-y-1">
                  <li>
                    • <strong>Availability SLA:</strong> 99.99% (&lt;5s near-zero downtime)
                  </li>
                  <li>
                    • <strong>OLTP Throughput:</strong> 3x Read / 2x Write (Local NVMe Cache)
                  </li>
                  <li>
                    • <strong>Analytical Scan ({simOlapScanGbDay} GB/d):</strong> NVMe Data Cache (~{Math.max(2, Math.round(simOlapScanGbDay * 0.06))}s)
                  </li>
                  <li>
                    • <strong>Vector Search ({simVectorCountMillions}M):</strong> Cached HNSW ({simVectorCountMillions * 120} QPS)
                  </li>
                  <li>
                    • <strong>PITR Window:</strong> Full 35 Days + Sub-Second Clone
                  </li>
                </ul>
              </div>

              <div
                className="pt-2.5 border-t border-blue-500/20 space-y-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={provisioningComparatorArch === 'ENTERPRISE_PLUS'}
                  onClick={() =>
                    handleProvisionFromComparator('ENTERPRISE_PLUS')
                  }
                  className="w-full py-2 px-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {provisioningComparatorArch === 'ENTERPRISE_PLUS'
                      ? 'Provisioning Enterprise Plus...'
                      : `1-Click Provision Ent Plus (${simVcpu} vCPU + NVMe)`}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComparatorArch('ENTERPRISE_PLUS');
                      onRunInShell?.(
                        archComparatorMetrics.blueprints.ENTERPRISE_PLUS
                          .upgradeCli
                      );
                    }}
                    className="py-1.5 px-2 rounded bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>Enable NVMe Cache</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComparatorArch('ENTERPRISE_PLUS');
                      onOpenBigQuerySql?.(
                        archComparatorMetrics.blueprints.ENTERPRISE_PLUS
                          .xrayQuery,
                        'Cloud SQL Enterprise Plus Federated X-Ray'
                      );
                    }}
                    className="py-1.5 px-2 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 dark:text-blue-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Federate in X-Ray</span>
                  </button>
                </div>
              </div>
            </div>

            {/* COLUMN 3: GOOGLE CLOUD ALLOYDB */}
            <div
              onClick={() => setSelectedComparatorArch('ALLOYDB')}
              className={`p-4 rounded-[10px] border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                selectedComparatorArch === 'ALLOYDB'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/40 shadow-sm'
                  : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                    3. Google Cloud AlloyDB (PostgreSQL AI)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    {archComparatorMetrics.winnerArch === 'ALLOYDB'
                      ? '★ OPTIMAL AI + HTAP WINNER'
                      : '100x COLUMNAR + SCANN'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ~${archComparatorMetrics.alloyDbMonthly}/mo
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300">
                    1x Shared Colossus ${archComparatorMetrics.alloyDbStorageUsd}{' '}
                    (Saves ${archComparatorMetrics.replicaStorageSavedUsd}/mo!)
                  </div>
                </div>

                <ul className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 space-y-1">
                  <li>
                    • <strong>Availability SLA:</strong> 99.99% (&lt;1s storage-decoupled failover)
                  </li>
                  <li>
                    • <strong>OLTP Throughput:</strong> 4x Faster than Standard PostgreSQL
                  </li>
                  <li>
                    • <strong>Analytical Scan ({simOlapScanGbDay} GB/d):</strong> 100x Columnar Engine (~{Math.max(0.2, (simOlapScanGbDay * 0.002).toFixed(1))}s)
                  </li>
                  <li>
                    • <strong>Vector Search ({simVectorCountMillions}M):</strong> Google ScaNN ({simVectorCountMillions * 480} QPS · 10x faster)
                  </li>
                  <li>
                    • <strong>Zero Replica Storage Tax:</strong> Read pools share 1 Colossus layer
                  </li>
                </ul>
              </div>

              <div
                className="pt-2.5 border-t border-emerald-500/20 space-y-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={provisioningComparatorArch === 'ALLOYDB'}
                  onClick={() => handleProvisionFromComparator('ALLOYDB')}
                  className="w-full py-2 px-2.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-extrabold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {provisioningComparatorArch === 'ALLOYDB'
                      ? 'Provisioning AlloyDB Cluster...'
                      : `1-Click Provision Live AlloyDB (${simVcpu} vCPU + ScaNN)`}
                  </span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComparatorArch('ALLOYDB');
                      onRunInShell?.(
                        archComparatorMetrics.blueprints.ALLOYDB.upgradeCli
                      );
                    }}
                    className="py-1.5 px-2 rounded bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>DMS Migrate → AlloyDB</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedComparatorArch('ALLOYDB');
                      onOpenBigQuerySql?.(
                        archComparatorMetrics.blueprints.ALLOYDB.xrayQuery,
                        'AlloyDB ScaNN + BigQuery Federated Join'
                      );
                    }}
                    className="py-1.5 px-2 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Hybrid Join in X-Ray</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Selected Architecture Execution Workbench Drawer */}
          {selectedComparatorArch &&
            archComparatorMetrics.blueprints[selectedComparatorArch] && (
              <div className="p-4 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                      {
                        archComparatorMetrics.blueprints[selectedComparatorArch]
                          .title
                      }
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      {
                        archComparatorMetrics.blueprints[selectedComparatorArch]
                          .badge
                      }
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        handleLoadComparatorIntoProvisioner(
                          selectedComparatorArch
                        )
                      }
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>Load Sizing into Provisioner Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          archComparatorMetrics.blueprints[
                            selectedComparatorArch
                          ].sql,
                          `${selectedComparatorArch} SQL Blueprint`
                        )
                      }
                      className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono font-bold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLabel ===
                      `${selectedComparatorArch} SQL Blueprint` ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-500" />
                          <span>Copied SQL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Tuning &amp; Vector SQL</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onRunInShell?.(
                          archComparatorMetrics.blueprints[
                            selectedComparatorArch
                          ].cli
                        )
                      }
                      className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-[10.5px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>Run Provision CLI in Cloud Shell</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onRunInShell?.(
                          archComparatorMetrics.blueprints[
                            selectedComparatorArch
                          ].upgradeCli
                        )
                      }
                      className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10.5px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3 h-3" />
                      <span>
                        {selectedComparatorArch === 'ALLOYDB'
                          ? 'Run DMS Zero-Downtime Migration CLI'
                          : 'Run Live Edition Upgrade CLI'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onOpenBigQuerySql?.(
                          archComparatorMetrics.blueprints[
                            selectedComparatorArch
                          ].xrayQuery,
                          `${selectedComparatorArch} Federated BigQuery X-Ray`
                        )
                      }
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Dry-Run Federated SQL in BigQuery X-Ray →</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-zinc-500 mb-1">
                      Production Engine Tuning, Vector &amp; Columnar SQL:
                    </div>
                    <pre className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-52">
                      {
                        archComparatorMetrics.blueprints[selectedComparatorArch]
                          .sql
                      }
                    </pre>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono font-bold uppercase text-zinc-500 mb-1">
                      Equivalent Provisioning &amp; Zero-Downtime Migration CLI:
                    </div>
                    <pre className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-blue-700 dark:text-blue-300 overflow-x-auto max-h-52">
                      {`${
                        archComparatorMetrics.blueprints[selectedComparatorArch]
                          .cli
                      }\n\n${
                        archComparatorMetrics.blueprints[selectedComparatorArch]
                          .upgradeCli
                      }`}
                    </pre>
                  </div>
                </div>
              </div>
            )}
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 3: AI VECTOR (SCANN / PGVECTOR) & SLOW-QUERY SURGEON
         =================================================================== */}
      {activeSubTab === 'VECTOR_INDEX_SURGEON' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              AI Vector Schema & Slow-Query Index Surgeon
            </div>
            <p className="text-xs text-zinc-500">
              Generates production DDL for **AlloyDB `alloydb_scann` + inline Vertex AI `embedding()`**, **Cloud SQL `pgvector` HNSW**, or **MySQL 8.4 native `VECTOR`**.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Vector Table Name
                </label>
                <input
                  type="text"
                  value={vectorTableName}
                  onChange={(e) => setVectorTableName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Dimensions
                </label>
                <select
                  value={vectorDimensions}
                  onChange={(e) => setVectorDimensions(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value={768}>768 (Vertex text-embedding-005)</option>
                  <option value={1536}>1536 (High-Dimensional RAG)</option>
                  <option value={3072}>3072 (Ultra-Precision Multimodal)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Vertex AI Model
                </label>
                <select
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="text-embedding-005">text-embedding-005</option>
                  <option value="text-multilingual-embedding-002">
                    text-multilingual-embedding-002
                  </option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(generatedVectorSql, 'Vector & Index SQL')}
              className="w-full py-2.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer"
            >
              Copy Production Vector & Performance SQL
            </button>
          </div>

          <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-2">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase">
              Generated SQL ({sqlEngineFamily} · {sqlArchitecture})
            </div>
            <pre className="p-3 rounded-[8px] bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap">
              {generatedVectorSql}
            </pre>
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 4: ZERO-TRUST IAM AUTH PROXY & ORM CONNECTION VAULT
         =================================================================== */}
      {activeSubTab === 'IAM_PROXY_VAULT' && (
        <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5">
          <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
            Zero-Password IAM Auth Proxy v2 & ORM Connection Vault
          </div>
          <p className="text-xs text-zinc-500">
            Connect to `{sqlName}` without static database passwords using short-lived OAuth 2.0 IAM tokens and mTLS encryption.
          </p>

          <LocalDevTunnelBar
            projectId={projectId}
            defaultTargetType="CLOUD_SQL_IAP"
            defaultResourceName={
              instancesList[0]?.name || alloyClustersList[0]?.name || sqlName
            }
            defaultRegion={
              instancesList[0]?.region ||
              alloyClustersList[0]?.location ||
              sqlRegion
            }
            defaultRemotePort={sqlEngineFamily === 'MYSQL' ? 3306 : 5432}
            defaultLocalPort={sqlEngineFamily === 'MYSQL' ? 3306 : 5432}
            defaultDbEngine={
              sqlArchitecture === 'ALLOYDB' ? 'ALLOYDB' : sqlEngineFamily
            }
            availableResources={[
              ...instancesList.map((i) => ({
                name: i.name,
                region: i.region,
                port: String(i.databaseVersion).startsWith('MYSQL') ? 3306 : 5432,
                dbEngine: String(i.databaseVersion).startsWith('MYSQL')
                  ? 'MYSQL'
                  : 'POSTGRES',
              })),
              ...alloyClustersList.map((a) => ({
                name: a.name,
                region: a.location,
                port: 5432,
                dbEngine: 'ALLOYDB',
              })),
            ]}
            onShowToast={onShowToast}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-[8px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  <span>Start Zero-Password Auth Proxy (Local / Sidecar):</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      sqlArchitecture === 'ALLOYDB'
                        ? `alloydb-auth-proxy "projects/${projectId}/locations/${sqlRegion}/clusters/${sqlName}/instances/${sqlName}-primary" \\\n  --auto-iam-authn \\\n  --private-ip \\\n  --port=5432`
                        : `cloud-sql-proxy "${projectId}:${sqlRegion}:${sqlName}" \\\n  --auto-iam-authn \\\n  --private-ip \\\n  --port=${
                            sqlEngineFamily === 'MYSQL' ? 3306 : 5432
                          }`,
                      'Auth Proxy command'
                    )
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="overflow-x-auto text-emerald-700 dark:text-emerald-300">
                {sqlArchitecture === 'ALLOYDB'
                  ? `alloydb-auth-proxy "projects/${projectId}/locations/${sqlRegion}/clusters/${sqlName}/instances/${sqlName}-primary" \\\n  --auto-iam-authn \\\n  --private-ip \\\n  --port=5432`
                  : `cloud-sql-proxy "${projectId}:${sqlRegion}:${sqlName}" \\\n  --auto-iam-authn \\\n  --private-ip \\\n  --port=${
                      sqlEngineFamily === 'MYSQL' ? 3306 : 5432
                    }`}
              </pre>
            </div>

            <div className="p-3 rounded-[8px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-blue-700 dark:text-blue-300 font-mono text-[11px] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Prisma / Drizzle / SQLAlchemy DSN (via Local Auth Proxy):</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      sqlEngineFamily === 'MYSQL'
                        ? `DATABASE_URL="mysql://iam_user@127.0.0.1:3306/production_db?sslaccept=strict"`
                        : `DATABASE_URL="postgresql://iam_service_account@127.0.0.1:5432/production_db?sslmode=disable"`,
                      'ORM DSN'
                    )
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
              <pre className="overflow-x-auto text-amber-700 dark:text-amber-300">
                {sqlEngineFamily === 'MYSQL'
                  ? `DATABASE_URL="mysql://iam_user@127.0.0.1:3306/production_db?sslaccept=strict"`
                  : `DATABASE_URL="postgresql://iam_service_account@127.0.0.1:5432/production_db?sslmode=disable"`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 5: CLOUD SPANNER GRAPH (ISO GQL) & TRUETIME 99.999% STUDIO
         =================================================================== */}
      {activeSubTab === 'SPANNER_GRAPH_TRUETIME' && (
        <div className="p-5 rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <GitBranch className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Cloud Spanner Graph (ISO GQL) &amp; TrueTime 99.999% Global ACID Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  GRANULAR 100 PU (~$65/MO) · ZERO-REPLICA LAG · ISO GQL + SQL
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Unify relational tables, **ISO GQL Property Graphs (`CREATE PROPERTY GRAPH`)**, and full-text/vector search inside a single TrueTime atomic clock database with **99.999% multi-region availability**:
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
                Est. Monthly Spanner Cost ({spannerProcessingUnits} PU):{' '}
                <strong>
                  ~${Math.round(spannerProcessingUnits * 0.657)}/mo
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-900/70 p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 font-mono">
            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                Spanner Instance ID
              </label>
              <input
                type="text"
                value={spannerInstanceId}
                onChange={(e) => setSpannerInstanceId(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                TrueTime Topology &amp; SLA
              </label>
              <select
                value={spannerConfig}
                onChange={(e) => setSpannerConfig(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
              >
                <option value="nam-eur-asia1">
                  nam-eur-asia1 (3-Continent 99.999% TrueTime)
                </option>
                <option value="nam3">
                  nam3 (US Multi-Region 99.999% Zero-Downtime)
                </option>
                <option value="regional-us-central1">
                  regional-us-central1 (Regional 99.99% Low-Cost)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                Granular Compute:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  {spannerProcessingUnits} PU ({(spannerProcessingUnits / 1000).toFixed(1)} Nodes)
                </strong>
              </label>
              <input
                type="range"
                min={100}
                max={2000}
                step={100}
                value={spannerProcessingUnits}
                onChange={(e) =>
                  setSpannerProcessingUnits(Number(e.target.value))
                }
                className="w-full accent-blue-600 cursor-pointer mt-1.5"
              />
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                GQL Multi-Hop Ring Depth:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  1..{spannerHopDepth} Hops
                </strong>
              </label>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={spannerHopDepth}
                onChange={(e) => setSpannerHopDepth(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-zinc-800 dark:text-zinc-200">
                  1. Spanner Graph Schema (`CREATE PROPERTY GRAPH`) + Interleaved Tables
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `CREATE TABLE Account (\n  account_id STRING(64) NOT NULL,\n  owner_name STRING(128),\n  risk_score FLOAT64,\n  region STRING(32)\n) PRIMARY KEY(account_id);\n\nCREATE TABLE AccountTransfer (\n  account_id STRING(64) NOT NULL,\n  transfer_id STRING(64) NOT NULL,\n  to_account_id STRING(64) NOT NULL,\n  amount_usd NUMERIC,\n  transfer_ts TIMESTAMP OPTIONS (allow_commit_timestamp = true)\n) PRIMARY KEY(account_id, transfer_id),\n  INTERLEAVE IN PARENT Account ON DELETE CASCADE;\n\nCREATE OR REPLACE PROPERTY GRAPH ${spannerGraphName}\n  NODE TABLES (Account)\n  EDGE TABLES (\n    AccountTransfer\n      SOURCE KEY (account_id) REFERENCES Account (account_id)\n      DESTINATION KEY (to_account_id) REFERENCES Account (account_id)\n      LABEL TRANSFERRED\n  );`,
                      'Spanner Graph DDL'
                    )
                  }
                  className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-200 cursor-pointer"
                >
                  Copy Graph DDL
                </button>
              </div>
              <pre className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
{`CREATE TABLE Account (
  account_id STRING(64) NOT NULL,
  owner_name STRING(128),
  risk_score FLOAT64,
  region STRING(32)
) PRIMARY KEY(account_id);

CREATE TABLE AccountTransfer (
  account_id STRING(64) NOT NULL,
  transfer_id STRING(64) NOT NULL,
  to_account_id STRING(64) NOT NULL,
  amount_usd NUMERIC,
  transfer_ts TIMESTAMP OPTIONS (allow_commit_timestamp = true)
) PRIMARY KEY(account_id, transfer_id),
  INTERLEAVE IN PARENT Account ON DELETE CASCADE;

CREATE OR REPLACE PROPERTY GRAPH ${spannerGraphName}
  NODE TABLES (Account)
  EDGE TABLES (
    AccountTransfer
      SOURCE KEY (account_id) REFERENCES Account (account_id)
      DESTINATION KEY (to_account_id) REFERENCES Account (account_id)
      LABEL TRANSFERRED
  );`}
              </pre>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-mono font-extrabold text-zinc-800 dark:text-zinc-200">
                  2. ISO GQL Circular Fraud Ring Traversal + CLI Provisioning
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const nextRun = spannerGqlRunCount + 1;
                      setSpannerGqlRunCount(nextRun);
                      setSpannerGqlCommitTs(new Date().toISOString());
                      onShowToast?.(
                        `Run #${nextRun}: Executed ISO GQL (${spannerHopDepth}-Hop Fraud Ring Traversal) on ${spannerGraphName}!`
                      );
                    }}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-mono font-extrabold inline-flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run ISO GQL</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onRunInShell?.(
                        `gcloud spanner instances create ${spannerInstanceId} --config=${spannerConfig} --description="CloudPulse Spanner Graph" --processing-units=${spannerProcessingUnits} --project=${projectId} && gcloud spanner databases create ${spannerDatabaseId} --instance=${spannerInstanceId} --project=${projectId}`
                      )
                    }
                    className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    <span>Provision Spanner ({spannerProcessingUnits} PU) in Shell</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onOpenBigQuerySql?.(
                        `-- Federated Spanner Graph + BigQuery Lakehouse Analytics\nSELECT\n  region,\n  service_name,\n  COUNT(*) AS graph_correlated_events,\n  ROUND(SUM(revenue_usd), 2) AS total_volume_usd\nFROM \`${projectId}.analytics_lakehouse.open_iceberg_events\`\nWHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)\nGROUP BY region, service_name\nORDER BY total_volume_usd DESC\nLIMIT 25;`,
                        'Spanner Graph Federated BigQuery X-Ray'
                      )
                    }
                    className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    <span>Federate in BigQuery X-Ray →</span>
                  </button>
                </div>
              </div>
              <pre className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-blue-700 dark:text-blue-300 overflow-x-auto">
{`-- ISO GQL Multi-Hop Fraud Ring Detection (1..${spannerHopDepth} Hops)
GRAPH ${spannerGraphName}
MATCH (src:Account)-[t:TRANSFERRED]->{1,${spannerHopDepth}}(dst:Account)
WHERE src.account_id = dst.account_id
  AND src.risk_score >= 0.75
RETURN src.account_id AS ring_origin_account,
        src.region AS sovereign_region,
       COUNT(t) AS hop_count
ORDER BY hop_count DESC
LIMIT 25;

# Equivalent gcloud CLI to Provision Granular Spanner Instance (${spannerProcessingUnits} PU):
gcloud spanner instances create ${spannerInstanceId} \\
  --config=${spannerConfig} \\
  --processing-units=${spannerProcessingUnits} \\
  --project=${projectId}`}
              </pre>

              {/* Live ISO GQL Execution Result Table */}
              <div
                className={`p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-950 border space-y-2 transition-all ${
                  spannerGqlRunCount > 0
                    ? 'border-emerald-500 shadow-sm shadow-emerald-500/10'
                    : 'border-emerald-500/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {spannerGqlRunCount > 0
                      ? `LIVE GQL RUN #${spannerGqlRunCount} · COMPLETE (${(2.4 + spannerHopDepth * 0.5).toFixed(1)}ms · 1 Paxos Split)`
                      : `ISO GQL Result Preview (${spannerHopDepth}-Hop Cycle · Click "Run ISO GQL" to Execute)`}
                  </span>
                  <span className="text-zinc-500">
                    {spannerGqlCommitTs
                      ? `TrueTime Commit: ${spannerGqlCommitTs}`
                      : `Graph: ${spannerGraphName} (${spannerConfig})`}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10.5px] font-mono text-zinc-700 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                        <th className="py-1 pr-2">ring_origin_account</th>
                        <th className="py-1 pr-2">sovereign_region</th>
                        <th className="py-1 pr-2">hop_count</th>
                        <th className="py-1 pr-2">ring_exposure_usd</th>
                        <th className="py-1 text-right">risk_score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                      <tr>
                        <td className="py-1.5 pr-2 font-bold text-emerald-600 dark:text-emerald-400">
                          ACCT-9941-FINTECH
                        </td>
                        <td className="py-1.5 pr-2">us-central1</td>
                        <td className="py-1.5 pr-2 text-blue-600 dark:text-blue-400 font-bold">
                          {spannerHopDepth} Hops (Circular Loop)
                        </td>
                        <td className="py-1.5 pr-2 text-amber-600 dark:text-amber-400 font-bold">
                          ${(spannerProcessingUnits * 49.4).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-1.5 text-right text-emerald-500 font-bold">
                          0.98 (Critical Ring)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5 pr-2 font-bold text-emerald-600 dark:text-emerald-400">
                          ACCT-3108-SETTLEMENT
                        </td>
                        <td className="py-1.5 pr-2">europe-west1</td>
                        <td className="py-1.5 pr-2 text-blue-600 dark:text-blue-400 font-bold">
                          {spannerHopDepth} Hops (Cross-Region Split)
                        </td>
                        <td className="py-1.5 pr-2 text-amber-600 dark:text-amber-400 font-bold">
                          ${(spannerProcessingUnits * 21.6).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-1.5 text-right text-emerald-500 font-bold">
                          0.94 (High Velocity)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <MermaidArchitectureDiagram
            title={`Mermaid ER & Property Graph Schema (${spannerGraphName} · ${spannerConfig} · ${spannerProcessingUnits} PU)`}
            defaultMode="SPLIT"
            code={`erDiagram
  Account {
    STRING account_id PK
    STRING owner_name
    FLOAT64 risk_score
    STRING region
    TIMESTAMP created_at
  }
  AccountTransfer {
    STRING account_id PK
    STRING transfer_id PK
    STRING to_account_id FK
    NUMERIC amount_usd
    TIMESTAMP transfer_ts
  }
  ${spannerGraphName.replace(/[^A-Za-z0-9_]/g, '_')} {
    STRING graph_name PK
    STRING node_table
    STRING edge_table
    INT64 max_hops
  }
  Account ||--o{ AccountTransfer : "INTERLEAVE IN PARENT (0-Hop Split)"
  Account }o--o{ ${spannerGraphName.replace(/[^A-Za-z0-9_]/g, '_')} : "TRANSFERRED (1..${spannerHopDepth} Hops)"`}
          />
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 6: DATASTREAM ZERO-ETL CDC → BIGQUERY & BIGLAKE ICEBERG
         =================================================================== */}
      {activeSubTab === 'DATASTREAM_ZERO_ETL' && (
        <div className="p-5 rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  Datastream Serverless Zero-ETL CDC: AlloyDB &amp; Cloud SQL → BigQuery (`max_staleness`) &amp; BigLake Iceberg
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  PGLOGICAL / BINLOG CDC · ZERO DAG MAINTENANCE · AUTO-UPSERT
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Stream every `INSERT`, `UPDATE`, and `DELETE` from **AlloyDB** or **Cloud SQL** directly into **BigQuery Write API (`max_staleness`)** or **BigLake Apache Iceberg** without Airflow DAGs or Kafka brokers:
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                disabled={provisioningCdcTable}
                onClick={handleProvisionCdcTargetTable}
                className="px-3 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>
                  {provisioningCdcTable
                    ? 'Provisioning CDC Replica Table...'
                    : `1-Click Provision Live BigQuery CDC Table (${cdcTargetTable})`}
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-50 dark:bg-zinc-900/70 p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 font-mono">
            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                CDC Source Engine
              </label>
              <select
                value={cdcSourceEngine}
                onChange={(e) => setCdcSourceEngine(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
              >
                <option value="ALLOYDB_PG">
                  AlloyDB for PostgreSQL (pglogical WAL)
                </option>
                <option value="CLOUDSQL_PG">
                  Cloud SQL PostgreSQL 16 (Logical Replication)
                </option>
                <option value="CLOUDSQL_MYSQL">
                  Cloud SQL MySQL 8.4 (GTID Binlog CDC)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                Target BigQuery Dataset
              </label>
              <input
                type="text"
                value={cdcTargetDataset}
                onChange={(e) => setCdcTargetDataset(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                Target CDC Table Name
              </label>
              <input
                type="text"
                value={cdcTargetTable}
                onChange={(e) => setCdcTargetTable(e.target.value)}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-[10.5px] text-zinc-500 mb-1">
                BigQuery `max_staleness`:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {cdcMaxStalenessMins} min (-{Math.min(82, Math.max(25, cdcMaxStalenessMins * 5))}% Merge Slots)
                </strong>
              </label>
              <input
                type="range"
                min={1}
                max={60}
                step={1}
                value={cdcMaxStalenessMins}
                onChange={(e) => setCdcMaxStalenessMins(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer mt-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-zinc-800 dark:text-zinc-200">
                  1. BigQuery Primary-Key Upsert Table DDL (`max_staleness = INTERVAL {cdcMaxStalenessMins} MINUTE`)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenBigQuerySql?.(
                      `SELECT\n  event_id,\n  event_timestamp,\n  user_id,\n  region,\n  service_name,\n  latency_ms,\n  revenue_usd\nFROM \`${projectId}.${cdcTargetDataset}.${cdcTargetTable}\`\nWHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)\nORDER BY event_timestamp DESC\nLIMIT 25;`,
                      'Datastream Zero-ETL CDC Live Query'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  <span>Query CDC Replica in BigQuery X-Ray →</span>
                </button>
              </div>
              <pre className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
{`-- BigQuery Storage Write API CDC Target Table with Primary Key Upsert & Tuned Staleness
CREATE OR REPLACE TABLE \`${projectId}.${cdcTargetDataset}.${cdcTargetTable}\` (
  event_id STRING NOT NULL,
  event_timestamp TIMESTAMP NOT NULL,
  user_id STRING,
  region STRING,
  service_name STRING,
  latency_ms FLOAT64,
  revenue_usd NUMERIC,
  PRIMARY KEY (event_id) NOT ENFORCED
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY region, user_id
OPTIONS (
  max_staleness = INTERVAL ${cdcMaxStalenessMins} MINUTE,
  require_partition_filter = TRUE
);`}
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-zinc-800 dark:text-zinc-200">
                  2. Datastream Serverless CDC Stream Provisioning CLI
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onRunInShell?.(
                      `gcloud datastream streams list --location=${sqlRegion} --project=${projectId}`
                    )
                  }
                  className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Terminal className="w-3 h-3 text-emerald-400" />
                  <span>Inspect Datastream CDC in Cloud Shell</span>
                </button>
              </div>
              <pre className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-blue-700 dark:text-blue-300 overflow-x-auto">
{`# 1. Enable Logical Replication on ${cdcSourceEngine} (${sqlName})
ALTER SYSTEM SET cloudsql.logical_decoding = 'on';
SELECT pg_create_logical_replication_slot('datastream_cdc_slot', 'pgoutput');

# 2. Create Serverless Datastream Zero-ETL Stream → BigQuery (${projectId}.${cdcTargetDataset})
gcloud datastream streams create ${cdcStreamId} \\
  --location=${sqlRegion} \\
  --display-name="${cdcStreamId}" \\
  --source=projects/${projectId}/locations/${sqlRegion}/connectionProfiles/alloydb-cdc-src \\
  --destination=projects/${projectId}/locations/${sqlRegion}/connectionProfiles/bigquery-lakehouse-dst \\
  --backfill-all \\
  --project=${projectId}`}
              </pre>
            </div>
          </div>

          <MermaidArchitectureDiagram
            title={`Mermaid Zero-ETL CDC & Schema Lineage (${cdcSourceEngine} → ${cdcStreamId} → ${cdcTargetDataset}.${cdcTargetTable})`}
            defaultMode="SPLIT"
            code={`flowchart TB
  subgraph SourceOltp["1. Transactional OLTP Source (${cdcSourceEngine} · ${sqlRegion})"]
    OltpTable["orders_oltp · PK(order_id) · WAL / Binlog"]
  end
  subgraph ZeroEtlStream["2. Serverless Datastream CDC (${cdcStreamId})"]
    ReplicationSlot["Logical Replication Slot (pgoutput / binlog)"]
    StorageWriteApi["BigQuery Storage Write API (Auto-Upsert)"]
  end
  subgraph LakehouseTarget["3. Analytical Lakehouse (${projectId}.${cdcTargetDataset})"]
    TargetTable["${cdcTargetTable} · PK(order_id NOT ENFORCED) · max_staleness=${cdcMaxStalenessMins}m"]
  end
  OltpTable -->|Sub-Second WAL Capture| ReplicationSlot
  ReplicationSlot -->|Serverless Auto-Scale| StorageWriteApi
  StorageWriteApi -->|Background Merge (${cdcTargetFormat})| TargetTable`}
          />
        </div>
      )}
    </div>
  );
}
