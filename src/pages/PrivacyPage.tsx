import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, EyeOff, UserCheck, ArrowLeft, Mail } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Student Privacy & Data Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              How Campus Mart protects student identities, contact information, and campus data
            </p>
          </div>

          {/* Core Privacy Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <EyeOff className="w-5 h-5 text-emerald-700 mb-2" />
              <h3 className="font-bold text-slate-900 mb-1">Hidden Phone Numbers</h3>
              <p className="text-slate-600">
                Personal mobile numbers remain concealed by default. Enquiries are routed safely without exposing contact details.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <UserCheck className="w-5 h-5 text-emerald-700 mb-2" />
              <h3 className="font-bold text-slate-900 mb-1">Student-Only Access</h3>
              <p className="text-slate-600">
                Data is scoped to the university community. We do not sell or rent student emails to third-party ad networks.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <Lock className="w-5 h-5 text-emerald-700 mb-2" />
              <h3 className="font-bold text-slate-900 mb-1">Local Browser Storage</h3>
              <p className="text-slate-600">
                Cart and offline draft listings are stored securely on your device using local storage, while your wishlist is securely protected and associated with your authenticated student account.
              </p>
            </div>
          </div>

          {/* Section 1: Information Collected */}
          <section className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              When using Campus Mart, we collect only the necessary details required to coordinate peer exchanges:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700 text-xs">
              <li><strong>Student Profile:</strong> Name, enrolled college/institute, academic department, year, and hostel block for pickup routing.</li>
              <li><strong>Listing Data:</strong> Item title, description, price, condition, uploaded photos, and specified public meeting spot.</li>
              <li><strong>Enquiries:</strong> Messages exchanged regarding meetup times and item inquiries.</li>
            </ul>
          </section>

          {/* Section 2: How We Use Information */}
          <section className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">2. How Information is Used</h2>
            <p>
              Your information is exclusively used to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700 text-xs">
              <li>Display listings to fellow students on your campus.</li>
              <li>Facilitate mutual coordination between buyers and sellers for physical handovers.</li>
              <li>Maintain campus safety by ensuring transparent, verified identity badges.</li>
            </ul>
          </section>

          {/* Section 3: Data Deletion */}
          <section className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h2 className="text-base font-bold text-slate-900">3. Listing Removal & Data Rights</h2>
            <p>
              Sellers can remove or mark listings as sold at any time. When a listing is removed, it is immediately hidden from the marketplace search and catalog. If you wish to delete all local preferences and saved items, you can clear your browser storage or contact support.
            </p>
          </section>

          {/* Bottom Contact */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-4 h-4 text-emerald-700" />
              <span>Privacy Officer: <strong>privacy@campusmart.local</strong></span>
            </div>
            <Link to="/contact" className="text-emerald-700 font-bold hover:underline">
              Submit Inquiry →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
