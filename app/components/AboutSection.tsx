'use client';

import Image from 'next/image';

export default function AboutSection() {
  return (
    <section 
      id="about" 
      className="py-24 relative overflow-hidden"
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='40' height='40' fill='%23fff8e1'/><ellipse cx='20' cy='20' rx='19' ry='19' fill='%23f7e1b5' fill-opacity='0.13'/><ellipse cx='10' cy='10' rx='6' ry='6' fill='%23d19a6d' fill-opacity='0.07'/><ellipse cx='30' cy='30' rx='7' ry='7' fill='%238b5b29' fill-opacity='0.04'/></svg>")`,
        backgroundSize: '120px 120px',
        backgroundBlendMode: 'multiply',
        backgroundColor: 'var(--light-cream)',
      }}
    >
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-soft-green rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-pink rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-eucalyptus rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center">
          {/* Decorative flourishes */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-soft-green text-2xl mr-4">✦</div>
            <div className="text-accent-pink text-xl mr-2">•</div>
            <div className="text-eucalyptus text-lg mr-2">•</div>
            <div className="text-soft-green text-xl mr-2">•</div>
            <div className="text-accent-pink text-2xl mr-4">✦</div>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-deep-green mb-6">
            Our Story
          </h2>
          <div className="flex items-center justify-center mt-4">
            <div className="text-accent-pink text-2xl mr-4">✦</div>
            <div className="text-soft-green text-xl mr-2">•</div>
            <div className="text-eucalyptus text-lg mr-2">•</div>
            <div className="text-soft-green text-xl mr-2">•</div>
            <div className="text-accent-pink text-2xl mr-4">✦</div>
          </div>
          <div className="w-24 h-1 bg-soft-green mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left: Story Content */}
          <div className="space-y-8">
            <div className="rounded-3xl p-8">
              <h3 className="text-3xl font-bold text-deep-green mb-6">
                From Family Kitchen to Community Favorite
              </h3>
              <p className="text-xl md:text-2xl font-serif text-deep-green mb-4">
                Hi, we're Isabela and Matt — the couple behind SOUR the bakery.
              </p>
              <p className="text-lg md:text-xl text-deep-green mb-2">
                Isabela is the owner and baker, and SOUR began in early 2024 from her passion for sourdough, slow living, and homemade food. What started as a hobby quickly became a deep love for creating real, nourishing bakes.
              </p>
              <p className="text-lg md:text-xl text-deep-green mb-2">
                By June 2025, she launched SOUR with a small front-yard stand to share fresh, handmade goods with the local community.
              </p>
              <p className="text-lg md:text-xl text-deep-green mb-2">
                Matt supports behind the scenes — building the website, helping with setup, and cheering Isabela on every step of the way.
              </p>
              <p className="text-lg md:text-xl text-deep-green">
                SOUR is just getting started — thanks for being part of the journey.
              </p>
            </div>

            {/* Statistics - removed */}
          </div>

          {/* Right: Baker Image & Quote */}
          <div className="relative">
            <div className="relative">
              {/* Main Image */}
              <div className="bg-gradient-to-br from-soft-green/20 to-accent-pink/20 rounded-3xl p-4 shadow-2xl">
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

            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 