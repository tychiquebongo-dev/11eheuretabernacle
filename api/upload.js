// Vercel Serverless Function: POST /api/upload
// Téléversement sécurisé vers ImgBB avec vérification d'authentification pastorale

const crypto = require('crypto');

function getExpectedToken() {
  const configuredPass = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : '';
  const configuredPin = process.env.ADMIN_PIN ? process.env.ADMIN_PIN.trim() : '';
  if (!configuredPass && !configuredPin) {
    return null; // Aucun token si non configuré
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

  // Vérification de sécurité du token d'administration
  const authHeader = req.headers['authorization'] || '';
  const expectedToken = getExpectedToken();
  if (!expectedToken || !authHeader.includes(expectedToken)) {
    return res.status(401).json({
      success: false,
      error: 'Non autorisé : Session pastorale requise pour téléverser des photos.'
    });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      success: false,
      error: "Échec du téléversement : Service de stockage d'images momentanément indisponible."
    });
  }

  try {
    let { image, name } = req.body || {};

    if (!image) {
      return res.status(400).json({ success: false, error: 'Aucune image reçue' });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

    const params = new URLSearchParams();
    params.append('image', base64Data);
    if (name) params.append('name', name);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      body: params
    });

    const json = await imgbbRes.json();

    if (json.success && json.data) {
      return res.status(200).json({
        success: true,
        url: json.data.url || json.data.display_url
      });
    } else {
      const errMsg = json.error?.message || 'Erreur lors de l\'envoi vers ImgBB';
      return res.status(400).json({ success: false, error: errMsg });
    }
  } catch (err) {
    console.error('Erreur /api/upload:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
