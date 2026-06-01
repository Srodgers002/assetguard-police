import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ClipboardList, History, LogOut, Shield, Activity, Sparkles } from 'lucide-react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assets', icon: Package, label: 'Assets' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/assignments', icon: ClipboardList, label: 'Assignments' },
  { to: '/history', icon: History, label: 'History' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="w-72 flex flex-col h-full text-white relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #061a1d 0%, #0f2a2e 47%, #101828 100%)' }}>
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-400/20 to-transparent" />
      <div className="absolute -right-12 top-28 w-44 h-44 rounded-full border border-white/10" />
      <div className="absolute -left-20 bottom-16 w-48 h-48 rounded-full border border-amber-300/10" />

      <div className="relative px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center shadow-lg shadow-teal-950/30" style={{ background: 'linear-gradient(135deg, #14b8a6, #f59e0b)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">AssetGuard</h1>
            <p className="text-xs text-teal-200 font-medium">Mordabad Police Line</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
            <div className="flex items-center gap-1.5 text-teal-200">
              <Activity size={13} />
              <span className="text-[11px] font-semibold">Live</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Asset ops</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Sparkles size={13} />
              <span className="text-[11px] font-semibold">Secure</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">UP Police</p>
          </div>
        </div>
      </div>

      <nav className="relative flex-1 px-4 py-6 space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-2">Workspace</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? 'text-white shadow-lg shadow-black/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/10 hover:translate-x-1'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, rgba(20,184,166,0.24), rgba(245,158,11,0.14))', boxShadow: 'inset 3px 0 0 #14b8a6' } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-teal-200' : 'text-slate-500 group-hover:text-slate-300'} />
                {label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-300 pulse-gold" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="relative px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-white/10 border border-white/10 mb-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #0f766e, #f59e0b)' }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-600">Powered by</p>
          <p className="text-xs font-semibold text-teal-300/70">Dynovate Technology</p>
        </div>
      </div>
    </aside>
  );
}
