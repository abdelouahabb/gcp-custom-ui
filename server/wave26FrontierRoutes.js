import tls from 'tls';
import dns from 'dns';
import https from 'https';
import axios from 'axios';

const PROJECT_ID_REGEX = /^[a-z0-9][a-z0-9-]{2,62}$/i;
const POOL_ID_REGEX = /^[a-z0-9-]{4,32}$/;
const PUBSUB_ID_REGEX = /^[a-zA-Z][a-zA-Z0-9-_.~+%]{2,254}$/;
const DOMAIN_REGEX = /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
const GPU_METRIC_REGEX = /GPU|NVIDIA|A100|H100|L4|T4/i;

const httpsAgent = new https.Agent({ family: 4, autoSelectFamily: false, keepAlive: true });
const gcp = axios.create({ httpsAgent, timeout: 15000, validateStatus: () => true });

function sanitizeProjectId(raw) {
  const v = String(raw || '').trim();
  return PROJECT_ID_REGEX.test(v) ? v : null;
}

function escapeRegex(str) {
  return String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shortName(full) {
  const parts = String(full || '').split('/');
  return parts[parts.length - 1] || '';
}

function classifyApiResult(r) {
  if (r.ok) return 'ENABLED';
  const msg = String(r.error || '');
  if (r.status === 403 && /has not been used|disabled|SERVICE_DISABLED/i.test(msg)) return 'API_DISABLED';
  if (r.status === 403 || r.status === 401) return 'PERMISSION_DENIED';
  if (r.status === 404) return 'NOT_FOUND';
  return 'UNAVAILABLE';
}

async function resolveToken(getLocalOrMetadataAccessToken) {
  if (typeof getLocalOrMetadataAccessToken !== 'function') return null;
  try {
    const out = await getLocalOrMetadataAccessToken();
    return out?.token || null;
  } catch {
    return null;
  }
}

async function gGet(url, token, params, timeoutMs = 15000) {
  try {
    const res = await gcp.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      params,
      timeout: timeoutMs,
    });
    if (res.status >= 400) {
      return {
        ok: false,
        status: res.status,
        error: res.data?.error?.message || `HTTP ${res.status}`,
        data: res.data,
      };
    }
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    return { ok: false, status: 0, error: err?.message || 'Request failed' };
  }
}

async function gSend(method, url, token, body, params, timeoutMs = 15000) {
  try {
    const res = await gcp.request({
      method,
      url,
      data: body,
      params,
      timeout: timeoutMs,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (res.status >= 400) {
      return {
        ok: false,
        status: res.status,
        error: res.data?.error?.message || `HTTP ${res.status}`,
        data: res.data,
      };
    }
    return { ok: true, status: res.status, data: res.data };
  } catch (err) {
    return { ok: false, status: 0, error: err?.message || 'Request failed' };
  }
}

async function gPaged(url, token, key, extraParams = {}, maxPages = 4) {
  const items = [];
  let pageToken;
  let last = { ok: true, status: 200 };
  for (let i = 0; i < maxPages; i += 1) {
    const r = await gGet(url, token, { ...extraParams, ...(pageToken ? { pageToken } : {}) });
    last = r;
    if (!r.ok) {
      return { ok: i > 0, status: r.status, error: r.error, items };
    }
    items.push(...(r.data?.[key] || []));
    pageToken = r.data?.nextPageToken;
    if (!pageToken) break;
  }
  return { ok: true, status: last.status, items };
}

function normalizeQuotaEntry(rawQuota, projectId, scope, regionName = 'global') {
  const metric = String(rawQuota?.metric || 'UNKNOWN');
  const usage = Number(rawQuota?.usage || 0);
  const limit = Number(rawQuota?.limit || 0);
  const rawPct = limit > 0 ? (usage / limit) * 100 : 0;
  const utilizationPct = Math.max(0, Math.round(rawPct * 100) / 100);
  const severity =
    utilizationPct >= 85 ? 'CRITICAL' : utilizationPct >= 70 ? 'WARNING' : 'HEALTHY';
  const isGpu = GPU_METRIC_REGEX.test(metric);
  const quotaCli = `gcloud alpha services quota list --service=compute.googleapis.com --consumer=projects/${projectId} --filter="metric:${metric}"`;
  return {
    metric,
    usage,
    limit,
    utilizationPct,
    severity,
    scope,
    region: regionName,
    isGpu,
    quotaCli,
  };
}

function sortQuotasDesc(list) {
  return [...list].sort((a, b) => {
    if (b.utilizationPct !== a.utilizationPct) return b.utilizationPct - a.utilizationPct;
    if (b.usage !== a.usage) return b.usage - a.usage;
    if (b.limit !== a.limit) return b.limit - a.limit;
    return a.metric.localeCompare(b.metric);
  });
}

function buildOidcYamlTemplates(projectId, firstPoolId = 'github-actions-pool', firstProviderId = 'github-oidc', sampleSaEmail = '') {
  const saEmail = sampleSaEmail || `ci-deployer@${projectId}.iam.gserviceaccount.com`;
  const wifProviderPath = `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/${firstPoolId}/providers/${firstProviderId}`;
  const githubActions = [
    'name: Deploy Keyless via GCP Workload Identity Federation',
    'on:',
    '  push:',
    '    branches: [main]',
    'permissions:',
    '  contents: read',
    '  id-token: write',
    'jobs:',
    '  deploy:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - id: auth',
    '        uses: google-github-actions/auth@v2',
    '        with:',
    `          project_id: '${projectId}'`,
    `          workload_identity_provider: '${wifProviderPath}'`,
    `          service_account: '${saEmail}'`,
    '      - name: Verify Keyless ADC Token',
    `        run: gcloud auth list && gcloud config set project ${projectId}`,
  ].join('\n');

  const gitlabCi = [
    'deploy_gcp_keyless:',
    '  image: google/cloud-sdk:slim',
    '  id_tokens:',
    '    GITLAB_OIDC_TOKEN:',
    `      aud: https://iam.googleapis.com/${wifProviderPath}`,
    '  script:',
    '    - echo "${GITLAB_OIDC_TOKEN}" > /tmp/oidc_token.jwt',
    '    - gcloud iam workload-identity-pools create-cred-config',
    `        ${wifProviderPath}`,
    `        --service-account="${saEmail}"`,
    '        --credential-source-file=/tmp/oidc_token.jwt',
    '        --output-file=/tmp/gcp_cred_config.json',
    '    - gcloud auth login --cred-file=/tmp/gcp_cred_config.json',
    `    - gcloud config set project ${projectId}`,
  ].join('\n');

  return { githubActions, gitlabCi };
}

function sanitizeDomainInput(raw) {
  let clean = String(raw || '').trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//i, '');
  clean = clean.split('/')[0].split('?')[0].split('#')[0];
  clean = clean.replace(/:\d+$/, '').replace(/\.$/, '');
  if (!clean || !DOMAIN_REGEX.test(clean)) return null;
  if (clean === 'localhost' || clean.endsWith('.local') || clean.endsWith('.internal')) return null;
  return clean;
}

function withTimeout(promise, ms, fallbackValue) {
  let timer = null;
  const timeoutPromise = new Promise((resolve) => {
    timer = setTimeout(() => resolve(fallbackValue), ms);
  });
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    timeoutPromise,
  ]);
}

