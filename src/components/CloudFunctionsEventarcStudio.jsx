import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Zap,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Play,
  Rocket,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  ArrowRight,
  HardDrive,
  Database,
  Clock,
  Globe,
  Layers,
  DollarSign,
  Trash2,
  CheckCircle2,
  FileCode,
  Activity,
  Lock,
} from 'lucide-react';

const TRIGGER_RECIPES = [
  {
    id: 'GCS_OBJECT',
    title: '🪣 Cloud Storage File Event',
    plainEnglish: 'When a file is uploaded, deleted, or archived in a Bucket',
    transportMode: 'DIRECT_PUBSUB_FREE',
    transportBadge: '🟢 Direct Native Transport ($0.00 Audit Log Tax)',
    eventTypeDefault: 'google.cloud.storage.object.v1.finalized',
    eventSubtypes: [
      {
        id: 'google.cloud.storage.object.v1.finalized',
        label: 'File Uploaded / Overwritten (object.v1.finalized)',
      },
      {
        id: 'google.cloud.storage.object.v1.deleted',
        label: 'File Deleted (object.v1.deleted)',
      },
      {
        id: 'google.cloud.storage.object.v1.archived',
        label: 'Live Version Archived (object.v1.archived)',
      },
      {
        id: 'google.cloud.storage.object.v1.metadataUpdated',
        label: 'Object Metadata Updated (object.v1.metadataUpdated)',
      },
    ],
    hiddenIamNote:
      'Requires Cloud Storage Service Agent (service-PROJECT_NUMBER@gs-project-accounts.iam.gserviceaccount.com) to have roles/pubsub.publisher.',
    costNote:
      '100% Free Eventarc delivery! Uses native GCS → Pub/Sub notifications without requiring paid DATA_WRITE Cloud Audit Logs.',
  },
  {
    id: 'PUBSUB_TOPIC',
    title: '📨 Pub/Sub Message Stream',
    plainEnglish: 'When a JSON or binary message is published to a Topic',
    transportMode: 'DIRECT_PUBSUB_FREE',
    transportBadge: '🟢 Direct Pub/Sub Push ($0.00 Audit Log Tax)',
    eventTypeDefault: 'google.cloud.pubsub.topic.v1.messagePublished',
    eventSubtypes: [
      {
        id: 'google.cloud.pubsub.topic.v1.messagePublished',
        label: 'Message Published to Topic (topic.v1.messagePublished)',
      },
    ],
    hiddenIamNote:
      'Requires Default Compute / Trigger Service Account to have roles/run.invoker on the 2nd Gen Cloud Function.',
    costNote:
      'First 10 GiB/month of Pub/Sub message delivery is free under the Google Cloud Always-Free Tier.',
  },
  {
    id: 'BIGQUERY_AUDIT',
    title: '📊 BigQuery Job / Table Finish',
    plainEnglish: 'When a BigQuery query or table load job completes (InsertJob)',
    transportMode: 'CLOUD_AUDIT_LOGS',
    transportBadge: '🟡 Cloud Audit Logs Transport (Requires DATA_WRITE Logs)',
    eventTypeDefault: 'google.cloud.audit.log.v1.written',
    eventSubtypes: [
      {
        id: 'google.cloud.bigquery.v2.JobService.InsertJob',
        label: 'Query or Load Job Completed (JobService.InsertJob)',
      },
      {
        id: 'google.cloud.bigquery.v2.TableService.InsertTable',
        label: 'New Table Created (TableService.InsertTable)',
      },
    ],
    hiddenIamNote:
      'Requires Eventarc Event Receiver (roles/eventarc.eventReceiver) + BigQuery Audit Logs enabled.',
    costNote:
      '⚠️ FinOps Guardrail: Audit Log triggers read from Cloud Logging. Use our Scoped Log Exclusion filter below so you only ingest InsertJob logs ($0 within 50 GiB/mo free logging tier).',
  },
  {
    id: 'CRON_SCHEDULE',
    title: '⏰ Cloud Scheduler Cron Timer',
    plainEnglish: 'Run automatically on a recurring schedule (every N mins / nightly)',
    transportMode: 'DIRECT_PUBSUB_FREE',
    transportBadge: '🟢 Scheduler → Pub/Sub Trigger (3 Free Jobs/Mo)',
    eventTypeDefault: 'google.cloud.pubsub.topic.v1.messagePublished',
    eventSubtypes: [
      { id: '*/5 * * * *', label: 'Every 5 Minutes (*/5 * * * *)' },
      { id: '0 * * * *', label: 'Every Hour on the Hour (0 * * * *)' },
      { id: '0 2 * * *', label: 'Every Night at 02:00 UTC (0 2 * * *)' },
    ],
    hiddenIamNote:
      'Cloud Scheduler publishes a heartbeat message to your Pub/Sub topic, which triggers the Function via Eventarc.',
    costNote:
      'Google Cloud Scheduler includes 3 free jobs per month ($0.10/job/mo thereafter).',
  },
  {
    id: 'HTTPS_WEBHOOK',
    title: '🌐 Direct HTTPS Webhook / API',
    plainEnglish: 'Invoke directly via HTTPS URL (Stripe/GitHub webhooks or REST API)',
    transportMode: 'DIRECT_HTTPS_FREE',
    transportBadge: '🟢 Direct HTTPS Endpoint (2M Free Invocations/Mo)',
    eventTypeDefault: 'google.cloud.functions.https.v2.invoked',
    eventSubtypes: [
      {
        id: 'PUBLIC_ALL_USERS',
        label: 'Public HTTPS Webhook (--allow-unauthenticated)',
      },
      {
        id: 'ZERO_TRUST_IAM',
        label: 'Zero-Trust IAM / OIDC Token Required (--no-allow-unauthenticated)',
      },
    ],
    hiddenIamNote:
      'Public webhooks bind allUsers → roles/run.invoker; Private webhooks require an OIDC Bearer token.',
    costNote:
      'First 2,000,000 invocations/month + 400,000 GB-seconds + 200,000 GHz-seconds are 100% FREE every month.',
  },
  {
    id: 'UNIVERSAL_AUDIT',
    title: '🚀 Universal GCP Service Event (130+ Services)',
    plainEnglish: 'When a Compute VM is created, Firewall changes, IAM key is added, or GKE/SQL mutates',
    transportMode: 'ADMIN_AUDIT_FREE',
    transportBadge: '🟢 ADMIN_ACTIVITY Audit Log (Always ON · $0.00 Free)',
    eventTypeDefault: 'google.cloud.audit.log.v1.written',
    eventSubtypes: [],
    hiddenIamNote:
      'Requires Default Compute Service Account to have roles/eventarc.eventReceiver + roles/run.invoker (auto-healed by our 1-Tap IAM Doctor).',
    costNote:
      '100% Free Ingestion! Google Cloud ADMIN_ACTIVITY Audit Logs (VM creation, IAM, Firewall, GKE, Cloud SQL) are ALWAYS ON by default and incur $0.00 Cloud Logging fees.',
  },
];

