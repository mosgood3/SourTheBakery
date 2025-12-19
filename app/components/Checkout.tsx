'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { getPickup, isPickupOrderWindowOpen, Pickup } from '../lib/pickups-supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement } from '@stripe/react-stripe-js';
import { FaCheckCircle, FaEnvelope, FaSpinner } from 'react-icons/fa';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: () => void;
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

function CheckoutForm({ isOpen, onClose, onOrderSuccess }: CheckoutProps) {
  const { state, getTotalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [isStripeReady, setIsStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [forceShowCard, setForceShowCard] = useState(false);
  const [stripeLoadError, setStripeLoadError] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState({
    status: 'loading',
    message: 'Checking order availability...',
    color: 'text-gray-600'
  });
  const [currentStep, setCurrentStep] = useState<'form' | 'confirm'>('form');
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const stripe = useStripe();
  const elements = useElements();

  // Debug Stripe key and promise
  useEffect(() => {
    const key = STRIPE_PUBLISHABLE_KEY;
    if (process.env.NODE_ENV !== 'production') {
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
    }

    // Test the stripe promise
    stripePromise.then((stripeInstance) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('Stripe promise resolved:', !!stripeInstance);
      }
      setStripeLoadError(null);
    }).catch((error) => {
      console.error('Stripe promise failed:', error);
      setStripeLoadError(error.message);
    });
  }, []);

  // Check if Stripe is ready
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Stripe debug:', {
        stripe: !!stripe,
        elements: !!elements,
        stripeLoadError: stripeLoadError
      });
    }
    
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
          if (process.env.NODE_ENV !== 'production') {
            console.log('Forcing CardElement to show after timeout');
          }
          setForceShowCard(true);
        }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isStripeReady]);


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

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    if (!formData.customerName.trim()) {
      setError('Please enter your full name');
      return;
    }
    
    // Validate email
    if (!formData.customerEmail.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.customerEmail)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setError(null);
    setCurrentStep('confirm');
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate pickup exists and is active
    if (!state.currentPickupId) {
      setError('No pickup selected. Please add items from a pickup event.');
      return;
    }

    try {
      const orderWindowOpen = await isPickupOrderWindowOpen(state.currentPickupId);
      if (!orderWindowOpen) {
        setError('Sorry, the order window for this pickup has closed. Please check other pickup events.');
        return;
      }
    } catch (error) {
      console.error('Error checking order window:', error);
      setError('Unable to verify order availability right now. Please try again in a moment.');
      return;
    }

    if (!isStripeReady) {
      setError('Payment system is loading. Please wait a moment and try again.');
      return;
    }

    if (!stripe || !elements) {
      setError('Payment system unavailable. Please refresh the page and try again.');
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
          items: state.items,
          pickupId: state.currentPickupId,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to process payment. Please try again.');
      
      // 2. Get card element and validate it exists
      const cardElement = elements.getElement(CardNumberElement);
      if (!cardElement) {
        setError('Payment form not ready. Please refresh the page and try again.');
        return;
      }

      // 3. Confirm card payment
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: formData.customerName,
            email: formData.customerEmail,
          },
        },
      });
      
      if (result.error) {
        // Map common Stripe errors to user-friendly messages
        let errorMessage = 'Payment failed. Please try again.';
        
        if (result.error.code === 'card_declined') {
          errorMessage = 'Your card was declined. Please try a different payment method.';
        } else if (result.error.code === 'expired_card') {
          errorMessage = 'Your card has expired. Please use a different card.';
        } else if (result.error.code === 'incorrect_cvc') {
          errorMessage = 'The security code (CVC) is incorrect. Please check and try again.';
        } else if (result.error.code === 'processing_error') {
          errorMessage = 'Payment processing error. Please try again in a moment.';
        } else if (result.error.code === 'incorrect_number') {
          errorMessage = 'The card number is incorrect. Please check and try again.';
        } else if (result.error.message) {
          // Use Stripe's message if it's user-friendly
          if (result.error.message.includes('zip') || result.error.message.includes('postal')) {
            errorMessage = 'Please check your billing zip code and try again.';
          } else if (result.error.message.includes('funds')) {
            errorMessage = 'Insufficient funds. Please try a different payment method.';
          } else {
            errorMessage = result.error.message;
          }
        }
        
        setError(errorMessage);
        return;
      }
      
      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Clear cart and form
        clearCart();
        setFormData({ customerName: '', customerEmail: '' });
        
        // Trigger product refresh
        if (onOrderSuccess) {
          onOrderSuccess();
        }
        
        // Show email confirmation popup
        setShowEmailConfirmation(true);
      }
    } catch (err: any) {
      // Handle general errors
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (err.message) {
        if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch pickup information and check order window
  useEffect(() => {
    const fetchPickupAndCheckWindow = async () => {
      try {
        if (!state.currentPickupId) {
          setOrderStatus({
            status: 'error',
            message: 'No pickup selected',
            color: 'text-red-600'
          });
          return;
        }

        const pickupData = await getPickup(state.currentPickupId);
        if (!pickupData) {
          setOrderStatus({
            status: 'error',
            message: 'Pickup event not found',
            color: 'text-red-600'
          });
          return;
        }

        setPickup(pickupData);

        const isOpen = await isPickupOrderWindowOpen(state.currentPickupId);
        if (isOpen) {
          setOrderStatus({
            status: 'open',
            message: 'Orders are currently being accepted!',
            color: 'text-green-600'
          });
        } else {
          // Compare dates only (no time component) since order windows are all-day
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const orderStart = new Date(pickupData.order_window_start);
          orderStart.setHours(0, 0, 0, 0);

          const orderEnd = new Date(pickupData.order_window_end);
          orderEnd.setHours(23, 59, 59, 999);

          let message = 'Orders are currently closed. ';
          if (today < orderStart) {
            message += `Orders will open ${orderStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`;
          } else if (today > orderEnd) {
            message += 'The order window has ended.';
          }

          setOrderStatus({
            status: 'closed',
            message,
            color: 'text-red-600'
          });
        }
      } catch (error) {
        console.error('Error checking order window:', error);
        setOrderStatus({
          status: 'error',
          message: 'Unable to check order availability',
          color: 'text-red-600'
        });
      }
    };

    fetchPickupAndCheckWindow();
  }, [state.currentPickupId]);

  // Early return after all hooks have been called
  if (!isOpen) return null;

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


          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Checkout Content */}
          {!showEmailConfirmation && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Contact Information & Payment Form */}
              <div style={{ display: currentStep === 'form' ? 'block' : 'none' }}>
                <form id="checkout-form" onSubmit={handleFormSubmit}>
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
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white placeholder:font-serif"
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
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300 bg-white placeholder:font-serif"
                          placeholder="jane@example.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Payment Information */}
                    <h3 className="text-xl font-serif font-bold text-brown mb-4 mt-8">Payment Information</h3>
                    
                    {/* Security Notice */}
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <p className="text-sm text-green-700">
                          <span className="font-semibold">Secure payment:</span> Your card information is encrypted and securely processed by <a href="https://stripe.com" target="_blank" rel="noopener noreferrer" className="text-green-600 underline hover:text-green-800">Stripe</a>. We never store your payment details.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">Card Number *</label>
                        <div className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 bg-white">
                          <CardNumberElement options={stripeInputStyle} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">Expiry *</label>
                          <div className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 bg-white">
                            <CardExpiryElement options={stripeInputStyle} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">CVC *</label>
                          <div className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus-within:border-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-300 bg-white">
                            <CardCvcElement options={stripeInputStyle} />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </form>
              </div>

              {/* Step 2: Confirmation */}
              <div style={{ display: currentStep === 'confirm' ? 'block' : 'none' }}>
                <div>
                  <h3 className="text-xl font-serif font-bold text-brown mb-6">Confirm Your Order</h3>
                  
                  {/* Order Summary */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Order Summary</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
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
                      <div className="border-t border-gray-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-foreground">Total:</span>
                          <span className="text-xl font-bold text-primary">{getTotalPrice()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Information */}
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-foreground mb-4">Contact Information</h4>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                      <p><span className="font-semibold">Name:</span> {formData.customerName}</p>
                      <p><span className="font-semibold">Email:</span> {formData.customerEmail}</p>
                    </div>
                  </div>

                  {/* Pickup Information */}
                  {pickup && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-foreground mb-4">Pickup Information</h4>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                        <p><span className="font-semibold">Date:</span> {new Date(pickup.pickup_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p><span className="font-semibold">Time:</span> {pickup.pickup_time_start} - {pickup.pickup_time_end}</p>
                        <p><span className="font-semibold">Location:</span> {pickup.pickup_location}</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          )}

          {/* Footer */}
          {!showEmailConfirmation && (
            <div className="border-t border-muted p-6 space-y-4">
              <div className="flex gap-3">
                {/* Step 1: Form (Contact Info & Payment) */}
                {currentStep === 'form' && (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      Back to Cart
                    </button>
                    <button
                      type="submit"
                      form="checkout-form"
                      onClick={handleFormSubmit}
                      disabled={orderStatus.status === 'closed'}
                      className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue to Review
                    </button>
                  </>
                )}

                {/* Step 2: Confirmation */}
                {currentStep === 'confirm' && (
                  <>
                    <button
                      type="button"
                      onClick={handleBackToForm}
                      className="flex-1 px-4 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                    >
                      Back to Form
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || isRedirecting || orderStatus.status === 'closed' || !isStripeReady}
                      className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRedirecting ? 'Redirecting...' : isSubmitting ? 'Submitting...' : !isStripeReady ? 'Loading Payment...' : 'Pay with Card'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Confirmation Popup */}
      {showEmailConfirmation && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-60" />
          
          {/* Popup */}
          <div className="fixed inset-0 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <FaEnvelope className="text-4xl text-green-600 mb-4 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Order Placed Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Please check your email for your order confirmation and pickup details.
                </p>
                <button
                  onClick={() => {
                    setShowEmailConfirmation(false);
                    onClose();
                  }}
                  className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition-colors"
                >
                  Got it!
                </button>
              </div>
            </div>
          </div>
        </>
      )}
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