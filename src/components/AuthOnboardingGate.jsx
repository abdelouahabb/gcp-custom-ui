import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Cloud,
  KeyRound,
  FileJson,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Lock,
  Globe,
  FolderGit2,
  Smartphone,
  ExternalLink,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Generate PKCE code_verifier & S256 code_challenge in browser WebCrypto
async function generatePkcePair() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return { verifier, challenge };
}

const GOOGLE_SDK_AUTHN_REDIRECT =
  'https://sdk.cloud.google.com/applicationdefaultauthcode.html';

export default function AuthOnboardingGate({ onSessionEstablished }) {
  // Default to 'GMAIL_OAUTH' first so mobile/PWA users see "Sign in with Google (Gmail)" immediately
  const [authTab, setAuthTab] = useState('GMAIL_OAUTH'); // 'GMAIL_OAUTH' | 'DETECTED' | 'TOKEN' | 'ADC_JSON'
  const [discoverData, setDiscoverData] = useState({
    detectedAccounts: [],
    activeAccount: '',
    defaultProject: '',
    defaultOAuthClientId:
      '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Gmail / Google OAuth 2.0 states
  const [pkceVerifier, setPkceVerifier] = useState('');
  const [authCodeInput, setAuthCodeInput] = useState('');
  const [popupOpened, setPopupOpened] = useState(false);
  const [showCustomClientId, setShowCustomClientId] = useState(false);
  const [customOAuthClientId, setCustomOAuthClientId] = useState(
    () => localStorage.getItem('cloudpulse_oauth_client_id') || ''
  );

  // Other auth mode inputs
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [adcJsonInput, setAdcJsonInput] = useState('');
  const [copiedCmd, setCopiedCmd] = useState(false);

  // Step 2: Project Picker after account is authenticated
  const [connectedSession, setConnectedSession] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [customProjectIdInput, setCustomProjectIdInput] = useState('');

  useEffect(() => {
    axios
      .get('/api/auth/discover')
      .then((res) => {
        setDiscoverData(res.data);
      })
      .catch(() => {});
  }, []);

  // Automatically handle OAuth 2.0 redirect if Google redirects back with #access_token=...
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.slice(1));
      const hashToken = params.get('access_token');
      if (hashToken) {
        window.history.replaceState(null, '', window.location.pathname);
        setLoading(true);
        axios
          .post('/api/auth/connect', {
            mode: 'ACCESS_TOKEN',
            accessToken: hashToken,
          })
          .then((res) => {
            setConnectedSession(res.data);
            setSelectedProject(
              res.data.defaultProject || res.data.projects?.[0]?.projectId || ''
            );
          })
          .catch((err) => {
            setErrorMsg(
              err.response?.data?.error ||
                'Failed to verify Google OAuth redirect token.'
            );
          })
          .finally(() => setLoading(false));
      }
    }
  }, []);

  // 1-Tap Sign in with Gmail / Google Account (Universal PKCE Flow — works on any Mobile/Cloud Run URL with zero console setup)
  const handleStartGmailPkceSignIn = async () => {
    setErrorMsg(null);
    const { verifier, challenge } = await generatePkcePair();
    setPkceVerifier(verifier);
    sessionStorage.setItem('cloudpulse_pkce_verifier', verifier);

    const clientId =
      discoverData.defaultOAuthClientId ||
      '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com';
    const scope = encodeURIComponent(
      'openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/sqlservice.login'
    );
    const authUrl = `https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=${encodeURIComponent(
      clientId
    )}&redirect_uri=${encodeURIComponent(
      GOOGLE_SDK_AUTHN_REDIRECT
    )}&scope=${scope}&code_challenge=${encodeURIComponent(
      challenge
    )}&code_challenge_method=S256&access_type=offline&prompt=consent&token_usage=remote`;

    window.open(authUrl, '_blank', 'noopener,noreferrer');
    setPopupOpened(true);
  };

  // Exchange Gmail Authorization Code for live OAuth 2.0 session
  const handleVerifyGmailAuthCode = async (e) => {
    e.preventDefault();
    const raw = authCodeInput.trim();
    if (!raw) return;

    // Allow user to paste either the raw code (4/0A...) or the full redirect URL if they copied the address bar
    let extractedCode = raw;
    if (raw.includes('code=')) {
      try {
        const u = new URL(raw);
        extractedCode = u.searchParams.get('code') || raw;
      } catch {
        const match = raw.match(/[?&]code=([^&]+)/);
        if (match) extractedCode = decodeURIComponent(match[1]);
      }
    }

    const verifier =
      pkceVerifier || sessionStorage.getItem('cloudpulse_pkce_verifier') || '';

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/connect', {
        mode: 'GOOGLE_OAUTH_CODE',
        authCode: extractedCode,
        codeVerifier: verifier,
        redirectUri: GOOGLE_SDK_AUTHN_REDIRECT,
      });
      setConnectedSession(res.data);
      setSelectedProject(
        res.data.defaultProject || res.data.projects?.[0]?.projectId || ''
      );
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          'Failed to exchange Google authorization code. Please click "Sign in with Google (Gmail)" and paste the fresh code.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Direct 1-Tap Redirect if user configured their own OAuth Web Client ID for their Cloud Run URL
  const handleDirectGmailRedirect = () => {
    if (!customOAuthClientId.trim()) {
      setErrorMsg('Please enter your Google OAuth 2.0 Web Client ID first.');
      return;
    }
    localStorage.setItem(
      'cloudpulse_oauth_client_id',
      customOAuthClientId.trim()
    );
    const redirectUri = window.location.origin;
    const scope = encodeURIComponent(
      'openid email https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/cloud-platform'
    );
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      customOAuthClientId.trim()
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${scope}&prompt=select_account`;
    window.location.href = authUrl;
  };

  const handleConnectLocalAccount = async (email) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/connect', {
        mode: 'LOCAL_ADC',
        email,
      });
      setConnectedSession(res.data);
      setSelectedProject(
        res.data.defaultProject || res.data.projects?.[0]?.projectId || ''
      );
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error || err.message || 'Failed to connect account.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnectToken = async (e) => {
    e.preventDefault();
    if (!accessTokenInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/connect', {
        mode: 'ACCESS_TOKEN',
        accessToken: accessTokenInput.trim(),
      });
      setConnectedSession(res.data);
      setSelectedProject(
        res.data.defaultProject || res.data.projects?.[0]?.projectId || ''
      );
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          'Token validation failed. Ensure token has cloud-platform scope.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConnectAdcJson = async (e) => {
    e.preventDefault();
    if (!adcJsonInput.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await axios.post('/api/auth/connect', {
        mode: 'ADC_JSON',
        adcJson: adcJsonInput.trim(),
      });
      setConnectedSession(res.data);
      setSelectedProject(
        res.data.defaultProject || res.data.projects?.[0]?.projectId || ''
      );
    } catch (err) {
      setErrorMsg(
        err.response?.data?.error ||
          err.message ||
          'ADC JSON authentication failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = () => {
    if (!connectedSession || !selectedProject) return;
    onSessionEstablished({
      ...connectedSession,
      selectedProjectId: selectedProject,
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#131314] text-zinc-950 dark:text-zinc-50 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50/60 dark:bg-blue-500/[0.08] border border-blue-500/30 flex items-center justify-center shadow-sm">
              <Cloud className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold tracking-tight">
                  CloudPulse <span className="text-blue-500">2026</span>
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Mobile Gmail OAuth
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Sign in with your Gmail / Google Cloud account on Mobile or Desktop to manage your live GCP projects.
              </p>
            </div>
          </div>
        </div>

        {/* STEP 1: Connect Account (if not yet verified) */}
        {!connectedSession ? (
          <>
            {/* Instant 1-Click Local ADC / Cloud Run Session Banner when host credentials exist */}
            {discoverData.detectedAccounts?.length > 0 && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 flex-wrap">
                      <span>Detected Local GCP Session Ready:</span>
                      <span className="font-mono truncate">
                        {discoverData.activeAccount ||
                          discoverData.detectedAccounts[0]?.email}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                      Default Project:{' '}
                      <span className="font-mono font-semibold">
                        {discoverData.defaultProject || 'auto-detect'}
                      </span>{' '}
                      · Fast IPv4 OAuth2 Refresh
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    handleConnectLocalAccount(
                      discoverData.activeAccount ||
                        discoverData.detectedAccounts[0]?.email
                    )
                  }
                  className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3.5 py-2 text-xs font-extrabold transition-colors shadow-sm shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {loading ? 'Connecting...' : '1-Click Connect Host Session'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Auth Method Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-zinc-100 dark:bg-[#131314] p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('GMAIL_OAUTH');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authTab === 'GMAIL_OAUTH'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Connect Gmail</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('DETECTED');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authTab === 'DETECTED'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Detected Session</span>
                {discoverData.detectedAccounts?.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {discoverData.detectedAccounts.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('TOKEN');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authTab === 'TOKEN'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>OAuth Token</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('ADC_JSON');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  authTab === 'ADC_JSON'
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <FileJson className="w-3.5 h-3.5" />
                <span>ADC JSON</span>
              </button>
            </div>

            {/* Tab 1: Connect with Gmail / Google Sign-In (Mobile & Desktop Ready!) */}
            {authTab === 'GMAIL_OAUTH' && (
              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                        <span>Sign in with Google / Gmail (Mobile & Cloud Run Ready)</span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        Authenticate directly with any Gmail or Google Workspace account on your phone—no CLI or laptop required.
                      </p>
                    </div>
                  </div>

                  {/*Official-style Google Sign-In Button */}
                  <button
                    type="button"
                    onClick={handleStartGmailPkceSignIn}
                    className="w-full bg-white hover:bg-zinc-50 text-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md py-3 px-4 text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-3"
                  >
                    {/* Google G SVG */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                      />
                    </svg>
                    <span>Continue with Google (Select Gmail Account)</span>
                    <ExternalLink className="w-4 h-4 text-zinc-400" />
                  </button>

                  {/* Step 2 of PKCE: Paste single-tap verification code from Google */}
                  <form onSubmit={handleVerifyGmailAuthCode} className="space-y-2.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      {popupOpened ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ✓ Google Sign-In opened! Copy the authorization code shown after picking your Gmail account & paste below:
                        </span>
                      ) : (
                        <span>
                          After selecting your Gmail account in the Google window, tap <strong>Copy</strong> on the verification code and paste it here:
                        </span>
                      )}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        value={authCodeInput}
                        onChange={(e) => setAuthCodeInput(e.target.value)}
                        placeholder="Paste Google Auth Code (e.g. 4/0AeanS0...)"
                        className="flex-1 bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2.5 text-xs font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                      />
                      <button
                        type="submit"
                        disabled={loading || !authCodeInput.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-5 py-2.5 text-xs font-bold transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
                      >
                        {loading ? 'Connecting Gmail...' : 'Verify & Sign In'}
                      </button>
                    </div>
                  </form>

                  {/* Optional: Direct Zero-Paste Redirect for Custom Cloud Run Domain */}
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setShowCustomClientId((s) => !s)}
                      className="text-[11px] font-mono text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 flex items-center gap-1"
                    >
                      {showCustomClientId ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span>
                        Advanced: Have your own OAuth Web Client ID for {window.location.origin}?
                      </span>
                    </button>

                    {showCustomClientId && (
                      <div className="mt-2.5 space-y-2 p-3 rounded-lg bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800">
                        <div className="text-[11px] text-zinc-500">
                          If you add <code className="font-mono">{window.location.origin}</code> to your Google Cloud OAuth 2.0 Web Client ID Authorized Origins, you get instant redirect sign-in without copying a code:
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={customOAuthClientId}
                            onChange={(e) => setCustomOAuthClientId(e.target.value)}
                            placeholder="123456789-abcdef.apps.googleusercontent.com"
                            className="flex-1 bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2 text-xs font-mono text-zinc-950 dark:text-zinc-100"
                          />
                          <button
                            type="button"
                            onClick={handleDirectGmailRedirect}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-4 py-2 text-xs font-bold transition-colors whitespace-nowrap"
                          >
                            Direct Redirect Sign-In
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Detected Local / Cloud Run Account */}
            {authTab === 'DETECTED' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                    <span>
                      Detected Google Cloud Credentials (Local ADC / Cloud Run Service Account)
                    </span>
                  </div>

                  {discoverData.detectedAccounts?.length > 0 ? (
                    <div className="space-y-2">
                      {discoverData.detectedAccounts.map((acc) => (
                        <div
                          key={acc.email}
                          className="p-3.5 rounded-xl bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="text-sm font-bold font-mono text-zinc-950 dark:text-zinc-50">
                              {acc.email}
                            </div>
                            <div className="text-[11px] text-zinc-500">
                              Fast IPv4 OAuth2 Refresh · Default Project:{' '}
                              <span className="font-mono">
                                {discoverData.defaultProject || 'auto'}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleConnectLocalAccount(acc.email)}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] px-4 py-2 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                          >
                            <span>
                              {loading ? 'Connecting...' : 'Connect Account'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      No local gcloud ADC file found on this host. Use the{' '}
                      <strong>Connect Gmail</strong> tab to sign in with any Gmail account!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Connect Any Account via OAuth 2.0 Bearer Token */}
            {authTab === 'TOKEN' && (
              <form onSubmit={handleConnectToken} className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      1. Generate an Access Token on any Google Cloud account:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          'gcloud auth print-access-token'
                        );
                        setCopiedCmd(true);
                        setTimeout(() => setCopiedCmd(false), 1500);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-mono text-blue-500 hover:text-blue-400"
                    >
                      {copiedCmd ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-white dark:bg-zinc-950 text-emerald-400 font-mono text-xs overflow-x-auto">
                    $ gcloud auth login && gcloud auth print-access-token
                  </pre>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-zinc-500">
                        2. Paste OAuth 2.0 Bearer Token (Kept strictly in your browser session):
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowToken((v) => !v)}
                        className="text-[11px] font-mono text-blue-500 hover:text-blue-400 cursor-pointer"
                      >
                        {showToken ? 'Hide Token' : 'Show Token'}
                      </button>
                    </div>
                    <input
                      type={showToken ? 'text' : 'password'}
                      required
                      value={accessTokenInput}
                      onChange={(e) => setAccessTokenInput(e.target.value)}
                      placeholder="ya29.a0AeDClZ..."
                      className="w-full bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-[8px] px-3 py-2.5 text-xs font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !accessTokenInput.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] py-2.5 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading
                      ? 'Verifying Token & Fetching Live GCP Projects...'
                      : 'Connect with OAuth 2.0 Access Token'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 4: Paste ADC JSON (`application_default_credentials.json`) */}
            {authTab === 'ADC_JSON' && (
              <form onSubmit={handleConnectAdcJson} className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="text-xs text-zinc-500">
                    Paste the contents of{' '}
                    <code className="font-mono text-zinc-800 dark:text-zinc-200">
                      ~/.config/gcloud/application_default_credentials.json
                    </code>{' '}
                    from any account to exchange a fresh token over IPv4:
                  </div>
                  <textarea
                    rows={5}
                    required
                    value={adcJsonInput}
                    onChange={(e) => setAdcJsonInput(e.target.value)}
                    placeholder='{"client_id": "...", "client_secret": "...", "refresh_token": "...", "type": "authorized_user"}'
                    className="w-full bg-white dark:bg-[#202124] border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-3 text-xs font-mono shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100"
                  />
                  <button
                    type="submit"
                    disabled={loading || !adcJsonInput.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] py-2.5 text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {loading
                      ? 'Exchanging Refresh Token...'
                      : 'Connect with ADC Credentials JSON'}
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          /* STEP 2: Account Verified -> Pick Real GCP Project to Open! */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-zinc-500 dark:text-zinc-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Authenticated as{' '}
                    <span className="font-mono">{connectedSession.account}</span>
                  </div>
                  <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
                    Discovered {connectedSession.projects?.length || 0} active Google Cloud projects on this Gmail account.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConnectedSession(null)}
                className="text-xs underline text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                Change Account
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Select Your Real Google Cloud Project ({connectedSession.projects?.length || 0} available):
                </label>
                {(connectedSession.projects?.length || 0) > 2 && (
                  <input
                    type="text"
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    placeholder="Filter projects by ID or name..."
                    className="bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {(connectedSession.projects || [])
                  .filter((p) => {
                    if (!projectSearchQuery.trim()) return true;
                    const q = projectSearchQuery.toLowerCase();
                    return (
                      String(p.projectId || '').toLowerCase().includes(q) ||
                      String(p.name || '').toLowerCase().includes(q) ||
                      String(p.projectNumber || '').includes(q)
                    );
                  })
                  .map((p) => {
                    const isSel = selectedProject === p.projectId;
                    return (
                      <button
                        key={p.projectId}
                        type="button"
                        onClick={() => setSelectedProject(p.projectId)}
                        className={`p-3.5 rounded-md border text-left transition-all flex items-start justify-between gap-2 cursor-pointer ${
                          isSel
                            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/40'
                            : 'bg-zinc-50 dark:bg-[#131314] border-zinc-200 dark:border-zinc-800 hover:border-zinc-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-bold font-mono truncate text-zinc-950 dark:text-zinc-50">
                            {p.projectId}
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {p.name} {p.projectNumber ? `· #${p.projectNumber}` : ''}
                          </div>
                        </div>
                        {isSel && (
                          <Check className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
              </div>

              {/* Manual Project ID Fallback for IAM-restricted project listing */}
              <div className="pt-2 border-t border-zinc-200/70 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[11px] text-zinc-500 shrink-0">
                  Or enter a specific Project ID directly:
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={customProjectIdInput}
                    onChange={(e) => setCustomProjectIdInput(e.target.value)}
                    placeholder="e.g. my-production-gcp-project"
                    className="flex-1 bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 rounded-md px-2.5 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {customProjectIdInput.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        const cleanId = customProjectIdInput.trim();
                        setSelectedProject(cleanId);
                      }}
                      className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-mono font-bold cursor-pointer shrink-0"
                    >
                      Use {customProjectIdInput.trim()}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!selectedProject}
              onClick={handleFinishOnboarding}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md py-3 text-sm font-extrabold transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <FolderGit2 className="w-4 h-4" />
              <span>Launch Live Cockpit for {selectedProject}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500">
            {errorMsg}
          </div>
        )}

        {/* Security & Cloud Run Sharing Note */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            Zero-Trust Mobile OAuth · Direct Google Cloud REST APIs
          </span>
          <span className="font-mono">CloudPulse 2026 v3.0 · SDK 591.0.0</span>
        </div>
      </div>
    </div>
  );
}
