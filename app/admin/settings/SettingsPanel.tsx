import React, { useState, useEffect } from 'react';
import { FiSave, FiClock, FiCalendar } from 'react-icons/fi';
import { getSettings, updateSettings, Settings } from '../../lib/settings';

export default function SettingsPanel({ admin }: { admin: any }) {
  const [settings, setSettings] = useState<Settings>({
    ordersEnabled: true,
    orderWindowStart: '06:00',
    orderWindowEnd: '17:00',
    orderWindowDays: [1, 2, 3, 4], // Monday to Thursday
    pickupDate: new Date().toISOString().split('T')[0],
    pickupTimeStart: '09:00',
    pickupTimeEnd: '12:00',
    pickupLocation: 'Sour The Bakery - 123 Main St'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    } catch (err) {
      console.error('Failed to load settings:', err);
      // Use default settings if none exist
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await updateSettings(settings);
      setSuccess('Settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brown mb-2">Store Settings</h1>
          <p className="text-brown/70">Configure order windows and pickup information</p>
        </div>
        <div className="w-full sm:w-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-accent-gold border-1 border-brown text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            <FiSave size={18} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
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
        </div>

        {/* Order Window Settings */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
          <div className="flex items-center gap-3 mb-6">
            <FiClock className="text-2xl text-accent-gold" />
            <h2 className="text-2xl font-serif font-bold text-brown">Order Window Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Order Window Start Time
              </label>
              <input
                type="time"
                value={settings.orderWindowStart}
                onChange={(e) => handleInputChange('orderWindowStart', e.target.value)}
                className="w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Order Window End Time
              </label>
              <input
                type="time"
                value={settings.orderWindowEnd}
                onChange={(e) => handleInputChange('orderWindowEnd', e.target.value)}
                className="w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
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
        </div>

        {/* Pickup Settings */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
          <div className="flex items-center gap-3 mb-6">
            <FiCalendar className="text-2xl text-accent-gold" />
            <h2 className="text-2xl font-serif font-bold text-brown">Pickup Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Pickup Date
              </label>
              <input
                type="date"
                value={settings.pickupDate}
                onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                className="w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Pickup Window Start
              </label>
              <input
                type="time"
                value={settings.pickupTimeStart}
                onChange={(e) => handleInputChange('pickupTimeStart', e.target.value)}
                className="w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Pickup Window End
              </label>
              <input
                type="time"
                value={settings.pickupTimeEnd}
                onChange={(e) => handleInputChange('pickupTimeEnd', e.target.value)}
                className="w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-semibold text-brown/70 mb-2">
                Pickup Location
              </label>
              <input
                type="text"
                value={settings.pickupLocation}
                onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                className="w-full px-4 py-3 border border-brown/20 rounded-xl focus:ring-2 focus:ring-accent-gold focus:border-transparent bg-white/50 text-brown"
                placeholder="Enter pickup location"
              />
            </div>
          </div>
        </div>

        {/* Current Status Display */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-accent-gold/20">
          <h2 className="text-2xl font-serif font-bold text-brown mb-4">Current Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-brown/5 rounded-xl">
              <p className="text-sm font-semibold text-brown/70 mb-1">Order Window</p>
              <p className="font-bold text-brown">
                {settings.orderWindowStart} - {settings.orderWindowEnd}
              </p>
              <p className="text-sm text-brown/60">
                Days: {settings.orderWindowDays.map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(', ')}
              </p>
            </div>
            <div className="p-4 bg-brown/5 rounded-xl">
              <p className="text-sm font-semibold text-brown/70 mb-1">Next Pickup</p>
              <p className="font-bold text-brown">
                {new Date(settings.pickupDate + 'T12:00:00').toLocaleDateString('en-US')}
              </p>
              <p className="text-sm text-brown/60">
                Window: {settings.pickupTimeStart} - {settings.pickupTimeEnd}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 