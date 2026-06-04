import { useState, useEffect } from "react";
import { Info, RefreshCw, Loader2, AlertCircle, Search, Calculator, Check, Calendar, ArrowRight, UserCheck } from "lucide-react";
import { fetchLeaveBalances, LeaveBalanceRow } from "../lib/googleSheetsService";

export default function LeaveBalance() {
  const [balances, setBalances] = useState<LeaveBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Choose month/year filter
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");

  // Calculator State
  const [calcEmpCode, setCalcEmpCode] = useState("");
  const [calcPlToUse, setCalcPlToUse] = useState(0);
  const [calcSlToUse, setCalcSlToUse] = useState(0);
  const [includeAccrual, setIncludeAccrual] = useState(true);

  const loadBalances = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLeaveBalances();
      setBalances(data);
      
      // Auto default filters
      if (data.length > 0) {
        const months = data.map(b => b.month).filter(Boolean);
        if (months.length > 0) {
          setSelectedMonth(months[months.length - 1]);
          setSelectedYear(data[data.length - 1].year || "2026");
        }
        
        // Default calculator to first employee in list
        setCalcEmpCode(data[0].empCode);
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

  // Filter lists
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

  // Extract unique employees currently in leave registry
  const employeesMap = new Map<string, string>();
  balances.forEach(b => {
    if (b.empCode && b.name) {
      employeesMap.set(b.empCode, b.name);
    }
  });
  const uniqueEmployees = Array.from(employeesMap.entries()).map(([code, name]) => ({
    empCode: code,
    name: name
  }));

  // Fetch the latest closing balances for the selected employee in the calculator
  const getLatestEmployeeState = (code: string) => {
    const empRecords = balances.filter(b => b.empCode === code);
    if (empRecords.length === 0) return { pl: 0, sl: 0, month: "N/A", year: "" };
    // Get newest entry by looking at the last item
    const latest = empRecords[empRecords.length - 1];
    return {
      pl: latest.closingPL,
      sl: latest.closingSL,
      month: latest.month,
      year: latest.year
    };
  };

  const selectedLatest = getLatestEmployeeState(calcEmpCode);

  // Compute live calculations
  const projectedPL = Number((selectedLatest.pl - calcPlToUse + (includeAccrual ? 2.50 : 0)).toFixed(2));
  const projectedSL = Number((selectedLatest.sl - calcSlToUse + (includeAccrual ? 1.25 : 0)).toFixed(2));

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">Leave Accruals & Calculator</h1>
          <p className="text-white/80 text-sm mt-1.5 font-medium">Verify historical accrual balances and use our responsive calculator panel to size up leave bookings.</p>
        </div>
        <button 
          onClick={loadBalances}
          disabled={loading}
          className="px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/10 rounded-xl transition-all shadow-inner active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Sync Leave Balances
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-[2rem] flex gap-4 items-start shadow-sm">
          <AlertCircle className="w-6 h-6 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-1">Ledger Sync Error</h3>
            <p className="text-rose-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        
        {/* Left Side: Leaves Accruals Ledger */}
        <div className="xl:col-span-3 bg-white rounded-[32px] border border-slate-200/80 shadow-[0_12px_44px_-16px_rgba(40,20,90,0.08)] overflow-hidden flex flex-col min-w-0">
          
          <div className="p-7 border-b border-slate-100 bg-slate-50/70 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 text-slate-900 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <Info className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-sm text-slate-600 leading-relaxed font-semibold">
                <p className="font-extrabold text-slate-950 text-base">Standard Accrual Rules</p>
                <p className="text-slate-500 font-medium text-xs mt-0.5">AutoPay applies <strong className="text-indigo-600 font-bold bg-indigo-50/60 px-1.5 py-0.5 rounded border border-indigo-100/50">+2.50 PL</strong> and <strong className="text-indigo-600 font-bold bg-indigo-50/60 px-1.5 py-0.5 rounded border border-indigo-100/50">+1.25 SL</strong> increments every active processing cycle to update each staff closing ledger.</p>
              </div>
            </div>
          </div>

          {/* Search bar & filter selection */}
          <div className="p-6 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white/50">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search staff leave record..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-indigo-400 rounded-2xl text-sm outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-50 text-slate-950 font-semibold"
              />
            </div>
            <div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-50"
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
                className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl outline-none transition-all shadow-sm focus:ring-4 focus:ring-indigo-50"
              >
                <option value="ALL">All Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 bg-slate-50/20 gap-2">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                <p className="text-slate-500 font-bold">Reading Leave Sheet Ledger ...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-55 bg-slate-100/30 text-[10px] uppercase font-black tracking-wider">
                    <th className="py-3 px-6">Employee</th>
                    <th className="py-3 px-4 text-center">Cycle Month</th>
                    <th className="py-3 px-4 text-center">Prev Open PL</th>
                    <th className="py-3 px-4 text-center">Prev Open SL</th>
                    <th className="py-3 px-4 text-center text-emerald-800 bg-emerald-50/20">Monthly PL Credited</th>
                    <th className="py-3 px-4 text-center text-emerald-800 bg-emerald-50/20">Monthly SL Credited</th>
                    <th className="py-3 px-4 text-center text-rose-800 bg-rose-50/30">Used PL</th>
                    <th className="py-3 px-4 text-center text-rose-800 bg-rose-50/30 border-r border-slate-100">Used SL</th>
                    <th className="py-3 px-4 text-center text-indigo-900 bg-indigo-50/20 font-extrabold">Closing PL Balance</th>
                    <th className="py-3 px-6 text-center text-indigo-900 bg-indigo-50/20 font-extrabold">Closing SL Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-800">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400 font-medium bg-slate-50/5">No leave balances found for current criteria. Please sync data folder or change criteria.</td>
                    </tr>
                  ) : (
                    filteredBalances.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-extrabold text-slate-950 text-sm leading-tight">{row.name}</div>
                          <div className="font-mono text-[10px] text-slate-500 mt-1 bg-slate-100 rounded px-1.5 py-0.5 inline-block">{row.empCode}</div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-700">
                          {row.month} {row.year}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-500">
                          {row.openingPL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center font-semibold text-slate-500">
                          {row.openingSL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center text-emerald-700 font-bold bg-emerald-50/20">
                          + {row.creditedPL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center text-emerald-700 font-bold bg-emerald-50/20">
                          + {row.creditedSL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center text-rose-700 font-bold bg-rose-50/15">
                          - {row.usedPL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center text-rose-700 font-bold bg-rose-50/15 border-r border-slate-150">
                          - {row.usedSL.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-center bg-indigo-50/5">
                          <div className="font-black text-slate-950 text-sm bg-indigo-50 px-2.5 py-1 rounded-xl inline-block border border-indigo-100/50">{row.closingPL.toFixed(2)}</div>
                        </td>
                        <td className="py-4 px-6 text-center bg-indigo-50/5">
                          <div className="font-black text-slate-950 text-sm bg-indigo-50 px-2.5 py-1 rounded-xl inline-block border border-indigo-100/50">{row.closingSL.toFixed(2)}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Leave Calculator */}
        <div className="xl:col-span-1 bg-[#0c1322] text-white rounded-[32px] p-7 border border-slate-800 shadow-xl flex flex-col gap-6 relative">
          
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Calculator className="w-32 h-32" />
          </div>

          <div className="relative z-10">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-1.5 text-white">
              <Calculator className="w-5.5 h-5.5 text-indigo-400" />
              Booking Calculator
            </h3>
            <p className="text-slate-400 text-xs mt-1 font-semibold">Simulate balance impacts and calculate future accrual projections.</p>
          </div>

          {balances.length === 0 ? (
            <div className="text-center rounded-2xl bg-slate-900/40 p-6 border border-slate-800 text-xs text-slate-500 font-medium">
              No staff records loaded to populate calculator dropdown.
            </div>
          ) : (
            <div className="flex flex-col gap-5 relative z-10 text-xs font-semibold">
              
              {/* Select Employee */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Select Staff</label>
                <select
                  value={calcEmpCode}
                  onChange={(e) => setCalcEmpCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 text-white font-bold p-3 outline-none focus:border-indigo-500 transition-all font-sans"
                >
                  {uniqueEmployees.map(emp => (
                    <option key={emp.empCode} value={emp.empCode}>
                      {emp.name} ({emp.empCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Current Balances */}
              <div className="grid grid-cols-2 gap-3 bg-slate-900/50 rounded-2xl p-4 border border-slate-800">
                <div className="text-center border-r border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block font-bold mb-0.5">CURRENT PL</span>
                  <span className="text-lg font-black text-white">{selectedLatest.pl.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 block mt-1">As of {selectedLatest.month}</span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 block font-bold mb-0.5">CURRENT SL</span>
                  <span className="text-lg font-black text-white">{selectedLatest.sl.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 block mt-1">As of {selectedLatest.month}</span>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">PL to Book (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={calcPlToUse}
                    onChange={(e) => setCalcPlToUse(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 text-white font-black p-3 text-center outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SL to Book (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={calcSlToUse}
                    onChange={(e) => setCalcSlToUse(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 text-white font-black p-3 text-center outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Accrual simulation settings */}
              <div className="flex items-center gap-3 py-2 border-y border-slate-800/60">
                <input
                  type="checkbox"
                  id="includeAccrual"
                  checked={includeAccrual}
                  onChange={(e) => setIncludeAccrual(e.target.checked)}
                  className="w-4.5 h-4.5 rounded text-indigo-600 focus:ring-0 cursor-pointer accent-indigo-500 bg-slate-900 border-slate-800"
                />
                <label htmlFor="includeAccrual" className="text-[11px] text-slate-300 cursor-pointer font-bold select-none leading-tight">
                  Simulate Next Month Cycle Accrual? (+2.50 PL, +1.25 SL)
                </label>
              </div>

              {/* Projected Balances Display */}
              <div className="flex flex-col gap-3 py-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Projected New Balances</span>
                
                <div className="space-y-2">
                  
                  {/* Projected PL */}
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/15">
                    <span className="text-indigo-200">Privileged Leaves (PL):</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium font-mono text-[10px]">{selectedLatest.pl}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className={`font-black text-sm ${projectedPL < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {projectedPL.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Projected SL */}
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/15">
                    <span className="text-indigo-200">Sick Leaves (SL):</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium font-mono text-[10px]">{selectedLatest.sl}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className={`font-black text-sm ${projectedSL < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                        {projectedSL.toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Bounds check warnings */}
                {(projectedPL < 0 || projectedSL < 0) && (
                  <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-2xl mt-1 text-[11px] leading-relaxed">
                    <AlertCircle className="w-4.5 h-4.5 text-rose-400 mt-0.5 shrink-0" />
                    <span>Insufficient balance! Booking exceeds available limits. Deductions will result in negative balances.</span>
                  </div>
                )}
                
                {!(projectedPL < 0 || projectedSL < 0) && (calcPlToUse > 0 || calcSlToUse > 0) && (
                  <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-2xl mt-1 text-[11px] leading-relaxed">
                    <UserCheck className="w-4.5 h-4.5 text-emerald-400 mt-0.5 shrink-0" />
                    <span>Calculations approved! The employee has sufficient leave balances for this request.</span>
                  </div>
                )}

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
