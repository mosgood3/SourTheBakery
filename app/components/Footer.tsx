import { FaTiktok, FaInstagram } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer id="contact" className="bg-footer text-cream py-16 border-t border-beige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-serif font-bold mb-6 text-accent-gold">Sour The Bakery</h3>
            <p className="text-cream/80 text-lg mb-6 leading-relaxed">
              Crafting delicious memories, one bite at a time. We bring the warmth and tradition of artisanal baking to every creation.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.tiktok.com/@sourthebakery" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-black hover:scale-110 transition-all duration-300">
                <FaTiktok size={24} />
              </a>
              <a href="https://www.instagram.com/sourthebakery/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-pink-600 hover:scale-110 transition-all duration-300">
                <FaInstagram size={24} />
              </a>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-xl font-semibold mb-6 text-accent-gold">Contact</h4>
            <div className="space-y-4">
              <div>
                <p className="text-cream/80 mb-1">Address</p>
                <p className="text-cream/60">12 Gaylord Drive</p>
                <p className="text-cream/60">Rocky Hill, CT 06111</p>
              </div>
              <div>
                <p className="text-cream/80 mb-1">Phone</p>
                <p className="text-cream/60">(860) 539-4014</p>
              </div>
              <div>
                <p className="text-cream/80 mb-1">Email</p>
                <p className="text-cream/60">sourthebakeryllc@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-xl font-semibold mb-6 text-accent-gold">Hours</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-cream/80">Sunday</span>
                <span className="text-cream/60">9AM - 1PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cream/80">Monday - Saturday</span>
                <span className="text-cream/60">Closed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-beige pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-cream/60 text-sm">
              © 2024 Sour The Bakery. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-cream/60 hover:text-accent-gold transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-cream/60 hover:text-accent-gold transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-cream/60 hover:text-accent-gold transition-colors">
                Accessibility
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 