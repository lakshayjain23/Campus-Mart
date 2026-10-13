import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Sun, CheckCircle2, AlertOctagon, ArrowLeft, QrCode } from 'lucide-react';

export const SafetyGuidelinesPage: React.FC = () => {
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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Campus Trust & Safe Handovers</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Campus Safety Guidelines
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Essential tips for smooth, risk-free in-person exchanges across your college campus
            </p>
          </div>

          {/* Golden Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <MapPin className="w-4 h-4 text-emerald-700" />
                <span>Meet in Designated Public Campus Spots</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Always arrange handovers in busy, well-lit university locations such as the Student Activity Center (SAC), Central Library Lawn, department canteens, or hostel visitor lounges.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <Sun className="w-4 h-4 text-emerald-700" />
                <span>Prefer Daylight Hours</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Plan meetups between classes or during afternoon hours (10:00 AM – 7:00 PM). Avoid isolated campus corners or late-night meetings outside university gates.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Inspect Condition Thoroughly Before Paying</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                For electronics (calculators, headphones, monitors), turn them on and test functionality on the spot. For books, check for missing pages or syllabus editions.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span>Pay via Direct UPI at Handover</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Never send advance booking deposits to anyone claiming to hold the item. Scan the seller's UPI QR code only after you have physically received and inspected the item.
              </p>
            </div>
          </div>

          {/* Red Flags / Phishing Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-sm">
              <AlertOctagon className="w-5 h-5 text-amber-700 shrink-0" />
              <span>Watch Out For These Red Flags:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-amber-950 list-disc list-inside pl-1">
              <li>Anyone asking for advance payment or "courier charges" for an item on the same campus.</li>
              <li>Requests to click suspicious payment links or enter UPI PINs to "receive money" (UPI PIN is ONLY for sending money!).</li>
              <li>Refusal to meet inside campus premises or insisting on meeting in isolated off-campus areas.</li>
              <li>Profiles that avoid sharing student department or hostel details.</li>
            </ul>
          </div>

          {/* Need help? */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-bold text-slate-900">Spotted suspicious behavior or a scam listing?</p>
              <p className="text-slate-500">Report it immediately to keep your university campus safe.</p>
            </div>
            <Link
              to="/contact"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold whitespace-nowrap transition-colors"
            >
              Report an Issue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
