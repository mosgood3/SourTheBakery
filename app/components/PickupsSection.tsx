'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getActivePickups, Pickup, getPickupProducts } from '../lib/pickups-supabase';
import { FiCalendar, FiClock, FiMapPin, FiArrowRight, FiPackage } from 'react-icons/fi';

export default function PickupsSection() {
  const router = useRouter();
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPickups = async () => {
      try {
        setLoading(true);
        const fetchedPickups = await getActivePickups();
        setPickups(fetchedPickups);
      } catch (err) {
        console.error('Failed to load pickups:', err);
        setError('Failed to load pickup events');
      } finally {
        setLoading(false);
      }
    };

    fetchPickups();
  }, []);

  const getOrderWindowStatus = (pickup: Pickup): { status: string; color: string } => {
    // Compare dates only (no time component) since order windows are all-day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(pickup.order_window_start);
    start.setHours(0, 0, 0, 0);

    const end = new Date(pickup.order_window_end);
    end.setHours(0, 0, 0, 0);

    if (today < start) {
      return { status: 'Opens Soon', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    }
    if (today > end) {
      return { status: 'Closed', color: 'bg-gray-100 text-gray-800 border-gray-300' };
    }

    // Check if it's the last day (closing today)
    if (today.getTime() === end.getTime()) {
      return { status: 'Closing Today', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
    }

    return { status: 'Orders Open', color: 'bg-green-100 text-green-800 border-green-300' };
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      const standardHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${standardHour}:${minutes} ${period}`;
    } catch {
      return timeString;
    }
  };

  const handleViewMenu = (pickupId: string) => {
    router.push(`/pickup/${pickupId}`);
  };

  if (loading) {
    return (
      <section className="relative w-full bg-gradient-to-br from-cream via-peach to-beige py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
            <p className="mt-4 text-brown/70">Loading pickup events...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative w-full bg-gradient-to-br from-cream via-peach to-beige py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (pickups.length === 0) {
    return (
      <section className="relative w-full bg-gradient-to-br from-cream via-peach to-beige py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-brown mb-4">
              Coming Soon
            </h2>
            <p className="text-xl text-brown/70 mb-8">
              No pickup events are currently available. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full bg-gradient-to-br from-cream via-peach to-beige py-20" id="menu">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-brown mb-4">
            Upcoming Pickups
          </h2>
          <p className="text-xl text-brown/70 max-w-2xl mx-auto">
            Select a pickup event to view the menu and place your order
          </p>
        </div>

        {/* Pickups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pickups.map((pickup) => {
            const orderStatus = getOrderWindowStatus(pickup);
            const pickupDate = new Date(pickup.pickup_date + 'T00:00:00');
            const dayOfWeek = pickupDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const month = pickupDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const day = pickupDate.getDate();

            return (
              <div
                key={pickup.id}
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer hover:-translate-y-2 border border-brown/5"
                onClick={() => handleViewMenu(pickup.id!)}
              >
                {/* Bold Header with Calendar Date */}
                <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-800 p-6 text-center overflow-hidden">
                  {/* Decorative pickup icon */}
                  <div className="absolute bottom-2 left-2 opacity-20">
                    <FiPackage className="w-24 h-24 text-white transform -rotate-12" strokeWidth={1.5} />
                  </div>
                  <div className="absolute top-2 right-12 opacity-15">
                    <FiPackage className="w-14 h-14 text-white transform rotate-12" strokeWidth={1.5} />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 z-20">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${orderStatus.color} shadow-sm`}>
                      {orderStatus.status}
                    </span>
                  </div>

                  {/* Calendar-style Date Display */}
                  <div className="relative z-10">
                    <p className="text-emerald-300 font-bold text-sm tracking-widest mb-1">{dayOfWeek}</p>
                    <p className="text-white/70 text-xs tracking-wider mb-2">{month}</p>
                    <p className="text-white text-7xl font-bold leading-none tracking-tight">{day}</p>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 bg-gradient-to-b from-white to-cream/30">
                  {/* Pickup Details - Compact Layout */}
                  <div className="space-y-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-gold/15 flex items-center justify-center flex-shrink-0">
                        <FiClock className="text-accent-gold" size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brown/50 uppercase tracking-wide">Pickup</p>
                        <p className="text-brown font-semibold">
                          {formatTime(pickup.pickup_time_start)} - {formatTime(pickup.pickup_time_end)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-gold/15 flex items-center justify-center flex-shrink-0">
                        <FiMapPin className="text-accent-gold" size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brown/50 uppercase tracking-wide">Location</p>
                        <p className="text-brown font-semibold line-clamp-1">{pickup.pickup_location}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent-gold/15 flex items-center justify-center flex-shrink-0">
                        <FiCalendar className="text-accent-gold" size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-brown/50 uppercase tracking-wide">Order By</p>
                        <p className="text-brown font-semibold">
                          {new Date(pickup.order_window_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* View Menu Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleViewMenu(pickup.id!); }}
                    className="w-full bg-deep-green text-white px-6 py-3.5 rounded-xl font-bold hover:bg-deep-green/90 transition-all duration-300 flex items-center justify-center gap-2 group-hover:gap-3 shadow-md hover:shadow-lg uppercase tracking-wide text-sm"
                  >
                    View Menu
                    <FiArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
