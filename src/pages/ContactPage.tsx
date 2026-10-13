import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Clock,
  Send,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  Building2,
  Loader2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { submitContactInquiry } from '../lib/supabase';

export const ContactPage: React.FC = () => {
  const { selectedCampus, campuses } = useMarketplace();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState(selectedCampus !== 'All Campuses' ? selectedCampus : 'IIT Delhi - Main Campus');
  const [subject, setSubject] = useState('General Student Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await submitContactInquiry({
        name: name.trim(),
        email: email.trim(),
        college,
        subject,
        message: message.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setSubmitError(err?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      q: 'How does item handover work on campus?',
      a: 'When you make an enquiry or reserve an item, you and the fellow student seller agree on a convenient public campus venue (such as the Central Library, SAC, or department canteen). You inspect the product in person and complete payment via direct UPI.',
    },
    {
      q: 'Are there any platform charges or listing fees?',
      a: 'No. Campus Mart is completely free for university students. There are zero listing fees, zero buyer markups, and zero commission cuts.',
    },
    {
      q: 'Can I sell student-made art, crafts, or 3D prints?',
      a: 'Yes! Campus Mart features a dedicated "Student-Created Products" category specifically supporting student entrepreneurs, campus clubs, and makers.',
    },
    {
      q: 'What should I do if a student seller does not show up?',
      a: 'You can message the student via the enquiry thread to reschedule or cancel your reservation. No money is ever transferred upfront, so your funds remain 100% safe.',
    },
    {
      q: 'How can I become a Campus Ambassador for my college?',
      a: 'Select "Campus Ambassador Program" in the contact form below and share your student details. Ambassadors help onboard their hostels and student clubs!',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
            We're Here For You
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-1">
            Contact & Campus Support
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Have questions, feedback, or need help with a campus listing? Reach out to the student support team.
          </p>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Campus Support Email</p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">support@campusmart.local</p>
              <p className="text-[11px] text-slate-400 mt-1">Average response within 2-4 hrs</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Active Campuses</p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">IIT Delhi, DTU, NSUT, BITS & more</p>
              <p className="text-[11px] text-slate-400 mt-1">Expanding across India</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Support Hours</p>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">Mon – Sat: 9:00 AM – 9:00 PM</p>
              <p className="text-[11px] text-slate-400 mt-1">Student volunteer coordinators</p>
            </div>
          </div>
        </div>

        {/* Two-Column Form & FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Contact Form (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Send Us a Message</h3>
                  <p className="text-xs text-slate-500">We'll respond to your college email.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Your Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      College Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. student@campus.edu"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Select Your College / Campus
                    </label>
                    <select
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {campuses.filter((c) => c !== 'All Campuses').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Inquiry Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="General Student Inquiry">General Student Inquiry</option>
                      <option value="Listing Help / Bug Report">Listing Help / Bug Report</option>
                      <option value="Report a Suspicious Item">Report a Suspicious Item</option>
                      <option value="Campus Ambassador Program">Campus Ambassador Program</option>
                      <option value="Add a New College">Request New College Integration</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Your Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe how we can help you or what issue you encountered on campus..."
                    className="w-full p-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#064E3B] hover:bg-[#15803D] disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 text-emerald-300 animate-spin" />
                      <span>Saving to Supabase Backend...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#22C55E]" />
                      <span>Submit Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Message Received!</h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-semibold">
                  <Database className="w-3.5 h-3.5" />
                  <span>Saved to Supabase Backend</span>
                </div>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  Thank you, <strong className="text-slate-800">{name}</strong>. Your ticket regarding "<em>{subject}</em>" has been securely stored in our Supabase database. A student coordinator will follow up at <strong className="text-slate-800">{email}</strong>.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Send Another Message
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: FAQs (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-700" />
              <h3 className="text-base font-bold text-slate-900">Frequently Asked Questions</h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {faqs.map((faq, idx) => (
                <div key={idx} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left font-bold text-slate-800 flex items-center justify-between gap-2 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                        openFaq === idx ? 'rotate-180 text-emerald-700' : ''
                      }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <p className="text-slate-600 mt-2 leading-relaxed animate-in fade-in duration-150">
                      {faq.a}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
              Need urgent assistance with a campus item? Check our{' '}
              <Link to="/safety" className="text-emerald-700 font-bold hover:underline">
                Safety Guidelines
              </Link>{' '}
              for best practices.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
