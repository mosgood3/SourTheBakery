'use client';

import { useState, useEffect } from 'react';
import { isOrderWindowOpen, getSettings } from '../lib/settings-supabase';
import { getNowEST } from '../lib/timezone';

export default function OrderStatusBanner() {
  const [status, setStatus] = useState({
    message: '🍪 Checking order availability...',
    subMessage: 'Please wait...',
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  });

  useEffect(() => {
    const checkOrderWindow = async () => {
      try {
        const [isOpen, settings] = await Promise.all([
          isOrderWindowOpen(),
          getSettings()
        ]);
        // Use EST for all time calculations
        const now = getNowEST();
        const currentDay = now.getDay();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        if (isOpen) {
          setStatus({
            message: '🍪 Orders are currently being accepted!',
            subMessage: 'Check settings for current hours',
            color: 'bg-green-50 border-green-200 text-green-800'
          });
        } else {
          let message = '⏰ Orders are currently closed';
          let subMessage = '';

          if (!settings.orderWindowDays.includes(currentDay)) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const nextOrderDay = settings.orderWindowDays.find((day: number) => day > currentDay) || settings.orderWindowDays[0];
            const nextDayName = dayNames[nextOrderDay];
            subMessage = `Orders will reopen ${nextDayName} at ${settings.orderWindowStart}`;
          } else {
            const [startHour, startMinute] = settings.orderWindowStart.split(':').map(Number);
            const [endHour, endMinute] = settings.orderWindowEnd.split(':').map(Number);
            const startTime = startHour * 60 + startMinute;
            const endTime = endHour * 60 + endMinute;

            if (currentTime < startTime) {
              subMessage = `Orders will open at ${settings.orderWindowStart} today`;
            } else if (currentTime > endTime) {
              subMessage = `Orders will reopen tomorrow at ${settings.orderWindowStart}`;
            }
          }

          setStatus({
            message,
            subMessage,
            color: 'bg-red-50 border-red-200 text-red-800'
          });
        }
      } catch (error) {
        console.error('Error checking order window:', error);
        setStatus({
          message: '⚠️ Unable to check order availability',
          subMessage: 'Please contact us for assistance',
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800'
        });
      }
    };

    checkOrderWindow();
  }, []);

  return (
    <div className={`border-l-4 border-l-4 ${status.color} p-4 rounded-lg mb-8`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-lg">{status.message}</p>
          <p className="text-sm opacity-80">{status.subMessage}</p>
        </div>
        <div className="text-2xl">
          {status.message.includes('accepted') ? '✅' : '⏸️'}
        </div>
      </div>
    </div>
  );
} 