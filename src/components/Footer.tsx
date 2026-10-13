import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShieldCheck, Heart, MapPin, Mail, Sparkles, MessageSquare } from 'lucide-react';
import { CATEGORIES } from '../data/mockProducts';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-24 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#15803D] text-white flex items-center justify-center shadow-sm">
                <Package className="w-5 h-5 text-emerald-100" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                Campus<span className="text-[#22C55E]">Mart</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Your Campus. Your Marketplace. A student-led platform built to make university living affordable, convenient, and connected through safe peer-to-peer exchange.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 p-2.5 rounded-lg max-w-sm">
              <ShieldCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
              <span>Campus Verified: 100% Student-to-student transactions</span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Marketplace
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/explore?category=${encodeURIComponent(cat.name)}`}
                    className="hover:text-emerald-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Campus Safety */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Campus Guidelines
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Meet at public spots (SAC, Library lawn, Hostel lobby)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Inspect items thoroughly in daylight</span>
              </li>
              <li className="flex items-start gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Pay via UPI only after checking condition</span>
              </li>
              <li className="pt-1">
                <Link to="/safety" className="text-emerald-400 hover:underline font-semibold block">
                  Read Full Safety Guidelines →
                </Link>
              </li>
              <li>
                <Link to="/sell" className="text-emerald-400 hover:underline">
                  Become a Student Seller →
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Help */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Support & Community
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <span className="text-slate-500 text-[11px] block">Campus Support Email:</span>
                <a
                  href="mailto:support@campusmart.local"
                  className="flex items-center gap-1.5 text-slate-300 hover:text-emerald-400 font-medium transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-400" />
                  support@campusmart.local
                </a>
              </li>
              <li className="pt-1">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact Support & FAQs →</span>
                </Link>
              </li>
              <li className="pt-2">
                <span className="text-slate-500 text-[11px] block">Active Campuses:</span>
                <span className="text-slate-300 font-medium text-xs">IIT Delhi, DTU, NSUT, BITS & more</span>
              </li>
              <li className="pt-2">
                <span className="inline-block bg-slate-800 text-slate-300 text-[11px] px-2 py-1 rounded">
                  v1.2.0 • Student Release
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar with clickable links */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Campus Mart. Built with <Heart className="w-3 h-3 text-red-500 inline fill-red-500" /> for the student community.</p>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/safety" className="hover:text-emerald-400 transition-colors">
              Safety Guidelines
            </Link>
            <Link to="/contact" className="hover:text-emerald-400 transition-colors">
              Contact & Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
