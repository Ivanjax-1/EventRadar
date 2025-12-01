import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Heart, MessageCircle, Trash2, Send, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/config/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const EventGalleryModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [comment, setComment] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && user) {
      loadGallery();
    }
  }, [isOpen, user]);

  const loadGallery = async () => {
    try {
      setLoading(true);

      // Cargar fotos del usuario con sus likes y comentarios
      const { data: galleryPhotos, error } = await supabase
        .from('user_gallery')
        .select(`
          *,
          likes:gallery_likes(count),
          comments:gallery_comments(
            id,
            comment,
            created_at,
            user_id,
            user:auth.users!gallery_comments_user_id_fkey(email, raw_user_meta_data)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Procesar para agregar el conteo de likes
      const processedPhotos = galleryPhotos.map(photo => ({
        ...photo,
        likes_count: photo.likes[0]?.count || 0,
        comments: photo.comments || []
      }));

      setPhotos(processedPhotos);
    } catch (error) {
      console.error('Error cargando galería:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la galería',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        // Validar tipo y tamaño
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Archivo inválido',
            description: `${file.name} no es una imagen`,
            variant: 'destructive',
          });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: 'Archivo muy grande',
            description: `${file.name} supera los 10MB`,
            variant: 'destructive',
          });
          continue;
        }

        // Subir a Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('events')
          .upload(`gallery/${fileName}`, file);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(`gallery/${fileName}`);

        // Guardar en la base de datos
        const { error: dbError } = await supabase
          .from('user_gallery')
          .insert({
            user_id: user.id,
            photo_url: publicUrl,
            caption: '',
          });

        if (dbError) throw dbError;
      }

      toast({
        title: '✅ Fotos subidas',
        description: `${files.length} foto(s) agregada(s) a tu galería`,
      });

      // Recargar galería
      await loadGallery();
    } catch (error) {
      console.error('Error subiendo fotos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron subir algunas fotos',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLike = async (photoId) => {
    try {
      // Verificar si ya dio like
      const { data: existingLike } = await supabase
        .from('gallery_likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Quitar like
        await supabase
          .from('gallery_likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', user.id);
      } else {
        // Dar like
        await supabase
          .from('gallery_likes')
          .insert({
            photo_id: photoId,
            user_id: user.id,
          });
      }

      // Recargar galería
      await loadGallery();
    } catch (error) {
      console.error('Error con like:', error);
    }
  };

  const handleAddComment = async (photoId) => {
    if (!comment.trim()) return;

    try {
      await supabase
        .from('gallery_comments')
        .insert({
          photo_id: photoId,
          user_id: user.id,
          comment: comment.trim(),
        });

      setComment('');
      await loadGallery();

      toast({
        title: '💬 Comentario agregado',
      });
    } catch (error) {
      console.error('Error agregando comentario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el comentario',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePhoto = async (photoId, photoUrl) => {
    if (!confirm('¿Estás seguro de eliminar esta foto?')) return;

    try {
      // Extraer path del storage
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `gallery/${fileName}`;

      // Eliminar de storage
      await supabase.storage
        .from('events')
        .remove([filePath]);

      // Eliminar de base de datos (cascada eliminará likes y comentarios)
      await supabase
        .from('user_gallery')
        .delete()
        .eq('id', photoId);

      toast({
        title: '🗑️ Foto eliminada',
      });

      await loadGallery();
    } catch (error) {
      console.error('Error eliminando foto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la foto',
        variant: 'destructive',
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass-effect rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-6 w-6 text-purple-400" />
              <h2 className="text-2xl font-bold text-white">Mi Galería de Eventos</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Botón de subida */}
          <div className="mb-6">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-primary w-full sm:w-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Subiendo...' : 'Subir Fotos'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Galería */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/60">Cargando galería...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-2">No tienes fotos en tu galería</p>
              <p className="text-white/40 text-sm">Sube tus mejores momentos de eventos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-effect rounded-xl overflow-hidden"
                >
                  {/* Imagen */}
                  <div className="relative aspect-square">
                    <img
                      src={photo.photo_url}
                      alt="Foto de evento"
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                      onClick={() => setSelectedPhoto(photo)}
                    />
                    <button
                      onClick={() => handleDeletePhoto(photo.id, photo.photo_url)}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>

                  {/* Acciones */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => handleLike(photo.id)}
                        className="flex items-center gap-2 text-white/70 hover:text-pink-400 transition"
                      >
                        <Heart className="h-5 w-5" />
                        <span>{photo.likes_count}</span>
                      </button>
                      <div className="flex items-center gap-2 text-white/70">
                        <MessageCircle className="h-5 w-5" />
                        <span>{photo.comments.length}</span>
                      </div>
                    </div>

                    {/* Caption */}
                    {photo.caption && (
                      <p className="text-white/80 text-sm mb-3">{photo.caption}</p>
                    )}

                    {/* Comentarios */}
                    {photo.comments.length > 0 && (
                      <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                        {photo.comments.map((c) => (
                          <div key={c.id} className="text-sm">
                            <span className="text-blue-400 font-medium">
                              {c.user?.raw_user_meta_data?.username || c.user?.email?.split('@')[0] || 'Usuario'}
                            </span>
                            <span className="text-white/70 ml-2">{c.comment}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input de comentario */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={selectedPhoto?.id === photo.id ? comment : ''}
                        onChange={(e) => {
                          setSelectedPhoto(photo);
                          setComment(e.target.value);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddComment(photo.id);
                          }
                        }}
                        placeholder="Agregar comentario..."
                        className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      <button
                        onClick={() => handleAddComment(photo.id)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition"
                      >
                        <Send className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EventGalleryModal;
