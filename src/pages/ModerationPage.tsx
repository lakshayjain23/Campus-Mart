import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  Eye,
  Trash2,
  Clock,
  Check,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  fetchModerationReports,
  updateReportStatus,
  takeDownReportedListing,
} from '../lib/supabase';
import type { Tables } from '../types/database';

const formatReportDate = (isoString?: string | null) => {
  if (!isoString) return 'Just now';
  try {
    return new Date(isoString).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return 'Just now';
  }
};

export const ModerationPage: React.FC = () => {
  const { user, profile, openAuthModal } = useAuth();
  const { products, deleteProduct } = useMarketplace();

  const [reports, setReports] = useState<Tables<'listing_reports'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'under_review' | 'resolved' | 'dismissed'>('pending');
  const [actionFeedback, setActionFeedback] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Moderator check
  const isAuthorized = profile?.role === 'moderator' || profile?.role === 'admin';

  const loadReports = React.useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const { data, error } = await fetchModerationReports();
      if (!error && data) {
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to load moderation reports:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (user && isAuthorized) {
      loadReports();
    }
  }, [user, isAuthorized, loadReports]);

  const handleUpdateStatus = async (reportId: string, newStatus: 'under_review' | 'resolved' | 'dismissed', notes?: string) => {
    setIsProcessingId(reportId);
    setActionFeedback(null);
    try {
      const { error } = await updateReportStatus({
        reportId,
        status: newStatus,
        reviewedBy: user?.id,
        resolutionNotes: notes,
      });

      if (error) {
        setActionFeedback({ id: reportId, message: error.message, type: 'error' });
      } else {
        setActionFeedback({ id: reportId, message: `Report marked as ${newStatus}`, type: 'success' });
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, status: newStatus, reviewed_by: user?.id || null } : r
          )
        );
      }
    } catch (err: any) {
      setActionFeedback({ id: reportId, message: err.message, type: 'error' });
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleTakeDown = async (reportId: string, listingId: string) => {
    if (!window.confirm('Are you sure you want to take down and archive this listing?')) return;

    setIsProcessingId(reportId);
    setActionFeedback(null);
    try {
      const { error } = await takeDownReportedListing(listingId, reportId, user?.id || 'moderator');
      if (error) {
        setActionFeedback({ id: reportId, message: error.message, type: 'error' });
      } else {
        deleteProduct(listingId);
        setActionFeedback({
          id: reportId,
          message: 'Listing successfully taken down and archived. Report resolved.',
          type: 'success',
        });
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, status: 'resolved', reviewed_by: user?.id || null } : r
          )
        );
      }
    } catch (err: any) {
      setActionFeedback({ id: reportId, message: err.message, type: 'error' });
    } finally {
      setIsProcessingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs">
          <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Campus Moderation Panel</h2>
          <p className="text-xs text-slate-500 mb-6">
            Sign in with an authorized campus moderator or admin student account to inspect community reports.
          </p>
          <button
            onClick={() => openAuthModal('signin')}
            className="px-6 py-2.5 bg-[#064E3B] text-white text-xs font-semibold rounded-full shadow-xs cursor-pointer"
          >
            Sign In to Moderate
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md shadow-xs">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Moderator Authorization Required</h2>
          <p className="text-xs text-slate-500 mb-6">
            The Content Moderation Panel is restricted to authorized campus student moderators and staff. Your current account ({user.email}) does not have moderator privileges.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-2.5 bg-[#064E3B] text-white text-xs font-semibold rounded-full shadow-xs"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-200">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Campus Content Moderation
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Review flagged items, enforce campus prohibited item guidelines, and resolve scam reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadReports}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              Refresh Reports
            </button>
          </div>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6">
          {(['pending', 'under_review', 'resolved', 'dismissed', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all capitalize ${
                statusFilter === st
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Reports Table / Card List */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
            Loading campus reports...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2 opacity-70" />
            <h3 className="text-sm font-bold text-slate-800">No reports in this queue</h3>
            <p className="text-xs text-slate-400 mt-1">All reports with status "{statusFilter}" have been reviewed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const product = products.find((p) => p.id === report.listing_id);
              const isProcessing = isProcessingId === report.id;
              const feedback = actionFeedback?.id === report.id ? actionFeedback : null;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                        {product?.images[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                            No image
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              report.reason === 'prohibited_item'
                                ? 'bg-rose-100 text-rose-800'
                                : report.reason === 'scam_fake'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {report.reason.replace('_', ' ')}
                          </span>

                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              report.status === 'pending'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : report.status === 'under_review'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : report.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {report.status ? report.status.toUpperCase() : 'PENDING'}
                          </span>

                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatReportDate(report.created_at)}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">
                          {product ? product.title : `Listing ID: ${report.listing_id.slice(0, 8)}...`}
                        </h3>

                        {product && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Category: {product.category} • Price: ₹{product.price.toLocaleString('en-IN')} • Seller: {product.seller.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {product && (
                        <Link
                          to={`/product/${product.id}`}
                          target="_blank"
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Listing</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Report Context / Reporter Explanation */}
                  {report.explanation && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">Reporter's Note:</span>
                      <p className="text-slate-600 italic whitespace-pre-wrap">"{report.explanation}"</p>
                    </div>
                  )}

                  {/* Feedback Banner */}
                  {feedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                        feedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                      <span>{feedback.message}</span>
                    </div>
                  )}

                  {/* Moderation Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      Report ID: {report.id.slice(0, 8)}
                    </span>

                    <div className="flex items-center gap-2">
                      {report.status !== 'under_review' && report.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'under_review')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition-colors"
                        >
                          Mark Under Review
                        </button>
                      )}

                      {report.status !== 'dismissed' && report.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'dismissed', 'Dismissed as false report or compliant item.')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Dismiss Report
                        </button>
                      )}

                      {report.status !== 'resolved' && (
                        <button
                          onClick={() => handleTakeDown(report.id, report.listing_id)}
                          disabled={isProcessing}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Take Down Listing</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
