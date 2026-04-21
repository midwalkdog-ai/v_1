import { useNavigate } from 'react-router-dom';

/**
 * UpgradePrompt — shown when user hits a plan limit (403 upgrade_required from API)
 *
 * Usage:
 *   const [upgradePrompt, setUpgradePrompt] = useState(null);
 *
 *   try {
 *     await clientsAPI.create(form);
 *   } catch (err) {
 *     if (err.response?.data?.upgrade_required) {
 *       setUpgradePrompt(err.response.data);
 *     }
 *   }
 *
 *   {upgradePrompt && (
 *     <UpgradePrompt data={upgradePrompt} onClose={() => setUpgradePrompt(null)} />
 *   )}
 */
export default function UpgradePrompt({ data, onClose }) {
  const navigate = useNavigate();

  if (!data) return null;

  const PLAN_SUGGESTION = {
    free: { plan: 'Starter', price: '$49/mo', limit_label: 'starter' },
    Starter: { plan: 'Growth', price: '$99/mo', limit_label: 'growth' },
    Growth: { plan: 'Agency', price: '$199/mo', limit_label: 'agency' },
  };

  const suggestion = PLAN_SUGGESTION[data.current_plan] || { plan: 'a paid plan', price: 'starting at $49/mo' };
  const resourceType = data.error?.toLowerCase().includes('client') ? 'clients' : 'projects';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111318] border border-[#00E5A030] rounded-2xl p-7 w-full max-w-sm shadow-2xl animate-slide-up"
        style={{ boxShadow: '0 0 60px rgba(0,229,160,0.08)' }}>

        {/* Icon */}
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: 'linear-gradient(135deg, #00E5A020, #00E5A010)', border: '1px solid #00E5A030' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M11 2L20 7V15L11 20L2 15V7L11 2Z" stroke="#00E5A0" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M11 8v4M11 14v.5" stroke="#00E5A0" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        {/* Heading */}
        <h2 className="font-display font-bold text-white text-lg text-center mb-2">
          Plan limit reached
        </h2>
        <p className="text-sm text-[#6B7280] text-center mb-5 leading-relaxed">
          You've hit the {resourceType} limit for your <span className="text-white">{data.current_plan || 'free'} plan</span>
          {data.limit && ` (${data.current_count} of ${data.limit})`}.
          Upgrade to <span className="text-[#00E5A0]">{suggestion.plan}</span> to continue.
        </p>

        {/* Plan callout */}
        <div className="bg-[#00E5A010] border border-[#00E5A025] rounded-xl px-4 py-3.5 mb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">{suggestion.plan}</div>
              <div className="text-xs text-[#6B7280] mt-0.5">Includes 14-day free trial</div>
            </div>
            <div className="text-lg font-display font-bold text-[#00E5A0]">{suggestion.price}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#1E2130] text-sm text-[#6B7280] hover:text-white transition-all">
            Not now
          </button>
          <button
            onClick={() => { onClose(); navigate('/billing'); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-black transition-all"
            style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
            Upgrade →
          </button>
        </div>
      </div>
    </div>
  );
}
