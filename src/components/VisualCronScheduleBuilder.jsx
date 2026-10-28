import React, { useState } from 'react';
import { Clock, Calendar, Sliders } from 'lucide-react';

const QUICK_SCHEDULES = [
  { label: 'Every 5m', cron: '*/5 * * * *', desc: 'Runs every 5 minutes' },
  { label: 'Every 15m', cron: '*/15 * * * *', desc: 'Runs every 15 minutes' },
  { label: 'Every Hour', cron: '0 * * * *', desc: 'Runs at the start of every hour' },
  { label: 'Every 6 Hours', cron: '0 */6 * * *', desc: 'Runs every 6 hours (00:00, 06:00, 12:00, 18:00)' },
  { label: 'Nightly 2:00 AM', cron: '0 2 * * *', desc: 'Runs every night at 02:00 AM (ideal for backups & ETL)' },
  { label: 'Weekdays 9:00 AM', cron: '0 9 * * 1-5', desc: 'Runs Monday through Friday at 09:00 AM' },
  { label: 'Sundays 3:00 AM', cron: '0 3 * * 0', desc: 'Runs every Sunday at 03:00 AM' },
  { label: '1st of Month', cron: '0 0 1 * *', desc: 'Runs on the 1st day of every month at 12:00 AM' },
];

const DAYS_OF_WEEK = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '0', label: 'Sunday' },
  { value: '1-5', label: 'Monday – Friday (Weekdays)' },
  { value: '0,6', label: 'Saturday & Sunday (Weekend)' },
];

const HOURS_OPTIONS = Array.from({ length: 24 }, (_, h) => {
  const ampm = h === 0 ? '12:00 AM (Midnight)' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM (Noon)' : `${h - 12}:00 PM`;
  const hh = String(h).padStart(2, '0');
  return { value: String(h), label: `${hh}:00 (${ampm})` };
});

