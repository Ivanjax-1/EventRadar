import { supabase } from '../lib/supabase';

// ✅ 1. EXPORTACIONES NOMBRADAS (Esto es lo que busca tu formulario)

export const getEvents = async (filters = {}) => {
  try {
    let query = supabase
      .from('events')
      .select(`*, event_categories(id, name, icon, color)`)
      .order('created_at', { ascending: false });
    
    if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    if (filters.category_id) query = query.eq('category_id', filters.category_id);
    if (filters.location) query = query.ilike('location', `%${filters.location}%`);
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const getEventById = async (id) => {
  try {
    const { data, error } = await supabase.from('events').select(`*, event_categories(id, name, icon, color)`).eq('id', id).single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

// 👇 ESTA ES LA CLAVE: 'export const' hace que la función sea visible para el import { createEvent }
export const createEvent = async (eventData) => {
  try {
    console.log('📡 Service: Creando evento...', eventData);
    
    const payload = {
        ...eventData,
        latitude: parseFloat(eventData.latitude) || 0,
        longitude: parseFloat(eventData.longitude) || 0,
        price: parseFloat(eventData.price) || 0,
        status: 'active',
        created_at: new Date().toISOString()
    };

    if (!payload.id) delete payload.id;

    const { data, error } = await supabase.from('events').insert([payload]).select().single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error };
  }
};

export const updateEvent = async (id, updates) => {
  try {
    const { data, error } = await supabase.from('events').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error };
  }
};

export const deleteEvent = async (id) => {
  try {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const { data, error } = await supabase.from('event_categories').select('*').order('name');
    if (error) return [];
    return data;
  } catch (error) {
    return [];
  }
};

// ✅ 2. EXPORTACIÓN POR DEFECTO (Como respaldo)
const eventService = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getCategories
};

export default eventService;