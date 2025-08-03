'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect, useState, useRef } from 'react';
import CateringForm from './CateringForm';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { subscribeToNewsletter } from '../lib/newsletter';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  bgColor: string;
  textColor: string;
  accentColor: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "LET'S GET",
    subtitle: "SOUR",
    description: "Handcrafted sourdough treats made with love",
    image: "/hero/muffins.png",
    bgColor: "from-cream via-soft-peach to-warm-beige",
    textColor: "text-white",
    accentColor: "text-soft-green"
  },
  {
    id: 2,
    title: "ARTISAN",
    subtitle: "TREATS",
    description: "Crispy, chewy perfection in every bite",
    image: "/hero/brownies.png",
    bgColor: "from-warm-white via-golden-sand to-soft-peach",
    textColor: "text-white",
    accentColor: "text-soft-green"
  },
  {
    id: 3,
    title: "FRESH",
    subtitle: "LOAVES",
    description: "Daily baked sourdough bread with that perfect crust",
    image: "/hero/loaf.jpg", 
    bgColor: "from-mint-cream via-soft-peach to-warm-beige",
    textColor: "text-white",
    accentColor: "text-soft-green"
  },
  {
    id: 4,
    title: "GOLDEN",
    subtitle: "BAGELS",
    description: "New York style bagels with sourdough twist",
    image: "/hero/bagels.png",
    bgColor: "from-golden-sand via-warm-beige to-soft-peach", 
    textColor: "text-white",
    accentColor: "text-soft-green"
  }
];

const getButtonColors = (accentColor: string) => {
  const colorMap = {
    'text-soft-green': { primary: 'bg-soft-green hover:bg-nature-green', secondary: 'border-soft-green hover:border-nature-green' }
  };
  return colorMap[accentColor as keyof typeof colorMap] || colorMap['text-soft-green'];
};

