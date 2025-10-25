'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import Link from 'next/link';
import { FiCheckCircle, FiDownload, FiMail } from 'react-icons/fi';

function SuccessContent() {
  const searchParams = useSearchParams();
  const recipeName = searchParams.get('recipeName') || 'Your Recipe';

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
              <FiCheckCircle className="text-sage-green" size={48} />
            </div>
            <h1 className="text-4xl font-bold text-deep-green mb-4">
              Purchase Successful!
            </h1>
            <p className="text-xl text-gray-700">
              Thank you for purchasing <strong>{decodeURIComponent(recipeName)}</strong>
            </p>
          </div>

          <div className="bg-green-50 border-l-4 border-sage-green p-6 mb-8">
            <div className="flex items-start">
              <FiMail className="text-sage-green mt-1 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-deep-green mb-2">
                  Check Your Email
                </h3>
                <p className="text-gray-700">
                  We've sent your recipe PDF to your email address. You should receive it within the next few minutes.
                  Check your spam folder if you don't see it in your inbox.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
            <div className="flex items-start">
              <FiDownload className="text-blue-500 mt-1 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-deep-green mb-2">
                  Download Tips
                </h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Save the PDF to your device for easy access</li>
                  <li>• You can print it out for use in your kitchen</li>
                  <li>• Keep the email for future downloads</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-gray-600">
              Questions or issues? Contact us at{' '}
              <a
                href="mailto:sourthebakeryllc@gmail.com"
                className="text-sage-green hover:text-deep-green font-semibold"
              >
                sourthebakeryllc@gmail.com
              </a>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Link
                href="/"
                className="px-6 py-3 bg-sage-green text-white rounded-md hover:bg-deep-green transition-colors font-semibold text-center"
              >
                Back to Home
              </Link>
              <Link
                href="/#recipes"
                className="px-6 py-3 border-2 border-sage-green text-sage-green rounded-md hover:bg-sage-green hover:text-white transition-colors font-semibold text-center"
              >
                Browse More Recipes
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default function RecipeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
