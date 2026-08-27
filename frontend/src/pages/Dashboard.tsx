import { useState, useEffect } from 'react';
import { fetchDashboardStats, fetchInspections } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { ShieldCheck, ShieldAlert, AlertTriangle, Clock, Activity, FileText } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [recentInspections, setRecentInspections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, inspectionsData] = await Promise.all([
          fetchDashboardStats(),
          fetchInspections()
        ]);
        setStats(statsData);
        setRecentInspections(inspectionsData.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>;
  }

  // Mock data for charts if API fails or is empty
  const trendData = [
    { name: 'Mon', inspections: 12 },
    { name: 'Tue', inspections: 19 },
    { name: 'Wed', inspections: 15 },
    { name: 'Thu', inspections: 22 },
    { name: 'Fri', inspections: 30 },
    { name: 'Sat', inspections: 10 },
    { name: 'Sun', inspections: 8 },
  ];

  const violationData = [
    { name: 'Missing MRP', count: 85 },
    { name: 'Net Quantity', count: 42 },
    { name: 'Mfr Details', count: 65 },
    { name: 'Consumer Care', count: 38 },
    { name: 'Font Size', count: 24 },
  ];

  const complianceData = [
    { name: 'Compliant', value: stats?.compliant || 892, color: '#10b981' },
    { name: 'Warning', value: stats?.pendingReview || 80, color: '#f59e0b' },
    { name: 'Non-Compliant', value: stats?.violations || 276, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Compliance Intelligence Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of enforcement activities and compliance metrics.</p>
        </div>
        <div className="flex items-center text-sm font-medium text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Activity className="w-4 h-4 mr-2 text-brand-500" />
          System Status: Active
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="glass-card p-6 border-l-4 border-l-brand-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Inspections</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.totalInspections || '1,248'}</h3>
            </div>
            <div className="p-3 bg-brand-50 rounded-xl text-brand-600">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-brand-600 font-medium mt-4 flex items-center">
             +12% from last month
          </p>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Compliant</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.compliant || '892'}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Violations Detected</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.violations || '276'}</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Review</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats?.pendingReview || '80'}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 bg-gradient-to-br from-brand-600 to-brand-800 text-white border-none shadow-brand-500/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-brand-100">Compliance Rate</p>
              <h3 className="text-3xl font-bold text-white mt-2">{stats?.complianceRate || '71.5'}%</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-xl text-white">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-black/20 rounded-full h-2">
            <div className="bg-white rounded-full h-2" style={{ width: `${stats?.complianceRate || 71.5}%` }}></div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Inspection Trend (Last 7 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="inspections" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, fill: '#0ea5e9' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Compliance Status</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Top Violation Categories</h3>
          <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={violationData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} style={{ fontSize: '12px' }}/>
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Recent Inspections</h3>
            <button className="text-sm text-brand-600 font-medium hover:text-brand-700">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-sm">
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Officer</th>
                  <th className="pb-3 font-medium text-center">Score</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentInspections.map((ins, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 font-medium text-slate-800">{ins.product_name || 'Unknown Product'}</td>
                    <td className="py-4 text-slate-600">{new Date(ins.date).toLocaleDateString()}</td>
                    <td className="py-4 text-slate-600">{ins.inspector_name || 'System'}</td>
                    <td className="py-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                        ins.score >= 90 ? 'bg-emerald-100 text-emerald-700' :
                        ins.score >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {ins.score}/100
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        ins.status === 'COMPLIANT' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        ins.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {ins.status === 'COMPLIANT' && <ShieldCheck className="w-3 h-3" />}
                        {ins.status === 'WARNING' && <AlertTriangle className="w-3 h-3" />}
                        {ins.status === 'NON-COMPLIANT' && <ShieldAlert className="w-3 h-3" />}
                        {ins.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentInspections.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-500">No recent inspections</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
