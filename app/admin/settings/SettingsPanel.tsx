import React, { useState, useEffect } from 'react';
import { FiSave, FiClock, FiCalendar, FiBell } from 'react-icons/fi';
import { getSettings, updateSettings, Settings } from '../../lib/settings-supabase';
import { getNotificationSettings, updateNotificationSettings, NotificationSettings, MAX_MESSAGE_LENGTH } from '../../lib/notifications-supabase';
import { getTodayEST, formatDateEST } from '../../lib/timezone';

export default function SettingsPanel({ admin }: { admin: any }) {
  const [settings, setSettings] = useState<Settings>({
    ordersEnabled: true,
    orderWindowStart: '06:00',
    orderWindowEnd: '17:00',
    orderWindowDays: [1, 2, 3, 4], // Monday to Thursday
    pickupDate: getTodayEST(),
    pickupTimeStart: '09:00',
    pickupTimeEnd: '12:00',
    pickupLocation: 'Sour The Bakery - 123 Main St'
  });
  const [loading, setLoading] = useState(true);
  const [savingOrderSystem, setSavingOrderSystem] = useState(false);
  const [savingOrderWindow, setSavingOrderWindow] = useState(false);
  const [savingPickup, setSavingPickup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    message: '',
    isActive: false
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    if (admin) {
      fetchSettings();
    }
  }, [admin]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const fetchedSettings = await getSettings();
      setSettings(fetchedSettings);

      // Fetch notification settings
      const fetchedNotificationSettings = await getNotificationSettings();
      if (fetchedNotificationSettings) {
        setNotificationSettings(fetchedNotificationSettings);
      }
    } catch (err) {
      // Use default settings if none exist
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrderSystem = async () => {
    try {
      setSavingOrderSystem(true);
      setError(null);
      setSuccess(null);

      await updateSettings(settings);
      setSuccess('Order system settings saved successfully!');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save order system settings');
    } finally {
      setSavingOrderSystem(false);
    }
  };

  const handleSaveOrderWindow = async () => {
    try {
      setSavingOrderWindow(true);
      setError(null);
      setSuccess(null);

      await updateSettings(settings);
      setSuccess('Order window settings saved successfully!');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save order window settings');
    } finally {
      setSavingOrderWindow(false);
    }
  };

  const handleSavePickup = async () => {
    try {
      setSavingPickup(true);
      setError(null);
      setSuccess(null);

      await updateSettings(settings);
      setSuccess('Pickup settings saved successfully!');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save pickup settings');
    } finally {
      setSavingPickup(false);
    }
  };

  const handleDayToggle = (dayValue: number) => {
    setSettings((prev: Settings) => ({
      ...prev,
      orderWindowDays: prev.orderWindowDays.includes(dayValue)
        ? prev.orderWindowDays.filter((d: number) => d !== dayValue)
        : [...prev.orderWindowDays, dayValue].sort()
    }));
  };

  const handleInputChange = (field: keyof Settings, value: any) => {
    setSettings((prev: Settings) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationInputChange = (field: keyof NotificationSettings, value: any) => {
    setNotificationSettings((prev: NotificationSettings) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true);
      setError(null);
      setSuccess(null);

      await updateNotificationSettings({
        message: notificationSettings.message,
        isActive: notificationSettings.isActive
      });
      setSuccess('Notification settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save notification settings');
    } finally {
      setSavingNotifications(false);
    }
  };

  const remainingChars = MAX_MESSAGE_LENGTH - notificationSettings.message.length;

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
        <p className="mt-4 text-brown/70">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-brown mb-2">Store Settings</h1>
        <p className="text-brown/70">Configure order windows and pickup information</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Current Status Display - MOVED TO TOP */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
          <h2 className="text-2xl font-serif font-bold text-brown mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-brown/5 rounded-xl">
              <p className="text-sm font-semibold text-brown/70 mb-1">Order System</p>
              <p className={`font-bold ${settings.ordersEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {settings.ordersEnabled ? 'Orders Enabled' : 'Orders Disabled'}
              </p>
            </div>
            <div className="p-4 bg-brown/5 rounded-xl">
              <p className="text-sm font-semibold text-brown/70 mb-1">Order Window</p>
              <p className="font-bold text-brown">
                {settings.orderWindowStart} - {settings.orderWindowEnd}
              </p>
              <p className="text-sm text-brown/60">
                Days: {settings.orderWindowDays.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
              </p>
            </div>
            <div className="p-4 bg-brown/5 rounded-xl md:col-span-2">
              <p className="text-sm font-semibold text-brown/70 mb-1">Next Pickup</p>
              <p className="font-bold text-brown">
                {formatDateEST(settings.pickupDate, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-sm text-brown/60">
                Window: {settings.pickupTimeStart} - {settings.pickupTimeEnd} at {settings.pickupLocation}
              </p>
            </div>
          </div>
        </div>

        {/* Master Order Toggle */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-brown mb-2">Order System</h2>
              <p className="text-brown/70">Enable or disable all orders globally</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-semibold ${settings.ordersEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {settings.ordersEnabled ? 'Orders Enabled' : 'Orders Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.ordersEnabled}
                  onChange={(e) => handleInputChange('ordersEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-gold/20 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          </div>
          {!settings.ordersEnabled && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">
                ⚠️ Orders are currently disabled. Customers cannot place any orders regardless of time window settings.
              </p>
            </div>
          )}
          <div className="flex justify-end mt-6 pt-4 border-t border-brown/10">
            <button
              onClick={handleSaveOrderSystem}
              disabled={savingOrderSystem}
              className="flex items-center justify-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave size={18} />
              {savingOrderSystem ? 'Saving...' : 'Save Order System'}
            </button>
          </div>
        </div>

        {/* Order Window Settings */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
          <div className="flex items-center gap-3 mb-6">
            <FiClock className="text-2xl text-accent-gold" />
            <h2 className="text-2xl font-serif font-bold text-brown">Order Window Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Order Window Start Time
              </label>
              <input
                type="time"
                value={settings.orderWindowStart}
                onChange={(e) => handleInputChange('orderWindowStart', e.target.value)}
                className="w-full max-w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Order Window End Time
              </label>
              <input
                type="time"
                value={settings.orderWindowEnd}
                onChange={(e) => handleInputChange('orderWindowEnd', e.target.value)}
                className="w-full max-w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-brown/70 mb-3">
              Order Window Days
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {daysOfWeek.map((day) => (
                <div key={day.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`day-${day.value}`}
                    checked={settings.orderWindowDays.includes(day.value)}
                    onChange={() => handleDayToggle(day.value)}
                    className="w-4 h-4 text-accent-gold bg-brown/10 border-brown/20 rounded focus:ring-accent-gold focus:ring-2"
                  />
                  <label htmlFor={`day-${day.value}`} className="text-brown font-medium text-sm">
                    {day.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-brown/10">
            <button
              onClick={handleSaveOrderWindow}
              disabled={savingOrderWindow}
              className="flex items-center justify-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave size={18} />
              {savingOrderWindow ? 'Saving...' : 'Save Order Window'}
            </button>
          </div>
        </div>

        {/* Pickup Settings */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
          <div className="flex items-center gap-3 mb-6">
            <FiCalendar className="text-2xl text-accent-gold" />
            <h2 className="text-2xl font-serif font-bold text-brown">Pickup Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="min-w-0">
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Pickup Date
              </label>
              <input
                type="date"
                value={settings.pickupDate}
                onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                className="w-full max-w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Pickup Window Start
              </label>
              <input
                type="time"
                value={settings.pickupTimeStart}
                onChange={(e) => handleInputChange('pickupTimeStart', e.target.value)}
                className="w-full max-w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Pickup Window End
              </label>
              <input
                type="time"
                value={settings.pickupTimeEnd}
                onChange={(e) => handleInputChange('pickupTimeEnd', e.target.value)}
                className="w-full max-w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>

            <div className="md:col-span-3 min-w-0">
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Pickup Location
              </label>
              <input
                type="text"
                value={settings.pickupLocation}
                onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                className="w-full max-w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
                placeholder="Enter pickup location"
              />
            </div>
          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-brown/10">
            <button
              onClick={handleSavePickup}
              disabled={savingPickup}
              className="flex items-center justify-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave size={18} />
              {savingPickup ? 'Saving...' : 'Save Pickup Settings'}
            </button>
          </div>
        </div>

        {/* Notification Banner Settings */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
          <div className="flex items-center gap-3 mb-6">
            <FiBell className="text-2xl text-accent-gold" />
            <h2 className="text-2xl font-serif font-bold text-brown">Notification Banner</h2>
          </div>

          <div className="space-y-6">
            {/* Toggle Active */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-brown/70">
                  Banner Status
                </label>
                <p className="text-xs text-brown/60 mt-1">
                  Display a notification banner on the homepage
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${notificationSettings.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {notificationSettings.isActive ? 'Active' : 'Inactive'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.isActive}
                    onChange={(e) => handleNotificationInputChange('isActive', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-gold/20 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-accent-gold"></div>
                </label>
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label htmlFor="notification-message" className="block text-sm font-semibold text-brown/70 mb-2">
                Banner Message
              </label>
              <textarea
                id="notification-message"
                rows={4}
                className="w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown resize-none"
                placeholder="Enter your notification banner message..."
                value={notificationSettings.message}
                onChange={(e) => handleNotificationInputChange('message', e.target.value)}
                maxLength={MAX_MESSAGE_LENGTH}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-brown/60">
                  Character limit: {MAX_MESSAGE_LENGTH}
                </p>
                <p className={`text-xs font-medium ${remainingChars < 20 ? 'text-red-500' : 'text-brown/60'}`}>
                  {remainingChars} characters remaining
                </p>
              </div>
            </div>

          </div>
          <div className="flex justify-end mt-6 pt-4 border-t border-brown/10">
            <button
              onClick={handleSaveNotifications}
              disabled={savingNotifications || remainingChars < 0}
              className="flex items-center justify-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave size={18} />
              {savingNotifications ? 'Saving...' : 'Save Notification Banner'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 