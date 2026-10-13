import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Share2,
  ShieldCheck,
  MapPin,
  Clock,
  Star,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Check,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { getConditionBadge, ProductCard } from '../components/ProductCard';
import { EnquiryModal } from '../components/EnquiryModal';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, toggleWishlist, isInWishlist, addToCart } = useMarketplace();

  const product = products.find((p) => p.id === id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [addedToCartToast, setAddedToCartToast] = useState(false);
  const [copiedLinkToast, setCopiedLinkToast] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Listing Not Found</h2>
          <p className="text-xs text-slate-500 mb-6">
            The product you are looking for may have been sold or removed by the seller.
          </p>
          <Link
            to="/explore"
            className="px-5 py-2.5 bg-[#064E3B] text-white text-xs font-semibold rounded-full shadow-xs"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const isWishlisted = isInWishlist(product.id);
  const badge = getConditionBadge(product.condition);
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  // Related products
  const relatedProducts = products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.campus === product.campus))
    .slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 2500);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLinkToast(true);
    setTimeout(() => setCopiedLinkToast(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      {/* Toast notifications */}
      {addedToCartToast && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 bg-[#064E3B] text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-[#22C55E]" />
          <span>Added to your Cart!</span>
          <Link to="/cart" className="underline font-bold ml-2 text-emerald-200">View Cart</Link>
        </div>
      )}

      {copiedLinkToast && (
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-4">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Listing link copied to clipboard!</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-slate-800">Home</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to="/explore" className="hover:text-slate-800">Explore</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to={`/explore?category=${encodeURIComponent(product.category)}`} className="hover:text-slate-800">
            {product.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-semibold truncate max-w-[200px]">{product.title}</span>
        </nav>

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        {/* Main Product Layout (2 Column Desktop, 1 Column Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-14">
          {/* LEFT COLUMN: Image Gallery (5 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Primary large image viewer */}
            <div className="relative aspect-[4/3] sm:aspect-square w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover object-center"
              />

              {/* Condition Badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs ${badge.bg}`}>
                  {badge.icon ? <Sparkles className="w-3.5 h-3.5 text-purple-600" /> : <span className={`w-2 h-2 rounded-full ${badge.dot}`} />}
                  {badge.label}
                </span>
              </div>

              {/* Wishlist toggle */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md shadow-md transition-transform active:scale-110 ${
                  isWishlisted
                    ? 'bg-red-50 text-red-600'
                    : 'bg-white/90 text-slate-700 hover:bg-white hover:text-red-500'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'stroke-current'}`} />
              </button>

              {/* Discount Tag */}
              {discountPercent && (
                <div className="absolute bottom-4 left-4 z-10">
                  <span className="bg-[#15803D] text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs">
                    {discountPercent}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail selector */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#064E3B] ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Campus Safety Notice Alert */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>Campus Safe Handover Guidelines</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Meet in open campus areas like the Student Activity Center, central canteen, or library lawn. Always verify physical condition before completing the UPI transfer.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Product Details & Purchase Actions (7 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Category & Campus */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    {product.category}
                  </span>
                  <button
                    onClick={handleShare}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {product.title}
                </h1>

                {/* Campus location pin */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>{product.campus}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">{product.pickupLocation}</span>
                </div>
              </div>

              {/* Price display */}
              <div className="pt-4 border-t border-slate-100 flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-base text-slate-400 line-through">
                    ₹{product.originalPrice.toLocaleString('en-IN')}
                  </span>
                )}
                {discountPercent && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Save ₹{(product.originalPrice! - product.price).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Primary Call to Actions */}
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Make Enquiry / Contact Seller */}
                  <button
                    onClick={() => setEnquiryOpen(true)}
                    className="w-full py-3.5 px-5 bg-[#064E3B] hover:bg-[#15803D] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-[#22C55E]" />
                    <span>Make Enquiry / Contact</span>
                  </button>

                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3.5 px-5 bg-[#15803D] hover:bg-[#16A34A] text-white rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>

                <p className="text-[11px] text-center text-slate-400">
                  Direct peer exchange • No middleman markups
                </p>
              </div>

              {/* Verified Seller Profile Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Student Seller Info
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={product.seller.avatarUrl}
                    alt={product.seller.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {product.seller.name}
                      </h4>
                      {product.seller.verifiedStudent && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Student Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {product.seller.department} • {product.seller.year}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                        {product.seller.rating} ({product.seller.reviewsCount} reviews)
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Replies {product.seller.responseTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Specifications */}
              {product.specifications && Object.keys(product.specifications).length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Listing Specifications
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">{key}</span>
                        <span className="font-semibold text-slate-800">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Seller's Description
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Tags */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-full font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 border-t border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Related Campus Listings
                </h2>
                <p className="text-xs text-slate-500">Other items in {product.category} or nearby hostels</p>
              </div>
              <Link to="/explore" className="text-xs font-semibold text-emerald-800 hover:underline">
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      <EnquiryModal
        product={product}
        isOpen={enquiryOpen}
        onClose={() => setEnquiryOpen(false)}
      />
    </div>
  );
};
