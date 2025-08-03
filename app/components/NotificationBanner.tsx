'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { getNotificationSettings, NotificationSettings } from '../lib/notifications';

interface NotificationBannerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function NotificationBanner({ onVisibilityChange }: NotificationBannerProps) {
  const [notification, setNotification] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300); // Wait for animation
  };

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const settings = await getNotificationSettings();
        if (settings && settings.isActive && settings.message.trim()) {
          setNotification(settings);
          // Show notification after a brief delay
          setTimeout(() => setIsVisible(true), 500);
        }
      } catch (error) {
        console.error('Error fetching notification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, []);

  useEffect(() => {
    const visible = !isLoading && !!notification && !isDismissed;
    onVisibilityChange?.(visible);
  }, [isLoading, notification, isDismissed, onVisibilityChange]);

  if (isLoading || !notification || isDismissed) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-x-0 bottom-0 top-1/2 md:bottom-0 md:top-auto z-50 flex items-center justify-center transition-transform duration-500 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg width='40' height='40' viewBox='0 0 40 40' fill='none' xmlns='http://www.w3.org/2000/svg'><rect width='40' height='40' fill='%23fff8e1'/><ellipse cx='20' cy='20' rx='19' ry='19' fill='%23f7e1b5' fill-opacity='0.13'/><ellipse cx='10' cy='10' rx='6' ry='6' fill='%23d19a6d' fill-opacity='0.07'/><ellipse cx='30' cy='30' rx='7' ry='7' fill='%238b5b29' fill-opacity='0.04'/></svg>")`,
        backgroundSize: '120px 120px',
        backgroundBlendMode: 'multiply',
        backgroundColor: 'var(--light-cream)',
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4 text-center relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="absolute top-3 right-3 text-moss-green hover:text-sage-green text-2xl md:text-xl transition-all duration-300 focus:outline-none hover:scale-110 hover:rotate-90 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close notification"
          type="button"
        >
          <FaTimes />
        </button>
        <p className="text-lg font-semibold text-deep-green leading-relaxed break-words">
          {notification.message}
        </p>
      </div>
      
      {/* Modern animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
    </div>
  );
}