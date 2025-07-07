'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getProducts, Product } from '../lib/products';

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
              Our Products
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
              Our Products
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
              Our Products
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
            Our Products
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            className="bg-accent-gold text-brown px-8 py-4 rounded-full text-lg font-semibold hover:bg-accent-gold/90 transition-colors duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            Add to Cart
                          </button>
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
            <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide max-w-6xl">
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                      className="bg-accent-gold text-brown px-6 py-3 rounded-full text-base font-semibold hover:bg-accent-gold/90 transition-colors duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Add to Cart
                    </button>
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
              Ready to Order?
            </h3>
            <p className="text-xl text-muted-foreground mb-8">
              Browse our full menu and place your order for pickup or delivery.
            </p>
            <button 
              onClick={() => handleAddToCart(products[currentProduct])}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-semibold hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 shadow-xl cursor-pointer"
            >
              View Full Menu
            </button>
          </div>
        </div>
      </div>
    </section>
  );
} 