import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', exact: true, icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="2" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="2" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="10" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
  )},
  { to: '/clients', label: 'Clients', icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
  { to: '/projects', label: 'Projects', icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 9h6M6 12h4M6 6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
  { to: '/analytics', label: 'Analytics', icon: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 14l4-4 3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 14h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )},
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}

      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#111318] border-r border-[#1E2130] flex flex-col z-30 transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>

        {/* Logo */}
        <div className="px-5 py-6 border-b border-[#1E2130]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00E5A0, #00B57A)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5L12.5 4.5V7C12.5 9.8 10 12 7 12C4 12 1.5 9.8 1.5 7V4.5L7 1.5Z" fill="white" fillOpacity="0.9"/>
                <path d="M4.5 7L6 8.5L9.5 5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="font-display font-bold text-white text-sm tracking-tight">PulseBoard</div>
              <div className="text-[10px] text-[#00E5A0] font-mono uppercase tracking-widest">Client Intel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ to, label, icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#00E5A012] text-[#00E5A0] border border-[#00E5A020]'
                    : 'text-[#6B7280] hover:text-white hover:bg-[#1E2130]'
                }`
              }>
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-[#1E2130] pt-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00E5A0, #00B57A)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-[#6B7280] truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-[#6B7280] hover:text-[#FF2D55] hover:bg-[#FF2D5508] transition-all">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
