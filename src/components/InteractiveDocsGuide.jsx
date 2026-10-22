import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  DollarSign,
  Share2,
  Moon,
  FileCode2,
  ShieldAlert,
  ShieldCheck,
  Command,
  Zap,
  AlertTriangle,
  Globe,
  Leaf,
  GitCompare,
  Wand2,
  History,
  Rocket,
  Server,
  PowerOff,
  ArrowRight,
  CheckCircle2,
  Terminal,
  Info,
  Layers,
  Database,
  HardDrive,
} from 'lucide-react';

const DOC_SECTIONS = [
  {
    id: 'appengine-service-exterminator-and-default-neutralizer',
    wave: 'CLOUD RUN & APP ENGINE 2026 INNOVATION · APP ENGINE SERVICE EXTERMINATOR & $0.00/MO DEFAULT NEUTRALIZER',
    title:
      'App Engine Service & Version Exterminator, Non-Deletable default Service $0.00/Mo Neutralizer & 1-Click Cloud Run Migrator',
    badge: 'CLOUD RUN TAB (APP ENGINE EXTERMINATOR)',
    badgeColor: 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40',
    icon: PowerOff,
    targetTab: 'CLOUD_RUN',
    problemSolved:
      'In Google Cloud App Engine, there are two separate deletion locks: (1) For non-default services, the GCP Console UI omits the "Delete Service" button even though the REST API allows deleting them. (2) For the "default" service, Google Cloud permanently forbids deleting the service ("Cannot delete the default service") AND permanently forbids leaving "default" with 0 versions ("Cannot delete the version receiving all traffic on the default service")—even when the App Engine application is disabled ("USER_DISABLED")!',
    howItWorks: [
      'Direct REST v1 Service Deletion for Non-default Services (DELETE_SERVICE): Calls DELETE https://appengine.googleapis.com/v1/apps/:projectId/services/:serviceId directly from the UI to permanently delete any non-default App Engine service and all of its versions—even if its version holds 100% of that service\'s traffic.',
      'Default Service $0.00/mo Floor Neutralizer & Dead-Shell Detector (NEUTRALIZE_DEFAULT_SERVICE_TO_ZERO): Because Google Cloud permanently requires 1 version to remain in the default service until the GCP project itself is deleted, CloudPulse deletes all extra (0%-traffic) versions, stops the remaining required version, and locks the application to USER_DISABLED ($0.00/mo compute + $0.00/mo storage once *.appspot.com buckets are purged).',
      'Application-Wide $0.00/mo Kill-Switch (TOGGLE_APP_SERVING_STATUS): Patches apps/:projectId?updateMask=servingStatus to USER_DISABLED so App Engine returns HTTP 404 at the edge and never bills a single instance hour ($0.00/mo).',
      'Real view=FULL App Engine -> Cloud Run v2 Migrator (MIGRATE_TO_CLOUD_RUN): Inspects GET /v1/apps/:id/services/:svc/versions?view=FULL to extract the real container image (deployment.container.image) or reconstructs the real source files from deployment.files in gs://staging.<project>.appspot.com via Google Cloud Buildpacks (gcr.io/k8s-skaffold/pack), preserving envVariables, serviceAccount, vpcAccessConnector, and CPU/Memory limits—and refuses to deploy fake placeholder containers if the staging bucket was deleted.',
    ],
    apisUsed: [
      'GET & POST /api/project/:id/appengine/overview & /api/project/:id/appengine/action',
      'DELETE https://appengine.googleapis.com/v1/apps/:id/services/:serviceId',
      'DELETE & PATCH https://appengine.googleapis.com/v1/apps/:id/services/:serviceId/versions/:versionId',
      'PATCH https://appengine.googleapis.com/v1/apps/:id?updateMask=servingStatus (USER_DISABLED | SERVING)',
    ],
    billingImpact:
      'Eliminates $18–$150+/mo in hidden App Engine Flex/Manual/Basic resident instance and zombie version charges, reducing legacy App Engine footprint to $0.00/mo.',
  },
  {
    id: 'cloudrun-direct-iap-zero-lb-app-engine-parity',
    wave: 'CLOUD RUN 2026 INNOVATION · APP ENGINE-STYLE 1-CLICK DIRECT CLOUD IAP ($0.00/MO · ZERO LOAD BALANCER)',
    title:
      'App Engine-Style 1-Click Direct Cloud Run Identity-Aware Proxy (IAP) Control Plane — $0.00/Mo Google Sign-In with Zero Load Balancer',
    badge: 'CLOUD RUN TAB (CLOUD IAP DRAWER) + PROVISION MODAL',
    badgeColor: 'bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/40',
    icon: ShieldCheck,
    targetTab: 'CLOUD_RUN',
    problemSolved:
      'On Google App Engine, enabling Identity-Aware Proxy (IAP) Google Sign-In was a simple 1-click toggle. Historically on Cloud Run, putting Google Sign-In in front of a .run.app service forced engineers to provision an External Application Load Balancer + Forwarding Rule + Serverless NEG ($18.25+/mo fixed tax) OR run 5 scattered gcloud beta / IAM / IAP REST commands manually—and standalone @gmail.com projects outside a Google Cloud Organization hit "Invalid IAP credentials: empty client_id" unless a custom OAuth 2.0 Client ID/Secret is bound via iapSettings.',
    howItWorks: [
      '4-Step Automated Direct Cloud Run IAP Pipeline (POST /api/project/:id/cloudrun/:region/:name/iap): (1) Provisions the project IAP Service Agent (service-PROJECT_NUMBER@gcp-sa-iap.iam.gserviceaccount.com via services/iap.googleapis.com:generateServiceIdentity), (2) Patches the Cloud Run v2 service top-level iapEnabled: true field (and run.googleapis.com/iap-enabled="true" annotation) while removing public allUsers invoker access, (3) Binds roles/run.invoker exclusively to the IAP Service Agent so only verified IAP traffic can invoke the container, and (4) Grants roles/iap.httpsResourceAccessor on the IAP Web Cloud Run resource to your authenticated email and any comma-separated authorized users/groups/domains.',
      'Step 5 Standalone / Org-Less @gmail.com Project OAuth Bridge (IAP_CUSTOM_OAUTH_CLIENT): Google Cloud only auto-generates managed IAP OAuth clients for projects inside a Google Workspace Organization. For standalone @gmail.com projects, the Cloud IAP drawer provides optional OAuth 2.0 Client ID & Secret inputs (with the exact Authorized Redirect URI https://iap.googleapis.com/v1/oauth/clientIds/<CLIENT_ID>:handleRedirect) and patches accessSettings.oauthSettings directly via PATCH https://iap.googleapis.com/v1/...:iapSettings.',
      'Auth & Direct Cloud IAP Select Dropdown in "+ Provision Resource" Modal: Choose between "Public HTTPS (allUsers)", "Direct Cloud IAP ($0/mo Sign-In)", or "Private (IAM Auth Only)" right at initial deployment—or toggle Direct Cloud IAP on/off at any time from the "Cloud IAP ($0/mo)" button on every Cloud Run service card.',
      'Injected Identity Headers & Copy-Ready Verification Commands: Displays the exact X-Goog-Authenticated-User-Email, X-Goog-Authenticated-User-Id, and X-Goog-IAP-JWT-Assertion headers injected into your container plus copy-ready curl -i (HTTP 302 accounts.google.com redirect proof) and gcloud iap web get-iam-policy commands.',
    ],
    apisUsed: [
      'GET & POST /api/project/:id/cloudrun/:region/:serviceName/iap',
      'POST https://serviceusage.googleapis.com/v1beta1/projects/:id/services/iap.googleapis.com:generateServiceIdentity',
      'PATCH https://run.googleapis.com/v2/projects/:id/locations/:region/services/:name?updateMask=iapEnabled,annotations,template.annotations',
      'POST https://iap.googleapis.com/v1/projects/:projectNumber/iap_web/cloud_run-:region/services/:name:setIamPolicy & PATCH ...:iapSettings',
    ],
    billingImpact:
      '100% $0.00/mo fixed cost — saves ~$18.25+/mo ($219+/yr) per service by completely eliminating the External Application Load Balancer and Serverless NEG while preserving scale-to-zero (minInstances: 0).',
  },
  {
    id: 'wave15-dyson-vector-sql-slsa-provenance-logging-surgeon-tls-x509',
    wave: 'WAVE 15 MOONSHOT · BIGQUERY Z-SCORE & COSINE VECTOR SQL, SLSA v1.0 DSSE PROVENANCE, CLOUD LOGGING SURGEON & LIVE TLS 1.3 X.509 INSPECTOR',
    title:
      'Wave 15 Moonshot — Live BigQuery Statistical Z-Score & Cosine Vector SQL CTE, Cloud Build + Artifact Registry SLSA v1.0 DSSE Provenance Attestor, Live Cloud Logging Correlator + Gemini 3.8 Flash Surgeon & Real TLS 1.3 X.509 Certificate Inspector',
    badge: '2026 INNOVATION LAB (WAVE 15 · #1)',
    badgeColor: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40',
    icon: Database,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'WAVE15_DYSON_MOONSHOT',
    problemSolved:
      'Modern cloud SRE and security teams need on-demand statistical anomaly detection and semantic vector search directly inside BigQuery SQL without external vector databases, cryptographic SLSA v1.0 provenance signing over live Cloud Build and Artifact Registry SHA-256 digests, real-time Cloud Logging correlation with AI root-cause remediation, and live TLS 1.3 X.509 certificate chain & expiration forensics.',
    howItWorks: [
      'Module 01 (Live BigQuery Statistical Z-Score & Cosine Vector SQL Engine): Inspects your existing BigQuery table schema via bigquery.googleapis.com and executes a live Standard SQL CTE computing sample mean, standard deviation, per-row Z-scores, and normalized token cosine similarity with zero auto-provisioning.',
      'Module 02 (SLSA v1.0 Supply-Chain Provenance & Artifact Digest Verifier): Queries cloudbuild.googleapis.com, artifactregistry.googleapis.com, and run.googleapis.com to correlate deployed containers with immutable @sha256 digests and signs an Ed25519 DSSE (Dead Simple Signing Envelope) SLSA v1.0 In-Toto statement.',
      'Module 03 (Live Cloud Logging Root-Cause Correlator & Gemini 3.8 Flash Surgeon): Queries logging.googleapis.com/v2/entries:list across customizable severity, resource.type, and temporal windows, and streams a grounded Vertex AI Gemini 3.8 Flash Root-Cause Analysis & gcloud logging runbook.',
      'Module 04 (Live TLS 1.3 X.509 Certificate & Cipher Inspector): Performs real Node tls.connect socket handshakes against your live Cloud Run .run.app services and GCP regional endpoints, extracting leaf X.509 SHA-256 fingerprints, SANs, negotiated AEAD ciphers, ALPN protocol, and days remaining until certificate expiration.',
    ],
    apisUsed: [
      'POST /api/project/:id/wave15/bigquery-anomaly-vector',
      'GET /api/project/:id/wave15/supply-chain-provenance & POST /api/project/:id/wave15/attest-slsa-provenance',
      'POST /api/project/:id/wave15/logging-correlator, POST /api/project/:id/wave15/logging-ai-surgeon & POST /api/project/:id/wave15/tls-x509-inspector',
    ],
    billingImpact:
      '100% $0.00/mo for TLS 1.3 X.509 handshakes, Artifact Registry/Cloud Build metadata discovery, and Ed25519 DSSE signing; on-demand BigQuery CTEs and Cloud Logging queries fall within Always-Free Tier allowances.',
  },
  {
    id: 'wave14-quantum-envelope-bigquery-time-travel-self-healing-doctor',
    wave: 'WAVE 14 QUANTUM ENVELOPE VAULT, BIGQUERY TIME-TRAVEL SQL, SELF-HEALING CLOUD DOCTOR & IAM BLAST-RADIUS GRAPH (100% LIVE)',
    title:
      'Wave 14 Quantum-Resistant Envelope Vault, BigQuery FOR SYSTEM_TIME AS OF Time-Travel Forensics, Autonomous Self-Healing Cloud Doctor & Live IAM Blast-Radius Graph',
    badge: '2026 INNOVATION LAB (WAVE 14 · #1)',
    badgeColor: 'bg-violet-500/20 text-violet-600 dark:text-violet-300 border-violet-500/40',
    icon: ShieldCheck,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'WAVE14_QUANTUM_DOCTOR',
    problemSolved:
      'Production cloud estates require native temporal SQL forensics across historical BigQuery snapshots (FOR SYSTEM_TIME AS OF), closed-loop REST PATCH self-healing when GCS/BigQuery/Secret Manager configurations drift, real-time IAM policy blast-radius scoring across primitive Owner/Editor roles, and post-quantum hybrid envelope encryption persisted inside Google Cloud Secret Manager.',
    howItWorks: [
      'Module 01 (Live BigQuery Time-Travel FOR SYSTEM_TIME AS OF Engine): Discovers all live BigQuery tables in your project, executes parallel SQL queries at CURRENT_TIMESTAMP() vs. FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(...), and provides a 1-Click Mutate & Prove Time-Travel Diff Live button that inserts a live row via tabledata.insertAll and proves the exact temporal row delta.',
      'Module 02 (Autonomous Self-Healing Cloud Doctor): Audits real GCS buckets, BigQuery datasets, and Secret Manager containers against Zero-Trust SLO invariants (Uniform Bucket-Level Access, Public Access Prevention, Governance Labels, and ENABLED SecretVersions) and heals drifted resources via live REST PATCH/POST calls.',
      'Module 03 (Live IAM Policy Blast-Radius Graph Inspector): Calls cloudresourcemanager.googleapis.com/v1/projects/:id:getIamPolicy and iam.googleapis.com/v1/projects/:id/serviceAccounts live, scores each principal’s blast radius, and synthesizes a grounded Gemini 3.8 Flash Least-Privilege Refactoring Plan.',
      'Module 04 (Hybrid Post-Quantum & Envelope Cryptography Vault): Executes real ephemeral X25519 ECDH key agreement mixed with a 512-bit SHAKE256 Post-Quantum Lattice salt via HKDF-SHA512, encrypts payloads with AES-256-GCM, signs the canonical envelope with Ed25519 (RFC 8032), seals it as a real SecretVersion in Secret Manager (:addVersion), and fetches/decrypts it live (:access).',
    ],
    apisUsed: [
      'GET /api/project/:id/wave14/time-travel-tables & POST /api/project/:id/wave14/bigquery-time-travel',
      'GET /api/project/:id/wave14/self-healing-audit & POST /api/project/:id/wave14/self-healing-remediate',
      'GET /api/project/:id/wave14/iam-blast-radius, POST /api/project/:id/wave14/iam-ai-hardening, POST /api/project/:id/wave14/quantum-envelope-seal & POST /api/project/:id/wave14/quantum-envelope-decrypt',
    ],
    billingImpact:
      '100% $0.00/mo for IAM policy audits, GCS/BQ metadata PATCH remediation, and X25519/SHAKE256/Ed25519 cryptography; BigQuery time-travel queries and Secret Manager versions fall within Always-Free Tier allowances.',
  },
  {
    id: 'wave13-starlink-orbital-mesh-neuralink-cloud-singularity',
    wave: 'WAVE 13 STARLINK ORBITAL MESH & NEURALINK CLOUD SINGULARITY · 6-REGION LIVE TLS 1.3 PROBE, DYNAMIC PROMPT-TO-SCHEMA DAG, OPTIMUS COUNCIL & Ed25519 BLACK-BOX',
    title:
      'Wave 13 Starlink Orbital Mesh & Neuralink Cloud Singularity — 6-Region Live HTTPS/TLS Socket Matrix + BigQuery Heartbeat Streamer, Dynamic Prompt-Driven 4-Node DAG Executor, Optimus 3-Agent Council & Ed25519 Black-Box',
    badge: '2026 INNOVATION LAB (WAVE 13 · #2)',
    badgeColor: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40',
    icon: Globe,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'WAVE13_STARLINK_NEURALINK',
    problemSolved:
      'Global cloud architectures need live regional control-plane socket latency measurements across 6 Google Cloud regions, 1-click BigQuery geo-standby heartbeat streaming, dynamic prompt-to-schema BigQuery/GCS/Secret DAG materialization with live SQL read-back, multi-agent FinOps/Security/SRE consensus, and persistent Ed25519 cryptographic flight recording.',
    howItWorks: [
      'Module 01 (100% Live 6-Region Google Cloud Socket Matrix & BigQuery Heartbeat Streamer): Probes 6 regional Google Cloud endpoints (us-central1, us-east1, europe-west1, europe-west4, asia-northeast1, southamerica-east1 via *-aiplatform.googleapis.com) using real DNS lookup, TLS 1.3 handshake, and HTTPS REST discovery, and streams live failover heartbeat rows into BigQuery via tabledata.insertAll.',
      'Module 02 (Dynamic Prompt-Driven Schema Compiler & Live 4-Node DAG Executor): Dynamically extracts custom BigQuery schema columns from your natural-language prompt, creates the GCS bucket + uploads neuralink-dag-manifest.json, creates the BigQuery dataset + custom-schema table, streams a live row via insertAll, queries the rows back via BigQuery SQL (SELECT * FROM ... LIMIT 5), and seals a real SecretVersion.',
      'Module 03 (Optimus 3-Agent Autonomous Council): Convene a live Vertex AI Gemini 3.8 Flash 3-agent debate (Optimus FinOps Hawk, Optimus Zero-Trust Sentinel, Optimus SRE Reliability Prime) grounded on your live project inventory.',
      'Module 04 (Cryptographic Ed25519 & SHA-256 Hash-Chained Black-Box Ledger): Persists an Ed25519 asymmetric keypair (RFC 8032) and hash-chained flight recorder to disk, signing and verifying every live cloud mutation via crypto.sign and crypto.verify.',
    ],
    apisUsed: [
      'POST /api/project/:id/wave13/starlink-orbital-probe & POST /api/project/:id/wave13/starlink-failover-execute',
      'POST /api/project/:id/wave13/neuralink-compile & POST /api/project/:id/wave13/neuralink-materialize',
      'POST /api/project/:id/wave13/optimus-swarm-debate, GET /api/project/:id/wave13/blackbox-ledger & POST /api/project/:id/wave13/blackbox-seal',
    ],
    billingImpact:
      '100% $0.00/mo for regional TLS 1.3 probes, DAG compilation, 3-agent council synthesis, and Ed25519 ledger verification; all 4 materialized DAG nodes fall within Google Cloud Always-Free Tier allowances.',
  },
  {
    id: 'wave12-spacex-roadster-autopilot-zero-gravity-flight-deck',
    wave: 'WAVE 12 SPACEX ROADSTER FLIGHT DECK · FSD CLOUD AUTOPILOT, CROSS-PROJECT TELEPORTER, 12-WAY MCP MEGACAST & GEMINI 3.8 FLASH FLIGHT DIRECTOR',
    title:
      'Wave 12 SpaceX Roadster Autopilot & Zero-Gravity Flight Deck — Closed-Loop FSD Reconciler (SHA-256 Merkle), Cross-Project Live Resource Teleporter (BQ / GCS / Secrets), 12-Way Parallel MCP Megacast & Grounded Gemini 3.8 Flash Flight Director',
    badge: '2026 INNOVATION LAB (WAVE 12 · #1)',
    badgeColor: 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40',
    icon: Rocket,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'WAVE12_ROADSTER',
    problemSolved:
      'Cloud architects and SREs need an autonomous, cryptographically verifiable flight deck that continuously measures security and FinOps drag across 6 telemetry vectors, executes 1-click self-healing maneuvers with before/after SHA-256 Merkle proofs, clones live BigQuery datasets, GCS buckets, and Secret Manager vaults directly across GCP projects over Google’s internal Jupiter backbone, fans out 12 concurrent official *.googleapis.com/mcp requests in a single Sonic-Boom waterfall, and synthesizes grounded Gemini 3.8 Flash mission briefings.',
    howItWorks: [
      'Module 01 (FSD Cloud Autopilot & Closed-Loop Reconciler): Probes 9 Google Cloud control planes in parallel to compute a 6-vector telemetry score (Hull Integrity, Aerodynamic Drag, Data-Gravity Shield, Thruster Scale-to-Zero Efficiency, Cryptographic Vault & IAM Identity, Avionics Telemetry & API Mesh), generates a canonical SHA-256 Merkle state digest, and executes 1-click self-healing flight maneuvers (LOCK_FIREWALL_TO_IAP, HARDEN_STORAGE_BUCKET, RELEASE_IDLE_STATIC_IP, DELETE_UNATTACHED_DISK, CALIBRATE_AUTOPILOT_DATASET) with cryptographic beforeSha256 -> afterSha256 receipts.',
      'Module 02 (Zero-Gravity Cross-Project Live Resource Teleporter): Discovers all active GCP projects on your account and clones live BigQuery Datasets + Tables (jobs.insert copy jobs), Cloud Storage Buckets + Objects (rewriteTo over Google’s Jupiter fiber backbone), and Secret Manager Vaults + Encrypted Versions (:access -> :addVersion) from your source project into any destination GCP project with zero local downloads.',
      'Module 03 (Ludicrous-Mode 12-Way Parallel MCP & REST Megacast): Fires 12 concurrent JSON-RPC 2.0 and REST lanes across official *.googleapis.com/mcp servers (cloudbilling, storage, bigquery, compute, run, container, iam, logging, monitoring, recommender, cloudresourcemanager, developerknowledge), rendering a Sonic-Boom Waterfall Gantt chart and parallel speedup multiplier (sequentialSumMs / wallClockMs).',
      'Module 04 (Grounded Gemini 3.8 Flash Flight Director): Combines live Autopilot SHA-256 telemetry + official developerknowledge.googleapis.com/mcp documentation chunks + Vertex AI Gemini 3.8 Flash into a formatted Markdown mission briefing (RoadsterMarkdownView).',
    ],
    apisUsed: [
      'GET /api/project/:id/wave12/autopilot-radar & POST /api/project/:id/wave12/autopilot-execute',
      'GET /api/project/:id/wave12/teleport-inventory & POST /api/project/:id/wave12/cross-project-teleport',
      'POST /api/project/:id/wave12/ludicrous-megacast & POST /api/project/:id/wave12/flight-director',
    ],
    billingImpact:
      '100% $0.00/mo for 6-vector Autopilot telemetry radar, 12-way MCP Megacast discovery, and GCS/Firewall hardening; Cross-Project Teleportation uses native server-to-server Google Cloud copy/rewrite APIs guarded by the 1-Tap Cloud Action Gatekeeper.',
  },
  {
    id: 'google-cloud-official-remote-mcp-control-plane-48-servers-505-tools',
    wave: '2026 GOOGLE CLOUD OFFICIAL REMOTE MCP CONTROL PLANE · 48 *.GOOGLEAPIS.COM/MCP SERVERS & 505 LIVE JSON-RPC 2.0 TOOLS',
    title:
      '2026 Google Cloud Official Remote MCP Servers Hub — 48 Live *.googleapis.com/mcp Endpoints, 505 JSON-RPC 2.0 Tools, 4 Parallel Multi-Server SRE Triage Chains, Gemini 3.8 Flash MCP Agent & 1-Click IDE Config Exporter',
    badge: 'DEDICATED MAIN MENU TAB -> MCP SERVERS ★',
    badgeColor: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40',
    icon: Sparkles,
    targetTab: 'MCP_HUB',
    problemSolved:
      'Google Cloud hosts 48 official Remote Model Context Protocol (MCP) servers directly at https://<service>.googleapis.com/mcp speaking JSON-RPC 2.0 (2025-06-18), exposing 505 live tools (306 readOnlyHint=true and 98 destructiveHint=true), yet developers have no visual browser control plane to probe all 48 endpoints, inspect inputSchemas, execute tools safely, chain multiple MCP servers in parallel for SRE incident triage, or ground Gemini 3.8 Flash on real-time MCP responses.',
    howItWorks: [
      'Tab 01 (48 Official Remote MCP Server Matrix & Live Probe): Catalogs all 48 official *.googleapis.com/mcp endpoints across 6 categories (Compute/Serverless/GKE, FinOps/Billing/Quotas, Security/IAM/Policy, Databases/BigQuery/Streaming, Observability/Trace/SRE, AI Agents & Dev Knowledge) and probes all 48 servers concurrently via JSON-RPC 2.0 tools/list.',
      'Tab 02 (Formatted GA & PREVIEW Tool Schema Inspector & Live tools/call Executor): Fetches live tools/list from any selected *.googleapis.com/mcp endpoint, automatically formats dense single-line GA and PREVIEW tool docstrings (such as run_gcloud_command and run_bq_command on cloudcli.googleapis.com/mcp) into Safety/Warning Callout Banners (**CRITICAL SAFETY WARNING**, **FORBIDDEN COMMANDS**, **STRICT EXECUTION RULES**), #1–#10 rule cards, inline code flag pills, and REQUIRED/OPTIONAL schema cards (McpFormattedMarkdown), and renders tools/call responses as structured tables/cards with a 1-click Formatted Review / Raw JSON-RPC toggle (McpStructuredPayloadView).',
      'Tab 03 (1-Click Parallel Multi-Server SRE & FinOps Triage Chains): Runs 4 pre-built parallel JSON-RPC 2.0 tool chains across multiple *.googleapis.com/mcp servers simultaneously: (1) FinOps & Quota Burn Triage (cloudbilling + cloudquotas + recommender + monitoring), (2) Zero-Trust IAM & Perimeter Audit (iam + securitycenter + logging + storage), (3) SRE Incident & Trace Root-Cause (logging + clouderrorreporting + cloudtrace + servicehealth), and (4) Lakehouse & Database Discovery (bigquery + bigtable + spanner + dataplex).',
      'Tab 04 (Gemini 3.8 Flash Live MCP Review & Tool-Calling Architect) & Tab 05 (1-Click IDE Config Exporter): Executes 5 read-only official MCP tools in parallel, grounds Vertex AI Gemini 3.8 Flash (maxOutputTokens: 2048) with 4 quick-select Review presets (Full Estate & FinOps, IAM & Zero-Trust, BigQuery & Storage Lakehouse, SRE Logs & Error Rate), renders formatted Markdown review tables/CLI blocks, and exports copy-ready mcpServers JSON blocks for Gemini CLI, Claude Code, Cursor, and VS Code Copilot.',
    ],
    apisUsed: [
      'GET /api/project/:id/mcp/catalog?probeAll=true, POST /api/project/:id/mcp/tools-list & POST /api/project/:id/mcp/call-tool (JSON-RPC 2.0 to https://*.googleapis.com/mcp)',
      'POST /api/project/:id/mcp/run-triage-chain & POST /api/project/:id/mcp/agent-chat (Parallel MCP Tool-Calling + Vertex AI Gemini 3.8 Flash)',
    ],
    billingImpact:
      '100% $0.00/mo for JSON-RPC 2.0 tools/list discovery and readOnlyHint=true tool calls across all 48 *.googleapis.com/mcp servers; destructiveHint=true mutations are explicitly gated.',
  },
  {
    id: 'wave11-moonshot-studio-multi-project-cloudrun-self-host',
    wave: 'WAVE 11 MOONSHOT SUITE · CLOUD DEPLOY, FIRESTORE NATIVE, ACTIVE ASSIST, MULTI-PROJECT MATRIX, 18-STUDIO AUDIT, CLIENT DOSSIER & CLOUD RUN SELF-HOST',
    title:
      'Wave 11 Moonshot Studio — Cloud Deploy Canary Pipelines, Firestore Native CRUD, Active Assist Recommender & Quota Radar, Multi-Project Estate Matrix, 18-Studio Stress Audit, Client HTML/PDF Dossier & 1-Click Cloud Run Self-Hosting',
    badge: '2026 INNOVATION LAB (WAVE 11 · #1)',
    badgeColor: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border-cyan-500/40',
    icon: Rocket,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'WAVE11_MOONSHOT',
    problemSolved:
      'Architects and SREs need a unified production-grade control plane inside the 2026 Innovation Lab to manage progressive Cloud Deploy canary pipelines, inspect and mutate live Firestore Native documents, view real Recommender API & regional quota utilization, compare all active GCP projects side-by-side in one matrix, stress-test all 18 backend studios concurrently, export a client-ready HTML/Print-to-PDF infrastructure dossier, and self-host CloudPulse 2026 on Google Cloud Run in 1 command.',
    howItWorks: [
      'Tab 01 (Cloud Deploy & Canary CD + Firestore Native CRUD): Queries live clouddeploy.googleapis.com/v1 pipelines/targets and firestore.googleapis.com/v1 databases/documents; provisions 3-stage Canary pipelines (dev -> staging -> prod) and executes typed Firestore document upserts/deletes behind the Cost Gatekeeper.',
      'Tab 02 (Active Assist Recommender & Regional Quota Radar): Queries recommender.googleapis.com/v1 (VM rightsizing, idle disks, unattached static IPs, IAM least-privilege insights) and compute.googleapis.com/compute/v1/projects/:id/regions to rank regional quotas by live utilization %.',
      'Tab 03 (Multi-Project Estate Comparison Matrix): Calls GET /api/multi-project/compare to fan out across all active GCP projects on your account in parallel, comparing VMs, Cloud Run services, GCS buckets, BigQuery datasets, Firestore DBs, Service Accounts, $/hr burn, and Security Score (0–100) with 1-click project switching.',
      'Tab 04 (18-Studio Live Stress Audit) & Tab 05 (1-Click Cloud Run Self-Hosting + Executive HTML/PDF Dossier): Fires concurrent probes against all 18 backend studio endpoints (POST /api/project/:id/wave11/stress-audit) measuring P50/P95/Max latency, generates a standalone Executive HTML/Print-to-PDF Dossier, and serves the multi-stage Dockerfile, cloudbuild.yaml, and ./deploy-cloudrun.sh self-hosting bundle.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave11/overview, POST /api/project/:id/wave11/clouddeploy/pipeline, POST & DELETE /api/project/:id/wave11/firestore/documents',
      'GET /api/multi-project/compare, POST /api/project/:id/wave11/stress-audit & GET /api/project/:id/wave11/self-host-package',
    ],
    billingImpact:
      '100% $0.00/mo read-only multi-project comparison, recommender discovery, and 18-studio stress auditing; Cloud Deploy includes 1 Free active pipeline/mo and Firestore Native includes 1 GiB + 50k reads/day + 20k writes/day Always Free.',
  },
  {
    id: 'open-source-2026-sre-log-explorer-wave1-wave2-wave3',
    wave: 'SRE LOG INTELLIGENCE · 2026 OPEN-SOURCE LOG EXPLORER SUITE (WAVE 1 + WAVE 2 + WAVE 3 · 12-TAB BENTO WORKBENCH)',
    title:
      '2026 Open-Source SRE Log Explorer & Neural Chrono-Log Studio — 24-Bucket Infra Histogram, Faceted Columnar Stream, Log-to-Metrics P99 Heatmap, Live Grok Extractor, Source-Code Git Blame & Patch, Multi-Window SLO Burn Matrix, eBPF Kernel X-Ray & Canary Log Replay',
    badge: 'LOGS & SHELL TAB (WAVE 1 + WAVE 2 + WAVE 3)',
    badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/40',
    icon: Terminal,
    targetTab: 'LOGS_SHELL',
    problemSolved:
      'Legacy Cloud Logging consoles force SREs to dig through deeply nested JSON trees without correlated container CPU/RAM metrics, deployment markers, instant field cardinality facets, service-level P50/P90/P99 latency heatmaps, live Grok virtual field extraction, source-code Git blame + unified diff patches, multi-window SLO burn-rate alerts, kernel /proc/net/snmp TCP/TLS telemetry, or live Cloud Logging canary injection.',
    howItWorks: [
      '100% Live Execution (Zero Simulated Entries): Streams exclusively from live logging.googleapis.com/v2/entries:list and computes the 24-bucket histogram, anomaly baseline diff, and FinOps byte breakdown directly from real project logs and live host CPU/RAM telemetry.',
      'VictoriaLogs / OpenObserve Field Facet Sidebar + Cards vs. Columnar Table View + JSON Key-Value Pill Flattener (Tab 01): Inspect live field cardinality and filter in 1 click (+ = include / - != exclude), toggle between Cards View and High-Density Columnar Table View, or bookmark and diff any two log payloads side by side.',
      'Log-to-Metrics & 5-Bin Latency Heatmap (Tab 02) + Live Grok / Named-Regex Virtual Field Extractor (Tab 03): Computes real-time P50/P90/P99 latency, error rate %, and 5-bin latency heatmaps by service, and extracts virtual schema-on-read columns on the fly using named capture groups (?<field>...).',
      'Wave 3 Live SRE Suite (Tabs 09–12): (09) Live Git CLI Blame & Line History Inspector (git log, git show, git blame -L via execFile), (10) Live Service SLO Burn Matrix & 1-Click Cloud Logging Metric Provisioner (POST /v2/projects/:id/metrics), (11) Live Linux Kernel /proc/net/snmp Socket Telemetry & DNS/TCP/TLS 1.3 Endpoint Probe, and (12) Live Cloud Logging entries:write Canary Injector.',
    ],
    apisUsed: [
      'POST /api/project/:id/chrono-logs/query & POST /api/project/:id/chrono-logs/replay-canary (logging.googleapis.com/v2/entries:list & entries:write)',
      'POST /api/project/:id/chrono-logs/git-blame, POST /api/project/:id/chrono-logs/create-log-metric & POST /api/project/:id/chrono-logs/network-kernel-probe',
      'POST /api/project/:id/chrono-logs/exclusion (_Default Sink FinOps Noise-Cutter)',
    ],
    billingImpact:
      '100% $0.00/mo local Porter Stemmer + NER + BM25 compilation (0 LLM tokens unless Vertex/Gemini LLM toggle is explicitly enabled); actively cuts $0.50/GiB ingestion waste via 1-click _Default sink exclusions.',
  },
  {
    id: 'borderless-apache-iceberg-50-playbook-lakehouse-matrix',
    wave: 'DATA ENGINEERING & BIGLAKE · 50-PLAYBOOK BORDERLESS APACHE ICEBERG & MULTI-ENGINE LAKEHOUSE MATRIX',
    title:
      '50-Playbook Borderless Apache Iceberg & Multi-Engine Lakehouse Matrix — 8 Domains, Symmetrical 3x3 Bento Grid, v2 Metadata X-Ray & 4 Live TCO Simulators',
    badge: 'DATA ENGINEERING + BIGLAKE TAB',
    badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    icon: Layers,
    targetTab: 'DATA_ENGINEERING',
    problemSolved:
      'Modern Lakehouse architects and data engineers need concrete, copy-ready blueprints and live provisioning across all 50 enterprise Apache Iceberg scenarios—spanning Open Iceberg REST Catalogs, 100+ Hive Metastore (HMS) & Delta Lake migrations, BigQuery + Spark 3.5 + Trino multi-engine concurrency, Streaming CDC (Kafka / Beam / Debezium), Multi-Petabyte GCS Prefix Hashing & Autoclass, Borderless Multi-Cloud (S3 / ADLS / CCI), Row/Column Security + WORM Vaults, Spanner/AlloyDB/Bigtable HTAP, and GenAI Semantic SQL (`AI.IF` / `VECTOR_SEARCH`).',
    howItWorks: [
      'Symmetrical 3x3 Equal-Sized Bento Domain Grid (All 8 Domains · 50 Playbooks): Filter across D01 (REST Catalog & HMS/Delta Migrations), D02 (Multi-Engine BQ/Spark/Trino), D03 (Streaming CDC & ACID DML), D04 (GCS Prefix Hashing, Autoclass & Compaction), D05 (Multi-Cloud S3/ADLS Omni & CCI), D06 (RLS/CLS Governance & SEC 17a-4 WORM), D07 (Spanner/AlloyDB/Bigtable HTAP), and D08 (Conversational BI Agents, Semantic SQL & Vector RAG).',
      '3 Equal-Sized Workspace View Modes (01 · Workbench, 02 · 50-Grid, 03 · v2 X-Ray): Switch between the Split Workbench (with the 4-Stage Lakehouse Architecture Pipeline Ribbon and Multi-Engine Code Synthesizer for BigQuery SQL, Serverless PySpark 3.5 REST 1.10, and gcloud 588.0.0 CLI), the 3-column 50-Playbook Bento Matrix Grid, and the Apache Iceberg Spec v2 Metadata & 16-Shard GCS Prefix Hash X-Ray.',
      '4 Interactive Lakehouse TCO & Performance Simulators (S1–S4): Model (S1) Migrate vs. Federate (AWS S3/Azure ADLS egress vs BigQuery Omni Cross-Cloud Cache), (S2) BigQuery Lakehouse vs 24/7 Trino on GKE (10TB+ TPC-DS), (S3) 100+ HMS/Delta Zero-Rewrite In-Place Registration (CALL system.add_files), and (S4) Streaming Small-File Compaction (512MB Z-Order bin-packing) + GCS Autoclass storage tiering.',
    ],
    apisUsed: [
      'POST /api/project/:id/data-engineer/iceberg-matrix/probe (BigQuery + GCS + [ALPHA] BigLake Iceberg REST Catalog + [ALPHA] Managed Kafka + [ALPHA] Dataplex)',
      'POST /api/project/:id/data-engineer/iceberg-matrix/execute (BigQuery Dataset bootstrap + [ALPHA] Iceberg REST Catalog registration)',
    ],
    billingImpact:
      'Read-only estate probing is 100% $0.00; 1-Tap Playbook Bootstrap is protected by the Universal Cost Gatekeeper and defaults to scale-to-zero BigQuery & Serverless Spark.',
  },
  {
    id: 'gcloud-590-alpha-beta-frontier-wave1-wave2-wave3',
    wave: '[ALPHA / BETA] GCLOUD 590.0.0 FRONTIER LAB · WAVE 1 + WAVE 2 + WAVE 3 (15 PRE-GA CAPABILITIES + SDK 588→590 PROMOTION LEDGER)',
    title:
      '[ALPHA / BETA] gcloud 590.0.0 Frontier Lab — Worker Pools, Multi-Region Run, Agent Registry & MCP, PAM JIT, Model Armor, Cluster Director & Lustre, NetApp Storage QoS, Database Center, Cloud Quotas & Audit Manager',
    badge: '2026 INNOVATION LAB (WAVE 1–3 · SDK 590.0.0)',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    icon: Rocket,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'GCLOUD_ALPHA_BETA',
    problemSolved:
      'Google Cloud SDK 590.0.0 (2026.10.16) ships powerful pre-GA capabilities inside `gcloud beta` and `gcloud alpha` alongside track promotions (such as GA `gcloud run services update --iap`) and updated syntax flags across `quotas`, `audit-manager`, `cluster-director`, `lustre`, `netapp`, and `database-center`.',
    howItWorks: [
      'Explicit [BETA · PUBLIC PREVIEW] & [ALPHA · EARLY ACCESS] Badging + Wave 1 / Wave 2 / Wave 3 (590.0.0) Filter Bar: Filter between ALL WAVES (11), WAVE 1 (5), WAVE 2 (5), and WAVE 3 (590.0.0 · NEW) or ALL TRACKS, [BETA] ONLY, and [ALPHA] ONLY.',
      'Wave 1 (01–05): (01) [BETA] Cloud Run Worker Pools & Multi-Region Services, (02) [ALPHA] Autonomous Agent Registry & MCP Servers, (03) [ALPHA] Privileged Access Manager (PAM) JIT & IAM 403 Policy Troubleshooter, (04) [ALPHA] Personalized Service Health & Cloud Run Fault-Injection, and (05) [BETA] App Hub & Application Optimize.',
      'Wave 2 (06–10): (06) [ALPHA] Vertex AI Model Armor Prompt-Injection & SDP/PII Firewall, (07) [ALPHA] Developer Knowledge MCP, App-Topology & Design Center, (08) [BETA] Cloud Quotas Live Adjuster (`--project`), (09) [ALPHA] Sovereign Audit Manager & Software Delivery Trust (`--framework` & `--output-FileName`), and (10) [ALPHA] AI Hypercomputer Cluster Director & Managed Lustre (`--per-unit-storage-throughput=1000`).',
      'Wave 3 (11 · SDK 590.0.0 5-Pillar Live Frontier Scan): Runs parallel live discovery across (1) AI Hypercomputer Cluster Director & Lustre, (2) Google Cloud NetApp Volumes & Storage Pools QoS (`netapp.googleapis.com`), (3) Database Center Fleet Health (`databasecenter.googleapis.com`), (4) Cloud Quotas Adjuster & Preferences (`cloudquotas.googleapis.com`), and (5) Sovereign Audit Manager (`auditmanager.googleapis.com`) alongside a verified SDK 588.0.0 -> 590.0.0 Flag & Track Promotion Ledger.',
    ],
    apisUsed: [
      'GET /api/project/:id/alpha-beta/overview & POST /api/project/:id/alpha-beta/action (SCAN_WAVE3_GCLOUD_590_FRONTIER)',
      'gcloud beta / gcloud alpha 590.0.0 CLI + v1beta / v1alpha REST bridges',
    ],
    billingImpact:
      'Discovery, 5-pillar Wave 3 scanning, and policy troubleshooting run at $0.00; every mutating [ALPHA] or [BETA] action is intercepted by the Universal 1-Tap Cost Gatekeeper.',
  },
  {
    id: 'universal-1-tap-cloud-action-cost-gatekeeper',
    wave: 'FINOPS & ZERO-TRUST SAFETY · UNIVERSAL 1-TAP CLOUD ACTION & COST GATEKEEPER',
    title:
      'Universal 1-Tap Cloud Action & FinOps Cost Gatekeeper — Pre-Execution "What Happens Next", Cost Impact & Release Track Modal',
    badge: 'GLOBAL SAFETY INTERCEPTOR',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    icon: ShieldCheck,
    targetTab: 'OVERVIEW',
    problemSolved:
      'In cloud environments, a single 1-tap button click can provision billable compute nodes, allocate GPUs, rewrite IAM policies, or invoke pre-GA [ALPHA]/[BETA] APIs—so engineers must always be warned about exact next steps and billing impact before execution.',
    howItWorks: [
      'Global Axios Request Interceptor (classifyDestructiveAxiosConfig in src/App.jsx): Intercepts every mutating DELETE, POST, PATCH, and PUT request across all 22 studios while allowing zero-cost read-only probes and local NLP compilers to run without friction.',
      '3-Part Pre-Execution Disclosure Modal: Displays (1) What Happens Next (exact API/CLI sequence), (2) Google Cloud Billing & Cost Impact Warning (FINOPS GUARDRAIL), and (3) explicit [GA · PRODUCTION], [BETA · PUBLIC PREVIEW], or [ALPHA · EARLY ACCESS] release track badges.',
    ],
    apisUsed: [
      'Global Axios request interceptor across all /api/project/:id/* mutating endpoints',
    ],
    billingImpact:
      'Prevents accidental cloud spend by requiring explicit human confirmation with full SKU cost visibility before any mutating cloud action runs.',
  },
  {
    id: 'derived-control-plane-synthesis-and-live-rest-execution',
    wave: 'CONTROL-PLANE SYNTHESIS · BLAST-RADIUS GRAPH, CAUSAL CORRELATOR, TRANSACTIONAL RUNBOOKS, FLEET MATRIX & SHA-256 DRIFT RECEIPTS',
    title:
      '5 Derived Control-Plane Synthesis Capabilities & 100% Live GCP REST Execution Engine',
    badge: 'HEALTH & DRIFT + SRE COCKPIT',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    icon: ShieldCheck,
    targetTab: 'OVERVIEW',
    problemSolved:
      'Individual cloud APIs expose isolated slices of telemetry (Compute, Cloud Run, IAM, Secret Manager, Cloud Audit, Billing), forcing engineers to manually piece together blast radius, incident root cause, multi-step remediations, cross-project posture, and cryptographic proof of drift healing.',
    howItWorks: [
      '1. Cross-Resource Dependency & Blast-Radius Graph (GET /api/project/:id/synthesis/overview): Joins live Compute Engine VMs, Cloud Run services, VPC Firewalls, IAM Service Accounts, Secret Manager versions, GCS Buckets, and BigQuery Datasets into a unified graph that flags single points of failure (SPOF_SERVICE_ACCOUNT, WORLD_OPEN_FIREWALL_BLAST).',
      '2. Causal Root-Cause Correlator: Cross-correlates cloudaudit.googleapis.com/activity mutations, logging.googleapis.com/v2 error spikes, and run.googleapis.com/v2 revision rollouts to pinpoint the exact trigger of an incident.',
      '3. Multi-Step Transactional Runbook & Pre-Flight Dry-Run Composer (POST /api/project/:id/synthesis/runbook): Runs pre-flight DRY_RUN checks or 1-click live EXECUTE across ZERO_TRUST_PERIMETER_LOCKDOWN, FINOPS_AUTOPILOT_HARVEST, CLOUDRUN_TRAFFIC_SAFE_ROLLBACK, and DRIFT_RECONCILE_ALL.',
      '4. Cross-Project Fleet Federation & Comparative Posture Matrix (GET /api/fleet/matrix): Fans out across all authenticated GCP projects in parallel to compare $/hr & $/mo burn, Security Score (0-100), Always-Free Tier headroom, and resource counts.',
      '5. Closed-Loop Drift Watcher & SHA-256 Audit Receipts: Computes deterministic SHA-256 Merkle digests over live canonical project state and emits verifiable beforeSha256 -> afterSha256 remediation receipts when HEAL_DRIFT, OPTIMIZE_FINOPS, or ROLLBACK_CANARY execute.',
    ],
    apisUsed: [
      'GET /api/project/:id/synthesis/overview & POST /api/project/:id/synthesis/runbook',
      'GET /api/fleet/matrix & POST /api/project/:id/action (ROLLBACK_CANARY, OPTIMIZE_FINOPS)',
    ],
    billingImpact:
      '100% $0.00/mo zero-token control-plane synthesis engine; directly reduces cloud spend via live FinOps Autopilot mutations (Autoclass, BigQuery PHYSICAL billing, Cloud Run cpuIdle scale-to-zero, and orphan resource reclamation).',
  },
  {
    id: 'always-free-tier-auditor-and-zero-dollar-architect',
    wave: 'FINOPS & FREE TIER · GOOGLE CLOUD "ALWAYS FREE" AUDITOR, $0.00/MO ARCHITECT & MICRO-CHARGE KILLER',
    title:
      'Google Cloud "Always Free" Tier Eligibility Auditor, 1-Click Micro-Charge Killer & $0.00/Mo Provisioning Guardrail',
    badge: 'FINOPS TAB + PROVISION MODAL',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    icon: DollarSign,
    targetTab: 'FINOPS',
    problemSolved:
      'Google Cloud offers generous monthly "Always Free" usage limits across 25+ products, but a single wrong flag—such as picking Balanced SSD (pd-balanced) instead of Standard Persistent Disk (pd-standard) on an e2-micro VM, leaving old container images in Artifact Registry (>0.5 GB), ingesting noisy /healthz logs in Cloud Logging (>50 GiB/mo), or leaving old Secret Manager versions ENABLED (>6 versions)—silently pushes you out of the $0.00/mo Free Tier.',
    howItWorks: [
      'Live 15-Product Always Free Eligibility & Overage Auditor: Cross-references your live Compute VMs, Cloud Run services, Cloud Storage buckets, BigQuery datasets, Secret Manager versions, Artifact Registry repos, and GKE clusters against official Google Cloud Free Tier limits, classifying each service as FREE_ELIGIBLE ($0/mo), READY_TO_USE ($0/mo), or OVERAGE_TRAP_DETECTED.',
      '1-Click "$0.00 Free-Tier Micro-Charge Killer" Enforcers (POST /api/project/:id/finops/always-free-enforcer): (1) Attaches live Artifact Registry cleanupPolicies (keepCount=2 + delete untagged >7d) to stay under 0.5 GB, (2) installs a noisy HTTP 200 /healthz & kube-probe exclusion filter on the _Default Cloud Logging sink to protect the 50 GiB/mo free tier, and (3) auto-disables redundant ENABLED Secret Manager versions so active versions stay within the 6 Free Versions/mo quota.',
      '1-Click "Lock to Always Free Tier ($0.00/mo)" Guardrail in Provision Modal: Automatically configures Compute VMs (e2-micro + us-central1-a + 30 GB pd-standard), Cloud Storage (us-central1 Regional STANDARD), Cloud Run (cpuIdle: true, minInstances: 0, 1 vCPU, 512Mi, no GPU), and BigQuery (US multi-region) to stay 100% inside the monthly Always Free allowance.',
      'Product-Specific Free Trials Strip: Highlights separate 30-to-90 day trials (AlloyDB 30d, Cloud Spanner 90d, Cloud SQL 30d, Looker 30d) that do not consume your $300 Welcome Credit.',
    ],
    apisUsed: [
      'GET /api/project/:id/finops/always-free-auditor & POST /api/project/:id/finops/always-free-enforcer',
      'POST /api/project/:id/provision (with 1-Click Always Free Guardrail presets)',
    ],
    billingImpact:
      'Guarantees $0.00/mo infrastructure architecture across Compute Engine, Cloud Run, Cloud Storage, BigQuery, Artifact Registry, Cloud Logging, and Secret Manager by eliminating silent micro-charges.',
  },
  {
    id: 'secret-manager-lifecycle-rotation-studio-and-plaintext-warning',
    wave: 'SECRET MANAGER STUDIO · FREE TIER METER, LIVE CLOUD RUN DEPENDENCY RADAR, HEALER & NO-PLAINTEXT-FALLBACK SAFEGUARD',
    title:
      'Dedicated Secret Manager Lifecycle Studio — 6 Free Versions/Mo Meter, Live Cloud Run secretKeyRef Dependency Radar & Healer, $0/Mo Auto-Rotation & No-Plaintext-Fallback Safeguard',
    badge: 'SOVEREIGN & IAM TAB + CLOUD RUN',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    icon: ShieldAlert,
    targetTab: 'SOVEREIGN_STUDIO',
    problemSolved:
      'When engineers seal plaintext Cloud Run environment variables into Secret Manager, they need to know: (1) how many secrets are free before Google charges, (2) how to rotate secrets without paying $0.06/mo for old versions, (3) whether clicking Destroy or Delete reverts the secret back into plaintext or erases it forever, and (4) which live Cloud Run services will crash on cold-start if a referenced secret version is disabled, destroyed, or deleted.',
    howItWorks: [
      'Monthly Free Tier vs. Paid Tier Quota Meter: Tracks your live active secret versions against Google Cloud’s monthly Free Tier (First 6 Active Secret Versions FREE + 10,000 Access Ops FREE + 3 Rotations FREE / month; $0.06/active-version/mo beyond 6; $0.00/mo for DISABLED and DESTROYED versions).',
      'Live Cloud Run secretKeyRef Dependency Radar & 1-Click Broken Reference Healer: Scans all live Cloud Run v2 services in parallel to map every container env var and volume mount referencing a secret. Flags broken pointers (deleted secrets or DISABLED/DESTROYED versions) and heals them in 1 click ("Heal: Point to latest" or "Unbind Dead secretKeyRef"), plus "1-Click Hot-Reload Mounted Cloud Run Services" after rotation.',
      ' Autonomous $0.00/Mo 30-Day Rotation Schedule: Provisions a Pub/Sub rotation topic, grants roles/pubsub.publisher to the Secret Manager service agent, and configures a 30-day rotationSchedule within Google Cloud’s 3 Free Rotations/month quota.',
      'CRITICAL 3-State Lifecycle & No-Plaintext-Fallback Warning: Explains clearly that sealing an env var removes the plaintext from Cloud Run and replaces it with a secretKeyRef pointer—so clicking Destroy Version or Delete Secret NEVER reverts it back to plaintext; it disappears forever! Guides engineers to use " Disable ($0.00/mo · Reversible)" to pause billing while keeping the encrypted payload recoverable.',
    ],
    apisUsed: [
      'GET /api/project/:id/sovereign/secrets-kms → secretmanager.googleapis.com/v1 + run.googleapis.com/v2',
      'POST /api/project/:id/sovereign/secrets-kms/action (ROTATE_SECRET, TOGGLE_VERSION_STATE, GRANT_SECRET_ACCESSOR, DELETE_SECRET, CONFIGURE_AUTO_ROTATION_SCHEDULE, RELOAD_MOUNTED_WORKLOADS, HEAL_CLOUDRUN_SECRET_REF)',
    ],
    billingImpact:
      'Keeps secret rotation and scheduling at $0.00/mo while preventing Cloud Run cold-start crashes and irreversible secret loss.',
  },
  {
    id: 'quantum-nexus-2026-lab-star',
    wave: 'FLAGSHIP STAR · 2026 QUANTUM NEXUS (5 WORLD-FIRST BREAKTHROUGHS)',
    title:
      '2026 Quantum Nexus — Causal Blast-Radius Graph, Time-Machine State Rollback, FinOps Arbitrage Autopilot, Ephemeral PR Shadow Previews & Zero-Trust Honey-Token Deception Grid',
    badge: '2026 INNOVATION LAB (DEFAULT STAR)',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    icon: Sparkles,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'QUANTUM_NEXUS',
    problemSolved:
      'Standard cloud consoles treat IAM, VPC Firewalls, Compute, Storage/BigLake, CI/CD, and Billing as isolated silos—so you cannot see cross-domain causal failure cascades, cannot snapshot and roll back whole-project configuration drift in 1 click, cannot automate Spot/Slot arbitrage with a hard-cap circuit-breaker, cannot mirror live production traffic into auto-expiring PR preview branches, and cannot plant active deception tripwires against credential thieves.',
    howItWorks: [
      'Breakthrough #1 — Cross-Cloud Blast-Radius & Causal Dependency Graph: Connects Identity (IAM Service Accounts), Network (VPC Firewalls), Compute (Cloud Run & VMs), Data (BigLake Iceberg & GCS), and Billing into one interactive causal simulator. Click any node and switch between Simulate Credential Breach, Cascading Outage, or DDoS/Spend Spike to inspect 1st/2nd-hop blast propagation.',
      'Breakthrough #2 — Time-Machine Flight Recorder & Verified 1-Click State Rollback: Captures cryptographic SHA-256 project state checkpoints (IAM bindings, open firewalls, Cloud Run revisions, VMs, and hourly burn), diffs any two snapshots side-by-side, and restores state behind a Human-in-the-Loop Approval Gate.',
      'Breakthrough #3 — Autonomous FinOps Autopilot & Commitment Arbitrage Engine: Identifies live Standard → Spot VM (-72%), Cloud Run Always-Allocated → Request-Only CPU (-68%), and BigQuery → BigLake Partition Pruning (-71%) arbitrage, plus an Automated Hard-Cap Budget Circuit-Breaker ($/mo & $/hr spike triggers).',
      'Breakthrough #4 — Live Ephemeral PR Preview Environments & Shadow Traffic Mirror: Clones any Cloud Run service into a PR preview stack that mirrors 5%–25% of live traffic asynchronously, compares Prod vs Shadow P95 latency & 5xx errors, and auto-self-destructs after its TTL (2h–24h) so dev stacks never become zombie bills.',
      'Breakthrough #5 — Zero-Trust Honey-Token & Active Breach Deception Grid: Plants decoy IAM Service Account .json keys, canary BigLake Parquet files, and Secret Manager honey-secrets that trigger instant VPC /32 IP-ban + credential quarantine the millisecond an attacker touches them.',
    ],
    apisUsed: [
      'GET /api/project/:id/quantum-nexus/overview (aggregates compute, run, storage, firewall & IAM state)',
      'POST /api/project/:id/quantum-nexus/action (CAPTURE_SNAPSHOT, ROLLBACK_SNAPSHOT, UPDATE_FINOPS_CIRCUIT_BREAKER, CREATE_EPHEMERAL_PR_ENV, PLANT_HONEY_TOKEN, TRIGGER_HONEY_TRIPWIRE_TEST)',
    ],
    billingImpact:
      '100% free control-plane engine; actively prevents runaway cloud bills, zombie PR preview environments, and credential-breach exfiltration costs.',
  },
  {
    id: 'wave10-2026-frontier-spanner-spark-workflows-armor',
    wave: 'CLOUD SPANNER STUDIO · GRANULAR 100-PU SIZER, ISO GQL GRAPH, VECTOR RAG & TRUETIME CDC',
    title:
      'Cloud Spanner Unified Database Studio — $65.70/mo 100-PU Sizer, ISO GQL Property Graph, ScaNN Vector Search & 99.999% TrueTime Change Streams',
    badge: 'SPANNER STUDIO TAB',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Database,
    targetTab: 'WAVE10_FRONTIER',
    problemSolved:
      'Engineers often think Cloud Spanner still costs $730+/mo for a full node and only stores relational rows, forcing teams to run 3 separate databases (Cloud SQL + Neo4j Graph + Pinecone Vector DB = ~$980/mo) connected by fragile CDC pipelines.',
    howItWorks: [
      'Tab 1 — Live Spanner Fleet & Granular 100-PU ($65.70/mo) Sizer: Provision fractional Spanner instances starting at 100 Processing Units (1/10th Node = $65.70/mo Standard / $98.55/mo Enterprise) with Managed Autoscaler and Edition comparison.',
      'Tab 2 — Spanner Graph (ISO GQL) & Physical Interleaved Schema Architect: Design 0-network-hop INTERLEAVE IN PARENT hierarchies co-located in the same Paxos split and query live relational tables as an ISO GQL Property Graph.',
      'Tab 3 — Spanner AI Vector Search (ScaNN) & Hybrid GraphRAG: Bind Vertex AI text-embedding-005 models, create ScaNN VECTOR INDEX on ARRAY<FLOAT32>(vector_length=>768), and combine GRAPH_TABLE multi-hop traversal with APPROX_COSINE_DISTANCE in one ACID query.',
      'Tab 4 — Multi-Region 99.999% TrueTime, Change Streams CDC & PGAdapter: Inspect GPS + Atomic Clock TrueTime external consistency, switch between GoogleSQL and PostgreSQL (PGAdapter) dialects, and generate Zero-Downtime Change Streams CDC to BigQuery or Pub/Sub.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave10/frontier → spanner.googleapis.com/v1/projects/:id/instances',
      'POST /api/project/:id/wave10/action (CREATE_SPANNER_INSTANCE)',
    ],
    billingImpact:
      'Unlocks fractional 100-PU Spanner ($65.70/mo instead of $730/mo) and consolidates Relational + Graph + Vector workloads into a single ACID engine.',
  },
  {
    id: 'biglake-vs-bigquery-open-iceberg-2026',
    wave: 'BIGLAKE & APACHE ICEBERG · OPEN LAKEHOUSE STUDIO',
    title:
      'Dedicated BigLake & Apache Iceberg Open Lakehouse Studio — REST Catalogs, Zero-Trust Bucket IAM, Compaction Doctor & Cross-Cloud Omni',
    badge: 'DEDICATED BIGLAKE TAB',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'BIGLAKE_STUDIO',
    problemSolved:
      'Engineers frequently confuse Google BigQuery with Google BigLake, struggle with 3-step CLOUD_RESOURCE connection IAM errors, suffer from the Apache Iceberg Small-File Problem when streaming from Kafka/PubSub, or pay steep egress fees copying AWS S3 / Azure ADLS Parquet files into GCP.',
    howItWorks: [
      'Tab 1 — BigLake Metastore & Iceberg REST Catalogs: Create and manage live BigLake Metastore Catalogs (/biglake/metastore/catalogs · biglake.googleapis.com/v1) with Iceberg REST Credential Vending and side-by-side architecture comparison.',
      'Tab 2 — 1-Click BigLake Connection, Zero-Trust IAM & Iceberg Wizard: Generates and runs Step 1 (bq mk --connection --connection_type=CLOUD_RESOURCE), Step 2 (Zero-Trust bucket IAM delegation for serviceAccountId), and Step 3 (Managed Iceberg DDL or Cached External Table + Zero-Copy PySpark reader).',
      'Tab 3 — Iceberg Small-File Compaction & Snapshot Doctor: Interactive simulator for streaming micro-files, generating EXPORT TABLE METADATA, CALL biglake.system.rewrite_data_files (SORT/Z-Order vs BINPACK), expire_snapshots, and remove_orphan_files.',
      'Tab 4 — Row/Column Security & Cross-Cloud Omni (AWS S3 / Azure ADLS): Enforces CREATE ROW ACCESS POLICY and CREATE DATA POLICY masking directly on open gs:// Parquet files, plus $0-egress BigLake Omni federated SQL over s3:// and azure://.',
    ],
    apisUsed: [
      'GET & POST /api/project/:id/biglake/metastore/catalogs → biglake.googleapis.com/v1/projects/:id/locations/:loc/catalogs',
      'DELETE /api/project/:id/biglake/metastore/catalogs/:location/:catalogId',
    ],
    billingImpact:
      'Eliminates duplicate warehouse storage bills by keeping a single open Parquet/Iceberg copy on Cloud Storage ($0.020/GB-mo) and reduces query scan bytes by up to 80% via Iceberg compaction.',
  },
  {
    id: 'sovereign-iam-owner-guard-and-sa-key-killswitch',
    wave: 'SOVEREIGN IAM · OWNER SELF-PROTECTION, KEYLESS GITHUB OIDC WIF & STOLEN KEY KILL-SWITCH VAULT',
    title:
      'Sovereign IAM Owner Self-Protection, Keyless GitHub Actions OIDC Architect & Service Account .json Key Kill-Switch Vault',
    badge: 'SOVEREIGN & IAM TAB',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: ShieldAlert,
    targetTab: 'SOVEREIGN_STUDIO',
    problemSolved:
      'Standard IAM recommenders naively flag the authenticated project owner (roles/owner) as "excessive privilege" and can lock you out if clicked accidentally—while long-lived Service Account .json keys exported for GitHub Actions CI/CD are the #1 vector for cloud crypto-mining breaches.',
    howItWorks: [
      'Active Session Owner Self-Protection (PROTECTED OWNER badge): Cross-references every IAM binding against your active authenticated account so your own roles/owner binding is protected and never auto-targeted for downgrade.',
      '1-Click Keyless GitHub Actions OIDC Workload Identity Federation Architect (PROVISION_GITHUB_OIDC_WIF): Enter your GitHub owner/repository (e.g. org/repo) and target Service Account to automatically provision a Workload Identity Pool, configure the https://token.actions.githubusercontent.com OIDC Provider with attribute.repository condition locking, bind roles/iam.workloadIdentityUser, and output a copy-ready GitHub Actions .yml snippet using google-github-actions/auth@v2 with zero .json keys ever created.',
      'Service Account .json Key & OAuth2 Token Kill-Switch Vault: Inspect all Service Accounts, create & download a new .json key, disable/re-enable a key to test breakage, permanently delete a leaked key, or run the 1-Click Emergency Key Purge + Active OAuth Token Revocation.',
    ],
    apisUsed: [
      'GET /api/project/:id/sovereign-iam/credentials → iam.googleapis.com/v1/projects/:id/serviceAccounts/:email/keys',
      'POST /api/project/:id/sovereign-iam/credentials/action (PROVISION_GITHUB_OIDC_WIF, CREATE_SA_KEY, DISABLE_SA_KEY, ENABLE_SA_KEY, DELETE_SA_KEY, EMERGENCY_REVOKE_ALL_SA_KEYS, REVOKE_ACTIVE_OAUTH_TOKEN)',
    ],
    billingImpact:
      '100% free IAM & Workload Identity Federation control plane ($0.00/mo); permanently eliminates stolen Service Account .json key breaches.',
  },
  {
    id: 'wave3-engineer-moonshots-x1-x6',
    wave: 'WAVE 6 · ENGINEER MOONSHOT LAB (X1–X6)',
    title:
      '6 Out-of-the-Box Cloud Engineering Moonshots (DLP X-Ray, Cold-Start Surgeon, Egress Tollbooth, Ransomware Air-Gap, Anycast Latency & AES-256-GCM Gemini 3.8 / 3.1 Vault)',
    badge: '2026 LAB · MOONSHOTS X1–X6',
    badgeColor: 'bg-red-500/15 text-red-500 border-red-500/30',
    icon: Rocket,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'MOONSHOT_X1_DLP',
    problemSolved:
      'Engineers constantly battle leaked credentials/PII inside Cloud Storage buckets, mysterious 1.5s–3.5s Cloud Run cold starts, hidden cross-region egress bandwidth taxes, ransomware bucket deletion risks, global client latency blindspots, and how to use live Gemini 3.8 Flash / 3.1 Pro without ever writing an API key to disk or browser localStorage.',
    howItWorks: [
      'X1 — Cloud Storage Live DLP, Secret Leak & PII X-Ray Scanner + 1-Tap In-Place Redactor: Streams object bytes in server memory to detect leaked GCP Service Account keys, AWS keys, GitHub PATs, Stripe keys, JWTs, Credit Cards, IBANs, and SSNs—with a 1-Tap Canary Injector and 1-Tap In-Place Cryptographic Redactor.',
      'X2 — Serverless Cold-Start Profiler & Container Diet Surgeon: Breaks down Cloud Run startup into 5 phases (Image Pull, Sandbox Init, Runtime Boot, Weight Tax, Warm P50), patches Startup CPU Boost + Gen2 Execution Environment in 1 tap, and synthesizes a multi-stage Distroless Dockerfile.',
      'X3 — Cross-Service Egress & Hidden Data-Gravity Tollbooth: Cross-references every Compute VM and Cloud Run service region against your Cloud Storage bucket locations using the Live Pricing Catalog to flag cross-region ($0.02/GB) and inter-continental ($0.08–$0.12/GB) bandwidth taxes.',
      'X4 — Cryptographic Ransomware Air-Gap & Clean-Room Recovery Auditor: Scores every bucket on a 0–100 Ransomware Survival scale, computes exact RTO/RPO, and applies a 1-Tap 30-Day Soft-Delete + Object Versioning Air-Gap Shield.',
      'X5 — 12-Metropolis Speed-of-Light User-Experience & Anycast Edge Latency Matrix: Calculates great-circle fiber distance and TLS RTT from 12 global population hubs to your active GCP regions vs Google Cloud CDN Anycast Edge.',
      'X6 — Option 3 AES-256-GCM Encrypted Google AI Studio BYOK RAM Vault (Gemini 3.8 Flash & 3.1 Pro): Seals your AIzaSy... key in volatile Node.js RAM using crypto.createCipheriv("aes-256-gcm") with an 8,192-token output budget, live /v1beta/models auto-discovery, and 3-step onboarding when empty.',
    ],
    apisUsed: [
      'POST /api/project/:id/storage/buckets/:bucket/dlp-scan & /dlp-redact',
      'GET /api/ai-vault/status, GET /api/ai-vault/models, POST /api/ai-vault/configure & POST /api/project/:id/ai-vault/ask',
      'POST /api/project/:id/storage/buckets/:bucket/security-patch & PATCH /api/project/:id/cloudrun/:region/:name',
    ],
    billingImpact:
      '100% free telemetry & in-memory security inspection. Prevents compliance fines, egress waste, and cold-start latency.',
  },
  {
    id: 'dedicated-cloud-sql-alloydb-studio',
    wave: 'CLOUD SQL & ALLOYDB · RELATIONAL & AI VECTOR STUDIO',
    title:
      'Dedicated Cloud SQL (MySQL 8.4 LTS & PostgreSQL 16/17) + Google Cloud AlloyDB Studio',
    badge: 'CLOUD SQL & ALLOYDB TAB + PROVISION MODAL',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'CLOUD_SQL_STUDIO',
    problemSolved:
      'Choosing between MySQL and PostgreSQL—and when using PostgreSQL, deciding whether to deploy Classic/Enterprise Plus Cloud SQL or Google Cloud AlloyDB—requires comparing storage architectures, failover SLAs, AI vector indexes, and strict regulatory compliance locks.',
    howItWorks: [
      'Engine Family & Architecture Fork: Select MySQL (8.4 LTS / 8.0) or PostgreSQL (16 / 17 / 15). When PostgreSQL is selected, fork between Classic / Enterprise Plus Cloud SQL (sqladmin.googleapis.com/v1) and Google Cloud AlloyDB (alloydb.googleapis.com/v1). Selecting MySQL automatically locks out AlloyDB with a badge.',
      'Classic Cloud SQL vs. AlloyDB TCO Comparator: Simulates vCPUs, Storage GB, Read Replicas, Vector RAG, and HTAP workloads to compare Cloud SQL Enterprise, Cloud SQL Enterprise Plus, and AlloyDB across failover SLA (<60s vs <2s vs <1s) and Cost per 1,000 TPS.',
      'AI Vector (ScaNN / pgvector / MySQL 8.4 VECTOR) & Slow-Query Index Surgeon + Zero-Password IAM Auth Proxy v2 Vault.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave9/cloud-sql → sqladmin.googleapis.com/v1 + alloydb.googleapis.com/v1',
      'POST /api/project/:id/provision (serviceType: "CLOUD_SQL", sqlArchitecture: "CLOUD_SQL" | "ALLOYDB")',
    ],
    billingImpact:
      'Displays exact pre-deploy hourly and monthly FinOps estimates before provisioning any database instance or cluster.',
  },
  {
    id: 'dedicated-gke-studio',
    wave: 'GKE STUDIO · AUTOPILOT & SPOT GPU KUBERNETES',
    title:
      'Dedicated Google Kubernetes Engine (GKE) Autopilot, Spot GPU & Workload Studio',
    badge: 'GKE STUDIO TAB + PROVISION MODAL',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Server,
    targetTab: 'GKE_STUDIO',
    problemSolved:
      'Provisioning hardened GKE Autopilot or Standard Spot GPU clusters with Workload Identity OIDC, Private Nodes, Shielded Nodes, and Binary Authorization normally requires dozens of complex gcloud flags and manual Kubernetes manifests.',
    howItWorks: [
      '1-Click GKE Autopilot & Standard Spot GPU Cluster Provisioner: Enforces strict compliance locks () across SEC/FedRAMP, GDPR EU, HIPAA BAA, and AI Spot GPU presets.',
      'K8s Workload YAML & Spot GPU Deployment Composer: Generates production Kubernetes Deployment + Service + HorizontalPodAutoscaler manifests and 1-click kubectl apply commands.',
      'Live GKE Fleet & 1-Tap kubeconfig / Cloud Shell Connector.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave9/gke-vertex → container.googleapis.com/v1/projects/:id/locations/-/clusters',
      'POST /api/project/:id/provision (serviceType: "GKE_CLUSTER") & DELETE /api/project/:id/gke/clusters/:location/:name',
    ],
    billingImpact:
      'GKE Autopilot empty clusters cost $0.00/hr under the GKE Free Tier management credit ($74.40/mo); Spot GPU node pools save up to 68%.',
  },
  {
    id: 'cloud-run-2026-vpc-storage-gke-migrator',
    wave: 'CLOUD RUN 2026 · REVISION TIME-MACHINE & CRASH-LOOP AUTOPSY, CONTAINER SSH, DIRECT VPC, STORAGE VOLUMES & GKE MIGRATOR',
    title:
      'Cloud Run 2026 Revision Time-Machine & Crash-Loop Autopsy, Container SSH (@xterm/xterm), Direct VPC Egress, Storage Volumes & 1-Click GKE Migrator',
    badge: 'CLOUD RUN TAB + PROVISION MODAL',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Rocket,
    targetTab: 'CLOUD_RUN',
    problemSolved:
      'Debugging crashed Cloud Run revisions, comparing what changed between a broken deploy and the last healthy revision, rolling back traffic in <2 seconds, opening a live container shell, configuring Direct VPC Egress or Stateful Storage Volume Mounts, or migrating to Kubernetes normally requires scattered CLI flags and manual YAML editing.',
    howItWorks: [
      ' Cloud Run Revision Time-Machine, Crash-Loop Autopsy & 1-Click Instant Rollback: Automatically detects crashed revisions (`HEALTHY` vs `CRASHED` / `ContainerMissing` / `HealthCheckContainerError`), runs a live Crash-Loop Autopsy via `logging.googleapis.com/v2` + side-by-side Config/Env/Secret Diff against the last healthy revision, classifies root causes (`PORT_LISTEN_TIMEOUT`, `SECRET_MANAGER_REF_ERROR`, `OUT_OF_MEMORY_OOM`, `APPLICATION_STARTUP_CRASH`), and offers 3 1-click actions: (1) `<2s` Instant 100% Traffic Pin Rollback (`INSTANT_TRAFFIC_PIN`), (2) Clone Historical Revision Spec as New LATEST (`CLONE_REVISION_SPEC`), or (3) 1-Click Auto-Fix OOM / Startup Crash (`AUTO_FIX_CRASH`: upgrades RAM tier + enables `startupCpuBoost`).',
      'Interactive Cloud Run Container SSH (@xterm/xterm + gcloud beta run services ssh): Click "SSH / Container Shell" on any Cloud Run service card (default OFF; toggle off with "SSH Active (Turn Off)") to open a real browser PTY shell inside the running container (~ #). Automatically enables --ssh and --execution-environment=gen2 (>=512Mi) if missing, warms up the active revision, and also supports gcloud beta run services proxy.',
      'Accurate Public (allUsers / invokerIamDisabled), Direct Cloud IAP ($0/mo Google Sign-In · Zero-LB) & Private (IAM Auth) State + Gatekeeper: Detects IAM allUsers bindings, Cloud Run v2 invokerIamDisabled state, and top-level iapEnabled Direct Cloud IAP status, displays live status badges, and requires explicit confirmation before switching access modes.',
      '2026 Direct VPC Egress Network (template.vpcAccess) & Beta Storage Volume Mounts (GCS FUSE / RAM Disk / Filestore NFS): Attach revisions directly to any VPC/Subnet ($0 Serverless VPC Connector tax) and mount stateful or RAM-disk volumes.',
      '1-Click Cloud Run → GKE Kubernetes 6-Manifest Transpiler & Live Cluster Migrator: Converts any running Cloud Run service into a 6-resource production Kubernetes bundle and deploys it directly to your live GKE cluster in 1 click.',
    ],
    apisUsed: [
      'GET /api/project/:id/cloudrun/:region/:name/revisions/:rev/autopsy & POST /api/project/:id/cloudrun/:region/:name/time-machine-restore',
      'WS /api/ws/ssh?targetType=cloudrun → gcloud beta run services ssh / proxy PTY',
      'POST /api/project/:id/provision (serviceType: "CLOUD_RUN") & PATCH /api/project/:id/cloudrun/:region/:name',
      'POST /api/project/:id/cloudrun/:region/:name/iam & POST /api/project/:id/cloudrun/convert-to-gke',
    ],
    billingImpact:
      'Revision Time-Machine & Autopsy are 100% free control-plane operations; Direct VPC Egress eliminates ~$14.60/mo Serverless VPC Connector instance charges; migrating warm Cloud Run services to GKE Spot VMs/GPUs cuts compute spend by up to 68%.',
  },
  {
    id: 'live-gcp-api-quota-saturation-and-429-radar',
    wave: 'API QUOTA RADAR · LIVE QUOTA SATURATION & HTTP 429 OUTAGE EARLY-WARNING ENGINE',
    title:
      'Live GCP API Quota Saturation & HTTP 429 RESOURCE_EXHAUSTED Outage Early-Warning Radar',
    badge: '2026 SRE OVERVIEW · API & QUOTA CIRCUIT BREAKER',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    icon: Zap,
    targetTab: 'OVERVIEW',
    problemSolved:
      'Production cloud outages frequently happen not because a service is down, but because a project silently hits a regional vCPU, Static External IP, Persistent Disk GB, NVIDIA L4 GPU, or Cloud Run Max-Instance quota limit and starts failing with HTTP 429 RESOURCE_EXHAUSTED.',
    howItWorks: [
      'Parallel Project & Regional Quota Discovery (`GET /api/project/:id/quotas/radar`): Queries `compute.googleapis.com/compute/v1/projects/:id`, `regions?maxResults=12`, `run.googleapis.com/v2`, and `secretmanager.googleapis.com/v1` in parallel.',
      'Real-Time Utilization Bars & HTTP 429 Risk Classification: Computes `usage / limit` utilization percentages across Global & Regional vCPUs (`CPUS`, `CPUS_ALL_REGIONS`), Static & In-Use IPv4s, Disks (`DISKS_TOTAL_GB`), GPUs (`NVIDIA_L4_GPUS`), Cloud Run Autoscaler ceilings, and Secret Manager Free-Tier versions (`6/mo`).',
      '1-Click Quota Increase CLI: Generates copy-ready `gcloud alpha services quota update` and `gcloud compute regions describe` commands for any bottlenecked metric.',
    ],
    apisUsed: [
      'GET /api/project/:id/quotas/radar → compute.googleapis.com/v1 + run.googleapis.com/v2 + secretmanager.googleapis.com/v1',
    ],
    billingImpact:
      '100% free control-plane inspection ($0.00/mo). Prevents surprise HTTP 429 autoscaling failures and highlights Free-Tier quota saturation.',
  },
  {
    id: 'neural-chrono-log-and-trace-studio-2026',
    wave: 'MOONSHOT 2026 · NEURAL CHRONO-LOG, 3-LAYER NLP-TO-LQL COMPILER, DRAIN3 CLUSTERING, TRACE WATERFALL & LOG FINOPS STUDIO',
    title:
      '2026 Neural Chrono-Log & Trace Studio: 3-Layer NLP-to-LQL/BigQuery SQL Compiler, Official LQL Interactive Tutorial, Drain3 Pattern Clustering, Cross-Service `traceId` Waterfall & `_Default` Sink FinOps',
    badge: 'LOGS & SHELL TAB · NLP + LQL + $0.50/GiB NOISE CUTTER',
    badgeColor: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40',
    icon: Zap,
    targetTab: 'LOGS_SHELL',
    problemSolved:
      'Google Cloud Logs Explorer still behaves like a 2016 JSON tree-viewer: engineers must click 5 nested protoPayload levels to read one error, memorize Google Cloud Logging Query Language (LQL) operators (=, :, =~, -negation, sample()) during high-stress outages, scroll through thousands of duplicate stack traces, and unknowingly pay $0.50/GiB for noisy /healthz probes or leak Bearer tokens in stdout.',
    howItWorks: [
      '3-Layer Hybrid NLP-to-LQL & BigQuery SQL Compiler with Strict $0.00 Default & Token Consumption Guardrail: (1) Stage 1 Lexical Tokenizer & Porter Suffix Stemmer (`nlpTokenizeAndStem`, `porterStemWord`) and (2) Stage 2 Named Entity Recognition (NER) Slot Parser (`extractNlpEntities`) + TF-IDF Cosine Intent & Okapi BM25 Ranker run 100% locally in Node.js at $0.00 (0 LLM tokens consumed). (3) Stage 3 Opt-In Neural LLM Enhancer (`tryEnhanceWithGeminiNeuralNlp`) is locked OFF by default ("Local NLP Only ($0.00 · 0 Tokens)") so it never silently burns Vertex AI or Gemini API key tokens; toggling "Vertex / Gemini LLM: ON (Consumes Tokens)" uses your selected Gemini model in the RAM Vault / Vertex AI endpoint, displays an explicit Token Consumption Warning Banner (~100–250 tokens/query), and tracks live `usageMetadata` token spend telemetry.',
      'Built-In Interactive Google Cloud LQL Tutorial (`https://docs.cloud.google.com/logging/docs/view/logging-query-language`): Click "LQL Tutorial & How NLP Works" inside the Logs & Shell tab to learn and test all 6 core LQL operators in 1 click: (1) Exact Equality (`=`) vs. Case-Insensitive Substring Has (`:`), (2) Ordered Severity & Latency Comparisons (`severity>=ERROR`, `httpRequest.latency>"1.5s"`), (3) Boolean Logic & Hyphen Negation (`AND`, `OR`, `NOT`, `-`), (4) RE2 Regular Expressions (`=~` and `!~`), (5) Multi-Value Set Membership (`IN (...)`), and (6) Built-In Deterministic Sampling (`sample(insertId, 0.90)`).',
      'Zero-JSON-Digging Flattened SRE Stream & `±30s` Time-Travel Peek: Hoists HTTP Method/Status, Latency (ms), Service/Revision, Actor/Principal, Trace ID, Per-Log `BM25 Match %`, and DLP Leak badges to the top of every card, with a 1-click `±30s Peek` button that locks the query window around any failure.',
      'Semantic Drain3 Pattern Clustering & Cross-Service `traceId` Waterfall: Tokenizes dynamic values (`<UUID>`, `<IP>`, `<METRIC>`, `<GCP_API_KEY>`, `<JWT_TOKEN>`) to collapse repetitive log noise into signatures, and stitches sibling spans across `http_load_balancer` -> `cloud_run_revision` -> `cloudsql_database` -> `aiplatform.googleapis.com` into a visual Gantt waterfall.',
      'Log FinOps `_Default` Sink Exclusion Manager & Live DLP Secret Leak Radar: Inspects `logging.googleapis.com/v2/projects/:id/sinks/_Default` to apply 1-click LQL exclusion rules that drop noisy `/healthz` probes ($0.50/GiB saved) and continuously scans log payloads for unmasked `AIza...` keys, Bearer JWTs, and PII emails.',
      'Global 430+ World IANA Timezone Engine (`TimezoneContext.jsx`): Supports all official `Intl.supportedValuesOf("timeZone")` zones across 8 continent filters with a minute-aligned `HH:mm` clock (zero per-second React re-render churn) and Dual (+UTC) mode.',
    ],
    apisUsed: [
      'POST /api/project/:id/chrono-logs/query → logging.googleapis.com/v2/entries:list + logging.googleapis.com/v2/projects/:id/sinks/_Default',
      'POST /api/project/:id/chrono-logs/exclusion → PATCH logging.googleapis.com/v2/projects/:id/sinks/_Default?updateMask=exclusions',
    ],
    billingImpact:
      'Saves $40–$117+/mo per project by dropping high-volume HTTP 200 healthcheck probes and sampling verbose stdout before Cloud Logging charges $0.50/GiB (after the 50 GiB/mo free tier).',
  },
  {
    id: 'cloud-audit-who-changed-what-timeline',
    wave: 'CLOUD AUDIT LOGS · LIVE "WHO-CHANGED-WHAT" ACTIVITY TIMELINE & 1-CLICK CHANGE INSPECTOR',
    title:
      'Live Cloud Audit "Who-Changed-What" Activity Timeline, Actor Attribution (`principalEmail`) & IAM Policy Delta Inspector',
    badge: 'LOGS & SHELL TAB · 400-DAY FREE RETENTION',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    icon: History,
    targetTab: 'LOGS_SHELL',
    problemSolved:
      'When a Cloud Run service suddenly breaks, a firewall rule changes, or a Secret Manager version is disabled, engineers struggle to answer "Who changed what, from which IP, and at what exact second?" without writing complex Cloud Logging protoPayload queries.',
    howItWorks: [
      'Live Cloud Audit Admin Activity Stream (`cloudaudit.googleapis.com/activity`): Queries `logging.googleapis.com/v2/entries:list` and merges real-time in-session Flight Recorder mutations so actions appear immediately.',
      'Actor Attribution & Action Classification: Groups every mutation by Principal (`principalEmail` user vs `.gserviceaccount.com`), Caller IP, and Action Category (`CREATE`, `UPDATE`, `IAM_SECURITY`, `DELETE`, `POWER`).',
      'IAM Policy Delta & Request Spec X-Ray: Expands any audit event to inspect `serviceData.policyDelta.bindingDeltas` (`ADD`/`REMOVE` role bindings), `protoPayload.request`, and a 1-click `$ Inspect in Shell` or `±30s Logs` time-travel command.',
      'Hybrid Direct REST Bridge + Real Native `execFile` CLI Mobile Cloud Shell (`POST /api/project/:id/shell`): Executes 11 high-frequency fleet queries (`gcloud projects/storage/compute/run/iam/secrets/services`, `bq ls`) in sub-500ms directly via Google Cloud REST APIs (`DIRECT_REST_BRIDGE`), and automatically executes any other read-only `gcloud`, `bq`, `gsutil`, or `kubectl` command (`gcloud version`, `gcloud logging read`, `gcloud run services describe`, etc.) by spawning the real installed CLI binary via `execFile` (`NATIVE_CLI_EXEC`) behind a strict quote-aware tokenizer and destructive-verb guardrail (`GUARDRAIL_INTERCEPTOR`).',
    ],
    apisUsed: [
      'GET /api/project/:id/audit-timeline -> logging.googleapis.com/v2 (`cloudaudit.googleapis.com/activity`)',
      'POST /api/project/:id/shell -> Hybrid Direct REST Bridge + Native `execFile` CLI (`gcloud`, `bq`, `gsutil`, `kubectl`)',
    ],
    billingImpact:
      '100% Always Free ($0.00/mo). Google Cloud retains Admin Activity audit logs for 400 days free of charge, and the Hybrid Cloud Shell runs read-only inspection queries at $0.00 cost.',
  },
  {
    id: 'xterm-web-ssh-and-mandatory-delete-gatekeeper',
    wave: 'OPEN-SOURCE @XTERM/XTERM WEB-SSH, 127.0.0.1 ZERO-PUBLIC-IP TUNNEL BRIDGE & BLAST-RADIUS SAFETY GATEKEEPER',
    title:
      'Real Open-Source Browser SSH (@xterm/xterm + ssh2 + Linux PTY), 127.0.0.1 Zero-Public-IP Developer Tunnel Manager & Global Mandatory Delete Gatekeeper',
    badge: 'VM FLEET + CLOUD RUN + CLOUD SQL + ALL 18 STUDIOS',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: Terminal,
    targetTab: 'VM_SSH',
    problemSolved:
      'One-shot command emulators truncate multi-line streaming commands like "apt update" or interactive tools like htop/vim, connecting a local IDE/ORM to private Cloud Run services, private Compute VMs, or private Cloud SQL databases normally requires public IPv4 addresses ($7.30/mo) or manual CLI flags, and unconfirmed delete actions risk breaking live workloads.',
    howItWorks: [
      '127.0.0.1 Zero-Public-IP Developer Port-Forward & IAP Tunnel Manager (`LocalDevTunnelBar.jsx`): Connects your local browser, IDE, Postman, or ORM (`Prisma`, `psql`, `mysql`, `curl`, `ssh`) to Private IAM-Locked Cloud Run services (`gcloud run services proxy` with automatic OIDC Bearer injection), Zero-External-IP Compute VMs (`gcloud compute start-iap-tunnel` over IAP TCP `35.235.240.0/20` on `:22`, `:8080`, `:5432`, `:6379`, `:8888`), and Private Cloud SQL / AlloyDB (`cloud-sql-proxy` / `alloydb-auth-proxy`)—with live `127.0.0.1:PORT` TCP/HTTP socket probing and `$7.30/mo` static IPv4 savings.',
      'Real Full-Duplex @xterm/xterm + ssh2 + Python PTY WebSocket Terminal (/api/ws/ssh): Streams 100% of live stdout/stderr bytes in real time for "apt update", htop, vim, top, tmux, and interactive prompts across Compute Engine VMs and Cloud Run Gen2 containers.',
      'Default-OFF Explicit Toggle ("SSH / Console" → "SSH Active (Turn Off)"): Never auto-connects when landing on the VM Fleet or Cloud Run tab; connects only when you click the SSH button on a specific VM or Cloud Run card and disconnects cleanly when toggled off.',
      'Global Mandatory Delete & IAM Security Gatekeeper with Live Blast-Radius Pre-Flight Scan (src/App.jsx): Intercepts 100% of HTTP DELETE requests and destructive POST teardowns across all 18 studios, and automatically runs a live dependency scan (GET /api/project/:id/sovereign/secrets-kms) when deleting a Secret Manager secret or destroying a version to warn you of exact Cloud Run services that will fail to start if you proceed.',
    ],
    apisUsed: [
      'GET /api/project/:id/tunnels, POST /api/project/:id/tunnels/start, POST /api/project/:id/tunnels/stop & POST /api/project/:id/tunnels/probe',
      'WS /api/ws/ssh (Engines: Auto, Direct SSH2 :22, gcloud compute ssh PTY, IAP Tunnel, Cloud Run SSH PTY)',
      'Global Axios Request Interceptor: classifyDestructiveAxiosConfig() + <MandatoryDeleteConfirmationModal /> + Live Blast-Radius Pre-Flight Scan',
    ],
    billingImpact:
      '100% free open-source browser terminal (@xterm/xterm + ssh2) and 127.0.0.1 IAP/OIDC tunnel bridge that saves $7.30/mo per private VM/DB by eliminating public IPv4 addresses.',
  },
  {
    id: 'cloud-functions-eventarc-demystified-studio',
    wave: 'CLOUD FUNCTIONS (v1 & v2) · DEMYSTIFIED EVENTARC TRIGGER STUDIO',
    title:
      'Cloud Functions (1st Gen & 2nd Gen) + Visual Eventarc Trigger Wizard & 1-Tap IAM Auto-Doctor',
    badge: 'FUNCTIONS & EVENTARC TAB',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Zap,
    targetTab: 'FUNCTIONS_STUDIO',
    problemSolved:
      'When Google Cloud moved from 1st Gen (v1) to 2nd Gen (v2 + Eventarc), newcomers stayed stuck on v1 because Eventarc hid 3 required service-agent IAM roles, demanded raw CloudEvents strings, and mixed free direct Pub/Sub triggers with paid Cloud Audit Log (DATA_WRITE) triggers.',
    howItWorks: [
      'Plain-English Eventarc Trigger Wizard ("v1 Simplicity with v2 Power"): Pick "When a file is uploaded to Bucket X", "When a Pub/Sub message arrives", "When a BigQuery job finishes", or "On a Cron Schedule" without memorizing CloudEvents filter syntax.',
      '4-Stage Visual Eventarc Pipeline X-Ray & Live CloudEvent Tester: Shows Producer → Transport Bus ($0 Free Direct Pub/Sub vs Cloud Audit Logs) → Eventarc Filter & IAM → Function Handler, and lets you fire a live CloudEvent v1.0 payload via HTTP POST, Pub/Sub publish, or Cloud Logging entries:write with real round-trip latency measurement.',
      '1-Tap Eventarc IAM Auto-Doctor + 1-Click v1 → v2 Upgrader: Automatically binds roles/pubsub.publisher on the GCS Service Agent, roles/eventarc.eventReceiver, and roles/run.invoker, and upgrades legacy v1 functions (1 req/instance) to v2 (up to 1,000 req/instance, saving up to 78%).',
    ],
    apisUsed: [
      'GET /api/project/:id/functions/overview → cloudfunctions.googleapis.com/v2 + v1 + eventarc.googleapis.com/v1',
      'POST /api/project/:id/functions/iam-doctor, POST /api/project/:id/functions/deploy & POST /api/project/:id/functions/test-event',
    ],
    billingImpact:
      'Includes 2,000,000 free invocations/month; upgrading I/O-bound functions from v1 (1x concurrency) to v2 (80–250x concurrency) cuts active instance hours by up to 78%.',
  },
  {
    id: 'cloud-build-github-cicd-studio',
    wave: 'CLOUD BUILD CI/CD · GITHUB SOURCE-TO-CONTAINER STUDIO',
    title:
      'Dedicated Cloud Build & GitHub Source-to-Container Studio (Zero-Dockerfile Buildpacks + Dockerfile + Auto-Deploy)',
    badge: 'CLOUD BUILD TAB + CLOUD RUN / GKE MODAL',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Zap,
    targetTab: 'WAVE9_STUDIO',
    problemSolved:
      'Deploying custom applications to Cloud Run or GKE shouldn’t require local Docker builds or manual Artifact Registry repository creation.',
    howItWorks: [
      '3-Way Container Source Selector: Available both in the dedicated Cloud Build tab and inline inside Cloud Run and GKE provisioning—choose Project Artifact Registry images, Public Docker/GCR URIs, or build directly from any GitHub Repository URL + branch.',
      'Zero-Dockerfile Cloud Buildpacks & Dockerfile Engine: Automatically creates your target Artifact Registry Docker repository if missing, builds the container image on Google Cloud Build, and optionally deploys the built image straight to Cloud Run or GKE.',
    ],
    apisUsed: [
      'GET /api/project/:id/cloudbuild/overview → cloudbuild.googleapis.com/v1 + artifactregistry.googleapis.com/v1',
      'POST /api/project/:id/cloudbuild/github-build',
    ],
    billingImpact:
      'Google Cloud Build includes 120 free build-minutes per day on the standard pool.',
  },
  {
    id: 'dedicated-bigquery-2026-studio',
    wave: 'BIGQUERY STUDIO · PHYSICAL COMPRESSED LAKEHOUSE',
    title:
      'BigQuery 2026 Enterprise Lakehouse, Physical Billing (-54%) & 168h Time-Machine Studio',
    badge: 'BIGQUERY STUDIO TAB + PROVISION MODAL',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'BIGQUERY_STUDIO',
    problemSolved:
      'Uncompressed Logical BigQuery billing overcharges high-compression datasets by up to 2.2x, while unpartitioned SELECT * queries can accidentally scan terabytes of data.',
    howItWorks: [
      'Strict Compliance Blueprints (SEC/FINRA, GDPR EU, HIPAA, AI Vector BigLake): Locks jurisdiction, Physical Capacitor compressed billing (-54%), and 48h–168h Time-Travel windows.',
      'Pre-Crime SQL Dry-Run X-Ray & Auto-SQL Partition/Cluster Optimizer: Estimates exact bytes billed and query cost before execution.',
      ' 168-Hour FOR SYSTEM_TIME AS OF Time-Machine & 1-Tap Storage Billing Model Switcher (LOGICAL  PHYSICAL).',
    ],
    apisUsed: [
      'GET /api/project/:id/bigquery/datasets & POST /api/project/:id/provision (serviceType: "BIGQUERY_DATASET")',
      'POST /api/project/:id/bigquery/dry-run → bigquery.googleapis.com/bigquery/v2/projects/:id/jobs',
    ],
    billingImpact:
      'Empty datasets cost $0.00/mo; Physical Compressed billing reduces active storage spend by up to 54% on compressible analytical tables.',
  },
  {
    id: 'dedicated-data-engineering-2026-studio',
    wave: 'DATA ENGINEER STUDIO · MEDALLION ELT, DATAFORM, DATAPLEX & SLOT DOCTOR (gcloud 588.0.0)',
    title:
      '2026 Data Engineering Studio: Source-to-Gold Medallion ELT, Dataform/dbt SQLX Auto-Clean, Dataplex Data Mesh & Slot Doctor',
    badge: 'DATA ENGINEER TAB',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'DATA_ENGINEER_STUDIO',
    problemSolved:
      'Data engineers on Google Cloud traditionally have to juggle 8 disconnected consoles (GCS, BigQuery DTS, Dataform, Dataplex, Dataproc Serverless, Dataflow, Cloud Composer at $350/mo idle, and INFORMATION_SCHEMA.JOBS) while manually writing deduplication SQL, debugging stage skew, and worrying about breaking downstream BI views.',
    howItWorks: [
      '1-Canvas "Source-to-Gold" Medallion ELT Pipeline Builder + Smart Engine & Cost Advisor: Connect any source (GCS Parquet/JSON/CSV, BigQuery DTS SaaS, Pub/Sub, Cloud SQL CDC) through Bronze (BigLake Raw), Silver (Deduplicated & Typed), and Gold (BI Mart) with a live engine cost comparison across BigQuery SQL ($0 idle), Dataproc Serverless Spark 2.2 ($0 idle), Dataflow Streaming, and Cloud Workflows ($0.05/mo vs $350/mo Cloud Composer).',
      'Dataform (.sqlx) & dbt (.sql) Visual SQLX Studio + 1-Tap Auto-Clean: Generates production Dataform .sqlx and dbt incremental models with QUALIFY ROW_NUMBER() = 1 deduplication, SAFE_CAST / TRIM / UPPER hygiene, SHA256 PII masking, and partition/cluster keys — and executes or provisions native Dataform Repositories (dataform.googleapis.com/v1beta1) in 1 click.',
      'Dataplex Auto-Profiling / Data Quality Scans & Data Mesh Products (gcloud 588.0.0): Launches real gcloud dataplex datascans create data-profile / data-quality jobs, provisions Dataplex Data Mesh Products (gcloud dataplex data-products), and runs gcloud dataplex dbt metadata-jobs.',
      'Schema Drift & Downstream Contract Firewall + Live BigQuery Slot Contention Doctor & Composer-Lite Serverless DAGs: Maps source-to-target schemas with non-breaking View Adapters and diagnoses real-time INFORMATION_SCHEMA.JOBS_BY_PROJECT slot contention while deploying $0-idle Cloud Workflows ELT DAGs.',
    ],
    apisUsed: [
      'GET /api/project/:id/data-engineer/overview & POST /api/project/:id/data-engineer/action',
      'dataform.googleapis.com/v1beta1, dataplex.googleapis.com/v1 (gcloud 588.0.0 datascans & data-products), bigquerydatatransfer.googleapis.com/v1 & workflows.googleapis.com/v1',
    ],
    billingImpact:
      'Replaces $350/mo always-on Cloud Composer environments with $0.05/mo Serverless Cloud Workflows ELT DAGs and enforces Partition + Cluster pruning across Bronze/Silver/Gold tables.',
  },
  {
    id: 'artifact-registry-sbom-studio',
    wave: 'ARTIFACT REGISTRY · SLSA-3 SUPPLY-CHAIN & ORPHAN SWEEPER',
    title:
      'Artifact Registry SLSA-3 Supply-Chain & 1-Click Orphan Digest Sweeper Studio',
    badge: 'ARTIFACT REGISTRY & SBOM TAB',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Layers,
    targetTab: 'WAVE9_STUDIO',
    problemSolved:
      'CI/CD pipelines leave behind dozens of untagged orphan container digests that silently bill $0.10/GB-month forever, and mutable image tags (:latest / :v1.0) allow tag-mutation supply-chain attacks.',
    howItWorks: [
      'Immutable Tag Repository Provisioner: Enforces dockerConfig.immutableTags = true across SEC/FedRAMP, GDPR EU, and HIPAA container registries.',
      '1-Click Live Digest Deletion & Batch Orphan Sweeper: Delete individual container digests, sweep all untagged orphan layers in one click, or delete repositories directly from the UI.',
    ],
    apisUsed: [
      'GET /api/project/:id/wave9/supply-chain & POST /api/project/:id/wave9/supply-chain/create-repo',
      'POST /api/project/:id/wave9/supply-chain/delete-image & POST /api/project/:id/wave9/supply-chain/sweep-orphans',
    ],
    billingImpact:
      'Directly reclaims wasted monthly Artifact Registry storage spend by sweeping untagged orphan container digests.',
  },
  {
    id: 'cloud-storage-5step-compliance-studio',
    wave: 'CLOUD STORAGE · ENTERPRISE COMPLIANCE & 5-STEP WIZARD',
    title:
      '5-Step Fine-Grained Cloud Storage Provisioning Wizard & Regulatory Compliance Studio (SEC 17a-4, HIPAA, GDPR, Sovereign Zero-Trust)',
    badge: 'CLOUD STORAGE TAB + PROVISION MODAL',
    badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    icon: Layers,
    targetTab: 'CLOUD_STORAGE',
    problemSolved:
      'Creating a production Cloud Storage bucket requires fine-grained control over Region vs Dual-Region (custom pair + 15-minute Turbo Replication RPO) vs Multi-Region topology, Autoclass vs manual storage classes, Uniform vs Fine-grained ACLs, WORM Retention Locks, Soft-Delete windows, CMEK encryption, and Lifecycle policies.',
    howItWorks: [
      '5-Step Google Cloud Console Parity Wizard: Step 1 (Location Type: Region, Dual-Region custom pairs + Turbo RPO, or Multi-Region US/EU/ASIA), Step 2 (Default Storage Class or Autoclass + Hierarchical Namespace HNS), Step 3 (Public Access Prevention + Uniform vs Fine-grained Access Control), Step 4 (Soft Delete 0–90d, Object Versioning + max versions, WORM Retention Policy + Lock, Google-managed vs Cloud KMS CMEK), Step 5 (Lifecycle rules, Requester Pays, CORS origins, and Key=Value FinOps labels).',
      '1-Tap Regulatory Blueprints: Pre-fills SEC Rule 17a-4 / FINRA Immutable WORM Vault, HIPAA / HITECH ePHI Vault, EU GDPR Sovereign Boundary (europe-west3), FinOps Intelligent Tiering Lake, or Ransomware Air-Gap Backup Vault.',
      'Live Bucket Compliance Posture Matrix (0–100 Score): Audits every existing bucket in your project with 1-tap remediation for Public Access Prevention, Uniform Access, Soft Delete, Versioning, and Lifecycle rules.',
    ],
    apisUsed: [
      'POST /api/project/:id/provision (resourceType: "GCS_BUCKET") → storage.googleapis.com/storage/v1/b',
      'POST /api/project/:id/storage/buckets/:bucket/security-patch → PATCH storage.googleapis.com/storage/v1/b/:bucket',
    ],
    billingImpact:
      'Enforces lifecycle auto-tiering and archival deletion rules to continuously compress monthly storage spend.',
  },
  {
    id: 'gde-promotional-credit-guardian',
    wave: 'CLOUD BILLING ACCOUNT · GDE PROMOTIONAL CREDIT GUARDIAN & ACTIVE-ONLY CSV HARVESTER',
    title:
      'Cloud Billing Account & Google Developer Expert (GDE) Promotional Credit Expiration, Strict Expired-Grant Filter & 6-Service Stranded Balance Harvester',
    badge: 'FINOPS TAB + TOP HEADER ALERT PILL',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: DollarSign,
    targetTab: 'FINOPS',
    problemSolved:
      'Google Cloud Console Billing Budgets track gross/net spend, but fail to warn Google Developer Experts (GDEs) and credit holders when their promotional bonus grant is approaching its expiration cliff date OR when historical Expired grants in a exported Credits CSV could be confused with active available bonus credits.',
    howItWorks: [
      '1-Click 9-Column Google Cloud Credits CSV Auto-Discovery & Strict Expired-Grant Filter (`computeGdeGrantMetrics` & `programmaticallyAggregateBillingData`): Scans `~/Downloads`, `~/Desktop`, and `/tmp` for the newest 9-column Billing Credits CSV (`Credit name,Status,Currency,Percent remaining,Remaining value,Original value,Start date,End date,Credit application type`), strictly excludes rows where `Status = Expired` (or past `End date`) from active `Bonus: $...` totals so expired historical grants never inflate your active remaining balance, while keeping them clearly labeled `Expired` in the ledger.',
      'Dual-Risk GDE Bonus Alert Engine & 6-Service "Use-It-Or-Lose-It" Credit Harvester: Continuously compares each active grant’s remaining balance ($) and expiration countdown against your live project daily burn ($/day), and computes exact capacity across 6 GCP services (Spot VM / L4 GPU, Cloud Storage, GKE Autopilot, Cloud Run L4 GPU Jobs, Cloud SQL / AlloyDB, and BigQuery Gold Lakehouse) aligned to your project region.',
      'BigQuery Billing Export Credit Audit & Budget CLI: Generates 1-click UNNEST(credits) SQL for gcp_billing_export_v1_* and gcloud billing budgets create --credit-types-treatment=include-all-credits commands.',
    ],
    apisUsed: [
      'GET /api/project/:id/billing-guardian → cloudbilling.googleapis.com/v1/projects/:id/billingInfo + Local CSV Auto-Discovery',
      'POST /api/project/:id/billing-guardian/grants & POST /api/project/:id/billing-guardian/auto-export-csv',
    ],
    billingImpact:
      'Guarantees 100% accurate active remaining bonus calculation ($0 expired grant inflation), prevents losing unused GDE promotional credit balances on expiration cliff dates, and prevents surprise credit-card spillover.',
  },
  {
    id: 'gde-streamer-tutorial-privacy-shield',
    wave: 'GDE TUTORIAL MODE · SCREEN-SHARE & VIDEO PRIVACY SHIELD',
    title:
      'GDE Streamer & Video Tutorial Privacy Shield (1-Click Email, Billing ID, Project # & Public IP Redactor)',
    badge: 'TOP HEADER GDE MODE + ALT+G',
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    icon: ShieldCheck,
    targetTab: 'OVERVIEW',
    problemSolved:
      'When Google Developer Experts (GDEs), educators, and engineers record YouTube tutorials, workshops, or live screen-shares, the UI normally exposes personal email addresses, Cloud Billing Account IDs (01XXXX-XXXXXX-XXXXXX), 12-digit GCP project numbers, and public VM/LB IPv4 addresses—forcing painful video blurring in post-production.',
    howItWorks: [
      '1-Click Top-Bar Toggle (`GDE Mode`) & Global `Alt+G` Shortcut: Instantly masks your authenticated email (`gde-instructor@google-cloud-demo.dev`), Cloud Billing Account IDs (`01GDE•-••••••-TUTOR1`), GCP Project Numbers (`#9900••••••01`), and Public IPv4 addresses (`34.•••.•••.88`) across all 20 tabs, modals, and hover tooltips.',
      'Zero API Breakage (`MutationObserver` + `WeakMap` Cache): Keeps React state (`selectedProjectId`, `account`, `billingAccountName`) 100% intact for live Google Cloud REST API calls while redacting rendered DOM text nodes and tooltips in real time—and restores the exact original values the instant you toggle GDE Mode off.',
      'Granular Shield Popover (``) & Refresh Persistence: Customize your on-screen demo email alias and toggle 6 individual privacy shields (Emails, Billing IDs, Project Numbers, Public IPs, Project IDs, and Dollar Balances), persisted in `localStorage` so page refreshes during a live stream never leak PII.',
    ],
    apisUsed: [
      'Client-side Real-Time DOM & Tooltip Redaction Engine (`GdeStreamerPrivacyShield.jsx`)',
      'Persisted in `localStorage` (`cloudpulse_gde_tutorial_mode_v1`) with `Alt+G` / `⌘K` toggle',
    ],
    billingImpact:
      '100% client-side zero-latency privacy shield ($0 cost). Eliminates post-production video blurring for GDE tutorials and live streams.',
  },
  {
    id: 'aws-azure-parity-super-studio',
    wave: 'INNOVATION #39–#50 · 24-IN-1 AWS, AZURE, ALIBABA CLOUD & HUAWEI CLOUD PARITY SUITE',
    title:
      '24-in-1 Global Multi-Cloud Parity Super-Studio (AWS, Azure, Alibaba Cloud & Huawei Cloud Bridges for Google Cloud)',
    badge: 'AWS/AZURE PARITY TAB',
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    icon: Layers,
    targetTab: 'AWS_AZURE_PARITY',
    problemSolved:
      'Engineers migrating from AWS, Microsoft Azure, Alibaba Cloud (Aliyun), or Huawei Cloud miss 24 iconic enterprise workflows—ranging from Azure Resource Groups, Multi-Brand OAuth in 1 Project, and Route 53 / CloudTrail / RAM / Bedrock Guardrails to Alibaba 11.11 Singles-Day PTS + MSE Sentinel Surge Protection, CEN Cross-Region QoS Slicing, PolarDB/GaussDB Zero-Copy HTAP Clones, and Huawei Volcano Fractional vGPU Pools.',
    howItWorks: [
      '1. Wave 1–3 AWS & Azure Enterprise Core (Modules 1–16): Azure Resource Groups (`labels.resource_group`, live `$/mo` + Accrued Spend, RG-Scoped RBAC & 1-Click Cascade Delete), Hard-Spend Stop-Loss Fuse, AWS IAM Policy Simulator & Switch-Role, Azure SAS / S3 Presigned Studio, 1-Screen Global HTTPS LB + WAF, CloudFormation/ARM Drift & Rollback, Cost Explorer + CUD Savings Plans, AWS SSM Fleet Run Command, EventBridge Pipes, Key Vault Rotation, Trusted Advisor 5-Pillar Scorer, Transit Gateway VPC Mesh, ECS/ACA Sidecar Compose, GuardDuty/Sentinel SOAR, Step Functions Saga Studio, and Multi-Brand OAuth Sign-In Studio.',
      '2. Wave 4 Moonshot AWS & Azure Parity (Modules 17–20): Route 53 Traffic Flow / Azure Front Door Weighted & Geo-Proximity DNS Studio, CloudTrail Lake / Activity Log SQL Time-Detective, AWS RAM / Azure Lighthouse Cross-Project Resource Sharing Hub, and Bedrock Guardrails / Azure AI Foundry Multi-Model Vertex AI Router with Cloud DLP PII Redaction.',
      '3. Wave 5 Alibaba Cloud (Aliyun) & Huawei Cloud Hyperscale Parity (Modules 21–24): (21) Alibaba PTS + MSE Sentinel 11.11 Singles-Day Flash-Sale Pre-Warm & QPS Token-Bucket Shedder, (22) Alibaba CEN & Global Accelerator Cross-Region QoS Bandwidth Slicer (Gold/Silver/Bronze lanes), (23) Alibaba PolarDB & Huawei GaussDB Serverless HTAP Read-Pool & 1.6s Zero-Copy Snapshot Clone, and (24) Huawei CCE Volcano Gang-Scheduler + ModelArts / Alibaba PAI Fractional vGPU Pool (0.125x / 0.25x / 0.50x GPU slicing).',
    ],
    apisUsed: [
      'GET /api/project/:id/aws-azure-parity/overview & POST /api/project/:id/aws-azure-parity/action',
      'GET /api/project/:id/aws-azure-parity/presigned-bridge/:sasToken',
    ],
    billingImpact:
      'Prevents runaway bills via automated compute stop-loss fuses, eliminates cold-start checkout outages via MSE Sentinel token-bucket shedding, and cuts GPU cluster spend by up to 75% via Volcano fractional vGPU slicing.',
  },
  {
    id: 'live-cloud-billing-pricing-sync',
    wave: 'VARIABLE PRICING ENGINE · ZERO STALE RATES',
    title:
      'Live Google Cloud Billing Catalog Price Sync & Custom Enterprise Discount Override Bar',
    badge: 'GLOBAL MAP + 2026 LAB + SRE AUDITOR',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: DollarSign,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'FINOPS_SLEEP',
    problemSolved:
      'Cloud providers periodically change SKU rates, regional tier multipliers, and egress fees, or organizations negotiate custom Enterprise / EDP discounts. Hardcoding static prices causes inaccurate FinOps burn-rate reporting.',
    howItWorks: [
      'Sync Live GCP Prices Button: Queries GET /api/pricing/live-sync (which probes cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus when authenticated) to refresh compute, serverless, GPU, storage, and egress rates on demand.',
      'Global Price Adjustment Factor (0.50x–1.50x) & Per-SKU Override Editor: Lets you apply your organization’s negotiated enterprise discount or edit any individual rate (e2-medium, Cloud Run vCPU, L4 GPU, Standard Storage, Egress) and immediately recalculates every FinOps metric across the entire app.',
    ],
    apisUsed: [
      'GET /api/pricing/live-sync → cloudbilling.googleapis.com/v1/services',
      'Shared React Pricing Hook: useLivePricingCatalog() & <LivePricingCatalogControlBar />',
    ],
    billingImpact:
      '100% free catalog sync. Ensures all FinOps projections match your real-world billing rates.',
  },
  {
    id: 'wave5-autonomous-cloud-brain',
    wave: 'WAVE 5 · AUTONOMOUS CLOUD BRAIN',
    title:
      '"Pre-Crime" 30-Day Billing Time-Crystal, Failure Cascade X-Ray & Dream Stack Compiler',
    badge: '2026 LAB · TAB 1 (NEW)',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Sparkles,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'DREAM_BRAIN',
    problemSolved:
      'Cloud consoles only show past billing invoices after the money is already spent, never warn you which day/hour a traffic spike or infinite retry loop will exhaust your budget, and force you to manually stitch together multi-service architectures without knowing which region is cheapest, greenest, and hardware-compatible.',
    howItWorks: [
      '"Pre-Crime" 30-Day Billing Time-Crystal Simulator: Combines your live project $/hr burn rate with a configurable Monthly Hard Budget Cap ($20–$1,000) and lets you inject anomaly scenarios (35x Viral Traffic Spike, 120x Runaway Retry Loop, 4x NVIDIA L4 GPU Surge, 8 TB Egress Flood). Plots a 30-day SVG trajectory showing the exact Day & Hour of budget exhaustion and how much money is saved when the Autonomous $0-Idle Circuit-Breaker is armed.',
      '"What-If" Resource Blast-Radius & Failure Cascade X-Ray: Click any live VPC, Firewall Rule, Cloud Run Service, Compute VM, GCS Bucket, or BigQuery Dataset to inspect its Blast Severity Score (/100), Upstream Entrypoints, Downstream Failure Cascade, and a 1-click Self-Healing CLI command.',
      'Autonomous Cloud Architecture Compiler: Select a production archetype (Zero-Trust L4 GPU RAG Stack, EU GDPR Sovereign Lakehouse, Ultra-Frugal Spot Mesh, or 98% CFE Green Core). Automatically scans all 40 GCP regions for GPU SKU support, Tier-1 pricing, and highest Carbon-Free Energy % to output an itemized Bill of Materials ($/mo) and a full gcloud + bq deployment script.',
    ],
    apisUsed: [
      'Live telemetry from GET /api/project/:id/overview & GET /api/project/:id/vms',
      'POST /api/project/:id/hibernate (1-Tap Emergency $0-Idle Circuit-Breaker)',
      'POST /api/project/:id/provision (1-Tap Component Provisioning into Optimal Region)',
    ],
    billingImpact:
      '100% free simulation ($0 cost). Prevents catastrophic surprise cloud bills before they happen.',
  },
  {
    id: 'wave5-sku-finops-migration-engine',
    wave: 'WAVE 5 · FINOPS & SKU GATEKEEPER',
    title:
      'Regional GPU/Service SKU Gatekeeper & Live Migration FinOps Break-Even Calculator',
    badge: 'GLOBAL MAP + 2026 LAB · TAB 8',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: Leaf,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TELEPORT_DIFF',
    problemSolved:
      'Migrating a workload strictly for Carbon-Free Energy (CFE%) can fail at deploy time if the destination region lacks required hardware (e.g., Cloud Run NVIDIA L4 GPUs are only in 10 of 40 regions), or cause a +38% monthly bill jump when moving from a Tier-1 region (1.00x) to a Tier-2 region (1.38x) plus cross-continental egress fees.',
    howItWorks: [
      'Pre-Flight Hardware & Service SKU Gatekeeper: Maps all 40 GCP regions against Cloud Run Serverless L4 GPUs, Compute Engine G2 L4 GPU VMs, and A3 H100 / TPU v5e Mega-Hubs. Blocks incompatible migrations before API dispatch and offers 1-click "Switch to Greenest GPU-Compatible Region" or "Strip GPU & Deploy as CPU-Only".',
      '3-Part Live Migration FinOps Receipt: Computes (1) Ongoing Monthly Compute Spend Delta ($source/mo → $target/mo using real regional price multipliers from 1.00x to 1.38x), (2) One-Time Container & State Egress Transfer Fee ($0.02/GB intra-continental vs $0.08–$0.12/GB inter-continental), and (3) FinOps Break-Even Payback in Days.',
      'Smart 3-Way Destination Recommender: Recommends the #1 Greenest SKU-Compatible Region, #1 Cheapest + Green Arbitrage Region, and #1 Same-Continent Low-Egress Peer.',
    ],
    apisUsed: [
      'Shared 40-Region Engine: evaluateMigrationFeasibility() & findBestMigrationTargets()',
      'POST /api/project/:id/cloudrun/teleport → run.googleapis.com/v2',
    ],
    billingImpact:
      'Eliminates failed GPU deployments and calculates exact monthly savings and egress payback days before you migrate.',
  },
  {
    id: 'wave3-orbital-hud',
    wave: 'WAVE 3 · 2030 ORBITAL UI',
    title: '2030 Orbital Telemetry HUD, Stack Synthesizer & Flight Recorder',
    badge: 'TOP RIBBON HUD',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Wand2,
    targetTab: 'OVERVIEW',
    problemSolved:
      'In the standard Google Cloud Console, deploying a connected 3-tier application (Storage + BigQuery + Cloud Run) requires visiting 3 separate product consoles and manually copying resource URIs. Furthermore, if you make a mistake, there is no single "Undo" button.',
    howItWorks: [
      'Live Orbital Telemetry Ribbon: Continuously measures your real REST API Round-Trip Time (ms), calculates your project-wide Carbon-Free Energy score (CFE%), grades your security posture (A+ to B), and counts active workloads across Americas, Europe, APAC, and MENA.',
      '1-Tap Stack Synthesizer: Lets you pick a complete architecture blueprint (AI RAG Inference Stack, Real-Time Lakehouse, or Zero-Trust Edge Stack) and provisions a Cloud Storage Bucket + BigQuery Dataset + Cloud Run Gen2 Service in parallel, automatically injecting GCS_BUCKET_URI and BIGQUERY_DATASET into the Cloud Run container environment variables.',
      'Cloud Flight Recorder & 1-Tap Undo: Records every stack deployment and cross-region service teleport in a chronological ledger with a "1-Tap Rewind / Delete" button to immediately roll back any newly created resource.',
    ],
    apisUsed: [
      'POST /api/project/:id/stack-deploy → storage.googleapis.com/storage/v1/b + bigquery.googleapis.com/v2 + run.googleapis.com/v2',
      'GET /api/project/:id/flight-recorder → Session mutation ledger with 1-tap rollback payloads',
    ],
    billingImpact:
      'Synthesized stacks default to Scale-to-Zero Cloud Run (minInstances=0), Standard GCS, and Serverless BigQuery ($0.00/hr idle cost when not serving traffic).',
  },
  {
    id: 'wave1-burn-radar',
    wave: 'WAVE 1 · REAL-TIME FINOPS',
    title: 'Live Wallet Burn-Rate Radar ($/hr & $/mo) + Pre-Deploy Cost Calculator',
    badge: 'HEADER + PROVISION MODAL',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: DollarSign,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'FINOPS_SLEEP',
    problemSolved:
      'Google Cloud Billing reports typically lag by 6–24 hours. Engineers often deploy a GPU service or large VM without realizing its hourly burn rate until a surprise bill arrives at the end of the month.',
    howItWorks: [
      'Header Live Ticker: Inspects every running Compute Engine VM (machine type, Spot -68% discount, and attached persistent disk size), warm Cloud Run instance (vCPU, RAM, and NVIDIA L4 / RTX PRO 6000 GPU), GKE cluster, and GCS bucket to compute your exact $/hr and projected 730-hour $/month run-rate.',
      'Pre-Deploy FinOps Price Calculator: Built directly inside the "+ Provision Resource" modal. As you toggle between Spot vs On-Demand VMs, or Request-based ($0 idle) vs Instance-based GPU Cloud Run, the calculator updates your estimated $/hr and $/mo before you click Create.',
    ],
    apisUsed: [
      'GET /api/project/:id/overview & GET /api/project/:id/vms',
      'Client-side real-time pricing engine (calculateLiveBurnRate)',
    ],
    billingImpact:
      'Read-only calculation ($0 cost). Helps prevent accidental high-burn deployments.',
  },
  {
    id: 'wave1-night-sleep',
    wave: 'WAVE 1 · 1-TAP FINOPS HIBERNATE & CLOUD SCHEDULER',
    title: 'Night-Mode FinOps Sleep & Wake Switch (Live REST + Google Cloud Scheduler & Instance Schedules)',
    badge: '2026 LAB · TAB 2',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Moon,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'FINOPS_SLEEP',
    problemSolved:
      'Development and staging projects often run 24 hours a day even though engineers only use them 8 hours a day—wasting ~66% of compute spend overnight and on weekends. At the same time, engineers need full transparency into which unallocated or storage resources continue billing even when VMs are stopped.',
    howItWorks: [
      '1-Click On-Demand Hibernation (POST /api/project/:id/hibernate): Scans all availability zones for RUNNING Compute Engine VMs and all regions for warm Cloud Run services (minInstanceCount > 0), saves a restoration snapshot, stops running VMs, and scales warm Cloud Run services to minInstanceCount = 0.',
      'Autonomous 24/7 Cron via Google Cloud Scheduler & Compute Instance Schedules: Generates ready-to-run gcloud compute resource-policies create instance-schedule (0 20 * * 1-5 sleep / 0 8 * * 1-5 wake) and Google Cloud Scheduler HTTP jobs (cloudscheduler.googleapis.com) so Google Cloud hibernates and wakes your fleet automatically without keeping a browser tab open.',
      'Transparent Residual Floor Breakdown (Persistent Disks & Unused Static IPs): Explicitly separates Active Compute Burn ($0.00/hr when parked) from Residual Non-Compute Charges—explaining that Google Cloud still bills $0.04–$0.10/GB-mo for attached Persistent Disks/Hyperdisks on STOPPED VMs and $0.010/hr (~$7.30/mo) for reserved Static External IPv4 addresses attached to stopped VMs or left unattached.',
    ],
    apisUsed: [
      'POST /api/project/:id/hibernate ({ mode: "SLEEP" | "WAKE" })',
      'POST compute.googleapis.com/compute/v1/projects/:id/zones/:zone/instances/:vm/stop & /start + compute.resourcePolicies (Instance Schedules)',
      'PATCH run.googleapis.com/v2/projects/:id/locations/:region/services/:srv + cloudscheduler.googleapis.com/v1',
    ],
    billingImpact:
      'Drops active VM vCPU/RAM/GPU and warm Cloud Run idle charges to $0.00/hr while parked, while transparently reporting the residual $/hr floor for attached Persistent Disks ($0.04–$0.10/GB-mo) and unused Static External IPv4 addresses ($0.010/hr).',
  },
  {
    id: 'wave1-topology',
    wave: 'WAVE 1 · VISUAL ARCHITECTURE',
    title: 'Interactive 4-Layer Cloud Topology & Blast-Radius Graph',
    badge: '2026 LAB · TAB 1',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Share2,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TOPOLOGY',
    problemSolved:
      'Understanding how your public firewall rules, VPC networks, Compute VMs, Cloud Run services, and Storage/BigQuery datasets connect—and which resources are exposed to the public internet (0.0.0.0/0)—requires checking 5 different pages in GCP Console.',
    howItWorks: [
      'Renders a live 4-column architecture map of your active project:',
      'Layer 1 (Public Internet 0.0.0.0/0 Exposure): Flags world-open ingress firewall rules and public allUsers Cloud Run URLs.',
      'Layer 2 (VPC Network Backbone): Shows every VPC network, routing mode (REGIONAL vs GLOBAL), and MTU.',
      'Layer 3 (Compute & Serverless Fleet): Lists all Compute Engine VMs and Cloud Run services with their live status, IPs, and GPUs.',
      'Layer 4 (Storage & Data Lakehouse): Lists all Cloud Storage buckets and BigQuery datasets.',
    ],
    apisUsed: [
      'GET /api/project/:id/overview & GET /api/project/:id/vms',
    ],
    billingImpact: '100% read-only visualization ($0 cost).',
  },
  {
    id: 'wave1-terraform',
    wave: 'WAVE 1 · REVERSE IaC EXPORTER',
    title: '1-Tap Reverse-Terraform (main.tf) & gcloud Clone Blueprint Exporter',
    badge: '2026 LAB · TAB 3',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: FileCode2,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TERRAFORM',
    problemSolved:
      'Teams often prototype infrastructure by clicking in the UI, and later struggle to write Terraform (main.tf) or reproducible bash scripts to clone that setup into staging or production.',
    howItWorks: [
      'Introspects all live resources currently running in your GCP project (VPCs, Firewalls, Compute VMs with Spot/Disk/Machine specs, Cloud Run services with Gen2/GPU/Billing settings, GCS Buckets, and BigQuery Datasets).',
      'Dynamically generates valid HashiCorp Terraform HCL (main.tf) or an executable bash script (deploy-project-clone.sh) that you can copy in 1 click to recreate the entire project anywhere.',
    ],
    apisUsed: ['Live client-side IaC compiler over /overview and /vms state'],
    billingImpact: '100% read-only code generation ($0 cost).',
  },
  {
    id: 'wave1-security',
    wave: 'WAVE 1 · ZERO-TRUST SECURITY',
    title: 'Zero-Trust Security & IAM Service Account Posture Scanner',
    badge: '2026 LAB · TAB 4',
    badgeColor: 'bg-red-500/15 text-red-500 border-red-500/30',
    icon: ShieldAlert,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'SECURITY',
    problemSolved:
      'Open 0.0.0.0/0 firewall rules on SSH (port 22) or RDP (port 3389) and forgotten IAM Service Accounts are the #1 cause of compromised cloud projects.',
    howItWorks: [
      'Queries iam.googleapis.com and compute.googleapis.com in parallel to list all active IAM Service Accounts and inspect every active VPC firewall rule.',
      'Computes a live Security Posture Score (0–100) and flags HIGH/MEDIUM risk rules allowing 0.0.0.0/0 ingress.',
      'Provides a "1-Tap Delete Open Firewall Rule" button to immediately close unintended public ports.',
    ],
    apisUsed: [
      'GET /api/project/:id/security-audit → iam.googleapis.com/v1/projects/:id/serviceAccounts + compute.googleapis.com/compute/v1/projects/:id/global/firewalls',
    ],
    billingImpact: '100% free security & IAM audit ($0 cost).',
  },
  {
    id: 'wave2-benchmark-xray',
    wave: 'WAVE 2 · ENGINEER SECRET WISHLIST',
    title: 'Cold-Start & P95 Latency Stress Arena + HTTP Header X-Ray',
    badge: '2026 LAB · TAB 5',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Zap,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'BENCHMARK',
    problemSolved:
      'Testing how fast a Cloud Run service or VM responds—and measuring the exact Cold-Start penalty on request #1 vs subsequent warm requests—normally requires switching to a laptop terminal and running hey, wrk, or curl loops.',
    howItWorks: [
      'Fires Request #1 alone first to measure the exact First-Hit / Cold-Start latency and capture all raw HTTP response headers (x-cloud-trace-context, server, alt-svc, cache-control) + the first 800 bytes of the response body.',
      'Then fires your configured burst (up to 40 requests at 10x concurrency) to compute Warm P50 (median), P95, P99 tail latency, throughput (req/sec), and a visual per-request waterfall chart.',
    ],
    apisUsed: ['POST /api/project/:id/benchmark'],
    billingImpact:
      'Sends standard HTTP requests to your chosen URL (negligible/free within Cloud Run free tier).',
  },
  {
    id: 'wave2-zombie-hunter',
    wave: 'WAVE 2 · ENGINEER SECRET WISHLIST',
    title: 'Zombie Resource Hunter with Real-Time GCP Operation Progress Bar',
    badge: '2026 LAB · TAB 6',
    badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    icon: AlertTriangle,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'ZOMBIES',
    problemSolved:
      'Cloud projects accumulate "silent zombies" that bill you every month while doing zero work: unattached Persistent Disks, reserved Static External IPs not attached to a running VM ($7.30/mo penalty), stopped VMs still paying for boot disks, and warm Cloud Run services.',
    howItWorks: [
      'Scans aggregated disks, regional static IP addresses, stopped VMs, and warm Cloud Run services across your entire project, filtering out resources already in DELETING state.',
      'Calculates the exact Monthly and Annual Waste ($/yr) and Verified Saved ($/yr) for each zombie resource.',
      'Tracks live Google Cloud Zone/Region Operation progress (DISPATCHING 18% → RUNNING 35–92% → DONE 100%) via GET /api/project/:id/operation-status and tombstones deleted resources so they never reappear.',
    ],
    apisUsed: [
      'GET /api/project/:id/zombies & POST /api/project/:id/zombies/exterminate',
      'GET /api/project/:id/operation-status → Polls live compute#operation until DONE',
    ],
    billingImpact: 'Directly saves money by eliminating unused billable resources.',
  },
  {
    id: 'wave2-teleport-diff-carbon',
    wave: 'WAVE 2 · ENGINEER SECRET WISHLIST',
    title: '1-Tap Cross-Region Cloud Run Teleporter, Carbon CFE% & Visual Diff',
    badge: '2026 LAB · TAB 7',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: Globe,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TELEPORT_DIFF',
    problemSolved:
      'Moving or cloning a Cloud Run service to another continent (or to a 98% Carbon-Free hydro/wind region like Montréal or Finland) normally requires re-creating the service and re-entering all env vars, CPU/GPU limits, and IAM bindings manually.',
    howItWorks: [
      '1-Tap Cross-Region Teleporter: Reads the live spec of any Cloud Run service in your project and deploys an identical clone (container image, env vars, CPU/RAM/GPU, billing mode, concurrency, and public IAM invoker policy) into your chosen destination region.',
      'Grid Carbon CFE% Optimizer: Ranks all 13 regions by Google Cloud Carbon-Free Energy percentage (CFE%) and gCO2eq/kWh.',
      'Visual Config Diff Time-Machine: Compares any two Cloud Run services side-by-side with CHANGED vs IDENTICAL highlights.',
    ],
    apisUsed: [
      'POST /api/project/:id/cloudrun/teleport → run.googleapis.com/v2',
    ],
    billingImpact:
      'Cloned Cloud Run services preserve your scaling settings (scale-to-zero services remain $0 when idle).',
  },
  {
    id: 'wave4-global-world-map',
    wave: 'WAVE 4 · 40-REGION ORBITAL MAP',
    title:
      'Global Cloud Map · All 40 Official Regions, 121 Zones, Tactical Spotlight & Chaos Failover',
    badge: 'GLOBAL MAP TAB',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: Globe,
    targetTab: 'GLOBAL_MAP',
    problemSolved:
      'Standard cloud consoles list regions and firewall rules as static text tables, making it impossible to see all 40 Google Cloud regions and 121 zones geographically, test regional/zonal failover, measure subsea fiber RTT latency, or inspect live packet filtering without UI lag or overlapping badges when zoomed in.',
    howItWorks: [
      'All 40 Official GCP Regions & 121 Orbiting Availability Zones: Complete geographic catalog across North America (11), South America (2), Europe (12), Middle East (3), Africa (1), Asia (9), and Oceania (2) with interactive continent presets and full directory matrix.',
      'Tactical Spotlight Focus & Inverse-Zoom Scaling: When zoomed in (up to 6.0x with cursor-locked wheel zoom and WASD/Arrow panning that never scrolls the outer web page), only the selected/hovered region expands its orbiting Availability Zone satellite ring (-a/-b/-c/-f) with intra-region fiber spokes, while unselected neighbors fade into 18% opacity Ghost Mode so labels never collide.',
      'Chaos Outage & Automatic Traffic Failover Simulator: Sever any region or individual Availability Zone in 1 click to watch live packets automatically reroute (⇄FAILOVER) to healthy backup zones or peer regions.',
      'Point-to-Point Subsea Fiber RTT Laser, Multi-Lens Switcher (Traffic / Carbon CFE% / Spot Price), DVR Time-Machine Scrubber (20 snapshots), Performance Cadence Guardrails (100ms–1000ms), and Coordinate-Locked Drop-Pod Provisioning.',
    ],
    apisUsed: [
      'Live evaluation over GET /api/project/:id/overview (vpcs, firewalls, resources)',
      'POST /api/project/:id/provision (Coordinate-Locked Drop-Pod VM/Cloud Run & Priority-100 Cyber-Shield)',
    ],
    billingImpact:
      '100% client-side visual simulation ($0 cost) with configurable tick rate (default 4 FPS / 250ms) and auto-pause on hidden tab to ensure zero CPU hang.',
  },
  {
    id: 'core-enterprise-firewall',
    wave: 'WAVE 1 · ZERO-TRUST SECURITY',
    title: 'Enterprise VPC Firewall Command Center (ALLOW/DENY, INGRESS/EGRESS & Packet Tester)',
    badge: 'VPC & FIREWALLS TAB',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: ShieldAlert,
    targetTab: 'VPC_NETWORKS',
    problemSolved:
      'Managing production VPC security requires full control over both ALLOW and DENY actions, INGRESS and EGRESS directions, priority ordering (0–65535), multi-protocol port matrices, in-place rule editing (PATCH), and instant IAP lockdown.',
    howItWorks: [
      'Full ALLOW & DENY + INGRESS & EGRESS Studio: Create or edit firewall rules in-place with multi-protocol rows (tcp, udp, icmp, sctp, esp, all), custom priorities (0–65535), target network tags, and firewall audit logging.',
      '1-Tap Lock to IAP (35.235.240.0/20) & 1-Tap Pause/Enable: Automatically flags rules exposing SSH (22), RDP (3389), or DB ports to 0.0.0.0/0 and locks them down to Google Cloud IAP in 1 click, or pauses/enables any rule via PATCH.',
      'Interactive Packet Priority Match Simulator: Test any hypothetical packet against your priority-sorted rules + Google Cloud implied fallback rules (65535) to see which exact rule wins.',
    ],
    apisUsed: [
      'POST /api/project/:id/provision (serviceType: VPC_FIREWALL)',
      'PATCH /api/project/:id/firewalls/:firewallName',
      'GET /api/project/:id/operation-status (Live GCP Global Operation progress bar)',
    ],
    billingImpact:
      'VPC Firewall rules are free on Google Cloud ($0/mo). Locking down open ports prevents unauthorized compute abuse.',
  },
  {
    id: 'core-emergency-killswitch',
    wave: 'EMERGENCY MOBILE GOVERNANCE',
    title: 'DEFCON-1 Project Billing Kill-Switch & API Circuit Breaker',
    badge: '2026 SRE TAB',
    badgeColor: 'bg-red-500/15 text-red-500 border-red-500/30',
    icon: PowerOff,
    targetTab: 'OVERVIEW',
    problemSolved:
      'If an API key is leaked or a runaway loop starts spawning expensive GPUs while you are away from your desk, disabling individual APIs or unlinking the billing account from a mobile browser in the standard GCP Console is slow and difficult.',
    howItWorks: [
      'Emergency Project Billing Kill-Switch: Uses a 2-step confirmation to call cloudbilling.googleapis.com and detach the billing account (billingAccountName: "") from the project, immediately stopping all billable spend. Also stores the previous billing account ID so you can re-link it in 1 tap.',
      'Emergency Mobile API Kill-Switch: Lists all enabled APIs on your project with priority sorting (Compute, Cloud Run, Vertex AI, GKE, BigQuery) and lets you disable or re-enable any API in 1 tap.',
    ],
    apisUsed: [
      'GET / POST /api/project/:id/billing → cloudbilling.googleapis.com/v1/projects/:id/billingInfo',
      'GET / POST /api/project/:id/apis → serviceusage.googleapis.com/v1',
    ],
    billingImpact:
      'Unlinking billing immediately halts all billable GCP usage across the entire project.',
  },
  {
    id: 'remaining-bonus-billing-guardian',
    wave: 'WAVE 1 · FINOPS & REMAINING BONUS GUARDIAN',
    title:
      'Remaining Bonus & Cloud Billing Guardian (CSV Importer, Auto-Expiry Countdown & 2-Minute Background Sync)',
    badge: 'BILLING & APIS TAB',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: DollarSign,
    targetTab: 'BILLING_APIS',
    problemSolved:
      'Google Cloud public OAuth APIs (cloudbilling.googleapis.com and billingbudgets.googleapis.com) only expose consumed credits and budget alerts—they do not expose unspent promotional credit grant balances in real time, and multi-grant deduction is too complex to infer automatically.',
    howItWorks: [
      'Upload Remaining Bonus CSV: Download your 9-column Credits .csv file from console.cloud.google.com/billing/<id>/credits (Download CSV) and upload or paste it directly. The parser stores the exact Remaining value and Original value without automatic balance modification, and reminds you to upload a fresh CSV frequently to keep your balance current.',
      'Automatic Expiration Date & Countdown Calculation: Dynamically calculates exact days remaining (Expiring in N days vs Available vs Expired), active CREDIT_TYPE_MONTHLY benefits, required daily burn rate ($/day) before expiration, and projected stranded credit dollars from each grant End date.',
      '1-Click Reset & 2-Minute Non-Blocking Background Sync: Clicking Reset Bonus CSV empties all synced grants and cached ledger rows ($0.00). Entering the Billing tab returns the cached snapshot immediately (cached: true) without blocking on live API calls, while background polling refreshes live Cloud Billing telemetry every 2 minutes.',
    ],
    apisUsed: [
      'GET /api/project/:id/billing-guardian (cached fast-path on page entry; ?refresh=true every 2m)',
      'POST /api/project/:id/billing-guardian/sync-console-credits (9-column GCP Console Credits CSV parser)',
      'POST /api/project/:id/billing-guardian/reset-console-credits (empties all grants & cached ledger rows)',
    ],
    billingImpact:
      'Prevents promotional and GDE credits from expiring unused by tracking exact CSV balances alongside live expiration countdowns and required daily burn targets.',
  },
  {
    id: 'cloudrun-dead-container-gcs-artifact-hunter',
    wave: 'WAVE 11 SRE & FINOPS',
    title:
      '37. Cloud Run Dead Container (Artifact Registry) & Cloud Storage Build-Artifact Hunter',
    badge: 'Cloud Run → Search Dead Containers & GCS Artifacts',
    badgeColor:
      'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    icon: HardDrive,
    targetTab: 'CLOUD_RUN',
    problemSolved:
      'Every time you deploy Cloud Run from source or run Cloud Build, Google Cloud leaves behind old container images and untagged digests in Artifact Registry ($0.10/GB/mo beyond 0.5 GB free tier) plus source tarballs (.tgz) in _cloudbuild, run-sources-*, and gcf-v2-* Cloud Storage buckets—even after you delete the Cloud Run service.',
    howItWorks: [
      '1-Click Cross-Reference Hygiene Scan: Click "Search Dead Containers & GCS Artifacts" in the Cloud Run header. Queries run.googleapis.com/v2, artifactregistry.googleapis.com/v1, and storage.googleapis.com/v1 in parallel.',
      'Active Container Protection + Dead Image Classification: Locks any container image actively serving a live Cloud Run service (Protected) while flagging Dead Containers from Deleted Services, Dead Untagged Digests (0 tags), and Unused/Superseded Images.',
      '1-Click Sweep & Purge: Delete individual dead container images or sweep all dead containers in 1 click (automatically removing attached tags via REST before deleting the version digest), and purge leftover .tgz build staging tarballs or empty & delete staging buckets in Cloud Storage.',
    ],
    apisUsed: [
      'GET /api/project/:id/cloudrun/dead-artifacts-scan (cross-references Cloud Run v2 + Artifact Registry v1 + Cloud Storage v1)',
      'POST /api/project/:id/wave9/supply-chain/delete-image & /sweep-orphans (REST tag + version deletion)',
      'POST /api/project/:id/cloudrun/dead-artifacts-purge-gcs (batch-deletes GCS build/staging tarballs)',
    ],
    billingImpact:
      'Reclaims $0.10/GB/mo in Artifact Registry storage and $0.02/GB/mo in Cloud Storage by eliminating orphaned container digests from deleted Cloud Run services and leftover Cloud Build .tgz source archives.',
  },
  {
    id: 'gde-streamer-privacy-shield',
    wave: 'WAVE 12 STREAMER & INSTRUCTOR PRIVACY',
    title:
      '38. GDE Streamer & Video Tutorial Privacy Shield (Alt+G Live DOM & Credit Balance Redactor)',
    badge: 'Top Header -> GDE Mode (Alt+G)',
    badgeColor:
      'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    icon: ShieldCheck,
    targetTab: 'CLOUD_RUN',
    problemSolved:
      'When Google Developer Experts (GDEs), DevRel engineers, and instructors record video tutorials or share screens live, Google Cloud Console exposes sensitive identifiers—personal/IAM emails, Cloud Billing Account IDs (01XXXX-XXXXXX-XXXXXX), 12-digit Project Numbers, Public IPv4 addresses, and Remaining Promotional Credit / Bonus dollar balances.',
    howItWorks: [
      '1-Click Toggle (Alt+G or Top Header "GDE Mode" Button): Activates real-time DOM text-node and attribute redaction across all 20 tabs, modals, and tooltips using a WeakMap original-text cache.',
      'Automatic Remaining Credit & Bonus Balance Masking (Default ON): Immediately masks the top header Promotional Credits pill ("Credits: $•••.••"), hover tooltips ("$•••.•• / $•••.••"), and all 15+ credit KPI cards, progress bars, tables, and inputs inside Billing & Credit Guardian.',
      'Granular Privacy Filters: Customize masking for Emails, Cloud Billing Account IDs, 12-digit Project Numbers, Public IPv4 addresses, Project IDs, and Dollar Balances without breaking live GCP API calls.',
    ],
    apisUsed: [
      'Client-Side MutationObserver + WeakMap reversible text/attribute redaction engine + redactTextForGdeMode() (Zero API latency)',
    ],
    billingImpact:
      'Zero billing cost ($0.00/mo); prevents accidental credential, credit balance, or billing account ID exposure on YouTube, Twitch, and conference stages.',
  },
  {
    id: 'aws-azure-enterprise-parity-super-studio',
    wave: 'WAVE 12 AWS & AZURE PARITY SUITE',
    title:
      '39. 20-in-1 AWS & Azure Moonshot Parity Super-Studio (Uniform 4-Column Bento Grid & 2-Mode Teardown)',
    badge: 'Top Header -> AWS & Azure Parity ★',
    badgeColor:
      'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30',
    icon: Layers,
    targetTab: 'AWS_AZURE_PARITY',
    problemSolved:
      'Engineers migrating from AWS or Azure miss 20 iconic enterprise workflows that Google Cloud Console either scatters across 6+ pages or lacks natively—and need a clean, uniform navigation grid plus a safe way to tear down a single feature without accidentally disabling shared Google Cloud APIs (like run.googleapis.com or workflows.googleapis.com) used by the rest of the project.',
    howItWorks: [
      'Uniform 4-Column Bento Grid (5 Rows × 4 Columns) & Two-Mode Safe Feature Teardown: Every feature is aligned in an equal-width/height (h-11) card with 01–20 badges and a live Cost & API Control Bar. Clicking "Disable & Teardown Feature" opens a mandatory Two-Mode Confirmation Modal: Mode 1 (FEATURE_ONLY — resets only that feature while keeping shared project APIs enabled) vs Mode 2 (PURGE_AND_DISABLE_APIS — purges feature state AND runs gcloud services disable --force on the underlying GCP APIs).',
      'Modules 01-05 & 16 (Wave 1 Foundation + Azure Architect Wishlist): (01) Azure-Style Resource Groups (labels.resource_group) with live $/hr + $/mo + accrued session spend, RG-scoped RBAC role assignment (Reader/Contributor/Owner + GCP IAM CEL Condition), 1-click group hibernate & cascade teardown, (02) Hard-Spend Stop-Loss Fuse, (03) AWS IAM Policy Simulator & Switch-Role Preview, (04) Azure SAS / S3 1-Click Presigned URLs & Browser Upload Studio, (05) 1-Screen Global HTTPS Load Balancer + WAF Wizard, and (16) Multi-Brand OAuth Sign-In Studio (multiple distinct OAuth brandings inside 1 "prod" GCP project).',
      'Modules 06-10 (Wave 2 Enterprise Scale): (06) CloudFormation / Azure ARM Stack Snapshot, Drift Detector, Rollback & Terraform/Pulumi Exporter, (07) Cost Explorer 14-Day Burn Attribution & CUD Savings Plans, (08) AWS SSM Fleet Run Command & Zero-SSH Patch Manager, (09) EventBridge Pipes / Logic Apps Visual Event Router with automatic -dlq Pub/Sub provisioning, and (10) Key Vault 1-Click Secret Rotation & Dev/Staging/Prod Sync.',
      'Modules 11-15 & 17-20 (Wave 3 & 4 Hyper-Scale + Moonshot Parity): (11) Trusted Advisor 5-Pillar Scorer & Auto-Fixer, (12) Transit Gateway / Virtual WAN VPC Mesh, (13) ECS/ACA Multi-Container Gen2 Sidecar Compose, (14) GuardDuty / Sentinel SOAR Playbooks, (15) Step Functions / Durable Saga Studio, (17) Route 53 / Front Door DNS Routing, (18) CloudTrail / Activity Log SQL Time-Detective, (19) AWS RAM / Azure Lighthouse Cross-Project Sharing, and (20) Bedrock Guardrails / Azure AI Foundry Multi-Model Vertex AI Router.',
    ],
    apisUsed: [
      'GET /api/project/:id/aws-azure-parity/overview (12-way parallel discovery with 3.5s fast timeout guard)',
      'POST /api/project/:id/aws-azure-parity/action (ENABLE_PARITY_FEATURE_APIS, TEARDOWN_PARITY_FEATURE [FEATURE_ONLY | PURGE_AND_DISABLE_APIS], plus all 20 AWS/Azure bridge actions)',
    ],
    billingImpact:
      'Prevents runaway cloud bills via automated Hard-Spend Stop-Loss Fuses, protects shared project APIs during feature teardown, and unlocks up to 55%-68% compute savings via 1-Click CUD and Scale-to-Zero arbitrage.',
  },
  {
    id: 'alibaba-huawei-hyperscale-parity-super-studio',
    wave: 'WAVE 12 ALIBABA & HUAWEI PARITY SUITE',
    title:
      '40. 8-in-1 Alibaba Cloud (Aliyun) & Huawei Cloud Hyperscale Parity Super-Studio',
    badge: 'Top Header -> Alibaba & Huawei ',
    badgeColor:
      'bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30',
    icon: Rocket,
    targetTab: 'ALIBABA_HUAWEI_PARITY',
    problemSolved:
      'Alibaba Cloud (Aliyun) and Huawei Cloud pioneered 8 battle-tested hyperscale architectures for 11.11 Singles’ Day flash sales, cross-region QoS bandwidth slicing, 1.6s zero-copy HTAP database cloning, fractional vGPU gang-scheduling, 2-phase transactional delay queues, sub-80ms hot config mesh, hybrid row-column sub-second OLAP, and executive NOC command walls that require complex multi-service wiring on Google Cloud.',
    howItWorks: [
      'Uniform 4-Column Bento Grid (2 Rows × 4 Columns) & Two-Mode Safe Feature Teardown: Displays all 8 bridges in an equal-width/height 2×4 grid with 01–08 badges, Under-the-Hood GCP Architecture X-Ray, 1-Click Enable APIs, and Two-Mode Teardown (FEATURE_ONLY vs PURGE_AND_DISABLE_APIS).',
      'Bridges 01–04 (Flash-Sale Surge, Global QoS, HTAP & AI vGPU): (01) Alibaba PTS + MSE Sentinel 11.11 Flash-Sale Pre-Warm (minInstanceCount warm pool) & QPS Token-Bucket Shedder, (02) Alibaba CEN & Global Accelerator Cross-Region QoS Bandwidth Slicer (Gold/Silver/Bronze lanes), (03) PolarDB / Huawei GaussDB Serverless HTAP Read-Pool & 1.6s Zero-Copy Clone, and (04) Huawei CCE Volcano Gang-Scheduler + ModelArts / PAI Fractional vGPU Pool (0.125x/0.25x/0.50x GPU slices).',
      'Bridges 05–08 (Transactional Messaging, Wasm Mesh, Sub-s OLAP & Executive NOC): (05) Alibaba RocketMQ 5.0 2-Phase Transactional Half-Messages & Exact-Second Delay Queue (Cloud Tasks + Pub/Sub), (06) Alibaba Nacos + Higress Zero-Restart <80ms Hot Config & AI Wasm Gateway, (07) Alibaba Hologres + MaxCompute Sub-Second Hybrid Row-Column OLAP (BigQuery BI Engine + Bigtable), and (08) DataV / Huawei Astro Executive Digital-Twin NOC & War-Room Command Wall.',
    ],
    apisUsed: [
      'GET /api/project/:id/aws-azure-parity/overview',
      'POST /api/project/:id/aws-azure-parity/action (ARM_ALIYUN_FLASH_SALE_SURGE, TRIGGER_PTS_SURGE_DRILL, CREATE_CEN_QOS_BANDWIDTH_SLICE, PROVISION_HTAP_POOL_OR_CLONE, ALLOCATE_FRACTIONAL_VGPU_POOL, PUBLISH_ROCKETMQ_2PC_DELAY_MSG, COMMIT_OR_ROLLBACK_ROCKETMQ_2PC, PUSH_NACOS_HOT_CONFIG, CREATE_HOLOGRES_HYBRID_TABLE, RUN_HOLOGRES_SUBSECOND_QUERY, SIMULATE_DATAV_NOC_SURGE)',
    ],
    billingImpact:
      'Cuts GPU cluster waste by up to 75% via fractional vGPU time-slicing, eliminates duplicate database storage costs via zero-copy HTAP clones, and protects backends during 100x traffic surges.',
  },
];

