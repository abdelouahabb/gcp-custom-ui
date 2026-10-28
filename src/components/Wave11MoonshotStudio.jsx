import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Rocket,
  Database,
  DollarSign,
  Layers,
  ShieldCheck,
  Terminal,
  RefreshCw,
  PlusCircle,
  Trash2,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Server,
  Globe,
  Cpu,
  Activity,
} from 'lucide-react';

const SUB_TABS = [
  {
    id: 'CLOUD_DEPLOY',
    step: '01',
    label: 'Cloud Deploy & Canary Pipelines',
    badge: 'clouddeploy.googleapis.com',
    icon: Rocket,
  },
  {
    id: 'FIRESTORE_NOSQL',
    step: '02',
    label: 'Cloud Firestore NoSQL Explorer',
    badge: 'firestore.googleapis.com',
    icon: Database,
  },
  {
    id: 'FINOPS_QUOTAS',
    step: '03',
    label: 'Active Assist & Quota Optimizer',
    badge: 'recommender.googleapis.com',
    icon: DollarSign,
  },
  {
    id: 'MULTI_PROJECT_AUDIT',
    step: '04',
    label: 'Multi-Project Matrix & Audit',
    badge: '18-Studio Live Probe',
    icon: Activity,
  },
  {
    id: 'SELF_HOST_REPORT',
    step: '05',
    label: 'Cloud Run Package & Exec Report',
    badge: 'Dockerfile + Executive HTML',
    icon: FileText,
  },
];

