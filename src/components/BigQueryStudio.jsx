import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Database,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Trash2,
  Clock,
  DollarSign,
  Play,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Layers,
  Lock,
  Globe,
  History,
  FileCode2,
  Sliders,
  ArrowRight,
  Cpu,
} from 'lucide-react';

const STUDIO_TABS = [
  {
    id: 'DATASETS',
    label: '1. Dataset Fleet & Compliance Hardener',
    shortLabel: 'Datasets & Compliance',
    icon: ShieldCheck,
    tip: 'Inspect live BigQuery datasets, Zero-Trust & FinOps Posture Scores (0-100), and apply 1-Tap Physical Billing, Time-Travel, Partition TTL, Banker Rounding, or CMEK hardening',
  },
  {
    id: 'TABLES_SQL',
    label: '2. SQL Pre-Crime X-Ray & Auto-Optimizer',
    shortLabel: 'SQL Optimizer & Tables',
    icon: Sparkles,
    tip: 'Browse or create Partitioned + Clustered tables, run live Dry-Run Byte X-Ray ($6.25/TB), and auto-rewrite SQL using Column Pruning, Predicate Pushdown & WHERE EXISTS semi-joins',
  },
  {
    id: 'FINOPS_CRYSTAL',
    label: '3. Logical vs Physical & Slot FinOps Crystal',
    shortLabel: 'Storage & Slot FinOps',
    icon: DollarSign,
    tip: 'Interactive Capacitor Compression & Slot Edition Simulator: Compare Logical ($0.02/GB) vs Physical Compressed ($0.04/GB at 5:1 ratio) and On-Demand ($6.25/TB) vs Enterprise Autoscaling Slots',
  },
  {
    id: 'TIME_MACHINE',
    label: '4. FOR SYSTEM_TIME AS OF Time-Machine',
    shortLabel: '7-Day Time-Machine',
    icon: History,
    tip: 'Rewind any BigQuery table up to 168 hours (7 days) to recover accidentally deleted/corrupted rows via Zero-Copy Clone or FOR SYSTEM_TIME AS OF snapshot SQL',
  },
  {
    id: 'BIGLAKE_ICEBERG',
    label: '🌊 5. BigLake vs. BigQuery Open Lakehouse & Iceberg Studio',
    shortLabel: '🌊 BigLake & Iceberg',
    icon: Layers,
    tip: 'Demystify BigLake vs. BigQuery: Build open Apache Iceberg & Parquet tables in your own gs:// buckets with delegated Zero-Trust Connections, row/column security, and Spark + Vertex AI + BigQuery zero-copy sharing',
  },
];

const SAMPLE_UNOPTIMIZED_QUERIES = [
  {
    id: 'unpruned_select_star',
    label: '🚨 Anti-Pattern 1: SELECT * + WHERE IN Subquery + No Partition Filter',
    sql: `SELECT *
FROM \`analytics_lakehouse.telemetry_events_2026\`
WHERE user_id IN (
  SELECT user_id
  FROM \`analytics_lakehouse.vip_accounts\`
  WHERE tier = 'ENTERPRISE'
)
ORDER BY revenue_usd DESC
LIMIT 100;`,
  },
  {
    id: 'exact_distinct_union',
    label: '🚨 Anti-Pattern 2: Exact COUNT(DISTINCT) + UNION DISTINCT Shuffle',
    sql: `SELECT
  region,
  COUNT(DISTINCT user_id) AS unique_users,
  SUM(revenue_usd) AS gross_revenue
FROM \`analytics_lakehouse.telemetry_events_2026\`
GROUP BY region
UNION DISTINCT
SELECT
  region,
  COUNT(DISTINCT user_id) AS unique_users,
  SUM(revenue_usd) AS gross_revenue
FROM \`analytics_lakehouse.telemetry_archive_2025\`
GROUP BY region;`,
  },
  {
    id: 'public_wiki_benchmark',
    label: '⚡ Live Public Dataset Benchmark (bigquery-public-data)',
    sql: `SELECT
  title,
  SUM(views) AS total_views
FROM \`bigquery-public-data.wikipedia.pageviews_2023\`
WHERE datehour >= '2023-12-01'
  AND wiki = 'en'
GROUP BY title
ORDER BY total_views DESC
LIMIT 15;`,
  },
];

function formatBytes(bytes) {
  const b = Number(bytes || 0);
  if (b <= 0) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(2)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  if (b < 1024 * 1024 * 1024 * 1024)
    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  return `${(b / (1024 * 1024 * 1024 * 1024)).toFixed(3)} TB`;
}

