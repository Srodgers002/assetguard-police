import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

export default function MyAssets() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/my-assets')
      .then(res => setAssets(res.data))
      .catch(err => toast.error(err.response?.data?.detail || 'Failed to load your assets'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="surface table-shell">
      <div className="px-6 py-5 border-b border-orange-100 flex items-center gap-2 bg-orange-50/70">
        <Package size={18} className="text-orange-600" />
        <h3 className="text-base font-bold text-slate-800">My Assets</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Asset ID', 'Asset Name', 'Asset Type', 'Category', 'Subcategory', 'Current Location', 'Assigned Date', 'Notes'].map(header => (
                <th key={header} className="text-left text-xs font-bold text-slate-500 px-5 py-3.5 uppercase tracking-wider whitespace-nowrap">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12"><div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" /></td></tr>
            ) : assets.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No assets are currently assigned to you</td></tr>
            ) : assets.map(asset => (
              <tr key={asset.assignment_id}>
                <td className="px-5 py-4 text-sm font-mono font-bold text-slate-800">{asset.asset_id}</td>
                <td className="px-5 py-4 text-sm font-semibold text-slate-800">{asset.name}</td>
                <td className="px-5 py-4 text-sm text-orange-700 font-semibold">{asset.asset_type}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{asset.category || '-'}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{asset.subcategory || '-'}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{asset.current_location}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{asset.assigned_date}</td>
                <td className="px-5 py-4 text-xs text-slate-500 max-w-[220px] truncate">{asset.notes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
