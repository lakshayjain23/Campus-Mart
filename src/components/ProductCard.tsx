import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Sparkles, CheckCircle2 } from 'lucide-react';
import type { Product } from '../types/product';
import { useMarketplace } from '../context/MarketplaceContext';
import { getConditionBadge } from '../lib/utils';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const { toggleWishlist, isInWishlist } = useMarketplace();
  const isWishlisted = isInWishlist(product.id);
  const badge = getConditionBadge(product.condition);

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 hover:border-emerald-600/40 hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80';
            }}
          />
        </Link>

        {/* Condition pill */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10">
          <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border shadow-xs backdrop-blur-xs ${badge.bg}`}>
            {badge.icon ? (
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
            ) : (
              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
            )}
            <span className="truncate max-w-[80px] sm:max-w-none">{badge.label}</span>
          </span>
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-200 shadow-sm ${
            isWishlisted
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-white/85 text-slate-600 hover:bg-white hover:text-red-500'
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform active:scale-125 ${
              isWishlisted ? 'fill-red-500 stroke-red-500' : 'stroke-current'
            }`}
          />
        </button>

        {/* Discount badge if present */}
        {discountPercent && (
          <div className="absolute bottom-2 left-2 sm:left-2.5 z-10">
            <span className="bg-[#15803D] text-white text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded shadow-xs">
              {discountPercent}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Campus */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-500 mb-1 sm:mb-1.5 gap-1">
            <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[10px] sm:text-[11px] truncate">
              {product.category}
            </span>
            <span className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] text-slate-500 shrink-0">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
              <span className="truncate max-w-[65px] sm:max-w-[110px]">{product.seller.hostel.split(',')[0]}</span>
            </span>
          </div>

          {/* Product Title */}
          <Link to={`/product/${product.id}`} className="block group-hover:text-[#064E3B] transition-colors">
            <h3 className={`font-semibold text-slate-900 leading-snug line-clamp-2 ${compact ? 'text-xs sm:text-sm' : 'text-xs sm:text-base'}`}>
              {product.title}
            </h3>
          </Link>
        </div>

        {/* Pricing & Student Seller info */}
        <div className="pt-2 sm:pt-3 mt-1.5 sm:mt-2 border-t border-slate-100">
          <div className="flex items-baseline justify-between gap-1 sm:gap-2">
            <div className="flex items-baseline gap-1 sm:gap-2 min-w-0">
              <span className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[10px] sm:text-xs text-slate-400 line-through truncate">
                  ₹{product.originalPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Verified Student Indicator */}
            {product.seller.verifiedStudent && (
              <span className="inline-flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded shrink-0" title="Student Verified">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600" />
                <span className="hidden xs:inline">Verified</span>
              </span>
            )}
          </div>

          {/* Quick pickup location */}
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            Pickup: {product.pickupLocation}
          </p>
        </div>
      </div>
    </div>
  );
};
