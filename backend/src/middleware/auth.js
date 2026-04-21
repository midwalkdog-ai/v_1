const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Accept token from Authorization header OR ?token= query param (for file downloads)
  const auth = req.headers.authorization;
  const queryToken = req.query.token;
  const token = (auth && auth.startsWith('Bearer ')) ? auth.split(' ')[1] : queryToken;

  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pulseboard_secret_change_in_prod');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
