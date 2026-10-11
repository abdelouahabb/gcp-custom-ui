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
} from 'lucide-react';

const DOC_SECTIONS = [
  {
    id: 'wave3-engineer-moonshots-x1-x6',
    wave: 'WAVE 6 · ENGINEER MOONSHOT LAB (X1–X6)',
    title:
      '🚀 6 Out-of-the-Box Cloud Engineering Moonshots (DLP X-Ray, Cold-Start Surgeon, Egress Tollbooth, Ransomware Air-Gap, Anycast Latency & AES-256-GCM Gemini 3.8 / 3.1 Vault)',
    badge: '2026 LAB · MOONSHOTS X1–X6 (NEW)',
    badgeColor: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    icon: Rocket,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'MOONSHOT_X1_DLP',
    problemSolved:
      'Engineers constantly battle leaked credentials/PII inside Cloud Storage buckets, mysterious 1.5s–3.5s Cloud Run cold starts, hidden cross-region egress bandwidth taxes, ransomware bucket deletion risks, global client latency blindspots, and how to use live Gemini 3.8 Flash / 3.1 Pro without ever writing an API key to disk or browser localStorage.',
    howItWorks: [
      '🕵️ X1 — Cloud Storage Live DLP, Secret Leak & PII X-Ray Scanner + 1-Tap In-Place Redactor: Streams object bytes in server memory to detect leaked GCP Service Account keys, AWS keys, GitHub PATs, Stripe keys, JWTs, Credit Cards, IBANs, and SSNs—with a 1-Tap Canary Injector and 1-Tap In-Place Cryptographic Redactor.',
      '⚡ X2 — Serverless Cold-Start Profiler & Container Diet Surgeon: Breaks down Cloud Run startup into 5 phases (Image Pull, Sandbox Init, Runtime Boot, Weight Tax, Warm P50), patches Startup CPU Boost + Gen2 Execution Environment in 1 tap, and synthesizes a multi-stage Distroless Dockerfile.',
      '💸 X3 — Cross-Service Egress & Hidden Data-Gravity Tollbooth: Cross-references every Compute VM and Cloud Run service region against your Cloud Storage bucket locations using the Live Pricing Catalog to flag cross-region ($0.02/GB) and inter-continental ($0.08–$0.12/GB) bandwidth taxes.',
      '🛡️ X4 — Cryptographic Ransomware Air-Gap & Clean-Room Recovery Auditor: Scores every bucket on a 0–100 Ransomware Survival scale, computes exact RTO/RPO, and applies a 1-Tap 30-Day Soft-Delete + Object Versioning Air-Gap Shield.',
      '🌐 X5 — 12-Metropolis Speed-of-Light User-Experience & Anycast Edge Latency Matrix: Calculates great-circle fiber distance and TLS RTT from 12 global population hubs to your active GCP regions vs Google Cloud CDN Anycast Edge.',
      '🔐 X6 — Option 3 AES-256-GCM Encrypted Google AI Studio BYOK RAM Vault (Gemini 3.8 Flash & 3.1 Pro): Seals your AIzaSy... key in volatile Node.js RAM using crypto.createCipheriv("aes-256-gcm") with an 8,192-token output budget, live /v1beta/models auto-discovery, and 3-step onboarding when empty.',
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
    id: 'cloud-storage-5step-compliance-studio',
    wave: 'CLOUD STORAGE · ENTERPRISE COMPLIANCE & 5-STEP WIZARD',
    title:
      '🗄️ 5-Step Fine-Grained Cloud Storage Provisioning Wizard & Regulatory Compliance Studio (SEC 17a-4, HIPAA, GDPR, Sovereign Zero-Trust)',
    badge: 'STORAGE & DATA + PROVISION MODAL',
    badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    icon: Layers,
    targetTab: 'STORAGE_BQ',
    problemSolved:
      'Creating a production Cloud Storage bucket requires fine-grained control over Region vs Dual-Region (custom pair + 15-minute Turbo Replication RPO) vs Multi-Region topology, Autoclass vs manual storage classes, Uniform vs Fine-grained ACLs, WORM Retention Locks, Soft-Delete windows, CMEK encryption, and Lifecycle policies.',
    howItWorks: [
      '🏗️ 5-Step Google Cloud Console Parity Wizard: Step 1 (Location Type: Region, Dual-Region custom pairs + Turbo RPO, or Multi-Region US/EU/ASIA), Step 2 (Default Storage Class or Autoclass + Hierarchical Namespace HNS), Step 3 (Public Access Prevention + Uniform vs Fine-grained Access Control), Step 4 (Soft Delete 0–90d, Object Versioning + max versions, WORM Retention Policy + Lock, Google-managed vs Cloud KMS CMEK), Step 5 (Lifecycle rules, Requester Pays, CORS origins, and Key=Value FinOps labels).',
      '🏛️ 1-Tap Regulatory Blueprints: Pre-fills SEC Rule 17a-4 / FINRA Immutable WORM Vault, HIPAA / HITECH ePHI Vault, EU GDPR Sovereign Boundary (europe-west3), FinOps Intelligent Tiering Lake, or Ransomware Air-Gap Backup Vault.',
      '🛡️ Live Bucket Compliance Posture Matrix (0–100 Score): Audits every existing bucket in your project with 1-tap remediation for Public Access Prevention, Uniform Access, Soft Delete, Versioning, and Lifecycle rules.',
    ],
    apisUsed: [
      'POST /api/project/:id/provision (resourceType: "GCS_BUCKET") → storage.googleapis.com/storage/v1/b',
      'POST /api/project/:id/storage/buckets/:bucket/security-patch → PATCH storage.googleapis.com/storage/v1/b/:bucket',
    ],
    billingImpact:
      'Enforces lifecycle auto-tiering and archival deletion rules to continuously compress monthly storage spend.',
  },
  {
    id: 'live-cloud-billing-pricing-sync',
    wave: 'VARIABLE PRICING ENGINE · ZERO STALE RATES',
    title:
      '🔄 Live Google Cloud Billing Catalog Price Sync & Custom Enterprise Discount Override Bar',
    badge: 'GLOBAL MAP 🌍 + 2026 LAB + SRE AUDITOR',
    badgeColor: 'bg-blue-500/15 text-blue-500 border-blue-500/30',
    icon: DollarSign,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'FINOPS_SLEEP',
    problemSolved:
      'Cloud providers periodically change SKU rates, regional tier multipliers, and egress fees, or organizations negotiate custom Enterprise / EDP discounts. Hardcoding static prices causes inaccurate FinOps burn-rate reporting.',
    howItWorks: [
      '🔄 Sync Live GCP Prices Button: Queries GET /api/pricing/live-sync (which probes cloudbilling.googleapis.com/v1/services/6F81-5844-456A/skus when authenticated) to refresh compute, serverless, GPU, storage, and egress rates on demand.',
      '🎛️ Global Price Adjustment Factor (0.50x–1.50x) & Per-SKU Override Editor: Lets you apply your organization’s negotiated enterprise discount or edit any individual rate (e2-medium, Cloud Run vCPU, L4 GPU, Standard Storage, Egress) and immediately recalculates every FinOps metric across the entire app.',
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
      '🔮 "Pre-Crime" 30-Day Billing Time-Crystal, Failure Cascade X-Ray & Dream Stack Compiler',
    badge: '2026 LAB · TAB 1 (NEW)',
    badgeColor: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
    icon: Sparkles,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'DREAM_BRAIN',
    problemSolved:
      'Cloud consoles only show past billing invoices after the money is already spent, never warn you which day/hour a traffic spike or infinite retry loop will exhaust your budget, and force you to manually stitch together multi-service architectures without knowing which region is cheapest, greenest, and hardware-compatible.',
    howItWorks: [
      '🔮 "Pre-Crime" 30-Day Billing Time-Crystal Simulator: Combines your live project $/hr burn rate with a configurable Monthly Hard Budget Cap ($20–$1,000) and lets you inject anomaly scenarios (35x Viral Traffic Spike, 120x Runaway Retry Loop, 4x NVIDIA L4 GPU Surge, 8 TB Egress Flood). Plots a 30-day SVG trajectory showing the exact Day & Hour of budget exhaustion and how much money is saved when the Autonomous $0-Idle Circuit-Breaker is armed.',
      '🧬 "What-If" Resource Blast-Radius & Failure Cascade X-Ray: Click any live VPC, Firewall Rule, Cloud Run Service, Compute VM, GCS Bucket, or BigQuery Dataset to inspect its Blast Severity Score (/100), Upstream Entrypoints, Downstream Failure Cascade, and a 1-click Self-Healing CLI command.',
      '⚡ Autonomous Cloud Architecture Compiler: Select a production archetype (Zero-Trust L4 GPU RAG Stack, EU GDPR Sovereign Lakehouse, Ultra-Frugal Spot Mesh, or 98% CFE Green Core). Automatically scans all 40 GCP regions for GPU SKU support, Tier-1 pricing, and highest Carbon-Free Energy % to output an itemized Bill of Materials ($/mo) and a full gcloud + bq deployment script.',
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
      '🛡️ Regional GPU/Service SKU Gatekeeper & Live Migration FinOps Break-Even Calculator',
    badge: 'GLOBAL MAP 🌍 + 2026 LAB · TAB 8',
    badgeColor: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: Leaf,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'TELEPORT_DIFF',
    problemSolved:
      'Migrating a workload strictly for Carbon-Free Energy (CFE%) can fail at deploy time if the destination region lacks required hardware (e.g., Cloud Run NVIDIA L4 GPUs are only in 10 of 40 regions), or cause a +38% monthly bill jump when moving from a Tier-1 region (1.00x) to a Tier-2 region (1.38x) plus cross-continental egress fees.',
    howItWorks: [
      '🛡️ Pre-Flight Hardware & Service SKU Gatekeeper: Maps all 40 GCP regions against Cloud Run Serverless L4 GPUs, Compute Engine G2 L4 GPU VMs, and A3 H100 / TPU v5e Mega-Hubs. Blocks incompatible migrations before API dispatch and offers 1-click "Switch to Greenest GPU-Compatible Region" or "Strip GPU & Deploy as CPU-Only".',
      '💰 3-Part Live Migration FinOps Receipt: Computes (1) Ongoing Monthly Compute Spend Delta ($source/mo → $target/mo using real regional price multipliers from 1.00x to 1.38x), (2) One-Time Container & State Egress Transfer Fee ($0.02/GB intra-continental vs $0.08–$0.12/GB inter-continental), and (3) FinOps Break-Even Payback in Days.',
      '⚖️ Smart 3-Way Destination Recommender: Recommends the #1 Greenest SKU-Compatible Region, #1 Cheapest + Green Arbitrage Region, and #1 Same-Continent Low-Egress Peer.',
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
    title: '🛰️ 2030 Orbital Telemetry HUD, Stack Synthesizer & Flight Recorder',
    badge: 'TOP RIBBON HUD',
    badgeColor: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
    icon: Wand2,
    targetTab: 'OVERVIEW',
    problemSolved:
      'In the standard Google Cloud Console, deploying a connected 3-tier application (Storage + BigQuery + Cloud Run) requires visiting 3 separate product consoles and manually copying resource URIs. Furthermore, if you make a mistake, there is no single "Undo" button.',
    howItWorks: [
      'Live Orbital Telemetry Ribbon: Continuously measures your real REST API Round-Trip Time (ms), calculates your project-wide Carbon-Free Energy score (CFE%), grades your security posture (A+ to B), and counts active workloads across Americas, Europe, APAC, and MENA.',
      '🪄 1-Tap Stack Synthesizer: Lets you pick a complete architecture blueprint (AI RAG Inference Stack, Real-Time Lakehouse, or Zero-Trust Edge Stack) and provisions a Cloud Storage Bucket + BigQuery Dataset + Cloud Run Gen2 Service in parallel, automatically injecting GCS_BUCKET_URI and BIGQUERY_DATASET into the Cloud Run container environment variables.',
      '⏱️ Cloud Flight Recorder & 1-Tap Undo: Records every stack deployment and cross-region service teleport in a chronological ledger with a "1-Tap Rewind / Delete" button to immediately roll back any newly created resource.',
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
    title: '💸 Live Wallet Burn-Rate Radar ($/hr & $/mo) + Pre-Deploy Cost Calculator',
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
    wave: 'WAVE 1 · 1-TAP FINOPS HIBERNATE',
    title: '🌙 Night-Mode FinOps Sleep & Wake Switch ("Park Project for the Night")',
    badge: '2026 LAB · TAB 2',
    badgeColor: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
    icon: Moon,
    targetTab: 'INNOVATION_LAB',
    targetSubTab: 'FINOPS_SLEEP',
    problemSolved:
      'Development and staging projects often run 24 hours a day even though engineers only use them 8 hours a day—wasting ~66% of compute spend overnight and on weekends.',
    howItWorks: [
      'When you click "Park Night-Mode ($0)", CloudPulse scans all availability zones for RUNNING Compute Engine VMs and all regions for warm Cloud Run services (minInstanceCount > 0).',
      'It saves a snapshot of your exact running VMs and minInstance counts in server memory, then issues parallel stop commands to all running VMs and scales warm Cloud Run services down to minInstanceCount = 0.',
      'When you return in the morning and click "Wake", it reads the saved snapshot and restarts those exact VMs and restores your warm Cloud Run instance counts.',
    ],
    apisUsed: [
      'POST /api/project/:id/hibernate ({ mode: "SLEEP" | "WAKE" })',
      'POST compute.googleapis.com/compute/v1/projects/:id/zones/:zone/instances/:vm/stop & /start',
      'PATCH run.googleapis.com/v2/projects/:id/locations/:region/services/:srv',
    ],
    billingImpact:
      'Immediately drops running VM vCPU/GPU hourly charges and warm Cloud Run idle charges to $0.00/hr while parked.',
  },
  {
    id: 'wave1-topology',
    wave: 'WAVE 1 · VISUAL ARCHITECTURE',
    title: '🕸️ Interactive 4-Layer Cloud Topology & Blast-Radius Graph',
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
    title: '📄 1-Tap Reverse-Terraform (main.tf) & gcloud Clone Blueprint Exporter',
    badge: '2026 LAB · TAB 3',
    badgeColor: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
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
    title: '🛡️ Zero-Trust Security & IAM Service Account Posture Scanner',
    badge: '2026 LAB · TAB 4',
    badgeColor: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
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
    title: '⚡ Cold-Start & P95 Latency Stress Arena + HTTP Header X-Ray',
    badge: '2026 LAB · TAB 5',
    badgeColor: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
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
    title: '🧟 Zombie Resource Hunter with Real-Time GCP Operation Progress Bar',
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
    title: '🌍 1-Tap Cross-Region Cloud Run Teleporter, Carbon CFE% & Visual Diff',
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
      '🗺️ Global Cloud Map · All 40 Official Regions, 121 Zones, Tactical Spotlight & Chaos Failover',
    badge: 'GLOBAL MAP 🌍 TAB',
    badgeColor: 'bg-cyan-500/15 text-cyan-500 border-cyan-500/30',
    icon: Globe,
    targetTab: 'GLOBAL_MAP',
    problemSolved:
      'Standard cloud consoles list regions and firewall rules as static text tables, making it impossible to see all 40 Google Cloud regions and 121 zones geographically, test regional/zonal failover, measure subsea fiber RTT latency, or inspect live packet filtering without UI lag or overlapping badges when zoomed in.',
    howItWorks: [
      '🌍 All 40 Official GCP Regions & 121 Orbiting Availability Zones: Complete geographic catalog across North America (11), South America (2), Europe (12), Middle East (3), Africa (1), Asia (9), and Oceania (2) with interactive continent presets and full directory matrix.',
      '🎯 Tactical Spotlight Focus & Inverse-Zoom Scaling: When zoomed in (up to 6.0x with cursor-locked wheel zoom and WASD/Arrow panning that never scrolls the outer web page), only the selected/hovered region expands its orbiting Availability Zone satellite ring (-a/-b/-c/-f) with intra-region fiber spokes, while unselected neighbors fade into 18% opacity Ghost Mode so labels never collide.',
      '💥 Chaos Outage & Automatic Traffic Failover Simulator: Sever any region or individual Availability Zone in 1 click to watch live packets automatically reroute (⇄FAILOVER) to healthy backup zones or peer regions.',
      '📏 Point-to-Point Subsea Fiber RTT Laser, Multi-Lens Switcher (Traffic / Carbon CFE% / Spot Price), DVR Time-Machine Scrubber (20 snapshots), Performance Cadence Guardrails (100ms–1000ms), and 🛰️ Coordinate-Locked Drop-Pod Provisioning.',
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
    title: '🔥 Enterprise VPC Firewall Command Center (ALLOW/DENY, INGRESS/EGRESS & Packet Tester)',
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
    title: '🚨 DEFCON-1 Project Billing Kill-Switch & API Circuit Breaker',
    badge: 'LIVE GCP RESOURCES TAB',
    badgeColor: 'bg-rose-500/15 text-rose-500 border-rose-500/30',
    icon: PowerOff,
    targetTab: 'RESOURCES',
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
      <div className="bg-gradient-to-r from-slate-950 via-blue-950/90 to-violet-950/90 border border-blue-500/30 rounded-2xl p-6 text-white shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-mono font-bold text-blue-300">
              <BookOpen className="w-3.5 h-3.5" />
              <span>INTERACTIVE ENGINEERING MANUAL & ARCHITECTURE GUIDE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              How CloudPulse 2026 Works Under the Hood
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Every revolutionary feature in CloudPulse 2026 talks directly to
              official Google Cloud REST APIs using your authenticated session.
              Read below to understand what each tool does, which GCP APIs it
              calls, its billing impact, and click{' '}
              <strong className="text-cyan-300">"Launch Feature →"</strong> to
              jump straight to it.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-400 text-white font-mono font-bold text-xs px-4 py-3 rounded-xl shadow-lg transition-colors shrink-0 cursor-pointer"
          >
            <Command className="w-4 h-4" />
            <span>Press ⌘K for Voice & Natural Language Ops</span>
          </button>
        </div>

        {/* Search & Wave Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation (e.g. 'hibernate', 'terraform', 'zombie', 'teleport', 'billing', 'gpu')..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="md:col-span-6 flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'ALL', label: `All Innovations (${DOC_SECTIONS.length})` },
              { id: 'WAVE 5', label: '🔮 Wave 5 Cloud Brain & SKU' },
              { id: 'WAVE 4', label: '🌍 Wave 4 Global Map (40 Regions)' },
              { id: 'WAVE 3', label: '🛰️ Wave 3 Orbital HUD' },
              { id: 'WAVE 2', label: '🧪 Wave 2 Wishlist' },
              { id: 'WAVE 1', label: '✦ Wave 1 FinOps & IaC' },
              { id: 'EMERGENCY', label: '🚨 Kill-Switches' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedWave(f.id)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  selectedWave === f.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
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
              className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4"
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
                    <Icon className="w-4 h-4 text-blue-500 shrink-0" />
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
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Right Column: Under-the-Hood REST APIs & Billing/Safety Impact */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Under-the-Hood GCP REST APIs Called</span>
                    </div>
                    <div className="space-y-1">
                      {doc.apisUsed.map((api, i) => (
                        <div
                          key={i}
                          className="text-[11px] font-mono text-zinc-300 break-all"
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
