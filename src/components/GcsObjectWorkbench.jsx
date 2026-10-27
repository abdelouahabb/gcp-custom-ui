import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  FolderOpen,
  FileText,
  Upload,
  PlusCircle,
  RefreshCw,
  Trash2,
  Eye,
  Save,
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  Download,
  Search,
  Code,
  Table,
  FileSpreadsheet,
  Columns,
  GitCompare,
  Sliders,
  Maximize2,
  Minimize2,
  ChevronRight,
  CornerLeftUp,
  Wand2,
  WrapText,
  ArrowUpDown,
  FileCode,
  Image as ImageIcon,
  Binary,
  RotateCcw,
  FolderPlus,
  Edit3,
  Globe,
  Lock,
  Unlock,
  ExternalLink,
  Link,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Archive,
  CheckSquare,
  Square,
  Key,
} from 'lucide-react';

function formatBytes(bytes = 0) {
  const b = Number(bytes || 0);
  if (b === 0) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Parse CSV or TSV line respecting quoted strings
function parseDelimitedRow(line, delimiter = ',') {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// Detect object format category for Smart Preview & Syntax Validation
function detectObjectFormat(objectName = '', contentType = '', textContent = '') {
  const lowerName = String(objectName || '').toLowerCase();
  const lowerMime = String(contentType || '').toLowerCase();

  if (lowerName.endsWith('.ipynb')) return 'IPYNB';
  if (lowerName.endsWith('.jsonl') || lowerName.endsWith('.ndjson')) return 'JSONL';
  if (lowerName.endsWith('.csv') || lowerMime.includes('csv')) return 'CSV';
  if (lowerName.endsWith('.tsv') || lowerMime.includes('tab-separated')) return 'TSV';
  if (lowerName.endsWith('.json') || lowerMime.includes('json')) return 'JSON';
  if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || lowerMime.includes('markdown'))
    return 'MARKDOWN';
  if (lowerName.endsWith('.svg') || lowerMime.includes('svg')) return 'SVG';
  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm') || lowerMime.includes('html'))
    return 'HTML';
  if (lowerName.endsWith('.yaml') || lowerName.endsWith('.yml') || lowerMime.includes('yaml'))
    return 'YAML';
  if (lowerName.endsWith('.sql') || lowerMime.includes('sql')) return 'SQL';
  if (lowerName.endsWith('.env') || lowerName.includes('.env.')) return 'ENV';
  if (
    lowerMime.startsWith('image/') ||
    /\.(png|jpg|jpeg|gif|webp|ico)$/i.test(lowerName)
  ) {
    return 'IMAGE';
  }

  // Heuristic check if content is valid JSON
  const trimmed = String(textContent || '').trim();
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    try {
      JSON.parse(trimmed);
      return 'JSON';
    } catch {
      // fall through
    }
  }
  return 'CODE';
}

// Infer column data type for Tabular Data Grid preview
function inferColumnType(values = []) {
  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && String(v).trim() !== ''
  );
  if (nonEmpty.length === 0) return 'NULL';
  const sample = nonEmpty.slice(0, 25);
  if (sample.every((v) => typeof v === 'boolean' || /^(true|false)$/i.test(String(v).trim()))) {
    return 'BOOL';
  }
  if (sample.every((v) => !Number.isNaN(Number(v)) && String(v).trim() !== '')) {
    return 'NUM';
  }
  if (
    sample.every(
      (v) =>
        /^\d{4}-\d{2}-\d{2}/.test(String(v).trim()) &&
        !Number.isNaN(Date.parse(String(v).trim()))
    )
  ) {
    return 'DATE';
  }
  return 'STR';
}

// Compute line-by-line unified diff between original GCS text and edited text
function computeLineDiff(originalText = '', modifiedText = '') {
  const origLines = String(originalText || '').split('\n');
  const modLines = String(modifiedText || '').split('\n');
  const maxLines = Math.max(origLines.length, modLines.length);
  const rows = [];
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (let i = 0; i < Math.min(maxLines, 600); i++) {
    const a = origLines[i];
    const b = modLines[i];
    if (a === b) {
      rows.push({ type: 'same', lineOld: i + 1, lineNew: i + 1, text: a ?? '' });
      unchanged++;
    } else {
      if (a !== undefined) {
        rows.push({ type: 'del', lineOld: i + 1, lineNew: null, text: a });
        removed++;
      }
      if (b !== undefined) {
        rows.push({ type: 'add', lineOld: null, lineNew: i + 1, text: b });
        added++;
      }
    }
  }
  return { rows, added, removed, unchanged };
}

const OBJECT_TEMPLATES = [
  {
    id: 'json-config',
    label: 'JSON Config',
    path: 'config/runtime-manifest.json',
    contentType: 'application/json',
    body: JSON.stringify(
      {
        service: 'cloudpulse-gateway',
        environment: 'production',
        region: 'us-central1',
        zeroTrustEnforced: true,
        rateLimitRps: 2500,
        featureFlags: {
          enableLiveTelemetry: true,
          enableAutoTiering: true,
          cacheTtlSeconds: 300,
        },
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
  },
  {
    id: 'csv-dataset',
    label: 'CSV Dataset',
    path: 'datasets/regional-finops-metrics.csv',
    contentType: 'text/csv; charset=utf-8',
    body: [
      'region_id,tier,monthly_gb,unit_rate_usd,cfe_percent,zero_trust_score,active',
      'us-central1,STANDARD,4200,0.020,93,98,true',
      'europe-north1,NEARLINE,8500,0.010,98,100,true',
      'us-east1,COLDLINE,12400,0.004,34,92,true',
      'asia-northeast1,ARCHIVE,29000,0.0012,42,95,false',
      'northamerica-northeast1,STANDARD,3100,0.020,100,99,true',
    ].join('\n'),
  },
  {
    id: 'jsonl-events',
    label: 'JSONL Stream',
    path: 'logs/audit-events.jsonl',
    contentType: 'application/x-ndjson',
    body: [
      JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'INFO',
        event: 'STORAGE_OBJECT_READ',
        actor: 'service-account@gcp.iam',
        latencyMs: 18,
        status: 200,
      }),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'WARN',
        event: 'LIFECYCLE_TRANSITION',
        actor: 'gcs-lifecycle-engine',
        latencyMs: 42,
        status: 200,
      }),
      JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'INFO',
        event: 'DLP_REDACTION_VERIFY',
        actor: 'security-auditor',
        latencyMs: 64,
        status: 201,
      }),
    ].join('\n'),
  },
  {
    id: 'markdown-doc',
    label: 'Markdown Runbook',
    path: 'docs/BUCKET-RUNBOOK.md',
    contentType: 'text/markdown; charset=utf-8',
    body: `# Cloud Storage Zero-Trust & FinOps Runbook

## 1. Security Posture Checklist
- **Public Access Prevention (PAP)**: Enforced at bucket level
- **Uniform Bucket-Level Access (UBLA)**: Enabled (no legacy ACLs)
- **Soft-Delete Retention Window**: 7 days minimum

## 2. Storage Tiering SLA
| Storage Tier | Minimum Duration | Rate ($/GB-mo) | Retrieval Fee |
| :--- | :--- | :--- | :--- |
| STANDARD | 0 days | $0.020 | $0.00 |
| NEARLINE | 30 days | $0.010 | $0.01/GB |
| COLDLINE | 90 days | $0.004 | $0.02/GB |
| ARCHIVE | 365 days | $0.0012 | $0.05/GB |

\`\`\`bash
gcloud storage ls --long gs://my-production-bucket/
\`\`\`
`,
  },
  {
    id: 'sql-transform',
    label: 'BigQuery External SQL',
    path: 'sql/external-lakehouse-query.sql',
    contentType: 'application/sql',
    body: `-- Query GCS Lakehouse files directly via BigLake External Table
CREATE OR REPLACE EXTERNAL TABLE \`analytics.regional_finops_ext\`
OPTIONS (
  format = 'CSV',
  uris = ['gs://YOUR_BUCKET/datasets/*.csv'],
  skip_leading_rows = 1
);

SELECT
  region_id,
  tier,
  SUM(monthly_gb) AS total_gb,
  ROUND(SUM(monthly_gb * unit_rate_usd), 2) AS estimated_monthly_usd
FROM \`analytics.regional_finops_ext\`
WHERE active = TRUE
GROUP BY 1, 2
ORDER BY estimated_monthly_usd DESC;
`,
  },
];

// Client-side Pre-Save & Pre-Public Secret / PII Guardrail Scanner
function scanTextForSecretsAndPii(text = '') {
  const raw = String(text || '');
  if (!raw) return [];
  const rules = [
    {
      id: 'GCP_SA_PRIVATE_KEY',
      label: 'GCP / RSA Private Key Block',
      severity: 'CRITICAL',
      regex: /-----BEGIN (?:RSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA )?PRIVATE KEY-----/g,
      replacement: '-----BEGIN PRIVATE KEY-----[REDACTED_BY_CLOUDPULSE_GUARDRAIL]-----END PRIVATE KEY-----',
    },
    {
      id: 'GOOGLE_API_KEY',
      label: 'Google Cloud / Maps / Gemini API Key (AIza...)',
      severity: 'HIGH',
      regex: /AIza[0-9A-Za-z\-_]{35}/g,
      replacement: 'AIza[REDACTED_GOOGLE_API_KEY]',
    },
    {
      id: 'GCP_OAUTH_TOKEN',
      label: 'Google OAuth2 Access Token (ya29...)',
      severity: 'CRITICAL',
      regex: /ya29\.[0-9A-Za-z\-_]{25,}/g,
      replacement: 'ya29.[REDACTED_GCP_OAUTH_TOKEN]',
    },
    {
      id: 'AWS_ACCESS_KEY',
      label: 'AWS IAM Access Key ID (AKIA...)',
      severity: 'HIGH',
      regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
      replacement: 'AKIA[REDACTED_AWS_KEY]',
    },
    {
      id: 'GITHUB_PAT',
      label: 'GitHub Personal Access Token (ghp_/github_pat_)',
      severity: 'HIGH',
      regex: /\b(?:ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{40,})\b/g,
      replacement: 'ghp_[REDACTED_GITHUB_TOKEN]',
    },
    {
      id: 'GENERIC_SECRET_ASSIGN',
      label: 'Hardcoded Password / Secret / Private Key Value',
      severity: 'MEDIUM',
      regex: /("(?:private_key_id|client_secret|password|api_secret|jwt_secret)"\s*:\s*")([^"\n]{8,})(")/gi,
      replacement: '$1[REDACTED_SECRET]$3',
    },
    {
      id: 'US_SSN_PII',
      label: 'US Social Security Number (PII)',
      severity: 'MEDIUM',
      regex: /\b\d{3}-\d{2}-\d{4}\b/g,
      replacement: '[REDACTED-SSN]',
    },
  ];

  const findings = [];
  for (const r of rules) {
    const matches = raw.match(r.regex);
    if (matches && matches.length > 0) {
      findings.push({
        id: r.id,
        label: r.label,
        severity: r.severity,
        count: matches.length,
        sample: String(matches[0]).slice(0, 36) + (matches[0].length > 36 ? '...' : ''),
        regex: r.regex,
        replacement: r.replacement,
      });
    }
  }
  return findings;
}

