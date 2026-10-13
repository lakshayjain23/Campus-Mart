import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, FileText, AlertTriangle, ArrowLeft } from 'lucide-react';

export const TermsPage: React.FC = () => {
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
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Campus Mart Legal & Guidelines</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Last updated: October 2026 • Community guidelines for student buyers and sellers
            </p>
          </div>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">1</span>
              <span>Platform Role & Peer Exchange</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Campus Mart is an independent, student-to-student community marketplace platform designed to facilitate local peer exchanges within universities and college campuses. Campus Mart does not own, manufacture, inspect, or hold custody of items listed by users. Transactions are conducted in-person directly between students.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">2</span>
              <span>Eligibility & Student Verification</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              To list an item or make enquiries on Campus Mart, users must be active students, faculty, or registered campus residents of an affiliated educational institute. Users must provide truthful student details and adhere to their respective university code of conduct.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">3</span>
              <span>Zero Commission & Pricing Policy</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Campus Mart charges <strong>0% platform commission</strong> to student sellers. Sellers keep 100% of their selling price. Prices must be quoted in Indian Rupees (₹) and accurately represent the final agreed amount without hidden handover charges.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">4</span>
              <span>Prohibited Items & Content</span>
            </h2>
            <div className="bg-red-50/70 border border-red-200 rounded-xl p-4 text-xs text-red-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-red-800">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>Strictly Prohibited on Campus Mart:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                <li>Weapons, explosives, hazardous chemicals, or prohibited substances.</li>
                <li>Alcohol, tobacco, vapes, or non-prescribed medicines.</li>
                <li>Stolen property or university property not authorized for resale.</li>
                <li>Exam leak papers, academic fraud materials, or counterfeit currency.</li>
                <li>Inappropriate, offensive, or copyright-infringing digital media.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">5</span>
              <span>In-Person Inspection & Payments</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Buyers must inspect items thoroughly in person prior to transferring funds. Campus Mart does not operate an escrow or middleman payment processor. All payments should be made via direct UPI or cash only upon physical verification of the item at the agreed public campus spot.
            </p>
          </section>

          {/* Bottom Help */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-950">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>Questions regarding our community terms or university guidelines?</span>
            </div>
            <Link
              to="/contact"
              className="px-4 py-2 bg-[#064E3B] text-white rounded-lg font-semibold whitespace-nowrap hover:bg-[#15803D] transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
