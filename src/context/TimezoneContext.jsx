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
import { Clock, Globe, Check, ChevronDown, Search, X } from 'lucide-react';

const STORAGE_KEY = 'cloudpulse_timezone_pref_v1';

// Save native Date prototype methods once so we can inject activeTimeZone globally
const NATIVE_TO_LOCALE_STRING = Date.prototype.toLocaleString;
const NATIVE_TO_LOCALE_DATE_STRING = Date.prototype.toLocaleDateString;
const NATIVE_TO_LOCALE_TIME_STRING = Date.prototype.toLocaleTimeString;

let globalActiveTimeZone = detectBrowserTimeZone();
let globalHour24 = true;

function installGlobalDateTimezoneBridge() {
  if (Date.prototype.__cloudpulseTzPatched) return;
  Object.defineProperty(Date.prototype, '__cloudpulseTzPatched', {
    value: true,
    enumerable: false,
  });

  Date.prototype.toLocaleString = function (locales, options) {
    const opts = options ? { ...options } : {};
    if (!opts.timeZone && globalActiveTimeZone) {
      opts.timeZone = globalActiveTimeZone;
    }
    if (opts.hour12 === undefined) {
      opts.hour12 = !globalHour24;
    }
    try {
      return NATIVE_TO_LOCALE_STRING.call(this, locales, opts);
    } catch {
      return NATIVE_TO_LOCALE_STRING.call(this, locales, options);
    }
  };

  Date.prototype.toLocaleDateString = function (locales, options) {
    const opts = options ? { ...options } : {};
    if (!opts.timeZone && globalActiveTimeZone) {
      opts.timeZone = globalActiveTimeZone;
    }
    try {
      return NATIVE_TO_LOCALE_DATE_STRING.call(this, locales, opts);
    } catch {
      return NATIVE_TO_LOCALE_DATE_STRING.call(this, locales, options);
    }
  };

  Date.prototype.toLocaleTimeString = function (locales, options) {
    const opts = options ? { ...options } : {};
    if (!opts.timeZone && globalActiveTimeZone) {
      opts.timeZone = globalActiveTimeZone;
    }
    if (opts.hour12 === undefined) {
      opts.hour12 = !globalHour24;
    }
    try {
      return NATIVE_TO_LOCALE_TIME_STRING.call(this, locales, opts);
    } catch {
      return NATIVE_TO_LOCALE_TIME_STRING.call(this, locales, options);
    }
  };
}

installGlobalDateTimezoneBridge();

export function detectBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

