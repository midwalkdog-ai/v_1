import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsAPI } from '../services/api';
import { RadialBarChart, RadialBar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const HEALTH_COLORS = { Healthy: '#00E5A0', Moderate: '#4A9EFF', 'At Risk': '#FF6B35', Critical: '#FF2D55' };

function MetricCard({ label, value, sub, accent, icon }) {
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5 hover:border-[#2A3040] transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {sub && <span className="text-xs font-mono text-[#6B7280] bg-[#1E2130] px-2 py-1 rounded-lg">{sub}</span>}
      </div>
      <div className="text-2xl font-display font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-[#6B7280] uppercase tracking-wider">{label}</div>
    </div>
  );
}

function HealthBar({ score }) {
  const color = score >= 80 ? '#00E5A0' : score >= 60 ? '#4A9EFF' : score >= 40 ? '#FF6B35' : '#FF2D55';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#1E2130] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await analyticsAPI.overview();
      setData(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resolveAlert = async (id) => {
    await analyticsAPI.resolveAlert(id);
    setData(d => ({ ...d, alerts: d.alerts.filter(a => a.id !== id) }));
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-[#6B7280]">
        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00E5A0" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10"/></svg>
        Loading dashboard...
      </div>
    </div>
  );

  const m = data?.metrics || {};
  const pieData = data?.healthDistribution?.map(h => ({ ...h, fill: HEALTH_COLORS[h.category] || '#6B7280' })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Command Center</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Real-time client health across your portfolio</p>
        </div>
        <div className="text-xs font-mono text-[#6B7280] bg-[#111318] border border-[#1E2130] px-3 py-2 rounded-xl">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total MRR" value={`$${(m.mrr || 0).toLocaleString()}`} sub={`ARR $${Math.round((m.arr || 0) / 1000)}k`} accent="#00E5A0"
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v14M5 6l4-4 4 4M5 12l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
        <MetricCard label="Active Clients" value={m.totalClients || 0} sub={`${m.atRisk || 0} at risk`} accent="#4A9EFF"
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>} />
        <MetricCard label="Avg Health Score" value={`${m.avgHealth || 0}%`} sub={m.avgHealth >= 75 ? '↑ Strong' : '↓ Watch'} accent={m.avgHealth >= 75 ? '#00E5A0' : '#FF6B35'}
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M2 9h2l3-6 4 12 3-6h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
        <MetricCard label="Projects" value={m.activeProjects || 0} sub={`${m.delayedProjects || 0} delayed`} accent={m.delayedProjects > 0 ? '#FF6B35' : '#00E5A0'}
          icon={<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="2" y="2" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>} />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#111318] border border-[#1E2130] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E2130] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-[#FF2D55] animate-pulse" />
                <span className="font-medium text-white text-sm">Active Alerts</span>
                {data?.alerts?.length > 0 && (
                  <span className="text-xs bg-[#FF2D5520] text-[#FF2D55] border border-[#FF2D5530] px-2 py-0.5 rounded-full font-mono">{data.alerts.length}</span>
                )}
              </div>
            </div>
            <div className="divide-y divide-[#1E2130]">
              {data?.alerts?.length === 0 && (
                <div className="px-5 py-8 text-center text-[#6B7280] text-sm">
                  <div className="w-10 h-10 bg-[#00E5A010] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l1.5 4.5h4.5l-3.7 2.7 1.4 4.3L9 11.2l-3.7 2.3 1.4-4.3L3 6.5h4.5z" stroke="#00E5A0" strokeWidth="1.3" strokeLinejoin="round"/></svg>
                  </div>
                  All clear — no active alerts
                </div>
              )}
              {data?.alerts?.map(alert => (
                <div key={alert.id} className="px-5 py-3.5 flex items-start gap-3 group hover:bg-[#0A0B0F] transition-colors">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${alert.severity === 'critical' ? 'bg-[#FF2D55]' : 'bg-[#FF6B35]'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[#E8EAF0]">{alert.message}</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">{new Date(alert.created_at).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => resolveAlert(alert.id)}
                    className="text-xs text-[#6B7280] hover:text-[#00E5A0] opacity-0 group-hover:opacity-100 transition-all px-2 py-1 rounded-lg hover:bg-[#00E5A010] flex-shrink-0">
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Top clients */}
          <div className="bg-[#111318] border border-[#1E2130] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E2130] flex items-center justify-between">
              <span className="font-medium text-white text-sm">Top Clients by MRR</span>
              <Link to="/clients" className="text-xs text-[#00E5A0] hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-[#1E2130]">
              {data?.topClients?.map(c => (
                <Link key={c.id} to={`/clients`}
                  className="px-5 py-3.5 flex items-center gap-4 hover:bg-[#0A0B0F] transition-colors group">
                  <div className="w-8 h-8 rounded-xl bg-[#1E2130] flex items-center justify-center text-xs font-bold text-[#00E5A0] flex-shrink-0 font-display">
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{c.name}</div>
                    <HealthBar score={c.health_score} />
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-mono text-[#00E5A0]">${c.mrr?.toLocaleString()}</div>
                    <div className="text-xs text-[#6B7280]">MRR</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${c.status === 'at-risk' ? 'bg-[#FF6B3520] text-[#FF6B35] border border-[#FF6B3530]' : 'bg-[#00E5A012] text-[#00E5A0] border border-[#00E5A020]'}`}>
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Health distribution */}
          <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5">
            <div className="font-medium text-white text-sm mb-4">Health Distribution</div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="count">
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111318', border: '1px solid #1E2130', borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {pieData.map(d => (
                    <div key={d.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.fill }} />
                        <span className="text-[#6B7280]">{d.category}</span>
                      </div>
                      <span className="font-mono text-white">{d.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : <div className="text-center text-[#6B7280] text-sm py-8">No client data</div>}
          </div>

          {/* Recent activity */}
          <div className="bg-[#111318] border border-[#1E2130] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1E2130]">
              <span className="font-medium text-white text-sm">Activity Feed</span>
            </div>
            <div className="px-5 py-3 space-y-3 max-h-64 overflow-y-auto">
              {data?.recentActivity?.length === 0 && <div className="text-[#6B7280] text-xs py-4 text-center">No recent activity</div>}
              {data?.recentActivity?.map(a => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00E5A0] mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-[#E8EAF0]">{a.title}</div>
                    {a.client_name && <div className="text-[11px] text-[#6B7280]">{a.client_name}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
