import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Section({ title, description, children }) {
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-[#1E2130]">
        <div className="font-medium text-white text-sm">{title}</div>
        {description && <div className="text-xs text-[#6B7280] mt-0.5">{description}</div>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

const input = "w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040] transition-colors";

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Password state
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      await api.put('/auth/profile', { name: profile.name });
      setProfileMsg({ ok: true, text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ ok: false, text: err.response?.data?.error || 'Update failed.' });
    } finally { setProfileSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwMsg({ ok: false, text: 'New passwords do not match.' });
      return;
    }
    if (pwForm.next.length < 6) {
      setPwMsg({ ok: false, text: 'Password must be at least 6 characters.' });
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      await api.put('/auth/password', { current_password: pwForm.current, new_password: pwForm.next });
      setPwMsg({ ok: true, text: 'Password updated successfully.' });
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg({ ok: false, text: err.response?.data?.error || 'Password change failed.' });
    } finally { setPwSaving(false); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await api.delete('/auth/account');
      logout();
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  const MsgBanner = ({ msg }) => msg ? (
    <div className={`flex items-center gap-2 text-sm px-3 py-2.5 rounded-xl mt-3 ${msg.ok ? 'bg-[#00E5A010] border border-[#00E5A020] text-[#00E5A0]' : 'bg-[#FF2D5510] border border-[#FF2D5520] text-[#FF2D55]'}`}>
      {msg.ok
        ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      }
      {msg.text}
    </div>
  ) : null;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Section title="Profile" description="Update your display name and email address">
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Display Name">
              <input className={input} value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
            </Field>
            <Field label="Email Address">
              <input className={`${input} opacity-50 cursor-not-allowed`} value={profile.email} disabled
                title="Email cannot be changed" />
            </Field>
          </div>
          <div className="flex items-center justify-between pt-1">
            <MsgBanner msg={profileMsg} />
            <button type="submit" disabled={profileSaving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-black ml-auto"
              style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Section>

      {/* Password */}
      <Section title="Password" description="Use a strong password of at least 6 characters">
        <form onSubmit={changePassword} className="space-y-4">
          <Field label="Current Password">
            <input type="password" className={input} placeholder="••••••••"
              value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="New Password">
              <input type="password" className={input} placeholder="••••••••"
                value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required />
            </Field>
            <Field label="Confirm New Password">
              <input type="password" className={input} placeholder="••••••••"
                value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
            </Field>
          </div>
          <div className="flex items-center justify-between pt-1">
            <MsgBanner msg={pwMsg} />
            <button type="submit" disabled={pwSaving}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-black ml-auto"
              style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
              {pwSaving ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </Section>

      {/* Account info */}
      <Section title="Account" description="Read-only account details">
        <div className="space-y-3">
          {[
            ['User ID', user?.id],
            ['Email', user?.email],
            ['Role', user?.role || 'admin'],
            ['Member Since', user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm border-b border-[#1E2130] pb-3 last:border-0 last:pb-0">
              <span className="text-[#6B7280]">{label}</span>
              <span className="text-white font-mono text-xs truncate max-w-xs text-right">{value}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Danger zone */}
      <div className="bg-[#111318] border border-[#FF2D5525] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-[#FF2D5520]">
          <div className="font-medium text-[#FF2D55] text-sm">Danger Zone</div>
          <div className="text-xs text-[#6B7280] mt-0.5">These actions are permanent and cannot be undone</div>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-white">Delete Account</div>
              <div className="text-xs text-[#6B7280] mt-0.5">Permanently removes your account, all clients, projects, and data.</div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">
              Type DELETE to confirm
            </label>
            <div className="flex gap-3">
              <input className={`${input} flex-1 border-[#FF2D5520] focus:border-[#FF2D5550]`}
                placeholder="DELETE" value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)} />
              <button
                onClick={deleteAccount}
                disabled={deleteConfirm !== 'DELETE' || deleting}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#FF2D55] hover:bg-[#E02447] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0">
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