// Complete mapping of all 42 Google Cloud Regions to their local IANA Timezones
export const GCP_REGION_TIMEZONE_HINTS = {
  'Africa/Algiers': 'North Africa (CET)',
  'Africa/Cairo': 'Egypt (EET)',
  'Africa/Casablanca': 'Morocco',
  'Africa/Johannesburg': 'africa-south1 (Johannesburg)',
  'Africa/Lagos': 'West Africa (WAT)',
  'Africa/Nairobi': 'East Africa (EAT)',
  'Africa/Tunis': 'Tunisia (CET)',
  'America/Chicago': 'us-central1 (Iowa) · us-south1 (Dallas)',
  'America/Columbus': 'us-east5 (Columbus)',
  'America/Denver': 'Mountain Time (MT)',
  'America/Detroit': 'us-east5 (Ohio/Michigan)',
  'America/Las_Vegas': 'us-west4 (Las Vegas)',
  'America/Los_Angeles': 'us-west1 (Oregon) · us-west2 (LA)',
  'America/Mexico_City': 'northamerica-south1 (Querétaro, Mexico)',
  'America/Montreal': 'northamerica-northeast1 (Montréal)',
  'America/New_York': 'us-east1 (S. Carolina) · us-east4 (N. Virginia)',
  'America/Phoenix': 'us-west3 (Salt Lake / Southwest)',
  'America/Santiago': 'southamerica-west1 (Santiago, Chile)',
  'America/Sao_Paulo': 'southamerica-east1 (São Paulo, Brazil)',
  'America/Toronto': 'northamerica-northeast2 (Toronto)',
  'America/Bogota': 'Colombia',
  'America/Buenos_Aires': 'Argentina',
  'America/Argentina/Buenos_Aires': 'Argentina',
  'America/Lima': 'Peru',
  'Asia/Bangkok': 'Southeast Asia (ICT)',
  'Asia/Dubai': 'UAE / Gulf (GST)',
  'Asia/Hong_Kong': 'asia-east2 (Hong Kong)',
  'Asia/Jakarta': 'asia-southeast2 (Jakarta, Indonesia)',
  'Asia/Jerusalem': 'me-west1 (Tel Aviv)',
  'Asia/Karachi': 'Pakistan (PKT)',
  'Asia/Kathmandu': 'Nepal (UTC+05:45)',
  'Asia/Kolkata': 'asia-south1 (Mumbai) · asia-south2 (Delhi)',
  'Asia/Kuala_Lumpur': 'asia-southeast3 (Malaysia)',
  'Asia/Manila': 'Philippines (PHT)',
  'Asia/Qatar': 'me-central1 (Doha, Qatar)',
  'Asia/Riyadh': 'me-central2 (Dammam, Saudi Arabia)',
  'Asia/Seoul': 'asia-northeast3 (Seoul, South Korea)',
  'Asia/Shanghai': 'China Standard Time (CST)',
  'Asia/Singapore': 'asia-southeast1 (Singapore)',
  'Asia/Taipei': 'asia-east1 (Changhua County, Taiwan)',
  'Asia/Tokyo': 'asia-northeast1 (Tokyo) · asia-northeast2 (Osaka)',
  'Australia/Melbourne': 'australia-southeast2 (Melbourne)',
  'Australia/Sydney': 'australia-southeast1 (Sydney)',
  'Europe/Amsterdam': 'europe-west4 (Eemshaven, Netherlands)',
  'Europe/Berlin': 'europe-west10 (Berlin) · europe-west3 (Frankfurt)',
  'Europe/Brussels': 'europe-west1 (St. Ghislain, Belgium)',
  'Europe/Helsinki': 'europe-north1 (Hamina, Finland)',
  'Europe/Istanbul': 'Türkiye (TRT)',
  'Europe/London': 'europe-west2 (London, UK)',
  'Europe/Madrid': 'europe-southwest1 (Madrid, Spain)',
  'Europe/Milan': 'europe-west8 (Milan, Italy)',
  'Europe/Paris': 'europe-west9 (Paris, France)',
  'Europe/Rome': 'europe-west12 (Turin, Italy)',
  'Europe/Stockholm': 'europe-north2 (Stockholm, Sweden)',
  'Europe/Warsaw': 'europe-central2 (Warsaw, Poland)',
  'Europe/Zurich': 'europe-west6 (Zürich, Switzerland)',
  'Pacific/Auckland': 'New Zealand (NZST/NZDT)',
  'Pacific/Honolulu': 'Hawaii (HST)',
};

