import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Database,
  ShieldCheck,
  RefreshCw,
  Copy,
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
} from 'lucide-react';
import LocalDevTunnelBar from './LocalDevTunnelBar';

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
  onRunInShell,
  onRefreshOverview,
  onShowToast,
}) {
  const [activeSubTab, setActiveSubTab] = useState('FLEET_PROVISION');
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

  // --- Sub-Tab 2: Architecture Comparator Workload Sliders ---
  const [simVcpu, setSimVcpu] = useState(4);
  const [simStorageGb, setSimStorageGb] = useState(250);
  const [simVectorCountMillions, setSimVectorCountMillions] = useState(10);

  // --- Sub-Tab 3: AI Vector & Index Surgeon State ---
  const [vectorTableName, setVectorTableName] = useState('knowledge_chunks');
  const [vectorDimensions, setVectorDimensions] = useState(768);
  const [embeddingModel, setEmbeddingModel] = useState('text-embedding-005');

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
    setDeletingDbName(instName);
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/cloud-sql/instances/${encodeURIComponent(instName)}`
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Decommissioning Cloud SQL instance ${instName}`
        );
      }
      await fetchCloudSqlFleet();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
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
    setDeletingDbName(cName);
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/alloydb/clusters/${encodeURIComponent(loc)}/${encodeURIComponent(
          cName
        )}`
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Decommissioning AlloyDB cluster ${cName}`
        );
      }
      await fetchCloudSqlFleet();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
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

  // Architecture Comparator Math
  const cloudSqlEntMonthly = Math.round(
    (simVcpu * 0.068 * 2 + (simStorageGb * 0.17) / 730) * 730
  );
  const cloudSqlPlusMonthly = Math.round(
    (simVcpu * 0.115 * 2 + (simStorageGb * 0.17) / 730) * 730
  );
  const alloyDbMonthly = Math.round(
    (simVcpu * 0.134 * 2 + (simStorageGb * 0.00041 * 730) / 730) * 730
  );

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>
                DEDICATED CLOUD SQL (MYSQL & POSTGRESQL) + GOOGLE CLOUD ALLOYDB AI VECTOR STUDIO
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              Cloud SQL (PostgreSQL & MySQL) vs. AlloyDB Disaggregated AI Database Studio
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Choose **MySQL 8.4 LTS** or **PostgreSQL 16/17**, and when deploying PostgreSQL, choose between **Classic / Enterprise Plus Cloud SQL (`sqladmin.googleapis.com`)** or **Google Cloud AlloyDB (`alloydb.googleapis.com`)** with 100x Columnar Engine, `alloydb_scann` AI vectors, and strict SEC/GDPR/HIPAA compliance locks (``).
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onOpenProvisionSql && (
              <button
                type="button"
                onClick={onOpenProvisionSql}
                title="Open the full 5-Step Cloud SQL & AlloyDB Compliance Wizard in the Provisioning Modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition-colors shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Create Database (5-Step Wizard)</span>
              </button>
            )}

            <button
              type="button"
              onClick={fetchCloudSqlFleet}
              title="Refresh live Cloud SQL instances and AlloyDB clusters"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold transition-colors cursor-pointer"
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
              sqladmin + alloydb.googleapis.com/v1
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
              Continuous PITR Recovery Window
            </div>
            <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {sqlPitrDays} Days WAL / Binlog
            </div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
              Sub-second point-in-time clone ready
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          {
            id: 'FLEET_PROVISION',
            label: '1. Cloud SQL (MySQL/PG) & AlloyDB Provisioner + Fleet',
            icon: Database,
          },
          {
            id: 'ARCH_COMPARATOR',
            label: '2. Classic Cloud SQL vs. AlloyDB Architecture Comparator',
            icon: Zap,
          },
          {
            id: 'VECTOR_INDEX_SURGEON',
            label: '3. AI Vector (ScaNN / pgvector) & Slow-Query Surgeon',
            icon: Cpu,
          },
          {
            id: 'IAM_PROXY_VAULT',
            label: '4. Zero-Trust IAM Auth Proxy & ORM Connection Vault',
            icon: Key,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveSubTab(t.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-bold border transition-all cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                  : 'bg-white dark:bg-[#16161a] text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
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
              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-mono font-bold">
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

            <div className="p-2.5 rounded-[8px] bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre">
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
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">
                            ALLOYDB ({c.databaseVersion})
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px]">
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
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 text-[10px]">
                            {inst.databaseVersion} · {inst.edition}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px]">
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
          SUB-TAB 2: CLASSIC CLOUD SQL VS. ALLOYDB ARCHITECTURE COMPARATOR
         =================================================================== */}
      {activeSubTab === 'ARCH_COMPARATOR' && (
        <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Interactive Architecture & TCO Comparator: Cloud SQL Enterprise vs. Enterprise Plus vs. AlloyDB
              </h3>
              <p className="text-xs text-zinc-500">
                Tune your target vCPU, storage, and vector dataset scale to compare performance SLAs and monthly TCO.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Primary Instance vCPUs ({simVcpu} vCPU · {simVcpu * 8} GB RAM)
              </label>
              <input
                type="range"
                min={2}
                max={32}
                step={2}
                value={simVcpu}
                onChange={(e) => setSimVcpu(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Transactional & Vector Storage ({simStorageGb} GB)
              </label>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={simStorageGb}
                onChange={(e) => setSimStorageGb(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                RAG Vector Embeddings ({simVectorCountMillions}M Vectors)
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
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 space-y-2">
              <div className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                Cloud SQL Enterprise (MySQL / PG)
              </div>
              <div className="text-lg font-black font-mono text-blue-400">
                ~${cloudSqlEntMonthly}/mo (Regional HA)
              </div>
              <ul className="text-[11px] font-mono text-zinc-500 space-y-1">
                <li>• Availability SLA: 99.95% (~60s failover)</li>
                <li>• OLTP Throughput: 1.0x Baseline</li>
                <li>• Analytical Scan: Row-store only (1x)</li>
                <li>• Vector Index: Standard HNSW ({simVectorCountMillions * 45} QPS)</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-[10px] border border-blue-500/40 bg-blue-500/5 space-y-2">
              <div className="text-xs font-extrabold text-blue-400">
                Cloud SQL Enterprise Plus (MySQL / PG)
              </div>
              <div className="text-lg font-black font-mono text-blue-300">
                ~${cloudSqlPlusMonthly}/mo (Regional HA)
              </div>
              <ul className="text-[11px] font-mono text-zinc-400 space-y-1">
                <li>• Availability SLA: 99.99% (&lt;5s near-zero downtime)</li>
                <li>• OLTP Throughput: 3x Read / 2x Write (NVMe Cache)</li>
                <li>• PITR Window: Up to 35 Days</li>
                <li>• Vector Index: HNSW in Data Cache ({simVectorCountMillions * 120} QPS)</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-[10px] border border-blue-500/50 bg-blue-500/10 space-y-2">
              <div className="text-xs font-extrabold text-blue-300">
                Google Cloud AlloyDB (PostgreSQL Only)
              </div>
              <div className="text-lg font-black font-mono text-emerald-400">
                ~${alloyDbMonthly}/mo (Colossus Storage)
              </div>
              <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
                <li>• Availability SLA: 99.99% (&lt;1s storage-decoupled failover)</li>
                <li>• OLTP Throughput: 4x Faster than Standard Postgres</li>
                <li>• Analytical Scan: 100x Faster (In-Memory Columnar Engine)</li>
                <li>• Vector Index: Google ScaNN ({simVectorCountMillions * 480} QPS · 10x faster)</li>
              </ul>
            </div>
          </div>
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
            <pre className="p-3 rounded-[8px] bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto whitespace-pre-wrap">
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
            onShowToast={onTriggerToast}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-[8px] bg-zinc-950 text-blue-300 font-mono text-[11px] space-y-1.5">
              <div className="text-zinc-400 font-bold">
                1. Start Zero-Password Auth Proxy (Local / Sidecar):
              </div>
              <pre className="overflow-x-auto text-emerald-300">
                {sqlArchitecture === 'ALLOYDB'
                  ? `alloydb-auth-proxy "projects/${projectId}/locations/${sqlRegion}/clusters/${sqlName}/instances/${sqlName}-primary" \\\n  --auto-iam-authn \\\n  --private-ip \\\n  --port=5432`
                  : `cloud-sql-proxy "${projectId}:${sqlRegion}:${sqlName}" \\\n  --auto-iam-authn \\\n  --private-ip \\\n  --port=${
                      sqlEngineFamily === 'MYSQL' ? 3306 : 5432
                    }`}
              </pre>
            </div>

            <div className="p-3 rounded-[8px] bg-zinc-950 text-blue-300 font-mono text-[11px] space-y-1.5">
              <div className="text-zinc-400 font-bold">
                2. Prisma / Drizzle / SQLAlchemy DSN (via Local Auth Proxy):
              </div>
              <pre className="overflow-x-auto text-amber-300">
                {sqlEngineFamily === 'MYSQL'
                  ? `DATABASE_URL="mysql://iam_user@127.0.0.1:3306/production_db?sslaccept=strict"`
                  : `DATABASE_URL="postgresql://iam_service_account@127.0.0.1:5432/production_db?sslmode=disable"`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
