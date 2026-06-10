import { useEffect, useMemo, useState } from 'react';
import { FileText, Image, Package, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const ASSET_TYPES = ['New', 'Return', 'Miscellaneous'];

const empty = {
  name: '',
  asset_type: 'New',
  company: '',
  serial_number: '',
  category: '',
  subcategory: '',
  current_location: '',
  asset_images: [],
  permission_document: null,
  description: '',
  cost: '',
  purchase_date: '',
};

function StatusBadge({ status }) {
  const styles = {
    available: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    assigned: 'bg-orange-50 text-orange-700 border border-orange-100',
  };
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${styles[status] || 'bg-slate-100 text-slate-600'}`}>{status}</span>;
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterType) params.set('asset_type', filterType);
      const res = await api.get(`/assets?${params.toString()}`);
      setAssets(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, [search, filterType]);

  const nextAssetId = useMemo(() => {
    const max = assets.reduce((value, asset) => {
      const match = /^AST-(\d+)$/.exec(asset.asset_id || '');
      return match ? Math.max(value, Number(match[1])) : value;
    }, 0);
    return `AST-${String(max + 1).padStart(6, '0')}`;
  }, [assets]);

  const categories = [...new Set(assets.map(asset => asset.category).filter(Boolean))];
  const subcategories = [...new Set(assets.filter(asset => !form.category || asset.category === form.category).map(asset => asset.subcategory).filter(Boolean))];

  const openAdd = () => {
    setForm(empty);
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (asset) => {
    setForm({
      name: asset.name || '',
      asset_type: asset.asset_type || 'New',
      company: asset.company || '',
      serial_number: asset.serial_number || '',
      category: asset.category || '',
      subcategory: asset.subcategory || '',
      current_location: asset.current_location || '',
      asset_images: asset.asset_images || [],
      permission_document: asset.permission_document || null,
      description: asset.description || '',
      cost: asset.cost || '',
      purchase_date: asset.purchase_date || '',
    });
    setEditing(asset);
    setShowModal(true);
  };

  const handleImageUpload = async (event) => {
    const files = [...event.target.files];
    const payloads = await Promise.all(files.map(fileToPayload));
    setForm(prev => ({ ...prev, asset_images: [...prev.asset_images, ...payloads] }));
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const payload = await fileToPayload(file);
    setForm(prev => ({ ...prev, permission_document: payload }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (form.asset_type === 'Miscellaneous' && Number(form.cost || 0) > 50000) {
      toast.error('Miscellaneous asset cost cannot exceed Rs 50,000.');
      return;
    }
    if (form.asset_type !== 'Miscellaneous' && (!form.category || !form.subcategory)) {
      toast.error('Category and subcategory are required for New and Return assets');
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      cost: form.cost === '' ? null : Number(form.cost),
      category: form.asset_type === 'Miscellaneous' ? null : form.category,
      subcategory: form.asset_type === 'Miscellaneous' ? null : form.subcategory,
    };
    try {
      if (editing) {
        await api.put(`/assets/${editing.id}`, payload);
        toast.success('Asset updated successfully');
      } else {
        await api.post('/assets', payload);
        toast.success('Asset added successfully');
      }
      setShowModal(false);
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (asset) => {
    if (!confirm(`Delete ${asset.asset_id} - ${asset.name}?`)) return;
    try {
      await api.delete(`/assets/${asset.id}`);
      toast.success('Asset deleted');
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Cannot delete asset');
    }
  };

  return (
    <div className="space-y-5">
      <div className="surface rounded-lg p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search asset ID, name, company..." className="field pl-9 pr-4 py-2.5 text-sm w-72" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="field px-4 py-2.5 text-sm text-slate-600 w-48">
            <option value="">Asset Type</option>
            {ASSET_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <button onClick={openAdd} className="btn-primary px-5 py-2.5 text-sm">
          <Plus size={18} />
          Add Asset
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        {ASSET_TYPES.map(type => (
          <span key={type} className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-orange-50 text-orange-700 border-orange-100">
            {type}: {assets.filter(asset => asset.asset_type === type).length}
          </span>
        ))}
        <span className="text-xs font-semibold px-3 py-1.5 rounded-full border bg-white/80 text-slate-700 border-slate-200">Total: {assets.length}</span>
      </div>

      <div className="surface table-shell">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-orange-50/70 border-b border-orange-100">
                {['Asset ID', 'Asset Name', 'Asset Type', 'Company', 'Serial Number', 'Current Location', 'Status', 'Assigned To', 'Actions'].map(header => (
                  <th key={header} className="text-left text-xs font-bold text-orange-900 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-16"><Package size={40} className="text-slate-300 mx-auto mb-3" /><p className="text-slate-400 text-sm">No assets found</p></td></tr>
              ) : assets.map(asset => (
                <tr key={asset.id}>
                  <td className="px-5 py-4 text-sm font-mono font-bold text-slate-800">{asset.asset_id}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{asset.name}</td>
                  <td className="px-5 py-4"><span className="text-xs font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">{asset.asset_type}</span></td>
                  <td className="px-5 py-4 text-sm text-slate-600">{asset.company}</td>
                  <td className="px-5 py-4 text-sm font-mono text-slate-600">{asset.serial_number}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{asset.current_location}</td>
                  <td className="px-5 py-4"><StatusBadge status={asset.status} /></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{asset.assigned_to || <span className="text-slate-300">-</span>}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(asset)} className="p-2 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => handleDelete(asset)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="surface rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{editing ? 'Edit Asset' : 'Add New Asset'}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Master asset entry for all downstream workflows</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asset ID</label>
                  <input readOnly value={editing?.asset_id || nextAssetId} className="field px-4 py-2.5 text-sm bg-slate-100 font-mono font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asset Type *</label>
                  <select required value={form.asset_type} onChange={e => setForm({ ...form, asset_type: e.target.value })} className="field px-4 py-2.5 text-sm">
                    {ASSET_TYPES.map(type => <option key={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Serial Number *</label>
                  <input required value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} className="field px-4 py-2.5 text-sm" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Asset Name *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. HP Printer, Steel Cabinet, Office Supplies" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Company / Brand *</label>
                  <input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Dell, HP, Godrej" className="field px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Location *</label>
                  <input required value={form.current_location} onChange={e => setForm({ ...form, current_location: e.target.value })} className="field px-4 py-2.5 text-sm" />
                </div>
                {form.asset_type !== 'Miscellaneous' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category *</label>
                      <input required list="category-options" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Electronics, Furniture" className="field px-4 py-2.5 text-sm" />
                      <datalist id="category-options">{categories.map(item => <option key={item} value={item} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Subcategory *</label>
                      <input required list="subcategory-options" value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })} placeholder="Laptop, Chair, Printer" className="field px-4 py-2.5 text-sm" />
                      <datalist id="subcategory-options">{subcategories.map(item => <option key={item} value={item} />)}</datalist>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
                      <textarea required rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="field px-4 py-2.5 text-sm resize-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cost (max Rs 50,000) *</label>
                      <input required type="number" max="50000" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="field px-4 py-2.5 text-sm" />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="surface-soft rounded-lg p-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-3"><Image size={16} className="text-orange-600" />Asset Photo Upload</label>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp" multiple onChange={handleImageUpload} className="text-sm" />
                  <div className="flex gap-2 flex-wrap mt-3">
                    {form.asset_images.map((img, index) => <img key={`${img.name}-${index}`} src={img.data} alt={img.name} className="w-16 h-16 object-cover rounded-lg border border-slate-200" />)}
                  </div>
                </div>
                <div className="surface-soft rounded-lg p-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-3"><FileText size={16} className="text-orange-600" />Permission Document Upload</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleDocumentUpload} className="text-sm" />
                  {form.permission_document && (
                    <a href={form.permission_document.data} download={form.permission_document.name} className="mt-3 inline-flex text-xs font-semibold text-orange-700 hover:text-orange-900">
                      Download {form.permission_document.name}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 py-3 text-sm">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-sm disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Update Asset' : 'Add Asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
