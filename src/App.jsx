import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
  Cloud,
  Sun,
  Moon,
  Sparkles,
  RefreshCw,
  ChevronDown,
  Check,
  CheckCircle2,
  Terminal,
  BarChart3,
  Layers,
  LayoutDashboard,
  Smartphone,
  Monitor,
  ShieldCheck,
  Wifi,
  BatteryCharging,
  PlusCircle,
  Server,
  LogOut,
  Rocket,
  Network,
  Command,
  DollarSign,
  BookOpen,
  Globe,
  HardDrive,
  Database,
  Flame,
  PackageCheck,
  Cpu,
  Zap,
  CreditCard,
  AlertTriangle,
  History,
  Wand2,
  Trash2,
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  TimezoneProvider,
  useTimezone,
  TimezoneSelectorPill,
} from './context/TimezoneContext';
import SortableKpiRow from './components/SortableKpiRow';
import TelemetryCharts from './components/TelemetryCharts';
import ResourceControlCenter from './components/ResourceControlCenter';
import PersonaContextualHelper from './components/PersonaContextualHelper';
import LogStreamerAndShell from './components/LogStreamerAndShell';
import GeminiCopilotModal from './components/GeminiCopilotModal';
import ResourceProvisionModal from './components/ResourceProvisionModal';
import VmFleetAndSsh from './components/VmFleetAndSsh';
import VpcNetworksAndFirewalls from './components/VpcNetworksAndFirewalls';
import EmergencyApiKillSwitch from './components/EmergencyApiKillSwitch';
import CloudRunFleetManager from './components/CloudRunFleetManager';
import CloudFunctionsEventarcStudio from './components/CloudFunctionsEventarcStudio';
import GkeFleetStudio from './components/GkeFleetStudio';
import CloudStorageStudio from './components/CloudStorageStudio';
import BigQueryStudio from './components/BigQueryStudio';
import BigLakeIcebergStudio from './components/BigLakeIcebergStudio';
import CloudSqlAndAlloyDbStudio from './components/CloudSqlAndAlloyDbStudio';
import SovereignTimeMachineIamStudio from './components/SovereignTimeMachineIamStudio';
import SreWarRoomPerimeterStudio from './components/SreWarRoomPerimeterStudio';
import Wave9AiGkeSqlSupplyChainStudio from './components/Wave9AiGkeSqlSupplyChainStudio';
import Wave10Frontier2026Studio from './components/Wave10Frontier2026Studio';
import AuthOnboardingGate from './components/AuthOnboardingGate';
import CloudRunDeployModal from './components/CloudRunDeployModal';
import Revolutionary2026Suite, {
  calculateLiveBurnRate,
} from './components/Revolutionary2026Suite';
import CommandPaletteModal from './components/CommandPaletteModal';
import OrbitalControlPlaneDrawer, {
  computeOrbitalTelemetry,
} from './components/OrbitalControlPlaneDrawer';
import InteractiveDocsGuide from './components/InteractiveDocsGuide';
import GlobalNetworkWorldMap from './components/GlobalNetworkWorldMap';
import DataEngineeringStudio from './components/DataEngineeringStudio';
import BillingAccountCreditGuardian, {
  summarizeCreditLedger,
  syncAndAggregateBillingIndexedDb,
} from './components/BillingAccountCreditGuardian';
import GdeStreamerPrivacyShield, {
  loadGdePrivacyConfig,
  redactTextForGdeMode,
} from './components/GdeStreamerPrivacyShield';
import AwsAzureEnvySuiteStudio from './components/AwsAzureEnvySuiteStudio';
import GoogleCloudRemoteMcpStudio from './components/GoogleCloudRemoteMcpStudio';
import AutonomousCloudSocStudio from './components/AutonomousCloudSocStudio';
import StudioGcpAdvantageBar from './components/StudioGcpAdvantageBar';
import GlobalInnovationHoverExplainer from './components/InnovationHoverExplainer';
import Startup10xMentorStudio from './components/Startup10xMentorStudio';
import CloudRecycleBinStudio from './components/CloudRecycleBinStudio';
import EnterpriseStackPipelineBar from './components/EnterpriseStackPipelineBar';
import DataLakehouseAiPipelineBar from './components/DataLakehouseAiPipelineBar';

/**
 * Classifies any outgoing Axios request to determine if it performs a permanent
 * deletion or destructive resource teardown on Google Cloud.
 * Every matching request is paused until the engineer explicitly confirms it in
 * the Mandatory Delete & Destructive Action Confirmation Modal.
 */
function classifyDestructiveAxiosConfig(config) {
  if (!config || !config.url) return null;
  if (
    config.headers &&
    (config.headers['x-confirmed-delete'] === 'true' ||
      (typeof config.headers.get === 'function' &&
        config.headers.get('x-confirmed-delete') === 'true'))
  ) {
    return null;
  }

  const method = String(config.method || 'get').toLowerCase();
  const rawUrl = String(config.url || '');
  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};
  if (body.confirmedByModal === true) {
    return null;
  }
  const params = config.params || {};

  // Decode project from URL if present
  const projMatch = rawUrl.match(/\/api\/project\/([^/]+)/);
  const projectId = projMatch ? decodeURIComponent(projMatch[1]) : 'Active GCP Project';

  // 1. All HTTP DELETE requests
  if (method === 'delete') {
    // Cloud Run v2 Batch Job delete (/cloudrun/jobs/:region/:jobName)
    const runJobMatch = rawUrl.match(/\/cloudrun\/jobs\/([^/]+)\/([^/?]+)/);
    if (runJobMatch) {
      const region = decodeURIComponent(runJobMatch[1]);
      const jobName = decodeURIComponent(runJobMatch[2]);
      return {
        title: `Permanently Delete Cloud Run v2 Batch Job "${jobName}"`,
        resourceKind: 'Cloud Run v2 Batch Job (run.googleapis.com/v2)',
        targetName: jobName,
        location: region,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        whatHappensNext: `1. Calls DELETE https://run.googleapis.com/v2/projects/${projectId}/locations/${region}/jobs/${jobName}.\n2. Removes the batch job definition and execution history while keeping any mounted Cloud Storage FUSE bucket (gs://...) and Artifact Registry container image safe.`,
        impactWarning: `This will permanently delete Cloud Run v2 Batch Job "${jobName}" in ${region} (${projectId}). Any attached Cloud Storage FUSE bucket remains intact.`,
      };
    }

    // Generic resource delete (/api/project/:id/resource)
    if (rawUrl.endsWith('/resource') && !rawUrl.includes('/data-engineer/resource')) {
      const rType = body.resourceType || body.type || 'Google Cloud Resource';
      const rName = body.name || 'selected-resource';
      const rRegion = body.region || 'global';
      if (rType === 'Cloud Run Service' || rType === 'CLOUD_RUN') {
        return {
          title: `Decommission Cloud Run v2 Service "${rName}" (${rRegion})`,
          resourceKind: 'Cloud Run v2 Serverless Service',
          targetName: rName,
          location: rRegion,
          projectId,
          method: 'DELETE',
          endpoint: rawUrl,
          whatHappensNext: `1. Calls DELETE https://run.googleapis.com/v2/projects/${projectId}/locations/${rRegion}/services/${rName}.\n2. Drains the HTTPS .run.app ingress endpoint and terminates all revisions in ${rRegion}.\n3. Preserves your container image in Artifact Registry and any attached Cloud Storage FUSE disk bucket unless explicitly marked for cleanup.`,
          impactWarning: `This will permanently terminate Cloud Run service "${rName}" (${rRegion}) and its HTTPS endpoint in project "${projectId}".`,
        };
      }
      return {
        title: `Permanently Delete ${rType}`,
        resourceKind: rType,
        targetName: rName,
        location: rRegion,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This action will permanently delete the ${rType} "${rName}" (${rRegion}) from Google Cloud project "${projectId}". Associated data, endpoints, or network bindings cannot be recovered once destroyed.`,
      };
    }

    // Cloud Storage object delete (/storage/buckets/:bucket/objects)
    const gcsObjMatch = rawUrl.match(/\/storage\/buckets\/([^/]+)\/objects/);
    if (gcsObjMatch) {
      const bucket = decodeURIComponent(gcsObjMatch[1]);
      const objName =
        params.objectName ||
        body.objectName ||
        new URLSearchParams(rawUrl.split('?')[1] || '').get('objectName') ||
        'selected-object';
      return {
        title: 'Permanently Delete Cloud Storage Object',
        resourceKind: 'GCS Object',
        targetName: `gs://${bucket}/${objName}`,
        location: bucket,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete object "${objName}" from bucket "gs://${bucket}". Unless Object Versioning or a WORM Retention Lock is active on this bucket, this file cannot be recovered.`,
      };
    }

    // BigQuery dataset delete (/bigquery/datasets/:datasetId)
    const bqMatch = rawUrl.match(/\/bigquery\/datasets\/([^/?]+)/);
    if (bqMatch) {
      const datasetId = decodeURIComponent(bqMatch[1]);
      return {
        title: 'Permanently Delete BigQuery Dataset & All Tables',
        resourceKind: 'BigQuery Dataset',
        targetName: `${projectId}:${datasetId}`,
        location: 'Multi-Region / Regional',
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This executes a forced recursive deletion (deleteContents=true) on BigQuery dataset "${datasetId}", permanently destroying all tables, views, routines, and stored analytical data inside it.`,
      };
    }

    // BigLake Metastore catalog delete (/biglake/metastore/catalogs/:loc/:catalogId)
    const blMatch = rawUrl.match(/\/biglake\/metastore\/catalogs\/([^/]+)\/([^/?]+)/);
    if (blMatch) {
      const loc = decodeURIComponent(blMatch[1]);
      const catalogId = decodeURIComponent(blMatch[2]);
      return {
        title: 'Permanently Delete BigLake Metastore Catalog',
        resourceKind: 'BigLake Catalog',
        targetName: catalogId,
        location: loc,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete BigLake Metastore Catalog "${catalogId}" in ${loc} (${projectId}). Iceberg table metadata registrations inside this catalog will be removed.`,
      };
    }

    // Cloud SQL instance delete (/cloud-sql/instances/:name or /cloudsql/instances/:name)
    const sqlMatch = rawUrl.match(/\/cloud-?sql\/instances\/([^/?]+)/);
    if (sqlMatch) {
      const instanceName = decodeURIComponent(sqlMatch[1]);
      return {
        title: 'Permanently Delete Cloud SQL Database Instance',
        resourceKind: 'Cloud SQL Instance',
        targetName: instanceName,
        location: 'Regional Relational DB',
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently destroy Cloud SQL instance "${instanceName}", including all relational databases, users, and automatic backups associated with the instance.`,
      };
    }

    // AlloyDB cluster delete (/alloydb/clusters/:region/:clusterId)
    const alloyMatch = rawUrl.match(/\/alloydb\/clusters\/([^/]+)\/([^/?]+)/);
    if (alloyMatch) {
      const region = decodeURIComponent(alloyMatch[1]);
      const clusterId = decodeURIComponent(alloyMatch[2]);
      return {
        title: 'Permanently Delete AlloyDB PostgreSQL Cluster',
        resourceKind: 'AlloyDB Cluster',
        targetName: clusterId,
        location: region,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will force-delete AlloyDB cluster "${clusterId}" in ${region}, tearing down its primary instance, read pool nodes, and cluster storage volume.`,
      };
    }

    // Artifact Registry repository delete (/wave9/supply-chain/repositories/:location/:repositoryId)
    const arRepoMatch = rawUrl.match(
      /\/wave9\/supply-chain\/repositories\/([^/]+)\/([^/?]+)/
    );
    if (arRepoMatch) {
      const location = decodeURIComponent(arRepoMatch[1]);
      const repoId = decodeURIComponent(arRepoMatch[2]);
      return {
        title: 'Permanently Delete Artifact Registry Repository & All Images',
        resourceKind: 'Artifact Registry Repository',
        targetName: repoId,
        location,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete Artifact Registry repository "${repoId}" in ${location} (${projectId}) and destroy all container images, tags, and SBOM artifacts stored inside it.`,
      };
    }

    // GKE cluster delete (/gke/clusters/:location/:name or /wave9/gke/cluster)
    const gkeMatch = rawUrl.match(/\/gke\/clusters\/([^/]+)\/([^/?]+)/);
    if (gkeMatch) {
      const location = decodeURIComponent(gkeMatch[1]);
      const clusterName = decodeURIComponent(gkeMatch[2]);
      return {
        title: 'Permanently Delete GKE Kubernetes Cluster',
        resourceKind: 'GKE Cluster',
        targetName: clusterName,
        location,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete GKE cluster "${clusterName}" (${location}), terminating all running Kubernetes deployments, pods, services, and node pools.`,
      };
    }

    if (rawUrl.includes('/wave9/gke/cluster')) {
      const clusterName = body.clusterName || params.clusterName || 'gke-cluster';
      const location = body.location || params.location || 'us-central1';
      return {
        title: 'Permanently Delete GKE Kubernetes Cluster',
        resourceKind: 'GKE Cluster',
        targetName: clusterName,
        location,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete GKE cluster "${clusterName}" (${location}), terminating all running Kubernetes workloads and control plane endpoints.`,
      };
    }

    if (rawUrl.includes('/wave11/firestore/documents')) {
      const colId = params.collectionId || body.collectionId || 'cloudpulse_deployments';
      const docId = params.documentId || body.documentId || 'selected-doc';
      return {
        title: 'Permanently Delete Cloud Firestore Document',
        resourceKind: 'Firestore NoSQL Document',
        targetName: `${colId}/${docId}`,
        location: params.databaseId || '(default)',
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete document "${colId}/${docId}" from Cloud Firestore database "${params.databaseId || '(default)'}" in project "${projectId}".`,
      };
    }

    // Cloud Functions delete (/functions/:region/:name)
    const fnMatch = rawUrl.match(/\/functions\/([^/]+)\/([^/?]+)/);
    if (fnMatch) {
      const region = decodeURIComponent(fnMatch[1]);
      const fnName = decodeURIComponent(fnMatch[2]);
      return {
        title: 'Permanently Delete Cloud Function',
        resourceKind: 'Cloud Function (Gen2 / Gen1)',
        targetName: fnName,
        location: region,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete Cloud Function "${fnName}" in ${region} and disconnect its HTTP trigger or Eventarc event subscription.`,
      };
    }

    // Data Engineering Studio resource delete (/data-engineer/resource)
    if (rawUrl.includes('/data-engineer/resource')) {
      const kind = body.resourceKind || params.resourceKind || 'Data Engineering Resource';
      const target = body.name || params.name || body.id || params.id || 'selected-pipeline';
      const region = body.region || params.region || 'us-central1';
      if (kind === 'MEDALLION_PIPELINE') {
        const cleanPrefix = String(target)
          .replace(/^medallion-live-/, '')
          .replace(/^medallion-/, '')
          .replace(/-\d+$/, '');
        return {
          title: `Permanently Delete Medallion Lakehouse Pipeline "${cleanPrefix}"`,
          resourceKind: '3-Tier BigQuery Medallion Pipeline (Bronze / Silver / Gold)',
          targetName: cleanPrefix,
          location: region,
          projectId,
          method: 'DELETE',
          endpoint: rawUrl,
          whatHappensNext: `1. Calls DELETE https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/{datasetId}?deleteContents=true across ${cleanPrefix}_bronze_raw, ${cleanPrefix}_silver_cleaned, and ${cleanPrefix}_gold_marts.\n2. Removes the Medallion ELT pipeline registration from the Data Engineering Studio.`,
          impactWarning: `This permanently deletes Medallion pipeline "${cleanPrefix}" (${region}) and drops its 3 BigQuery datasets (${cleanPrefix}_bronze_raw, ${cleanPrefix}_silver_cleaned, ${cleanPrefix}_gold_marts) in project "${projectId}".`,
        };
      }
      return {
        title: `Permanently Delete ${kind}`,
        resourceKind: kind,
        targetName: target,
        location: region,
        projectId,
        method: 'DELETE',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete the ${kind} "${target}" (${region}) from project "${projectId}".`,
      };
    }

    // Wave 11 Firestore Document Deletion (/wave11/firestore/documents)
    if (rawUrl.includes('/wave11/firestore/documents')) {
      const dbId = body.databaseId || params.databaseId || '(default)';
      const colId = body.collectionId || params.collectionId || 'cloudpulse_ops';
      const docId = body.documentId || params.documentId || 'doc';
      return {
        title: `Permanently Delete Firestore Document "${colId}/${docId}"?`,
        resourceKind: 'Cloud Firestore Native Document (firestore.googleapis.com/v1)',
        targetName: `${dbId} / ${colId} / ${docId}`,
        location: dbId,
        projectId,
        method: 'DELETE DOCUMENT',
        endpoint: rawUrl,
        confirmLabel: `Confirm & Delete Document "${docId}"`,
        cancelToast: `Deletion of Firestore document "${colId}/${docId}" cancelled.`,
        impactWarning: `This permanently deletes document "${docId}" from collection "${colId}" in Firestore database "${dbId}" on project "${projectId}".`,
      };
    }

    // Fallback for any other HTTP DELETE endpoint
    return {
      title: 'Confirm Permanent Resource Deletion',
      resourceKind: body.resourceType || body.type || 'Cloud Resource',
      targetName: body.name || body.id || rawUrl.split('/').pop() || rawUrl,
      location: body.region || body.zone || body.location || 'GCP',
      projectId,
      method: 'DELETE',
      endpoint: rawUrl,
      impactWarning: `You are about to execute a permanent HTTP DELETE operation on Google Cloud project "${projectId}". Please confirm you want to proceed.`,
    };
  }

  // 2. Destructive HTTP POST endpoints
  if (method === 'post') {
    // Cloud Storage Empty & Delete Bucket
    const emptyBucketMatch = rawUrl.match(/\/storage\/buckets\/([^/]+)\/empty-and-delete/);
    if (emptyBucketMatch) {
      const bucket = decodeURIComponent(emptyBucketMatch[1]);
      return {
        title: 'Force Empty & Permanently Delete Cloud Storage Bucket',
        resourceKind: 'Cloud Storage Bucket (Recursive Purge)',
        targetName: `gs://${bucket}`,
        location: 'Global / Multi-Region',
        projectId,
        method: 'POST',
        endpoint: rawUrl,
        impactWarning: `DANGER: This operation will first permanently delete EVERY object and file stored inside "gs://${bucket}" and then permanently destroy the bucket itself. This action is irreversible.`,
      };
    }

    // Compute Engine VM Power -> DELETE
    const vmPowerMatch = rawUrl.match(/\/vms\/([^/]+)\/power/);
    if (vmPowerMatch && String(body.action || '').toUpperCase() === 'DELETE') {
      const vmName = decodeURIComponent(vmPowerMatch[1]);
      const zone = body.zone || 'gcp-zone';
      return {
        title: 'Permanently Delete Compute Engine VM Instance',
        resourceKind: 'Compute Engine VM',
        targetName: vmName,
        location: zone,
        projectId,
        method: 'POST (DELETE VM)',
        endpoint: rawUrl,
        impactWarning: `This will permanently terminate and delete Compute Engine VM "${vmName}" in zone "${zone}", including its auto-delete boot persistent disk.`,
      };
    }

    // Zombie Resource Exterminator
    if (rawUrl.includes('/zombies/exterminate')) {
      const zName = body.zombieId || body.name || 'orphaned-resource';
      const zType = body.type || 'Orphaned Cloud Resource';
      const zZone = body.zone || 'global';
      return {
        title: `Exterminate & Delete ${zType}`,
        resourceKind: zType,
        targetName: zName,
        location: zZone,
        projectId,
        method: 'POST (EXTERMINATE)',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete the unattached/orphaned ${zType} "${zName}" (${zZone}) from project "${projectId}" to reclaim wasted FinOps spend.`,
      };
    }

    // Artifact Registry Supply-Chain Delete Image / Sweep Orphans
    if (rawUrl.includes('/wave9/supply-chain/delete-image')) {
      const img = body.uri || body.name || body.image || 'container-image';
      return {
        title: 'Permanently Delete Artifact Registry Container Image',
        resourceKind: 'Artifact Registry Image',
        targetName: img,
        location: 'Artifact Registry',
        projectId,
        method: 'POST (DELETE IMAGE)',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete container image "${img}" (and its digest/tags) from Google Cloud Artifact Registry.`,
      };
    }

    if (rawUrl.includes('/wave9/supply-chain/sweep-orphans')) {
      const count = Array.isArray(body.orphans)
        ? body.orphans.length
        : Array.isArray(body.images)
        ? body.images.length
        : 'all untagged';
      return {
        title: 'Sweep & Delete Dead / Orphaned Container Images',
        resourceKind: 'Artifact Registry Dead Container Sweep',
        targetName: `${count} Dead / Unused Container Images`,
        location: 'Artifact Registry',
        projectId,
        method: 'POST (SWEEP ORPHANS)',
        endpoint: rawUrl,
        impactWarning: `This will permanently purge ${count} dead/unused container image digests from Artifact Registry. Active container images currently running on Cloud Run are protected and untouched.`,
      };
    }

    if (rawUrl.includes('/cloudrun/dead-artifacts-purge-gcs')) {
      const count = Array.isArray(body.objects) ? body.objects.length : 'selected';
      return {
        title: 'Purge Leftover Cloud Storage Build & Staging Artifacts?',
        resourceKind: 'Cloud Storage Build / Staging Artifacts',
        targetName: `${count} Cloud Storage Artifact Object(s)`,
        location: 'Cloud Storage (storage.googleapis.com)',
        projectId,
        method: 'POST (PURGE GCS ARTIFACTS)',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete ${count} leftover Cloud Storage build/staging artifact object(s) from project "${projectId}".`,
      };
    }

    if (rawUrl.includes('/biglake/federated-catalogs/create')) {
      const provider = body.provider === 'glue' ? 'AWS Glue Data Catalog' : 'Databricks Unity Catalog';
      const catalogName = body.catalogName || 'federated_catalog';
      const gcpRegion = body.gcpRegion || 'us-east4';
      return {
        title: `Provision Cross-Cloud BigLake Federated Catalog (${provider})?`,
        resourceKind: `BigLake Iceberg Federated Catalog (${provider})`,
        targetName: catalogName,
        location: `${gcpRegion} (biglake.googleapis.com + secretmanager.${gcpRegion}.rep.googleapis.com)`,
        projectId,
        method: 'POST (CREATE FEDERATED CATALOG)',
        endpoint: rawUrl,
        impactWarning: `This will provision a regional Secret Manager secret (if Databricks Unity) and create a BigLake Iceberg Federated Catalog "${catalogName}" in region "${gcpRegion}" for project "${projectId}".`,
      };
    }

    // Sovereign IAM Service Account Key Deletion / Token Revocation / Account Freeze
    if (
      rawUrl.includes('/sovereign/iam-surgeon/remediate') ||
      rawUrl.includes('/sovereign-iam/credentials/action')
    ) {
      const act = String(body.action || body.actionType || '').toUpperCase();
      if (act === 'DELETE_SA_KEY' || act === 'EMERGENCY_REVOKE_ALL_SA_KEYS') {
        const target =
          body.keyName || body.keyId || body.serviceAccountEmail || 'IAM SA Key';
        return {
          title: 'Permanently Revoke & Delete Service Account JSON Key?',
          resourceKind: 'IAM Service Account Key (iam.googleapis.com)',
          targetName: target,
          location: 'Global IAM',
          projectId,
          method: 'DELETE SA KEY',
          endpoint: rawUrl,
          impactWarning: `This will immediately and permanently delete Service Account key "${target}" in Google Cloud IAM. Any workload or CI/CD pipeline authenticating with this .json key file will lose access immediately and the private key cannot be recovered.`,
        };
      }
      if (act === 'REVOKE_SA_TOKEN' || act === 'REVOKE_ACTIVE_OAUTH_TOKEN') {
        const target =
          body.tokenId || body.serviceAccountEmail || 'OAuth2 Access Token';
        return {
          title: 'Immediately Revoke Active OAuth2 Access Token?',
          resourceKind: 'Short-Lived OAuth2 Bearer Token',
          targetName: target,
          location: 'Global IAM',
          projectId,
          method: 'REVOKE TOKEN',
          endpoint: rawUrl,
          confirmLabel: 'Confirm & Revoke OAuth2 Token',
          cancelToast: 'Action cancelled — OAuth2 token kept active.',
          impactWarning: `This will immediately revoke token "${target}" so it can no longer authenticate against Google Cloud APIs.`,
        };
      }
      if (act === 'TOGGLE_SA_DISABLED' && Boolean(body.disable)) {
        const target = body.serviceAccountEmail || 'Service Account';
        return {
          title: `Freeze & Disable Service Account "${target}"?`,
          resourceKind: 'IAM Service Account (Emergency Kill-Switch)',
          targetName: target,
          location: 'Global IAM',
          projectId,
          method: 'DISABLE SA',
          endpoint: rawUrl,
          confirmLabel: 'Confirm & Freeze Service Account',
          cancelToast: `Action cancelled — "${target}" remains enabled.`,
          impactWarning: `EMERGENCY KILL-SWITCH WARNING: Disabling Service Account "${target}" immediately blocks ALL JSON keys, OAuth tokens, and workloads running as this identity until you re-enable it.`,
        };
      }
    }

    // AWS & Azure Parity Suite destructive / stop-loss actions
    if (rawUrl.includes('/aws-azure-parity/action')) {
      const act = String(body.action || '').toUpperCase();
      if (act === 'DELETE_RESOURCE_GROUP') {
        const slug = body.slug || 'Resource Group';
        const cascade = Boolean(body.deleteGcpResources);
        const count = Array.isArray(body.memberIds) ? body.memberIds.length : 0;
        return {
          title: cascade
            ? `Teardown Resource Group "${slug}" + Delete ${count} GCP Resource(s)?`
            : `Remove Logical Resource Group "${slug}"?`,
          resourceKind: cascade
            ? 'Azure-Style Resource Group + Underlying GCP Resources'
            : 'Azure-Style Logical Resource Group Container',
          targetName: slug,
          location: 'Multi-Region Group',
          projectId,
          method: cascade ? 'CASCADE DELETE GROUP' : 'REMOVE GROUP',
          endpoint: rawUrl,
          confirmLabel: cascade
            ? `Confirm & Delete Group + ${count} Resource(s)`
            : 'Confirm & Remove Group Container',
          cancelToast: `Deletion of Resource Group "${slug}" cancelled.`,
          impactWarning: cascade
            ? `CRITICAL CASCADE TEARDOWN: This will permanently delete Resource Group "${slug}" AND issue live GCP DELETE calls across all ${count} member resource(s) (Cloud Run, VMs, GCS Buckets, BigQuery Datasets, Secrets).`
            : `This removes the logical Resource Group folder "${slug}" while leaving all underlying GCP resources running untouched.`,
        };
      }
      if (act === 'HIBERNATE_RESOURCE_GROUP') {
        const slug = body.slug || 'Resource Group';
        return {
          title: `Hibernate Resource Group "${slug}"?`,
          resourceKind: 'Azure-Style Resource Group Compute Park',
          targetName: slug,
          location: 'Multi-Region Group',
          projectId,
          method: 'HIBERNATE GROUP',
          endpoint: rawUrl,
          confirmLabel: 'Confirm & Hibernate Group',
          cancelToast: `Hibernation of "${slug}" cancelled.`,
          impactWarning: `This will stop all RUNNING Compute Engine VMs and scale warm Cloud Run services (minInstances -> 0) inside Resource Group "${slug}".`,
        };
      }
      if (
        act === 'EXECUTE_SPEND_FUSE' &&
        (body.fuseLevel === 'SOFT_BRAKE' || body.fuseLevel === 'COMPUTE_PARK')
      ) {
        return {
          title: `Execute Hard-Spend Fuse (${body.fuseLevel}) on "${projectId}"?`,
          resourceKind: 'Automated Stop-Loss Budget Fuse',
          targetName: `${projectId} (${body.fuseLevel})`,
          location: 'Global Project Fleet',
          projectId,
          method: body.fuseLevel,
          endpoint: rawUrl,
          confirmLabel: `Confirm & Execute ${body.fuseLevel}`,
          cancelToast: `Spend Fuse action ${body.fuseLevel} cancelled.`,
          impactWarning:
            body.fuseLevel === 'COMPUTE_PARK'
              ? `This will immediately stop all RUNNING Compute Engine VMs across all zones and scale warm Cloud Run services to minInstances=0.`
              : `This will scale warm Cloud Run services to minInstances=0 and cap maxInstances=3 across "${projectId}".`,
        };
      }
      if (act === 'DISABLE_PARITY_FEATURE_MODULE') {
        const modId = body.moduleId || 'Multi-Cloud Parity Module';
        return {
          title: `Disable & Teardown Feature "${modId}" ($0.00/hr)?`,
          resourceKind: 'Multi-Cloud Parity Bridge Resources',
          targetName: `${modId} (${body.alsoDisableGcpApis ? 'Feature Resources + Underlying GCP APIs' : 'Feature Resources Only · Keep GCP APIs Enabled'})`,
          location: 'Global Project Bridge',
          projectId,
          method: 'DISABLE & TEARDOWN FEATURE',
          endpoint: rawUrl,
          confirmLabel: 'Confirm Disable & Teardown ($0.00/hr)',
          cancelToast: `Teardown of "${modId}" cancelled.`,
          impactWarning: `This will tear down all active resources configured under "${modId}" on project "${projectId}" so hourly cost drops to $0.00/hr.`,
        };
      }
      if (
        act === 'DELETE_PARITY_MODULE_ITEM' ||
        act === 'DELETE_OAUTH_BRAND_PROFILE' ||
        act === 'REVOKE_RAM_LIGHTHOUSE_SHARE' ||
        act === 'DELETE_EVENT_PIPE'
      ) {
        const itemTarget =
          body.itemId || body.brandId || body.shareId || body.pipeId || 'Resource';
        const modId = body.moduleId || act;
        return {
          title: `Disable & Remove Resource "${itemTarget}"?`,
          resourceKind: `Multi-Cloud Parity Resource (${modId})`,
          targetName: itemTarget,
          location: projectId,
          projectId,
          method: 'DELETE RESOURCE',
          endpoint: rawUrl,
          confirmLabel: `Confirm Delete "${itemTarget}" ($0.00/hr)`,
          cancelToast: `Deletion of "${itemTarget}" cancelled.`,
          impactWarning: `This will immediately remove "${itemTarget}" from "${modId}" on project "${projectId}" ($0.00/hr) while keeping shared project GCP APIs enabled.`,
        };
      }
    }

    // Emergency Billing Kill-Switch (Unlink Cloud Billing Account or Soft-Freeze $0 Idle Hibernation)
    if (
      rawUrl.includes('/billing/kill-switch') &&
      (String(body.action || '').toUpperCase() === 'DISABLE' ||
        String(body.action || '').toUpperCase() === 'SOFT_FREEZE')
    ) {
      const isSoftFreeze = String(body.action || '').toUpperCase() === 'SOFT_FREEZE';
      const extraFlags = [
        body.stopAllVms ? 'Stop Running VMs' : null,
        body.scaleDownCloudRun ? 'Scale Cloud Run to minInstances=0' : null,
        body.stopCloudSql ? 'Stop Cloud SQL (activationPolicy=NEVER)' : null,
      ].filter(Boolean);

      if (isSoftFreeze) {
        return {
          title: `Execute $0 Idle Soft-Freeze Hibernation on "${projectId}"?`,
          headerBadge: 'CloudPulse 2026 Soft-Freeze ($0 Idle Hibernation) Gatekeeper',
          targetLabel: 'Target GCP Project & Active Compute Resources',
          resourceKind: 'Compute Engine · Cloud Run v2 · Cloud SQL (Billing Kept Linked)',
          targetName: `${projectId} (${extraFlags.join(' + ') || 'Verify $0 Idle Burn'})`,
          location: 'Multi-Region Fleet',
          projectId,
          method: 'SOFT FREEZE ($0 IDLE)',
          endpoint: rawUrl,
          confirmLabel: 'Confirm & Execute Soft-Freeze Hibernation',
          cancelToast: 'Soft-Freeze cancelled — active resources remain unchanged.',
          impactWarning: `NON-NUCLEAR HIBERNATION: Keeps your Cloud Billing Account linked (preserving GCS buckets, DNS, and scale-to-zero Cloud Run traffic) while halting active hourly burn via: ${
            extraFlags.join(', ') || 'Compute/Serverless/SQL idle freeze'
          }.`,
        };
      }

      return {
        title: `Unlink Cloud Billing Account from "${projectId}"?`,
        headerBadge: 'CloudPulse 2026 Emergency Billing Kill-Switch Gatekeeper',
        targetLabel: 'Target GCP Project to Detach from Billing',
        resourceKind: 'Cloud Billing Account Link (cloudbilling.googleapis.com)',
        targetName: `${projectId}${extraFlags.length > 0 ? ` (+ ${extraFlags.join(', ')})` : ''}`,
        location: 'Global Billing',
        projectId,
        method: 'UNLINK BILLING',
        endpoint: rawUrl,
        confirmLabel: 'Confirm & Unlink Cloud Billing',
        cancelToast: 'Action cancelled — Cloud Billing remains linked.',
        impactWarning: `EXTREME IMPACT WARNING: Unlinking the Cloud Billing Account from "${projectId}" will immediately stop all billable Google Cloud resources and disable paid API usage across the project until billing is re-linked.`,
      };
    }

    // Cloud Billing Budget & Native Spend Cap Creation (/billing-guardian/budgets/create)
    if (rawUrl.includes('/billing-guardian/budgets/create')) {
      const capUsd = Number(body.amountUsd || 15);
      const isSpendCap = Boolean(body.enableSpendCap);
      const svcRef = body.serviceResourceName || 'All Project Services';
      return {
        title: isSpendCap
          ? `Arm Native Spend Cap ($${capUsd}/mo) on ${svcRef}?`
          : `Arm Auto-Circuit-Breaker & Cloud Billing Budget ($${capUsd}/mo)?`,
        headerBadge: isSpendCap
          ? 'GoogleCloudBillingBudgetsV1SpendCap Gatekeeper'
          : 'CloudPulse 2026 Billing Spend Cap Circuit-Breaker Gatekeeper',
        targetLabel: isSpendCap
          ? 'Target GCP Service for Hard Spend Cap'
          : 'Target Project for Monthly Hard Budget Cap',
        resourceKind: 'Cloud Billing Budget API (billingbudgets.googleapis.com/v1)',
        targetName: `${body.displayName || `${projectId}-${capUsd}usd`} ($${capUsd} ${body.currencyCode || 'USD'}/MONTH · ${body.creditTypesTreatment || 'EXCLUDE_ALL_CREDITS'})`,
        location: 'Global Billing Account',
        projectId,
        method: isSpendCap ? 'ARM SPEND CAP (CONFIGURED)' : 'CREATE BUDGET & ARM BREAKER',
        endpoint: rawUrl,
        confirmLabel: isSpendCap
          ? `Confirm & Arm $${capUsd}/mo Spend Cap`
          : `Confirm & Arm $${capUsd}/mo Circuit-Breaker`,
        cancelToast:
          'Action cancelled — Circuit-Breaker / Spend Cap was not enabled.',
        impactWarning: isSpendCap
          ? `HARD SPEND CAP WARNING: Setting spendCap.inputState = "CONFIGURED" ($${capUsd}/mo · EXCLUDE_ALL_CREDITS) instructs Google Cloud Billing to automatically pause usage of "${svcRef}" in "${projectId}" for the rest of the calendar month once gross estimated usage reaches 100% of $${capUsd} USD. (Note: Because EXCLUDE_ALL_CREDITS is required by Google, gross usage is measured before promotional credits settle.)`
          : `CIRCUIT-BREAKER & BILLING BUDGET WARNING: Confirming this action provisions a live $${capUsd}/mo Cloud Billing Budget on billingbudgets.googleapis.com/v1 (50%, 80%, 100% thresholds) and arms the Automated Spend Cap Circuit-Breaker so compute spend is clamped if your project crosses $${capUsd}/mo.`,
      };
    }

    // Cloud Billing Spend Cap State Transitions (/billing-guardian/budgets/spend-cap-action)
    if (rawUrl.includes('/billing-guardian/budgets/spend-cap-action')) {
      const act = String(body.action || '').toUpperCase();
      const bName = body.budgetName || 'billingAccounts/.../budgets/...';
      const shortId = String(bName).split('/').pop() || bName;
      return {
        title:
          act === 'LIFT_CAP'
            ? `Lift Spend Cap (${shortId}) -> AWAITING_NEXT_PERIOD?`
            : act === 'RAISE_AMOUNT_AND_UNPAUSE'
            ? `Update Budget Cap ($${body.newAmountUsd || 25}/mo) on ${shortId}?`
            : `Re-Arm Native Spend Cap (${shortId}) -> CONFIGURED?`,
        headerBadge: 'Cloud Billing Spend Cap State Machine Gatekeeper',
        resourceKind: 'Cloud Billing Budget (billingbudgets.googleapis.com/v1)',
        targetName: bName,
        location: 'Global Billing Account',
        projectId,
        method: `PATCH (${act})`,
        endpoint: rawUrl,
        confirmLabel:
          act === 'LIFT_CAP'
            ? 'Confirm & Lift Spend Cap for This Month'
            : act === 'RAISE_AMOUNT_AND_UNPAUSE'
            ? `Confirm & Set Cap to $${body.newAmountUsd || 25}/mo`
            : 'Confirm & Re-Arm Spend Cap',
        cancelToast: 'Action cancelled — Spend Cap state was not changed.',
        impactWarning:
          act === 'LIFT_CAP'
            ? `Lifting this Spend Cap sets spendCap.inputState = "AWAITING_NEXT_PERIOD". Any paused service will resume immediately and can incur billable charges for the remainder of the current calendar month (it automatically re-arms to CONFIGURED on the 1st of next month).`
            : act === 'RAISE_AMOUNT_AND_UNPAUSE'
            ? `This executes an atomic PATCH (lifting ENFORCED first if needed to prevent FAILED_PRECONDITION) and updates the monthly cap to $${body.newAmountUsd || 25} USD/mo.`
            : `Re-arming sets spendCap.inputState = "CONFIGURED", pausing the target service if gross monthly spend reaches 100% of the cap.`,
      };
    }

    // Cloud Billing Budget Deletion (/billing-guardian/budgets/delete)
    if (rawUrl.includes('/billing-guardian/budgets/delete')) {
      const bName = body.budgetName || 'billingAccounts/.../budgets/...';
      return {
        title: `Delete Cloud Billing Budget "${String(bName).split('/').pop()}"?`,
        resourceKind: 'Cloud Billing Budget (billingbudgets.googleapis.com/v1)',
        targetName: bName,
        location: 'Global Billing Account',
        projectId,
        method: 'DELETE BUDGET',
        endpoint: rawUrl,
        confirmLabel: 'Confirm & Delete Budget',
        cancelToast: 'Action cancelled — Cloud Billing Budget kept intact.',
        impactWarning: `Deleting "${bName}" permanently removes its 50%/80%/100% threshold alerts and any attached Native Spend Cap enforcement.`,
      };
    }

    // 2026 Quantum Nexus Circuit-Breaker Policy Update
    if (
      rawUrl.includes('/quantum-nexus/action') &&
      String(body.action || '').toUpperCase() === 'UPDATE_FINOPS_CIRCUIT_BREAKER'
    ) {
      const capUsd = Number(
        body.payload?.maxMonthlyBudgetUsd ?? body.maxMonthlyBudgetUsd ?? 50
      );
      const actMode =
        body.payload?.autoAction || body.autoAction || 'PARK_NIGHT_MODE';
      return {
        title: `Arm Autonomous FinOps Circuit-Breaker ($${capUsd}/mo)?`,
        headerBadge: '2026 Quantum Nexus Circuit-Breaker Gatekeeper',
        resourceKind: 'Cloud Billing Budget + Autonomous Tripwire',
        targetName: `${projectId} ($${capUsd}/mo · Action: ${actMode})`,
        location: 'Global Project & Billing',
        projectId,
        method: 'ARM CIRCUIT-BREAKER',
        endpoint: rawUrl,
        confirmLabel: `Confirm & Arm $${capUsd}/mo Circuit-Breaker`,
        cancelToast: 'Action cancelled — Circuit-Breaker was not armed.',
        impactWarning: `Confirming this action arms the Autonomous FinOps Circuit-Breaker at $${capUsd}/mo (tripwire action: ${actMode}) and provisions a corresponding Cloud Billing Budget via billingbudgets.googleapis.com/v1.`,
      };
    }

    // Service Usage API Disable (/apis/toggle with action: DISABLE)
    if (
      rawUrl.includes('/apis/toggle') &&
      String(body.action || '').toUpperCase() === 'DISABLE'
    ) {
      const svc = body.serviceName || 'googleapis.com';
      return {
        title: `Disable Google Cloud API "${svc}"?`,
        resourceKind: 'Service Usage API (serviceusage.googleapis.com)',
        targetName: svc,
        location: 'Global Project API',
        projectId,
        method: 'DISABLE API',
        endpoint: rawUrl,
        confirmLabel: `Confirm & Disable ${svc}`,
        cancelToast: `Action cancelled — "${svc}" remains enabled.`,
        impactWarning: `Disabling "${svc}" (with disableDependentServices=true) on project "${projectId}" will immediately stop any workloads or SDK calls that depend on this service API.`,
      };
    }

    // Secret Manager Secret Deletion & Permanent Version Destruction
    if (rawUrl.includes('/sovereign/secrets-kms/action')) {
      const act = String(body.action || '').toUpperCase();
      if (act === 'DELETE_SECRET') {
        const sid = body.secretId || 'Secret';
        return {
          title: `Delete Secret Manager Secret "${sid}" & All Versions?`,
          resourceKind: 'Secret Manager Secret (secretmanager.googleapis.com)',
          targetName: sid,
          location: 'Secret Manager',
          projectId,
          method: 'DELETE SECRET',
          endpoint: rawUrl,
          impactWarning: `NO PLAINTEXT FALLBACK — IT DISAPPEARS FOREVER: Deleting "${sid}" permanently erases the secret and all of its versions. It does NOT revert Cloud Run environment variables back into plaintext! Because the Leak Surgeon removed the plaintext value from Cloud Run and replaced it with a secretKeyRef pointer, any Cloud Run service still referencing "${sid}" will fail to start new instances until that reference is updated or removed.`,
        };
      }
      if (
        act === 'TOGGLE_VERSION_STATE' &&
        String(body.targetState || '').toUpperCase() === 'DESTROY'
      ) {
        const sid = body.secretId || 'Secret';
        const ver = body.version || '1';
        return {
          title: `Permanently Destroy Secret Version "${sid} @ v${ver}"?`,
          resourceKind: 'Secret Manager Version Payload',
          targetName: `${sid} (Version ${ver})`,
          location: 'Secret Manager',
          projectId,
          method: 'DESTROY VERSION',
          endpoint: rawUrl,
          impactWarning: `NO PLAINTEXT FALLBACK — IT DISAPPEARS FOREVER: Destroying version v${ver} of "${sid}" is IRREVERSIBLE. The cryptographic payload is permanently shredded and does NOT return to plaintext in Cloud Run. Tip: If you only want $0.00/mo billing or might need to roll back later, click Cancel and use "Disable ($0/mo)" instead—disabled versions also cost $0.00/mo and can be re-enabled anytime!`,
        };
      }
      if (
        act === 'HEAL_CLOUDRUN_SECRET_REF' &&
        String(body.healStrategy || '').toUpperCase() === 'UNBIND_BROKEN_REF'
      ) {
        const sid = body.secretId || 'Secret';
        const svc = body.serviceName || 'Cloud Run Service';
        const reg = body.region || 'gcp-region';
        return {
          title: `Unbind Broken Secret "${sid}" from Cloud Run "${svc}"?`,
          resourceKind: 'Cloud Run Secret Reference (run.googleapis.com/v2)',
          targetName: `${svc} → ${body.envKey || sid}`,
          location: reg,
          projectId,
          method: 'UNBIND SECRET REF',
          endpoint: rawUrl,
          confirmLabel: 'Confirm & Unbind Dead Secret Ref',
          cancelToast: `Action cancelled — "${svc}" was not modified.`,
          impactWarning: `This will remove the broken secretKeyRef binding ("${sid}") from Cloud Run service "${svc}" (${reg}) and roll a new revision so the service can boot cleanly without crashing on startup.`,
        };
      }
    }

    // 2026 Quantum Nexus Ephemeral PR Shadow Environment Teardown
    if (
      rawUrl.includes('/quantum-nexus/action') &&
      String(body.action || '').toUpperCase() === 'DELETE_EPHEMERAL_PR_ENV'
    ) {
      const target =
        body.serviceName ||
        body.payload?.envId ||
        (body.prNumber ? `PR #${body.prNumber} Shadow Env` : 'Ephemeral PR Env');
      return {
        title: 'Tear Down & Delete Ephemeral PR Shadow Environment',
        resourceKind: 'Cloud Run Ephemeral PR Environment',
        targetName: target,
        location: body.region || 'us-central1',
        projectId,
        method: 'POST (DELETE PR ENV)',
        endpoint: rawUrl,
        impactWarning: `This will permanently delete the ephemeral Cloud Run preview service "${target}" and release its preview URL.`,
      };
    }

    // Cloud Run Public (allUsers) vs Private (IAM Authenticated) Access Toggle
    const cloudRunIamMatch = rawUrl.match(
      /\/cloudrun\/([^/]+)\/([^/]+)\/iam(?:\?|$)/
    );
    if (cloudRunIamMatch) {
      const region = decodeURIComponent(cloudRunIamMatch[1]);
      const serviceName = decodeURIComponent(cloudRunIamMatch[2]);
      const makePublic = Boolean(body.allowUnauthenticated);
      if (makePublic) {
        return {
          title: 'Expose Cloud Run Service to Public Internet (allUsers)?',
          headerBadge: 'CloudPulse 2026 IAM Security & Exposure Gatekeeper',
          targetLabel: 'Target Cloud Run Service to Expose Publicly',
          resourceKind: 'Cloud Run IAM Policy (roles/run.invoker)',
          targetName: `${serviceName} (PRIVATE IAM → PUBLIC allUsers)`,
          location: region,
          projectId,
          method: 'GRANT allUsers',
          endpoint: rawUrl,
          confirmLabel: 'Yes, Expose Service to Public (allUsers)',
          cancelToast: `Access change cancelled — "${serviceName}" remains Private (IAM Authenticated).`,
          impactWarning: `PUBLIC EXPOSURE WARNING: This grants "roles/run.invoker" to "allUsers" on Cloud Run service "${serviceName}" (${region}). Anyone on the public internet will be able to invoke its HTTPS URL without Google Cloud IAM authentication.`,
        };
      }
      return {
        title: 'Restrict Cloud Run Service to Authenticated IAM Only (Private)?',
        headerBadge: 'CloudPulse 2026 IAM Security & Access Gatekeeper',
        targetLabel: 'Target Cloud Run Service to Lock Down (Private)',
        resourceKind: 'Cloud Run IAM Policy (roles/run.invoker)',
        targetName: `${serviceName} (PUBLIC allUsers → PRIVATE IAM AUTH)`,
        location: region,
        projectId,
        method: 'REVOKE allUsers',
        endpoint: rawUrl,
        confirmLabel: 'Yes, Switch to Private (IAM Auth Required)',
        cancelToast: `Access change cancelled — "${serviceName}" remains Public (allUsers).`,
        impactWarning: `AUTHENTICATION LOCKDOWN WARNING: This removes "allUsers" (roles/run.invoker) from Cloud Run service "${serviceName}" (${region}). Unauthenticated browsers, webhooks, or external clients calling this URL without a valid Google IAM Bearer token will immediately receive HTTP 403 Forbidden.`,
      };
    }

    // Cloud Run App Engine-Style 1-Click Direct IAP Toggle (/cloudrun/:region/:serviceName/iap)
    const cloudRunIapMatch = rawUrl.match(
      /\/cloudrun\/([^/]+)\/([^/]+)\/iap(?:\?|$)/
    );
    if (cloudRunIapMatch) {
      const region = decodeURIComponent(cloudRunIapMatch[1]);
      const serviceName = decodeURIComponent(cloudRunIapMatch[2]);
      const enableIap = body.enabled !== false;
      const accessorsList = Array.isArray(body.accessors)
        ? body.accessors.filter(Boolean).join(', ')
        : '';
      if (enableIap) {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'BETA',
          title: `Enable 1-Click Direct Cloud IAP on "${serviceName}" ($0.00/mo · Zero-LB)?`,
          headerBadge: 'App Engine-Style 1-Click Cloud Run IAP Gatekeeper',
          targetLabel: 'Target Cloud Run Service & IAP Web Resource',
          resourceKind:
            'Direct Cloud Run IAP (run.googleapis.com/iap-enabled + roles/iap.httpsResourceAccessor)',
          targetName: `${serviceName} (${region} · Direct Zero-LB IAP)`,
          location: region,
          projectId,
          method: 'ENABLE CLOUD IAP',
          endpoint: rawUrl,
          confirmLabel: `Enable 1-Click Cloud IAP on "${serviceName}" ($0.00/mo)`,
          cancelToast: `Cloud IAP activation on "${serviceName}" cancelled.`,
          whatHappensNext: `1. Enables iap.googleapis.com and provisions the project IAP Service Agent (service-<PROJECT_NUMBER>@gcp-sa-iap.iam.gserviceaccount.com).\n2. Patches Cloud Run service "${serviceName}" with iapEnabled=true, run.googleapis.com/iap-enabled="true", and invokerIamDisabled=false.\n3. Removes allUsers bypass and grants roles/run.invoker to the IAP Service Agent.\n4. Grants roles/iap.httpsResourceAccessor on iap_web/cloud_run-${region}/services/${serviceName} to ${
            accessorsList || 'your active Google account'
          }.`,
          costWarning: `ZERO LOAD BALANCER COST ($0.00/MO): Direct Cloud Run IAP protects your .run.app endpoint natively without requiring an $18+/mo Global External Application Load Balancer or Serverless NEG.`,
          impactWarning: `Enforces Google Sign-In Identity-Aware Proxy in front of "${serviceName}" (${region}). Only principals with roles/iap.httpsResourceAccessor will be allowed through.`,
        };
      }
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'BETA',
        title: `Disable Direct Cloud IAP on "${serviceName}"?`,
        headerBadge: 'App Engine-Style 1-Click Cloud Run IAP Gatekeeper',
        targetLabel: 'Target Cloud Run Service',
        resourceKind: 'Direct Cloud Run IAP (run.googleapis.com/iap-enabled=false)',
        targetName: `${serviceName} (${region} · Disable Direct IAP)`,
        location: region,
        projectId,
        method: 'DISABLE CLOUD IAP',
        endpoint: rawUrl,
        confirmLabel: `Disable Direct Cloud IAP on "${serviceName}"`,
        cancelToast: `Cloud IAP remains enabled on "${serviceName}".`,
        whatHappensNext: `1. Patches "${serviceName}" with iapEnabled=false and removes annotation run.googleapis.com/iap-enabled.\n2. Removes the IAP Service Agent from roles/run.invoker on "${serviceName}".`,
        costWarning: `ZERO COST IMPACT ($0.00/MO): Disabling Direct Cloud Run IAP incurs $0.00 in charges.`,
        impactWarning: `Removes Google Sign-In IAP enforcement from "${serviceName}" (${region}). The service will remain Private IAM Authenticated unless you explicitly grant allUsers.`,
      };
    }

    // Cloud Run Revision Time-Machine Rollback / Spec Redeploy
    const timeMachineMatch = rawUrl.match(
      /\/cloudrun\/([^/]+)\/([^/]+)\/time-machine-restore(?:\?|$)/
    );
    if (timeMachineMatch) {
      const region = decodeURIComponent(timeMachineMatch[1]);
      const serviceName = decodeURIComponent(timeMachineMatch[2]);
      const mode = String(body.mode || body.restoreMode || 'INSTANT_TRAFFIC_PIN').toUpperCase();
      const targetRev = body.targetRevision || `${serviceName}-prev`;
      if (mode === 'INSTANT_TRAFFIC_PIN' || mode === 'CLONE_REVISION_SPEC') {
        const isClone = mode === 'CLONE_REVISION_SPEC';
        return {
          title: isClone
            ? `Clone & Redeploy Spec from "${targetRev}" to "${serviceName}"?`
            : `Roll Back 100% Production Traffic to "${targetRev}"?`,
          headerBadge: 'CloudPulse 2026 Cloud Run Revision Time-Machine Gatekeeper',
          targetLabel: 'Target Cloud Run Service & Historical Revision',
          resourceKind: 'Cloud Run Revision Traffic / Spec (run.googleapis.com/v2)',
          targetName: `${serviceName} → ${targetRev}`,
          location: region,
          projectId,
          method: isClone ? 'CLONE SPEC' : '100% ROLLBACK',
          endpoint: rawUrl,
          confirmLabel: isClone
            ? `Confirm & Redeploy Spec from ${targetRev}`
            : `Confirm & Shift 100% Traffic to ${targetRev}`,
          cancelToast: `Action cancelled — "${serviceName}" traffic and revision state unchanged.`,
          impactWarning: isClone
            ? `This will clone the container image, vCPU/Memory limits, and environment spec from historical revision "${targetRev}" and roll a brand-new revision on Cloud Run service "${serviceName}" (${region}).`
            : `INSTANT TRAFFIC ROLLBACK: This immediately pins 100% of live HTTPS traffic on Cloud Run service "${serviceName}" (${region}) to revision "${targetRev}", bypassing the latest revision without rebuilding the container image.`,
        };
      }
    }
  }

  // ==========================================================================
  // 3. UNIVERSAL 1-TAP CLOUD MUTATION, DEPLOYMENT & COST GATEKEEPER
  // Warns the engineer before ANY 1-Tap Cloud Action (POST / PATCH / PUT)
  // mutates live Google Cloud resources or changes cloud billing!
  // ==========================================================================
  if (method === 'post' || method === 'patch' || method === 'put') {
    // Exempt strictly read-only, auth, local-probe, or dry-run endpoints
    const isReadOnlyOrDryRun =
      !rawUrl.includes('/api/project/') ||
      rawUrl.includes('/chrono-logs/query') ||
      rawUrl.includes('/chrono-logs/git-blame') ||
      rawUrl.includes('/chrono-logs/network-kernel-probe') ||
      rawUrl.includes('/chrono-logs/replay-canary') ||
      rawUrl.includes('/shell') ||
      rawUrl.includes('/benchmark') ||
      rawUrl.includes('/provision/preflight') ||
      rawUrl.includes('/tunnels/probe') ||
      rawUrl.includes('/tunnels/start') ||
      rawUrl.includes('/tunnels/stop') ||
      rawUrl.includes('/wave8/war-room/synthetic-probe') ||
      rawUrl.includes('/wave8/war-room/ai-sre-commander') ||
      rawUrl.includes('/dlp-scan') ||
      rawUrl.includes('/functions/test-event') ||
      rawUrl.includes('/ai-copilot') ||
      rawUrl.includes('/ai-vault/ask') ||
      rawUrl.includes('/billing-guardian/auto-download-credits-csv') ||
      rawUrl.includes('/billing-guardian/sync-console-credits') ||
      rawUrl.includes('/billing-guardian/reset-console-credits') ||
      (rawUrl.includes('/vms/') && rawUrl.endsWith('/ssh')) ||
      (rawUrl.includes('/bigquery/query') && Boolean(body.dryRun)) ||
      (rawUrl.includes('/synthesis/runbook') &&
        String(body.mode || 'DRY_RUN').toUpperCase() === 'DRY_RUN') ||
      (rawUrl.includes('/sovereign/time-machine/snapshot') &&
        String(body.action || '').toUpperCase() !== 'HEAL_DRIFT') ||
      (rawUrl.includes('/quantum-nexus/action') &&
        ['CAPTURE_SNAPSHOT', 'SIMULATE_BLAST'].includes(
          String(body.action || '').toUpperCase()
        )) ||
      (rawUrl.includes('/aws-azure-parity/action') &&
        ([
          'UPSERT_RESOURCE_GROUP',
          'ASSIGN_RG_IAM_ROLE',
          'LIST_BUCKET_OBJECTS',
          'SIMULATE_IAM_POLICY',
          'SIMULATE_SWITCH_ROLE',
          'DETECT_STACK_DRIFT',
          'QUERY_CLOUDTRAIL_AUDIT_LAKE',
          'RUN_CLOUDTRAIL_PRESET',
          'TEST_EVENT_PIPE',
          'TEST_AI_GATEWAY_PROMPT',
          'RUN_BEDROCK_FOUNDRY_EVAL',
          'TRIGGER_DATAV_NOC_DRILL',
        ].includes(String(body.action || '').toUpperCase()) ||
          (String(body.action || '').toUpperCase() ===
            'DELETE_RESOURCE_GROUP' &&
            !body.deleteGcpResources))) ||
      (rawUrl.includes('/alpha-beta/action') &&
        [
          'INSPECT_BETA_RUN_INSTANCES',
          'SCAN_ALPHA_AGENT_REGISTRY',
          'TROUBLESHOOT_ALPHA_IAM_POLICY',
          'SCAN_ALPHA_SERVICE_HEALTH_AND_FAULT_TESTING',
          'RUN_ALPHA_BETA_PLATFORM_INTELLIGENCE',
          'SCAN_ALPHA_MODEL_ARMOR_AND_SANITIZE',
          'QUERY_ALPHA_DEVELOPER_KNOWLEDGE_AND_TOPOLOGY',
          'SCAN_BETA_CLOUD_QUOTAS',
          'SCAN_ALPHA_AUDIT_AND_DELIVERY_TRUST',
          'SCAN_ALPHA_CLUSTER_DIRECTOR_AND_LUSTRE',
        ].includes(String(body.action || '').toUpperCase())) ||
      rawUrl.includes('/data-engineer/iceberg-matrix/probe') ||
      (rawUrl.includes('/data-engineer/action') &&
        ['SEARCH_DATAPLEX_SEMANTIC_CATALOG', 'RUN_SPARK_LOG_RCA_DOCTOR'].includes(
          String(body.action || '').toUpperCase()
        )) ||
      (rawUrl.includes('/wave10/action') &&
        String(body.action || '').toUpperCase() === 'SCAN_MODEL_ARMOR') ||
      rawUrl.includes('/mcp/tools-list') ||
      rawUrl.includes('/mcp/run-triage-chain') ||
      rawUrl.includes('/mcp/agent-chat') ||
      rawUrl.includes('/mcp/call-tool') ||
      rawUrl.includes('/wave11/stress-audit') ||
      rawUrl.includes('/wave12/ludicrous-megacast') ||
      rawUrl.includes('/wave12/flight-director') ||
      rawUrl.includes('/wave13/starlink-orbital-probe') ||
      rawUrl.includes('/wave13/neuralink-compile') ||
      rawUrl.includes('/wave13/optimus-swarm-debate') ||
      rawUrl.includes('/wave13/blackbox-seal') ||
      (rawUrl.includes('/wave14/bigquery-time-travel') &&
        !body.injectMutationBeforeDiff &&
        !body.insertLiveTestRow) ||
      rawUrl.includes('/wave14/iam-ai-hardening') ||
      rawUrl.includes('/wave14/quantum-envelope-decrypt') ||
      rawUrl.includes('/wave15/bigquery-anomaly-vector') ||
      (rawUrl.includes('/wave15/attest-slsa-provenance') &&
        !body.uploadToBucket) ||
      rawUrl.includes('/wave15/logging-correlator') ||
      rawUrl.includes('/wave15/logging-ai-surgeon') ||
      rawUrl.includes('/wave15/tls-x509-inspector') ||
      rawUrl.includes('/enterprise-personas/tribunal') ||
      rawUrl.includes('/enterprise-personas/zkp-verify') ||
      rawUrl.includes('/enterprise-personas/intent-compiler') ||
      rawUrl.includes('/enterprise-personas/agentless-vm-xray') ||
      rawUrl.includes('/enterprise-personas/wire-packet-waterfall') ||
      rawUrl.includes('/enterprise-personas/practitioner-devkit') ||
      rawUrl.includes('/enterprise-personas/devsecops-entropy-gitops') ||
      rawUrl.includes('/global-map/') ||
      (rawUrl.includes('/enterprise-personas/action') &&
        !['EXECUTE_TRIBUNAL_LIVE_REMEDIATION', 'ROLLBACK_TRIBUNAL_REMEDIATION'].includes(
          String(body.action || '').toUpperCase()
        ));

    if (isReadOnlyOrDryRun) {
      return null;
    }

    // 3A-0000-rollback. 10-Persona Council Rollback Capsule Reverter
    if (
      rawUrl.includes('/enterprise-personas/action') &&
      String(body.action || '').toUpperCase() ===
        'ROLLBACK_TRIBUNAL_REMEDIATION'
    ) {
      const capId = body.capsuleId || 'Rollback Capsule';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Restore Pre-Remediation GCP State from Rollback Capsule "${capId}"?`,
        headerBadge: '10-Persona Architecture Council · 2030 Rollback Capsule',
        targetLabel: 'Target Pre-Mutation Rollback Capsule',
        resourceKind: 'Compute Firewall / GCS Bucket Pre-Mutation Snapshot',
        targetName: capId,
        location: body.region || 'Global / Multi-Region',
        projectId,
        method: 'REVERT CAPSULE',
        endpoint: rawUrl,
        confirmLabel: `Revert to Pre-Fix GCP State`,
        cancelToast: 'Rollback capsule revert cancelled.',
        whatHappensNext: `1. Reads the SHA-256 sealed pre-mutation resource JSON stored in Rollback Capsule "${capId}".\n2. Calls PATCH against Google Cloud REST APIs to restore the exact pre-remediation sourceRanges or iamConfiguration.`,
        costWarning: `ZERO COST IMPACT ($0.00/MO): Restoring firewall rules or bucket IAM settings incurs $0.00/mo.`,
        impactWarning: `Restores the previous resource configuration on project "${projectId}".`,
      };
    }

    // 3A-0000. 10-Persona Council Live GCP Remediation (LOCK_FIREWALL_TO_IAP | ENFORCE_BUCKET_PAP)
    if (
      rawUrl.includes('/enterprise-personas/action') &&
      String(body.action || '').toUpperCase() ===
        'EXECUTE_TRIBUNAL_LIVE_REMEDIATION'
    ) {
      const remType = String(body.remediationType || '').toUpperCase();
      const targetRes = body.targetResource || 'GCP Resource';
      if (remType === 'LOCK_FIREWALL_TO_IAP') {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Lock VPC Firewall Rule "${targetRes}" to Cloud IAP (35.235.240.0/20)?`,
          headerBadge: '10-Persona Architecture Council · Live NetOps Remediation',
          targetLabel: 'Target VPC Firewall Rule',
          resourceKind: 'Compute Engine Firewall Rule (compute.googleapis.com/v1)',
          targetName: targetRes,
          location: 'Global VPC',
          projectId,
          method: 'PATCH FIREWALL',
          endpoint: rawUrl,
          confirmLabel: `Lock "${targetRes}" to Cloud IAP (35.235.240.0/20)`,
          cancelToast: `Firewall remediation on "${targetRes}" cancelled.`,
          whatHappensNext: `1. Calls PATCH https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls/${targetRes}.\n2. Replaces world-open 0.0.0.0/0 sourceRanges with Google Cloud IAP TCP forwarding (35.235.240.0/20).\n3. Re-runs the 10-Persona Architecture Council and updates the T0 vs. T_Now SHA-256 Merkle Diff.`,
          costWarning: `ZERO COST IMPACT ($0.00/MO): Updating VPC firewall sourceRanges and using Cloud IAP TCP forwarding incurs $0.00/mo.`,
          impactWarning: `Direct public internet connections to ports governed by "${targetRes}" will be blocked unless tunnelled through authenticated Google Cloud IAP (gcloud compute start-iap-tunnel).`,
        };
      }
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Enforce PublicAccessPrevention & Uniform Access on "gs://${targetRes}"?`,
        headerBadge: '10-Persona Architecture Council · Live DevSecOps Remediation',
        targetLabel: 'Target Cloud Storage Bucket',
        resourceKind: 'Cloud Storage Bucket IAM Config (storage.googleapis.com/v1)',
        targetName: `gs://${targetRes}`,
        location: body.region || 'Multi-Region / Regional',
        projectId,
        method: 'PATCH BUCKET PAP',
        endpoint: rawUrl,
        confirmLabel: `Enforce PublicAccessPrevention on gs://${targetRes}`,
        cancelToast: `Bucket hardening on "gs://${targetRes}" cancelled.`,
        whatHappensNext: `1. Calls PATCH https://storage.googleapis.com/storage/v1/b/${targetRes}.\n2. Sets iamConfiguration.publicAccessPrevention="enforced" and uniformBucketLevelAccess.enabled=true.\n3. Re-runs the 10-Persona Architecture Council and updates the T0 vs. T_Now SHA-256 Merkle Diff.`,
        costWarning: `ZERO COST IMPACT ($0.00/MO): Enforcing Public Access Prevention and Uniform Bucket-Level Access incurs $0.00/mo.`,
        impactWarning: `Blocks any public allUsers / allAuthenticatedUsers object ACLs on "gs://${targetRes}" in project "${projectId}".`,
      };
    }

    // 3A-0000a. Wave 15 SLSA v1.0 DSSE Provenance Upload to GCS (/wave15/attest-slsa-provenance with uploadToBucket)
    if (rawUrl.includes('/wave15/attest-slsa-provenance')) {
      const targetBkt = String(body.uploadToBucket || '').replace(/^gs:\/\//, '');
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm SLSA v1.0 DSSE Attestation Upload to "${targetBkt}"?`,
        headerBadge: 'Wave 15 SLSA v1.0 Provenance Gatekeeper',
        targetLabel: 'Target Cloud Storage Attestation Bucket',
        resourceKind: 'SLSA v1.0 In-Toto DSSE Envelope (.intoto.jsonl)',
        targetName: `gs://${targetBkt}/slsa-provenance/`,
        location: 'Multi-Region / Regional',
        projectId,
        method: 'UPLOAD SLSA DSSE',
        endpoint: rawUrl,
        confirmLabel: `Sign & Upload DSSE Envelope to gs://${targetBkt}`,
        cancelToast: 'SLSA v1.0 GCS upload cancelled.',
        whatHappensNext: `1. Signs the SLSA v1.0 In-Toto Provenance statement using Ed25519 (RFC 8032).\n2. Uploads the signed DSSE JSON bundle to gs://${targetBkt}/slsa-provenance/ via storage.googleapis.com/upload/storage/v1.`,
        costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00): Storing a ~2 KB JSON attestation object in an existing Cloud Storage bucket incurs negligible ($0.00) storage cost.`,
        impactWarning: `Writes a new SLSA v1.0 attestation object into bucket "${targetBkt}" on project "${projectId}".`,
      };
    }

    // 3A-0000b. Wave 14 BigQuery Time-Travel Live Row Injection (/wave14/bigquery-time-travel with injectMutationBeforeDiff)
    if (rawUrl.includes('/wave14/bigquery-time-travel')) {
      const ds = body.datasetId || 'existing_dataset';
      const tbl = body.tableId || 'existing_table';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm Live Row Insertion into "${ds}.${tbl}" for Time-Travel Diff?`,
        headerBadge: 'Wave 14 BigQuery Time-Travel Gatekeeper',
        targetLabel: 'Target BigQuery Dataset & Table',
        resourceKind: 'BigQuery Streaming Row Insert (tabledata.insertAll)',
        targetName: `${projectId}:${ds}.${tbl}`,
        location: body.location || 'US',
        projectId,
        method: 'BQ TIME-TRAVEL INSERT',
        endpoint: rawUrl,
        confirmLabel: `Insert 1 Row & Prove FOR SYSTEM_TIME AS OF Diff`,
        cancelToast: 'BigQuery Time-Travel row insertion cancelled.',
        whatHappensNext: `1. Streams 1 row into existing table "${ds}.${tbl}" via bigquery.googleapis.com/bigquery/v2.\n2. Executes parallel Standard SQL queries at CURRENT_TIMESTAMP() and FOR SYSTEM_TIME AS OF TIMESTAMP_SUB(...) to prove the temporal row delta.`,
        costWarning: `MINIMAL COST ($0.00): Inserting 1 test row and running an on-demand metadata/time-travel SELECT query falls within the 1 TiB/mo BigQuery Always-Free query tier.`,
        impactWarning: `Appends 1 row into existing BigQuery table "${ds}.${tbl}" in project "${projectId}".`,
      };
    }

    // 3A-0000c. Wave 14 Autonomous Self-Healing Cloud Doctor Remediation (/wave14/self-healing-remediate)
    if (rawUrl.includes('/wave14/self-healing-remediate')) {
      const targetId = body.targetResourceId || 'ALL';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm Autonomous Self-Healing Remediation (${targetId})?`,
        headerBadge: 'Wave 14 Self-Healing Cloud Doctor Gatekeeper',
        targetLabel: 'Target Drifted GCP Resource(s)',
        resourceKind: 'GCS Uniform IAM + Soft-Delete / BigQuery Governance Labels / SecretVersion',
        targetName: `${projectId} · ${targetId}`,
        location: 'Global / Multi-Region',
        projectId,
        method: 'SELF-HEAL REMEDIATE',
        endpoint: rawUrl,
        confirmLabel: `Heal Drifted Resource(s) (${targetId})`,
        cancelToast: 'Self-healing remediation cancelled.',
        whatHappensNext: `1. Executes live REST PATCH/POST calls on drifted resource(s) (${targetId}) to enforce Uniform Bucket-Level Access, Public Access Prevention, 7-day Soft Delete, BigQuery governance labels, or an enabled SecretVersion.\n2. Re-audits the project fleet and returns cryptographic remediation receipts.`,
        costWarning: `ZERO EXTRA CHARGE ($0.00): Hardening GCS bucket IAM/Soft-Delete policies and patching BigQuery dataset labels incur $0.00 in Google Cloud charges.`,
        impactWarning: `Updates security/governance metadata on drifted resource(s) (${targetId}) in project "${projectId}".`,
      };
    }

    // 3A-0000d. Wave 14 Hybrid Post-Quantum Envelope Seal (/wave14/quantum-envelope-seal)
    if (rawUrl.includes('/wave14/quantum-envelope-seal')) {
      const secName = body.secretName || 'wave14-quantum-envelope-vault';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm Hybrid PQC Envelope Seal to Secret "${secName}"?`,
        headerBadge: 'Wave 14 Post-Quantum Envelope Vault Gatekeeper',
        targetLabel: 'Target Secret Manager Container',
        resourceKind: 'X25519 + SHAKE256 + AES-256-GCM + Ed25519 SecretVersion',
        targetName: `projects/${projectId}/secrets/${secName}`,
        location: 'Automatic Global Replication',
        projectId,
        method: 'PQC ENVELOPE SEAL',
        endpoint: rawUrl,
        confirmLabel: `Seal Hybrid PQC Envelope to "${secName}"`,
        cancelToast: 'Post-Quantum Envelope seal cancelled.',
        whatHappensNext: `1. Performs ephemeral X25519 ECDH + 512-bit SHAKE256 Post-Quantum Lattice salt derivation + AES-256-GCM authenticated encryption + Ed25519 signature.\n2. Creates or appends a new SecretVersion inside Secret Manager secret "${secName}" via secretmanager.googleapis.com/v1.`,
        costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00 WITHIN FREE TIER): Google Cloud Secret Manager includes 6 active secret versions and 10,000 access operations per month for $0.00/mo ($0.06/version-month beyond Free Tier).`,
        impactWarning: `Creates/adds a live encrypted SecretVersion to "${secName}" in project "${projectId}".`,
      };
    }

    // 3A-000a. Wave 13 Starlink Orbital Geo-Failover Standby (/wave13/starlink-failover-execute)
    if (rawUrl.includes('/wave13/starlink-failover-execute')) {
      const corridorId = body.corridorId || 'corridor-us-eu';
      const targetReg = body.targetRegion || 'US';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm Multi-Region Geo-Standby Failover (${targetReg})?`,
        headerBadge: 'Multi-Region Geo-Failover Gatekeeper',
        targetLabel: 'Intercontinental Corridor & Geo-Standby Jurisdiction',
        resourceKind: `BigQuery Geo-Failover Dataset (${corridorId})`,
        targetName: `${projectId}:starlink_orbital_failover_${String(targetReg).toLowerCase()}`,
        location: targetReg,
        projectId,
        method: 'MULTI-REGION GEO-FAILOVER',
        endpoint: rawUrl,
        confirmLabel: `Provision Geo-Standby Dataset in ${targetReg} ($0.00)`,
        cancelToast: 'Multi-Region Geo-Standby cancelled.',
        whatHappensNext: `1. Provisions or synchronizes standby BigQuery dataset "starlink_orbital_failover_${String(targetReg).toLowerCase()}" in "${targetReg}" via bigquery.googleapis.com/bigquery/v2.\n2. Binds corridor failover metadata for "${corridorId}".\n3. Signs and appends an Ed25519 (RFC 8032) cryptographic block to the Signed Audit Trail Ledger.`,
        costWarning: `ZERO IDLE COST ($0.00/MO): Creating or updating a BigQuery dataset container incurs $0.00/mo in Google Cloud charges.`,
        impactWarning: `Provisions/updates live BigQuery dataset "starlink_orbital_failover_${String(targetReg).toLowerCase()}" in project "${projectId}".`,
      };
    }

    // 3A-000b. Wave 13 Natural-Language 4-Node DAG Builder (/wave13/neuralink-materialize)
    if (rawUrl.includes('/wave13/neuralink-materialize')) {
      const slug = body.stackSlug || 'neuralink_singularity_2026';
      const loc = body.location || 'US';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm 4-Node Cloud DAG Provisioning ("${slug}")?`,
        headerBadge: 'Natural-Language 4-Node DAG Gatekeeper',
        targetLabel: '4-Node Parallel Cloud Architecture DAG',
        resourceKind: 'GCS Hardened Bucket + BigQuery Dataset + Typed Table + Secret Manager Vault',
        targetName: `${projectId} · ${slug} (${loc})`,
        location: loc,
        projectId,
        method: 'PROVISION 4-NODE DAG',
        endpoint: rawUrl,
        confirmLabel: `Provision 4-Node DAG on ${projectId}`,
        cancelToast: '4-Node DAG provisioning cancelled.',
        whatHappensNext: `1. Node 01: Provisions hardened Cloud Storage bucket (Public Access Prevention + Uniform IAM + 7d Soft-Delete) via storage.googleapis.com/storage/v1.\n2. Node 02 & 03: Provisions BigQuery dataset "${slug}_lakehouse" and 5-column typed table "neural_telemetry_events" via bigquery.googleapis.com/bigquery/v2.\n3. Node 04: Provisions AES-256 hardware-encrypted Secret Manager container via secretmanager.googleapis.com/v1.\n4. Seals the 4-node execution receipt in the Ed25519 Signed Audit Trail Ledger.`,
        costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00 INITIAL COST): Empty GCS buckets, BigQuery dataset/table metadata, and up to 6 Secret Manager versions per month fall within Google Cloud's Always-Free Tier ($0.00/mo).`,
        impactWarning: `Provisions/verifies 4 live Google Cloud resources in project "${projectId}" (${loc}).`,
      };
    }

    // 3A-00a. Wave 12 Automated Drift Remediation (/wave12/autopilot-execute)
    if (rawUrl.includes('/wave12/autopilot-execute')) {
      const mId = String(body.maneuverType || body.maneuverId || 'CALIBRATE_AUTOPILOT_DATASET').toUpperCase();
      const targetName = body.targetResource || body.targetName || 'All Eligible Project Resources';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm Automated Drift Remediation: "${mId}"?`,
        headerBadge: 'Automated Drift Reconciler Gatekeeper',
        targetLabel: 'Remediation Action & Target Resource',
        resourceKind: `Closed-Loop Drift Reconciler (${mId})`,
        targetName: `${projectId} · ${targetName}`,
        location: 'Global / Multi-Region',
        projectId,
        method: `REMEDIATE DRIFT (${mId})`,
        endpoint: rawUrl,
        confirmLabel: `Execute Drift Remediation (${mId})`,
        cancelToast: `Drift remediation action ${mId} cancelled.`,
        whatHappensNext: `1. Computes pre-change SHA-256 Merkle state digest across your live GCP project.\n2. Executes "${mId}" (${body.title || targetName}) via live Google Cloud REST APIs.\n3. Re-runs the 6-vector telemetry scan and verifies the post-change SHA-256 digest.`,
        costWarning: `ZERO EXTRA CHARGE ($0.00): Hardening GCS buckets (Uniform Bucket-Level Access + 7-day Soft Delete), locking firewall rules to IAP, or calibrating the audit dataset incurs $0.00 in API charges and reduces ongoing FinOps burn.`,
        impactWarning: `Mutates live configuration on target resource "${targetName}" in project "${projectId}".`,
      };
    }

    // 3A-00b. Wave 12 Zero-Gravity Cross-Project Live Resource Teleporter (/wave12/cross-project-teleport)
    if (rawUrl.includes('/wave12/cross-project-teleport')) {
      const kind = String(body.teleportKind || body.resourceKind || 'BIGQUERY_DATASET_CLONE').toUpperCase();
      const srcName = body.sourceResourceName || body.sourceName || 'source-resource';
      const dstProj = body.destProjectId || body.targetProjectId || projectId;
      const dstName = body.destResourceName || body.targetName || srcName;
      const dstLoc = body.location || body.targetLocation || 'US';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm Zero-Gravity Cross-Project Teleport (${kind})?`,
        headerBadge: 'Wave 12 Cross-Project Live Resource Teleporter',
        targetLabel: 'Source → Destination GCP Project Teleportation',
        resourceKind: kind,
        targetName: `${projectId}:${srcName} → ${dstProj}:${dstName}`,
        location: dstLoc,
        projectId: dstProj,
        method: `CROSS-PROJECT TELEPORT (${kind})`,
        endpoint: rawUrl,
        confirmLabel: `Engage Zero-Gravity Teleport to "${dstProj}"`,
        cancelToast: 'Cross-project teleportation cancelled.',
        whatHappensNext: `1. Verifies or provisions target container "${dstName}" in destination project "${dstProj}" (${dstLoc}).\n2. Clones live ${kind} metadata and payloads directly across Google Cloud's internal Jupiter backbone without local browser/proxy downloads.\n3. Returns a cryptographic SHA-256 teleportation receipt.`,
        costWarning: `STANDARD DESTINATION STORAGE & NETWORK NOTICE: Creating datasets or secrets incurs $0.00–$0.06/secret-mo. Cloning objects/tables into "${dstProj}" incurs standard destination storage rates ($0.020/GB-mo) and cross-region replication fees if source and destination locations differ.`,
        impactWarning: `Creates/updates live ${kind} "${dstName}" inside destination project "${dstProj}".`,
      };
    }

    // 3A-0a. Probe Live Iceberg Estate (Read-Only 5-Service Lakehouse Discovery Modal)
    if (rawUrl.includes('/data-engineer/iceberg-matrix/probe')) {
      const reg = body.region || 'us-central1';
      const pbTitle =
        body.playbookTitle || body.playbookId || '50-Playbook Iceberg Matrix';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'ALPHA',
        title: `Confirm Live Iceberg Estate Probe (Read-Only · $0.00)?`,
        headerBadge: `[GA + ALPHA] 5-Service Lakehouse Estate Discovery Gatekeeper`,
        targetLabel: 'Target GCP Project & Lakehouse Services to Inspect',
        resourceKind:
          'BigQuery Datasets + GCS Buckets + [ALPHA] BigLake Iceberg REST + [ALPHA] Managed Kafka + [ALPHA] Dataplex',
        targetName: `${projectId} (${reg} · Context: ${pbTitle})`,
        location: reg,
        projectId,
        method: 'READ-ONLY ESTATE PROBE',
        endpoint: rawUrl,
        confirmLabel: 'Approve & Run 5-Service Read-Only Probe ($0.00)',
        cancelToast: 'Live Iceberg Estate Probe cancelled.',
        whatHappensNext: `1. BigQuery Datasets (GA REST): Queries bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets to list existing Lakehouse datasets.\n2. Cloud Storage Buckets (GA REST): Queries storage.googleapis.com/storage/v1/b?project=${projectId} to list live gs:// buckets and storage classes (STANDARD / AUTOCLASS).\n3. [ALPHA] BigLake Iceberg REST Catalogs: Runs "gcloud alpha biglake iceberg catalogs list --project=${projectId}" to discover open Iceberg REST catalogs.\n4. [ALPHA] Managed Kafka Clusters: Runs "gcloud alpha managed-kafka clusters list --location=${reg}" to check streaming ingestion readiness.\n5. [ALPHA] Dataplex Governance Lakes: Runs "gcloud alpha dataplex lakes list --location=${reg}" and populates the 5-card live telemetry strip.`,
        costWarning: `100% READ-ONLY DISCOVERY ($0.00 BILLING IMPACT): This action only executes read-only GET / list queries across BigQuery, Cloud Storage, BigLake, Managed Kafka, and Dataplex. It NEVER creates, modifies, or deletes any cloud resource and incurs $0.00 in Google Cloud charges.`,
        impactWarning: `Approving this probe will inspect live Lakehouse metadata in project "${projectId}" (${reg}) with zero mutations.`,
      };
    }

    // 3A-0b. 1-Tap 50-Playbook Borderless Apache Iceberg Lakehouse Bootstrap (/data-engineer/iceberg-matrix/execute)
    if (rawUrl.includes('/data-engineer/iceberg-matrix/execute')) {
      const pbTitle =
        body.playbookTitle || body.playbookId || 'Apache Iceberg Lakehouse Playbook';
      const track = String(body.releaseTrack || 'GA').toUpperCase();
      const ds = body.datasetId || 'iceberg_lakehouse_2026';
      const bkt = body.bucketName || `${projectId}-iceberg-lakehouse`;
      const reg = body.region || 'us-central1';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: track,
        title: `Confirm 1-Tap Iceberg Lakehouse Bootstrap: "${pbTitle}"?`,
        headerBadge: `[${track}] Apache Iceberg Lakehouse & Cost Gatekeeper`,
        targetLabel: 'Target Lakehouse Dataset & Open Iceberg Catalog',
        resourceKind: `BigQuery Dataset + Apache Iceberg V2 (${body.catalogId || 'cp_iceberg_rest_catalog'})`,
        targetName: `${projectId}.${ds} (gs://${bkt})`,
        location: reg,
        projectId,
        method: `[${track}] 1-TAP LAKEHOUSE`,
        endpoint: rawUrl,
        confirmLabel: `Confirm & Bootstrap [${track}] Iceberg Playbook`,
        cancelToast: `Iceberg Lakehouse playbook "${pbTitle}" cancelled.`,
        whatHappensNext: `1. Verifies or creates BigQuery Lakehouse Dataset "${projectId}.${ds}" via bigquery.googleapis.com/bigquery/v2.\n2. Binds Apache Iceberg V2 metadata pointers for "${pbTitle}" (${body.playbookId}) targeting gs://${bkt}.\n3. Logs a reversible audit receipt in the CloudPulse 2026 Flight Recorder.`,
        costWarning: `LAKEHOUSE STORAGE & COMPUTE BILLING NOTICE: Creating a BigQuery dataset container is $0.00/mo. Storing Parquet + Iceberg metadata in Cloud Storage incurs standard GCS storage rates ($0.020/GB-mo Standard or $0.0012/GB-mo Archive with Autoclass), and executing BigQuery SQL / Serverless Spark batches incurs per-TB scan ($6.25/TB after 1TB/mo free tier) or Dataproc Serverless DCU-hour charges.`,
        impactWarning: `This bootstraps the live Lakehouse dataset "${projectId}.${ds}" in project "${projectId}".`,
      };
    }

    // 3A. 1-Tap Night-Mode FinOps Sleep / Wake Switch (/hibernate)
    if (rawUrl.includes('/hibernate')) {
      const mode = String(body.mode || 'SLEEP').toUpperCase();
      const isWake = mode === 'WAKE';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: isWake
          ? `Confirm 1-Tap Wake: Restore Parked VMs & Warm Cloud Run Fleet?`
          : `Confirm 1-Tap Night-Mode Sleep: Park All Running Compute?`,
        headerBadge: 'CloudPulse 2026 1-Tap Cloud & Billing Gatekeeper',
        targetLabel: 'Target Project Fleet Operation',
        resourceKind: 'Compute Engine VMs + Cloud Run Fleet',
        targetName: `${projectId} (${isWake ? 'WAKE FLEET' : 'PARK COMPUTE TO $0/HR'})`,
        location: 'All Project Zones & Regions',
        projectId,
        method: isWake ? '1-TAP WAKE FLEET' : '1-TAP PARK COMPUTE',
        endpoint: rawUrl,
        confirmLabel: isWake
          ? 'Confirm & Wake Project Compute (Resumes Billing)'
          : 'Confirm & Park Active Compute for the Night',
        cancelToast: `1-Tap ${mode} cancelled — fleet state unchanged.`,
        whatHappensNext: isWake
          ? `1. Reads your pre-sleep snapshot in memory.\n2. Calls compute.googleapis.com/v1 instances.start across previously running VMs.\n3. Restores previous minInstanceCount settings on warm Cloud Run services.`
          : `1. Saves a snapshot of your currently RUNNING VMs and warm Cloud Run services.\n2. Calls compute.googleapis.com/v1 instances.stop across all running VMs.\n3. Scales warm Cloud Run services (minInstanceCount > 0) down to 0.`,
        costWarning: isWake
          ? `BILLING RESUMPTION WARNING: Waking your Compute Engine VMs and warm Cloud Run instances immediately resumes hourly vCPU, RAM, and GPU charges ($/hr) on your Google Cloud invoice.`
          : `FINOPS SAVINGS + RESIDUAL COST NOTICE: Active vCPU/RAM/GPU compute drops to $0.00/hr while parked. However, Google Cloud still bills monthly for attached Persistent Disks ($0.04–$0.17/GB-mo) and reserved Static External IPs ($7.30/mo) on STOPPED VMs.`,
        impactWarning: isWake
          ? `All parked VMs and warm Cloud Run instances in "${projectId}" will boot back up and begin billing immediately.`
          : `All currently RUNNING VMs in "${projectId}" will be stopped and warm Cloud Run instances scaled to 0.`,
      };
    }

    // 3B. 1-Tap 3-Tier Stack Synthesizer (/stack-deploy)
    if (rawUrl.includes('/stack-deploy')) {
      const prefix = body.prefix || body.stackName || 'cloudpulse-stack';
      const reg = body.region || 'us-central1';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm 1-Tap 3-Tier Stack Synthesis ("${prefix}")?`,
        headerBadge: 'CloudPulse 2026 1-Tap Cloud & Billing Gatekeeper',
        targetLabel: '3-Tier Architecture Stack to Provision',
        resourceKind: 'GCS Bucket + BigQuery Dataset + Cloud Run Service',
        targetName: `${prefix} (3 Live GCP Resources)`,
        location: reg,
        projectId,
        method: '1-TAP STACK DEPLOY',
        endpoint: rawUrl,
        confirmLabel: 'Confirm & Provision 3-Tier Stack in GCP',
        cancelToast: '1-Tap Stack Synthesis cancelled — 0 resources created.',
        whatHappensNext: `1. Creates a live Cloud Storage Bucket (storage.googleapis.com) in ${reg}.\n2. Creates a live BigQuery Dataset (bigquery.googleapis.com) in ${reg}.\n3. Deploys a live Cloud Run Gen2 Service (run.googleapis.com/v2) pre-wired with GCS_BUCKET_URI and BIGQUERY_DATASET environment variables.`,
        costWarning: `CLOUD COST & BILLING NOTICE: Cloud Run is deployed with Scale-to-Zero (minInstanceCount: 0 -> $0.00/hr idle compute), and empty GCS/BigQuery containers cost $0.00 until data is ingested or queried. Artifact Registry / container pull and active HTTP requests are billed at standard regional rates.`,
        impactWarning: `This will create 3 real Google Cloud resources in project "${projectId}" (${reg}). You can roll them back anytime from the Flight Recorder.`,
      };
    }

    // 3C. 1-Tap Cross-Region Cloud Run Teleporter (/cloudrun/teleport)
    if (rawUrl.includes('/cloudrun/teleport')) {
      const src =
        body.sourceServiceName ||
        body.serviceName ||
        body.sourceService ||
        'cloud-run-service';
      const srcReg = body.sourceRegion || 'us-central1';
      const targetReg = body.targetRegion || 'europe-west1';
      const dstName =
        body.newServiceName || `${src}-${targetReg.split('-')[0]}`;
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Teleport Cloud Run Service "${src}" (${srcReg}) → ${targetReg}?`,
        headerBadge: 'Multi-Region Failover & Cloud Run Teleporter Gatekeeper',
        targetLabel: 'Source → Failover Destination Cloud Run Service',
        resourceKind: 'Cloud Run Gen2 Service Clone (run.googleapis.com/v2)',
        targetName: `${src} (${srcReg}) → ${dstName} (${targetReg})`,
        location: targetReg,
        projectId,
        method: '1-TAP TELEPORT',
        endpoint: rawUrl,
        confirmLabel: `Teleport "${src}" to ${targetReg}`,
        cancelToast: `Cross-region teleport of "${src}" cancelled.`,
        whatHappensNext: `1. Inspects Live Source Service "${src}" in ${srcReg}: Reads the active container image, CPU/Memory limits, environment variables, Secret Manager references, and GCS FUSE mounts from "${src}".\n2. Deploys Standby Replica "${dstName}" in Failover Region ${targetReg}: Provisions a cloned Cloud Run Gen2 service in "${targetReg}" via run.googleapis.com/v2.\n3. Mirrors Zero-Trust IAM Invoker Policy & Verifies HTTPS Endpoint: Replicates the source IAM invoker bindings onto the new regional *.run.app URL and records a reversible receipt.`,
        costWarning: `CLOUD COST & EGRESS NOTICE: Deploying into "${targetReg}" applies ${targetReg}'s regional pricing tier multiplier. If the source service has minInstances > 0 or attached GPUs, the cloned service will also incur continuous hourly warm-instance charges unless scaled to 0.`,
        impactWarning: `Provisions live failover Cloud Run service "${dstName}" in region "${targetReg}" inside project "${projectId}" without interrupting "${src}" in "${srcReg}".`,
      };
    }

    // 3D-0. 5-Persona Enterprise Readiness Drills & Traces (/enterprise-personas/action)
    if (rawUrl.includes('/enterprise-personas/action')) {
      return null;
    }

    // 3D. [GA / BETA / ALPHA] gcloud 591.0.0 Frontier Lab Mutations (/alpha-beta/action)
    if (rawUrl.includes('/alpha-beta/action')) {
      const act = String(body.action || '').toUpperCase();
      // Exempt read-only CLI inspection, troubleshooting, and discovery scans
      if (
        act.startsWith('SCAN_') ||
        act.startsWith('INSPECT_') ||
        act.startsWith('TROUBLESHOOT_') ||
        act.startsWith('QUERY_') ||
        act === 'CHECK_OR_CREATE_ALPHA_PAM_JIT' ||
        act === 'RUN_ALPHA_BETA_PLATFORM_INTELLIGENCE'
      ) {
        return null;
      }
      const isBeta = act.includes('BETA');
      const track = isBeta ? 'BETA' : 'ALPHA';
      const target =
        body.workerPoolName ||
        body.multiRegionName ||
        body.pamEntitlementId ||
        body.modelArmorTemplateId ||
        body.clusterDirectorId ||
        body.deliveryTrustPolicyId ||
        body.quotaId ||
        act;
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: track,
        title: `Confirm [${track}] Pre-GA Cloud Command (${act})?`,
        headerBadge: `[${track}] Pre-GA Google Cloud Command & Cost Gatekeeper`,
        targetLabel: `Target [${track}] Resource / Operation`,
        resourceKind: isBeta
          ? 'gcloud beta (Public Preview API)'
          : 'gcloud 591.0.0 GA / alpha API',
        targetName: `${target} [${track}]`,
        location: body.region || 'global',
        projectId,
        method: `[${track}] 1-TAP EXECUTE`,
        endpoint: rawUrl,
        confirmLabel: `Confirm & Execute [${track}] Command`,
        cancelToast: `[${track}] action ${act} cancelled.`,
        whatHappensNext:
          act === 'DEPLOY_BETA_WORKER_POOL'
            ? `1. Invokes "gcloud beta run worker-pools deploy ${target}" in ${body.region || 'us-central1'}.\n2. Provisions ${body.instances || 1} continuous non-HTTP background pull worker instance(s) using image "${body.image || 'worker:latest'}".`
            : act === 'DEPLOY_BETA_MULTI_REGION_SERVICE'
            ? `1. Probes "gcloud beta run multi-region-services" on project "${projectId}".\n2. Synthesizes the multi-region Knative Service specification across ${(body.regions || []).join(', ') || 'us-central1, europe-west1'}.`
            : act === 'DEPLOY_ALPHA_MODEL_ARMOR_TEMPLATE'
            ? `1. Invokes GA "gcloud model-armor templates create ${body.modelArmorTemplateId || 'cp-llm-shield-strict'}" in ${body.region || 'us-central1'}.\n2. Enables Prompt Injection & Jailbreak blocking, Malicious URI filtering, and Responsible AI filters on modelarmor.googleapis.com.`
            : act === 'APPLY_BETA_QUOTA_PREFERENCE_OR_ADJUSTER'
            ? `1. Invokes "gcloud beta quotas adjuster settings update --enablement=${body.quotaAdjusterEnablement || 'ENABLED'}" on project "${projectId}".\n2. Prepares the declarative GA QuotaPreference configuration (gcloud quotas preferences) for ${body.quotaService || 'compute.googleapis.com'} / ${body.quotaId || 'CPUS-per-project-region'}.`
            : act === 'GENERATE_ALPHA_AUDIT_OR_TRUST_POLICY'
            ? `1. Invokes GA "gcloud audit-manager audit-reports generate --compliance-framework=${String(body.complianceStandard || 'fedramp_moderate').toLowerCase()} --report-format=odf" in ${body.region || 'us-central1'}.\n2. Synthesizes the CEL-enforced Software Delivery Trust policy (${body.deliveryTrustPolicyId || 'cp-slsa-l3-enforcer'}).`
            : act === 'PROVISION_ALPHA_CLUSTER_DIRECTOR_BLUEPRINT'
            ? `1. Invokes GA "gcloud cluster-director clusters create ${body.clusterDirectorId || 'cp-ai-hypercomputer-01'} --quickstart-cluster" in ${body.region || 'us-central1'}.\n2. Orchestrates topology-aware AI Hypercomputer compute, Slurm scheduling, and VPC networking.`
            : `1. Executes the [${track}] gcloud 591.0.0 CLI / REST operation (${act}) against project "${projectId}".`,
        costWarning:
          act === 'DEPLOY_BETA_WORKER_POOL'
            ? `CONTINUOUS WORKER BILLING WARNING ([BETA]): Cloud Run Worker Pools run non-HTTP background instances continuously (${body.instances || 1} instance(s) active 24/7) and do NOT scale to zero when idle. You will be billed hourly for vCPU and Memory until the worker pool is deleted or scaled down.`
            : act === 'DEPLOY_ALPHA_MODEL_ARMOR_TEMPLATE'
            ? `MODEL ARMOR & SDP BILLING NOTICE ([GA 591.0.0]): Creating a Model Armor template is free of fixed hourly compute cost, but invoking sanitize-user-prompt / sanitize-model-response and Sensitive Data Protection (SDP) inspection incurs per-token / per-MB API inspection charges.`
            : act === 'APPLY_BETA_QUOTA_PREFERENCE_OR_ADJUSTER'
            ? `QUOTA CEILING & FINOPS WARNING ([GA/BETA]): Enabling the Autonomous Quota Adjuster allows Google Cloud to automatically request higher quota limits when utilization nears 80%. Raising quota ceilings does not charge by itself, but permits higher maximum resource consumption.`
            : act === 'PROVISION_ALPHA_CLUSTER_DIRECTOR_BLUEPRINT'
            ? `HIGH-COST AI HYPERCOMPUTER WARNING ([GA 591.0.0]): Cluster Director provisions multi-node HPC / GPU / TPU Slurm clusters (${body.acceleratorProfile || 'A3 Mega / H100'}). If fulfilled in your project, GPU/TPU nodes and Managed Lustre storage incur high hourly compute charges ($/hr).`
            : `PRE-GA [${track}] & COST NOTICE: [${track}] commands invoke Google Cloud SDK 591.0.0 APIs. Any provisioned compute, multi-region replicas, compliance reports, or entitlements follow Google Cloud pricing and SLA terms.`,
        impactWarning: `You are executing a [${track}] operation on live project "${projectId}".`,
      };
    }

    // 3D-bis. App Engine Service & Version Exterminator, `default` $0/mo Neutralizer & Migrator (/appengine/action)
    if (rawUrl.includes('/appengine/action')) {
      const act = String(body.action || '').toUpperCase();
      const svcId = body.serviceId || 'default';
      const verId = body.versionId || '';
      return {
        gateType:
          act === 'DELETE_SERVICE' ||
          act === 'DELETE_VERSION' ||
          act === 'NEUTRALIZE_DEFAULT_SERVICE_TO_ZERO' ||
          act === 'TOGGLE_APP_SERVING_STATUS'
            ? 'DELETE'
            : 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title:
          act === 'DELETE_SERVICE'
            ? `Permanently Delete App Engine Service "${svcId}"?`
            : act === 'DELETE_VERSION'
            ? `Permanently Delete App Engine Version "${svcId}/${verId}"?`
            : act === 'NEUTRALIZE_DEFAULT_SERVICE_TO_ZERO'
            ? `Neutralize Un-Deletable App Engine "default" Service to $0.00/mo?`
            : act === 'TOGGLE_APP_SERVING_STATUS'
            ? `${body.targetStatus === 'SERVING' ? 'Re-Enable' : 'Disable'} Entire App Engine Application (${projectId}.appspot.com)?`
            : act === 'MIGRATE_TO_CLOUD_RUN'
            ? `Migrate App Engine Service "${svcId}" to Scale-to-Zero Cloud Run?`
            : `Confirm App Engine Action (${act}) on "${svcId}"?`,
        headerBadge: 'App Engine Service Exterminator & $0/mo Neutralizer Gatekeeper',
        targetLabel: 'Target App Engine Resource',
        resourceKind: 'Google App Engine Admin REST API (appengine.googleapis.com/v1)',
        targetName: verId ? `${projectId}/${svcId}/${verId}` : `${projectId}/${svcId}`,
        location: body.region || 'global',
        projectId,
        method: `APPENGINE ${act}`,
        endpoint: rawUrl,
        confirmLabel:
          act === 'DELETE_SERVICE'
            ? `Delete App Engine Service "${svcId}"`
            : act === 'DELETE_VERSION'
            ? `Delete Version "${verId}"`
            : act === 'NEUTRALIZE_DEFAULT_SERVICE_TO_ZERO'
            ? `Neutralize "default" Service to $0.00/mo`
            : act === 'TOGGLE_APP_SERVING_STATUS'
            ? `${body.targetStatus === 'SERVING' ? 'Re-Enable' : 'Disable'} App Engine (${body.targetStatus || 'USER_DISABLED'})`
            : `Execute ${act}`,
        cancelToast: `App Engine action (${act}) cancelled.`,
        whatHappensNext:
          act === 'DELETE_SERVICE'
            ? `1. Calls DELETE https://appengine.googleapis.com/v1/apps/${projectId}/services/${svcId} directly (bypassing the missing Delete button in the GCP Console UI).\n2. Permanently deletes service "${svcId}" and all of its deployed versions.`
            : act === 'NEUTRALIZE_DEFAULT_SERVICE_TO_ZERO'
            ? `1. Because Google Cloud forbids deleting the "default" service at the API level, this deletes all non-traffic-receiving zombie versions in "default".\n2. Stops active manual/basic/Flex versions and sets the App Engine application servingStatus to USER_DISABLED so instance billing drops to $0.00/mo.`
            : act === 'TOGGLE_APP_SERVING_STATUS'
            ? `1. Calls PATCH https://appengine.googleapis.com/v1/apps/${projectId}?updateMask=servingStatus with servingStatus="${body.targetStatus || 'USER_DISABLED'}".\n2. Immediately stops or resumes all App Engine traffic and instance billing across the project.`
            : act === 'MIGRATE_TO_CLOUD_RUN'
            ? `1. Deploys a new scale-to-zero Cloud Run v2 service ("ae-${svcId}") in ${body.region || 'us-central1'} with minInstanceCount=0 and cpuIdle=true ($0.00/mo idle).`
            : `1. Executes ${act} on App Engine service "${svcId}"${verId ? ` (version "${verId}")` : ''} via appengine.googleapis.com/v1.`,
        costWarning:
          act === 'MIGRATE_TO_CLOUD_RUN'
            ? `SCALE-TO-ZERO ($0.00/MO IDLE): The migrated Cloud Run v2 service is configured with minInstanceCount=0 and request-only CPU billing.`
            : `FINOPS SAVINGS ($0.00/MO): Deleting non-default App Engine services, purging zombie versions, or disabling the App Engine application (USER_DISABLED) immediately halts ongoing App Engine Flexible/Standard instance charges.`,
        impactWarning: `Mutates live App Engine state (${act}) in project "${projectId}".`,
      };
    }

    // 3E. 1-Tap Resource Control Center Actions (/api/project/:id/action)
    if (rawUrl.endsWith('/action') && !rawUrl.includes('/quantum-nexus/action') && !rawUrl.includes('/wave10/action') && !rawUrl.includes('/data-engineer/action') && !rawUrl.includes('/aws-azure-parity/action') && !rawUrl.includes('/alpha-beta/action') && !rawUrl.includes('/appengine/action') && !rawUrl.includes('/secrets-kms/action') && !rawUrl.includes('/credentials/action')) {
      const act = String(body.actionType || body.action || '').toUpperCase();
      const resId = body.resourceId || body.resourceName || 'target-resource';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title:
          act === 'ROLLBACK_CANARY'
            ? `Confirm 1-Tap Canary Rollback on "${resId}"?`
            : `Confirm 1-Tap Live FinOps Optimization on "${resId}"?`,
        headerBadge: 'CloudPulse 2026 1-Tap SRE & FinOps Gatekeeper',
        targetLabel: 'Target Live Resource to Mutate',
        resourceKind: body.resourceType || 'Google Cloud Resource',
        targetName: `${resId} (${act})`,
        location: body.region || 'global',
        projectId,
        method: `1-TAP ${act}`,
        endpoint: rawUrl,
        confirmLabel: `Confirm & Execute ${act} on GCP`,
        cancelToast: `1-Tap ${act} on "${resId}" cancelled.`,
        whatHappensNext:
          act === 'ROLLBACK_CANARY'
            ? `1. Fetches the live revision history of "${resId}" via run.googleapis.com/v2.\n2. Shifts 100% of production HTTPS traffic back to the prior stable revision.`
            : `1. Inspects resource type of "${resId}".\n2. Calls the corresponding Google Cloud REST API (PATCH storage.googleapis.com for Autoclass/PAP, PATCH bigquery.googleapis.com for PHYSICAL compressed billing, or PATCH run.googleapis.com/v2 for cpuIdle: true & minInstanceCount: 0).`,
        costWarning:
          act === 'ROLLBACK_CANARY'
            ? `BILLING IMPACT ($0.00): Shifting traffic percentages between existing Cloud Run revisions is a free control-plane operation.`
            : `FINOPS COST REDUCTION: Enables Scale-to-Zero / Autoclass / Physical Compressed Storage to reduce ongoing monthly spend. Note: GCS Autoclass and BigQuery Physical billing changes have minimum transition windows in Google Cloud.`,
        impactWarning: `This directly mutates live resource "${resId}" in project "${projectId}" via Google Cloud REST APIs.`,
      };
    }

    // 3F. 1-Tap Transactional Synthesis Runbooks (/synthesis/runbook with mode === 'EXECUTE')
    if (rawUrl.includes('/synthesis/runbook')) {
      const rbId = body.runbookId || 'COMPOSITE_RUNBOOK';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm 1-Tap Multi-Step Runbook Execution ("${rbId}")?`,
        headerBadge: 'CloudPulse 2026 Transactional Runbook Gatekeeper',
        targetLabel: 'Multi-API Remediation Runbook',
        resourceKind: 'Cross-Service Control-Plane Runbook',
        targetName: rbId,
        location: 'Project-Wide',
        projectId,
        method: '1-TAP RUNBOOK EXECUTE',
        endpoint: rawUrl,
        confirmLabel: `Confirm & Execute Live Runbook (${rbId})`,
        cancelToast: `Runbook "${rbId}" execution cancelled.`,
        whatHappensNext: `1. Executes each step of "${rbId}" sequentially against live Google Cloud REST APIs (VPC Firewalls, Cloud Run scaling, GCS compliance, BigQuery PHYSICAL billing).\n2. Computes a cryptographic SHA-256 Merkle state receipt before and after execution.`,
        costWarning: `CLOUD BILLING & CONFIGURATION IMPACT: Modifies live firewall rules, scaling floors (minInstanceCount -> 0), or storage billing models across multiple resources in project "${projectId}".`,
        impactWarning: `This executes live multi-resource mutations across "${projectId}".`,
      };
    }

    // 3G. Compute Engine VM Power / Machine Type / Deletion Protection (/vms/:zone/:name/power)
    const vmPowerMatch = rawUrl.match(/\/vms\/([^/]+)\/([^/]+)\/power|\/vms\/([^/]+)\/power/);
    if (vmPowerMatch) {
      const act = String(body.action || 'POWER_ACTION').toUpperCase();
      const vmName = decodeURIComponent(
        vmPowerMatch[2] || vmPowerMatch[3] || body.name || 'vm-instance'
      );
      const zone = decodeURIComponent(vmPowerMatch[1] || body.zone || 'gcp-zone');
      const isStart = act === 'START' || act === 'RESUME' || act === 'RESET';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm 1-Tap VM Action: ${act} on "${vmName}"?`,
        headerBadge: 'CloudPulse 2026 Compute Engine & Cost Gatekeeper',
        targetLabel: 'Target Compute Engine VM Instance',
        resourceKind: 'Compute Engine VM (compute.googleapis.com/v1)',
        targetName: `${vmName} (${act})`,
        location: zone,
        projectId,
        method: `VM ${act}`,
        endpoint: rawUrl,
        confirmLabel: `Confirm & ${act} VM "${vmName}"`,
        cancelToast: `VM action ${act} on "${vmName}" cancelled.`,
        whatHappensNext: `1. Calls compute.googleapis.com/v1/projects/${projectId}/zones/${zone}/instances/${vmName}/${act.toLowerCase()}.\n2. Polls the live GCP Zone Operation until the VM state transitions.`,
        costWarning: isStart
          ? `ACTIVE VM BILLING WARNING: Starting or resuming "${vmName}" immediately begins continuous hourly vCPU, Memory, and GPU billing ($/hr) until the instance is stopped.`
          : act === 'STOP' || act === 'SUSPEND'
          ? `RESIDUAL DISK & STATIC IP BILLING WARNING: Stopping "${vmName}" halts vCPU/RAM charges ($0/hr compute), but its attached Boot Persistent Disk ($0.04–$0.17/GB-mo) and any reserved Static External IP ($7.30/mo) CONTINUE billing while stopped!`
          : `Changing machine type or deletion protection updates the VM's hardware billing rate or termination lock in "${zone}".`,
        impactWarning: `This mutates the live state of Compute Engine VM "${vmName}" in "${zone}".`,
      };
    }

    // 3G-1. Wave 11 Cloud Deploy Delivery Pipeline & 3-Stage Targets (/wave11/clouddeploy/pipeline)
    if (rawUrl.includes('/wave11/clouddeploy/pipeline')) {
      const pipeId = body.pipelineId || 'cloudpulse-canary-pipeline';
      const reg = body.region || 'us-central1';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm 1-Tap Cloud Deploy Pipeline ("${pipeId}")?`,
        headerBadge: 'Wave 11 Cloud Deploy & Canary Delivery Gatekeeper',
        targetLabel: 'Cloud Deploy Delivery Pipeline & 3 Cloud Run Targets',
        resourceKind: 'Cloud Deploy Pipeline + 3 Targets (clouddeploy.googleapis.com/v1)',
        targetName: `${pipeId} (${pipeId}-dev → ${pipeId}-staging → ${pipeId}-prod)`,
        location: reg,
        projectId,
        method: '1-TAP CLOUD DEPLOY',
        endpoint: rawUrl,
        confirmLabel: `Confirm & Provision "${pipeId}"`,
        cancelToast: `Cloud Deploy pipeline "${pipeId}" cancelled.`,
        whatHappensNext: `1. Enables clouddeploy.googleapis.com on project "${projectId}" if not yet active.\n2. Provisions 3 Cloud Run delivery targets (${pipeId}-dev, ${pipeId}-staging, ${pipeId}-prod) in ${reg}.\n3. Creates the serial + Canary (25% → 50% → 100%) DeliveryPipeline via clouddeploy.googleapis.com/v1.`,
        costWarning: `CLOUD DEPLOY FREE-TIER & PRICING NOTICE: Your first 1 active Delivery Pipeline per billing account is FREE ($0.00/mo). Each additional active Delivery Pipeline costs $18.00/mo, plus standard Cloud Build minutes (2,500 build-min/mo Always Free) when releases are promoted.`,
        impactWarning: `This provisions a live Cloud Deploy delivery pipeline and 3 delivery targets in "${projectId}" (${reg}).`,
      };
    }

    // 3G-2. Wave 11 Cloud Firestore Native Database Provisioner (/wave11/firestore/database)
    if (rawUrl.includes('/wave11/firestore/database')) {
      const dbId = body.databaseId || '(default)';
      const locId = body.locationId || 'nam5';
      const dbType = body.type || 'FIRESTORE_NATIVE';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm 1-Tap Firestore Database Provisioning ("${dbId}")?`,
        headerBadge: 'Wave 11 Cloud Firestore Native & Free-Tier Gatekeeper',
        targetLabel: 'Cloud Firestore Database Instance',
        resourceKind: `Cloud Firestore (${dbType} · firestore.googleapis.com/v1)`,
        targetName: `${dbId} (${locId})`,
        location: locId,
        projectId,
        method: '1-TAP CREATE FIRESTORE DB',
        endpoint: rawUrl,
        confirmLabel: `Confirm & Provision Firestore "${dbId}"`,
        cancelToast: `Firestore database "${dbId}" provisioning cancelled.`,
        whatHappensNext: `1. Enables firestore.googleapis.com on project "${projectId}".\n2. Calls POST https://firestore.googleapis.com/v1/projects/${projectId}/databases?databaseId=${dbId} with locationId="${locId}", type="${dbType}", and pointInTimeRecoveryEnablement="POINT_IN_TIME_RECOVERY_ENABLED".`,
        costWarning: `FIRESTORE ALWAYS FREE TIER & BILLING NOTICE: The "(default)" Firestore database includes 1 GiB storage, 50,000 document reads/day, 20,000 writes/day, and 20,000 deletes/day for $0.00/mo Always Free. Named non-default databases and usage above the daily free tier are billed per GiB and per 100k operations.`,
        impactWarning: `This creates a live Cloud Firestore database "${dbId}" in location "${locId}" on project "${projectId}".`,
      };
    }

    // 3G-3. Wave 11 Cloud Firestore Live Document Write (/wave11/firestore/documents)
    if (rawUrl.includes('/wave11/firestore/documents')) {
      const dbId = body.databaseId || '(default)';
      const colId = body.collectionId || 'cloudpulse_ops';
      const docId = body.documentId || 'auto-id';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Confirm Live Firestore Document Write ("${colId}/${docId}")?`,
        headerBadge: 'Wave 11 Cloud Firestore Document Mutation Gatekeeper',
        targetLabel: 'Target Firestore Collection & Document Path',
        resourceKind: 'Cloud Firestore Document (firestore.googleapis.com/v1)',
        targetName: `${dbId} / ${colId} / ${docId}`,
        location: dbId,
        projectId,
        method: 'WRITE FIRESTORE DOC',
        endpoint: rawUrl,
        confirmLabel: `Confirm & Write Document "${docId}"`,
        cancelToast: `Firestore document write to "${colId}/${docId}" cancelled.`,
        whatHappensNext: `1. Encodes your JSON payload into typed Firestore Value fields (stringValue, integerValue, doubleValue, booleanValue, mapValue, arrayValue).\n2. Calls PATCH https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${colId}/${docId} to upsert the live document.`,
        costWarning: `FIRESTORE WRITE QUOTA NOTICE: Counts as 1 document write operation against your 20,000 FREE writes/day Always Free allowance ($0.00 within Free Tier; $0.18 per 100,000 writes beyond Free Tier).`,
        impactWarning: `This writes live document "${colId}/${docId}" into Firestore database "${dbId}" on project "${projectId}".`,
      };
    }

    // 3G-4. Wave 16 Autonomous Cloud SOC Read-Only Diagnostic & BAS Endpoints + VM SCP/SFTP, SSH Identity Mode & Storage Workbench / S3 Importer (Bypass Gatekeeper)
    if (
      rawUrl.includes('/soc/ai-commander') ||
      rawUrl.includes('/soc/deep-probe') ||
      rawUrl.includes('/soc/purple-team-drill') ||
      rawUrl.includes('/soc/ai-red-team-audit') ||
      rawUrl.includes('/wave16/action') ||
      rawUrl.includes('/startup-10x/remediate') ||
      rawUrl.includes('/startup-10x/gemini-mentor') ||
      rawUrl.includes('/vms/ssh-identity-mode') ||
      rawUrl.includes('/scp/') ||
      rawUrl.includes('/s3-compatible/') ||
      rawUrl.includes('/objects/signed-url') ||
      rawUrl.includes('/objects/bundle-download') ||
      rawUrl.includes('/objects/public-access') ||
      rawUrl.includes('/objects/metadata') ||
      rawUrl.includes('/objects/versions') ||
      (rawUrl.includes('/storage/buckets/') &&
        (rawUrl.endsWith('/objects') || rawUrl.includes('/objects/rewrite')) &&
        method === 'post')
    ) {
      return null;
    }

    // 3G-4B. Wave 16 Autonomous 12-Invariant Self-Healing Reconciler (/soc/guardian-reconcile)
    if (rawUrl.includes('/soc/guardian-reconcile')) {
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Execute 12-Invariant Self-Healing Reconciler on "${projectId}"?`,
        headerBadge: 'Wave 16 Autonomous Self-Healing Guardian Gatekeeper',
        targetLabel: 'Target Project Zero-Trust Invariants',
        resourceKind: 'Autonomous 12-Invariant Self-Healing Reconciler',
        targetName: `${projectId} (INV-01 -> INV-12)`,
        location: 'Global Project Perimeter',
        projectId,
        method: 'SELF-HEAL RECONCILE',
        endpoint: rawUrl,
        confirmLabel: 'Confirm & Heal Non-Compliant Invariants',
        cancelToast: `Autonomous Self-Healing Reconciler cancelled.`,
        whatHappensNext: `1. Evaluates all 12 Zero-Trust invariants and remediates auto-healable violations (enforces OS Login, disables serial-port access, enforces GCS Uniform Bucket-Level Access & Public Access Prevention, enables VPC Subnet Private Google Access, enables Binary Authorization dry-run audit logging, and arms $0.00/mo Canary Tripwires).\n2. Signs the reconciliation receipt with Ed25519 (RFC 8032) and appends Terraform HCL changes to the ClickOps-to-GitOps bridge.`,
        costWarning: `ZERO-COST ($0.00/MO) SECURITY OPERATION: All self-healing compliance mutations operate on control-plane metadata and IAM/ACL policies with $0.00/mo in additional Google Cloud billing.`,
        impactWarning: `Please verify before reconciling live security invariants across "${projectId}".`,
      };
    }

    // 3G-5. Wave 16 Autonomous Cloud SOC SOAR & Canary Actions (/soc/action)
    if (rawUrl.includes('/soc/action')) {
      const socAct = String(body.action || 'SOC_SOAR_ACTION').toUpperCase();
      const socTarget =
        body.targetIpCidr ||
        body.serviceName ||
        body.firewallRuleName ||
        body.serviceAccountEmail ||
        body.bucketName ||
        body.datasetId ||
        body.secretId ||
        body.subnetName ||
        body.zoneName ||
        body.repoName ||
        body.routeName ||
        body.exclusionName ||
        body.canaryType ||
        projectId;

      const socSpecs = {
        BLOCK_ATTACKER_IP_CIDR: {
          title: `Quarantine Attacker CIDR "${body.targetIpCidr || socTarget}" at VPC Perimeter?`,
          resourceKind: 'VPC Ingress DENY Firewall Rule (compute.googleapis.com/v1)',
          targetName: `${body.targetIpCidr || socTarget} (VPC: ${body.network || 'default'})`,
          confirmLabel: `Create Priority-100 VPC DENY Rule (${body.targetIpCidr || socTarget})`,
          whatHappensNext: `1. Calls POST https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls to create a priority-100 INGRESS DENY-ALL rule blocking source CIDR "${body.targetIpCidr || socTarget}" across VPC network "${body.network || 'default'}".\n2. Immediately drops all TCP, UDP, and ICMP packets originating from "${body.targetIpCidr || socTarget}" before they reach any VM or GKE node.\n3. Signs an Ed25519 (RFC 8032) forensic containment receipt and generates matching google_compute_firewall Terraform HCL.`,
          costWarning: `ZERO COST ($0.00/MO): Google Cloud VPC Firewall rules and packet-drop enforcement at the Andromeda virtual switch layer incur $0.00/mo.`,
          impactWarning: `All inbound network traffic from "${body.targetIpCidr || socTarget}" into VPC "${body.network || 'default'}" will be dropped immediately. You can remove the quarantine rule anytime with 1 click.`,
        },
        DELETE_QUARANTINE_RULE: {
          gateType: 'DELETE',
          title: `Remove VPC Quarantine Firewall Rule "${body.firewallRuleName || socTarget}"?`,
          resourceKind: 'VPC Quarantine Firewall Rule (compute.googleapis.com/v1)',
          targetName: String(body.firewallRuleName || socTarget),
          confirmLabel: `Delete Quarantine Rule "${body.firewallRuleName || socTarget}"`,
          whatHappensNext: `1. Calls DELETE https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls/${body.firewallRuleName || socTarget}.\n2. Lifts the priority-100 IP CIDR quarantine block on the VPC network.\n3. Appends an Ed25519 un-quarantine audit receipt to the SOC Forensic Ledger.`,
          costWarning: `ZERO COST ($0.00/MO): Deleting a VPC firewall rule is a free control-plane operation.`,
          impactWarning: `Traffic from the previously quarantined IP CIDR will no longer be blocked by rule "${body.firewallRuleName || socTarget}".`,
        },
        REVOKE_CLOUDRUN_PUBLIC_INGRESS: {
          title: `Revoke Public Internet Access (allUsers) on Cloud Run "${body.serviceName || socTarget}"?`,
          resourceKind: 'Cloud Run v2 IAM Policy (run.googleapis.com/v2)',
          targetName: `${body.serviceName || socTarget} (${body.region || 'us-central1'})`,
          confirmLabel: `Strip allUsers & Enforce Zero-Trust IAM Auth`,
          whatHappensNext: `1. Fetches the current IAM policy via GET https://run.googleapis.com/v2/projects/${projectId}/locations/${body.region || 'us-central1'}/services/${body.serviceName || socTarget}:getIamPolicy.\n2. Removes "allUsers" and "allAuthenticatedUsers" from roles/run.invoker while preserving authorized service accounts and IAM principals.\n3. Commits the hardened policy via :setIamPolicy and records an Ed25519 receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Updating Cloud Run IAM policies incurs $0.00/mo and prevents unauthenticated billable container invocations.`,
          impactWarning: `Unauthenticated requests to "${body.serviceName || socTarget}" without a valid Google IAM Bearer/OIDC token will immediately receive HTTP 403 Forbidden.`,
        },
        LOCK_OPEN_VPC_FIREWALL_TO_IAP: {
          title: `Lock Open VPC Firewall Rule "${body.firewallRuleName || socTarget}" to Cloud IAP Only?`,
          resourceKind: 'VPC Firewall Source Range Hardening (compute.googleapis.com/v1)',
          targetName: `${body.firewallRuleName || socTarget} (0.0.0.0/0 -> 35.235.240.0/20)`,
          confirmLabel: `Replace 0.0.0.0/0 with Cloud IAP Range (35.235.240.0/20)`,
          whatHappensNext: `1. Calls PATCH https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls/${body.firewallRuleName || socTarget}.\n2. Replaces open public internet source CIDR "0.0.0.0/0" with Google Cloud Identity-Aware Proxy's official TCP forwarding range "35.235.240.0/20".\n3. Seals an Ed25519 remediation receipt in the SOC Forensic Ledger.`,
          costWarning: `ZERO COST ($0.00/MO): Locking SSH/RDP firewall rules to Cloud IAP TCP forwarding is 100% free ($0.00/mo).`,
          impactWarning: `Direct public internet SSH/RDP connections to port 22/3389 will be blocked; engineers must connect via "gcloud compute ssh --tunnel-through-iap" or the CloudPulse SSH terminal.`,
        },
        TOMBSTONE_APP_ENGINE_EDGE_DENY: {
          title: `Enforce App Engine Edge Firewall DENY Rule (${body.sourceRange || '203.0.113.0/24'})?`,
          resourceKind: 'App Engine Edge Ingress Firewall (appengine.googleapis.com/v1)',
          targetName: `${projectId}.appspot.com · Priority ${body.priority || 1000} DENY`,
          confirmLabel: `Deploy App Engine Edge DENY Rule`,
          whatHappensNext: `1. Calls POST/PATCH https://appengine.googleapis.com/v1/apps/${projectId}/firewall/ingressRules.\n2. Inserts a high-priority DENY ingress rule blocking "${body.sourceRange || '203.0.113.0/24'}" at Google's Global Front End (GFE) before requests reach App Engine instances.\n3. Signs an Ed25519 receipt in the SOC Forensic Ledger.`,
          costWarning: `ZERO COST ($0.00/MO): App Engine Edge Firewall blocks traffic at the GFE edge without waking or billing App Engine instances.`,
          impactWarning: `Requests matching "${body.sourceRange || '203.0.113.0/24'}" to ${projectId}.appspot.com will immediately receive HTTP 403 Forbidden.`,
        },
        DISABLE_SERVICE_ACCOUNT_KEY: {
          title: `Disable Leaked/Aging Service Account Key "${body.keyId || socTarget}"?`,
          resourceKind: 'IAM Service Account User-Managed Key (iam.googleapis.com/v1)',
          targetName: `${body.serviceAccountEmail || 'Service Account'} · Key ${String(body.keyId || '').slice(0, 16)}`,
          confirmLabel: `Immediately Disable RSA Private Key`,
          whatHappensNext: `1. Calls POST https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${body.serviceAccountEmail}/keys/${body.keyId}:disable.\n2. Immediately deactivates the RSA key pair across Google Cloud IAM while preserving key metadata for forensic investigation (reversible via :enable).\n3. Records an Ed25519 containment receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Disabling or re-enabling IAM Service Account keys is a free IAM control-plane operation.`,
          impactWarning: `Any external script or CI/CD runner authenticating with JSON key "${String(body.keyId || '').slice(0, 12)}..." will immediately fail token exchange until migrated to Workload Identity Federation or re-enabled.`,
        },
        DEPLOY_ZERO_COST_CANARY_TRAP: {
          title: `Deploy $0.00/mo Zero-Cost Deception Canary Tripwire (${body.canaryType || 'SECRET_HONEYTOKEN'})?`,
          resourceKind: 'Cloud Deception Honey-Token & Audit Tripwire',
          targetName:
            body.canaryType === 'GCS_HONEYBUCKET'
              ? `gs://${projectId}-soc-canary-vault`
              : `projects/${projectId}/secrets/soc-canary-master-billing-key-2026`,
          confirmLabel: `Arm $0.00/mo Deception Canary Tripwire`,
          whatHappensNext:
            body.canaryType === 'GCS_HONEYBUCKET'
              ? `1. Calls POST https://storage.googleapis.com/storage/v1/b?project=${projectId} to provision decoy bucket "${projectId}-soc-canary-vault" hardened with Public Access Prevention and Uniform IAM.\n2. Arms the Cloud Audit Logs tripwire monitoring storage.googleapis.com access events on the decoy bucket.\n3. Seals an Ed25519 canary deployment receipt.`
              : `1. Calls POST https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets to create decoy secret "soc-canary-master-billing-key-2026" and seeds a fake canary credential payload.\n2. Arms the Cloud Audit Logs tripwire monitoring secretmanager.googleapis.com AccessSecretVersion events.\n3. Seals an Ed25519 canary deployment receipt.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00/MO): Secret Manager includes 6 active secret versions and 10,000 accesses/month for $0.00/mo, and an empty decoy GCS bucket costs $0.00/mo.`,
          impactWarning: `Creates a live decoy honey-token in project "${projectId}" that triggers a CRITICAL SOC alert whenever an unauthorized principal attempts to read it.`,
        },
        TRIGGER_CANARY_AUDIT_PROBE: {
          title: `Fire Live Canary Audit Tripwire Verification Probe?`,
          resourceKind: 'Cloud Audit Logs Canary Verification Probe',
          targetName: `projects/${projectId}/secrets/soc-canary-master-billing-key-2026`,
          confirmLabel: `Trigger Live Canary Access & Verify Cloud Audit Log`,
          whatHappensNext: `1. Calls GET https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/soc-canary-master-billing-key-2026 to generate a real cloudaudit.googleapis.com audit trail entry.\n2. Writes a structured CANARY_TRIPWIRE_VERIFICATION event to Cloud Logging (logging.googleapis.com/v2/entries:write).\n3. Verifies end-to-end tripwire detection latency and signs an Ed25519 receipt.`,
          costWarning: `ZERO COST ($0.00): 1 Secret Manager metadata read and 1 Cloud Logging entry fall well within the Always-Free Tier.`,
          impactWarning: `Generates a real canary verification audit event in Cloud Logging for project "${projectId}".`,
        },
        CAPTURE_IAM_CHECKPOINT: {
          title: `Capture SHA-256 Golden IAM Policy Checkpoint for "${projectId}"?`,
          resourceKind: 'Resource Manager IAM Policy Snapshot (cloudresourcemanager.googleapis.com/v1)',
          targetName: `projects/${projectId} (Live IAM Bindings Snapshot)`,
          confirmLabel: `Capture Golden IAM Checkpoint ($0.00)`,
          whatHappensNext: `1. Calls POST https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy to fetch all live role bindings, conditions, and auditConfigs.\n2. Computes a canonical SHA-256 Merkle digest of the entire IAM policy graph.\n3. Stores the Golden Checkpoint in the SOC state vault for 1-click drift rollback.`,
          costWarning: `100% READ-ONLY SNAPSHOT ($0.00): Reading and hashing the project IAM policy incurs $0.00.`,
          impactWarning: `Captures a point-in-time IAM policy baseline without modifying any existing permissions.`,
        },
        RESTORE_IAM_CHECKPOINT: {
          title: `Roll Back Project IAM Policy to Golden Checkpoint "${body.checkpointId || 'Latest'}"?`,
          resourceKind: 'Resource Manager IAM Policy Rollback (cloudresourcemanager.googleapis.com/v1)',
          targetName: `projects/${projectId} -> Checkpoint ${body.checkpointId || 'Golden Baseline'}`,
          confirmLabel: `Restore IAM Policy to Golden Checkpoint`,
          whatHappensNext: `1. Loads the verified IAM bindings from Golden Checkpoint "${body.checkpointId || 'latest'}".\n2. Calls POST https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:setIamPolicy to overwrite unauthorized role drifts and restore the exact checkpointed bindings.\n3. Signs an Ed25519 IAM rollback receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Restoring project IAM bindings via Resource Manager API is free ($0.00).`,
          impactWarning: `Any IAM role bindings added after Checkpoint "${body.checkpointId || 'latest'}" was captured will be removed immediately.`,
        },
        LOCK_GCS_BUCKET_PUBLIC_ACCESS: {
          title: `Enforce Public Access Prevention & Uniform IAM on Bucket "${body.bucketName || socTarget}"?`,
          resourceKind: 'Cloud Storage Bucket Security Policy (storage.googleapis.com/storage/v1)',
          targetName: `gs://${body.bucketName || socTarget}`,
          confirmLabel: `Lock Bucket "${body.bucketName || socTarget}" (Enforce PAP + UBLA)`,
          whatHappensNext: `1. Calls PATCH https://storage.googleapis.com/storage/v1/b/${body.bucketName || socTarget} with iamConfiguration.publicAccessPrevention="enforced" and uniformBucketLevelAccess.enabled=true.\n2. Strips any "allUsers" or "allAuthenticatedUsers" bindings from the bucket's IAM policy.\n3. Appends an Ed25519 receipt and google_storage_bucket Terraform HCL.`,
          costWarning: `ZERO COST ($0.00/MO): Enforcing Public Access Prevention and Uniform Bucket-Level Access incurs $0.00 and protects against unauthorized public egress bandwidth charges.`,
          impactWarning: `Blocks all anonymous public internet reads/writes on gs://${body.bucketName || socTarget}; only IAM-authorized principals can access objects.`,
        },
        LOCK_ALL_GCS_BUCKETS_PUBLIC_ACCESS: {
          title: `Enforce Public Access Prevention & Uniform IAM Across ALL Buckets in "${projectId}"?`,
          resourceKind: 'Fleet-Wide Cloud Storage Hardening (storage.googleapis.com/storage/v1)',
          targetName: `All Cloud Storage Buckets in ${projectId}`,
          confirmLabel: `Lock All GCS Buckets (PAP + Uniform IAM)`,
          whatHappensNext: `1. Lists all Cloud Storage buckets in project "${projectId}" via GET https://storage.googleapis.com/storage/v1/b?project=${projectId}.\n2. Executes PATCH https://storage.googleapis.com/storage/v1/b/<bucket> on every bucket to set publicAccessPrevention="enforced" and uniformBucketLevelAccess.enabled=true.\n3. Seals a fleet-wide Ed25519 hardening receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Updating bucket IAM configuration metadata across your fleet incurs $0.00/mo.`,
          impactWarning: `Enforces Zero-Trust Public Access Prevention across every Cloud Storage bucket in "${projectId}".`,
        },
        DELETE_LOG_EXCLUSION: {
          gateType: 'DELETE',
          title: `Delete Cloud Logging Sink Exclusion Filter "${body.exclusionName || socTarget}"?`,
          resourceKind: 'Cloud Logging Exclusion Filter (logging.googleapis.com/v2)',
          targetName: `projects/${projectId}/exclusions/${body.exclusionName || socTarget}`,
          confirmLabel: `Delete Log Exclusion & Restore Full Audit Visibility`,
          whatHappensNext: `1. Calls DELETE https://logging.googleapis.com/v2/projects/${projectId}/exclusions/${body.exclusionName || socTarget}.\n2. Immediately stops dropping log entries matched by that exclusion filter so 100% of audit/system logs flow into the _Default sink.\n3. Records an Ed25519 anti-tampering receipt.`,
          costWarning: `LOGGING INGESTION NOTICE: Removing an exclusion filter restores log ingestion into Cloud Logging (first 50 GiB/project/month is Always Free at $0.00/mo; $0.50/GiB beyond 50 GiB).`,
          impactWarning: `Log entries previously suppressed by "${body.exclusionName || socTarget}" will immediately resume ingestion into Cloud Logging.`,
        },
        TOGGLE_SERVICE_ACCOUNT_FREEZE: {
          title: `${body.disable !== false ? 'Freeze & Disable' : 'Unfreeze & Re-Enable'} Service Account "${body.serviceAccountEmail || socTarget}"?`,
          resourceKind: 'IAM Service Account Kill-Switch (iam.googleapis.com/v1)',
          targetName: String(body.serviceAccountEmail || socTarget),
          confirmLabel: `${body.disable !== false ? 'Freeze Service Account Immediately' : 'Re-Enable Service Account'}`,
          whatHappensNext: `1. Calls POST https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${body.serviceAccountEmail || socTarget}:${body.disable !== false ? 'disable' : 'enable'}.\n2. Immediately ${body.disable !== false ? 'suspends all OAuth2 token minting and key authentication' : 'restores normal IAM authentication'} for "${body.serviceAccountEmail || socTarget}".\n3. Records an Ed25519 identity containment receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Freezing or unfreezing an IAM Service Account is a free control-plane operation.`,
          impactWarning:
            body.disable !== false
              ? `Workloads running as "${body.serviceAccountEmail || socTarget}" will be blocked from minting new GCP access tokens until you click Unfreeze.`
              : `Restores normal IAM authentication for "${body.serviceAccountEmail || socTarget}".`,
        },
        EXECUTE_DEFCON1_LOCKDOWN: {
          title: `Execute DEFCON-1 Multi-Vector Project Perimeter Lockdown on "${projectId}"?`,
          resourceKind: 'Autonomous Multi-API Emergency Perimeter Lockdown',
          targetName: `${projectId} (Cloud Run IAM + VPC IAP + GCS PAP)`,
          confirmLabel: `Execute DEFCON-1 Perimeter Lockdown ($0.00)`,
          whatHappensNext: `1. Cloud Run Ingress Lockdown: Strips "allUsers" / "allAuthenticatedUsers" from public Cloud Run services via run.googleapis.com/v2.\n2. VPC Firewall Hardening: Restricts open 0.0.0.0/0 SSH/RDP firewall rules to Cloud IAP range 35.235.240.0/20 via compute.googleapis.com/v1.\n3. Cloud Storage Lockdown: Enforces publicAccessPrevention="enforced" and Uniform IAM across all project buckets via storage.googleapis.com/storage/v1.\n4. Seals a Golden IAM Checkpoint and Ed25519 DEFCON-1 forensic receipt.`,
          costWarning: `ZERO COST ($0.00/MO): All DEFCON-1 containment operations mutate IAM, firewall, and bucket ACL control-plane policies at $0.00/mo.`,
          impactWarning: `HIGH-IMPACT CONTAINMENT: Locks down public unauthenticated Cloud Run endpoints, open 0.0.0.0/0 SSH/RDP firewall rules, and public GCS buckets across "${projectId}".`,
        },
        SEVER_IAM_ESCALATION_BINDING: {
          title: `Sever High-Risk IAM Privilege Escalation Binding (${body.role || 'Admin Role'}) from "${body.member || socTarget}"?`,
          resourceKind: 'Project IAM Policy Binding Surgery (cloudresourcemanager.googleapis.com/v1)',
          targetName: `${body.member || socTarget} -> ${body.role || 'roles/owner'}`,
          confirmLabel: `Remove "${body.role || 'Role'}" from "${body.member || socTarget}"`,
          whatHappensNext: `1. Fetches current project IAM bindings via POST https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:getIamPolicy.\n2. Surgically removes principal "${body.member || socTarget}" from role "${body.role}" while keeping all other roles and principals intact.\n3. Commits the updated policy via :setIamPolicy and signs an Ed25519 receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Modifying project IAM bindings is a free control-plane operation.`,
          impactWarning: `Principal "${body.member || socTarget}" will immediately lose permissions granted by "${body.role}" on project "${projectId}".`,
        },
        HARDEN_PROJECT_OSLOGIN_AND_SERIAL_PORT: {
          title: `Enforce Project-Wide IAM OS Login & Disable VM Serial Port Access on "${projectId}"?`,
          resourceKind: 'Compute Engine Common Instance Metadata (compute.googleapis.com/v1)',
          targetName: `projects/${projectId} (enable-oslogin=TRUE, serial-port-enable=FALSE)`,
          confirmLabel: `Enforce OS Login & Disable Serial Port Project-Wide`,
          whatHappensNext: `1. Reads existing project metadata via GET https://compute.googleapis.com/compute/v1/projects/${projectId}.\n2. Calls POST https://compute.googleapis.com/compute/v1/projects/${projectId}/setCommonInstanceMetadata with "enable-oslogin=TRUE" and "serial-port-enable=FALSE" while preserving all other metadata keys.\n3. Signs an Ed25519 CIS Benchmark compliance receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Enforcing IAM OS Login and disabling interactive serial console access is 100% free ($0.00/mo).`,
          impactWarning: `All Compute Engine VMs in "${projectId}" will authenticate SSH sessions via Google Cloud IAM roles (roles/compute.osLogin) + 2FA instead of static SSH keys.`,
        },
        PURGE_PROJECT_WIDE_SSH_KEYS: {
          title: `Purge Project-Wide Static SSH Keys from Compute Engine Metadata on "${projectId}"?`,
          resourceKind: 'Compute Engine Metadata SSH Key Purge (compute.googleapis.com/v1)',
          targetName: `projects/${projectId}/commonInstanceMetadata (ssh-keys / sshKeys)`,
          confirmLabel: `Purge Static Project SSH Keys & Enforce OS Login`,
          whatHappensNext: `1. Inspects commonInstanceMetadata on project "${projectId}" via compute.googleapis.com/v1.\n2. Strips legacy project-wide "ssh-keys", "sshKeys", and "block-project-ssh-keys=false" entries and sets "enable-oslogin=TRUE".\n3. Commits via setCommonInstanceMetadata and seals an Ed25519 receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Updating Compute Engine project metadata incurs $0.00/mo.`,
          impactWarning: `Removes lateral-movement static SSH public keys shared across all VMs in "${projectId}".`,
        },
        LOCK_BIGQUERY_DATASET_PUBLIC_ACL: {
          title: `Revoke Public Access (allUsers / allAuthenticatedUsers) on BigQuery Dataset "${body.datasetId || socTarget}"?`,
          resourceKind: 'BigQuery Dataset Access Control List (bigquery.googleapis.com/bigquery/v2)',
          targetName: `${projectId}:${body.datasetId || socTarget}`,
          confirmLabel: `Lock BigQuery Dataset ACL ("${body.datasetId || socTarget}")`,
          whatHappensNext: `1. Fetches dataset metadata via GET https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${body.datasetId || socTarget}.\n2. Filters out any access[] entries granting access to "allUsers" or "allAuthenticatedUsers".\n3. Calls PATCH https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${body.datasetId || socTarget} and signs an Ed25519 receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Hardening BigQuery dataset ACLs is free ($0.00/mo) and prevents unauthorized third parties from running queries against your tables.`,
          impactWarning: `Dataset "${body.datasetId || socTarget}" will only be accessible to explicitly authorized IAM principals in "${projectId}".`,
        },
        ROTATE_SECRET_VERSION_NOW: {
          title: `Cryptographically Rotate Secret Manager Secret "${body.secretId || socTarget}" Now?`,
          resourceKind: 'Secret Manager Cryptographic Version Rotation (secretmanager.googleapis.com/v1)',
          targetName: `projects/${projectId}/secrets/${body.secretId || socTarget}`,
          confirmLabel: `Mint Fresh 256-Bit SecretVersion & Disable Old Versions`,
          whatHappensNext: `1. Generates 256 bits of CSPRNG cryptographic entropy.\n2. Calls POST https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${body.secretId || socTarget}:addVersion to append a new ENABLED SecretVersion.\n3. Calls :disable on superseded older versions (so they stop billing and cannot be read) and seals an Ed25519 rotation receipt.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00 WITHIN FREE TIER): Disabling old versions ensures only 1 active version remains billed (first 6 active secret versions per month across the project are $0.00/mo Always Free).`,
          impactWarning: `Workloads referencing "${body.secretId || socTarget}@latest" will immediately receive the newly rotated secret version on their next read.`,
        },
        ROTATE_ALL_STALE_SECRETS: {
          title: `Batch-Rotate All Stale / Unversioned Secrets Across Project "${projectId}"?`,
          resourceKind: 'Secret Manager Fleet Cryptographic Rotation (secretmanager.googleapis.com/v1)',
          targetName: `All Stale Secrets in ${projectId}`,
          confirmLabel: `Rotate All Stale Secrets to Fresh Version`,
          whatHappensNext: `1. Lists all secrets in project "${projectId}" via GET https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets.\n2. Appends a fresh 256-bit cryptographic SecretVersion (:addVersion) to every secret whose latest version is >90 days old or missing, and disables stale prior versions.\n3. Seals a fleet-wide Ed25519 rotation receipt.`,
          costWarning: `ZERO NET VERSION CREEP: Prior versions are automatically disabled ($0.00/mo for disabled versions), keeping active version counts minimal.`,
          impactWarning: `Rotates all stale secrets in "${projectId}" and disables their superseded versions.`,
        },
        ENFORCE_SUBNET_PRIVATE_GOOGLE_ACCESS: {
          title: `Enable Private Google Access (PGA) on VPC Subnet "${body.subnetName || socTarget}" (${body.region || 'us-central1'})?`,
          resourceKind: 'VPC Subnetwork Private Google Access (compute.googleapis.com/v1)',
          targetName: `projects/${projectId}/regions/${body.region || 'us-central1'}/subnetworks/${body.subnetName || socTarget}`,
          confirmLabel: `Enable Private Google Access ($0.00/mo)`,
          whatHappensNext: `1. Calls POST https://compute.googleapis.com/compute/v1/projects/${projectId}/regions/${body.region || 'us-central1'}/subnetworks/${body.subnetName || socTarget}/setPrivateIpGoogleAccess with {"privateIpGoogleAccess": true}.\n2. Routes traffic from internal-only VMs/containers to *.googleapis.com over Google's internal Andromeda backbone without requiring public NAT IPs.\n3. Signs an Ed25519 receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Enabling Private Google Access on VPC subnets is 100% free ($0.00/mo) and avoids Cloud NAT gateway hourly/per-GB processing fees for Google API traffic.`,
          impactWarning: `Workloads in subnet "${body.subnetName || socTarget}" (${body.region || 'us-central1'}) can now reach Google Cloud APIs privately without external IPv4 addresses.`,
        },
        ENFORCE_ALL_SUBNETS_PGA: {
          title: `Enforce Private Google Access (PGA) Across ALL VPC Subnets in "${projectId}"?`,
          resourceKind: 'Fleet-Wide VPC Subnetwork PGA Hardening (compute.googleapis.com/v1)',
          targetName: `All VPC Subnetworks in ${projectId}`,
          confirmLabel: `Enable PGA on All Non-Compliant Subnets ($0.00/mo)`,
          whatHappensNext: `1. Queries GET https://compute.googleapis.com/compute/v1/projects/${projectId}/aggregated/subnetworks across all regions.\n2. Calls POST .../subnetworks/<name>/setPrivateIpGoogleAccess with {"privateIpGoogleAccess": true} on every subnet where privateIpGoogleAccess is false.\n3. Seals a fleet-wide Ed25519 network perimeter receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Private Google Access is completely free across all regions and VPC subnets ($0.00/mo).`,
          impactWarning: `Enables Private Google Access across 100% of VPC subnets in project "${projectId}" with zero downtime.`,
        },
        ENABLE_CLOUD_DNS_DNSSEC: {
          title: `Enable Cryptographic DNSSEC Signing on Cloud DNS Zone "${body.zoneName || socTarget}"?`,
          resourceKind: 'Cloud DNS Managed Zone DNSSEC (dns.googleapis.com/dns/v1)',
          targetName: `projects/${projectId}/managedZones/${body.zoneName || socTarget}`,
          confirmLabel: `Enable DNSSEC Signing on "${body.zoneName || socTarget}"`,
          whatHappensNext: `1. Calls PATCH https://dns.googleapis.com/dns/v1/projects/${projectId}/managedZones/${body.zoneName || socTarget} with dnssecConfig.state="on".\n2. Google Cloud DNS automatically provisions KSK and ZSK cryptographic signing keys and signs zone RRsets with RRSIG records.\n3. Signs an Ed25519 DNS integrity receipt.`,
          costWarning: `ZERO EXTRA CHARGE FOR DNSSEC ($0.00): Enabling DNSSEC on an existing Cloud DNS Managed Zone incurs $0.00 in additional charges.`,
          impactWarning: `Cryptographically signs DNS responses for zone "${body.zoneName || socTarget}" to prevent DNS spoofing and cache poisoning.`,
        },
        PROVISION_HARDENED_DNS_ZONE: {
          title: `Provision DNSSEC-Hardened Cloud DNS Zone "${body.zoneName || 'cloudpulse-soc-zone'}"?`,
          resourceKind: 'Cloud DNS Managed Zone with DNSSEC (dns.googleapis.com/dns/v1)',
          targetName: `${body.zoneName || 'cloudpulse-soc-zone'} (${body.dnsName || `${projectId}.internal.`})`,
          confirmLabel: `Create DNSSEC-Hardened Cloud DNS Zone`,
          whatHappensNext: `1. Enables dns.googleapis.com on project "${projectId}" if not yet active.\n2. Calls POST https://dns.googleapis.com/dns/v1/projects/${projectId}/managedZones to create zone "${body.zoneName || 'cloudpulse-soc-zone'}" (${body.dnsName || `${projectId}.internal.`}) with dnssecConfig.state="on".\n3. Seals an Ed25519 receipt.`,
          costWarning: `CLOUD DNS PRICING NOTICE: Google Cloud DNS bills $0.20 per managed zone per month (prorated hourly at ~$0.00027/hr) plus $0.40 per million DNS queries.`,
          impactWarning: `Creates a live DNSSEC-signed Cloud DNS Managed Zone in project "${projectId}".`,
        },
        PROVISION_SOC_KMS_KEYRING: {
          title: `Provision Cloud KMS KeyRing & 90-Day Auto-Rotating CMEK Key in "${projectId}"?`,
          resourceKind: 'Cloud KMS KeyRing + Symmetric CryptoKey (cloudkms.googleapis.com/v1)',
          targetName: `projects/${projectId}/locations/global/keyRings/cloudpulse-soc-keyring/cryptoKeys/soc-cmek-primary-key`,
          confirmLabel: `Provision KMS KeyRing & 90-Day Auto-Rotating Key`,
          whatHappensNext: `1. Enables cloudkms.googleapis.com on project "${projectId}" if not yet active.\n2. Creates KeyRing "cloudpulse-soc-keyring" in location "global" via POST https://cloudkms.googleapis.com/v1/projects/${projectId}/locations/global/keyRings.\n3. Creates symmetric ENCRYPT_DECRYPT CryptoKey "soc-cmek-primary-key" configured with a 90-day automatic rotation schedule (rotationPeriod="7776000s").`,
          costWarning: `CLOUD KMS PRICING NOTICE: KeyRings are free ($0.00). Each active software symmetric CryptoKey version costs $0.06/month ($0.00 within the Cloud Billing Free Trial credit envelope) plus $0.03 per 10,000 cryptographic operations.`,
          impactWarning: `Creates a permanent Cloud KMS KeyRing and 90-day auto-rotating CMEK key in project "${projectId}". (Note: KMS KeyRings cannot be deleted once created, though individual key versions can be disabled/destroyed.)`,
        },
        DISABLE_UNUSED_GCP_API: {
          title: `Disable Attack-Surface Google Cloud API "${body.serviceName || socTarget}" on "${projectId}"?`,
          resourceKind: 'Service Usage API Surface Reduction (serviceusage.googleapis.com/v1)',
          targetName: `projects/${projectId}/services/${body.serviceName || socTarget}`,
          confirmLabel: `Disable API "${body.serviceName || socTarget}"`,
          whatHappensNext: `1. Calls POST https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${body.serviceName || socTarget}:disable with disableDependentServices=false.\n2. Deactivates the unused API endpoint on project "${projectId}" so compromised credentials cannot abuse it.\n3. Records an Ed25519 attack-surface reduction receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Disabling unused APIs is free and prevents accidental resource provisioning on that API.`,
          impactWarning: `Blocks calls to "${body.serviceName || socTarget}" in project "${projectId}". You can re-enable it anytime with 1 click.`,
        },
        HARDEN_BINARY_AUTH_POLICY: {
          title: `Enforce Binary Authorization Container Attestation Policy on "${projectId}"?`,
          resourceKind: 'Binary Authorization Policy (binaryauthorization.googleapis.com/v1)',
          targetName: `projects/${projectId}/policy (${body.evaluationMode || 'REQUIRE_ATTESTATION'})`,
          confirmLabel: `Enforce Binary Authorization Policy ($0.00)`,
          whatHappensNext: `1. Enables binaryauthorization.googleapis.com on project "${projectId}" if not yet active.\n2. Calls PUT https://binaryauthorization.googleapis.com/v1/projects/${projectId}/policy with globalPolicyEvaluationMode="ENABLE", evaluationMode="${body.evaluationMode || 'REQUIRE_ATTESTATION'}", and dryRun=${body.dryRun !== false} (audit enforcement).\n3. Signs an Ed25519 container supply-chain receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Configuring Binary Authorization policy evaluation in audit/dry-run mode incurs $0.00/mo.`,
          impactWarning: `Updates the project-wide Binary Authorization container admission policy on "${projectId}".`,
        },
        PROVISION_IMMUTABLE_ARTIFACT_REPO: {
          title: `Provision Immutable-Tag Docker Artifact Registry "${body.repoName || 'cloudpulse-immutable-containers'}"?`,
          resourceKind: 'Artifact Registry Docker Repository (artifactregistry.googleapis.com/v1)',
          targetName: `projects/${projectId}/locations/${body.region || 'us-central1'}/repositories/${body.repoName || 'cloudpulse-immutable-containers'}`,
          confirmLabel: `Create Immutable Docker Repository ($0.00 Empty)`,
          whatHappensNext: `1. Enables artifactregistry.googleapis.com on project "${projectId}" if not yet active.\n2. Calls POST https://artifactregistry.googleapis.com/v1/projects/${projectId}/locations/${body.region || 'us-central1'}/repositories?repositoryId=${body.repoName || 'cloudpulse-immutable-containers'} with format="DOCKER" and dockerConfig.immutableTags=true.\n3. Seals an Ed25519 supply-chain receipt.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00 UP TO 0.5 GB): Empty Artifact Registry repositories cost $0.00/mo, and Google Cloud includes 0.5 GB of free Artifact Registry storage per month ($0.10/GB-mo beyond 0.5 GB).`,
          impactWarning: `Creates a live Docker repository in "${body.region || 'us-central1'}" where image tags cannot be overwritten or mutated once pushed.`,
        },
        ENFORCE_ARTIFACT_REPO_IMMUTABLE_TAGS: {
          title: `Lock Container Image Tags (immutableTags=true) on Repository "${body.repoName || socTarget}"?`,
          resourceKind: 'Artifact Registry Tag Immutability (artifactregistry.googleapis.com/v1)',
          targetName: `projects/${projectId}/locations/${body.location || 'us-central1'}/repositories/${body.repoName || socTarget}`,
          confirmLabel: `Enforce Immutable Image Tags ($0.00)`,
          whatHappensNext: `1. Calls PATCH https://artifactregistry.googleapis.com/v1/projects/${projectId}/locations/${body.location || 'us-central1'}/repositories/${body.repoName || socTarget}?updateMask=dockerConfig.immutableTags with dockerConfig.immutableTags=true.\n2. Prevents attackers or compromised CI pipelines from overwriting existing tags (like :latest or :prod) with trojanized images.\n3. Signs an Ed25519 supply-chain receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Enforcing immutable Docker tags on Artifact Registry incurs $0.00/mo.`,
          impactWarning: `Existing container tags inside "${body.repoName || socTarget}" can no longer be overwritten; each push must use a unique version tag.`,
        },
        DELETE_SUSPICIOUS_VPC_ROUTE: {
          gateType: 'DELETE',
          title: `Delete Suspicious VPC Network Route "${body.routeName || socTarget}"?`,
          resourceKind: 'VPC Network Route (compute.googleapis.com/v1)',
          targetName: `projects/${projectId}/global/routes/${body.routeName || socTarget}`,
          confirmLabel: `Delete Suspicious VPC Route "${body.routeName || socTarget}"`,
          whatHappensNext: `1. Calls DELETE https://compute.googleapis.com/compute/v1/projects/${projectId}/global/routes/${body.routeName || socTarget}.\n2. Removes the custom next-hop route from the VPC routing table.\n3. Seals an Ed25519 network containment receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Deleting a custom VPC route is a free control-plane operation.`,
          impactWarning: `Permanently removes custom route "${body.routeName || socTarget}" from project "${projectId}".`,
        },
      };

      const matchedSoc = socSpecs[socAct];
      if (matchedSoc) {
        return {
          gateType: matchedSoc.gateType || 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: matchedSoc.title,
          headerBadge: 'Wave 16 Autonomous Cloud SOC & SOAR Gatekeeper',
          targetLabel: 'Target Security Perimeter / Identity / Resource',
          resourceKind: matchedSoc.resourceKind,
          targetName: matchedSoc.targetName,
          location: body.region || body.location || 'Global / Project-Wide',
          projectId,
          method: `SOC · ${socAct.slice(0, 22)}`,
          endpoint: rawUrl,
          confirmLabel: matchedSoc.confirmLabel,
          cancelToast: `SOC action (${socAct}) cancelled — no changes made.`,
          whatHappensNext: matchedSoc.whatHappensNext,
          costWarning: matchedSoc.costWarning,
          impactWarning: matchedSoc.impactWarning,
        };
      }
    }

    // 3G-6. Wave 8 Principal SRE War-Room Live Remediation & Observability Actions (/wave8/war-room/sre-action)
    if (rawUrl.includes('/wave8/war-room/sre-action')) {
      const sreAct = String(body.action || 'SRE_WAR_ROOM_ACTION').toUpperCase();
      const sreSpecs = {
        CREATE_CLOUD_MONITORING_UPTIME_CHECK: {
          title: `Provision Global Cloud Monitoring HTTPS Uptime Check "${body.displayName || 'CloudPulse Production HTTPS Probe'}"?`,
          resourceKind: 'Cloud Monitoring Uptime Check Config (monitoring.googleapis.com/v3)',
          targetName: `https://${body.host || `${projectId}.appspot.com`}${body.path || '/'} (60s Period)`,
          confirmLabel: `Create Global HTTPS Uptime Check ($0.00/mo)`,
          whatHappensNext: `1. Calls POST https://monitoring.googleapis.com/v3/projects/${projectId}/uptimeCheckConfigs.\n2. Configures Google Cloud Monitoring edge probers across US, Europe, and Asia-Pacific to execute an HTTPS GET request against "https://${body.host || `${projectId}.appspot.com`}${body.path || '/'}" every 60 seconds with a 10s timeout and SSL certificate validation.\n3. Signs an Ed25519 SRE runbook receipt in the War-Room Flight Recorder.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00/MO): Google Cloud Monitoring includes 1 million Uptime Check executions per billing account per month for $0.00/mo Always Free (a 60s probe across 3 regions uses ~129,600 checks/mo = $0.00/mo).`,
          impactWarning: `Provisions a live global HTTPS Uptime Check in Cloud Monitoring for project "${projectId}". You can delete it anytime with 1 click.`,
        },
        DELETE_CLOUD_MONITORING_UPTIME_CHECK: {
          gateType: 'DELETE',
          title: `Delete Cloud Monitoring Uptime Check "${String(body.checkName || '').split('/').pop() || 'Uptime Check'}"?`,
          resourceKind: 'Cloud Monitoring Uptime Check Config (monitoring.googleapis.com/v3)',
          targetName: String(body.checkName || 'projects/uptimeCheckConfigs'),
          confirmLabel: `Delete Uptime Check Config`,
          whatHappensNext: `1. Calls DELETE https://monitoring.googleapis.com/v3/${String(body.checkName || '').replace(/^\/+/, '')}.\n2. Immediately stops global prober execution for this Uptime Check configuration.\n3. Records an Ed25519 teardown receipt in the SRE War-Room ledger.`,
          costWarning: `ZERO COST ($0.00/MO): Deleting an Uptime Check configuration is a free control-plane operation.`,
          impactWarning: `Permanently removes Uptime Check "${String(body.checkName || '').split('/').pop()}" from Cloud Monitoring in project "${projectId}".`,
        },
        CREATE_SLO_ALERT_POLICY: {
          title: `Provision Cloud Monitoring SLO Burn-Rate Alert Policy "${body.displayName || 'CloudPulse 2026 — Golden Signal SLO Fast-Burn Alert'}"?`,
          resourceKind: 'Cloud Monitoring AlertPolicy (monitoring.googleapis.com/v3)',
          targetName: `projects/${projectId}/alertPolicies (${body.displayName || 'Golden Signal SLO Fast-Burn Alert'})`,
          confirmLabel: `Create SLO Burn-Rate Alert Policy ($0.00/mo)`,
          whatHappensNext: `1. Calls POST https://monitoring.googleapis.com/v3/projects/${projectId}/alertPolicies.\n2. Creates an active MQL/MetricThreshold AlertPolicy watching Cloud Run HTTP 5xx error rates (run.googleapis.com/request_count with response_code_class="5xx") over a 300-second rolling window with 30-minute auto-close.\n3. Attaches SRE runbook documentation and signs an Ed25519 receipt.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00/MO): Cloud Monitoring AlertPolicies watching built-in Google Cloud metrics (run.googleapis.com/*) are 100% free ($0.00/mo).`,
          impactWarning: `Creates a live AlertPolicy in Google Cloud Monitoring for project "${projectId}".`,
        },
        TOGGLE_ALERT_POLICY: {
          title: `${body.enabled ? 'Enable' : 'Mute / Disable'} Cloud Monitoring Alert Policy "${String(body.policyName || '').split('/').pop()}"?`,
          resourceKind: 'Cloud Monitoring AlertPolicy State (monitoring.googleapis.com/v3)',
          targetName: `${String(body.policyName || '').split('/').pop()} -> enabled=${Boolean(body.enabled)}`,
          confirmLabel: `${body.enabled ? 'Enable Alert Policy' : 'Disable Alert Policy'}`,
          whatHappensNext: `1. Calls PATCH https://monitoring.googleapis.com/v3/${String(body.policyName || '').replace(/^\/+/, '')}?updateMask=enabled with {"enabled": ${Boolean(body.enabled)}}.\n2. Immediately ${body.enabled ? 'activates threshold evaluation and incident firing' : 'mutes incident firing without deleting the policy definition'}.\n3. Signs an Ed25519 SRE receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Toggling AlertPolicy state is a free control-plane update.`,
          impactWarning: `Updates live evaluation state of AlertPolicy "${String(body.policyName || '').split('/').pop()}" in project "${projectId}".`,
        },
        DELETE_ALERT_POLICY: {
          gateType: 'DELETE',
          title: `Delete Cloud Monitoring Alert Policy "${String(body.policyName || '').split('/').pop()}"?`,
          resourceKind: 'Cloud Monitoring AlertPolicy (monitoring.googleapis.com/v3)',
          targetName: String(body.policyName || 'AlertPolicy'),
          confirmLabel: `Delete Alert Policy`,
          whatHappensNext: `1. Calls DELETE https://monitoring.googleapis.com/v3/${String(body.policyName || '').replace(/^\/+/, '')}.\n2. Permanently removes the AlertPolicy definition from Cloud Monitoring.\n3. Records an Ed25519 teardown receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Deleting an AlertPolicy incurs $0.00.`,
          impactWarning: `Permanently removes AlertPolicy "${String(body.policyName || '').split('/').pop()}" from project "${projectId}".`,
        },
        CREATE_LOG_BASED_SLI_METRIC: {
          title: `Provision Cloud Logging SLI Counter Metric "${body.metricName || 'cloudpulse_sre_error_burst_sli'}"?`,
          resourceKind: 'Cloud Logging Log-Based Metric (logging.googleapis.com/v2)',
          targetName: `projects/${projectId}/metrics/${body.metricName || 'cloudpulse_sre_error_burst_sli'}`,
          confirmLabel: `Provision Log-Based SLI Metric ($0.00/mo)`,
          whatHappensNext: `1. Calls POST/PUT https://logging.googleapis.com/v2/projects/${projectId}/metrics/${body.metricName || 'cloudpulse_sre_error_burst_sli'}.\n2. Registers an INT64 DELTA counter metric in logging.googleapis.com/user/${body.metricName || 'cloudpulse_sre_error_burst_sli'} matching filter: \`${body.filter || 'severity>=ERROR'}\`.\n3. Signs an Ed25519 SRE observability receipt.`,
          costWarning: `100% FREE ($0.00/MO): Google Cloud charges $0.00/mo for user-defined Cloud Logging log-based metrics.`,
          impactWarning: `Creates/updates live log-based metric "${body.metricName || 'cloudpulse_sre_error_burst_sli'}" in project "${projectId}".`,
        },
        CREATE_LOG_SLI_5XX: {
          title: `Provision Golden SLI Log Metric "cloudpulse_sre_http_5xx_sli" (HTTP 5xx Fault Counter)?`,
          resourceKind: 'Cloud Logging Log-Based SLI Metric (logging.googleapis.com/v2)',
          targetName: `projects/${projectId}/metrics/cloudpulse_sre_http_5xx_sli`,
          confirmLabel: `Create HTTP 5xx Golden SLI Metric ($0.00/mo)`,
          whatHappensNext: `1. Calls POST https://logging.googleapis.com/v2/projects/${projectId}/metrics.\n2. Creates INT64 DELTA log-based counter metric "cloudpulse_sre_http_5xx_sli" matching filter \`httpRequest.status>=500 OR severity>=ERROR\` across Cloud Run, GKE, and Load Balancers.\n3. Exposes metric \`logging.googleapis.com/user/cloudpulse_sre_http_5xx_sli\` to Cloud Monitoring SLOs and signs an Ed25519 receipt.`,
          costWarning: `100% FREE ($0.00/MO): User-defined log-based metrics in Cloud Logging incur $0.00/mo.`,
          impactWarning: `Provisions live Golden SLI metric "cloudpulse_sre_http_5xx_sli" in project "${projectId}".`,
        },
        CREATE_LOG_SLI_IAM_403: {
          title: `Provision Golden SLI Log Metric "cloudpulse_sre_iam_403_deny_sli" (IAM Permission Denied Counter)?`,
          resourceKind: 'Cloud Logging Log-Based SLI Metric (logging.googleapis.com/v2)',
          targetName: `projects/${projectId}/metrics/cloudpulse_sre_iam_403_deny_sli`,
          confirmLabel: `Create IAM 403 Deny SLI Metric ($0.00/mo)`,
          whatHappensNext: `1. Calls POST https://logging.googleapis.com/v2/projects/${projectId}/metrics.\n2. Creates INT64 DELTA log-based counter metric "cloudpulse_sre_iam_403_deny_sli" matching Cloud Audit Logs filter \`protoPayload.status.code=7 OR protoPayload.status.message:"PERMISSION_DENIED"\`.\n3. Exposes metric \`logging.googleapis.com/user/cloudpulse_sre_iam_403_deny_sli\` for zero-trust anomaly alerting and signs an Ed25519 receipt.`,
          costWarning: `100% FREE ($0.00/MO): User-defined log-based metrics in Cloud Logging incur $0.00/mo.`,
          impactWarning: `Provisions live Golden SLI metric "cloudpulse_sre_iam_403_deny_sli" in project "${projectId}".`,
        },
        BOOTSTRAP_ALL_GOLDEN_SLI_METRICS: {
          title: `Bootstrap All 3 Golden SLI Log-Based Metrics (HTTP 5xx, IAM 403, Chaos Drill) on "${projectId}"?`,
          resourceKind: '3 Cloud Logging Golden SLI Counter Metrics (logging.googleapis.com/v2)',
          targetName: `cloudpulse_sre_http_5xx_sli + cloudpulse_sre_iam_403_deny_sli + cloudpulse_sre_chaos_drill_sli`,
          confirmLabel: `Bootstrap All 3 Golden SLI Metrics ($0.00/mo)`,
          whatHappensNext: `1. Calls POST/PUT https://logging.googleapis.com/v2/projects/${projectId}/metrics to upsert "cloudpulse_sre_http_5xx_sli" (HTTP 5xx / ERROR rate).\n2. Upserts "cloudpulse_sre_iam_403_deny_sli" (Cloud Audit PERMISSION_DENIED spikes).\n3. Upserts "cloudpulse_sre_chaos_drill_sli" (War-Room Chaos Game-Day synthetic fault markers) and signs an Ed25519 receipt.`,
          costWarning: `100% FREE ($0.00/MO): All 3 Cloud Logging log-based counter metrics are completely free ($0.00/mo) in Google Cloud.`,
          impactWarning: `Provisions all 3 Golden SLI log-based metrics in project "${projectId}" for real-time SLO burn-rate tracking.`,
        },
        DELETE_LOG_BASED_SLI_METRIC: {
          gateType: 'DELETE',
          title: `Delete Cloud Logging SLI Metric "${body.metricName || 'Log Metric'}"?`,
          resourceKind: 'Cloud Logging Log-Based Metric (logging.googleapis.com/v2)',
          targetName: `projects/${projectId}/metrics/${body.metricName}`,
          confirmLabel: `Delete Log Metric "${body.metricName}"`,
          whatHappensNext: `1. Calls DELETE https://logging.googleapis.com/v2/projects/${projectId}/metrics/${encodeURIComponent(body.metricName || '')}.\n2. Removes the custom log-based counter metric definition (underlying log entries in _Default remain untouched).\n3. Signs an Ed25519 teardown receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Deleting a log-based metric definition is free.`,
          impactWarning: `Permanently deletes log-based metric "${body.metricName}" from project "${projectId}".`,
        },
        START_OR_RESET_GCE_VM: {
          title: `${String(body.powerOp || 'START').toUpperCase()} Compute Engine VM "${body.vmName}" in Zone "${body.zone}"?`,
          resourceKind: 'Compute Engine VM Instance Power Control (compute.googleapis.com/v1)',
          targetName: `projects/${projectId}/zones/${body.zone}/instances/${body.vmName}`,
          confirmLabel: `${String(body.powerOp || 'START').toUpperCase()} VM "${body.vmName}"`,
          whatHappensNext: `1. Calls POST https://compute.googleapis.com/compute/v1/projects/${projectId}/zones/${body.zone}/instances/${body.vmName}/${String(body.powerOp || 'start').toLowerCase()}.\n2. Enqueues a live Compute Engine Zone Operation to ${String(body.powerOp || 'start').toLowerCase()} VM "${body.vmName}".\n3. Signs an Ed25519 compute recovery receipt in the SRE War-Room ledger.`,
          costWarning:
            String(body.powerOp || 'start').toLowerCase() === 'stop'
              ? `COMPUTE HALTED ($0.00/HR CPU/RAM): Stopping "${body.vmName}" halts hourly vCPU/RAM charges, though attached Persistent Disks ($0.04–$0.17/GB-mo) continue billing.`
              : `ACTIVE VM BILLING NOTICE: Starting or resetting "${body.vmName}" runs active vCPU and RAM in zone "${body.zone}" at standard Compute Engine hourly rates.`,
          impactWarning: `Changes live power state (${String(body.powerOp || 'START').toUpperCase()}) of Compute Engine VM "${body.vmName}" in "${body.zone}".`,
        },
        ENFORCE_ALL_SUBNETS_PGA: {
          title: `Enforce Private Google Access (PGA) Across All Non-Compliant VPC Subnets in "${projectId}"?`,
          resourceKind: 'VPC Subnetwork Private Google Access (compute.googleapis.com/v1)',
          targetName: `All Non-PGA VPC Subnets in ${projectId}`,
          confirmLabel: `Enable PGA Across All Subnets ($0.00/mo)`,
          whatHappensNext: `1. Lists all regional subnetworks via GET https://compute.googleapis.com/compute/v1/projects/${projectId}/aggregated/subnetworks.\n2. Calls POST https://compute.googleapis.com/compute/v1/projects/${projectId}/regions/<region>/subnetworks/<subnet>/setPrivateIpGoogleAccess with {"privateIpGoogleAccess": true} on every subnet missing PGA.\n3. Seals an Ed25519 perimeter remediation receipt.`,
          costWarning: `ZERO COST ($0.00/MO): Enabling Private Google Access across all VPC subnets is 100% free ($0.00/mo).`,
          impactWarning: `Enables Private Google Access on all VPC subnetworks in "${projectId}" with zero network interruption.`,
        },
        PUBLISH_TEST_PUBSUB_EVENT: {
          title: `Publish Live Diagnostic Event to Pub/Sub Topic "${body.topicName}"?`,
          resourceKind: 'Cloud Pub/Sub Message Publish (pubsub.googleapis.com/v1)',
          targetName: `projects/${projectId}/topics/${body.topicName}`,
          confirmLabel: `Publish Live Diagnostic Message ($0.00)`,
          whatHappensNext: `1. Base64-encodes the JSON diagnostic payload and attaches SRE trace attributes (source="cloudpulse-sre-war-room", projectId="${projectId}").\n2. Calls POST https://pubsub.googleapis.com/v1/projects/${projectId}/topics/${body.topicName}:publish.\n3. Returns the official Google Cloud Pub/Sub messageId and signs an Ed25519 receipt.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00): Cloud Pub/Sub includes 10 GiB of message throughput per month for $0.00/mo Always Free.`,
          impactWarning: `Publishes 1 live message to Pub/Sub topic "${body.topicName}" in project "${projectId}", which will be delivered to any attached subscribers.`,
        },
        ATTACH_DLQ_TO_SUBSCRIPTION: {
          title: `Wire Dead-Letter Queue (DLQ) Topic "${body.dlqTopicName || `${body.subscriptionName}-dlq`}" to Subscription "${body.subscriptionName}"?`,
          resourceKind: 'Cloud Pub/Sub DeadLetterPolicy (pubsub.googleapis.com/v1)',
          targetName: `projects/${projectId}/subscriptions/${body.subscriptionName} -> DLQ ${body.dlqTopicName || `${body.subscriptionName}-dlq`}`,
          confirmLabel: `Provision & Attach Dead-Letter Queue ($0.00/mo)`,
          whatHappensNext: `1. Ensures Dead-Letter Topic "projects/${projectId}/topics/${body.dlqTopicName || `${body.subscriptionName}-dlq`}" exists via PUT https://pubsub.googleapis.com/v1/projects/${projectId}/topics/${body.dlqTopicName || `${body.subscriptionName}-dlq`}.\n2. Calls PATCH https://pubsub.googleapis.com/v1/projects/${projectId}/subscriptions/${body.subscriptionName}?updateMask=deadLetterPolicy with maxDeliveryAttempts=${body.maxDeliveryAttempts || 5}.\n3. Signs an Ed25519 poison-pill resilience receipt.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00/MO): Pub/Sub topics and subscriptions have $0.00/mo fixed hourly cost (first 10 GiB/mo message volume is Always Free).`,
          impactWarning: `Messages on subscription "${body.subscriptionName}" that fail delivery ${body.maxDeliveryAttempts || 5} times will automatically route to "${body.dlqTopicName || `${body.subscriptionName}-dlq`}" instead of blocking the queue.`,
        },
        CAPTURE_SRE_MERKLE_SNAPSHOT: {
          title: `Capture Cryptographic SHA-256 SRE Infrastructure Merkle Snapshot on "${projectId}"?`,
          resourceKind: 'SRE Golden Baseline Merkle Tree (Read-Only Snapshot)',
          targetName: `${projectId} (Cloud Run + VMs + VPC PGA + Uptime + Alerts + Pub/Sub)`,
          confirmLabel: `Capture Golden SRE Merkle Snapshot ($0.00)`,
          whatHappensNext: `1. Reads live state across Cloud Run services, Compute VMs, VPC Subnets, Uptime Checks, Alert Policies, and Pub/Sub Subscriptions in "${projectId}".\n2. Computes a deterministic SHA-256 Merkle root hash across all 6 infrastructure vectors.\n3. Saves the baseline in the SRE War-Room Drift Detector and signs an Ed25519 receipt.`,
          costWarning: `100% READ-ONLY SNAPSHOT ($0.00): Capturing a cryptographic state baseline modifies zero resources and costs $0.00.`,
          impactWarning: `Saves a new Golden SRE Merkle Baseline for project "${projectId}" to detect future configuration drift.`,
        },
      };

      const matchedSre = sreSpecs[sreAct];
      if (matchedSre) {
        return {
          gateType: matchedSre.gateType || 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: matchedSre.title,
          headerBadge: 'Wave 8 Principal SRE War-Room & Observability Gatekeeper',
          targetLabel: 'Target SRE Observability / Reliability Resource',
          resourceKind: matchedSre.resourceKind,
          targetName: matchedSre.targetName,
          location: body.zone || body.region || 'Global / Multi-Region',
          projectId,
          method: `SRE · ${sreAct.slice(0, 22)}`,
          endpoint: rawUrl,
          confirmLabel: matchedSre.confirmLabel,
          cancelToast: `SRE War-Room action (${sreAct}) cancelled.`,
          whatHappensNext: matchedSre.whatHappensNext,
          costWarning: matchedSre.costWarning,
          impactWarning: matchedSre.impactWarning,
        };
      }
    }

    // 3G-7. Wave 8 Principal SRE War-Room Chaos Game-Day Incident Drill (/wave8/war-room/incident-drill)
    if (rawUrl.includes('/wave8/war-room/incident-drill')) {
      const scenario = String(body.scenario || 'CLOUD_RUN_COLD_START_SPIKE').toUpperCase();
      const isResolve = scenario === 'RESOLVE_INCIDENT';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: isResolve
          ? `Emit Live All-Clear Incident Resolution Marker to Cloud Logging ("${projectId}")?`
          : `Execute Live SRE Chaos Game-Day Telemetry Drill (${scenario})?`,
        headerBadge: 'Wave 8 SRE Chaos Game-Day & Incident Telemetry Gatekeeper',
        targetLabel: 'Target Cloud Logging Stream & SLI Pipeline',
        resourceKind: 'Cloud Logging Structured Event (logging.googleapis.com/v2/entries:write)',
        targetName: `projects/${projectId}/logs/cloudpulse-sre-war-room (${scenario})`,
        location: 'Global Cloud Logging',
        projectId,
        method: isResolve ? 'RESOLVE INCIDENT' : `CHAOS DRILL · ${scenario.slice(0, 16)}`,
        endpoint: rawUrl,
        confirmLabel: isResolve
          ? `Write All-Clear Resolution Entry ($0.00)`
          : `Inject Live "${scenario}" Telemetry Entry ($0.00)`,
        cancelToast: `SRE Incident Drill (${scenario}) cancelled.`,
        whatHappensNext: isResolve
          ? `1. Calls POST https://logging.googleapis.com/v2/entries:write on logName "projects/${projectId}/logs/cloudpulse-sre-war-room".\n2. Writes a structured severity="NOTICE" INCIDENT_RESOLVED event closing out the active Game-Day drill.\n3. Signs an Ed25519 resolution receipt in the War-Room Flight Recorder.`
          : `1. Calls POST https://logging.googleapis.com/v2/entries:write on logName "projects/${projectId}/logs/cloudpulse-sre-war-room".\n2. Injects a real severity="ERROR" structured JSON payload for scenario "${scenario}" with labels {sre_war_room_drill: "true", scenario: "${scenario}"} so your Cloud Logging SLI metrics and Cloud Monitoring AlertPolicies can be verified end-to-end without taking down production workloads.\n3. Signs an Ed25519 Game-Day drill receipt.`,
        costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00): Writing 1 structured JSON log entry (~1 KB) into Cloud Logging falls within the 50 GiB/month Always-Free Cloud Logging ingestion allowance ($0.00).`,
        impactWarning: isResolve
          ? `Appends a structured NOTICE resolution marker into Cloud Logging for project "${projectId}".`
          : `Writes 1 real ERROR log entry into "projects/${projectId}/logs/cloudpulse-sre-war-room" to test your log-based SLI counters and alert policies safely.`,
      };
    }

    // 3G-8. Wave 8 VPC Subnet Private Google Access Enforcer (/wave8/vpc-sc-perimeter/enable-pga)
    if (rawUrl.includes('/wave8/vpc-sc-perimeter/enable-pga')) {
      const subName = body.subnetName || 'default';
      const reg = body.region || 'us-central1';
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Enable Private Google Access (PGA) on VPC Subnet "${subName}" (${reg})?`,
        headerBadge: 'Wave 8 Zero-Trust VPC Perimeter Gatekeeper',
        targetLabel: 'Target Regional VPC Subnetwork',
        resourceKind: 'VPC Subnetwork Private Google Access (compute.googleapis.com/v1)',
        targetName: `projects/${projectId}/regions/${reg}/subnetworks/${subName}`,
        location: reg,
        projectId,
        method: 'ENABLE SUBNET PGA',
        endpoint: rawUrl,
        confirmLabel: `Enable Private Google Access on "${subName}" ($0.00/mo)`,
        cancelToast: `Private Google Access change on "${subName}" cancelled.`,
        whatHappensNext: `1. Calls POST https://compute.googleapis.com/compute/v1/projects/${projectId}/regions/${reg}/subnetworks/${subName}/setPrivateIpGoogleAccess with {"privateIpGoogleAccess": true}.\n2. Enables internal-only VMs and GKE nodes in "${subName}" (${reg}) to reach *.googleapis.com over Google's private Andromeda network without public IPv4 addresses.\n3. Records the remediation in the SRE War-Room Flight Recorder.`,
        costWarning: `ZERO COST ($0.00/MO): Google Cloud charges $0.00/mo for enabling Private Google Access on VPC subnets.`,
        impactWarning: `Enables Private Google Access on subnet "${subName}" in region "${reg}" with zero packet loss or downtime.`,
      };
    }

    // 3G-9. Wave 8 Pub/Sub Topic + Dead-Letter Queue Pair Provisioner (/wave8/pubsub-dlq/provision-pair)
    if (rawUrl.includes('/wave8/pubsub-dlq/provision-pair')) {
      const baseTopic = body.topicName || 'cloudpulse-events';
      const maxAtt = body.maxDeliveryAttempts || 5;
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Provision Pub/Sub Topic "${baseTopic}" + Auto-Wired Dead-Letter Queue (DLQ)?`,
        headerBadge: 'Wave 8 Pub/Sub Dead-Letter Queue Architect Gatekeeper',
        targetLabel: '3-Resource Pub/Sub Resilient Messaging Topology',
        resourceKind: 'Primary Topic + DLQ Topic + Subscription with deadLetterPolicy (pubsub.googleapis.com/v1)',
        targetName: `${baseTopic} + ${baseTopic}-dlq + ${baseTopic}-sub (maxAttempts=${maxAtt})`,
        location: 'Global Pub/Sub Backbone',
        projectId,
        method: 'PROVISION PUBSUB + DLQ',
        endpoint: rawUrl,
        confirmLabel: `Provision Topic, DLQ & Subscription ($0.00 Idle)`,
        cancelToast: `Pub/Sub + DLQ provisioning for "${baseTopic}" cancelled.`,
        whatHappensNext: `1. Calls PUT https://pubsub.googleapis.com/v1/projects/${projectId}/topics/${baseTopic} to create the primary event topic.\n2. Calls PUT https://pubsub.googleapis.com/v1/projects/${projectId}/topics/${baseTopic}-dlq to create the dedicated Dead-Letter Queue topic.\n3. Calls PUT https://pubsub.googleapis.com/v1/projects/${projectId}/subscriptions/${baseTopic}-sub wired with deadLetterPolicy.deadLetterTopic="projects/${projectId}/topics/${baseTopic}-dlq" and maxDeliveryAttempts=${maxAtt}.`,
        costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00 IDLE / 10 GIB FREE): Pub/Sub topics and subscriptions have $0.00/mo base cost, and the first 10 GiB of message throughput each month is Always Free.`,
        impactWarning: `Provisions 2 Pub/Sub topics and 1 DLQ-protected subscription in project "${projectId}".`,
      };
    }

    // 3G-10. Universal Resource Provisioner (/provision)
    if (rawUrl.endsWith('/provision')) {
      const cfg = body.config || body || {};
      const svcType = String(body.serviceType || body.resourceType || 'CLOUD_RESOURCE').toUpperCase();
      const resName =
        body.name ||
        cfg.name ||
        body.bucketName ||
        body.datasetId ||
        body.serviceName ||
        body.instanceName ||
        body.clusterName ||
        body.networkName ||
        body.ruleName ||
        'new-gcp-resource';
      const loc =
        body.location ||
        cfg.location ||
        body.region ||
        cfg.region ||
        body.zone ||
        cfg.zone ||
        (svcType === 'VPC_FIREWALL' || svcType === 'VPC_NETWORK' ? 'Global VPC Perimeter' : 'us-central1');

      // Detailed human-first inspection for VPC Firewall Rules (SSH :22 / RDP :3389 / HTTPS :443 / Custom)
      const fwNetwork = cfg.network || body.network || 'default';
      const fwAction = String(cfg.action || body.action || 'ALLOW').toUpperCase();
      const fwDirection = String(cfg.direction || body.direction || 'INGRESS').toUpperCase();
      const fwPriority = cfg.priority ?? body.priority ?? 1000;
      const fwRulesList = Array.isArray(cfg.rules) ? cfg.rules : [];
      const fwPortsSummary =
        fwRulesList.length > 0
          ? fwRulesList
              .map(
                (r) =>
                  `${String(r.IPProtocol || 'tcp').toUpperCase()}:${
                    Array.isArray(r.ports) && r.ports.length > 0 ? r.ports.join(',') : 'all'
                  }`
              )
              .join(', ')
          : 'TCP:22';
      const fwSourceRanges = Array.isArray(cfg.sourceRanges)
        ? cfg.sourceRanges.join(', ')
        : String(cfg.sourceRanges || body.sourceRanges || '0.0.0.0/0');
      const isSshRule = /\b22\b/.test(fwPortsSummary);
      const isHttpsRule = /\b443\b/.test(fwPortsSummary);

      const buildFirewallSpec = () => {
        if (isSshRule && fwAction === 'DENY') {
          return {
            title: `Block Public Internet SSH (:22) on VPC "${fwNetwork}" (Priority-${fwPriority})?`,
            badge: `Zero-Trust VPC SSH Shield · Priority-${fwPriority} Override`,
            kind: `VPC Firewall DENY Rule (${fwPortsSummary} · Priority ${fwPriority})`,
            target: `${resName} (${fwDirection} DENY ${fwPortsSummary} from ${fwSourceRanges} on VPC "${fwNetwork}")`,
            confirm: `Block Public SSH :22 on VPC "${fwNetwork}" ($0.00/mo)`,
            what: `1. Drops Public SSH (:22) Brute-Force at the Andromeda Edge (Priority ${fwPriority}): Creates a high-priority INGRESS DENY rule ("${resName}") on VPC "${fwNetwork}" that evaluates before Google Cloud's permissive default-allow-ssh rule (Priority 65534), dropping unsolicited ${fwSourceRanges} packets on TCP port 22 before they reach any VM.\n2. Flips World Map "SSH :22" Verdict to LOCKED & Preserves Cloud IAP Tunneling: Immediately turns the map's "SSH :22" badge from EXPOSED (Red) to LOCKED (Green) and blocks red brute-force arcs at the VPC shield ring—while still allowing you to connect safely via Identity-Aware Proxy (--tunnel-through-iap, 35.235.240.0/20).\n3. Enables Firewall Hit Logging & 1-Click Rollback: Activates VPC Firewall Rule Logging so blocked SSH attempts are recorded in Cloud Logging, and saves a reversible receipt so you can delete or toggle this rule anytime.`,
            cost: `ZERO COST ($0.00/MO): Google Cloud VPC Firewall rules and Andromeda virtual switch packet filtering are 100% free ($0.00/mo).`,
            impact: `Direct public internet SSH (TCP port 22) from ${fwSourceRanges} into VPC "${fwNetwork}" will be blocked immediately. HTTPS (:443) web traffic, internal VPC traffic, and Cloud IAP tunnels are unaffected.`,
          };
        }
        if (isSshRule && fwAction === 'ALLOW') {
          return {
            title: `Allow Public SSH (:22) Ingress on VPC "${fwNetwork}" (Priority-${fwPriority})?`,
            badge: `VPC SSH Ingress Override · Priority-${fwPriority} ALLOW`,
            kind: `VPC Firewall ALLOW Rule (${fwPortsSummary} · Priority ${fwPriority})`,
            target: `${resName} (${fwDirection} ALLOW ${fwPortsSummary} from ${fwSourceRanges} on VPC "${fwNetwork}")`,
            confirm: `Allow SSH :22 Ingress on VPC "${fwNetwork}" ($0.00/mo)`,
            what: `1. Re-Opens TCP Port 22 (SSH) on VPC "${fwNetwork}" (Priority ${fwPriority}): Creates an INGRESS ALLOW rule ("${resName}") at Priority ${fwPriority} that overrides lower-priority DENY shields and permits inbound SSH connections from ${fwSourceRanges}.\n2. Updates Live World Map SSH :22 Verdict: Immediately flips the World Map's "SSH :22" badge to EXPOSED/ALLOW so inbound TCP:22 trajectories pass through the VPC perimeter.\n3. Enables Connection Audit Logging & 1-Click Rollback: Turns on VPC Firewall Rule Logging for audit visibility and records a reversible creation receipt.`,
            cost: `ZERO COST ($0.00/MO): VPC Firewall rules incur $0.00/mo in Google Cloud.`,
            impact: `WARNING — PUBLIC SSH EXPOSURE: Opening TCP:22 to ${fwSourceRanges} exposes Compute Engine VMs with public IPs in VPC "${fwNetwork}" to internet SSH connections. Prefer Cloud IAP (35.235.240.0/20) for production workloads.`,
          };
        }
        if (isHttpsRule && fwAction === 'DENY') {
          return {
            title: `Block Public HTTPS (:443) Ingress on VPC "${fwNetwork}" (Priority-${fwPriority})?`,
            badge: `Zero-Trust VPC Edge Lockdown · Priority-${fwPriority} HTTPS Shield`,
            kind: `VPC Firewall DENY Rule (${fwPortsSummary} · Priority ${fwPriority})`,
            target: `${resName} (${fwDirection} DENY ${fwPortsSummary} from ${fwSourceRanges} on VPC "${fwNetwork}")`,
            confirm: `Block Public HTTPS :443 on VPC "${fwNetwork}" ($0.00/mo)`,
            what: `1. Blocks Inbound HTTPS (TCP:443) at the VPC Perimeter (Priority ${fwPriority}): Creates a high-priority INGRESS DENY rule ("${resName}") on VPC "${fwNetwork}" that overrides lower-priority allow rules and drops inbound TCP:443 packets from ${fwSourceRanges} at Google's Andromeda virtual switch.\n2. Flips Live World Map "HTTPS :443" Verdict to DENY: Immediately updates the World Map's "HTTPS :443" badge to DENY and intercepts port :443 packet arcs at the VPC perimeter ring.\n3. Enables Firewall Hit Logging & 1-Click Rollback: Turns on VPC Firewall Rule Logging in Cloud Logging and saves a reversible receipt so you can re-open HTTPS :443 anytime in 1 click.`,
            cost: `ZERO COST ($0.00/MO): VPC Firewall rules and edge packet drops incur $0.00/mo in Google Cloud.`,
            impact: `Inbound HTTPS (port 443) traffic from ${fwSourceRanges} to Compute Engine VMs in VPC "${fwNetwork}" will be blocked until you click Allow HTTPS :443 or delete this rule.`,
          };
        }
        if (isHttpsRule && fwAction === 'ALLOW') {
          return {
            title: `Allow Public HTTPS (:443) Ingress on VPC "${fwNetwork}" (Priority-${fwPriority})?`,
            badge: `VPC HTTPS Edge Ingress Gatekeeper · Priority-${fwPriority} ALLOW`,
            kind: `VPC Firewall ALLOW Rule (${fwPortsSummary} · Priority ${fwPriority})`,
            target: `${resName} (${fwDirection} ALLOW ${fwPortsSummary} from ${fwSourceRanges} on VPC "${fwNetwork}")`,
            confirm: `Allow Public HTTPS :443 on VPC "${fwNetwork}" ($0.00/mo)`,
            what: `1. Opens Encrypted HTTPS (TCP:443) Ingress on VPC "${fwNetwork}" (Priority ${fwPriority}): Creates an INGRESS ALLOW rule ("${resName}") at Priority ${fwPriority} permitting inbound TLS/HTTPS traffic on TCP port 443 from ${fwSourceRanges} (including Google Front End / Cloud Load Balancers) to reach web & API workloads in VPC "${fwNetwork}".\n2. Flips Live World Map "HTTPS :443" Verdict to ALLOW: Immediately switches the World Map's "HTTPS :443" security indicator to ALLOW (Green) so port :443 trajectories pass cleanly into your regions.\n3. Enables Connection Audit Logging & 1-Click Rollback: Enables VPC Firewall Rule Logging in Cloud Logging and records a reversible creation receipt in the Flight Recorder.`,
            cost: `ZERO COST ($0.00/MO): Creating VPC Firewall rules incurs $0.00/mo in Google Cloud.`,
            impact: `Permits inbound TCP port 443 (HTTPS) traffic from ${fwSourceRanges} into VPC "${fwNetwork}" while keeping SSH (:22) and internal ports protected by their own rules.`,
          };
        }
        return {
          title: `${fwAction === 'DENY' ? 'Block' : 'Allow'} ${fwPortsSummary} (${fwDirection}) on VPC "${fwNetwork}" (Priority-${fwPriority})?`,
          badge: `VPC Firewall Rule Gatekeeper · Priority-${fwPriority} ${fwAction}`,
          kind: `VPC Firewall ${fwAction} Rule (${fwPortsSummary} · Priority ${fwPriority})`,
          target: `${resName} (${fwDirection} ${fwAction} ${fwPortsSummary} from ${fwSourceRanges} on VPC "${fwNetwork}")`,
          confirm: `Create ${fwAction} Firewall Rule "${resName}" ($0.00/mo)`,
          what: `1. Enforces ${fwDirection} ${fwAction} on ${fwPortsSummary} (Priority ${fwPriority}): Creates firewall rule "${resName}" on VPC network "${fwNetwork}" matching source range ${fwSourceRanges} at Priority ${fwPriority}.\n2. Updates Live VPC Packet Evaluation on the World Map: Immediately recalculates live packet verdicts against "${resName}" across all VMs and subnets attached to VPC "${fwNetwork}".\n3. Enables Audit Logging & 1-Click Rollback: Records the rule in Google Compute Engine Firewalls and saves a reversible receipt in the CloudPulse Flight Recorder.`,
          cost: `ZERO COST ($0.00/MO): VPC Firewall rules incur $0.00/mo in Google Cloud.`,
          impact: `Immediately applies ${fwDirection} ${fwAction} filtering for ${fwPortsSummary} (source ${fwSourceRanges}) across VPC "${fwNetwork}" in project "${projectId}".`,
        };
      };

      const provSpecs = {
        GCS_BUCKET: {
          title: `Provision Cloud Storage Bucket "gs://${resName}" in ${loc}?`,
          kind: `Cloud Storage Bucket (${cfg.storageClass || 'STANDARD'} · storage.googleapis.com/storage/v1)`,
          what: `1. Creates Zero-Trust Cloud Storage Bucket "gs://${resName}" in ${loc}: Provisions the bucket with storageClass="${cfg.storageClass || 'STANDARD'}" in region "${loc}".\n2. Enforces Public Access Prevention & Uniform IAM: Automatically sets publicAccessPrevention="enforced" and uniformBucketLevelAccess=true so objects can never be accidentally exposed to anonymous internet users.\n3. Enables 1-Click Rollback & Lifecycle Tracking: Registers the bucket in your Cloud Storage Workbench and records a reversible receipt in the Flight Recorder.`,
          cost: `ALWAYS-FREE TIER ELIGIBLE ($0.00 EMPTY): Empty buckets cost $0.00/mo. Standard storage in US-CENTRAL1/US-EAST1/US-WEST1 includes 5 GB-months Always Free ($0.020/GB-mo beyond Free Tier).`,
          impact: `Creates live Cloud Storage bucket "gs://${resName}" in "${loc}" on project "${projectId}".`,
        },
        BIGQUERY_DATASET: {
          title: `Provision BigQuery Dataset "${projectId}:${resName}" in ${loc}?`,
          kind: `BigQuery Dataset (bigquery.googleapis.com/bigquery/v2)`,
          what: `1. Creates BigQuery Analytics Dataset "${projectId}:${resName}" in ${loc}: Provisions the dataset container in "${loc}" ready for SQL tables, views, and Iceberg external tables.\n2. Configures Governance & Storage Billing Metadata: Applies default table expiration and storage billing model settings.\n3. Registers in BigQuery Studio & Flight Recorder: Makes the dataset immediately queryable in BigQuery Studio with a 1-click reversible creation receipt.`,
          cost: `ZERO IDLE COST ($0.00/MO): Creating a BigQuery dataset container is 100% free ($0.00/mo). Google Cloud includes 10 GiB of active table storage and 1 TiB of SQL queries per month Always Free.`,
          impact: `Creates live BigQuery dataset "${projectId}:${resName}" in "${loc}".`,
        },
        CLOUD_RUN: {
          title: `Deploy Cloud Run Gen2 Service "${resName}" in ${loc}?`,
          kind: `Cloud Run v2 Service (run.googleapis.com/v2)`,
          what: `1. Deploys Serverless Container "${resName}" in ${loc}: Provisions a Cloud Run Gen2 service running image "${cfg.image || 'us-docker.pkg.dev/cloudrun/container/hello'}" with minInstanceCount=${cfg.minInstances ?? 0} and maxInstanceCount=${cfg.maxInstances ?? 10}.\n2. Provisions Dedicated *.run.app HTTPS Endpoint & TLS Certificate: Automatically configures Google Front End global load balancing and managed TLS 1.3 certificates.\n3. Applies Zero-Trust IAM Invoker Policy: Sets access control to ${cfg.allowUnauthenticated ? 'Public Internet (allUsers)' : 'Private IAM Authenticated Only'} and logs a reversible receipt.`,
          cost:
            Number(cfg.minInstances || 0) > 0
              ? `WARM INSTANCE BILLING WARNING: Because minInstances=${cfg.minInstances} (> 0), this Cloud Run service will keep ${cfg.minInstances} container instance(s) warm 24/7 and bill continuously for vCPU and Memory.`
              : `SCALE-TO-ZERO ($0.00/HR IDLE): Configured with minInstanceCount=0 and request-only CPU billing (2 million requests/mo, 180,000 vCPU-sec/mo, and 360,000 GiB-sec/mo Always Free).`,
          impact: `Deploys live Cloud Run v2 service "${resName}" in "${loc}" on project "${projectId}".`,
        },
        COMPUTE_VM: {
          title: `Provision Compute Engine VM "${resName}" (${cfg.machineType || 'e2-micro'}) in ${loc}?`,
          kind: `Compute Engine VM Instance (${cfg.machineType || 'e2-micro'} · compute.googleapis.com/v1)`,
          what: `1. Boots Compute Engine VM "${resName}" in Zone ${loc}: Provisions a ${cfg.machineType || 'e2-micro'} virtual machine with a ${cfg.diskSizeGb || 10} GB ${cfg.diskType || 'pd-standard'} boot disk attached to VPC "${cfg.network || 'default'}".\n2. Hardens Instance Identity & Shielded VM Controls: Configures Shielded VM integrity monitoring and prepares the instance for Browser SSH / Cloud IAP tunneling.\n3. Polls Live Zone Operation to RUNNING State: Tracks the Compute Engine zone operation until the VM boots and registers it in the VM Fleet Studio.`,
          cost: `CONTINUOUS VM & DISK BILLING NOTICE: Running a Compute Engine VM bills hourly for vCPU/RAM plus monthly for its Persistent Boot Disk. (Note: 1 e2-micro instance in us-central1, us-west1, or us-east1 with up to 30 GB pd-standard disk is eligible for the Google Cloud Always-Free Tier.)`,
          impact: `Provisions and starts live Compute Engine VM "${resName}" in zone "${loc}".`,
        },
        GKE_CLUSTER: {
          title: `Provision Google Kubernetes Engine (GKE) Cluster "${resName}" in ${loc}?`,
          kind: `GKE Kubernetes Cluster (${cfg.autopilot !== false ? 'Autopilot' : 'Standard'} · container.googleapis.com/v1)`,
          what: `1. Bootstraps Managed Kubernetes Control Plane "${resName}" in ${loc}: Provisions a GKE ${cfg.autopilot !== false ? 'Autopilot' : 'Standard'} cluster in "${loc}" with Workload Identity and private control-plane networking.\n2. Configures Auto-Scaling Node / Pod Compute Pool: Registers managed compute capacity and Kubernetes API server endpoints.\n3. Links to GKE Fleet Studio: Streams live cluster status and records a reversible creation receipt.`,
          cost: `GKE CLUSTER & NODE BILLING WARNING: GKE charges $0.10/hr (~$73.00/mo) per cluster management fee (after the 1 free zonal/Autopilot cluster tier per billing account) plus active worker node/pod vCPU, Memory, and Persistent Disk charges.`,
          impact: `Provisions live GKE Kubernetes cluster "${resName}" in "${loc}" on project "${projectId}".`,
        },
        CLOUD_SQL: {
          title: `Provision Cloud SQL Database Instance "${resName}" (${cfg.databaseVersion || 'POSTGRES_15'}) in ${loc}?`,
          kind: `Cloud SQL Instance (${cfg.databaseVersion || 'POSTGRES_15'} · sqladmin.googleapis.com/sql/v1beta4)`,
          what: `1. Provisions Managed Relational Database "${resName}" (${cfg.databaseVersion || 'POSTGRES_15'}): Creates a Cloud SQL instance on machine tier "${cfg.tier || 'db-f1-micro'}" in "${loc}".\n2. Configures Encrypted Storage & Automated Backups: Sets up AES-256 encrypted database storage and point-in-time recovery metadata.\n3. Registers in Cloud SQL Studio: Tracks the database build operation and logs a reversible receipt.`,
          cost: `CONTINUOUS DATABASE BILLING WARNING: Cloud SQL instances do NOT scale to $0 when idle — they bill continuously per hour for instance vCPU/RAM tier (${cfg.tier || 'db-f1-micro'}) plus SSD/HDD storage ($0.09–$0.17/GB-mo) until stopped or deleted.`,
          impact: `Provisions live Cloud SQL instance "${resName}" in "${loc}" on project "${projectId}".`,
        },
        VPC_NETWORK: {
          title: `Provision Custom VPC Network "${resName}" on "${projectId}"?`,
          kind: `VPC Network (compute.googleapis.com/v1)`,
          what: `1. Creates Isolated Global VPC Network "${resName}": Provisions a software-defined Andromeda virtual network with autoCreateSubnetworks=${Boolean(cfg.autoCreateSubnetworks)}.\n2. Initializes Global Routing Table: Sets up private internal routing across Google's global fiber backbone without exposing workloads to the public internet.\n3. Registers in VPC & Firewall Studio: Makes "${resName}" immediately available for subnets, firewall rules, and VM placement.`,
          cost: `ZERO IDLE COST ($0.00/MO): Creating a VPC network and subnets incurs $0.00/mo in fixed charges (standard egress rates apply only to actual traffic).`,
          impact: `Creates live VPC network "${resName}" in project "${projectId}".`,
        },
        VPC_FIREWALL: buildFirewallSpec(),
      };
      const spec = provSpecs[svcType] || {
        title: `Provision ${svcType} "${resName}" in ${loc}?`,
        kind: `${svcType} (Google Cloud Control Plane API)`,
        what: `1. Validates project quotas and API readiness on "${projectId}".\n2. Provisions live ${svcType} resource "${resName}" in "${loc}" via official Google Cloud REST APIs.\n3. Logs a reversible creation receipt in the Cloud Flight Recorder.`,
        cost: `CLOUD BILLING NOTICE: Provisioning "${resName}" (${svcType}) in "${loc}" creates a live resource on project "${projectId}" billed according to its service tier.`,
        impact: `Creates live ${svcType} resource "${resName}" in project "${projectId}" (${loc}).`,
      };
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: spec.title,
        headerBadge:
          spec.badge || 'CloudPulse 2026 Live Resource Provisioning Gatekeeper',
        targetLabel:
          svcType === 'VPC_FIREWALL'
            ? 'Target VPC Firewall Rule & Traffic Policy'
            : 'New Google Cloud Resource to Provision',
        resourceKind: spec.kind,
        targetName: spec.target || `${resName} (${loc})`,
        location: loc,
        projectId,
        method:
          svcType === 'VPC_FIREWALL'
            ? `FIREWALL ${fwAction} (P-${fwPriority})`
            : `PROVISION ${svcType}`,
        endpoint: rawUrl,
        confirmLabel: spec.confirm || `Confirm & Provision "${resName}"`,
        cancelToast: `Provisioning of "${resName}" cancelled — 0 changes made.`,
        whatHappensNext: spec.what,
        costWarning: spec.cost,
        impactWarning:
          spec.impact ||
          `Creates live ${svcType} resource "${resName}" in project "${projectId}" (${loc}).`,
      };
    }

    // 3G-11. Cloud Run Service Configuration Patch, Traffic Split, Secret Sealing & Compose
    if (rawUrl.includes('/quotas/realign-preference')) {
      const qMetric = body.metric || 'N2D_CPUS';
      const qId = body.quotaId || 'N2D-CPUS-per-project-region';
      const qReg = body.region || 'us-central1';
      const curLim = body.currentLimit ?? 128;
      const tgtLim = body.targetLimit ?? 3000;
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Submit Official Cloud Quotas Request for ${qMetric} (${curLim} ➔ ${tgtLim}) in ${qReg}?`,
        headerBadge: 'Cloud Quotas v1 Official QuotaPreference Gatekeeper',
        targetLabel: 'Target Quota Metric, Region & Requested Ceiling',
        resourceKind: `Cloud Quotas v1 QuotaPreference (${qId})`,
        targetName: `${qMetric} (${qReg}: ${curLim} ➔ ${tgtLim})`,
        location: qReg,
        projectId,
        method: 'SUBMIT QUOTA PREFERENCE',
        endpoint: rawUrl,
        confirmLabel: `Submit Official QuotaPreference (${curLim} ➔ ${tgtLim} in ${qReg}) ($0.00)`,
        cancelToast: `Quota request for ${qMetric} in ${qReg} cancelled.`,
        whatHappensNext: `1. Why "${qReg}" is pinned at ${curLim}: An earlier quota approval wrote a Google-owned producerOverride of ${curLim} on ${qMetric}. Even though your project's native Tier-1 defaultLimit later upgraded to ${tgtLim}, producerOverrides cannot be force-deleted by client code and take precedence over defaultLimit.\n2. How this works under the hood (Official Approval Flow — No Bypass): Submits a declarative GA QuotaPreference (${qId} = ${tgtLim}) with your account email and technical justification to POST https://cloudquotas.googleapis.com/v1/projects/${projectId}/locations/global/quotaPreferences.\n3. Google Cloud Automated Bot vs Review: Google Cloud's automated quota evaluator checks the request against your project's defaultLimit (${tgtLim}) and billing history—either auto-approving it within a few minutes or placing it in reconciling: true (official Google Cloud quota review) and emailing your account confirmation.`,
        costWarning: `ZERO COST ($0.00): Submitting a QuotaPreference in Google Cloud Quotas is 100% free ($0.00/mo). You are only billed for VM or GPU instances that you actually launch.`,
        impactWarning: `Submits an official Cloud Quotas v1 QuotaPreference for ${qMetric} (${qId}: ${curLim} ➔ ${tgtLim}) in "${qReg}" on project "${projectId}".`,
      };
    }

    if (rawUrl.includes('/cloudrun/')) {
      const sealMatch = rawUrl.match(/\/cloudrun\/([^/]+)\/([^/]+)\/seal-secrets/);
      if (sealMatch) {
        const reg = decodeURIComponent(sealMatch[1]);
        const svc = decodeURIComponent(sealMatch[2]);
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Seal Plaintext Env Vars into Secret Manager on Cloud Run "${svc}"?`,
          headerBadge: 'Cloud Run Plaintext-to-Secret Manager Surgeon Gatekeeper',
          targetLabel: 'Target Cloud Run Service & Secret Manager Vault',
          resourceKind: 'Cloud Run v2 Revision + Secret Manager (run.googleapis.com/v2 + secretmanager.googleapis.com/v1)',
          targetName: `${svc} (${reg})`,
          location: reg,
          projectId,
          method: 'SEAL ENV SECRETS',
          endpoint: rawUrl,
          confirmLabel: `Encrypt Env Vars into Secret Manager & Roll Revision`,
          cancelToast: `Secret sealing on "${svc}" cancelled.`,
          whatHappensNext: `1. Creates encrypted secrets in Secret Manager (secretmanager.googleapis.com/v1) for the selected plaintext environment variables on "${svc}".\n2. Grants roles/secretmanager.secretAccessor to "${svc}"'s runtime Service Account.\n3. Calls PATCH https://run.googleapis.com/v2/projects/${projectId}/locations/${reg}/services/${svc} replacing plaintext values with secretKeyRef pointers and rolls a new revision.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00 WITHIN FREE TIER): Google Cloud Secret Manager includes 6 active secret versions and 10,000 access operations per month for $0.00/mo ($0.06/version-mo beyond Free Tier).`,
          impactWarning: `Replaces plaintext environment variables on "${svc}" (${reg}) with hardware-encrypted Secret Manager references.`,
        };
      }
      const trafficMatch = rawUrl.match(/\/cloudrun\/([^/]+)\/([^/]+)\/traffic/);
      if (trafficMatch) {
        const reg = decodeURIComponent(trafficMatch[1]);
        const svc = decodeURIComponent(trafficMatch[2]);
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Update Live HTTPS Revision Traffic Split on Cloud Run "${svc}"?`,
          headerBadge: 'Cloud Run Zero-Rebuild Traffic Router Gatekeeper',
          targetLabel: 'Target Cloud Run Service & Traffic Allocation',
          resourceKind: 'Cloud Run v2 Traffic Split (run.googleapis.com/v2)',
          targetName: `${svc} (${reg})`,
          location: reg,
          projectId,
          method: 'UPDATE TRAFFIC SPLIT',
          endpoint: rawUrl,
          confirmLabel: `Apply Live Traffic Split on "${svc}" ($0.00)`,
          cancelToast: `Traffic split update on "${svc}" cancelled.`,
          whatHappensNext: `1. Calls PATCH https://run.googleapis.com/v2/projects/${projectId}/locations/${reg}/services/${svc}?updateMask=traffic.\n2. Re-weights live HTTPS load balancer traffic across the selected revisions without rebuilding any container image.`,
          costWarning: `ZERO COST ($0.00): Adjusting traffic percentages across existing Cloud Run revisions is a free control-plane operation.`,
          impactWarning: `Immediately shifts production HTTPS request routing across revisions of "${svc}" (${reg}).`,
        };
      }
      if (rawUrl.includes('/cloudrun/compose')) {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Deploy Multi-Container Docker Compose Stack to Cloud Run (${body.region || 'us-central1'})?`,
          headerBadge: 'Cloud Run Docker Compose Synthesizer Gatekeeper',
          targetLabel: 'Docker Compose Services to Materialize on Cloud Run',
          resourceKind: 'Multi-Service Cloud Run v2 Deployment (run.googleapis.com/v2)',
          targetName: `${projectId} (${body.region || 'us-central1'})`,
          location: body.region || 'us-central1',
          projectId,
          method: 'DEPLOY COMPOSE STACK',
          endpoint: rawUrl,
          confirmLabel: `Deploy Compose Services to Cloud Run`,
          cancelToast: `Docker Compose deployment cancelled.`,
          whatHappensNext: `1. Parses the Docker Compose YAML service dependency graph.\n2. Deploys each service to Cloud Run v2 (run.googleapis.com/v2) in "${body.region || 'us-central1'}" with scale-to-zero (minInstanceCount=0).\n3. Automatically injects discovered .run.app upstream URLs as environment variables into dependent services.`,
          costWarning: `SCALE-TO-ZERO DEFAULT ($0.00/HR IDLE): Each composed Cloud Run service defaults to minInstanceCount=0 so idle containers incur $0.00/hr.`,
          impactWarning: `Provisions live Cloud Run v2 services in "${body.region || 'us-central1'}" on project "${projectId}".`,
        };
      }
      const patchRunMatch = rawUrl.match(/\/cloudrun\/([^/]+)\/([^/]+)$/);
      if (patchRunMatch && method === 'patch') {
        const reg = decodeURIComponent(patchRunMatch[1]);
        const svc = decodeURIComponent(patchRunMatch[2]);
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Update Live Configuration & Roll Revision on Cloud Run "${svc}" (${reg})?`,
          headerBadge: 'Cloud Run v2 Revision & Scaling Gatekeeper',
          targetLabel: 'Target Cloud Run Service',
          resourceKind: 'Cloud Run v2 Service Template Patch (run.googleapis.com/v2)',
          targetName: `${svc} (${reg})`,
          location: reg,
          projectId,
          method: 'PATCH CLOUD RUN',
          endpoint: rawUrl,
          confirmLabel: `Apply Changes & Roll Revision on "${svc}"`,
          cancelToast: `Configuration update on "${svc}" cancelled.`,
          whatHappensNext: `1. Fetches current service spec via GET https://run.googleapis.com/v2/projects/${projectId}/locations/${reg}/services/${svc}.\n2. Applies your requested scaling (minInstances/maxInstances), CPU/Memory, Startup CPU Boost, or Environment Variable updates.\n3. Calls PATCH https://run.googleapis.com/v2/projects/${projectId}/locations/${reg}/services/${svc} and rolls a new live revision.`,
          costWarning:
            Number(body.minInstances || 0) > 0
              ? `WARM INSTANCE BILLING WARNING: Setting minInstances=${body.minInstances} keeps ${body.minInstances} instance(s) running 24/7 and incurs continuous hourly vCPU and Memory billing.`
              : `FINOPS NOTICE: Setting minInstances=0 with cpuIdle=true ensures "${svc}" scales to $0.00/hr when idle.`,
          impactWarning: `Deploys a new revision on live Cloud Run service "${svc}" in "${reg}".`,
        };
      }
    }

    // 3G-12. Cloud Storage Bucket Governance Patch, Object Upload, Rewrite, Teleport & DLP Redact
    if (rawUrl.includes('/storage/buckets/')) {
      const bktMatch = rawUrl.match(/\/storage\/buckets\/([^/?]+)/);
      const bktName = bktMatch ? decodeURIComponent(bktMatch[1]) : 'gcs-bucket';
      if (rawUrl.includes('/dlp-redact')) {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Redact Sensitive PII/Secrets In-Place in Object "${body.objectName || 'object'}" (gs://${bktName})?`,
          headerBadge: 'Cloud Storage In-RAM DLP Redaction Gatekeeper',
          targetLabel: 'Target Cloud Storage Object to Sanitize',
          resourceKind: 'Cloud Storage Object Overwrite (storage.googleapis.com/upload/storage/v1)',
          targetName: `gs://${bktName}/${body.objectName || ''}`,
          location: 'Cloud Storage',
          projectId,
          method: 'DLP REDACT OBJECT',
          endpoint: rawUrl,
          confirmLabel: `Overwrite Object with Redacted Payload`,
          cancelToast: `DLP redaction on gs://${bktName}/${body.objectName || ''} cancelled.`,
          whatHappensNext: `1. Masks detected PII, API keys, and credential patterns in memory with "[REDACTED_BY_CLOUDPULSE_DLP]".\n2. Uploads the sanitized byte stream to POST https://storage.googleapis.com/upload/storage/v1/b/${bktName}/o?uploadType=media&name=${encodeURIComponent(body.objectName || '')}.`,
          costWarning: `MINIMAL COST ($0.00): 1 Class A object write operation ($0.005 per 1,000 operations; first 5,000 Class A ops/mo are Always Free).`,
          impactWarning: `Replaces live object "gs://${bktName}/${body.objectName || ''}" with the redacted content (previous generation is retained if Object Versioning is enabled).`,
        };
      }
      if (rawUrl.includes('/objects/rewrite')) {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Server-Side Rewrite Object "${body.objectName}" to Storage Class "${body.storageClass || 'NEARLINE'}"?`,
          headerBadge: 'Cloud Storage Zero-Egress Storage Class Rewrite Gatekeeper',
          targetLabel: 'Target Cloud Storage Object',
          resourceKind: `Cloud Storage Rewrite (storage.googleapis.com/storage/v1 · -> ${body.storageClass || 'NEARLINE'})`,
          targetName: `gs://${bktName}/${body.objectName}`,
          location: 'Cloud Storage',
          projectId,
          method: `REWRITE -> ${body.storageClass || 'NEARLINE'}`,
          endpoint: rawUrl,
          confirmLabel: `Rewrite Object to ${body.storageClass || 'NEARLINE'}`,
          cancelToast: `Object storage class rewrite cancelled.`,
          whatHappensNext: `1. Calls POST https://storage.googleapis.com/storage/v1/b/${bktName}/o/${encodeURIComponent(body.objectName || '')}/rewriteTo/b/${bktName}/o/${encodeURIComponent(body.objectName || '')} with storageClass="${body.storageClass || 'NEARLINE'}".\n2. Transitions the object's storage tier server-side inside Google's network with zero download/upload bandwidth.`,
          costWarning: `STORAGE TIER NOTICE: Nearline (30d min), Coldline (90d min), and Archive (365d min) reduce monthly per-GB storage rates up to 94% ($0.0012/GB-mo Archive), but incur early-deletion or per-GB data retrieval fees if read frequently.`,
          impactWarning: `Updates the live storage class of "gs://${bktName}/${body.objectName}".`,
        };
      }
      if (rawUrl.includes('/teleport')) {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Teleport Bucket "gs://${bktName}" to Target Region "${body.targetLocation || 'US'}"?`,
          headerBadge: 'Cloud Storage Cross-Region Bucket Teleporter Gatekeeper',
          targetLabel: 'Source Bucket -> Destination Regional Bucket',
          resourceKind: 'Cloud Storage Server-Side Object Rewrite (storage.googleapis.com/storage/v1)',
          targetName: `gs://${bktName} -> gs://${body.targetBucketName || `${bktName}-${String(body.targetLocation || 'us').toLowerCase()}`}`,
          location: body.targetLocation || 'US',
          projectId,
          method: 'TELEPORT BUCKET',
          endpoint: rawUrl,
          confirmLabel: `Teleport Bucket to ${body.targetLocation || 'US'}`,
          cancelToast: `Bucket teleportation cancelled.`,
          whatHappensNext: `1. Creates destination bucket "gs://${body.targetBucketName || `${bktName}-${String(body.targetLocation || 'us').toLowerCase()}`}" in "${body.targetLocation || 'US'}" via storage.googleapis.com/storage/v1.\n2. Server-side rewrites objects from "gs://${bktName}" directly across Google's internal backbone.`,
          costWarning: `CROSS-REGION REWRITE NOTICE: Copying objects between different GCP regions incurs standard Google Cloud inter-region network replication fees ($0.02–$0.12/GB) plus destination bucket storage.`,
          impactWarning: `Creates destination bucket and copies objects into "${body.targetLocation || 'US'}" on project "${projectId}".`,
        };
      }
      if (rawUrl.endsWith('/objects') && method === 'post') {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Upload Object "${body.objectName || body.name || 'new-object'}" to Bucket "gs://${bktName}"?`,
          headerBadge: 'Cloud Storage Live Object Upload Gatekeeper',
          targetLabel: 'Target Cloud Storage Bucket & Object Key',
          resourceKind: 'Cloud Storage Object Upload (storage.googleapis.com/upload/storage/v1)',
          targetName: `gs://${bktName}/${body.objectName || body.name || 'object'}`,
          location: 'Cloud Storage',
          projectId,
          method: 'UPLOAD GCS OBJECT',
          endpoint: rawUrl,
          confirmLabel: `Upload Object to gs://${bktName}`,
          cancelToast: `Object upload to gs://${bktName} cancelled.`,
          whatHappensNext: `1. Streams payload to POST https://storage.googleapis.com/upload/storage/v1/b/${bktName}/o?uploadType=media&name=${encodeURIComponent(body.objectName || body.name || 'object')}.\n2. Verifies CRC32C/MD5 object checksum in bucket "gs://${bktName}".`,
          costWarning: `STORAGE & CLASS A OPS NOTICE: Counts as 1 Class A write operation (first 5,000 Class A ops/mo and 5 GB Standard storage in US regions are Always Free).`,
          impactWarning: `Writes live object "${body.objectName || body.name || 'object'}" into bucket "gs://${bktName}" on project "${projectId}".`,
        };
      }
      if (method === 'patch') {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Update Governance & Lifecycle Policy on Bucket "gs://${bktName}"?`,
          headerBadge: 'Cloud Storage Bucket Policy & FinOps Gatekeeper',
          targetLabel: 'Target Cloud Storage Bucket',
          resourceKind: 'Cloud Storage Bucket Metadata Patch (storage.googleapis.com/storage/v1)',
          targetName: `gs://${bktName}`,
          location: 'Cloud Storage',
          projectId,
          method: 'PATCH GCS BUCKET',
          endpoint: rawUrl,
          confirmLabel: `Apply Policy Update to gs://${bktName} ($0.00)`,
          cancelToast: `Bucket policy update on gs://${bktName} cancelled.`,
          whatHappensNext: `1. Calls PATCH https://storage.googleapis.com/storage/v1/b/${bktName}.\n2. Updates the requested bucket properties (Uniform Bucket-Level Access, Public Access Prevention, Autoclass, Object Versioning, Soft-Delete retention window, or Lifecycle rules).`,
          costWarning: `ZERO API COST ($0.00): Updating bucket governance metadata is free ($0.00). Enabling Object Versioning retains historical object generations which bill at standard per-GB storage rates until pruned by a lifecycle rule.`,
          impactWarning: `Modifies live bucket configuration on "gs://${bktName}" in project "${projectId}".`,
        };
      }
    }

    // 3G-13. BigQuery Dataset Billing Model Patch, Table Creation & Live SQL Execution
    if (rawUrl.includes('/bigquery/')) {
      if (rawUrl.includes('/bigquery/query')) {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Execute Live Standard SQL Query Job on BigQuery ("${projectId}")?`,
          headerBadge: 'BigQuery On-Demand SQL Execution & Cost Gatekeeper',
          targetLabel: 'Target BigQuery SQL Execution Engine',
          resourceKind: 'BigQuery Query Job (bigquery.googleapis.com/bigquery/v2/projects/jobs)',
          targetName: `${projectId} (${body.location || 'US'})`,
          location: body.location || 'US',
          projectId,
          method: 'EXECUTE BIGQUERY SQL',
          endpoint: rawUrl,
          confirmLabel: `Execute Live BigQuery SQL Job`,
          cancelToast: `BigQuery SQL execution cancelled.`,
          whatHappensNext: `1. Submits your Standard SQL query to POST https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/jobs with useLegacySql=false.\n2. Streams the resulting rows, execution timeline, and slot-ms telemetry back to the BigQuery Studio.`,
          costWarning: `BIGQUERY SCAN BILLING NOTICE: On-demand SQL queries bill based on bytes scanned ($6.25 per TiB scanned), with the first 1 TiB of query data processed each month 100% FREE ($0.00 Always-Free Tier). DDL/DML statements (CREATE/INSERT/UPDATE/DELETE) will mutate target tables.`,
          impactWarning: `Runs a live BigQuery job in project "${projectId}" (${body.location || 'US'}).`,
        };
      }
      const bqTableMatch = rawUrl.match(/\/bigquery\/datasets\/([^/]+)\/tables/);
      if (bqTableMatch) {
        const dsId = decodeURIComponent(bqTableMatch[1]);
        const tblId = body.tableId || 'new_table';
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Create BigQuery Table "${dsId}.${tblId}" in Project "${projectId}"?`,
          headerBadge: 'BigQuery Schema & Partitioning Gatekeeper',
          targetLabel: 'Target BigQuery Dataset & Table',
          resourceKind: 'BigQuery Table (bigquery.googleapis.com/bigquery/v2)',
          targetName: `${projectId}:${dsId}.${tblId}`,
          location: body.location || 'US',
          projectId,
          method: 'CREATE BQ TABLE',
          endpoint: rawUrl,
          confirmLabel: `Create Table "${dsId}.${tblId}" ($0.00 Empty)`,
          cancelToast: `BigQuery table creation cancelled.`,
          whatHappensNext: `1. Calls POST https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${dsId}/tables.\n2. Registers table "${tblId}" with the defined typed column schema${body.timePartitioning ? ' and time partitioning' : ''}.`,
          costWarning: `ZERO IDLE COST ($0.00/MO): Empty BigQuery tables cost $0.00/mo, and the first 10 GiB of active table storage per month is Always Free.`,
          impactWarning: `Creates live table "${dsId}.${tblId}" in project "${projectId}".`,
        };
      }
      const bqDsMatch = rawUrl.match(/\/bigquery\/datasets\/([^/]+)$/);
      if (bqDsMatch && method === 'patch') {
        const dsId = decodeURIComponent(bqDsMatch[1]);
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Update Dataset Configuration / Storage Billing Model on "${dsId}"?`,
          headerBadge: 'BigQuery Dataset & Physical Billing Gatekeeper',
          targetLabel: 'Target BigQuery Dataset',
          resourceKind: 'BigQuery Dataset Patch (bigquery.googleapis.com/bigquery/v2)',
          targetName: `${projectId}:${dsId} (${body.storageBillingModel || 'Metadata Patch'})`,
          location: 'Multi-Region / Regional',
          projectId,
          method: 'PATCH BQ DATASET',
          endpoint: rawUrl,
          confirmLabel: `Update Dataset "${dsId}"`,
          cancelToast: `BigQuery dataset update on "${dsId}" cancelled.`,
          whatHappensNext: `1. Fetches current dataset etag via GET https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${dsId}.\n2. Calls PATCH https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${dsId} to update storageBillingModel (${body.storageBillingModel || 'PHYSICAL'}), defaultTableExpirationMs, or labels.`,
          costWarning: `STORAGE BILLING MODEL NOTICE: Switching a dataset to PHYSICAL (compressed) storage billing typically cuts storage bills by 50%–75% thanks to Capacitor columnar compression, though Google Cloud enforces a 14-day cooldown before switching back to LOGICAL.`,
          impactWarning: `Updates live dataset settings on "${projectId}:${dsId}".`,
        };
      }
    }

    // 3G-14. VPC Firewall Rule Patch (/firewalls/:ruleName)
    if (rawUrl.includes('/firewalls/') && method === 'patch') {
      const fwName = decodeURIComponent(rawUrl.split('/firewalls/')[1]?.split('?')[0] || 'firewall-rule');
      const nextRanges = Array.isArray(body.sourceRanges)
        ? body.sourceRanges.join(', ')
        : String(body.sourceRanges || '');
      const isIapLock = nextRanges.includes('35.235.240.0/20');
      const isPublicRestore =
        nextRanges === '0.0.0.0/0' &&
        body.enableLogging === undefined &&
        body.priority === undefined;
      const isLoggingOnlyToggle =
        typeof body.enableLogging === 'boolean' &&
        body.sourceRanges === undefined &&
        body.disabled === undefined &&
        body.priority === undefined;
      const isPauseResumeOnly =
        typeof body.disabled === 'boolean' &&
        body.sourceRanges === undefined &&
        body.enableLogging === undefined &&
        body.priority === undefined;

      if (isLoggingOnlyToggle) {
        const turningOn = body.enableLogging === true;
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: turningOn
            ? `Enable VPC Firewall Rules Logging (Logs: ON) on "${fwName}"?`
            : `Disable VPC Firewall Rules Logging (Logs: OFF) on "${fwName}"?`,
          headerBadge: 'VPC Firewall Audit Logging & Cloud Logging Storage Gatekeeper',
          targetLabel: 'Target VPC Firewall Rule Logging Configuration',
          resourceKind: 'Compute Engine VPC Firewall (compute.googleapis.com/v1 · logConfig)',
          targetName: `${fwName} (logConfig.enable: ${turningOn ? 'false → true' : 'true → false'})`,
          location: 'Global VPC Perimeter → Cloud Logging _Default Bucket',
          projectId,
          method: turningOn ? 'ENABLE FIREWALL LOGS' : 'DISABLE FIREWALL LOGS',
          endpoint: rawUrl,
          confirmLabel: turningOn
            ? `Enable Logs: ON for "${fwName}"`
            : `Disable Logs: OFF for "${fwName}" ($0.00/mo)`,
          cancelToast: `Firewall logging change on "${fwName}" cancelled.`,
          whatHappensNext: turningOn
            ? `1. Patches logConfig.enable = true (INCLUDE_ALL_METADATA) on "${fwName}" via PATCH https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls/${fwName}.\n2. Streams a JSON connection record (source/dest IP, port, protocol, VM, rule disposition) to Cloud Logging (logName=".../logs/compute.googleapis.com%2Ffirewall") for every connection matching "${fwName}".\n3. Immediately updates the rule card badge to "● Logs: ON".`
            : `1. Patches logConfig.enable = false on "${fwName}" via PATCH https://compute.googleapis.com/compute/v1/projects/${projectId}/global/firewalls/${fwName}.\n2. Immediately stops ingesting per-connection JSON firewall logs into your Cloud Logging _Default storage bucket while keeping "${fwName}"'s packet filtering active.\n3. Updates the rule card badge to "○ Logs: OFF".`,
          costWarning: turningOn
            ? `STORAGE INGESTION & BILLING WARNING: Enabling Firewall Rules Logging ("Logs: ON") causes Google Cloud to ingest and store a JSON log entry in your Cloud Logging "_Default" storage bucket for EVERY TCP/UDP/ICMP connection matching "${fwName}". On busy rules, this can rapidly ingest gigabytes of log data into storage—consuming your 50 GiB/month Cloud Logging Free Tier and billing $0.50 / GiB ingested beyond 50 GiB/mo (plus $0.01/GiB-mo if retained past 30 days).`
            : `ZERO COST ($0.00/MO): Disabling Firewall Rules Logging immediately halts new connection log data ingestion into Cloud Logging storage for "${fwName}".`,
          impactWarning: turningOn
            ? `Activates real-time connection audit logging into Cloud Logging storage for "${fwName}" without changing which packets are allowed or denied.`
            : `Stops connection audit logging for "${fwName}" while keeping its ALLOW/DENY packet filtering unchanged.`,
        };
      }

      if (isPauseResumeOnly) {
        const pausing = body.disabled === true;
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: pausing
            ? `Pause (Disable Enforcement) Firewall Rule "${fwName}"?`
            : `Re-Enable Firewall Rule "${fwName}" on "${projectId}"?`,
          headerBadge: 'VPC Firewall Enforcement State Gatekeeper',
          targetLabel: 'Target VPC Firewall Rule',
          resourceKind: 'Compute Engine VPC Firewall (compute.googleapis.com/v1)',
          targetName: `${fwName} (disabled: ${pausing ? 'false → true' : 'true → false'})`,
          location: 'Global VPC Perimeter',
          projectId,
          method: pausing ? 'PAUSE FIREWALL RULE' : 'ENABLE FIREWALL RULE',
          endpoint: rawUrl,
          confirmLabel: pausing
            ? `Pause Rule "${fwName}" ($0.00)`
            : `Re-Enable Rule "${fwName}" ($0.00)`,
          cancelToast: `Firewall state toggle on "${fwName}" cancelled.`,
          whatHappensNext: pausing
            ? `1. Patches disabled = true on "${fwName}" via compute.googleapis.com/v1.\n2. Google Cloud Andromeda stops evaluating "${fwName}" against live packets while preserving the rule definition in your VPC for instant re-activation.`
            : `1. Patches disabled = false on "${fwName}" via compute.googleapis.com/v1.\n2. Google Cloud Andromeda immediately resumes enforcing "${fwName}" across all matching VPC subnets and VMs.`,
          costWarning: `ZERO COST ($0.00/MO): Pausing or re-enabling a VPC Firewall rule incurs $0.00/mo.`,
          impactWarning: pausing
            ? `Packets previously matched by "${fwName}" will fall through to lower-priority rules (or the priority-65535 implied fallback rule).`
            : `Immediately resumes live packet enforcement for "${fwName}" in project "${projectId}".`,
        };
      }

      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: isIapLock
          ? `Lock Firewall Rule "${fwName}" to Google Cloud IAP (35.235.240.0/20)?`
          : isPublicRestore
          ? `Restore Public Internet (0.0.0.0/0) on Firewall Rule "${fwName}"?`
          : `Update Live VPC Firewall Rule "${fwName}" on "${projectId}"?`,
        headerBadge: 'VPC Firewall X-Ray & Zero-Trust IAP Gatekeeper',
        targetLabel: 'Target VPC Firewall Rule to Update',
        resourceKind: 'Compute Engine VPC Firewall (compute.googleapis.com/v1)',
        targetName: isIapLock
          ? `${fwName} (sourceRanges: 0.0.0.0/0 → 35.235.240.0/20)`
          : isPublicRestore
          ? `${fwName} (sourceRanges: 35.235.240.0/20 → 0.0.0.0/0)`
          : `projects/${projectId}/global/firewalls/${fwName}`,
        location: 'Global VPC Perimeter',
        projectId,
        method: isIapLock
          ? 'LOCK TO CLOUD IAP'
          : isPublicRestore
          ? 'RESTORE 0.0.0.0/0'
          : 'PATCH FIREWALL RULE',
        endpoint: rawUrl,
        confirmLabel: isIapLock
          ? `Restrict "${fwName}" to Cloud IAP (35.235.240.0/20)`
          : isPublicRestore
          ? `Restore 0.0.0.0/0 on "${fwName}"`
          : `Update Firewall Rule "${fwName}" ($0.00)`,
        cancelToast: `Firewall rule update on "${fwName}" cancelled.`,
        whatHappensNext: isIapLock
          ? `1. Replaces Open Public Internet (0.0.0.0/0) with Cloud IAP CIDR: Updates "${fwName}" in-place so only Google Cloud Identity-Aware Proxy's TCP forwarding range (35.235.240.0/20) is permitted.\n2. Blocks Direct Public Internet Brute-Force While Keeping Browser/CLI SSH Alive: Immediately flips the World Map's public exposure verdict to LOCKED while preserving authenticated "--tunnel-through-iap" sessions.\n3. Enables Firewall Hit Logging & Audit Trail: Activates VPC Firewall Rule Logging on "${fwName}" and records the change in Cloud Audit Logs.`
          : `1. Updates Live Firewall Rule "${fwName}" In-Place: Applies your requested source CIDR ranges (${nextRanges || 'configured CIDRs'}), priority, logging (${body.enableLogging ? 'Logs: ON' : 'Logs: OFF'}), or enabled/disabled state across the VPC network.\n2. Recalculates Live World Map Verdicts: Immediately re-evaluates all packet trajectories against the updated "${fwName}" rule.\n3. Enables Audit Logging: Records the configuration update in Google Cloud Audit Logs.`,
        costWarning: body.enableLogging
          ? `STORAGE INGESTION NOTICE: Modifying VPC Firewall rules is $0.00/mo, but because "Logs: ON" (enableLogging: true) is active, Google Cloud will write connection records into your Cloud Logging "_Default" bucket (50 GiB/mo Free Tier; $0.50/GiB beyond 50 GiB/mo).`
          : `ZERO COST ($0.00/MO): Modifying VPC Firewall rules and using Cloud IAP TCP forwarding incurs $0.00/mo.`,
        impactWarning: isIapLock
          ? `Direct unauthenticated public internet connections to "${fwName}" will be dropped; authorized engineers continue connecting seamlessly via Cloud IAP.`
          : isPublicRestore
          ? `WARNING: Restoring 0.0.0.0/0 opens "${fwName}" back up to all public IPv4 addresses on the internet.`
          : `Immediately updates packet filtering for all VMs matching firewall rule "${fwName}" in project "${projectId}".`,
      };
    }

    // 3G-15. Google Cloud API Enable / Toggle (/apis/enable or /apis/toggle)
    if (rawUrl.includes('/apis/enable') || rawUrl.includes('/apis/toggle')) {
      const apiName = body.serviceName || body.apiName || (Array.isArray(body.apis) ? body.apis.join(', ') : 'googleapis.com');
      return {
        gateType: 'ONE_TAP_CLOUD_ACTION',
        releaseTrack: 'GA',
        title: `Enable Google Cloud API "${apiName}" on Project "${projectId}"?`,
        headerBadge: 'Service Usage API Activation Gatekeeper',
        targetLabel: 'Target Google Cloud Service API',
        resourceKind: 'Service Usage API (serviceusage.googleapis.com/v1)',
        targetName: `projects/${projectId}/services/${apiName}`,
        location: 'Global Project Control Plane',
        projectId,
        method: 'ENABLE GCP API',
        endpoint: rawUrl,
        confirmLabel: `Enable "${apiName}" ($0.00 Activation)`,
        cancelToast: `API activation for "${apiName}" cancelled.`,
        whatHappensNext: `1. Calls POST https://serviceusage.googleapis.com/v1/projects/${projectId}/services/${apiName}:enable.\n2. Polls the Service Usage long-running operation until the API endpoint is active and ready to serve requests on "${projectId}".`,
        costWarning: `ZERO ACTIVATION COST ($0.00): Enabling a Google Cloud API in Service Usage is free ($0.00). Billing only occurs if you subsequently provision billable resources or exceed the API's monthly free quota.`,
        impactWarning: `Activates service API "${apiName}" on project "${projectId}".`,
      };
    }

    // 3G-16. Sovereign IAM, Secrets & KMS, Chrono-Logs, Cloud Functions, Supply Chain, Wave 10, Quantum Nexus, Data Engineer & Parity Actions
    if (
      rawUrl.includes('/service-accounts/grant-act-as') ||
      rawUrl.includes('/sovereign/') ||
      rawUrl.includes('/chrono-logs/') ||
      rawUrl.includes('/functions/') ||
      rawUrl.includes('/cloud-build/') ||
      rawUrl.includes('/wave9/') ||
      rawUrl.includes('/biglake/') ||
      rawUrl.includes('/finops/always-free-enforcer') ||
      rawUrl.includes('/wave10/action') ||
      rawUrl.includes('/quantum-nexus/action') ||
      rawUrl.includes('/data-engineer/action') ||
      rawUrl.includes('/aws-azure-parity/action') ||
      rawUrl.includes('/zombies/exterminate')
    ) {
      const act = String(body.action || body.actionType || '').toUpperCase();
      if (rawUrl.includes('/service-accounts/grant-act-as')) {
        const sa = body.serviceAccountEmail || 'service-account';
        const member = body.member || 'user/principal';
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Grant "roles/iam.serviceAccountUser" on "${sa}" to "${member}"?`,
          headerBadge: 'IAM Service Account ActAs Permission Gatekeeper',
          targetLabel: 'Target IAM Service Account & Principal',
          resourceKind: 'Service Account IAM Policy (iam.googleapis.com/v1)',
          targetName: `${sa} <- ${member}`,
          location: 'Global IAM',
          projectId,
          method: 'GRANT ACT-AS ROLE',
          endpoint: rawUrl,
          confirmLabel: `Grant ServiceAccountUser Role ($0.00)`,
          cancelToast: `IAM ActAs grant cancelled.`,
          whatHappensNext: `1. Fetches the resource-level IAM policy on Service Account "${sa}" via POST https://iam.googleapis.com/v1/projects/${projectId}/serviceAccounts/${sa}:getIamPolicy.\n2. Appends "${member}" to role "roles/iam.serviceAccountUser" and commits via :setIamPolicy.`,
          costWarning: `ZERO COST ($0.00/MO): IAM policy bindings are 100% free in Google Cloud.`,
          impactWarning: `Allows "${member}" to attach and deploy workloads running as Service Account "${sa}".`,
        };
      }
      if (rawUrl.includes('/sovereign/secrets-kms/create-secret')) {
        const sid = body.secretId || 'new-secret';
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Create Secret Manager Secret "${sid}" & Seed Initial Encrypted Version?`,
          headerBadge: 'Secret Manager Hardware-Encrypted Vault Gatekeeper',
          targetLabel: 'Target Secret Manager Secret',
          resourceKind: 'Secret Manager Secret + Version (secretmanager.googleapis.com/v1)',
          targetName: `projects/${projectId}/secrets/${sid}`,
          location: body.replication || 'Automatic Global Replication',
          projectId,
          method: 'CREATE SECRET',
          endpoint: rawUrl,
          confirmLabel: `Create Secret "${sid}"`,
          cancelToast: `Secret creation for "${sid}" cancelled.`,
          whatHappensNext: `1. Calls POST https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets?secretId=${sid} with automatic global replication.\n2. Calls POST https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${sid}:addVersion to store the AES-256 encrypted payload.`,
          costWarning: `ALWAYS-FREE TIER ELIGIBLE ($0.00 WITHIN FREE TIER): Google Cloud Secret Manager includes 6 active secret versions and 10,000 access operations per month for $0.00/mo ($0.06/version-mo beyond Free Tier).`,
          impactWarning: `Creates live secret "${sid}" in Secret Manager on project "${projectId}".`,
        };
      }
      if (rawUrl.includes('/finops/always-free-enforcer')) {
        return {
          gateType: 'ONE_TAP_CLOUD_ACTION',
          releaseTrack: 'GA',
          title: `Enforce $0.00/mo Always-Free Tier Guardrails Across "${projectId}"?`,
          headerBadge: 'FinOps Always-Free Tier Enforcer Gatekeeper',
          targetLabel: 'Project-Wide Compute & Serverless Fleet',
          resourceKind: 'Cloud Run Scale-to-Zero + Request-Only CPU Enforcer (run.googleapis.com/v2)',
          targetName: `${projectId} (minInstanceCount -> 0, cpuIdle -> true)`,
          location: 'All Project Regions',
          projectId,
          method: 'ENFORCE FREE TIER',
          endpoint: rawUrl,
          confirmLabel: `Clamp Warm Instances to 0 ($0.00/hr Idle)`,
          cancelToast: `Always-Free Enforcer cancelled.`,
          whatHappensNext: `1. Scans all Cloud Run v2 services in project "${projectId}" for warm instances (minInstanceCount > 0) or always-allocated CPU.\n2. Patches warm services via run.googleapis.com/v2 to enforce minInstanceCount=0 and cpuIdle=true so idle compute drops to $0.00/hr.`,
          costWarning: `FINOPS COST REDUCTION ($0.00/HR IDLE): Eliminates 24/7 idle container charges across your Cloud Run fleet.`,
          impactWarning: `Reconfigures warm Cloud Run services in "${projectId}" to scale down to 0 instances when idle.`,
        };
      }
      if (rawUrl.includes('/zombies/exterminate')) {
        return {
          gateType: 'DELETE',
          releaseTrack: 'GA',
          title: `Exterminate Unattached Zombie Cloud Resources in "${projectId}"?`,
          headerBadge: 'FinOps Zombie Resource Exterminator Gatekeeper',
          targetLabel: 'Unattached Static IPs / Orphaned Disks / Idle Revisions',
          resourceKind: 'Compute Engine Addresses & Disks (compute.googleapis.com/v1)',
          targetName: body.resourceName || body.name || `Zombie Resources in ${projectId}`,
          location: body.region || body.zone || 'Project-Wide',
          projectId,
          method: 'EXTERMINATE ZOMBIES',
          endpoint: rawUrl,
          confirmLabel: `Confirm & Delete Zombie Resource(s)`,
          cancelToast: `Zombie extermination cancelled.`,
          whatHappensNext: `1. Calls DELETE on the selected unattached Static External IP address(es) (compute.googleapis.com/v1/.../addresses) or orphaned Persistent Disks (compute.googleapis.com/v1/.../disks).\n2. Immediately stops ongoing hourly/monthly idle waste charges.`,
          costWarning: `FINOPS SAVINGS: Releasing an unattached Static IPv4 address saves $7.30/mo ($0.01/hr), and deleting an unattached Persistent Disk saves $0.04–$0.17/GB-mo.`,
          impactWarning: `Permanently deletes the selected unattached zombie resource(s) from project "${projectId}".`,
        };
      }
    }

    // 3H. Smart Payload-Introspecting Fallback for Any Remaining Cloud Action
    const actName = String(
      body.action ||
        body.actionType ||
        body.resourceType ||
        body.serviceType ||
        method.toUpperCase()
    );
    const cleanRouteSegment = rawUrl
      .replace(`/api/project/${encodeURIComponent(projectId)}/`, '')
      .replace(`/api/project/${projectId}/`, '')
      .split('?')[0];
    const targetResource =
      body.name ||
      body.displayName ||
      body.serviceName ||
      body.datasetId ||
      body.bucketName ||
      body.secretId ||
      body.topicName ||
      body.subscriptionName ||
      body.vmName ||
      body.clusterName ||
      body.instanceName ||
      body.ruleName ||
      body.firewallRuleName ||
      body.metricName ||
      body.policyName ||
      body.checkName ||
      body.serviceAccountEmail ||
      body.slug ||
      cleanRouteSegment ||
      'Google Cloud Resource';
    const targetLoc =
      body.region || body.zone || body.location || 'Global / Regional';
    const payloadSummaryKeys = Object.keys(body || {})
      .filter((k) => !['action', 'actionType', 'confirmed'].includes(k))
      .slice(0, 4)
      .map((k) => `${k}=${JSON.stringify(body[k]).slice(0, 40)}`)
      .join(', ');

    return {
      gateType: 'ONE_TAP_CLOUD_ACTION',
      releaseTrack: rawUrl.includes('alpha')
        ? 'ALPHA'
        : rawUrl.includes('beta')
        ? 'BETA'
        : 'GA',
      title: `Confirm Live Cloud Operation "${actName}" on "${targetResource}"?`,
      headerBadge: 'CloudPulse 2026 Live Cloud Control-Plane Gatekeeper',
      targetLabel: 'Target Google Cloud Resource & Operation',
      resourceKind: `${cleanRouteSegment} · ${actName}`,
      targetName: String(targetResource),
      location: String(targetLoc),
      projectId,
      method: `${String(actName).slice(0, 24).toUpperCase()}`,
      endpoint: rawUrl,
      confirmLabel: `Confirm & Execute "${actName}" on GCP`,
      cancelToast: `Operation "${actName}" cancelled — no changes made to "${projectId}".`,
      whatHappensNext: `1. Authenticates with your active Google Cloud OAuth2 / ADC token against project "${projectId}".\n2. Executes control-plane operation "${actName}" targeting "${targetResource}" in scope "${targetLoc}"${payloadSummaryKeys ? ` with parameters (${payloadSummaryKeys})` : ''}.\n3. Verifies the live Google Cloud API response and records a cryptographic audit entry in the session Flight Recorder.`,
      costWarning: `CLOUD BILLING & CONTROL-PLANE NOTICE: Control-plane metadata, IAM, firewall, and policy mutations incur $0.00/mo. If this operation provisions active compute, databases, or storage in "${projectId}", standard Google Cloud regional pricing and Always-Free Tier allowances apply.`,
      impactWarning: `Executes "${actName}" on live resource "${targetResource}" (${targetLoc}) in project "${projectId}".`,
    };
  }

  return null;
}

function CloudPulseCockpit() {
  const { isDark, toggleTheme, mobilePreview, setMobilePreview } = useTheme();
  const {
    activeTimeZone,
    utcOffsetLabel,
    shortTzName,
    liveShortClockText,
    liveDateText,
  } = useTimezone();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contextData, setContextData] = useState({
    authenticated: false,
    account: '',
    defaultProject: '',
    projects: [],
  });
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorBanner, setRawErrorBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [pendingDeleteQueue, setPendingDeleteQueue] = useState([]);

  const setErrorBanner = useCallback((msg) => {
    if (
      typeof msg === 'string' &&
      (msg.toLowerCase().includes('cancelled') ||
        msg.includes('remains enabled') ||
        msg.includes('__cancelledByUser'))
    ) {
      return;
    }
    setRawErrorBanner(msg);
  }, []);

  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [activeOrbitalDrawer, setActiveOrbitalDrawer] = useState(null); // null | 'STACK_COMPOSER' | 'FLIGHT_RECORDER' | 'AUTOPILOT_GUARD'
  const [innovationSubTab, setInnovationSubTab] = useState('WAVE11_MOONSHOT');
  const [sovereignSubTab, setSovereignSubTab] = useState('IAM_SURGEON');
  const [awsAzureSubTab, setAwsAzureSubTab] = useState('RESOURCE_GROUPS');
  const [alibabaHuaweiSubTab, setAlibabaHuaweiSubTab] = useState(
    'ALIYUN_PTS_MSE_FLASH_SALE_SURGE'
  );
  const [dataEngineerSubTab, setDataEngineerSubTab] =
    useState('ICEBERG_50_MATRIX');
  const [bigLakeSubTab, setBigLakeSubTab] = useState('METASTORE_CATALOGS');
  const [storageSubTab, setStorageSubTab] = useState('BUCKETS');
  const [storageTargetBucket, setStorageTargetBucket] = useState('');
  const [storageTargetObject, setStorageTargetObject] = useState('');
  const [recycleBinCategory, setRecycleBinCategory] = useState('ALL');

  const handleNavigateStudioTab = useCallback((tabId, subTab, extraTarget = null) => {
    if (!tabId) return;
    if (tabId === 'TIME_MACHINE') {
      setSovereignSubTab('MERKLE_DRIFT');
      setActiveTab('SOVEREIGN_STUDIO');
      return;
    }
    if (tabId === 'ZOMBIE_HUNTER') {
      setInnovationSubTab('ZOMBIE_HUNTER');
      setActiveTab('INNOVATION_LAB');
      return;
    }
    if (tabId === 'SECRETS_KMS') {
      setSovereignSubTab('SECRETS_KMS_WAF');
      setActiveTab('SOVEREIGN_STUDIO');
      return;
    }
    const normalizedTab =
      tabId === 'DATA_ENGINEER'
        ? 'DATA_ENGINEER_STUDIO'
        : tabId === 'BIGQUERY'
        ? 'BIGQUERY_STUDIO'
        : tabId === 'BIGLAKE'
        ? 'BIGLAKE_STUDIO'
        : tabId === 'CLOUD_SQL'
        ? 'CLOUD_SQL_STUDIO'
        : tabId === 'SPANNER'
        ? 'WAVE10_FRONTIER'
        : tabId === 'VPC_FIREWALL' || tabId === 'VPC'
        ? 'VPC_NETWORKS'
        : tabId === 'VM_FLEET' || tabId === 'VMS'
        ? 'VM_SSH'
        : tabId === 'STORAGE'
        ? 'CLOUD_STORAGE'
        : tabId === 'SOVEREIGN_IAM' || tabId === 'IAM_SECURITY'
        ? 'SOVEREIGN_STUDIO'
        : tabId === 'BILLING_GUARDIAN' || tabId === 'BILLING_CREDITS'
        ? 'FINOPS'
        : tabId === 'VERTEX_AI'
        ? 'VERTEX_AI_STUDIO'
        : tabId === 'CLOUD_BUILD'
        ? 'WAVE9_STUDIO'
        : tabId === 'GKE_KUBERNETES'
        ? 'GKE_STUDIO'
        : tabId;

    if (subTab && normalizedTab === 'SOVEREIGN_STUDIO') {
      setSovereignSubTab(subTab);
    } else if (subTab && normalizedTab === 'INNOVATION_LAB') {
      setInnovationSubTab(subTab);
    } else if (subTab && normalizedTab === 'AWS_AZURE_PARITY') {
      setAwsAzureSubTab(subTab);
    } else if (subTab && normalizedTab === 'ALIBABA_HUAWEI_PARITY') {
      setAlibabaHuaweiSubTab(subTab);
    } else if (subTab && normalizedTab === 'DATA_ENGINEER_STUDIO') {
      setDataEngineerSubTab(subTab);
    } else if (subTab && normalizedTab === 'BIGLAKE_STUDIO') {
      setBigLakeSubTab(subTab);
    } else if (normalizedTab === 'RECYCLE_BIN') {
      setRecycleBinCategory(subTab || 'ALL');
    } else if (normalizedTab === 'CLOUD_STORAGE') {
      if (subTab) setStorageSubTab(subTab);
      if (extraTarget && typeof extraTarget === 'object') {
        if (extraTarget.bucketName) setStorageTargetBucket(extraTarget.bucketName);
        if (typeof extraTarget.objectName === 'string') {
          setStorageTargetObject(extraTarget.objectName);
        }
      }
    }
    setActiveTab(normalizedTab);
  }, []);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInitialPrompt, setCopilotInitialPrompt] = useState('');
  const [shellSeedCommand, setShellSeedCommand] = useState('');
  const [bigQueryInitialSql, setBigQueryInitialSql] = useState('');

  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionInitialService, setProvisionInitialService] =
    useState('GCS_BUCKET');
  const [provisionInitialLocation, setProvisionInitialLocation] = useState(null);
  const [vmRefreshTrigger, setVmRefreshTrigger] = useState(0);
  const [cloudRunModalOpen, setCloudRunModalOpen] = useState(false);
  const [gdePrivacyConfig, setGdePrivacyConfig] = useState(() =>
    loadGdePrivacyConfig()
  );

  // Global Cmd+K / Ctrl+K shortcut for 2026 Command & Voice Palette
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toastTimerRef = useRef(null);
  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  // Global Mandatory Delete & Destructive Action Confirmation Gatekeeper
  useEffect(() => {
    const interceptorId = axios.interceptors.request.use(
      (config) => {
        const descriptor = classifyDestructiveAxiosConfig(config);
        if (!descriptor) {
          return config;
        }
        return new Promise((resolve, reject) => {
          setPendingDeleteQueue((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              descriptor,
              onConfirm: () => {
                if (typeof config.__onGatekeeperConfirmed === 'function') {
                  try {
                    config.__onGatekeeperConfirmed();
                  } catch {
                    // ignore callback errors
                  }
                }
                if (config.headers && typeof config.headers.set === 'function') {
                  config.headers.set('x-confirmed-delete', 'true');
                } else {
                  config.headers = {
                    ...(config.headers || {}),
                    'x-confirmed-delete': 'true',
                  };
                }
                resolve(config);
              },
              onCancel: () => {
                const cancelText =
                  descriptor.cancelToast ||
                  'Deletion cancelled — resource kept safe.';
                const cancelErr = new Error(cancelText);
                cancelErr.__cancelledByUser = true;
                cancelErr.response = {
                  status: 499,
                  data: {
                    error: cancelText,
                  },
                };
                reject(cancelErr);
              },
            },
          ]);
        });
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, []);

  // Restore browser token from sessionStorage or URL hash (OAuth 2.0 redirect)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const hashToken = params.get('access_token');
      if (hashToken) {
        sessionStorage.setItem('cloudpulse_access_token', hashToken);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const storedToken = sessionStorage.getItem('cloudpulse_access_token');
    const storedAccount =
      sessionStorage.getItem('cloudpulse_account') ||
      localStorage.getItem('cloudpulse_account');
    const storedProj =
      sessionStorage.getItem('cloudpulse_project') ||
      localStorage.getItem('cloudpulse_project') ||
      '';
    if (storedToken) {
      axios.defaults.headers.common['x-gcp-access-token'] = storedToken;
    }
    if (storedAccount) {
      axios.defaults.headers.common['x-gcp-account'] = storedAccount;
    }

    axios
      .get('/api/context', {
        params: storedProj ? { preferredProject: storedProj } : {},
      })
      .then((res) => {
        if (res.data.authenticated) {
          if (res.data.accessToken) {
            sessionStorage.setItem(
              'cloudpulse_access_token',
              res.data.accessToken
            );
            axios.defaults.headers.common['x-gcp-access-token'] =
              res.data.accessToken;
          }
          if (res.data.account) {
            sessionStorage.setItem('cloudpulse_account', res.data.account);
            localStorage.setItem('cloudpulse_account', res.data.account);
            axios.defaults.headers.common['x-gcp-account'] = res.data.account;
          }

          let mergedProjects = Array.isArray(res.data.projects)
            ? [...res.data.projects]
            : [];
          try {
            const cachedProjectsRaw = localStorage.getItem(
              'cloudpulse_projects_list_v1'
            );
            if (cachedProjectsRaw) {
              const cachedProjects = JSON.parse(cachedProjectsRaw);
              if (Array.isArray(cachedProjects)) {
                const seenIds = new Set(mergedProjects.map((p) => p.projectId));
                cachedProjects.forEach((cp) => {
                  if (cp?.projectId && !seenIds.has(cp.projectId)) {
                    seenIds.add(cp.projectId);
                    mergedProjects.push(cp);
                  }
                });
              }
            }
            if (mergedProjects.length > 0) {
              localStorage.setItem(
                'cloudpulse_projects_list_v1',
                JSON.stringify(mergedProjects)
              );
            }
          } catch {
            // ignore storage errors
          }

          setContextData({
            ...res.data,
            projects: mergedProjects,
          });

          const validProjectIds = new Set(
            mergedProjects.map((p) => p.projectId)
          );
          const canUseStored =
            Boolean(storedProj) &&
            (validProjectIds.size === 0 || validProjectIds.has(storedProj));

          const projToUse =
            (canUseStored ? storedProj : '') ||
            res.data.defaultProject ||
            mergedProjects[0]?.projectId ||
            '';
          setSelectedProjectId(projToUse);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  const handleRefreshProjectsList = useCallback(async () => {
    try {
      const res = await axios.get('/api/context', {
        params: selectedProjectId
          ? { preferredProject: selectedProjectId }
          : {},
      });
      if (res.data?.authenticated && Array.isArray(res.data.projects)) {
        if (res.data.accessToken) {
          sessionStorage.setItem(
            'cloudpulse_access_token',
            res.data.accessToken
          );
          axios.defaults.headers.common['x-gcp-access-token'] =
            res.data.accessToken;
        }
        try {
          if (res.data.projects.length > 0) {
            localStorage.setItem(
              'cloudpulse_projects_list_v1',
              JSON.stringify(res.data.projects)
            );
          }
        } catch {
          // ignore
        }
        setContextData((prev) => ({
          ...prev,
          ...res.data,
          projects:
            res.data.projects.length > 0
              ? res.data.projects
              : prev.projects || [],
        }));
        showToast(
          `Synced ${res.data.projects.length} active GCP projects for ${
            res.data.account || 'session'
          }`
        );
      }
    } catch {
      showToast('Could not refresh GCP projects list.');
    }
  }, [selectedProjectId, showToast]);

  const fetchProjectOverview = useCallback(async (projId, { force = false } = {}) => {
    if (!projId) return;
    const swrStorageKey = `cloudpulse_overview_swr_v2_${projId}`;
    if (!force) {
      try {
        const cachedRaw = localStorage.getItem(swrStorageKey);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed && parsed.projectId === projId) {
            setOverview((prev) => prev || parsed);
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }
    setLoadingOverview(true);
    setErrorBanner(null);
    const requestUrl = `/api/project/${encodeURIComponent(projId)}/overview${
      force ? '?force=true' : ''
    }`;
    try {
      let res;
      try {
        res = await axios.get(requestUrl, { timeout: 15000 });
      } catch (firstErr) {
        if (firstErr.response?.status === 401) throw firstErr;
        await new Promise((r) => setTimeout(r, 450));
        res = await axios.get(requestUrl, { timeout: 15000 });
      }
      setOverview(res.data);
      try {
        localStorage.setItem(swrStorageKey, JSON.stringify(res.data));
      } catch {
        // Ignore storage quota errors
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
      } else {
        setOverview((prev) =>
          prev || {
            projectId: projId,
            fetchLatencyMs: 0,
            summary: {
              totalResources: 0,
              totalVms: 0,
              runningVms: 0,
              cloudRunServices: 0,
              storageBuckets: 0,
              bigqueryDatasets: 0,
              gkeClusters: 0,
              vpcNetworks: 0,
              firewallRules: 0,
              enabledApisCount: 0,
            },
            resources: [],
            vpcs: [],
            firewalls: [],
            cloudRunServices: [],
            enabledApis: [],
            logs: [],
          }
        );
        setErrorBanner(
          err.response?.data?.error ||
            `Failed to fetch live telemetry for project ${projId}`
        );
      }
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  const [gdeSummary, setGdeSummary] = useState(() =>
    summarizeCreditLedger([], 0)
  );

  useEffect(() => {
    if (isAuthenticated && selectedProjectId) {
      sessionStorage.setItem('cloudpulse_project', selectedProjectId);
      try {
        localStorage.setItem('cloudpulse_project', selectedProjectId);
      } catch {
        // ignore
      }
      fetchProjectOverview(selectedProjectId);
      axios
        .get(
          `/api/project/${encodeURIComponent(
            selectedProjectId
          )}/billing-guardian`
        )
        .then(async (res) => {
          let envelopeOverride = {};
          const savedEnv = localStorage.getItem(
            'cloudpulse_gde_bonus_envelope_v2'
          );
          if (savedEnv) {
            try {
              envelopeOverride = JSON.parse(savedEnv) || {};
            } catch {
              // ignore
            }
          }
          const aggregated = await syncAndAggregateBillingIndexedDb({
            projectId: selectedProjectId,
            billingInfo: res.data?.billingInfo || {},
            billingAccounts: res.data?.billingAccounts || [],
            liveBillingInsights: res.data?.liveBillingInsights || null,
            syncedConsoleCredits:
              res.data?.liveBillingInsights?.consoleCredits || [],
            envelopeOverride,
            dailyBurnUsd: 0,
          });
          setGdeSummary(aggregated);
        })
        .catch(() => null);
    }
  }, [isAuthenticated, selectedProjectId, fetchProjectOverview]);

  const handleDisconnect = async () => {
    sessionStorage.removeItem('cloudpulse_access_token');
    sessionStorage.removeItem('cloudpulse_account');
    sessionStorage.removeItem('cloudpulse_project');
    sessionStorage.removeItem('cloudpulse_project_explicit');
    delete axios.defaults.headers.common['x-gcp-access-token'];
    delete axios.defaults.headers.common['x-gcp-account'];
    try {
      await axios.post('/api/auth/disconnect');
    } catch {
      // ignore
    }
    setOverview(null);
    setIsAuthenticated(false);
  };

  const handleSessionEstablished = (sessionData) => {
    if (sessionData.accessToken) {
      sessionStorage.setItem('cloudpulse_access_token', sessionData.accessToken);
      sessionStorage.setItem('cloudpulse_account', sessionData.account || '');
      try {
        localStorage.setItem('cloudpulse_account', sessionData.account || '');
      } catch {
        // ignore
      }
      axios.defaults.headers.common['x-gcp-access-token'] =
        sessionData.accessToken;
      axios.defaults.headers.common['x-gcp-account'] =
        sessionData.account || '';
    }
    const incomingProjects = sessionData.projects || [];
    try {
      if (incomingProjects.length > 0) {
        localStorage.setItem(
          'cloudpulse_projects_list_v1',
          JSON.stringify(incomingProjects)
        );
      }
    } catch {
      // ignore
    }
    setContextData({
      authenticated: true,
      account: sessionData.account,
      defaultProject: sessionData.selectedProjectId,
      projects: incomingProjects,
    });
    sessionStorage.setItem('cloudpulse_project', sessionData.selectedProjectId);
    sessionStorage.setItem('cloudpulse_project_explicit', 'true');
    try {
      localStorage.setItem('cloudpulse_project', sessionData.selectedProjectId);
      localStorage.setItem('cloudpulse_project_explicit', 'true');
    } catch {
      // ignore
    }
    setSelectedProjectId(sessionData.selectedProjectId);
    setIsAuthenticated(true);
    showToast(
      `Connected as ${sessionData.account} on project ${sessionData.selectedProjectId}`
    );
  };

  const handleTriggerAction = async ({ actionType, targetId, payload }) => {
    setActionLoading(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(selectedProjectId)}/action`,
        {
          actionType,
          targetId,
          payload,
        }
      );
      showToast(res.data.message || 'Action applied to GCP project.');
      await fetchProjectOverview(selectedProjectId);
    } catch (err) {
      setErrorBanner(
        err.response?.data?.error || 'Failed to apply remediation action.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenCopilotWithPrompt = (promptText) => {
    setCopilotInitialPrompt(promptText || '');
    setCopilotOpen(true);
  };

  const [logExplorerSeedSpec, setLogExplorerSeedSpec] = useState(null);
  const [globalMapXRaySeed, setGlobalMapXRaySeed] = useState(null);
  const [vpcStudioRuleSeed, setVpcStudioRuleSeed] = useState(null);
  const [cloudSocSeed, setCloudSocSeed] = useState(null);

  const handleRunInShell = (cmd) => {
    setShellSeedCommand(cmd);
    setActiveTab('LOGS_SHELL');
    showToast(`Loaded command into Mobile Cloud Shell: ${cmd}`);
  };

  const handleOpenInLogsExplorer = (spec) => {
    setLogExplorerSeedSpec({ ...spec, triggeredAt: Date.now() });
    if (spec?.gcloudCommand) {
      setShellSeedCommand(spec.gcloudCommand);
    }
    setActiveTab('LOGS_SHELL');
    showToast(
      `Opened Cloud Logs Explorer & Shell for ${spec?.regionId || 'event'} (${
        spec?.summary || spec?.category || 'Forensic Trace'
      })`
    );
  };

  const handleTestRuleOnGlobalMap = (seed) => {
    setGlobalMapXRaySeed({ ...seed, nonce: Date.now() });
    setActiveTab('GLOBAL_MAP');
    showToast(
      `Tracing firewall rule "${seed?.ruleName || 'custom'}" (${String(
        seed?.protocol || 'tcp'
      ).toUpperCase()}:${seed?.port || 22}) in Global Map Firewall X-Ray`
    );
  };

  const handleOpenInVpcFirewallStudio = (seed) => {
    setVpcStudioRuleSeed({ ...seed, nonce: Date.now() });
    setActiveTab('VPC_NETWORKS');
    showToast(
      `Opened "${seed?.ruleName || seed?.vpcName || 'Firewall Policy'}" in VPC & Firewalls Studio`
    );
  };

  const handleOpenInCloudSoc = (seed) => {
    setCloudSocSeed({ ...seed, nonce: Date.now() });
    setActiveTab('CLOUD_SOC');
    showToast(
      `Opened "${seed?.ruleName || seed?.vpcName || 'VPC Perimeter'}" in Cloud SOC & SOAR War-Room`
    );
  };

  const handleOpenProvision = (serviceType = 'GCS_BUCKET', locationSpec = null) => {
    setProvisionInitialService(serviceType);
    setProvisionInitialLocation(locationSpec);
    setProvisionOpen(true);
  };

  const handleProvisionSuccess = async (data, serviceType) => {
    showToast(data.message || 'Resource provisioned on Google Cloud!');
    await fetchProjectOverview(selectedProjectId);
    setVmRefreshTrigger((c) => c + 1);
    if (serviceType === 'CLOUD_RUN') {
      setActiveTab('CLOUD_RUN');
    } else if (serviceType === 'GKE_CLUSTER') {
      setActiveTab('GKE_STUDIO');
    } else if (serviceType === 'CLOUD_SQL') {
      setActiveTab('CLOUD_SQL_STUDIO');
    } else if (serviceType === 'GCS_BUCKET') {
      setActiveTab('CLOUD_STORAGE');
    } else if (serviceType === 'BIGQUERY_DATASET') {
      setActiveTab('BIGQUERY_STUDIO');
    } else if (serviceType === 'COMPUTE_VM') {
      setActiveTab('VM_SSH');
    } else if (serviceType === 'VPC_NETWORK' || serviceType === 'VPC_FIREWALL') {
      setActiveTab('VPC_NETWORKS');
    }
  };

  const handleDeleteResource = async (resource, options = {}) => {
    try {
      const res = await axios.delete(
        `/api/project/${encodeURIComponent(selectedProjectId)}/resource`,
        {
          __onGatekeeperConfirmed: () => {
            setActionLoading(true);
            if (typeof options.onConfirmed === 'function') {
              options.onConfirmed();
            }
          },
          data: {
            resourceType: resource.type,
            name: resource.name,
            region: resource.region,
          },
        }
      );
      // Immediately evict deleted resource from client state & sessionStorage SWR cache
      try {
        sessionStorage.removeItem(`cloudpulse_overview_swr_v2_${selectedProjectId}`);
      } catch {
        // ignore storage quota errors
      }
      setOverview((prev) => {
        if (!prev) return prev;
        const nextResources = (prev.resources || []).filter(
          (r) => r.id !== resource.id && !(r.name === resource.name && r.type === resource.type)
        );
        return {
          ...prev,
          resources: nextResources,
        };
      });
      showToast(res.data.message || `Deleted ${resource.name} from ${selectedProjectId}`);
      await fetchProjectOverview(selectedProjectId, { force: true });
      setVmRefreshTrigger((c) => c + 1);
      return true;
    } catch (err) {
      if (err?.__cancelledByUser || err?.response?.status === 499) {
        return false;
      }
      setErrorBanner(
        err.response?.data?.error || `Failed to delete ${resource.name}`
      );
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#131314] flex items-center justify-center p-6">
        <div className="text-xs font-mono text-zinc-500 animate-pulse">
          Initializing CloudPulse 2026 Multi-Account Bridge...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthOnboardingGate onSessionEstablished={handleSessionEstablished} />
    );
  }

  const liveBurn = calculateLiveBurnRate(overview);

  const navTabs = [
    // I. Command & Global Topology
    {
      id: 'OVERVIEW',
      group: 'COMMAND',
      label: 'Overview',
      tip: 'Project Overview & Resource Lineage: Live Project KPIs, Stale/Orphaned Resource Detector, Live Resource Inventory, 5-Domain Architecture Hub & API Kill-Switch',
      icon: LayoutDashboard,
    },
    {
      id: 'INNOVATION_LAB',
      group: 'COMMAND',
      label: '2026 Innovation',
      isStar: true,
      tip: '24 Beyond-Console Enterprise Tools: Pre-Crime 30-Day Billing Forecaster, Dream Stack Compiler, Wave 16 Moonshot, 2026 Quantum Nexus (Resilience Suite), Night-Mode Sleep, Reverse-Terraform, Storage RAM DLP, Cold-Start Surgeon & AES-256-GCM Gemini 3.8 Vault',
      icon: Sparkles,
    },
    {
      id: 'STARTUP_10X',
      group: 'COMMAND',
      label: 'Startup 10X',
      isStar: true,
      tip: 'Google for Startups Mentor Edition — Dedicated Startup 10X Scale & Bottleneck Radar: Expose and remediate Cloud Run Cold-Start & Legacy VPC Connector lags, Cloud SQL 200-instance Connection Storms, Launch-Day HTTP 429 Quota Walls, $2k–$350k Credit Vampires, SOC2 Deal-Blockers & GenAI -80% Context Caching',
      icon: Rocket,
    },
    {
      id: 'MCP_HUB',
      group: 'COMMAND',
      label: 'MCP Servers',
      isStar: true,
      tip: '2026 Google Cloud Official Remote MCP Control Plane: 48 *.googleapis.com/mcp Servers, 505 Live JSON-RPC 2.0 Tools, 4-Server Autonomous Triage Chains, Gemini 3.8 Flash MCP Tool-Calling Agent & 1-Click IDE Config Exporter',
      icon: Cpu,
    },
    {
      id: 'GLOBAL_MAP',
      group: 'COMMAND',
      label: 'Global Map',
      tip: 'Interactive 40-Region & 121-Zone Global Subsea Cable, Carbon Intensity & Chaos Failover Map with click-to-deploy',
      icon: Globe,
    },

    // II. Core Infrastructure, Compute & Serverless
    {
      id: 'VPC_NETWORKS',
      group: 'INFRA_COMPUTE',
      label: 'VPC',
      tip: 'VPC Backbone & Firewall Perimeter Manager: Inspect subnets, BGP routing, MTU, and audit or lock 0.0.0.0/0 ingress rules to IAP',
      icon: Network,
    },
    {
      id: 'VM_SSH',
      group: 'INFRA_COMPUTE',
      label: 'VM',
      tip: 'Compute Engine VM Fleet & Browser Web-SSH Terminal: Start, stop, resize, or SSH directly into your Linux VMs',
      icon: Server,
    },
    {
      id: 'CLOUD_STORAGE',
      group: 'INFRA_COMPUTE',
      label: 'Cloud Storage',
      tip: 'Cloud Storage Studio: 5-Step Compliance Bucket Wizard, strict SEC/GDPR/HIPAA locks, Soft-Delete & WORM retention, and live object explorer',
      icon: HardDrive,
    },
    {
      id: 'CLOUD_RUN',
      group: 'INFRA_COMPUTE',
      label: 'Cloud Run',
      tip: 'Cloud Run Serverless Fleet Manager: Deploy containers, attach NVIDIA L4 GPUs, 1-Click Direct Cloud IAP ($0/mo Zero-LB), App Engine Service Exterminator & $0/mo Default Neutralizer, and Request vs Instance billing',
      icon: Rocket,
    },
    {
      id: 'GKE_STUDIO',
      group: 'INFRA_COMPUTE',
      label: 'GKE',
      tip: 'Google Kubernetes Engine (GKE) Studio: 1-Click Autopilot & Spot GPU Cluster Provisioner, compliance locks & K8s YAML Composer',
      icon: Cpu,
    },
    {
      id: 'WAVE9_STUDIO',
      group: 'INFRA_COMPUTE',
      label: 'Cloud Build',
      tip: 'Cloud Build GitHub CI/CD + Artifact Registry SLSA-3 Supply-Chain Studio: Buildpacks/Dockerfiles, Auto-Deploy & Orphan Digest Sweeper',
      icon: PackageCheck,
    },
    {
      id: 'FUNCTIONS_STUDIO',
      group: 'INFRA_COMPUTE',
      label: 'Functions',
      tip: 'Cloud Functions (1st Gen v1 & 2nd Gen v2) + Eventarc Trigger Studio & Cloud Workflows / Messaging Decision Matrix (Eventarc vs Pub/Sub vs Tasks vs Workflows)',
      icon: Zap,
    },

    // III. Databases, Data Engineering & Lakehouse
    {
      id: 'CLOUD_SQL_STUDIO',
      group: 'DATA_AI',
      label: 'Cloud SQL',
      tip: 'Cloud SQL (MySQL 8.4 & PostgreSQL 16/17) + AlloyDB Studio: Architecture Fork, AI Vector (alloydb_scann / pgvector) Surgeon & IAM Auth Proxy v2',
      icon: Database,
    },
    {
      id: 'DATA_ENGINEER_STUDIO',
      group: 'DATA_AI',
      label: 'Data Engineer',
      tip: '2026 Data Engineering Studio (GCloud SDK 591.0.0 & Data Agent Kit): Medallion Builder, Dataform/dbt SQLX, Dataplex Profiling, Schema Mapper, Serverless DAGs & Zero-Cluster Serverless Spark on BigLake Iceberg',
      icon: Layers,
    },
    {
      id: 'BIGQUERY_STUDIO',
      group: 'DATA_AI',
      label: 'BigQuery',
      tip: 'BigQuery Capacitor Warehouse & SQL Optimizer Studio: Dataset Compliance Hardener, Physical Billing (-54%), Dry-Run SQL X-Ray, Slot FinOps & 168h Time-Machine',
      icon: Database,
    },
    {
      id: 'BIGLAKE_STUDIO',
      group: 'DATA_AI',
      label: 'BigLake',
      tip: 'BigLake & Apache Iceberg Open Lakehouse Studio: Metastore REST Catalogs (/biglake/metastore/catalogs), 1-Click CLOUD_RESOURCE Connection & Zero-Trust Bucket IAM, Iceberg Small-File Compaction Doctor & Cross-Cloud Omni (AWS S3 / Azure)',
      icon: Layers,
    },
    {
      id: 'WAVE10_FRONTIER',
      group: 'DATA_AI',
      label: 'Spanner',
      tip: 'Cloud Spanner Unified Database Studio: Granular 100-PU Sizer ($65.70/mo), Spanner Graph (ISO GQL) & Interleaved Schema Architect, ScaNN Vector Search & Hybrid GraphRAG, and 99.999% TrueTime Change Streams CDC',
      icon: Database,
    },

    // IV. Security, Incident SRE, FinOps, Logs & Docs
    {
      id: 'CLOUD_SOC',
      group: 'SECURITY_SRE',
      label: 'Cloud SOC',
      isStar: true,
      tip: 'Wave 16 Next-Gen Autonomous Google Cloud SOC & SOAR War-Room ($0/mo SIEM Tax): Live cloudaudit MITRE ATT&CK Kill-Chains, 3-Vector Toxic Combinations Graph, @sha256 Supply-Chain & .json Key Disabler, $0/mo Active Canary Deception Grid, and Gemini 3.8/3.1 Incident Commander + Ed25519 Ledger',
      icon: ShieldCheck,
    },
    {
      id: 'SOVEREIGN_STUDIO',
      group: 'SECURITY_SRE',
      label: 'IAM',
      tip: 'Autonomous IAM Least-Privilege Surgeon (24h JIT CEL + Service Account Key & OAuth2 Token Kill-Switch), SHA-256 Merkle Drift Radar & Secret/KMS/WAF Vault',
      icon: ShieldCheck,
    },
    {
      id: 'AWS_AZURE_PARITY',
      group: 'SECURITY_SRE',
      label: 'AWS & Azure Parity',
      isStar: true,
      tip: '20-in-1 AWS & Azure Enterprise Parity Suite for GCP: Azure Resource Groups + RBAC + 1-Click Teardown, Hard-Spend Fuse, AWS IAM Policy Simulator, S3/SAS Presigned URLs, 1-Screen Global LB + WAF, CloudFormation/ARM Drift, SSM Fleet Command, Multi-Brand OAuth, Route 53/Front Door DNS, CloudTrail Lake, AWS RAM/Lighthouse & Bedrock/AI Foundry Gateway',
      icon: Layers,
    },
    {
      id: 'ALIBABA_HUAWEI_PARITY',
      group: 'SECURITY_SRE',
      label: 'Alibaba & Huawei Parity',
      isStar: true,
      tip: '8-in-1 Alibaba Cloud (Aliyun) & Huawei Cloud Hyperscale Parity Suite for GCP: 11.11 Singles-Day PTS + MSE Sentinel Surge Engine, CEN + Global Accelerator QoS Slicer, PolarDB / GaussDB Serverless HTAP & 1.6s Clone, Huawei CCE Volcano + PAI Fractional vGPU Pool, RocketMQ 5.0 2PC Half-Messages, Nacos + Higress Zero-Restart Config Mesh, Hologres + MaxCompute Sub-Second OLAP, and DataV / Astro War-Room NOC Wall',
      icon: Globe,
    },
    {
      id: 'SRE_WAR_ROOM',
      group: 'SECURITY_SRE',
      label: 'SRE War-room',
      tip: 'Autonomous SRE Incident War-Room, Cloud Logging Root-Cause Correlator, 14.4x SLO Burn Radar, VPC Service Controls (VPC-SC) & Pub/Sub DLQ Studio',
      icon: Flame,
    },
    {
      id: 'FINOPS',
      group: 'OPS_DOCS',
      label: 'Finops',
      tip: 'Real-Time Cloud Monitoring Metrics, CPU/Memory/Network Telemetry Charts & FinOps Footprint',
      icon: BarChart3,
    },
    {
      id: 'LOGS_SHELL',
      group: 'OPS_DOCS',
      label: 'Logs',
      tip: '2026 Neural Chrono-Log & Trace Studio (Drain3 Clustering, Trace Waterfall, NL-to-LQL, Log FinOps, DLP Shield & Cloud Shell)',
      icon: Terminal,
    },
    {
      id: 'RECYCLE_BIN',
      group: 'OPS_DOCS',
      label: 'Recycle Bin',
      tip: '30-Day Cloud Recycle Bin: Inspect what resources were deleted and which Google Cloud APIs were disabled over the last 30 days (cloudaudit.googleapis.com/activity + Soft-Delete Vaults) with 1-Click Restore / Re-Enable',
      icon: Trash2,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#131314] text-zinc-950 dark:text-zinc-50 transition-colors duration-300">
      <div
        className={
          mobilePreview
            ? 'max-w-[430px] mx-auto my-4 border-[6px] border-zinc-200 dark:border-zinc-800 dark:border-zinc-700 rounded-[40px] shadow-2xl overflow-hidden bg-zinc-50 dark:bg-[#131314] min-h-[860px] flex flex-col relative'
            : 'w-full max-w-none pb-20 md:pb-10'
        }
      >
        {mobilePreview && (
          <div className="bg-white dark:bg-[#131314] text-zinc-800 dark:text-zinc-200 px-6 py-2 flex items-center justify-between text-[11px] font-mono border-b border-zinc-200 dark:border-zinc-800">
            <span>
              {liveShortClockText} {shortTzName} · GCP 5G+
            </span>
            <div className="w-20 h-4 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[9px] text-zinc-700 dark:text-zinc-300">
              LIVE OAUTH
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-zinc-400" />
              <BatteryCharging className="w-3.5 h-3.5 text-zinc-400" />
            </div>
          </div>
        )}

        {/* Header Row */}
        <header className="relative z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-[#202124]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4">
          {/* Top Row: CloudPulse 2026 Brand (Left) + Live GCP Project Switcher & Provision Resource CTA (Top Right) */}
          <div className="relative z-50 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shadow-sm shrink-0">
                <Cloud className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50">
                    CloudPulse <span className="text-zinc-500 dark:text-zinc-400">2026</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    REAL PROJECT MODE
                  </span>
                  {gdePrivacyConfig.enabled && (
                    <span
                      title="GDE Streamer & Tutorial Privacy Mode is active (Shortcut: Alt+G) — Emails, Cloud Billing IDs, Project Numbers, Public IPs & Credit Balances are masked on screen"
                      className="inline-flex items-center gap-1 text-[10px] font-mono font-extrabold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/40 px-2 py-0.5 rounded-full"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      GDE TUTORIAL SHIELD ON
                    </span>
                  )}
                </div>
                <p
                  data-gde-ignore="true"
                  className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[230px] sm:max-w-none"
                >
                  {gdePrivacyConfig.enabled
                    ? redactTextForGdeMode(
                        contextData.account,
                        gdePrivacyConfig,
                        {
                          accountEmail: contextData.account,
                          projects: contextData.projects,
                        }
                      )
                    : contextData.account}{' '}
                  · {liveDateText} · {activeTimeZone} ({utcOffsetLabel})
                </p>
              </div>
            </div>

            {/* Top-Right Cluster: [Docs] + [Overview] + [10-Persona Board] + [SDK 591.0.0] Lab Launcher + Live GCP Project Switcher + Primary Provision Resource CTA */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* 1-Click Docs & Architecture Guide Button */}
              <button
                type="button"
                data-feature-id="DOCS_GUIDE"
                onClick={() => setActiveTab('DOCS_GUIDE')}
                title="Interactive Architecture Documentation, Security Model & Feature Walkthrough Guide"
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-extrabold transition-all shadow-sm cursor-pointer whitespace-nowrap border ${
                  activeTab === 'DOCS_GUIDE'
                    ? 'bg-blue-600 text-white border-blue-400/40'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Docs</span>
              </button>

              {/* Big 1-Click Overview & Resource Lineage Button */}
              <button
                type="button"
                data-feature-id="OVERVIEW"
                onClick={() => setActiveTab('OVERVIEW')}
                title="Open Project Overview, Resource Lineage & Stale/Orphaned Resource Detector"
                className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-extrabold transition-all shadow-sm cursor-pointer whitespace-nowrap border ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-blue-600 text-white border-blue-400/40'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Overview</span>
              </button>

              {/* 1-Click 10-Persona Enterprise Architecture Board Launcher */}
              <button
                type="button"
                onClick={() => {
                  setInnovationSubTab('FIVE_PERSONA_COUNCIL');
                  setActiveTab('INNOVATION_LAB');
                }}
                title="Open 10-Persona Enterprise Architecture Board & Pre-Flight War-Room: (01) Cloud Architect, (02) Cloud Engineer, (03) Data Engineer, (04) Network Engineer, (05) DevSecOps, (06) AI/MLOps Engineer, (07) SRE Commander, (08) Database Reliability Engineer (DBRE), (09) FinOps & GreenOps, and (10) K8s & IDP Platform Engineer"
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2.5 text-xs font-mono font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>10-Persona Board</span>
              </button>

              {/* 1-Click [GA/BETA/ALPHA] gcloud 591.0.0 Frontier Lab Launcher */}
              <button
                type="button"
                onClick={() => {
                  setInnovationSubTab('GCLOUD_ALPHA_BETA');
                  setActiveTab('INNOVATION_LAB');
                }}
                title="Open [GA/BETA/ALPHA] gcloud 591.0.0 Frontier Lab (Wave 1–3: Cloud Run Worker Pools & Multi-Region [BETA], Agent Registry & MCP [GA], PAM JIT IAM [GA], Model Armor [GA], Cluster Director [GA], Lustre [GA], NetApp QoS [GA/BETA], Database Center [ALPHA], Cloud Quotas [GA/BETA], Observability [GA], Orchestration Pipelines [BETA] & Compliance Manager [GA])"
                className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-md px-3 py-2.5 text-xs font-mono font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span>SDK 591.0.0 Lab</span>
              </button>

              {/* 1-Click 30-Day Cloud Recycle Bin Launcher */}
              <button
                type="button"
                data-feature-id="RECYCLE_BIN"
                onClick={() => setActiveTab('RECYCLE_BIN')}
                title="Open 30-Day Cloud Recycle Bin: Find what resources were deleted and which Google Cloud APIs were disabled in the last 30 days, with 1-Click Restore & Re-Enable"
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-mono font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap border ${
                  activeTab === 'RECYCLE_BIN'
                    ? 'bg-blue-600 text-white border-blue-400/40'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                <span>Recycle Bin</span>
              </button>

              {/* Live GCP Project Dropdown */}
              <div className={`relative shrink-0 ${projectMenuOpen ? 'z-[70]' : 'z-50'}`}>
                <button
                  type="button"
                  onClick={() => {
                    const nextOpen = !projectMenuOpen;
                    setProjectMenuOpen(nextOpen);
                    if (nextOpen && (contextData.projects?.length || 0) <= 1) {
                      handleRefreshProjectsList();
                    }
                  }}
                  title={`Active GCP Project: ${selectedProjectId} — Click to switch between your authenticated Google Cloud projects`}
                  className="inline-flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-md px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="hidden md:inline text-[11px] font-sans font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Project:
                  </span>
                  <span className="max-w-[160px] sm:max-w-[220px] truncate">
                    {selectedProjectId}
                  </span>
                  <ChevronDown className="w-4 h-4 opacity-70 shrink-0" />
                </button>

                {projectMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#202124] shadow-2xl border border-zinc-200 dark:border-zinc-800 rounded-[12px] py-1.5 z-[80] max-h-80 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <span>
                        GCP Projects ({contextData.projects?.length || 1})
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefreshProjectsList();
                        }}
                        className="px-1.5 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 font-bold text-[9.5px] cursor-pointer normal-case"
                      >
                        🔄 Sync Projects
                      </button>
                    </div>
                    {(contextData.projects || []).map((proj) => (
                      <button
                        key={proj.projectId}
                        type="button"
                        onClick={() => {
                          sessionStorage.setItem(
                            'cloudpulse_project',
                            proj.projectId
                          );
                          sessionStorage.setItem(
                            'cloudpulse_project_explicit',
                            'true'
                          );
                          try {
                            localStorage.setItem(
                              'cloudpulse_project',
                              proj.projectId
                            );
                            localStorage.setItem(
                              'cloudpulse_project_explicit',
                              'true'
                            );
                          } catch {
                            // ignore
                          }
                          setSelectedProjectId(proj.projectId);
                          setProjectMenuOpen(false);
                          showToast(
                            `Switched live GCP project to ${proj.projectId}`
                          );
                        }}
                        title={`Switch active telemetry & control plane to project ${proj.projectId} (${proj.name})`}
                        className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between ${
                          selectedProjectId === proj.projectId
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                            : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <div>
                          <div className="font-mono">{proj.projectId}</div>
                          <div className="text-[10px] text-zinc-500">
                            {proj.name} · #{proj.projectNumber}
                          </div>
                        </div>
                        {selectedProjectId === proj.projectId && (
                          <Check className="w-4 h-4 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleOpenProvision('GCS_BUCKET')}
                title="Provision a live GCP resource (Cloud Storage Bucket, Cloud Run Service, Compute Engine VM, VPC Network, Firewall Rule, BigQuery Dataset, GKE Cluster, or Cloud SQL / AlloyDB)"
                className="inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 rounded-md px-6 py-2.5 min-w-[200px] sm:min-w-[235px] text-xs sm:text-sm font-extrabold tracking-tight transition-all shadow-md cursor-pointer whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span>Provision Resource</span>
              </button>
            </div>
          </div>

          {/* Secondary Telemetry & Cockpit Controls Bar (Single-Row Compact Layout) */}
          <div className="relative z-30 flex items-center justify-between gap-1.5 lg:flex-nowrap flex-wrap mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-1.5 lg:flex-nowrap flex-wrap min-w-0">
              {/* Live Burn-Rate Radar Ticker Pill */}
              <button
                type="button"
                onClick={() => {
                  setInnovationSubTab('FINOPS_SLEEP');
                  setActiveTab('INNOVATION_LAB');
                }}
                title="Open Live Wallet Burn-Rate Radar & Night-Mode FinOps Sleep Switch (Zeroes active vCPU/GPU compute via REST API or Google Cloud Scheduler; attached Persistent Disks & unused Static External IPs still bill)"
                className="inline-flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2 py-1.5 text-[11px] font-mono font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                <DollarSign className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>${liveBurn.hourly.toFixed(4)}/hr</span>
                <span className="hidden xl:inline text-[10px] opacity-75">
                  (~${liveBurn.monthly.toFixed(2)}/mo)
                </span>
              </button>

              {/* Cloud Billing Account & Promotional Credits Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('FINOPS')}
                title="Open Cloud Billing Account & Promotional Credits Guardian"
                className={`inline-flex items-center gap-1 rounded-[8px] px-2 py-1.5 text-[11px] font-mono font-bold transition-colors shadow-sm border cursor-pointer whitespace-nowrap shrink-0 ${
                  gdeSummary.hasImportedCredits &&
                  gdeSummary.nearestExpiryDays !== null &&
                  gdeSummary.nearestExpiryDays <= 14 &&
                  gdeSummary.totalRemainingUsd > 0
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : gdeSummary.hasImportedCredits ||
                      gdeSummary.liveCostMetrics?.hasLiveRows
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                }`}
              >
                {gdeSummary.hasImportedCredits &&
                gdeSummary.urgentWarningsCount > 0 &&
                gdeSummary.totalRemainingUsd > 0 ? (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <CreditCard className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>
                  {gdePrivacyConfig.enabled &&
                  gdePrivacyConfig.hideCreditBalances !== false
                    ? 'Bonus: $•••.••'
                    : gdeSummary.hasImportedCredits
                      ? `Bonus: $${gdeSummary.totalRemainingUsd.toLocaleString(
                          'en-US',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}`
                      : 'Bonus: $0.00'}
                </span>
                {gdeSummary.hasImportedCredits &&
                gdeSummary.expiringSoonRemainingUsd > 0 &&
                gdeSummary.nearestExpiryDays !== null ? (
                  <span className="hidden xl:inline text-[10px] opacity-90">
                    {gdePrivacyConfig.enabled &&
                    gdePrivacyConfig.hideCreditBalances !== false
                      ? `· $•••.•• (${gdeSummary.nearestExpiryDays}d)`
                      : `· $${gdeSummary.expiringSoonRemainingUsd.toLocaleString(
                          'en-US',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )} (${gdeSummary.nearestExpiryDays}d)`}
                  </span>
                ) : null}
              </button>

              {/* GDE Streamer & Tutorial Privacy Shield */}
              <GdeStreamerPrivacyShield
                config={gdePrivacyConfig}
                onChangeConfig={setGdePrivacyConfig}
                accountEmail={contextData.account}
                projects={contextData.projects}
                selectedProjectId={selectedProjectId}
              />

              {/* ⌘K Global Command & Voice Action Bar */}
              <button
                type="button"
                data-feature-id="CMD_PALETTE"
                onClick={() => setCommandPaletteOpen(true)}
                title="Open ⌘K Natural Language & Voice-to-Cloud Command Palette (Shortcut: Ctrl+K or Cmd+K)"
                className="inline-flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Command className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>⌘K Ops</span>
              </button>

              {/* Reincarnated Orbital Telemetry & Zero-Mock Control-Plane Triggers */}
              {(() => {
                const orb = computeOrbitalTelemetry(overview);
                return (
                  <>
                    <button
                      type="button"
                      data-feature-id="CFE_POSTURE"
                      onClick={() => setActiveTab('GLOBAL_MAP')}
                      title="Live Grid Carbon-Free Energy (CFE%) & Zero-Trust Posture Grade — Click to open 40-Region Global Map"
                      className="hidden xl:inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>CFE {orb.avgCfe}%</span>
                      <span className="text-emerald-600 dark:text-emerald-400">
                        · Grade {orb.postureGrade}
                      </span>
                    </button>

                    <button
                      type="button"
                      data-feature-id="STACK_COMPOSER"
                      onClick={() =>
                        setActiveOrbitalDrawer((cur) =>
                          cur === 'STACK_COMPOSER' ? null : 'STACK_COMPOSER'
                        )
                      }
                      title="1-Tap 3-Tier Cloud Stack Synthesizer (Provisions GCS Bucket + BigQuery Dataset + Cloud Run Gen2 Service)"
                      className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold border transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer ${
                        activeOrbitalDrawer === 'STACK_COMPOSER'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <Wand2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>1-Tap Stack</span>
                    </button>

                    <button
                      type="button"
                      data-feature-id="FLIGHT_RECORDER"
                      onClick={() =>
                        setActiveOrbitalDrawer((cur) =>
                          cur === 'FLIGHT_RECORDER' ? null : 'FLIGHT_RECORDER'
                        )
                      }
                      title="Open Cloud Flight Recorder & 1-Tap Mutation Time-Machine"
                      className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold border transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer ${
                        activeOrbitalDrawer === 'FLIGHT_RECORDER'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                      <span>Flight Recorder</span>
                    </button>

                    <button
                      type="button"
                      data-feature-id="AUTOPILOT_GUARD"
                      onClick={() =>
                        setActiveOrbitalDrawer((cur) =>
                          cur === 'AUTOPILOT_GUARD' ? null : 'AUTOPILOT_GUARD'
                        )
                      }
                      title="Open Real Autonomous FinOps & Zero-Trust Control-Plane Enforcer (Scale-to-Zero, 12-Invariant Self-Healer & Night-Mode Sleep)"
                      className={`inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5 text-[11px] font-mono font-bold border transition-colors shadow-sm whitespace-nowrap shrink-0 cursor-pointer ${
                        activeOrbitalDrawer === 'AUTOPILOT_GUARD'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      <Cpu className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>Auto-Pilot Guard</span>
                    </button>
                  </>
                );
              })()}
            </div>

            <div className="flex items-center gap-1.5 lg:flex-nowrap flex-wrap shrink-0">
              {/* Global UI Timezone & Live Clock Selector Pill */}
              <TimezoneSelectorPill onShowToast={showToast} />

              {/* 1-Tap Project Health, Drift & FinOps Scanner Button */}
              <button
                type="button"
                data-feature-id="HEALTH_DRIFT"
                onClick={() => handleOpenCopilotWithPrompt('')}
                title="Run 1-Tap Project Health, Zombie Waste, Firewall Perimeter & Live Pricing Drift Scan"
                className="inline-flex items-center gap-1.5 bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-[11px] font-bold transition-colors shadow-sm cursor-pointer whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span>Health &amp; Drift</span>
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                disabled={loadingOverview}
                onClick={() => {
                  fetchProjectOverview(selectedProjectId);
                  setVmRefreshTrigger((c) => c + 1);
                }}
                title={`Refresh live GCP telemetry, VMs, Cloud Run services, Storage buckets, and VPCs for ${selectedProjectId}`}
                aria-label="Refresh GCP telemetry"
                className="p-1.5 rounded-[8px] bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm disabled:opacity-50 shrink-0"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ${
                    loadingOverview ? 'animate-spin' : ''
                  }`}
                />
              </button>

              {/* Dark / Light Mode Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                title={
                  isDark
                    ? 'Switch to Daylight High-Contrast Mode'
                    : 'Switch to 2026 OLED Dark Cockpit Mode'
                }
                aria-label="Toggle Dark or Light Mode"
                className="p-1.5 rounded-[8px] bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors shadow-sm shrink-0"
              >
                {isDark ? (
                  <Sun className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-zinc-600" />
                )}
              </button>

              {/* Disconnect / Switch Account Button */}
              <button
                type="button"
                onClick={handleDisconnect}
                title="Disconnect active session & switch Google Cloud account"
                className="inline-flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <span className="hidden xl:inline">Disconnect</span>
              </button>
            </div>
          </div>

          {/* Underline Navigation Tabs (Single-Row Compact Horizontal Bar) */}
          <nav className="flex items-center justify-between gap-2 lg:gap-2.5 mt-3.5 pb-2 border-b border-zinc-200 dark:border-zinc-800 -mb-2 overflow-x-auto">
            {navTabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const showGroupDivider =
                idx > 0 && navTabs[idx - 1].group !== tab.group;
              return (
                <React.Fragment key={tab.id}>
                  {showGroupDivider && (
                    <span
                      className="h-3.5 w-px bg-zinc-300 dark:bg-zinc-700/80 mb-1.5 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <button
                    type="button"
                    data-feature-id={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    title={tab.tip}
                    className={`inline-flex items-center gap-1 text-[11.5px] whitespace-nowrap transition-all cursor-pointer shrink-0 pb-1.5 font-semibold border-b-2 ${
                      isActive
                        ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 border-transparent hover:border-zinc-400 dark:hover:border-zinc-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-current opacity-80 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </header>

        {/* Main Content Body */}
        <main className="px-4 sm:px-6 lg:px-8 py-5 space-y-5 flex-1">
          {(toastMessage || errorBanner) && (
            <div className="fixed bottom-5 right-5 z-[95] flex flex-col items-end gap-2.5 max-w-md pointer-events-none">
              {toastMessage && (
                <div className="pointer-events-auto w-full bg-zinc-950/95 border border-emerald-500/60 text-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-mono shadow-2xl backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{toastMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setToastMessage(null)}
                    title="Dismiss notification"
                    className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 text-[10px] font-bold cursor-pointer shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {errorBanner && (
                <div className="pointer-events-auto w-full bg-zinc-950/95 border border-red-500/60 text-red-200 rounded-xl p-3.5 flex flex-col gap-2.5 text-xs font-mono shadow-2xl backdrop-blur-md">
                  <span>{errorBanner}</span>
                  <div className="flex items-center justify-end gap-2.5">
                    {(() => {
                      const primaryProj =
                        (contextData?.defaultProject &&
                        contextData.defaultProject !== selectedProjectId
                          ? contextData.defaultProject
                          : '') ||
                        contextData?.projects?.find(
                          (p) => p.projectId !== selectedProjectId
                        )?.projectId ||
                        '';
                      if (primaryProj && primaryProj !== selectedProjectId) {
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              sessionStorage.setItem(
                                'cloudpulse_project_explicit',
                                'true'
                              );
                              setErrorBanner(null);
                              setSelectedProjectId(primaryProj);
                              showToast(
                                `Switched active project to ${primaryProj}`
                              );
                            }}
                            title={`Switch active GCP project to ${primaryProj}`}
                            className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-500 transition-colors cursor-pointer text-[10px]"
                          >
                            Switch to {primaryProj}
                          </button>
                        );
                      }
                      return null;
                    })()}
                    <button
                      type="button"
                      onClick={() => fetchProjectOverview(selectedProjectId)}
                      title="Retry fetching live GCP telemetry"
                      className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/35 text-red-300 text-[10px] font-bold cursor-pointer"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() => setErrorBanner(null)}
                      title="Dismiss banner"
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-blocking asynchronous page render: Studios and KPI cards mount immediately (<16ms) while live GCP telemetry streams in the background */}
          <>
              {activeOrbitalDrawer && (
                <OrbitalControlPlaneDrawer
                  activeDrawer={activeOrbitalDrawer}
                  onCloseDrawer={() => setActiveOrbitalDrawer(null)}
                  onSelectDrawer={(d) => setActiveOrbitalDrawer(d)}
                  projectId={selectedProjectId}
                  overview={overview}
                  onRefreshOverview={() => {
                    fetchProjectOverview(selectedProjectId, { force: true });
                    setVmRefreshTrigger((c) => c + 1);
                  }}
                  onDeleteResource={handleDeleteResource}
                  onNavigateTab={(tabId) => setActiveTab(tabId)}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <SortableKpiRow
                    summary={overview?.summary}
                    fetchLatencyMs={overview?.fetchLatencyMs}
                    isSyncing={loadingOverview}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId, { force: true })
                    }
                    onNavigateTab={handleNavigateStudioTab}
                    onScrollToApis={() => {
                      const scrollNow = () => {
                        const el = document.getElementById(
                          'emergency-api-killswitch-section'
                        );
                        if (el) {
                          el.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }
                      };
                      if (activeTab !== 'OVERVIEW') {
                        setActiveTab('OVERVIEW');
                        setTimeout(scrollNow, 120);
                      } else {
                        scrollNow();
                      }
                    }}
                  />

                  <EnterpriseStackPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    overview={overview}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                  />

                  <ResourceControlCenter
                    resources={overview?.resources || []}
                    projectId={selectedProjectId}
                    onTriggerAction={handleTriggerAction}
                    onDeleteResource={handleDeleteResource}
                    actionLoading={actionLoading}
                    onRunInShell={handleRunInShell}
                    onAskCopilot={handleOpenCopilotWithPrompt}
                    onSelectTab={handleNavigateStudioTab}
                  />

                  {/* 5-Domain Organized Studio Hub */}
                  <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                          <Layers className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                          <span>
                            CloudPulse 2026 Architectural Domain Navigator
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Every Google Cloud technology is organized into 5 dedicated engineering domains — click any studio below to open its full control plane.
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                        5 DOMAINS · 20 DEDICATED STUDIOS
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                      {[
                        {
                          domain: 'I. Innovation, Startups & Global Edge',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'STARTUP_10X', label: 'Startup 10X', meta: 'Google for Startups Scale & Credit Radar' },
                            { id: 'INNOVATION_LAB', label: '2026 Innovation', meta: '16 Specialized Beyond-Console Studios' },
                            { id: 'MCP_HUB', label: 'MCP Servers', meta: '48 Official *.googleapis.com/mcp · 505 Tools' },
                            { id: 'GLOBAL_MAP', label: 'Global Map', meta: '40 Regions, Subsea Cables & Carbon' },
                            { id: 'VPC_NETWORKS', label: 'VPC', meta: `${overview?.vpcs?.length || 0} VPCs · ${overview?.firewalls?.length || 0} Rules` },
                          ],
                        },
                        {
                          domain: 'II. Compute, Containers & CI/CD',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'VM_SSH', label: 'VM', meta: `${overview?.summary?.liveVmsCount ?? overview?.summary?.totalVms ?? 0} VMs · Browser SSH` },
                            { id: 'CLOUD_STORAGE', label: 'Cloud Storage', meta: `${overview?.summary?.liveBucketsCount ?? overview?.summary?.storageBuckets ?? 0} Buckets · WORM` },
                            { id: 'CLOUD_RUN', label: 'Cloud Run', meta: `${overview?.cloudRunServices?.length || 0} Services · L4 GPUs` },
                            { id: 'GKE_STUDIO', label: 'GKE', meta: 'Autopilot, Spot GPUs & K8s YAML' },
                            { id: 'WAVE9_STUDIO', label: 'Cloud Build', meta: 'GitHub CI/CD & SLSA-3 SBOM' },
                            { id: 'FUNCTIONS_STUDIO', label: 'Functions', meta: 'v1/v2 + 90+ Eventarc Triggers' },
                          ],
                        },
                        {
                          domain: 'III. Databases, Data & Lakehouse',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'CLOUD_SQL_STUDIO', label: 'Cloud SQL', meta: 'PG 17, MySQL 8.4 & AlloyDB Vectors' },
                            { id: 'DATA_ENGINEER_STUDIO', label: 'Data Engineer', meta: 'Medallion, Dataform & Serverless Spark' },
                            { id: 'BIGQUERY_STUDIO', label: 'BigQuery', meta: 'Capacitor, SQL X-Ray & 7d Time-Machine' },
                            { id: 'BIGLAKE_STUDIO', label: 'BigLake', meta: 'Iceberg REST Catalogs, Compaction & Omni' },
                            { id: 'WAVE10_FRONTIER', label: 'Spanner', meta: '100-PU Sizer, ISO GQL Graph & ScaNN RAG' },
                          ],
                        },
                        {
                          domain: 'IV. Zero-Trust IAM & Incident SRE',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'SOVEREIGN_STUDIO', label: 'IAM & Time-Machine', meta: 'SA Key Kill-Switch, JIT & SHA-256 Drift' },
                            { id: 'CLOUD_SOC', label: 'Cloud SOC (20-Pillar)', meta: 'Kill-Chains, Canary, Model-Armor & SOAR' },
                            { id: 'SRE_WAR_ROOM', label: 'SRE War-Room (12-Pillar)', meta: '14.4x SLO Burn, Prober & VPC-SC Perimeter' },
                            { id: 'AWS_AZURE_PARITY', label: 'AWS & Azure Parity', meta: '28-in-1 AWS, Azure, Alibaba & Huawei Bridge' },
                          ],
                        },
                        {
                          domain: 'V. FinOps, Logs & Architecture Docs',
                          color: 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30',
                          items: [
                            { id: 'FINOPS', label: 'Finops', meta: `$${liveBurn.monthly.toFixed(2)}/mo Run-Rate` },
                            { id: 'LOGS_SHELL', label: 'Logs', meta: 'Neural Chrono-Logs, Trace Waterfall & Shell' },
                            { id: 'RECYCLE_BIN', label: 'Recycle Bin (30d)', meta: 'Deleted Resources & Disabled APIs + Restore' },
                            { id: 'DOCS_GUIDE', label: 'Docs', meta: 'Interactive Architecture & API Guide' },
                          ],
                        },
                      ].map((group) => (
                        <div
                          key={group.domain}
                          className={`p-3.5 rounded-xl border ${group.color} space-y-2`}
                        >
                          <div className="text-[11px] font-mono font-extrabold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                            {group.domain}
                          </div>
                          <div className="space-y-1.5">
                            {group.items.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                data-feature-id={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className="w-full text-left p-2 rounded-md bg-white/90 dark:bg-zinc-950/90 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                    {item.label}
                                  </div>
                                  <div className="text-[10px] font-mono text-zinc-500 truncate">
                                    {item.meta}
                                  </div>
                                </div>
                                <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 shrink-0">
                                  →
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="ARCHITECT"
                      projectId={selectedProjectId}
                      studioContextLabel="Overview · SPOF Blast-Radius & FinOps"
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="CLOUD_ENG"
                      projectId={selectedProjectId}
                      studioContextLabel="Resource Table · .tf Exporter & 5-Gate Pre-Flight"
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>

                  <div id="emergency-api-killswitch-section">
                    <EmergencyApiKillSwitch
                      projectId={selectedProjectId}
                      enabledApis={overview?.enabledApis || []}
                      onRefresh={() => fetchProjectOverview(selectedProjectId)}
                      onOpenFinOps={() => setActiveTab('FINOPS')}
                      onNavigateTab={handleNavigateStudioTab}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'GLOBAL_MAP' && (
                <div className="space-y-4">
                  <GlobalNetworkWorldMap
                    projectId={selectedProjectId}
                    overview={overview}
                    firewalls={overview?.firewalls || []}
                    vpcs={overview?.vpcs || []}
                    initialXRaySeed={globalMapXRaySeed}
                    onOpenProvision={handleOpenProvision}
                    onRunInShell={handleRunInShell}
                    onOpenLogsExplorer={handleOpenInLogsExplorer}
                    onOpenVpcFirewallStudio={handleOpenInVpcFirewallStudio}
                    onSelectTab={(tabId) => setActiveTab(tabId)}
                    onRefresh={() => fetchProjectOverview(selectedProjectId)}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="NETOPS"
                    projectId={selectedProjectId}
                    studioContextLabel="Global Network World Map · 4-Hop Tracer & IPAM"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'INNOVATION_LAB' && (
                <Revolutionary2026Suite
                  projectId={selectedProjectId}
                  overview={overview}
                  initialSubTab={innovationSubTab}
                  onRefreshOverview={() => {
                    fetchProjectOverview(selectedProjectId);
                    setVmRefreshTrigger((c) => c + 1);
                  }}
                  onOpenProvision={handleOpenProvision}
                  onDeleteResource={handleDeleteResource}
                  onOpenHealthAndDrift={() => setCopilotOpen(true)}
                  onOpenTimeMachine={() => handleNavigateStudioTab('TIME_MACHINE')}
                  onOpenBigQuerySql={(sqlText) => {
                    if (sqlText) setBigQueryInitialSql(sqlText);
                    setActiveTab('BIGQUERY_STUDIO');
                  }}
                  onSelectStudioTab={handleNavigateStudioTab}
                  onSelectProject={(pid) => {
                    sessionStorage.setItem(
                      'cloudpulse_project_explicit',
                      'true'
                    );
                    setSelectedProjectId(pid);
                    showToast(`Switched active project to ${pid}`);
                  }}
                  onRunInShell={handleRunInShell}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'STARTUP_10X' && (
                <div className="space-y-4">
                  <Startup10xMentorStudio
                    projectId={selectedProjectId}
                    onNavigateTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="ARCHITECT"
                    projectId={selectedProjectId}
                    studioContextLabel="Startup 10X Mentor Studio · Scale Readiness, Credit Runway & Launch-Day Guardrails"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'MCP_HUB' && (
                <div className="space-y-4">
                  <DataLakehouseAiPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                  />
                  <GoogleCloudRemoteMcpStudio
                    projectId={selectedProjectId}
                    onShowToast={showToast}
                  />
                  <PersonaContextualHelper
                    persona="AI_MLOPS"
                    projectId={selectedProjectId}
                    studioContextLabel="MCP & Agent Hub · Model Armor Firewall, Smart Router & RAG Recall"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'CLOUD_STORAGE' && (
                <div className="space-y-4">
                  <DataLakehouseAiPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                  />
                  <CloudStorageStudio
                    projectId={selectedProjectId}
                    initialSubTab={storageSubTab}
                    initialBucketName={storageTargetBucket}
                    initialObjectName={storageTargetObject}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onRunInShell={handleRunInShell}
                    onRefreshGlobal={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="STORAGE"
                    onRunInShell={handleRunInShell}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="CLOUD_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Cloud Storage Studio · .tf Exporter & Undo Saga"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'BIGQUERY_STUDIO' && (
                <div className="space-y-4">
                  <DataLakehouseAiPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                  />
                  <BigQueryStudio
                    projectId={selectedProjectId}
                    initialSql={bigQueryInitialSql}
                    onOpenBigLakeStudio={(sub) =>
                      handleNavigateStudioTab(
                        'BIGLAKE_STUDIO',
                        sub || 'METASTORE_CATALOGS'
                      )
                    }
                    onOpenDataEngineerStudio={(sub) =>
                      handleNavigateStudioTab(
                        'DATA_ENGINEER_STUDIO',
                        sub || 'MEDALLION_ELT'
                      )
                    }
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onOpenTimeMachine={() => handleNavigateStudioTab('TIME_MACHINE')}
                    onOpenProvision={handleOpenProvision}
                    onRunInShell={handleRunInShell}
                    onRefreshGlobal={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="BIGQUERY"
                    onRunInShell={handleRunInShell}
                    onLoadBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                    }}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DATA_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="BigQuery Studio · Column Lineage Guard & DLQ Replay"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'BIGLAKE_STUDIO' && (
                <div className="space-y-4">
                  <DataLakehouseAiPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                  />
                  <BigLakeIcebergStudio
                    projectId={selectedProjectId}
                    initialSubTab={bigLakeSubTab}
                    onRunInShell={handleRunInShell}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onOpenDataEngineerStudio={(sub) =>
                      handleNavigateStudioTab(
                        'DATA_ENGINEER_STUDIO',
                        sub || 'SERVERLESS_SPARK'
                      )
                    }
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onOpenTimeMachine={() => handleNavigateStudioTab('TIME_MACHINE')}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DATA_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="BigLake & Iceberg · Schema Evolution & Spark Offload"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'DATA_ENGINEER_STUDIO' && (
                <div className="space-y-4">
                  <DataLakehouseAiPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                  />
                  <DataEngineeringStudio
                    projectId={selectedProjectId}
                    initialSubTab={dataEngineerSubTab}
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onOpenBigLakeStudio={(sub) =>
                      handleNavigateStudioTab(
                        'BIGLAKE_STUDIO',
                        sub || 'METASTORE_CATALOGS'
                      )
                    }
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onOpenTimeMachine={() => handleNavigateStudioTab('TIME_MACHINE')}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DATA_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Data Engineering Studio · Column Lineage, DLQ & Spark"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'CLOUD_SQL_STUDIO' && (
                <div className="space-y-4">
                  <CloudSqlAndAlloyDbStudio
                    projectId={selectedProjectId}
                    onOpenProvisionCloudSql={() =>
                      handleOpenProvision('CLOUD_SQL')
                    }
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onRunInShell={handleRunInShell}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="DBRE"
                      projectId={selectedProjectId}
                      studioContextLabel="Cloud SQL & AlloyDB · Lock-Tree, Concurrent Index & 1.6s PITR Clone"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="DATA_ENG"
                      projectId={selectedProjectId}
                      studioContextLabel="Cloud SQL & AlloyDB · Federated Lineage & Pre-Flight"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onOpenBigQuerySql={(sqlText) => {
                        if (sqlText) setBigQueryInitialSql(sqlText);
                        setActiveTab('BIGQUERY_STUDIO');
                      }}
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'WAVE9_STUDIO' && (
                <div className="space-y-4">
                  <EnterpriseStackPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    overview={overview}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                  />
                  <Wave9AiGkeSqlSupplyChainStudio
                    projectId={selectedProjectId}
                    onTriggerToast={showToast}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="DEVSECOPS"
                      projectId={selectedProjectId}
                      studioContextLabel="Cloud Build & Supply Chain · SLSA-3 @sha256 & Zero-Key OIDC"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="AI_MLOPS"
                      projectId={selectedProjectId}
                      studioContextLabel="Vertex AI Pipeline · Model Armor & Accelerator Zone Finder"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'WAVE10_FRONTIER' && (
                <div className="space-y-4">
                  <Wave10Frontier2026Studio
                    projectId={selectedProjectId}
                    onNavigateTab={handleNavigateStudioTab}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DBRE"
                    projectId={selectedProjectId}
                    studioContextLabel="Spanner Graph & Vector Studio · Hot-Key Inspector & Zero-Downtime DDL"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'SOVEREIGN_STUDIO' && (
                <div className="space-y-4">
                  <SovereignTimeMachineIamStudio
                    projectId={selectedProjectId}
                    initialSubTab={sovereignSubTab}
                    onTriggerToast={showToast}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onNavigateTab={handleNavigateStudioTab}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="IAM"
                    onRunInShell={handleRunInShell}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="DEVSECOPS"
                    projectId={selectedProjectId}
                    studioContextLabel="IAM & Zero-Trust Studio · Escalation Paths, @sha256 & OIDC WIF"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'SRE_WAR_ROOM' && (
                <div className="space-y-4">
                  <SreWarRoomPerimeterStudio
                    projectId={selectedProjectId}
                    onTriggerToast={showToast}
                    onRunInShell={handleRunInShell}
                    onOpenHealthAndDrift={() => setCopilotOpen(true)}
                    onNavigateTab={handleNavigateStudioTab}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="SRE_ONCALL"
                      projectId={selectedProjectId}
                      studioContextLabel="SRE War-Room · 14.4x SLO Freeze Gate, Change Correlator & Chaos"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="ARCHITECT"
                      projectId={selectedProjectId}
                      studioContextLabel="SRE War-Room · Region Blackout SPOF Drill & Org Guardrails"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'CLOUD_RUN' && (
                <div className="space-y-4">
                  <EnterpriseStackPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    overview={overview}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                  />
                  <CloudRunFleetManager
                    projectId={selectedProjectId}
                    initialServices={overview?.cloudRunServices || []}
                    onOpenProvisionCloudRun={() =>
                      handleOpenProvision('CLOUD_RUN')
                    }
                    onOpenSecretManagerStudio={() => {
                      setSovereignSubTab('SECRETS_KMS_WAF');
                      setActiveTab('SOVEREIGN_STUDIO');
                    }}
                    onSelectTab={handleNavigateStudioTab}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="CLOUD_RUN"
                    onRunInShell={handleRunInShell}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="CLOUD_ENG"
                      projectId={selectedProjectId}
                      studioContextLabel="Cloud Run Fleet · Pre-Flight Validator & .tf Export"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="DEVSECOPS"
                      projectId={selectedProjectId}
                      studioContextLabel="Cloud Run Revisions · Binary Authz @sha256 Digest Gate"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'FUNCTIONS_STUDIO' && (
                <div className="space-y-4">
                  <CloudFunctionsEventarcStudio
                    projectId={selectedProjectId}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                  />
                  <PersonaContextualHelper
                    persona="CLOUD_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Cloud Functions & Eventarc · Pre-Flight & .tf Export"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'GKE_STUDIO' && (
                <div className="space-y-4">
                  <GkeFleetStudio
                    projectId={selectedProjectId}
                    onOpenProvisionGke={() => handleOpenProvision('GKE_CLUSTER')}
                    onRunInShell={handleRunInShell}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="GKE_FINOPS"
                    onRunInShell={handleRunInShell}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="PLATFORM_K8S"
                      projectId={selectedProjectId}
                      studioContextLabel="GKE Fleet · Pod OOM/CPU Right-Sizer, Scale-Down Blocker & STRICT mTLS"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="CLOUD_ENG"
                      projectId={selectedProjectId}
                      studioContextLabel="GKE Kubernetes Fleet · Pre-Flight Quota & .tf Export"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'VM_SSH' && (
                <div className="space-y-4">
                  <EnterpriseStackPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    overview={overview}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                  />
                  <VmFleetAndSsh
                    projectId={selectedProjectId}
                    account={contextData.account}
                    onOpenProvisionVm={() => handleOpenProvision('COMPUTE_VM')}
                    refreshTrigger={vmRefreshTrigger}
                    onVmDeleted={() => fetchProjectOverview(selectedProjectId)}
                    onRunInShell={handleRunInShell}
                    onSelectTab={handleNavigateStudioTab}
                    onShowToast={showToast}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="VM"
                    onRunInShell={handleRunInShell}
                    onRefreshParent={() => {
                      fetchProjectOverview(selectedProjectId);
                      setVmRefreshTrigger((c) => c + 1);
                    }}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="CLOUD_ENG"
                    projectId={selectedProjectId}
                    studioContextLabel="Compute Engine VM Fleet · Pre-Flight, .tf Export & Undo Saga"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'VPC_NETWORKS' && (
                <div className="space-y-4">
                  <EnterpriseStackPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    overview={overview}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                  />
                  <VpcNetworksAndFirewalls
                    projectId={selectedProjectId}
                    vpcs={overview?.vpcs || []}
                    firewalls={overview?.firewalls || []}
                    initialRuleSeed={vpcStudioRuleSeed}
                    onOpenProvisionVpc={() => handleOpenProvision('VPC_NETWORK')}
                    onOpenProvisionFirewall={() =>
                      handleOpenProvision('VPC_FIREWALL')
                    }
                    onTestOnGlobalMap={handleTestRuleOnGlobalMap}
                    onOpenLogsExplorer={handleOpenInLogsExplorer}
                    onOpenCloudSoc={handleOpenInCloudSoc}
                    onDeleteResource={handleDeleteResource}
                    onRefresh={() => fetchProjectOverview(selectedProjectId)}
                    loading={loadingOverview}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                    onSelectTab={handleNavigateStudioTab}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="VPC"
                    onRunInShell={handleRunInShell}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <PersonaContextualHelper
                    persona="NETOPS"
                    projectId={selectedProjectId}
                    studioContextLabel="VPC & Firewall Studio · 4-Hop Packet Tracer & IPAM CIDR Guard"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'FINOPS' && (
                <div className="space-y-6">
                  <BillingAccountCreditGuardian
                    projectId={selectedProjectId}
                    liveBurn={liveBurn}
                    gdePrivacyConfig={gdePrivacyConfig}
                    onOpenBigQuerySql={(sqlText) => {
                      if (sqlText) setBigQueryInitialSql(sqlText);
                      setActiveTab('BIGQUERY_STUDIO');
                    }}
                    onOpenProvision={handleOpenProvision}
                    onOpenSecretManagerStudio={() => {
                      setSovereignSubTab('SECRETS_KMS_WAF');
                      setActiveTab('SOVEREIGN_STUDIO');
                    }}
                    onOpenEmergencyKillSwitch={() => {
                      setActiveTab('OVERVIEW');
                      setTimeout(() => {
                        document
                          .getElementById('emergency-api-killswitch-section')
                          ?.scrollIntoView({ behavior: 'smooth' });
                      }, 150);
                    }}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onGrantsSummaryChange={setGdeSummary}
                  />
                  <SortableKpiRow
                    summary={overview?.summary}
                    fetchLatencyMs={overview?.fetchLatencyMs}
                    isSyncing={loadingOverview}
                    onRefreshOverview={() =>
                      fetchProjectOverview(selectedProjectId, { force: true })
                    }
                    onNavigateTab={(tabId) => setActiveTab(tabId)}
                    onScrollToApis={() => {
                      const scrollNow = () => {
                        const el = document.getElementById(
                          'emergency-api-killswitch-section'
                        );
                        if (el) {
                          el.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }
                      };
                      if (activeTab !== 'OVERVIEW') {
                        setActiveTab('OVERVIEW');
                        setTimeout(scrollNow, 120);
                      } else {
                        scrollNow();
                      }
                    }}
                  />
                  <TelemetryCharts
                    telemetry={overview?.telemetry}
                    projectId={selectedProjectId}
                    onOpenCopilot={handleOpenCopilotWithPrompt}
                    onSelectTab={(tabId) => setActiveTab(tabId)}
                  />
                  <StudioGcpAdvantageBar
                    projectId={selectedProjectId}
                    studioDomain="GKE_FINOPS"
                    onRunInShell={handleRunInShell}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId)
                    }
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <PersonaContextualHelper
                      persona="FINOPS_ENG"
                      projectId={selectedProjectId}
                      studioContextLabel="FinOps & GreenOps · Unit Cost ($/1k req), Zombie Reaper & 98% CFE"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                    <PersonaContextualHelper
                      persona="ARCHITECT"
                      projectId={selectedProjectId}
                      studioContextLabel="FinOps Studio · 3-Cloud Arbitrage (GCP vs AWS vs Azure) & Guardrails"
                      defaultExpanded={false}
                      onOpenFullBoard={(p) =>
                        handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                      }
                      onRunInShell={handleRunInShell}
                      onShowToast={showToast}
                      onShowError={setErrorBanner}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'LOGS_SHELL' && (
                <div className="space-y-4">
                  <LogStreamerAndShell
                    logs={overview?.logs || []}
                    projectId={selectedProjectId}
                    account={contextData.account}
                    initialCommand={shellSeedCommand}
                    initialLogExplorerSpec={logExplorerSeedSpec}
                    onRefreshLogs={() => fetchProjectOverview(selectedProjectId, { force: true })}
                    onAskCopilot={handleOpenCopilotWithPrompt}
                    onOpenRecycleBin={() => setActiveTab('RECYCLE_BIN')}
                  />
                  <PersonaContextualHelper
                    persona="SRE_ONCALL"
                    projectId={selectedProjectId}
                    studioContextLabel="Logs & Cloud Shell · Golden-Signal Change Correlator & SLO Burn Gate"
                    defaultExpanded={false}
                    onOpenFullBoard={(p) =>
                      handleNavigateStudioTab('INNOVATION_LAB', `FIVE_PERSONA_${p}`)
                    }
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                  />
                </div>
              )}

              {activeTab === 'RECYCLE_BIN' && (
                <div className="space-y-4">
                  <EnterpriseStackPipelineBar
                    projectId={selectedProjectId}
                    activeTab={activeTab}
                    overview={overview}
                    onOpenProvision={handleOpenProvision}
                    onSelectTab={handleNavigateStudioTab}
                    onRunInShell={handleRunInShell}
                  />
                  <CloudRecycleBinStudio
                    projectId={selectedProjectId}
                    initialCategory={recycleBinCategory}
                    onRunInShell={handleRunInShell}
                    onShowToast={showToast}
                    onShowError={setErrorBanner}
                    onRefreshParent={() =>
                      fetchProjectOverview(selectedProjectId, { force: true })
                    }
                  />
                </div>
              )}

              {activeTab === 'AWS_AZURE_PARITY' && (
                <AwsAzureEnvySuiteStudio
                  key="aws-azure-parity"
                  cloudFamily="AWS_AZURE"
                  initialTab={awsAzureSubTab}
                  projectId={selectedProjectId}
                  onSwitchCloudFamily={(family) =>
                    setActiveTab(
                      family === 'ALIBABA_HUAWEI'
                        ? 'ALIBABA_HUAWEI_PARITY'
                        : 'AWS_AZURE_PARITY'
                    )
                  }
                  onNavigateToGcpTab={handleNavigateStudioTab}
                  onOpenHealthAndDrift={() => setCopilotOpen(true)}
                  onRunInShell={handleRunInShell}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'ALIBABA_HUAWEI_PARITY' && (
                <AwsAzureEnvySuiteStudio
                  key="alibaba-huawei-parity"
                  cloudFamily="ALIBABA_HUAWEI"
                  initialTab={alibabaHuaweiSubTab}
                  projectId={selectedProjectId}
                  onSwitchCloudFamily={(family) =>
                    setActiveTab(
                      family === 'ALIBABA_HUAWEI'
                        ? 'ALIBABA_HUAWEI_PARITY'
                        : 'AWS_AZURE_PARITY'
                    )
                  }
                  onNavigateToGcpTab={handleNavigateStudioTab}
                  onOpenHealthAndDrift={() => setCopilotOpen(true)}
                  onRunInShell={handleRunInShell}
                  onShowToast={showToast}
                  onShowError={setErrorBanner}
                />
              )}

              {activeTab === 'CLOUD_SOC' && (
                <AutonomousCloudSocStudio
                  projectId={selectedProjectId}
                  initialSocSeed={cloudSocSeed}
                  onClearSocSeed={() => setCloudSocSeed(null)}
                  onOpenVpcFirewallStudio={handleOpenInVpcFirewallStudio}
                  onRunInShell={handleRunInShell}
                  onOpenHealthAndDrift={() => setCopilotOpen(true)}
                  onNavigateTab={handleNavigateStudioTab}
                  onRefreshGlobal={() => {
                    fetchProjectOverview(selectedProjectId, { force: true });
                    setVmRefreshTrigger((c) => c + 1);
                  }}
                />
              )}

              {activeTab === 'DOCS_GUIDE' && (
                <InteractiveDocsGuide
                  onNavigateToFeature={handleNavigateStudioTab}
                  onOpenCommandPalette={() => setCommandPaletteOpen(true)}
                />
              )}
          </>
        </main>

        <div
          className={`${
            mobilePreview
              ? 'sticky bottom-0'
              : 'fixed bottom-0 left-0 right-0 md:hidden'
          } z-40 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-around`}
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                title={tab.tip}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projectId={selectedProjectId}
        overview={{
          ...overview,
          cloudRun: overview?.cloudRunServices || [],
        }}
        vms={(overview?.resources || []).filter(
          (r) => r.type === 'Compute Engine VM'
        )}
        onSelectTab={(tabId, subTab) => {
          if (subTab) setInnovationSubTab(subTab);
          setActiveTab(tabId);
        }}
        onOpenCreateModal={(type) => {
          if (type === 'CLOUD_RUN') handleOpenProvision('CLOUD_RUN');
          else if (type === 'GKE_CLUSTER') handleOpenProvision('GKE_CLUSTER');
          else if (type === 'CLOUD_SQL') handleOpenProvision('CLOUD_SQL');
          else if (type === 'BIGQUERY_DATASET')
            handleOpenProvision('BIGQUERY_DATASET');
          else if (type === 'VM' || type === 'COMPUTE_VM')
            handleOpenProvision('COMPUTE_VM');
          else if (type === 'VPC_NETWORK') handleOpenProvision('VPC_NETWORK');
          else if (type === 'VPC_FIREWALL') handleOpenProvision('VPC_FIREWALL');
          else if (type === 'BUCKET' || type === 'GCS_BUCKET')
            handleOpenProvision('GCS_BUCKET');
          else if (type === 'API') setActiveTab('OVERVIEW');
          else handleOpenProvision(type || 'GCS_BUCKET');
        }}
        onOpenKillSwitch={() => setActiveTab('OVERVIEW')}
        onOpenCopilot={() => handleOpenCopilotWithPrompt('')}
        onToggleGdeMode={() => {
          setGdePrivacyConfig((prev) => {
            const next = { ...prev, enabled: !prev.enabled };
            try {
              localStorage.setItem(
                'cloudpulse_gde_tutorial_mode_v1',
                JSON.stringify(next)
              );
            } catch {
              // ignore
            }
            showToast(
              next.enabled
                ? 'GDE Tutorial Privacy Shield ENABLED — Emails, Billing IDs & Public IPs are now masked for screen recording.'
                : 'GDE Tutorial Privacy Shield disabled.'
            );
            return next;
          });
        }}
        onRefreshAll={() => {
          fetchProjectOverview(selectedProjectId);
          setVmRefreshTrigger((c) => c + 1);
        }}
      />

      <ResourceProvisionModal
        isOpen={provisionOpen}
        onClose={() => setProvisionOpen(false)}
        projectId={selectedProjectId}
        initialServiceType={provisionInitialService}
        initialLocation={provisionInitialLocation}
        onProvisionSuccess={handleProvisionSuccess}
      />

      <CloudRunDeployModal
        isOpen={cloudRunModalOpen}
        onClose={() => setCloudRunModalOpen(false)}
        projectId={selectedProjectId}
      />

      <GeminiCopilotModal
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        projectId={selectedProjectId}
        overview={overview}
        liveBurn={liveBurn}
        gdeSummary={gdeSummary}
        onDeleteResource={handleDeleteResource}
        onSwitchProject={(nextProjId) => {
          if (nextProjId) {
            sessionStorage.setItem('cloudpulse_project_explicit', 'true');
            setSelectedProjectId(nextProjId);
          }
        }}
        onRefresh={() => {
          fetchProjectOverview(selectedProjectId, { force: true });
          setVmRefreshTrigger((c) => c + 1);
        }}
        onSelectTab={handleNavigateStudioTab}
        onShowToast={showToast}
      />

      <MandatoryDeleteConfirmationModal
        activeItem={pendingDeleteQueue[0] || null}
        queueLength={pendingDeleteQueue.length}
        overview={overview}
        onConfirm={() => {
          const current = pendingDeleteQueue[0];
          setPendingDeleteQueue((prev) => prev.slice(1));
          if (current?.onConfirm) current.onConfirm();
        }}
        onCancel={() => {
          const current = pendingDeleteQueue[0];
          setPendingDeleteQueue((prev) => prev.slice(1));
          if (current?.onCancel) current.onCancel();
        }}
      />

      <GlobalInnovationHoverExplainer />
    </div>
  );
}

/**
 * MandatoryDeleteConfirmationModal:
 * High-visibility Zero-Trust Safety Gatekeeper that intercepts every destructive
 * DELETE or teardown action across all 16 CloudPulse 2026 studios and requires
 * explicit human confirmation before any request reaches Google Cloud.
 */
function MandatoryDeleteConfirmationModal({
  activeItem,
  queueLength = 0,
  overview = null,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!activeItem) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeItem, onCancel]);

  if (!activeItem || !activeItem.descriptor) return null;
  const {
    gateType,
    releaseTrack = 'GA',
    title,
    headerBadge,
    targetLabel,
    resourceKind,
    targetName,
    location,
    projectId,
    method,
    endpoint,
    confirmLabel,
    whatHappensNext,
    costWarning,
    impactWarning,
  } = activeItem.descriptor;

  const isOneTapAction = gateType === 'ONE_TAP_CLOUD_ACTION';
  const normalizedTrack = String(releaseTrack || 'GA').toUpperCase();

  // Compute live dependency blast radius from project overview state
  const blastRadiusItems = [];
  const vms = overview?.compute?.vms || overview?.vms || [];
  const runServices = overview?.cloudRun?.services || overview?.cloudRunServices || [];
  const cleanTarget = String(targetName || '')
    .split(' ')[0]
    .split('@')[0]
    .trim();

  if (String(resourceKind || '').includes('Secret Manager')) {
    blastRadiusItems.push(
      `Secret payload "${cleanTarget}" will NEVER revert to plaintext — encrypted bytes are permanently erased.`
    );
    const matchingRun = runServices.filter((svc) =>
      JSON.stringify(svc || {}).includes(cleanTarget)
    );
    if (matchingRun.length > 0) {
      blastRadiusItems.push(
        `${matchingRun.length} Cloud Run service(s) (${matchingRun
          .map((s) => s.name)
          .join(', ')}) reference "${cleanTarget}" and will fail to start until healed!`
      );
    } else if (runServices.length > 0) {
      blastRadiusItems.push(
        `Scanned ${runServices.length} live Cloud Run service(s) in project "${projectId}" — verify no container mounts secretKeyRef "${cleanTarget}".`
      );
    }
  } else if (String(resourceKind || '').includes('VPC')) {
    const attachedVms = vms.filter((vm) =>
      String(vm.network || 'default').includes(cleanTarget)
    );
    if (attachedVms.length > 0) {
      blastRadiusItems.push(
        `${attachedVms.length} live Compute VM(s) (${attachedVms
          .map((v) => v.name)
          .join(', ')}) are attached to VPC "${cleanTarget}".`
      );
    } else {
      blastRadiusItems.push(
        `Scanned ${vms.length} Compute VM(s) — zero active VM NICs blocking VPC teardown.`
      );
    }
  } else if (String(resourceKind || '').includes('Compute Engine')) {
    const matchedVm = vms.find((v) => v.name === cleanTarget);
    if (matchedVm) {
      blastRadiusItems.push(
        `Live VM State: ${matchedVm.status || 'RUNNING'} · Machine: ${
          matchedVm.machineType || 'unknown'
        } · External IP: ${matchedVm.externalIp || 'None (Internal Only)'}`
      );
    }
  } else if (String(resourceKind || '').includes('Cloud Run')) {
    const matchedRun = runServices.find((s) => s.name === cleanTarget);
    if (matchedRun?.uri) {
      blastRadiusItems.push(
        `Live HTTPS Traffic Endpoint ${matchedRun.uri} ${
          isOneTapAction
            ? 'will receive this live configuration / traffic update.'
            : 'will immediately return 404.'
        }`
      );
    }
  }

  const effectiveWhatHappens =
    whatHappensNext ||
    impactWarning ||
    `This operation executes a live Google Cloud API call (${method}) against "${targetName}" in project "${projectId}".`;

  const parsedExecutionSteps = String(effectiveWhatHappens || '')
    .split(/\n+|(?=\b[1-9]\.\s)/)
    .map((line) => line.replace(/^[0-9]+\.\s*/, '').trim())
    .filter(Boolean);

  const showSeparateImpactBox =
    Boolean(impactWarning) &&
    Boolean(whatHappensNext) &&
    String(impactWarning).trim() !== String(whatHappensNext).trim();

  const effectiveCostWarning =
    costWarning ||
    (isOneTapAction
      ? `BILLING & COST NOTICE: Modifying or provisioning live Google Cloud resources can trigger hourly compute/network billing ($/hr), persistent storage/snapshot fees ($/GB-mo), or Cloud Build / API invocation charges on project "${projectId}".`
      : `BILLING & TEARDOWN NOTICE: Deleting "${targetName}" terminates its active hourly runtime billing, but verify whether detached persistent disks, static external IPv4 addresses ($0.01/hr when unattached), or Cloud Storage snapshots remain billed in project "${projectId}".`);

  return (
    <div
      className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className={`w-full max-w-xl rounded-2xl bg-white dark:bg-[#202124] border-2 ${
          isOneTapAction
            ? 'border-amber-500/80 shadow-2xl shadow-amber-950/50'
            : 'border-red-500/80 shadow-2xl shadow-red-950/50'
        } overflow-hidden max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hazard / Cost Gatekeeper Header */}
        <div
          className={`bg-zinc-50 dark:bg-zinc-900 dark:bg-zinc-950 border-b ${
            isOneTapAction ? 'border-amber-500/40' : 'border-red-500/40'
          } px-5 py-3.5 flex items-center justify-between gap-3 text-white shrink-0`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                isOneTapAction
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  {headerBadge ||
                    (isOneTapAction
                      ? 'CloudPulse 2026 1-Tap Cloud Action & Cost Gatekeeper'
                      : 'CloudPulse 2026 Destructive Action Gatekeeper')}
                </span>
                {normalizedTrack === 'ALPHA' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">
                    [ALPHA · EARLY ACCESS]
                  </span>
                )}
                {normalizedTrack === 'BETA' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                    [BETA · PUBLIC PREVIEW]
                  </span>
                )}
                {normalizedTrack === 'GA' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                    [GA · LIVE GCP API]
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-extrabold tracking-tight truncate">
                {title}
              </h3>
            </div>
          </div>
          {queueLength > 1 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/30 border border-white/20 shrink-0">
              1 of {queueLength} queued
            </span>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-3.5 overflow-y-auto">
          {/* Resource Target Summary Card */}
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              isOneTapAction
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isOneTapAction
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {targetLabel ||
                  (isOneTapAction
                    ? 'Target Cloud Resource & 1-Tap Operation'
                    : 'Target Resource to Destroy')}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold text-white ${
                  isOneTapAction ? 'bg-amber-600' : 'bg-red-600'
                }`}
              >
                {method}
              </span>
            </div>
            <div className="text-sm sm:text-base font-mono font-extrabold text-zinc-950 dark:text-white break-all">
              {targetName}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[9px] uppercase text-zinc-400">
                  Resource Kind
                </div>
                <div className="font-bold truncate">{resourceKind}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[9px] uppercase text-zinc-400">
                  Location / Scope
                </div>
                <div className="font-bold truncate">{location}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800">
                <div className="text-[9px] uppercase text-zinc-400">
                  GCP Project
                </div>
                <div className="font-bold truncate">{projectId}</div>
              </div>
            </div>
          </div>

          {/* 1. What Happens Next (Step-by-Step Cloud Execution) */}
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-2">
            <div className="font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[10px] font-mono flex items-center justify-between gap-2">
              <span>1. What Happens Next (Live Cloud Execution Sequence)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30">
                PRE-EXECUTION PREVIEW
              </span>
            </div>
            {parsedExecutionSteps.length > 1 ? (
              <div className="space-y-1.5">
                {parsedExecutionSteps.map((stepText, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-lg bg-white/75 dark:bg-zinc-900/80 border border-blue-500/20"
                  >
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30 shrink-0 mt-0.5">
                      STEP 0{idx + 1}
                    </span>
                    <span className="font-medium text-[11px] sm:text-xs break-words">
                      {stepText}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-medium">{effectiveWhatHappens}</p>
            )}
            {showSeparateImpactBox && (
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/25 text-[11px] font-medium text-blue-950 dark:text-blue-200">
                <span className="font-mono font-extrabold uppercase text-[9px] tracking-wider text-blue-600 dark:text-blue-400 mr-1.5">
                  Operational Impact:
                </span>
                {impactWarning}
              </div>
            )}
            <div className="text-[10px] font-mono text-zinc-500 truncate pt-0.5">
              Control-Plane Route: {endpoint}
            </div>
          </div>

          {/* 2. Cloud Billing & Cost Impact Warning */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-1.5">
            <div className="font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[10px] font-mono flex items-center justify-between gap-2">
              <span>2. Google Cloud Billing & Cost Impact Warning</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40">
                FINOPS GUARDRAIL
              </span>
            </div>
            <p className="font-medium">{effectiveCostWarning}</p>
          </div>

          {/* Live Dependency & Blast-Radius Pre-Flight Scan */}
          {blastRadiusItems.length > 0 && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 space-y-1">
              <div className="font-extrabold text-blue-600 dark:text-blue-400">
                Live Dependency & Blast-Radius Pre-Flight Scan
              </div>
              <ul className="list-disc pl-4 space-y-0.5">
                {blastRadiusItems.map((msg, idx) => (
                  <li key={idx}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-md text-xs font-mono font-extrabold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              Cancel (Do Not Execute) [Esc]
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2.5 rounded-md text-xs font-mono font-extrabold text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                isOneTapAction
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
              }`}
            >
              <span>
                {confirmLabel ||
                  (isOneTapAction
                    ? 'Acknowledge Cost & Execute 1-Tap Action'
                    : 'Confirm & Permanently Delete')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <TimezoneProvider>
        <CloudPulseCockpit />
      </TimezoneProvider>
    </ThemeProvider>
  );
}
