'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getRecipe, Recipe } from '../../lib/recipes-supabase';
import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CheckoutForm({ recipe, customerEmail, customerName, onEmailChange, onNameChange }: {
  recipe: Recipe;
  customerEmail: string;
  customerName: string;
  onEmailChange: (email: string) => void;
  onNameChange: (name: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !customerEmail || !customerName) {
      setErrorMessage('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/recipes/success?recipeId=${recipe.id}&recipeName=${encodeURIComponent(recipe.name)}`,
          receipt_email: customerEmail,
          shipping: {
            name: customerName,
            address: {
              line1: 'N/A',
              city: 'N/A',
              state: 'N/A',
              postal_code: '00000',
              country: 'US',
            },
          },
        },
      });

      if (error) {
        setErrorMessage(error.message || 'An error occurred');
        setIsProcessing(false);
      }
    } catch (err) {
      setErrorMessage('Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-green"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={customerEmail}
          onChange={(e) => onEmailChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-green"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Details
        </label>
        <PaymentElement />
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-sage-green text-white py-3 rounded-md font-semibold hover:bg-deep-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Purchase for ${recipe.price}`}
      </button>
    </form>
  );
}

export default function RecipePage() {
  const params = useParams();
  const id = params.id as string;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        setLoading(true);
        const fetchedRecipe = await getRecipe(id);

        if (!fetchedRecipe) {
          setError('Recipe not found');
          return;
        }

        setRecipe(fetchedRecipe);
      } catch (err) {
        console.error('Error fetching recipe:', err);
        setError('Failed to load recipe');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    }
  }, [id]);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!recipe) return;

      try {
        const response = await fetch('/api/recipes/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipeId: recipe.id,
            recipeName: recipe.name,
            price: recipe.price,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment intent');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
      }
    };

    createPaymentIntent();
  }, [recipe]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-sage-green/20 border-t-sage-green rounded-full animate-spin"></div>
            </div>
            <p className="mt-6 text-lg text-deep-green font-semibold">Loading recipe...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-cream">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-red-600">{error || 'Recipe not found'}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Column - Recipe Details */}
          <div>
            <div className="relative h-96 w-full rounded-lg overflow-hidden mb-6">
              <Image
                src={recipe.image}
                alt={recipe.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <h1 className="text-4xl font-bold text-deep-green mb-4">{recipe.name}</h1>
            <p className="text-lg text-gray-700 mb-6">{recipe.description}</p>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-deep-green mb-4">What You'll Get:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-sage-green mr-2">✓</span>
                  Downloadable PDF recipe with detailed instructions
                </li>
                <li className="flex items-start">
                  <span className="text-sage-green mr-2">✓</span>
                  Emailed to your inbox immediately after purchase
                </li>
                <li className="flex items-start">
                  <span className="text-sage-green mr-2">✓</span>
                  Professional sourdough baking techniques
                </li>
                <li className="flex items-start">
                  <span className="text-sage-green mr-2">✓</span>
                  Step-by-step guidance for perfect results
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Checkout Form */}
          <div>
            <div className="bg-white p-8 rounded-lg shadow-lg sticky top-24">
              <h2 className="text-2xl font-bold text-deep-green mb-6">Purchase Recipe</h2>
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200">
                <span className="text-lg text-gray-700">Price:</span>
                <span className="text-3xl font-bold text-sage-green">{recipe.price}</span>
              </div>

              {clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#32CD32',
                      },
                    },
                  }}
                >
                  <CheckoutForm
                    recipe={recipe}
                    customerEmail={customerEmail}
                    customerName={customerName}
                    onEmailChange={setCustomerEmail}
                    onNameChange={setCustomerName}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">Loading payment form...</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
