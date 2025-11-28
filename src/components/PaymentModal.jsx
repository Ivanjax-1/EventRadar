import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CreditCard, Building2, Check, Loader2, 
  Shield, Lock, AlertCircle, DollarSign 
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Inicializar Stripe (reemplaza con tu publishable key)
const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#fff',
      fontFamily: '"Inter", sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: 'rgba(255, 255, 255, 0.4)'
      }
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444'
    }
  },
  hidePostalCode: false
};

// Componente interno con acceso a Stripe hooks
const StripePaymentForm = ({ amount, tier, packageType, onSuccess, onError, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      // 1. Crear PaymentIntent en el backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
          metadata: {
            tier: tier,
            packageType: packageType,
            source: 'eventradar-pricing'
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear el pago');
      }

      const { clientSecret } = await response.json();

      // 2. Confirmar el pago con Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          }
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        console.log('✅ Pago exitoso:', paymentIntent.id);
        onSuccess({
          paymentIntentId: paymentIntent.id,
          tier,
          packageType,
          amount
        });
      }

    } catch (error) {
      console.error('❌ Error en el pago:', error);
      setErrorMessage(error.message);
      onError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white/5 rounded-lg p-4 border border-white/10">
        <label className="block text-sm font-medium text-white mb-2">
          <CreditCard className="inline h-4 w-4 mr-2" />
          Información de la tarjeta
        </label>
        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-200">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg text-white font-medium transition-all"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 rounded-lg text-white font-medium transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Lock className="h-5 w-5" />
              Pagar ${amount}
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-center gap-4 text-xs text-white/40">
        <Shield className="h-4 w-4" />
        <span>Pago seguro con encriptación SSL</span>
      </div>
    </form>
  );
};

// Componente principal del modal
const PaymentModal = ({ 
  isOpen, 
  onClose, 
  tier = 'basic',
  packageType = 'single', 
  amount = 0,
  tierName = '',
  onPaymentSuccess 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' | 'mercadopago'
  const [isProcessingMP, setIsProcessingMP] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const packageNames = {
    single: '1 Evento',
    pack_3: 'Pack de 3 Eventos',
    pack_5: 'Pack de 5 Eventos'
  };

  const handleMercadoPago = async () => {
    setIsProcessingMP(true);

    try {
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              title: `${tierName} - ${packageNames[packageType]}`,
              price: amount,
              quantity: 1,
              currency: 'CLP'
            }
          ],
          metadata: {
            tier: tier,
            packageType: packageType,
            source: 'eventradar-pricing'
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear preferencia de pago');
      }

      const { initPoint, sandboxInitPoint } = await response.json();

      // Redirigir a Mercado Pago
      const isDev = window.location.hostname === 'localhost';
      window.location.href = isDev ? sandboxInitPoint : initPoint;

    } catch (error) {
      console.error('❌ Error con Mercado Pago:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessingMP(false);
    }
  };

  const handlePaymentSuccess = (data) => {
    setPaymentData(data);
    setShowSuccess(true);
    
    setTimeout(() => {
      onPaymentSuccess?.(data);
      handleClose();
    }, 3000);
  };

  const handlePaymentError = (message) => {
    // El error ya se muestra en el formulario
    console.error('Payment error:', message);
  };

  const handleClose = () => {
    setShowSuccess(false);
    setPaymentData(null);
    setPaymentMethod('stripe');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10"
        >
          {showSuccess ? (
            // Pantalla de éxito
            <div className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full flex items-center justify-center mb-6"
              >
                <Check className="h-10 w-10 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">¡Pago Exitoso!</h2>
              <p className="text-white/80 mb-4">
                Tu suscripción <strong>{tierName}</strong> ha sido activada
              </p>
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <p className="text-sm text-white/60">ID de transacción:</p>
                <p className="text-white font-mono text-xs">{paymentData?.paymentIntentId}</p>
              </div>
              <p className="text-sm text-white/60">Redirigiendo...</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Completar Pago</h2>
                    <p className="text-sm text-white/60 mt-1">Selecciona tu método de pago preferido</p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Resumen del pedido */}
              <div className="p-6 bg-white/5 border-b border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-3">Resumen del pedido</h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white">Plan {tierName}</span>
                  <span className="text-white font-bold">${amount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">{packageNames[packageType]}</span>
                  {packageType !== 'single' && (
                    <span className="text-green-400">
                      {packageType === 'pack_3' ? '-20%' : '-28%'}
                    </span>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-lg font-bold text-white">Total</span>
                  <span className="text-2xl font-bold text-white">${amount} USD</span>
                </div>
              </div>

              {/* Selector de método de pago */}
              <div className="p-6">
                <h3 className="text-sm font-medium text-white mb-4">Método de pago</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-purple-400 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <CreditCard className="h-6 w-6 text-white mb-2" />
                    <div className="text-sm font-medium text-white">Tarjeta</div>
                    <div className="text-xs text-white/60">Crédito/Débito</div>
                  </button>

                  <button
                    onClick={() => setPaymentMethod('mercadopago')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === 'mercadopago'
                        ? 'border-blue-400 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <Building2 className="h-6 w-6 text-white mb-2" />
                    <div className="text-sm font-medium text-white">Mercado Pago</div>
                    <div className="text-xs text-white/60">Todos los métodos</div>
                  </button>
                </div>

                {/* Formulario según el método */}
                {paymentMethod === 'stripe' ? (
                  stripePromise ? (
                    <Elements stripe={stripePromise}>
                      <StripePaymentForm
                        amount={amount}
                        tier={tier}
                        packageType={packageType}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        onCancel={handleClose}
                      />
                    </Elements>
                  ) : (
                    <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
                      <AlertCircle className="h-5 w-5 text-yellow-400 inline mr-2" />
                      <span className="text-sm text-yellow-200">
                        Stripe no está configurado. Configura VITE_STRIPE_PUBLISHABLE_KEY.
                      </span>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm text-white/80 mb-2">
                        Serás redirigido a Mercado Pago para completar tu pago de forma segura.
                      </p>
                      <ul className="text-xs text-white/60 space-y-1 ml-4 list-disc">
                        <li>Paga con tarjetas, efectivo, o saldo en cuenta</li>
                        <li>Protección al comprador</li>
                        <li>Devolución automática si hay problemas</li>
                      </ul>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleClose}
                        disabled={isProcessingMP}
                        className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 rounded-lg text-white font-medium transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleMercadoPago}
                        disabled={isProcessingMP}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 rounded-lg text-white font-medium transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessingMP ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Redirigiendo...
                          </>
                        ) : (
                          <>
                            <DollarSign className="h-5 w-5" />
                            Pagar con Mercado Pago
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer de seguridad */}
              <div className="p-6 bg-white/5 border-t border-white/10">
                <div className="flex items-center justify-center gap-6 text-xs text-white/40">
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <span>Pago seguro</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Lock className="h-4 w-4" />
                    <span>Encriptación SSL</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentModal;
