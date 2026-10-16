import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Cpu,
  RefreshCw,
  Play,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Terminal,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Globe,
  Activity,
  Lock,
  Code2,
  Search,
  ExternalLink,
} from 'lucide-react';

const CATEGORY_LABELS = {
  ALL: 'All 48 Official MCP Servers',
  COMPUTE_INFRA: 'Compute, Serverless & GKE',
  FINOPS_OPTIMIZATION: 'FinOps, Billing & Quotas',
  SECURITY_COMPLIANCE: 'Security, IAM & Policy',
  DATA_DATABASES: 'Databases, BigQuery & Streaming',
  OBSERVABILITY_SRE: 'Observability, Trace & SRE',
  AI_AGENT_PLATFORM: 'AI Agents & Dev Knowledge',
};

const TRIAGE_CHAINS = [
  {
    id: 'SRE_INCIDENT_ROOT_CAUSE',
    label: '360° SRE Incident, Error & Log Triage',
    badge: '4 MCP Servers',
    description:
      'Chains run.googleapis.com/mcp + logging.googleapis.com/mcp + clouderrorreporting.googleapis.com/mcp + servicehealth.googleapis.com/mcp in parallel.',
  },
  {
    id: 'ZERO_TRUST_IAM_ASSET_AUDIT',
    label: 'Zero-Trust IAM, Policy Troubleshooter & Storage',
    badge: '4 MCP Servers',
    description:
      'Chains iam.googleapis.com/mcp + policytroubleshooter.googleapis.com/mcp + storage.googleapis.com/storage/mcp + cloudresourcemanager.googleapis.com/mcp.',
  },
  {
    id: 'FINOPS_QUOTA_DATABASE_PULSE',
    label: 'FinOps Billing, SKU Catalog & BigQuery Pulse',
    badge: '4 MCP Servers',
    description:
      'Chains cloudbilling.googleapis.com/mcp (Billing Info + SKU Services) + bigquery.googleapis.com/mcp + recommender.googleapis.com/mcp.',
  },
  {
    id: 'GROUNDED_ARCH_KNOWLEDGE_COPILOT',
    label: 'Grounded Google Developer Knowledge RAG + Fleet',
    badge: '4 MCP Servers',
    description:
      'Chains developerknowledge.googleapis.com/mcp (search_documents) + storage.googleapis.com/storage/mcp + bigquery.googleapis.com/mcp + cloudbilling.googleapis.com/mcp.',
  },
];

const REVIEW_PRESET_PROMPTS = [
  {
    id: 'ESTATE_FINOPS',
    label: 'Review Full Estate & FinOps',
    prompt:
      'Review my live Cloud Billing status, Cloud Storage buckets, BigQuery datasets, and recent Cloud Audit logs via official Google Cloud Remote MCP servers, and recommend FinOps & security actions.',
  },
  {
    id: 'ZERO_TRUST_SECURITY',
    label: 'Review IAM & Zero-Trust Posture',
    prompt:
      'Review my project IAM posture, public bucket exposure risks, and audit log anomalies via official Google Cloud Remote MCP servers and provide gcloud remediation commands.',
  },
  {
    id: 'DATA_LAKEHOUSE',
    label: 'Review BigQuery & Storage Lakehouse',
    prompt:
      'Review my BigQuery datasets, Cloud Storage buckets, and partitioning/lifecycle best practices using official Google Cloud Remote MCP servers.',
  },
  {
    id: 'SRE_RELIABILITY',
    label: 'Review SRE Logs & Error Rate',
    prompt:
      'Review recent Cloud Logging entries, error patterns, and service health telemetry via official Google Cloud Remote MCP servers and suggest SRE reliability improvements.',
  },
];

