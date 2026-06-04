import React, { useState } from "react";
import { Routes, Route, Link, useLocation, HashRouter } from "react-router-dom";
import { useAuth, AuthProvider } from "./lib/AuthContext";
import { Menu, LogOut, FileText, Users, CalendarDays, LayoutDashboard, Calculator, IndianRupee } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import EnterSalary from "./pages/EnterSalary";
import ManageEmployees from "./pages/ManageEmployees";
import LeaveBalance from "./pages/LeaveBalance";
import PayDetails from "./pages/PayDetails";

const NavLink = ({ to, children, icon: Icon, mobile }: { to: string, children: React.ReactNode, icon?: any, mobile?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm transition-all duration-200 ${
        isActive 
          ? "bg-white/20 text-white font-bold shadow-sm backdrop-blur-md" 
          : "text-white/80 hover:bg-white/10 hover:text-white font-semibold"
      } ${mobile ? 'w-full mb-1 py-3 text-base' : ''}`}
    >
      {Icon && <Icon className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-80'}`} />}
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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-500 bg-fixed">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-xl border border-white/20 p-10 rounded-[32px] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] text-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-violet-600 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-6 shadow-lg shadow-fuchsia-900/20">
            <Calculator className="w-8 h-8"/>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Yashoda Payroll</h1>
          <p className="text-slate-500 mb-10 text-sm leading-relaxed">
            Professional payroll management and payslip automation.
          </p>
          <button
            onClick={login}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-6 py-4 rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] hover:shadow-lg hover:shadow-fuchsia-900/20 transition-all duration-300 active:scale-[0.98]"
          >
            Sign in as Administrator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans text-slate-900 selection:bg-white/30 flex flex-col bg-gradient-to-br from-violet-500 via-purple-500 to-orange-400 bg-fixed overflow-x-hidden">
      {/* Top Navigation */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-white drop-shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-lg shadow-inner border border-white/20">
                Y
              </div>
              Yashoda Payroll
            </div>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-2">
              <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
              <NavLink to="/salary" icon={FileText}>Run Payroll</NavLink>
              <NavLink to="/employees" icon={Users}>Directory</NavLink>
              <NavLink to="/leave" icon={CalendarDays}>Leave Balance</NavLink>
              <NavLink to="/pay" icon={IndianRupee}>Pay Details</NavLink>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button onClick={logout} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-all backdrop-blur-sm shadow-sm hover:shadow">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-transparent hover:border-white/10"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/10 backdrop-blur-xl">
            <div className="px-4 pt-3 pb-5 space-y-2">
              <NavLink to="/" icon={LayoutDashboard} mobile>Dashboard</NavLink>
              <NavLink to="/salary" icon={FileText} mobile>Run Payroll</NavLink>
              <NavLink to="/employees" icon={Users} mobile>Directory</NavLink>
              <NavLink to="/leave" icon={CalendarDays} mobile>Leave Balance</NavLink>
              <NavLink to="/pay" icon={IndianRupee} mobile>Pay Details</NavLink>
              <div className="pt-4 mt-4 border-t border-white/10">
                <button onClick={logout} className="flex items-center justify-center gap-2 px-4 py-3 w-full text-base font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/10">
                  <LogOut className="w-5 h-5" /> Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-8 pb-20">
        <div className="max-w-7xl mx-auto">
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
