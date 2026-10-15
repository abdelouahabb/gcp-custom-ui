import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Layers,
  Database,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Trash2,
  Copy,
  Check,
  Play,
  Terminal,
  Lock,
  Globe,
  HardDrive,
  FileCode,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import IcebergLakehousePlaybookMatrix from './IcebergLakehousePlaybookMatrix';

const BIGLAKE_TABS = [
  {
    id: 'METASTORE_CATALOGS',
    label: '1. BigLake Metastore & Iceberg REST Catalogs',
    badge: 'biglake.googleapis.com/v1',
  },
  {
    id: 'PROVISION_WIZARD',
    label: '2. 1-Click BigLake Connection, IAM & Iceberg Wizard',
    badge: 'Zero-Trust gs://',
  },
  {
    id: 'COMPACTION_DOCTOR',
    label: '3. Iceberg Small-File Compaction & Snapshot Doctor',
    badge: 'Z-Order & GC',
  },
  {
    id: 'RLS_CLS_OMNI',
    label: '4. Row/Column Security & Cross-Cloud Omni (S3 / Azure)',
    badge: '$0 Egress Omni',
  },
  {
    id: 'ICEBERG_50_MATRIX',
    label: '5. 50-Playbook Borderless Iceberg & Multi-Engine Matrix',
    badge: '50 Scenarios · 8 Domains',
  },
];

