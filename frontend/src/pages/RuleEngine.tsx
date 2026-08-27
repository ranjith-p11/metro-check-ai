import { useState, useEffect } from 'react';
import { fetchRules, updateRule } from '../services/api';
import { Settings2, Save, CheckCircle2 } from 'lucide-react';

export default function RuleEngine() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchRules().then(data => {
      setRules(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, is_enabled: r.is_enabled === 1 ? 0 : 1 } : r));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(rules.map(r => updateRule(r.id, r.is_enabled === 1)));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save rules', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Legal Metrology Rule Engine</h1>
          <p className="text-slate-500">Configure compliance checking parameters.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className={`btn-primary ${saved ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
        >
          {saved ? <><CheckCircle2 className="w-5 h-5"/> Saved</> : <><Save className="w-5 h-5"/> Save Configuration</>}
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        <div className="bg-slate-800 text-white p-4 flex items-center gap-3">
          <Settings2 className="w-5 h-5 text-brand-400" />
          <h3 className="font-semibold tracking-wide">Active Inspection Rules</h3>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading rules...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {rules.map((rule) => (
              <div key={rule.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">{rule.id}</span>
                    <h4 className="text-lg font-bold text-slate-800">{rule.name}</h4>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      rule.severity === 'HIGH' ? 'bg-red-100 text-red-700' : 
                      rule.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 
                      'bg-slate-200 text-slate-700'
                    }`}>{rule.severity} Priority</span>
                  </div>
                  <p className="text-slate-600 text-sm mt-2">{rule.description}</p>
                </div>
                
                <div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={rule.is_enabled === 1}
                      onChange={() => toggleRule(rule.id)}
                    />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
