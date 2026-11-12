import fs from 'fs';
import path from 'path';
import net from 'net';
import http from 'http';
import https from 'https';
import crypto from 'crypto';
import { execFile, spawn, spawnSync } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';

const execFileAsync = promisify(execFile);

const PROJECT_ID_REGEX = /^[a-z0-9][a-z0-9-]{2,62}$/i;
const FORBIDDEN_PORTS = new Set([22, 80, 443, 4000, 5173]);
const EMULATOR_STATE_ROOT = '/tmp/cloudpulse-emulators';
const MAX_LOG_LINES = 300;

const localHttpAgent = new http.Agent({
  family: 4,
  keepAlive: false,
  timeout: 6000,
});

const cloudHttpsAgent = new https.Agent({
  family: 4,
  autoSelectFamily: false,
  keepAlive: true,
  timeout: 8000,
});

const localHttp = axios.create({
  httpAgent: localHttpAgent,
  timeout: 6000,
  validateStatus: () => true,
});

const cloudHttp = axios.create({
  httpsAgent: cloudHttpsAgent,
  timeout: 6500,
});

export const ALLOWED_SDK_COMPONENTS = new Set([
  'pubsub-emulator',
  'cloud-firestore-emulator',
  'cloud-spanner-emulator',
  'bigtable',
  'cloud-datastore-emulator',
]);

const APT_PACKAGE_BY_COMPONENT = {
  'pubsub-emulator': 'google-cloud-cli-pubsub-emulator',
  'cloud-firestore-emulator': 'google-cloud-cli-firestore-emulator',
  'cloud-spanner-emulator': 'google-cloud-cli-spanner-emulator',
  bigtable: 'google-cloud-cli-bigtable-emulator',
  'cloud-datastore-emulator': 'google-cloud-cli-datastore-emulator',
};

export const EMULATOR_CATALOG = {
  PUBSUB: {
    emulatorType: 'PUBSUB',
    displayName: 'Cloud Pub/Sub Emulator',
    gcloudSubcommand: 'pubsub',
    defaultPort: 8085,
    defaultRestPort: null,
    envVarName: 'PUBSUB_EMULATOR_HOST',
    componentId: 'pubsub-emulator',
    requiresJava25: true,
    dockerImage: 'gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators',
    protocol: 'HTTP/REST v1 + gRPC',
    cloudConsoleBurnUsdPerHr: 0.06,
  },
  FIRESTORE: {
    emulatorType: 'FIRESTORE',
    displayName: 'Cloud Firestore Emulator',
    gcloudSubcommand: 'firestore',
    defaultPort: 8086,
    defaultRestPort: null,
    envVarName: 'FIRESTORE_EMULATOR_HOST',
    componentId: 'cloud-firestore-emulator',
    requiresJava25: true,
    dockerImage: 'gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators',
    protocol: 'HTTP/REST v1 + gRPC',
    cloudConsoleBurnUsdPerHr: 0.09,
  },
  DATASTORE: {
    emulatorType: 'DATASTORE',
    displayName: 'Cloud Datastore Emulator',
    gcloudSubcommand: 'datastore',
    defaultPort: 8081,
    defaultRestPort: null,
    envVarName: 'DATASTORE_EMULATOR_HOST',
    componentId: 'cloud-datastore-emulator',
    requiresJava25: true,
    dockerImage: 'gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators',
    protocol: 'HTTP/REST v1 + gRPC',
    cloudConsoleBurnUsdPerHr: 0.08,
  },
  SPANNER: {
    emulatorType: 'SPANNER',
    displayName: 'Cloud Spanner Emulator',
    gcloudSubcommand: 'spanner',
    defaultPort: 9010,
    defaultRestPort: 9020,
    envVarName: 'SPANNER_EMULATOR_HOST',
    componentId: 'cloud-spanner-emulator',
    requiresJava25: false,
    dockerImage: 'gcr.io/cloud-spanner-emulator/emulator:latest',
    protocol: 'gRPC :9010 + REST :9020',
    cloudConsoleBurnUsdPerHr: 0.9,
  },
  BIGTABLE: {
    emulatorType: 'BIGTABLE',
    displayName: 'Cloud Bigtable Emulator',
    gcloudSubcommand: 'bigtable',
    defaultPort: 8089,
    defaultRestPort: null,
    envVarName: 'BIGTABLE_EMULATOR_HOST',
    componentId: 'bigtable',
    requiresJava25: false,
    dockerImage: 'gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators',
    protocol: 'gRPC (cbt / Client SDK)',
    cloudConsoleBurnUsdPerHr: 0.65,
  },
};

const EMULATOR_ORDER = ['PUBSUB', 'FIRESTORE', 'DATASTORE', 'SPANNER', 'BIGTABLE'];

// Managed runtime registry keyed by emulatorType
const managedRegistry = new Map();
for (const key of EMULATOR_ORDER) {
  const spec = EMULATOR_CATALOG[key];
  managedRegistry.set(key, {
    emulatorType: key,
    port: spec.defaultPort,
    restPort: spec.defaultRestPort,
    runtimeMode: 'GCLOUD_CLI',
    storeOnDisk: false,
    child: null,
    pid: null,
    containerName: `cloudpulse-emu-${key.toLowerCase()}`,
    startedAt: null,
    startedForProject: null,
    dataDir: null,
    lines: [],
    lastError: null,
    exitCode: null,
  });
}

let hostReadinessCache = {
  expiresAt: 0,
  data: null,
  inFlight: null,
};

function sanitizeProjectId(raw) {
  const cleaned = String(raw || '').trim();
  if (!PROJECT_ID_REGEX.test(cleaned)) {
    return null;
  }
  return cleaned;
}

function normalizeEmulatorType(raw) {
  const key = String(raw || '').trim().toUpperCase();
  return EMULATOR_CATALOG[key] ? key : null;
}

function validateLocalPort(rawPort, fallbackPort) {
  if (rawPort === undefined || rawPort === null || rawPort === '') {
    return { ok: true, port: fallbackPort };
  }
  const num = Number(rawPort);
  if (!Number.isInteger(num) || num < 1024 || num > 65535) {
    return {
      ok: false,
      error: `Port ${rawPort} must be an integer between 1024 and 65535.`,
    };
  }
  if (FORBIDDEN_PORTS.has(num)) {
    return {
      ok: false,
      error: `Port ${num} is reserved by CloudPulse backend (:4000), Vite (:5173), or system services.`,
    };
  }
  return { ok: true, port: num };
}

function appendEmulatorLog(entry, streamLabel, chunk) {
  if (!chunk) return;
  const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
  const ts = new Date().toISOString().slice(11, 19);
  const rawLines = text.split(/\r?\n/);
  for (const rawLine of rawLines) {
    const trimmed = rawLine.trimEnd();
    if (!trimmed) continue;
    entry.lines.push(`[${ts}] [${streamLabel}] ${trimmed}`);
    if (entry.lines.length > MAX_LOG_LINES) {
      entry.lines.splice(0, entry.lines.length - MAX_LOG_LINES);
    }
  }
}

async function execFileSafe(cmd, args, timeoutMs = 5000, extraEnv = {}) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, {
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
        ...extraEnv,
      },
    });
    return {
      ok: true,
      stdout: String(stdout || ''),
      stderr: String(stderr || ''),
      code: 0,
    };
  } catch (err) {
    return {
      ok: false,
      stdout: String(err?.stdout || ''),
      stderr: String(err?.stderr || err?.message || ''),
      code: typeof err?.code === 'number' ? err.code : 1,
      errorMessage: err?.message || 'Command execution failed',
    };
  }
}

function probeTcpPort(port, host = '127.0.0.1', timeoutMs = 650) {
  return new Promise((resolve) => {
    if (!port) {
      resolve({ open: false, rttMs: null });
      return;
    }
    const startNs = process.hrtime.bigint();
    const socket = new net.Socket();
    let settled = false;

    const finish = (open) => {
      if (settled) return;
      settled = true;
      const elapsedMs = Number(process.hrtime.bigint() - startNs) / 1e6;
      try {
        socket.destroy();
      } catch {
        // ignore socket cleanup error
      }
      resolve({
        open,
        rttMs: open ? Math.round(elapsedMs * 100) / 100 : null,
      });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    try {
      socket.connect(port, host);
    } catch {
      finish(false);
    }
  });
}

function isPidAlive(pid) {
  if (!pid || !Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function measureProcessRssMb(pid) {
  if (!pid || !isPidAlive(pid)) return null;
  // Sum RSS across the process group (-g) or direct pid (-p) so Java/Go child runtimes are counted accurately
  const pgRes = await execFileSafe('ps', ['-o', 'rss=', '-g', String(pid)], 1500);
  const rawOutput = pgRes.ok && pgRes.stdout.trim()
    ? pgRes.stdout
    : (await execFileSafe('ps', ['-o', 'rss=', '-p', String(pid)], 1500)).stdout;
  if (!rawOutput || !rawOutput.trim()) return null;
  let totalKb = 0;
  for (const token of rawOutput.trim().split(/\s+/)) {
    const kb = Number.parseInt(token, 10);
    if (Number.isFinite(kb) && kb > 0) totalKb += kb;
  }
  if (totalKb <= 0) return null;
  return Math.round((totalKb / 1024) * 10) / 10;
}

async function inspectDockerContainerPid(containerName) {
  const res = await execFileSafe(
    'docker',
    ['inspect', '--format', '{{.State.Running}}:{{.State.Pid}}', containerName],
    2000
  );
  if (!res.ok) return null;
  const trimmed = res.stdout.trim();
  const [runningFlag, pidStr] = trimmed.split(':');
  if (runningFlag !== 'true') return null;
  const pid = Number.parseInt(pidStr, 10);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

async function checkHostReadiness(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && hostReadinessCache.data && now < hostReadinessCache.expiresAt) {
    return hostReadinessCache.data;
  }
  if (!forceRefresh && hostReadinessCache.inFlight) {
    return hostReadinessCache.inFlight;
  }

  hostReadinessCache.inFlight = (async () => {
    const componentFilter =
      'id:(pubsub-emulator OR cloud-firestore-emulator OR cloud-spanner-emulator OR bigtable OR cloud-datastore-emulator)';

    const [gcloudVerRes, gcloudCompRes, javaRes, dockerRes] = await Promise.all([
      execFileSafe('gcloud', ['--version'], 5000),
      execFileSafe(
        'gcloud',
        ['components', 'list', `--filter=${componentFilter}`, '--format=json'],
        7000
      ),
      execFileSafe('java', ['-version'], 3500),
      execFileSafe('docker', ['info', '--format', '{{json .ServerVersion}}'], 4000),
    ]);

    const gcloudCombined = `${gcloudVerRes.stdout}\n${gcloudVerRes.stderr}`;
    const sdkMatch = gcloudCombined.match(/Google Cloud SDK\s+([0-9.]+)/i);
    const gcloudInstalled = gcloudVerRes.ok || Boolean(sdkMatch);
    const gcloudVersion = sdkMatch ? sdkMatch[1] : null;

    // java -version writes to stderr on OpenJDK/Oracle JDK
    const javaCombined = `${javaRes.stderr}\n${javaRes.stdout}`.trim();
    const javaVerMatch =
      javaCombined.match(/version\s+"([^"]+)"/i) ||
      javaCombined.match(/openjdk\s+([0-9.]+)/i);
    const javaInstalled = javaRes.ok && Boolean(javaVerMatch || javaCombined);
    const javaVersion = javaVerMatch
      ? javaVerMatch[1]
      : javaInstalled
        ? javaCombined.split(/\r?\n/)[0].slice(0, 64)
        : null;
    let javaMajorVersion = null;
    if (javaVersion) {
      const parts = javaVersion.split('.');
      const first = Number.parseInt(parts[0], 10);
      if (first === 1 && parts[1]) {
        javaMajorVersion = Number.parseInt(parts[1], 10) || 1;
      } else if (Number.isFinite(first)) {
        javaMajorVersion = first;
      }
    }
    const java25Ready = Boolean(javaMajorVersion && javaMajorVersion >= 25);

    let dockerAvailable = false;
    let dockerVersion = null;
    if (dockerRes.ok && dockerRes.stdout.trim()) {
      const cleaned = dockerRes.stdout.trim().replace(/^"|"$/g, '');
      if (cleaned && cleaned !== 'null' && !/cannot connect|daemon/i.test(cleaned)) {
        dockerAvailable = true;
        dockerVersion = cleaned;
      }
    }

    const componentsById = {};
    const componentsList = [];
    if (gcloudCompRes.stdout && gcloudCompRes.stdout.trim()) {
      try {
        const jsonStart = gcloudCompRes.stdout.indexOf('[');
        const parsed = JSON.parse(
          jsonStart >= 0 ? gcloudCompRes.stdout.slice(jsonStart) : gcloudCompRes.stdout
        );
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (!item?.id) continue;
            const stateName = item?.state?.name || 'Unknown';
            const installed = /installed/i.test(stateName) && !/not installed/i.test(stateName);
            const normalized = {
              id: item.id,
              name: item.name || item.id,
              installed,
              state: stateName,
              version: item.current_version_string || null,
              latestVersion: item.latest_version_string || null,
              sizeBytes: typeof item.size === 'number' ? item.size : null,
            };
            componentsById[item.id] = normalized;
            componentsList.push(normalized);
          }
        }
      } catch {
        // Fallback parse from gcloud --version lines if JSON failed
      }
    }

    // Fallback check against gcloud --version lines for installed components
    for (const compId of ALLOWED_SDK_COMPONENTS) {
      if (!componentsById[compId]) {
        const lineMatch = gcloudCombined.match(
          new RegExp(`^${compId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+([0-9.]+)`, 'm')
        );
        const installed = Boolean(lineMatch);
        const fallbackObj = {
          id: compId,
          name: compId,
          installed,
          state: installed ? 'Installed' : 'Not Installed',
          version: lineMatch ? lineMatch[1] : null,
          latestVersion: null,
          sizeBytes: null,
        };
        componentsById[compId] = fallbackObj;
        componentsList.push(fallbackObj);
      }
    }

    const result = {
      gcloudInstalled,
      gcloudVersion,
      javaInstalled,
      javaVersion,
      javaMajorVersion,
      java25Ready,
      dockerAvailable,
      dockerVersion,
      components: componentsList,
      componentsById,
      checkedAt: new Date().toISOString(),
    };

    hostReadinessCache = {
      expiresAt: Date.now() + 12000,
      data: result,
      inFlight: null,
    };
    return result;
  })();

  try {
    return await hostReadinessCache.inFlight;
  } finally {
    hostReadinessCache.inFlight = null;
  }
}