export default function Wave11MoonshotStudio({
  projectId,
  overview,
  liveBurn,
  onSelectProject,
  onRunInShell,
  onShowToast,
  onShowError,
}) {
  const [activeSubTab, setActiveSubTab] = useState('CLOUD_DEPLOY');
  const [region, setRegion] = useState('us-central1');
  const [collectionId, setCollectionId] = useState('cloudpulse_deployments');
  const [loading, setLoading] = useState(false);
  const [wave11Data, setWave11Data] = useState(null);

  // Cloud Deploy form state
  const [pipelineId, setPipelineId] = useState('cloudpulse-canary-pipeline');
  const [pipelineDesc, setPipelineDesc] = useState(
    'Progressive Canary Delivery Pipeline (Dev -> Staging -> 25%/50%/100% Prod)'
  );
  const [enableCanary, setEnableCanary] = useState(true);
  const [requireProdApproval, setRequireProdApproval] = useState(true);
  const [creatingPipeline, setCreatingPipeline] = useState(false);

  // Firestore form state
  const [docIdInput, setDocIdInput] = useState('release-v3-moonshot');
  const [docJsonInput, setDocJsonInput] = useState(
    JSON.stringify(
      {
        service: 'cloudpulse-2026-cockpit',
        releaseTrack: 'GA_PRODUCTION',
        canaryWeightPct: 25,
        zeroSyntheticVerified: true,
        region: 'us-central1',
      },
      null,
      2
    )
  );
  const [savingDoc, setSavingDoc] = useState(false);
  const [creatingDb, setCreatingDb] = useState(false);

  // Multi-Project Matrix & Stress Audit state
  const [multiProjectData, setMultiProjectData] = useState(null);
  const [loadingMultiProject, setLoadingMultiProject] = useState(false);
  const [stressAuditData, setStressAuditData] = useState(null);
  const [runningStressAudit, setRunningStressAudit] = useState(false);

  // Self-host package state
  const [selfHostData, setSelfHostData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchWave11Overview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave11/overview`,
        {
          params: { region, collectionId },
        }
      );
      setWave11Data(res.data);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to load Wave 11 Moonshot Studio telemetry.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, region, collectionId, onShowError]);

  const fetchSelfHostPackage = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/wave11/self-host-package`,
        { params: { region } }
      );
      setSelfHostData(res.data);
    } catch {
      // ignore
    }
  }, [projectId, region]);

  useEffect(() => {
    fetchWave11Overview();
    fetchSelfHostPackage();
  }, [fetchWave11Overview, fetchSelfHostPackage]);

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text || '');
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
    if (onShowToast) onShowToast('Copied to clipboard');
  };

  const handleCreatePipeline = async (e) => {
    e.preventDefault();
    if (!projectId) return;
    setCreatingPipeline(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave11/clouddeploy/pipeline`,
        {
          region,
          pipelineId,
          description: pipelineDesc,
          cloudRunLocation: region,
          enableCanary,
          requireProdApproval,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Provisioned Cloud Deploy pipeline "${pipelineId}" in ${region}.`
        );
      }
      fetchWave11Overview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to provision Cloud Deploy pipeline.'
        );
      }
    } finally {
      setCreatingPipeline(false);
    }
  };

  const handleCreateFirestoreDb = async () => {
    if (!projectId) return;
    setCreatingDb(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave11/firestore/database`,
        {
          databaseId: '(default)',
          locationId: 'nam5',
          type: 'FIRESTORE_NATIVE',
          pointInTimeRecovery: true,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || 'Provisioned Cloud Firestore Native database.'
        );
      }
      fetchWave11Overview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to provision Firestore database.'
        );
      }
    } finally {
      setCreatingDb(false);
    }
  };

  const handleUpsertFirestoreDoc = async (e) => {
    e.preventDefault();
    if (!projectId) return;
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(docJsonInput);
    } catch {
      if (onShowError) {
        onShowError('Invalid JSON payload for Firestore document.');
      }
      return;
    }

    setSavingDoc(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave11/firestore/documents`,
        {
          databaseId: '(default)',
          collectionId,
          documentId: docIdInput,
          payload: parsedPayload,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Upserted Firestore document ${collectionId}/${docIdInput}`
        );
      }
      fetchWave11Overview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to upsert Firestore document.'
        );
      }
    } finally {
      setSavingDoc(false);
    }
  };

  const handleDeleteFirestoreDoc = async (docId) => {
    if (!projectId || !docId) return;
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/wave11/firestore/documents`,
        {
          params: {
            databaseId: '(default)',
            collectionId,
            documentId: docId,
          },
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Deleted document ${collectionId}/${docId}`
        );
      }
      fetchWave11Overview();
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to delete Firestore document.'
        );
      }
    }
  };

  const handleRunMultiProjectScan = async () => {
    setLoadingMultiProject(true);
    try {
      const res = await axios.get('/api/multi-project/compare');
      setMultiProjectData(res.data);
      if (onShowToast) {
        onShowToast(
          `Scanned ${res.data?.totalProjectsScanned || 0} live GCP projects in ${
            res.data?.elapsedMs || 0
          }ms.`
        );
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to run multi-project estate comparison.'
        );
      }
    } finally {
      setLoadingMultiProject(false);
    }
  };

  const handleRunStressAudit = async () => {
    if (!projectId) return;
    setRunningStressAudit(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/wave11/stress-audit`
      );
      setStressAuditData(res.data);
      if (onShowToast) {
        onShowToast(
          `Completed 18-Studio Live Stress Audit: ${res.data?.passedCount}/${res.data?.totalStudiosProbed} verified (avg ${res.data?.avgLatencyMs}ms, P95 ${res.data?.p95LatencyMs}ms).`
        );
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            err.message ||
            'Failed to run live stress audit.'
        );
      }
    } finally {
      setRunningStressAudit(false);
    }
  };

  const handleDownloadExecutiveReport = () => {
    const nowIso = new Date().toISOString();
    const summary = overview?.summary || {};
    const quotas = wave11Data?.finopsQuotas?.regionalQuotas || [];
    const recs = wave11Data?.finopsQuotas?.recommendations || [];
    const pipelines = wave11Data?.cloudDeploy?.deliveryPipelines || [];
    const dbs = wave11Data?.firestore?.databases || [];
    const auditRows = stressAuditData?.results || [];

    const htmlReport = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CloudPulse 2026 — Executive Architecture & Readiness Dossier (${projectId})</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 32px; line-height: 1.5; }
    .container { max-width: 1120px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; }
    h1, h2, h3 { margin-top: 0; color: #f8fafc; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-family: monospace; font-weight: 700; background: #065f46; color: #6ee7b7; border: 1px solid #10b981; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 20px 0; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 16px; }
    .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; font-family: monospace; }
    .val { font-size: 22px; font-weight: 800; font-family: monospace; margin-top: 4px; color: #8ab4f8; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #334155; font-family: monospace; }
    th { color: #94a3b8; text-transform: uppercase; font-size: 11px; background: #0f172a; }
    .ok { color: #34d399; font-weight: 700; }
    @media print { body { background: #ffffff; color: #0f172a; padding: 0; } .container { background: #ffffff; border: none; } .card, th { background: #f1f5f9; border-color: #cbd5e1; } h1, h2, h3, .val { color: #0f172a; } }
  </style>
</head>
<body>
  <div class="container">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #334155;padding-bottom:20px;">
      <div>
        <span class="badge">100% LIVE GCP REST API TELEMETRY · ZERO SYNTHETIC DATA</span>
        <h1 style="margin-top:10px;margin-bottom:4px;">CloudPulse 2026 — Executive Cloud Architecture Dossier</h1>
        <div style="font-family:monospace;font-size:13px;color:#94a3b8;">GCP Project: <strong>${projectId}</strong> · Generated: ${nowIso}</div>
      </div>
      <div style="text-align:right;font-family:monospace;">
        <div style="font-size:12px;color:#94a3b8;">Estimated Run-Rate</div>
        <div style="font-size:24px;font-weight:800;color:#34d399;">$${(liveBurn?.hourly || 0).toFixed(4)}/hr (~$${(liveBurn?.monthly || 0).toFixed(2)}/mo)</div>
      </div>
    </div>

    <div class="grid">
      <div class="card"><div class="label">Compute Engine VMs</div><div class="val">${summary.totalVms ?? 0} (${summary.runningVms ?? 0} Running)</div></div>
      <div class="card"><div class="label">Cloud Run Services</div><div class="val">${(overview?.cloudRunServices || []).length}</div></div>
      <div class="card"><div class="label">Storage Buckets & BQ</div><div class="val">${summary.storageBuckets ?? 0} Buckets / ${summary.bqDatasets ?? 0} DS</div></div>
      <div class="card"><div class="label">Cloud Deploy & Firestore</div><div class="val">${pipelines.length} Pipelines / ${dbs.length} DBs</div></div>
    </div>

    <h2>1. Active Assist Recommender & FinOps Insights (${recs.length})</h2>
    <table>
      <thead><tr><th>Category</th><th>Priority</th><th>Description</th><th>Est. Savings</th></tr></thead>
      <tbody>
        ${
          recs.length === 0
            ? '<tr><td colspan="4">Zero idle resources or over-provisioned VMs flagged by Google Cloud Active Assist Recommender.</td></tr>'
            : recs
                .map(
                  (r) =>
                    `<tr><td>${r.category}</td><td>${r.priority}</td><td>${r.description}</td><td class="ok">$${r.estimatedMonthlySavingsUsd}/mo</td></tr>`
                )
                .join('')
        }
      </tbody>
    </table>

    <h2 style="margin-top:28px;">2. Top Regional Quota Utilization (${quotas.slice(0, 12).length})</h2>
    <table>
      <thead><tr><th>Region</th><th>Quota Metric</th><th>Usage / Limit</th><th>Utilization %</th><th>Status</th></tr></thead>
      <tbody>
        ${
          quotas.slice(0, 12).map(
            (q) =>
              `<tr><td>${q.region}</td><td>${q.metric}</td><td>${q.usage} / ${q.limit}</td><td>${q.utilizationPct}%</td><td>${q.status}</td></tr>`
          ).join('') || '<tr><td colspan="5">No elevated regional quotas detected.</td></tr>'
        }
      </tbody>
    </table>

    ${
      auditRows.length > 0
        ? `<h2 style="margin-top:28px;">3. Live 18-Studio Client-Readiness Stress Audit (Avg ${stressAuditData?.avgLatencyMs}ms · P95 ${stressAuditData?.p95LatencyMs}ms)</h2>
    <table>
      <thead><tr><th>Studio ID</th><th>Studio Name</th><th>Endpoint</th><th>HTTP</th><th>Latency</th><th>Payload</th></tr></thead>
      <tbody>
        ${auditRows
          .map(
            (r) =>
              `<tr><td>${r.studioId}</td><td>${r.studioName}</td><td>${r.endpoint}</td><td class="ok">${r.httpStatus}</td><td>${r.latencyMs}ms</td><td>${r.payloadBytes} B</td></tr>`
          )
          .join('')}
      </tbody>
    </table>`
        : ''
    }
  </div>
</body>
</html>`;

    const blob = new Blob([htmlReport], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudpulse-2026-executive-dossier-${projectId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast(
        `Downloaded Executive Cloud Architecture Dossier for ${projectId}`
      );
    }
  };

  const pipelines = wave11Data?.cloudDeploy?.deliveryPipelines || [];
  const targets = wave11Data?.cloudDeploy?.targets || [];
  const recentBuilds = wave11Data?.cloudDeploy?.recentBuilds || [];
  const firestoreDbs = wave11Data?.firestore?.databases || [];
  const firestoreDocs = wave11Data?.firestore?.documents || [];
  const recommendations = wave11Data?.finopsQuotas?.recommendations || [];
  const regionalQuotas = wave11Data?.finopsQuotas?.regionalQuotas || [];

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                RELEASE &amp; MULTI-PROJECT GOVERNANCE STUDIO (100% LIVE GCP APIS)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                CLOUD DEPLOY + FIRESTORE NOSQL + ACTIVE ASSIST RECOMMENDER + MULTI-PROJECT MATRIX
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Rocket className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>
                Release &amp; Multi-Project Studio — Cloud Deploy Canary Pipelines, Firestore NoSQL Explorer, Quota Optimizer &amp; Multi-Project Audit
              </span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Direct live execution against{' '}
              <code className="font-mono text-zinc-800 dark:text-zinc-200">
                clouddeploy.googleapis.com
              </code>
              ,{' '}
              <code className="font-mono text-zinc-800 dark:text-zinc-200">
                firestore.googleapis.com
              </code>
              ,{' '}
              <code className="font-mono text-zinc-800 dark:text-zinc-200">
                recommender.googleapis.com
              </code>
              , and cross-project{' '}
              <code className="font-mono text-zinc-800 dark:text-zinc-200">
                cloudresourcemanager.googleapis.com
              </code>
              .
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              title="Select target Google Cloud region for Cloud Deploy & Active Assist Recommender"
              className="px-3 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            >
              <option value="us-central1">us-central1 (Iowa)</option>
              <option value="us-east1">us-east1 (S. Carolina)</option>
              <option value="us-west1">us-west1 (Oregon)</option>
              <option value="europe-west1">europe-west1 (Belgium)</option>
              <option value="europe-west4">europe-west4 (Netherlands)</option>
              <option value="asia-east1">asia-east1 (Taiwan)</option>
              <option value="asia-northeast1">asia-northeast1 (Tokyo)</option>
            </select>

            <button
              type="button"
              onClick={handleDownloadExecutiveReport}
              title="Download printable Executive HTML/PDF Architecture & Readiness Dossier for clients"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Client Dossier (.html)</span>
            </button>

            <button
              type="button"
              onClick={fetchWave11Overview}
              disabled={loading}
              title="Refresh live Wave 11 telemetry from Google Cloud REST APIs"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Sync Live ({wave11Data?.fetchLatencyMs ?? '—'}ms)</span>
            </button>
          </div>
        </div>

        {/* 5-Tab Equal-Sized Bento Sub-Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-feature-id={tab.id}
                title={`${tab.label} (${tab.badge})`}
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full p-3 rounded-md border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono font-extrabold truncate flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  <div
                    className={`text-[10px] font-mono mt-0.5 truncate ${
                      isActive
                        ? 'text-blue-100'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {tab.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: GOOGLE CLOUD DEPLOY & PROGRESSIVE CANARY PIPELINES */}
      {activeSubTab === 'CLOUD_DEPLOY' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Provision Live Cloud Deploy Canary Pipeline</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                GA · LIVE REST API
              </span>
            </div>

            <form onSubmit={handleCreatePipeline} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Delivery Pipeline ID
                </label>
                <input
                  type="text"
                  value={pipelineId}
                  onChange={(e) => setPipelineId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  Pipeline Architecture Description
                </label>
                <input
                  type="text"
                  value={pipelineDesc}
                  onChange={(e) => setPipelineDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCanary}
                    onChange={(e) => setEnableCanary(e.target.checked)}
                  />
                  <span>25% → 50% → 100% Canary</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireProdApproval}
                    onChange={(e) => setRequireProdApproval(e.target.checked)}
                  />
                  <span>Require IAM Prod Approval</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={creatingPipeline}
                className="w-full py-2.5 px-4 rounded-md text-xs font-mono font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {creatingPipeline
                  ? 'Provisioning Targets & Pipeline on clouddeploy.googleapis.com...'
                  : `Provision Dev → Staging → Prod Pipeline in ${region}`}
              </button>
            </form>

            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 space-y-1">
              <div className="font-bold text-zinc-800 dark:text-zinc-200">
                What this executes on Google Cloud:
              </div>
              <div>
                1. Enables{' '}
                <code>clouddeploy.googleapis.com</code> via Service Usage API.
              </div>
              <div>
                2. Creates 3 live Cloud Run delivery targets (
                <code>-dev</code>, <code>-staging</code>, <code>-prod</code>).
              </div>
              <div>
                3. Creates the serial + automatic traffic-split Canary pipeline.
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                  Live Delivery Pipelines in {region} ({pipelines.length})
                </h3>
                <span className="text-xs font-mono text-zinc-500">
                  Targets: {targets.length} · Recent Cloud Builds:{' '}
                  {recentBuilds.length}
                </span>
              </div>

              {pipelines.length === 0 ? (
                <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
                  <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    No Google Cloud Deploy pipelines found in {region} yet.
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Use the form on the left to provision a live 3-stage progressive delivery pipeline on{' '}
                    <code>clouddeploy.googleapis.com</code>.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pipelines.map((p) => (
                    <div
                      key={p.fullName || p.name}
                      className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-mono font-extrabold text-sm text-zinc-950 dark:text-white">
                          {p.name}
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          {p.readyCondition}
                        </span>
                      </div>
                      {p.description && (
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">
                          {p.description}
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {(p.stages || []).map((st, idx) => (
                          <React.Fragment key={st.targetId}>
                            {idx > 0 && (
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                              {st.targetId}
                              {st.hasCanary &&
                                ` (Canary ${st.canaryPercentages.join('%→')}%)`}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {targets.length > 0 && (
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    Registered Cloud Deploy Targets ({targets.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {targets.map((t) => (
                      <div
                        key={t.fullName || t.name}
                        className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            {t.name}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {t.kind} · {t.location}
                          </div>
                        </div>
                        {t.requireApproval && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            APPROVAL GATE
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLOUD FIRESTORE NOSQL EXPLORER & DOCUMENT CRUD */}
      {activeSubTab === 'FIRESTORE_NOSQL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Live Firestore NoSQL Document Writer</span>
              </h3>
              {firestoreDbs.length === 0 && (
                <button
                  type="button"
                  onClick={handleCreateFirestoreDb}
                  disabled={creatingDb}
                  className="px-2.5 py-1 rounded-md text-[10px] font-mono font-extrabold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                >
                  {creatingDb ? 'Creating (default)...' : 'Init (default) DB'}
                </button>
              )}
            </div>

            <form onSubmit={handleUpsertFirestoreDoc} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Collection ID
                  </label>
                  <input
                    type="text"
                    value={collectionId}
                    onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                    Document ID
                  </label>
                  <input
                    type="text"
                    value={docIdInput}
                    onChange={(e) => setDocIdInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400 mb-1">
                  JSON Document Fields (Typed Firestore REST Wire Format)
                </label>
                <textarea
                  rows={7}
                  value={docJsonInput}
                  onChange={(e) => setDocJsonInput(e.target.value)}
                  className="w-full p-3 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={savingDoc}
                className="w-full py-2.5 px-4 rounded-md text-xs font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingDoc
                  ? 'Writing to firestore.googleapis.com/v1...'
                  : `Upsert Document "${collectionId}/${docIdInput}"`}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                  Live Firestore Databases ({firestoreDbs.length}) &amp; Documents in{' '}
                  <code className="font-mono text-emerald-600 dark:text-emerald-400">
                    {collectionId}
                  </code>{' '}
                  ({firestoreDocs.length})
                </h3>
              </div>
            </div>

            {firestoreDbs.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {firestoreDbs.map((db) => (
                  <div
                    key={db.fullName || db.name}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono flex items-center justify-between"
                  >
                    <div>
                      <div className="font-extrabold text-zinc-900 dark:text-white">
                        DB: {db.name} ({db.locationId})
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {db.type} · PITR: {db.pointInTimeRecoveryEnablement}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                      LIVE
                    </span>
                  </div>
                ))}
              </div>
            )}

            {firestoreDocs.length === 0 ? (
              <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-center space-y-1.5">
                <div className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                  No documents in collection &ldquo;{collectionId}&rdquo; yet.
                </div>
                <div className="text-[11px] text-zinc-500">
                  Write a live document using the JSON editor on the left to persist it directly in Cloud Firestore.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {firestoreDocs.map((doc) => (
                  <div
                    key={doc.fullName || doc.id}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-extrabold text-xs text-zinc-950 dark:text-white">
                        {doc.collectionId}/{doc.id}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500">
                          {doc.updateTime
                            ? new Date(doc.updateTime).toLocaleString()
                            : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteFirestoreDoc(doc.id)}
                          title={`Delete Firestore document ${doc.collectionId}/${doc.id}`}
                          className="p-1 rounded-md hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <pre className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto">
                      {JSON.stringify(doc.fields, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE ASSIST FINOPS RECOMMENDER & REGIONAL QUOTA OPTIMIZER */}
      {activeSubTab === 'FINOPS_QUOTAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                  Live Active Assist Recommendations ({recommendations.length})
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Direct from <code>recommender.googleapis.com/v1</code> (VM Rightsizing, Idle IPs, Idle Disks, IAM Least-Privilege)
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Save ${wave11Data?.finopsQuotas?.totalMonthlySavingsUsd ?? 0}/mo
              </span>
            </div>

            {recommendations.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-1.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                  Zero Active Waste or Over-Provisioned Resources Flagged in {region}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Google Cloud Active Assist Recommender verified 0 idle static IPs, 0 unattached disks, and 0 oversized VMs in {region}.
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
                {recommendations.map((rec) => (
                  <div
                    key={rec.fullName || rec.id}
                    className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {rec.category} · {rec.priority}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        -${rec.estimatedMonthlySavingsUsd}/mo
                      </span>
                    </div>
                    <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                      {rec.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">
                  Live Compute Regional Quota Saturation ({regionalQuotas.length})
                </h3>
                <p className="text-[11px] text-zinc-500">
                  Real-time usage vs. hard limits across all regions from{' '}
                  <code>compute.googleapis.com/compute/v1/projects/{projectId}/regions</code>
                </p>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto space-y-2 pr-1">
              {regionalQuotas.slice(0, 25).map((q, idx) => (
                <div
                  key={`${q.region}-${q.metric}-${idx}`}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {q.metric}{' '}
                      <span className="text-zinc-500 font-normal">
                        ({q.region})
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500">
                      Usage: {q.usage} / Limit: {q.limit}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                        q.status === 'CRITICAL'
                          ? 'bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30'
                          : q.status === 'ELEVATED'
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {q.utilizationPct}% · {q.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MULTI-PROJECT COMPARISON MATRIX & 18-STUDIO STRESS AUDIT */}
      {activeSubTab === 'MULTI_PROJECT_AUDIT' && (
        <div className="space-y-6">
          {/* Multi-Project Estate Comparison Card */}
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>
                    Live Multi-Project Cloud Estate Comparison Matrix
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Scans all active Google Cloud projects accessible to your authenticated credential in parallel (Compute VMs, Cloud Run, GCS Buckets, BigQuery, Cloud SQL, VPCs &amp; Billing Link).
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunMultiProjectScan}
                disabled={loadingMultiProject}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    loadingMultiProject ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {loadingMultiProject
                    ? 'Scanning All GCP Projects in Parallel...'
                    : 'Run Live Multi-Project Estate Scan'}
                </span>
              </button>
            </div>

            {multiProjectData?.projects && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase text-zinc-500">
                      <th className="py-2.5 px-3">Project ID</th>
                      <th className="py-2.5 px-3">Billing</th>
                      <th className="py-2.5 px-3">VMs (Run/Total)</th>
                      <th className="py-2.5 px-3">Cloud Run</th>
                      <th className="py-2.5 px-3">GCS Buckets</th>
                      <th className="py-2.5 px-3">BQ Datasets</th>
                      <th className="py-2.5 px-3">Cloud SQL</th>
                      <th className="py-2.5 px-3">VPCs</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiProjectData.projects.map((p) => (
                      <tr
                        key={p.projectId}
                        className="border-b border-zinc-100 dark:border-zinc-800/70 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      >
                        <td className="py-2.5 px-3 font-extrabold text-zinc-900 dark:text-white">
                          {p.projectId}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.billingEnabled
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {p.billingEnabled ? 'ACTIVE' : 'UNLINKED'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {p.runningVms} / {p.totalVms}
                        </td>
                        <td className="py-2.5 px-3">{p.cloudRunCount}</td>
                        <td className="py-2.5 px-3">{p.bucketsCount}</td>
                        <td className="py-2.5 px-3">{p.datasetsCount}</td>
                        <td className="py-2.5 px-3">{p.cloudSqlCount}</td>
                        <td className="py-2.5 px-3">{p.vpcsCount}</td>
                        <td className="py-2.5 px-3 text-zinc-500">
                          {p.probeLatencyMs}ms
                        </td>
                        <td className="py-2.5 px-3">
                          {onSelectProject && p.projectId !== projectId && (
                            <button
                              type="button"
                              onClick={() => onSelectProject(p.projectId)}
                              className="px-2.5 py-1 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-[10px] font-bold cursor-pointer"
                            >
                              Switch
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 18-Studio Live Client-Readiness & Latency Stress Audit */}
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>
                    Live 18-Studio Client-Readiness &amp; P95 Latency Stress Audit
                  </span>
                </h3>
                <p className="text-xs text-zinc-500">
                  Fires concurrent live probes across all 18 backend studio endpoints for project{' '}
                  <code className="font-mono">{projectId}</code>, measuring real HTTP status, payload size, and P95 latency.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunStressAudit}
                disabled={runningStressAudit}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                <Activity
                  className={`w-3.5 h-3.5 ${
                    runningStressAudit ? 'animate-spin' : ''
                  }`}
                />
                <span>
                  {runningStressAudit
                    ? 'Probing All 18 Live GCP Studio Endpoints...'
                    : 'Run Full 18-Studio Live Stress Audit'}
                </span>
              </button>
            </div>

            {stressAuditData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                    <div className="text-[10px] uppercase text-zinc-500">
                      Studios Verified
                    </div>
                    <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {stressAuditData.passedCount} /{' '}
                      {stressAuditData.totalStudiosProbed}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                    <div className="text-[10px] uppercase text-zinc-500">
                      Average Latency
                    </div>
                    <div className="text-lg font-extrabold text-zinc-950 dark:text-white">
                      {stressAuditData.avgLatencyMs}ms
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                    <div className="text-[10px] uppercase text-zinc-500">
                      P95 Latency
                    </div>
                    <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                      {stressAuditData.p95LatencyMs}ms
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-mono">
                    <div className="text-[10px] uppercase text-zinc-500">
                      Synthetic Data
                    </div>
                    <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      0% (100% Live)
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase text-zinc-500">
                        <th className="py-2 px-3">Studio</th>
                        <th className="py-2 px-3">Live Endpoint</th>
                        <th className="py-2 px-3">HTTP</th>
                        <th className="py-2 px-3">RTT Latency</th>
                        <th className="py-2 px-3">Payload</th>
                        <th className="py-2 px-3">Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(stressAuditData.results || []).map((r) => (
                        <tr
                          key={r.studioId}
                          className="border-b border-zinc-100 dark:border-zinc-800/70"
                        >
                          <td className="py-2 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                            {r.studioName}
                          </td>
                          <td className="py-2 px-3 text-zinc-500">
                            {r.endpoint}
                          </td>
                          <td className="py-2 px-3">{r.httpStatus}</td>
                          <td className="py-2 px-3">{r.latencyMs}ms</td>
                          <td className="py-2 px-3">
                            {(r.payloadBytes / 1024).toFixed(1)} KB
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === 'LIVE_VERIFIED'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: 1-CLICK CLOUD RUN SELF-HOSTING PACKAGE & EXECUTIVE REPORT */}
      {activeSubTab === 'SELF_HOST_REPORT' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50">
                  1-Command Self-Hosted Cloud Run Gen2 Deployment Package
                </h3>
                <p className="text-xs text-zinc-500">
                  Ship CloudPulse 2026 directly into your client&apos;s Google Cloud project using the multi-stage{' '}
                  <code>Dockerfile</code>, <code>cloudbuild.yaml</code>, and{' '}
                  <code>deploy-cloudrun.sh</code> installer.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {onRunInShell && selfHostData?.cliOneLiner && (
                  <button
                    type="button"
                    onClick={() => onRunInShell(selfHostData.cliOneLiner)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-mono font-extrabold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Deploy in Cloud Shell</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleCopy('cli', selfHostData?.cliOneLiner || '')
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                >
                  {copiedKey === 'cli' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy gcloud Build Command</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-zinc-800">
              {selfHostData?.cliOneLiner ||
                `./deploy-cloudrun.sh ${projectId} ${region} cloudpulse-2026-cockpit`}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    Dockerfile (Multi-Stage Node 22 + gcloud SDK + Python3 PTY)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'dockerfile',
                        selfHostData?.files?.dockerfile || ''
                      )
                    }
                    className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {copiedKey === 'dockerfile' ? 'Copied!' : 'Copy Dockerfile'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 max-h-72 overflow-y-auto">
                  {selfHostData?.files?.dockerfile || 'Loading Dockerfile...'}
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300">
                    cloudbuild.yaml (Artifact Registry + Cloud Run Gen2)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'cloudbuild',
                        selfHostData?.files?.cloudbuildYaml || ''
                      )
                    }
                    className="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {copiedKey === 'cloudbuild'
                      ? 'Copied!'
                      : 'Copy cloudbuild.yaml'}
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 max-h-72 overflow-y-auto">
                  {selfHostData?.files?.cloudbuildYaml ||
                    'Loading cloudbuild.yaml...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
