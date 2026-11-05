import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Flame,
  RefreshCw,
  Play,
  Terminal,
  FileCode2,
  Database,
  HardDrive,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  Copy,
  Check,
  Cpu,
  Activity,
  Search,
  Sparkles,
  ArrowRight,
  BookOpen,
  Server,
  Zap,
  Wrench,
  Eye,
  Clock,
  DollarSign,
} from 'lucide-react';

const SPARK_REGIONS = [
  'us-central1',
  'us-east1',
  'us-west1',
  'europe-west1',
  'europe-west4',
  'asia-east1',
  'asia-southeast1',
];

const SUB_TABS = [
  {
    id: 'SERVERLESS_BATCHES',
    label: 'Serverless Batches & Live Fleet',
    shortDesc: 'Dataproc Serverless Spark 3.5 batches, sessions, clusters & $0 idle FinOps',
    icon: Flame,
  },
  {
    id: 'SPARK_CONNECT_NOTEBOOKS',
    label: 'ManagedSparkSession & Notebooks',
    shortDesc: 'Spark Connect (.ipynb) & production PySpark (.py) with BigLake Iceberg & BQ Arrow',
    icon: FileCode2,
  },
  {
    id: 'TROUBLESHOOTING_RCA',
    label: 'SparkApplications & Driver Log RCA',
    shortDesc: '3-Pillar RCA: sparkApplications Stages/SQL + GCS driveroutput tail + Cloud Logs',
    icon: Activity,
  },
  {
    id: 'OPTIMIZER_AND_IAM',
    label: 'PySpark Linter & 7-Role IAM Doctor',
    shortDesc: 'Broadcast join / OOM .toPandas() static analyzer & 1-click Spark IAM role binder',
    icon: ShieldCheck,
  },
];

const WORKLOAD_TEMPLATES = [
  {
    id: 'BIGLAKE_ICEBERG_MEDALLION',
    title: 'BigLake Managed Iceberg + Broadcast Join ETL',
    badge: 'Apache Iceberg + AQE',
    description:
      'Reads Bronze events from BigQuery Storage Read API, broadcast-joins lookup dimension table, and writes ACID Iceberg Silver/Gold tables into BigLake Metastore.',
  },
  {
    id: 'BQ_STORAGE_READ_ARROW',
    title: 'BigQuery Storage Read API (Parallel Arrow Streams)',
    badge: 'gRPC Arrow Zero-Copy',
    description:
      'Streams partitioned BigQuery tables directly into Spark executors over parallel gRPC Arrow channels with predicate pushdown and window analytics.',
  },
  {
    id: 'SPANNER_GRAPH_FEDERATION',
    title: 'Cloud Spanner + BigQuery Federated Fraud Scoring',
    badge: 'Spanner + BigQuery',
    description:
      'Joins operational Cloud Spanner transaction graph edges with historical BigQuery customer features inside a single Serverless Spark 3.5 batch.',
  },
  {
    id: 'PARQUET_SCHEMA_EVOLUTION',
    title: 'GCS Parquet to BigLake Iceberg Compaction',
    badge: 'GCS -> Iceberg',
    description:
      'Reads raw multi-file Parquet drops from Cloud Storage, deduplicates records by event timestamp, and compacts them into 512 MB Iceberg data files.',
  },
];

