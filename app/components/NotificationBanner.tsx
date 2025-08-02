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
    const visible = !isLoading && notification && !isDismissed;
    onVisibilityChange?.(visible);
  }, [isLoading, notification, isDismissed, onVisibilityChange]);

  if (isLoading || !notification || isDismissed) {
    return null;
  }

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 px-8 py-6 text-center shadow-2xl bg-gradient-to-r from-terracotta via-warm-brown to-terracotta text-warm-white border-t-4 border-golden-sand transition-transform duration-500 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        background: 'linear-gradient(135deg, #D19A6D 0%, #8B5A3C 50%, #B8956A 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="max-w-5xl mx-auto relative">
        <button
          onClick={handleDismiss}
          className="absolute -top-2 right-0 text-warm-white/80 hover:text-warm-white text-2xl transition-all duration-300 focus:outline-none hover:scale-110 hover:rotate-90 bg-white/10 rounded-full p-2 backdrop-blur-sm"
          aria-label="Close notification"
        >
          <FaTimes />
        </button>
        <p className="text-lg font-semibold tracking-wide leading-relaxed break-words pr-12 opacity-95">
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