const ADVANCED_EVENTARC_CATALOG = [
  {
    id: 'VM_CREATED',
    group: 'COMPUTE_VM',
    badge: '🖥️ Compute Engine',
    title: 'Compute VM Instance Created',
    plainEnglish: 'Triggers the instant a new VM is provisioned in any zone (auto-tag, compliance check, or Slack alert)',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'compute.googleapis.com',
    methodName: 'v1.compute.instances.insert',
    samplePathPattern: '/projects/*/zones/*/instances/prod-*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'vm-creation-guardrail',
  },
  {
    id: 'VM_DELETED',
    group: 'COMPUTE_VM',
    badge: '🖥️ Compute Engine',
    title: 'Compute VM Instance Deleted / Terminated',
    plainEnglish: 'Triggers when a VM is destroyed (clean up DNS records, release static IPs, or archive metadata)',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'compute.googleapis.com',
    methodName: 'v1.compute.instances.delete',
    samplePathPattern: '/projects/*/zones/*/instances/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'vm-cleanup-handler',
  },
  {
    id: 'VM_STOPPED',
    group: 'COMPUTE_VM',
    badge: '🖥️ Compute Engine',
    title: 'Compute VM Instance Stopped / Halted',
    plainEnglish: 'Triggers when a running VM is stopped (detect unexpected production shutdowns or snapshot disks)',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'compute.googleapis.com',
    methodName: 'v1.compute.instances.stop',
    samplePathPattern: '/projects/*/zones/*/instances/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'vm-stop-monitor',
  },
  {
    id: 'DISK_SNAPSHOT',
    group: 'COMPUTE_VM',
    badge: '🖥️ Compute Engine',
    title: 'Persistent Disk Snapshot Created',
    plainEnglish: 'Triggers when a disk snapshot finishes (replicate cross-region or verify backup retention labels)',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'compute.googleapis.com',
    methodName: 'v1.compute.snapshots.insert',
    samplePathPattern: '/projects/*/global/snapshots/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'snapshot-replicator',
  },
  {
    id: 'FIREWALL_MUTATED',
    group: 'IAM_SECURITY',
    badge: '🛡️ Network Security',
    title: 'VPC Firewall Rule Created or Opened',
    plainEnglish: 'Auto-remediate if someone opens 0.0.0.0/0 on port 22 (SSH) or 3389 (RDP) in your VPC',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'compute.googleapis.com',
    methodName: 'v1.compute.firewalls.insert',
    samplePathPattern: '/projects/*/global/firewalls/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'firewall-zero-trust-enforcer',
  },
  {
    id: 'IAM_SA_KEY_CREATED',
    group: 'IAM_SECURITY',
    badge: '🔑 IAM & Zero-Trust',
    title: 'Service Account JSON Key Exported',
    plainEnglish: 'High-priority SecOps trigger when a long-lived Service Account key is created (alert or auto-revoke)',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'iam.googleapis.com',
    methodName: 'google.iam.admin.v1.CreateServiceAccountKey',
    samplePathPattern: '/projects/*/serviceAccounts/*/keys/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'sa-key-leak-responder',
  },
  {
    id: 'IAM_POLICY_CHANGED',
    group: 'IAM_SECURITY',
    badge: '🔐 IAM & Zero-Trust',
    title: 'Project IAM Policy Modified (SetIamPolicy)',
    plainEnglish: 'Audit privilege escalations (roles/owner or roles/editor grants) in real time',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'cloudresourcemanager.googleapis.com',
    methodName: 'SetIamPolicy',
    samplePathPattern: '',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'iam-policy-auditor',
  },
  {
    id: 'SECRET_VERSION_ADDED',
    group: 'IAM_SECURITY',
    badge: '🗝️ Secret Manager',
    title: 'New Secret Version Added / Rotated',
    plainEnglish: 'Hot-reload downstream services or verify secret rotation when a new Secret Manager version is added',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'secretmanager.googleapis.com',
    methodName: 'google.cloud.secretmanager.v1.SecretManagerService.AddSecretVersion',
    samplePathPattern: 'projects/*/secrets/*/versions/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'secret-rotation-sync',
  },
  {
    id: 'GKE_CLUSTER_CREATED',
    group: 'GKE_CONTAINERS',
    badge: '☸️ Kubernetes (GKE)',
    title: 'GKE Cluster Provisioned (CreateCluster)',
    plainEnglish: 'Bootstrap ArgoCD, network policies, or workload identity when a new GKE cluster is created',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'container.googleapis.com',
    methodName: 'google.container.v1.ClusterManager.CreateCluster',
    samplePathPattern: 'projects/*/locations/*/clusters/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'gke-cluster-bootstrapper',
  },
  {
    id: 'GKE_NODEPOOL_RESIZED',
    group: 'GKE_CONTAINERS',
    badge: '☸️ Kubernetes (GKE)',
    title: 'GKE NodePool Resized (SetNodePoolSize)',
    plainEnglish: 'Track Kubernetes node scaling and GPU quota consumption across clusters',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'container.googleapis.com',
    methodName: 'google.container.v1.ClusterManager.SetNodePoolSize',
    samplePathPattern: 'projects/*/locations/*/clusters/*/nodePools/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'gke-scale-tracker',
  },
  {
    id: 'CLOUD_RUN_DEPLOYED',
    group: 'GKE_CONTAINERS',
    badge: '🚀 Cloud Run & CI/CD',
    title: 'Cloud Run Service Deployed / Updated',
    plainEnglish: 'Run automated smoke tests or synthetic canary checks after every Cloud Run revision deploy',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'run.googleapis.com',
    methodName: 'google.cloud.run.v1.Services.ReplaceService',
    samplePathPattern: 'namespaces/*/services/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'cloudrun-canary-verifier',
  },
  {
    id: 'CLOUDSQL_CREATED',
    group: 'DATABASES',
    badge: '🐘 Cloud SQL & DBs',
    title: 'Cloud SQL Database Instance Created',
    plainEnglish: 'Verify private IP enforcement and automated backup flags on new Cloud SQL instances',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'sqladmin.googleapis.com',
    methodName: 'cloudsql.instances.insert',
    samplePathPattern: 'projects/*/instances/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'sql-compliance-checker',
  },
  {
    id: 'CLOUDSQL_FAILOVER',
    group: 'DATABASES',
    badge: '🐘 Cloud SQL & DBs',
    title: 'Cloud SQL High-Availability Failover',
    plainEnglish: 'Alert PagerDuty and flush application caches when a regional Cloud SQL instance fails over',
    eventType: 'google.cloud.audit.log.v1.written',
    serviceName: 'sqladmin.googleapis.com',
    methodName: 'cloudsql.instances.failover',
    samplePathPattern: 'projects/*/instances/*',
    auditStreamType: 'ADMIN_ACTIVITY (Always ON · $0.00 Free)',
    suggestedFnName: 'sql-failover-responder',
  },
  {
    id: 'FIRESTORE_DOC_WRITTEN',
    group: 'DATABASES',
    badge: '🔥 Firestore NoSQL',
    title: 'Firestore Document Created / Updated / Deleted',
    plainEnglish: 'Stream real-time NoSQL document changes into BigQuery or Vertex AI Vector Search',
    eventType: 'google.cloud.firestore.document.v1.written',
    serviceName: 'firestore.googleapis.com',
    methodName: 'google.cloud.firestore.document.v1.written',
    samplePathPattern: 'documents/users/{userId}',
    auditStreamType: 'DIRECT_NATIVE (Zero Audit Log Tax)',
    suggestedFnName: 'firestore-bq-streamer',
  },
];

