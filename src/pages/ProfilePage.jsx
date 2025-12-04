import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { User, Mail, Calendar, Settings, Edit, LogOut, Camera, Music, Heart, Image as ImageIcon, Phone, MapPin, UserPlus, Cake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/config/supabase';
import { useNavigate } from 'react-router-dom';
import EventGalleryModal from '@/components/EventGalleryModal';


const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.user_metadata?.username || '',
    full_name: user?.user_metadata?.full_name || '',
    bio: user?.user_metadata?.bio || '',
    birth_date: user?.user_metadata?.birth_date || '',
    phone: user?.user_metadata?.phone || '',
    address: user?.user_metadata?.address || '',
    avatar_url: user?.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1652841190565-b96e0acbae17',
    favorite_music: user?.user_metadata?.favorite_music || [],
    favorite_events: user?.user_metadata?.favorite_events || [],
    interests: user?.user_metadata?.interests || '',
  });

  const musicGenres = ['Rock', 'Pop', 'Electrónica', 'Hip Hop', 'Jazz', 'Reggaeton', 'Metal', 'Clásica', 'Indie', 'Folk'];
  const eventTypes = ['Conciertos', 'Festivales', 'Anime/Manga', 'Gastronomía', 'Deportes', 'Teatro', 'Cine', 'Arte', 'Tecnología', 'Educación'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleMusicPreference = (genre) => {
    setFormData(prev => ({
      ...prev,
      favorite_music: prev.favorite_music.includes(genre)
        ? prev.favorite_music.filter(g => g !== genre)
        : [...prev.favorite_music, genre]
    }));
  };

  const toggleEventPreference = (type) => {
    setFormData(prev => ({
      ...prev,
      favorite_events: prev.favorite_events.includes(type)
        ? prev.favorite_events.filter(t => t !== type)
        : [...prev.favorite_events, type]
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una imagen válida',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'La imagen no debe superar 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingPhoto(true);

      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Actualizar metadata del usuario
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

      toast({
        title: 'Foto actualizada',
        description: 'Tu foto de perfil se ha actualizado correctamente',
      });
    } catch (error) {
      console.error('Error subiendo foto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la foto. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);

      // Actualizar metadata del usuario con todos los campos
      const { error } = await supabase.auth.updateUser({
        data: {
          username: formData.username,
          full_name: formData.full_name,
          bio: formData.bio,
          birth_date: formData.birth_date,
          phone: formData.phone,
          address: formData.address,
          avatar_url: formData.avatar_url,
          favorite_music: formData.favorite_music,
          favorite_events: formData.favorite_events,
          interests: formData.interests,
        }
      });

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: '✅ Perfil actualizado',
        description: 'Todos tus cambios han sido guardados exitosamente.',
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cerrar la sesión.',
        variant: 'destructive',
      });
    }
  };

  const handleAddFriends = () => {
    toast({
      title: '👥 Agregar Amigos',
      description: 'Función en desarrollo. Pronto podrás conectar con otros usuarios.',
    });
  };

  const handleViewGallery = () => {
    console.log('🖼️ Abriendo galería...');
    setShowGallery(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Acceso Requerido</h2>
          <p className="text-white/70 mb-8">Debes iniciar sesión para ver tu perfil.</p>
          <Button asChild className="btn-primary">
            <a href="/login">Iniciar Sesión</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mi Perfil - EventRadar</title>
        <meta name="description" content="Gestiona tu perfil y configuración en EventRadar." />
      </Helmet>

      <div className="min-h-full py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
              Mi Perfil
            </h1>
            <p className="text-xl text-white/80">
              Gestiona tu información y preferencias
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 glass-effect rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Información Personal</h2>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(!isEditing)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>

              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  <img 
                    className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                    alt={`Avatar de ${formData.full_name}`}
                    src={formData.avatar_url}
                  />
                  <button 
                    type="button"
                    className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 p-2 rounded-full shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                  {/* Input oculto para seleccionar archivo */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {formData.full_name || 'Usuario'}
                  </h3>
                  <p className="text-white/60">{user.email}</p>
                  <p className="text-white/60 text-sm">
                    Miembro desde {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Tu nombre de usuario único"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-semibold mb-2">
                      Biografía
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Cuéntanos sobre ti..."
                    />
                  </div>

                  {/* Sección de Datos Personales */}
                  <div className="border-t border-white/20 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      Mis Datos Personales
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Correo Electrónico
                        </label>
                        <input
                          type="email"
                          value={user?.email}
                          disabled
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Cake className="h-4 w-4" />
                          Fecha de Nacimiento
                        </label>
                        <input
                          type="date"
                          name="birth_date"
                          value={formData.birth_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>

                      <div>
                        <label className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Número de Teléfono
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="+56 9 1234 5678"
                        />
                      </div>

                      <div>
                        <label className="text-white font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Dirección
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Ciudad, Región"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preferencias para IA */}
                  <div className="border-t border-white/20 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-400" />
                      Preferencias 
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Música Favorita
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {musicGenres.map((genre) => (
                            <button
                              key={genre}
                              type="button"
                              onClick={() => toggleMusicPreference(genre)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                formData.favorite_music.includes(genre)
                                  ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                                  : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                              }`}
                            >
                              {genre}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-semibold mb-3">
                          Tipos de Eventos Favoritos
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {eventTypes.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => toggleEventPreference(type)}
                              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                formData.favorite_events.includes(type)
                                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                                  : 'bg-white/10 text-white/70 hover:bg-white/20 border border-white/20'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-white font-semibold mb-2">
                          Otros Intereses
                        </label>
                        <textarea
                          name="interests"
                          value={formData.interests}
                          onChange={handleInputChange}
                          rows={2}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          placeholder="Deportes, tecnología, arte, etc."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button 
                      onClick={handleSaveProfile} 
                      className="btn-primary"
                      disabled={saving}
                    >
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="border-white/20 text-white hover:bg-white/10"
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {formData.username && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-purple-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-white/60 text-sm mb-1">Usuario</p>
                        <p className="text-white text-lg font-medium">@{formData.username}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-blue-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-white/60 text-sm mb-1">Nombre</p>
                      <p className="text-white text-lg">{formData.full_name || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-blue-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-white/60 text-sm mb-1">Email</p>
                      <p className="text-white">{user.email}</p>
                    </div>
                  </div>

                  {formData.bio && (
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-blue-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-white/60 text-sm mb-1">Biografía</p>
                        <p className="text-white">{formData.bio}</p>
                      </div>
                    </div>
                  )}

                  {/* Datos Personales */}
                  <div className="border-t border-white/20 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-400" />
                      Datos Personales
                    </h3>
                    
                    <div className="space-y-4">
                      {formData.birth_date && (
                        <div className="flex items-start space-x-3">
                          <Cake className="h-5 w-5 text-pink-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-white/60 text-sm mb-1">Fecha de Nacimiento</p>
                            <p className="text-white">{new Date(formData.birth_date).toLocaleDateString('es-CL')}</p>
                          </div>
                        </div>
                      )}

                      {formData.phone && (
                        <div className="flex items-start space-x-3">
                          <Phone className="h-5 w-5 text-green-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-white/60 text-sm mb-1">Teléfono</p>
                            <p className="text-white">{formData.phone}</p>
                          </div>
                        </div>
                      )}

                      {formData.address && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-red-400 mt-1" />
                          <div className="flex-1">
                            <p className="text-white/60 text-sm mb-1">Dirección</p>
                            <p className="text-white">{formData.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mostrar preferencias */}
                  {(formData.favorite_music.length > 0 || formData.favorite_events.length > 0 || formData.interests) && (
                    <div className="border-t border-white/20 pt-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-pink-400" />
                        Mis Preferencias
                      </h3>

                      <div className="space-y-4">
                        {formData.favorite_music.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Music className="h-5 w-5 text-purple-400" />
                              <p className="text-white/60 text-sm">Música Favorita</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.favorite_music.map((genre) => (
                                <span
                                  key={genre}
                                  className="px-3 py-1 bg-pink-500/20 border border-pink-500/50 rounded-full text-pink-300 text-sm"
                                >
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.favorite_events.length > 0 && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-5 w-5 text-green-400" />
                              <p className="text-white/60 text-sm">Eventos Favoritos</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {formData.favorite_events.map((type) => (
                                <span
                                  key={type}
                                  className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-300 text-sm"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {formData.interests && (
                          <div className="flex items-start space-x-3">
                            <Heart className="h-5 w-5 text-pink-400 mt-1" />
                            <div>
                              <p className="text-white/60 text-sm mb-1">Otros Intereses</p>
                              <p className="text-white">{formData.interests}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleAddFriends}
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Agregar Amigos
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleViewGallery}
                    className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Mi Galería de Eventos
                  </Button>
                </div>
              </div>

              <div className="glass-effect rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Eventos creados</span>
                    <span className="text-white font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Eventos asistidos</span>
                    <span className="text-white font-semibold">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Fotos compartidas</span>
                    <span className="text-white font-semibold">0</span>
                  </div>
                </div>
              </div>

              {/* Botón de Cerrar Sesión */}
              <div className="glass-effect rounded-2xl p-6 border-2 border-red-500/30">
                <Button
                  onClick={handleSignOut}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Modal de Galería */}
      <EventGalleryModal 
        isOpen={showGallery} 
        onClose={() => setShowGallery(false)} 
      />
    </>
  );
};

export default ProfilePage;
