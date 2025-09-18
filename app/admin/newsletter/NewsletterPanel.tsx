'use client';

import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaUsers, FaTrash, FaPaperPlane } from 'react-icons/fa';
import {
  getNewsletterSubscribers,
  sendNewsletterEmail,
  unsubscribeFromNewsletter,
  NewsletterSubscriber
} from '../../lib/newsletter';
import RichTextEditor from '../../components/RichTextEditor';

export default function NewsletterPanel() {
  const [activeTab, setActiveTab] = useState<'compose' | 'subscribers'>('compose');
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  
  // Email composition state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recipientType, setRecipientType] = useState<'newsletter' | 'orders'>('newsletter');

  // Load data when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'subscribers') {
      fetchSubscribers();
    }
  }, [activeTab]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const fetchedSubscribers = await getNewsletterSubscribers();
      setSubscribers(fetchedSubscribers);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      setMessage('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };


  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailSubject.trim() || !emailContent.trim()) {
      setMessage('Please fill in both subject and content');
      return;
    }

    setIsSending(true);
    setMessage(null);

    try {
      console.log('Attempting to send newsletter...');
      await sendNewsletterEmail(emailSubject, emailContent, process.env.NEXT_PUBLIC_ADMIN_EMAIL!, recipientType);
      console.log('Newsletter sent successfully!');
      setMessage('Newsletter sent successfully!');
      setEmailSubject('');
      setEmailContent('');
    } catch (error: any) {
      console.error('Detailed error sending newsletter:', error);
      setMessage(`Error: ${error.message || 'Failed to send newsletter'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleUnsubscribe = async (subscriberId: string, email: string) => {
    if (!window.confirm(`Remove ${email} from newsletter?`)) {
      return;
    }

    try {
      await unsubscribeFromNewsletter(subscriberId);
      setMessage(`${email} removed from newsletter`);
      fetchSubscribers(); // Refresh the list
    } catch (error) {
      console.error('Error unsubscribing user:', error);
      setMessage('Failed to remove subscriber');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brown mb-2">Newsletter Management</h1>
          <p className="text-brown/70">Manage subscribers and send newsletter emails</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-accent-gold/20">
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-6 py-3 text-lg font-semibold border-b-4 transition-all duration-200 ${
            activeTab === 'compose'
              ? 'border-accent-gold text-brown'
              : 'border-transparent text-brown/50 hover:text-brown'
          }`}
        >
          <FaEnvelope className="inline mr-2" />
          New
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`px-6 py-3 text-lg font-semibold border-b-4 transition-all duration-200 ${
            activeTab === 'subscribers'
              ? 'border-accent-gold text-brown'
              : 'border-transparent text-brown/50 hover:text-brown'
          }`}
        >
          <FaUsers className="inline mr-2" />
          Subs ({subscribers.length})
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg mb-6 ${
          message.includes('success') || message.includes('sent')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-accent-gold/20">
        {activeTab === 'compose' && (
          <div>
            <h2 className="text-2xl font-serif font-bold text-brown mb-6">Compose Email</h2>
            <form onSubmit={handleSendEmail} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Send To</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recipientType"
                      value="newsletter"
                      checked={recipientType === 'newsletter'}
                      onChange={(e) => setRecipientType(e.target.value as 'newsletter' | 'orders')}
                      className="text-accent-gold focus:ring-accent-gold"
                    />
                    <span className="text-brown font-medium">Newsletter Subscribers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="recipientType"
                      value="orders"
                      checked={recipientType === 'orders'}
                      onChange={(e) => setRecipientType(e.target.value as 'newsletter' | 'orders')}
                      className="text-accent-gold focus:ring-accent-gold"
                    />
                    <span className="text-brown font-medium">Customers with Open Orders</span>
                  </label>
                </div>
                <p className="text-sm text-brown/50 mt-1">
                  {recipientType === 'newsletter' 
                    ? 'Send to all newsletter subscribers'
                    : 'Send to customers who have open orders pending pickup'
                  }
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Email Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-brown/20 focus:border-accent-gold focus:outline-none focus:ring-2 focus:ring-accent-gold/20 transition-all duration-300 bg-white/50"
                  placeholder="Enter email subject..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brown mb-2">Email Content</label>
                <RichTextEditor
                  content={emailContent}
                  onChange={setEmailContent}
                  placeholder="Enter your newsletter content..."
                />
                <p className="text-sm text-brown/50 mt-2">
                  This will be sent to all {recipientType === 'newsletter' ? 'newsletter subscribers' : 'customers with open orders'}. Use the toolbar above to format your content.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSending || !emailSubject.trim() || !emailContent.trim()}
                  className="bg-accent-gold text-brown px-6 py-3 rounded-xl font-semibold hover:bg-accent-gold/90 transition-colors duration-300 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-2 border-forest-green"
                >
                  <FaPaperPlane />
                  {isSending ? 'Sending...' : `Send to ${recipientType === 'newsletter' ? 'Newsletter Subscribers' : 'Order Customers'}`}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'subscribers' && (
          <div>
            <h2 className="text-2xl font-serif font-bold text-brown mb-6">
              Newsletter Subscribers ({subscribers.length})
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
                <p className="mt-4 text-brown/70">Loading subscribers...</p>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-brown/70 text-xl">No subscribers yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="bg-cream/50 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-brown">{subscriber.email}</p>
                      <p className="text-sm text-brown/50">
                        Subscribed: {formatDate(subscriber.subscribedAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnsubscribe(subscriber.id!, subscriber.email)}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300 cursor-pointer flex items-center gap-2"
                    >
                      <FaTrash size={14} />
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}