import React, { useState, useEffect } from "react";
import { 
  UserPlus, Search, Filter, Loader2, AlertCircle, ChevronDown, CheckCircle, 
  Trash2, Edit3, Plus, X, Coins, HeartHandshake, CalendarDays, Info, Sparkles, 
  Copy, FileSpreadsheet, Check, Undo, Eye, Download, Users, Mail, UserCheck,
  ArrowUpDown, ArrowUp, ArrowDown
} from "lucide-react";
import { 
  fetchEmployeeDetails, 
  EmployeeRow,
  getLocalEmployees,
  saveLocalEmployees,
  getDeletedEmpCodes,
  saveDeletedEmpCodes
} from "../lib/googleSheetsService";
import ConfirmDialog from "../components/ConfirmDialog";

interface FormFields {
  serialNumber: string;
  empCode: string;
  name: string;
  salaryType: string;
  department: string;
  designation: string;
  presentStatus: string;
  doj: string;
  basic: number;
  hra: number;
  conv: number;
  grossSalary: number;
  pf: number;
  esi: number;
  medi: number;
  pl: number;
  lta: number;
  bonus: number;
  gratuity: number;
  ctcPerMonth: number;
}

const initialFormValues: FormFields = {
  serialNumber: "",
  empCode: "",
  name: "",
  salaryType: "REGULAR",
  department: "",
  designation: "",
  presentStatus: "ACTIVE",
  doj: "",
  basic: 0,
  hra: 0,
  conv: 0,
  grossSalary: 0,
  pf: 0,
  esi: 0,
  medi: 0,
  pl: 0,
  lta: 0,
  bonus: 0,
  gratuity: 0,
  ctcPerMonth: 0
};

