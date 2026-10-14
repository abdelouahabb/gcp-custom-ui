import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import axios from 'axios';
import { Clock, Globe, Check, ChevronDown } from 'lucide-react';

const STORAGE_KEY = 'cloudpulse_timezone_pref_v1';

export function detectBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export const GCP_TIMEZONE_PRESETS = [
  {
    id: 'AUTO_LOCAL',
    label: 'Auto-Detect Browser Local',
    regionHint: 'System IANA Timezone',
  },
  {
    id: 'UTC',
    label: 'UTC / Zulu (SRE Standard)',
    regionHint: 'Global Audit & Logs Standard',
  },
  {
    id: 'Africa/Algiers',
    label: 'Africa/Algiers (CET)',
    regionHint: 'North Africa · UTC+01:00',
  },
  {
    id: 'Europe/Paris',
    label: 'Europe/Paris (CET/CEST)',
    regionHint: 'europe-west1 / europe-west9',
  },
  {
    id: 'Europe/London',
    label: 'Europe/London (GMT/BST)',
    regionHint: 'europe-west2 (London)',
  },
  {
    id: 'Europe/Helsinki',
    label: 'Europe/Helsinki (EET)',
    regionHint: 'europe-north1 (Finland)',
  },
  {
    id: 'America/New_York',
    label: 'America/New_York (ET)',
    regionHint: 'us-east1 / us-east4',
  },
  {
    id: 'America/Chicago',
    label: 'America/Chicago (CT)',
    regionHint: 'us-central1 (Iowa)',
  },
  {
    id: 'America/Los_Angeles',
    label: 'America/Los_Angeles (PT)',
    regionHint: 'us-west1 (Oregon / Sunnyvale)',
  },
  {
    id: 'America/Sao_Paulo',
    label: 'America/Sao_Paulo (BRT)',
    regionHint: 'southamerica-east1 (São Paulo)',
  },
  {
    id: 'Asia/Dubai',
    label: 'Asia/Dubai (GST)',
    regionHint: 'me-central1 / me-central2',
  },
  {
    id: 'Asia/Singapore',
    label: 'Asia/Singapore (SGT)',
    regionHint: 'asia-southeast1 (Singapore)',
  },
  {
    id: 'Asia/Tokyo',
    label: 'Asia/Tokyo (JST)',
    regionHint: 'asia-northeast1 (Tokyo)',
  },
  {
    id: 'Australia/Sydney',
    label: 'Australia/Sydney (AEST)',
    regionHint: 'australia-southeast1 (Sydney)',
  },
];

export function getUtcOffsetString(timeZone, dateInput = new Date()) {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return 'UTC+00:00';
    if (timeZone === 'UTC' || timeZone === 'Etc/UTC') return 'UTC+00:00';
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(d);
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value || '';
    if (tzPart === 'GMT' || tzPart === 'UTC') return 'UTC+00:00';
    return tzPart.replace(/^GMT/, 'UTC') || 'UTC+00:00';
  } catch {
    return 'UTC+00:00';
  }
}

export function getShortTzAbbreviation(timeZone, dateInput = new Date()) {
  try {
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (Number.isNaN(d.getTime())) return 'UTC';
    if (timeZone === 'UTC' || timeZone === 'Etc/UTC') return 'UTC';
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(d);
    return parts.find((p) => p.type === 'timeZoneName')?.value || timeZone;
  } catch {
    return 'UTC';
  }
}

const TimezoneContext = createContext(null);

