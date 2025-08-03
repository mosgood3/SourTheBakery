import { FaTiktok, FaInstagram, FaFacebook } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer id="contact" className="bg-footer text-deep-green py-16 border-t border-beige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-serif font-bold mb-6 text-deep-green">Sour The Bakery</h3>
            <p className="text-moss-green/70 text-lg mb-6 leading-relaxed">
              Crafting delicious memories, one bite at a time. We bring the warmth and tradition of artisanal baking to every creation.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.tiktok.com/@sourthebakery" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-black hover:scale-110 transition-all duration-300">
                <FaTiktok size={24} />
              </a>
              <a href="https://www.instagram.com/sourthebakery/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-pink-600 hover:scale-110 transition-all duration-300">
                <FaInstagram size={24} />
              </a>
              <a href="https://m.facebook.com/profile.php?id=61577470065750&name=xhp_nt__fb__action__open_user" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-blue-600 hover:scale-110 transition-all duration-300">
                <FaFacebook size={24} />
              </a>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-xl font-semibold mb-6 text-deep-green">Contact</h4>
            <div className="space-y-4">
              <div>
                <p className="text-deep-green font-bold mb-1">Address</p>
                <p className="text-moss-green/70">12 Gaylord Drive</p>
                <p className="text-moss-green/70">Rocky Hill, CT 06111</p>
              </div>
              <div>
                <p className="text-deep-green font-bold mb-1">Phone</p>
                <p className="text-moss-green/70">(860) 539-4014</p>
              </div>
              <div>
                <p className="text-deep-green font-bold mb-1">Email</p>
                <p className="text-moss-green/70">sourthebakeryllc@gmail.com</p>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-xl font-semibold mb-6 text-deep-green">Hours</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-deep-green font-medium">Sunday</span>
                <span className="text-moss-green/70">9AM - 1PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-deep-green font-medium">Monday - Saturday</span>
                <span className="text-moss-green/70">Closed</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section */}
        <div className="border-t border-beige pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-moss-green/70 text-sm">
              © {new Date().getFullYear()} Sour The Bakery. All rights reserved.
            </p>
            <div className="flex items-center">
              <a
                href="/admin/login"
                className="px-3 py-1 rounded-lg border border-sage-green text-sage-green bg-transparent hover:bg-sage-green hover:text-cream transition-colors duration-200 text-xs font-semibold shadow-sm"
              >
                Admin Login
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 