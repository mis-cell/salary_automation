import { useState } from "react";
import { Save, Info } from "lucide-react";

export default function LeaveBalance() {
  const [data, setData] = useState([
    { id: "EM101", name: "John Doe", closingPL: 12.5, closingSL: 6, usedPL: 2, usedSL: 0 },
    { id: "EM102", name: "Jane Smith", closingPL: 10, closingSL: 4, usedPL: 0, usedSL: 1 },
    { id: "EM103", name: "Mike Johnson", closingPL: 5, closingSL: 2, usedPL: 1, usedSL: 0 },
  ]);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Leave Accruals</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Manage and calculate available employee leave balances.</p>
        </div>
        <div className="flex gap-3">
          <button className="h-12 px-6 bg-slate-900 text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-95">
            <Save className="w-5 h-5" /> Save Ledger
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col relative z-10">
        <div className="p-7 border-b border-slate-100 bg-slate-50/80 flex items-start gap-4">
          <div className="mt-0.5 text-slate-900 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-sm text-slate-600 leading-relaxed font-medium">
            <p className="font-bold text-slate-900 mb-1 text-base">Standard Calculation Process</p>
            <p>1. Ensure previous month's ledger Closing Balance is accurate.</p>
            <p className="my-1.5">2. A standard system auto-credit of <strong className="text-slate-900 font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm ml-1">+2.50 PL</strong> and <strong className="text-slate-900 font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded-md shadow-sm">+1.25 SL</strong> is applied per cycle.</p>
            <p>3. Deduct consumed leaves to finalize available output balances.</p>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto p-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 text-slate-400 bg-white">
                <th className="py-4 px-6 text-xs font-bold uppercase tracking-wider">Employee</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">1. Prev Close PL</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-100">1. Prev Close SL</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-100">2. Auto Credit</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center">3. Used PL</th>
                <th className="py-4 px-4 text-xs font-bold uppercase tracking-wider text-center border-r border-slate-100">3. Used SL</th>
                <th className="py-4 px-4 text-xs font-bold text-slate-800 uppercase tracking-wider text-center">Final PL</th>
                <th className="py-4 px-6 text-xs font-bold text-slate-800 uppercase tracking-wider text-center">Final SL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {data.map((row) => {
                const finalPL = (row.closingPL + 2.50) - row.usedPL;
                const finalSL = (row.closingSL + 1.25) - row.usedSL;

                return (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm whitespace-nowrap">{row.name}</div>
                      <div className="font-mono text-xs font-medium text-slate-500 mt-1 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{row.id}</div>
                    </td>
                    
                    <td className="py-4 px-4 text-center">
                      <input 
                        type="number" 
                        value={row.closingPL}
                        onChange={(e) => {}}
                        className="w-16 mx-auto text-center p-2 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all shadow-sm" 
                      />
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100 text-center">
                      <input 
                        type="number" 
                        value={row.closingSL}
                        onChange={(e) => {}}
                        className="w-16 mx-auto text-center p-2 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all shadow-sm" 
                      />
                    </td>

                    <td className="py-4 px-4 border-r border-slate-100 text-center align-middle">
                      <div className="flex flex-col gap-1.5 items-center justify-center">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-bold text-slate-600">+ 2.50 PL</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-bold text-slate-600">+ 1.25 SL</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <input 
                        type="number" 
                        value={row.usedPL}
                        onChange={(e) => {}}
                        className="w-16 mx-auto text-center p-2 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all shadow-sm" 
                      />
                    </td>
                    <td className="py-4 px-4 border-r border-slate-100 text-center">
                      <input 
                        type="number" 
                        value={row.usedSL}
                        onChange={(e) => {}}
                        className="w-16 mx-auto text-center p-2 text-sm font-bold border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all shadow-sm" 
                      />
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="font-extrabold text-slate-900 text-base bg-slate-100/50 inline-block px-3 py-1 pb-1.5 rounded-xl border border-slate-200/50">{finalPL.toFixed(2)}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="font-extrabold text-slate-900 text-base bg-slate-100/50 inline-block px-3 py-1 pb-1.5 rounded-xl border border-slate-200/50">{finalSL.toFixed(2)}</div>
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