const FALLBACK_IANA_TIMEZONES = [
  'UTC',
  ...Object.keys(GCP_REGION_TIMEZONE_HINTS),
  'Africa/Abidjan',
  'Africa/Accra',
  'Africa/Addis_Ababa',
  'Africa/Dar_es_Salaam',
  'Africa/Khartoum',
  'Africa/Kinshasa',
  'Africa/Luanda',
  'Africa/Maputo',
  'Africa/Tripoli',
  'Africa/Windhoek',
  'America/Anchorage',
  'America/Caracas',
  'America/Costa_Rica',
  'America/Edmonton',
  'America/Guatemala',
  'America/Halifax',
  'America/Havana',
  'America/Jamaica',
  'America/La_Paz',
  'America/Manaus',
  'America/Montevideo',
  'America/Panama',
  'America/Puerto_Rico',
  'America/Regina',
  'America/Santo_Domingo',
  'America/St_Johns',
  'America/Tijuana',
  'America/Vancouver',
  'America/Winnipeg',
  'Asia/Almaty',
  'Asia/Amman',
  'Asia/Baghdad',
  'Asia/Baku',
  'Asia/Beirut',
  'Asia/Colombo',
  'Asia/Damascus',
  'Asia/Dhaka',
  'Asia/Ho_Chi_Minh',
  'Asia/Irkutsk',
  'Asia/Kabul',
  'Asia/Kamchatka',
  'Asia/Krasnoyarsk',
  'Asia/Kuwait',
  'Asia/Macau',
  'Asia/Magadan',
  'Asia/Muscat',
  'Asia/Novosibirsk',
  'Asia/Omsk',
  'Asia/Phnom_Penh',
  'Asia/Sakhalin',
  'Asia/Tashkent',
  'Asia/Tbilisi',
  'Asia/Tehran',
  'Asia/Ulaanbaatar',
  'Asia/Vladivostok',
  'Asia/Yakutsk',
  'Asia/Yangon',
  'Asia/Yekaterinburg',
  'Asia/Yerevan',
  'Atlantic/Azores',
  'Atlantic/Cape_Verde',
  'Atlantic/Reykjavik',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Darwin',
  'Australia/Eucla',
  'Australia/Hobart',
  'Australia/Perth',
  'Europe/Athens',
  'Europe/Belgrade',
  'Europe/Bucharest',
  'Europe/Budapest',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Kyiv',
  'Europe/Lisbon',
  'Europe/Luxembourg',
  'Europe/Minsk',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Prague',
  'Europe/Riga',
  'Europe/Sofia',
  'Europe/Tallinn',
  'Europe/Vienna',
  'Europe/Vilnius',
  'Europe/Zagreb',
  'Indian/Maldives',
  'Indian/Mauritius',
  'Pacific/Chatham',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Kiritimati',
  'Pacific/Midway',
  'Pacific/Noumea',
  'Pacific/Pago_Pago',
  'Pacific/Port_Moresby',
  'Pacific/Tahiti',
  'Pacific/Tongatapu',
];

export function getAllSupportedIanaTimeZones() {
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
      const list = Intl.supportedValuesOf('timeZone');
      const set = new Set(['UTC', ...list]);
      return Array.from(set);
    }
  } catch {
    // ignore
  }
  return Array.from(new Set(FALLBACK_IANA_TIMEZONES));
}

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

