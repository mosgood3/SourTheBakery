'use client';

import Image from 'next/image';

export default function AboutSection() {
  return (
    <section id="about" className="py-24 bg-about relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-accent-gold rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-pink rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-cinnamon rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center">
          {/* Decorative flourishes */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-accent-gold text-2xl mr-4">✦</div>
            <div className="text-accent-pink text-xl mr-2">•</div>
            <div className="text-cinnamon text-lg mr-2">•</div>
            <div className="text-accent-gold text-xl mr-2">•</div>
            <div className="text-accent-pink text-2xl mr-4">✦</div>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-brown mb-6">
            Our Story
          </h2>
          <div className="flex items-center justify-center mt-4">
            <div className="text-accent-pink text-2xl mr-4">✦</div>
            <div className="text-accent-gold text-xl mr-2">•</div>
            <div className="text-cinnamon text-lg mr-2">•</div>
            <div className="text-accent-gold text-xl mr-2">•</div>
            <div className="text-accent-pink text-2xl mr-4">✦</div>
          </div>
          <div className="w-24 h-1 bg-accent-gold mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left: Story Content */}
          <div className="space-y-8">
            <div className="rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-brown mb-6">
                From Family Kitchen to Community Favorite
              </h3>
              <p className="text-lg text-brown/95 mb-6 leading-relaxed">
                Founded in 2020, Sour The Bakery began as a small family passion project. What started in our home kitchen has grown into a beloved local bakery, serving our community with love and dedication.
              </p>
              <p className="text-lg text-brown/95 leading-relaxed">
                We believe in the art of slow fermentation, using traditional sourdough starters that have been nurtured for generations. Every loaf, every pastry, every cake is made with the same care and attention to detail that we would use for our own family.
              </p>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 border-2 border-accent-gold/30">
                <div className="text-4xl font-bold text-accent-gold mb-2">1000+</div>
                <div className="text-brown font-semibold">Happy Customers</div>
              </div>
              <div className="rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 border-2 border-accent-pink/30">
                <div className="text-4xl font-bold text-accent-pink mb-2">50+</div>
                <div className="text-brown font-semibold">Unique Recipes</div>
              </div>
            </div>
          </div>

          {/* Right: Baker Image & Quote */}
          <div className="relative">
            <div className="relative">
              {/* Main Image */}
              <div className="bg-gradient-to-br from-accent-gold/20 to-accent-pink/20 rounded-3xl p-4 shadow-2xl">
                <div className="relative h-96 w-full rounded-2xl overflow-hidden">
                  <Image
                    src="/me.jpg"
                    alt="Baker at Sour The Bakery"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>

              {/* Floating Quote Card */}
              <div className="absolute -bottom-8 -right-8 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-accent-gold/20 max-w-xs transform rotate-3">
                <p className="text-brown italic text-lg">
                  "Every bite tells a story of tradition, passion, and love for baking."
                </p>
                <div className="text-accent-gold text-2xl mt-2">✨</div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -top-6 -left-6 bg-accent-gold/20 backdrop-blur-sm rounded-full p-4 shadow-xl">
                <span className="text-3xl">🍞</span>
              </div>
              <div className="absolute top-1/2 -right-8 bg-accent-pink/20 backdrop-blur-sm rounded-full p-4 shadow-xl">
                <span className="text-3xl">🥖</span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-accent-gold/10 to-accent-pink/10 rounded-3xl p-12 text-center border border-accent-gold/20">
          <h3 className="text-3xl font-bold text-brown mb-4">
            Visit Our Farm Stand
          </h3>
          <p className="text-lg text-brown/90 mb-8 max-w-2xl mx-auto">
            Experience the warmth and aroma of our freshly baked goods in person. Come see where the magic happens!
          </p>
          <a 
            href="https://maps.google.com/?q=12+Gaylord+Drive+Rocky+Hill+CT+06111"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-accent-gold text-brown px-8 py-4 rounded-full text-lg font-semibold hover:bg-accent-gold/90 transition-all duration-300 border-2 border-brown transform hover:scale-105"
          >
            Get Directions
          </a>
        </div>
      </div>
    </section>
  );
} 