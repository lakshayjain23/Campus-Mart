import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Laptop,
  Home,
  Shirt,
  Sparkles,
  PenTool,
  Dumbbell,
  Compass,
} from 'lucide-react';
import type { CategoryItem } from '../types/product';
import { useMarketplace } from '../context/MarketplaceContext';

interface CategoryCardProps {
  category: CategoryItem;
}

const iconMap: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-5 h-5 text-emerald-700" />,
  Laptop: <Laptop className="w-5 h-5 text-emerald-700" />,
  Home: <Home className="w-5 h-5 text-emerald-700" />,
  Shirt: <Shirt className="w-5 h-5 text-emerald-700" />,
  Sparkles: <Sparkles className="w-5 h-5 text-purple-600" />,
  PenTool: <PenTool className="w-5 h-5 text-emerald-700" />,
  Dumbbell: <Dumbbell className="w-5 h-5 text-emerald-700" />,
  Compass: <Compass className="w-5 h-5 text-emerald-700" />,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({ category }) => {
  const { products, selectedCampus } = useMarketplace();

  // Dynamically calculate actual product count for this category based on active marketplace state
  const actualListingCount = useMemo(() => {
    const relevantProducts = selectedCampus === 'All Campuses'
      ? products
      : products.filter(p => {
          const prefix = selectedCampus.split(' - ')[0].toLowerCase().trim();
          return p.campus.toLowerCase().includes(prefix) || p.campus.toLowerCase() === selectedCampus.toLowerCase();
        });

    return relevantProducts.filter(p => p.category === category.name).length;
  }, [products, selectedCampus, category.name]);

  return (
    <Link
      to={`/explore?category=${encodeURIComponent(category.name)}`}
      className="group relative flex flex-col items-center justify-between p-2 sm:p-3.5 bg-white rounded-xl border border-slate-200 hover:border-emerald-600/40 hover:shadow-md transition-all duration-200 text-center h-full min-h-[110px] sm:min-h-[125px]"
    >
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-50 group-hover:bg-emerald-50 border border-slate-100 group-hover:border-emerald-200 flex items-center justify-center mb-1.5 sm:mb-2 transition-colors duration-200 shrink-0">
        {iconMap[category.iconName] || <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />}
      </div>
      <div className="flex-1 flex items-center justify-center w-full my-1 px-0.5">
        <h4 className="font-semibold text-slate-800 text-[11px] sm:text-xs md:text-sm group-hover:text-emerald-800 transition-colors leading-tight sm:leading-snug text-center break-words hyphens-auto">
          {category.name}
        </h4>
      </div>
      <p className="text-[10px] sm:text-xs text-slate-500 mt-auto font-medium shrink-0">
        {actualListingCount} {actualListingCount === 1 ? 'item' : 'items'}
      </p>
    </Link>
  );
};