export function parseOffsetMinutes(offsetStr = 'UTC+00:00') {
  const m = String(offsetStr).match(/([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === '-' ? -1 : 1;
  const hrs = parseInt(m[2], 10) || 0;
  const mins = parseInt(m[3], 10) || 0;
  return sign * (hrs * 60 + mins);
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
  const allIanaZones = useMemo(() => getAllSupportedIanaTimeZones(), []);

  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          mode: parsed.mode || 'AUTO_LOCAL', // 'AUTO_LOCAL' | 'UTC' | any IANA string
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
    let lastMinuteBucket = Math.floor(Date.now() / 60000);
    const checkMinuteChange = () => {
      const currentBucket = Math.floor(Date.now() / 60000);
      if (currentBucket !== lastMinuteBucket) {
        lastMinuteBucket = currentBucket;
        setNowTick(new Date());
      }
    };
    // Check every 15s and only trigger React state update when the minute actually changes
    const timer = setInterval(checkMinuteChange, 15000);
    return () => clearInterval(timer);
  }, []);

  const activeTimeZone = useMemo(() => {
    if (!prefs.mode || prefs.mode === 'AUTO_LOCAL') {
      return browserTimeZone || 'UTC';
    }
    return prefs.mode;
  }, [prefs.mode, browserTimeZone]);

  // Synchronize global Date.prototype bridge and Axios header immediately
  globalActiveTimeZone = activeTimeZone;
  globalHour24 = prefs.hour24;

  useEffect(() => {
    globalActiveTimeZone = activeTimeZone;
    globalHour24 = prefs.hour24;
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
      const includeSeconds = Boolean(options.includeSeconds);
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
      const includeSeconds = Boolean(options.includeSeconds);
      try {
        return new Intl.DateTimeFormat('en-US', {
          timeZone: activeTimeZone,
          hour: '2-digit',
          minute: '2-digit',
          ...(includeSeconds ? { second: '2-digit' } : {}),
          hour12: !prefs.hour24,
        }).format(d);
      } catch {
        return d.toTimeString().slice(0, 5);
      }
    },
    [activeTimeZone, prefs.hour24, nowTick]
  );

  const liveClockText = useMemo(
    () => formatTimeOnly(nowTick, { includeSeconds: false }),
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
      allIanaZones,
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
      allIanaZones,
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
      allIanaZones: getAllSupportedIanaTimeZones(),
      mode: 'AUTO_LOCAL',
      hour24: true,
      showDualUtc: false,
      utcOffsetLabel: getUtcOffsetString(fallbackTz),
      shortTzName: getShortTzAbbreviation(fallbackTz),
      liveClockText: '00:00',
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

const CONTINENT_FILTERS = [
  { id: 'ALL', label: 'All World' },
  { id: 'GCP', label: 'GCP Regions' },
  { id: 'Africa', label: 'Africa' },
  { id: 'America', label: 'Americas' },
  { id: 'Asia', label: 'Asia & MENA' },
  { id: 'Europe', label: 'Europe' },
  { id: 'Australia_Pacific', label: 'Oceania & Pacific' },
  { id: 'Atlantic_Indian', label: 'Atlantic & Indian' },
];

export function TimezoneSelectorPill({ onShowToast }) {
  const {
    browserTimeZone,
    activeTimeZone,
    allIanaZones,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [continentFilter, setContinentFilter] = useState('ALL');
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

  // Build enriched list of all ~430+ world IANA timezones once when popover opens
  const enrichedCatalog = useMemo(() => {
    if (!open) return [];
    const refDate = new Date();
    const rows = allIanaZones.map((tz) => {
      const offsetStr = getUtcOffsetString(tz, refDate);
      const offsetMins = parseOffsetMinutes(offsetStr);
      const continent = tz.includes('/') ? tz.split('/')[0] : 'UTC';
      const city = tz
        .split('/')
        .slice(1)
        .join(' / ')
        .replace(/_/g, ' ');
      const gcpHint = GCP_REGION_TIMEZONE_HINTS[tz] || '';
      let sampleTime = '';
      try {
        sampleTime = new Intl.DateTimeFormat('en-US', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: !hour24,
        }).format(refDate);
      } catch {
        sampleTime = '';
      }
      return {
        id: tz,
        continent,
        city: city || tz,
        offsetStr,
        offsetMins,
        gcpHint,
        sampleTime,
        searchBlob: `${tz} ${city} ${offsetStr} ${gcpHint}`.toLowerCase(),
      };
    });

    rows.sort((a, b) => {
      if (a.id === 'UTC') return -1;
      if (b.id === 'UTC') return 1;
      if (a.offsetMins !== b.offsetMins) return a.offsetMins - b.offsetMins;
      return a.id.localeCompare(b.id);
    });

    return rows;
  }, [open, allIanaZones, hour24]);

  const filteredZones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedCatalog.filter((item) => {
      if (continentFilter === 'GCP' && !item.gcpHint && item.id !== 'UTC') {
        return false;
      }
      if (continentFilter === 'Africa' && item.continent !== 'Africa') {
        return false;
      }
      if (continentFilter === 'America' && item.continent !== 'America') {
        return false;
      }
      if (continentFilter === 'Asia' && item.continent !== 'Asia') {
        return false;
      }
      if (continentFilter === 'Europe' && item.continent !== 'Europe') {
        return false;
      }
      if (
        continentFilter === 'Australia_Pacific' &&
        item.continent !== 'Australia' &&
        item.continent !== 'Pacific' &&
        item.continent !== 'Antarctica'
      ) {
        return false;
      }
      if (
        continentFilter === 'Atlantic_Indian' &&
        item.continent !== 'Atlantic' &&
        item.continent !== 'Indian' &&
        item.continent !== 'Arctic'
      ) {
        return false;
      }
      if (q && !item.searchBlob.includes(q)) {
        return false;
      }
      return true;
    });
  }, [enrichedCatalog, continentFilter, searchQuery]);

  return (
    <div className="relative z-40" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Active UI Timezone: ${activeTimeZone} (${utcOffsetLabel} · ${shortTzName}) — Click to search & switch across all ${allIanaZones.length} Global IANA Timezones`}
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
        <div className="absolute right-0 mt-2 w-[350px] sm:w-[440px] bg-white dark:bg-[#202124] shadow-2xl border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 z-50 space-y-3 text-xs">
          <div className="flex items-start justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <div>
              <div className="font-mono font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  World IANA Timezone Engine ({allIanaZones.length} Timezones)
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Every country, territory, half-hour/45m offset &amp; all 42 GCP regions. Synchronizes all logs, tables, charts &amp; Cloud Scheduler crons.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Live Dual Clock Readout */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 font-mono">
            <div>
              <div className="text-[9.5px] uppercase text-zinc-400 truncate">
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

          {/* Quick Pin Buttons: Auto Browser Local + UTC + 24h + Dual UTC */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => {
                setTimeZoneMode('AUTO_LOCAL');
                if (onShowToast) {
                  onShowToast(
                    `Switched to Auto-Detected Browser Timezone: ${browserTimeZone}`
                  );
                }
              }}
              className={`py-1.5 px-2.5 rounded-lg border font-mono text-[10.5px] font-bold truncate transition-colors cursor-pointer ${
                mode === 'AUTO_LOCAL'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
              title={`Use system browser timezone (${browserTimeZone})`}
            >
              {mode === 'AUTO_LOCAL' ? '✓ ' : ''}Auto Local ({browserTimeZone.split('/').pop()})
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeZoneMode('UTC');
                if (onShowToast) {
                  onShowToast('Switched UI Timezone to UTC (UTC+00:00)');
                }
              }}
              className={`py-1.5 px-2.5 rounded-lg border font-mono text-[10.5px] font-bold transition-colors cursor-pointer ${
                activeTimeZone === 'UTC' && mode !== 'AUTO_LOCAL'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {activeTimeZone === 'UTC' && mode !== 'AUTO_LOCAL' ? '✓ ' : ''}UTC / Zulu (UTC+00:00)
            </button>
            <button
              type="button"
              onClick={toggleHour24}
              className={`py-1.5 px-2.5 rounded-lg border font-mono text-[10.5px] font-bold transition-colors cursor-pointer ${
                hour24
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {hour24 ? '✓ 24-Hour (HH:mm)' : '12-Hour (AM/PM)'}
            </button>
            <button
              type="button"
              onClick={toggleShowDualUtc}
              className={`py-1.5 px-2.5 rounded-lg border font-mono text-[10.5px] font-bold transition-colors cursor-pointer ${
                showDualUtc
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
              }`}
            >
              {showDualUtc ? '✓ Dual (+UTC) On' : 'Dual (+UTC) Off'}
            </button>
          </div>

          {/* Search Input for all 430+ World Timezones */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${allIanaZones.length} world timezones, city, country, UTC+... or GCP region`}
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#131314] border border-zinc-200 dark:border-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Continent / Region Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {CONTINENT_FILTERS.map((cf) => (
              <button
                key={cf.id}
                type="button"
                onClick={() => setContinentFilter(cf.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  continentFilter === cf.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {cf.label}
              </button>
            ))}
          </div>

          {/* Complete Scrollable World IANA Timezone List */}
          <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between px-0.5">
            <span>
              Showing {filteredZones.length} of {allIanaZones.length} global IANA timezones
            </span>
            <span>Sorted by UTC Offset</span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 border border-zinc-200 dark:border-zinc-800 rounded-xl">
            {filteredZones.length === 0 ? (
              <div className="p-4 text-center font-mono text-xs text-zinc-500">
                No timezone matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredZones.map((tzItem) => {
                const isSelected = activeTimeZone === tzItem.id;
                return (
                  <button
                    key={tzItem.id}
                    type="button"
                    onClick={() => {
                      setTimeZoneMode(tzItem.id);
                      setOpen(false);
                      if (onShowToast) {
                        onShowToast(
                          `Switched UI Timezone to ${tzItem.id} (${tzItem.offsetStr})`
                        );
                      }
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-xs truncate flex items-center gap-1.5">
                        <span>{tzItem.id}</span>
                        {tzItem.id === browserTimeZone && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            LOCAL
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono truncate">
                        {tzItem.offsetStr}
                        {tzItem.gcpHint ? ` · ${tzItem.gcpHint}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
                        {tzItem.sampleTime}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
