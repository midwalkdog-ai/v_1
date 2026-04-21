/**
 * PulseBoard Email Notifications
 * Uses Resend (resend.com) — free tier: 3,000 emails/mo
 *
 * Setup:
 *   1. Sign up at resend.com
 *   2. Get API key
 *   3. Add RESEND_API_KEY and EMAIL_FROM to .env
 *   4. Verify your sending domain in Resend dashboard
 *
 * Called from:
 *   - billing webhook: invoice.payment_failed → sendPaymentFailedEmail
 *   - billing webhook: customer.subscription.trial_will_end → sendTrialEndingEmail
 *   - auth register: → sendWelcomeEmail
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'PulseBoard <noreply@yourdomain.com>';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Base send function using Resend REST API (no SDK needed)
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn(`📧 Email not sent (RESEND_API_KEY not set): ${subject} → ${to}`);
    return { skipped: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Resend API error');
    console.log(`📧 Email sent: ${subject} → ${to} (${data.id})`);
    return data;
  } catch (err) {
    console.error(`📧 Email failed: ${subject} → ${to}:`, err.message);
    return { error: err.message };
  }
}

// ─── Email Templates ─────────────────────────────────────────────────────────

function baseTemplate(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { margin: 0; padding: 0; background: #0A0B0F; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .container { max-width: 560px; margin: 40px auto; padding: 0 20px; }
        .card { background: #111318; border: 1px solid #1E2130; border-radius: 16px; padding: 40px; }
        .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
        .logo-icon { width: 32px; height: 32px; background: linear-gradient(135deg, #00E5A0, #00B57A); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text { color: #ffffff; font-weight: 700; font-size: 18px; letter-spacing: -0.5px; }
        h1 { color: #E8EAF0; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; }
        p { color: #9CA3AF; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #00E5A0, #00C988); color: #000 !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin: 8px 0 24px; }
        .divider { border: none; border-top: 1px solid #1E2130; margin: 24px 0; }
        .footer { color: #374151; font-size: 12px; text-align: center; margin-top: 24px; }
        .highlight { color: #00E5A0; }
        .warning { color: #FF6B35; }
        .danger { color: #FF2D55; }
        .info-box { background: #0A0B0F; border: 1px solid #1E2130; border-radius: 10px; padding: 16px; margin: 16px 0; }
        .info-box p { margin: 0; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">
            <div class="logo-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5L14 5V8C14 11.3 11.3 14 8 14C4.7 14 2 11.3 2 8V5L8 1.5Z" fill="white" fill-opacity="0.9"/>
                <path d="M5.5 8L7 9.5L10.5 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="logo-text">PulseBoard</span>
          </div>
          ${content}
          <hr class="divider">
          <div class="footer">
            You're receiving this because you have a PulseBoard account.<br>
            <a href="${APP_URL}" style="color: #374151;">Manage preferences</a> · 
            <a href="${APP_URL}/billing" style="color: #374151;">Billing</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// 1. Welcome email — sent on registration
async function sendWelcomeEmail({ to, name }) {
  return sendEmail({
    to,
    subject: 'Welcome to PulseBoard',
    html: baseTemplate(`
      <h1>Welcome, ${name} 👋</h1>
      <p>You're in. PulseBoard is your command center for client health, revenue, and project intelligence.</p>
      <p>Here's what to do first:</p>
      <div class="info-box">
        <p>1. <strong style="color:#E8EAF0">Add your first client</strong> — head to the Clients page</p>
        <br>
        <p>2. <strong style="color:#E8EAF0">Create a project</strong> — link it to a client and start tracking</p>
        <br>
        <p>3. <strong style="color:#E8EAF0">Check your dashboard</strong> — health scores update automatically</p>
      </div>
      <a href="${APP_URL}" class="btn">Open PulseBoard →</a>
      <p style="font-size:13px; color:#6B7280;">Your free trial gives you full access for 14 days. No credit card needed to start.</p>
    `),
  });
}

// 2. Trial ending soon — sent 3 days before trial end
async function sendTrialEndingEmail({ to, name, trialEndDate, plan }) {
  const formattedDate = new Date(trialEndDate).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  return sendEmail({
    to,
    subject: 'Your PulseBoard trial ends in 3 days',
    html: baseTemplate(`
      <h1>Trial ending soon</h1>
      <p>Hi ${name}, your free trial of <span class="highlight">${plan || 'PulseBoard'}</span> ends on <strong style="color:#E8EAF0">${formattedDate}</strong>.</p>
      <p>Add a payment method now to keep uninterrupted access to all your clients, projects, and analytics.</p>
      <a href="${APP_URL}/billing" class="btn">Add payment method →</a>
      <div class="info-box">
        <p style="color:#6B7280">What happens if I don't upgrade?</p>
        <p>Your account reverts to the free tier — limited to 3 clients. All your data is kept safe and you can upgrade any time.</p>
      </div>
    `),
  });
}

// 3. Payment failed — sent when invoice payment fails
async function sendPaymentFailedEmail({ to, name, amount, nextRetry }) {
  const formattedAmount = amount ? `$${(amount / 100).toFixed(2)}` : 'your subscription payment';
  return sendEmail({
    to,
    subject: 'Action required: Payment failed',
    html: baseTemplate(`
      <h1><span class="danger">Payment failed</span></h1>
      <p>Hi ${name}, we were unable to process your payment of <strong style="color:#E8EAF0">${formattedAmount}</strong> for your PulseBoard subscription.</p>
      <p>Please update your payment method to avoid losing access.</p>
      <a href="${APP_URL}/billing" class="btn">Update payment method →</a>
      <div class="info-box">
        <p style="color:#FF6B35">⚠ What happens next</p>
        <p style="margin-top:8px">Stripe will retry your payment automatically. If it continues to fail, your subscription will be paused. Update your card to prevent interruption.</p>
      </div>
    `),
  });
}

// 4. Subscription canceled — confirmation on cancellation
async function sendCancellationEmail({ to, name, accessUntil }) {
  const formattedDate = new Date(accessUntil).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  return sendEmail({
    to,
    subject: 'Your PulseBoard subscription has been canceled',
    html: baseTemplate(`
      <h1>Subscription canceled</h1>
      <p>Hi ${name}, your PulseBoard subscription has been canceled as requested.</p>
      <div class="info-box">
        <p><strong style="color:#E8EAF0">You have access until:</strong> ${formattedDate}</p>
        <p style="margin-top:8px;color:#6B7280">After this date, your account reverts to the free tier (3 clients). All your data remains safe.</p>
      </div>
      <p>Changed your mind? You can reactivate any time before your access ends.</p>
      <a href="${APP_URL}/billing" class="btn">Reactivate subscription →</a>
    `),
  });
}

// 5. Payment succeeded — receipt confirmation
async function sendPaymentSucceededEmail({ to, name, amount, nextBillingDate }) {
  const formattedAmount = amount ? `$${(amount / 100).toFixed(2)}` : 'your subscription';
  const formattedDate = nextBillingDate
    ? new Date(nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  return sendEmail({
    to,
    subject: `Payment confirmed — ${formattedAmount}`,
    html: baseTemplate(`
      <h1><span class="highlight">Payment confirmed</span></h1>
      <p>Hi ${name}, your payment of <strong style="color:#E8EAF0">${formattedAmount}</strong> has been processed successfully.</p>
      ${formattedDate ? `<p>Your next billing date is <strong style="color:#E8EAF0">${formattedDate}</strong>.</p>` : ''}
      <a href="${APP_URL}/billing" class="btn">View billing details →</a>
      <p style="font-size:13px; color:#6B7280">Need a receipt? Download it from the billing portal.</p>
    `),
  });
}

module.exports = {
  sendWelcomeEmail,
  sendTrialEndingEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
  sendPaymentSucceededEmail,
};
