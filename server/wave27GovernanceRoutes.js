import https from 'https';
import axios from 'axios';

const PROJECT_ID_REGEX = /^[a-z0-9][a-z0-9-]{2,62}$/i;
const SAFE_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;

const httpsAgent = new https.Agent({ family: 4, autoSelectFamily: false, keepAlive: true });
const gcp = axios.create({ httpsAgent, timeout: 15000, validateStatus: () => true });

function sanitizeProjectId(raw) {
  const v = String(raw || '').trim();
  return PROJECT_ID_REGEX.test(v) ? v : null;
}

function sanitizeIdentifier(raw) {
  const v = String(raw || '').trim();
  return SAFE_NAME_REGEX.test(v) ? v : null;
}

function shortName(full) {
  const parts = String(full || '').split('/');
  return parts[parts.length - 1] || String(full || '');
}

function sanitizeMermaidLabel(str, maxLen = 46) {
  return String(str || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/["`<>[\]{}|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
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

async function callVertexGemini4(projectId, token, promptText, preferredModel = 'gemini-4-neon') {
  const candidates = [preferredModel, 'gemini-4-neon', 'gemini-4-argon', 'gemini-4-carbon'].filter(
    (m, i, arr) => m && arr.indexOf(m) === i
  );
  const locations = ['global', 'us-central1'];
  let lastError = 'Vertex AI call failed';

  for (const model of candidates) {
    for (const loc of locations) {
      const host = loc === 'global' ? 'aiplatform.googleapis.com' : `${loc}-aiplatform.googleapis.com`;
      const url = `https://${host}/v1/projects/${encodeURIComponent(projectId)}/locations/${loc}/publishers/google/models/${encodeURIComponent(model)}:generateContent`;
      const r = await gSend(
        'POST',
        url,
        token,
        {
          contents: [{ role: 'user', parts: [{ text: promptText }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1400 },
        },
        undefined,
        25000
      );
      if (r.ok) {
        const text =
          r.data?.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || '')
            .join('\n')
            .trim() || '';
        if (text) return { ok: true, model, location: loc, text };
      } else {
        lastError = `${model}@${loc}: ${r.error}`;
      }
    }
  }
  return { ok: false, error: lastError };
}

function estimateDiskMonthlyUsd(diskTypeShort, sizeGb) {
  const gb = Number(sizeGb || 0);
  const t = String(diskTypeShort || '').toLowerCase();
  if (t.includes('ssd') || t.includes('extreme')) return +(gb * 0.17).toFixed(2);
  if (t.includes('balanced')) return +(gb * 0.10).toFixed(2);
  if (t.includes('hyperdisk')) return +(gb * 0.08).toFixed(2);
  return +(gb * 0.04).toFixed(2);
}

export function registerWave27GovernanceRoutes(app, { getLocalOrMetadataAccessToken }) {
  // ============================================================================
  // 1. CLOUD LOGGING FINOPS AUDITOR & LOG-SINK EXCLUSION STUDIO
  // ============================================================================
  app.post('/api/project/:projectId/wave27/logging-finops', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.projectId);
    if (!projectId) return res.status(400).json({ error: 'Invalid projectId' });

    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) return res.status(401).json({ error: 'Missing active GCP OAuth2 token. Run gcloud auth login.' });

    const action = String(req.body?.action || 'AUDIT').toUpperCase();

    if (action === 'APPLY_EXCLUSION') {
      const sinkName = sanitizeIdentifier(req.body?.sinkName || '_Default') || '_Default';
      const exclusionName = sanitizeIdentifier(req.body?.exclusionName);
      const filter = String(req.body?.filter || '').trim();
      const description = String(req.body?.description || 'Added by CloudPulse Logging FinOps Auditor').trim().slice(0, 240);

      if (!exclusionName || !filter) {
        return res.status(400).json({ error: 'exclusionName (alphanumeric/._-) and filter are required.' });
      }

      const sinkUrl = `https://logging.googleapis.com/v2/projects/${encodeURIComponent(projectId)}/sinks/${encodeURIComponent(sinkName)}`;
      const currentSink = await gGet(sinkUrl, token);
      if (!currentSink.ok) {
        return res.status(currentSink.status || 500).json({
          error: `Failed to fetch log sink "${sinkName}": ${currentSink.error}`,
        });
      }

      const existing = Array.isArray(currentSink.data?.exclusions) ? currentSink.data.exclusions : [];
      const nextExclusions = [
        ...existing.filter((ex) => ex.name !== exclusionName),
        { name: exclusionName, description, filter, disabled: false },
      ];

      const patched = await gSend(
        'PATCH',
        sinkUrl,
        token,
        { ...currentSink.data, exclusions: nextExclusions },
        { updateMask: 'exclusions' }
      );
      if (!patched.ok) {
        return res.status(patched.status || 500).json({
          error: `Failed to update sink "${sinkName}": ${patched.error}`,
        });
      }

      return res.json({
        ok: true,
        sinkName,
        exclusionName,
        filter,
        totalExclusions: nextExclusions.length,
        sink: patched.data,
      });
    }

    // Default: AUDIT (read-only)
    const days = Math.min(Math.max(Number(req.body?.days || 7), 1), 30);
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const startIso = start.toISOString();
    const endIso = now.toISOString();

    const [bytesRes, countRes, sinksRes, bucketsRes] = await Promise.all([
      gGet(`https://monitoring.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/timeSeries`, token, {
        filter: 'metric.type="logging.googleapis.com/billing/bytes_ingested"',
        'interval.startTime': startIso,
        'interval.endTime': endIso,
        'aggregation.alignmentPeriod': '86400s',
        'aggregation.perSeriesAligner': 'ALIGN_SUM',
      }),
      gGet(`https://monitoring.googleapis.com/v3/projects/${encodeURIComponent(projectId)}/timeSeries`, token, {
        filter: 'metric.type="logging.googleapis.com/log_entry_count"',
        'interval.startTime': startIso,
        'interval.endTime': endIso,
        'aggregation.alignmentPeriod': '86400s',
        'aggregation.perSeriesAligner': 'ALIGN_SUM',
      }),
      gGet(`https://logging.googleapis.com/v2/projects/${encodeURIComponent(projectId)}/sinks`, token),
      gGet(`https://logging.googleapis.com/v2/projects/${encodeURIComponent(projectId)}/locations/global/buckets`, token),
    ]);

    const dailyMap = new Map();
    const streamMap = new Map();
    let totalBytesWindow = 0;

    for (const ts of bytesRes.data?.timeSeries || []) {
      const resourceType = ts.resource?.type || 'global';
      const bucketId = ts.metric?.labels?.bucket_id || '_Default';
      const logName = ts.metric?.labels?.log || ts.resource?.labels?.service_name || resourceType;
      const key = `${resourceType}::${logName}`;
      let seriesBytes = 0;

      for (const pt of ts.points || []) {
        const val = Number(pt.value?.int64Value ?? pt.value?.doubleValue ?? 0);
        seriesBytes += val;
        const dayKey = String(pt.interval?.endTime || '').slice(0, 10) || 'unknown';
        dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + val);
      }
      totalBytesWindow += seriesBytes;
      const prev = streamMap.get(key) || {
        resourceType,
        logName,
        bucketId,
        bytes: 0,
        entries: 0,
        severities: {},
      };
      prev.bytes += seriesBytes;
      streamMap.set(key, prev);
    }

    let totalEntriesWindow = 0;
    const severityTotals = {};
    for (const ts of countRes.data?.timeSeries || []) {
      const resourceType = ts.resource?.type || 'global';
      const logName = ts.metric?.labels?.log || resourceType;
      const severity = ts.metric?.labels?.severity || 'DEFAULT';
      const key = `${resourceType}::${logName}`;
      let seriesCount = 0;
      for (const pt of ts.points || []) {
        seriesCount += Number(pt.value?.int64Value ?? pt.value?.doubleValue ?? 0);
      }
      totalEntriesWindow += seriesCount;
      severityTotals[severity] = (severityTotals[severity] || 0) + seriesCount;

      const prev = streamMap.get(key) || {
        resourceType,
        logName,
        bucketId: '_Default',
        bytes: 0,
        entries: 0,
        severities: {},
      };
      prev.entries += seriesCount;
      prev.severities[severity] = (prev.severities[severity] || 0) + seriesCount;
      streamMap.set(key, prev);
    }

    const scaleTo30d = 30 / days;
    const totalGbWindow = +(totalBytesWindow / (1024 ** 3)).toFixed(4);
    const projected30dGb = +(totalGbWindow * scaleTo30d).toFixed(3);
    const billable30dGb = Math.max(0, projected30dGb - 50);
    const estimatedMonthlyUsd = +(billable30dGb * 0.5).toFixed(2);

    const dailySeries = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, bytes]) => ({
        date,
        gb: +(bytes / (1024 ** 3)).toFixed(4),
        mb: +(bytes / (1024 ** 2)).toFixed(2),
      }));

    const topStreams = Array.from(streamMap.values())
      .map((s) => {
        const gbWindow = +(s.bytes / (1024 ** 3)).toFixed(4);
        const gb30d = +(gbWindow * scaleTo30d).toFixed(3);
        const lowSevEntries = (s.severities.DEBUG || 0) + (s.severities.INFO || 0) + (s.severities.DEFAULT || 0);
        const noiseRatio = s.entries > 0 ? +(lowSevEntries / s.entries).toFixed(2) : 0;
        const safeFilterName = `exclude_${s.resourceType.replace(/[^a-z0-9]/gi, '_').slice(0, 22).toLowerCase()}_info`;
        const filterExpr = `resource.type="${s.resourceType}" AND severity<WARNING`;
        return {
          ...s,
          gbWindow,
          mbWindow: +(s.bytes / (1024 ** 2)).toFixed(2),
          projected30dGb: gb30d,
          estMonthlyUsd: +(gb30d * 0.5).toFixed(2),
          noiseRatio,
          suggestedExclusionName: safeFilterName,
          suggestedFilter: filterExpr,
          gcloudCmd: `gcloud logging sinks update _Default --project=${projectId} --add-exclusion=name=${safeFilterName},description="CloudPulse FinOps noise filter",filter='${filterExpr}'`,
        };
      })
      .sort((a, b) => b.bytes - a.bytes || b.entries - a.entries)
      .slice(0, 20);

    const sinks = (sinksRes.data?.sinks || []).map((s) => ({
      name: s.name,
      destination: s.destination,
      filter: s.filter || '(all logs)',
      disabled: !!s.disabled,
      exclusions: s.exclusions || [],
    }));

    const buckets = (bucketsRes.data?.buckets || []).map((b) => ({
      name: shortName(b.name),
      retentionDays: b.retentionDays || 30,
      lifecycleState: b.lifecycleState || 'ACTIVE',
      analyticsEnabled: !!b.analyticsEnabled,
    }));

    return res.json({
      projectId,
      days,
      checkedAt: now.toISOString(),
      apiStatus: {
        monitoringBytes: classifyApiResult(bytesRes),
        monitoringCount: classifyApiResult(countRes),
        loggingSinks: classifyApiResult(sinksRes),
        loggingBuckets: classifyApiResult(bucketsRes),
      },
      summary: {
        totalBytesWindow,
        totalGbWindow,
        totalEntriesWindow,
        projected30dGb,
        freeTierGb: 50,
        billable30dGb: +billable30dGb.toFixed(3),
        estimatedMonthlyUsd,
        activeSinks: sinks.length,
        activeExclusions: sinks.reduce((acc, s) => acc + (s.exclusions?.length || 0), 0),
      },
      severityTotals,
      dailySeries,
      topStreams,
      sinks,
      buckets,
    });
  });

  // ============================================================================
  // 2. BIGQUERY DATA LINEAGE & BLAST-RADIUS STUDIO
  // ============================================================================
  app.post('/api/project/:projectId/wave27/bq-lineage', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.projectId);
    if (!projectId) return res.status(400).json({ error: 'Invalid projectId' });

    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) return res.status(401).json({ error: 'Missing active GCP OAuth2 token.' });

    const action = String(req.body?.action || 'LIST_ASSETS').toUpperCase();

    if (action === 'LIST_ASSETS') {
      const dsRes = await gGet(
        `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/datasets`,
        token,
        { maxResults: 30 }
      );
      if (!dsRes.ok) {
        return res.status(dsRes.status || 500).json({
          error: `BigQuery datasets lookup failed: ${dsRes.error}`,
          apiStatus: classifyApiResult(dsRes),
        });
      }
      const datasets = (dsRes.data?.datasets || []).slice(0, 12);
      const tableResults = await Promise.all(
        datasets.map(async (ds) => {
          const dsId = ds.datasetReference?.datasetId;
          const loc = ds.location || 'US';
          const tRes = await gGet(
            `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/datasets/${encodeURIComponent(dsId)}/tables`,
            token,
            { maxResults: 40 }
          );
          return (tRes.data?.tables || []).map((t) => ({
            datasetId: dsId,
            tableId: t.tableReference?.tableId,
            type: t.type || 'TABLE',
            location: loc,
            fqn: `${projectId}.${dsId}.${t.tableReference?.tableId}`,
          }));
        })
      );
      const assets = tableResults.flat().filter((a) => a.tableId);
      return res.json({
        projectId,
        datasetCount: datasets.length,
        assets,
      });
    }

    if (action === 'TRACE') {
      const datasetId = sanitizeIdentifier(req.body?.datasetId);
      const tableId = sanitizeIdentifier(req.body?.tableId);
      const rawLoc = String(req.body?.location || 'us').trim().toLowerCase();
      if (!datasetId || !tableId) {
        return res.status(400).json({ error: 'datasetId and tableId are required.' });
      }

      const fqn = `bigquery:${projectId}.${datasetId}.${tableId}`;
      const lineageHost = `https://${rawLoc}-datalineage.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(rawLoc)}:searchLinks`;

      const [tableMetaRes, downstreamRes, upstreamRes, viewsScanRes] = await Promise.all([
        gGet(
          `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/datasets/${encodeURIComponent(datasetId)}/tables/${encodeURIComponent(tableId)}`,
          token
        ),
        gSend('POST', lineageHost, token, { source: { fullyQualifiedName: fqn }, pageSize: 50 }),
        gSend('POST', lineageHost, token, { target: { fullyQualifiedName: fqn }, pageSize: 50 }),
        gSend(
          'POST',
          `https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/queries`,
          token,
          {
            query: `SELECT table_catalog, table_schema, table_name, view_definition FROM \`${projectId}.${datasetId}.INFORMATION_SCHEMA.VIEWS\` LIMIT 100`,
            useLegacySql: false,
            location: req.body?.location || 'US',
          }
        ),
      ]);

      const upstreamMap = new Map();
      const downstreamMap = new Map();

      for (const link of upstreamRes.data?.links || []) {
        const src = link.source?.fullyQualifiedName;
        if (src && src !== fqn) {
          upstreamMap.set(src, {
            fqn: src,
            short: src.replace(/^bigquery:/, ''),
            sourceEngine: 'DATA_LINEAGE_API',
            lastSeen: link.endTime || link.startTime || null,
          });
        }
      }
      for (const link of downstreamRes.data?.links || []) {
        const tgt = link.target?.fullyQualifiedName;
        if (tgt && tgt !== fqn) {
          downstreamMap.set(tgt, {
            fqn: tgt,
            short: tgt.replace(/^bigquery:/, ''),
            sourceEngine: 'DATA_LINEAGE_API',
            lastSeen: link.endTime || link.startTime || null,
          });
        }
      }

      // INFORMATION_SCHEMA.VIEWS SQL dependency fallback/enrichment
      const viewRows = viewsScanRes.data?.rows || [];
      for (const row of viewRows) {
        const f = row.f || [];
        const vSchema = f[1]?.v || datasetId;
        const vName = f[2]?.v || '';
        const vDef = String(f[3]?.v || '');
        if (!vName) continue;
        const vFqn = `bigquery:${projectId}.${vSchema}.${vName}`;
        if (vName === tableId) {
          // Target itself is a view -> parse its FROM/JOIN references as upstream
          const refs = vDef.match(/`([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)`/g) || [];
          for (const rawRef of refs) {
            const clean = rawRef.replace(/`/g, '');
            const refFqn = `bigquery:${clean}`;
            if (refFqn !== fqn && !upstreamMap.has(refFqn)) {
              upstreamMap.set(refFqn, {
                fqn: refFqn,
                short: clean,
                sourceEngine: 'INFORMATION_SCHEMA_VIEW_SQL',
                lastSeen: null,
              });
            }
          }
        } else if (vDef.includes(tableId) && !downstreamMap.has(vFqn)) {
          downstreamMap.set(vFqn, {
            fqn: vFqn,
            short: `${projectId}.${vSchema}.${vName}`,
            sourceEngine: 'INFORMATION_SCHEMA_VIEW_SQL',
            lastSeen: null,
          });
        }
      }

      const upstream = Array.from(upstreamMap.values());
      const downstream = Array.from(downstreamMap.values());
      const schemaFields = (tableMetaRes.data?.schema?.fields || []).map((fld) => ({
        name: fld.name,
        type: fld.type,
        mode: fld.mode || 'NULLABLE',
      }));

      // Build clean single-line Mermaid DAG
      const lines = ['flowchart LR'];
      const targetNode = `TARGET["TARGET: ${sanitizeMermaidLabel(`${datasetId}.${tableId}`, 40)}"]`;
      lines.push(`  ${targetNode}`);
      if (upstream.length === 0) {
        lines.push(`  UP0["Direct Ingestion / Root Source"] --> TARGET`);
      } else {
        upstream.slice(0, 8).forEach((u, idx) => {
          lines.push(`  UP${idx}["${sanitizeMermaidLabel(u.short, 42)}"] --> TARGET`);
        });
      }
      if (downstream.length === 0) {
        lines.push(`  TARGET --> DN0["No Active Downstream Dependents"]`);
      } else {
        downstream.slice(0, 10).forEach((d, idx) => {
          lines.push(`  TARGET --> DN${idx}["${sanitizeMermaidLabel(d.short, 42)}"]`);
        });
      }

      return res.json({
        projectId,
        datasetId,
        tableId,
        location: req.body?.location || tableMetaRes.data?.location || 'US',
        fqn,
        tableType: tableMetaRes.data?.type || 'TABLE',
        numRows: Number(tableMetaRes.data?.numRows || 0),
        numBytes: Number(tableMetaRes.data?.numBytes || 0),
        schemaFields,
        apiStatus: {
          dataLineageApi: classifyApiResult(downstreamRes),
          informationSchemaFallback: viewsScanRes.ok ? 'ENABLED' : classifyApiResult(viewsScanRes),
        },
        upstream,
        downstream,
        blastRadiusCount: downstream.length,
        mermaidGraph: lines.join('\n'),
      });
    }

    if (action === 'AI_IMPACT') {
      const fqn = String(req.body?.fqn || '').trim();
      const proposedChange = String(req.body?.proposedChange || 'Alter or drop column').trim().slice(0, 300);
      const upstream = Array.isArray(req.body?.upstream) ? req.body.upstream : [];
      const downstream = Array.isArray(req.body?.downstream) ? req.body.downstream : [];
      const schemaFields = Array.isArray(req.body?.schemaFields) ? req.body.schemaFields.slice(0, 30) : [];

      const prompt = `You are a Principal Google Cloud BigQuery Data Architect.
Analyze the blast radius of a proposed schema/table change.
Target Asset: ${fqn}
Proposed Change: ${proposedChange}
Schema Columns: ${schemaFields.map((c) => `${c.name}:${c.type}`).join(', ') || 'Unknown'}
Upstream Sources (${upstream.length}): ${upstream.map((u) => u.short).join(', ') || 'None'}
Downstream Dependents (${downstream.length}): ${downstream.map((d) => d.short).join(', ') || 'None'}

Respond concisely in Markdown with 3 sections:
1. **Blast-Radius Risk Rating** (LOW/MEDIUM/HIGH/CRITICAL) and why.
2. **Safe Zero-Downtime Migration Steps** (3-4 bullet steps).
3. **Pre-Flight Verification SQL** (a single BigQuery Standard SQL check).`;

      const ai = await callVertexGemini4(projectId, token, prompt, req.body?.geminiModel || 'gemini-4-neon');
      if (!ai.ok) {
        return res.status(502).json({
          error: `Vertex AI impact brief failed: ${ai.error}. Ensure aiplatform.googleapis.com is enabled.`,
        });
      }
      return res.json({
        ok: true,
        model: ai.model,
        location: ai.location,
        analysis: ai.text,
      });
    }

    return res.status(400).json({ error: `Unsupported action "${action}"` });
  });

  // ============================================================================
  // 3. IAM LEAST-PRIVILEGE & PAM JUST-IN-TIME ACCESS CONTROL
  // ============================================================================
  app.post('/api/project/:projectId/wave27/iam-pam', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.projectId);
    if (!projectId) return res.status(400).json({ error: 'Invalid projectId' });

    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) return res.status(401).json({ error: 'Missing active GCP OAuth2 token.' });

    const action = String(req.body?.action || 'AUDIT').toUpperCase();

    if (action === 'REQUEST_PAM_GRANT') {
      const entitlementName = String(req.body?.entitlementName || '').trim();
      const durationSeconds = Math.min(Math.max(Number(req.body?.durationSeconds || 1800), 300), 14400);
      const justification = String(req.body?.justification || 'CloudPulse JIT operational access').trim().slice(0, 300);
      if (!entitlementName || !entitlementName.includes('/entitlements/')) {
        return res.status(400).json({ error: 'Valid PAM entitlementName is required.' });
      }
      const grantUrl = `https://privilegedaccessmanager.googleapis.com/v1/${entitlementName}/grants`;
      const grantRes = await gSend('POST', grantUrl, token, {
        requestedDuration: `${durationSeconds}s`,
        justification: { unstructuredJustification: justification },
      });
      if (!grantRes.ok) {
        return res.status(grantRes.status || 500).json({
          error: `PAM grant request failed: ${grantRes.error}`,
        });
      }
      return res.json({
        ok: true,
        grant: grantRes.data,
      });
    }

    // Default: AUDIT (read-only)
    const [policyRes, recRes, saRes, pamRes] = await Promise.all([
      gSend(
        'POST',
        `https://cloudresourcemanager.googleapis.com/v1/projects/${encodeURIComponent(projectId)}:getIamPolicy`,
        token,
        { options: { requestedPolicyVersion: 3 } }
      ),
      gGet(
        `https://recommender.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/global/recommenders/google.iam.policy.Recommender/recommendations`,
        token
      ),
      gGet(`https://iam.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/serviceAccounts`, token),
      gGet(
        `https://privilegedaccessmanager.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/global/entitlements`,
        token
      ),
    ]);

    const highPrivRoles = new Set([
      'roles/owner',
      'roles/editor',
      'roles/iam.securityAdmin',
      'roles/resourcemanager.projectIamAdmin',
      'roles/compute.admin',
    ]);

    const standingPrivileged = [];
    for (const binding of policyRes.data?.bindings || []) {
      const role = binding.role || '';
      if (!highPrivRoles.has(role)) continue;
      for (const member of binding.members || []) {
        standingPrivileged.push({
          role,
          member,
          severity: role === 'roles/owner' ? 'CRITICAL' : role === 'roles/editor' ? 'HIGH' : 'MEDIUM',
          removeCmd: `gcloud projects remove-iam-policy-binding ${projectId} --member="${member}" --role="${role}"`,
          pamSuggestCmd: `gcloud pam entitlements create jit-${role.replace(/[^a-z0-9]/gi, '-').toLowerCase()} --project=${projectId} --location=global --max-request-duration=3600s`,
        });
      }
    }

    const recommendations = (recRes.data?.recommendations || []).map((rec) => ({
      id: shortName(rec.name),
      state: rec.stateInfo?.state || 'ACTIVE',
      priority: rec.priority || 'P3',
      description: rec.description || 'IAM least-privilege recommendation',
      subtype: rec.recommenderSubtype || 'REPLACE_ROLE',
      lastRefreshTime: rec.lastRefreshTime || null,
    }));

    // Check up to 8 service accounts for stale (>90d) user-managed keys
    const serviceAccounts = (saRes.data?.accounts || []).slice(0, 8);
    const staleKeys = [];
    const nowMs = Date.now();
    await Promise.all(
      serviceAccounts.map(async (sa) => {
        const kRes = await gGet(
          `https://iam.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/serviceAccounts/${encodeURIComponent(sa.email)}/keys`,
          token,
          { keyTypes: 'USER_MANAGED' }
        );
        for (const k of kRes.data?.keys || []) {
          const createdMs = Date.parse(k.validAfterTime || '');
          const ageDays = Number.isFinite(createdMs) ? Math.floor((nowMs - createdMs) / 86400000) : 0;
          staleKeys.push({
            serviceAccount: sa.email,
            keyId: shortName(k.name),
            ageDays,
            stale: ageDays >= 90,
            validAfterTime: k.validAfterTime,
            deleteCmd: `gcloud iam service-accounts keys delete ${shortName(k.name)} --iam-account=${sa.email} --project=${projectId}`,
          });
        }
      })
    );

    const entitlements = (pamRes.data?.entitlements || []).map((e) => ({
      name: e.name,
      shortName: shortName(e.name),
      state: e.state || 'AVAILABLE',
      maxRequestDuration: e.maxRequestDuration || '3600s',
      roles: (e.privilegedAccess?.gcpIamAccess?.roleBindings || []).map((rb) => rb.role),
    }));

    // Single-line Mermaid IAM privilege graph
    const graphLines = ['flowchart LR'];
    graphLines.push(`  PROJ["Project: ${sanitizeMermaidLabel(projectId, 34)}"]`);
    if (standingPrivileged.length === 0) {
      graphLines.push(`  CLEAN["Zero Standing Owner/Editor Principals"] --> PROJ`);
    } else {
      standingPrivileged.slice(0, 8).forEach((sp, i) => {
        graphLines.push(
          `  M${i}["${sanitizeMermaidLabel(sp.member, 36)}"] -->|${sanitizeMermaidLabel(sp.role.replace('roles/', ''), 22)}| PROJ`
        );
      });
    }
    if (entitlements.length > 0) {
      entitlements.slice(0, 5).forEach((e, i) => {
        graphLines.push(`  PROJ --> PAM${i}["PAM JIT: ${sanitizeMermaidLabel(e.shortName, 32)}"]`);
      });
    } else {
      graphLines.push(`  PROJ --> PAM0["PAM JIT Entitlements: None Configured"]`);
    }

    return res.json({
      projectId,
      checkedAt: new Date().toISOString(),
      apiStatus: {
        iamPolicy: classifyApiResult(policyRes),
        iamRecommender: classifyApiResult(recRes),
        serviceAccounts: classifyApiResult(saRes),
        pamEntitlements: classifyApiResult(pamRes),
      },
      summary: {
        standingPrivilegedCount: standingPrivileged.length,
        recommenderFindings: recommendations.length,
        userManagedKeys: staleKeys.length,
        staleKeysOver90d: staleKeys.filter((k) => k.stale).length,
        pamEntitlementsCount: entitlements.length,
      },
      standingPrivileged,
      recommendations,
      staleKeys,
      entitlements,
      mermaidGraph: graphLines.join('\n'),
    });
  });

  // ============================================================================
  // 4. FINOPS IDLE-ZOMBIE EXECUTOR (LIVE SCAN & SAFE REMEDIATION)
  // ============================================================================
  app.post('/api/project/:projectId/wave27/zombie-reaper', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.projectId);
    if (!projectId) return res.status(400).json({ error: 'Invalid projectId' });

    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) return res.status(401).json({ error: 'Missing active GCP OAuth2 token.' });

    const action = String(req.body?.action || 'SCAN').toUpperCase();

    if (action === 'DELETE_DISK') {
      const zone = sanitizeIdentifier(req.body?.zone);
      const name = sanitizeIdentifier(req.body?.name);
      if (!zone || !name) return res.status(400).json({ error: 'zone and name are required.' });
      const r = await gSend(
        'DELETE',
        `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(projectId)}/zones/${encodeURIComponent(zone)}/disks/${encodeURIComponent(name)}`,
        token
      );
      if (!r.ok) return res.status(r.status || 500).json({ error: `Failed to delete disk "${name}": ${r.error}` });
      return res.json({ ok: true, action, name, zone, operation: r.data?.name || 'submitted' });
    }

    if (action === 'RELEASE_IP') {
      const region = sanitizeIdentifier(req.body?.region);
      const name = sanitizeIdentifier(req.body?.name);
      if (!region || !name) return res.status(400).json({ error: 'region and name are required.' });
      const r = await gSend(
        'DELETE',
        `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(projectId)}/regions/${encodeURIComponent(region)}/addresses/${encodeURIComponent(name)}`,
        token
      );
      if (!r.ok) return res.status(r.status || 500).json({ error: `Failed to release IP "${name}": ${r.error}` });
      return res.json({ ok: true, action, name, region, operation: r.data?.name || 'submitted' });
    }

    if (action === 'STOP_VM') {
      const zone = sanitizeIdentifier(req.body?.zone);
      const name = sanitizeIdentifier(req.body?.name);
      if (!zone || !name) return res.status(400).json({ error: 'zone and name are required.' });
      const r = await gSend(
        'POST',
        `https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(projectId)}/zones/${encodeURIComponent(zone)}/instances/${encodeURIComponent(name)}/stop`,
        token,
        {}
      );
      if (!r.ok) return res.status(r.status || 500).json({ error: `Failed to stop VM "${name}": ${r.error}` });
      return res.json({ ok: true, action, name, zone, operation: r.data?.name || 'submitted' });
    }

    // Default: SCAN (read-only)
    const [disksRes, addrsRes, vmsRes, sqlRes] = await Promise.all([
      gGet(`https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(projectId)}/aggregated/disks`, token),
      gGet(`https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(projectId)}/aggregated/addresses`, token),
      gGet(`https://compute.googleapis.com/compute/v1/projects/${encodeURIComponent(projectId)}/aggregated/instances`, token),
      gGet(`https://sqladmin.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/instances`, token),
    ]);

    const zombies = [];

    // 1. Unattached Persistent Disks
    for (const [scopeKey, scopeVal] of Object.entries(disksRes.data?.items || {})) {
      const zone = scopeKey.replace(/^zones\//, '');
      for (const d of scopeVal.disks || []) {
        if (!d.users || d.users.length === 0) {
          const diskType = shortName(d.type);
          const monthlyUsd = estimateDiskMonthlyUsd(diskType, d.sizeGb);
          zombies.push({
            id: `disk:${zone}:${d.name}`,
            resourceType: 'UNATTACHED_DISK',
            label: 'Unattached Persistent Disk',
            name: d.name,
            location: zone,
            zone,
            detail: `${d.sizeGb} GB ${diskType} · 0 attached VMs`,
            monthlySavingsUsd: monthlyUsd,
            remediationAction: 'DELETE_DISK',
            remediationLabel: 'Delete Disk',
            gcloudCmd: `gcloud compute disks delete ${d.name} --zone=${zone} --project=${projectId} --quiet`,
          });
        }
      }
    }

    // 2. Unused Static External IPs
    for (const [scopeKey, scopeVal] of Object.entries(addrsRes.data?.items || {})) {
      const region = scopeKey.replace(/^regions\//, '');
      for (const a of scopeVal.addresses || []) {
        if (a.status === 'RESERVED' && a.addressType === 'EXTERNAL') {
          zombies.push({
            id: `ip:${region}:${a.name}`,
            resourceType: 'UNUSED_STATIC_IP',
            label: 'Unused Static External IP',
            name: a.name,
            location: region,
            region,
            detail: `${a.address || 'External IP'} · RESERVED (unattached)`,
            monthlySavingsUsd: 7.3,
            remediationAction: 'RELEASE_IP',
            remediationLabel: 'Release IP',
            gcloudCmd: `gcloud compute addresses delete ${a.name} --region=${region} --project=${projectId} --quiet`,
          });
        }
      }
    }

    // 3. Stopped VMs with persistent disks still billing + Running VMs for Recommender check
    const seenZones = new Set();
    for (const [scopeKey, scopeVal] of Object.entries(vmsRes.data?.items || {})) {
      const zone = scopeKey.replace(/^zones\//, '');
      for (const vm of scopeVal.instances || []) {
        seenZones.add(zone);
        if (vm.status === 'TERMINATED' || vm.status === 'STOPPED') {
          const diskGb = (vm.disks || []).reduce((acc, d) => acc + Number(d.diskSizeGb || 10), 0);
          zombies.push({
            id: `stopped-vm:${zone}:${vm.name}`,
            resourceType: 'STOPPED_VM_STORAGE',
            label: 'Stopped VM (Billing Storage)',
            name: vm.name,
            location: zone,
            zone,
            detail: `${shortName(vm.machineType)} · ${vm.status} · ~${diskGb} GB attached boot/data disks`,
            monthlySavingsUsd: +(diskGb * 0.04).toFixed(2),
            remediationAction: null,
            remediationLabel: 'Inspect in VM Studio',
            gcloudCmd: `gcloud compute instances delete ${vm.name} --zone=${zone} --project=${projectId}`,
          });
        }
      }
    }

    // 4. Live Compute Idle-Resource Recommender (first 3 zones)
    const idleZones = Array.from(seenZones).slice(0, 3);
    const recResults = await Promise.all(
      idleZones.map((z) =>
        gGet(
          `https://recommender.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(z)}/recommenders/google.compute.instance.IdleResourceRecommender/recommendations`,
          token
        )
      )
    );
    recResults.forEach((r, idx) => {
      const z = idleZones[idx];
      for (const rec of r.data?.recommendations || []) {
        const units = Number(rec.primaryImpact?.costProjection?.cost?.units || 0);
        const monthlyUsd = Math.abs(units);
        const vmName = shortName(rec.content?.overview?.resourceName || rec.name);
        zombies.push({
          id: `idle-vm:${z}:${vmName}`,
          resourceType: 'IDLE_RUNNING_VM',
          label: 'Idle Running VM (Recommender)',
          name: vmName,
          location: z,
          zone: z,
          detail: rec.description || 'Compute Recommender detected sustained idle CPU/network',
          monthlySavingsUsd: +monthlyUsd.toFixed(2),
          remediationAction: 'STOP_VM',
          remediationLabel: 'Stop VM',
          gcloudCmd: `gcloud compute instances stop ${vmName} --zone=${z} --project=${projectId}`,
        });
      }
    });

    // 5. Cloud SQL instances (flag runnable dev/sandbox instances with activationPolicy ALWAYS)
    for (const inst of sqlRes.data?.items || []) {
      if (inst.state === 'RUNNABLE' && inst.settings?.activationPolicy === 'ALWAYS') {
        const tier = inst.settings?.tier || 'db-f1-micro';
        const estMonthly = tier.includes('micro') ? 9.5 : tier.includes('small') ? 28.0 : 95.0;
        zombies.push({
          id: `sql:${inst.region}:${inst.name}`,
          resourceType: 'ALWAYS_ON_SQL',
          label: 'Always-On Cloud SQL Instance',
          name: inst.name,
          location: inst.region || 'global',
          region: inst.region || 'global',
          detail: `${inst.databaseVersion || 'SQL'} · ${tier} · activationPolicy=ALWAYS`,
          monthlySavingsUsd: estMonthly,
          remediationAction: null,
          remediationLabel: 'Stop via gcloud',
          gcloudCmd: `gcloud sql instances patch ${inst.name} --activation-policy=NEVER --project=${projectId}`,
        });
      }
    }

    zombies.sort((a, b) => b.monthlySavingsUsd - a.monthlySavingsUsd);
    const totalMonthlySavingsUsd = +zombies.reduce((acc, z) => acc + Number(z.monthlySavingsUsd || 0), 0).toFixed(2);

    return res.json({
      projectId,
      checkedAt: new Date().toISOString(),
      apiStatus: {
        computeDisks: classifyApiResult(disksRes),
        computeAddresses: classifyApiResult(addrsRes),
        computeInstances: classifyApiResult(vmsRes),
        cloudSql: classifyApiResult(sqlRes),
      },
      summary: {
        totalZombies: zombies.length,
        actionableCount: zombies.filter((z) => !!z.remediationAction).length,
        totalMonthlySavingsUsd,
        totalAnnualSavingsUsd: +(totalMonthlySavingsUsd * 12).toFixed(2),
      },
      zombies,
    });
  });

  // ============================================================================
  // 5. GLOBAL LIVE RESOURCE SEARCH FOR COMMAND PALETTE (Cmd+K / Alt+P)
  // ============================================================================
  app.get('/api/project/:projectId/wave27/live-search', async (req, res) => {
    const projectId = sanitizeProjectId(req.params.projectId);
    if (!projectId) return res.status(400).json({ error: 'Invalid projectId' });

    const token = await resolveToken(getLocalOrMetadataAccessToken);
    if (!token) return res.status(401).json({ error: 'Missing active GCP OAuth2 token.' });

    const q = String(req.query?.q || '').trim().toLowerCase();

    const [bqRes, gcsRes, alloyRes, sqlRes, gkeRes] = await Promise.all([
      gGet(`https://bigquery.googleapis.com/bigquery/v2/projects/${encodeURIComponent(projectId)}/datasets`, token, { maxResults: 25 }, 6000),
      gGet(`https://storage.googleapis.com/storage/v1/b`, token, { project: projectId, maxResults: 30 }, 6000),
      gGet(`https://alloydb.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/-/clusters`, token, undefined, 6000),
      gGet(`https://sqladmin.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/instances`, token, undefined, 6000),
      gGet(`https://container.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/-/clusters`, token, undefined, 6000),
    ]);

    const items = [];

    for (const ds of bqRes.data?.datasets || []) {
      const id = ds.datasetReference?.datasetId;
      if (!id) continue;
      items.push({
        id: `bq-ds:${id}`,
        type: 'BigQuery Dataset',
        name: id,
        region: ds.location || 'US',
        targetTab: 'BIGQUERY_STUDIO',
        subtitle: `BigQuery Dataset · ${ds.location || 'US'} · Open in BigQuery Studio & Lineage`,
      });
    }

    for (const b of gcsRes.data?.items || []) {
      items.push({
        id: `gcs:${b.name}`,
        type: 'Cloud Storage Bucket',
        name: b.name,
        region: b.location || 'US',
        targetTab: 'CLOUD_STORAGE_STUDIO',
        subtitle: `gs://${b.name} · ${b.storageClass || 'STANDARD'} · ${b.location || 'US'}`,
      });
    }

    for (const c of alloyRes.data?.clusters || []) {
      const cname = shortName(c.name);
      items.push({
        id: `alloydb:${cname}`,
        type: 'AlloyDB Cluster',
        name: cname,
        region: c.name?.split('/locations/')?.[1]?.split('/')?.[0] || 'global',
        targetTab: 'ALLOYDB_STUDIO',
        subtitle: `AlloyDB PostgreSQL · ${c.state || 'READY'} · Open in AlloyDB Mastery Studio`,
      });
    }

    for (const s of sqlRes.data?.items || []) {
      items.push({
        id: `cloudsql:${s.name}`,
        type: 'Cloud SQL Instance',
        name: s.name,
        region: s.region || 'global',
        targetTab: 'FINOPS',
        subtitle: `Cloud SQL ${s.databaseVersion || ''} · ${s.state || 'RUNNABLE'} · ${s.region || ''}`,
      });
    }

    for (const k of gkeRes.data?.clusters || []) {
      items.push({
        id: `gke:${k.name}`,
        type: 'GKE Cluster',
        name: k.name,
        region: k.location || 'global',
        targetTab: 'GKE_STUDIO',
        subtitle: `GKE ${k.currentMasterVersion || ''} · ${k.status || 'RUNNING'} · ${k.location || ''}`,
      });
    }

    const filtered = q
      ? items.filter(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            it.type.toLowerCase().includes(q) ||
            it.region.toLowerCase().includes(q) ||
            it.subtitle.toLowerCase().includes(q)
        )
      : items;

    return res.json({
      projectId,
      total: filtered.length,
      items: filtered.slice(0, 40),
    });
  });
}
