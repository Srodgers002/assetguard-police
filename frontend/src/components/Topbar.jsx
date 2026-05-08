import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../AuthContext';

const titles = {
  '/': { title: 'Dashboard', subtitle: 'Overview of asset management operations' },
  '/assets': { title: 'Assets', subtitle: 'Manage laptops and mobile devices' },
  '/employees': { title: 'Employees', subtitle: 'Police department personnel database' },
  '/assignments': { title: 'Assignments', subtitle: 'Assign and manage assets to employees' },
  '/history': { title: 'Assignment History', subtitle: 'Complete audit trail of all asset movements' },
};

export default function Topbar() {
  const location = useLocation();
  const { title, subtitle } = titles[location.pathname] || titles['/'];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          <p className="text-xs text-slate-400">{today}</p>
          <p className="text-xs font-semibold text-amber-600">Mordabad Police Line, UP</p>
        </div>
        <div className="w-px h-10 bg-slate-200" />
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors">
          <Bell size={18} className="text-amber-600" />
        </div>
      </div>
    </header>
  );
}
