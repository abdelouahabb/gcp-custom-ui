import React from 'react';

/**
 * Official Google Cloud Product SVG Icons (24x24 geometric brand palette).
 * Uses Google Cloud official blues (#4285F4, #669DF6, #AECBFA) and 4-color mark
 * (#EA4335, #4285F4, #34A853, #FBBC04) so every studio is immediately recognizable.
 */

export function GcpLogoIcon({ className = 'w-5 h-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M15.17 8.47l2.53-2.53.17-.69A7.46 7.46 0 004.53 8.85l.5-.14 3.4-.56s.17-.29.26-.27a4.1 4.1 0 016.48.59z" fill="#EA4335" />
      <path d="M19.47 8.85a7.48 7.48 0 00-2.25-3.6l-2.37 2.37a4.1 4.1 0 011.51 3.26v.41a2.05 2.05 0 010 4.1h-4.1l-.41.41v2.46l.41.41h4.1a5.33 5.33 0 003.11-9.82z" fill="#4285F4" />
      <path d="M8.16 18.67h4.1v-3.28h-4.1a2.03 2.03 0 01-.85-.19l-.58.18-2.39 2.37-.15.57a5.3 5.3 0 003.97 1.35z" fill="#34A853" />
      <path d="M8.16 8.01a5.33 5.33 0 00-3.97 8.89l2.39-2.39a2.05 2.05 0 112.7-2.7l2.39-2.39A5.3 5.3 0 008.16 8.01z" fill="#FBBC04" />
    </svg>
  );
}

export function GcpComputeEngineIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="1.5" fill="#669DF6" />
      <rect x="9" y="9" width="6" height="6" rx="0.8" fill="#4285F4" />
      <path d="M9 2v3M12 2v3M15 2v3M9 19v3M12 19v3M15 19v3M2 9h3M2 12h3M2 15h3M19 9h3M19 12h3M19 15h3" stroke="#AECBFA" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GcpCloudRunIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 5l4 7-4 7h4.5l4-7-4-7H4z" fill="#AECBFA" />
      <path d="M9.5 3l6 9-6 9h5l6-9-6-9h-5z" fill="#4285F4" />
    </svg>
  );
}

export function GcpGkeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="#4285F4" fillOpacity="0.18" stroke="#4285F4" strokeWidth="1.7" />
      <polygon points="12,6.5 16.8,9.2 16.8,14.8 12,17.5 7.2,14.8 7.2,9.2" fill="#669DF6" />
      <path d="M12 2v4.5M21 7l-4.2 2.2M21 17l-4.2-2.2M12 22v-4.5M3 17l4.2-2.2M3 7l4.2 2.2" stroke="#4285F4" strokeWidth="1.5" />
    </svg>
  );
}

export function GcpBigQueryIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="7.5" stroke="#4285F4" strokeWidth="2.2" fill="#4285F4" fillOpacity="0.12" />
      <rect x="7" y="10" width="2" height="4" rx="0.5" fill="#669DF6" />
      <rect x="10" y="7.5" width="2" height="6.5" rx="0.5" fill="#4285F4" />
      <rect x="13" y="9" width="2" height="5" rx="0.5" fill="#AECBFA" />
      <path d="M16 16l4.8 4.8" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function GcpCloudStorageIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="6.5" rx="1.5" fill="#669DF6" />
      <rect x="3" y="13.5" width="18" height="6.5" rx="1.5" fill="#4285F4" />
      <rect x="6" y="6.4" width="6" height="1.7" rx="0.8" fill="#ffffff" />
      <circle cx="17.5" cy="7.25" r="1.2" fill="#ffffff" />
      <rect x="6" y="15.9" width="6" height="1.7" rx="0.8" fill="#ffffff" />
      <circle cx="17.5" cy="16.75" r="1.2" fill="#ffffff" />
    </svg>
  );
}

