'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function CateringPage() {
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
      className="min-h-screen flex items-center justify-center z-50 p-4"
      style={{
        backgroundImage: "url('data:image/svg+xml;utf8,<svg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect width=\"40\" height=\"40\" fill=\"%23fff8e1\"/><ellipse cx=\"20\" cy=\"20\" rx=\"19\" ry=\"19\" fill=\"%23f7e1b5\" fill-opacity=\"0.13\"/><ellipse cx=\"10\" cy=\"10\" rx=\"6\" ry=\"6\" fill=\"%23d19a6d\" fill-opacity=\"0.07\"/><ellipse cx=\"30\" cy=\"30\" rx=\"7\" ry=\"7\" fill=\"%238b5b29\" fill-opacity=\"0.04\"/></svg>')",
        backgroundSize: '120px 120px',
        backgroundBlendMode: 'multiply',
        backgroundColor: 'var(--background)',
      }}
    >
      <div className="relative bg-cream rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-cinnamon">
        {/* Back Arrow */}
        <Link href="/" className="absolute top-4 left-4 text-cinnamon hover:text-brown text-2xl flex items-center gap-2">
          <FaArrowLeft />
          <span className="sr-only">Back to home</span>
        </Link>
        <div className="text-center mb-6">
          <h2 className="text-3xl font-lobster text-brown mb-2 lobster-heading">
            Catering Request
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
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-brown to-cinnamon text-cream rounded-full font-extrabold shadow-lg px-6 py-3 border-2 border-brown hover:from-cinnamon hover:to-brown hover:text-cream transition-all duration-300"
              style={{ fontSize: '1.15rem', letterSpacing: '0.03em' }}
            >
              Back to Home
            </Link>
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 cursor-pointer bg-gradient-to-r from-amber-900 to-amber-700 text-cream rounded-full font-extrabold shadow-lg hover:from-amber-700 hover:to-amber-900 hover:text-cream transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-amber-900 mt-2"
              style={{ fontSize: '1.15rem', letterSpacing: '0.03em' }}
            >
              {isSubmitting ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
} 