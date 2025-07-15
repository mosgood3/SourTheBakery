'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CateringForm() {
  const [formData, setFormData] = useState({
    email: '',
    date: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setFormData({ email: '', date: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        backgroundImage: "url('data:image/svg+xml;utf8,<svg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"40\" height=\"40\" fill=\"%23fff8e1\"/><ellipse cx=\"20\" cy=\"20\" rx=\"19\" ry=\"19\" fill=\"%23f7e1b5\" fill-opacity=\"0.13\"/><ellipse cx=\"10\" cy=\"10\" rx=\"6\" ry=\"6\" fill=\"%23d19a6d\" fill-opacity=\"0.07\"/><ellipse cx=\"30\" cy=\"30\" rx=\"7\" ry=\"7\" fill=\"%238b5b29\" fill-opacity=\"0.04\"/></svg>')",
        backgroundSize: '120px 120px',
        backgroundBlendMode: 'multiply',
        backgroundColor: 'var(--background)',
      }}
    >
      <div className="bg-cream rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-cinnamon">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-lobster text-brown mb-2 lobster-heading">
            Cookie Catering Request
          </h2>
          <p className="text-brown/80">
            Let us know about your special event and we'll get back to you soon!
          </p>
        </div>

        {submitStatus === 'success' ? (
          <div className="text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-2xl font-lobster text-brown mb-4 lobster-heading">
              Thank You!
            </h3>
            <p className="text-brown/80 mb-6">
              We've received your catering request and will contact you soon.
            </p>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="bg-cinnamon text-cream px-6 py-3 rounded-full font-semibold hover:bg-brown transition-colors duration-300"
            >
              Send Another Request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-brown font-semibold mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-cinnamon/30 rounded-xl bg-white focus:border-cinnamon focus:outline-none transition-colors duration-300"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-brown font-semibold mb-2">
                Event Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-cinnamon/30 rounded-xl bg-white focus:border-cinnamon focus:outline-none transition-colors duration-300"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-brown font-semibold mb-2">
                Tell us about your event *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 border-2 border-cinnamon/30 rounded-xl bg-white focus:border-cinnamon focus:outline-none transition-colors duration-300 resize-none"
                placeholder="What type of event? How many people? Any specific dietary requirements? Special requests?"
              />
            </div>

            {submitStatus === 'error' && (
              <div className="text-red-600 text-center p-3 bg-red-50 rounded-lg">
                Something went wrong. Please try again.
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href="/"
                className="flex-1 px-6 py-3 border-2 border-cinnamon text-cinnamon rounded-full font-semibold hover:bg-cinnamon hover:text-cream transition-colors duration-300 text-center flex items-center justify-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-brown to-cinnamon text-cream rounded-full font-extrabold shadow-lg hover:from-cinnamon hover:to-brown hover:text-cream transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-brown"
                style={{ fontSize: '1.15rem', letterSpacing: '0.03em' }}
              >
                {isSubmitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 