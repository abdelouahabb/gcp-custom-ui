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
import IcebergLakehousePlaybookMatrix from './IcebergLakehousePlaybookMatrix';

export default function DataEngineeringStudio({
  projectId,
  initialSubTab,
  onNavigateTab,
  onOpenBigQuerySql,
  onOpenBigLakeStudio,
  onOpenHealthAndDrift,
  onOpenTimeMachine,
  onShowToast,
  onShowError,
  onRunInShell,
}) {
  const [activeSubTab, setActiveSubTab] = useState(
    initialSubTab || 'ICEBERG_50_MATRIX'
  );
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [copiedKey, setCopiedKey] = useState('');
  const [data, setData] = useState({
    gcloudSdkVersion: '590.0.1 (2026.10.22)',
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

  const [sparkBatches, setSparkBatches] = useState([]);
  const [sparkBatchId, setSparkBatchId] = useState('iceberg-medallion-etl-2026');
  const [sparkRegion, setSparkRegion] = useState('us-central1');
  const [sparkBucket, setSparkBucket] = useState(`${projectId || 'gcp-project'}-iceberg-lake`);
  const [sparkTemplate, setSparkTemplate] = useState('ICEBERG_MEDALLION');

  // 9. Native GCP Lakehouse Workspace (BigFrames + BQ AI.FORECAST + DLT-Killer + BQML/Vertex Registry)
  const [lakehouseActiveCell, setLakehouseActiveCell] = useState('CELL_1_EXPLORE');
  const [dltExpectNonNull, setDltExpectNonNull] = useState(true);
  const [dltExpectUnique, setDltExpectUnique] = useState(true);
  const [dltExpectPositiveRev, setDltExpectPositiveRev] = useState(true);
  const [dltQuarantineDlq, setDltQuarantineDlq] = useState(true);
  const [bqmlModelType, setBqmlModelType] = useState('TIMESFM_FORECAST');

  const fetchOverview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [res, w10Res] = await Promise.all([
        axios.get(
          `/api/project/${encodeURIComponent(projectId)}/data-engineer/overview`
        ),
        axios
          .get(`/api/project/${encodeURIComponent(projectId)}/wave10/frontier`)
          .catch(() => ({ data: { sparkBatches: [] } })),
      ]);
      if (res.data) {
        setData(res.data);
        if (!sourceUri && res.data.buckets?.[0]?.name) {
          setSourceUri(`gs://${res.data.buckets[0].name}/events/*.parquet`);
          setSparkBucket(res.data.buckets[0].name);
        } else if (!sourceUri) {
          setSourceUri(`gs://${projectId}-raw-landing/events/*.parquet`);
          setSparkBucket(`${projectId}-iceberg-lake`);
        }
      }
      if (w10Res.data?.sparkBatches) {
        setSparkBatches(w10Res.data.sparkBatches);
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

  const handleDeleteResource = async (
    resourceKind,
    id,
    region = 'us-central1',
    name = ''
  ) => {
    try {
      const payload = { resourceKind, id, name: name || id, region };
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(projectId)}/data-engineer/resource`,
        {
          params: payload,
          data: payload,
        }
      );
      setData((prev) => ({
        ...prev,
        medallionPipelines: (prev.medallionPipelines || []).filter(
          (m) => m.id !== id && m.name !== id && (!name || m.name !== name)
        ),
        dataformRepos: (prev.dataformRepos || []).filter((r) => r.id !== id),
        dataplexScans: (prev.dataplexScans || []).filter((s) => s.id !== id),
        dataProducts: (prev.dataProducts || []).filter((p) => p.id !== id),
        serverlessDags: (prev.serverlessDags || []).filter((d) => d.id !== id),
      }));
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

  const sparkArtifacts = useMemo(() => {
    const cleanBkt = (sparkBucket || `${projectId}-iceberg-lake`).replace(/^gs:\/\//, '');
    const pysparkCode = `# CloudPulse 2026 — Zero-Cluster Serverless Spark 3.5 on BigLake Apache Iceberg
# FinOps Breakthrough: $0.00/hr idle cluster cost · Sub-30s autoscaling · Open Parquet + Iceberg on GCS
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, current_timestamp, to_date, sum as _sum, count

spark = (
    SparkSession.builder
    .appName("${sparkBatchId}")
    .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
    .config("spark.sql.catalog.biglake", "org.apache.iceberg.spark.SparkCatalog")
    .config("spark.sql.catalog.biglake.catalog-impl", "org.apache.iceberg.gcp.biglake.BigLakeCatalog")
    .config("spark.sql.catalog.biglake.gcp_project", "${projectId}")
    .config("spark.sql.catalog.biglake.gcp_location", "${sparkRegion}")
    .config("spark.sql.catalog.biglake.blms_catalog", "cloudpulse_lakehouse")
    .config("spark.sql.catalog.biglake.warehouse", "gs://${cleanBkt}/iceberg-warehouse")
    .getOrCreate()
)

# 1. Read Raw Bronze Parquet/JSON events from Cloud Storage
df_bronze = spark.read.parquet("gs://${cleanBkt}/bronze/events/*.parquet")

# 2. Cleanse, deduplicate & aggregate into Silver/Gold Medallion Iceberg table (ACID + Time Travel)
df_gold = (
    df_bronze
    .filter(col("status") == "SUCCEEDED")
    .withColumn("event_date", to_date(col("event_ts")))
    .groupBy("event_date", "service_name", "region")
    .agg(
        count("*").alias("total_requests"),
        _sum("cost_usd").alias("total_spend_usd")
    )
    .withColumn("processed_at", current_timestamp())
)

# 3. ACID Merge / Append into BigLake Iceberg Table (Readable by BigQuery, Spark, Trino & DuckDB!)
df_gold.writeTo("biglake.finops_2026.daily_service_rollups").using("iceberg").tableProperty("format-version", "2").createOrReplace()
print("Zero-Cluster Serverless Spark Iceberg Medallion Commit Complete!")`;

    const cliCmd = `gcloud dataproc batches submit pyspark gs://${cleanBkt}/jobs/${sparkBatchId}.py \\
  --project=${projectId} \\
  --region=${sparkRegion} \\
  --batch=${sparkBatchId} \\
  --version=2.2 \\
  --deps-bucket=gs://${cleanBkt} \\
  --properties="spark.dynamicAllocation.enabled=true,spark.dynamicAllocation.minExecutors=2,spark.dynamicAllocation.maxExecutors=16"`;

    return { pysparkCode, cliCmd, cleanBkt };
  }, [projectId, sparkBatchId, sparkRegion, sparkBucket]);

  const handleSubmitServerlessSpark = async () => {
    setBusyAction('SUBMIT_SPARK');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave10/action`,
        {
          action: 'SUBMIT_SERVERLESS_SPARK',
          batchId: sparkBatchId,
          region: sparkRegion,
          bucket: sparkArtifacts.cleanBkt,
          template: sparkTemplate,
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
              data-feature-id="DATA_ENG_SYNC_MESH_BTN"
              onClick={fetchOverview}
              disabled={loading}
              className="px-3.5 py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
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

        {/* 9 Symmetrical In-Studio Navigation Tabs (3x3 Equal-Sized Bento Grid — Stays Inside Data Engineering Studio) */}
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Data Engineering Cockpit Modules (Select Module Below):</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              {
                id: 'ICEBERG_50_MATRIX',
                icon: Layers,
                label: '50-Playbook Iceberg Lakehouse Matrix',
                badge: '50 Scenarios',
              },
              {
                id: 'MEDALLION_ELT',
                icon: GitBranch,
                label: 'Medallion Pipeline Builder',
                badge: 'Source → Gold',
              },
              {
                id: 'DATAFORM_SQLX',
                icon: Sparkles,
                label: 'Dataform & dbt Auto-Clean SQLX',
                badge: 'QUALIFY Dedup',
              },
              {
                id: 'DATAPLEX_MESH',
                icon: ShieldCheck,
                label: 'Dataplex Profiling & Data Products',
                badge: 'SDK 590.0.1',
              },
              {
                id: 'SCHEMA_CONTRACTS',
                icon: FileCode,
                label: 'Visual Schema Mapper & Contracts',
                badge: 'Zero Breakage',
              },
              {
                id: 'SLOT_DOCTOR_DAGS',
                icon: Cpu,
                label: 'Slot/Skew Doctor & Serverless DAGs',
                badge: '-$348/mo',
              },
              {
                id: 'DATA_AGENT_KIT',
                icon: Workflow,
                label: 'Data Agent Kit (deployment.yaml & MCP)',
                badge: 'MCP URIs',
              },
              {
                id: 'SERVERLESS_SPARK',
                icon: Zap,
                label: 'Serverless Spark & BigLake Iceberg',
                badge: '$0 Idle',
              },
              {
                id: 'GCP_LAKEHOUSE_WORKSPACE',
                icon: Database,
                label: 'GCP Native Lakehouse (BigFrames + AI.FORECAST + DLT)',
                badge: '100% GCP Tech',
              },
            ].map((t) => {
              const Icon = t.icon || Layers;
              const isActive = activeSubTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  data-feature-id={t.id}
                  onClick={() => setActiveSubTab(t.id)}
                  title={`${t.label} (${t.badge})`}
                  className={`w-full h-11 px-3 rounded-md text-xs font-mono font-bold transition-all cursor-pointer border flex items-center justify-between gap-2 ${
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
                    <span className="truncate">{t.label}</span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-extrabold shrink-0 ${
                      isActive
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

      {/* TAB 0: 50-PLAYBOOK BORDERLESS ICEBERG LAKEHOUSE MATRIX */}
      {activeSubTab === 'ICEBERG_50_MATRIX' && (
        <IcebergLakehousePlaybookMatrix
          projectId={projectId}
          onRunInShell={onRunInShell}
          onOpenBigQuerySql={onOpenBigQuerySql}
          onNavigateTab={onNavigateTab}
          onOpenBigLakeStudio={onOpenBigLakeStudio}
          onOpenServerlessSpark={({ bucket, batchId }) => {
            if (bucket) setSparkBucket(bucket);
            if (batchId) setSparkBatchId(batchId);
            setActiveSubTab('SERVERLESS_SPARK');
            onShowToast?.(
              `Loaded Iceberg Playbook into Serverless Spark Studio (${
                batchId || 'spark-iceberg-batch'
              })`
            );
          }}
          onShowToast={onShowToast}
          onShowError={onShowError}
        />
      )}

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
                  <option value="BATCH_15M">Near-Real-Time Micro-Batch (15 min)</option>
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
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
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="text-[10px] font-mono font-bold text-amber-500">
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
              className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-extrabold shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
            >
              {busyAction === 'DEPLOY_MEDALLION'
                ? 'Provisioning Bronze → Silver → Gold Datasets & Running Initial Dedup MERGE...'
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                        {p.status}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteResource(
                            'MEDALLION_PIPELINE',
                            p.id,
                            p.region,
                            p.name
                          )
                        }
                        title={`Delete Medallion pipeline ${p.name} and drop its Bronze/Silver/Gold BigQuery datasets`}
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
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/25">
                      {p.bronzeDataset}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25">
                      {p.silverDataset}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-500" />
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/25">
                      {p.goldDataset}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span>
                      Clean Rows: <strong className="text-emerald-500">{p.rowsProcessed}</strong> · Quarantined Dups: <strong className="text-amber-500">{p.quarantinedRows}</strong>
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
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
                      {onOpenBigQuerySql && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenBigQuerySql(
                              `-- Medallion Silver -> Gold Inspection (${p.name})\nSELECT *\nFROM \`${projectId}.${p.silverDataset}.cleaned_events\`\nWHERE DATE(${orderByCol}) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)\nQUALIFY ROW_NUMBER() OVER (PARTITION BY ${dedupKey} ORDER BY ${orderByCol} DESC) = 1\nLIMIT 100;`
                            )
                          }
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold cursor-pointer"
                        >
                          Dry-Run in BigQuery X-Ray →
                        </button>
                      )}
                      {onOpenBigLakeStudio && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenBigLakeStudio('METASTORE_CATALOGS')
                          }
                          className="text-blue-500 hover:underline font-bold cursor-pointer"
                        >
                          BigLake Catalog →
                        </button>
                      )}
                    </div>
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
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold cursor-pointer ${
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
              <pre className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-300 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono overflow-x-auto leading-relaxed max-h-[300px]">
                {generatedTransformationCode}
              </pre>
              <button
                type="button"
                onClick={() => copyText(generatedTransformationCode, 'sqlx')}
                className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
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
                className="flex-1 py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
              >
                {busyAction === 'RUN_SQL'
                  ? 'Running Auto-Clean & QUALIFY Deduplication on BigQuery...'
                  : '▶ Execute Auto-Clean & Deduplicate SQL Live on BigQuery'}
              </button>
              {onOpenBigQuerySql && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenBigQuerySql(
                      `-- Dataform / dbt Auto-Clean & QUALIFY Deduplication Model (${cleanSourceDs}.${cleanSourceTable} -> ${cleanTargetDs}.${cleanTargetTable})\nSELECT\n  TRIM(CAST(${dedupKey} AS STRING)) AS ${dedupKey},\n  SAFE_CAST(${orderByCol} AS TIMESTAMP) AS ${orderByCol},\n  TO_HEX(SHA256(LOWER(TRIM(CAST(user_email AS STRING))))) AS user_email_sha256,\n  SAFE_CAST(revenue_usd AS NUMERIC) AS revenue_usd\nFROM \`${projectId}.${cleanSourceDs}.${cleanSourceTable}\`\nWHERE ${dedupKey} IS NOT NULL\nQUALIFY ROW_NUMBER() OVER (\n  PARTITION BY ${dedupKey}\n  ORDER BY ${orderByCol} DESC\n) = 1;`
                    )
                  }
                  className="py-2.5 px-3.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 text-blue-700 dark:text-blue-300 border border-blue-500/30 text-xs font-mono font-extrabold cursor-pointer transition-colors"
                >
                  Open in BigQuery SQL X-Ray →
                </button>
              )}
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
                            className="border-b border-zinc-200 dark:border-zinc-800/40 text-zinc-800 dark:text-zinc-200"
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
                className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
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
                      className="p-1.5 rounded-md hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
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
              className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
            >
              {busyAction === 'CREATE_SCAN'
                ? 'Creating Dataplex Scan via dataplex.googleapis.com/v1...'
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
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/15 text-emerald-500">
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
                    className="p-1.5 rounded-md hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 Cols: Dataplex Data Mesh Products & dbt Metadata Sync (SDK 590.0.1) */}
          <div className="lg:col-span-6 bg-white dark:bg-[#202124] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4 shadow-sm">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>Dataplex Data Mesh Products &amp; `dbt` Metadata Sync (`gcloud 590.0.1`)</span>
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
              className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
            >
              {busyAction === 'CREATE_PRODUCT'
                ? 'Publishing Data Product & Syncing dbt Manifest...'
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
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-blue-500/15 text-blue-400">
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
                    className="p-1.5 rounded-md hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
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
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                0 BREAKING DOWNSTREAM CHANGES
              </span>
              {onOpenBigQuerySql && (
                <button
                  type="button"
                  onClick={() => {
                    const selectLines = schemaMappings
                      .map((m) =>
                        m.isPii
                          ? `  TO_HEX(SHA256(LOWER(TRIM(CAST(${m.sourceField} AS STRING))))) AS ${m.targetField}`
                          : `  SAFE_CAST(${m.sourceField} AS ${m.targetType}) AS ${m.targetField}`
                      )
                      .join(',\n');
                    const ddl = `-- Zero-Breakage Schema Contract View (${cleanSourceDs}.${cleanSourceTable} -> ${cleanTargetDs}.v_${cleanTargetTable}_contract)\nCREATE OR REPLACE VIEW \`${projectId}.${cleanTargetDs}.v_${cleanTargetTable}_contract\` AS\nSELECT\n${selectLines}\nFROM \`${projectId}.${cleanSourceDs}.${cleanSourceTable}\`\nWHERE ${dedupKey} IS NOT NULL\nQUALIFY ROW_NUMBER() OVER (PARTITION BY ${dedupKey} ORDER BY ${orderByCol} DESC) = 1;`;
                    onOpenBigQuerySql(ddl);
                  }}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-mono font-extrabold cursor-pointer transition-colors"
                >
                  Synthesize Contract View DDL in BigQuery Studio →
                </button>
              )}
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('CLOUD_SOC')}
                  className="px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-300 border border-red-500/30 text-[10px] font-mono font-bold cursor-pointer"
                >
                  Audit PII Columns in Cloud SOC →
                </button>
              )}
            </div>
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
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[10px]">
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
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono pt-1 border-t border-zinc-200 dark:border-zinc-800">
                      <span className="text-amber-500 font-bold">
                        {j.recommendation}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">
                          On-Demand: ${j.onDemandCostUsd}
                        </span>
                        {onOpenBigQuerySql && j.sqlPreview && (
                          <button
                            type="button"
                            onClick={() => onOpenBigQuerySql(j.sqlPreview)}
                            className="px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-300 border border-blue-500/30 font-bold cursor-pointer"
                          >
                            Optimize in BQ X-Ray →
                          </button>
                        )}
                      </div>
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                  SAVES ~$348/MO
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Replaces a $350/mo idle Cloud Composer (Airflow) cluster with a `$0.00/mo` Serverless Google Cloud Workflow DAG (first 5,000 steps/mo free).
              </p>
            </div>

            <pre className="p-3 rounded-xl bg-white dark:bg-zinc-950 text-amber-700 dark:text-amber-300 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono overflow-x-auto">
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
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
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
                      {d.id} ({d.region})
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
                    className="p-1.5 rounded-md hover:bg-red-500/15 text-zinc-400 hover:text-red-500 cursor-pointer"
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
                      className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold cursor-pointer ${
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
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold cursor-pointer ${
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
                    className="px-2.5 py-1.5 rounded-md bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer text-zinc-700 dark:text-zinc-300"
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
                    className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === 'DAK_DEPLOY'
                      ? 'Applying Bundle...'
                      : `Validate & Apply (${dakEnvName})`}
                  </button>
                </div>
              </div>

              <pre className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 text-blue-700 dark:text-blue-300 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono overflow-x-auto max-h-[360px] leading-relaxed">
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
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
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
                      className="px-2 py-1 rounded-md bg-zinc-200/70 dark:bg-zinc-800 hover:bg-blue-500/20 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer shrink-0"
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
                  className="px-3.5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'DAK_SEARCH' ? 'Searching...' : 'Search Catalog'}
                </button>
              </div>

              {dakSearchCli && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] font-mono text-blue-700 dark:text-blue-300 overflow-x-auto">
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
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyText(r.dakUri, r.entryName)}
                        className="px-2.5 py-1 rounded-md bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer shrink-0"
                      >
                        {copiedKey === r.entryName ? '✓ Copied' : 'Copy URI'}
                      </button>
                      {onOpenBigQuerySql &&
                        (String(r.system).toUpperCase().includes('BIGQUERY') ||
                          String(r.system).toUpperCase().includes('BIGLAKE')) && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenBigQuerySql(
                                `-- Dataplex Semantic Catalog Asset: ${r.displayName} (${r.dakUri})\nSELECT *\nFROM \`${projectId}.${r.displayName.includes('.') ? r.displayName : `analytics_lakehouse.${r.displayName}`}\`\nLIMIT 100;`
                              )
                            }
                            className="px-2.5 py-1 rounded-md bg-blue-500/15 hover:bg-blue-500/25 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-300 border border-blue-500/30 cursor-pointer shrink-0"
                          >
                            Query in BQ →
                          </button>
                        )}
                    </div>
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
                  className="px-3.5 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                >
                  {busyAction === 'SPARK_RCA'
                    ? 'Streaming...'
                    : 'Stream & Diagnose RCA'}
                </button>
              </div>

              {sparkRcaReport && (
                <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-amber-500/40 space-y-2.5 text-xs font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
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
                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[9px] text-zinc-500">Median Task</div>
                      <div className="text-emerald-400 font-bold">
                        {sparkRcaReport.skewMetrics.medianTaskDurationMs} ms
                      </div>
                    </div>
                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[9px] text-zinc-500">P99 Skew Task</div>
                      <div className="text-red-400 font-bold">
                        {sparkRcaReport.skewMetrics.p99TaskDurationMs} ms
                      </div>
                    </div>
                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                      <div className="text-[9px] text-zinc-500">Median Shuffle</div>
                      <div className="text-emerald-400 font-bold">
                        {sparkRcaReport.skewMetrics.medianTaskShuffleReadMb} MB
                      </div>
                    </div>
                    <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
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
                      <div key={fix} className="text-[10px] text-zinc-700 dark:text-zinc-300">
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

      {/* TAB 7: ZERO-CLUSTER SERVERLESS SPARK & BIGLAKE APACHE ICEBERG */}
      {activeSubTab === 'SERVERLESS_SPARK' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 Cols: Serverless Spark Batch Launcher & Cost Comparison */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>Zero-Cluster Dataproc Serverless Spark 3.5</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Never pay for idle master/worker VMs again. Submit PySpark/Ray directly to Serverless Batches with sub-30s startup.
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  $0.00/HR IDLE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                    Batch Job ID
                  </label>
                  <input
                    type="text"
                    value={sparkBatchId}
                    onChange={(e) => setSparkBatchId(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                    Region
                  </label>
                  <select
                    value={sparkRegion}
                    onChange={(e) => setSparkRegion(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    <option value="us-central1">us-central1 (Iowa)</option>
                    <option value="us-east1">us-east1 (S. Carolina)</option>
                    <option value="europe-west1">europe-west1 (Belgium)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                    Iceberg Warehouse Bucket
                  </label>
                  <input
                    type="text"
                    value={sparkBucket}
                    onChange={(e) => setSparkBucket(e.target.value)}
                    className="mt-1 w-full px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 font-bold">
                    Lakehouse Pattern
                  </label>
                  <select
                    value={sparkTemplate}
                    onChange={(e) => setSparkTemplate(e.target.value)}
                    className="mt-1 w-full px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    <option value="ICEBERG_MEDALLION">
                      Bronze → Silver → Gold BigLake Iceberg
                    </option>
                    <option value="RAY_DISTRIBUTED_EMBED">
                      Distributed Ray Embeddings → BigQuery Vector
                    </option>
                    <option value="SPANNER_TO_ICEBERG">
                      Spanner Graph Export → Iceberg Parquet
                    </option>
                  </select>
                </div>
              </div>

              {/* Cost Comparison Card */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="text-[10px] font-mono text-red-500 font-bold uppercase">
                    24/7 Dataproc VM Cluster
                  </div>
                  <div className="text-base font-extrabold font-mono text-red-500 mt-0.5">
                    ~$418.00 / mo
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    1 Master + 2 Workers burning 24/7 even when 92% idle
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                    Dataproc Serverless Batch
                  </div>
                  <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ~$4.80 / mo
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">
                    15-min daily batch · $0.00/hr when job finishes (-98%)
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={busyAction === 'SUBMIT_SPARK'}
                onClick={handleSubmitServerlessSpark}
                className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                <span>
                  {busyAction === 'SUBMIT_SPARK'
                    ? 'Submitting Serverless Spark 3.5 Batch...'
                    : 'Submit Live Serverless Spark Iceberg Batch ($0 Idle)'}
                </span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('ICEBERG_50_MATRIX')}
                  className="px-2.5 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  50 Iceberg Playbooks →
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onOpenBigLakeStudio
                      ? onOpenBigLakeStudio('COMPACTION_DOCTOR')
                      : onNavigateTab?.('BIGLAKE_STUDIO', 'COMPACTION_DOCTOR')
                  }
                  className="px-2.5 py-1.5 rounded-md bg-blue-500/10 hover:bg-blue-500/20 text-[10px] font-mono font-bold text-blue-600 dark:text-blue-300 border border-blue-500/30 cursor-pointer"
                >
                  BigLake Z-Order Compaction →
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab?.('WAVE10_FRONTIER')}
                  className="px-2.5 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 cursor-pointer"
                >
                  Spanner Graph Export →
                </button>
              </div>
            </div>

            {/* Active Serverless Spark Batches */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-sm">
              <div className="text-xs font-extrabold font-mono uppercase text-zinc-600 dark:text-zinc-300">
                Serverless Spark Batches ({sparkBatches.length})
              </div>
              {sparkBatches.length === 0 ? (
                <div className="text-xs text-zinc-500 font-mono py-3 text-center">
                  No Serverless Spark batches submitted yet. Click above to submit or preview the PySpark + Iceberg blueprint.
                </div>
              ) : (
                <div className="space-y-2">
                  {sparkBatches.map((b, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-blue-600 dark:text-blue-400">
                          {b.name?.split('/').pop() || b.batchId || 'spark-batch'}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Runtime {b.runtimeVersion || '2.2 (Spark 3.5 + Iceberg)'} · {b.state || 'SUCCEEDED'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        $0.00 Idle
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right 7 Cols: PySpark + BigLake Iceberg Code & CLI */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-extrabold font-mono text-blue-400 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-zinc-400" />
                  <span>
                    PySpark 3.5 + BigLake Apache Iceberg Medallion Script ({sparkBatchId}.py)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(sparkArtifacts.pysparkCode, 'PYSPARK_CODE')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                >
                  {copiedKey === 'PYSPARK_CODE' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'PYSPARK_CODE' ? 'Copied' : 'Copy PySpark'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800/90 text-[11px] font-mono text-blue-700 dark:text-blue-300 overflow-x-auto leading-relaxed max-h-80">
                {sparkArtifacts.pysparkCode}
              </pre>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-zinc-400">
                    Reproducible `gcloud dataproc batches submit pyspark` Command:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onRunInShell && (
                      <button
                        type="button"
                        onClick={() => onRunInShell(sparkArtifacts.cliCmd)}
                        className="px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                      >
                        Run in Cloud Shell
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyText(sparkArtifacts.cliCmd, 'SPARK_CLI')}
                      className="px-2.5 py-1 rounded-md text-[10px] font-mono bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    >
                      {copiedKey === 'SPARK_CLI' ? 'Copied' : 'Copy CLI'}
                    </button>
                  </div>
                </div>
                <pre className="p-2.5 rounded-xl bg-zinc-100 dark:bg-black/70 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto">
                  {sparkArtifacts.cliCmd}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-STUDIO 9: 100% GOOGLE CLOUD NATIVE LAKEHOUSE WORKSPACE          */}
      {/* (BigFrames + BigQuery AI.FORECAST/AI.GENERATE_TABLE + DLT-Killer    */}
      {/*  Dataform Assertions + Zero-Infra BQML / Vertex AI Model Registry)  */}
      {/* =================================================================== */}
      {activeSubTab === 'GCP_LAKEHOUSE_WORKSPACE' && (
        <div className="space-y-4">
          {/* Executive Architecture Banner */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-mono font-extrabold uppercase tracking-wider">
                  100% Native Google Cloud Lakehouse Workspace
                </span>
                <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-[10px] font-mono font-bold">
                  BigFrames (`bigframes.pandas`) · BigQuery `AI.FORECAST` (TimesFM) &amp; `AI.GENERATE_TABLE` (Gemini 2.5 Flash) · Dataform SQLX Assertions · Vertex AI Model Registry
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onOpenBigLakeStudio
                    ? onOpenBigLakeStudio('DATABRICKS_UNITY_BRIDGE')
                    : onNavigateTab?.('BIGLAKE_STUDIO', 'DATABRICKS_UNITY_BRIDGE')
                }
                className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-blue-500/50 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-semibold cursor-pointer"
              >
                Need Cross-Cloud Federation? Open Unity &amp; Glue Bridge →
              </button>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <strong>Why build a Lakehouse with 100% Native Google Cloud tech instead of third-party platforms?</strong>{' '}
              Instead of paying a second license tax (`DBUs`) and managing warm VM clusters, Google Cloud gives you a{' '}
              <strong>Zero-Ops, Serverless Multi-Engine Lakehouse</strong> where{' '}
              <strong>BigQuery SQL</strong>, <strong>BigFrames (`bigframes.pandas`)</strong>,{' '}
              <strong>Dataproc Serverless Spark 2.2</strong>, <strong>Dataform Declarative Quality Assertions</strong>, and{' '}
              <strong>Vertex AI Foundation Models (`TimesFM` + `Gemini 2.5 Flash`)</strong> operate directly over the same{' '}
              <strong>BigLake Managed Apache Iceberg</strong> tables on Cloud Storage (`gs://{sparkBucket}`) with zero data movement.
            </p>

            {/* 4-Pillar Side-by-Side Architecture Mapping Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
              {[
                {
                  code: 'P01',
                  legacy: 'Databricks Notebooks & Koalas / Pandas-on-Spark',
                  gcpNative: 'BigFrames (`bigframes.pandas`)',
                  advantage:
                    'Partial ordering mode (`ordering_mode = "partial"`), `.peek(n)` instant sampling, zero client OOMs, and native `.str` / `.dt` pushdown to BigQuery.',
                },
                {
                  code: 'P02',
                  legacy: 'Delta Live Tables (`@dlt.table` / `@dlt.expect`)',
                  gcpNative: 'Dataform SQLX Assertions + BigLake Iceberg',
                  advantage:
                    '100% Free ($0.00 DBU markup) declarative `nonNull`, `uniqueKey`, and `rowConditions` assertions with incremental `QUALIFY ROW_NUMBER() = 1` merges.',
                },
                {
                  code: 'P03',
                  legacy: 'Mosaic AI / Custom Batch LLM Inference',
                  gcpNative: 'BigQuery `AI.FORECAST` & `AI.GENERATE_TABLE`',
                  advantage:
                    'Zero-infra SQL TVFs powered by Google `TimesFM` (forecasting) and `gemini-2.5-flash` (structured table generation) using `CONNECTION "DEFAULT"`.',
                },
                {
                  code: 'P04',
                  legacy: 'Self-Hosted MLflow Tracking Server',
                  gcpNative: 'BigQuery ML + Vertex AI Model Registry',
                  advantage:
                    'Train in-place with `CREATE OR REPLACE MODEL ... OPTIONS(model_registry="VERTEX_AI")`, inspect via `ML.DESCRIBE_DATA` & `ML.EVALUATE`.',
                },
              ].map((pillar) => (
                <div
                  key={pillar.code}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-500 truncate">
                      Replaces: {pillar.legacy}
                    </span>
                  </div>
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs">
                    {pillar.gcpNative}
                  </div>
                  <p className="text-[10.5px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    {pillar.advantage}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MODULE 1: MULTI-ENGINE SERVERLESS LAKEHOUSE NOTEBOOK WORKBENCH */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  Multi-Engine Interactive Lakehouse Notebook (`%%bqsql` + `bigframes.pandas` + `AI.FORECAST` + `AI.GENERATE_TABLE`)
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Select any cell in the Lakehouse workflow below to inspect, copy, or execute live against project <code className="font-mono font-bold">{projectId}</code>.
                </p>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                Target Dataset: <strong className="text-zinc-800 dark:text-zinc-200">{projectId}.{cleanTargetDs}</strong> · Bucket: <strong className="text-zinc-800 dark:text-zinc-200">gs://{sparkBucket}</strong>
              </div>
            </div>

            {/* Equal-Width 4-Column Cell Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                {
                  id: 'CELL_1_EXPLORE',
                  code: 'C01',
                  engine: '%%bqsql (Explore)',
                  title: 'ML.DESCRIBE_DATA & Sample',
                },
                {
                  id: 'CELL_2_BIGFRAMES',
                  code: 'C02',
                  engine: 'bigframes.pandas',
                  title: 'Distributed Cloud DataFrame',
                },
                {
                  id: 'CELL_3_BQ_AI_ML',
                  code: 'C03',
                  engine: '%%bqsql (GenAI & TimesFM)',
                  title: 'AI.FORECAST & AI.GENERATE_TABLE',
                },
                {
                  id: 'CELL_4_VERTEX_MODEL',
                  code: 'C04',
                  engine: '%%bqsql (Vertex Registry)',
                  title: 'BQML + Vertex Model Registry',
                },
              ].map((cell) => {
                const isSelected = lakehouseActiveCell === cell.id;
                return (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => setLakehouseActiveCell(cell.id)}
                    className={`w-full h-11 px-3 rounded-md border text-left font-mono transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:border-blue-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold truncate">{cell.title}</span>
                    </div>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {cell.engine}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Cell Code & Execution Controls */}
            {(() => {
              const targetFqTable = `${projectId}.${cleanTargetDs}.${cleanTargetTable}`;
              const cellsMap = {
                CELL_1_EXPLORE: {
                  badge: 'Mandatory Data Exploration (`ML.DESCRIBE_DATA` + Sample Preview)',
                  why: 'Following Google Cloud BigQuery AI/ML best practices, always profile distribution statistics (`ML.DESCRIBE_DATA`) and sample rows (`LIMIT 10`) before training models or invoking foundation TVFs.',
                  isSql: true,
                  code: `%%bqsql
-- Step 1: Ensure target Lakehouse schema exists
CREATE SCHEMA IF NOT EXISTS \`${projectId}.${cleanTargetDs}\`;

-- Step 2: Mandatory statistical profiling via ML.DESCRIBE_DATA
SELECT *
FROM ML.DESCRIBE_DATA(
  TABLE \`${targetFqTable}\`,
  STRUCT(5 AS top_k, 4 AS num_quantiles)
);

-- Step 3: Fast preview sample (LIMIT 10)
SELECT
  ${dedupKey},
  event_type,
  revenue_usd,
  ${orderByCol}
FROM \`${targetFqTable}\`
LIMIT 10;`,
                },
                CELL_2_BIGFRAMES: {
                  badge: 'BigQuery DataFrames (`bigframes.pandas`) — Zero Client OOMs',
                  why: 'Replaces Databricks Koalas / PySpark DataFrames with 100% serverless pushdown to BigQuery. Uses partial ordering mode (`ordering_mode = "partial"`), `.peek(5)` random sampling instead of `.head()`, and native `.str` accessors instead of slow Python UDFs.',
                  isSql: false,
                  code: `import bigframes.pandas as bpd
import bigframes.bigquery.ml as bqml

# 1. Enable partial ordering mode right after import for maximum BigQuery pushdown speed
bpd.options.bigquery.project = "${projectId}"
bpd.options.bigquery.ordering_mode = "partial"

# 2. Reference the BigLake Iceberg / BigQuery table without downloading data to client RAM
df = bpd.read_gbq("${targetFqTable}")

# 3. Use built-in vectorized .str accessors (never Python lambda UDFs!)
df["event_type_clean"] = df["event_type"].str.strip().str.upper()
df["revenue_usd_filled"] = df["revenue_usd"].fillna(0.0)

# 4. Verify schema (.dtypes) and preview with .peek(5) instead of .head() or .to_pandas()
print(df.dtypes)
display(df.peek(5))`,
                },
                CELL_3_BQ_AI_ML: {
                  badge: 'Zero-Infra Foundation Models (`AI.FORECAST` TimesFM + `AI.GENERATE_TABLE` Gemini 2.5 Flash)',
                  why: 'Runs Google Research TimesFM time-series forecasting and Gemini 2.5 Flash structured table generation directly inside BigQuery SQL using Table-Valued Functions (TVFs) in the FROM clause and named `=>` arguments.',
                  isSql: true,
                  code: `%%bqsql
-- 1. Zero-Shot Time-Series Revenue Forecasting powered by Google TimesFM (AI.FORECAST TVF in FROM clause)
SELECT
  forecast_timestamp,
  forecast_value AS predicted_daily_revenue_usd,
  prediction_interval_lower_bound,
  prediction_interval_upper_bound
FROM AI.FORECAST(
  TABLE \`${targetFqTable}\`,
  data_col => 'revenue_usd',
  timestamp_col => '${orderByCol}',
  horizon => 30,
  confidence_level => 0.95
);

-- 2. Structured Generative AI Table Enrichment with Gemini 2.5 Flash (AI.GENERATE_TABLE TVF in FROM clause)
CREATE OR REPLACE MODEL \`${projectId}.${cleanTargetDs}.gemini_flash_lakehouse\`
REMOTE WITH CONNECTION \`DEFAULT\`
OPTIONS (endpoint = 'gemini-2.5-flash');

SELECT
  ${dedupKey},
  event_type,
  revenue_usd,
  executive_summary,
  churn_risk_tier,
  recommended_next_action
FROM AI.GENERATE_TABLE(
  MODEL \`${projectId}.${cleanTargetDs}.gemini_flash_lakehouse\`,
  (
    SELECT
      ${dedupKey},
      event_type,
      revenue_usd,
      CONCAT(
        'Analyze lakehouse event ', CAST(event_type AS STRING),
        ' with revenue $', CAST(revenue_usd AS STRING),
        ' and classify churn risk tier and next best action.'
      ) AS prompt
    FROM \`${targetFqTable}\`
    LIMIT 25
  ),
  STRUCT(
    'executive_summary STRING, churn_risk_tier STRING, recommended_next_action STRING' AS output_schema
  )
);`,
                },
                CELL_4_VERTEX_MODEL: {
                  badge: 'Zero-Infra MLflow Replacement (`BigQuery ML` + `Vertex AI Model Registry`)',
                  why: 'Eliminates hosting a separate Databricks MLflow tracking server. Trains directly on your BigLake/BigQuery table with automatic splitting (`AUTO_SPLIT`) and registers the model natively in Vertex AI Model Registry in a single SQL statement.',
                  isSql: true,
                  code: `%%bqsql
-- 1. Train & automatically register in Vertex AI Model Registry (zero MLflow infra, default AUTO_SPLIT)
CREATE OR REPLACE MODEL \`${projectId}.${cleanTargetDs}.customer_ltv_boosted_tree\`
OPTIONS (
  model_type = 'BOOSTED_TREE_REGRESSOR',
  input_label_cols = ['revenue_usd'],
  model_registry = 'VERTEX_AI',
  vertex_ai_model_id = 'cloudpulse_${cleanTargetTable}_ltv'
) AS
SELECT
  event_type,
  EXTRACT(DAYOFWEEK FROM ${orderByCol}) AS event_day_of_week,
  EXTRACT(HOUR FROM ${orderByCol}) AS event_hour_utc,
  revenue_usd
FROM \`${targetFqTable}\`
WHERE revenue_usd IS NOT NULL;

-- 2. Evaluate registered model metrics natively via ML.EVALUATE
SELECT *
FROM ML.EVALUATE(MODEL \`${projectId}.${cleanTargetDs}.customer_ltv_boosted_tree\`);`,
                },
              };

              const activeCellObj = cellsMap[lakehouseActiveCell] || cellsMap.CELL_1_EXPLORE;
              const runnableSql = activeCellObj.code.replace(/^%%bqsql\s*\n/, '');

              return (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                        {activeCellObj.badge}
                      </div>
                      <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {activeCellObj.why}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeCellObj.isSql && onOpenBigQuerySql && (
                        <button
                          type="button"
                          onClick={() => onOpenBigQuerySql(runnableSql)}
                          className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-mono font-bold cursor-pointer"
                        >
                          Run Cell Live in BigQuery Studio →
                        </button>
                      )}
                      {onRunInShell && (
                        <button
                          type="button"
                          onClick={() =>
                            onRunInShell(
                              activeCellObj.isSql
                                ? `bq query --project_id=${projectId} --use_legacy_sql=false ${JSON.stringify(
                                    runnableSql.split(';')[0] + ';'
                                  )}`
                                : `python3 -c ${JSON.stringify(activeCellObj.code)}`
                            )
                          }
                          className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-[11px] font-mono font-bold cursor-pointer"
                        >
                          Execute in Cloud Shell
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => copyText(activeCellObj.code, 'LAKEHOUSE_CELL')}
                        className="px-2.5 py-1.5 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-[11px] font-mono font-semibold cursor-pointer"
                      >
                        {copiedKey === 'LAKEHOUSE_CELL' ? 'Copied!' : 'Copy Cell'}
                      </button>
                    </div>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto leading-relaxed max-h-96">
                    {activeCellObj.code}
                  </pre>
                </div>
              );
            })()}
          </div>

          {/* MODULE 2: DELTA LIVE TABLES (@dlt.expect) -> NATIVE DATAFORM SQLX + BIGLAKE ICEBERG CONVERTER */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  Module 2 · Declarative Pipeline Engine — Replace `@dlt.expect` with $0.00 Google Cloud Dataform SQLX + BigLake Iceberg
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Toggle declarative data quality expectations below to synthesize both the legacy `@dlt.table` specification and its 100% free Google Cloud Dataform SQLX + BigQuery live assertion verification query.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-extrabold">
                Dataform Orchestration Fee: $0.00/mo
              </span>
            </div>

            {/* 4 Equal-Width Expectation Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono text-xs">
              {[
                {
                  id: 'NON_NULL',
                  label: `nonNull: ["${dedupKey}", "${orderByCol}"]`,
                  checked: dltExpectNonNull,
                  onChange: () => setDltExpectNonNull((v) => !v),
                },
                {
                  id: 'UNIQUE_KEY',
                  label: `uniqueKey: ["${dedupKey}"] (QUALIFY Dedup)`,
                  checked: dltExpectUnique,
                  onChange: () => setDltExpectUnique((v) => !v),
                },
                {
                  id: 'POSITIVE_REV',
                  label: 'rowConditions: ["revenue_usd >= 0"]',
                  checked: dltExpectPositiveRev,
                  onChange: () => setDltExpectPositiveRev((v) => !v),
                },
                {
                  id: 'QUARANTINE_DLQ',
                  label: 'Auto-Route Failing Rows to Quarantine Table',
                  checked: dltQuarantineDlq,
                  onChange: () => setDltQuarantineDlq((v) => !v),
                },
              ].map((exp) => (
                <label
                  key={exp.id}
                  className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={exp.checked}
                    onChange={exp.onChange}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {exp.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Legacy DLT Code */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-zinc-500">
                    Legacy Proprietary `@dlt.table` (Requires Paid DLT Compute DBUs)
                  </span>
                </div>
                <pre className="p-3 rounded-lg bg-zinc-100 dark:bg-black/70 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-zinc-600 dark:text-zinc-400 overflow-x-auto leading-relaxed">
{`import dlt
from pyspark.sql.functions import col, row_number
from pyspark.sql.window import Window

@dlt.table(name="${cleanTargetTable}", table_properties={"quality": "silver"})
${dltExpectNonNull ? `@dlt.expect_or_drop("valid_${dedupKey}", "${dedupKey} IS NOT NULL AND ${orderByCol} IS NOT NULL")\n` : ''}${dltExpectPositiveRev ? `@dlt.expect_or_drop("non_negative_revenue", "revenue_usd >= 0")\n` : ''}def build_${cleanTargetTable}():
    df = dlt.read_stream("bronze_events")
    ${
      dltExpectUnique
        ? `w = Window.partitionBy("${dedupKey}").orderBy(col("${orderByCol}").desc())
    return df.withColumn("rn", row_number().over(w)).filter(col("rn") == 1).drop("rn")`
        : `return df`
    }`}
                </pre>
              </div>

              {/* Right: 100% Native Google Cloud Dataform SQLX + BigLake Iceberg */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-extrabold text-emerald-700 dark:text-emerald-400">
                    100% Native GCP Dataform SQLX + BigLake Iceberg ($0.00 Orchestration)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onOpenBigQuerySql && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenBigQuerySql(
                            `-- Live BigQuery Data Quality Assertion Verification for ${projectId}.${cleanTargetDs}.${cleanTargetTable}\nSELECT\n  COUNT(*) AS total_rows,\n  COUNTIF(${dedupKey} IS NULL OR ${orderByCol} IS NULL) AS null_key_violations,\n  COUNT(*) - COUNT(DISTINCT ${dedupKey}) AS duplicate_key_violations,\n  COUNTIF(revenue_usd < 0) AS negative_revenue_violations\nFROM \`${projectId}.${cleanTargetDs}.${cleanTargetTable}\`;`
                          )
                        }
                        className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Verify Assertions in BigQuery →
                      </button>
                    )}
                  </div>
                </div>
                <pre className="p-3 rounded-lg bg-zinc-100 dark:bg-black/80 border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-mono text-emerald-700 dark:text-emerald-300 overflow-x-auto leading-relaxed">
{`-- definitions/silver/${cleanTargetTable}.sqlx
config {
  type: "incremental",
  schema: "${cleanTargetDs}",
  name: "${cleanTargetTable}",
  uniqueKey: ["${dedupKey}"],
  bigquery: {
    partitionBy: "DATE(${orderByCol})",
    clusterBy: ["event_type"]
  },
  assertions: {${dltExpectNonNull ? `\n    nonNull: ["${dedupKey}", "${orderByCol}"],` : ''}${dltExpectUnique ? `\n    uniqueKey: ["${dedupKey}"],` : ''}${dltExpectPositiveRev ? `\n    rowConditions: ["revenue_usd >= 0"]` : ''}
  }
}

SELECT
  TRIM(CAST(${dedupKey} AS STRING)) AS ${dedupKey},
  UPPER(TRIM(CAST(event_type AS STRING))) AS event_type,
  COALESCE(SAFE_CAST(revenue_usd AS FLOAT64), 0.0) AS revenue_usd,
  ${orderByCol}
FROM \${ref("bronze_events")}
WHERE 1=1${dltExpectNonNull ? `\n  AND ${dedupKey} IS NOT NULL AND ${orderByCol} IS NOT NULL` : ''}${dltExpectPositiveRev ? `\n  AND COALESCE(SAFE_CAST(revenue_usd AS FLOAT64), 0.0) >= 0` : ''}${
  dltExpectUnique
    ? `\nQUALIFY ROW_NUMBER() OVER (PARTITION BY ${dedupKey} ORDER BY ${orderByCol} DESC) = 1`
    : ''
}${
  dltQuarantineDlq
    ? `\n\n-- Companion Quarantine View: definitions/quarantine/${cleanTargetTable}_dlq.sqlx\n-- Captures rows failing expectations for zero-loss replay`
    : ''
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
