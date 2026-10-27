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
    icon: Database,
    label: 'BigLake Metastore & Iceberg REST Catalogs',
    badge: 'biglake.googleapis.com/v1',
  },
  {
    id: 'PROVISION_WIZARD',
    icon: ShieldCheck,
    label: '1-Click BigLake Connection, IAM & Iceberg Wizard',
    badge: 'Zero-Trust gs://',
  },
  {
    id: 'COMPACTION_DOCTOR',
    icon: Sliders,
    label: 'Iceberg Small-File Compaction & Snapshot Doctor',
    badge: 'Z-Order & GC',
  },
  {
    id: 'RLS_CLS_OMNI',
    icon: Globe,
    label: 'Row/Column Security & Cross-Cloud Omni (S3 / Azure)',
    badge: '$0 Egress Omni',
  },
  {
    id: 'ICEBERG_50_MATRIX',
    icon: Layers,
    label: '50-Playbook Borderless Iceberg & Multi-Engine Matrix',
    badge: '50 Scenarios · 8 Domains',
  },
  {
    id: 'DATABRICKS_UNITY_BRIDGE',
    icon: Sparkles,
    label: 'Databricks Unity & Glue Federation + Native GCP Transpiler',
    badge: 'Unity / Glue + $0 DBU Spark',
  },
];

