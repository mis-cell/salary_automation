import React, { useState, useEffect } from "react";
import { UserPlus, Search, Filter, Loader2, AlertCircle, ChevronDown, CheckCircle, ShieldCheck } from "lucide-react";
import { fetchEmployeeDetails, EmployeeRow } from "../lib/googleSheetsService";

export default function ManageEmployees() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "REGULAR" | "CONSOLIDATED" | "ACTIVE" | "INACTIVE">("ALL");

  const loadWorkers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmployeeDetails();
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || "Failed to sync employee directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">Staff Directory</h1>
          <p className="text-slate-500 text-xs font-semibold mt-0.5">Manage personnel profiles, registered departments, and payroll type designations synced directly from Google Drive.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadWorkers}
            className="px-4 py-2 bg-slate-900 border border-slate-950 text-white text-xs font-extrabold rounded-xl hover:bg-slate-800 transition-all shadow-xs flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            <span>Refresh Roster</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-[20px] flex gap-4 items-start shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm mb-1">Spreadsheet Sync Issue</h3>
            <p className="text-rose-700 text-xs leading-relaxed font-semibold">{error}</p>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-[24px] border border-slate-250 shadow-xs overflow-hidden flex flex-col">
        
        {/* Real-time search and categorization row */}
        <div className="p-5 border-b border-slate-150 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/40">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by profile name, serial code, department, role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-slate-450 rounded-xl text-xs outline-none transition-all shadow-xs text-slate-950 font-semibold"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-56">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 text-slate-750 text-xs font-black rounded-xl outline-none transition-all shadow-xs appearance-none cursor-pointer"
              >
                <option value="ALL">All Registered Staff</option>
                <option value="REGULAR">Regular Wages</option>
                <option value="CONSOLIDATED">Consolidated Employees</option>
                <option value="ACTIVE">Status Indicator: Active</option>
                <option value="INACTIVE">Status Indicator: Inactive</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/10">
            <Loader2 className="w-8 h-8 text-slate-900 animate-spin mb-3" />
            <p className="text-slate-500 font-bold text-xs">Assembling profile cards ...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-400 tracking-wider bg-slate-50/20">
                  <th className="py-2.5 px-5">Staff Identity</th>
                  <th className="py-2.5 px-4">Role & Department</th>
                  <th className="py-2.5 px-4 text-center">Date of Joining</th>
                  <th className="py-2.5 px-4 text-center">Payroll Category</th>
                  <th className="py-2.5 px-5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400 font-bold bg-slate-50/5">No registered employees found matching the filters. Check Google Sheets.</td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.empCode} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 font-black text-xs shrink-0 border border-slate-200">
                            {emp.name ? emp.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '?'}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-950 text-sm leading-none">{emp.name}</div>
                            <div className="font-mono text-[9px] text-slate-400 font-bold mt-1.5 inline-block bg-slate-100 rounded px-1.5 py-0.5">{emp.empCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-slate-900">{emp.designation}</div>
                        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">{emp.department}</div>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-600 font-medium font-mono text-[11px]">
                        {emp.doj || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border ${
                          emp.salaryType === 'REGULAR' 
                            ? 'bg-slate-100 text-slate-800 border-slate-200' 
                            : 'bg-indigo-50 text-indigo-800 border-indigo-100'
                        }`}>
                          {emp.salaryType}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-extrabold border ${
                          emp.presentStatus === 'ACTIVE' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${emp.presentStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {emp.presentStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
