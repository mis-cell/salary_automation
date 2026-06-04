import React, { useState } from "react";
import { Routes, Route, Link, useLocation, HashRouter } from "react-router-dom";
import { useAuth, AuthProvider } from "./lib/AuthContext";
import { Menu, LogOut, FileText, Users, CalendarDays, LayoutDashboard, Calculator, IndianRupee, Settings, Check, Monitor, Grid } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import EnterSalary from "./pages/EnterSalary";
import ManageEmployees from "./pages/ManageEmployees";
import LeaveBalance from "./pages/LeaveBalance";
import PayDetails from "./pages/PayDetails";
import { getSheetId, setSheetId, getAppsScriptUrl, setAppsScriptUrl } from "./lib/googleSheetsService";

// Clean, high-contrast, professional link matching modern SaaS apps
const NavLink = ({ to, children, icon: Icon, mobile }: { to: string, children: React.ReactNode, icon?: any, mobile?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all duration-150 ${
        isActive 
          ? "bg-slate-900 text-white font-bold shadow-sm" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-semibold"
      } ${mobile ? 'w-full mb-1 py-3 text-base' : ''}`}
    >
      {Icon && <Icon className={`w-4.5 h-4.5 ${isActive ? 'opacity-100' : 'opacity-70'}`} />}
      {children}
    </Link>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}

function AppContent() {
  const { user, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSheetId, setTempSheetId] = useState(getSheetId());
  const [tempAppsScriptUrl, setTempAppsScriptUrl] = useState(getAppsScriptUrl());
  
  // Custom screen mode to fulfill: "make this app view in full screen"
  const [isFullScreen, setIsFullScreen] = useState(true); 

  const handleSaveSettings = () => {
    setSheetId(tempSheetId);
    setAppsScriptUrl(tempAppsScriptUrl);
    setSettingsOpen(false);
    // Reload page to re-trigger all queries
    window.location.reload();
  };

  // Modern corporate light theme sign-in
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50 relative overflow-hidden bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]">
        <div className="max-w-md w-full bg-white border border-slate-250 p-10 rounded-[32px] shadow-[0_20px_50px_rgba(15,23,42,0.05)] text-center relative z-10">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md shadow-slate-900/10">
            <Calculator className="w-7 h-7"/>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Yashoda Enterprise</h1>
          <p className="text-slate-500 mb-8 text-xs font-semibold leading-relaxed">
            Professional Multi-Sheet Payroll Ledger Management <br />
            and AutoPay Calculation Engine.
          </p>
          <button
            onClick={login}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-md hover:scale-[1.01] transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            Sign in as payroll administrator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-800 bg-slate-50/60 flex flex-col relative overflow-x-hidden">
      
      {/* Top Professional Navigation */}
      <header className="bg-white/95 border-b border-slate-200 sticky top-0 z-50 backdrop-blur-md shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-3 font-black text-lg tracking-tight text-slate-900">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white text-md font-black shadow-inner">
                Y
              </div>
              <span>Yashoda Payroll</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
              <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
              <NavLink to="/salary" icon={FileText}>Run Payroll</NavLink>
              <NavLink to="/employees" icon={Users}>Directory</NavLink>
              <NavLink to="/leave" icon={CalendarDays}>Leave Balance</NavLink>
              <NavLink to="/pay" icon={IndianRupee}>Pay Details</NavLink>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              
              {/* Full Screen Switch */}
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all"
                title="Toggle Full Screen Widescreen View"
              >
                <Monitor className="w-3.5 h-3.5 text-slate-500" />
                <span>{isFullScreen ? "Standard Width" : "Full Screen"}</span>
              </button>

              <button 
                onClick={() => setSettingsOpen(true)} 
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" /> 
                <span>Connection</span>
              </button>

              <button 
                onClick={logout} 
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> 
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile Actions Button */}
            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="p-2 text-slate-650 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setSettingsOpen(true)} 
                className="p-2 text-slate-650 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="p-2 text-slate-650 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="px-4 pt-3 pb-5 space-y-2">
              <NavLink to="/" icon={LayoutDashboard} mobile>Dashboard</NavLink>
              <NavLink to="/salary" icon={FileText} mobile>Run Payroll</NavLink>
              <NavLink to="/employees" icon={Users} mobile>Directory</NavLink>
              <NavLink to="/leave" icon={CalendarDays} mobile>Leave Balance</NavLink>
              <NavLink to="/pay" icon={IndianRupee} mobile>Pay Details</NavLink>
              
              <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col gap-2">
                <button 
                  onClick={() => { setMenuOpen(false); setSettingsOpen(true); }} 
                  className="flex items-center justify-center gap-2 px-4 py-3 w-full text-base font-bold text-slate-700 bg-slate-100 rounded-xl transition-all"
                >
                  <Settings className="w-5 h-5 text-slate-500" /> Sheet Connection
                </button>
                <button onClick={logout} className="flex items-center justify-center gap-2 px-4 py-3 w-full text-base font-bold text-rose-700 bg-rose-50 rounded-xl transition-all">
                  <LogOut className="w-5 h-5" /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Settings Modal popover */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-[24px] max-w-lg w-full p-8 border border-slate-200 shadow-2xl flex flex-col gap-6 animate-in zoom-in-95 duration-150">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-700" />
                Sheet Connection
              </h2>
              <p className="text-slate-500 text-xs mt-1 font-semibold">
                Link and configure your Google Spreadsheet database identifier.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Google Sheet Identifier (ID)</label>
                <input 
                  type="text" 
                  value={tempSheetId} 
                  onChange={(e) => setTempSheetId(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl text-xs font-semibold font-mono text-slate-950 shadow-xs outline-none transition-all focus:ring-4 focus:ring-slate-100"
                  placeholder="e.g. 1IoGYxMMOrVzkHyqp1n2InXgf14jLJUEfKZMX5MWVBj4"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Google Apps Script Web App URL</label>
                <input 
                  type="text" 
                  value={tempAppsScriptUrl} 
                  onChange={(e) => setTempAppsScriptUrl(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-200 focus:border-slate-400 rounded-xl text-xs font-semibold font-mono text-slate-950 shadow-xs outline-none transition-all focus:ring-4 focus:ring-slate-100"
                  placeholder="e.g. https://script.google.com/macros/s/.../exec"
                />
              </div>

              <div className="bg-slate-50/70 p-4 border border-slate-100 rounded-2xl text-[11px] text-slate-600 space-y-2 leading-relaxed">
                <p className="font-extrabold text-slate-900">
                  ⚠️ Google Sheets Setup Guidelines
                </p>
                <ol className="list-decimal pl-4 space-y-1 font-medium text-slate-500">
                  <li>Open your Google Spreadsheet in Google Drive.</li>
                  <li>Click the prominent <strong className="text-slate-900 font-bold">Share</strong> button in the top right.</li>
                  <li>Under General Access, configure state to <strong className="text-slate-900 font-bold">"Anyone with the link"</strong>.</li>
                  <li>Ensure access level role remains set as <strong className="font-bold text-slate-900">Viewer</strong>.</li>
                </ol>
                <p className="mt-2 text-slate-400 font-normal">
                  Private spreadsheets block queries from client devices due to CORS policy and cause sync failure badges.
                </p>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-4 h-4" /> Save Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Workspace with Full Screen width capability */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-20">
        <div className={isFullScreen ? "w-full" : "max-w-7xl mx-auto"}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/salary" element={<EnterSalary />} />
            <Route path="/employees" element={<ManageEmployees />} />
            <Route path="/leave" element={<LeaveBalance />} />
            <Route path="/pay" element={<PayDetails />} />
          </Routes>
        </div>
      </main>

    </div>
  );
}
