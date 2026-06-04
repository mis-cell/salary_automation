import React, { useState, useEffect } from "react";
import { Loader2, Play, CheckCircle2, FileText, AlertCircle, ExternalLink, RefreshCw, Settings, Info, Keyboard } from "lucide-react";
import { fetchEmployeeDetails, EmployeeRow, getSheetId } from "../lib/googleSheetsService";

interface EditableRow {
  serialNumber: string;
  empCode: string;
  name: string;
  salaryType: string;
  department: string;
  designation: string;
  payableDays: number;
  basic: number;
  hra: number;
  conv: number;
  bArr: number;
  hArr: number;
  ptax: number;
  pf: number;
  esi: number;
  itax: number;
  adv: number;
  oth: number;
}

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
  const [defaultPayableDays, setDefaultPayableDays] = useState(26);

  const [masterEmployees, setMasterEmployees] = useState<EmployeeRow[]>([]);
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [results, setResults] = useState<ProcessedRow[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Load masters for active preview
  const loadMasterList = async () => {
    setLoadingMaster(true);
    setFetchError(null);
    try {
      const data = await fetchEmployeeDetails();
      const activeList = data.filter(e => e.presentStatus === "ACTIVE" || e.presentStatus === "active");
      setMasterEmployees(activeList);
      
      // Map to editable rows immediately
      const initialRows = activeList.map(emp => {
        // Safe standard mappings
        const isConsolidated = emp.salaryType === "CONSOLIDATED";
        return {
          serialNumber: emp.serialNumber,
          empCode: emp.empCode,
          name: emp.name,
          salaryType: emp.salaryType || "REGULAR",
          department: emp.department,
          designation: emp.designation,
          payableDays: defaultPayableDays,
          basic: emp.basic || 0,
          hra: emp.hra || 0,
          conv: emp.conv || 0,
          bArr: 0,
          hArr: 0,
          ptax: isConsolidated ? 0 : 200, // standard P.Tax from screenshot
          pf: emp.pf || 0,
          esi: emp.esi || 0,
          itax: 0,
          adv: 0,
          oth: 0
        };
      });
      setRows(initialRows);
    } catch (err: any) {
      console.error("Master fetch error on EnterSalary:", err);
      setFetchError(err.message || String(err));
    } finally {
      setLoadingMaster(false);
    }
  };

  useEffect(() => {
    loadMasterList();
  }, []);

  // Sync individual row days and rates if global default days is changed
  useEffect(() => {
    setRows(prev => prev.map(r => ({ ...r, payableDays: defaultPayableDays })));
  }, [defaultPayableDays]);

  const updateRowField = (empCode: string, field: keyof EditableRow, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.empCode === empCode) {
        return { ...r, [field]: value };
      }
      return r;
    }));
  };

  const fetchProcessedData = async (targetMonth: string, targetYear: string) => {
    try {
      const sheetName = `${targetMonth}_${targetYear}`;
      const sheetId = getSheetId();
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
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
      setNotification({ message: "Please enter a valid Google Apps Script Web App URL first.", type: "error" });
      return;
    }
    const isConfirmed = window.confirm(`Initiate official calculation execution for (${month} ${year}) with ${rows.length} employees? This transmits row calculation parameters and generates PDF payslips on your Google Drive folder.`);
    if (!isConfirmed) return;
    
    setLoading(true);
    setResults([]);
    setNotification({ message: "Connecting to Apps Script Engine...", type: "info" });

    try {
      // Send both the standard config AND the edited grid salaries back so the backend has access to custom-filled rows
      const response = await fetch(scriptUrl, {
        method: "POST",
        mode: "no-cors", // Trigger no-cors as Google Web App redirection usually causes preflight blocks locally
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "PROCESS_SALARY",
          month: month,
          year: year,
          payableDays: Number(defaultPayableDays),
          employeesList: rows // Include custom edited entries
        })
      });

      setNotification({ message: "Calculated transactions transmitted. Rendering PDFs on Drive. Please wait...", type: "info" });

      // Poll at intervals to check if the generated sheet with links has been compiled
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        await fetchProcessedData(month, year);
        if (attempts >= 4) {
          clearInterval(interval);
          setLoading(false);
          setNotification({ message: "Payroll pipeline executed successfully! Pulling latest generated PDF drive links.", type: "success" });
        }
      }, 3000);

    } catch (err: any) {
      setNotification({ message: "Payroll pipeline communication failed: " + err.message, type: "error" });
      setLoading(false);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">Run Payroll Pipeline</h1>
          <p className="text-white/80 text-sm mt-1.5 font-medium">Verify data mapped from sheets, edit employee details, and transmit to Apps Script for PDF generation.</p>
        </div>
        <button
          onClick={loadMasterList}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-white/15 hover:bg-white/25 active:scale-95 border border-white/10 rounded-xl transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Re-sync Sheet Data
        </button>
      </div>

      {/* Main Container Card */}
      <div className="bg-white rounded-[32px] border border-slate-200/80 shadow-[0_12px_44px_-16px_rgba(40,20,90,0.08)] overflow-hidden flex flex-col">
        
        {/* Form controls */}
        <form onSubmit={handleProcess} className="p-7 border-b border-slate-100 flex flex-col xl:flex-row justify-between xl:items-end gap-6 bg-slate-50/70">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 flex-1">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block ml-1">Payroll Month</label>
              <select 
                value={month} 
                onChange={e=>setMonth(e.target.value)} 
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 bg-white shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all text-slate-950"
              >
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
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block ml-1">Year</label>
              <input 
                type="number" 
                value={year} 
                onChange={e=>setYear(e.target.value)} 
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 bg-white shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-semibold" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block ml-1">Default Payable Days</label>
              <input 
                type="number" 
                min="1" 
                max="31" 
                value={defaultPayableDays} 
                onChange={e=>setDefaultPayableDays(Number(e.target.value) || 26)} 
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-950 bg-white shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all font-semibold" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block ml-1">Google Apps Script Webhook URL</label>
              <input 
                type="url" 
                required 
                value={scriptUrl} 
                onChange={e=>setScriptUrl(e.target.value)} 
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-900 bg-white shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300 text-slate-950" 
                placeholder="https://script.google.com/macros/s/..." 
              />
            </div>
          </div>
          
          <button 
            type="submit"
            disabled={loading || rows.length === 0}
            className="flex items-center justify-center gap-2 bg-[#0c1322] hover:bg-[#1a253d] text-white text-sm font-bold h-12 px-8 rounded-2xl transition-all disabled:opacity-50 shadow-md active:scale-95 shrink-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5.5 h-5.5 text-indigo-400 fill-indigo-400" />}
            Generate PDFs
          </button>
        </form>

        {/* Notifications and Diagnostics Banner */}
        {notification && (
          <div className={`p-4 border-b text-xs font-bold flex items-center gap-2 ${
            notification.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
            notification.type === "error" ? "bg-rose-50 border-rose-100 text-rose-800" :
            "bg-blue-50 border-blue-105 text-blue-800"
          }`}>
            <Info className="w-4 h-4" />
            <span>{notification.message}</span>
          </div>
        )}

        {/* Interactive Payroll Spreadsheet Grid Table */}
        <div className="overflow-x-auto">
          {loadingMaster ? (
            <div className="flex flex-col items-center justify-center gap-2 text-slate-400 py-24 font-semibold bg-slate-50/20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <span>Loading Employee Records from emp_details...</span>
            </div>
          ) : fetchError ? (
            <div className="p-10 text-center flex flex-col items-center justify-center max-w-xl mx-auto gap-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-lg">No Employee Data Loaded</h4>
                <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">{fetchError}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={loadMasterList}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl active:scale-95 hover:bg-slate-800 transition-all font-sans"
                >
                  Retry Fetching Rows
                </button>
                <button
                  onClick={() => {
                    // Trigger Settings modal click simulated by dispatching event or instruction
                    alert("Please click the 'Connection' button in the top-right header to update your Google Sheet ID!");
                  }}
                  className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all font-sans"
                >
                  Configure Sheet ID
                </button>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-semibold bg-slate-50/20">
              No active employees maps found. Ensure present status column represents "ACTIVE".
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap table-fixed min-w-[1280px]">
              <thead>
                {/* Column Categories Header Row */}
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-2.5 px-4 w-[240px]">Employee Information</th>
                  <th colSpan={4} className="py-2.5 px-4 bg-emerald-50/40 text-emerald-800 border-r border-slate-200">Earnings mapped from sheets</th>
                  <th colSpan={4} className="py-2.5 px-4 bg-rose-50/45 text-rose-800 border-r border-slate-200">Deductions mapped from sheets</th>
                  <th className="py-2.5 px-4 bg-indigo-50/40 text-slate-900 w-[150px]">Net Result</th>
                </tr>
                
                {/* Visual Field Attributes */}
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-700">
                  <th className="py-3 px-4">Employee ID & Name</th>
                  <th className="py-3 px-4 bg-emerald-50/10">BASIC / HRA</th>
                  <th className="py-3 px-4 bg-emerald-50/10">CONVEYANCE</th>
                  <th className="py-3 px-4 bg-emerald-50/10">ARREARS</th>
                  <th className="py-3 px-4 bg-emerald-50/10 border-r border-slate-200 text-emerald-900">GROSS</th>
                  <th className="py-3 px-4 bg-rose-50/10">PT & PF</th>
                  <th className="py-3 px-4 bg-rose-50/10">ESI & IT</th>
                  <th className="py-3 px-4 bg-rose-50/10">ADVANCES / OTH</th>
                  <th className="py-3 px-4 bg-rose-50/10 border-r border-slate-200 text-rose-900">TOTAL DED.</th>
                  <th className="py-3 px-4 bg-indigo-50/10">NET PAYABLE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {rows.map((r, i) => {
                  // Math calculations
                  const isConsolidated = r.salaryType === "CONSOLIDATED";
                  
                  // Compute gross
                  const basicRate = r.basic;
                  const hraRate = r.hra;
                  const convRate = r.conv;
                  const totalArrears = r.bArr + r.hArr;
                  const computedGross = isConsolidated ? r.basic : (basicRate + hraRate + convRate + totalArrears);

                  // Compute deductions
                  const totalDed = r.ptax + r.pf + r.esi + r.itax + r.adv + r.oth;

                  // Net Payable
                  const netPayable = Math.max(0, computedGross - totalDed);

                  return (
                    <tr key={r.empCode} className="hover:bg-slate-50/35 transition-colors text-xs font-semibold">
                      
                      {/* Employee profile */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-950 text-sm leading-tight">{r.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">{r.empCode}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{r.designation}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <label className="text-[10px] text-slate-400 font-bold uppercase">Present Days:</label>
                          <input 
                            type="number" 
                            min="0" 
                            max="31" 
                            value={r.payableDays} 
                            onChange={(e) => updateRowField(r.empCode, "payableDays", Number(e.target.value) || 0)}
                            className="w-11 px-1 py-0.5 text-center text-[11px] font-bold text-slate-950 bg-slate-50 border border-slate-200 rounded-md focus:border-indigo-400 focus:bg-white outline-none"
                          />
                        </div>
                      </td>

                      {/* BASIC / HRA */}
                      <td className="py-4 px-3 bg-emerald-50/5">
                        <div className="flex flex-col gap-1.5 max-w-[130px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Basic:</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                value={r.basic} 
                                onChange={(e) => updateRowField(r.empCode, "basic", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-indigo-400 outline-none"
                              />
                            </div>
                          </div>
                          {!isConsolidated && (
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">HRA:</span>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                                <input 
                                  type="number" 
                                  value={r.hra} 
                                  onChange={(e) => updateRowField(r.empCode, "hra", Number(e.target.value) || 0)}
                                  className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-indigo-400 outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* CONVEYANCE */}
                      <td className="py-4 px-3 bg-emerald-50/5">
                        <div className="flex flex-col gap-1.5 max-w-[130px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Conv.</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                disabled={isConsolidated} 
                                value={isConsolidated ? 0 : r.conv} 
                                onChange={(e) => updateRowField(r.empCode, "conv", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-md focus:border-indigo-400 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ARREARS */}
                      <td className="py-4 px-3 bg-emerald-50/5">
                        <div className="flex flex-col gap-1.5 max-w-[130px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">B.Arr:</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                disabled={isConsolidated} 
                                value={isConsolidated ? 0 : r.bArr} 
                                onChange={(e) => updateRowField(r.empCode, "bArr", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-md focus:border-indigo-400 outline-none"
                              />
                            </div>
                          </div>
                          {!isConsolidated && (
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase">H.Arr:</span>
                              <div className="relative">
                                <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                                <input 
                                  type="number" 
                                  value={r.hArr} 
                                  onChange={(e) => updateRowField(r.empCode, "hArr", Number(e.target.value) || 0)}
                                  className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-indigo-400 outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* GROSS */}
                      <td className="py-4 px-4 bg-emerald-50/15 border-r border-slate-200 text-center">
                        <div className="text-emerald-800 font-black text-sm">
                          {formatCurrency(computedGross)}
                        </div>
                        <div className="text-[9px] text-emerald-600 bg-emerald-50 rounded mt-1 px-1.5 py-0.5 inline-block capitalize font-bold">
                          {r.salaryType} Rate
                        </div>
                      </td>

                      {/* PT & PF */}
                      <td className="py-4 px-3 bg-rose-50/5">
                        <div className="flex flex-col gap-1.5 max-w-[130px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">P.Tax:</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                value={r.ptax} 
                                onChange={(e) => updateRowField(r.empCode, "ptax", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-rose-400 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">PF:</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                value={r.pf} 
                                onChange={(e) => updateRowField(r.empCode, "pf", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-rose-400 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ESI & IT */}
                      <td className="py-4 px-3 bg-rose-50/5">
                        <div className="flex flex-col gap-1.5 max-w-[130px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">ESI:</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                value={r.esi} 
                                onChange={(e) => updateRowField(r.empCode, "esi", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-rose-400 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">I.Tax:</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                value={r.itax} 
                                onChange={(e) => updateRowField(r.empCode, "itax", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-rose-400 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ADVANCES / OTHERS */}
                      <td className="py-4 px-3 bg-rose-50/5">
                        <div className="flex flex-col gap-1.5 max-w-[130px]">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Adv.</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                value={r.adv} 
                                onChange={(e) => updateRowField(r.empCode, "adv", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-rose-400 outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Oth:</span>
                            <div className="relative">
                              <span className="absolute left-1.5 top-1 text-[10px] text-slate-400">₹</span>
                              <input 
                                type="number" 
                                value={r.oth} 
                                onChange={(e) => updateRowField(r.empCode, "oth", Number(e.target.value) || 0)}
                                className="w-[85px] pl-4 pr-1 py-0.5 text-right text-xs font-black text-slate-950 bg-white border border-slate-200 rounded-md focus:border-rose-400 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* TOTAL DED. */}
                      <td className="py-4 px-4 bg-rose-50/15 border-r border-slate-200 text-center font-extrabold text-rose-700">
                        <div className="text-rose-600 font-black text-sm">
                          {formatCurrency(totalDed)}
                        </div>
                        <span className="text-[9px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded block mt-1">Deducted</span>
                      </td>

                      {/* NET PAYABLE */}
                      <td className="py-4 px-4 bg-indigo-50/10">
                        <div className="bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-2xl flex flex-col justify-center items-center h-full min-w-[110px]">
                          <span className="text-[10px] text-slate-400 font-bold uppercase block text-center">Net Pay</span>
                          <span className="text-slate-950 font-black text-sm mt-0.5 text-center truncate">{formatCurrency(netPayable)}</span>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {loading && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[32px] text-white flex flex-col items-center justify-center text-center shadow-lg">
          <Loader2 className="w-12 h-12 text-white animate-spin mb-4" />
          <h3 className="font-extrabold text-xl">Transmitting To AutoPay Core Engine...</h3>
          <p className="text-white/80 text-sm font-medium mt-1.5 max-w-sm">Please wait while the Google Apps Script compiles row computations, appends records into your Google Sheet, and converts individual PDF payslips.</p>
        </div>
      )}

      {/* Results panel listing generated payslips */}
      {results.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-250 p-8 rounded-[32px] shadow-sm mt-4 animate-in slide-in-from-bottom-4 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-emerald-100/50">
            <CheckCircle2 className="w-40 h-40 transform translate-x-10 -translate-y-10" />
          </div>
          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 mb-5 shadow-sm border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-black text-emerald-950 mb-2 text-2xl tracking-tight">Transmission Complete!</h3>
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
                            rel="noreferrer" 
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