export default function BigLakeIcebergStudio({
  projectId,
  initialSubTab,
  onRunInShell,
  onOpenBigQuerySql,
  onOpenDataEngineerStudio,
  onNavigateTab,
  onOpenHealthAndDrift,
  onOpenTimeMachine,
  onShowToast,
  onShowError,
}) {
  const [activeTab, setActiveTab] = useState(
    initialSubTab || 'METASTORE_CATALOGS'
  );
  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab]);
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

  // Tab 6: Databricks Unity & AWS Glue Federated Catalog + TCO Comparator + Native GCP Transpiler state
  const [fedFlowType, setFedFlowType] = useState('unity'); // 'unity' | 'glue'
  const [fedCatalogName, setFedCatalogName] = useState('databricks_unity_fed');
  const [fedRegionPairIdx, setFedRegionPairIdx] = useState(0);
  const [fedSecretName, setFedSecretName] = useState('databricks-unity-oauth-secret');
  const [fedUnityInstance, setFedUnityInstance] = useState('dbc-a1b2c3d4-e5f6.cloud.databricks.com');
  const [fedUnityCatalog, setFedUnityCatalog] = useState('main');
  const [fedUnityClientId, setFedUnityClientId] = useState('');
  const [fedUnityClientSecret, setFedUnityClientSecret] = useState('');
  const [fedGlueAccountId, setFedGlueAccountId] = useState('123456789012');
  const [fedGlueRoleName, setFedGlueRoleName] = useState('BigLakeGlueFederatedReadRole');
  const [fedGlueBucket, setFedGlueBucket] = useState('enterprise-lakehouse-bucket');
  const [fedGlueDatabase, setFedGlueDatabase] = useState('commerce_gold');
  const [fedCatalogsList, setFedCatalogsList] = useState([]);
  const [creatingFedCatalog, setCreatingFedCatalog] = useState(false);

  // Databricks DBU Double-Tax vs. Native GCP TCO state
  const [dbxInteractiveNodes, setDbxInteractiveNodes] = useState(8);
  const [dbxInteractiveHoursDay, setDbxInteractiveHoursDay] = useState(10);
  const [dbxIdlePct, setDbxIdlePct] = useState(45);
  const [dbxJobsHoursDay, setDbxJobsHoursDay] = useState(6);
  const [dbxSqlDbuHoursDay, setDbxSqlDbuHoursDay] = useState(8);

  // Databricks -> Native GCP (Dataproc Serverless Spark + BigLake Iceberg) Transpiler state
  const [dbxSourceTemplate, setDbxSourceTemplate] = useState('DELTA_MERGE_DBUTILS');
  const [dbxCustomCode, setDbxCustomCode] = useState(`# Databricks All-Purpose Cluster Notebook (DBU + GCE Double-Tax)
api_key = dbutils.secrets.get(scope="prod-vault", key="stripe-webhook-secret")
files = dbutils.fs.ls("dbfs:/mnt/raw-events/2026/")

from delta.tables import DeltaTable
df_updates = spark.read.format("delta").load("dbfs:/mnt/bronze/customer_events")
df_catalog = spark.table("main.commerce_silver.active_subscriptions")

delta_target = DeltaTable.forName(spark, "main.commerce_gold.customer_ltv")
(delta_target.alias("t")
  .merge(df_updates.alias("s"), "t.customer_id = s.customer_id")
  .whenMatchedUpdateAll()
  .whenNotMatchedInsertAll()
  .execute())

spark.sql("OPTIMIZE main.commerce_gold.customer_ltv ZORDER BY (region, signup_date)")
spark.sql("VACUUM main.commerce_gold.customer_ltv RETAIN 168 HOURS")`);
  const [submittingNativeSpark, setSubmittingNativeSpark] = useState(false);

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

  const fetchFederatedCatalogs = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/biglake/federated-catalogs`
      );
      if (Array.isArray(res.data?.federatedCatalogs)) {
        setFedCatalogsList(res.data.federatedCatalogs);
      }
    } catch {
      // ignore if offline
    }
  }, [projectId]);

  useEffect(() => {
    fetchBigLakeCatalogs();
    fetchBucketsAndDatasets();
    fetchFederatedCatalogs();
  }, [fetchBigLakeCatalogs, fetchBucketsAndDatasets, fetchFederatedCatalogs]);

  const CCI_REGION_PAIRINGS = [
    {
      awsRegion: 'us-east-1',
      awsLabel: 'AWS us-east-1 (N. Virginia)',
      gcpRegion: 'us-east4',
      gcpLabel: 'GCP us-east4 (Ashburn, VA)',
      tier: 'Low-Latency Dedicated Partner CCI (~1.8ms)',
    },
    {
      awsRegion: 'us-west-2',
      awsLabel: 'AWS us-west-2 (Oregon)',
      gcpRegion: 'us-west1',
      gcpLabel: 'GCP us-west1 (The Dalles, OR)',
      tier: 'Low-Latency Dedicated Partner CCI (~2.1ms)',
    },
    {
      awsRegion: 'eu-west-2',
      awsLabel: 'AWS eu-west-2 (London)',
      gcpRegion: 'europe-west2',
      gcpLabel: 'GCP europe-west2 (London)',
      tier: 'Low-Latency Dedicated Partner CCI (~1.6ms)',
    },
    {
      awsRegion: 'eu-central-1',
      awsLabel: 'AWS eu-central-1 (Frankfurt)',
      gcpRegion: 'europe-west3',
      gcpLabel: 'GCP europe-west3 (Frankfurt)',
      tier: 'Low-Latency Dedicated Partner CCI (~1.5ms)',
    },
    {
      awsRegion: 'ap-northeast-1',
      awsLabel: 'AWS ap-northeast-1 (Tokyo)',
      gcpRegion: 'asia-northeast1',
      gcpLabel: 'GCP asia-northeast1 (Tokyo)',
      tier: 'Low-Latency Dedicated Partner CCI (~1.9ms)',
    },
    {
      awsRegion: 'ap-southeast-1',
      awsLabel: 'AWS ap-southeast-1 (Singapore)',
      gcpRegion: 'asia-southeast1',
      gcpLabel: 'GCP asia-southeast1 (Singapore)',
      tier: 'Low-Latency Dedicated Partner CCI (~1.7ms)',
    },
  ];

  const activeRegionPair =
    CCI_REGION_PAIRINGS[fedRegionPairIdx] || CCI_REGION_PAIRINGS[0];

  const handleCreateFederatedCatalog = async () => {
    if (!projectId) return;
    setCreatingFedCatalog(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/biglake/federated-catalogs/create`,
        {
          catalogName: fedCatalogName,
          federatedCatalogType: fedFlowType,
          gcpRegion: activeRegionPair.gcpRegion,
          awsRegion: activeRegionPair.awsRegion,
          secretName: fedSecretName,
          unityInstanceName: fedUnityInstance,
          unityCatalogName: fedUnityCatalog,
          unityClientId: fedUnityClientId,
          unityClientSecret: fedUnityClientSecret,
          refreshInterval: '300s',
          glueWarehouse: fedGlueAccountId,
          glueAwsRoleName: fedGlueRoleName,
          scopedS3Bucket: fedGlueBucket,
        }
      );
      if (res.data?.catalog) {
        setFedCatalogsList((prev) => [
          res.data.catalog,
          ...prev.filter((c) => c.id !== res.data.catalog.id),
        ]);
      }
      onShowToast?.(
        res.data?.message || 'Provisioned Federated BigLake Iceberg Catalog!'
      );
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          'Failed to provision Federated BigLake Catalog.'
      );
    } finally {
      setCreatingFedCatalog(false);
    }
  };

  // Module 2: Databricks DBU Double-Tax vs. 100% Native GCP Lakehouse TCO Math
  const databricksTcoComparison = useMemo(() => {
    // 1. All-Purpose Interactive Cluster (e.g. n2-standard-8: ~2 DBU/hr @ $0.55/DBU + $0.38/hr GCE VM)
    const dbuPerNodeHr = 2.0 * 0.55; // $1.10/hr in Databricks DBUs per 8-vCPU node
    const gcePerNodeHr = 0.38; // $0.38/hr underlying GCE VM + PD SSD
    const monthlyInteractiveNodeHrs =
      dbxInteractiveNodes * dbxInteractiveHoursDay * 30;
    const dbxInteractiveDbuUsd = monthlyInteractiveNodeHrs * dbuPerNodeHr;
    const dbxInteractiveGceUsd = monthlyInteractiveNodeHrs * gcePerNodeHr;
    const dbxIdleWasteUsd =
      (dbxInteractiveDbuUsd + dbxInteractiveGceUsd) * (dbxIdlePct / 100);

    // 2. Jobs Compute (4 nodes * hours/day * 30d * ($0.30 DBU + $0.38 GCE))
    const monthlyJobsNodeHrs = 4 * dbxJobsHoursDay * 30;
    const dbxJobsDbuUsd = monthlyJobsNodeHrs * (2.0 * 0.3);
    const dbxJobsGceUsd = monthlyJobsNodeHrs * gcePerNodeHr;

    // 3. SQL Warehouse (Serverless/Pro SQL DBU @ $0.70/DBU-hr * 8 DBU cluster)
    const dbxSqlMonthlyUsd = dbxSqlDbuHoursDay * 30 * 8 * 0.7;

    const totalDatabricksMonthlyUsd =
      dbxInteractiveDbuUsd +
      dbxInteractiveGceUsd +
      dbxJobsDbuUsd +
      dbxJobsGceUsd +
      dbxSqlMonthlyUsd;

    const totalDbuTaxOnlyUsd =
      dbxInteractiveDbuUsd + dbxJobsDbuUsd + dbxSqlMonthlyUsd;

    // Native Google Cloud Equivalent:
    // - Eliminates 100% of DBU surcharge ($0.00 DBU tax)
    // - Eliminates 100% of idle warm cluster waste (Dataproc Serverless Spark scales to $0 in <5s; BigQuery is $0 idle)
    const activeWorkFraction = Math.max(0.15, 1 - dbxIdlePct / 100);
    const nativeDataprocServerlessUsd =
      (monthlyInteractiveNodeHrs * activeWorkFraction + monthlyJobsNodeHrs * 0.75) *
      0.34;
    const nativeBigQueryLakehouseUsd = dbxSqlDbuHoursDay * 30 * 1.15;
    const totalNativeGcpMonthlyUsd =
      nativeDataprocServerlessUsd + nativeBigQueryLakehouseUsd;

    const monthlySavingsUsd = Math.max(
      0,
      totalDatabricksMonthlyUsd - totalNativeGcpMonthlyUsd
    );

    return {
      dbxInteractiveDbuUsd: Math.round(dbxInteractiveDbuUsd),
      dbxInteractiveGceUsd: Math.round(dbxInteractiveGceUsd),
      dbxIdleWasteUsd: Math.round(dbxIdleWasteUsd),
      dbxJobsUsd: Math.round(dbxJobsDbuUsd + dbxJobsGceUsd),
      dbxSqlMonthlyUsd: Math.round(dbxSqlMonthlyUsd),
      totalDbuTaxOnlyUsd: Math.round(totalDbuTaxOnlyUsd),
      totalDatabricksMonthlyUsd: Math.round(totalDatabricksMonthlyUsd),
      nativeDataprocServerlessUsd: Math.round(nativeDataprocServerlessUsd),
      nativeBigQueryLakehouseUsd: Math.round(nativeBigQueryLakehouseUsd),
      totalNativeGcpMonthlyUsd: Math.round(totalNativeGcpMonthlyUsd),
      monthlySavingsUsd: Math.round(monthlySavingsUsd),
      annualSavingsUsd: Math.round(monthlySavingsUsd * 12),
      savingsPercent:
        totalDatabricksMonthlyUsd > 0
          ? Math.round((monthlySavingsUsd / totalDatabricksMonthlyUsd) * 100)
          : 0,
    };
  }, [
    dbxInteractiveNodes,
    dbxInteractiveHoursDay,
    dbxIdlePct,
    dbxJobsHoursDay,
    dbxSqlDbuHoursDay,
  ]);

  // Module 3: 1-Click Databricks (dbutils / Delta / Unity) -> Native GCP (Dataproc Serverless + BigLake Iceberg + BigQuery) Transpiler
  const transpiledDatabricksBundle = useMemo(() => {
    const cleanBkt = (bigLakeBucket || `${projectId}-biglake-iceberg`).replace(
      /^gs:\/\//,
      ''
    );
    const gcpReg = activeRegionPair.gcpRegion;

    // Analyze input code to highlight detected Databricks constructs
    const raw = String(dbxCustomCode || '');
    const conversions = [];
    if (/dbutils\.secrets\.get/i.test(raw)) {
      conversions.push(
        'dbutils.secrets.get(scope, key) → google.cloud.secretmanager.SecretManagerServiceClient()'
      );
    }
    if (/dbutils\.fs|dbfs:\//i.test(raw)) {
      conversions.push(
        'dbutils.fs / dbfs:/mnt/... → Native Cloud Storage gs:// Connector (0 mount setup)'
      );
    }
    if (/DeltaTable\.forName|\.format\(["']delta["']\)/i.test(raw)) {
      conversions.push(
        'DeltaTable / .format("delta") → BigLake Managed Apache Iceberg v2 (ACID MERGE INTO)'
      );
    }
    if (/OPTIMIZE.*ZORDER BY|VACUUM/i.test(raw)) {
      conversions.push(
        'OPTIMIZE ZORDER BY / VACUUM → BigLake Iceberg rewrite_data_files & expire_snapshots'
      );
    }
    if (/\bmain\.[a-zA-Z0-9_]+\.[a-zA-Z0-9_]+/.test(raw)) {
      conversions.push(
        'Unity Catalog 3-Part Name (main.schema.table) → BigLake Catalog (biglake.schema.table) & BigQuery Federated SQL'
      );
    }

    const nativeServerlessPySpark = `# ============================================================================
# CloudPulse 2026 — Transpiled Native Google Cloud Dataproc Serverless Spark 2.2
# Replaces: Databricks All-Purpose Cluster ($0.00 DBU Tax · <5s Startup · Scales to $0 Idle)
# Storage & Governance: BigLake Managed Apache Iceberg + Google Cloud Secret Manager
# ============================================================================
from pyspark.sql import SparkSession
from google.cloud import secretmanager

# 1. Native Secret Manager replacement for dbutils.secrets.get(scope, key)
sm_client = secretmanager.SecretManagerServiceClient()
secret_path = f"projects/${projectId}/secrets/stripe-webhook-secret/versions/latest"
# api_key = sm_client.access_secret_version(name=secret_path).payload.data.decode("UTF-8")

# 2. Initialize Dataproc Serverless Spark 2.2 wired to BigLake Iceberg Catalog
spark = (
    SparkSession.builder
    .appName("cloudpulse-native-gcp-lakehouse")
    .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
    .config("spark.sql.catalog.biglake", "org.apache.iceberg.spark.SparkCatalog")
    .config("spark.sql.catalog.biglake.catalog-impl", "org.apache.iceberg.gcp.biglake.BigLakeCatalog")
    .config("spark.sql.catalog.biglake.gcp_project", "${projectId}")
    .config("spark.sql.catalog.biglake.gcp_location", "${gcpReg}")
    .config("spark.sql.catalog.biglake.blms_catalog", "${newCatalogId || 'iceberg_prod_catalog'}")
    .config("spark.sql.catalog.biglake.warehouse", "gs://${cleanBkt}/iceberg-warehouse")
    .getOrCreate()
)

# 3. Direct gs:// Parquet/Iceberg Read (Replaces dbfs:/mnt/... & spark.read.format("delta"))
df_updates = spark.read.parquet("gs://${cleanBkt}/bronze/customer_events/*.parquet")
df_updates.createOrReplaceTempView("source_updates")

# 4. Native Iceberg v2 ACID MERGE INTO (Replaces DeltaTable.forName().merge())
spark.sql("""
  MERGE INTO biglake.commerce_gold.customer_ltv AS t
  USING source_updates AS s
  ON t.customer_id = s.customer_id
  WHEN MATCHED THEN UPDATE SET *
  WHEN NOT MATCHED THEN INSERT *
""")

# 5. Native Iceberg Z-Order Compaction & Snapshot Expiration (Replaces OPTIMIZE ZORDER & VACUUM)
spark.sql("""
  CALL biglake.system.rewrite_data_files(
    table => 'commerce_gold.customer_ltv',
    strategy => 'sort',
    sort_order => 'zorder(region, signup_date)'
  )
""")
spark.sql("""
  CALL biglake.system.expire_snapshots(
    table => 'commerce_gold.customer_ltv',
    older_than => TIMESTAMP '2026-10-19 00:00:00'
  )
""")`;

    const nativeBigQuerySql = `-- ============================================================================
-- Option A: Query Existing Databricks Unity Catalog Directly from BigQuery (Zero Copy!)
-- Requires Federated Catalog "${fedCatalogName}" in region "${gcpReg}"
-- ============================================================================
SELECT
  customer_id,
  region,
  lifetime_value_usd
FROM \`${projectId}.${fedCatalogName}.${fedUnityCatalog || 'main'}.customer_ltv\`
WHERE lifetime_value_usd > 100
ORDER BY lifetime_value_usd DESC
LIMIT 25;

-- ============================================================================
-- Option B: 100% Native BigQuery + BigLake Managed Apache Iceberg Table ($0 DBU Tax)
-- Replaces Databricks SQL Warehouse + Delta Lake with Native GCP Capacitor & Iceberg
-- ============================================================================
CREATE TABLE IF NOT EXISTS \`${projectId}.${selectedDatasetId || 'analytics_lakehouse'}.customer_ltv_iceberg\`
(
  customer_id STRING,
  region STRING,
  signup_date DATE,
  lifetime_value_usd FLOAT64,
  updated_at TIMESTAMP
)
CLUSTER BY region, signup_date
WITH CONNECTION \`${projectId}.${gcpReg}.${bigLakeConnectionId || 'biglake-iceberg-conn'}\`
OPTIONS (
  file_format = 'PARQUET',
  table_format = 'ICEBERG',
  storage_uri = 'gs://${cleanBkt}/iceberg-warehouse/commerce_gold/customer_ltv'
);`;

    const federatedCliRunbook =
      fedFlowType === 'unity'
        ? `# ============================================================================
# Official Google Cloud Cross-Cloud Lakehouse Runbook — Flow A: Databricks Unity Catalog
# Region Pairing: ${activeRegionPair.awsLabel} <-> ${activeRegionPair.gcpLabel}
# Invariant: Secret Manager secret & BigLake catalog MUST be in the exact same region (${gcpReg})
# ============================================================================

# Step 1: Verify / Enable BigLake & Secret Manager APIs
gcloud services enable biglake.googleapis.com secretmanager.googleapis.com --project="${projectId}"

# Step 2: Create Regional Secret (${gcpReg}) for Databricks OAuth Service Principal
cat << 'EOF' > credentials.json
{
  "client_id": "${fedUnityClientId || '<DATABRICKS_OAUTH_CLIENT_ID>'}",
  "client_secret": "${fedUnityClientSecret || '<DATABRICKS_OAUTH_CLIENT_SECRET>'}"
}
EOF

gcloud config set api_endpoint_overrides/secretmanager https://secretmanager.${gcpReg}.rep.googleapis.com/
gcloud secrets create ${fedSecretName} \\
  --location="${gcpReg}" \\
  --project="${projectId}" \\
  --data-file=credentials.json

# Step 3: Create Federated BigLake Iceberg Catalog Pointing to Databricks Unity
gcloud alpha biglake iceberg catalogs create ${fedCatalogName} \\
  --project="${projectId}" \\
  --primary-location="${gcpReg}" \\
  --catalog-type="federated" \\
  --federated-catalog-type="unity" \\
  --secret-name="projects/${projectId}/locations/${gcpReg}/secrets/${fedSecretName}" \\
  --unity-instance-name="${fedUnityInstance}" \\
  --unity-catalog-name="${fedUnityCatalog}" \\
  --refresh-interval="300s"

# Step 4: Extract Auto-Generated BigLake Service Agent & Grant Secret Accessor
SERVICE_ACCOUNT_EMAIL=$(gcloud alpha biglake iceberg catalogs describe ${fedCatalogName} \\
  --project="${projectId}" \\
  --location="${gcpReg}" \\
  --format="value(biglake-service-account-id)")

gcloud secrets add-iam-policy-binding ${fedSecretName} \\
  --project="${projectId}" \\
  --location="${gcpReg}" \\
  --member="serviceAccount:\${SERVICE_ACCOUNT_EMAIL}" \\
  --role="roles/secretmanager.secretAccessor"

# Step 5: Validate Federated Catalog Namespaces & Query from BigQuery in ${gcpReg}
bq ls --location="${gcpReg}" ${projectId}.${fedCatalogName}`
        : `# ============================================================================
# Official Google Cloud Cross-Cloud Lakehouse Runbook — Flow B: AWS Glue Data Catalog
# Region Pairing: ${activeRegionPair.awsLabel} <-> ${activeRegionPair.gcpLabel}
# Gotcha: --glue-warehouse MUST be your 12-digit AWS Account ID (${fedGlueAccountId}), NOT an s3:// URI!
# ============================================================================

# Step 1: Create AWS IAM Role with Placeholder Google WebIdentity Trust Policy
cat << 'EOF' > trust_policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Federated": "accounts.google.com" },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "accounts.google.com:aud": ["PLACEHOLDER_VALUE"],
          "accounts.google.com:sub": ["PLACEHOLDER_VALUE"]
        }
      }
    }
  ]
}
EOF
aws iam create-role --role-name ${fedGlueRoleName} --assume-role-policy-document file://trust_policy.json --max-session-duration 43200

# Step 2: Attach Least-Privilege Scoped GlueRead + S3Read Policy (No Wildcard *)
cat << 'EOF' > permissions_policy.json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "GlueRead",
      "Effect": "Allow",
      "Action": ["glue:GetCatalog", "glue:GetDatabase", "glue:GetDatabases", "glue:GetTable", "glue:GetTables"],
      "Resource": [
        "arn:aws:glue:${activeRegionPair.awsRegion}:${fedGlueAccountId}:catalog",
        "arn:aws:glue:${activeRegionPair.awsRegion}:${fedGlueAccountId}:database/${fedGlueDatabase}",
        "arn:aws:glue:${activeRegionPair.awsRegion}:${fedGlueAccountId}:table/${fedGlueDatabase}/*"
      ]
    },
    {
      "Sid": "S3Read",
      "Effect": "Allow",
      "Action": ["s3:ListBucket", "s3:GetObject"],
      "Resource": [
        "arn:aws:s3:::${fedGlueBucket}",
        "arn:aws:s3:::${fedGlueBucket}/*"
      ]
    }
  ]
}
EOF

# Step 3: Initialize Federated Catalog WITHOUT --refresh-interval while AWS trust propagates
gcloud alpha biglake iceberg catalogs create ${fedCatalogName} \\
  --project="${projectId}" \\
  --primary-location="${gcpReg}" \\
  --catalog-type="federated" \\
  --federated-catalog-type="glue" \\
  --glue-warehouse="${fedGlueAccountId}" \\
  --glue-aws-region="${activeRegionPair.awsRegion}" \\
  --glue-aws-role-arn="arn:aws:iam::${fedGlueAccountId}:role/${fedGlueRoleName}"

# Step 4: Extract biglake-service-account-id -> Replace PLACEHOLDER_VALUE in AWS Trust Policy -> Enable 300s Refresh
SERVICE_ACCOUNT_ID=$(gcloud alpha biglake iceberg catalogs describe ${fedCatalogName} \\
  --project="${projectId}" \\
  --location="${gcpReg}" \\
  --format="value(biglake-service-account-id)")

gcloud alpha biglake iceberg catalogs update ${fedCatalogName} \\
  --project="${projectId}" \\
  --location="${gcpReg}" \\
  --refresh-interval="300s"`;

    return {
      conversions,
      nativeServerlessPySpark,
      nativeBigQuerySql,
      federatedCliRunbook,
      cleanBkt,
      gcpReg,
    };
  }, [
    bigLakeBucket,
    projectId,
    activeRegionPair,
    dbxCustomCode,
    newCatalogId,
    fedCatalogName,
    fedUnityCatalog,
    selectedDatasetId,
    bigLakeConnectionId,
    fedFlowType,
    fedUnityClientId,
    fedUnityClientSecret,
    fedSecretName,
    fedUnityInstance,
    fedGlueAccountId,
    fedGlueRoleName,
    fedGlueDatabase,
    fedGlueBucket,
  ]);

  const handleSubmitTranspiledSparkLive = async () => {
    if (!projectId) return;
    setSubmittingNativeSpark(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave10/action`,
        {
          action: 'SUBMIT_SERVERLESS_SPARK',
          batchId: `dbx-offload-${Date.now().toString().slice(-5)}`,
          region: activeRegionPair.gcpRegion,
          bucket: transpiledDatabricksBundle.cleanBkt,
          template: 'ICEBERG_COMPACTION',
        }
      );
      onShowToast?.(
        res.data?.message ||
          `Submitted transpiled Databricks workload to Dataproc Serverless Spark 2.2 in ${activeRegionPair.gcpRegion} ($0 DBU tax)!`
      );
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          'Failed to submit Dataproc Serverless Spark batch.'
      );
    } finally {
      setSubmittingNativeSpark(false);
    }
  };

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

        {/* 6 Symmetrical In-Studio BigLake Sub-Tabs (2x3 Equal-Sized Bento Grid — Stays Inside BigLake Studio) */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>BigLake &amp; Apache Iceberg Cockpit Modules (Select Module Below):</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {BIGLAKE_TABS.map((tab) => {
            const Icon = tab.icon || Layers;
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
                    className={`p-1 rounded-md shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
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
                    Legacy External Table (Old Way)
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
                    BigLake + Apache Iceberg (Open Lakehouse)
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
                    Native BigQuery Table (`Capacitor`)
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
                  BigLake Row Access Policy &amp; Column Data Masking DDL
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
                  BigLake Omni Cross-Cloud Connection &amp; Iceberg Table (`{omniRegion}`)
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
          onNavigateTab={onNavigateTab}
          onOpenBigLakeStudio={(sub) => setActiveTab(sub || 'COMPACTION_DOCTOR')}
          onOpenServerlessSpark={() =>
            onOpenDataEngineerStudio
              ? onOpenDataEngineerStudio('SERVERLESS_SPARK')
              : onNavigateTab?.('DATA_ENGINEER_STUDIO', 'SERVERLESS_SPARK')
          }
          onShowToast={onShowToast}
          onShowError={onShowError}
        />
      )}

      {activeTab === 'DATABRICKS_UNITY_BRIDGE' && (
        <div className="space-y-5">
          {/* Plain-English Guide Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-2 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
                Databricks Unity Catalog &amp; AWS Glue Federation + 100% Native Google Cloud Replacement Studio
              </strong>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-extrabold">
                  gcloud alpha biglake iceberg catalogs · $0.00 DBU Tax
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onOpenDataEngineerStudio
                      ? onOpenDataEngineerStudio('GCP_LAKEHOUSE_WORKSPACE')
                      : onNavigateTab?.(
                          'DATA_ENGINEER_STUDIO',
                          'GCP_LAKEHOUSE_WORKSPACE'
                        )
                  }
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-mono font-bold cursor-pointer"
                >
                  Open 100% Native GCP Lakehouse Workspace (BigFrames + AI.FORECAST + DLT) →
                </button>
              </div>
            </div>
            <p>
              <strong>How this studio helps you:</strong> Whether you want to{' '}
              <strong>(1) Connect &amp; Federate</strong> your existing{' '}
              <span className="font-mono font-bold">Databricks Unity Catalog</span> or{' '}
              <span className="font-mono font-bold">AWS Glue Data Catalog</span> into{' '}
              <strong>BigQuery &amp; BigLake Iceberg</strong> without copying files,{' '}
              <strong>(2) Calculate the &ldquo;Double-Tax&rdquo; Savings</strong> of eliminating Databricks DBUs + idle warm GCE clusters, or{' '}
              <strong>(3) Transpile Databricks PySpark (`dbutils`, `DeltaTable`)</strong> into 100% native{' '}
              <strong>Dataproc Serverless Spark 2.2 + BigLake Managed Iceberg</strong> (`&lt;5s` startup, `$0.00` idle, `$0.00` DBU surcharge), everything is wired below.
            </p>
          </div>

          {/* MODULE 1: CROSS-CLOUD FEDERATED ICEBERG CATALOG PROVISIONER (UNITY & GLUE) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3.5 text-xs font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  Cross-Cloud Federated Catalog Wizard
                </span>
                <div className="inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setFedFlowType('unity');
                      setFedCatalogName('databricks_unity_fed');
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold cursor-pointer ${
                      fedFlowType === 'unity'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Flow A: Databricks Unity
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFedFlowType('glue');
                      setFedCatalogName('aws_glue_fed');
                    }}
                    className={`px-2.5 py-1 text-[10px] font-bold cursor-pointer ${
                      fedFlowType === 'glue'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    Flow B: AWS Glue
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                  1. Low-Latency Cross-Cloud Interconnect (CCI) Region Pairing:
                </label>
                <select
                  value={fedRegionPairIdx}
                  onChange={(e) => setFedRegionPairIdx(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-bold"
                >
                  {CCI_REGION_PAIRINGS.map((pair, idx) => (
                    <option key={pair.awsRegion} value={idx}>
                      {pair.awsLabel} ↔ {pair.gcpLabel} ({pair.tier})
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                  Regional Isolation Rule: Your Secret Manager secret, BigLake Federated Catalog, and BigQuery `--location` MUST all use <strong>{activeRegionPair.gcpRegion}</strong>.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                    BigLake Catalog ID:
                  </label>
                  <input
                    type="text"
                    value={fedCatalogName}
                    onChange={(e) => setFedCatalogName(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                  />
                </div>
                {fedFlowType === 'unity' ? (
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                      Unity Catalog Name:
                    </label>
                    <input
                      type="text"
                      value={fedUnityCatalog}
                      onChange={(e) => setFedUnityCatalog(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                      12-Digit AWS Account ID (`--glue-warehouse`):
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={fedGlueAccountId}
                      onChange={(e) =>
                        setFedGlueAccountId(e.target.value.replace(/\D/g, ''))
                      }
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                )}
              </div>

              {fedFlowType === 'unity' ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                      Databricks Workspace Instance Host (`--unity-instance-name`):
                    </label>
                    <input
                      type="text"
                      value={fedUnityInstance}
                      onChange={(e) => setFedUnityInstance(e.target.value)}
                      className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                        Regional Secret ID:
                      </label>
                      <input
                        type="text"
                        value={fedSecretName}
                        onChange={(e) => setFedSecretName(e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                        OAuth `client_id`:
                      </label>
                      <input
                        type="text"
                        placeholder="Optional for live secret"
                        value={fedUnityClientId}
                        onChange={(e) => setFedUnityClientId(e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                        OAuth `client_secret`:
                      </label>
                      <input
                        type="password"
                        placeholder="Sealed in Secret Mgr"
                        value={fedUnityClientSecret}
                        onChange={(e) => setFedUnityClientSecret(e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                      AWS IAM Role Name:
                    </label>
                    <input
                      type="text"
                      value={fedGlueRoleName}
                      onChange={(e) => setFedGlueRoleName(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                      Scoped Glue Database:
                    </label>
                    <input
                      type="text"
                      value={fedGlueDatabase}
                      onChange={(e) => setFedGlueDatabase(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold">
                      Scoped S3 Bucket:
                    </label>
                    <input
                      type="text"
                      value={fedGlueBucket}
                      onChange={(e) => setFedGlueBucket(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCreateFederatedCatalog}
                  disabled={creatingFedCatalog}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-all"
                >
                  {creatingFedCatalog
                    ? 'Provisioning Federated Catalog...'
                    : `Provision Federated ${
                        fedFlowType === 'unity' ? 'Databricks Unity' : 'AWS Glue'
                      } Catalog in ${activeRegionPair.gcpRegion}`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenBigQuerySql?.(transpiledDatabricksBundle.nativeBigQuerySql)
                  }
                  className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-bold text-xs cursor-pointer"
                >
                  Query Federated Table in BigQuery →
                </button>
              </div>

              {fedCatalogsList.length > 0 && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <div className="text-[10px] uppercase text-zinc-400 font-bold">
                    Provisioned Cross-Cloud Federated Catalogs ({fedCatalogsList.length}):
                  </div>
                  {fedCatalogsList.map((fc) => (
                    <div
                      key={fc.id}
                      className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div>
                        <span className="font-bold text-blue-500">{fc.id}</span>{' '}
                        <span className="text-zinc-500">
                          ({fc.federatedCatalogType?.toUpperCase()} · {fc.gcpRegion} ↔ {fc.awsRegion})
                        </span>
                        <div className="text-[10px] text-zinc-400">
                          Service Agent: {fc.biglakeServiceAccountId}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenBigQuerySql?.(fc.sampleQuerySql)}
                        className="px-2 py-1 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        Run SQL →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-7 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                  Generated Cross-Cloud Lakehouse Federation Runbook ({fedFlowType === 'unity' ? 'Databricks Unity' : 'AWS Glue'})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        transpiledDatabricksBundle.federatedCliRunbook,
                        'FED_RUNBOOK'
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                  >
                    {copiedId === 'FED_RUNBOOK' ? 'Copied!' : 'Copy Runbook'}
                  </button>
                  {onRunInShell && (
                    <button
                      type="button"
                      onClick={() =>
                        onRunInShell(
                          `bq ls --location="${activeRegionPair.gcpRegion}" ${projectId}.${fedCatalogName}`
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-blue-600 text-white cursor-pointer"
                    >
                      Validate in Cloud Shell
                    </button>
                  )}
                </div>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-80 leading-relaxed">
                {transpiledDatabricksBundle.federatedCliRunbook}
              </pre>
            </div>
          </div>

          {/* MODULE 2: DATABRICKS "DOUBLE-TAX" (DBU + GCE) VS. NATIVE GCP LAKEHOUSE TCO CALCULATOR */}
          <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-4 font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase text-amber-600 dark:text-amber-400">
                  Databricks &ldquo;Double-Tax&rdquo; (DBUs + GCE VMs) vs. 100% Native Google Cloud TCO Calculator
                </h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-sans">
                  On Databricks, you pay a software DBU surcharge ($0.15–$0.70/DBU) on top of underlying GCE VMs—even when interactive clusters sit idle between notebook cells. Compare against BigQuery ($0 idle) + Dataproc Serverless Spark 2.2 ($0.00 DBU tax, &lt;5s startup, scales to $0).
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-extrabold">
                Saves ${databricksTcoComparison.monthlySavingsUsd.toLocaleString()}/mo (${databricksTcoComparison.annualSavingsUsd.toLocaleString()}/yr · -{databricksTcoComparison.savingsPercent}%)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>All-Purpose Nodes:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">{dbxInteractiveNodes} nodes</strong>
                </div>
                <input
                  type="range"
                  min={2}
                  max={64}
                  value={dbxInteractiveNodes}
                  onChange={(e) => setDbxInteractiveNodes(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Cluster Uptime/Day:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">{dbxInteractiveHoursDay}h/day</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={dbxInteractiveHoursDay}
                  onChange={(e) => setDbxInteractiveHoursDay(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Idle Notebook Time:</span>
                  <strong className="text-red-500">{dbxIdlePct}% idle</strong>
                </div>
                <input
                  type="range"
                  min={10}
                  max={85}
                  value={dbxIdlePct}
                  onChange={(e) => setDbxIdlePct(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Batch Jobs Hrs/Day:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">{dbxJobsHoursDay}h/day</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={dbxJobsHoursDay}
                  onChange={(e) => setDbxJobsHoursDay(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>SQL Warehouse Hrs/d:</span>
                  <strong className="text-zinc-900 dark:text-zinc-100">{dbxSqlDbuHoursDay}h/day</strong>
                </div>
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={dbxSqlDbuHoursDay}
                  onChange={(e) => setDbxSqlDbuHoursDay(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="text-[10px] uppercase text-red-500 font-bold">
                  Databricks Total Monthly Bill
                </div>
                <div className="text-lg font-extrabold text-red-500 mt-0.5">
                  ${databricksTcoComparison.totalDatabricksMonthlyUsd.toLocaleString()}/mo
                </div>
                <div className="text-[10px] text-zinc-500">
                  Includes ${databricksTcoComparison.totalDbuTaxOnlyUsd.toLocaleString()}/mo in pure DBU surcharge
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="text-[10px] uppercase text-amber-600 dark:text-amber-400 font-bold">
                  Idle Warm Cluster Waste
                </div>
                <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                  ${databricksTcoComparison.dbxIdleWasteUsd.toLocaleString()}/mo
                </div>
                <div className="text-[10px] text-zinc-500">
                  Burned while waiting between notebook cells
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
                <div className="text-[10px] uppercase text-blue-600 dark:text-blue-400 font-bold">
                  Native GCP (BigQuery + Serverless Spark)
                </div>
                <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                  ${databricksTcoComparison.totalNativeGcpMonthlyUsd.toLocaleString()}/mo
                </div>
                <div className="text-[10px] text-zinc-500">
                  $0.00 DBU tax · $0.00 idle warm cluster waste
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <div className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">
                  Net Annual Savings on Native GCP
                </div>
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${databricksTcoComparison.annualSavingsUsd.toLocaleString()}/yr
                </div>
                <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                  -{databricksTcoComparison.savingsPercent}% lower TCO with BigLake Iceberg
                </div>
              </div>
            </div>
          </div>

          {/* MODULE 3: 1-CLICK DATABRICKS (DBUTILS / DELTA / UNITY) -> NATIVE GOOGLE CLOUD TRANSPILER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-extrabold font-mono uppercase text-blue-600 dark:text-blue-400">
                  Paste Databricks Code (`dbutils` / `DeltaTable`)
                </span>
                <div className="flex items-center gap-1">
                  {[
                    {
                      id: 'DELTA_MERGE_DBUTILS',
                      label: 'Delta Merge + dbutils',
                      code: `# Databricks All-Purpose Cluster Notebook (DBU + GCE Double-Tax)
api_key = dbutils.secrets.get(scope="prod-vault", key="stripe-webhook-secret")
files = dbutils.fs.ls("dbfs:/mnt/raw-events/2026/")

from delta.tables import DeltaTable
df_updates = spark.read.format("delta").load("dbfs:/mnt/bronze/customer_events")
df_catalog = spark.table("main.commerce_silver.active_subscriptions")

delta_target = DeltaTable.forName(spark, "main.commerce_gold.customer_ltv")
(delta_target.alias("t")
  .merge(df_updates.alias("s"), "t.customer_id = s.customer_id")
  .whenMatchedUpdateAll()
  .whenNotMatchedInsertAll()
  .execute())

spark.sql("OPTIMIZE main.commerce_gold.customer_ltv ZORDER BY (region, signup_date)")
spark.sql("VACUUM main.commerce_gold.customer_ltv RETAIN 168 HOURS")`,
                    },
                    {
                      id: 'UNITY_ML_FEATURES',
                      label: 'Unity ML Pipeline',
                      code: `# Databricks Unity Catalog Feature Pipeline
token = dbutils.secrets.get("ml-scope", "vertex-token")
df = spark.read.format("delta").table("main.ml_features.user_clickstream")
df.write.format("delta").mode("overwrite").save("dbfs:/mnt/gold/clickstream_agg")`,
                    },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setDbxSourceTemplate(tpl.id);
                        setDbxCustomCode(tpl.code);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                        dbxSourceTemplate === tpl.id
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={12}
                value={dbxCustomCode}
                onChange={(e) => setDbxCustomCode(e.target.value)}
                className="w-full p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono text-zinc-900 dark:text-zinc-100"
              />

              <div className="space-y-1">
                <div className="text-[10px] font-mono uppercase text-zinc-400 font-bold">
                  Auto-Detected Databricks → Native GCP API Replacements ({transpiledDatabricksBundle.conversions.length}):
                </div>
                {transpiledDatabricksBundle.conversions.map((conv, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{conv}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    Transpiled Native Dataproc Serverless Spark 2.2 + BigLake Iceberg ($0 DBU Tax)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          transpiledDatabricksBundle.nativeServerlessPySpark,
                          'TRANSPILED_PYSPARK'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    >
                      {copiedId === 'TRANSPILED_PYSPARK' ? 'Copied!' : 'Copy PySpark'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitTranspiledSparkLive}
                      disabled={submittingNativeSpark}
                      className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    >
                      {submittingNativeSpark
                        ? 'Submitting to Dataproc Serverless...'
                        : 'Submit Live to Dataproc Serverless Spark'}
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto max-h-64 leading-relaxed">
                  {transpiledDatabricksBundle.nativeServerlessPySpark}
                </pre>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold font-mono text-blue-600 dark:text-blue-400">
                    Transpiled BigQuery Federated Unity SQL &amp; Native BigLake Iceberg DDL
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          transpiledDatabricksBundle.nativeBigQuerySql,
                          'TRANSPILED_BQ_SQL'
                        )
                      }
                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    >
                      {copiedId === 'TRANSPILED_BQ_SQL' ? 'Copied!' : 'Copy SQL'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onOpenBigQuerySql?.(
                          transpiledDatabricksBundle.nativeBigQuerySql
                        )
                      }
                      className="px-3 py-1 rounded-lg text-[10px] font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                    >
                      Open in BigQuery SQL Studio →
                    </button>
                  </div>
                </div>
                <pre className="p-3 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-blue-700 dark:text-blue-300 overflow-x-auto max-h-56 leading-relaxed">
                  {transpiledDatabricksBundle.nativeBigQuerySql}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
