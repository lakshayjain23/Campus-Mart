import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, PlusCircle, Heart, ShoppingBag } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { wishlistCount, cartCount } = useMarketplace();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Sell', path: '/sell', icon: PlusCircle, isHighlight: true },
    { label: 'Saved', path: '/wishlist', icon: Heart, badge: wishlistCount },
    { label: 'Cart', path: '/cart', icon: ShoppingBag, badge: cartCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden pb-safe">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isHighlight) {
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center justify-center -mt-5"
              >
                <div className="w-12 h-12 rounded-full bg-[#15803D] hover:bg-[#064E3B] text-white flex items-center justify-center shadow-lg border-2 border-white transition-transform active:scale-95">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-800 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex flex-col items-center justify-center py-1 transition-colors relative ${
                isActive ? 'text-[#064E3B] font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
