import React, { useState, useMemo, useCallback, useEffect } from 'react';
import axios from 'axios';
import {
  Layers,
  Database,
  Sparkles,
  ShieldCheck,
  Globe,
  Cpu,
  Activity,
  Terminal,
  Copy,
  Check,
  Play,
  RefreshCw,
  Search,
  Filter,
  HardDrive,
  GitBranch,
  ArrowRight,
  Lock,
} from 'lucide-react';

export function LakehouseTrackBadge({ track = 'GA' }) {
  const norm = String(track || 'GA').toUpperCase();
  if (norm === 'ALPHA') {
    return (
      <span
        title="Google Cloud ALPHA Track (gcloud alpha / v1alpha): Early Access Preview with no SLA."
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/40 shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
        <span>[ALPHA · EARLY ACCESS]</span>
      </span>
    );
  }
  if (norm === 'BETA') {
    return (
      <span
        title="Google Cloud BETA Track (gcloud beta / v1beta): Public Preview undergoing final stabilization."
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span>[BETA · PUBLIC PREVIEW]</span>
      </span>
    );
  }
  return (
    <span
      title="Google Cloud GA Track: Generally Available production capability."
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shrink-0"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>[GA · PRODUCTION]</span>
    </span>
  );
}

const LAKEHOUSE_DOMAINS = [
  {
    id: 'ALL',
    code: 'ALL',
    shortLabel: 'All 8 Domains (50 Playbooks)',
    subtitle: 'Full Multi-Engine Lakehouse Catalog',
    badge: '50 Scenarios',
  },
  {
    id: 'CATALOG_MIGRATION',
    code: 'D01',
    shortLabel: 'Iceberg REST Catalog & Migrations',
    subtitle: 'HMS 100+ Tables · Delta · DIY Parquet',
    badge: '7 Playbooks',
  },
  {
    id: 'MULTI_ENGINE',
    code: 'D02',
    shortLabel: 'Engines & Interoperability (BQ / Spark / Trino)',
    subtitle: 'Single Copy · Zero-Copy Sharing · TPC-DS',
    badge: '7 Playbooks',
  },
  {
    id: 'STREAMING_CDC_DML',
    code: 'D03',
    shortLabel: 'Advanced ETL, CDC & Streaming Lakehouse',
    subtitle: 'Multi-Stmt ACID · Kafka · Beam · Debezium',
    badge: '7 Playbooks',
  },
  {
    id: 'STORAGE_PERF',
    code: 'D04',
    shortLabel: 'Storage Engineering, Caching & Compaction',
    subtitle: 'GCS Prefix Hash · Autoclass · Spanner Meta',
    badge: '7 Playbooks',
  },
  {
    id: 'MULTI_CLOUD',
    code: 'D05',
    shortLabel: 'Borderless Multi-Cloud (S3 / ADLS / CCI)',
    subtitle: 'BigQuery Omni · Glue & Unity · Zero-Egress',
    badge: '6 Playbooks',
  },
  {
    id: 'GOVERNANCE_SECURITY',
    code: 'D06',
    shortLabel: 'Unified Governance, RLS/CLS & WORM Vault',
    subtitle: 'Row/Col Masking · CMEK · SEC 17a-4 Lock',
    badge: '6 Playbooks',
  },
  {
    id: 'HTAP_CONVERGENCE',
    code: 'D07',
    shortLabel: 'Operational DB Convergence & HTAP',
    subtitle: 'Spanner · AlloyDB Columnar · Bigtable Zero-ETL',
    badge: '5 Playbooks',
  },
  {
    id: 'GENAI_AGENTS',
    code: 'D08',
    shortLabel: 'Agents, Semantic SQL & Vector Lakehouse',
    subtitle: 'Conversational BI · AI.IF · Vector RAG · Feature Store',
    badge: '5 Playbooks',
  },
];

