import { useEffect, useState } from 'react';
import { projectsAPI, clientsAPI } from '../services/api';

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#4A9EFF', bg: '#4A9EFF15', border: '#4A9EFF25' },
  completed: { label: 'Completed', color: '#00E5A0', bg: '#00E5A015', border: '#00E5A025' },
  delayed:   { label: 'Delayed',   color: '#FF6B35', bg: '#FF6B3515', border: '#FF6B3525' },
  'at-risk': { label: 'At Risk',   color: '#FF2D55', bg: '#FF2D5515', border: '#FF2D5525' },
  paused:    { label: 'Paused',    color: '#6B7280', bg: '#6B728015', border: '#6B728025' },
};

function ProgressRing({ value, size = 36 }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const color = value === 100 ? '#00E5A0' : value >= 60 ? '#4A9EFF' : value >= 30 ? '#FF6B35' : '#FF2D55';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E2130" strokeWidth="3" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  );
}

function ProjectCard({ project, onEdit, onDelete }) {
  const cfg = STATUS_CONFIG[project.status] || STATUS_CONFIG.active;
  const budgetUsed = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5 hover:border-[#2A3040] transition-all group animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white text-sm truncate">{project.name}</div>
          <div className="text-xs text-[#6B7280] mt-0.5">{project.client_name || project.company}</div>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            <button onClick={() => onEdit(project)} className="p-1.5 rounded-lg hover:bg-[#1E2130] text-[#6B7280] hover:text-white transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-6 6-2.5.5.5-2.5 6-6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={() => onDelete(project.id)} className="p-1.5 rounded-lg hover:bg-[#FF2D5510] text-[#6B7280] hover:text-[#FF2D55] transition-colors">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M5 3V2h2v1M3 3l.4 6.5h5.2L9 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
          <ProgressRing value={project.progress || 0} />
          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white">{project.progress || 0}%</span>
        </div>
        <div className="flex-1">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[#6B7280]">Budget used</span>
            <span className="font-mono text-white">{budgetUsed}%</span>
          </div>
          <div className="h-1 bg-[#1E2130] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(budgetUsed, 100)}%`, background: budgetUsed > 90 ? '#FF2D55' : budgetUsed > 70 ? '#FF6B35' : '#00E5A0' }} />
          </div>
        </div>
      </div>

      {/* Budget row */}
      <div className="flex justify-between text-xs border-t border-[#1E2130] pt-3">
        <div>
          <div className="text-[#6B7280]">Budget</div>
          <div className="font-mono text-white">${(project.budget || 0).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-[#6B7280]">Spent</div>
          <div className="font-mono text-white">${(project.spent || 0).toLocaleString()}</div>
        </div>
        {project.due_date && (
          <div className="text-right">
            <div className="text-[#6B7280]">Due</div>
            <div className="font-mono text-[#6B7280]">{project.due_date}</div>
          </div>
        )}
      </div>
    </div>
  );
}

const emptyForm = { client_id: '', name: '', status: 'active', progress: 0, budget: '', spent: '', due_date: '' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        projectsAPI.list(statusFilter !== 'all' ? { status: statusFilter } : {}),
        clientsAPI.list({ status: 'active' }),
      ]);
      setProjects(pRes.data);
      setClients(cRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p, budget: p.budget || '', spent: p.spent || '' }); setShowModal(true); };

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await projectsAPI.update(editing.id, form);
      else await projectsAPI.create(form);
      setShowModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    await projectsAPI.delete(id);
    setDeleteId(null); load();
  };

  const grouped = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = projects.filter(p => p.status === s);
    return acc;
  }, {});

  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{projects.length} total · ${totalSpent.toLocaleString()} spent of ${totalBudget.toLocaleString()}</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-black transition-all"
          style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          New Project
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {['all', ...Object.keys(STATUS_CONFIG)].map(s => {
          const cfg = STATUS_CONFIG[s];
          const count = s === 'all' ? projects.length : grouped[s]?.length || 0;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all border ${
                statusFilter === s
                  ? (cfg ? `border-[${cfg.border}]` : 'border-[#00E5A025] bg-[#00E5A012] text-[#00E5A0]')
                  : 'border-[#1E2130] bg-[#111318] text-[#6B7280] hover:text-white'
              }`}
              style={statusFilter === s && cfg ? { color: cfg.color, background: cfg.bg, borderColor: cfg.border } : {}}>
              {s} <span className="opacity-60 ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Project grid */}
      {loading ? (
        <div className="flex justify-center py-20 text-[#6B7280] text-sm">
          <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00E5A0" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10"/></svg>
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-[#1E2130] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#6B7280" strokeWidth="1.5"/><path d="M8 12h8M8 8h8M8 16h5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div className="text-[#6B7280] text-sm mb-3">No projects found</div>
          <button onClick={openCreate} className="text-xs text-[#00E5A0] hover:underline">+ Create your first project</button>
        </div>
      ) : statusFilter === 'all' ? (
        // Kanban-style grouped view
        <div className="space-y-6">
          {Object.entries(grouped).filter(([, arr]) => arr.length > 0).map(([status, items]) => {
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                  <span className="text-sm font-medium text-white">{cfg.label}</span>
                  <span className="text-xs text-[#6B7280] font-mono">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(p => <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={setDeleteId} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => <ProjectCard key={p.id} project={p} onEdit={openEdit} onDelete={setDeleteId} />)}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#1E2130] rounded-2xl w-full max-w-md shadow-2xl animate-slide-up">
            <div className="px-6 py-5 border-b border-[#1E2130] flex items-center justify-between">
              <h2 className="font-display font-bold text-white">{editing ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#6B7280] hover:text-white transition-colors">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <form onSubmit={save} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Client</label>
                <select required value={form.client_id || ''} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]">
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Project Name</label>
                <input required type="text" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Status</label>
                  <select value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]">
                    {Object.entries(STATUS_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Progress %</label>
                  <input type="number" min="0" max="100" value={form.progress ?? 0} onChange={e => setForm(f => ({ ...f, progress: +e.target.value }))}
                    className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Budget ($)</label>
                  <input type="number" value={form.budget || ''} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                    className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Spent ($)</label>
                  <input type="number" value={form.spent || ''} onChange={e => setForm(f => ({ ...f, spent: e.target.value }))}
                    className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Due Date</label>
                <input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#1E2130] text-sm text-[#6B7280] hover:text-white transition-all">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-black transition-all"
                  style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
                  {saving ? 'Saving...' : editing ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111318] border border-[#FF2D5530] rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <h3 className="text-white font-display font-bold text-center mb-2">Delete Project?</h3>
            <p className="text-[#6B7280] text-sm text-center mb-5">This cannot be undone.</p>
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
