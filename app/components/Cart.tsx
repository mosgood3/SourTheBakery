'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { getPickup, isPickupOrderWindowOpen, Pickup } from '../lib/pickups-supabase';
import Checkout from './Checkout';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import { formatDateEST, formatTimeEST } from '../lib/timezone';

interface CartProps {
  onOrderSuccess?: () => void;
}

export default function Cart({ onOrderSuccess }: CartProps) {
  const { state, removeItem, updateQuantity, clearCart, closeCart, getTotalPrice } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderWindowOpen, setOrderWindowOpen] = useState(false);
  const [checkingOrderStatus, setCheckingOrderStatus] = useState(true);
  const [pickup, setPickup] = useState<Pickup | null>(null);

  useEffect(() => {
    const checkOrderWindow = async () => {
      try {
        // If there's a pickup ID, check that specific pickup
        if (state.currentPickupId) {
          const pickupData = await getPickup(state.currentPickupId);
          if (!pickupData) {
            // Pickup no longer exists, clear cart
            setOrderWindowOpen(false);
            setPickup(null);
            return;
          }

          setPickup(pickupData);
          const isOpen = await isPickupOrderWindowOpen(state.currentPickupId);
          setOrderWindowOpen(isOpen);

          // If pickup is no longer active, clear cart
          if (!isOpen) {
            // Auto-clear cart if pickup window closed
            setTimeout(() => {
              clearCart();
            }, 3000);
          }
        } else {
          // No pickup selected, cart should be empty
          setOrderWindowOpen(false);
          setPickup(null);
        }
      } catch (error) {
        console.error('Error checking order window:', error);
        setOrderWindowOpen(false);
        setPickup(null);
      } finally {
        setCheckingOrderStatus(false);
      }
    };

    if (state.isOpen) {
      checkOrderWindow();
    }
  }, [state.isOpen, state.currentPickupId]);

  const formatDate = (dateString: string): string => {
    return formatDateEST(dateString, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    return formatTimeEST(timeString);
  };

  if (!state.isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={closeCart}
      />

      {/* Cart Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-muted">
            <h2 className="text-2xl font-serif font-bold text-foreground">Your Cart</h2>
            <button
              onClick={closeCart}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Pickup Info */}
          {pickup && (
            <div className="p-4 border-b border-muted bg-accent-gold/10">
              <h3 className="text-sm font-semibold text-brown/60 mb-2">Pickup Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-brown/80">
                  <FiCalendar className="text-accent-gold" size={16} />
                  <span className="font-semibold">{formatDate(pickup.pickup_date)}</span>
                </div>
                <div className="flex items-center gap-2 text-brown/80">
                  <FiClock className="text-accent-gold" size={16} />
                  <span>{formatTime(pickup.pickup_time_start)} - {formatTime(pickup.pickup_time_end)}</span>
                </div>
                <div className="flex items-center gap-2 text-brown/80">
                  <FiMapPin className="text-accent-gold" size={16} />
                  <span>{pickup.pickup_location}</span>
                </div>
              </div>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6">
            {state.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground">Add some delicious items to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-primary font-semibold">{item.price}</p>
                        {item.maxQuantity && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            Max: {item.maxQuantity}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.maxQuantity !== undefined && item.quantity >= item.maxQuantity}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          item.maxQuantity !== undefined && item.quantity >= item.maxQuantity
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                        }`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {state.items.length > 0 && (
            <div className="border-t border-muted p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-foreground">Total:</span>
                <span className="text-2xl font-bold text-primary">{getTotalPrice()}</span>
              </div>
              
              {/* Order Status Warning */}
              {!checkingOrderStatus && !orderWindowOpen && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-red-700 text-sm font-medium">
                      {pickup
                        ? `The order window for this pickup has closed. Your cart will be cleared.`
                        : 'Orders are currently closed. You can\'t proceed to checkout.'}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={clearCart}
                  className="flex-1 px-4 py-3 border-2 border-primary text-primary font-semibold rounded-full hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                >
                  Clear Cart
                </button>
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  disabled={checkingOrderStatus || !orderWindowOpen}
                  className={`flex-1 px-4 py-3 font-semibold rounded-full transition-colors ${
                    checkingOrderStatus || !orderWindowOpen
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                  }`}
                >
                  {checkingOrderStatus ? 'Checking...' : !orderWindowOpen ? 'Orders Closed' : 'Checkout'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checkout Component */}
      <Checkout 
        isOpen={isCheckoutOpen} 
        onClose={() => {
          setIsCheckoutOpen(false);
          closeCart();
        }}
        onOrderSuccess={onOrderSuccess}
      />
    </>
  );
} 