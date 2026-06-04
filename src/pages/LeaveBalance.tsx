import React, { useState, useEffect } from "react";
import { Info, RefreshCw, Loader2, AlertCircle, Search, Calculator, ArrowRight, UserCheck, CheckCircle } from "lucide-react";
import { fetchLeaveBalances, LeaveBalanceRow } from "../lib/googleSheetsService";

export default function LeaveBalance() {
  const [balances, setBalances] = useState<LeaveBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Month/Year filter
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">Leave Accruals & Booking Projections</h1>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">Verify historical leave closing states and simulate booking operations dynamically.</p>
        </div>
        <button 
          onClick={loadBalances}
          disabled={loading}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 rounded-xl transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          <span>Re-Sync Leave Ledger</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-[20px] flex gap-4 items-start shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm mb-1">Ledger Sync Error</h3>
            <p className="text-rose-700 text-xs leading-relaxed font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Leaves Accruals Ledger */}
        <div className="xl:col-span-3 bg-white rounded-[24px] border border-slate-250 shadow-xs overflow-hidden flex flex-col min-w-0">
          
          <div className="p-5 border-b border-slate-150 bg-slate-50/70 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-indigo-650 bg-indigo-50 border border-indigo-100 p-1.5 rounded-lg">
                <Info className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs text-slate-600 leading-relaxed font-semibold">
                <p className="font-extrabold text-slate-900">Standard Accrual Increments</p>
                <p className="text-slate-500 font-medium text-[11px] mt-0.5">Active billing pipelines automatically allocate <strong className="text-indigo-600 font-bold bg-indigo-55 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">+2.50 PL</strong> and <strong className="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">+1.25 SL</strong> units each cycle.</p>
              </div>
            </div>
          </div>

          {/* Search bar & filter selection */}
          <div className="p-5 border-b border-slate-150 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/50">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Find staff leave balance details..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-slate-455 focus:border-slate-350 rounded-xl text-xs outline-none transition-all shadow-xs text-slate-950 font-semibold"
              />
            </div>
            <div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl outline-none transition-all shadow-xs cursor-pointer"
              >
                <option value="ALL">All Cycle Months</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl outline-none transition-all shadow-xs cursor-pointer"
              >
                <option value="ALL">All Cycle Years</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50/10 gap-1">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                <p className="text-slate-555 text-slate-500 font-bold text-xs">Querying balance spreadsheets ...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
                <thead>
                  <tr className="border-b border-slate-205 text-slate-400 bg-slate-50/20 text-[10px] uppercase font-black tracking-wider">
                    <th className="py-2.5 px-5">Registered Employee</th>
                    <th className="py-2.5 px-4 text-center">Accrual Cycle</th>
                    <th className="py-2.5 px-4 text-center">Opening PL</th>
                    <th className="py-2.5 px-4 text-center">Opening SL</th>
                    <th className="py-2.5 px-4 text-center text-emerald-800 bg-emerald-50/20">PL Earned</th>
                    <th className="py-2.5 px-4 text-center text-emerald-800 bg-emerald-50/20">SL Earned</th>
                    <th className="py-2.5 px-4 text-center text-rose-800 bg-rose-50/20">Used PL</th>
                    <th className="py-2.5 px-4 text-center text-rose-800 bg-rose-50/20 border-r border-slate-200">Used SL</th>
                    <th className="py-2.5 px-4 text-center text-indigo-900 bg-indigo-50/10 font-bold">Closing PL</th>
                    <th className="py-2.5 px-5 text-center text-indigo-900 bg-indigo-50/10 font-bold">Closing SL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-slate-400 font-bold bg-slate-50/5">No balance logs matched. Run calculation pipeline or update spreadsheet ranges.</td>
                    </tr>
                  ) : (
                    filteredBalances.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-extrabold text-slate-950 text-sm leading-none">{row.name}</div>
                          <div className="font-mono text-[9px] text-slate-400 font-bold mt-1.5 inline-block bg-slate-100 rounded px-1.5 py-0.5">{row.empCode}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-650">
                          {row.month} {row.year}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500">
                          {row.openingPL.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500">
                          {row.openingSL.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-700 font-bold bg-emerald-50/10">
                          +{row.creditedPL.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-emerald-700 font-bold bg-emerald-50/10">
                          +{row.creditedSL.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-rose-700 font-bold bg-rose-55 bg-rose-50/5">
                          -{row.usedPL.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center text-rose-700 font-bold bg-rose-50/5 border-r border-slate-200">
                          -{row.usedSL.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center bg-indigo-50/5">
                          <span className="font-extrabold text-slate-950 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded">
                            {row.closingPL.toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center bg-indigo-50/5">
                          <span className="font-extrabold text-slate-950 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded">
                            {row.closingSL.toFixed(2)}
                          </span>
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
        <div className="xl:col-span-1 bg-white border border-slate-250 rounded-[24px] p-6 shadow-xs flex flex-col gap-5 relative overflow-hidden">
          
          <div>
            <h3 className="text-sm font-extrabold text-slate-950 flex items-center gap-1.5">
              <Calculator className="w-4.5 h-4.5 text-slate-700" />
              Booking Calculator
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Simulate balance transitions before launching calculation runs.</p>
          </div>

          {balances.length === 0 ? (
            <div className="text-center rounded-xl bg-slate-50 p-6 border border-slate-200 text-xs text-slate-400 font-bold">
              Dropdown parameters aren't ready as leave balances sheet had no entries.
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-xs font-semibold">
              
              {/* Select Employee */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Select Staff Personnel</label>
                <select
                  value={calcEmpCode}
                  onChange={(e) => setCalcEmpCode(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-205 border-slate-200 font-black p-2.5 outline-none focus:border-indigo-400 text-slate-800 cursor-pointer text-xs"
                >
                  {uniqueEmployees.map(emp => (
                    <option key={emp.empCode} value={emp.empCode}>
                      {emp.name} ({emp.empCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Display Current Balances */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-50/80 rounded-xl p-3 border border-slate-150">
                <div className="text-center border-r border-slate-200">
                  <span className="text-[9px] text-slate-400 block font-black uppercase">CURRENT PL</span>
                  <span className="text-sm font-black text-slate-955 text-slate-900 mt-0.5 block">{selectedLatest.pl.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">As of {selectedLatest.month}</span>
                </div>
                <div className="text-center">
                  <span className="text-[9px] text-slate-400 block font-black uppercase">CURRENT SL</span>
                  <span className="text-sm font-black text-slate-955 text-slate-900 mt-0.5 block">{selectedLatest.sl.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">As of {selectedLatest.month}</span>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">PL to Book</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={calcPlToUse}
                    onChange={(e) => setCalcPlToUse(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl bg-white border border-slate-200 text-slate-950 font-black p-2 text-center outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">SL to Book</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={calcSlToUse}
                    onChange={(e) => setCalcSlToUse(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl bg-white border border-slate-200 text-slate-950 font-black p-2 text-center outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Accrual simulation settings */}
              <div className="flex items-center gap-2 py-2 border-y border-slate-150">
                <input
                  type="checkbox"
                  id="includeAccrual"
                  checked={includeAccrual}
                  onChange={(e) => setIncludeAccrual(e.target.checked)}
                  className="w-4 h-4 rounded text-slate-900 focus:ring-0 cursor-pointer accent-slate-900 bg-white border-slate-300"
                />
                <label htmlFor="includeAccrual" className="text-[10px] text-slate-600 cursor-pointer font-extrabold select-none leading-none">
                  Simulate future monthly accruals?
                </label>
              </div>

              {/* Projected Balances Display */}
              <div className="flex flex-col gap-2 pt-1 font-semibold">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Projected Output States</span>
                
                <div className="space-y-2">
                  
                  {/* Projected PL */}
                  <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-slate-500 font-bold text-[11px]">Privileged leaves:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[10px] font-normal">{selectedLatest.pl}</span>
                      <ArrowRight className="w-3 h-3 text-slate-450" />
                      <span className={`font-black text-xs ${projectedPL < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        {projectedPL.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Projected SL */}
                  <div className="flex justify-between items-center px-4 py-2 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="text-slate-500 font-bold text-[11px]">Sick leaves:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-mono text-[10px] font-normal">{selectedLatest.sl}</span>
                      <ArrowRight className="w-3 h-3 text-slate-450" />
                      <span className={`font-black text-xs ${projectedSL < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                        {projectedSL.toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Bounds check warnings */}
                {(projectedPL < 0 || projectedSL < 0) && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-150 text-rose-800 p-3 rounded-xl mt-1 text-[10px] leading-relaxed">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>Inadequate Leave Balances! Simulated bookings exceed available closing values.</span>
                  </div>
                )}
                
                {!(projectedPL < 0 || projectedSL < 0) && (calcPlToUse > 0 || calcSlToUse > 0) && (
                  <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-150 text-emerald-800 p-3 rounded-xl mt-1 text-[10px] leading-relaxed">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Simulation Passed. Employee has sufficient balances to request processing cycle.</span>
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
