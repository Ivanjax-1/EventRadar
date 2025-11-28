/**
 * PERFORMANCE MONITORING SERVICE
 * Monitorea rendimiento de la aplicación
 * - Core Web Vitals (LCP, FID, CLS)
 * - Custom metrics
 * - API response times
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.apiTimes = [];
    this.isProduction = import.meta.env.PROD;

    if (typeof window !== 'undefined') {
      this.initWebVitals();
      this.initNavigationTiming();
    }
  }

  /**
   * Inicializar Web Vitals (Core metrics de Google)
   */
  initWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeLCP();

    // First Input Delay (FID)
    this.observeFID();

    // Cumulative Layout Shift (CLS)
    this.observeCLS();

    // First Contentful Paint (FCP)
    this.observeFCP();
  }

  /**
   * Observar Largest Contentful Paint
   * Meta: < 2.5s (bueno), < 4s (mejorable), > 4s (pobre)
   */
  observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        const lcp = lastEntry.renderTime || lastEntry.loadTime;

        this.recordMetric('LCP', lcp, {
          rating: lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor',
          element: lastEntry.element?.tagName
        });
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('LCP not supported:', error);
    }
  }

  /**
   * Observar First Input Delay
   * Meta: < 100ms (bueno), < 300ms (mejorable), > 300ms (pobre)
   */
  observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;

          this.recordMetric('FID', fid, {
            rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
            eventType: entry.name
          });
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('FID not supported:', error);
    }
  }

  /**
   * Observar Cumulative Layout Shift
   * Meta: < 0.1 (bueno), < 0.25 (mejorable), > 0.25 (pobre)
   */
  observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        this.recordMetric('CLS', clsValue, {
          rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor'
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('CLS not supported:', error);
    }
  }

  /**
   * Observar First Contentful Paint
   */
  observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('FCP', entry.startTime, {
            rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor'
          });
        });
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.warn('FCP not supported:', error);
    }
  }

  /**
   * Navigation Timing API
   */
  initNavigationTiming() {
    if (!window.performance || !window.performance.timing) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        const timing = window.performance.timing;

        const metrics = {
          'DNS Lookup': timing.domainLookupEnd - timing.domainLookupStart,
          'TCP Connection': timing.connectEnd - timing.connectStart,
          'Request Time': timing.responseStart - timing.requestStart,
          'Response Time': timing.responseEnd - timing.responseStart,
          'DOM Processing': timing.domComplete - timing.domLoading,
          'Total Load Time': timing.loadEventEnd - timing.navigationStart
        };

        Object.entries(metrics).forEach(([name, value]) => {
          this.recordMetric(name, value);
        });
      }, 0);
    });
  }

  /**
   * Medir tiempo de respuesta de API
   */
  measureAPICall(endpoint, startTime) {
    const duration = performance.now() - startTime;

    this.apiTimes.push({
      endpoint,
      duration,
      timestamp: new Date().toISOString(),
      rating: duration < 500 ? 'fast' : duration < 1000 ? 'moderate' : 'slow'
    });

    // Mantener solo últimas 50 mediciones
    if (this.apiTimes.length > 50) {
      this.apiTimes.shift();
    }

    if (!this.isProduction) {
      const emoji = duration < 500 ? '🚀' : duration < 1000 ? '⚡' : '🐌';
      console.log(`${emoji} API ${endpoint}: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Iniciar medición de API call
   */
  startAPICall(endpoint) {
    return performance.now();
  }

  /**
   * Medir tiempo de renderizado de componente
   */
  measureComponent(componentName, callback) {
    const startTime = performance.now();
    const result = callback();
    const duration = performance.now() - startTime;

    if (duration > 16) { // > 16ms puede causar jank (60fps)
      console.warn(`⚠️ ${componentName} took ${duration.toFixed(2)}ms to render`);
    }

    return result;
  }

  /**
   * Registrar métrica personalizada
   */
  recordMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value: Math.round(value * 100) / 100,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    this.metrics.push(metric);

    // En producción, enviar a servicio de analytics
    if (this.isProduction) {
      this.sendToAnalytics(metric);
    } else {
      // En desarrollo, mostrar en consola
      const emoji = this.getEmojiForRating(metadata.rating);
      console.log(`${emoji} ${name}: ${value.toFixed(2)}ms`, metadata);
    }
  }

  /**
   * Enviar métricas a servicio de analytics
   */
  sendToAnalytics(metric) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating
      });
    }
  }

  /**
   * Obtener emoji según rating
   */
  getEmojiForRating(rating) {
    switch (rating) {
      case 'good':
      case 'fast':
        return '✅';
      case 'needs-improvement':
      case 'moderate':
        return '⚠️';
      case 'poor':
      case 'slow':
        return '❌';
      default:
        return '📊';
    }
  }

  /**
   * Obtener reporte de métricas
   */
  getMetrics() {
    return {
      webVitals: this.metrics,
      apiCalls: this.apiTimes,
      summary: this.getSummary()
    };
  }

  /**
   * Obtener resumen de rendimiento
   */
  getSummary() {
    const apiAvg = this.apiTimes.length > 0
      ? this.apiTimes.reduce((sum, call) => sum + call.duration, 0) / this.apiTimes.length
      : 0;

    return {
      totalMetrics: this.metrics.length,
      totalAPICalls: this.apiTimes.length,
      avgAPIResponseTime: Math.round(apiAvg * 100) / 100,
      slowestAPI: this.apiTimes.length > 0
        ? this.apiTimes.reduce((max, call) => call.duration > max.duration ? call : max)
        : null
    };
  }

  /**
   * Limpiar métricas antiguas
   */
  clear() {
    this.metrics = [];
    this.apiTimes = [];
  }
}

// Exportar instancia singleton
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// Exportar también para uso en React DevTools
if (typeof window !== 'undefined') {
  window.performanceMonitor = performanceMonitor;
}
