import { useState, useEffect } from "react";
import { Info, RefreshCw, Loader2, AlertCircle, Search } from "lucide-react";
import { fetchLeaveBalances, LeaveBalanceRow } from "../lib/googleSheetsService";

export default function LeaveBalance() {
  const [balances, setBalances] = useState<LeaveBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Choose month/year filter
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");

  const loadBalances = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaveBalances();
      setBalances(data);
      
      // Auto default to the most frequent month in the data if available
      if (data.length > 0) {
        const months = data.map(b => b.month).filter(Boolean);
        if (months.length > 0) {
          // Select latest or most common
          setSelectedMonth(months[months.length - 1]);
          setSelectedYear(data[data.length - 1].year || "2026");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to sync leave accrual balances.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalances();
  }, []);

  // Unique list of months & years in the ledger for dropdowns
  const availableMonths = Array.from(new Set(balances.map(b => b.month).filter(Boolean)));
  const availableYears = Array.from(new Set(balances.map(b => b.year).filter(Boolean)));

  const filteredBalances = balances.filter((b) => {
    const matchesSearch = 
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.empCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMonth = selectedMonth === "ALL" || b.month === selectedMonth;
    const matchesYear = selectedYear === "ALL" || b.year === selectedYear;

    return matchesSearch && matchesMonth && matchesYear;
  });

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Leave Accruals Ledger</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Synced in real-time with the 'leave_balance' Google Sheet ledger.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadBalances}
            disabled={loading}
            className="h-12 px-6 bg-slate-900 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Sync Balances
          </button>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-[2rem] flex gap-4 items-start shadow-sm">
          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-1">Ledger Sync Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col relative z-10">
          <div className="p-7 border-b border-slate-100 bg-slate-50/80 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 text-slate-900 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                <Info className="w-5 h-5" />
              </div>
              <div className="text-sm text-slate-600 leading-relaxed font-medium">
                <p className="font-bold text-slate-900 mb-0.5 text-base">Standard Calculation Process</p>
                <p>System automatically applies <strong className="text-slate-900 font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm ml-1">+2.50 PL</strong> and <strong className="text-slate-900 font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm">+1.25 SL</strong> increments per processing cycle, deriving current closing limits.</p>
              </div>
            </div>
          </div>

          {/* Search and filter controls */}
          <div className="p-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search staff leave record..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-slate-400 rounded-2xl text-sm outline-none transition-all shadow-sm focus:ring-4 focus:ring-slate-100 font-semibold text-slate-950"
              />
            </div>
            <div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl outline-none transition-all shadow-sm focus:ring-4 focus:ring-slate-100"
              >
                <option value="ALL">All Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl outline-none transition-all shadow-sm focus:ring-4 focus:ring-slate-100"
              >
                <option value="ALL">All Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-24">
              <Loader2 className="w-10 h-10 text-slate-900 animate-spin mb-4" />
              <p className="text-slate-500 font-bold text-base">Reading Leave Master...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto p-4">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-slate-400 bg-white">
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Employee</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">Cycle Month</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">Prev Open PL</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">Prev Open SL</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">Monthly Credited PL</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">Monthly Credited SL</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center bg-rose-50/50 text-rose-800">Used PL</th>
                    <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center bg-rose-50/50 text-rose-800 border-r border-slate-100">Used SL</th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-800 uppercase tracking-wider text-center">Closing PL Balance</th>
                    <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-center">Closing SL Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">No leave records loaded for the selected filters.</td>
                    </tr>
                  ) : (
                    filteredBalances.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 text-sm">{row.name}</div>
                          <div className="font-mono text-xs font-medium text-slate-500 mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{row.empCode}</div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-700 text-sm">
                          {row.month} {row.year}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-600">
                          {row.openingPL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-600">
                          {row.openingSL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center text-emerald-700 font-bold bg-emerald-50/30">
                          + {row.creditedPL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center text-emerald-700 font-bold bg-emerald-50/30">
                          + {row.creditedSL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center text-rose-700 font-semibold bg-rose-50/20">
                          - {row.usedPL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center text-rose-700 font-semibold bg-rose-50/20 border-r border-slate-100">
                          - {row.usedSL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="font-extrabold text-slate-900 text-base bg-indigo-50/50 inline-block px-3 py-1 rounded-xl border border-indigo-100/40">{row.closingPL.toFixed(2)}</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="font-extrabold text-slate-900 text-base bg-indigo-50/50 inline-block px-3 py-1 rounded-xl border border-indigo-100/40">{row.closingSL.toFixed(2)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
