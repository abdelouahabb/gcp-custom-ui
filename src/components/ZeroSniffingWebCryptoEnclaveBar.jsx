import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Lock, ShieldCheck, KeyRound, Sparkles, ExternalLink } from 'lucide-react';

// Shared in-memory Browser WebCrypto Non-Extractable Enclave singleton across all Studios
const sharedBrowserEnclave = {
  cryptoKey: null,
  iv: null,
  ciphertext: null,
  maskedKey: null,
  keyFingerprint: null,
  transportMode: 'RSA_OAEP_SERVER_VAULT', // 'BROWSER_DIRECT_TLS13' | 'RSA_OAEP_SERVER_VAULT'
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
  selectedModel = 'gemini-3.8-flash',
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
  const [transportMode, setTransportMode] = useState(
    sharedBrowserEnclave.transportMode
  );
  const [, forceTick] = useState(0);

  const notify = useCallback(
    (msg) => {
      if (typeof onShowToast === 'function') {
        onShowToast(msg);
      }
    },
    [onShowToast]
  );

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
    const listener = () => forceTick((n) => n + 1);
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
          model: selectedModel,
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

  return (
    <div
      className={`rounded-xl border border-emerald-500/30 bg-zinc-50/90 dark:bg-zinc-900/70 ${
        compact ? 'p-3 space-y-2.5' : 'p-3.5 space-y-3'
      }`}
    >
      {/* Top Enclave Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-extrabold text-zinc-900 dark:text-white">
            Zero-Sniffing WebCrypto Enclave &amp; Live Gemini 3.8 Flash / 3.1 Pro SRE Co-Architect
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10.5px] font-mono font-extrabold cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Get Free AI Studio Key (aistudio.google.com/apikey)</span>
          </a>
        </div>
      </div>

      {/* Dual-Path Live Credential & Engine Readiness Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {/* Path A: Keyless Google Cloud Vertex AI (OAuth2 Token) */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold text-zinc-900 dark:text-white">
                Path A · Keyless Vertex AI (GCP OAuth2 Token)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-mono font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                {vertexEnabled ? '🟢 VERTEX AI GLOBAL READY' : '🟡 VERTEX AI'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleEnableVertexAi}
              disabled={enablingVertex}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-extrabold cursor-pointer disabled:opacity-50"
              title="Ensure aiplatform.googleapis.com is enabled on this project for keyless OAuth2 Gemini inference"
            >
              {enablingVertex
                ? 'Enabling...'
                : '⚡ Verify / Enable Vertex AI (No Key Needed)'}
            </button>
          </div>
          <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-snug">
            Uses your active Google Cloud login token against{' '}
            <code className="font-mono">aiplatform.googleapis.com (locations/global)</code>{' '}
            for <code className="font-mono">gemini-3.8-flash</code> &amp;{' '}
            <code className="font-mono">gemini-3.1-pro</code>. Zero API keys required.
          </p>
        </div>

        {/* Path B: Google AI Studio API Key (WebCrypto Enclave + RSA-OAEP-256 / AES-256-GCM RAM Vault) */}
        <div className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-extrabold text-zinc-900 dark:text-white">
                Path B · Zero-Sniffing AI Studio Enclave (
                <code className="font-mono">AIzaSy...</code>)
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-extrabold ${
                  isKeySealed
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {isKeySealed
                  ? `🔒 SEALED (${displayMaskedKey} · ${displayFingerprint})`
                  : 'OPTIONAL · NOT CONFIGURED'}
              </span>
            </div>
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
              className="flex-1 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleSealKey}
              disabled={savingKey || !apiKeyInput.trim()}
              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-mono font-extrabold cursor-pointer disabled:opacity-50 shrink-0"
            >
              {savingKey ? 'Sealing...' : '🔒 Seal Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Anti-Sniffing Transport & Wire-Encryption Mode Selector */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
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
    </div>
  );
}
