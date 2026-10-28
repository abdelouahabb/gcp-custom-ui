import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles,
  Zap,
  ShieldAlert,
  ShieldCheck,
  DollarSign,
  Leaf,
  AlertTriangle,
  Cpu,
  Globe,
  Terminal,
  Copy,
  Check,
  Play,
  Moon,
  Layers,
  Activity,
  Lock,
} from 'lucide-react';
import {
  GCP_GLOBAL_REGIONS,
  getRegionProfile,
  DEFAULT_UNIT_PRICING,
  useLivePricingCatalog,
  LivePricingCatalogControlBar,
} from './GlobalNetworkWorldMap';

const ANOMALY_SCENARIOS = [
  // ==========================================================================
  // CATEGORY 0: BASELINE
  // ==========================================================================
  {
    id: 'NORMAL',
    category: '0. Baseline Reference (Normal Operation)',
    label: 'Steady-State Baseline (1.0x Normal Daily Burn)',
    description:
      'What happens if your project continues running at its current normal daily traffic and autoscaling levels with no anomalies.',
    newcomerTip:
      'Tip for newcomers: Even at steady state, always set a monthly Spend Cap budget at 120% of your expected bill so surprise spikes cannot catch you off guard.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 0,
    multiplier: 1.0,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 500,
    sliderMaxUsd: 1000,
    spikeStartDay: 1,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Run (run.googleapis.com)',
    mitigationCmd: '# Steady state — no emergency mitigation required.',
  },

  // ==========================================================================
  // CATEGORY 1: AI, GEMINI & GPU BILLING TRAPS (5 Scenarios)
  // ==========================================================================
  {
    id: 'GEMINI_KEY_LEAK',
    category: '1. AI, Gemini & GPU Billing Traps',
    label:
      'Leaked Gemini API Key Scraped on GitHub / Client Bundle (Exponential Token Drain)',
    description:
      'What happens if an unrestricted AIzaSy... Gemini API key is scraped on Day 2: bots distribute the key across proxy pools calling generativelanguage.googleapis.com (Gemini 2.5 Pro 1M-token context), compounding 1.28x/day up to Tier-2 TPM quota ceilings. Native GCP Spend Cap Eligible (GEMINI_API).',
    newcomerTip:
      'How to prevent: Never embed Gemini API keys in frontend JS/mobile apps; restrict keys by HTTP referrer/IP and API target, and set a Native Spend Cap on Gemini API (generativelanguage.googleapis.com).',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 3.2,
    multiplier: 4.5,
    dailyCompoundRate: 1.28,
    maxDailyCeilingUsd: 2400,
    sliderMaxUsd: 5000,
    spikeStartDay: 2,
    targetServiceKey: 'GEMINI_API',
    targetServiceLabel: 'Gemini API (generativelanguage.googleapis.com)',
    mitigationCmd:
      'gcloud services api-keys list --filter="restrictions.apiTargets.service:generativelanguage.googleapis.com" && gcloud services disable generativelanguage.googleapis.com --force',
  },
  {
    id: 'VERTEX_AGENT_LOOP',
    category: '1. AI, Gemini & GPU Billing Traps',
    label:
      'Recursive Multi-Agent Loop on Vertex AI / Gemini Enterprise (Exponential Tool Storm)',
    description:
      'What happens if autonomous agents enter a recursive sub-agent spawning and Google Search grounding loop against aiplatform.googleapis.com on Day 3, compounding 1.25x/day as agent threads multiply. Native GCP Spend Cap Eligible (VERTEX_AI).',
    newcomerTip:
      'How to prevent: Enforce a strict max_steps / recursion depth on agent loops, disable Google Search grounding unless required ($35/1,000 grounded prompts), and arm a Vertex AI Spend Cap.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 2.6,
    multiplier: 4.0,
    dailyCompoundRate: 1.25,
    maxDailyCeilingUsd: 1800,
    sliderMaxUsd: 5000,
    spikeStartDay: 3,
    targetServiceKey: 'VERTEX_AI',
    targetServiceLabel:
      'Vertex AI / Agent Platform (aiplatform.googleapis.com)',
    mitigationCmd: 'gcloud services disable aiplatform.googleapis.com --force',
  },
  {
    id: 'GPU_LLM_SURGE',
    category: '1. AI, Gemini & GPU Billing Traps',
    label:
      'Uncontrolled Cloud Run GPU Autoscaling (No max-instances · Warm NVIDIA L4 Fleet)',
    description:
      'What happens if a Cloud Run NVIDIA L4 GPU service is deployed with min-instances=4, instance-based billing, and default max-instances=100: traffic spikes spin up dozens of GPU instances that stay warm 24/7 starting Day 3. Native GCP Spend Cap Eligible (CLOUD_RUN).',
    newcomerTip:
      'How to prevent: Always pass --min-instances=0 --max-instances=2 --cpu-throttling when deploying Cloud Run GPU services so idle GPUs scale down to $0.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 2.85,
    multiplier: 4.4,
    dailyCompoundRate: 1.18,
    maxDailyCeilingUsd: 1450,
    sliderMaxUsd: 4000,
    spikeStartDay: 3,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Run GPU (run.googleapis.com)',
    mitigationCmd:
      'gcloud run services update GPU_SERVICE --min-instances=0 --max-instances=1 --cpu-throttling',
  },
  {
    id: 'FORGOTTEN_VERTEX_WORKBENCH_A100',
    category: '1. AI, Gemini & GPU Billing Traps',
    label:
      'Forgotten Idle Vertex AI Workbench / Colab Enterprise Runtime (a2-highgpu-4g 4x A100 24/7)',
    description:
      'What happens if a data scientist launches a 4x NVIDIA A100 Vertex AI Workbench notebook or custom training job on Day 2 and closes the browser tab without stopping the underlying VM (~$14.60/hr · $350/day).',
    newcomerTip:
      'How to prevent: Enable idle auto-shutdown (e.g., 60 minutes) on all Vertex AI Workbench instances and Colab Enterprise runtimes.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 14.6,
    multiplier: 2.0,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 1200,
    sliderMaxUsd: 5000,
    spikeStartDay: 2,
    targetServiceKey: 'VERTEX_AI',
    targetServiceLabel: 'Vertex AI Workbench (aiplatform.googleapis.com)',
    mitigationCmd:
      'gcloud workbench instances list && gcloud services disable notebooks.googleapis.com aiplatform.googleapis.com --force',
  },
  {
    id: 'VERTEX_VECTOR_SEARCH_INDEX_SPRAWL',
    category: '1. AI, Gemini & GPU Billing Traps',
    label:
      'Always-On Vertex AI Vector Search / Matching Engine Endpoints (Unpruned Index Shards)',
    description:
      'What happens if multiple RAG test indexes remain deployed to dedicated e2-standard-16 Vector Search endpoints 24/7 starting Day 1—even with zero queries, deployed index shards bill hourly per node.',
    newcomerTip:
      'How to prevent: Undeploy Vector Search indexes from endpoints when not actively serving production traffic; an undeployed index costs only pennies for GCS storage.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 2.15,
    multiplier: 2.5,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 600,
    sliderMaxUsd: 2000,
    spikeStartDay: 1,
    targetServiceKey: 'VERTEX_AI',
    targetServiceLabel: 'Vertex AI Vector Search (aiplatform.googleapis.com)',
    mitigationCmd:
      'gcloud ai index-endpoints list --region=us-central1',
  },

  // ==========================================================================
  // CATEGORY 2: SERVERLESS & EVENT-DRIVEN RUNAWAY LOOPS (4 Scenarios)
  // ==========================================================================
  {
    id: 'CLOUD_FUNCTIONS_PUBSUB_CASCADE',
    category: '2. Serverless & Event-Driven Runaway Loops',
    label:
      'Cloud Run Functions Pub/Sub or GCS Self-Trigger Cascade (Exponential Event Storm)',
    description:
      'What happens if a Cloud Run function triggered by a GCS bucket or Pub/Sub topic writes a thumbnail/log back to the SAME bucket/topic on every execution, compounding 1.24x/day starting Day 3. Native GCP Spend Cap Eligible (CLOUD_FUNCTIONS).',
    newcomerTip:
      'How to prevent: Never write output files back into the same GCS trigger bucket (use a separate -processed bucket) and set --max-instances=5 on every function.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 1.45,
    multiplier: 3.5,
    dailyCompoundRate: 1.24,
    maxDailyCeilingUsd: 1200,
    sliderMaxUsd: 3000,
    spikeStartDay: 3,
    targetServiceKey: 'CLOUD_FUNCTIONS',
    targetServiceLabel: 'Cloud Run functions (cloudfunctions.googleapis.com)',
    mitigationCmd:
      'gcloud services disable cloudfunctions.googleapis.com --force',
  },
  {
    id: 'INFINITE_LOOP',
    category: '2. Serverless & Event-Driven Runaway Loops',
    label:
      'Runaway Infinite Retry Loop / Webhook Storm (120x Serverless vCPU Pinned 24/7)',
    description:
      'What happens if a misconfigured webhook or frontend useEffect() missing a dependency array hammers your Cloud Run API in an infinite loop starting Day 4. Native GCP Spend Cap Eligible (CLOUD_RUN).',
    newcomerTip:
      'How to prevent: Always configure Cloud Armor rate-limiting or API Gateway quotas and set --max-instances=10 on Cloud Run services.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 1.35,
    multiplier: 5.5,
    dailyCompoundRate: 1.15,
    maxDailyCeilingUsd: 850,
    sliderMaxUsd: 2500,
    spikeStartDay: 4,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Run (run.googleapis.com)',
    mitigationCmd:
      'gcloud run services update SERVICE_NAME --max-instances=2 && gcloud compute firewall-rules create block-runaway-webhook --action=DENY --rules=tcp:443 --priority=90',
  },
  {
    id: 'VIRAL_TRAFFIC',
    category: '2. Serverless & Event-Driven Runaway Loops',
    label:
      'Viral HackerNews / ProductHunt / Reddit Surge on Cloud Run (35x HTTP Spike)',
    description:
      'What happens if a sudden 35x traffic spike hits on Day 5: Cloud Run scales to maxInstances and egress bandwidth jumps by 1.8 TB. Native GCP Spend Cap Eligible (CLOUD_RUN).',
    newcomerTip:
      'How to prevent: Put Cloud CDN or Cloudflare in front of Cloud Run, set --concurrency=100 so 1 container handles 100 concurrent requests, and enable CPU throttling (--cpu-throttling).',
    curveType: 'LINEAR',
    hourlyAdderUsd: 0.42,
    multiplier: 2.8,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 500,
    sliderMaxUsd: 1000,
    spikeStartDay: 5,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Run (run.googleapis.com)',
    mitigationCmd:
      'gcloud run services update SERVICE_NAME --max-instances=15 --concurrency=120 --cpu-throttling',
  },
  {
    id: 'CLOUD_TASKS_DEADLETTER_AMPLIFICATION',
    category: '2. Serverless & Event-Driven Runaway Loops',
    label:
      'Cloud Tasks / Eventarc Failing Job Without Max-Attempts (Retry Amplification Storm)',
    description:
      'What happens if a downstream database error causes Cloud Tasks or Eventarc deliveries to return HTTP 500 with unlimited retries: failed tasks accumulate and re-fire millions of times per day starting Day 4.',
    newcomerTip:
      'How to prevent: Always configure max_attempts (e.g., 5 retries) and attach a Dead-Letter Topic to every Pub/Sub subscription and Cloud Tasks queue.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 1.15,
    multiplier: 3.8,
    dailyCompoundRate: 1.2,
    maxDailyCeilingUsd: 780,
    sliderMaxUsd: 2500,
    spikeStartDay: 4,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Run & Cloud Tasks (run.googleapis.com)',
    mitigationCmd:
      'gcloud tasks queues pause QUEUE_NAME --location=us-central1',
  },

  // ==========================================================================
  // CATEGORY 3: EGRESS, INTER-REGION BACKUP & NETWORKING SURPRISES (4 Scenarios)
  // ==========================================================================
  {
    id: 'INTER_REGION_BACKUP_TRANSFER',
    category: '3. Egress, Cross-Region Backup & Networking Traps',
    label:
      'Massive Cross-Region / Inter-Continent Backup & Bucket Sync (45 TB Replication)',
    description:
      'What happens if a cron job or disaster-recovery script runs gsutil rsync / gcloud storage cp across continents (e.g., us-central1 to europe-west1 or asia-east1) transferring 45 TB of backups & VM snapshots at $0.08–$0.12/GB starting Day 3.',
    newcomerTip:
      'How to prevent: Keep backups in the SAME region (intra-region GCS copy is $0.00/GB!) or use Archive Storage class in the same region instead of copying multi-terabyte backups across continents every night.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 5.8,
    multiplier: 4.5,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 950,
    sliderMaxUsd: 4000,
    spikeStartDay: 3,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel:
      'Cross-Region Network Egress & Storage Transfer',
    mitigationCmd:
      'gcloud transfer jobs list && gcloud compute firewall-rules create pause-cross-region-egress --action=DENY --direction=EGRESS --rules=all --priority=95',
  },
  {
    id: 'CLOUD_NAT_HAIRPIN_EGRESS',
    category: '3. Egress, Cross-Region Backup & Networking Traps',
    label:
      'Cloud NAT Hairpin Traffic to GCS / BigQuery Without Private Google Access ($0.045/GB)',
    description:
      'What happens if private VMs or GKE nodes without external IPs read/write terabytes of data to Cloud Storage or BigQuery through a Cloud NAT gateway without enabling Private Google Access on the subnet ($0.045/GB NAT processing fee) starting Day 2.',
    newcomerTip:
      'How to prevent: Turn on Private Google Access (--enable-private-ip-google-access) on every VPC subnet—traffic to Google APIs (GCS, BigQuery, Artifact Registry) then bypasses Cloud NAT for $0.00/GB!',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 1.95,
    multiplier: 3.6,
    dailyCompoundRate: 1.12,
    maxDailyCeilingUsd: 620,
    sliderMaxUsd: 2500,
    spikeStartDay: 2,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'VPC Subnet & Cloud NAT Gateway',
    mitigationCmd:
      'gcloud compute networks subnets update default --region=us-central1 --enable-private-ip-google-access',
  },
  {
    id: 'MULTI_ZONE_GKE_CHATTY_MICROSERVICES',
    category: '3. Egress, Cross-Region Backup & Networking Traps',
    label:
      'Chatty Multi-Zone GKE / Kafka / Redis Mesh ($0.01/GB Inter-Zone Egress Tax)',
    description:
      'What happens if high-throughput microservices, Kafka brokers, or Redis caches in us-central1-a constantly exchange payloads with pods in us-central1-b and us-central1-c ($0.01/GB inter-zone data transfer) starting Day 1.',
    newcomerTip:
      'How to prevent: Enable Topology-Aware Routing (service.kubernetes.io/topology-mode: Auto) in GKE so pod-to-pod traffic stays within the same availability zone at $0.00/GB.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 1.25,
    multiplier: 2.9,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 450,
    sliderMaxUsd: 1500,
    spikeStartDay: 1,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Inter-Zone VPC & GKE Service Mesh',
    mitigationCmd:
      'kubectl annotate service MY_SERVICE service.kubernetes.io/topology-mode=Auto --overwrite',
  },
  {
    id: 'DDOS_EGRESS',
    category: '3. Egress, Cross-Region Backup & Networking Traps',
    label:
      'Cross-Continent Egress Scraping / Uncached Botnet Media Flood (12 TB Public Bucket)',
    description:
      'What happens if an automated botnet or hotlinked site scrapes large video/model artifacts from a public Cloud Storage bucket or Cloud Run service across continents (12 TB @ $0.08–$0.12/GB) starting Day 5.',
    newcomerTip:
      'How to prevent: Enforce Public Access Prevention on all GCS buckets, never host unthrottled public downloads without Cloud Armor / signed URLs, and enable Requester Pays if sharing datasets.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 1.65,
    multiplier: 3.8,
    dailyCompoundRate: 1.16,
    maxDailyCeilingUsd: 920,
    sliderMaxUsd: 3000,
    spikeStartDay: 5,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Run & Egress Perimeter (run.googleapis.com)',
    mitigationCmd:
      'gcloud storage buckets update gs://BUCKET_NAME --public-access-prevention && gcloud compute firewall-rules create emergency-ddos-shield --action=DENY --direction=INGRESS --rules=tcp:80,tcp:443 --source-ranges=0.0.0.0/0 --priority=80',
  },

  // ==========================================================================
  // CATEGORY 4: DATA WAREHOUSE, DATABASES & STORAGE EXPLOSIONS (4 Scenarios)
  // ==========================================================================
  {
    id: 'BIGQUERY_UNPARTITIONED_SCAN',
    category: '4. BigQuery, Databases & Storage Explosions',
    label:
      'Unpartitioned BigQuery SELECT * in Auto-Refreshing Dashboard (50 TB/day @ $6.25/TB)',
    description:
      'What happens if a Looker Studio, Grafana, or BI dashboard without a partition filter (SELECT *) auto-refreshes every 5 minutes against a multi-terabyte BigQuery table ($6.25/TB on-demand) starting Day 4.',
    newcomerTip:
      'How to prevent: Require partition filters (--require_partition_filter=true) on large BigQuery tables and set a custom --maximum_bytes_billed project/user quota in BigQuery.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 6.5,
    multiplier: 4.2,
    dailyCompoundRate: 1.1,
    maxDailyCeilingUsd: 750,
    sliderMaxUsd: 3500,
    spikeStartDay: 4,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel:
      'BigQuery On-Demand Scan + Pub/Sub Kill-Switch Alert',
    mitigationCmd:
      'gcloud services disable bigquery.googleapis.com --force',
  },
  {
    id: 'BIGQUERY_AUTOSCALING_SLOTS_PINNED',
    category: '4. BigQuery, Databases & Storage Explosions',
    label:
      'BigQuery Enterprise Autoscaling Slots Pinned by Runaway Cross-Join (1,600 Slots 24/7)',
    description:
      'What happens if a BigQuery Capacity reservation with max_slots=1600 is pinned at 100% utilization by badly written SQL cross-joins and dbt materializations running every 15 minutes starting Day 3.',
    newcomerTip:
      'How to prevent: Keep baseline slots at 0 and cap max_slots to 100–200 for non-production workloads, or use On-Demand mode with a strict daily byte scan quota.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 8.4,
    multiplier: 3.5,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 900,
    sliderMaxUsd: 4000,
    spikeStartDay: 3,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'BigQuery Reservation API (bigqueryreservation.googleapis.com)',
    mitigationCmd:
      'bq ls -j -a --max_results=20 && gcloud services disable bigqueryreservation.googleapis.com',
  },
  {
    id: 'CLOUD_SQL_HA_REPLICA_IOPS_SPRAWL',
    category: '4. BigQuery, Databases & Storage Explosions',
    label:
      'Oversized Cloud SQL Enterprise Plus + Regional HA + 4 Read Replicas + PITR Bloat',
    description:
      'What happens if a newcomer clicks defaults on Cloud SQL (Enterprise Plus edition, db-perf-optimized-N-16, Regional High Availability doubling cost, 4 Read Replicas, and auto-expanding SSD storage from heavy WAL logs) starting Day 1.',
    newcomerTip:
      'How to prevent: For dev/staging or small apps, choose Cloud SQL Enterprise (not Enterprise Plus), Zonal (Single Zone), db-f1-micro or db-custom-1-3840, and disable auto-storage increase above 50 GB.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 4.9,
    multiplier: 3.0,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 600,
    sliderMaxUsd: 3500,
    spikeStartDay: 1,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud SQL Admin API (sqladmin.googleapis.com)',
    mitigationCmd:
      'gcloud sql instances patch INSTANCE_NAME --activation-policy=NEVER',
  },
  {
    id: 'GCS_AUTOCLASS_ARCHIVE_EARLY_DELETE',
    category: '4. BigQuery, Databases & Storage Explosions',
    label:
      'Cloud Storage Archive/Coldline Early-Deletion Penalty + Millions of Class-A List Ops',
    description:
      'What happens if temporary build artifacts or checkpoints are written into a Coldline (90-day min) or Archive (365-day min) bucket and deleted the next day—triggering full 90/365-day early deletion charges plus Class-A operation fees starting Day 3.',
    newcomerTip:
      'How to prevent: Never use Coldline or Archive for frequently overwritten or short-lived files; use Standard storage with an Object Lifecycle Management rule.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 1.85,
    multiplier: 3.1,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 480,
    sliderMaxUsd: 1500,
    spikeStartDay: 3,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Storage Lifecycle & Operations',
    mitigationCmd:
      'gcloud storage buckets update gs://BUCKET_NAME --default-storage-class=STANDARD',
  },

  // ==========================================================================
  // CATEGORY 5: OBSERVABILITY, KUBERNETES & ZOMBIE INFRA TRAPS (4 Scenarios)
  // ==========================================================================
  {
    id: 'LOGGING_DEBUG_INGESTION_EXPLOSION',
    category: '5. Observability, GKE & Zombie Infrastructure Traps',
    label:
      'Cloud Logging & Trace Verbose DEBUG JSON Ingestion Flood ($0.50/GiB · 6 TB/mo)',
    description:
      'What happens if verbose DEBUG/TRACE logging or VPC Flow Logs at 100% sampling are left enabled during high traffic, ingesting terabytes of JSON payloads into Cloud Logging ($0.50/GiB past 50 GiB free tier) starting Day 4.',
    newcomerTip:
      'How to prevent: Add an exclusion filter on the _Default Cloud Logging sink (NOT severity < ERROR) so debug and info logs are dropped before ingestion billing.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 2.35,
    multiplier: 3.9,
    dailyCompoundRate: 1.14,
    maxDailyCeilingUsd: 680,
    sliderMaxUsd: 2500,
    spikeStartDay: 4,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Logging _Default Sink (logging.googleapis.com)',
    mitigationCmd:
      'gcloud logging sinks update _Default --log-filter="NOT severity<ERROR"',
  },
  {
    id: 'PROMETHEUS_HIGH_CARDINALITY_METRICS',
    category: '5. Observability, GKE & Zombie Infrastructure Traps',
    label:
      'Managed Prometheus (GMP) High-Cardinality Metric Explosion (request_id / user_id Labels)',
    description:
      'What happens if a developer adds an unbounded label like user_id, session_id, or request_id to a Prometheus metric scraped every 15s—creating millions of unique time-series billed per sample ingested starting Day 3.',
    newcomerTip:
      'How to prevent: Never put high-cardinality IDs (user IDs, emails, UUIDs, URLs) into Prometheus metric labels; drop offending labels in OperatorConfig metricRelabelings.',
    curveType: 'EXPONENTIAL',
    hourlyAdderUsd: 2.1,
    multiplier: 3.7,
    dailyCompoundRate: 1.18,
    maxDailyCeilingUsd: 790,
    sliderMaxUsd: 3000,
    spikeStartDay: 3,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Cloud Monitoring & Managed Prometheus (monitoring.googleapis.com)',
    mitigationCmd:
      'gcloud services disable monitoring.googleapis.com --force',
  },
  {
    id: 'GKE_AUTOPILOT_DAEMONSET_POD_BLOAT',
    category: '5. Observability, GKE & Zombie Infrastructure Traps',
    label:
      'GKE Autopilot Oversized Pod Requests + DaemonSet Multiplicative Scaling (80 Nodes)',
    description:
      'What happens if GKE Autopilot pods request 4 vCPU / 16 GiB RAM while only using 0.1 vCPU, and 3 heavy logging/security DaemonSets run on every scaled-out node starting Day 2.',
    newcomerTip:
      'How to prevent: In GKE Autopilot you pay for pod resource requests (not actual usage)—always right-size CPU/memory requests using Vertical Pod Autoscaler (VPA) recommendations.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 3.4,
    multiplier: 3.2,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 650,
    sliderMaxUsd: 2500,
    spikeStartDay: 2,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Google Kubernetes Engine (container.googleapis.com)',
    mitigationCmd:
      'gcloud container clusters resize CLUSTER_NAME --num-nodes=1 --region=us-central1 --quiet',
  },
  {
    id: 'ORPHANED_SNAPSHOTS_STATIC_IPS_LB',
    category: '5. Observability, GKE & Zombie Infrastructure Traps',
    label:
      'Zombie Infra Sprawl: Unattached Hyperdisk Extreme Volumes + Idle LBs + Unused Static IPs',
    description:
      'What happens if VMs and GKE services are deleted without cleaning up their persistent Hyperdisk Extreme volumes (billed for provisioned IOPS 24/7 even when unattached!), forwarding rules ($18/mo each), and unattached static IPv4 addresses ($7.30/mo each).',
    newcomerTip:
      'How to prevent: Native Spend Caps do NOT stop persistent disks or load balancers—use CloudPulse Orphaned Disk & Zombie IP Cleaner to delete unattached disks and release unused IPs.',
    curveType: 'LINEAR',
    hourlyAdderUsd: 1.75,
    multiplier: 2.6,
    dailyCompoundRate: 1.0,
    maxDailyCeilingUsd: 400,
    sliderMaxUsd: 1500,
    spikeStartDay: 1,
    targetServiceKey: 'CLOUD_RUN',
    targetServiceLabel: 'Persistent Disks, Load Balancers & Static IPs',
    mitigationCmd:
      'gcloud compute disks list --filter="-users:*" && gcloud compute addresses list --filter="status=RESERVED"',
  },
];

