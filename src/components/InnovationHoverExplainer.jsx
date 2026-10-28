import React, { useState, useEffect, useRef } from 'react';
import { Info, ShieldCheck, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';

/**
 * Structured Enterprise Knowledge Base for CloudPulse 2026 Innovations, Studios, Sub-Tabs & Action Buttons.
 * Every entry provides a 4-point breakdown on hover:
 *   1. title: Full un-truncated name
 *   2. whatItDoes: Plain-English explanation of what happens when clicked
 *   3. enterpriseValue: Why enterprise teams use this capability (business / operational outcome)
 *   4. gcpApis: Exact Google Cloud APIs, MCP servers, or CLI primitives used under the hood
 *   5. safetyMode: 'READ_ONLY' | 'LIVE_MUTATION' | 'SIMULATION'
 */
export const INNOVATION_FEATURE_GUIDE = {
  // ============================================================================
  // 1. PRIMARY 20 STUDIO NAVIGATION TABS (App.jsx)
  // ============================================================================
  OVERVIEW: {
    badge: 'EXECUTIVE CONTROL PLANE',
    title: 'Project Overview & 5-Domain Studio Directory',
    whatItDoes:
      'Displays real-time inventory, hourly/monthly burn rate, 5-Domain Studio Launcher, and the live Resource Control Center for your selected GCP project.',
    enterpriseValue:
      'Gives Cloud Architects and SREs a single-pane-of-glass summary of every active VM, Cloud Run service, bucket, dataset, and VPC without clicking through dozens of console pages.',
    gcpApis: 'cloudresourcemanager.googleapis.com · compute · run · storage · bigquery',
    safetyMode: 'READ_ONLY',
  },
  INNOVATION_LAB: {
    badge: '22 BEYOND-CONSOLE STUDIOS',
    title: '2026 Innovation Lab — Predictive FinOps, Resilience & Autonomous SRE Suite',
    whatItDoes:
      'Opens 22 specialized engineering tools organized across 6 domains: 10-Persona Architecture Council, Waves 11–15 Moonshots, 2026 Quantum Nexus, Pre-Crime Billing Forecaster, Dream Stack Compiler, Reverse-Terraform, and Storage RAM DLP.',
    enterpriseValue:
      'Automates complex day-2 cloud operations—such as 30-day billing anomaly forecasting, point-in-time state rollback, SLSA provenance verification, and ClickOps-to-Terraform export.',
    gcpApis: 'billingbudgets · bigquery · storage · secretmanager · cloudbuild · modelarmor',
    safetyMode: 'READ_ONLY',
  },
  MCP_HUB: {
    badge: '48 OFFICIAL GCP MCP SERVERS',
    title: 'Google-Managed Remote Model Context Protocol (MCP) Hub',
    whatItDoes:
      'Connects directly to Google Cloud’s 48 official https://*.googleapis.com/mcp endpoints over JSON-RPC 2.0 to inspect live tools/list schemas, invoke tools/call with safety gates, run 4-server triage chains, and export IDE configs.',
    enterpriseValue:
      'Lets AI/MLOps engineers and platform teams test, govern, and export official Google Cloud MCP tool configurations for Gemini CLI, Claude Code, and Cursor with zero local proxy setup.',
    gcpApis: 'https://*.googleapis.com/mcp (JSON-RPC 2.0) · Vertex AI Gemini 3.8 Flash',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP: {
    badge: '40 REGIONS & SUBSEA CABLES',
    title: 'Global Network World Map — 40 GCP Regions, Subsea Fiber & Carbon Grid',
    whatItDoes:
      'Visualizes all 40 Google Cloud regions on an interactive map with live resource pins, subsea cable corridors, regional Carbon-Free Energy (CFE %), Tier-1/Tier-2 pricing multipliers, and GPU SKU availability.',
    enterpriseValue:
      'Helps architects place workloads in the lowest-latency, lowest-cost, and lowest-carbon GCP regions while verifying data residency compliance.',
    gcpApis: 'compute.googleapis.com/v1/regions · Cloud Billing SKU Catalog · Cloud Carbon Footprint',
    safetyMode: 'READ_ONLY',
  },
  VPC_NETWORKS: {
    badge: 'NETOPS & ZERO-TRUST',
    title: 'VPC Networks, Subnets & Zero-Trust Firewall Studio',
    whatItDoes:
      'Audits VPC networks, regional subnets, BGP routing modes, and ingress/egress firewall rules, highlighting risky 0.0.0.0/0 rules on SSH (22) and RDP (3389).',
    enterpriseValue:
      'Eliminates public network exposure by replacing open 0.0.0.0/0 ports with Priority-100 DENY shields and Identity-Aware Proxy (IAP 35.235.240.0/20) tunnels.',
    gcpApis: 'compute.googleapis.com/v1/projects/{project}/global/networks & firewalls',
    safetyMode: 'READ_ONLY',
  },
  VM_SSH: {
    badge: 'COMPUTE & WEB-SSH',
    title: 'Compute Engine VM Fleet, Browser Web-SSH & SFTP Workbench',
    whatItDoes:
      'Manages Compute Engine VMs (Start, Stop, Reset, Machine-Type Resize, Disk Resize, Snapshot) and opens an in-browser xterm.js SSH terminal and SFTP file manager.',
    enterpriseValue:
      'Provides instant browser-based SSH debugging and live vertical scaling without managing local SSH keys or bastion hosts.',
    gcpApis: 'compute.googleapis.com/v1/instances · WebSocket PTY SSH Tunnel',
    safetyMode: 'READ_ONLY',
  },
  CLOUD_STORAGE: {
    badge: 'OBJECT STORAGE & WORM',
    title: 'Cloud Storage Studio — Multi-Format Workbench, DLP & SEC 17a-4 WORM Lock',
    whatItDoes:
      'Browses and edits live GCS objects (Parquet, Avro, JSONL, CSV, Images, PDFs), imports AWS S3/MinIO buckets, and enforces Uniform IAM, Soft-Delete, CMEK, and WORM retention locks.',
    enterpriseValue:
      'Protects enterprise data lakes against accidental deletion, ransomware encryption, and public bucket leaks while enabling zero-copy BigLake analytics.',
    gcpApis: 'storage.googleapis.com/storage/v1/b · BigQuery External Tables',
    safetyMode: 'READ_ONLY',
  },
  CLOUD_RUN: {
    badge: 'SERVERLESS & L4 GPU',
    title: 'Cloud Run v2 Serverless Fleet, Canary Traffic Splitter & GPU Studio',
    whatItDoes:
      'Manages Cloud Run v2 services, revision traffic splitting (blue/green & canary), scale-to-zero settings (minInstances=0), and NVIDIA L4 GPU attachment.',
    enterpriseValue:
      'Ensures zero idle compute cost for bursty microservices and safe progressive rollouts with 1-click revision rollback.',
    gcpApis: 'run.googleapis.com/v2/projects/{project}/locations/{region}/services',
    safetyMode: 'READ_ONLY',
  },
  BIGQUERY_STUDIO: {
    badge: 'SERVERLESS LAKEHOUSE',
    title: 'BigQuery SQL Workbench, Dry-Run Cost Estimator & 7-Day Time-Machine',
    whatItDoes:
      'Executes live Standard SQL queries with pre-execution byte/cost dry-runs, inspects dataset/table schemas, and queries historical table snapshots via FOR SYSTEM_TIME AS OF.',
    enterpriseValue:
      'Prevents expensive full-table scan surprises before a query runs and recovers accidentally deleted or mutated rows without restoring from backups.',
    gcpApis: 'bigquery.googleapis.com/bigquery/v2/projects/{project}/jobs & datasets',
    safetyMode: 'READ_ONLY',
  },
  FINOPS: {
    badge: '24/7 SPEND CAPS & CUD',
    title: 'FinOps & Billing Guardian — Native GCP Spend Caps & Cost Attribution',
    whatItDoes:
      'Configures permanent server-side Google Cloud Billing Budgets with Native Spend Caps (spendCap.inputState=CONFIGURED) and Pub/Sub kill-switch topics.',
    enterpriseValue:
      'Enforces hard monthly dollar ceilings on Google’s servers 24/7—even when your browser is closed—to prevent surprise cloud bills.',
    gcpApis: 'billingbudgets.googleapis.com/v1 · cloudbilling.googleapis.com/v1',
    safetyMode: 'READ_ONLY',
  },
  GKE_STUDIO: {
    badge: 'KUBERNETES & AUTOPILOT',
    title: 'Google Kubernetes Engine (GKE) Autopilot, Spot GPUs & K8s YAML Studio',
    whatItDoes:
      'Inspects GKE Autopilot and Standard clusters, node pools, Spot GPU attachments, Pod OOM/CPU right-sizing, and generates production Kubernetes YAML manifests.',
    enterpriseValue:
      'Optimizes GKE cluster utilization, eliminates over-provisioned Pod memory requests, and enforces Workload Identity Federation.',
    gcpApis: 'container.googleapis.com/v1/projects/{project}/locations/*/clusters',
    safetyMode: 'READ_ONLY',
  },
  WAVE9_STUDIO: {
    badge: 'CI/CD & SUPPLY CHAIN',
    title: 'Cloud Build CI/CD, Artifact Registry & SLSA-3 SBOM Supply-Chain Studio',
    whatItDoes:
      'Manages Cloud Build pipelines, Artifact Registry container repositories, @sha256 digest pinning, and SLSA Level 3 software bill of materials (SBOM) attestations.',
    enterpriseValue:
      'Prevents untrusted or mutable container images from deploying to production.',
    gcpApis: 'cloudbuild.googleapis.com · artifactregistry.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  FUNCTIONS_STUDIO: {
    badge: 'EVENT-DRIVEN SERVERLESS',
    title: 'Cloud Run Functions (v1/v2) & 90+ Eventarc Trigger Studio',
    whatItDoes:
      'Creates, inspects, and tests event-driven Cloud Run Functions triggered by Cloud Storage uploads, Pub/Sub messages, BigQuery jobs, or Cloud Audit Logs via Eventarc.',
    enterpriseValue:
      'Automates event-driven microservices and real-time compliance reactions without managing servers.',
    gcpApis: 'cloudfunctions.googleapis.com/v2 · eventarc.googleapis.com/v1',
    safetyMode: 'READ_ONLY',
  },
  CLOUD_SQL_STUDIO: {
    badge: 'RELATIONAL & PGVECTOR',
    title: 'Cloud SQL (PostgreSQL 17 / MySQL 8.4) & AlloyDB Vector Studio',
    whatItDoes:
      'Manages Cloud SQL and AlloyDB instances, connection pooling, zero-downtime concurrent indexes, point-in-time recovery (PITR) clones, and pgvector AI embeddings.',
    enterpriseValue:
      'Prevents database lock contention and connection exhaustion while enabling sub-millisecond vector similarity search.',
    gcpApis: 'sqladmin.googleapis.com/v1 · alloydb.googleapis.com/v1',
    safetyMode: 'READ_ONLY',
  },
  DATA_ENGINEER_STUDIO: {
    badge: 'LAKEHOUSE PIPELINES',
    title: 'Data Engineering Studio — Medallion ELT, Dataform SQLX & Serverless Spark',
    whatItDoes:
      'Designs Bronze -> Silver -> Gold Medallion pipelines, column-level lineage graphs, quarantine dead-letter (_dlq) replay, and Dataproc Serverless Spark jobs.',
    enterpriseValue:
      'Catches schema-breaking changes before downstream BI dashboards or ML feature views break.',
    gcpApis: 'dataform.googleapis.com · dataproc.googleapis.com · bigquery.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  BIGLAKE_STUDIO: {
    badge: 'OPEN ICEBERG LAKEHOUSE',
    title: 'BigLake Studio — Apache Iceberg REST Catalogs, Compaction & Cross-Cloud Omni',
    whatItDoes:
      'Manages BigLake Metastore catalogs, open Apache Iceberg tables on Cloud Storage, automated small-file compaction, and BigQuery Omni cross-cloud queries (AWS S3 / Azure ADLS).',
    enterpriseValue:
      'Unifies warehouse performance and fine-grained column/row security over open Parquet and Iceberg files in Cloud Storage.',
    gcpApis: 'biglake.googleapis.com/v1 · bigqueryconnection.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  WAVE10_FRONTIER: {
    badge: 'GLOBALLY DISTRIBUTED DB',
    title: 'Cloud Spanner Frontier Studio — 100-PU Sizer, ISO GQL Property Graph & ScaNN RAG',
    whatItDoes:
      'Sizes granular 100-Processing-Unit (~$65/mo) Spanner instances, executes ISO Graph Query Language (GQL) property graph traversals, and runs ScaNN vector search.',
    enterpriseValue:
      'Delivers 99.999% multi-region relational consistency, graph analytics, and vector search in a single database engine.',
    gcpApis: 'spanner.googleapis.com/v1',
    safetyMode: 'READ_ONLY',
  },
  SOVEREIGN_STUDIO: {
    badge: 'ZERO-TRUST IAM & KMS',
    title: 'Sovereign IAM & Time-Machine Studio — SA Key Kill-Switch, JIT & Secret Vault',
    whatItDoes:
      'Audits IAM bindings, disables leaked Service Account JSON keys in 1 click, manages Secret Manager versions, and tracks SHA-256 IAM policy drift over time.',
    enterpriseValue:
      'Eliminates static service account keys and enforces least-privilege access across your project.',
    gcpApis: 'iam.googleapis.com · secretmanager.googleapis.com · cloudkms.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  CLOUD_SOC: {
    badge: '20-PILLAR AUTONOMOUS SOC',
    title: 'Autonomous Cloud SOC — Kill-Chain Detection, Model Armor & SOAR Playbooks',
    whatItDoes:
      'Correlates Cloud Audit Logs, VPC Flow Logs, IAM escalations, and Vertex AI Model Armor telemetry into automated SOAR containment playbooks.',
    enterpriseValue:
      'Detects and isolates credential compromise, cryptomining, and data exfiltration attempts in real time.',
    gcpApis: 'logging.googleapis.com · securitycenter · modelarmor.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  SRE_WAR_ROOM: {
    badge: '12-PILLAR INCIDENT COMMAND',
    title: 'SRE Incident War-Room — 14.4x SLO Burn Gate, Synthetic Prober & VPC-SC Perimeter',
    whatItDoes:
      'Monitors multi-window SLO error-budget burn rates (1h / 6h), correlates recent deployments against latency spikes, and stages 1-click canary rollbacks.',
    enterpriseValue:
      'Slashes Mean Time to Detect (MTTD) and Mean Time to Recover (MTTR) during production incidents.',
    gcpApis: 'monitoring.googleapis.com/v3 · logging.googleapis.com · accesscontextmanager',
    safetyMode: 'READ_ONLY',
  },
  AWS_AZURE_PARITY: {
    badge: 'MULTI-CLOUD TRANSLATOR',
    title: 'AWS, Azure, Alibaba & Huawei to Google Cloud Parity & Migration Bridge',
    whatItDoes:
      'Maps 28 service categories across AWS, Azure, Alibaba Cloud, Huawei Cloud, and GCP, comparing TCO pricing and translating IAM policies and architectures into native GCP equivalents.',
    enterpriseValue:
      'Accelerates multi-cloud migrations and architecture reviews for teams moving workloads from AWS or Azure to Google Cloud.',
    gcpApis: 'Multi-Cloud SKU & Service Equivalence Engine',
    safetyMode: 'READ_ONLY',
  },
  LOGS_SHELL: {
    badge: 'LIVE LOGS & CLOUD SHELL',
    title: 'Live Cloud Logging Streamer, Trace Waterfall & Integrated Cloud Shell',
    whatItDoes:
      'Streams real-time Cloud Audit and container logs alongside an interactive browser terminal pre-authenticated with gcloud, bq, and gsutil.',
    enterpriseValue:
      'Lets engineers inspect live logs and run remediation CLI commands side-by-side without leaving the cockpit.',
    gcpApis: 'logging.googleapis.com/v2/entries:list · WebSocket PTY Shell',
    safetyMode: 'READ_ONLY',
  },
  DOCS_GUIDE: {
    badge: 'ARCHITECTURE & API REFERENCE',
    title: 'Interactive CloudPulse Architecture & Google Cloud API Guide',
    whatItDoes:
      'Documents every studio, REST endpoint, authentication flow, and safety guardrail built into the CloudPulse 2026 platform.',
    enterpriseValue:
      'Helps new team members onboard quickly and understand how every dashboard action maps to official Google Cloud APIs.',
    gcpApis: 'Interactive Documentation & Reference Blueprint',
    safetyMode: 'READ_ONLY',
  },

  // ============================================================================
  // 2. 22 INNOVATION LAB STUDIOS (Revolutionary2026Suite.jsx)
  // ============================================================================
  FIVE_PERSONA_COUNCIL: {
    badge: '10-PERSONA ARCHITECTURE COUNCIL',
    title: '10-Persona War-Room — Enterprise Architecture Review Council',
    whatItDoes:
      'Runs a coordinated pre-flight audit of your live project from 10 specialized engineering perspectives: Cloud Architect, Cloud Engineer, Data Engineer, NetOps, DevSecOps, AI/MLOps, SRE Commander, DBRE, FinOps, and K8s Platform Engineer.',
    enterpriseValue:
      'Replaces weeks of manual architecture review meetings with an automated readiness scorecard, SHA-256 state diff, and role-specific remediation scripts before production launch.',
    gcpApis: 'Multi-API Live Inspection (Compute, Run, GCS, BQ, IAM, Billing, GKE, SQL)',
    safetyMode: 'READ_ONLY',
  },
  WAVE16_ENTERPRISE_MOONSHOT: {
    badge: 'DR GAMEDAY, FINOPS & SQL SURGEON',
    title: 'Multi-Region DR GameDay & SQL Surgeon — FinOps Anomaly Auto-Fixer, RTO/RPO Prover & IAM Surgeon',
    whatItDoes:
      'Provides 4 live operational engines: (1) FinOps Anomaly Auto-Fixer (GCS Lifecycle & Cloud Run Scale-to-Zero), (2) Multi-Region Disaster Recovery (DR) GameDay & RTO/RPO Prover with 1-Click Secondary Region Mirroring, (3) Least-Privilege Custom IAM Role Synthesizer, and (4) BigQuery SQL Dry-Run Cost Surgeon.',
    enterpriseValue:
      'Proves multi-region disaster recovery readiness before an outage occurs, mirrors single-region buckets/datasets to a standby region in 1 click, and eliminates full-table BigQuery scan waste.',
    gcpApis: 'storage.googleapis.com · bigquery.googleapis.com · run.googleapis.com/v2 · iam.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  WAVE15_DYSON_MOONSHOT: {
    badge: 'ANALYTICS, SLSA & LOG RCA',
    title: 'Supply-Chain SLSA & Log RCA Studio — BigQuery Anomaly SQL, SLSA Supply-Chain, Log Surgeon & TLS 1.3',
    whatItDoes:
      'Combines 4 live production tools: (1) BigQuery Z-Score & Cosine Vector SQL Engine, (2) Cloud Build + Artifact Registry SLSA v1.0 Provenance Attestor, (3) Cloud Logging + Gemini 3.8 Flash Root-Cause Surgeon, and (4) Live TLS 1.3 X.509 Certificate Inspector.',
    enterpriseValue:
      'Gives data, security, and SRE teams cryptographic container provenance (SLSA Level 3), automated log root-cause analysis, and live SSL/TLS certificate expiration monitoring.',
    gcpApis: 'bigquery.googleapis.com · cloudbuild · artifactregistry · logging · Node tls.connect',
    safetyMode: 'READ_ONLY',
  },
  WAVE14_QUANTUM_DOCTOR: {
    badge: 'PITR, DRIFT & PQC VAULT',
    title: 'Self-Healing Cloud Doctor & PITR — BigQuery Time-Travel, Self-Healing Drift Fix, IAM Graph & PQC Vault',
    whatItDoes:
      'Provides 4 live remediation engines: (1) BigQuery FOR SYSTEM_TIME AS OF point-in-time recovery diff, (2) Self-Healing Cloud Doctor that repairs GCS/BQ/Secret configuration drift via live PATCH calls, (3) IAM Permission Blast-Radius Graph, and (4) Hybrid Post-Quantum (X25519 + SHAKE256 + AES-256-GCM) Secret Manager Vault.',
    enterpriseValue:
      'Recovers corrupted data without backups, automatically heals compliance drift across storage and secrets, and protects high-value credentials against future quantum decryption.',
    gcpApis: 'bigquery · storage · secretmanager · cloudresourcemanager:getIamPolicy',
    safetyMode: 'READ_ONLY',
  },
  WAVE13_STARLINK_NEURALINK: {
    badge: 'GEO-FAILOVER & PROMPT-TO-DAG',
    title: 'Global Edge & Prompt-to-DAG Studio — Multi-Region TLS 1.3 Probe, Prompt-to-DAG & Ed25519 Ledger',
    whatItDoes:
      'Delivers 4 capabilities: (1) 6-Region Live HTTPS/TLS 1.3 Handshake Probe & BigQuery Geo-Failover Streamer, (2) Natural-Language Prompt-to-4-Node GCP Resource Builder, (3) 3-Agent FinOps/SecOps/SRE Review Board, and (4) RFC 8032 Ed25519 Cryptographically Signed Audit Ledger.',
    enterpriseValue:
      'Measures real intercontinental failover latency, compiles plain-English requirements into live hardened GCP resources, and produces tamper-evident Ed25519 audit receipts for compliance.',
    gcpApis: 'storage · bigquery · secretmanager · Vertex AI Gemini 3.8 Flash · Node crypto Ed25519',
    safetyMode: 'READ_ONLY',
  },
  WAVE12_ROADSTER: {
    badge: 'DRIFT RECONCILER & 12-WAY MCP',
    title: 'Autonomous Drift & Migration Deck — Closed-Loop Drift Reconciler, Cross-Project Migrator & 12-Way MCP Probe',
    whatItDoes:
      'Provides: (1) Closed-loop Cloud Drift Reconciler with SHA-256 state receipts, (2) Server-side Cross-Project Resource Migrator (cloning GCS buckets, BigQuery datasets/tables, and secrets between projects), (3) 12-Service Parallel MCP Latency Waterfall, and (4) Grounded Gemini Flight Director.',
    enterpriseValue:
      'Enables zero-local-bandwidth cross-project migrations over Google’s internal backbone and benchmarks 12 official *.googleapis.com/mcp servers in a single parallel burst.',
    gcpApis: 'storage rewriteTo · bigquery copy · secretmanager · 12 *.googleapis.com/mcp endpoints',
    safetyMode: 'READ_ONLY',
  },
  WAVE11_MOONSHOT: {
    badge: 'CANARY DEPLOY, FIRESTORE & QUOTAS',
    title: 'Release & Multi-Project Studio — Cloud Deploy Canary Pipelines, Firestore NoSQL, Quotas & Multi-Project',
    whatItDoes:
      'Unlocks live Google Cloud Deploy progressive canary pipelines, Cloud Firestore NoSQL document CRUD explorer, Active Assist Recommender + regional quota gauges, Multi-Project Estate Matrix, and 1-Click Cloud Run self-hosting export.',
    enterpriseValue:
      'Brings progressive delivery (25% -> 50% -> 100% canary rollouts), serverless NoSQL inspection, and multi-project governance into a single operational workspace.',
    gcpApis: 'clouddeploy.googleapis.com · firestore.googleapis.com · recommender · serviceusage',
    safetyMode: 'READ_ONLY',
  },
  GCLOUD_ALPHA_BETA: {
    badge: 'GOOGLE CLOUD SDK 590.0.1 LAB',
    title: '[SDK 590.0.1] Google Cloud CLI Lab — Worker Pools, Cluster Director, Model Armor & PAM JIT',
    whatItDoes:
      'Interactive workbench for the newest Google Cloud SDK 590.0.1 [GA], [BETA], and [ALPHA] capabilities: Cloud Run Worker Pools & Multi-Region Services, Agent Registry & Identity, Privileged Access Manager (PAM) JIT IAM, Model Armor, Cluster Director, and Cloud Quotas Adjuster.',
    enterpriseValue:
      'Lets engineers test and generate exact production CLI commands and REST payloads for newly released 2026 Google Cloud capabilities without memorizing complex flags.',
    gcpApis: 'run v2beta · privilegedaccessmanager · modelarmor · quotalimits · observability',
    safetyMode: 'READ_ONLY',
  },
  QUANTUM_NEXUS: {
    badge: '5-IN-1 CLOUD RESILIENCE SUITE',
    title: '2026 Quantum Nexus — Blast-Radius Simulator, State Rollback, FinOps Breaker, PR Previews & Honey-Grid',
    whatItDoes:
      'Integrates 5 resilience tools: (1) Cross-Cloud Causal Blast-Radius Simulator, (2) Immutable Project State Time-Machine & 1-Click Rollback, (3) Autonomous FinOps Circuit-Breaker, (4) Ephemeral PR Shadow-Traffic Previews, and (5) Zero-Trust Honey-Token Canary Tripwires.',
    enterpriseValue:
      'Gives enterprise SRE and Security teams pre-incident blast-radius visibility, 1-click configuration rollback, and active honey-token intrusion detection.',
    gcpApis: 'compute · run · storage · bigquery · iam · billingbudgets',
    safetyMode: 'READ_ONLY',
  },
  MODEL_ARMOR_FINOPS: {
    badge: 'GENAI SECURITY & -80% CACHE',
    title: 'Vertex AI Model Armor Firewall & Context Cache Cost Calculator',
    whatItDoes:
      'Scans prompts against Vertex AI Model Armor rules to block prompt injection, jailbreaks, and PII/secret exfiltration, and calculates monthly token savings from Gemini Context Caching (-80% input token cost).',
    enterpriseValue:
      'Secures enterprise LLM applications against OWASP LLM01 Prompt Injection while cutting high-volume RAG and system-prompt token bills by up to 80%.',
    gcpApis: 'modelarmor.googleapis.com · aiplatform.googleapis.com (Context Caching)',
    safetyMode: 'READ_ONLY',
  },
  DREAM_BRAIN: {
    badge: 'PREDICTIVE FINOPS & ARCHITECT',
    title: 'Pre-Crime Bill & Dream Stack — 30-Day Billing Forecaster, Blast-Radius X-Ray & Stack Compiler',
    whatItDoes:
      'Contains 3 flagship tools: (1) "Pre-Crime" 30-Day Billing Time-Crystal that simulates 22 cost-runaway scenarios (leaked Gemini keys, recursive agents, NAT egress, unpartitioned BQ scans) and arms a 24/7 GCP Spend Cap, (2) "What-If" Resource Blast-Radius X-Ray, and (3) "Dream Stack" Multi-Region Architecture & Cost Compiler.',
    enterpriseValue:
      'Predicts the exact day and hour a cost anomaly will breach your budget before it happens, enforces a 24/7 server-side Spend Cap in Cloud Billing, and generates cost- & carbon-optimized deployment scripts.',
    gcpApis: 'billingbudgets.googleapis.com/v1 · cloudbilling SKU Catalog · 40-Region CFE Engine',
    safetyMode: 'READ_ONLY',
  },
  TERRAFORM: {
    badge: 'CLICKOPS-TO-GITOPS EXPORT',
    title: 'Reverse-Terraform — Live Project to main.tf, Terraform 1.5+ Import Blocks & gcloud Exporter',
    whatItDoes:
      'Scans your live GCP project (VPCs, Firewalls, VMs, Cloud Run v2, GCS Buckets, BigQuery Datasets, GKE, Cloud SQL, Secrets, and Service Accounts) and generates ready-to-run Terraform HCL (main.tf), Terraform 1.5+ import{} blocks, and idempotent gcloud shell scripts.',
    enterpriseValue:
      'Eliminates manual Terraform authoring for resources created in the console ("ClickOps") and brings existing infrastructure under GitOps version control in seconds.',
    gcpApis: 'compute · run · storage · bigquery · container · sqladmin · secretmanager · iam',
    safetyMode: 'READ_ONLY',
  },
  X6: {
    badge: 'AES-256-GCM IN-MEMORY VAULT',
    title: 'Zero-Disk RAM Vault — Encrypted Gemini API Key & Live SRE Assistant',
    whatItDoes:
      'Encrypts your Gemini / Vertex AI credentials in volatile server RAM using AES-256-GCM (never written to disk or database) to power live architecture, FinOps, and SRE troubleshooting.',
    enterpriseValue:
      'Allows enterprise engineers to use AI-assisted cloud debugging with strict zero-disk-persistence credential hygiene.',
    gcpApis: 'Node.js crypto AES-256-GCM RAM Vault · Vertex AI / Gemini API',
    safetyMode: 'READ_ONLY',
  },
  FINOPS_SLEEP: {
    badge: 'NIGHT-MODE COMPUTE HIBERNATION',
    title: 'Night-Mode Sleep & Burn Radar — Hourly Cost Breakdown & 1-Click Compute Parking',
    whatItDoes:
      'Breaks down your live hourly and 30-day run rate into Active Compute vs. Residual Storage/IP floor, and lets you park all running VMs and warm Cloud Run instances to $0/hr compute overnight.',
    enterpriseValue:
      'Cuts non-production dev/staging compute bills by up to 76% (parking 16h/day + weekends) while transparently showing residual disk and static IP charges.',
    gcpApis: 'compute.instances.stop/start · run.services.patch (minInstances=0)',
    safetyMode: 'READ_ONLY',
  },
  ZOMBIES: {
    badge: 'WASTE RECLAMATION',
    title: 'Zombie Resource Hunter — Unattached Disk & Idle Static IP Cleaner',
    whatItDoes:
      'Scans your project for orphaned Persistent Disks, unattached Static External IPv4 addresses ($7.30/mo penalty when unused), and idle warm instances, providing 1-click cleanup.',
    enterpriseValue:
      'Immediately reclaims wasted monthly spend from forgotten disks and reserved IP addresses left behind after VM deletions.',
    gcpApis: 'compute.disks.list · compute.addresses.list · compute.instances.list',
    safetyMode: 'READ_ONLY',
  },
  TELEPORT_DIFF: {
    badge: '40-REGION CARBON & PRICE ARBITRAGE',
    title: 'Cross-Region Teleporter — Cloud Run Migrator, Carbon CFE% & GPU SKU Matrix',
    whatItDoes:
      'Compares all 40 GCP regions side-by-side for Carbon-Free Energy (CFE %), Tier-1 vs. Tier-2 pricing multipliers, and NVIDIA L4/H100/A100 GPU availability, then clones Cloud Run services to a greener/cheaper region.',
    enterpriseValue:
      'Reduces both Scope-2 cloud carbon emissions and monthly compute bills by relocating stateless services to 90%+ CFE Tier-1 regions.',
    gcpApis: 'run.googleapis.com/v2 · 40-Region FinOps & Grid Carbon Catalog',
    safetyMode: 'READ_ONLY',
  },
  X3: {
    badge: 'NETWORK EGRESS AUDITOR',
    title: 'Data-Gravity Tollbooth — Cross-Region Network Egress & Transfer Cost Analyzer',
    whatItDoes:
      'Maps data movement paths between your Compute VMs, Cloud Run services, Cloud Storage buckets, and BigQuery datasets to detect cross-region ($0.01–$0.02/GB) and inter-continental ($0.08–$0.12/GB) egress fees.',
    enterpriseValue:
      'Prevents hidden network transfer charges caused by placing compute services in a different region than the storage buckets or BigQuery datasets they query.',
    gcpApis: 'compute · run · storage · bigquery Location Alignment Analyzer',
    safetyMode: 'READ_ONLY',
  },
  TOPOLOGY: {
    badge: '4-LAYER LIVE ARCHITECTURE',
    title: '4-Layer Cloud Topology — Live Architecture & Public Exposure Graph',
    whatItDoes:
      'Renders your live project across 4 architectural layers: (1) Public Internet Edge & Firewalls, (2) VPC Backbone, (3) Compute VMs & Cloud Run Serverless, and (4) Cloud Storage & BigQuery Lakehouse.',
    enterpriseValue:
      'Gives an instant visual audit of how public internet traffic enters your project and which compute and data assets are exposed vs. VPC-isolated.',
    gcpApis: 'compute (VPCs, Firewalls, VMs) · run · storage · bigquery',
    safetyMode: 'READ_ONLY',
  },
  BENCHMARK: {
    badge: 'COLD-START & P95 LOAD TESTER',
    title: 'Stress Arena & HTTP X-Ray — Cold-Start vs. Warm P50/P95/P99 Latency Benchmark',
    whatItDoes:
      'Fires real concurrent HTTP probes against your Cloud Run or web endpoints to measure #1 First-Hit Cold-Start latency vs. Warm P50/P95/P99 latency, RPS throughput, and security headers.',
    enterpriseValue:
      'Quantifies real-world container cold-start penalties and verifies whether Startup CPU Boost or min-instances=1 is needed for SLA compliance.',
    gcpApis: 'Live Server-Side HTTP/TLS Timing Probe · Cloud Run Telemetry',
    safetyMode: 'READ_ONLY',
  },
  X2: {
    badge: 'CONTAINER STARTUP OPTIMIZER',
    title: 'Cold-Start Surgeon — Cloud Run Startup Profiler & Distroless Dockerfile Generator',
    whatItDoes:
      'Analyzes container image weight and startup bottlenecks, generates a multi-stage Distroless Dockerfile, and enables Cloud Run Gen2 + Startup CPU Boost in 1 click.',
    enterpriseValue:
      'Slashes container image size by up to 85% and cuts Cloud Run cold-start latency from seconds to sub-400ms.',
    gcpApis: 'run.googleapis.com/v2 (startupCpuBoost, executionEnvironment=GEN2)',
    safetyMode: 'READ_ONLY',
  },
  X5: {
    badge: 'GLOBAL EDGE RTT COMPARATOR',
    title: '12-Metropolis Speed-of-Light — Global Client RTT vs. Cloud CDN Anycast Edge',
    whatItDoes:
      'Calculates optical-fiber round-trip time (RTT) and TLS 1.3 handshake latency from 12 global user cities (Tokyo, London, São Paulo, New York, Singapore, etc.) to your origin region vs. Google Cloud CDN Anycast Edge.',
    enterpriseValue:
      'Shows the exact millisecond latency improvement global users gain when enabling Google Cloud CDN and Global External Application Load Balancing.',
    gcpApis: 'Subsea Fiber Great-Circle RTT Engine · Cloud CDN Anycast Topology',
    safetyMode: 'READ_ONLY',
  },
  SECURITY: {
    badge: 'ZERO-TRUST PERIMETER AUDIT',
    title: 'Zero-Trust Perimeter Scanner — Open Firewall 0.0.0.0/0 & IAM Auditor',
    whatItDoes:
      'Scans all VPC firewall rules, public Cloud Run endpoints, and IAM Service Accounts for zero-trust violations and provides 1-click Priority-100 DENY shield deployment.',
    enterpriseValue:
      'Closes exposed management ports (SSH 22, RDP 3389, DB ports) before automated internet scanners can exploit them.',
    gcpApis: 'compute.firewalls · run.services · iam.serviceAccounts',
    safetyMode: 'READ_ONLY',
  },
  X1: {
    badge: 'IN-MEMORY SECRET & PII SCANNER',
    title: 'Storage RAM DLP X-Ray — Cloud Storage Secret Leak & Regulated PII Scanner',
    whatItDoes:
      'Streams objects from your Cloud Storage buckets into volatile server RAM (zero disk writes) to detect leaked GCP/AWS keys, private keys, JWTs, SSNs, and credit cards, with 1-click in-place redaction.',
    enterpriseValue:
      'Prevents credential harvesting and GDPR/HIPAA compliance breaches hidden inside uploaded CSV, JSON, log, or config files.',
    gcpApis: 'storage.googleapis.com/storage/v1/b/{bucket}/o · In-Memory Regex/Entropy DLP',
    safetyMode: 'READ_ONLY',
  },
  X4: {
    badge: 'SEC 17a-4 & RANSOMWARE SHIELD',
    title: 'Ransomware Air-Gap Auditor — Cloud Storage WORM Lock, Versioning & Soft-Delete Shield',
    whatItDoes:
      'Audits every Cloud Storage bucket against ransomware deletion/encryption threats (Public Access Prevention, Uniform IAM, Object Versioning, Soft-Delete Retention, and WORM Bucket Lock) and hardens buckets in 1 click.',
    enterpriseValue:
      'Guarantees that even if an attacker compromises an admin credential, backup and lakehouse objects cannot be permanently deleted or overwritten.',
    gcpApis: 'storage.googleapis.com/storage/v1/b (softDeletePolicy, versioning, iamConfiguration)',
    safetyMode: 'READ_ONLY',
  },

  // ============================================================================
  // 3. SUB-TABS IN WAVES 11–15, QUANTUM NEXUS, 10-PERSONA & SDK 590.0.1
  // ============================================================================
  BQ_VECTOR_ANOMALY: {
    badge: 'WAVE 15 · STEP 01',
    title: 'BigQuery Statistical Z-Score & Cosine Vector SQL Engine',
    whatItDoes:
      'Executes a live BigQuery Standard SQL CTE pipeline that computes statistical Z-Scores (|z| >= 1.8) and 4D Cosine Similarity vectors across your real project telemetry.',
    enterpriseValue:
      'Detects cost, latency, and storage anomalies directly inside BigQuery using native SQL math without exporting data to external ML clusters.',
    gcpApis: 'bigquery.googleapis.com/bigquery/v2/projects/{project}/queries',
    safetyMode: 'READ_ONLY',
  },
  SLSA_SUPPLY_CHAIN: {
    badge: 'WAVE 15 · STEP 02',
    title: 'SLSA v1.0 Software Supply-Chain Provenance Attestor',
    whatItDoes:
      'Inspects live Cloud Build history and Artifact Registry @sha256 container digests, then generates a cryptographic SLSA v1.0 in-toto DSSE provenance statement signed with Ed25519.',
    enterpriseValue:
      'Verifies container build integrity and prevents mutable :latest tag tampering in regulated CI/CD pipelines.',
    gcpApis: 'cloudbuild.googleapis.com · artifactregistry.googleapis.com · Ed25519 DSSE',
    safetyMode: 'READ_ONLY',
  },
  LOGGING_CORRELATOR: {
    badge: 'WAVE 15 · STEP 03',
    title: 'Cloud Logging Surgeon — Live Log Correlator & Gemini 3.8 Flash Root-Cause Analyzer',
    whatItDoes:
      'Fetches live log entries from Cloud Logging (logging.entries.list), groups them by severity and service, and runs Gemini 3.8 Flash to synthesize root cause and exact remediation CLI commands.',
    enterpriseValue:
      'Turns thousands of noisy JSON log lines into an actionable incident root-cause summary in seconds.',
    gcpApis: 'logging.googleapis.com/v2/entries:list · Vertex AI Gemini 3.8 Flash',
    safetyMode: 'READ_ONLY',
  },
  TLS_X509_INSPECTOR: {
    badge: 'WAVE 15 · STEP 04',
    title: 'Live TLS 1.3 & X.509 Certificate Handshake Inspector',
    whatItDoes:
      'Opens a real TLS socket handshake to any GCP or custom HTTPS endpoint to inspect TLS protocol version, cipher suite, X.509 Subject Alternative Names (SANs), issuer chain, SHA-256 fingerprint, and days until expiry.',
    enterpriseValue:
      'Prevents unexpected production outages caused by expired SSL certificates or weak TLS cipher configurations.',
    gcpApis: 'Node.js tls.connect Live Socket Handshake · X.509 Peer Certificate Parser',
    safetyMode: 'READ_ONLY',
  },
  BIGQUERY_TIME_TRAVEL: {
    badge: 'WAVE 14 · STEP 01',
    title: 'BigQuery Time-Travel — Point-in-Time Recovery (FOR SYSTEM_TIME AS OF)',
    whatItDoes:
      'Queries your live BigQuery table at a historical timestamp (e.g., 5 minutes to 7 days ago) using FOR SYSTEM_TIME AS OF, compares row counts against current state, and can restore lost rows in 1 click.',
    enterpriseValue:
      'Recovers accidentally deleted or corrupted BigQuery rows in seconds without restoring from external tape or GCS backups.',
    gcpApis: 'bigquery.googleapis.com (FOR SYSTEM_TIME AS OF TIMESTAMP_SUB)',
    safetyMode: 'READ_ONLY',
  },
  SELF_HEALING_DOCTOR: {
    badge: 'WAVE 14 · STEP 02',
    title: 'Self-Healing Cloud Doctor — Automated Configuration Drift Remediation',
    whatItDoes:
      'Scans live Cloud Storage buckets, BigQuery datasets, and Secret Manager secrets for compliance drift (missing Uniform IAM, missing Soft-Delete, missing labels) and repairs them via live PATCH calls.',
    enterpriseValue:
      'Continuously enforces enterprise security and FinOps tagging standards across all storage, analytics, and secret assets.',
    gcpApis: 'storage.buckets.patch · bigquery.datasets.patch · secretmanager.secrets.patch',
    safetyMode: 'LIVE_MUTATION',
  },
  IAM_BLAST_RADIUS: {
    badge: 'WAVE 14 · STEP 03',
    title: 'IAM Blast-Radius — Live Principal Permission & Risk Graph',
    whatItDoes:
      'Calls cloudresourcemanager.projects.getIamPolicy live to map every user, service account, and group holding Owner, Editor, or Admin roles, and generates least-privilege replacement commands.',
    enterpriseValue:
      'Identifies over-privileged service accounts and human principals that could cause project-wide damage if compromised.',
    gcpApis: 'cloudresourcemanager.googleapis.com/v1/projects/{project}:getIamPolicy',
    safetyMode: 'READ_ONLY',
  },
  QUANTUM_ENVELOPE_VAULT: {
    badge: 'WAVE 14 · STEP 04',
    title: 'Quantum Envelope Vault — Hybrid Post-Quantum Secret Manager Encryption',
    whatItDoes:
      'Seals sensitive payloads using a hybrid post-quantum envelope (X25519 ECDH + SHAKE256 KDF + AES-256-GCM authenticated encryption) and stores the ciphertext in Google Cloud Secret Manager.',
    enterpriseValue:
      'Protects long-lived enterprise secrets against "Harvest Now, Decrypt Later" quantum computing threats.',
    gcpApis: 'secretmanager.googleapis.com/v1 · Node.js crypto X25519 + SHAKE256 + AES-256-GCM',
    safetyMode: 'LIVE_MUTATION',
  },
  STARLINK_ORBITAL_MESH: {
    badge: 'WAVE 13 · STEP 01',
    title: 'Starlink Orbital Mesh — 6-Region Live TLS 1.3 Latency & Geo-Failover Probe',
    whatItDoes:
      'Measures real TCP + TLS 1.3 handshake latency across 6 global Google Cloud regional endpoints in parallel and streams failover telemetry into BigQuery.',
    enterpriseValue:
      'Verifies multi-region disaster recovery readiness and identifies the fastest backup region for instant traffic failover.',
    gcpApis: '6-Region HTTPS/TLS Live Probe · bigquery.tabledata.insertAll',
    safetyMode: 'READ_ONLY',
  },
  NEURALINK_THOUGHT_COMPILER: {
    badge: 'WAVE 13 · STEP 02',
    title: 'Neuralink Thought-to-Cloud — Natural-Language 4-Node GCP Resource Builder',
    whatItDoes:
      'Translates a 1-sentence plain-English architectural requirement into a live 4-node GCP stack (Hardened GCS Bucket + BigQuery Dataset + Typed Telemetry Table + Secret Manager Vault) and provisions it on demand.',
    enterpriseValue:
      'Accelerates compliant environment bootstrapping from hours of manual console setup to a single verified click.',
    gcpApis: 'storage.buckets.insert · bigquery.datasets/tables.insert · secretmanager.secrets.create',
    safetyMode: 'LIVE_MUTATION',
  },
  OPTIMUS_AUTONOMOUS_COUNCIL: {
    badge: 'WAVE 13 · STEP 03',
    title: 'Optimus 3-Agent Council — Multi-Agent FinOps, SecOps & SRE Review Board',
    whatItDoes:
      'Runs a structured 3-agent review (FinOps Hawk, Zero-Trust Sentinel, and SRE Prime) grounded on your live project inventory to produce a consensus action plan with copyable gcloud commands.',
    enterpriseValue:
      'Balances competing cost, security, and reliability trade-offs before architectural changes are deployed.',
    gcpApis: 'Vertex AI Gemini 3.8 Flash · Live Project Inventory Context',
    safetyMode: 'READ_ONLY',
  },
  CRYPTO_BLACKBOX_LEDGER: {
    badge: 'WAVE 13 · STEP 04',
    title: 'Cryptographic Black-Box — RFC 8032 Ed25519 Signed Audit Trail Ledger',
    whatItDoes:
      'Hashes every control-plane action into a SHA-256 Merkle chain and signs each receipt with an asymmetric Ed25519 private key, with live public-key signature verification.',
    enterpriseValue:
      'Provides non-repudiable, tamper-evident cryptographic proof of all cloud state changes for SOC2, ISO-27001, and PCI-DSS auditors.',
    gcpApis: 'Node.js crypto Ed25519 (RFC 8032) + SHA-256 Hash Chain',
    safetyMode: 'READ_ONLY',
  },
  AUTOPILOT_FSD: {
    badge: 'WAVE 12 · STEP 01',
    title: 'FSD Cloud Drift Reconciler — Closed-Loop Remediation & SHA-256 State Receipts',
    whatItDoes:
      'Sweeps 9 GCP control planes in parallel to detect security and FinOps drift (open firewalls, unhardened buckets, unlabelled datasets) and executes verified remediation maneuvers with before/after SHA-256 state receipts.',
    enterpriseValue:
      'Automates day-2 compliance remediation while recording cryptographic proof of the exact state transition.',
    gcpApis: 'compute · storage · bigquery · secretmanager · run · container',
    safetyMode: 'LIVE_MUTATION',
  },
  CROSS_PROJECT_TELEPORT: {
    badge: 'WAVE 12 · STEP 02',
    title: 'Zero-Gravity Cross-Project Resource Migrator (Server-Side Backbone Copy)',
    whatItDoes:
      'Copies Cloud Storage buckets/objects, BigQuery datasets/tables, and Secret Manager secrets directly between two GCP projects over Google’s internal backbone with zero local bandwidth.',
    enterpriseValue:
      'Makes staging-to-production promotion or cross-project disaster recovery fast, verifiable, and completely server-side.',
    gcpApis: 'storage.objects.rewrite · bigquery.jobs.insert (copy) · secretmanager',
    safetyMode: 'LIVE_MUTATION',
  },
  LUDICROUS_MEGACAST: {
    badge: 'WAVE 12 · STEP 03',
    title: '12-Service Parallel MCP Probe & Latency Waterfall',
    whatItDoes:
      'Fires 12 authenticated JSON-RPC 2.0 requests simultaneously across Billing, Storage, BigQuery, Compute, Cloud Run, GKE, IAM, Logging, Monitoring, Recommender, Resource Manager, and Developer Knowledge MCP servers.',
    enterpriseValue:
      'Benchmarks real-time control-plane health and JSON-RPC response latency across 12 Google Cloud services in a single parallel burst.',
    gcpApis: '12 Official https://*.googleapis.com/mcp Endpoints',
    safetyMode: 'READ_ONLY',
  },
  FLIGHT_DIRECTOR: {
    badge: 'WAVE 12 · STEP 04',
    title: 'Grounded Gemini 3.8 Flash Flight Director Mission Briefing',
    whatItDoes:
      'Combines your live 9-API Autopilot SHA-256 state digest with Google Developer Knowledge MCP documentation search to generate a grounded SRE & FinOps mission plan.',
    enterpriseValue:
      'Ensures AI architectural recommendations are grounded on both your live resource state and official Google Cloud documentation.',
    gcpApis: 'developerknowledge.googleapis.com/mcp · Vertex AI Gemini 3.8 Flash',
    safetyMode: 'READ_ONLY',
  },
  CAUSAL_GRAPH: {
    badge: 'QUANTUM NEXUS · #1',
    title: 'Cross-Cloud Causal Blast-Radius & Failure-Propagation Simulator',
    whatItDoes:
      'Simulates how a credential breach, cascading outage, or DDoS cost spike propagates across your live IAM service accounts, VPC networks, Cloud Run services, and data stores.',
    enterpriseValue:
      'Reveals hidden single points of failure and lateral movement paths before an incident occurs.',
    gcpApis: 'Live Topology & IAM Dependency Graph Analyzer',
    safetyMode: 'SIMULATION',
  },
  TIME_MACHINE: {
    badge: 'QUANTUM NEXUS · #2',
    title: 'Immutable Project State Time-Machine & 1-Click Rollback',
    whatItDoes:
      'Captures immutable snapshots of your project’s firewall rules, Cloud Run configurations, and bucket policies, diffs any two snapshots side-by-side, and rolls back configuration drift in 1 click.',
    enterpriseValue:
      'Provides an "Undo button" for cloud infrastructure changes if a deployment or policy update breaks production.',
    gcpApis: 'compute.firewalls · run.services · storage.buckets State Snapshot & Restore',
    safetyMode: 'LIVE_MUTATION',
  },
  FINOPS_BREAKER: {
    badge: 'QUANTUM NEXUS · #3',
    title: 'Autonomous FinOps Circuit-Breaker & Spot/Region Arbitrage',
    whatItDoes:
      'Monitors hourly burn velocity against your monthly cap and configures automated circuit-breaker actions (Night-Mode compute parking or Spot VM conversion) when a spike is detected.',
    enterpriseValue:
      'Stops runaway compute spend automatically and identifies immediate Spot VM and regional pricing savings.',
    gcpApis: 'billingbudgets.googleapis.com · compute · run',
    safetyMode: 'LIVE_MUTATION',
  },
  EPHEMERAL_PR: {
    badge: 'QUANTUM NEXUS · #4',
    title: 'Ephemeral PR Previews & Shadow Traffic Mirror',
    whatItDoes:
      'Spins up isolated, TTL-bounded pull-request preview environments with configurable shadow-traffic mirroring (e.g., 10% live traffic mirror) that auto-expire after N hours.',
    enterpriseValue:
      'Lets engineering teams test PR branches against realistic traffic patterns without leaving behind orphaned staging environments that bill 24/7.',
    gcpApis: 'run.googleapis.com/v2 Revision Traffic Tags & TTL Reconciler',
    safetyMode: 'LIVE_MUTATION',
  },
  HONEY_GRID: {
    badge: 'QUANTUM NEXUS · #5',
    title: 'Zero-Trust Honey-Token Deception Grid (Security Canary & Tripwires)',
    whatItDoes:
      'Plants decoy canary credentials and tripwire storage paths that legitimate services never touch; any access immediately triggers a high-severity intrusion alert and attacker attribution.',
    enterpriseValue:
      'Detects lateral movement and insider threats within seconds of an attacker probing your environment.',
    gcpApis: 'Cloud Audit Logs Tripwire Monitor · Canary Token Generator',
    safetyMode: 'LIVE_MUTATION',
  },
  CLOUD_DEPLOY: {
    badge: 'WAVE 11 · STEP 01',
    title: 'Google Cloud Deploy — Progressive Canary Delivery Pipelines',
    whatItDoes:
      'Creates and inspects live Google Cloud Deploy delivery pipelines with progressive canary stages (Dev -> Staging -> 25% / 50% / 100% Production) and human approval gates.',
    enterpriseValue:
      'Standardizes continuous delivery across Cloud Run and GKE with built-in canary verification and 1-click rollback.',
    gcpApis: 'clouddeploy.googleapis.com/v1/projects/{project}/locations/{region}/deliveryPipelines',
    safetyMode: 'LIVE_MUTATION',
  },
  FIRESTORE_NOSQL: {
    badge: 'WAVE 11 · STEP 02',
    title: 'Cloud Firestore NoSQL Document Explorer & Live CRUD Workbench',
    whatItDoes:
      'Lists, creates, updates, and deletes real JSON documents inside your project’s Cloud Firestore (default) database over the Firestore REST API.',
    enterpriseValue:
      'Allows developers and SREs to inspect application state, feature flags, and session documents directly from the control plane.',
    gcpApis: 'firestore.googleapis.com/v1/projects/{project}/databases/(default)/documents',
    safetyMode: 'LIVE_MUTATION',
  },
  FINOPS_QUOTAS: {
    badge: 'WAVE 11 · STEP 03',
    title: 'Active Assist FinOps Recommender & Regional Quota Gauges',
    whatItDoes:
      'Queries Google Cloud Active Assist Recommender for idle VM/disk/IP insights and inspects live regional CPU, GPU, and API quota utilization.',
    enterpriseValue:
      'Prevents deployment failures caused by unexpected regional quota exhaustion while surfacing official Google cost recommendations.',
    gcpApis: 'recommender.googleapis.com/v1 · serviceusage.googleapis.com/v1',
    safetyMode: 'READ_ONLY',
  },
  MULTI_PROJECT_AUDIT: {
    badge: 'WAVE 11 · STEP 04',
    title: 'Multi-Project Estate Matrix & 18-Studio Live Stress Audit',
    whatItDoes:
      'Enumerates all GCP projects accessible to your credentials, lets you switch active projects in 1 click, and runs an 18-endpoint live health probe across the platform.',
    enterpriseValue:
      'Provides organization-wide visibility across dev, staging, and production GCP projects from a single dashboard.',
    gcpApis: 'cloudresourcemanager.googleapis.com/v1/projects · 18-Studio Health Probe',
    safetyMode: 'READ_ONLY',
  },
  SELF_HOST_REPORT: {
    badge: 'WAVE 11 · STEP 05',
    title: '1-Click Cloud Run Self-Hosting Package & Executive HTML Report',
    whatItDoes:
      'Generates a production Dockerfile + Cloud Build deployment command to host CloudPulse on your own Cloud Run service, and exports a standalone Executive Architecture HTML report.',
    enterpriseValue:
      'Lets enterprise teams deploy CloudPulse privately inside their own VPC/IAP perimeter and share board-ready audit reports.',
    gcpApis: 'run.googleapis.com · cloudbuild.googleapis.com · HTML Report Compiler',
    safetyMode: 'READ_ONLY',
  },
  ARCHITECT: {
    badge: 'PERSONA 01 · CLOUD ARCHITECT',
    title: 'Cloud Architect War-Room — SPOF Blast-Radius, Org Policies & 3-Cloud TCO',
    whatItDoes:
      'Simulates regional blackouts to measure RTO/RPO, audits Organization Policy constraints (constraints/*), and compares monthly TCO across GCP, AWS, and Azure.',
    enterpriseValue:
      'Validates multi-region high availability and Google Cloud Well-Architected Framework compliance.',
    gcpApis: 'orgpolicy.googleapis.com · compute · storage · Multi-Cloud TCO Engine',
    safetyMode: 'READ_ONLY',
  },
  CLOUD_ENGINEER: {
    badge: 'PERSONA 02 · CLOUD ENGINEER',
    title: 'Cloud Engineer War-Room — 5-Gate Pre-Flight Validator, .tf Exporter & Undo Saga',
    whatItDoes:
      'Validates IAM, quota, VPC, and billing gates before provisioning, exports live ClickOps resources into Terraform main.tf, and tracks 1-click compensating undo commands.',
    enterpriseValue:
      'Prevents failed deployments and keeps manual console changes synchronized with GitOps repositories.',
    gcpApis: 'serviceusage · iam · compute · run · Reverse-Terraform Compiler',
    safetyMode: 'READ_ONLY',
  },
  DATA_ENGINEER: {
    badge: 'PERSONA 03 · DATA ENGINEER',
    title: 'Data Engineer War-Room — Column Lineage Guard, DLQ Replay & Slot Balancer',
    whatItDoes:
      'Traces column-level lineage across Bronze/Silver/Gold BigQuery tables, replays quarantined dead-letter (_dlq) rows, and balances BigQuery slots with Serverless Spark.',
    enterpriseValue:
      'Prevents downstream schema breakages and ensures 99.9% data freshness SLAs across lakehouse pipelines.',
    gcpApis: 'bigquery.googleapis.com · dataproc.googleapis.com · dataform',
    safetyMode: 'READ_ONLY',
  },
  NETWORK_ENGINEER: {
    badge: 'PERSONA 04 · NETWORK ENGINEER',
    title: 'Network Engineer War-Room — 4-Hop Packet Tracer & IPAM CIDR Collision Guard',
    whatItDoes:
      'Traces packet paths across Ingress -> Firewall -> Route -> Cloud NAT/PSC, detects overlapping subnet CIDRs, and recommends the next non-overlapping /20 block.',
    enterpriseValue:
      'Diagnoses firewall drops and VPC peering CIDR collisions in seconds.',
    gcpApis: 'compute.networks · compute.subnetworks · compute.firewalls · networkmanagement',
    safetyMode: 'READ_ONLY',
  },
  DEVSECOPS: {
    badge: 'PERSONA 05 · DEVSECOPS LEAD',
    title: 'DevSecOps War-Room — Binary Authz @sha256 Gate, IAM Escalation & Zero-Key OIDC',
    whatItDoes:
      'Audits container @sha256 digest pinning, detects multi-hop IAM privilege escalation paths, and generates Workload Identity Federation (OIDC) YAML for GitHub Actions.',
    enterpriseValue:
      'Eliminates static long-lived Service Account JSON keys and blocks unsigned container deployments.',
    gcpApis: 'binaryauthorization · artifactregistry · iam.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  AI_MLOPS: {
    badge: 'PERSONA 06 · AI / MLOPS ENGINEER',
    title: 'AI / MLOps War-Room — Model Armor Firewall, Smart Model Router & GPU Finder',
    whatItDoes:
      'Verifies Vertex AI Model Armor prompt/PII shields, routes prompts between Gemini 3.8 Flash and 3.1 Pro with Context Caching, and locates lowest-cost Spot GPU/TPU zones.',
    enterpriseValue:
      'Cuts production GenAI inference costs by up to 80% while enforcing enterprise safety guardrails.',
    gcpApis: 'modelarmor.googleapis.com · aiplatform.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  SRE_ONCALL: {
    badge: 'PERSONA 07 · SRE COMMANDER',
    title: 'SRE On-Call War-Room — 14.4x SLO Burn Freeze Gate & Change Correlator',
    whatItDoes:
      'Monitors 1h and 6h SLO error-budget burn rates, correlates latency spikes with recent config/code changes, and stages 1-click canary traffic rollbacks.',
    enterpriseValue:
      'Automatically freezes risky releases when error budgets burn too fast and accelerates incident recovery.',
    gcpApis: 'monitoring.googleapis.com/v3 (SLO Service Monitoring) · run.services',
    safetyMode: 'READ_ONLY',
  },
  DBRE: {
    badge: 'PERSONA 08 · DATABASE RELIABILITY',
    title: 'DBRE War-Room — Lock-Tree Inspector, Zero-Downtime Index Advisor & PITR Proof',
    whatItDoes:
      'Inspects database lock trees and Spanner hot keys, generates CREATE INDEX CONCURRENTLY DDL statements, and verifies 1.6-second Point-in-Time Recovery (PITR) clones.',
    enterpriseValue:
      'Eliminates table-locking schema migrations and proves RPO=0 database recovery readiness.',
    gcpApis: 'sqladmin.googleapis.com · spanner.googleapis.com · alloydb',
    safetyMode: 'READ_ONLY',
  },
  FINOPS_ENG: {
    badge: 'PERSONA 09 · FINOPS & GREENOPS',
    title: 'FinOps & GreenOps War-Room — Unit Economics, Zombie Reaper & CUD Optimizer',
    whatItDoes:
      'Calculates unit cost ($ per 1k requests / tenant / AI prompt), scans for zombie disks and idle IPs, optimizes Committed Use Discounts (CUDs), and ranks 98% CFE green regions.',
    enterpriseValue:
      'Translates raw cloud spend into business unit economics and actionable monthly savings.',
    gcpApis: 'cloudbilling.googleapis.com · billingbudgets · recommender',
    safetyMode: 'READ_ONLY',
  },
  PLATFORM_K8S: {
    badge: 'PERSONA 10 · K8S & IDP PLATFORM',
    title: 'K8s & IDP Platform War-Room — Pod OOM Right-Sizer, mTLS Mesh & Golden-Path Scaffolder',
    whatItDoes:
      'Right-sizes Kubernetes Pod CPU/Memory requests to prevent Exit 137 OOMKills, verifies STRICT mTLS service mesh hops, and scaffolds Golden-Path microservices.',
    enterpriseValue:
      'Reclaims wasted GKE cluster memory and gives developers a compliant 1-click service template.',
    gcpApis: 'container.googleapis.com · meshconfig · run.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  OFFICIAL_REMOTE_MCP_HUB: {
    badge: 'SDK 590.0.1 · REMOTE MCP',
    title: '48 Official *.googleapis.com/mcp Remote Control Plane',
    whatItDoes:
      'Connects directly to Google Cloud’s 48 official Remote MCP endpoints over JSON-RPC 2.0 to inspect live tools/list schemas, invoke tools/call, and run 4-server triage chains.',
    enterpriseValue:
      'Provides zero-proxy access to 505+ official Google Cloud MCP tools for AI agents and developer IDEs.',
    gcpApis: 'https://*.googleapis.com/mcp (JSON-RPC 2.0)',
    safetyMode: 'READ_ONLY',
  },
  WAVE3_GCLOUD_590_SUITE: {
    badge: 'SDK 590.0.1 · 8-PILLAR SUITE',
    title: 'SDK 590.0.1 8-Pillar Observability, Orchestration & AI Suite',
    whatItDoes:
      'Interactive CLI & REST workbench for Cloud Observability [GA], Orchestration Pipelines [BETA], Compliance Manager [GA], Gemini Cloud Assist, Vector Search, and IPAM.',
    enterpriseValue:
      'Unifies the newest Google Cloud SDK 590.0.1 command groups into copy-ready enterprise automation.',
    gcpApis: 'observability · orchestration-pipelines · compliance-manager · vector-search',
    safetyMode: 'READ_ONLY',
  },
  BETA_CLOUD_RUN: {
    badge: 'SDK 590.0.1 · CLOUD RUN 4-PRIMITIVE',
    title: 'Cloud Run Worker Pools, Multi-Region Services & Compose Lab',
    whatItDoes:
      'Configures and tests Cloud Run Worker Pools (non-HTTP background queue consumers), Multi-Region Services, Docker Compose deployments [GA], and direct instance inspection.',
    enterpriseValue:
      'Extends serverless Cloud Run beyond HTTP APIs to continuous Kafka/PubSub background workers and active-active multi-region services.',
    gcpApis: 'run.googleapis.com/v2beta (workerPools, multiRegionServices)',
    safetyMode: 'READ_ONLY',
  },
  ALPHA_AGENT_MCP: {
    badge: 'SDK 590.0.1 · AGENT REGISTRY',
    title: 'Google Cloud Agent Registry & Agent Identity Control Plane [GA]',
    whatItDoes:
      'Inspects and registers MCP servers, autonomous agents, and cryptographic Agent Identities using the new gcloud agent-registry command group.',
    enterpriseValue:
      'Establishes zero-trust identity, discovery, and RBAC governance for autonomous AI agents operating in your cloud estate.',
    gcpApis: 'agentregistry.googleapis.com · iam (Agent Identity)',
    safetyMode: 'READ_ONLY',
  },
  ALPHA_PAM_TROUBLESHOOT: {
    badge: 'SDK 590.0.1 · PAM JIT IAM',
    title: 'Privileged Access Manager (PAM) JIT IAM & 403 Policy Troubleshooter [GA]',
    whatItDoes:
      'Creates time-bound Just-In-Time (JIT) PAM entitlements/grants with audit justification and diagnoses 403 Permission Denied errors via Policy Troubleshooter.',
    enterpriseValue:
      'Replaces standing 24/7 Owner/Admin permissions with expiring, auditable JIT privilege elevation.',
    gcpApis: 'privilegedaccessmanager.googleapis.com/v1 · policytroubleshooter.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  ALPHA_HEALTH_FAULT: {
    badge: 'SDK 590.0.1 · CHAOS & HEALTH',
    title: 'Personalized Service Health [GA] & Chaos Fault-Testing [ALPHA]',
    whatItDoes:
      'Correlates official Google Cloud Service Health incidents affecting your regions with controlled fault-injection experiments.',
    enterpriseValue:
      'Distinguishes Google Cloud regional infrastructure incidents from application-level regressions in seconds.',
    gcpApis: 'servicehealth.googleapis.com/v1 · faulttesting.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  ALPHA_BETA_PLATFORM: {
    badge: 'SDK 590.0.1 · LOCATION FINDER',
    title: 'App Optimize, Cloud Location Finder [GA] & Asset Vet',
    whatItDoes:
      'Uses gcloud cloudlocationfinder to rank regions by latency, carbon, and SKU availability, and validates Terraform policies before apply via gcloud asset vet.',
    enterpriseValue:
      'Prevents non-compliant Terraform plans and suboptimal region selection before infrastructure is deployed.',
    gcpApis: 'cloudlocationfinder.googleapis.com · cloudasset.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  WAVE2_MODEL_ARMOR: {
    badge: 'SDK 590.0.1 · MODEL ARMOR GA',
    title: 'Vertex AI Model Armor Templates, Floor Settings & Prompt Sanitizer [GA]',
    whatItDoes:
      'Configures project-wide Model Armor safety floors and tests live prompt sanitization against prompt injection, jailbreak, and sensitive data leaks.',
    enterpriseValue:
      'Enforces mandatory LLM input/output security across every generative AI endpoint in your project.',
    gcpApis: 'modelarmor.googleapis.com/v1 (templates, floorSettings, sanitizeUserPrompt)',
    safetyMode: 'READ_ONLY',
  },
  WAVE2_DEV_KNOWLEDGE_TOPOLOGY: {
    badge: 'SDK 590.0.1 · DEV KNOWLEDGE GA',
    title: 'Grounded Google Developer Knowledge RAG & App Topology [GA]',
    whatItDoes:
      'Queries official Google Cloud documentation via developerknowledge.googleapis.com and maps live application service topology.',
    enterpriseValue:
      'Eliminates hallucinated CLI flags by grounding architecture answers directly on live Google Cloud docs.',
    gcpApis: 'developerknowledge.googleapis.com · apphub.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  WAVE2_BETA_CLOUD_QUOTAS: {
    badge: 'SDK 590.0.1 · CLOUD QUOTAS',
    title: 'Cloud Quotas Preferences [GA] & Autonomous Quota Adjuster [BETA]',
    whatItDoes:
      'Inspects regional quota limits and configures the autonomous Cloud Quotas Adjuster to request quota increases before capacity ceilings are hit.',
    enterpriseValue:
      'Prevents production autoscaling failures caused by hitting default vCPU, GPU, or API rate limits.',
    gcpApis: 'cloudquotas.googleapis.com/v1 & v1beta',
    safetyMode: 'READ_ONLY',
  },
  WAVE2_AUDIT_DELIVERY_TRUST: {
    badge: 'SDK 590.0.1 · COMPLIANCE GA',
    title: 'Audit Manager [GA], Compliance Manager [GA] & Software Delivery Trust',
    whatItDoes:
      'Automates SOC2, ISO-27001, PCI-DSS, and FedRAMP evidence collection across your live GCP project using Audit Manager and Compliance Manager.',
    enterpriseValue:
      'Replaces manual screenshot gathering for security audits with continuous API-verified compliance evidence.',
    gcpApis: 'auditmanager.googleapis.com · compliancemanager.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  WAVE2_AI_HYPERCOMPUTER_HPC: {
    badge: 'SDK 590.0.1 · AI HYPERCOMPUTER',
    title: 'AI Hypercomputer Cluster Director [GA] & Managed Lustre Parallel File System',
    whatItDoes:
      'Designs and inspects GPU/TPU AI Hypercomputer clusters with high-throughput Managed Lustre storage and ML Diagnostics.',
    enterpriseValue:
      'Accelerates distributed LLM training and high-performance computing with sub-millisecond storage I/O.',
    gcpApis: 'clusterdirector.googleapis.com · lustre.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  // ============================================================================
  // 4. TOP HEADER ORBITAL CONTROL-PLANE & GLOBAL ACTION BUTTONS (App.jsx)
  // ============================================================================
  CMD_PALETTE: {
    badge: 'GLOBAL COMMAND PALETTE (⌘K)',
    title: '⌘K Natural-Language & Voice-to-Cloud Command Palette',
    whatItDoes:
      'Opens an instant search and execution palette (Ctrl+K / Cmd+K) that lets you jump to any of the 20 main studios, 22 Innovation Labs, 10 Persona War-Rooms, or execute live GCP actions by typing or speaking.',
    enterpriseValue:
      'Eliminates menu hunting during high-pressure incident response by giving engineers keyboard-first access to every control plane.',
    gcpApis: 'Web Speech API + 42-Studio Instant Router',
    safetyMode: 'READ_ONLY',
  },
  CFE_POSTURE: {
    badge: 'CARBON & ZERO-TRUST TELEMETRY',
    title: 'Live Grid Carbon-Free Energy (CFE%) & Zero-Trust Posture Grade',
    whatItDoes:
      'Displays your active fleet’s weighted Carbon-Free Energy percentage and real-time security posture grade, and jumps directly to the 40-Region Global Network & Carbon World Map.',
    enterpriseValue:
      'Tracks Scope-2 cloud sustainability metrics alongside firewall and IAM security hygiene in real time.',
    gcpApis: 'Cloud Carbon Footprint · compute.regions · Security Posture Engine',
    safetyMode: 'READ_ONLY',
  },
  STACK_COMPOSER: {
    badge: 'ORBITAL 1-TAP PROVISIONER',
    title: '1-Tap 3-Tier Cloud Stack Synthesizer (GCS + BigQuery + Cloud Run)',
    whatItDoes:
      'Opens the Orbital Stack Composer drawer to provision a synchronized 3-tier cloud architecture (hardened Cloud Storage bucket + BigQuery analytics dataset + Cloud Run Gen2 microservice) in a single coordinated workflow.',
    enterpriseValue:
      'Compresses hours of multi-service setup into a repeatable, best-practice 3-tier blueprint.',
    gcpApis: 'storage.buckets.insert · bigquery.datasets.insert · run.services.create',
    safetyMode: 'LIVE_MUTATION',
  },
  FLIGHT_RECORDER: {
    badge: 'AUDIT LEDGER & ROLLBACK',
    title: 'Cloud Flight Recorder & 1-Tap Mutation Time-Machine',
    whatItDoes:
      'Opens the immutable session ledger recording every resource creation, modification, or deletion performed in CloudPulse, complete with 1-click compensating undo actions.',
    enterpriseValue:
      'Provides full audit traceability and instant rollback if an operational change needs to be reversed.',
    gcpApis: 'CloudPulse Mutation Ledger + Compensating REST Undo Saga',
    safetyMode: 'READ_ONLY',
  },
  AUTOPILOT_GUARD: {
    badge: 'AUTONOMOUS FINOPS & SECOPS',
    title: 'Auto-Pilot Guard — Scale-to-Zero, 12-Invariant Self-Healer & Night-Mode Sleep',
    whatItDoes:
      'Opens the Autonomous Control-Plane Enforcer to configure automatic Cloud Run scale-to-zero (minInstances=0), 12-invariant security self-healing, and scheduled Night-Mode VM hibernation.',
    enterpriseValue:
      'Continuously prevents idle compute waste and repairs configuration drift without human intervention.',
    gcpApis: 'compute.instances · run.services · storage.buckets · compute.firewalls',
    safetyMode: 'LIVE_MUTATION',
  },
  HEALTH_DRIFT: {
    badge: 'GEMINI 3.8 FLASH ARCHITECT',
    title: 'AI Cloud Copilot — Live Project Health, Zombie Waste & Drift Scanner',
    whatItDoes:
      'Launches the grounded Gemini 3.8 Flash Cloud Copilot modal pre-loaded with your live project inventory, hourly burn rate, and security posture to diagnose drift and generate exact gcloud fixes.',
    enterpriseValue:
      'Provides an on-demand Principal Cloud Architect and FinOps analyst grounded on your real project telemetry.',
    gcpApis: 'Vertex AI Gemini 3.8 Flash · Live Project Telemetry Context',
    safetyMode: 'READ_ONLY',
  },
  // ============================================================================
  // 5. DATA ENGINEERING STUDIO 9 SUB-MODULES (DataEngineeringStudio.jsx)
  // ============================================================================
  ICEBERG_50_MATRIX: {
    badge: 'DATA ENGINEERING · MODULE 01',
    title: '50-Playbook Apache Iceberg & Lakehouse Architecture Matrix',
    whatItDoes:
      'Provides 50 production-tested BigLake, Apache Iceberg, and BigQuery Lakehouse playbooks with executable SQL, compaction policies, and cross-cloud Omni federated queries.',
    enterpriseValue:
      'Gives data platform teams ready-to-run DDL and architectural blueprints for open table formats on Cloud Storage.',
    gcpApis: 'biglake.googleapis.com · bigquery.googleapis.com · storage.googleapis.com',
    safetyMode: 'READ_ONLY',
  },
  MEDALLION_ELT: {
    badge: 'DATA ENGINEERING · MODULE 02',
    title: '3-Tier Medallion Lakehouse Pipeline Builder (Bronze -> Silver -> Gold)',
    whatItDoes:
      'Provisions synchronized Bronze (raw), Silver (cleaned/deduplicated), and Gold (executive marts) BigQuery datasets with automated PII SHA-256 hashing and QUALIFY ROW_NUMBER() deduplication.',
    enterpriseValue:
      'Standardizes enterprise ELT pipelines with built-in data quality quarantine (_dlq) and 7-day time-travel recovery.',
    gcpApis: 'bigquery.googleapis.com/bigquery/v2/projects/{project}/datasets & queries',
    safetyMode: 'LIVE_MUTATION',
  },
  DATAFORM_SQLX: {
    badge: 'DATA ENGINEERING · MODULE 03',
    title: 'Dataform SQLX & dbt Auto-Clean Transformation Workbench',
    whatItDoes:
      'Initializes managed Google Cloud Dataform repositories and workspaces, compiles SQLX / dbt models with incremental partition pruning, and executes live BigQuery deduplication SQL.',
    enterpriseValue:
      'Brings software engineering rigor (Git version control, schema assertions, and CI/CD) to SQL data transformations.',
    gcpApis: 'dataform.googleapis.com/v1beta1 · bigquery.googleapis.com',
    safetyMode: 'LIVE_MUTATION',
  },
  DATAPLEX_MESH: {
    badge: 'DATA ENGINEERING · MODULE 04',
    title: 'Dataplex Universal Catalog, Auto-Profiling Scans & Data Products',
    whatItDoes:
      'Launches automated Dataplex Data Profiling and Data Quality scans against BigQuery tables and publishes governed Data Mesh Products with freshness SLAs.',
    enterpriseValue:
      'Automates enterprise data governance, column-level quality scoring, and semantic catalog discovery across your lakehouse.',
    gcpApis: 'dataplex.googleapis.com/v1 (dataScans, dataProducts, entries)',
    safetyMode: 'LIVE_MUTATION',
  },
  SCHEMA_CONTRACTS: {
    badge: 'DATA ENGINEERING · MODULE 05',
    title: 'Visual Source-to-Target Schema Mapper & Zero-Breakage Data Contracts',
    whatItDoes:
      'Maps source fields to target BigQuery/Iceberg schemas with type-safe casting (SAFE_CAST), PII masking policies, and breaking-change impact analysis.',
    enterpriseValue:
      'Prevents upstream schema drift from breaking downstream executive BI dashboards or ML feature pipelines.',
    gcpApis: 'BigQuery Schema Contract & Column Lineage Engine',
    safetyMode: 'READ_ONLY',
  },
  SLOT_DOCTOR_DAGS: {
    badge: 'DATA ENGINEERING · MODULE 06',
    title: 'BigQuery Slot/Skew Doctor & Composer-Lite Serverless ELT Workflows',
    whatItDoes:
      'Analyzes live BigQuery job execution plans for shuffle spill and SELECT * anti-patterns, and deploys serverless Cloud Workflows ELT DAGs ($0/mo Free Tier vs. ~$348/mo Cloud Composer).',
    enterpriseValue:
      'Cuts BigQuery query scan costs by up to 65% and eliminates idle Apache Airflow cluster overhead for lightweight schedules.',
    gcpApis: 'bigquery.jobs.list · workflows.googleapis.com/v1',
    safetyMode: 'LIVE_MUTATION',
  },
  DATA_AGENT_KIT: {
    badge: 'DATA ENGINEERING · MODULE 07',
    title: 'Google Cloud Data Agent Kit (DAK) — deployment.yaml & Canonical MCP URIs',
    whatItDoes:
      'Generates declarative deployment.yaml and orchestration-pipeline.yaml bundles with mandatory datacloud:antigravity attribution labels and discovers canonical bq://, gcs://, and lakehouse:// MCP URIs.',
    enterpriseValue:
      'Unifies declarative data infrastructure provisioning with AI agent MCP resource discovery.',
    gcpApis: 'gcloud beta orchestration-pipelines · gcloud dataplex entries search',
    safetyMode: 'LIVE_MUTATION',
  },
  SERVERLESS_SPARK: {
    badge: 'DATA ENGINEERING · MODULE 08',
    title: 'Dataproc Serverless Spark 2.2 & Event Log Root-Cause Analyzer',
    whatItDoes:
      'Configures autoscaling PySpark batches on Dataproc Serverless ($0 idle cost) and diagnoses Spark driver/executor OOMs, data skew, and shuffle spills from GCS event logs.',
    enterpriseValue:
      'Runs distributed PySpark and Iceberg compaction workloads without managing standing Hadoop/Spark clusters.',
    gcpApis: 'dataproc.googleapis.com/v1/projects/{project}/locations/{region}/batches',
    safetyMode: 'READ_ONLY',
  },
  GCP_LAKEHOUSE_WORKSPACE: {
    badge: 'DATA ENGINEERING · MODULE 09',
    title: 'GCP Native Lakehouse — BigFrames Python, BQML AI.FORECAST & Continuous SQL',
    whatItDoes:
      'Generates 100% Google-native lakehouse code using BigQuery DataFrames (BigFrames pandas/sklearn API), TimesFM AI.FORECAST time-series SQL, and BigQuery Continuous Queries.',
    enterpriseValue:
      'Executes distributed Python DataFrames and generative AI forecasting directly inside BigQuery’s serverless compute engine.',
    gcpApis: 'bigframes · bigquery.googleapis.com (ML.FORECAST / AI.FORECAST)',
    safetyMode: 'READ_ONLY',
  },
  // ============================================================================
  // 6. STARTUP 10X — GOOGLE FOR STARTUPS MENTOR EDITION (Startup10xMentorStudio.jsx)
  // ============================================================================
  STARTUP_10X: {
    badge: 'GOOGLE FOR STARTUPS MENTOR EDITION',
    title: 'Startup 10X — Scale & Bottleneck Radar (Cold-Starts, DB Storms, Quotas & Credit Runway)',
    whatItDoes:
      'Exposes and fixes the 6 real scaling bottlenecks that hit startups scaling on Google Cloud: (1) Cloud Run Cold-Start & Legacy 200Mbps VPC Connector lags, (2) Cloud SQL 200-instance Connection Storms, (3) Launch-Day HTTP 429 Quota Walls, (4) $2k–$350k Credit Vampires, (5) B2B SOC2 Deal-Blockers, and (6) GenAI Token Inflation & Context Caching (-80%).',
    enterpriseValue:
      'Extends Google for Startups credit runway by months, eliminates 3s–8s p99 cold-start spikes, and prevents launch-day database or GPU quota outages.',
    gcpApis: 'run v2 · sqladmin v1 · storage v1 · bigquery v2 · cloudquotas · iam',
    safetyMode: 'READ_ONLY',
  },
  STARTUP_10X_RESCAN: {
    badge: 'LIVE 6-PILLAR STARTUP AUDIT',
    title: 'Run Live 10X Scale & Credit Runway Audit',
    whatItDoes:
      'Queries your live Cloud Run services, Cloud SQL instances, Cloud Storage buckets, BigQuery datasets, VPC Firewalls, and IAM bindings in parallel to recompute your Startup 10X Readiness Score and Credit Runway.',
    enterpriseValue:
      'Verifies in real time whether your startup infrastructure is ready for a 10X traffic spike.',
    gcpApis: '6 Parallel Google Cloud REST Inspection Calls',
    safetyMode: 'READ_ONLY',
  },
  COLD_START_VPC_LAG: {
    badge: 'STARTUP 10X · MODULE 01',
    title: 'Cloud Run Cold-Start & Legacy Serverless VPC Connector Lag Surgeon',
    whatItDoes:
      'Detects Cloud Run services missing startupCpuBoost or throttled by legacy e2-micro Serverless VPC Connectors (capped at 200 Mbps) instead of zero-hop Direct VPC Egress, with 1-click live PATCH remediation.',
    enterpriseValue:
      'Cuts container cold-start latency by ~1,430ms p99 and eliminates $15–$45/mo fixed VPC connector VM charges.',
    gcpApis: 'PATCH https://run.googleapis.com/v2/.../services/{service}?updateMask=template.containers',
    safetyMode: 'LIVE_MUTATION',
  },
  DB_CONNECTION_STORM: {
    badge: 'STARTUP 10X · MODULE 02',
    title: 'Cloud SQL Connection Storm & Serverless Pool Exhaustion Guard',
    whatItDoes:
      'Simulates what happens when Cloud Run autoscales from 2 to 200 containers against your Cloud SQL max_connections ceiling and generates Managed Connection Pooling (PgBouncer) + ORM pool sizing fixes.',
    enterpriseValue:
      'Prevents the #1 ProductHunt / launch-day database crash ("FATAL: remaining connection slots are reserved").',
    gcpApis: 'sqladmin.googleapis.com/v1 · Cloud SQL Managed Connection Pooling',
    safetyMode: 'READ_ONLY',
  },
  QUOTA_WALL_RADAR: {
    badge: 'STARTUP 10X · MODULE 03',
    title: '10X Launch-Day Quota Wall (HTTP 429 RESOURCE_EXHAUSTED) Radar',
    whatItDoes:
      'Exposes default 0 GPU quotas and single-region Vertex AI RPM ceilings that cause HTTP 429 errors even when you have $100k+ in startup credits, and configures Dynamic Shared Quota (location="global") + Cloud Quotas Adjuster.',
    enterpriseValue:
      'Prevents viral launch traffic from hitting unexpected regional vCPU, L4 GPU, or Gemini RPM rate limits.',
    gcpApis: 'cloudquotas.googleapis.com/v1beta · aiplatform (Global DSQ)',
    safetyMode: 'READ_ONLY',
  },
  CREDIT_CLIFF_RUNWAY: {
    badge: 'STARTUP 10X · MODULE 04',
    title: 'Google for Startups Credit Vampire Detector & 1-Click Runway Extender',
    whatItDoes:
      'Audits your project for silent credit drainers (buckets without 30d Nearline lifecycle policies, unoptimized BigQuery datasets, and warm idle staging instances) across $2k, $25k, $100k, and $350k startup credit tiers.',
    enterpriseValue:
      'Extends your Google for Startups credit runway by months and prevents gross-vs-net billing cliff surprises.',
    gcpApis: 'storage.buckets.patch · bigquery.datasets.patch · billingbudgets',
    safetyMode: 'LIVE_MUTATION',
  },
  SOC2_DEAL_BLOCKER: {
    badge: 'STARTUP 10X · MODULE 05',
    title: 'Enterprise B2B SOC2 Deal-Blocker & Zero-Trust Hygiene Scanner',
    whatItDoes:
      'Scans for the 3 findings that block startups from passing Fortune 500 enterprise security questionnaires: world-open 0.0.0.0/0 firewalls, primitive Owner/Editor sprawl, and buckets missing Public Access Prevention.',
    enterpriseValue:
      'Helps B2B startups pass enterprise security reviews and SOC2 Type II audits on the first try.',
    gcpApis: 'compute.firewalls · cloudresourcemanager:getIamPolicy · storage.buckets',
    safetyMode: 'READ_ONLY',
  },
  GEMINI_RAG_LATENCY: {
    badge: 'STARTUP 10X · MODULE 06',
    title: 'GenAI Token Inflation, -80% Context Caching & Cross-Region TTFT Surgeon',
    whatItDoes:
      'Calculates how much your startup wastes resending 25k+ system prompt/RAG tokens on every chat turn without Vertex AI Context Caching (-80% cost) and detects cross-region RTT lag between Cloud Run and Vertex AI.',
    enterpriseValue:
      'Slashes monthly Gemini/Vertex AI inference bills by up to 80% while cutting Time-To-First-Token (TTFT) latency by ~62%.',
    gcpApis: 'aiplatform.googleapis.com/v1 (cachedContents) · Vertex AI Model Router',
    safetyMode: 'READ_ONLY',
  },
  // ============================================================================
  // 7. 06 · MULTI-REGION DR GAMEDAY & SQL SURGEON SUB-TABS
  // ============================================================================
  FINOPS_AUTO_SURGEON: {
    badge: '06 · STEP 01 · FINOPS SURGEON',
    title: '01. Live FinOps Anomaly Auto-Fixer & Lifecycle Surgeon',
    whatItDoes:
      'Scans live Cloud Storage buckets and Cloud Run services for missing object lifecycle policies and idle warm instances, applying 30d Nearline -> 90d Coldline tiering in 1 click.',
    enterpriseValue:
      'Automatically stops storage bloat and idle compute waste across your project.',
    gcpApis: 'PATCH https://storage.googleapis.com/storage/v1/b/{bucket}',
    safetyMode: 'LIVE_MUTATION',
  },
  DR_GAMEDAY_SIMULATOR: {
    badge: '06 · STEP 02 · DR GAMEDAY',
    title: '02. Multi-Region Disaster Recovery (DR) GameDay & RTO/RPO Prover',
    whatItDoes:
      'Audits the regional vs. multi-region topology of your live Cloud Storage buckets, BigQuery datasets, and Cloud Run services, simulating a regional blackout to calculate exact RPO and RTO.',
    enterpriseValue:
      'Proves business continuity readiness and highlights single-region bottlenecks before an outage.',
    gcpApis: 'storage · bigquery · run Multi-Region Topology Analyzer',
    safetyMode: 'SIMULATION',
  },
  IAM_LEAST_PRIVILEGE: {
    badge: '06 · STEP 03 · IAM SURGEON',
    title: '03. Live IAM Least-Privilege Role Synthesizer & Owner/Editor Stripper',
    whatItDoes:
      'Reads live project IAM bindings, flags over-privileged roles/owner and roles/editor grants, and generates least-privilege replacement commands removing thousands of excess permissions.',
    enterpriseValue:
      'Shrinks your project’s credential blast radius to enforce strict zero-trust least privilege.',
    gcpApis: 'POST https://cloudresourcemanager.googleapis.com/v1/projects/{project}:getIamPolicy',
    safetyMode: 'READ_ONLY',
  },
  SQL_COST_SURGEON: {
    badge: '06 · STEP 04 · SQL DRY-RUN',
    title: '04. Live BigQuery SQL Dry-Run Cost Surgeon & Byte Verifier',
    whatItDoes:
      'Executes a real $0.00 BigQuery Dry-Run (configuration.dryRun=true) against your SQL query to measure exact bytes scanned and on-demand dollar cost before running the query.',
    enterpriseValue:
      'Prevents expensive multi-terabyte BigQuery scan surprises in production.',
    gcpApis: 'POST https://bigquery.googleapis.com/bigquery/v2/projects/{project}/jobs (dryRun=true)',
    safetyMode: 'READ_ONLY',
  },

  // ============================================================================
  // 8. GLOBAL NETWORK WORLD MAP — LIVE TELEMETRY PILLARS, SCENARIO MODES & LENSES
  // ============================================================================
  GLOBAL_MAP_LATENCY_PROBES: {
    badge: '100% REAL LIVE SOCKET HANDSHAKE',
    title: 'Live Regional TCP/TLS 1.3 Socket Latency Prober (8 GCP Regions)',
    whatItDoes:
      'Executes real concurrent DNS lookup, TCP (:443), and TLS 1.3 socket handshakes from the backend against 8 live Google Cloud regional endpoints (*-aiplatform.googleapis.com) using microsecond timers.',
    enterpriseValue:
      'Measures your true network round-trip time (RTT) to North America, Europe, Asia, South America, and Middle East GCP regions without deploying test VMs.',
    gcpApis: 'Node.js dns.promises.lookup · net.createConnection(:443) · tls.connect (TLS 1.3)',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_ASSET_SOVEREIGNTY: {
    badge: '100% REAL LIVE GCP REST API',
    title: 'Project Asset Residency & Multi-Region Quorum Audit',
    whatItDoes:
      'Queries your live Cloud Storage buckets, BigQuery datasets, Cloud Run services, and Compute Engine VMs to verify Multi-Region Quorum (RPO=0s) vs Single-Region SPOFs and GDPR/US residency.',
    enterpriseValue:
      'Proves data sovereignty compliance (EU GDPR vs US) and catches single-region disaster recovery blind spots before an outage.',
    gcpApis: 'storage.v1/b · bigquery.v2/datasets · run.v2/services · compute.v1/aggregated/instances',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_REGIONAL_QUOTAS: {
    badge: '100% REAL LIVE GCP REST API',
    title: 'Live Regional Compute, NVIDIA GPU & TPU Quotas',
    whatItDoes:
      'Fetches live regional quota usage and limits—including On-Demand & Spot NVIDIA GPUs (NVIDIA_L4_GPUS, NVIDIA_A100_GPUS, NVIDIA_T4_GPUS, NVIDIA_V100_GPUS), Cloud TPU v5e PodSlices (TPU_LITE_PODSLICE_V5), A2 GPU-host vCPUs, CPUS, SSD_TOTAL_GB, DISKS_TOTAL_GB, and IN_USE_ADDRESSES—directly from the Compute Engine Regions API.',
    enterpriseValue:
      'Lets AI/ML and NetOps teams instantly see which regions have available NVIDIA L4/A100/T4/V100 GPU and TPU v5e quota headroom before deploying inference services or failing over workloads.',
    gcpApis: 'GET https://compute.googleapis.com/compute/v1/projects/{project}/regions',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_VPC_SUBNETS: {
    badge: '100% REAL LIVE GCP REST API',
    title: 'Regional VPC Subnetworks & RFC1918 CIDR Map',
    whatItDoes:
      'Lists every live regional VPC subnetwork in your project, including its IPv4 CIDR range, gateway IP, and Private Google Access (PGA) status.',
    enterpriseValue:
      'Gives NetOps architects an instant global inventory of subnet IP allocations and Private Google Access posture.',
    gcpApis: 'GET https://compute.googleapis.com/compute/v1/projects/{project}/aggregated/subnetworks',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_STACK_SYNTHESIZER: {
    badge: '100% REAL GCP PROVISIONER + CFE%',
    title: '1-Tap Green-Region 3-Tier Stack Synthesizer & Carbon Grid',
    whatItDoes:
      'Provisions a real Cloud Storage Bucket, BigQuery Dataset, and Scale-to-Zero Cloud Run v2 service directly into your selected map region, ranked by published Google Cloud Carbon-Free Energy (CFE%).',
    enterpriseValue:
      'Deploys a pre-wired 3-tier serverless stack in the lowest-carbon, lowest-latency GCP region in a single click.',
    gcpApis: 'POST /api/project/{project}/global-map/synthesize-stack (GCS + BigQuery + Cloud Run v2)',
    safetyMode: 'LIVE_MUTATION',
  },
  GLOBAL_MAP_MODE_LIVE_MIX: {
    badge: '100% LIVE CLOUD LOGS + SOCKETS',
    title: 'Live Cloud Logging Stream & Regional TLS 1.3 Socket Replay',
    whatItDoes:
      'Replays real Cloud Logging entries (logging.v2/entries:list for firewall, vpc_flows, run.googleapis.com/requests, cloudaudit) and real 8-region DNS + TCP (:443) + TLS 1.3 socket handshakes across the world map.',
    enterpriseValue:
      'Streams your actual project log activity and real socket round-trip latency into active GCP regions with zero synthetic data.',
    gcpApis: 'POST logging.googleapis.com/v2/entries:list + Node net.createConnection(:443) & tls.connect',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_MODE_SSH_BRUTEFORCE: {
    badge: '100% LIVE VM SOCKET & FIREWALL AUDIT',
    title: 'Live VM Public Socket Prober (:22 SSH & :3389 RDP) & Firewall Audit',
    whatItDoes:
      'Executes real TCP socket connection checks against your running Compute Engine VM public IPs (natIP :22 & :3389) and evaluates your live compute.v1/firewalls rules for 0.0.0.0/0 exposure.',
    enterpriseValue:
      'Proves whether your live VMs and VPC firewall rules actually block or expose public SSH/RDP on the wire, and offers a 1-click Priority-100 DENY shield.',
    gcpApis: 'Node net.createConnection(vm.natIP, 22/3389) + GET compute.v1/projects/{project}/global/firewalls',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_MODE_IAP_ZERO_TRUST: {
    badge: '100% LIVE IAP CIDR & FIREWALL AUDIT',
    title: 'Identity-Aware Proxy (IAP 35.235.240.0/20) Live Firewall Verifier',
    whatItDoes:
      'Audits your live VPC firewall rules (compute.v1/firewalls) to verify whether TCP :22 is restricted to Google Cloud’s official Identity-Aware Proxy CIDR (35.235.240.0/20) vs open to your public client IP (0.0.0.0/0).',
    enterpriseValue:
      'Verifies BeyondCorp Zero-Trust compliance against your real production VPC firewall table.',
    gcpApis: 'GET https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_MODE_GLOBAL_LOAD_TEST: {
    badge: '100% LIVE 8-REGION TLS 1.3 HANDSHAKES',
    title: 'Live 8-Region Google Front End (GFE :443) Socket Handshake Stream',
    whatItDoes:
      'Streams the live concurrent DNS lookup, TCP (:443) connect, and TLS 1.3 cipher handshakes measured against 8 Google Cloud regional endpoints (*-aiplatform.googleapis.com) alongside your GCLB firewall rules.',
    enterpriseValue:
      'Visualizes real multi-region edge reachability, TLS 1.3 cipher negotiation, and microsecond RTT across North America, South America, Europe, Middle East, and Asia.',
    gcpApis: 'Node dns.promises.lookup + net.createConnection(:443) + tls.connect + compute.v1/firewalls',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_PLAY_PAUSE: {
    badge: 'LIVE TELEMETRY REPLAY CONTROL',
    title: 'Start / Pause Live Socket & Cloud Log Trajectory Stream',
    whatItDoes:
      'Starts or pauses the visual trajectory stream of your live regional socket handshakes, Cloud Logging events, and VPC firewall verdicts on the 40-region SVG world map.',
    enterpriseValue:
      'Lets you pause the map at any moment to inspect individual socket RTTs, Cloud Logging entries, or matched firewall rule priorities.',
    gcpApis: 'Live Socket Prober + logging.v2/entries:list + compute.v1/firewalls',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_CLEAR: {
    badge: 'RESET CANVAS COUNTERS',
    title: 'Clear In-Flight Packets & Reset Session Counters',
    whatItDoes:
      'Clears all animated packet arcs on the map and resets the Allowed, Blocked by Firewall, and VPC Backbone session counters to zero.',
    enterpriseValue:
      'Gives you a clean slate before running a new firewall rule test or recording a demo.',
    gcpApis: 'Local SVG Canvas & Telemetry Counter State',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_SPEED: {
    badge: 'PACKET VELOCITY MULTIPLIER',
    title: 'Packet Flight Speed Multiplier (1x / 2x / 4x)',
    whatItDoes:
      'Adjusts the flight velocity of animated packet probes across the world map between 1x (normal), 2x (fast), and 4x (high-speed stress test).',
    enterpriseValue:
      'Lets engineers slow down packet trajectories to inspect perimeter interceptions or speed up high-volume firewall evaluations.',
    gcpApis: 'Quadratic Bezier SVG Trajectory Engine',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_FIBER_MESH: {
    badge: '40-REGION SUBSEA & TERRESTRIAL FIBER',
    title: 'Google Cloud Global Subsea & Terrestrial Fiber Backbone Mesh',
    whatItDoes:
      'Shows or hides the private Google Cloud inter-region fiber links connecting all 40 GCP regions (Grace Hopper, Dunant, Curie, Firmina, Equiano, Echo, and Apricot subsea cables).',
    enterpriseValue:
      'Visualizes how Google’s private Andromeda software-defined backbone routes inter-region VPC traffic off the public internet.',
    gcpApis: 'Google Cloud 40-Region Backbone Topology Graph',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_ZONES_TOGGLE: {
    badge: '121 AVAILABILITY ZONES (-a/-b/-c)',
    title: 'Expand / Collapse Orbiting Availability Zone Nodes',
    whatItDoes:
      'Toggles the orbiting zonal satellite rings (e.g., us-central1-a, -b, -c, -f) around the selected region on the map.',
    enterpriseValue:
      'Helps architects inspect zonal Compute Engine VM placement and verify multi-zone high availability.',
    gcpApis: 'GET https://compute.googleapis.com/compute/v1/projects/{project}/zones',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_LENS_TRAFFIC: {
    badge: 'MAP LENS · FIREWALL & TRAFFIC',
    title: 'Live Network & VPC Firewall Evaluation Lens',
    whatItDoes:
      'Colors map regions and packet trajectories by live VPC firewall rule verdicts (Emerald = ALLOWED, Red = BLOCKED BY FIREWALL, Blue = VPC BACKBONE).',
    enterpriseValue:
      'Provides immediate visual confirmation of which ports and source CIDRs are permitted or blocked at your VPC perimeter.',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls + logging.v2/entries:list',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_LENS_CARBON: {
    badge: 'MAP LENS · GREENOPS CFE%',
    title: 'Google Cloud Carbon-Free Energy (CFE %) & gCO2/kWh Grid Lens',
    whatItDoes:
      'Colors all 40 GCP regions by their published annual Carbon-Free Energy percentage (e.g., northamerica-northeast1 100% CFE, europe-north1 98% CFE, us-central1 96% CFE) and grid carbon intensity.',
    enterpriseValue:
      'Enables ESG and GreenOps teams to place batch, AI training, and serverless workloads in near-zero-carbon regions.',
    gcpApis: 'Google Cloud Published Regional Carbon-Free Energy (CFE%) Dataset',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_LENS_SPOT: {
    badge: 'MAP LENS · FINOPS SPOT VM HEATMAP',
    title: 'Regional Spot VM Hourly Price & Arbitrage Heatmap Lens',
    whatItDoes:
      'Overlays live regional Spot/Preemptible VM pricing and discount percentages across all 40 GCP regions.',
    enterpriseValue:
      'Identifies the lowest-cost regions for fault-tolerant GKE node pools, Batch jobs, and AI inference workloads (up to 60–91% off on-demand).',
    gcpApis: 'Cloud Billing SKU Catalog v1 · Regional Compute Pricing Engine',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_HYBRID_TUNNEL: {
    badge: 'BEYONDCORP IAP & CLOUD VPN OVERLAY',
    title: 'Hybrid Cloud VPN & Identity-Aware Proxy (IAP) Encrypted Tunnel Overlay',
    whatItDoes:
      'Draws an encrypted hybrid tunnel arc from your detected client origin directly to your selected GCP region and verifies IAP (35.235.240.0/20) firewall reachability.',
    enterpriseValue:
      'Visualizes zero-trust administrative access paths from your engineering location into private GCP VPC subnets.',
    gcpApis: 'Client Geo-Origin Probe + Google IAP (35.235.240.0/20) Firewall Rule Check',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_FIBER_LASER: {
    badge: 'OPTICAL FIBER PHYSICS + EGRESS SKU',
    title: 'Point-to-Point Subsea Fiber RTT & Cross-Region Egress Laser',
    whatItDoes:
      'Calculates the exact Haversine distance (km), speed-of-light-in-silica-fiber round-trip latency (ms), and GCP inter-region egress rate ($/GB) between any two regions.',
    enterpriseValue:
      'Helps distributed systems engineers estimate replication lag and cross-region data transfer costs before designing multi-region architectures.',
    gcpApis: 'Silica Fiber Refractive Index Physics (c/1.468) + GCP Inter-Region Egress SKU Rates',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_FIRE_WAVE: {
    badge: 'LIVE SOCKET RE-PROBE & REPLAY',
    title: 'Re-Probe Live Regional Sockets, Cloud Logs & Firewall Verdicts Now',
    whatItDoes:
      'Triggers a fresh backend probe of all 8 regional TCP/TLS 1.3 endpoints, live VM public sockets, and Cloud Logging entries (/api/project/:projectId/global-map/live-telemetry) and replays the wave on the map.',
    enterpriseValue:
      'Verifies real-world network reachability and firewall rule changes immediately after modifying VPC rules or deploying workloads.',
    gcpApis: 'GET /api/project/{project}/global-map/live-telemetry + compute.v1/firewalls',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_DEPLOY_SHIELD: {
    badge: '1-CLICK LIVE SSH :22 FIREWALL RULE',
    title: 'Deploy Priority-100 Zero-Trust SSH (:22) Perimeter Rule',
    whatItDoes:
      'Calls the Google Compute Engine Firewalls API to provision a real Priority-100 INGRESS DENY rule (or Priority-90 ALLOW override) on TCP port 22 (SSH) from 0.0.0.0/0.',
    enterpriseValue:
      'Overrides permissive default-allow-ssh (Priority 65534) rules in seconds without deleting default rules, immediately turning red exposed SSH (:22) probes into blocked perimeter shields while preserving Cloud IAP (35.235.240.0/20).',
    gcpApis: 'POST https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls',
    safetyMode: 'LIVE_MUTATION',
  },
  GLOBAL_MAP_DEPLOY_HTTPS_RULE: {
    badge: '1-CLICK LIVE HTTPS :443 FIREWALL RULE',
    title: 'Deploy Priority-100 HTTPS (:443) Edge Ingress / Lockdown Rule',
    whatItDoes:
      'Provisions a live Priority-100 INGRESS ALLOW (when HTTPS :443 is currently blocked) or Priority-95 INGRESS DENY (when HTTPS :443 is open) firewall rule on TCP port 443 across your VPC network.',
    enterpriseValue:
      'Lets engineers open encrypted TLS/HTTPS (:443) ingress on a new VPC or enforce an emergency port-443 edge lockdown in 1 click, immediately updating the World Map HTTPS :443 verdict.',
    gcpApis: 'POST https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls',
    safetyMode: 'LIVE_MUTATION',
  },
  GLOBAL_MAP_10X_FIREWALL_XRAY: {
    badge: 'PRIORITY 0 -> 65535 FIREWALL X-RAY',
    title: 'Live Packet-by-Packet VPC Firewall X-Ray Debugger & 1-Click Fix',
    whatItDoes:
      'Evaluates your selected Source IP, Protocol, and Port against every rule in your project’s compute.v1/firewalls table in priority order (0 -> 65535), identifying the winning rule, shadowed rules, and skipped rules.',
    enterpriseValue:
      'Answers "Why was my connection blocked or exposed?" in milliseconds and offers 1-click surgical fixes (Lock to Cloud IAP 35.235.240.0/20 or Deploy Priority-90 Override).',
    gcpApis: 'GET/PATCH/POST https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_10X_FAILOVER_TELEPORT: {
    badge: 'MULTI-REGION OUTAGE & 1-TAP TELEPORT',
    title: 'Multi-Region Outage Failover & 1-Tap Cloud Run Teleporter',
    whatItDoes:
      'Calculates subsea fiber RTT and Carbon-Free Energy (CFE%) deltas to your healthy failover peer region and clones your live Cloud Run service (or provisions a scale-to-zero standby replica) into the failover region in 1 click.',
    enterpriseValue:
      'Turns disaster-recovery simulations into executable multi-region Cloud Run failovers directly from the World Map.',
    gcpApis: 'POST /api/project/{project}/cloudrun/teleport (run.googleapis.com/v2)',
    safetyMode: 'READ_ONLY',
  },
  GLOBAL_MAP_10X_TIME_MACHINE: {
    badge: 'REAL CLOUD LOGGING & SOCKET REPLAY',
    title: 'Cloud Audit & Network Log Time-Machine Scrubber',
    whatItDoes:
      'Scrubs through real timestamped Cloud Logging entries (cloudaudit.googleapis.com, compute.googleapis.com/firewall, run.googleapis.com/requests) and live regional TLS 1.3 socket handshakes, replaying each trajectory arc on the World Map.',
    enterpriseValue:
      'Provides visual DVR replay of real project audit and network events across all 40 GCP regions.',
    gcpApis: 'POST https://logging.googleapis.com/v2/entries:list + Regional TLS 1.3 Socket Prober',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_SYNC_GCP: {
    badge: 'LIVE GCP FIREWALL & VPC SYNC',
    title: 'Synchronize VPC Networks & Firewall Rules from Google Cloud',
    whatItDoes:
      'Queries your live Google Cloud project via GET /api/project/:projectId/vpc-firewalls to fetch every VPC network, regional subnet, and Priority 0→65535 firewall rule.',
    enterpriseValue:
      'Ensures your console displays 100% up-to-date VPC firewall rules and subnet topologies immediately after external gcloud CLI or Terraform changes.',
    gcpApis: 'compute.v1/projects/{project}/global/networks + compute.v1/projects/{project}/global/firewalls',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_JUMP_RULES: {
    badge: 'PRIORITY 0 -> 65535 FIREWALL MATRIX',
    title: 'Jump to Live VPC Firewall Rules Matrix (ALLOW & DENY)',
    whatItDoes:
      'Clears any active search or filter and smoothly scrolls directly to the Live VPC Firewall Rules table showing all explicit ALLOW and DENY rules in priority order.',
    enterpriseValue:
      'Gives security and network engineers 1-click access to audit, edit, pause, or delete live perimeter rules.',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_PACKET_TESTER: {
    badge: 'PRIORITY 0 -> 65535 PACKET SIMULATOR',
    title: 'Interactive Packet Flow & Firewall Priority Match Simulator',
    whatItDoes:
      'Tests any synthetic TCP/UDP/ICMP packet (Source IP, Destination Port, Direction, and VM Network Tag) against your live project firewall rules from Priority 0 down to 65535 (plus Google Cloud implied fallback rules).',
    enterpriseValue:
      'Proves which exact rule wins (ALLOW vs. DENY) and which lower-priority rules are shadowed before you deploy or modify production firewall policies.',
    gcpApis: 'Live VPC Firewall Priority Evaluation Engine (0 -> 65535)',
    safetyMode: 'SIMULATION',
  },
  VPC_FW_CREATE_RULE: {
    badge: 'LIVE GCP FIREWALL STUDIO (POST)',
    title: 'Create New Enterprise VPC Firewall Rule (ALLOW or DENY)',
    whatItDoes:
      'Opens the Interactive Firewall Rule Studio to provision a new live Google Cloud VPC firewall rule with custom Priority (0–65535), Direction (INGRESS / EGRESS), Action (ALLOW / DENY), multi-protocol ports, CIDR ranges, and target tags.',
    enterpriseValue:
      'Provisions real VPC perimeter rules directly via the Compute Engine Firewalls API with live global operation progress tracking.',
    gcpApis: 'POST https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_FW_NEW_VPC: {
    badge: 'LIVE GCP VPC PROVISIONING',
    title: 'Create New Google Cloud VPC Network',
    whatItDoes:
      'Opens the VPC Network provisioning modal to create a new global Virtual Private Cloud network (Auto-mode or Custom-mode subnets with Regional or Global BGP dynamic routing).',
    enterpriseValue:
      'Enables isolated multi-environment network segmentation (prod, staging, zero-trust) across all 40 Google Cloud regions.',
    gcpApis: 'POST https://compute.googleapis.com/compute/v1/projects/{project}/global/networks',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_FW_KPI_ALLOW: {
    badge: 'FILTER · ALLOW FIREWALL RULES',
    title: 'Filter by ALLOW Firewall Rules',
    whatItDoes:
      'Displays the count of firewall rules that permit traffic (`allowed[]`) and clicks to filter the Live VPC Firewall Rules list to show only ALLOW rules (click again to reset to All Rules).',
    enterpriseValue:
      'Lets auditors rapidly inspect every open port and permitted CIDR range across all VPC networks.',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls (allowed)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_KPI_DENY: {
    badge: 'FILTER · DENY FIREWALL RULES',
    title: 'Filter by DENY (Block) Guardrail Rules',
    whatItDoes:
      'Displays the count of explicit DENY firewall rules (`denied[]`) and clicks to filter the Live VPC Firewall Rules list to show only blocking guardrails.',
    enterpriseValue:
      'Verifies high-priority Zero-Trust perimeter blocks (such as Priority-100 SSH/RDP brute-force shields and outbound SMTP/SMB exfiltration blocks).',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls (denied)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_KPI_INGRESS: {
    badge: 'FILTER · INBOUND (INGRESS) RULES',
    title: 'Filter by INGRESS (Inbound) Firewall Rules',
    whatItDoes:
      'Shows the total number of inbound (`INGRESS`) firewall rules governing traffic entering your VPC instances from the internet, Cloud IAP, or peer networks.',
    enterpriseValue:
      'Isolates external perimeter exposure from internal outbound policies during security reviews.',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls (direction=INGRESS)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_KPI_EGRESS: {
    badge: 'FILTER · OUTBOUND (EGRESS) RULES',
    title: 'Filter by EGRESS (Outbound) Firewall Rules',
    whatItDoes:
      'Shows the total number of outbound (`EGRESS`) firewall rules governing traffic leaving your VPC instances toward external destinations.',
    enterpriseValue:
      'Helps enforce data-exfiltration prevention and block risky outbound ports (SMTP 25, SMB 445) before falling through to Google Cloud’s implied default-allow-egress rule.',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls (direction=EGRESS)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_KPI_DISABLED: {
    badge: 'FILTER · PAUSED / DISABLED RULES',
    title: 'Filter by Paused / Disabled Firewall Rules',
    whatItDoes:
      'Shows how many firewall rules currently have `disabled: true` on Google Cloud and filters the list to inspect or re-enable them.',
    enterpriseValue:
      'Identifies temporarily paused rules during maintenance windows or troubleshooting without losing their configuration.',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls (disabled=true)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_KPI_EXPOSED: {
    badge: 'ZERO-TRUST CIS EXPOSURE AUDIT',
    title: 'Filter by 0.0.0.0/0 Sensitive Port Exposure (SSH/RDP/DB)',
    whatItDoes:
      'Audits all enabled INGRESS ALLOW rules for public internet (`0.0.0.0/0`) exposure on sensitive management or database ports (SSH 22, RDP 3389, MySQL 3306, Postgres 5432, Redis 6379, Mongo 27017).',
    enterpriseValue:
      'Flags CIS Google Cloud Benchmark violations and lets you lock exposed rules to Google Cloud IAP (`35.235.240.0/20`) in 1 click.',
    gcpApis: 'CIS GCP Benchmark Firewall Auditor + compute.v1/firewalls',
    safetyMode: 'READ_ONLY',
  },
  VPC_TPL_IAP_ZERO_TRUST: {
    badge: '1-TAP ZERO-TRUST TEMPLATE · ALLOW P-90',
    title: 'Template: Allow Google Cloud IAP Zero-Trust SSH & RDP (35.235.240.0/20)',
    whatItDoes:
      'Pre-fills the Firewall Studio with a Priority-90 INGRESS ALLOW rule on TCP ports 22 (SSH) and 3389 (RDP) restricted exclusively to Google’s Identity-Aware Proxy TCP forwarding range (`35.235.240.0/20`).',
    enterpriseValue:
      'Enables BeyondCorp zero-trust administrative access to private VMs via `gcloud compute ssh --tunnel-through-iap` without exposing public SSH ports to the internet.',
    gcpApis: 'POST compute.v1/projects/{project}/global/firewalls (Priority 90)',
    safetyMode: 'READ_ONLY',
  },
  VPC_TPL_BLOCK_SSH_RDP: {
    badge: '1-TAP HARDENING TEMPLATE · DENY P-100',
    title: 'Template: Block Public SSH & RDP Brute-Force (0.0.0.0/0)',
    whatItDoes:
      'Pre-fills the Firewall Studio with a Priority-100 INGRESS DENY guardrail on TCP ports 22 and 3389 from `0.0.0.0/0`, overriding permissive `default-allow-ssh` / `default-allow-rdp` (Priority 65534) rules.',
    enterpriseValue:
      'Stops automated internet SSH/RDP brute-force scanners immediately while allowing Priority-90 Cloud IAP tunnels to pass through.',
    gcpApis: 'POST compute.v1/projects/{project}/global/firewalls (Priority 100)',
    safetyMode: 'READ_ONLY',
  },
  VPC_TPL_ALLOW_GCLB: {
    badge: '1-TAP INFRA TEMPLATE · ALLOW P-500',
    title: 'Template: Allow Google Cloud Load Balancer & GFE Health Checks',
    whatItDoes:
      'Pre-fills the Firewall Studio with a Priority-500 INGRESS ALLOW rule permitting Google Front End (GFE) and Cloud Load Balancing health-check probers (`130.211.0.0/22, 35.191.0.0/16`) on TCP 80, 443, and 8080.',
    enterpriseValue:
      'Prevents healthy backend VMs and GKE nodes from being marked UNHEALTHY by Google Cloud Load Balancers when public ingress is locked down.',
    gcpApis: 'POST compute.v1/projects/{project}/global/firewalls (Priority 500)',
    safetyMode: 'READ_ONLY',
  },
  VPC_TPL_BLOCK_EGRESS: {
    badge: '1-TAP EGRESS LOCK TEMPLATE · DENY P-200',
    title: 'Template: Block Risky Outbound Egress Ports (SMTP 25 / SMB 445)',
    whatItDoes:
      'Pre-fills the Firewall Studio with a Priority-200 EGRESS DENY rule blocking outbound TCP/UDP ports 25 (SMTP spam) and 135–139, 445 (SMB lateral movement / ransomware exfiltration) to `0.0.0.0/0`.',
    enterpriseValue:
      'Overrides Google Cloud’s implied `default-allow-egress` (Priority 65535) for high-risk protocols to prevent compromised workloads from exfiltrating data.',
    gcpApis: 'POST compute.v1/projects/{project}/global/firewalls (Priority 200)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_FILTER_SELECT: {
    badge: 'FIREWALL MATRIX FILTER',
    title: 'Filter Live VPC Firewall Rules by Verdict, Direction, or Risk',
    whatItDoes:
      'Filters the Live VPC Firewall Rules table between All Rules, ALLOW, DENY, INGRESS, EGRESS, 0.0.0.0/0 Sensitive Exposure, and Paused/Disabled rules.',
    enterpriseValue:
      'Speeds up firewall triage in projects with dozens of global perimeter and internal subnet rules.',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_XRAY_ON_MAP: {
    badge: '3D / 2D WORLD MAP PACKET X-RAY',
    title: 'Launch & X-Ray This Firewall Rule on the Global Network Map',
    whatItDoes:
      'Switches to the Global Network World Map, fires a live synthetic packet matching this rule’s protocol, port, and source CIDR, and opens the Priority 0→65535 Firewall X-Ray inspector focused on this rule.',
    enterpriseValue:
      'Visualizes how this specific firewall rule interacts with every other higher- and lower-priority rule across your global GCP footprint.',
    gcpApis: 'Global Network World Map + Priority 0 -> 65535 X-Ray Engine',
    safetyMode: 'SIMULATION',
  },
  VPC_FW_RULE_LOGS: {
    badge: 'CLOUD LOGGING AUDIT EXPLORER',
    title: 'Inspect Live Cloud Logging & Audit Entries for This Firewall Rule',
    whatItDoes:
      'Opens the Cloud Logs & Shell Studio pre-filtered to this specific firewall rule name (`jsonPayload.rule_details.reference` AND `protoPayload.resourceName`) to inspect real connection hits and admin mutations.',
    enterpriseValue:
      'Correlates firewall policy definitions with real-time packet hit logs and Cloud Audit Logs in 1 click.',
    gcpApis: 'POST https://logging.googleapis.com/v2/entries:list',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_LOCK_TO_IAP: {
    badge: '1-CLICK BEYOND-CORP IAP HARDENING (PATCH)',
    title: 'Lock Public 0.0.0.0/0 Rule Down to Google Cloud IAP (35.235.240.0/20)',
    whatItDoes:
      'Opens a pre-flight behavioral impact warning and then executes a live PATCH on Google Cloud to replace `sourceRanges: ["0.0.0.0/0"]` with Google’s Identity-Aware Proxy range (`35.235.240.0/20`).',
    enterpriseValue:
      'Eliminates public internet exposure on SSH/RDP/admin ports in seconds while preserving authenticated zero-trust access via `--tunnel-through-iap`.',
    gcpApis: 'PATCH https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls/{rule}',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_FW_RESTORE_PUBLIC: {
    badge: '1-CLICK SOURCE CIDR RESTORE (PATCH)',
    title: 'Restore Firewall Rule Source CIDR Back to Public Internet (0.0.0.0/0)',
    whatItDoes:
      'Executes a live PATCH on Google Cloud to restore `sourceRanges` from `35.235.240.0/20` back to `0.0.0.0/0` on this firewall rule.',
    enterpriseValue:
      'Allows instant rollback if a workload or legacy client requires direct external IP connectivity without an IAP tunnel.',
    gcpApis: 'PATCH https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls/{rule}',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_FW_TOGGLE_PAUSE: {
    badge: 'LIVE FIREWALL ENFORCEMENT TOGGLE (PATCH)',
    title: 'Pause (Disable) or Re-Enable Firewall Rule on Google Cloud',
    whatItDoes:
      'Executes a live PATCH request toggling `disabled: true/false` on this firewall rule in Google Cloud without deleting the rule’s ports, tags, or CIDR configuration.',
    enterpriseValue:
      'Lets engineers safely test the impact of removing a firewall rule during incident debugging and re-enable it in 1 click.',
    gcpApis: 'PATCH https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls/{rule}',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_FW_EDIT_RULE: {
    badge: 'LIVE FIREWALL RULE EDITOR (PATCH)',
    title: 'Edit Priority, Ports, CIDRs, Action & Tags in Firewall Studio',
    whatItDoes:
      'Loads this live firewall rule into the Interactive Firewall Studio where you can modify its Priority (0–65535), Action (ALLOW/DENY), protocols/ports, source/destination CIDRs, target tags, and logging state.',
    enterpriseValue:
      'Updates existing production firewall policies in-place via `compute.firewalls.patch` with live global operation progress.',
    gcpApis: 'PATCH https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls/{rule}',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_FW_DELETE_RULE: {
    badge: 'LIVE FIREWALL RULE DELETION (DELETE)',
    title: 'Permanently Delete Firewall Rule from Google Cloud VPC',
    whatItDoes:
      'Prompts for inline confirmation and then executes `DELETE /compute/v1/projects/{project}/global/firewalls/{rule}` with real-time GCP global operation tracking.',
    enterpriseValue:
      'Cleans up obsolete, shadowed, or overly permissive firewall rules from your VPC perimeter.',
    gcpApis: 'DELETE https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls/{rule}',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_NET_DELETE: {
    badge: 'LIVE VPC NETWORK DELETION (DELETE)',
    title: 'Delete Google Cloud VPC Network',
    whatItDoes:
      'Prompts for confirmation and deletes the selected custom VPC network from your Google Cloud project once its dependent instances and firewall rules are removed.',
    enterpriseValue:
      'Reclaims unused network quotas and decommissions temporary staging or sandbox VPC topologies.',
    gcpApis: 'DELETE https://compute.googleapis.com/compute/v1/projects/{project}/global/networks/{network}',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_NET_FILTER_RULES: {
    badge: 'VPC-SCOPED FIREWALL FILTER',
    title: 'Filter Firewall Matrix to Rules Attached to This VPC Network',
    whatItDoes:
      'Filters the right-hand Live VPC Firewall Rules list to show only rules scoped to this specific VPC network (click again to show all VPCs).',
    enterpriseValue:
      'Isolates firewall policies per VPC when managing multi-network architectures.',
    gcpApis: 'compute.v1/projects/{project}/global/firewalls (network filter)',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_ALLOW: {
    badge: 'FIREWALL VERDICT · ALLOW',
    title: 'Configure Rule to ALLOW Matching Traffic (`allowed[]`)',
    whatItDoes:
      'Sets the firewall rule action to permit packets matching the specified protocols, ports, CIDR ranges, and target tags.',
    enterpriseValue:
      'Used to open specific application ports (e.g., HTTPS 443 from 0.0.0.0/0 or SSH 22 from Cloud IAP 35.235.240.0/20).',
    gcpApis: 'compute.v1/firewalls (allowed: [{ IPProtocol, ports }])',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_DENY: {
    badge: 'FIREWALL VERDICT · DENY (GUARDRAIL)',
    title: 'Configure Rule to DENY / Block Matching Traffic (`denied[]`)',
    whatItDoes:
      'Sets the firewall rule action to drop/reject packets matching the specified protocols, ports, and CIDR ranges.',
    enterpriseValue:
      'When assigned a lower priority number (e.g., Priority 100), a DENY rule overrides lower-priority ALLOW rules (like `default-allow-ssh` at Priority 65534) without deleting them.',
    gcpApis: 'compute.v1/firewalls (denied: [{ IPProtocol, ports }])',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_INGRESS: {
    badge: 'TRAFFIC DIRECTION · INGRESS',
    title: 'Apply Rule to Inbound (INGRESS) Traffic Entering VMs',
    whatItDoes:
      'Evaluates incoming packets arriving at your VPC instances against the specified Source IPv4/IPv6 CIDR ranges.',
    enterpriseValue:
      'Protects VM external and internal network interfaces from unauthorized inbound connections.',
    gcpApis: 'compute.v1/firewalls (direction: "INGRESS", sourceRanges)',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_EGRESS: {
    badge: 'TRAFFIC DIRECTION · EGRESS',
    title: 'Apply Rule to Outbound (EGRESS) Traffic Leaving VMs',
    whatItDoes:
      'Evaluates outgoing packets originating from your VPC instances toward the specified Destination IPv4/IPv6 CIDR ranges.',
    enterpriseValue:
      'Prevents compromised workloads from initiating unauthorized outbound connections or data exfiltration.',
    gcpApis: 'compute.v1/firewalls (direction: "EGRESS", destinationRanges)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_TOGGLE_LOGGING: {
    badge: 'FIREWALL RULES LOGGING · LOGCONFIG (PATCH)',
    title: 'Toggle Firewall Rule Hit Logging (`Logs: ON` / `Logs: OFF`)',
    whatItDoes:
      'Enables or disables Google Cloud Firewall Rules Logging (`logConfig: { enable: true/false, metadata: "INCLUDE_ALL_METADATA" }`) on this firewall rule via a live PATCH request. ⚠️ Note: Enabling `Logs: ON` writes a log record for every matching connection, which increases log volume ingested into your Cloud Logging `_Default` storage bucket (standard Cloud Logging ingestion & storage rates apply above the 50 GiB/month free tier).',
    enterpriseValue:
      'When `Logs: ON` is enabled, every TCP/UDP/ICMP connection allowed or denied by this rule is recorded in Cloud Logging (`compute.googleapis.com/firewall`) with source IP, destination VM, port, and geo-location—critical for security forensics, brute-force detection, and compliance auditing. Turning `Logs: OFF` on high-volume rules (like HTTP/HTTPS or Load Balancer health checks) avoids unnecessary log storage ingestion and billing.',
    gcpApis: 'PATCH compute.v1/projects/{project}/global/firewalls/{rule} (logConfig.enable)',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_STUDIO_LOGGING_TOGGLE: {
    badge: 'FIREWALL HIT TELEMETRY · LOGS ON/OFF',
    title: 'Firewall Rules Logging (`logConfig.enable` + `INCLUDE_ALL_METADATA`)',
    whatItDoes:
      'Controls whether Google Cloud writes a real-time connection log entry to Cloud Logging (`logName: ".../logs/compute.googleapis.com%2Ffirewall"`) every time a packet matches this rule. ⚠️ FinOps Storage Note: Enabling `Logs: ON` on high-traffic rules can ingest significant log volume into your Cloud Logging storage bucket (`_Default`), consuming your 50 GiB/month free logging quota and incurring $0.50/GiB ingestion & storage charges beyond that.',
    enterpriseValue:
      'Best practice: Enable `Logs: ON` on `DENY` guardrails and sensitive management rules (SSH :22, RDP :3389, databases) for audit forensics and Global Map Time-Machine replay, while keeping `Logs: OFF` on noisy health-check or high-throughput internal rules to save storage.',
    gcpApis: 'compute.v1/firewalls (logConfig: { enable: true, metadata: "INCLUDE_ALL_METADATA" })',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_ENFORCEMENT_TOGGLE: {
    badge: 'RULE ENFORCEMENT STATE · ENABLED / DISABLED',
    title: 'Firewall Rule Enforcement State (`● ENABLED` vs. `○ DISABLED`)',
    whatItDoes:
      'Controls whether Google Cloud’s Andromeda virtual network switch actively enforces this firewall rule (`disabled: false`) or keeps it saved in a paused state (`disabled: true`).',
    enterpriseValue:
      'Allows you to stage new firewall rules in a disabled state for peer review before activating them, or temporarily pause a rule without deleting its CIDR and port matrix.',
    gcpApis: 'compute.v1/firewalls (disabled: boolean)',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_PRIORITY_PRESET: {
    badge: 'PRIORITY PRECEDENCE (0 -> 65535)',
    title: 'Firewall Evaluation Priority Number (Lower Number = Higher Precedence)',
    whatItDoes:
      'Sets the rule evaluation order from `0` (highest precedence, evaluated first) to `65535` (lowest precedence, evaluated last).',
    enterpriseValue:
      'In Google Cloud VPCs, the first matching rule wins! A Priority-90 IAP ALLOW rule beats a Priority-100 Public DENY rule, and both beat Google’s default Priority-65534 rules.',
    gcpApis: 'compute.v1/firewalls (priority: 0..65535)',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_ADD_PROTOCOL: {
    badge: 'MULTI-PROTOCOL & PORT MATRIX',
    title: 'Add Protocol & Port Specification Row (`tcp`, `udp`, `icmp`, `sctp`, `esp`, `all`)',
    whatItDoes:
      'Adds another IP protocol and port range specification (e.g., `tcp: 80,443,8000-8090` + `udp: 443,53`) to the `allowed[]` or `denied[]` array of this firewall rule.',
    enterpriseValue:
      'Lets a single atomic firewall rule govern both TCP and UDP (such as HTTP/3 QUIC on UDP 443 alongside HTTPS on TCP 443).',
    gcpApis: 'compute.v1/firewalls (allowed[] / denied[] IPProtocol & ports)',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_CIDR_PRESET: {
    badge: '1-TAP CIDR RANGE PRESET',
    title: 'Quick-Fill Official Google Cloud & Zero-Trust CIDR Ranges',
    whatItDoes:
      'Populates the Source/Destination CIDR field with official Google Cloud IP blocks: Cloud IAP (`35.235.240.0/20`), GCLB Health Check Probers (`130.211.0.0/22, 35.191.0.0/16`), Internal RFC1918 VPC (`10.128.0.0/9`), or Public Internet (`0.0.0.0/0`).',
    enterpriseValue:
      'Prevents CIDR typos when configuring Identity-Aware Proxy tunnels or Google Load Balancer health checks.',
    gcpApis: 'compute.v1/firewalls (sourceRanges / destinationRanges)',
    safetyMode: 'READ_ONLY',
  },
  VPC_STUDIO_SUBMIT: {
    badge: 'DEPLOY LIVE FIREWALL RULE TO GCP',
    title: 'Provision or Update Firewall Rule on Google Cloud VPC',
    whatItDoes:
      'Submits the configured firewall specification to Google Compute Engine (`POST /global/firewalls` for new rules or `PATCH /global/firewalls/{rule}` when editing) and tracks the global operation to 100%.',
    enterpriseValue:
      'Pushes your firewall policy live across Google’s Andromeda SDN fabric in seconds.',
    gcpApis: 'POST / PATCH https://compute.googleapis.com/compute/v1/projects/{project}/global/firewalls',
    safetyMode: 'LIVE_MUTATION',
  },
  VPC_FW_BADGE_VERDICT: {
    badge: 'FIREWALL ACTION VERDICT',
    title: 'Rule Verdict on Packet Match (`ALLOW` vs. `DENY`)',
    whatItDoes:
      'Indicates whether this rule permits (`ALLOW`) or drops (`DENY`) packets that match its direction, CIDR range, protocol/port, and target tag criteria.',
    enterpriseValue:
      'The lowest-priority-number rule that matches a packet determines the final verdict; all higher-numbered rules below it are shadowed/skipped.',
    gcpApis: 'compute.v1/firewalls (allowed[] vs denied[])',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_BADGE_DIRECTION: {
    badge: 'PACKET FLOW DIRECTION',
    title: 'Traffic Direction (`INGRESS` Inbound vs. `EGRESS` Outbound)',
    whatItDoes:
      '`INGRESS` rules inspect incoming packets arriving at VM network interfaces from external or internal sources. `EGRESS` rules inspect outgoing packets leaving VMs toward destination CIDRs.',
    enterpriseValue:
      'Combining strict INGRESS Zero-Trust rules with EGRESS anti-exfiltration blocks creates a complete defense-in-depth perimeter.',
    gcpApis: 'compute.v1/firewalls (direction: INGRESS | EGRESS)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_BADGE_PRIORITY: {
    badge: 'EVALUATION PRECEDENCE (0 -> 65535)',
    title: 'Firewall Rule Priority (`0` Highest → `65535` Lowest)',
    whatItDoes:
      'Shows the numeric priority of this rule. Google Cloud evaluates firewall rules from `0` up to `65535` and stops at the very first rule that matches the packet.',
    enterpriseValue:
      'Explains why a Priority-100 `DENY` rule overrides a Priority-65534 `default-allow-ssh` rule without requiring you to delete the default rule.',
    gcpApis: 'compute.v1/firewalls (priority)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_BADGE_POSTURE: {
    badge: 'AUTOMATED CIS SECURITY POSTURE',
    title: 'Live Zero-Trust & CIS Benchmark Risk Classification',
    whatItDoes:
      'Classifies each firewall rule’s security posture by inspecting whether `0.0.0.0/0` is allowed on sensitive ports (SSH 22, RDP 3389, databases) or whether it is locked to Cloud IAP (`35.235.240.0/20`) / internal RFC1918 subnets.',
    enterpriseValue:
      'Surfaces high-risk public exposures immediately so you can remediate them with 1-click IAP lockdown.',
    gcpApis: 'CloudPulse CIS GCP Firewall Risk Analyzer',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_IMPLIED_FALLBACK: {
    badge: 'GOOGLE CLOUD IMPLIED PRIORITY-65535 RULES',
    title: 'Google Cloud Implied Fallback Rules (`default-allow-egress` & `default-deny-ingress`)',
    whatItDoes:
      'Every Google Cloud VPC network automatically includes two hidden Priority-65535 fallback rules: `default-deny-ingress` (blocks all unmatched inbound traffic) and `default-allow-egress` (permits all unmatched outbound traffic).',
    enterpriseValue:
      'If no explicit rule in your table matches a packet, it falls through to Priority 65535. These implied rules cannot be deleted, only overridden by rules with priority `0–65534`.',
    gcpApis: 'Google Cloud Andromeda VPC Implied Firewall Specification (P-65535)',
    safetyMode: 'READ_ONLY',
  },
  VPC_SIM_TEST_IAP: {
    badge: 'SYNTHETIC PROBE · CLOUD IAP TUNNEL',
    title: 'Simulate Identity-Aware Proxy (IAP) SSH Packet (`35.235.240.12 -> :22`)',
    whatItDoes:
      'Sets the Packet Tester Source IP to `35.235.240.12` (inside Google’s `35.235.240.0/20` IAP TCP forwarding range) on TCP port 22 to verify that `--tunnel-through-iap` SSH connections are ALLOWED.',
    enterpriseValue:
      'Confirms you will not lock yourself out of Xterm.js / IAP SSH before blocking public port 22.',
    gcpApis: 'Priority 0 -> 65535 Packet Match Simulator',
    safetyMode: 'SIMULATION',
  },
  VPC_SIM_TEST_PUBLIC: {
    badge: 'SYNTHETIC PROBE · PUBLIC INTERNET SSH',
    title: 'Simulate Public Internet SSH Brute-Force Packet (`198.51.100.1 -> :22`)',
    whatItDoes:
      'Sets the Packet Tester Source IP to an external public internet address (`198.51.100.1`) on TCP port 22 to verify whether public SSH is exposed (`ALLOW`) or protected (`DENY`).',
    enterpriseValue:
      'Proves that your Priority-100 DENY guardrail or IAP lockdown successfully blocks external attackers on port 22.',
    gcpApis: 'Priority 0 -> 65535 Packet Match Simulator',
    safetyMode: 'SIMULATION',
  },
  VPC_SIM_LAUNCH_MAP: {
    badge: 'WORLD MAP PACKET TRAJECTORY & X-RAY',
    title: 'Launch Simulated Packet on the Global Network World Map',
    whatItDoes:
      'Transitions to the Global Network World Map, animates this exact packet across your VPC region, and opens the full Priority 0→65535 Firewall X-Ray trace.',
    enterpriseValue:
      'Connects tabular firewall simulation directly to spatial 40-region network visualization.',
    gcpApis: 'Global Network World Map + Firewall X-Ray Engine',
    safetyMode: 'SIMULATION',
  },
  VPC_BRIDGE_OPEN_SOC: {
    badge: 'VPC <-> CLOUD SOC BIDIRECTIONAL BRIDGE',
    title: 'Audit VPC Firewall Perimeter & 3-Vector Toxic Attack Paths in Cloud SOC',
    whatItDoes:
      'Hands off your live VPC firewall perimeter to the Wave 16 20-Pillar Autonomous Cloud SOC & SOAR War-Room, opening Pillar 02 (Toxic Combinations Graph) focused on any exposed 0.0.0.0/0 rules.',
    enterpriseValue:
      'Correlates network ingress (Vector 1) with attached VM/Cloud Run Service Account IAM privileges (Vector 2) and reachable BigQuery/GCS/Secret Manager crown jewels (Vector 3).',
    gcpApis: 'compute.v1/firewalls · cloudresourcemanager.v1:getIamPolicy · Cloud SOC Pillar 02',
    safetyMode: 'READ_ONLY',
  },
  VPC_BRIDGE_SOAR_QUARANTINE: {
    badge: 'CLOUD SOC PILLAR 01 · SOAR IP QUARANTINE',
    title: 'Open 1-Click SOAR Attacker IP / CIDR Quarantine (Priority-100 DENY)',
    whatItDoes:
      'Jumps to Cloud SOC Pillar 01 (MITRE ATT&CK Kill-Chains & SOAR Quarantine) pre-seeded to deploy or manage Priority-100 VPC INGRESS DENY rules against malicious caller IPs.',
    enterpriseValue:
      'Lets SecOps and NetOps engineers block active brute-force or credential-stuffing source CIDRs across the VPC perimeter in one click with an Ed25519 signed receipt.',
    gcpApis: 'POST compute.v1/projects/{project}/global/firewalls (priority: 100, denied: all)',
    safetyMode: 'READ_ONLY',
  },
  VPC_BRIDGE_INV01_GUARDIAN: {
    badge: 'CLOUD SOC PILLAR 20 · 12-INVARIANT GUARDIAN',
    title: 'Open 12-Invariant Self-Healing Reconciler (`INV-01` Zero-Trust IAP)',
    whatItDoes:
      'Opens Cloud SOC Pillar 20 (Autonomous 12-Invariant Self-Healing Engine) focused on Invariant INV-01 (No public 0.0.0.0/0 SSH/RDP ingress; enforce Cloud IAP 35.235.240.0/20).',
    enterpriseValue:
      'Continuously verifies formal Zero-Trust network compliance alongside 11 other project-wide security invariants and generates live Terraform HCL diffs.',
    gcpApis: 'GET / POST /api/project/{project}/soc/guardian-reconcile (INV-01 -> INV-12)',
    safetyMode: 'READ_ONLY',
  },
  VPC_BANNER_SEND_TO_SOC: {
    badge: 'TOXIC ATTACK-PATH TRIAGE · CLOUD SOC',
    title: 'Triage Flagged 0.0.0.0/0 Firewall Rule in Autonomous Cloud SOC',
    whatItDoes:
      'Sends the flagged high-risk 0.0.0.0/0 firewall rule directly into the Cloud SOC & SOAR War-Room with its ports, CIDRs, and priority pre-loaded in the Active VPC Perimeter Triage Banner.',
    enterpriseValue:
      'Enables 1-click transition from a VPC security advisory to full blast-radius inspection, IAP lockdown, and Gemini 3.8 SOC Incident Commander briefing.',
    gcpApis: 'VPC & Firewall Studio -> Cloud SOC Pillar 02 & Pillar 05 (Gemini Commander)',
    safetyMode: 'READ_ONLY',
  },
  VPC_NET_SOC_EGRESS_AUDIT: {
    badge: 'CLOUD SOC PILLAR 17 · EGRESS & SUBNET PGA',
    title: 'Audit VPC Egress Route Table (`0.0.0.0/0` Hijack) & Subnet Private Google Access',
    whatItDoes:
      'Opens Cloud SOC Pillar 17 (DNSSEC, VPC Egress & KMS Forensics) for this VPC network to inspect custom 0.0.0.0/0 next-hop routes and verify Private Google Access (PGA) across all attached regional subnets.',
    enterpriseValue:
      'Detects unauthorized egress route hijacking and ensures private VMs can reach Google APIs without public internet traversal.',
    gcpApis: 'compute.v1/routes · compute.v1/aggregated/subnetworks (privateIpGoogleAccess)',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_SEND_TO_SOC: {
    badge: 'SEND RULE TO CLOUD SOC & SOAR',
    title: 'Inspect & Remediate This Firewall Rule in Autonomous Cloud SOC',
    whatItDoes:
      'Opens the Autonomous Cloud SOC & SOAR War-Room pre-seeded with this exact firewall rule (`ALLOW` rules open Toxic Attack-Path Graph; `DENY` rules open SOAR Quarantine; `EGRESS` rules open Route & PGA Forensics).',
    enterpriseValue:
      'Connects individual firewall rules directly to MITRE ATT&CK audit logs, 3-vector toxic path analysis, Ed25519 receipts, and ClickOps-to-GitOps (`main.tf`) export.',
    gcpApis: 'Bidirectional VPC <-> Cloud SOC Context Handoff',
    safetyMode: 'READ_ONLY',
  },
  VPC_FW_BADGE_SOAR: {
    badge: 'CLOUD SOC SOAR QUARANTINE GUARDRAIL',
    title: 'High-Priority SOAR Perimeter Quarantine Rule (`DENY` Priority <= 200)',
    whatItDoes:
      'Indicates that this firewall rule is an active high-precedence `DENY` guardrail (such as a `/32` attacker IP block deployed from Cloud SOC Pillar 01 or a Priority-100 brute-force shield).',
    enterpriseValue:
      'Evaluated before standard Priority-1000 and Priority-65534 rules, dropping malicious packets at Google’s Andromeda edge before they ever reach VM network interfaces.',
    gcpApis: 'compute.v1/firewalls (denied[], priority <= 200)',
    safetyMode: 'READ_ONLY',
  },
  SOC_OPEN_IN_VPC_STUDIO: {
    badge: 'CLOUD SOC -> VPC FIREWALL STUDIO BRIDGE',
    title: 'Inspect, Edit, or Simulate This Rule in VPC & Firewalls Studio',
    whatItDoes:
      'Jumps from the Cloud SOC alert or SOAR quarantine rule directly into the Enterprise VPC Networks & Zero-Trust Firewall Center with this exact rule highlighted, scrolled into view, and loaded into the Priority 0→65535 Packet Match Simulator.',
    enterpriseValue:
      'Eliminates manual searching when moving from SOC incident detection to deep firewall rule editing, CIDR tuning, or Global Map X-Ray packet tracing.',
    gcpApis: 'Cloud SOC -> VPC Firewall Studio + Priority 0->65535 Packet Simulator',
    safetyMode: 'READ_ONLY',
  },
  SOC_TOP_VPC_BRIDGE: {
    badge: 'VPC & FIREWALL STUDIO BRIDGE',
    title: 'Open Enterprise VPC Networks & Zero-Trust Firewall Center',
    whatItDoes:
      'Switches to the VPC & Firewalls Studio to manage ALLOW/DENY rules, toggle Firewall Rules Logging (`logConfig`), run Priority 0→65535 packet simulations, or launch 3D Global Map X-Ray traces.',
    enterpriseValue:
      'Provides a seamless 1-click bridge between the 20-Pillar Cloud SOC War-Room and the live VPC Firewall Policy Matrix.',
    gcpApis: 'compute.googleapis.com/compute/v1/projects/{project}/global/firewalls',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_PROVIDER_SELECT: {
    badge: 'CLOUD SOC PILLAR 05 · INFERENCE ENGINE ROUTER',
    title: 'Gemini 3 Inference Execution Engine Selector (`Auto` / `Vertex AI OAuth2` / `AI Studio Key`)',
    whatItDoes:
      'Selects whether the SOC Incident Commander routes live inference through your sealed Google AI Studio key (`generativelanguage.googleapis.com`), your keyless Google Cloud OAuth2 token on Vertex AI (`aiplatform.googleapis.com/locations/global`), or Auto-cascades between both.',
    enterpriseValue:
      'Guarantees 100% real LLM execution with zero synthetic fallback — letting operators work keylessly via GCP IAM/OAuth2 or via an isolated BYOK AI Studio key.',
    gcpApis: 'aiplatform.googleapis.com/v1/.../locations/global · generativelanguage.googleapis.com/v1beta',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_MODEL_SELECT: {
    badge: 'GEMINI 3 MODEL ARCHITECTURE · LOCATIONS/GLOBAL',
    title: 'Gemini 3 Model Selector (`gemini-3.8-flash` vs. `gemini-3.1-pro`)',
    whatItDoes:
      'Switches between `gemini-3.8-flash` (high-speed SOC incident triage with 128-token thinking budget) and `gemini-3.1-pro` (deep multi-hop forensic reasoning across kill-chains and IAM graphs with 512-token thinking budget).',
    enterpriseValue:
      'Targets Google Cloud’s `locations/global` Gemini 3 publisher endpoints directly, avoiding legacy 1.x/2.x model drift.',
    gcpApis: 'publishers/google/models/gemini-3.8-flash · publishers/google/models/gemini-3.1-pro-preview',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_GENERATE_BRIEFING: {
    badge: 'LIVE GEMINI 3 SOC COMMANDER · Ed25519 SIGNED',
    title: 'Generate Ed25519-Signed Live Gemini 3 SOC Incident Briefing',
    whatItDoes:
      'Packages your live `cloudaudit.googleapis.com` kill-chains, 3-vector toxic attack paths, Service Account key hygiene, and Canary tripwire telemetry into a real Gemini 3 API call and seals the resulting Markdown runbook in the Ed25519 forensic ledger.',
    enterpriseValue:
      'Produces copy-ready `gcloud` and Terraform containment commands grounded in your actual GCP project inventory with real token accounting and cryptographic non-repudiation.',
    gcpApis: 'POST /api/project/{project}/soc/ai-commander (aiplatform.googleapis.com / generativelanguage.googleapis.com)',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_PATH_A_VERTEX_CARD: {
    badge: 'PATH A · KEYLESS VERTEX AI OAUTH2 ENGINE',
    title: 'Keyless Google Cloud Vertex AI (`aiplatform.googleapis.com/locations/global`)',
    whatItDoes:
      'Uses your active Google Cloud OAuth2 Bearer token to invoke `gemini-3.8-flash` and `gemini-3.1-pro` directly on Vertex AI’s global endpoint without requiring any `AIzaSy...` API key.',
    enterpriseValue:
      'Eliminates static API key distribution by relying on your authenticated GCP IAM identity and project quota.',
    gcpApis: 'POST https://aiplatform.googleapis.com/v1/projects/{project}/locations/global/publishers/google/models/{model}:generateContent',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_ENABLE_VERTEX_BTN: {
    badge: '1-CLICK VERTEX AI API ACTIVATION',
    title: 'Enable `aiplatform.googleapis.com` & `generativelanguage.googleapis.com` ($0.00/mo Idle)',
    whatItDoes:
      'Enables the Google Cloud Vertex AI API and Generative Language API on the active project so keyless OAuth2 Gemini 3 SOC inference works immediately.',
    enterpriseValue:
      'Enabling the APIs carries $0.00/mo standing cost; you only pay standard per-token usage when you explicitly click Generate Briefing.',
    gcpApis: 'POST serviceusage.googleapis.com/v1/projects/{project}/services/aiplatform.googleapis.com:enable',
    safetyMode: 'LIVE_MUTATION',
  },
  SOC_AI_PATH_B_ENCLAVE_CARD: {
    badge: 'PATH B · ZERO-SNIFFING AI STUDIO ENCLAVE',
    title: 'Google AI Studio (`AIzaSy...`) WebCrypto & AES-256-GCM RAM Enclave',
    whatItDoes:
      'Optional BYOK vault for a Google AI Studio API key (`AIzaSy...`), protected by either a non-extractable Browser WebCrypto `AES-256-GCM` enclave (Mode 1) or a 2048-bit `RSA-OAEP-SHA256` wire envelope into Server RAM (Mode 2).',
    enterpriseValue:
      'Never writes your API key to disk, `localStorage`, or git, and prevents plaintext exposure over `http://localhost`.',
    gcpApis: 'window.crypto.subtle (AES-GCM 256 / RSA-OAEP-256) · generativelanguage.googleapis.com/v1beta',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_SEAL_KEY_BTN: {
    badge: 'CRYPTOGRAPHIC KEY SEALING · ZERO PLAINTEXT',
    title: 'Seal `AIzaSy...` Key in Browser WebCrypto Enclave / RSA-OAEP-256 RAM Vault',
    whatItDoes:
      'Seals your pasted Google AI Studio key into a non-extractable Browser WebCrypto `AES-256-GCM` key (and in Mode 2, encrypts it in-browser with the server’s 2048-bit RSA-OAEP-256 public key before transmission).',
    enterpriseValue:
      'Computes a verifiable `SHA-256` key fingerprint while ensuring `Wireshark` or `tcpdump` on `http://localhost` can never capture a plaintext API key.',
    gcpApis: 'window.crypto.subtle.generateKey("AES-GCM") · POST /api/ai-vault/configure (encryptedKeyBase64)',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_CLEAR_KEY_BTN: {
    badge: 'EPHEMERAL VAULT WIPE',
    title: 'Wipe Sealed API Key from Browser WebCrypto Enclave & Server RAM',
    whatItDoes:
      'Immediately zeroes out the in-memory WebCrypto reference in the browser and clears the `AES-256-GCM` ciphertext/IV/authTag from the Node.js server RAM vault.',
    enterpriseValue:
      'Provides instant cryptographic revocation at the end of a security incident triage session.',
    gcpApis: 'DELETE /api/ai-vault/clear',
    safetyMode: 'READ_ONLY',
  },
  ANTI_SNIFFING_MODE1_DIRECT_TLS13: {
    badge: 'ANTI-SNIFFING MODE 1 · 0 LOCAL HTTP PACKETS',
    title: 'Direct Browser → Google HTTPS TLS 1.3 (`window.crypto.subtle` Non-Extractable Enclave)',
    whatItDoes:
      'Seals your `AIzaSy...` key inside a non-extractable Browser WebCrypto `AES-256-GCM` key (`extractable: false`) and dispatches `generateContent` requests directly from your browser to `https://generativelanguage.googleapis.com` over TLS 1.3.',
    enterpriseValue:
      'Even when running the UI on unencrypted `http://localhost`, 0 bytes of your API key ever traverse the local loopback HTTP socket — making local packet sniffing impossible.',
    gcpApis: 'window.crypto.subtle.encrypt/decrypt (AES-GCM 256) -> https://generativelanguage.googleapis.com/v1beta',
    safetyMode: 'READ_ONLY',
  },
  ANTI_SNIFFING_MODE2_RSA_OAEP_VAULT: {
    badge: 'ANTI-SNIFFING MODE 2 · RSA-OAEP-256 WIRE ENVELOPE',
    title: 'Browser `RSA-OAEP-256` Ciphertext → Server `AES-256-GCM` RAM Vault',
    whatItDoes:
      'Imports the Node.js server’s ephemeral 2048-bit RSA public key (`SPKI`) into WebCrypto and encrypts `{ apiKey, nonce, ts }` with `RSA-OAEP-SHA256` in the browser before sending it over HTTP, where the server re-seals it in `AES-256-GCM` RAM.',
    enterpriseValue:
      'Allows server-side execution while ensuring any packet sniffer on `http://localhost` only ever sees 256 bytes of asymmetric RSA ciphertext.',
    gcpApis: 'window.crypto.subtle.encrypt("RSA-OAEP") -> POST /api/ai-vault/configure -> crypto.privateDecrypt',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_CUSTOM_QUERY_INPUT: {
    badge: 'GROUNDED FORENSIC INVESTIGATION PROMPT',
    title: 'Custom SOC Incident Commander Question (Grounded in Live GCP Telemetry)',
    whatItDoes:
      'Lets you ask any custom security or compliance question (e.g., firewall exposure, IAM privilege escalation, Cloud Audit anomalies, or Terraform remediation), automatically injecting your project’s live 20-pillar SOC snapshot as context.',
    enterpriseValue:
      'Replaces generic chatbot answers with project-specific forensic analysis and exact `gcloud` / Terraform commands for your real resource names.',
    gcpApis: 'POST /api/project/{project}/soc/ai-commander (customQuestion + socSnapshot)',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_ASK_COMMANDER_BTN: {
    badge: 'EXECUTE CUSTOM FORENSIC QUERY',
    title: 'Run Grounded Gemini 3 Forensic Analysis on Custom Prompt',
    whatItDoes:
      'Dispatches your custom forensic question + live 20-pillar project telemetry to `gemini-3.8-flash` or `gemini-3.1-pro` and seals the response in the Ed25519 forensic ledger.',
    enterpriseValue:
      'Delivers on-demand incident response playbooks tailored to the exact principals, caller IPs, VPC rules, and buckets in your project.',
    gcpApis: 'aiplatform.googleapis.com/locations/global · generativelanguage.googleapis.com/v1beta',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_QUICK_PROMPT_CHIP: {
    badge: '1-CLICK FORENSIC PLAYBOOK PRESET',
    title: 'Launch Targeted SOC Forensic Investigation (`VPC IAP` / `Kill-Chains` / `IAM Keys` / `DLP`)',
    whatItDoes:
      'Populates and immediately executes a specialized forensic prompt targeting 0.0.0.0/0 VPC firewalls, `cloudaudit` kill-chain attribution, Service Account keys & WIF migration, or GCS/Secret Manager DLP posture.',
    enterpriseValue:
      'Gives SecOps analysts 1-click access to the four most critical cloud security audits.',
    gcpApis: 'POST /api/project/{project}/soc/ai-commander',
    safetyMode: 'READ_ONLY',
  },
  SOC_AI_PROVENANCE_BADGE: {
    badge: 'CRYPTOGRAPHIC LLM PROVENANCE & TOKEN TELEMETRY',
    title: 'Verified Live Gemini 3 Execution Provenance (Zero Synthetic Output Guarantee)',
    whatItDoes:
      'Displays the exact execution path (`LIVE_VERTEX_AI_OAUTH`, `LIVE_GOOGLE_AI_STUDIO_API`, or `BROWSER_DIRECT_TLS13`), resolved Gemini 3 model ID, wall-clock latency (`ms`), live token usage (`Prompt + Output = Total`), and `Ed25519` signature.',
    enterpriseValue:
      'Guarantees complete audit transparency: if neither Vertex AI nor AI Studio is reachable, zero synthetic or simulated text is ever generated.',
    gcpApis: 'usageMetadata (promptTokenCount, candidatesTokenCount, totalTokenCount) + Ed25519 (RFC 8032)',
    safetyMode: 'READ_ONLY',
  },
};

/**
 * Pattern-based lookup for buttons that don't have an explicit `data-feature-id` attribute.
 * Matches button text or title against high-value operational actions.
 */
function resolveFeatureExplanation(buttonEl) {
  if (!buttonEl) return null;

  const explicitId = buttonEl.getAttribute('data-feature-id');
  if (explicitId && INNOVATION_FEATURE_GUIDE[explicitId]) {
    return INNOVATION_FEATURE_GUIDE[explicitId];
  }

  const rawText = (buttonEl.textContent || '').replace(/\s+/g, ' ').trim();
  const rawTitle =
    buttonEl.getAttribute('data-original-title') ||
    buttonEl.getAttribute('data-hud-tip') ||
    buttonEl.getAttribute('data-tooltip') ||
    buttonEl.getAttribute('title') ||
    buttonEl.getAttribute('aria-label') ||
    '';
  const combined = `${rawText} ${rawTitle}`.toLowerCase();

  // Match known studio / innovation labels
  if (combined.includes('startup 10x') || combined.includes('google for startups')) {
    return INNOVATION_FEATURE_GUIDE.STARTUP_10X;
  }
  if (combined.includes('wave 16')) {
    return INNOVATION_FEATURE_GUIDE.WAVE16_ENTERPRISE_MOONSHOT;
  }
  if (combined.includes('10-persona') || combined.includes('review board')) {
    return INNOVATION_FEATURE_GUIDE.FIVE_PERSONA_COUNCIL;
  }
  if (combined.includes('wave 15') || combined.includes('dyson') || combined.includes('slsa v1.0')) {
    return INNOVATION_FEATURE_GUIDE.WAVE15_DYSON_MOONSHOT;
  }
  if (combined.includes('wave 14') || combined.includes('quantum doctor') || combined.includes('self-healing cloud doctor')) {
    return INNOVATION_FEATURE_GUIDE.WAVE14_QUANTUM_DOCTOR;
  }
  if (combined.includes('wave 13') || combined.includes('starlink') || combined.includes('neuralink')) {
    return INNOVATION_FEATURE_GUIDE.WAVE13_STARLINK_NEURALINK;
  }
  if (combined.includes('wave 12') || combined.includes('roadster flight deck')) {
    return INNOVATION_FEATURE_GUIDE.WAVE12_ROADSTER;
  }
  if (combined.includes('wave 11') || combined.includes('canary pipelines')) {
    return INNOVATION_FEATURE_GUIDE.WAVE11_MOONSHOT;
  }
  if (combined.includes('590.0.1')) {
    return INNOVATION_FEATURE_GUIDE.GCLOUD_ALPHA_BETA;
  }
  if (combined.includes('quantum nexus')) {
    return INNOVATION_FEATURE_GUIDE.QUANTUM_NEXUS;
  }
  if (combined.includes('30-day billing') || combined.includes('time-crystal')) {
    return {
      badge: 'PRE-CRIME BILLING FORECASTER',
      title: '"Pre-Crime" 30-Day Billing Time-Crystal & Anomaly Simulator',
      whatItDoes:
        'Projects your 30-day cumulative Google Cloud bill hour-by-hour, simulates 22 real-world runaway cost anomalies (leaked Gemini API keys, recursive Cloud Run loops, unpartitioned BigQuery scans, NAT egress floods), and provisions a 24/7 server-side GCP Spend Cap.',
      enterpriseValue:
        'Forecasts the exact date and hour your monthly budget will breach before the invoice arrives and gives you 1-click remediation commands.',
      gcpApis: 'billingbudgets.googleapis.com/v1 · pubsub.googleapis.com/v1 · Cloud Billing SKU Engine',
      safetyMode: 'READ_ONLY',
    };
  }
  if (combined.includes('what-if') && combined.includes('blast-radius')) {
    return {
      badge: 'DEPENDENCY & COST X-RAY',
      title: '"What-If" Resource Blast-Radius & Cost-Impact X-Ray',
      whatItDoes:
        'Selects any live VM, Cloud Run service, Storage bucket, BigQuery dataset, or VPC in your project and models the exact financial savings ($/mo) vs. operational outage impact of stopping, deleting, or migrating it.',
      enterpriseValue:
        'Prevents accidental production outages before tearing down or resizing cloud infrastructure.',
      gcpApis: 'Live Cross-Service Dependency Graph & FinOps Impact Calculator',
      safetyMode: 'SIMULATION',
    };
  }
  if (combined.includes('dream stack') && (combined.includes('compiler') || combined.includes('synthesizer'))) {
    return {
      badge: 'AI ARCHITECTURE COMPILER',
      title: '"Dream Stack" Multi-Region Architecture & Cost Compiler',
      whatItDoes:
        'Synthesizes a complete, production-hardened Google Cloud architecture from your workload requirements, ranking all 40 GCP regions by monthly TCO and Carbon-Free Energy (CFE %) and generating a 1-click gcloud provisioning script.',
      enterpriseValue:
        'Turns plain-English system requirements into an audited, cost-optimized deployment blueprint in seconds.',
      gcpApis: '40-Region SKU & Carbon Engine · gcloud CLI Blueprint Compiler',
      safetyMode: 'READ_ONLY',
    };
  }
  if (combined.includes('pre-crime') || combined.includes('dream stack')) {
    return INNOVATION_FEATURE_GUIDE.DREAM_BRAIN;
  }
  if (combined.includes('24/7 gcp spend cap') || combined.includes('provisions a permanent 24/7 google cloud spend cap')) {
    return {
      badge: '24/7 SERVER-SIDE SPEND CAP',
      title: 'Permanent 24/7 Google Cloud Billing Spend Cap & Kill-Switch',
      whatItDoes:
        'Provisions a real GoogleCloudBillingBudgetsV1SpendCap (inputState: CONFIGURED) in Cloud Billing plus a dedicated Pub/Sub kill-switch topic (cloudpulse-budget-killswitch).',
      enterpriseValue:
        'Enforces your monthly dollar ceiling 24/7 on Google’s servers—even when your laptop and browser are turned off.',
      gcpApis: 'billingbudgets.googleapis.com/v1 · pubsub.googleapis.com/v1',
      safetyMode: 'LIVE_MUTATION',
    };
  }
  if (combined.includes('park compute') || combined.includes('emergency park compute')) {
    return {
      badge: 'NIGHT-MODE COMPUTE HIBERNATION',
      title: 'Park Active Compute Fleet ($0/hr vCPU & GPU Mode)',
      whatItDoes:
        'Stops all running Compute Engine VMs and scales warm Cloud Run services down to minInstances=0 so active compute billing drops to $0.00/hr.',
      enterpriseValue:
        'Eliminates overnight and weekend compute waste in 1 click (note: persistent boot disks and reserved static IPs still incur standard GCP storage rates).',
      gcpApis: 'compute.instances.stop · run.services.patch (minInstances=0)',
      safetyMode: 'LIVE_MUTATION',
    };
  }
  if (combined.includes('wake fleet')) {
    return {
      badge: 'FLEET RESUME',
      title: 'Wake Parked Compute Engine VMs & Cloud Run Fleet',
      whatItDoes:
        'Restarts stopped Compute Engine VMs and restores Cloud Run services for active daytime engineering workloads.',
      enterpriseValue:
        'Brings your entire development or staging environment back online in seconds after overnight hibernation.',
      gcpApis: 'compute.instances.start · run.services.patch',
      safetyMode: 'LIVE_MUTATION',
    };
  }
  if (combined.includes('probe all 48 official mcp')) {
    return {
      badge: '48-ENDPOINT LIVE DISCOVERY',
      title: 'Probe All 48 Official *.googleapis.com/mcp Endpoints Live',
      whatItDoes:
        'Executes parallel JSON-RPC 2.0 tools/list discovery probes across all 48 Google-managed Remote MCP servers to verify endpoint reachability and tool schemas.',
      enterpriseValue:
        'Gives AI platform teams a real-time readiness census of all 505+ official Google Cloud MCP tools available to your project.',
      gcpApis: 'https://*.googleapis.com/mcp (JSON-RPC 2.0 tools/list)',
      safetyMode: 'READ_ONLY',
    };
  }
  if (combined.includes('run selected multi-mcp triage chain')) {
    return {
      badge: '4-SERVER PARALLEL MCP CHAIN',
      title: 'Execute 4-Server Coordinated MCP Triage Chain',
      whatItDoes:
        'Invokes 4 official Google Cloud Remote MCP servers in parallel (e.g., Cloud Billing + BigQuery + Storage + Developer Knowledge) via JSON-RPC 2.0 tools/call.',
      enterpriseValue:
        'Automates cross-service incident triage, IAM zero-trust auditing, and FinOps inspection in a single correlated workflow.',
      gcpApis: 'cloudbilling · bigquery · storage · logging · iam · developerknowledge (/mcp)',
      safetyMode: 'READ_ONLY',
    };
  }
  if (combined.includes('execute grounded multi-mcp review')) {
    return {
      badge: 'GEMINI + 5 LIVE MCP SERVERS',
      title: 'Gemini 3.8 Flash Grounded Multi-MCP Architecture Review',
      whatItDoes:
        'Calls 5 official *.googleapis.com/mcp servers live, feeds their real JSON-RPC outputs into Vertex AI Gemini 3.8 Flash, and synthesizes a zero-hallucination review with gcloud commands.',
      enterpriseValue:
        'Guarantees that AI recommendations are 100% grounded on your live billing, buckets, datasets, and audit logs.',
      gcpApis: '5 Official *.googleapis.com/mcp Servers + Vertex AI Gemini 3.8 Flash',
      safetyMode: 'READ_ONLY',
    };
  }

  // Upgrade any button with a descriptive title OR meaningful label into a structured 4-part Google Cloud Console Explainer Card
  const cleanLabel = rawText.slice(0, 95) || rawTitle.slice(0, 80);
  if (!cleanLabel) return null;

  const isMutating =
    /create|deploy|provision|delete|destroy|remove|patch|repair|fix|arm|park|wake|rollback|migrate|clone|execute|invoke|enable|disable|rotate|quarantine/i.test(
      `${rawText} ${rawTitle}`
    ) && !/read-only|preview|inspect|view|open|filter|copy|export|download|simulate|dry-run/i.test(rawText);

  if (rawTitle && rawTitle.length >= 15) {
    return {
      badge: isMutating ? 'LIVE GCP CONTROL ACTION' : 'FEATURE EXPLAINER & GUIDE',
      title: cleanLabel,
      whatItDoes: rawTitle,
      enterpriseValue: isMutating
        ? 'Executes a live, authenticated operation against your selected Google Cloud project with full audit visibility and pre-execution safety checks.'
        : 'Provides instant architectural visibility, configuration inspection, or pre-flight telemetry without modifying production state.',
      gcpApis: 'Authenticated Google Cloud REST / JSON-RPC Control Plane',
      safetyMode: isMutating ? 'LIVE_MUTATION' : 'READ_ONLY',
    };
  }

  // Synthesize structured 4-part explanation for buttons without a detailed title attribute
  if (combined.includes('copy') || combined.includes('export') || combined.includes('download')) {
    return {
      badge: 'CLIPBOARD / ARTIFACT EXPORT',
      title: cleanLabel,
      whatItDoes: `Copies or exports "${cleanLabel}" so you can paste it directly into your terminal, CI/CD pipeline, or GitOps repository.`,
      enterpriseValue:
        'Accelerates engineering handoffs by turning interactive console configurations into reproducible code and audit artifacts.',
      gcpApis: 'Browser Clipboard & Artifact Serializer',
      safetyMode: 'READ_ONLY',
    };
  }
  if (combined.includes('shell') || combined.includes('ssh') || combined.includes('terminal') || combined.includes('gcloud')) {
    return {
      badge: 'CLOUD SHELL / CLI EXECUTION',
      title: cleanLabel,
      whatItDoes: `Stages or executes "${cleanLabel}" inside the integrated CloudPulse Web-SSH & gcloud terminal session.`,
      enterpriseValue:
        'Lets engineers verify and run exact Google Cloud CLI commands without context-switching to a local terminal.',
      gcpApis: 'Google Cloud SDK (gcloud / bq / gsutil) · WebSocket PTY',
      safetyMode: 'READ_ONLY',
    };
  }
  if (combined.includes('scan') || combined.includes('audit') || combined.includes('probe') || combined.includes('verify') || combined.includes('test')) {
    return {
      badge: 'LIVE TELEMETRY & COMPLIANCE SCAN',
      title: cleanLabel,
      whatItDoes: `Runs a live inspection or diagnostic check (${cleanLabel}) against your active Google Cloud project.`,
      enterpriseValue:
        'Surfaces configuration drift, security exposures, and performance bottlenecks before they impact production SLAs.',
      gcpApis: 'Google Cloud REST Inspection & Telemetry APIs',
      safetyMode: 'READ_ONLY',
    };
  }

  if (cleanLabel.length >= 3) {
    return {
      badge: isMutating ? 'LIVE GCP CONTROL ACTION' : 'INTERACTIVE WORKBENCH CONTROL',
      title: cleanLabel,
      whatItDoes: isMutating
        ? `Initiates live Google Cloud control-plane action: "${cleanLabel}" on your selected project.`
        : `Switches view, filters telemetry, or configures parameters for "${cleanLabel}" in the active studio.`,
      enterpriseValue: isMutating
        ? 'Protected by CloudPulse pre-execution safety and cost-impact verification gates.'
        : 'Helps engineers explore, simulate, and inspect Google Cloud resources with zero production risk.',
      gcpApis: 'Google Cloud Control Plane & Studio State Engine',
      safetyMode: isMutating ? 'LIVE_MUTATION' : 'READ_ONLY',
    };
  }

  return null;
}

/**
 * Global Hover Explainer mounted once in App.jsx.
 * Listens for mouseover/focus on any button or tab with `data-feature-id` or descriptive `title`,
 * suppresses the delayed native browser tooltip, and displays an instant Google Cloud Console
 * Enterprise Feature Explainer Card.
 */
export default function GlobalInnovationHoverExplainer() {
  const [hoverState, setHoverState] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const HOVER_SELECTOR =
      '[data-feature-id], [data-kpi-id], [data-hover-explain]';

    const handleMouseOver = (e) => {
      const target = e.target?.closest?.(HOVER_SELECTOR);
      if (!target || target.closest?.('[data-no-hover-explainer]')) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setHoverState(null);
        return;
      }

      // Preserve and suppress native browser title so it doesn't overlap our custom popover
      const nativeTitle = target.getAttribute('title');
      if (nativeTitle) {
        target.setAttribute('data-original-title', nativeTitle);
        target.removeAttribute('title');
      }

      const info = resolveFeatureExplanation(target);
      if (!info) {
        setHoverState(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const cardWidth = Math.min(380, viewportW - 24);

        // Center horizontally on the button, clamped to viewport edges
        let left = rect.left + rect.width / 2 - cardWidth / 2;
        left = Math.max(12, Math.min(left, viewportW - cardWidth - 12));

        // Prefer placing below the button unless too close to bottom of screen
        const placeAbove = rect.bottom + 240 > viewportH && rect.top > 240;
        const top = placeAbove ? rect.top - 10 : rect.bottom + 10;

        setHoverState({
          info,
          left,
          top,
          placeAbove,
          cardWidth,
        });
      }, 350);
    };

    const handleMouseOut = (e) => {
      const related = e.relatedTarget?.closest?.(HOVER_SELECTOR);
      if (!related) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setHoverState(null);
      }
    };

    const handleScrollOrClick = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setHoverState(null);
    };

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    window.addEventListener('scroll', handleScrollOrClick, true);
    window.addEventListener('mousedown', handleScrollOrClick, true);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      window.removeEventListener('scroll', handleScrollOrClick, true);
      window.removeEventListener('mousedown', handleScrollOrClick, true);
    };
  }, []);

  if (!hoverState) return null;

  const { info, left, top, placeAbove, cardWidth } = hoverState;
  const isMutation = info.safetyMode === 'LIVE_MUTATION';
  const isSimulation = info.safetyMode === 'SIMULATION';

  return (
    <div
      role="tooltip"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${cardWidth}px`,
        transform: placeAbove ? 'translateY(-100%)' : 'none',
        zIndex: 9999,
      }}
      className="pointer-events-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#202124] text-zinc-900 dark:text-zinc-100 shadow-xl p-3.5 space-y-2.5 text-xs transition-opacity duration-150"
    >
      {/* Top Badge & Safety Mode */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-[10px] font-mono font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 shrink-0" />
          <span className="truncate">{info.badge}</span>
        </span>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
            isMutation
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              : isSimulation
              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
              : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {isMutation ? (
            <>
              <ShieldCheck className="w-3 h-3 shrink-0" />
              <span>Live GCP Action</span>
            </>
          ) : isSimulation ? (
            <>
              <Info className="w-3 h-3 shrink-0" />
              <span>Synthetic Probe vs. Real Rules</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>100% Live Telemetry</span>
            </>
          )}
        </span>
      </div>

      {/* Full Un-truncated Feature Title */}
      <div className="text-xs font-extrabold text-zinc-900 dark:text-white leading-snug">
        {info.title}
      </div>

      {/* 1. What It Does (Plain English) */}
      <div className="space-y-0.5">
        <div className="text-[10px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-1">
          <Info className="w-3 h-3 shrink-0" />
          <span>What It Does (Plain English)</span>
        </div>
        <p className="text-[11px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {info.whatItDoes}
        </p>
      </div>

      {/* 2. Why Enterprises Use It */}
      {info.enterpriseValue && (
        <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-0.5">
          <div className="text-[10px] font-mono font-bold uppercase text-zinc-600 dark:text-zinc-400">
            Enterprise Value &amp; Use Case
          </div>
          <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {info.enterpriseValue}
          </p>
        </div>
      )}

      {/* 3. Under the Hood (GCP APIs & CLI) */}
      {info.gcpApis && (
        <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
          <Terminal className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate">{info.gcpApis}</span>
        </div>
      )}
    </div>
  );
}
