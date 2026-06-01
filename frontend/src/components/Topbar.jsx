import { useLocation } from 'react-router-dom';
import { Bell, CalendarDays, Radio, ShieldCheck } from 'lucide-react';

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
    <header className="px-4 sm:px-6 lg:px-8 py-4">
      <div className="surface rounded-lg px-5 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 px-2.5 py-1 text-xs font-bold">
              <ShieldCheck size={13} />
              Asset command
            </span>
            <span className="hidden sm:inline text-xs font-medium text-slate-400">Mordabad Police Line, UP</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-lg bg-teal-50 border border-teal-100 px-3 py-2">
            <Radio size={16} className="text-teal-700" />
            <span className="text-sm font-semibold text-teal-800">Live inventory workspace</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
            <CalendarDays size={16} className="text-amber-600" />
            <div>
              <p className="text-[11px] leading-none text-amber-700 font-bold">Today</p>
              <p className="text-xs text-amber-800 mt-1">{today}</p>
            </div>
          </div>

          <button className="relative w-11 h-11 rounded-lg flex items-center justify-center bg-white border border-slate-200 hover:border-teal-200 hover:bg-teal-50 transition-colors">
            <Bell size={18} className="text-slate-600" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
          </button>
        </div>
      </div>
    </header>
  );
}
