'use client';

import React, { useState, useEffect } from 'react';
import { FaSave, FaBell } from 'react-icons/fa';
import { getNotificationSettings, updateNotificationSettings, NotificationSettings, MAX_MESSAGE_LENGTH } from '../../lib/notifications';

export default function NotificationsPanel() {
  const [settings, setSettings] = useState<NotificationSettings>({
    message: '',
    isActive: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const currentSettings = await getNotificationSettings();
        if (currentSettings) {
          setSettings(currentSettings);
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        setMessage('Error loading notification settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      await updateNotificationSettings({
        message: settings.message,
        isActive: settings.isActive
      });
      setMessage('Notification settings saved successfully!');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      setMessage(error.message || 'Error saving notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const remainingChars = MAX_MESSAGE_LENGTH - settings.message.length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <FaBell className="mr-3 text-blue-600" />
          Notification Banner
        </h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('Error') || message.includes('exceed')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}


      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="space-y-6">
          {/* Toggle Active */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Banner Status
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Message Input */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Banner Message
            </label>
            <textarea
              id="message"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter your permanent banner message..."
              value={settings.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-sm text-gray-500">
                Character limit: {MAX_MESSAGE_LENGTH}
              </p>
              <p className={`text-sm ${remainingChars < 20 ? 'text-red-500' : 'text-gray-500'}`}>
                {remainingChars} characters remaining
              </p>
            </div>
          </div>


          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving || remainingChars < 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <FaSave />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

