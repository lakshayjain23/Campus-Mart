import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ArrowRight, LogIn } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useAuth } from '../context/AuthContext';
import { ProductCard } from '../components/ProductCard';

export const WishlistPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const { wishlist, products, clearWishlist } = useMarketplace();

  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Saved Wishlist
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {user
                ? `${savedProducts.length} items saved for future purchase or peer inspection`
                : 'Sign in to save and access products from any device'}
            </p>
          </div>

          {user && savedProducts.length > 0 && (
            <button
              onClick={() => clearWishlist()}
              className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#064E3B] flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Sign In to View Your Wishlist</h2>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Saved items are tied to your verified student account so you can track listings across all sessions.
            </p>
            <button
              onClick={() => openAuthModal('signin')}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors cursor-pointer"
            >
              <span>Sign In with College Email</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : savedProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
            {savedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Your Wishlist is Empty</h2>
            <p className="text-xs text-slate-500 mb-6">
              Found something interesting in the campus marketplace? Click the heart icon on any card to save it here.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
            >
              <span>Explore Items</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

