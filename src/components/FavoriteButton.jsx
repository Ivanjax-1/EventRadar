import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

const FavoriteButton = ({ eventId, initialFavorite = false, onFavoriteChange }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true); // Empezar en loading mientras verifica
  const [checked, setChecked] = useState(false); // Para saber si ya verificamos

  // Verificar si es favorito al cargar
  useEffect(() => {
    if (user && eventId && !checked) {
      checkIfFavorite();
    }
  }, [eventId, user]);

  const checkIfFavorite = async () => {
    if (!user || !eventId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (!error && data) {
        console.log('✅ Evento', eventId, 'está en favoritos');
        setIsFavorite(true);
      } else {
        console.log('ℹ️ Evento', eventId, 'NO está en favoritos');
        setIsFavorite(false);
      }
      setChecked(true);
    } catch (error) {
      console.error('❌ Error checking favorite:', error);
      setIsFavorite(false);
      setChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (loading || !eventId || !user) return;
    
    setLoading(true);
    
    try {
      // Primero verificar el estado actual en la base de datos
      const { data: existingFavorite, error: checkError } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error verificando favorito:', checkError);
        throw checkError;
      }

      const shouldRemove = !!existingFavorite;
      
      console.log('🔄 Toggling favorite:', eventId, '→', shouldRemove ? 'REMOVE' : 'ADD', 'existing:', existingFavorite);
      
      if (shouldRemove) {
        // Quitar de favoritos
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('event_id', eventId);
        
        if (error) {
          console.error('❌ Error removing favorite:', error);
          throw error;
        }
        
        console.log('✅ Removido de favoritos');
        setIsFavorite(false);
        setChecked(true);
        queryClient.invalidateQueries(['favorites', user.id]);
        
        if (onFavoriteChange) {
          onFavoriteChange(eventId, false);
        }
      } else {
        // Agregar a favoritos - Verificar primero si existe para evitar duplicados
        if (existingFavorite) {
          console.log('ℹ️ Favorito ya existe, no se vuelve a agregar');
          setIsFavorite(true);
          setChecked(true);
          return;
        }

        const { error } = await supabase
          .from('favorites')
          .insert({ 
            user_id: user.id, 
            event_id: eventId 
          });
        
        if (error) {
          console.error('❌ Error adding favorite:', error);
          throw error;
        }
        
        console.log('✅ Agregado a favoritos');
        setIsFavorite(true);
        setChecked(true);
        queryClient.invalidateQueries(['favorites', user.id]);
        
        if (onFavoriteChange) {
          onFavoriteChange(eventId, true);
        }
      }
      
    } catch (error) {
      console.error('❌ Error toggling favorite:', error);
      // Recargar el estado correcto desde la base de datos
      await checkIfFavorite();
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-300 transform hover:scale-110 ${
        isFavorite 
          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-400'
      } ${loading ? 'opacity-50 cursor-not-allowed animate-pulse' : 'shadow-sm hover:shadow-md'}`}
      title={isFavorite ? 'Quitar de favoritos ❤️' : 'Agregar a favoritos 🤍'}
    >
      <Heart 
        className={`w-5 h-5 transition-all duration-300 ${
          isFavorite ? 'fill-current text-red-600' : 'text-gray-400'
        }`} 
      />
    </button>
  );
};

export default FavoriteButton;