async function timedResolve(resolver, fnName, target) {
  const start = process.hrtime.bigint();
  try {
    const out = await withTimeout(
      resolver[fnName](target),
      2800,
      { __timedOut: true }
    );
    const rttMs = Math.round(Number(process.hrtime.bigint() - start) / 1e5) / 10;
    if (out && out.__timedOut) {
      return { records: [], rttMs, error: 'TIMEOUT' };
    }
    return { records: Array.isArray(out) ? out : [], rttMs, error: null };
  } catch (err) {
    const rttMs = Math.round(Number(process.hrtime.bigint() - start) / 1e5) / 10;
    const code = err?.code || '';
    if (code === 'ENODATA' || code === 'ENOTFOUND' || code === 'ESERVFAIL' || code === 'EREFUSED') {
      return { records: [], rttMs, error: code === 'ENODATA' ? null : code };
    }
    return { records: [], rttMs, error: err?.code || err?.message || 'DNS_ERROR' };
  }
}

async function probeSingleResolver(label, serverIp, domain) {
  const resolver = new dns.promises.Resolver({ timeout: 2500, tries: 1 });
  resolver.setServers([serverIp]);

  const startAll = process.hrtime.bigint();
  const [aRes, aaaaRes, mxRes, txtRes, caaRes, nsRes, dmarcRes] = await Promise.all([
    timedResolve(resolver, 'resolve4', domain),
    timedResolve(resolver, 'resolve6', domain),
    timedResolve(resolver, 'resolveMx', domain),
    timedResolve(resolver, 'resolveTxt', domain),
    timedResolve(resolver, 'resolveCaa', domain),
    timedResolve(resolver, 'resolveNs', domain),
    timedResolve(resolver, 'resolveTxt', `_dmarc.${domain}`),
  ]);
  const totalRttMs = Math.round(Number(process.hrtime.bigint() - startAll) / 1e5) / 10;

  const txtFlat = (txtRes.records || []).map((chunks) =>
    Array.isArray(chunks) ? chunks.join('') : String(chunks || '')
  );
  const dmarcFlat = (dmarcRes.records || []).map((chunks) =>
    Array.isArray(chunks) ? chunks.join('') : String(chunks || '')
  );

  return {
    provider: label,
    server: serverIp,
    rttMs: aRes.rttMs || totalRttMs,
    totalRttMs,
    A: aRes.records,
    AAAA: aaaaRes.records,
    MX: mxRes.records,
    TXT: txtFlat,
    CAA: caaRes.records,
    NS: nsRes.records,
    DMARC: dmarcFlat,
    records: {
      A: aRes.records,
      AAAA: aaaaRes.records,
      MX: mxRes.records,
      TXT: txtFlat,
      CAA: caaRes.records,
      NS: nsRes.records,
      DMARC: dmarcFlat,
    },
    timingsMs: {
      A: aRes.rttMs,
      AAAA: aaaaRes.rttMs,
      MX: mxRes.rttMs,
      TXT: txtRes.rttMs,
      CAA: caaRes.rttMs,
      NS: nsRes.rttMs,
      DMARC: dmarcRes.rttMs,
    },
    error: aRes.error || null,
  };
}

