import { useState } from "react";
import { UserPlus, Search, Filter } from "lucide-react";

export default function ManageEmployees() {
  const [employees] = useState([
    { id: "EM101", name: "John Doe", department: "Engineering", designation: "Senior Developer", email: "john@example.com", type: "REGULAR", status: "ACTIVE" },
    { id: "EM102", name: "Jane Smith", department: "Design", designation: "UX Designer", email: "jane@example.com", type: "REGULAR", status: "ACTIVE" },
    { id: "EM103", name: "Mike Johnson", department: "Marketing", designation: "Content Strategist", email: "mike@example.com", type: "CONSOLIDATED", status: "ACTIVE" },
    { id: "EM104", name: "Sarah Williams", department: "HR", designation: "HR Manager", email: "sarah@example.com", type: "REGULAR", status: "INACTIVE" },
  ]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff Directory</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Manage personnel records, departments, and payroll type designations.</p>
        </div>
        <div className="flex gap-3">
          <button className="h-12 px-5 bg-slate-900 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">
            <UserPlus className="w-5 h-5" /> Add Record
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full sm:max-w-md transition-all">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search personnel..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 focus:border-slate-400 rounded-2xl text-sm outline-none transition-all shadow-sm focus:ring-4 focus:ring-slate-100 font-medium"
            />
          </div>
          <button className="w-full sm:w-auto px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-sm">
            <Filter className="w-4 h-4" /> Filter Views
          </button>
        </div>

        <div className="flex-1 overflow-x-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 text-slate-400 bg-white">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Employee Profile</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Role & Dept</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Payroll Type</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-base shrink-0 border border-slate-200 shadow-sm">
                        {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-base">{emp.name}</div>
                        <div className="font-mono text-xs font-medium text-slate-500 mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-800 text-sm">{emp.designation}</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">{emp.department}</div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase ${emp.type === 'REGULAR' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {emp.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase ${emp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {emp.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors mr-5">Edit</button>
                    <button className="text-sm font-bold text-slate-400 hover:text-rose-600 transition-colors">Archive</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
