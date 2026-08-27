import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { TrendingUp, Award, AlertTriangle, Target } from 'lucide-react';

const monthlyData = [
  { month: 'Mar', compliant: 45, warning: 12, nonCompliant: 8 },
  { month: 'Apr', compliant: 52, warning: 10, nonCompliant: 6 },
  { month: 'May', compliant: 60, warning: 15, nonCompliant: 10 },
  { month: 'Jun', compliant: 70, warning: 18, nonCompliant: 12 },
  { month: 'Jul', compliant: 65, warning: 14, nonCompliant: 9 },
  { month: 'Aug', compliant: 80, warning: 20, nonCompliant: 15 },
];

const categoryData = [
  { name: 'Food & Beverages', value: 48 },
  { name: 'Cosmetics', value: 22 },
  { name: 'Household', value: 18 },
  { name: 'Pharmaceutical', value: 8 },
  { name: 'Agriculture', value: 4 },
];

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#f43f5e'];

const radarData = [
  { field: 'MRP', score: 88 },
  { field: 'Net Qty', score: 92 },
  { field: 'Manufacturer', score: 74 },
  { field: 'Consumer Care', score: 80 },
  { field: 'Date/Expiry', score: 85 },
  { field: 'Font Size', score: 70 },
];

const kpis = [
  { label: 'Avg Compliance Score', value: '82.4', unit: '/100', icon: <Award className="w-6 h-6" />, color: 'text-brand-600', bg: 'bg-brand-50' },
  { label: 'Monthly Growth', value: '+14%', unit: '', icon: <TrendingUp className="w-6 h-6" />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Common Violation', value: 'MRP', unit: 'Missing', icon: <AlertTriangle className="w-6 h-6" />, color: 'text-red-600', bg: 'bg-red-50' },
  { label: 'Accuracy Rate', value: '94.2', unit: '%', icon: <Target className="w-6 h-6" />, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export default function Analytics() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics & Insights</h1>
        <p className="text-slate-500">Trends, patterns and compliance intelligence across all inspections.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((k, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-medium text-slate-500">{k.label}</p>
              <div className={`p-2 rounded-lg ${k.bg} ${k.color}`}>{k.icon}</div>
            </div>
            <p className={`text-2xl font-black ${k.color}`}>
              {k.value}<span className="text-slate-400 text-sm font-semibold ml-1">{k.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Monthly Inspection Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Monthly Inspection Breakdown</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="#94a3b8" />
                <YAxis axisLine={false} tickLine={false} stroke="#94a3b8" />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="compliant" name="Compliant" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="warning" name="Warning" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonCompliant" name="Non-Compliant" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Product Categories</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="45%" outerRadius={75} dataKey="value" paddingAngle={4}>
                  {categoryData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Radar + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Declaration Field Compliance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="field" tick={{ fontSize: 12, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Compliance" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Score Table */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Field-level Compliance Scores</h3>
          <div className="space-y-3">
            {radarData.map((r, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700 w-28 flex-shrink-0">{r.field}</span>
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      r.score >= 85 ? 'bg-emerald-500' : r.score >= 70 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${r.score}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-10 text-right ${
                  r.score >= 85 ? 'text-emerald-600' : r.score >= 70 ? 'text-amber-600' : 'text-red-600'
                }`}>{r.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
