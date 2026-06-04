import React, { useState, useEffect } from "react";
import { Users, DollarSign, Calendar, TrendingUp, Loader2, CheckCircle, BarChart3, ArrowUpRight, Percent, Layers } from "lucide-react";
import { fetchDashboardSummary, fetchEmployeeDetails, DashboardSummaryRow, EmployeeRow } from "../lib/googleSheetsService";
import { useTheme } from "../lib/ThemeContext";

export default function Dashboard() {
  const { theme } = useTheme();
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
      setError("Unable to sync dashboard analytics with Google Sheets. Please confirm sheet permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeEmployees = employees.filter(e => e.presentStatus === "ACTIVE");
  const regularCount = activeEmployees.filter(e => e.salaryType === "REGULAR").length;
  const consolidatedCount = activeEmployees.filter(e => e.salaryType === "CONSOLIDATED" || e.salaryType === "COSOLIDATED").length;

  const totalRegularGross = activeEmployees
    .filter(e => e.salaryType === "REGULAR")
    .reduce((sum, e) => sum + e.grossSalary, 0);

  const totalConsolidatedGross = activeEmployees
    .filter(e => e.salaryType === "CONSOLIDATED" || e.salaryType === "COSOLIDATED")
    .reduce((sum, e) => sum + e.grossSalary, 0);

  const totalMonthlyGrossSum = totalRegularGross + totalConsolidatedGross;

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { 
      style: 'currency', 
      currency: 'INR', 
      maximumFractionDigits: 0 
    }).format(amt || 0);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Visual Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-display">Financial Analytics</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">Real-time enterprise statistics and ledger ratios synced live from your spreadsheet database.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-800 font-black uppercase tracking-wider">Live G-Sheets Connected</span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-white border border-slate-200/80 rounded-[32px] shadow-premium">
          <Loader2 className={`w-8 h-8 ${theme.accentText} animate-spin mb-4`} />
          <p className="text-slate-950 font-black text-sm tracking-tight">Syncing Active Spreadsheet Records...</p>
          <p className="text-slate-400 text-xs mt-1">Downloading master payroll rows and balance data</p>
        </div>
      ) : (
        <>
          {/* Bento-Grid Stats Widgets with World's Best SaaS Styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 - Aggregate Payroll Container */}
            <div className={`bg-white p-6 rounded-[24px] border border-slate-200 ${theme.accentBorderCard} transition-all duration-300 shadow-premium hover:shadow-premium-hover relative overflow-hidden group`}>
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: theme.colorHex }}></div>
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                  <DollarSign className={`w-5 h-5 ${theme.accentText}`} />
                </div>
                <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md border border-slate-200/50">AGGREGATE MONTHLY</span>
              </div>
              <div className="mt-5">
                <span className="text-xs text-slate-400 font-semibold block">Combined Gross Wages</span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-1 font-display">{formatCurrency(totalMonthlyGrossSum)}</span>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Roster Count ({activeEmployees.length} personnel)
                </span>
                <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md font-black uppercase tracking-wider">100% Workable</span>
              </div>
            </div>

            {/* Card 2 - Regular Staff */}
            <div className={`bg-white p-6 rounded-[24px] border border-slate-200 ${theme.accentBorderCard} transition-all duration-300 shadow-premium hover:shadow-premium-hover relative overflow-hidden group`}>
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: theme.colorHex }}></div>
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                  <Users className={`w-5 h-5 ${theme.accentText}`} />
                </div>
                <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md border border-slate-200/50">REGULAR STAFF</span>
              </div>
              <div className="mt-5">
                <span className="text-xs text-slate-400 font-semibold block">Standard Component CTC</span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-1 font-display">{formatCurrency(totalRegularGross)}</span>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold">
                  {regularCount} Salary Records Mapped
                </span>
                <span className={`text-[10px] font-extrabold font-mono px-2.5 py-0.5 rounded-md ${theme.primaryBadge}`}>
                  {totalMonthlyGrossSum > 0 ? ((totalRegularGross / totalMonthlyGrossSum) * 100).toFixed(0) : 0}% of budget
                </span>
              </div>
            </div>

            {/* Card 3 - Consolidated Staff */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-200 hover:border-emerald-250 transition-all duration-300 shadow-premium hover:shadow-premium-hover relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-800 via-emerald-600 to-emerald-400"></div>
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                  <Calendar className="w-5 h-5 text-emerald-650" />
                </div>
                <span className="text-[9px] bg-slate-100 text-slate-600 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-md border border-slate-200/50">CONSOLIDATED STAFF</span>
              </div>
              <div className="mt-5">
                <span className="text-xs text-slate-400 font-semibold block">Contract Consolidated CTC</span>
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-1 font-display">{formatCurrency(totalConsolidatedGross)}</span>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-semibold">
                  {consolidatedCount} Caretakers / Contractees
                </span>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md font-extrabold font-mono">
                  {totalMonthlyGrossSum > 0 ? ((totalConsolidatedGross / totalMonthlyGrossSum) * 100).toFixed(0) : 0}% of budget
                </span>
              </div>
            </div>

          </div>

          {/* Interactive Chart Component & Calculation logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            
            {/* Split 1: Calculation Run History */}
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-slate-200/80 shadow-premium overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-950 font-display">Calculation Run History</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Official database entries posted in "dashboard_summary"</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider block">
                  Sheet Synced
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 bg-slate-50/20">
                      <th className="py-3.5 px-5">Payroll Period</th>
                      <th className="py-3.5 px-4 text-right">Aggregate Remuneration</th>
                      <th className="py-3.5 px-4 text-right">Regular Total</th>
                      <th className="py-3.5 px-4 text-right">Consolidated Total</th>
                      <th className="py-3.5 px-4 text-center">Status Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
                    {summaryRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-slate-400 font-bold bg-slate-50/5 text-xs">No calculated records posted inside dashboard_summary sheet.</td>
                      </tr>
                    ) : (
                      summaryRows.map((d, index) => (
                        <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-5 font-black text-slate-950 font-display text-sm tracking-tight">{d.month} {d.year}</td>
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-extrabold text-slate-950 bg-slate-100 border border-slate-205 border-slate-200/50 px-2.5 py-1 rounded-lg font-mono text-[11px]">
                              {formatCurrency(d.totalPaid)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-500 font-mono text-[11px]">{formatCurrency(d.regularTotal)}</td>
                          <td className="py-3.5 px-4 text-right font-extrabold text-slate-500 font-mono text-[11px]">{formatCurrency(d.consolidatedTotal)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[9px] font-extrabold uppercase tracking-wider rounded-md">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> {d.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Split 2: Visual Budget Proportion Chart */}
            <div className="lg:col-span-1 bg-white rounded-[24px] border border-slate-200/80 shadow-premium p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-black text-slate-950 font-display flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-700" />
                  Budget Distribution
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 font-semibold">Budget ratio allocated by staff designation type.</p>
              </div>

              {totalMonthlyGrossSum === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">
                  No active wages configured to render budget proportion charts.
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between py-2">
                  {/* Custom Graphical Bar Visualizer */}
                  <div className="space-y-4">
                    
                    {/* Regular Block */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-slate-800">Regular Payroll CTC</span>
                        <span className={`font-black ${theme.accentText}`}>
                          {((totalRegularGross / totalMonthlyGrossSum) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full rounded-lg transition-all duration-300" 
                          style={{ width: `${(totalRegularGross / totalMonthlyGrossSum) * 100}%`, backgroundColor: theme.colorHex }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                        <span>{regularCount} employees</span>
                        <span>{formatCurrency(totalRegularGross)}</span>
                      </div>
                    </div>

                    {/* Consolidated Block */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold">
                        <span className="text-slate-800">Consolidated Staff CTC</span>
                        <span className="text-slate-950 font-black">
                          {((totalConsolidatedGross / totalMonthlyGrossSum) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-slate-450 bg-slate-400 rounded-lg transition-all duration-300" 
                          style={{ width: `${(totalConsolidatedGross / totalMonthlyGrossSum) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-extrabold">
                        <span>{consolidatedCount} contract staff</span>
                        <span>{formatCurrency(totalConsolidatedGross)}</span>
                      </div>
                    </div>

                  </div>

                  {/* High level insight */}
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-[11px] text-slate-600 leading-relaxed font-medium mt-4">
                    <p className="font-extrabold text-slate-955 flex items-center gap-1">
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                      Roster Distribution Tip:
                    </p>
                    <p className="mt-1 text-slate-500">
                      Regular payroll represents the dominant section ({((totalRegularGross / totalMonthlyGrossSum) * 100).toFixed(0)}%). Keep 'leave_balance' up to date to properly simulate active cycles.
                    </p>
                  </div>

                </div>
              )}

            </div>

          </div>
        </>
      )}

    </div>
  );
}
