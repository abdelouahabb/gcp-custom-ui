import React, { useState, useMemo } from 'react';
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
  {
    id: 'NORMAL',
    label: 'Steady-State Baseline (1.0x)',
    description:
      'Current project resource footprint running at normal daily traffic and autoscaling levels.',
    hourlyAdderUsd: 0,
    multiplier: 1.0,
    spikeStartDay: 1,
    mitigationCmd: '# Steady state — no emergency mitigation required.',
  },
  {
    id: 'VIRAL_TRAFFIC',
    label: 'Viral HackerNews / ProductHunt Surge (35x HTTP)',
    description:
      'Sudden 35x traffic spike starting on Day 5: Cloud Run scales to maxInstances and egress bandwidth jumps by 1.8 TB.',
    hourlyAdderUsd: 0.42,
    multiplier: 2.8,
    spikeStartDay: 5,
    mitigationCmd:
      'gcloud run services update SERVICE_NAME --max-instances=15 --concurrency=120 --cpu-throttling',
  },
  {
    id: 'INFINITE_LOOP',
    label: 'Runaway Infinite Retry Loop / Webhook Storm (120x)',
    description:
      'A misconfigured webhook or pub/sub retry loop pins all serverless instances at 100% vCPU 24/7 starting on Day 4.',
    hourlyAdderUsd: 1.35,
    multiplier: 5.5,
    spikeStartDay: 4,
    mitigationCmd:
      'gcloud run services update SERVICE_NAME --max-instances=2 && gcloud compute firewall-rules create block-runaway-webhook --action=DENY --rules=tcp:443 --priority=90',
  },
  {
    id: 'GPU_LLM_SURGE',
    label: 'Unthrottled LLM GPU Inference Surge (4x NVIDIA L4 24/7)',
    description:
      'Four warm Cloud Run NVIDIA L4 GPU instances remain pinned with min-instances=4 and instance-based billing starting Day 3.',
    hourlyAdderUsd: 2.68,
    multiplier: 4.2,
    spikeStartDay: 3,
    mitigationCmd:
      'gcloud run services update GPU_SERVICE --min-instances=0 --max-instances=2 --cpu-throttling',
  },
  {
    id: 'DDOS_EGRESS',
    label: 'Cross-Continent Egress Scraping / DDoS Flood (8 TB)',
    description:
      'Automated botnet scrapes large objects from Cloud Storage & Cloud Run across continents (8 TB @ $0.08/GB).',
    hourlyAdderUsd: 0.95,
    multiplier: 3.4,
    spikeStartDay: 6,
    mitigationCmd:
      'gcloud compute firewall-rules create emergency-ddos-shield --action=DENY --direction=INGRESS --rules=tcp:80,tcp:443 --source-ranges=0.0.0.0/0 --priority=80',
  },
];

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
  onShowToast,
}) {
  const { version: pricingVersion, unitPricing } = useLivePricingCatalog();

  // ==========================================================================
  // 1. PRE-CRIME 30-DAY BILLING & QUOTA TIME-CRYSTAL STATE
  // ==========================================================================
  const [monthlyBudgetCap, setMonthlyBudgetCap] = useState(150);
  const [scenarioId, setScenarioId] = useState('VIRAL_TRAFFIC');
  const [autoBreakerArmed, setAutoBreakerArmed] = useState(true);
  const [copiedCmd, setCopiedCmd] = useState(null);

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
    const surgeDaily =
      (baseHourly * activeScenario.multiplier +
        activeScenario.hourlyAdderUsd * scenarioRateFactor * cudFactor) *
      24;

    const days = [];
    let cumBaseline = 0;
    let cumProjected = 0;
    let breachDay = null;
    let breachHour = null;

    for (let d = 1; d <= 30; d += 1) {
      cumBaseline += baseDaily;
      const dailyRate =
        d >= activeScenario.spikeStartDay ? surgeDaily : baseDaily;
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
      });
    }

    const unguardedMonthEnd =
      baseDaily * (activeScenario.spikeStartDay - 1) +
      surgeDaily * (30 - activeScenario.spikeStartDay + 1);

    return {
      baseDaily: Number(baseDaily.toFixed(2)),
      surgeDaily: Number(surgeDaily.toFixed(2)),
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
      {/* MODULE 1: PRE-CRIME 30-DAY BILLING & QUOTA TIME-CRYSTAL SIMULATOR    */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/[0.08] via-fuchsia-500/[0.05] to-cyan-500/[0.08] border border-violet-500/30 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-violet-500/20 text-violet-600 dark:text-violet-300 border border-violet-500/40">
                WAVE 5 DREAM FEATURE #1
              </span>
              <h4 className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                <span>
                  &ldquo;Pre-Crime&rdquo; 30-Day Billing Time-Crystal &
                  Autonomous Circuit-Breaker
                </span>
              </h4>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Simulate traffic surges, infinite retry loops, or GPU billing
              spikes before they happen — see the exact day & hour your budget
              cap would breach and arm an automatic $0-Idle Circuit-Breaker.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setAutoBreakerArmed((p) => !p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                autoBreakerArmed
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {autoBreakerArmed
                  ? 'Auto-Circuit-Breaker: ARMED'
                  : 'Auto-Circuit-Breaker: OFF'}
              </span>
            </button>

            {onHibernateSleep && (
              <button
                type="button"
                onClick={onHibernateSleep}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-extrabold cursor-pointer flex items-center gap-1.5"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Trigger Emergency $0 Park Now</span>
              </button>
            )}
          </div>
        </div>

        {/* Scenario Selector & Monthly Budget Cap Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-xs font-mono">
          <div className="lg:col-span-7 space-y-1.5">
            <label className="block text-[10px] uppercase text-zinc-400 font-bold">
              Inject What-If Traffic / Attack / Billing Anomaly Scenario:
            </label>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100"
            >
              {ANOMALY_SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500">
              {activeScenario.description}
            </p>
          </div>

          <div className="lg:col-span-5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-zinc-400 font-bold">
                Monthly Hard Budget Cap:
              </span>
              <span className="text-sm font-extrabold text-rose-500">
                ${monthlyBudgetCap} USD / month
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={1000}
              step={10}
              value={monthlyBudgetCap}
              onChange={(e) => setMonthlyBudgetCap(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>$20 (Hobby)</span>
              <span>$150 (Startup)</span>
              <span>$500 (Growth)</span>
              <span>$1,000</span>
            </div>
          </div>
        </div>

        {/* 4 KPI Cards + 30-Day Interactive SVG Burn Curve */}
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
            <div className="text-[10px] text-zinc-400 uppercase">
              Unguarded Anomaly Bill
            </div>
            <div className="text-base font-extrabold text-rose-500 mt-0.5">
              ${timeCrystalForecast.unguardedMonthEnd.toFixed(2)}
            </div>
            <div className="text-[10px] text-rose-400">
              ${timeCrystalForecast.surgeDaily}/day during surge
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
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
            <span>
              30-Day Cumulative Spend Trajectory (Day 1 → Day 30)
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Baseline (${timeCrystalForecast.baselineMonthEnd})
              </span>
              <span className="flex items-center gap-1.5 text-violet-400">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block" />
                Projected w/ {autoBreakerArmed ? 'Circuit-Breaker' : 'Surge'} ($
                {timeCrystalForecast.projectedMonthEnd})
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-0.5 bg-rose-500 inline-block" />
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
                    stroke="#f43f5e"
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
                        ? '#f43f5e'
                        : pt.projected >= monthlyBudgetCap
                        ? '#10b981'
                        : '#8b5cf6'
                    }
                    strokeOpacity="0.28"
                    strokeWidth="6"
                  />
                  <circle cx={x} cy={baseY} r={2.2} fill="#22d3ee" />
                  <circle
                    cx={x}
                    cy={projY}
                    r={isBreachDay ? 5 : 3}
                    fill={
                      isBreachDay
                        ? '#f43f5e'
                        : pt.projected >= monthlyBudgetCap && autoBreakerArmed
                        ? '#10b981'
                        : '#c084fc'
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
          <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
            <div className="text-zinc-300 truncate max-w-2xl">
              <span className="text-violet-400 font-bold">
                Auto-Mitigation CLI:{' '}
              </span>
              <code className="text-emerald-300">
                {activeScenario.mitigationCmd}
              </code>
            </div>
            <button
              type="button"
              onClick={() =>
                handleCopy(activeScenario.mitigationCmd, 'MITIGATION')
              }
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold cursor-pointer flex items-center gap-1"
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
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40">
                WAVE 5 DREAM FEATURE #2
              </span>
              <h4 className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                &ldquo;What-If&rdquo; Resource Blast-Radius & Failure Cascade
                X-Ray
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
                  className={`w-full p-2.5 rounded-xl border text-left font-mono text-xs transition-all cursor-pointer flex items-center justify-between gap-2 ${
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
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
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
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-500 font-extrabold text-xs">
                  Blast Severity: {blastCascade.impactScore}/100
                </span>
              </div>

              <p className="text-zinc-600 dark:text-zinc-300">
                {blastCascade.headline}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-cyan-500">
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

                <div className="p-2.5 rounded-lg bg-rose-500/[0.06] border border-rose-500/25 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-rose-500">
                    ⬇Downstream Failure Cascade
                  </div>
                  {blastCascade.downstream.map((d) => (
                    <div
                      key={d}
                      className="text-[11px] text-rose-700 dark:text-rose-200"
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
                  className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-[10px] font-bold cursor-pointer flex items-center gap-1"
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
      {/* MODULE 3: NATURAL-LANGUAGE DREAM STACK ARCHITECTURE COMPILER         */}
      {/* ==================================================================== */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/[0.07] via-cyan-500/[0.05] to-blue-500/[0.07] border border-emerald-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40">
                WAVE 5 DREAM FEATURE #3
              </span>
              <h4 className="text-sm font-extrabold font-mono text-zinc-950 dark:text-zinc-50">
                Autonomous Cloud Architecture Compiler (SKU + FinOps + Carbon
                Optimized)
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
                className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
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
                    <span className="text-[10px] text-cyan-500">
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
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1"
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
            <pre className="flex-1 p-3 rounded-xl bg-zinc-950 text-emerald-300 border border-zinc-800 text-[11px] font-mono overflow-x-auto max-h-64">
              {compiledBlueprint.script}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