export default function InteractiveDocsGuide({
  onNavigateToFeature,
  onOpenCommandPalette,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWave, setSelectedWave] = useState('ALL');

  const filteredDocs = useMemo(() => {
    return DOC_SECTIONS.filter((doc) => {
      const matchesWave =
        selectedWave === 'ALL' || doc.wave.includes(selectedWave);
      if (!matchesWave) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.problemSolved.toLowerCase().includes(q) ||
        doc.howItWorks.join(' ').toLowerCase().includes(q) ||
        doc.apisUsed.join(' ').toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedWave]);

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-zinc-900 dark:text-zinc-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
              <BookOpen className="w-3.5 h-3.5" />
              <span>INTERACTIVE ENGINEERING MANUAL & ARCHITECTURE GUIDE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              How CloudPulse 2026 Works Under the Hood
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
              Every revolutionary feature in CloudPulse 2026 talks directly to
              official Google Cloud REST APIs using your authenticated session.
              Read below to understand what each tool does, which GCP APIs it
              calls, its billing impact, and click{' '}
              <strong className="text-blue-600 dark:text-blue-400">&quot;Launch Feature →&quot;</strong> to
              jump straight to it.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs px-4 py-3 rounded-xl shadow-sm transition-colors shrink-0 cursor-pointer"
          >
            <Command className="w-4 h-4" />
            <span>Press ⌘K for Voice & Natural Language Ops</span>
          </button>
        </div>

        {/* Search & Wave Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation (e.g. 'hibernate', 'terraform', 'zombie', 'teleport', 'billing', 'gpu')..."
              className="w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-700 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-6 flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: `All Innovations (${DOC_SECTIONS.length})` },
              { id: 'WAVE 5', label: 'Wave 5 Cloud Brain & SKU' },
              { id: 'WAVE 4', label: 'Wave 4 Global Map (40 Regions)' },
              { id: 'WAVE 3', label: 'Wave 3 Orbital HUD' },
              { id: 'WAVE 2', label: 'Wave 2 Wishlist' },
              { id: 'WAVE 1', label: 'Wave 1 FinOps & IaC' },
              { id: 'EMERGENCY', label: 'Kill-Switches' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedWave(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  selectedWave === f.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-zinc-50 dark:bg-zinc-900/80 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Documentation Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.id}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
                      {doc.wave}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${doc.badgeColor}`}
                    >
                      Location: {doc.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                    <span>{doc.title}</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onNavigateToFeature(doc.targetTab, doc.targetSubTab)
                  }
                  className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold px-3.5 py-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  <span>Launch Feature</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left Column: Why & How It Works */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20">
                    <div className="text-[10px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">
                      Why We Built This (The GCP Console Pain Point)
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {doc.problemSolved}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-mono font-bold uppercase text-zinc-500">
                      Step-by-Step How It Works
                    </div>
                    <ul className="space-y-1.5">
                      {doc.howItWorks.map((step, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column: Under-the-Hood REST APIs & Billing/Safety Impact */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase text-blue-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Under-the-Hood GCP REST APIs Called</span>
                    </div>
                    <div className="space-y-1">
                      {doc.apisUsed.map((api, i) => (
                        <div
                          key={i}
                          className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 break-all"
                        >
                          • {api}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/25">
                    <div className="text-[10px] font-mono font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1">
                      Safety & Billing Impact
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300">
                      {doc.billingImpact}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
