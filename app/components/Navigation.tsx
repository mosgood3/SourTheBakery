'use client';

import { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { GiShoppingCart } from "react-icons/gi";
import Image from 'next/image';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toggleCart, getTotalItems } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);

      // Track active section
      const sections = ['menu', 'recipes', 'about', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      setActiveSection(current || '');
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 bg-warm-cream ${
        scrolled
          ? 'shadow-lg border-b border-sage-green/20'
          : 'shadow-md'
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(232, 213, 183, 0.1) 0%, transparent 50%)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 sm:h-20 md:h-20">
          <div className="flex items-center">
            <a href="/" className="transition-transform duration-300 hover:scale-105">
              <Image
                src="/logo2.PNG"
                alt="Sour The Bakery Logo"
                width={300}
                height={300}
                className="h-24 sm:h-20 md:h-40 lg:h-36 w-auto drop-shadow-sm"
                priority
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/" active={activeSection === ''}>Home</NavLink>
            <NavLink href="#menu" active={activeSection === 'menu'}>Order</NavLink>
            <NavLink href="#recipes" active={activeSection === 'recipes'}>Recipes</NavLink>
            <NavLink href="#about" active={activeSection === 'about'}>About</NavLink>
            <NavLink href="#contact" active={activeSection === 'contact'}>Contact</NavLink>

            {/* Cart Icon */}
            <button
              onClick={toggleCart}
              className="relative ml-4 text-deep-green hover:text-sage-green transition-all duration-300 hover:scale-110 cursor-pointer p-2"
              aria-label="Shopping Cart"
            >
              <GiShoppingCart size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-sage-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-md animate-pulse">
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
              className="relative text-deep-green hover:text-sage-green transition-all duration-300 cursor-pointer p-2"
              aria-label="Shopping Cart"
            >
              <GiShoppingCart size={24} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-sage-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold shadow-md">
                  {getTotalItems()}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-deep-green hover:text-sage-green transition-all duration-300 cursor-pointer p-2"
              aria-label="Menu"
            >
              <svg
                className={`h-6 w-6 transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Decorative border */}
      <div className="h-px bg-gradient-to-r from-transparent via-sage-green/30 to-transparent" />

      {/* Mobile backdrop overlay - rendered first so menu appears above it */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 top-20 bg-black/20 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out relative z-10 ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="bg-warm-cream border-b border-sage-green/20"
          style={{
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(232, 213, 183, 0.1) 0%, transparent 50%)'
          }}
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            <MobileNavLink
              href="/"
              onClick={() => setIsMenuOpen(false)}
              active={activeSection === ''}
            >
              Home
            </MobileNavLink>
            <MobileNavLink
              href="#menu"
              onClick={() => setIsMenuOpen(false)}
              active={activeSection === 'menu'}
            >
              Order
            </MobileNavLink>
            <MobileNavLink
              href="#recipes"
              onClick={() => setIsMenuOpen(false)}
              active={activeSection === 'recipes'}
            >
              Recipes
            </MobileNavLink>
            <MobileNavLink
              href="#about"
              onClick={() => setIsMenuOpen(false)}
              active={activeSection === 'about'}
            >
              About
            </MobileNavLink>
            <MobileNavLink
              href="#contact"
              onClick={() => setIsMenuOpen(false)}
              active={activeSection === 'contact'}
            >
              Contact
            </MobileNavLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Desktop Nav Link Component
function NavLink({
  href,
  children,
  active
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`relative px-4 py-2 font-medium transition-all duration-300 group ${
        active ? 'text-sage-green' : 'text-deep-green hover:text-sage-green'
      }`}
    >
      <span className="relative z-10">{children}</span>

      {/* Hover background */}
      <span className="absolute inset-0 rounded-lg bg-sage-green/10 scale-0 group-hover:scale-100 transition-transform duration-300" />

      {/* Underline animation */}
      <span className={`absolute bottom-1 left-4 right-4 h-0.5 bg-sage-green transition-all duration-300 ${
        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`} />
    </a>
  );
}

// Mobile Nav Link Component
function MobileNavLink({
  href,
  children,
  onClick,
  active
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`block px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
        active
          ? 'text-sage-green bg-sage-green/10 border-l-4 border-sage-green'
          : 'text-deep-green hover:text-sage-green hover:bg-sage-green/5 border-l-4 border-transparent'
      }`}
    >
      {children}
    </a>
  );
} 