function buildPySparkBatchCode({
  templateId,
  projectId,
  region,
  bucketName,
  datasetId,
  catalogId,
}) {
  const proj = projectId || 'my-gcp-project';
  const reg = region || 'us-central1';
  const bkt = bucketName || `${proj}-spark-warehouse`;
  const ds = datasetId || 'lakehouse_gold';
  const cat = catalogId || 'biglake_iceberg_catalog';

  if (templateId === 'BQ_STORAGE_READ_ARROW') {
    return `import logging
import sys
from pyspark.sql import SparkSession, Window
from pyspark.sql import functions as F

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("cloudpulse_bq_arrow_spark")

def main():
    spark = (
        SparkSession.builder
        .appName("bq-storage-read-arrow-${proj}")
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.adaptive.coalescePartitions.enabled", "true")
        .config("spark.sql.autoBroadcastJoinThreshold", "104857600")
        .getOrCreate()
    )

    logger.info("Reading BigQuery table via parallel gRPC Arrow Storage Read API...")
    events_df = (
        spark.read.format("bigquery")
        .option("table", "${proj}.${ds}.telemetry_events")
        .option("readDataFormat", "ARROW")
        .option("filter", "event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)")
        .load()
    )

    dim_regions_df = (
        spark.read.format("bigquery")
        .option("table", "${proj}.${ds}.dim_regions")
        .load()
    )

    # Broadcast small dimension table to eliminate 200-partition SortMergeJoin shuffle
    enriched_df = events_df.join(
        F.broadcast(dim_regions_df),
        on="region_id",
        how="left",
    )

    win = Window.partitionBy("region_id", "service_name")
    summary_df = (
        enriched_df.withColumn("p95_latency_ms", F.percentile_approx("latency_ms", 0.95).over(win))
        .groupBy("region_id", "region_name", "service_name")
        .agg(
            F.count("*").alias("request_count"),
            F.avg("latency_ms").alias("avg_latency_ms"),
            F.max("p95_latency_ms").alias("p95_latency_ms"),
        )
    )

    logger.info("Writing aggregated metrics back to BigQuery (${proj}.${ds}.regional_slo_rollup)...")
    (
        summary_df.write.format("bigquery")
        .option("table", "${proj}.${ds}.regional_slo_rollup")
        .option("writeMethod", "direct")
        .mode("overwrite")
        .save()
    )
    logger.info("Serverless Spark 3.5 BigQuery Arrow pipeline completed cleanly.")
    spark.stop()

if __name__ == "__main__":
    main()
`;
  }

  if (templateId === 'SPANNER_GRAPH_FEDERATION') {
    return `import logging
import sys
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("cloudpulse_spanner_bq_federation")

def main():
    spark = (
        SparkSession.builder
        .appName("spanner-bigquery-federation-${proj}")
        .config("spark.sql.adaptive.enabled", "true")
        .getOrCreate()
    )

    logger.info("Reading operational transfers from Cloud Spanner via spark-spanner-connector...")
    spanner_edges_df = (
        spark.read.format("cloud-spanner")
        .option("projectId", "${proj}")
        .option("instanceId", "prod-graph-spanner")
        .option("databaseId", "payments-ledger")
        .option("table", "AccountTransfers")
        .load()
    )

    bq_risk_profiles_df = (
        spark.read.format("bigquery")
        .option("table", "${proj}.${ds}.account_risk_tiers")
        .load()
    )

    scored_df = (
        spanner_edges_df.join(
            F.broadcast(bq_risk_profiles_df),
            on="account_id",
            how="inner",
        )
        .filter(F.col("risk_score") >= 0.75)
        .groupBy("account_id", "risk_tier")
        .agg(
            F.count("*").alias("high_risk_transfer_count"),
            F.sum("amount_usd").alias("total_flagged_usd"),
        )
    )

    (
        scored_df.write.format("bigquery")
        .option("table", "${proj}.${ds}.flagged_graph_accounts")
        .option("writeMethod", "direct")
        .mode("overwrite")
        .save()
    )
    logger.info("Completed federated Cloud Spanner + BigQuery PySpark scoring job.")
    spark.stop()

if __name__ == "__main__":
    main()
`;
  }

  if (templateId === 'PARQUET_SCHEMA_EVOLUTION') {
    return `import logging
import sys
from pyspark.sql import SparkSession, Window
from pyspark.sql import functions as F

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("cloudpulse_parquet_iceberg_compaction")

def main():
    spark = (
        SparkSession.builder
        .appName("parquet-to-iceberg-${proj}")
        .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
        .config("spark.sql.catalog.${cat}", "org.apache.iceberg.spark.SparkCatalog")
        .config("spark.sql.catalog.${cat}.catalog-impl", "org.apache.iceberg.gcp.biglake.BigLakeMetastoreCatalog")
        .config("spark.sql.catalog.${cat}.gcp_project", "${proj}")
        .config("spark.sql.catalog.${cat}.gcp_location", "${reg}")
        .config("spark.sql.catalog.${cat}.blms_catalog", "${cat}")
        .config("spark.sql.catalog.${cat}.warehouse", "gs://${bkt}/iceberg-warehouse")
        .config("spark.sql.adaptive.enabled", "true")
        .getOrCreate()
    )

    logger.info("Reading raw Parquet files from gs://${bkt}/raw-events/...")
    raw_df = spark.read.option("mergeSchema", "true").parquet("gs://${bkt}/raw-events/")

    dedup_win = Window.partitionBy("event_id").orderBy(F.col("ingested_at").desc())
    clean_df = (
        raw_df.withColumn("_rn", F.row_number().over(dedup_win))
        .filter(F.col("_rn") == 1)
        .drop("_rn")
    )

    spark.sql("CREATE NAMESPACE IF NOT EXISTS ${cat}.${ds}")
    clean_df.writeTo("${cat}.${ds}.compacted_events").option("write.target-file-size-bytes", "536870912").createOrReplace()
    logger.info("Successfully compacted Parquet files into BigLake Iceberg table ${cat}.${ds}.compacted_events")
    spark.stop()

if __name__ == "__main__":
    main()
`;
  }

  // Default: BIGLAKE_ICEBERG_MEDALLION
  return `import logging
import sys
from pyspark.sql import SparkSession
from pyspark.sql import functions as F

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("cloudpulse_biglake_iceberg_spark")

def main():
    spark = (
        SparkSession.builder
        .appName("biglake-iceberg-medallion-${proj}")
        .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
        .config("spark.sql.catalog.${cat}", "org.apache.iceberg.spark.SparkCatalog")
        .config("spark.sql.catalog.${cat}.catalog-impl", "org.apache.iceberg.gcp.biglake.BigLakeMetastoreCatalog")
        .config("spark.sql.catalog.${cat}.gcp_project", "${proj}")
        .config("spark.sql.catalog.${cat}.gcp_location", "${reg}")
        .config("spark.sql.catalog.${cat}.blms_catalog", "${cat}")
        .config("spark.sql.catalog.${cat}.warehouse", "gs://${bkt}/iceberg-warehouse")
        .config("spark.sql.adaptive.enabled", "true")
        .config("spark.sql.autoBroadcastJoinThreshold", "104857600")
        .getOrCreate()
    )

    logger.info("Creating BigLake Iceberg namespace ${cat}.${ds} if not exists...")
    spark.sql("CREATE NAMESPACE IF NOT EXISTS ${cat}.${ds}")

    # Sample operational telemetry DataFrame + broadcast dimension table
    events_df = spark.createDataFrame(
        [
            ("evt-1001", "us-central1", "cloud-run-api", 18.4, 200),
            ("evt-1002", "europe-west1", "gke-worker", 42.1, 200),
            ("evt-1003", "us-central1", "cloud-run-api", 145.0, 503),
            ("evt-1004", "us-east1", "spanner-ledger", 6.2, 200),
        ],
        ["event_id", "region", "service_name", "latency_ms", "http_status"],
    )

    regions_lookup_df = spark.createDataFrame(
        [
            ("us-central1", "Iowa (Tier-1 Low Carbon)", 0.93),
            ("us-east1", "South Carolina", 0.35),
            ("europe-west1", "Belgium (EU Sovereign)", 0.89),
        ],
        ["region", "region_display", "cfe_score"],
    )

    # Explicit broadcast() join prevents shuffle across executors
    gold_df = (
        events_df.join(F.broadcast(regions_lookup_df), on="region", how="left")
        .withColumn("is_error", F.when(F.col("http_status") >= 500, F.lit(1)).otherwise(F.lit(0)))
        .withColumn("processed_at", F.current_timestamp())
    )

    logger.info("Writing Gold Iceberg table ${cat}.${ds}.service_telemetry_gold...")
    gold_df.writeTo("${cat}.${ds}.service_telemetry_gold").createOrReplace()
    logger.info("BigLake Iceberg Medallion batch finished cleanly.")
    spark.stop()

if __name__ == "__main__":
    main()
`;
}

