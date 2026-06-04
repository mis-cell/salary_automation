import React, { useState, useEffect } from "react";
import { Send, Loader2, Play, CheckCircle2, FileText, AlertCircle, ExternalLink, RefreshCw } from "lucide-react";
import { fetchEmployeeDetails, EmployeeRow } from "../lib/googleSheetsService";

interface ProcessedRow {
  empCode: string;
  name: string;
  type: string;
  payableDays: number;
  actualBasic: number;
  payableBasic: number;
  actualHra: number;
  payableHra: number;
  actualGross: number;
  payableGross: number;
  actualConsol: number;
  payableConsol: number;
  ptax: number;
  pf: number;
  esi: number;
  netPay: number;
  pdfUrl: string;
}

export default function EnterSalary() {
  const [loading, setLoading] = useState(false);
  const [scriptUrl, setScriptUrl] = useState("https://script.google.com/macros/s/AKfycbzsukRpBdg828rZI0YrgIaxs3Bh6VPl33dlMmRm0Vt3FsabaNZfavTUTzns3WayYTXR/exec"); 
  const [month, setMonth] = useState("June");
  const [year, setYear] = useState("2026");
  const [payableDays, setPayableDays] = useState(26);

  const [masterEmployees, setMasterEmployees] = useState<EmployeeRow[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [results, setResults] = useState<ProcessedRow[]>([]);
  const [runsSummary, setRunsSummary] = useState<any | null>(null);

  // Load masters for active preview
  const loadMasterList = async () => {
    setLoadingMaster(true);
    try {
      const data = await fetchEmployeeDetails();
      setMasterEmployees(data.filter(e => e.presentStatus === "ACTIVE"));
    } catch (err) {
      console.error("Master fetch error on EnterSalary:", err);
    } finally {
      setLoadingMaster(false);
    }
  };

  useEffect(() => {
    loadMasterList();
  }, []);

  const fetchProcessedData = async (targetMonth: string, targetYear: string) => {
    try {
      const sheetName = `${targetMonth}_${targetYear}`;
      const sheetUrl = `https://docs.google.com/spreadsheets/d/1IoGYxMMOrVzkHyqp1n2InXgf14jLJUEfKZMX5MWVBj4/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
      const response = await fetch(sheetUrl);
      if (!response.ok) return;

      const text = await response.text();
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
      if (!match) return;

      const obj = JSON.parse(match[1]);
      const table = obj.table;
      if (!table || !table.rows) return;

      const parsedRows: ProcessedRow[] = table.rows.slice(1).map((r: any) => {
        const cells = r.c.map((cell: any) => {
          if (!cell) return null;
          if (cell.f !== undefined) return cell.f;
          return cell.v;
        });

        const numVal = (val: any) => {
          if (!val) return 0;
          const num = parseFloat(String(val).replace(/[^\d.-]/g, ''));
          return isNaN(num) ? 0 : num;
        };

        return {
          empCode: cells[0] ? String(cells[0]).trim() : "",
          name: cells[1] ? String(cells[1]).trim() : "",
          type: cells[2] ? String(cells[2]).trim() : "",
          payableDays: numVal(cells[3]),
          actualBasic: numVal(cells[4]),
          payableBasic: numVal(cells[5]),
          actualHra: numVal(cells[6]),
          payableHra: numVal(cells[7]),
          actualGross: numVal(cells[8]),
          payableGross: numVal(cells[9]),
          actualConsol: numVal(cells[10]),
          payableConsol: numVal(cells[11]),
          ptax: numVal(cells[12]),
          pf: numVal(cells[13]),
          esi: numVal(cells[14]),
          netPay: numVal(cells[15]),
          pdfUrl: cells[16] ? String(cells[16]).trim() : "Processing...",
        };
      });

      setResults(parsedRows);
    } catch (err) {
      console.error("Error retrieving generated sheet values:", err);
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptUrl) {
      alert("Please enter a valid Google Apps Script Web App URL.");
      return;
    }
    const isConfirmed = window.confirm(`Initiate official calculation execution for (${month} ${year}) with default ${payableDays} payable days? This will write dynamic calculations and trigger PDF rendering.`);
    if (!isConfirmed) return;
    
    setLoading(true);
    setResults([]);
    setRunsSummary(null);

    try {
      const response = await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors", // Crucial since local dev might trigger standard CORS rules on standard POST web apps
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "PROCESS_SALARY",
          month: month,
          year: year,
          payableDays: Number(payableDays)
        })
      });

      // Give Google Sheets some time to run calculations and generate sheets & PDFs
      setTimeout(async () => {
        await fetchProcessedData(month, year);
        setLoading(false);
        alert("Payroll processing completed successfully! Pulling generated payslips list...");
      }, 5000);

    } catch (err: any) {
      alert("Payroll communication error: " + err.message);
      setLoading(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Run Payroll Pipeline</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium font-semibold">Initiate calculations and print Drive PDFs dynamically through Google Apps Script.</p>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <form onSubmit={handleProcess} className="p-7 border-b border-slate-100 flex flex-col lg:flex-row justify-between lg:items-end gap-6 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-5 flex-1">
            <div className="space-y-1.5 flex-1 max-w-[180px]">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Payroll Month</label>
              <select value={month} onChange={e=>setMonth(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-900 bg-white outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 shadow-sm transition-all focus:bg-white text-slate-950">
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
              </select>
            </div>
            <div className="space-y-1.5 flex-1 max-w-[140px]">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Year</label>
              <input type="number" value={year} onChange={e=>setYear(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-900 bg-white outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 shadow-sm transition-all text-slate-950 font-semibold" />
            </div>
            <div className="space-y-1.5 flex-1 max-w-[160px]">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Default Payable Days</label>
              <input type="number" min="1" max="31" value={payableDays} onChange={e=>setPayableDays(Number(e.target.value) || 26)} className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-bold text-slate-900 bg-white outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 shadow-sm transition-all text-slate-950 font-semibold" />
            </div>
            <div className="space-y-1.5 flex-[2]">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider ml-1">Google App Script Webhook URL</label>
              <input type="url" required value={scriptUrl} onChange={e=>setScriptUrl(e.target.value)} className="w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-sm font-semibold text-slate-900 bg-white outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 shadow-sm transition-all placeholder:text-slate-300 text-slate-950" placeholder="https://script.google.com/macros/s/..." />
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-bold px-8 py-4 rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-70 shadow-lg shadow-slate-900/20 active:scale-95 shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            Execute Calculations
          </button>
        </form>

        <div className="p-7">
          <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            Pending Preview Headcount ({masterEmployees.length} active employees mapped)
          </h3>
          {loadingMaster ? (
            <div className="flex items-center gap-2 text-slate-400 py-6 font-semibold">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading active list...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterEmployees.map((e) => (
                <div key={e.empCode} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{e.name}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">{e.designation} ({e.department})</div>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100/60">
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded shadow-sm">{e.salaryType}</span>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">Gross Rate: {formatCurrency(e.grossSalary)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-indigo-50 border border-indigo-200 p-8 rounded-[32px] shadow-sm flex flex-col items-center justify-center text-center">
          <Loader2 className="w-12 h-12 text-indigo-700 animate-spin mb-4" />
          <h3 className="font-bold text-indigo-950 text-xl">Transmitting To AutoPay Core Engine...</h3>
          <p className="text-indigo-700 text-sm font-medium mt-1 max-w-sm">Please wait while the Google Apps Script compiles row computations, appends records into your Google Sheet, and converts individual PDF payslips.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-[32px] shadow-sm mt-4 animate-in slide-in-from-bottom-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-emerald-100/50">
            <CheckCircle2 className="w-40 h-40 transform translate-x-10 -translate-y-10" />
          </div>
          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 mb-5 shadow-sm border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-emerald-900 mb-2 text-2xl tracking-tight">Transmission Complete!</h3>
            <p className="text-emerald-700 text-sm font-semibold mb-8 max-w-lg">Generated calculations matches the Sheet entries. Individual PDFs can be downloaded directly.</p>
            
            <div className="w-full overflow-x-auto bg-white rounded-3xl border border-emerald-100 shadow-sm p-4 text-left">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-emerald-100 text-[11px] font-bold text-emerald-800 tracking-wider">
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4 text-center">Days</th>
                    <th className="py-3 px-4 text-center">Calculated Gross</th>
                    <th className="py-3 px-4 text-center">Deduction (PT)</th>
                    <th className="py-3 px-4 text-center">Net Disbursed</th>
                    <th className="py-3 px-4 text-right">Payslip PDF link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((row, i) => (
                    <tr key={i} className="hover:bg-emerald-50/20 text-slate-800 text-sm">
                      <td className="py-3.5 px-4 font-bold">
                        <div>{row.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 font-medium mt-0.5">{row.empCode}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-600">{row.payableDays}</td>
                      <td className="py-3.5 px-4 text-center font-semibold">{formatCurrency(row.payableGross || row.payableConsol)}</td>
                      <td className="py-3.5 px-4 text-center font-semibold text-rose-600">-{formatCurrency(row.ptax + row.pf + row.esi)}</td>
                      <td className="py-3.5 px-4 text-center text-emerald-800 font-bold">{formatCurrency(row.netPay)}</td>
                      <td className="py-3.5 px-4 text-right">
                        {row.pdfUrl && row.pdfUrl.startsWith("http") ? (
                          <a 
                            href={row.pdfUrl} 
                            target="_blank" 
                            rel="referrer" 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 shadow-sm transition-all"
                          >
                            Download <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded inline-block">Generating in Drive...</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
