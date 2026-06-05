import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, HashRouter } from "react-router-dom";
import { useAuth, AuthProvider } from "./lib/AuthContext";
import { Menu, LogOut, FileText, Users, CalendarDays, LayoutDashboard, Calculator, IndianRupee, Settings, Check, Monitor, X, HelpCircle, Palette, BarChart3, Database, HeartHandshake } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import EnterSalary from "./pages/EnterSalary";
import ManageEmployees from "./pages/ManageEmployees";
import LeaveBalance from "./pages/LeaveBalance";
import PayDetails from "./pages/PayDetails";
import { getSheetId, setSheetId, getAppsScriptUrl, setAppsScriptUrl, getServiceLogs, clearServiceLogs } from "./lib/googleSheetsService";
import { ThemeProvider, useTheme, themeConfigs, ThemeKey } from "./lib/ThemeContext";
import { isOfflineMode, setOfflineMode, resetOfflineDatabase } from "./lib/localDatabase";

// Modern, gradient-accented NavLink with subtle animation and active state
const NavLink = ({ to, children, icon: Icon, mobile }: { to: string; children: React.ReactNode; icon?: any; mobile?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  const { theme } = useTheme();
  
  return (
    <Link
      to={to}
      className={`
        relative px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-sm font-semibold transition-all duration-200
        ${mobile ? 'w-full mb-1 py-3 text-base' : ''}
        ${isActive 
          ? theme.navActive 
          : `text-slate-600 ${theme.navHover}`
        }
      `}
    >
      {Icon && <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />}
      <span className="tracking-wide font-sans">{children}</span>
      {isActive && !mobile && (
        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 ${theme.accentIndicator} rounded-full`} />
      )}
    </Link>
  );
};

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

function AppContent() {
  const { user, login, logout } = useAuth();
  const { currentTheme, theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSheetId, setTempSheetId] = useState(getSheetId());
  const [tempAppsScriptUrl, setTempAppsScriptUrl] = useState(getAppsScriptUrl());
  const [tempOfflineMode, setTempOfflineMode] = useState(isOfflineMode());
  const [isFullScreen, setIsFullScreen] = useState(true);
  const [logsList, setLogsList] = useState(() => getServiceLogs());

  // Automatically sync/update logs list whenever modal state changes or periodically
  useEffect(() => {
    let interval: any;
    if (settingsOpen) {
      setLogsList(getServiceLogs());
      interval = setInterval(() => {
        setLogsList(getServiceLogs());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [settingsOpen]);

  const handleClearLogs = (e: React.MouseEvent) => {
    e.preventDefault();
    clearServiceLogs();
    setLogsList([]);
  };

  const handleSaveSettings = () => {
    setSheetId(tempSheetId);
    setAppsScriptUrl(tempAppsScriptUrl);
    setOfflineMode(tempOfflineMode);
    setSettingsOpen(false);
    window.location.reload();
  };

  // Modern, high-fidelity login screen with animated gradient and glassmorphic card
  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-gradient-to-br ${theme.pageBg}`}>
        {/* Animated background blobs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-300/15 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="max-w-md w-full relative z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 text-center transform transition-all duration-500 hover:scale-[1.01]">
            <div className={`w-16 h-16 bg-gradient-to-br ${theme.brandBg} text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/10`}>
              <Calculator className="w-8 h-8" />
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3 border border-slate-200/50">
              Secure Payroll Portal
            </span>
            <h1 className={`text-3xl font-black bg-gradient-to-r ${theme.loginTextGradient} bg-clip-text text-transparent mb-2 tracking-tight font-display`}>
              Yashoda Enterprise
            </h1>
            <p className="text-slate-500 mb-6 text-sm font-medium">
              Intelligent Payroll Management System
            </p>
            
            <div className="h-px bg-gradient-to-r from-transparent via-slate-205 to-transparent my-6" />
            
            <button
              onClick={login}
              id="login-admin-btn"
              className={`group w-full bg-gradient-to-r ${theme.primaryBtn} cursor-pointer text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2`}
            >
              <span>Sign in as Payroll Administrator</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
            
            {/* Color Palette theme switcher on login page */}
            <div className="mt-8 pt-6 border-t border-slate-200/50 flex flex-col items-center gap-2.5">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 justify-center">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                Select Palette Theme
              </span>
              <div className="flex gap-2.5 justify-center">
                {(Object.keys(themeConfigs) as ThemeKey[]).map((tKey) => {
                  const cfg = themeConfigs[tKey];
                  const active = currentTheme === tKey;
                  return (
                    <button
                      key={tKey}
                      onClick={() => setTheme(tKey)}
                      title={cfg.label}
                      className={`w-7 h-7 rounded-full border-2 transition-all duration-350 scale-95 hover:scale-105 cursor-pointer relative ${
                        active ? "border-slate-800 scale-105 shadow-md shadow-slate-900/10" : "border-slate-200 hover:border-slate-300"
                      }`}
                      style={{ backgroundColor: cfg.colorHex }}
                    >
                      {active && <span className="absolute inset-0.5 rounded-full border border-white" />}
                    </button>
                  );
                })}
              </div>
              <span className="text-[10px] text-slate-400 font-medium font-sans">
                Active Theme: <span className="font-bold text-slate-650">{theme.label}</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-405 text-slate-450 text-slate-400 mt-6 font-semibold">
              Secure Auth • Real-Time G-Sheets Sync
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans bg-gradient-to-br ${theme.pageBg} relative overflow-x-hidden`}>
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
      
      {/* Header with advanced glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Enhanced Logo with gradient */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${theme.brandBg} flex items-center justify-center shadow-md shadow-slate-900/10`}>
                <span className="text-white font-black text-lg">Y</span>
              </div>
              <div className="flex flex-col">
                <span className={`font-black text-lg tracking-tight bg-gradient-to-r ${theme.loginTextGradient} bg-clip-text text-transparent font-display`}>
                  Yashoda Payroll
                </span>
                <span className="text-[10px] font-semibold text-slate-400 -mt-0.5">{theme.label} Edition</span>
              </div>
            </div>

            {/* Desktop Navigation - Premium styling */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
              <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
              <NavLink to="/salary" icon={FileText}>Run Payroll</NavLink>
              <NavLink to="/employees" icon={Users}>Directory</NavLink>
              <NavLink to="/leave" icon={CalendarDays}>Leave Balance</NavLink>
              <NavLink to="/pay" icon={IndianRupee}>Pay Details</NavLink>
              <NavLink to="/reports" icon={BarChart3}>Reports</NavLink>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setSettingsOpen(true)} 
                className="group flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:rotate-[30deg] transition-transform duration-300" />
                <span>Settings</span>
              </button>

              <button 
                onClick={logout} 
                className="group flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={() => setSettingsOpen(true)} 
                className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl transition-all hover:shadow-md cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl transition-all hover:shadow-md cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Menu with smooth animation */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-lg animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 pt-3 pb-6 space-y-1.5 animate-in fade-in duration-200">
              <NavLink to="/" icon={LayoutDashboard} mobile>Dashboard</NavLink>
              <NavLink to="/salary" icon={FileText} mobile>Run Payroll</NavLink>
              <NavLink to="/employees" icon={Users} mobile>Directory</NavLink>
              <NavLink to="/leave" icon={CalendarDays} mobile>Leave Balance</NavLink>
              <NavLink to="/pay" icon={IndianRupee} mobile>Pay Details</NavLink>
              <NavLink to="/reports" icon={BarChart3} mobile>Reports</NavLink>
              
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                <button 
                  onClick={() => { setMenuOpen(false); setSettingsOpen(true); }} 
                  className="flex items-center justify-center gap-2.5 px-4 py-3 w-full text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <Settings className="w-5 h-5 text-slate-500" /> Settings
                </button>
                <button onClick={logout} className="flex items-center justify-center gap-2.5 px-4 py-3 w-full text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer">
                  <LogOut className="w-5 h-5" /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Premium Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-2xl">
                    <Settings className="w-5 h-5 text-slate-700 animate-spin-slow" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight font-display">System Settings</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5 animate-pulse">Configure theme palette, layout width, and sheet integration</p>
                  </div>
                </div>
                <button onClick={() => setSettingsOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* SECTION 1: APPEARANCE & LAYOUT */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-450 text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Palette className="w-3.5 h-3.5 text-slate-505 text-slate-500" />
                  Appearance Settings
                </h3>

                {/* Color Palette theme picker */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block">Select Palette Theme</span>
                  <div className="flex flex-wrap gap-2.5">
                    {(Object.keys(themeConfigs) as ThemeKey[]).map((tKey) => {
                      const cfg = themeConfigs[tKey];
                      const active = currentTheme === tKey;
                      return (
                        <button
                          key={tKey}
                          onClick={() => setTheme(tKey)}
                          title={cfg.label}
                          className={`w-8 h-8 rounded-full border transition-all duration-250 cursor-pointer hover:scale-110 relative flex items-center justify-center ${
                            active ? "border-slate-800 scale-105 shadow-md ring-2 ring-slate-400/50" : "border-slate-200 hover:border-slate-300"
                          }`}
                          style={{ backgroundColor: cfg.colorHex }}
                        >
                          {active && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
                        </button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Current Workspace Colors: <span className="text-slate-700 font-bold">{theme.label}</span>
                  </span>
                </div>

                {/* Screen Width Toggle */}
                <div className="space-y-2.5 pt-1">
                  <span className="text-xs font-bold text-slate-700 block">Screen Layout Mode</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsFullScreen(false)}
                      className={`flex-1 py-2.5 px-4 border rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer ${
                        !isFullScreen 
                          ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-900 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <X className="w-3.5 h-3.5 rotate-45" />
                      <span>Standard Width</span>
                    </button>
                    <button
                      onClick={() => setIsFullScreen(true)}
                      className={`flex-1 py-2.5 px-4 border rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:bg-slate-50 transition-all cursor-pointer ${
                        isFullScreen 
                          ? "bg-slate-900 border-slate-900 text-white hover:bg-slate-900 shadow-sm" 
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Full Screen Mode</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DATABASE ENGINE CONFIGURATION */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Database className="w-3.5 h-3.5 text-slate-550 text-slate-500" />
                  Database Engine Mode
                </h3>

                <div className="flex gap-3">
                  <button
                    onClick={() => setTempOfflineMode(true)}
                    className={`flex-1 py-3 px-4 border rounded-2xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      tempOfflineMode 
                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px]">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Offline Relational DB
                    </div>
                    <span className="text-[9px] opacity-75 font-medium">Auto-persistent inside browser storage</span>
                  </button>
                  <button
                    onClick={() => setTempOfflineMode(false)}
                    className={`flex-1 py-3 px-4 border rounded-2xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      !tempOfflineMode 
                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[10px]">
                      Cloud Synced G-Sheet
                    </div>
                    <span className="text-[9px] opacity-75 font-medium">Binds to live Google Spreadsheets</span>
                  </button>
                </div>

                {tempOfflineMode ? (
                  <div className="bg-slate-50/80 p-4.5 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-emerald-500 animate-pulse" /> Windows 7 Standalone Suite
                    </h4>
                    <p className="text-[11px] text-slate-550 text-slate-600 font-medium leading-relaxed">
                      Your database files, rosters, processed pay logs, and calculations remain 100% locally saved inside your browser. No Node.js server, Python, or local relational installs are needed!
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("Reset local database? This wipes all localized edits and restores standard pre-seeded rosters and leave balance ledgers.")) {
                            resetOfflineDatabase();
                            alert("Local database reset successfully! The application will refresh.");
                            window.location.reload();
                          }
                        }}
                        className="flex-1 py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer bg-white"
                      >
                        Reset Offline DB
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          alert("To operate this utility 100% offline on any Windows 7 computer:\n\n1. Simply select 'Save Page As...' (Ctrl+S) inside your Google Chrome or Mozilla Firefox menu.\n2. Choose 'Webpage, Complete' option to download the offline file bundle.\n3. Copy this file into your target folders. Double click it anytime with or without active internet connections to start!");
                        }}
                        className="flex-1 py-2 px-3 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 bg-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Launcher Guide
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        Google Sheet ID <HelpCircle className="w-3" />
                      </label>
                      <input 
                        type="text" 
                        value={tempSheetId} 
                        onChange={(e) => setTempSheetId(e.target.value)} 
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl text-sm font-mono text-slate-700 bg-slate-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="1IoGYxMMOrVzkHyqp1n2InXgf14jLJUEfKZMX5MWVBj4"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        Apps Script URL <HelpCircle className="w-3" />
                      </label>
                      <input 
                        type="text" 
                        value={tempAppsScriptUrl} 
                        onChange={(e) => setTempAppsScriptUrl(e.target.value)} 
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl text-sm font-mono text-slate-700 bg-slate-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-slate-200"
                        placeholder="https://script.google.com/macros/s/.../exec"
                      />
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-white p-4.5 rounded-xl border border-slate-100 shadow-inner">
                      <p className="text-[11px] font-extrabold text-slate-850 text-slate-800 mb-2 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        Setup Requirements
                      </p>
                      <ul className="space-y-1.5 text-[11px] text-slate-550 text-slate-600 font-medium leading-relaxed list-disc pl-4">
                        <li>Share Google Sheet with <span className="font-bold text-slate-800">"Anyone with the link"</span></li>
                        <li>Set permission to <span className="font-bold text-slate-800">Viewer</span> for CORS compatibility</li>
                        <li>Deploy Apps Script as Web App with authorization to <span className="font-bold text-slate-800">"Anyone"</span></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: SYSTEM AUDIT LOGGER */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Sheets Sync Transaction Log
                  </span>
                  <button 
                    onClick={handleClearLogs}
                    className="text-[10px] text-rose-600 font-extrabold rounded-lg hover:bg-rose-50 px-2.5 py-1 border border-rose-100 transition-all cursor-pointer"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="bg-slate-900 border border-slate-950 text-slate-100 p-3.5 rounded-xl font-mono text-[9px] max-h-[140px] overflow-y-auto space-y-2 shadow-inner">
                  {logsList.length === 0 ? (
                    <div className="text-slate-500 italic text-center py-2">No transactions recorded in the current session.</div>
                  ) : (
                    logsList.map((lg, i) => (
                      <div key={i} className="leading-relaxed border-b border-white/5 pb-1.5 last:border-0 last:pb-0">
                        <div className="flex justify-between text-[8px] text-slate-400 mb-0.5">
                          <span>{lg.timestamp}</span>
                          <span className={`px-1 rounded ${
                            lg.type === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400 font-extrabold" : 
                            lg.type === "ERROR" ? "bg-rose-500/10 text-rose-400 font-extrabold" : 
                            "bg-sky-500/10 text-sky-400"
                          }`}>
                            {lg.type}
                          </span>
                        </div>
                        <div className="text-indigo-300 font-bold uppercase tracking-wider text-[8px] mb-0.5">{lg.action}</div>
                        <div className="text-white font-medium text-[10px] whitespace-pre-wrap select-all">{lg.details}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="bg-slate-50/80 px-6 py-4.5 border-t border-slate-100 flex gap-3 justify-end shrink-0">
              <button 
                onClick={() => setSettingsOpen(false)}
                className="px-5 py-2.5 bg-white hover:bg-slate-55 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-all hover:shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white text-xs font-bold rounded-xl shadow-md shadow-slate-900/10 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content with smooth transitions */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 transition-all duration-300">
        <div className={`${isFullScreen ? "w-full" : "max-w-7xl mx-auto"} transition-all duration-500`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/salary" element={<EnterSalary />} />
            <Route path="/employees" element={<ManageEmployees />} />
            <Route path="/leave" element={<LeaveBalance />} />
            <Route path="/pay" element={<PayDetails defaultTab="individual" />} />
            <Route path="/reports" element={<PayDetails defaultTab="rangeReport" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
