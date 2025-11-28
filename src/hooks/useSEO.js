import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO HOOK
 * Actualiza meta tags dinámicamente según la ruta
 */
export const useSEO = ({
  title,
  description,
  keywords,
  image,
  type = 'website',
  author = 'EventRadar Team'
}) => {
  const location = useLocation();
  const baseURL = 'https://eventradar.com'; // Cambiar en producción

  useEffect(() => {
    // Título
    if (title) {
      document.title = `${title} | EventRadar`;
    }

    // Meta description
    updateMetaTag('name', 'description', description || 'Descubre eventos increíbles cerca de ti con EventRadar. Tu radar de eventos con IA.');

    // Keywords
    updateMetaTag('name', 'keywords', keywords || 'eventos, conciertos, festivales, Chile, EventRadar, eventos cerca de mi');

    // Author
    updateMetaTag('name', 'author', author);

    // Open Graph (Facebook, LinkedIn)
    updateMetaTag('property', 'og:title', title || 'EventRadar - Tu Radar de Eventos');
    updateMetaTag('property', 'og:description', description || 'Descubre eventos increíbles cerca de ti');
    updateMetaTag('property', 'og:type', type);
    updateMetaTag('property', 'og:url', `${baseURL}${location.pathname}`);
    updateMetaTag('property', 'og:image', image || `${baseURL}/og-image.png`);
    updateMetaTag('property', 'og:site_name', 'EventRadar');

    // Twitter Card
    updateMetaTag('name', 'twitter:card', 'summary_large_image');
    updateMetaTag('name', 'twitter:title', title || 'EventRadar');
    updateMetaTag('name', 'twitter:description', description || 'Descubre eventos increíbles cerca de ti');
    updateMetaTag('name', 'twitter:image', image || `${baseURL}/og-image.png`);

    // Canonical URL
    updateLinkTag('canonical', `${baseURL}${location.pathname}`);

    // Schema.org JSON-LD
    if (type === 'event') {
      addStructuredData({
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: title,
        description: description,
        image: image,
        url: `${baseURL}${location.pathname}`
      });
    }
  }, [title, description, keywords, image, type, author, location.pathname]);
};

/**
 * Actualizar o crear meta tag
 */
const updateMetaTag = (attribute, key, content) => {
  if (!content) return;

  let element = document.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

/**
 * Actualizar o crear link tag
 */
const updateLinkTag = (rel, href) => {
  if (!href) return;

  let element = document.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

/**
 * Agregar datos estructurados (JSON-LD)
 */
const addStructuredData = (data) => {
  // Remover script anterior si existe
  const oldScript = document.getElementById('structured-data');
  if (oldScript) {
    oldScript.remove();
  }

  // Crear nuevo script
  const script = document.createElement('script');
  script.id = 'structured-data';
  script.type = 'application/ld+json';
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
};

/**
 * Configuraciones SEO predefinidas por página
 */
export const SEO_CONFIG = {
  home: {
    title: 'Inicio',
    description: 'Descubre eventos increíbles cerca de ti. EventRadar usa IA para recomendarte los mejores conciertos, festivales y experiencias en Chile.',
    keywords: 'eventos Chile, conciertos, festivales, eventos cerca de mi, recomendaciones eventos, IA eventos'
  },

  dashboard: {
    title: 'Mapa de Eventos',
    description: 'Explora eventos en el mapa interactivo. Encuentra conciertos, festivales y experiencias cerca de tu ubicación.',
    keywords: 'mapa eventos, eventos interactivos, eventos cerca, geolocalización eventos'
  },

  profile: {
    title: 'Mi Perfil',
    description: 'Gestiona tu perfil, favoritos y preferencias de eventos en EventRadar.',
    keywords: 'perfil usuario, favoritos eventos, preferencias eventos'
  },

  login: {
    title: 'Iniciar Sesión',
    description: 'Inicia sesión en EventRadar para descubrir eventos personalizados con IA.',
    keywords: 'login EventRadar, iniciar sesión eventos'
  },

  register: {
    title: 'Crear Cuenta',
    description: 'Únete a EventRadar y comienza a descubrir eventos increíbles cerca de ti.',
    keywords: 'registro EventRadar, crear cuenta eventos'
  }
};
