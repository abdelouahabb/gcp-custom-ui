import React, { createContext, useContext, useState, useEffect } from 'react';

export const DEFAULT_CHART_COLORS = [
  '#1a73e8', // Google Cloud Blue 600
  '#1e8e3e', // Google Cloud Green 600
  '#e37400', // Google Cloud Amber 600
  '#d93025', // Google Cloud Red 600
  '#4285f4', // Google Cloud Blue 500
  '#34a853', // Google Cloud Green 500
  '#fbbc04', // Google Cloud Yellow 500
  '#ea4335', // Google Cloud Red 500
  '#8ab4f8', // Google Cloud Blue 300
  '#5f6368', // Google Cloud Neutral 500
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