async function buildEmulatorStatusItem(emulatorType, hostReadiness, projectId) {
  const spec = EMULATOR_CATALOG[emulatorType];
  const entry = managedRegistry.get(emulatorType);
  const port = entry.port || spec.defaultPort;
  const restPort = spec.emulatorType === 'SPANNER' ? entry.restPort || spec.defaultRestPort : null;

  const [primaryProbe, restProbe] = await Promise.all([
    probeTcpPort(port),
    restPort ? probeTcpPort(restPort) : Promise.resolve({ open: false, rttMs: null }),
  ]);

  const portOpen =
    spec.emulatorType === 'SPANNER'
      ? Boolean(primaryProbe.open || restProbe.open)
      : Boolean(primaryProbe.open);

  let effectivePid = entry.pid && isPidAlive(entry.pid) ? entry.pid : null;
  if (!effectivePid && portOpen && entry.runtimeMode === 'DOCKER') {
    effectivePid = await inspectDockerContainerPid(entry.containerName);
  }
  const rssMb = effectivePid ? await measureProcessRssMb(effectivePid) : null;
  const uptimeSec =
    portOpen && entry.startedAt
      ? Math.max(0, Math.round((Date.now() - new Date(entry.startedAt).getTime()) / 1000))
      : null;

  const compMeta = hostReadiness?.componentsById?.[spec.componentId] || null;
  const componentInstalled = Boolean(compMeta?.installed);
  const javaSatisfied = !spec.requiresJava25 || Boolean(hostReadiness?.java25Ready);

  let installHint = null;
  if (!componentInstalled) {
    installHint = `gcloud components install ${spec.componentId} --quiet`;
  } else if (spec.requiresJava25 && !javaSatisfied) {
    installHint =
      'Requires OpenJDK 25+ JRE for GCLOUD_CLI mode (sudo apt-get install -y openjdk-25-jre-headless) or run via DOCKER mode.';
  }

  return {
    emulatorType: spec.emulatorType,
    displayName: spec.displayName,
    protocol: spec.protocol,
    status: portOpen ? 'RUNNING' : 'STOPPED',
    readinessState: portOpen
      ? 'RUNNING'
      : !componentInstalled
        ? 'SDK_COMPONENT_MISSING'
        : !javaSatisfied
          ? 'JAVA_25_REQUIRED_OR_DOCKER'
          : 'READY',
    port,
    restPort,
    hostPort: `127.0.0.1:${port}`,
    restHostPort: restPort ? `127.0.0.1:${restPort}` : null,
    portOpen,
    restPortOpen: restPort ? Boolean(restProbe.open) : null,
    tcpRttMs: primaryProbe.rttMs ?? restProbe.rttMs ?? null,
    restTcpRttMs: restPort ? restProbe.rttMs : null,
    pid: effectivePid,
    rssMb,
    uptimeSec,
    startedAt: portOpen ? entry.startedAt : null,
    startedForProject: portOpen ? entry.startedForProject || projectId : null,
    runtimeMode: entry.runtimeMode || 'GCLOUD_CLI',
    storeOnDisk: Boolean(entry.storeOnDisk),
    envVarName: spec.envVarName,
    envVarValue: `127.0.0.1:${port}`,
    componentId: spec.componentId,
    componentInstalled,
    componentVersion: compMeta?.version || null,
    requiresJava25: spec.requiresJava25,
    javaRuntimeSatisfied: javaSatisfied,
    installHint,
    dockerImage: spec.dockerImage,
    cloudConsoleBurnUsdPerHr: spec.cloudConsoleBurnUsdPerHr,
    localBurnUsdPerHr: 0,
    lastError: entry.lastError || null,
  };
}

function extractShortId(fullName) {
  if (!fullName) return '';
  const parts = String(fullName).split('/');
  return parts[parts.length - 1] || String(fullName);
}

async function fetchLiveCloudAssets(projectId, getLocalOrMetadataAccessToken) {
  const empty = {
    pubsubTopics: [],
    pubsubSubscriptions: [],
    firestoreDatabases: [],
    spannerInstances: [],
    bigtableInstances: [],
    counts: {
      pubsubTopics: 0,
      pubsubSubscriptions: 0,
      firestoreDatabases: 0,
      spannerInstances: 0,
      bigtableInstances: 0,
    },
    apiStatus: {
      pubsub: 'UNAUTHENTICATED',
      firestore: 'UNAUTHENTICATED',
      spanner: 'UNAUTHENTICATED',
      bigtable: 'UNAUTHENTICATED',
    },
  };

  if (typeof getLocalOrMetadataAccessToken !== 'function') {
    return empty;
  }

  let token = null;
  try {
    const authObj = await getLocalOrMetadataAccessToken();
    token = authObj?.token || null;
  } catch {
    token = null;
  }
  if (!token) return empty;

  const headers = { Authorization: `Bearer ${token}` };
  const safeGet = async (url) => {
    try {
      const res = await cloudHttp.get(url, { headers });
      return { ok: true, data: res.data, status: res.status };
    } catch (err) {
      const status = err?.response?.status || 0;
      const msg = err?.response?.data?.error?.message || err?.message || 'API error';
      return {
        ok: false,
        status,
        disabled: status === 403 && /has not been used|disabled/i.test(msg),
        error: msg,
      };
    }
  };

  const [topicsRes, subsRes, firestoreRes, spannerRes, bigtableRes] = await Promise.all([
    safeGet(
      `https://pubsub.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/topics?pageSize=100`
    ),
    safeGet(
      `https://pubsub.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/subscriptions?pageSize=100`
    ),
    safeGet(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases`
    ),
    safeGet(
      `https://spanner.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/instances?pageSize=50`
    ),
    safeGet(
      `https://bigtableadmin.googleapis.com/v2/projects/${encodeURIComponent(projectId)}/instances`
    ),
  ]);

  const pubsubTopics = (topicsRes.ok ? topicsRes.data?.topics || [] : []).map((t) => ({
    name: extractShortId(t.name),
    shortName: extractShortId(t.name),
    fullName: t.name,
    kmsKeyName: t.kmsKeyName || null,
  }));

  const pubsubSubscriptions = (subsRes.ok ? subsRes.data?.subscriptions || [] : []).map((s) => ({
    name: extractShortId(s.name),
    shortName: extractShortId(s.name),
    fullName: s.name,
    topic: s.topic || null,
    topicShortName: extractShortId(s.topic),
    ackDeadlineSeconds: s.ackDeadlineSeconds || 10,
    pushEndpoint: s.pushConfig?.pushEndpoint || null,
  }));

  const firestoreDatabases = (firestoreRes.ok ? firestoreRes.data?.databases || [] : []).map(
    (db) => ({
      name: extractShortId(db.name),
      shortName: extractShortId(db.name),
      fullName: db.name,
      locationId: db.locationId || null,
      type: db.type || 'FIRESTORE_NATIVE',
      uid: db.uid || null,
    })
  );

  const spannerInstances = (spannerRes.ok ? spannerRes.data?.instances || [] : []).map((inst) => ({
    name: extractShortId(inst.name),
    shortName: extractShortId(inst.name),
    fullName: inst.name,
    displayName: inst.displayName || extractShortId(inst.name),
    config: extractShortId(inst.config),
    nodeCount: inst.nodeCount || null,
    processingUnits: inst.processingUnits || null,
    state: inst.state || null,
  }));

  const bigtableInstances = (bigtableRes.ok ? bigtableRes.data?.instances || [] : []).map(
    (inst) => ({
      name: extractShortId(inst.name),
      shortName: extractShortId(inst.name),
      fullName: inst.name,
      displayName: inst.displayName || extractShortId(inst.name),
      type: inst.type || null,
      state: inst.state || null,
    })
  );

  const classifyStatus = (r) =>
    r.ok ? 'ENABLED' : r.disabled ? 'API_DISABLED' : r.status === 403 ? 'PERMISSION_DENIED' : 'UNAVAILABLE';

  return {
    pubsubTopics,
    pubsubSubscriptions,
    firestoreDatabases,
    spannerInstances,
    bigtableInstances,
    counts: {
      pubsubTopics: pubsubTopics.length,
      pubsubSubscriptions: pubsubSubscriptions.length,
      firestoreDatabases: firestoreDatabases.length,
      spannerInstances: spannerInstances.length,
      bigtableInstances: bigtableInstances.length,
    },
    apiStatus: {
      pubsub: classifyStatus(topicsRes),
      firestore: classifyStatus(firestoreRes),
      spanner: classifyStatus(spannerRes),
      bigtable: classifyStatus(bigtableRes),
    },
  };
}

