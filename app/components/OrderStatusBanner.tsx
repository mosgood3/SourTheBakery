'use client';

import { useState, useEffect } from 'react';
import { isOrderWindowOpen } from '../lib/settings';

export default function OrderStatusBanner() {
  const [status, setStatus] = useState({
    message: '🍪 Checking order availability...',
    subMessage: 'Please wait...',
    color: 'bg-gray-50 border-gray-200 text-gray-800'
  });

  useEffect(() => {
    const checkOrderWindow = async () => {
      try {
        const isOpen = await isOrderWindowOpen();
        const now = new Date();
        const currentDay = now.getDay();
        const currentHour = now.getHours();

        if (isOpen) {
          setStatus({
            message: '🍪 Orders are currently being accepted!',
            subMessage: 'Check settings for current hours',
            color: 'bg-green-50 border-green-200 text-green-800'
          });
        } else {
          let message = '⏰ Orders are currently closed';
          let subMessage = '';
          
          if (currentDay === 4 && currentHour >= 17) { // Thursday after 5pm
            subMessage = 'Orders will reopen Monday at 6am';
          } else if (currentDay >= 5) { // Friday or Saturday
            subMessage = 'Orders will reopen Monday at 6am';
          } else if (currentDay === 0) { // Sunday
            subMessage = 'Orders will reopen Monday at 6am';
          } else if (currentDay === 1 && currentHour < 6) { // Monday before 6am
            subMessage = 'Orders will open at 6am today';
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