'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getProducts, Product, isOrderWindowOpen } from '../lib/products';

export function PorchPickupSection() {
  return (
    <>
      <h3 className="mt-16 text-3xl md:text-4xl font-serif font-bold text-brown mb-4 text-center tracking-tight">Our schedule</h3>
      <div className="mt-0 mb-12 bg-muted/30 rounded-3xl border-2 border-accent-gold/40 p-6 px-8 lg:px-16 max-w-xl mx-auto shadow-xl">
        <div className="text-brown/90 text-lg font-bold text-center mb-4">
          <span role="img" aria-label="door">🚪</span> <span className="font-bold">Farm Stand Pickup Only:</span> All online orders are for farm stand pickup at 12 Gaylord Drive, Rocky Hill, CT.
        </div>
        {/* Responsive: vertical on small, horizontal on md+ */}
        <div className="flex flex-col md:grid md:grid-cols-5 gap-y-2 md:gap-x-2 items-center justify-items-center w-full">
          {/* Order Online */}
          <div className="flex flex-col items-center bg-white/90 border-2 border-accent-gold rounded-2xl px-4 py-4 min-w-[110px] shadow-md w-40 h-32">
            <span className="text-2xl">🛒</span>
            <span className="font-semibold text-brown text-base mt-1">Order Online</span>
            <span className="text-sm text-brown/70 mt-1">Mon 6am - Thu 5pm</span>
          </div>
          {/* Arrow */}
          <div className="my-1 md:my-0 md:col-start-2 flex items-center justify-center">
            <span className="text-2xl text-brown md:hidden">↓</span>
            <span className="text-2xl text-brown hidden md:inline">→</span>
          </div>
          {/* Baker Prepares */}
          <div className="flex flex-col items-center bg-white/90 border-2 border-accent-gold rounded-2xl px-4 py-4 min-w-[110px] shadow-md md:col-start-3 w-40 h-32">
            <span className="text-2xl">👩‍🍳</span>
            <span className="font-semibold text-brown text-base mt-1">Baker Prepares</span>
            <span className="text-sm text-brown/70 mt-1">Fri & Sat</span>
          </div>
          {/* Arrow */}
          <div className="my-1 md:my-0 md:col-start-4 flex items-center justify-center">
            <span className="text-2xl text-brown md:hidden">↓</span>
            <span className="text-2xl text-brown hidden md:inline">→</span>
          </div>
          {/* Porch Pickup */}
          <div className="flex flex-col items-center bg-white/90 border-2 border-accent-gold rounded-2xl px-4 py-4 min-w-[110px] shadow-md md:col-start-5 w-40 h-32">
            <span className="text-2xl">🏡</span>
            <span className="font-semibold text-brown text-base mt-1">Porch Pickup</span>
            <span className="text-sm text-brown/70 mt-1">Sun 9am-1pm</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ProductsSection() {
  const { addItem } = useCart();
  const [currentProduct, setCurrentProduct] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const handleAddToCart = (product: Product) => {
    if (!isOrderWindowOpen()) {
      alert('Orders are not available at this time. Order window is Monday 6am to Thursday 5pm.');
      return;
    }

    // Check if product is sold out
    if (product.weeklyAmountRemaining !== undefined && product.weeklyAmountRemaining <= 0) {
      alert(`${product.name} is sold out for this week.`);
      return;
    }
    
    addItem({
      id: product.id || '',
      name: product.name,
      price: product.price,
      description: product.description,
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
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Each item is carefully crafted using traditional techniques and the finest ingredients, just like Magnolia Bakery's approach to quality.
            </p>
          </div>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
            <p className="mt-4 text-brown/70">Loading products...</p>
          </div>
        </div>
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
            Each item is carefully crafted using traditional techniques and the finest ingredients, just like Magnolia Bakery's approach to quality.
          </p>
        </div>

        {/* 3D Rotating Product Showcase - Small/Medium Screens */}
        <div className="md:hidden flex items-center justify-center relative w-full h-[500px] sm:h-[600px] mb-16">
          <div className="relative w-full max-w-[600px] h-full perspective-1000">
            {/* Navigation Arrows */}
            <button
              onClick={() => setCurrentProduct((prev) => (prev - 1 + products.length) % products.length)}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-accent-gold/20"
              aria-label="Previous product"
            >
              <svg className="w-6 h-6 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={() => setCurrentProduct((prev) => (prev + 1) % products.length)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-accent-gold/20"
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
                        {/* Retro Bestseller Badge */}
                        {index === 0 && (
                          <div className="absolute -top-2 -right-2 transform rotate-12">
                            <div className="bg-gradient-to-r from-accent-gold to-yellow-400 text-brown px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-brown/20">
                              ★ Bestseller
                            </div>
                          </div>
                        )}
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
                          <h3 className="text-3xl font-bold text-brown mb-4">
                            {product.name}
                          </h3>
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
                                handleAddToCart(product);
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
            <div className="flex gap-8 overflow-visible pb-8 scrollbar-hide max-w-6xl">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-80 bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20 transform hover:scale-105 transition-all duration-300 cursor-pointer relative"
                  style={{backgroundColor: 'rgba(255, 248, 225, 0.95)'}}
                  onClick={() => handleAddToCart(product)}
                >
                  {/* Retro Bestseller Badge */}
                  {product.id === products[0]?.id && (
                    <div className="absolute -top-2 -right-2 transform rotate-12">
                      <div className="bg-gradient-to-r from-accent-gold to-yellow-400 text-brown px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-brown/20">
                        ★ Bestseller
                      </div>
                    </div>
                  )}
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
                    <h3 className="text-2xl font-bold text-brown mb-3">
                      {product.name}
                    </h3>
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
                          handleAddToCart(product);
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
    </section>
  );
} 