export function TimezoneProvider({ children }) {
  const browserTimeZone = useMemo(() => detectBrowserTimeZone(), []);

  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          mode: parsed.mode || 'AUTO_LOCAL', // 'AUTO_LOCAL' | 'UTC' | specific IANA string
          hour24: parsed.hour24 !== false,
          showDualUtc: Boolean(parsed.showDualUtc),
        };
      }
    } catch {
      // ignore
    }
    return {
      mode: 'AUTO_LOCAL',
      hour24: true,
      showDualUtc: false,
    };
  });

  const [nowTick, setNowTick] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeTimeZone = useMemo(() => {
    if (!prefs.mode || prefs.mode === 'AUTO_LOCAL') {
      return browserTimeZone || 'UTC';
    }
    return prefs.mode;
  }, [prefs.mode, browserTimeZone]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore
    }
    axios.defaults.headers.common['x-client-timezone'] = activeTimeZone;
  }, [prefs, activeTimeZone]);

  const utcOffsetLabel = useMemo(
    () => getUtcOffsetString(activeTimeZone, nowTick),
    [activeTimeZone, nowTick]
  );

  const shortTzName = useMemo(
    () => getShortTzAbbreviation(activeTimeZone, nowTick),
    [activeTimeZone, nowTick]
  );

  const setTimeZoneMode = useCallback((mode) => {
    setPrefs((prev) => ({ ...prev, mode }));
  }, []);

  const toggleHour24 = useCallback(() => {
    setPrefs((prev) => ({ ...prev, hour24: !prev.hour24 }));
  }, []);

  const toggleShowDualUtc = useCallback(() => {
    setPrefs((prev) => ({ ...prev, showDualUtc: !prev.showDualUtc }));
  }, []);

  const formatDateTime = useCallback(
    (isoInput, options = {}) => {
      if (!isoInput) return '—';
      const d = isoInput instanceof Date ? isoInput : new Date(isoInput);
      if (Number.isNaN(d.getTime())) return String(isoInput);
      const includeSeconds = options.includeSeconds !== false;
      const includeZone = options.includeZone !== false;
      try {
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: activeTimeZone,
          month: 'short',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          ...(includeSeconds ? { second: '2-digit' } : {}),
          hour12: !prefs.hour24,
        }).format(d);
        const zoneSuffix = includeZone
          ? ` ${getShortTzAbbreviation(activeTimeZone, d)}`
          : '';
        if (prefs.showDualUtc && activeTimeZone !== 'UTC') {
          const utcTime = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            hour: '2-digit',
            minute: '2-digit',
            ...(includeSeconds ? { second: '2-digit' } : {}),
            hour12: false,
          }).format(d);
          return `${formatted}${zoneSuffix} (${utcTime} UTC)`;
        }
        return `${formatted}${zoneSuffix}`;
      } catch {
        return d.toISOString();
      }
    },
    [activeTimeZone, prefs.hour24, prefs.showDualUtc]
  );

  const formatShortDate = useCallback(
    (isoInput) => {
      if (!isoInput) return '—';
      const d = isoInput instanceof Date ? isoInput : new Date(isoInput);
      if (Number.isNaN(d.getTime())) return String(isoInput);
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: activeTimeZone,
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        }).format(d);
      } catch {
        return d.toISOString().slice(0, 10);
      }
    },
    [activeTimeZone]
  );

  const formatTimeOnly = useCallback(
    (isoInput = nowTick, options = {}) => {
      const d = isoInput instanceof Date ? isoInput : new Date(isoInput);
      if (Number.isNaN(d.getTime())) return '—';
      const includeSeconds = options.includeSeconds !== false;
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: activeTimeZone,
          hour: '2-digit',
          minute: '2-digit',
          ...(includeSeconds ? { second: '2-digit' } : {}),
          hour12: !prefs.hour24,
        }).format(d);
      } catch {
        return d.toTimeString().slice(0, 8);
      }
    },
    [activeTimeZone, prefs.hour24, nowTick]
  );

  const liveClockText = useMemo(
    () => formatTimeOnly(nowTick, { includeSeconds: true }),
    [formatTimeOnly, nowTick]
  );

  const liveShortClockText = useMemo(
    () => formatTimeOnly(nowTick, { includeSeconds: false }),
    [formatTimeOnly, nowTick]
  );

  const liveDateText = useMemo(
    () => formatShortDate(nowTick),
    [formatShortDate, nowTick]
  );

  const value = useMemo(
    () => ({
      browserTimeZone,
      activeTimeZone,
      mode: prefs.mode,
      hour24: prefs.hour24,
      showDualUtc: prefs.showDualUtc,
      utcOffsetLabel,
      shortTzName,
      liveClockText,
      liveShortClockText,
      liveDateText,
      nowTick,
      setTimeZoneMode,
      toggleHour24,
      toggleShowDualUtc,
      formatDateTime,
      formatShortDate,
      formatTimeOnly,
    }),
    [
      browserTimeZone,
      activeTimeZone,
      prefs.mode,
      prefs.hour24,
      prefs.showDualUtc,
      utcOffsetLabel,
      shortTzName,
      liveClockText,
      liveShortClockText,
      liveDateText,
      nowTick,
      setTimeZoneMode,
      toggleHour24,
      toggleShowDualUtc,
      formatDateTime,
      formatShortDate,
      formatTimeOnly,
    ]
  );

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const ctx = useContext(TimezoneContext);
  if (!ctx) {
    const fallbackTz = detectBrowserTimeZone();
    return {
      browserTimeZone: fallbackTz,
      activeTimeZone: fallbackTz,
      mode: 'AUTO_LOCAL',
      hour24: true,
      showDualUtc: false,
      utcOffsetLabel: getUtcOffsetString(fallbackTz),
      shortTzName: getShortTzAbbreviation(fallbackTz),
      liveClockText: '00:00:00',
      liveShortClockText: '00:00',
      liveDateText: 'Oct 14, 2026',
      nowTick: new Date(),
      setTimeZoneMode: () => {},
      toggleHour24: () => {},
      toggleShowDualUtc: () => {},
      formatDateTime: (iso) => String(iso || ''),
      formatShortDate: (iso) => String(iso || ''),
      formatTimeOnly: (iso) => String(iso || ''),
    };
  }
  return ctx;
}

