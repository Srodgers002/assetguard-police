import { useEffect, useState } from 'react';
import { ClipboardList, AlertTriangle, CheckCircle2, X, Laptop, Smartphone, ArrowRightLeft, RotateCcw } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];

function Avatar({ name }) {
  const initials = name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';
  const colors = ['bg-amber-500', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${color}`}>{initials}</div>;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [assignForm, setAssignForm] = useState({ asset_id: '', employee_id: '', notes: '', expected_return_date: '' });
  const [unassignModal, setUnassignModal] = useState(null);
  const [unassignForm, setUnassignForm] = useState({ condition_on_return: 'Good', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [a, av, e] = await Promise.all([
        api.get('/assignments'),
        api.get('/assets/available'),
        api.get('/employees'),
      ]);
      setAssignments(a.data);
      setAvailableAssets(av.data);
      setEmployees(e.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignForm.asset_id || !assignForm.employee_id) return toast.error('Please select both asset and employee');
    setSaving(true);
    try {
      await api.post('/assignments', assignForm);
      toast.success('Asset assigned successfully!');
      setAssignForm({ asset_id: '', employee_id: '', notes: '', expected_return_date: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Assignment failed');
    } finally { setSaving(false); }
  };

  const handleUnassign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/assignments/unassign', { assignment_id: unassignModal.id, ...unassignForm });
      toast.success('Asset returned successfully!');
      setUnassignModal(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Return failed');
    } finally { setSaving(false); }
  };

  const overdueCount = assignments.filter(a => a.is_overdue).length;

  return (
    <div className="space-y-6">
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-5 py-4 shadow-sm">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm font-medium text-red-700">
            <span className="font-bold">{overdueCount} assignment{overdueCount > 1 ? 's' : ''}</span> overdue for return! Please follow up immediately.
          </p>
        </div>
      )}

      {/* Assign & Unassign forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assign */}
        <div className="surface rounded-lg overflow-hidden interactive-card">
          <div className="px-6 py-5 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #0f766e, #101828)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center">
                <ArrowRightLeft size={18} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Assign Asset</h3>
                <p className="text-xs text-slate-400">Allocate an asset to an employee</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleAssign} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Asset *</label>
              <select value={assignForm.asset_id} onChange={e => setAssignForm({...assignForm, asset_id: e.target.value})} className="field px-4 py-2.5 text-sm text-slate-700">
                <option value="">Choose an available asset</option>
                {availableAssets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.asset_type}) - {a.serial_number}</option>
                ))}
              </select>
              {availableAssets.length === 0 && <p className="text-xs text-amber-600 mt-1">No assets available for assignment</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Employee *</label>
              <select value={assignForm.employee_id} onChange={e => setAssignForm({...assignForm, employee_id: e.target.value})} className="field px-4 py-2.5 text-sm text-slate-700">
                <option value="">Choose an employee</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} - {e.employee_id} - {e.department}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Expected Return Date</label>
              <input type="date" value={assignForm.expected_return_date} onChange={e => setAssignForm({...assignForm, expected_return_date: e.target.value})} min={new Date().toISOString().split('T')[0]} className="field px-4 py-2.5 text-sm text-slate-700" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes / Remarks</label>
              <textarea value={assignForm.notes} onChange={e => setAssignForm({...assignForm, notes: e.target.value})} placeholder="Purpose of assignment, special instructions..." rows={2} className="field px-4 py-2.5 text-sm resize-none text-slate-700" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
              {saving ? 'Assigning...' : 'Assign Asset'}
            </button>
          </form>
        </div>

        {/* Quick unassign panel */}
        <div className="surface rounded-lg overflow-hidden interactive-card">
          <div className="px-6 py-5 border-b border-slate-100" style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-400/20 flex items-center justify-center">
                <RotateCcw size={18} className="text-red-300" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Return Asset</h3>
                <p className="text-xs text-red-200">Select an assignment to process return</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No active assignments</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {assignments.map(a => (
                  <div key={a.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${a.is_overdue ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.asset_type === 'laptop' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {a.asset_type === 'laptop' ? <Laptop size={14} className="text-blue-600" /> : <Smartphone size={14} className="text-purple-600" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{a.asset}</p>
                        <p className="text-xs text-slate-500 truncate">{a.employee}</p>
                        {a.is_overdue && <p className="text-xs text-red-600 font-medium">Overdue</p>}
                      </div>
                    </div>
                    <button onClick={() => { setUnassignModal(a); setUnassignForm({ condition_on_return: 'Good', notes: '' }); }} className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shrink-0">
                      Return
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Assignments Table */}
      <div className="surface table-shell">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-teal-600" />
            <h3 className="text-base font-bold text-slate-800">Current Assignments</h3>
          </div>
          <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-3 py-1 rounded-full">{assignments.length} active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Asset', 'Employee', 'Department', 'Assigned Date', 'Expected Return', 'Notes', 'Status', 'Action'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : assignments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No active assignments</td></tr>
              ) : assignments.map(a => (
                <tr key={a.id} className={`transition-colors ${a.is_overdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.asset_type === 'laptop' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {a.asset_type === 'laptop' ? <Laptop size={14} className="text-blue-600" /> : <Smartphone size={14} className="text-purple-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{a.asset}</p>
                        <p className="text-xs text-slate-400 font-mono">{a.serial_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={a.employee} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{a.employee}</p>
                        <p className="text-xs text-slate-400">{a.employee_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">{a.department}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{a.assigned_date}</td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    {a.expected_return_date ? (
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.is_overdue ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {a.is_overdue ? 'Overdue: ' : ''}{a.expected_return_date}
                      </span>
                    ) : <span className="text-slate-300 text-sm">-</span>}
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500 max-w-[140px] truncate">{a.notes || <span className="text-slate-300">-</span>}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.is_overdue ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {a.is_overdue ? 'Overdue' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => { setUnassignModal(a); setUnassignForm({ condition_on_return: 'Good', notes: '' }); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                      <RotateCcw size={13} />
                      Return
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unassign Modal */}
      {unassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="surface rounded-lg shadow-2xl w-full max-w-md animate-slide-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Process Asset Return</h3>
                <p className="text-xs text-slate-400 mt-0.5">Record the condition of the returned asset</p>
              </div>
              <button onClick={() => setUnassignModal(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X size={20} /></button>
            </div>
            <div className="px-6 pt-5 pb-2">
              <div className={`p-4 rounded-xl mb-5 ${unassignModal.is_overdue ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${unassignModal.asset_type === 'laptop' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {unassignModal.asset_type === 'laptop' ? <Laptop size={18} className="text-blue-600" /> : <Smartphone size={18} className="text-purple-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{unassignModal.asset}</p>
                    <p className="text-xs text-slate-500">Returning from: <span className="font-semibold">{unassignModal.employee}</span></p>
                    {unassignModal.is_overdue && <p className="text-xs text-red-600 font-semibold mt-0.5">This asset is overdue.</p>}
                  </div>
                </div>
              </div>
            </div>
            <form onSubmit={handleUnassign} className="px-6 pb-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Condition on Return *</label>
                <div className="grid grid-cols-5 gap-2">
                  {CONDITIONS.map(c => (
                    <button key={c} type="button" onClick={() => setUnassignForm({...unassignForm, condition_on_return: c})}
                      className={`py-2 rounded-xl text-xs font-semibold border-2 transition-all ${unassignForm.condition_on_return === c ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Return Notes</label>
                <textarea value={unassignForm.notes} onChange={e => setUnassignForm({...unassignForm, notes: e.target.value})} placeholder="Any damage, observations, or special notes..." rows={3} className="field px-4 py-2.5 text-sm resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setUnassignModal(null)} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl text-white text-sm font-semibold bg-red-500 hover:bg-red-600 transition-colors">
                  {saving ? 'Processing...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
