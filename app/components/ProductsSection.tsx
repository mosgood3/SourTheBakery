'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getProducts, Product } from '../lib/products';
import { isOrderWindowOpen, getPickupInfo, getSettings } from '../lib/settings';
import { FaTimes } from 'react-icons/fa';

// export function PorchPickupSection() {
//   const [pickupInfo, setPickupInfo] = useState<{ date: string; time: string; location: string } | null>(null);
//   const [orderWindowInfo, setOrderWindowInfo] = useState<{ start: string; end: string; days: string[] } | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchInfo = async () => {
//       try {
//         const [pickup, settings] = await Promise.all([
//           getPickupInfo(),
//           getSettings()
//         ]);
        
//         setPickupInfo(pickup);
        
//         // Format order window days
//         const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//         const orderDays = settings.orderWindowDays.map((day: number) => dayNames[day]);
//         setOrderWindowInfo({
//           start: settings.orderWindowStart,
//           end: settings.orderWindowEnd,
//           days: orderDays
//         });
//       } catch (error) {
//         console.error('Failed to fetch info:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInfo();
//   }, []);

//   if (loading) {
//     return (
//       <>
//         <h3 className="mt-16 text-3xl md:text-4xl font-serif font-bold text-brown mb-4 text-center tracking-tight">Our schedule</h3>
//         <div className="mt-0 mb-12 bg-muted/30 rounded-3xl border-2 border-accent-gold/40 p-6 px-8 lg:px-16 max-w-xl mx-auto shadow-xl">
//           <div className="text-center">
//             <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold"></div>
//             <p className="mt-2 text-brown/70">Loading schedule...</p>
//           </div>
//         </div>
//       </>
//     );
//   }

//   const pickupDate = pickupInfo ? new Date(pickupInfo.date).toLocaleDateString('en-US', { 
//     weekday: 'short', 
//     month: 'short', 
//     day: 'numeric' 
//   }) : 'TBD';

//   return (
//     <>
//       <h3 className="mt-16 text-3xl md:text-4xl font-serif font-bold text-brown mb-4 text-center tracking-tight">Our schedule</h3>
//       <div className="mt-0 mb-12 bg-muted/30 rounded-3xl border-2 border-accent-gold/40 p-6 py-10 px-8 lg:px-12 xl:px-16 max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl mx-auto shadow-xl">
//         <div className="text-brown/90 text-lg font-bold text-center mb-4">
//           <span role="img" aria-label="door">🚪</span> <span className="font-bold">Farm Stand Pickup Only:</span> All online orders are for farm stand pickup at {pickupInfo?.location || '12 Gaylord Drive, Rocky Hill, CT'}.
//         </div>
//         {/* Responsive: vertical on small, horizontal on md+ */}
//         <div className="flex flex-col md:grid md:grid-cols-5 gap-y-2 md:gap-x-2 items-center justify-items-center w-full">
//           {/* Order Online */}
//           <div className="flex flex-col items-center bg-white/90 border-2 border-accent-gold rounded-2xl px-4 py-4 min-w-[110px] shadow-md w-40 h-32">
//             <span className="text-2xl">🛒</span>
//             <span className="font-semibold text-brown text-base mt-1">Order Online</span>
//             <span className="text-sm text-brown/70 mt-1 text-center">
//               {orderWindowInfo ? `${orderWindowInfo.days.join(', ')} ${orderWindowInfo.start}-${orderWindowInfo.end}` : 'Loading...'}
//             </span>
//           </div>
//           {/* Arrow */}
//           <div className="my-1 md:my-0 md:col-start-2 flex items-center justify-center">
//             <span className="text-2xl text-brown md:hidden">↓</span>
//             <span className="text-2xl text-brown hidden md:inline">→</span>
//           </div>
//           {/* Baker Prepares */}
//           <div className="flex flex-col items-center bg-white/90 border-2 border-accent-gold rounded-2xl px-4 py-4 min-w-[110px] shadow-md md:col-start-3 w-40 h-32">
//             <span className="text-2xl">👩‍🍳</span>
//             <span className="font-semibold text-brown text-base mt-1">Baker Prepares</span>
//             <span className="text-sm text-brown/70 mt-1">Fri & Sat</span>
//           </div>
//           {/* Arrow */}
//           <div className="my-1 md:my-0 md:col-start-4 flex items-center justify-center">
//             <span className="text-2xl text-brown md:hidden">↓</span>
//             <span className="text-2xl text-brown hidden md:inline">→</span>
//           </div>
//           {/* Porch Pickup */}
//           <div className="flex flex-col items-center bg-white/90 border-2 border-accent-gold rounded-2xl px-4 py-4 min-w-[110px] shadow-md md:col-start-5 w-40 h-32">
//             <span className="text-2xl">🏡</span>
//             <span className="font-semibold text-brown text-base mt-1">Porch Pickup</span>
//             <span className="text-sm text-brown/70 mt-1">{pickupDate} {pickupInfo?.time}</span>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

