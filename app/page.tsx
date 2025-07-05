'use client';

import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import ProductsSection from './components/ProductsSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import Cart from './components/Cart';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Cart />
      <HeroSection />
      <ProductsSection />
      <AboutSection />
      <Footer />
    </div>
  );
}
