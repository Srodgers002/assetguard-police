import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Package, Users, CheckCircle2, Clock, AlertTriangle, Laptop, Smartphone, TrendingUp } from 'lucide-react';
import api from '../api';

const COLORS = ['#f59e0b', '#1a2d44', '#10b981', '#6366f1', '#ef4444', '#8b5cf6'];

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

const typeIcon = { laptop: <Laptop size={14} />, mobile: <Smartphone size={14} /> };

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return <div className="text-center text-slate-500 mt-20">Failed to load dashboard</div>;

  const byTypeData = Object.entries(data.by_type || {}).map(([name, value]) => ({ name, value }));
  const byConditionData = Object.entries(data.by_condition || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Overdue alert */}
      {data.overdue_count > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-red-700">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm font-medium">
            <span className="font-bold">{data.overdue_count} asset{data.overdue_count > 1 ? 's' : ''}</span> overdue for return. Review assignments immediately.
          </p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Assets" value={data.total_assets} color="bg-amber-500" subtitle="Laptops & mobiles" />
        <StatCard icon={Users} label="Total Employees" value={data.total_employees} color="bg-slate-700" subtitle="Personnel registered" />
        <StatCard icon={CheckCircle2} label="Assigned Assets" value={data.assigned_assets} color="bg-emerald-500" subtitle="Currently in use" />
        <StatCard icon={Clock} label="Available Assets" value={data.available_assets} color="bg-blue-500" subtitle="Ready to assign" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-amber-500" />
            <h3 className="text-base font-bold text-slate-800">Assets by Type</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byTypeData} barSize={56}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b', textTransform: 'capitalize' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <Package size={18} className="text-amber-500" />
            <h3 className="text-base font-bold text-slate-800">Assets by Condition</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byConditionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {byConditionData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Assignment Rate', value: data.total_assets > 0 ? `${Math.round((data.assigned_assets / data.total_assets) * 100)}%` : '0%', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Overdue Returns', value: data.overdue_count, color: data.overdue_count > 0 ? 'text-red-600' : 'text-emerald-600', bg: data.overdue_count > 0 ? 'bg-red-50' : 'bg-emerald-50' },
          { label: 'Utilization', value: data.total_assets > 0 ? `${Math.round((data.assigned_assets / data.total_assets) * 100)}%` : '0%', color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-5 text-center`}>
            <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Recent Assignments */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Recent Assignments</h3>
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Last 5 records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                {['Asset', 'Type', 'Employee', 'Assigned Date', 'Assigned By', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-6 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_assignments.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No recent assignments</td></tr>
              ) : data.recent_assignments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">{a.asset}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${a.asset_type === 'laptop' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {a.asset_type === 'laptop' ? <Laptop size={11} /> : <Smartphone size={11} />}
                      {a.asset_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{a.employee}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{a.assigned_date}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{a.assigned_by}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {a.status}
                    </span>
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
