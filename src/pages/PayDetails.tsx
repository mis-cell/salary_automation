import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../lib/AuthContext";
import { fetchEmployeeDetails, EmployeeRow } from "../lib/googleSheetsService";
import { FileText, Printer, AlertCircle, Loader2, IndianRupee, Search, ChevronRight, Check, X, ShieldAlert } from "lucide-react";

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

export default function PayDetails() {
  const { accessToken } = useAuth();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering & Interaction
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlipEmp, setSelectedSlipEmp] = useState<EmployeeRow | null>(null);
  const [slipMonth, setSlipMonth] = useState("June");
  const [slipYear, setSlipYear] = useState("2026");
  const [customArrears, setCustomArrears] = useState(0);

  const printAreaRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmployeeDetails();
      setEmployees(data);
      if (data.length > 0 && !selectedSlipEmp) {
        setSelectedSlipEmp(data[0]); // Default first employee selected
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch live employee pay details.");
    } finally {
      setLoading(false);
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

  // Standard printing utility
  const handlePrint = () => {
    window.print();
  };

  // Safe Math Computations base rates
  const selectedBasic = selectedSlipEmp?.basic || 0;
  const selectedHra = selectedSlipEmp?.hra || 0;
  const selectedConv = selectedSlipEmp?.conv || 0;
  const selectedBonus = selectedSlipEmp?.bonus || 0;
  const selectedGratuity = selectedSlipEmp?.gratuity || 0;
  const selectedLta = selectedSlipEmp?.lta || 0;

  // Deductions
  const selectedPf = selectedSlipEmp?.pf || 0;
  const selectedEsi = selectedSlipEmp?.esi || 0;
  const selectedMedi = selectedSlipEmp?.medi || 0;
  const selectedPTax = selectedSlipEmp?.salaryType === "REGULAR" ? 200 : 0; // Std Professional Tax

  // Combined calculations
  const isConsolType = selectedSlipEmp?.salaryType === "CONSOLIDATED";
  const finalGross = isConsolType 
    ? selectedSlipEmp?.grossSalary || selectedBasic 
    : (selectedBasic + selectedHra + selectedConv + selectedBonus + selectedGratuity + selectedLta + customArrears);

  const finalDeductions = isConsolType ? 0 : (selectedPf + selectedEsi + selectedMedi + selectedPTax);
  const finalNet = Math.max(0, finalGross - finalDeductions);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Hide surrounding app elements on print mode */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-payslip, #printable-payslip * {
            visibility: visible;
          }
          #printable-payslip {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">Pay Details & Salary Slips</h1>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">Generate corporate standard salary slips with live word translation and browser print automation.</p>
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Financials</span>
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
          <div className="xl:col-span-4 bg-white border border-slate-250 rounded-[24px] overflow-hidden flex flex-col shadow-xs print:hidden">
            <div className="p-4 border-b border-slate-150 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider mb-2.5">Staff Directory roster</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter by name, serial code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-slate-400 rounded-xl text-xs font-semibold outline-none transition-all shadow-xs"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredEmployees.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold text-xs">No employees found.</div>
              ) : (
                filteredEmployees.map((emp) => {
                  const isSelected = selectedSlipEmp?.empCode === emp.empCode;
                  return (
                    <button
                      key={emp.empCode}
                      onClick={() => setSelectedSlipEmp(emp)}
                      className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
                        isSelected ? "bg-slate-50" : "hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black border ${
                          isSelected ? "bg-slate-900 border-slate-900 text-white" : "bg-slate-100 border-slate-150 text-slate-800"
                        }`}>
                          {emp.name.split(' ').map((n: string) => n[0]).slice(0,2).join('')}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs">{emp.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{emp.empCode} • {emp.designation}</div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? "text-slate-900 translate-x-0.5" : "text-slate-350"}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Interactive Corporate Slip Document Previewer & Printer (xl:col-span-8) */}
          <div className="xl:col-span-8 flex flex-col gap-5">
            
            {/* Live Slips configuration controller */}
            <div className="bg-white border border-slate-250 p-5 rounded-[24px] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Salary Month Cycle</label>
                <select 
                  value={slipMonth}
                  onChange={(e) => setSlipMonth(e.target.value)}
                  className="w-full text-xs font-black bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none"
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
                  className="w-full text-xs font-black bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Simulate Arrears (₹)</label>
                <input 
                  type="number"
                  min="0"
                  value={customArrears}
                  onChange={(e) => setCustomArrears(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="e.g. 1500"
                  className="w-full text-xs font-black bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none"
                />
              </div>
            </div>

            {/* Payslip actual layout container */}
            {selectedSlipEmp ? (
              <div className="flex flex-col gap-4">
                
                {/* Print Control Bar */}
                <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl shadow-xs print:hidden">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4.5 h-4.5 text-slate-300" />
                    <span className="text-xs font-bold text-slate-100">Live preview matches template format</span>
                  </div>
                  <button
                    onClick={handlePrint}
                    className="bg-white hover:bg-slate-150 text-slate-900 border border-transparent hover:border-slate-300 px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Salary Slip</span>
                  </button>
                </div>

                {/* Corporate standard Salary Slip Document card */}
                <div 
                  ref={printAreaRef}
                  id="printable-payslip"
                  className="bg-white border border-slate-300 rounded-[24px] p-8 sm:p-10 shadow-lg text-slate-900 relative flex flex-col font-sans"
                >
                  {/* Decorative Banner */}
                  <div className="border-b-4 border-slate-900 pb-5 mb-6 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-950 tracking-tight select-none">YASHODA ENTERPRISE</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Regd. Office: Secunderabad, Hyderabad, Telangana - 500003</p>
                      <p className="text-[9px] text-slate-400 font-medium lowercase">email: accounts@yashoda.local • contact@yashoda.org</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <span className="bg-slate-100 border border-slate-200 text-slate-900 text-[10px] font-black tracking-widest px-3 py-1.5 rounded uppercase inline-block font-mono">
                        PAYSLIP STATEMENT
                      </span>
                      <p className="text-slate-450 text-[11px] font-extrabold mt-1 text-slate-600 uppercase tracking-wide">
                        Period: {slipMonth} {slipYear}
                      </p>
                    </div>
                  </div>

                  {/* Employee parameters block */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3.5 text-xs border-b border-dashed border-slate-200 pb-5 mb-5 font-semibold text-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">EMPLOYEE CODES</span>
                      <span className="font-mono text-slate-950 font-black">{selectedSlipEmp.empCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">EMPLOYEE NAME</span>
                      <span className="font-extrabold text-slate-950">{selectedSlipEmp.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">DESIGNATION</span>
                      <span className="text-slate-700">{selectedSlipEmp.designation}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">DEPARTMENT</span>
                      <span className="text-slate-700">{selectedSlipEmp.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">DATE OF JOINING</span>
                      <span className="text-slate-700 font-mono text-[11px]">{selectedSlipEmp.doj || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">ROSTER STATUS</span>
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-1.5 py-0.2 rounded uppercase text-[9px] font-black tracking-wider inline-block">
                        {selectedSlipEmp.presentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">SERIAL NUMBER</span>
                      <span className="font-mono text-slate-500">{selectedSlipEmp.serialNumber || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider mb-0.5">PAYROLL CATEGORY</span>
                      <span className="text-slate-950 bg-slate-100 px-2 py-0.2 border border-slate-200 rounded uppercase font-black text-[9px] inline-block">
                        {selectedSlipEmp.salaryType}
                      </span>
                    </div>
                  </div>

                  {/* Earnings vs Deductions Spreadsheet Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 items-start text-xs font-semibold mb-6">
                    
                    {/* Left Column: Earnings */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-1 bg-slate-50/20 px-2 py-1">
                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-wider">EARNINGS BREAKDOWN</span>
                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-wider">AMOUNT (INR)</span>
                      </div>
                      
                      {!isConsolType ? (
                        <>
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                            <span className="text-slate-600">Basic Allowance Rate</span>
                            <span className="font-mono text-slate-900">{formatCurrency(selectedBasic)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                            <span className="text-slate-600">House Rent Allowance (HRA)</span>
                            <span className="font-mono text-slate-900">{formatCurrency(selectedHra)}</span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                            <span className="text-slate-600">Conveyance Allowance</span>
                            <span className="font-mono text-slate-900">{formatCurrency(selectedConv)}</span>
                          </div>
                          {selectedBonus > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                              <span className="text-slate-600">Monthly Performance Bonus</span>
                              <span className="font-mono text-slate-900">{formatCurrency(selectedBonus)}</span>
                            </div>
                          )}
                          {selectedLta > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                              <span className="text-slate-600">Leave Travel Allowance (LTA)</span>
                              <span className="font-mono text-slate-900">{formatCurrency(selectedLta)}</span>
                            </div>
                          )}
                          {selectedGratuity > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                              <span className="text-slate-600">Gratuity Accumulation</span>
                              <span className="font-mono text-slate-900">{formatCurrency(selectedGratuity)}</span>
                            </div>
                          )}
                          {customArrears > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 text-emerald-800 font-bold bg-emerald-50/20">
                              <span>Simulated Arrears</span>
                              <span className="font-mono">+{formatCurrency(customArrears)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-slate-500 font-medium">
                          Consolidated employees receive a fixed master sum rate: <strong className="text-slate-950 font-black">{formatCurrency(finalGross)}</strong>
                        </div>
                      )}

                    </div>

                    {/* Right Column: Deductions */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-1 bg-slate-50/20 px-2 py-1">
                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-wider">DEDUCTIONS BREAKDOWN</span>
                        <span className="text-[10px] font-black text-slate-950 uppercase tracking-wider">AMOUNT (INR)</span>
                      </div>

                      {!isConsolType ? (
                        <>
                          {selectedPf > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                              <span className="text-rose-800">Provident Fund (P.F) Contrib</span>
                              <span className="font-mono text-rose-700">-{formatCurrency(selectedPf)}</span>
                            </div>
                          )}
                          {selectedEsi > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                              <span className="text-rose-800">State Insurance (E.S.I) Contrib</span>
                              <span className="font-mono text-rose-700">-{formatCurrency(selectedEsi)}</span>
                            </div>
                          )}
                          {selectedMedi > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                              <span className="text-rose-800">Mediclaim Premium Deduction</span>
                              <span className="font-mono text-rose-700">-{formatCurrency(selectedMedi)}</span>
                            </div>
                          )}
                          {selectedPTax > 0 && (
                            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 px-2 font-medium">
                              <span className="text-rose-800">Professional Tax (P.Tax Status)</span>
                              <span className="font-mono text-rose-700">-{formatCurrency(selectedPTax)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl text-slate-500 font-medium flex items-center gap-1.5">
                          <span>Verified - Consolidated staff aren't subject to PF/ESI system deductions.</span>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* Summary Totals area */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center select-none">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Total Gross Remuneration</span>
                      <span className="text-lg font-black tracking-tight block font-mono">{formatCurrency(finalGross)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-0.5">Total Authorized Deductions</span>
                      <span className="text-lg font-black tracking-tight block text-rose-300 font-mono">-{formatCurrency(finalDeductions)}</span>
                    </div>
                    <div className="bg-white/10 p-2 rounded-lg border border-white/15">
                      <span className="text-[10px] text-indigo-200 block font-bold uppercase tracking-wider mb-0.5">NET TAKE-HOME DISBURSED</span>
                      <span className="text-xl font-black tracking-tight block text-emerald-400 font-mono">{formatCurrency(finalNet)}</span>
                    </div>
                  </div>

                  {/* Net Payable in words */}
                  <div className="border-y border-dashed border-slate-200 py-3 mb-8 font-serif italic text-slate-700 text-center text-xs">
                    <span className="text-[9px] font-black uppercase text-slate-400 block not-italic tracking-wider mb-1">Take-Home Amount in certified words:</span>
                    "{numberToWords(finalNet)}"
                  </div>

                  {/* Signatures region */}
                  <div className="grid grid-cols-2 gap-12 text-xs font-bold text-slate-700 mt-auto pt-16">
                    <div className="text-center">
                      <div className="w-full border-t border-slate-300 pt-3">
                        <span>Staff Member Specimen Signature</span>
                        <p className="text-[9px] text-slate-400 font-medium">Recipient acknowledgment receipt</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="w-full border-t border-slate-300 pt-3">
                        <span>Executive Authorized Signatory</span>
                        <p className="text-[9px] text-slate-400 font-medium">Yashoda Enterprise payroll division</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-250 p-12 rounded-[24px] text-center text-slate-400 font-bold block">
                Select an employee from the directory list on the left to review their corporate salary slip.
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
