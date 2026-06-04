import { useState, useEffect } from "react";
import { useAuth } from "../lib/AuthContext";
import { fetchEmployeeDetails, EmployeeRow } from "../lib/googleSheetsService";
import { FileDown, RefreshCw, AlertCircle, IndianRupee } from "lucide-react";

export default function PayDetails() {
  const { accessToken } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (accessToken && accessToken !== 'mock_google_sheets_token') {
        const data = await fetchEmployeeDetails(accessToken);
        setEmployees(data);
      } else {
        // Mock data to demonstrate the UI when no real token is present
        // since the user didn't fully complete OAuth or we are using mock login.
        setTimeout(() => {
          setEmployees([
            { serialNumber: "1", empCode: "EM101", name: "John Doe", salaryType: "REGULAR", department: "Engineering", designation: "Senior Developer", presentStatus: "ACTIVE", doj: "01/01/2023", basic: 40000, hra: 16000, conv: 3200, grossSalary: 59200, pf: 1800, esi: 0, medi: 1000, pl: 0, lta: 2000, bonus: 0, gratuity: 1000, ctcPerMonth: 65000 },
            { serialNumber: "2", empCode: "EM102", name: "Jane Smith", salaryType: "REGULAR", department: "Design", designation: "UX Designer", presentStatus: "ACTIVE", doj: "15/03/2023", basic: 35000, hra: 14000, conv: 3200, grossSalary: 52200, pf: 1800, esi: 0, medi: 1000, pl: 0, lta: 2000, bonus: 0, gratuity: 1000, ctcPerMonth: 58000 },
            { serialNumber: "3", empCode: "EM103", name: "Mike Johnson", salaryType: "CONSOLIDATED", department: "Marketing", designation: "Content Strategist", presentStatus: "ACTIVE", doj: "10/06/2024", basic: 0, hra: 0, conv: 0, grossSalary: 45000, pf: 0, esi: 0, medi: 0, pl: 0, lta: 0, bonus: 0, gratuity: 0, ctcPerMonth: 45000 },
          ]);
          setLoading(false);
        }, 800);
        return;
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch data.");
    } finally {
      if (accessToken && accessToken !== 'mock_google_sheets_token') {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Pay Details Master</h1>
          <p className="text-white/80 text-lg mt-2 font-semibold">Comprehensive breakdown of all employee salaries and deductions.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadData} className="h-14 px-6 bg-white/20 text-white text-base font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/30 transition-all backdrop-blur-md shadow-lg border border-white/10 active:scale-95">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-500/20 backdrop-blur-md border border-red-500/50 text-white p-6 rounded-3xl flex gap-4 items-start shadow-xl">
          <AlertCircle className="w-8 h-8 text-red-200 mt-1 shrink-0" />
          <div>
            <h3 className="font-bold text-xl mb-2">Error Loading Data</h3>
            <p className="text-red-100 text-lg opacity-90">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-xl">
          <RefreshCw className="w-12 h-12 text-white animate-spin opacity-80 mb-4" />
          <p className="text-white font-bold text-xl drop-shadow-sm">Syncing with Google Sheets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {employees.map((emp) => (
            <div key={emp.empCode} className="bg-white/95 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-[0_16px_40px_-12px_rgba(0,0,0,0.3)] border border-white/30 transform transition-all hover:scale-[1.01] hover:shadow-[0_24px_50px_-12px_rgba(0,0,0,0.4)]">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 flex justify-between items-start">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-white font-bold text-2xl border border-white/20 shadow-inner">
                    {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h2 className="font-extrabold text-2xl text-white tracking-tight">{emp.name}</h2>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="font-mono text-sm font-bold text-slate-300 bg-black/30 px-2 py-1 rounded-lg">{emp.empCode}</span>
                       <span className="text-sm font-semibold text-slate-400">{emp.designation}</span>
                    </div>
                  </div>
                </div>
                <span className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold tracking-widest uppercase shadow-sm ${emp.salaryType === 'REGULAR' ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30' : 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/30'}`}>
                  {emp.salaryType}
                </span>
              </div>
              
              {/* Card Body - Financials Layout */}
              <div className="p-8">
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {/* Earnings Group */}
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Gross Earnings</h4>
                    <div className="space-y-4">
                      {emp.salaryType === 'REGULAR' ? (
                        <>
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                            <span className="text-slate-600 font-bold text-sm">Basic</span>
                            <span className="font-mono font-bold text-slate-900 text-base">{formatCurrency(emp.basic)}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                            <span className="text-slate-600 font-bold text-sm">HRA</span>
                            <span className="font-mono font-bold text-slate-900 text-base">{formatCurrency(emp.hra)}</span>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                            <span className="text-slate-600 font-bold text-sm">Conveyance</span>
                            <span className="font-mono font-bold text-slate-900 text-base">{formatCurrency(emp.conv)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl">
                          <IndianRupee className="w-5 h-5 text-slate-400" />
                          <span className="text-slate-600 font-bold text-sm">Consolidated Pay Structure</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deductions Group */}
                  <div>
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-4">Deductions (Est)</h4>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center bg-rose-50/50 p-3 rounded-xl">
                         <span className="text-slate-600 font-bold text-sm">PF</span>
                         <span className="font-mono font-bold text-rose-700 text-base">{formatCurrency(emp.pf)}</span>
                       </div>
                       <div className="flex justify-between items-center bg-rose-50/50 p-3 rounded-xl">
                         <span className="text-slate-600 font-bold text-sm">ESI</span>
                         <span className="font-mono font-bold text-rose-700 text-base">{formatCurrency(emp.esi)}</span>
                       </div>
                       <div className="flex justify-between items-center bg-rose-50/50 p-3 rounded-xl">
                         <span className="text-slate-600 font-bold text-sm">Mediclaim</span>
                         <span className="font-mono font-bold text-rose-700 text-base">{formatCurrency(emp.medi)}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer Totals */}
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">Gross Salary</div>
                    <div className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(emp.grossSalary)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total CTC/Mo</div>
                    <div className="text-3xl font-black text-indigo-700 mt-1">{formatCurrency(emp.ctcPerMonth)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
