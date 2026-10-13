import React, { useState } from 'react';
import { X, Send, CheckCircle2, ShieldCheck, MapPin, Clock, Loader2, Database, AlertCircle } from 'lucide-react';
import type { Product } from '../types/product';
import { submitProductEnquiry } from '../lib/supabase';

interface EnquiryModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_MESSAGES = [
  'Hi! Is this item still available?',
  'Can we meet near the Campus Library?',
  'Is the price slightly negotiable?',
  'Can I inspect the condition today before paying?',
];

export const EnquiryModal: React.FC<EnquiryModalProps> = ({ product, isOpen, onClose }) => {
  const [message, setMessage] = useState('');
  const [preferredMeetup, setPreferredMeetup] = useState(product.pickupLocation);
  const [shareContactConsent, setShareContactConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await submitProductEnquiry({
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        sellerId: product.seller.id,
        sellerName: product.seller.name,
        message: message.trim(),
        preferredMeetup: preferredMeetup.trim(),
        shareContactConsent,
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit product enquiry to Supabase:', err);
      setError(err?.message || 'Could not send enquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setMessage('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-auto">
        <button
          onClick={handleReset}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {!submitted ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Make an Enquiry</h3>
                <p className="text-xs text-slate-500">Contact verified student seller privately</p>
              </div>
            </div>

            {/* Product summary card */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 mb-4">
              <img
                src={product.images[0]}
                alt={product.title}
                className="w-14 h-14 rounded-lg object-cover bg-white shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-800 truncate">{product.title}</h4>
                <p className="text-xs font-bold text-emerald-800">₹{product.price.toLocaleString('en-IN')}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Seller replies {product.seller.responseTime}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Quick suggestion chips */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Quick Prompts:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_MESSAGES.map((msg, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMessage(msg)}
                      className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full transition-colors text-left"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message text area */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your question or preferred meeting schedule..."
                  className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#15803D]/20 focus:border-[#15803D]"
                />
              </div>

              {/* Preferred meetup location */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Proposed Meetup Spot:
                </label>
                <input
                  type="text"
                  value={preferredMeetup}
                  onChange={(e) => setPreferredMeetup(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#15803D]"
                />
              </div>

              {/* Privacy protection note */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900 space-y-2">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Privacy First:</span> Phone numbers remain hidden until both student parties confirm meeting time and location.
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={shareContactConsent}
                    onChange={(e) => setShareContactConsent(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                  />
                  <span>Allow verified student seller {product.seller.name} to message me back via Campus Mart</span>
                </label>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit CTA */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!message.trim() || isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-[#15803D] hover:bg-[#064E3B] disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Enquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Success feedback */
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Enquiry Sent Successfully!</h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-semibold">
                <Database className="w-3.5 h-3.5" />
                <span>Saved to Supabase Backend</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-sm mx-auto">
                We’ve recorded your enquiry in Supabase and notified <span className="font-semibold text-slate-800">{product.seller.name}</span> ({product.seller.department}).
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 max-w-sm mx-auto text-left">
              <p>• Expected response: <span className="font-medium text-slate-700">{product.seller.responseTime}</span></p>
              <p>• Meeting venue: <span className="font-medium text-slate-700">{preferredMeetup}</span></p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">✓ Logged in Supabase product_enquiries table</p>
            </div>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
