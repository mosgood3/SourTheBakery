'use client';

import { useEffect, useState, useRef } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { subscribeToNewsletter } from '../lib/newsletter-supabase';
import { getGalleryImages } from '../lib/storage-supabase';

// Default hero images
const defaultImages = [
  "/hero/muffins.png",
  "/hero/brownies.png",
  "/hero/loaf.jpg",
  "/hero/bagels.png"
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [images, setImages] = useState<string[]>(defaultImages);
  const [newsletterStatus, setNewsletterStatus] = useState<string | null>(null);
  const [isSubmittingNewsletter, setIsSubmittingNewsletter] = useState(false);
  const newsletterFormRef = useRef<HTMLFormElement>(null);

  // Fetch gallery images from Supabase
  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const galleryImages = await getGalleryImages();
        if (galleryImages && galleryImages.length > 0) {
          setImages(galleryImages);
        }
      } catch (error) {
        console.error('Failed to load gallery images:', error);
      }
    };

    fetchGalleryImages();
  }, []);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev + 1) % images.length);
    setTimeout(() => setIsAnimating(false), 500);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
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
  }, [isAnimating, images.length]);

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

      setTimeout(() => setNewsletterStatus(null), 3000);
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      if (error.message.includes('already subscribed')) {
        setNewsletterStatus('already_subscribed');
      } else {
        setNewsletterStatus('error');
      }

      setTimeout(() => setNewsletterStatus(null), 5000);
    } finally {
      setIsSubmittingNewsletter(false);
    }
  };

  return (
    <section id="home" className="relative min-h-screen overflow-hidden pt-20 bg-black">
      {/* Background Image Slideshow */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={image}
              alt="Bakery hero"
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start pt-32 md:justify-center md:pt-20 px-6 py-20">

        {/* Hero Title */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="hero-title">
            <div className="hero-line">
              <span className="hero-word">LET'S</span>
              <span className="hero-word-space"></span>
              <span className="hero-word">GET</span>
            </div>
            <div className="hero-line">
              <span className="hero-word">SOUR</span>
            </div>
          </h1>
          <p className="hero-subtitle">Handcrafted sourdough treats made with love</p>
        </div>

        {/* CTA Button */}
        <a
          href="#products"
          className="group relative px-10 py-5 bg-white text-deep-green text-lg font-bold rounded-full transition-all duration-300 shadow-2xl hover:shadow-sage-green/50 hover:scale-105 overflow-hidden"
        >
          <span className="relative z-10">Explore Menu</span>
          <div className="absolute inset-0 bg-sage-green transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          <span className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold">
            Explore Menu
          </span>
        </a>

        {/* Newsletter Signup */}
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-lg px-6">
          <form ref={newsletterFormRef} className="relative group" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Join our newsletter"
              required
              disabled={isSubmittingNewsletter}
              className="w-full px-4 py-4 pr-28 md:pr-36 md:px-6 bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full text-white placeholder-white/60 focus:outline-none focus:border-white/60 focus:bg-white/20 transition-all duration-300 disabled:opacity-70 text-sm md:text-base"
            />
            <button
              type="submit"
              disabled={isSubmittingNewsletter}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 md:px-8 py-2.5 bg-white text-deep-green rounded-full font-bold hover:bg-sage-green hover:text-white transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
            >
              {isSubmittingNewsletter ? '...' : 'Subscribe'}
            </button>
          </form>

          {/* Newsletter Status Messages */}
          {newsletterStatus && (
            <div className={`mt-3 p-3 rounded-full text-sm text-center font-semibold backdrop-blur-md ${
              newsletterStatus === 'success'
                ? 'bg-green-500/90 text-white'
                : newsletterStatus === 'already_subscribed'
                ? 'bg-yellow-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}>
              {newsletterStatus === 'success' && '✓ Successfully subscribed!'}
              {newsletterStatus === 'already_subscribed' && 'Already subscribed'}
              {newsletterStatus === 'error' && 'Failed. Please try again.'}
            </div>
          )}
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-3 border border-white/20">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentSlide
                    ? 'w-8 h-3 bg-white'
                    : 'w-3 h-3 bg-white/40 hover:bg-white/60'
                }`}
                disabled={isAnimating}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 hover:bg-white/20 hover:scale-110 disabled:opacity-50"
          disabled={isAnimating}
          aria-label="Previous slide"
        >
          <FaChevronLeft size={20} />
        </button>

        <button
          onClick={nextSlide}
          className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white transition-all duration-300 hover:bg-white/20 hover:scale-110 disabled:opacity-50"
          disabled={isAnimating}
          aria-label="Next slide"
        >
          <FaChevronRight size={20} />
        </button>
      </div>

      {/* Styles */}
      <style jsx>{`
        .hero-title {
          font-family: var(--font-nunito), system-ui, sans-serif;
          font-weight: 900;
          line-height: 0.9;
          letter-spacing: -0.03em;
          text-transform: uppercase;
        }

        .hero-line {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .hero-word-space {
          width: 1.5rem;
        }

        .hero-word {
          display: inline-block;
          color: #9CAF88;
          text-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
          font-size: 5rem;
        }

        .hero-subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 1.25rem;
          font-weight: 400;
          letter-spacing: 0.05em;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        /* Responsive font sizes */
        @media (max-width: 640px) {
          .hero-word {
            font-size: 3.5rem;
          }
          .hero-word-space {
            width: 1rem;
          }
        }

        @media (min-width: 641px) and (max-width: 768px) {
          .hero-word {
            font-size: 4.5rem;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .hero-word {
            font-size: 6rem;
          }
        }

        @media (min-width: 1025px) {
          .hero-word {
            font-size: 8rem;
          }
        }
      `}</style>
    </section>
  );
}
