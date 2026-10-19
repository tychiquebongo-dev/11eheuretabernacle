// Vercel Serverless Function: POST /api/auth
// Authentification pastorale sécurisée côté serveur sans exposer le mot de passe au navigateur

const crypto = require('crypto');

function getExpectedToken() {
  const configuredPass = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
  const configuredPin = process.env.ADMIN_PIN ? process.env.ADMIN_PIN.trim() : '';
  const secretKey = (configuredPass || configuredPin)
    ? `${configuredPass}|${configuredPin}`
    : '11eheure_tabernacle_2026_default';
  return crypto.createHash('sha256').update(secretKey + '_tabernacle_salt_2026').digest('hex');
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  try {
    const { password } = req.body || {};
    const configuredPass = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
    const configuredPin = process.env.ADMIN_PIN ? process.env.ADMIN_PIN.trim() : '';

    let isAuthorized = false;
    if (configuredPass || configuredPin) {
      if (configuredPass && password === configuredPass) isAuthorized = true;
      if (configuredPin && password === configuredPin) isAuthorized = true;
    } else {
      if (password === '11eheure' || password === '1177') isAuthorized = true;
    }

    if (isAuthorized) {
      const token = getExpectedToken();
      return res.status(200).json({
        success: true,
        token: token,
        message: 'Authentification pastorale réussie'
      });
    } else {
      return res.status(401).json({
        success: false,
        error: 'Code d\'accès ou mot de passe pastoral incorrect'
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
