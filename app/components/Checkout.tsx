'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { getPickup, isPickupOrderWindowOpen, Pickup } from '../lib/pickups-supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaEnvelope } from 'react-icons/fa';
import { getTodayEST, formatDateEST, formatTimeEST, isBeforeDateEST, isAfterDateEST } from '../lib/timezone';

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

// Payment form component - rendered only after we have clientSecret
function PaymentForm({
  clientSecret,
  formData,
  pickup,
  onSuccess,
  onBack,
  onError,
  items,
  getTotalPrice
}: {
  clientSecret: string;
  formData: { customerName: string; customerEmail: string };
  pickup: Pickup | null;
  onSuccess: () => void;
  onBack: () => void;
  onError: (error: string) => void;
  items: any[];
  getTotalPrice: () => string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Payment system unavailable. Please refresh the page and try again.');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // Required but won't be used for card payments
          payment_method_data: {
            billing_details: {
              name: formData.customerName,
              email: formData.customerEmail,
            },
          },
        },
        redirect: 'if_required', // Only redirect if necessary (e.g., 3D Secure)
      });

      if (result.error) {
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
          if (result.error.message.includes('zip') || result.error.message.includes('postal')) {
            errorMessage = 'Please check your billing zip code and try again.';
          } else if (result.error.message.includes('funds')) {
            errorMessage = 'Insufficient funds. Please try a different payment method.';
          } else {
            errorMessage = result.error.message;
          }
        }

        onError(errorMessage);
        return;
      }

      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err: any) {
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

      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        <h3 className="text-xl font-serif font-bold text-brown mb-6">Complete Your Payment</h3>

        {/* Order Summary */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Order Summary</h4>
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            {items.map((item) => (
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
              <p><span className="font-semibold">Date:</span> {formatDateEST(pickup.pickup_date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p><span className="font-semibold">Time:</span> {formatTimeEST(pickup.pickup_time_start)} - {formatTimeEST(pickup.pickup_time_end)}</p>
              <p><span className="font-semibold">Location:</span> {pickup.pickup_location}</p>
            </div>
          </div>
        )}

        {/* Payment Element */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-foreground mb-4">Payment Details</h4>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200">
            <PaymentElement
              onReady={() => setIsReady(true)}
              options={{
                layout: 'tabs',
              }}
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-sm text-green-700">
              <span className="font-semibold">Secure payment</span> powered by Stripe
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-muted p-6 space-y-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isReady}
            className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Processing...' : !isReady ? 'Loading...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </form>
  );
}

function CheckoutForm({ isOpen, onClose, onOrderSuccess }: CheckoutProps) {
  const { state, getTotalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [orderStatus, setOrderStatus] = useState({
    status: 'loading',
    message: 'Checking order availability...',
    color: 'text-gray-600'
  });
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');
  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

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
          // Use EST-aware date comparisons
          const orderStartDate = pickupData.order_window_start.includes('T')
            ? pickupData.order_window_start.split('T')[0]
            : pickupData.order_window_start;
          const orderEndDate = pickupData.order_window_end.includes('T')
            ? pickupData.order_window_end.split('T')[0]
            : pickupData.order_window_end;

          let message = 'Orders are currently closed. ';
          if (isBeforeDateEST(orderStartDate)) {
            message += `Orders will open ${formatDateEST(orderStartDate, { month: 'long', day: 'numeric' })}.`;
          } else if (isAfterDateEST(orderEndDate)) {
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

  const handleFormSubmit = async (e: React.FormEvent) => {
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

    setError(null);
    setIsCreatingIntent(true);

    try {
      // Create PaymentIntent
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

      setClientSecret(data.clientSecret);
      setCurrentStep('payment');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsCreatingIntent(false);
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setClientSecret(null);
  };

  const handlePaymentSuccess = () => {
    clearCart();
    setFormData({ customerName: '', customerEmail: '' });

    if (onOrderSuccess) {
      onOrderSuccess();
    }

    setShowEmailConfirmation(true);
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

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

          {/* Checkout Content */}
          {!showEmailConfirmation && currentStep === 'form' && (
            <>
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

              <div className="flex-1 overflow-y-auto p-6">
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
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="border-t border-muted p-6 space-y-4">
                <div className="flex gap-3">
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
                    disabled={orderStatus.status === 'closed' || isCreatingIntent}
                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingIntent ? 'Loading...' : 'Continue to Payment'}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Payment Step - with PaymentElement */}
          {!showEmailConfirmation && currentStep === 'payment' && clientSecret && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#6B4F27',
                      fontFamily: 'system-ui, sans-serif',
                    },
                  },
                }}
              >
                <PaymentForm
                  clientSecret={clientSecret}
                  formData={formData}
                  pickup={pickup}
                  onSuccess={handlePaymentSuccess}
                  onBack={handleBackToForm}
                  onError={handlePaymentError}
                  items={state.items}
                  getTotalPrice={getTotalPrice}
                />
              </Elements>
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
  return <CheckoutForm {...props} />;
}
