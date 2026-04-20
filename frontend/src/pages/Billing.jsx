import { useEffect, useState } from 'react';
import { billingAPI } from '../services/api';

const PLAN_COLORS = {
  starter: { accent: '#4A9EFF', glow: '#4A9EFF20' },
  growth:  { accent: '#00E5A0', glow: '#00E5A020' },
  agency:  { accent: '#A78BFA', glow: '#A78BFA20' },
};

function StatusBadge({ status }) {
  const map = {
    active:   ['#00E5A0', 'Active'],
    trialing: ['#4A9EFF', 'Trial'],
    past_due: ['#FF6B35', 'Past Due'],
    canceled: ['#6B7280', 'Canceled'],
    free:     ['#6B7280', 'Free'],
    expired:  ['#FF2D55', 'Expired'],
  };
  const [color, label] = map[status] || map.free;
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{ color, background: `${color}18`, border: `1px solid ${color}30` }}>
      {label}
    </span>
  );
}

function PlanCard({ plan, currentPlan, onSelect, loading }) {
  const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.starter;
  const isCurrentPlan = currentPlan === plan.name;
  const isPopular = plan.id === 'growth';

  return (
    <div className={`relative bg-[#111318] rounded-2xl p-6 flex flex-col transition-all duration-200 border ${
      isCurrentPlan
        ? 'border-[#00E5A060]'
        : isPopular
        ? `border-[${colors.accent}40]`
        : 'border-[#1E2130] hover:border-[#2A3045]'
    }`}
      style={{ boxShadow: isCurrentPlan || isPopular ? `0 0 30px ${colors.glow}` : 'none' }}>

      {isPopular && !isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-black"
          style={{ background: colors.accent }}>
          MOST POPULAR
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-black bg-[#00E5A0]">
          CURRENT PLAN
        </div>
      )}

      <div className="mb-5">
        <div className="text-sm font-medium mb-1" style={{ color: colors.accent }}>{plan.name}</div>
        <div className="flex items-end gap-1">
          <span className="text-4xl font-display font-bold text-white">{plan.amount_formatted.split('/')[0]}</span>
          <span className="text-[#6B7280] text-sm mb-1">/mo</span>
        </div>
        <div className="text-xs text-[#6B7280] mt-1">14-day free trial included</div>
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map((f, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-[#C4C9D4]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke={colors.accent} strokeWidth="1.3"/>
              <path d="M4.5 7l2 2 3-3" stroke={colors.accent} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {f}
          </li>
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.id)}
        disabled={isCurrentPlan || loading}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={isCurrentPlan
          ? { background: '#1E2130', color: '#6B7280' }
          : { background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}CC)`, color: '#000' }
        }>
        {loading ? 'Redirecting...' : isCurrentPlan ? 'Current Plan' : `Start with ${plan.name}`}
      </button>
    </div>
  );
}

export default function Billing() {
  const [plans, setPlans] = useState([]);
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([billingAPI.plans(), billingAPI.status()])
      .then(([plansRes, statusRes]) => {
        setPlans(plansRes.data);
        setSubStatus(statusRes.data);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load billing info'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectPlan = async (planId) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await billingAPI.checkout(planId);
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start checkout. Check Stripe configuration.');
      setActionLoading(false);
    }
  };

  const handlePortal = async () => {
    setActionLoading(true);
    try {
      const res = await billingAPI.portal();
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to open billing portal.');
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel at end of billing period? You keep access until then.')) return;
    setActionLoading(true);
    try {
      await billingAPI.cancel();
      const res = await billingAPI.status();
      setSubStatus(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel.');
    } finally { setActionLoading(false); }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await billingAPI.resume();
      const res = await billingAPI.status();
      setSubStatus(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resume.');
    } finally { setActionLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <svg className="animate-spin w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#00E5A0" strokeWidth="2" strokeDasharray="30" strokeDashoffset="10"/>
      </svg>
      <span className="text-[#6B7280] text-sm">Loading billing...</span>
    </div>
  );

  const hasPaidPlan = subStatus?.status === 'active' || subStatus?.status === 'trialing';
  const periodEnd = subStatus?.current_period_end
    ? new Date(subStatus.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const trialEnd = subStatus?.trial_ends_at
    ? new Date(subStatus.trial_ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Billing</h1>
        <p className="text-sm text-[#6B7280] mt-0.5">Manage your subscription and payment details</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3.5 bg-[#FF2D5510] border border-[#FF2D5525] rounded-xl text-sm text-[#FF2D55]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3.5M8 10v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Current subscription status */}
      {subStatus && (
        <div className="bg-[#111318] border border-[#1E2130] rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium text-white">{subStatus.plan || 'Free Plan'}</span>
                <StatusBadge status={subStatus.status} />
                {subStatus.cancel_at_period_end && (
                  <span className="text-xs text-[#FF6B35] bg-[#FF6B3510] border border-[#FF6B3520] px-2 py-0.5 rounded-full">
                    Cancels {periodEnd}
                  </span>
                )}
              </div>
              <div className="text-sm text-[#6B7280]">
                {subStatus.status === 'free' && 'You are on the free plan — limited to 3 clients.'}
                {subStatus.status === 'trialing' && trialEnd && `Free trial active — ends ${trialEnd}.`}
                {subStatus.status === 'active' && !subStatus.cancel_at_period_end && periodEnd && `Next billing date: ${periodEnd}`}
                {subStatus.status === 'active' && subStatus.cancel_at_period_end && `Access until: ${periodEnd}`}
                {subStatus.status === 'past_due' && 'Payment failed — please update your payment method.'}
                {subStatus.status === 'canceled' && 'Subscription canceled. Reactivate below to continue.'}
              </div>
              <div className="text-xs text-[#374151] mt-1.5">
                Client limit: <span className="text-white font-mono">{subStatus.client_limit === 999999 ? 'Unlimited' : subStatus.client_limit}</span>
              </div>
            </div>

            {hasPaidPlan && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {subStatus.cancel_at_period_end ? (
                  <button onClick={handleResume} disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-black disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #00E5A0, #00C988)' }}>
                    {actionLoading ? 'Loading...' : 'Resume Subscription'}
                  </button>
                ) : (
                  <>
                    <button onClick={handlePortal} disabled={actionLoading}
                      className="px-4 py-2 rounded-xl border border-[#1E2130] text-sm text-[#C4C9D4] hover:text-white hover:border-[#2A3045] transition-all disabled:opacity-50">
                      {actionLoading ? 'Loading...' : 'Manage Billing'}
                    </button>
                    <button onClick={handleCancel} disabled={actionLoading}
                      className="px-4 py-2 rounded-xl border border-[#FF2D5520] text-sm text-[#FF2D55] hover:bg-[#FF2D5510] transition-all disabled:opacity-50">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pricing plans */}
      <div>
        <div className="font-medium text-white mb-1">
          {hasPaidPlan ? 'Change Plan' : 'Choose a Plan'}
        </div>
        <p className="text-sm text-[#6B7280] mb-5">All plans include a 14-day free trial. No credit card required to start.</p>

        {plans.length === 0 ? (
          <div className="bg-[#111318] border border-[#FF6B3530] rounded-2xl p-6 text-sm text-[#FF6B35]">
            ⚠️ Stripe price IDs not configured. Set <code className="font-mono bg-[#1E2130] px-1.5 py-0.5 rounded">STRIPE_PRICE_STARTER</code>, <code className="font-mono bg-[#1E2130] px-1.5 py-0.5 rounded">STRIPE_PRICE_GROWTH</code>, and <code className="font-mono bg-[#1E2130] px-1.5 py-0.5 rounded">STRIPE_PRICE_AGENCY</code> in your <code className="font-mono bg-[#1E2130] px-1.5 py-0.5 rounded">.env</code> file.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={subStatus?.plan}
                onSelect={handleSelectPlan}
                loading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* FAQ */}
      <div className="bg-[#111318] border border-[#1E2130] rounded-2xl divide-y divide-[#1E2130]">
        {[
          ['What happens after the trial?', 'Your plan activates automatically and your card is charged. Cancel any time before the trial ends with no charge.'],
          ['Can I switch plans?', 'Yes. Upgrade or downgrade at any time. Changes take effect immediately with prorated billing.'],
          ['What payment methods are accepted?', 'All major credit and debit cards (Visa, Mastercard, Amex) via Stripe. Bank transfers available on Agency plan.'],
          ['What happens if I cancel?', 'You keep full access until the end of your current billing period, then your account reverts to the free tier (3 clients).'],
          ['Is my data safe if I cancel?', 'Yes. Your data is retained for 90 days after cancellation. You can reactivate and pick up where you left off.'],
        ].map(([q, a]) => (
          <div key={q} className="px-5 py-4">
            <div className="text-sm font-medium text-white mb-1">{q}</div>
            <div className="text-sm text-[#6B7280]">{a}</div>
          </div>
        ))}
      </div>

      {/* Powered by Stripe badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-[#374151]">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 4V10L7 13L1 10V4L7 1Z" stroke="#374151" strokeWidth="1.2" strokeLinejoin="round"/></svg>
        Payments securely processed by Stripe. PulseBoard never stores your card details.
      </div>
    </div>
  );
}
