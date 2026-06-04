import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import { fetchEmployeeDetails, fetchLeaveBalances, EmployeeRow, LeaveBalanceRow } from "../lib/googleSheetsService";
import { FileText, Printer, AlertCircle, Loader2, IndianRupee, Search, ChevronRight, Check, X, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown, Palette, Send, Mail } from "lucide-react";

// Robust Indian currency translation to text format
function numberToWords(num: number): string {
  const integerPart = Math.floor(num);
  if (integerPart === 0) return "Rupees Zero Only";
  
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) {
        str += a[n];
      } else {
        str += b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
      }
    }
    return str.trim();
  }

  let result = "";
  let temp = integerPart;

  if (temp >= 10000000) { // Crores
    const cr = Math.floor(temp / 10000000);
    result += convertLessThanThousand(cr) + " Crore ";
    temp %= 10000000;
  }
  if (temp >= 100000) { // Lakhs
    const lakh = Math.floor(temp / 100000);
    result += convertLessThanThousand(lakh) + " Lakh ";
    temp %= 100000;
  }
  if (temp >= 1000) { // Thousands
    const th = Math.floor(temp / 1000);
    result += convertLessThanThousand(th) + " Thousand ";
    temp %= 1000;
  }
  if (temp > 0) {
    result += convertLessThanThousand(temp);
  }

  return "Rupees " + result.trim() + " Only";
}

interface ThemeStyles {
  label: string;
  colorHex: string;
  topAccent: string;
  netPayableBg: string;
  netPayableTextLabel: string;
  netPayableTextWords: string;
  payableDaysBadge: string;
  highlightBg: string;
}

const themeConfigs: Record<"classic" | "emerald" | "crimson" | "cobalt" | "mono", ThemeStyles> = {
  classic: {
    label: "Midnight Luxe",
    colorHex: "#0e172c",
    topAccent: "bg-[#0e172c]",
    netPayableBg: "bg-[#0e172c]",
    netPayableTextLabel: "text-slate-300",
    netPayableTextWords: "text-slate-100",
    payableDaysBadge: "text-indigo-800 bg-indigo-50 border-indigo-100",
    highlightBg: "bg-indigo-50/20"
  },
  emerald: {
    label: "Sage & Spruce",
    colorHex: "#064e3b",
    topAccent: "bg-[#064e3b]",
    netPayableBg: "bg-[#064e3b]",
    netPayableTextLabel: "text-emerald-300",
    netPayableTextWords: "text-emerald-100",
    payableDaysBadge: "text-emerald-800 bg-emerald-50 border-emerald-100",
    highlightBg: "bg-emerald-50/20"
  },
  crimson: {
    label: "Burgundy Editorial",
    colorHex: "#4c0519",
    topAccent: "bg-[#4c0519]",
    netPayableBg: "bg-[#4c0519]",
    netPayableTextLabel: "text-rose-300",
    netPayableTextWords: "text-rose-100",
    payableDaysBadge: "text-rose-800 bg-rose-50 border-rose-100",
    highlightBg: "bg-rose-50/20"
  },
  cobalt: {
    label: "Terracotta Linen",
    colorHex: "#7c2d12",
    topAccent: "bg-[#7c2d12]",
    netPayableBg: "bg-[#7c2d12]",
    netPayableTextLabel: "text-amber-200",
    netPayableTextWords: "text-orange-50",
    payableDaysBadge: "text-amber-800 bg-amber-50 border-amber-150",
    highlightBg: "bg-amber-50/20"
  },
  mono: {
    label: "Carbon Minimal",
    colorHex: "#1e293b",
    topAccent: "bg-slate-800",
    netPayableBg: "bg-slate-900",
    netPayableTextLabel: "text-slate-400",
    netPayableTextWords: "text-slate-200",
    payableDaysBadge: "text-slate-800 bg-slate-100 border-slate-300",
    highlightBg: "bg-slate-100"
  }
};

