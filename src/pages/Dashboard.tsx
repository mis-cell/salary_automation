import React, { useState, useEffect } from "react";
import { Users, DollarSign, Calendar, TrendingUp, Loader2, CheckCircle, BarChart3, ArrowUpRight, Percent, Layers } from "lucide-react";
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">Real-time stats and ledger ratios synced live from your configured spreadsheet tables.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 bg-white border border-slate-200 rounded-[24px] shadow-xs">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-3" />
          <p className="text-slate-500 font-bold text-xs">Syncing Active Spreadsheet Records...</p>
        </div>
      ) : (
        <>
          {/* Bento-Grid Stats Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-250 hover:border-slate-350 transition-all shadow-xs relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">AGGREGATE MONTHLY</span>
              </div>
              <div className="mt-5">
                <span className="text-[11px] text-slate-400 font-extrabold block">Combined Gross Wages</span>
                <span className="text-2xl font-black text-slate-950 tracking-tight block mt-0.5">{formatCurrency(totalMonthlyGrossSum)}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  Active Roster Count ({activeEmployees.length} personnel)
                </span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-black">100% Workable</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-250 hover:border-slate-350 transition-all shadow-xs relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shadow-xs">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">REGULAR STAFF</span>
              </div>
              <div className="mt-5">
                <span className="text-[11px] text-slate-400 font-extrabold block">Standard Component CTC</span>
                <span className="text-2xl font-black text-slate-950 tracking-tight block mt-0.5">{formatCurrency(totalRegularGross)}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">
                  {regularCount} Salary Records Mapped
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold">
                  {totalMonthlyGrossSum > 0 ? ((totalRegularGross / totalMonthlyGrossSum) * 100).toFixed(0) : 0}% of budget
                </span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-6 rounded-[24px] border border-slate-250 hover:border-slate-350 transition-all shadow-xs relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">CONSOLIDATED STAFF</span>
              </div>
              <div className="mt-5">
                <span className="text-[11px] text-slate-400 font-extrabold block">Contract Consolidated CTC</span>
                <span className="text-2xl font-black text-slate-950 tracking-tight block mt-0.5">{formatCurrency(totalConsolidatedGross)}</span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold">
                  {consolidatedCount} Caretakers / Contractees
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold">
                  {totalMonthlyGrossSum > 0 ? ((totalConsolidatedGross / totalMonthlyGrossSum) * 100).toFixed(0) : 0}% of budget
                </span>
              </div>
            </div>

          </div>

          {/* Interactive Chart Component & Calculation logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">
            
            {/* Split 1: Calculation Run History */}
            <div className="lg:col-span-2 bg-white rounded-[24px] border border-slate-250 shadow-xs overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-150 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-950">Calculation Run History</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Official database entries posted in "dashboard_summary"</p>
                </div>
                <div className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold text-slate-600 block">
                  Sheet Sync Complete
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 bg-slate-50/30">
                      <th className="py-3 px-5">Payroll Period</th>
                      <th className="py-3 px-4 text-right">Aggregate Remuneration</th>
                      <th className="py-3 px-4 text-right">Regular Total</th>
                      <th className="py-3 px-4 text-right">Consolidated Total</th>
                      <th className="py-3 px-4 text-center">Status Label</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-semibold text-slate-700">
                    {summaryRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 font-bold">No calculated records posted inside dashboard_summary sheet.</td>
                      </tr>
                    ) : (
                      summaryRows.map((d, index) => (
                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-5 font-bold text-slate-900">{d.month} {d.year}</td>
                          <td className="py-4 px-4 text-right">
                            <span className="font-extrabold text-slate-950 bg-slate-100 border border-slate-200/50 px-2 py-1 rounded">
                              {formatCurrency(d.totalPaid)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right font-medium text-slate-505">{formatCurrency(d.regularTotal)}</td>
                          <td className="py-4 px-4 text-right font-medium text-slate-505">{formatCurrency(d.consolidatedTotal)}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-extrabold rounded">
                              <CheckCircle className="w-3 h-3 shrink-0" /> {d.status}
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
            <div className="lg:col-span-1 bg-white rounded-[24px] border border-slate-250 shadow-xs p-6 flex flex-col gap-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5">
                  <BarChart3 className="w-4.5 h-4.5 text-slate-600" />
                  Budget Distribution
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Budget ratio allocated by staff designation type.</p>
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
                        <span className="text-slate-950 font-black">
                          {((totalRegularGross / totalMonthlyGrossSum) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-slate-900 rounded-lg transition-all duration-300" 
                          style={{ width: `${(totalRegularGross / totalMonthlyGrossSum) * 100}%` }}
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