function probeTlsCertificate(domain) {
  return new Promise((resolve) => {
    const start = process.hrtime.bigint();
    let settled = false;
    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };

    const sock = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      rejectUnauthorized: false,
      timeout: 5500,
    });

    const guardTimer = setTimeout(() => {
      try {
        sock.destroy();
      } catch {
        // ignore
      }
      finish({
        reachable: false,
        host: domain,
        port: 443,
        error: 'TLS handshake timed out after 5500ms',
      });
    }, 5800);

    sock.once('secureConnect', () => {
      clearTimeout(guardTimer);
      const handshakeMs = Math.round(Number(process.hrtime.bigint() - start) / 1e5) / 10;
      try {
        const cert = sock.getPeerCertificate(false) || {};
        const protocol = sock.getProtocol() || 'UNKNOWN';
        const validToMs = cert.valid_to ? Date.parse(cert.valid_to) : NaN;
        const daysRemaining = Number.isFinite(validToMs)
          ? Math.floor((validToMs - Date.now()) / 86400000)
          : null;
        sock.destroy();
        finish({
          reachable: true,
          host: domain,
          port: 443,
          handshakeMs,
          authorized: Boolean(sock.authorized),
          authorizationError: sock.authorizationError ? String(sock.authorizationError) : null,
          protocol,
          subject: cert.subject || {},
          issuer: cert.issuer || {},
          subjectCN: cert.subject?.CN || domain,
          issuerCN: cert.issuer?.CN || cert.issuer?.O || 'Unknown CA',
          valid_from: cert.valid_from || null,
          valid_to: cert.valid_to || null,
          daysRemaining,
          serialNumber: cert.serialNumber || null,
          fingerprint256: cert.fingerprint256 || null,
          subjectaltname: cert.subjectaltname || null,
        });
      } catch (err) {
        try {
          sock.destroy();
        } catch {
          // ignore
        }
        finish({
          reachable: false,
          host: domain,
          port: 443,
          error: err?.message || 'Failed to inspect peer certificate',
        });
      }
    });

    sock.once('timeout', () => {
      clearTimeout(guardTimer);
      try {
        sock.destroy();
      } catch {
        // ignore
      }
      finish({
        reachable: false,
        host: domain,
        port: 443,
        error: 'TLS socket timeout on port 443',
      });
    });

    sock.once('error', (err) => {
      clearTimeout(guardTimer);
      try {
        sock.destroy();
      } catch {
        // ignore
      }
      finish({
        reachable: false,
        host: domain,
        port: 443,
        error: err?.message || 'TLS connection failed',
      });
    });
  });
}

function normalizePubsubResource(raw, projectId, collection) {
  const input = String(raw || '').trim();
  if (!input) return null;
  const expectedPrefix = `projects/${projectId}/${collection}/`;
  if (input.startsWith('projects/')) {
    if (!input.startsWith(expectedPrefix)) return null;
    const id = input.slice(expectedPrefix.length);
    return PUBSUB_ID_REGEX.test(id) ? input : null;
  }
  return PUBSUB_ID_REGEX.test(input) ? `${expectedPrefix}${input}` : null;
}

