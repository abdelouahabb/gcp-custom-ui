import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import axios from 'axios';
import {
  Radio,
  FileText,
  Database,
  Network,
  Table2,
  Server,
  Cpu,
  Container,
  Play,
  Square,
  RotateCcw,
  Download,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Terminal,
  Wrench,
  Trash2,
  Send,
  Inbox,
  PlusCircle,
  Cloud,
  DollarSign,
  ArrowRight,
  Layers,
  Loader2,
  GitCompareArrows,
  FileCode2,
  Wifi,
} from 'lucide-react';

/* ============================================================================
 * Static UI metadata only (labels / icons / ordering).
 * Ports, PIDs, status, assets, logs and every number come from live backend calls.
 * ============================================================================ */

const EMULATOR_ORDER = ['PUBSUB', 'FIRESTORE', 'DATASTORE', 'SPANNER', 'BIGTABLE'];
const WORKBENCH_ORDER = ['PUBSUB', 'DATASTORE', 'FIRESTORE', 'SPANNER', 'BIGTABLE'];

const EMULATOR_META = {
  PUBSUB: { short: 'Pub/Sub', icon: Radio },
  FIRESTORE: { short: 'Firestore', icon: FileText },
  DATASTORE: { short: 'Datastore', icon: Database },
  SPANNER: { short: 'Spanner', icon: Network },
  BIGTABLE: { short: 'Bigtable', icon: Table2 },
};

const SUB_TABS = [
  {
    id: 'FLEET_CONTROL',
    label: 'Emulator Fleet & Host Readiness',
    shortDesc:
      'Start, stop, reset and probe the 5 official Google Cloud local emulators',
    icon: Server,
  },
  {
    id: 'LIVE_WORKBENCH',
    label: 'Interactive Local REST Workbench',
    shortDesc:
      'Publish, query, upsert and run SQL against your running local emulators',
    icon: Wrench,
  },
  {
    id: 'CLOUD_SCHEMA_SYNC',
    label: 'Cloud-to-Local $0.00 Twin Sync',
    shortDesc:
      'Mirror live Cloud schema into local emulators and compare FinOps burn',
    icon: GitCompareArrows,
  },
  {
    id: 'ENV_AND_LOGS',
    label: '*_EMULATOR_HOST Exporter & Live Process Logs',
    shortDesc:
      'Copy emulator environment bundles and tail live emulator stdout/stderr',
    icon: Terminal,
  },
];

const ENV_FORMATS = [
  { id: 'bash', label: 'Bash export' },
  { id: 'dotenv', label: '.env File' },
  { id: 'dockerCompose', label: 'docker-compose.yml' },
  { id: 'sdk', label: 'Node.js / Python / Go SDK' },
];

const RUNTIME_MODES = [
  { id: 'GCLOUD_CLI', label: 'GCLOUD_CLI (gcloud beta emulators)' },
  { id: 'DOCKER', label: 'DOCKER (container image)' },
];

const INPUT_CLS =
  'w-full px-2 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-amber-500';

const LABEL_CLS =
  'block text-[10px] font-mono font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1';

const TAB_ACTIVE =
  'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300';
const TAB_INACTIVE =
  'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-amber-500/45 hover:text-zinc-900 dark:hover:text-zinc-100';

/* ----------------------------------------------------------------------------
 * Small helpers
 * ---------------------------------------------------------------------------- */

function isCancelled(err) {
  return Boolean(err?.__cancelledByUser || err?.response?.status === 499);
}

function errorText(err, fallback) {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}

function fmtNum(v, suffix = '') {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'n/a';
  return `${v}${suffix}`;
}

