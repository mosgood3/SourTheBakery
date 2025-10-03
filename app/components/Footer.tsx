import { useState, useEffect } from 'react';
import { FaTiktok, FaInstagram, FaFacebook } from 'react-icons/fa';
import { getPickupInfo } from '../lib/settings';

export default function Footer() {
  const [pickupLocation, setPickupLocation] = useState<string>('Rocky Hill, CT');

  useEffect(() => {
    const fetchPickupLocation = async () => {
      try {
        const info = await getPickupInfo();
        setPickupLocation(info.location);
      } catch (error) {
        console.error('Error fetching pickup location:', error);
      }
    };
    fetchPickupLocation();
  }, []);

  return (
    <footer id="contact" className="bg-deep-green text-white py-16 border-t border-beige">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h3 className="text-3xl font-serif font-bold mb-6 !text-white">Sour The Bakery</h3>
            <p className="text-white/70 text-lg mb-6 leading-relaxed">
              Crafting delicious memories, one bite at a time. We bring the warmth and tradition of artisanal baking to every creation.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.tiktok.com/@sourthebakery" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-white hover:scale-110 transition-all duration-300">
                <FaTiktok size={24} />
              </a>
              <a href="https://www.instagram.com/sourthebakery/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white hover:scale-110 transition-all duration-300">
                <FaInstagram size={24} />
              </a>
              <a href="https://m.facebook.com/profile.php?id=61577470065750&name=xhp_nt__fb__action__open_user" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-white hover:scale-110 transition-all duration-300">
                <FaFacebook size={24} />
              </a>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-xl font-semibold mb-6 text-white">Contact</h4>
            <div className="space-y-4">
              <div>
                <p className="text-white font-bold mb-1">Address</p>
                <p className="text-white/70">{pickupLocation}</p>
              </div>
              <div>
                <p className="text-white font-bold mb-1">Phone</p>
                <p className="text-white/70">(860) 539-4014</p>
              </div>
              <div>
                <p className="text-white font-bold mb-1">Email</p>
                <p className="text-white/70">sourthebakeryllc@gmail.com</p>
              </div>
            </div>
          </div>


        </div>

        {/* Bottom Section */}
        <div className="border-t border-beige pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/70 text-sm">
              © {new Date().getFullYear()} Sour The Bakery. All rights reserved.
            </p>
            <div className="flex items-center">
              <a
                href="/admin/login"
                className="px-3 py-1 rounded-lg border border-white/30 text-white bg-transparent hover:bg-white hover:text-deep-green transition-colors duration-200 text-xs font-semibold shadow-sm"
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