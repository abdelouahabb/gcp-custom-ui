import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Database,
  Layers,
  Sparkles,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  GitBranch,
  FileCode,
  Cpu,
  Clock,
  DollarSign,
  ArrowRight,
  Trash2,
  Copy,
  Check,
  Terminal,
  Workflow,
  Search,
  Lock,
  Zap,
} from 'lucide-react';

export default function DataEngineeringStudio({
  projectId,
  onShowToast,
  onShowError,
  onRunInShell,
}) {
  const [activeSubTab, setActiveSubTab] = useState('MEDALLION_ELT');
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [data, setData] = useState({
    gcloudSdkVersion: '588.0.0 (2026.10.02)',
    datasets: [],
    buckets: [],
    medallionPipelines: [],
    dataformRepos: [],
    dataplexScans: [],
    dataProducts: [],
    dtsTransfers: [],
    jobDiagnostics: [],
    serverlessDags: [],
    sdk588Capabilities: [],
  });

  // 1. Medallion Pipeline Builder Form
  const [pipelineName, setPipelineName] = useState('customer_360_events');
  const [sourceType, setSourceType] = useState('GCS_PARQUET');
  const [sourceUri, setSourceUri] = useState('');
  const [medallionLocation, setMedallionLocation] = useState('US');
  const [dedupKey, setDedupKey] = useState('event_id');
  const [orderByCol, setOrderByCol] = useState('updated_at');
  const [dataVolumeGbDay, setDataVolumeGbDay] = useState(25);
  const [latencySla, setLatencySla] = useState('BATCH_15M');

  // 2. Dataform & dbt SQLX Auto-Clean Generator Form
  const [dialect, setDialect] = useState('DATAFORM_SQLX');
  const [repoIdInput, setRepoIdInput] = useState('cloudpulse-medallion-elt');
  const [repoRegion, setRepoRegion] = useState('us-central1');
  const [cleanSourceDs, setCleanSourceDs] = useState(
    'customer_360_events_bronze_raw'
  );
  const [cleanSourceTable, setCleanSourceTable] = useState('raw_events');
  const [cleanTargetDs, setCleanTargetDs] = useState(
    'customer_360_events_silver_cleaned'
  );
  const [cleanTargetTable, setCleanTargetTable] = useState('cleaned_events');
  const [cleanQueryResult, setCleanQueryResult] = useState(null);

  // 3. Dataplex Scan & Data Mesh Product Form
  const [scanType, setScanType] = useState('DATA_PROFILE');
  const [scanDataset, setScanDataset] = useState(
    'customer_360_events_silver_cleaned'
  );
  const [scanTable, setScanTable] = useState('cleaned_events');
  const [productName, setProductName] = useState(
    'Customer 360 & FinOps Gold Mesh'
  );
  const [productDomain, setProductDomain] = useState(
    'Growth Analytics & Executive BI'
  );
  const [productSla, setProductSla] = useState(15);

  // 4. Visual Schema Mapper & Contract Firewall State
  const [schemaMappings, setSchemaMappings] = useState([
    {
      sourceField: 'event_id',
      sourceType: 'STRING',
      targetField: 'event_id',
      targetType: 'STRING',
      transform: 'TRIM + NOT NULL PRIMARY KEY',
      isPii: false,
      downstreamUsedBy: ['gold_executive_marts.daily_revenue_mart'],
    },
    {
      sourceField: 'user_email',
      sourceType: 'STRING',
      targetField: 'user_email_sha256',
      targetType: 'STRING',
      transform: 'TO_HEX(SHA256(LOWER(TRIM(col))))',
      isPii: true,
      downstreamUsedBy: ['gold_executive_marts.customer_ltv_view'],
    },
    {
      sourceField: 'event_type',
      sourceType: 'STRING',
      targetField: 'event_type',
      targetType: 'STRING',
      transform: 'UPPER(TRIM(col))',
      isPii: false,
      downstreamUsedBy: ['gold_executive_marts.daily_revenue_mart'],
    },
    {
      sourceField: 'revenue_usd',
      sourceType: 'STRING (Raw CSV/JSON)',
      targetField: 'revenue_usd',
      targetType: 'FLOAT64',
      transform: 'COALESCE(SAFE_CAST(col AS FLOAT64), 0.0)',
      isPii: false,
      downstreamUsedBy: [
        'gold_executive_marts.daily_revenue_mart',
        'looker_exec_kpi_dashboard',
      ],
    },
    {
      sourceField: 'updated_at',
      sourceType: 'TIMESTAMP',
      targetField: 'updated_at',
      targetType: 'TIMESTAMP',
      transform: 'PARTITION BY DATE(updated_at)',
      isPii: false,
      downstreamUsedBy: ['gold_executive_marts.daily_revenue_mart'],
    },
  ]);

  // 5. Composer-Lite Serverless DAG Form
  const [dagIdInput, setDagIdInput] = useState('medallion-elt-serverless-dag');
  const [airflowSample] = useState(
    `# Legacy Cloud Composer (Airflow) DAG (~$348/mo minimum cluster cost)
with DAG("customer_360_medallion_elt", schedule_interval="@hourly") as dag:
    ingest_gcs = GCSToBigQueryOperator(task_id="bronze_load", bucket="raw-landing")
    clean_silver = BigQueryInsertJobOperator(task_id="silver_dedup_merge")
    quality_gate = DataplexCreateTaskOperator(task_id="dataplex_quality_assert")
    build_gold = BigQueryInsertJobOperator(task_id="gold_revenue_mart")
    ingest_gcs >> clean_silver >> quality_gate >> build_gold`
  );

  const fetchOverview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/overview`
      );
      if (res.data) {
        setData(res.data);
        if (!sourceUri && res.data.buckets?.[0]?.name) {
          setSourceUri(`gs://${res.data.buckets[0].name}/events/*.parquet`);
        } else if (!sourceUri) {
          setSourceUri(`gs://${projectId}-raw-landing/events/*.parquet`);
        }
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to load Data Engineering Studio overview.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, onShowError, sourceUri]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // Smart Engine Recommender based on daily volume & latency SLA
  const engineRecommendation = useMemo(() => {
    const vol = Number(dataVolumeGbDay || 10);
    if (latencySla === 'STREAMING_SUB_5S') {
      return {
        engine: 'Pub/Sub → BigQuery Storage Write API / Dataflow Streaming',
        badge: 'REAL-TIME STREAMING (<5s)',
        estMonthlyUsd: Math.max(12, Math.round(vol * 1.45)),
        why: 'Sub-5-second SLA requires streaming ingestion via BigQuery Storage Write API or Apache Beam on Dataflow with Autosharding.',
      };
    }
    if (vol >= 500) {
      return {
        engine: 'BigQuery Editions Autoscaling Slots + Dataform SQLX (or Serverless Spark)',
        badge: 'HIGH-THROUGHPUT LAKEHOUSE',
        estMonthlyUsd: Math.round(vol * 0.18),
        why: 'At 500+ GB/day, Partitioned + Clustered Dataform SQLX with Physical Compressed Billing (-54%) beats On-Demand per-TB scanning.',
      };
    }
    return {
      engine: 'BigQuery Native ELT + Dataform SQLX ($0.00 Orchestration)',
      badge: 'RECOMMENDED · $0 ORCHESTRATION',
      estMonthlyUsd: Number(Math.max(0, (vol * 30 - 1000) * 0.00625).toFixed(2)),
      why: 'First 1 TB/month of BigQuery queries and 10 GB of storage are 100% Free Tier, and Dataform orchestration costs $0.00 on Google Cloud.',
    };
  }, [dataVolumeGbDay, latencySla]);

  // Generated Dataform SQLX vs dbt SQL code
  const generatedTransformationCode = useMemo(() => {
    if (dialect === 'DATAFORM_SQLX') {
      return `-- File: definitions/silver/${cleanTargetTable}.sqlx
-- Engine: Google Cloud Dataform (dataform.googleapis.com/v1beta1)
config {
  type: "incremental",
  schema: "${cleanTargetDs}",
  name: "${cleanTargetTable}",
  uniqueKey: ["${dedupKey}"],
  bigquery: {
    partitionBy: "DATE(${orderByCol})",
    clusterBy: ["event_type"],
    updatePartitionFilter: "${orderByCol} >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)"
  },
  assertions: {
    nonNull: ["${dedupKey}", "${orderByCol}"],
    uniqueKey: ["${dedupKey}"],
    rowConditions: [
      "revenue_usd >= 0"
    ]
  },
  description: "Auto-cleaned, deduplicated & PII-hashed Silver Medallion table"
}

SELECT
  TRIM(CAST(${dedupKey} AS STRING)) AS ${dedupKey},
  TO_HEX(SHA256(LOWER(TRIM(CAST(user_email AS STRING))))) AS user_email_sha256,
  UPPER(TRIM(CAST(event_type AS STRING))) AS event_type,
  COALESCE(SAFE_CAST(revenue_usd AS FLOAT64), 0.0) AS revenue_usd,
  ${orderByCol}
FROM
  \`${projectId}.${cleanSourceDs}.${cleanSourceTable}\`
\${when(incremental(), \`WHERE ${orderByCol} >= (SELECT IFNULL(MAX(${orderByCol}), TIMESTAMP("1970-01-01")) FROM \${self()})\`)}
QUALIFY
  ROW_NUMBER() OVER (
    PARTITION BY ${dedupKey}
    ORDER BY ${orderByCol} DESC
  ) = 1`;
    }

    return `-- File: models/silver/${cleanTargetTable}.sql
-- Engine: dbt-bigquery + gcloud dataplex dbt metadata-jobs (SDK 588.0.0)
{{
  config(
    materialized='incremental',
    unique_key='${dedupKey}',
    incremental_strategy='merge',
    partition_by={
      "field": "${orderByCol}",
      "data_type": "timestamp",
      "granularity": "day"
    },
    cluster_by=["event_type"],
    require_partition_filter=false
  )
}}

SELECT
  TRIM(CAST(${dedupKey} AS STRING)) AS ${dedupKey},
  TO_HEX(SHA256(LOWER(TRIM(CAST(user_email AS STRING))))) AS user_email_sha256,
  UPPER(TRIM(CAST(event_type AS STRING))) AS event_type,
  COALESCE(SAFE_CAST(revenue_usd AS FLOAT64), 0.0) AS revenue_usd,
  ${orderByCol}
FROM
  \`${projectId}.${cleanSourceDs}.${cleanSourceTable}\`
{% if is_incremental() %}
WHERE ${orderByCol} >= (SELECT IFNULL(MAX(${orderByCol}), TIMESTAMP('1970-01-01')) FROM {{ this }})
{% endif %}
QUALIFY
  ROW_NUMBER() OVER (
    PARTITION BY ${dedupKey}
    ORDER BY ${orderByCol} DESC
  ) = 1`;
  }, [
    dialect,
    projectId,
    cleanSourceDs,
    cleanSourceTable,
    cleanTargetDs,
    cleanTargetTable,
    dedupKey,
    orderByCol,
  ]);

  // Executable BigQuery SQL for 1-Click Live Run
  const executableBigQuerySql = useMemo(() => {
    return `SELECT
  TRIM(CAST(${dedupKey} AS STRING)) AS ${dedupKey},
  TO_HEX(SHA256(LOWER(TRIM(CAST(user_email AS STRING))))) AS user_email_sha256,
  UPPER(TRIM(CAST(event_type AS STRING))) AS event_type,
  COALESCE(SAFE_CAST(revenue_usd AS FLOAT64), 0.0) AS revenue_usd,
  ${orderByCol}
FROM \`${projectId}.${cleanSourceDs}.${cleanSourceTable}\`
WHERE ${dedupKey} IS NOT NULL
QUALIFY ROW_NUMBER() OVER (PARTITION BY ${dedupKey} ORDER BY ${orderByCol} DESC) = 1
LIMIT 25;`;
  }, [projectId, cleanSourceDs, cleanSourceTable, dedupKey, orderByCol]);

  const handleDeployMedallion = async () => {
    setBusyAction('DEPLOY_MEDALLION');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'DEPLOY_MEDALLION_PIPELINE',
          pipelineName,
          sourceType,
          sourceUri,
          location: medallionLocation,
          dedupKey,
          orderByCol,
        }
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      if (res.data?.pipeline) {
        setCleanSourceDs(res.data.pipeline.bronzeDataset);
        setCleanTargetDs(res.data.pipeline.silverDataset);
        setScanDataset(res.data.pipeline.silverDataset);
      }
      await fetchOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to provision Medallion Lakehouse pipeline.'
        );
      }
    } finally {
      setBusyAction('');
    }
  };

  const handleCreateDataformRepo = async () => {
    setBusyAction('CREATE_DATAFORM');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'CREATE_DATAFORM_REPO',
          repoId: repoIdInput,
          region: repoRegion,
        }
      );
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to initialize Dataform repository.'
        );
      }
    } finally {
      setBusyAction('');
    }
  };

  const handleRunAutoCleanSql = async () => {
    setBusyAction('RUN_SQL');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'RUN_AUTO_CLEAN_SQL',
          sql: executableBigQuerySql,
          location: medallionLocation,
        }
      );
      if (res.data?.queryResult) {
        setCleanQueryResult(res.data.queryResult);
      }
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Make sure you click "1-Click Provision Bronze → Silver → Gold" first so the source table exists!'
        );
      }
    } finally {
      setBusyAction('');
    }
  };

  const handleCreateDataplexScan = async () => {
    setBusyAction('CREATE_SCAN');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'CREATE_DATAPLEX_SCAN',
          scanType,
          datasetId: scanDataset,
          tableId: scanTable,
          region: 'us-central1',
        }
      );
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to create Dataplex DataScan.'
        );
      }
    } finally {
      setBusyAction('');
    }
  };

  const handleCreateDataProduct = async () => {
    setBusyAction('CREATE_PRODUCT');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'CREATE_DATAPLEX_DATA_PRODUCT',
          displayName: productName,
          domain: productDomain,
          slaFreshnessMinutes: productSla,
        }
      );
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to publish Dataplex Data Product.'
        );
      }
    } finally {
      setBusyAction('');
    }
  };

  const handleDeployServerlessDag = async () => {
    setBusyAction('DEPLOY_DAG');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'DEPLOY_SERVERLESS_ELT_DAG',
          dagId: dagIdInput,
          region: 'us-central1',
          bronzeDataset: cleanSourceDs,
          silverDataset: cleanTargetDs,
          goldDataset: `${pipelineName}_gold_marts`,
        }
      );
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to deploy Serverless ELT Workflow DAG.'
        );
      }
    } finally {
      setBusyAction('');
    }
  };

  const handleDeleteResource = async (resourceKind, id, region = 'us-central1') => {
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/resource`,
        {
          data: { resourceKind, id, region },
        }
      );
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchOverview();
    } catch (err) {
      if (onShowError && !err?.__cancelledByUser) {
        onShowError(err.response?.data?.error || err.message);
      }
    }
  };

  // 6. Google Cloud Data Agent Kit (DAK) State & Generators
  const [dakEnvName, setDakEnvName] = useState('dev');
  const [dakFileTab, setDakFileTab] = useState('DEPLOYMENT_YAML');
  const [dakSearchQuery, setDakSearchQuery] = useState(
    'customer revenue events silver'
  );
  const [dakSearchMode, setDakSearchMode] = useState('SEMANTIC');
  const [dakSearchResults, setDakSearchResults] = useState([]);
  const [dakSearchCli, setDakSearchCli] = useState('');
  const [sparkLogUri, setSparkLogUri] = useState(
    `gs://${projectId || 'gcp-project'}-spark-events/eventlog_v2_spark-medallion-compaction.zst`
  );
  const [sparkRcaReport, setSparkRcaReport] = useState(null);

  const dakDeploymentYaml = useMemo(
    () => `# File: deployment.yaml (Google Cloud Data Agent Kit Declarative Resource Provisioning)
# CLI: CLOUDSDK_METRICS_ENVIRONMENT="datacloud.antigravity" gcloud beta orchestration-pipelines deploy --environment=${dakEnvName}
environments:
  ${dakEnvName}:
    project: ${projectId}
    region: us-central1
    variables:
      REPO_NAME: ${repoIdInput}
      SERVICE_ACCOUNT_EMAIL: "dataform-sa@${projectId}.iam.gserviceaccount.com"
    pipelines:
      - source: orchestration-pipeline.yaml
    resources:
      # --- 1. BigQuery Destination Dataset (Mandatory for DTS Ingestion) ---
      - type: bigquery.dataset
        name: ${cleanTargetDs}
        definition:
          location: ${medallionLocation}
          labels:
            env: ${dakEnvName}
            datacloud: "antigravity"

      # --- 2. BigQuery Silver Cleaned Table ---
      - type: bigquery.table
        name: ${cleanTargetTable}
        parent: ${cleanTargetDs}
        definition:
          schema:
            fields:
              - name: ${dedupKey}
                type: STRING
              - name: user_email_sha256
                type: STRING
              - name: event_type
                type: STRING
              - name: revenue_usd
                type: FLOAT64
              - name: ${orderByCol}
                type: TIMESTAMP
          labels:
            env: ${dakEnvName}
            datacloud: "antigravity"

      # --- 3. BigQuery Data Transfer Service (DTS) Ingestion ---
      - type: bigquerydatatransfer.transferConfig
        name: ${pipelineName}_gcs_dts_ingest
        metadata:
          serviceAccountName: "dataform-sa@${projectId}.iam.gserviceaccount.com"
        definition:
          displayName: "${pipelineName} GCS Parquet Ingestion"
          dataSourceId: google_cloud_storage
          schedule: "every 24 hours"
          destinationDatasetId: ${cleanTargetDs}
          params:
            data_path_template: "${sourceUri}"
            destination_table_name_template: "${cleanSourceTable}"
            file_format: "PARQUET"

      # --- 4. Dataform Repository, ReleaseConfig & WorkflowConfig ---
      - type: dataform.repository
        name: ${repoIdInput}
        definition:
          labels:
            env: ${dakEnvName}
            datacloud: "antigravity"
      - type: dataform.repository.releaseConfig
        name: ${dakEnvName}-release
        parent: ${repoIdInput}
        definition:
          gitCommitish: main
          releaseCompilationResult: auto
          codeCompilationConfig:
            defaultDatabase: "${projectId}"
      - type: dataform.repository.workflowConfig
        name: ${dakEnvName}-daily-elt
        parent: ${repoIdInput}
        definition:
          releaseConfig: "${dakEnvName}-release"
          invocationConfig:
            includedTags: ["silver", "gold"]
            transitiveDependenciesIncluded: true
          cronSchedule: "0 * * * *"
          timeZone: "UTC"`,
    [
      dakEnvName,
      projectId,
      repoIdInput,
      cleanTargetDs,
      medallionLocation,
      cleanTargetTable,
      dedupKey,
      orderByCol,
      pipelineName,
      sourceUri,
      cleanSourceTable,
    ]
  );

  const dakOrchestrationPipelineYaml = useMemo(
    () => `# File: orchestration-pipeline.yaml (Google Cloud Data Agent Kit Pipeline Schema v1.0)
# Proto Source: orchestration_pipelines_models/pipeline_v1_model/protos/orchestration_pipeline.proto
modelVersion: "1.0"
pipelineId: "${pipelineName}_medallion_orchestration"
description: "Declarative Data Agent Kit Medallion ELT + Serverless Spark Compaction Pipeline"
runner: airflow
owner: "data-engineering-team"
tags:
  - "job:datacloud:antigravity"
defaults:
  projectId: "${projectId}"
  location: "us-central1"
  executionConfig:
    retries: 2
triggers:
  - schedule:
      interval: "0 * * * *"
      startTime: "2026-01-01T00:00:00Z"
      catchup: false
      timezone: "UTC"
actions:
  - sql:
      name: "silver_dedup_and_pii_hash"
      query: |
        SELECT
          TRIM(${dedupKey}) AS ${dedupKey},
          TO_HEX(SHA256(LOWER(TRIM(user_email)))) AS user_email_sha256,
          UPPER(TRIM(event_type)) AS event_type,
          COALESCE(SAFE_CAST(revenue_usd AS FLOAT64), 0.0) AS revenue_usd,
          ${orderByCol}
        FROM \`${projectId}.${cleanSourceDs}.${cleanSourceTable}\`
        WHERE ${dedupKey} IS NOT NULL
        QUALIFY ROW_NUMBER() OVER (PARTITION BY ${dedupKey} ORDER BY ${orderByCol} DESC) = 1
      engine:
        bigquery:
          location: "${medallionLocation}"
          destinationTable: "${projectId}.${cleanTargetDs}.${cleanTargetTable}"
  - pyspark:
      name: "gold_iceberg_serverless_spark_compaction"
      dependsOn:
        - "silver_dedup_and_pii_hash"
      mainFilePath: "gs://${projectId}-raw-landing/jobs/compact_gold_iceberg.py"
      engine:
        dataprocServerless:
          location: "us-central1"
          resourceProfile:
            inline:
              runtime_config:
                version: "2.2"
                properties:
                  spark.sql.adaptive.enabled: "true"
                  spark.sql.adaptive.skewJoin.enabled: "true"`,
    [
      pipelineName,
      projectId,
      dedupKey,
      orderByCol,
      cleanSourceDs,
      cleanSourceTable,
      medallionLocation,
      cleanTargetDs,
      cleanTargetTable,
    ]
  );

  const handleRunDakSearch = async () => {
    setBusyAction('DAK_SEARCH');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'SEARCH_DATAPLEX_SEMANTIC_CATALOG',
          query: dakSearchQuery,
          mode: dakSearchMode,
        }
      );
      setDakSearchResults(res.data?.results || []);
      setDakSearchCli(res.data?.cliCommand || '');
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyAction('');
    }
  };

  const handleDeployDakBundle = async () => {
    setBusyAction('DAK_DEPLOY');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'DEPLOY_DAK_ORCHESTRATION_BUNDLE',
          envName: dakEnvName,
          region: 'us-central1',
          datasetId: cleanTargetDs,
          repoId: repoIdInput,
        }
      );
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
      await fetchOverview();
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyAction('');
    }
  };

  const handleRunSparkRcaDoctor = async () => {
    setBusyAction('SPARK_RCA');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/action`,
        {
          action: 'RUN_SPARK_LOG_RCA_DOCTOR',
          targetUri: sparkLogUri,
        }
      );
      setSparkRcaReport(res.data?.diagnosticReport || null);
      if (onShowToast && res.data?.message) onShowToast(res.data.message);
    } catch (err) {
      if (onShowError) {
        onShowError(err.response?.data?.error || err.message);
      }
    } finally {
      setBusyAction('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 p-5 text-zinc-900 dark:text-zinc-100 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30">
                2026 DATA ENGINEERING STUDIO
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                GCloud SDK {data.gcloudSdkVersion}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                Bronze → Silver → Gold Medallion ELT
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Zero-Friction Google Cloud Data Mesh, Dataform/dbt SQLX &amp; Dataplex Cockpit
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
              Replaces 7 disconnected Google Cloud Console pages (GCS, BigLake, BigQuery, Dataform, Dataplex, Serverless Spark, and Cloud Composer) with a single visual pipeline builder, automatic deduplication &amp; PII hashing (`QUALIFY ROW_NUMBER()`), Dataplex Auto-Profiling, and `$0.00/mo` Serverless ELT DAGs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchOverview}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Sync Data Mesh</span>
            </button>
          </div>
        </div>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 uppercase">
              Medallion Pipelines
            </div>
            <div className="text-base font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
              {data.medallionPipelines?.length || 0} Active
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase">
              BigQuery Datasets
            </div>
            <div className="text-base font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
              {data.datasets?.length || 0} Live
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 uppercase">
              Dataform &amp; dbt Repos
            </div>
            <div className="text-base font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
              {data.dataformRepos?.length || 0} Workspaces
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 uppercase">
              Dataplex Scans &amp; Products
            </div>
            <div className="text-base font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
              {(data.dataplexScans?.length || 0) +
                (data.dataProducts?.length || 0)}{' '}
              Governed
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase">
              Composer-Lite Savings
            </div>
            <div className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
              -$348/mo vs Airflow
            </div>
          </div>
        </div>
      </div>

      {/* 5 Friendly Sub-Studio Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#202124] p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {[
          {
            id: 'MEDALLION_ELT',
            label: '1. Medallion Pipeline Builder',
            badge: 'Source → Gold',
          },
          {
            id: 'DATAFORM_SQLX',
            label: '2. Dataform & dbt Auto-Clean SQLX',
            badge: 'QUALIFY Dedup',
          },
          {
            id: 'DATAPLEX_MESH',
            label: '3. Dataplex Profiling & Data Products',
            badge: 'SDK 588.0.0',
          },
          {
            id: 'SCHEMA_CONTRACTS',
            label: '4. Visual Schema Mapper & Contracts',
            badge: 'Zero Broken Views',
          },
          {
            id: 'SLOT_DOCTOR_DAGS',
            label: '5. Slot/Skew Doctor & Serverless DAGs',
            badge: '-$348/mo',
          },
          {
            id: 'DATA_AGENT_KIT',
            label: '6. Data Agent Kit (deployment.yaml & MCP URIs)',
            badge: 'datacloud:antigravity',
          },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveSubTab(t.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                activeSubTab === t.id
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
              }`}
            >
              {t.badge}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: MEDALLION PIPELINE BUILDER */}
      {activeSubTab === 'MEDALLION_ELT' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Cols: 3-Step Visual Wizard */}
          <div className="lg:col-span-7 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>1-Canvas "Source-to-Gold" Medallion Pipeline Builder</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Provisions Bronze (Raw), Silver (Deduplicated &amp; PII-Hashed), and Gold (Executive Mart) datasets &amp; tables in 1 click.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30">
                PHYSICAL BILLING (-54%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Pipeline Domain Prefix
                </label>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                  placeholder="customer_360_events"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Ingestion Source Type
                </label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                >
                  <option value="GCS_PARQUET">
                    Cloud Storage Parquet / CSV / JSON (BigLake)
                  </option>
                  <option value="PUBSUB_STREAM">
                    Cloud Pub/Sub Real-Time Stream (Storage Write API)
                  </option>
                  <option value="BQ_DTS">
                    BigQuery Data Transfer Service (SaaS / S3 / Ads)
                  </option>
                  <option value="CLOUDSQL_CDC">
                    Cloud SQL / AlloyDB Change Data Capture (Datastream)
                  </option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Source URI / Bucket Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sourceUri}
                    onChange={(e) => setSourceUri(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                  />
                  {data.buckets?.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setSourceUri(`gs://${e.target.value}/events/*.parquet`);
                        }
                      }}
                      className="px-2.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200"
                    >
                      <option value="">Pick Live Bucket...</option>
                      {data.buckets.map((b) => (
                        <option key={b.name} value={b.name}>
                          gs://{b.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Primary Deduplication Key (`uniqueKey`)
                </label>
                <input
                  type="text"
                  value={dedupKey}
                  onChange={(e) => setDedupKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Ordering / Partition Timestamp Column
                </label>
                <input
                  type="text"
                  value={orderByCol}
                  onChange={(e) => setOrderByCol(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Daily Ingestion Volume: {dataVolumeGbDay} GB/day
                </label>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  value={dataVolumeGbDay}
                  onChange={(e) => setDataVolumeGbDay(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Freshness SLA Target
                </label>
                <select
                  value={latencySla}
                  onChange={(e) => setLatencySla(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                >
                  <option value="BATCH_15M">⏱Near-Real-Time Micro-Batch (15 min)</option>
                  <option value="HOURLY">Hourly Medallion ELT</option>
                  <option value="STREAMING_SUB_5S">Sub-5-Second Streaming</option>
                </select>
              </div>
            </div>

            {/* Smart Engine Advisor Card */}
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-blue-600 dark:text-blue-300">
                  Smart Engine Advisor: {engineRecommendation.engine}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                  Est. ${engineRecommendation.estMonthlyUsd}/mo
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                {engineRecommendation.why}
              </p>
            </div>

            {/* Visual 3-Stage Medallion Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="text-[10px] font-mono font-bold text-amber-500">
                  STAGE 1 · BRONZE RAW
                </div>
                <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white truncate mt-0.5">
                  {pipelineName}_bronze_raw
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  Append-only raw landing + `_PARTITIONTIME`
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-500/10 border border-slate-400/30">
                <div className="text-[10px] font-mono font-bold text-slate-400">
                  STAGE 2 · SILVER CLEANED
                </div>
                <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white truncate mt-0.5">
                  {pipelineName}_silver_cleaned
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  `QUALIFY ROW_NUMBER() = 1` + PII `SHA256`
                </div>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <div className="text-[10px] font-mono font-bold text-yellow-500">
                  STAGE 3 · GOLD MARTS
                </div>
                <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white truncate mt-0.5">
                  {pipelineName}_gold_marts
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  BI &amp; Vertex AI RAG Materialized Marts
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDeployMedallion}
              disabled={busyAction === 'DEPLOY_MEDALLION'}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-extrabold shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
            >
              {busyAction === 'DEPLOY_MEDALLION'
                ? '⏳ Provisioning Bronze → Silver → Gold Datasets & Running Initial Dedup MERGE...'
                : `1-Click Provision "${pipelineName}" Bronze → Silver → Gold Medallion Lakehouse`}
            </button>
          </div>

          {/* Right 5 Cols: Active Medallion Pipelines */}
          <div className="lg:col-span-5 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white">
                Active Medallion Lakehouse Pipelines ({data.medallionPipelines?.length || 0})
              </h3>
              <span className="text-[10px] font-mono text-emerald-500 font-bold">
                ● LIVE BIGQUERY ELT
              </span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {(data.medallionPipelines || []).map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono font-extrabold text-xs text-zinc-900 dark:text-white">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        {p.status}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteResource('MEDALLION_PIPELINE', p.id, p.region)
                        }
                        title={`Delete Medallion pipeline ${p.name}`}
                        className="p-1 rounded hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-zinc-500 truncate">
                    Source: {p.sourceUri}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/25">
                      {p.bronzeDataset}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">
                      {p.silverDataset}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/25">
                      {p.goldDataset}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span>
                      Clean Rows: <strong className="text-emerald-500">{p.rowsProcessed}</strong> · Quarantined Dups: <strong className="text-amber-500">{p.quarantinedRows}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCleanSourceDs(p.bronzeDataset);
                        setCleanTargetDs(p.silverDataset);
                        setActiveSubTab('DATAFORM_SQLX');
                      }}
                      className="text-blue-500 hover:underline font-bold cursor-pointer"
                    >
                      Open in SQLX Studio →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DATAFORM & DBT AUTO-CLEAN SQLX STUDIO */}
      {activeSubTab === 'DATAFORM_SQLX' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>Auto-Clean, Deduplicate &amp; PII Hash Generator (Dataform `.sqlx` &amp; dbt `.sql`)</span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Generates incremental Partitioned + Clustered MERGE models with `QUALIFY ROW_NUMBER() = 1`, `SAFE_CAST`, and Data Quality Assertions.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDialect('DATAFORM_SQLX')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer ${
                    dialect === 'DATAFORM_SQLX'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                  }`}
                >
                  Dataform .sqlx
                </button>
                <button
                  type="button"
                  onClick={() => setDialect('DBT_SQL')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer ${
                    dialect === 'DBT_SQL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                  }`}
                >
                  dbt .sql
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Bronze Source Dataset
                </label>
                <input
                  type="text"
                  value={cleanSourceDs}
                  onChange={(e) => setCleanSourceDs(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Bronze Source Table
                </label>
                <input
                  type="text"
                  value={cleanSourceTable}
                  onChange={(e) => setCleanSourceTable(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Silver Target Dataset
                </label>
                <input
                  type="text"
                  value={cleanTargetDs}
                  onChange={(e) => setCleanTargetDs(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Silver Target Table
                </label>
                <input
                  type="text"
                  value={cleanTargetTable}
                  onChange={(e) => setCleanTargetTable(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <div className="relative">
              <pre className="p-3.5 rounded-xl bg-zinc-950 text-emerald-300 border border-zinc-800 text-[11px] font-mono overflow-x-auto leading-relaxed max-h-[300px]">
                {generatedTransformationCode}
              </pre>
              <button
                type="button"
                onClick={() => copyText(generatedTransformationCode, 'sqlx')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'sqlx' ? (
                  <>
                    <Check className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Model</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRunAutoCleanSql}
                disabled={busyAction === 'RUN_SQL'}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                {busyAction === 'RUN_SQL'
                  ? '⏳ Running Auto-Clean & QUALIFY Deduplication on BigQuery...'
                  : '▶Execute Auto-Clean & Deduplicate SQL Live on BigQuery'}
              </button>
            </div>

            {cleanQueryResult && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-500">
                  <span>
                    ✓ BigQuery Job {cleanQueryResult.jobId} · {cleanQueryResult.totalRows} Deduplicated Rows
                  </span>
                  <span>{cleanQueryResult.bytesProcessed} Bytes Scanned</span>
                </div>
                {cleanQueryResult.rows?.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-mono text-left">
                      <thead>
                        <tr className="border-b border-emerald-500/20 text-zinc-400">
                          {(cleanQueryResult.fields || []).map((f) => (
                            <th key={f} className="py-1 pr-3">
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cleanQueryResult.rows.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-zinc-800/40 text-zinc-800 dark:text-zinc-200"
                          >
                            {row.map((val, cIdx) => (
                              <td key={cIdx} className="py-1 pr-3 truncate max-w-[180px]">
                                {String(val ?? 'NULL')}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right 5 Cols: Native Dataform Repositories (`dataform.googleapis.com/v1beta1`) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Native Dataform Repositories (`dataform.googleapis.com/v1beta1`)</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Create a managed Dataform Repository + Workspace in 1 click without wrestling with `workflow_settings.yaml`.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={repoIdInput}
                onChange={(e) => setRepoIdInput(e.target.value)}
                placeholder="cloudpulse-medallion-elt"
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
              />
              <select
                value={repoRegion}
                onChange={(e) => setRepoRegion(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
              >
                <option value="us-central1">us-central1</option>
                <option value="us-east1">us-east1</option>
                <option value="europe-west1">europe-west1</option>
              </select>
              <button
                type="button"
                onClick={handleCreateDataformRepo}
                disabled={busyAction === 'CREATE_DATAFORM'}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                {busyAction === 'CREATE_DATAFORM' ? 'Creating...' : '+ Create Repo'}
              </button>
            </div>

            <div className="space-y-2.5 max-h-[340px] overflow-y-auto">
              {(data.dataformRepos || []).length === 0 ? (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 text-center">
                  No Dataform repositories yet. Click &ldquo;+ Create Repo&rdquo; above to initialize a live repository &amp; `main-workspace`.
                </div>
              ) : (
                data.dataformRepos.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                        {r.id} ({r.region})
                      </div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {r.gitRemote} · Branch: {r.defaultBranch}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteResource('DATAFORM_REPO', r.id, r.region)
                      }
                      className="p-1.5 rounded-lg hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
                      title={`Delete Dataform Repository ${r.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATAPLEX AUTO-PROFILING & DATA MESH PRODUCTS (SDK 588.0.0) */}
      {activeSubTab === 'DATAPLEX_MESH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 6 Cols: Dataplex Auto Data Profiling & Quality Scans */}
          <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Dataplex Auto Data Profiling &amp; Quality Scans (`gcloud dataplex datascans`)</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Automatically scans null rates, cardinality, distributions, and enforces non-null / uniqueness expectations on BigQuery &amp; BigLake tables.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Scan Type
                </label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                >
                  <option value="DATA_PROFILE">DATA_PROFILE (Nulls &amp; Dist)</option>
                  <option value="DATA_QUALITY">DATA_QUALITY (Rules Gate)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Target Dataset
                </label>
                <input
                  type="text"
                  value={scanDataset}
                  onChange={(e) => setScanDataset(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Target Table
                </label>
                <input
                  type="text"
                  value={scanTable}
                  onChange={(e) => setScanTable(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateDataplexScan}
              disabled={busyAction === 'CREATE_SCAN'}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
            >
              {busyAction === 'CREATE_SCAN'
                ? '⏳ Creating Dataplex Scan via dataplex.googleapis.com/v1...'
                : `1-Click Launch Dataplex ${scanType} Scan on ${scanDataset}.${scanTable}`}
            </button>

            <div className="space-y-2 max-h-[280px] overflow-y-auto">
              {(data.dataplexScans || []).map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                      {s.id}{' '}
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/15 text-emerald-500">
                        {s.type}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate max-w-md">
                      {s.targetResource}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteResource('DATAPLEX_SCAN', s.id, s.location)
                    }
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 Cols: Dataplex Data Mesh Products & dbt Metadata Sync (SDK 588.0.0) */}
          <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Dataplex Data Mesh Products &amp; `dbt` Metadata Sync (`gcloud 588.0.0`)</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Publish Gold tables as governed Dataplex Data Products (`gcloud dataplex data-products`) and ingest `dbt-core` manifests (`gcloud dataplex dbt metadata-jobs`).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Data Product Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Business Domain
                </label>
                <input
                  type="text"
                  value={productDomain}
                  onChange={(e) => setProductDomain(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                  Freshness SLA (Minutes)
                </label>
                <input
                  type="number"
                  value={productSla}
                  onChange={(e) => setProductSla(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateDataProduct}
              disabled={busyAction === 'CREATE_PRODUCT'}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
            >
              {busyAction === 'CREATE_PRODUCT'
                ? '⏳ Publishing Data Product & Syncing dbt Manifest...'
                : '1-Click Publish Dataplex Data Product & Sync dbt-core Lineage'}
            </button>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto">
              {(data.dataProducts || []).map((dp) => (
                <div
                  key={dp.id}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>{dp.displayName}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] bg-blue-500/15 text-blue-400">
                        Quality {dp.qualityScore}%
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      Domain: {dp.domain} · SLA: {dp.slaFreshnessMinutes}m · dbt Synced:
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteResource('DATA_PRODUCT', dp.id, dp.location)
                    }
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VISUAL SCHEMA MAPPER & CONTRACT FIREWALL */}
      {activeSubTab === 'SCHEMA_CONTRACTS' && (
        <div className="bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                Interactive Source ↔ Target Schema Mapper &amp; Downstream View Contract Firewall
              </h3>
              <p className="text-xs text-zinc-500">
                Maps raw Bronze fields to strongly-typed Silver/Gold columns and checks downstream BigQuery views &amp; BI dashboards before any schema change.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              0 BREAKING DOWNSTREAM CHANGES
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 text-[10px] uppercase">
                  <th className="py-2 pr-3">Bronze Source Column</th>
                  <th className="py-2 pr-3">Source Type</th>
                  <th className="py-2 pr-3">Silver Target Column</th>
                  <th className="py-2 pr-3">Target Type</th>
                  <th className="py-2 pr-3">Auto-Clean SQL Rule</th>
                  <th className="py-2 pr-3">PII Shield</th>
                  <th className="py-2">Downstream Consumers Protected</th>
                </tr>
              </thead>
              <tbody>
                {schemaMappings.map((m, idx) => (
                  <tr
                    key={m.sourceField}
                    className="border-b border-zinc-200/60 dark:border-zinc-800/60"
                  >
                    <td className="py-2.5 pr-3 font-bold text-zinc-900 dark:text-white">
                      {m.sourceField}
                    </td>
                    <td className="py-2.5 pr-3 text-zinc-500">{m.sourceType}</td>
                    <td className="py-2.5 pr-3 font-bold text-blue-500">
                      {m.targetField}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[10px]">
                        {m.targetType}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-emerald-500 text-[11px]">
                      {m.transform}
                    </td>
                    <td className="py-2.5 pr-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSchemaMappings((prev) =>
                            prev.map((row, rIdx) =>
                              rIdx === idx
                                ? {
                                    ...row,
                                    isPii: !row.isPii,
                                    transform: !row.isPii
                                      ? 'TO_HEX(SHA256(LOWER(TRIM(col))))'
                                      : 'TRIM(col)',
                                  }
                                : row
                            )
                          );
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          m.isPii
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {m.isPii ? 'SHA-256 PII' : 'Public Col'}
                      </button>
                    </td>
                    <td className="py-2.5 text-[10px] text-zinc-400">
                      {m.downstreamUsedBy.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: BIGQUERY SLOT/SKEW DOCTOR & COMPOSER-LITE SERVERLESS DAGS */}
      {activeSubTab === 'SLOT_DOCTOR_DAGS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 6 Cols: Live BigQuery Job & Slot/Skew Doctor */}
          <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>BigQuery `JOBS_BY_PROJECT` Slot Contention &amp; Skew Doctor</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Inspects live query execution telemetry to flag missing partition filters, `SELECT *` waste, and On-Demand ($6.25/TB) vs. Editions Slot pricing.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto">
              {(data.jobDiagnostics || []).length === 0 ? (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500">
                  No recent BigQuery jobs found in this project yet. Run a Medallion provision or Auto-Clean SQL query to populate live job diagnostics!
                </div>
              ) : (
                data.jobDiagnostics.map((j) => (
                  <div
                    key={j.jobId}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-extrabold text-zinc-900 dark:text-white">
                        Job {j.jobId.slice(0, 18)} ({j.statementType})
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold">
                        {j.bytesProcessed} B · {j.slotMs} slot-ms
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 truncate">
                      {j.sqlPreview}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="text-amber-500 font-bold">
                        {j.recommendation}
                      </span>
                      <span className="text-zinc-400">
                        On-Demand: ${j.onDemandCostUsd}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right 6 Cols: Composer-Lite Serverless DAG Builder (-$348/mo FinOps Saver) */}
          <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>&ldquo;Composer-Lite&rdquo; Serverless DAG Transpiler (`workflows.googleapis.com/v1`)</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  SAVES ~$348/MO
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Replaces a $350/mo idle Cloud Composer (Airflow) cluster with a `$0.00/mo` Serverless Google Cloud Workflow DAG (first 5,000 steps/mo free).
              </p>
            </div>

            <pre className="p-3 rounded-xl bg-zinc-950 text-amber-300 border border-zinc-800 text-[10px] font-mono overflow-x-auto">
              {airflowSample}
            </pre>

            <div className="flex gap-2">
              <input
                type="text"
                value={dagIdInput}
                onChange={(e) => setDagIdInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleDeployServerlessDag}
                disabled={busyAction === 'DEPLOY_DAG'}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                {busyAction === 'DEPLOY_DAG'
                  ? 'Deploying...'
                  : '1-Click Deploy $0/mo Serverless DAG'}
              </button>
            </div>

            <div className="space-y-2 max-h-[190px] overflow-y-auto">
              {(data.serverlessDags || []).map((d) => (
                <div
                  key={d.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                      ⏱{d.id} ({d.region})
                    </div>
                    <div className="text-[10px] font-mono text-emerald-500">
                      State: {d.state} · Saving ~$348/mo vs. Cloud Composer
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteResource('SERVERLESS_DAG', d.id, d.region)
                    }
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: GOOGLE CLOUD DATA AGENT KIT (deployment.yaml, Semantic Search & Streaming Spark RCA) */}
      {activeSubTab === 'DATA_AGENT_KIT' && (
        <div className="space-y-5">
          {/* Top Row: 2-File Declarative GitOps Composer (`deployment.yaml` + `orchestration-pipeline.yaml`) & Supported Resource Types */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 7 Cols: 2-File Data Agent Kit YAML Composer */}
            <div className="lg:col-span-7 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>
                      Data Agent Kit 2-File Declarative Bundle (`deployment.yaml` + `orchestration-pipeline.yaml`)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Follows the official Google Cloud Data Agent Kit spec (`gcloud beta orchestration-pipelines`) with mandatory `datacloud: &quot;antigravity&quot;` attribution labels and `job:datacloud:antigravity` pipeline tags.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {['dev', 'stage', 'prod'].map((env) => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setDakEnvName(env)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer ${
                        dakEnvName === env
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                      }`}
                    >
                      {env}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDakFileTab('DEPLOYMENT_YAML')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                      dakFileTab === 'DEPLOYMENT_YAML'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    1. deployment.yaml (Resources &amp; Env)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDakFileTab('ORCHESTRATION_YAML')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                      dakFileTab === 'ORCHESTRATION_YAML'
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    2. orchestration-pipeline.yaml (DAG Actions)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        dakFileTab === 'DEPLOYMENT_YAML'
                          ? dakDeploymentYaml
                          : dakOrchestrationPipelineYaml,
                        'DAK_YAML'
                      )
                    }
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer text-zinc-700 dark:text-zinc-300"
                  >
                    {copiedKey === 'DAK_YAML' ? (
                      <Check className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'DAK_YAML' ? 'Copied' : 'Copy YAML'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeployDakBundle}
                    disabled={busyAction === 'DAK_DEPLOY'}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === 'DAK_DEPLOY'
                      ? 'Applying Bundle...'
                      : `Validate & Apply (${dakEnvName})`}
                  </button>
                </div>
              </div>

              <pre className="p-3.5 rounded-xl bg-zinc-950 text-blue-300 border border-zinc-800 text-[11px] font-mono overflow-x-auto max-h-[360px] leading-relaxed">
                {dakFileTab === 'DEPLOYMENT_YAML'
                  ? dakDeploymentYaml
                  : dakOrchestrationPipelineYaml}
              </pre>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 flex flex-wrap items-center justify-between gap-2">
                <span>
                  Enforced Resource Attribution (`enforcing-resource-attribution` v6): `datacloud: &quot;antigravity&quot;` + `--label datacloud:antigravity`
                </span>
                <span className="font-bold">
                  CLOUDSDK_METRICS_ENVIRONMENT=&quot;datacloud.antigravity&quot;
                </span>
              </div>
            </div>

            {/* Right 5 Cols: Canonical Data Agent Kit MCP URIs & Supported Resource Types */}
            <div className="lg:col-span-5 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white">
                  Canonical Data Agent Kit MCP Resource URIs (`read_resource`)
                </h3>
                <p className="text-xs text-zinc-500">
                  Copy-ready MCP URIs (`bq://`, `lakehouse://`, `spark://`, `gcs://`) compatible with Antigravity, VS Code, Gemini CLI, and Claude Code.
                </p>
              </div>

              <div className="space-y-2 max-h-[195px] overflow-y-auto">
                {(data.dakResourceUris || []).map((u) => (
                  <div
                    key={u.uri}
                    className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {u.kind}
                        </span>
                        <span className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">
                          {u.label}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-blue-400 truncate mt-0.5">
                        {u.uri}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(u.uri, u.uri)}
                      className="px-2 py-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 hover:bg-blue-500/20 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer shrink-0"
                    >
                      {copiedKey === u.uri ? '✓ Copied' : 'Copy URI'}
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white">
                  Supported `gcloud beta orchestration-pipelines` Resource Types
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[165px] overflow-y-auto">
                  {(data.dakSupportedResourceTypes || []).map((rt) => (
                    <div
                      key={rt.type}
                      className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    >
                      <div className="text-[10px] font-mono font-bold text-blue-500 truncate">
                        {rt.type}
                      </div>
                      <div className="text-[9px] text-zinc-500 line-clamp-2">
                        {rt.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Dataplex Semantic Asset Search (`--semantic-search`) & Streaming Spark Event Log RCA Doctor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left 6 Cols: Dataplex Universal Semantic & Keyword Catalog Discovery */}
            <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>
                    Dataplex Universal Semantic &amp; Keyword Asset Search (`discovering-gcp-data-assets`)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Superior to `bq ls`: searches BigQuery, BigLake Iceberg, Cloud Storage, Spanner &amp; Cloud SQL using `gcloud dataplex entries search --semantic-search`.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={dakSearchQuery}
                  onChange={(e) => setDakSearchQuery(e.target.value)}
                  placeholder="e.g. customer revenue events silver OR system=bigquery type=bigquery-table"
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
                <select
                  value={dakSearchMode}
                  onChange={(e) => setDakSearchMode(e.target.value)}
                  className="px-2.5 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                >
                  <option value="SEMANTIC">Semantic (--semantic-search)</option>
                  <option value="KEYWORD">Keyword DSL (system=bigquery)</option>
                </select>
                <button
                  type="button"
                  onClick={handleRunDakSearch}
                  disabled={busyAction === 'DAK_SEARCH'}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'DAK_SEARCH' ? 'Searching...' : 'Search Catalog'}
                </button>
              </div>

              {dakSearchCli && (
                <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-blue-300 overflow-x-auto">
                  $ {dakSearchCli}
                </div>
              )}

              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {dakSearchResults.map((r) => (
                  <div
                    key={r.entryName}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          {r.system}
                        </span>
                        <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-white truncate">
                          {r.displayName}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-blue-500 truncate mt-0.5">
                        {r.dakUri}
                      </div>
                      <div className="text-[10px] text-zinc-500 truncate">
                        {r.description}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(r.dakUri, r.entryName)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer shrink-0"
                    >
                      {copiedKey === r.entryName ? '✓ Copied' : 'Copy URI'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 6 Cols: Streaming Spark Event Log & Driver Output RCA Doctor (`gcp-spark-troubleshooting`) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>
                    Streaming Spark Event Log &amp; OOM Root-Cause Doctor (`gcp-spark-troubleshooting`)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Streams multi-GB `.zst`/`.gz` Spark event logs in a single pass (`spark_gcs_log_reader.py --action=summarize_events`) without loading files into memory.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={sparkLogUri}
                  onChange={(e) => setSparkLogUri(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleRunSparkRcaDoctor}
                  disabled={busyAction === 'SPARK_RCA'}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'SPARK_RCA'
                    ? 'Streaming...'
                    : 'Stream & Diagnose RCA'}
                </button>
              </div>

              {sparkRcaReport && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-amber-500/40 space-y-2.5 text-xs font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                    <span className="text-amber-400 font-extrabold">
                      {sparkRcaReport.rootCauseCategory}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {sparkRcaReport.fileSizeChecked}
                    </span>
                  </div>
                  <div className="text-[11px] text-red-400">
                    {sparkRcaReport.exceptionSignature}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                      <div className="text-[9px] text-zinc-500">Median Task</div>
                      <div className="text-emerald-400 font-bold">
                        {sparkRcaReport.skewMetrics.medianTaskDurationMs} ms
                      </div>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                      <div className="text-[9px] text-zinc-500">P99 Skew Task</div>
                      <div className="text-red-400 font-bold">
                        {sparkRcaReport.skewMetrics.p99TaskDurationMs} ms
                      </div>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                      <div className="text-[9px] text-zinc-500">Median Shuffle</div>
                      <div className="text-emerald-400 font-bold">
                        {sparkRcaReport.skewMetrics.medianTaskShuffleReadMb} MB
                      </div>
                    </div>
                    <div className="p-2 rounded bg-zinc-900 border border-zinc-800">
                      <div className="text-[9px] text-zinc-500">Max Skew Partition</div>
                      <div className="text-red-400 font-bold">
                        {sparkRcaReport.skewMetrics.maxTaskShuffleReadMb} MB
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] text-blue-400 font-bold">
                      Prescribed Spark 2.2 Fixes:
                    </div>
                    {sparkRcaReport.recommendedFixes.map((fix) => (
                      <div key={fix} className="text-[10px] text-zinc-300">
                        • {fix}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
