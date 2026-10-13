import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem } from '../types/product';
import { MOCK_PRODUCTS, CAMPUS_OPTIONS } from '../data/mockProducts';
import {
  createProductListing,
  addCampusToBackend,
  fetchCampusesFromBackend,
  fetchProductsFromBackend,
} from '../lib/supabase';

interface MarketplaceContextType {
  products: Product[];
  wishlist: string[];
  cart: CartItem[];
  campuses: string[];
  selectedCampus: string;
  searchQuery: string;
  isCollegeModalOpen: boolean;
  setIsCollegeModalOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Product;
  setSelectedCampus: (campus: string) => void;
  addCampus: (newCampus: string) => void;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  cartTotal: number;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Campuses list with local storage persistence
  const [campuses, setCampuses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('campusmart_campuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure defaults are present
        const combined = Array.from(new Set([...CAMPUS_OPTIONS, ...parsed]));
        return combined;
      }
    } catch {
      // fallback
    }
    return CAMPUS_OPTIONS;
  });

  // Campus selection
  const [selectedCampus, setSelectedCampus] = useState<string>(() => {
    return localStorage.getItem('campusmart_selected_campus') || 'All Campuses';
  });

  // Global College Selector Modal state
  const [isCollegeModalOpen, setIsCollegeModalOpen] = useState<boolean>(false);

  // Products with local storage persistence
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('campusmart_custom_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        return [...parsed, ...MOCK_PRODUCTS];
      }
    } catch {
      // fallback
    }
    return MOCK_PRODUCTS;
  });

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('campusmart_wishlist');
      return saved ? JSON.parse(saved) : ['prod-01', 'prod-04'];
    } catch {
      return ['prod-01', 'prod-04'];
    }
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('campusmart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Global search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Persist campuses
  useEffect(() => {
    try {
      localStorage.setItem('campusmart_campuses', JSON.stringify(campuses));
    } catch {
      // ignore
    }
  }, [campuses]);

  // Persist wishlist
  useEffect(() => {
    try {
      localStorage.setItem('campusmart_wishlist', JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('campusmart_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Persist selected campus
  useEffect(() => {
    try {
      localStorage.setItem('campusmart_selected_campus', selectedCampus);
    } catch {
      // ignore
    }
  }, [selectedCampus]);

  // Sync from Supabase backend on mount
  useEffect(() => {
    let isMounted = true;

    async function syncFromBackend() {
      try {
        const [backendCampuses, backendProducts] = await Promise.all([
          fetchCampusesFromBackend(),
          fetchProductsFromBackend(),
        ]);

        if (!isMounted) return;

        if (backendCampuses && backendCampuses.length > 0) {
          setCampuses((prev) => Array.from(new Set([...prev, ...backendCampuses])));
        }

        if (backendProducts && backendProducts.length > 0) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = backendProducts.filter((p) => !existingIds.has(p.id));
            return [...newItems, ...prev];
          });
        }
      } catch (err) {
        console.warn('Supabase sync warning:', err);
      }
    }

    syncFromBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  const addCampus = (newCampusName: string) => {
    const trimmed = newCampusName.trim();
    if (!trimmed) return;

    // Save to Supabase backend
    addCampusToBackend(trimmed).catch((err) => {
      console.warn('Error syncing campus to Supabase:', err);
    });

    if (!campuses.includes(trimmed)) {
      const updated = [...campuses, trimmed];
      setCampuses(updated);
      setSelectedCampus(trimmed);
      try {
        localStorage.setItem('campusmart_campuses', JSON.stringify(updated));
      } catch {
        // ignore
      }
    } else {
      setSelectedCampus(trimmed);
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newId = `custom-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      isRecent: true,
      inStock: true,
    };

    // Save to Supabase backend
    createProductListing(newProduct).catch((err) => {
      console.error('Error saving product listing to Supabase:', err);
    });

    setProducts(prev => {
      const updated = [newProduct, ...prev];
      try {
        const customItems = updated.filter(p => p.id.startsWith('custom-'));
        localStorage.setItem('campusmart_custom_products', JSON.stringify(customItems));
      } catch {
        // ignore
      }
      return updated;
    });

    return newProduct;
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = wishlist.length;
  const cartTotal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  return (
    <MarketplaceContext.Provider
      value={{
        products,
        wishlist,
        cart,
        campuses,
        selectedCampus,
        searchQuery,
        isCollegeModalOpen,
        setIsCollegeModalOpen,
        toggleWishlist,
        isInWishlist,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        addProduct,
        setSelectedCampus,
        addCampus,
        setSearchQuery,
        cartCount,
        wishlistCount,
        cartTotal,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplace = () => {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
};
