'use client';

import { isOrderWindowOpen } from '../lib/products';

export default function OrderStatusBanner() {
  const isOpen = isOrderWindowOpen();
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();

  const getStatusMessage = () => {
    if (isOpen) {
      return {
        message: '🍪 Orders are currently being accepted!',
        subMessage: 'Monday 6am - Thursday 5pm',
        color: 'bg-green-50 border-green-200 text-green-800'
      };
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
      
      return {
        message,
        subMessage,
        color: 'bg-red-50 border-red-200 text-red-800'
      };
    }
  };

  const status = getStatusMessage();

  return (
    <div className={`border-l-4 border-l-4 ${status.color} p-4 rounded-lg mb-8`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-lg">{status.message}</p>
          <p className="text-sm opacity-80">{status.subMessage}</p>
        </div>
        <div className="text-2xl">
          {isOpen ? '✅' : '⏸️'}
        </div>
      </div>
    </div>
  );
} 