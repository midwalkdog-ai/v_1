const { db } = require('../db/database');

// Resolve current plan limits for a user
function getUserPlanLimits(userId) {
  const sub = db.prepare(`
    SELECT status, plan_name, price_id, current_period_end, trial_ends_at
    FROM subscriptions
    WHERE user_id = ? AND status IN ('active', 'trialing')
    ORDER BY created_at DESC LIMIT 1
  `).get(userId);

  if (!sub) return { plan: 'free', client_limit: 3, project_limit: 5, status: 'free' };

  // Check trial / period still valid
  const now = new Date();
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null;
  const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;

  const isActive = sub.status === 'active' && periodEnd && now < periodEnd;
  const isTrialing = sub.status === 'trialing' && trialEnd && now < trialEnd;

  if (!isActive && !isTrialing) {
    return { plan: 'free', client_limit: 3, project_limit: 5, status: 'expired' };
  }

  // Match plan limits
  const LIMITS = {
    Starter: { client_limit: 10, project_limit: 50 },
    Growth:  { client_limit: 50, project_limit: 500 },
    Agency:  { client_limit: 999999, project_limit: 999999 },
  };

  const limits = LIMITS[sub.plan_name] || { client_limit: 10, project_limit: 50 };
  return { plan: sub.plan_name, status: sub.status, ...limits };
}

// Middleware: Enforce client creation limit
function enforceClientLimit(req, res, next) {
  const limits = getUserPlanLimits(req.user.id);
  const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients WHERE user_id = ?').get(req.user.id);

  if (clientCount.count >= limits.client_limit) {
    return res.status(403).json({
      error: `Client limit reached for ${limits.plan} plan (${limits.client_limit} max).`,
      upgrade_required: true,
      current_plan: limits.plan,
      current_count: clientCount.count,
      limit: limits.client_limit,
    });
  }
  next();
}

// Middleware: Enforce project creation limit
function enforceProjectLimit(req, res, next) {
  const limits = getUserPlanLimits(req.user.id);
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects WHERE user_id = ?').get(req.user.id);

  if (projectCount.count >= limits.project_limit) {
    return res.status(403).json({
      error: `Project limit reached for ${limits.plan} plan (${limits.project_limit} max).`,
      upgrade_required: true,
      current_plan: limits.plan,
      current_count: projectCount.count,
      limit: limits.project_limit,
    });
  }
  next();
}

// Middleware: Require any paid subscription (blocks free tier from premium features)
function requirePaidPlan(req, res, next) {
  const limits = getUserPlanLimits(req.user.id);
  if (limits.plan === 'free' || limits.status === 'expired') {
    return res.status(403).json({
      error: 'This feature requires a paid subscription.',
      upgrade_required: true,
      current_plan: limits.plan,
    });
  }
  next();
}

module.exports = { getUserPlanLimits, enforceClientLimit, enforceProjectLimit, requirePaidPlan };