export default function GcsObjectWorkbench({
  projectId,
  buckets = [],
  selectedBucket,
  onSelectBucket,
  objects = [],
  loadingObjects = false,
  objectPrefixFilter = '',
  setObjectPrefixFilter,
  showAllVersions = false,
  setShowAllVersions,
  inspectedObject,
  setInspectedObject,
  editedTextContent,
  setEditedTextContent,
  loadingInspect = false,
  handleInspectObject,
  handleSaveEditedObject,
  handleDeleteObject,
  handleRewriteObjectClass,
  fetchObjects,
  fetchBuckets,
  busyKey,
  setBusyKey,
  onOpenBigQuerySql,
  onNavigateStudio,
  onSwitchStorageSubTab,
  onShowToast,
  onShowError,
}) {
  // Asymmetric Master-Detail Layout Ratio
  // COMPACT_LEFT = 33% Explorer / 67% Editor & Preview (Default)
  // BALANCED_LEFT = 42% Explorer / 58% Editor & Preview
  // EQUAL_SPLIT = 50% / 50%
  // FULL_STUDIO = 100% Full-Width Editor & Split Preview
  const [layoutRatio, setLayoutRatio] = useState('COMPACT_LEFT');

  // Explorer navigation mode: 'FOLDER' (virtual folders by '/') vs 'FLAT' (all objects)
  const [explorerMode, setExplorerMode] = useState('FOLDER');
  const [currentFolderPrefix, setCurrentFolderPrefix] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('NAME_ASC'); // NAME_ASC | SIZE_DESC | UPDATED_DESC
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadingBatch, setUploadingBatch] = useState(false);

  // Right Studio Mode: 'SPLIT' | 'PREVIEW' | 'EDITOR' | 'DIFF' | 'METADATA'
  const [studioMode, setStudioMode] = useState('SPLIT');
  const [wordWrap, setWordWrap] = useState(true);
  const [editorFontSize, setEditorFontSize] = useState('text-xs'); // text-[11px] | text-xs | text-sm
  const [showFindBar, setShowFindBar] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const [copiedKey, setCopiedKey] = useState(null);

  // New Object / Template Composer Modal or Inline Bar
  const [showComposerBar, setShowComposerBar] = useState(false);
  const [composerPath, setComposerPath] = useState('config/runtime-manifest.json');
  const [composerContentType, setComposerContentType] = useState('application/json');
  const [composerStorageClass, setComposerStorageClass] = useState('STANDARD');
  const [composerBody, setComposerBody] = useState(OBJECT_TEMPLATES[0].body);

  // Rename / Move / Cross-Bucket Copy Inline State
  const [showRenameBar, setShowRenameBar] = useState(false);
  const [renameTargetBucket, setRenameTargetBucket] = useState('');
  const [renameTargetPath, setRenameTargetPath] = useState('');
  const [renameDeleteSource, setRenameDeleteSource] = useState(true);
  const [publicScopeMode, setPublicScopeMode] = useState('AUTO'); // AUTO | OBJECT_ACL | BUCKET_IAM

  // Multi-Object Selection & Bundle Download State
  const [selectedObjectNames, setSelectedObjectNames] = useState([]);
  const [bundlingDownload, setBundlingDownload] = useState(false);

  // Time-Limited V4 Signed URL & Share Link State
  const [signedUrlTtl, setSignedUrlTtl] = useState(3600); // 900 | 3600 | 86400 | 604800
  const [signedUrlMethod, setSignedUrlMethod] = useState('GET'); // GET | PUT
  const [signedUrlData, setSignedUrlData] = useState(null);
  const [loadingSignedUrl, setLoadingSignedUrl] = useState(false);

  // Object Versioning & Soft-Delete Time-Machine State
  const [objectVersions, setObjectVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [comparedGenerationData, setComparedGenerationData] = useState(null);
  const [loadingCompareGen, setLoadingCompareGen] = useState(false);

  // Tabular Data Grid State (for CSV / TSV / JSONL / JSON arrays)
  const [tableFilter, setTableFilter] = useState('');
  const [tableSortCol, setTableSortCol] = useState(null);
  const [tableSortAsc, setTableSortAsc] = useState(true);

  // Image Preview State
  const [imageZoom, setImageZoom] = useState(100);
  const [imageBg, setImageBg] = useState('CHECKER'); // CHECKER | DARK | LIGHT
  const [imageDimensions, setImageDimensions] = useState(null);

  // Custom Metadata & Headers Editor State
  const [metaContentType, setMetaContentType] = useState('');
  const [metaCacheControl, setMetaCacheControl] = useState('');
  const [metaCustomPairs, setMetaCustomPairs] = useState([]);

  const editorTextareaRef = useRef(null);
  const lineGutterRef = useRef(null);

  // Sync Metadata form whenever inspectedObject changes
  useEffect(() => {
    if (inspectedObject?.metadata) {
      setMetaContentType(inspectedObject.metadata.contentType || 'text/plain; charset=utf-8');
      setMetaCacheControl(inspectedObject.metadata.cacheControl || 'no-cache, max-age=0');
      const rawCustom = inspectedObject.metadata.metadata || {};
      setMetaCustomPairs(
        Object.entries(rawCustom).map(([k, v]) => ({ key: k, value: String(v) }))
      );
      setRenameTargetBucket(inspectedObject.bucketName || selectedBucket?.name || '');
      setRenameTargetPath(inspectedObject.objectName || '');
      setImageDimensions(null);
      setSignedUrlData(null);
      setComparedGenerationData(null);

      // Default to PREVIEW for images/binaries, SPLIT for data/markdown/json, EDITOR for plain code
      if (inspectedObject.isImage || !inspectedObject.isTextLike) {
        setStudioMode((prev) => (prev === 'SPLIT' || prev === 'EDITOR' ? 'PREVIEW' : prev));
      }
    }
  }, [inspectedObject, selectedBucket?.name]);

  // Reset folder prefix & multi-select when switching buckets
  useEffect(() => {
    setCurrentFolderPrefix('');
    setSelectedObjectNames([]);
  }, [selectedBucket?.name]);

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(String(text || ''));
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  // Synchronize line numbers scroll with textarea scroll
  const handleEditorScroll = (e) => {
    if (lineGutterRef.current) {
      lineGutterRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const updateCursorPosition = (e) => {
    const el = e.target;
    const pos = el.selectionStart || 0;
    const upToCursor = String(editedTextContent || '').slice(0, pos);
    const lines = upToCursor.split('\n');
    setCursorPos({
      line: lines.length,
      col: (lines[lines.length - 1]?.length || 0) + 1,
    });
  };

  // Keyboard shortcut Ctrl+S / Cmd+S inside editor
  const handleEditorKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (inspectedObject && inspectedObject.isTextLike) {
        handleSaveEditedObject();
      }
    }
  };

  // Filtered & sorted objects + Virtual Folder tree computation
  const explorerItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = objects.filter((o) => {
      if (q && !String(o.name || '').toLowerCase().includes(q)) return false;
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'SIZE_DESC') return Number(b.size || 0) - Number(a.size || 0);
      if (sortBy === 'UPDATED_DESC') {
        return new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime();
      }
      return String(a.name || '').localeCompare(String(b.name || ''));
    });

    if (explorerMode === 'FLAT' || q) {
      return { folders: [], files: sorted };
    }

    // Group by currentFolderPrefix in FOLDER hierarchy mode
    const folderMap = new Map();
    const filesInFolder = [];

    for (const obj of sorted) {
      const name = String(obj.name || '');
      if (!name.startsWith(currentFolderPrefix)) continue;
      const remainder = name.slice(currentFolderPrefix.length);
      if (!remainder) continue;

      const slashIdx = remainder.indexOf('/');
      if (slashIdx >= 0) {
        const folderName = remainder.slice(0, slashIdx + 1);
        const fullPrefix = currentFolderPrefix + folderName;
        const existing = folderMap.get(fullPrefix) || {
          name: folderName.replace(/\/$/, ''),
          fullPrefix,
          count: 0,
          totalBytes: 0,
        };
        existing.count += 1;
        existing.totalBytes += Number(obj.size || 0);
        folderMap.set(fullPrefix, existing);
      } else {
        filesInFolder.push(obj);
      }
    }

    return {
      folders: Array.from(folderMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      ),
      files: filesInFolder,
    };
  }, [objects, searchQuery, sortBy, explorerMode, currentFolderPrefix]);

  // Breadcrumb segments for currentFolderPrefix
  const folderBreadcrumbs = useMemo(() => {
    if (!currentFolderPrefix) return [];
    const parts = currentFolderPrefix.replace(/\/$/, '').split('/');
    return parts.map((part, idx) => ({
      label: part,
      prefix: `${parts.slice(0, idx + 1).join('/')}/`,
    }));
  }, [currentFolderPrefix]);

  // Detect format & live syntax validation of the currently edited text
  const activeFormat = useMemo(() => {
    if (!inspectedObject) return 'CODE';
    return detectObjectFormat(
      inspectedObject.objectName,
      inspectedObject.metadata?.contentType,
      editedTextContent
    );
  }, [inspectedObject, editedTextContent]);

  // Live Syntax Validation & Parsed Data for Smart Preview
  const previewAnalysis = useMemo(() => {
    const raw = String(editedTextContent || '');
    const lineCount = raw ? raw.split('\n').length : 0;
    const wordCount = raw.trim() ? raw.trim().split(/\s+/).length : 0;
    const byteSize = new Blob([raw]).size;
    const originalRaw = String(inspectedObject?.textPreview || '');
    const hasUnsavedChanges =
      Boolean(inspectedObject?.isTextLike) && raw !== originalRaw;

    // 1. JSON / IPYNB Analysis
    if (activeFormat === 'JSON' || activeFormat === 'IPYNB') {
      try {
        const parsed = JSON.parse(raw || '{}');
        const isArrayOfObjects =
          Array.isArray(parsed) &&
          parsed.length > 0 &&
          typeof parsed[0] === 'object' &&
          parsed[0] !== null;

        let tableData = null;
        if (isArrayOfObjects) {
          const colSet = new Set();
          parsed.slice(0, 100).forEach((row) => {
            if (row && typeof row === 'object') {
              Object.keys(row).forEach((k) => colSet.add(k));
            }
          });
          const columns = Array.from(colSet);
          const rows = parsed.map((row) =>
            columns.map((c) => {
              const val = row?.[c];
              return val !== null && typeof val === 'object'
                ? JSON.stringify(val)
                : val ?? '';
            })
          );
          const colTypes = columns.map((c, idx) =>
            inferColumnType(rows.map((r) => r[idx]))
          );
          tableData = { columns, colTypes, rows };
        }

        return {
          valid: true,
          badgeText: Array.isArray(parsed)
            ? `VALID JSON ARRAY (${parsed.length} items)`
            : `VALID JSON (${Object.keys(parsed || {}).length} top keys)`,
          parsedJson: parsed,
          tableData,
          lineCount,
          wordCount,
          byteSize,
          hasUnsavedChanges,
        };
      } catch (err) {
        return {
          valid: false,
          badgeText: `JSON SYNTAX ERROR: ${err.message}`,
          parsedJson: null,
          tableData: null,
          lineCount,
          wordCount,
          byteSize,
          hasUnsavedChanges,
        };
      }
    }

    // 2. JSONL / NDJSON Stream Analysis
    if (activeFormat === 'JSONL') {
      const nonEmptyLines = raw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const parsedRows = [];
      let errorLine = null;
      const colSet = new Set();

      nonEmptyLines.forEach((line, idx) => {
        try {
          const obj = JSON.parse(line);
          parsedRows.push(obj);
          if (obj && typeof obj === 'object') {
            Object.keys(obj).forEach((k) => colSet.add(k));
          }
        } catch (err) {
          if (!errorLine) errorLine = `Line ${idx + 1}: ${err.message}`;
        }
      });

      const columns = Array.from(colSet);
      const rows = parsedRows.map((row) =>
        columns.map((c) => {
          const val = row?.[c];
          return val !== null && typeof val === 'object'
            ? JSON.stringify(val)
            : val ?? '';
        })
      );
      const colTypes = columns.map((c, idx) =>
        inferColumnType(rows.map((r) => r[idx]))
      );

      return {
        valid: !errorLine,
        badgeText: errorLine
          ? `JSONL ERROR (${errorLine})`
          : `VALID JSONL STREAM (${parsedRows.length} records · ${columns.length} cols)`,
        parsedJson: parsedRows,
        tableData: columns.length > 0 ? { columns, colTypes, rows } : null,
        lineCount,
        wordCount,
        byteSize,
        hasUnsavedChanges,
      };
    }

    // 3. CSV / TSV Tabular Analysis
    if (activeFormat === 'CSV' || activeFormat === 'TSV') {
      const delimiter = activeFormat === 'TSV' ? '\t' : ',';
      const lines = raw
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        return {
          valid: true,
          badgeText: `EMPTY ${activeFormat}`,
          tableData: { columns: [], colTypes: [], rows: [] },
          lineCount,
          wordCount,
          byteSize,
          hasUnsavedChanges,
        };
      }
      const columns = parseDelimitedRow(lines[0], delimiter).map(
        (c, i) => c.trim() || `col_${i + 1}`
      );
      const rows = lines
        .slice(1, 501)
        .map((line) => parseDelimitedRow(line, delimiter));
      const colTypes = columns.map((c, idx) =>
        inferColumnType(rows.map((r) => r[idx]))
      );
      return {
        valid: true,
        badgeText: `${activeFormat} GRID (${rows.length} rows × ${columns.length} cols)`,
        tableData: { columns, colTypes, rows },
        lineCount,
        wordCount,
        byteSize,
        hasUnsavedChanges,
      };
    }

    return {
      valid: true,
      badgeText: `${activeFormat} SOURCE (${lineCount} lines)`,
      parsedJson: null,
      tableData: null,
      lineCount,
      wordCount,
      byteSize,
      hasUnsavedChanges,
    };
  }, [editedTextContent, activeFormat, inspectedObject]);

  // Filtered & sorted rows for the Interactive Tabular Data Grid
  const processedTableRows = useMemo(() => {
    if (!previewAnalysis.tableData) return [];
    const { rows } = previewAnalysis.tableData;
    const q = tableFilter.trim().toLowerCase();
    let list = q
      ? rows.filter((r) =>
          r.some((cell) => String(cell ?? '').toLowerCase().includes(q))
        )
      : [...rows];

    if (tableSortCol !== null) {
      list.sort((a, b) => {
        const va = a[tableSortCol] ?? '';
        const vb = b[tableSortCol] ?? '';
        const na = Number(va);
        const nb = Number(vb);
        if (!Number.isNaN(na) && !Number.isNaN(nb) && va !== '' && vb !== '') {
          return tableSortAsc ? na - nb : nb - na;
        }
        return tableSortAsc
          ? String(va).localeCompare(String(vb))
          : String(vb).localeCompare(String(va));
      });
    }
    return list;
  }, [previewAnalysis.tableData, tableFilter, tableSortCol, tableSortAsc]);

  // Format / Prettify or Minify actions inside the Editor
  const handleFormatEditorContent = (mode = 'PRETTY') => {
    try {
      if (activeFormat === 'JSON' || activeFormat === 'IPYNB') {
        const parsed = JSON.parse(editedTextContent);
        if (mode === 'MINIFY') {
          setEditedTextContent(JSON.stringify(parsed));
          if (onShowToast) onShowToast('Minified JSON payload.');
        } else if (mode === 'SORT_KEYS') {
          const sortObj = (val) => {
            if (Array.isArray(val)) return val.map(sortObj);
            if (val && typeof val === 'object') {
              return Object.keys(val)
                .sort()
                .reduce((acc, k) => {
                  acc[k] = sortObj(val[k]);
                  return acc;
                }, {});
            }
            return val;
          };
          setEditedTextContent(JSON.stringify(sortObj(parsed), null, 2));
          if (onShowToast) onShowToast('Sorted JSON keys alphabetically.');
        } else {
          setEditedTextContent(JSON.stringify(parsed, null, 2));
          if (onShowToast) onShowToast('Formatted JSON with 2-space indentation.');
        }
        return;
      }

      if (mode === 'SORT_KEYS') {
        const sortedLines = String(editedTextContent || '')
          .split('\n')
          .sort((a, b) => a.localeCompare(b))
          .join('\n');
        setEditedTextContent(sortedLines);
        if (onShowToast) onShowToast('Sorted lines alphabetically.');
      }
    } catch (err) {
      if (onShowError) {
        onShowError(`Cannot format invalid JSON: ${err.message}`);
      }
    }
  };

  // Find & Replace inside Editor
  const handleReplaceInEditor = (replaceAll = false) => {
    if (!findTerm) return;
    if (replaceAll) {
      const parts = String(editedTextContent || '').split(findTerm);
      const count = parts.length - 1;
      if (count > 0) {
        setEditedTextContent(parts.join(replaceTerm));
        if (onShowToast) {
          onShowToast(`Replaced ${count} occurrence(s) of "${findTerm}".`);
        }
      }
    } else {
      const idx = String(editedTextContent || '').indexOf(findTerm);
      if (idx >= 0) {
        setEditedTextContent(
          String(editedTextContent).slice(0, idx) +
            replaceTerm +
            String(editedTextContent).slice(idx + findTerm.length)
        );
      }
    }
  };

  // Upload multiple files (via File Picker or Drag-and-Drop) into currentFolderPrefix
  const handleMultiFileUpload = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0 || !selectedBucket) return;
    setUploadingBatch(true);
    try {
      let uploadedCount = 0;
      for (const file of files) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = String(reader.result || '');
            const commaIdx = result.indexOf(',');
            resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const destPath = `${currentFolderPrefix}${file.name}`.replace(/^\/+/, '');
        await axios.post(
          `/api/project/${encodeURIComponent(
            projectId
          )}/storage/buckets/${encodeURIComponent(selectedBucket.name)}/objects`,
          {
            objectName: destPath,
            base64Content: base64,
            contentType: file.type || 'application/octet-stream',
            storageClass: selectedBucket.storageClass || 'STANDARD',
          }
        );
        uploadedCount++;
      }

      if (onShowToast) {
        onShowToast(
          `Uploaded ${uploadedCount} file(s) to gs://${selectedBucket.name}/${currentFolderPrefix}`
        );
      }
      await fetchObjects(selectedBucket.name, { silent: true });
      fetchBuckets({ silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to upload file(s) to Cloud Storage.'
        );
      }
    } finally {
      setUploadingBatch(false);
    }
  };

  // Create New Object from Template / Composer Bar and immediately open it in Editor
  const handleCreateFromComposer = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBucket || !composerPath.trim()) return;
    const cleanPath = composerPath.trim().replace(/^\/+/, '');
    setBusyKey('create-composer-obj');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(selectedBucket.name)}/objects`,
        {
          objectName: cleanPath,
          content: composerBody,
          contentType: composerContentType,
          storageClass: composerStorageClass,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Created gs://${selectedBucket.name}/${cleanPath}!`
        );
      }
      setShowComposerBar(false);
      await fetchObjects(selectedBucket.name, { silent: true });
      fetchBuckets({ silent: true });
      await handleInspectObject({ name: cleanPath }, { silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to create object in bucket.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Rename / Move / Duplicate or Cross-Bucket Copy Object in GCS
  const handleRenameOrCopyObject = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBucket || !inspectedObject || !renameTargetPath.trim()) return;
    const destBucket = (renameTargetBucket || selectedBucket.name).trim();
    const destName = renameTargetPath.trim().replace(/^\/+/, '');
    setBusyKey(`rename-${inspectedObject.objectName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/rewrite`,
        {
          objectName: inspectedObject.objectName,
          destinationBucket: destBucket,
          destinationObjectName: destName,
          deleteSource: renameDeleteSource,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message || `Saved object to gs://${destBucket}/${destName}!`
        );
      }
      setShowRenameBar(false);
      await fetchObjects(selectedBucket.name, { silent: true });
      fetchBuckets({ silent: true });
      if (destBucket === selectedBucket.name) {
        await handleInspectObject({ name: destName }, { silent: true });
      } else if (onSelectBucket && renameDeleteSource) {
        onSelectBucket(destBucket);
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to rename or copy object.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Save Custom Metadata & Cache-Control Headers
  const handleSaveObjectMetadata = async (e) => {
    if (e) e.preventDefault();
    if (!selectedBucket || !inspectedObject) return;
    setBusyKey(`meta-${inspectedObject.objectName}`);
    try {
      const customObj = {};
      metaCustomPairs.forEach((p) => {
        if (p.key && p.key.trim()) {
          customObj[p.key.trim()] = p.value ?? '';
        }
      });
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/metadata`,
        {
          objectName: inspectedObject.objectName,
          contentType: metaContentType,
          cacheControl: metaCacheControl,
          customMetadata: customObj,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Updated metadata on gs://${selectedBucket.name}/${inspectedObject.objectName}`
        );
      }
      setInspectedObject((prev) =>
        prev
          ? {
              ...prev,
              metadata: {
                ...(prev.metadata || {}),
                ...(res.data?.metadata || {}),
              },
            }
          : prev
      );
      fetchObjects(selectedBucket.name, { silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to update object metadata.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Direct Browser Download Trigger
  const handleDownloadObject = (objectName) => {
    if (!selectedBucket || !objectName) return;
    const downloadUrl = `/api/project/${encodeURIComponent(
      projectId
    )}/storage/buckets/${encodeURIComponent(
      selectedBucket.name
    )}/objects/content?name=${encodeURIComponent(objectName)}&download=true`;
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  };

  // Toggle Public Access & Generate Live Public HTTPS URI (https://storage.googleapis.com/...)
  const handleTogglePublicAccess = async (makePublic = true, overrideScope = null) => {
    if (!selectedBucket || !inspectedObject) return;
    const scopeToUse = overrideScope || publicScopeMode;
    setBusyKey(`pub-${inspectedObject.objectName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/public-access`,
        {
          objectName: inspectedObject.objectName,
          makePublic,
          preferredScope: scopeToUse,
        }
      );
      if (res.data?.publicHttpsUrl && makePublic) {
        navigator.clipboard
          ?.writeText(res.data.publicHttpsUrl)
          .catch(() => null);
      }
      // Update inspectedObject in place so the studio never reloads or flashes
      setInspectedObject((prev) =>
        prev
          ? {
              ...prev,
              isPublic: Boolean(res.data?.isPublic),
              publicAccessScope: res.data?.publicAccessScope || (makePublic ? scopeToUse : 'PRIVATE'),
              publicHttpsUrl: res.data?.publicHttpsUrl || prev.publicHttpsUrl,
              authenticatedHttpsUrl:
                res.data?.authenticatedHttpsUrl || prev.authenticatedHttpsUrl,
              gsUri: res.data?.gsUri || prev.gsUri,
            }
          : prev
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            (makePublic
              ? `Converted to Public! Copied HTTPS URI: ${res.data?.publicHttpsUrl}`
              : `Revoked public access on gs://${selectedBucket.name}/${inspectedObject.objectName}`)
        );
      }
      fetchBuckets({ silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            'Failed to update public access on Cloud Storage object.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Real-time Client-Side Secret & PII Pre-Save Guardrail Findings
  const secretFindings = useMemo(
    () => scanTextForSecretsAndPii(editedTextContent),
    [editedTextContent]
  );

  const handleAutoRedactSecrets = () => {
    let sanitized = String(editedTextContent || '');
    for (const f of secretFindings) {
      sanitized = sanitized.replace(f.regex, f.replacement);
    }
    setEditedTextContent(sanitized);
    if (onShowToast) {
      onShowToast(
        `Redacted ${secretFindings.length} secret/PII pattern(s) in editor buffer. Click "Save Generation" to persist.`
      );
    }
  };

  // Feature 1: Generate Time-Limited V4 Signed URL & Temporary Share Link
  const handleGenerateSignedUrl = async (
    overrideTtl = signedUrlTtl,
    overrideMethod = signedUrlMethod
  ) => {
    if (!selectedBucket || !inspectedObject) return;
    setLoadingSignedUrl(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/signed-url`,
        {
          objectName: inspectedObject.objectName,
          ttlSeconds: overrideTtl,
          httpMethod: overrideMethod,
        }
      );
      setSignedUrlData(res.data);
      if (res.data?.temporaryShareUrl) {
        navigator.clipboard
          ?.writeText(res.data.temporaryShareUrl)
          .catch(() => null);
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to generate Signed Share URL.'
        );
      }
    } finally {
      setLoadingSignedUrl(false);
    }
  };

  // Feature 2: Fetch All Historical Object Generations (Time-Machine)
  const fetchObjectVersions = async (objName = inspectedObject?.objectName) => {
    if (!selectedBucket || !objName) return;
    setLoadingVersions(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/versions?name=${encodeURIComponent(objName)}`
      );
      setObjectVersions(res.data?.versions || []);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to fetch object version history.'
        );
      }
    } finally {
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    if (studioMode === 'VERSIONS' && inspectedObject?.objectName) {
      fetchObjectVersions(inspectedObject.objectName);
    }
  }, [studioMode, inspectedObject?.objectName, selectedBucket?.name]);

  // Diff a specific historical #generation against the current live buffer
  const handleCompareGeneration = async (versionItem) => {
    if (!selectedBucket || !versionItem?.generation) return;
    setLoadingCompareGen(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/content?name=${encodeURIComponent(
          versionItem.name
        )}&generation=${encodeURIComponent(versionItem.generation)}`
      );
      setComparedGenerationData({
        generation: versionItem.generation,
        updated: versionItem.updated,
        size: versionItem.size,
        textPreview: res.data?.textPreview || '',
      });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to load generation #${versionItem.generation}`
        );
      }
    } finally {
      setLoadingCompareGen(false);
    }
  };

  // 1-Tap Restore Historical #generation to Live Object
  const handleRestoreGeneration = async (versionItem) => {
    if (!selectedBucket || !versionItem?.generation) return;
    setBusyKey(`restore-gen-${versionItem.generation}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/rewrite`,
        {
          objectName: versionItem.name,
          sourceGeneration: versionItem.generation,
          destinationBucket: selectedBucket.name,
          destinationObjectName: versionItem.name,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Restored generation #${versionItem.generation} to live!`
        );
      }
      await handleInspectObject({ name: versionItem.name }, { silent: true });
      await fetchObjectVersions(versionItem.name);
      fetchObjects(selectedBucket.name, { silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to restore generation #${versionItem.generation}`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Feature 4: Toggle Object-Level Retention Holds (Temporary Hold / Event-Based Hold)
  const handleToggleObjectHold = async (holdField, nextValue) => {
    if (!selectedBucket || !inspectedObject) return;
    setBusyKey(`hold-${holdField}-${inspectedObject.objectName}`);
    try {
      const res = await axios.patch(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/metadata`,
        {
          objectName: inspectedObject.objectName,
          [holdField]: Boolean(nextValue),
        }
      );
      setInspectedObject((prev) =>
        prev
          ? {
              ...prev,
              metadata: {
                ...(prev.metadata || {}),
                ...(res.data?.metadata || {}),
                [holdField]: Boolean(nextValue),
              },
            }
          : prev
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Updated ${holdField} to ${nextValue ? 'ENABLED' : 'RELEASED'}!`
        );
      }
      fetchObjects(selectedBucket.name, { silent: true });
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to update ${holdField}.`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  // Feature 5: Multi-Object .tar Bundle Downloader
  const handleToggleSelectObject = (objName) => {
    setSelectedObjectNames((prev) =>
      prev.includes(objName)
        ? prev.filter((n) => n !== objName)
        : [...prev, objName]
    );
  };

  const handleDownloadSelectedBundle = async () => {
    if (!selectedBucket || selectedObjectNames.length === 0) return;
    setBundlingDownload(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/storage/buckets/${encodeURIComponent(
          selectedBucket.name
        )}/objects/bundle-download`,
        {
          objectNames: selectedObjectNames,
        },
        {
          responseType: 'blob',
        }
      );
      const blobUrl = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute(
        'download',
        `${selectedBucket.name}-bundle-${selectedObjectNames.length}files.tar`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      if (onShowToast) {
        onShowToast(
          `Downloaded ${selectedObjectNames.length} object(s) as POSIX .tar archive!`
        );
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to download multi-object bundle.'
        );
      }
    } finally {
      setBundlingDownload(false);
    }
  };

  // Compute grid column spans from layoutRatio
  const leftColSpanClass =
    layoutRatio === 'COMPACT_LEFT'
      ? 'lg:col-span-4'
      : layoutRatio === 'BALANCED_LEFT'
      ? 'lg:col-span-5'
      : layoutRatio === 'EQUAL_SPLIT'
      ? 'lg:col-span-6'
      : 'hidden';

  const rightColSpanClass =
    layoutRatio === 'COMPACT_LEFT'
      ? 'lg:col-span-8'
      : layoutRatio === 'BALANCED_LEFT'
      ? 'lg:col-span-7'
      : layoutRatio === 'EQUAL_SPLIT'
      ? 'lg:col-span-6'
      : 'lg:col-span-12';

  // Render Smart Visual Preview Panel (used in both 'PREVIEW' and 'SPLIT' modes)
  const renderSmartPreviewPanel = () => {
    if (!inspectedObject) return null;

    // 1. Image Preview with Zoom & Checkerboard Canvas
    if (inspectedObject.isImage && inspectedObject.base64Data) {
      const dataUri = `data:${
        inspectedObject.metadata?.contentType || 'image/png'
      };base64,${inspectedObject.base64Data}`;
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold">
                IMAGE PREVIEW
              </span>
              {imageDimensions && (
                <span className="text-zinc-500 font-bold">
                  {imageDimensions.width} × {imageDimensions.height} px
                </span>
              )}
              <span className="text-zinc-400">
                ({formatBytes(inspectedObject.metadata?.size)})
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-500">Zoom:</span>
              {[50, 100, 150, 200].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setImageZoom(z)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                    imageZoom === z
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-300 dark:border-zinc-800'
                  }`}
                >
                  {z}%
                </button>
              ))}
              <span className="text-[10px] text-zinc-500 ml-1">Canvas:</span>
              {['CHECKER', 'DARK', 'LIGHT'].map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setImageBg(bg)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                    imageBg === bg
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-300 dark:border-zinc-800'
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-auto max-h-[480px] flex items-center justify-center ${
              imageBg === 'DARK'
                ? 'bg-zinc-950'
                : imageBg === 'LIGHT'
                ? 'bg-white'
                : 'bg-[radial-gradient(#a1a1aa_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-100 dark:bg-zinc-900'
            }`}
          >
            <img
              src={dataUri}
              alt={inspectedObject.objectName}
              onLoad={(e) =>
                setImageDimensions({
                  width: e.currentTarget.naturalWidth,
                  height: e.currentTarget.naturalHeight,
                })
              }
              style={{
                transform: `scale(${imageZoom / 100})`,
                transformOrigin: 'center center',
              }}
              className="max-h-96 rounded shadow-md transition-transform"
            />
          </div>
        </div>
      );
    }

    // 2. Binary / Columnar File (Parquet, Avro, GZIP, ZIP, PDF) Hex + ASCII X-Ray
    if (!inspectedObject.isTextLike) {
      return (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Binary className="w-4 h-4 text-amber-500" />
              <div>
                <div className="font-extrabold text-zinc-900 dark:text-zinc-100">
                  Signature: {inspectedObject.detectedSignature || 'Binary Object'}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Showing first 256 bytes Hex + ASCII header inspection ({formatBytes(inspectedObject.metadata?.size)} total)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDownloadObject(inspectedObject.objectName)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full Binary</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-zinc-950 text-emerald-400 border border-zinc-800 text-[11px] font-mono overflow-x-auto leading-relaxed">
            {inspectedObject.hexPreview || 'No binary preview bytes available.'}
          </pre>
        </div>
      );
    }

    // 3. Tabular Data Grid Preview (for CSV, TSV, JSONL, or JSON Array of Objects)
    if (previewAnalysis.tableData && previewAnalysis.tableData.columns.length > 0) {
      const { columns, colTypes, rows } = previewAnalysis.tableData;
      return (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
            <div className="flex items-center gap-2 flex-wrap">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                Interactive Data Grid ({processedTableRows.length} of {rows.length} rows · {columns.length} columns)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 text-zinc-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                  placeholder="Filter rows..."
                  className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg pl-7 pr-2.5 py-1 text-[11px]"
                />
              </div>
              {tableSortCol !== null && (
                <button
                  type="button"
                  onClick={() => setTableSortCol(null)}
                  className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold cursor-pointer"
                >
                  Reset Sort
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-auto max-h-[430px]">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead className="bg-zinc-100 dark:bg-zinc-900 sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="py-2 px-2.5 text-[10px] text-zinc-400 font-bold w-10 border-r border-zinc-200 dark:border-zinc-800">
                    #
                  </th>
                  {columns.map((col, cIdx) => (
                    <th
                      key={col}
                      onClick={() => {
                        if (tableSortCol === cIdx) {
                          setTableSortAsc((v) => !v);
                        } else {
                          setTableSortCol(cIdx);
                          setTableSortAsc(true);
                        }
                      }}
                      className="py-2 px-3 font-extrabold text-zinc-800 dark:text-zinc-200 border-r border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-blue-500/10 select-none whitespace-nowrap"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{col}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold">
                          {colTypes[cIdx]}
                          {tableSortCol === cIdx ? (tableSortAsc ? ' ↑' : ' ↓') : ''}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                {processedTableRows.slice(0, 200).map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-blue-500/[0.06] transition-colors"
                  >
                    <td className="py-1.5 px-2.5 text-[10px] text-zinc-400 border-r border-zinc-200/60 dark:border-zinc-800/60">
                      {rIdx + 1}
                    </td>
                    {columns.map((_, cIdx) => {
                      const val = row[cIdx];
                      const isEmpty =
                        val === undefined || val === null || String(val).trim() === '';
                      return (
                        <td
                          key={cIdx}
                          className="py-1.5 px-3 border-r border-zinc-200/60 dark:border-zinc-800/60 max-w-[260px] truncate"
                          title={String(val ?? '')}
                        >
                          {isEmpty ? (
                            <span className="text-zinc-400 italic text-[10px]">
                              null
                            </span>
                          ) : (
                            <span className="text-zinc-800 dark:text-zinc-200">
                              {String(val)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // 4. Jupyter Notebook (.ipynb) Cell Renderer
    if (activeFormat === 'IPYNB' && previewAnalysis.parsedJson?.cells) {
      const cells = previewAnalysis.parsedJson.cells || [];
      return (
        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
          <div className="text-[11px] font-extrabold text-blue-500 flex items-center justify-between">
            <span>Jupyter Notebook Preview ({cells.length} cells)</span>
            <span className="text-[10px] text-zinc-500">
              Kernel:{' '}
              {previewAnalysis.parsedJson?.metadata?.kernelspec?.display_name ||
                'Python 3'}
            </span>
          </div>
          {cells.map((cell, idx) => {
            const sourceText = Array.isArray(cell.source)
              ? cell.source.join('')
              : String(cell.source || '');
            return (
              <div
                key={idx}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
              >
                <div className="text-[10px] font-bold text-zinc-400 uppercase">
                  Cell [{idx + 1}] · {cell.cell_type}
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                  {sourceText}
                </pre>
              </div>
            );
          })}
        </div>
      );
    }

    // 5. JSON Object Key-Value Tree & Path Inspector
    if (activeFormat === 'JSON' && previewAnalysis.parsedJson !== null) {
      const entries = [];
      const walkJson = (node, path = '$', depth = 0) => {
        if (entries.length >= 250) return;
        if (node !== null && typeof node === 'object') {
          const keys = Object.keys(node);
          keys.forEach((k) => {
            const child = node[k];
            const childPath = Array.isArray(node)
              ? `${path}[${k}]`
              : `${path}.${k}`;
            const valType =
              child === null
                ? 'null'
                : Array.isArray(child)
                ? `array[${child.length}]`
                : typeof child;
            entries.push({
              path: childPath,
              key: k,
              depth,
              valType,
              preview:
                child !== null && typeof child === 'object'
                  ? null
                  : JSON.stringify(child),
            });
            if (child !== null && typeof child === 'object' && depth < 4) {
              walkJson(child, childPath, depth + 1);
            }
          });
        }
      };
      walkJson(previewAnalysis.parsedJson);

      return (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200">
              JSON Schema & Path Tree ({entries.length} nodes)
            </span>
            <span className="text-[10px] text-zinc-500">
              Click any row to copy its JSONPath
            </span>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200/60 dark:divide-zinc-800/60 max-h-[430px] overflow-y-auto text-xs font-mono">
            {entries.map((item) => (
              <div
                key={item.path}
                onClick={() => handleCopyText(item.path, item.path)}
                style={{ paddingLeft: `${Math.min(item.depth * 16 + 12, 84)}px` }}
                className="py-1.5 pr-3 flex items-center justify-between gap-2 hover:bg-blue-500/[0.06] cursor-pointer"
                title={`Click to copy JSONPath: ${item.path}`}
              >
                <div className="min-w-0 flex items-center gap-2 truncate">
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {item.key}:
                  </span>
                  {item.preview !== null ? (
                    <span className="text-emerald-700 dark:text-emerald-300 truncate">
                      {item.preview}
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-500">
                      {item.valType}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">
                  {copiedKey === item.path ? 'Copied!' : item.path}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 6. Markdown / HTML / SVG Live Rendered Document Preview
    if (activeFormat === 'MARKDOWN' || activeFormat === 'SVG' || activeFormat === 'HTML') {
      if (activeFormat === 'SVG') {
        const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(
          editedTextContent || ''
        )}`;
        return (
          <div className="p-6 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center max-h-[430px] overflow-auto">
            <img
              src={svgDataUri}
              alt="Rendered SVG Preview"
              className="max-h-80 rounded"
            />
          </div>
        );
      }

      // Clean Markdown line renderer
      const mdLines = String(editedTextContent || '').split('\n');
      return (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 space-y-2 max-h-[430px] overflow-y-auto font-sans text-xs">
          <div className="text-[10px] font-mono font-extrabold uppercase text-blue-500 pb-1 border-b border-zinc-200 dark:border-zinc-800">
            Rendered Document Preview ({inspectedObject.objectName})
          </div>
          {mdLines.map((line, idx) => {
            if (line.startsWith('# ')) {
              return (
                <h1
                  key={idx}
                  className="text-base font-extrabold text-zinc-900 dark:text-white pt-1"
                >
                  {line.slice(2)}
                </h1>
              );
            }
            if (line.startsWith('## ')) {
              return (
                <h2
                  key={idx}
                  className="text-sm font-extrabold text-blue-600 dark:text-blue-400 pt-1"
                >
                  {line.slice(3)}
                </h2>
              );
            }
            if (line.startsWith('### ')) {
              return (
                <h3
                  key={idx}
                  className="text-xs font-bold text-zinc-800 dark:text-zinc-200"
                >
                  {line.slice(4)}
                </h3>
              );
            }
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return (
                <div
                  key={idx}
                  className="pl-3 flex items-start gap-2 text-zinc-700 dark:text-zinc-300"
                >
                  <span className="text-blue-500 font-bold">•</span>
                  <span>{line.slice(2)}</span>
                </div>
              );
            }
            if (line.startsWith('|') && line.endsWith('|')) {
              return (
                <div
                  key={idx}
                  className="font-mono text-[11px] bg-white dark:bg-zinc-950 px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                >
                  {line}
                </div>
              );
            }
            if (!line.trim()) {
              return <div key={idx} className="h-1.5" />;
            }
            return (
              <p
                key={idx}
                className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono text-[11px]"
              >
                {line}
              </p>
            );
          })}
        </div>
      );
    }

    // 7. Default Code / Config Structured Summary + Line Preview
    const nonEmptyLines = String(editedTextContent || '')
      .split('\n')
      .filter((l) => l.trim().length > 0);
    const commentLines = nonEmptyLines.filter(
      (l) =>
        l.trim().startsWith('#') ||
        l.trim().startsWith('//') ||
        l.trim().startsWith('--')
    );

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase">Total Lines</div>
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
              {previewAnalysis.lineCount}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase">Active Statements</div>
            <div className="text-sm font-extrabold text-blue-500">
              {nonEmptyLines.length - commentLines.length}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] text-zinc-400 uppercase">UTF-8 Size</div>
            <div className="text-sm font-extrabold text-emerald-500">
              {formatBytes(previewAnalysis.byteSize)}
            </div>
          </div>
        </div>

        <pre className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-800 dark:text-zinc-200 max-h-[380px] overflow-auto whitespace-pre-wrap">
          {editedTextContent || '(Empty object)'}
        </pre>
      </div>
    );
  };

  // Render Pro Line-Numbered Code Editor Panel
  const renderCodeEditorPanel = () => {
    const lineCount = Math.max(
      1,
      String(editedTextContent || '').split('\n').length
    );
    const lineNumbers = Array.from({ length: Math.min(lineCount, 2000) }, (_, i) => i + 1);

    return (
      <div className="space-y-2">
        {/* Editor Action & Formatting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`px-2 py-0.5 rounded font-extrabold border ${
                previewAnalysis.valid
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-red-500/15 text-red-500 border-red-500/30'
              }`}
            >
              {previewAnalysis.badgeText}
            </span>

            {(activeFormat === 'JSON' || activeFormat === 'IPYNB') && (
              <>
                <button
                  type="button"
                  onClick={() => handleFormatEditorContent('PRETTY')}
                  className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950 hover:border-blue-500/50 border border-zinc-300 dark:border-zinc-800 font-bold cursor-pointer inline-flex items-center gap-1"
                  title="Prettify JSON with 2-space indentation"
                >
                  <Wand2 className="w-3 h-3 text-blue-500" />
                  <span>Prettify</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFormatEditorContent('MINIFY')}
                  className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950 hover:border-blue-500/50 border border-zinc-300 dark:border-zinc-800 font-bold cursor-pointer"
                  title="Minify JSON to single line"
                >
                  Minify
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => handleFormatEditorContent('SORT_KEYS')}
              className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950 hover:border-blue-500/50 border border-zinc-300 dark:border-zinc-800 font-bold cursor-pointer inline-flex items-center gap-1"
              title="Sort JSON keys or text lines alphabetically"
            >
              <ArrowUpDown className="w-3 h-3 text-zinc-500" />
              <span>Sort</span>
            </button>

            <button
              type="button"
              onClick={() => setShowFindBar((v) => !v)}
              className={`px-2 py-0.5 rounded border font-bold cursor-pointer inline-flex items-center gap-1 ${
                showFindBar
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-800'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Find / Replace</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setWordWrap((w) => !w)}
              className={`px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 ${
                wordWrap
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30'
                  : 'bg-white dark:bg-zinc-950 text-zinc-500 border-zinc-300 dark:border-zinc-800'
              }`}
            >
              <WrapText className="w-3 h-3" />
              <span>{wordWrap ? 'Wrap ON' : 'No Wrap'}</span>
            </button>

            <select
              value={editorFontSize}
              onChange={(e) => setEditorFontSize(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded px-1.5 py-0.5 text-[10px] font-bold"
              title="Editor Font Size"
            >
              <option value="text-[11px]">11px</option>
              <option value="text-xs">12px</option>
              <option value="text-sm">14px</option>
            </select>

            <button
              type="button"
              onClick={() => handleCopyText(editedTextContent, 'editor-body')}
              className="px-2 py-0.5 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 font-bold cursor-pointer inline-flex items-center gap-1"
            >
              {copiedKey === 'editor-body' ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              <span>{copiedKey === 'editor-body' ? 'Copied' : 'Copy'}</span>
            </button>

            {previewAnalysis.hasUnsavedChanges && (
              <button
                type="button"
                onClick={() =>
                  setEditedTextContent(inspectedObject?.textPreview || '')
                }
                className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-bold cursor-pointer inline-flex items-center gap-1"
                title="Discard unsaved edits and restore live GCS generation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional In-Editor Find & Replace Bar */}
        {showFindBar && (
          <div className="p-2 rounded-xl bg-blue-500/[0.07] border border-blue-500/30 flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={findTerm}
              onChange={(e) => setFindTerm(e.target.value)}
              placeholder="Find text..."
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs"
            />
            <input
              type="text"
              value={replaceTerm}
              onChange={(e) => setReplaceTerm(e.target.value)}
              placeholder="Replace with..."
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => handleReplaceInEditor(false)}
              className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold cursor-pointer"
            >
              Replace Next
            </button>
            <button
              type="button"
              onClick={() => handleReplaceInEditor(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
            >
              Replace All
            </button>
            {findTerm && (
              <span className="text-[11px] text-zinc-500 font-bold">
                {String(editedTextContent || '').split(findTerm).length - 1} match(es)
              </span>
            )}
          </div>
        )}

        {/* Synchronized Line-Numbered Code Editor */}
        <div className="relative flex rounded-xl border border-zinc-300 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 overflow-hidden">
          <div
            ref={lineGutterRef}
            className={`select-none py-3 px-2.5 bg-zinc-100 dark:bg-zinc-900/90 border-r border-zinc-200 dark:border-zinc-800 text-right font-mono ${editorFontSize} leading-5 text-zinc-400 overflow-hidden max-h-[430px] min-w-[44px]`}
          >
            {lineNumbers.map((n) => (
              <div
                key={n}
                className={
                  cursorPos.line === n
                    ? 'text-blue-600 dark:text-blue-400 font-extrabold'
                    : ''
                }
              >
                {n}
              </div>
            ))}
          </div>

          <textarea
            ref={editorTextareaRef}
            rows={18}
            value={editedTextContent}
            onChange={(e) => {
              setEditedTextContent(e.target.value);
              updateCursorPosition(e);
            }}
            onClick={updateCursorPosition}
            onKeyUp={updateCursorPosition}
            onKeyDown={handleEditorKeyDown}
            onScroll={handleEditorScroll}
            spellCheck={false}
            wrap={wordWrap ? 'soft' : 'off'}
            className={`w-full max-h-[430px] bg-transparent p-3 font-mono ${editorFontSize} leading-5 text-emerald-800 dark:text-emerald-300 focus:outline-none resize-y ${
              wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
            }`}
          />
        </div>

        {/* Editor Telemetry Status Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span>
              Ln <strong className="text-zinc-800 dark:text-zinc-200">{cursorPos.line}</strong>, Col{' '}
              <strong className="text-zinc-800 dark:text-zinc-200">{cursorPos.col}</strong>
            </span>
            <span>Lines: {previewAnalysis.lineCount}</span>
            <span>Words: {previewAnalysis.wordCount}</span>
            <span>UTF-8 Bytes: {formatBytes(previewAnalysis.byteSize)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Shortcut: Ctrl+S / Cmd+S to Save Generation</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Studio Control Bar: Breadcrumbs, + New Object from Template & Layout Ratio Switcher */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <FolderOpen className="w-4 h-4 text-blue-500" />
          <button
            type="button"
            onClick={() => setCurrentFolderPrefix('')}
            className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            gs://{selectedBucket?.name || '(Select Bucket)'}
          </button>
          {folderBreadcrumbs.map((bc) => (
            <React.Fragment key={bc.prefix}>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <button
                type="button"
                onClick={() => setCurrentFolderPrefix(bc.prefix)}
                className="text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:text-blue-500 cursor-pointer"
              >
                {bc.label}/
              </button>
            </React.Fragment>
          ))}
          {inspectedObject && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                {inspectedObject.objectName.split('/').pop()}
              </span>
            </>
          )}
        </div>

        {/* Right Controls: + New Object / Templates + Asymmetric Layout Split Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setComposerPath(
                `${currentFolderPrefix}config/runtime-manifest.json`
              );
              setShowComposerBar((v) => !v);
            }}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ New Object / Template</span>
          </button>

          <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>{uploadingBatch ? 'Uploading...' : 'Upload File(s)'}</span>
            <input
              type="file"
              multiple
              onChange={(e) => {
                handleMultiFileUpload(e.target.files);
                e.target.value = '';
              }}
              disabled={uploadingBatch || !selectedBucket}
              className="hidden"
            />
          </label>

          {/* Layout Split Ratio Selector */}
          <div className="hidden lg:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px]">
            {[
              { id: 'COMPACT_LEFT', label: '33% / 67%' },
              { id: 'BALANCED_LEFT', label: '42% / 58%' },
              { id: 'EQUAL_SPLIT', label: '50% / 50%' },
              { id: 'FULL_STUDIO', label: '100% Full Studio' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setLayoutRatio(r.id)}
                className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                  layoutRatio === r.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Connected GCP Pipeline & Security Bridge (Cross-Studio Deep-Links) */}
      {selectedBucket && (
        <div className="p-2.5 rounded-xl bg-zinc-50/90 dark:bg-[#16171a] border border-zinc-200 dark:border-zinc-800 space-y-2 font-mono text-[11px]">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[9.5px] font-extrabold uppercase">
                Connected Studios
              </span>
              <span className="truncate">
                Active target:{' '}
                <strong className="text-zinc-900 dark:text-zinc-100">
                  gs://{selectedBucket.name}
                  {inspectedObject?.name ? `/${inspectedObject.name}` : ''}
                </strong>
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5 w-full">
            {[
              {
                key: 'QUERY_BQ',
                code: 'B01',
                label: 'Query in BigQuery SQL',
                title:
                  'Open BigQuery Studio with an External Table query for this bucket/object',
                onClick: () => {
                  if (!onOpenBigQuerySql) return;
                  const objName = inspectedObject?.name || '*.parquet';
                  const extFormat = objName.toLowerCase().endsWith('.parquet')
                    ? 'PARQUET'
                    : objName.toLowerCase().endsWith('.csv')
                    ? 'CSV'
                    : 'JSON';
                  const safeTbl = selectedBucket.name
                    .replace(/[^a-zA-Z0-9_]/g, '_')
                    .slice(0, 32);
                  const sql = `-- Auto-generated BigQuery External Lakehouse Table for gs://${selectedBucket.name}/${objName}\nCREATE OR REPLACE EXTERNAL TABLE \`${projectId}.analytics.${safeTbl}_ext\`\nOPTIONS (\n  format = '${extFormat}',\n  uris = ['gs://${selectedBucket.name}/${objName}']\n);\n\nSELECT * FROM \`${projectId}.analytics.${safeTbl}_ext\` LIMIT 100;`;
                  onOpenBigQuerySql(sql);
                },
              },
              {
                key: 'BIGLAKE_ICEBERG',
                code: 'B02',
                label: 'BigLake Iceberg',
                title:
                  'Mount this GCS bucket as an Apache Iceberg Open Table in BigLake Studio',
                onClick: () =>
                  onNavigateStudio && onNavigateStudio('BIGLAKE_ICEBERG'),
              },
              {
                key: 'MEDALLION_ELT',
                code: 'B03',
                label: 'Medallion ELT',
                title:
                  'Build a Bronze-Silver-Gold Medallion pipeline from this bucket',
                onClick: () =>
                  onNavigateStudio && onNavigateStudio('DATA_PIPELINES'),
              },
              {
                key: 'RAM_DLP_XRAY',
                code: 'B04',
                label: 'RAM DLP X-Ray (M06)',
                title:
                  'Scan this bucket in-memory for leaked secrets, API keys, and PII (M06)',
                onClick: () =>
                  onSwitchStorageSubTab && onSwitchStorageSubTab('DLP_XRAY'),
              },
              {
                key: 'S3_MINIO_IMPORT',
                code: 'B05',
                label: 'S3 / MinIO Import (M03)',
                title:
                  'Import objects from AWS S3, MinIO, or Ceph RADOS Gateway into this bucket (M03)',
                onClick: () =>
                  onSwitchStorageSubTab &&
                  onSwitchStorageSubTab('S3_COMPATIBLE_IMPORT'),
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                title={item.title}
                className="w-full h-9 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1b1c1f] hover:border-blue-500/60 dark:hover:border-blue-400/60 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-mono font-semibold transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate">{item.label}</span>
                </div>
                <span className="text-zinc-400 dark:text-zinc-500 shrink-0">
                  →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsible New Object & Data Engineering Template Composer */}
      {showComposerBar && (
        <form
          onSubmit={handleCreateFromComposer}
          className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/[0.06] border border-emerald-500/40 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              <span>
                Create New Object in gs://{selectedBucket?.name} (or Load a Preset Template)
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-zinc-500 font-bold">Templates:</span>
              {OBJECT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    setComposerPath(`${currentFolderPrefix}${tpl.path}`);
                    setComposerContentType(tpl.contentType);
                    setComposerBody(tpl.body);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-900 border border-emerald-500/30 hover:border-emerald-500 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowComposerBar(false)}
                className="px-2 py-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-[10px] font-bold cursor-pointer ml-2"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <input
              type="text"
              value={composerPath}
              onChange={(e) => setComposerPath(e.target.value)}
              placeholder="path/to/object.json"
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-bold"
            />
            <select
              value={composerContentType}
              onChange={(e) => setComposerContentType(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-1.5"
            >
              <option value="application/json">application/json</option>
              <option value="text/csv; charset=utf-8">text/csv</option>
              <option value="application/x-ndjson">application/x-ndjson (JSONL)</option>
              <option value="text/markdown; charset=utf-8">text/markdown</option>
              <option value="application/sql">application/sql</option>
              <option value="application/x-yaml">application/x-yaml</option>
              <option value="text/plain; charset=utf-8">text/plain</option>
            </select>
            <select
              value={composerStorageClass}
              onChange={(e) => setComposerStorageClass(e.target.value)}
              className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3 py-1.5 font-bold text-blue-500"
            >
              <option value="STANDARD">STANDARD (Hot)</option>
              <option value="NEARLINE">NEARLINE (30d)</option>
              <option value="COLDLINE">COLDLINE (90d)</option>
              <option value="ARCHIVE">ARCHIVE (365d)</option>
            </select>
          </div>

          <textarea
            rows={5}
            value={composerBody}
            onChange={(e) => setComposerBody(e.target.value)}
            className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 text-xs font-mono"
          />

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={busyKey === 'create-composer-obj' || !selectedBucket}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer disabled:opacity-50"
            >
              {busyKey === 'create-composer-obj'
                ? 'Creating in GCS...'
                : `Create & Open in Studio -> gs://${selectedBucket?.name}/${composerPath}`}
            </button>
          </div>
        </form>
      )}

      {/* Main Master-Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ================================================================ */}
        {/* LEFT PANEL: VIRTUAL FOLDER TREE, SEARCH & DRAG-DROP UPLOADER     */}
        {/* ================================================================ */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
            if (e.dataTransfer?.files?.length) {
              handleMultiFileUpload(e.dataTransfer.files);
            }
          }}
          className={`${leftColSpanClass} p-4 rounded-2xl bg-white dark:bg-zinc-900/85 border transition-all space-y-3 ${
            isDraggingOver
              ? 'border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-500/[0.05]'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          {/* Explorer Mode Switcher + Versions Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 text-[10px]">
              <button
                type="button"
                onClick={() => setExplorerMode('FOLDER')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  explorerMode === 'FOLDER'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-500'
                }`}
              >
                Folders
              </button>
              <button
                type="button"
                onClick={() => setExplorerMode('FLAT')}
                className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  explorerMode === 'FLAT'
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-500'
                }`}
              >
                Flat ({objects.length})
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowAllVersions((v) => !v)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border cursor-pointer ${
                  showAllVersions
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                    : 'bg-zinc-100 dark:bg-zinc-950 text-zinc-500 border-zinc-300 dark:border-zinc-800'
                }`}
              >
                {showAllVersions ? 'All Versions' : 'Live Only'}
              </button>

              <button
                type="button"
                onClick={() => fetchObjects(selectedBucket?.name)}
                className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-blue-500 cursor-pointer"
                title="Refresh objects"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loadingObjects ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Search & Sort Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Search objects by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-8 pr-2.5 py-1.5 text-[11px]"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-100 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-[10px] font-bold"
            >
              <option value="NAME_ASC">Sort: Name</option>
              <option value="SIZE_DESC">Sort: Largest</option>
              <option value="UPDATED_DESC">Sort: Newest</option>
            </select>
          </div>

          {/* Drag-and-Drop Hint + Multi-Object Bundle Download Bar */}
          <div className="space-y-2">
            <div className="px-3 py-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 text-[10px] text-zinc-500 flex items-center justify-between">
              <span>
                Drop files here to upload to{' '}
                <strong className="text-blue-500">
                  /{currentFolderPrefix || ''}
                </strong>
              </span>
              <Upload className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </div>

            {explorerItems.files.length > 0 && (
              <div className="p-2 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allVisibleNames = explorerItems.files.map(
                        (f) => f.name
                      );
                      const allSelected = allVisibleNames.every((n) =>
                        selectedObjectNames.includes(n)
                      );
                      setSelectedObjectNames(allSelected ? [] : allVisibleNames);
                    }}
                    className="px-2 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <CheckSquare className="w-3 h-3 text-blue-500" />
                    <span>
                      {selectedObjectNames.length > 0
                        ? `Selected (${selectedObjectNames.length})`
                        : 'Select All'}
                    </span>
                  </button>
                  {selectedObjectNames.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedObjectNames([])}
                      className="px-2 py-1 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    selectedObjectNames.length === 0 || bundlingDownload
                  }
                  onClick={handleDownloadSelectedBundle}
                  title="Package selected objects into a single POSIX .tar archive and download"
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-40 transition-colors"
                >
                  <Archive className="w-3 h-3" />
                  <span>
                    {bundlingDownload
                      ? 'Packing .tar...'
                      : `Bundle .tar (${selectedObjectNames.length})`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Object & Virtual Folder List */}
          {loadingObjects ? (
            <div className="p-6 text-center text-xs text-zinc-500 animate-pulse">
              Querying gs://{selectedBucket?.name}...
            </div>
          ) : explorerItems.folders.length === 0 &&
            explorerItems.files.length === 0 ? (
            <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-center space-y-2">
              <div className="text-xs font-bold text-zinc-500">
                No objects in /{currentFolderPrefix}
              </div>
              {currentFolderPrefix && (
                <button
                  type="button"
                  onClick={() => setCurrentFolderPrefix('')}
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold cursor-pointer"
                >
                  Return to Bucket Root
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/80 max-h-[520px] overflow-y-auto pr-0.5">
              {/* Up One Folder Row */}
              {explorerMode === 'FOLDER' && currentFolderPrefix && (
                <button
                  type="button"
                  onClick={() => {
                    const trimmed = currentFolderPrefix.replace(/\/$/, '');
                    const lastSlash = trimmed.lastIndexOf('/');
                    setCurrentFolderPrefix(
                      lastSlash >= 0 ? `${trimmed.slice(0, lastSlash + 1)}` : ''
                    );
                  }}
                  className="w-full py-2 px-2.5 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 rounded-lg cursor-pointer"
                >
                  <CornerLeftUp className="w-3.5 h-3.5" />
                  <span>.. (Up to parent folder)</span>
                </button>
              )}

              {/* Virtual Folder Rows */}
              {explorerItems.folders.map((folder) => (
                <div
                  key={folder.fullPrefix}
                  onClick={() => setCurrentFolderPrefix(folder.fullPrefix)}
                  className="py-2.5 px-2.5 flex items-center justify-between gap-2 text-xs hover:bg-blue-500/[0.08] rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="font-extrabold text-zinc-900 dark:text-zinc-100 truncate">
                      {folder.name}/
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 shrink-0">
                    {folder.count} item(s) · {formatBytes(folder.totalBytes)}
                  </div>
                </div>
              ))}

              {/* Object File Rows */}
              {explorerItems.files.map((o) => {
                const isInspected = inspectedObject?.objectName === o.name;
                const isChecked = selectedObjectNames.includes(o.name);
                const displayName =
                  explorerMode === 'FOLDER' &&
                  o.name.startsWith(currentFolderPrefix)
                    ? o.name.slice(currentFolderPrefix.length)
                    : o.name;
                const fmt = detectObjectFormat(o.name, o.contentType);
                return (
                  <div
                    key={`${o.name}-${o.generation}`}
                    onClick={() => handleInspectObject(o)}
                    className={`py-2.5 px-2.5 flex items-center justify-between gap-2 text-xs transition-all cursor-pointer rounded-xl ${
                      isInspected
                        ? 'bg-blue-600/15 border border-blue-500/40 shadow-sm'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-950/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-start gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectObject(o.name);
                        }}
                        title="Select object for multi-file .tar bundle download"
                        className="mt-0.5 text-zinc-400 hover:text-blue-500 shrink-0 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate" title={o.name}>
                            {displayName}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold shrink-0">
                            {fmt}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{formatBytes(o.size)}</span>
                          <span>·</span>
                          <span className="text-blue-500 font-bold">
                            {o.storageClass}
                          </span>
                          {o.timeDeleted && (
                            <span className="px-1 rounded bg-amber-500/20 text-amber-400">
                              ARCHIVED GEN
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const encPath = String(o.name)
                            .split('/')
                            .map((s) => encodeURIComponent(s))
                            .join('/');
                          const url = `https://storage.cloud.google.com/${encodeURIComponent(
                            selectedBucket?.name || ''
                          )}/${encPath}`;
                          handleCopyText(url, `row-url-${o.name}`);
                          if (onShowToast) {
                            onShowToast(`Copied Authenticated HTTPS URL: ${url}`);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-600 dark:text-zinc-300 cursor-pointer"
                        title="Copy Authenticated HTTPS URL (https://storage.cloud.google.com/...)"
                      >
                        {copiedKey === `row-url-${o.name}` ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Link className="w-3 h-3" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadObject(o.name)}
                        className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white text-zinc-600 dark:text-zinc-300 cursor-pointer"
                        title="Download object to laptop"
                      >
                        <Download className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteObject(o)}
                        disabled={
                          busyKey === `obj-del-${o.name}-${o.generation}`
                        }
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white cursor-pointer"
                        title="Delete object"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ================================================================ */}
        {/* RIGHT PANEL: MULTI-FORMAT PREVIEW, PRO CODE EDITOR & DIFF STUDIO */}
        {/* ================================================================ */}
        <div
          className={`${rightColSpanClass} p-4 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 space-y-3`}
        >
          {loadingInspect ? (
            <div className="p-12 text-center text-xs text-zinc-500 animate-pulse">
              Streaming object payload & magic signature from Google Cloud Storage...
            </div>
          ) : !inspectedObject ? (
            <div className="p-10 text-center space-y-3">
              <Eye className="w-8 h-8 text-blue-500 mx-auto" />
              <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Select any Object in gs://{selectedBucket?.name} to Inspect, Preview & Edit
              </div>
              <p className="text-xs text-zinc-500 max-w-lg mx-auto">
                Supports interactive **CSV / TSV / JSONL Data Grids**, **JSON Schema & Path Trees**, **Live Markdown / SVG Rendering**, **Zoomable Image Canvas**, **Jupyter Notebook Viewer**, **Parquet / Binary Hex X-Ray**, and **Side-by-Side Diffs**.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowComposerBar(true)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer"
                >
                  + Create New Object from Template
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Studio Object Header Bar */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-zinc-900 dark:text-white break-all">
                      gs://{inspectedObject.bucketName}/{inspectedObject.objectName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 font-bold">
                      {activeFormat}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      Gen #{String(inspectedObject.metadata?.generation || '').slice(-6)}
                    </span>
                    {previewAnalysis.hasUnsavedChanges && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-extrabold border border-amber-500/40">
                        UNSAVED EDITS
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {inspectedObject.metadata?.contentType} ·{' '}
                    {formatBytes(inspectedObject.metadata?.size)} · Class:{' '}
                    <strong className="text-blue-500">
                      {inspectedObject.metadata?.storageClass}
                    </strong>{' '}
                    · MD5: {inspectedObject.metadata?.md5Hash || 'n/a'}
                  </div>
                </div>

                {/* Top Right Object Actions: Equal-Width Action Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadObject(inspectedObject.objectName)
                    }
                    className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-950 hover:border-blue-500/60 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold cursor-pointer inline-flex items-center justify-center gap-1"
                    title="Download full object to laptop"
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowRenameBar((v) => !v)}
                    className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-950 hover:border-blue-500/60 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold cursor-pointer inline-flex items-center justify-center gap-1"
                    title="Rename, move, duplicate, or copy across buckets"
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0" />
                    <span>Move / Copy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLayoutRatio((r) =>
                        r === 'FULL_STUDIO' ? 'COMPACT_LEFT' : 'FULL_STUDIO'
                      )
                    }
                    className="h-8 px-2.5 rounded-lg bg-white dark:bg-zinc-950 hover:border-blue-500/60 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold cursor-pointer inline-flex items-center justify-center gap-1"
                    title="Toggle Full-Width Editor Workspace"
                  >
                    {layoutRatio === 'FULL_STUDIO' ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Show Tree</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Expand</span>
                      </>
                    )}
                  </button>

                  {inspectedObject.isTextLike && (
                    <button
                      type="button"
                      onClick={handleSaveEditedObject}
                      disabled={
                        busyKey === `save-obj-${inspectedObject.objectName}`
                      }
                      className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Save className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {busyKey === `save-obj-${inspectedObject.objectName}`
                          ? 'Saving...'
                          : 'Save Gen'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Feature 5: Real-Time Client-Side Secret & PII Pre-Save Guardrail Banner */}
              {inspectedObject.isTextLike && secretFindings.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex flex-wrap items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-start gap-2.5 flex-1 min-w-[240px]">
                    <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-amber-700 dark:text-amber-300">
                        Pre-Save &amp; Pre-Public DLP Guardrail: {secretFindings.length} Credential / PII Pattern(s) Detected in Buffer!
                      </div>
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-300 flex flex-wrap gap-1.5">
                        {secretFindings.map((f) => (
                          <span
                            key={f.id}
                            className="px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-900 border border-amber-500/30 text-[10px] font-mono font-bold"
                          >
                            [{f.severity}] {f.label} ({f.count}x)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoRedactSecrets}
                    className="h-8 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>1-Tap Auto-Redact Secrets</span>
                  </button>
                </div>
              )}

              {/* Feature 3: Upgraded In-Place Rename, Move, Duplicate & Cross-Bucket Server-Side Copy Bar */}
              {showRenameBar && (
                <form
                  onSubmit={handleRenameOrCopyObject}
                  className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">
                      Server-Side Object Move, Rename, Duplicate &amp; Cross-Bucket Copy (Zero Egress)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRenameBar(false)}
                      className="text-[10px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-bold cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                        Destination Bucket
                      </label>
                      <select
                        value={renameTargetBucket || selectedBucket?.name || ''}
                        onChange={(e) => setRenameTargetBucket(e.target.value)}
                        className="w-full h-8 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2 text-xs font-bold"
                      >
                        {(buckets.length > 0 ? buckets : [selectedBucket].filter(Boolean)).map(
                          (b) => (
                            <option key={b.name} value={b.name}>
                              gs://{b.name} ({b.location})
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                        Destination Object Key / Path
                      </label>
                      <input
                        type="text"
                        value={renameTargetPath}
                        onChange={(e) => setRenameTargetPath(e.target.value)}
                        className="w-full h-8 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-bold"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <label className="flex items-center gap-1.5 text-[11px] cursor-pointer h-8 px-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex-1">
                        <input
                          type="checkbox"
                          checked={renameDeleteSource}
                          onChange={(e) => setRenameDeleteSource(e.target.checked)}
                        />
                        <span className="truncate">
                          {renameDeleteSource ? 'Move (Delete Source)' : 'Copy (Keep Source)'}
                        </span>
                      </label>
                      <button
                        type="submit"
                        disabled={busyKey === `rename-${inspectedObject.objectName}`}
                        className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer shrink-0"
                      >
                        {renameDeleteSource ? 'Move / Rename' : 'Copy Object'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Google Cloud Console Public Access & HTTPS URI Generator Bar */}
              {(() => {
                const encObj = String(inspectedObject.objectName || '')
                  .split('/')
                  .map((s) => encodeURIComponent(s))
                  .join('/');
                const publicUrl =
                  inspectedObject.publicHttpsUrl ||
                  `https://storage.googleapis.com/${encodeURIComponent(
                    inspectedObject.bucketName
                  )}/${encObj}`;
                const authConsoleUrl =
                  inspectedObject.authenticatedHttpsUrl ||
                  `https://storage.cloud.google.com/${encodeURIComponent(
                    inspectedObject.bucketName
                  )}/${encObj}`;
                const gsUri =
                  inspectedObject.gsUri ||
                  `gs://${inspectedObject.bucketName}/${inspectedObject.objectName}`;
                const isPub = Boolean(inspectedObject.isPublic);

                const scopeDetails =
                  publicScopeMode === 'OBJECT_ACL'
                    ? {
                        badge: 'LEAST-PRIVILEGE · SINGLE OBJECT ONLY (ACL)',
                        badgeClass:
                          'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40',
                        boxClass:
                          'bg-emerald-500/[0.06] border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
                        btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                        btnLabel: 'Expose Single Object Only (Object ACL)',
                        summary: `Grants Fine-Grained ACL (entity: allUsers, role: READER) ONLY on ${inspectedObject.objectName}. Other objects in gs://${inspectedObject.bucketName} stay private.`,
                        cli: `gcloud storage objects update ${gsUri} --add-acl-grant=entity=allUsers,role=READER`,
                      }
                    : publicScopeMode === 'BUCKET_IAM'
                    ? {
                        badge: 'BUCKET-WIDE PUBLIC READ · UNIFORM IAM',
                        badgeClass:
                          'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40',
                        boxClass:
                          'bg-amber-500/[0.07] border-amber-500/35 text-amber-800 dark:text-amber-200',
                        btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
                        btnLabel: 'Expose Bucket via Uniform IAM (allUsers)',
                        summary: `Keeps Uniform Bucket-Level Access (UBLA) enabled and binds allUsers -> roles/storage.objectViewer on gs://${inspectedObject.bucketName} (makes all objects in this bucket publicly readable).`,
                        cli: `gcloud storage buckets add-iam-policy-binding gs://${inspectedObject.bucketName} --member=allUsers --role=roles/storage.objectViewer`,
                      }
                    : {
                        badge: 'SMART AUTO-NEGOTIATION (ACL -> IAM)',
                        badgeClass:
                          'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/40',
                        boxClass:
                          'bg-blue-500/[0.06] border-blue-500/30 text-blue-800 dark:text-blue-200',
                        btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
                        btnLabel: 'Convert to Public & Enable HTTPS URI (Auto)',
                        summary: `Automatically relaxes Public Access Prevention to 'inherited' and applies per-object ACL if allowed, or falls back to Uniform Bucket IAM on gs://${inspectedObject.bucketName}.`,
                        cli: `gcloud storage objects update ${gsUri} --add-acl-grant=entity=allUsers,role=READER`,
                      };

                return (
                  <div
                    className={`p-3 rounded-xl border space-y-2.5 text-xs transition-all ${
                      isPub
                        ? 'bg-emerald-500/[0.07] border-emerald-500/40'
                        : 'bg-zinc-50/90 dark:bg-zinc-900/75 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isPub ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 text-[10px] font-extrabold inline-flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span>
                              PUBLIC ON INTERNET (
                              {inspectedObject.publicAccessScope || 'allUsers'})
                            </span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-extrabold inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>PRIVATE (Zero-Trust Protected)</span>
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${scopeDetails.badgeClass}`}
                        >
                          {scopeDetails.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          value={publicScopeMode}
                          onChange={(e) => {
                            const nextMode = e.target.value;
                            setPublicScopeMode(nextMode);
                          }}
                          className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] font-bold cursor-pointer"
                          title="Choose how public access is granted in GCS"
                        >
                          <option value="AUTO">
                            Mode: Auto (Object ACL or Bucket IAM)
                          </option>
                          <option value="OBJECT_ACL">
                            Mode: Single Object Only (Fine-Grained ACL)
                          </option>
                          <option value="BUCKET_IAM">
                            Mode: Uniform Bucket IAM (allUsers ObjectViewer)
                          </option>
                        </select>

                        {isPub ? (
                          <button
                            type="button"
                            disabled={
                              busyKey === `pub-${inspectedObject.objectName}`
                            }
                            onClick={() => handleTogglePublicAccess(false)}
                            className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Lock className="w-3 h-3" />
                            <span>
                              {busyKey === `pub-${inspectedObject.objectName}`
                                ? 'Revoking...'
                                : 'Make Private (Revoke Public URI)'}
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              busyKey === `pub-${inspectedObject.objectName}`
                            }
                            onClick={() => handleTogglePublicAccess(true)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-colors ${scopeDetails.btnClass}`}
                          >
                            <Unlock className="w-3 h-3" />
                            <span>
                              {busyKey === `pub-${inspectedObject.objectName}`
                                ? 'Converting to Public...'
                                : scopeDetails.btnLabel}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Visual Policy Blast-Radius & CLI Preview Box that updates dynamically when Mode Select changes */}
                    <div
                      className={`p-2.5 rounded-lg border text-[11px] flex flex-wrap items-center justify-between gap-2 transition-all ${scopeDetails.boxClass}`}
                    >
                      <div className="space-y-0.5 flex-1 min-w-[240px]">
                        <div className="font-bold">{scopeDetails.summary}</div>
                        <div className="text-[10px] opacity-80 font-mono truncate">
                          Equivalent CLI: <code>{scopeDetails.cli}</code>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(scopeDetails.cli, 'pub-mode-cli')
                        }
                        className="px-2 py-1 rounded bg-white/80 dark:bg-zinc-950/80 border border-zinc-300 dark:border-zinc-800 text-[10px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer shrink-0 inline-flex items-center gap-1"
                      >
                        {copiedKey === 'pub-mode-cli' ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>
                          {copiedKey === 'pub-mode-cli'
                            ? 'Copied CLI'
                            : 'Copy Mode CLI'}
                        </span>
                      </button>
                    </div>

                    {/* Official GCS URIs: Only show Public HTTPS URL when the object is actually Public (isPub === true) */}
                    <div
                      className={`grid grid-cols-1 ${
                        isPub ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
                      } gap-2 text-[11px]`}
                    >
                      {/* 1. Public HTTPS URI — ONLY rendered when the object is Public */}
                      {isPub && (
                        <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-emerald-500/40 flex items-center justify-between gap-1.5">
                          <div className="min-w-0">
                            <div className="text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                              Public HTTPS URL (storage.googleapis.com)
                            </div>
                            <code
                              className="text-zinc-800 dark:text-zinc-200 truncate block"
                              title={publicUrl}
                            >
                              {publicUrl}
                            </code>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(publicUrl, 'pub-https-uri')
                              }
                              className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:text-blue-500 cursor-pointer"
                              title="Copy Public HTTPS URL"
                            >
                              {copiedKey === 'pub-https-uri' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <a
                              href={publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:text-emerald-500"
                              title="Open Public HTTPS URL in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      )}

                      {/* 2. Authenticated Console HTTPS URI (Always works via Google Cloud session) */}
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="text-[9px] uppercase font-bold text-blue-500">
                            Authenticated URL (storage.cloud.google.com)
                          </div>
                          <code
                            className="text-zinc-800 dark:text-zinc-200 truncate block"
                            title={authConsoleUrl}
                          >
                            {authConsoleUrl}
                          </code>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(authConsoleUrl, 'auth-https-uri')
                            }
                            className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:text-blue-500 cursor-pointer"
                            title="Copy Authenticated Browser URL"
                          >
                            {copiedKey === 'auth-https-uri' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={authConsoleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:text-blue-500"
                            title="Open Authenticated Console URL in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      {/* 3. Native gs:// URI */}
                      <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-1.5">
                        <div className="min-w-0">
                          <div className="text-[9px] uppercase font-bold text-zinc-400">
                            Cloud Storage URI (gs://)
                          </div>
                          <code
                            className="text-zinc-800 dark:text-zinc-200 truncate block"
                            title={gsUri}
                          >
                            {gsUri}
                          </code>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyText(gsUri, 'gs-uri')}
                            className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-900 hover:text-blue-500 cursor-pointer"
                            title="Copy gs:// URI"
                          >
                            {copiedKey === 'gs-uri' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Studio Mode Switcher Tabs (Equal-Width 6-Column Grid) */}
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2 text-[11px]">
                  {inspectedObject.isTextLike && (
                    <button
                      type="button"
                      onClick={() => setStudioMode('SPLIT')}
                      className={`w-full h-9 px-2.5 rounded-lg font-bold border cursor-pointer inline-flex items-center justify-center gap-1.5 truncate transition-colors ${
                        studioMode === 'SPLIT'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                      }`}
                    >
                      <Columns className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Split View</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setStudioMode('PREVIEW')}
                    className={`w-full h-9 px-2.5 rounded-lg font-bold border cursor-pointer inline-flex items-center justify-center gap-1.5 truncate transition-colors ${
                      studioMode === 'PREVIEW'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                    }`}
                  >
                    <Table className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Preview ({activeFormat})</span>
                  </button>

                  {inspectedObject.isTextLike && (
                    <>
                      <button
                        type="button"
                        onClick={() => setStudioMode('EDITOR')}
                        className={`w-full h-9 px-2.5 rounded-lg font-bold border cursor-pointer inline-flex items-center justify-center gap-1.5 truncate transition-colors ${
                          studioMode === 'EDITOR'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                        }`}
                      >
                        <Code className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Code Editor</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStudioMode('DIFF')}
                        className={`w-full h-9 px-2.5 rounded-lg font-bold border cursor-pointer inline-flex items-center justify-center gap-1.5 truncate transition-colors ${
                          studioMode === 'DIFF'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                        }`}
                      >
                        <GitCompare className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          Diff Changes
                          {previewAnalysis.hasUnsavedChanges ? ' ●' : ''}
                        </span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => setStudioMode('VERSIONS')}
                    className={`w-full h-9 px-2.5 rounded-lg font-bold border cursor-pointer inline-flex items-center justify-center gap-1.5 truncate transition-colors ${
                      studioMode === 'VERSIONS'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Versions &amp; Restore</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioMode('METADATA')}
                    className={`w-full h-9 px-2.5 rounded-lg font-bold border cursor-pointer inline-flex items-center justify-center gap-1.5 truncate transition-colors ${
                      studioMode === 'METADATA'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                    }`}
                  >
                    <Key className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Signed URLs &amp; Holds</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: SPLIT VIEW (LEFT CODE EDITOR + RIGHT SMART PREVIEW) */}
              {studioMode === 'SPLIT' && inspectedObject.isTextLike && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                  <div>{renderCodeEditorPanel()}</div>
                  <div>{renderSmartPreviewPanel()}</div>
                </div>
              )}

              {/* MODE 2: SMART PREVIEW ONLY */}
              {studioMode === 'PREVIEW' && renderSmartPreviewPanel()}

              {/* MODE 3: FULL-WIDTH CODE EDITOR ONLY */}
              {studioMode === 'EDITOR' &&
                inspectedObject.isTextLike &&
                renderCodeEditorPanel()}

              {/* MODE 4: UNSAVED DIFF VIEW */}
              {studioMode === 'DIFF' && inspectedObject.isTextLike && (
                <div className="space-y-3">
                  {(() => {
                    const diff = computeLineDiff(
                      inspectedObject.textPreview || '',
                      editedTextContent || ''
                    );
                    return (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                              Live Generation vs Unsaved Editor Buffer
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                              +{diff.added} added
                            </span>
                            <span className="px-2 py-0.5 rounded bg-red-500/15 text-red-500 font-bold">
                              -{diff.removed} removed
                            </span>
                          </div>
                          {previewAnalysis.hasUnsavedChanges && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditedTextContent(
                                  inspectedObject.textPreview || ''
                                )
                              }
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-500 font-bold text-[11px] cursor-pointer"
                            >
                              Revert to Saved Generation
                            </button>
                          )}
                        </div>

                        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-auto max-h-[430px] font-mono text-xs divide-y divide-zinc-200/40 dark:divide-zinc-800/40">
                          {diff.rows.map((r, idx) => (
                            <div
                              key={idx}
                              className={`px-3 py-1 flex items-start gap-3 whitespace-pre-wrap ${
                                r.type === 'add'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : r.type === 'del'
                                  ? 'bg-red-500/15 text-red-600 dark:text-red-300 line-through opacity-80'
                                  : 'text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              <span className="w-8 text-[10px] text-zinc-400 select-none shrink-0">
                                {r.lineOld ?? ''}
                              </span>
                              <span className="w-8 text-[10px] text-zinc-400 select-none shrink-0">
                                {r.lineNew ?? ''}
                              </span>
                              <span className="w-4 font-extrabold select-none shrink-0">
                                {r.type === 'add'
                                  ? '+'
                                  : r.type === 'del'
                                  ? '-'
                                  : ' '}
                              </span>
                              <span className="flex-1 break-all">{r.text}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* MODE 4B: OBJECT VERSIONING & SOFT-DELETE TIME-MACHINE */}
              {studioMode === 'VERSIONS' && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>
                          Object Generation Time-Machine — gs://{inspectedObject.bucketName}/{inspectedObject.objectName}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Inspect every historical <code className="font-mono">#generation</code> stored by Google Cloud Storage Versioning, diff noncurrent generations against the live object, or restore any generation in 1 click.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchObjectVersions(inspectedObject.objectName)}
                      disabled={loadingVersions}
                      className="h-8 px-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingVersions ? 'animate-spin' : ''}`} />
                      <span>Refresh Generations ({objectVersions.length})</span>
                    </button>
                  </div>

                  {loadingVersions ? (
                    <div className="p-6 text-center text-xs text-zinc-500 animate-pulse">
                      Listing object generations from storage.googleapis.com...
                    </div>
                  ) : objectVersions.length === 0 ? (
                    <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-zinc-500">
                      No generation records returned. Ensure Object Versioning is enabled on gs://{inspectedObject.bucketName}.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                      {objectVersions.map((ver) => (
                        <div
                          key={ver.generation}
                          className="p-3 bg-white dark:bg-zinc-950 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                                Generation #{ver.generation}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  ver.isLive
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                                }`}
                              >
                                {ver.isLive ? 'LIVE CURRENT VERSION' : 'NONCURRENT / ARCHIVED'}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {formatBytes(ver.size)} · {ver.storageClass}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Updated: {ver.updated ? new Date(ver.updated).toLocaleString() : 'n/a'} · MD5: {ver.md5Hash || 'n/a'} · CRC32C: {ver.crc32c || 'n/a'}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 shrink-0 sm:w-64">
                            <button
                              type="button"
                              disabled={loadingCompareGen}
                              onClick={() => handleCompareGeneration(ver)}
                              className="w-full h-8 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 hover:border-blue-500/60 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1"
                            >
                              <GitCompare className="w-3 h-3 shrink-0" />
                              <span>Diff vs Live</span>
                            </button>

                            <button
                              type="button"
                              disabled={
                                ver.isLive ||
                                busyKey === `restore-gen-${ver.generation}`
                              }
                              onClick={() => handleRestoreGeneration(ver)}
                              className="w-full h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 disabled:opacity-40"
                            >
                              <RotateCcw className="w-3 h-3 shrink-0" />
                              <span>
                                {busyKey === `restore-gen-${ver.generation}`
                                  ? 'Restoring...'
                                  : ver.isLive
                                  ? 'Active Live'
                                  : '1-Tap Restore'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {comparedGenerationData && (
                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                          Diff: Historical Generation #{comparedGenerationData.generation} vs Current Live Buffer
                        </span>
                        <button
                          type="button"
                          onClick={() => setComparedGenerationData(null)}
                          className="text-[10px] text-zinc-500 font-bold cursor-pointer"
                        >
                          Close Diff
                        </button>
                      </div>
                      {(() => {
                        const genDiff = computeLineDiff(
                          comparedGenerationData.textPreview || '',
                          editedTextContent || ''
                        );
                        return (
                          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-auto max-h-72 bg-white dark:bg-zinc-950 font-mono text-xs divide-y divide-zinc-200/40 dark:divide-zinc-800/40">
                            {genDiff.rows.map((r, idx) => (
                              <div
                                key={idx}
                                className={`px-3 py-1 flex items-start gap-3 whitespace-pre-wrap ${
                                  r.type === 'add'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                    : r.type === 'del'
                                    ? 'bg-red-500/15 text-red-600 dark:text-red-300 line-through opacity-80'
                                    : 'text-zinc-600 dark:text-zinc-400'
                                }`}
                              >
                                <span className="w-8 text-[10px] text-zinc-400 select-none shrink-0">
                                  {r.lineOld ?? ''}
                                </span>
                                <span className="w-8 text-[10px] text-zinc-400 select-none shrink-0">
                                  {r.lineNew ?? ''}
                                </span>
                                <span className="w-4 font-extrabold select-none shrink-0">
                                  {r.type === 'add' ? '+' : r.type === 'del' ? '-' : ' '}
                                </span>
                                <span className="flex-1 break-all">{r.text}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 5: SIGNED URLS, RETENTION HOLDS, METADATA & CLI */}
              {studioMode === 'METADATA' && (
                <div className="space-y-4">
                  {/* Feature 1: Time-Limited V4 Signed URL & Temporary Share Link Generator */}
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span>
                            Time-Limited V4 Signed URL &amp; Temporary Share Link Generator
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Share private objects for a fixed duration (15m to 7d) with cryptographic HMAC-SHA256 / V4 expiration — without making the bucket or object public.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={loadingSignedUrl}
                        onClick={() =>
                          handleGenerateSignedUrl(signedUrlTtl, signedUrlMethod)
                        }
                        className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>
                          {loadingSignedUrl
                            ? 'Signing...'
                            : 'Generate Signed Share Link'}
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {[
                        { label: '15 Min', ttl: 900 },
                        { label: '1 Hour', ttl: 3600 },
                        { label: '24 Hours', ttl: 86400 },
                        { label: '7 Days', ttl: 604800 },
                      ].map((opt) => (
                        <button
                          key={opt.ttl}
                          type="button"
                          onClick={() => {
                            setSignedUrlTtl(opt.ttl);
                            handleGenerateSignedUrl(opt.ttl, signedUrlMethod);
                          }}
                          className={`w-full h-8 rounded-lg font-bold border text-[11px] cursor-pointer ${
                            signedUrlTtl === opt.ttl
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          TTL: {opt.label}
                        </button>
                      ))}
                      {['GET', 'PUT'].map((verb) => (
                        <button
                          key={verb}
                          type="button"
                          onClick={() => {
                            setSignedUrlMethod(verb);
                            handleGenerateSignedUrl(signedUrlTtl, verb);
                          }}
                          className={`w-full h-8 rounded-lg font-bold border text-[11px] cursor-pointer ${
                            signedUrlMethod === verb
                              ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                              : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          HTTP {verb}
                        </button>
                      ))}
                    </div>

                    {signedUrlData && (
                      <div className="space-y-2 pt-1">
                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              Live Temporary Share Link ({signedUrlData.durationLabel} · {signedUrlData.httpMethod} · Expires {new Date(signedUrlData.expiresAtIso).toLocaleString()})
                            </div>
                            <code className="text-[11px] text-zinc-800 dark:text-zinc-200 truncate block">
                              {signedUrlData.temporaryShareUrl}
                            </code>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyText(
                                  signedUrlData.temporaryShareUrl,
                                  'signed-temp-url'
                                )
                              }
                              className="h-7 px-2 rounded bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                            >
                              {copiedKey === 'signed-temp-url' ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              <span>Copy Link</span>
                            </button>
                            <a
                              href={signedUrlData.temporaryShareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-7 px-2 rounded bg-blue-600 text-white text-[10px] font-bold inline-flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Open</span>
                            </a>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-zinc-500">
                              V4 Canonical Request URI (X-Goog-Algorithm=GOOG4-RSA-SHA256)
                            </div>
                            <code className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate block">
                              {signedUrlData.canonicalV4PreviewUrl}
                            </code>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyText(
                                signedUrlData.canonicalV4PreviewUrl,
                                'signed-v4-url'
                              )
                            }
                            className="h-7 px-2 rounded bg-zinc-100 dark:bg-zinc-900 text-[10px] font-bold cursor-pointer shrink-0 inline-flex items-center gap-1"
                          >
                            {copiedKey === 'signed-v4-url' ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>Copy V4</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feature 4: Object-Level Retention Holds (Temporary Hold & Event-Based Hold) + 4-Tier Storage Class */}
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs">
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100 uppercase text-[11px]">
                      Object-Level Retention Holds (SEC 17a-4 / Legal Hold) &amp; Storage Class Tiering
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            Temporary Hold (temporaryHold)
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Blocks object deletion or lifecycle purge while investigation is active
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={
                            busyKey ===
                            `hold-temporaryHold-${inspectedObject.objectName}`
                          }
                          onClick={() =>
                            handleToggleObjectHold(
                              'temporaryHold',
                              !inspectedObject.metadata?.temporaryHold
                            )
                          }
                          className={`h-8 px-3 rounded-lg font-bold text-[11px] cursor-pointer shrink-0 ${
                            inspectedObject.metadata?.temporaryHold
                              ? 'bg-amber-600 text-white'
                              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          {inspectedObject.metadata?.temporaryHold
                            ? 'HOLD ACTIVE (Release)'
                            : 'Enable Temp Hold'}
                        </button>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            Event-Based Hold (eventBasedHold)
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Resets retention clock until event hold is explicitly released
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={
                            busyKey ===
                            `hold-eventBasedHold-${inspectedObject.objectName}`
                          }
                          onClick={() =>
                            handleToggleObjectHold(
                              'eventBasedHold',
                              !inspectedObject.metadata?.eventBasedHold
                            )
                          }
                          className={`h-8 px-3 rounded-lg font-bold text-[11px] cursor-pointer shrink-0 ${
                            inspectedObject.metadata?.eventBasedHold
                              ? 'bg-amber-600 text-white'
                              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800'
                          }`}
                        >
                          {inspectedObject.metadata?.eventBasedHold
                            ? 'HOLD ACTIVE (Release)'
                            : 'Enable Event Hold'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE'].map(
                        (sc) => {
                          const isCurrent =
                            (inspectedObject.metadata?.storageClass ||
                              'STANDARD') === sc;
                          return (
                            <button
                              key={sc}
                              type="button"
                              onClick={() =>
                                handleRewriteObjectClass(
                                  { name: inspectedObject.objectName },
                                  sc
                                )
                              }
                              className={`w-full h-8 rounded-lg font-bold border text-[11px] cursor-pointer ${
                                isCurrent
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50'
                              }`}
                            >
                              Tier: {sc}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                  <form
                    onSubmit={handleSaveObjectMetadata}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-blue-500 uppercase">
                        Editable HTTP Headers & Custom Metadata (x-goog-meta-*)
                      </span>
                      <button
                        type="submit"
                        disabled={busyKey === `meta-${inspectedObject.objectName}`}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] cursor-pointer"
                      >
                        {busyKey === `meta-${inspectedObject.objectName}`
                          ? 'Patching...'
                          : 'Save Metadata & Headers'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                          Content-Type
                        </label>
                        <input
                          type="text"
                          value={metaContentType}
                          onChange={(e) => setMetaContentType(e.target.value)}
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                          Cache-Control Header
                        </label>
                        <input
                          type="text"
                          value={metaCacheControl}
                          onChange={(e) => setMetaCacheControl(e.target.value)}
                          placeholder="public, max-age=3600"
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-zinc-500 font-bold block mb-1">
                          Object Storage Class
                        </label>
                        <select
                          value={
                            inspectedObject.metadata?.storageClass || 'STANDARD'
                          }
                          onChange={(e) =>
                            handleRewriteObjectClass(
                              { name: inspectedObject.objectName },
                              e.target.value
                            )
                          }
                          className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 font-bold text-blue-500"
                        >
                          {['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE'].map(
                            (sc) => (
                              <option key={sc} value={sc}>
                                {sc}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Custom key-value metadata editor */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 font-bold">
                          Custom Object Metadata Key-Value Pairs:
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setMetaCustomPairs((prev) => [
                              ...prev,
                              { key: '', value: '' },
                            ])
                          }
                          className="text-[10px] text-blue-500 font-bold cursor-pointer"
                        >
                          + Add Metadata Key
                        </button>
                      </div>
                      {metaCustomPairs.map((pair, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="key (e.g. owner)"
                            value={pair.key}
                            onChange={(e) =>
                              setMetaCustomPairs((prev) =>
                                prev.map((it, i) =>
                                  i === idx ? { ...it, key: e.target.value } : it
                                )
                              )
                            }
                            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs flex-1"
                          />
                          <input
                            type="text"
                            placeholder="value"
                            value={pair.value}
                            onChange={(e) =>
                              setMetaCustomPairs((prev) =>
                                prev.map((it, i) =>
                                  i === idx
                                    ? { ...it, value: e.target.value }
                                    : it
                                )
                              )
                            }
                            className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg px-2.5 py-1 text-xs flex-1"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setMetaCustomPairs((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            className="text-red-500 text-xs font-bold px-2 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </form>

                  {/* Copy-Ready gcloud storage CLI Commands */}
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-[11px]">
                    <div className="text-zinc-500 font-extrabold uppercase text-[10px]">
                      Zero-Trust Signed URL & gcloud storage CLI Snippets
                    </div>
                    {[
                      {
                        id: 'cat',
                        cmd: `gcloud storage cat gs://${inspectedObject.bucketName}/${inspectedObject.objectName}`,
                      },
                      {
                        id: 'cp',
                        cmd: `gcloud storage cp gs://${inspectedObject.bucketName}/${inspectedObject.objectName} ./`,
                      },
                      {
                        id: 'sign',
                        cmd: `gcloud storage sign-url gs://${inspectedObject.bucketName}/${inspectedObject.objectName} --duration=1h`,
                      },
                    ].map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-950 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800"
                      >
                        <code className="text-blue-600 dark:text-blue-300 truncate">
                          {item.cmd}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyText(item.cmd, item.id)}
                          className="text-zinc-400 hover:text-blue-500 shrink-0 cursor-pointer"
                        >
                          {copiedKey === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
