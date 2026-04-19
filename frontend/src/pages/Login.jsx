import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#00E5A0 1px, transparent 1px), linear-gradient(90deg, #00E5A0 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, #00E5A0 0%, transparent 70%)' }} />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #00E5A0, #00B57A)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L14 5V8C14 11.3 11.3 14 8 14C4.7 14 2 11.3 2 8V5L8 2Z" fill="white" fillOpacity="0.9"/>
                <path d="M5.5 8L7 9.5L10.5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-white tracking-tight">PulseBoard</span>
          </div>
          <p className="text-[#6B7280] text-sm">Client intelligence. Zero blind spots.</p>
        </div>

        {/* Card */}
        <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-8 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-[#0A0B0F] rounded-xl p-1 mb-7 border border-[#1E2130]">
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                  mode === m ? 'bg-[#111318] text-white shadow border border-[#1E2130]' : 'text-[#6B7280] hover:text-white'
                }`}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Demo hint */}
          {mode === 'login' && (
            <div className="mb-5 px-3 py-2.5 bg-[#00E5A010] border border-[#00E5A020] rounded-lg flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] animate-pulse" />
              <span className="text-xs text-[#00E5A0]">Demo: <span className="font-mono">demo@pulseboard.io</span> / <span className="font-mono">demo1234</span></span>
            </div>
          )}

          <form onSubmit={handle} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Name</label>
                <input type="text" placeholder="Your name" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-4 py-3 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#00E5A040] transition-colors"
                  required />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Email</label>
              <input type="email" placeholder="you@company.com" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-4 py-3 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#00E5A040] transition-colors"
                required />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Password</label>
              <input type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-4 py-3 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#00E5A040] transition-colors"
                required />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-[#FF2D55] bg-[#FF2D5510] border border-[#FF2D5520] rounded-xl px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#FF2D55" strokeWidth="1.5"/><path d="M7 4v3M7 9v.5" stroke="#FF2D55" strokeWidth="1.5" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-medium text-sm text-black transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              style={{ background: loading ? '#00B57A' : 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
              {loading ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10"/></svg> Authenticating...</>
              ) : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#374151] mt-6">
          © 2024 PulseBoard · Built for agency operators
        </p>
      </div>
    </div>
  );
}
