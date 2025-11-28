const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// GET /api/geocode?address=...&country=cl
router.get('/', async (req, res) => {
  const { address, country = 'cl' } = req.query;
  if (!address) {
    return res.status(400).json({ error: 'Missing address parameter' });
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=${country}&limit=5&addressdetails=1&viewbox=-75,-17,-66,-56&bounded=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'EventRadar/1.0 (contacto@eventradar.com)' }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Geocoding failed', status: response.status });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
