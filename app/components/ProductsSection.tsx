'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getProducts, Product } from '../lib/products-supabase';
import { isOrderWindowOpen, getPickupInfo, getSettings } from '../lib/settings-supabase';
import { FaTimes } from 'react-icons/fa';
import RecipesSection from './RecipesSection';
import HandcraftedCreationsGallery from './HandcraftedCreationsGallery';

interface ProductsSectionProps {
  refreshTrigger?: number;
}

export default function ProductsSection({ refreshTrigger }: ProductsSectionProps = {}) {
  const { addItem, state } = useCart();
  const [currentProduct, setCurrentProduct] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreorderPopup, setShowPreorderPopup] = useState(false);
  const [orderWindowOpen, setOrderWindowOpen] = useState(false);
  const [orderStatusLoading, setOrderStatusLoading] = useState(true);
  const [pickupLocation, setPickupLocation] = useState<string>('Rocky Hill, CT');
  const [orderSettings, setOrderSettings] = useState<{
    orderWindowStart: string;
    orderWindowEnd: string;
    orderWindowDays: number[];
    pickupDate: string;
    pickupTimeStart: string;
    pickupTimeEnd: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setOrderStatusLoading(true);
        
        // Fetch products, order window status, pickup info, and settings
        const [fetchedProducts, isOrderOpen, pickupInfo, settings] = await Promise.all([
          getProducts(),
          isOrderWindowOpen(),
          getPickupInfo(),
          getSettings()
        ]);
        
        setProducts(fetchedProducts);
        setOrderWindowOpen(isOrderOpen);
        setPickupLocation(pickupInfo.location);
        setOrderSettings({
          orderWindowStart: settings.orderWindowStart,
          orderWindowEnd: settings.orderWindowEnd,
          orderWindowDays: settings.orderWindowDays,
          pickupDate: settings.pickupDate,
          pickupTimeStart: settings.pickupTimeStart,
          pickupTimeEnd: settings.pickupTimeEnd
        });
      } catch (err) {
        setError('Failed to load products');
      } finally {
        setLoading(false);
        setOrderStatusLoading(false);
      }
    };

    fetchData();
  }, []);

  // Refresh products when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      const fetchData = async () => {
        try {
          const [fetchedProducts, isOrderOpen] = await Promise.all([
            getProducts(),
            isOrderWindowOpen()
          ]);
          
          setProducts(fetchedProducts);
          setOrderWindowOpen(isOrderOpen);
        } catch (err) {
        }
      };
      
      fetchData();
    }
  }, [refreshTrigger]);

  // Helper functions for formatting order information
  const formatTime = (militaryTime: string) => {
    try {
      const [hours, minutes] = militaryTime.split(':');
      const hour = parseInt(hours, 10);
      const minute = minutes || '00';
      const period = hour >= 12 ? 'PM' : 'AM';
      const standardHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${standardHour}:${minute} ${period}`;
    } catch (error) {
      return militaryTime;
    }
  };

  const formatOrderDays = (days: number[]) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.map(day => dayNames[day]).join(', ');
  };

  const formatPickupDate = (date: string) => {
    try {
      const pickupDate = new Date(date + 'T12:00:00');
      return pickupDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric'
      });
    } catch (error) {
      return 'TBD';
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!orderWindowOpen) {
      setShowPreorderPopup(true);
      return;
    }

    // Check if adding this item would exceed available stock
    const currentCartQuantity = getCartQuantityForProduct(product.id || '');
    const availableStock = product.weekly_amount_remaining ?? 0;

    if (currentCartQuantity >= availableStock) {
      // Item is at stock limit
      return;
    }

    // Add the product to cart
    addItem({
      id: product.id || '',
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.quantity || '', // Use quantity as description for now
      maxQuantity: availableStock
    });
  };

  // Helper function to get current cart quantity for a specific product
  const getCartQuantityForProduct = (productId: string): number => {
    const cartItem = state.items.find(item => item.id === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  // Helper function to get remaining stock for a product (considering cart)
  const getRemainingStock = (product: Product): number => {
    const availableStock = product.weekly_amount_remaining ?? 0;
    const currentCartQuantity = getCartQuantityForProduct(product.id || '');
    return Math.max(0, availableStock - currentCartQuantity);
  };

  // Helper function to check if add to cart should be disabled
  const isAddToCartDisabled = (product: Product): boolean => {
    const remainingStock = getRemainingStock(product);
    return remainingStock <= 0 || !orderWindowOpen;
  };

  // Show loading state
  if (loading) {
    return (
      <section id="products" className="py-24 bg-gradient-to-b from-light-green via-soft-green to-sage-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              SOURDOUGH EVERYTHING
            </h2>
          </div>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
            <p className="mt-4 text-brown/70">Loading products...</p>
          </div>
        </div>
        {/* Bakery Gallery Section */}
        <HandcraftedCreationsGallery />
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section id="products" className="py-24 bg-gradient-to-b from-light-green via-soft-green to-sage-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Menu
            </h2>
          </div>
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-accent-gold text-brown px-6 py-3 rounded-full font-semibold hover:bg-accent-gold/90 transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
        {/* Bakery Gallery Section */}
        <HandcraftedCreationsGallery />
      </section>
    );
  }

  // Show empty state
  if (products.length === 0) {
    return (
      <section id="products" className="py-24 bg-gradient-to-b from-light-green via-soft-green to-sage-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Menu
            </h2>
          
          </div>
          <div className="text-center">
            <p className="text-brown/70 text-xl">No products available at the moment.</p>
            <p className="text-brown/50 mt-2">Check back soon for fresh baked goods!</p>
          </div>
        </div>
        {/* Bakery Gallery Section */}
        <HandcraftedCreationsGallery />
      </section>
    );
  }

  return (
    <section id="products" className="py-32 bg-gradient-to-b from-light-green via-soft-green to-sage-green">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Section Header */}
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl font-bold text-deep-green mb-8 heading-shadow">
            SOURDOUGH EVERYTHING
          </h2>
          <p className="text-xl md:text-2xl text-moss-green opacity-90 max-w-3xl mx-auto leading-relaxed mb-6">
            Discover our handcrafted selection of artisanal sourdough treats, baked fresh with love and traditional techniques
          </p>
          
          {/* Order Status Indicator */}
          {!orderStatusLoading && (
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold ${
              orderWindowOpen 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${orderWindowOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {orderWindowOpen ? 'Orders Open' : 'Orders Closed'}
            </div>
          )}

          {/* Order Information */}
          {orderSettings && (
            <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto shadow-lg border border-white/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center md:text-left">
                <div>
                  <h3 className="text-lg font-bold text-deep-green mb-2">Order Window</h3>
                  <p className="text-moss-green font-medium">
                    {formatTime(orderSettings.orderWindowStart)} - {formatTime(orderSettings.orderWindowEnd)}
                  </p>
                  <p className="text-moss-green/80 text-sm mt-1">
                    {formatOrderDays(orderSettings.orderWindowDays)}
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-deep-green mb-2">Next Pickup</h3>
                  <p className="text-moss-green font-medium">
                    {formatPickupDate(orderSettings.pickupDate)}
                  </p>
                  <p className="text-moss-green/80 text-sm mt-1">
                    {formatTime(orderSettings.pickupTimeStart)} - {formatTime(orderSettings.pickupTimeEnd)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modern Image-Focused Product Grid - Small/Medium Screens */}
        <div className="md:hidden mb-20">
          <div className="grid grid-cols-1 gap-6 px-2 max-w-sm mx-auto">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative bg-white rounded-3xl shadow-2xl overflow-hidden group transform hover:scale-[1.02] transition-all duration-500"
              >
                {/* Large Product Image Background */}
                <div className="relative h-80 overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  
                  {/* Product Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-xl font-bold mb-2 drop-shadow-lg !text-white">
                      {product.name}
                    </h3>
                    {product.quantity && (
                      <div className="mb-3">
                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full inline-block">
                          <p className="text-sm font-medium text-white">
                            Comes with {product.quantity}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-2xl font-bold text-white drop-shadow-lg">
                        ${parseFloat(product.price).toFixed(2)}
                      </p>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`backdrop-blur-sm px-3 py-1 rounded-full ${
                          getRemainingStock(product) > 5 
                            ? 'bg-green-500/20 border border-green-400/30' 
                            : getRemainingStock(product) > 0
                              ? 'bg-yellow-500/20 border border-yellow-400/30'
                              : 'bg-red-500/20 border border-red-400/30'
                        }`}>
                          <p className={`text-sm font-medium ${
                            getRemainingStock(product) > 5 
                              ? 'text-green-200' 
                              : getRemainingStock(product) > 0
                                ? 'text-yellow-200'
                                : 'text-red-200'
                          }`}>
                            {getRemainingStock(product)} left
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Cart quantity indicator */}
                    {getCartQuantityForProduct(product.id || '') > 0 && (
                      <div className="flex justify-center mb-4">
                        <div className="bg-blue-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-400/30">
                          <p className="text-sm font-medium text-blue-200">
                            {getCartQuantityForProduct(product.id || '')} in cart
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Add to Cart Button */}
                    {getRemainingStock(product) <= 0 ? (
                      <div className="bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm font-semibold text-center">
                        Sold Out
                      </div>
                    ) : !orderWindowOpen ? (
                      <div className="bg-gray-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm font-semibold text-center">
                        Orders Closed
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={isAddToCartDisabled(product)}
                        className={`w-full backdrop-blur-sm text-white px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                          isAddToCartDisabled(product)
                            ? 'bg-gray-500/90 cursor-not-allowed opacity-50'
                            : 'bg-soft-green hover:bg-nature-green cursor-pointer'
                        }`}
                      >
                        {getRemainingStock(product) <= 0 ? 'Sold Out' : 'Add to Cart'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modern Image-Focused Product Grid - Large Screens */}
        <div className="hidden md:block mb-20">
          <div className="relative max-w-7xl mx-auto px-4">
            <div 
              className="flex gap-8 overflow-x-auto pb-8 pt-6 scrollbar-hide"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#D19A6D #F7E1B5'
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-[380px] bg-white rounded-3xl shadow-2xl overflow-hidden group transform hover:scale-[1.02] transition-all duration-500"
                >
                  {/* Large Product Image Background */}
                  <div className="relative h-96 overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                    
                    {/* Product Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <h3 className="text-2xl font-bold mb-3 drop-shadow-lg !text-white">
                        {product.name}
                      </h3>
                      {product.quantity && (
                        <div className="mb-4">
                          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 inline-block">
                            <p className="text-sm font-semibold text-white">
                              Comes with {product.quantity}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-6">
                        <p className="text-3xl font-bold text-white drop-shadow-lg">
                          ${parseFloat(product.price).toFixed(2)}
                        </p>
                        <div className="flex flex-col items-end gap-2">
                          <div className={`backdrop-blur-sm px-4 py-2 rounded-full border ${
                            getRemainingStock(product) > 5 
                              ? 'bg-green-500/20 border-green-400/30' 
                              : getRemainingStock(product) > 0
                                ? 'bg-yellow-500/20 border-yellow-400/30'
                                : 'bg-red-500/20 border-red-400/30'
                          }`}>
                            <p className={`text-sm font-semibold ${
                              getRemainingStock(product) > 5 
                                ? 'text-green-200' 
                                : getRemainingStock(product) > 0
                                  ? 'text-yellow-200'
                                  : 'text-red-200'
                            }`}>
                              {getRemainingStock(product)} left
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Cart quantity indicator */}
                      {getCartQuantityForProduct(product.id || '') > 0 && (
                        <div className="flex justify-center mb-6">
                          <div className="bg-blue-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-blue-400/30">
                            <p className="text-sm font-semibold text-blue-200">
                              {getCartQuantityForProduct(product.id || '')} in cart
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Add to Cart Button */}
                      {getRemainingStock(product) <= 0 ? (
                        <div className="bg-red-500/90 backdrop-blur-sm text-white px-8 py-4 rounded-2xl text-base font-semibold text-center border border-red-400/50">
                          Sold Out
                        </div>
                      ) : !orderWindowOpen ? (
                        <div className="bg-gray-500/90 backdrop-blur-sm text-white px-8 py-4 rounded-2xl text-base font-semibold text-center border border-gray-400/50">
                          Orders Closed
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={isAddToCartDisabled(product)}
                          className={`w-full backdrop-blur-sm text-white px-8 py-4 rounded-2xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 border border-white/20 ${
                            isAddToCartDisabled(product)
                              ? 'bg-gray-500/90 cursor-not-allowed opacity-50'
                              : 'bg-soft-green hover:bg-nature-green cursor-pointer'
                          }`}
                        >
                          {getRemainingStock(product) <= 0 ? 'Sold Out' : 'Add to Cart'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>

      </div>
      {showPreorderPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='40' height='40' fill='%23fff8e1'/><ellipse cx='20' cy='20' rx='19' ry='19' fill='%23f7e1b5' fill-opacity='0.13'/><ellipse cx='10' cy='10' rx='6' ry='6' fill='%23d19a6d' fill-opacity='0.07'/><ellipse cx='30' cy='30' rx='7' ry='7' fill='%238b5b29' fill-opacity='0.04'/></svg>")`,
            backgroundSize: '120px 120px',
            backgroundBlendMode: 'multiply',
            backgroundColor: 'var(--peach)',
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center relative">
            <button
              className="absolute top-3 right-3 text-brown hover:text-accent-gold text-2xl focus:outline-none"
              onClick={() => setShowPreorderPopup(false)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-brown">Pre-orders Coming Soon!</h2>
            <p className="text-brown mb-6">We're getting ready to launch pre-orders for our products. Stay tuned!</p>
          </div>
        </div>
      )}
      <RecipesSection />
      <HandcraftedCreationsGallery />
    </section>
  );
} 