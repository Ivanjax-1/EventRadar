const express = require('express');
const router = express.Router();
const Favorite = require('../models/Favorite');
const Event = require('../models/Event');
// Eliminado: middleware de autenticación y uso de req.user

// 💖 Toggle favorito (agregar/quitar)
// Deshabilitado: funcionalidad de favoritos requiere autenticación
router.post('/toggle/:eventId', (req, res) => {
  res.status(501).json({ error: 'Funcionalidad de favoritos deshabilitada temporalmente.' });
});

// 📋 Obtener todos los favoritos del usuario
// Deshabilitado: funcionalidad de favoritos requiere autenticación
router.get('/my-favorites', (req, res) => {
  res.status(501).json({ error: 'Funcionalidad de favoritos deshabilitada temporalmente.' });
    
    const favorites = await Favorite.find({ userId })
      .populate({
        path: 'eventId',
        model: 'Event',
        populate: {
          path: 'createdBy',
          model: 'User',
          select: 'username email'
        }
      })
      .sort({ createdAt: -1 });

    const favoriteEvents = favorites
      .filter(fav => fav.eventId)
      .map(fav => ({
        ...fav.eventId.toObject(),
        isFavorite: true,
        favoriteDate: fav.createdAt
      }));

    res.json(favoriteEvents);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔍 Verificar si un evento es favorito
router.get('/check/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const favorite = await Favorite.findOne({ userId, eventId });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;