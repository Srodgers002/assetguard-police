import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Eye, EyeOff, Lock, PackageCheck, Shield, User, UsersRound } from 'lucide-react';
import { useAuth } from '../AuthContext';
import toast from 'react-hot-toast';
import hero from '../assets/hero.png';

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
    <div className="min-h-screen flex bg-slate-950">
      <div className="hidden lg:flex flex-col justify-between w-[58%] p-14 xl:p-16 relative overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-orange-950/88 to-slate-950/82" />

        <div className="relative">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow-lg shadow-orange-950/40" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
              <Shield size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">AssetGuard</h1>
              <p className="text-orange-100 text-sm">Asset Management System</p>
            </div>
          </div>

          <div className="space-y-6 max-w-2xl">
            <h2 className="text-5xl font-bold text-white leading-tight">
              Secure asset management for police operations
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed">
              Track, assign, and manage departmental assets with complete audit trails and real-time oversight.
            </p>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-3">
          {[
            { icon: PackageCheck, text: 'Track assets in real time' },
            { icon: UsersRound, text: 'Manage personnel assignments' },
            { icon: ClipboardList, text: 'Complete audit history' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="rounded-lg border border-white/10 bg-white/10 p-4 text-slate-200 backdrop-blur">
              <Icon size={22} className="text-orange-100 mb-3" />
              <span className="text-sm font-semibold">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-8" style={{ background: 'radial-gradient(circle at top right, rgba(249,115,22,0.18), transparent 26rem), #f8fafc' }}>
        <div className="w-full max-w-md">
          <div className="surface rounded-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-950/10" style={{ background: 'linear-gradient(135deg, #f97316, #7c2d12)' }}>
                <Shield size={28} className="text-orange-100" />
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
                    className="field pl-11 pr-4 py-3.5 text-sm"
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
                    className="field pl-11 pr-12 py-3.5 text-sm"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-700 transition-colors">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 text-sm disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: loading ? '#94a3b8' : undefined }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : 'Sign In to Portal'}
              </button>
            </form>

            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-xs font-semibold text-orange-800 mb-1">Demo Credentials</p>
              <p className="text-xs text-orange-700">Admin: <span className="font-mono font-bold">admin</span> / <span className="font-mono font-bold">admin123</span></p>
              <p className="text-xs text-orange-700">Employee: <span className="font-mono font-bold">employee</span> / <span className="font-mono font-bold">employee123</span></p>
            </div>
          </div>
          <p className="text-center text-slate-500/60 text-xs mt-6">
            (c) 2024 Dynovate Technology - Mordabad Police Line
          </p>
        </div>
      </div>
    </div>
  );
}