export default function PayDetails() {
  const { accessToken } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Record map of status for each employee's payslip
  const [payslipStatuses, setPayslipStatuses] = useState<Record<string, "Processed" | "Pending" | "Error">>({});

  // Sorting State
  const [sortField, setSortField] = useState<keyof EmployeeRow>("serialNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filtering & Interaction
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlipEmp, setSelectedSlipEmp] = useState<EmployeeRow | null>(null);
  const [slipMonth, setSlipMonth] = useState("June");
  const [slipYear, setSlipYear] = useState("2026");
  
  // Custom template interactive simulations
  const [basicArrear, setBasicArrear] = useState(0);
  const [hraArrear, setHraArrear] = useState(0);
  const [convArrear, setConvArrear] = useState(0);
  const [advDeduction, setAdvDeduction] = useState(0);
  const [itaxDeduction, setItaxDeduction] = useState(0);
  const [othersDeduction, setOthersDeduction] = useState(0);
  const [payableDays, setPayableDays] = useState(30);
  const [payslipTheme, setPayslipTheme] = useState<"classic" | "emerald" | "crimson" | "cobalt" | "mono">(() => {
    const saved = localStorage.getItem("PAYSLIP_PREFER_THEME");
    if (saved === "classic" || saved === "emerald" || saved === "crimson" || saved === "cobalt" || saved === "mono") {
      return saved as "classic" | "emerald" | "crimson" | "cobalt" | "mono";
    }
    return "classic";
  });

  const printAreaRef = useRef<HTMLDivElement>(null);

  const getDaysInMonth = (monthName: string, yearStr: string): number => {
    const list = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const idx = list.indexOf(monthName);
    if (idx === -1) return 30;
    const yr = parseInt(yearStr) || 2026;
    return new Date(yr, idx + 1, 0).getDate();
  };

  // Reset payable days when month, year, or employee is modified
  useEffect(() => {
    const totalDays = getDaysInMonth(slipMonth, slipYear);
    setPayableDays(totalDays);
  }, [slipMonth, slipYear, selectedSlipEmp]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmployeeDetails();
      setEmployees(data);

      try {
        const leaveData = await fetchLeaveBalances();
        setLeaveBalances(leaveData);
      } catch (err) {
        console.warn("Leave balances fetch warning", err);
      }
      
      // Initialize default statuses for employees
      const initialStatuses: Record<string, "Processed" | "Pending" | "Error"> = {};
      data.forEach(emp => {
        const saved = localStorage.getItem(`PAYSLIP_STATUS_${emp.empCode}`);
        if (saved === "Processed" || saved === "Pending" || saved === "Error") {
          initialStatuses[emp.empCode] = saved;
        } else {
          // Semi-deterministic fallback: if inactive or zero basic rate, mark as Error.
          // Otherwise, assign Pending if it ends in certain codes, else Processed.
          if (!emp.basic || emp.basic <= 0 || (emp.presentStatus !== "ACTIVE" && emp.presentStatus !== "active")) {
            initialStatuses[emp.empCode] = "Error";
          } else {
            const lastChar = emp.empCode.slice(-1);
            if (lastChar === "1" || lastChar === "4" || lastChar === "7") {
              initialStatuses[emp.empCode] = "Pending";
            } else {
              initialStatuses[emp.empCode] = "Processed";
            }
          }
        }
      });
      setPayslipStatuses(initialStatuses);

      if (data.length > 0 && !selectedSlipEmp) {
        setSelectedSlipEmp(data[0]); // Default first employee selected
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch live employee pay details.");
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: "Processed" | "Pending" | "Error") => {
    switch (status) {
      case "Processed":
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-250/50 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider select-none">
            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
            Processed
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-205/55 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            Pending
          </span>
        );
      case "Error":
        return (
          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200/50 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider select-none">
            <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
            Error
          </span>
        );
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSort = (field: keyof EmployeeRow) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedEmployeesForSlip = [...filteredEmployees].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }

    const numA = Number(valA);
    const numB = Number(valB);
    if (!isNaN(numA) && !isNaN(numB)) {
      return sortDirection === "asc" ? numA - numB : numB - numA;
    }

    const strA = String(valA).trim().toLowerCase();
    const strB = String(valB).trim().toLowerCase();

    if (strA < strB) return sortDirection === "asc" ? -1 : 1;
    if (strA > strB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Standard printing utility
  const handlePrint = () => {
    window.print();
  };

  // Safe Math Computations base rates
  const daysInMonth = getDaysInMonth(slipMonth, slipYear);
  const actualBasic = selectedSlipEmp?.basic || 0;
  const actualHra = selectedSlipEmp?.hra || 0;
  const actualConv = selectedSlipEmp?.conv || 0;

  // Pro-rated payable calculations
  const isConsolType = selectedSlipEmp?.salaryType === "CONSOLIDATED";
  const payableBasic = isConsolType ? (selectedSlipEmp?.grossSalary || actualBasic) : Math.round((actualBasic * payableDays) / daysInMonth);
  const payableHra = isConsolType ? 0 : Math.round((actualHra * payableDays) / daysInMonth);
  const payableConv = isConsolType ? 0 : Math.round((actualConv * payableDays) / daysInMonth);

  // Totals calculations
  const totalPay = isConsolType 
    ? (selectedSlipEmp?.grossSalary || actualBasic) 
    : (payableBasic + payableHra + payableConv);

  const totalArrears = isConsolType ? 0 : (basicArrear + hraArrear + convArrear);
  const grossPay = totalPay + totalArrears;

  // Deductions from state & defaults
  const dbPf = selectedSlipEmp?.pf || 0;
  const dbEsi = selectedSlipEmp?.esi || 0;
  // Professional tax is standard 200 for regular employees in West Bengal, or customizable
  const defaultPTax = selectedSlipEmp?.salaryType === "REGULAR" ? 200 : 0;

  const finalPf = isConsolType ? 0 : dbPf;
  const finalEsi = isConsolType ? 0 : dbEsi;
  const finalPTax = isConsolType ? 0 : defaultPTax;

  const totalDeductions = isConsolType 
    ? 0 
    : (finalPf + finalEsi + finalPTax + advDeduction + itaxDeduction + othersDeduction);

  const totalNetPayable = Math.max(0, grossPay - totalDeductions);

  // Leave lookup helper matching the selected employee and month/year cycle
  const getLeaveDetails = () => {
    if (!selectedSlipEmp) return { usedPl: 0, plBalance: 0, usedSl: 0, slBalance: 0 };
    
    const exactMatch = leaveBalances.find(
      b => b.empCode === selectedSlipEmp.empCode && 
      b.month?.toLowerCase() === slipMonth.toLowerCase() && 
      b.year === slipYear
    );
    if (exactMatch) {
      return {
        usedPl: exactMatch.usedPL || 0,
        plBalance: exactMatch.closingPL ?? exactMatch.openingPL ?? 0,
        usedSl: exactMatch.usedSL || 0,
        slBalance: exactMatch.closingSL ?? exactMatch.openingSL ?? 0
      };
    }

    const monthsOrder = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const empRecords = leaveBalances
      .filter(b => b.empCode === selectedSlipEmp.empCode)
      .sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        if (yearA !== yearB) return yearA - yearB;
        
        const monthA = monthsOrder.indexOf(a.month?.toLowerCase() || "");
        const monthB = monthsOrder.indexOf(b.month?.toLowerCase() || "");
        return monthA - monthB;
      });

    if (empRecords.length > 0) {
      const latest = empRecords[empRecords.length - 1];
      return {
        usedPl: latest.usedPL || 0,
        plBalance: latest.closingPL ?? latest.openingPL ?? 0,
        usedSl: latest.usedSL || 0,
        slBalance: latest.closingSL ?? latest.openingSL ?? 0
      };
    }

    return {
      usedPl: 0,
      plBalance: selectedSlipEmp.pl || 0,
      usedSl: 0,
      slBalance: 8.5
    };
  };

  const leaveInfo = getLeaveDetails();

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Hide surrounding app elements on print mode */}
      <style>{`
        @media print {
          /* Hide all surrounding app chrome, header, sidebar, lists, inputs, and helpers */
          header, nav, aside, footer, button, input, select, .print\\:hidden, [class*="print:hidden"], #connection-settings-modal {
            display: none !important;
          }
          
          /* Hide left employee directory listing column wholly */
          .xl\\:col-span-4 {
            display: none !important;
          }
          
          /* Expand the right payslip container to take full width */
          .xl\\:col-span-8 {
            width: 100% !important;
            max-width: 100% !important;
            flex: none !important;
            display: block !important;
          }

          /* Force ancestors to display normally with no height or clipping limits */
          html, body, #root, #root > div, main, .min-h-screen {
            display: block !important;
            overflow: visible !important;
            position: relative !important;
            height: auto !important;
            min-height: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: white !important;
            background-image: none !important;
            box-shadow: none !important;
          }

          /* Corporate standard document card - exact A4 aspect styling */
          #printable-payslip {
            visibility: visible !important;
            display: block !important;
            border: 2px solid #000000 !important;
            border-radius: 12px !important;
            padding: 32px !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 800px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            position: relative !important;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Ensure all background fills in badges, headers display properly when printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-display">Financial & Salary Directory</h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">Generate corporate-standard salary slips with live Indian currency text-translation and print automations.</p>
        </div>
        <button 
          onClick={loadData}
          className="px-5 py-2.5 bg-[#0c1322] hover:bg-[#1a253d] text-white text-xs font-black rounded-2xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Details</span>
        </button>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-[20px] flex gap-4 items-start shadow-xs print:hidden">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm mb-1">CORS or Sync Failure</h3>
            <p className="text-rose-700 text-xs leading-relaxed font-semibold">{error}</p>
          </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-[24px] shadow-xs print:hidden">
          <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-3" />
          <p className="text-slate-500 font-bold text-xs">Loading employee finance master cards ...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: Employee picker list (xl:col-span-4) */}
          <div className="xl:col-span-4 bg-white border border-slate-200 rounded-[24px] overflow-hidden flex flex-col shadow-premium print:hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mb-2.5">Staff Directory roster</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter by name, serial code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold outline-none transition-all shadow-xs focus:ring-4 focus:ring-indigo-50"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase font-black bg-slate-50/30 text-slate-500">
                    <th 
                      onClick={() => handleSort("name")}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100/80 select-none group"
                    >
                      <div className="flex items-center gap-1">
                        <span>Employee Name</span>
                        {sortField === "name" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("basic")}
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100/80 select-none group text-center"
                    >
                      <div className="flex items-center gap-1 justify-center">
                        <span>Basic Pay</span>
                        {sortField === "basic" ? (
                          sortDirection === "asc" ? <ArrowUp className="w-3 h-3 text-emerald-600" /> : <ArrowDown className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>
                    <th className="py-2.5 px-3 select-none text-center">
                      <span>Status</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {sortedEmployeesForSlip.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400 font-bold bg-slate-50/5">No employees found.</td>
                    </tr>
                  ) : (
                    sortedEmployeesForSlip.map((emp) => {
                      const isSelected = selectedSlipEmp?.empCode === emp.empCode;
                      const status = payslipStatuses[emp.empCode] || "Processed";
                      return (
                        <tr
                          key={emp.empCode}
                          onClick={() => setSelectedSlipEmp(emp)}
                          className={`hover:bg-slate-50/70 transition-colors cursor-pointer border-b border-rose-50/10 ${
                            isSelected 
                              ? "bg-slate-100 border-l-4 border-slate-900 font-bold" 
                              : "odd:bg-white even:bg-slate-50/20"
                          }`}
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-black border uppercase shrink-0 ${
                                isSelected ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-100 border-slate-200 text-slate-800"
                              }`}>
                                {emp.name ? emp.name.split(' ').map((n: string) => n[0]).slice(0,2).join('') : '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-950 text-xs leading-none truncate">{emp.name}</div>
                                <div className="text-[9px] text-slate-400 font-bold font-mono mt-0.5 truncate">{emp.empCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-mono text-[11px] font-extrabold text-slate-800">
                            {formatCurrency(emp.basic)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {renderStatusBadge(status)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel: Interactive Corporate Slip Document Previewer & Printer (xl:col-span-8) */}
          <div className="xl:col-span-8 flex flex-col gap-5">
            
            {/* Advanced Live Slips Configuration Controller */}
            <div className="bg-white border border-slate-200 p-6 rounded-[24px] shadow-premium flex flex-col gap-5 print:hidden">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-600 inline-block"></span>
                  Corporate Payslip Live Controls
                </span>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Customize specific template headers, proration ratios, and ledger adjustments on-the-fly.</p>
              </div>

              {/* Grid 1: Cycle Parameters & Prorating */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Salary Month Cycle</label>
                  <select 
                    value={slipMonth}
                    onChange={(e) => setSlipMonth(e.target.value)}
                    className="w-full text-xs font-black bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-400"
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Billing Year</label>
                  <input 
                    type="number"
                    value={slipYear}
                    onChange={(e) => setSlipYear(e.target.value)}
                    className="w-full text-xs font-black bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Payslip Status</label>
                  <select 
                    value={selectedSlipEmp ? (payslipStatuses[selectedSlipEmp.empCode] || "Processed") : "Processed"}
                    disabled={!selectedSlipEmp}
                    onChange={(e) => {
                      if (selectedSlipEmp) {
                        const newStatus = e.target.value as "Processed" | "Pending" | "Error";
                        setPayslipStatuses(prev => ({
                          ...prev,
                          [selectedSlipEmp.empCode]: newStatus
                        }));
                        localStorage.setItem(`PAYSLIP_STATUS_${selectedSlipEmp.empCode}`, newStatus);
                      }
                    }}
                    className="w-full text-xs font-black bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none text-slate-900 focus:border-indigo-400"
                  >
                    <option value="Processed">Processed</option>
                    <option value="Pending">Pending</option>
                    <option value="Error">Error</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 block">Payable Days</label>
                    <span className="text-[10px] font-black font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">{payableDays} / {daysInMonth} days</span>
                  </div>
                  <input 
                    type="number"
                    min="0"
                    max={daysInMonth}
                    value={payableDays}
                    onChange={(e) => setPayableDays(Math.min(daysInMonth, Math.max(0, Number(e.target.value) || 0)))}
                    className="w-full text-xs font-black bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              {/* Grid 2: Arrears & Deductions Simulations (Only shown/enabled for REGULAR employee types) */}
              <div className={`p-4 rounded-2xl border transition-all ${isConsolType ? 'bg-slate-50 border-slate-200/50 opacity-60' : 'bg-indigo-50/10 border-indigo-100'}`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black uppercase text-indigo-900 tracking-wider">
                    {isConsolType ? "Arrears & Deductions (N/A for Consolidated)" : "Custom Arrears & Deductions (Regular Staff Only)"}
                  </span>
                  {isConsolType && (
                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.2 rounded font-black uppercase uppercase tracking-wider">Fixed Consolidated Sum Only</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3.5">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Basic Arrear (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      disabled={isConsolType}
                      value={basicArrear}
                      onChange={(e) => setBasicArrear(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 0"
                      className="w-full text-xs font-black bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg outline-none disabled:bg-slate-100 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">HRA Arrear (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      disabled={isConsolType}
                      value={hraArrear}
                      onChange={(e) => setHraArrear(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 0"
                      className="w-full text-xs font-black bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg outline-none disabled:bg-slate-100 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Convey Arrear (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      disabled={isConsolType}
                      value={convArrear}
                      onChange={(e) => setConvArrear(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 0"
                      className="w-full text-xs font-black bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg outline-none disabled:bg-slate-100 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-rose-500 uppercase tracking-wide block mb-1">Advance (Adv.) (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      disabled={isConsolType}
                      value={advDeduction}
                      onChange={(e) => setAdvDeduction(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 0"
                      className="w-full text-xs font-black bg-white border border-rose-200 px-2.5 py-1.5 rounded-lg outline-none disabled:bg-slate-100 text-rose-950 focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-rose-500 uppercase tracking-wide block mb-1">Income Tax (I.Tax) (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      disabled={isConsolType}
                      value={itaxDeduction}
                      onChange={(e) => setItaxDeduction(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 0"
                      className="w-full text-xs font-black bg-white border border-rose-200 px-2.5 py-1.5 rounded-lg outline-none disabled:bg-slate-100 text-rose-950 focus:border-rose-400"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-rose-500 uppercase tracking-wide block mb-1">Others (₹)</label>
                    <input 
                      type="number"
                      min="0"
                      disabled={isConsolType}
                      value={othersDeduction}
                      onChange={(e) => setOthersDeduction(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 0"
                      className="w-full text-xs font-black bg-white border border-rose-200 px-2.5 py-1.5 rounded-lg outline-none disabled:bg-slate-100 text-rose-950 focus:border-rose-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payslip actual layout container */}
            {selectedSlipEmp ? (
              <div className="flex flex-col gap-4">
                
                {/* Print Control Bar with Dynamic Theme Choice Selectors */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0e1629] text-white p-4 sm:p-5 rounded-2xl gap-4 shadow-md border border-slate-800 print:hidden animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-2 shrink-0">
                      <Palette className="w-4 h-4 text-indigo-400" />
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Payslip theme:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(themeConfigs) as Array<keyof typeof themeConfigs>).map((tKey) => {
                        const active = payslipTheme === tKey;
                        const cfg = themeConfigs[tKey];
                        return (
                          <button
                            key={tKey}
                            onClick={() => {
                              setPayslipTheme(tKey);
                              localStorage.setItem("PAYSLIP_PREFER_THEME", tKey);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all tracking-wider cursor-pointer ${
                              active 
                                ? "bg-white text-slate-950 shadow-xs font-black" 
                                : "bg-slate-900 text-slate-300 hover:bg-slate-850 border border-slate-800/80 hover:text-white"
                            }`}
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 border border-white/20" 
                              style={{ backgroundColor: cfg.colorHex }}
                            />
                            <span>{cfg.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <button
                      onClick={handlePrint}
                      className="bg-white hover:bg-slate-100 text-slate-950 border border-transparent hover:border-slate-300 px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Slip</span>
                    </button>
                    <button
                      onClick={() => {
                        const waMsg = `Hello ${selectedSlipEmp.name},\n\nYour Yashoda Linen Yarn Ltd payslip for ${slipMonth} ${slipYear} has been generated.\n\nNet Disbursed: ${formatCurrency(totalNetPayable)}\n\nThank you.\nHR Operations`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waMsg)}`, "_blank");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                      title="Send details on WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5 text-white fill-white" />
                      <span>WhatsApp info</span>
                    </button>
                    <a
                      href={`mailto:?subject=Yashoda Payslip for ${slipMonth} ${slipYear}&body=${encodeURIComponent(
                        `Dear ${selectedSlipEmp.name},\n\nPlease find the generated details for your payslip for the month of ${slipMonth} ${slipYear}.\n\nNet Pay Details: ${formatCurrency(totalNetPayable)}\n\nWarm regards,\nHR Department`
                      )}`}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                      title="Send via Email"
                    >
                      <Mail className="w-3.5 h-3.5 text-white" />
                      <span>Email info</span>
                    </a>
                  </div>
                </div>

                {/* Corporate standard Salary Slip Document card */}
                <div 
                  ref={printAreaRef}
                  id="printable-payslip"
                  className="bg-white border border-slate-300 rounded-[24px] p-8 sm:p-10 shadow-lg text-slate-900 relative flex flex-col font-sans"
                >
                  {/* Ledger Border Top Accent */}
                  <div className={`absolute top-0 left-0 right-0 h-2 ${themeConfigs[payslipTheme].topAccent} rounded-t-[24px]`}></div>

                  {/* Company Name and Header Block */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-5 text-center flex flex-col items-center gap-1 select-all">
                    <h2 className="text-2xl font-black text-slate-950 tracking-tight leading-none uppercase font-semibold">
                      YASHODA LINEN YARN LIMITED
                    </h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide mt-1">
                      5 Middleton Street, Kankaria Park, Kolkata, West Bengal - 700071
                    </p>
                    <div className="mt-3">
                      <span className="bg-slate-900 text-white text-[11px] font-black tracking-widest px-4 py-1.5 rounded uppercase font-mono shadow-xs">
                        Payslip for the Month of {slipMonth}, {slipYear}
                      </span>
                    </div>
                  </div>

                  {/* Employee Leave and Details Roster aligned identically as in template columns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-slate-900 p-4 rounded-xl mb-5 font-semibold text-slate-800 text-xs select-all bg-slate-50/10">
                    <div className="space-y-2">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-bold">Employee Name :</span>
                        <span className="font-extrabold text-slate-950 truncate whitespace-nowrap">{selectedSlipEmp.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-bold">Emp ID :</span>
                        <span className="font-black font-mono text-slate-950">{selectedSlipEmp.empCode}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-500 font-bold">Department :</span>
                        <span className="text-slate-950 font-extrabold">{selectedSlipEmp.department}</span>
                      </div>
                    </div>

                    <div className="space-y-2 md:pl-4 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-bold">Designation :</span>
                        <span className="text-slate-950 font-extrabold">{selectedSlipEmp.designation}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-500 font-bold">DOJ :</span>
                        <span className="text-slate-950 font-mono">{selectedSlipEmp.doj || "N/A"}</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span className="text-slate-500 font-bold">Payable days :</span>
                        <span className={`font-black font-mono px-2 py-0.2 rounded border ${themeConfigs[payslipTheme].payableDaysBadge}`}>{payableDays} days</span>
                      </div>
                    </div>
                  </div>

                  {/* Employee Leave Summary Block */}
                  <div className="border border-slate-950 rounded-xl p-3.5 mb-5 bg-slate-50/50">
                    <span className="text-[10px] font-black uppercase text-slate-900 tracking-wider block border-b border-slate-200 pb-1 mb-2.5">
                      Employee Leave Summary
                    </span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-800">
                      <div className="flex justify-between pr-2">
                        <span className="text-slate-500">Used PL :</span>
                        <span className="font-black text-slate-950 font-mono">{leaveInfo.usedPl}</span>
                      </div>
                      <div className="flex justify-between pr-2">
                        <span className="text-slate-500 font-bold">PL Balance :</span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 font-mono">{leaveInfo.plBalance}</span>
                      </div>
                      <div className="flex justify-between pr-2">
                        <span className="text-slate-500">Used SL :</span>
                        <span className="font-black text-slate-950 font-mono">{leaveInfo.usedSl}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-bold">SL Balance :</span>
                        <span className="font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 font-mono">{leaveInfo.slBalance}</span>
                      </div>
                    </div>
                  </div>

                  {/* Earnings, Actual, Payable vs Deductions Spreadsheets Grid */}
                  <div className="border border-slate-950 rounded-xl overflow-hidden mb-5 select-all">
                    {/* Header Columns */}
                    <div className="grid grid-cols-12 bg-slate-100 border-b border-slate-950 text-[10px] font-black uppercase text-slate-900 text-center font-mono py-2.5">
                      <div className="col-span-3 text-left pl-3">Earnings</div>
                      <div className="col-span-2">Actual</div>
                      <div className="col-span-2 border-r border-slate-950">Payable</div>
                      <div className="col-span-3 text-left pl-3">Deductions</div>
                      <div className="col-span-2">Amount</div>
                    </div>

                    {/* Row 1: Basic & P Tax */}
                    <div className="grid grid-cols-12 text-xs font-semibold border-b border-slate-200 items-center">
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">Basic :</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-100 text-slate-500">{formatCurrency(actualBasic)}</div>
                      <div className={`col-span-2 text-center font-mono border-r border-slate-950 text-slate-950 font-extrabold ${themeConfigs[payslipTheme].highlightBg}`}>{formatCurrency(payableBasic)}</div>
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">P Tax :</div>
                      <div className="col-span-2 text-center font-mono text-rose-700">{formatCurrency(finalPTax)}</div>
                    </div>

                    {/* Row 2: H R A & P.F */}
                    <div className="grid grid-cols-12 text-xs font-semibold border-b border-slate-200 items-center">
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">H R A :</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-100 text-slate-500">{formatCurrency(actualHra)}</div>
                      <div className={`col-span-2 text-center font-mono border-r border-slate-950 text-slate-950 font-extrabold ${themeConfigs[payslipTheme].highlightBg}`}>{formatCurrency(payableHra)}</div>
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">P.F :</div>
                      <div className="col-span-2 text-center font-mono text-rose-700">{formatCurrency(finalPf)}</div>
                    </div>

                    {/* Row 3: Convey. & ESI */}
                    <div className="grid grid-cols-12 text-xs font-semibold border-b border-slate-200 items-center">
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">Convey. :</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-100 text-slate-500">{formatCurrency(actualConv)}</div>
                      <div className={`col-span-2 text-center font-mono border-r border-slate-950 text-slate-950 font-extrabold ${themeConfigs[payslipTheme].highlightBg}`}>{formatCurrency(payableConv)}</div>
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">ESI :</div>
                      <div className="col-span-2 text-center font-mono text-rose-700">{formatCurrency(finalEsi)}</div>
                    </div>

                    {/* Row 4: Basic Arrear & Adv. */}
                    <div className="grid grid-cols-12 text-xs font-semibold border-b border-slate-200 items-center">
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">Basic Arrear :</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-100 text-slate-300">₹0</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-950 text-emerald-800 font-extrabold bg-emerald-50/20">{formatCurrency(basicArrear)}</div>
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">Adv. :</div>
                      <div className="col-span-2 text-center font-mono text-rose-700">{formatCurrency(advDeduction)}</div>
                    </div>

                    {/* Row 5: HRA Arrear & I. Tax */}
                    <div className="grid grid-cols-12 text-xs font-semibold border-b border-slate-200 items-center">
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">HRA Arrear :</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-100 text-slate-300">₹0</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-950 text-emerald-800 font-extrabold bg-emerald-50/20">{formatCurrency(hraArrear)}</div>
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">I. Tax :</div>
                      <div className="col-span-2 text-center font-mono text-rose-700">{formatCurrency(itaxDeduction)}</div>
                    </div>

                    {/* Row 6: Convey. Arrear & Others */}
                    <div className="grid grid-cols-12 text-xs font-semibold items-center">
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">Convey. Arrear :</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-100 text-slate-300">₹0</div>
                      <div className="col-span-2 text-center font-mono border-r border-slate-950 text-emerald-800 font-extrabold bg-emerald-50/20">{formatCurrency(convArrear)}</div>
                      <div className="col-span-3 py-2.5 pl-3 border-r border-slate-100 text-slate-700">Others :</div>
                      <div className="col-span-2 text-center font-mono text-rose-700">{formatCurrency(othersDeduction)}</div>
                    </div>
                  </div>

                  {/* Summary Totals area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 text-xs font-extrabold">
                    <div className="border border-slate-950 rounded-xl p-3 flex flex-col gap-2 bg-slate-50/50">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Total Pay :</span>
                        <span className="font-mono">{formatCurrency(totalPay)}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-800 border-t border-slate-200 pt-2 font-black">
                        <span>Gross Pay :</span>
                        <span className="font-mono text-[13px]">{formatCurrency(grossPay)}</span>
                      </div>
                    </div>
                    <div className="border border-slate-950 rounded-xl p-3 flex flex-col justify-center bg-slate-50/50">
                      <div className="flex justify-between items-center text-rose-800 font-black">
                        <span>Total Deduction :</span>
                        <span className="font-mono text-[13px]">-{formatCurrency(totalDeductions)}</span>
                      </div>
                    </div>
                  </div>

                   {/* Premium Net Take-Home Statement */}
                  <div className={`border-2 border-slate-950 rounded-xl p-4 mb-6 ${themeConfigs[payslipTheme].netPayableBg} text-white flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm select-all`}>
                    <div className="text-center md:text-left">
                      <span className={`text-[10px] ${themeConfigs[payslipTheme].netPayableTextLabel} block uppercase tracking-wider font-extrabold`}>
                        Total Net Payable ₹
                      </span>
                      <span className="text-2xl font-black font-mono tracking-tight text-white block mt-0.5">
                        {formatCurrency(totalNetPayable)}
                      </span>
                    </div>
                    <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-white/20 pt-3 md:pt-0 md:pl-5 flex-1 w-full">
                      <span className="text-[9px] text-slate-300 block uppercase tracking-wider font-bold">
                        Amount (In Words) INR:
                      </span>
                      <p className={`font-serif italic text-xs font-semibold ${themeConfigs[payslipTheme].netPayableTextWords} mt-1`}>
                        "{numberToWords(totalNetPayable)}"
                      </p>
                    </div>
                  </div>

                  {/* Signatures region */}
                  <div className="grid grid-cols-2 gap-12 text-xs font-bold text-slate-700 mt-auto pt-16">
                    <div className="text-center">
                      <div className="w-full border-t border-slate-400 pt-3">
                        <span>Staff Member Specimen Signature</span>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">Recipient acknowledgment receipt</p>
                      </div>
                    </div>
                    <div className="text-center font-black">
                      <div className="w-full border-t border-slate-400 pt-3">
                        <span>Executive Authorized Signatory</span>
                        <p className="text-[9px] text-slate-450 font-semibold mt-0.5">Yashoda Linen Yarn Limited payroll division</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200 p-12 rounded-[24px] text-center text-slate-500 font-medium shadow-premium animate-in fade-in block">
                Select an employee from the directory roster on the left to review, customize and print their certified payslip.
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
