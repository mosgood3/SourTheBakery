'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getRecipes, Recipe } from '../lib/recipes-supabase';
import { FiShoppingCart } from 'react-icons/fi';

export default function RecipesSection() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        const fetchedRecipes = await getRecipes();
        setRecipes(fetchedRecipes);
      } catch (err) {
        setError('Failed to load recipes');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handlePurchase = (recipe: Recipe) => {
    // Navigate to recipe purchase page
    window.location.href = `/recipes/${recipe.id}`;
  };

  if (loading) {
    return (
      <section id="recipes" className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-deep-green mb-4">Our Recipes</h2>
            <p className="text-lg text-gray-700 mb-12">Loading recipes...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || recipes.length === 0) {
    return (
      <section id="recipes" className="py-16 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-deep-green mb-4">Our Recipes</h2>
            <p className="text-lg text-gray-700 mb-12">
              {error ? error : 'No recipes available yet. Check back soon!'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="recipes" className="py-24 bg-gradient-to-b from-soft-green/60 via-eucalyptus/50 to-light-green/60 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-80 h-80 bg-sage-green rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-pink rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-eucalyptus rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          {/* Decorative flourishes */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-sage-green text-2xl mr-4">✦</div>
            <div className="text-accent-pink text-xl mr-2">•</div>
            <div className="text-eucalyptus text-lg mr-2">•</div>
            <div className="text-sage-green text-xl mr-2">•</div>
            <div className="text-accent-pink text-2xl mr-4">✦</div>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold text-deep-green mb-6">Our Recipes</h2>
          <div className="flex items-center justify-center mt-4 mb-6">
            <div className="text-accent-pink text-2xl mr-4">✦</div>
            <div className="text-sage-green text-xl mr-2">•</div>
            <div className="text-eucalyptus text-lg mr-2">•</div>
            <div className="text-sage-green text-xl mr-2">•</div>
            <div className="text-accent-pink text-2xl mr-4">✦</div>
          </div>
          <div className="w-24 h-1 bg-sage-green mx-auto rounded-full mb-6"></div>
          <p className="text-xl text-deep-green/80 max-w-2xl mx-auto">
            Discover our collection of sourdough recipes. Purchase and download your favorites to bake at home!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-sage-green/30"
            >
              {/* Image with overlay effect */}
              <div className="relative h-72 w-full overflow-hidden">
                <Image
                  src={recipe.image}
                  alt={recipe.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-deep-green/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                {/* Price badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                  <span className="text-2xl font-bold text-sage-green">
                    {recipe.price}
                  </span>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-b from-white to-cream/30">
                <h3 className="text-2xl font-bold text-deep-green mb-3 group-hover:text-sage-green transition-colors">
                  {recipe.name}
                </h3>
                <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                  {recipe.description}
                </p>

                <button
                  onClick={() => handlePurchase(recipe)}
                  className="w-full flex items-center justify-center gap-2 bg-sage-green text-white px-6 py-3 rounded-xl hover:bg-deep-green transition-all duration-300 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 text-lg"
                >
                  <FiShoppingCart size={20} />
                  Purchase Recipe
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
