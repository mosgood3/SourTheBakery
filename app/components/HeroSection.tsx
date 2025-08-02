'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect, useState } from 'react';
import CateringForm from './CateringForm';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
    image: "/collage/sour1.jpg",
    bgColor: "from-cream via-soft-peach to-warm-beige",
    textColor: "text-rich-brown",
    accentColor: "text-terracotta"
  },
  {
    id: 2,
    title: "ARTISAN",
    subtitle: "COOKIES",
    description: "Crispy, chewy perfection in every bite",
    image: "/collage/sour3.jpg",
    bgColor: "from-warm-white via-golden-sand to-soft-peach",
    textColor: "text-warm-brown",
    accentColor: "text-cinnamon"
  },
  {
    id: 3,
    title: "FRESH",
    subtitle: "LOAVES",
    description: "Daily baked sourdough bread with that perfect crust",
    image: "/collage/sour7.jpg", 
    bgColor: "from-mint-cream via-soft-peach to-warm-beige",
    textColor: "text-forest-green",
    accentColor: "text-sage-green"
  },
  {
    id: 4,
    title: "GOLDEN",
    subtitle: "BAGELS",
    description: "New York style bagels with sourdough twist",
    image: "/collage/sour5.jpg",
    bgColor: "from-golden-sand via-warm-beige to-soft-peach", 
    textColor: "text-rich-brown",
    accentColor: "text-terracotta"
  }
];

const getButtonColors = (accentColor: string) => {
  const colorMap = {
    'text-terracotta': { primary: 'bg-terracotta hover:bg-warm-brown', secondary: 'border-terracotta hover:border-warm-brown' },
    'text-cinnamon': { primary: 'bg-cinnamon hover:bg-warm-brown', secondary: 'border-cinnamon hover:border-warm-brown' },
    'text-sage-green': { primary: 'bg-sage-green hover:bg-forest-green', secondary: 'border-sage-green hover:border-forest-green' }
  };
  return colorMap[accentColor as keyof typeof colorMap] || colorMap['text-terracotta'];
};

