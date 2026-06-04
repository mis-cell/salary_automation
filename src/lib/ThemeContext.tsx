import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeKey = "classic" | "emerald" | "crimson" | "cobalt" | "mono";

export interface ThemeStyles {
  key: ThemeKey;
  label: string;
  colorHex: string;
  brandBg: string;             // from-XX to-YY for logos
  brandText: string;
  pageBg: string;              // App page backgrounds
  accentBg: string;            // Standard bg accents (loaded spinners, etc.)
  accentText: string;          // Main text dynamic highlights
  accentTextDark: string;      // Darker text for extreme legibility
  accentBorder: string;        // Component border colors
  accentBorderCard: string;    // Custom card border accent
  accentRing: string;          // Focus rings
  navActive: string;           // Selected tab classes
  navHover: string;            // Hover active classes
  primaryBtn: string;          // Form actions, primary buttons
  primaryBadge: string;        // Selected slip tag/status badge
  highlightBg: string;         // Light container background highlights
  glowShadow: string;          // Custom box-shadow glows
  accentIndicator: string;
  loginTextGradient: string;
}

export const themeConfigs: Record<ThemeKey, ThemeStyles> = {
  classic: {
    key: "classic",
    label: "Midnight Luxe",
    colorHex: "#0e172c",
    brandBg: "from-[#1e1b4b] to-[#0f172a] bg-[#1e1b4b]",
    brandText: "text-indigo-650",
    pageBg: "from-[#fafbfe] via-[#ffffff] to-[#f1f4fc]",
    accentBg: "bg-indigo-600",
    accentText: "text-indigo-600",
    accentTextDark: "text-indigo-950",
    accentBorder: "border-indigo-100",
    accentBorderCard: "hover:border-indigo-200",
    accentRing: "focus:ring-indigo-200 focus:border-indigo-400",
    navActive: "bg-slate-900 text-white shadow-lg shadow-slate-900/10",
    navHover: "hover:bg-slate-100/80 hover:text-slate-900",
    primaryBtn: "from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-850 bg-slate-950 text-white shadow-slate-950/20",
    primaryBadge: "text-indigo-800 bg-indigo-50 border-indigo-100",
    highlightBg: "bg-indigo-50/20",
    glowShadow: "rgba(99, 102, 241, 0.12)",
    accentIndicator: "bg-white/40",
    loginTextGradient: "from-slate-850 to-slate-650"
  },
  emerald: {
    key: "emerald",
    label: "Sage & Spruce",
    colorHex: "#064e3b",
    brandBg: "from-[#064e3b] to-[#022c22] bg-[#064e3b]",
    brandText: "text-emerald-700",
    pageBg: "from-[#fcfdfa] via-[#ffffff] to-[#f2f7f1]",
    accentBg: "bg-emerald-600",
    accentText: "text-emerald-750 text-emerald-700",
    accentTextDark: "text-emerald-950",
    accentBorder: "border-emerald-100/80",
    accentBorderCard: "hover:border-emerald-200",
    accentRing: "focus:ring-emerald-200 focus:border-emerald-500",
    navActive: "bg-emerald-950 text-white shadow-lg shadow-emerald-950/15",
    navHover: "hover:bg-emerald-50/80 hover:text-emerald-900",
    primaryBtn: "from-emerald-850 to-emerald-750 hover:from-emerald-950 hover:to-[#022c22] bg-emerald-900 text-white shadow-emerald-950/25",
    primaryBadge: "text-emerald-800 bg-emerald-50 border-emerald-100",
    highlightBg: "bg-emerald-50/20",
    glowShadow: "rgba(16, 185, 129, 0.12)",
    accentIndicator: "bg-emerald-50/30",
    loginTextGradient: "from-emerald-900 to-emerald-700"
  },
  crimson: {
    key: "crimson",
    label: "Nordic Rosewood",
    colorHex: "#4c0519",
    brandBg: "from-[#4c0519] to-[#310410] bg-[#4c0519]",
    brandText: "text-rose-700",
    pageBg: "from-[#fdfafb] via-[#ffffff] to-[#fdf2f4]",
    accentBg: "bg-rose-600",
    accentText: "text-rose-750 text-rose-700",
    accentTextDark: "text-rose-950",
    accentBorder: "border-rose-100/80",
    accentBorderCard: "hover:border-rose-200",
    accentRing: "focus:ring-rose-200 focus:border-rose-500",
    navActive: "bg-rose-950 text-white shadow-lg shadow-rose-950/15",
    navHover: "hover:bg-rose-50/80 hover:text-rose-900",
    primaryBtn: "from-rose-850 to-rose-750 hover:from-rose-950 hover:to-[#310410] bg-rose-900 text-white shadow-rose-950/25",
    primaryBadge: "text-rose-800 bg-rose-50 border-rose-100",
    highlightBg: "bg-rose-50/20",
    glowShadow: "rgba(244, 63, 94, 0.12)",
    accentIndicator: "bg-rose-50/30",
    loginTextGradient: "from-rose-900 to-rose-700"
  },
  cobalt: {
    key: "cobalt",
    label: "Terracotta Linen",
    colorHex: "#7c2d12",
    brandBg: "from-[#7c2d12] to-[#451a03] bg-[#7c2d12]",
    brandText: "text-amber-800",
    pageBg: "from-[#fffdfa] via-[#ffffff] to-[#fdf6f0]",
    accentBg: "bg-orange-600",
    accentText: "text-amber-800 text-orange-700",
    accentTextDark: "text-amber-950",
    accentBorder: "border-orange-100",
    accentBorderCard: "hover:border-orange-200",
    accentRing: "focus:ring-amber-200 focus:border-orange-500",
    navActive: "bg-amber-950 text-white shadow-lg shadow-amber-950/15",
    navHover: "hover:bg-orange-50/80 hover:text-amber-950",
    primaryBtn: "from-orange-800 to-orange-700 hover:from-orange-950 hover:to-[#451a03] bg-orange-900 text-white shadow-orange-950/25",
    primaryBadge: "text-amber-800 bg-amber-50 border-amber-150",
    highlightBg: "bg-amber-50/20",
    glowShadow: "rgba(249, 115, 22, 0.12)",
    accentIndicator: "bg-amber-50/30",
    loginTextGradient: "from-orange-900 to-orange-700"
  },
  mono: {
    key: "mono",
    label: "Carbon Minimal",
    colorHex: "#1e293b",
    brandBg: "from-[#1e293b] to-[#0f172a] bg-[#1e293b]",
    brandText: "text-slate-800",
    pageBg: "from-[#fcfcfd] via-white to-[#f4f4f5]",
    accentBg: "bg-slate-700",
    accentText: "text-slate-800",
    accentTextDark: "text-slate-950",
    accentBorder: "border-slate-200",
    accentBorderCard: "hover:border-slate-300",
    accentRing: "focus:ring-slate-205 focus:border-slate-450 focus:ring-slate-200 focus:border-slate-400",
    navActive: "bg-slate-900 text-white shadow-md shadow-slate-900/5",
    navHover: "hover:bg-slate-100 hover:text-slate-950",
    primaryBtn: "from-slate-800 to-slate-750 hover:from-slate-950 hover:to-slate-900 bg-slate-900 text-white shadow-slate-900/20",
    primaryBadge: "text-slate-850 bg-slate-100 border-slate-300",
    highlightBg: "bg-slate-100/50",
    glowShadow: "rgba(100, 116, 139, 0.12)",
    accentIndicator: "bg-slate-200",
    loginTextGradient: "from-slate-900 to-slate-600"
  }
};

interface ThemeContextType {
  currentTheme: ThemeKey;
  theme: ThemeStyles;
  setTheme: (theme: ThemeKey) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentThemeState] = useState<ThemeKey>(() => {
    const saved = localStorage.getItem("PAYSLIP_PREFER_THEME") || localStorage.getItem("APP_PREFER_THEME");
    if (saved === "classic" || saved === "emerald" || saved === "crimson" || saved === "cobalt" || saved === "mono") {
      return saved as ThemeKey;
    }
    return "classic";
  });

  const setTheme = (newTheme: ThemeKey) => {
    setCurrentThemeState(newTheme);
    localStorage.setItem("PAYSLIP_PREFER_THEME", newTheme);
    localStorage.setItem("APP_PREFER_THEME", newTheme);
  };

  const theme = themeConfigs[currentTheme];

  useEffect(() => {
    // Dynamically set CSS variables in :root for custom inline styles or styles in index.css
    const root = document.documentElement;
    root.style.setProperty("--app-accent-color", theme.colorHex);
    root.style.setProperty("--app-shadow-glow", theme.glowShadow);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
