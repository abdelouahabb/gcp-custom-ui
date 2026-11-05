import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Video, EyeOff, Sliders } from 'lucide-react';

const STORAGE_KEY = 'cloudpulse_gde_tutorial_mode_v1';

const DEFAULT_CONFIG = {
  enabled: false,
  hideEmails: true,
  hideBillingIds: true,
  hideProjectNumbers: true,
  hideProjectIds: false,
  hidePublicIps: true,
  hideCreditBalances: true,
  hideSecretsAndKeys: true,
  creditShieldMigratedV2: true,
  instructorAlias: 'gde-instructor@google-cloud-demo.dev',
  projectAliasPrefix: 'gde-demo-project',
};

let latestGdeRuntimeContext = {
  accountEmail: '',
  projects: [],
  selectedProjectId: '',
};

export function getActiveGdeRuntimeContext() {
  return latestGdeRuntimeContext;
}

export function loadGdePrivacyConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    const merged = { ...DEFAULT_CONFIG, ...parsed };
    if (!parsed.creditShieldMigratedV2) {
      merged.hideCreditBalances = true;
      merged.creditShieldMigratedV2 = true;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
    }
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
}

function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isTeachingOrPrivateIp(ip) {
  if (!ip) return true;
  if (
    ip === '127.0.0.1' ||
    ip === '0.0.0.0' ||
    ip === '255.255.255.255' ||
    ip.startsWith('35.235.240.') || // Google Cloud IAP TCP forwarding range
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('169.254.')
  ) {
    return true;
  }
  const parts = ip.split('.').map(Number);
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) {
    return true;
  }
  return false;
}

const SYSTEM_SAFE_USERNAMES = new Set([
  'root',
  'ubuntu',
  'debian',
  'admin',
  'user',
  'users',
  'home',
  'gcloud',
  'google',
  'cloud',
  'cloudpulse',
  'docker',
  'containerd',
  'systemd',
  'nobody',
  'nogroup',
  'www-data',
  'nginx',
  'postgres',
  'mysql',
  'redis',
  'node',
  'python',
  'java',
  'gde-instructor',
  'gde_instructor',
]);

/**
 * Pure string redactor for GDE Tutorial / Screen-Share Mode.
 * Replaces personal emails, derived SSH/OS-Login usernames, /home/<user> paths,
 * service account project numbers, Cloud Billing Account IDs, GCP project numbers,
 * public IPv4/IPv6s, OAuth/API secrets, and remaining credit / bonus dollar balances.
 */
