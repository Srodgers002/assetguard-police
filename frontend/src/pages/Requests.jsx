import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardCheck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../AuthContext';

const STATUSES = ['Pending', 'Approved', 'Rejected', 'Assigned', 'Completed'];

function StatusBadge({ status }) {
  const color = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-100',
    Approved: 'bg-blue-50 text-blue-700 border-blue-100',
    Rejected: 'bg-red-50 text-red-700 border-red-100',
    Assigned: 'bg-orange-50 text-orange-700 border-orange-100',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  }[status] || 'bg-slate-50 text-slate-600 border-slate-100';
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>{status}</span>;
}

export default function Requests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateRequest = async (request, status) => {
    const admin_notes = status === 'Rejected' ? prompt('Reason for rejection?') : null;
    try {
      await api.patch(`/requests/${request.id}`, { status, admin_notes });
      toast.success(`Request marked ${status}`);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  };

  return (
    <div className="surface table-shell">
      <div className="px-6 py-5 border-b border-orange-100 flex items-center justify-between bg-orange-50/70">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={18} className="text-orange-600" />
          <h3 className="text-base font-bold text-slate-800">{isAdmin ? 'Employee Requests' : 'My Requests'}</h3>
        </div>
        <span className="text-xs bg-white text-orange-700 border border-orange-100 font-bold px-3 py-1 rounded-full">{requests.length} records</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Asset ID', 'Asset Name', 'Asset Type', 'Employee', 'Requested On', 'Status', 'Notes', isAdmin ? 'Actions' : 'Admin Notes'].map(header => (
                <th key={header} className="text-left text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No requests found</td></tr>
            ) : requests.map(request => (
              <tr key={request.id}>
                <td className="px-5 py-4 text-sm font-mono font-bold text-slate-800">{request.asset?.asset_id}</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-800">{request.asset?.name}</td>
                <td className="px-5 py-4 text-sm text-orange-700 font-semibold">{request.asset?.asset_type}</td>
                <td className="px-5 py-4 text-sm text-slate-600">{request.employee || '-'}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{request.created_at}</td>
                <td className="px-5 py-4"><StatusBadge status={request.status} /></td>
                <td className="px-5 py-4 text-xs text-slate-500 max-w-[220px] truncate">{request.notes || '-'}</td>
                <td className="px-5 py-4">
                  {isAdmin ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateRequest(request, 'Approved')} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"><CheckCircle2 size={15} /></button>
                      <button onClick={() => updateRequest(request, 'Assigned')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-orange-50 text-orange-700 border border-orange-100">Assign</button>
                      <button onClick={() => updateRequest(request, 'Rejected')} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"><XCircle size={15} /></button>
                      <select value={request.status} onChange={e => updateRequest(request, e.target.value)} className="field px-2 py-1.5 text-xs w-32">
                        {STATUSES.map(status => <option key={status}>{status}</option>)}
                      </select>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">{request.admin_notes || '-'}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
