/**
 * SISTEMA DE LOGGING PROFESIONAL
 * Solo muestra logs en desarrollo, silencioso en producción
 */

const isDevelopment = import.meta.env.MODE === 'development';

const logger = {
  /**
   * Log informativo (azul)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log('%c[INFO]', 'color: #3b82f6; font-weight: bold', ...args);
    }
  },

  /**
   * Log de éxito (verde)
   */
  success: (...args) => {
    if (isDevelopment) {
      console.log('%c[SUCCESS]', 'color: #10b981; font-weight: bold', ...args);
    }
  },

  /**
   * Log de advertencia (amarillo)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('%c[WARN]', 'color: #f59e0b; font-weight: bold', ...args);
    }
  },

  /**
   * Log de error (rojo) - Siempre se muestra
   */
  error: (...args) => {
    console.error('%c[ERROR]', 'color: #ef4444; font-weight: bold', ...args);
  },

  /**
   * Log de debug (gris) - Solo en desarrollo
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('%c[DEBUG]', 'color: #6b7280; font-weight: bold', ...args);
    }
  },

  /**
   * Grupo de logs colapsable
   */
  group: (label, fn) => {
    if (isDevelopment) {
      console.group(`%c${label}`, 'color: #8b5cf6; font-weight: bold');
      fn();
      console.groupEnd();
    }
  },

  /**
   * Tabla de datos
   */
  table: (data) => {
    if (isDevelopment) {
      console.table(data);
    }
  }
};

export default logger;
