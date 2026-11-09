import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  PlusCircle,
  Copy,
  Check,
  Search,
  Layers,
  RotateCcw,
  X,
} from 'lucide-react';

export default function SecretManagerVaultExplorer({
  projectId,
  preferredSecretProject = '',
  highlightSecretIds = [],
  defaultFilterMode = 'ALL', // 'ALL' | 'DLP_VAULTED'
  onShowToast,
  onShowError,
  onRehydrateFileFromSecretManager,
  rehydratingFile = false,
  onClose,
}) {
  const [loading, setLoading] = useState(false);
  const [vaultData, setVaultData] = useState(null);
  const [filterMode, setFilterMode] = useState(defaultFilterMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Per-secret revealed values: { [`${secretId}:${version}`]: { secretValue, maskedPreview, showPlaintext, dataCrc32c } }
  const [peekedSecrets, setPeekedSecrets] = useState({});

  // Per-secret inline rotation editor: { [secretId]: { open: boolean, newValue: string, disableOld: boolean } }
  const [rotateEditors, setRotateEditors] = useState({});

  // New secret creation drawer
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSecretId, setNewSecretId] = useState('');
  const [newSecretVal, setNewSecretVal] = useState('');

  const effectiveQueryProject = preferredSecretProject || projectId;

  const fetchSecretsInventory = useCallback(
    async (silent = false) => {
      if (!projectId) return;
      if (!silent) setLoading(true);
      try {
        const res = await axios.get(
          `/api/project/${encodeURIComponent(
            projectId
          )}/sovereign/secrets-kms${
            effectiveQueryProject
              ? `?secretProject=${encodeURIComponent(effectiveQueryProject)}`
              : ''
          }`
        );
        setVaultData(res.data);
      } catch (err) {
        if (onShowError && !silent) {
          onShowError(
            err.response?.data?.error ||
              'Failed to load Google Cloud Secret Manager inventory.'
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [projectId, effectiveQueryProject, onShowError]
  );

  useEffect(() => {
    fetchSecretsInventory();
  }, [fetchSecretsInventory]);

  const activeSecretProject =
    vaultData?.activeSecretProject || preferredSecretProject || projectId;

  const allSecrets = useMemo(() => vaultData?.secrets || [], [vaultData]);

  const dlpVaultedCount = useMemo(
    () =>
      allSecrets.filter(
        (s) =>
          String(s.shortName || '').startsWith('cloudpulse-dlp-') ||
          s.labels?.['managed-by'] === 'cloudpulse-dlp-vault'
      ).length,
    [allSecrets]
  );

  const filteredSecrets = useMemo(() => {
    return allSecrets.filter((s) => {
      const isDlp =
        String(s.shortName || '').startsWith('cloudpulse-dlp-') ||
        s.labels?.['managed-by'] === 'cloudpulse-dlp-vault';
      if (filterMode === 'DLP_VAULTED' && !isDlp) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(s.shortName || '')
          .toLowerCase()
          .includes(q) ||
        JSON.stringify(s.labels || {})
          .toLowerCase()
          .includes(q)
      );
    });
  }, [allSecrets, filterMode, searchQuery]);

  const handleCopyText = (key, text, label = 'Copied to clipboard!') => {
    navigator.clipboard?.writeText(String(text || ''));
    setCopiedKey(key);
    if (onShowToast) onShowToast(label);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 1800);
  };

  const handlePeekSecretVersion = async (secretId, version = 'latest') => {
    const cacheKey = `${secretId}:${version}`;
    if (peekedSecrets[cacheKey]) {
      setPeekedSecrets((prev) => ({
        ...prev,
        [cacheKey]: {
          ...prev[cacheKey],
          showPlaintext: !prev[cacheKey].showPlaintext,
        },
      }));
      return;
    }

    setBusyKey(`peek-${cacheKey}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'PEEK_SECRET_VERSION',
          secretId,
          version,
          targetSecretProject: activeSecretProject,
        }
      );
      setPeekedSecrets((prev) => ({
        ...prev,
        [cacheKey]: {
          secretValue: res.data?.secretValue || '',
          maskedPreview: res.data?.maskedPreview || '***',
          dataCrc32c: res.data?.dataCrc32c || null,
          version: res.data?.version || version,
          showPlaintext: true,
        },
      }));
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Retrieved ${secretId}@v${version} from Google Cloud Secret Manager!`
        );
      }
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to access secret version ${secretId}@v${version}.`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleGenerateRandomCryptoValue = (secretId) => {
    const bytes = new Uint8Array(24);
    window.crypto?.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    setRotateEditors((prev) => ({
      ...prev,
      [secretId]: {
        ...(prev[secretId] || { open: true, disableOld: true }),
        open: true,
        newValue: `cp2026_rot_${hex}`,
      },
    }));
  };

  const handleRotateSecret = async (secretId) => {
    const editor = rotateEditors[secretId];
    const newSecretValue = String(editor?.newValue || '').trim();
    if (!newSecretValue) {
      if (onShowError) {
        onShowError(
          'Enter a new secret value or click "Generate 256-Bit Key" before rotating.'
        );
      }
      return;
    }

    setBusyKey(`rotate-${secretId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'ROTATE_SECRET',
          secretId,
          newSecretValue,
          disablePreviousVersions: editor?.disableOld !== false,
          targetSecretProject: activeSecretProject,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Rotated ${secretId} -> minted Version v${res.data?.newVersion}!`
        );
      }
      setRotateEditors((prev) => ({
        ...prev,
        [secretId]: { open: false, newValue: '', disableOld: true },
      }));
      // Clear cached peeked latest value so next peek fetches the new version
      setPeekedSecrets((prev) => {
        const next = { ...prev };
        delete next[`${secretId}:latest`];
        return next;
      });
      await fetchSecretsInventory(true);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to rotate secret ${secretId}.`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleToggleVersionState = async (secretId, version, targetState) => {
    setBusyKey(`ver-${secretId}-${version}-${targetState}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'TOGGLE_VERSION_STATE',
          secretId,
          version,
          targetState,
          targetSecretProject: activeSecretProject,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Updated ${secretId}@v${version} state to ${targetState}!`
        );
      }
      await fetchSecretsInventory(true);
    } catch (err) {
      if (
        err?.isDestructiveCancelled ||
        err?.message === 'DESTRUCTIVE_ACTION_CANCELLED'
      ) {
        return;
      }
      if (onShowError) {
        onShowError(
          err.response?.data?.error ||
            `Failed to ${targetState.toLowerCase()} ${secretId}@v${version}.`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleDeleteSecret = async (secretId) => {
    setBusyKey(`del-${secretId}`);
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          projectId
        )}/sovereign/secrets-kms/action`,
        {
          action: 'DELETE_SECRET',
          secretId,
          targetSecretProject: activeSecretProject,
        }
      );
      if (onShowToast) {
        onShowToast(
          res.data?.message ||
            `Deleted secret "${secretId}" from Google Cloud Secret Manager!`
        );
      }
      await fetchSecretsInventory(true);
    } catch (err) {
      if (
        err?.isDestructiveCancelled ||
        err?.message === 'DESTRUCTIVE_ACTION_CANCELLED'
      ) {
        return;
      }
      if (onShowError) {
        onShowError(
          err.response?.data?.error || `Failed to delete secret ${secretId}.`
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  const handleCreateNewSecret = async (e) => {
    if (e) e.preventDefault();
    if (!newSecretId.trim() || !newSecretVal.trim()) return;
    setBusyKey('create-new-secret');
    try {
      const res = await axios.post(
        `/api/project/${encodeURIComponent(
          activeSecretProject
        )}/sovereign/secrets-kms/create-secret`,
        {
          secretId: newSecretId.trim(),
          secretValue: newSecretVal,
          replicationMode: 'AUTOMATIC',
        }
      );
      if (onShowToast) {
        onShowToast(
          `Created secret "${newSecretId.trim()}" in Google Cloud Secret Manager (${activeSecretProject})!`
        );
      }
      setNewSecretId('');
      setNewSecretVal('');
      setShowCreateForm(false);
      await fetchSecretsInventory(true);
    } catch (err) {
      if (onShowError) {
        onShowError(
          err.response?.data?.error || 'Failed to create Secret Manager secret.'
        );
      }
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-500/40 shadow-sm space-y-3.5 font-mono text-xs">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-extrabold inline-flex items-center gap-1">
            <Key className="w-3 h-3" />
            <span>GOOGLE CLOUD SECRET MANAGER STUDIO</span>
          </span>
          <span className="font-extrabold text-zinc-900 dark:text-zinc-100">
            projects/{activeSecretProject}/secrets ({allSecrets.length} total ·{' '}
            {dlpVaultedCount} DLP-Vaulted)
          </span>
          {vaultData?.finopsSummary && (
            <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-300 font-bold">
              Active Versions: {vaultData.finopsSummary.totalEnabledVersions} / 6
              Free Tier
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRehydrateFileFromSecretManager && (
            <button
              type="button"
              data-feature-id="SM_EXPLORER_REHYDRATE_FILE_BTN"
              disabled={rehydratingFile}
              onClick={onRehydrateFileFromSecretManager}
              title="Reads each sm://projects/.../secrets/.../versions/... reference from Secret Manager (:access) and writes the original plaintext keys back into the Cloud Storage file"
              className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>
                {rehydratingFile
                  ? 'Rehydrating File...'
                  : 'Rehydrate sm:// back to Plaintext in File'}
              </span>
            </button>
          )}

          <button
            type="button"
            data-feature-id="SM_EXPLORER_CREATE_TOGGLE_BTN"
            onClick={() => setShowCreateForm((v) => !v)}
            className={`px-3 py-1 rounded text-[10.5px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 border ${
              showCreateForm
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-zinc-100 dark:bg-[#1a2130] text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-[#323d56]'
            }`}
          >
            <PlusCircle className="w-3 h-3" />
            <span>{showCreateForm ? 'Cancel New Secret' : '+ Create Secret'}</span>
          </button>

          <button
            type="button"
            data-feature-id="SM_EXPLORER_REFRESH_BTN"
            disabled={loading}
            onClick={() => fetchSecretsInventory(false)}
            className="px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
            />
            <span>{loading ? 'Syncing...' : 'Refresh'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              data-feature-id="SM_EXPLORER_CLOSE_BTN"
              onClick={onClose}
              className="px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 text-[10.5px] font-bold cursor-pointer inline-flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Create Secret Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateNewSecret}
          className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-end gap-2"
        >
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-bold text-zinc-500 mb-1">
              Secret ID (projects/{activeSecretProject}/secrets/...)
            </label>
            <input
              type="text"
              value={newSecretId}
              onChange={(e) => setNewSecretId(e.target.value)}
              placeholder="e.g. prod-stripe-webhook-secret"
              className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[10px] font-bold text-zinc-500 mb-1">
              Initial Secret Payload (Version 1)
            </label>
            <input
              type="text"
              value={newSecretVal}
              onChange={(e) => setNewSecretVal(e.target.value)}
              placeholder="Paste or type secret payload..."
              className="w-full h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
            />
          </div>
          <button
            type="submit"
            data-feature-id="SM_EXPLORER_CREATE_SUBMIT_BTN"
            disabled={
              busyKey === 'create-new-secret' ||
              !newSecretId.trim() ||
              !newSecretVal.trim()
            }
            className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
          >
            {busyKey === 'create-new-secret'
              ? 'Creating in Secret Manager...'
              : 'Create & Mint v1'}
          </button>
        </form>
      )}

      {/* Filter & Search Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Secret Manager Filter"
          className="cp-segmented-menu inline-flex items-center gap-1 p-1 rounded-[8px]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={filterMode === 'ALL'}
            data-feature-id="SM_EXPLORER_FILTER_ALL_BTN"
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-1 rounded-[6px] text-[10.5px] font-bold cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            All Project Secrets ({allSecrets.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterMode === 'DLP_VAULTED'}
            data-feature-id="SM_EXPLORER_FILTER_DLP_BTN"
            onClick={() => setFilterMode('DLP_VAULTED')}
            className={`px-2.5 py-1 rounded-[6px] text-[10.5px] font-bold cursor-pointer ${
              filterMode === 'DLP_VAULTED'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            DLP-Vaulted Secrets Only ({dlpVaultedCount})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter secrets by ID or source bucket..."
            className="w-full h-7 pl-8 pr-2.5 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px]"
          />
        </div>
      </div>

      {/* Secrets List */}
      {loading && allSecrets.length === 0 ? (
        <div className="p-6 text-center text-zinc-500">
          Loading live secrets &amp; versions from{' '}
          <code>secretmanager.googleapis.com/v1/projects/{activeSecretProject}/secrets</code>
          ...
        </div>
      ) : filteredSecrets.length === 0 ? (
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-500 text-center">
          No secrets match the current filter in{' '}
          <code>projects/{activeSecretProject}</code>.
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
          {filteredSecrets.map((sec) => {
            const sid = sec.shortName;
            const isHighlighted = highlightSecretIds.includes(sid);
            const isDlpVaulted =
              String(sid).startsWith('cloudpulse-dlp-') ||
              sec.labels?.['managed-by'] === 'cloudpulse-dlp-vault';
            const strippedDlp = isDlpVaulted
              ? String(sid).replace(/^cloudpulse-dlp-/, '')
              : String(sid);
            const envMatch = isDlpVaulted
              ? strippedDlp.match(
                  /^(.*?-env|.*?-json|.*?-yaml|.*?-yml|.*?-cfg|.*?-conf|.*?-ini)-([a-z0-9_]+)$/i
                )
              : null;
            const primaryKeyTitle = envMatch
              ? envMatch[2].toUpperCase()
              : isDlpVaulted && strippedDlp.includes('_')
              ? strippedDlp
                  .split('-')
                  .slice(
                    Math.max(
                      0,
                      strippedDlp.split('-').findIndex((p) => p.includes('_'))
                    )
                  )
                  .join('_')
                  .toUpperCase()
              : sid;
            const latestEnabledVer =
              (sec.versions || []).find((v) => v.state === 'ENABLED')
                ?.version || 'latest';
            const smUri = `sm://projects/${activeSecretProject}/secrets/${sid}/versions/${latestEnabledVer}`;
            const peekEntry = peekedSecrets[`${sid}:latest`];
            const rotEditor = rotateEditors[sid] || {
              open: false,
              newValue: '',
              disableOld: true,
            };

            return (
              <div
                key={sid}
                className={`p-3 rounded-xl border space-y-2.5 ${
                  isHighlighted
                    ? 'bg-emerald-500/5 border-emerald-500/50'
                    : 'bg-zinc-50/70 dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                {/* Top row: Non-Wrapping Identity Left + Pinned Action Toolbar Right */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span
                        title={sid}
                        className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs truncate max-w-full"
                      >
                        {primaryKeyTitle}
                      </span>
                      {isDlpVaulted && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9.5px] font-bold shrink-0">
                          DLP VAULTED
                          {sec.labels?.['source-bucket']
                            ? ` · gs://${sec.labels['source-bucket']}`
                            : ''}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-[9.5px] text-zinc-600 dark:text-zinc-300 font-bold shrink-0">
                        {sec.enabledVersionsCount || 0} Enabled ·{' '}
                        {sec.disabledVersionsCount || 0} Disabled ·{' '}
                        {sec.replicationPolicy}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 min-w-0 text-[10px] text-zinc-500">
                      <span className="text-[9px] uppercase text-zinc-400 shrink-0">
                        Secret ID:
                      </span>
                      <code
                        title={sid}
                        className="truncate block px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                      >
                        {sid}
                      </code>
                    </div>
                  </div>

                  <div className="shrink-0 grid grid-cols-4 gap-1.5">
                    <button
                      type="button"
                      data-feature-id="SM_EXPLORER_PEEK_SECRET_BTN"
                      disabled={busyKey === `peek-${sid}:latest`}
                      onClick={() => handlePeekSecretVersion(sid, 'latest')}
                      title="Access and reveal the decrypted secret payload from Google Cloud Secret Manager (:access)"
                      className={`w-[114px] h-7 px-2 rounded text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-50 border ${
                        peekEntry?.showPlaintext
                          ? 'bg-blue-600 text-white border-blue-500'
                          : 'bg-zinc-100 dark:bg-[#1a2130] text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-[#323d56]'
                      }`}
                    >
                      {peekEntry?.showPlaintext ? (
                        <>
                          <EyeOff className="w-3 h-3 shrink-0" />
                          <span>Hide Value</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 shrink-0" />
                          <span>
                            {busyKey === `peek-${sid}:latest`
                              ? 'Accessing...'
                              : 'Reveal (:access)'}
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      data-feature-id="SM_EXPLORER_ROTATE_TOGGLE_BTN"
                      onClick={() =>
                        setRotateEditors((prev) => ({
                          ...prev,
                          [sid]: {
                            open: !rotEditor.open,
                            newValue: rotEditor.newValue || '',
                            disableOld: rotEditor.disableOld !== false,
                          },
                        }))
                      }
                      title="Mint a new SecretVersion (:addVersion) and optionally disable old versions ($0.00/mo)"
                      className={`w-[84px] h-7 px-2 rounded text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap ${
                        rotEditor.open
                          ? 'bg-blue-600 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <RefreshCw className="w-3 h-3 shrink-0" />
                      <span>Rotate</span>
                    </button>

                    <button
                      type="button"
                      data-feature-id="SM_EXPLORER_COPY_URI_BTN"
                      onClick={() =>
                        handleCopyText(
                          `uri-${sid}`,
                          smUri,
                          `Copied ${smUri} to clipboard!`
                        )
                      }
                      className="w-[72px] h-7 px-2 rounded bg-white dark:bg-[#1a2130] border border-zinc-200 dark:border-[#323d56] text-zinc-800 dark:text-zinc-100 text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap"
                    >
                      {copiedKey === `uri-${sid}` ? (
                        <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 shrink-0" />
                      )}
                      <span>sm://</span>
                    </button>

                    <button
                      type="button"
                      data-feature-id="SM_EXPLORER_DELETE_SECRET_BTN"
                      disabled={busyKey === `del-${sid}`}
                      onClick={() => handleDeleteSecret(sid)}
                      title={`Delete secret "${sid}" and all of its versions from Google Cloud Secret Manager (protected by confirmation modal)`}
                      className="w-[74px] h-7 px-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 text-[10px] font-bold cursor-pointer inline-flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {/* Revealed Secret Value Box */}
                {peekEntry && (
                  <div className="p-2.5 rounded-lg bg-zinc-900 text-zinc-100 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-2 flex-wrap break-all">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9.5px] font-bold">
                        DECRYPTED PAYLOAD (v{peekEntry.version})
                      </span>
                      <code className="text-emerald-400 font-bold">
                        {peekEntry.showPlaintext
                          ? peekEntry.secretValue
                          : peekEntry.maskedPreview}
                      </code>
                      {peekEntry.dataCrc32c && (
                        <span className="text-[10px] text-zinc-400">
                          (CRC32C: {peekEntry.dataCrc32c})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      data-feature-id="SM_EXPLORER_COPY_SECRET_VAL_BTN"
                      onClick={() =>
                        handleCopyText(
                          `val-${sid}`,
                          peekEntry.secretValue,
                          `Copied decrypted secret value for ${sid}!`
                        )
                      }
                      className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copy Secret Value</span>
                    </button>
                  </div>
                )}

                {/* Inline Secret Rotation Bar */}
                {rotEditor.open && (
                  <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-blue-700 dark:text-blue-300 text-[11px]">
                        Rotate Secret &amp; Mint New Version (
                        <code>POST /v1/projects/{activeSecretProject}/secrets/{sid}:addVersion</code>
                        )
                      </span>
                      <button
                        type="button"
                        data-feature-id="SM_EXPLORER_GEN_CRYPTO_KEY_BTN"
                        onClick={() => handleGenerateRandomCryptoValue(sid)}
                        className="px-2.5 py-1 rounded bg-zinc-100 dark:bg-[#1a2130] text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-[#323d56] text-[10px] font-bold cursor-pointer"
                      >
                        Generate 256-Bit Crypto Key
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={rotEditor.newValue}
                        onChange={(e) =>
                          setRotateEditors((prev) => ({
                            ...prev,
                            [sid]: {
                              ...rotEditor,
                              newValue: e.target.value,
                            },
                          }))
                        }
                        placeholder="Enter new rotated secret value..."
                        className="flex-1 min-w-[220px] h-8 px-2.5 rounded bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs"
                      />
                      <label className="inline-flex items-center gap-1.5 text-[10.5px] text-zinc-600 dark:text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rotEditor.disableOld !== false}
                          onChange={(e) =>
                            setRotateEditors((prev) => ({
                              ...prev,
                              [sid]: {
                                ...rotEditor,
                                disableOld: e.target.checked,
                              },
                            }))
                          }
                        />
                        <span>Auto-Disable Prior Versions ($0.00/mo)</span>
                      </label>
                      <button
                        type="button"
                        data-feature-id="SM_EXPLORER_ROTATE_SUBMIT_BTN"
                        disabled={busyKey === `rotate-${sid}`}
                        onClick={() => handleRotateSecret(sid)}
                        className="h-8 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        {busyKey === `rotate-${sid}`
                          ? 'Rotating...'
                          : 'Mint New Version'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Versions Table */}
                {Array.isArray(sec.versions) && sec.versions.length > 0 && (
                  <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 uppercase">
                        <tr>
                          <th className="px-2 py-1">Version</th>
                          <th className="px-2 py-1">State &amp; Billing</th>
                          <th className="px-2 py-1">Created At</th>
                          <th className="px-2 py-1 text-right">
                            Version Lifecycle Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {sec.versions.slice(0, 6).map((v) => {
                          const vNum = v.version;
                          const isEnabled = v.state === 'ENABLED';
                          const isDisabled = v.state === 'DISABLED';
                          const isDestroyed = v.state === 'DESTROYED';
                          return (
                            <tr
                              key={`${sid}-v-${vNum}`}
                              className="bg-white dark:bg-zinc-950/60"
                            >
                              <td className="px-2 py-1 font-extrabold text-zinc-900 dark:text-zinc-100">
                                v{vNum}
                              </td>
                              <td className="px-2 py-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold text-[9.5px] ${
                                    isEnabled
                                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                                      : isDisabled
                                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 line-through'
                                  }`}
                                >
                                  {v.state}
                                  {isDisabled || isDestroyed
                                    ? ' ($0.00/mo)'
                                    : ''}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-zinc-500">
                                {v.createTime
                                  ? new Date(v.createTime).toLocaleString()
                                  : '—'}
                              </td>
                              <td className="px-2 py-1 text-right space-x-1">
                                {isEnabled && (
                                  <button
                                    type="button"
                                    data-feature-id="SM_EXPLORER_DISABLE_VER_BTN"
                                    disabled={
                                      busyKey === `ver-${sid}-${vNum}-DISABLE`
                                    }
                                    onClick={() =>
                                      handleToggleVersionState(
                                        sid,
                                        vNum,
                                        'DISABLE'
                                      )
                                    }
                                    className="px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 font-bold cursor-pointer"
                                  >
                                    Disable ($0/mo)
                                  </button>
                                )}
                                {isDisabled && (
                                  <button
                                    type="button"
                                    data-feature-id="SM_EXPLORER_ENABLE_VER_BTN"
                                    disabled={
                                      busyKey === `ver-${sid}-${vNum}-ENABLE`
                                    }
                                    onClick={() =>
                                      handleToggleVersionState(
                                        sid,
                                        vNum,
                                        'ENABLE'
                                      )
                                    }
                                    className="px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold cursor-pointer"
                                  >
                                    Re-Enable
                                  </button>
                                )}
                                {!isDestroyed && (
                                  <button
                                    type="button"
                                    data-feature-id="SM_EXPLORER_DESTROY_VER_BTN"
                                    disabled={
                                      busyKey === `ver-${sid}-${vNum}-DESTROY`
                                    }
                                    onClick={() =>
                                      handleToggleVersionState(
                                        sid,
                                        vNum,
                                        'DESTROY'
                                      )
                                    }
                                    className="px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold cursor-pointer"
                                  >
                                    Destroy v{vNum}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