function buildEnvExportBundle(projectId, emulators) {
  const byType = Object.fromEntries(emulators.map((e) => [e.emulatorType, e]));
  const anyRunning = emulators.some((e) => e.status === 'RUNNING');

  const bashLines = [
    `# CloudPulse Local Emulator Environment (${projectId})`,
    `export GOOGLE_CLOUD_PROJECT="${projectId}"`,
    `export GCLOUD_PROJECT="${projectId}"`,
  ];
  const dotenvLines = [
    `# CloudPulse Local Emulator .env (${projectId})`,
    `GOOGLE_CLOUD_PROJECT=${projectId}`,
    `GCLOUD_PROJECT=${projectId}`,
  ];

  for (const e of emulators) {
    const isRunning = e.status === 'RUNNING';
    if (!anyRunning || isRunning) {
      bashLines.push(`export ${e.envVarName}="${e.envVarValue}" # ${e.status}`);
      dotenvLines.push(`${e.envVarName}=${e.envVarValue}`);
    } else {
      bashLines.push(`# export ${e.envVarName}="${e.envVarValue}" # STOPPED`);
      dotenvLines.push(`# ${e.envVarName}=${e.envVarValue}`);
    }
  }

  const psPort = byType.PUBSUB?.port || 8085;
  const fsPort = byType.FIRESTORE?.port || 8086;
  const dsPort = byType.DATASTORE?.port || 8081;
  const spGrpc = byType.SPANNER?.port || 9010;
  const spRest = byType.SPANNER?.restPort || 9020;
  const btPort = byType.BIGTABLE?.port || 8089;

  const dockerCompose = [
    `# docker-compose.emulators.yml — $0.00/hr Local GCP Parity Suite (${projectId})`,
    `services:`,
    `  pubsub-emulator:`,
    `    image: gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators`,
    `    command: gcloud beta emulators pubsub start --project=${projectId} --host-port=0.0.0.0:${psPort} --quiet`,
    `    ports:`,
    `      - "127.0.0.1:${psPort}:${psPort}"`,
    `  firestore-emulator:`,
    `    image: gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators`,
    `    command: gcloud beta emulators firestore start --project=${projectId} --host-port=0.0.0.0:${fsPort} --quiet`,
    `    ports:`,
    `      - "127.0.0.1:${fsPort}:${fsPort}"`,
    `  datastore-emulator:`,
    `    image: gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators`,
    `    command: gcloud beta emulators datastore start --project=${projectId} --host-port=0.0.0.0:${dsPort} --consistency=1.0 --no-store-on-disk --quiet`,
    `    ports:`,
    `      - "127.0.0.1:${dsPort}:${dsPort}"`,
    `  spanner-emulator:`,
    `    image: gcr.io/cloud-spanner-emulator/emulator:latest`,
    `    ports:`,
    `      - "127.0.0.1:${spGrpc}:9010"`,
    `      - "127.0.0.1:${spRest}:9020"`,
    `  bigtable-emulator:`,
    `    image: gcr.io/google.com/cloudsdktool/google-cloud-cli:emulators`,
    `    command: gcloud beta emulators bigtable start --project=${projectId} --host-port=0.0.0.0:${btPort} --quiet`,
    `    ports:`,
    `      - "127.0.0.1:${btPort}:${btPort}"`,
  ].join('\n');

  const nodejsSnippet = [
    `// Node.js — Official @google-cloud/* SDKs auto-detect *_EMULATOR_HOST`,
    `process.env.GOOGLE_CLOUD_PROJECT = '${projectId}';`,
    `process.env.PUBSUB_EMULATOR_HOST = '127.0.0.1:${psPort}';`,
    `process.env.DATASTORE_EMULATOR_HOST = '127.0.0.1:${dsPort}';`,
    `process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:${fsPort}';`,
    `process.env.SPANNER_EMULATOR_HOST = '127.0.0.1:${spGrpc}';`,
    `process.env.BIGTABLE_EMULATOR_HOST = '127.0.0.1:${btPort}';`,
    ``,
    `import { PubSub } from '@google-cloud/pubsub';`,
    `import { Datastore } from '@google-cloud/datastore';`,
    `const pubsub = new PubSub({ projectId: '${projectId}' });`,
    `const datastore = new Datastore({ projectId: '${projectId}' });`,
  ].join('\n');

  const pythonSnippet = [
    `# Python — google-cloud-* client libraries auto-bind to *_EMULATOR_HOST`,
    `import os`,
    `os.environ["GOOGLE_CLOUD_PROJECT"] = "${projectId}"`,
    `os.environ["PUBSUB_EMULATOR_HOST"] = "127.0.0.1:${psPort}"`,
    `os.environ["DATASTORE_EMULATOR_HOST"] = "127.0.0.1:${dsPort}"`,
    `os.environ["FIRESTORE_EMULATOR_HOST"] = "127.0.0.1:${fsPort}"`,
    `os.environ["SPANNER_EMULATOR_HOST"] = "127.0.0.1:${spGrpc}"`,
    `os.environ["BIGTABLE_EMULATOR_HOST"] = "127.0.0.1:${btPort}"`,
    ``,
    `from google.cloud import pubsub_v1, datastore`,
    `publisher = pubsub_v1.PublisherClient()`,
    `ds_client = datastore.Client(project="${projectId}")`,
  ].join('\n');

  const goSnippet = [
    `// Go — cloud.google.com/go/* honours *_EMULATOR_HOST automatically`,
    `package main`,
    ``,
    `import (`,
    `\t"context"`,
    `\t"os"`,
    `\t"cloud.google.com/go/pubsub"`,
    `)`,
    ``,
    `func connectLocalEmulator(ctx context.Context) (*pubsub.Client, error) {`,
    `\t_ = os.Setenv("PUBSUB_EMULATOR_HOST", "127.0.0.1:${psPort}")`,
    `\t_ = os.Setenv("SPANNER_EMULATOR_HOST", "127.0.0.1:${spGrpc}")`,
    `\treturn pubsub.NewClient(ctx, "${projectId}")`,
    `}`,
  ].join('\n');

  return {
    bash: bashLines.join('\n'),
    dotenv: dotenvLines.join('\n'),
    dockerCompose,
    sdkSnippets: {
      nodejs: nodejsSnippet,
      python: pythonSnippet,
      go: goSnippet,
      combined: `${nodejsSnippet}\n\n${pythonSnippet}\n\n${goSnippet}`,
    },
  };
}

function buildSpawnCommandAndArgs({
  emulatorType,
  projectId,
  port,
  restPort,
  runtimeMode,
  storeOnDisk,
  dataDir,
  containerName,
}) {
  const spec = EMULATOR_CATALOG[emulatorType];
  if (runtimeMode === 'DOCKER') {
    if (emulatorType === 'SPANNER') {
      return {
        cmd: 'docker',
        args: [
          'run',
          '--rm',
          '--name',
          containerName,
          '-p',
          `127.0.0.1:${port}:9010`,
          '-p',
          `127.0.0.1:${restPort}:9020`,
          spec.dockerImage,
        ],
      };
    }

    const innerArgs = [
      'gcloud',
      'beta',
      'emulators',
      spec.gcloudSubcommand,
      'start',
      `--project=${projectId}`,
      `--host-port=0.0.0.0:${port}`,
    ];
    if (emulatorType === 'DATASTORE') {
      innerArgs.push('--consistency=1.0');
      innerArgs.push(storeOnDisk ? '--store-on-disk' : '--no-store-on-disk');
    }
    innerArgs.push('--quiet');

    return {
      cmd: 'docker',
      args: [
        'run',
        '--rm',
        '--name',
        containerName,
        '-p',
        `127.0.0.1:${port}:${port}`,
        spec.dockerImage,
        ...innerArgs,
      ],
    };
  }

  // Default: GCLOUD_CLI mode
  const args = ['beta', 'emulators', spec.gcloudSubcommand, 'start', `--project=${projectId}`];
  if (emulatorType === 'PUBSUB') {
    args.push(`--host-port=127.0.0.1:${port}`, `--data-dir=${dataDir}`);
  } else if (emulatorType === 'FIRESTORE') {
    args.push(`--host-port=127.0.0.1:${port}`);
    if (storeOnDisk) {
      args.push(`--export-on-exit=${path.join(dataDir, 'firestore-export')}`);
    }
  } else if (emulatorType === 'DATASTORE') {
    args.push(
      `--host-port=127.0.0.1:${port}`,
      `--data-dir=${dataDir}`,
      '--consistency=1.0',
      storeOnDisk ? '--store-on-disk' : '--no-store-on-disk'
    );
  } else if (emulatorType === 'SPANNER') {
    args.push(`--host-port=127.0.0.1:${port}`, `--rest-port=${restPort}`);
  } else if (emulatorType === 'BIGTABLE') {
    args.push(`--host-port=127.0.0.1:${port}`);
  }
  args.push('--quiet');

  return { cmd: 'gcloud', args };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killProcessGroupSafe(pid, signal) {
  if (!pid || !Number.isInteger(pid) || pid <= 0) return;
  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      // already exited
    }
  }
}

async function stopSingleEmulator(emulatorType) {
  const spec = EMULATOR_CATALOG[emulatorType];
  const entry = managedRegistry.get(emulatorType);
  const previousPid = entry.pid;
  const targetPort = entry.port || spec.defaultPort;

  if (previousPid && isPidAlive(previousPid)) {
    killProcessGroupSafe(previousPid, 'SIGTERM');
  }

  if (entry.runtimeMode === 'DOCKER' || entry.containerName) {
    await execFileSafe('docker', ['rm', '-f', entry.containerName], 3500);
  }

  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    const alive = previousPid ? isPidAlive(previousPid) : false;
    const probe = await probeTcpPort(targetPort, '127.0.0.1', 300);
    if (!alive && !probe.open) break;
    await sleep(150);
  }

  if (previousPid && isPidAlive(previousPid)) {
    killProcessGroupSafe(previousPid, 'SIGKILL');
    await sleep(250);
  }

  const finalProbe = await probeTcpPort(targetPort, '127.0.0.1', 350);
  entry.child = null;
  entry.pid = null;
  entry.startedAt = null;
  appendEmulatorLog(
    entry,
    'lifecycle',
    `Stopped ${spec.displayName} on 127.0.0.1:${targetPort} (portReleased=${!finalProbe.open}).`
  );

  return {
    emulatorType,
    previousPid: previousPid || null,
    port: targetPort,
    portReleased: !finalProbe.open,
  };
}