export default function ProductsSection() {
  const { addItem } = useCart();
  const [currentProduct, setCurrentProduct] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPreorderPopup, setShowPreorderPopup] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = () => {
    setShowPreorderPopup(true);
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
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Each item is carefully crafted using traditional techniques and the finest ingredients, just like Magnolia Bakery's approach to quality.
            </p>
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
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Each item is carefully crafted using traditional techniques and the finest ingredients, just like Magnolia Bakery's approach to quality.
            </p>
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
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Each item is carefully crafted using traditional techniques and the finest ingredients, just like Magnolia Bakery's approach to quality.
            </p>
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
    <section id="products" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Menu
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Each item is carefully crafted using traditional techniques and the finest ingredients.
          </p>
        </div>

        {/* 3D Rotating Product Showcase - Small/Medium Screens */}
        <div className="md:hidden flex items-center justify-center relative w-full h-[500px] sm:h-[600px] mb-16">
          <div className="relative w-full max-w-[600px] h-full perspective-1000">
            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentProduct((prev) => (prev - 1 + products.length) % products.length)}
              className="absolute left-4 top-1/3 md:top-1/2 transform -translate-y-1/2 z-30 bg-transparent md:bg-white/90 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-accent-gold/20"
              aria-label="Previous product"
            >
              <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentProduct((prev) => (prev + 1) % products.length)}
              className="absolute right-4 top-1/3 md:top-1/2 transform -translate-y-1/2 z-30 bg-transparent md:bg-white/90 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-accent-gold/20"
              aria-label="Next product"
            >
              <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Product Carousel */}
            <div className="relative w-full h-full transform-style-preserve-3d">
              {products.map((product, index) => {
                const isActive = index === currentProduct;
                const rotation = ((index - currentProduct) * 120) % 360;
                const translateZ = isActive ? 250 : 120;
                const opacity = isActive ? 1 : 0.3;
                const scale = isActive ? 1 : 0.8;
                
                return (
                  <div
                    key={product.id}
                    className={`absolute inset-0 transition-all duration-1000 ease-out cursor-pointer ${
                      isActive ? 'z-20' : 'z-10'
                    }`}
                    style={{
                      transform: `rotateY(${rotation}deg) translateZ(${translateZ}px) scale(${scale})`,
                      opacity: opacity,
                    }}
                    onClick={() => setCurrentProduct(index)}
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      {/* Product Card */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-accent-gold/20 transform hover:scale-105 transition-transform duration-300" style={{backgroundColor: 'rgba(255, 248, 225, 0.95)'}}>
                        
                        <div className="text-center">
                          {/* Product Image */}
                          <div className="relative w-56 h-56 mx-auto mb-8">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-contain rounded-2xl"
                              priority={isActive}
                            />
                          </div>
                          
                          {/* Product Info */}
                          <h3 className="text-3xl font-bold text-brown mb-2">
                            {product.name}
                          </h3>
                          <p className="text-xl text-cinnamon font-semibold mb-2">
                            ${parseFloat(product.price).toFixed(2)}
                          </p>
                          <p className="text-brown/80 text-xl mb-8">
                            {product.description}
                          </p>
                                                  
                          {/* Add to Cart Button */}
                          {product.weeklyAmountRemaining !== undefined && product.weeklyAmountRemaining <= 0 ? (
                            <div className="bg-red-100 text-red-800 px-8 py-4 rounded-full text-lg font-semibold border-2 border-red-300">
                              Sold Out
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart();
                              }}
                              className="bg-accent-gold text-brown px-8 py-4 rounded-full text-lg font-semibold hover:bg-accent-gold/90 transition-colors duration-300 cursor-pointer border-2 border-brown transform hover:scale-105"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Navigation Dots */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentProduct(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 cursor-pointer ${
                    index === currentProduct 
                      ? 'bg-accent-gold scale-125 shadow-lg' 
                      : 'bg-brown/30 hover:bg-brown/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Horizontal Scrollable Product List - Large Screens */}
        <div className="hidden md:block mb-16">
          <div className="flex justify-center">
            <div className="flex gap-8 overflow-x-auto pb-8 max-w-6xl">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-80 bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20 transform hover:scale-105 transition-all duration-300 cursor-pointer relative"
                  style={{backgroundColor: 'rgba(255, 248, 225, 0.95)'}}
                  onClick={() => handleAddToCart()}
                >
                  
                  <div className="text-center">
                    {/* Product Image */}
                    <div className="relative w-48 h-48 mx-auto mb-6">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain rounded-2xl"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <h3 className="text-2xl font-bold text-brown mb-1">
                      {product.name}
                    </h3>
                    <p className="text-lg text-cinnamon font-semibold mb-1">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                    <p className="text-brown/80 text-lg mb-6">
                      {product.description}
                    </p>
                                        
                    {/* Add to Cart Button */}
                    {product.weeklyAmountRemaining !== undefined && product.weeklyAmountRemaining <= 0 ? (
                      <div className="bg-red-100 text-red-800 px-6 py-3 rounded-full text-base font-semibold border-2 border-red-300">
                        Sold Out
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart();
                        }}
                        className="bg-accent-gold text-brown px-6 py-3 rounded-full text-base font-semibold hover:bg-accent-gold/90 transition-colors duration-300 cursor-pointer border-2 border-brown transform hover:scale-105"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="text-center mt-4">
            <p className="text-brown/60 text-sm">
              ← Scroll to see more products →
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-muted/30 rounded-3xl p-12 max-w-4xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Visit Our Farm Stand
            </h3>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the warmth and aroma of our freshly baked goods in person. Come see where the magic happens!
            </p>
            <a
              href="https://maps.google.com/?q=12+Gaylord+Drive+Rocky+Hill+CT+06111"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-xl cursor-pointer"
            >
              Get Directions
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
  return (
    <div className="mt-20 text-center">
      <h3 className="text-3xl md:text-4xl font-serif font-bold text-brown mb-8">
        Bakery Gallery
      </h3>
      <div className="max-w-4xl mx-auto">
        {/* Canva Moodboard Embed */}
        <div style={{position: 'relative', width: '100%', height: 0, paddingTop: '177.7778%', paddingBottom: 0, boxShadow: '0 2px 8px 0 rgba(63,69,81,0.16)', marginTop: '1.6em', marginBottom: '0.9em', overflow: 'hidden', borderRadius: '8px', willChange: 'transform'}}>
          <iframe
            loading="lazy"
            style={{position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, border: 'none', padding: 0, margin: 0}}
            src="https://www.canva.com/design/DAGtL_JDERI/28XwgwUu8uvKiqy51eLDjA/view?embed"
            allowFullScreen={true}
            allow="fullscreen"
            title="Bakery Gallery Canva Moodboard"
          ></iframe>
        </div>
      </div>
    </div>
  );
} 