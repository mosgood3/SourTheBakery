'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function HandcraftedCreationsGallery() {
  const [images, setImages] = useState<{ src: string; alt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        const { getGalleryImages } = await import('../lib/storage-supabase');
        const imageUrls = await getGalleryImages();

        // Limit to 10 images and format them
        const formattedImages = imageUrls.slice(0, 10).map((url, index) => ({
          src: url,
          alt: `Sourdough Creation ${index + 1}`
        }));

        setImages(formattedImages);
      } catch (error) {
        // Fallback to static images if Supabase fails
        setImages([
          { src: '/collage/sour1.jpg', alt: 'Sourdough Creation 1' },
          { src: '/collage/sour2.jpg', alt: 'Sourdough Creation 2' },
          { src: '/collage/sour3.jpg', alt: 'Sourdough Creation 3' },
          { src: '/collage/sour4.jpg', alt: 'Sourdough Creation 4' },
          { src: '/collage/sour5.jpg', alt: 'Sourdough Creation 5' },
          { src: '/collage/sour6.jpg', alt: 'Sourdough Creation 6' },
          { src: '/collage/sour7.jpg', alt: 'Sourdough Creation 7' },
          { src: '/collage/sour8.jpg', alt: 'Sourdough Creation 8' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  if (loading) {
    return (
      <div className="mt-32 px-4 py-20 bg-gradient-to-t from-soft-cream to-light-cream">
        <div className="text-center mb-16">
          <h3 className="text-4xl md:text-5xl font-bold text-deep-green mb-6 heading-shadow">
            Our Handcrafted Creations
          </h3>
        </div>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
          <p className="mt-4 text-brown/70">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-32 px-4 py-20 bg-gradient-to-t from-soft-cream to-light-cream">
      <div className="text-center mb-16">
        <h3 className="text-4xl md:text-5xl font-bold text-deep-green mb-6 heading-shadow">
          Our Handcrafted Creations
        </h3>
      </div>

      {/* Modern Photo Collage Grid */}
      <div className="max-w-7xl mx-auto">
        {/* Mobile: Simple 2-column grid */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          {images.slice(0, 8).map((image, index) => (
            <div key={index} className="relative group overflow-hidden rounded-xl shadow-lg aspect-square">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>

        {/* Desktop: Complex layout with featured images */}
        <div className="hidden md:block">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Featured large image */}
            <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-3xl shadow-2xl">
              <Image
                src={images[0].src}
                alt={images[0].alt}
                width={600}
                height={600}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-deep-green/20 via-transparent to-sage-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-3xl"></div>
            </div>

            {/* Medium images */}
            {images.slice(1, 5).map((image, index) => (
              <div key={index + 1} className="relative group overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
              </div>
            ))}

            {/* Tall image */}
            <div className="lg:row-span-2 relative group overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={images[5].src}
                alt={images[5].alt}
                width={300}
                height={600}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors duration-500 rounded-2xl"></div>
            </div>

            {/* Remaining images */}
            {images.slice(6, 9).map((image, index) => (
              <div key={index + 6} className="relative group overflow-hidden rounded-xl shadow-md">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </div>
            ))}
          </div>

          {/* Bottom section for desktop */}
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {images.slice(9, 11).map((image, index) => (
                <div key={index + 9} className="relative group overflow-hidden rounded-xl shadow-md">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={300}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-moss-green/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
