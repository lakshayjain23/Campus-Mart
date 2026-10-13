import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Search, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full p-8 sm:p-10 rounded-3xl border border-slate-200 text-center shadow-lg space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100">
          <HelpCircle className="w-8 h-8 text-emerald-700" />
        </div>

        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            404 Error
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
            The page or listing you are looking for does not exist, has expired, or has moved to another address.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/explore"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#064E3B] hover:bg-[#15803D] text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Browse Listings</span>
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
