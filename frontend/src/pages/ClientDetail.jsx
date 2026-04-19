import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { clientsAPI, projectsAPI } from '../services/api';

const STATUS_STYLE = {
  active:    'bg-[#00E5A012] text-[#00E5A0] border-[#00E5A020]',
  'at-risk': 'bg-[#FF6B3518] text-[#FF6B35] border-[#FF6B3528]',
  churned:   'bg-[#6B728018] text-[#6B7280] border-[#6B728028]',
};

function HealthGauge({ score, onChange }) {
  const color = score >= 80 ? '#00E5A0' : score >= 60 ? '#4A9EFF' : score >= 40 ? '#FF6B35' : '#FF2D55';
  const label = score >= 80 ? 'Healthy' : score >= 60 ? 'Moderate' : score >= 40 ? 'At Risk' : 'Critical';
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6B7280] uppercase tracking-wider">Health Score</span>
        <span className="text-sm font-medium px-2.5 py-0.5 rounded-full" style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>{label}</span>
      </div>
      <div className="relative">
        <div className="text-4xl font-display font-bold mb-3" style={{ color }}>{score}</div>
        <input type="range" min="0" max="100" value={score} onChange={e => onChange(+e.target.value)}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, ${color} ${score}%, #1E2130 ${score}%)` }} />
        <div className="flex justify-between text-[10px] text-[#374151] mt-1.5">
          <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
        </div>
      </div>
    </div>
  );
}