export function registerWave26FrontierRoutes(app, { getLocalOrMetadataAccessToken } = {}) {
  // ==========================================================================
  // 1. GET /api/project/:id/frontier/quotas
  // ==========================================================================
  app.get('/api/project/:id/frontier/quotas', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
    }
    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No active Google Cloud access token.' });
    }

    try {
      const baseCompute = `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(projectId)}`;
      const [projRes, regRes] = await Promise.all([
        gGet(baseCompute, token),
        gPaged(`${baseCompute}/regions`, token, 'items', { maxResults: 500 }, 3),
      ]);

      const rawProjectQuotas = Array.isArray(projRes.data?.quotas) ? projRes.data.quotas : [];
      const projectQuotas = sortQuotasDesc(
        rawProjectQuotas.map((q) => normalizeQuotaEntry(q, projectId, 'PROJECT', 'global'))
      );

      const allRegionalQuotas = [];
      for (const regionObj of regRes.items || []) {
        const regionName = String(regionObj?.name || 'unknown');
        for (const q of regionObj?.quotas || []) {
          allRegionalQuotas.push(normalizeQuotaEntry(q, projectId, 'REGION', regionName));
        }
      }

      const sortedRegionalAll = sortQuotasDesc(allRegionalQuotas);
      const allCombined = [...projectQuotas, ...sortedRegionalAll];

      let criticalCount = 0;
      let warningCount = 0;
      let maxUtilizationPct = 0;
      for (const item of allCombined) {
        if (item.severity === 'CRITICAL') criticalCount += 1;
        else if (item.severity === 'WARNING') warningCount += 1;
        if (item.utilizationPct > maxUtilizationPct) {
          maxUtilizationPct = item.utilizationPct;
        }
      }

      const gpuQuotas = sortQuotasDesc(allCombined.filter((q) => q.isGpu)).slice(0, 250);
      const regionalQuotas = sortedRegionalAll.slice(0, 350);
      const quotaCli = `gcloud alpha services quota list --service=compute.googleapis.com --consumer=projects/${projectId}`;

      return res.json({
        ok: true,
        projectId,
        timestamp: new Date().toISOString(),
        summary: {
          totalMetrics: allCombined.length,
          criticalCount,
          warningCount,
          healthyCount: Math.max(0, allCombined.length - criticalCount - warningCount),
          gpuCount: gpuQuotas.length,
          maxUtilizationPct,
          peakUtilizationPct: maxUtilizationPct,
        },
        quotaCli,
        projectQuotas,
        regionalQuotas,
        gpuQuotas,
        apiStatus: {
          computeProject: classifyApiResult(projRes),
          computeRegions: classifyApiResult(regRes),
          error: projRes.error || regRes.error || null,
          enableApiCmd: `gcloud services enable compute.googleapis.com --project=${projectId}`,
        },
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to inspect Compute Engine quotas.',
      });
    }
  });

  // ==========================================================================
  // 2. POST /api/project/:id/frontier/quota-alert
  // ==========================================================================
  app.post('/api/project/:id/frontier/quota-alert', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
    }
    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No active Google Cloud access token.' });
    }

    const metricName = String(req.body?.metricName || '').trim();
    const thresholdRaw = req.body?.thresholdPct ?? 80;
    const thresholdPct = Number(thresholdRaw);
    if (!metricName || !/^[a-zA-Z0-9_./-]+$/.test(metricName)) {
      return res.status(400).json({ ok: false, error: 'A valid quota metricName is required.' });
    }
    if (!Number.isFinite(thresholdPct) || thresholdPct < 1 || thresholdPct > 100) {
      return res.status(400).json({ ok: false, error: 'thresholdPct must be between 1 and 100.' });
    }

    const limitHint = Number(req.body?.limit || 0);
    const thresholdValue =
      limitHint > 0
        ? Math.max(1, Math.round((limitHint * thresholdPct) / 100))
        : thresholdPct;

    const policyBody = {
      displayName: `CloudPulse Quota Guard: ${metricName} >= ${thresholdPct}%`,
      combiner: 'OR',
      documentation: {
        content: `Alert synthesized by CloudPulse Ops Frontier for project \`${projectId}\` when quota metric \`${metricName}\` crosses ${thresholdPct}%.`,
        mimeType: 'text/markdown',
      },
      userLabels: {
        managed_by: 'cloudpulse-ops-frontier',
        quota_metric: metricName.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 60),
      },
      conditions: [
        {
          displayName: `Consumer Quota Usage (${metricName}) > ${thresholdPct}%`,
          conditionThreshold: {
            filter:
              'metric.type="serviceruntime.googleapis.com/quota/allocation/usage" AND resource.type="consumer_quota"',
            aggregations: [
              {
                alignmentPeriod: '3600s',
                perSeriesAligner: 'ALIGN_MAX',
              },
            ],
            comparison: 'COMPARISON_GT',
            thresholdValue,
            duration: '0s',
          },
        },
      ],
      enabled: true,
    };

    const url = `https://monitoring.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/alertPolicies`;
    const r = await gSend('POST', url, token, policyBody);
    if (!r.ok) {
      return res.status(422).json({
        ok: false,
        error: r.error || 'Cloud Monitoring rejected alert policy creation.',
        status: r.status,
        enableApiCmd: `gcloud services enable monitoring.googleapis.com --project=${projectId}`,
      });
    }

    return res.json({
      ok: true,
      projectId,
      metricName,
      thresholdPct,
      alertPolicyName: r.data?.name || null,
      displayName: r.data?.displayName || policyBody.displayName,
      policy: r.data,
    });
  });

  // ==========================================================================
  // 3. GET /api/project/:id/frontier/wif-overview
  // ==========================================================================
  app.get('/api/project/:id/frontier/wif-overview', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
    }
    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No active Google Cloud access token.' });
    }

    try {
      const saUrl = `https://iam.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/serviceAccounts`;
      const poolsUrl = `https://iam.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/global/workloadIdentityPools`;

      const [saRes, poolsRes] = await Promise.all([
        gPaged(saUrl, token, 'accounts', { pageSize: 100 }, 2),
        gPaged(poolsUrl, token, 'workloadIdentityPools', { pageSize: 100, showDeleted: false }, 2),
      ]);

      const rawAccounts = saRes.items || [];
      const inspectedAccounts = rawAccounts.slice(0, 15);

      const keyLists = await Promise.all(
        inspectedAccounts.map(async (sa) => {
          const email = String(sa?.email || '').trim();
          if (!email) return { email: '', keys: [] };
          const keysUrl = `https://iam.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/serviceAccounts/${encodeURIComponent(email)}/keys`;
          const kr = await gGet(keysUrl, token, { keyTypes: 'USER_MANAGED' });
          return {
            sa,
            email,
            keys: kr.ok && Array.isArray(kr.data?.keys) ? kr.data.keys : [],
          };
        })
      );

      const riskyKeys = [];
      const keyCountBySa = new Map();
      const nowMs = Date.now();

      for (const entry of keyLists) {
        const list = entry.keys || [];
        keyCountBySa.set(entry.email, list.length);
        for (const k of list) {
          const createdMs = k.validAfterTime ? Date.parse(k.validAfterTime) : NaN;
          const ageDays = Number.isFinite(createdMs)
            ? Math.max(0, Math.floor((nowMs - createdMs) / 86400000))
            : 0;
          const severity =
            ageDays >= 90 ? 'CRITICAL' : ageDays >= 30 ? 'WARNING' : 'ACTIVE_KEY';
          riskyKeys.push({
            keyName: k.name || '',
            keyId: shortName(k.name),
            serviceAccountEmail: entry.email,
            serviceAccountDisplayName: entry.sa?.displayName || entry.email,
            keyAlgorithm: k.keyAlgorithm || 'KEY_ALG_RSA_2048',
            keyOrigin: k.keyOrigin || 'GOOGLE_PROVIDED',
            keyType: k.keyType || 'USER_MANAGED',
            validAfterTime: k.validAfterTime || null,
            validBeforeTime: k.validBeforeTime || null,
            ageDays,
            severity,
          });
        }
      }

      riskyKeys.sort((a, b) => b.ageDays - a.ageDays);

      const serviceAccounts = rawAccounts.map((sa) => ({
        name: sa.name || '',
        email: sa.email || '',
        displayName: sa.displayName || sa.email || '',
        uniqueId: sa.uniqueId || '',
        disabled: Boolean(sa.disabled),
        userManagedKeyCount: keyCountBySa.get(sa.email) ?? 0,
        keysInspected: keyCountBySa.has(sa.email),
      }));

      const rawPools = poolsRes.items || [];
      const pools = await Promise.all(
        rawPools.slice(0, 15).map(async (pool) => {
          const poolName = String(pool?.name || '');
          const provRes = poolName
            ? await gGet(`https://iam.googleapis.com/v1/${poolName}/providers`, token, {
                pageSize: 50,
                showDeleted: false,
              })
            : { ok: false, data: {} };
          const providers = Array.isArray(provRes.data?.workloadIdentityPoolProviders)
            ? provRes.data.workloadIdentityPoolProviders.map((p) => ({
                name: p.name || '',
                providerId: shortName(p.name),
                displayName: p.displayName || shortName(p.name),
                state: p.state || 'ACTIVE',
                disabled: Boolean(p.disabled),
                issuerUri: p.oidc?.issuerUri || (p.aws ? `aws:${p.aws.accountId}` : ''),
              }))
            : [];
          return {
            name: poolName,
            poolId: shortName(poolName),
            displayName: pool.displayName || shortName(poolName),
            description: pool.description || '',
            state: pool.state || 'ACTIVE',
            disabled: Boolean(pool.disabled),
            providerCount: providers.length,
            providers,
          };
        })
      );

      const firstPoolId = pools[0]?.poolId || 'github-actions-pool';
      const firstProviderId = pools[0]?.providers?.[0]?.providerId || 'github-oidc';
      const firstSaEmail = serviceAccounts[0]?.email || '';
      const oidcYamlTemplates = buildOidcYamlTemplates(
        projectId,
        firstPoolId,
        firstProviderId,
        firstSaEmail
      );

      return res.json({
        ok: true,
        projectId,
        timestamp: new Date().toISOString(),
        summary: {
          serviceAccountCount: serviceAccounts.length,
          inspectedServiceAccountCount: inspectedAccounts.length,
          riskyKeyCount: riskyKeys.length,
          criticalKeyCount: riskyKeys.filter((k) => k.ageDays >= 90).length,
          poolCount: pools.length,
          providerCount: pools.reduce((acc, p) => acc + p.providerCount, 0),
        },
        riskyKeys,
        pools,
        serviceAccounts,
        oidcYamlTemplates,
        apiStatus: {
          iamServiceAccounts: classifyApiResult(saRes),
          workloadIdentityPools: classifyApiResult(poolsRes),
          error: saRes.error || poolsRes.error || null,
          enableApiCmd: `gcloud services enable iam.googleapis.com iamcredentials.googleapis.com sts.googleapis.com --project=${projectId}`,
        },
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to load Workload Identity Federation overview.',
      });
    }
  });

  // ==========================================================================
  // 4. POST /api/project/:id/frontier/wif-action
  // ==========================================================================
  app.post('/api/project/:id/frontier/wif-action', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
    }
    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No active Google Cloud access token.' });
    }

    const action = String(req.body?.action || '').trim().toUpperCase();

    if (action === 'CREATE_WIF_POOL') {
      const poolId = String(req.body?.poolId || '').trim().toLowerCase();
      const displayName = String(req.body?.displayName || poolId).trim().slice(0, 32);
      const description = String(
        req.body?.description || `Zero-Trust OIDC Workload Identity Pool for ${projectId}`
      )
        .trim()
        .slice(0, 250);

      if (!POOL_ID_REGEX.test(poolId) || poolId.startsWith('gcp-')) {
        return res.status(400).json({
          ok: false,
          error:
            'poolId must be 4-32 lowercase alphanumeric/hyphen characters and cannot start with "gcp-".',
        });
      }

      const url = `https://iam.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/global/workloadIdentityPools`;
      const r = await gSend(
        'POST',
        url,
        token,
        { displayName: displayName || poolId, description },
        { workloadIdentityPoolId: poolId }
      );

      if (!r.ok) {
        return res.status(422).json({
          ok: false,
          error: r.error || 'Failed to create Workload Identity Pool.',
          status: r.status,
          enableApiCmd: `gcloud services enable iam.googleapis.com sts.googleapis.com --project=${projectId}`,
        });
      }

      return res.json({
        ok: true,
        action,
        projectId,
        poolId,
        operation: r.data?.name || null,
        result: r.data,
      });
    }

    if (action === 'DELETE_SA_KEY') {
      const keyName = String(req.body?.keyName || '').trim();
      const keyPattern = new RegExp(
        `^projects/${escapeRegex(projectId)}/serviceAccounts/[^/]+/keys/[a-zA-Z0-9_-]+$`
      );
      if (!keyPattern.test(keyName)) {
        return res.status(400).json({
          ok: false,
          error: `keyName must belong to project "${projectId}" (projects/${projectId}/serviceAccounts/<email>/keys/<keyId>).`,
        });
      }

      const r = await gSend('DELETE', `https://iam.googleapis.com/v1/${keyName}`, token);
      if (!r.ok) {
        return res.status(422).json({
          ok: false,
          error: r.error || 'Failed to delete service account key.',
          status: r.status,
        });
      }

      return res.json({
        ok: true,
        action,
        projectId,
        deletedKeyName: keyName,
      });
    }

    return res.status(400).json({
      ok: false,
      error: `Unsupported WIF action "${action}". Expected CREATE_WIF_POOL or DELETE_SA_KEY.`,
    });
  });

  // ==========================================================================
  // 5. GET /api/project/:id/frontier/dns-overview
  // ==========================================================================
  app.get('/api/project/:id/frontier/dns-overview', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
    }
    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No active Google Cloud access token.' });
    }

    try {
      const zonesUrl = `https://dns.googleapis.com/dns/v1/projects/${encodeURIComponent(projectId)}/managedZones`;
      const certsUrl = `https://certificatemanager.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/global/certificates`;

      const [zonesRes, certsRes] = await Promise.all([
        gPaged(zonesUrl, token, 'managedZones', { maxResults: 100 }, 2),
        gPaged(certsUrl, token, 'certificates', { pageSize: 100 }, 2),
      ]);

      const rawZones = zonesRes.items || [];
      const rrsetMap = new Map();
      await Promise.all(
        rawZones.slice(0, 5).map(async (z) => {
          const zName = String(z?.name || '');
          if (!zName) return;
          const rrUrl = `https://dns.googleapis.com/dns/v1/projects/${encodeURIComponent(projectId)}/managedZones/${encodeURIComponent(zName)}/rrsets`;
          const rrRes = await gGet(rrUrl, token, { maxResults: 200 });
          if (rrRes.ok && Array.isArray(rrRes.data?.rrsets)) {
            rrsetMap.set(
              zName,
              rrRes.data.rrsets.map((r) => ({
                name: r.name || '',
                type: r.type || '',
                ttl: Number(r.ttl || 0),
                rrdatas: Array.isArray(r.rrdatas) ? r.rrdatas : [],
              }))
            );
          } else {
            rrsetMap.set(zName, []);
          }
        })
      );

      const zones = rawZones.map((z) => {
        const recordSets = rrsetMap.get(z.name) || [];
        const dnssecState = z.dnssecConfig?.state || 'off';
        return {
          id: String(z.id || ''),
          name: z.name || '',
          dnsName: z.dnsName || '',
          description: z.description || '',
          visibility: z.visibility || 'public',
          dnssecState,
          dnssecEnabled: dnssecState === 'on',
          nameServers: Array.isArray(z.nameServers) ? z.nameServers : [],
          creationTime: z.creationTime || null,
          recordCount: recordSets.length,
          recordSets,
        };
      });

      const nowMs = Date.now();
      const certificates = (certsRes.items || []).map((c) => {
        const expireMs = c.expireTime ? Date.parse(c.expireTime) : NaN;
        const daysRemaining = Number.isFinite(expireMs)
          ? Math.floor((expireMs - nowMs) / 86400000)
          : null;
        return {
          name: c.name || '',
          certificateId: shortName(c.name),
          description: c.description || '',
          sanDnsnames: Array.isArray(c.sanDnsnames) ? c.sanDnsnames : [],
          expireTime: c.expireTime || null,
          daysRemaining,
          scope: c.scope || 'DEFAULT',
          state: c.managed?.state || (c.selfManaged ? 'SELF_MANAGED' : 'ACTIVE'),
          provisioningIssue: c.managed?.provisioningIssue?.reason || null,
        };
      });

      return res.json({
        ok: true,
        projectId,
        timestamp: new Date().toISOString(),
        summary: {
          zoneCount: zones.length,
          totalRecordSets: zones.reduce((sum, z) => sum + z.recordCount, 0),
          dnssecEnabledCount: zones.filter((z) => z.dnssecEnabled).length,
          certificateCount: certificates.length,
        },
        zones,
        certificates,
        apiStatus: {
          cloudDns: classifyApiResult(zonesRes),
          certificateManager: classifyApiResult(certsRes),
          error: zonesRes.error || certsRes.error || null,
          enableApiCmd: `gcloud services enable dns.googleapis.com certificatemanager.googleapis.com --project=${projectId}`,
        },
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to fetch Cloud DNS & Certificate Manager inventory.',
      });
    }
  });

  // ==========================================================================
  // 6. POST /api/project/:id/frontier/dns-probe
  // ==========================================================================
  app.post('/api/project/:id/frontier/dns-probe', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
    }

    const domain = sanitizeDomainInput(req.body?.domain);
    if (!domain) {
      return res.status(400).json({
        ok: false,
        error: 'A valid public domain name (for example "cloud.google.com") is required.',
      });
    }

    try {
      const [google, cloudflare, tlsCert] = await Promise.all([
        probeSingleResolver('Google Public DNS', '8.8.8.8', domain),
        probeSingleResolver('Cloudflare 1.1.1.1', '1.1.1.1', domain),
        probeTlsCertificate(domain),
      ]);

      const combinedTxt = [...(google.TXT || []), ...(cloudflare.TXT || [])];
      const combinedDmarc = [...(google.DMARC || []), ...(cloudflare.DMARC || [])];
      const combinedCaa = [...(google.CAA || []), ...(cloudflare.CAA || [])];

      const spfRecord = combinedTxt.find((t) => /\bv=spf1\b/i.test(t)) || null;
      const dmarcRecord = combinedDmarc.find((t) => /\bv=DMARC1\b/i.test(t)) || null;
      const hasSpf = Boolean(spfRecord);
      const hasDmarc = Boolean(dmarcRecord);
      const hasCaa = combinedCaa.length > 0;

      const googleASorted = [...(google.A || [])].sort().join(',');
      const cfASorted = [...(cloudflare.A || [])].sort().join(',');
      const resolverConsistent =
        googleASorted === cfASorted || (google.A.length > 0 && cloudflare.A.length > 0);

      return res.json({
        ok: true,
        projectId,
        timestamp: new Date().toISOString(),
        domain,
        resolvers: {
          google,
          cloudflare,
        },
        securityPosture: {
          hasSpf,
          spfRecord,
          hasDmarc,
          dmarcRecord,
          hasCaa,
          caaCount: combinedCaa.length,
          resolverConsistent,
        },
        tlsCert,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Multi-resolver DNS & TLS probe failed.',
      });
    }
  });

  // ==========================================================================
  // 7. GET /api/project/:id/frontier/pubsub-overview
  // ==========================================================================
  app.get('/api/project/:id/frontier/pubsub-overview', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
    }
    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No active Google Cloud access token.' });
    }

    try {
      const base = `https://pubsub.googleapis.com/v1/projects/${encodeURIComponent(projectId)}`;
      const [topicsRes, subsRes, snapsRes] = await Promise.all([
        gPaged(`${base}/topics`, token, 'topics', { pageSize: 200 }, 2),
        gPaged(`${base}/subscriptions`, token, 'subscriptions', { pageSize: 200 }, 2),
        gPaged(`${base}/snapshots`, token, 'snapshots', { pageSize: 200 }, 2),
      ]);

      const topics = (topicsRes.items || []).map((t) => ({
        name: t.name || '',
        topicId: shortName(t.name),
        shortName: shortName(t.name),
        messageRetentionDuration: t.messageRetentionDuration || null,
        kmsKeyName: t.kmsKeyName || null,
        schemaSettings: t.schemaSettings || null,
        labels: t.labels || {},
      }));

      const subscriptions = (subsRes.items || []).map((s) => ({
        name: s.name || '',
        subscriptionId: shortName(s.name),
        shortName: shortName(s.name),
        topic: s.topic || '',
        topicShortName: shortName(s.topic),
        ackDeadlineSeconds: Number(s.ackDeadlineSeconds || 10),
        retainAckedMessages: Boolean(s.retainAckedMessages),
        messageRetentionDuration: s.messageRetentionDuration || '604800s',
        enableMessageOrdering: Boolean(s.enableMessageOrdering),
        enableExactlyOnceDelivery: Boolean(s.enableExactlyOnceDelivery),
        deadLetterPolicy: s.deadLetterPolicy || null,
        hasDlq: Boolean(s.deadLetterPolicy?.deadLetterTopic),
        deadLetterTopic: s.deadLetterPolicy?.deadLetterTopic || null,
        maxDeliveryAttempts: s.deadLetterPolicy?.maxDeliveryAttempts || null,
        pushEndpoint: s.pushConfig?.pushEndpoint || null,
        state: s.state || 'ACTIVE',
      }));

      const snapshots = (snapsRes.items || []).map((sn) => ({
        name: sn.name || '',
        snapshotId: shortName(sn.name),
        shortName: shortName(sn.name),
        topic: sn.topic || '',
        topicShortName: shortName(sn.topic),
        expireTime: sn.expireTime || null,
        labels: sn.labels || {},
      }));

      return res.json({
        ok: true,
        projectId,
        timestamp: new Date().toISOString(),
        summary: {
          topicCount: topics.length,
          subscriptionCount: subscriptions.length,
          dlqConfiguredCount: subscriptions.filter((s) => s.hasDlq).length,
          snapshotCount: snapshots.length,
        },
        topics,
        subscriptions,
        snapshots,
        apiStatus: {
          topics: classifyApiResult(topicsRes),
          subscriptions: classifyApiResult(subsRes),
          snapshots: classifyApiResult(snapsRes),
          pubsub: classifyApiResult(topicsRes.ok ? topicsRes : subsRes),
          error: topicsRes.error || subsRes.error || snapsRes.error || null,
          enableApiCmd: `gcloud services enable pubsub.googleapis.com --project=${projectId}`,
        },
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to load Cloud Pub/Sub overview.',
      });
    }
  });

  // ==========================================================================
  // 8. POST /api/project/:id/frontier/pubsub-action
  // ==========================================================================
  app.post('/api/project/:id/frontier/pubsub-action', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.id);
    if (!projectId) {
      return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
    }
    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) {
      return res.status(401).json({ ok: false, error: 'No active Google Cloud access token.' });
    }

    const action = String(req.body?.action || '').trim().toUpperCase();

    if (action === 'PUBLISH_EVENT') {
      const fullTopic = normalizePubsubResource(req.body?.topicName, projectId, 'topics');
      if (!fullTopic) {
        return res.status(400).json({
          ok: false,
          error: `A valid topicName in project "${projectId}" is required.`,
        });
      }

      const rawPayload = req.body?.payload ?? '';
      const payloadStr =
        typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
      const rawAttrs = req.body?.attributes;
      const cleanAttributes = {};
      if (rawAttrs && typeof rawAttrs === 'object' && !Array.isArray(rawAttrs)) {
        for (const [k, v] of Object.entries(rawAttrs)) {
          if (k && v !== undefined && v !== null) {
            cleanAttributes[String(k).slice(0, 128)] = String(v).slice(0, 1024);
          }
        }
      }

      const r = await gSend(
        'POST',
        `https://pubsub.googleapis.com/v1/${fullTopic}:publish`,
        token,
        {
          messages: [
            {
              data: Buffer.from(payloadStr, 'utf8').toString('base64'),
              ...(Object.keys(cleanAttributes).length > 0 ? { attributes: cleanAttributes } : {}),
            },
          ],
        }
      );

      if (!r.ok) {
        return res.status(422).json({
          ok: false,
          error: r.error || 'Failed to publish Pub/Sub message.',
          status: r.status,
        });
      }

      const messageIds = Array.isArray(r.data?.messageIds) ? r.data.messageIds : [];
      return res.json({
        ok: true,
        action,
        projectId,
        topicName: fullTopic,
        messageIds,
        messageId: messageIds[0] || null,
        publishedAt: new Date().toISOString(),
      });
    }

    if (action === 'PULL_PEEK') {
      const fullSub = normalizePubsubResource(
        req.body?.subscriptionName,
        projectId,
        'subscriptions'
      );
      if (!fullSub) {
        return res.status(400).json({
          ok: false,
          error: `A valid subscriptionName in project "${projectId}" is required.`,
        });
      }

      // Non-destructive peek: pull up to 5 messages with returnImmediately and DO NOT ack.
      const r = await gSend(
        'POST',
        `https://pubsub.googleapis.com/v1/${fullSub}:pull`,
        token,
        { maxMessages: 5, returnImmediately: true },
        undefined,
        8000
      );

      if (!r.ok) {
        return res.status(422).json({
          ok: false,
          error: r.error || 'Failed to pull messages from subscription.',
          status: r.status,
        });
      }

      const received = Array.isArray(r.data?.receivedMessages) ? r.data.receivedMessages : [];
      const messages = received.map((item) => {
        const msg = item?.message || {};
        let decodedData = '';
        if (msg.data) {
          try {
            decodedData = Buffer.from(String(msg.data), 'base64').toString('utf8');
          } catch {
            decodedData = String(msg.data);
          }
        }
        return {
          messageId: msg.messageId || '',
          publishTime: msg.publishTime || null,
          deliveryAttempt: Number(item?.deliveryAttempt || 1),
          orderingKey: msg.orderingKey || null,
          attributes: msg.attributes || {},
          data: decodedData,
          decodedData,
          rawBase64: msg.data || '',
        };
      });

      return res.json({
        ok: true,
        action,
        projectId,
        subscriptionName: fullSub,
        nonDestructivePeek: true,
        count: messages.length,
        messages,
      });
    }

    if (action === 'CREATE_SNAPSHOT') {
      const fullSub = normalizePubsubResource(
        req.body?.subscriptionName,
        projectId,
        'subscriptions'
      );
      const fullSnap = normalizePubsubResource(req.body?.snapshotName, projectId, 'snapshots');
      if (!fullSub || !fullSnap) {
        return res.status(400).json({
          ok: false,
          error: `Both subscriptionName and snapshotName (3+ chars, starting with a letter) in project "${projectId}" are required.`,
        });
      }

      const r = await gSend(
        'PUT',
        `https://pubsub.googleapis.com/v1/${fullSnap}`,
        token,
        { subscription: fullSub }
      );

      if (!r.ok) {
        return res.status(422).json({
          ok: false,
          error: r.error || 'Failed to create Pub/Sub snapshot.',
          status: r.status,
        });
      }

      return res.json({
        ok: true,
        action,
        projectId,
        subscriptionName: fullSub,
        snapshotName: fullSnap,
        snapshot: r.data,
      });
    }

    if (action === 'SEEK_SNAPSHOT') {
      const fullSub = normalizePubsubResource(
        req.body?.subscriptionName,
        projectId,
        'subscriptions'
      );
      const fullSnap = normalizePubsubResource(req.body?.snapshotName, projectId, 'snapshots');
      if (!fullSub || !fullSnap) {
        return res.status(400).json({
          ok: false,
          error: `Both subscriptionName and snapshotName in project "${projectId}" are required for SEEK_SNAPSHOT.`,
        });
      }

      const r = await gSend(
        'POST',
        `https://pubsub.googleapis.com/v1/${fullSub}:seek`,
        token,
        { snapshot: fullSnap }
      );

      if (!r.ok) {
        return res.status(422).json({
          ok: false,
          error: r.error || 'Failed to seek subscription to snapshot.',
          status: r.status,
        });
      }

      return res.json({
        ok: true,
        action,
        projectId,
        subscriptionName: fullSub,
        snapshotName: fullSnap,
        soughtAt: new Date().toISOString(),
      });
    }

    if (action === 'DELETE_SNAPSHOT') {
      const fullSnap = normalizePubsubResource(req.body?.snapshotName, projectId, 'snapshots');
      if (!fullSnap) {
        return res.status(400).json({
          ok: false,
          error: `A valid snapshotName in project "${projectId}" is required.`,
        });
      }

      const r = await gSend('DELETE', `https://pubsub.googleapis.com/v1/${fullSnap}`, token);
      if (!r.ok) {
        return res.status(422).json({
          ok: false,
          error: r.error || 'Failed to delete Pub/Sub snapshot.',
          status: r.status,
        });
      }

      return res.json({
        ok: true,
        action,
        projectId,
        deletedSnapshotName: fullSnap,
      });
    }

    return res.status(400).json({
      ok: false,
      error: `Unsupported Pub/Sub action "${action}".`,
    });
  });
}