function buildSparkConnectNotebookJson({
  projectId,
  region,
  templateId,
  sessionTemplateName,
  pyCode,
}) {
  const proj = projectId || 'my-gcp-project';
  const reg = region || 'us-central1';
  const tplName =
    sessionTemplateName ||
    `projects/${proj}/locations/${reg}/sessionTemplates/spark-connect-template`;

  const cell1Markdown = [
    `# Google Cloud Managed Service for Apache Spark — Interactive Spark Connect Notebook\n`,
    `- **Project**: \`${proj}\` · **Region**: \`${reg}\`\n`,
    `- **Session Engine**: \`ManagedSparkSession\` (\`google-cloud-spark-connect\`) on Dataproc Serverless Runtime \`2.2\` (Spark 3.5)\n`,
    `- **Best Practice**: Never use \`SparkSession.builder.master("local")\` in Managed Spark notebooks. Always connect via \`ManagedSparkSession()\` so stages execute on elastic Google Cloud Serverless executors.`,
  ];

  const cell2SetupCode = [
    `# Cell 1: Initialize ManagedSparkSession (Dataproc Serverless Spark Connect)\n`,
    `from google.cloud.dataproc_v1 import Session\n`,
    `from google.cloud.managed_spark_connect import ManagedSparkSession\n`,
    `from pyspark.sql import functions as F, Window\n\n`,
    `dataproc_config = Session()\n`,
    `dataproc_config.session_template = "${tplName}"\n`,
    `dataproc_config.runtime_config.version = "2.2"\n`,
    `dataproc_config.runtime_config.properties["spark.sql.adaptive.enabled"] = "true"\n`,
    `dataproc_config.runtime_config.properties["spark.sql.autoBroadcastJoinThreshold"] = "104857600"\n\n`,
    `spark = ManagedSparkSession(session_config=dataproc_config)\n`,
    `print("Connected to Managed Spark Serverless Session:", spark.version)`,
  ];

  const cell3TransformCode = [
    `# Cell 2: Distributed PySpark Transformation (${templateId})\n`,
    `# Note: Keep all filtering, windowing, and broadcast joins in Spark before calling .limit(1000).toPandas()\n`,
    ...String(pyCode || '')
      .split('\n')
      .map((l) => `${l}\n`),
  ];

  const cell4VizCode = [
    `# Cell 3: Safe Driver Aggregation & Visualization Guardrail\n`,
    `# Always aggregate or .limit(1000) in Spark before collecting to Pandas on the notebook driver\n`,
    `sample_pdf = (\n`,
    `    spark.range(0, 100000)\n`,
    `    .withColumn("bucket", (F.col("id") % 10).cast("string"))\n`,
    `    .groupBy("bucket")\n`,
    `    .agg(F.count("*").alias("row_count"))\n`,
    `    .orderBy("bucket")\n`,
    `    .limit(100)\n`,
    `    .toPandas()\n`,
    `)\n`,
    `sample_pdf.head(10)`,
  ];

  return JSON.stringify(
    {
      nbformat: 4,
      nbformat_minor: 5,
      metadata: {
        kernelspec: {
          display_name: 'Python 3 (Managed Spark Connect)',
          language: 'python',
          name: 'python3',
        },
        language_info: {
          name: 'python',
          version: '3.11',
        },
      },
      cells: [
        {
          cell_type: 'markdown',
          metadata: {},
          source: cell1Markdown,
        },
        {
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: cell2SetupCode,
        },
        {
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: cell3TransformCode,
        },
        {
          cell_type: 'code',
          execution_count: null,
          metadata: {},
          outputs: [],
          source: cell4VizCode,
        },
      ],
    },
    null,
    2
  );
}

