'use client';

import React, { useState, useEffect } from 'react';
import { getNotificationSettings, NotificationSettings } from '../lib/notifications';

export default function NotificationBanner() {
  const [notification, setNotification] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const settings = await getNotificationSettings();
        if (settings && settings.isActive && settings.message.trim()) {
          setNotification(settings);
        }
      } catch (error) {
        console.error('Error fetching notification:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotification();
  }, []);

  if (isLoading || !notification) {
    return null;
  }

  return (
    <div className="w-full px-6 py-4 text-center shadow-lg bg-brown text-brown mt-20 border-accent-gold">
      <div className="max-w-4xl mx-auto">
        <p className="text-base font-semibold tracking-wide leading-relaxed break-words">
          {notification.message}
        </p>
      </div>
    </div>
  );
}