export default function BigQueryStudio({
  projectId,
  onOpenProvision,
  onRunInShell,
  onRefreshGlobal,
  onShowToast,
  onShowError,
}) {
  const [activeSubTab, setActiveSubTab] = useState('DATASETS');
  const [datasets, setDatasets] = useState([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [tables, setTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [hardeningId, setHardeningId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Create Partitioned + Clustered Table Modal/Inline state
  const [newTableName, setNewTableName] = useState('telemetry_events_2026');
  const [newTablePartitionType, setNewTablePartitionType] = useState('DAY');
  const [newTablePartitionField, setNewTablePartitionField] =
    useState('event_timestamp');
  const [newTableRequireFilter, setNewTableRequireFilter] = useState(true);
  const [newTableClusterCols, setNewTableClusterCols] =
    useState('region,user_id');
  const [creatingTable, setCreatingTable] = useState(false);

  // SQL Pre-Crime Dry-Run & Auto-Optimizer state
  const [sqlInput, setSqlInput] = useState(SAMPLE_UNOPTIMIZED_QUERIES[0].sql);
  const [maxBytesGuardGb, setMaxBytesGuardGb] = useState(1); // 1 GB safety guard
  const [runningQuery, setRunningQuery] = useState(false);
  const [queryResult, setQueryResult] = useState(null);

  // FinOps Storage & Slot Crystal Simulator state
  const [simLogicalTb, setSimLogicalTb] = useState(25); // 25 TB logical
  const [simCompressionRatio, setSimCompressionRatio] = useState(5.2); // 5.2x Capacitor compression
  const [simLongTermPct, setSimLongTermPct] = useState(60); // 60% untouched >90 days
  const [simDailyChurnPct, setSimDailyChurnPct] = useState(3); // 3% daily UPDATE/DELETE churn
  const [simTimeTravelHours, setSimTimeTravelHours] = useState(72); // 48..168
  const [simDailyScannedTb, setSimDailyScannedTb] = useState(18); // 18 TB/day scanned

  // Time-Machine Rewind state
  const [rewindHoursAgo, setRewindHoursAgo] = useState(6);
  const [rewindTableTarget, setRewindTableTarget] = useState(
    'telemetry_events_2026'
  );
  const [rewindCloneName, setRewindCloneName] = useState(
    'telemetry_events_2026_restored'
  );

  // BigLake vs. BigQuery Open Lakehouse & Apache Iceberg Studio state
  const [gcsBuckets, setGcsBuckets] = useState([]);
  const [bigLakeUseCase, setBigLakeUseCase] = useState('ICEBERG_MANAGED'); // 'ICEBERG_MANAGED' | 'BIGLAKE_EXTERNAL' | 'NATIVE_BQ'
  const [bigLakeBucket, setBigLakeBucket] = useState('');
  const [bigLakeFolder, setBigLakeFolder] = useState('iceberg-lakehouse/events_2026');
  const [bigLakeConnectionId, setBigLakeConnectionId] = useState('biglake-lakehouse-conn');
  const [bigLakeLocation, setBigLakeLocation] = useState('US');
  const [bigLakeTableName, setBigLakeTableName] = useState('open_iceberg_events');
  const [bigLakeFormat, setBigLakeFormat] = useState('PARQUET');
  const [bigLakeStalenessMins, setBigLakeStalenessMins] = useState(30);
  const [bigLakeEnableRls, setBigLakeEnableRls] = useState(true);
  const [bigLakeRlsFilter, setBigLakeRlsFilter] = useState("region = 'EU' AND SESSION_USER() LIKE '%@%'");

  const copyText = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const fetchDatasets = useCallback(async () => {
    if (!projectId) return;
    setLoadingDatasets(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/bigquery/datasets`
      );
      const list = res.data?.datasets || [];
      setDatasets(list);
      if (list.length > 0 && !selectedDatasetId) {
        setSelectedDatasetId(list[0].datasetId);
      }
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || 'Failed to load BigQuery datasets.'
      );
    } finally {
      setLoadingDatasets(false);
    }
  }, [projectId, selectedDatasetId, onShowError]);

  const fetchGcsBucketsForBigLake = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/storage/buckets`
      );
      const bList = res.data?.buckets || [];
      setGcsBuckets(bList);
      if (bList.length > 0 && !bigLakeBucket) {
        setBigLakeBucket(bList[0].name);
      } else if (!bigLakeBucket) {
        setBigLakeBucket(`${projectId}-open-lakehouse`);
      }
    } catch {
      if (!bigLakeBucket) {
        setBigLakeBucket(`${projectId}-open-lakehouse`);
      }
    }
  }, [projectId, bigLakeBucket]);

  const fetchTables = useCallback(
    async (dsId) => {
      if (!projectId || !dsId) {
        setTables([]);
        return;
      }
      setLoadingTables(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/bigquery/datasets/${encodeURIComponent(dsId)}/tables`
        );
        const tbls = res.data?.tables || [];
        setTables(tbls);
        if (tbls.length > 0 && tbls[0].tableId) {
          setRewindTableTarget(tbls[0].tableId);
          setRewindCloneName(`${tbls[0].tableId}_restored`);
        }
      } catch {
        setTables([]);
      } finally {
        setLoadingTables(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    fetchDatasets();
    fetchGcsBucketsForBigLake();
  }, [fetchDatasets, fetchGcsBucketsForBigLake]);

  useEffect(() => {
    if (selectedDatasetId) {
      fetchTables(selectedDatasetId);
    }
  }, [selectedDatasetId, fetchTables]);

  // 1-Tap Live Compliance & FinOps Dataset Patch
  const handlePatchDataset = async (datasetId, patchPayload, labelDesc) => {
    setHardeningId(`${datasetId}:${labelDesc}`);
    try {
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/bigquery/datasets/${encodeURIComponent(datasetId)}`,
        patchPayload
      );
      onShowToast?.(
        res.data?.message ||
          `Applied ${labelDesc} to BigQuery dataset ${projectId}.${datasetId}!`
      );
      await fetchDatasets();
      onRefreshGlobal?.();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          `Failed to apply ${labelDesc} on ${datasetId}`
      );
    } finally {
      setHardeningId(null);
    }
  };

  // Delete Dataset with contents
  const handleDeleteDataset = async (datasetId, location) => {
    setHardeningId(`${datasetId}:DELETE`);
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(projectId)}/resource`,
        {
          data: {
            resourceType: 'BigQuery Dataset',
            name: datasetId,
            region: location || 'US',
          },
        }
      );
      onShowToast?.(
        res.data?.message || `Deleted BigQuery dataset ${projectId}.${datasetId}`
      );
      if (selectedDatasetId === datasetId) {
        setSelectedDatasetId('');
      }
      await fetchDatasets();
      onRefreshGlobal?.();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || `Failed to delete dataset ${datasetId}`
      );
    } finally {
      setHardeningId(null);
    }
  };

  // Create Partitioned + Clustered Table
  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!selectedDatasetId) {
      onShowError?.(
        'Create or select a BigQuery Dataset first before creating a Partitioned Table.'
      );
      return;
    }
    setCreatingTable(true);
    try {
      const clusterArr = newTableClusterCols
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean)
        .slice(0, 4);
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/bigquery/datasets/${encodeURIComponent(selectedDatasetId)}/tables`,
        {
          tableId: newTableName,
          partitionType: newTablePartitionType,
          partitionField: newTablePartitionField,
          requirePartitionFilter: newTableRequireFilter,
          clusteringFields: clusterArr,
        }
      );
      onShowToast?.(res.data?.message || 'Created Partitioned & Clustered table!');
      await fetchTables(selectedDatasetId);
      await fetchDatasets();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || 'Failed to create BigQuery table.'
      );
    } finally {
      setCreatingTable(false);
    }
  };

  // Run SQL Dry-Run X-Ray or Live Query
  const handleExecuteQuery = async (isDryRun = true) => {
    setRunningQuery(true);
    try {
      const activeDs = datasets.find((d) => d.datasetId === selectedDatasetId);
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/bigquery/query`,
        {
          sql: sqlInput,
          datasetId: selectedDatasetId || '',
          location: activeDs?.location || 'US',
          dryRun: isDryRun,
          maximumBytesBilled: Math.round(
            Number(maxBytesGuardGb || 1) * 1073741824
          ),
        }
      );
      setQueryResult(res.data);
      if (!isDryRun) {
        onShowToast?.(
          `Executed live BigQuery SQL (${res.data?.totalRows || 0} rows returned · ${formatBytes(
            res.data?.totalBytesBilled
          )} billed)`
        );
      }
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || 'BigQuery SQL execution failed.'
      );
    } finally {
      setRunningQuery(false);
    }
  };

  // FinOps Storage & Slot Crystal Math
  const finopsComparison = useMemo(() => {
    const logicalGb = simLogicalTb * 1024;
    const activeFraction = (100 - simLongTermPct) / 100;
    const longTermFraction = simLongTermPct / 100;

    // Logical Pricing: $0.02/GB active, $0.01/GB long-term (Time-Travel is free)
    const logicalActiveCost = logicalGb * activeFraction * 0.02;
    const logicalLongTermCost = logicalGb * longTermFraction * 0.01;
    const logicalMonthlyTotal = logicalActiveCost + logicalLongTermCost;

    // Physical Pricing: $0.04/GB active compressed, $0.02/GB long-term compressed + Time-Travel + 7d Fail-Safe compressed bytes
    const compressedActiveGb = (logicalGb * activeFraction) / simCompressionRatio;
    const compressedLongTermGb =
      (logicalGb * longTermFraction) / simCompressionRatio;
    const timeTravelDays = simTimeTravelHours / 24 + 7; // Time-travel window + 7-day fail-safe
    const churnPhysicalGb =
      (logicalGb * (simDailyChurnPct / 100) * timeTravelDays) /
      simCompressionRatio;

    const physicalActiveCost =
      (compressedActiveGb + churnPhysicalGb) * 0.04;
    const physicalLongTermCost = compressedLongTermGb * 0.02;
    const physicalMonthlyTotal = physicalActiveCost + physicalLongTermCost;

    const monthlyStorageSavings = logicalMonthlyTotal - physicalMonthlyTotal;
    const savingsPct =
      logicalMonthlyTotal > 0
        ? Math.round((monthlyStorageSavings / logicalMonthlyTotal) * 100)
        : 0;

    // Compute Pricing: On-Demand ($6.25/TB) vs BigQuery Enterprise Edition Autoscaling Slots ($0.04/slot-hour baseline with 1yr commit or $0.06/slot-hr pay-as-you-go)
    const monthlyScannedTb = simDailyScannedTb * 30;
    const onDemandComputeMonthly = monthlyScannedTb * 6.25;
    // Assume 100 autoscaling slots averaging 38% utilization
    const estAutoscalingSlotsMonthly = 100 * 730 * 0.38 * 0.048;

    return {
      logicalGb: Math.round(logicalGb),
      compressedTotalGb: Math.round(
        compressedActiveGb + compressedLongTermGb + churnPhysicalGb
      ),
      churnPhysicalGb: Math.round(churnPhysicalGb),
      logicalMonthlyTotal,
      physicalMonthlyTotal,
      monthlyStorageSavings,
      savingsPct,
      onDemandComputeMonthly,
      estAutoscalingSlotsMonthly,
      computeSavingsMonthly: Math.max(
        0,
        onDemandComputeMonthly - estAutoscalingSlotsMonthly
      ),
    };
  }, [
    simLogicalTb,
    simCompressionRatio,
    simLongTermPct,
    simDailyChurnPct,
    simTimeTravelHours,
    simDailyScannedTb,
  ]);

  // Fleet KPIs
  const fleetStats = useMemo(() => {
    const total = datasets.length;
    const physicalCount = datasets.filter(
      (d) => d.storageBillingModel === 'PHYSICAL'
    ).length;
    const avgScore =
      total > 0
        ? Math.round(
            datasets.reduce((acc, d) => acc + (d.postureScore || 60), 0) / total
          )
        : 100;
    const totalTables = datasets.reduce(
      (acc, d) => acc + Number(d.tableCount || 0),
      0
    );
    return { total, physicalCount, avgScore, totalTables };
  }, [datasets]);

  const timeMachineSql = useMemo(() => {
    const ds = selectedDatasetId || 'analytics_lakehouse';
    const tbl = rewindTableTarget || 'telemetry_events_2026';
    const clone = rewindCloneName || `${tbl}_restored`;
    return {
      selectAsOf: `SELECT *\nFROM \`${projectId}.${ds}.${tbl}\`\nFOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${rewindHoursAgo} HOUR)\nLIMIT 100;`,
      zeroCopyClone: `CREATE OR REPLACE TABLE \`${projectId}.${ds}.${clone}\`\nCLONE \`${projectId}.${ds}.${tbl}\`\nFOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${rewindHoursAgo} HOUR);`,
      diffDeletedRows: `SELECT old_snap.*\nFROM \`${projectId}.${ds}.${tbl}\` FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${rewindHoursAgo} HOUR) AS old_snap\nLEFT JOIN \`${projectId}.${ds}.${tbl}\` AS live_curr\n  USING (event_id)\nWHERE live_curr.event_id IS NULL;`,
    };
  }, [projectId, selectedDatasetId, rewindTableTarget, rewindCloneName, rewindHoursAgo]);

  const bigLakeArtifacts = useMemo(() => {
    const ds = selectedDatasetId || 'analytics_lakehouse';
    const bkt = (bigLakeBucket || `${projectId}-open-lakehouse`).replace(/^gs:\/\//, '');
    const cleanFolder = (bigLakeFolder || 'iceberg-lakehouse/events_2026').replace(/^\/+|\/+$/g, '');
    const connId = bigLakeConnectionId || 'biglake-lakehouse-conn';
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
  --role="${bigLakeUseCase === 'ICEBERG_MANAGED' ? 'roles/storage.objectAdmin' : 'roles/storage.objectViewer'}"`;

    const icebergManagedDdl = `-- 🧊 BigLake Managed Table for Apache Iceberg (2026 Flagship Open Lakehouse)
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

    const bigLakeExternalDdl = `-- ⚡ BigLake External Table over existing Cloud Storage files with Object Metadata Caching
-- Zero-copy SQL over gs://${bkt}/${cleanFolder}/* without granting users raw bucket IAM!
CREATE OR REPLACE EXTERNAL TABLE \`${projectId}.${ds}.${tbl}_ext\`
WITH CONNECTION \`${fullConn}\`
OPTIONS (
  format = '${bigLakeFormat}',
  uris = ['gs://${bkt}/${cleanFolder}/*.${bigLakeFormat.toLowerCase()}'],
  max_staleness = INTERVAL ${bigLakeStalenessMins} MINUTE,
  metadata_cache_mode = 'AUTOMATIC'
);`;

    const rowAccessPolicyDdl = `-- 🔐 BigLake Fine-Grained Row-Level Security (Impossible on standard GCS External Tables!)
CREATE OR REPLACE ROW ACCESS POLICY eu_sovereign_filter
ON \`${projectId}.${ds}.${tbl}\`
GRANT TO ('domain:example.com', 'user:analyst@${projectId}.iam.gserviceaccount.com')
FILTER USING (${bigLakeRlsFilter});`;

    const sparkReadSnippet = `# PySpark / Dataproc / Vertex AI Zero-Copy Read of the EXACT same BigLake Iceberg files in gs://${bkt}/${cleanFolder}
df = spark.read.format("iceberg") \\
  .load("gs://${bkt}/${cleanFolder}")
df.filter("region = 'EU'").groupBy("user_id").sum("revenue_usd").show()`;

    return {
      ds,
      bkt,
      cleanFolder,
      fullConn,
      step1ConnectionCli,
      step2BucketIamCli,
      icebergManagedDdl,
      bigLakeExternalDdl,
      rowAccessPolicyDdl,
      sparkReadSnippet,
      primaryDdl:
        bigLakeUseCase === 'ICEBERG_MANAGED'
          ? icebergManagedDdl
          : bigLakeExternalDdl,
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
    bigLakeRlsFilter,
  ]);

  return (
    <div className="space-y-5">
      {/* Top Studio Hero Banner */}
      <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-emerald-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-zinc-950 dark:text-zinc-50">
                  BigQuery &amp; BigLake 2026 Enterprise Lakehouse Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
                  CAPACITOR · BIGLAKE APACHE ICEBERG · SQL PRE-CRIME X-RAY
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Live BigQuery &amp; BigLake Control Plane for <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-200">{projectId}</span> — Unify native BigQuery Capacitor tables with open **BigLake Apache Iceberg** tables in `gs://`, Physical Compressed Billing (-54% cost), and 168h Time-Machine recovery.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('BIGLAKE_ICEBERG')}
              title="Understand BigLake vs. BigQuery and build Apache Iceberg / Parquet Lakehouse tables over gs:// buckets"
              className="inline-flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🌊 BigLake vs. BigQuery Studio</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenProvision?.('BIGQUERY_DATASET')}
              title="Open the 5-Step BigQuery Enterprise Compliance & Lakehouse Dataset Provisioning Modal"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-3.5 py-2 text-xs font-bold transition-colors shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Create Compliant Dataset</span>
            </button>

            <button
              type="button"
              onClick={fetchDatasets}
              disabled={loadingDatasets}
              title="Sync live BigQuery datasets, storage billing models, time-travel windows & table counts from Google Cloud"
              className="inline-flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono font-semibold transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingDatasets ? 'animate-spin text-blue-500' : ''
                }`}
              />
              <span>Sync BigQuery</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Live Datasets ({projectId})
            </div>
            <div className="text-lg font-black font-mono text-zinc-950 dark:text-white mt-0.5">
              {fleetStats.total}{' '}
              <span className="text-xs font-normal text-zinc-500">
                ({fleetStats.totalTables} tables)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Physical Compressed Billing
            </div>
            <div className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {fleetStats.physicalCount}/{fleetStats.total || 0}{' '}
              <span className="text-xs font-normal text-zinc-500">
                datasets (-54% storage)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Zero-Trust & FinOps Posture
            </div>
            <div className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
              {fleetStats.avgScore}/100{' '}
              <span className="text-xs font-normal text-zinc-500">
                compliance score
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Point-in-Time Recovery
            </div>
            <div className="text-lg font-black font-mono text-violet-600 dark:text-violet-400 mt-0.5">
              48h–168h{' '}
              <span className="text-xs font-normal text-zinc-500">
                + 7d Fail-Safe Air-Gap
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {STUDIO_TABS.map((t) => {
            const Icon = t.icon;
            const active = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveSubTab(t.id)}
                title={t.tip}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  active
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-zinc-50 dark:bg-[#09090b] text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: DATASET FLEET, ZERO-TRUST GOVERNANCE & 1-TAP HARDENER        */}
      {/* =================================================================== */}
      {activeSubTab === 'DATASETS' && (
        <div className="space-y-4">
          {datasets.length === 0 ? (
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-3">
              <Database className="w-8 h-8 text-blue-500 mx-auto opacity-80" />
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                No BigQuery Datasets Provisioned Yet in `{projectId}`
              </div>
              <p className="text-xs text-zinc-500 max-w-xl mx-auto">
                Launch a compliant BigQuery Analytical Lakehouse using our 1-Tap **SEC 17a-4 Financial Ledger**, **GDPR EU Sovereign**, **HIPAA/SOC2**, or **AI Vector & BigLake Iceberg** blueprints.
              </p>
              <button
                type="button"
                onClick={() => onOpenProvision?.('BIGQUERY_DATASET')}
                title="Provision your first compliant BigQuery dataset in seconds"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Launch BigQuery Compliance & Lakehouse Editor</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {datasets.map((ds) => {
                const isPhysical = ds.storageBillingModel === 'PHYSICAL';
                const hasPartitionTtl = Number(ds.defaultPartitionExpirationDays) > 0;
                const isBankerRounding =
                  ds.defaultRoundingMode === 'ROUND_HALF_EVEN';
                return (
                  <div
                    key={ds.datasetId}
                    className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-black text-zinc-950 dark:text-white">
                            {projectId}.{ds.datasetId}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                            📍 {ds.location}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isPhysical
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {isPhysical
                              ? '⚡ PHYSICAL COMPRESSED BILLING'
                              : '📦 LOGICAL UNCOMPRESSED BILLING'}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30">
                            ⏳ {ds.maxTimeTravelHours}h Time-Travel
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {ds.tableCount} Table(s)
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              ds.postureScore >= 80
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            🛡️ Posture {ds.postureScore}/100
                          </span>
                        </div>
                        {ds.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {ds.description}
                          </p>
                        )}
                      </div>

                      {/* 1-Tap Live Compliance & FinOps Hardening Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isPhysical && (
                          <button
                            type="button"
                            disabled={Boolean(hardeningId)}
                            onClick={() =>
                              handlePatchDataset(
                                ds.datasetId,
                                { storageBillingModel: 'PHYSICAL' },
                                'Physical Compressed Billing'
                              )
                            }
                            title="Switch dataset storageBillingModel from LOGICAL to PHYSICAL compressed bytes to save 50%-75% on high-compression tables"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>1-Tap Physical Billing (-54%)</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={Boolean(hardeningId)}
                          onClick={() =>
                            handlePatchDataset(
                              ds.datasetId,
                              {
                                maxTimeTravelHours:
                                  ds.maxTimeTravelHours === 48 ? 168 : 48,
                              },
                              'Time-Travel Window Toggle'
                            )
                          }
                          title={
                            ds.maxTimeTravelHours === 48
                              ? 'Expand Time-Travel window to maximum 168 hours (7 days)'
                              : 'Trim Time-Travel window to 48 hours (2 days) to minimize physical time-travel storage overhead'
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-violet-500/10 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/30 transition-colors cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {ds.maxTimeTravelHours === 48
                              ? 'Expand to 168h (7d) Time-Travel'
                              : 'Trim to 48h Time-Travel'}
                          </span>
                        </button>

                        {!hasPartitionTtl && (
                          <button
                            type="button"
                            disabled={Boolean(hardeningId)}
                            onClick={() =>
                              handlePatchDataset(
                                ds.datasetId,
                                { defaultPartitionExpirationDays: 90 },
                                '90-Day Partition Auto-Expiration'
                              )
                            }
                            title="Enforce a 90-day defaultPartitionExpirationMs on this dataset so old partitions automatically expire"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Enforce 90d Partition TTL</span>
                          </button>
                        )}

                        {!isBankerRounding && (
                          <button
                            type="button"
                            disabled={Boolean(hardeningId)}
                            onClick={() =>
                              handlePatchDataset(
                                ds.datasetId,
                                { defaultRoundingMode: 'ROUND_HALF_EVEN' },
                                'IEEE 754 Banker Rounding (ROUND_HALF_EVEN)'
                              )
                            }
                            title="Set defaultRoundingMode=ROUND_HALF_EVEN (Banker's Rounding) for GAAP/FINRA financial NUMERIC precision"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Set ROUND_HALF_EVEN</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDatasetId(ds.datasetId);
                            setActiveSubTab('TABLES_SQL');
                          }}
                          title={`Explore tables & run Pre-Crime SQL Dry-Run X-Ray in ${ds.datasetId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5 text-blue-500" />
                          <span>Tables & SQL X-Ray</span>
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(hardeningId)}
                          onClick={() =>
                            handleDeleteDataset(ds.datasetId, ds.location)
                          }
                          title={`Delete BigQuery dataset ${projectId}.${ds.datasetId} (including tables)`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] text-zinc-500">
                          Partition TTL
                        </div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {ds.defaultPartitionExpirationDays > 0
                            ? `${ds.defaultPartitionExpirationDays} Days`
                            : 'Never Expire'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] text-zinc-500">
                          Table TTL
                        </div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {ds.defaultTableExpirationDays > 0
                            ? `${ds.defaultTableExpirationDays} Days`
                            : 'Never Expire'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] text-zinc-500">
                          Rounding Mode
                        </div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {ds.defaultRoundingMode}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] text-zinc-500">
                          Encryption
                        </div>
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 truncate">
                          {ds.kmsKeyName ? '🔑 Cloud KMS CMEK' : '🔐 Google AES-256'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] text-zinc-500">
                          Attribution Labels
                        </div>
                        <div className="font-bold text-blue-600 dark:text-blue-400 truncate">
                          {Object.entries(ds.labels || {})
                            .map(([k, v]) => `${k}=${v}`)
                            .join(', ') || 'datacloud=antigravity'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: TABLE DESIGNER, PRE-CRIME DRY-RUN X-RAY & AUTO SQL OPTIMIZER */}
      {/* =================================================================== */}
      {activeSubTab === 'TABLES_SQL' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          {/* Left Column (5 cols): Partitioned + Clustered Table Explorer & Creator */}
          <div className="xl:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span>Partitioned & Clustered Table Designer</span>
                </div>
                <select
                  value={selectedDatasetId}
                  onChange={(e) => setSelectedDatasetId(e.target.value)}
                  className="bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  {datasets.length === 0 && (
                    <option value="">No dataset yet</option>
                  )}
                  {datasets.map((d) => (
                    <option key={d.datasetId} value={d.datasetId}>
                      {d.datasetId} ({d.location})
                    </option>
                  ))}
                </select>
              </div>

              <form onSubmit={handleCreateTable} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                      Table Name
                    </label>
                    <input
                      type="text"
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                      Time Partitioning Granularity
                    </label>
                    <select
                      value={newTablePartitionType}
                      onChange={(e) => setNewTablePartitionType(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    >
                      <option value="DAY">DAY (`event_timestamp`)</option>
                      <option value="HOUR">HOUR (`event_timestamp`)</option>
                      <option value="MONTH">MONTH (`event_timestamp`)</option>
                      <option value="NONE">Unpartitioned</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                      Clustering Columns (Up to 4 sorted keys)
                    </label>
                    <input
                      type="text"
                      value={newTableClusterCols}
                      onChange={(e) => setNewTableClusterCols(e.target.value)}
                      placeholder="region,user_id"
                      className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 cursor-pointer p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 w-full">
                      <input
                        type="checkbox"
                        checked={newTableRequireFilter}
                        onChange={(e) =>
                          setNewTableRequireFilter(e.target.checked)
                        }
                      />
                      <span className="text-[11px]">
                        Enforce `requirePartitionFilter`
                      </span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={creatingTable || !selectedDatasetId}
                  title="Create a real Partitioned + Clustered analytical table in the selected dataset with TIMESTAMP, NUMERIC, and JSON columns"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl py-2 text-xs font-mono font-bold transition-colors cursor-pointer"
                >
                  {creatingTable
                    ? 'Creating Partitioned Table...'
                    : `+ Create Partitioned & Clustered Table in ${
                        selectedDatasetId || 'Dataset'
                      }`}
                </button>
              </form>

              {/* Live Tables List */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="text-[11px] font-mono font-bold text-zinc-500">
                  Live Tables in `{selectedDatasetId || 'none'}` ({tables.length})
                </div>
                {loadingTables ? (
                  <div className="text-xs font-mono text-zinc-400 animate-pulse py-3">
                    Loading table schemas & partition metadata...
                  </div>
                ) : tables.length === 0 ? (
                  <div className="text-xs text-zinc-500 py-2">
                    No tables in this dataset yet — click the button above to seed a Partitioned + Clustered analytical table.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {tables.map((t) => (
                      <div
                        key={t.tableId}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 text-xs font-mono space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {t.tableId}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                            {t.timePartitioning?.type
                              ? `PARTITIONED (${t.timePartitioning.type})`
                              : t.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>
                            Cluster:{' '}
                            {(t.clustering || []).join(', ') || 'None'}
                          </span>
                          <span>
                            {t.numRows} rows · {formatBytes(t.numBytes)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Pre-Crime SQL Dry-Run X-Ray & Automatic SQL Optimizer */}
          <div className="xl:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3.5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      Pre-Crime SQL Dry-Run Cost X-Ray & Automatic Optimizer
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-500">
                    Validates scanned bytes via `jobs.query(dryRun=true)` before spending $0.01 and auto-rewrites SQL per Google Cloud BigQuery optimization rules.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-mono text-zinc-500">
                    Safety Guard (`maximumBytesBilled`):
                  </label>
                  <select
                    value={maxBytesGuardGb}
                    onChange={(e) => setMaxBytesGuardGb(Number(e.target.value))}
                    className="bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 text-xs font-mono"
                  >
                    <option value={0.1}>100 MB Max Cap</option>
                    <option value={1}>1 GB Max Cap ($0.006)</option>
                    <option value={10}>10 GB Max Cap ($0.06)</option>
                    <option value={100}>100 GB Max Cap ($0.62)</option>
                  </select>
                </div>
              </div>

              {/* Sample Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_UNOPTIMIZED_QUERIES.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setSqlInput(q.sql)}
                    title={`Load sample SQL query: ${q.label}`}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-blue-500/15 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={7}
                value={sqlInput}
                onChange={(e) => setSqlInput(e.target.value)}
                className="w-full bg-zinc-950 text-emerald-300 border border-zinc-800 rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-blue-500"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={runningQuery}
                    onClick={() => handleExecuteQuery(true)}
                    title="Run a $0.00 BigQuery Dry-Run X-Ray + Automatic SQL Optimization Pass"
                    className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-3.5 py-2 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {runningQuery
                        ? 'Scanning Capacitor Metadata...'
                        : '1. Dry-Run X-Ray & Auto-Optimize ($0.00)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={runningQuery}
                    onClick={() => handleExecuteQuery(false)}
                    title={`Execute live BigQuery SQL query protected by maximumBytesBilled=${maxBytesGuardGb}GB circuit-breaker`}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3.5 py-2 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>2. Execute Live SQL (Protected)</span>
                  </button>
                </div>

                {queryResult?.optimizationReport?.optimizedSql && (
                  <button
                    type="button"
                    onClick={() =>
                      setSqlInput(queryResult.optimizationReport.optimizedSql)
                    }
                    title="Replace editor SQL with the automatically optimized SQL query"
                    className="inline-flex items-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-xl px-3 py-2 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Apply Optimized SQL</span>
                  </button>
                )}
              </div>

              {/* Dry-Run & Optimizer Report Output */}
              {queryResult && (
                <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-xl bg-rose-500/[0.06] border border-rose-500/25">
                      <div className="text-[10px] font-mono uppercase text-rose-500">
                        Unoptimized Scan & Cost
                      </div>
                      <div className="text-sm font-black font-mono text-zinc-900 dark:text-white mt-0.5">
                        {formatBytes(queryResult.totalBytesProcessed)} · $
                        {Number(queryResult.onDemandCostUsd || 0).toFixed(4)}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/30">
                      <div className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400">
                        After Auto-Optimizer (
                        -{queryResult.optimizationReport?.estimatedReductionPercent || 0}
                        %)
                      </div>
                      <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatBytes(queryResult.optimizedBytesEstimate)} · $
                        {Number(queryResult.optimizedCostUsd || 0).toFixed(4)}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/25">
                      <div className="text-[10px] font-mono uppercase text-blue-500">
                        Execution Mode
                      </div>
                      <div className="text-xs font-bold font-mono text-zinc-900 dark:text-white mt-0.5">
                        {queryResult.dryRun
                          ? '🛡️ DRY-RUN X-RAY ($0 Billed)'
                          : `⚡ LIVE (${queryResult.totalRows} rows)`}
                      </div>
                    </div>
                  </div>

                  {/* Summary of Optimizations (Required by bigquery-sql skill) */}
                  {queryResult.optimizationReport && (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          Summary of Optimizations (`bigquery-sql` Engine)
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              queryResult.optimizationReport.optimizedSql,
                              'opt-sql'
                            )
                          }
                          title="Copy optimized BigQuery SQL to clipboard"
                          className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-500 hover:underline cursor-pointer"
                        >
                          {copiedId === 'opt-sql' ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied Optimized SQL</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Optimized SQL</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(
                          queryResult.optimizationReport.optimizations || []
                        ).map((opt, i) => (
                          <div
                            key={i}
                            className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs"
                          >
                            <div className="flex items-center justify-between font-mono font-bold">
                              <span className="text-zinc-900 dark:text-zinc-100">
                                {i + 1}. {opt.rule}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                {opt.impact}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">
                              {opt.explanation}
                            </p>
                          </div>
                        ))}
                      </div>

                      <pre className="p-3 rounded-lg bg-zinc-950 text-cyan-300 text-[11px] font-mono overflow-x-auto">
                        {queryResult.optimizationReport.optimizedSql}
                      </pre>
                    </div>
                  )}

                  {/* Live Query Rows Table */}
                  {!queryResult.dryRun &&
                    Array.isArray(queryResult.rows) &&
                    queryResult.rows.length > 0 && (
                      <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
                            <tr>
                              {Object.keys(queryResult.rows[0]).map((col) => (
                                <th key={col} className="px-3 py-2">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {queryResult.rows.slice(0, 15).map((r, idx) => (
                              <tr key={idx}>
                                {Object.values(r).map((val, cIdx) => (
                                  <td key={cIdx} className="px-3 py-1.5">
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
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: LOGICAL VS PHYSICAL STORAGE & SLOT EDITION FINOPS CRYSTAL    */}
      {/* =================================================================== */}
      {activeSubTab === 'FINOPS_CRYSTAL' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                <span>
                  BigQuery Capacitor Compression (Logical vs Physical) & Edition Slot Simulator
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Simulate exact monthly savings from switching `storageBillingModel` to `PHYSICAL` compressed bytes and tuning `maxTimeTravelHours`.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              Projected Storage Savings: $
              {finopsComparison.monthlyStorageSavings.toFixed(2)}/mo (
              {finopsComparison.savingsPct}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <label className="block text-[10px] font-mono text-zinc-500">
                Logical Warehouse Size: {simLogicalTb} TB
              </label>
              <input
                type="range"
                min={1}
                max={500}
                value={simLogicalTb}
                onChange={(e) => setSimLogicalTb(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <label className="block text-[10px] font-mono text-zinc-500">
                Capacitor Compression: {simCompressionRatio}:1
              </label>
              <input
                type="range"
                min={1.5}
                max={12}
                step={0.1}
                value={simCompressionRatio}
                onChange={(e) => setSimCompressionRatio(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <label className="block text-[10px] font-mono text-zinc-500">
                90d Long-Term Ratio: {simLongTermPct}%
              </label>
              <input
                type="range"
                min={0}
                max={95}
                value={simLongTermPct}
                onChange={(e) => setSimLongTermPct(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <label className="block text-[10px] font-mono text-zinc-500">
                Daily Mutation Churn: {simDailyChurnPct}%
              </label>
              <input
                type="range"
                min={0}
                max={25}
                step={0.5}
                value={simDailyChurnPct}
                onChange={(e) => setSimDailyChurnPct(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <label className="block text-[10px] font-mono text-zinc-500">
                Time-Travel Window: {simTimeTravelHours}h
              </label>
              <select
                value={simTimeTravelHours}
                onChange={(e) => setSimTimeTravelHours(Number(e.target.value))}
                className="w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-xs font-mono"
              >
                <option value={48}>48 Hours (Min Overhead)</option>
                <option value={72}>72 Hours (Balanced)</option>
                <option value={168}>168 Hours (7 Days)</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800">
              <label className="block text-[10px] font-mono text-zinc-500">
                Daily SQL Scanned: {simDailyScannedTb} TB/d
              </label>
              <input
                type="range"
                min={1}
                max={200}
                value={simDailyScannedTb}
                onChange={(e) => setSimDailyScannedTb(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="text-xs font-bold font-mono text-zinc-500 uppercase">
                📦 Logical Uncompressed Billing
              </div>
              <div className="text-2xl font-black font-mono text-zinc-900 dark:text-white">
                ${finopsComparison.logicalMonthlyTotal.toFixed(2)}
                <span className="text-xs font-normal text-zinc-500">/mo</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                {finopsComparison.logicalGb.toLocaleString()} GB logical · $0.02/GB active · $0.01/GB long-term (Time-Travel free)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/30 space-y-2">
              <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 uppercase">
                ⚡ Physical Compressed Billing ({simCompressionRatio}:1)
              </div>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                ${finopsComparison.physicalMonthlyTotal.toFixed(2)}
                <span className="text-xs font-normal text-zinc-500">/mo</span>
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                {finopsComparison.compressedTotalGb.toLocaleString()} GB compressed on disk (includes {finopsComparison.churnPhysicalGb} GB Time-Travel + Fail-Safe)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-500/[0.06] border border-blue-500/25 space-y-2">
              <div className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400 uppercase">
                🚀 Compute: On-Demand vs Enterprise Slots
              </div>
              <div className="text-sm font-black font-mono text-zinc-900 dark:text-white">
                On-Demand: ${finopsComparison.onDemandComputeMonthly.toFixed(0)}/mo
              </div>
              <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                Autoscaling Edition: $
                {finopsComparison.estAutoscalingSlotsMonthly.toFixed(0)}/mo
              </div>
              <p className="text-[11px] text-zinc-500 font-mono">
                Saves ~$
                {finopsComparison.computeSavingsMonthly.toFixed(0)}/mo at{' '}
                {simDailyScannedTb} TB/day scan volume
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: 168-HOUR `FOR SYSTEM_TIME AS OF` TIME-MACHINE & CLONE        */}
      {/* =================================================================== */}
      {activeSubTab === 'TIME_MACHINE' && (
        <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <History className="w-4 h-4 text-violet-500" />
                <span>
                  BigQuery 168-Hour `FOR SYSTEM_TIME AS OF` Time-Machine & Zero-Copy Clone Restorer
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                Rewind any table to the exact millisecond before a bad `DELETE`, `UPDATE`, or `DROP TABLE` without restoring backups or paying extra storage bytes.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-500/15 text-violet-600 dark:text-violet-300 border border-violet-500/30">
              Rewind Offset: -{rewindHoursAgo} Hours ({Math.round((rewindHoursAgo / 24) * 10) / 10} Days Ago)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Source Table (`{selectedDatasetId || 'analytics_lakehouse'}`)
              </label>
              <input
                type="text"
                value={rewindTableTarget}
                onChange={(e) => setRewindTableTarget(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Zero-Copy Restored Clone Name
              </label>
              <input
                type="text"
                value={rewindCloneName}
                onChange={(e) => setRewindCloneName(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                Point-in-Time Rewind Slider (1h – 168h / 7 Days)
              </label>
              <input
                type="range"
                min={1}
                max={168}
                value={rewindHoursAgo}
                onChange={(e) => setRewindHoursAgo(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {[
              {
                id: 'as-of',
                title: '1. Point-in-Time Snapshot Query',
                sql: timeMachineSql.selectAsOf,
              },
              {
                id: 'zero-copy-clone',
                title: '2. Instant Zero-Copy Table Clone ($0 Storage)',
                sql: timeMachineSql.zeroCopyClone,
              },
              {
                id: 'diff-audit',
                title: '3. Diff Purged / Deleted Rows Since Snapshot',
                sql: timeMachineSql.diffDeletedRows,
              },
            ].map((card) => (
              <div
                key={card.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-violet-300">
                      {card.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(card.sql, card.id)}
                      title={`Copy ${card.title} SQL`}
                      className="text-[11px] font-mono text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === card.id ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-zinc-200 whitespace-pre-wrap break-all">
                    {card.sql}
                  </pre>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSqlInput(card.sql);
                    setActiveSubTab('TABLES_SQL');
                  }}
                  title={`Load "${card.title}" into the SQL Pre-Crime X-Ray & Live Executor`}
                  className="w-full mt-2 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 text-[11px] font-mono font-bold transition-colors cursor-pointer"
                >
                  Load into SQL X-Ray & Execute →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: BIGLAKE VS. BIGQUERY OPEN LAKEHOUSE & APACHE ICEBERG STUDIO  */}
      {/* =================================================================== */}
      {activeSubTab === 'BIGLAKE_ICEBERG' && (
        <div className="space-y-4">
          {/* 1. Visual Demystifier: Why People Confuse BigQuery vs. BigLake */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-cyan-500/35 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Layers className="w-4 h-4 text-cyan-500" />
                  <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
                    🌊 Demystifying BigLake vs. BigQuery in 60 Seconds
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                    OPEN APACHE ICEBERG · ZERO DATA DUPLICATION · ZERO-TRUST BUCKET DELEGATION
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  **The Golden Rule**: **BigQuery** is the *SQL Compute Engine + Google-owned Capacitor Storage*, while **BigLake** lets you keep your data as **open Apache Iceberg / Parquet files inside your own `gs://` Cloud Storage bucket** (so Spark, Vertex AI, and BigQuery share the exact same files with zero copies) **without** losing Row/Column Security or ACID transactions!
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {[
                  {
                    id: 'ICEBERG_MANAGED',
                    label: '🧊 BigLake Apache Iceberg (ACID + Open)',
                  },
                  {
                    id: 'BIGLAKE_EXTERNAL',
                    label: '⚡ BigLake Cached External (Read-Only)',
                  },
                  {
                    id: 'NATIVE_BQ',
                    label: '🏢 Native BigQuery (Capacitor)',
                  },
                ].map((arch) => (
                  <button
                    key={arch.id}
                    type="button"
                    onClick={() => setBigLakeUseCase(arch.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                      bigLakeUseCase === arch.id
                        ? 'bg-cyan-600 text-white border-cyan-400 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {arch.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3-Column Comparison Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* Column 1: Legacy External Table (What NOT to use) */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-rose-500">
                    ❌ 1. Legacy External Table (Old Way)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-400 font-bold">
                    AVOID IN PROD
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  Points BigQuery directly at raw `gs://` files without a BigLake Connection.
                </p>
                <ul className="space-y-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <li>• 🚨 **Security Hole**: Every SQL user must be granted raw `roles/storage.objectViewer` on the entire `gs://` bucket!</li>
                  <li>• ❌ **No Row or Column Masking**: Cannot hide PII columns or filter rows by tenant.</li>
                  <li>• 🐢 **Slow**: Re-lists `gs://` bucket objects on every query (no metadata cache).</li>
                  <li>• ❌ **Read-Only**: No `INSERT`, `UPDATE`, `DELETE`, or `MERGE`.</li>
                </ul>
              </div>

              {/* Column 2: BigLake Open Lakehouse (Apache Iceberg / Parquet in gs://) */}
              <div
                onClick={() => setBigLakeUseCase('ICEBERG_MANAGED')}
                className={`p-4 rounded-xl border space-y-2.5 cursor-pointer transition-all ${
                  bigLakeUseCase !== 'NATIVE_BQ'
                    ? 'border-cyan-400 bg-cyan-500/10 ring-1 ring-cyan-400/40'
                    : 'border-cyan-500/30 bg-cyan-500/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-cyan-400">
                    🌊 2. BigLake + Apache Iceberg (2026 Lakehouse)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 font-bold">
                    MULTI-ENGINE WINNER
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-200">
                  Files stay as open **Apache Iceberg / Parquet** in **your `gs://` bucket** via a delegated `CLOUD_RESOURCE` Connection.
                </p>
                <ul className="space-y-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                  <li>• 🔐 **Zero-Trust Bucket**: Only BigLake&apos;s Service Account touches `gs://`; analysts only get SQL table access!</li>
                  <li>• 🛡️ **Row & Column Security**: Full Policy Tags + Row Access Policies on `gs://` files.</li>
                  <li>• 🧊 **Full ACID (`table_format=&apos;ICEBERG&apos;`)**: `INSERT`, `UPDATE`, `DELETE`, `MERGE` & Time-Travel in `gs://`!</li>
                  <li>• 🤝 **Zero Copies**: Spark, Dataproc, Vertex AI & BigQuery read the *exact same* `gs://` Parquet files.</li>
                </ul>
              </div>

              {/* Column 3: Native BigQuery Storage (Capacitor) */}
              <div
                onClick={() => setBigLakeUseCase('NATIVE_BQ')}
                className={`p-4 rounded-xl border space-y-2.5 cursor-pointer transition-all ${
                  bigLakeUseCase === 'NATIVE_BQ'
                    ? 'border-indigo-400 bg-indigo-500/10 ring-1 ring-indigo-400/40'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#09090b]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-indigo-400">
                    🏢 3. Native BigQuery Table (`Capacitor`)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 font-bold">
                    PURE SQL WAREHOUSE
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  Data is ingested into Google-managed proprietary Capacitor storage inside BigQuery.
                </p>
                <ul className="space-y-1 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
                  <li>• ⚡ **Zero Setup**: No `gs://` bucket or `CLOUD_RESOURCE` connection required.</li>
                  <li>• 🗜️ **5:1 Capacitor Compression**: Best with `PHYSICAL` billing model ($0.04/GB compressed).</li>
                  <li>• 🔒 **Closed Storage**: Non-BigQuery engines (Spark/Ray) must call the paid BigQuery Storage Read API instead of reading open `gs://` files directly.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 2. Interactive 3-Step BigLake & Apache Iceberg Builder */}
          <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500" />
                  <span>
                    3-Step Guided BigLake &amp; Apache Iceberg Provisioner (No More Missing Connection Errors!)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Configure your `gs://` bucket, BigLake `CLOUD_RESOURCE` Connection, and Apache Iceberg / Parquet options below — we generate all 3 steps ready to run.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-500 border border-cyan-500/30">
                Target: `gs://{bigLakeArtifacts.bkt}/{bigLakeArtifacts.cleanFolder}`
              </span>
            </div>

            {/* Configuration Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  1. Cloud Storage Bucket (`gs://`)
                </label>
                <div className="flex gap-1.5">
                  {gcsBuckets.length > 0 ? (
                    <select
                      value={bigLakeBucket}
                      onChange={(e) => setBigLakeBucket(e.target.value)}
                      className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
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
                      placeholder={`${projectId}-open-lakehouse`}
                      className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
                    />
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  2. Lakehouse Folder Path in Bucket
                </label>
                <input
                  type="text"
                  value={bigLakeFolder}
                  onChange={(e) => setBigLakeFolder(e.target.value)}
                  placeholder="iceberg-lakehouse/events_2026"
                  className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
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
                  className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
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
                  className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* Extra Controls for External Format & Metadata Cache Staleness + RLS */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Connection Region (`location`)
                </label>
                <select
                  value={bigLakeLocation}
                  onChange={(e) => setBigLakeLocation(e.target.value)}
                  className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
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
                  className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
                >
                  <option value="PARQUET">PARQUET (Recommended + Iceberg)</option>
                  <option value="DELTA_LAKE">DELTA_LAKE (Databricks / Spark)</option>
                  <option value="ORC">ORC (Hive / Hadoop)</option>
                  <option value="AVRO">AVRO (Streaming Events)</option>
                  <option value="JSON">JSON (Newline-Delimited)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Metadata Cache (`max_staleness`)
                </label>
                <select
                  value={bigLakeStalenessMins}
                  onChange={(e) => setBigLakeStalenessMins(Number(e.target.value))}
                  className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
                >
                  <option value={15}>15 Minutes (Near-Real-Time)</option>
                  <option value={30}>30 Minutes (Balanced Speed)</option>
                  <option value={60}>60 Minutes (Fastest Object Cache)</option>
                  <option value={240}>4 Hours (Batch Lakehouse)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Row-Level Security Filter (`FILTER USING`)
                </label>
                <input
                  type="text"
                  value={bigLakeRlsFilter}
                  onChange={(e) => setBigLakeRlsFilter(e.target.value)}
                  className="w-full h-[36px] bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono"
                />
              </div>
            </div>

            {/* 3-Step Execution Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2">
              {/* Step 1: Cloud Resource Connection */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3">
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
                      className="text-[11px] font-mono text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'bl-step1' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy CLI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Creates the `CLOUD_RESOURCE` bridge so BigQuery can read/write `gs://{bigLakeArtifacts.bkt}` using a dedicated Google-managed Service Account.
                  </p>
                  <pre className="text-[10.5px] font-mono text-zinc-200 bg-black/50 p-2.5 rounded-lg border border-zinc-800/80 whitespace-pre-wrap break-all">
                    {bigLakeArtifacts.step1ConnectionCli}
                  </pre>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onRunInShell?.(
                      `bq mk --connection --connection_type=CLOUD_RESOURCE --project_id=${projectId} --location=${bigLakeLocation} ${bigLakeConnectionId}`
                    )
                  }
                  className="w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold cursor-pointer"
                >
                  Run Step 1 in Cloud Shell →
                </button>
              </div>

              {/* Step 2: Zero-Trust Bucket IAM Binding */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between space-y-3">
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
                      className="text-[11px] font-mono text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'bl-step2' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy CLI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Grants **only** the BigLake Connection Service Account access to `gs://{bigLakeArtifacts.bkt}` — your analysts never touch raw GCS objects!
                  </p>
                  <pre className="text-[10.5px] font-mono text-zinc-200 bg-black/50 p-2.5 rounded-lg border border-zinc-800/80 whitespace-pre-wrap break-all">
                    {bigLakeArtifacts.step2BucketIamCli}
                  </pre>
                </div>

                <button
                  type="button"
                  onClick={() => onRunInShell?.(bigLakeArtifacts.step2BucketIamCli)}
                  className="w-full py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold cursor-pointer"
                >
                  Run Step 2 in Cloud Shell →
                </button>
              </div>

              {/* Step 3: Create BigLake Apache Iceberg or Cached External Table */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-cyan-500/40 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold font-mono text-cyan-300">
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
                      className="text-[11px] font-mono text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'bl-step3' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy SQL</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {bigLakeUseCase === 'ICEBERG_MANAGED'
                      ? 'Creates an ACID-compliant Apache Iceberg table stored as open Parquet in your gs:// bucket.'
                      : 'Creates a metadata-cached BigLake External Table over existing gs:// files.'}
                  </p>
                  <pre className="text-[10.5px] font-mono text-cyan-100 bg-black/50 p-2.5 rounded-lg border border-cyan-500/30 whitespace-pre-wrap break-all">
                    {bigLakeArtifacts.primaryDdl}
                  </pre>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSqlInput(bigLakeArtifacts.primaryDdl);
                    setActiveSubTab('TABLES_SQL');
                  }}
                  className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-[11px] font-mono font-extrabold cursor-pointer"
                >
                  Load Step 3 into SQL Executor →
                </button>
              </div>
            </div>

            {/* Bonus Row: Row-Level Security on gs:// Files + Spark Zero-Copy Interoperability */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-violet-300">
                    🔐 Bonus A: Row-Level Security on `gs://` Parquet Files (BigLake Exclusive)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        copyText(bigLakeArtifacts.rowAccessPolicyDdl, 'bl-rls')
                      }
                      className="text-[11px] font-mono text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'bl-rls' ? 'Copied' : 'Copy SQL'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSqlInput(bigLakeArtifacts.rowAccessPolicyDdl);
                        setActiveSubTab('TABLES_SQL');
                      }}
                      className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10.5px] font-mono font-bold cursor-pointer"
                    >
                      Open in SQL X-Ray →
                    </button>
                  </div>
                </div>
                <pre className="text-[10.5px] font-mono text-zinc-300 bg-black/40 p-2.5 rounded-lg whitespace-pre-wrap break-all">
                  {bigLakeArtifacts.rowAccessPolicyDdl}
                </pre>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-emerald-300">
                    🤝 Bonus B: Apache Spark / Vertex AI Zero-Copy Read of Same `gs://` Iceberg Table
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(bigLakeArtifacts.sparkReadSnippet, 'bl-spark')
                    }
                    className="text-[11px] font-mono text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'bl-spark' ? 'Copied' : 'Copy PySpark'}
                  </button>
                </div>
                <pre className="text-[10.5px] font-mono text-zinc-300 bg-black/40 p-2.5 rounded-lg whitespace-pre-wrap break-all">
                  {bigLakeArtifacts.sparkReadSnippet}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
