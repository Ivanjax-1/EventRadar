// Modelo básico de evento para Mongoose
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: Date,
  location: String,
  status: { type: String, default: 'active' },
  event_status: { type: String, default: 'upcoming' },
  // Agrega más campos según tu necesidad
});

module.exports = mongoose.model('Event', EventSchema);