function ProjectStatusPill({ status }) {
  const map = {
    active: ['#4A9EFF', '#4A9EFF15'],
    completed: ['#00E5A0', '#00E5A015'],
    delayed: ['#FF6B35', '#FF6B3515'],
    'at-risk': ['#FF2D55', '#FF2D5515'],
    paused: ['#6B7280', '#6B728015'],
  };
  const [color, bg] = map[status] || map.active;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize" style={{ color, background: bg }}>{status}</span>;
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [healthScore, setHealthScore] = useState(100);
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [tab, setTab] = useState('overview');

  const load = async () => {
    try {
      const res = await clientsAPI.get(id);
      setClient(res.data);
      setHealthScore(res.data.health_score);
      setStatus(res.data.status);
      setNotes(res.data.notes || '');
    } catch { navigate('/clients'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const saveHealth = async () => {
    setSaving(true);
    await clientsAPI.update(id, { health_score: healthScore, status });
    setClient(c => ({ ...c, health_score: healthScore, status }));
    setSaving(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    await clientsAPI.update(id, { notes });
    setNotesDirty(false);
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00E5A0" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10"/></svg>
      <span className="text-[#6B7280] text-sm">Loading client...</span>
    </div>
  );

  const healthColor = healthScore >= 80 ? '#00E5A0' : healthScore >= 60 ? '#4A9EFF' : healthScore >= 40 ? '#FF6B35' : '#FF2D55';

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Breadcrumb + header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-[#6B7280] mb-4">
          <Link to="/clients" className="hover:text-white transition-colors">Clients</Link>
          <span>/</span>
          <span className="text-white">{client.name}</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-display font-bold text-black flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${healthColor}, ${healthColor}88)` }}>
              {client.name.charAt(0)}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white">{client.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                {client.email && <span className="text-sm text-[#6B7280]">{client.email}</span>}
                {client.industry && (
                  <span className="text-xs bg-[#1E2130] text-[#6B7280] px-2 py-0.5 rounded-full">{client.industry}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[client.status] || ''}`}>{client.status}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/clients" className="px-3 py-2 rounded-xl border border-[#1E2130] text-sm text-[#6B7280] hover:text-white transition-colors">
              ← Back
            </Link>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'MRR', value: `$${(client.mrr || 0).toLocaleString()}`, color: '#00E5A0' },
          { label: 'Contract Value', value: `$${(client.contract_value || 0).toLocaleString()}`, color: '#4A9EFF' },
          { label: 'Start Date', value: client.start_date || '—', color: '#A78BFA' },
          { label: 'Renewal Date', value: client.renewal_date || '—', color: '#FF6B35' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#111318] border border-[#1E2130] rounded-xl p-4">
            <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-1.5">{label}</div>
            <div className="text-lg font-display font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#111318] border border-[#1E2130] rounded-xl p-1 w-fit">
        {['overview', 'projects', 'notes'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-[#00E5A012] text-[#00E5A0] border border-[#00E5A020]' : 'text-[#6B7280] hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Health editor */}
          <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-6 space-y-5">
            <HealthGauge score={healthScore} onChange={setHealthScore} />
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5 uppercase tracking-wider">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00E5A040]">
                <option value="active">Active</option>
                <option value="at-risk">At Risk</option>
                <option value="churned">Churned</option>
              </select>
            </div>
            <button onClick={saveHealth} disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-black transition-all"
              style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
              {saving ? 'Saving...' : 'Save Health Score'}
            </button>
          </div>

          {/* Contact + details */}
          <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-6 space-y-4">
            <div className="font-medium text-white text-sm">Client Details</div>
            {[
              ['Company', client.company],
              ['Email', client.email],
              ['Phone', client.phone],
              ['Industry', client.industry],
              ['Phone', client.phone],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm border-b border-[#1E2130] pb-3">
                <span className="text-[#6B7280]">{label}</span>
                <span className="text-white">{value}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm border-b border-[#1E2130] pb-3">
              <span className="text-[#6B7280]">Added</span>
              <span className="text-white font-mono text-xs">{new Date(client.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Projects */}
      {tab === 'projects' && (
        <div className="space-y-3">
          {(!client.projects || client.projects.length === 0) ? (
            <div className="bg-[#111318] border border-[#1E2130] rounded-2xl py-16 text-center">
              <div className="text-[#6B7280] text-sm mb-3">No projects for this client yet</div>
              <Link to="/projects" className="text-xs text-[#00E5A0] hover:underline">→ Go to Projects to add one</Link>
            </div>
          ) : client.projects.map(p => {
            const budgetPct = p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0;
            return (
              <div key={p.id} className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5 flex items-center gap-5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-white">{p.name}</span>
                    <ProjectStatusPill status={p.status} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#1E2130] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#4A9EFF]" style={{ width: `${p.progress || 0}%` }} />
                    </div>
                    <span className="text-xs font-mono text-[#6B7280]">{p.progress || 0}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 text-sm">
                  <div className="font-mono text-white">${(p.budget || 0).toLocaleString()}</div>
                  <div className="text-xs text-[#6B7280]">{budgetPct}% used</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Notes */}
      {tab === 'notes' && (
        <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-white text-sm">Client Notes</span>
            {notesDirty && (
              <button onClick={saveNotes} disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-black"
                style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            )}
          </div>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); setNotesDirty(true); }}
            placeholder="Add notes about this client — key contacts, preferences, concerns, next steps..."
            rows={12}
            className="w-full bg-[#0A0B0F] border border-[#1E2130] rounded-xl px-4 py-3 text-sm text-white placeholder-[#374151] focus:outline-none focus:border-[#00E5A040] resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between text-xs text-[#374151]">
            <span>{notes.length} characters</span>
            {!notesDirty && notes && <span className="text-[#00E5A060]">✓ Saved</span>}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {tab === 'overview' && client.activities?.length > 0 && (
        <div className="bg-[#111318] border border-[#1E2130] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1E2130]">
            <span className="font-medium text-white text-sm">Activity History</span>
          </div>
          <div className="divide-y divide-[#1E2130]">
            {client.activities.map(a => (
              <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] flex-shrink-0" />
                <div className="flex-1 text-sm text-[#C4C9D4]">{a.title}</div>
                <span className="text-xs font-mono text-[#374151]">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
