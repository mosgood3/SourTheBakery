import Link from 'next/link';
import Image from 'next/image';
import { FaHome, FaInstagram, FaTiktok, FaFacebook } from 'react-icons/fa';

export default function SocialsPage() {
  const socialLinks = [
    {
      name: 'Website Home',
      url: '/',
      icon: FaHome,
      color: 'bg-gradient-to-r from-amber-800 to-amber-700 hover:from-amber-700 hover:to-amber-800',
      description: 'Visit our main website'
    },
    {
      name: 'Instagram',
      url: 'https://instagram.com/sourthebakery',
      icon: FaInstagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      description: 'Follow us on Instagram'
    },
    {
      name: 'TikTok',
      url: 'https://tiktok.com/@sourthebakery',
      icon: FaTiktok,
      color: 'bg-black hover:bg-gray-800',
      description: 'Watch our videos on TikTok'
    },
    {
      name: 'Facebook',
      url: 'https://m.facebook.com/profile.php?id=61577470065750&name=xhp_nt__fb__action__open_user',
      icon: FaFacebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      description: 'Like us on Facebook'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-peach py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Profile Section */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-cinnamon shadow-lg">
            <Image
              src="/logo2.PNG"
              alt="Sour The Bakery Logo"
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl font-lobster text-brown mb-2 lobster-heading">
            Sour The Bakery
          </h1>
          <p className="text-brown text-sm mb-4">
            Handcrafted sourdough cookies, brownies, loaves, and bagels
          </p>
          <div className="w-16 h-1 bg-cinnamon mx-auto rounded-full"></div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          {socialLinks.map((link, index) => (
            <Link
              key={index}
              href={link.url}
              target={link.url.startsWith('http') ? '_blank' : '_self'}
              rel={link.url.startsWith('http') ? 'noopener noreferrer' : ''}
              className={`block w-full p-4 rounded-xl text-white text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${link.color}`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <link.icon className="text-2xl" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold">{link.name}</div>
                  <div className="text-xs opacity-90">{link.description}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-beige">
          <p className="text-brown text-sm opacity-75">
            Made with ❤️ by Sour The Bakery
          </p>
        </div>
      </div>
    </div>
  );
} 