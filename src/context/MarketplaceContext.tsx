import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, CartItem } from '../types/product';
import { MOCK_PRODUCTS, CAMPUS_OPTIONS } from '../data/mockProducts';
import {
  createProductListing,
  addCampusToBackend,
  fetchCampusesFromBackend,
  fetchProductsFromBackend,
  fetchUserWishlist,
  addToUserWishlist,
  removeFromUserWishlist,
  clearUserWishlist,
} from '../lib/supabase';
import { useAuth } from './AuthContext';

interface MarketplaceContextType {
  products: Product[];
  wishlist: string[];
  cart: CartItem[];
  campuses: string[];
  selectedCampus: string;
  searchQuery: string;
  isCollegeModalOpen: boolean;
  setIsCollegeModalOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => Promise<void> | void;
  clearWishlist: () => Promise<void> | void;
  isInWishlist: (productId: string) => boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  addProduct: (productData: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  setSelectedCampus: (campus: string) => void;
  addCampus: (newCampus: string) => void;
  setSearchQuery: (query: string) => void;
  cartCount: number;
  wishlistCount: number;
  cartTotal: number;
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, openAuthModal } = useAuth();

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

  // Authenticated Wishlist: strictly empty for logged out sessions
  const [wishlist, setWishlist] = useState<string[]>([]);

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

  // Synchronize authenticated user wishlist with Supabase backend
  useEffect(() => {
    // Purge legacy shared wishlist key if lingering in browser storage
    try {
      localStorage.removeItem('campusmart_wishlist');
    } catch {
      // ignore
    }

    let isMounted = true;

    if (!user) {
      // Logged out: immediately clear client-side state
      setWishlist([]);
      return;
    }

    // Authenticated: load signed-in user's wishlist from Supabase
    fetchUserWishlist(user.id).then((items) => {
      if (isMounted) {
        setWishlist(items);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

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

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      openAuthModal('signin');
      return;
    }

    const isCurrentlySaved = wishlist.includes(productId);

    if (isCurrentlySaved) {
      const res = await removeFromUserWishlist(user.id, productId);
      if (res.success) {
        setWishlist(prev => prev.filter(id => id !== productId));
      } else {
        console.error('Failed to remove item from wishlist:', res.error);
      }
    } else {
      const res = await addToUserWishlist(user.id, productId);
      if (res.success) {
        setWishlist(prev => (prev.includes(productId) ? prev : [...prev, productId]));
      } else {
        console.error('Failed to add item to wishlist:', res.error);
      }
    }
  };

  const clearWishlist = async () => {
    if (!user) {
      openAuthModal('signin');
      return;
    }

    const res = await clearUserWishlist(user.id);
    if (res.success) {
      setWishlist([]);
    } else {
      console.error('Failed to clear wishlist:', res.error);
    }
  };

  const isInWishlist = (productId: string) => {
    if (!user) return false;
    return wishlist.includes(productId);
  };

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
    const expiresAt = productData.expiresAt || new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: expiresAt,
      status: productData.status || 'available',
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

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p))
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistCount = user ? wishlist.length : 0;
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
        clearWishlist,
        isInWishlist,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        addProduct,
        updateProduct,
        deleteProduct,
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
