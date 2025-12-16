import Navigation from '../../components/Navigation';
import Footer from '../../components/Footer';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-beige">
      <Navigation />
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-gold"></div>
          <p className="mt-4 text-brown/70">Loading pickup details...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
