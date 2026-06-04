import React from "react";
import { Users, DollarSign, Calendar, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  
  const monthlyData = [
    { month: "Jan", regular: 1250000, consolidated: 340000 },
    { month: "Feb", regular: 1275000, consolidated: 350000 },
    { month: "Mar", regular: 1300000, consolidated: 350000 },
    { month: "Apr", regular: 0, consolidated: 0 },
  ];

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Overview</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Summary and payroll analysis for the current fiscal year.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-1 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white mb-6 shadow-md shadow-slate-900/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="text-sm text-slate-500 font-semibold mb-1">Total Payout (May)</div>
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">₹4,82,500</div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-4 bg-emerald-50 w-max px-3 py-1.5 rounded-lg border border-emerald-100">
            <TrendingUp className="w-4 h-4" /> +4.2% from April
          </div>
        </div>
        
        <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-1 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100">
            <Users className="w-6 h-6" />
          </div>
          <div className="text-sm text-slate-500 font-semibold mb-1">Regular Payslips</div>
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">₹3,10,200</div>
          <div className="text-xs font-bold text-slate-600 mt-4 bg-slate-50 w-max px-3 py-1.5 rounded-lg border border-slate-100">42 Employees Processed</div>
        </div>

        <div className="bg-white p-7 rounded-[32px] border border-slate-200 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.04)] transition-transform hover:-translate-y-1 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 mb-6 border border-violet-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="text-sm text-slate-500 font-semibold mb-1">Consolidated Payroll</div>
          <div className="text-4xl font-extrabold text-slate-900 tracking-tight">₹1,72,300</div>
          <div className="text-xs font-bold text-slate-600 mt-4 bg-slate-50 w-max px-3 py-1.5 rounded-lg border border-slate-100">18 Contractual Staff</div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col mt-4">
        <div className="p-7 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Monthly Payout Ledger
          </h2>
          <button className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-slate-900/20 active:scale-95">
            Export Report
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 text-slate-400">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Month</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Total Paid</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Regular Base</th>
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Consolidated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {monthlyData.map((d) => {
                const total = d.regular + d.consolidated;
                return (
                  <tr key={d.month} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-5 px-6">
                      <div className="font-bold text-slate-900 text-sm">{d.month} {currentYear}</div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="font-bold text-slate-900 bg-slate-100 inline-block px-3 py-1 rounded-lg">₹{total.toLocaleString()}</div>
                    </td>
                    <td className="py-5 px-6 font-semibold text-slate-600">
                      ₹{d.regular.toLocaleString()}
                    </td>
                    <td className="py-5 px-6 font-semibold text-slate-600">
                      ₹{d.consolidated.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
