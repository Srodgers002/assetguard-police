import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Users, Mail, Phone } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Headquarters', 'Cyber Cell', 'Control Room', 'Traffic Department', 'Field Unit', 'SP Office', 'Record Room', 'Crime Branch', 'Intelligence', 'Administration'];
const RANKS = ['Superintendent of Police', 'Deputy Superintendent', 'Inspector', 'Sub-Inspector', 'Head Constable', 'Constable', 'Admin Staff'];

const empty = { name: '', employee_id: '', department: 'Headquarters', rank: 'Constable', email: '', phone: '' };

function Avatar({ name }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-amber-500', 'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-rose-600', 'bg-teal-600'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${color}`}>{initials}</div>;
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filterDept, setFilterDept] = useState('all');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/employees?search=${search}`);
      setEmployees(r.data);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, [search]);

  const openAdd = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (e) => { setForm({ name: e.name, employee_id: e.employee_id, department: e.department, rank: e.rank, email: e.email, phone: e.phone }); setEditing(e.id); setShowModal(true); };

  const handleSave = async (evt) => {
    evt.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/employees/${editing}`, form);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', form);
        toast.success('Employee added successfully');
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}" from the system?`)) return;
    try {
      await api.delete(`/employees/${id}`);
      toast.success('Employee removed');
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cannot delete');
    }
  };

  const depts = [...new Set(employees.map(e => e.department))];
  const filtered = employees.filter(e => filterDept === 'all' || e.department === filterDept);

  return (
    <div className="space-y-5">
      {/* Actions */}
      <div className="surface rounded-lg p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="field pl-9 pr-4 py-2.5 text-sm w-64" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="field px-4 py-2.5 text-sm text-slate-600 min-w-48">
            <option value="all">All Departments</option>
            {depts.map(d => <option key={d}>{d}</option>)}
          </select>
        </div>
        <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">Total: {employees.length}</span>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-amber-700">With Assets: {employees.filter(e => e.active_assignments > 0).length}</span>
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">Without Assets: {employees.filter(e => e.active_assignments === 0).length}</span>
      </div>

      {/* Employee cards grid */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="surface rounded-lg p-16 text-center">
          <Users size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No employees found</p>
        </div>
      ) : (
        <div className="surface table-shell overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Employee', 'Employee ID', 'Rank', 'Department', 'Contact', 'Assets', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={e.name} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.rank}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">{e.employee_id}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{e.rank}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{e.department}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Mail size={12} className="text-slate-400" />
                        <span className="truncate max-w-[160px]">{e.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Phone size={12} className="text-slate-400" />
                        {e.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {e.active_assignments > 0 ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">{e.active_assignments} assigned</span>
                    ) : (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">No assets</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(e)} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(e.id, e.name)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="surface rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{editing ? 'Edit Employee' : 'Add New Employee'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Personnel registration form</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Officer's full name" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Employee ID *</label>
                  <input required value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} placeholder="e.g. UP001" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Rank *</label>
                  <select required value={form.rank} onChange={e => setForm({...form, rank: e.target.value})} className="field px-4 py-2.5 text-sm">
                    {RANKS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Department *</label>
                  <select required value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="field px-4 py-2.5 text-sm">
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email ID *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="official@police.gov.in" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number *</label>
                  <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="10-digit contact number" className="field px-4 py-2.5 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-sm disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
