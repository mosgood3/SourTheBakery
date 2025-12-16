'use client';

import { useState, useCallback } from 'react';
import Navigation from './components/Navigation';
import HeroSection from './components/HeroSection';
import PickupsSection from './components/PickupsSection';
import AboutSection from './components/AboutSection';
import Footer from './components/Footer';
import Cart from './components/Cart';
import NotificationBanner from './components/NotificationBanner';

export default function Home() {
  const [productRefreshTrigger, setProductRefreshTrigger] = useState(0);

  const handleOrderSuccess = useCallback(() => {
    // Trigger product refresh by incrementing the trigger value
    setProductRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <NotificationBanner />
      <Cart onOrderSuccess={handleOrderSuccess} />
      <HeroSection />
      <PickupsSection />
      <AboutSection />
      <Footer />
    </div>
  );
}