export default function HeroSection() {
  const { toggleCart } = useCart();
  const [showCateringForm, setShowCateringForm] = useState(false);
  const [showCateringPopup, setShowCateringPopup] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const newsletterFormRef = useRef<HTMLFormElement>(null);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setCurrentSlide(index);
    setTimeout(() => setIsAnimating(false), 500);
  };

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  // Handle newsletter subscription
  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmittingNewsletter(true);
    setNewsletterStatus(null);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      
      if (!email) {
        throw new Error('Email is required');
      }

      await subscribeToNewsletter(email);
      setNewsletterStatus('success');
      if (newsletterFormRef.current) {
        newsletterFormRef.current.reset();
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setNewsletterStatus(null), 3000);
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      if (error.message.includes('already subscribed')) {
        setNewsletterStatus('already_subscribed');
      } else {
        setNewsletterStatus('error');
      }
      
      // Clear error message after 5 seconds
      setTimeout(() => setNewsletterStatus(null), 5000);
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  const currentSlideData = slides[currentSlide];
  const buttonColors = getButtonColors(currentSlideData.accentColor);

  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden pt-24 sm:pt-42 md:pt-24 lg:pt-20"
    >
      {/* Full background image */}
      <div className="absolute inset-0">
        <img 
          src={currentSlideData.image}
          alt={`${currentSlideData.subtitle} background`}
          className="w-full h-full object-cover hero-bg-image transition-all duration-1000 ease-out"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 transition-all duration-1000 ease-out"></div>
      </div>

      {/* Slider Container */}
      <div className="relative z-10 h-screen flex items-end pb-32">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Slide Content - Mobile First Design */}
          <div className="flex flex-col items-center text-center space-y-8 lg:grid lg:grid-cols-2 lg:gap-16 lg:text-left min-h-[80vh]">
            
              {/* Hero Text - Always First */}
              <div className="space-y-6 lg:order-1">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-white transition-colors duration-700 drop-shadow-2xl">
                  <span className="block text-soft-green font-vintage tracking-wide drop-shadow-lg">
                    {currentSlideData.title}
                  </span>
                  <span className="block text-light-green font-vintage tracking-wide drop-shadow-lg">
                    {currentSlideData.subtitle}
                  </span>
                </h1>
                <p className="text-lg sm:text-xl lg:text-2xl text-white font-serif leading-relaxed max-w-2xl mx-auto lg:mx-0 drop-shadow-lg">
                  {currentSlideData.description}
                </p>
              </div>

              {/* Buttons Only */}
              <div className="w-full flex justify-center lg:justify-start lg:order-2">
                <div className="flex gap-3 justify-center lg:justify-start">
                  <a 
                    href="#products"
                    className="px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 bg-soft-green hover:bg-nature-green text-white shadow-lg hover:shadow-xl"
                  >
                    View Menu
                  </a>
                  <button
                    onClick={() => setShowCateringForm(true)}
                    className="px-6 py-3 rounded-xl font-semibold text-center transition-all duration-300 bg-sage-green hover:bg-forest-green text-white shadow-lg hover:shadow-xl"
                  >
                    Catering
                  </button>
                </div>
              </div>
          </div>

          {/* Email Newsletter Section - Positioned near bottom */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
            <form ref={newsletterFormRef} className="relative" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                name="email"
                placeholder="Enter email to join our newsletter"
                required
                disabled={isSubmittingNewsletter}
                className="w-full px-4 py-3 pr-32 bg-white/95 border-2 border-white/50 rounded-xl text-deep-green placeholder-moss-green/70 focus:outline-none focus:border-sage-green backdrop-blur-sm shadow-lg disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={isSubmittingNewsletter}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-sage-green text-white rounded-lg font-semibold hover:bg-forest-green transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmittingNewsletter ? 'Saving...' : 'Subscribe'}
              </button>
            </form>
            
            {/* Newsletter Status Messages */}
            {newsletterStatus && (
              <div className={`mt-2 p-2 rounded-lg text-sm text-center ${
                newsletterStatus === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : newsletterStatus === 'already_subscribed'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {newsletterStatus === 'success' && '✅ Successfully subscribed to newsletter!'}
                {newsletterStatus === 'already_subscribed' && '📧 Email already subscribed'}
                {newsletterStatus === 'error' && '❌ Subscription failed. Please try again.'}
              </div>
            )}
          </div>

          {/* Slide Indicators - Clean and Minimal */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex space-x-3 bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-soft-green scale-125 shadow-lg'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  disabled={isAnimating}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Modern Navigation Arrows - Hidden on mobile */}
          <button
            onClick={prevSlide}
            className="nav-arrow hidden lg:block absolute left-4 lg:left-6 top-[60%] lg:top-1/2 -translate-y-1/2 p-3 lg:p-4 rounded-2xl bg-gray-900/20 hover:bg-gray-900/30 text-white transition-all duration-500 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-110 border border-white/10 z-20"
            disabled={isAnimating}
          >
            <FaChevronLeft size={16} className="lg:w-5 lg:h-5" />
          </button>
          
          <button
            onClick={nextSlide}
            className="nav-arrow hidden lg:block absolute right-4 lg:right-6 top-[60%] lg:top-1/2 -translate-y-1/2 p-3 lg:p-4 rounded-2xl bg-gray-900/20 hover:bg-gray-900/30 text-white transition-all duration-500 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-110 border border-white/10 z-20"
            disabled={isAnimating}
          >
            <FaChevronRight size={16} className="lg:w-5 lg:h-5" />
          </button>

        </div>
      </div>

      {/* Catering Form Modal */}
      {showCateringForm && <CateringForm onClose={() => setShowCateringForm(false)} />}
      {showCateringPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCateringPopup(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-3xl font-bold focus:outline-none w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full"
              onClick={() => setShowCateringPopup(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-600">Pre Orders</h2>
            <p className="text-gray-600 mb-6">Pre-orders are coming soon! We are working on a workflow to make it easy for you to reserve your favorite bakes in advance.</p>
            <p className="text-gray-600 text-sm mt-8">For special event cookie inquiries please contact <a href="mailto:sourthebakeryllc@gmail.com" className="underline text-terracotta">sourthebakeryllc@gmail.com</a></p>
          </div>
        </div>
      )}

      {/* Modern Slider Styles */}
      <style jsx>{`
        .font-vintage {
          font-family: var(--font-vintage), Georgia, serif;
        }
        
        /* Modern slide animations */
        @keyframes slideInRight {
          0% { 
            opacity: 0;
            transform: translateX(100px);
          }
          100% { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInLeft {
          0% { 
            opacity: 0;
            transform: translateX(-100px);
          }
          100% { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes fadeInUp {
          0% { 
            opacity: 0;
            transform: translateY(50px);
          }
          100% { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(1);
          }
          50% { 
            transform: scale(1.05);
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px);
          }
          50% { 
            transform: translateY(-20px);
          }
        }
        
        /* Text entrance animation */
        .slide-text {
          animation: slideInLeft 0.8s ease-out;
        }
        
        /* Image entrance animation */
        .slide-image {
          animation: slideInRight 0.8s ease-out;
        }
        
        /* Floating animation for images */
        .float-animation {
          animation: float 4s ease-in-out infinite;
        }
        
        /* Button hover effects */
        .modern-btn {
          position: relative;
          overflow: hidden;
        }
        
        .modern-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }
        
        .modern-btn:hover::before {
          left: 100%;
        }
        
        /* Gradient text effect */
        .gradient-text {
          background: linear-gradient(135deg, currentColor 0%, currentColor 100%);
          -webkit-background-clip: text;
          background-clip: text;
        }
        
        /* Glass morphism effect for buttons */
        .glass-btn {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        /* Slide indicators animation */
        @keyframes indicatorPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .active-indicator {
          animation: indicatorPulse 0.3s ease-out;
        }
        
        /* Navigation arrows hover effect */
        .nav-arrow:hover {
          transform: scale(1.1);
        }
        
        /* Modern background animations */
        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.08;
            transform: scale(1);
          }
          50% { 
            opacity: 0.12;
            transform: scale(1.02);
          }
        }
        
        @keyframes float-gentle {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) scale(1);
          }
          33% { 
            transform: translateY(-8px) translateX(4px) scale(1.01);
          }
          66% { 
            transform: translateY(4px) translateX(-6px) scale(0.99);
          }
        }
        
        @keyframes drift-1 {
          0%, 100% { 
            transform: translate(0, 0);
          }
          25% { 
            transform: translate(6px, -8px);
          }
          50% { 
            transform: translate(-4px, -12px);
          }
          75% { 
            transform: translate(8px, -4px);
          }
        }
        
        @keyframes drift-2 {
          0%, 100% { 
            transform: translate(0, 0);
          }
          50% { 
            transform: translate(-10px, 6px);
          }
        }
        
        @keyframes pulse-gentle {
          0%, 100% { 
            opacity: 0.2;
          }
          50% { 
            opacity: 0.3;
          }
        }
        
        @keyframes float-soft {
          0%, 100% { 
            transform: translateY(0px);
          }
          50% { 
            transform: translateY(-6px);
          }
        }
        
        @keyframes drift-gentle {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
          }
          33% { 
            transform: translate(2px, -3px) scale(1.1);
          }
          66% { 
            transform: translate(-2px, 2px) scale(0.9);
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        
        .animate-float-gentle {
          animation: float-gentle 8s ease-in-out infinite;
        }
        
        .animate-drift-1 {
          animation: drift-1 10s ease-in-out infinite;
        }
        
        .animate-drift-2 {
          animation: drift-2 12s ease-in-out infinite;
        }
        
        .animate-pulse-gentle {
          animation: pulse-gentle 4s ease-in-out infinite;
        }
        
        .animate-float-soft {
          animation: float-soft 6s ease-in-out infinite;
        }
        
        .animate-drift-gentle {
          animation: drift-gentle 8s ease-in-out infinite;
        }
        
        /* Responsive background image scaling */
        .hero-bg-image {
          object-position: center center;
        }
        
        /* Mobile and small screens - keep current behavior */
        @media (max-width: 768px) {
          .hero-bg-image {
            object-fit: cover;
            transform: scale(1);
          }
        }
        
        /* Large screens - reduce zoom/scale for better fit */
        @media (min-width: 769px) {
          .hero-bg-image {
            object-fit: cover;
            transform: scale(0.85);
            object-position: center center;
          }
        }
        
        /* Extra large screens - even less zoom */
        @media (min-width: 1200px) {
          .hero-bg-image {
            object-fit: cover;
            transform: scale(0.75);
            object-position: center center;
          }
        }
        
        /* Ultra wide screens */
        @media (min-width: 1600px) {
          .hero-bg-image {
            object-fit: cover;
            transform: scale(0.7);
            object-position: center center;
          }
        }

        /* Responsive text scaling */
        @media (max-width: 640px) {
          .responsive-title {
            font-size: clamp(3rem, 8vw, 4rem);
          }
        }
        
        @media (min-width: 641px) and (max-width: 1024px) {
          .responsive-title {
            font-size: clamp(4rem, 10vw, 6rem);
          }
        }
        
        @media (min-width: 1025px) {
          .responsive-title {
            font-size: clamp(6rem, 12vw, 8rem);
          }
        }
      `}</style>
    </section>
  );
} 