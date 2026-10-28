import React, { createContext, useContext, useState, useEffect } from 'react';

export const DEFAULT_CHART_COLORS = [
  '#1a73e8', // 1. Google Cloud Blue (Primary Brand & Active Series)
  '#1e8e3e', // 2. Google Cloud Green (Healthy / Allow / Free-Tier)
  '#f9ab00', // 3. Google Cloud Yellow-Amber (Warning / Drift / Quota)
  '#d93025', // 4. Google Cloud Red (Critical / Deny / Alert)
  '#5f6368', // 5. Google Cloud Neutral Slate (Baseline / Secondary)
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);
  const [chartColors, setChartColors] = useState(DEFAULT_CHART_COLORS);
  const [mobilePreview, setMobilePreview] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        chartColors,
        setChartColors,
        mobilePreview,
        setMobilePreview,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
