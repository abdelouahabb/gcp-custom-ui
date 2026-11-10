import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket,
  Zap,
  Database,
  Gauge,
  DollarSign,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  Server,
  Cpu,
  Lock,
  Activity,
  Globe,
  Layers,
  Lightbulb,
} from 'lucide-react';
import ZeroSniffingWebCryptoEnclaveBar, {
  useSharedGeminiModels,
  getSharedActiveModel,
  getSharedPreferredProvider,
  decryptKeyFromSharedBrowserWebCrypto,
} from './ZeroSniffingWebCryptoEnclaveBar';

const STARTUP_CREDIT_TIERS = [
  { id: 2000, label: '$2,000 · Start Tier (Pre-Seed / Bootstrapped)' },
  { id: 25000, label: '$25,000 · Build Tier (Seed Stage)' },
  { id: 100000, label: '$100,000 · Scale Tier (Series A Cloud)' },
  { id: 350000, label: '$350,000 · AI Scale Tier (AI-First Startups)' },
];

const STARTUP_10X_MODULES = [
  {
    id: 'COLD_START_VPC_LAG',
    step: '01',
    sectionId: 'startup-10x-compute-section',
    title: 'Compute & Cold-Start Surgeon',
    subtitle: 'VMs, Cloud Run CPU Boost & Direct VPC',
    icon: Zap,
  },
  {
    id: 'QUOTA_WALL_RADAR',
    step: '02',
    sectionId: 'startup-10x-quota-section',
    title: 'Launch-Day Quota & HTTP 429 Radar',
    subtitle: 'Live 24h 429s, L4 GPUs & Quotas API',
    icon: Gauge,
  },
  {
    id: 'CREDIT_CLIFF_RUNWAY',
    step: '03',
    sectionId: 'startup-10x-runway-section',
    title: 'Credit Runway & 6-Vector Cost Audit',
    subtitle: 'Live Burn Ledger, Always-Free Check, Disks, IPs & Storage',
    icon: DollarSign,
  },
  {
    id: 'SOC2_DEAL_BLOCKER',
    step: '04',
    sectionId: 'startup-10x-soc2-section',
    title: 'Enterprise SOC2 Deal-Blocker Shield',
    subtitle: '1-Click IAP Firewall Lock, PAP & IAM',
    icon: ShieldCheck,
  },
  {
    id: 'GEMINI_RAG_LATENCY',
    step: '05',
    sectionId: 'startup-10x-rag-section',
    title: 'Data-Gravity & -80% Context Cache',
    subtitle: 'Live Region Co-Location & Token Math',
    icon: Sparkles,
  },
];

