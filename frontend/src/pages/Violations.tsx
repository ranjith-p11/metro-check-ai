import { useState } from 'react';
import { ShieldAlert, AlertTriangle, Clock, Search, Filter } from 'lucide-react';

const mockViolations = [
  { id: 1, inspection_id: 3, rule_id: 'LM-003', severity: 'HIGH', description: 'Missing MRP declaration', status: 'Open', date: new Date(Date.now() - 172800000).toISOString(), product: 'Refined Sunflower Oil', brand: 'Fortune' },
  { id: 2, inspection_id: 3, rule_id: 'LM-004', severity: 'MEDIUM', description: 'Missing Consumer Care details', status: 'Open', date: new Date(Date.now() - 172800000).toISOString(), product: 'Refined Sunflower Oil', brand: 'Fortune' },
  { id: 3, inspection_id: 2, rule_id: 'LM-006', severity: 'LOW', description: 'Potential font size issue — requires officer verification', status: 'Pending', date: new Date(Date.now() - 86400000).toISOString(), product: 'Chocolate Chip Biscuits', brand: 'Parle' },
];

const severityConfig: Record<string, { cls: string; icon: React.ReactNode }> = {
  HIGH: { cls: 'bg-red-100 text-red-700 border border-red-200', icon: <ShieldAlert className="w-4 h-4" /> },
  MEDIUM: { cls: 'bg-amber-100 text-amber-700 border border-amber-200', icon: <AlertTriangle className="w-4 h-4" /> },
  LOW: { cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200', icon: <Clock className="w-4 h-4" /> },
};

export default function Violations() {
  const [violations] = useState(mockViolations);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const filtered = violations.filter(v => {
    const matchSearch =
      v.rule_id.toLowerCase().includes(search.toLowerCase()) ||
      v.description.toLowerCase().includes(search.toLowerCase()) ||
      v.product.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || v.severity === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Violations Log</h1>
        <p className="text-slate-500">All detected compliance violations across inspections.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {(['HIGH', 'MEDIUM', 'LOW'] as const).map(sev => {
          const count = violations.filter(v => v.severity === sev).length;
          return (
            <div
              key={sev}
              onClick={() => setFilter(f => f === sev ? 'ALL' : sev)}
              className={`glass-card p-5 cursor-pointer transition-all ${filter === sev ? 'ring-2 ring-brand-500 shadow-md' : 'hover:shadow-md'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{sev} Severity</p>
                  <p className="text-3xl font-bold text-slate-800 mt-1">{count}</p>
                </div>
                <span className={`p-2 rounded-lg ${severityConfig[sev].cls}`}>
                  {severityConfig[sev].icon}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="glass-card p-6">
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search violations..."
              className="input-field pl-9 text-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {filter !== 'ALL' && (
            <button onClick={() => setFilter('ALL')} className="btn-secondary text-sm">
              <Filter className="w-4 h-4" /> Clear Filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-600 font-semibold bg-slate-50/50 text-sm">
                <th className="p-4">Rule ID</th>
                <th className="p-4">Description</th>
                <th className="p-4">Product</th>
                <th className="p-4">Severity</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-sm font-bold text-slate-700">{v.rule_id}</td>
                  <td className="p-4 text-slate-700 text-sm max-w-xs">{v.description}</td>
                  <td className="p-4">
                    <p className="font-medium text-slate-800 text-sm">{v.product}</p>
                    <p className="text-xs text-slate-500">{v.brand}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${severityConfig[v.severity]?.cls}`}>
                      {severityConfig[v.severity]?.icon}
                      {v.severity}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                      v.status === 'Open' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">{new Date(v.date).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    No violations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
