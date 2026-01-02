import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AffiliateLink {
  id: string;
  name: string;
  description: string;
  url: string;
  image: string;
  sort_order: number;
}

async function getAffiliateLinks(): Promise<AffiliateLink[]> {
  const { data, error } = await supabase
    .from('affiliate_links')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching affiliate links:', error);
    return [];
  }

  return data || [];
}

export default async function AffiliatesPage() {
  const links = await getAffiliateLinks();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-peach py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/socials"
            className="inline-flex items-center gap-2 text-brown hover:text-cinnamon transition-colors mb-4"
          >
            <FiArrowLeft size={20} />
            Back to Links
          </Link>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden border-4 border-cinnamon shadow-lg">
            <Image
              src="/logo2.PNG"
              alt="Sour The Bakery Logo"
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-lobster text-brown mb-2 lobster-heading">
            My Favorite Products
          </h1>
          <p className="text-brown text-sm mb-4 max-w-md mx-auto">
            These are products I personally use and recommend. Some links may be affiliate links.
          </p>
          <div className="w-16 h-1 bg-cinnamon mx-auto rounded-full"></div>
        </div>

        {/* Affiliate Links Grid */}
        {links.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-brown/70">No affiliate links available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-beige/50"
              >
                {/* Image Container */}
                <div className="relative h-72 w-full overflow-hidden">
                  <Image
                    src={link.image}
                    alt={link.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Shop Badge */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-cinnamon text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-cinnamon/20 flex items-center gap-1.5 group-hover:bg-cinnamon group-hover:text-white transition-all duration-300">
                    <span>Shop</span>
                    <FiExternalLink size={12} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-brown group-hover:text-cinnamon transition-colors duration-300 mb-1">
                    {link.name}
                  </h3>
                  <p className="text-xs text-brown/60 leading-relaxed line-clamp-2">
                    {link.description}
                  </p>

                  {/* Bottom Accent */}
                  <div className="mt-3 pt-3 border-t border-beige/50">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-cinnamon/80 uppercase tracking-wide">
                        View Product
                      </span>
                      <div className="w-6 h-6 rounded-full bg-cinnamon/10 flex items-center justify-center group-hover:bg-cinnamon transition-colors duration-300">
                        <FiExternalLink className="text-cinnamon group-hover:text-white transition-colors duration-300" size={12} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Corner Decoration */}
                <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-cinnamon/20 to-transparent rounded-br-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </a>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-12 text-center">
          <p className="text-xs text-brown/50 max-w-lg mx-auto">
            Disclosure: Some of the links on this page are affiliate links. This means if you click on the link and purchase an item, I may receive a small commission at no extra cost to you.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-beige">
          <Link
            href="/socials"
            className="text-brown hover:text-cinnamon transition-colors text-sm"
          >
            View all links
          </Link>
        </div>
      </div>
    </div>
  );
}
