import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole('user');
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        console.log('👤 Checking user role for:', user.email);
        
        // ✅ Consultar rol desde la tabla profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching role:', error);
          setRole('user');
        } else {
          const userRole = data?.role || 'user';
          console.log('✅ User role:', userRole);
          setRole(userRole);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole('user');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = role === 'admin';
  const isModerator = role === 'moderator';
  const isUser = role === 'user';

  console.log('🔐 User role:', { role, isAdmin, loading });

  return {
    role,
    loading,
    isAdmin,
    isModerator,
    isUser
  };
};