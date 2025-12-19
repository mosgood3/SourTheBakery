'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPickupWithProducts, Pickup, PickupProduct, isPickupOrderWindowOpen, getRemainingStock } from '../../lib/pickups-supabase';
import { useCart } from '../../contexts/CartContext';
import Navigation from '../../components/Navigation';
import Cart from '../../components/Cart';
import Footer from '../../components/Footer';
import NotificationBanner from '../../components/NotificationBanner';
import { FiCalendar, FiClock, FiMapPin, FiHome, FiChevronRight, FiShoppingCart, FiAlertCircle } from 'react-icons/fi';

export default function PickupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pickupId = params.id as string;
  const { addItem, state, validatePickupSwitch, clearCart, setCurrentPickup } = useCart();

  const [pickup, setPickup] = useState<Pickup | null>(null);
  const [products, setProducts] = useState<PickupProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderWindowOpen, setOrderWindowOpen] = useState(false);
  const [stockRemaining, setStockRemaining] = useState<Record<string, number>>({});
  const [showSwitchWarning, setShowSwitchWarning] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<PickupProduct | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [pickupData, isOpen] = await Promise.all([
          getPickupWithProducts(pickupId),
          isPickupOrderWindowOpen(pickupId)
        ]);

        if (!pickupData) {
          setError('Pickup event not found');
          return;
        }

        setPickup(pickupData);
        setProducts(pickupData.products);
        setOrderWindowOpen(isOpen);

        // Fetch remaining stock for all products
        const stockData: Record<string, number> = {};
        for (const product of pickupData.products) {
          const remaining = await getRemainingStock(pickupId, product.product_id);
          stockData[product.product_id] = remaining;
        }
        setStockRemaining(stockData);
      } catch (err) {
        console.error('Failed to load pickup:', err);
        setError('Failed to load pickup event');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pickupId]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const standardHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${standardHour}:${minutes} ${period}`;
    } catch {
      return timeString;
    }
  };

  const getStockStatus = (productId: string) => {
    const remaining = stockRemaining[productId] || 0;
    if (remaining === 0) return { text: 'Sold Out', color: 'text-red-600' };
    if (remaining <= 5) return { text: `Only ${remaining} left`, color: 'text-yellow-600' };
    return { text: `${remaining} available`, color: 'text-green-600' };
  };

  const handleAddToCart = (product: PickupProduct) => {
    if (!pickup) return;

    // Check if we're switching pickups
    const canSwitch = validatePickupSwitch(pickupId);

    if (!canSwitch) {
      // Show warning modal
      setPendingProduct(product);
      setShowSwitchWarning(true);
      return;
    }

    // Add to cart
    addItemToCart(product);
  };

  const addItemToCart = (product: PickupProduct) => {
    if (!pickup || !product.product) return;

    const remaining = stockRemaining[product.product_id] || 0;
    const currentInCart = state.items.find(item => item.id === product.product_id)?.quantity || 0;

    addItem({
      id: product.product_id,
      name: product.product.name,
      price: product.price,
      description: product.product.quantity || '',
      image: product.product.image,
      maxQuantity: remaining,
      pickupId: pickupId
    });

    // Update local stock count
    setStockRemaining(prev => ({
      ...prev,
      [product.product_id]: Math.max(0, remaining - 1)
    }));
  };

  const handleConfirmSwitch = () => {
    if (pendingProduct) {
      clearCart();
      setCurrentPickup(pickupId);
      addItemToCart(pendingProduct);
      setShowSwitchWarning(false);
      setPendingProduct(null);
    }
  };

  const handleCancelSwitch = () => {
    setShowSwitchWarning(false);
    setPendingProduct(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige">
        <Navigation />
        <NotificationBanner />
        <Cart onOrderSuccess={() => {}} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
            <p className="mt-4 text-brown/70">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !pickup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige">
        <Navigation />
        <NotificationBanner />
        <Cart onOrderSuccess={() => {}} />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <FiAlertCircle className="mx-auto text-red-600 mb-4" size={64} />
            <h1 className="text-3xl font-bold text-brown mb-4">Pickup Event Not Found</h1>
            <p className="text-brown/70 mb-8">{error || 'This pickup event does not exist or is no longer available.'}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors"
            >
              <FiHome size={20} />
              Return Home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige">
      <Navigation />
      <NotificationBanner />
      <Cart onOrderSuccess={() => {}} />

      {/* Switch Pickup Warning Modal */}
      {showSwitchWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <FiAlertCircle className="text-yellow-600" size={32} />
              <h3 className="text-xl font-bold text-brown">Switch Pickup Event?</h3>
            </div>
            <p className="text-brown/70 mb-6">
              Your cart contains items from a different pickup event. Switching will clear your current cart. Continue?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelSwitch}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSwitch}
                className="flex-1 px-4 py-3 rounded-lg font-semibold bg-accent-gold text-brown hover:bg-accent-gold/90 transition-colors"
              >
                Clear & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex items-center gap-2 text-sm text-brown/70 mb-8">
          <Link href="/" className="hover:text-brown transition-colors flex items-center gap-1">
            <FiHome size={16} />
            Home
          </Link>
          <FiChevronRight size={14} />
          <Link href="/#menu" className="hover:text-brown transition-colors">
            Pickups
          </Link>
          <FiChevronRight size={14} />
          <span className="text-brown font-semibold">Pickup on {formatDate(pickup.pickup_date)}</span>
        </nav>
      </div>

      {/* Pickup Header - Minimal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-brown mb-2">Menu</h1>
            <p className="text-brown/60 text-sm">
              {formatDate(pickup.pickup_date)} · {formatTime(pickup.pickup_time_start)} - {formatTime(pickup.pickup_time_end)} · {pickup.pickup_location}
            </p>
          </div>
          <span className={`self-start px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
            orderWindowOpen
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {orderWindowOpen ? 'Orders Open' : 'Orders Closed'}
          </span>
        </div>

        {/* Products Section */}
        <div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white/90 backdrop-blur-sm rounded-3xl border border-accent-gold/20">
              <p className="text-xl text-brown/70">No products available for this pickup yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((pickupProduct) => {
                const product = pickupProduct.product;
                if (!product) return null;

                const stockStatus = getStockStatus(pickupProduct.product_id);
                const remaining = stockRemaining[pickupProduct.product_id] || 0;
                const isSoldOut = remaining === 0;
                const canAddToCart = orderWindowOpen && !isSoldOut;
                const inCart = state.items.find(item => item.id === pickupProduct.product_id)?.quantity || 0;

                return (
                  <div
                    key={pickupProduct.id}
                    className="bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-accent-gold/20"
                  >
                    {/* Product Image */}
                    <div className="relative h-64 overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                      {/* Stock Badge */}
                      <div className="absolute top-4 right-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                          isSoldOut
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : remaining <= 5
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : 'bg-green-100 text-green-800 border border-green-300'
                        }`}>
                          {stockStatus.text}
                        </span>
                      </div>
                      {/* Cart Badge */}
                      {inCart > 0 && (
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-gold text-brown flex items-center gap-1">
                            <FiShoppingCart size={12} />
                            {inCart} in cart
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-brown mb-2">{product.name}</h3>
                      <p className="text-brown/70 mb-4">{product.quantity || 'Available'}</p>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl font-bold text-accent-gold">{pickupProduct.price}</span>
                      </div>

                      <button
                        onClick={() => handleAddToCart(pickupProduct)}
                        disabled={!canAddToCart}
                        className={`w-full py-3.5 px-6 rounded-xl font-bold uppercase tracking-wide text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                          canAddToCart
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 shadow-md hover:shadow-lg'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <FiShoppingCart size={16} />
                        {!orderWindowOpen ? 'Orders Closed' : isSoldOut ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
