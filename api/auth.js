// Vercel Serverless Function: POST /api/auth
// Authentification pastorale sécurisée côté serveur sans exposer le mot de passe au navigateur

const crypto = require('crypto');

function getExpectedToken() {
  const secret = process.env.ADMIN_PASSWORD || '11eheure';
  return crypto.createHash('sha256').update(secret + '_tabernacle_salt_2026').digest('hex');
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
    const validPass = process.env.ADMIN_PASSWORD || '11eheure';
    const validPin = process.env.ADMIN_PIN || '1177';

    if (password && (password === validPass || password === validPin)) {
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
