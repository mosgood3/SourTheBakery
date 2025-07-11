'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { isOrderWindowOpen } from '../lib/products';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

const stripePromise = (() => {
  const key = STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('Stripe publishable key is missing!');
    return Promise.reject(new Error('Stripe publishable key is missing'));
  }
  if (!key.startsWith('pk_')) {
    console.error('Invalid Stripe publishable key format!');
    return Promise.reject(new Error('Invalid Stripe publishable key format'));
  }
  return loadStripe(key);
})();

function CheckoutForm({ isOpen, onClose }: CheckoutProps) {
  const { state, getTotalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [forceShowCard, setForceShowCard] = useState(false);
  const [stripeLoadError, setStripeLoadError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  // Debug Stripe key and promise
  useEffect(() => {
    const key = STRIPE_PUBLISHABLE_KEY;
    console.log('Stripe key debug:', {
      key: key ? 'Present' : 'Missing',
      keyLength: key?.length || 0,
      keyStart: key?.substring(0, 10) + '...' || 'N/A',
      keyType: key?.startsWith('pk_test_') ? 'Test' : key?.startsWith('pk_live_') ? 'Live' : 'Invalid',
      envVars: {
        hasKey: !!STRIPE_PUBLISHABLE_KEY,
        hasSecret: !!process.env.STRIPE_SECRET_KEY,
        hasWebhook: !!process.env.STRIPE_WEBHOOK_SECRET
      }
    });

    // Test the stripe promise
    stripePromise.then((stripeInstance) => {
      console.log('Stripe promise resolved:', !!stripeInstance);
      setStripeLoadError(null);
    }).catch((error) => {
      console.error('Stripe promise failed:', error);
      setStripeLoadError(error.message);
    });
  }, []);

  // Check if Stripe is ready
  useEffect(() => {
    console.log('Stripe debug:', { 
      stripe: !!stripe, 
      elements: !!elements,
      stripeLoadError: stripeLoadError 
    });
    
    if (stripe && elements) {
      setIsStripeReady(true);
      setStripeError(null);
    } else {
      setIsStripeReady(false);
      if (stripeLoadError) {
        setStripeError(`Stripe failed to load: ${stripeLoadError}`);
      } else if (!stripe) {
        setStripeError('Stripe instance not available');
      } else if (!elements) {
        setStripeError('Stripe Elements not available');
      }
    }
  }, [stripe, elements, stripeLoadError]);

  // Force show card element after 5 seconds if not ready
  useEffect(() => {
    if (!isStripeReady) {
      const timer = setTimeout(() => {
        console.log('Forcing CardElement to show after timeout');
        setForceShowCard(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isStripeReady]);

  if (!isOpen) return null;

  // Stripe input style to match theme
  const stripeInputStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#6B4F27', // text-brown
        fontFamily: 'serif',
        '::placeholder': {
          color: '#bfae9c', // match your input placeholder
          opacity: 1,
        },
      },
      invalid: {
        color: '#e3342f',
      },
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOrderWindowOpen()) {
      setError('Orders are not available at this time. Order window is Monday 6am to Thursday 5pm.');
      return;
    }
    
    if (!isStripeReady) {
      setError('Payment system is still loading. Please wait a moment and try again.');
      return;
    }
    
    if (!stripe || !elements) {
      setError('Payment system is not ready. Please refresh the page and try again.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // 1. Create PaymentIntent on the server
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          items: state.items,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create payment intent');
      
      // 2. Confirm card payment
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardNumberElement)!,
          billing_details: {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone,
          },
        },
      });
      
      if (result.error) {
        setError(result.error.message || 'Payment failed.');
        return;
      }
      
      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // 3. Verify payment status and wait for order creation
        setSuccess(true);
        
        // Wait a moment for webhook to process, then verify order was created
        setTimeout(async () => {
          try {
            // Check if order was created via webhook
            const orderCheckResponse = await fetch('/api/orders/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentIntentId: result.paymentIntent.id,
                customerEmail: formData.customerEmail,
              }),
            });
            
            if (orderCheckResponse.ok) {
              const orderData = await orderCheckResponse.json();
              console.log('Order verified:', orderData.orderId);
            } else {
              console.warn('Order verification failed, but payment succeeded');
            }
          } catch (verifyError) {
            console.warn('Order verification error:', verifyError);
          }
        }, 2000);
        
        clearCart();
        setFormData({ customerName: '', customerEmail: '', customerPhone: '' });
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 5000); // Give more time for webhook processing
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOrderWindowStatus = () => {
    const isOpen = isOrderWindowOpen();
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (isOpen) {
      return {
        status: 'open',
        message: 'Orders are currently being accepted!',
        color: 'text-green-600'
      };
    } else {
      let message = 'Orders are currently closed. ';
      if (currentDay === 4 && currentHour >= 17) { // Thursday after 5pm
        message += 'Orders will reopen Monday at 6am.';
      } else if (currentDay >= 5) { // Friday or Saturday
        message += 'Orders will reopen Monday at 6am.';
      } else if (currentDay === 0) { // Sunday
        message += 'Orders will reopen Monday at 6am.';
      } else if (currentDay === 1 && currentHour < 6) { // Monday before 6am
        message += 'Orders will open at 6am today.';
      }
      
      return {
        status: 'closed',
        message,
        color: 'text-red-600'
      };
    }
  };

  const orderStatus = getOrderWindowStatus();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Checkout Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-muted">
            <h2 className="text-2xl font-serif font-bold text-foreground">Checkout</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Order Status */}
          <div className="p-4 border-b border-muted">
            <div className={`text-center p-3 rounded-lg ${orderStatus.status === 'open' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-semibold ${orderStatus.color}`}>
                {orderStatus.message}
              </p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Successful!</h3>
                <p className="text-green-700 mb-2">Your payment has been processed successfully.</p>
                <p className="text-green-700 text-sm">We're creating your order and will contact you soon with pickup details.</p>
                <div className="mt-3 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                  <span className="text-green-700 text-sm">Processing order...</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Checkout Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {/* Order Summary */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Order Summary</h3>
                <div className="space-y-3">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        ${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <div className="border-t border-muted pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-foreground">Total:</span>
                      <span className="text-xl font-bold text-primary">{getTotalPrice()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Contact Information</h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50 placeholder:font-serif"
                      placeholder="Jane Doe"
                      required
                    />
                  </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Email Address *</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50 placeholder:font-serif"
                    placeholder="jane@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white/50 placeholder:font-serif"
                    placeholder="123-456-7890"
                    required
                  />
                </div>
              </div>
                <h3 className="text-xl font-serif font-bold text-brown mb-4 mt-8">Payment Information</h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Card Number *</label>
                    <div className="w-full px-4 py-3 rounded-xl border border-muted focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 bg-white/50">
                      <CardNumberElement options={stripeInputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Expiry *</label>
                    <div className="w-full px-4 py-3 rounded-xl border border-muted focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 bg-white/50">
                      <CardExpiryElement options={stripeInputStyle} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">CVC *</label>
                    <div className="w-full px-4 py-3 rounded-xl border border-muted focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 bg-white/50">
                      <CardCvcElement options={stripeInputStyle} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Orders are only accepted Monday 6am to Thursday 5pm</li>
                  <li>• Pickup is available Sunday 9am-1pm</li>
                  <li>• We'll contact you to confirm your order</li>
                </ul>
              </div>
            </form>
          )}

          {/* Footer */}
          {!success && (
            <div className="border-t border-muted p-6 space-y-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting || isRedirecting}
                  className="flex-1 px-4 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isRedirecting || orderStatus.status === 'closed' || !isStripeReady}
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRedirecting ? 'Redirecting...' : isSubmitting ? 'Submitting...' : !isStripeReady ? 'Loading Payment...' : 'Pay with Card'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Checkout(props: CheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
} 