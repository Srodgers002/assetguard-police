import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CheckCircle2, Clock, ClipboardCheck, Package, TrendingUp, Users } from 'lucide-react';
import api from '../api';

const COLORS = ['#f97316', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="surface interactive-card rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-lg ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center text-slate-500 mt-20">Failed to load dashboard</div>;

  const byTypeData = Object.entries(data.by_type || {}).map(([name, value]) => ({ name, value }));
  const byCategoryData = Object.entries(data.by_category || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <div className="surface rounded-lg p-6 lg:p-7 overflow-hidden relative">
        <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <p className="text-sm font-bold text-orange-700 mb-2">Government asset overview</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-950">Asset control room</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl">
              Monitor generic government assets across asset type, category, availability, assignments, and employee requests.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-full sm:min-w-[360px]">
            {[
              { label: 'Assigned', value: data.assigned_assets, tone: 'text-orange-700 bg-orange-50 border-orange-100' },
              { label: 'Ready', value: data.available_assets, tone: 'text-blue-700 bg-blue-50 border-blue-100' },
              { label: 'Requests', value: data.pending_requests, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
            ].map(item => (
              <div key={item.label} className={`rounded-lg border px-4 py-3 ${item.tone}`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs font-semibold">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Assets" value={data.total_assets} color="bg-gradient-to-br from-orange-500 to-orange-700" subtitle="All government assets" />
        <StatCard icon={Users} label="Total Employees" value={data.total_employees} color="bg-gradient-to-br from-slate-700 to-slate-900" subtitle="Personnel registered" />
        <StatCard icon={CheckCircle2} label="Assigned Assets" value={data.assigned_assets} color="bg-gradient-to-br from-emerald-500 to-emerald-700" subtitle="Currently in use" />
        <StatCard icon={Clock} label="Available Assets" value={data.available_assets} color="bg-gradient-to-br from-amber-500 to-orange-600" subtitle="Ready to assign" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="surface rounded-lg p-6 interactive-card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-orange-600" />
            <h3 className="text-base font-bold text-slate-800">Assets by Type</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTypeData} barSize={56}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#f97316" radius={[10, 10, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="surface rounded-lg p-6 interactive-card">
          <div className="flex items-center gap-2 mb-6">
            <Package size={18} className="text-orange-600" />
            <h3 className="text-base font-bold text-slate-800">Assets by Category</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {byCategoryData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="surface table-shell">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-orange-600" />
            <h3 className="text-base font-bold text-slate-800">Recent Assignments</h3>
          </div>
          <span className="text-xs text-orange-700 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">Last 5 records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-slate-50">
                {['Asset ID', 'Asset', 'Asset Type', 'Employee', 'Assigned Date', 'Assigned By', 'Status'].map(header => (
                  <th key={header} className="text-left text-xs font-semibold text-slate-500 px-6 py-3 uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_assignments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No recent assignments</td></tr>
              ) : data.recent_assignments.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-slate-800">{item.asset_id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{item.asset}</td>
                  <td className="px-6 py-4 text-sm text-orange-700 font-semibold">{item.asset_type}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.employee}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.assigned_date}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.assigned_by}</td>
                  <td className="px-6 py-4"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
