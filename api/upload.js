// Vercel Serverless Function: POST /api/upload
// Téléversement sécurisé vers ImgBB sans exposer la clé API au client

module.exports = async (req, res) => {
  // En-têtes CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'La variable IMGBB_API_KEY n\'est pas configurée dans le fichier .env ou dans les paramètres Vercel.'
    });
  }

  try {
    let { image, name } = req.body || {};

    if (!image) {
      return res.status(400).json({ success: false, error: 'Aucune image reçue' });
    }

    // Nettoyer le préfixe data:image/...;base64, si présent
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
