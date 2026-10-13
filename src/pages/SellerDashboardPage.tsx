import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Edit3,
  Trash2,
  CheckCircle2,
  Eye,
  MessageSquare,
  GraduationCap,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import type { Product } from '../types/product';
import {
  fetchSellerProducts,
  updateProductListing,
  deleteProductListing,
  fetchSellerReceivedEnquiries,
} from '../lib/supabase';
import { formatPriceINR, getConditionBadge } from '../lib/utils';

export const SellerDashboardPage: React.FC = () => {
  const { user, profile, openAuthModal } = useAuth();
  const { selectedCampus } = useMarketplace();

  const [products, setProducts] = useState<Product[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(user));
  const [activeTab, setActiveTab] = useState<'listings' | 'enquiries'>('listings');

  // Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editDescription, setEditDescription] = useState('');
  const [editInStock, setEditInStock] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      return;
    }

    const userId = user.id;

    async function loadData(uid: string) {
      try {
        const [sellerProds, recEnquiries] = await Promise.all([
          fetchSellerProducts(uid),
          fetchSellerReceivedEnquiries(uid).catch(() => []),
        ]);
        if (isMounted) {
          setProducts(sellerProds);
          setEnquiries(recEnquiries);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading seller dashboard data:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadData(userId);

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setEditTitle(p.title);
    setEditPrice(p.price);
    setEditDescription(p.description);
    setEditInStock(p.inStock ?? true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSaving(true);
    try {
      await updateProductListing(editingProduct.id, {
        title: editTitle,
        price: editPrice,
        description: editDescription,
        inStock: editInStock,
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.id === editingProduct.id
            ? {
                ...item,
                title: editTitle,
                price: editPrice,
                description: editDescription,
                inStock: editInStock,
              }
            : item
        )
      );

      setActionMessage('Listing updated successfully!');
      setTimeout(() => setActionMessage(null), 3000);
      setEditingProduct(null);
    } catch (err: any) {
      alert(`Could not update listing: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSold = async (product: Product) => {
    const newStatus = !product.inStock;
    try {
      await updateProductListing(product.id, { inStock: newStatus });
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, inStock: newStatus } : item
        )
      );
      setActionMessage(newStatus ? 'Marked as available!' : 'Marked as sold!');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await deleteProductListing(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setActionMessage('Listing removed from Campus Mart.');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err: any) {
      alert(`Could not delete listing: ${err.message}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 text-center shadow-lg space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Seller Dashboard</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sign in with your verified campus student account to manage your listings, respond to enquiries, and track handovers.
          </p>
          <button
            onClick={() => openAuthModal('signin')}
            className="w-full py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
          >
            Sign In to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl border border-emerald-200">
                {profile?.full_name ? profile.full_name[0].toUpperCase() : 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {profile?.full_name || 'Student Seller'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Student</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {profile?.college || selectedCampus} • {profile?.department || 'Student'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>

            <Link
              to="/sell"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Listing</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Listings
              </span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">
                {products.length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Listings
              </span>
              <span className="text-xl font-black text-emerald-800 mt-0.5 block">
                {products.filter((p) => p.inStock).length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Enquiries Received
              </span>
              <span className="text-xl font-black text-blue-800 mt-0.5 block">
                {enquiries.length}
              </span>
            </div>
          </div>
        </div>

        {/* Action toast message */}
        {actionMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-4 mb-6">
          <button
            onClick={() => setActiveTab('listings')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'listings'
                ? 'border-[#064E3B] text-[#064E3B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            My Listings ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'enquiries'
                ? 'border-[#064E3B] text-[#064E3B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Buyer Enquiries ({enquiries.length})
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#064E3B] mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading your listings from Supabase...</p>
          </div>
        ) : activeTab === 'listings' ? (
          <div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => {
                  const badge = getConditionBadge(product.condition);
                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-4">
                          <img
                            src={product.images[0] || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                            alt={product.title}
                            className="w-20 h-20 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}
                              >
                                {badge.label}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  product.inStock
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : 'bg-slate-100 text-slate-500 line-through'
                                }`}
                              >
                                {product.inStock ? 'Available' : 'Sold'}
                              </span>
                            </div>

                            <Link
                              to={`/product/${product.id}`}
                              className="font-bold text-sm text-slate-900 hover:text-[#064E3B] line-clamp-1"
                            >
                              {product.title}
                            </Link>

                            <p className="text-xs font-black text-emerald-800 mt-1">
                              {formatPriceINR(product.price)}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                              Pickup: {product.pickupLocation}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSold(product)}
                            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                              product.inStock
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                            }`}
                          >
                            {product.inStock ? 'Mark as Sold' : 'Mark Available'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                            title="Edit listing details"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Link
                            to={`/product/${product.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                            title="View live listing"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  You have not published any listings yet
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  Declutter your hostel room! Turn textbooks, electronics, and supplies into cash.
                </p>
                <Link
                  to="/sell"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Post First Listing</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div>
            {enquiries.length > 0 ? (
              <div className="space-y-4">
                {enquiries.map((enquiry) => (
                  <div
                    key={enquiry.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        Listing: {enquiry.product_title}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                        {enquiry.buyer_name || 'Campus Student'} ({enquiry.buyer_email || 'Verified Buyer'})
                      </h4>
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        "{enquiry.message}"
                      </p>
                      {enquiry.preferred_meetup && (
                        <p className="text-[11px] text-slate-500 mt-2">
                          <strong>Preferred Meetup:</strong> {enquiry.preferred_meetup}
                        </p>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(enquiry.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No Buyer Enquiries Yet</h3>
                <p className="text-xs text-slate-500">
                  When fellow campus students enquire about your active listings, their messages and meetup preferences will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Listing Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Edit Product Listing</h3>
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editPrice}
                  onChange={(e) => setEditPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="stockCheck"
                  checked={editInStock}
                  onChange={(e) => setEditInStock(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                />
                <label htmlFor="stockCheck" className="text-xs font-semibold text-slate-800">
                  Item is Available / In Stock
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
