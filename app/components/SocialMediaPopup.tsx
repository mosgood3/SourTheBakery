'use client';

import { FaTiktok, FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

interface SocialMediaPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SocialMediaPopup({ isOpen, onClose }: SocialMediaPopupProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="relative rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all"
          onClick={(e) => e.stopPropagation()}
          style={{
            animation: 'slideUp 0.3s ease-out',
            backgroundColor: 'var(--cream)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-deep-green hover:text-sage-green transition-colors"
            aria-label="Close"
          >
            <IoClose size={28} />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Decorative Elements */}
            <div className="flex items-center justify-center mb-6">
              <div className="text-soft-green text-2xl mr-3">✦</div>
              <div className="text-accent-pink text-xl mr-2">•</div>
              <div className="text-eucalyptus text-lg mr-2">•</div>
              <div className="text-soft-green text-xl mr-2">•</div>
              <div className="text-accent-pink text-2xl mr-3">✦</div>
            </div>

            <h3 className="text-4xl md:text-5xl font-bold text-deep-green mb-4">
              Join Our Community
            </h3>

            <p className="text-lg text-deep-green mb-8 leading-relaxed">
              Follow along for behind-the-scenes baking, fresh updates, and daily inspiration from our kitchen to yours.
            </p>

            {/* Social Media Buttons */}
            <div className="space-y-4">
              <a
                href="https://www.instagram.com/sourthebakery/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white px-8 py-4 rounded-full hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <FaInstagram size={28} />
                <span className="text-xl font-semibold">Follow on Instagram</span>
              </a>

              <a
                href="https://www.tiktok.com/@sourthebakery"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 bg-gradient-to-r from-gray-800 to-black text-white px-8 py-4 rounded-full hover:from-gray-900 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <FaTiktok size={28} />
                <span className="text-xl font-semibold">Watch on TikTok</span>
              </a>

              <a
                href="https://m.facebook.com/profile.php?id=61577470065750&name=xhp_nt__fb__action__open_user"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <FaFacebook size={28} />
                <span className="text-xl font-semibold">Like on Facebook</span>
              </a>

              <a
                href="https://www.youtube.com/@SOURTheBakery"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-full hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
              >
                <FaYoutube size={28} />
                <span className="text-xl font-semibold">Subscribe on YouTube</span>
              </a>
            </div>

            {/* Decorative Bottom */}
            <div className="flex items-center justify-center mt-8">
              <div className="text-accent-pink text-2xl mr-3">✦</div>
              <div className="text-soft-green text-xl mr-2">•</div>
              <div className="text-eucalyptus text-lg mr-2">•</div>
              <div className="text-soft-green text-xl mr-2">•</div>
              <div className="text-accent-pink text-2xl mr-3">✦</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
