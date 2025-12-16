'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getActivePickups, Pickup, getPickupProducts } from '../lib/pickups-supabase';
import { FiCalendar, FiClock, FiMapPin, FiArrowRight } from 'react-icons/fi';

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

            return (
              <div
                key={pickup.id}
                className="group bg-white/90 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 border border-accent-gold/20 hover:border-accent-gold/40 cursor-pointer"
                onClick={() => handleViewMenu(pickup.id!)}
              >
                {/* Placeholder Image - Will show first product image in detail page */}
                <div className="relative h-64 bg-gradient-to-br from-accent-gold/20 to-brown/10 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FiCalendar className="text-brown/20 w-32 h-32" />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${orderStatus.color} backdrop-blur-sm`}>
                      {orderStatus.status}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Pickup Date as Title */}
                  <h3 className="text-2xl font-bold text-brown mb-6 group-hover:text-accent-gold transition-colors">
                    {formatDate(pickup.pickup_date)}
                  </h3>

                  {/* Pickup Details */}
                  <div className="space-y-3 mb-6">

                    <div className="flex items-start gap-3 text-brown/70">
                      <FiClock className="flex-shrink-0 mt-1 text-accent-gold" size={18} />
                      <div>
                        <p className="text-sm font-semibold text-brown/50">Pickup Time</p>
                        <p className="text-brown font-medium">
                          {formatTime(pickup.pickup_time_start)} - {formatTime(pickup.pickup_time_end)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 text-brown/70">
                      <FiMapPin className="flex-shrink-0 mt-1 text-accent-gold" size={18} />
                      <div>
                        <p className="text-sm font-semibold text-brown/50">Location</p>
                        <p className="text-brown font-medium line-clamp-1">{pickup.pickup_location}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Window Info */}
                  <div className="mb-6 p-3 bg-accent-gold/10 rounded-xl border border-accent-gold/20">
                    <p className="text-xs font-semibold text-brown/60 mb-1">Order Window</p>
                    <p className="text-sm text-brown">
                      {new Date(pickup.order_window_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(pickup.order_window_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  {/* View Menu Button */}
                  <button
                    onClick={() => handleViewMenu(pickup.id!)}
                    className="w-full bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-all duration-300 flex items-center justify-center gap-2 group-hover:gap-3 shadow-lg"
                  >
                    View Menu
                    <FiArrowRight size={18} />
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
