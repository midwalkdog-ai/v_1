const { db } = require('./database');

// Health score calculation: combines multiple factors
// Usage: updateClientHealthScore(client_id)
function calculateHealthScore(clientId) {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
  if (!client) return null;

  let score = 100;

  // Days since last contact
  const lastContact = db.prepare(`
    SELECT created_at FROM activities 
    WHERE client_id = ? ORDER BY created_at DESC LIMIT 1
  `).get(clientId);
  if (lastContact) {
    const daysSince = Math.floor((Date.now() - new Date(lastContact.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 90) score -= 30;
    else if (daysSince > 60) score -= 20;
    else if (daysSince > 30) score -= 10;
  } else {
    score -= 40; // No contact ever
  }

  // Overdue projects
  const overdueProjects = db.prepare(`
    SELECT COUNT(*) as count FROM projects 
    WHERE client_id = ? AND status IN ('delayed', 'at-risk')
  `).get(clientId);
  if (overdueProjects.count > 0) {
    score -= Math.min(overdueProjects.count * 15, 40);
  }

  // Renewal coming up
  if (client.renewal_date) {
    const daysUntilRenewal = Math.floor((new Date(client.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilRenewal < 0) score -= 50; // Overdue renewal
    else if (daysUntilRenewal < 30) score -= 20;
  }

  // Budget overrun
  const projects = db.prepare(`
    SELECT SUM(budget) as total_budget, SUM(spent) as total_spent 
    FROM projects WHERE client_id = ?
  `).get(clientId);
  if (projects.total_budget && projects.total_spent > projects.total_budget * 1.1) {
    score -= 15;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function updateClientHealthScore(clientId) {
  const score = calculateHealthScore(clientId);
  if (score !== null) {
    db.prepare('UPDATE clients SET health_score = ? WHERE id = ?').run(score, clientId);
  }
  return score;
}

// Run health recalc for all clients
function recalculateAllHealthScores() {
  const clients = db.prepare('SELECT id FROM clients').all();
  let updated = 0;
  for (const { id } of clients) {
    if (updateClientHealthScore(id)) updated++;
  }
  return updated;
}

module.exports = {
  calculateHealthScore,
  updateClientHealthScore,
  recalculateAllHealthScores,
};
