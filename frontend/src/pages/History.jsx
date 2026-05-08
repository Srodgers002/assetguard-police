import { useEffect, useState } from 'react';
import { History as HistoryIcon, Laptop, Smartphone, AlertTriangle, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

function Avatar({ name }) {
  const initials = name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const colors = ['bg-amber-500', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${color}`}>{initials}</div>;
}

const conditionColor = {
  Excellent: 'text-emerald-700 bg-emerald-50',
  Good: 'text-blue-700 bg-blue-50',
  Fair: 'text-amber-700 bg-amber-50',
  Poor: 'text-orange-700 bg-orange-50',
  Damaged: 'text-red-700 bg-red-50',
};

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    api.get('/history')
      .then(r => { setHistory(r.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load history'); setLoading(false); });
  }, []);

  const filtered = history.filter(h => {
    const q = search.toLowerCase();
    const matchesSearch = !q || h.asset.toLowerCase().includes(q) || h.employee.toLowerCase().includes(q) || h.department?.toLowerCase().includes(q) || h.employee_code?.toLowerCase().includes(q);
    const matchesStatus = filterStatus === 'all' || h.status === filterStatus || (filterStatus === 'overdue' && h.is_overdue);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: history.length,
    active: history.filter(h => h.status === 'active').length,
    returned: history.filter(h => h.status === 'returned').length,
    overdue: history.filter(h => h.is_overdue).length,
  };

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: stats.total, color: 'bg-slate-700', text: 'All time assignments' },
          { label: 'Active', value: stats.active, color: 'bg-emerald-600', text: 'Currently assigned' },
          { label: 'Returned', value: stats.returned, color: 'bg-blue-600', text: 'Successfully returned' },
          { label: 'Overdue', value: stats.overdue, color: stats.overdue > 0 ? 'bg-red-500' : 'bg-slate-400', text: 'Past return date' },
        ].map(({ label, value, color, text }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <HistoryIcon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{label}</p>
            <p className="text-xs text-slate-400">{text}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records..." className="pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white w-56" />
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1">
          {[
            { label: 'All', value: 'all' },
            { label: 'Active', value: 'active' },
            { label: 'Returned', value: 'returned' },
            { label: 'Overdue', value: 'overdue' },
          ].map(({ label, value }) => (
            <button key={value} onClick={() => setFilterStatus(value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${filterStatus === value ? 'text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              style={filterStatus === value ? { background: 'linear-gradient(135deg, #f59e0b, #d97706)' } : {}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HistoryIcon size={18} className="text-amber-500" />
            <h3 className="text-base font-bold text-slate-800">Assignment Audit Trail</h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-3 py-1 rounded-full">{filtered.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Asset', 'Employee', 'Dept.', 'Assigned Date', 'Expected Return', 'Returned Date', 'Condition', 'Assigned By', 'Notes', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-16"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-16">
                  <HistoryIcon size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No records found</p>
                </td></tr>
              ) : filtered.map(h => (
                <tr key={h.id} className={`transition-colors ${h.is_overdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.asset_type === 'laptop' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {h.asset_type === 'laptop' ? <Laptop size={14} className="text-blue-600" /> : <Smartphone size={14} className="text-purple-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{h.asset}</p>
                        <p className="text-xs text-slate-400 font-mono">{h.serial_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={h.employee} />
                      <div>
                        <p className="text-sm font-medium text-slate-800 whitespace-nowrap">{h.employee}</p>
                        <p className="text-xs text-slate-400">{h.employee_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full whitespace-nowrap">{h.department}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{h.assigned_date}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {h.expected_return_date ? (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${h.is_overdue ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {h.is_overdue && '⚠ '}{h.expected_return_date}
                      </span>
                    ) : <span className="text-slate-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {h.returned_date ? (
                      <span className="text-sm text-emerald-700 font-medium">{h.returned_date}</span>
                    ) : <span className="text-slate-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-4">
                    {h.condition_on_return ? (
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${conditionColor[h.condition_on_return] || 'bg-slate-50 text-slate-600'}`}>{h.condition_on_return}</span>
                    ) : <span className="text-slate-300 text-sm">—</span>}
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{h.assigned_by}</td>
                  <td className="px-5 py-4 text-xs text-slate-400 max-w-[140px] truncate">{h.notes || <span className="text-slate-300">—</span>}</td>
                  <td className="px-5 py-4">
                    {h.is_overdue ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                        <AlertTriangle size={11} />Overdue
                      </span>
                    ) : h.status === 'returned' ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                        <RotateCcw size={11} />Returned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                        <CheckCircle2 size={11} />Active
                      </span>
                    )}
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
