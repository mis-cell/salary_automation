import { useState, useEffect } from "react";
import { UserPlus, Search, Filter, Loader2, AlertCircle } from "lucide-react";
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
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Directory</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Manage personnel records, departments, and payroll type designations directly synced from Google Sheets.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={loadWorkers}
            className="h-12 px-5 bg-slate-900 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
            Refresh Directory
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-900 p-6 rounded-[2rem] flex gap-4 items-start shadow-sm">
          <AlertCircle className="w-6 h-6 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-bold text-lg mb-1">Spreadsheet Sync Issue</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md transition-all">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name, code, dept, role..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-slate-400 rounded-2xl text-sm outline-none transition-all shadow-sm focus:ring-4 focus:ring-slate-100 font-medium"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full sm:w-auto px-4 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl outline-none transition-all shadow-sm focus:ring-4 focus:ring-slate-100"
            >
              <option value="ALL">All Records</option>
              <option value="REGULAR">Regular Salaries</option>
              <option value="CONSOLIDATED">Consolidated Staff</option>
              <option value="ACTIVE">Status: Active</option>
              <option value="INACTIVE">Status: Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-20">
            <Loader2 className="w-10 h-10 text-slate-900 animate-spin mb-4" />
            <p className="text-slate-500 font-bold text-base">Reading Employee details...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-100 text-slate-400 bg-white">
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Employee Profile</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Role & Dept</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">DOJ</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Payroll Type</th>
                  <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">No employees found matching the query.</td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.empCode} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0 border border-slate-200 shadow-sm">
                            {emp.name ? emp.name.split(' ').map(n => n[0]).slice(0, 2).join('') : '?'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-base">{emp.name}</div>
                            <div className="font-mono text-xs font-medium text-slate-500 mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{emp.empCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 text-sm">{emp.designation}</div>
                        <div className="text-xs font-medium text-slate-500 mt-1">{emp.department}</div>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600 text-sm">
                        {emp.doj || 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase ${emp.salaryType === 'REGULAR' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                          {emp.salaryType}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase ${emp.presentStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                          <span className={`w-2 h-2 rounded-full ${emp.presentStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
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