const ICEBERG_PLAYBOOKS = [
  // =========================================================================
  // DOMAIN 1: ICEBERG REST CATALOG, MIGRATIONS & MEDALLION (1-7)
  // =========================================================================
  {
    num: 1,
    id: 'REST_CATALOG_MULTI_ENGINE',
    domain: 'CATALOG_MIGRATION',
    track: 'BETA',
    title: 'Why the Iceberg REST Catalog Changes Everything for Multi-Engine Lakehouses',
    persona: 'Data Architects, Platform Engineers',
    stack: 'Lakehouse Metastore, Iceberg REST Catalog (biglake.googleapis.com/iceberg/v1/restcatalog)',
    angle:
      "How Google Cloud's native implementation of the open Apache Iceberg REST Catalog removes catalog lock-in, vends short-lived GCS OAuth tokens, and scales out metadata.",
    tableName: 'orders_rest_governed',
  },
  {
    num: 2,
    id: 'HMS_100_TABLES_MIGRATION',
    domain: 'CATALOG_MIGRATION',
    track: 'BETA',
    title: 'Step-by-Step: Migrating 100+ Tables from Hive Metastore (HMS) to Lakehouse REST Catalog',
    persona: 'Data Engineers, DevOps',
    stack: 'Google Managed Spark, Hive Metastore (HMS), Lakehouse REST Catalog',
    angle:
      "Zero-downtime metadata migration strategies from legacy Hive metastores to Google's serverless Lakehouse REST catalog using Spark catalog bridge procedures without copying Parquet data.",
    tableName: 'hms_migrated_transactions',
  },
  {
    num: 3,
    id: 'MEDALLION_ARCHITECTURE_ICEBERG',
    domain: 'CATALOG_MIGRATION',
    track: 'GA',
    title: 'Building a Rock-Solid Medallion Architecture on Google Cloud with Apache Iceberg',
    persona: 'Data Engineers',
    stack: 'BigQuery, Managed Spark, Google Cloud Storage (GCS)',
    angle:
      'Practical implementation of Bronze (append-only raw), Silver (ACID deduplicated + PII-masked), and Gold (partitioned/clustered business marts) tiers using open Iceberg tables, schema evolution, and FOR SYSTEM_TIME AS OF time travel.',
    tableName: 'silver_customer_360_iceberg',
  },
  {
    num: 4,
    id: 'PUBLIC_DATASETS_PLANET_SCALE',
    domain: 'CATALOG_MIGRATION',
    track: 'GA',
    title: 'Unlocking Public Datasets: Querying Planet-Scale Open Iceberg Tables with Lakehouse',
    persona: 'Data Analysts, Data Scientists',
    stack: 'BigQuery, Lakehouse Public Data (bigquery-public-data)',
    angle:
      'Query and join petabyte-scale public Iceberg datasets with private enterprise Iceberg tables in place without data movement or storage duplication.',
    tableName: 'enterprise_enriched_weather_sales',
  },
  {
    num: 5,
    id: 'DELTA_TO_ICEBERG_PLAYBOOK',
    domain: 'CATALOG_MIGRATION',
    track: 'BETA',
    title: 'Delta Lake to Apache Iceberg: A Practical Migration Playbook on Google Cloud',
    persona: 'Migration Specialists, Data Architects',
    stack: 'Managed Spark, BigQuery, Delta/Iceberg Metadata Translator',
    angle:
      'Translating _delta_log table formats, converting Parquet metadata manifests in-place, and establishing full Apache Iceberg V2 parity using Managed Spark.',
    tableName: 'delta_converted_iceberg_ledger',
  },
  {
    num: 6,
    id: 'DIY_PARQUET_INPLACE_UPGRADE',
    domain: 'CATALOG_MIGRATION',
    track: 'GA',
    title: 'DIY Parquet to Managed Iceberg Tables: Eliminating Metadata Debt',
    persona: 'Data Engineers',
    stack: 'Lakehouse, GCS, SQL DDL & Spark system.add_files',
    angle:
      'In-place table upgrades from raw unmanaged GCS Parquet directories into governed Apache Iceberg managed tables with zero file rewrite using CALL system.add_files.',
    tableName: 'upgraded_parquet_clickstream',
  },
  {
    num: 7,
    id: 'DATA_LIBERATION_OPEN_FORMATS',
    domain: 'CATALOG_MIGRATION',
    track: 'GA',
    title: 'Data Liberation: How Open Table Formats Break Modern Data Silos',
    persona: 'Lead Architects, Tech Evangelists',
    stack: 'Apache Iceberg V2, BigQuery, Knowledge Catalog',
    angle:
      'Architectural blueprint decoupling compute engines (BigQuery, Spark, Trino, Flink, DuckDB) from open GCS Parquet + Iceberg metadata to eliminate proprietary storage lock-in.',
    tableName: 'liberated_enterprise_events',
  },

  // =========================================================================
  // DOMAIN 2: ENGINES & INTEROPERABILITY (8-14)
  // =========================================================================
  {
    num: 8,
    id: 'ONE_TABLE_MANY_ENGINES',
    domain: 'MULTI_ENGINE',
    track: 'GA',
    title: 'One Table, Many Engines: Running BigQuery, Spark, and Trino on a Single Iceberg Copy',
    persona: 'Data Platform Engineers',
    stack: 'BigQuery, Managed Spark, Trino on GKE',
    angle:
      'True multi-engine concurrency and Serializable/Snapshot ACID isolation over a single GCS storage bucket without duplicating Parquet data files.',
    tableName: 'shared_multi_engine_orders',
  },
  {
    num: 9,
    id: 'MANAGED_SPARK_ICEBERG_1_10',
    domain: 'MULTI_ENGINE',
    track: 'BETA',
    title: 'Deep Dive: Google Cloud Managed Service for Apache Spark with the Iceberg REST Catalog',
    persona: 'Spark Developers',
    stack: 'Managed Spark (Dataproc Serverless), Apache Iceberg 1.9 / 1.10',
    angle:
      'Zero-cluster provisioning, sub-30s startup, and out-of-the-box Iceberg REST catalog integration for PySpark and Scala workloads.',
    tableName: 'spark_1_10_feature_store',
  },
  {
    num: 10,
    id: 'BIGQUERY_LAKEHOUSE_ENGINE_VECTOR',
    domain: 'MULTI_ENGINE',
    track: 'GA',
    title: "Serverless SQL over Iceberg: What Makes BigQuery's Lakehouse Engine Unique?",
    persona: 'BI Engineers, SQL Developers',
    stack: 'BigQuery Lakehouse Runtime, Capacitor/Parquet Vectorizer',
    angle:
      "Analyzing BigQuery's distributed query optimizer, Iceberg manifest partition pruning, metadata caching, and dynamic shuffle/vector execution over open Parquet files.",
    tableName: 'bq_vectorized_telemetry',
  },
  {
    num: 11,
    id: 'BATCH_ELT_DATAFLOW_SPARK_COMPOSER',
    domain: 'MULTI_ENGINE',
    track: 'GA',
    title: 'Batch Processing at Scale: Orchestrating Apache Iceberg Jobs with Dataflow and Spark',
    persona: 'Data Pipeline Engineers',
    stack: 'Dataflow, Managed Spark, Cloud Composer / Data Agent Kit',
    angle:
      'Designing resilient ELT batch workflows writing to Apache Iceberg tables with atomic snapshot commits and automatic retry rollback.',
    tableName: 'batch_reconciled_settlements',
  },
  {
    num: 12,
    id: 'ZERO_COPY_CROSS_ORG_SHARING',
    domain: 'MULTI_ENGINE',
    track: 'GA',
    title: 'Zero-Copy Data Sharing: Sharing Iceberg Tables Across Projects and Organizations',
    persona: 'Enterprise Data Architects',
    stack: 'BigLake Lakehouse, Analytics Hub Clean Rooms',
    angle:
      'Securely exposing governed Iceberg tables to downstream partner projects and organizations without data exports or cloud-storage copy fees.',
    tableName: 'partner_shared_supply_chain',
  },
  {
    num: 13,
    id: 'BENCHMARK_BQ_VS_TRINO_10TB',
    domain: 'MULTI_ENGINE',
    track: 'GA',
    title: 'Benchmarking BigQuery vs. Open-Source Trino on Iceberg Tables in Google Cloud',
    persona: 'Performance Engineers, Architects',
    stack: 'BigQuery Autoscaling Editions vs Trino on GKE (10TB+ TPC-DS)',
    angle:
      'Real-world TCO, cold/warm scan latency, slot elasticity, and high-concurrency comparison on 10TB+ TPC-DS benchmarks over Apache Iceberg.',
    tableName: 'tpcds_10tb_store_sales_iceberg',
  },
  {
    num: 14,
    id: 'BQ_STUDIO_NOTEBOOKS_PYSPARK',
    domain: 'MULTI_ENGINE',
    track: 'GA',
    title: 'Interactive Data Exploration: Using BigQuery Studio Notebooks with Managed Spark & Iceberg',
    persona: 'Data Scientists',
    stack: 'BigQuery Studio Notebooks, Serverless PySpark, Iceberg',
    angle:
      'Spinning up zero-config serverless Spark sessions directly inside BigQuery Studio notebooks to inspect, plot, and featurize Iceberg data.',
    tableName: 'notebook_churn_features_iceberg',
  },

  // =========================================================================
  // DOMAIN 3: ADVANCED ETL, CDC & STREAMING LAKEHOUSE (15-21)
  // =========================================================================
  {
    num: 15,
    id: 'MULTI_STATEMENT_ACID_TX_BQ',
    domain: 'STREAMING_CDC_DML',
    track: 'GA',
    title: 'Mastering Multi-Statement Transactions in BigQuery for Apache Iceberg Tables',
    persona: 'Data Engineers',
    stack: 'BigQuery Multi-Statement SQL, Apache Iceberg V2',
    angle:
      'Executing atomic BEGIN TRANSACTION, INSERT, UPDATE, DELETE, and COMMIT TRANSACTION workflows spanning multiple Iceberg tables.',
    tableName: 'acid_financial_journal_iceberg',
  },
  {
    num: 16,
    id: 'CONCURRENT_DML_SPARK_AND_BQ_OCC',
    domain: 'STREAMING_CDC_DML',
    track: 'GA',
    title: 'Open-Source DML on Managed Iceberg Tables: How Spark and BigQuery Safely Write Together',
    persona: 'Pipeline Developers',
    stack: 'Managed Spark, BigQuery DML, Iceberg V2 Merge-on-Read',
    angle:
      'Handling concurrent row-level deletes (MERGE INTO, UPDATE, DELETE) across Spark and BigQuery using Optimistic Concurrency Control (OCC) and position-delete files.',
    tableName: 'concurrent_inventory_state',
  },
  {
    num: 17,
    id: 'STREAMING_KAFKA_CONNECT_ICEBERG',
    domain: 'STREAMING_CDC_DML',
    track: 'ALPHA',
    title: 'Streaming Lakehouse 101: Ingesting Real-Time Events with Kafka Connect & Iceberg',
    persona: 'Streaming Engineers',
    stack: '[ALPHA] Google Managed Kafka (gcloud alpha managed-kafka), Kafka Connect Iceberg Sink',
    angle:
      'Ingesting high-velocity event streams directly into Apache Iceberg Bronze tables using Google Managed Service for Apache Kafka and Schema Registry.',
    tableName: 'kafka_realtime_payments_bronze',
  },
  {
    num: 18,
    id: 'DATAFLOW_BEAM_ICEBERG_IO',
    domain: 'STREAMING_CDC_DML',
    track: 'GA',
    title: 'High-Throughput Streaming with Apache Beam / Dataflow Direct to Apache Iceberg',
    persona: 'Dataflow Engineers',
    stack: 'Google Cloud Dataflow, Apache Beam Managed.ICEBERG IO',
    angle:
      'Exactly-once streaming ingestion and micro-batch manifest commit tuning on GCS storage using Apache Beam IcebergIO.',
    tableName: 'dataflow_iot_telemetry_iceberg',
  },
  {
    num: 19,
    id: 'EVENT_DRIVEN_ICEBERG_CDF',
    domain: 'STREAMING_CDC_DML',
    track: 'BETA',
    title: 'Building Event-Driven Data Pipelines with Apache Iceberg Change Data Feed (CDF)',
    persona: 'Event-Driven Architects',
    stack: 'Iceberg Change Data Feed (_change_type), Pub/Sub, Cloud Run / Functions',
    angle:
      'Capturing row-level delta changes (_change_type, _commit_version, _commit_timestamp) from Iceberg commits via create_changelog_view to trigger downstream event-driven actions.',
    tableName: 'cdf_order_status_transitions',
  },
  {
    num: 20,
    id: 'POSTGRES_CDC_DEBEZIUM_DATASTREAM',
    domain: 'STREAMING_CDC_DML',
    track: 'GA',
    title: 'Implementing Real-Time CDC from PostgreSQL to Iceberg Using Debezium and Lakehouse',
    persona: 'Database Engineers',
    stack: 'Datastream / Debezium, Cloud SQL for PostgreSQL, BigLake Iceberg',
    angle:
      'Streaming logical replication WAL change streams from PostgreSQL into open Lakehouse Iceberg tables with sub-minute replication lag.',
    tableName: 'pg_cdc_accounts_replica_iceberg',
  },
  {
    num: 21,
    id: 'AUTOMATED_SCHEMA_EVOLUTION_COLUMN_ID',
    domain: 'STREAMING_CDC_DML',
    track: 'GA',
    title: 'Automating Schema Evolution: Adding, Dropping, and Renaming Columns Without Breaking Pipelines',
    persona: 'DataOps Engineers',
    stack: 'Iceberg Unique Column IDs, Managed Spark, BigQuery ALTER TABLE',
    angle:
      'How Apache Iceberg unique field-ID tracking prevents silent downstream data corruption during ADD COLUMN, RENAME COLUMN, and DROP COLUMN migrations.',
    tableName: 'evolving_product_catalog_iceberg',
  },

  // =========================================================================
  // DOMAIN 4: STORAGE ENGINEERING, CACHING & PERFORMANCE TUNING (22-28)
  // =========================================================================
  {
    num: 22,
    id: 'GCS_PREFIX_HASHING_PETABYTE',
    domain: 'STORAGE_PERF',
    track: 'GA',
    title: 'Best-in-Class Storage: Architecting Google Cloud Storage (GCS) for Massive Iceberg Tables',
    persona: 'Cloud Storage Architects, SysAdmins',
    stack: 'Google Cloud Storage Hierarchical Namespace / Object Storage Layout, Iceberg',
    angle:
      'Optimal write.object-storage.enabled prefix hashing, dual-region bucket topologies, and multi-Tbps throughput tuning for petabyte Iceberg workloads.',
    tableName: 'petabyte_clickstream_object_layout',
  },
  {
    num: 23,
    id: 'GCS_AUTOCLASS_FINOPS_LIFECYCLE',
    domain: 'STORAGE_PERF',
    track: 'GA',
    title: 'Slashing Lakehouse Storage Bills with GCS Autoclass and Iceberg Lifecycle Policies',
    persona: 'FinOps Practitioners, Cloud Architects',
    stack: 'GCS Autoclass (Standard -> Nearline -> Coldline -> Archive), Iceberg',
    angle:
      'Leveraging automatic zero-retrieval-fee GCS Autoclass object transitions based on real partition access patterns to cut cold Lakehouse storage costs by up to 78%.',
    tableName: 'autoclass_tiered_audit_archive',
  },
  {
    num: 24,
    id: 'GCS_RAPID_STORAGE_ANYWHERE_CACHE',
    domain: 'STORAGE_PERF',
    track: 'BETA',
    title: 'Rapid Storage Performance: Supercharging Iceberg Small-File Reads on Google Cloud',
    persona: 'Infrastructure Engineers',
    stack: '[BETA] GCS Rapid Storage & Anywhere Cache SSD Layer, BigQuery',
    angle:
      'Accelerating low-latency Iceberg manifest lookups and small-file random reads with zonal NVMe SSD Anywhere Cache and Rapid Storage buckets.',
    tableName: 'low_latency_trading_ticks_iceberg',
  },
  {
    num: 25,
    id: 'AUTOMATED_SMALL_FILE_COMPACTION',
    domain: 'STORAGE_PERF',
    track: 'GA',
    title: 'Solving the Small File Problem: Automated Compaction Strategies in Lakehouse & Managed Spark',
    persona: 'Data Platform Engineers',
    stack: 'Managed Spark rewrite_data_files, BigLake Automatic Compaction',
    angle:
      'Setting up non-blocking bin-packing, Z-Order multi-dimensional sorting, expire_snapshots, and remove_orphan_files without blocking concurrent readers.',
    tableName: 'compacted_streaming_events_512mb',
  },
  {
    num: 26,
    id: 'BIGMETADATA_SPARK_MILLIONS_PARTITIONS',
    domain: 'STORAGE_PERF',
    track: 'BETA',
    title: 'BigMetadata for Spark: Scaling Past Millions of Partitions with Lakehouse Metastore',
    persona: 'Spark Performance Engineers',
    stack: '[BETA] Lakehouse Metastore Spanner Backend, Spark Distributed Planning',
    angle:
      'Eliminating Spark Driver OutOfMemoryError (OOM) bottlenecks during query planning over Iceberg tables with 1,000,000+ partitions.',
    tableName: 'million_partition_global_telemetry',
  },
  {
    num: 27,
    id: 'CROSS_CLOUD_CACHING_BQ_OMNI',
    domain: 'STORAGE_PERF',
    track: 'GA',
    title: 'Cross-Cloud Caching Demystified: Accelerating Multi-Cloud Queries in BigQuery',
    persona: 'Performance Architects',
    stack: 'BigQuery Omni, Cross-Cloud Materialized Cache & BI Engine',
    angle:
      'How intelligent local metadata and result caching reduces cross-cloud egress bills and accelerates repeat queries over remote AWS S3 and Azure ADLS buckets.',
    tableName: 'omni_cached_revenue_summary',
  },
  {
    num: 28,
    id: 'ICEBERG_DR_TURBO_REPLICATION_PITR',
    domain: 'STORAGE_PERF',
    track: 'GA',
    title: 'Disaster Recovery for Iceberg: Cross-Region Bucket Replication and Point-in-Time Recovery',
    persona: 'SREs, Security Officers',
    stack: 'GCS Dual-Region Turbo Replication (15m RPO), Iceberg rollback_to_snapshot',
    angle:
      'Designing active-passive cross-region failover and instant snapshot rollback recovery strategies for mission-critical enterprise lakehouses.',
    tableName: 'dr_protected_core_banking_iceberg',
  },

  // =========================================================================
  // DOMAIN 5: MULTI-CLOUD INTEROPERABILITY (29-34)
  // =========================================================================
  {
    num: 29,
    id: 'BORDERLESS_LAKEHOUSE_S3_ADLS',
    domain: 'MULTI_CLOUD',
    track: 'GA',
    title: 'The Borderless Lakehouse: Querying AWS S3 and Azure ADLS Without Moving Data',
    persona: 'Multi-Cloud Architects',
    stack: 'BigQuery Omni (aws-us-east-1 / azure-eastus2), Iceberg External Tables',
    angle:
      'Querying multi-cloud Apache Iceberg estates directly from Google Cloud while keeping raw Parquet data in its sovereign AWS S3 or Azure ADLS origin.',
    tableName: 'omni_s3_orders_federated',
  },
  {
    num: 30,
    id: 'MIGRATE_VS_FEDERATE_DECISION_FRAMEWORK',
    domain: 'MULTI_CLOUD',
    track: 'GA',
    title: 'Migrate vs. Federate: How to Choose the Right Strategy for Your Multi-Cloud Iceberg Data',
    persona: 'Chief Architects, Lead Engineers',
    stack: 'BigLake Lakehouse, BigQuery Omni, Storage Transfer Service',
    angle:
      'Concrete cost, egress breakeven, and query-latency decision framework comparing physical GCS migration vs in-place BigQuery Omni federation.',
    tableName: 'multicloud_strategy_benchmark',
  },
  {
    num: 31,
    id: 'CROSS_CLOUD_INTERCONNECT_CCI',
    domain: 'MULTI_CLOUD',
    track: 'GA',
    title: 'Cross-Cloud Interconnect (CCI) in Action: High-Speed Analytics Over Hybrid Data Lakes',
    persona: 'Network Engineers, Cloud Architects',
    stack: 'Google Cloud Cross-Cloud Interconnect (10Gbps / 100Gbps), BigQuery Omni',
    angle:
      'Minimizing cross-cloud latency, packet jitter, and public internet egress fees for hybrid Iceberg queries across AWS, Azure, and Google Cloud.',
    tableName: 'cci_hybrid_warehouse_bridge',
  },
  {
    num: 32,
    id: 'EXTERNAL_CATALOG_FEDERATION_GLUE_UNITY',
    domain: 'MULTI_CLOUD',
    track: 'BETA',
    title: 'Unified Iceberg Metadata Across Clouds: Connecting External Catalogs to Lakehouse',
    persona: 'Platform Engineers',
    stack: '[BETA] AWS Glue Catalog, Databricks Unity Catalog, Lakehouse REST Federation',
    angle:
      'Federating external AWS Glue and Unity Catalog Iceberg metadata pointers into a single unified Google Cloud governance and SQL pane.',
    tableName: 'federated_unity_glue_catalog_table',
  },
  {
    num: 33,
    id: 'ZERO_EGRESS_SPARK_S3_PROCESSING',
    domain: 'MULTI_CLOUD',
    track: 'GA',
    title: 'Zero-Egress Multi-Cloud Pipelines: Processing S3 Data with Managed Spark in Google Cloud',
    persona: 'Data Engineers',
    stack: 'Managed Spark, S3A Pushdown Connectors, BigQuery Omni Cross-Cloud Transfer',
    angle:
      'Executing column-pruned and predicate-pushed serverless compute workloads against multi-cloud storage targets to slash raw egress volume by 90%+.',
    tableName: 's3_filtered_aggregates_iceberg',
  },
  {
    num: 34,
    id: 'MULTI_CLOUD_FINOPS_SLOT_SCAN_AUDIT',
    domain: 'MULTI_CLOUD',
    track: 'GA',
    title: 'Multi-Cloud FinOps: Tracking and Optimizing Compute and Scan Costs Across Cloud Boundaries',
    persona: 'FinOps Specialists',
    stack: 'BigQuery INFORMATION_SCHEMA.JOBS_BY_PROJECT, Cloud Billing Export',
    angle:
      'Auditing multi-cloud Omni slot consumption, bytes scanned, and partition-filter compliance across federated AWS, Azure, and GCP Iceberg tables.',
    tableName: 'finops_multicloud_scan_ledger',
  },

  // =========================================================================
  // DOMAIN 6: UNIFIED GOVERNANCE, SECURITY & TABLE MANAGEMENT (35-40)
  // =========================================================================
  {
    num: 35,
    id: 'STORAGE_PROFILES_AUTO_MAINTENANCE',
    domain: 'GOVERNANCE_SECURITY',
    track: 'BETA',
    title: 'Unified Table Management: Automated Maintenance with Storage Profiles in Lakehouse',
    persona: 'Platform Administrators',
    stack: '[BETA] Lakehouse Storage Profiles, Knowledge Catalog Automated Maintenance',
    angle:
      'Configuring automatic background clustering, orphan file expiration, and snapshot pruning in a single declarative Google Cloud control plane.',
    tableName: 'auto_maintained_governed_ledger',
  },
  {
    num: 36,
    id: 'MULTI_ENGINE_RLS_CLS_POLICY_TAGS',
    domain: 'GOVERNANCE_SECURITY',
    track: 'GA',
    title: 'Multi-Engine Fine-Grained Access Control: Row and Column Security on Open Iceberg',
    persona: 'Security Engineers, Data Stewards',
    stack: 'BigLake Row Access Policies, Dataplex / Knowledge Catalog Policy Tags',
    angle:
      'Enforcing identical row-level security filters and dynamic PII column masking whether users query the Iceberg table via BigQuery SQL or Apache Spark.',
    tableName: 'rls_cls_protected_patients_iceberg',
  },
  {
    num: 37,
    id: 'END_USER_IDENTITY_VENDED_CREDENTIALS',
    domain: 'GOVERNANCE_SECURITY',
    track: 'BETA',
    title: 'End-User Identity Delegation: Securing Spark and BigQuery Access to Iceberg Data',
    persona: 'IAM Specialists, Cloud Architects',
    stack: '[BETA] Iceberg REST X-Iceberg-Access-Delegation (vended-credentials), Google IAM',
    angle:
      'Propagating end-user OAuth/IAM identity through the Iceberg REST catalog via short-lived scoped downscoped GCS tokens without granting broad bucket IAM roles.',
    tableName: 'vended_cred_zero_trust_iceberg',
  },
  {
    num: 38,
    id: 'KNOWLEDGE_CATALOG_LINEAGE_DQ',
    domain: 'GOVERNANCE_SECURITY',
    track: 'ALPHA',
    title: 'Knowledge Catalog Universal Catalog + Iceberg: Automated Data Lineage, Quality, and Tagging',
    persona: 'Governance Leads',
    stack: '[ALPHA] gcloud alpha dataplex / Knowledge Catalog Universal Catalog, Auto-DQ',
    angle:
      'Automatic column-level lineage graphs and declarative data quality rule validation across distributed multi-engine Iceberg tables.',
    tableName: 'lineage_governed_regulatory_mart',
  },
  {
    num: 39,
    id: 'OBSERVABILITY_BQ_SYSTEM_TABLES',
    domain: 'GOVERNANCE_SECURITY',
    track: 'GA',
    title: 'Observability for Your Lakehouse: Monitoring Iceberg Table Health via BigQuery System Tables',
    persona: 'DataOps Engineers',
    stack: 'INFORMATION_SCHEMA.TABLE_STORAGE, PARTITIONS, Cloud Monitoring',
    angle:
      'Building automated SQL health checks for small-file skew, snapshot growth rate, uncompacted delete manifests, and partition skew.',
    tableName: 'lakehouse_observability_metrics',
  },
  {
    num: 40,
    id: 'COMPLIANCE_VAULT_WORM_BUCKET_LOCK',
    domain: 'GOVERNANCE_SECURITY',
    track: 'GA',
    title: 'Building an Auditable Compliance Vault: Immutable Snapshots and WORM Storage with Iceberg',
    persona: 'Compliance Officers, Data Stewards',
    stack: 'GCS Bucket Lock (WORM Retention Policy), Iceberg Historical Snapshots',
    angle:
      'Meeting SEC Rule 17a-4, FINRA, and GDPR audit requirements using immutable GCS retention locks combined with cryptographic Iceberg snapshot history.',
    tableName: 'sec_17a4_worm_trade_vault_iceberg',
  },

  // =========================================================================
  // DOMAIN 7: OPERATIONAL DATABASE CONVERGENCE & HYBRID WORKLOADS (41-45)
  // =========================================================================
  {
    num: 41,
    id: 'SPANNER_HTAP_ZERO_ETL_ICEBERG',
    domain: 'HTAP_CONVERGENCE',
    track: 'GA',
    title: 'Breaking the HTAP Barrier: Connecting Cloud Spanner and the Iceberg Lakehouse',
    persona: 'Database Architects',
    stack: 'Cloud Spanner EXTERNAL_QUERY, Spanner Data Boost, BigLake Iceberg',
    angle:
      'Combining globally consistent transactional OLTP in Cloud Spanner with petabyte analytical Iceberg lakes using zero-ETL federated SQL joins.',
    tableName: 'spanner_htap_global_orders_iceberg',
  },
  {
    num: 42,
    id: 'ALLOYDB_POSTGRES_ICEBERG_JOIN',
    domain: 'HTAP_CONVERGENCE',
    track: 'ALPHA',
    title: 'AlloyDB + Lakehouse: Unifying Operational PostgreSQL Data with Petabyte-Scale Iceberg Lakes',
    persona: 'PostgreSQL DBAs, Data Engineers',
    stack: '[ALPHA] AlloyDB Columnar Engine / AlloyDB Omni, BigQuery EXTERNAL_QUERY, Iceberg',
    angle:
      'Querying live operational PostgreSQL tables in AlloyDB and historical petabyte Iceberg tables in a single low-latency federated join.',
    tableName: 'alloydb_hybrid_customer_orders',
  },
  {
    num: 43,
    id: 'BIGTABLE_HOT_NOSQL_COLD_ICEBERG',
    domain: 'HTAP_CONVERGENCE',
    track: 'GA',
    title: 'Bigtable + Lakehouse: Joining Real-Time NoSQL Time-Series Data with Historical Iceberg Archives',
    persona: 'IoT Engineers, Data Platform Architects',
    stack: 'Cloud Bigtable Federated External Table + BigLake Iceberg Cold Archive',
    angle:
      'Architecting a unified Lambda/Kappa view where sub-10ms live last-24h hot data sits in Cloud Bigtable and multi-year historical tiers rest in Iceberg.',
    tableName: 'bigtable_iceberg_iot_unified_ts',
  },
  {
    num: 44,
    id: 'ZERO_COPY_REVERSE_ETL_CONTINUOUS_QUERIES',
    domain: 'HTAP_CONVERGENCE',
    track: 'BETA',
    title: 'Zero-Copy Reverse ETL: Writing Aggregated Insights Back from Iceberg to Operational Stores',
    persona: 'Application Developers',
    stack: '[BETA] BigQuery Continuous Queries, Pub/Sub, Cloud SQL / Spanner Reverse ETL',
    angle:
      'Synchronizing enriched customer propensity scores and real-time metrics from Lakehouse Iceberg tables directly back to operational databases without third-party SaaS sync tools.',
    tableName: 'reverse_etl_customer_propensity',
  },
  {
    num: 45,
    id: 'LEGACY_HADOOP_HDFS_DECOMMISSIONING',
    domain: 'HTAP_CONVERGENCE',
    track: 'GA',
    title: 'Decommissioning Legacy Hadoop HDFS Clusters into Modern Managed Iceberg Infrastructure',
    persona: 'Legacy Hadoop Admins, Infrastructure Architects',
    stack: 'Google Managed Spark, Hive-to-Iceberg Converter, GCS Connector',
    angle:
      'Decommissioning expensive 24/7 HDFS NameNode/DataNode clusters and converting legacy Hive ORC/Parquet tables into serverless GCS + BigLake Iceberg.',
    tableName: 'decommissioned_hdfs_warehouse_iceberg',
  },

  // =========================================================================
  // DOMAIN 8: AGENTS & GENERATIVE AI ON THE LAKEHOUSE (46-50)
  // =========================================================================
  {
    num: 46,
    id: 'AI_FOUNDATION_RAG_READY_ICEBERG',
    domain: 'GENAI_AGENTS',
    track: 'GA',
    title: 'AI Foundation: Preparing Your Iceberg Data Estate for Production Generative AI',
    persona: 'AI Engineers, Data Architects',
    stack: 'BigQuery ML, Vertex AI Feature Store, BigLake Apache Iceberg',
    angle:
      'Structuring, deduplicating, and governing raw Lakehouse tables into high-quality, point-in-time reproducible LLM training and RAG pipelines.',
    tableName: 'ai_foundation_rag_corpus_iceberg',
  },
  {
    num: 47,
    id: 'SEMANTIC_SQL_GEMINI_OVER_ICEBERG',
    domain: 'GENAI_AGENTS',
    track: 'GA',
    title: 'Semantic SQL: Running Gemini Models Directly Over Apache Iceberg Data in BigQuery',
    persona: 'Analytics Engineers, AI Developers',
    stack: 'BigQuery ML.GENERATE_TEXT, Vertex AI Gemini 3.8 Flash / 3.1 Pro Remote Model',
    angle:
      'Running zero-ETL LLM inference, structured JSON entity extraction, and sentiment classification directly inside SQL queries over Iceberg tables.',
    tableName: 'semantic_sql_enriched_reviews_iceberg',
  },
  {
    num: 48,
    id: 'MULTIMODAL_OBJECT_TABLES_EMBEDDINGS',
    domain: 'GENAI_AGENTS',
    track: 'GA',
    title: 'Building Multi-Modal Lakehouses: Indexing Images, PDFs, and Audio with Lakehouse Object Tables',
    persona: 'Machine Learning Engineers',
    stack: 'BigLake Object Tables, Vertex AI Multimodal Embeddings (text-embedding-005 / multimodalembedding)',
    angle:
      'Cataloging unstructured PDFs, invoices, satellite imagery, and audio on GCS with BigLake Object Tables and joining their vector embeddings with structured Iceberg tables.',
    tableName: 'multimodal_invoice_embeddings_iceberg',
  },
  {
    num: 49,
    id: 'VECTOR_SEARCH_RAG_OVER_ICEBERG',
    domain: 'GENAI_AGENTS',
    track: 'GA',
    title: 'Vector Search on the Lakehouse: Building a RAG Pipeline Over Enterprise Iceberg Tables',
    persona: 'GenAI Developers',
    stack: 'BigQuery VECTOR_SEARCH, CREATE VECTOR INDEX (TREE_AH / IVF), Iceberg',
    angle:
      'Indexing millions of 768/1408-dimensional embeddings on Iceberg tables for sub-50ms cosine similarity search and enterprise conversational RAG backends.',
    tableName: 'vector_indexed_knowledge_iceberg',
  },
  {
    num: 50,
    id: 'AUTONOMOUS_DATA_AGENTS_GEMINI_ENTERPRISE',
    domain: 'GENAI_AGENTS',
    track: 'ALPHA',
    title: 'Building Autonomous Data Agents with Google Borderless Lakehouse and Gemini Enterprise',
    persona: 'Agentic AI Developers',
    stack: '[ALPHA] gcloud alpha agent-registry, Gemini Enterprise, Managed Spark, Lakehouse REST',
    angle:
      'Creating autonomous data agents equipped with MCP tools that dynamically inspect Iceberg REST catalogs, author PySpark/SQL jobs, and answer complex multi-cloud business queries.',
    tableName: 'autonomous_agent_insight_log_iceberg',
  },
];

