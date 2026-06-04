import React, { useState } from "react";
import { Routes, Route, Link, useLocation, HashRouter } from "react-router-dom";
import { useAuth, AuthProvider } from "./lib/AuthContext";
import { Menu, LogOut, FileText, Users, CalendarDays, LayoutDashboard, Calculator, IndianRupee, Settings, Check, Monitor, X, HelpCircle } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import EnterSalary from "./pages/EnterSalary";
import ManageEmployees from "./pages/ManageEmployees";
import LeaveBalance from "./pages/LeaveBalance";
import PayDetails from "./pages/PayDetails";
import { getSheetId, setSheetId, getAppsScriptUrl, setAppsScriptUrl } from "./lib/googleSheetsService";

// Modern, gradient-accented NavLink with subtle animation and active state
const NavLink = ({ to, children, icon: Icon, mobile }: { to: string; children: React.ReactNode; icon?: any; mobile?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`
        relative px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-sm font-medium transition-all duration-200
        ${mobile ? 'w-full mb-1 py-3 text-base' : ''}
        ${isActive 
          ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-md shadow-slate-900/10' 
          : 'text-slate-605 text-slate-500 hover:text-slate-900 hover:bg-slate-100/80'
        }
      `}
    >
      {Icon && <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`} />}
      <span className="tracking-wide font-sans">{children}</span>
      {isActive && !mobile && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white/30 rounded-full" />
      )}
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
  const [isFullScreen, setIsFullScreen] = useState(true);

  const handleSaveSettings = () => {
    setSheetId(tempSheetId);
    setAppsScriptUrl(tempAppsScriptUrl);
    setSettingsOpen(false);
    window.location.reload();
  };

  // Modern, high-fidelity login screen with animated gradient and glassmorphic card
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Animated background blobs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-slate-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-slate-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="max-w-md w-full relative z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 text-center transform transition-all duration-500 hover:scale-[1.02]">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-slate-900/20">
              <Calculator className="w-8 h-8" />
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3 border border-slate-200/50">
              Secure Payroll Portal
            </span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-slate-850 to-slate-650 bg-clip-text text-slate-950 mb-2 tracking-tight font-display">
              Yashoda Enterprise
            </h1>
            <p className="text-slate-500 mb-6 text-sm font-medium">
              Intelligent Payroll Management System
            </p>
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6" />
            <button
              onClick={login}
              id="login-admin-btn"
              className="group w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-850 bg-slate-950 hover:bg-slate-900 cursor-pointer text-white px-6 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Sign in as Payroll Administrator</span>
              <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
            </button>
            <p className="text-[11px] text-slate-400 mt-6 font-medium">
              Secure access • Real-time payroll sync
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-gradient-to-br from-slate-50 via-white to-slate-100/50 relative overflow-x-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
      
      {/* Header with advanced glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Enhanced Logo with gradient */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-md shadow-slate-900/20">
                <span className="text-white font-black text-lg">Y</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent font-display">
                  Yashoda Payroll
                </span>
                <span className="text-[10px] font-semibold text-slate-400 -mt-0.5">Hi-Fi Edition</span>
              </div>
            </div>

            {/* Desktop Navigation - Premium styling */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
              <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
              <NavLink to="/salary" icon={FileText}>Run Payroll</NavLink>
              <NavLink to="/employees" icon={Users}>Directory</NavLink>
              <NavLink to="/leave" icon={CalendarDays}>Leave Balance</NavLink>
              <NavLink to="/pay" icon={IndianRupee}>Pay Details</NavLink>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="group flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-705 text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-700 transition-colors" />
                <span>{isFullScreen ? "Standard Width" : "Full Screen"}</span>
              </button>

              <button 
                onClick={() => setSettingsOpen(true)} 
                className="group flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-705 text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500 group-hover:rotate-90 transition-transform duration-300" />
                <span>Connection</span>
              </button>

              <button 
                onClick={logout} 
                className="group flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50  rounded-xl transition-all duration-200 hover:shadow-md cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={() => setIsFullScreen(!isFullScreen)} 
                className="p-2 text-slate-600 bg-white border border-slate-200 rounded-xl transition-all hover:shadow-md cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
              </button>
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
              
              <div className="pt-5 mt-3 border-t border-slate-100 flex flex-col gap-2">
                <button 
                  onClick={() => { setMenuOpen(false); setSettingsOpen(true); }} 
                  className="flex items-center justify-center gap-2.5 px-4 py-3 w-full text-sm font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <Settings className="w-5 h-5 text-slate-500" /> Sheet Connection
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-white/55 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-white px-6 py-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-xl">
                    <Settings className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight font-display">Sheet Connection</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Configure Google Sheets integration</p>
                  </div>
                </div>
                <button onClick={() => setSettingsOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-605 text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  Google Sheet ID <HelpCircle className="w-3" />
                </label>
                <input 
                  type="text" 
                  value={tempSheetId} 
                  onChange={(e) => setTempSheetId(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-205 border-slate-200 focus:border-slate-400 rounded-xl text-sm font-mono text-slate-700 bg-slate-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="1IoGYxMMOrVzkHyqp1n2InXgf14jLJUEfKZMX5MWVBj4"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-605 text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  Apps Script URL <HelpCircle className="w-3" />
                </label>
                <input 
                  type="text" 
                  value={tempAppsScriptUrl} 
                  onChange={(e) => setTempAppsScriptUrl(e.target.value)} 
                  className="w-full px-4 py-2.5 border border-slate-205 border-slate-200 focus:border-slate-400 rounded-xl text-sm font-mono text-slate-700 bg-slate-50/50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="https://script.google.com/macros/s/.../exec"
                />
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-white p-5 rounded-xl border border-slate-100 shadow-inner">
                <p className="text-xs font-extrabold text-slate-700 mb-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  Setup Requirements
                </p>
                <ul className="space-y-2 text-[11px] text-slate-600 font-medium leading-relaxed list-disc pl-4">
                  <li>Share Google Sheet with <span className="font-bold text-slate-800">"Anyone with the link"</span></li>
                  <li>Set permission level to <span className="font-bold text-slate-800">Viewer</span> for CORS compatibility</li>
                  <li>Deploy Apps Script as Web App with <span className="font-bold text-slate-800">"Execute as Me"</span></li>
                  <li>Copy the deployment URL into the field above</li>
                </ul>
              </div>
            </div>

            <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                onClick={() => setSettingsOpen(false)}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-all hover:shadow-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings}
                className="px-5 py-2.5 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-900 hover:to-slate-800 text-white text-xs font-bold rounded-xl shadow-md shadow-slate-900/10 transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" /> Save Connection
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
            <Route path="/pay" element={<PayDetails />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
