import { useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, ClipboardList, KeyRound, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [notes, setNotes] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [assignmentRes, assetRes, employeeRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/assets/available'),
        api.get('/employees'),
      ]);
      setAssignments(assignmentRes.data);
      setAvailableAssets(assetRes.data);
      setEmployees(employeeRes.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const needsMasterKey = selectedAssets.length > 10;
  const selectedPreview = useMemo(() => availableAssets.filter(asset => selectedAssets.includes(asset.id)), [availableAssets, selectedAssets]);

  const toggleAsset = (id) => {
    setSelectedAssets(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleAssign = async (event) => {
    event.preventDefault();
    if (selectedAssets.length === 0 || !employeeId) return toast.error('Select assets and an employee');
    if (needsMasterKey && !masterKey) return toast.error('Master key is required for large bulk assignments');
    setSaving(true);
    try {
      if (selectedAssets.length === 1) {
        await api.post('/assignments', { asset_id: selectedAssets[0], employee_id: Number(employeeId), notes });
      } else {
        await api.post('/assignments/bulk', { asset_ids: selectedAssets, employee_id: Number(employeeId), notes, master_key: masterKey || null });
      }
      toast.success(`${selectedAssets.length} asset${selectedAssets.length > 1 ? 's' : ''} assigned successfully`);
      setSelectedAssets([]);
      setEmployeeId('');
      setNotes('');
      setMasterKey('');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Assignment failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="surface rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-orange-100 flex items-center justify-between bg-orange-50/70">
            <div className="flex items-center gap-2">
              <PackageCheck size={18} className="text-orange-600" />
              <h3 className="text-base font-bold text-slate-800">Available Assets</h3>
            </div>
            <span className="text-xs bg-white text-orange-700 border border-orange-100 font-bold px-3 py-1 rounded-full">{selectedAssets.length} selected</span>
          </div>
          <div className="overflow-x-auto max-h-[560px]">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Select', 'Asset ID', 'Asset Name', 'Asset Type', 'Category', 'Current Location'].map(header => (
                    <th key={header} className="text-left text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
                ) : availableAssets.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">No assets available for assignment</td></tr>
                ) : availableAssets.map(asset => (
                  <tr key={asset.id}>
                    <td className="px-5 py-4">
                      <input type="checkbox" checked={selectedAssets.includes(asset.id)} onChange={() => toggleAsset(asset.id)} className="w-4 h-4 accent-orange-600" />
                    </td>
                    <td className="px-5 py-4 text-sm font-mono font-bold text-slate-800">{asset.asset_id}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{asset.name}</td>
                    <td className="px-5 py-4 text-sm text-orange-700 font-semibold">{asset.asset_type}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{asset.category || '-'}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{asset.current_location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form onSubmit={handleAssign} className="surface rounded-lg p-6 space-y-4 h-fit">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <ArrowRightLeft size={18} className="text-orange-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Assign Selected Assets</h3>
              <p className="text-xs text-slate-500">Single or bulk assignment from master asset inventory</p>
            </div>
          </div>

          <div className="surface-soft rounded-lg p-3 max-h-36 overflow-y-auto">
            {selectedPreview.length === 0 ? (
              <p className="text-xs text-slate-400">No assets selected</p>
            ) : selectedPreview.map(asset => (
              <p key={asset.id} className="text-xs font-semibold text-slate-700 py-1">{asset.asset_id} | {asset.name} | {asset.asset_type}</p>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select Employee *</label>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="field px-4 py-2.5 text-sm">
              <option value="">Choose an employee</option>
              {employees.map(employee => <option key={employee.id} value={employee.id}>{employee.name} - {employee.employee_id} - {employee.department}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="field px-4 py-2.5 text-sm resize-none" />
          </div>

          {needsMasterKey && (
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-1.5"><KeyRound size={14} />Master Key *</label>
              <input type="password" value={masterKey} onChange={e => setMasterKey(e.target.value)} className="field px-4 py-2.5 text-sm" placeholder="Required above 10 assets" />
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
            {saving ? 'Assigning...' : selectedAssets.length > 1 ? `Assign ${selectedAssets.length} Assets` : 'Assign Asset'}
          </button>
        </form>
      </div>

      <div className="surface table-shell">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-orange-600" />
            <h3 className="text-base font-bold text-slate-800">Current Assignments</h3>
          </div>
          <span className="text-xs bg-orange-50 text-orange-700 border border-orange-100 font-bold px-3 py-1 rounded-full">{assignments.length} active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Asset ID', 'Asset', 'Asset Type', 'Employee', 'Department', 'Assigned Date', 'Notes'].map(header => (
                  <th key={header} className="text-left text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">No active assignments</td></tr>
              ) : assignments.map(item => (
                <tr key={item.id}>
                  <td className="px-5 py-4 text-sm font-mono font-bold text-slate-800">{item.asset_code}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{item.asset}</td>
                  <td className="px-5 py-4 text-sm text-orange-700 font-semibold">{item.asset_type}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{item.employee}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{item.department}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{item.assigned_date}</td>
                  <td className="px-5 py-4 text-xs text-slate-500 max-w-[220px] truncate">{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