export default function BigLakeIcebergStudio({
  projectId,
  onRunInShell,
  onOpenBigQuerySql,
  onShowToast,
  onShowError,
}) {
  const [activeTab, setActiveTab] = useState('METASTORE_CATALOGS');
  const [copiedId, setCopiedId] = useState(null);

  // Live GCP state
  const [gcsBuckets, setGcsBuckets] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [bigLakeCatalogs, setBigLakeCatalogs] = useState([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [creatingCatalog, setCreatingCatalog] = useState(false);

  // Tab 1: Metastore Catalogs & REST Catalog state
  const [newCatalogId, setNewCatalogId] = useState('iceberg_prod_catalog');
  const [newCatalogLocation, setNewCatalogLocation] = useState('us');
  const [newCatalogDbId, setNewCatalogDbId] = useState('lakehouse_silver');
  const [credentialVendingEnabled, setCredentialVendingEnabled] = useState(true);
  const [bigLakeUseCase, setBigLakeUseCase] = useState('ICEBERG_MANAGED');

  // Tab 2: 3-Step BigLake Connection & Iceberg Provisioner state
  const [selectedDatasetId, setSelectedDatasetId] = useState('analytics_lakehouse');
  const [bigLakeBucket, setBigLakeBucket] = useState('');
  const [bigLakeFolder, setBigLakeFolder] = useState('biglake-iceberg/events_2026');
  const [bigLakeConnectionId, setBigLakeConnectionId] = useState('biglake-iceberg-conn');
  const [bigLakeLocation, setBigLakeLocation] = useState('US');
  const [bigLakeTableName, setBigLakeTableName] = useState('open_iceberg_events');
  const [bigLakeFormat, setBigLakeFormat] = useState('PARQUET');
  const [bigLakeStalenessMins, setBigLakeStalenessMins] = useState(30);

  // Tab 3: Iceberg Small-File Compaction & Snapshot Doctor state
  const [avgFileSizeMb, setAvgFileSizeMb] = useState(4); // 4MB micro-batch files
  const [totalFilesCount, setTotalFilesCount] = useState(18500);
  const [targetFileSizeMb, setTargetFileSizeMb] = useState(512);
  const [compactionStrategy, setCompactionStrategy] = useState('SORT_ZORDER');
  const [sortColumns, setSortColumns] = useState('region, user_id, event_timestamp');
  const [snapshotRetentionDays, setSnapshotRetentionDays] = useState(7);

  // Tab 4: Row/Column Security & BigLake Omni state
  const [rlsPolicyName, setRlsPolicyName] = useState('eu_sovereign_tenant_filter');
  const [rlsGrantee, setRlsGrantee] = useState('group:eu-analysts@enterprise.io');
  const [rlsFilterExpression, setRlsFilterExpression] = useState(
    "region = 'EU' AND SESSION_USER() LIKE '%@%'"
  );
  const [omniCloud, setOmniCloud] = useState('AWS_S3'); // 'AWS_S3' | 'AZURE_BLOB'
  const [omniRegion, setOmniRegion] = useState('aws-us-east-1');
  const [omniUri, setOmniUri] = useState('s3://enterprise-aws-datalake/iceberg/orders');
  const [omniRoleId, setOmniRoleId] = useState(
    'arn:aws:iam::123456789012:role/BigLakeOmniReadRole'
  );

  const copyText = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const fetchBigLakeCatalogs = useCallback(async () => {
    if (!projectId) return;
    setLoadingCatalogs(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/biglake/metastore/catalogs`
      );
      setBigLakeCatalogs(res.data?.catalogs || []);
    } catch {
      // ignore fallback
    } finally {
      setLoadingCatalogs(false);
    }
  }, [projectId]);

  const fetchBucketsAndDatasets = useCallback(async () => {
    if (!projectId) return;
    try {
      const [bRes, dRes] = await Promise.all([
        axios
          .get(`/api/project/${encodeURIComponent(projectId)}/storage/buckets`)
          .catch(() => ({ data: { buckets: [] } })),
        axios
          .get(`/api/project/${encodeURIComponent(projectId)}/bigquery/datasets`)
          .catch(() => ({ data: { datasets: [] } })),
      ]);
      const bList = bRes.data?.buckets || [];
      setGcsBuckets(bList);
      if (bList.length > 0 && !bigLakeBucket) {
        setBigLakeBucket(bList[0].name);
      } else if (!bigLakeBucket) {
        setBigLakeBucket(`${projectId}-biglake-iceberg`);
      }

      const dList = dRes.data?.datasets || [];
      setDatasets(dList);
      if (dList.length > 0 && dList[0].datasetId) {
        setSelectedDatasetId(dList[0].datasetId);
      }
    } catch {
      if (!bigLakeBucket) {
        setBigLakeBucket(`${projectId}-biglake-iceberg`);
      }
    }
  }, [projectId, bigLakeBucket]);

  useEffect(() => {
    fetchBigLakeCatalogs();
    fetchBucketsAndDatasets();
  }, [fetchBigLakeCatalogs, fetchBucketsAndDatasets]);

  const handleCreateBigLakeCatalog = async (e) => {
    e?.preventDefault();
    if (!projectId || !newCatalogId.trim()) return;
    setCreatingCatalog(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/biglake/metastore/catalogs`,
        {
          catalogId: newCatalogId.trim(),
          location: newCatalogLocation,
          databaseId: newCatalogDbId.trim() || 'lakehouse_silver',
          gcsBucketUri: `gs://${bigLakeBucket || `${projectId}-biglake-iceberg`}`,
        }
      );
      onShowToast?.(res.data?.message || 'BigLake Metastore Catalog created!');
      await fetchBigLakeCatalogs();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to create BigLake Metastore Catalog.'
      );
    } finally {
      setCreatingCatalog(false);
    }
  };

  const handleDeleteBigLakeCatalog = async (location, catalogId) => {
    if (!projectId) return;
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/biglake/metastore/catalogs/${encodeURIComponent(
          location
        )}/${encodeURIComponent(catalogId)}`
      );
      onShowToast?.(res.data?.message || `Deleted catalog ${catalogId}`);
      await fetchBigLakeCatalogs();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Failed to delete catalog.'
      );
    }
  };

  // Tab 2: BigLake Provisioner Artifacts
  const bigLakeArtifacts = useMemo(() => {
    const ds = selectedDatasetId || 'analytics_lakehouse';
    const bkt = (bigLakeBucket || `${projectId}-open-lakehouse`).replace(
      /^gs:\/\//,
      ''
    );
    const cleanFolder = (
      bigLakeFolder || 'biglake-iceberg/events_2026'
    ).replace(/^\/+|\/+$/g, '');
    const connId = bigLakeConnectionId || 'biglake-iceberg-conn';
    const loc = (bigLakeLocation || 'US').toLowerCase();
    const tbl = bigLakeTableName || 'open_iceberg_events';
    const fullConn = `${projectId}.${loc}.${connId}`;

    const step1ConnectionCli = `# Step 1: Create a BigLake Cloud Resource Connection (delegated Zero-Trust identity)
bq mk --connection \\
  --connection_type=CLOUD_RESOURCE \\
  --project_id=${projectId} \\
  --location=${bigLakeLocation} \\
  ${connId}

# Inspect the generated BigLake Connection Service Account email:
bq show --format=prettyjson --connection ${projectId}.${bigLakeLocation}.${connId}`;

    const step2BucketIamCli = `# Step 2: Grant ONLY the BigLake Connection Service Account access to gs://${bkt}
# (Human SQL analysts NEVER need raw gs:// bucket permissions!)
CONN_SA=$(bq show --format=json --connection ${projectId}.${bigLakeLocation}.${connId} | jq -r '.cloudResource.serviceAccountId')

gcloud storage buckets add-iam-policy-binding gs://${bkt} \\
  --member="serviceAccount:\${CONN_SA}" \\
  --role="${
    bigLakeUseCase === 'ICEBERG_MANAGED'
      ? 'roles/storage.objectAdmin'
      : 'roles/storage.objectViewer'
  }"`;

    const icebergManagedDdl = `-- BigLake Managed Table for Apache Iceberg (2026 Flagship Open Lakehouse)
-- Stores open Parquet + Iceberg metadata directly in gs://${bkt}/${cleanFolder}
-- Supports full ACID INSERT/UPDATE/DELETE/MERGE, Time-Travel, and Zero-Copy Spark/Vertex AI access!
CREATE OR REPLACE TABLE \`${projectId}.${ds}.${tbl}\` (
  event_id STRING,
  event_timestamp TIMESTAMP,
  user_id STRING,
  region STRING,
  revenue_usd NUMERIC
)
CLUSTER BY region, user_id
WITH CONNECTION \`${fullConn}\`
OPTIONS (
  file_format = 'PARQUET',
  table_format = 'ICEBERG',
  storage_uri = 'gs://${bkt}/${cleanFolder}'
);`;

    const bigLakeExternalDdl = `-- BigLake External Table over Existing Open Files in gs://${bkt}/${cleanFolder}
-- Adds Metadata Caching (up to 4x faster object listing) + Row/Column Security over raw GCS files
CREATE OR REPLACE EXTERNAL TABLE \`${projectId}.${ds}.${tbl}\`
WITH CONNECTION \`${fullConn}\`
OPTIONS (
  format = '${bigLakeFormat}',
  uris = ['gs://${bkt}/${cleanFolder}/*'],
  max_staleness = INTERVAL ${bigLakeStalenessMins} MINUTE,
  metadata_cache_mode = 'AUTOMATIC'
);`;

    const sparkReadSnippet = `# Zero-Copy Multi-Engine Read: Query the exact same gs://${bkt}/${cleanFolder} Iceberg table from PySpark!
from pyspark.sql import SparkSession

spark = SparkSession.builder \\
  .appName("biglake-iceberg-zero-copy") \\
  .config("spark.sql.catalog.biglake", "org.apache.iceberg.spark.SparkCatalog") \\
  .config("spark.sql.catalog.biglake.type", "rest") \\
  .config("spark.sql.catalog.biglake.uri", "https://biglake.googleapis.com/iceberg/v1beta/restcatalog") \\
  .config("spark.sql.catalog.biglake.warehouse", "gs://${bkt}/${cleanFolder}") \\
  .getOrCreate()

df = spark.read.table("biglake.${ds}.${tbl}")
df.groupBy("region").sum("revenue_usd").show()`;

    return {
      ds,
      bkt,
      cleanFolder,
      connId,
      fullConn,
      tbl,
      step1ConnectionCli,
      step2BucketIamCli,
      primaryDdl:
        bigLakeUseCase === 'ICEBERG_MANAGED'
          ? icebergManagedDdl
          : bigLakeExternalDdl,
      sparkReadSnippet,
    };
  }, [
    projectId,
    selectedDatasetId,
    bigLakeBucket,
    bigLakeFolder,
    bigLakeConnectionId,
    bigLakeLocation,
    bigLakeTableName,
    bigLakeFormat,
    bigLakeStalenessMins,
    bigLakeUseCase,
  ]);

  // Tab 3: Iceberg Compaction & Snapshot Expiration Math & SQL
  const compactionArtifacts = useMemo(() => {
    const totalDataGb = (avgFileSizeMb * totalFilesCount) / 1024;
    const compactedFilesCount = Math.max(
      1,
      Math.ceil((avgFileSizeMb * totalFilesCount) / targetFileSizeMb)
    );
    const fileReductionPct = Math.min(
      99.5,
      Math.round((1 - compactedFilesCount / Math.max(1, totalFilesCount)) * 100)
    );
    const estScanSpeedup =
      avgFileSizeMb <= 16 ? '6.4x Faster Scan' : '2.3x Faster Scan';

    const bqExportMetadataSql = `-- 1. Export Latest Iceberg v2 Metadata Snapshot for External Spark / Trino Readers
EXPORT TABLE METADATA FROM \`${projectId}.${bigLakeArtifacts.ds}.${bigLakeArtifacts.tbl}\`;`;

    const sparkCompactionSql = `-- 2. Apache Iceberg Bin-Pack / Sort Compaction & Snapshot Expiration Procedure
-- Rewrites ${totalFilesCount.toLocaleString()} small (${avgFileSizeMb} MB) Parquet files into ${compactedFilesCount.toLocaleString()} optimal (${targetFileSizeMb} MB) files
CALL biglake.system.rewrite_data_files(
  table => '${bigLakeArtifacts.ds}.${bigLakeArtifacts.tbl}',
  strategy => '${compactionStrategy === 'SORT_ZORDER' ? 'sort' : 'binpack'}',${
      compactionStrategy === 'SORT_ZORDER'
        ? `\n  sort_order => '${sortColumns}',`
        : ''
    }
  options => map(
    'target-file-size-bytes', '${targetFileSizeMb * 1048576}',
    'min-input-files', '5',
    'rewrite-all', 'false'
  )
);

-- 3. Expire Old Snapshots (> ${snapshotRetentionDays} days) & Clean Up Orphan GCS Parquet Files
CALL biglake.system.expire_snapshots(
  table => '${bigLakeArtifacts.ds}.${bigLakeArtifacts.tbl}',
  older_than => TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${snapshotRetentionDays} DAY),
  retain_last => 5
);

CALL biglake.system.remove_orphan_files(
  table => '${bigLakeArtifacts.ds}.${bigLakeArtifacts.tbl}'
);`;

    return {
      totalDataGb: totalDataGb.toFixed(2),
      compactedFilesCount,
      fileReductionPct,
      estScanSpeedup,
      bqExportMetadataSql,
      sparkCompactionSql,
    };
  }, [
    projectId,
    avgFileSizeMb,
    totalFilesCount,
    targetFileSizeMb,
    compactionStrategy,
    sortColumns,
    snapshotRetentionDays,
    bigLakeArtifacts,
  ]);

  // Tab 4: Row/Column Governance & Cross-Cloud BigLake Omni Artifacts
  const omniAndGovernanceArtifacts = useMemo(() => {
    const rlsDdl = `-- 1. BigLake Row-Level Security Policy over Open gs://${bigLakeArtifacts.bkt} Parquet Files
CREATE OR REPLACE ROW ACCESS POLICY ${rlsPolicyName}
ON \`${projectId}.${bigLakeArtifacts.ds}.${bigLakeArtifacts.tbl}\`
GRANT TO ('${rlsGrantee}')
FILTER USING (${rlsFilterExpression});

-- 2. Column-Level Dynamic Data Masking (SHA-256 Hash PII Columns for Non-Privileged Readers)
CREATE OR REPLACE DATA POLICY pii_email_sha256_mask
OPTIONS (
  data_policy_type = 'DATA_MASKING_POLICY',
  masking_expression = 'SHA256'
);`;

    const omniCliAndDdl =
      omniCloud === 'AWS_S3'
        ? `# Step 1: Create BigLake Omni Cross-Cloud AWS S3 Connection (${omniRegion})
bq mk --connection \\
  --connection_type=AWS \\
  --iam_role_id="${omniRoleId}" \\
  --location=${omniRegion} \\
  biglake-aws-s3-omni

# Step 2: Create BigLake Iceberg Table over AWS S3 ($0.00 Cross-Cloud Egress)
CREATE EXTERNAL TABLE \`${projectId}.omni_aws_dataset.s3_orders_iceberg\`
WITH CONNECTION \`${projectId}.${omniRegion}.biglake-aws-s3-omni\`
OPTIONS (
  format = 'ICEBERG',
  uris = ['${omniUri}/metadata/v1.metadata.json'],
  max_staleness = INTERVAL 30 MINUTE,
  metadata_cache_mode = 'AUTOMATIC'
);`
        : `# Step 1: Create BigLake Omni Cross-Cloud Azure Blob / ADLS Gen2 Connection (${omniRegion})
bq mk --connection \\
  --connection_type=AZURE \\
  --federated_app_client_id="00000000-0000-0000-0000-000000000000" \\
  --tenant_id="11111111-1111-1111-1111-111111111111" \\
  --location=${omniRegion} \\
  biglake-azure-adls-omni

# Step 2: Query Azure ADLS Gen2 Parquet/Iceberg in-place via BigLake Omni
CREATE EXTERNAL TABLE \`${projectId}.omni_azure_dataset.adls_orders_iceberg\`
WITH CONNECTION \`${projectId}.${omniRegion}.biglake-azure-adls-omni\`
OPTIONS (
  format = 'PARQUET',
  uris = ['${omniUri}/*.parquet'],
  metadata_cache_mode = 'AUTOMATIC'
);`;

    return { rlsDdl, omniCliAndDdl };
  }, [
    projectId,
    bigLakeArtifacts,
    rlsPolicyName,
    rlsGrantee,
    rlsFilterExpression,
    omniCloud,
    omniRegion,
    omniUri,
    omniRoleId,
  ]);

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] space-y-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                BIGLAKE &amp; APACHE ICEBERG OPEN LAKEHOUSE STUDIO
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                Open Parquet in gs:// · Zero Data Duplication · Multi-Engine ACID
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Layers className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
              <span>
                Google Cloud BigLake &amp; Apache Iceberg Studio (Metastore Catalogs, Zero-Trust `gs://` &amp; Omni)
              </span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-4xl">
              While <strong>BigQuery</strong> stores data in Google&apos;s proprietary Capacitor format, <strong>BigLake</strong> (`biglake.googleapis.com/v1`) lets you store data as <strong>open Apache Iceberg &amp; Parquet files in your own `gs://` bucket</strong> (or AWS S3 / Azure ADLS) so BigQuery, Serverless Spark, Ray, and Vertex AI read and write the exact same files with full ACID transactions and Row/Column security.
            </p>
          </div>

          <button
            type="button"
            disabled={loadingCatalogs}
            onClick={() => {
              fetchBigLakeCatalogs();
              fetchBucketsAndDatasets();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loadingCatalogs ? 'animate-spin text-zinc-500 dark:text-zinc-400' : ''
              }`}
            />
            <span>Sync BigLake</span>
          </button>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              BigLake Metastore Catalogs
            </div>
            <div className="text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {bigLakeCatalogs.length} Active
            </div>
            <div className="text-[10px] text-zinc-500">
              REST Catalog (`biglake.googleapis.com/v1`)
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Cloud Storage Buckets (`gs://`)
            </div>
            <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {gcsBuckets.length} Ready
            </div>
            <div className="text-[10px] text-zinc-500">
              $0.020/GB-mo Open Parquet + Iceberg
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Small-File Compaction Gain
            </div>
            <div className="text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-0.5">
              -{compactionArtifacts.fileReductionPct}% Files
            </div>
            <div className="text-[10px] text-zinc-500">
              {compactionArtifacts.estScanSpeedup} via Z-Order/Sort
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Zero-Copy Engine Access
            </div>
            <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              4 Engines · 1 Copy
            </div>
            <div className="text-[10px] text-zinc-500">
              BigQuery + Spark + Trino + Vertex AI
            </div>
          </div>
        </div>

        {/* 5 Symmetrical BigLake Sub-Tabs (5-Column Equal-Sized Bento Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          {BIGLAKE_TABS.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={`${tab.label} (${tab.badge})`}
                className={`w-full h-11 px-3 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                      isActive
                        ? 'bg-black/25 text-white'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="truncate">{tab.label}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUB-TAB 1: BIGLAKE METASTORE & ICEBERG REST CATALOG EXPLORER          */}
      {/* ===================================================================== */}
      {activeTab === 'METASTORE_CATALOGS' && (
        <div className="space-y-4">
          {/* Live BigLake Metastore Catalog Manager */}
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Database className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
                    Official Google Cloud BigLake Metastore &amp; Iceberg REST Catalogs (`/biglake/metastore/catalogs`)
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    biglake.googleapis.com/v1
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Manage live **BigLake Metastore Catalogs → Databases → Apache Iceberg Tables** (`projects/{projectId}/locations/*/catalogs/*`) with optional **Credential Vending** so external Spark/Trino engines never need static GCS keys.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setCredentialVendingEnabled((v) => !v)
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer shrink-0 ${
                  credentialVendingEnabled
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {credentialVendingEnabled
                  ? 'Credential Vending: ENABLED (Short-Lived Downscoped Tokens)'
                  : 'Credential Vending: OFF'}
              </button>
            </div>

            {/* Create BigLake Catalog Form */}
            <form
              onSubmit={handleCreateBigLakeCatalog}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end bg-zinc-50 dark:bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800"
            >
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  BigLake Catalog ID
                </label>
                <input
                  type="text"
                  value={newCatalogId}
                  onChange={(e) => setNewCatalogId(e.target.value)}
                  placeholder="iceberg_prod_catalog"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Metastore Location
                </label>
                <select
                  value={newCatalogLocation}
                  onChange={(e) => setNewCatalogLocation(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                >
                  <option value="us">us (Multi-Region US)</option>
                  <option value="eu">eu (Multi-Region EU)</option>
                  <option value="us-central1">us-central1 (Iowa)</option>
                  <option value="europe-west1">europe-west1 (Belgium)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Initial Database Namespace
                </label>
                <input
                  type="text"
                  value={newCatalogDbId}
                  onChange={(e) => setNewCatalogDbId(e.target.value)}
                  placeholder="lakehouse_silver"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={creatingCatalog}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>
                  {creatingCatalog
                    ? 'Creating Catalog...'
                    : '+ Create BigLake Catalog'}
                </span>
              </button>
            </form>

            {/* Live BigLake Catalogs List */}
            {bigLakeCatalogs.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                No BigLake Metastore Catalogs found in <code className="font-mono">{projectId}</code> yet — click <strong>+ Create BigLake Catalog</strong> above to provision one via <code className="font-mono">biglake.googleapis.com/v1</code>.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bigLakeCatalogs.map((cat) => (
                  <div
                    key={`${cat.location}-${cat.id}`}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-blue-500/30 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-100">
                          {cat.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-bold">
                          {cat.location}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 break-all">
                        {cat.fullName}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteBigLakeCatalog(cat.location, cat.id)
                      }
                      className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-500 text-[11px] font-mono font-bold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3-Column Architecture Comparison Matrix */}
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
                  BigLake Open Iceberg vs. Legacy External Table vs. Native BigQuery Capacitor
                </h3>
                <p className="text-xs text-zinc-500">
                  Why modern Google Cloud data teams standardize on BigLake Apache Iceberg for shared lakehouse tables:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-red-500">
                    1. Legacy External Table (Old Way)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-500 font-bold">
                    AVOID IN PROD
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  <li>• Every SQL analyst must be granted raw `roles/storage.objectViewer` on the entire `gs://` bucket.</li>
                  <li>• Zero row-level filtering or column masking support.</li>
                  <li>• Re-lists `gs://` objects on every query (slow metadata scan).</li>
                  <li>• Strictly read-only (no `MERGE`, `UPDATE`, or `DELETE`).</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-blue-500/40 bg-blue-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-blue-600 dark:text-blue-400">
                    2. BigLake + Apache Iceberg (Open Lakehouse)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-600 dark:text-blue-300 font-bold">
                    MULTI-ENGINE WINNER
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-200">
                  <li>• Zero-Trust Bucket: Only BigLake&apos;s delegated Service Account touches `gs://`.</li>
                  <li>• Full Row Access Policies &amp; Column Data Masking over `gs://` Parquet.</li>
                  <li>• Full ACID (`INSERT`, `UPDATE`, `DELETE`, `MERGE`) + Snapshot Time-Travel.</li>
                  <li>• BigQuery, Serverless Spark, Ray &amp; Trino share 1 open copy in `gs://`.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                    3. Native BigQuery Table (`Capacitor`)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold">
                    PURE SQL WAREHOUSE
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                  <li>• Zero bucket or connection setup required.</li>
                  <li>• High compression ratio (~5:1) under `PHYSICAL` billing ($0.04/GB).</li>
                  <li>• Closed storage format: Spark/Ray must pay for the BigQuery Storage Read API instead of reading open `gs://` Parquet directly.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: 1-CLICK BIGLAKE CONNECTION, IAM & ICEBERG WIZARD           */}
      {/* ===================================================================== */}
      {activeTab === 'PROVISION_WIZARD' && (
        <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  3-Step Guided BigLake Connection, Zero-Trust IAM &amp; Apache Iceberg Provisioner
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Eliminates `Not found: Connection` and `Access Denied: gs://` errors by generating the exact 3-step sequence for your project.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { id: 'ICEBERG_MANAGED', label: 'Managed Iceberg (ACID R/W)' },
                { id: 'BIGLAKE_EXTERNAL', label: 'Cached External (Read-Only)' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setBigLakeUseCase(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                    bigLakeUseCase === m.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                1. Cloud Storage Bucket (`gs://`)
              </label>
              {gcsBuckets.length > 0 ? (
                <select
                  value={bigLakeBucket}
                  onChange={(e) => setBigLakeBucket(e.target.value)}
                  className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
                >
                  {gcsBuckets.map((b) => (
                    <option key={b.name} value={b.name}>
                      gs://{b.name} ({b.location || 'US'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={bigLakeBucket}
                  onChange={(e) => setBigLakeBucket(e.target.value)}
                  className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
                />
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                2. Lakehouse Folder Path in Bucket
              </label>
              <input
                type="text"
                value={bigLakeFolder}
                onChange={(e) => setBigLakeFolder(e.target.value)}
                className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                3. BigLake Connection ID
              </label>
              <input
                type="text"
                value={bigLakeConnectionId}
                onChange={(e) => setBigLakeConnectionId(e.target.value)}
                className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                4. BigLake Table Name
              </label>
              <input
                type="text"
                value={bigLakeTableName}
                onChange={(e) => setBigLakeTableName(e.target.value)}
                className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Target BigQuery Dataset
              </label>
              {datasets.length > 0 ? (
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
                >
                  {datasets.map((d) => (
                    <option key={d.datasetId} value={d.datasetId}>
                      {d.datasetId}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Connection Region (`location`)
              </label>
              <select
                value={bigLakeLocation}
                onChange={(e) => setBigLakeLocation(e.target.value)}
                className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
              >
                <option value="US">US (Multi-Region)</option>
                <option value="EU">EU (Multi-Region Sovereign)</option>
                <option value="us-central1">us-central1 (Iowa)</option>
                <option value="europe-west1">europe-west1 (Belgium)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Open File Format (`gs://`)
              </label>
              <select
                value={bigLakeFormat}
                onChange={(e) => setBigLakeFormat(e.target.value)}
                className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
              >
                <option value="PARQUET">PARQUET (Recommended + Iceberg)</option>
                <option value="DELTA_LAKE">DELTA_LAKE (Databricks / Spark)</option>
                <option value="ORC">ORC (Hive / Hadoop)</option>
                <option value="AVRO">AVRO (Streaming Events)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Metadata Cache (`max_staleness`)
              </label>
              <select
                value={bigLakeStalenessMins}
                onChange={(e) => setBigLakeStalenessMins(Number(e.target.value))}
                className="w-full h-[36px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 text-xs font-mono"
              >
                <option value={15}>15 Minutes (Near-Real-Time)</option>
                <option value={30}>30 Minutes (Balanced Speed)</option>
                <option value={60}>60 Minutes (Fastest Object Cache)</option>
                <option value={240}>4 Hours (Batch Lakehouse)</option>
              </select>
            </div>
          </div>

          {/* 3-Step Execution Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-amber-400">
                    STEP 1 · Create BigLake Connection
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(bigLakeArtifacts.step1ConnectionCli, 'bl-step1')
                    }
                    className="text-[11px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    {copiedId === 'bl-step1' ? 'Copied' : 'Copy CLI'}
                  </button>
                </div>
                <pre className="text-[10.5px] font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-black/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap break-all">
                  {bigLakeArtifacts.step1ConnectionCli}
                </pre>
              </div>
              {onRunInShell && (
                <button
                  type="button"
                  onClick={() =>
                    onRunInShell(
                      `bq mk --connection --connection_type=CLOUD_RESOURCE --project_id=${projectId} --location=${bigLakeLocation} ${bigLakeConnectionId}`
                    )
                  }
                  className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold cursor-pointer"
                >
                  Run Step 1 in Cloud Shell →
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-emerald-400">
                    STEP 2 · Delegate Zero-Trust Bucket IAM
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(bigLakeArtifacts.step2BucketIamCli, 'bl-step2')
                    }
                    className="text-[11px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    {copiedId === 'bl-step2' ? 'Copied' : 'Copy CLI'}
                  </button>
                </div>
                <pre className="text-[10.5px] font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-black/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap break-all">
                  {bigLakeArtifacts.step2BucketIamCli}
                </pre>
              </div>
              {onRunInShell && (
                <button
                  type="button"
                  onClick={() => onRunInShell(bigLakeArtifacts.step2BucketIamCli)}
                  className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold cursor-pointer"
                >
                  Run Step 2 in Cloud Shell →
                </button>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-blue-500/40 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-blue-700 dark:text-blue-300">
                    STEP 3 ·{' '}
                    {bigLakeUseCase === 'ICEBERG_MANAGED'
                      ? 'BigLake Apache Iceberg DDL'
                      : 'BigLake Cached External DDL'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(bigLakeArtifacts.primaryDdl, 'bl-step3')
                    }
                    className="text-[11px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer"
                  >
                    {copiedId === 'bl-step3' ? 'Copied' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="text-[10.5px] font-mono text-blue-100 bg-zinc-100 dark:bg-black/50 p-2.5 rounded-lg border border-blue-500/30 whitespace-pre-wrap break-all">
                  {bigLakeArtifacts.primaryDdl}
                </pre>
              </div>
              {onOpenBigQuerySql && (
                <button
                  type="button"
                  onClick={() => onOpenBigQuerySql(bigLakeArtifacts.primaryDdl)}
                  className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-mono font-extrabold cursor-pointer"
                >
                  Open Step 3 in BigQuery SQL Executor →
                </button>
              )}
            </div>
          </div>

          {/* Spark REST Catalog Interoperability */}
          <div className="p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-emerald-400">
                Zero-Copy Spark / Ray Read via BigLake Iceberg REST Catalog (`https://biglake.googleapis.com/iceberg/v1beta/restcatalog`)
              </span>
              <button
                type="button"
                onClick={() =>
                  copyText(bigLakeArtifacts.sparkReadSnippet, 'bl-spark')
                }
                className="text-[11px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer"
              >
                {copiedId === 'bl-spark' ? 'Copied' : 'Copy PySpark'}
              </button>
            </div>
            <pre className="text-[10.5px] font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-black/50 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
              {bigLakeArtifacts.sparkReadSnippet}
            </pre>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: ICEBERG SMALL-FILE COMPACTION & SNAPSHOT DOCTOR            */}
      {/* ===================================================================== */}
      {activeTab === 'COMPACTION_DOCTOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 5 Cols: Small-File & Snapshot Bloat Simulator */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    Apache Iceberg Small-File &amp; Snapshot Doctor
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Streaming ingestion into Iceberg creates thousands of tiny Parquet files and manifest snapshots that slow down BigQuery &amp; Spark scans.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  FILE COMPACTION
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">Current Avg Parquet File Size:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {avgFileSizeMb} MB
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={128}
                    value={avgFileSizeMb}
                    onChange={(e) => setAvgFileSizeMb(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">Uncompacted Data Files in Bucket:</span>
                    <span className="font-bold text-red-500">
                      {totalFilesCount.toLocaleString()} files ({compactionArtifacts.totalDataGb} GB)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={500}
                    max={100000}
                    step={500}
                    value={totalFilesCount}
                    onChange={(e) => setTotalFilesCount(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                      Target File Size
                    </label>
                    <select
                      value={targetFileSizeMb}
                      onChange={(e) => setTargetFileSizeMb(Number(e.target.value))}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    >
                      <option value={256}>256 MB (Balanced)</option>
                      <option value={512}>512 MB (Optimal Iceberg)</option>
                      <option value={1024}>1,024 MB (1 GB Analytics)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                      Compaction Strategy
                    </label>
                    <select
                      value={compactionStrategy}
                      onChange={(e) => setCompactionStrategy(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    >
                      <option value="SORT_ZORDER">Sort / Z-Order Clustering</option>
                      <option value="BINPACK">Fast Bin-Packing</option>
                    </select>
                  </div>
                </div>

                {compactionStrategy === 'SORT_ZORDER' && (
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                      Sort / Clustering Columns (`sort_order`)
                    </label>
                    <input
                      type="text"
                      value={sortColumns}
                      onChange={(e) => setSortColumns(e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono space-y-1">
                <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                  Compaction Result: {totalFilesCount.toLocaleString()} files →{' '}
                  {compactionArtifacts.compactedFilesCount.toLocaleString()} files (-
                  {compactionArtifacts.fileReductionPct}%)
                </div>
                <div className="text-[11px] text-zinc-500">
                  Eliminates GCS object-open overhead and achieves{' '}
                  <strong>{compactionArtifacts.estScanSpeedup}</strong> on BigQuery &amp; Spark reads.
                </div>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: BigQuery Metadata Export & Spark Iceberg Compaction Procedures */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold font-mono text-emerald-400">
                  BigQuery Managed Iceberg Snapshot Export (`EXPORT TABLE METADATA`)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(compactionArtifacts.bqExportMetadataSql, 'EXP_META')
                  }
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  {copiedId === 'EXP_META' ? 'Copied' : 'Copy SQL'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                {compactionArtifacts.bqExportMetadataSql}
              </pre>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold font-mono text-blue-400">
                  Iceberg `rewrite_data_files`, `expire_snapshots` &amp; `remove_orphan_files`
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(compactionArtifacts.sparkCompactionSql, 'COMPACT_SQL')
                  }
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  {copiedId === 'COMPACT_SQL' ? 'Copied' : 'Copy Maintenance SQL'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-blue-700 dark:text-blue-300 overflow-x-auto leading-relaxed">
                {compactionArtifacts.sparkCompactionSql}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 4: ROW/COLUMN SECURITY OVER GS:// & CROSS-CLOUD BIGLAKE OMNI  */}
      {/* ===================================================================== */}
      {activeTab === 'RLS_CLS_OMNI' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 5 Cols: RLS/CLS Policy Config & BigLake Omni Cloud Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
              <div className="text-xs font-extrabold font-mono uppercase text-blue-600 dark:text-blue-400">
                Row-Level &amp; Column-Level Security over `gs://` Parquet
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                    Row Access Policy Name
                  </label>
                  <input
                    type="text"
                    value={rlsPolicyName}
                    onChange={(e) => setRlsPolicyName(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                    IAM Grantee (`GRANT TO`)
                  </label>
                  <input
                    type="text"
                    value={rlsGrantee}
                    onChange={(e) => setRlsGrantee(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                    Row Predicate (`FILTER USING`)
                  </label>
                  <input
                    type="text"
                    value={rlsFilterExpression}
                    onChange={(e) => setRlsFilterExpression(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="text-xs font-extrabold font-mono uppercase text-emerald-600 dark:text-emerald-400">
                  BigLake Omni Cross-Cloud Lakehouse ($0 Egress)
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  AWS S3 &amp; AZURE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    id: 'AWS_S3',
                    label: 'AWS S3 (aws-us-east-1)',
                    region: 'aws-us-east-1',
                    uri: 's3://enterprise-aws-datalake/iceberg/orders',
                  },
                  {
                    id: 'AZURE_BLOB',
                    label: 'Azure ADLS (azure-eastus2)',
                    region: 'azure-eastus2',
                    uri: 'azure://enterprisedatalake.blob.core.windows.net/iceberg/orders',
                  },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setOmniCloud(c.id);
                      setOmniRegion(c.region);
                      setOmniUri(c.uri);
                    }}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold border cursor-pointer ${
                      omniCloud === c.id
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                  External Cloud Bucket URI (`s3://` or `azure://`)
                </label>
                <input
                  type="text"
                  value={omniUri}
                  onChange={(e) => setOmniUri(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
              </div>
              {omniCloud === 'AWS_S3' && (
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                    Delegated AWS IAM Role ARN
                  </label>
                  <input
                    type="text"
                    value={omniRoleId}
                    onChange={(e) => setOmniRoleId(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right 7 Cols: RLS/CLS SQL & BigLake Omni DDL */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold font-mono text-emerald-400">
                  1. BigLake Row Access Policy &amp; Column Data Masking DDL
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(omniAndGovernanceArtifacts.rlsDdl, 'RLS_DDL')
                  }
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  {copiedId === 'RLS_DDL' ? 'Copied' : 'Copy Governance SQL'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto leading-relaxed">
                {omniAndGovernanceArtifacts.rlsDdl}
              </pre>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold font-mono text-blue-400">
                  2. BigLake Omni Cross-Cloud Connection &amp; Iceberg Table (`{omniRegion}`)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyText(omniAndGovernanceArtifacts.omniCliAndDdl, 'OMNI_DDL')
                  }
                  className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  {copiedId === 'OMNI_DDL' ? 'Copied' : 'Copy Omni Blueprint'}
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-blue-700 dark:text-blue-300 overflow-x-auto leading-relaxed">
                {omniAndGovernanceArtifacts.omniCliAndDdl}
              </pre>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ICEBERG_50_MATRIX' && (
        <IcebergLakehousePlaybookMatrix
          projectId={projectId}
          onRunInShell={onRunInShell}
          onOpenBigQuerySql={onOpenBigQuerySql}
          onShowToast={onShowToast}
          onShowError={onShowError}
        />
      )}
    </div>
  );
}
