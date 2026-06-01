import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, Laptop, Smartphone, X, Package } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'];
const TYPES = ['laptop', 'mobile'];

function Badge({ status }) {
  const styles = {
    available: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    assigned: 'bg-amber-100 text-amber-700 border border-amber-200',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function ConditionBadge({ condition }) {
  const styles = {
    Excellent: 'bg-emerald-50 text-emerald-700',
    Good: 'bg-blue-50 text-blue-700',
    Fair: 'bg-amber-50 text-amber-700',
    Poor: 'bg-orange-50 text-orange-700',
    Damaged: 'bg-red-50 text-red-700',
  };
  return <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${styles[condition] || 'bg-slate-50 text-slate-600'}`}>{condition}</span>;
}

const empty = { name: '', asset_type: 'laptop', company: '', model_no: '', serial_number: '', warranty: '', condition: 'Excellent', purchase_date: '', location: '' };

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/assets?search=${search}`);
      setAssets(r.data);
    } catch { toast.error('Failed to load assets'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssets(); }, [search]);

  const openAdd = () => { setForm(empty); setEditing(null); setShowModal(true); };
  const openEdit = (a) => { setForm({ name: a.name, asset_type: a.asset_type, company: a.company, model_no: a.model_no, serial_number: a.serial_number, warranty: a.warranty, condition: a.condition, purchase_date: a.purchase_date, location: a.location }); setEditing(a.id); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/assets/${editing}`, form);
        toast.success('Asset updated successfully');
      } else {
        await api.post('/assets', form);
        toast.success('Asset added successfully');
      }
      setShowModal(false);
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/assets/${id}`);
      toast.success('Asset deleted');
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cannot delete');
    }
  };

  const filtered = assets.filter(a => {
    if (filterType !== 'all' && a.asset_type !== filterType) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="surface rounded-lg p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="field pl-9 pr-4 py-2.5 text-sm w-64"
            />
          </div>
          {/* Filters */}
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="field px-4 py-2.5 text-sm text-slate-600 w-36">
            <option value="all">All Types</option>
            <option value="laptop">Laptop</option>
            <option value="mobile">Mobile</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="field px-4 py-2.5 text-sm text-slate-600 w-40">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
          </select>
        </div>
        <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total', count: assets.length, color: 'bg-white/80 text-slate-700 border-slate-200' },
          { label: 'Laptops', count: assets.filter(a => a.asset_type === 'laptop').length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Mobiles', count: assets.filter(a => a.asset_type === 'mobile').length, color: 'bg-purple-50 text-purple-700 border-purple-100' },
          { label: 'Available', count: assets.filter(a => a.status === 'available').length, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { label: 'Assigned', count: assets.filter(a => a.status === 'assigned').length, color: 'bg-amber-50 text-amber-700 border-amber-100' },
        ].map(({ label, count, color }) => (
          <span key={label} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>{label}: {count}</span>
        ))}
      </div>

      {/* Table */}
      <div className="surface table-shell">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Asset Name', 'Type', 'Company / Model', 'Serial No.', 'Warranty', 'Condition', 'Purchase Date', 'Location', 'Status', 'Assigned To', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={11} className="text-center py-16"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-16">
                  <Package size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">No assets found</p>
                </td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${a.asset_type === 'laptop' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {a.asset_type === 'laptop' ? <Laptop size={15} className="text-blue-600" /> : <Smartphone size={15} className="text-purple-600" />}
                      </div>
                      <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${a.asset_type === 'laptop' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{a.asset_type}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-700">{a.company}</p>
                    <p className="text-xs text-slate-400">{a.model_no}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-mono text-slate-600">{a.serial_number}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{a.warranty}</td>
                  <td className="px-5 py-4"><ConditionBadge condition={a.condition} /></td>
                  <td className="px-5 py-4 text-sm text-slate-500 whitespace-nowrap">{a.purchase_date}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{a.location}</td>
                  <td className="px-5 py-4"><Badge status={a.status} /></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{a.assigned_to || <span className="text-slate-300">-</span>}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(a)} className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(a.id, a.name)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="surface rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{editing ? 'Edit Asset' : 'Add New Asset'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Fill in the asset details below</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asset Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Dell Latitude 5540" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asset Type *</label>
                  <select required value={form.asset_type} onChange={e => setForm({...form, asset_type: e.target.value})} className="field px-4 py-2.5 text-sm">
                    <option value="laptop">Laptop</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company *</label>
                  <input required value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="e.g. Dell, HP, Samsung" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Model No. *</label>
                  <input required value={form.model_no} onChange={e => setForm({...form, model_no: e.target.value})} placeholder="e.g. LAT-5540-I5" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Serial Number *</label>
                  <input required value={form.serial_number} onChange={e => setForm({...form, serial_number: e.target.value})} placeholder="Unique serial number" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Condition *</label>
                  <select required value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} className="field px-4 py-2.5 text-sm">
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Warranty</label>
                  <input value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} placeholder="e.g. Mar 2026" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Purchase Date</label>
                  <input value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} placeholder="e.g. Mar 15, 2023" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Location *</label>
                  <input required value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Headquarters, Cyber Cell" className="field px-4 py-2.5 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-sm disabled:opacity-60">
                  {saving ? 'Saving...' : editing ? 'Update Asset' : 'Add Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
