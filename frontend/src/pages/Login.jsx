import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2d44 50%, #0f2644 100%)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-96 h-96 rounded-full border-2 border-amber-400" />
          <div className="absolute top-32 left-32 w-72 h-72 rounded-full border border-amber-400" />
          <div className="absolute bottom-20 right-20 w-64 h-64 rounded-full border-2 border-amber-400" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              <Shield size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AssetGuard</h1>
              <p className="text-amber-400 text-sm">Asset Management System</p>
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Secure Asset<br />
              <span className="text-amber-400">Management</span><br />
              for Police Lines
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Track, assign, and manage all departmental assets with complete audit trails and real-time oversight.
            </p>
          </div>
        </div>
        <div className="relative space-y-4">
          {[
            { icon: '📦', text: 'Track 100+ Assets in Real-time' },
            { icon: '👮', text: 'Manage Personnel & Assignments' },
            { icon: '📋', text: 'Complete Audit Trail & History' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-slate-300">
              <span className="text-2xl">{icon}</span>
              <span className="text-sm">{text}</span>
            </div>
          ))}
          <div className="pt-4 border-t border-white/10">
            <p className="text-slate-500 text-xs">Developed by <span className="text-amber-400 font-semibold">Dynovate Technology</span></p>
            <p className="text-slate-600 text-xs mt-1">Mordabad Police Line, Uttar Pradesh</p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #0d1b2a, #1a2d44)' }}>
                <Shield size={28} className="text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800">Welcome Back</h3>
              <p className="text-slate-500 text-sm mt-1">Sign in to AssetGuard Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-slate-50"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0d1b2a, #1a2d44)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In to Portal'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-semibold text-amber-800 mb-1">Demo Credentials</p>
              <p className="text-xs text-amber-700">Admin: <span className="font-mono font-bold">admin</span> / <span className="font-mono font-bold">admin123</span></p>
              <p className="text-xs text-amber-700">Manager: <span className="font-mono font-bold">manager</span> / <span className="font-mono font-bold">manager123</span></p>
            </div>
          </div>
          <p className="text-center text-slate-500/60 text-xs mt-6">
            © 2024 Dynovate Technology · Mordabad Police Line
          </p>
        </div>
      </div>
    </div>
  );
}
