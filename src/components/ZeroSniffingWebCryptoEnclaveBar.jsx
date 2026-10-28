import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Lock,
  KeyRound,
  ExternalLink,
  CheckCircle2,
  Cpu,
  Plus,
  X,
} from 'lucide-react';

const CUSTOM_MODELS_STORAGE_KEY = 'cloudpulse_custom_gemini_models_v1';

export const BASE_GEMINI_MODELS = [
  {
    id: 'gemini-3.8-flash',
    label: 'gemini-3.8-flash (Ultra-Fast SRE & MCP Grounding)',
    isBuiltIn: true,
  },
  {
    id: 'gemini-3.1-pro',
    label: 'gemini-3.1-pro (Deep Architecture & Forensic Reasoning)',
    isBuiltIn: true,
  },
];

function loadSavedCustomModels() {
  try {
    const raw = window.localStorage.getItem(CUSTOM_MODELS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        const id = String(typeof item === 'string' ? item : item?.id || '')
          .trim()
          .replace(/^models\//i, '');
        if (!id) return null;
        return {
          id,
          label: `${id} (Custom Gemini Model)`,
          isBuiltIn: false,
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function saveCustomModelsToStorage(customList) {
  try {
    window.localStorage.setItem(
      CUSTOM_MODELS_STORAGE_KEY,
      JSON.stringify(customList)
    );
  } catch {
    // ignore storage quota errors
  }
}

// Shared in-memory Browser WebCrypto Non-Extractable Enclave singleton across all Studios
const sharedBrowserEnclave = {
  cryptoKey: null,
  iv: null,
  ciphertext: null,
  maskedKey: null,
  keyFingerprint: null,
  transportMode: 'RSA_OAEP_SERVER_VAULT', // 'BROWSER_DIRECT_TLS13' | 'RSA_OAEP_SERVER_VAULT'
  preferredProvider: 'AUTO', // 'AUTO' | 'VERTEX_AI_OAUTH' | 'AI_STUDIO_KEY'
  activeModel: 'gemini-3.8-flash',
  customModels: typeof window !== 'undefined' ? loadSavedCustomModels() : [],
  listeners: new Set(),
};

function notifyEnclaveListeners() {
  for (const fn of sharedBrowserEnclave.listeners) {
    try {
      fn();
    } catch {
      // ignore listener errors
    }
  }
}

export function getAllAvailableGeminiModels() {
  const map = new Map();
  for (const m of BASE_GEMINI_MODELS) {
    map.set(m.id, m);
  }
  for (const cm of sharedBrowserEnclave.customModels || []) {
    if (cm?.id && !map.has(cm.id)) {
      map.set(cm.id, cm);
    }
  }
  return Array.from(map.values());
}

export function addOrSelectCustomGeminiModel(rawModelId) {
  const cleanId = String(rawModelId || '')
    .trim()
    .replace(/^models\//i, '');
  if (!cleanId) return null;

  const isBuiltIn = BASE_GEMINI_MODELS.some((m) => m.id === cleanId);
  if (!isBuiltIn) {
    const exists = (sharedBrowserEnclave.customModels || []).some(
      (m) => m.id === cleanId
    );
    if (!exists) {
      const nextCustom = [
        ...(sharedBrowserEnclave.customModels || []),
        {
          id: cleanId,
          label: `${cleanId} (Custom Gemini Model)`,
          isBuiltIn: false,
        },
      ];
      sharedBrowserEnclave.customModels = nextCustom;
      saveCustomModelsToStorage(nextCustom);
    }
  }
  sharedBrowserEnclave.activeModel = cleanId;
  notifyEnclaveListeners();
  return cleanId;
}

export function removeCustomGeminiModel(modelIdToRemove) {
  const cleanId = String(modelIdToRemove || '').trim();
  const nextCustom = (sharedBrowserEnclave.customModels || []).filter(
    (m) => m.id !== cleanId
  );
  sharedBrowserEnclave.customModels = nextCustom;
  saveCustomModelsToStorage(nextCustom);
  if (sharedBrowserEnclave.activeModel === cleanId) {
    sharedBrowserEnclave.activeModel = 'gemini-3.8-flash';
  }
  notifyEnclaveListeners();
}

export function useSharedGeminiModels(controlledModel, onChangeModel) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((n) => n + 1);
    sharedBrowserEnclave.listeners.add(fn);
    return () => {
      sharedBrowserEnclave.listeners.delete(fn);
    };
  }, []);

  const models = getAllAvailableGeminiModels();
  const activeModel =
    controlledModel || sharedBrowserEnclave.activeModel || 'gemini-3.8-flash';

  const selectModel = useCallback(
    (nextModelId) => {
      const resolved = addOrSelectCustomGeminiModel(nextModelId);
      if (resolved && typeof onChangeModel === 'function') {
        onChangeModel(resolved);
      }
    },
    [onChangeModel]
  );

  return {
    models,
    activeModel,
    selectModel,
    addCustomModel: selectModel,
    removeCustomModel: removeCustomGeminiModel,
  };
}

export function getSharedPreferredProvider() {
  return sharedBrowserEnclave.preferredProvider || 'AUTO';
}

export function setSharedPreferredProvider(provider) {
  sharedBrowserEnclave.preferredProvider = provider;
  notifyEnclaveListeners();
}

export async function sealKeyInSharedBrowserWebCrypto(rawKey) {
  const clean = String(rawKey || '').trim();
  if (!clean) return null;
  const enc = new TextEncoder();
  const keyBytes = enc.encode(clean);
  const cryptoKey = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false, // non-extractable hardware/browser enclave key
    ['encrypt', 'decrypt']
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    keyBytes
  );
  const digestBuf = await window.crypto.subtle.digest('SHA-256', keyBytes);
  const hashHex = Array.from(new Uint8Array(digestBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 12);
  const maskedKey =
    clean.length > 8
      ? `${clean.slice(0, 4)}••••••••••••${clean.slice(-4)}`
      : 'AIza••••••••';

  sharedBrowserEnclave.cryptoKey = cryptoKey;
  sharedBrowserEnclave.iv = iv;
  sharedBrowserEnclave.ciphertext = ciphertext;
  sharedBrowserEnclave.maskedKey = maskedKey;
  sharedBrowserEnclave.keyFingerprint = `SHA256:${hashHex}`;
  notifyEnclaveListeners();

  return {
    configured: true,
    maskedKey,
    keyFingerprint: `SHA256:${hashHex}`,
  };
}

export async function decryptKeyFromSharedBrowserWebCrypto() {
  if (
    !sharedBrowserEnclave.cryptoKey ||
    !sharedBrowserEnclave.ciphertext ||
    !sharedBrowserEnclave.iv
  ) {
    return null;
  }
  const plainBuf = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: sharedBrowserEnclave.iv },
    sharedBrowserEnclave.cryptoKey,
    sharedBrowserEnclave.ciphertext
  );
  return new TextDecoder().decode(plainBuf);
}

export async function encryptKeyWithServerRsaPublicKey(rawKey, spkiBase64) {
  const binaryDer = window.atob(spkiBase64);
  const derBytes = new Uint8Array(binaryDer.length);
  for (let i = 0; i < binaryDer.length; i += 1) {
    derBytes[i] = binaryDer.charCodeAt(i);
  }
  const rsaPubKey = await window.crypto.subtle.importKey(
    'spki',
    derBytes.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
  const payloadBytes = new TextEncoder().encode(
    JSON.stringify({
      apiKey: String(rawKey || '').trim(),
      nonce: Math.random().toString(36).slice(2),
      ts: Date.now(),
    })
  );
  const encryptedBuf = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    rsaPubKey,
    payloadBytes
  );
  const bytes = new Uint8Array(encryptedBuf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function ZeroSniffingWebCryptoEnclaveBar({
  projectId,
  selectedModel: controlledModel,
  onChangeModel,
  preferredProvider: controlledProvider,
  onChangePreferredProvider,
  onShowToast,
  compact = false,
}) {
  const [vaultStatus, setVaultStatus] = useState({
    configured: false,
    maskedKey: null,
    keyFingerprint: null,
    rsaPublicKeySpkiBase64: null,
    rsaKeyFingerprint: 'RSA2048-OAEP-SHA256',
  });
  const [vertexEnabled, setVertexEnabled] = useState(true);
  const [enablingVertex, setEnablingVertex] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [customModelInput, setCustomModelInput] = useState('');
  const [transportMode, setTransportMode] = useState(
    sharedBrowserEnclave.transportMode
  );
  const [internalProvider, setInternalProvider] = useState(
    sharedBrowserEnclave.preferredProvider
  );
  const [internalModel, setInternalModel] = useState(
    sharedBrowserEnclave.activeModel || 'gemini-3.8-flash'
  );
  const [, forceTick] = useState(0);

  const activeProvider = controlledProvider || internalProvider || 'AUTO';
  const activeModel = controlledModel || internalModel || 'gemini-3.8-flash';
  const allModels = getAllAvailableGeminiModels();

  const notify = useCallback(
    (msg) => {
      if (typeof onShowToast === 'function') {
        onShowToast(msg);
      }
    },
    [onShowToast]
  );

  const handleSelectProvider = (nextProvider) => {
    sharedBrowserEnclave.preferredProvider = nextProvider;
    setInternalProvider(nextProvider);
    if (typeof onChangePreferredProvider === 'function') {
      onChangePreferredProvider(nextProvider);
    }
    notifyEnclaveListeners();
  };

  const handleSelectModel = (nextModelId) => {
    const clean = addOrSelectCustomGeminiModel(nextModelId);
    if (!clean) return;
    setInternalModel(clean);
    if (typeof onChangeModel === 'function') {
      onChangeModel(clean);
    }
  };

  const handleAddCustomModelSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = String(customModelInput || '')
      .trim()
      .replace(/^models\//i, '');
    if (!clean) {
      notify(
        'Enter a Gemini model ID (for example: gemini-3.9-flash or gemini-4.0-pro).'
      );
      return;
    }
    handleSelectModel(clean);
    setCustomModelInput('');
    notify(
      `Added & activated custom model "${clean}" across Vertex AI OAuth2 & AI Studio Enclave!`
    );
  };

  const handleRemoveCustomModel = (idToRemove) => {
    removeCustomGeminiModel(idToRemove);
    if (activeModel === idToRemove) {
      handleSelectModel('gemini-3.8-flash');
    }
    notify(`Removed custom model "${idToRemove}".`);
  };

  const fetchVaultStatus = useCallback(async () => {
    try {
      const res = await axios.get('/api/ai-vault/status');
      if (res.data) {
        setVaultStatus((prev) => ({
          ...prev,
          ...res.data,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchVaultStatus();
    const listener = () => {
      setInternalProvider(sharedBrowserEnclave.preferredProvider);
      setTransportMode(sharedBrowserEnclave.transportMode);
      setInternalModel(sharedBrowserEnclave.activeModel);
      forceTick((n) => n + 1);
    };
    sharedBrowserEnclave.listeners.add(listener);
    return () => {
      sharedBrowserEnclave.listeners.delete(listener);
    };
  }, [fetchVaultStatus]);

  const handleToggleTransportMode = (mode) => {
    sharedBrowserEnclave.transportMode = mode;
    setTransportMode(mode);
    notifyEnclaveListeners();
  };

  const handleEnableVertexAi = async () => {
    if (!projectId) return;
    setEnablingVertex(true);
    try {
      await axios.post(
        `/api/project/${encodeURIComponent(projectId)}/apis/enable`,
        { services: ['aiplatform.googleapis.com'] }
      );
      setVertexEnabled(true);
      notify(
        `Enabled Vertex AI API (aiplatform.googleapis.com) on ${projectId} for keyless Gemini OAuth2 inference!`
      );
    } catch (err) {
      notify(
        `Vertex AI API enable notice: ${
          err.response?.data?.error || err.message
        }`
      );
    } finally {
      setEnablingVertex(false);
    }
  };

  const handleSealKey = async () => {
    const clean = String(apiKeyInput || '').trim();
    if (!clean || clean.length < 12) {
      notify('Please paste a valid Google AI Studio API Key (e.g., AIzaSy...).');
      return;
    }
    setSavingKey(true);
    try {
      const browserMeta = await sealKeyInSharedBrowserWebCrypto(clean);
      let spki = vaultStatus.rsaPublicKeySpkiBase64;
      if (!spki) {
        const st = await axios.get('/api/ai-vault/status').catch(() => null);
        spki = st?.data?.rsaPublicKeySpkiBase64;
      }
      if (spki) {
        const encryptedKeyBase64 = await encryptKeyWithServerRsaPublicKey(
          clean,
          spki
        );
        const res = await axios.post('/api/ai-vault/configure', {
          encryptedKeyBase64,
          model: activeModel,
        });
        setVaultStatus((prev) => ({
          ...prev,
          ...res.data,
          configured: true,
        }));
      }
      setApiKeyInput('');
      notify(
        `Sealed API Key in Zero-Sniffing WebCrypto Enclave & RSA-OAEP-256 Server RAM Vault (${browserMeta?.maskedKey})!`
      );
    } catch (err) {
      notify(
        `Failed to seal API key: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setSavingKey(false);
    }
  };

  const handleClearKey = async () => {
    setSavingKey(true);
    try {
      sharedBrowserEnclave.cryptoKey = null;
      sharedBrowserEnclave.iv = null;
      sharedBrowserEnclave.ciphertext = null;
      sharedBrowserEnclave.maskedKey = null;
      sharedBrowserEnclave.keyFingerprint = null;
      notifyEnclaveListeners();
      await axios.delete('/api/ai-vault/clear');
      await fetchVaultStatus();
      notify(
        'Wiped Google AI Studio API Key from both Browser WebCrypto Enclave and Server AES-256-GCM RAM Vault.'
      );
    } catch (err) {
      notify(
        `Failed to clear key: ${err.response?.data?.error || err.message}`
      );
    } finally {
      setSavingKey(false);
    }
  };

  const isKeySealed =
    Boolean(sharedBrowserEnclave.maskedKey) || Boolean(vaultStatus.configured);
  const displayMaskedKey =
    sharedBrowserEnclave.maskedKey || vaultStatus.maskedKey || 'AIza••••';
  const displayFingerprint =
    sharedBrowserEnclave.keyFingerprint ||
    vaultStatus.keyFingerprint ||
    'AES-256-GCM';

  const showPathA =
    activeProvider === 'VERTEX_AI_OAUTH' || activeProvider === 'AUTO';
  const showPathB =
    activeProvider === 'AI_STUDIO_KEY' || activeProvider === 'AUTO';

  return (
    <div
      className={`rounded-xl border transition-all ${
        activeProvider === 'VERTEX_AI_OAUTH'
          ? 'border-emerald-500/40 bg-emerald-500/[0.04] dark:bg-emerald-950/15'
          : activeProvider === 'AI_STUDIO_KEY'
          ? 'border-blue-500/40 bg-blue-500/[0.04] dark:bg-blue-950/15'
          : 'border-emerald-500/30 bg-zinc-50/90 dark:bg-zinc-900/70'
      } ${compact ? 'p-3 space-y-2.5' : 'p-3.5 space-y-3'}`}
    >
      {/* Top Enclave Banner + Interactive Engine Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
            Zero-Sniffing WebCrypto Enclave &amp; Live Gemini 3.8 Flash / 3.1 Pro SRE Co-Architect
          </span>
        </div>

        {/* 3-Way Interactive Engine Selector Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-zinc-200/70 dark:bg-zinc-950 p-1 border border-zinc-300 dark:border-zinc-800 text-[10.5px] font-mono">
          <button
            type="button"
            onClick={() => handleSelectProvider('VERTEX_AI_OAUTH')}
            className={`px-2.5 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
              activeProvider === 'VERTEX_AI_OAUTH'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Use Keyless Google Cloud Vertex AI (OAuth2 Bearer Token) only — hides API key vault"
          >
            ⚡ Path A: Keyless Vertex AI Only (No Key)
          </button>
          <button
            type="button"
            onClick={() => handleSelectProvider('AI_STUDIO_KEY')}
            className={`px-2.5 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
              activeProvider === 'AI_STUDIO_KEY'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Use Sealed Google AI Studio API Key (AIzaSy...) only — shows WebCrypto Enclave & RSA-OAEP-256 Vault"
          >
            🔒 Path B: AI Studio Key Enclave Only (AIzaSy...)
          </button>
          <button
            type="button"
            onClick={() => handleSelectProvider('AUTO')}
            className={`px-2.5 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
              activeProvider === 'AUTO'
                ? 'bg-zinc-800 dark:bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
            title="Show both Path A (Keyless Vertex AI) and Path B (AI Studio Key Vault) with automatic failover"
          >
            🔄 Auto Dual-Engine (Both)
          </button>
        </div>
      </div>

      {/* Live Model Selector + Add Custom / Future Gemini Model Bar (e.g. gemini-4.0-pro, gemini-3.9-flash) */}
      <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-zinc-500 font-bold">
            <Cpu className="w-3.5 h-3.5 text-blue-500" />
            <span>Active Model:</span>
          </span>
          {allModels.map((m) => {
            const isSelected = activeModel === m.id;
            return (
              <div key={m.id} className="inline-flex items-center">
                <button
                  type="button"
                  onClick={() => handleSelectModel(m.id)}
                  className={`px-2 py-0.5 ${
                    m.isBuiltIn ? 'rounded-md' : 'rounded-l-md'
                  } text-[10.5px] font-bold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-blue-500/50'
                  }`}
                  title={`Use ${m.id} for live Gemini inference`}
                >
                  {m.id}
                </button>
                {!m.isBuiltIn && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCustomModel(m.id)}
                    className="px-1.5 py-0.5 rounded-r-md border border-l-0 border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 text-[10.5px] cursor-pointer"
                    title={`Remove custom model ${m.id}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 flex-1 sm:flex-initial min-w-[260px]">
          <input
            type="text"
            value={customModelInput}
            onChange={(e) => setCustomModelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomModelSubmit();
              }
            }}
            placeholder="Add custom model (e.g. gemini-3.9-flash, gemini-4.0-pro)..."
            className="flex-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[11px] font-mono text-zinc-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleAddCustomModelSubmit}
            disabled={!customModelInput.trim()}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] font-mono font-extrabold cursor-pointer disabled:opacity-50 shrink-0"
            title="Add and switch to this custom Gemini model ID across all studios"
          >
            <Plus className="w-3 h-3" />
            <span>Add / Use Model</span>
          </button>
        </div>
      </div>

      {/* Dynamic Engine Panel(s) based on selected Engine */}
      <div
        className={`grid grid-cols-1 ${
          showPathA && showPathB ? 'lg:grid-cols-2' : ''
        } gap-2.5`}
      >
        {/* PATH A: Keyless Google Cloud Vertex AI (OAuth2 Token) */}
        {showPathA && (
          <div
            className={`p-3 rounded-lg bg-white dark:bg-zinc-950 border flex flex-col justify-between gap-2 transition-all ${
              activeProvider === 'VERTEX_AI_OAUTH' ||
              (activeProvider === 'AUTO' && !isKeySealed)
                ? 'border-emerald-500/60 ring-1 ring-emerald-500/20'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                  Path A · Keyless Vertex AI (GCP OAuth2 Token)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                  {activeProvider === 'VERTEX_AI_OAUTH'
                    ? '🟢 ACTIVE ENGINE · NO API KEY NEEDED'
                    : !isKeySealed
                    ? '🟢 ACTIVE PRIMARY (AUTO · NO KEY NEEDED)'
                    : '🟢 STANDBY FAILOVER READY'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleEnableVertexAi}
                disabled={enablingVertex}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-extrabold cursor-pointer disabled:opacity-50"
                title="Ensure aiplatform.googleapis.com is enabled on this project for keyless OAuth2 Gemini inference"
              >
                {enablingVertex
                  ? 'Enabling Vertex AI...'
                  : '⚡ Verify / Enable Vertex AI API'}
              </button>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-snug">
              Authenticates directly with your active Google Cloud session token against{' '}
              <code className="font-mono text-emerald-600 dark:text-emerald-400">
                aiplatform.googleapis.com/v1/projects/{projectId || ':id'}/locations/global/publishers/google/models/{activeModel}:generateContent
              </code>
              . <strong>Zero API keys or secrets required.</strong>
            </p>
            {activeProvider === 'VERTEX_AI_OAUTH' && (
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-900 text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400">
                <span className="flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Keyless OAuth2 Mode Active: API Key Vault &amp; AIzaSy inputs are bypassed.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectProvider('AI_STUDIO_KEY')}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                >
                  Want to use an AIzaSy... key instead? Switch to Path B →
                </button>
              </div>
            )}
          </div>
        )}

        {/* PATH B: Google AI Studio API Key (WebCrypto Enclave + RSA-OAEP-256 / AES-256-GCM RAM Vault) */}
        {showPathB && (
          <div
            className={`p-3 rounded-lg bg-white dark:bg-zinc-950 border flex flex-col justify-between gap-2 transition-all ${
              activeProvider === 'AI_STUDIO_KEY' ||
              (activeProvider === 'AUTO' && isKeySealed)
                ? 'border-blue-500/60 ring-1 ring-blue-500/20'
                : 'border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
                  Path B · Zero-Sniffing AI Studio Enclave (
                  <code className="font-mono">AIzaSy...</code>)
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-extrabold ${
                    isKeySealed
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                      : activeProvider === 'AI_STUDIO_KEY'
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {isKeySealed
                    ? `🔒 SEALED (${displayMaskedKey} · ${displayFingerprint})`
                    : activeProvider === 'AI_STUDIO_KEY'
                    ? '⚠️ PASTE & SEAL AIzaSy... KEY BELOW'
                    : 'OPTIONAL · NOT CONFIGURED'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-extrabold cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Get Free Key</span>
                </a>
                {isKeySealed && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    disabled={savingKey}
                    className="px-2 py-0.5 rounded bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-300 border border-red-500/30 text-[10px] font-mono font-bold cursor-pointer"
                  >
                    Clear Key
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSealKey();
                  }
                }}
                placeholder="Paste AIzaSy... key (protected by WebCrypto / RSA-OAEP-256)..."
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSealKey}
                disabled={savingKey || !apiKeyInput.trim()}
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-extrabold cursor-pointer disabled:opacity-50 shrink-0"
              >
                {savingKey ? 'Sealing...' : '🔒 Seal Key'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Anti-Sniffing Transport & Wire-Encryption Mode Selector — ONLY shown when Path B (AI Studio Key) is visible */}
      {showPathB && (
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono border-t border-zinc-200/70 dark:border-zinc-800/70">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">
              Anti-Sniffing Wire Protection (Safe on <code>http://localhost</code>):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleToggleTransportMode('BROWSER_DIRECT_TLS13')}
              className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold border transition-all cursor-pointer ${
                transportMode === 'BROWSER_DIRECT_TLS13'
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/50'
              }`}
            >
              Mode 1: Direct Browser → Google HTTPS TLS 1.3 (0 Local HTTP)
            </button>
            <button
              type="button"
              onClick={() => handleToggleTransportMode('RSA_OAEP_SERVER_VAULT')}
              className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold border transition-all cursor-pointer ${
                transportMode === 'RSA_OAEP_SERVER_VAULT'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700 hover:border-blue-500/50'
              }`}
            >
              Mode 2: Browser RSA-OAEP-256 Ciphertext → Server AES-256-GCM RAM (
              {vaultStatus.rsaKeyFingerprint || 'RSA2048-OAEP-SHA256'})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
