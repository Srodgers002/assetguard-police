import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ClipboardList, History, LogOut, Shield } from 'lucide-react';
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
    <aside className="w-64 flex flex-col h-full text-white" style={{ background: 'linear-gradient(180deg, #0d1b2a 0%, #1a2d44 60%, #0d1b2a 100%)' }}>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">AssetGuard</h1>
            <p className="text-xs text-amber-400 font-medium">Mordabad Police Line</p>
          </div>
        </div>
        <div className="mt-3 px-3 py-1.5 rounded-lg bg-white/5 text-xs text-slate-400 text-center">
          Uttar Pradesh Police
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-2">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/8'
              }`
            }
            style={({ isActive }) => isActive ? { background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.1))', borderLeft: '3px solid #f59e0b' } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'} />
                {label}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info & logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/5 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={16} />
          Sign Out
        </button>
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-600">Powered by</p>
          <p className="text-xs font-semibold text-amber-500/70">Dynovate Technology</p>
        </div>
      </div>
    </aside>
  );
}
