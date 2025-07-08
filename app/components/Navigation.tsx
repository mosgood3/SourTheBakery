'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { GiShoppingCart } from "react-icons/gi";
import { FaTiktok, FaInstagram } from 'react-icons/fa';
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
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : ''}`}
      style={scrolled ? { backgroundColor: 'var(--peach)' } : { backgroundColor: 'transparent' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center">
            <Image
              src="/logo2.PNG"
              alt="Sour The Bakery Logo"
              width={300}
              height={300}
              className="h-36 mt-4 w-auto"
              priority
            />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#home" className="text-brown hover:text-accent-gold transition-colors">Home</a>
            <a href="#menu" className="text-brown hover:text-accent-gold transition-colors">Menu</a>
            <a href="#about" className="text-brown hover:text-accent-gold transition-colors">About</a>
            <a href="#contact" className="text-brown hover:text-accent-gold transition-colors">Contact</a>
            
            {/* Social Media Icons */}
            <div className="flex items-center space-x-4">
              <a href="https://www.tiktok.com/@sourthebakery" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-black hover:scale-110 transition-all duration-300">
                <FaTiktok size={20} />
              </a>
              <a href="https://www.instagram.com/sourthebakery/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-pink-600 hover:scale-110 transition-all duration-300">
                <FaInstagram size={20} />
              </a>
            </div>
            
            {/* Cart Icon */}
            <button
              onClick={toggleCart}
              className="relative text-brown hover:text-accent-gold transition-colors cursor-pointer"
            >
              <GiShoppingCart size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent-gold text-brown text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
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
              className="relative text-brown hover:text-accent-gold transition-colors cursor-pointer"
            >
              <GiShoppingCart size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent-gold text-brown text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {getTotalItems()}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-brown hover:text-accent-gold transition-colors cursor-pointer"
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
        <div className="md:hidden border-t border-muted transition-all duration-300" style={{ backgroundColor: 'var(--peach)' }}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a href="#home" className="block px-3 py-2 text-brown hover:text-accent-gold transition-colors">Home</a>
            <a href="#menu" className="block px-3 py-2 text-brown hover:text-accent-gold transition-colors">Menu</a>
            <a href="#about" className="block px-3 py-2 text-brown hover:text-accent-gold transition-colors">About</a>
            <a href="#contact" className="block px-3 py-2 text-brown hover:text-accent-gold transition-colors">Contact</a>
            
            {/* Social Media Icons for Mobile */}
            <div className="flex items-center space-x-6 px-3 py-4 border-t border-muted mt-4">
              <a href="https://www.tiktok.com/@sourthebakery" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-black hover:scale-110 transition-all duration-300">
                <FaTiktok size={24} />
              </a>
              <a href="https://www.instagram.com/sourthebakery/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-pink-600 hover:scale-110 transition-all duration-300">
                <FaInstagram size={24} />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 