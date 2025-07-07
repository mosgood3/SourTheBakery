'use client';

import { useCart } from '../contexts/CartContext';
import { useEffect } from 'react';
import Image from 'next/image';

export default function HeroSection() {
  const { toggleCart } = useCart();

  useEffect(() => {
    const canvas = document.getElementById('gradient-canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
    if (!ctx) return;
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    const colors: [number, number, number][] = [
      [255, 240, 200], // deeper cream
      [235, 180, 120], // richer peach
      [210, 180, 140], // deeper beige
      [255, 140, 0],   // vibrant gold
      [255, 150, 180], // vibrant pink
      [180, 100, 60],  // deeper cinnamon
      [100, 60, 20],   // darker brown
    ];
    function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
    let animationId: number;
    function draw(time: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < 5; i++) {
        const t = (time / 2000 + i * 0.2) % 1;
        const x = lerp(0, width, Math.abs(Math.sin(time / (3000 + i * 1000) + i)));
        const y = lerp(0, height, Math.abs(Math.cos(time / (4000 + i * 800) + i)));
        const r = lerp(width * 0.3, width * 0.6, Math.abs(Math.sin(time / (2500 + i * 900) + i)));
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        const c1 = colors[i];
        const c2 = colors[(i + 1) % colors.length];
        grad.addColorStop(0, `rgba(${c1[0]},${c1[1]},${c1[2]},0.65)`);
        grad.addColorStop(1, `rgba(${c2[0]},${c2[1]},${c2[2]},0.15)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fill();
      }
      animationId = requestAnimationFrame(draw);
    }
    animationId = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 sm:pt-36 md:pt-40 lg:pt-44">
      {/* Stripe-style Animated Gradient Background */}
      <canvas id="gradient-canvas" className="absolute inset-0 w-full h-full z-0" data-transition-in style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0}} />
      
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen text-center">
        {/* Text Content */}
        <div className="flex flex-col justify-center items-center space-y-8 mb-12">
          <div className="vintage-container">
            <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-10xl  mb-4 leading-wide vintage-text">
              <span className="block text-accent-gold font-vintage lobster-vintage-shadow">LET'S GET</span>
              <span className="block text-brown font-vintage lobster-vintage-shadow">SOUR</span>
            </h1>
          </div>
          <p className="text-xl md:text-2xl lg:text-3xl text-brown mb-4 max-w-2xl leading-relaxed">
            Crafted with passion, baked with love. Discover our handcrafted sourdough cookies, brownies, loaves, and bagels made with the finest ingredients.
          </p>
          <div className="flex flex-col sm:flex-row gap-6">
            <button 
              onClick={toggleCart}
              className="vintage-btn order-btn"
            >
              Order Now
            </button>
            <a 
              href="#products"
              className="vintage-btn menu-btn"
            >
              View Menu
            </a>
          </div>
        </div>

        {/* Bakery Gallery Section */}
        <div className="mt-20 w-full">
          <h3 className="text-3xl md:text-4xl font-serif font-bold text-brown mb-8 text-center">
            Bakery Gallery
          </h3>
          <div className="columns-2 md:columns-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {[
              { src: "/IMG_6090.JPEG", alt: "Fresh sourdough bread", height: "h-48 md:h-64" },
              { src: "/IMG_6089.JPEG", alt: "Artisan cookies", height: "h-32 md:h-48" },
              { src: "/IMG_5992.jpg", alt: "Homemade brownies", height: "h-56 md:h-72" },
              { src: "/IMG_5982.jpg", alt: "Bakery display", height: "h-40 md:h-56" },
              { src: "/IMG_5966.jpg", alt: "Fresh pastries", height: "h-48 md:h-64" },
              { src: "/IMG_5965.jpg", alt: "Bakery interior", height: "h-36 md:h-52" }
            ].map((image, index) => (
              <div key={index} className={`group relative ${image.height} rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-all duration-500 mb-4 md:mb-6 break-inside-avoid`}>
                {/* Vintage border */}
                <div className="absolute inset-0 border-2 border-accent-gold/40 rounded-2xl pointer-events-none z-10"></div>
                <Image 
                  src={image.src} 
                  alt={image.alt} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-500 sepia-vintage" 
                  sizes="(max-width: 768px) 50vw, 33vw" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brown/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <h4 className="text-white font-semibold text-sm md:text-base drop-shadow-lg">
                    {image.alt}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wavy Vintage Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg className="relative w-full h-16" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path 
            d="M0,0 C300,60 600,60 900,30 C1050,15 1200,45 1200,60 L1200,120 L0,120 Z" 
            fill="#F7E1B5" 
            opacity="0.8"
          />
          <path 
            d="M0,0 C300,40 600,40 900,20 C1050,10 1200,30 1200,40 L1200,120 L0,120 Z" 
            fill="#D19A6D" 
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Custom CSS for vintage effects */}
      <style jsx>{`
        .font-vintage {
          font-family: var(--font-vintage), Georgia, serif;
        }
        
        .vintage-container {
          position: relative;
          display: inline-block;
        }
        
        .vintage-text {
          position: relative;
          animation: vintage-float 4s ease-in-out infinite;
        }
        
        .elegant-text {
          text-shadow: 
            2px 2px 0px rgba(139, 91, 41, 0.3),
            4px 4px 0px rgba(139, 91, 41, 0.2),
            6px 6px 0px rgba(139, 91, 41, 0.1);
          animation: elegant-pulse 3s ease-in-out infinite alternate;
          letter-spacing: 0.1em;
        }
        
        .vintage-text::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          background: linear-gradient(45deg, transparent 30%, rgba(249, 168, 0, 0.1) 50%, transparent 70%);
          z-index: -1;
          animation: vintage-shine 6s ease-in-out infinite;
        }
        
        @keyframes vintage-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-5px) rotate(0.5deg); }
          50% { transform: translateY(-10px) rotate(0deg); }
          75% { transform: translateY(-5px) rotate(-0.5deg); }
        }
        
        @keyframes elegant-pulse {
          from {
            text-shadow: 
              2px 2px 0px rgba(139, 91, 41, 0.3),
              4px 4px 0px rgba(139, 91, 41, 0.2),
              6px 6px 0px rgba(139, 91, 41, 0.1);
          }
          to {
            text-shadow: 
              3px 3px 0px rgba(139, 91, 41, 0.4),
              6px 6px 0px rgba(139, 91, 41, 0.3),
              9px 9px 0px rgba(139, 91, 41, 0.2);
          }
        }
        
        @keyframes vintage-shine {
          0%, 100% { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 1; transform: translateX(100%); }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .animate-float-slow {
          animation: floatY 6s ease-in-out infinite alternate;
        }
        .animate-float-medium {
          animation: floatY 3.5s ease-in-out infinite alternate;
        }
        .animate-float-fast {
          animation: floatY 2.5s ease-in-out infinite alternate;
        }
        .animate-float-loaf {
          animation: floatLoaf 7s ease-in-out infinite alternate;
        }
        @keyframes floatY {
          0% { transform: translateY(0); }
          100% { transform: translateY(-32px); }
        }
        @keyframes floatLoaf {
          0% { transform: translate(-50%, -50%) scale(1) rotate(-3deg); }
          25% { transform: translate(-48%, -54%) scale(1.04) rotate(2deg); }
          50% { transform: translate(-52%, -48%) scale(1.02) rotate(-2deg); }
          75% { transform: translate(-50%, -52%) scale(1.03) rotate(1deg); }
          100% { transform: translate(-50%, -50%) scale(1) rotate(-3deg); }
        }
        .animate-bounce-brownie {
          animation: bounceBrownie 7s ease-in-out infinite alternate;
        }
        @keyframes bounceBrownie {
          0% { transform: translate(25%, 25%) scale(1) rotate(2deg); }
          20% { transform: translate(20%, 30%) scale(1.05) rotate(-2deg); }
          50% { transform: translate(30%, 20%) scale(1.08) rotate(3deg); }
          80% { transform: translate(22%, 28%) scale(1.03) rotate(-1deg); }
          100% { transform: translate(25%, 25%) scale(1) rotate(2deg); }
        }
        .animate-hero-bounce {
          animation: heroBounce 3.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite alternate;
        }
        @keyframes heroBounce {
          0% { transform: translateY(0) scale(1); }
          20% { transform: translateY(-10px) scale(1.03); }
          40% { transform: translateY(-20px) scale(1.06); }
          60% { transform: translateY(-10px) scale(1.03); }
          80% { transform: translateY(0) scale(1); }
          100% { transform: translateY(0) scale(1); }
        }
        .lobster-vintage-shadow {
          font-family: var(--font-lobster), Georgia, serif;
          text-shadow:
            6px 6px 0px #2d2d2d,
            2px 2px 0px rgba(0,0,0,0.15);
          letter-spacing: 0.03em;
        }
        .vintage-btn {
          font-family: var(--font-lobster), var(--font-vintage), Georgia, serif;
          font-size: 1.4rem;
          font-weight: 700;
          border-radius: 9999px;
          padding: 1.1rem 2.5rem;
          min-width: 200px;
          box-shadow: 0 4px 16px 0 rgba(139,91,41,0.10), 0 1.5px 0 #b88b4a;
          transition: all 0.18s cubic-bezier(.4,2,.6,1);
          cursor: pointer;
          border: 2.5px solid #f9a800;
          margin-bottom: 0.5rem;
        }
        .order-btn {
          background: linear-gradient(90deg, #ffd700 60%, #f9a800 100%);
          color: #633a13;
          border-color: #f9a800;
        }
        .order-btn:hover, .order-btn:focus {
          background: linear-gradient(90deg, #ffe066 60%, #f9a800 100%);
          color: #4d2c0c;
          box-shadow: 0 8px 32px 0 rgba(139,91,41,0.18), 0 2.5px 0 #b88b4a;
          transform: translateY(-2px) scale(1.04);
        }
        .menu-btn {
          background: linear-gradient(90deg, #633a13 60%, #b88b4a 100%);
          color: #fffbe9;
          border-color: #f9a800;
        }
        .menu-btn:hover, .menu-btn:focus {
          background: linear-gradient(90deg, #7a4a1a 60%, #d1a06b 100%);
          color: #ffe066;
          box-shadow: 0 8px 32px 0 rgba(139,91,41,0.18), 0 2.5px 0 #b88b4a;
          transform: translateY(-2px) scale(1.04);
        }
        .sepia-vintage {
          filter: sepia(0.2) contrast(1.1) brightness(0.95);
        }
        .sepia-vintage:hover {
          filter: sepia(0.1) contrast(1.05) brightness(1);
        }
      `}</style>
    </section>
  );
} 