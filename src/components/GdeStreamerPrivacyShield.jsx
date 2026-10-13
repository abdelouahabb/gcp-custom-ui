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
  hideCreditBalances: false,
  instructorAlias: 'gde-instructor@google-cloud-demo.dev',
  projectAliasPrefix: 'gde-demo-project',
};

export function loadGdePrivacyConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
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

/**
 * Pure string redactor for GDE Tutorial / Screen-Share Mode.
 * Replaces personal emails, service account project numbers, Cloud Billing Account IDs,
 * GCP project numbers, public IPs, and optionally project IDs or wallet balances.
 */
export function redactTextForGdeMode(text, cfg, context = {}) {
  if (!cfg?.enabled || !text || typeof text !== 'string') return text;

  let out = text;
  const aliasEmail =
    (cfg.instructorAlias || '').trim() || 'gde-instructor@google-cloud-demo.dev';

  // 1. Exact authenticated user account email
  if (cfg.hideEmails && context.accountEmail) {
    const cleanEmail = String(context.accountEmail).trim();
    if (cleanEmail && cleanEmail.includes('@')) {
      const reExact = new RegExp(escapeRegExp(cleanEmail), 'gi');
      out = out.replace(reExact, aliasEmail);
    }
  }

  // 2. General email addresses & GCP Service Account emails
  if (cfg.hideEmails) {
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
  }

  // 3. Cloud Billing Account IDs (e.g., 01ABCD-23EFGH-45IJKL or billingAccounts/01ABCD-23EFGH-45IJKL)
  if (cfg.hideBillingIds) {
    out = out.replace(
      /\b([0-9A-Fa-f]{6})-([0-9A-Fa-f]{6})-([0-9A-Fa-f]{6})\b/g,
      '01GDE•-••••••-TUTOR1'
    );
    out = out.replace(
      /billingAccounts\/[0-9A-Za-z_-]{8,}/g,
      'billingAccounts/01GDE•-••••••-TUTOR1'
    );
  }

  // 4. GCP Project Numbers (#123456789012 or projects/123456789012)
  if (cfg.hideProjectNumbers) {
    out = out.replace(/#(\d{9,14})\b/g, '#9900••••••01');
    out = out.replace(/projects\/(\d{9,14})\b/g, 'projects/9900••••••01');
  }

  // 5. Optional: Active GCP Project IDs (e.g. my-personal-project-123 -> gde-demo-project-1)
  if (cfg.hideProjectIds && Array.isArray(context.projects)) {
    context.projects.forEach((proj, idx) => {
      const pid = proj?.projectId;
      if (!pid || pid.length < 4) return;
      const replacement =
        idx === 0
          ? cfg.projectAliasPrefix || 'gde-demo-project'
          : `${cfg.projectAliasPrefix || 'gde-demo-project'}-${idx + 1}`;
      const reProj = new RegExp(`\\b${escapeRegExp(pid)}\\b`, 'g');
      out = out.replace(reProj, replacement);
    });
  }

  // 6. Public IPv4 Addresses (preserves 127.0.0.1, 0.0.0.0, 10.x, 192.168.x, and IAP 35.235.240.x)
  if (cfg.hidePublicIps) {
    out = out.replace(
      /\b((?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})\b/g,
      (fullIp) => {
        if (isTeachingOrPrivateIp(fullIp)) return fullIp;
        const octets = fullIp.split('.');
        return `${octets[0]}.•••.•••.${octets[3]}`;
      }
    );
  }

  // 7. Optional: Hide exact credit / dollar balances during public streams
  if (cfg.hideCreditBalances) {
    out = out.replace(/\$\d{1,3}(?:,\d{3})+(?:\.\d{2,4})?/g, '$•,•••.••');
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
  const titleAttrCacheRef = useRef(new WeakMap());

  const updateConfig = useCallback(
    (patch) => {
      onChangeConfig((prev) => {
        const next = {
          ...prev,
          ...(typeof patch === 'function' ? patch(prev) : patch),
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
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

  // Global DOM TextNode & Tooltip Redaction Engine
  useEffect(() => {
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
      'SVG',
      'PATH',
    ]);

    const processTextNode = (node) => {
      if (!node || node.nodeType !== Node.TEXT_NODE) return;
      const parent = node.parentElement;
      if (!parent || SKIP_TAGS.has(parent.tagName)) return;
      if (parent.closest('[data-gde-ignore="true"]')) return;

      const currentVal = node.nodeValue || '';
      if (!currentVal.trim()) return;

      const cache = textNodeCacheRef.current;
      let entry = cache.get(node);

      if (!config.enabled) {
        if (
          entry &&
          entry.originalText !== undefined &&
          currentVal === entry.lastMaskedText
        ) {
          node.nodeValue = entry.originalText;
        }
        return;
      }

      if (!entry) {
        entry = { originalText: currentVal, lastMaskedText: currentVal };
        cache.set(node, entry);
      } else if (currentVal !== entry.lastMaskedText) {
        entry.originalText = currentVal;
      }

      const masked = redactTextForGdeMode(
        entry.originalText,
        config,
        contextObj
      );
      if (masked !== currentVal) {
        entry.lastMaskedText = masked;
        node.nodeValue = masked;
      } else {
        entry.lastMaskedText = currentVal;
      }
    };

    const processElementTitles = (rootEl) => {
      if (!rootEl || rootEl.nodeType !== Node.ELEMENT_NODE) return;
      const els = rootEl.querySelectorAll
        ? rootEl.querySelectorAll('[title], [data-hud-tip]')
        : [];
      const list =
        rootEl.hasAttribute?.('title') || rootEl.hasAttribute?.('data-hud-tip')
          ? [rootEl, ...els]
          : els;
      const cache = titleAttrCacheRef.current;

      list.forEach((el) => {
        if (el.closest?.('[data-gde-ignore="true"]')) return;
        let entry = cache.get(el);
        if (!entry) {
          entry = {};
          cache.set(el, entry);
        }

        ['title', 'data-hud-tip'].forEach((attrName) => {
          const curVal = el.getAttribute(attrName) || '';
          if (!curVal) return;
          const origKey = `${attrName}_orig`;
          const maskedKey = `${attrName}_masked`;

          if (!config.enabled) {
            if (entry[origKey] && curVal === entry[maskedKey]) {
              el.setAttribute(attrName, entry[origKey]);
            }
            return;
          }

          if (!entry[origKey] || curVal !== entry[maskedKey]) {
            entry[origKey] = curVal;
          }

          const maskedVal = redactTextForGdeMode(
            entry[origKey],
            config,
            contextObj
          );
          if (maskedVal !== curVal) {
            entry[maskedKey] = maskedVal;
            el.setAttribute(attrName, maskedVal);
          } else {
            entry[maskedKey] = curVal;
          }
        });
      });
    };

    const walkSubtree = (rootNode) => {
      if (!rootNode) return;
      if (rootNode.nodeType === Node.TEXT_NODE) {
        processTextNode(rootNode);
        return;
      }
      if (rootNode.nodeType !== Node.ELEMENT_NODE) return;
      processElementTitles(rootNode);
      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
      let n = walker.nextNode();
      while (n) {
        processTextNode(n);
        n = walker.nextNode();
      }
    };

    walkSubtree(document.body);

    if (!config.enabled) {
      return undefined;
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') {
          processTextNode(m.target);
        } else if (m.type === 'childList') {
          m.addedNodes.forEach((added) => walkSubtree(added));
        } else if (
          m.type === 'attributes' &&
          (m.attributeName === 'title' || m.attributeName === 'data-hud-tip')
        ) {
          processElementTitles(m.target);
        }
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'data-hud-tip'],
    });

    return () => {
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
  ].filter(Boolean).length;

  return (
    <div className="relative z-40" ref={popoverRef} data-gde-ignore="true">
      <div className="inline-flex items-center rounded-[8px] shadow-sm">
        {/* Main 1-Click Toggle Button */}
        <button
          type="button"
          onClick={() => updateConfig({ enabled: !config.enabled })}
          title="GDE Streamer & Tutorial Privacy Mode (Shortcut: Alt+G) — Hides your email, Cloud Billing Account ID, Project Numbers, and Public IPs for safe screen sharing & video recording"
          className={`inline-flex items-center gap-1.5 rounded-l-[8px] px-2.5 py-2 text-xs font-mono font-bold border transition-all cursor-pointer whitespace-nowrap ${
            config.enabled
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-sm'
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
          className={`inline-flex items-center justify-center px-2 py-2 text-xs border-y border-r rounded-r-[8px] transition-colors cursor-pointer ${
            config.enabled
              ? 'bg-rose-700 hover:bg-rose-600 text-white border-rose-500'
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500 border border-rose-500/30 text-[10px] font-mono font-extrabold">
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
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer border ${
                config.enabled
                  ? 'bg-rose-600 text-white border-rose-500'
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
                label: 'Hide Personal & IAM Emails',
                desc: 'Replaces your email & masks service account project numbers',
              },
              {
                key: 'hideBillingIds',
                label: 'Hide Cloud Billing Account IDs',
                desc: 'Masks 01XXXX-XXXXXX-XXXXXX -> 01GDE•-••••••-TUTOR1',
              },
              {
                key: 'hideProjectNumbers',
                label: 'Hide GCP Project Numbers',
                desc: 'Masks 12-digit project numbers (#418293... -> #9900••••••01)',
              },
              {
                key: 'hidePublicIps',
                label: 'Hide External / Public IPv4s',
                desc: 'Masks VM/LB public IPs while keeping 10.x & IAP ranges readable',
              },
              {
                key: 'hideProjectIds',
                label: 'Mask Project IDs with Demo Alias',
                desc: 'Visually replaces project IDs with gde-demo-project',
              },
              {
                key: 'hideCreditBalances',
                label: 'Mask Exact Credit / Dollar Balances',
                desc: 'Masks large dollar balances ($1,240.00 -> $•,•••.••)',
              },
            ].map((item) => {
              const checked = Boolean(config[item.key]);
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
              <span>{activeShieldCount}/6 Privacy Shields Selected</span>
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
