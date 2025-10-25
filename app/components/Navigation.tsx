'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { GiShoppingCart } from "react-icons/gi";
import Image from 'next/image';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toggleCart, getTotalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 w-full z-50 shadow-lg"
      style={{ backgroundColor: 'var(--cream)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-20 md:h-20">
          <div className="flex items-center">
            <Image
              src="/logo2.PNG"
              alt="Sour The Bakery Logo"
              width={300}
              height={300}
              className="h-24 sm:h-20 md:h-40 lg:h-36 w-auto"
              priority
            />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-deep-green hover:text-sage-green transition-colors">Home</a>
            <a href="#products" className="text-deep-green hover:text-sage-green transition-colors">Menu</a>
            <a href="#recipes" className="text-deep-green hover:text-sage-green transition-colors">Recipes</a>
            <a href="#about" className="text-deep-green hover:text-sage-green transition-colors">About</a>
            <a href="#contact" className="text-deep-green hover:text-sage-green transition-colors">Contact</a>

            {/* Cart Icon */}
            <button
              onClick={toggleCart}
              className="relative text-deep-green hover:text-sage-green transition-colors cursor-pointer"
            >
              <GiShoppingCart size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-sage-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            {/* Cart Icon for Mobile */}
            <button
              onClick={toggleCart}
              className="relative text-deep-green hover:text-sage-green transition-colors cursor-pointer"
            >
              <GiShoppingCart size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-sage-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {getTotalItems()}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-deep-green hover:text-sage-green transition-colors cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <>
          {/* Backdrop/Overlay */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Mobile Menu */}
          <div className="relative z-50 md:hidden border-t border-muted transition-all duration-300" style={{ backgroundColor: 'var(--cream)' }}>
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="/"
                className="block px-3 py-2 text-deep-green hover:text-sage-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#products"
                className="block px-3 py-2 text-deep-green hover:text-sage-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Menu
              </a>
              <a
                href="#recipes"
                className="block px-3 py-2 text-deep-green hover:text-sage-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Recipes
              </a>
              <a
                href="#about"
                className="block px-3 py-2 text-deep-green hover:text-sage-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#contact"
                className="block px-3 py-2 text-deep-green hover:text-sage-green transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
            </div>
          </div>
        </>
      )}
    </nav>
  );
} 