export function GcpCloudSqlIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 7.5L12 3l8 4.5-8 4.5L4 7.5z" fill="#AECBFA" />
      <path d="M4 12l8 4.5 8-4.5" stroke="#669DF6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16.5L12 21l8-4.5" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GcpAlloyDbIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <ellipse cx="12" cy="6" rx="7.5" ry="3" fill="#AECBFA" />
      <path d="M4.5 6v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3V6" fill="#669DF6" />
      <path d="M4.5 12v6c0 1.66 3.36 3 7.5 3s7.5-1.34 7.5-3v-6" fill="#4285F4" />
      <ellipse cx="12" cy="6" rx="7.5" ry="3" fill="#AECBFA" />
    </svg>
  );
}

export function GcpVpcNetworkIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="9" y="3" width="6" height="4.5" rx="1" fill="#4285F4" />
      <rect x="3" y="16.5" width="6" height="4.5" rx="1" fill="#669DF6" />
      <rect x="15" y="16.5" width="6" height="4.5" rx="1" fill="#669DF6" />
      <path d="M12 7.5V12M12 12H6v4.5M12 12h6v4.5" stroke="#AECBFA" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GcpCloudFunctionsIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M8 5L3 12l5 7" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 5l5 7-5 7" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9.5" cy="12" r="1.4" fill="#AECBFA" />
      <circle cx="14.5" cy="12" r="1.4" fill="#669DF6" />
    </svg>
  );
}

export function GcpSecurityIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2.5L4.5 5.8v5.7c0 4.8 3.2 9.1 7.5 10.3 4.3-1.2 7.5-5.5 7.5-10.3V5.8L12 2.5z" fill="#4285F4" fillOpacity="0.2" stroke="#4285F4" strokeWidth="1.8" />
      <path d="M12 5.5v13.5c3-1 5.2-4.2 5.2-7.8V7.6L12 5.5z" fill="#669DF6" />
      <path d="M9.3 12.2l1.8 1.8 3.8-3.8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GcpLoggingIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="4" width="4" height="4" rx="0.8" fill="#4285F4" />
      <rect x="10" y="5" width="10" height="2" rx="1" fill="#AECBFA" />
      <rect x="4" y="10" width="4" height="4" rx="0.8" fill="#669DF6" />
      <rect x="10" y="11" width="10" height="2" rx="1" fill="#669DF6" />
      <rect x="4" y="16" width="4" height="4" rx="0.8" fill="#4285F4" />
      <rect x="10" y="17" width="7" height="2" rx="1" fill="#4285F4" />
    </svg>
  );
}

export function GcpBillingIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" fill="#4285F4" fillOpacity="0.16" stroke="#4285F4" strokeWidth="1.8" />
      <rect x="3" y="8.5" width="18" height="2.8" fill="#669DF6" />
      <rect x="6" y="14" width="5" height="2" rx="0.8" fill="#34A853" />
    </svg>
  );
}

export function GcpSpannerIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="#4285F4" strokeWidth="1.8" fill="#4285F4" fillOpacity="0.1" />
      <circle cx="12" cy="5.5" r="2" fill="#4285F4" />
      <circle cx="6.5" cy="15.5" r="2" fill="#669DF6" />
      <circle cx="17.5" cy="15.5" r="2" fill="#669DF6" />
      <path d="M12 7.5v4.5m0 0l-4 2.5m4-2.5l4 2.5" stroke="#AECBFA" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function GcpDataprocSparkIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2.5l2.4 6.6L21 11.5l-6.6 2.4L12 20.5l-2.4-6.6L3 11.5l6.6-2.4L12 2.5z" fill="#4285F4" />
      <circle cx="12" cy="11.5" r="2.2" fill="#FBBC04" />
    </svg>
  );
}

export function GcpCloudBuildIcon({ className = 'w-4 h-4' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 2.5L4 7v10l8 4.5 8-4.5V7l-8-4.5z" fill="#4285F4" fillOpacity="0.16" stroke="#4285F4" strokeWidth="1.7" />
      <path d="M12 7.5l4 2.3v4.4L12 16.5l-4-2.3V9.8l4-2.3z" fill="#669DF6" />
    </svg>
  );
}
