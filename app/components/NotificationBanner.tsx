'use client';

import React, { useState, useEffect } from 'react';
import { FaTimes, FaInfoCircle } from 'react-icons/fa';
import { getNotificationSettings, NotificationSettings } from '../lib/notifications-supabase';

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
    setTimeout(() => setIsDismissed(true), 300);
  };

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const settings = await getNotificationSettings();
        if (settings && settings.isActive && settings.message.trim()) {
          setNotification(settings);
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
      className={`fixed left-0 right-0 z-40 px-4 pointer-events-none transition-all duration-500 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
      style={{ top: '5rem' }}
    >
      <div className="max-w-4xl mx-auto pointer-events-auto">
        {/* Toast Notification */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-moss-green rounded-lg shadow-lg overflow-hidden backdrop-blur-sm">
          <div className="flex items-start gap-3 p-4 md:p-5">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              <FaInfoCircle className="w-5 h-5 text-moss-green" />
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-sm md:text-base text-deep-green leading-relaxed break-words">
                {notification.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 ml-2 text-moss-green hover:text-deep-green transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-moss-green focus:ring-offset-2 rounded p-1"
              aria-label="Close notification"
              type="button"
            >
              <FaTimes className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}