export default function ManageEmployees() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "REGULAR" | "CONSOLIDATED" | "ACTIVE" | "INACTIVE">("ALL");
  
  // Sorting State
  const [sortField, setSortField] = useState<keyof EmployeeRow>("serialNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Custom Confirmations
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [empToDelete, setEmpToDelete] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Custom Interaction state
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRow | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [formValues, setFormValues] = useState<FormFields>(initialFormValues);
  const [formErrors, setFormErrors] = useState<string | null>(null);
  const [activeFormTab, setActiveFormTab] = useState<"info" | "earnings" | "deductions" | "other">("info");
  
  const [showSyncInfo, setShowSyncInfo] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [localChangesCount, setLocalChangesCount] = useState(0);

  // Sync state stats from localStorage
  const calculateChangeStats = () => {
    const editsCount = getLocalEmployees().length;
    const delsCount = getDeletedEmpCodes().length;
    setLocalChangesCount(editsCount + delsCount);
  };

  const loadWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmployeeDetails();
      setEmployees(data);
      calculateChangeStats();
      // Retain selected employee focus if already present
      if (selectedEmp) {
        const fresh = data.find(e => e.empCode === selectedEmp.empCode);
        if (fresh) setSelectedEmp(fresh);
      }
    } catch (err: any) {
      setError(err.message || "Failed to sync employee directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  // Filter staff based on criteria
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "ALL") return matchesSearch;
    if (filterType === "REGULAR") return matchesSearch && emp.salaryType === "REGULAR";
    if (filterType === "CONSOLIDATED") return matchesSearch && (emp.salaryType === "CONSOLIDATED" || emp.salaryType === "COSOLIDATED");
    if (filterType === "ACTIVE") return matchesSearch && emp.presentStatus === "ACTIVE";
    if (filterType === "INACTIVE") return matchesSearch && emp.presentStatus === "INACTIVE";
    return matchesSearch;
  });

  const handleSort = (field: keyof EmployeeRow) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
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

  const handleOpenAdd = () => {
    // Generate high serial number suggestions
    const maxSerial = employees.reduce((acc, current) => {
      const parsed = parseInt(current.serialNumber);
      return isNaN(parsed) ? acc : Math.max(acc, parsed);
    }, 0);
    
    setModalMode("ADD");
    setFormValues({
      ...initialFormValues,
      serialNumber: String(maxSerial + 1),
      empCode: `YE${String(employees.length + 11).padStart(3, "0")}`
    });
    setFormErrors(null);
    setActiveFormTab("info");
    setShowModal(true);
  };

  const handleOpenEdit = (emp: EmployeeRow) => {
    setModalMode("EDIT");
    setFormValues({
      serialNumber: emp.serialNumber,
      empCode: emp.empCode,
      name: emp.name,
      salaryType: emp.salaryType === "CONSOLIDATED" ? "CONSOLIDATED" : "REGULAR",
      department: emp.department,
      designation: emp.designation,
      presentStatus: emp.presentStatus === "ACTIVE" ? "ACTIVE" : "INACTIVE",
      doj: emp.doj,
      basic: emp.basic,
      hra: emp.hra,
      conv: emp.conv,
      grossSalary: emp.grossSalary,
      pf: emp.pf,
      esi: emp.esi,
      medi: emp.medi,
      pl: emp.pl,
      lta: emp.lta,
      bonus: emp.bonus,
      gratuity: emp.gratuity,
      ctcPerMonth: emp.ctcPerMonth
    });
    setFormErrors(null);
    setActiveFormTab("info");
    setShowModal(true);
  };

  // Auto-calculate allowances while typing
  useEffect(() => {
    if (formValues.salaryType === "REGULAR") {
      const basic = Number(formValues.basic) || 0;
      // Auto-compute standard allocations: HRA is usually 50% of basic, conv standard, Gross = basic + hra + conv
      const computedHra = Math.round(basic * 0.5);
      const computedConv = Number(formValues.conv) || 1600; // default standard conveyance helper
      const gross = basic + computedHra + computedConv;
      
      // Auto-compute standard deductions: PF (12% of basic or standard 1800 cap), ESI (0.75% of Gross)
      const computedPf = Math.min(1800, Math.round(basic * 0.12));
      const computedEsi = gross < 21000 ? Math.round(gross * 0.0075) : 0;
      
      // Leave PL accruals, Mediclaims etc, keep existing unless modified
      const gratuity = Math.round(basic * 0.0481); // standard 15/26/12 pro-rata
      const ctc = gross + computedPf + gratuity;

      setFormValues(v => ({
        ...v,
        hra: v.hra === 0 ? computedHra : v.hra,
        conv: v.conv === 0 ? computedConv : v.conv,
        grossSalary: gross,
        pf: v.pf === 0 ? computedPf : v.pf,
        esi: v.esi === 0 ? computedEsi : v.esi,
        gratuity: v.gratuity === 0 ? gratuity : v.gratuity,
        ctcPerMonth: v.ctcPerMonth === 0 ? ctc : v.ctcPerMonth
      }));
    } else {
      // Consolidated
      const gross = Number(formValues.basic) || 0;
      setFormValues(v => ({
        ...v,
        hra: 0,
        conv: 0,
        grossSalary: gross,
        pf: 0,
        esi: 0,
        ctcPerMonth: gross
      }));
    }
  }, [formValues.basic, formValues.salaryType]);

  const handleUpdateField = (field: keyof FormFields, val: any) => {
    setFormValues(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors(null);

    // Validate inputs
    if (!formValues.name.trim()) {
      setFormErrors("Staff Full Name is required.");
      return;
    }
    if (!formValues.empCode.trim()) {
      setFormErrors("Employee Code is required.");
      return;
    }

    const localList = getLocalEmployees();

    if (modalMode === "ADD") {
      // Check code uniqueness across both state and sheets
      const matchesCode = employees.some(emp => emp.empCode.toUpperCase() === formValues.empCode.toUpperCase());
      if (matchesCode) {
        setFormErrors(`Employee code "${formValues.empCode}" is already designated to an active personnel record.`);
        return;
      }

      // Add to overrides
      const payload: EmployeeRow = {
        ...formValues,
        empCode: formValues.empCode.trim().toUpperCase()
      };
      
      const updated = [...localList, payload];
      saveLocalEmployees(updated);
    } else {
      // Edit
      const payload: EmployeeRow = {
        ...formValues,
        empCode: formValues.empCode.trim().toUpperCase()
      };

      const filtered = localList.filter(le => le.empCode !== payload.empCode);
      const updated = [...filtered, payload];
      saveLocalEmployees(updated);
    }

    // Un-delete locally if it was deleted previously
    const deletedCodes = getDeletedEmpCodes();
    if (deletedCodes.includes(formValues.empCode.toUpperCase())) {
      saveDeletedEmpCodes(deletedCodes.filter(c => c !== formValues.empCode.toUpperCase()));
    }

    setShowModal(false);
    setSelectedEmp(formValues as any);
    loadWorkers();
  };

  const handleDeleteEmployee = (empCode: string) => {
    setEmpToDelete(empCode);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDeleteEmployee = () => {
    if (!empToDelete) return;
    setDeleteConfirmOpen(false);

    // Save as deleted code
    const deletedList = getDeletedEmpCodes();
    if (!deletedList.includes(empToDelete.toUpperCase())) {
      saveDeletedEmpCodes([...deletedList, empToDelete.toUpperCase()]);
    }

    // Erase if was previously added to overrides
    const localList = getLocalEmployees();
    saveLocalEmployees(localList.filter(le => le.empCode !== empToDelete.toUpperCase()));

    setEmpToDelete(null);
    setSelectedEmp(null);
    loadWorkers();
  };

  // Erase client overlays to match Google Sheet exact payload
  const handleResetOverrides = () => {
    setResetConfirmOpen(true);
  };

  const handleConfirmResetOverrides = () => {
    setResetConfirmOpen(false);
    localStorage.removeItem("YASHODA_EMPLOYEES_OVERRIDE");
    localStorage.removeItem("YASHODA_EMPLOYEES_DELETED");
    setSelectedEmp(null);
    loadWorkers();
  };

  const handleCopySyncCode = () => {
    // Generate easy CSV layout representing custom additions/edits
    const customList = getLocalEmployees();
    if (customList.length === 0) {
      alert("No local overrides found! Your roster perfectly matches the Google Sheet 'emp_details'.");
      return;
    }

    const headers = [
      "SERIAL_NUMBER", "EMP_CODE", "NAME", "SALARY_TYPE", "DEPARTMENT", "DESIGNATION", 
      "PRESENT_STATUS", "DOJ", "BASIC", "HRA", "CONV", "GROSS_SALARY", "P.F", "ESI", 
      "MEDI", "PL", "LTA", "BONUS", "GRATUITY", "CTC_PER_MONTH"
    ];
    
    const rowsCsv = customList.map(e => [
      e.serialNumber, e.empCode, e.name, e.salaryType, e.department, e.designation,
      e.presentStatus, e.doj, e.basic, e.hra, e.conv, e.grossSalary, e.pf, e.esi,
      e.medi, e.pl, e.lta, e.bonus, e.gratuity, e.ctcPerMonth
    ].join(","));

    const fullPayload = [headers.join(","), ...rowsCsv].join("\n");
    navigator.clipboard.writeText(fullPayload);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Upper Title Section */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-8 h-8 text-indigo-600" />
            Personnel Directory
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-semibold">
            Manage comprehensive employee master data, wages structure, statutory rates, allowances, and annual leaves overlay.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={loadWorkers}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-2xl transition-all shadow-xs flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Undo className="w-4 h-4" />}
            <span>Refresh Roster</span>
          </button>

          {localChangesCount > 0 && (
            <button 
              onClick={handleResetOverrides}
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black border border-amber-200 rounded-2xl transition-all shadow-sm flex items-center gap-1.5"
              title="Reset client edits back to match Google Sheet"
            >
              <Undo className="w-4 h-4" />
              <span>Clear browser edits ({localChangesCount})</span>
            </button>
          )}

          <button 
            onClick={() => setShowSyncInfo(!showSyncInfo)}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-black border border-indigo-100 rounded-2xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Sheet Synchronization</span>
          </button>

          <button 
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-[#0c1322] hover:bg-[#1a253d] text-white text-xs font-black rounded-2xl transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee Profile</span>
          </button>
        </div>
      </div>

      {/* Sync Synchronization Drawer / Guide Panel */}
      {showSyncInfo && (
        <div className="bg-slate-50 border border-slate-200 p-6 rounded-[24px] shadow-sm animate-in slide-in-from-top-4 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h3 className="text-sm font-extrabold text-slate-900">How to write back / update Google Spreadsheet</h3>
            </div>
            <button onClick={() => setShowSyncInfo(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-xs text-slate-600 font-medium space-y-2 leading-relaxed">
            <p>
              By default, web browsers only have <strong className="text-slate-900">read-only</strong> access to query shared spreadsheets directly. Edits made above are safely stored in your browser's local sandbox memory instantly.
            </p>
            <p className="font-extrabold text-slate-900 text-[11px] mt-2">
              To apply your web-created staff additions/edits directly into your spreadsheet:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                <div className="font-extrabold text-slate-800 flex items-center gap-1">
                  1. Download CSV representation
                </div>
                <p className="text-slate-500 text-[11px]">
                  Copy the added records raw CSV payload so you can easily append it at the end of the <strong className="font-semibold text-slate-700">"emp_details"</strong> sheet.
                </p>
                <button
                  onClick={handleCopySyncCode}
                  className="mt-2 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText ? "Copied Rows Data!" : "Copy Overrides CSV Rows to Clipboard"}
                </button>
              </div>

              <div className="bg-white p-4 border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                <div className="font-extrabold text-slate-800 flex items-center gap-1">
                  2. Double-Click Cell edit matches
                </div>
                <p className="text-slate-500 text-[11px]">
                  Alternatively, you can modify cells directly on your Google Drive spreadsheet using their native grid editor. Changes will fetch immediately.
                </p>
                <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-50 p-2 border border-slate-100 rounded select-all truncate">
                  Sheet name required: emp_details
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-[20px] flex gap-4 items-start shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm mb-1">Spreadsheet Sync Issue</h3>
            <p className="text-rose-700 text-xs leading-relaxed font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Roster & Detail Panel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* staff Table List Panel */}
        <div className={`bg-white rounded-[24px] border border-slate-200/80 shadow-[0_12px_44px_-16px_rgba(40,20,90,0.04)] overflow-hidden flex flex-col ${selectedEmp ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          
          {/* Filtering operations */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search staff by name, code, department, role..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-xl text-xs font-semibold outline-none transition-all text-slate-950 shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs bg-slate-100 w-5 h-5 flex items-center justify-center rounded-full">×</button>
              )}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-56">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs font-black rounded-xl outline-none transition-all shadow-sm appearance-none cursor-pointer focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 hover:bg-slate-50/50"
                >
                  <option value="ALL">All Registered Staff ({employees.length})</option>
                  <option value="REGULAR">Regular Wages Only ({employees.filter(e => e.salaryType === 'REGULAR').length})</option>
                  <option value="CONSOLIDATED">Consolidated Wages Only ({employees.filter(e => e.salaryType === 'CONSOLIDATED').length})</option>
                  <option value="ACTIVE">Status: Active ({employees.filter(e => e.presentStatus === 'ACTIVE').length})</option>
                  <option value="INACTIVE">Status: Inactive ({employees.filter(e => e.presentStatus === 'INACTIVE').length})</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Directory Listings */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 bg-slate-50/10">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
              <p className="text-slate-500 font-bold text-xs">Assembling full master profiles catalog...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-450 bg-slate-50/40 text-slate-500">
                    {(() => {
                      const renderSortHeader = (label: string, field: keyof EmployeeRow, align: "left" | "center" = "left", widthClass?: string) => {
                        const isActive = sortField === field;
                        return (
                          <th 
                            onClick={() => handleSort(field)} 
                            className={`py-3 px-4 cursor-pointer hover:bg-slate-100/85 transition-all select-none hover:text-slate-900 group ${widthClass || ""}`}
                          >
                            <div className={`flex items-center gap-1.5 ${align === "center" ? "justify-center" : "justify-start"}`}>
                              <span className="font-sans font-black text-[10px] uppercase tracking-wider text-slate-400 group-hover:text-slate-705 duration-150">{label}</span>
                              {isActive ? (
                                sortDirection === "asc" ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-indigo-650 text-indigo-600 shrink-0" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5 text-indigo-650 text-indigo-600 shrink-0" />
                                )
                              ) : (
                                <ArrowUpDown className="w-2.5 h-2.5 text-slate-350 text-slate-300 group-hover:text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                              )}
                            </div>
                          </th>
                        );
                      };
                      return (
                        <>
                          {renderSortHeader("Sl", "serialNumber", "center", "w-[60px]")}
                          {renderSortHeader("Employee Name", "name", "left", "w-[240px]")}
                          {renderSortHeader("Code", "empCode", "center", "w-[100px]")}
                          {renderSortHeader("Type", "salaryType", "center", "w-[110px]")}
                          {renderSortHeader("Department", "department", "left", "w-[155px]")}
                          {renderSortHeader("Designation", "designation", "left", "w-[160px]")}
                          {renderSortHeader("Basic", "basic", "center", "w-[120px]")}
                          {renderSortHeader("Status", "presentStatus", "center", "w-[100px]")}
                        </>
                      );
                    })()}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {sortedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-20 text-center text-slate-400 font-bold bg-slate-50/5">No registered employees found matching criteria. If empty, check sheet connection settings.</td>
                    </tr>
                  ) : (
                    sortedEmployees.map((emp) => {
                      const isFocused = selectedEmp?.empCode === emp.empCode;
                      return (
                        <tr 
                          key={emp.empCode} 
                          onClick={() => setSelectedEmp(emp)}
                          className={`hover:bg-slate-50/70 transition-all cursor-pointer border-b border-rose-50/20 ${
                            isFocused 
                              ? "bg-slate-100/90 border-l-4 border-slate-900 font-bold" 
                              : "odd:bg-white even:bg-slate-50/20"
                          }`}
                        >
                          <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-400 font-bold">
                            {emp.serialNumber}
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 font-black text-xs shrink-0 border border-slate-200">
                                {emp.name ? emp.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-extrabold text-slate-950 text-sm leading-none truncate">{emp.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-600 font-bold">
                            {emp.empCode}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                              emp.salaryType === 'REGULAR' 
                                ? 'bg-slate-100 text-slate-800 border-slate-200' 
                                : 'bg-indigo-50 text-indigo-805 border-indigo-100'
                            }`}>
                              {emp.salaryType}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-extrabold text-slate-500 truncate text-[11px]">
                            {emp.department}
                          </td>
                          <td className="py-2.5 px-4 text-slate-800 truncate text-[11px]">
                            {emp.designation}
                          </td>
                          <td className="py-2.5 px-4 text-center font-extrabold text-slate-950">
                            {formatCurrency(emp.basic)}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              emp.presentStatus === 'ACTIVE' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                              <span className={`w-1 h-1 rounded-full ${emp.presentStatus === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                              {emp.presentStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Employee profile details slide out */}
        {selectedEmp && (
          <div className="bg-white rounded-[24px] border border-slate-205 shadow-xl overflow-hidden flex flex-col gap-6 p-6 animate-in slide-in-from-right-4 duration-300 border border-slate-200">
            <div className="flex items-start justify-between">
              <h2 className="text-base font-extrabold text-slate-900">Worker Master Profile</h2>
              <button 
                onClick={() => setSelectedEmp(null)}
                className="p-1 px-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-xs font-bold transition-all"
              >
                Close ×
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-[20px] flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-[20px] flex items-center justify-center text-xl font-black mb-3">
                {selectedEmp.name ? selectedEmp.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '?'}
              </div>
              <h3 className="font-black text-slate-950 text-lg leading-tight">{selectedEmp.name}</h3>
              <p className="text-slate-500 text-xs font-semibold mt-1 inline-block">{selectedEmp.designation} • {selectedEmp.department}</p>
              
              <div className="flex items-center gap-2 mt-4">
                <span className="font-mono text-[10px] text-slate-600 bg-slate-200/60 rounded px-2 py-0.5 font-bold">
                  Code: {selectedEmp.empCode}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  selectedEmp.presentStatus === 'ACTIVE'
                    ? 'bg-emerald-55 bg-emerald-50 text-emerald-800 border-emerald-100'
                    : 'bg-slate-50 text-slate-500 border-slate-200'
                }`}>
                  {selectedEmp.presentStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
              <button 
                onClick={() => handleOpenEdit(selectedEmp)}
                className="w-full bg-[#0c1322] hover:bg-[#1a253d] text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button 
                onClick={() => handleDeleteEmployee(selectedEmp.empCode)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all border border-rose-100"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Profile
              </button>
            </div>

            {/* Comprehensive details catalog displaying all 20 fields */}
            <div className="flex flex-col gap-5 overflow-y-auto max-h-[480px] pr-1">
              
              {/* Category 1: Position details */}
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Position & System Tags
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">SERIAL NUMBER</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{selectedEmp.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">DATE OF JOINING</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{selectedEmp.doj || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">DEPT GENERAL</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{selectedEmp.department}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">SALARY DESIGN</span>
                    <span className="text-indigo-700 font-black block mt-0.5">{selectedEmp.salaryType}</span>
                  </div>
                </div>
              </div>

              {/* Category 2: Earnings and rates */}
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                  <Coins className="w-3 h-3" /> Base Wages & Allowances
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">BASIC / STIPEND</span>
                    <span className="text-slate-900 font-black block mt-0.5 text-sm">{formatCurrency(selectedEmp.basic)}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">HRA RATE</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{formatCurrency(selectedEmp.hra)}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">CONVEYANCE</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{formatCurrency(selectedEmp.conv)}</span>
                  </div>
                  <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 block text-[10.5px] font-black">GROSS PER MONTH</span>
                    <span className="text-emerald-950 font-black block mt-0.5 text-sm">{formatCurrency(selectedEmp.grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Category 3: Statutory & Deductions */}
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                  <HeartHandshake className="w-3 h-3" /> Deductions & Contributions
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">PROVIDENT FUND (P.F)</span>
                    <span className="text-rose-700 font-black block mt-0.5">{formatCurrency(selectedEmp.pf)}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">ESI CONTRIBUTION</span>
                    <span className="text-rose-700 font-black block mt-0.5">{formatCurrency(selectedEmp.esi)}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">MEDICLAIM (MEDI)</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{formatCurrency(selectedEmp.medi)}</span>
                  </div>
                </div>
              </div>

              {/* Category 4: leaves & accruals */}
              <div className="space-y-2">
                <div className="text-[10px] font-black uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> leaves & Annual CTC Accruals
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">PRIVILEGE LEAVES (PL)</span>
                    <span className="text-slate-900 font-black block mt-0.5 text-[13px]">{selectedEmp.pl} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">LTA RATE</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{formatCurrency(selectedEmp.lta)}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">MONTHLY BONUS EST</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{formatCurrency(selectedEmp.bonus)}</span>
                  </div>
                  <div>
                    <span className="text-slate-450 block text-[10.5px] text-slate-400 font-bold">GRATUITY ACCRUED</span>
                    <span className="text-slate-900 font-extrabold block mt-0.5">{formatCurrency(selectedEmp.gratuity)}</span>
                  </div>
                  <div className="col-span-2 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <span className="text-indigo-800 block text-[10px] font-black">ESTIMATED CTC PER MONTH</span>
                    <span className="text-indigo-950 font-black block mt-0.5 text-base">{formatCurrency(selectedEmp.ctcPerMonth)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Edit or Add Employee Popup Screen */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[28px] max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  {modalMode === "ADD" ? "Register New Employee Profile" : "Modify Staff Profile Details"}
                </h2>
                <p className="text-slate-500 text-xs mt-1 font-semibold">
                  Specify parameters reflecting all 20 columns of your Google spreadsheet database.
                </p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-black text-xl w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-150 bg-slate-100"
              >
                ×
              </button>
            </div>

            {/* Diagnostic Error Label */}
            {formErrors && (
              <div className="bg-rose-50 border-y border-rose-100 p-4 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{formErrors}</span>
              </div>
            )}

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-slate-100 text-xs font-bold text-slate-500 bg-white">
              <button 
                type="button"
                onClick={() => setActiveFormTab("info")} 
                className={`flex-1 py-3 border-b-2 text-center transition-all ${
                  activeFormTab === "info" ? "border-slate-900 text-slate-950 font-black" : "border-transparent hover:text-slate-800"
                }`}
              >
                1. General Info
              </button>
              <button 
                type="button"
                onClick={() => setActiveFormTab("earnings")} 
                className={`flex-1 py-3 border-b-2 text-center transition-all ${
                  activeFormTab === "earnings" ? "border-slate-900 text-slate-950 font-black" : "border-transparent hover:text-slate-800"
                }`}
              >
                2. Base & Allowances
              </button>
              <button 
                type="button"
                onClick={() => setActiveFormTab("deductions")} 
                className={`flex-1 py-3 border-b-2 text-center transition-all ${
                  activeFormTab === "deductions" ? "border-slate-900 text-slate-950 font-black" : "border-transparent hover:text-slate-800"
                }`}
              >
                3. Contributors
              </button>
              <button 
                type="button"
                onClick={() => setActiveFormTab("other")} 
                className={`flex-1 py-3 border-b-2 text-center transition-all ${
                  activeFormTab === "other" ? "border-slate-900 text-slate-950 font-black" : "border-transparent hover:text-slate-800"
                }`}
              >
                4. Leaves & CTC
              </button>
            </div>

            {/* Modal Scrollable Contents */}
            <form onSubmit={handleSaveEmployee} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
              
              {/* TAB 1: GENERAL INFO */}
              {activeFormTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Worker Full Name *</label>
                      <input 
                        type="text" 
                        required
                        value={formValues.name} 
                        onChange={(e) => handleUpdateField("name", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="Ashok Kumar"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Employee Code (Unique Key) *</label>
                      <input 
                        type="text" 
                        required
                        disabled={modalMode === "EDIT"}
                        value={formValues.empCode} 
                        onChange={(e) => handleUpdateField("empCode", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-mono font-black text-slate-950 bg-slate-50/50 disabled:bg-slate-100 disabled:text-slate-400 shadow-xs outline-none"
                        placeholder="e.g. YE015"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Serial Number Identifier</label>
                      <input 
                        type="text" 
                        value={formValues.serialNumber} 
                        onChange={(e) => handleUpdateField("serialNumber", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 15"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Registered Department</label>
                      <input 
                        type="text" 
                        value={formValues.department} 
                        onChange={(e) => handleUpdateField("department", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. PRODUCTION"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Designation / Role Title</label>
                      <input 
                        type="text" 
                        value={formValues.designation} 
                        onChange={(e) => handleUpdateField("designation", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. MACHINE OPERATOR"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Joined Date (DOJ)</label>
                      <input 
                        type="text" 
                        value={formValues.doj} 
                        onChange={(e) => handleUpdateField("doj", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-medium text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 14/08/2022"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Roster status</label>
                      <select 
                        value={formValues.presentStatus} 
                        onChange={(e) => handleUpdateField("presentStatus", e.target.value)}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black text-slate-950 shadow-xs outline-none appearance-none cursor-pointer"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Wages category structure</label>
                      <div className="grid grid-cols-2 gap-3 mt-1.5">
                        <label className={`border border-slate-200 p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                          formValues.salaryType === "REGULAR" ? "bg-slate-900 text-white font-bold" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}>
                          <input 
                            type="radio" 
                            name="salaryTypeOpt" 
                            checked={formValues.salaryType === "REGULAR"}
                            onChange={() => handleUpdateField("salaryType", "REGULAR")}
                            className="hidden"
                          />
                          <div>
                            <div className="text-xs font-black">REGULAR WAGES</div>
                            <div className="text-[9px] font-normal leading-none mt-1 opacity-85">Includes HRA, Conv, PF, ESI components</div>
                          </div>
                        </label>

                        <label className={`border border-slate-200 p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                          formValues.salaryType === "CONSOLIDATED" ? "bg-slate-900 text-white font-bold" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}>
                          <input 
                            type="radio" 
                            name="salaryTypeOpt" 
                            checked={formValues.salaryType === "CONSOLIDATED"}
                            onChange={() => handleUpdateField("salaryType", "CONSOLIDATED")}
                            className="hidden"
                          />
                          <div>
                            <div className="text-xs font-black">CONSOLIDATED WAGES</div>
                            <div className="text-[9px] font-normal leading-none mt-1 opacity-85">Single flat rate, no mandatory PF/ESI</div>
                          </div>
                        </label>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: BASE & ALLOWANCES */}
              {activeFormTab === "earnings" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                        {formValues.salaryType === "CONSOLIDATED" ? "Fixed Consolidated Salary (₹)" : "Wages Basic rate per month (₹) *"}
                      </label>
                      <input 
                        type="number" 
                        required
                        value={formValues.basic} 
                        onChange={(e) => handleUpdateField("basic", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-sm font-black text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 15000"
                      />
                    </div>

                    {formValues.salaryType === "REGULAR" && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">House Rent Allowance (HRA) (₹)</label>
                          <input 
                            type="number" 
                            value={formValues.hra} 
                            onChange={(e) => handleUpdateField("hra", Number(e.target.value) || 0)}
                            className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                            placeholder="e.g. 7500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Conveyance Allowances (₹)</label>
                          <input 
                            type="number" 
                            value={formValues.conv} 
                            onChange={(e) => handleUpdateField("conv", Number(e.target.value) || 1600)}
                            className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                            placeholder="e.g. 1600"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5 col-span-2 bg-emerald-50 border border-emerald-150 p-4 rounded-2xl">
                      <label className="text-[10px] font-black uppercase tracking-wider block text-emerald-800">Auto-Computed Gross Salary (Rate per Month)</label>
                      <div className="text-xl font-black text-emerald-950 mt-1 flex items-baseline gap-1">
                        {formatCurrency(formValues.grossSalary)}
                        <span className="text-[10px] font-bold text-emerald-650 text-slate-500">Scheduled Gross</span>
                      </div>
                      <p className="text-[10px] text-emerald-700 mt-1.5 font-medium leading-none">
                        Computed dynamically as: {formValues.salaryType === "CONSOLIDATED" ? "Consolidated Flat" : "Basic Rate + HRA Allowance + Conveyance Stipend."}
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 3: DEDUCTIONS & CONTRIBUTORS */}
              {activeFormTab === "deductions" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Provident Fund (P.F) deduction (₹)</label>
                      <input 
                        type="number" 
                        value={formValues.pf} 
                        onChange={(e) => handleUpdateField("pf", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 1800"
                        disabled={formValues.salaryType === "CONSOLIDATED"}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">ESI Contribution rate (₹)</label>
                      <input 
                        type="number" 
                        value={formValues.esi} 
                        onChange={(e) => handleUpdateField("esi", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 113"
                        disabled={formValues.salaryType === "CONSOLIDATED"}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Mediclaim Allocation Accrued (Medi)</label>
                      <input 
                        type="number" 
                        value={formValues.medi} 
                        onChange={(e) => handleUpdateField("medi", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 0"
                      />
                    </div>

                    <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl text-[11px] text-rose-800 leading-relaxed font-semibold col-span-2">
                       PF & ESI parameters are auto-calculated according to standard corporate laws based on Gross wage limits but can be overridden above permanently.
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 4: LEAVES & CTC */}
              {activeFormTab === "other" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Privilege Leaves (PL) Initial Balance</label>
                      <input 
                        type="number" 
                        value={formValues.pl} 
                        onChange={(e) => handleUpdateField("pl", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-black text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 15"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Leave Travel Allowance (LTA)</label>
                      <input 
                        type="number" 
                        value={formValues.lta} 
                        onChange={(e) => handleUpdateField("lta", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Estimated Monthly Bonus</label>
                      <input 
                        type="number" 
                        value={formValues.bonus} 
                        onChange={(e) => handleUpdateField("bonus", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                        placeholder="e.g. 0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Gratuity Provision (Monthly accrued)</label>
                      <input 
                        type="number" 
                        value={formValues.gratuity} 
                        onChange={(e) => handleUpdateField("gratuity", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-xs font-semibold text-slate-950 shadow-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Total cost to company (CTC perMonth)</label>
                      <input 
                        type="number" 
                        value={formValues.ctcPerMonth} 
                        onChange={(e) => handleUpdateField("ctcPerMonth", Number(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 border border-slate-200 focus:border-indigo-400 rounded-xl text-sm font-black text-slate-950 shadow-xs outline-none"
                      />
                    </div>

                  </div>
                </div>
              )}

            </form>

            {/* Modal Actions Footer */}
            <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="text-xs text-slate-400 font-bold">
                {activeFormTab === "info" ? "Go to step 2/4" : activeFormTab === "earnings" ? "Go to step 3/4" : activeFormTab === "deductions" ? "Go to step 4/4" : "Ready to register Profile"}
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-850 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowModal(false);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-205 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Discard
                </button>
                <button 
                  type="button"
                  onClick={handleSaveEmployee}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Employee Deletion Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Delete Employee Profile?"
        message={`Are you sure you want to delete the profile for employee ${empToDelete}? This action will remove their details from the directory and mark them as deleted in your client view.`}
        confirmText="Confirm Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDeleteEmployee}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setEmpToDelete(null);
        }}
      />

      {/* DB Reset Overrides Custom Confirmation Dialog */}
      <ConfirmDialog
        isOpen={resetConfirmOpen}
        title="Reset All Local Changes?"
        message="Are you sure you want to clear all your local additions, edits, and deletions? This will restore the exact employee roster structure fetched directly from the 'emp_details' sheet."
        confirmText="Reset Roster"
        cancelText="Cancel"
        type="warning"
        onConfirm={handleConfirmResetOverrides}
        onCancel={() => setResetConfirmOpen(false)}
      />

    </div>
  );
}
