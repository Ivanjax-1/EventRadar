const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// POST /api/events - Crear evento
router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    const newEvent = new Event(eventData);
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(400).json({ error: 'Error inesperado al crear evento', details: error });
  }
});

// Puedes agregar más rutas aquí (GET, PUT, DELETE)

module.exports = router;