const ANOMALY_SCENARIO_GROUPS = Array.from(
  ANOMALY_SCENARIOS.reduce((map, item) => {
    const cat = item.category || 'General Scenarios';
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat).push(item);
    return map;
  }, new Map()).entries()
);

const DREAM_STACK_ARCHETYPES = [
  {
    id: 'AI_RAG_GPU',
    name: 'Zero-Trust LLM Inference & RAG Stack (L4 GPU)',
    summary:
      'Serverless Cloud Run NVIDIA L4 GPU inference service + Regional Vector/Artifact Bucket + BigQuery Analytics + Priority-100 Zero-Trust Firewall.',
    requiresGpu: true,
    preferredContinent: 'North America',
    estimatedBaseMonthlyUsd: 64.5,
    components: [
      {
        type: 'CLOUD_RUN',
        name: 'llm-inference-l4',
        spec: '4 vCPU · 16Gi RAM · 1x NVIDIA L4 GPU · min=0 max=4 (Scale-to-$0 Idle)',
        monthlyUsd: 48.0,
      },
      {
        type: 'GCS_BUCKET',
        name: 'rag-embeddings-vault',
        spec: 'STANDARD Storage · Uniform IAM · Public Access Prevention Enforced',
        monthlyUsd: 4.5,
      },
      {
        type: 'BIGQUERY',
        name: 'llm_telemetry_mart',
        spec: 'Serverless Vector & Prompt Audit Dataset ($0 Idle)',
        monthlyUsd: 0.0,
      },
      {
        type: 'VPC_FIREWALL',
        name: 'zero-trust-ai-perimeter',
        spec: 'INGRESS DENY tcp:22,3389 from 0.0.0.0/0 (Priority 100) + IAP Allow',
        monthlyUsd: 12.0,
      },
    ],
  },
  {
    id: 'EU_GDPR_LAKEHOUSE',
    name: 'GDPR Sovereign EU FinTech Data Lakehouse',
    summary:
      '100% EU-resident serverless ingestion API + BigQuery analytical warehouse + locked-down custom VPC & KMS-ready object storage.',
    requiresGpu: false,
    preferredContinent: 'Europe',
    estimatedBaseMonthlyUsd: 34.0,
    components: [
      {
        type: 'CLOUD_RUN',
        name: 'eu-fintech-ingest-api',
        spec: '2 vCPU · 4Gi RAM · Request-Based Billing ($0 Idle) · Private IAM',
        monthlyUsd: 18.5,
      },
      {
        type: 'GCS_BUCKET',
        name: 'eu-gdpr-raw-landing',
        spec: 'EU Sovereign Regional Bucket · Retention Policy · Zero Public Access',
        monthlyUsd: 6.5,
      },
      {
        type: 'BIGQUERY',
        name: 'eu_regulatory_ledger',
        spec: 'EU Partitioned Analytical Dataset · BI Engine Ready',
        monthlyUsd: 9.0,
      },
      {
        type: 'VPC_FIREWALL',
        name: 'eu-sovereign-shield',
        spec: 'Strict Ingress Lock + Cloud NAT Outbound Only',
        monthlyUsd: 0.0,
      },
    ],
  },
  {
    id: 'FRUGAL_SPOT_MESH',
    name: 'Ultra-Frugal Startup Spot & Scale-to-Zero Mesh',
    summary:
      'Designed to run a full production SaaS for under $15/mo using Request-billed Cloud Run + Spot E2 worker VM (-68% discount).',
    requiresGpu: false,
    preferredContinent: 'North America',
    estimatedBaseMonthlyUsd: 14.2,
    components: [
      {
        type: 'CLOUD_RUN',
        name: 'saas-edge-gateway',
        spec: '1 vCPU · 1Gi RAM · min=0 max=10 · Request-billed ($0.00 when idle)',
        monthlyUsd: 4.2,
      },
      {
        type: 'COMPUTE_VM',
        name: 'spot-queue-worker-01',
        spec: 'e2-medium Spot VM (-68% Spot Discount) · 20GB pd-balanced',
        monthlyUsd: 8.8,
      },
      {
        type: 'GCS_BUCKET',
        name: 'saas-static-assets',
        spec: 'Regional Object Bucket · Lifecycle 30d Nearline Rule',
        monthlyUsd: 1.2,
      },
    ],
  },
  {
    id: 'GLOBAL_GREEN_HA',
    name: '98% Carbon-Free Hydro/Wind High-Availability Core',
    summary:
      'Ultra-clean hydro/wind regional deployment optimized for ESG compliance, maximum Carbon-Free Energy (CFE%), and Tier-1 pricing.',
    requiresGpu: false,
    preferredContinent: 'Europe',
    estimatedBaseMonthlyUsd: 29.0,
    components: [
      {
        type: 'CLOUD_RUN',
        name: 'green-core-service',
        spec: '2 vCPU · 4Gi RAM · 96%+ Carbon-Free Energy Grid · Auto-scaling',
        monthlyUsd: 21.0,
      },
      {
        type: 'COMPUTE_VM',
        name: 'green-telemetry-node',
        spec: 'e2-small Spot VM · Container-Optimized OS',
        monthlyUsd: 6.0,
      },
      {
        type: 'BIGQUERY',
        name: 'esg_carbon_ledger',
        spec: 'Scope-2 Grid Emissions Tracking Dataset',
        monthlyUsd: 2.0,
      },
    ],
  },
];