export function TimezoneSelectorPill({ onShowToast }) {
  const {
    browserTimeZone,
    activeTimeZone,
    mode,
    hour24,
    showDualUtc,
    utcOffsetLabel,
    shortTzName,
    liveClockText,
    nowTick,
    setTimeZoneMode,
    toggleHour24,
    toggleShowDualUtc,
  } = useTimezone();

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const utcClockNow = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(nowTick);
    } catch {
      return '';
    }
  }, [nowTick]);

  const compactTzDisplay = useMemo(() => {
    if (activeTimeZone === 'UTC') return 'UTC';
    const city = activeTimeZone.split('/').pop()?.replace(/_/g, ' ');
    return city || activeTimeZone;
  }, [activeTimeZone]);

  return (
    <div className="relative z-40" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Active UI Timezone: ${activeTimeZone} (${utcOffsetLabel} · ${shortTzName}) — Click to switch between Browser Local (${browserTimeZone}), UTC, or any GCP Region Timezone`}
        className="inline-flex items-center gap-1.5 bg-white dark:bg-[#202124] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-[8px] px-2.5 py-2 text-xs font-mono font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
      >
        <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-bold text-zinc-900 dark:text-zinc-100">
          {liveClockText}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
          {compactTzDisplay} · {utcOffsetLabel}
        </span>
        <ChevronDown className="w-3.5 h-3.5 opacity-70 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#202124] shadow-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 z-50 space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <div>
              <div className="font-mono font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Global UI Timezone &amp; Telemetry Clock</span>
              </div>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Synchronizes Cloud Audit logs, resource timestamps, Flight Recorder, and Cloud Scheduler cron jobs.
              </p>
            </div>
          </div>

          {/* Live Dual Clock Readout */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 font-mono">
            <div>
              <div className="text-[9.5px] uppercase text-zinc-400">
                Active ({activeTimeZone})
              </div>
              <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {liveClockText}
              </div>
              <div className="text-[10px] text-zinc-500">
                {utcOffsetLabel} ({shortTzName})
              </div>
            </div>
            <div className="border-l border-zinc-200 dark:border-zinc-800 pl-2.5">
              <div className="text-[9.5px] uppercase text-zinc-400">
                UTC / Zulu Reference
              </div>
              <div className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                {utcClockNow}
              </div>
              <div className="text-[10px] text-zinc-500">UTC+00:00 (ISO)</div>
            </div>
          </div>

          {/* Display Format Toggles */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={toggleHour24}
              className={`flex-1 py-1.5 px-2.5 rounded-lg border font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                hour24
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {hour24 ? '✓ 24-Hour (HH:mm:ss)' : '12-Hour (AM/PM)'}
            </button>
            <button
              type="button"
              onClick={toggleShowDualUtc}
              className={`flex-1 py-1.5 px-2.5 rounded-lg border font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                showDualUtc
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {showDualUtc ? '✓ Dual (+UTC) On' : 'Dual (+UTC) Off'}
            </button>
          </div>

          {/* Preset IANA Timezones List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            {GCP_TIMEZONE_PRESETS.map((preset) => {
              const resolvedTz =
                preset.id === 'AUTO_LOCAL' ? browserTimeZone : preset.id;
              const isSelected = mode === preset.id;
              const offset = getUtcOffsetString(resolvedTz, nowTick);
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setTimeZoneMode(preset.id);
                    setOpen(false);
                    if (onShowToast) {
                      onShowToast(
                        `Switched UI Timezone to ${resolvedTz} (${offset})`
                      );
                    }
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs truncate">
                      {preset.id === 'AUTO_LOCAL'
                        ? `${preset.label} (${browserTimeZone})`
                        : preset.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
                      {preset.regionHint} · {offset}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
