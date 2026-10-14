import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  FolderKanban,
  Flame,
  ShieldCheck,
  Link2,
  Globe,
  RefreshCw,
  Plus,
  Trash2,
  Moon,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Copy,
  ExternalLink,
  Terminal,
  Sparkles,
  UserCheck,
  Save,
  Play,
  Search,
  Rocket,
  FileText,
  Clock,
  Layers,
  TrendingDown,
  GitBranch,
  KeyRound,
  Code2,
  RotateCcw,
} from 'lucide-react';

export default function AwsAzureEnvySuiteStudio({
  projectId,
  onShowToast,
  onShowError,
}) {
  const [activeSubTab, setActiveSubTab] = useState('RESOURCE_GROUPS');
  const [loading, setLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState('');
  const [data, setData] = useState(null);

  // Module 1: Azure-Style Resource Groups state
  const [newRgSlug, setNewRgSlug] = useState('');
  const [newRgDesc, setNewRgDesc] = useState('');
  const [newRgEnv, setNewRgEnv] = useState('dev');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [deletingGroupSlugs, setDeletingGroupSlugs] = useState({});
  const [hibernatingGroupSlugs, setHibernatingGroupSlugs] = useState({});
  const [cascadeDeleteGcp, setCascadeDeleteGcp] = useState(false);

  // Module 2: Hard-Spend Stop-Loss Fuse state
  const [fuseBudgetUsd, setFuseBudgetUsd] = useState(50);
  const [fuseSoftPct, setFuseSoftPct] = useState(80);
  const [fuseParkPct, setFuseParkPct] = useState(95);
  const [fuseHardPct, setFuseHardPct] = useState(100);
  const [autoCapRun, setAutoCapRun] = useState(true);
  const [autoStopVms, setAutoStopVms] = useState(true);

  // Module 3: AWS IAM Policy Simulator state
  const [selectedPrincipalKey, setSelectedPrincipalKey] = useState('');
  const [simResult, setSimResult] = useState(null);
  const [impersonatingBannerPrincipal, setImpersonatingBannerPrincipal] =
    useState('');

  // Module 4: Azure SAS / AWS S3 Presigned URL & Browser Upload state
  const [selectedBucket, setSelectedBucket] = useState('');
  const [bucketObjects, setBucketObjects] = useState([]);
  const [loadingObjects, setLoadingObjects] = useState(false);
  const [uploadObjectName, setUploadObjectName] = useState('demo-artifact.txt');
  const [uploadTextContent, setUploadTextContent] = useState(
    'Hello from CloudPulse 2026 Browser Upload & SAS Presigned Studio!'
  );
  const [uploadBase64, setUploadBase64] = useState(null);
  const [uploadContentType, setUploadContentType] = useState(
    'text/plain; charset=utf-8'
  );
  const [sasDurationSec, setSasDurationSec] = useState(3600);
  const [sasMethod] = useState('GET');
  const [generatedSasResult, setGeneratedSasResult] = useState(null);

  // Module 5: 1-Screen Global HTTPS Load Balancer Wizard state
  const [lbStackName, setLbStackName] = useState('cloudpulse-global-edge');
  const [lbDomainName, setLbDomainName] = useState('api.example.com');
  const [lbTargetRunService, setLbTargetRunService] = useState('');
  const [lbTargetRegion, setLbTargetRegion] = useState('us-central1');
  const [lbEnableArmor, setLbEnableArmor] = useState(true);
  const [lbRateLimitRpm, setLbRateLimitRpm] = useState(600);
  const [lbReceipt, setLbReceipt] = useState(null);

  // Module 6: CloudFormation / Azure ARM Stacks & Drift Remediator state
  const [newStackName, setNewStackName] = useState('stack-checkout-v2');
  const [newStackRg, setNewStackRg] = useState('rg-production-core');
  const [newStackVersion, setNewStackVersion] = useState('v2.0.0');
  const [newStackDesc, setNewStackDesc] = useState('');
  const [selectedIacFormat, setSelectedIacFormat] = useState('TERRAFORM');

  // Module 7: Cost Explorer & CUD Arbitrage receipt state
  const [finopsReceipt, setFinopsReceipt] = useState(null);

  // Module 8: AWS Systems Manager (SSM) Fleet Run Command state
  const [selectedSsmDocId, setSelectedSsmDocId] = useState(
    'GCP-RunRollingRestart'
  );
  const [ssmCustomCommand, setSsmCustomCommand] = useState(
    'df -h && free -m && uname -a'
  );
  const [selectedSsmTargets, setSelectedSsmTargets] = useState([]);

  // Module 9: AWS EventBridge Pipes / Azure Logic Apps Event Router state
  const [newPipeId, setNewPipeId] = useState('pipe-audit-to-cloudrun');
  const [newPipeSourceType, setNewPipeSourceType] = useState(
    'GCS_BUCKET_FINALIZE'
  );
  const [newPipeSourceRes, setNewPipeSourceRes] = useState('');
  const [newPipeFilter, setNewPipeFilter] = useState(
    '{"contentType":["application/json","text/csv"]}'
  );
  const [newPipeTransform, setNewPipeTransform] = useState(
    '{"eventId":"$.id","bucket":"$.bucket","object":"$.name"}'
  );
  const [newPipeTargetType, setNewPipeTargetType] =
    useState('CLOUD_RUN_SERVICE');
  const [newPipeTargetRes, setNewPipeTargetRes] = useState('');

  // Module 10: AWS Secrets Manager / Azure Key Vault Auto-Rotation state
  const [rotateSecretName, setRotateSecretName] = useState('PROD_DATABASE_URL');
  const [rotateDays, setRotateDays] = useState(30);
  const [rotateCustomPayload, setRotateCustomPayload] = useState('');

  const fetchOverview = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/overview`
      );
      const payload = res.data;
      setData(payload);

      if (payload?.spendFuse) {
        setFuseBudgetUsd(payload.spendFuse.monthlyBudgetUsd ?? 50);
        setFuseSoftPct(payload.spendFuse.softBrakePct ?? 80);
        setFuseParkPct(payload.spendFuse.parkComputePct ?? 95);
        setFuseHardPct(payload.spendFuse.hardFusePct ?? 100);
        setAutoCapRun(Boolean(payload.spendFuse.autoCapCloudRunMaxInstances));
        setAutoStopVms(Boolean(payload.spendFuse.autoStopRunningVms));
      }

      const principals = payload?.iamSimulator?.principals || [];
      if (principals.length > 0 && !selectedPrincipalKey) {
        setSelectedPrincipalKey(principals[0].memberKey);
      }

      const buckets = payload?.storageStudio?.buckets || [];
      if (buckets.length > 0 && !selectedBucket) {
        setSelectedBucket(buckets[0].name);
      }
      if (buckets.length > 0 && !newPipeSourceRes) {
        setNewPipeSourceRes(`gs://${buckets[0].name}`);
      }

      const runServices = (payload?.unifiedResources || []).filter(
        (r) => r.type === 'CLOUD_RUN'
      );
      if (runServices.length > 0 && !lbTargetRunService) {
        setLbTargetRunService(runServices[0].name);
        setLbTargetRegion(runServices[0].location || 'us-central1');
      }
      if (runServices.length > 0 && !newPipeTargetRes) {
        setNewPipeTargetRes(runServices[0].name);
      }

      const fleetTargets = payload?.ssmFleet?.targets || [];
      if (fleetTargets.length > 0 && selectedSsmTargets.length === 0) {
        setSelectedSsmTargets(fleetTargets.slice(0, 2).map((t) => t.id));
      }
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to load AWS & Azure Parity Suite.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    projectId,
    selectedPrincipalKey,
    selectedBucket,
    lbTargetRunService,
    newPipeSourceRes,
    newPipeTargetRes,
    selectedSsmTargets.length,
    onShowError,
  ]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Fetch bucket objects when selectedBucket changes
  const fetchBucketObjects = useCallback(
    async (bucketName) => {
      if (!projectId || !bucketName) return;
      setLoadingObjects(true);
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
          {
            action: 'LIST_BUCKET_OBJECTS',
            bucket: bucketName,
          }
        );
        setBucketObjects(res.data?.objects || []);
      } catch {
        setBucketObjects([]);
      } finally {
        setLoadingObjects(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    if (selectedBucket && activeSubTab === 'SAS_PRESIGNED') {
      fetchBucketObjects(selectedBucket);
    }
  }, [selectedBucket, activeSubTab, fetchBucketObjects]);

  const toggleMemberSelection = (resId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(resId) ? prev.filter((x) => x !== resId) : [...prev, resId]
    );
  };

  // Module 1 handlers
  const handleUpsertResourceGroup = async (e) => {
    e?.preventDefault();
    if (!newRgSlug.trim()) return;
    setActionBusy('UPSERT_RG');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'UPSERT_RESOURCE_GROUP',
          slug: newRgSlug.trim(),
          displayName: newRgSlug.trim(),
          description: newRgDesc.trim(),
          environment: newRgEnv,
          memberIds: selectedMemberIds,
        }
      );
      onShowToast?.(res.data?.message || 'Resource Group saved.');
      setNewRgSlug('');
      setNewRgDesc('');
      setSelectedMemberIds([]);
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to save Resource Group.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleHibernateGroup = async (grp) => {
    const memberIds = (grp.members || []).map((m) => m.id);
    setHibernatingGroupSlugs((prev) => ({ ...prev, [grp.slug]: true }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'HIBERNATE_RESOURCE_GROUP',
          slug: grp.slug,
          memberIds,
        }
      );
      onShowToast?.(res.data?.message || `Hibernated ${grp.slug}`);
      await fetchOverview();
    } catch (err) {
      if (err?.message === 'ACTION_CANCELLED_BY_USER') return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to hibernate Resource Group.'
      );
    } finally {
      setHibernatingGroupSlugs((prev) => ({ ...prev, [grp.slug]: false }));
    }
  };

  const handleDeleteGroup = async (grp, deleteUnderlying) => {
    const memberIds = (grp.members || []).map((m) => m.id);
    setDeletingGroupSlugs((prev) => ({ ...prev, [grp.slug]: true }));
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'DELETE_RESOURCE_GROUP',
          slug: grp.slug,
          deleteGcpResources: Boolean(deleteUnderlying),
          memberIds,
        }
      );
      onShowToast?.(res.data?.message || `Deleted Resource Group ${grp.slug}`);
      await fetchOverview();
    } catch (err) {
      setDeletingGroupSlugs((prev) => ({ ...prev, [grp.slug]: false }));
      if (err?.message === 'ACTION_CANCELLED_BY_USER') return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to delete Resource Group.'
      );
    }
  };

  // Module 2 handlers
  const handleSaveSpendFuse = async () => {
    setActionBusy('SAVE_FUSE');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'SAVE_SPEND_FUSE_CONFIG',
          enabled: true,
          monthlyBudgetUsd: Number(fuseBudgetUsd),
          softBrakePct: Number(fuseSoftPct),
          parkComputePct: Number(fuseParkPct),
          hardFusePct: Number(fuseHardPct),
          autoCapCloudRunMaxInstances: autoCapRun,
          autoStopRunningVms: autoStopVms,
        }
      );
      onShowToast?.(res.data?.message || 'Hard-Spend Fuse armed.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Failed to save Spend Fuse.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleExecuteSpendFuse = async (fuseLevel) => {
    setActionBusy(`FUSE_${fuseLevel}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'EXECUTE_SPEND_FUSE',
          fuseLevel,
        }
      );
      onShowToast?.(res.data?.message || `Executed ${fuseLevel}`);
      await fetchOverview();
    } catch (err) {
      if (err?.message === 'ACTION_CANCELLED_BY_USER') return;
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to execute Spend Fuse action.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 3 handlers
  const handleRunIamSimulation = useCallback(
    async (principalKeyToTest) => {
      const targetKey = principalKeyToTest || selectedPrincipalKey;
      if (!targetKey) return;
      setActionBusy('IAM_SIM');
      try {
        const res = await axios.post(
          `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
          {
            action: 'SIMULATE_IAM_POLICY',
            memberKey: targetKey,
          }
        );
        setSimResult(res.data);
      } catch (err) {
        onShowError?.(
          err.response?.data?.error ||
            err.message ||
            'Failed to run IAM Policy Simulator.'
        );
      } finally {
        setActionBusy('');
      }
    },
    [projectId, selectedPrincipalKey, onShowError]
  );

  useEffect(() => {
    if (activeSubTab === 'IAM_SIMULATOR' && selectedPrincipalKey && !simResult) {
      handleRunIamSimulation(selectedPrincipalKey);
    }
  }, [activeSubTab, selectedPrincipalKey, simResult, handleRunIamSimulation]);

  const handleGrantMissingRole = async (role) => {
    if (!selectedPrincipalKey || !role) return;
    setActionBusy(`GRANT_${role}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'GRANT_SIMULATOR_ROLE',
          memberKey: selectedPrincipalKey,
          role,
        }
      );
      onShowToast?.(res.data?.message || `Granted ${role}`);
      await handleRunIamSimulation(selectedPrincipalKey);
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Failed to grant IAM role.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 4 handlers
  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadObjectName(file.name);
    setUploadContentType(file.type || 'application/octet-stream');
    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = String(reader.result || '');
      const base64Part = resultStr.includes(',')
        ? resultStr.split(',')[1]
        : resultStr;
      setUploadBase64(base64Part);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadObject = async (e) => {
    e?.preventDefault();
    if (!selectedBucket || !uploadObjectName.trim()) return;
    setActionBusy('UPLOAD_OBJ');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'UPLOAD_BUCKET_OBJECT',
          bucket: selectedBucket,
          objectName: uploadObjectName.trim(),
          contentType: uploadContentType,
          base64Data: uploadBase64 || undefined,
          textContent: uploadBase64 ? undefined : uploadTextContent,
        }
      );
      onShowToast?.(res.data?.message || 'Uploaded object to Cloud Storage.');
      setUploadBase64(null);
      await fetchBucketObjects(selectedBucket);
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to upload object to Cloud Storage.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleGeneratePresignedUrl = async (objectName) => {
    if (!selectedBucket || !objectName) return;
    setActionBusy(`SAS_${objectName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'GENERATE_PRESIGNED_URL',
          bucket: selectedBucket,
          objectName,
          method: sasMethod,
          durationSec: Number(sasDurationSec),
        }
      );
      setGeneratedSasResult(res.data);
      onShowToast?.(res.data?.message || 'Generated Presigned / SAS URL.');
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to generate Presigned URL.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 5 handlers
  const handleProvisionGlobalLb = async (e) => {
    e?.preventDefault();
    setActionBusy('PROVISION_LB');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'PROVISION_GLOBAL_LB_STACK',
          stackName: lbStackName,
          domainName: lbDomainName,
          targetRegion: lbTargetRegion,
          targetCloudRunService: lbTargetRunService,
          enableCloudArmor: lbEnableArmor,
          rateLimitRpm: Number(lbRateLimitRpm),
        }
      );
      setLbReceipt(res.data);
      onShowToast?.(res.data?.message || 'Provisioned Global HTTPS Load Balancer.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to run Global Load Balancer Wizard.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 6 handlers: CloudFormation / Azure ARM Stacks & Drift
  const handleSnapshotArmStack = async (e) => {
    e?.preventDefault();
    if (!newStackName.trim()) return;
    setActionBusy('SNAPSHOT_STACK');
    try {
      const rg = (data?.resourceGroups || []).find(
        (g) => g.slug === newStackRg
      );
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'SNAPSHOT_ARM_STACK',
          stackName: newStackName.trim(),
          resourceGroup: newStackRg,
          version: newStackVersion.trim() || 'v1.0.0',
          description: newStackDesc.trim(),
          snapshotResources: rg?.members || (data?.unifiedResources || []).slice(0, 6),
        }
      );
      onShowToast?.(res.data?.message || 'Stack snapshot created.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Failed to snapshot stack.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleDetectStackDrift = async (stackName) => {
    setActionBusy(`DRIFT_${stackName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'DETECT_STACK_DRIFT',
          stackName,
        }
      );
      onShowToast?.(res.data?.message || 'Drift detection complete.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Drift scan failed.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleRollbackArmStack = async (stackName) => {
    setActionBusy(`ROLLBACK_${stackName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'ROLLBACK_ARM_STACK',
          stackName,
        }
      );
      onShowToast?.(res.data?.message || 'Rolled back stack to baseline.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Stack rollback failed.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 7 handlers: Cost Explorer & CUD Arbitrage
  const handleApplyFinopsArbitrage = async (planId) => {
    setActionBusy(`FINOPS_${planId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'APPLY_FINOPS_ARBITRAGE',
          planId,
        }
      );
      setFinopsReceipt(res.data);
      onShowToast?.(res.data?.message || 'Applied FinOps Savings Plan.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to apply FinOps Savings Plan.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 8 handlers: AWS Systems Manager (SSM) Fleet Run Command
  const toggleSsmTarget = (tId) => {
    setSelectedSsmTargets((prev) =>
      prev.includes(tId) ? prev.filter((x) => x !== tId) : [...prev, tId]
    );
  };

  const handleExecuteSsmCommand = async (e) => {
    e?.preventDefault();
    if (selectedSsmTargets.length === 0) return;
    setActionBusy('SSM_EXEC');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'EXECUTE_SSM_FLEET_COMMAND',
          documentId: selectedSsmDocId,
          customCommand: ssmCustomCommand,
          targetIds: selectedSsmTargets,
        }
      );
      onShowToast?.(res.data?.message || 'Executed SSM Fleet Run Command.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to execute SSM Fleet Command.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 9 handlers: AWS EventBridge Pipes / Azure Logic Apps
  const handleProvisionEventPipe = async (e) => {
    e?.preventDefault();
    if (!newPipeId.trim()) return;
    setActionBusy('PIPE_CREATE');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'PROVISION_EVENT_PIPE',
          pipeId: newPipeId.trim(),
          sourceType: newPipeSourceType,
          sourceResource: newPipeSourceRes || `gs://${projectId}-ingest`,
          filterPattern: newPipeFilter,
          transformTemplate: newPipeTransform,
          targetType: newPipeTargetType,
          targetResource: newPipeTargetRes || 'cloudpulse-worker',
        }
      );
      onShowToast?.(res.data?.message || 'Provisioned EventBridge Pipe.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to provision EventBridge Pipe.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleTestEventPipe = async (pipeId) => {
    setActionBusy(`TEST_PIPE_${pipeId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'TEST_EVENT_PIPE',
          pipeId,
        }
      );
      onShowToast?.(res.data?.message || 'Published test event through pipe.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Failed to test Event Pipe.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleDeleteEventPipe = async (pipeId) => {
    setActionBusy(`DEL_PIPE_${pipeId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'DELETE_EVENT_PIPE',
          pipeId,
        }
      );
      onShowToast?.(res.data?.message || 'Removed EventBridge Pipe.');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to delete EventBridge Pipe.'
      );
    } finally {
      setActionBusy('');
    }
  };

  // Module 10 handlers: AWS Secrets Manager / Azure Key Vault Auto-Rotation
  const handleRotateSecretNow = async (secretNameOverride) => {
    const targetSecret = (secretNameOverride || rotateSecretName || '').trim();
    if (!targetSecret) return;
    setActionBusy(`ROTATE_${targetSecret}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'ROTATE_SECRET_NOW',
          secretName: targetSecret,
          rotationPeriodDays: Number(rotateDays || 30),
          newSecretValue: rotateCustomPayload.trim() || undefined,
        }
      );
      onShowToast?.(res.data?.message || `Rotated secret ${targetSecret}.`);
      setRotateCustomPayload('');
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error || err.message || 'Failed to rotate secret.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const handleSyncSecretEnvs = async (secretName) => {
    setActionBusy(`SYNC_${secretName}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/aws-azure-parity/action`,
        {
          action: 'SYNC_SECRET_ACROSS_ENV',
          secretName,
          targetEnvs: ['dev', 'staging', 'prod'],
        }
      );
      onShowToast?.(
        res.data?.message || `Synchronized ${secretName} across environments.`
      );
      await fetchOverview();
    } catch (err) {
      onShowError?.(
        err.response?.data?.error ||
          err.message ||
          'Failed to synchronize secret across environments.'
      );
    } finally {
      setActionBusy('');
    }
  };

  const copyText = (txt, label = 'Copied to clipboard.') => {
    navigator.clipboard?.writeText(txt);
    onShowToast?.(label);
  };

  const unifiedResources = data?.unifiedResources || [];
  const resourceGroups = data?.resourceGroups || [];
  const spendFuse = data?.spendFuse || {};
  const principals = data?.iamSimulator?.principals || [];
  const buckets = data?.storageStudio?.buckets || [];
  const armStacks = data?.armStacks || [];
  const costExplorer = data?.costExplorer || {};
  const ssmFleet = data?.ssmFleet || { targets: [], documents: [], recentExecutions: [] };
  const eventPipes = data?.eventPipes || [];
  const keyVaultSecrets = data?.keyVaultStudio?.secrets || [];
  const cloudRunServices = unifiedResources.filter(
    (r) => r.type === 'CLOUD_RUN'
  );

  return (
    <div className="space-y-6">
      {/* Active Switch-Role Impersonation Banner (if enabled in Tab 3) */}
      {impersonatingBannerPrincipal && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-extrabold text-amber-600 dark:text-amber-300">
              AWS-STYLE SWITCH ROLE PREVIEW ACTIVE:
            </span>
            <span className="text-zinc-800 dark:text-zinc-200 font-bold">
              {impersonatingBannerPrincipal}
            </span>
            <span className="text-[11px] text-zinc-500">
              (Evaluating permissions &amp; blast radius as this identity)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setImpersonatingBannerPrincipal('')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
          >
            Exit Switch-Role View
          </button>
        </div>
      )}

      {/* Studio Header Card */}
      <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-[11px] font-mono font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                INNOVATION #39 + #40 · 10-IN-1 AWS &amp; AZURE ENTERPRISE PARITY SUITE FOR GOOGLE CLOUD
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-950 dark:text-zinc-50">
              AWS &amp; Azure Parity Super-Studio for Google Cloud (Wave 1 &amp; Wave 2 Scale)
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-4xl">
              The 10 iconic enterprise cloud workflows engineers rely on in{' '}
              <strong>Microsoft Azure</strong> and <strong>Amazon Web Services</strong>{' '}
              brought natively to Google Cloud: <strong>Azure Resource Groups</strong>,{' '}
              <strong>Hard-Spend Stop-Loss Fuses</strong>,{' '}
              <strong>AWS IAM Policy Simulator &amp; Switch-Role</strong>,{' '}
              <strong>Azure SAS / S3 Presigned Studio</strong>,{' '}
              <strong>1-Screen Global HTTPS LB + WAF</strong>,{' '}
              <strong>CloudFormation/ARM Stack Drift &amp; Rollback</strong>,{' '}
              <strong>Cost Explorer + CUD Savings Plans</strong>,{' '}
              <strong>AWS SSM Fleet Run Command</strong>,{' '}
              <strong>EventBridge Pipes / Logic Apps Router</strong>, and{' '}
              <strong>Key Vault / Secrets Auto-Rotation &amp; Cross-Env Sync</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchOverview}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            />
            <span>Sync Live Project</span>
          </button>
        </div>

        {/* 10 Sub-Studio Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          {[
            {
              id: 'RESOURCE_GROUPS',
              label: '1. Azure Resource Groups',
              badge: `${resourceGroups.length} Groups`,
              icon: FolderKanban,
            },
            {
              id: 'SPEND_FUSE',
              label: '2. Hard-Spend Fuse',
              badge: `$${spendFuse.monthlyBudgetUsd || 50}/mo Cap`,
              icon: Flame,
            },
            {
              id: 'IAM_SIMULATOR',
              label: '3. IAM Simulator & Switch Role',
              badge: `${principals.length} Identities`,
              icon: ShieldCheck,
            },
            {
              id: 'SAS_PRESIGNED',
              label: '4. S3/SAS Presigned URLs',
              badge: `${buckets.length} Buckets`,
              icon: Link2,
            },
            {
              id: 'GLOBAL_LB_WIZARD',
              label: '5. 1-Screen Global LB & WAF',
              badge: '7-in-1 Wizard',
              icon: Globe,
            },
            {
              id: 'CFN_ARM_STACKS',
              label: '6. CloudFormation/ARM Drift & Rollback',
              badge: `${armStacks.length} Stacks`,
              icon: Layers,
            },
            {
              id: 'COST_EXPLORER_CUD',
              label: '7. Cost Explorer & CUD Savings Plans',
              badge: 'Up to -68%',
              icon: TrendingDown,
            },
            {
              id: 'SSM_FLEET_COMMAND',
              label: '8. AWS SSM Fleet Run Command',
              badge: `${ssmFleet.targets?.length || 0} Targets`,
              icon: Terminal,
            },
            {
              id: 'EVENTBRIDGE_PIPES',
              label: '9. EventBridge Pipes & DLQ Router',
              badge: `${eventPipes.length} Pipes`,
              icon: GitBranch,
            },
            {
              id: 'KEYVAULT_ROTATION',
              label: '10. Key Vault Auto-Rotation & Sync',
              badge: `${keyVaultSecrets.length} Secrets`,
              icon: KeyRound,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  active
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-zinc-900 dark:border-zinc-100 shadow-sm'
                    : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    active
                      ? 'bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* =====================================================================
          MODULE 1: AZURE-STYLE RESOURCE GROUPS & BULK LABEL TAGGER
         ===================================================================== */}
      {activeSubTab === 'RESOURCE_GROUPS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Existing Resource Groups */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-emerald-500" />
                    <span>
                      Active Azure-Style Resource Groups (`labels.resource_group`)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Group related VMs, Cloud Run services, GCS Buckets, BigQuery
                    Datasets &amp; Secrets into a single folder with per-group{' '}
                    <code>$/mo</code> burn, 1-click hibernation, and 1-click
                    cascade teardown.
                  </p>
                </div>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cascadeDeleteGcp}
                    onChange={(e) => setCascadeDeleteGcp(e.target.checked)}
                    className="rounded accent-rose-600"
                  />
                  <span>Cascade-delete underlying GCP resources on teardown</span>
                </label>
              </div>

              <div className="space-y-3">
                {resourceGroups.map((grp) => {
                  const isDeleting = Boolean(deletingGroupSlugs[grp.slug]);
                  const isHibernating = Boolean(hibernatingGroupSlugs[grp.slug]);
                  return (
                    <div
                      key={grp.slug}
                      className={`rounded-xl border p-4 transition-all ${
                        isDeleting
                          ? 'opacity-50 bg-zinc-100/70 dark:bg-zinc-900/40 border-zinc-300 dark:border-zinc-800 pointer-events-none select-none'
                          : 'bg-zinc-50/70 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />
                            <span
                              className={`font-mono text-sm font-extrabold text-zinc-900 dark:text-zinc-100 ${
                                isDeleting ? 'line-through' : ''
                              }`}
                            >
                              {grp.displayName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                              {grp.environment}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              ${grp.totalMonthlyUsd.toFixed(2)}/mo ·{' '}
                              {grp.memberCount} resource(s)
                            </span>
                            {isDeleting && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-amber-500/20 text-amber-500 border border-amber-500/40 animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>DELETING GROUP...</span>
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs text-zinc-500 mt-1 ${
                              isDeleting ? 'line-through' : ''
                            }`}
                          >
                            {grp.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isDeleting || isHibernating}
                            onClick={() => handleHibernateGroup(grp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 cursor-pointer"
                          >
                            <Moon className="w-3.5 h-3.5" />
                            <span>
                              {isHibernating ? 'Parking...' : 'Hibernate Group'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() =>
                              handleDeleteGroup(grp, cascadeDeleteGcp)
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>
                              {isDeleting
                                ? 'DELETING...'
                                : cascadeDeleteGcp
                                ? 'Teardown Group + Resources'
                                : 'Remove Group'}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Member chips */}
                      <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-wrap gap-1.5">
                        {grp.members?.length > 0 ? (
                          grp.members.map((m) => (
                            <span
                              key={m.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 ${
                                isDeleting ? 'line-through opacity-60' : ''
                              }`}
                            >
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                [{m.typeBadge}]
                              </span>
                              <span>{m.name}</span>
                              <span className="text-[10px] text-zinc-400">
                                ({m.location})
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-400">
                            No resources assigned yet — select resources on the
                            right and assign them to{' '}
                            <code>{grp.displayName}</code>.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Create / Assign Resources to Resource Group */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleUpsertResourceGroup}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Create / Update Resource Group &amp; Bulk-Tag GCP Labels</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Resource Group Name (Slug)
                  </label>
                  <input
                    type="text"
                    value={newRgSlug}
                    onChange={(e) => setNewRgSlug(e.target.value)}
                    placeholder="e.g. rg-rag-workshop or rg-ai-tutorial-lab"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Environment
                  </label>
                  <select
                    value={newRgEnv}
                    onChange={(e) => setNewRgEnv(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="dev">dev / tutorial</option>
                    <option value="staging">staging</option>
                    <option value="prod">production</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={newRgDesc}
                  onChange={(e) => setNewRgDesc(e.target.value)}
                  placeholder="e.g. All Cloud Run + GCS + BigQuery resources for Friday's GDE demo"
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-zinc-500">
                    Select Project Resources to Group ({selectedMemberIds.length}{' '}
                    selected)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMemberIds(
                        selectedMemberIds.length === unifiedResources.length
                          ? []
                          : unifiedResources.map((r) => r.id)
                      )
                    }
                    className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 underline cursor-pointer"
                  >
                    {selectedMemberIds.length === unifiedResources.length
                      ? 'Clear All'
                      : 'Select All'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                  {unifiedResources.length === 0 ? (
                    <div className="p-4 text-xs font-mono text-zinc-400">
                      No live resources detected yet in {projectId}.
                    </div>
                  ) : (
                    unifiedResources.map((resItem) => {
                      const checked = selectedMemberIds.includes(resItem.id);
                      return (
                        <label
                          key={resItem.id}
                          className="flex items-center justify-between gap-2 px-3 py-2 text-xs font-mono hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMemberSelection(resItem.id)}
                              className="rounded accent-emerald-600"
                            />
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0">
                              {resItem.typeBadge}
                            </span>
                            <span className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
                              {resItem.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 shrink-0">
                            {resItem.location} · $
                            {Number(resItem.estMonthlyUsd || 0).toFixed(2)}/mo
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={actionBusy === 'UPSERT_RG' || !newRgSlug.trim()}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'UPSERT_RG'
                    ? 'Syncing Resource Group & GCP Labels...'
                    : 'Save Resource Group & Sync GCP resource_group Labels'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 2: HARD-SPEND STOP-LOSS FUSE (AWS BUDGETS ACTIONS / AZURE AUTO-SHUTDOWN)
         ===================================================================== */}
      {activeSubTab === 'SPEND_FUSE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    <span>
                      Automated Hard-Spend Stop-Loss Fuse (Beyond Email-Only GCP
                      Budgets)
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    In standard Google Cloud, Budget Alerts{' '}
                    <strong>only send emails</strong> while runaway loops or
                    forgotten GPUs keep billing. Here you arm{' '}
                    <strong>AWS Budgets Actions / Azure Auto-Shutdown</strong>{' '}
                    stop-loss fuses that automatically throttle or park compute.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                  Live Burn: $
                  {Number(spendFuse.currentEstimatedMonthlyUsd || 0).toFixed(2)}
                  /mo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Monthly Hard Cap ($ USD)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={fuseBudgetUsd}
                    onChange={(e) => setFuseBudgetUsd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-amber-500 mb-1">
                    Stage 1 Soft Brake (%)
                  </label>
                  <input
                    type="number"
                    value={fuseSoftPct}
                    onChange={(e) => setFuseSoftPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-orange-500 mb-1">
                    Stage 2 Compute Park (%)
                  </label>
                  <input
                    type="number"
                    value={fuseParkPct}
                    onChange={(e) => setFuseParkPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-rose-500 mb-1">
                    Stage 3 Hard Fuse (%)
                  </label>
                  <input
                    type="number"
                    value={fuseHardPct}
                    onChange={(e) => setFuseHardPct(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCapRun}
                    onChange={(e) => setAutoCapRun(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>
                    Auto-cap Cloud Run <code>minInstances=0, maxInstances=3</code>{' '}
                    at Stage 1 ({fuseSoftPct}%)
                  </span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoStopVms}
                    onChange={(e) => setAutoStopVms(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>
                    Auto-stop all <code>RUNNING</code> Compute Engine VMs at
                    Stage 2 ({fuseParkPct}%)
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleSaveSpendFuse}
                disabled={actionBusy === 'SAVE_FUSE'}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'SAVE_FUSE'
                    ? 'Saving Stop-Loss Policy...'
                    : 'Arm Automated Stop-Loss Budget Fuse Policy'}
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: 1-Click Live Enforcement Actions */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Play className="w-4 h-4 text-rose-500" />
                <span>1-Click Execute / Test Stop-Loss Fuse Actions Now</span>
              </h3>
              <p className="text-xs text-zinc-500">
                Trigger any stop-loss stage immediately against live{' '}
                <code>{projectId}</code> resources or provision the native
                Pub/Sub stop-loss wire:
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() =>
                    handleExecuteSpendFuse('PROVISION_PUBSUB_BUDGET_WIRE')
                  }
                  disabled={Boolean(actionBusy)}
                  className="w-full text-left p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer"
                >
                  <div className="text-xs font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                    1. Wire Live Pub/Sub Budget Stop-Loss Topic (
                    <code>cloudpulse-hard-spend-fuse</code>)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Creates the real Google Cloud Pub/Sub topic for programmatic
                    Billing Budget threshold alerts.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteSpendFuse('SOFT_BRAKE')}
                  disabled={Boolean(actionBusy)}
                  className="w-full text-left p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  <div className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400">
                    2. Execute Stage 1 Soft Brake ({fuseSoftPct}% — Cap Cloud Run
                    Scaling)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Scales all warm Cloud Run services to <code>min=0</code> and
                    caps <code>maxInstances=3</code> to block viral bill spikes.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteSpendFuse('COMPUTE_PARK')}
                  disabled={Boolean(actionBusy)}
                  className="w-full text-left p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
                >
                  <div className="text-xs font-mono font-extrabold text-rose-600 dark:text-rose-400">
                    3. Execute Stage 2 Compute Park ({fuseParkPct}% — Stop VMs +
                    Zero Cloud Run)
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    Stops all <code>RUNNING</code> Compute Engine VMs across all
                    zones and zeroes warm Cloud Run instances.
                  </div>
                </button>
              </div>

              {spendFuse.lastActionSummary && (
                <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  <strong>Last Fuse Execution:</strong>{' '}
                  {spendFuse.lastActionSummary}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 3: AWS IAM POLICY SIMULATOR & SWITCH-ROLE IMPERSONATOR
         ===================================================================== */}
      {activeSubTab === 'IAM_SIMULATOR' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>
                    AWS-Style IAM Policy Simulator &amp; &ldquo;Switch
                    Role&rdquo; Service Account Impersonator
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Select any Service Account or user principal in{' '}
                  <code>{projectId}</code> to simulate 16 core GCP permissions (
                  <code>ALLOW</code> vs <code>DENY</code>), preview the cockpit
                  as that identity, and grant missing least-privilege roles in 1
                  click.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedPrincipalKey}
                  onChange={(e) => {
                    setSelectedPrincipalKey(e.target.value);
                    handleRunIamSimulation(e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                >
                  {principals.map((p) => (
                    <option key={p.memberKey} value={p.memberKey}>
                      {p.memberKey} ({p.roles?.length || 0} roles)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRunIamSimulation(selectedPrincipalKey)}
                  disabled={actionBusy === 'IAM_SIM'}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>
                    {actionBusy === 'IAM_SIM'
                      ? 'Simulating...'
                      : 'Run Policy Simulation'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setImpersonatingBannerPrincipal(
                      impersonatingBannerPrincipal === selectedPrincipalKey
                        ? ''
                        : selectedPrincipalKey
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    {impersonatingBannerPrincipal === selectedPrincipalKey
                      ? 'Exit Switch-Role View'
                      : 'Switch Role Preview'}
                  </span>
                </button>
              </div>
            </div>

            {simResult && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{simResult.allowedCount} ALLOWED</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{simResult.deniedCount} DENIED (Implicit)</span>
                  </span>
                  <span className="text-zinc-500">
                    Active Bound Roles:{' '}
                    {simResult.principalRoles?.length > 0
                      ? simResult.principalRoles.join(', ')
                      : 'None (Zero project-level bindings)'}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">GCP Permission</th>
                        <th className="py-2.5 px-3">Service</th>
                        <th className="py-2.5 px-3">What It Controls</th>
                        <th className="py-2.5 px-3">Simulation Result</th>
                        <th className="py-2.5 px-3">
                          Matching / Remediation Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {(simResult.simulationMatrix || []).map((row) => {
                        const isAllowed = row.decision === 'ALLOWED';
                        return (
                          <tr
                            key={row.permission}
                            className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                          >
                            <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                              {row.permission}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-500">
                              {row.service}
                            </td>
                            <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-400">
                              {row.description}
                            </td>
                            <td className="py-2.5 px-3">
                              {isAllowed ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>ALLOWED</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>DENIED</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {isAllowed ? (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                                  Granted via {row.matchingRoles.join(', ')}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleGrantMissingRole(
                                      row.recommendedLeastPrivilegeRole
                                    )
                                  }
                                  disabled={
                                    actionBusy ===
                                    `GRANT_${row.recommendedLeastPrivilegeRole}`
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>
                                    Grant {row.recommendedLeastPrivilegeRole}
                                  </span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 4: AZURE SAS / AWS S3 1-CLICK PRESIGNED URL & BROWSER UPLOAD STUDIO
         ===================================================================== */}
      {activeSubTab === 'SAS_PRESIGNED' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Bucket Object Browser + 1-Click SAS Link Generator */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-sky-500" />
                    <span>
                      1-Click Azure SAS / AWS S3 Presigned Share Link Generator
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Generate expiring download/upload links (<code>15m</code>,{' '}
                    <code>1h</code>, <code>24h</code>, <code>7d</code>) right
                    from the browser—including a{' '}
                    <strong>Zero-SA-Key Instant SAS Bridge URL</strong> that
                    works even when signed in with a personal user account.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedBucket}
                    onChange={(e) => setSelectedBucket(e.target.value)}
                    className="px-3 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    {buckets.map((b) => (
                      <option key={b.name} value={b.name}>
                        gs://{b.name} ({b.location})
                      </option>
                    ))}
                  </select>

                  <select
                    value={sasDurationSec}
                    onChange={(e) => setSasDurationSec(Number(e.target.value))}
                    className="px-2.5 py-2 rounded-xl text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    <option value={900}>Expires: 15 min</option>
                    <option value={3600}>Expires: 1 hour</option>
                    <option value={86400}>Expires: 24 hours</option>
                    <option value={604800}>Expires: 7 days</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Object Name</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Content-Type</th>
                      <th className="py-2.5 px-3 text-right">
                        1-Click Presigned / SAS Link
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {loadingObjects ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-zinc-400"
                        >
                          Loading objects in gs://{selectedBucket}...
                        </td>
                      </tr>
                    ) : bucketObjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-6 text-center text-zinc-400"
                        >
                          Bucket is empty — upload a file on the right to test
                          1-Click Presigned URLs.
                        </td>
                      </tr>
                    ) : (
                      bucketObjects.map((obj) => (
                        <tr
                          key={obj.name}
                          className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                        >
                          <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                            {obj.name}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-500">
                            {(obj.sizeBytes / 1024).toFixed(1)} KB
                          </td>
                          <td className="py-2.5 px-3 text-zinc-500">
                            {obj.contentType}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                handleGeneratePresignedUrl(obj.name)
                              }
                              disabled={actionBusy === `SAS_${obj.name}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-400 border border-sky-500/30 cursor-pointer"
                            >
                              <Link2 className="w-3 h-3" />
                              <span>Generate Share Link</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {generatedSasResult && (
                <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/30 space-y-2.5 text-xs font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-extrabold text-sky-600 dark:text-sky-400">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>
                        Expiring SAS / Presigned Link Ready (gs://
                        {generatedSasResult.bucket}/
                        {generatedSasResult.objectName})
                      </span>
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Expires: {generatedSasResult.expiresAt}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={generatedSasResult.bridgePath}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open / Download via SAS Link</span>
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          `${window.location.origin}${generatedSasResult.bridgePath}`,
                          'Copied expiring browser SAS URL.'
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Share URL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          generatedSasResult.gcloudCli,
                          'Copied gcloud storage sign-url V4 command.'
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 cursor-pointer"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Copy V4 sign-url CLI</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Direct Browser Object Uploader */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleUploadObject}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-500" />
                <span>Direct Browser Upload to gs://{selectedBucket || '...'}</span>
              </h3>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Pick a Local File (or compose text below)
                </label>
                <input
                  type="file"
                  onChange={handleFileInputChange}
                  className="w-full text-xs font-mono file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-bold file:bg-sky-500/15 file:text-sky-600 dark:file:text-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                  Destination Object Path in Bucket
                </label>
                <input
                  type="text"
                  value={uploadObjectName}
                  onChange={(e) => setUploadObjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                />
              </div>

              {!uploadBase64 && (
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Inline Text / JSON Payload
                  </label>
                  <textarea
                    rows={4}
                    value={uploadTextContent}
                    onChange={(e) => setUploadTextContent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={actionBusy === 'UPLOAD_OBJ' || !selectedBucket}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'UPLOAD_OBJ'
                    ? 'Uploading to Cloud Storage...'
                    : `Upload to gs://${selectedBucket}/${uploadObjectName}`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 5: 1-SCREEN GLOBAL HTTPS LOAD BALANCER + SSL + CLOUD ARMOR WIZARD
         ===================================================================== */}
      {activeSubTab === 'GLOBAL_LB_WIZARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <form
              onSubmit={handleProvisionGlobalLb}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-500" />
                <span>
                  1-Screen Global HTTPS Load Balancer, Managed SSL &amp; Cloud
                  Armor WAF Wizard
                </span>
              </h3>
              <p className="text-xs text-zinc-500">
                In Google Cloud Console, putting a custom domain + SSL + WAF in
                front of Cloud Run requires configuring{' '}
                <strong>7 separate networking objects</strong>. This wizard
                collapses all 7 steps into a single form.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Load Balancer Stack Name
                  </label>
                  <input
                    type="text"
                    value={lbStackName}
                    onChange={(e) => setLbStackName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Custom HTTPS Domain (Managed SSL)
                  </label>
                  <input
                    type="text"
                    value={lbDomainName}
                    onChange={(e) => setLbDomainName(e.target.value)}
                    placeholder="api.yourdomain.com"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Target Cloud Run Service
                  </label>
                  <input
                    type="text"
                    value={lbTargetRunService}
                    onChange={(e) => setLbTargetRunService(e.target.value)}
                    placeholder="e.g. cloudpulse-api"
                    list="cloudrun-services-list"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                  <datalist id="cloudrun-services-list">
                    {cloudRunServices.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.location})
                      </option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Serverless NEG Region
                  </label>
                  <input
                    type="text"
                    value={lbTargetRegion}
                    onChange={(e) => setLbTargetRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <label className="inline-flex items-center gap-2 text-xs font-mono cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lbEnableArmor}
                    onChange={(e) => setLbEnableArmor(e.target.checked)}
                    className="rounded accent-violet-600"
                  />
                  <span className="font-bold">
                    Attach Cloud Armor L7 DDoS &amp; Rate-Limit WAF Policy
                  </span>
                </label>
                {lbEnableArmor && (
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <span className="text-zinc-500">Rate Limit:</span>
                    <input
                      type="number"
                      value={lbRateLimitRpm}
                      onChange={(e) => setLbRateLimitRpm(e.target.value)}
                      className="w-20 px-2 py-1 rounded bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-xs font-mono"
                    />
                    <span className="text-zinc-500">req/min</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={
                  actionBusy === 'PROVISION_LB' || !lbTargetRunService.trim()
                }
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white cursor-pointer"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>
                  {actionBusy === 'PROVISION_LB'
                    ? 'Provisioning Global LB, Serverless NEG, SSL & WAF...'
                    : '1-Click Provision Global HTTPS Load Balancer + SSL + WAF'}
                </span>
              </button>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-500" />
                <span>
                  7-Step Global Load Balancer Execution Receipt &amp; CLI
                  Blueprint
                </span>
              </h3>

              {lbReceipt ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {(lbReceipt.stepsReceipt || []).map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono"
                      >
                        <span className="font-bold">{s.step}</span>
                        <span className="text-zinc-500">{s.resource}</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="relative">
                    <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-64">
                      {lbReceipt.full7StepCli}
                    </pre>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          lbReceipt.full7StepCli,
                          'Copied 7-step Global Load Balancer CLI.'
                        )
                      }
                      className="absolute top-2 right-2 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-[10px] font-mono font-bold cursor-pointer"
                    >
                      Copy CLI
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 space-y-2">
                  <div>
                    <strong>Active Global Forwarding Rules:</strong>{' '}
                    {data?.globalLoadBalancers?.forwardingRules?.length || 0}
                  </div>
                  <div>
                    <strong>Active URL Maps:</strong>{' '}
                    {data?.globalLoadBalancers?.urlMaps?.length || 0}
                  </div>
                  <div>
                    <strong>Active Managed SSL Certificates:</strong>{' '}
                    {data?.globalLoadBalancers?.sslCertificates?.length || 0}
                  </div>
                  <div>
                    <strong>Active Cloud Armor Security Policies:</strong>{' '}
                    {data?.globalLoadBalancers?.armorPolicies?.length || 0}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 6: AWS CLOUDFORMATION / AZURE ARM STACK DRIFT & ROLLBACK
         ===================================================================== */}
      {activeSubTab === 'CFN_ARM_STACKS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    <span>
                      CloudFormation / Azure ARM Stacks &amp; Live Drift
                      Remediator
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Snapshot any Resource Group into a versioned infrastructure
                    stack, detect out-of-band console drift, rollback in 1
                    click, or export to Terraform HCL / Pulumi TypeScript.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  {['TERRAFORM', 'PULUMI'].map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setSelectedIacFormat(fmt)}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold cursor-pointer ${
                        selectedIacFormat === fmt
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                    >
                      {fmt === 'TERRAFORM' ? 'Terraform HCL' : 'Pulumi TS'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {armStacks.map((st) => {
                  const isDrifted = st.driftStatus === 'DRIFTED';
                  const iacCode =
                    selectedIacFormat === 'TERRAFORM'
                      ? st.terraformHcl
                      : st.pulumiTs;
                  return (
                    <div
                      key={st.stackName}
                      className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-sm text-zinc-950 dark:text-zinc-50">
                            {st.stackName}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                            {st.version} · {st.resourceGroup}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              isDrifted
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            }`}
                          >
                            {isDrifted ? 'DRIFTED' : 'IN_SYNC'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={actionBusy === `DRIFT_${st.stackName}`}
                            onClick={() => handleDetectStackDrift(st.stackName)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
                          >
                            <Search className="w-3 h-3" />
                            <span>
                              {actionBusy === `DRIFT_${st.stackName}`
                                ? 'Scanning...'
                                : 'Detect Drift'}
                            </span>
                          </button>

                          {isDrifted && (
                            <button
                              type="button"
                              disabled={
                                actionBusy === `ROLLBACK_${st.stackName}`
                              }
                              onClick={() =>
                                handleRollbackArmStack(st.stackName)
                              }
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>1-Click Rollback Drift</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                iacCode,
                                `Copied ${selectedIacFormat} code for ${st.stackName}.`
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy IaC</span>
                          </button>
                        </div>
                      </div>

                      {isDrifted && (st.driftedItems || []).length > 0 && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-xs font-mono">
                          <div className="font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>
                              Out-of-Band Console Drift Detected (
                              {st.driftedItems.length} item(s)):
                            </span>
                          </div>
                          {st.driftedItems.map((d, idx) => (
                            <div
                              key={idx}
                              className="text-[11px] text-zinc-700 dark:text-zinc-300"
                            >
                              <strong>{d.resource}</strong> ({d.property}):
                              Expected{' '}
                              <code className="text-emerald-500">
                                {d.expected}
                              </code>{' '}
                              · Actual{' '}
                              <code className="text-amber-500">{d.actual}</code>
                            </div>
                          ))}
                        </div>
                      )}

                      <pre className="p-3 rounded-xl bg-zinc-950 text-emerald-400 text-[10.5px] font-mono overflow-x-auto max-h-40">
                        {iacCode}
                      </pre>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleSnapshotArmStack}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-500" />
                <span>Snapshot Resource Group as Versioned Stack</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Stack Name
                  </label>
                  <input
                    type="text"
                    value={newStackName}
                    onChange={(e) => setNewStackName(e.target.value)}
                    placeholder="stack-checkout-v2"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                      Source Resource Group
                    </label>
                    <select
                      value={newStackRg}
                      onChange={(e) => setNewStackRg(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    >
                      {resourceGroups.map((g) => (
                        <option key={g.slug} value={g.slug}>
                          {g.slug} ({g.members?.length || 0} res)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                      Semantic Version
                    </label>
                    <input
                      type="text"
                      value={newStackVersion}
                      onChange={(e) => setNewStackVersion(e.target.value)}
                      placeholder="v2.0.0"
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Baseline Description
                  </label>
                  <input
                    type="text"
                    value={newStackDesc}
                    onChange={(e) => setNewStackDesc(e.target.value)}
                    placeholder="Immutable release snapshot prior to traffic migration"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    actionBusy === 'SNAPSHOT_STACK' || !newStackName.trim()
                  }
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {actionBusy === 'SNAPSHOT_STACK'
                      ? 'Capturing Stack Snapshot...'
                      : 'Capture CloudFormation / ARM Stack Baseline'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 7: AWS COST EXPLORER / AZURE COST ANALYSIS & CUD SAVINGS PLANS
         ===================================================================== */}
      {activeSubTab === 'COST_EXPLORER_CUD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                    <span>
                      Granular Daily Burn &amp; Per-Service Attribution
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Real-time AWS Cost Explorer / Azure Cost Analysis view
                    across Cloud Run, Compute Engine, Cloud Storage, BigQuery
                    &amp; Secret Manager.
                  </p>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-zinc-400">Projected Monthly</div>
                  <div className="text-base font-extrabold text-emerald-500">
                    ${costExplorer.monthlyProjectedUsd || 0}/mo
                  </div>
                </div>
              </div>

              {/* Per-Service Breakdown Bars */}
              <div className="space-y-2">
                {(costExplorer.serviceBreakdown || []).map((item) => {
                  const pct = Math.min(
                    100,
                    Math.round(
                      ((item.monthlyUsd || 0) /
                        Math.max(1, costExplorer.monthlyProjectedUsd || 1)) *
                        100
                    )
                  );
                  return (
                    <div
                      key={item.service}
                      className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-bold text-zinc-800 dark:text-zinc-200">
                          {item.service}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          ${item.monthlyUsd}/mo ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 14-Day Daily Burn Spark Table */}
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-[11px] font-mono font-bold text-zinc-500 mb-2">
                  14-Day Daily Cost Velocity (Avg $
                  {costExplorer.dailyAverageUsd || 0}/day)
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[10px]">
                  {(costExplorer.dailyBurnSeries || [])
                    .slice(-7)
                    .map((day) => (
                      <div
                        key={day.date}
                        className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                      >
                        <div className="text-zinc-400">{day.date}</div>
                        <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                          ${day.totalUsd}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>
                  1-Click Cloud Billing CUD &amp; Spot Arbitrage Savings Plans
                </span>
              </h3>

              <div className="space-y-3">
                {(costExplorer.savingsPlans || []).map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                        {plan.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-extrabold">
                        -{plan.discountPct}% · Save ${plan.estMonthlySavingsUsd}
                        /mo (${plan.annualSavingsUsd}/yr)
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {plan.recommendation}
                    </p>
                    <button
                      type="button"
                      disabled={actionBusy === `FINOPS_${plan.id}`}
                      onClick={() => handleApplyFinopsArbitrage(plan.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>
                        {actionBusy === `FINOPS_${plan.id}`
                          ? 'Applying Savings Plan...'
                          : '1-Click Apply FinOps Plan'}
                      </span>
                    </button>
                  </div>
                ))}
              </div>

              {finopsReceipt?.gcloudCudCli && (
                <div className="p-3 rounded-xl bg-zinc-950 text-emerald-400 text-[11px] font-mono space-y-1.5">
                  <div className="text-zinc-400 font-bold">
                    Reproducible CUD / Budget CLI:
                  </div>
                  <div className="break-all">{finopsReceipt.gcloudCudCli}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 8: AWS SYSTEMS MANAGER (SSM) FLEET RUN COMMAND & PATCH MANAGER
         ===================================================================== */}
      {activeSubTab === 'SSM_FLEET_COMMAND' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <form
              onSubmit={handleExecuteSsmCommand}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-500" />
                  <span>
                    AWS Systems Manager (SSM) Fleet Run Command &amp; Patch
                    Manager
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Execute simultaneous rolling restarts, OS CVE security
                  patches, or health diagnostics across multiple Compute VMs and
                  Cloud Run services without opening individual SSH sessions.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    SSM Automation Document Preset
                  </label>
                  <select
                    value={selectedSsmDocId}
                    onChange={(e) => {
                      const docId = e.target.value;
                      setSelectedSsmDocId(docId);
                      const found = (ssmFleet.documents || []).find(
                        (d) => d.id === docId
                      );
                      if (found) setSsmCustomCommand(found.command);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    {(ssmFleet.documents || []).map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Fleet Shell Payload / Rolling Annotation Command
                  </label>
                  <input
                    type="text"
                    value={ssmCustomCommand}
                    onChange={(e) => setSsmCustomCommand(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <div className="text-[11px] font-mono font-bold text-zinc-500 mb-1.5">
                    Select Target Compute VMs &amp; Cloud Run Services (
                    {selectedSsmTargets.length} selected)
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    {(ssmFleet.targets || []).length === 0 ? (
                      <div className="text-xs font-mono text-zinc-500 p-2">
                        No Compute VMs or Cloud Run services found in project.
                      </div>
                    ) : (
                      (ssmFleet.targets || []).map((t) => {
                        const checked = selectedSsmTargets.includes(t.id);
                        return (
                          <label
                            key={t.id}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-xs font-mono cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleSsmTarget(t.id)}
                              />
                              <span className="font-bold">{t.name}</span>
                              <span className="text-[10px] text-zinc-500">
                                ({t.type} · {t.location})
                              </span>
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500">
                              {t.status}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    actionBusy === 'SSM_EXEC' ||
                    selectedSsmTargets.length === 0
                  }
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>
                    {actionBusy === 'SSM_EXEC'
                      ? 'Dispatching Fleet Run Command...'
                      : `Execute SSM Document Across ${selectedSsmTargets.length} Target(s)`}
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Fleet Execution Telemetry &amp; Exit-Code Receipts</span>
              </h3>

              {(ssmFleet.recentExecutions || []).length === 0 ? (
                <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 text-center">
                  No SSM Fleet executions recorded yet in this session. Select
                  targets on the left and click Execute.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {(ssmFleet.recentExecutions || []).map((exec) => (
                    <div
                      key={exec.executionId}
                      className="p-3.5 rounded-xl bg-zinc-950 text-zinc-100 border border-zinc-800 font-mono text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-blue-400">
                          {exec.documentId} ({exec.executionId})
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {exec.targetCount} target(s)
                        </span>
                      </div>
                      {(exec.results || []).map((r, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-zinc-900 border border-zinc-800 space-y-1 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400">
                              {r.targetName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                              {r.status} (exit={r.exitCode})
                            </span>
                          </div>
                          <div className="text-zinc-300 break-all">
                            {r.stdout}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 9: AWS EVENTBRIDGE PIPES / AZURE LOGIC APPS EVENT ROUTER
         ===================================================================== */}
      {activeSubTab === 'EVENTBRIDGE_PIPES' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handleProvisionEventPipe}
              className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4"
            >
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-amber-500" />
                  <span>
                    Create AWS EventBridge Pipe + Dead-Letter Queue (DLQ)
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Connect GCS Bucket events, Pub/Sub topics, or BigQuery inserts
                  directly to Cloud Run with JSON filtering, payload
                  transformation, and automatic `-dlq` Pub/Sub provisioning.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Pipe Identifier
                  </label>
                  <input
                    type="text"
                    value={newPipeId}
                    onChange={(e) => setNewPipeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                      1. Source Trigger Type
                    </label>
                    <select
                      value={newPipeSourceType}
                      onChange={(e) => setNewPipeSourceType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    >
                      <option value="GCS_BUCKET_FINALIZE">
                        GCS Object Finalize
                      </option>
                      <option value="PUBSUB_TOPIC_STREAM">
                        Cloud Pub/Sub Topic
                      </option>
                      <option value="BIGQUERY_TABLE_INSERT">
                        BigQuery Table Insert
                      </option>
                      <option value="CLOUD_AUDIT_LOG">
                        Cloud Audit Log Event
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                      Source Resource URI
                    </label>
                    <input
                      type="text"
                      value={newPipeSourceRes}
                      onChange={(e) => setNewPipeSourceRes(e.target.value)}
                      placeholder={`gs://${projectId}-ingest`}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    2. Event Filter Rule (JSON Pattern)
                  </label>
                  <input
                    type="text"
                    value={newPipeFilter}
                    onChange={(e) => setNewPipeFilter(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    3. Payload Input Transformer
                  </label>
                  <input
                    type="text"
                    value={newPipeTransform}
                    onChange={(e) => setNewPipeTransform(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                      4. Target Consumer Type
                    </label>
                    <select
                      value={newPipeTargetType}
                      onChange={(e) => setNewPipeTargetType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    >
                      <option value="CLOUD_RUN_SERVICE">
                        Cloud Run HTTPS Service
                      </option>
                      <option value="CLOUD_FUNCTION_GEN2">
                        Cloud Function Gen2
                      </option>
                      <option value="BIGQUERY_STREAMING">
                        BigQuery Streaming Sink
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                      Target Consumer Name
                    </label>
                    <input
                      type="text"
                      value={newPipeTargetRes}
                      onChange={(e) => setNewPipeTargetRes(e.target.value)}
                      placeholder="cloudpulse-worker"
                      className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionBusy === 'PIPE_CREATE' || !newPipeId.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-amber-600 hover:bg-amber-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>
                    {actionBusy === 'PIPE_CREATE'
                      ? 'Provisioning Pipe + Pub/Sub DLQ...'
                      : '1-Click Provision EventBridge Pipe + DLQ Topic'}
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-amber-500" />
                <span>
                  Active Point-to-Point EventBridge Pipes ({eventPipes.length})
                </span>
              </h3>

              <div className="space-y-3">
                {eventPipes.map((p) => (
                  <div
                    key={p.pipeId}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 space-y-2.5 font-mono text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-zinc-950 dark:text-zinc-50">
                          {p.pipeId}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          {p.status} · {p.eventsRoutedCount || 0} Events Routed
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionBusy === `TEST_PIPE_${p.pipeId}`}
                          onClick={() => handleTestEventPipe(p.pipeId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          <Play className="w-3 h-3" />
                          <span>Send Test Event</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEventPipe(p.pipeId)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-500 text-[11px] font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] text-zinc-400">
                          1. SOURCE
                        </div>
                        <div className="font-bold truncate">
                          {p.sourceType}: {p.sourceResource}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] text-zinc-400">
                          2. FILTER &amp; TRANSFORM
                        </div>
                        <div className="truncate text-amber-500">
                          {p.filterPattern}
                        </div>
                      </div>
                      <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[10px] text-zinc-400">
                          3. TARGET + DLQ
                        </div>
                        <div className="font-bold text-emerald-500 truncate">
                          {p.targetResource} (DLQ: {p.pipeId}-dlq)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODULE 10: AWS SECRETS MANAGER / AZURE KEY VAULT AUTO-ROTATION & SYNC
         ===================================================================== */}
      {activeSubTab === 'KEYVAULT_ROTATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-rose-500" />
                  <span>
                    1-Click Secret Rotation &amp; Schedule Provisioner
                  </span>
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Create or rotate a Google Cloud Secret Manager secret (`addVersion`),
                  arm an automated rotation interval, and sync across `dev`,
                  `staging`, and `prod`.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Secret ID (`secretmanager.googleapis.com/v1`)
                  </label>
                  <input
                    type="text"
                    value={rotateSecretName}
                    onChange={(e) => setRotateSecretName(e.target.value)}
                    placeholder="PROD_DATABASE_URL"
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    Auto-Rotation Interval (Days)
                  </label>
                  <select
                    value={rotateDays}
                    onChange={(e) => setRotateDays(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  >
                    <option value={7}>Every 7 Days (High-Security Zero-Trust)</option>
                    <option value={30}>Every 30 Days (SOC2 / PCI-DSS Standard)</option>
                    <option value={90}>Every 90 Days (Quarterly Rotation)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono font-bold text-zinc-500 mb-1">
                    New Secret Value (Leave blank to auto-generate 256-bit
                    token)
                  </label>
                  <input
                    type="password"
                    value={rotateCustomPayload}
                    onChange={(e) => setRotateCustomPayload(e.target.value)}
                    placeholder="Auto-generate cryptographic secret version..."
                    className="w-full px-3 py-2 rounded-lg text-xs font-mono bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <button
                  type="button"
                  disabled={
                    actionBusy === `ROTATE_${rotateSecretName}` ||
                    !rotateSecretName.trim()
                  }
                  onClick={() => handleRotateSecretNow(rotateSecretName)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-mono font-extrabold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {actionBusy === `ROTATE_${rotateSecretName}`
                      ? 'Rotating Secret Version in GCP...'
                      : '1-Click Rotate Secret Now & Arm Schedule'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                <span>
                  Live Key Vault / Secret Manager Inventory &amp; Cross-Env Sync
                  ({keyVaultSecrets.length})
                </span>
              </h3>

              {keyVaultSecrets.length === 0 ? (
                <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-500 text-center">
                  No secrets found in Secret Manager yet. Use the form on the
                  left to provision and rotate your first secret.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {keyVaultSecrets.map((sec) => (
                    <div
                      key={sec.name}
                      className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-zinc-950 dark:text-zinc-50">
                            {sec.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[10px] font-bold">
                            Every {sec.rotationPeriodDays}d
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                            Envs: {(sec.syncedEnvs || [sec.environment]).join(', ')}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-zinc-500">
                          Replication: {sec.replicationType} · Last Rotated:{' '}
                          {sec.lastRotatedAt
                            ? new Date(sec.lastRotatedAt).toLocaleDateString()
                            : 'Active'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionBusy === `ROTATE_${sec.name}`}
                          onClick={() => handleRotateSecretNow(sec.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Rotate Now</span>
                        </button>
                        <button
                          type="button"
                          disabled={actionBusy === `SYNC_${sec.name}`}
                          onClick={() => handleSyncSecretEnvs(sec.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-bold cursor-pointer"
                        >
                          <Layers className="w-3 h-3" />
                          <span>Sync Dev/Stage/Prod</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