function renderInlineMarkdownNodes(text, keyPrefix = 'inl') {
  if (!text) return null;
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|https?:\/\/[^\s)]+)/g;
  const parts = String(text).split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    const key = `${keyPrefix}-${idx}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={key} className="font-extrabold text-zinc-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (/^https?:\/\/[^\s)]+$/.test(part)) {
      return (
        <a
          key={key}
          href={part}
          target="_blank"
          rel="noreferrer"
          className="underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-mono text-[11px]"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function McpFormattedMarkdown({ content, onCopy }) {
  if (!content) return null;
  const raw = String(content).replace(/\r\n/g, '\n');

  // Split by fenced code blocks ```lang ... ```
  const segments = [];
  const fenceRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = fenceRegex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'markdown',
        text: raw.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'code',
      lang: (match[1] || 'bash').trim(),
      code: match[2].trim(),
    });
    lastIndex = fenceRegex.lastIndex;
  }
  if (lastIndex < raw.length) {
    segments.push({
      type: 'markdown',
      text: raw.slice(lastIndex),
    });
  }

  return (
    <div className="space-y-3 text-xs leading-relaxed text-zinc-700 dark:text-zinc-200">
      {segments.map((seg, sIdx) => {
        if (seg.type === 'code') {
          return (
            <div
              key={`code-${sIdx}`}
              className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
                <span className="uppercase font-bold text-indigo-300">
                  {seg.lang || 'CLI / Code'}
                </span>
                {onCopy && (
                  <button
                    type="button"
                    onClick={() => onCopy(seg.code, `${seg.lang || 'code'} snippet`)}
                    className="inline-flex items-center gap-1 text-zinc-300 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                )}
              </div>
              <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                {seg.code}
              </pre>
            </div>
          );
        }

        const lines = seg.text.split('\n');
        const blocks = [];
        let listItems = [];
        let tableRows = [];

        const flushList = (keyBase) => {
          if (listItems.length > 0) {
            blocks.push(
              <ul
                key={`list-${keyBase}`}
                className="space-y-1.5 pl-1"
              >
                {listItems.map((item, lIdx) => (
                  <li
                    key={`li-${keyBase}-${lIdx}`}
                    className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-200"
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      {renderInlineMarkdownNodes(item, `li-${keyBase}-${lIdx}`)}
                    </div>
                  </li>
                ))}
              </ul>
            );
            listItems = [];
          }
        };

        const flushTable = (keyBase) => {
          if (tableRows.length > 0) {
            const dataRows = tableRows.filter(
              (r) => !r.every((cell) => cell.replace(/[-: ]/g, '').trim() === '')
            );
            if (dataRows.length > 0) {
              const header = dataRows[0];
              const body = dataRows.slice(1);
              blocks.push(
                <div
                  key={`tbl-${keyBase}`}
                  className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                        {header.map((h, hIdx) => (
                          <th
                            key={`th-${hIdx}`}
                            className="py-2 px-2.5 font-mono font-extrabold text-zinc-800 dark:text-zinc-200"
                          >
                            {renderInlineMarkdownNodes(h, `th-${keyBase}-${hIdx}`)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {body.map((row, rIdx) => (
                        <tr
                          key={`tr-${rIdx}`}
                          className="bg-white dark:bg-zinc-950/60"
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={`td-${cIdx}`}
                              className="py-1.5 px-2.5 text-zinc-700 dark:text-zinc-300"
                            >
                              {renderInlineMarkdownNodes(
                                cell,
                                `td-${keyBase}-${rIdx}-${cIdx}`
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }
            tableRows = [];
          }
        };

        lines.forEach((rawLine, lIdx) => {
          const line = rawLine.trim();
          if (!line) {
            flushList(`${sIdx}-${lIdx}`);
            flushTable(`${sIdx}-${lIdx}`);
            return;
          }

          if (line.startsWith('|') && line.endsWith('|') && line.length > 2) {
            flushList(`${sIdx}-${lIdx}`);
            const cells = line
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim());
            tableRows.push(cells);
            return;
          }
          flushTable(`${sIdx}-${lIdx}`);

          const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
          if (headingMatch) {
            flushList(`${sIdx}-${lIdx}`);
            const level = headingMatch[1].length;
            const titleText = headingMatch[2];
            blocks.push(
              <div
                key={`hd-${sIdx}-${lIdx}`}
                className={`pt-2 pb-1 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2 ${
                  level <= 2 ? 'text-sm' : 'text-xs'
                } font-extrabold text-zinc-900 dark:text-white`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span>
                  {renderInlineMarkdownNodes(titleText, `hd-${sIdx}-${lIdx}`)}
                </span>
              </div>
            );
            return;
          }

          const bulletMatch = line.match(/^([-*•]|\d+\.)\s+(.*)$/);
          if (bulletMatch) {
            listItems.push(bulletMatch[2]);
            return;
          }

          flushList(`${sIdx}-${lIdx}`);
          blocks.push(
            <p
              key={`p-${sIdx}-${lIdx}`}
              className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed"
            >
              {renderInlineMarkdownNodes(line, `p-${sIdx}-${lIdx}`)}
            </p>
          );
        });

        flushList(`${sIdx}-end`);
        flushTable(`${sIdx}-end`);

        return (
          <div key={`md-seg-${sIdx}`} className="space-y-2.5">
            {blocks}
          </div>
        );
      })}
    </div>
  );
}

function McpStructuredPayloadView({
  parsedContent,
  textContent,
  rawJsonRpc,
  onCopy,
  compact = false,
}) {
  const [viewMode, setViewMode] = useState('FORMATTED'); // 'FORMATTED' | 'RAW'

  const effectiveParsed = useMemo(() => {
    if (parsedContent && typeof parsedContent === 'object') return parsedContent;
    if (textContent) {
      const trimmed = String(textContent).trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          return JSON.parse(trimmed);
        } catch {
          return null;
        }
      }
    }
    return null;
  }, [parsedContent, textContent]);

  const rawString = useMemo(() => {
    if (effectiveParsed) return JSON.stringify(effectiveParsed, null, 2);
    if (textContent) return String(textContent);
    if (rawJsonRpc) return JSON.stringify(rawJsonRpc, null, 2);
    return '';
  }, [effectiveParsed, textContent, rawJsonRpc]);

  // Extract array of items if the JSON object wraps a list (e.g. buckets, items, datasets, entries, results, services, recommendations)
  const structuredSummary = useMemo(() => {
    if (!effectiveParsed) return null;
    if (Array.isArray(effectiveParsed)) {
      return { kind: 'ARRAY', label: 'Items', items: effectiveParsed, scalarPairs: [] };
    }
    const entries = Object.entries(effectiveParsed);
    const arrayEntry = entries.find(([, v]) => Array.isArray(v));
    const scalarPairs = entries.filter(
      ([, v]) => v === null || typeof v !== 'object'
    );
    const nestedObjects = entries.filter(
      ([, v]) => v && typeof v === 'object' && !Array.isArray(v)
    );
    return {
      kind: 'OBJECT',
      label: arrayEntry ? arrayEntry[0] : null,
      items: arrayEntry ? arrayEntry[1] : [],
      scalarPairs,
      nestedObjects,
    };
  }, [effectiveParsed]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewMode('FORMATTED')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
              viewMode === 'FORMATTED'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Formatted Review
          </button>
          <button
            type="button"
            onClick={() => setViewMode('RAW')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
              viewMode === 'RAW'
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}
          >
            Raw JSON-RPC
          </button>
        </div>
        {onCopy && rawString && (
          <button
            type="button"
            onClick={() => onCopy(rawString, 'MCP response payload')}
            className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
        )}
      </div>

      {viewMode === 'RAW' ? (
        <pre
          className={`p-3 rounded-xl bg-zinc-950 text-cyan-300 border border-zinc-800 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap ${
            compact ? 'max-h-44' : 'max-h-72'
          }`}
        >
          {rawString}
        </pre>
      ) : structuredSummary ? (
        <div
          className={`p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2.5 overflow-y-auto ${
            compact ? 'max-h-48' : 'max-h-80'
          }`}
        >
          {/* Scalar Key-Value Grid */}
          {structuredSummary.scalarPairs.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {structuredSummary.scalarPairs.map(([k, v]) => (
                <div
                  key={k}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2 text-[11px] font-mono"
                >
                  <span className="text-zinc-500 truncate">{k}</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[65%]">
                    {String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Nested Objects (e.g. error or metadata) */}
          {structuredSummary.nestedObjects?.map(([objKey, objVal]) => (
            <div
              key={objKey}
              className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1 text-[11px] font-mono"
            >
              <div className="text-[10px] font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
                {objKey}
              </div>
              {Object.entries(objVal)
                .slice(0, 6)
                .map(([subK, subV]) => (
                  <div
                    key={subK}
                    className="flex items-start justify-between gap-2 text-[11px]"
                  >
                    <span className="text-zinc-500 shrink-0">{subK}:</span>
                    <span className="text-zinc-800 dark:text-zinc-200 text-right break-all">
                      {typeof subV === 'object'
                        ? JSON.stringify(subV)
                        : String(subV)}
                    </span>
                  </div>
                ))}
            </div>
          ))}

          {/* Array Items Cards (buckets, datasets, services, docs, log entries) */}
          {structuredSummary.items.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase font-extrabold text-emerald-600 dark:text-emerald-400">
                <span>
                  {structuredSummary.label || 'Records'} (
                  {structuredSummary.items.length})
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {structuredSummary.items.slice(0, 12).map((item, idx) => {
                  if (item === null || typeof item !== 'object') {
                    return (
                      <div
                        key={`scalar-item-${idx}`}
                        className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-300"
                      >
                        {String(item)}
                      </div>
                    );
                  }
                  const titleField =
                    item.name ||
                    item.title ||
                    item.id ||
                    item.datasetId ||
                    item.serviceId ||
                    item.logName ||
                    item.parent ||
                    `Item #${idx + 1}`;
                  const descField =
                    item.description ||
                    item.content ||
                    item.snippet ||
                    item.textPayload ||
                    item.uri ||
                    item.location ||
                    item.storageClass ||
                    '';
                  const metaEntries = Object.entries(item)
                    .filter(
                      ([k, v]) =>
                        !['name', 'title', 'description', 'content', 'snippet', 'textPayload'].includes(k) &&
                        (typeof v === 'string' ||
                          typeof v === 'number' ||
                          typeof v === 'boolean')
                    )
                    .slice(0, 4);
                  return (
                    <div
                      key={`obj-item-${idx}`}
                      className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100 break-all">
                          {String(titleField)}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {metaEntries.map(([mk, mv]) => (
                            <span
                              key={mk}
                              className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-[10px] font-mono"
                            >
                              {mk}: {String(mv).slice(0, 28)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {descField && (
                        <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                          <McpFormattedMarkdown
                            content={String(descField).slice(0, 500)}
                            onCopy={onCopy}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {structuredSummary.scalarPairs.length === 0 &&
            structuredSummary.items.length === 0 &&
            (!structuredSummary.nestedObjects ||
              structuredSummary.nestedObjects.length === 0) && (
              <div className="text-xs font-mono text-zinc-500">
                Empty JSON result (`{}`) returned by MCP endpoint.
              </div>
            )}
        </div>
      ) : (
        <div
          className={`p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 overflow-y-auto ${
            compact ? 'max-h-48' : 'max-h-80'
          }`}
        >
          <McpFormattedMarkdown content={rawString} onCopy={onCopy} />
        </div>
      )}
    </div>
  );
}

export default function GoogleCloudRemoteMcpStudio({
  projectId,
  region = 'us-central1',
  onShowToast,
}) {
  const [catalog, setCatalog] = useState(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected MCP Server & Tools Workbench
  const [selectedServerId, setSelectedServerId] = useState('bigquery');
  const [serverToolsData, setServerToolsData] = useState(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [selectedToolName, setSelectedToolName] = useState('');
  const [toolArgsJson, setToolArgsJson] = useState('{}');
  const [callingTool, setCallingTool] = useState(false);
  const [toolCallResult, setToolCallResult] = useState(null);
  const [destructivePending, setDestructivePending] = useState(null);
  const [enablingApi, setEnablingApi] = useState(false);

  // Multi-Server Triage Chains
  const [activeChainId, setActiveChainId] = useState('FINOPS_QUOTA_DATABASE_PULSE');
  const [runningChain, setRunningChain] = useState(false);
  const [chainResult, setChainResult] = useState(null);

  // Gemini + Official MCP Tool-Calling Agent
  const [agentPrompt, setAgentPrompt] = useState(
    'Inspect my live Cloud Billing status, Cloud Storage buckets, BigQuery datasets, and recent Cloud Audit logs via official Google Cloud Remote MCP servers, and search Google Developer Knowledge for 2026 MCP security best practices.'
  );
  const [runningAgent, setRunningAgent] = useState(false);
  const [agentResult, setAgentResult] = useState(null);

  // IDE MCP Config Exporter
  const [ideTarget, setIdeTarget] = useState('GEMINI_CLI'); // 'GEMINI_CLI' | 'CLAUDE_CODE' | 'CURSOR'
  const [selectedExportServers, setSelectedExportServers] = useState([
    'bigquery',
    'storage',
    'run',
    'container',
    'logging',
    'cloudbilling',
    'policytroubleshooter',
    'developerknowledge',
  ]);

  const notify = useCallback(
    (msg) => {
      if (typeof onShowToast === 'function') onShowToast(msg);
    },
    [onShowToast]
  );

  const fetchMcpCatalog = useCallback(
    async (probeAll = false) => {
      if (!projectId) return;
      setLoadingCatalog(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/mcp/catalog?region=${encodeURIComponent(region)}&probeAll=${
            probeAll ? 'true' : 'false'
          }`
        );
        setCatalog(res.data);
        if (probeAll) {
          notify(
            `Probed all ${res.data?.totalServersInCatalog || 48} Official Google Cloud Remote MCP endpoints (${res.data?.totalToolsDiscovered || 0} live tools discovered).`
          );
        }
      } catch (err) {
        notify(
          `MCP Catalog probe failed: ${
            err.response?.data?.error || err.message
          }`
        );
      } finally {
        setLoadingCatalog(false);
      }
    },
    [projectId, region, notify]
  );

  const fetchToolsForServer = useCallback(
    async (srvId) => {
      if (!projectId || !srvId) return;
      setSelectedServerId(srvId);
      setLoadingTools(true);
      setToolCallResult(null);
      setDestructivePending(null);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/mcp/tools-list`,
          { serverId: srvId, region }
        );
        setServerToolsData(res.data);
        const tools = res.data?.tools || [];
        if (tools.length > 0) {
          // Prefer a readOnlyHint tool as initial selection
          const preferred =
            tools.find((t) => t.annotations?.readOnlyHint) || tools[0];
          setSelectedToolName(preferred.name);
          setToolArgsJson(
            JSON.stringify(preferred.defaultArguments || {}, null, 2)
          );
        } else {
          setSelectedToolName('');
          setToolArgsJson('{}');
        }
      } catch (err) {
        notify(
          `Failed to list MCP tools for ${srvId}: ${
            err.response?.data?.error || err.message
          }`
        );
      } finally {
        setLoadingTools(false);
      }
    },
    [projectId, region, notify]
  );

  useEffect(() => {
    fetchMcpCatalog(false);
    fetchToolsForServer('bigquery');
  }, [fetchMcpCatalog, fetchToolsForServer]);

  const handleSelectTool = (toolObj) => {
    setSelectedToolName(toolObj.name);
    setToolArgsJson(JSON.stringify(toolObj.defaultArguments || {}, null, 2));
    setToolCallResult(null);
    setDestructivePending(null);
  };

  const handleInvokeMcpTool = async (confirmDestructive = false) => {
    if (!projectId || !selectedToolName) return;
    let parsedArgs = {};
    try {
      parsedArgs = toolArgsJson.trim() ? JSON.parse(toolArgsJson) : {};
    } catch (e) {
      notify(`Invalid JSON arguments: ${e.message}`);
      return;
    }

    setCallingTool(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/mcp/call-tool`,
        {
          serverId: selectedServerId,
          endpointUrl: serverToolsData?.endpointUrl,
          toolName: selectedToolName,
          arguments: parsedArgs,
          confirmDestructive,
        },
        {
          validateStatus: (status) => status < 500,
        }
      );

      if (res.status === 409 && res.data?.requiresConfirmation) {
        setDestructivePending(res.data);
        return;
      }

      setDestructivePending(null);
      setToolCallResult(res.data);
      notify(
        `MCP tools/call "${selectedToolName}" completed in ${res.data?.latencyMs || 0}ms.`
      );
    } catch (err) {
      notify(
        `MCP tools/call failed: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setCallingTool(false);
    }
  };

  const handleEnableMissingApiAndRetry = async (serviceApi) => {
    if (!projectId || !serviceApi) return;
    setEnablingApi(true);
    try {
      await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/apis/enable`,
        { services: [serviceApi] }
      );
      notify(`Enabled ${serviceApi} on ${projectId}. Retrying MCP tool call...`);
      await handleInvokeMcpTool(true);
    } catch (err) {
      notify(
        `Failed to enable ${serviceApi}: ${
          err.response?.data?.error || err.message
        }`
      );
    } finally {
      setEnablingApi(false);
    }
  };

  const handleRunTriageChain = async (chainIdToRun) => {
    const targetChain = chainIdToRun || activeChainId;
    setActiveChainId(targetChain);
    setRunningChain(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/mcp/run-triage-chain`,
        { chainId: targetChain, region }
      );
      setChainResult(res.data);
      notify(
        `Executed ${res.data?.title} (${res.data?.passedSteps}/${res.data?.totalSteps} MCP servers responded in ${res.data?.totalWallTimeMs}ms).`
      );
    } catch (err) {
      notify(
        `MCP Triage Chain failed: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningChain(false);
    }
  };

  const handleRunAgentChat = async (e) => {
    if (e) e.preventDefault();
    if (!agentPrompt.trim()) return;
    setRunningAgent(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/mcp/agent-chat`,
        { prompt: agentPrompt, region }
      );
      setAgentResult(res.data);
      notify(
        `Gemini + 5 Official Google Cloud MCP servers completed in ${res.data?.totalWallTimeMs}ms.`
      );
    } catch (err) {
      notify(
        `Agentic MCP turn failed: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setRunningAgent(false);
    }
  };

  const filteredServers = useMemo(() => {
    const list = catalog?.servers || [];
    return list.filter((s) => {
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.endpointUrl.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog?.servers, categoryFilter, searchQuery]);

  const activeToolObj = useMemo(() => {
    return (
      (serverToolsData?.tools || []).find(
        (t) => t.name === selectedToolName
      ) || null
    );
  }, [serverToolsData?.tools, selectedToolName]);

  const ideConfigJson = useMemo(() => {
    const servers = (catalog?.servers || []).filter((s) =>
      selectedExportServers.includes(s.id)
    );
    const mcpServersObj = {};
    servers.forEach((s) => {
      mcpServersObj[`gcp-${s.id}`] = {
        url: s.endpointUrl,
        transport: 'http',
        headers: {
          Authorization: 'Bearer ${GCLOUD_ACCESS_TOKEN}',
          'x-goog-user-project': projectId,
        },
        metadata: {
          product: s.name,
          stage: s.stage,
          documentation: s.docUrl,
        },
      };
    });

    if (ideTarget === 'GEMINI_CLI') {
      return JSON.stringify(
        {
          $schema: 'https://gemini.google.com/schemas/settings.json',
          projectId,
          mcpServers: mcpServersObj,
        },
        null,
        2
      );
    }
    return JSON.stringify(
      {
        mcpServers: mcpServersObj,
      },
      null,
      2
    );
  }, [catalog?.servers, selectedExportServers, ideTarget, projectId]);

  const toggleExportServer = (srvId) => {
    setSelectedExportServers((prev) =>
      prev.includes(srvId)
        ? prev.filter((id) => id !== srvId)
        : [...prev, srvId]
    );
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    notify(`Copied ${label} to clipboard.`);
  };

  return (
    <div className="space-y-5">
      {/* Top Executive Banner */}
      <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-emerald-500/10 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[10px] font-mono font-extrabold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                2026 GOOGLE CLOUD OFFICIAL REMOTE MCP CONTROL PLANE · JSON-RPC 2.0 OVER HTTPS
              </span>
            </div>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              Google-Managed Remote Model Context Protocol (MCP) Hub ({projectId})
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 max-w-4xl">
              Direct JSON-RPC 2.0 integration with Google Cloud&apos;s official{' '}
              <code className="font-mono text-indigo-600 dark:text-indigo-300">
                https://*.googleapis.com/mcp
              </code>{' '}
              servers from{' '}
              <a
                href="https://docs.cloud.google.com/mcp/supported-products"
                target="_blank"
                rel="noreferrer"
                className="underline font-semibold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1"
              >
                <span>docs.cloud.google.com/mcp/supported-products</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              . Inspect live <code className="font-mono">tools/list</code> schemas,
              enforce <code className="font-mono">readOnlyHint</code> /{' '}
              <code className="font-mono">destructiveHint</code> safety gates, invoke{' '}
              <code className="font-mono">tools/call</code> live on{' '}
              <strong>{projectId}</strong>, run 4-server autonomous triage chains, and
              export IDE MCP configs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loadingCatalog}
              onClick={() => fetchMcpCatalog(false)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingCatalog ? 'animate-spin' : ''}`}
              />
              <span>Refresh Core MCP Probe</span>
            </button>
            <button
              type="button"
              disabled={loadingCatalog}
              onClick={() => fetchMcpCatalog(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 text-xs font-mono font-extrabold shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>
                {loadingCatalog
                  ? 'Probing All 48 *.googleapis.com/mcp Endpoints...'
                  : 'Probe All 48 Official MCP Servers Live'}
              </span>
            </button>
          </div>
        </div>

        {/* 4 Telemetry Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
            <div className="text-zinc-500">Official Remote MCP Catalog</div>
            <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {catalog?.totalServersInCatalog || 48} Endpoints
            </div>
            <div className="text-[10px] text-zinc-500">
              {catalog?.onlineServersCount || 0} Probed Online ({catalog?.scanWallTimeMs || 0}ms scan)
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
            <div className="text-zinc-500">Live MCP Tools Discovered</div>
            <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {catalog?.totalToolsDiscovered || 0} JSON-RPC Tools
            </div>
            <div className="text-[10px] text-zinc-500">
              Live via POST https://*.googleapis.com/mcp
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
            <div className="text-zinc-500">Read-Only Safe Tools</div>
            <div className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400 mt-0.5">
              {catalog?.totalReadOnlyTools || 0} readOnlyHint=true
            </div>
            <div className="text-[10px] text-zinc-500">
              Zero-mutation autonomous agent safe
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800">
            <div className="text-zinc-500">Destructive-Gated Tools</div>
            <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
              {catalog?.totalDestructiveTools || 0} destructiveHint=true
            </div>
            <div className="text-[10px] text-zinc-500">
              Protected by Human-in-the-Loop Safety Gate
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: LIVE 48-SERVER REMOTE MCP MATRIX & INTERACTIVE JSON-RPC WORKBENCH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 5 Cols: Official Remote MCP Server Directory */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                1. Official Google Cloud Remote MCP Endpoints
              </h3>
              <p className="text-[11px] text-zinc-500">
                Click any server to run live JSON-RPC <code className="font-mono">tools/list</code>
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-mono font-bold">
              {filteredServers.length} shown
            </span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CATEGORY_LABELS).map(([catKey, catLabel]) => (
              <button
                key={catKey}
                type="button"
                onClick={() => setCategoryFilter(catKey)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                  categoryFilter === catKey
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {catLabel}
              </button>
            ))}
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by product, endpoint (e.g. bigquery, spanner, iam, trace)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-xs font-mono"
            />
          </div>

          {/* Server List */}
          <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
            {filteredServers.map((srv) => {
              const isSelected = selectedServerId === srv.id;
              return (
                <div
                  key={srv.id}
                  onClick={() => fetchToolsForServer(srv.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 hover:border-indigo-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono font-extrabold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          srv.online
                            ? 'bg-emerald-500'
                            : srv.probed
                            ? 'bg-amber-500'
                            : 'bg-zinc-400'
                        }`}
                      />
                      <span>{srv.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-extrabold ${
                          srv.stage === 'GA'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {srv.stage}
                      </span>
                      {srv.toolCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 text-[9px] font-mono font-extrabold">
                          {srv.toolCount} tools
                        </span>
                      )}
                      {srv.latencyMs && (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {srv.latencyMs}ms
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10.5px] font-mono text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                    {srv.endpointUrl}
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1">
                    {srv.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 7 Cols: Interactive JSON-RPC 2.0 tools/list & tools/call Workbench */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-4 flex flex-col space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="text-[10px] font-mono font-extrabold uppercase text-indigo-600 dark:text-indigo-400">
                LIVE JSON-RPC 2.0 WORKBENCH · {serverToolsData?.endpointUrl || 'https://bigquery.googleapis.com/mcp'}
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                2. Interactive MCP Tool Schema Inspector &amp; Live <code className="font-mono">tools/call</code> Executor
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              {serverToolsData?.latencyMs && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  tools/list: {serverToolsData.latencyMs}ms ({serverToolsData.toolCount || 0} tools)
                </span>
              )}
            </div>
          </div>

          {loadingTools ? (
            <div className="py-12 text-center text-xs font-mono text-zinc-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Querying JSON-RPC 2.0 tools/list from Google Cloud MCP endpoint...</span>
            </div>
          ) : (
            <>
              {/* Tool Selector Pills */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                  Available MCP Tools ({serverToolsData?.tools?.length || 0}):
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                  {(serverToolsData?.tools || []).map((t) => {
                    const active = selectedToolName === t.name;
                    const isReadOnly = t.annotations?.readOnlyHint;
                    const isDestructive = t.annotations?.destructiveHint;
                    return (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => handleSelectTool(t)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 hover:border-indigo-500/50'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isDestructive
                              ? 'bg-rose-500'
                              : isReadOnly
                              ? 'bg-emerald-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Tool Details & Annotations */}
              {activeToolObj && (
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-mono font-extrabold text-xs text-zinc-900 dark:text-zinc-100">
                      Tool: <span className="text-indigo-600 dark:text-indigo-400">{activeToolObj.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          activeToolObj.annotations?.readOnlyHint
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        readOnlyHint: {String(Boolean(activeToolObj.annotations?.readOnlyHint))}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          activeToolObj.annotations?.destructiveHint
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                      >
                        destructiveHint: {String(Boolean(activeToolObj.annotations?.destructiveHint))}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
                        idempotentHint: {String(Boolean(activeToolObj.annotations?.idempotentHint))}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {activeToolObj.description}
                  </p>

                  {/* Input Schema Properties Summary */}
                  {activeToolObj.inputSchema?.properties && (
                    <div className="text-[10.5px] font-mono text-zinc-500">
                      Schema Fields:{' '}
                      {Object.keys(activeToolObj.inputSchema.properties).map((propKey) => {
                        const isReq = (activeToolObj.inputSchema.required || []).includes(
                          propKey
                        );
                        return (
                          <span
                            key={propKey}
                            className={`inline-block mr-1.5 mb-1 px-1.5 py-0.5 rounded ${
                              isReq
                                ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold'
                                : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                            }`}
                          >
                            {propKey}
                            {isReq ? '*' : ''}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Arguments Editor */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="font-bold text-zinc-700 dark:text-zinc-300">
                        JSON-RPC <code className="font-mono">params.arguments</code> Payload:
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setToolArgsJson(
                            JSON.stringify(activeToolObj.defaultArguments || {}, null, 2)
                          )
                        }
                        className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Reset to {projectId} Defaults
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={toolArgsJson}
                      onChange={(e) => setToolArgsJson(e.target.value)}
                      className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 p-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  {/* Destructive Safety Gate Warning if triggered */}
                  {destructivePending && (
                    <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-rose-600 dark:text-rose-400">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>HUMAN-IN-THE-LOOP MCP SAFETY GATE INTERCEPTION</span>
                      </div>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300">
                        {destructivePending.message}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInvokeMcpTool(true)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-extrabold cursor-pointer"
                        >
                          Confirm &amp; Execute Destructive MCP Tool
                        </button>
                        <button
                          type="button"
                          onClick={() => setDestructivePending(null)}
                          className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-xs font-mono font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      disabled={callingTool}
                      onClick={() => handleInvokeMcpTool(false)}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>
                        {callingTool
                          ? `Executing tools/call (${activeToolObj.name})...`
                          : `Invoke MCP tools/call (${activeToolObj.name}) on ${projectId}`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `curl -s -X POST "${serverToolsData?.endpointUrl}" \\\n  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\\n  -H "Content-Type: application/json" \\\n  -H "x-goog-user-project: ${projectId}" \\\n  -d '${JSON.stringify({
                            jsonrpc: '2.0',
                            id: 1,
                            method: 'tools/call',
                            params: {
                              name: activeToolObj.name,
                              arguments: (() => {
                                try {
                                  return JSON.parse(toolArgsJson);
                                } catch {
                                  return {};
                                }
                              })(),
                            },
                          })}'`,
                          'JSON-RPC cURL command'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON-RPC cURL</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Live Tool Call Output */}
              {toolCallResult && (
                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          toolCallResult.ok
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        HTTP {toolCallResult.httpStatus} ·{' '}
                        {toolCallResult.ok ? 'JSON-RPC RESULT OK' : 'MCP TOOL NOTICE'}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                        Latency: <strong>{toolCallResult.latencyMs}ms</strong>
                      </span>
                    </div>

                    {toolCallResult.missingServiceApi && (
                      <button
                        type="button"
                        disabled={enablingApi}
                        onClick={() =>
                          handleEnableMissingApiAndRetry(
                            toolCallResult.missingServiceApi
                          )
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-extrabold cursor-pointer disabled:opacity-50"
                      >
                        {enablingApi
                          ? `Enabling ${toolCallResult.missingServiceApi}...`
                          : `1-Click Enable ${toolCallResult.missingServiceApi} & Retry`}
                      </button>
                    )}
                  </div>
                  <McpStructuredPayloadView
                    parsedContent={toolCallResult.parsedContent}
                    textContent={toolCallResult.textContent}
                    rawJsonRpc={toolCallResult.rawJsonRpc}
                    onCopy={copyToClipboard}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SECTION 2: 4 AUTONOMOUS MULTI-SERVER MCP TRIAGE CHAINS */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-mono font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
              CROSS-SERVICE REMOTE MCP ORCHESTRATION
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              3. Autonomous Multi-Server MCP Triage &amp; Intelligence Chains
            </h3>
            <p className="text-xs text-zinc-500">
              Executes coordinated JSON-RPC 2.0 <code className="font-mono">tools/call</code>{' '}
              requests across 4 official <code className="font-mono">*.googleapis.com/mcp</code>{' '}
              servers in parallel.
            </p>
          </div>
          <button
            type="button"
            disabled={runningChain}
            onClick={() => handleRunTriageChain(activeChainId)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>
              {runningChain
                ? 'Executing 4-Server MCP Chain...'
                : 'Run Selected Multi-MCP Triage Chain'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {TRIAGE_CHAINS.map((ch) => {
            const active = activeChainId === ch.id;
            return (
              <div
                key={ch.id}
                onClick={() => handleRunTriageChain(ch.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 hover:border-emerald-500/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                      {ch.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-mono font-bold shrink-0">
                      {ch.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    {ch.description}
                  </p>
                </div>
                <div className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Click to Execute Live &rarr;
                </div>
              </div>
            );
          })}
        </div>

        {chainResult && (
          <div className="space-y-2.5 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                Chain Telemetry: {chainResult.title}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                {chainResult.passedSteps}/{chainResult.totalSteps} MCP Endpoints Responded ·{' '}
                {chainResult.totalWallTimeMs}ms Total Wall Time
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(chainResult.steps || []).map((st) => (
                <div
                  key={st.stepId}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-300">
                      {st.serverId}.googleapis.com/mcp &rarr; {st.toolName}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        st.ok
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {st.latencyMs}ms · HTTP {st.httpStatus}
                    </span>
                  </div>
                  <McpStructuredPayloadView
                    parsedContent={st.parsedContent}
                    textContent={st.textContent || st.outputPreview}
                    onCopy={copyToClipboard}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: GEMINI 2.5 FLASH + OFFICIAL REMOTE MCP TOOL-CALLING AGENT & IDE CONFIG EXPORTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Gemini Agentic MCP Tool-Calling Console */}
        <div className="lg:col-span-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3">
          <div>
            <div className="text-[10px] font-mono font-extrabold uppercase text-purple-600 dark:text-purple-400">
              ZERO-HALLUCINATION AGENTIC SRE · VERTEX AI GEMINI + 5 REMOTE MCP SERVERS
            </div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
              4. Gemini 2.5 Flash Live MCP Review &amp; Tool-Calling Architect
            </h3>
            <p className="text-xs text-zinc-500">
              Autonomously invokes <code className="font-mono">cloudbilling</code>,{' '}
              <code className="font-mono">storage</code>,{' '}
              <code className="font-mono">bigquery</code>,{' '}
              <code className="font-mono">logging</code>, and{' '}
              <code className="font-mono">developerknowledge</code> Remote MCP servers via
              JSON-RPC 2.0 and grounds Gemini on the live outputs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {REVIEW_PRESET_PROMPTS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setAgentPrompt(preset.prompt(projectId))}
                className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10.5px] font-mono font-bold cursor-pointer transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleRunAgentChat} className="space-y-2">
            <textarea
              rows={3}
              value={agentPrompt}
              onChange={(e) => setAgentPrompt(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-2.5 text-xs font-mono"
            />
            <button
              type="submit"
              disabled={runningAgent}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {runningAgent
                  ? 'Calling 5 Official *.googleapis.com/mcp Servers + Gemini...'
                  : 'Execute Grounded Multi-MCP Review'}
              </span>
            </button>
          </form>

          {agentResult && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
                <span>Engine: {agentResult.modelUsed}</span>
                <div className="flex items-center gap-2">
                  <span>Total Turn Latency: {agentResult.totalWallTimeMs}ms</span>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard(agentResult.synthesis, 'MCP Review Report')
                    }
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[10px] font-mono font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy Review</span>
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(agentResult.mcpTraces || []).map((tr) => (
                  <span
                    key={`${tr.serverId}-${tr.toolName}`}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      tr.ok
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {tr.serverId}:{tr.toolName} ({tr.latencyMs}ms)
                  </span>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 max-h-[460px] overflow-y-auto">
                <McpFormattedMarkdown
                  content={agentResult.synthesis}
                  onCopy={copyToClipboard}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right 5 Cols: 1-Click IDE MCP Config Bundle Exporter */}
        <div className="lg:col-span-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-mono font-extrabold uppercase text-cyan-600 dark:text-cyan-400">
                1-CLICK DEVELOPER IDE EXPORT
              </div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                5. Export Official GCP Remote MCP Config
              </h3>
            </div>
            <div className="flex gap-1">
              {['GEMINI_CLI', 'CLAUDE_CODE', 'CURSOR'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setIdeTarget(t)}
                  className={`px-2 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                    ideTarget === t
                      ? 'bg-cyan-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
            {(catalog?.servers || []).slice(0, 18).map((s) => {
              const checked = selectedExportServers.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleExportServer(s.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                    checked
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-500'
                  }`}
                >
                  {checked ? '✓ ' : '+ '}
                  {s.id}
                </button>
              );
            })}
          </div>

          <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-300 border border-zinc-800 text-[10.5px] font-mono overflow-x-auto max-h-56">
            {ideConfigJson}
          </pre>

          <button
            type="button"
            onClick={() =>
              copyToClipboard(ideConfigJson, `${ideTarget} Remote MCP Config`)
            }
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-2 text-xs font-mono font-extrabold cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>
              Copy {ideTarget} Remote MCP Configuration ({selectedExportServers.length} Servers)
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
