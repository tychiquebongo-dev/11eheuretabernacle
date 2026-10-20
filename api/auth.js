// Vercel Serverless Function: POST /api/auth
// Authentification pastorale sécurisée côté serveur sans exposer le mot de passe au navigateur

const crypto = require('crypto');

function getExpectedToken() {
  const configuredPass = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
  const configuredPin = process.env.ADMIN_PIN ? process.env.ADMIN_PIN.trim() : '';
  if (!configuredPass && !configuredPin) {
    return null; // Aucun token possible si les variables d'environnement ne sont pas définies
  }
  const secretKey = `${configuredPass}|${configuredPin}`;
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

    // Sécurité stricte : Si aucune variable n'est définie sur Vercel, refuser toute connexion (aucun mot de passe par défaut)
    if (!configuredPass && !configuredPin) {
      return res.status(503).json({
        success: false,
        error: 'Accès impossible : Les variables ADMIN_PASSWORD ou ADMIN_PIN ne sont pas encore configurées sur Vercel. Le Back Office est verrouillé par sécurité.'
      });
    }

    let isAuthorized = false;
    if (configuredPass && password === configuredPass) isAuthorized = true;
    if (configuredPin && password === configuredPin) isAuthorized = true;

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