function fmtUptime(sec) {
  if (sec === null || sec === undefined) return 'n/a';
  const s = Number(sec);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

function fmtUsd(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return 'n/a';
  return `$${Number(v).toFixed(2)}`;
}

function Chip({ children, className = '' }) {
  return (
    <code
      className={`px-1.5 py-0.5 rounded bg-zinc-200/80 dark:bg-zinc-800 font-mono text-[11px] text-zinc-800 dark:text-zinc-200 ${className}`}
    >
      {children}
    </code>
  );
}

function StatusPill({ tone, children }) {
  const tones = {
    emerald:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    zinc: 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700',
    amber:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40',
    rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40',
    blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${
        tones[tone] || tones.zinc
      }`}
    >
      {children}
    </span>
  );
}

function Btn({
  variant = 'secondary',
  icon: Icon,
  children,
  disabled = false,
  busy = false,
  onClick,
  featureId,
  ariaLabel,
  title,
  className = '',
}) {
  const base =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition';
  const isOff = disabled || busy;
  let tone;
  if (isOff) {
    tone =
      'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-600 border-zinc-200 dark:border-zinc-800 cursor-not-allowed';
  } else if (variant === 'primary') {
    tone =
      'bg-blue-600 hover:bg-blue-500 text-white border-blue-700 cursor-pointer';
  } else if (variant === 'danger') {
    tone =
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40 cursor-pointer';
  } else {
    tone =
      'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700 cursor-pointer';
  }
  return (
    <button
      type="button"
      onClick={isOff ? undefined : onClick}
      disabled={isOff}
      aria-label={ariaLabel}
      title={title}
      data-feature-id={featureId}
      className={`${base} ${tone} ${className}`}
    >
      {busy ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}

function Panel({ title, icon: Icon, right, children, className = '' }) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 space-y-3 ${className}`}
    >
      {(title || right) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
            {Icon && <Icon className="w-4 h-4 text-amber-500" />}
            <span>{title}</span>
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

function JsonBlock({ value }) {
  return (
    <pre className="max-h-64 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">
      {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
    </pre>
  );
}

function parseJsonObject(text, label = 'Fields') {
  const trimmed = String(text || '').trim();
  if (!trimmed) throw new Error(`${label} JSON is required.`);
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (e) {
    throw new Error(`${label} must be valid JSON: ${e.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object of key-value fields.`);
  }
  return parsed;
}

function parseAttributes(text) {
  const out = {};
  String(text || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line) => {
      const idx = line.indexOf('=');
      if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    });
  return out;
}

/* ============================================================================
 * Workbench panels (each calls run(action, extra) -> data | null)
 * ============================================================================ */

function PubSubPanel({ run, busy, running, toast }) {
  const [topics, setTopics] = useState([]);
  const [subs, setSubs] = useState([]);
  const [topicName, setTopicName] = useState('');
  const [subName, setSubName] = useState('');
  const [pubTopic, setPubTopic] = useState('');
  const [payload, setPayload] = useState('');
  const [attrsText, setAttrsText] = useState('');
  const [pullSub, setPullSub] = useState('');
  const [autoAck, setAutoAck] = useState(true);
  const [pulled, setPulled] = useState(null);

  const refresh = useCallback(async () => {
    const data = await run('LIST_TOPICS');
    if (data) {
      setTopics(data.topics || []);
      setSubs(data.subscriptions || []);
    }
  }, [run]);

  useEffect(() => {
    if (running) refresh();
  }, [running, refresh]);

  useEffect(() => {
    if (!pubTopic && topics[0]) setPubTopic(topics[0].shortName);
    if (!pullSub && subs[0]) setPullSub(subs[0].shortName);
  }, [topics, subs, pubTopic, pullSub]);

  const handleCreate = async () => {
    if (!topicName.trim()) return toast('Enter a topic name first.');
    const data = await run('CREATE_TOPIC', {
      topicName: topicName.trim(),
      subName: subName.trim() || undefined,
    });
    if (data) {
      toast(
        `Topic ${data.topic?.shortName}${
          data.subscription ? ` and subscription ${data.subscription.shortName}` : ''
        } ready on the local Pub/Sub emulator.`
      );
      setTopicName('');
      setSubName('');
      await refresh();
    }
  };

  const handlePublish = async () => {
    if (!pubTopic) return toast('Select a topic to publish to.');
    const data = await run('PUBLISH_MESSAGE', {
      topicName: pubTopic,
      payload,
      attributes: parseAttributes(attrsText),
    });
    if (data) toast(`Published message ${data.messageIds?.[0] || ''} to ${pubTopic}.`);
  };

  const handlePull = async () => {
    if (!pullSub) return toast('Select a subscription to pull from.');
    const data = await run('PULL_MESSAGES', { subName: pullSub, autoAck });
    if (data) {
      setPulled(data);
      toast(`Pulled ${data.count} message(s) from ${pullSub}.`);
    }
  };

  const handleDelete = async (name) => {
    const data = await run('DELETE_TOPIC', { topicName: name });
    if (data) {
      toast(`Deleted local topic ${name}.`);
      await refresh();
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <Panel title="Create Topic + Subscription" icon={PlusCircle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLS}>Topic Name</label>
            <input
              className={INPUT_CLS}
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="orders-events"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Pull Subscription (optional)</label>
            <input
              className={INPUT_CLS}
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              placeholder="orders-events-sub"
            />
          </div>
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            icon={PlusCircle}
            onClick={handleCreate}
            disabled={!running || !topicName.trim()}
            busy={busy === 'CREATE_TOPIC'}
            featureId="EMU_BTN_CREATE_TOPIC"
          >
            Create Topic
          </Btn>
          <Btn
            icon={RefreshCw}
            onClick={refresh}
            disabled={!running}
            busy={busy === 'LIST_TOPICS'}
            featureId="EMU_BTN_LIST_TOPICS"
          >
            List Topics & Subscriptions
          </Btn>
        </div>
        <div className="space-y-1.5">
          {topics.length === 0 && (
            <div className="text-[11px] text-zinc-500">
              No topics exist on this local emulator yet.
            </div>
          )}
          {topics.map((t) => (
            <div
              key={t.name}
              className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5"
            >
              <div className="min-w-0">
                <Chip>{t.shortName}</Chip>
                <span className="ml-2 text-[10px] text-zinc-500">
                  {subs.filter((s) => s.topicShortName === t.shortName).length}{' '}
                  subscription(s)
                </span>
              </div>
              <Btn
                variant="danger"
                icon={Trash2}
                onClick={() => handleDelete(t.shortName)}
                disabled={!running}
                featureId="EMU_BTN_DELETE_TOPIC"
                ariaLabel={`Delete Topic ${t.shortName}`}
              >
                Delete Topic
              </Btn>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Publish Message (UTF-8 / JSON)" icon={Send}>
        <div>
          <label className={LABEL_CLS}>Target Topic</label>
          <select
            className={INPUT_CLS}
            value={pubTopic}
            onChange={(e) => setPubTopic(e.target.value)}
          >
            {topics.length === 0 && <option value="">No topics available</option>}
            {topics.map((t) => (
              <option key={t.name} value={t.shortName}>
                {t.shortName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL_CLS}>Payload</label>
          <textarea
            rows={3}
            className={INPUT_CLS}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder='{"event": "order.created"}'
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Attributes (one key=value per line)</label>
          <textarea
            rows={2}
            className={INPUT_CLS}
            value={attrsText}
            onChange={(e) => setAttrsText(e.target.value)}
            placeholder="origin=local-test"
          />
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            icon={Send}
            onClick={handlePublish}
            disabled={!running || !pubTopic}
            busy={busy === 'PUBLISH_MESSAGE'}
            featureId="EMU_BTN_PUBLISH_MESSAGE"
          >
            Publish Message
          </Btn>
        </div>
      </Panel>

      <Panel
        title="Pull & Inspect Messages"
        icon={Inbox}
        className="xl:col-span-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
          <div className="sm:col-span-2">
            <label className={LABEL_CLS}>Subscription</label>
            <select
              className={INPUT_CLS}
              value={pullSub}
              onChange={(e) => setPullSub(e.target.value)}
            >
              {subs.length === 0 && <option value="">No subscriptions available</option>}
              {subs.map((s) => (
                <option key={s.name} value={s.shortName}>
                  {s.shortName} (topic {s.topicShortName})
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 pb-1.5">
            <input
              type="checkbox"
              checked={autoAck}
              onChange={(e) => setAutoAck(e.target.checked)}
              className="accent-amber-500"
            />
            Acknowledge after pull
          </label>
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            icon={Inbox}
            onClick={handlePull}
            disabled={!running || !pullSub}
            busy={busy === 'PULL_MESSAGES'}
            featureId="EMU_BTN_PULL_MESSAGES"
          >
            Pull Messages
          </Btn>
        </div>
        {pulled && (
          <div className="space-y-2">
            <div className="text-[11px] text-zinc-500">
              {pulled.count} message(s) received
              {pulled.autoAcked ? ' and acknowledged' : ''}.
            </div>
            {(pulled.messages || []).map((m, idx) => (
              <div
                key={m.messageId || idx}
                className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2 space-y-1"
              >
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-zinc-500">
                  <span>id {m.messageId}</span>
                  <span>{m.publishTime}</span>
                </div>
                <JsonBlock value={m.parsedJson ?? m.data} />
                {Object.keys(m.attributes || {}).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(m.attributes).map(([k, v]) => (
                      <Chip key={k}>
                        {k}={v}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function DatastorePanel({ run, busy, running, toast }) {
  const [kind, setKind] = useState('');
  const [entities, setEntities] = useState(null);
  const [putKind, setPutKind] = useState('');
  const [keyName, setKeyName] = useState('');
  const [fieldsText, setFieldsText] = useState('');

  const query = useCallback(
    async (k) => {
      const data = await run('LIST_ENTITIES', { kind: (k ?? kind).trim() });
      if (data) setEntities(data);
    },
    [run, kind]
  );

  const handlePut = async () => {
    let obj;
    try {
      obj = parseJsonObject(fieldsText, 'Entity fields');
    } catch (e) {
      return toast(e.message);
    }
    if (!putKind.trim()) return toast('Enter an entity Kind first.');
    const data = await run('PUT_ENTITY', {
      kind: putKind.trim(),
      keyName: keyName.trim() || undefined,
      data: obj,
    });
    if (data) {
      toast(`Stored ${data.kind}/${data.keyName || data.keyId} in the local Datastore emulator.`);
      setKind(putKind.trim());
      await query(putKind.trim());
    }
  };

  const handleDelete = async (e) => {
    const data = await run('DELETE_ENTITY', {
      kind: e.kind,
      keyName: e.keyName || undefined,
      keyId: e.keyName ? undefined : e.keyId || undefined,
    });
    if (data) {
      toast(`Deleted ${e.kind}/${e.keyName || e.keyId}.`);
      await query(kind);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <Panel title="Put Entity" icon={PlusCircle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLS}>Kind</label>
            <input
              className={INPUT_CLS}
              value={putKind}
              onChange={(e) => setPutKind(e.target.value)}
              placeholder="Customer"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Key Name (blank = auto)</label>
            <input
              className={INPUT_CLS}
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="customer-1001"
            />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Entity Fields (JSON object)</label>
          <textarea
            rows={4}
            className={INPUT_CLS}
            value={fieldsText}
            onChange={(e) => setFieldsText(e.target.value)}
            placeholder='{"email": "dev@example.com", "active": true}'
          />
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            icon={PlusCircle}
            onClick={handlePut}
            disabled={!running || !putKind.trim() || !fieldsText.trim()}
            busy={busy === 'PUT_ENTITY'}
            featureId="EMU_BTN_PUT_ENTITY"
          >
            Put Entity
          </Btn>
        </div>
      </Panel>

      <Panel title="Query Entities by Kind" icon={Database}>
        <div>
          <label className={LABEL_CLS}>Kind (blank = all kinds)</label>
          <input
            className={INPUT_CLS}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            placeholder="Customer"
          />
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            icon={Database}
            onClick={() => query()}
            disabled={!running}
            busy={busy === 'LIST_ENTITIES'}
            featureId="EMU_BTN_QUERY_ENTITIES"
          >
            Query Entities
          </Btn>
        </div>
        {entities && (
          <div className="space-y-1.5">
            <div className="text-[11px] text-zinc-500">
              {entities.count} entit{entities.count === 1 ? 'y' : 'ies'} returned.
            </div>
            {(entities.entities || []).map((e, idx) => (
              <div
                key={`${e.kind}-${e.keyName || e.keyId}-${idx}`}
                className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <Chip>
                    {e.kind}/{e.keyName || e.keyId}
                  </Chip>
                  <Btn
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleDelete(e)}
                    featureId="EMU_BTN_DELETE_ENTITY"
                    ariaLabel={`Delete Entity ${e.kind} ${e.keyName || e.keyId}`}
                  >
                    Delete Entity
                  </Btn>
                </div>
                <JsonBlock value={e.data} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function FirestorePanel({ run, busy, running, toast }) {
  const [collectionId, setCollectionId] = useState('');
  const [docs, setDocs] = useState(null);
  const [upCollection, setUpCollection] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [fieldsText, setFieldsText] = useState('');

  const list = useCallback(
    async (col) => {
      const target = (col ?? collectionId).trim();
      if (!target) return toast('Enter a collection ID to list documents.');
      const data = await run('LIST_DOCUMENTS', { collectionId: target });
      if (data) setDocs(data);
    },
    [run, collectionId, toast]
  );

  const handleUpsert = async () => {
    let obj;
    try {
      obj = parseJsonObject(fieldsText, 'Document fields');
    } catch (e) {
      return toast(e.message);
    }
    const data = await run('UPSERT_DOCUMENT', {
      collectionId: upCollection.trim(),
      documentId: documentId.trim() || undefined,
      data: obj,
    });
    if (data) {
      toast(`Upserted ${data.collectionId}/${data.documentId} in the local Firestore emulator.`);
      setCollectionId(upCollection.trim());
      await list(upCollection.trim());
    }
  };

  const handleDelete = async (d) => {
    const data = await run('DELETE_DOCUMENT', {
      collectionId: docs.collectionId,
      documentId: d.documentId,
    });
    if (data) {
      toast(`Deleted ${docs.collectionId}/${d.documentId}.`);
      await list(docs.collectionId);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <Panel title="Upsert Document" icon={PlusCircle}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLS}>Collection</label>
            <input
              className={INPUT_CLS}
              value={upCollection}
              onChange={(e) => setUpCollection(e.target.value)}
              placeholder="users"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Document ID (blank = auto)</label>
            <input
              className={INPUT_CLS}
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              placeholder="user-1001"
            />
          </div>
        </div>
        <div>
          <label className={LABEL_CLS}>Document Fields (JSON object)</label>
          <textarea
            rows={4}
            className={INPUT_CLS}
            value={fieldsText}
            onChange={(e) => setFieldsText(e.target.value)}
            placeholder='{"displayName": "Dev User", "age": 30}'
          />
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            icon={PlusCircle}
            onClick={handleUpsert}
            disabled={!running || !upCollection.trim() || !fieldsText.trim()}
            busy={busy === 'UPSERT_DOCUMENT'}
            featureId="EMU_BTN_UPSERT_DOCUMENT"
          >
            Upsert Document
          </Btn>
        </div>
      </Panel>

      <Panel title="List Documents in Collection" icon={FileText}>
        <div>
          <label className={LABEL_CLS}>Collection</label>
          <input
            className={INPUT_CLS}
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            placeholder="users"
          />
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            icon={FileText}
            onClick={() => list()}
            disabled={!running || !collectionId.trim()}
            busy={busy === 'LIST_DOCUMENTS'}
            featureId="EMU_BTN_LIST_DOCUMENTS"
          >
            List Documents
          </Btn>
        </div>
        {docs && (
          <div className="space-y-1.5">
            <div className="text-[11px] text-zinc-500">
              {docs.count} document(s) in <Chip>{docs.collectionId}</Chip>.
            </div>
            {(docs.documents || []).map((d) => (
              <div
                key={d.name}
                className="rounded-md border border-zinc-200 dark:border-zinc-800 p-2 space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <Chip>{d.documentId}</Chip>
                  <Btn
                    variant="danger"
                    icon={Trash2}
                    onClick={() => handleDelete(d)}
                    featureId="EMU_BTN_DELETE_DOCUMENT"
                    ariaLabel={`Delete Document ${d.documentId}`}
                  >
                    Delete Document
                  </Btn>
                </div>
                <JsonBlock value={d.data} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

function SpannerPanel({ run, busy, running, toast }) {
  const [instances, setInstances] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [instanceId, setInstanceId] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [sql, setSql] = useState('');
  const [result, setResult] = useState(null);

  const refresh = useCallback(async () => {
    const data = await run('LIST_INSTANCES');
    if (data) {
      setInstances(data.instances || []);
      setDatabases(data.databases || []);
      if (data.databases?.[0]) {
        setInstanceId((cur) => cur || data.databases[0].instanceId);
        setDatabaseId((cur) => cur || data.databases[0].databaseId);
      }
    }
  }, [run]);

  useEffect(() => {
    if (running) refresh();
  }, [running, refresh]);

  const handleBootstrap = async () => {
    const data = await run('BOOTSTRAP_INSTANCE_DB', {
      instanceId: instanceId.trim() || undefined,
      databaseId: databaseId.trim() || undefined,
    });
    if (data) {
      setInstanceId(data.instanceId);
      setDatabaseId(data.databaseId);
      toast(`Local Spanner ${data.databaseName} is ready.`);
      await refresh();
    }
  };

  const handleExecute = async () => {
    const data = await run('EXECUTE_SQL', {
      instanceId: instanceId.trim() || undefined,
      databaseId: databaseId.trim() || undefined,
      sql,
    });
    if (data) {
      setResult(data);
      toast(`Local Spanner ${data.statementType} executed.`);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <Panel title="Bootstrap Local Instance & Database" icon={Layers}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={LABEL_CLS}>Instance ID</label>
            <input
              className={INPUT_CLS}
              value={instanceId}
              onChange={(e) => setInstanceId(e.target.value)}
              placeholder="local-instance"
            />
          </div>
          <div>
            <label className={LABEL_CLS}>Database ID</label>
            <input
              className={INPUT_CLS}
              value={databaseId}
              onChange={(e) => setDatabaseId(e.target.value)}
              placeholder="local-db"
            />
          </div>
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            icon={Layers}
            onClick={handleBootstrap}
            disabled={!running}
            busy={busy === 'BOOTSTRAP_INSTANCE_DB'}
            featureId="EMU_BTN_BOOTSTRAP_SPANNER"
          >
            Bootstrap Local Instance
          </Btn>
          <Btn
            icon={RefreshCw}
            onClick={refresh}
            disabled={!running}
            busy={busy === 'LIST_INSTANCES'}
            featureId="EMU_BTN_LIST_SPANNER_INSTANCES"
          >
            List Local Instances
          </Btn>
        </div>
        <div className="space-y-1">
          {instances.length === 0 && (
            <div className="text-[11px] text-zinc-500">
              No local Spanner instances yet.
            </div>
          )}
          {instances.map((i) => (
            <div
              key={i.name}
              className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300"
            >
              <Chip>{i.instanceId}</Chip>{' '}
              <span className="text-zinc-500">
                databases:{' '}
                {databases
                  .filter((d) => d.instanceId === i.instanceId)
                  .map((d) => d.databaseId)
                  .join(', ') || 'none'}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Execute Local SQL (Query, DDL, DML)" icon={Terminal}>
        <div>
          <label className={LABEL_CLS}>SQL Statement</label>
          <textarea
            rows={5}
            className={INPUT_CLS}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            placeholder="SELECT 1"
          />
        </div>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            icon={Play}
            onClick={handleExecute}
            disabled={!running || !sql.trim()}
            busy={busy === 'EXECUTE_SQL'}
            featureId="EMU_BTN_EXECUTE_LOCAL_SQL"
          >
            Execute Local SQL
          </Btn>
        </div>
        {result && (
          <div className="space-y-1.5">
            <div className="text-[11px] text-zinc-500">
              <Chip>{result.statementType}</Chip>
              {result.rowCount !== undefined && ` ${result.rowCount} row(s)`}
              {result.rowCountExact !== undefined &&
                ` ${result.rowCountExact} row(s) affected`}
              {result.statementsExecuted !== undefined &&
                ` ${result.statementsExecuted} DDL statement(s) applied`}
            </div>
            {(result.columns || []).length > 0 && (
              <div className="overflow-auto max-h-64 rounded-md border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-[11px] font-mono">
                  <thead className="bg-zinc-100 dark:bg-zinc-900">
                    <tr>
                      {result.columns.map((c) => (
                        <th
                          key={c.name}
                          className="text-left px-2 py-1 text-zinc-600 dark:text-zinc-400"
                        >
                          {c.name}
                          <span className="ml-1 text-zinc-400">{c.type}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(result.rows || []).map((r, idx) => (
                      <tr
                        key={idx}
                        className="border-t border-zinc-200 dark:border-zinc-800"
                      >
                        {result.columns.map((c) => (
                          <td
                            key={c.name}
                            className="px-2 py-1 text-zinc-800 dark:text-zinc-200"
                          >
                            {String(r[c.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}

function BigtablePanel({ run, busy, running, em, projectId, toast, copy, copiedKey }) {
  const [probe, setProbe] = useState(null);
  const [instanceName, setInstanceName] = useState('');
  const port = em?.port;
  const inst = instanceName.trim() || 'your-bt-instance';
  const proj = projectId || 'your-gcp-project';
  const cbtPrefix = `BIGTABLE_EMULATOR_HOST=127.0.0.1:${port ?? '<port>'} cbt -project=${proj} -instance=${inst}`;
  const commands = [
    `${cbtPrefix} createtable events`,
    `${cbtPrefix} createfamily events cf1`,
    `${cbtPrefix} set events row1 cf1:message=hello`,
    `${cbtPrefix} read events`,
    `${cbtPrefix} ls`,
  ];

  const handleProbe = async () => {
    const data = await run('PROBE_PORT');
    if (data) {
      setProbe(data);
      toast(
        data.portOpen
          ? `Bigtable socket 127.0.0.1:${port} is open (${data.tcpRttMs} ms).`
          : `Bigtable socket 127.0.0.1:${port} is closed.`
      );
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <Panel title="Live gRPC / TCP Socket Health Probe" icon={Wifi}>
        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          The Bigtable emulator speaks binary gRPC, so health is verified with a
          real TCP connect to <Chip>127.0.0.1:{port ?? 'n/a'}</Chip>.
        </p>
        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            icon={Wifi}
            onClick={handleProbe}
            busy={busy === 'PROBE_PORT'}
            featureId="EMU_BTN_PROBE_PORT"
            disabled={!running && !em}
          >
            Probe TCP Port
          </Btn>
        </div>
        {probe && (
          <div className="space-y-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
            <div>
              Socket:{' '}
              <StatusPill tone={probe.portOpen ? 'emerald' : 'zinc'}>
                {probe.portOpen ? 'OPEN' : 'CLOSED'}
              </StatusPill>{' '}
              RTT {fmtNum(probe.tcpRttMs, ' ms')}
            </div>
            {probe.httpBanner && <div>Banner: {probe.httpBanner}</div>}
            <div className="text-zinc-500">Probed at {probe.probedAt}</div>
          </div>
        )}
      </Panel>

      <Panel title="cbt CLI Command Generator" icon={Terminal}>
        <div>
          <label className={LABEL_CLS}>Instance ID</label>
          <input
            className={INPUT_CLS}
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
            placeholder="your-bt-instance"
          />
        </div>
        <div className="space-y-1.5">
          {commands.map((cmd, idx) => (
            <div key={cmd} className="flex items-start gap-2">
              <Chip className="flex-1 break-all">{cmd}</Chip>
              <Btn
                icon={copiedKey === `cbt-${idx}` ? Check : Copy}
                onClick={() => copy(`cbt-${idx}`, cmd, 'Copied cbt command.')}
                featureId="EMU_BTN_COPY_CBT_COMMAND"
                ariaLabel={`Copy cbt Command ${idx + 1}`}
              >
                Copy cbt Command
              </Btn>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ============================================================================
 * Main Studio
 * ============================================================================ */

export default function LocalCloudEmulatorsStudio({
  projectId,
  onShowToast,
  onNavigateStudio, // eslint-disable-line no-unused-vars
}) {
  const [activeSubTab, setActiveSubTab] = useState('FLEET_CONTROL');
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [portDraft, setPortDraft] = useState({});
  const [runtimeDraft, setRuntimeDraft] = useState({});
  const [remediation, setRemediation] = useState({});
  const [probeResults, setProbeResults] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [workbenchType, setWorkbenchType] = useState('PUBSUB');
  const [cloneResults, setCloneResults] = useState({});
  const [envFormat, setEnvFormat] = useState('bash');
  const [logType, setLogType] = useState('PUBSUB');
  const [logData, setLogData] = useState(null);
  const [logsAuto, setLogsAuto] = useState(false);
  const [logBusy, setLogBusy] = useState(false);
  const logRef = useRef(null);

  const toast = useCallback(
    (msg) => {
      if (onShowToast && msg) onShowToast(msg);
    },
    [onShowToast]
  );

  const base = `/api/project/${encodeURIComponent(projectId || '')}/emulators`;

  const emulators = useMemo(() => overview?.emulators || [], [overview]);
  const byType = useMemo(
    () => Object.fromEntries(emulators.map((e) => [e.emulatorType, e])),
    [emulators]
  );

  /* ---------------- Overview ---------------- */

  const fetchOverview = useCallback(
    async (silent = false, refresh = false) => {
      if (!projectId) return;
      if (!silent) setLoading(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/emulators/overview${
            refresh ? '?refresh=1' : ''
          }`
        );
        setOverview(res.data);
        setLoadError('');
        setPortDraft((prev) => {
          const next = { ...prev };
          (res.data?.emulators || []).forEach((e) => {
            if (!next[e.emulatorType]) {
              next[e.emulatorType] = {
                port: String(e.port ?? ''),
                restPort: e.restPort ? String(e.restPort) : '',
              };
            }
          });
          return next;
        });
      } catch (err) {
        if (isCancelled(err)) return;
        setLoadError(errorText(err, 'Failed to load local emulator fleet.'));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    setOverview(null);
    setPortDraft({});
    setRemediation({});
    setProbeResults({});
    setCloneResults({});
    setLogData(null);
    fetchOverview();
  }, [projectId, fetchOverview]);

  useEffect(() => {
    const onOpen = (ev) => {
      const detail = ev?.detail || {};
      if (detail.subTab && SUB_TABS.some((t) => t.id === detail.subTab)) {
        setActiveSubTab(detail.subTab);
      }
      if (detail.emulatorType && EMULATOR_META[detail.emulatorType]) {
        setWorkbenchType(detail.emulatorType);
        setLogType(detail.emulatorType);
      }
    };
    window.addEventListener('cloudpulse:open-local-emulators', onOpen);
    return () =>
      window.removeEventListener('cloudpulse:open-local-emulators', onOpen);
  }, []);

  /* ---------------- Copy ---------------- */

  const copy = useCallback(
    (key, text, label = 'Copied to clipboard.') => {
      navigator.clipboard?.writeText(String(text || ''));
      setCopiedKey(key);
      toast(label);
      setTimeout(() => setCopiedKey((p) => (p === key ? null : p)), 1800);
    },
    [toast]
  );

  /* ---------------- Fleet actions ---------------- */

  const setRemed = (type, value) =>
    setRemediation((prev) => ({ ...prev, [type]: value }));

  const handleStart = async (type) => {
    const em = byType[type];
    const d = portDraft[type] || {};
    setBusy(`start-${type}`);
    setRemed(type, null);
    try {
      const res = await axios.post(`${base}/start`, {
        emulatorType: type,
        port: Number(d.port) || em?.port,
        restPort:
          type === 'SPANNER' ? Number(d.restPort) || em?.restPort : undefined,
        runtimeMode: runtimeDraft[type] || em?.runtimeMode || 'GCLOUD_CLI',
        storeOnDisk: false,
      });
      toast(res.data?.message || `${EMULATOR_META[type].short} emulator started.`);
      await fetchOverview(true);
    } catch (err) {
      if (isCancelled(err)) return;
      const data = err.response?.data || {};
      setRemed(type, {
        error: errorText(err, 'Failed to start local emulator.'),
        cmd: data.manualInstallCmd || data.installCommand || '',
        stderrTail: data.stderrTail || '',
      });
      toast(errorText(err, 'Failed to start local emulator.'));
    } finally {
      setBusy('');
    }
  };

  const handleStop = async (type) => {
    setBusy(`stop-${type}`);
    try {
      await axios.post(`${base}/stop`, { emulatorType: type });
      toast(`${EMULATOR_META[type].short} emulator stopped.`);
      await fetchOverview(true);
    } catch (err) {
      if (!isCancelled(err)) toast(errorText(err, 'Failed to stop emulator.'));
    } finally {
      setBusy('');
    }
  };

  const handleStopAll = async () => {
    setBusy('stop-all');
    try {
      const res = await axios.post(`${base}/stop`, { stopAll: true });
      toast(`Stopped ${(res.data?.stopped || []).length} running local emulator(s).`);
      await fetchOverview(true);
    } catch (err) {
      if (!isCancelled(err)) toast(errorText(err, 'Failed to stop emulators.'));
    } finally {
      setBusy('');
    }
  };

  const handleReset = async (type) => {
    setBusy(`reset-${type}`);
    try {
      const res = await axios.post(`${base}/reset-data`, { emulatorType: type });
      toast(
        `${EMULATOR_META[type].short} local state purged${
          res.data?.restarted ? ' and emulator restarted' : ''
        }.`
      );
      if (res.data?.restartError) {
        setRemed(type, { error: res.data.restartError, cmd: '', stderrTail: '' });
      }
      await fetchOverview(true);
    } catch (err) {
      if (!isCancelled(err)) toast(errorText(err, 'Failed to reset emulator state.'));
    } finally {
      setBusy('');
    }
  };

  const handleInstall = async (type) => {
    const em = byType[type];
    if (!em?.componentId) return;
    setBusy(`install-${type}`);
    setRemed(type, null);
    try {
      const res = await axios.post(`${base}/install-component`, {
        componentId: em.componentId,
      });
      toast(res.data?.message || `Installed ${em.componentId}.`);
      await fetchOverview(true, true);
    } catch (err) {
      if (isCancelled(err)) return;
      const data = err.response?.data || {};
      setRemed(type, {
        error: errorText(err, 'Failed to install SDK component.'),
        cmd: data.manualInstallCmd || data.installCommand || '',
        stderrTail: '',
      });
      toast(errorText(err, 'Failed to install SDK component.'));
    } finally {
      setBusy('');
    }
  };

  const callWorkbench = useCallback(
    async (type, action, extra = {}) => {
      const em = byType[type];
      const res = await axios.post(`${base}/workbench`, {
        emulatorType: type,
        action,
        port: em?.port,
        restPort: em?.restPort || undefined,
        ...extra,
      });
      return res.data;
    },
    [base, byType]
  );

  const handleProbe = async (type) => {
    setBusy(`probe-${type}`);
    try {
      const data = await callWorkbench(type, 'PROBE_PORT');
      setProbeResults((prev) => ({ ...prev, [type]: data }));
      toast(
        data.portOpen
          ? `${EMULATOR_META[type].short} ${data.hostPort} is open (${data.tcpRttMs} ms).`
          : `${EMULATOR_META[type].short} ${data.hostPort} is closed.`
      );
    } catch (err) {
      if (!isCancelled(err)) toast(errorText(err, 'TCP probe failed.'));
    } finally {
      setBusy('');
    }
  };

  const openWorkbench = (type) => {
    setWorkbenchType(type);
    setActiveSubTab('LIVE_WORKBENCH');
  };

  const handleClone = async (type) => {
    setBusy(`clone-${type}`);
    try {
      const res = await axios.post(`${base}/clone-cloud-schema`, {
        emulatorType: type,
      });
      setCloneResults((prev) => ({ ...prev, [type]: res.data }));
      toast(res.data?.summary || 'Cloud schema cloned into local emulator.');
    } catch (err) {
      if (isCancelled(err)) return;
      setCloneResults((prev) => ({
        ...prev,
        [type]: { ok: false, error: errorText(err, 'Clone failed.') },
      }));
      toast(errorText(err, 'Failed to clone cloud schema.'));
    } finally {
      setBusy('');
    }
  };

  /* ---------------- Logs ---------------- */

  const fetchLogs = useCallback(
    async (type, silent = false) => {
      if (!projectId) return;
      if (!silent) setLogBusy(true);
      try {
        const res = await axios.get(`${base}/${type}/logs`);
        setLogData(res.data);
      } catch (err) {
        if (!silent && !isCancelled(err)) {
          toast(errorText(err, 'Failed to read emulator logs.'));
        }
      } finally {
        if (!silent) setLogBusy(false);
      }
    },
    [base, projectId, toast]
  );

  useEffect(() => {
    if (activeSubTab !== 'ENV_AND_LOGS') return undefined;
    fetchLogs(logType);
    if (!logsAuto) return undefined;
    const id = setInterval(() => fetchLogs(logType, true), 3000);
    return () => clearInterval(id);
  }, [activeSubTab, logType, logsAuto, fetchLogs]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logData]);

  /* ---------------- Derived ---------------- */

  const host = overview?.hostReadiness || {};
  const activeCount = overview?.activeCount || 0;
  const burnTotal = emulators.reduce(
    (sum, e) => sum + (Number(e.localBurnUsdPerHr) || 0),
    0
  );
  const assets = overview?.cloudAssets || {};
  const counts = assets.counts || {};
  const apiStatus = assets.apiStatus || {};
  const bundle = overview?.envExportBundle || {};

  const pillLabel = (e) => {
    if (e.status === 'RUNNING') return { tone: 'emerald', text: 'RUNNING' };
    if (!e.componentInstalled && (runtimeDraft[e.emulatorType] || e.runtimeMode) !== 'DOCKER')
      return { tone: 'amber', text: 'SDK COMPONENT MISSING' };
    if (e.readinessState === 'JAVA_25_REQUIRED_OR_DOCKER')
      return { tone: 'amber', text: 'JAVA 25 JRE REQUIRED (OR USE DOCKER)' };
    return { tone: 'zinc', text: 'STOPPED' };
  };

  /* ============================================================================
   * Render: Header + Sub tabs
   * ============================================================================ */

  const header = (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="amber">
              <Cpu className="w-3 h-3" />
              GOOGLE CLOUD LOCAL EMULATORS
            </StatusPill>
            <StatusPill tone="emerald">
              <DollarSign className="w-3 h-3" />
              $0.00/hr Inner-Loop Compute
            </StatusPill>
            <StatusPill tone="blue">
              <Container className="w-3 h-3" />
              gcloud beta emulators or Docker
            </StatusPill>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Local Cloud Emulators Studio
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Run Pub/Sub, Firestore, Datastore, Spanner and Bigtable on{' '}
            <Chip>127.0.0.1</Chip>, drive them through a live REST workbench,
            mirror the schema of{' '}
            <Chip>{projectId || 'your-gcp-project'}</Chip> into them, and export{' '}
            <Chip>*_EMULATOR_HOST</Chip> variables for your SDKs.
          </p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Local Cloud Emulators Modules"
        className="cp-segmented-menu flex flex-wrap gap-1.5"
      >
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-subtab-id={tab.id}
              data-feature-id={`EMU_TAB_${tab.id}`}
              title={tab.shortDesc}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 h-9 rounded-md border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition ${
                isActive ? TAB_ACTIVE : TAB_INACTIVE
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ============================================================================
   * Tab 1: FLEET_CONTROL
   * ============================================================================ */

  const readinessCells = [
    {
      label: 'Active Local Emulators',
      value: `${activeCount}/${emulators.length || EMULATOR_ORDER.length}`,
      sub: activeCount > 0 ? 'running' : 'idle',
    },
    {
      label: 'Google Cloud SDK',
      value: host.gcloudVersion || (overview ? 'Not found' : '...'),
      sub: host.gcloudInstalled === false ? 'install gcloud' : 'detected',
    },
    {
      label: 'Java JRE Runtime',
      value: host.javaInstalled ? host.javaVersion || 'installed' : overview ? 'Not installed' : '...',
      sub: host.java25Ready ? 'Java 25+ ready' : 'Java 25+ needed for SDK mode',
    },
    {
      label: 'Docker Engine',
      value: host.dockerAvailable ? host.dockerVersion || 'running' : overview ? 'Unavailable' : '...',
      sub: host.dockerAvailable ? 'DOCKER mode ready' : 'daemon not reachable',
    },
    {
      label: 'Local Compute Burn',
      value: `${fmtUsd(burnTotal)}/hr`,
      sub: 'local processes',
    },
  ];

  const fleetTab = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5">
        {readinessCells.map((c) => (
          <div key={c.label}>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
              {c.label}
            </div>
            <div className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
              {c.value}
              <span className="ml-1.5 text-[10px] font-normal text-zinc-500">
                {c.sub}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
        <Btn
          icon={RefreshCw}
          busy={loading}
          onClick={() => fetchOverview(false, true)}
          featureId="EMU_BTN_REFRESH_FLEET"
        >
          Refresh Fleet
        </Btn>
        {activeCount > 0 && (
          <Btn
            variant="danger"
            icon={Square}
            busy={busy === 'stop-all'}
            onClick={handleStopAll}
            featureId="EMU_BTN_STOP_ALL"
          >
            Stop All Running
          </Btn>
        )}
        {overview?.timestamp && (
          <span className="text-[10px] font-mono text-zinc-500">
            Last scan {overview.timestamp}
          </span>
        )}
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{loadError}</span>
        </div>
      )}

      {!overview && loading && (
        <div className="text-xs text-zinc-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Scanning host for gcloud, Java, Docker and emulator sockets...
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {EMULATOR_ORDER.map((type) => {
          const em = byType[type];
          if (!em) return null;
          const meta = EMULATOR_META[type];
          const Icon = meta.icon;
          const pill = pillLabel(em);
          const running = em.status === 'RUNNING';
          const d = portDraft[type] || { port: '', restPort: '' };
          const rm = remediation[type];
          const probe = probeResults[type];
          const mode = runtimeDraft[type] || em.runtimeMode || 'GCLOUD_CLI';
          const startBlocked =
            mode === 'GCLOUD_CLI' && !em.componentInstalled;
          return (
            <div
              key={type}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {em.displayName}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {em.protocol}
                    </div>
                  </div>
                </div>
                <StatusPill tone={pill.tone}>{pill.text}</StatusPill>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <Chip>
                  {em.envVarName}={em.envVarValue}
                </Chip>
                {em.restHostPort && <Chip>REST {em.restHostPort}</Chip>}
                <Chip>SDK component {em.componentId}</Chip>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">PID</div>
                  <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {running ? fmtNum(em.pid) : 'n/a'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">RSS MB</div>
                  <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {running ? fmtNum(em.rssMb) : 'n/a'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">TCP RTT ms</div>
                  <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {running ? fmtNum(em.tcpRttMs) : 'n/a'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-zinc-500">Uptime</div>
                  <div className="text-xs font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {fmtUptime(em.uptimeSec)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className={LABEL_CLS}>
                    {type === 'SPANNER' ? 'gRPC Port' : 'Port'}
                  </label>
                  <input
                    className={INPUT_CLS}
                    inputMode="numeric"
                    value={d.port}
                    disabled={running}
                    onChange={(e) =>
                      setPortDraft((prev) => ({
                        ...prev,
                        [type]: { ...d, port: e.target.value.replace(/\D/g, '') },
                      }))
                    }
                  />
                </div>
                {type === 'SPANNER' && (
                  <div>
                    <label className={LABEL_CLS}>REST Port</label>
                    <input
                      className={INPUT_CLS}
                      inputMode="numeric"
                      value={d.restPort}
                      disabled={running}
                      onChange={(e) =>
                        setPortDraft((prev) => ({
                          ...prev,
                          [type]: { ...d, restPort: e.target.value.replace(/\D/g, '') },
                        }))
                      }
                    />
                  </div>
                )}
                <div className={type === 'SPANNER' ? '' : 'sm:col-span-2'}>
                  <label className={LABEL_CLS}>Runtime Mode</label>
                  <select
                    className={INPUT_CLS}
                    value={mode}
                    disabled={running}
                    onChange={(e) =>
                      setRuntimeDraft((prev) => ({ ...prev, [type]: e.target.value }))
                    }
                  >
                    {RUNTIME_MODES.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {em.installHint && !running && !rm && (
                <div className="text-[11px] text-amber-700 dark:text-amber-300 flex flex-wrap items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Host hint:</span>
                  <Chip>{em.installHint}</Chip>
                </div>
              )}

              {rm && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-zinc-900 dark:text-zinc-100">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="font-semibold">{rm.error}</span>
                  </div>
                  {rm.cmd && (
                    <div className="flex flex-wrap items-center gap-2">
                      <Chip className="break-all">{rm.cmd}</Chip>
                      <Btn
                        icon={copiedKey === `rem-${type}` ? Check : Copy}
                        onClick={() =>
                          copy(`rem-${type}`, rm.cmd, 'Copied remediation command.')
                        }
                        featureId="EMU_BTN_COPY_REMEDIATION"
                      >
                        Copy Remediation Command
                      </Btn>
                    </div>
                  )}
                  {rm.stderrTail && (
                    <pre className="max-h-28 overflow-auto rounded bg-zinc-950 text-zinc-200 p-2 text-[10px] font-mono whitespace-pre-wrap">
                      {rm.stderrTail}
                    </pre>
                  )}
                </div>
              )}

              <div data-action-toolbar="true" className="flex flex-wrap gap-2">
                {!running && (
                  <Btn
                    variant="primary"
                    icon={Play}
                    onClick={() => handleStart(type)}
                    busy={busy === `start-${type}`}
                    disabled={startBlocked || !d.port}
                    title={
                      startBlocked
                        ? 'Install the SDK component or switch Runtime Mode to DOCKER first'
                        : undefined
                    }
                    featureId="EMU_BTN_START_EMULATOR"
                    ariaLabel={`Start Emulator ${meta.short}`}
                  >
                    Start Emulator
                  </Btn>
                )}
                {running && (
                  <Btn
                    variant="danger"
                    icon={Square}
                    onClick={() => handleStop(type)}
                    busy={busy === `stop-${type}`}
                    featureId="EMU_BTN_STOP_EMULATOR"
                    ariaLabel={`Stop Emulator ${meta.short}`}
                  >
                    Stop Emulator
                  </Btn>
                )}
                <Btn
                  icon={RotateCcw}
                  onClick={() => handleReset(type)}
                  busy={busy === `reset-${type}`}
                  featureId="EMU_BTN_RESET_EMULATOR"
                  ariaLabel={`Reset Emulator State ${meta.short}`}
                >
                  Reset Emulator State
                </Btn>
                <Btn
                  icon={ArrowRight}
                  onClick={() => openWorkbench(type)}
                  featureId="EMU_BTN_OPEN_WORKBENCH"
                  ariaLabel={`Open Workbench ${meta.short}`}
                >
                  Open Workbench
                </Btn>
                {!em.componentInstalled && (
                  <Btn
                    icon={Download}
                    onClick={() => handleInstall(type)}
                    busy={busy === `install-${type}`}
                    featureId="EMU_BTN_INSTALL_COMPONENT"
                    ariaLabel={`Install SDK Component ${em.componentId}`}
                  >
                    Install SDK Component
                  </Btn>
                )}
                <Btn
                  icon={Wifi}
                  onClick={() => handleProbe(type)}
                  busy={busy === `probe-${type}`}
                  featureId="EMU_BTN_PROBE_PORT"
                  ariaLabel={`Probe TCP Port ${meta.short}`}
                >
                  Probe TCP Port
                </Btn>
              </div>

              {probe && (
                <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 flex flex-wrap items-center gap-2">
                  <StatusPill tone={probe.portOpen ? 'emerald' : 'zinc'}>
                    {probe.portOpen ? 'SOCKET OPEN' : 'SOCKET CLOSED'}
                  </StatusPill>
                  <span>{probe.hostPort}</span>
                  <span>RTT {fmtNum(probe.tcpRttMs, ' ms')}</span>
                  {probe.httpBanner && (
                    <span className="text-zinc-500 truncate max-w-xs">
                      {probe.httpBanner}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ============================================================================
   * Tab 2: LIVE_WORKBENCH
   * ============================================================================ */

  const wbEm = byType[workbenchType];
  const wbRunning = wbEm?.status === 'RUNNING';

  const runWorkbench = useCallback(
    async (action, extra = {}) => {
      setBusy(`wb-${action}`);
      try {
        return await callWorkbench(workbenchType, action, extra);
      } catch (err) {
        if (!isCancelled(err)) toast(errorText(err, `${action} failed.`));
        return null;
      } finally {
        setBusy('');
      }
    },
    [callWorkbench, workbenchType, toast]
  );

  const wbBusyAction = busy.startsWith('wb-') ? busy.slice(3) : '';

  const workbenchTab = (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label="Local Emulator Selector"
        className="cp-segmented-menu flex flex-wrap gap-1.5"
      >
        {WORKBENCH_ORDER.map((type) => {
          const em = byType[type];
          const meta = EMULATOR_META[type];
          const Icon = meta.icon;
          const isActive = workbenchType === type;
          const isRun = em?.status === 'RUNNING';
          const shownPort = type === 'SPANNER' ? em?.restPort : em?.port;
          return (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-feature-id={`EMU_PILL_${type}`}
              onClick={() => setWorkbenchType(type)}
              className={`px-3 h-9 rounded-md border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition ${
                isActive ? TAB_ACTIVE : TAB_INACTIVE
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isRun ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'
                }`}
              />
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>
                {meta.short}
                {shownPort ? ` :${shownPort}` : ''}
              </span>
            </button>
          );
        })}
      </div>

      {wbEm && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <StatusPill tone={wbRunning ? 'emerald' : 'zinc'}>
              {wbRunning ? 'RUNNING' : 'STOPPED'}
            </StatusPill>
            <Chip>{wbEm.hostPort}</Chip>
            {wbEm.restHostPort && <Chip>REST {wbEm.restHostPort}</Chip>}
            <Chip>
              {wbEm.envVarName}={wbEm.envVarValue}
            </Chip>
            {wbRunning && (
              <span className="font-mono text-zinc-500">
                PID {fmtNum(wbEm.pid)} | RTT {fmtNum(wbEm.tcpRttMs, ' ms')}
              </span>
            )}
          </div>
          {!wbRunning && (
            <Btn
              variant="primary"
              icon={Play}
              onClick={() => handleStart(workbenchType)}
              busy={busy === `start-${workbenchType}`}
              disabled={!(portDraft[workbenchType]?.port || wbEm.port)}
              featureId="EMU_BTN_START_SELECTED"
            >
              Start Selected Emulator
            </Btn>
          )}
        </div>
      )}

      {remediation[workbenchType] && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
          <div className="flex items-start gap-2 text-xs text-zinc-900 dark:text-zinc-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="font-semibold">{remediation[workbenchType].error}</span>
          </div>
          {remediation[workbenchType].cmd && (
            <div className="flex flex-wrap items-center gap-2">
              <Chip className="break-all">{remediation[workbenchType].cmd}</Chip>
              <Btn
                icon={copiedKey === `rem-${workbenchType}` ? Check : Copy}
                onClick={() =>
                  copy(
                    `rem-${workbenchType}`,
                    remediation[workbenchType].cmd,
                    'Copied remediation command.'
                  )
                }
                featureId="EMU_BTN_COPY_REMEDIATION"
              >
                Copy Remediation Command
              </Btn>
            </div>
          )}
        </div>
      )}

      {!wbRunning && wbEm && (
        <div className="text-[11px] text-zinc-500">
          Start the {EMULATOR_META[workbenchType].short} emulator to enable the
          workbench actions below.
        </div>
      )}

      {workbenchType === 'PUBSUB' && (
        <PubSubPanel run={runWorkbench} busy={wbBusyAction} running={wbRunning} toast={toast} />
      )}
      {workbenchType === 'DATASTORE' && (
        <DatastorePanel run={runWorkbench} busy={wbBusyAction} running={wbRunning} toast={toast} />
      )}
      {workbenchType === 'FIRESTORE' && (
        <FirestorePanel run={runWorkbench} busy={wbBusyAction} running={wbRunning} toast={toast} />
      )}
      {workbenchType === 'SPANNER' && (
        <SpannerPanel run={runWorkbench} busy={wbBusyAction} running={wbRunning} toast={toast} />
      )}
      {workbenchType === 'BIGTABLE' && (
        <BigtablePanel
          run={runWorkbench}
          busy={wbBusyAction}
          running={wbRunning}
          em={wbEm}
          projectId={projectId}
          toast={toast}
          copy={copy}
          copiedKey={copiedKey}
        />
      )}
    </div>
  );

  /* ============================================================================
   * Tab 3: CLOUD_SCHEMA_SYNC
   * ============================================================================ */

  const cloudSummary = (type) => {
    switch (type) {
      case 'PUBSUB':
        return {
          count: `${counts.pubsubTopics ?? 0} topics / ${counts.pubsubSubscriptions ?? 0} subscriptions`,
          names: (assets.pubsubTopics || []).map((t) => t.shortName),
          api: apiStatus.pubsub,
        };
      case 'FIRESTORE':
        return {
          count: `${(assets.firestoreDatabases || []).filter((d) => !/DATASTORE/i.test(d.type || '')).length} Firestore database(s)`,
          names: (assets.firestoreDatabases || [])
            .filter((d) => !/DATASTORE/i.test(d.type || ''))
            .map((d) => d.shortName),
          api: apiStatus.firestore,
        };
      case 'DATASTORE':
        return {
          count: `${(assets.firestoreDatabases || []).filter((d) => /DATASTORE/i.test(d.type || '')).length} Datastore-mode database(s)`,
          names: (assets.firestoreDatabases || [])
            .filter((d) => /DATASTORE/i.test(d.type || ''))
            .map((d) => d.shortName),
          api: apiStatus.firestore,
        };
      case 'SPANNER':
        return {
          count: `${counts.spannerInstances ?? 0} instance(s)`,
          names: (assets.spannerInstances || []).map((i) => i.shortName),
          api: apiStatus.spanner,
        };
      default:
        return {
          count: `${counts.bigtableInstances ?? 0} instance(s)`,
          names: (assets.bigtableInstances || []).map((i) => i.shortName),
          api: apiStatus.bigtable,
        };
    }
  };

  const apiTone = (s) =>
    s === 'ENABLED' ? 'emerald' : s === 'API_DISABLED' || s === 'PERMISSION_DENIED' ? 'amber' : 'zinc';

  const cloudBurnTotal = emulators.reduce(
    (sum, e) => sum + (Number(e.cloudConsoleBurnUsdPerHr) || 0),
    0
  );

  const syncTab = (
    <div className="space-y-3">
      <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
        Left column is read live from Google Cloud project{' '}
        <Chip>{projectId || 'your-gcp-project'}</Chip>; right column is your
        local <Chip>127.0.0.1</Chip> emulator. Cloning only reads from Cloud and
        writes to the local emulator.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {EMULATOR_ORDER.map((type) => {
          const em = byType[type];
          if (!em) return null;
          const meta = EMULATOR_META[type];
          const Icon = meta.icon;
          const cs = cloudSummary(type);
          const running = em.status === 'RUNNING';
          const clone = cloneResults[type];
          return (
            <div
              key={type}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3.5 space-y-3"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100">
                <Icon className="w-4 h-4 text-amber-500" />
                {em.displayName}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-zinc-500">
                      <Cloud className="w-3 h-3" />
                      Live Cloud
                    </span>
                    <StatusPill tone={apiTone(cs.api)}>{cs.api || 'UNKNOWN'}</StatusPill>
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {cs.count}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cs.names.slice(0, 6).map((n) => (
                      <Chip key={n}>{n}</Chip>
                    ))}
                    {cs.names.length > 6 && (
                      <span className="text-[10px] text-zinc-500">
                        +{cs.names.length - 6} more
                      </span>
                    )}
                    {cs.names.length === 0 && (
                      <span className="text-[10px] text-zinc-500">
                        No resources found.
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase text-zinc-500">
                      <Server className="w-3 h-3" />
                      Local Emulator
                    </span>
                    <StatusPill tone={running ? 'emerald' : 'zinc'}>
                      {running ? 'RUNNING' : 'STOPPED'}
                    </StatusPill>
                  </div>
                  <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {em.hostPort}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {fmtUsd(em.localBurnUsdPerHr)}/hr local compute
                  </div>
                </div>
              </div>

              <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
                <Btn
                  variant="primary"
                  icon={GitCompareArrows}
                  onClick={() => handleClone(type)}
                  busy={busy === `clone-${type}`}
                  disabled={!running}
                  title={running ? undefined : 'Start the local emulator first'}
                  featureId="EMU_BTN_CLONE_SCHEMA"
                  ariaLabel={`Clone Cloud Schema to Local Emulator ${meta.short}`}
                >
                  Clone Cloud Schema to Local Emulator
                </Btn>
                {!running && (
                  <span className="text-[10px] text-zinc-500">
                    Start the emulator in Fleet Control first.
                  </span>
                )}
              </div>

              {clone && (
                <div
                  className={`rounded-md border p-2.5 space-y-1 text-[11px] ${
                    clone.ok === false
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-zinc-800 dark:text-zinc-200'
                  }`}
                >
                  <div className="font-semibold">
                    {clone.ok === false ? clone.error : clone.summary}
                  </div>
                  {(clone.clonedItems || []).slice(0, 12).map((it, idx) => (
                    <div key={`${it.kind}-${it.name}-${idx}`} className="font-mono">
                      <Chip>{it.kind}</Chip> {it.name}{' '}
                      <span className="text-zinc-500">{it.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Panel title="FinOps: Local Inner-Loop vs Cloud Dev Instance Burn" icon={DollarSign}>
        <div className="overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-[11px] font-mono">
            <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">
              <tr>
                <th className="text-left px-2.5 py-1.5">Service</th>
                <th className="text-left px-2.5 py-1.5">Local Emulator</th>
                <th className="text-left px-2.5 py-1.5">Cloud Dev Instance (reference)</th>
                <th className="text-left px-2.5 py-1.5">Cloud / 730h month</th>
                <th className="text-left px-2.5 py-1.5">Savings</th>
              </tr>
            </thead>
            <tbody>
              {emulators.map((e) => (
                <tr
                  key={e.emulatorType}
                  className="border-t border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  <td className="px-2.5 py-1.5">{EMULATOR_META[e.emulatorType]?.short}</td>
                  <td className="px-2.5 py-1.5 text-emerald-700 dark:text-emerald-300">
                    {fmtUsd(e.localBurnUsdPerHr)}/hr
                  </td>
                  <td className="px-2.5 py-1.5">{fmtUsd(e.cloudConsoleBurnUsdPerHr)}/hr</td>
                  <td className="px-2.5 py-1.5">
                    {fmtUsd((Number(e.cloudConsoleBurnUsdPerHr) || 0) * 730)}
                  </td>
                  <td className="px-2.5 py-1.5 text-emerald-700 dark:text-emerald-300">
                    {fmtUsd(
                      ((Number(e.cloudConsoleBurnUsdPerHr) || 0) -
                        (Number(e.localBurnUsdPerHr) || 0)) *
                        730
                    )}
                    /mo
                  </td>
                </tr>
              ))}
              <tr className="border-t border-zinc-300 dark:border-zinc-700 font-bold text-zinc-900 dark:text-zinc-100">
                <td className="px-2.5 py-1.5">All 5 services</td>
                <td className="px-2.5 py-1.5 text-emerald-700 dark:text-emerald-300">
                  {fmtUsd(burnTotal)}/hr
                </td>
                <td className="px-2.5 py-1.5">{fmtUsd(cloudBurnTotal)}/hr</td>
                <td className="px-2.5 py-1.5">{fmtUsd(cloudBurnTotal * 730)}</td>
                <td className="px-2.5 py-1.5 text-emerald-700 dark:text-emerald-300">
                  {fmtUsd((cloudBurnTotal - burnTotal) * 730)}/mo
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-[10px] text-zinc-500 leading-relaxed">
          Cloud figures are the reference development-tier hourly burn reported by
          the CloudPulse backend for an always-on dev instance of each service;
          local emulators run on your own machine at <Chip>$0.00/hr</Chip> of
          Google Cloud spend.
        </div>
      </Panel>
    </div>
  );

  /* ============================================================================
   * Tab 4: ENV_AND_LOGS
   * ============================================================================ */

  const envText = (() => {
    if (envFormat === 'bash') return bundle.bash || '';
    if (envFormat === 'dotenv') return bundle.dotenv || '';
    if (envFormat === 'dockerCompose') return bundle.dockerCompose || '';
    return bundle.sdkSnippets?.combined || '';
  })();

  const logsTab = (
    <div className="space-y-3">
      <Panel title="*_EMULATOR_HOST Environment Exporter" icon={FileCode2}>
        <div
          role="tablist"
          aria-label="Environment Export Format"
          className="cp-segmented-menu flex flex-wrap gap-1.5"
        >
          {ENV_FORMATS.map((f) => {
            const isActive = envFormat === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-feature-id={`EMU_FMT_${f.id}`}
                onClick={() => setEnvFormat(f.id)}
                className={`px-3 h-8 rounded-md border text-xs font-mono font-bold cursor-pointer transition ${
                  isActive ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {envFormat === 'sdk' ? (
          <div className="space-y-2">
            {[
              ['Node.js', bundle.sdkSnippets?.nodejs],
              ['Python', bundle.sdkSnippets?.python],
              ['Go', bundle.sdkSnippets?.go],
            ].map(([lang, code]) => (
              <div key={lang} className="space-y-1">
                <div className="text-[10px] font-mono font-bold uppercase text-zinc-500">
                  {lang}
                </div>
                <pre className="max-h-56 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
                  {code || 'No snippet available.'}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <pre className="max-h-72 overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2.5 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
            {envText || 'Environment bundle will appear after the fleet scan completes.'}
          </pre>
        )}

        <div data-action-toolbar="true" className="flex flex-wrap gap-2">
          <Btn
            variant="primary"
            icon={copiedKey === 'env-bundle' ? Check : Copy}
            onClick={() =>
              copy('env-bundle', envText, 'Copied emulator environment bundle.')
            }
            disabled={!envText}
            featureId="EMU_BTN_COPY_ENV_BUNDLE"
          >
            Copy Environment Bundle
          </Btn>
        </div>
      </Panel>

      <Panel
        title="Live Emulator Process Logs (stdout / stderr)"
        icon={Terminal}
        right={
          <label className="flex items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={logsAuto}
              onChange={(e) => setLogsAuto(e.target.checked)}
              className="accent-amber-500"
            />
            Auto-refresh every 3s
          </label>
        }
      >
        <div
          role="tablist"
          aria-label="Emulator Log Selector"
          className="cp-segmented-menu flex flex-wrap gap-1.5"
        >
          {EMULATOR_ORDER.map((type) => {
            const isActive = logType === type;
            const Icon = EMULATOR_META[type].icon;
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-feature-id={`EMU_LOGPILL_${type}`}
                onClick={() => setLogType(type)}
                className={`px-3 h-8 rounded-md border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition ${
                  isActive ? TAB_ACTIVE : TAB_INACTIVE
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{EMULATOR_META[type].short}</span>
              </button>
            );
          })}
        </div>

        <div data-action-toolbar="true" className="flex flex-wrap items-center gap-2">
          <Btn
            icon={RefreshCw}
            busy={logBusy}
            onClick={() => fetchLogs(logType)}
            featureId="EMU_BTN_REFRESH_LOGS"
          >
            Refresh Logs
          </Btn>
          <Btn
            icon={Wifi}
            busy={busy === `probe-${logType}`}
            onClick={() => handleProbe(logType)}
            featureId="EMU_BTN_PROBE_PORT"
            ariaLabel={`Probe TCP Port ${EMULATOR_META[logType].short}`}
          >
            Probe TCP Port
          </Btn>
          {logData && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
              <StatusPill tone={logData.portOpen ? 'emerald' : 'zinc'}>
                {logData.status}
              </StatusPill>
              <span>PID {fmtNum(logData.pid)}</span>
              <span>RSS {fmtNum(logData.rssMb, ' MB')}</span>
              <span>RTT {fmtNum(logData.tcpRttMs, ' ms')}</span>
            </div>
          )}
        </div>

        {probeResults[logType] && (
          <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
            Probe: {probeResults[logType].hostPort}{' '}
            {probeResults[logType].portOpen ? 'open' : 'closed'}, RTT{' '}
            {fmtNum(probeResults[logType].tcpRttMs, ' ms')}
          </div>
        )}

        <pre
          ref={logRef}
          className="h-72 overflow-auto rounded-md border border-zinc-300 dark:border-zinc-800 bg-zinc-950 text-zinc-200 p-2.5 text-[11px] font-mono whitespace-pre-wrap break-all"
        >
          {logData
            ? (logData.lines || []).length > 0
              ? logData.lines.join('\n')
              : 'No output captured yet. Logs appear once this emulator is started from CloudPulse.'
            : 'Loading emulator log buffer...'}
        </pre>
      </Panel>
    </div>
  );

  return (
    <div className="space-y-3">
      {header}
      {activeSubTab === 'FLEET_CONTROL' && fleetTab}
      {activeSubTab === 'LIVE_WORKBENCH' && workbenchTab}
      {activeSubTab === 'CLOUD_SCHEMA_SYNC' && syncTab}
      {activeSubTab === 'ENV_AND_LOGS' && logsTab}
    </div>
  );
}