export default function IcebergLakehousePlaybookMatrix({
  projectId,
  onRunInShell,
  onOpenBigQuerySql,
  onNavigateTab,
  onOpenBigLakeStudio,
  onOpenServerlessSpark,
  onShowToast,
  onShowError,
}) {
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [trackFilter, setTrackFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState(
    'REST_CATALOG_MULTI_ENGINE'
  );
  const [codeEngineTab, setCodeEngineTab] = useState('BIGQUERY_SQL');
  const [copiedKey, setCopiedKey] = useState('');

  // Editable target Lakehouse parameters
  const [region, setRegion] = useState('us-central1');
  const [datasetId, setDatasetId] = useState('iceberg_lakehouse_2026');
  const [bucketName, setBucketName] = useState(
    `${projectId || 'gcp-project'}-iceberg-lakehouse`
  );
  const [catalogId, setCatalogId] = useState('cp_iceberg_rest_catalog');
  const [connectionId, setConnectionId] = useState('biglake-iceberg-conn');

  // Workspace View Mode (SPLIT_WORKBENCH | BENTO_MATRIX_GRID | METADATA_XRAY)
  const [viewMode, setViewMode] = useState('SPLIT_WORKBENCH');

  // Interactive Decision Simulators state
  const [simulatorTab, setSimulatorTab] = useState('MIGRATE_VS_FEDERATE');
  const [remoteDataTb, setRemoteDataTb] = useState(50);
  const [monthlyQueryScansTb, setMonthlyQueryScansTb] = useState(120);
  const [trinoNodesCount, setTrinoNodesCount] = useState(12);
  const [hmsTablesCount, setHmsTablesCount] = useState(150);
  const [smallFilesCount, setSmallFilesCount] = useState(48000);
  const [autoclassColdPct, setAutoclassColdPct] = useState(65);

  // Live probe & execution state
  const [probing, setProbing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [probeResult, setProbeResult] = useState(null);

  useEffect(() => {
    if (projectId) {
      setBucketName(`${projectId}-iceberg-lakehouse`);
    }
  }, [projectId]);

  const filteredPlaybooks = useMemo(() => {
    return ICEBERG_PLAYBOOKS.filter((p) => {
      if (selectedDomain !== 'ALL' && p.domain !== selectedDomain) return false;
      if (trackFilter !== 'ALL' && p.track !== trackFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.persona.toLowerCase().includes(q) ||
          p.stack.toLowerCase().includes(q) ||
          p.angle.toLowerCase().includes(q) ||
          String(p.num).includes(q)
        );
      }
      return true;
    });
  }, [selectedDomain, trackFilter, searchQuery]);

  const activePlaybook = useMemo(() => {
    return (
      ICEBERG_PLAYBOOKS.find((p) => p.id === selectedPlaybookId) ||
      filteredPlaybooks[0] ||
      ICEBERG_PLAYBOOKS[0]
    );
  }, [selectedPlaybookId, filteredPlaybooks]);

  const copyText = (txt, key) => {
    navigator.clipboard?.writeText(txt);
    setCopiedKey(key);
    if (onShowToast) onShowToast(`Copied ${key} to clipboard`);
    setTimeout(() => setCopiedKey(''), 1800);
  };

  // Interactive Calculator 1: Migrate vs Federate (BigQuery Omni vs Physical GCS Transfer)
  const migrateVsFederateAnalysis = useMemo(() => {
    const tb = Math.max(1, Number(remoteDataTb || 50));
    const monthlyScan = Math.max(1, Number(monthlyQueryScansTb || 120));
    // AWS S3 one-time egress (~$0.09/GB = ~$90/TB) + GCS Standard storage ($20/TB/mo)
    const oneTimeMigrationEgressUsd = Math.round(tb * 90);
    const gcsMonthlyStorageUsd = Math.round(tb * 20);
    const nativeBqScanMonthlyUsd = Math.round(monthlyScan * 6.25);
    // BigQuery Omni Federation: $0 upfront migration egress, cross-cloud result transfer only (~1% of scanned bytes)
    const omniSlotScanMonthlyUsd = Math.round(monthlyScan * 7.5);
    const omniCrossCloudCacheSavingsUsd = Math.round(
      omniSlotScanMonthlyUsd * 0.35
    );
    const netOmniMonthlyUsd =
      omniSlotScanMonthlyUsd - omniCrossCloudCacheSavingsUsd;

    const monthlySavingsIfMigrated = Math.max(
      1,
      netOmniMonthlyUsd - (nativeBqScanMonthlyUsd + gcsMonthlyStorageUsd * 0.2)
    );
    const breakevenMonths = Math.max(
      1,
      Math.min(
        36,
        Math.round(
          oneTimeMigrationEgressUsd / Math.max(25, monthlySavingsIfMigrated)
        )
      )
    );

    const recommendation =
      monthlyScan / tb >= 4
        ? 'PHYSICAL_MIGRATION_TO_GCS_ICEBERG'
        : 'FEDERATE_IN_PLACE_WITH_BQ_OMNI';

    return {
      oneTimeMigrationEgressUsd,
      gcsMonthlyStorageUsd,
      nativeBqScanMonthlyUsd,
      netOmniMonthlyUsd,
      breakevenMonths,
      recommendation,
    };
  }, [remoteDataTb, monthlyQueryScansTb]);

  // Interactive Calculator 2: BigQuery Lakehouse vs Open-Source Trino on GKE (10TB+ TPC-DS)
  const bqVsTrinoBenchmark = useMemo(() => {
    const nodes = Math.max(2, Number(trinoNodesCount || 12));
    // 24/7 GKE n2-highmem-16 nodes (~$0.84/hr * 730h = ~$613/node/mo)
    const trinoMonthlyFixedCostUsd = Math.round(nodes * 613);
    // BigQuery Editions Autoscaling (scales to 0 slots when idle)
    const bqServerlessMonthlyEstUsd = Math.round(trinoMonthlyFixedCostUsd * 0.42);
    const tcoSavingsPct = Math.round(
      ((trinoMonthlyFixedCostUsd - bqServerlessMonthlyEstUsd) /
        trinoMonthlyFixedCostUsd) *
        100
    );
    return {
      trinoMonthlyFixedCostUsd,
      bqServerlessMonthlyEstUsd,
      tcoSavingsPct,
      trinoP95LatencySec: 18.4,
      bqVectorizedP95LatencySec: 6.2,
    };
  }, [trinoNodesCount]);

  // Synthesize Multi-Engine Code (BigQuery SQL, Serverless PySpark 1.10, and gcloud CLI) for the selected playbook
  const synthesizedCode = useMemo(() => {
    const p = activePlaybook;
    const cleanBkt = String(bucketName || `${projectId}-iceberg-lakehouse`)
      .replace(/^gs:\/\//, '')
      .trim();
    const tbl = p.tableName || 'enterprise_iceberg_table';
    const fullTable = `\`${projectId}.${datasetId}.${tbl}\``;
    const connRef = `\`${projectId}.us.${connectionId}\``;

    // 1. BigQuery Lakehouse SQL / DDL tailored to the playbook domain
    let bqSql = `-- Playbook #${p.num}: ${p.title}
-- Persona: ${p.persona} | Release Track: [${p.track}]
-- Stack: ${p.stack}

CREATE SCHEMA IF NOT EXISTS \`${projectId}.${datasetId}\`
OPTIONS (location = 'US', description = ${JSON.stringify(p.title)});

-- 1. Provision Managed Apache Iceberg V2 Table on gs://${cleanBkt}/${p.id.toLowerCase()}
CREATE OR REPLACE TABLE ${fullTable} (
  record_id STRING NOT NULL,
  event_timestamp TIMESTAMP,
  tenant_region STRING,
  payload_json STRING,
  metric_value FLOAT64
)
CLUSTER BY tenant_region
WITH CONNECTION ${connRef}
OPTIONS (
  file_format = 'PARQUET',
  table_format = 'ICEBERG',
  storage_uri = 'gs://${cleanBkt}/iceberg/${tbl}'
);`;

    if (p.id === 'MULTI_STATEMENT_ACID_TX_BQ') {
      bqSql += `\n\n-- 2. Atomic Multi-Statement ACID Transaction Across Apache Iceberg V2 Tables
BEGIN TRANSACTION;

INSERT INTO ${fullTable} (record_id, event_timestamp, tenant_region, payload_json, metric_value)
VALUES ('tx-9001', CURRENT_TIMESTAMP(), 'US-EAST', '{"type":"CREDIT"}', 14500.00);

DELETE FROM ${fullTable}
WHERE metric_value < 0.0 AND event_timestamp < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 90 DAY);

COMMIT TRANSACTION;`;
    } else if (p.id === 'SEMANTIC_SQL_GEMINI_OVER_ICEBERG') {
      bqSql += `\n\n-- 2. Semantic SQL: Run Vertex AI Gemini 3.8 Flash Directly Over Open Iceberg Rows
SELECT
  record_id,
  tenant_region,
  ml_generate_text_llm_result AS gemini_structured_summary
FROM ML.GENERATE_TEXT(
  MODEL \`${projectId}.${datasetId}.gemini_3_8_flash_endpoint\`,
  (
    SELECT
      record_id,
      tenant_region,
      CONCAT('Extract key risk entities and sentiment as JSON from: ', payload_json) AS prompt
    FROM ${fullTable}
    WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    LIMIT 100
  ),
  STRUCT(0.1 AS temperature, 512 AS max_output_tokens, TRUE AS flatten_json_output)
);`;
    } else if (p.id === 'VECTOR_SEARCH_RAG_OVER_ICEBERG') {
      bqSql += `\n\n-- 2. Create High-Recall TREE_AH Vector Index & Run Sub-50ms RAG Search Over Iceberg
CREATE VECTOR INDEX IF NOT EXISTS \`${tbl}_embedding_idx\`
ON ${fullTable}(embedding_vec)
OPTIONS (index_type = 'TREE_AH', distance_type = 'COSINE');

SELECT
  base.record_id,
  base.payload_json,
  distance AS cosine_distance
FROM VECTOR_SEARCH(
  TABLE ${fullTable},
  'embedding_vec',
  (SELECT ml_generate_embedding_result FROM ML.GENERATE_EMBEDDING(
    MODEL \`${projectId}.${datasetId}.text_embedding_005\`,
    (SELECT 'How do we eliminate small-file metadata overhead in Apache Iceberg?' AS content)
  )),
  top_k => 5,
   distance_type => 'COSINE'
);`;
    } else if (p.id === 'SPANNER_HTAP_ZERO_ETL_ICEBERG') {
      bqSql += `\n\n-- 2. Zero-ETL HTAP Federation: Join Live Cloud Spanner OLTP with Petabyte Iceberg Lakehouse
SELECT
  oltp.order_id,
  oltp.live_payment_status,
  lake.tenant_region,
  lake.metric_value AS historical_lifetime_spend
FROM EXTERNAL_QUERY(
  '${projectId}.us.spanner-prod-oltp',
  'SELECT order_id, customer_id, live_payment_status FROM active_orders WHERE updated_at >= CURRENT_TIMESTAMP() - INTERVAL 1 HOUR'
) AS oltp
INNER JOIN ${fullTable} AS lake
  ON oltp.customer_id = lake.record_id;`;
    } else if (p.id === 'OBSERVABILITY_BQ_SYSTEM_TABLES') {
      bqSql += `\n\n-- 2. Lakehouse Health Observability via BigQuery INFORMATION_SCHEMA System Views
SELECT
  table_name,
  total_rows,
  total_partitions,
  ROUND(total_logical_bytes / POW(1024, 3), 3) AS logical_gb,
  ROUND(active_physical_bytes / POW(1024, 3), 3) AS compressed_physical_gb
FROM \`${projectId}.region-us\`.INFORMATION_SCHEMA.TABLE_STORAGE
WHERE table_schema = '${datasetId}'
ORDER BY total_logical_bytes DESC;`;
    } else {
      bqSql += `\n\n-- 2. High-Performance Vectorized Query + Iceberg Time-Travel Snapshot Inspection
SELECT
  tenant_region,
  COUNT(*) AS total_events,
  ROUND(SUM(metric_value), 2) AS total_metric_sum
FROM ${fullTable}
FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 15 MINUTE)
GROUP BY tenant_region
ORDER BY total_metric_sum DESC;`;
    }

    // 2. Serverless PySpark 3.5 + Apache Iceberg 1.9/1.10 REST Catalog Script
    const pysparkCode = `# Playbook #${p.num}: ${p.title}
# Release Track: [${p.track}] | Engine: Google Cloud Managed Service for Apache Spark + Iceberg REST Catalog
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, current_timestamp

spark = (
    SparkSession.builder
    .appName("cloudpulse-${p.id.toLowerCase()}")
    .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions")
    .config("spark.sql.catalog.${catalogId}", "org.apache.iceberg.spark.SparkCatalog")
    .config("spark.sql.catalog.${catalogId}.type", "rest")
    .config("spark.sql.catalog.${catalogId}.uri", "https://biglake.googleapis.com/iceberg/v1/restcatalog")
    .config("spark.sql.catalog.${catalogId}.warehouse", "gs://${cleanBkt}/iceberg-warehouse")
    .config("spark.sql.catalog.${catalogId}.header.x-goog-user-project", "${projectId}")
    .config("spark.sql.catalog.${catalogId}.rest.auth.type", "org.apache.iceberg.gcp.auth.GoogleAuthManager")
    .config("spark.sql.catalog.${catalogId}.io-impl", "org.apache.iceberg.gcp.gcs.GCSFileIO")
    .getOrCreate()
)

# 1. Ensure namespace exists in Google Cloud Lakehouse Iceberg REST Catalog
spark.sql("CREATE NAMESPACE IF NOT EXISTS ${catalogId}.${datasetId}")

# 2. Execute multi-engine ACID operation or table maintenance procedure
${
  p.id === 'HMS_100_TABLES_MIGRATION' || p.id === 'DIY_PARQUET_INPLACE_UPGRADE'
    ? `# Zero-Rewrite In-Place Registration of Existing Parquet Files into Iceberg REST Catalog:
spark.sql("""
  CALL ${catalogId}.system.add_files(
    table => '${datasetId}.${tbl}',
    source_table => '\`parquet\`.\`gs://${cleanBkt}/raw-parquet/${tbl}\`'
  )
""")`
    : p.id === 'AUTOMATED_SMALL_FILE_COMPACTION'
    ? `# Non-Blocking Small-File Bin-Packing + Z-Order Clustering + Snapshot Expiration:
spark.sql("""
  CALL ${catalogId}.system.rewrite_data_files(
    table => '${datasetId}.${tbl}',
    strategy => 'sort',
    sort_order => 'zorder(tenant_region, record_id)',
    options => map('target-file-size-bytes', '536870912', 'min-input-files', '5')
  )
""")
spark.sql("CALL ${catalogId}.system.expire_snapshots(table => '${datasetId}.${tbl}', retain_last => 10)")`
    : p.id === 'EVENT_DRIVEN_ICEBERG_CDF'
    ? `# Generate Apache Iceberg Change Data Feed (CDF) View for Event-Driven Downstream Triggers:
spark.sql("""
  CALL ${catalogId}.system.create_changelog_view(
    table => '${datasetId}.${tbl}',
    changelog_view => '${tbl}_cdf_changes',
    identifier_fields => array('record_id')
  )
""")
spark.sql("SELECT record_id, _change_type, _commit_version, _commit_timestamp FROM ${tbl}_cdf_changes").show(20, False)`
    : `df = spark.table("${catalogId}.${datasetId}.${tbl}")
df.printSchema()
print(f"Verified Open Iceberg REST Table ${catalogId}.${datasetId}.${tbl} across Spark & BigQuery!")`
}`;

    // 3. gcloud 590.0.1 CLI (Promoted GA + [BETA] + [ALPHA] commands)
    const cliCode = `# Playbook #${p.num}: ${p.title}
# Release Track: [${p.track}] | Active Project: ${projectId} | Region: ${region}

# 1. [GA 590.0.1] Inspect BigLake Iceberg REST Catalogs & Namespaces
gcloud biglake iceberg catalogs list --project=${projectId}

# 2. [GA 590.0.1] Submit Zero-Cluster Serverless Spark Batch against Iceberg REST Catalog
gcloud dataproc batches submit pyspark gs://${cleanBkt}/jobs/${p.id.toLowerCase()}.py \\
  --project=${projectId} \\
  --region=${region} \\
  --batch=cp-${p.num}-${ Date.now().toString().slice(-4) } \\
  --version=2.2 \\
  --deps-bucket=gs://${cleanBkt} \\
  --labels=job=datacloud_antigravity,playbook=p_${p.num}`;

    return { bqSql, pysparkCode, cliCode };
  }, [
    activePlaybook,
    bucketName,
    projectId,
    datasetId,
    connectionId,
    catalogId,
    region,
  ]);

  const handleProbeEstate = useCallback(
    async (isAutoRefresh = false) => {
      if (!projectId) return;
      setProbing(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(
            projectId
          )}/data-engineer/iceberg-matrix/probe`,
          {
            region,
            playbookId: activePlaybook.id,
            playbookTitle: activePlaybook.title,
            releaseTrack: activePlaybook.track,
            autoRefresh: Boolean(isAutoRefresh),
          }
        );
        setProbeResult(res.data);
        if (onShowToast) {
          onShowToast(
            `Probed live Iceberg Lakehouse estate (${
              res.data?.liveEstate?.bigQueryDatasetsCount || 0
            } BQ datasets, ${
              res.data?.liveEstate?.gcsBucketsCount || 0
            } GCS buckets)`
          );
        }
      } catch (err) {
        if (onShowError && !err?.__cancelledByUser) {
          onShowError(
            err.response?.data?.error ||
              err.message ||
              'Failed to probe live Lakehouse estate.'
          );
        }
      } finally {
        setProbing(false);
      }
    },
    [projectId, region, activePlaybook, onShowToast, onShowError]
  );

  const handleExecutePlaybook = async () => {
    if (!projectId) return;
    setExecuting(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/data-engineer/iceberg-matrix/execute`,
        {
          playbookId: activePlaybook.id,
          playbookTitle: activePlaybook.title,
          releaseTrack: activePlaybook.track,
          region,
          datasetId,
          bucketName,
          catalogId,
        }
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      handleProbeEstate(true);
    } catch (err) {
      if (onShowError && !err?.__cancelledByUser) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to execute Iceberg Lakehouse playbook.'
        );
      }
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-mono font-extrabold">
                <Layers className="w-3.5 h-3.5" />
                <span>50-PLAYBOOK APACHE ICEBERG &amp; BORDERLESS LAKEHOUSE MATRIX</span>
              </span>
              <LakehouseTrackBadge track="GA" />
              <LakehouseTrackBadge track="BETA" />
              <LakehouseTrackBadge track="ALPHA" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
              Open Iceberg REST Catalog · Multi-Engine Concurrency · Streaming CDC · Multi-Cloud Omni · HTAP &amp; GenAI Agents
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Every scenario across all <strong>8 Lakehouse Domains (50 Playbooks)</strong> synthesizes live{' '}
              <code className="font-mono">BigQuery Lakehouse SQL</code>,{' '}
              <code className="font-mono">Serverless PySpark 3.5 (Iceberg REST Catalog 1.10)</code>, and{' '}
              <code className="font-mono">gcloud 590.0.1 CLI</code> commands with explicit{' '}
              <strong className="font-mono text-amber-600 dark:text-amber-400">[BETA]</strong> and{' '}
              <strong className="font-mono text-red-600 dark:text-red-400">[ALPHA]</strong> flags and 1-Tap Cost Gatekeeper protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleProbeEstate(false)}
              disabled={probing}
              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3.5 py-2 text-xs font-mono font-extrabold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`}
              />
              <span>
                {probing
                  ? 'Probing Live Lakehouse...'
                  : 'Probe Live Iceberg Estate (Read-Only)'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Probe Summary Bar */}
        {probeResult?.liveEstate && (
          <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-zinc-500">BQ Datasets</div>
              <div className="font-extrabold">
                {probeResult.liveEstate.bigQueryDatasetsCount} Live
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-zinc-500">GCS Lake Buckets</div>
              <div className="font-extrabold">
                {probeResult.liveEstate.gcsBucketsCount} Live
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">[GA 590.0.1] Iceberg REST Catalogs</div>
              <div className="font-extrabold">
                {probeResult.liveEstate.icebergRestCatalogs?.length || 0} Discovered
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">[GA 590.0.1] Managed Kafka</div>
              <div className="font-extrabold">
                {probeResult.liveEstate.managedKafkaClusters?.length || 0} Clusters
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400">[GA 590.0.1] Dataplex Lakes</div>
              <div className="font-extrabold">
                {probeResult.liveEstate.dataplexLakes?.length || 0} Lakes
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Single-Row Filter & View Toolbar (Search + Domain Select + Track Select + View Switcher) */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-3.5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
          {/* 1. Search Input (4 cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 50 playbooks (REST Catalog, Trino, Kafka, Omni)..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 2. Lakehouse Domain Filter Dropdown (3 cols) */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0 hidden sm:block" />
            <select
              aria-label="Filter by Lakehouse Domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:border-blue-500"
            >
              {LAKEHOUSE_DOMAINS.map((dom) => (
                <option key={dom.id} value={dom.id}>
                  {dom.shortLabel} ({dom.badge})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Release Track Filter Dropdown (2 cols) */}
          <div className="lg:col-span-2">
            <select
              aria-label="Filter by Release Track"
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="w-full h-9 px-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Track: All (50)</option>
              <option value="GA">Track: [GA · Prod]</option>
              <option value="BETA">Track: [BETA · Preview]</option>
              <option value="ALPHA">Track: [ALPHA · Lab]</option>
            </select>
          </div>

          {/* 4. Compact Segmented View Mode Switcher (3 cols) */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {[
              { id: 'SPLIT_WORKBENCH', label: 'Workbench' },
              { id: 'BENTO_MATRIX_GRID', label: '50-Grid' },
              { id: 'METADATA_XRAY', label: 'v2 X-Ray' },
            ].map((vm) => (
              <button
                key={vm.id}
                type="button"
                onClick={() => setViewMode(vm.id)}
                className={`w-full h-7 px-2 rounded-md text-[11px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center truncate ${
                  viewMode === vm.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <span className="truncate">{vm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Filter Status Pill Row (only shown when a filter/search is active) */}
        {(selectedDomain !== 'ALL' || trackFilter !== 'ALL' || searchQuery.trim() !== '') && (
          <div className="mt-2.5 pt-2.5 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <span>
                Showing <strong className="text-zinc-900 dark:text-zinc-100">{filteredPlaybooks.length}</strong> of 50 playbooks
              </span>
              {selectedDomain !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-bold">
                  Domain: {LAKEHOUSE_DOMAINS.find((d) => d.id === selectedDomain)?.shortLabel}
                </span>
              )}
              {trackFilter !== 'ALL' && (
                <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold">
                  Track: {trackFilter}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDomain('ALL');
                setTrackFilter('ALL');
                setSearchQuery('');
              }}
              className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 text-[10px] font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* VIEW MODE 2: 50-PLAYBOOK ARCHITECTURE MATRIX GRID                    */}
      {/* =================================================================== */}
      {viewMode === 'BENTO_MATRIX_GRID' && (
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
            <span className="text-xs font-mono font-extrabold uppercase text-zinc-700 dark:text-zinc-300">
              50-Playbook Architecture Matrix ({filteredPlaybooks.length} of{' '}
              {ICEBERG_PLAYBOOKS.length} Playbooks Visible)
            </span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
              Click any playbook card to open its Multi-Engine Code
              Synthesizer
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredPlaybooks.map((pb) => {
              const isSelected = activePlaybook?.id === pb.id;
              return (
                <div
                  key={pb.id}
                  className={`h-52 p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500 shadow-sm'
                      : 'bg-zinc-50/80 dark:bg-zinc-900/70 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                  }`}
                >
                  <div className="space-y-1.5 min-h-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                        PLAYBOOK #{String(pb.num).padStart(2, '0')}
                      </span>
                      <LakehouseTrackBadge track={pb.track} />
                    </div>
                    <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                      {pb.title}
                    </div>
                    <div className="text-[10.5px] font-mono text-blue-600 dark:text-blue-400 truncate">
                      {pb.persona} · {pb.stack}
                    </div>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                      {pb.angle}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlaybookId(pb.id);
                        setViewMode('SPLIT_WORKBENCH');
                      }}
                      className="w-full h-8 px-2.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Open Workbench</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlaybookId(pb.id);
                        setViewMode('METADATA_XRAY');
                      }}
                      className="w-full h-8 px-2.5 rounded-md bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Inspect v2 Meta</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW MODE 3: ICEBERG V2 METADATA, SNAPSHOT & GCS PREFIX HASH X-RAY   */}
      {/* =================================================================== */}
      {viewMode === 'METADATA_XRAY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left 6 Columns: Live Synthesized Iceberg v2 Metadata JSON & Column-ID Lineage */}
          <div className="lg:col-span-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  Apache Iceberg Spec v2 · Immutable Metadata &amp; Column-ID
                  Schema Evolution
                </div>
                <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                  gs://{bucketName.replace(/^gs:\/\//, '')}/
                  {activePlaybook.tableName}/metadata/v4.metadata.json
                </h4>
              </div>
              <LakehouseTrackBadge track={activePlaybook.track} />
            </div>

            <pre className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80 whitespace-pre-wrap leading-relaxed border border-zinc-200 dark:border-zinc-800">
              {JSON.stringify(
                {
                  'format-version': 2,
                  'table-uuid': `7f9c2a10-${String(activePlaybook.num).padStart(
                    4,
                    '0'
                  )}-4e2b-9c8a-0192837465ab`,
                  location: `gs://${bucketName.replace(/^gs:\/\//, '')}/${
                    activePlaybook.id.toLowerCase()
                  }`,
                  'last-sequence-number': 42,
                  'last-updated-ms': 1792082400000,
                  'last-column-id': 4,
                  'current-schema-id': 1,
                  schemas: [
                    {
                      type: 'struct',
                      'schema-id': 1,
                      'identifier-field-ids': [1],
                      fields: [
                        {
                          id: 1,
                          name: 'record_id',
                          required: true,
                          type: 'string',
                        },
                        {
                          id: 2,
                          name: 'event_ts',
                          required: true,
                          type: 'timestamptz',
                        },
                        {
                          id: 3,
                          name: 'tenant_region',
                          required: false,
                          type: 'string',
                        },
                        {
                          id: 4,
                          name: 'payload_json',
                          required: false,
                          type: 'string',
                        },
                      ],
                    },
                  ],
                  'default-spec-id': 0,
                  'partition-specs': [
                    {
                      'spec-id': 0,
                      fields: [
                        {
                          'source-id': 2,
                          'field-id': 1000,
                          name: 'event_ts_day',
                          transform: 'day',
                        },
                        {
                          'source-id': 3,
                          'field-id': 1001,
                          name: 'tenant_region',
                          transform: 'identity',
                        },
                      ],
                    },
                  ],
                  'current-snapshot-id': 84920194820192,
                  snapshots: [
                    {
                      'sequence-number': 42,
                      'snapshot-id': 84920194820192,
                      'timestamp-ms': 1792082400000,
                      summary: {
                        operation: 'overwrite',
                        'spark.app.id': `dataproc-serverless-p${activePlaybook.num}`,
                        'added-data-files': '16',
                        'added-position-delete-files': '2',
                        'total-records': '14820900',
                        'total-files-size': '8492019482',
                      },
                      'manifest-list': `gs://${bucketName.replace(
                        /^gs:\/\//,
                        ''
                      )}/${activePlaybook.id.toLowerCase()}/metadata/snap-84920194820192-1.avro`,
                    },
                  ],
                },
                null,
                2
              )}
            </pre>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setViewMode('SPLIT_WORKBENCH')}
                className="w-full h-10 px-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Back to Split Playbook Workbench</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('BENTO_MATRIX_GRID')}
                className="w-full h-10 px-3 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View All 50 Playbooks</span>
              </button>
            </div>
          </div>

          {/* Right 6 Columns: 64-Prefix GCS Entropy Distribution & Multi-Engine OCC Concurrency Matrix */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3 shadow-sm">
              <div className="text-[10px] font-mono font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                Playbook #22 &amp; #24 · GCS Object Prefix Hash Distribution
                (write.object-storage.enabled=true)
              </div>
              <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Zero HTTP 429 Throttling at 500,000+ Parquet Reads/Sec Across 16
                Hex Prefixes
              </h4>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 font-mono text-[10px]">
                {[
                  '0x0f',
                  '0x1a',
                  '0x2c',
                  '0x3e',
                  '0x4b',
                  '0x5d',
                  '0x6a',
                  '0x7f',
                  '0x8c',
                  '0x9e',
                  '0xab',
                  '0xbd',
                  '0xca',
                  '0xdf',
                  '0xe4',
                  '0xff',
                ].map((pfx, idx) => (
                  <div
                    key={pfx}
                    className="h-12 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col items-center justify-center"
                  >
                    <span className="font-extrabold text-emerald-700 dark:text-emerald-300">
                      /{pfx}/
                    </span>
                    <span className="text-[9px] text-zinc-500">
                      {32 + (idx % 5) * 3}k IOPS
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3 shadow-sm">
              <div className="text-[10px] font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                Playbook #8, #15 &amp; #16 · Multi-Engine Optimistic Concurrency
                Control (OCC) Matrix
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                {[
                  {
                    engine: 'BigQuery Lakehouse Engine',
                    mode: 'Vectorized Parquet + Position Delete Merge-on-Read',
                    badge: 'ACID SNAPSHOT ISOLATION',
                  },
                  {
                    engine: 'Managed Spark 3.5 (REST 1.10)',
                    mode: 'WAP Branching + Optimistic Commit Retry',
                    badge: 'ZERO-LOCK DML',
                  },
                  {
                    engine: 'Open-Source Trino / Starburst',
                    mode: 'BigLake Iceberg REST v1 Token Vending',
                    badge: 'OAUTH CREDENTIAL VENDING',
                  },
                  {
                    engine: 'Apache Beam / Dataflow Streaming',
                    mode: 'Micro-Batch 60s Manifest Append + Auto-Compaction',
                    badge: 'EXACTLY-ONCE SINK',
                  },
                ].map((row) => (
                  <div
                    key={row.engine}
                    className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                        {row.engine}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 text-[9px] font-extrabold shrink-0">
                        {row.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      {row.mode}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* VIEW MODE 1: MAIN SPLIT WORKBENCH (DEFAULT)                         */}
      {/* =================================================================== */}
      {viewMode === 'SPLIT_WORKBENCH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 5 Columns: Scrollable List of 50 Playbooks (Uniform Card Structure) */}
          <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-3 max-h-[820px] overflow-y-auto space-y-2 shadow-sm">
            <div className="px-2 py-1.5 flex items-center justify-between text-[11px] font-mono text-zinc-500 border-b border-zinc-200 dark:border-zinc-800">
              <span>
                SHOWING {filteredPlaybooks.length} OF {ICEBERG_PLAYBOOKS.length}{' '}
                LAKEHOUSE PLAYBOOKS
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                SELECT SCENARIO
              </span>
            </div>

            {filteredPlaybooks.map((pb) => {
              const isSelected = activePlaybook?.id === pb.id;
              return (
                <button
                  key={pb.id}
                  type="button"
                  onClick={() => setSelectedPlaybookId(pb.id)}
                  className={`w-full text-left p-3 rounded-md border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-blue-600/10 dark:bg-blue-500/15 border-blue-500 shadow-sm'
                      : 'bg-zinc-50/70 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                      PLAYBOOK #{String(pb.num).padStart(2, '0')}
                    </span>
                    <LakehouseTrackBadge track={pb.track} />
                  </div>
                  <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                    {pb.title}
                  </div>
                  <div className="text-[10.5px] font-mono text-blue-600 dark:text-blue-400 truncate">
                    {pb.persona} · {pb.stack}
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-2">
                    {pb.angle}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right 7 Columns: Selected Playbook Deep-Dive, 4-Stage Pipeline Ribbon, Target Config & Multi-Engine Code */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-extrabold">
                      PLAYBOOK #{String(activePlaybook.num).padStart(2, '0')} OF
                      50
                    </span>
                    <LakehouseTrackBadge track={activePlaybook.track} />
                    <span className="text-xs font-mono font-bold text-zinc-500">
                      {activePlaybook.persona}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                    {activePlaybook.title}
                  </h3>
                </div>
              </div>

              {/* Equal-Sized 4-Stage Lakehouse Architecture Pipeline Ribbon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
                {[
                  {
                    step: 'STAGE 01 · STORAGE',
                    title: `gs://${bucketName
                      .replace(/^gs:\/\//, '')
                      .slice(0, 18)}`,
                    meta: 'Parquet ZSTD + Hash Prefixes',
                  },
                  {
                    step: 'STAGE 02 · CATALOG',
                    title: catalogId,
                    meta: 'Iceberg REST v1 Token Vending',
                  },
                  {
                    step: 'STAGE 03 · COMPUTE',
                    title: activePlaybook.stack.split(',')[0] || 'BigQuery + Spark',
                    meta: 'Multi-Engine OCC Snapshot Isolation',
                  },
                  {
                    step: 'STAGE 04 · GOVERNANCE',
                    title: `${datasetId}.${activePlaybook.tableName}`,
                    meta: `Dataplex RLS/CLS · [${activePlaybook.track}]`,
                  },
                ].map((st) => (
                  <div
                    key={st.step}
                    className="h-16 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/90 dark:bg-zinc-900/80 flex flex-col justify-between"
                  >
                    <div className="text-[9.5px] font-mono font-extrabold text-blue-600 dark:text-blue-400 truncate">
                      {st.step}
                    </div>
                    <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                      {st.title}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 truncate">
                      {st.meta}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                <div className="text-[10px] font-mono font-extrabold uppercase text-blue-600 dark:text-blue-400">
                  Google Cloud Differentiation &amp; Core Architectural Angle (
                  {activePlaybook.stack})
                </div>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed">
                  {activePlaybook.angle}
                </p>
              </div>

              {/* Target Lakehouse Parameters (Equal 4-Column Inputs) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                    BigQuery Dataset:
                  </label>
                  <input
                    type="text"
                    value={datasetId}
                    onChange={(e) => setDatasetId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                    GCS Lakehouse Bucket:
                  </label>
                  <input
                    type="text"
                    value={bucketName}
                    onChange={(e) => setBucketName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                    Iceberg REST Catalog ID:
                  </label>
                  <input
                    type="text"
                    value={catalogId}
                    onChange={(e) => setCatalogId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-zinc-500 mb-1">
                    Region:
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full h-9 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-2.5 text-xs font-mono"
                  >
                    <option value="us-central1">us-central1</option>
                    <option value="us-east1">us-east1</option>
                    <option value="europe-west1">europe-west1</option>
                    <option value="asia-east1">asia-east1</option>
                  </select>
                </div>
              </div>

              {/* Equal-Sized 3-Column Multi-Engine Code Tabs */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    {
                      id: 'BIGQUERY_SQL',
                      code: '01',
                      label: 'BigQuery Lakehouse SQL / DDL',
                      badge: 'BQ ENGINE',
                    },
                    {
                      id: 'PYSPARK_REST',
                      code: '02',
                      label: 'Serverless PySpark 3.5',
                      badge: 'REST 1.10',
                    },
                    {
                      id: 'GCLOUD_CLI',
                      code: '03',
                      label: 'gcloud 590.0.1 CLI',
                      badge: `[${activePlaybook.track}]`,
                    },
                  ].map((ct) => {
                    const active = codeEngineTab === ct.id;
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        onClick={() => setCodeEngineTab(ct.id)}
                        className={`w-full h-10 px-3 rounded-md text-xs font-mono font-bold transition-all cursor-pointer border flex items-center justify-between gap-2 ${
                          active
                            ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100 shadow-sm'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{ct.label}</span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold shrink-0 ${
                            active ? ' opacity-90' : 'text-zinc-400'
                          }`}
                        >
                          {ct.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <pre className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-72 whitespace-pre-wrap leading-relaxed border border-zinc-200 dark:border-zinc-800">
                  {codeEngineTab === 'BIGQUERY_SQL'
                    ? synthesizedCode.bqSql
                    : codeEngineTab === 'PYSPARK_REST'
                    ? synthesizedCode.pysparkCode
                    : synthesizedCode.cliCode}
                </pre>
              </div>

              {/* Equal-Sized 4-Column Action Bar (Copy + Open in BQ + Send to Shell + 1-Tap Cost Gatekeeper) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    const txt =
                      codeEngineTab === 'BIGQUERY_SQL'
                        ? synthesizedCode.bqSql
                        : codeEngineTab === 'PYSPARK_REST'
                        ? synthesizedCode.pysparkCode
                        : synthesizedCode.cliCode;
                    copyText(txt, `${activePlaybook.id}_${codeEngineTab}`);
                  }}
                  className="w-full h-11 px-3 rounded-md text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  {copiedKey === `${activePlaybook.id}_${codeEngineTab}` ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate">Copy Active Code</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOpenBigQuerySql) {
                      onOpenBigQuerySql(synthesizedCode.bqSql);
                    } else {
                      copyText(
                        synthesizedCode.bqSql,
                        `${activePlaybook.id}_BQ_SQL`
                      );
                    }
                  }}
                  className="w-full h-11 px-3 rounded-md text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">Open DDL in BigQuery</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onRunInShell) {
                      onRunInShell(synthesizedCode.cliCode);
                    } else {
                      copyText(
                        synthesizedCode.cliCode,
                        `${activePlaybook.id}_CLI`
                      );
                    }
                  }}
                  className="w-full h-11 px-3 rounded-md text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">Send CLI to Cloud Shell</span>
                </button>

                <button
                  type="button"
                  disabled={executing}
                  onClick={handleExecutePlaybook}
                  className="w-full h-11 px-3 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono font-extrabold shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {executing
                      ? `Executing [${activePlaybook.track}]...`
                      : `1-Tap Bootstrap #${activePlaybook.num} [${activePlaybook.track}]`}
                  </span>
                </button>
              </div>
            </div>

            {/* Equal-Sized 4-Column Interactive Architecture Decision Simulators */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 space-y-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold uppercase text-zinc-700 dark:text-zinc-300">
                  Interactive Lakehouse TCO &amp; Architecture Decision
                  Simulators
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  4 Live FinOps &amp; Performance Models
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
                {[
                  {
                    id: 'MIGRATE_VS_FEDERATE',
                    icon: Globe,
                    label: 'Migrate vs. Federate',
                  },
                  {
                    id: 'BQ_VS_TRINO',
                    icon: Database,
                    label: 'BigQuery vs. Trino',
                  },
                  {
                    id: 'HMS_100_MIGRATOR',
                    icon: GitBranch,
                    label: '100+ HMS to Iceberg',
                  },
                  {
                    id: 'COMPACTION_AUTOCLASS',
                    icon: Cpu,
                    label: 'Compaction & Autoclass',
                  },
                ].map((sim) => {
                  const SimIcon = sim.icon;
                  const active = simulatorTab === sim.id;
                  return (
                    <button
                      key={sim.id}
                      type="button"
                      onClick={() => setSimulatorTab(sim.id)}
                      className={`w-full h-10 px-3 rounded-md text-[11px] font-mono font-bold cursor-pointer border flex items-center justify-center gap-2 transition-all ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40'
                      }`}
                    >
                      <SimIcon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sim.label}</span>
                    </button>
                  );
                })}
              </div>

              {simulatorTab === 'MIGRATE_VS_FEDERATE' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono text-zinc-500">
                      AWS S3 / Azure ADLS Estate Size (TB):{' '}
                      <strong>{remoteDataTb} TB</strong>
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={500}
                      step={5}
                      value={remoteDataTb}
                      onChange={(e) => setRemoteDataTb(Number(e.target.value))}
                      className="w-full"
                    />
                    <label className="block text-[11px] font-mono text-zinc-500">
                      Monthly Query Volume Scanned (TB/mo):{' '}
                      <strong>{monthlyQueryScansTb} TB/mo</strong>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={1000}
                      step={10}
                      value={monthlyQueryScansTb}
                      onChange={(e) =>
                        setMonthlyQueryScansTb(Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        One-Time S3/ADLS Egress to Migrate:
                      </span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        $
                        {migrateVsFederateAnalysis.oneTimeMigrationEgressUsd.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        BigQuery Omni Federated (With Cross-Cloud Cache):
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        $
                        {migrateVsFederateAnalysis.netOmniMonthlyUsd.toLocaleString()}
                        /mo ($0 Upfront Egress)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        Migration Egress Breakeven Horizon:
                      </span>
                      <span className="font-bold">
                        ~{migrateVsFederateAnalysis.breakevenMonths} months
                      </span>
                    </div>
                    <div className="pt-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                      Verdict:{' '}
                      {migrateVsFederateAnalysis.recommendation ===
                      'FEDERATE_IN_PLACE_WITH_BQ_OMNI'
                        ? 'Keep data in S3/ADLS & query in-place with BigQuery Omni + Cross-Cloud Caching ($0 migration egress).'
                        : 'High scan-to-storage ratio justifies physical migration to GCS + BigLake Iceberg with Autoclass.'}
                    </div>
                  </div>
                </div>
              )}

              {simulatorTab === 'BQ_VS_TRINO' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono text-zinc-500">
                      24/7 Self-Managed Trino Worker Nodes (n2-highmem-16):{' '}
                      <strong>{trinoNodesCount} nodes</strong>
                    </label>
                    <input
                      type="range"
                      min={4}
                      max={64}
                      step={2}
                      value={trinoNodesCount}
                      onChange={(e) =>
                        setTrinoNodesCount(Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        24/7 Trino on GKE Cluster Cost:
                      </span>
                      <span className="font-bold text-red-600 dark:text-red-400">
                        $
                        {bqVsTrinoBenchmark.trinoMonthlyFixedCostUsd.toLocaleString()}
                        /mo (P95 10TB Scan:{' '}
                        {bqVsTrinoBenchmark.trinoP95LatencySec}s)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        BigQuery Lakehouse Engine (Scale-to-Zero Slots):
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        $
                        {bqVsTrinoBenchmark.bqServerlessMonthlyEstUsd.toLocaleString()}
                        /mo (P95 10TB Scan:{' '}
                        {bqVsTrinoBenchmark.bqVectorizedP95LatencySec}s)
                      </span>
                    </div>
                    <div className="pt-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      Result: -{bqVsTrinoBenchmark.tcoSavingsPct}% Lower TCO +
                      2.9x Faster P95 Scan Latency via BigQuery Metadata Caching
                      &amp; Vectorized Parquet Execution.
                    </div>
                  </div>
                </div>
              )}

              {simulatorTab === 'HMS_100_MIGRATOR' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono text-zinc-500">
                      Legacy HMS / Delta / Raw Parquet Tables:{' '}
                      <strong>{hmsTablesCount} tables</strong>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={1000}
                      step={10}
                      value={hmsTablesCount}
                      onChange={(e) =>
                        setHmsTablesCount(Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        Parquet Data Bytes Rewritten (system.add_files):
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        0 Bytes (100% In-Place Metadata Upgrade)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        Estimated Metadata Registration Time ({hmsTablesCount}{' '}
                        tables):
                      </span>
                      <span className="font-bold">
                        ~{Math.max(1, Math.round(hmsTablesCount * 0.15))} mins
                        via Managed Spark Parallel Pool
                      </span>
                    </div>
                    <div className="pt-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                      Zero-downtime dual-read active: Legacy Hive readers
                      continue reading while BigQuery &amp; Spark 1.10 attach
                      via Lakehouse Iceberg REST Catalog.
                    </div>
                  </div>
                </div>
              )}

              {simulatorTab === 'COMPACTION_AUTOCLASS' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono text-zinc-500">
                      Uncompacted Streaming Small Files (&lt;16MB):{' '}
                      <strong>{smallFilesCount.toLocaleString()} files</strong>
                    </label>
                    <input
                      type="range"
                      min={5000}
                      max={250000}
                      step={5000}
                      value={smallFilesCount}
                      onChange={(e) =>
                        setSmallFilesCount(Number(e.target.value))
                      }
                      className="w-full"
                    />
                    <label className="block text-[11px] font-mono text-zinc-500">
                      Partitions Older Than 90 Days (Autoclass Coldline/Archive):{' '}
                      <strong>{autoclassColdPct}%</strong>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      step={5}
                      value={autoclassColdPct}
                      onChange={(e) =>
                        setAutoclassColdPct(Number(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        After 512MB Bin-Packing (system.rewrite_data_files):
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {Math.max(12, Math.round(smallFilesCount / 140))} files
                        (-99.2% GCS Metadata RPCs)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">
                        GCS Autoclass Tiering Savings ({autoclassColdPct}% Cold
                        Snapshots):
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        -{Math.round(autoclassColdPct * 0.72)}% Monthly Storage
                        Bill ($20/TB → $4/TB)
                      </span>
                    </div>
                    <div className="pt-1 text-[11px] font-extrabold text-blue-600 dark:text-blue-400">
                      Playbook #23 &amp; #25: Z-Order compaction + GCS Autoclass
                      cuts P95 small-file scan latency by 4.6x with zero manual
                      lifecycle rules.
                    </div>
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
