import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientsAPI } from '../services/api';

const INDUSTRIES = ['SaaS', 'Healthcare', 'Logistics', 'Media', 'Design', 'Analytics', 'Finance', 'E-commerce', 'Other'];
const STATUSES = ['all', 'active', 'at-risk', 'churned'];

const STATUS_STYLE = {
  active: 'bg-[#00E5A012] text-[#00E5A0] border-[#00E5A020]',
  'at-risk': 'bg-[#FF6B3518] text-[#FF6B35] border-[#FF6B3528]',
  churned: 'bg-[#6B728018] text-[#6B7280] border-[#6B728028]',
};

function HealthBadge({ score }) {
  const color = score >= 80 ? '#00E5A0' : score >= 60 ? '#4A9EFF' : score >= 40 ? '#FF6B35' : '#FF2D55';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-[#1E2130] rounded-full w-16">
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{score}</span>
    </div>
  );
}

const emptyForm = { name: '', company: '', email: '', phone: '', mrr: '', contract_value: '', industry: '', renewal_date: '', start_date: '', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await clientsAPI.list({ status, search: search || undefined });
      setClients(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [status, search]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c, mrr: c.mrr || '', contract_value: c.contract_value || '' }); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await clientsAPI.update(editing.id, form);
      else await clientsAPI.create(form);
      setShowModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    await clientsAPI.delete(id);
    setDeleteId(null); load();
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Clients</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{clients.length} clients tracked</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-black transition-all"
          style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.4"/><path d="m10.5 10.5 2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#111318] border border-[#1E2130] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#6B7280] focus:outline-none focus:border-[#00E5A040]" />
        </div>
        <div className="flex gap-1 bg-[#111318] border border-[#1E2130] rounded-xl p-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${status === s ? 'bg-[#00E5A012] text-[#00E5A0] border border-[#00E5A020]' : 'text-[#6B7280] hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111318] border border-[#1E2130] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16 text-[#6B7280] text-sm">
            <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00E5A0" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10"/></svg>
            Loading...
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 bg-[#1E2130] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" stroke="#6B7280" strokeWidth="1.5"/><path d="M4 19c0-4 3.1-7 7-7s7 3 7 7" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div className="text-[#6B7280] text-sm">No clients found</div>
            <button onClick={openCreate} className="mt-4 text-xs text-[#00E5A0] hover:underline">+ Add your first client</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E2130]">
                  {['Client', 'Industry', 'MRR', 'Health', 'Renewal', 'Status', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2130]">
                {clients.map(c => (
                  <tr key={c.id} className="hover:bg-[#0A0B0F] transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#1E2130] flex items-center justify-center text-xs font-bold text-[#00E5A0] font-display flex-shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <Link to={`/clients/${c.id}`} className="text-sm font-medium text-white hover:text-[#00E5A0] transition-colors">{c.name}</Link>
                          {c.email && <div className="text-xs text-[#6B7280]">{c.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#6B7280]">{c.industry || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono text-[#00E5A0]">${(c.mrr || 0).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3.5 w-36"><HealthBadge score={c.health_score} /></td>
                    <td className="px-4 py-3.5 text-xs font-mono text-[#6B7280]">{c.renewal_date || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_STYLE[c.status] || ''}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-[#1E2130] text-[#6B7280] hover:text-white transition-colors">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9.5 1.5l2 2-7 7-2.5.5.5-2.5 7-7z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-[#FF2D5510] text-[#6B7280] hover:text-[#FF2D55] transition-colors">
                          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5h9M5 3.5V2.5h3v1M3 3.5l.5 7h6l.5-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#1E2130] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
            <div className="px-6 py-5 border-b border-[#1E2130] flex items-center justify-between">
              <h2 className="font-display font-bold text-white">{editing ? 'Edit Client' : 'New Client'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6B7280] hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={save} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[['name','Client Name','text',true],['company','Company','text'],['email','Email','email'],['phone','Phone','tel'],['mrr','MRR ($)','number'],['contract_value','Contract Value ($)','number'],['start_date','Start Date','date'],['renewal_date','Renewal Date','date']].map(([key, label, type, req]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">{label}</label>
                    <input type={type} required={!!req} value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040] transition-colors" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Industry</label>
                <select value={form.industry || ''} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                  className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              {editing && (
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Status</label>
                  <select value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]">
                    <option value="active">Active</option>
                    <option value="at-risk">At Risk</option>
                    <option value="churned">Churned</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Notes</label>
                <textarea rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-[#00E5A040]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#1E2130] text-sm text-[#6B7280] hover:text-white hover:border-[#2A3040] transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-black transition-all"
                  style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#FF2D5530] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="w-12 h-12 bg-[#FF2D5515] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 8v5M11 15v.5" stroke="#FF2D55" strokeWidth="1.8" strokeLinecap="round"/><path d="M9 3.5L1.5 17.5h19L13 3.5H9z" stroke="#FF2D55" strokeWidth="1.5" strokeLinejoin="round"/></svg>
            </div>
            <h3 className="text-white font-display font-bold text-center mb-2">Delete Client?</h3>
            <p className="text-[#6B7280] text-sm text-center mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-[#1E2130] text-sm text-[#6B7280] hover:text-white transition-all">Cancel</button>
              <button onClick={() => remove(deleteId)} className="flex-1 py-2.5 rounded-xl bg-[#FF2D55] text-white text-sm font-medium hover:bg-[#E02447] transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