function analyzePySparkCodeStatic(code = '') {
  const text = String(code || '');
  const findings = [];

  if (/\.master\(\s*['"]local/i.test(text)) {
    findings.push({
      id: 'LOCAL_MASTER_BYPASS',
      severity: 'CRITICAL',
      title: 'Local Master Override (.master("local")) Detected',
      detail:
        'Using .master("local[*]") forces execution onto a single VM CPU and bypasses Managed Spark Serverless executors completely.',
      fix: 'Use ManagedSparkSession() in interactive notebooks or SparkSession.builder.getOrCreate() without .master() in batch scripts.',
    });
  }

  if (/\.(toPandas|collect)\(\s*\)/.test(text) && !/\.limit\(\s*\d+\s*\)\s*\.(toPandas|collect)|\.agg\(/.test(text)) {
    findings.push({
      id: 'UNBOUNDED_DRIVER_COLLECT',
      severity: 'HIGH',
      title: 'Unbounded .toPandas() / .collect() Without Prior .agg() or .limit()',
      detail:
        'Pulling unaggregated distributed partitions into the driver JVM/Python process is the #1 cause of Driver OutOfMemoryError (OOM).',
      fix: 'Aggregate with .groupBy(...).agg(...) or cap rows with .limit(1000) in Spark before calling .toPandas().',
    });
  }

  if (/\.join\(/.test(text) && !/broadcast\(/i.test(text)) {
    findings.push({
      id: 'MISSING_BROADCAST_HINT',
      severity: 'MEDIUM',
      title: 'Join Without Explicit F.broadcast() Hint',
      detail:
        'Joining a large fact DataFrame with a small dimension table without F.broadcast(dim_df) can trigger an expensive 200-partition SortMergeJoin shuffle.',
      fix: 'Wrap lookup/dimension DataFrames (< 100 MB) in F.broadcast(dim_df) and enable spark.sql.adaptive.enabled=true.',
    });
  }

  if (/^\s*print\(/m.test(text) && !/logging\.getLogger/.test(text)) {
    findings.push({
      id: 'PRINT_INSTEAD_OF_LOGGING',
      severity: 'LOW',
      title: 'Standard print() Used Instead of Python logging Module',
      detail:
        'Raw print() statements lack structured severity levels in Cloud Logging and can be buffered or lost if an executor crashes.',
      fix: 'Use logging.getLogger(__name__) with logger.info() / logger.error() so entries stream into Cloud Logging with proper severity.',
    });
  }

  if (/pip\s+install|subprocess.*pip/i.test(text)) {
    findings.push({
      id: 'INLINE_PIP_INSTALL',
      severity: 'HIGH',
      title: 'Inline pip install Detected Inside PySpark Script',
      detail:
        'Running pip install inside a batch script only installs packages on the driver node, causing ModuleNotFoundError on worker executors when UDFs run.',
      fix: 'Pass packages via spark.dataproc.pip.packages="pkg==1.0" or configure a Dataproc Session Template.',
    });
  }

  return findings;
}

export default function ManagedSparkStudio({
  projectId,
  initialSubTab = 'SERVERLESS_BATCHES',
  subTabNonce = 0,
  onNavigateTab,
  onOpenBigQuerySql,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [activeSubTab, setActiveSubTab] = useState(
    initialSubTab || 'SERVERLESS_BATCHES'
  );
  const [region, setRegion] = useState('us-central1');
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState('');
  const [overviewData, setOverviewData] = useState(null);

  // Batch submission & code generator state
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    'BIGLAKE_ICEBERG_MEDALLION'
  );
  const [batchIdInput, setBatchIdInput] = useState(
    () => `spark-iceberg-${Date.now().toString().slice(-5)}`
  );
  const [stagingBucket, setStagingBucket] = useState('');
  const [targetDataset, setTargetDataset] = useState('lakehouse_gold');
  const [targetCatalog, setTargetCatalog] = useState('biglake_iceberg_catalog');
  const [customPyCode, setCustomPyCode] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Session / Template creator state
  const [sessionTemplateIdInput, setSessionTemplateIdInput] = useState(
    'spark-connect-iceberg-tpl'
  );
  const [interactiveSessionIdInput, setInteractiveSessionIdInput] = useState(
    () => `spark-connect-${Date.now().toString().slice(-4)}`
  );

  // Diagnostics / RCA inspector state
  const [selectedBatchForRca, setSelectedBatchForRca] = useState('');
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState(null);

  useEffect(() => {
    if (initialSubTab && SUB_TABS.some((t) => t.id === initialSubTab)) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, subTabNonce]);

  const fetchSparkOverview = useCallback(
    async (targetRegion = region, silent = false) => {
      if (!projectId) return;
      if (!silent) setLoading(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/managed-spark/overview`,
          {
            params: { region: targetRegion },
          }
        );
        const data = res.data || {};
        setOverviewData(data);
        if (!stagingBucket) {
          if (Array.isArray(data.buckets) && data.buckets.length > 0) {
            setStagingBucket(data.buckets[0].name);
          } else if (projectId) {
            setStagingBucket(`${projectId}-spark-warehouse`);
          }
        }
        if (Array.isArray(data.datasets) && data.datasets.length > 0) {
          setTargetDataset((prev) =>
            prev === 'lakehouse_gold' ? data.datasets[0].datasetId : prev
          );
        }
        if (Array.isArray(data.biglakeCatalogs) && data.biglakeCatalogs.length > 0) {
          setTargetCatalog((prev) =>
            prev === 'biglake_iceberg_catalog'
              ? data.biglakeCatalogs[0].name
              : prev
          );
        }
        if (
          !selectedBatchForRca &&
          Array.isArray(data.batches) &&
          data.batches.length > 0
        ) {
          setSelectedBatchForRca(data.batches[0].id);
        }
      } catch (err) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            'Failed to load Managed Spark telemetry.'
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [projectId, region, stagingBucket, selectedBatchForRca, onShowError]
  );

  useEffect(() => {
    fetchSparkOverview(region);
  }, [projectId, region]);

  // Auto-poll when any Serverless Batch or Spark Connect Session is in a transitional state
  const hasActiveOrPendingSparkWorkload = useMemo(() => {
    const activeStates = new Set([
      'PENDING',
      'RUNNING',
      'CREATING',
      'CANCELLING',
      'TERMINATING',
    ]);
    return (
      (overviewData?.batches || []).some((b) => activeStates.has(b.state)) ||
      (overviewData?.sessions || []).some((s) => activeStates.has(s.state))
    );
  }, [overviewData]);

  useEffect(() => {
    if (!projectId || !hasActiveOrPendingSparkWorkload) return undefined;
    const timer = setInterval(() => {
      fetchSparkOverview(region, true);
    }, 5000);
    return () => clearInterval(timer);
  }, [projectId, region, hasActiveOrPendingSparkWorkload, fetchSparkOverview]);

  const handleEnableSparkApis = async () => {
    if (!projectId) return;
    setActionBusy('ENABLE_APIS');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'ENABLE_SPARK_APIS',
        }
      );
      onShowToast?.(
        res.data?.message ||
          'Enabled Managed Spark (dataproc.googleapis.com) & BigLake APIs!'
      );
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to enable Managed Spark APIs.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleBrowseGsUriInWorkbench = (gsUri) => {
    const raw = String(gsUri || '').trim();
    if (!raw.startsWith('gs://')) return;
    const withoutScheme = raw.slice(5);
    const slashIdx = withoutScheme.indexOf('/');
    const bucketName =
      slashIdx > 0 ? withoutScheme.slice(0, slashIdx) : withoutScheme;
    const objectName = slashIdx > 0 ? withoutScheme.slice(slashIdx + 1) : '';
    onNavigateTab?.('CLOUD_STORAGE', 'OBJECT_WORKBENCH', {
      bucketName,
      objectName,
    });
  };

  // Regenerate default PySpark code when template or project context changes
  useEffect(() => {
    setCustomPyCode(
      buildPySparkBatchCode({
        templateId: selectedTemplateId,
        projectId,
        region,
        bucketName: stagingBucket,
        datasetId: targetDataset,
        catalogId: targetCatalog,
      })
    );
  }, [
    selectedTemplateId,
    projectId,
    region,
    stagingBucket,
    targetDataset,
    targetCatalog,
  ]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(String(text || ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
    onShowToast?.('Copied to clipboard');
  };

  const handleDownloadFile = (filename, content, mimeType = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast?.(`Downloaded ${filename}`);
  };

  const handleSubmitServerlessBatch = async () => {
    if (!projectId) return;
    if (!stagingBucket) {
      onShowError?.(
        'Select or enter a Cloud Storage staging bucket (gs://...) so CloudPulse can upload your PySpark script and submit the Serverless batch.'
      );
      return;
    }
    setActionBusy('SUBMIT_BATCH');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'SUBMIT_SERVERLESS_BATCH',
          region,
          batchId: batchIdInput,
          stagingBucket,
          pythonScriptContent: customPyCode,
          runtimeVersion: '2.2',
          properties: {
            'spark.sql.adaptive.enabled': 'true',
            'spark.sql.adaptive.coalescePartitions.enabled': 'true',
            'spark.sql.autoBroadcastJoinThreshold': '104857600',
          },
        }
      );
      onShowToast?.(
        res.data?.message || `Submitted Serverless Spark batch ${batchIdInput}`
      );
      setBatchIdInput(`spark-iceberg-${Date.now().toString().slice(-5)}`);
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to submit Dataproc Serverless batch.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleCreateSessionTemplate = async () => {
    if (!projectId) return;
    setActionBusy('CREATE_TEMPLATE');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'CREATE_SESSION_TEMPLATE',
          region,
          templateId: sessionTemplateIdInput,
          runtimeVersion: '2.2',
          properties: {
            'spark.sql.adaptive.enabled': 'true',
            'spark.sql.autoBroadcastJoinThreshold': '104857600',
          },
        }
      );
      onShowToast?.(
        res.data?.message ||
          `Created Session Template ${sessionTemplateIdInput}`
      );
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to create Session Template.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleCreateInteractiveSession = async () => {
    if (!projectId) return;
    setActionBusy('CREATE_SESSION');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'CREATE_INTERACTIVE_SESSION',
          region,
          sessionId: interactiveSessionIdInput,
          runtimeVersion: '2.2',
        }
      );
      onShowToast?.(
        res.data?.message ||
          `Launching Interactive Spark Session ${interactiveSessionIdInput}`
      );
      setInteractiveSessionIdInput(
        `spark-connect-${Date.now().toString().slice(-4)}`
      );
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to launch Interactive Spark Session.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleInspectBatchDiagnostics = async (targetBatchId, targetReg = region) => {
    const idToInspect = targetBatchId || selectedBatchForRca;
    if (!idToInspect) {
      onShowError?.('Select or enter a Batch ID to inspect.');
      return;
    }
    setSelectedBatchForRca(idToInspect);
    setActiveSubTab('TROUBLESHOOTING_RCA');
    setDiagnosticsLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'INSPECT_BATCH_DIAGNOSTICS',
          region: targetReg || region,
          batchId: idToInspect,
          confirmedByModal: true,
        }
      );
      setDiagnosticsResult(res.data);
      onShowToast?.(
        `Loaded 3-Pillar SparkApplications & Driver Output RCA for "${idToInspect}"`
      );
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          `Failed to inspect batch "${idToInspect}".`
      );
    } finally {
      setDiagnosticsLoading(false);
    }
  };

  const handleDeleteBatch = async (bId, bRegion) => {
    setActionBusy(`DEL_BATCH_${bId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'DELETE_BATCH',
          region: bRegion || region,
          batchId: bId,
        }
      );
      onShowToast?.(res.data?.message || `Deleted batch ${bId}`);
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error || err.message || `Failed to delete ${bId}`
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleDeleteSession = async (sId, sRegion) => {
    setActionBusy(`DEL_SESSION_${sId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'DELETE_SESSION',
          region: sRegion || region,
          sessionId: sId,
        }
      );
      onShowToast?.(res.data?.message || `Terminated session ${sId}`);
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error || err.message || `Failed to delete ${sId}`
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleBindMissingSparkIamRoles = async (missingRoles) => {
    setActionBusy('BIND_IAM');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'BIND_SPARK_IAM_ROLES',
          serviceAccount: overviewData?.runtimeServiceAccount,
          rolesToBind: missingRoles,
        }
      );
      onShowToast?.(
        res.data?.message || 'Granted Managed Spark & BigLake IAM roles!'
      );
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to bind Spark IAM roles.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const batches = overviewData?.batches || [];
  const sessions = overviewData?.sessions || [];
  const sessionTemplates = overviewData?.sessionTemplates || [];
  const clusters = overviewData?.clusters || [];
  const buckets = overviewData?.buckets || [];
  const iamRoleMatrix = overviewData?.iamRoleMatrix || [];
  const recentLogs = overviewData?.recentLogs || [];

  const staticFindings = useMemo(
    () => analyzePySparkCodeStatic(customPyCode),
    [customPyCode]
  );

  const missingIamRoles = useMemo(
    () => iamRoleMatrix.filter((r) => !r.granted).map((r) => r.role),
    [iamRoleMatrix]
  );

  const notebookJson = useMemo(
    () =>
      buildSparkConnectNotebookJson({
        projectId,
        region,
        templateId: selectedTemplateId,
        sessionTemplateName:
          sessionTemplates[0]?.fullName ||
          `projects/${projectId}/locations/${region}/sessionTemplates/${sessionTemplateIdInput}`,
        pyCode: customPyCode,
      }),
    [
      projectId,
      region,
      selectedTemplateId,
      sessionTemplates,
      sessionTemplateIdInput,
      customPyCode,
    ]
  );

  const gcloudSubmitCli = useMemo(() => {
    const cleanBkt = stagingBucket || `${projectId}-spark-warehouse`;
    return `gcloud dataproc batches submit pyspark gs://${cleanBkt}/spark-jobs/${batchIdInput}.py --batch=${batchIdInput} --region=${region} --project=${projectId} --version=2.2 --properties="spark.sql.adaptive.enabled=true,spark.sql.autoBroadcastJoinThreshold=104857600"`;
  }, [stagingBucket, projectId, batchIdInput, region]);

  return (
    <div className="space-y-4">
      {/* Studio Top Hero Header */}
      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/20 dark:from-[#16181d] dark:via-[#1c1917] dark:to-[#18181b] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
                <Flame className="w-3.5 h-3.5" />
                GOOGLE CLOUD MANAGED SERVICE FOR APACHE SPARK
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <Zap className="w-3 h-3" />
                Serverless Runtime 2.2 · Spark 3.5 · $0.00/hr Idle
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                ManagedSparkSession (Spark Connect)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Managed Service for Apache Spark &amp; Dataproc Serverless Studio
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Submit zero-cluster Serverless PySpark 3.5 batches, launch interactive{' '}
              <code className="px-1 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 font-mono text-[11px]">
                ManagedSparkSession
              </code>{' '}
              Spark Connect notebooks over BigLake Iceberg &amp; BigQuery Arrow streams, and inspect live{' '}
              <code className="px-1 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 font-mono text-[11px]">
                sparkApplications
              </code>{' '}
              stages/SQL plans &amp; GCS driver logs without running a 24/7 History Server.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                Region:
              </span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                {SPARK_REGIONS.map((r) => (
                  <option key={r} value={r} className="bg-white dark:bg-zinc-900">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchSparkOverview(region)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Live Fleet
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.('DATA_ENGINEER_STUDIO')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Data Engineer Studio
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.('BIGLAKE_STUDIO')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              BigLake Iceberg
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Live Telemetry Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4">
          <div className="rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
              Serverless Batches
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {batches.length}
              </span>
              <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400">
                $0.00/hr idle
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
              Spark Connect Sessions
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {sessions.length}
              </span>
              <span className="text-[10.5px] font-mono text-blue-600 dark:text-blue-400">
                {sessionTemplates.length} templates
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
              Dataproc Clusters
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {clusters.length}
              </span>
              <span className="text-[10.5px] font-mono text-zinc-500">
                GCE / GKE
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
              Staging GCS Buckets
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {buckets.length}
              </span>
              <span className="text-[10.5px] font-mono text-zinc-500 truncate max-w-[95px]">
                {stagingBucket ? `gs://${stagingBucket}` : 'None'}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
              Spark IAM Readiness
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {iamRoleMatrix.filter((r) => r.granted).length}/
                {iamRoleMatrix.length || 7}
              </span>
              <span
                className={`text-[10.5px] font-mono font-semibold ${
                  missingIamRoles.length === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {missingIamRoles.length === 0 ? 'All Bound' : `${missingIamRoles.length} missing`}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 p-3">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
              Code Static Linter
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {staticFindings.length === 0 ? 'PASS' : `${staticFindings.length} WARN`}
              </span>
              <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400">
                AQE + Broadcast
              </span>
            </div>
          </div>
        </div>

        {/* Optional API Enablement Banner when dataproc.googleapis.com is disabled */}
        {overviewData?.apiStatus &&
          overviewData.apiStatus.dataprocEnabled === false && (
            <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">
                    Managed Spark API (<code className="font-mono">dataproc.googleapis.com</code>) is currently disabled on project <code className="font-mono">{projectId}</code>
                  </div>
                  <div className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Enable <code className="font-mono">dataproc.googleapis.com</code> and <code className="font-mono">biglake.googleapis.com</code> in 1 click to submit Serverless Spark 3.5 batches and launch Interactive Spark Connect sessions.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEnableSparkApis}
                disabled={actionBusy === 'ENABLE_APIS'}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                {actionBusy === 'ENABLE_APIS'
                  ? 'Enabling APIs...'
                  : 'Enable Managed Spark & BigLake APIs'}
              </button>
            </div>
          )}

        {/* 4-Pillar Sub-Tab Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-4">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-subtab-id={tab.id}
                data-feature-id={`SPARK_TAB_${tab.id}`}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/80'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mt-0.5 shrink-0 ${
                    isActive ? 'text-white' : 'text-orange-500'
                  }`}
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold leading-snug">
                    {tab.label}
                  </div>
                  <div
                    className={`text-[10.5px] mt-0.5 line-clamp-2 ${
                      isActive ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {tab.shortDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          SUB-TAB 1: SERVERLESS_BATCHES
      ===================================================================== */}
      {activeSubTab === 'SERVERLESS_BATCHES' && (
        <div className="space-y-4">
          {/* 1-Click Serverless Spark 3.5 Batch Launcher */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    1-Click Dataproc Serverless Spark 3.5 Batch Launcher (Auto-Stages Script to GCS)
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Uploads your PySpark script directly into your Cloud Storage staging bucket and submits a real{' '}
                  <code className="font-mono text-[11px]">dataproc.googleapis.com/v1/projects/{projectId}/locations/{region}/batches</code>{' '}
                  workload with Adaptive Query Execution (AQE) and zero idle cluster cost.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                <DollarSign className="w-3.5 h-3.5" />
                Serverless Idle: $0.00/hr vs 24/7 Cluster: $350.40/mo
              </div>
            </div>

            {/* Template selector pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {WORKLOAD_TEMPLATES.map((tpl) => {
                const active = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{tpl.title}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
                        }`}
                      >
                        {tpl.badge}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-1 line-clamp-2 ${
                        active ? 'text-blue-100' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {tpl.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Batch Parameters Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Batch ID (dataproc.v1/batches)
                </label>
                <input
                  type="text"
                  value={batchIdInput}
                  onChange={(e) => setBatchIdInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  GCS Staging &amp; Warehouse Bucket
                </label>
                {buckets.length > 0 ? (
                  <select
                    value={stagingBucket}
                    onChange={(e) => setStagingBucket(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  >
                    {buckets.map((b) => (
                      <option key={b.name} value={b.name}>
                        gs://{b.name} ({b.location})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={`${projectId}-spark-staging`}
                    value={stagingBucket}
                    onChange={(e) => setStagingBucket(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Target BigQuery / Iceberg Namespace
                </label>
                <input
                  type="text"
                  value={targetDataset}
                  onChange={(e) => setTargetDataset(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  BigLake Metastore Catalog
                </label>
                <input
                  type="text"
                  value={targetCatalog}
                  onChange={(e) => setTargetCatalog(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmitServerlessBatch}
                  disabled={actionBusy === 'SUBMIT_BATCH'}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm cursor-pointer transition"
                >
                  <Play className="w-3.5 h-3.5" />
                  {actionBusy === 'SUBMIT_BATCH'
                    ? 'Staging Script & Submitting Batch...'
                    : `Stage to GCS & Submit Serverless Batch (${region})`}
                </button>

                <button
                  type="button"
                  onClick={() => onRunInShell?.(gcloudSubmitCli)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Run gcloud dataproc batches submit in Cloud Shell
                </button>
              </div>

              <button
                type="button"
                onClick={() => setActiveSubTab('SPARK_CONNECT_NOTEBOOKS')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                Edit PySpark Script / Export .ipynb Notebook
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Live Serverless Spark Batches Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Live Dataproc Serverless Batches ({batches.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-zinc-500">
                Scanned regions: {(overviewData?.scannedRegions || [region]).join(', ')}
              </span>
            </div>

            {batches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  No Dataproc Serverless batches found in {(overviewData?.scannedRegions || [region]).join(', ')}.
                </p>
                <p className="text-[11px] text-zinc-500 max-w-xl mx-auto">
                  Click <strong>Stage to GCS &amp; Submit Serverless Batch</strong> above to upload the BigLake Iceberg PySpark script to your bucket and launch a real Serverless Spark 3.5 batch with $0.00/hr idle overhead.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10.5px] font-semibold uppercase text-zinc-500">
                      <th className="py-2 pr-3">Batch ID</th>
                      <th className="py-2 px-3">Region / Runtime</th>
                      <th className="py-2 px-3">State</th>
                      <th className="py-2 px-3">Main Script / Artifact URI</th>
                      <th className="py-2 px-3">DCU Usage &amp; Est. Cost</th>
                      <th className="py-2 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/70 font-mono">
                    {batches.map((b) => {
                      const isFailed = b.state === 'FAILED';
                      const isSucceeded = b.state === 'SUCCEEDED';
                      const isRunning =
                        b.state === 'RUNNING' || b.state === 'PENDING';
                      return (
                        <tr
                          key={`${b.region}:${b.id}`}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50"
                        >
                          <td className="py-2.5 pr-3 font-bold text-zinc-900 dark:text-zinc-100">
                            <div>{b.id}</div>
                            {b.createTime && (
                              <div className="text-[10px] font-normal text-zinc-500">
                                {new Date(b.createTime).toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-700 dark:text-zinc-300">
                            <div>{b.region}</div>
                            <div className="text-[10px] text-zinc-500">
                              Runtime {b.runtimeVersion} ({b.batchType})
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                                isSucceeded
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                  : isFailed
                                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                                  : isRunning
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              {b.state}
                            </span>
                            {b.stateMessage && (
                              <div className="text-[10px] text-rose-500 max-w-xs truncate mt-0.5">
                                {b.stateMessage}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                            {b.mainUri || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-[11px]">
                            <div className="text-zinc-800 dark:text-zinc-200">
                              ${b.estimatedCostUsd.toFixed(4)}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {Math.round(b.milliDcuSeconds / 1000)} DCU-s
                            </div>
                          </td>
                          <td className="py-2.5 pl-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {b.mainUri && b.mainUri.startsWith('gs://') && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleBrowseGsUriInWorkbench(b.mainUri)
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer"
                                  title={`Open ${b.mainUri} in Cloud Storage Object Workbench`}
                                >
                                  <HardDrive className="w-3 h-3" />
                                  Browse in GCS →
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleInspectBatchDiagnostics(b.id, b.region)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-blue-500" />
                                Inspect RCA
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBatch(b.id, b.region)}
                                disabled={actionBusy === `DEL_BATCH_${b.id}`}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-pointer"
                                title="Delete Batch"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Interactive Spark Connect Sessions & Dataproc Clusters Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Interactive Sessions */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Interactive Spark Connect Sessions ({sessions.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCreateInteractiveSession}
                  disabled={actionBusy === 'CREATE_SESSION'}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  <Play className="w-3 h-3" />
                  {actionBusy === 'CREATE_SESSION'
                    ? 'Launching...'
                    : 'New Spark Session'}
                </button>
              </div>
              {sessions.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No active interactive sessions. Use{' '}
                  <code className="font-mono">ManagedSparkSession()</code> in a notebook or click{' '}
                  <strong>New Spark Session</strong> to launch a serverless Spark Connect endpoint.
                </p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((s) => (
                    <div
                      key={`${s.region}:${s.id}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {s.id}{' '}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            {s.state}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-zinc-500">
                          {s.region} · Runtime {s.runtimeVersion} · Kernel {s.kernel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(s.id, s.region)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer"
                        title="Terminate & Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Standard Dataproc Clusters */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Managed Dataproc Clusters on GCE ({clusters.length})
                  </h3>
                </div>
                <span className="text-[10.5px] font-mono text-zinc-500">
                  dataproc.v1/clusters
                </span>
              </div>
              {clusters.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  Zero persistent GCE Dataproc clusters running ($0.00/hr idle cluster burn). All Spark workloads are eligible for Serverless execution.
                </p>
              ) : (
                <div className="space-y-2">
                  {clusters.map((c) => (
                    <div
                      key={`${c.region}:${c.clusterName}`}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {c.clusterName}{' '}
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {c.state}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-zinc-500">
                          {c.region} · 1x {c.masterType} + {c.workerCount}x {c.workerType} ({c.imageVersion})
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 2: SPARK_CONNECT_NOTEBOOKS
      ===================================================================== */}
      {activeSubTab === 'SPARK_CONNECT_NOTEBOOKS' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-blue-500" />
                  ManagedSparkSession (Spark Connect) Notebook &amp; Batch Script Studio
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Per Google Cloud Managed Spark best practices, interactive notebooks connect via{' '}
                  <code className="font-mono text-[11px]">
                    from google.cloud.managed_spark_connect import ManagedSparkSession
                  </code>{' '}
                  while batch jobs submitted via <code className="font-mono text-[11px]">gcloud dataproc batches submit pyspark</code> use standard{' '}
                  <code className="font-mono text-[11px]">SparkSession.builder.getOrCreate()</code> and Python <code className="font-mono text-[11px]">logging</code>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFile(
                      `managed_spark_${selectedTemplateId.toLowerCase()}.ipynb`,
                      notebookJson,
                      'application/json'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Spark Connect .ipynb
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleDownloadFile(
                      `${batchIdInput}.py`,
                      customPyCode,
                      'text/x-python'
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Batch .py
                </button>
              </div>
            </div>

            {/* Session Template Provisioner Bar */}
            <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Serverless Spark Session Template (projects/{projectId}/locations/{region}/sessionTemplates/{sessionTemplateIdInput})
                </div>
                <div className="text-[11px] text-zinc-500">
                  Pre-configures Runtime 2.2 (Spark 3.5), Adaptive Query Execution (AQE), and 100 MB Auto-Broadcast threshold for{' '}
                  <code className="font-mono">ManagedSparkSession</code> notebooks.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sessionTemplateIdInput}
                  onChange={(e) => setSessionTemplateIdInput(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={handleCreateSessionTemplate}
                  disabled={actionBusy === 'CREATE_TEMPLATE'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {actionBusy === 'CREATE_TEMPLATE'
                    ? 'Creating...'
                    : 'Create Session Template'}
                </button>
              </div>
            </div>

            {/* Editable PySpark Code Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                  PySpark 3.5 Script ({selectedTemplateId}.py)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(customPyCode, 'PY_CODE')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                  >
                    {copiedId === 'PY_CODE' ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    Copy PySpark Code
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitServerlessBatch}
                    disabled={actionBusy === 'SUBMIT_BATCH'}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    Submit as Serverless Batch
                  </button>
                </div>
              </div>
              <textarea
                rows={18}
                value={customPyCode}
                onChange={(e) => setCustomPyCode(e.target.value)}
                className="w-full rounded-xl bg-[#0d1117] text-emerald-300 font-mono text-xs p-4 border border-zinc-800 focus:outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 3: TROUBLESHOOTING_RCA
      ===================================================================== */}
      {activeSubTab === 'TROUBLESHOOTING_RCA' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  3-Pillar Spark Troubleshooting &amp; Root Cause Analysis (sparkApplications API + GCS Driver Output)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Correlates{' '}
                  <strong>Pillar 1 (Logs &amp; Bounded 32 KB GCS driveroutput Tail)</strong>,{' '}
                  <strong>Pillar 2 (Dataproc Serverless sparkApplications Stages, Executors &amp; SQL Plans)</strong>, and{' '}
                  <strong>Pillar 3 (Automated Anti-Pattern &amp; OOM/IAM Remediation)</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedBatchForRca}
                  onChange={(e) => setSelectedBatchForRca(e.target.value)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Select Batch ID...</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} ({b.state} · {b.region})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    handleInspectBatchDiagnostics(selectedBatchForRca, region)
                  }
                  disabled={diagnosticsLoading || !selectedBatchForRca}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  {diagnosticsLoading ? 'Inspecting...' : 'Run 3-Pillar RCA'}
                </button>
              </div>
            </div>

            {diagnosticsResult ? (
              <div className="space-y-4">
                {/* Automated RCA Findings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(diagnosticsResult.rcaFindings || []).map((f, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-3.5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {f.category}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            f.severity === 'CRITICAL' || f.severity === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                        {f.evidence}
                      </p>
                      <p className="text-[11px] text-blue-600 dark:text-blue-400">
                        Remediation: {f.remediation}
                      </p>
                    </div>
                  ))}
                </div>

                {/* SparkApplications Stages / Executors / SQL Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10.5px] text-zinc-500 uppercase font-semibold">
                      Spark Applications
                    </div>
                    <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {(diagnosticsResult.sparkApplications || []).length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10.5px] text-zinc-500 uppercase font-semibold">
                      Stages Inspected
                    </div>
                    <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {(diagnosticsResult.stages || []).length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10.5px] text-zinc-500 uppercase font-semibold">
                      Executors Summary
                    </div>
                    <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {(diagnosticsResult.executors || []).length}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10.5px] text-zinc-500 uppercase font-semibold">
                      Spark SQL Queries
                    </div>
                    <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {(diagnosticsResult.sqlQueries || []).length}
                    </div>
                  </div>
                </div>

                {/* Bounded 32KB GCS driveroutput tail */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                      GCS Driver Output Stream Tail (Bounded 32 KB Range Read):{' '}
                      {diagnosticsResult.batch?.outputUri || 'Cloud Logging Stream'}
                    </span>
                  </div>
                  <pre className="rounded-xl bg-[#0d1117] text-zinc-200 font-mono text-[11px] p-4 max-h-72 overflow-y-auto border border-zinc-800 whitespace-pre-wrap">
                    {diagnosticsResult.driverOutputTail ||
                      (diagnosticsResult.logEntries || [])
                        .map(
                          (l) => `[${l.timestamp}] [${l.severity}] ${l.message}`
                        )
                        .join('\n') ||
                      'No driveroutput or batch log entries emitted yet for this batch.'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Recent Live Cloud Logging Entries (cloud_dataproc_batch / session / cluster)
                </div>
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-zinc-500">
                    Select a batch above and click <strong>Run 3-Pillar RCA</strong> to query the Dataproc Serverless{' '}
                    <code className="font-mono">sparkApplications</code> API and stream the GCS driver output tail.
                  </p>
                ) : (
                  <div className="rounded-xl bg-[#0d1117] border border-zinc-800 p-3 max-h-72 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                    {recentLogs.map((log, i) => (
                      <div key={log.insertId || i} className="text-zinc-300">
                        <span className="text-zinc-500">[{log.timestamp}]</span>{' '}
                        <span className="text-orange-400 font-bold">
                          [{log.batchOrClusterId}]
                        </span>{' '}
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 4: OPTIMIZER_AND_IAM
      ===================================================================== */}
      {activeSubTab === 'OPTIMIZER_AND_IAM' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Static PySpark Code Linter */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Pre-Submission PySpark Optimizer &amp; OOM Guard
                </h3>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  staticFindings.length === 0
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                }`}
              >
                {staticFindings.length === 0
                  ? '0 Anti-Patterns Found'
                  : `${staticFindings.length} Finding(s)`}
              </span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Audits your active PySpark script against Google Cloud Managed Spark rules: no{' '}
              <code className="font-mono">.master("local")</code>, bounded{' '}
              <code className="font-mono">.toPandas()</code>, explicit{' '}
              <code className="font-mono">F.broadcast()</code> joins, structured{' '}
              <code className="font-mono">logging</code>, and no inline{' '}
              <code className="font-mono">pip install</code>.
            </p>

            {staticFindings.length === 0 ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-emerald-800 dark:text-emerald-200">
                    PySpark Script Passes All Managed Spark Best-Practice Checks
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-300/90">
                    Adaptive Query Execution (AQE), explicit broadcast join hints, and structured Python logging are properly configured.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {staticFindings.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {f.title}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      {f.detail}
                    </p>
                    <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                      Fix: {f.fix}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: 7-Role Managed Spark IAM Doctor */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  7-Role Managed Spark &amp; BigLake IAM Doctor
                </h3>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                  Runtime SA: {overviewData?.runtimeServiceAccount || 'Detecting...'}
                </p>
              </div>
              {missingIamRoles.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleBindMissingSparkIamRoles(missingIamRoles)}
                  disabled={actionBusy === 'BIND_IAM'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {actionBusy === 'BIND_IAM'
                    ? 'Binding IAM Roles...'
                    : `Grant ${missingIamRoles.length} Missing Role(s)`}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {iamRoleMatrix.map((item) => (
                <div
                  key={item.role}
                  className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                      {item.role}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {item.purpose}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                      item.granted
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {item.granted ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        BOUND
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        MISSING
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
