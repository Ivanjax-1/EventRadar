import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el dispositivo es móvil
 * @returns {boolean} true si es móvil, false si es desktop
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    // Verificar si window está disponible (para SSR)
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check inicial
    checkIsMobile();

    // Listener para cambios de tamaño
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}