export function redactTextForGdeMode(text, cfg, context = null) {
  const activeCfg = cfg || loadGdePrivacyConfig();
  if (!activeCfg?.enabled || !text || typeof text !== 'string') return text;

  const ctx = context || latestGdeRuntimeContext || {};
  let out = text;
  const aliasEmail =
    (activeCfg.instructorAlias || '').trim() ||
    'gde-instructor@google-cloud-demo.dev';
  const aliasUser =
    (aliasEmail.split('@')[0] || 'gde-instructor').replace(
      /[^a-zA-Z0-9_-]/g,
      '-'
    ) || 'gde-instructor';

  // 1. Exact authenticated user account email + derived SSH / OS-Login POSIX usernames
  if (activeCfg.hideEmails && ctx.accountEmail) {
    const cleanEmail = String(ctx.accountEmail).trim();
    if (cleanEmail && cleanEmail.includes('@')) {
      const reExact = new RegExp(escapeRegExp(cleanEmail), 'gi');
      out = out.replace(reExact, aliasEmail);

      const rawLocal = cleanEmail.split('@')[0] || '';
      const sanitizedLocal = rawLocal.replace(/[^a-zA-Z0-9_-]/g, '_');
      const osLoginPosix = cleanEmail
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();

      if (osLoginPosix.length >= 4) {
        out = out.replace(
          new RegExp(escapeRegExp(osLoginPosix), 'gi'),
          `${aliasUser.replace(/-/g, '_')}_iam`
        );
      }
      for (const candidateUser of [rawLocal, sanitizedLocal]) {
        if (
          candidateUser &&
          candidateUser.length >= 3 &&
          !SYSTEM_SAFE_USERNAMES.has(candidateUser.toLowerCase())
        ) {
          const escUser = escapeRegExp(candidateUser);
          // Mask /home/<user>, /Users/<user>, user@host, su - <user>, and standalone username tokens
          out = out.replace(
            new RegExp(`(\\/home\\/|\\/Users\\/)${escUser}(?=\\/|\\b|$)`, 'gi'),
            `$1${aliasUser}`
          );
          out = out.replace(
            new RegExp(`\\b${escUser}(?=@[a-zA-Z0-9._-]+)`, 'gi'),
            aliasUser
          );
          out = out.replace(new RegExp(`\\b${escUser}\\b`, 'gi'), aliasUser);
        }
      }
    }
  }

  // 2. General email addresses, GCP Service Account emails & generic /home/<personal_user> paths
  if (activeCfg.hideEmails) {
    out = out.replace(
      /\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,
      (full, localPart, domain) => {
        if (full.toLowerCase() === aliasEmail.toLowerCase()) return full;
        const domLower = domain.toLowerCase();
        // Keep service account domain visible for tutorial clarity, mask the project/id prefix
        if (domLower.endsWith('.gserviceaccount.com')) {
          const maskedLocal = localPart.replace(/\d{6,}/g, '9900••••01');
          const finalLocal =
            maskedLocal === localPart
              ? `${localPart.slice(0, 3)}••••-sa`
              : maskedLocal;
          return `${finalLocal}@${domain}`;
        }
        return aliasEmail;
      }
    );
    // Redact any non-system /home/<username> directory path in SFTP, Disk Hotspot Analyzer, and journalctl
    out = out.replace(
      /(\/home\/)([a-zA-Z0-9._-]{3,32})(?=\/|\s|$|['",:;)\]])/g,
      (full, prefix, userDir) => {
        if (SYSTEM_SAFE_USERNAMES.has(userDir.toLowerCase())) return full;
        return `${prefix}${aliasUser}`;
      }
    );
  }

  // 3. Cloud Billing Account IDs (e.g., 01ABCD-23EFGH-45IJKL or billingAccounts/01ABCD-23EFGH-45IJKL)
  if (activeCfg.hideBillingIds) {
    out = out.replace(
      /\b([0-9A-Fa-f]{6})-([0-9A-Fa-f]{6})-([0-9A-Fa-f]{6})\b/g,
      '01GDE•-••••••-TUTOR1'
    );
    out = out.replace(
      /billingAccounts\/[0-9A-Za-z_-]{8,}/g,
      'billingAccounts/01GDE•-••••••-TUTOR1'
    );
  }

  // 4. GCP Project Numbers (#123456789012, projects/123456789012, Cloud Run URLs, Service Agents)
  if (activeCfg.hideProjectNumbers) {
    out = out.replace(/#(\d{9,14})\b/g, '#9900••••••01');
    out = out.replace(/projects\/(\d{9,14})\b/g, 'projects/9900••••••01');
    out = out.replace(/service-(\d{9,14})@/g, 'service-9900••••••01@');
    out = out.replace(/\b(\d{9,14})-compute@/g, '9900••••••01-compute@');
    out = out.replace(
      /-(\d{9,14})(\.[a-z0-9-]+\.run\.app)\b/gi,
      '-9900••••••01$2'
    );
    if (Array.isArray(ctx.projects)) {
      ctx.projects.forEach((proj) => {
        const pnum = String(proj?.projectNumber || '').trim();
        if (pnum && pnum.length >= 8) {
          out = out.replace(
            new RegExp(`\\b${escapeRegExp(pnum)}\\b`, 'g'),
            '9900••••••01'
          );
        }
      });
    }
  }

  // 5. Optional: Active GCP Project IDs (matches inside gs:// bucket names, Cloud Run URLs & log streams)
  if (activeCfg.hideProjectIds && Array.isArray(ctx.projects)) {
    const sortedProjects = [...ctx.projects]
      .map((proj, idx) => ({
        projectId: proj?.projectId,
        alias:
          idx === 0
            ? activeCfg.projectAliasPrefix || 'gde-demo-project'
            : `${activeCfg.projectAliasPrefix || 'gde-demo-project'}-${idx + 1}`,
      }))
      .filter((p) => p.projectId && p.projectId.length >= 4)
      .sort((a, b) => b.projectId.length - a.projectId.length);

    sortedProjects.forEach(({ projectId: pid, alias }) => {
      const reProj = new RegExp(escapeRegExp(pid), 'gi');
      out = out.replace(reProj, alias);
    });
  }

  // 6. Public IPv4, Public IPv6 & Reverse-DNS GCE Hostnames (preserves 127.0.0.1, 0.0.0.0, 10.x, 192.168.x, and IAP 35.235.240.x)
  if (activeCfg.hidePublicIps) {
    out = out.replace(
      /\b((?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})\b/g,
      (fullIp) => {
        if (isTeachingOrPrivateIp(fullIp)) return fullIp;
        const octets = fullIp.split('.');
        return `${octets[0]}.•••.•••.${octets[3]}`;
      }
    );
    // Reverse-DNS IPv4 hostnames in GCE/ISP logs (e.g. 34-120-55-99.googleusercontent.com)
    out = out.replace(
      /\b(\d{1,3})-(\d{1,3})-(\d{1,3})-(\d{1,3})(\.[a-zA-Z0-9.-]+\.(?:googleusercontent\.com|compute\.internal|bc\.googleusercontent\.com))\b/gi,
      '$1-•••-•••-$4$5'
    );
    // Public IPv6 addresses (e.g. 2600:1901:0:1234::1 or 2001:4860:4860::8888)
    out = out.replace(
      /\b([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g,
      (fullIpv6) => {
        const lower = fullIpv6.toLowerCase();
        if (lower === '::1' || lower.startsWith('fe80:') || lower.startsWith('fd')) {
          return fullIpv6;
        }
        const parts = fullIpv6.split(':').filter(Boolean);
        if (parts.length < 3) return fullIpv6;
        return `${parts[0]}:••••:••••:${parts[parts.length - 1]}`;
      }
    );
  }

  // 7. Live OAuth2 Access Tokens, GCP API Keys, Bearer JWTs & SSH Key Fingerprints in Logs / SFTP / Terminal
  if (activeCfg.hideSecretsAndKeys !== false) {
    out = out.replace(/\bya29\.[0-9A-Za-z._-]{12,}\b/g, 'ya29.••••••[GDE-SHIELD]');
    out = out.replace(/\bAIza[0-9A-Za-z_-]{28,}\b/g, 'AIza••••••[GDE-SHIELD]');
    out = out.replace(
      /\b(Bearer\s+)eyJ[0-9A-Za-z._-]{16,}\b/gi,
      '$1eyJ••••••[GDE-SHIELD]'
    );
    out = out.replace(
      /\bSHA256:[0-9A-Za-z+/=]{16,}\b/g,
      'SHA256:••••••[GDE-SHIELD]'
    );
  }

  // 8. Hide remaining credit / bonus / dollar balances during public streams (preserves $0 / $0.00 free-tier badges)
  if (activeCfg.hideCreditBalances !== false) {
    out = out.replace(
      /Remaining Bonus:\s*\$[0-9,.]+/gi,
      'Remaining Bonus: $•••.••'
    );
    out = out.replace(
      /-?\$(?!0(?:\.0+)?(?![0-9]))\d[\d,]*(?:\.\d+)?/g,
      (match) => (match.startsWith('-') ? '-$•••.••' : '$•••.••')
    );
  }

  return out;
}

/**
 * Top-Bar GDE Streamer & Tutorial Privacy Shield Component + Global DOM Redaction Engine.
 */
export default function GdeStreamerPrivacyShield({
  config,
  onChangeConfig,
  accountEmail = '',
  projects = [],
  selectedProjectId = '',
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);
  const textNodeCacheRef = useRef(new WeakMap());
  const modifiedNodesRef = useRef(new Set());
  const attrCacheRef = useRef(new WeakMap());
  const modifiedAttrElementsRef = useRef(new Set());
  const inputCacheRef = useRef(new WeakMap());
  const modifiedInputsRef = useRef(new Set());
  const isMutatingRef = useRef(false);

  latestGdeRuntimeContext = {
    accountEmail,
    projects:
      Array.isArray(projects) && projects.length > 0
        ? projects
        : selectedProjectId
        ? [{ projectId: selectedProjectId }]
        : [],
    selectedProjectId,
  };

  const updateConfig = useCallback(
    (patch) => {
      onChangeConfig((prev) => {
        const next = {
          ...prev,
          ...(typeof patch === 'function' ? patch(prev) : patch),
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(
            new CustomEvent('cloudpulse:gde-mode-change', { detail: next })
          );
        } catch {
          // ignore storage quota errors
        }
        return next;
      });
    },
    [onChangeConfig]
  );

  // Close popover when clicking outside
  useEffect(() => {
    if (!popoverOpen) return undefined;
    const handleOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [popoverOpen]);

  // Global Keyboard Shortcut: Alt+G or Ctrl+Shift+G to toggle GDE Tutorial Mode anytime during recording
  useEffect(() => {
    const onKeyDown = (e) => {
      if (
        (e.altKey && (e.key === 'g' || e.key === 'G')) ||
        ((e.ctrlKey || e.metaKey) &&
          e.shiftKey &&
          (e.key === 'g' || e.key === 'G'))
      ) {
        e.preventDefault();
        updateConfig((prev) => ({ ...prev, enabled: !prev.enabled }));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [updateConfig]);

  // Global DOM TextNode, Attribute & Unfocused Input Redaction Engine (Zero-Flash Synchronous MutationObserver)
  useEffect(() => {
    const cache = textNodeCacheRef.current;
    const modifiedNodes = modifiedNodesRef.current;
    const attrCache = attrCacheRef.current;
    const modifiedAttrEls = modifiedAttrElementsRef.current;
    const inputCache = inputCacheRef.current;
    const modifiedInputs = modifiedInputsRef.current;

    const setNativeInputValue = (el, val) => {
      try {
        const proto =
          el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement?.prototype
            : window.HTMLInputElement?.prototype;
        const setter =
          proto && Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) {
          setter.call(el, val);
        } else {
          el.value = val;
        }
      } catch {
        el.value = val;
      }
    };

    // When disabled, restore any previously redacted text nodes, attributes, and input values immediately
    if (!config.enabled) {
      if (
        modifiedNodes.size > 0 ||
        modifiedAttrEls.size > 0 ||
        modifiedInputs.size > 0
      ) {
        isMutatingRef.current = true;
        try {
          modifiedNodes.forEach((node) => {
            const entry = cache.get(node);
            if (
              entry &&
              entry.originalText !== undefined &&
              node.nodeValue === entry.lastMaskedText
            ) {
              node.nodeValue = entry.originalText;
            }
          });
          modifiedNodes.clear();

          modifiedAttrEls.forEach((el) => {
            const aEntry = attrCache.get(el);
            if (!aEntry) return;
            for (const attrName of ['title', 'placeholder']) {
              const slot = aEntry[attrName];
              if (
                slot &&
                slot.original !== undefined &&
                el.getAttribute(attrName) === slot.lastMasked
              ) {
                el.setAttribute(attrName, slot.original);
              }
            }
          });
          modifiedAttrEls.clear();

          modifiedInputs.forEach((el) => {
            const iEntry = inputCache.get(el);
            if (
              iEntry &&
              iEntry.originalValue !== undefined &&
              el.value === iEntry.lastMaskedValue
            ) {
              setNativeInputValue(el, iEntry.originalValue);
            }
          });
          modifiedInputs.clear();
        } finally {
          isMutatingRef.current = false;
        }
      }
      return undefined;
    }

    const contextObj = {
      accountEmail,
      projects:
        Array.isArray(projects) && projects.length > 0
          ? projects
          : selectedProjectId
          ? [{ projectId: selectedProjectId }]
          : [],
    };

    const SKIP_TAGS = new Set([
      'SCRIPT',
      'STYLE',
      'NOSCRIPT',
      'TEXTAREA',
      'INPUT',
      'PATH',
      'DEFS',
      'CLIPPATH',
      'LINEARGRADIENT',
      'RADIALGRADIENT',
      'CANVAS',
    ]);

    const NON_TEXT_INPUT_TYPES = new Set([
      'checkbox',
      'radio',
      'range',
      'number',
      'password',
      'file',
      'color',
      'date',
      'time',
      'datetime-local',
      'hidden',
      'submit',
      'button',
    ]);

    const processTextNode = (node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const parent = node.parentElement;
      if (!parent) return;
      const tag = (parent.tagName || '').toUpperCase();
      if (SKIP_TAGS.has(tag)) return;
      if (
        parent.closest(
          'canvas, script, style, textarea, input, defs, .xterm, [data-gde-ignore="true"]'
        )
      ) {
        return;
      }

      const currentVal = node.nodeValue || '';
      if (!currentVal || currentVal.length < 2) return;

      let entry = cache.get(node);
      if (!entry) {
        entry = { originalText: currentVal, lastMaskedText: currentVal };
        cache.set(node, entry);
      } else if (currentVal !== entry.lastMaskedText) {
        entry.originalText = currentVal;
      }

      let masked = redactTextForGdeMode(
        entry.originalText,
        config,
        contextObj
      );
      if (
        config.hideCreditBalances !== false &&
        masked === entry.originalText &&
        node.previousSibling &&
        node.previousSibling.nodeType === Node.TEXT_NODE &&
        /\$\s*$/.test(node.previousSibling.nodeValue || '')
      ) {
        const trimmed = entry.originalText.trim();
        if (/^(?!0(?:\.0+)?$)\d[\d,]*(?:\.\d+)?/.test(trimmed)) {
          masked = entry.originalText.replace(
            /\d[\d,]*(?:\.\d+)?/,
            '•••.••'
          );
        }
      }
      if (masked !== currentVal) {
        entry.lastMaskedText = masked;
        node.nodeValue = masked;
        modifiedNodes.add(node);
      } else {
        entry.lastMaskedText = currentVal;
      }
    };

    const processElementNode = (el) => {
      if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
      if (el.closest('[data-gde-ignore="true"], .xterm')) return;

      // 1. Redact native title & placeholder attributes
      for (const attrName of ['title', 'placeholder']) {
        if (el.hasAttribute(attrName)) {
          const currentAttr = el.getAttribute(attrName) || '';
          if (currentAttr.length >= 3) {
            let aEntry = attrCache.get(el);
            if (!aEntry) {
              aEntry = {};
              attrCache.set(el, aEntry);
            }
            let slot = aEntry[attrName];
            if (!slot) {
              slot = { original: currentAttr, lastMasked: currentAttr };
              aEntry[attrName] = slot;
            } else if (currentAttr !== slot.lastMasked) {
              slot.original = currentAttr;
            }
            const maskedAttr = redactTextForGdeMode(
              slot.original,
              config,
              contextObj
            );
            if (maskedAttr !== currentAttr) {
              slot.lastMasked = maskedAttr;
              el.setAttribute(attrName, maskedAttr);
              modifiedAttrEls.add(el);
            } else {
              slot.lastMasked = currentAttr;
            }
          }
        }
      }

      // 2. Visually mask unfocused text <input> and <textarea> values without firing React onChange
      const tag = (el.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (
          tag === 'INPUT' &&
          NON_TEXT_INPUT_TYPES.has((el.type || 'text').toLowerCase())
        ) {
          return;
        }
        if (document.activeElement === el) return;
        const currentVal = el.value || '';
        if (currentVal.length < 3) return;

        let iEntry = inputCache.get(el);
        if (!iEntry) {
          iEntry = { originalValue: currentVal, lastMaskedValue: currentVal };
          inputCache.set(el, iEntry);
        } else if (currentVal !== iEntry.lastMaskedValue) {
          iEntry.originalValue = currentVal;
        }

        const maskedVal = redactTextForGdeMode(
          iEntry.originalValue,
          config,
          contextObj
        );
        if (maskedVal !== currentVal) {
          iEntry.lastMaskedValue = maskedVal;
          setNativeInputValue(el, maskedVal);
          modifiedInputs.add(el);
        } else {
          iEntry.lastMaskedValue = currentVal;
        }
      }
    };

    const walkSubtree = (rootNode) => {
      if (!rootNode || isMutatingRef.current) return;
      isMutatingRef.current = true;
      try {
        if (rootNode.nodeType === Node.TEXT_NODE) {
          processTextNode(rootNode);
          return;
        }
        if (rootNode.nodeType !== Node.ELEMENT_NODE) return;
        processElementNode(rootNode);
        const walker = document.createTreeWalker(
          rootNode,
          NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
        );
        let n = walker.nextNode();
        while (n) {
          if (n.nodeType === Node.TEXT_NODE) {
            processTextNode(n);
          } else if (n.nodeType === Node.ELEMENT_NODE) {
            processElementNode(n);
          }
          n = walker.nextNode();
        }
      } finally {
        isMutatingRef.current = false;
      }
    };

    // Restore original value when user focuses an input to edit, and re-mask on blur
    const handleFocusIn = (e) => {
      const el = e.target;
      if (!el || !modifiedInputs.has(el)) return;
      const iEntry = inputCache.get(el);
      if (
        iEntry &&
        iEntry.originalValue !== undefined &&
        el.value === iEntry.lastMaskedValue
      ) {
        isMutatingRef.current = true;
        try {
          setNativeInputValue(el, iEntry.originalValue);
        } finally {
          isMutatingRef.current = false;
        }
      }
    };

    const handleFocusOut = (e) => {
      const el = e.target;
      if (!el || isMutatingRef.current) return;
      isMutatingRef.current = true;
      try {
        processElementNode(el);
      } finally {
        isMutatingRef.current = false;
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);

    // Run immediately and synchronously on mount/update so zero unmasked frames paint
    walkSubtree(document.body);

    const observer = new MutationObserver((mutations) => {
      if (isMutatingRef.current) return;
      for (let i = 0; i < mutations.length; i += 1) {
        const m = mutations[i];
        if (m.type === 'characterData') {
          walkSubtree(m.target);
        } else if (m.type === 'attributes') {
          if (m.target && m.target.nodeType === Node.ELEMENT_NODE) {
            isMutatingRef.current = true;
            try {
              processElementNode(m.target);
            } finally {
              isMutatingRef.current = false;
            }
          }
        } else if (m.addedNodes && m.addedNodes.length > 0) {
          for (let j = 0; j < m.addedNodes.length; j += 1) {
            walkSubtree(m.addedNodes[j]);
          }
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'placeholder', 'value'],
    });

    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
      document.removeEventListener('focusout', handleFocusOut, true);
      observer.disconnect();
    };
  }, [config, accountEmail, projects, selectedProjectId]);

  const activeShieldCount = [
    config.hideEmails,
    config.hideBillingIds,
    config.hideProjectNumbers,
    config.hideProjectIds,
    config.hidePublicIps,
    config.hideCreditBalances,
    config.hideSecretsAndKeys !== false,
  ].filter(Boolean).length;

  return (
    <div className={`relative shrink-0 ${popoverOpen ? 'z-50' : 'z-10'}`} ref={popoverRef} data-gde-ignore="true">
      <div className="inline-flex items-center rounded-[8px] shadow-sm">
        {/* Main 1-Click Toggle Button */}
        <button
          type="button"
          onClick={() => updateConfig({ enabled: !config.enabled })}
          title="GDE Streamer & Tutorial Privacy Mode (Shortcut: Alt+G) — Hides your email, Cloud Billing Account ID, Project Numbers, and Public IPs for safe screen sharing & video recording"
          className={`inline-flex items-center gap-1 rounded-l-[8px] px-2 py-1.5 text-[11px] font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
            config.enabled
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-sm'
              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-300 dark:border-zinc-700'
          }`}
        >
          {config.enabled ? (
            <>
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <Video className="w-3.5 h-3.5" />
              <span>GDE Mode: ON</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>GDE Mode</span>
            </>
          )}
        </button>

        {/* Shield Settings Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          title="Configure GDE Streamer Privacy Shield rules (Emails, Billing IDs, Project IDs, Public IPs)"
          className={`inline-flex items-center justify-center px-1.5 py-1.5 text-[11px] border-y border-r rounded-r-[8px] transition-colors cursor-pointer ${
            config.enabled
              ? 'bg-red-700 hover:bg-red-600 text-white border-red-500'
              : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Configurable Privacy Shield Popover */}
      {popoverOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#18181b] text-zinc-900 dark:text-zinc-100 shadow-2xl p-4 space-y-3 z-50">
          <div className="flex items-start justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 text-[10px] font-mono font-extrabold">
                  <Video className="w-3 h-3" />
                  <span>GDE TUTORIAL PRIVACY SHIELD</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  Alt+G
                </span>
              </div>
              <h4 className="text-xs font-extrabold mt-1">
                Screen-Share & Video Recording Redactor
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Masks sensitive identifiers across all 20 studios while keeping live GCP API calls 100% functional.
              </p>
            </div>

            <button
              type="button"
              onClick={() => updateConfig({ enabled: !config.enabled })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold cursor-pointer border ${
                config.enabled
                  ? 'bg-red-600 text-white border-red-500'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
              }`}
            >
              {config.enabled ? 'ACTIVE' : 'ENABLE'}
            </button>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-1.5 text-xs">
            {[
              {
                key: 'hideEmails',
                label: 'Hide Emails, SSH Users & /home Paths',
                desc: 'Masks personal/IAM emails, SSH usernames & /home/<user> paths',
              },
              {
                key: 'hideBillingIds',
                label: 'Hide Cloud Billing Account IDs',
                desc: 'Masks 01XXXX-XXXXXX-XXXXXX -> 01GDE•-••••••-TUTOR1',
              },
              {
                key: 'hideProjectNumbers',
                label: 'Hide GCP Project Numbers',
                desc: 'Masks 12-digit project numbers in IDs, Cloud Run URLs & SAs',
              },
              {
                key: 'hidePublicIps',
                label: 'Hide External / Public IPv4 & IPv6',
                desc: 'Masks VM/LB public IPs while keeping 10.x & IAP ranges readable',
              },
              {
                key: 'hideSecretsAndKeys',
                label: 'Mask OAuth Tokens, API Keys & SSH Keys',
                desc: 'Masks ya29.•••, AIza•••, Bearer JWTs & SHA256:••• in logs/SSH',
              },
              {
                key: 'hideProjectIds',
                label: 'Mask Project IDs with Demo Alias',
                desc: 'Visually replaces project IDs across text & gs:// bucket URIs',
              },
              {
                key: 'hideCreditBalances',
                label: 'Mask Exact Credit / Dollar Balances',
                desc: 'Masks dollar balances ($1,240.00 -> $•••.••; keeps $0.00 badges)',
              },
            ].map((item) => {
              const checked =
                item.key === 'hideSecretsAndKeys'
                  ? config[item.key] !== false
                  : Boolean(config[item.key]);
              return (
                <label
                  key={item.key}
                  className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900/80 cursor-pointer select-none border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                >
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {item.label}
                    </div>
                    <div className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                      {item.desc}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      updateConfig({ [item.key]: e.target.checked })
                    }
                    className="mt-1 rounded border-zinc-400 dark:border-zinc-700"
                  />
                </label>
              );
            })}
          </div>

          {/* Custom Demo Alias Input */}
          <div className="pt-1 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 dark:text-zinc-400 mb-1">
                On-Screen Demo Email Alias
              </label>
              <input
                type="text"
                value={config.instructorAlias || ''}
                onChange={(e) =>
                  updateConfig({ instructorAlias: e.target.value })
                }
                placeholder="gde-instructor@google-cloud-demo.dev"
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 pt-1">
              <span>{activeShieldCount}/7 Privacy Shields Selected</span>
              <button
                type="button"
                onClick={() => setPopoverOpen(false)}
                className="px-2.5 py-1 rounded bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
