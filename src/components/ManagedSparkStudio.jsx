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
  {
    id: 'LIGHTNING_BIGFRAMES_LINEAGE',
    label: 'Lightning Engine, BigFrames & Lineage',
    shortDesc: 'Spark Lightning Engine (C++), BigFrames v2.0 & Data Lineage Blast-Radius Inspector',
    icon: Zap,
  },
];

const WORKLOAD_TEMPLATES = [
  {
    id: 'BIGLAKE_ICEBERG_MEDALLION',
    title: 'BigLake Managed Iceberg + Broadcast Join ETL',
    badge: 'Apache Iceberg + AQE',
    batchPrefix: 'spark-iceberg-medallion',
    defaultNamespace: 'lakehouse_gold',
    fourthFieldLabel: 'BigLake Metastore Catalog',
    defaultCatalogOrTarget: 'biglake_iceberg_catalog',
    sourceFlow: 'BigQuery Storage Read + Regional Dim Lookup',
    transformFlow: 'F.broadcast() Join + HTTP 5xx Error Flagging',
    sinkFlow: 'BigLake Iceberg ACID Table (service_telemetry_gold)',
    engineBadges: [
      'Runtime 2.2 (Spark 3.5)',
      'BigLakeMetastoreCatalog',
      'F.broadcast() <= 100MB',
      'AQE Coalesce',
    ],
    sparkProperties: {
      'spark.sql.adaptive.enabled': 'true',
      'spark.sql.adaptive.coalescePartitions.enabled': 'true',
      'spark.sql.autoBroadcastJoinThreshold': '104857600',
      'spark.sql.extensions':
        'org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions',
    },
    description:
      'Reads Bronze events from BigQuery Storage Read API, broadcast-joins lookup dimension table, and writes ACID Iceberg Silver/Gold tables into BigLake Metastore.',
  },
  {
    id: 'BQ_STORAGE_READ_ARROW',
    title: 'BigQuery Storage Read API (Parallel Arrow Streams)',
    badge: 'gRPC Arrow Zero-Copy',
    batchPrefix: 'spark-bq-arrow-stream',
    defaultNamespace: 'telemetry_slo_analytics',
    fourthFieldLabel: 'Arrow Read Stream Mode & Window',
    defaultCatalogOrTarget: 'ARROW_GRPC_7D_WINDOW',
    sourceFlow: 'BigQuery Capacitor Partitioned Table (telemetry_events)',
    transformFlow: 'Parallel gRPC Arrow Read + P95 Window Percentile',
    sinkFlow: 'BigQuery Direct Storage Write API (regional_slo_rollup)',
    engineBadges: [
      'Runtime 2.2 (Spark 3.5)',
      'readDataFormat=ARROW',
      'writeMethod=direct',
      'Window P95 Rollup',
    ],
    sparkProperties: {
      'spark.sql.adaptive.enabled': 'true',
      'spark.sql.adaptive.coalescePartitions.enabled': 'true',
      'spark.sql.adaptive.skewJoin.enabled': 'true',
      'spark.sql.autoBroadcastJoinThreshold': '104857600',
    },
    description:
      'Streams partitioned BigQuery tables directly into Spark executors over parallel gRPC Arrow channels with predicate pushdown and window analytics.',
  },
  {
    id: 'SPANNER_GRAPH_FEDERATION',
    title: 'Cloud Spanner + BigQuery Federated Fraud Scoring',
    badge: 'Spanner + BigQuery',
    batchPrefix: 'spark-spanner-fraud',
    defaultNamespace: 'fraud_risk_warehouse',
    fourthFieldLabel: 'Spanner Instance / Graph Database',
    defaultCatalogOrTarget: 'prod-graph-spanner/payments-ledger',
    sourceFlow: 'Cloud Spanner (AccountTransfers) + BigQuery (account_risk_tiers)',
    transformFlow: 'Cross-Engine Broadcast Join + Risk Score >= 0.75 Filter',
    sinkFlow: 'BigQuery Fraud Alert Table (flagged_graph_accounts)',
    engineBadges: [
      'Runtime 2.2 (Spark 3.5)',
      'spark-spanner-connector',
      'Cross-Engine Federation',
      'Direct Write API',
    ],
    sparkProperties: {
      'spark.sql.adaptive.enabled': 'true',
      'spark.sql.adaptive.skewJoin.enabled': 'true',
      'spark.dataproc.scaling.version': '2',
    },
    description:
      'Joins operational Cloud Spanner transaction graph edges with historical BigQuery customer features inside a single Serverless Spark 3.5 batch.',
  },
  {
    id: 'PARQUET_SCHEMA_EVOLUTION',
    title: 'GCS Parquet to BigLake Iceberg Compaction',
    badge: 'GCS -> Iceberg',
    batchPrefix: 'spark-parquet-compact',
    defaultNamespace: 'iceberg_compacted_silver',
    fourthFieldLabel: 'BigLake Catalog & 512MB Compaction Target',
    defaultCatalogOrTarget: 'biglake_iceberg_512mb',
    sourceFlow: 'Cloud Storage Multi-File Parquet (gs://.../raw-events/)',
    transformFlow: 'mergeSchema=true + Window Row-Number Deduplication',
    sinkFlow: '512 MB Compacted BigLake Iceberg Table (compacted_events)',
    engineBadges: [
      'Runtime 2.2 (Spark 3.5)',
      'mergeSchema=true',
      'target-file-size=512MB',
      'Window Dedup',
    ],
    sparkProperties: {
      'spark.sql.adaptive.enabled': 'true',
      'spark.sql.adaptive.coalescePartitions.enabled': 'true',
      'spark.sql.extensions':
        'org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions',
      'spark.sql.parquet.mergeSchema': 'true',
    },
    description:
      'Reads raw multi-file Parquet drops from Cloud Storage, deduplicates records by event timestamp, and compacts them into 512 MB Iceberg data files.',
  },
];