async function startSingleEmulator({
  projectId,
  emulatorType,
  port,
  restPort,
  runtimeMode = 'GCLOUD_CLI',
  storeOnDisk = false,
}) {
  const spec = EMULATOR_CATALOG[emulatorType];
  const entry = managedRegistry.get(emulatorType);
  const normalizedMode = String(runtimeMode || 'GCLOUD_CLI').toUpperCase() === 'DOCKER'
    ? 'DOCKER'
    : 'GCLOUD_CLI';

  const portCheck = validateLocalPort(port, entry.port || spec.defaultPort);
  if (!portCheck.ok) {
    return { httpStatus: 400, payload: { ok: false, error: portCheck.error } };
  }
  const targetPort = portCheck.port;

  let targetRestPort = null;
  if (emulatorType === 'SPANNER') {
    const restCheck = validateLocalPort(restPort, entry.restPort || spec.defaultRestPort);
    if (!restCheck.ok) {
      return { httpStatus: 400, payload: { ok: false, error: restCheck.error } };
    }
    if (restCheck.port === targetPort) {
      return {
        httpStatus: 400,
        payload: {
          ok: false,
          error: `Spanner gRPC port (${targetPort}) and REST port (${restCheck.port}) must be distinct.`,
        },
      };
    }
    targetRestPort = restCheck.port;
  }

  // Check if already running on target port
  const existingProbe = await probeTcpPort(targetPort);
  if (existingProbe.open && entry.pid && isPidAlive(entry.pid) && entry.port === targetPort) {
    const hostReadiness = await checkHostReadiness(false);
    const emulator = await buildEmulatorStatusItem(emulatorType, hostReadiness, projectId);
    return {
      httpStatus: 200,
      payload: {
        ok: true,
        alreadyRunning: true,
        projectId,
        emulatorType,
        emulator,
      },
    };
  }
  if (existingProbe.open) {
    return {
      httpStatus: 409,
      payload: {
        ok: false,
        error: `TCP port 127.0.0.1:${targetPort} is already bound by another local process. Choose another port or stop the conflicting process.`,
      },
    };
  }

  // Stop any stale process we previously tracked for this emulator
  if (entry.pid && isPidAlive(entry.pid)) {
    await stopSingleEmulator(emulatorType);
  }

  const hostReadiness = await checkHostReadiness(false);
  if (normalizedMode === 'DOCKER') {
    if (!hostReadiness.dockerAvailable) {
      return {
        httpStatus: 422,
        payload: {
          ok: false,
          emulatorType,
          runtimeMode: normalizedMode,
          error: 'Docker Engine is not available or not running on this host.',
          stderrTail: 'docker info failed to connect to local Docker daemon.',
          installCommand: 'sudo systemctl start docker',
          manualInstallCmd: 'sudo systemctl start docker',
        },
      };
    }
    await execFileSafe('docker', ['rm', '-f', entry.containerName], 3500);
  }

  const dataDir = path.join(EMULATOR_STATE_ROOT, `${emulatorType.toLowerCase()}-${projectId}`);
  fs.mkdirSync(dataDir, { recursive: true });

  const { cmd, args } = buildSpawnCommandAndArgs({
    emulatorType,
    projectId,
    port: targetPort,
    restPort: targetRestPort,
    runtimeMode: normalizedMode,
    storeOnDisk: Boolean(storeOnDisk),
    dataDir,
    containerName: entry.containerName,
  });

  entry.port = targetPort;
  entry.restPort = targetRestPort;
  entry.runtimeMode = normalizedMode;
  entry.storeOnDisk = Boolean(storeOnDisk);
  entry.dataDir = dataDir;
  entry.lastError = null;
  entry.exitCode = null;
  const startLogIndex = entry.lines.length;
  appendEmulatorLog(entry, 'cmd', `${cmd} ${args.join(' ')}`);

  let child;
  try {
    child = spawn(cmd, args, {
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CLOUDSDK_CORE_DISABLE_PROMPTS: '1',
      },
    });
  } catch (spawnErr) {
    const errMsg = spawnErr?.message || `Failed to spawn ${cmd}`;
    entry.lastError = errMsg;
    return {
      httpStatus: 422,
      payload: {
        ok: false,
        emulatorType,
        runtimeMode: normalizedMode,
        error: errMsg,
        stderrTail: errMsg,
        installCommand: `gcloud components install ${spec.componentId} --quiet`,
        manualInstallCmd: `gcloud components install ${spec.componentId} --quiet`,
      },
    };
  }

  entry.child = child;
  entry.pid = child.pid || null;
  entry.startedAt = new Date().toISOString();
  entry.startedForProject = projectId;

  let exitedEarly = false;
  let spawnErrorObj = null;

  child.stdout?.on('data', (chunk) => appendEmulatorLog(entry, 'stdout', chunk));
  child.stderr?.on('data', (chunk) => appendEmulatorLog(entry, 'stderr', chunk));
  child.once('error', (err) => {
    spawnErrorObj = err;
    exitedEarly = true;
    appendEmulatorLog(entry, 'error', err?.message || String(err));
  });
  child.once('exit', (code, signal) => {
    exitedEarly = true;
    entry.exitCode = code;
    if (entry.pid === child.pid) {
      entry.pid = null;
      entry.child = null;
    }
    appendEmulatorLog(
      entry,
      'exit',
      `Process exited (code=${code ?? 'null'}, signal=${signal ?? 'none'})`
    );
  });
  child.unref();

  const waitWindowMs = normalizedMode === 'DOCKER' ? 20000 : 8000;
  const pollDeadline = Date.now() + waitWindowMs;
  let ready = false;

  while (Date.now() < pollDeadline) {
    if (exitedEarly) break;
    const primary = await probeTcpPort(targetPort, '127.0.0.1', 350);
    if (primary.open) {
      if (emulatorType === 'SPANNER' && targetRestPort) {
        const rest = await probeTcpPort(targetRestPort, '127.0.0.1', 350);
        if (rest.open) {
          // The REST gateway opens its TCP port before it serves HTTP; require a real HTTP 200.
          try {
            const httpProbe = await localHttp.get(
              `http://127.0.0.1:${targetRestPort}/v1/projects/${encodeURIComponent(projectId)}/instances`,
              { timeout: 1500 }
            );
            if (httpProbe.status === 200) {
              ready = true;
              break;
            }
          } catch {
            // gateway not serving HTTP yet; keep polling
          }
        }
      } else {
        ready = true;
        break;
      }
    }
    await sleep(250);
  }

  if (!ready) {
    const currentRunLines = entry.lines.slice(startLogIndex);
    const recentTail = currentRunLines.slice(-20).join('\n');
    // Clean up any half-started process or pulling Docker container so zero orphans leak
    if (child.pid && isPidAlive(child.pid)) {
      killProcessGroupSafe(child.pid, 'SIGTERM');
      await sleep(200);
      if (isPidAlive(child.pid)) killProcessGroupSafe(child.pid, 'SIGKILL');
    }
    if (normalizedMode === 'DOCKER') {
      await execFileSafe('docker', ['rm', '-f', entry.containerName], 3500);
    }
    entry.pid = null;
    entry.child = null;
    entry.startedAt = null;

    const diagnosis = diagnoseStartupFailure({
      spec,
      runtimeMode: normalizedMode,
      stderrTail: recentTail,
      spawnErrorObj,
      hostReadiness,
    });
    entry.lastError = diagnosis.error;

    return {
      httpStatus: 422,
      payload: {
        ok: false,
        emulatorType,
        runtimeMode: normalizedMode,
        error: diagnosis.error,
        stderrTail: recentTail || diagnosis.error,
        lines: currentRunLines.slice(-40),
        installCommand: diagnosis.installCommand,
        manualInstallCmd: diagnosis.installCommand,
      },
    };
  }

  const refreshedReadiness = await checkHostReadiness(false);
  const emulator = await buildEmulatorStatusItem(emulatorType, refreshedReadiness, projectId);
  return {
    httpStatus: 200,
    payload: {
      ok: true,
      projectId,
      emulatorType,
      runtimeMode: normalizedMode,
      message: `${spec.displayName} is listening on 127.0.0.1:${targetPort}.`,
      emulator,
    },
  };
}

function diagnoseStartupFailure({ spec, runtimeMode, stderrTail, spawnErrorObj, hostReadiness }) {
  const combined = `${stderrTail || ''}\n${spawnErrorObj?.message || ''}`;

  if (runtimeMode === 'DOCKER') {
    if (
      /Unable to find image|Pulling from|Downloading|Pulling fs layer|Waiting|Verifying Checksum/i.test(
        combined
      )
    ) {
      return {
        error: `Docker image "${spec.dockerImage}" is not cached locally yet and exceeded the interactive startup window. Pre-pull the image first, then start the emulator.`,
        installCommand: `docker pull ${spec.dockerImage}`,
      };
    }

    const dockerConcise =
      combined
        .split(/\r?\n/)
        .map((l) => l.replace(/^\[[^\]]+\]\s*\[[^\]]+\]\s*/, '').trim())
        .filter((l) => /docker:|ERROR:|Error response from daemon|failed/i.test(l))
        .pop() || `${spec.displayName} container failed to open TCP port within startup window.`;

    return {
      error: dockerConcise,
      installCommand: `docker pull ${spec.dockerImage}`,
    };
  }

  if (runtimeMode === 'GCLOUD_CLI' && /Java\s*25\+|not a Java 25|Java .* JRE/i.test(combined)) {
    return {
      error: `${spec.displayName} on Google Cloud SDK ${hostReadiness?.gcloudVersion || 'latest'} requires a Java 25+ JRE on PATH (detected Java ${hostReadiness?.javaVersion || 'none'}), or switch Runtime Mode to DOCKER.`,
      installCommand: `sudo apt-get update && sudo apt-get install -y openjdk-25-jre-headless`,
    };
  }

  if (
    runtimeMode === 'GCLOUD_CLI' &&
    /java.*not found|No Java runtime|executable.*java/i.test(combined)
  ) {
    return {
      error: `${spec.displayName} requires an OpenJDK JRE runtime installed on PATH, or run in DOCKER mode.`,
      installCommand: `sudo apt-get update && sudo apt-get install -y openjdk-25-jre-headless`,
    };
  }

  if (
    runtimeMode === 'GCLOUD_CLI' &&
    (/do not currently have this command group installed|component.*not installed|components install/i.test(
      combined
    ) ||
      !hostReadiness?.componentsById?.[spec.componentId]?.installed)
  ) {
    return {
      error: `Google Cloud SDK component "${spec.componentId}" is not installed on this host. Install the component or switch Runtime Mode to DOCKER.`,
      installCommand: `gcloud components install ${spec.componentId} --quiet`,
    };
  }

  const concise =
    combined
      .split(/\r?\n/)
      .map((l) => l.replace(/^\[[^\]]+\]\s*\[[^\]]+\]\s*/, '').trim())
      .filter((l) => /ERROR:|Exception|Error|failed/i.test(l))
      .pop() || `${spec.displayName} failed to open TCP port within startup window.`;

  return {
    error: concise,
    installCommand: `gcloud components install ${spec.componentId} --quiet`,
  };
}

// ============================================================================
// Datastore & Firestore JSON <-> Typed Value Marshalling
// ============================================================================
function jsToDatastoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((v) => jsToDatastoreValue(v)) } };
  }
  if (typeof val === 'object') {
    const properties = {};
    for (const [k, v] of Object.entries(val)) {
      properties[k] = jsToDatastoreValue(v);
    }
    return { entityValue: { properties } };
  }
  return { stringValue: String(val) };
}

function datastoreValueToJs(v) {
  if (!v || typeof v !== 'object') return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('integerValue' in v) {
    const n = Number(v.integerValue);
    return Number.isSafeInteger(n) ? n : String(v.integerValue);
  }
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) {
    return (v.arrayValue?.values || []).map((item) => datastoreValueToJs(item));
  }
  if ('entityValue' in v) {
    const out = {};
    for (const [k, propVal] of Object.entries(v.entityValue?.properties || {})) {
      out[k] = datastoreValueToJs(propVal);
    }
    return out;
  }
  return v;
}

function formatDatastoreEntity(entity) {
  const pathArr = entity?.key?.path || [];
  const leaf = pathArr[pathArr.length - 1] || {};
  const data = {};
  for (const [k, v] of Object.entries(entity?.properties || {})) {
    data[k] = datastoreValueToJs(v);
  }
  return {
    kind: leaf.kind || null,
    keyName: leaf.name || null,
    keyId: leaf.id || null,
    path: pathArr,
    data,
  };
}

function jsToFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map((v) => jsToFirestoreValue(v)) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = jsToFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function firestoreValueToJs(v) {
  if (!v || typeof v !== 'object') return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('integerValue' in v) {
    const n = Number(v.integerValue);
    return Number.isSafeInteger(n) ? n : String(v.integerValue);
  }
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) {
    return (v.arrayValue?.values || []).map((item) => firestoreValueToJs(item));
  }
  if ('mapValue' in v) {
    const out = {};
    for (const [k, fv] of Object.entries(v.mapValue?.fields || {})) {
      out[k] = firestoreValueToJs(fv);
    }
    return out;
  }
  return v;
}

function formatFirestoreDocument(doc) {
  const data = {};
  for (const [k, v] of Object.entries(doc?.fields || {})) {
    data[k] = firestoreValueToJs(v);
  }
  return {
    name: doc?.name || '',
    documentId: extractShortId(doc?.name || ''),
    createTime: doc?.createTime || null,
    updateTime: doc?.updateTime || null,
    data,
  };
}

function parseJsonObjectInput(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('JSON payload must be an object of key-value fields.');
    }
    return parsed;
  }
  return {};
}

// ============================================================================
// Process Cleanup Registration (Prevent Orphan Emulator Processes)
// ============================================================================
let cleanupHooksInstalled = false;

function cleanupAllManagedEmulatorsSync() {
  for (const entry of managedRegistry.values()) {
    if (entry.pid && isPidAlive(entry.pid)) {
      killProcessGroupSafe(entry.pid, 'SIGTERM');
    }
    if (entry.runtimeMode === 'DOCKER' && entry.containerName) {
      try {
        spawnSync('docker', ['rm', '-f', entry.containerName], { timeout: 2000, stdio: 'ignore' });
      } catch {
        // ignore
      }
    }
  }
}

function installProcessCleanupHooks() {
  if (cleanupHooksInstalled) return;
  cleanupHooksInstalled = true;

  process.once('exit', () => {
    cleanupAllManagedEmulatorsSync();
  });

  for (const sig of ['SIGINT', 'SIGTERM']) {
    process.once(sig, () => {
      cleanupAllManagedEmulatorsSync();
      process.exit(0);
    });
  }
}

