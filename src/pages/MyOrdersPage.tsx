import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  MapPin,
  Calendar,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchUserReservations, fetchUserSentEnquiries } from '../lib/supabase';
import { formatPriceINR } from '../lib/utils';

export const MyOrdersPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(user));
  const [activeTab, setActiveTab] = useState<'reservations' | 'enquiries'>('reservations');

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      return;
    }

    const userId = user.id;

    async function loadData(uid: string) {
      try {
        const [resList, enqList] = await Promise.all([
          fetchUserReservations(uid).catch(() => []),
          fetchUserSentEnquiries(uid).catch(() => []),
        ]);
        if (isMounted) {
          setReservations(resList);
          setEnquiries(enqList);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Orders load error:', err);
        if (isMounted) setIsLoading(false);
      }
    }

    loadData(userId);

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[70vh] bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl border border-slate-200 text-center shadow-lg space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Your Reservations & Orders</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sign in with your student account to track your campus handovers and peer inquiries.
          </p>
          <button
            onClick={() => openAuthModal('signin')}
            className="w-full py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-bold rounded-full shadow-xs transition-colors cursor-pointer"
          >
            Sign In to View Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Orders & Inquiries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your reserved campus pickups and communications with student sellers
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-4 mb-6">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'reservations'
                ? 'border-[#064E3B] text-[#064E3B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Campus Reservations ({reservations.length})
          </button>
          <button
            onClick={() => setActiveTab('enquiries')}
            className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'enquiries'
                ? 'border-[#064E3B] text-[#064E3B]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sent Inquiries ({enquiries.length})
          </button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#064E3B] mx-auto mb-3" />
            <p className="text-xs text-slate-500">Loading your orders...</p>
          </div>
        ) : activeTab === 'reservations' ? (
          <div>
            {reservations.length > 0 ? (
              <div className="space-y-4">
                {reservations.map((res) => {
                  const items: any[] = Array.isArray(res.items) ? res.items : [];
                  return (
                    <div
                      key={res.id}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">
                              #{res.id.slice(0, 8)}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                              {res.status || 'Reserved for Pickup'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {res.created_at
                                ? new Date(res.created_at).toLocaleString('en-IN')
                                : 'Recent'}
                            </span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-xs text-slate-400 block">Total Amount:</span>
                          <span className="text-lg font-black text-emerald-800">
                            {formatPriceINR(Number(res.total_amount))}
                          </span>
                        </div>
                      </div>

                      <div className="py-4 space-y-2">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1"
                          >
                            <span className="font-semibold text-slate-800">
                              {item.title} × {item.quantity}
                            </span>
                            <span className="text-slate-600 font-medium">
                              {formatPriceINR(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl">
                        <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          <strong>Pickup details:</strong> {res.pickup_slot} ({res.campus})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No Active Reservations</h3>
                <p className="text-xs text-slate-500 mb-6">
                  Add items to your cart and reserve them for campus meetup and peer exchange.
                </p>
                <Link
                  to="/explore"
                  className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors inline-block"
                >
                  Browse Campus Marketplace
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div>
            {enquiries.length > 0 ? (
              <div className="space-y-4">
                {enquiries.map((enq) => (
                  <div
                    key={enq.id}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        Listing: {enq.product_title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(enq.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-2">
                      "{enq.message}"
                    </p>
                    <p className="text-xs text-slate-500">
                      Seller: <strong>{enq.seller_name || 'Campus Student'}</strong>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">No Enquiries Sent</h3>
                <p className="text-xs text-slate-500">
                  When you contact a seller through a listing's "Make an Enquiry" button, your sent messages appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