export default function HeroSection() {
  const { toggleCart } = useCart();
  const [showCateringForm, setShowCateringForm] = useState(false);
  const [showCateringPopup, setShowCateringPopup] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

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

  const currentSlideData = slides[currentSlide];
  const buttonColors = getButtonColors(currentSlideData.accentColor);

  return (
    <section
      id="home"
      className="relative min-h-screen overflow-hidden pt-20 md:pt-16 lg:pt-12"
    >
      {/* Modern gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentSlideData.bgColor} transition-all duration-1000 ease-out`}>
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/3 via-transparent to-white/5"></div>
        
        {/* Modern organic shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large organic blob - top right */}
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-8 transition-all duration-1000 ${currentSlideData.accentColor.replace('text-', 'bg-')} blur-3xl animate-pulse-slow`}></div>
          
          {/* Medium organic shape - bottom left */}
          <div className={`absolute -bottom-32 -left-32 w-72 h-72 rounded-full opacity-6 transition-all duration-1000 ${currentSlideData.accentColor.replace('text-', 'bg-')} blur-2xl animate-float-gentle`}></div>
          
          {/* Small accent shapes */}
          <div className={`absolute top-1/3 left-1/5 w-24 h-24 rounded-full opacity-4 transition-all duration-1000 ${currentSlideData.accentColor.replace('text-', 'bg-')} blur-xl animate-drift-1`}></div>
          <div className={`absolute top-2/3 right-1/5 w-16 h-16 rounded-full opacity-5 transition-all duration-1000 ${currentSlideData.accentColor.replace('text-', 'bg-')} blur-lg animate-drift-2`}></div>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative z-10 h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Slide Content */}
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            
            {/* Text Content */}
            <div className="text-center lg:text-left space-y-10 slide-text">
              <div className="space-y-6">
                <h1 className={`responsive-title font-bold leading-tight ${currentSlideData.textColor} transition-colors duration-700 heading-shadow`}>
                  <span className={`block ${currentSlideData.accentColor} font-vintage tracking-wide`}>
                    {currentSlideData.title}
                  </span>
                  <span className="block font-vintage tracking-wide">
                    {currentSlideData.subtitle}
                  </span>
                </h1>
                <p className={`text-xl lg:text-2xl ${currentSlideData.textColor} opacity-90 font-serif leading-relaxed max-w-lg mx-auto lg:mx-0`}>
                  {currentSlideData.description}
                </p>
              </div>

              {/* Store Info - Only show on first slide */}
              {currentSlide === 0 && (
                <div className={`space-y-3 ${currentSlideData.textColor} opacity-90 card-modern p-6 bg-white/20 backdrop-blur-sm`}>
                  <p className="text-lg lg:text-xl font-semibold leading-relaxed">
                    Bakery stand every Sunday 9am - 1pm
                  </p>
                  <p className="text-base lg:text-lg leading-relaxed">
                    12 Gaylord Drive, Rocky Hill, CT 06067
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                <a 
                  href="#products"
                  className={`group modern-btn px-10 py-5 rounded-2xl font-semibold text-lg transition-all duration-500 transform hover:scale-105 shadow-xl ${buttonColors.primary} text-white hover:shadow-2xl backdrop-blur-sm`}
                >
                  <span className="flex items-center gap-2">
                    View Menu
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </a>
                <button
                  onClick={() => setShowCateringPopup(true)}
                  className={`group modern-btn px-10 py-5 rounded-2xl font-semibold text-lg border-2 transition-all duration-500 transform hover:scale-105 bg-white/80 hover:bg-white ${currentSlideData.textColor} ${buttonColors.secondary} shadow-xl hover:shadow-2xl backdrop-blur-sm`}
                >
                  <span className="flex items-center gap-2">
                    Pre Orders
                    <svg className="w-5 h-5 transform group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>

            {/* Image Content */}
            <div className="relative slide-image">
              <div className="relative group float-animation">
                {/* Modern backdrop with soft shadows */}
                <div className="absolute -inset-8 bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded-3xl transform rotate-2 group-hover:rotate-3 transition-all duration-700 blur-sm"></div>
                <div className="absolute -inset-4 bg-white/30 rounded-3xl transform -rotate-1 group-hover:rotate-1 transition-all duration-700"></div>
                
                <img 
                  src={currentSlideData.image}
                  alt={`${currentSlideData.subtitle} from Sour the Bakery`}
                  className="relative w-full max-w-lg mx-auto rounded-3xl shadow-2xl transition-all duration-700 transform group-hover:scale-105 group-hover:shadow-3xl"
                />
                
                {/* Modern floating accents */}
                <div className={`absolute -top-6 -right-6 w-16 h-16 ${currentSlideData.accentColor.replace('text-', 'bg-')} opacity-20 rounded-full blur-xl animate-pulse-gentle`}></div>
                <div className={`absolute -bottom-8 -left-8 w-20 h-20 ${currentSlideData.accentColor.replace('text-', 'bg-')} opacity-15 rounded-full blur-2xl animate-float-soft`}></div>
                <div className={`absolute top-4 right-4 w-6 h-6 ${currentSlideData.accentColor.replace('text-', 'bg-')} opacity-30 rounded-full animate-drift-gentle`}></div>
              </div>
            </div>
          </div>

          {/* Modern Navigation Arrows */}
          <button
            onClick={prevSlide}
            className={`nav-arrow absolute left-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-white/90 hover:bg-white ${currentSlideData.textColor} transition-all duration-500 backdrop-blur-md shadow-xl hover:shadow-2xl transform hover:scale-110 border border-white/20`}
            disabled={isAnimating}
          >
            <FaChevronLeft size={20} />
          </button>
          
          <button
            onClick={nextSlide}
            className={`nav-arrow absolute right-6 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-white/90 hover:bg-white ${currentSlideData.textColor} transition-all duration-500 backdrop-blur-md shadow-xl hover:shadow-2xl transform hover:scale-110 border border-white/20`}
            disabled={isAnimating}
          >
            <FaChevronRight size={20} />
          </button>

          {/* Modern Slide Indicators */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-3 bg-white/20 backdrop-blur-lg rounded-2xl px-8 py-4 border border-white/30 shadow-xl">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-500 shadow-md ${
                  index === currentSlide 
                    ? `${currentSlideData.accentColor.replace('text-', 'bg-')} scale-150 shadow-lg`
                    : 'bg-white/60 hover:bg-white/90 hover:scale-125'
                }`}
                disabled={isAnimating}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Catering Form Modal */}
      {showCateringForm && <CateringForm />}
      {showCateringPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='40' height='40' fill='%23fff8e1'/><ellipse cx='20' cy='20' rx='19' ry='19' fill='%23f7e1b5' fill-opacity='0.13'/><ellipse cx='10' cy='10' rx='6' ry='6' fill='%23d19a6d' fill-opacity='0.07'/><ellipse cx='30' cy='30' rx='7' ry='7' fill='%238b5b29' fill-opacity='0.04'/></svg>")`,
            backgroundSize: '120px 120px',
            backgroundBlendMode: 'multiply',
            backgroundColor: 'var(--peach)',
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center relative"
            style={{
              backgroundImage: `url("data:image/svg+xml;utf8,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='40' height='40' fill='%23fff8e1'/><ellipse cx='20' cy='20' rx='19' ry='19' fill='%23f7e1b5' fill-opacity='0.13'/><ellipse cx='10' cy='10' rx='6' ry='6' fill='%23d19a6d' fill-opacity='0.07'/><ellipse cx='30' cy='30' rx='7' ry='7' fill='%238b5b29' fill-opacity='0.04'/></svg>")`,
              backgroundSize: '120px 120px',
              backgroundBlendMode: 'multiply',
              backgroundColor: 'var(--background)',
            }}
          >
            <button
              className="absolute top-3 right-3 text-brown hover:text-accent-gold text-2xl focus:outline-none"
              onClick={() => setShowCateringPopup(false)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-brown">Pre Orders</h2>
            <p className="text-brown mb-6">Pre-orders are coming soon! We are working on a workflow to make it easy for you to reserve your favorite bakes in advance.</p>
            <p className="text-brown text-sm mt-8">For special event cookie inquiries please contact <a href="mailto:sourthebakeryllc@gmail.com" className="underline text-accent-gold">sourthebakeryllc@gmail.com</a></p>
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