'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function ProductsSection() {
  const { addItem } = useCart();
  const [currentProduct, setCurrentProduct] = useState(0);

  const products = [
    {
      id: 1,
      name: "Sourdough Bread",
      image: "/heroloaf.PNG",
      emoji: "🍞",
      description: "Artisanal sourdough",
      price: "$6.50"
    },
    {
      id: 2,
      name: "Brownies",
      image: "/herobrownie.PNG", 
      emoji: "🍫",
      description: "Fudgy chocolate brownies",
      price: "$4.50"
    },
    {
      id: 3,
      name: "Cookies",
      image: "/cookies.jpg",
      emoji: "🍪",
      description: "Fresh baked cookies",
      price: "$3.50"
    }
  ];

  const handleAddToCart = (product: typeof products[0]) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
    });
  };

  return (
    <section id="products" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6">
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
                          <div className="text-7xl mb-6">{product.emoji}</div>
                          <h3 className="text-3xl font-serif font-bold text-brown mb-4">
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
                  className="flex-shrink-0 w-80 bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20 transform hover:scale-105 transition-all duration-300 cursor-pointer"
                  style={{backgroundColor: 'rgba(255, 248, 225, 0.95)'}}
                  onClick={() => handleAddToCart(product)}
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
                    <div className="text-6xl mb-4">{product.emoji}</div>
                    <h3 className="text-2xl font-serif font-bold text-brown mb-3">
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
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
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