// ============================================================================
// Express Route Registration
// ============================================================================
export function registerCloudEmulatorsRoutes(app, { getLocalOrMetadataAccessToken } = {}) {
  installProcessCleanupHooks();

  // 1. GET /api/project/:id/emulators/overview
  app.get('/api/project/:id/emulators/overview', async (req, res) => {
    try {
      const projectId = sanitizeProjectId(req.params.id);
      if (!projectId) {
        return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
      }

      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const [hostReadiness, cloudAssets] = await Promise.all([
        checkHostReadiness(forceRefresh),
        fetchLiveCloudAssets(projectId, getLocalOrMetadataAccessToken),
      ]);

      const emulators = await Promise.all(
        EMULATOR_ORDER.map((type) => buildEmulatorStatusItem(type, hostReadiness, projectId))
      );

      const activeCount = emulators.filter((e) => e.status === 'RUNNING').length;
      const envExportBundle = buildEnvExportBundle(projectId, emulators);

      return res.json({
        ok: true,
        projectId,
        timestamp: new Date().toISOString(),
        hostReadiness,
        emulators,
        cloudAssets,
        envExportBundle,
        activeCount,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to inspect local Google Cloud emulators overview.',
      });
    }
  });

  // 2. POST /api/project/:id/emulators/start
  app.post('/api/project/:id/emulators/start', async (req, res) => {
    try {
      const projectId = sanitizeProjectId(req.params.id);
      if (!projectId) {
        return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
      }

      const emulatorType = normalizeEmulatorType(req.body?.emulatorType);
      if (!emulatorType) {
        return res.status(400).json({
          ok: false,
          error: `Unsupported emulatorType "${req.body?.emulatorType}". Expected one of: ${EMULATOR_ORDER.join(', ')}.`,
        });
      }

      const outcome = await startSingleEmulator({
        projectId,
        emulatorType,
        port: req.body?.port,
        restPort: req.body?.restPort,
        runtimeMode: req.body?.runtimeMode || 'GCLOUD_CLI',
        storeOnDisk: Boolean(req.body?.storeOnDisk),
      });

      return res.status(outcome.httpStatus).json(outcome.payload);
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Unexpected error starting local emulator.',
      });
    }
  });

  // 3. POST /api/project/:id/emulators/stop
  app.post('/api/project/:id/emulators/stop', async (req, res) => {
    try {
      const projectId = sanitizeProjectId(req.params.id);
      if (!projectId) {
        return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
      }

      const stopAll = Boolean(req.body?.stopAll);
      const stopped = [];

      if (stopAll) {
        for (const type of EMULATOR_ORDER) {
          const entry = managedRegistry.get(type);
          const probe = await probeTcpPort(entry.port || EMULATOR_CATALOG[type].defaultPort);
          if ((entry.pid && isPidAlive(entry.pid)) || probe.open) {
            stopped.push(await stopSingleEmulator(type));
          }
        }
      } else {
        const emulatorType = normalizeEmulatorType(req.body?.emulatorType);
        if (!emulatorType) {
          return res.status(400).json({
            ok: false,
            error: `Unsupported emulatorType "${req.body?.emulatorType}".`,
          });
        }
        stopped.push(await stopSingleEmulator(emulatorType));
      }

      return res.json({
        ok: true,
        projectId,
        stopped,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to stop local emulator process.',
      });
    }
  });

  // 4. POST /api/project/:id/emulators/reset-data
  app.post('/api/project/:id/emulators/reset-data', async (req, res) => {
    try {
      const projectId = sanitizeProjectId(req.params.id);
      if (!projectId) {
        return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
      }

      const emulatorType = normalizeEmulatorType(req.body?.emulatorType);
      if (!emulatorType) {
        return res.status(400).json({
          ok: false,
          error: `Unsupported emulatorType "${req.body?.emulatorType}".`,
        });
      }

      const entry = managedRegistry.get(emulatorType);
      const spec = EMULATOR_CATALOG[emulatorType];
      const beforeProbe = await probeTcpPort(entry.port || spec.defaultPort);
      const wasRunning = Boolean((entry.pid && isPidAlive(entry.pid)) || beforeProbe.open);

      if (wasRunning) {
        await stopSingleEmulator(emulatorType);
      }

      const purgedDirs = [];
      if (fs.existsSync(EMULATOR_STATE_ROOT)) {
        const prefix = `${emulatorType.toLowerCase()}-`;
        for (const dirent of fs.readdirSync(EMULATOR_STATE_ROOT)) {
          if (dirent.startsWith(prefix)) {
            const fullPath = path.join(EMULATOR_STATE_ROOT, dirent);
            fs.rmSync(fullPath, { recursive: true, force: true });
            purgedDirs.push(fullPath);
          }
        }
      }

      entry.lines = [];
      appendEmulatorLog(
        entry,
        'reset',
        `Purged local state directories (${purgedDirs.length} removed).`
      );

      let restarted = false;
      let restartError = null;
      const shouldRestart =
        req.body?.restart === true || (wasRunning && req.body?.restart !== false);

      if (shouldRestart) {
        const startRes = await startSingleEmulator({
          projectId,
          emulatorType,
          port: entry.port || spec.defaultPort,
          restPort: entry.restPort || spec.defaultRestPort,
          runtimeMode: entry.runtimeMode || 'GCLOUD_CLI',
          storeOnDisk: entry.storeOnDisk,
        });
        restarted = Boolean(startRes.payload?.ok);
        if (!restarted) {
          restartError = startRes.payload?.error || null;
        }
      }

      return res.json({
        ok: true,
        projectId,
        emulatorType,
        purgedDirs,
        restarted,
        restartError,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to reset local emulator state.',
      });
    }
  });

  // 5. POST /api/project/:id/emulators/install-component
  app.post('/api/project/:id/emulators/install-component', async (req, res) => {
    try {
      const projectId = sanitizeProjectId(req.params.id);
      if (!projectId) {
        return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
      }

      const componentId = String(req.body?.componentId || '').trim();
      if (!ALLOWED_SDK_COMPONENTS.has(componentId)) {
        return res.status(400).json({
          ok: false,
          error: `Disallowed componentId "${componentId}". Allowed: ${Array.from(ALLOWED_SDK_COMPONENTS).join(', ')}.`,
        });
      }

      const aptPkg = APT_PACKAGE_BY_COMPONENT[componentId] || `google-cloud-cli-${componentId}`;
      const manualAptCmd = `sudo apt-get update && sudo apt-get install -y ${aptPkg}`;

      const installRes = await execFileSafe(
        'gcloud',
        ['components', 'install', componentId, '--quiet'],
        90000
      );

      // Force refresh host readiness cache after install attempt
      hostReadinessCache.expiresAt = 0;

      if (installRes.ok) {
        const readiness = await checkHostReadiness(true);
        return res.json({
          ok: true,
          projectId,
          componentId,
          installed: Boolean(readiness.componentsById?.[componentId]?.installed ?? true),
          message: `Successfully installed Google Cloud SDK component "${componentId}".`,
          outputTail: `${installRes.stdout}\n${installRes.stderr}`.trim().slice(-1200),
        });
      }

      const combinedErr = `${installRes.stderr}\n${installRes.stdout}`.trim();
      const packageManagerManaged =
        /component manager is disabled|apt-get|snap|package manager/i.test(combinedErr);

      return res.status(422).json({
        ok: false,
        projectId,
        componentId,
        packageManagerManaged,
        error: packageManagerManaged
          ? `Google Cloud CLI on this host is managed by OS packages (apt/snap); run the apt-get command below to install "${aptPkg}".`
          : combinedErr.slice(-600) || `Failed to install "${componentId}".`,
        manualInstallCmd: packageManagerManaged
          ? manualAptCmd
          : `gcloud components install ${componentId} --quiet`,
        installCommand: packageManagerManaged
          ? manualAptCmd
          : `gcloud components install ${componentId} --quiet`,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to execute gcloud components install.',
      });
    }
  });

  // 6. GET /api/project/:id/emulators/:emulatorType/logs
  app.get('/api/project/:id/emulators/:emulatorType/logs', async (req, res) => {
    try {
      const projectId = sanitizeProjectId(req.params.id);
      if (!projectId) {
        return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
      }

      const emulatorType = normalizeEmulatorType(req.params.emulatorType);
      if (!emulatorType) {
        return res.status(400).json({
          ok: false,
          error: `Unsupported emulatorType "${req.params.emulatorType}".`,
        });
      }

      const spec = EMULATOR_CATALOG[emulatorType];
      const entry = managedRegistry.get(emulatorType);
      const port = entry.port || spec.defaultPort;
      const probe = await probeTcpPort(port);

      let pid = entry.pid && isPidAlive(entry.pid) ? entry.pid : null;
      if (!pid && probe.open && entry.runtimeMode === 'DOCKER') {
        pid = await inspectDockerContainerPid(entry.containerName);
      }
      const rssMb = pid ? await measureProcessRssMb(pid) : null;

      return res.json({
        ok: true,
        projectId,
        emulatorType,
        status: probe.open ? 'RUNNING' : 'STOPPED',
        pid,
        rssMb,
        portOpen: probe.open,
        tcpRttMs: probe.rttMs,
        hostPort: `127.0.0.1:${port}`,
        lines: [...entry.lines],
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to read local emulator logs.',
      });
    }
  });

  // 7. POST /api/project/:id/emulators/workbench
  app.post('/api/project/:id/emulators/workbench', async (req, res) => {
    try {
      const projectId = sanitizeProjectId(req.params.id);
      if (!projectId) {
        return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
      }

      const emulatorType = normalizeEmulatorType(req.body?.emulatorType);
      if (!emulatorType) {
        return res.status(400).json({
          ok: false,
          error: `Unsupported emulatorType "${req.body?.emulatorType}".`,
        });
      }

      const action = String(req.body?.action || '').trim().toUpperCase();
      if (!action) {
        return res.status(400).json({ ok: false, error: 'Workbench action is required.' });
      }

      const spec = EMULATOR_CATALOG[emulatorType];
      const entry = managedRegistry.get(emulatorType);
      const port = Number(req.body?.port || entry.port || spec.defaultPort);
      const restPort =
        emulatorType === 'SPANNER'
          ? Number(req.body?.restPort || entry.restPort || spec.defaultRestPort)
          : null;

      // Universal real TCP + HTTP banner probe (works on all 5 emulators including BIGTABLE)
      if (action === 'PROBE_PORT') {
        const [primaryProbe, restProbe] = await Promise.all([
          probeTcpPort(port, '127.0.0.1', 800),
          restPort ? probeTcpPort(restPort, '127.0.0.1', 800) : Promise.resolve({ open: false, rttMs: null }),
        ]);

        let httpBanner = null;
        let statusCode = null;
        const bannerPort = emulatorType === 'SPANNER' ? restPort : port;
        const bannerOpen = emulatorType === 'SPANNER' ? restProbe.open : primaryProbe.open;

        if (bannerOpen && bannerPort) {
          try {
            const rootRes = await localHttp.get(`http://127.0.0.1:${bannerPort}/`, {
              timeout: 1200,
              responseType: 'text',
            });
            statusCode = rootRes.status;
            httpBanner = String(rootRes.data || '').trim().slice(0, 240) || `HTTP ${rootRes.status}`;
          } catch (probeHttpErr) {
            httpBanner =
              emulatorType === 'BIGTABLE'
                ? 'gRPC HTTP/2 binary transport active on socket'
                : probeHttpErr?.message || 'TCP socket open (non-HTTP transport)';
          }
        }

        return res.json({
          ok: true,
          projectId,
          emulatorType,
          action: 'PROBE_PORT',
          hostPort: `127.0.0.1:${port}`,
          restHostPort: restPort ? `127.0.0.1:${restPort}` : null,
          portOpen: primaryProbe.open,
          restPortOpen: restPort ? restProbe.open : null,
          tcpRttMs: primaryProbe.rttMs,
          restTcpRttMs: restPort ? restProbe.rttMs : null,
          statusCode,
          httpBanner,
          cbtCliExamples:
            emulatorType === 'BIGTABLE'
              ? [
                  `BIGTABLE_EMULATOR_HOST=127.0.0.1:${port} cbt -project=${projectId} -instance=local-bt createtable events`,
                  `BIGTABLE_EMULATOR_HOST=127.0.0.1:${port} cbt -project=${projectId} -instance=local-bt createfamily events cf1`,
                  `BIGTABLE_EMULATOR_HOST=127.0.0.1:${port} cbt -project=${projectId} -instance=local-bt ls`,
                ]
              : undefined,
          probedAt: new Date().toISOString(),
        });
      }

      // Verify target local emulator port is open before issuing REST operations
      const activeTargetPort = emulatorType === 'SPANNER' ? restPort : port;
      const liveCheck = await probeTcpPort(activeTargetPort, '127.0.0.1', 700);
      if (!liveCheck.open) {
        return res.status(422).json({
          ok: false,
          emulatorType,
          action,
          error: `${spec.displayName} is not currently listening on 127.0.0.1:${activeTargetPort}. Start the emulator first.`,
        });
      }

      // ---------------- PUBSUB WORKBENCH ----------------
      if (emulatorType === 'PUBSUB') {
        const baseUrl = `http://127.0.0.1:${port}/v1/projects/${encodeURIComponent(projectId)}`;

        if (action === 'LIST_TOPICS') {
          const [tRes, sRes] = await Promise.all([
            localHttp.get(`${baseUrl}/topics`),
            localHttp.get(`${baseUrl}/subscriptions`),
          ]);
          const topics = (tRes.data?.topics || []).map((t) => ({
            name: t.name,
            fullName: t.name,
            shortName: extractShortId(t.name),
            topicName: extractShortId(t.name),
          }));
          const subscriptions = (sRes.data?.subscriptions || []).map((s) => ({
            name: s.name,
            fullName: s.name,
            shortName: extractShortId(s.name),
            subName: extractShortId(s.name),
            topic: s.topic || null,
            topicShortName: extractShortId(s.topic),
            ackDeadlineSeconds: s.ackDeadlineSeconds || 10,
          }));
          return res.json({
            ok: true,
            emulatorType,
            action,
            topics,
            subscriptions,
          });
        }

        if (action === 'CREATE_TOPIC') {
          const shortTopic = extractShortId(req.body?.topicName || req.body?.topic).trim();
          if (!shortTopic) {
            return res.status(400).json({ ok: false, error: 'topicName is required.' });
          }
          const tRes = await localHttp.put(
            `${baseUrl}/topics/${encodeURIComponent(shortTopic)}`,
            {}
          );
          if (tRes.status >= 400 && tRes.status !== 409) {
            return res.status(422).json({
              ok: false,
              error: tRes.data?.error?.message || `Pub/Sub emulator returned HTTP ${tRes.status}`,
            });
          }

          let subscription = null;
          const shortSub = extractShortId(req.body?.subName || req.body?.subscriptionName || '').trim();
          if (shortSub) {
            const sRes = await localHttp.put(
              `${baseUrl}/subscriptions/${encodeURIComponent(shortSub)}`,
              {
                topic: `projects/${projectId}/topics/${shortTopic}`,
                ackDeadlineSeconds: 30,
              }
            );
            if (sRes.status >= 400 && sRes.status !== 409) {
              return res.status(422).json({
                ok: false,
                error:
                  sRes.data?.error?.message ||
                  `Subscription creation returned HTTP ${sRes.status}`,
              });
            }
            subscription = {
              name: `projects/${projectId}/subscriptions/${shortSub}`,
              shortName: shortSub,
              topic: `projects/${projectId}/topics/${shortTopic}`,
            };
          }

          return res.json({
            ok: true,
            emulatorType,
            action,
            topic: {
              name: `projects/${projectId}/topics/${shortTopic}`,
              shortName: shortTopic,
              alreadyExisted: tRes.status === 409,
            },
            subscription,
          });
        }

        if (action === 'PUBLISH_MESSAGE') {
          const shortTopic = extractShortId(req.body?.topicName || req.body?.topic).trim();
          if (!shortTopic) {
            return res.status(400).json({ ok: false, error: 'topicName is required.' });
          }
          const rawPayload = req.body?.payload ?? req.body?.message ?? '';
          const payloadStr =
            typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload);
          const dataB64 = Buffer.from(payloadStr, 'utf8').toString('base64');

          let cleanAttributes;
          if (req.body?.attributes && typeof req.body.attributes === 'object') {
            cleanAttributes = {};
            for (const [k, v] of Object.entries(req.body.attributes)) {
              if (k && v !== undefined && v !== null) {
                cleanAttributes[String(k)] = String(v);
              }
            }
          }

          const pRes = await localHttp.post(
            `${baseUrl}/topics/${encodeURIComponent(shortTopic)}:publish`,
            {
              messages: [
                {
                  data: dataB64,
                  ...(cleanAttributes && Object.keys(cleanAttributes).length > 0
                    ? { attributes: cleanAttributes }
                    : {}),
                },
              ],
            }
          );
          if (pRes.status >= 400) {
            return res.status(422).json({
              ok: false,
              error: pRes.data?.error?.message || `Publish failed (HTTP ${pRes.status}).`,
            });
          }
          return res.json({
            ok: true,
            emulatorType,
            action,
            topicName: shortTopic,
            messageIds: pRes.data?.messageIds || [],
            publishedAt: new Date().toISOString(),
          });
        }

        if (action === 'PULL_MESSAGES') {
          const shortSub = extractShortId(req.body?.subName || req.body?.subscriptionName).trim();
          if (!shortSub) {
            return res.status(400).json({ ok: false, error: 'subName is required.' });
          }
          const maxMessages = Math.min(50, Math.max(1, Number(req.body?.maxMessages) || 10));
          const autoAck = Boolean(req.body?.autoAck);

          const pullRes = await localHttp.post(
            `${baseUrl}/subscriptions/${encodeURIComponent(shortSub)}:pull`,
            {
              maxMessages,
              returnImmediately: true,
            }
          );
          if (pullRes.status >= 400) {
            return res.status(422).json({
              ok: false,
              error: pullRes.data?.error?.message || `Pull failed (HTTP ${pullRes.status}).`,
            });
          }

          const rawReceived = pullRes.data?.receivedMessages || [];
          const ackIds = [];
          const messages = rawReceived.map((rm) => {
            if (rm.ackId) ackIds.push(rm.ackId);
            const rawB64 = rm.message?.data || '';
            const decodedText = rawB64 ? Buffer.from(rawB64, 'base64').toString('utf8') : '';
            let parsedJson = null;
            try {
              parsedJson = decodedText ? JSON.parse(decodedText) : null;
            } catch {
              parsedJson = null;
            }
            return {
              ackId: rm.ackId || null,
              messageId: rm.message?.messageId || null,
              publishTime: rm.message?.publishTime || null,
              data: decodedText,
              decodedData: decodedText,
              parsedJson,
              attributes: rm.message?.attributes || {},
            };
          });

          if (autoAck && ackIds.length > 0) {
            await localHttp.post(
              `${baseUrl}/subscriptions/${encodeURIComponent(shortSub)}:acknowledge`,
              { ackIds }
            );
          }

          return res.json({
            ok: true,
            emulatorType,
            action,
            subName: shortSub,
            autoAcked: Boolean(autoAck && ackIds.length > 0),
            count: messages.length,
            messages,
          });
        }

        if (action === 'DELETE_TOPIC') {
          const shortTopic = extractShortId(req.body?.topicName || req.body?.topic).trim();
          if (!shortTopic) {
            return res.status(400).json({ ok: false, error: 'topicName is required.' });
          }
          const delRes = await localHttp.delete(
            `${baseUrl}/topics/${encodeURIComponent(shortTopic)}`
          );
          if (delRes.status >= 400 && delRes.status !== 404) {
            return res.status(422).json({
              ok: false,
              error: delRes.data?.error?.message || `Delete topic failed (HTTP ${delRes.status}).`,
            });
          }
          return res.json({
            ok: true,
            emulatorType,
            action,
            deletedTopic: shortTopic,
          });
        }
      }

      // ---------------- DATASTORE WORKBENCH ----------------
      if (emulatorType === 'DATASTORE') {
        const baseUrl = `http://127.0.0.1:${port}/v1/projects/${encodeURIComponent(projectId)}`;

        if (action === 'LIST_ENTITIES') {
          const kind = String(req.body?.kind || '').trim();
          const limit = Math.min(100, Math.max(1, Number(req.body?.limit) || 25));
          const qRes = await localHttp.post(`${baseUrl}:runQuery`, {
            query: {
              ...(kind ? { kind: [{ name: kind }] } : {}),
              limit,
            },
          });
          if (qRes.status >= 400) {
            return res.status(422).json({
              ok: false,
              error: qRes.data?.error?.message || `Datastore query failed (HTTP ${qRes.status}).`,
            });
          }
          const results = qRes.data?.batch?.entityResults || [];
          const entities = results
            .filter((r) => r?.entity)
            .map((r) => formatDatastoreEntity(r.entity));
          return res.json({
            ok: true,
            emulatorType,
            action,
            kind: kind || null,
            count: entities.length,
            entities,
          });
        }

        if (action === 'PUT_ENTITY') {
          const kind = String(req.body?.kind || '').trim();
          if (!kind) {
            return res.status(400).json({ ok: false, error: 'Entity kind is required.' });
          }
          let parsedObj;
          try {
            parsedObj = parseJsonObjectInput(req.body?.data ?? req.body?.properties ?? {});
          } catch (parseErr) {
            return res.status(400).json({ ok: false, error: parseErr.message });
          }

          const properties = {};
          for (const [k, v] of Object.entries(parsedObj)) {
            properties[k] = jsToDatastoreValue(v);
          }

          const rawKeyName = String(req.body?.keyName || '').trim();
          const rawKeyId = String(req.body?.keyId || '').trim();
          const pathElem = rawKeyName
            ? { kind, name: rawKeyName }
            : rawKeyId
              ? { kind, id: rawKeyId }
              : { kind, name: `item-${crypto.randomUUID().slice(0, 8)}` };

          const cRes = await localHttp.post(`${baseUrl}:commit`, {
            mode: 'NON_TRANSACTIONAL',
            mutations: [
              {
                upsert: {
                  key: { path: [pathElem] },
                  properties,
                },
              },
            ],
          });
          if (cRes.status >= 400) {
            return res.status(422).json({
              ok: false,
              error: cRes.data?.error?.message || `Datastore commit failed (HTTP ${cRes.status}).`,
            });
          }

          return res.json({
            ok: true,
            emulatorType,
            action,
            kind,
            keyName: pathElem.name || null,
            keyId: pathElem.id || null,
            mutationResults: cRes.data?.mutationResults || [],
          });
        }

        if (action === 'DELETE_ENTITY') {
          const kind = String(req.body?.kind || '').trim();
          const keyName = String(req.body?.keyName || '').trim();
          const keyId = String(req.body?.keyId || '').trim();
          if (!kind || (!keyName && !keyId)) {
            return res.status(400).json({
              ok: false,
              error: 'Both kind and keyName (or keyId) are required to delete a Datastore entity.',
            });
          }
          const pathElem = keyName ? { kind, name: keyName } : { kind, id: keyId };
          const dRes = await localHttp.post(`${baseUrl}:commit`, {
            mode: 'NON_TRANSACTIONAL',
            mutations: [{ delete: { path: [pathElem] } }],
          });
          if (dRes.status >= 400) {
            return res.status(422).json({
              ok: false,
              error: dRes.data?.error?.message || `Datastore delete failed (HTTP ${dRes.status}).`,
            });
          }
          return res.json({
            ok: true,
            emulatorType,
            action,
            kind,
            keyName: keyName || null,
            keyId: keyId || null,
          });
        }
      }

      // ---------------- FIRESTORE WORKBENCH ----------------
      if (emulatorType === 'FIRESTORE') {
        const docsBase = `http://127.0.0.1:${port}/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;

        if (action === 'LIST_DOCUMENTS') {
          const collectionId = String(req.body?.collectionId || '')
            .trim()
            .replace(/^\/+|\/+$/g, '');
          if (!collectionId) {
            return res.status(400).json({ ok: false, error: 'collectionId is required.' });
          }
          const lRes = await localHttp.get(`${docsBase}/${encodeURI(collectionId)}?pageSize=50`);
          if (lRes.status >= 400) {
            return res.status(422).json({
              ok: false,
              error: lRes.data?.error?.message || `Firestore list failed (HTTP ${lRes.status}).`,
            });
          }
          const documents = (lRes.data?.documents || []).map((d) => formatFirestoreDocument(d));
          return res.json({
            ok: true,
            emulatorType,
            action,
            collectionId,
            count: documents.length,
            documents,
          });
        }

        if (action === 'UPSERT_DOCUMENT') {
          const collectionId = String(req.body?.collectionId || '')
            .trim()
            .replace(/^\/+|\/+$/g, '');
          const documentId =
            String(req.body?.documentId || '').trim() || `doc-${crypto.randomUUID().slice(0, 8)}`;
          if (!collectionId) {
            return res.status(400).json({ ok: false, error: 'collectionId is required.' });
          }

          let parsedObj;
          try {
            parsedObj = parseJsonObjectInput(req.body?.data ?? req.body?.fields ?? {});
          } catch (parseErr) {
            return res.status(400).json({ ok: false, error: parseErr.message });
          }

          const fields = {};
          for (const [k, v] of Object.entries(parsedObj)) {
            fields[k] = jsToFirestoreValue(v);
          }

          const uRes = await localHttp.patch(
            `${docsBase}/${encodeURI(collectionId)}/${encodeURIComponent(documentId)}`,
            { fields }
          );
          if (uRes.status >= 400) {
            return res.status(422).json({
              ok: false,
              error: uRes.data?.error?.message || `Firestore upsert failed (HTTP ${uRes.status}).`,
            });
          }

          return res.json({
            ok: true,
            emulatorType,
            action,
            collectionId,
            documentId,
            document: formatFirestoreDocument(uRes.data),
          });
        }

        if (action === 'DELETE_DOCUMENT') {
          const collectionId = String(req.body?.collectionId || '')
            .trim()
            .replace(/^\/+|\/+$/g, '');
          const documentId = String(req.body?.documentId || '').trim();
          if (!collectionId || !documentId) {
            return res.status(400).json({
              ok: false,
              error: 'Both collectionId and documentId are required.',
            });
          }
          const delRes = await localHttp.delete(
            `${docsBase}/${encodeURI(collectionId)}/${encodeURIComponent(documentId)}`
          );
          if (delRes.status >= 400 && delRes.status !== 404) {
            return res.status(422).json({
              ok: false,
              error:
                delRes.data?.error?.message || `Firestore delete failed (HTTP ${delRes.status}).`,
            });
          }
          return res.json({
            ok: true,
            emulatorType,
            action,
            collectionId,
            documentId,
          });
        }
      }

      // ---------------- SPANNER WORKBENCH ----------------
      if (emulatorType === 'SPANNER') {
        const restBase = `http://127.0.0.1:${restPort}/v1`;

        if (action === 'LIST_INSTANCES') {
          const iRes = await localHttp.get(
            `${restBase}/projects/${encodeURIComponent(projectId)}/instances`
          );
          if (iRes.status >= 400) {
            return res.status(422).json({
              ok: false,
              error:
                iRes.data?.error?.message || `Spanner list instances failed (HTTP ${iRes.status}).`,
            });
          }
          const rawInstances = iRes.data?.instances || [];
          const instances = [];
          const databases = [];
          for (const inst of rawInstances) {
            const instId = extractShortId(inst.name);
            instances.push({
              name: inst.name,
              instanceId: instId,
              displayName: inst.displayName || instId,
              state: inst.state || 'READY',
            });
            const dbRes = await localHttp.get(`${restBase}/${inst.name}/databases`);
            for (const db of dbRes.data?.databases || []) {
              databases.push({
                name: db.name,
                instanceId: instId,
                databaseId: extractShortId(db.name),
                state: db.state || 'READY',
              });
            }
          }
          return res.json({
            ok: true,
            emulatorType,
            action,
            instances,
            databases,
          });
        }

        if (action === 'BOOTSTRAP_INSTANCE_DB') {
          const instanceId = String(req.body?.instanceId || 'local-instance').trim();
          const databaseId = String(req.body?.databaseId || 'local-db').trim();
          const extraStatements = Array.isArray(req.body?.ddl) ? req.body.ddl : [];

          const instRes = await localHttp.post(
            `${restBase}/projects/${encodeURIComponent(projectId)}/instances`,
            {
              instanceId,
              instance: {
                config: `projects/${projectId}/instanceConfigs/emulator-config`,
                displayName: instanceId.slice(0, 30),
                nodeCount: 1,
              },
            }
          );
          if (instRes.status >= 400 && instRes.status !== 409) {
            return res.status(422).json({
              ok: false,
              error:
                instRes.data?.error?.message ||
                `Spanner instance bootstrap failed (HTTP ${instRes.status}).`,
            });
          }

          const dbRes = await localHttp.post(
            `${restBase}/projects/${encodeURIComponent(projectId)}/instances/${encodeURIComponent(instanceId)}/databases`,
            {
              createStatement: `CREATE DATABASE \`${databaseId}\``,
              extraStatements,
            }
          );
          if (dbRes.status >= 400 && dbRes.status !== 409) {
            return res.status(422).json({
              ok: false,
              error:
                dbRes.data?.error?.message ||
                `Spanner database bootstrap failed (HTTP ${dbRes.status}).`,
            });
          }

          return res.json({
            ok: true,
            emulatorType,
            action,
            instanceId,
            databaseId,
            instanceName: `projects/${projectId}/instances/${instanceId}`,
            databaseName: `projects/${projectId}/instances/${instanceId}/databases/${databaseId}`,
          });
        }

        if (action === 'EXECUTE_SQL') {
          const instanceId = String(req.body?.instanceId || 'local-instance').trim();
          const databaseId = String(req.body?.databaseId || 'local-db').trim();
          const sql = String(req.body?.sql || '').trim();
          if (!sql) {
            return res.status(400).json({ ok: false, error: 'SQL statement is required.' });
          }

          const dbPath = `projects/${encodeURIComponent(projectId)}/instances/${encodeURIComponent(instanceId)}/databases/${encodeURIComponent(databaseId)}`;

          // Handle DDL statements cleanly via updateDatabaseDdl
          if (/^\s*(CREATE|ALTER|DROP)\s+(TABLE|INDEX|VIEW|CHANGE\s+STREAM)/i.test(sql)) {
            const statements = sql
              .split(';')
              .map((s) => s.trim())
              .filter(Boolean);
            const ddlRes = await localHttp.patch(`${restBase}/${dbPath}/ddl`, { statements });
            if (ddlRes.status >= 400) {
              return res.status(422).json({
                ok: false,
                error: ddlRes.data?.error?.message || `Spanner DDL failed (HTTP ${ddlRes.status}).`,
              });
            }
            return res.json({
              ok: true,
              emulatorType,
              action,
              statementType: 'DDL',
              statementsExecuted: statements.length,
              columns: [],
              rows: [],
            });
          }

          const sessRes = await localHttp.post(`${restBase}/${dbPath}/sessions`, {});
          if (sessRes.status >= 400 || !sessRes.data?.name) {
            return res.status(422).json({
              ok: false,
              error:
                sessRes.data?.error?.message ||
                `Failed to create Spanner session (bootstrap instance/database first).`,
            });
          }
          const sessionName = sessRes.data.name;

          try {
            const isDml = /^\s*(INSERT|UPDATE|DELETE)\b/i.test(sql);
            if (isDml) {
              const txRes = await localHttp.post(`${restBase}/${sessionName}:beginTransaction`, {
                options: { readWrite: {} },
              });
              const txId = txRes.data?.id;
              if (!txId) {
                return res.status(422).json({
                  ok: false,
                  error: txRes.data?.error?.message || 'Failed to begin read-write transaction.',
                });
              }
              const execRes = await localHttp.post(`${restBase}/${sessionName}:executeSql`, {
                sql,
                transaction: { id: txId },
              });
              if (execRes.status >= 400) {
                return res.status(422).json({
                  ok: false,
                  error:
                    execRes.data?.error?.message ||
                    `Spanner DML failed (HTTP ${execRes.status}).`,
                });
              }
              await localHttp.post(`${restBase}/${sessionName}:commit`, { transactionId: txId });
              return res.json({
                ok: true,
                emulatorType,
                action,
                statementType: 'DML',
                rowCountExact: Number(execRes.data?.stats?.rowCountExact || 0),
                columns: [],
                rows: [],
              });
            }

            const qRes = await localHttp.post(`${restBase}/${sessionName}:executeSql`, { sql });
            if (qRes.status >= 400) {
              return res.status(422).json({
                ok: false,
                error: qRes.data?.error?.message || `Spanner SQL failed (HTTP ${qRes.status}).`,
              });
            }
            const fields = qRes.data?.metadata?.rowType?.fields || [];
            const columns = fields.map((f, idx) => ({
              name: f.name || `col_${idx}`,
              type: f.type?.code || 'STRING',
            }));
            const rawRows = qRes.data?.rows || [];
            const rows = rawRows.map((arr) => {
              const obj = {};
              columns.forEach((col, idx) => {
                obj[col.name] = arr[idx];
              });
              return obj;
            });
            return res.json({
              ok: true,
              emulatorType,
              action,
              statementType: 'QUERY',
              columns,
              rows,
              rawRows,
              rowCount: rows.length,
            });
          } finally {
            await localHttp.delete(`${restBase}/${sessionName}`).catch(() => {});
          }
        }
      }

      return res.status(400).json({
        ok: false,
        error: `Unsupported workbench action "${action}" for emulator "${emulatorType}".`,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Workbench execution failed.',
      });
    }
  });

  // 8. POST /api/project/:id/emulators/clone-cloud-schema
  app.post('/api/project/:id/emulators/clone-cloud-schema', async (req, res) => {
    try {
      const projectId = sanitizeProjectId(req.params.id);
      if (!projectId) {
        return res.status(400).json({ ok: false, error: 'Invalid GCP project ID.' });
      }

      const emulatorType = normalizeEmulatorType(req.body?.emulatorType);
      if (!emulatorType) {
        return res.status(400).json({
          ok: false,
          error: `Unsupported emulatorType "${req.body?.emulatorType}".`,
        });
      }

      const spec = EMULATOR_CATALOG[emulatorType];
      const entry = managedRegistry.get(emulatorType);
      const port = entry.port || spec.defaultPort;
      const restPort = emulatorType === 'SPANNER' ? entry.restPort || spec.defaultRestPort : null;
      const targetPort = emulatorType === 'SPANNER' ? restPort : port;

      const portProbe = await probeTcpPort(targetPort, '127.0.0.1', 700);
      if (!portProbe.open) {
        return res.status(422).json({
          ok: false,
          emulatorType,
          error: `${spec.displayName} is not running on 127.0.0.1:${targetPort}. Start the local emulator before cloning live Cloud schema.`,
        });
      }

      let token = null;
      if (typeof getLocalOrMetadataAccessToken === 'function') {
        const authObj = await getLocalOrMetadataAccessToken();
        token = authObj?.token || null;
      }
      if (!token) {
        return res.status(401).json({
          ok: false,
          error: 'No active Google Cloud OAuth token available to inspect live Cloud schema.',
        });
      }

      const cloudAssets = await fetchLiveCloudAssets(projectId, getLocalOrMetadataAccessToken);
      const clonedItems = [];
      const syncedAt = new Date().toISOString();

      if (emulatorType === 'PUBSUB') {
        const baseUrl = `http://127.0.0.1:${port}/v1/projects/${encodeURIComponent(projectId)}`;
        for (const topic of cloudAssets.pubsubTopics) {
          const r = await localHttp.put(
            `${baseUrl}/topics/${encodeURIComponent(topic.shortName)}`,
            {}
          );
          if (r.status < 400 || r.status === 409) {
            clonedItems.push({ kind: 'TOPIC', name: topic.shortName, status: 'CLONED' });
          }
        }
        for (const sub of cloudAssets.pubsubSubscriptions) {
          if (!sub.topicShortName || sub.pushEndpoint) continue;
          const r = await localHttp.put(
            `${baseUrl}/subscriptions/${encodeURIComponent(sub.shortName)}`,
            {
              topic: `projects/${projectId}/topics/${sub.topicShortName}`,
              ackDeadlineSeconds: sub.ackDeadlineSeconds || 20,
            }
          );
          if (r.status < 400 || r.status === 409) {
            clonedItems.push({
              kind: 'SUBSCRIPTION',
              name: sub.shortName,
              topic: sub.topicShortName,
              status: 'CLONED',
            });
          }
        }
        return res.json({
          ok: true,
          projectId,
          emulatorType,
          clonedItems,
          summary:
            clonedItems.length > 0
              ? `Cloned ${clonedItems.length} live Pub/Sub resource(s) from project "${projectId}" into 127.0.0.1:${port}.`
              : `Inspected live Cloud Pub/Sub in "${projectId}": 0 topics/pull-subscriptions currently exist in cloud.`,
        });
      }

      if (emulatorType === 'SPANNER') {
        const restBase = `http://127.0.0.1:${restPort}/v1`;
        const headers = { Authorization: `Bearer ${token}` };
        for (const inst of cloudAssets.spannerInstances) {
          const instId = inst.shortName;
          const createInst = await localHttp.post(
            `${restBase}/projects/${encodeURIComponent(projectId)}/instances`,
            {
              instanceId: instId,
              instance: {
                config: `projects/${projectId}/instanceConfigs/emulator-config`,
                displayName: (inst.displayName || instId).slice(0, 30),
                nodeCount: 1,
              },
            }
          );
          if (createInst.status < 400 || createInst.status === 409) {
            clonedItems.push({ kind: 'SPANNER_INSTANCE', name: instId, status: 'CLONED' });
          }

          try {
            const dbListRes = await cloudHttp.get(
              `https://spanner.googleapis.com/v1/${inst.fullName}/databases`,
              { headers }
            );
            for (const cloudDb of dbListRes.data?.databases || []) {
              const dbId = extractShortId(cloudDb.name);
              let ddlStatements = [];
              try {
                const ddlRes = await cloudHttp.get(
                  `https://spanner.googleapis.com/v1/${cloudDb.name}/ddl`,
                  { headers }
                );
                ddlStatements = ddlRes.data?.statements || [];
              } catch {
                ddlStatements = [];
              }
              const createDb = await localHttp.post(
                `${restBase}/projects/${encodeURIComponent(projectId)}/instances/${encodeURIComponent(instId)}/databases`,
                {
                  createStatement: `CREATE DATABASE \`${dbId}\``,
                  extraStatements: ddlStatements,
                }
              );
              if (createDb.status < 400 || createDb.status === 409) {
                clonedItems.push({
                  kind: 'SPANNER_DATABASE',
                  name: `${instId}/${dbId}`,
                  ddlStatements: ddlStatements.length,
                  status: 'CLONED',
                });
              }
            }
          } catch {
            // continue if database listing lacks permission
          }
        }
        return res.json({
          ok: true,
          projectId,
          emulatorType,
          clonedItems,
          summary:
            clonedItems.length > 0
              ? `Cloned ${clonedItems.length} live Cloud Spanner instance/database schema item(s) into local emulator 127.0.0.1:${restPort}.`
              : `Inspected live Cloud Spanner in "${projectId}": 0 cloud Spanner instances found.`,
        });
      }

      if (emulatorType === 'FIRESTORE') {
        const docsBase = `http://127.0.0.1:${port}/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
        const headers = { Authorization: `Bearer ${token}` };
        let liveCollections = [];
        try {
          const colRes = await cloudHttp.post(
            `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:listCollectionIds`,
            { pageSize: 50 },
            { headers }
          );
          liveCollections = colRes.data?.collectionIds || [];
        } catch {
          liveCollections = [];
        }

        const parityMeta = {
          projectId: jsToFirestoreValue(projectId),
          syncedAt: jsToFirestoreValue(syncedAt),
          cloudDatabaseCount: jsToFirestoreValue(cloudAssets.firestoreDatabases.length),
          cloudDatabases: jsToFirestoreValue(
            cloudAssets.firestoreDatabases.map((d) => `${d.name} (${d.locationId || 'global'})`)
          ),
          discoveredCollections: jsToFirestoreValue(liveCollections),
        };

        const metaRes = await localHttp.patch(
          `${docsBase}/_cloudpulse_parity/${encodeURIComponent(projectId)}`,
          { fields: parityMeta }
        );
        if (metaRes.status < 400) {
          clonedItems.push({
            kind: 'FIRESTORE_PARITY_MANIFEST',
            name: `_cloudpulse_parity/${projectId}`,
            status: 'SYNCED',
          });
        }

        for (const colId of liveCollections) {
          const colStub = await localHttp.patch(
            `${docsBase}/${encodeURI(colId)}/_schema_parity_anchor`,
            {
              fields: {
                sourceProject: jsToFirestoreValue(projectId),
                collectionId: jsToFirestoreValue(colId),
                syncedAt: jsToFirestoreValue(syncedAt),
              },
            }
          );
          if (colStub.status < 400) {
            clonedItems.push({
              kind: 'FIRESTORE_COLLECTION',
              name: colId,
              status: 'CLONED',
            });
          }
        }

        return res.json({
          ok: true,
          projectId,
          emulatorType,
          clonedItems,
          summary: `Synced Cloud Firestore parity manifest (${cloudAssets.firestoreDatabases.length} cloud DBs, ${liveCollections.length} root collections) to 127.0.0.1:${port}.`,
        });
      }

      if (emulatorType === 'DATASTORE') {
        const baseUrl = `http://127.0.0.1:${port}/v1/projects/${encodeURIComponent(projectId)}`;
        const headers = { Authorization: `Bearer ${token}` };
        let cloudKinds = [];
        try {
          const kindRes = await cloudHttp.post(
            `https://datastore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}:runQuery`,
            { query: { kind: [{ name: '__kind__' }], limit: 50 } },
            { headers }
          );
          cloudKinds = (kindRes.data?.batch?.entityResults || [])
            .map((r) => r?.entity?.key?.path?.[0]?.name)
            .filter((n) => n && !n.startsWith('__'));
        } catch {
          cloudKinds = [];
        }

        const mutations = [
          {
            upsert: {
              key: { path: [{ kind: '_CloudSchemaSync', name: projectId }] },
              properties: {
                projectId: jsToDatastoreValue(projectId),
                syncedAt: jsToDatastoreValue(syncedAt),
                cloudDatabasesCount: jsToDatastoreValue(cloudAssets.firestoreDatabases.length),
                discoveredKinds: jsToDatastoreValue(cloudKinds),
              },
            },
          },
        ];

        const cRes = await localHttp.post(`${baseUrl}:commit`, {
          mode: 'NON_TRANSACTIONAL',
          mutations,
        });
        if (cRes.status < 400) {
          clonedItems.push({
            kind: 'DATASTORE_PARITY_ENTITY',
            name: `_CloudSchemaSync/${projectId}`,
            discoveredKinds: cloudKinds,
            status: 'SYNCED',
          });
        }

        return res.json({
          ok: true,
          projectId,
          emulatorType,
          clonedItems,
          summary: `Seeded Cloud-Parity metadata record in local Datastore 127.0.0.1:${port} (${cloudKinds.length} live cloud Kind(s) discovered).`,
        });
      }

      // BIGTABLE
      return res.json({
        ok: true,
        projectId,
        emulatorType,
        clonedItems: cloudAssets.bigtableInstances.map((i) => ({
          kind: 'BIGTABLE_CLOUD_INSTANCE_REF',
          name: i.shortName,
          status: 'INSPECTED',
        })),
        summary: `Inspected ${cloudAssets.bigtableInstances.length} live Cloud Bigtable instance(s) in "${projectId}". Use BIGTABLE_EMULATOR_HOST=127.0.0.1:${port} with cbt CLI to mirror column families.`,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to clone live Cloud schema into local emulator.',
      });
    }
  });
}
