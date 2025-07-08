'use client';

import { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { createOrder, isOrderWindowOpen, Order } from '../lib/products';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Checkout({ isOpen, onClose }: CheckoutProps) {
  const { state, getTotalPrice, clearCart } = useCart();
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOrderWindowOpen()) {
      setError('Orders are not available at this time. Order window is Monday 6am to Thursday 5pm.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const orderData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        items: state.items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: parseFloat(getTotalPrice().replace('$', '')),
        status: 'pending' as const
      };

      await createOrder(orderData);
      
      setSuccess(true);
      clearCart();
      
      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: ''
      });

      // Close checkout after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 3000);

    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order. Please try again.');
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
                <h3 className="text-lg font-semibold text-green-800 mb-2">Order Submitted Successfully!</h3>
                <p className="text-green-700">Thank you for your order. We'll contact you soon with pickup details.</p>
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
                
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>

              {/* Important Notes */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h4 className="font-semibold text-yellow-800 mb-2">Important Information</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Orders are only accepted Monday 6am to Thursday 5pm</li>
                  <li>• Pickup is available Sunday 9am-1pm</li>
                  <li>• We'll contact you to confirm your order</li>
                  <li>• Payment is due at pickup</li>
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
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer disabled:opacity-50"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || orderStatus.status === 'closed'}
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Place Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 