import { useState, useEffect } from "react";
import { Users, DollarSign, Calendar, TrendingUp, Loader2, CheckCircle } from "lucide-react";
import { fetchDashboardSummary, fetchEmployeeDetails, DashboardSummaryRow, EmployeeRow } from "../lib/googleSheetsService";

export default function Dashboard() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [summaryRows, setSummaryRows] = useState<DashboardSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [empData, summaryData] = await Promise.all([
        fetchEmployeeDetails().catch(() => [] as EmployeeRow[]),
        fetchDashboardSummary().catch(() => [] as DashboardSummaryRow[])
      ]);
      setEmployees(empData);
      setSummaryRows(summaryData);
    } catch (err: any) {
      setError("Unable to sync dashboard with your Google Sheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute stats on the fly based on active employees master sheet
  const activeEmployees = employees.filter(e => e.presentStatus === "ACTIVE");
  const regularCount = activeEmployees.filter(e => e.salaryType === "REGULAR").length;
  const consolidatedCount = activeEmployees.filter(e => e.salaryType === "CONSOLIDATED" || e.salaryType === "COSOLIDATED").length;

  const totalRegularGross = activeEmployees
    .filter(e => e.salaryType === "REGULAR")
    .reduce((sum, e) => sum + e.grossSalary, 0);

  const totalConsolidatedGross = activeEmployees
    .filter(e => e.salaryType === "CONSOLIDATED" || e.salaryType === "COSOLIDATED")
    .reduce((sum, e) => sum + e.grossSalary, 0);

  const totalHeadcount = activeEmployees.length;

  // Render Currency helper
  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium font-semibold">Synced live with sheet parameters.</p>
        </div>
        <button 
          onClick={loadData}
          disabled={loading}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all inline-flex items-center gap-2 border border-slate-200"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Refresh Metrics
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
          <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
          <p className="text-slate-500 font-bold text-lg">Syncing Live Sheet Analytics...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mb-6 shadow-md shadow-slate-900/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="text-sm text-slate-500 font-bold mb-1 uppercase tracking-wide">Aggregate Gross Monthly Rate</div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalRegularGross + totalConsolidatedGross)}</div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-4 bg-emerald-50 w-max px-3 py-1.5 rounded-lg border border-emerald-100">
                <TrendingUp className="w-4 h-4" /> Real-time active ledger
              </div>
            </div>
            
            <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-6">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-sm text-slate-500 font-bold mb-1 uppercase tracking-wide">Regular Personnel Wages</div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalRegularGross)}</div>
              <div className="text-xs font-bold text-indigo-800 mt-4 bg-indigo-50/50 w-max px-3 py-1.5 rounded-lg border border-indigo-100/50">
                {regularCount} Active Staff
              </div>
            </div>

            <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-1 duration-300">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="text-sm text-slate-500 font-bold mb-1 uppercase tracking-wide">Consolidated Personnel Wages</div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{formatCurrency(totalConsolidatedGross)}</div>
              <div className="text-xs font-bold text-violet-800 mt-4 bg-violet-50/50 w-max px-3 py-1.5 rounded-lg border border-violet-100/50">
                {consolidatedCount} Contract / Caretakers
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col mt-4">
            <div className="p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Calculation Run History
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Logs posted to 'dashboard_summary' on payroll execution.</p>
              </div>
            </div>
            
            <div className="overflow-x-auto p-4">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-slate-400">
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Payroll Period</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Aggregate Disbursed</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Regular Base Total</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Consolidated Base Total</th>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {summaryRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No processed payroll logs logged in Sheet yet. run calculations to generate records.</td>
                    </tr>
                  ) : (
                    summaryRows.map((d, index) => {
                      return (
                        <tr key={index} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-5 px-6">
                            <div className="font-bold text-slate-900 text-sm">{d.month} {d.year}</div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="font-bold text-indigo-900 bg-indigo-50 inline-block px-3 py-1 rounded-lg text-sm border border-indigo-100">{formatCurrency(d.totalPaid)}</div>
                          </td>
                          <td className="py-5 px-6 font-semibold text-slate-600 text-sm">
                            {formatCurrency(d.regularTotal)}
                          </td>
                          <td className="py-5 px-6 font-semibold text-slate-600 text-sm">
                            {formatCurrency(d.consolidatedTotal)}
                          </td>
                          <td className="py-5 px-6">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                              <CheckCircle className="w-3.5 h-3.5" /> {d.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