export function describeCronInPlainEnglish(cronExpr) {
  const raw = String(cronExpr || '*/15 * * * *').trim();
  const matchedPreset = QUICK_SCHEDULES.find((p) => p.cron === raw);
  if (matchedPreset) return matchedPreset.desc;

  const parts = raw.split(/\s+/);
  if (parts.length !== 5) {
    return `Custom schedule (${raw})`;
  }
  const [min, hr, dom, mon, dow] = parts;

  if (min.startsWith('*/') && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return `Runs every ${min.slice(2)} minutes`;
  }
  if (min === '0' && hr.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') {
    return `Runs every ${hr.slice(2)} hours on the hour`;
  }
  if (min !== '*' && hr === '*' && dom === '*' && mon === '*' && dow === '*') {
    return `Runs every hour at :${min.padStart(2, '0')} past the hour`;
  }

  const fmtTime = (hStr, mStr) => {
    const h = Number(hStr);
    const m = String(Number(mStr || 0)).padStart(2, '0');
    if (Number.isNaN(h)) return `${hStr}:${m}`;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${String(h).padStart(2, '0')}:${m} (${h12}:${m} ${suffix})`;
  };

  if (dom === '*' && mon === '*' && dow === '*') {
    return `Runs every day at ${fmtTime(hr, min)}`;
  }
  if (dom === '*' && mon === '*' && dow !== '*') {
    const dowLabel =
      DAYS_OF_WEEK.find((d) => d.value === dow)?.label || `day-of-week ${dow}`;
    return `Runs every ${dowLabel} at ${fmtTime(hr, min)}`;
  }
  if (dom !== '*' && mon === '*' && dow === '*') {
    return `Runs on day ${dom} of every month at ${fmtTime(hr, min)}`;
  }
  return `Runs on schedule: minute=${min}, hour=${hr}, day=${dom}, month=${mon}, weekday=${dow}`;
}

function parseCronToVisualState(cronExpr) {
  const raw = String(cronExpr || '*/15 * * * *').trim();
  const parts = raw.split(/\s+/);
  if (parts.length !== 5) {
    return {
      frequency: 'MINUTES',
      intervalMinutes: '15',
      intervalHours: '6',
      hour: '2',
      minute: '0',
      dayOfWeek: '1',
      dayOfMonth: '1',
    };
  }
  const [min, hr, dom, , dow] = parts;
  if (min.startsWith('*/') && hr === '*') {
    return {
      frequency: 'MINUTES',
      intervalMinutes: min.slice(2) || '15',
      intervalHours: '6',
      hour: '2',
      minute: '0',
      dayOfWeek: '1',
      dayOfMonth: '1',
    };
  }
  if (hr === '*' || hr.startsWith('*/')) {
    return {
      frequency: 'HOURS',
      intervalMinutes: '15',
      intervalHours: hr.startsWith('*/') ? hr.slice(2) : '1',
      hour: '2',
      minute: min === '*' ? '0' : min,
      dayOfWeek: '1',
      dayOfMonth: '1',
    };
  }
  if (dom !== '*') {
    return {
      frequency: 'MONTHLY',
      intervalMinutes: '15',
      intervalHours: '6',
      hour: hr,
      minute: min,
      dayOfWeek: '1',
      dayOfMonth: dom,
    };
  }
  if (dow !== '*') {
    return {
      frequency: 'WEEKLY',
      intervalMinutes: '15',
      intervalHours: '6',
      hour: hr,
      minute: min,
      dayOfWeek: dow,
      dayOfMonth: '1',
    };
  }
  return {
    frequency: 'DAILY',
    intervalMinutes: '15',
    intervalHours: '6',
    hour: hr,
    minute: min,
    dayOfWeek: '1',
    dayOfMonth: '1',
  };
}

export default function VisualCronScheduleBuilder({
  value = '*/15 * * * *',
  onChange,
  compact = false,
  label = 'Execution Schedule (Visual Builder — No Cron Syntax Needed)',
}) {
  const [showAdvancedRaw, setShowAdvancedRaw] = useState(false);
  const parsed = parseCronToVisualState(value);

  const emitCronFromVisual = (next) => {
    const merged = { ...parsed, ...next };
    let newCron = '*/15 * * * *';
    if (merged.frequency === 'MINUTES') {
      newCron = `*/${merged.intervalMinutes || 15} * * * *`;
    } else if (merged.frequency === 'HOURS') {
      const hrs = Number(merged.intervalHours || 1);
      newCron =
        hrs <= 1
          ? `${merged.minute || 0} * * * *`
          : `${merged.minute || 0} */${hrs} * * *`;
    } else if (merged.frequency === 'DAILY') {
      newCron = `${merged.minute || 0} ${merged.hour || 0} * * *`;
    } else if (merged.frequency === 'WEEKLY') {
      newCron = `${merged.minute || 0} ${merged.hour || 9} * * ${
        merged.dayOfWeek || '1-5'
      }`;
    } else if (merged.frequency === 'MONTHLY') {
      newCron = `${merged.minute || 0} ${merged.hour || 0} ${
        merged.dayOfMonth || 1
      } * *`;
    }
    if (onChange) onChange(newCron);
  };

  const humanSummary = describeCronInPlainEnglish(value);

  return (
    <div className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-blue-700 dark:text-blue-300">
          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-bold">
            {humanSummary}
          </span>
          <button
            type="button"
            onClick={() => setShowAdvancedRaw((v) => !v)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-[10px] hover:bg-zinc-300 dark:hover:bg-zinc-700 cursor-pointer"
            title="Toggle raw 5-field cron expression for advanced users"
          >
            <Sliders className="w-2.5 h-2.5" />
            <span>{showAdvancedRaw ? 'Hide Cron Code' : `Cron: ${value}`}</span>
          </button>
        </div>
      </div>

      {/* 1-Click Plain-English Preset Pills */}
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[10px] font-mono text-zinc-500 mr-1">
          Quick Pick:
        </span>
        {(compact ? QUICK_SCHEDULES.slice(0, 6) : QUICK_SCHEDULES).map((p) => {
          const active = String(value).trim() === p.cron;
          return (
            <button
              key={p.cron}
              type="button"
              onClick={() => onChange && onChange(p.cron)}
              title={`${p.desc} (${p.cron})`}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-500/50'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Visual Dropdown Controls (Frequency + Interval / Time / Day) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
        <div>
          <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
            How Often to Run
          </label>
          <select
            value={parsed.frequency}
            onChange={(e) => emitCronFromVisual({ frequency: e.target.value })}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
          >
            <option value="MINUTES">Every X Minutes</option>
            <option value="HOURS">Every X Hours</option>
            <option value="DAILY">Every Day at a Specific Time</option>
            <option value="WEEKLY">Specific Days of the Week</option>
            <option value="MONTHLY">Once a Month on a Specific Day</option>
          </select>
        </div>

        {parsed.frequency === 'MINUTES' && (
          <div className="sm:col-span-2">
            <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
              Repeat Interval (Minutes)
            </label>
            <select
              value={parsed.intervalMinutes}
              onChange={(e) =>
                emitCronFromVisual({ intervalMinutes: e.target.value })
              }
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
            >
              <option value="1">Every 1 Minute</option>
              <option value="5">Every 5 Minutes</option>
              <option value="10">Every 10 Minutes</option>
              <option value="15">Every 15 Minutes (Recommended)</option>
              <option value="20">Every 20 Minutes</option>
              <option value="30">Every 30 Minutes</option>
              <option value="45">Every 45 Minutes</option>
            </select>
          </div>
        )}

        {parsed.frequency === 'HOURS' && (
          <>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                Every N Hours
              </label>
              <select
                value={parsed.intervalHours}
                onChange={(e) =>
                  emitCronFromVisual({ intervalHours: e.target.value })
                }
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                <option value="1">Every 1 Hour</option>
                <option value="2">Every 2 Hours</option>
                <option value="3">Every 3 Hours</option>
                <option value="4">Every 4 Hours</option>
                <option value="6">Every 6 Hours</option>
                <option value="8">Every 8 Hours</option>
                <option value="12">Every 12 Hours</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                At Minute Past Hour
              </label>
              <select
                value={parsed.minute}
                onChange={(e) => emitCronFromVisual({ minute: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                <option value="0">:00 (On the hour)</option>
                <option value="15">:15 (Quarter past)</option>
                <option value="30">:30 (Half past)</option>
                <option value="45">:45 (Quarter to)</option>
              </select>
            </div>
          </>
        )}

        {parsed.frequency === 'DAILY' && (
          <>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                Time of Day (Hour UTC)
              </label>
              <select
                value={parsed.hour}
                onChange={(e) => emitCronFromVisual({ hour: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {HOURS_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                Minute
              </label>
              <select
                value={parsed.minute}
                onChange={(e) => emitCronFromVisual({ minute: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                <option value="0">:00</option>
                <option value="15">:15</option>
                <option value="30">:30</option>
                <option value="45">:45</option>
              </select>
            </div>
          </>
        )}

        {parsed.frequency === 'WEEKLY' && (
          <>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                Day(s) of Week
              </label>
              <select
                value={parsed.dayOfWeek}
                onChange={(e) =>
                  emitCronFromVisual({ dayOfWeek: e.target.value })
                }
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                Time of Day (UTC)
              </label>
              <select
                value={parsed.hour}
                onChange={(e) => emitCronFromVisual({ hour: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {HOURS_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {parsed.frequency === 'MONTHLY' && (
          <>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                Day of Month
              </label>
              <select
                value={parsed.dayOfMonth}
                onChange={(e) =>
                  emitCronFromVisual({ dayOfMonth: e.target.value })
                }
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>
                    Day {d} of every month
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                Time of Day (UTC)
              </label>
              <select
                value={parsed.hour}
                onChange={(e) => emitCronFromVisual({ hour: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1.5 text-xs font-mono text-zinc-900 dark:text-zinc-100"
              >
                {HOURS_OPTIONS.map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Optional Raw Cron Expression Input for Power Users */}
      {showAdvancedRaw && (
        <div className="pt-1.5 border-t border-blue-500/20 flex items-center justify-between gap-2">
          <span className="text-[10px] font-mono text-zinc-500">
            Advanced 5-Field UNIX Cron Expression (<code>min hour day month weekday</code>):
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            className="w-44 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded px-2 py-1 text-xs font-mono text-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}
    </div>
  );
}
