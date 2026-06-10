import { useEffect, useState } from 'react';
import { History as HistoryIcon, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    api.get('/history')
      .then(res => setHistory(res.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter(item => {
    const q = search.toLowerCase();
    const matchesSearch = !q || item.asset.toLowerCase().includes(q) || item.employee.toLowerCase().includes(q) || item.asset_id?.toLowerCase().includes(q) || item.employee_code?.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Records', value: history.length, color: 'bg-slate-700', text: 'All time assignments' },
          { label: 'Active', value: history.filter(item => item.status === 'active').length, color: 'bg-orange-600', text: 'Currently assigned' },
          { label: 'Returned', value: history.filter(item => item.status === 'returned').length, color: 'bg-emerald-600', text: 'Returned records' },
        ].map(item => (
          <div key={item.label} className="surface interactive-card rounded-lg p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.color}`}>
              <HistoryIcon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{item.label}</p>
            <p className="text-xs text-slate-400">{item.text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." className="field pl-9 pr-4 py-2.5 text-sm w-64" />
        </div>
        <div className="flex gap-1 bg-white/80 rounded-lg border border-slate-200 p-1 shadow-sm">
          {[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Returned', value: 'returned' },
          ].map(item => (
            <button key={item.value} onClick={() => setFilterStatus(item.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === item.value ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              style={filterStatus === item.value ? { background: 'linear-gradient(135deg, #f97316, #c2410c)' } : {}}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="surface table-shell">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HistoryIcon size={18} className="text-orange-600" />
            <h3 className="text-base font-bold text-slate-800">Assignment Audit Trail</h3>
          </div>
          <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 font-semibold px-3 py-1 rounded-full">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Asset ID', 'Asset', 'Asset Type', 'Employee', 'Dept.', 'Assigned Date', 'Returned Date', 'Assigned By', 'Notes', 'Status'].map(header => (
                  <th key={header} className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-16"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16 text-slate-400 text-sm">No records found</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id}>
                  <td className="px-5 py-4 text-sm font-mono font-bold text-slate-800">{item.asset_id}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{item.asset}</td>
                  <td className="px-5 py-4 text-sm text-orange-700 font-semibold">{item.asset_type}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{item.employee}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{item.department}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{item.assigned_date}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{item.returned_date || '-'}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{item.assigned_by}</td>
                  <td className="px-5 py-4 text-xs text-slate-400 max-w-[180px] truncate">{item.notes || '-'}</td>
                  <td className="px-5 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 capitalize">{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
