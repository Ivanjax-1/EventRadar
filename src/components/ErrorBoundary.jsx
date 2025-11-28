import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

/**
 * ERROR BOUNDARY
 * Captura errores de React y muestra UI de fallback
 * Previene que toda la app crashee por un error
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Actualizar estado para mostrar UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logging del error
    console.error('💥 Error capturado por ErrorBoundary:', error);
    console.error('📍 Stack trace:', errorInfo);

    // Guardar error en estado
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // En producción, enviar a servicio de monitoreo (ej: Sentry)
    if (import.meta.env.PROD) {
      // Aquí integrarías con Sentry, LogRocket, etc.
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    console.log('📤 Error enviado a servicio de monitoreo');
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada
      const isDevelopment = import.meta.env.MODE === 'development';

      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            {/* Icono de error */}
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 rounded-full p-6">
                <AlertTriangle className="w-16 h-16 text-red-600" />
              </div>
            </div>

            {/* Título */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              ¡Ups! Algo salió mal
            </h1>

            {/* Descripción */}
            <p className="text-gray-600 text-center mb-8">
              {this.state.errorCount > 2
                ? '⚠️ Parece que hay un problema persistente. Intenta recargar la página completa.'
                : 'Ocurrió un error inesperado. No te preocupes, puedes intentar continuar.'}
            </p>

            {/* Detalles del error (solo en desarrollo) */}
            {isDevelopment && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg overflow-auto max-h-60">
                <p className="font-mono text-sm text-red-800 mb-2">
                  <strong>Error:</strong> {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-600 font-semibold mb-2">
                      Ver Stack Trace
                    </summary>
                    <pre className="text-xs text-red-700 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Intentar de Nuevo
              </Button>

              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar Página
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex-1"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir al Inicio
              </Button>
            </div>

            {/* Info adicional */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Si el problema persiste, contacta a soporte:
                <br />
                <a
                  href="mailto:soporte@eventradar.com"
                  className="text-purple-600 hover:underline"
                >
                  soporte@eventradar.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Si no hay error, renderizar hijos normalmente
    return this.props.children;
  }
}

export default ErrorBoundary;
