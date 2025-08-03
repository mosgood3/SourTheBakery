'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getProducts, Product } from '../lib/products';
import { isOrderWindowOpen, getPickupInfo, getSettings } from '../lib/settings';
import { FaTimes } from 'react-icons/fa';

export default function ProductsSection() {
  const { addItem } = useCart();
  const [currentProduct, setCurrentProduct] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreorderPopup, setShowPreorderPopup] = useState(false);
  const [orderWindowOpen, setOrderWindowOpen] = useState(false);
  const [orderStatusLoading, setOrderStatusLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setOrderStatusLoading(true);
        
        // Fetch both products and order window status
        const [fetchedProducts, isOrderOpen] = await Promise.all([
          getProducts(),
          isOrderWindowOpen()
        ]);
        
        setProducts(fetchedProducts);
        setOrderWindowOpen(isOrderOpen);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
        setOrderStatusLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = (product: Product) => {
    if (!orderWindowOpen) {
      setShowPreorderPopup(true);
      return;
    }
    
    // Add the product to cart
    addItem({
      id: product.id || '',
      name: product.name,
      price: product.price,
      image: product.image,
      description: product.quantity || '' // Use quantity as description for now
    });
  };

  // Show loading state
  if (loading) {
    return (
      <section id="products" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Menu
            </h2>
          </div>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
            <p className="mt-4 text-brown/70">Loading products...</p>
          </div>
        </div>
        {/* Bakery Gallery Section */}
        <BakeryGallery />
      </section>
    );
  }

  // Show error state
  if (error) {
    return (
      <section id="products" className="py-24 bg-background">
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
        <BakeryGallery />
      </section>
    );
  }

  // Show empty state
  if (products.length === 0) {
    return (
      <section id="products" className="py-24 bg-background">
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
        <BakeryGallery />
      </section>
    );
  }

  return (
    <section id="products" className="py-32 bg-gradient-to-b from-cream via-light-cream to-soft-cream">
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
        </div>

        {/* Modern Product Grid - Small/Medium Screens */}
        <div className="md:hidden mb-20">
          <div className="grid grid-cols-2 gap-3 px-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="relative bg-white/95 backdrop-blur-md rounded-2xl p-4 pb-16 shadow-xl border-2 border-sage-green hover:border-forest-green transition-all duration-500 group"
              >
                <div className="text-center">
                  {/* Product Image */}
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    <div className="absolute -inset-2 bg-gradient-to-r from-sage-green/5 to-eucalyptus/5 rounded-2xl blur-md"></div>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain rounded-2xl relative transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="text-[10px] font-bold text-deep-green mb-1 heading-shadow">
                    {product.name}
                  </h3>
                  <p className="text-base text-sage-green font-semibold mb-1">
                    ${parseFloat(product.price).toFixed(2)}
                  </p>
                  {product.quantity && (
                    <p className="text-xs text-forest-green font-medium mb-2 bg-sage-green/10 px-2 py-1 rounded-md text-center">
                      {product.quantity}
                    </p>
                  )}
                </div>
                                          
                {/* Add to Cart Button - Absolute positioned at bottom */}
                <div className="absolute bottom-4 left-4 right-4">
                  {product.weeklyAmountRemaining !== undefined && product.weeklyAmountRemaining <= 0 ? (
                    <div className="bg-red-50 text-red-700 px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 text-center">
                      Sold Out
                    </div>
                  ) : !orderWindowOpen ? (
                    <div className="bg-gray-50 text-gray-600 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-center">
                      Orders Closed
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="bg-sage-green text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-forest-green transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 w-full"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modern Horizontal Product Grid - Large Screens */}
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
                  className="flex-shrink-0 w-[420px] bg-white/95 backdrop-blur-md rounded-3xl p-8 pb-20 shadow-xl border-2 border-sage-green hover:border-forest-green transition-all duration-500 relative group"
                >
                  
                  <div className="text-center">
                    {/* Product Image with modern styling */}
                    <div className="relative w-56 h-56 mx-auto mb-8">
                      <div className="absolute -inset-3 bg-gradient-to-r from-sage-green/5 via-eucalyptus/10 to-mint-green/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain rounded-3xl relative transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <h3 className="text-lg font-bold text-deep-green mb-2 heading-shadow">
                      {product.name}
                    </h3>
                    <p className="text-xl text-sage-green font-semibold mb-2">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                    {product.quantity && (
                      <div className="bg-sage-green/10 border border-sage-green/20 rounded-xl px-4 py-2 mb-4">
                        <p className="text-sm text-forest-green font-semibold text-center">
                          Includes: <span className="text-deep-green">{product.quantity}</span>
                        </p>
                      </div>
                    )}
                  </div>
                                        
                  {/* Modern Add to Cart Button - Absolute positioned at bottom */}
                  <div className="absolute bottom-8 left-8 right-8">
                    {product.weeklyAmountRemaining !== undefined && product.weeklyAmountRemaining <= 0 ? (
                      <div className="bg-red-50 text-red-700 px-8 py-4 rounded-2xl text-base font-semibold border-2 border-red-200 text-center">
                        Sold Out
                      </div>
                    ) : !orderWindowOpen ? (
                      <div className="bg-gray-50 text-gray-600 px-8 py-4 rounded-2xl text-base font-semibold border-2 border-gray-200 text-center">
                        Orders Closed
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="bg-sage-green text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-forest-green transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 w-full"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>

        {/* Modern Call to Action */}
        <div className="text-center">
          <div 
            className="card-modern bg-white/80 backdrop-blur-md rounded-3xl p-16 max-w-5xl mx-auto border border-warm-beige shadow-2xl relative overflow-hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='40' height='40' fill='%23fff8e1'/><ellipse cx='20' cy='20' rx='19' ry='19' fill='%23f7e1b5' fill-opacity='0.13'/><ellipse cx='10' cy='10' rx='6' ry='6' fill='%23d19a6d' fill-opacity='0.07'/><ellipse cx='30' cy='30' rx='7' ry='7' fill='%238b5b29' fill-opacity='0.04'/></svg>")`,
              backgroundSize: '120px 120px',
              backgroundBlendMode: 'multiply',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
            }}
          >
            <h3 className="text-4xl md:text-5xl font-bold text-deep-green mb-6 heading-shadow relative z-10">
              Visit Our Farm Stand
            </h3>
            <p className="text-xl md:text-2xl text-moss-green opacity-90 mb-10 max-w-3xl mx-auto leading-relaxed relative z-10">
              Experience the warmth and aroma of our freshly baked goods in person. Come see where the magic happens!
            </p>
            <a
              href="https://maps.google.com/?q=12+Gaylord+Drive+Rocky+Hill+CT+06111"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-sage-green text-white px-12 py-6 rounded-2xl text-xl font-semibold hover:bg-forest-green transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-3xl cursor-pointer relative z-10"
            >
              <span>Get Directions</span>
              <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
              </svg>
            </a>
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
      <BakeryGallery />
    </section>
  );
} 

// Bakery Gallery as a separate component
function BakeryGallery() {
  const images = [
    { src: '/collage/sour1.jpg', alt: 'Sourdough Creation 1' },
    { src: '/collage/sour2.jpg', alt: 'Sourdough Creation 2' },
    { src: '/collage/sour3.jpg', alt: 'Sourdough Creation 3' },
    { src: '/collage/sour4.jpg', alt: 'Sourdough Creation 4' },
    { src: '/collage/sour5.jpg', alt: 'Sourdough Creation 5' },
    { src: '/collage/sour6.jpg', alt: 'Sourdough Creation 6' },
    { src: '/collage/sour7.jpg', alt: 'Sourdough Creation 7' },
    { src: '/collage/sour8.jpg', alt: 'Sourdough Creation 8' },
    { src: '/collage/sour9.jpg', alt: 'Sourdough Creation 9' },
    { src: '/collage/sour10.jpg', alt: 'Sourdough Creation 10' },
    { src: '/collage/sour11.jpg', alt: 'Sourdough Creation 11' },
  ];

  return (
    <div className="mt-32 px-4 py-20 bg-gradient-to-t from-soft-cream to-light-cream">
      <div className="text-center mb-16">
        <h3 className="text-4xl md:text-5xl font-bold text-deep-green mb-6 heading-shadow">
          Our Handcrafted Creations
        </h3>
        <p className="text-moss-green/80 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
          A glimpse into our artisanal sourdough process and the beautiful breads we craft daily
        </p>
      </div>
      
      {/* Modern Photo Collage Grid */}
      <div className="max-w-7xl mx-auto">
        {/* Mobile: Simple 2-column grid */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {images.slice(0, 8).map((image, index) => (
            <div key={index} className="relative group overflow-hidden rounded-xl shadow-lg aspect-square">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>

        {/* Desktop: Complex layout with featured images */}
        <div className="hidden md:block">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Featured large image */}
            <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src={images[0].src}
                alt={images[0].alt}
                width={600}
                height={600}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-green/20 via-transparent to-sage-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-3xl"></div>
            </div>
            
            {/* Medium images */}
            {images.slice(1, 5).map((image, index) => (
              <div key={index + 1} className="relative group overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
              </div>
            ))}
            
            {/* Tall image */}
            <div className="lg:row-span-2 relative group overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={images[5].src}
                alt={images[5].alt}
                width={300}
                height={600}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
            </div>
            
            {/* Remaining images */}
            {images.slice(6, 9).map((image, index) => (
              <div key={index + 6} className="relative group overflow-hidden rounded-xl shadow-md">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>
          
          {/* Bottom section for desktop */}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {images.slice(9, 11).map((image, index) => (
                <div key={index + 9} className="relative group overflow-hidden rounded-xl shadow-md">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 