const SPARK_HARDWARE_PROFILES = [
  {
    id: 'MICRO_ETL',
    title: 'Micro Serverless (2–4 Executors)',
    badge: '4g Heap · ~$0.0048/run',
    estimatedCostUsd: 0.0048,
    dcuSummary: '110 DCU-s · Fast Dev & Dimension Lookup',
    properties: {
      'spark.dynamicAllocation.enabled': 'true',
      'spark.dynamicAllocation.minExecutors': '2',
      'spark.dynamicAllocation.maxExecutors': '4',
      'spark.driver.memory': '4g',
      'spark.executor.memory': '4g',
    },
  },
  {
    id: 'PROD_LAKEHOUSE',
    title: 'Production AQE Lakehouse (2–16 Executors)',
    badge: '8g Heap · ~$0.0142/run',
    estimatedCostUsd: 0.0142,
    dcuSummary: '260 DCU-s · Dynamic Scaling v2 + AQE',
    properties: {
      'spark.dataproc.scaling.version': '2',
      'spark.dynamicAllocation.enabled': 'true',
      'spark.dynamicAllocation.minExecutors': '2',
      'spark.dynamicAllocation.maxExecutors': '16',
      'spark.driver.memory': '8g',
      'spark.executor.memory': '8g',
    },
  },
  {
    id: 'HEAVY_SHUFFLE',
    title: 'Heavy Shuffle & SkewJoin Surgeon (4–32 Executors)',
    badge: '16g Heap · ~$0.0320/run',
    estimatedCostUsd: 0.032,
    dcuSummary: '580 DCU-s · SkewJoin + 64MB Partition Target',
    properties: {
      'spark.dataproc.scaling.version': '2',
      'spark.dynamicAllocation.enabled': 'true',
      'spark.dynamicAllocation.minExecutors': '4',
      'spark.dynamicAllocation.maxExecutors': '32',
      'spark.driver.memory': '16g',
      'spark.executor.memory': '16g',
      'spark.sql.adaptive.skewJoin.enabled': 'true',
      'spark.sql.adaptive.advisoryPartitionSizeInBytes': '67108864',
    },
  },
  {
    id: 'LIGHTNING_TURBO',
    title: 'Lightning Engine C++ Vectorized (2–16 Executors)',
    badge: 'Native SIMD C++ · ~$0.0095/run',
    estimatedCostUsd: 0.0095,
    dcuSummary: '175 DCU-s · -38% Compute Time via C++ Vectorization',
    properties: {
      'spark.dataproc.engine': 'lightningEngine',
      'spark.dataproc.scaling.version': '2',
      'spark.dynamicAllocation.enabled': 'true',
      'spark.dynamicAllocation.minExecutors': '2',
      'spark.dynamicAllocation.maxExecutors': '16',
      'spark.driver.memory': '8g',
      'spark.executor.memory': '8g',
    },
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

    logger.info("Reading BigQuery table via parallel gRPC Arrow Storage Read API (mode=${cat})...")
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

    logger.info("Reading operational transfers from Cloud Spanner (${cat}) via spark-spanner-connector...")
    spanner_edges_df = (
        spark.read.format("cloud-spanner")
        .option("projectId", "${proj}")
        .option("instanceId", "${cat.split('/')[0] || 'prod-graph-spanner'}")
        .option("databaseId", "${cat.split('/')[1] || 'payments-ledger'}")
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
  onOpenLogsExplorer,
  onRunInShell,
  onOpenShellWithCommand,
  onShowToast,
  onShowError,
}) {
  const shellRunner = onOpenShellWithCommand || onRunInShell;
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
    () => `spark-iceberg-medallion-${Date.now().toString().slice(-4)}`
  );
  const [stagingBucket, setStagingBucket] = useState('');
  const [targetDataset, setTargetDataset] = useState('lakehouse_gold');
  const [targetCatalog, setTargetCatalog] = useState('biglake_iceberg_catalog');
  const [customPyCode, setCustomPyCode] = useState('');
  const [customSparkProperties, setCustomSparkProperties] = useState({
    'spark.sql.adaptive.enabled': 'true',
    'spark.sql.adaptive.coalescePartitions.enabled': 'true',
    'spark.sql.autoBroadcastJoinThreshold': '104857600',
    'spark.sql.extensions':
      'org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions',
  });
  const [launcherPreviewTab, setLauncherPreviewTab] = useState('SCRIPT');
  const [selectedHardwareProfileId, setSelectedHardwareProfileId] =
    useState('PROD_LAKEHOUSE');
  const [preflightXrayLoading, setPreflightXrayLoading] = useState(false);
  const [preflightXrayResult, setPreflightXrayResult] = useState(null);
  const [stagedScriptReceipt, setStagedScriptReceipt] = useState(null);
  const [stageScriptBusy, setStageScriptBusy] = useState(false);
  const [bootstrapBusy, setBootstrapBusy] = useState(false);
  const [copiedId, setCopiedId] = useState('');

  const activeTemplateMeta = useMemo(
    () =>
      WORKLOAD_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      WORKLOAD_TEMPLATES[0],
    [selectedTemplateId]
  );

  const activeHardwareProfile = useMemo(
    () =>
      SPARK_HARDWARE_PROFILES.find((p) => p.id === selectedHardwareProfileId) ||
      SPARK_HARDWARE_PROFILES[1],
    [selectedHardwareProfileId]
  );

  const handleSelectHardwareProfile = useCallback(
    (profile) => {
      if (!profile) return;
      setSelectedHardwareProfileId(profile.id);
      setCustomSparkProperties((prev) => {
        const cleaned = { ...prev };
        delete cleaned['spark.dataproc.engine'];
        delete cleaned['spark.dataproc.scaling.version'];
        delete cleaned['spark.dynamicAllocation.enabled'];
        delete cleaned['spark.dynamicAllocation.minExecutors'];
        delete cleaned['spark.dynamicAllocation.maxExecutors'];
        delete cleaned['spark.driver.memory'];
        delete cleaned['spark.executor.memory'];
        delete cleaned['spark.sql.adaptive.skewJoin.enabled'];
        delete cleaned['spark.sql.adaptive.advisoryPartitionSizeInBytes'];
        return {
          ...(activeTemplateMeta.sparkProperties || {}),
          ...cleaned,
          ...(profile.properties || {}),
        };
      });
      onShowToast?.(
        `Applied "${profile.title}" hardware profile (${profile.dcuSummary})`
      );
    },
    [activeTemplateMeta, onShowToast]
  );

  const handleRunPreflightXray = useCallback(
    async (overrideCode, overrideDataset, overrideBucket, overrideBatchId, overrideProps) => {
      if (!projectId) return;
      setPreflightXrayLoading(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
          {
            action: 'PREFLIGHT_SPARK_BATCH_XRAY',
            region,
            batchId: overrideBatchId || batchIdInput,
            stagingBucket: overrideBucket || stagingBucket,
            datasetId: overrideDataset || targetDataset,
            pythonScriptContent:
              overrideCode !== undefined ? overrideCode : customPyCode,
            properties: overrideProps || customSparkProperties,
          }
        );
        setPreflightXrayResult(res.data);
      } catch (err) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            'Failed to run 6-Gate Pre-Flight Spark AST X-Ray.'
        );
      } finally {
        setPreflightXrayLoading(false);
      }
    },
    [
      projectId,
      region,
      batchIdInput,
      stagingBucket,
      targetDataset,
      customPyCode,
      customSparkProperties,
      onShowError,
    ]
  );

  const handleStageScriptToGcsOnly = async () => {
    if (!projectId) return;
    setStageScriptBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'STAGE_SCRIPT_TO_GCS_ONLY',
          region,
          batchId: batchIdInput,
          stagingBucket: stagingBucket || `${projectId}-spark-warehouse`,
          pythonScriptContent: customPyCode,
        }
      );
      setStagedScriptReceipt(res.data);
      if (res.data?.bucketName && !stagingBucket) {
        setStagingBucket(res.data.bucketName);
      }
      onShowToast?.(
        res.data?.message ||
          `Staged ${batchIdInput}.py to ${res.data?.stagedUri} ($0.00 compute)`
      );
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to stage PySpark script to GCS.'
      );
    } finally {
      setStageScriptBusy(false);
    }
  };

  const handleBootstrapSparkDemoAssets = async () => {
    if (!projectId) return;
    setBootstrapBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'BOOTSTRAP_SPARK_DEMO_ASSETS',
          region,
          datasetId: targetDataset || 'lakehouse_gold',
        }
      );
      onShowToast?.(
        res.data?.message ||
          `Bootstrapped BigQuery dataset "${targetDataset}" and seeded live source tables!`
      );
      await fetchSparkOverview(region, true);
      await handleRunPreflightXray();
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to bootstrap BigQuery Spark source tables.'
      );
    } finally {
      setBootstrapBusy(false);
    }
  };

  const handleSelectWorkloadTemplate = useCallback(
    (tpl) => {
      if (!tpl) return;
      const suffix = Date.now().toString().slice(-4);
      const nextBatchId = `${tpl.batchPrefix || 'spark-batch'}-${suffix}`;
      const nextDataset = tpl.defaultNamespace || 'lakehouse_gold';
      const nextCatalog =
        tpl.defaultCatalogOrTarget || 'biglake_iceberg_catalog';
      const nextProps = {
        ...(tpl.sparkProperties || {
          'spark.sql.adaptive.enabled': 'true',
          'spark.sql.autoBroadcastJoinThreshold': '104857600',
        }),
        ...(activeHardwareProfile?.properties || {}),
      };
      const nextCode = buildPySparkBatchCode({
        templateId: tpl.id,
        projectId,
        region,
        bucketName: stagingBucket,
        datasetId: nextDataset,
        catalogId: nextCatalog,
      });

      setSelectedTemplateId(tpl.id);
      setBatchIdInput(nextBatchId);
      setTargetDataset(nextDataset);
      setTargetCatalog(nextCatalog);
      setCustomSparkProperties(nextProps);
      setSyntaxValidation(null);
      setStagedScriptReceipt(null);
      setCustomPyCode(nextCode);
      if (launcherPreviewTab === 'XRAY_DAG') {
        handleRunPreflightXray(
          nextCode,
          nextDataset,
          stagingBucket,
          nextBatchId,
          nextProps
        );
      }
      onShowToast?.(
        `Loaded "${tpl.title}" blueprint (${nextBatchId}.py -> ${tpl.sinkFlow})`
      );
    },
    [
      projectId,
      region,
      stagingBucket,
      activeHardwareProfile,
      launcherPreviewTab,
      handleRunPreflightXray,
      onShowToast,
    ]
  );

  // Live BigQuery & GCS Schema Introspector + py_compile Validator state
  const [introspectTableId, setIntrospectTableId] = useState('');
  const [gcsPrefixInput, setGcsPrefixInput] = useState('');
  const [introspectLoading, setIntrospectLoading] = useState(false);
  const [introspectResult, setIntrospectResult] = useState(null);
  const [syntaxValidation, setSyntaxValidation] = useState(null);
  const [syntaxValidating, setSyntaxValidating] = useState(false);

  // Session / Template creator state
  const [sessionTemplateIdInput, setSessionTemplateIdInput] = useState(
    'spark-connect-iceberg-tpl'
  );
  const [interactiveSessionIdInput, setInteractiveSessionIdInput] = useState(
    () => `spark-connect-${Date.now().toString().slice(-4)}`
  );

  // Diagnostics / RCA inspector & GCS Driver Log Regex Search state
  const [selectedBatchForRca, setSelectedBatchForRca] = useState('');
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsResult, setDiagnosticsResult] = useState(null);
  const [driverLogSearchPattern, setDriverLogSearchPattern] = useState(
    'ERROR|Exception|Traceback|OutOfMemoryError|Py4JJavaError|Caused by'
  );
  const [driverLogSearching, setDriverLogSearching] = useState(false);
  const [driverLogSearchResult, setDriverLogSearchResult] = useState(null);

  // Lightning Engine, BigFrames v2.0 & Data Lineage Blast-Radius state
  const [lineageCatalogLoading, setLineageCatalogLoading] = useState(false);
  const [lineageCatalogResult, setLineageCatalogResult] = useState(null);

  const handleAnalyzeSparkKnowledgeCatalogAndLineage = useCallback(
    async (overrideDs, overrideTbl) => {
      if (!projectId) return;
      setLineageCatalogLoading(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
          {
            action: 'ANALYZE_SPARK_KNOWLEDGE_CATALOG_AND_LINEAGE',
            region,
            datasetId: overrideDs !== undefined ? overrideDs : targetDataset,
            tableId:
              overrideTbl !== undefined ? overrideTbl : introspectTableId,
            stagingBucket,
          }
        );
        setLineageCatalogResult(res.data);
        onShowToast?.(
          `Analyzed Data Lineage Blast Radius (${res.data?.downstreamBlastRadius?.totalAffected || 0} downstream links) & synthesized BigFrames v2.0 + Lightning Engine config`
        );
      } catch (err) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            'Failed to analyze Data Lineage & Knowledge Catalog.'
        );
      } finally {
        setLineageCatalogLoading(false);
      }
    },
    [
      projectId,
      region,
      targetDataset,
      introspectTableId,
      stagingBucket,
      onShowToast,
      onShowError,
    ]
  );

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

  const copyToClipboard = (text, label) => handleCopy(text, label);

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

  const handleIntrospectSparkDataAssets = useCallback(
    async (overrideDataset, overrideTable, overrideGcsUri) => {
      if (!projectId) return;
      const ds = overrideDataset !== undefined ? overrideDataset : targetDataset;
      const tbl = overrideTable !== undefined ? overrideTable : introspectTableId;
      const gcs =
        overrideGcsUri !== undefined
          ? overrideGcsUri
          : gcsPrefixInput || (stagingBucket ? `gs://${stagingBucket}` : '');
      setIntrospectLoading(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
          {
            action: 'INTROSPECT_SPARK_DATA_ASSETS',
            region,
            datasetId: ds,
            tableId: tbl,
            gcsUri: gcs,
          }
        );
        const data = res.data || {};
        setIntrospectResult(data);
        if (data.selectedTable?.tableId && !tbl) {
          setIntrospectTableId(data.selectedTable.tableId);
        }
        onShowToast?.(
          data.selectedTable?.tableId
            ? `Introspected live schema for ${projectId}.${ds}.${data.selectedTable.tableId} (${(data.selectedTable.columns || []).length} columns)`
            : `Discovered ${(data.tables || []).length} BigQuery tables & ${(data.gcsObjects || []).length} GCS objects`
        );
      } catch (err) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            'Failed to introspect BigQuery / GCS assets.'
        );
      } finally {
        setIntrospectLoading(false);
      }
    },
    [projectId, region, targetDataset, introspectTableId, gcsPrefixInput, stagingBucket, onShowToast, onShowError]
  );

  const handleValidatePySparkSyntax = async () => {
    if (!projectId) return;
    setSyntaxValidating(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'VALIDATE_PYSPARK_SYNTAX',
          pythonScriptContent: customPyCode,
        }
      );
      setSyntaxValidation(res.data);
      if (res.data?.syntaxValid) {
        onShowToast?.(
          res.data.message || 'PySpark 3.5 script passed python3 -m py_compile!'
        );
      } else {
        onShowError?.(
          res.data?.compilerOutput || 'Python syntax error detected in script.'
        );
      }
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to validate PySpark syntax.'
      );
    } finally {
      setSyntaxValidating(false);
    }
  };

  const handleSearchGcsDriverLog = async (overrideUri, overridePattern) => {
    if (!projectId) return;
    const outputUri =
      overrideUri ||
      diagnosticsResult?.batch?.outputUri ||
      batches.find((b) => b.id === selectedBatchForRca)?.outputUri;
    if (!outputUri) {
      onShowError?.(
        'Select a batch with a GCS driver output URI (or run 3-Pillar RCA first) to search the driver log.'
      );
      return;
    }
    setDriverLogSearching(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'SEARCH_GCS_DRIVER_LOG',
          outputUri,
          pattern: overridePattern || driverLogSearchPattern,
          contextLines: 3,
        }
      );
      setDriverLogSearchResult(res.data);
      onShowToast?.(
        `Scanned bounded 128 KB GCS driver log tail: ${res.data?.matchCount || 0} match(es) found`
      );
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to search GCS driver output log.'
      );
    } finally {
      setDriverLogSearching(false);
    }
  };

  const handleApplyAutoTunedPropertiesAndResubmit = async (recommendedProps) => {
    const mergedProps = {
      ...customSparkProperties,
      ...(recommendedProps || {}),
    };
    setCustomSparkProperties(mergedProps);
    onShowToast?.(
      `Applied ${Object.keys(recommendedProps || {}).length} auto-tuned Spark 3.5 properties (AQE + SkewJoin + Dynamic Scaling v2)`
    );
    await handleSubmitServerlessBatch(mergedProps);
  };

  const handleDeleteDataprocCluster = async (clusterName, clusterRegion) => {
    if (!projectId || !clusterName) return;
    setActionBusy(`DEL_CLUSTER_${clusterName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'DELETE_DATAPROC_CLUSTER',
          region: clusterRegion || region,
          clusterName,
        }
      );
      onShowToast?.(
        res.data?.message || `Deleted Dataproc GCE cluster ${clusterName}`
      );
      await fetchSparkOverview(region, true);
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          `Failed to delete cluster ${clusterName}`
      );
    } finally {
      setActionBusy('');
    }
  };

  // Listen for incoming cross-studio deep-links (from BigQuery Studio, GCS Workbench, Data Engineering Studio)
  useEffect(() => {
    const onOpenManagedSpark = (ev) => {
      const detail = ev?.detail || {};
      if (detail.subTab && SUB_TABS.some((t) => t.id === detail.subTab)) {
        setActiveSubTab(detail.subTab);
      }
      if (detail.region) setRegion(detail.region);
      if (detail.bucketName) {
        setStagingBucket(detail.bucketName);
        setGcsPrefixInput(
          detail.objectName
            ? `gs://${detail.bucketName}/${detail.objectName}`
            : `gs://${detail.bucketName}`
        );
      }
      if (detail.datasetId) setTargetDataset(detail.datasetId);
      if (detail.tableId) setIntrospectTableId(detail.tableId);
      if (detail.batchId) {
        setSelectedBatchForRca(detail.batchId);
      }
      if (detail.datasetId || detail.tableId || detail.bucketName) {
        handleIntrospectSparkDataAssets(
          detail.datasetId || targetDataset,
          detail.tableId || '',
          detail.bucketName
            ? detail.objectName
              ? `gs://${detail.bucketName}/${detail.objectName}`
              : `gs://${detail.bucketName}`
            : ''
        );
      }
    };
    window.addEventListener('cloudpulse:open-managed-spark', onOpenManagedSpark);
    return () =>
      window.removeEventListener(
        'cloudpulse:open-managed-spark',
        onOpenManagedSpark
      );
  }, [handleIntrospectSparkDataAssets, targetDataset]);

  const handleSubmitServerlessBatch = async (overrideProperties) => {
    if (!projectId) return;
    if (!stagingBucket) {
      onShowError?.(
        'Select or enter a Cloud Storage staging bucket (gs://...) so CloudPulse can upload your PySpark script and submit the Serverless batch.'
      );
      return;
    }
    setActionBusy('SUBMIT_BATCH');
    try {
      const effectiveProps =
        overrideProperties &&
        typeof overrideProperties === 'object' &&
        !overrideProperties.nativeEvent
          ? overrideProperties
          : customSparkProperties;
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/managed-spark/action`,
        {
          action: 'SUBMIT_SERVERLESS_BATCH',
          region,
          batchId: batchIdInput,
          stagingBucket,
          pythonScriptContent: customPyCode,
          runtimeVersion: '2.2',
          properties: effectiveProps,
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
    const propsArg = Object.entries(customSparkProperties || {})
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `gcloud dataproc batches submit pyspark gs://${cleanBkt}/spark-jobs/${batchIdInput}.py --batch=${batchIdInput} --region=${region} --project=${projectId} --version=2.2 --properties="${propsArg || 'spark.sql.adaptive.enabled=true'}"`;
  }, [stagingBucket, projectId, batchIdInput, region, customSparkProperties]);

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
              data-feature-id="SPARK_BTN_REFRESH_OVERVIEW"
              onClick={() => fetchSparkOverview(region)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Live Fleet
            </button>

            <button
              type="button"
              data-feature-id="SPARK_BTN_QUERY_BQ_GOLD"
              onClick={() =>
                onOpenBigQuerySql?.(
                  `-- Managed Spark 3.5 / BigLake Iceberg Verification Query\nSELECT *\nFROM \`${projectId}.${targetDataset || 'lakehouse_gold'}.service_telemetry_gold\`\nORDER BY processed_at DESC\nLIMIT 100;`
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
              title="Open BigQuery Studio with a live verification query for your Spark output dataset"
            >
              <Database className="w-3.5 h-3.5 text-blue-500" />
              Query in BigQuery
              <ArrowRight className="w-3 h-3" />
            </button>

            {stagingBucket && (
              <button
                type="button"
                data-feature-id="SPARK_BTN_BROWSE_GCS_JOBS"
                onClick={() =>
                  handleBrowseGsUriInWorkbench(`gs://${stagingBucket}/spark-jobs/`)
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
                title={`Browse gs://${stagingBucket} in Cloud Storage Object Workbench`}
              >
                <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                Browse GCS Staging
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              data-feature-id="SPARK_BTN_OPEN_DATA_STUDIO"
              onClick={() =>
                onNavigateTab?.('DATA_ENGINEER_STUDIO', 'SERVERLESS_SPARK')
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Data Engineer Studio
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              data-feature-id="SPARK_BTN_OPEN_BIGLAKE"
              onClick={() => onNavigateTab?.('BIGLAKE_STUDIO')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              BigLake Iceberg
              <ArrowRight className="w-3 h-3" />
            </button>

            {typeof onOpenLogsExplorer === 'function' && (
              <button
                type="button"
                data-feature-id="SPARK_BTN_OPEN_CHRONO_LOGS"
                onClick={() =>
                  onOpenLogsExplorer(
                    `resource.type=("cloud_dataproc_batch" OR "cloud_dataproc_session" OR "cloud_dataproc_cluster")`
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
                title="Stream live Dataproc Serverless batch & session logs in Chrono-Log SRE Hub"
              >
                <Activity className="w-3.5 h-3.5 text-rose-500" />
                Chrono-Log SRE Hub
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
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
                data-feature-id="SPARK_BTN_ENABLE_APIS"
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

        {/* 5-Pillar Sub-Tab Bar */}
        <div
          role="tablist"
          aria-label="Managed Spark Workspace Modules"
          className="cp-segmented-menu grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1 p-1 rounded-[10px] mt-4"
        >
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-subtab-id={tab.id}
                data-feature-id={`SPARK_TAB_${tab.id}`}
                title={tab.shortDesc || tab.label}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full h-9 px-2.5 rounded-[7px] text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'
                  }`}
                />
                <span className="truncate">{tab.label}</span>
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
                    data-feature-id={`SPARK_TPL_${tpl.id}`}
                    onClick={() => handleSelectWorkloadTemplate(tpl)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm ring-2 ring-blue-500/30'
                        : 'bg-zinc-50 dark:bg-zinc-900/70 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{tpl.title}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
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

            {/* Active Blueprint Dataflow & Engine Telemetry Strip (Updates Immediately on Template Click) */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-950/20 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-blue-600 text-white">
                    ACTIVE BLUEPRINT
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {activeTemplateMeta.title}
                  </span>
                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                    gs://{stagingBucket || `${projectId}-spark-warehouse`}/spark-jobs/{batchIdInput}.py
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {(activeTemplateMeta.engineBadges || []).map((badge) => (
                    <span
                      key={badge}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-zinc-500">
                    1. Source Connector
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-semibold mt-0.5">
                    {activeTemplateMeta.sourceFlow}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-zinc-500">
                    2. Distributed Spark 3.5 Transform
                  </div>
                  <div className="text-zinc-900 dark:text-zinc-100 font-semibold mt-0.5">
                    {activeTemplateMeta.transformFlow}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-zinc-500">
                    3. Target Sink Table
                  </div>
                  <div className="text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                    {activeTemplateMeta.sinkFlow}
                  </div>
                </div>
              </div>

              {/* Step 2: Interactive Executor, Memory & Engine Hardware Cockpit */}
              <div className="pt-2 border-t border-blue-500/20 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    <span>
                      Executor Autoscaling, Heap &amp; Vectorized Engine Profile
                    </span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    Active Profile: {activeHardwareProfile.title} · Est. Run Cost: $
                    {activeHardwareProfile.estimatedCostUsd.toFixed(4)} ($0.00/hr idle)
                  </span>
                </div>
                <div
                  data-action-toolbar="true"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-stretch"
                >
                  {SPARK_HARDWARE_PROFILES.map((prof) => {
                    const isProfActive = selectedHardwareProfileId === prof.id;
                    return (
                      <button
                        key={prof.id}
                        type="button"
                        data-feature-id={`SPARK_HW_${prof.id}`}
                        onClick={() => handleSelectHardwareProfile(prof)}
                        className={`w-full h-full p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isProfActive
                            ? 'bg-amber-500/15 dark:bg-amber-500/15 text-zinc-950 dark:text-white border-amber-500 border-b-2 border-b-amber-500 shadow-sm'
                            : 'bg-white/90 dark:bg-[#0e131d] text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-[#1e2738] hover:border-amber-500/45'
                        }`}
                      >
                        <div className="space-y-1 w-full min-w-0">
                          <div className="text-[11px] font-extrabold leading-snug break-words text-zinc-950 dark:text-zinc-50">
                            {prof.title}
                          </div>
                          <span
                            className={`inline-block text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              isProfActive
                                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/35'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {prof.badge}
                          </span>
                        </div>
                        <div
                          className={`text-[10.5px] font-mono leading-snug ${
                            isProfActive
                              ? 'text-zinc-700 dark:text-zinc-300'
                              : 'text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          {prof.dcuSummary}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
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
                  {activeTemplateMeta.fourthFieldLabel ||
                    'BigLake Metastore Catalog'}
                </label>
                <input
                  type="text"
                  value={targetCatalog}
                  onChange={(e) => setTargetCatalog(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            {/* Inline Live Preview & Editor for Staged Script / gcloud CLI / Spark Properties */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    data-feature-id="SPARK_PREVIEW_TAB_SCRIPT"
                    onClick={() => setLauncherPreviewTab('SCRIPT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      launcherPreviewTab === 'SCRIPT'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>
                      Staged PySpark 3.5 Script ({batchIdInput}.py ·{' '}
                      {customPyCode.split('\n').length} lines)
                    </span>
                  </button>
                  <button
                    type="button"
                    data-feature-id="SPARK_PREVIEW_TAB_XRAY_DAG"
                    onClick={() => {
                      setLauncherPreviewTab('XRAY_DAG');
                      handleRunPreflightXray();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      launcherPreviewTab === 'XRAY_DAG'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>
                      4-Stage Physical DAG &amp; 6-Gate AST X-Ray
                      {preflightXrayResult
                        ? ` (${preflightXrayResult.readyScore}/100)`
                        : ''}
                    </span>
                  </button>
                  <button
                    type="button"
                    data-feature-id="SPARK_PREVIEW_TAB_GCLOUD_CLI"
                    onClick={() => setLauncherPreviewTab('GCLOUD_CLI')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      launcherPreviewTab === 'GCLOUD_CLI'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>gcloud dataproc batches submit CLI</span>
                  </button>
                  <button
                    type="button"
                    data-feature-id="SPARK_PREVIEW_TAB_PROPERTIES"
                    onClick={() => setLauncherPreviewTab('PROPERTIES')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer inline-flex items-center gap-1.5 ${
                      launcherPreviewTab === 'PROPERTIES'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>
                      Spark 3.5 Properties (
                      {Object.keys(customSparkProperties || {}).length})
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    data-feature-id="SPARK_BTN_TOGGLE_LIGHTNING_ENGINE"
                    onClick={() => {
                      const isLightning =
                        customSparkProperties?.['spark.dataproc.engine'] ===
                        'lightningEngine';
                      const next = { ...customSparkProperties };
                      if (isLightning) {
                        delete next['spark.dataproc.engine'];
                        onShowToast?.(
                          'Switched to Standard Dataproc Serverless Spark 3.5 runtime'
                        );
                      } else {
                        next['spark.dataproc.engine'] = 'lightningEngine';
                        onShowToast?.(
                          'Enabled Spark Lightning Engine (spark.dataproc.engine=lightningEngine)!'
                        );
                      }
                      setCustomSparkProperties(next);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition cursor-pointer inline-flex items-center gap-1 ${
                      customSparkProperties?.['spark.dataproc.engine'] ===
                      'lightningEngine'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                    title="Toggle Google Cloud Managed Spark C++ Vectorized Lightning Engine"
                  >
                    <Zap className="w-3 h-3" />
                    <span>
                      {customSparkProperties?.['spark.dataproc.engine'] ===
                      'lightningEngine'
                        ? 'Lightning Engine: ON'
                        : 'Enable Lightning Engine'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-feature-id="SPARK_BTN_VERIFY_PY_COMPILE"
                    onClick={handleValidatePySparkSyntax}
                    disabled={syntaxValidating}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer inline-flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      {syntaxValidating
                        ? 'Compiling...'
                        : 'Verify Syntax (py_compile)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    data-feature-id="SPARK_BTN_COPY_WORKBENCH_CODE"
                    onClick={() =>
                      handleCopy(
                        launcherPreviewTab === 'GCLOUD_CLI'
                          ? gcloudSubmitCli
                          : launcherPreviewTab === 'PROPERTIES'
                          ? JSON.stringify(customSparkProperties, null, 2)
                          : customPyCode,
                        `launcher-copy-${launcherPreviewTab}`
                      )
                    }
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer inline-flex items-center gap-1"
                  >
                    {copiedId === `launcher-copy-${launcherPreviewTab}` ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>
                      {copiedId === `launcher-copy-${launcherPreviewTab}`
                        ? 'Copied!'
                        : 'Copy'}
                    </span>
                  </button>
                </div>
              </div>

              {syntaxValidation && (
                <div
                  className={`rounded-lg px-3 py-2 text-xs font-mono flex items-center justify-between gap-2 ${
                    syntaxValidation.syntaxValid
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {syntaxValidation.syntaxValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <span>
                      {syntaxValidation.message ||
                        syntaxValidation.compilerOutput}
                    </span>
                  </div>
                  <span className="text-[10.5px] opacity-80">
                    {syntaxValidation.lineCount ||
                      customPyCode.split('\n').length}{' '}
                    lines verified
                  </span>
                </div>
              )}

              {launcherPreviewTab === 'SCRIPT' && (
                <textarea
                  rows={10}
                  value={customPyCode}
                  onChange={(e) => {
                    setCustomPyCode(e.target.value);
                    setSyntaxValidation(null);
                  }}
                  className="w-full rounded-xl bg-[#0d1117] text-emerald-300 font-mono text-xs p-3.5 border border-zinc-800 focus:outline-none focus:border-blue-500 leading-relaxed"
                  spellCheck={false}
                />
              )}

              {launcherPreviewTab === 'XRAY_DAG' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>
                        Live Python 3 AST Physical Execution Plan &amp; 6-Gate Pre-Flight X-Ray
                      </span>
                      {preflightXrayResult && (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          Readiness Score: {preflightXrayResult.readyScore}/100
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      data-feature-id="SPARK_BTN_RERUN_XRAY"
                      onClick={() => handleRunPreflightXray()}
                      disabled={preflightXrayLoading}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer inline-flex items-center gap-1"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${
                          preflightXrayLoading ? 'animate-spin' : ''
                        }`}
                      />
                      <span>
                        {preflightXrayLoading
                          ? 'Running AST & GCP Probe...'
                          : 'Re-Run 6-Gate AST X-Ray ($0.00)'}
                      </span>
                    </button>
                  </div>

                  {preflightXrayLoading && !preflightXrayResult ? (
                    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500">
                      Parsing Python 3 AST, inspecting Spark operators, and probing live GCS Bucket + BigQuery Dataset + IAM bindings...
                    </div>
                  ) : preflightXrayResult ? (
                    <div className="space-y-3">
                      {/* 4-Stage Physical Execution DAG */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {(preflightXrayResult.physicalDagStages || []).map(
                          (stg, idx) => (
                            <div
                              key={stg.stageId || idx}
                              className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 font-mono text-xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold">
                                  {stg.stageId}
                                </span>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                  {stg.shuffleBytes}
                                </span>
                              </div>
                              <div className="font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                                {stg.name}
                              </div>
                              <div className="text-[10.5px] text-blue-600 dark:text-blue-400 truncate">
                                {stg.operator}
                              </div>
                              <div className="text-[10px] text-zinc-500">
                                {stg.parallelism}
                              </div>
                            </div>
                          )
                        )}
                      </div>

                      {/* 6 Pre-Flight Gates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(preflightXrayResult.gates || []).map((g) => {
                          const isPass =
                            g.status === 'PASS' || g.status === 'AUTO_CREATE';
                          return (
                            <div
                              key={g.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-2 text-xs font-mono"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                                    {g.title}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                                      isPass
                                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    }`}
                                  >
                                    {g.status}
                                  </span>
                                </div>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                  {g.summary}
                                </p>
                              </div>

                              {g.id === 'GATE_2_GRAVITY' &&
                                g.sameRegionGravity === false &&
                                g.bucketLocation &&
                                SPARK_REGIONS.includes(
                                  g.bucketLocation.toLowerCase()
                                ) && (
                                  <button
                                    type="button"
                                    data-feature-id="SPARK_BTN_ALIGN_REGION_TO_BUCKET"
                                    onClick={() => {
                                      const aligned =
                                        g.bucketLocation.toLowerCase();
                                      setRegion(aligned);
                                      onShowToast?.(
                                        `Aligned batch region to ${aligned} for $0.00/GB same-region GCS data gravity!`
                                      );
                                    }}
                                    className="self-start px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                                  >
                                    Align Region to {g.bucketLocation.toLowerCase()} ($0.00/GB Egress)
                                  </button>
                                )}

                              {g.id === 'GATE_3_BIGQUERY' &&
                                g.status === 'BOOTSTRAP_READY' && (
                                  <button
                                    type="button"
                                    data-feature-id="SPARK_BTN_BOOTSTRAP_BQ_DEMO"
                                    onClick={handleBootstrapSparkDemoAssets}
                                    disabled={bootstrapBusy}
                                    className="self-start px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <Database className="w-3 h-3" />
                                    <span>
                                      {bootstrapBusy
                                        ? 'Bootstrapping BigQuery Dataset & Tables...'
                                        : `Bootstrap Dataset "${targetDataset}" & Seed 3 Source Tables`}
                                    </span>
                                  </button>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {launcherPreviewTab === 'GCLOUD_CLI' && (
                <pre className="w-full rounded-xl bg-[#0d1117] text-blue-300 font-mono text-xs p-3.5 border border-zinc-800 overflow-x-auto whitespace-pre-wrap">
                  {gcloudSubmitCli}
                </pre>
              )}

              {launcherPreviewTab === 'PROPERTIES' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                  {Object.entries(customSparkProperties || {}).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    >
                      <span className="text-zinc-600 dark:text-zinc-400 truncate">
                        {k}
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Cryptographic GCS Staged Script Receipt (When Staged to GCS) */}
            {stagedScriptReceipt && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      STAGED TO CLOUD STORAGE ($0.00 COMPUTE):
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                      {stagedScriptReceipt.stagedUri}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Size: {stagedScriptReceipt.sizeBytes} bytes · Location:{' '}
                    {stagedScriptReceipt.bucketLocation} · Generation:{' '}
                    {stagedScriptReceipt.generation} · SHA-256:{' '}
                    {String(stagedScriptReceipt.sha256 || '').slice(0, 20)}...
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-feature-id="SPARK_BTN_BROWSE_STAGED_PY"
                    onClick={() =>
                      handleBrowseGsUriInWorkbench(
                        stagedScriptReceipt.stagedUri
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Browse Staged .py in GCS Workbench →</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-feature-id="SPARK_BTN_SUBMIT_SERVERLESS_BATCH"
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
                  data-feature-id="SPARK_BTN_STAGE_SCRIPT_ONLY"
                  onClick={handleStageScriptToGcsOnly}
                  disabled={stageScriptBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer transition"
                  title="Upload the PySpark .py script to your GCS staging bucket and verify its SHA-256 & object generation without spending any Dataproc compute DCUs"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  {stageScriptBusy
                    ? 'Uploading .py to GCS...'
                    : 'Stage .py to GCS Only ($0.00 Compute)'}
                </button>

                <button
                  type="button"
                  data-feature-id="SPARK_BTN_RERUN_XRAY"
                  onClick={() => {
                    setLauncherPreviewTab('XRAY_DAG');
                    handleRunPreflightXray();
                  }}
                  disabled={preflightXrayLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                  {preflightXrayLoading
                    ? 'Scanning AST & GCP...'
                    : '6-Gate AST & Data-Gravity X-Ray ($0.00)'}
                </button>

                <button
                  type="button"
                  data-feature-id="SPARK_BTN_BOOTSTRAP_BQ_DEMO"
                  onClick={handleBootstrapSparkDemoAssets}
                  disabled={bootstrapBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
                  title="Create the target BigQuery dataset and seed real telemetry_events, dim_regions, and account_risk_tiers tables for immediate Spark execution"
                >
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  {bootstrapBusy
                    ? 'Seeding BigQuery...'
                    : `Bootstrap BQ Dataset (${targetDataset})`}
                </button>

                <button
                  type="button"
                  data-feature-id="SPARK_BTN_RUN_IN_CLOUD_SHELL"
                  onClick={() => {
                    if (shellRunner) {
                      shellRunner(gcloudSubmitCli);
                    } else {
                      handleCopy(gcloudSubmitCli, 'cli-fallback');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer transition"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Run in Cloud Shell
                </button>
              </div>

              <button
                type="button"
                data-feature-id="SPARK_BTN_CUSTOMIZE_IN_TAB2"
                onClick={() => setActiveSubTab('SPARK_CONNECT_NOTEBOOKS')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                Open Full Notebook (.ipynb) &amp; Schema Introspector
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
                                  data-feature-id="SPARK_BTN_BROWSE_STAGED_PY"
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
                                data-feature-id="SPARK_BTN_BATCH_INSPECT_RCA"
                                onClick={() =>
                                  handleInspectBatchDiagnostics(b.id, b.region)
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                              >
                                <Eye className="w-3 h-3 text-blue-500" />
                                Inspect RCA
                              </button>
                              {typeof onOpenLogsExplorer === 'function' && (
                                <button
                                  type="button"
                                  data-feature-id="SPARK_BTN_BATCH_LOGS"
                                  onClick={() =>
                                    onOpenLogsExplorer(
                                      `resource.type="cloud_dataproc_batch" AND resource.labels.batch_id="${b.id}"`
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 cursor-pointer"
                                  title={`Stream batch "${b.id}" logs in Chrono-Log SRE Triage Hub`}
                                >
                                  <Terminal className="w-3 h-3" />
                                  Logs →
                                </button>
                              )}
                              <button
                                type="button"
                                data-feature-id="SPARK_BTN_BATCH_DELETE"
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
                  data-feature-id="SPARK_BTN_CREATE_INTERACTIVE_SESSION"
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
                        data-feature-id="SPARK_BTN_DELETE_SESSION"
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
                  {clusters.map((c) => {
                    const estNodes = 1 + Number(c.workerCount || 2);
                    const estMonthlyUsd = (estNodes * 116.8).toFixed(2);
                    return (
                      <div
                        key={`${c.region}:${c.clusterName}`}
                        className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                      >
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <span>{c.clusterName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {c.state}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                              ~${estMonthlyUsd}/mo 24/7 burn vs $0 Serverless idle
                            </span>
                          </div>
                          <div className="text-[10.5px] text-zinc-500 mt-0.5">
                            {c.region} · 1x {c.masterType} + {c.workerCount}x {c.workerType} ({c.imageVersion})
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            data-feature-id="SPARK_BTN_TEARDOWN_IDLE_GCE_CLUSTER"
                            onClick={() =>
                              handleDeleteDataprocCluster(c.clusterName, c.region)
                            }
                            disabled={
                              actionBusy === `DEL_CLUSTER_${c.clusterName}`
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-pointer"
                            title="Delete Persistent GCE Dataproc Cluster & Switch to Serverless ($0.00/hr idle)"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete Idle Cluster
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  data-feature-id="SPARK_BTN_DOWNLOAD_IPYNB"
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
                  data-feature-id="SPARK_BTN_DOWNLOAD_PY"
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
                  data-feature-id="SPARK_BTN_CREATE_SESSION_TEMPLATE"
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

            {/* Live BigQuery Table & GCS Prefix Schema Introspector (Step 3 Mandatory Pre-Flight) */}
            <div className="rounded-xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-emerald-500/5 border border-blue-500/25 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-500" />
                    Live BigQuery &amp; GCS Schema Introspector (Zero-Hallucination Column &amp; Broadcast Join Discovery)
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Queries live BigQuery <code className="font-mono">tables.get</code> metadata and GCS <code className="font-mono">objects.list</code> prefixes to verify exact column names, types, row counts, and <code className="font-mono">&lt;= 100 MB</code> <code className="font-mono">F.broadcast()</code> eligibility before writing PySpark code.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-feature-id="SPARK_BTN_INTROSPECT_DATA_ASSETS"
                    onClick={() => handleIntrospectSparkDataAssets()}
                    disabled={introspectLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    {introspectLoading
                      ? 'Introspecting Live Schema...'
                      : 'Introspect BigQuery & GCS Schema'}
                  </button>
                  {introspectResult?.synthesizedPySparkCode && (
                    <button
                      type="button"
                      data-feature-id="SPARK_BTN_LOAD_SYNTHESIZED_SCRIPT"
                      onClick={() => {
                        setCustomPyCode(introspectResult.synthesizedPySparkCode);
                        onShowToast?.(
                          `Loaded schema-verified PySpark 3.5 script for ${projectId}.${introspectResult.datasetId}.${introspectResult.selectedTable?.tableId || 'table'}`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Load Schema-Verified PySpark 3.5 Script
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10.5px] font-semibold text-zinc-500 mb-1">
                    BigQuery Dataset ({projectId})
                  </label>
                  {(overviewData?.datasets || []).length > 0 ? (
                    <select
                      value={targetDataset}
                      onChange={(e) => {
                        setTargetDataset(e.target.value);
                        setIntrospectTableId('');
                        handleIntrospectSparkDataAssets(e.target.value, '', gcsPrefixInput);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    >
                      {(overviewData?.datasets || []).map((d) => (
                        <option key={d.datasetId} value={d.datasetId}>
                          {d.datasetId} ({d.location})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={targetDataset}
                      onChange={(e) => setTargetDataset(e.target.value)}
                      placeholder="dataset_id"
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-zinc-500 mb-1">
                    BigQuery Table (Optional — Auto-Discovers First Table)
                  </label>
                  {(introspectResult?.tables || []).length > 0 ? (
                    <select
                      value={introspectTableId}
                      onChange={(e) => {
                        setIntrospectTableId(e.target.value);
                        handleIntrospectSparkDataAssets(
                          targetDataset,
                          e.target.value,
                          gcsPrefixInput
                        );
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    >
                      {(introspectResult?.tables || []).map((t) => (
                        <option key={t.tableId} value={t.tableId}>
                          {t.tableId} ({t.type})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={introspectTableId}
                      onChange={(e) => setIntrospectTableId(e.target.value)}
                      placeholder="Click Introspect to list tables..."
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10.5px] font-semibold text-zinc-500 mb-1">
                    GCS Input Prefix (gs://bucket/prefix)
                  </label>
                  <input
                    type="text"
                    value={gcsPrefixInput}
                    onChange={(e) => setGcsPrefixInput(e.target.value)}
                    placeholder={stagingBucket ? `gs://${stagingBucket}` : 'gs://my-bucket/data'}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {introspectResult?.selectedTable && (
                <div className="rounded-lg bg-white/90 dark:bg-zinc-950/90 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">
                      {projectId}.{introspectResult.datasetId}.{introspectResult.selectedTable.tableId}{' '}
                      <span className="text-zinc-500 font-normal">
                        ({introspectResult.selectedTable.numRows.toLocaleString()} rows ·{' '}
                        {introspectResult.selectedTable.sizeMb} MB)
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold ${
                        introspectResult.selectedTable.broadcastJoinCandidate
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {introspectResult.selectedTable.broadcastJoinCandidate
                        ? 'Eligible for F.broadcast() Join (<= 100 MB)'
                        : 'Large Fact Table (> 100 MB · Use AQE Partition Coalescing)'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(introspectResult.selectedTable.columns || []).map((col) => (
                      <span
                        key={col.name}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono"
                      >
                        <strong className="text-zinc-900 dark:text-zinc-100">
                          {col.name}
                        </strong>
                        <span className="text-blue-600 dark:text-blue-400">
                          {col.type}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Editable PySpark Code Editor */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                    PySpark 3.5 Script ({selectedTemplateId}.py)
                  </span>
                  {syntaxValidation && (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold ${
                        syntaxValidation.syntaxValid
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {syntaxValidation.syntaxValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          py_compile PASS ({syntaxValidation.lineCount} lines)
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          Syntax Error
                        </>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-feature-id="SPARK_BTN_VERIFY_PY_COMPILE"
                    onClick={handleValidatePySparkSyntax}
                    disabled={syntaxValidating}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer"
                    title="Run real python3 -m py_compile syntax verification before submitting to Dataproc Serverless"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {syntaxValidating
                      ? 'Checking py_compile...'
                      : 'Verify Syntax (py_compile)'}
                  </button>
                  <button
                    type="button"
                    data-feature-id="SPARK_BTN_COPY_WORKBENCH_CODE"
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
                    data-feature-id="SPARK_BTN_SUBMIT_SERVERLESS_BATCH"
                    onClick={() => handleSubmitServerlessBatch()}
                    disabled={actionBusy === 'SUBMIT_BATCH'}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                    Submit as Serverless Batch
                  </button>
                </div>
              </div>
              {syntaxValidation && !syntaxValidation.syntaxValid && (
                <pre className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-200 font-mono text-[11px] whitespace-pre-wrap">
                  {syntaxValidation.compilerOutput}
                </pre>
              )}
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
                  data-feature-id="SPARK_BTN_RUN_3PILLAR_RCA"
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

                {/* Automated SparkApplications Property Auto-Tuner & 1-Click Re-Submit */}
                {diagnosticsResult.autoTuneRecommendation && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-blue-500" />
                          Interactive Spark 3.5 Property Auto-Tuner (Synthesized from Stages &amp; Driver Logs)
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          {diagnosticsResult.autoTuneRecommendation.summary}
                        </p>
                      </div>
                      <button
                        type="button"
                        data-feature-id="SPARK_BTN_APPLY_AUTOTUNE_RESUBMIT"
                        onClick={() =>
                          handleApplyAutoTunedPropertiesAndResubmit(
                            diagnosticsResult.autoTuneRecommendation
                              .recommendedProperties
                          )
                        }
                        disabled={actionBusy === 'SUBMIT_BATCH'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Apply Tuned Properties &amp; Re-Submit Batch
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(
                        diagnosticsResult.autoTuneRecommendation
                          .recommendedProperties || {}
                      ).map(([k, v]) => (
                        <span
                          key={k}
                          className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-zinc-800 dark:text-zinc-200"
                        >
                          <span className="text-blue-600 dark:text-blue-400">
                            {k}
                          </span>
                          ={String(v)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bounded 128 KB GCS Driver Log Regex Search */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      Bounded 128 KB GCS Driver Log Regex Inspector (&lt;outputUri&gt;.000000000)
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        {
                          label: 'Exceptions & OOM',
                          pattern:
                            'ERROR|Exception|Traceback|OutOfMemoryError|Py4JJavaError|Caused by',
                        },
                        {
                          label: 'Shuffle / Stage Failures',
                          pattern:
                            'FetchFailedException|Stage.*failed|ExecutorLostFailure|skew',
                        },
                        {
                          label: 'IAM / PermissionDenied',
                          pattern: 'PermissionDenied|403|AccessDenied|IAM',
                        },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          data-feature-id="SPARK_BTN_DRIVER_LOG_REGEX_PRESET"
                          onClick={() => {
                            setDriverLogSearchPattern(preset.pattern);
                            handleSearchGcsDriverLog(
                              diagnosticsResult.batch?.outputUri,
                              preset.pattern
                            );
                          }}
                          className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={driverLogSearchPattern}
                      onChange={(e) => setDriverLogSearchPattern(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      placeholder="Regex pattern (e.g. ERROR|Exception|OutOfMemoryError)"
                    />
                    <button
                      type="button"
                      data-feature-id="SPARK_BTN_DRIVER_LOG_REGEX_SEARCH"
                      onClick={() =>
                        handleSearchGcsDriverLog(
                          diagnosticsResult.batch?.outputUri,
                          driverLogSearchPattern
                        )
                      }
                      disabled={driverLogSearching}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      {driverLogSearching ? 'Scanning...' : 'Search Driver Log'}
                    </button>
                  </div>
                  {driverLogSearchResult && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-mono text-zinc-500">
                        Scanned {driverLogSearchResult.totalLinesScanned} lines in{' '}
                        <code>{driverLogSearchResult.driverUri}</code> —{' '}
                        <strong className="text-zinc-900 dark:text-zinc-100">
                          {driverLogSearchResult.matchCount} match(es)
                        </strong>
                      </div>
                      {(driverLogSearchResult.matches || []).length > 0 && (
                        <div className="max-h-56 overflow-y-auto space-y-1.5">
                          {driverLogSearchResult.matches.map((m, idx) => (
                            <pre
                              key={idx}
                              className="p-2.5 rounded-lg bg-[#0d1117] border border-zinc-800 text-[11px] font-mono text-amber-200 whitespace-pre-wrap"
                            >
                              {m.contextBlock}
                            </pre>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
                  data-feature-id="SPARK_BTN_BIND_MISSING_IAM_ROLES"
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

            {/* SDK 592.0.0 GA: Dataproc Dynamic Workload Scheduler (DWS) Scheduled Clusters */}
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-extrabold">
                    [NEW GA · SDK 592.0.0]
                  </span>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    Dataproc Dynamic Workload Scheduler (DWS) Scheduled Cluster CLI
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {typeof onOpenShellWithCommand === 'function' && (
                    <button
                      type="button"
                      data-feature-id="SPARK_BTN_DWS_SCHEDULED_CLUSTER_SHELL"
                      onClick={() =>
                        onOpenShellWithCommand(
                          `gcloud dataproc clusters create cp-dws-spark-cluster --project=${projectId} --region=${region} --scheduling-timeout=3600s --requested-run-duration=14400s`
                        )
                      }
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-bold cursor-pointer"
                    >
                      $ Run in Cloud Shell
                    </button>
                  )}
                  <button
                    type="button"
                    data-feature-id="SPARK_BTN_DWS_SCHEDULED_CLUSTER_COPY"
                    onClick={() =>
                      copyToClipboard(
                        `gcloud dataproc clusters create cp-dws-spark-cluster --project=${projectId} --region=${region} --scheduling-timeout=3600s --requested-run-duration=14400s`,
                        'DWS Scheduled Cluster CLI'
                      )
                    }
                    className="px-2.5 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Copy CLI
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Promoted to GA in Google Cloud SDK 592.0.0 (2026-11-03): use{' '}
                <code className="font-mono">--scheduling-timeout</code> and{' '}
                <code className="font-mono">--requested-run-duration</code> on{' '}
                <code className="font-mono">gcloud dataproc clusters create</code> for DWS queued GPU/CPU Spark clusters.
              </p>
              <div className="p-2.5 rounded-lg bg-zinc-950 text-emerald-400 font-mono text-[11px] break-all">
                $ gcloud dataproc clusters create cp-dws-spark-cluster --project={projectId} --region={region} --scheduling-timeout=3600s --requested-run-duration=14400s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          SUB-TAB 5: LIGHTNING_BIGFRAMES_LINEAGE
          (Spark Lightning Engine + BigFrames v2.0 + Data Lineage Blast Radius)
      ===================================================================== */}
      {activeSubTab === 'LIGHTNING_BIGFRAMES_LINEAGE' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30 text-[10px] font-mono font-bold">
                    GOOGLE CLOUD SKILLS PACK
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-orange-500" />
                    Managed Spark Lightning Engine + BigFrames v2.0 + Data Lineage Blast-Radius Studio
                  </h3>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Combines{' '}
                  <strong>Managed Spark Lightning Engine (<code className="font-mono">spark.dataproc.engine=lightningEngine</code>)</strong>,{' '}
                  <strong>BigQuery DataFrames (<code className="font-mono">bigframes.pandas</code> v2.0 + <code className="font-mono">bigframes.bigquery.ml</code>)</strong>, and{' '}
                  <strong>Knowledge Catalog Data Lineage (<code className="font-mono">datalineage.googleapis.com/v1</code>)</strong> downstream blast-radius analysis.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-feature-id="SPARK_BTN_RUN_LINEAGE_CATALOG_SYNTHESIS"
                  onClick={() => handleAnalyzeSparkKnowledgeCatalogAndLineage()}
                  disabled={lineageCatalogLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  {lineageCatalogLoading
                    ? 'Querying Data Lineage & Knowledge Catalog...'
                    : 'Run Lineage Blast-Radius & Synthesize BigFrames'}
                </button>
                <button
                  type="button"
                  data-feature-id="SPARK_BTN_SUBMIT_LIGHTNING_ENGINE_BATCH"
                  onClick={() =>
                    handleApplyAutoTunedPropertiesAndResubmit({
                      'spark.dataproc.engine': 'lightningEngine',
                      'spark.sql.adaptive.enabled': 'true',
                      'spark.sql.adaptive.skewJoin.enabled': 'true',
                      'spark.dataproc.scaling.version': '2',
                    })
                  }
                  disabled={actionBusy === 'SUBMIT_BATCH'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Submit Serverless Batch with Lightning Engine
                </button>
              </div>
            </div>

            {/* Target BigQuery Asset Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div>
                <label className="block text-[10.5px] font-semibold text-zinc-500 mb-1">
                  BigQuery Dataset ({projectId})
                </label>
                <input
                  type="text"
                  value={targetDataset}
                  onChange={(e) => setTargetDataset(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-semibold text-zinc-500 mb-1">
                  Target Table / View ID (FQN: bigquery:{projectId}.{targetDataset}.{introspectTableId || 'service_telemetry_gold'})
                </label>
                <input
                  type="text"
                  value={introspectTableId}
                  onChange={(e) => setIntrospectTableId(e.target.value)}
                  placeholder="service_telemetry_gold (auto-discovers first table if blank)"
                  className="w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  data-feature-id="SPARK_BTN_RUN_IN_CLOUD_SHELL"
                  onClick={() =>
                    shellRunner?.(
                      lineageCatalogResult?.lightningSubmitCli ||
                        `gcloud dataproc batches submit pyspark gs://${stagingBucket || `${projectId}-spark-warehouse`}/spark-jobs/${batchIdInput}.py --project=${projectId} --region=${region} --version=2.2 --properties="spark.dataproc.engine=lightningEngine,spark.sql.adaptive.enabled=true,spark.dataproc.scaling.version=2"`
                    )
                  }
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-700 cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  $ Run Lightning Engine CLI in Cloud Shell
                </button>
              </div>
            </div>

            {lineageCatalogResult ? (
              <div className="space-y-4">
                {/* Summary KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10.5px] text-zinc-500 uppercase font-semibold">
                      Resolved Asset FQN
                    </div>
                    <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-1 break-all">
                      {lineageCatalogResult.fqn}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10.5px] text-zinc-500 uppercase font-semibold">
                      Downstream Blast Radius
                    </div>
                    <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {lineageCatalogResult.downstreamBlastRadius?.totalAffected || 0}{' '}
                      <span className="text-xs font-normal text-zinc-500">
                        dependent asset(s)
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10.5px] text-zinc-500 uppercase font-semibold">
                      Upstream Provenance
                    </div>
                    <div className="text-base font-bold font-mono text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {lineageCatalogResult.upstreamProvenance?.totalSources || 0}{' '}
                      <span className="text-xs font-normal text-zinc-500">
                        source link(s)
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="text-[10.5px] text-zinc-500 uppercase font-semibold">
                      Knowledge Catalog Aspects
                    </div>
                    <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {(lineageCatalogResult.knowledgeCatalogAspects || []).length}{' '}
                      <span className="text-xs font-normal text-zinc-500">
                        aspect type(s)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Downstream Blast-Radius Table */}
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Downstream Data Lineage Blast-Radius Table (datalineage.googleapis.com/v1 · Location: {lineageCatalogResult.lineageLocationSearched})
                    </span>
                    <span className="text-[11px] font-mono text-zinc-500">
                      Critical Path Assets: {lineageCatalogResult.downstreamBlastRadius?.criticalCount || 0}
                    </span>
                  </div>
                  {(lineageCatalogResult.downstreamBlastRadius?.links || []).length === 0 ? (
                    <p className="text-xs text-zinc-500 font-mono">
                      {lineageCatalogResult.downstreamBlastRadius?.advisory ||
                        `0 downstream dependencies found for ${lineageCatalogResult.fqn} in location "${lineageCatalogResult.lineageLocationSearched}". Safe to modify or overwrite without breaking downstream views.`}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                          <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10.5px] uppercase text-zinc-500">
                            <th className="py-1.5 pr-3">Downstream Asset</th>
                            <th className="py-1.5 px-3">Lineage Link Name</th>
                            <th className="py-1.5 px-3">Depth</th>
                            <th className="py-1.5 pl-3">Impact Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/70">
                          {lineageCatalogResult.downstreamBlastRadius.links.map((lk, i) => (
                            <tr key={lk.name || i}>
                              <td className="py-2 pr-3 font-bold text-zinc-900 dark:text-zinc-100">
                                {lk.targetFqn}
                              </td>
                              <td className="py-2 px-3 text-zinc-500 truncate max-w-xs">
                                {lk.name}
                              </td>
                              <td className="py-2 px-3">{lk.depth}</td>
                              <td className="py-2 pl-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    lk.isCriticalPath
                                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                      : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                  }`}
                                >
                                  {lk.impactType}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Synthesized BigQuery DataFrames (BigFrames v2.0) Code Studio */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono">
                      Synthesized BigQuery DataFrames (bigframes.pandas v2.0 + bigframes.bigquery.ml) Pipeline
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-feature-id="SPARK_BTN_OPEN_BIGFRAMES_IN_EDITOR"
                        onClick={() => {
                          setCustomPyCode(lineageCatalogResult.bigFramesCode);
                          setActiveSubTab('SPARK_CONNECT_NOTEBOOKS');
                          onShowToast?.(
                            'Loaded BigFrames v2.0 script into editor!'
                          );
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                      >
                        Load into Editor &amp; Verify py_compile →
                      </button>
                      <button
                        type="button"
                        data-feature-id="SPARK_BTN_DOWNLOAD_BIGFRAMES_PY"
                        onClick={() =>
                          handleDownloadFile(
                            `bigframes_${lineageCatalogResult.tableId}.py`,
                            lineageCatalogResult.bigFramesCode,
                            'text/x-python'
                          )
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                      >
                        Download bigframes.py
                      </button>
                    </div>
                  </div>
                  <pre className="rounded-xl bg-[#0d1117] text-emerald-300 font-mono text-xs p-4 border border-zinc-800 overflow-x-auto whitespace-pre-wrap">
                    {lineageCatalogResult.bigFramesCode}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 p-6 text-center space-y-2">
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Click <strong>Run Lineage Blast-Radius &amp; Synthesize BigFrames</strong> above to query <code className="font-mono">datalineage.googleapis.com/v1</code>, inspect Dataplex Knowledge Catalog Aspect Types, and generate a <code className="font-mono">bigframes.pandas</code> v2.0 + Spark Lightning Engine pipeline.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
