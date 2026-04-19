import { useEffect, useState } from 'react';
import { analyticsAPI, clientsAPI } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';

const HEALTH_COLORS = { Healthy: '#00E5A0', Moderate: '#4A9EFF', 'At Risk': '#FF6B35', Critical: '#FF2D55' };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-xl px-3 py-2.5 shadow-xl">
      {label && <div className="text-xs text-[#6B7280] mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white font-mono">{typeof p.value === 'number' && p.name?.toLowerCase().includes('mrr') ? `$${p.value.toLocaleString()}` : p.value}</span>
          <span className="text-[#6B7280] text-xs">{p.name}</span>
        </div>
      ))}
    </div>
  );
};

function StatPanel({ label, value, sub, color = '#00E5A0' }) {
  return (
    <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5">
      <div className="text-xs text-[#6B7280] uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-display font-bold text-white">{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color }}>{sub}</div>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsAPI.overview(), clientsAPI.list()])
      .then(([overview, cl]) => { setData(overview.data); setClients(cl.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#00E5A0" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10"/></svg>
      <span className="text-[#6B7280] text-sm">Loading analytics...</span>
    </div>
  );

  const m = data?.metrics || {};
  const pieData = (data?.healthDistribution || []).map(h => ({ ...h, fill: HEALTH_COLORS[h.category] || '#6B7280' }));

  // MRR by client bar data
  const mrrData = [...clients]
    .sort((a, b) => (b.mrr || 0) - (a.mrr || 0))
    .slice(0, 8)
    .map(c => ({ name: c.name.split(' ')[0], mrr: c.mrr || 0, health: c.health_score }));

  // Health score distribution bar
  const healthBuckets = [
    { range: '0–20', count: clients.filter(c => c.health_score <= 20).length },
    { range: '21–40', count: clients.filter(c => c.health_score > 20 && c.health_score <= 40).length },
    { range: '41–60', count: clients.filter(c => c.health_score > 40 && c.health_score <= 60).length },
    { range: '61–80', count: clients.filter(c => c.health_score > 60 && c.health_score <= 80).length },
    { range: '81–100', count: clients.filter(c => c.health_score > 80).length },
  ];

  // Simulated MRR trend (last 6 months from current data)
  const baseMrr = m.mrr || 0;
  const mrrTrend = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((month, i) => ({
    month,
    mrr: Math.round(baseMrr * (0.72 + i * 0.058) + (Math.random() * 200 - 100)),
  }));

  const churnRate = m.totalClients > 0 ? ((m.atRisk / m.totalClients) * 100).toFixed(1) : 0;
  const totalARR = m.arr || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Revenue intelligence & client health breakdown</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatPanel label="Monthly Recurring Revenue" value={`$${(m.mrr || 0).toLocaleString()}`} sub={`ARR: $${totalARR.toLocaleString()}`} />
        <StatPanel label="At-Risk Revenue" value={`$${clients.filter(c => c.status === 'at-risk').reduce((s, c) => s + (c.mrr || 0), 0).toLocaleString()}`} sub={`${m.atRisk} clients at risk`} color="#FF6B35" />
        <StatPanel label="Portfolio Health" value={`${m.avgHealth}%`} sub={m.avgHealth >= 75 ? '↑ Above target' : '↓ Below target (75%)'} color={m.avgHealth >= 75 ? '#00E5A0' : '#FF6B35'} />
        <StatPanel label="Churn Risk Rate" value={`${churnRate}%`} sub={`${m.atRisk} of ${m.totalClients} clients`} color={churnRate > 20 ? '#FF2D55' : '#4A9EFF'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* MRR Trend */}
        <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5">
          <div className="font-medium text-white text-sm mb-5">MRR Trend (6 months)</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mrrTrend} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="mrr" name="MRR" stroke="#00E5A0" strokeWidth={2} fill="url(#mrrGrad)" dot={{ fill: '#00E5A0', strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* MRR by Client */}
        <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5">
          <div className="font-medium text-white text-sm mb-5">MRR by Client</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mrrData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(1)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="mrr" name="MRR" fill="#4A9EFF" radius={[4, 4, 0, 0]}>
                {mrrData.map((entry, i) => (
                  <Cell key={i} fill={entry.health >= 80 ? '#00E5A0' : entry.health >= 60 ? '#4A9EFF' : entry.health >= 40 ? '#FF6B35' : '#FF2D55'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3 text-xs text-[#6B7280]">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#00E5A0]" />Healthy (80+)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#4A9EFF]" />Moderate</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[#FF6B35]" />At Risk</div>
          </div>
        </div>

        {/* Health Score Distribution */}
        <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5">
          <div className="font-medium text-white text-sm mb-5">Health Score Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={healthBuckets} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
              <CartesianGrid stroke="#1E2130" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Clients" radius={[4, 4, 0, 0]}>
                {healthBuckets.map((entry, i) => (
                  <Cell key={i} fill={['#FF2D55', '#FF6B35', '#FF6B35', '#4A9EFF', '#00E5A0'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Health Breakdown Pie + Stats */}
        <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5">
          <div className="font-medium text-white text-sm mb-4">Portfolio Breakdown</div>
          <div className="flex items-center gap-5">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} dataKey="count">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {pieData.map(d => (
                <div key={d.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                    <span className="text-xs text-[#6B7280]">{d.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-1 bg-[#1E2130] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(d.count / (m.totalClients || 1)) * 100}%`, background: d.fill }} />
                    </div>
                    <span className="text-xs font-mono text-white w-4 text-right">{d.count}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-[#1E2130] flex justify-between text-xs">
                <span className="text-[#6B7280]">Total</span>
                <span className="font-mono text-white">{m.totalClients}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client health table */}
      <div className="bg-[#111318] border border-[#1E2130] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1E2130]">
          <span className="font-medium text-white text-sm">All Clients · Health & Revenue</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E2130]">
                {['Client', 'Industry', 'Status', 'Health Score', 'MRR', 'Contract Value'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2130]">
              {[...clients].sort((a, b) => (a.health_score || 0) - (b.health_score || 0)).map(c => {
                const color = c.health_score >= 80 ? '#00E5A0' : c.health_score >= 60 ? '#4A9EFF' : c.health_score >= 40 ? '#FF6B35' : '#FF2D55';
                return (
                  <tr key={c.id} className="hover:bg-[#0A0B0F] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-[#1E2130] flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ color }}>
                          {c.name.charAt(0)}
                        </div>
                        <span className="text-sm text-white font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-[#6B7280]">{c.industry || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${c.status === 'at-risk' ? 'bg-[#FF6B3515] text-[#FF6B35] border-[#FF6B3525]' : c.status === 'churned' ? 'bg-[#6B728015] text-[#6B7280] border-[#6B728025]' : 'bg-[#00E5A012] text-[#00E5A0] border-[#00E5A020]'}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#1E2130] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${c.health_score}%`, background: color }} />
                        </div>
                        <span className="text-xs font-mono" style={{ color }}>{c.health_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-mono text-[#00E5A0]">${(c.mrr || 0).toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-[#6B7280]">${(c.contract_value || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
