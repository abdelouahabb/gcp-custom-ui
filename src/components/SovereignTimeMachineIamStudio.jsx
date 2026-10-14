import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  History,
  GitCompare,
  Lock,
  Unlock,
  Clock,
  RefreshCw,
  Terminal,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  UserCheck,
  FileCode2,
  Trash2,
  PlusCircle,
  Globe,
  Fingerprint,
  Layers,
  Zap,
} from 'lucide-react';

export default function SovereignTimeMachineIamStudio({
  projectId,
  initialSubTab = 'IAM_SURGEON',
  onTriggerToast,
  onRefreshOverview,
}) {
  const [activeSubTab, setActiveSubTab] = useState(
    initialSubTab || 'IAM_SURGEON'
  );
  const [copiedText, setCopiedText] = useState('');

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // --- Tab 1: IAM Least-Privilege Surgeon State ---
  const [iamData, setIamData] = useState(null);
  const [loadingIam, setLoadingIam] = useState(false);
  const [iamFilter, setIamFilter] = useState('ALL');
  const [iamSearch, setIamSearch] = useState('');
  const [remediatingId, setRemediatingId] = useState(null);
  const [selectedJitHours, setSelectedJitHours] = useState(24);
  const [pendingIamApproval, setPendingIamApproval] = useState(null);
  const [approvalChecked, setApprovalChecked] = useState(false);
  const [approvalCustomRole, setApprovalCustomRole] = useState('');
  const [selectedSaEmail, setSelectedSaEmail] = useState('');
  const [newSaAccountId, setNewSaAccountId] = useState('');
  const [newSaDisplayName, setNewSaDisplayName] = useState('');
  const [newSaDescription, setNewSaDescription] = useState(
    'Least-privilege custom runtime Service Account'
  );
  const [newSaRoles, setNewSaRoles] = useState([
    'roles/logging.logWriter',
    'roles/monitoring.metricWriter',
  ]);
  const [showCreateSaForm, setShowCreateSaForm] = useState(false);
  const [saActionBusy, setSaActionBusy] = useState(false);
  const [iamSectionView, setIamSectionView] = useState('SPLIT'); // 'SPLIT' | 'SA_VAULT' | 'ROLES'
  const [expandAllIamRoles, setExpandAllIamRoles] = useState(false);

  // --- Tab 2: Cryptographic State Time-Machine & Drift Radar State ---
  const [tmData, setTmData] = useState(null);
  const [loadingTm, setLoadingTm] = useState(false);
  const [selectedBaselineId, setSelectedBaselineId] = useState('');
  const [newSnapshotLabel, setNewSnapshotLabel] = useState('');
  const [tmActionBusy, setTmActionBusy] = useState(false);

  // --- Tab 3: Secret Manager, KMS & Cloud Armor WAF State ---
  const [vaultData, setVaultData] = useState(null);
  const [loadingVault, setLoadingVault] = useState(false);
  const [secretId, setSecretId] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [secretBlueprint, setSecretBlueprint] = useState('gdpr-sovereign');
  const [secretReplicationMode, setSecretReplicationMode] =
    useState('SOVEREIGN_REGION');
  const [secretRegion, setSecretRegion] = useState('europe-west1');
  const [secretRotationDays, setSecretRotationDays] = useState(30);
  const [secretBindSaEmail, setSecretBindSaEmail] = useState('');
  const [creatingSecret, setCreatingSecret] = useState(false);
  const [expandedSecretId, setExpandedSecretId] = useState(null);
  const [rotateValues, setRotateValues] = useState({});
  const [rotateDisableOld, setRotateDisableOld] = useState(true);
  const [grantSaBySecret, setGrantSaBySecret] = useState({});
  const [secretActionBusy, setSecretActionBusy] = useState(null);
  const [githubRepoSlug, setGithubRepoSlug] = useState('');
  const [wifBusy, setWifBusy] = useState(false);
  const [wifResult, setWifResult] = useState(null);

  const handleCopy = (text, label = 'CLI command') => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    if (onTriggerToast) onTriggerToast(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const triggerJsonFileDownload = (fileName, jsonString) => {
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'service-account-key.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // ignore download error
    }
  };

  const fetchIamSurgeon = useCallback(async () => {
    if (!projectId) return;
    setLoadingIam(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/sovereign/iam-surgeon`
      );
      setIamData(res.data);
      const firstSa = res.data?.serviceAccounts?.[0]?.email || '';
      setSelectedSaEmail((prev) => prev || firstSa);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to scan project IAM bindings'
        );
      }
    } finally {
      setLoadingIam(false);
    }
  }, [projectId, onTriggerToast]);

  const fetchTimeMachine = useCallback(
    async (baselineIdOverride) => {
      if (!projectId) return;
      setLoadingTm(true);
      try {
        const targetBase =
          baselineIdOverride !== undefined
            ? baselineIdOverride
            : selectedBaselineId;
        const res = await axios.get(
          `/api/project/${encodeURIComponent(projectId)}/sovereign/time-machine`,
          {
            params: targetBase ? { baselineSnapshotId: targetBase } : {},
          }
        );
        setTmData(res.data);
        if (!selectedBaselineId && res.data?.baselineSnapshot?.snapshotId) {
          setSelectedBaselineId(res.data.baselineSnapshot.snapshotId);
        }
      } catch (err) {
        if (onTriggerToast) {
          onTriggerToast(
            err.response?.data?.error ||
              'Failed to compute Cryptographic State Time-Machine'
          );
        }
      } finally {
        setLoadingTm(false);
      }
    },
    [projectId, selectedBaselineId, onTriggerToast]
  );

  const fetchVaultStudio = useCallback(async () => {
    if (!projectId) return;
    setLoadingVault(true);
    try {
      const res = await axios.get(
        `/api/project/${encodeURIComponent(projectId)}/sovereign/secrets-kms`
      );
      setVaultData(res.data);
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to load Secret Manager & KMS status'
        );
      }
    } finally {
      setLoadingVault(false);
    }
  }, [projectId, onTriggerToast]);

  useEffect(() => {
    if (activeSubTab === 'IAM_SURGEON') fetchIamSurgeon();
    if (activeSubTab === 'TIME_MACHINE') fetchTimeMachine();
    if (activeSubTab === 'SECRETS_KMS_WAF') fetchVaultStudio();
  }, [activeSubTab, fetchIamSurgeon, fetchTimeMachine, fetchVaultStudio]);

  // Step 1: Open the Approval & Impact Review Modal before mutating any IAM policy
  const requestIamApproval = (payload, findingId, meta = {}) => {
    setApprovalChecked(false);
    setApprovalCustomRole(payload.newRole || '');
    setPendingIamApproval({
      payload,
      findingId,
      meta,
    });
  };

  // Step 2: Execute only after explicit user confirmation in the Approval Modal
  const handleConfirmIamRemediate = async () => {
    if (!pendingIamApproval) return;
    const { payload, findingId } = pendingIamApproval;
    const finalPayload =
      payload.action === 'DOWNGRADE_ROLE' && approvalCustomRole.trim()
        ? { ...payload, newRole: approvalCustomRole.trim() }
        : payload;

    setRemediatingId(findingId);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/iam-surgeon/remediate`,
        finalPayload
      );
      if (res.data?.privateKeyJson) {
        triggerJsonFileDownload(res.data.fileName, res.data.privateKeyJson);
      }
      if (onTriggerToast) {
        onTriggerToast(res.data?.message || 'IAM policy updated after approval');
      }
      setPendingIamApproval(null);
      await fetchIamSurgeon();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'IAM remediation requires resourcemanager.projects.setIamPolicy permission'
        );
      }
    } finally {
      setRemediatingId(null);
    }
  };

  const handleToggleNewSaRole = (roleName) => {
    setNewSaRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleApplySaRolePreset = (presetKey) => {
    if (presetKey === 'ZERO') {
      setNewSaRoles([]);
      setNewSaDescription(
        'Zero project-wide IAM roles (bind resource-level permissions only)'
      );
    } else if (presetKey === 'CLOUD_RUN') {
      setNewSaAccountId((prev) => prev || 'cloudrun-least-priv-sa');
      setNewSaDisplayName(
        (prev) => prev || 'Cloud Run Least-Privilege Runtime SA'
      );
      setNewSaDescription(
        'Minimal Cloud Run runtime identity (Logs, Metrics & Secret Manager Accessor)'
      );
      setNewSaRoles([
        'roles/logging.logWriter',
        'roles/monitoring.metricWriter',
        'roles/secretmanager.secretAccessor',
      ]);
    } else if (presetKey === 'VM_GKE') {
      setNewSaAccountId((prev) => prev || 'compute-node-least-priv');
      setNewSaDisplayName(
        (prev) => prev || 'Compute / GKE Node Least-Privilege SA'
      );
      setNewSaDescription(
        'Replaces over-privileged default Compute SA with Logs, Metrics & Artifact Registry Reader'
      );
      setNewSaRoles([
        'roles/logging.logWriter',
        'roles/monitoring.metricWriter',
        'roles/artifactregistry.reader',
      ]);
    } else if (presetKey === 'DATA_PIPELINE') {
      setNewSaAccountId((prev) => prev || 'data-pipeline-worker-sa');
      setNewSaDisplayName(
        (prev) => prev || 'Data Pipeline Least-Privilege Worker SA'
      );
      setNewSaDescription(
        'Scoped identity for Storage Object Viewer & BigQuery Job User'
      );
      setNewSaRoles([
        'roles/logging.logWriter',
        'roles/storage.objectViewer',
        'roles/bigquery.jobUser',
      ]);
    }
  };

  const handleCreateServiceAccount = async (e) => {
    e.preventDefault();
    if (!newSaAccountId.trim()) return;
    setSaActionBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/iam-surgeon/remediate`,
        {
          action: 'CREATE_SERVICE_ACCOUNT',
          accountId: newSaAccountId.trim(),
          displayName:
            newSaDisplayName.trim() ||
            `CloudPulse Custom SA (${newSaAccountId.trim()})`,
          description: newSaDescription.trim(),
          roles: newSaRoles,
        }
      );
      const createdEmail = res.data?.serviceAccount?.email || '';
      if (createdEmail) setSelectedSaEmail(createdEmail);
      setNewSaAccountId('');
      setNewSaDisplayName('');
      setShowCreateSaForm(false);
      if (onTriggerToast) {
        onTriggerToast(res.data?.message || 'Created Service Account');
      }
      await fetchIamSurgeon();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to create Service Account'
        );
      }
    } finally {
      setSaActionBusy(false);
    }
  };

  const handleCreateAndDownloadSaKey = async (saEmailOverride) => {
    const targetEmail = saEmailOverride || selectedSaEmail;
    if (!targetEmail) return;
    setSaActionBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/iam-surgeon/remediate`,
        {
          action: 'CREATE_SA_KEY',
          serviceAccountEmail: targetEmail,
        }
      );
      if (res.data?.privateKeyJson) {
        triggerJsonFileDownload(res.data.fileName, res.data.privateKeyJson);
      }
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message || `Created & downloaded JSON key for ${targetEmail}`
        );
      }
      await fetchIamSurgeon();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to create Service Account JSON key'
        );
      }
    } finally {
      setSaActionBusy(false);
    }
  };

  const handleDownloadExistingSaKey = async (keyName, serviceAccountEmail) => {
    setSaActionBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/iam-surgeon/remediate`,
        {
          action: 'DOWNLOAD_SA_KEY',
          keyName,
          serviceAccountEmail,
        }
      );
      if (res.data?.downloadJson) {
        triggerJsonFileDownload(res.data.fileName, res.data.downloadJson);
      }
      if (onTriggerToast) {
        onTriggerToast(res.data?.message || 'Downloaded key file');
      }
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to download key metadata'
        );
      }
    } finally {
      setSaActionBusy(false);
    }
  };

  const handleMintSaToken = async (saEmailOverride) => {
    const targetEmail = saEmailOverride || selectedSaEmail;
    if (!targetEmail) return;
    setSaActionBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/iam-surgeon/remediate`,
        {
          action: 'MINT_SA_TOKEN',
          serviceAccountEmail: targetEmail,
        }
      );
      if (res.data?.downloadJson) {
        triggerJsonFileDownload(res.data.fileName, res.data.downloadJson);
      }
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message || `Minted 1h OAuth2 token for ${targetEmail}`
        );
      }
      await fetchIamSurgeon();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to mint Service Account token'
        );
      }
    } finally {
      setSaActionBusy(false);
    }
  };

  const handleTimeMachineAction = async (action, label = '') => {
    setTmActionBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/time-machine/snapshot`,
        { action, label }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            `Sealed SHA-256 snapshot ${res.data?.snapshot?.merkleRootShort || ''}`
        );
      }
      setNewSnapshotLabel('');
      await fetchTimeMachine();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Time-Machine operation failed'
        );
      }
    } finally {
      setTmActionBusy(false);
    }
  };

  const applySecretBlueprint = (bp) => {
    setSecretBlueprint(bp);
    if (bp === 'gdpr-sovereign') {
      setSecretReplicationMode('SOVEREIGN_REGION');
      setSecretRegion('europe-west1');
      setSecretRotationDays(30);
    } else if (bp === 'sec-finra-us') {
      setSecretReplicationMode('SOVEREIGN_REGION');
      setSecretRegion('us-central1');
      setSecretRotationDays(30);
    } else if (bp === 'hipaa-vault') {
      setSecretReplicationMode('SOVEREIGN_REGION');
      setSecretRegion('us-east4');
      setSecretRotationDays(60);
    } else {
      // custom
    }
  };

  const handleCreateSecret = async (e) => {
    e.preventDefault();
    if (!secretId.trim()) return;
    setCreatingSecret(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/create-secret`,
        {
          secretId: secretId.trim(),
          secretValue,
          replicationMode: secretReplicationMode,
          region: secretRegion,
          rotationDays: secretRotationDays,
          serviceAccountEmail: secretBindSaEmail,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          `Sealed secret "${secretId.trim()}" in Secret Manager (${secretReplicationMode})${
            res.data?.grantedAccessorTo
              ? ` & granted secretAccessor to ${res.data.grantedAccessorTo}`
              : ''
          }`
        );
      }
      setExpandedSecretId(secretId.trim());
      setSecretId('');
      setSecretValue('');
      await fetchVaultStudio();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to create Secret Manager secret'
        );
      }
    } finally {
      setCreatingSecret(false);
    }
  };

  const handleRotateSecret = async (targetSecretId) => {
    const newVal = (rotateValues[targetSecretId] || '').trim();
    if (!newVal) {
      if (onTriggerToast) {
        onTriggerToast('Enter a new secret value before rotating');
      }
      return;
    }
    setSecretActionBusy(`ROTATE:${targetSecretId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'ROTATE_SECRET',
          secretId: targetSecretId,
          newSecretValue: newVal,
          disablePreviousVersions: rotateDisableOld,
        }
      );
      setRotateValues((prev) => ({ ...prev, [targetSecretId]: '' }));
      if (onTriggerToast) {
        onTriggerToast(res.data?.message || `Rotated ${targetSecretId}`);
      }
      await fetchVaultStudio();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || `Failed to rotate ${targetSecretId}`
        );
      }
    } finally {
      setSecretActionBusy(null);
    }
  };

  const handleToggleSecretVersionState = async (
    targetSecretId,
    version,
    targetState
  ) => {
    setSecretActionBusy(`VER:${targetSecretId}:${version}:${targetState}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'TOGGLE_VERSION_STATE',
          secretId: targetSecretId,
          version,
          targetState,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(res.data?.message || `Updated version v${version}`);
      }
      await fetchVaultStudio();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            `Failed to ${targetState.toLowerCase()} version v${version}`
        );
      }
    } finally {
      setSecretActionBusy(null);
    }
  };

  const handleGrantSecretAccessor = async (targetSecretId) => {
    const saEmail =
      grantSaBySecret[targetSecretId] ||
      vaultData?.serviceAccounts?.[0]?.email ||
      '';
    if (!saEmail) {
      if (onTriggerToast) {
        onTriggerToast('Select or enter a Service Account email first');
      }
      return;
    }
    setSecretActionBusy(`GRANT:${targetSecretId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'GRANT_SECRET_ACCESSOR',
          secretId: targetSecretId,
          serviceAccountEmail: saEmail,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            `Granted secretAccessor on ${targetSecretId} to ${saEmail}`
        );
      }
      await fetchVaultStudio();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || 'Failed to grant secretAccessor role'
        );
      }
    } finally {
      setSecretActionBusy(null);
    }
  };

  const handleDeleteSecret = async (targetSecretId) => {
    setSecretActionBusy(`DELETE:${targetSecretId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'DELETE_SECRET',
          secretId: targetSecretId,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(res.data?.message || `Deleted secret ${targetSecretId}`);
      }
      if (expandedSecretId === targetSecretId) setExpandedSecretId(null);
      await fetchVaultStudio();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error || `Failed to delete ${targetSecretId}`
        );
      }
    } finally {
      setSecretActionBusy(null);
    }
  };

  const handleProvisionGithubOidcWif = async (e) => {
    if (e) e.preventDefault();
    const cleanRepo = String(githubRepoSlug || '').trim();
    if (!cleanRepo || !cleanRepo.includes('/')) {
      if (onTriggerToast) {
        onTriggerToast('Enter a valid GitHub owner/repository (e.g., acme-org/cloud-app)');
      }
      return;
    }
    const targetSa = selectedSaEmail || iamData?.serviceAccounts?.[0]?.email || '';
    if (!targetSa) {
      if (onTriggerToast) {
        onTriggerToast('Select or create a Service Account first');
      }
      return;
    }
    setWifBusy(true);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/iam-surgeon/remediate`,
        {
          action: 'PROVISION_GITHUB_OIDC_WIF',
          serviceAccountEmail: targetSa,
          githubRepo: cleanRepo,
        }
      );
      setWifResult(res.data);
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            `Provisioned Keyless GitHub OIDC Workload Identity Federation for ${cleanRepo}`
        );
      }
      await fetchIamSurgeon();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            'Failed to provision Workload Identity Pool / OIDC Provider'
        );
      }
    } finally {
      setWifBusy(false);
    }
  };

  const handleScheduleAutoRotation = async (targetSecretId, rotationPeriodDays = 30) => {
    setSecretActionBusy(`SCHED:${targetSecretId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'CONFIGURE_AUTO_ROTATION_SCHEDULE',
          secretId: targetSecretId,
          rotationPeriodDays,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            `Configured ${rotationPeriodDays}d auto-rotation schedule on ${targetSecretId}`
        );
      }
      await fetchVaultStudio();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            `Failed to configure auto-rotation schedule on ${targetSecretId}`
        );
      }
    } finally {
      setSecretActionBusy(null);
    }
  };

  const handleReloadMountedWorkloads = async (targetSecretId, workloads = []) => {
    setSecretActionBusy(`RELOAD:${targetSecretId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'RELOAD_MOUNTED_WORKLOADS',
          secretId: targetSecretId,
          workloads,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            `Reloaded Cloud Run workloads mounted to ${targetSecretId}`
        );
      }
      await fetchVaultStudio();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            `Failed to reload Cloud Run workloads for ${targetSecretId}`
        );
      }
    } finally {
      setSecretActionBusy(null);
    }
  };

  const handleHealBrokenSecretRef = async (brokenRef, healStrategy = 'POINT_TO_LATEST') => {
    const busyKey = `HEAL:${brokenRef.serviceName}:${brokenRef.secretId}:${healStrategy}`;
    setSecretActionBusy(busyKey);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'HEAL_CLOUDRUN_SECRET_REF',
          secretId: brokenRef.secretId,
          serviceName: brokenRef.serviceName,
          region: brokenRef.region,
          envKey: brokenRef.envKey,
          healStrategy,
        }
      );
      if (onTriggerToast) {
        onTriggerToast(
          res.data?.message ||
            `Healed broken secret reference ${brokenRef.secretId} on ${brokenRef.serviceName}`
        );
      }
      await fetchVaultStudio();
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      if (onTriggerToast) {
        onTriggerToast(
          err.response?.data?.error ||
            `Failed to heal broken secret reference on ${brokenRef.serviceName}`
        );
      }
    } finally {
      setSecretActionBusy(null);
    }
  };

  const filteredFindings = (iamData?.findings || []).filter((f) => {
    if (iamFilter === 'CRITICAL' && f.severity !== 'CRITICAL') return false;
    if (iamFilter === 'HIGH' && f.severity !== 'HIGH') return false;
    if (iamFilter === 'JIT_ONLY' && !f.condition) return false;
    if (iamSearch.trim()) {
      const q = iamSearch.toLowerCase();
      return (
        f.role.toLowerCase().includes(q) ||
        f.member.toLowerCase().includes(q) ||
        f.riskLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Strict compliance locks for Secret Manager blueprint
  const isSecretCustom = secretBlueprint === 'custom';
  const isSecretGdpr = secretBlueprint === 'gdpr-sovereign';
  const isSecretSec = secretBlueprint === 'sec-finra-us';
  const isSecretHipaa = secretBlueprint === 'hipaa-vault';

  return (
    <div className="space-y-5">
      {/* Top Hero Banner */}
      <div className="rounded-[12px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#202124] p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-mono">
              <Sparkles className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>WAVE-7 SOVEREIGN ZERO-TRUST & MERKLE TIME-MACHINE STUDIO</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              Sovereign Cloud Time-Machine, IAM Least-Privilege Surgeon & GitOps Drift Radar
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-3xl">
              Live project IAM privilege-escalation surgery (`:getIamPolicy` / `:setIamPolicy` v3 with 24h auto-expiring JIT leases), SHA-256 Merkle-tree configuration drift detection across 6 GCP planes, and strict sovereign Secret Manager / KMS / Cloud Armor WAF provisioning.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (activeSubTab === 'IAM_SURGEON') fetchIamSurgeon();
                if (activeSubTab === 'TIME_MACHINE') fetchTimeMachine();
                if (activeSubTab === 'SECRETS_KMS_WAF') fetchVaultStudio();
              }}
              title="Refresh live Wave-7 Sovereign telemetry from Google Cloud REST APIs"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer transition-colors"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  loadingIam || loadingTm || loadingVault ? 'animate-spin text-zinc-500 dark:text-zinc-400' : ''
                }`}
              />
              <span>Sync Live State</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-800">
          {[
            {
              id: 'IAM_SURGEON',
              section: 'SPLIT',
              label: '1. Autonomous IAM Least-Privilege Surgeon',
              badge: iamData
                ? `${iamData.summary?.criticalCount || 0} Critical`
                : 'Live IAM v3',
              tip: 'Scan project IAM bindings for primitive Owner/Editor god-roles, attach 24h auto-expiring JIT IAM Conditions, and manage Service Account keys',
            },
            {
              id: 'IAM_SURGEON_SA_VAULT',
              targetTab: 'IAM_SURGEON',
              section: 'SA_VAULT',
              label: 'Service Account Keys, Tokens & Kill-Switch',
              badge: iamData
                ? `${iamData.userManagedKeys?.length || 0} Keys · ${iamData.serviceAccounts?.length || 0} SAs`
                : 'JSON & OAuth2',
              tip: 'Direct access to create, download, rotate, or revoke Service Account .json keys, mint 1h OAuth2 tokens, or freeze a compromised Service Account',
            },
            {
              id: 'TIME_MACHINE',
              label: '2. SHA-256 Cloud State Time-Machine & Drift Radar',
              badge: tmData
                ? tmData.inSync
                  ? 'SYNCED ✓'
                  : `${tmData.drifts?.length || 0} DRIFTS`
                : 'Merkle Diff',
              tip: 'Seal SHA-256 Merkle-signed snapshots of VMs, Cloud Run, Storage, BigQuery, Firewalls & IAM, detect out-of-band console tampering, and heal drift in 1 tap',
            },
            {
              id: 'SECRETS_KMS_WAF',
              label: '3. Sovereign Secret Manager, KMS & Cloud Armor WAF',
              badge: vaultData
                ? `${vaultData.secrets?.length || 0} Secrets`
                : 'Zero-Trust Vault',
              tip: 'Provision regionally-pinned GDPR/SEC/HIPAA secrets in Secret Manager, audit Cloud KMS rotation, and synthesize Cloud Armor OWASP Top-10 WAF policies',
            },
          ].map((tab) => {
            const active =
              tab.id === 'IAM_SURGEON_SA_VAULT'
                ? activeSubTab === 'IAM_SURGEON' && iamSectionView === 'SA_VAULT'
                : tab.id === 'IAM_SURGEON'
                ? activeSubTab === 'IAM_SURGEON' && iamSectionView !== 'SA_VAULT'
                : activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                title={tab.tip}
                onClick={() => {
                  if (tab.targetTab) {
                    setActiveSubTab(tab.targetTab);
                    setIamSectionView(tab.section);
                  } else {
                    setActiveSubTab(tab.id);
                    if (tab.section) setIamSectionView(tab.section);
                  }
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-bold transition-all cursor-pointer border ${
                  active
                    ? tab.id === 'IAM_SURGEON_SA_VAULT'
                      ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-md'
                      : 'bg-blue-600 text-white border-blue-400 shadow-md'
                    : 'bg-zinc-900/80 text-zinc-300 border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active
                      ? tab.id === 'IAM_SURGEON_SA_VAULT'
                        ? 'bg-black/20 text-zinc-950 font-extrabold'
                        : 'bg-black/30 text-blue-100'
                      : 'bg-zinc-800 text-zinc-400'
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
          TAB 1: AUTONOMOUS IAM LEAST-PRIVILEGE SURGEON
         ===================================================================== */}
      {activeSubTab === 'IAM_SURGEON' && (
        <div className="space-y-4">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]">
              <div className="text-[11px] font-mono text-zinc-500">
                IAM Least-Privilege Score
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  (iamData?.iamScore ?? 100) >= 80
                    ? 'text-emerald-500'
                    : (iamData?.iamScore ?? 100) >= 50
                    ? 'text-amber-500'
                    : 'text-red-500'
                }`}
              >
                {iamData ? `${iamData.iamScore}/100` : '...'}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Policy ETag: {iamData?.etag ? iamData.etag.slice(0, 10) : 'v3'}
              </div>
            </div>

            <div
              onClick={() => {
                setIamSectionView('ROLES');
                setIamFilter('CRITICAL');
              }}
              title="Click to inspect Critical God-Role bindings"
              className="p-3.5 rounded-[10px] border border-red-500/30 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors"
            >
              <div className="text-[11px] font-mono text-red-500">
                Critical God-Role Bindings
              </div>
              <div className="text-2xl font-black text-red-500 mt-1">
                {iamData?.summary?.criticalCount ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                roles/owner, roles/editor, allUsers
              </div>
            </div>

            <div
              onClick={() => {
                setIamSectionView('ROLES');
                setIamFilter('HIGH');
              }}
              title="Click to inspect Escalation & Wildcard Roles"
              className="p-3.5 rounded-[10px] border border-amber-500/30 bg-amber-500/5 cursor-pointer hover:bg-amber-500/10 transition-colors"
            >
              <div className="text-[11px] font-mono text-amber-500">
                Escalation & Wildcard Roles
              </div>
              <div className="text-2xl font-black text-amber-500 mt-1">
                {(iamData?.summary?.highCount ?? 0) +
                  (iamData?.summary?.mediumCount ?? 0)}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                TokenCreator / KeyAdmin / *Admin
              </div>
            </div>

            <div
              onClick={() => {
                setIamSectionView('ROLES');
                setIamFilter('JIT_ONLY');
              }}
              title="Click to inspect 24h JIT Condition Protected bindings"
              className="p-3.5 rounded-[10px] border border-blue-500/30 bg-blue-500/5 cursor-pointer hover:bg-blue-500/10 transition-colors"
            >
              <div className="text-[11px] font-mono text-blue-400">
                24h JIT Condition Protected
              </div>
              <div className="text-2xl font-black text-blue-400 mt-1">
                {iamData?.summary?.jitProtectedCount ?? 0}
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                Time-bounded CEL expressions
              </div>
            </div>

            <div
              onClick={() => setIamSectionView('SA_VAULT')}
              title="Click to open the Service Account .json Key, OAuth2 Token & Kill-Switch Vault"
              className={`p-3.5 rounded-[10px] border cursor-pointer transition-all ${
                iamSectionView === 'SA_VAULT'
                  ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400/50'
                  : 'border-amber-500/35 bg-amber-500/5 hover:bg-amber-500/10'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-mono text-amber-400 font-bold">
                  SA Keys & Tokens Vault
                </span>
                <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  Open →
                </span>
              </div>
              <div
                className={`text-2xl font-black mt-1 ${
                  (iamData?.summary?.userManagedKeysCount ?? 0) > 0
                    ? 'text-red-500'
                    : 'text-emerald-500'
                }`}
              >
                {iamData?.summary?.userManagedKeysCount ?? 0} Keys
              </div>
              <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                {iamData?.summary?.serviceAccountsCount ?? 0} SAs ·{' '}
                {iamData?.mintedTokens?.length ?? 0} Tokens
              </div>
            </div>
          </div>

          {/* Quick Section View Switcher Bar so IAM Roles never bury the Service Account Menu */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/90">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 px-1.5">
                Workspace View:
              </span>
              {[
                {
                  id: 'SPLIT',
                  label: 'Split View (Compact Roles + SA Key Vault)',
                },
                {
                  id: 'SA_VAULT',
                  label: `Service Account Key, Token & Kill-Switch Vault (${
                    iamData?.serviceAccounts?.length || 0
                  } SAs · ${iamData?.userManagedKeys?.length || 0} Keys)`,
                },
                {
                  id: 'ROLES',
                  label: `Full IAM Role Bindings (${filteredFindings.length})`,
                },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setIamSectionView(mode.id)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-mono font-bold transition-all cursor-pointer border ${
                    iamSectionView === mode.id
                      ? mode.id === 'SA_VAULT'
                        ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-sm'
                        : 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-300 border-zinc-300 dark:border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {iamSectionView === 'SPLIT' && filteredFindings.length > 3 && (
              <button
                type="button"
                onClick={() => setExpandAllIamRoles((v) => !v)}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-[11px] font-mono cursor-pointer"
              >
                {expandAllIamRoles
                  ? '▴ Collapse IAM Roles to Top 3'
                  : `▾ Show All ${filteredFindings.length} IAM Roles (Scrollable)`}
              </button>
            )}
          </div>

          {/* IAM Role Bindings Section (Hidden when focused purely on SA_VAULT) */}
          {iamSectionView !== 'SA_VAULT' && (
            <div className="space-y-3">
              {/* Filter & JIT Lease Duration Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    {
                      id: 'ALL',
                      label: `All Bindings (${iamData?.findings?.length || 0})`,
                    },
                    {
                      id: 'CRITICAL',
                      label: `Critical God-Roles (${iamData?.summary?.criticalCount || 0})`,
                    },
                    {
                      id: 'HIGH',
                      label: `Escalation Vectors (${iamData?.summary?.highCount || 0})`,
                    },
                    {
                      id: 'JIT_ONLY',
                      label: `Active JIT Leases (${iamData?.summary?.jitProtectedCount || 0})`,
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setIamFilter(f.id)}
                      className={`px-2.5 py-1.5 rounded-[8px] text-xs font-mono border cursor-pointer transition-colors ${
                        iamFilter === f.id
                          ? 'bg-blue-600 text-white border-blue-500 font-bold'
                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>JIT Lease Duration:</span>
                    {[4, 12, 24, 72].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setSelectedJitHours(h)}
                        title={`Configure 1-Tap Just-In-Time (JIT) IAM Condition to auto-expire after ${h} hours`}
                        className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer ${
                          selectedJitHours === h
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400 font-bold'
                            : 'border-zinc-300 dark:border-zinc-700 text-zinc-500'
                        }`}
                      >
                        {h}h
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={iamSearch}
                    onChange={(e) => setIamSearch(e.target.value)}
                    placeholder="Filter principal or role..."
                    className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* IAM Findings List (Compact & Scroll-Bounded in SPLIT mode so SA Vault stays visible) */}
              <div
                className={`space-y-2 ${
                  iamSectionView === 'SPLIT'
                    ? 'max-h-[340px] overflow-y-auto pr-1'
                    : ''
                }`}
              >
                {(iamSectionView === 'SPLIT' && !expandAllIamRoles
                  ? filteredFindings.slice(0, 3)
                  : filteredFindings
                ).map((item) => {
                  const isBusy = remediatingId === item.findingId;
                  const isProtectedOwner =
                    Boolean(item.isProtectedRootOwner) ||
                    item.severity === 'PROTECTED_OWNER';
                  const canJit =
                    !isProtectedOwner &&
                    item.canApplyJitCondition !== false &&
                    item.role !== 'roles/owner';
                  const badgeColor = isProtectedOwner
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : item.severity === 'CRITICAL'
                    ? 'bg-red-500/15 text-red-500 border-red-500/30'
                    : item.severity === 'HIGH'
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    : item.severity === 'MEDIUM'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                    : 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';

                  return (
                    <div
                      key={item.findingId}
                      className={`p-3 rounded-[10px] border space-y-1.5 ${
                        isProtectedOwner
                          ? 'border-emerald-500/35 bg-emerald-950/10 dark:bg-emerald-950/15'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314]'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${badgeColor}`}
                            >
                              {isProtectedOwner
                                ? 'SOVEREIGN ROOT OWNER · Protected Identity'
                                : `${item.severity} · Blast ${item.blastRadiusScore}/100`}
                            </span>
                            <span className="text-xs font-mono font-extrabold text-zinc-900 dark:text-zinc-100">
                              {item.role}
                            </span>
                            <span className="text-xs font-mono text-blue-500 dark:text-blue-400">
                              → {item.member}
                            </span>
                            {item.condition && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                                JIT Condition Active: {item.condition.title}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                            {item.riskLabel}
                          </div>
                          <p className="text-[11px] text-zinc-500">
                            {item.remediationReason}
                          </p>
                        </div>

                        {/* 1-Tap Surgical Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isProtectedOwner ? (
                            <span
                              title="Self-Lockout Guardrail: Your root Project Owner identity is protected from accidental privilege reduction or JIT expiration."
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>
                                Protected Root Owner (Lockout Guardrail Active)
                              </span>
                            </span>
                          ) : (
                            <>
                              {!item.condition && canJit && (
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() =>
                                    requestIamApproval(
                                      {
                                        action: 'APPLY_JIT_CONDITION',
                                        role: item.role,
                                        member: item.member,
                                        jitHours: selectedJitHours,
                                      },
                                      item.findingId,
                                      {
                                        riskLabel: item.riskLabel,
                                        remediationReason: item.remediationReason,
                                        recommendedAltRoles:
                                          item.recommendedAltRoles || [],
                                        blastRadiusScore: item.blastRadiusScore,
                                      }
                                    )
                                  }
                                  title={`Review & approve attaching a ${selectedJitHours}-hour auto-expiring CEL condition to ${item.role}`}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    Review {selectedJitHours}h JIT Lease...
                                  </span>
                                </button>
                              )}

                              {item.recommendedRole &&
                                item.recommendedRole !== item.role && (
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() =>
                                      requestIamApproval(
                                        {
                                          action: 'DOWNGRADE_ROLE',
                                          role: item.role,
                                          member: item.member,
                                          newRole: item.recommendedRole,
                                        },
                                        item.findingId,
                                        {
                                          riskLabel: item.riskLabel,
                                          remediationReason:
                                            item.remediationReason,
                                          recommendedAltRoles:
                                            item.recommendedAltRoles || [],
                                          blastRadiusScore: item.blastRadiusScore,
                                        }
                                      )
                                    }
                                    title={`Review & approve scoping ${item.member} from ${item.role} to least-privilege ${item.recommendedRole}`}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>
                                      Review Scope → {item.recommendedRole}...
                                    </span>
                                  </button>
                                )}

                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(
                                    item.gcloudDowngradeCli,
                                    'IAM surgery CLI'
                                  )
                                }
                                title="Copy reproducible gcloud IAM least-privilege remediation command"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-[11px] font-mono cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                              >
                                {copiedText === item.gcloudDowngradeCli ? (
                                  <Check className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                                <span>CLI</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {iamSectionView === 'SPLIT' && filteredFindings.length > 3 && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs font-mono text-zinc-400">
                  <span>
                    Showing{' '}
                    <strong className="text-zinc-200">
                      {expandAllIamRoles ? filteredFindings.length : 3}
                    </strong>{' '}
                    of{' '}
                    <strong className="text-zinc-200">
                      {filteredFindings.length}
                    </strong>{' '}
                    IAM role bindings so the Service Account Vault below stays accessible.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandAllIamRoles((v) => !v)}
                      className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-blue-300 font-bold cursor-pointer"
                    >
                      {expandAllIamRoles
                        ? 'Collapse to Top 3 ▴'
                        : `Show All ${filteredFindings.length} Roles ▾`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIamSectionView('ROLES')}
                      className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold cursor-pointer"
                    >
                      Full Roles View →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              SERVICE ACCOUNT KEY, OAUTH2 TOKEN & STOLEN-CREDENTIAL KILL-SWITCH
             ================================================================= */}
          {iamSectionView !== 'ROLES' && (
          <div className="p-4 rounded-[12px] border border-amber-200 dark:border-amber-500/35 bg-amber-50/40 dark:bg-zinc-900/90 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <KeyRound className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span className="text-sm font-extrabold text-white">
                    Service Account `.json` Key, OAuth2 Token & Stolen-Credential Kill-Switch Vault
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                    {iamData?.userManagedKeys?.length || 0} Active JSON Keys ·{' '}
                    {iamData?.mintedTokens?.length || 0} Minted Tokens
                  </span>
                </div>
                <p className="text-xs text-zinc-400 max-w-4xl">
                  Create and download Service Account <code className="text-amber-300 font-mono">.json</code> key files or 1-hour OAuth2 tokens, re-download existing keys, or immediately **Revoke / Rotate / Freeze** a compromised Service Account if a credential file is ever leaked or stolen.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateSaForm((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {showCreateSaForm
                    ? 'Close Least-Privilege SA Architect'
                    : '+ Architect Least-Privilege Service Account'}
                </span>
              </button>
            </div>

            {/* Dedicated Least-Privilege Service Account Architect */}
            {showCreateSaForm && (
              <form
                onSubmit={handleCreateServiceAccount}
                className="p-4 rounded-xl bg-zinc-950/95 border border-amber-500/40 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                  <div>
                    <div className="text-xs font-extrabold font-mono text-amber-300">
                      Least-Privilege Service Account Architect (`iam.googleapis.com`)
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Never use the default Compute Engine Service Account (`*-compute@developer.gserviceaccount.com`) with `roles/editor`. Create a dedicated identity here with explicit, minimal IAM roles — it will immediately appear in Cloud Run, Compute VM & GKE `iam.serviceAccounts.actAs` selectors.
                    </p>
                  </div>

                  {/* Workload Least-Privilege Presets */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 mr-1">
                      Blueprint:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplySaRolePreset('ZERO')}
                      className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-200 cursor-pointer"
                    >
                      Zero Roles (Strictest)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySaRolePreset('CLOUD_RUN')}
                      className="px-2 py-1 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-[10px] font-mono text-blue-300 cursor-pointer"
                    >
                      Cloud Run Runtime
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySaRolePreset('VM_GKE')}
                      className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 cursor-pointer"
                    >
                      Compute VM / GKE Node
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySaRolePreset('DATA_PIPELINE')}
                      className="px-2 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-[10px] font-mono text-purple-300 cursor-pointer"
                    >
                      Data Pipeline Worker
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-300 mb-1">
                      1. Account ID (`6-28 lowercase chars`) *
                    </label>
                    <input
                      type="text"
                      value={newSaAccountId}
                      onChange={(e) => setNewSaAccountId(e.target.value)}
                      placeholder="e.g. cloudrun-prod-runtime"
                      className="w-full h-[34px] bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs font-mono text-white"
                    />
                    <div className="text-[10px] font-mono text-zinc-500 mt-1 truncate">
                      {newSaAccountId.trim()
                        ? `${newSaAccountId
                            .trim()
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-')}@${projectId}.iam.gserviceaccount.com`
                        : `<account-id>@${projectId}.iam.gserviceaccount.com`}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-300 mb-1">
                      2. Display Name
                    </label>
                    <input
                      type="text"
                      value={newSaDisplayName}
                      onChange={(e) => setNewSaDisplayName(e.target.value)}
                      placeholder="e.g. Cloud Run Production Runtime SA"
                      className="w-full h-[34px] bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs font-mono text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-300 mb-1">
                      3. Audit Purpose / Description
                    </label>
                    <input
                      type="text"
                      value={newSaDescription}
                      onChange={(e) => setNewSaDescription(e.target.value)}
                      placeholder="Why this Service Account exists"
                      className="w-full h-[34px] bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Explicit Least-Privilege IAM Role Checkboxes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono text-zinc-300">
                      4. Explicit Least-Privilege IAM Roles (`roles/owner` & `roles/editor` are blocked by policy)
                    </label>
                    <span className="text-[10.5px] font-mono text-amber-300">
                      {newSaRoles.length === 0
                        ? 'Zero project-wide roles selected (Strictest)'
                        : `${newSaRoles.length} scoped role(s) selected`}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      {
                        role: 'roles/logging.logWriter',
                        title: 'Logs Writer',
                        desc: 'Write container/VM logs to Cloud Logging',
                      },
                      {
                        role: 'roles/monitoring.metricWriter',
                        title: 'Monitoring Metric Writer',
                        desc: 'Export latency & CPU telemetry',
                      },
                      {
                        role: 'roles/secretmanager.secretAccessor',
                        title: 'Secret Manager Accessor',
                        desc: 'Read mounted Secret Manager secrets',
                      },
                      {
                        role: 'roles/artifactregistry.reader',
                        title: 'Artifact Registry Reader',
                        desc: 'Pull private container images',
                      },
                      {
                        role: 'roles/storage.objectViewer',
                        title: 'Storage Object Viewer',
                        desc: 'Read-only access to GCS buckets',
                      },
                      {
                        role: 'roles/cloudsql.client',
                        title: 'Cloud SQL Client',
                        desc: 'Connect via Cloud SQL Auth Proxy',
                      },
                      {
                        role: 'roles/pubsub.publisher',
                        title: 'Pub/Sub Publisher',
                        desc: 'Publish events to Pub/Sub topics',
                      },
                      {
                        role: 'roles/bigquery.jobUser',
                        title: 'BigQuery Job User',
                        desc: 'Run scoped BigQuery queries',
                      },
                    ].map((item) => {
                      const checked = newSaRoles.includes(item.role);
                      return (
                        <label
                          key={item.role}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition flex items-start gap-2 ${
                            checked
                              ? 'bg-amber-500/15 border-amber-500/50 text-white'
                              : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleNewSaRole(item.role)}
                            className="mt-0.5 accent-amber-400"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-mono font-bold truncate">
                              {item.title}
                            </div>
                            <div className="text-[10px] font-mono text-amber-300/90 truncate">
                              {item.role}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">
                              {item.desc}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[10.5px] font-mono text-zinc-400">
                    ✓ Once created, this Service Account is immediately selectable in **Cloud Run**, **Compute VM**, **GKE**, and **Provision Resource** (`iam.serviceAccounts.actAs`).
                  </span>
                  <button
                    type="submit"
                    disabled={saActionBusy || newSaAccountId.trim().length < 6}
                    className="h-[36px] px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    {saActionBusy
                      ? 'Provisioning SA & Binding Scoped Roles...'
                      : `Provision Custom SA (${newSaRoles.length} Scoped Roles)`}
                  </button>
                </div>
              </form>
            )}

            {/* Quick Mint & Download Bar: Pick Service Account -> Grant actAs, Download .json Key, or 1h OAuth2 Token */}
            <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-end">
              <div className="lg:col-span-5 min-w-0">
                <label className="block text-[11px] font-mono text-amber-300 mb-1 truncate">
                  Target Service Account (`iam.googleapis.com`)
                </label>
                <select
                  value={selectedSaEmail}
                  onChange={(e) => setSelectedSaEmail(e.target.value)}
                  className="w-full h-[36px] bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 text-xs font-mono text-white"
                >
                  {(iamData?.serviceAccounts || []).length === 0 ? (
                    <option value="">No Service Accounts found — Create one above</option>
                  ) : (
                    (iamData?.serviceAccounts || []).map((sa) => (
                      <option key={sa.email} value={sa.email}>
                        {sa.disabled ? '[FROZEN] ' : ''}
                        {sa.email} ({sa.userManagedKeys?.length || 0} keys)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="button"
                  disabled={saActionBusy || !selectedSaEmail}
                  onClick={async () => {
                    if (!selectedSaEmail) return;
                    setSaActionBusy(true);
                    try {
                      const res = await axios.post(
                        `/api/project/${encodeURIComponent(
                          projectId
                        )}/service-accounts/grant-act-as`,
                        { serviceAccountEmail: selectedSaEmail }
                      );
                      if (onTriggerToast) {
                        onTriggerToast(
                          res.data?.message ||
                            `Granted iam.serviceAccounts.actAs on ${selectedSaEmail}`
                        );
                      }
                      await fetchIamSurgeon();
                    } catch (err) {
                      if (onTriggerToast) {
                        onTriggerToast(
                          err.response?.data?.error ||
                            'Failed to bind roles/iam.serviceAccountUser'
                        );
                      }
                    } finally {
                      setSaActionBusy(false);
                    }
                  }}
                  title="Bind resource-level roles/iam.serviceAccountUser (iam.serviceAccounts.actAs) on this Service Account so you can deploy Cloud Run, VM, and GKE workloads with it"
                  className="w-full h-[36px] px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Grant `actAs`</span>
                </button>
              </div>

              <div className="lg:col-span-3">
                <button
                  type="button"
                  disabled={saActionBusy || !selectedSaEmail}
                  onClick={() => handleCreateAndDownloadSaKey(selectedSaEmail)}
                  title="Mint a new RSA-2048 Service Account JSON key file on Google Cloud IAM and immediately download the .json credentials file"
                  className="w-full h-[36px] px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-extrabold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Create & Download `.json` Key</span>
                </button>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="button"
                  disabled={saActionBusy || !selectedSaEmail}
                  onClick={() => handleMintSaToken(selectedSaEmail)}
                  title="Mint a short-lived 1-hour OAuth2 Bearer access token for this Service Account and download it"
                  className="w-full h-[36px] px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mint & Download 1h Token</span>
                </button>
              </div>
            </div>

            {/* 1. Created Service Account JSON Keys List (Download, Rotate, or Revoke Stolen File) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono text-zinc-200">
                  1. Created Service Account `.json` Key Files ({iamData?.userManagedKeys?.length || 0})
                </span>
                <span className="text-[10.5px] font-mono text-zinc-400">
                  Stolen `.json` file? Click **Rotate** or **Revoke** to kill the credential in Google Cloud IAM immediately
                </span>
              </div>

              {(iamData?.userManagedKeys || []).length === 0 ? (
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs font-mono text-zinc-400">
                  ✓ Zero static Service Account `.json` keys currently active. Click **"Create & Download `.json` Key"** above if you need a downloadable key file, or test revoking a stolen key!
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {iamData.userManagedKeys.map((k) => (
                    <div
                      key={k.name}
                      className="p-3 rounded-xl border border-red-500/35 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 text-xs font-mono min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white truncate">
                            {k.serviceAccountEmail}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Key ID: {k.keyId?.slice(0, 12)}...
                          </span>
                          {k.hasVaultPrivateKey && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ✓ Full Private `.json` in Session Vault
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-zinc-400">
                          Created: {k.validAfterTime ? new Date(k.validAfterTime).toLocaleString() : 'Live'} · Age: {k.ageDays}d · Alg: {k.keyAlgorithm}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={saActionBusy}
                          onClick={() =>
                            handleDownloadExistingSaKey(
                              k.name,
                              k.serviceAccountEmail
                            )
                          }
                          title="Download this Service Account key (.json private credentials if created in this session, or X.509 PEM public certificate metadata)"
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-[11px] font-mono font-bold cursor-pointer"
                        >
                          ⬇Download `.json`
                        </button>

                        <button
                          type="button"
                          disabled={saActionBusy}
                          onClick={() =>
                            requestIamApproval(
                              {
                                action: 'ROTATE_SA_KEY',
                                keyName: k.name,
                                serviceAccountEmail: k.serviceAccountEmail,
                              },
                              k.name,
                              {
                                serviceAccountEmail: k.serviceAccountEmail,
                                keyId: k.keyId,
                                ageDays: k.ageDays,
                              }
                            )
                          }
                          title="Mint & download a brand-new .json key and atomically revoke this compromised key"
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-mono font-bold cursor-pointer"
                        >
                          Rotate & Download New `.json`...
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            requestIamApproval(
                              { action: 'DELETE_SA_KEY', keyName: k.name },
                              k.name,
                              {
                                serviceAccountEmail: k.serviceAccountEmail,
                                keyId: k.keyId,
                                ageDays: k.ageDays,
                              }
                            )
                          }
                          title="Review & approve permanently revoking this stolen Service Account JSON key"
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke Stolen Key...</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Created Short-Lived OAuth2 Tokens List (Copy, Download, or Revoke) */}
            {(iamData?.mintedTokens || []).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-blue-300">
                    2. Created Short-Lived OAuth2 Access Tokens ({iamData.mintedTokens.length})
                  </span>
                  <span className="text-[10.5px] font-mono text-zinc-400">
                    Copy Bearer token, download `.json`, or revoke immediately
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {iamData.mintedTokens.map((t) => (
                    <div
                      key={t.tokenId}
                      className="p-3 rounded-xl border border-blue-500/35 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 text-xs font-mono min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-white">
                            {t.serviceAccountEmail}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {t.tokenId}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-zinc-400">
                          Token: <code className="text-emerald-300">{t.accessTokenPreview}</code> · Expires: {new Date(t.expireTime).toLocaleTimeString()}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(t.accessToken, `OAuth2 token ${t.tokenId}`)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-[11px] font-mono font-bold cursor-pointer"
                        >
                          Copy Bearer Token
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            triggerJsonFileDownload(
                              `${projectId}-${t.tokenId}.json`,
                              JSON.stringify(t, null, 2)
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-[11px] font-mono font-bold cursor-pointer"
                        >
                          ⬇Download `.json`
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            requestIamApproval(
                              {
                                action: 'REVOKE_SA_TOKEN',
                                tokenId: t.tokenId,
                                serviceAccountEmail: t.serviceAccountEmail,
                              },
                              t.tokenId,
                              {
                                serviceAccountEmail: t.serviceAccountEmail,
                                tokenId: t.tokenId,
                              }
                            )
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-mono font-bold cursor-pointer inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke Token...</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Service Account Emergency Kill-Switch Directory (Freeze/Unfreeze Entire Bot) */}
            {(iamData?.serviceAccounts || []).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-zinc-300">
                    3. Service Account Emergency Freeze Switch ({iamData.serviceAccounts.length} Accounts)
                  </span>
                  <span className="text-[10.5px] font-mono text-zinc-400">
                    Freezing a Service Account (`:disable`) blocks ALL its keys & tokens simultaneously without deleting the account
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {iamData.serviceAccounts.map((sa) => (
                    <div
                      key={sa.email}
                      className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-zinc-100 truncate">
                          {sa.email}
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          {sa.disabled ? (
                            <span className="text-red-400 font-bold">
                              FROZEN (DISABLED)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold">
                              ● ACTIVE
                            </span>
                          )}{' '}
                          · {sa.userManagedKeys?.length || 0} user-managed key(s)
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          requestIamApproval(
                            {
                              action: 'TOGGLE_SA_DISABLED',
                              serviceAccountEmail: sa.email,
                              disable: !sa.disabled,
                            },
                            sa.email,
                            {
                              serviceAccountEmail: sa.email,
                              disable: !sa.disabled,
                            }
                          )
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer shrink-0 border ${
                          sa.disabled
                            ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-600/30'
                            : 'bg-red-600/20 text-red-300 border-red-500/40 hover:bg-red-600/30'
                        }`}
                      >
                        {sa.disabled ? '✓ Re-Enable SA...' : 'Freeze SA...'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. 1-Click Keyless GitHub Actions OIDC Workload Identity Federation Architect ("Kill the .json Key Forever") */}
            <div className="space-y-2.5 pt-3 border-t border-zinc-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono text-emerald-300">
                    4. Keyless GitHub Actions OIDC Workload Identity Federation Architect ("Kill the `.json` Key Forever")
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  $0.00/mo · Zero Static Keys Stored in GitHub
                </span>
              </div>

              <p className="text-[11px] text-zinc-400">
                Instead of pasting static `.json` Service Account keys into GitHub Secrets, provision a live Google Cloud **Workload Identity Pool** (`cloudpulse-github-pool`), **GitHub OIDC Provider** (`https://token.actions.githubusercontent.com`), and repository-pinned `roles/iam.workloadIdentityUser` binding in 1 click.
              </p>

              <form
                onSubmit={handleProvisionGithubOidcWif}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={githubRepoSlug}
                    onChange={(e) => setGithubRepoSlug(e.target.value)}
                    placeholder="GitHub owner/repository (e.g. my-org/cloudpulse-api)"
                    className="w-full h-[36px] bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs font-mono text-white"
                  />
                </div>
                <div className="sm:col-span-4">
                  <div className="h-[36px] px-3 rounded-lg bg-zinc-900/70 border border-zinc-800 flex items-center text-[11px] font-mono text-zinc-300 truncate">
                    Target SA: {selectedSaEmail || iamData?.serviceAccounts?.[0]?.email || 'Select SA above'}
                  </div>
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={wifBusy || !githubRepoSlug.trim()}
                    className="w-full h-[36px] px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-mono font-extrabold cursor-pointer"
                  >
                    {wifBusy
                      ? 'Provisioning OIDC Pool...'
                      : 'Provision Keyless GitHub OIDC'}
                  </button>
                </div>
              </form>

              {wifResult && (
                <div className="p-3 rounded-xl bg-emerald-950/25 border border-emerald-500/40 space-y-2 text-xs font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-extrabold text-emerald-300">
                      ✓ Keyless OIDC Provider Ready for `{wifResult.githubRepo}` → `{wifResult.serviceAccountEmail}`
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {wifResult.gcloudCliScript && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              wifResult.gcloudCliScript,
                              'gcloud OIDC Pool & Provider CLI'
                            )
                          }
                          className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-[10.5px] font-bold cursor-pointer"
                        >
                          Copy `gcloud` OIDC CLI
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            wifResult.githubActionsYaml,
                            'GitHub Actions OIDC YAML snippet'
                          )
                        }
                        className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10.5px] font-bold cursor-pointer"
                      >
                        Copy GitHub Actions `.yml` Snippet
                      </button>
                    </div>
                  </div>
                  <div className="text-[10.5px] text-zinc-300 break-all">
                    Provider Resource: <code className="text-blue-300">{wifResult.providerResourceName}</code>
                  </div>
                  {(wifResult.stepsCompleted || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {wifResult.stepsCompleted.map((st, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px]"
                        >
                          ✓ {st}
                        </span>
                      ))}
                    </div>
                  )}
                  <pre className="p-2.5 rounded-lg bg-black/90 border border-zinc-800 text-[10.5px] text-emerald-200 overflow-x-auto">
                    {wifResult.githubActionsYaml}
                  </pre>
                </div>
              )}
            </div>
          </div>
          )}

          {/* TWO-STEP IAM SURGERY APPROVAL & BEFORE/AFTER POLICY DIFF MODAL */}
          {pendingIamApproval && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-zinc-950 text-zinc-100 shadow-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      <span>MANDATORY IAM CHANGE APPROVAL & IMPACT REVIEW</span>
                    </div>
                    <h3 className="text-base font-extrabold text-white">
                      {pendingIamApproval.payload.action === 'DOWNGRADE_ROLE'
                        ? 'Approve Scoping Down IAM Privilege (:setIamPolicy)'
                        : pendingIamApproval.payload.action ===
                          'APPLY_JIT_CONDITION'
                        ? `Approve ${pendingIamApproval.payload.jitHours}-Hour Auto-Expiring JIT IAM Lease`
                        : pendingIamApproval.payload.action === 'ROTATE_SA_KEY'
                        ? 'Approve Service Account Key Rotation (Mint Fresh .json + Revoke Old)'
                        : pendingIamApproval.payload.action === 'REVOKE_SA_TOKEN'
                        ? 'Approve Immediate OAuth2 Access Token Revocation'
                        : pendingIamApproval.payload.action ===
                          'TOGGLE_SA_DISABLED'
                        ? pendingIamApproval.payload.disable
                          ? 'Approve Emergency Service Account Freeze (:disable)'
                          : 'Approve Re-Enabling Service Account (:enable)'
                        : 'Approve Permanent Service Account JSON Key Revocation'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      No IAM policy or credential mutation is ever executed without your explicit review and confirmation. Inspect the exact impact below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingIamApproval(null)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-mono cursor-pointer"
                  >
                    ✕ Cancel
                  </button>
                </div>

                {/* Principal & Action Summary */}
                <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Target GCP Project:</span>
                    <span className="font-bold text-amber-400">{projectId}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Target Principal:</span>
                    <span className="font-bold text-blue-300 break-all">
                      {pendingIamApproval.payload.member ||
                        pendingIamApproval.payload.serviceAccountEmail ||
                        pendingIamApproval.meta?.serviceAccountEmail}
                    </span>
                  </div>
                </div>

                {/* Before vs After IAM Binding Diff */}
                {pendingIamApproval.payload.action === 'DOWNGRADE_ROLE' ||
                pendingIamApproval.payload.action === 'APPLY_JIT_CONDITION' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 space-y-1">
                      <div className="text-[10px] font-bold text-red-400 uppercase">
                        BEFORE (Current IAM Binding)
                      </div>
                      <div className="font-extrabold text-red-200">
                        {pendingIamApproval.payload.role}
                      </div>
                      <div className="text-[10.5px] text-zinc-400">
                        Unconditional permanent project-wide binding
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1">
                      <div className="text-[10px] font-bold text-emerald-400 uppercase">
                        AFTER (Proposed IAM Binding)
                      </div>
                      {pendingIamApproval.payload.action === 'DOWNGRADE_ROLE' ? (
                        <>
                          <div className="font-extrabold text-emerald-200">
                            {approvalCustomRole ||
                              pendingIamApproval.payload.newRole}
                          </div>
                          <div className="text-[10.5px] text-zinc-300">
                            Scoped least-privilege role replacement
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-extrabold text-emerald-200">
                            {pendingIamApproval.payload.role} (JIT Condition)
                          </div>
                          <div className="text-[10.5px] text-zinc-300">
                            Auto-expires after{' '}
                            {pendingIamApproval.payload.jitHours} hours via CEL
                            timestamp condition
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/40 text-xs font-mono space-y-1">
                    <div className="text-red-300 font-bold">
                      Security Credential Action Impact:
                    </div>
                    <div className="text-zinc-300">
                      {pendingIamApproval.payload.action === 'ROTATE_SA_KEY'
                        ? `A fresh RSA-2048 .json key will be minted and downloaded to your browser, and old key ${pendingIamApproval.payload.keyName} will be permanently deleted from IAM.`
                        : pendingIamApproval.payload.action === 'REVOKE_SA_TOKEN'
                        ? `Short-lived OAuth2 token ${pendingIamApproval.payload.tokenId} will be immediately revoked via Google OAuth2 revocation.`
                        : pendingIamApproval.payload.action ===
                          'TOGGLE_SA_DISABLED'
                        ? pendingIamApproval.payload.disable
                          ? `Service Account ${pendingIamApproval.payload.serviceAccountEmail} will be FROZEN (:disable). All stolen keys and tokens for this Service Account will stop working immediately.`
                          : `Service Account ${pendingIamApproval.payload.serviceAccountEmail} will be re-enabled (:enable).`
                        : `Key ${pendingIamApproval.payload.keyName} will be permanently deleted from IAM. Any external attacker or workload using this stolen JSON file will immediately lose access.`}
                    </div>
                  </div>
                )}

                {/* Optional Alternative Role Picker when Scoping Down */}
                {pendingIamApproval.payload.action === 'DOWNGRADE_ROLE' && (
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-mono text-zinc-400">
                      Select or Customize Replacement Role Before Approving:
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {[
                        pendingIamApproval.payload.newRole,
                        ...(pendingIamApproval.meta?.recommendedAltRoles || []),
                      ]
                        .filter(Boolean)
                        .map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setApprovalCustomRole(r)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer border ${
                              approvalCustomRole === r
                                ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-emerald-500/40'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                    </div>
                    <input
                      type="text"
                      value={approvalCustomRole}
                      onChange={(e) => setApprovalCustomRole(e.target.value)}
                      className="w-full h-[34px] bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-xs font-mono text-white"
                      placeholder="roles/..."
                    />
                  </div>
                )}

                {/* Instant Rollback CLI Rescue Command */}
                {pendingIamApproval.payload.role && (
                  <div className="space-y-1">
                    <div className="text-[10.5px] font-mono text-zinc-400">
                      1-Command Instant Rollback (Save this if you ever want to restore the original role):
                    </div>
                    <pre className="p-2.5 rounded-xl bg-black border border-zinc-800 text-[10.5px] font-mono text-blue-300 overflow-x-auto">
                      {`gcloud projects add-iam-policy-binding ${projectId} --member="${pendingIamApproval.payload.member}" --role="${pendingIamApproval.payload.role}"`}
                    </pre>
                  </div>
                )}

                {/* Mandatory Approval Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={approvalChecked}
                    onChange={(e) => setApprovalChecked(e.target.checked)}
                    className="mt-0.5 accent-amber-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-amber-200 leading-snug">
                    I have reviewed the IAM security impact above and explicitly approve applying this change to project{' '}
                    <strong className="font-mono">{projectId}</strong>.
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setPendingIamApproval(null)}
                    className="px-4 py-2 rounded-xl text-xs font-mono border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      !approvalChecked ||
                      Boolean(remediatingId)
                    }
                    onClick={handleConfirmIamRemediate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer disabled:opacity-40"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {remediatingId
                        ? 'Applying Approved Change...'
                        : '✓ Approve & Execute IAM Change'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: CRYPTOGRAPHIC CLOUD STATE TIME-MACHINE & GITOPS DRIFT RADAR
         ===================================================================== */}
      {activeSubTab === 'TIME_MACHINE' && (
        <div className="space-y-4">
          {/* Merkle Root Comparison Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">
                  SIGNED BASELINE SNAPSHOT MERKLE ROOT
                </span>
                <Lock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div className="text-sm font-mono font-black text-blue-500 dark:text-blue-400 truncate">
                {tmData?.baselineSnapshot?.merkleRootShort || '0x...'}
              </div>
              <div className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200">
                {tmData?.baselineSnapshot?.label || 'Genesis Baseline'}
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                SHA-256: {tmData?.baselineSnapshot?.sha256?.slice(0, 28)}...
              </div>
            </div>

            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-500">
                  LIVE GCP INFRASTRUCTURE MERKLE ROOT
                </span>
                <Fingerprint className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              </div>
              <div
                className={`text-sm font-mono font-black truncate ${
                  tmData?.inSync ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {tmData?.liveState?.merkleRootShort || '0x...'}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    tmData?.inSync
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  {tmData?.inSync
                    ? '✓ ZERO OUT-OF-BAND DRIFT (100% MERKLE MATCH)'
                    : `${tmData?.drifts?.length || 0} CONFIGURATION DRIFTS DETECTED`}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-500">
                6 Planes: VMs ({tmData?.liveState?.counts?.vms || 0}) · Run (
                {tmData?.liveState?.counts?.cloudRun || 0}) · GCS (
                {tmData?.liveState?.counts?.buckets || 0}) · BQ (
                {tmData?.liveState?.counts?.datasets || 0}) · FW (
                {tmData?.liveState?.counts?.firewalls || 0})
              </div>
            </div>

            {/* Seal New Checkpoint or Trigger Drift Drill */}
            <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-2.5">
              <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                Seal Immutable SHA-256 Checkpoint & Chaos Drift Drill
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSnapshotLabel}
                  onChange={(e) => setNewSnapshotLabel(e.target.value)}
                  placeholder="Checkpoint name (e.g. Prod v3.2 Anchor)..."
                  className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  disabled={tmActionBusy}
                  onClick={() =>
                    handleTimeMachineAction('SEAL_SNAPSHOT', newSnapshotLabel)
                  }
                  title="Capture and sign a new SHA-256 Merkle snapshot of your entire live GCP project"
                  className="px-3 py-1.5 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  Seal Snapshot
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={tmActionBusy}
                  onClick={() =>
                    handleTimeMachineAction('SIMULATE_DRIFT_DRILL')
                  }
                  title="Simulate an out-of-band console tampering event (rogue 0.0.0.0/0 SSH firewall + bucket Soft-Delete tampering + BigQuery LOGICAL billing regression) to test the Drift Radar"
                  className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-bold cursor-pointer"
                >
                  Inject Out-of-Band Drift Drill
                </button>
                {!tmData?.inSync && (
                  <button
                    type="button"
                    disabled={tmActionBusy}
                    onClick={() => handleTimeMachineAction('HEAL_DRIFT')}
                    title="Reconcile and heal all detected configuration drift back to the signed SHA-256 baseline snapshot"
                    className="flex-1 px-2.5 py-1.5 rounded-[8px] bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-mono font-bold cursor-pointer"
                  >
                    1-Tap Heal Drift to Baseline
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Snapshot Timeline Selector */}
          {tmData?.snapshots?.length > 0 && (
            <div className="p-3 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                <span>Compare Live State Against Snapshot:</span>
              </span>
              {tmData.snapshots.map((snap) => {
                const active =
                  (selectedBaselineId ||
                    tmData.baselineSnapshot?.snapshotId) === snap.snapshotId;
                return (
                  <button
                    key={snap.snapshotId}
                    type="button"
                    onClick={() => {
                      setSelectedBaselineId(snap.snapshotId);
                      fetchTimeMachine(snap.snapshotId);
                    }}
                    className={`px-2.5 py-1 rounded-[8px] text-xs font-mono border cursor-pointer transition-all ${
                      active
                        ? 'bg-blue-600 text-white border-blue-400 font-bold'
                        : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {snap.merkleRootShort} · {snap.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Side-by-Side Drift Diff Cards */}
          {tmData?.drifts?.length > 0 ? (
            <div className="space-y-2.5">
              {tmData.drifts.map((d) => (
                <div
                  key={d.driftId}
                  className="p-3.5 rounded-[10px] border border-red-500/35 bg-red-950/10 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold">
                        {d.type} · {d.severity}
                      </span>
                      <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                        {d.planeLabel}: {d.resourceId}
                      </span>
                      <span className="text-xs font-mono text-zinc-500">
                        (Field: `{d.field}`)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(d.healCli, 'Drift rollback CLI')}
                      title="Copy exact gcloud/bq command to roll this drifted property back to the signed baseline snapshot"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-zinc-900 text-zinc-200 border border-zinc-700 text-[11px] font-mono cursor-pointer hover:bg-zinc-800"
                    >
                      {copiedText === d.healCli ? (
                        <Check className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      ) : (
                        <Terminal className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      )}
                      <span>Copy Rollback CLI</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                    <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                      <div className="text-[10px] text-emerald-400 font-bold mb-0.5">
                        ✓ SIGNED SNAPSHOT BASELINE (EXPECTED)
                      </div>
                      <div className="break-all">{d.beforeValue}</div>
                    </div>
                    <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300">
                      <div className="text-[10px] text-red-400 font-bold mb-0.5">
                        CURRENT LIVE GCP STATE (DRIFTED)
                      </div>
                      <div className="break-all">{d.afterValue}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-[10px] border border-emerald-500/30 bg-emerald-950/10 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-zinc-500 dark:text-zinc-400 mx-auto" />
              <div className="text-sm font-extrabold text-emerald-400">
                100% Cryptographic Merkle State Integrity Verified
              </div>
              <p className="text-xs text-zinc-400 max-w-xl mx-auto">
                Every Compute VM, Cloud Run service, Cloud Storage bucket, BigQuery dataset, VPC Firewall rule, and IAM binding matches the signed SHA-256 baseline snapshot (`{tmData?.baselineSnapshot?.merkleRootShort}`). Click **"Inject Out-of-Band Drift Drill"** above to test live drift detection and rollback!
              </p>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: SOVEREIGN SECRET MANAGER, KMS & CLOUD ARMOR WAF STUDIO
         ===================================================================== */}
      {activeSubTab === 'SECRETS_KMS_WAF' && (
        <div className="space-y-4">
          {/* Top FinOps Free-Tier & Pricing Transparency Banner for Secret Manager */}
          {(() => {
            const fin = vaultData?.finopsSummary || {
              freeTierActiveVersionsLimit: 6,
              freeTierAccessOpsLimit: 10000,
              freeTierRotationsLimit: 3,
              totalSecrets: vaultData?.secrets?.length || 0,
              totalEnabledVersions: 0,
              totalDisabledOrDestroyedVersions: 0,
              freeVersionsRemaining: 6,
              billableActiveVersions: 0,
              estimatedMonthlyUsd: 0,
              withinFreeTier: true,
            };
            const pctUsed = Math.min(
              100,
              Math.round(
                ((fin.totalEnabledVersions || 0) /
                  (fin.freeTierActiveVersionsLimit || 6)) *
                  100
              )
            );

            return (
              <div
                className={`p-4 rounded-[10px] border space-y-3 ${
                  fin.withinFreeTier
                    ? 'bg-emerald-500/[0.06] border-emerald-500/35'
                    : 'bg-amber-500/[0.08] border-amber-500/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <KeyRound
                      className={`w-4 h-4 ${
                        fin.withinFreeTier
                          ? 'text-emerald-500'
                          : 'text-amber-500'
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                      Secret Manager FinOps Free-Tier Meter & Lifecycle Surgeon (
                      `secretmanager.googleapis.com/v1`)
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-extrabold border ${
                        fin.withinFreeTier
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                          : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {fin.withinFreeTier
                        ? `100% INSIDE FREE TIER (${fin.totalEnabledVersions} / ${fin.freeTierActiveVersionsLimit} Free Active Versions Used · $0.00/mo)`
                        : `PAID TIER ACTIVE (${fin.totalEnabledVersions} Active Versions · ${fin.billableActiveVersions} Billable @ $0.06 = ~$${Number(
                            fin.estimatedMonthlyUsd || 0
                          ).toFixed(2)}/mo)`}
                    </span>
                  </div>
                </div>

                {/* Quota Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10.5px] font-mono text-zinc-600 dark:text-zinc-300">
                    <span>
                      Active (`ENABLED`) Secret Versions:{' '}
                      <strong>{fin.totalEnabledVersions}</strong> of{' '}
                      <strong>{fin.freeTierActiveVersionsLimit} FREE/mo</strong>{' '}
                      ({fin.freeVersionsRemaining} free slot(s) remaining)
                    </span>
                    <span>
                      Disabled / Destroyed Versions:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {fin.totalDisabledOrDestroyedVersions} ($0.00/mo)
                      </strong>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${pctUsed}%` }}
                      className={`h-full transition-all duration-300 ${
                        fin.withinFreeTier ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>
                </div>

                {/* 4-Pillar FinOps Pricing Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 text-[10.5px] font-mono">
                  <div className="p-2.5 rounded-[8px] bg-white/85 dark:bg-zinc-950/75 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[9.5px] uppercase text-emerald-600 dark:text-emerald-400 font-bold">
                      1. Monthly Free Tier (Always $0)
                    </div>
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      6 Active Versions FREE / mo
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      + 10,000 Access Ops FREE + 3 Rotations FREE per billing account.
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[8px] bg-white/85 dark:bg-zinc-950/75 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[9.5px] uppercase text-amber-600 dark:text-amber-400 font-bold">
                      2. Paid Rate Beyond 6 Free
                    </div>
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      $0.06 / Active Version / Mo
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      +$0.03 per 10,000 access ops & $0.05 per rotation notification.
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[8px] bg-white/85 dark:bg-zinc-950/75 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[9.5px] uppercase text-blue-600 dark:text-blue-400 font-bold">
                      3. Disabled & Destroyed = $0.00
                    </div>
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      $0.00 / mo When Disabled
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      When rotating (v1 → v2), auto-disable v1 so it costs $0.00 and frees your quota!
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[8px] bg-white/85 dark:bg-zinc-950/75 border border-zinc-200/80 dark:border-zinc-800">
                    <div className="text-[9.5px] uppercase text-purple-600 dark:text-purple-400 font-bold">
                      4. Replication Cost Multiplier
                    </div>
                    <div className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      Pin Single Region = 1× Cost
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      Multi-region replicas bill per replica location; single-region `userManaged` bills 1×.
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Column (5 cols): Sovereign Secret Manager Provisioner with Strict Compliance Locks */}
            <form
              onSubmit={handleCreateSecret}
              className="lg:col-span-5 p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3.5 h-fit"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                  <span>
                    Provision New Secret (`secretmanager.googleapis.com`)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  Strict Compliance Locks
                </span>
              </div>

              {/* Regulatory Blueprint Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono text-zinc-500">
                  1. Choose Secret Regulatory & Residency Blueprint
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'gdpr-sovereign',
                      label: 'GDPR EU Sovereign Lock',
                      desc: 'Locks userManaged EU replication (1× version cost) + ≤30d rotation',
                    },
                    {
                      id: 'sec-finra-us',
                      label: 'SEC / FINRA US Vault',
                      desc: 'Locks US regional residency (1× version cost) + 30d rotation',
                    },
                    {
                      id: 'hipaa-vault',
                      label: 'HIPAA Clinical Secret',
                      desc: 'Locks US BAA regional residency + ≤60d rotation',
                    },
                    {
                      id: 'custom',
                      label: 'Custom GCP Standard',
                      desc: 'Unlocks global automatic or custom region replication',
                    },
                  ].map((bp) => (
                    <button
                      key={bp.id}
                      type="button"
                      onClick={() => applySecretBlueprint(bp.id)}
                      className={`p-2.5 rounded-[8px] border text-left cursor-pointer transition-all ${
                        secretBlueprint === bp.id
                          ? 'bg-blue-600/15 border-blue-500 text-zinc-900 dark:text-zinc-100'
                          : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <div className="text-xs font-bold">{bp.label}</div>
                      <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                        {bp.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Secret ID (`projects/{projectId}/secrets/...`)
                  </label>
                  <input
                    type="text"
                    required
                    value={secretId}
                    onChange={(e) => setSecretId(e.target.value)}
                    placeholder="prod-stripe-webhook-signing-key"
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Replication Policy {!isSecretCustom ? '[LOCKED]' : ''}
                  </label>
                  <select
                    value={secretReplicationMode}
                    disabled={!isSecretCustom}
                    onChange={(e) => setSecretReplicationMode(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="SOVEREIGN_REGION">
                      Sovereign Regional Pinning (userManaged · 1× Quota)
                    </option>
                    <option value="AUTOMATIC" disabled={!isSecretCustom}>
                      Global Automatic Multi-Continent (Forbidden by Sovereign Blueprint)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Pinned Sovereign Region {!isSecretCustom ? '[LOCKED]' : ''}
                  </label>
                  <select
                    value={secretRegion}
                    disabled={secretReplicationMode === 'AUTOMATIC'}
                    onChange={(e) => setSecretRegion(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option
                      value="europe-west1"
                      disabled={isSecretSec || isSecretHipaa}
                    >
                      {isSecretSec || isSecretHipaa ? '[LOCKED] ' : ''}europe-west1 (Belgium — EU GDPR)
                    </option>
                    <option
                      value="europe-west3"
                      disabled={isSecretSec || isSecretHipaa}
                    >
                      {isSecretSec || isSecretHipaa ? '[LOCKED] ' : ''}europe-west3 (Frankfurt — EU GDPR)
                    </option>
                    <option value="us-central1" disabled={isSecretGdpr}>
                      {isSecretGdpr ? '[LOCKED] ' : ''}us-central1 (Iowa — US SEC/HIPAA)
                    </option>
                    <option value="us-east4" disabled={isSecretGdpr}>
                      {isSecretGdpr ? '[LOCKED] ' : ''}us-east4 (N. Virginia — US SEC/HIPAA)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                    Max Rotation Interval (Days) {!isSecretCustom ? '[LOCKED]' : ''}
                  </label>
                  <select
                    value={secretRotationDays}
                    onChange={(e) =>
                      setSecretRotationDays(Number(e.target.value))
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                  >
                    <option value={30}>30 Days (Strict Zero-Trust)</option>
                    <option value={60} disabled={isSecretGdpr || isSecretSec}>
                      {isSecretGdpr || isSecretSec ? '[LOCKED] ' : ''}60 Days (HIPAA Standard)
                    </option>
                    <option value={90} disabled={!isSecretCustom}>
                      {!isSecretCustom ? '[LOCKED] ' : ''}90 Days (CIS Max)
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Initial Secret Payload (`Version 1` — Base64 TLS Sealed)
                </label>
                <input
                  type="password"
                  value={secretValue}
                  onChange={(e) => setSecretValue(e.target.value)}
                  placeholder="whsec_... or database connection URI"
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-zinc-500 mb-1">
                  Optional: Auto-Grant `roles/secretmanager.secretAccessor` to Runtime SA
                </label>
                <select
                  value={secretBindSaEmail}
                  onChange={(e) => setSecretBindSaEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[8px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                >
                  <option value="">
                    — Do not bind a Service Account yet (bind later in Studio) —
                  </option>
                  {(vaultData?.serviceAccounts || []).map((sa) => (
                    <option key={sa.email} value={sa.email}>
                      {sa.email} ({sa.displayName})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingSecret || !secretId.trim()}
                className="w-full py-2 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {creatingSecret
                  ? 'Sealing in Secret Manager...'
                  : 'Create & Seal Sovereign Secret Version 1'}
              </button>
            </form>

            {/* Right Column (7 cols): Dedicated Secret Manager Rotation, Version Control & IAM Studio + Cloud Armor */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>
                        Dedicated Secret Manager Lifecycle & Rotation Studio (
                        {vaultData?.secrets?.length || 0} Secrets)
                      </span>
                    </div>
                    <p className="text-[10.5px] text-zinc-500 mt-0.5">
                      Click any secret below to rotate payload versions (`:addVersion`), disable or destroy old versions so they cost **$0.00/mo**, or bind `roles/secretmanager.secretAccessor` to a Cloud Run / VM Service Account.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    KMS KeyRings: {vaultData?.keyRings?.length || 0}
                  </span>
                </div>

                {/* Critical Clarification: Does Delete / Destroy Revert to Plaintext or Disappear Forever? */}
                <div className="p-3 rounded-[9px] bg-red-500/[0.06] border border-red-500/35 space-y-1.5 text-[11px] leading-relaxed">
                  <div className="font-mono font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      CRITICAL: Does Delete or Destroy Put a Secret Back into Plaintext? NO — It Disappears Forever!
                    </span>
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-[10.5px]">
                    When Cloud Run&apos;s Leak Surgeon seals an environment variable into Secret Manager, the **plaintext value is completely removed** from Cloud Run and replaced with a pointer (<code className="font-mono font-bold">valueSource.secretKeyRef</code>). Secret Manager does **not** keep a backup in Cloud Run:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[10px] font-mono">
                    <div className="p-2 rounded bg-white/85 dark:bg-zinc-950/80 border border-amber-500/35">
                      <div className="font-extrabold text-amber-600 dark:text-amber-400">
                        1. DISABLE Version ($0/mo · Reversible)
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Encrypted bytes stay safely stored at <strong>$0.00/mo</strong>, but workloads cannot read it until you click <strong>▶ Enable</strong>. <em>Never reverts to plaintext.</em>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white/85 dark:bg-zinc-950/80 border border-red-500/35">
                      <div className="font-extrabold text-red-600 dark:text-red-400">
                        2. DESTROY Version ($0/mo · Permanent)
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Cryptographically shreds that version&apos;s payload <strong>forever</strong> (cannot be undone). <strong>It will NOT return to plaintext</strong>—the value is gone!
                      </div>
                    </div>
                    <div className="p-2 rounded bg-white/85 dark:bg-zinc-950/80 border border-red-500/45">
                      <div className="font-extrabold text-red-600 dark:text-red-400">
                        3. DELETE Secret (Permanent)
                      </div>
                      <div className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                        Erases the entire secret &amp; all versions forever. Any Cloud Run service still referencing <code className="font-bold">secretKeyRef</code> will <strong>fail to start</strong> until you update or remove that env var!
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Broken Cloud Run secretKeyRef Dependency Radar & 1-Click Healer */}
                {(vaultData?.brokenSecretReferences || []).length > 0 && (
                  <div className="p-3 rounded-[9px] bg-red-950/25 border border-red-500/50 space-y-2 text-xs font-mono">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-red-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          LIVE BROKEN `secretKeyRef` RADAR ({vaultData.brokenSecretReferences.length} Cloud Run Binding(s) at Crash Risk!)
                        </span>
                      </span>
                      <span className="text-[10px] text-red-300">
                        Cloud Run v2 services referencing deleted, disabled, or destroyed Secret Manager versions
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {vaultData.brokenSecretReferences.map((br, idx) => (
                        <div
                          key={`${br.serviceName}-${br.secretId}-${br.envKey}-${idx}`}
                          className="p-2.5 rounded-lg bg-black/60 border border-red-500/40 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="font-bold text-white">
                              Cloud Run `{br.serviceName}` ({br.region}) → `{br.envKey}` → `{br.secretId}@${br.version}`
                            </div>
                            <div className="text-[10.5px] text-red-300">
                              [{br.status}] {br.reason}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {br.status !== 'MISSING_SECRET' && (
                              <button
                                type="button"
                                disabled={Boolean(secretActionBusy)}
                                onClick={() =>
                                  handleHealBrokenSecretRef(br, 'POINT_TO_LATEST')
                                }
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                              >
                                Heal: Point to `latest`
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={Boolean(secretActionBusy)}
                              onClick={() =>
                                handleHealBrokenSecretRef(br, 'UNBIND_BROKEN_REF')
                              }
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[10px] font-extrabold cursor-pointer"
                            >
                              Unbind Dead `secretKeyRef`
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {vaultData?.secrets?.length > 0 ? (
                  <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                    {vaultData.secrets.map((s) => {
                      const isExpanded = expandedSecretId === s.secretId;
                      const rotateBusy =
                        secretActionBusy === `ROTATE:${s.secretId}`;
                      const grantBusy =
                        secretActionBusy === `GRANT:${s.secretId}`;
                      const deleteBusy =
                        secretActionBusy === `DELETE:${s.secretId}`;
                      const schedBusy =
                        secretActionBusy === `SCHED:${s.secretId}`;
                      const reloadBusy =
                        secretActionBusy === `RELOAD:${s.secretId}`;
                      const mountedList = s.mountedByWorkloads || [];

                      return (
                        <div
                          key={s.name}
                          className={`rounded-[10px] border transition-all ${
                            isExpanded
                              ? 'border-blue-500/60 bg-zinc-50/90 dark:bg-zinc-900/90 shadow-md'
                              : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60'
                          }`}
                        >
                          {/* Secret Summary Row */}
                          <div className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-extrabold text-zinc-900 dark:text-zinc-100 break-all">
                                  {s.secretId}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                                  v{s.latestEnabledVersion || '1'} ACTIVE
                                </span>
                                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-[10px]">
                                  {s.enabledVersionsCount || 0} Enabled ·{' '}
                                  {(s.disabledVersionsCount || 0) +
                                    (s.destroyedVersionsCount || 0)}{' '}
                                  Disabled/Destroyed ($0)
                                </span>
                                {mountedList.length > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                    Mounted by {mountedList.length} Cloud Run Ref(s)
                                  </span>
                                )}
                                {s.rotationSchedule?.rotationPeriod && (
                                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                    Auto-Rotate Active
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-1 flex flex-wrap items-center gap-2">
                                <span>
                                  {s.replicationMode}{' '}
                                  {s.locations?.length > 0
                                    ? `(${s.locations.join(', ')})`
                                    : '(global)'}
                                </span>
                                {s.accessorMembers?.length > 0 && (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    · IAM Accessors: {s.accessorMembers.length}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSecretId(
                                    isExpanded ? null : s.secretId
                                  )
                                }
                                className={`px-2.5 py-1 rounded-[7px] text-[10.5px] font-mono font-bold border transition-colors cursor-pointer ${
                                  isExpanded
                                    ? 'bg-blue-600 text-white border-blue-500'
                                    : 'bg-white dark:bg-zinc-950 hover:border-blue-500/50 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
                                }`}
                              >
                                {isExpanded
                                  ? 'Hide Lifecycle Controls ▲'
                                  : 'Rotate / Versions / IAM ▼'}
                              </button>

                              <button
                                type="button"
                                disabled={deleteBusy}
                                onClick={() => handleDeleteSecret(s.secretId)}
                                title={`Permanently delete secret "${s.secretId}" and all its versions. WARNING: This does NOT revert Cloud Run back to plaintext — the secret value will disappear forever!`}
                                className="p-1.5 rounded-[7px] bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 cursor-pointer disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Expanded Secret Lifecycle Drawer: Rotate, Version Control & IAM Binding */}
                          {isExpanded && (
                            <div className="p-3.5 pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-3.5 text-xs">
                              {/* 1. Rotate Secret Payload Box */}
                              <div className="p-3 rounded-[8px] bg-white dark:bg-zinc-950 border border-blue-500/30 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-[11px] font-mono font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    <span>
                                      1. Rotate Secret Payload (Mint New Version)
                                    </span>
                                  </span>
                                  <label className="inline-flex items-center gap-1.5 text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={rotateDisableOld}
                                      onChange={(e) =>
                                        setRotateDisableOld(e.target.checked)
                                      }
                                      className="rounded accent-emerald-500"
                                    />
                                    <span>
                                      Auto-disable old versions ($0.00/mo — keeps Free Tier!)
                                    </span>
                                  </label>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <input
                                    type="password"
                                    value={rotateValues[s.secretId] || ''}
                                    onChange={(e) =>
                                      setRotateValues((prev) => ({
                                        ...prev,
                                        [s.secretId]: e.target.value,
                                      }))
                                    }
                                    placeholder={`Enter new rotated secret payload for ${s.secretId}...`}
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[7px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                                  />
                                  <button
                                    type="button"
                                    disabled={
                                      rotateBusy ||
                                      !(rotateValues[s.secretId] || '').trim()
                                    }
                                    onClick={() =>
                                      handleRotateSecret(s.secretId)
                                    }
                                    className="px-3 py-1.5 rounded-[7px] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[11px] font-mono font-bold cursor-pointer shrink-0"
                                  >
                                    {rotateBusy
                                      ? 'Rotating...'
                                      : 'Rotate & Mint New Version'}
                                  </button>
                                </div>
                              </div>

                              {/* 2. Version History & FinOps State Surgeon */}
                              <div className="p-3 rounded-[8px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-2">
                                <div className="flex items-center justify-between text-[11px] font-mono font-extrabold text-zinc-800 dark:text-zinc-200">
                                  <span>
                                    2. Secret Versions ({s.versions?.length || 0}) — FinOps State Control
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    ENABLED = counts toward 6 free ($0.06 after) · DISABLED/DESTROYED = $0.00
                                  </span>
                                </div>

                                {s.versions?.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {s.versions.map((v) => {
                                      const isEnabled = v.state === 'ENABLED';
                                      const isDisabled = v.state === 'DISABLED';
                                      const isDestroyed =
                                        v.state === 'DESTROYED';
                                      return (
                                        <div
                                          key={v.name}
                                          className="p-2 rounded-[7px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
                                              Version {v.version}
                                            </span>
                                            <span
                                              className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold border ${
                                                isEnabled
                                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                                  : isDisabled
                                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
                                                  : 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30 line-through'
                                              }`}
                                            >
                                              {v.state}{' '}
                                              {isEnabled
                                                ? '(Active Quota)'
                                                : isDisabled
                                                ? '($0.00/mo · Reversible)'
                                                : '($0.00/mo · Erased Forever)'}
                                            </span>
                                            {v.createTime && (
                                              <span className="text-[10px] text-zinc-500">
                                                {new Date(
                                                  v.createTime
                                                ).toLocaleDateString()}
                                              </span>
                                            )}
                                          </div>

                                          {!isDestroyed && (
                                            <div className="flex items-center gap-1.5">
                                              {isEnabled ? (
                                                <button
                                                  type="button"
                                                  disabled={Boolean(
                                                    secretActionBusy
                                                  )}
                                                  onClick={() =>
                                                    handleToggleSecretVersionState(
                                                      s.secretId,
                                                      v.version,
                                                      'DISABLE'
                                                    )
                                                  }
                                                  title={`Disable version ${v.version} ($0.00/mo). The encrypted secret is kept safe and can be re-enabled anytime; it does NOT revert to plaintext.`}
                                                  className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-pointer"
                                                >
                                                  Disable ($0/mo)
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  disabled={Boolean(
                                                    secretActionBusy
                                                  )}
                                                  onClick={() =>
                                                    handleToggleSecretVersionState(
                                                      s.secretId,
                                                      v.version,
                                                      'ENABLE'
                                                    )
                                                  }
                                                  title={`Re-enable version ${v.version} for live workload access`}
                                                  className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold cursor-pointer"
                                                >
                                                  ▶ Enable
                                                </button>
                                              )}

                                              <button
                                                type="button"
                                                disabled={Boolean(
                                                  secretActionBusy
                                                )}
                                                onClick={() =>
                                                  handleToggleSecretVersionState(
                                                    s.secretId,
                                                    v.version,
                                                    'DESTROY'
                                                  )
                                                }
                                                title={`IRREVERSIBLE: Permanently shreds version ${v.version}'s cryptographic payload ($0.00/mo). It will disappear forever and will NOT revert back to plaintext!`}
                                                className="px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-bold cursor-pointer"
                                              >
                                                Destroy (Disappears Forever)
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-[11px] font-mono text-zinc-500">
                                    No versions minted yet. Use Rotate above to mint Version 1.
                                  </div>
                                )}
                              </div>

                              {/* 3. Resource-Scoped IAM Secret Accessor Binding */}
                              <div className="p-3 rounded-[8px] bg-white dark:bg-zinc-950 border border-emerald-500/30 space-y-2">
                                <div className="text-[11px] font-mono font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-2">
                                  <span>
                                    3. Least-Privilege Secret IAM (`roles/secretmanager.secretAccessor`)
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    Scoped to `{s.secretId}` only
                                  </span>
                                </div>

                                {s.accessorMembers?.length > 0 && (
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    {s.accessorMembers.map((mem) => (
                                      <span
                                        key={mem}
                                        className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-mono"
                                      >
                                        ✓ {mem}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <select
                                    value={
                                      grantSaBySecret[s.secretId] ||
                                      vaultData?.serviceAccounts?.[0]?.email ||
                                      ''
                                    }
                                    onChange={(e) =>
                                      setGrantSaBySecret((prev) => ({
                                        ...prev,
                                        [s.secretId]: e.target.value,
                                      }))
                                    }
                                    className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-[7px] px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
                                  >
                                    {(vaultData?.serviceAccounts || []).map(
                                      (sa) => (
                                        <option key={sa.email} value={sa.email}>
                                          {sa.email} ({sa.displayName})
                                        </option>
                                      )
                                    )}
                                  </select>
                                  <button
                                    type="button"
                                    disabled={grantBusy}
                                    onClick={() =>
                                      handleGrantSecretAccessor(s.secretId)
                                    }
                                    className="px-3 py-1.5 rounded-[7px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[11px] font-mono font-bold cursor-pointer shrink-0"
                                  >
                                    {grantBusy
                                      ? 'Binding IAM...'
                                      : 'Grant secretAccessor'}
                                  </button>
                                </div>
                              </div>

                              {/* 4. Live Cloud Run Mounts Hot-Reload & $0/mo Autonomous Rotation Schedule */}
                              <div className="p-3 rounded-[8px] bg-white dark:bg-zinc-950 border border-purple-500/30 space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                                  <span className="font-extrabold text-purple-600 dark:text-purple-300">
                                    4. Live Cloud Run `secretKeyRef` Mounts ({mountedList.length}) & $0/mo Auto-Rotation
                                  </span>
                                  <button
                                    type="button"
                                    disabled={schedBusy}
                                    onClick={() =>
                                      handleScheduleAutoRotation(s.secretId, 30)
                                    }
                                    title="Configure Google Cloud Secret Manager native 30-day rotationSchedule ($0.00/mo inside the 3 Free Rotations/month quota)"
                                    className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-bold cursor-pointer"
                                  >
                                    {schedBusy
                                      ? 'Scheduling...'
                                      : s.rotationSchedule?.rotationPeriod
                                      ? `Next Auto-Rotation: ${
                                          s.rotationSchedule.nextRotationTime
                                            ? new Date(
                                                s.rotationSchedule
                                                  .nextRotationTime
                                              ).toLocaleDateString()
                                            : 'Active'
                                        } (Re-Sync 30d)`
                                      : 'Enable $0/mo 30-Day Auto-Rotation'}
                                  </button>
                                </div>

                                {mountedList.length > 0 ? (
                                  <div className="space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {mountedList.map((mw, mIdx) => (
                                        <span
                                          key={`${mw.serviceName}-${mw.envKey}-${mIdx}`}
                                          className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-700 dark:text-purple-200 border border-purple-500/30 text-[10px] font-mono"
                                        >
                                          {mw.serviceName} ({mw.region}) → {mw.envKey}@{mw.version}
                                        </span>
                                      ))}
                                    </div>
                                    <button
                                      type="button"
                                      disabled={reloadBusy}
                                      onClick={() =>
                                        handleReloadMountedWorkloads(
                                          s.secretId,
                                          mountedList
                                        )
                                      }
                                      className="w-full py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-[10.5px] font-mono font-bold cursor-pointer"
                                    >
                                      {reloadBusy
                                        ? 'Rolling Fresh Cloud Run Revision(s)...'
                                        : `1-Click Hot-Reload ${mountedList.length} Mounted Cloud Run Service(s) to "${s.secretId}@latest"`}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="text-[10.5px] font-mono text-zinc-500">
                                    No Cloud Run services currently mount `{s.secretId}` via `secretKeyRef`. Seal an env var in the Cloud Run Leak Surgeon to link it automatically.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-zinc-500 font-mono py-4">
                    No secrets provisioned yet in `{projectId}`. Use the Sovereign Secret Provisioner on the left (or the 1-Click Leak Surgeon in Cloud Run) to seal up to **6 Active Secret Versions for $0.00/mo**!
                  </div>
                )}
              </div>

              {/* Cloud Armor OWASP Top-10 & Adaptive DDoS Rate-Limit Synthesizer */}
              <div className="p-4 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#131314] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                    Cloud Armor Edge WAF & Layer-7 DDoS Rate-Limit Synthesizer
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    OWASP Top-10 ModSecurity CRS 3.3
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Synthesizes a complete Google Cloud Armor edge security policy blocking SQLi (`sqli-v33-stable`), XSS (`xss-v33-stable`), LFI/RCE scanners, and throttling abusive IPs at `100 req/min` (`429 Too Many Requests`).
                </p>
                <div className="p-2.5 rounded-[8px] bg-zinc-950 text-emerald-300 font-mono text-[10.5px] overflow-x-auto">
                  {`gcloud compute security-policies create cloudpulse-zero-trust-waf --project=${projectId} && \\
gcloud compute security-policies rules create 1000 --security-policy=cloudpulse-zero-trust-waf --expression="evaluatePreconfiguredWaf('sqli-v33-stable') || evaluatePreconfiguredWaf('xss-v33-stable')" --action=deny-403 --project=${projectId} && \\
gcloud compute security-policies rules create 2000 --security-policy=cloudpulse-zero-trust-waf --src-ip-ranges="*" --action=throttle --rate-limit-threshold-count=100 --rate-limit-threshold-interval-sec=60 --conform-action=allow --exceed-action=deny-429 --enforce-on-key=IP --project=${projectId}`}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `gcloud compute security-policies create cloudpulse-zero-trust-waf --project=${projectId} && gcloud compute security-policies rules create 1000 --security-policy=cloudpulse-zero-trust-waf --expression="evaluatePreconfiguredWaf('sqli-v33-stable') || evaluatePreconfiguredWaf('xss-v33-stable')" --action=deny-403 --project=${projectId} && gcloud compute security-policies rules create 2000 --security-policy=cloudpulse-zero-trust-waf --src-ip-ranges="*" --action=throttle --rate-limit-threshold-count=100 --rate-limit-threshold-interval-sec=60 --conform-action=allow --exceed-action=deny-429 --enforce-on-key=IP --project=${projectId}`,
                      'Cloud Armor WAF policy CLI'
                    )
                  }
                  className="w-full py-1.5 rounded-[8px] border border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-mono font-bold cursor-pointer"
                >
                  Copy 1-Tap Cloud Armor OWASP + Rate-Limit Deployment CLI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
