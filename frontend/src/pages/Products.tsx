import { useState, useEffect } from 'react';
import { fetchProducts } from '../services/api';
import { Package, Tag, Search } from 'lucide-react';

const categoryColors: Record<string, string> = {
  Food: 'bg-emerald-100 text-emerald-700',
  Cosmetics: 'bg-pink-100 text-pink-700',
  Household: 'bg-blue-100 text-blue-700',
  Pharmaceutical: 'bg-purple-100 text-purple-700',
  Agriculture: 'bg-yellow-100 text-yellow-700',
};

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts()
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Registry</h1>
          <p className="text-slate-500">All registered products under Legal Metrology compliance.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="input-field pl-9 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p, i) => (
            <div key={i} className="glass-card p-6 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-brand-50 transition-colors flex-shrink-0">
                  <Package className="w-6 h-6 text-slate-400 group-hover:text-brand-500 transition-colors" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{p.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Tag className="w-3 h-3" /> {p.brand || 'Unknown Brand'}
                  </p>
                  <span className={`inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    categoryColors[p.category] || 'bg-slate-100 text-slate-600'
                  }`}>
                    {p.category || 'Uncategorized'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No products found</p>
              <p className="text-sm mt-1">Try adjusting your search or check your backend connection.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