export default function CloudFunctionsEventarcStudio({
  projectId,
  onRunInShell,
  onShowToast,
}) {
  const [activeSubTab, setActiveSubTab] = useState('TRIGGER_WIZARD');
  const [loading, setLoading] = useState(false);
  const [functionsList, setFunctionsList] = useState([]);
  const [buckets, setBuckets] = useState([]);
  const [topics, setTopics] = useState([]);

  // IAM Auto-Doctor state
  const [iamDoctorBusy, setIamDoctorBusy] = useState(false);
  const [iamDoctorReport, setIamDoctorReport] = useState(null);

  // Beginner vs Advanced Universal Eventarc Mode
  const [wizardMode, setWizardMode] = useState('BEGINNER'); // 'BEGINNER' | 'ADVANCED'
  const [advGroupFilter, setAdvGroupFilter] = useState('ALL');
  const [advSearchQuery, setAdvSearchQuery] = useState('');
  const [selectedAdvPresetId, setSelectedAdvPresetId] = useState('VM_CREATED');
  const [auditServiceName, setAuditServiceName] = useState('compute.googleapis.com');
  const [auditMethodName, setAuditMethodName] = useState('v1.compute.instances.insert');
  const [customEventType, setCustomEventType] = useState('google.cloud.audit.log.v1.written');
  const [resourceNamePattern, setResourceNamePattern] = useState('');

  // Trigger Wizard Form State
  const [fnName, setFnName] = useState('invoice-ocr-processor');
  const [fnRegion, setFnRegion] = useState('us-central1');
  const [fnGen, setFnGen] = useState('GEN_2');
  const [fnRuntime, setFnRuntime] = useState('nodejs22');
  const [fnEntryPoint, setFnEntryPoint] = useState('handleCloudEvent');
  const [fnMemory, setFnMemory] = useState('512Mi');
  const [fnConcurrency, setFnConcurrency] = useState(80);
  const [fnMinInstances, setFnMinInstances] = useState(0);
  const [fnMaxInstances, setFnMaxInstances] = useState(20);
  const [fnTimeout, setFnTimeout] = useState(60);
  const [triggerCategory, setTriggerCategory] = useState('GCS_OBJECT');
  const [gcsEventType, setGcsEventType] = useState(
    'google.cloud.storage.object.v1.finalized'
  );
  const [triggerBucket, setTriggerBucket] = useState('');
  const [triggerTopic, setTriggerTopic] = useState('orders-events-topic');
  const [cronSchedule, setCronSchedule] = useState('*/15 * * * *');
  const [allowUnauth, setAllowUnauth] = useState(true);
  const [enableRetry, setEnableRetry] = useState(true);
  const [codeLangPreview, setCodeLangPreview] = useState('NODEJS');
  const [deploying, setDeploying] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Synthetic CloudEvent Test Trace State
  const [testingFn, setTestingFn] = useState(null);
  const [testEventResult, setTestEventResult] = useState(null);

  // v1 vs v2 Affordability Calculator State
  const [simRps, setSimRps] = useState(40);
  const [simDurationMs, setSimDurationMs] = useState(250);
  const [simConcurrency, setSimConcurrency] = useState(80);

  const fetchFunctionsOverview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/functions/overview`
      );
      const data = res.data || {};
      setFunctionsList(data.functions || []);
      const bList = data.buckets || [`${projectId}-ingest-bucket`];
      setBuckets(bList);
      setTriggerBucket((prev) => prev || bList[0] || `${projectId}-ingest-bucket`);
      const tList = data.topics || ['orders-events-topic', 'dead-letter-events'];
      setTopics(tList);
    } catch {
      // ignore fallback errors
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchFunctionsOverview();
  }, [fetchFunctionsOverview]);

  const activeRecipe = useMemo(
    () =>
      TRIGGER_RECIPES.find((r) => r.id === triggerCategory) ||
      TRIGGER_RECIPES[0],
    [triggerCategory]
  );

  const filteredAdvCatalog = useMemo(() => {
    const q = advSearchQuery.trim().toLowerCase();
    return ADVANCED_EVENTARC_CATALOG.filter((item) => {
      if (advGroupFilter !== 'ALL' && item.group !== advGroupFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.plainEnglish.toLowerCase().includes(q) ||
        item.serviceName.toLowerCase().includes(q) ||
        item.methodName.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q)
      );
    });
  }, [advGroupFilter, advSearchQuery]);

  const activeAdvPreset = useMemo(
    () =>
      ADVANCED_EVENTARC_CATALOG.find((p) => p.id === selectedAdvPresetId) ||
      ADVANCED_EVENTARC_CATALOG[0],
    [selectedAdvPresetId]
  );

  // Synthesize starter code in Node.js 22, Python 3.12, or Go 1.23 for the selected Eventarc trigger
  const starterCode = useMemo(() => {
    const bucketName = triggerBucket || `${projectId}-ingest-bucket`;
    const isAudit =
      triggerCategory === 'UNIVERSAL_AUDIT' || triggerCategory === 'BIGQUERY_AUDIT';
    if (codeLangPreview === 'PYTHON') {
      if (isAudit) {
        return `import functions_framework
from cloudevents.http import CloudEvent

# CloudPulse 2026 — ${fnGen} Universal Eventarc Handler (${auditServiceName} -> ${auditMethodName})
@functions_framework.cloud_event
def ${fnEntryPoint}(cloud_event: CloudEvent) -> None:
    proto = (cloud_event.data or {}).get("protoPayload", {})
    resource_name = proto.get("resourceName", cloud_event.get("subject", ""))
    caller = proto.get("authenticationInfo", {}).get("principalEmail", "system")
    print(f"[Eventarc Audit] service={proto.get('serviceName', '${auditServiceName}')} method={proto.get('methodName', '${auditMethodName}')} resource={resource_name} caller={caller}")
`;
      }
      return `import functions_framework
from cloudevents.http import CloudEvent

# CloudPulse 2026 — ${fnGen} Eventarc Handler (${activeRecipe.title})
@functions_framework.cloud_event
def ${fnEntryPoint}(cloud_event: CloudEvent) -> None:
    event_id = cloud_event["id"]
    event_type = cloud_event["type"]
    data = cloud_event.data or {}
    print(f"[Eventarc] id={event_id} type={event_type} bucket={data.get('bucket', '${bucketName}')} name={data.get('name', '')}")
`;
    }
    if (codeLangPreview === 'GO') {
      return `package function

import (
\t"context"
\t"fmt"
\t"github.com/GoogleCloudPlatform/functions-framework-go/functions"
\t"github.com/cloudevents/sdk-go/v2/event"
)

func init() {
\tfunctions.CloudEvent("${fnEntryPoint}", ${fnEntryPoint})
}

func ${fnEntryPoint}(ctx context.Context, e event.Event) error {
\tfmt.Printf("[Eventarc] ID=%s Type=%s Source=%s Subject=%s\\n", e.ID(), e.Type(), e.Source(), e.Subject())
\treturn nil
}
`;
    }
    if (isAudit) {
      return `const functions = require('@google-cloud/functions-framework');

// CloudPulse 2026 — ${fnGen} Universal Eventarc Handler (${auditServiceName} -> ${auditMethodName})
functions.cloudEvent('${fnEntryPoint}', async (cloudEvent) => {
  const payload = cloudEvent.data || {};
  const proto = payload.protoPayload || {};
  console.log(JSON.stringify({
    severity: 'INFO',
    eventId: cloudEvent.id,
    serviceName: proto.serviceName || '${auditServiceName}',
    methodName: proto.methodName || '${auditMethodName}',
    resourceName: proto.resourceName || cloudEvent.subject || null,
    callerEmail: proto.authenticationInfo?.principalEmail || null,
    requestSpec: proto.request || null,
  }));
});`;
    }
    return `const functions = require('@google-cloud/functions-framework');

// CloudPulse 2026 — ${fnGen} Eventarc Handler (${activeRecipe.title})
functions.cloudEvent('${fnEntryPoint}', async (cloudEvent) => {
  const payload = cloudEvent.data || {};
  console.log(JSON.stringify({
    severity: 'INFO',
    eventId: cloudEvent.id,
    eventType: cloudEvent.type,
    source: cloudEvent.source,
    subject: cloudEvent.subject || null,
    bucket: payload.bucket || '${bucketName}',
    objectName: payload.name || null,
  }));
});`;
  }, [
    codeLangPreview,
    fnGen,
    activeRecipe,
    fnEntryPoint,
    triggerBucket,
    projectId,
    triggerCategory,
    auditServiceName,
    auditMethodName,
  ]);

  // Exact gcloud functions deploy CLI command
  const gcloudDeployCommand = useMemo(() => {
    const genFlag = fnGen === 'GEN_1' ? '--no-gen2' : '--gen2';
    const concFlag = fnGen === 'GEN_2' ? ` \\\n  --concurrency=${fnConcurrency}` : '';
    let triggerFlags = '';
    if (triggerCategory === 'GCS_OBJECT') {
      const b = triggerBucket || `${projectId}-ingest-bucket`;
      triggerFlags =
        fnGen === 'GEN_1'
          ? ` \\\n  --trigger-bucket="${b}"`
          : ` \\\n  --trigger-event-filters="type=${gcsEventType}" \\\n  --trigger-event-filters="bucket=${b}"`;
    } else if (triggerCategory === 'PUBSUB_TOPIC') {
      triggerFlags = ` \\\n  --trigger-topic="${triggerTopic || 'orders-events-topic'}"`;
    } else if (triggerCategory === 'BIGQUERY_AUDIT') {
      triggerFlags = ` \\\n  --trigger-event-filters="type=google.cloud.audit.log.v1.written" \\\n  --trigger-event-filters="serviceName=bigquery.googleapis.com" \\\n  --trigger-event-filters="methodName=google.cloud.bigquery.v2.JobService.InsertJob"`;
    } else if (triggerCategory === 'UNIVERSAL_AUDIT') {
      const evType = customEventType || 'google.cloud.audit.log.v1.written';
      if (evType === 'google.cloud.audit.log.v1.written') {
        const pathPatternLine =
          resourceNamePattern && resourceNamePattern.trim()
            ? ` \\\n  --trigger-event-filters-path-pattern="resourceName=${resourceNamePattern.trim()}"`
            : '';
        triggerFlags = ` \\\n  --trigger-event-filters="type=google.cloud.audit.log.v1.written" \\\n  --trigger-event-filters="serviceName=${auditServiceName}" \\\n  --trigger-event-filters="methodName=${auditMethodName}"${pathPatternLine}`;
      } else {
        triggerFlags = ` \\\n  --trigger-event-filters="type=${evType}"`;
      }
    } else if (triggerCategory === 'CRON_SCHEDULE') {
      triggerFlags = ` \\\n  --trigger-topic="${fnName}-cron-topic"`;
    } else {
      triggerFlags = ` \\\n  --trigger-http ${
        allowUnauth ? '--allow-unauthenticated' : '--no-allow-unauthenticated'
      }`;
    }
    const retryFlag =
      enableRetry && triggerCategory !== 'HTTPS_WEBHOOK' ? ' \\\n  --retry' : '';

    return `gcloud functions deploy ${fnName} \\
  ${genFlag} \\
  --region=${fnRegion} \\
  --runtime=${fnRuntime} \\
  --entry-point=${fnEntryPoint} \\
  --memory=${fnMemory} \\
  --min-instances=${fnMinInstances} \\
  --max-instances=${fnMaxInstances} \\
  --timeout=${fnTimeout}s${concFlag}${triggerFlags}${retryFlag} \\
  --project=${projectId}`;
  }, [
    fnName,
    fnGen,
    fnRegion,
    fnRuntime,
    fnEntryPoint,
    fnMemory,
    fnMinInstances,
    fnMaxInstances,
    fnTimeout,
    fnConcurrency,
    triggerCategory,
    triggerBucket,
    gcsEventType,
    triggerTopic,
    auditServiceName,
    auditMethodName,
    customEventType,
    resourceNamePattern,
    allowUnauth,
    enableRetry,
    projectId,
  ]);

  // Run 1-Tap Eventarc IAM Auto-Doctor
  const handleRunIamDoctor = async () => {
    setIamDoctorBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/functions/iam-doctor`
      );
      setIamDoctorReport(res.data);
      if (onShowToast) {
        onShowToast(res.data?.message || 'Eventarc IAM bindings verified!');
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error || 'Failed to run Eventarc IAM Auto-Doctor.'
        );
      }
    } finally {
      setIamDoctorBusy(false);
    }
  };

  // Deploy Cloud Function + Eventarc Trigger
  const handleDeployFunction = async (overrideConfig = null) => {
    const payload = overrideConfig || {
      name: fnName,
      region: fnRegion,
      generation: fnGen,
      runtime: fnRuntime,
      entryPoint: fnEntryPoint,
      memory: fnMemory,
      concurrency: fnConcurrency,
      minInstances: fnMinInstances,
      maxInstances: fnMaxInstances,
      timeoutSeconds: fnTimeout,
      triggerCategory,
      gcsEventType,
      triggerBucket: triggerBucket || `${projectId}-ingest-bucket`,
      triggerTopic,
      auditServiceName,
      auditMethodName,
      customEventType,
      resourceNamePattern,
      cronSchedule,
      allowUnauthenticated: allowUnauth,
      enableRetry,
    };

    setDeploying(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/functions/deploy`,
        payload
      );
      if (onShowToast) {
        onShowToast(res.data?.message || `Deploying ${payload.name}...`);
      }
      await fetchFunctionsOverview();
    } catch (err) {
      if (onShowToast) {
        onShowToast(
          err.response?.data?.error || 'Failed to deploy Cloud Function.'
        );
      }
    } finally {
      setDeploying(false);
    }
  };

  // Fire Synthetic CloudEvent v1.0 Test
  const handleTestCloudEvent = async (fnObj = null) => {
    const targetName = fnObj?.name || fnName;
    setTestingFn(targetName);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/functions/test-event`,
        {
          functionName: targetName,
          targetUri: fnObj?.uri || '',
          triggerCategory: fnObj?.triggerCategory || triggerCategory,
          eventType:
            fnObj?.eventType ||
            (triggerCategory === 'GCS_OBJECT'
              ? gcsEventType
              : triggerCategory === 'UNIVERSAL_AUDIT'
              ? customEventType
              : activeRecipe.eventTypeDefault),
          bucket:
            fnObj?.triggerBucket || triggerBucket || `${projectId}-ingest-bucket`,
          topic: fnObj?.triggerTopic || triggerTopic,
          auditServiceName,
          auditMethodName,
          resourceNamePattern,
        }
      );
      setTestEventResult(res.data);
      if (onShowToast) {
        onShowToast(
          `Fired CloudEvent (${res.data?.eventId}) → ${targetName} (${res.data?.liveDelivery?.totalLatencyMs}ms)!`
        );
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.response?.data?.error || 'Failed to test CloudEvent.');
      }
    } finally {
      setTestingFn(null);
    }
  };

  const handleDeleteFunction = async (fn) => {
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(
          projectId
        )}/functions/${encodeURIComponent(fn.location)}/${encodeURIComponent(
          fn.name
        )}?generation=${encodeURIComponent(fn.generation || 'GEN_2')}`
      );
      if (onShowToast) {
        onShowToast(res.data?.message || `Deleted ${fn.name}`);
      }
      await fetchFunctionsOverview();
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.response?.data?.error || `Failed to delete ${fn.name}`);
      }
    }
  };

  // v1 vs v2 Affordability Math
  const finopsComparison = useMemo(() => {
    const concurrentRequests = Math.max(
      1,
      Math.ceil((simRps * simDurationMs) / 1000)
    );
    // In v1, concurrency is hardcoded to 1 request per instance
    const v1ActiveInstances = concurrentRequests;
    // In v2, concurrency can be 80–250 requests per instance
    const v2ActiveInstances = Math.max(
      1,
      Math.ceil(concurrentRequests / Math.max(1, simConcurrency))
    );

    const monthlyInvocations = simRps * 3600 * 730;
    const billableInvocations = Math.max(0, monthlyInvocations - 2_000_000);
    const invocationFeeUsd = (billableInvocations / 1_000_000) * 0.4;

    const v1ComputeMonthlyUsd =
      v1ActiveInstances * 730 * 0.0185 + invocationFeeUsd;
    const v2ComputeMonthlyUsd =
      v2ActiveInstances * 730 * 0.022 + invocationFeeUsd * 0.5;
    const monthlySavingsUsd = Math.max(
      0,
      v1ComputeMonthlyUsd - v2ComputeMonthlyUsd
    );
    const savingsPct =
      v1ComputeMonthlyUsd > 0
        ? Math.min(
            88,
            Math.round((monthlySavingsUsd / v1ComputeMonthlyUsd) * 100)
          )
        : 0;

    return {
      concurrentRequests,
      v1ActiveInstances,
      v2ActiveInstances,
      v1Monthly: v1ComputeMonthlyUsd.toFixed(2),
      v2Monthly: v2ComputeMonthlyUsd.toFixed(2),
      monthlySavings: monthlySavingsUsd.toFixed(2),
      savingsPct,
    };
  }, [simRps, simDurationMs, simConcurrency]);

  const gen2Count = functionsList.filter((f) => f.generation === 'GEN_2').length;
  const gen1Count = functionsList.filter((f) => f.generation === 'GEN_1').length;

  return (
    <div className="space-y-5">
      {/* Top Studio Header & 1-Tap Eventarc IAM Auto-Doctor */}
      <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.07] via-zinc-900/40 to-indigo-500/[0.07] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                ⚡ CLOUD FUNCTIONS (v1 & v2) + DEMYSTIFIED EVENTARC STUDIO
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                2M Invocations/Mo Free Tier
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>
                Cloud Functions & Visual Eventarc Trigger Studio (`v1` Simplicity + `v2` Power)
              </span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-4xl">
              Newcomers stayed on legacy 1st Gen (`v1`) because Eventarc hid 3 required service-agent IAM roles, replaced simple dropdowns with raw CloudEvents strings, and mixed free Pub/Sub triggers with paid Audit Log triggers. Configure triggers in plain English, auto-fix IAM permissions in 1 click, and save up to 78% with Gen2 concurrency.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={iamDoctorBusy}
              onClick={handleRunIamDoctor}
              title="Automatically grant roles/pubsub.publisher to the GCS Service Agent, roles/eventarc.eventReceiver, and roles/run.invoker so v2 Eventarc triggers never fail with Permission Denied"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {iamDoctorBusy
                  ? 'Healing Eventarc IAM...'
                  : '🩺 1-Tap Eventarc IAM Auto-Doctor'}
              </span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={fetchFunctionsOverview}
              title="Refresh live Cloud Functions (v1 & v2), Eventarc triggers, buckets, and Pub/Sub topics"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`}
              />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              2nd Gen (`v2` Eventarc + Cloud Run)
            </div>
            <div className="text-lg font-extrabold font-mono text-emerald-500 mt-0.5">
              {gen2Count} Active
            </div>
            <div className="text-[10px] text-zinc-500">
              Up to 1,000 req/inst · 60m timeout
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              1st Gen (`v1` Legacy Functions)
            </div>
            <div className="text-lg font-extrabold font-mono text-amber-500 mt-0.5">
              {gen1Count} Legacy
            </div>
            <div className="text-[10px] text-zinc-500">
              1 req/inst limit · 1-Click Upgradable
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800">
            <div className="text-[10px] font-mono uppercase text-zinc-500">
              Selected Trigger Transport
            </div>
            <div className="text-xs font-extrabold font-mono text-cyan-500 mt-1 truncate">
              {activeRecipe.transportBadge}
            </div>
            <div className="text-[10px] text-zinc-500 truncate">
              {activeRecipe.title}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/80 dark:bg-zinc-950/70 border border-emerald-500/30">
            <div className="text-[10px] font-mono uppercase text-emerald-500">
              Gen2 Concurrency Savings vs v1
            </div>
            <div className="text-lg font-extrabold font-mono text-emerald-400 mt-0.5">
              -{finopsComparison.savingsPct}% (${finopsComparison.monthlySavings}/mo)
            </div>
            <div className="text-[10px] text-zinc-500">
              {finopsComparison.v2ActiveInstances} Gen2 inst vs{' '}
              {finopsComparison.v1ActiveInstances} v1 inst
            </div>
          </div>
        </div>

        {/* Eventarc IAM Auto-Doctor Live Report Banner */}
        {iamDoctorReport && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{iamDoctorReport.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setIamDoctorReport(null)}
                className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(iamDoctorReport.bindings || []).map((b, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800 text-[11px] font-mono flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-emerald-300 font-bold truncate">
                      {b.role}
                    </div>
                    <div className="text-[10px] text-zinc-400 truncate">
                      {b.label}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-emerald-500/20 text-emerald-300 shrink-0">
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sub-Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
          {[
            {
              id: 'TRIGGER_WIZARD',
              label: '🎯 1. Plain-English Eventarc Trigger Wizard & Visual X-Ray',
            },
            {
              id: 'LIVE_FLEET',
              label: `⚡ 2. Live Functions Fleet & 1-Click v1→v2 Upgrader (${functionsList.length})`,
            },
            {
              id: 'FINOPS_COMPARE',
              label: '💰 3. 1st Gen (v1) vs 2nd Gen (v2) Concurrency & Cost Calculator',
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-white/70 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* SUB-TAB 1: PLAIN-ENGLISH EVENTARC TRIGGER WIZARD & 4-HOP VISUAL PIPELINE */}
      {activeSubTab === 'TRIGGER_WIZARD' && (
        <div className="space-y-4">
          {/* Step 1: Pick Event Trigger (Dual-Mode: Beginner Everyday Recipes vs Advanced Universal 130+ GCP Services Catalog) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 space-y-3.5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider font-mono text-amber-500">
                  Step 1 — Pick Your Trigger: Everyday Recipes or Any Google Cloud Event (130+ Services)
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Start with 1-click recipes for Storage/PubSub/Cron, or switch to{' '}
                  <strong className="text-indigo-400">Advanced Universal Eventarc</strong> to trigger from VM creation, Firewall rules, IAM keys, GKE clusters, or Cloud SQL!
                </p>
              </div>

              {/* Dual-Mode Toggle: Beginner vs Advanced Universal Eventarc */}
              <div className="inline-flex rounded-xl p-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setWizardMode('BEGINNER');
                    if (triggerCategory === 'UNIVERSAL_AUDIT') {
                      setTriggerCategory('GCS_OBJECT');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    wizardMode === 'BEGINNER'
                      ? 'bg-amber-500 text-zinc-950 shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  🌱 Beginner Mode (5 Essential Recipes)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWizardMode('ADVANCED');
                    setTriggerCategory('UNIVERSAL_AUDIT');
                    setFnGen('GEN_2');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    wizardMode === 'ADVANCED'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  🚀 Advanced: Universal GCP Events (VM Creation, IAM, GKE, SQL...)
                </button>
              </div>
            </div>

            {wizardMode === 'BEGINNER' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {TRIGGER_RECIPES.filter((r) => r.id !== 'UNIVERSAL_AUDIT').map((rec) => {
                  const active = triggerCategory === rec.id;
                  return (
                    <button
                      key={rec.id}
                      type="button"
                      onClick={() => {
                        setTriggerCategory(rec.id);
                        if (rec.id === 'GCS_OBJECT') {
                          setGcsEventType(rec.eventTypeDefault);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        active
                          ? 'bg-amber-500/15 border-amber-500 text-zinc-950 dark:text-zinc-100 shadow-sm'
                          : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-amber-500/40'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-extrabold font-mono">
                          {rec.title}
                        </div>
                        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                          {rec.plainEnglish}
                        </p>
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800 text-[9.5px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                        {rec.transportBadge}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* ADVANCED UNIVERSAL EVENTARC CATALOG (130+ GCP SERVICES) */
              <div className="space-y-3 pt-1">
                {/* Architectural FinOps Insight Banner for Advanced Mode */}
                <div className="p-3 rounded-xl bg-indigo-500/[0.08] border border-indigo-500/30 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-zinc-700 dark:text-zinc-200">
                    <span className="font-bold font-mono text-indigo-400">
                      💡 Why Eventarc Universal Triggers Are Game-Changing:
                    </span>{' '}
                    In 1st Gen (`v1`), you could never trigger a function when a{' '}
                    <strong>Compute VM was created</strong> or an{' '}
                    <strong>IAM key was exported</strong>. Eventarc (`v2`) taps directly into{' '}
                    <code className="text-emerald-400 font-mono">ADMIN_ACTIVITY</code> Cloud Audit Logs—which are{' '}
                    <strong className="text-emerald-400">
                      ALWAYS ON by default in Google Cloud and 100% FREE ($0.00 ingestion fee)
                    </strong>
                    !
                  </div>
                </div>

                {/* Category Filter Pills + Search Input */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'ALL', label: '🌐 All GCP Events (14)' },
                      { id: 'COMPUTE_VM', label: '🖥️ Compute VM & Disks' },
                      { id: 'IAM_SECURITY', label: '🛡️ IAM, Keys & Firewall' },
                      { id: 'GKE_CONTAINERS', label: '☸️ GKE & Cloud Run' },
                      { id: 'DATABASES', label: '🐘 Cloud SQL & Firestore' },
                    ].map((grp) => (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => setAdvGroupFilter(grp.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-all ${
                          advGroupFilter === grp.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/40'
                        }`}
                      >
                        {grp.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={advSearchQuery}
                    onChange={(e) => setAdvSearchQuery(e.target.value)}
                    placeholder="Search e.g. 'vm creation', 'instances.insert', 'firewall', 'iam'..."
                    className="w-full sm:w-80 h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Searchable Grid of Universal GCP Events */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {filteredAdvCatalog.map((preset) => {
                    const isSelected =
                      triggerCategory === 'UNIVERSAL_AUDIT' &&
                      selectedAdvPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setTriggerCategory('UNIVERSAL_AUDIT');
                          setFnGen('GEN_2');
                          setSelectedAdvPresetId(preset.id);
                          setAuditServiceName(preset.serviceName);
                          setAuditMethodName(preset.methodName);
                          setCustomEventType(preset.eventType);
                          setFnName(preset.suggestedFnName);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-500/15 border-indigo-500 text-zinc-950 dark:text-zinc-100 shadow-sm'
                            : 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-indigo-500/40'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono font-bold text-indigo-400">
                              {preset.badge}
                            </span>
                            <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                              $0 Free
                            </span>
                          </div>
                          <div className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                            {preset.title}
                          </div>
                          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
                            {preset.plainEnglish}
                          </p>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800 space-y-0.5">
                          <div className="text-[9.5px] font-mono text-cyan-500 truncate">
                            svc: {preset.serviceName}
                          </div>
                          <div
                            className="text-[9.5px] font-mono text-amber-500 truncate"
                            title={preset.methodName}
                          >
                            method: {preset.methodName}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Interactive 4-Stage "How Eventarc Actually Works" Visual Pipeline X-Ray */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-indigo-500/30 space-y-3 text-zinc-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-extrabold font-mono uppercase tracking-wider text-amber-300">
                  Step 2 — Visual Eventarc X-Ray: How Your Trigger Actually Works Under the Hood
                </span>
              </div>
              <button
                type="button"
                disabled={Boolean(testingFn)}
                onClick={() => handleTestCloudEvent(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>
                  {testingFn
                    ? 'Firing CloudEvent...'
                    : '🧪 Fire Live Test CloudEvent Through Pipeline'}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Stage 1: Producer */}
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-amber-400 font-bold">
                  <span>1. EVENT PRODUCER</span>
                  <span>CloudEvents v1.0</span>
                </div>
                <div
                  className="text-xs font-bold font-mono text-white truncate"
                  title={
                    triggerCategory === 'UNIVERSAL_AUDIT'
                      ? `${auditServiceName} (${auditMethodName})`
                      : ''
                  }
                >
                  {triggerCategory === 'GCS_OBJECT'
                    ? `gs://${triggerBucket || `${projectId}-ingest-bucket`}`
                    : triggerCategory === 'PUBSUB_TOPIC'
                    ? `projects/${projectId}/topics/${triggerTopic}`
                    : triggerCategory === 'BIGQUERY_AUDIT'
                    ? 'bigquery.googleapis.com (InsertJob)'
                    : triggerCategory === 'UNIVERSAL_AUDIT'
                    ? `${auditServiceName} (${auditMethodName})`
                    : triggerCategory === 'CRON_SCHEDULE'
                    ? `Cloud Scheduler (${cronSchedule})`
                    : 'HTTPS Client / Webhook Caller'}
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-snug">
                  {triggerCategory === 'UNIVERSAL_AUDIT'
                    ? `Emits a CloudEvent envelope containing protoPayload.resourceName & caller Email the instant ${auditMethodName} occurs.`
                    : 'Emits a structured JSON event the instant your resource changes.'}
                </p>
              </div>

              {/* Stage 2: Transport Bus & Cost Transparency */}
              <div
                className={`p-3 rounded-xl border space-y-1.5 ${
                  activeRecipe.transportMode === 'CLOUD_AUDIT_LOGS'
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-emerald-950/25 border-emerald-500/30'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                  <span
                    className={
                      activeRecipe.transportMode === 'CLOUD_AUDIT_LOGS'
                        ? 'text-amber-300'
                        : 'text-emerald-300'
                    }
                  >
                    2. TRANSPORT & BILLING
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 text-[9.5px]">
                    {activeRecipe.transportMode === 'CLOUD_AUDIT_LOGS'
                      ? 'AUDIT LOG BUS'
                      : '$0 FREE BUS'}
                  </span>
                </div>
                <div className="text-xs font-bold font-mono text-white">
                  {activeRecipe.transportBadge}
                </div>
                <p className="text-[10.5px] text-zinc-300 leading-snug">
                  {activeRecipe.costNote}
                </p>
              </div>

              {/* Stage 3: Eventarc Router & Hidden IAM Roles */}
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-cyan-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400 font-bold">
                  <span>3. EVENTARC & IAM ROLES</span>
                  <span>{enableRetry ? 'Retry ON' : 'No Retry'}</span>
                </div>
                <div className="text-xs font-bold font-mono text-white truncate">
                  {triggerCategory === 'GCS_OBJECT'
                    ? gcsEventType
                    : triggerCategory === 'UNIVERSAL_AUDIT'
                    ? `${customEventType} (${auditMethodName})`
                    : activeRecipe.eventTypeDefault}
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-snug">
                  {activeRecipe.hiddenIamNote}
                </p>
              </div>

              {/* Stage 4: Function Consumer */}
              <div className="p-3 rounded-xl bg-zinc-900/90 border border-indigo-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400 font-bold">
                  <span>4. FUNCTION RUNTIME</span>
                  <span>
                    {fnGen === 'GEN_2'
                      ? `${fnConcurrency}x Concurrency`
                      : '1x Legacy v1'}
                  </span>
                </div>
                <div className="text-xs font-bold font-mono text-white truncate">
                  {fnName} ({fnRuntime} · {fnMemory})
                </div>
                <p className="text-[10.5px] text-zinc-400 leading-snug">
                  Receives HTTP POST with <code className="text-indigo-300">ce-id</code>,{' '}
                  <code className="text-indigo-300">ce-type</code>, and{' '}
                  <code className="text-indigo-300">ce-source</code> headers.
                </p>
              </div>
            </div>

            {/* Live Synthetic CloudEvent Test Output */}
            {testEventResult && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-indigo-300">
                    ⚡ Synthetic CloudEvent Trace ({testEventResult.eventId}) — Total{' '}
                    {testEventResult.liveDelivery?.totalLatencyMs}ms (HTTP{' '}
                    {testEventResult.liveDelivery?.httpStatus})
                  </span>
                  <button
                    type="button"
                    onClick={() => setTestEventResult(null)}
                    className="text-[10px] font-mono text-zinc-400 hover:text-white"
                  >
                    Close Trace
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {(testEventResult.liveDelivery?.hops || []).map((h, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-zinc-950/90 border border-zinc-800 text-[10.5px] font-mono"
                    >
                      <div className="flex items-center justify-between text-emerald-400 font-bold">
                        <span>{h.hop}</span>
                        <span>{h.latencyMs}ms</span>
                      </div>
                      <div className="text-zinc-400 mt-0.5 truncate" title={h.detail}>
                        {h.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Function & Trigger Configuration Form + Starter Code */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 p-4 rounded-2xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider font-mono text-zinc-800 dark:text-zinc-200">
                  Step 3 — Configure Function & Eventarc Filter
                </span>
                <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-800 p-0.5 bg-zinc-100 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setFnGen('GEN_2');
                      setFnConcurrency(80);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold cursor-pointer ${
                      fnGen === 'GEN_2'
                        ? 'bg-emerald-600 text-white'
                        : 'text-zinc-500'
                    }`}
                  >
                    2nd Gen (v2 · Eventarc · -78% Cost)
                  </button>
                  <button
                    type="button"
                    disabled={triggerCategory === 'UNIVERSAL_AUDIT'}
                    title={
                      triggerCategory === 'UNIVERSAL_AUDIT'
                        ? 'Universal GCP Eventarc triggers (VM creation, IAM, GKE, SQL) require 2nd Gen (v2)'
                        : 'Switch to 1st Gen (v1)'
                    }
                    onClick={() => {
                      setFnGen('GEN_1');
                      setFnConcurrency(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-mono font-bold cursor-pointer disabled:opacity-40 ${
                      fnGen === 'GEN_1'
                        ? 'bg-amber-500 text-zinc-950'
                        : 'text-zinc-500'
                    }`}
                  >
                    1st Gen (v1 Classic)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                <div className="min-w-0">
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap">
                    Function Name
                  </label>
                  <input
                    type="text"
                    value={fnName}
                    onChange={(e) => setFnName(e.target.value)}
                    className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap">
                    Region
                  </label>
                  <select
                    value={fnRegion}
                    onChange={(e) => setFnRegion(e.target.value)}
                    className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="us-central1">us-central1 (Iowa · Tier-1)</option>
                    <option value="us-east1">us-east1 (S. Carolina · Tier-1)</option>
                    <option value="us-west1">us-west1 (Oregon · 90% CFE)</option>
                    <option value="europe-west1">europe-west1 (Belgium)</option>
                    <option value="europe-west3">europe-west3 (Frankfurt GDPR)</option>
                    <option value="asia-northeast1">asia-northeast1 (Tokyo)</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap">
                    Runtime Engine
                  </label>
                  <select
                    value={fnRuntime}
                    onChange={(e) => setFnRuntime(e.target.value)}
                    className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="nodejs22">Node.js 22 LTS (nodejs22)</option>
                    <option value="nodejs20">Node.js 20 LTS (nodejs20)</option>
                    <option value="python312">Python 3.12 (python312)</option>
                    <option value="go123">Go 1.23 (go123)</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Trigger-Specific Fields */}
              {triggerCategory === 'UNIVERSAL_AUDIT' && (
                <div className="p-3 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[11px] font-mono font-bold text-indigo-400">
                      🎛️ Universal Eventarc Filter Composer (Edit Any GCP Service, Method, or Resource Wildcard)
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setResourceNamePattern(
                          activeAdvPreset?.samplePathPattern ||
                            '/projects/*/zones/*/instances/prod-*'
                        )
                      }
                      className="text-[10px] font-mono text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Fill Sample Path Wildcard ({activeAdvPreset?.samplePathPattern || '/projects/*/zones/*/instances/*'})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                    <div className="min-w-0">
                      <label
                        title="Google Cloud API serviceName (e.g. compute.googleapis.com, iam.googleapis.com, container.googleapis.com)"
                        className="block text-[11px] font-mono text-indigo-600 dark:text-indigo-300 mb-1 truncate whitespace-nowrap"
                      >
                        GCP Service (`serviceName`)
                      </label>
                      <input
                        type="text"
                        value={auditServiceName}
                        onChange={(e) => setAuditServiceName(e.target.value)}
                        placeholder="compute.googleapis.com"
                        className="w-full h-[34px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Audit Log methodName (e.g. v1.compute.instances.insert for VM creation)"
                        className="block text-[11px] font-mono text-indigo-600 dark:text-indigo-300 mb-1 truncate whitespace-nowrap"
                      >
                        API Method (`methodName`)
                      </label>
                      <input
                        type="text"
                        value={auditMethodName}
                        onChange={(e) => setAuditMethodName(e.target.value)}
                        placeholder="v1.compute.instances.insert"
                        className="w-full h-[34px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="min-w-0">
                      <label
                        title="Optional Eventarc path pattern filter (--trigger-event-filters-path-pattern) using * wildcards"
                        className="block text-[11px] font-mono text-indigo-600 dark:text-indigo-300 mb-1 truncate whitespace-nowrap"
                      >
                        Resource Path Wildcard (Optional)
                      </label>
                      <input
                        type="text"
                        value={resourceNamePattern}
                        onChange={(e) => setResourceNamePattern(e.target.value)}
                        placeholder="e.g. /projects/*/zones/*/instances/prod-*"
                        className="w-full h-[34px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {triggerCategory === 'GCS_OBJECT' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/30 items-end">
                  <div className="min-w-0">
                    <label className="block text-[11px] font-mono text-amber-600 dark:text-amber-300 mb-1 truncate whitespace-nowrap">
                      Target Cloud Storage Bucket
                    </label>
                    <select
                      value={triggerBucket}
                      onChange={(e) => setTriggerBucket(e.target.value)}
                      className="w-full h-[34px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    >
                      {buckets.map((b) => (
                        <option key={b} value={b}>
                          🪣 gs://{b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label className="block text-[11px] font-mono text-amber-600 dark:text-amber-300 mb-1 truncate whitespace-nowrap">
                      Storage Lifecycle Event
                    </label>
                    <select
                      value={gcsEventType}
                      onChange={(e) => setGcsEventType(e.target.value)}
                      className="w-full h-[34px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    >
                      {activeRecipe.eventSubtypes.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {triggerCategory === 'PUBSUB_TOPIC' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 rounded-xl bg-cyan-500/[0.06] border border-cyan-500/30 items-end">
                  <div className="min-w-0">
                    <label className="block text-[11px] font-mono text-cyan-600 dark:text-cyan-300 mb-1 truncate whitespace-nowrap">
                      Pub/Sub Topic (Auto-Created if Missing)
                    </label>
                    <input
                      type="text"
                      value={triggerTopic}
                      onChange={(e) => setTriggerTopic(e.target.value)}
                      placeholder="orders-events-topic"
                      className="w-full h-[34px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="block text-[11px] font-mono text-cyan-600 dark:text-cyan-300 mb-1 truncate whitespace-nowrap">
                      Retry on Crash / Timeout
                    </label>
                    <button
                      type="button"
                      onClick={() => setEnableRetry((v) => !v)}
                      className="w-full h-[34px] rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 text-xs font-mono text-cyan-600 dark:text-cyan-300 text-left truncate"
                    >
                      {enableRetry
                        ? '✓ Exponential Backoff Retry ON (--retry)'
                        : '○ Drop Failed Events (No Retry)'}
                    </button>
                  </div>
                </div>
              )}

              {/* Scaling & Concurrency Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                <div className="min-w-0">
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap">
                    Memory Limit
                  </label>
                  <select
                    value={fnMemory}
                    onChange={(e) => setFnMemory(e.target.value)}
                    className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="256Mi">256Mi</option>
                    <option value="512Mi">512Mi</option>
                    <option value="1Gi">1Gi</option>
                    <option value="2Gi">2Gi</option>
                    <option value="4Gi">4Gi</option>
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    title="2nd Gen allows up to 1,000 concurrent requests per instance; 1st Gen is locked to 1"
                    className="block text-[11px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap"
                  >
                    Concurrency
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    disabled={fnGen === 'GEN_1'}
                    value={fnGen === 'GEN_1' ? 1 : fnConcurrency}
                    onChange={(e) => setFnConcurrency(Number(e.target.value))}
                    className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-50"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap">
                    Min Inst (0=$0)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={fnMinInstances}
                    onChange={(e) => setFnMinInstances(Number(e.target.value))}
                    className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1 truncate whitespace-nowrap">
                    Max Inst (Cap)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={fnMaxInstances}
                    onChange={(e) => setFnMaxInstances(Number(e.target.value))}
                    className="w-full h-[34px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(gcloudDeployCommand);
                      setCopiedCmd(true);
                      setTimeout(() => setCopiedCmd(false), 1800);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    {copiedCmd ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCmd ? 'Copied CLI!' : 'Copy gcloud CLI'}</span>
                  </button>

                  {onRunInShell && (
                    <button
                      type="button"
                      onClick={() => onRunInShell(gcloudDeployCommand)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono border border-indigo-500/40 bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Send to Cloud Shell</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={deploying}
                  onClick={() => handleDeployFunction(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-extrabold bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4" />
                  <span>
                    {deploying
                      ? 'Deploying via Cloud Build...'
                      : `🚀 Deploy ${fnGen} Function + Trigger`}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Auto-Generated CloudEvents Starter Code & CLI Preview */}
            <div className="lg:col-span-5 p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 text-zinc-100 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-amber-400 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4" />
                    <span>CloudEvents v1.0 Handler Code</span>
                  </span>
                  <div className="inline-flex rounded-lg bg-zinc-900 p-0.5 border border-zinc-800">
                    {['NODEJS', 'PYTHON', 'GO'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setCodeLangPreview(lang)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                          codeLangPreview === lang
                            ? 'bg-amber-500 text-zinc-950'
                            : 'text-zinc-400'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <pre className="p-3 rounded-xl bg-black/70 border border-zinc-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-48">
                  {starterCode}
                </pre>
              </div>

              <div className="space-y-1.5">
                <div className="text-[10.5px] font-mono text-zinc-400">
                  Synthesized Eventarc / Cloud Functions CLI Command:
                </div>
                <pre className="p-2.5 rounded-xl bg-black/70 border border-zinc-800 text-[10.5px] font-mono text-cyan-300 overflow-x-auto">
                  {gcloudDeployCommand}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LIVE FUNCTIONS FLEET & 1-CLICK v1 -> v2 UPGRADER */}
      {activeSubTab === 'LIVE_FLEET' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                Live Cloud Functions (`v1` & `v2`) & Eventarc Trigger Inventory
              </h3>
              <p className="text-xs text-zinc-500">
                Inspect running functions, test-fire synthetic CloudEvents, or upgrade 1st Gen (`v1`) functions to 2nd Gen (`v2`) in 1 click.
              </p>
            </div>
          </div>

          {functionsList.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center space-y-2">
              <Zap className="w-7 h-7 text-amber-500 mx-auto" />
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                No Cloud Functions Deployed in {projectId} Yet
              </div>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                Use the Plain-English Eventarc Trigger Wizard in Tab 1 to deploy your first 2nd Gen Cloud Function with automatic IAM binding verification.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('TRIGGER_WIZARD')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 text-zinc-950 cursor-pointer"
              >
                Open Trigger Wizard
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {functionsList.map((fn) => (
                <div
                  key={fn.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                        ⚡ {fn.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          fn.generation === 'GEN_2'
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                        }`}
                      >
                        {fn.generation === 'GEN_2'
                          ? '2nd Gen (v2 · Eventarc)'
                          : '1st Gen (v1 Legacy · 1 req/inst)'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        {fn.location} · {fn.runtime} · {fn.memory} ·{' '}
                        {fn.concurrency}x concurrency
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 truncate">
                      Trigger: <span className="text-cyan-500">{fn.eventType}</span>
                      {fn.triggerBucket ? ` (gs://${fn.triggerBucket})` : ''}
                      {fn.triggerTopic ? ` (topic: ${fn.triggerTopic})` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleTestCloudEvent(fn)}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 cursor-pointer"
                    >
                      🧪 Test CloudEvent
                    </button>

                    {fn.generation === 'GEN_1' && (
                      <button
                        type="button"
                        disabled={deploying}
                        onClick={() =>
                          handleDeployFunction({
                            name: fn.name,
                            region: fn.location,
                            generation: 'GEN_2',
                            runtime: 'nodejs22',
                            entryPoint: fn.entryPoint || fn.name,
                            memory: fn.memory || '512Mi',
                            concurrency: 80,
                            minInstances: fn.minInstances || 0,
                            maxInstances: fn.maxInstances || 20,
                            timeoutSeconds: fn.timeoutSeconds || 60,
                            triggerCategory: fn.triggerCategory || 'HTTPS_WEBHOOK',
                            triggerBucket: fn.triggerBucket,
                            triggerTopic: fn.triggerTopic,
                            enableRetry: true,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                      >
                        🚀 1-Click Upgrade v1 → v2 (-78% Cost)
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteFunction(fn)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15 cursor-pointer"
                      title={`Delete ${fn.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: 1ST GEN (v1) vs 2ND GEN (v2 + EVENTARC) AFFORDABILITY & CONCURRENCY CALCULATOR */}
      {activeSubTab === 'FINOPS_COMPARE' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                💰 Why 2nd Gen (`v2` + Eventarc) Is Up to 78% Cheaper Than 1st Gen (`v1`)
              </h3>
              <p className="text-xs text-zinc-500">
                In 1st Gen (`v1`), each function instance can only process 1 request at a time. In 2nd Gen (`v2`), a single instance handles up to 1,000 concurrent requests while waiting on BigQuery, Cloud SQL, or Vertex AI I/O.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-500">Incoming Event Rate:</span>
                <span className="font-bold text-amber-500">{simRps} events/sec</span>
              </div>
              <input
                type="range"
                min={1}
                max={300}
                value={simRps}
                onChange={(e) => setSimRps(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-500">Avg I/O Execution Time:</span>
                <span className="font-bold text-cyan-500">{simDurationMs} ms</span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={simDurationMs}
                onChange={(e) => setSimDurationMs(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-zinc-500">2nd Gen Concurrency:</span>
                <span className="font-bold text-emerald-500">
                  {simConcurrency} req/instance
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={250}
                step={10}
                value={simConcurrency}
                onChange={(e) => setSimConcurrency(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/[0.04] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-rose-400">
                  1st Gen (`v1` Classic · Concurrency Locked to 1)
                </span>
                <span className="text-sm font-extrabold font-mono text-rose-400">
                  ${finopsComparison.v1Monthly}/mo
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-500">
                Requires <strong>{finopsComparison.v1ActiveInstances} parallel instances</strong>{' '}
                running simultaneously · Max timeout 9 mins · No Eventarc CloudEvents standard.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-emerald-400">
                  2nd Gen (`v2` Cloud Run Functions + Eventarc)
                </span>
                <span className="text-sm font-extrabold font-mono text-emerald-400">
                  ${finopsComparison.v2Monthly}/mo (Save ${finopsComparison.monthlySavings}/mo)
                </span>
              </div>
              <div className="text-xs font-mono text-zinc-500">
                Requires only <strong>{finopsComparison.v2ActiveInstances} shared instance(s)</strong>{' '}
                at {simConcurrency}x concurrency · Max timeout 60 mins · Direct VPC Egress & GCS FUSE support.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
