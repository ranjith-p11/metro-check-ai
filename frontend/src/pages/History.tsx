import { useState, useEffect } from 'react';
import { fetchInspections } from '../services/api';
import { Search, Filter, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function History() {
  const [inspections, setInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspections().then(data => {
      setInspections(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inspection History</h1>
          <p className="text-slate-500">View and search past compliance inspections.</p>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="Search by ID, Product, or Brand..." className="input-field pl-10" />
          </div>
          <button className="btn-secondary">
            <Filter className="w-5 h-5" /> Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
             <div className="py-12 text-center text-slate-500">Loading history...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-600 font-semibold bg-slate-50/50">
                  <th className="p-4 rounded-tl-lg">ID</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((ins, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="p-4 font-mono text-sm text-slate-500">INSP-{ins.id.toString().padStart(4, '0')}</td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{ins.product_name}</p>
                      <p className="text-xs text-slate-500">{ins.product_brand}</p>
                    </td>
                    <td className="p-4 text-slate-600">{new Date(ins.date).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className={`font-bold ${ins.score >= 90 ? 'text-emerald-600' : ins.score >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                        {ins.score}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        ins.status === 'COMPLIANT' ? 'bg-emerald-100 text-emerald-800' :
                        ins.status === 'WARNING' ? 'bg-amber-100 text-amber-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {ins.status === 'COMPLIANT' && <ShieldCheck className="w-4 h-4" />}
                        {ins.status === 'WARNING' && <AlertTriangle className="w-4 h-4" />}
                        {ins.status === 'NON-COMPLIANT' && <ShieldAlert className="w-4 h-4" />}
                        {ins.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {inspections.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">No records found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