export default function AutonomousCloudBrain({
  projectId,
  overview,
  vms = [],
  burn,
  onHibernateSleep,
  onOpenProvision,
  onOpenFinOps,
  onShowToast,
}) {
  const { version: pricingVersion, unitPricing } = useLivePricingCatalog();

  // ==========================================================================
  // 1. PRE-CRIME 30-DAY BILLING & QUOTA TIME-CRYSTAL STATE
  // ==========================================================================
  const [monthlyBudgetCap, setMonthlyBudgetCap] = useState(150);
  const [customSliderMaxUsd, setCustomSliderMaxUsd] = useState(5000);
  const [scenarioId, setScenarioId] = useState('GEMINI_KEY_LEAK');
  const [autoBreakerArmed, setAutoBreakerArmed] = useState(false);
  const [activeServerSpendCapBudget, setActiveServerSpendCapBudget] =
    useState(null);
  const [syncingLiveBudget, setSyncingLiveBudget] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(null);

  // On mount, check if a permanent 24/7 GCP Spend Cap or Pub/Sub Kill-Switch budget is ALREADY armed in Google Cloud Billing
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    axios
      .get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/billing-guardian/spend-cap-catalog`
      )
      .then((res) => {
        if (cancelled || !res.data?.ok) return;
        const serverBudgets = Array.isArray(res.data.budgets)
          ? res.data.budgets
          : [];
        const existingArmed = serverBudgets.find(
          (b) =>
            b.spendCapConfigured ||
            Boolean(b.notificationsRule?.pubsubTopic)
        );
        if (existingArmed) {
          setActiveServerSpendCapBudget(existingArmed);
          setAutoBreakerArmed(true);
          if (existingArmed.amountUsd > 0) {
            setMonthlyBudgetCap(existingArmed.amountUsd);
          }
        }
      })
      .catch(() => {
        // ignore if offline
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const handleToggleAndSyncLiveCircuitBreaker = async () => {
    // If already armed on Google Cloud's servers, lifting it calls the real GCP Budget API (`AWAITING_NEXT_PERIOD`)
    if (autoBreakerArmed) {
      if (activeServerSpendCapBudget?.name) {
        setSyncingLiveBudget(true);
        try {
          const res = await axios.post(
            `/api/project/${encodeURIComponent(
              projectId
            )}/billing-guardian/budgets/spend-cap-action`,
            {
              budgetName: activeServerSpendCapBudget.name,
              action: 'LIFT_CAP',
            }
          );
          setAutoBreakerArmed(false);
          setActiveServerSpendCapBudget(null);
          if (onShowToast) {
            onShowToast(
              res.data?.message ||
                'Lifted 24/7 GCP Spend Cap in Google Cloud Billing (AWAITING_NEXT_PERIOD).'
            );
          }
        } catch (err) {
          if (err?.__cancelledByUser || err?.response?.status === 499) return;
          setAutoBreakerArmed(false);
        } finally {
          setSyncingLiveBudget(false);
        }
        return;
      }
      setAutoBreakerArmed(false);
      if (onShowToast) {
        onShowToast('Disarmed Billing Spend Cap Circuit-Breaker.');
      }
      return;
    }

    if (!projectId) return;
    setSyncingLiveBudget(true);
    const matchedScenario =
      ANOMALY_SCENARIOS.find((s) => s.id === scenarioId) ||
      ANOMALY_SCENARIOS[0];
    const targetServiceKey = matchedScenario.targetServiceKey || 'CLOUD_RUN';
    try {
      // Provisions a PERMANENT 24/7 Server-Side Spend Cap (`spendCap.inputState = "CONFIGURED"`)
      // + Pub/Sub Kill-Switch Topic (`projects/<id>/topics/cloudpulse-budget-killswitch`) on Google Cloud Billing!
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/billing-guardian/budgets/create`,
        {
          displayName: `${projectId}-24x7-spend-cap-${monthlyBudgetCap}usd`,
          amountUsd: Number(monthlyBudgetCap || 150),
          enableSpendCap: true,
          targetServiceKey,
          autoCreatePubsubKillswitchTopic: true,
          creditTypesTreatment: 'EXCLUDE_ALL_CREDITS',
          thresholdPercents: [50, 80, 100],
        }
      );
      setAutoBreakerArmed(true);
      if (res.data?.budget) {
        setActiveServerSpendCapBudget(res.data.budget);
      }
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Armed permanent 24/7 GCP Spend Cap ($${monthlyBudgetCap}/mo · spendCap=CONFIGURED) in Google Cloud Console!`
        );
      }
    } catch (err) {
      // If the user clicked "Cancel" in the Pre-Execution Warning Modal, keep autoBreakerArmed = false!
      if (err?.__cancelledByUser || err?.response?.status === 499) {
        setAutoBreakerArmed(false);
        return;
      }
      setAutoBreakerArmed(false);
      if (onShowToast) {
        onShowToast(
          err?.response?.data?.error ||
            'Could not provision Spend Cap in Google Cloud Billing (verify Billing Account permissions in FinOps & Credits).'
        );
      }
    } finally {
      setSyncingLiveBudget(false);
    }
  };

  const activeScenario = useMemo(
    () =>
      ANOMALY_SCENARIOS.find((s) => s.id === scenarioId) ||
      ANOMALY_SCENARIOS[0],
    [scenarioId]
  );

  // Calculate 30-day cumulative spend curve (Baseline vs Scenario Surge) using live variable unit rates
  const timeCrystalForecast = useMemo(() => {
    const cpuFactor =
      unitPricing.vcpuPerHourUsd / DEFAULT_UNIT_PRICING.vcpuPerHourUsd;
    const gpuFactor =
      unitPricing.cloudRunL4GpuPerHourUsd /
      DEFAULT_UNIT_PRICING.cloudRunL4GpuPerHourUsd;
    const egressFactor =
      unitPricing.crossContinentEgressPerGbUsd /
      DEFAULT_UNIT_PRICING.crossContinentEgressPerGbUsd;
    const cudFactor = Math.max(
      0.45,
      1 - (Number(unitPricing.cudDiscountPercent) || 0) / 100
    );

    const scenarioRateFactor =
      activeScenario.id === 'GPU_LLM_SURGE'
        ? gpuFactor
        : activeScenario.id === 'DDOS_EGRESS'
        ? egressFactor
        : cpuFactor;

    const baseHourly =
      Math.max(Number(burn?.hourly || 0.045), 0.015) * cpuFactor * cudFactor;
    const baseDaily = baseHourly * 24;
    const initialSurgeDaily =
      (baseHourly * activeScenario.multiplier +
        activeScenario.hourlyAdderUsd * scenarioRateFactor * cudFactor) *
      24;
    const compoundRate = Number(activeScenario.dailyCompoundRate || 1.0);
    const maxDailyCeiling = Number(activeScenario.maxDailyCeilingUsd || 2400);

    const days = [];
    let cumBaseline = 0;
    let cumProjected = 0;
    let unguardedMonthEnd = 0;
    let peakSurgeDaily = initialSurgeDaily;
    let breachDay = null;
    let breachHour = null;

    for (let d = 1; d <= 30; d += 1) {
      cumBaseline += baseDaily;
      let dailyRate = baseDaily;
      if (d >= activeScenario.spikeStartDay) {
        const daysIntoSurge = d - activeScenario.spikeStartDay;
        const compounded =
          initialSurgeDaily * Math.pow(compoundRate, daysIntoSurge);
        dailyRate = Math.min(maxDailyCeiling, compounded);
        if (dailyRate > peakSurgeDaily) {
          peakSurgeDaily = dailyRate;
        }
      }
      unguardedMonthEnd += dailyRate;
      const prevProjected = cumProjected;

      // If Auto-Circuit-Breaker is armed and we cross the budget cap, clamp spend to parked disk-only rate!
      if (autoBreakerArmed && prevProjected >= monthlyBudgetCap) {
        cumProjected += 0.08; // Parked $0 idle mode (minimal disk storage only)
      } else {
        cumProjected += dailyRate;
        if (breachDay === null && cumProjected >= monthlyBudgetCap) {
          breachDay = d;
          const remainingToCap = Math.max(0, monthlyBudgetCap - prevProjected);
          breachHour = Math.min(
            23,
            Math.max(1, Math.round((remainingToCap / dailyRate) * 24))
          );
          if (autoBreakerArmed) {
            // Circuit breaker trips right at the budget cap!
            cumProjected = monthlyBudgetCap + 0.15;
          }
        }
      }

      days.push({
        day: d,
        baseline: Number(cumBaseline.toFixed(2)),
        projected: Number(cumProjected.toFixed(2)),
        unguardedCumulative: Number(unguardedMonthEnd.toFixed(2)),
      });
    }

    return {
      baseDaily: Number(baseDaily.toFixed(2)),
      surgeDaily: Number(initialSurgeDaily.toFixed(2)),
      peakSurgeDaily: Number(peakSurgeDaily.toFixed(2)),
      isExponential: activeScenario.curveType === 'EXPONENTIAL',
      compoundRate,
      baselineMonthEnd: Number((baseDaily * 30).toFixed(2)),
      projectedMonthEnd: Number(cumProjected.toFixed(2)),
      unguardedMonthEnd: Number(unguardedMonthEnd.toFixed(2)),
      savedByCircuitBreaker: autoBreakerArmed
        ? Number(Math.max(0, unguardedMonthEnd - cumProjected).toFixed(2))
        : 0,
      breachDay,
      breachHour,
      days,
    };
  }, [
    burn,
    activeScenario,
    monthlyBudgetCap,
    autoBreakerArmed,
    pricingVersion,
    unitPricing,
  ]);

  // ==========================================================================
  // 2. BLAST-RADIUS & FAILURE CASCADE X-RAY STATE
  // ==========================================================================
  const allLiveNodes = useMemo(() => {
    const nodes = [];
    const vpcs = overview?.vpcs || [];
    const firewalls = overview?.firewalls || [];
    const runServices = overview?.cloudRunServices || [];
    const buckets = (overview?.resources || []).filter(
      (r) => r.type === 'Cloud Storage Bucket'
    );
    const datasets = (overview?.resources || []).filter(
      (r) => r.type === 'BigQuery Dataset'
    );

    vpcs.forEach((v) =>
      nodes.push({
        id: `vpc:${v.name}`,
        name: v.name,
        kind: 'VPC Network',
        region: v.routingMode || 'GLOBAL',
        criticality: 'CRITICAL',
      })
    );
    firewalls.slice(0, 6).forEach((f) =>
      nodes.push({
        id: `fw:${f.name}`,
        name: f.name,
        kind: 'VPC Firewall Rule',
        region: f.network || 'default',
        criticality: (f.sourceRanges || []).includes('0.0.0.0/0')
          ? 'HIGH_EXPOSURE'
          : 'PROTECTED',
      })
    );
    runServices.forEach((s) =>
      nodes.push({
        id: `run:${s.name}`,
        name: s.name,
        kind: 'Cloud Run Service',
        region: s.region,
        criticality: 'PRODUCTION',
      })
    );
    vms.forEach((v) =>
      nodes.push({
        id: `vm:${v.name}`,
        name: v.name,
        kind: 'Compute Engine VM',
        region: v.zone,
        criticality: 'PRODUCTION',
      })
    );
    buckets.forEach((b) =>
      nodes.push({
        id: `gcs:${b.name}`,
        name: b.name,
        kind: 'Cloud Storage Bucket',
        region: b.region,
        criticality: 'DATA_STORE',
      })
    );
    datasets.forEach((d) =>
      nodes.push({
        id: `bq:${d.name}`,
        name: d.name,
        kind: 'BigQuery Dataset',
        region: d.region,
        criticality: 'DATA_STORE',
      })
    );

    if (nodes.length === 0) {
      nodes.push(
        {
          id: 'vpc:default',
          name: 'default',
          kind: 'VPC Network',
          region: 'GLOBAL',
          criticality: 'CRITICAL',
        },
        {
          id: 'run:cloudpulse-api',
          name: 'cloudpulse-api',
          kind: 'Cloud Run Service',
          region: 'us-east1',
          criticality: 'PRODUCTION',
        }
      );
    }
    return nodes;
  }, [overview, vms]);

  const [selectedBlastNodeId, setSelectedBlastNodeId] = useState('');
  const activeBlastNode = useMemo(
    () =>
      allLiveNodes.find((n) => n.id === selectedBlastNodeId) || allLiveNodes[0],
    [allLiveNodes, selectedBlastNodeId]
  );

  const blastCascade = useMemo(() => {
    if (!activeBlastNode) return null;
    if (activeBlastNode.kind === 'VPC Network') {
      return {
        impactScore: 98,
        headline: `Severing VPC "${activeBlastNode.name}" isolates all regional subnets, VMs, and firewall perimeters.`,
        upstream: ['Google Edge PoP / Cloud Router', 'Cloud NAT Gateway'],
        downstream: [
          `${vms.length || 1} Compute Engine VM(s) lose internal & external NIC routing`,
          `${(overview?.firewalls || []).length || 4} Firewall rules orphaned`,
          'Hybrid IAP SSH & Private Google Access tunnels severed',
        ],
        remediation: `gcloud compute networks describe ${activeBlastNode.name} --project=${projectId}`,
      };
    }
    if (activeBlastNode.kind === 'VPC Firewall Rule') {
      return {
        impactScore: 84,
        headline: `Modifying or deleting Firewall "${activeBlastNode.name}" immediately alters ingress packet filtering across "${activeBlastNode.region}".`,
        upstream: ['Public Internet (0.0.0.0/0)', 'Google IAP Proxy (35.235.240.0/20)'],
        downstream: [
          'Target VMs in VPC network immediately exposed or blocked on matched ports',
          'Active TCP/SSH sessions may drop or allow brute-force scanners if DENY shield removed',
        ],
        remediation: `gcloud compute firewall-rules update ${activeBlastNode.name} --priority=100 --enable-logging --project=${projectId}`,
      };
    }
    if (activeBlastNode.kind === 'Cloud Run Service') {
      return {
        impactScore: 76,
        headline: `Outage or misconfiguration on Cloud Run "${activeBlastNode.name}" (${activeBlastNode.region}) impacts HTTPS API consumers and downstream storage sinks.`,
        upstream: [
          'Global HTTPS Load Balancer / *.run.app Ingress',
          'Cloud IAM Invoker Policy',
        ],
        downstream: [
          'Connected Cloud Storage Buckets & BigQuery datasets stop receiving event writes',
          'Client HTTP requests receive 503 Service Unavailable if maxInstances=0',
        ],
        remediation: `gcloud run services update-traffic ${activeBlastNode.name} --to-latest --region=${activeBlastNode.region} --project=${projectId}`,
      };
    }
    return {
      impactScore: 72,
      headline: `Disrupting "${activeBlastNode.name}" (${activeBlastNode.kind} in ${activeBlastNode.region}) impacts stateful compute or analytics pipelines.`,
      upstream: ['VPC Subnet / IAM Service Account Principal'],
      downstream: [
        'Dependent Cloud Run microservices & BI dashboards fail read/write queries',
        'Automated snapshot / backup schedules interrupted',
      ],
      remediation: `gcloud asset search-all-resources --scope=projects/${projectId} --query="name:${activeBlastNode.name}"`,
    };
  }, [activeBlastNode, vms.length, overview?.firewalls, projectId]);

  // ==========================================================================
  // 3. NATURAL-LANGUAGE DREAM STACK ARCHITECT COMPILER STATE
  // ==========================================================================
  const [selectedArchetypeId, setSelectedArchetypeId] = useState('AI_RAG_GPU');
  const [customPromptNote, setCustomPromptNote] = useState(
    'Require 85%+ Carbon-Free Energy, strict Zero-Trust SSH block, and lowest Tier-1 monthly rate.'
  );

  const compiledBlueprint = useMemo(() => {
    const arch =
      DREAM_STACK_ARCHETYPES.find((a) => a.id === selectedArchetypeId) ||
      DREAM_STACK_ARCHETYPES[0];

    // Use our 40-region FinOps + Carbon + GPU SKU engine to pick the #1 optimal region!
    const eligibleRegions = GCP_GLOBAL_REGIONS.map((r) =>
      getRegionProfile(r.id)
    ).filter((prof) =>
      arch.requiresGpu ? prof.capabilities.cloudRunGpuL4 : true
    );

    const preferred = eligibleRegions.filter(
      (r) => r.continent === arch.preferredContinent
    );
    const pool = preferred.length > 0 ? preferred : eligibleRegions;

    // Sort by highest Carbon-Free Energy % and lowest priceMultiplier
    const bestRegion =
      [...pool].sort(
        (a, b) =>
          b.cfePercent - a.cfePercent || a.priceMultiplier - b.priceMultiplier
      )[0] || getRegionProfile('us-central1');

    const cpuScale =
      unitPricing.vcpuPerHourUsd / DEFAULT_UNIT_PRICING.vcpuPerHourUsd;
    const gpuScale =
      unitPricing.cloudRunL4GpuPerHourUsd /
      DEFAULT_UNIT_PRICING.cloudRunL4GpuPerHourUsd;
    const cudScale = Math.max(
      0.45,
      1 - (Number(unitPricing.cudDiscountPercent) || 0) / 100
    );
    const archScale = arch.requiresGpu
      ? cpuScale * 0.35 + gpuScale * 0.65
      : cpuScale;

    const adjustedMonthlyUsd = Number(
      (
        arch.estimatedBaseMonthlyUsd *
        bestRegion.priceMultiplier *
        archScale *
        cudScale
      ).toFixed(2)
    );

    const scriptLines = [
      `#!/usr/bin/env bash`,
      `# ============================================================================`,
      `# CloudPulse 2026 Autonomous Architecture Compiler`,
      `# Stack: ${arch.name}`,
      `# Auto-Selected Optimal Region: ${bestRegion.name} (${bestRegion.city})`,
      `# Grid Carbon: ${bestRegion.cfePercent}% CFE (${bestRegion.gco2} gCO2/kWh) · Pricing: ${bestRegion.priceMultiplier.toFixed(2)}x (${bestRegion.pricingTier})`,
      `# Constraints: ${customPromptNote}`,
      `# ============================================================================`,
      `set -euo pipefail`,
      `PROJECT_ID="${projectId}"`,
      `REGION="${bestRegion.id}"`,
      `ZONE="${bestRegion.zones[0]}"`,
      ``,
    ];

    arch.components.forEach((comp) => {
      if (comp.type === 'CLOUD_RUN') {
        scriptLines.push(
          `# Deploy Serverless Cloud Run: ${comp.name}`,
          `gcloud run deploy ${comp.name} \\`,
          `  --project="$PROJECT_ID" \\`,
          `  --region="$REGION" \\`,
          `  --image="us-docker.pkg.dev/cloudrun/container/hello" \\`,
          `  --cpu=${arch.requiresGpu ? 4 : 2} --memory=${
            arch.requiresGpu ? '16Gi' : '4Gi'
          } \\`,
          `  --min-instances=0 --max-instances=6 \\`,
          arch.requiresGpu
            ? `  --gpu=1 --gpu-type=nvidia-l4 --no-gpu-zonal-redundancy \\`
            : `  --billing=request --cpu-throttling \\`,
          `  --no-allow-unauthenticated`,
          ``
        );
      } else if (comp.type === 'COMPUTE_VM') {
        scriptLines.push(
          `# Provision Spot Compute Engine Worker VM: ${comp.name}`,
          `gcloud compute instances create ${comp.name} \\`,
          `  --project="$PROJECT_ID" \\`,
          `  --zone="$ZONE" \\`,
          `  --machine-type=e2-medium \\`,
          `  --provisioning-model=SPOT \\`,
          `  --boot-disk-size=20GB --boot-disk-type=pd-balanced`,
          ``
        );
      } else if (comp.type === 'GCS_BUCKET') {
        scriptLines.push(
          `# Create Zero-Trust Regional Storage Bucket: ${comp.name}`,
          `gcloud storage buckets create gs://${comp.name}-${projectId} \\`,
          `  --project="$PROJECT_ID" \\`,
          `  --location="$REGION" \\`,
          `  --uniform-bucket-level-access \\`,
          `  --public-access-prevention`,
          ``
        );
      } else if (comp.type === 'BIGQUERY') {
        scriptLines.push(
          `# Provision Serverless BigQuery Dataset: ${comp.name}`,
          `bq --location="$REGION" mk --dataset "$PROJECT_ID:${comp.name}"`,
          ``
        );
      } else if (comp.type === 'VPC_FIREWALL') {
        scriptLines.push(
          `# Enforce Priority-100 Zero-Trust Firewall Shield: ${comp.name}`,
          `gcloud compute firewall-rules create ${comp.name} \\`,
          `  --project="$PROJECT_ID" \\`,
          `  --Direction=INGRESS --priority=100 --action=DENY \\`,
          `  --rules=tcp:22,tcp:3389 --source-ranges=0.0.0.0/0 --enable-logging`,
          ``
        );
      }
    });

    return {
      arch,
      bestRegion,
      adjustedMonthlyUsd,
      script: scriptLines.join('\n'),
    };
  }, [
    selectedArchetypeId,
    customPromptNote,
    projectId,
    pricingVersion,
    unitPricing,
  ]);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(key);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Max Y value for the 30-day SVG chart
  const chartMaxUsd = Math.max(
    monthlyBudgetCap * 1.25,
    timeCrystalForecast.projectedMonthEnd * 1.1,
    50
  );

  return (
    <div className="space-y-6">
      {/* LIVE GCP BILLING CATALOG & VARIABLE FINOPS RATE ENGINE BAR */}
      <LivePricingCatalogControlBar
        projectId={projectId}
        selectedRegionId={compiledBlueprint.bestRegion.id}
      />

      {/* ==================================================================== */}
      {/* MODULE 1: 30-DAY BILLING ANOMALY FORECASTER & SPEND CAP SIMULATOR    */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full-full text-[10px] font-mono font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                PRE-CRIME FINOPS · BILLING TIME-CRYSTAL
              </span>
              <h4 className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  &ldquo;Pre-Crime&rdquo; 30-Day Billing Time-Crystal — Anomaly Forecaster &amp; 24/7 Spend Cap Circuit-Breaker
                </span>
              </h4>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Simulate traffic surges, infinite retry loops, or GPU billing
              spikes before they happen — see the exact day &amp; hour your budget
              cap would breach and arm an automatic 24/7 Google Cloud Spend Cap.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleToggleAndSyncLiveCircuitBreaker}
              disabled={syncingLiveBudget}
              className={`h-9 px-3.5 rounded-md text-xs font-mono font-bold border transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 ${
                autoBreakerArmed
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
              title="Provisions a permanent 24/7 Google Cloud Spend Cap (spendCap.inputState=CONFIGURED) + Pub/Sub Kill-Switch topic (cloudpulse-budget-killswitch) in Cloud Billing that works even when your browser is closed"
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>
                {syncingLiveBudget
                  ? 'Syncing 24/7 Cap to GCP...'
                  : autoBreakerArmed
                  ? `24/7 GCP Spend Cap: ARMED ($${monthlyBudgetCap}/mo in Cloud Billing)`
                  : '24/7 GCP Spend Cap: OFF (Click to Arm in GCP)'}
              </span>
            </button>

            {onOpenFinOps && (
              <button
                type="button"
                onClick={onOpenFinOps}
                className="h-9 px-3 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-mono font-extrabold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <span>Native Spend Caps (FinOps) →</span>
              </button>
            )}

            {onHibernateSleep && (
              <button
                type="button"
                onClick={onHibernateSleep}
                className="h-9 px-3.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/40 shadow-sm text-xs font-mono font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <Moon className="w-3.5 h-3.5 shrink-0" />
                <span>Emergency Park Compute</span>
              </button>
            )}
          </div>
        </div>

        {/* Scenario Selector & Monthly Budget Cap Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs font-mono">
          <div className="lg:col-span-7 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="block text-[10px] uppercase text-zinc-400 font-bold">
                What Happens If... (Select Cost Scenario to Forecast):
              </label>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                100% Read-Only Math Projection · Zero Traffic Sent
              </span>
            </div>
            <select
              value={scenarioId}
              onChange={(e) => {
                const nextId = e.target.value;
                setScenarioId(nextId);
                const nextScen = ANOMALY_SCENARIOS.find((s) => s.id === nextId);
                if (nextScen?.sliderMaxUsd) {
                  setCustomSliderMaxUsd(
                    Math.max(monthlyBudgetCap, nextScen.sliderMaxUsd)
                  );
                }
              }}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
            >
              {ANOMALY_SCENARIO_GROUPS.map(([catLabel, items]) => (
                <optgroup key={catLabel} label={catLabel}>
                  {items.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {activeScenario.description}
            </p>
            {activeScenario.newcomerTip && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Newcomer Prevention Guide:</strong>{' '}
                {activeScenario.newcomerTip}
              </div>
            )}
            {activeScenario.targetServiceLabel && (
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                Protected GCP Spend Cap Target:{' '}
                <span className="text-zinc-800 dark:text-zinc-200">
                  {activeScenario.targetServiceLabel}
                </span>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase text-zinc-400 font-bold">
                Monthly Hard Budget Cap:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-red-500">$</span>
                <input
                  type="number"
                  min={5}
                  max={500000}
                  step={5}
                  value={monthlyBudgetCap}
                  onChange={(e) => {
                    const nextVal = Math.max(5, Number(e.target.value) || 5);
                    setMonthlyBudgetCap(nextVal);
                    setCustomSliderMaxUsd(Math.max(25, nextVal));
                  }}
                  className="w-24 px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-900 border border-red-500/40 text-xs font-mono font-extrabold text-red-500 text-right"
                />
                <span className="text-[10px] font-bold text-zinc-400">
                  USD/mo
                </span>
              </div>
            </div>
            <input
              type="range"
              min={5}
              max={customSliderMaxUsd}
              step={Math.max(1, Math.round(customSliderMaxUsd / 200))}
              value={Math.min(monthlyBudgetCap, customSliderMaxUsd)}
              onChange={(e) => setMonthlyBudgetCap(Number(e.target.value))}
              className="w-full accent-red-500 cursor-pointer"
            />
            <div className="flex items-center justify-between gap-1 text-[10px] text-zinc-400 flex-wrap">
              {[
                { label: '$25 (Hobby)', val: 25 },
                { label: '$150 (Startup)', val: 150 },
                { label: '$500 (Growth)', val: 500 },
                {
                  label: `$${customSliderMaxUsd.toLocaleString()} (Max Scale)`,
                  val: customSliderMaxUsd,
                },
              ].map((preset, idx) => (
                <button
                  key={`${idx}-${preset.val}`}
                  type="button"
                  onClick={() => {
                    setMonthlyBudgetCap(preset.val);
                    if (preset.val > customSliderMaxUsd) {
                      setCustomSliderMaxUsd(preset.val);
                    }
                  }}
                  className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                    monthlyBudgetCap === preset.val
                      ? 'bg-red-500/15 text-red-500 border-red-500/40 font-bold'
                      : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 KPI Cards + 30-Day Interactive SVG Burn Curve */}
        {/* Plain-English Feature & Metric Guide Paragraph */}
        <div className="p-3.5 rounded-xl bg-blue-500/[0.06] dark:bg-blue-500/10 border border-blue-500/25 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 space-y-2">
          <div>
            <strong className="text-zinc-900 dark:text-zinc-100">
              How to read this 30-Day Billing Anomaly Forecaster:
            </strong>{' '}
            This tool takes your project&apos;s live hourly spend and simulates what
            happens over a 30-day month if an unexpected incident hits (such as a
            runaway retry loop, viral traffic surge, GPU spike, or DDoS egress
            flood). Below,{' '}
            <strong className="text-zinc-900 dark:text-zinc-100">
              Steady-State 30d Bill
            </strong>{' '}
            shows your normal monthly cost if nothing goes wrong;{' '}
            <strong className="text-red-600 dark:text-red-400">
              Unguarded Anomaly Bill (If Unstopped)
            </strong>{' '}
            shows how high your 30-day bill would climb if the anomaly kept burning
            all month with <em>no</em> budget cap or circuit-breaker;{' '}
            <strong className="text-amber-600 dark:text-amber-400">
              Budget Exhaustion ETA
            </strong>{' '}
            pinpoints the exact day and hour the surge crosses your{' '}
            <strong>${monthlyBudgetCap}/mo</strong> cap; and{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              Saved by Circuit-Breaker
            </strong>{' '}
            shows the exact dollar amount you save when the circuit-breaker trips at{' '}
            <strong>${monthlyBudgetCap}</strong> and freezes compute spend instead
            of letting the anomaly run unchecked.
          </div>
          <div className="pt-1.5 border-t border-blue-500/20 text-[11px] text-zinc-600 dark:text-zinc-400">
            <strong className="text-emerald-700 dark:text-emerald-300">
              24/7 Permanent Protection in Google Cloud (No Browser Required):
            </strong>{' '}
            When you click{' '}
            <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
              24/7 GCP Spend Cap: OFF (Click to Arm in GCP)
            </span>{' '}
            and confirm the safety prompt, CloudPulse provisions a permanent
            server-side{' '}
            <span className="font-mono font-bold">
              GoogleCloudBillingBudgetsV1SpendCap (inputState: CONFIGURED)
            </span>{' '}
            on <span className="font-mono">billingbudgets.googleapis.com/v1</span>{' '}
            plus a dedicated Cloud Pub/Sub Kill-Switch topic (
            <span className="font-mono">
              projects/{projectId || '<project>'}/topics/cloudpulse-budget-killswitch
            </span>
            ). In <strong>Google Cloud Console → Billing → Budgets &amp; alerts</strong>,
            it appears with <strong>Spend cap: Configured</strong> and enforces your{' '}
            <strong>${monthlyBudgetCap}/mo</strong> hard limit 24/7 on Google&apos;s
            servers even when your laptop is off.
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/85 dark:bg-zinc-950/85 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase">
              Steady-State 30d Bill
            </div>
            <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              ${timeCrystalForecast.baselineMonthEnd.toFixed(2)}
            </div>
            <div className="text-[10px] text-zinc-500">
              ${timeCrystalForecast.baseDaily}/day normal burn
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/85 dark:bg-zinc-950/85 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between gap-1">
              <div className="text-[10px] text-zinc-400 uppercase">
                Unguarded Anomaly Bill (If Unstopped)
              </div>
              {timeCrystalForecast.isExponential && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 text-[9px] font-bold">
                  {timeCrystalForecast.compoundRate}x/d EXP
                </span>
              )}
            </div>
            <div className="text-base font-extrabold text-red-500 mt-0.5">
              ${timeCrystalForecast.unguardedMonthEnd.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-[10px] text-red-400">
              {timeCrystalForecast.isExponential
                ? `$${timeCrystalForecast.surgeDaily}/d → $${timeCrystalForecast.peakSurgeDaily}/d peak`
                : `$${timeCrystalForecast.surgeDaily}/day during surge`}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/85 dark:bg-zinc-950/85 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase">
              Budget Exhaustion ETA
            </div>
            <div
              className={`text-base font-extrabold mt-0.5 ${
                timeCrystalForecast.breachDay
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}
            >
              {timeCrystalForecast.breachDay
                ? `Day ${timeCrystalForecast.breachDay} @ ${String(
                    timeCrystalForecast.breachHour
                  ).padStart(2, '0')}:00`
                : 'No Breach (Safe)'}
            </div>
            <div className="text-[10px] text-zinc-500">
              {timeCrystalForecast.breachDay
                ? `Hits $${monthlyBudgetCap} cap in ${timeCrystalForecast.breachDay} days`
                : `Stays under $${monthlyBudgetCap}/mo`}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">
              Saved by Circuit-Breaker
            </div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-300 mt-0.5">
              ${timeCrystalForecast.savedByCircuitBreaker.toFixed(2)} USD
            </div>
            <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
              {autoBreakerArmed
                ? `Capped at $${timeCrystalForecast.projectedMonthEnd.toFixed(2)}`
                : 'Arm breaker to cap spend'}
            </div>
          </div>
        </div>

        {/* 30-Day SVG Time-Crystal Projection Graph */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
            <span>
              30-Day Cumulative Spend Trajectory (Day 1 → Day 30)
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                Baseline (${timeCrystalForecast.baselineMonthEnd})
              </span>
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
                Projected w/ {autoBreakerArmed ? 'Circuit-Breaker' : 'Surge'} ($
                {timeCrystalForecast.projectedMonthEnd})
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-3 h-0.5 bg-red-500 inline-block" />
                Budget Cap (${monthlyBudgetCap})
              </span>
            </div>
          </div>

          <svg
            viewBox="0 0 760 170"
            className="w-full h-40 overflow-visible"
          >
            {/* Budget Cap Red Dashed Line */}
            {(() => {
              const capY =
                150 - Math.min(1, monthlyBudgetCap / chartMaxUsd) * 130;
              return (
                <g>
                  <line
                    x1={35}
                    y1={capY}
                    x2={740}
                    y2={capY}
                    stroke="#ea4335"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                  <text
                    x={736}
                    y={capY - 5}
                    textAnchor="end"
                    fill="#fb7185"
                    fontSize="9"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    CAP: ${monthlyBudgetCap}
                  </text>
                </g>
              );
            })()}

            {/* Day Bars & Trajectory Dots */}
            {timeCrystalForecast.days.map((pt, idx) => {
              const x = 40 + (idx / 29) * 695;
              const baseY = 150 - Math.min(1, pt.baseline / chartMaxUsd) * 130;
              const projY = 150 - Math.min(1, pt.projected / chartMaxUsd) * 130;
              const isBreachDay = timeCrystalForecast.breachDay === pt.day;

              return (
                <g key={pt.day}>
                  <line
                    x1={x}
                    y1={150}
                    x2={x}
                    y2={projY}
                    stroke={
                      isBreachDay
                        ? '#ea4335'
                        : pt.projected >= monthlyBudgetCap
                        ? '#10b981'
                        : '#4285f4'
                    }
                    strokeOpacity="0.28"
                    strokeWidth="6"
                  />
                  <circle cx={x} cy={baseY} r={2.2} fill="#669df6" />
                  <circle
                    cx={x}
                    cy={projY}
                    r={isBreachDay ? 5 : 3}
                    fill={
                      isBreachDay
                        ? '#ea4335'
                        : pt.projected >= monthlyBudgetCap && autoBreakerArmed
                        ? '#10b981'
                        : '#8ab4f8'
                    }
                  >
                    <title>{`Day ${pt.day}: Projected $${pt.projected} vs Baseline $${pt.baseline}`}</title>
                  </circle>
                  {isBreachDay && (
                    <text
                      x={x}
                      y={projY - 9}
                      textAnchor="middle"
                      fill="#fda4af"
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {autoBreakerArmed
                        ? `TRIPPED D${pt.day}`
                        : `BREACH D${pt.day}`}
                    </text>
                  )}
                  {(pt.day === 1 || pt.day % 5 === 0) && (
                    <text
                      x={x}
                      y={164}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="8.5"
                      fontFamily="monospace"
                    >
                      D{pt.day}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Auto-Mitigation Command Bar */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="text-zinc-700 dark:text-zinc-300 truncate max-w-2xl">
              <span className="text-blue-400 font-bold">
                Auto-Mitigation CLI:{' '}
              </span>
              <code className="text-emerald-700 dark:text-emerald-300">
                {activeScenario.mitigationCmd}
              </code>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy(activeScenario.mitigationCmd, 'MITIGATION')
              }
              className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold cursor-pointer flex items-center gap-1"
            >
              {copiedCmd === 'MITIGATION' ? (
                <>
                  <Check className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Mitigation Command</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODULE 2: INTERACTIVE BLAST-RADIUS & FAILURE CASCADE X-RAY           */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full-full text-[10px] font-mono font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                WHAT-IF BLAST-RADIUS X-RAY
              </span>
              <h4 className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                &ldquo;What-If&rdquo; Blast-Radius X-Ray — Resource Dependency &amp; Failure Impact Analyzer
              </h4>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select any live resource in <code>{projectId}</code> to trace its
              upstream entrypoints, downstream failure cascade, and self-healing
              CLI command before you modify or delete it.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {allLiveNodes.map((node) => {
              const isSelected = activeBlastNode?.id === node.id;
              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedBlastNodeId(node.id)}
                  className={`w-full p-2.5 rounded-md border text-left font-mono text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-zinc-100 font-bold'
                      : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/40'
                  }`}
                >
                  <div className="truncate">
                    <div className="truncate">{node.name}</div>
                    <div className="text-[10px] text-zinc-400">
                      {node.kind} · {node.region}
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                    Inspect
                  </span>
                </button>
              );
            })}
          </div>

          {blastCascade && (
            <div className="lg:col-span-8 p-4 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
                <div>
                  <span className="text-[10px] text-amber-500 font-extrabold uppercase">
                    Simulated Failure Target: {activeBlastNode.kind}
                  </span>
                  <h5 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                    {activeBlastNode.name} ({activeBlastNode.region})
                  </h5>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-500 font-extrabold text-xs">
                  Blast Severity: {blastCascade.impactScore}/100
                </span>
              </div>

              <p className="text-zinc-600 dark:text-zinc-300">
                {blastCascade.headline}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-blue-500">
                    ⬆Upstream Traffic & Auth Entrypoints
                  </div>
                  {blastCascade.upstream.map((u) => (
                    <div
                      key={u}
                      className="text-[11px] text-zinc-700 dark:text-zinc-300"
                    >
                      • {u}
                    </div>
                  ))}
                </div>

                <div className="p-2.5 rounded-lg bg-red-500/[0.06] border border-red-500/25 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-red-500">
                    ⬇Downstream Failure Cascade
                  </div>
                  {blastCascade.downstream.map((d) => (
                    <div
                      key={d}
                      className="text-[11px] text-red-700 dark:text-red-200"
                    >
                      • {d}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <code className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate max-w-xl">
                  {blastCascade.remediation}
                </code>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(blastCascade.remediation, 'BLAST_CMD')
                  }
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                >
                  {copiedCmd === 'BLAST_CMD' ? (
                    <>
                      <Check className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Verification CLI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MODULE 3: MULTI-REGION ARCHITECTURE & COST COMPILER                  */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full-full text-[10px] font-mono font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30">
                DREAM STACK COMPILER
              </span>
              <h4 className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                Dream Stack Compiler — Multi-Region Cloud Stack &amp; Cost Architect (SKU + FinOps + Carbon Optimized)
              </h4>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Select a target production architecture — the compiler scans all
              40 GCP regions for GPU/SKU compatibility, lowest Tier-1 pricing,
              and highest Carbon-Free Energy %, then synthesizes the complete
              multi-resource bill of materials & deployment script.
            </p>
          </div>
        </div>

        {/* Archetype Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5">
          {DREAM_STACK_ARCHETYPES.map((arch) => {
            const active = selectedArchetypeId === arch.id;
            return (
              <button
                key={arch.id}
                type="button"
                onClick={() => setSelectedArchetypeId(arch.id)}
                className={`p-3 rounded-md border text-left font-mono transition-all cursor-pointer ${
                  active
                    ? 'bg-emerald-500/20 border-emerald-500 text-zinc-950 dark:text-zinc-100 shadow-sm'
                    : 'bg-white/80 dark:bg-zinc-950/75 border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50'
                }`}
              >
                <div className="text-xs font-extrabold">{arch.name}</div>
                <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                  {arch.summary}
                </p>
              </button>
            );
          })}
        </div>

        {/* Custom Constraint Input */}
        <div className="flex flex-col sm:flex-row gap-2 text-xs font-mono">
          <input
            type="text"
            value={customPromptNote}
            onChange={(e) => setCustomPromptNote(e.target.value)}
            placeholder="Add custom architectural constraints (e.g. EU GDPR residency, NVIDIA L4 GPU, max $50/mo)..."
            className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100"
          />
          <div className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2 shrink-0">
            <span>
              Optimal Region: {compiledBlueprint.bestRegion.name} (
              {compiledBlueprint.bestRegion.cfePercent}% CFE)
            </span>
            <span>·</span>
            <span>Est. ${compiledBlueprint.adjustedMonthlyUsd}/mo</span>
          </div>
        </div>

        {/* Compiled Bill of Materials + Ready-to-Run Script */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs font-mono">
          <div className="lg:col-span-5 space-y-2">
            <div className="text-[10px] font-bold uppercase text-zinc-400">
              Compiled Bill of Materials ({compiledBlueprint.bestRegion.name} ·{' '}
              {compiledBlueprint.bestRegion.city})
            </div>
            {compiledBlueprint.arch.components.map((c) => (
              <div
                key={c.name}
                className="p-2.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                    {c.name}{' '}
                    <span className="text-[10px] text-blue-500">
                      [{c.type}]
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500">{c.spec}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-extrabold text-emerald-600 dark:text-emerald-400">
                    $
                    {(
                      c.monthlyUsd *
                      compiledBlueprint.bestRegion.priceMultiplier
                    ).toFixed(2)}
                    /mo
                  </div>
                  {onOpenProvision && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenProvision(c.type, {
                          region: compiledBlueprint.bestRegion.id,
                          zone: compiledBlueprint.bestRegion.zones[0],
                        })
                      }
                      className="text-[10px] text-blue-500 hover:underline cursor-pointer"
                    >
                      Provision →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase text-zinc-400">
                Synthesized Multi-Resource Automation Script (gcloud + bq)
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(compiledBlueprint.script, 'BLUEPRINT_SH')
                }
                className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1"
              >
                {copiedCmd === 'BLUEPRINT_SH' ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied Script!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Full Stack Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="flex-1 p-3 rounded-xl bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-300 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono overflow-x-auto max-h-64">
              {compiledBlueprint.script}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