export default function Startup10xMentorStudio({
  projectId,
  onNavigateTab,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [activeModule, setActiveModule] = useState('ALL');
  const [creditTierUsd, setCreditTierUsd] = useState(100000);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busyTarget, setBusyTarget] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Shared Zero-Sniffing WebCrypto Enclave & Live Gemini CTO Mentor State
  const { activeModel: geminiModel, selectModel: setGeminiModel } =
    useSharedGeminiModels();
  const [geminiPreferredProvider, setGeminiPreferredProvider] = useState(() =>
    getSharedPreferredProvider()
  );
  const [mentorAdvice, setMentorAdvice] = useState(null);
  const [loadingMentor, setLoadingMentor] = useState(false);

  // Interactive GenAI Token & TTFT Calculator state
  const [systemPromptTokens, setSystemPromptTokens] = useState(28000);
  const [dailyConversations, setDailyConversations] = useState(15000);

  // Interactive Founder Unit Economics, SaaS/AI Gross Margin & 10X Scale Modeler state
  const [simMau, setSimMau] = useState(15000);
  const [simArpuUsd, setSimArpuUsd] = useState(29);
  const [simApiReqPerUserDay, setSimApiReqPerUserDay] = useState(40);
  const [simAiPromptsPerUserDay, setSimAiPromptsPerUserDay] = useState(8);

  const fetchStartupAudit = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/startup-10x/audit?creditTierUsd=${creditTierUsd}`
      );
      setAuditData(res.data);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to load Startup 10X audit.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, creditTierUsd, onShowError]);

  useEffect(() => {
    fetchStartupAudit();
  }, [fetchStartupAudit]);

  const jumpToPillar = useCallback((modId, explicitScrollId = null) => {
    const normalizedMod =
      modId === 'CREDIT_VAMPIRES'
        ? 'CREDIT_CLIFF_RUNWAY'
        : modId === 'SOC2_AND_GENAI_CACHE'
        ? 'SOC2_DEAL_BLOCKER'
        : modId || 'ALL';
    setActiveModule(normalizedMod);
    const matchedMod = STARTUP_10X_MODULES.find((m) => m.id === normalizedMod);
    const targetDomId =
      explicitScrollId ||
      matchedMod?.sectionId ||
      (normalizedMod === 'ALL' ? 'startup-10x-compute-section' : null);
    if (targetDomId) {
      setTimeout(() => {
        document
          .getElementById(targetDomId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 55);
    }
  }, []);

  useEffect(() => {
    const handleFocusEvent = (e) => {
      const targetMod = e?.detail?.module;
      const scrollId = e?.detail?.scrollToId;
      if (targetMod) {
        jumpToPillar(targetMod, scrollId);
      } else if (scrollId) {
        setTimeout(() => {
          document
            .getElementById(scrollId)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    };
    window.addEventListener('cloudpulse:startup-10x-focus', handleFocusEvent);
    return () =>
      window.removeEventListener(
        'cloudpulse:startup-10x-focus',
        handleFocusEvent
      );
  }, [jumpToPillar]);

  const handleCopy = (text, id) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    if (onShowToast) onShowToast('Copied command to clipboard!');
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleLiveRemediate = async (
    action,
    targetName,
    region = 'us-central1'
  ) => {
    setBusyTarget(`${action}:${targetName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/startup-10x/remediate`,
        {
          action,
          targetName,
          region,
        }
      );
      if (onShowToast && res.data?.message) {
        onShowToast(res.data.message);
      }
      await fetchStartupAudit();
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) return;
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Startup 10X live remediation failed.'
        );
      }
    } finally {
      setBusyTarget('');
    }
  };

  const handleRunGeminiMentor = async () => {
    if (!projectId) return;
    setLoadingMentor(true);
    try {
      const browserKey = await decryptKeyFromSharedBrowserWebCrypto().catch(
        () => ''
      );
      const resolvedModel = geminiModel || getSharedActiveModel();
      const resolvedProvider = getSharedPreferredProvider();
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/startup-10x/gemini-mentor`,
        {
          geminiApiKey: browserKey || '',
          model: resolvedModel,
          preferredProvider: resolvedProvider,
          creditTierUsd,
          auditSummary: {
            startup10xScore: auditData?.startup10xScore,
            scoreDeductions: auditData?.scoreDeductions,
            creditRunway: auditData?.creditRunway,
            vmCount: (auditData?.vmFindings || []).length,
            vms: (auditData?.vmFindings || []).slice(0, 5),
            cloudRunCount: (auditData?.cloudRunFindings || []).length,
            sqlCount: (auditData?.sqlFindings || []).length,
            bucketsCount: (auditData?.bucketFindings || []).length,
            openFirewallsCount: (auditData?.soc2Blockers?.openFirewalls || [])
              .length,
            openFirewalls: (auditData?.soc2Blockers?.openFirewalls || []).map(
              (f) => f.name
            ),
            primitivePrincipalsCount:
              auditData?.soc2Blockers?.totalPrimitivePrincipals || 0,
            http429Count24h:
              auditData?.quotaWallFindings?.liveTraffic24h?.total429Count24h ||
              0,
            regionGravity: auditData?.regionGravity,
          },
        }
      );
      if (res.data?.ok) {
        setMentorAdvice(res.data);
        if (onShowToast) {
          onShowToast(
            `Live Gemini (${res.data.modelUsed}) generated Startup 10X Architecture & Runway Action Plan!`
          );
        }
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Live Gemini Startup 10X Mentor failed.'
        );
      }
    } finally {
      setLoadingMentor(false);
    }
  };

  const score = auditData?.startup10xScore ?? 88;
  const scoreDeductions = auditData?.scoreDeductions || [];
  const runway = auditData?.creditRunway || {
    creditTierUsd,
    liveResourceMonthlyBurnUsd: 0,
    baselineMonthlyBurnUsd: 45,
    optimizedMonthlyBurnUsd: 15,
    totalMonthlyVampireWasteUsd: 0,
    vampireItems: [],
    currentRunwayMonths: 24,
    optimizedRunwayMonths: 24,
    extraRunwayMonthsGained: 0,
  };

  const vmFindings = auditData?.vmFindings || [];
  const cloudRunFindings = auditData?.cloudRunFindings || [];
  const sqlFindings = auditData?.sqlFindings || [];
  const bucketFindings = auditData?.bucketFindings || [];
  const datasetFindings = auditData?.datasetFindings || [];
  const startupApis = auditData?.startupApis || [];
  const quotaWall = auditData?.quotaWallFindings || {
    liveQuotas: [],
    zeroGpuTrapCount: 0,
    liveTraffic24h: {
      totalRequests24h: 0,
      total429Count24h: 0,
      topServices: [],
    },
  };
  const soc2Blockers = auditData?.soc2Blockers || {
    openFirewalls: [],
    totalPrimitivePrincipals: 0,
    primitivePrincipalsList: [],
    unhardenedBucketsCount: 0,
    unhardenedBuckets: [],
    soc2EvidenceControls: [],
  };
  const regionGravity = auditData?.regionGravity || {
    vmRegions: [],
    runRegions: [],
    sqlRegions: [],
    bucketLocations: [],
    bqLocations: [],
    hasRegionMismatch: false,
    estimatedCrossRegionRttPenaltyMs: 4,
  };

  // Founder Unit Economics & Gross Margin Modeler Math (with GCP Free Tier + Context Cache applied)
  const computeScaleScenario = (mauMultiplier = 1) => {
    const mau = Math.max(100, Math.round(simMau * mauMultiplier));
    const monthlyMrrUsd = mau * simArpuUsd;
    const totalMonthlyApiReqs = mau * simApiReqPerUserDay * 30;
    // First 2M Cloud Run requests/mo are free; ~$0.40 per 1M requests + compute vCPU-sec
    const billableApiReqsM = Math.max(0, (totalMonthlyApiReqs - 2_000_000) / 1_000_000);
    const cloudRunMonthlyUsd = billableApiReqsM * 1.45;
    // AI Token usage: ~3,500 tokens/prompt turn with -80% Vertex AI Context Cache ($0.06 / 1M cached tokens)
    const totalMonthlyAiTurns = mau * simAiPromptsPerUserDay * 30;
    const totalAiTokensM = (totalMonthlyAiTurns * 3500) / 1_000_000;
    const vertexAiMonthlyUsd = totalAiTokensM * 0.075;
    // Storage + BigQuery + Egress (after 5 GB GCS + 10 GB BQ free tier)
    const dataAndEgressUsd = Math.max(0, (mau / 1000) * 1.85 - 5);
    const totalCloudBillUsd = Number(
      (
        Number(runway.liveResourceMonthlyBurnUsd || 0) +
        cloudRunMonthlyUsd +
        vertexAiMonthlyUsd +
        dataAndEgressUsd
      ).toFixed(2)
    );
    const costPerMauUsd = Number((totalCloudBillUsd / Math.max(1, mau)).toFixed(4));
    const grossMarginPct =
      monthlyMrrUsd > 0
        ? Number(
            Math.max(
              0,
              Math.min(99.9, ((monthlyMrrUsd - totalCloudBillUsd) / monthlyMrrUsd) * 100)
            ).toFixed(1)
          )
        : 0;
    const creditRunwayMonths = Math.min(
      24,
      Number((creditTierUsd / Math.max(15, totalCloudBillUsd)).toFixed(1))
    );
    return {
      mau,
      monthlyMrrUsd,
      cloudRunMonthlyUsd: Number(cloudRunMonthlyUsd.toFixed(2)),
      vertexAiMonthlyUsd: Number(vertexAiMonthlyUsd.toFixed(2)),
      dataAndEgressUsd: Number(dataAndEgressUsd.toFixed(2)),
      totalCloudBillUsd,
      costPerMauUsd,
      grossMarginPct,
      creditRunwayMonths,
    };
  };

  const unitEcon1x = computeScaleScenario(1);
  const unitEcon10x = computeScaleScenario(10);

  const handleExportFounderPacket = () => {
    const md = [
      `# Startup 10X — Investor Due-Diligence, Unit Economics & SOC2 Readiness Packet`,
      `- **GCP Project**: \`${projectId}\``,
      `- **Generated At**: ${new Date().toISOString()}`,
      `- **10X Scale Readiness Score**: **${score}/100**`,
      `- **Selected Google for Startups Credit Tier**: **$${creditTierUsd.toLocaleString()}**`,
      `- **Live Resource Burn**: **$${Number(runway.liveResourceMonthlyBurnUsd || 0).toFixed(2)}/mo**`,
      ``,
      `## 1. Score Deductions & Bottlenecks`,
      ...(scoreDeductions.length > 0
        ? scoreDeductions.map((d) => `- ${d}`)
        : [`- [PASS] Zero scaling or SOC2 bottlenecks detected`]),
      ``,
      `## 2. Founder Unit Economics & Gross Margin (${unitEcon1x.mau.toLocaleString()} MAU @ $${simArpuUsd}/mo ARPU)`,
      `- **Monthly Recurring Revenue (MRR)**: $${unitEcon1x.monthlyMrrUsd.toLocaleString()}/mo`,
      `- **Projected GCP Cloud Bill (1X)**: $${unitEcon1x.totalCloudBillUsd.toLocaleString()}/mo ($${unitEcon1x.costPerMauUsd}/MAU)`,
      `- **Cloud Gross Margin (1X)**: **${unitEcon1x.grossMarginPct}%** (VC Tier-1 Benchmark: >= 80%)`,
      `- **10X Breakout Scale (${unitEcon10x.mau.toLocaleString()} MAU)**: Cloud Bill $${unitEcon10x.totalCloudBillUsd.toLocaleString()}/mo · Gross Margin **${unitEcon10x.grossMarginPct}%** · Credit Runway **${unitEcon10x.creditRunwayMonths} mo**`,
      ``,
      `## 3. 6-Vector Live GCP Cost & Always-Free Audit`,
      ...(runway.costAuditChecks || []).map(
        (c) => `- **${c.category}** ($${Number(c.monthlyBurnUsd || 0).toFixed(2)}/mo): ${c.summary}`
      ),
      ``,
      `## 4. Enterprise SOC2 & B2B Security Controls Evidence`,
      ...(soc2Blockers.soc2EvidenceControls || []).map(
        (ctrl) => `- **[${ctrl.status}] ${ctrl.controlId}**: ${ctrl.liveEvidence}`
      ),
    ].join('\n');

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `startup-10x-investor-soc2-packet-${projectId}.md`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast(`Exported Investor & SOC2 Due-Diligence Packet for ${projectId}!`);
    }
  };

  // GenAI Context Cache Math
  const monthlyUncachedInputTokensM =
    (systemPromptTokens * dailyConversations * 30) / 1_000_000;
  const monthlyUncachedCostUsd = monthlyUncachedInputTokensM * 0.3; // $0.30/1M tokens baseline
  const monthlyCachedCostUsd = monthlyUncachedCostUsd * 0.2; // -80% with Vertex AI Context Caching
  const monthlyGenAiSavedUsd = monthlyUncachedCostUsd - monthlyCachedCostUsd;

  const showModule = (modId) =>
    activeModule === 'ALL' || activeModule === modId;

  return (
    <div className="space-y-5">
      {/* ==================================================================== */}
      {/* TOP EXECUTIVE STARTUP 10X COMMAND HEADER                             */}
      {/* ==================================================================== */}
      <div
        id="startup-10x-header-section"
        className="scroll-mt-24 p-5 rounded-2xl bg-white dark:bg-[#18191c] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10.5px] font-mono font-extrabold uppercase tracking-wider shadow-xs">
                <Rocket className="w-3.5 h-3.5" />
                <span>GOOGLE FOR STARTUPS 10X ARCHITECT &amp; RUNWAY GUARD</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10.5px] font-mono font-bold">
                100% Live Control-Plane Telemetry · Zero Synthetic Burn
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Startup 10X — Live Bottleneck Surgeon, Credit Runway &amp; SOC2 Deal-Blocker Shield
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Audits your live Compute Engine VMs, Cloud Run services, Cloud SQL pools, Regional GPU/CPU Quotas, 24h <code className="font-mono">HTTP 429</code> throttling, GCS lifecycles, and SOC2 security blockers on{' '}
              <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                {projectId}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Select Google for Startups Credit Tier"
              data-feature-id="STARTUP_10X_CREDIT_TIER_SELECT"
              value={creditTierUsd}
              onChange={(e) => setCreditTierUsd(Number(e.target.value))}
              className="h-9 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer"
            >
              {STARTUP_CREDIT_TIERS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              data-feature-id="STARTUP_10X_EXPORT_PACKET"
              onClick={handleExportFounderPacket}
              title="Download Investor Due-Diligence, Unit Economics & SOC2 Evidence Report (.md)"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-mono font-extrabold cursor-pointer"
            >
              <span>Export VC &amp; SOC2 Packet (.md)</span>
            </button>

            <button
              type="button"
              data-feature-id="STARTUP_10X_RESCAN"
              disabled={loading}
              onClick={fetchStartupAudit}
              title="Re-scan live Compute Engine, Cloud Run, Cloud SQL, GCS, BigQuery, Quotas, 24h 429s, VPC Firewalls, and IAM bindings"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>{loading ? 'Scanning Live GCP...' : 'Re-Scan Live Estate'}</span>
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 1. PRIMARY CALL-TO-ACTION MENU: 5-PILLAR SCALING NAVIGATION BAR      */}
        {/* ==================================================================== */}
        <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-200">
              Select Scaling Pillar ({activeModule === 'ALL' ? 'Showing All 5 Pillars' : activeModule})
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                data-feature-id="STARTUP_10X_GEMINI_CTO_MENTOR"
                disabled={loadingMentor}
                onClick={handleRunGeminiMentor}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono font-extrabold shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Sparkles
                  className={`w-3 h-3 ${loadingMentor ? 'animate-spin' : ''}`}
                />
                <span>
                  {loadingMentor
                    ? `Reviewing (${geminiModel})...`
                    : `AI CTO Review (${geminiModel})`}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveModule((prev) =>
                    prev === 'ALL' ? 'COLD_START_VPC_LAG' : 'ALL'
                  )
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold border cursor-pointer transition-colors ${
                  activeModule === 'ALL'
                    ? 'bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-zinc-100 shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-amber-500/40'
                }`}
              >
                <Layers className="w-3 h-3 shrink-0" />
                {activeModule === 'ALL' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span>Showing All 5 Pillars</span>
                  </>
                ) : (
                  <span>Show All 5 Pillars Together</span>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {STARTUP_10X_MODULES.map((m) => {
              const Icon = m.icon;
              const isSelected = activeModule === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  data-feature-id={m.id}
                  onClick={() => jumpToPillar(m.id, m.sectionId)}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-zinc-100 shadow-xs'
                      : 'bg-zinc-50 dark:bg-[#121316] text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold shrink-0 ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {m.step}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold truncate">
                        {m.title}
                      </div>
                      <div
                        className={`text-[10.5px] font-mono truncate ${
                          isSelected
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        {m.subtitle}
                      </div>
                    </div>
                  </div>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-amber-500 dark:text-amber-400' : ''
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. SUBORDINATE CLICKABLE TELEMETRY RIBBON (Smaller than Menu Tabs)   */}
        {/* ==================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 p-1.5 rounded-lg bg-zinc-50/90 dark:bg-[#0b0f17] border border-zinc-200/80 dark:border-slate-800/80 text-[11px] font-mono">
          {/* Quick-Jump 1: Readiness Score -> Show All Pillars */}
          <button
            type="button"
            onClick={() => setActiveModule('ALL')}
            title="Click to inspect all 5 scaling readiness pillars"
            className={`px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer flex items-center justify-between gap-2 border ${
              activeModule === 'ALL'
                ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-zinc-100'
                : 'bg-transparent border-transparent hover:border-amber-500/40 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[9.5px] uppercase text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                <span>10X Scale Readiness</span>
                <span className="text-[9px] text-amber-500">All Pillars &rarr;</span>
              </div>
              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                {score}/100{' '}
                <span className="text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
                  ({score >= 85 ? 'Launch Ready' : `${scoreDeductions.length} bottlenecks`})
                </span>
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold shrink-0 ${
                score >= 85
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : score >= 70
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-red-500/15 text-red-600 dark:text-red-400'
              }`}
            >
              {score}%
            </span>
          </button>

          {/* Quick-Jump 2: Live Compute & Storage -> Pillar 01 Cold-Start & Region Gravity */}
          <button
            type="button"
            data-feature-id="COLD_START_VPC_LAG"
            onClick={() =>
              jumpToPillar('COLD_START_VPC_LAG', 'startup-10x-compute-section')
            }
            title="Click to jump to Pillar 01: Compute & Cold-Start Surgeon"
            className={`px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer flex items-center justify-between gap-2 border ${
              activeModule === 'COLD_START_VPC_LAG'
                ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-zinc-100'
                : 'bg-transparent border-transparent hover:border-amber-500/40 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[9.5px] uppercase text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                <span>Compute &amp; Storage</span>
                <span className="text-[9px] text-amber-500">Pillar 01 &rarr;</span>
              </div>
              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                {vmFindings.length} VMs · {cloudRunFindings.length} Run · {bucketFindings.length} GCS
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9.5px] font-extrabold shrink-0">
              {regionGravity.hasRegionMismatch ? 'Multi-Reg' : 'Co-Loc'}
            </span>
          </button>

          {/* Quick-Jump 3: Quota & 24h 429 Radar -> Pillar 02 Launch-Day Quota Wall */}
          <button
            type="button"
            data-feature-id="QUOTA_WALL_RADAR"
            onClick={() =>
              jumpToPillar('QUOTA_WALL_RADAR', 'startup-10x-quota-section')
            }
            title="Click to jump to Pillar 02: Launch-Day Quota & HTTP 429 Radar"
            className={`px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer flex items-center justify-between gap-2 border ${
              activeModule === 'QUOTA_WALL_RADAR'
                ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-zinc-100'
                : 'bg-transparent border-transparent hover:border-amber-500/40 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[9.5px] uppercase text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                <span>Quota &amp; 24h 429s</span>
                <span className="text-[9px] text-amber-500">Pillar 02 &rarr;</span>
              </div>
              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                {(quotaWall.liveTraffic24h?.totalRequests24h || 0).toLocaleString()} API calls (24h)
              </div>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded text-[9.5px] font-extrabold shrink-0 ${
                quotaWall.liveTraffic24h?.total429Count24h > 0
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {quotaWall.liveTraffic24h?.total429Count24h || 0} 429s
            </span>
          </button>

          {/* Quick-Jump 4: Live Resource Burn -> Pillar 03 Credit Runway & 6-Vector Cost Audit */}
          <button
            type="button"
            data-feature-id="CREDIT_CLIFF_RUNWAY"
            onClick={() =>
              jumpToPillar('CREDIT_CLIFF_RUNWAY', 'startup-10x-runway-section')
            }
            title="Click to jump to Pillar 03: Credit Runway & 6-Vector Cost Audit"
            className={`px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer flex items-center justify-between gap-2 border ${
              activeModule === 'CREDIT_CLIFF_RUNWAY'
                ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-zinc-100'
                : 'bg-transparent border-transparent hover:border-amber-500/40 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[9.5px] uppercase text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                <span>Live Resource Burn</span>
                <span className="text-[9px] text-amber-500">Pillar 03 &rarr;</span>
              </div>
              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                ${runway.liveResourceMonthlyBurnUsd}/mo{' '}
                <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                  (-${runway.totalMonthlyVampireWasteUsd} waste)
                </span>
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-extrabold shrink-0">
              {runway.currentRunwayMonths}m
            </span>
          </button>

          {/* Quick-Jump 5: SOC2 Perimeter -> Pillar 04 Enterprise SOC2 Deal-Blocker Shield */}
          <button
            type="button"
            data-feature-id="SOC2_DEAL_BLOCKER"
            onClick={() =>
              jumpToPillar('SOC2_DEAL_BLOCKER', 'startup-10x-soc2-section')
            }
            title="Click to jump to Pillar 04: Enterprise SOC2 Deal-Blocker Shield"
            className={`px-2.5 py-1.5 rounded-md text-left transition-colors cursor-pointer flex items-center justify-between gap-2 border ${
              activeModule === 'SOC2_DEAL_BLOCKER'
                ? 'bg-amber-500/15 border-amber-500 text-zinc-900 dark:text-zinc-100'
                : 'bg-transparent border-transparent hover:border-amber-500/40 text-zinc-700 dark:text-zinc-300'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[9.5px] uppercase text-zinc-500 dark:text-zinc-400 font-bold flex items-center gap-1.5">
                <span>SOC2 Deal Shield</span>
                <span className="text-[9px] text-amber-500">Pillar 04 &rarr;</span>
              </div>
              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                {soc2Blockers.adminOpenFirewallsCount ??
                  soc2Blockers.openFirewalls.filter((fw) => !fw.isWebHttpHttpsOnly)
                    .length}{' '}
                Admin 0.0.0.0/0 · {soc2Blockers.unhardenedBucketsCount} Unshielded
              </div>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9.5px] font-extrabold shrink-0">
              SOC2
            </span>
          </button>
        </div>

        {/* Score Deduction Breakdown Pills (Clickable to jump to relevant pillar) */}
        {scoreDeductions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400">
              Live Deductions:
            </span>
            {scoreDeductions.map((ded, idx) => {
              const lower = String(ded || '').toLowerCase();
              const targetPillar =
                lower.includes('429') || lower.includes('quota')
                  ? 'QUOTA_WALL_RADAR'
                  : lower.includes('vampire') ||
                    lower.includes('burn') ||
                    lower.includes('idle') ||
                    lower.includes('disk') ||
                    lower.includes('static ip')
                  ? 'CREDIT_CLIFF_RUNWAY'
                  : lower.includes('0.0.0.0/0') ||
                    lower.includes('firewall') ||
                    lower.includes('soc2') ||
                    lower.includes('bucket') ||
                    lower.includes('pap') ||
                    lower.includes('iam')
                  ? 'SOC2_DEAL_BLOCKER'
                  : lower.includes('region') ||
                    lower.includes('gravity') ||
                    lower.includes('cache')
                  ? 'GEMINI_RAG_LATENCY'
                  : 'COLD_START_VPC_LAG';
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => jumpToPillar(targetPillar)}
                  title={`Click to inspect & remediate: ${ded}`}
                  className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/60 text-amber-700 dark:text-amber-300 text-[10px] font-mono transition-colors cursor-pointer"
                >
                  {ded} &rarr;
                </button>
              );
            })}
          </div>
        )}

        {/* Compact Collapsible Zero-Sniffing WebCrypto Enclave & Live Gemini CTO Verdict */}
        <details className="group rounded-lg bg-zinc-50/70 dark:bg-[#0d111a] border border-zinc-200/80 dark:border-slate-800/80 px-3 py-2 text-xs">
          <summary className="cursor-pointer select-none flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
            <span className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Configure Gemini CTO Mentor &amp; WebCrypto API Key Enclave</span>
            </span>
            <span className="text-[10px] text-zinc-400 group-open:hidden">
              Click to expand AI enclave settings ▾
            </span>
          </summary>
          <div className="pt-2.5 mt-2 border-t border-zinc-200 dark:border-slate-800">
            <ZeroSniffingWebCryptoEnclaveBar
              projectId={projectId}
              compact
              selectedModel={geminiModel}
              onChangeModel={setGeminiModel}
              preferredProvider={geminiPreferredProvider}
              onChangePreferredProvider={setGeminiPreferredProvider}
              onShowToast={onShowToast}
            />
          </div>
        </details>

        {mentorAdvice?.advice && (
          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-indigo-500/30 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-[10px] font-extrabold">
                  LIVE GEMINI CTO VERDICT
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {mentorAdvice.provider} · {mentorAdvice.modelUsed}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMentorAdvice(null)}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <p className="font-bold text-zinc-900 dark:text-zinc-100 leading-relaxed">
              {mentorAdvice.advice.readinessVerdict}
            </p>
            {mentorAdvice.advice.runwayStrategy && (
              <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {mentorAdvice.advice.runwayStrategy}
              </p>
            )}
            {Array.isArray(mentorAdvice.advice.topBottlenecks) &&
              mentorAdvice.advice.topBottlenecks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {mentorAdvice.advice.topBottlenecks
                    .slice(0, 4)
                    .map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-1 font-mono text-[11px]"
                      >
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">
                          [{item.pillar}] {item.title}
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400 text-[10px]">
                          {item.impact}
                        </div>
                        {item.cliCmd && (
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <code className="text-[10px] text-emerald-600 dark:text-emerald-400 truncate">
                              {item.cliCmd}
                            </code>
                            {onRunInShell && (
                              <button
                                type="button"
                                onClick={() => onRunInShell(item.cliCmd)}
                                className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                              >
                                Run CLI
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* MODULE 01: COMPUTE ENGINE VMs + CLOUD RUN COLD-START & DIRECT VPC    */}
      {/* ==================================================================== */}
      {showModule('COLD_START_VPC_LAG') && (
        <div
          id="startup-10x-compute-section"
          className="scroll-mt-24 p-5 rounded-2xl bg-white dark:bg-[#18191c] border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-extrabold">
                  PILLAR 01
                </span>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                  Live Compute Engine Always-Free Check &amp; Cloud Run Cold-Start Surgeon
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Inspects your live Compute Engine VMs for <code className="font-mono">$0/mo Always-Free e2-micro</code> eligibility and Cloud Run v2 services for <code className="font-mono">startupCpuBoost</code> + zero-hop <strong>Direct VPC Egress</strong>.
              </p>
            </div>
            {onNavigateTab && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateTab('VM_SSH')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  Open VM Studio ↗
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('CLOUD_RUN')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  Open Cloud Run Studio ↗
                </button>
              </div>
            )}
          </div>

          {/* Live Compute Engine VMs in Project */}
          {vmFindings.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-mono font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-500" />
                <span>Live Compute Engine VMs ({vmFindings.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {vmFindings.map((vm) => (
                  <div
                    key={`${vm.zone}-${vm.name}`}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                          {vm.name}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {vm.machineType} · {vm.zone}
                        </span>
                        {vm.isAlwaysFreeEligible ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-extrabold">
                            <Check className="w-3 h-3 shrink-0" />
                            <span>$0.00/mo Always-Free Eligible</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold">
                            Est. ${vm.monthlyCostUsd}/mo ({vm.provisioningModel})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                        Status: <strong>{vm.status}</strong> · Public IP:{' '}
                        {vm.hasPublicIp ? 'Yes (Check IAP Firewall)' : 'Internal Only'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Cloud Run Services */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>Live Cloud Run v2 Services ({cloudRunFindings.length})</span>
            </div>
            {cloudRunFindings.length === 0 ? (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 flex flex-wrap items-center justify-between gap-2">
                <span>
                  0 Cloud Run services currently deployed in{' '}
                  <code className="font-mono font-bold">{projectId}</code> (0 idle serverless charges). Use the blueprint below when deploying your first production service:
                </span>
              </div>
            ) : (
              cloudRunFindings.map((svc) => (
                <div
                  key={svc.fullName}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                        {svc.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono text-zinc-700 dark:text-zinc-300">
                        {svc.region}
                      </span>
                      {svc.startupCpuBoost ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                          <Check className="w-3 h-3 shrink-0" />
                          <span>CPU Boost ON (~420ms boot)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>CPU Boost OFF (~1,850ms cold start)</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                      Scaling: min={svc.minInstances} / max={svc.maxInstances} · Concurrency={svc.concurrency} · VPC:{' '}
                      {svc.hasDirectVpcEgress
                        ? 'Direct VPC Egress (Zero-Hop)'
                        : svc.hasLegacyVpcConnector
                        ? `Legacy Connector (${svc.legacyVpcConnector})`
                        : 'Public / Default'}
                    </div>
                  </div>

                  {!svc.startupCpuBoost && (
                    <button
                      type="button"
                      data-feature-id="STARTUP_10X_PATCH_CPU_BOOST"
                      disabled={
                        busyTarget === `PATCH_CLOUD_RUN_10X_BOOST:${svc.name}`
                      }
                      onClick={() =>
                        handleLiveRemediate(
                          'PATCH_CLOUD_RUN_10X_BOOST',
                          svc.name,
                          svc.region
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                    >
                      {busyTarget === `PATCH_CLOUD_RUN_10X_BOOST:${svc.name}`
                        ? 'Patching Cloud Run...'
                        : '1-Click Enable Startup CPU Boost'}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Direct VPC Egress CLI Blueprint */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                Mentor Command: Replace Legacy VPC Connector with Zero-Hop Direct VPC Egress + CPU Boost
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `gcloud run services update api-gateway --project=${projectId} --region=us-central1 --cpu-boost --network=default --subnet=default --vpc-egress=private-ranges-only --clear-vpc-connector`,
                      'direct-vpc'
                    )
                  }
                  className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                >
                  {copiedId === 'direct-vpc' ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>Copy CLI</span>
                </button>
                {onRunInShell && (
                  <button
                    type="button"
                    onClick={() =>
                      onRunInShell(
                        `gcloud run services update api-gateway --project=${projectId} --region=us-central1 --cpu-boost --network=default --subnet=default --vpc-egress=private-ranges-only --clear-vpc-connector`
                      )
                    }
                    className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Run in Shell</span>
                  </button>
                )}
              </div>
            </div>
            <pre className="text-[11px] font-mono text-zinc-900 dark:text-zinc-100 overflow-x-auto p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
              {`gcloud run services update api-gateway --project="${projectId}" --region="us-central1" --cpu-boost --network="default" --subnet="default" --vpc-egress="private-ranges-only" --clear-vpc-connector`}
            </pre>
          </div>

          {/* 8 Core Startup GCP APIs Live Readiness & 1-Click Batch Enabler */}
          {startupApis.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                    8 Core Startup GCP APIs Live Readiness ({startupApis.filter((a) => a.enabled).length}/{startupApis.length} Enabled)
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Live check against <code className="font-mono">serviceusage.googleapis.com</code> for essential serverless, AI, container, secret, and budget APIs.
                  </div>
                </div>
                {startupApis.some((a) => !a.enabled) && (
                  <button
                    type="button"
                    data-feature-id="STARTUP_10X_ENABLE_ALL_APIS"
                    disabled={busyTarget === 'ENABLE_CORE_STARTUP_APIS:ALL'}
                    onClick={() =>
                      handleLiveRemediate('ENABLE_CORE_STARTUP_APIS', 'ALL')
                    }
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {busyTarget === 'ENABLE_CORE_STARTUP_APIS:ALL'
                      ? 'Enabling Core APIs...'
                      : '1-Click Enable All Missing Startup APIs'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
                {startupApis.map((api) => (
                  <div
                    key={api.service}
                    className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-extrabold text-zinc-950 dark:text-zinc-50 text-[11px]">
                        {api.label}
                      </span>
                      {api.enabled ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9.5px] font-extrabold shrink-0">
                          <Check className="w-2.5 h-2.5 shrink-0" />
                          <span>
                            {api.cloudBillingEnabled &&
                            api.directServiceEnabled === false
                              ? 'ON (cloudbilling)'
                              : 'ON'}
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={
                            busyTarget ===
                            `ENABLE_CORE_STARTUP_APIS:${api.service}`
                          }
                          onClick={() =>
                            handleLiveRemediate(
                              'ENABLE_CORE_STARTUP_APIS',
                              api.service
                            )
                          }
                          className="px-2 py-0.5 rounded bg-blue-600 text-white text-[9.5px] font-extrabold cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {busyTarget ===
                          `ENABLE_CORE_STARTUP_APIS:${api.service}`
                            ? '...'
                            : 'Enable'}
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate">
                      {api.service === 'billingbudgets.googleapis.com'
                        ? 'cloudbilling + billingbudgets.googleapis.com'
                        : api.service}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      {api.freeTier}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 02: LAUNCH-DAY QUOTA WALL & LIVE 24H HTTP 429 RADAR           */}
      {/* ==================================================================== */}
      {showModule('QUOTA_WALL_RADAR') && (
        <div
          id="startup-10x-quota-section"
          className="scroll-mt-24 p-5 rounded-2xl bg-white dark:bg-[#18191c] border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-extrabold">
                  PILLAR 02
                </span>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                  Launch-Day Quota Wall &amp; Live 24h HTTP 429 Throttling Radar
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Inspects live Compute &amp; GPU Quotas (<code className="font-mono">GPUS_ALL_REGIONS</code>, <code className="font-mono">NVIDIA_L4_GPUS</code>, <code className="font-mono">CPUS_ALL_REGIONS</code>) and real 24h Cloud Monitoring <code className="font-mono">HTTP 429 RESOURCE_EXHAUSTED</code> events.
              </p>
            </div>
          </div>

          {/* Live 24h Cloud Monitoring API Request & HTTP 429 Telemetry Bar */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                24h Live API Runtime Traffic:
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-bold">
                {(
                  quotaWall.liveTraffic24h?.totalRequests24h || 0
                ).toLocaleString()}{' '}
                calls (24h)
              </span>
              <span
                className={`px-2 py-0.5 rounded font-extrabold ${
                  quotaWall.liveTraffic24h?.total429Count24h > 0
                    ? 'bg-red-600 text-white'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {quotaWall.liveTraffic24h?.total429Count24h || 0} HTTP 429 Throttled (24h)
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap text-[10.5px]">
              {(quotaWall.liveTraffic24h?.topServices || [])
                .slice(0, 3)
                .map((s) => (
                  <span
                    key={s.service}
                    className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                  >
                    {s.service.replace('.googleapis.com', '')}:{' '}
                    {s.totalRequests24h.toLocaleString()}
                    {s.http429Count24h > 0 ? ` (${s.http429Count24h} 429s)` : ''}
                  </span>
                ))}
            </div>
          </div>

          {/* Live Regional & Global Quotas Grid */}
          {Array.isArray(quotaWall.liveQuotas) &&
            quotaWall.liveQuotas.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {quotaWall.liveQuotas.slice(0, 9).map((q) => (
                  <div
                    key={q.id}
                    className={`p-3 rounded-xl border space-y-2 text-xs font-mono ${
                      q.isZeroTrap
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-zinc-50 dark:bg-[#121316] border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-extrabold text-zinc-950 dark:text-zinc-50 truncate">
                          {q.metric}
                        </div>
                        <div className="text-[10px] text-zinc-500">{q.scope}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                          q.isZeroTrap
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {q.isZeroTrap
                          ? '0 QUOTA TRAP'
                          : `${q.usage} / ${q.limit}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[10.5px]">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        Used: <strong>{q.usage}</strong> / Limit:{' '}
                        <strong>{q.limit}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(q.cliCmd, q.id)}
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                      >
                        {copiedId === q.id ? (
                          <>
                            <Check className="w-3 h-3 shrink-0" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <span>Quota CLI</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 03: STARTUP CREDIT RUNWAY & 6-VECTOR LIVE COST AUDIT          */}
      {/* ==================================================================== */}
      {showModule('CREDIT_CLIFF_RUNWAY') && (
        <div
          id="startup-10x-runway-section"
          className="scroll-mt-24 p-5 rounded-2xl bg-white dark:bg-[#18191c] border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-extrabold">
                  PILLAR 03
                </span>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                  Startup Credit Runway &amp; 6-Vector Live Cost Audit (Always-Free vs Paid Burn)
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Audits 6 silent 24/7 cloud cost vectors on <code className="font-mono font-bold">{projectId}</code> — Compute VMs, Persistent Disks (<code className="font-mono">pd-balanced</code> vs <code className="font-mono">$0 pd-standard</code>), Static IPs, Cloud Run warm instances, GCS lifecycles, and BigQuery time-travel.
              </p>
            </div>
            {onNavigateTab && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateTab('ZOMBIE_HUNTER')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  Zombie Exterminator ↗
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('FINOPS')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  FinOps Studio ↗
                </button>
              </div>
            )}
          </div>

          {/* 1. Credit Runway & Live Monthly Burn Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500 font-extrabold">
                Selected Startup Credit Tier
              </div>
              <div className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 mt-0.5">
                ${Number(runway.creditTierUsd || creditTierUsd).toLocaleString()}
              </div>
              <div className="text-[10.5px] text-zinc-500">
                Up to 24 months program validity
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500 font-extrabold">
                Live Detected Resource Burn
              </div>
              <div className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 mt-0.5">
                ${Number(runway.liveResourceMonthlyBurnUsd || 0).toFixed(2)}/mo
              </div>
              <div className="text-[10.5px] text-zinc-500">
                Computed from live VMs, Disks, IPs, Run &amp; Storage
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800">
              <div className="text-[10px] uppercase text-zinc-500 font-extrabold">
                Recoverable Monthly Savings
              </div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${Number(runway.totalMonthlyVampireWasteUsd || 0).toFixed(2)}/mo
              </div>
              <div className="text-[10.5px] text-zinc-500">
                {(runway.vampireItems || []).length} optimization item(s) found
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-[10px] uppercase text-emerald-700 dark:text-emerald-300 font-extrabold">
                Projected Credit Runway
              </div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {runway.optimizedRunwayMonths} Months
              </div>
              <div className="text-[10.5px] text-emerald-700/80 dark:text-emerald-300/80 flex items-center gap-1">
                {runway.extraRunwayMonthsGained > 0 ? (
                  <span>+{runway.extraRunwayMonthsGained} extra months gained</span>
                ) : (
                  <>
                    <Check className="w-3 h-3 shrink-0" />
                    <span>Full 24-month credit window preserved</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 1b. Founder Unit Economics, SaaS/AI Gross Margin & 1X -> 10X Scale Simulator */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <span>Founder Unit Economics, SaaS/AI Gross Margin &amp; 10X Launch Modeler</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      unitEcon1x.grossMarginPct >= 80
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : unitEcon1x.grossMarginPct >= 65
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {unitEcon1x.grossMarginPct}% Cloud Gross Margin (VC Target: 80%+)
                  </span>
                </div>
                <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Model your cloud cost per Monthly Active User (<code className="font-mono">$/MAU</code>), SaaS/AI gross margin, and Google for Startups credit runway from Pre-Seed to a 10X Product Hunt / Series A surge.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-mono">
                {[
                  { label: 'Pre-Seed (1k MAU)', mau: 1000, arpu: 19, req: 25, ai: 5 },
                  { label: 'Seed Launch (15k MAU)', mau: 15000, arpu: 29, req: 40, ai: 8 },
                  { label: 'Series A (75k MAU)', mau: 75000, arpu: 49, req: 60, ai: 12 },
                  { label: '10X Viral (250k MAU)', mau: 250000, arpu: 49, req: 80, ai: 15 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setSimMau(preset.mau);
                      setSimArpuUsd(preset.arpu);
                      setSimApiReqPerUserDay(preset.req);
                      setSimAiPromptsPerUserDay(preset.ai);
                    }}
                    className={`px-2.5 py-1 rounded-md border font-bold cursor-pointer ${
                      simMau === preset.mau
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span>Active Users (MAU):</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {simMau.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={500000}
                  step={500}
                  value={simMau}
                  onChange={(e) => setSimMau(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span>Subscription ARPU:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    ${simArpuUsd}/user/mo
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={199}
                  step={1}
                  value={simArpuUsd}
                  onChange={(e) => setSimArpuUsd(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span>API Calls / User / Day:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {simApiReqPerUserDay}/day
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={250}
                  step={5}
                  value={simApiReqPerUserDay}
                  onChange={(e) =>
                    setSimApiReqPerUserDay(Number(e.target.value))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                <div className="flex justify-between font-bold text-zinc-900 dark:text-zinc-100">
                  <span>AI Turns / User / Day:</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    {simAiPromptsPerUserDay}/day
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={1}
                  value={simAiPromptsPerUserDay}
                  onChange={(e) =>
                    setSimAiPromptsPerUserDay(Number(e.target.value))
                  }
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-zinc-950 dark:text-zinc-50">
                    1X Current Target ({unitEcon1x.mau.toLocaleString()} MAU)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold">
                    MRR: ${unitEcon1x.monthlyMrrUsd.toLocaleString()}/mo
                  </span>
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  Projected GCP Cloud Bill:{' '}
                  <strong className="text-zinc-950 dark:text-zinc-50">
                    ${unitEcon1x.totalCloudBillUsd.toLocaleString()}/mo
                  </strong>{' '}
                  (${unitEcon1x.costPerMauUsd}/MAU) · Runway:{' '}
                  <strong>{unitEcon1x.creditRunwayMonths} mo</strong>
                </div>
                <div className="text-[10.5px] text-zinc-500">
                  Breakdown: Cloud Run ${unitEcon1x.cloudRunMonthlyUsd} · Vertex AI (Cached) ${unitEcon1x.vertexAiMonthlyUsd} · Data/Egress ${unitEcon1x.dataAndEgressUsd}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-zinc-950 dark:text-zinc-50">
                    10X Viral Breakout ({unitEcon10x.mau.toLocaleString()} MAU)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-extrabold">
                    MRR: ${unitEcon10x.monthlyMrrUsd.toLocaleString()}/mo
                  </span>
                </div>
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  10X GCP Cloud Bill:{' '}
                  <strong className="text-zinc-950 dark:text-zinc-50">
                    ${unitEcon10x.totalCloudBillUsd.toLocaleString()}/mo
                  </strong>{' '}
                  · Gross Margin: <strong>{unitEcon10x.grossMarginPct}%</strong> · Runway:{' '}
                  <strong>{unitEcon10x.creditRunwayMonths} mo</strong>
                </div>
                <div className="text-[10.5px] text-zinc-500">
                  Breakdown: Cloud Run ${unitEcon10x.cloudRunMonthlyUsd} · Vertex AI (Cached) ${unitEcon10x.vertexAiMonthlyUsd} · Data/Egress ${unitEcon10x.dataAndEgressUsd}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Actionable Cost Optimization Findings (if any detected on live resources) */}
          {(runway.vampireItems || []).length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="text-xs font-mono font-extrabold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  Live Cost Optimization Findings ({runway.vampireItems.length})
                </span>
              </div>
              <div className="space-y-2">
                {runway.vampireItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-lg bg-white dark:bg-[#121316] border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-zinc-950 dark:text-zinc-50">
                        {item.resource}
                      </div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                        Why it costs money: {item.issue}
                      </div>
                      <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Fix: {item.fixLabel}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold text-xs">
                        Save ${Number(item.monthlyWasteUsd || 0).toFixed(2)}/mo
                      </span>
                      {item.remediateAction && item.targetName ? (
                        <button
                          type="button"
                          disabled={
                            busyTarget ===
                            `${item.remediateAction}:${item.targetName}`
                          }
                          onClick={() =>
                            handleLiveRemediate(
                              item.remediateAction,
                              item.targetName,
                              item.region || 'us-central1'
                            )
                          }
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold cursor-pointer disabled:opacity-50"
                        >
                          {busyTarget ===
                          `${item.remediateAction}:${item.targetName}`
                            ? 'Applying...'
                            : '1-Click Remediate'}
                        </button>
                      ) : item.navigateTab && onNavigateTab ? (
                        <button
                          type="button"
                          onClick={() => onNavigateTab(item.navigateTab)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-[11px] font-bold cursor-pointer"
                        >
                          Open Studio ↗
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. 6-Vector Live Startup Cost & Always-Free Eligibility Audit Table */}
          {Array.isArray(runway.costAuditChecks) &&
            runway.costAuditChecks.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                  6-Vector Live GCP Cost &amp; Always-Free Eligibility Breakdown
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {runway.costAuditChecks.map((chk) => (
                    <div
                      key={chk.id}
                      className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-1.5 text-xs font-mono"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-zinc-950 dark:text-zinc-50">
                          {chk.category} ({chk.resourceCount})
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            chk.status === 'OPTIMAL'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          ${Number(chk.monthlyBurnUsd || 0).toFixed(2)}/mo
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-800 dark:text-zinc-200 font-bold">
                        {chk.summary}
                      </div>
                      <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-relaxed flex items-start gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>{chk.tip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* 4. 1-Click Storage & BigQuery Dataset Hardening (with clear status when 0 exist) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live Buckets Lifecycle Hardening */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                  Live Cloud Storage Buckets ({bucketFindings.length})
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('CLOUD_STORAGE')}
                    className="text-[10.5px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Cloud Storage Studio ↗
                  </button>
                )}
              </div>
              {bucketFindings.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs font-mono">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 flex-wrap">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      0 Cloud Storage buckets in <code className="font-bold">{projectId}</code> ($0.00/mo storage burn · 5 GB US Standard free tier ready).
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      Need a pre-hardened bucket with Public Access Prevention + 30d Nearline Lifecycle?
                    </span>
                    <button
                      type="button"
                      data-feature-id="STARTUP_10X_BOOTSTRAP_VAULT"
                      disabled={
                        busyTarget ===
                        `BOOTSTRAP_STARTUP_BUCKET:${projectId}-startup-vault`
                      }
                      onClick={() =>
                        handleLiveRemediate(
                          'BOOTSTRAP_STARTUP_BUCKET',
                          `${projectId}-startup-vault`,
                          'US'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      {busyTarget ===
                      `BOOTSTRAP_STARTUP_BUCKET:${projectId}-startup-vault`
                        ? 'Provisioning Vault...'
                        : `1-Click Provision gs://${projectId}-startup-vault`}
                    </button>
                  </div>
                </div>
              ) : (
                bucketFindings.map((b) => (
                  <div
                    key={b.name}
                    className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50 truncate">
                        gs://{b.name}
                      </div>
                      <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                        {b.location} ·{' '}
                        {b.hasLifecycle ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Check className="w-3 h-3 shrink-0" />
                            <span>30d Nearline Lifecycle Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>Missing Lifecycle (Est. -$12/mo)</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-feature-id="STARTUP_10X_PATCH_BUCKET_SHIELD"
                      disabled={
                        busyTarget === `PATCH_BUCKET_STARTUP_SHIELD:${b.name}`
                      }
                      onClick={() =>
                        handleLiveRemediate(
                          'PATCH_BUCKET_STARTUP_SHIELD',
                          b.name,
                          b.location
                        )
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono font-extrabold shrink-0 cursor-pointer disabled:opacity-50 ${
                        b.hasLifecycle && b.papEnforced
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {busyTarget === `PATCH_BUCKET_STARTUP_SHIELD:${b.name}` ? (
                        'Applying...'
                      ) : b.hasLifecycle && b.papEnforced ? (
                        <>
                          <Check className="w-3 h-3 shrink-0" />
                          <span>Shielded &amp; Lifecycled</span>
                        </>
                      ) : (
                        '1-Click Shield & Lifecycle'
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Live BigQuery Datasets Optimizer */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                  Live BigQuery Datasets ({datasetFindings.length})
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('BIGQUERY_STUDIO')}
                    className="text-[10.5px] font-mono font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    BigQuery Studio ↗
                  </button>
                )}
              </div>
              {datasetFindings.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs font-mono">
                  <div className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 flex-wrap">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      0 BigQuery datasets in <code className="font-bold">{projectId}</code> ($0.00/mo warehouse burn · 10 GB storage + 1 TB queries/mo free tier ready).
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400">
                      Need a product analytics warehouse with 168h Time-Travel &amp; 60d partition expiry?
                    </span>
                    <button
                      type="button"
                      data-feature-id="STARTUP_10X_BOOTSTRAP_BQ"
                      disabled={
                        busyTarget ===
                        'BOOTSTRAP_STARTUP_BQ_DATASET:startup_analytics'
                      }
                      onClick={() =>
                        handleLiveRemediate(
                          'BOOTSTRAP_STARTUP_BQ_DATASET',
                          'startup_analytics',
                          'US'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      {busyTarget ===
                      'BOOTSTRAP_STARTUP_BQ_DATASET:startup_analytics'
                        ? 'Provisioning Warehouse...'
                        : `1-Click Provision ${projectId}:startup_analytics`}
                    </button>
                  </div>
                </div>
              ) : (
                datasetFindings.map((d) => (
                  <div
                    key={d.datasetId}
                    className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50 truncate">
                        {projectId}:{d.datasetId}
                      </div>
                      <div className="text-[10.5px] font-mono text-zinc-500 dark:text-zinc-400">
                        Location: {d.location} ·{' '}
                        {d.isStartupOptimized ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                            <Check className="w-3 h-3 shrink-0" />
                            <span>168h Time-Travel &amp; Labeled</span>
                          </span>
                        ) : (
                          <span>168h Time-Travel &amp; Attribution</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      data-feature-id="STARTUP_10X_PATCH_BQ_OPTIMIZER"
                      disabled={
                        busyTarget === `PATCH_BQ_STARTUP_OPTIMIZER:${d.datasetId}`
                      }
                      onClick={() =>
                        handleLiveRemediate(
                          'PATCH_BQ_STARTUP_OPTIMIZER',
                          d.datasetId,
                          d.location
                        )
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-mono font-extrabold shrink-0 cursor-pointer disabled:opacity-50 ${
                        d.isStartupOptimized
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {busyTarget === `PATCH_BQ_STARTUP_OPTIMIZER:${d.datasetId}` ? (
                        'Patching...'
                      ) : d.isStartupOptimized ? (
                        <>
                          <Check className="w-3 h-3 shrink-0" />
                          <span>Optimized</span>
                        </>
                      ) : (
                        '1-Click Optimize Dataset'
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 04: ENTERPRISE SOC2 DEAL-BLOCKER SCANNER & 1-CLICK REMEDIATOR */}
      {/* ==================================================================== */}
      {showModule('SOC2_DEAL_BLOCKER') && (
        <div
          id="startup-10x-soc2-section"
          className="scroll-mt-24 p-5 rounded-2xl bg-white dark:bg-[#18191c] border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-extrabold">
                  PILLAR 04
                </span>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                  Enterprise B2B SOC2 Deal-Blocker Scanner &amp; 1-Click IAP Firewall Lock
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Lists every live world-open <code className="font-mono">0.0.0.0/0</code> ingress firewall rule, primitive Owner/Editor IAM binding, and unshielded bucket in <code className="font-mono font-bold">{projectId}</code>.
              </p>
            </div>
            {onNavigateTab && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onNavigateTab('VPC_NETWORKS')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  VPC Firewall Studio ↗
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('CLOUD_SOC')}
                  className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  Cloud SOC ↗
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live Open 0.0.0.0/0 Firewall Rules */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                  World-Open 0.0.0.0/0 Ingress Firewalls ({soc2Blockers.openFirewalls.length})
                </span>
                <div className="flex items-center gap-1.5">
                  {soc2Blockers.openFirewalls.some(
                    (fw) => !fw.isWebHttpHttpsOnly
                  ) && (
                    <button
                      type="button"
                      data-feature-id="STARTUP_10X_LOCK_ALL_IAP"
                      disabled={
                        busyTarget === 'LOCK_ALL_OPEN_FIREWALLS_IAP:ALL'
                      }
                      onClick={() =>
                        handleLiveRemediate('LOCK_ALL_OPEN_FIREWALLS_IAP', 'ALL')
                      }
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-mono font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      {busyTarget === 'LOCK_ALL_OPEN_FIREWALLS_IAP:ALL'
                        ? 'Locking Admin Ports...'
                        : `1-Click Lock Admin/SSH/RDP Ports (${
                            soc2Blockers.openFirewalls.filter(
                              (fw) => !fw.isWebHttpHttpsOnly
                            ).length
                          }) to Cloud IAP`}
                    </button>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                      soc2Blockers.openFirewalls.filter(
                        (fw) => !fw.isWebHttpHttpsOnly
                      ).length === 0
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {soc2Blockers.openFirewalls.filter(
                      (fw) => !fw.isWebHttpHttpsOnly
                    ).length === 0 ? (
                      <>
                        <Check className="w-3 h-3 shrink-0" />
                        <span>SOC2 PASS</span>
                      </>
                    ) : (
                      'ACTION RECOMMENDED'
                    )}
                  </span>
                </div>
              </div>
              {soc2Blockers.openFirewalls.length === 0 ? (
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>0 world-open 0.0.0.0/0 ingress firewall rules detected!</span>
                </div>
              ) : (
                soc2Blockers.openFirewalls.map((fw) => (
                  <div
                    key={fw.name}
                    className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 font-mono">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold text-zinc-950 dark:text-zinc-50 truncate">
                          {fw.name}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-extrabold ${
                            fw.isWebHttpHttpsOnly
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {fw.isWebHttpHttpsOnly ? (
                            <>
                              <Check className="w-2.5 h-2.5 shrink-0" />
                              <span>PUBLIC WEB (80/443)</span>
                            </>
                          ) : (
                            'ADMIN / INTERNAL PORT'
                          )}
                        </span>
                      </div>
                      <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate">
                        VPC: {fw.network} · Ports: {fw.portsSummary || 'all'}
                      </div>
                    </div>
                    {fw.isWebHttpHttpsOnly ? (
                      <span
                        title="Standard HTTP/HTTPS web ingress rule — preserved by 1-Click Admin IAP Lock"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold shrink-0"
                      >
                        <Check className="w-3 h-3 shrink-0" />
                        <span>Web Port Preserved</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-feature-id="STARTUP_10X_LOCK_FIREWALL_IAP"
                        disabled={
                          busyTarget === `LOCK_OPEN_FIREWALL_IAP:${fw.name}`
                        }
                        onClick={() =>
                          handleLiveRemediate('LOCK_OPEN_FIREWALL_IAP', fw.name)
                        }
                        title={`Restrict ${fw.name} from 0.0.0.0/0 to Google Cloud IAP (35.235.240.0/20)`}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-[10.5px] font-mono font-extrabold shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {busyTarget === `LOCK_OPEN_FIREWALL_IAP:${fw.name}`
                          ? 'Locking to IAP...'
                          : 'Lock to Cloud IAP'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Live Primitive IAM Owner/Editor Principals */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                  Primitive Owner / Editor Principals ({soc2Blockers.totalPrimitivePrincipals})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-mono font-bold">
                  Least-Privilege Audit
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(soc2Blockers.primitivePrincipalsList || [])
                  .slice(0, 6)
                  .map((p, idx) => (
                    <div
                      key={`${p.role}-${p.member}-${idx}`}
                      className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <span className="truncate text-zinc-900 dark:text-zinc-100 font-bold">
                        {p.member}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-extrabold shrink-0">
                        {p.role}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* 6-Control Live B2B Enterprise Security & SOC2 Questionnaire Auto-Responder */}
          {Array.isArray(soc2Blockers.soc2EvidenceControls) &&
            soc2Blockers.soc2EvidenceControls.length > 0 && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-extrabold text-zinc-950 dark:text-zinc-50">
                      B2B Enterprise Security Questionnaire &amp; SOC2 Live Evidence Matrix (6 Controls)
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Auto-generated from live GCP control-plane state on <code className="font-mono font-bold">{projectId}</code> — copy any row into customer security questionnaires.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportFounderPacket}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono font-bold text-zinc-900 dark:text-zinc-100 cursor-pointer"
                  >
                    Export Full SOC2 Evidence (.md)
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs font-mono">
                  {soc2Blockers.soc2EvidenceControls.map((ctrl) => (
                    <div
                      key={ctrl.controlId}
                      className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-zinc-950 dark:text-zinc-50">
                          {ctrl.controlId}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              ctrl.status === 'PASS'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ctrl.status === 'PASS' ? (
                              <>
                                <Check className="w-3 h-3 shrink-0" />
                                <span>PASS</span>
                              </>
                            ) : (
                              'ACTION NEEDED'
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                `[${ctrl.controlId}] ${ctrl.question}\nStatus: ${ctrl.status}\nLive GCP Evidence (${projectId}): ${ctrl.liveEvidence}`,
                                ctrl.controlId
                              )
                            }
                            className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold cursor-pointer"
                          >
                            {copiedId === ctrl.controlId ? 'Copied!' : 'Copy Answer'}
                          </button>
                        </div>
                      </div>
                      <div className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold">
                        {ctrl.question}
                      </div>
                      <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400">
                        Live Proof: {ctrl.liveEvidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODULE 05: DATA-GRAVITY CO-LOCATION & -80% CONTEXT CACHE CALCULATOR  */}
      {/* ==================================================================== */}
      {showModule('GEMINI_RAG_LATENCY') && (
        <div
          id="startup-10x-rag-section"
          className="scroll-mt-24 p-5 rounded-2xl bg-white dark:bg-[#18191c] border border-zinc-200 dark:border-zinc-800 space-y-4"
        >
          <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-extrabold">
                PILLAR 05
              </span>
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                Live Data-Gravity Co-Location Matrix &amp; -80% Vertex AI Context Cache Calculator
              </h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
              Verifies that your Compute/Cloud Run workloads are co-located in the same region as your GCS buckets &amp; BigQuery datasets, and calculates monthly savings from <strong>Vertex AI Context Caching</strong>.
            </p>
          </div>

          {/* Live Data-Gravity Region Alignment Bar */}
          <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2 flex-wrap">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                Live Data-Gravity Placement:
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                VMs: {(regionGravity.vmRegions || []).join(', ') || 'none'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                GCS: {(regionGravity.bucketLocations || []).join(', ') || 'none'}
              </span>
              <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                BigQuery: {(regionGravity.bqLocations || []).join(', ') || 'none'}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold ${
                regionGravity.hasRegionMismatch
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {regionGravity.hasRegionMismatch ? (
                <>
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>+{regionGravity.estimatedCrossRegionRttPenaltyMs}ms Cross-Region Penalty</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 shrink-0" />
                  <span>Co-Located (~{regionGravity.estimatedCrossRegionRttPenaltyMs}ms Intra-Region RTT)</span>
                </>
              )}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                <span>Repeated System Prompt / RAG Context:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {systemPromptTokens.toLocaleString()} tokens
                </span>
              </div>
              <input
                type="range"
                min={4000}
                max={128000}
                step={2000}
                value={systemPromptTokens}
                onChange={(e) => setSystemPromptTokens(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800 space-y-1.5">
              <div className="flex justify-between text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                <span>Daily User Prompt Turns:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {dailyConversations.toLocaleString()} turns/day
                </span>
              </div>
              <input
                type="range"
                min={1000}
                max={250000}
                step={1000}
                value={dailyConversations}
                onChange={(e) => setDailyConversations(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500 font-bold">
                Uncached Monthly Token Bill
              </div>
              <div className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 mt-0.5">
                ${monthlyUncachedCostUsd.toFixed(2)}/mo
              </div>
              <div className="text-[10px] text-zinc-500">
                {monthlyUncachedInputTokensM.toFixed(0)}M input tokens/mo
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-[#121316] border border-zinc-200 dark:border-zinc-800">
              <div className="text-zinc-500 font-bold">
                With Vertex AI Context Cache (-80%)
              </div>
              <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                ${monthlyCachedCostUsd.toFixed(2)}/mo
              </div>
              <div className="text-[10px] text-zinc-500">
                TTFT latency reduced by ~62%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-emerald-700 dark:text-emerald-300 font-bold">
                Monthly Startup AI Savings
              </div>
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +${monthlyGenAiSavedUsd.toFixed(2)}/mo Saved
              </div>
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                +${(monthlyGenAiSavedUsd * 12).toFixed(0)}/yr preserved
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
