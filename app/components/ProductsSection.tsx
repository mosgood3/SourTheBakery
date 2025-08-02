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
    <section id="products" className="py-32 bg-gradient-to-b from-cream via-soft-peach to-warm-beige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Modern Section Header */}
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-6xl font-bold text-rich-brown mb-8 heading-shadow">
            Our Menu
          </h2>
          <p className="text-xl md:text-2xl text-warm-brown opacity-90 max-w-3xl mx-auto leading-relaxed">
            Discover our handcrafted selection of artisanal sourdough treats, baked fresh with love and traditional techniques
          </p>
        </div>

        {/* Modern Product Carousel - Small/Medium Screens */}
        <div className="md:hidden flex items-center justify-center relative w-full h-[600px] sm:h-[700px] mb-20">
          <div className="relative w-full max-w-[650px] h-full perspective-1000">
            {/* Elegant Navigation Arrows */}
            <button
              onClick={() => setCurrentProduct((prev) => (prev - 1 + products.length) % products.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-110 border border-warm-beige text-rich-brown"
              aria-label="Previous product"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentProduct((prev) => (prev + 1) % products.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-110 border border-warm-beige text-rich-brown"
              aria-label="Next product"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      {/* Modern Product Card */}
                      <div className="card-modern bg-white/95 backdrop-blur-md rounded-3xl p-12 shadow-2xl border border-warm-beige transform hover:scale-105 transition-all duration-500">
                        
                        <div className="text-center">
                          {/* Product Image */}
                          <div className="relative w-64 h-64 mx-auto mb-8">
                            <div className="absolute -inset-4 bg-gradient-to-r from-terracotta/10 to-cinnamon/10 rounded-3xl blur-lg"></div>
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-contain rounded-3xl relative"
                              priority={isActive}
                            />
                          </div>
                          
                          {/* Product Info */}
                          <h3 className="text-3xl font-bold text-rich-brown mb-3 heading-shadow">
                            {product.name}
                          </h3>
                          <p className="text-2xl text-terracotta font-semibold mb-3">
                            ${parseFloat(product.price).toFixed(2)}
                          </p>
                          <p className="text-warm-brown opacity-90 text-xl mb-10 leading-relaxed">
                            {product.description}
                          </p>
                                                  
                          {/* Modern Add to Cart Button */}
                          {product.weeklyAmountRemaining !== undefined && product.weeklyAmountRemaining <= 0 ? (
                            <div className="bg-red-50 text-red-700 px-10 py-5 rounded-2xl text-lg font-semibold border-2 border-red-200">
                              Sold Out
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart();
                              }}
                              className="bg-terracotta text-white px-10 py-5 rounded-2xl text-lg font-semibold hover:bg-warm-brown transition-all duration-500 cursor-pointer shadow-xl hover:shadow-2xl transform hover:scale-105"
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
            
            {/* Modern Navigation Dots */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3 bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3 border border-white/30">
              {products.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentProduct(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-500 cursor-pointer ${
                    index === currentProduct 
                      ? 'bg-terracotta scale-150 shadow-lg' 
                      : 'bg-warm-brown/40 hover:bg-warm-brown/70 hover:scale-125'
                  }`}
                />
              ))}
            </div>
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
                  className="flex-shrink-0 w-96 card-modern bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-warm-beige transition-all duration-500 cursor-pointer relative group"
                  onClick={() => handleAddToCart()}
                >
                  
                  <div className="text-center">
                    {/* Product Image with modern styling */}
                    <div className="relative w-56 h-56 mx-auto mb-8">
                      <div className="absolute -inset-3 bg-gradient-to-r from-terracotta/5 via-cinnamon/10 to-golden-sand/5 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain rounded-3xl relative transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    
                    {/* Product Info */}
                    <h3 className="text-2xl font-bold text-rich-brown mb-2 heading-shadow">
                      {product.name}
                    </h3>
                    <p className="text-xl text-terracotta font-semibold mb-2">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                    <p className="text-warm-brown opacity-90 text-lg mb-8 leading-relaxed">
                      {product.description}
                    </p>
                                        
                    {/* Modern Add to Cart Button */}
                    {product.weeklyAmountRemaining !== undefined && product.weeklyAmountRemaining <= 0 ? (
                      <div className="bg-red-50 text-red-700 px-8 py-4 rounded-2xl text-base font-semibold border-2 border-red-200">
                        Sold Out
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart();
                        }}
                        className="bg-terracotta text-white px-8 py-4 rounded-2xl text-base font-semibold hover:bg-warm-brown transition-all duration-500 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Modern Scroll Indicators */}
            <div className="flex justify-center mt-8">
              <div className="flex items-center space-x-3 text-warm-brown/70 bg-white/30 backdrop-blur-sm rounded-2xl px-6 py-3 border border-warm-beige/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm font-medium">Scroll to explore our treats</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Call to Action */}
        <div className="text-center">
          <div className="card-modern bg-white/80 backdrop-blur-md rounded-3xl p-16 max-w-5xl mx-auto border border-warm-beige shadow-2xl">
            <h3 className="text-4xl md:text-5xl font-bold text-rich-brown mb-6 heading-shadow">
              Visit Our Farm Stand
            </h3>
            <p className="text-xl md:text-2xl text-warm-brown opacity-90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Experience the warmth and aroma of our freshly baked goods in person. Come see where the magic happens!
            </p>
            <a
              href="https://maps.google.com/?q=12+Gaylord+Drive+Rocky+Hill+CT+06111"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-terracotta text-white px-12 py-6 rounded-2xl text-xl font-semibold hover:bg-warm-brown transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-3xl cursor-pointer"
            >
              <span>Get Directions</span>
              <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
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
    <div className="mt-32 px-4 py-20 bg-gradient-to-t from-warm-beige to-soft-peach">
      <div className="text-center mb-16">
        <h3 className="text-4xl md:text-5xl font-bold text-rich-brown mb-6 heading-shadow">
          Our Handcrafted Creations
        </h3>
        <p className="text-warm-brown/80 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
          A glimpse into our artisanal sourdough process and the beautiful breads we craft daily
        </p>
      </div>
      
      {/* Modern Photo Collage Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Featured large image */}
          <div className="col-span-2 row-span-2 relative group overflow-hidden rounded-3xl shadow-2xl">
            <Image
              src={images[0].src}
              alt={images[0].alt}
              width={600}
              height={600}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rich-brown/20 via-transparent to-terracotta/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-3xl"></div>
          </div>
          
          {/* Medium images */}
          <div className="relative group overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={images[1].src}
              alt={images[1].alt}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
          </div>
          
          <div className="relative group overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={images[2].src}
              alt={images[2].alt}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
          </div>
          
          <div className="relative group overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={images[3].src}
              alt={images[3].alt}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
          </div>
          
          <div className="relative group overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={images[4].src}
              alt={images[4].alt}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
          </div>
          
          {/* Tall image */}
          <div className="row-span-2 relative group overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={images[5].src}
              alt={images[5].alt}
              width={300}
              height={600}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-warm-brown/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
          </div>
          
          <div className="relative group overflow-hidden rounded-xl shadow-md">
            <Image
              src={images[6].src}
              alt={images[6].alt}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          
          <div className="relative group overflow-hidden rounded-xl shadow-md">
            <Image
              src={images[7].src}
              alt={images[7].alt}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          
          <div className="relative group overflow-hidden rounded-xl shadow-md">
            <Image
              src={images[8].src}
              alt={images[8].alt}
              width={300}
              height={300}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          
        </div>
        
        {/* Bottom section - Images 9 and 11 side by side, Image 10 full width */}
        <div className="mt-3 md:mt-4 space-y-3 md:space-y-4">
          {/* Images 9 and 11 side by side */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="relative group overflow-hidden rounded-xl shadow-md">
              <Image
                src={images[8].src}
                alt={images[8].alt}
                width={300}
                height={300}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brown/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            
            <div className="relative group overflow-hidden rounded-xl shadow-md">
              <Image
                src={images[10].src}
                alt={images[10].alt}
                width={300}
                height={300}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brown/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          </div>
          
          {/* Image 10 full width */}
          <div className="relative group overflow-hidden rounded-xl shadow-md">
            <Image
              src={images[9].src}
              alt={images[9].alt}
              width={1200}
              height={400}
              className="w-full h-48 md:h-64 lg:h-80 object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brown/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
} 