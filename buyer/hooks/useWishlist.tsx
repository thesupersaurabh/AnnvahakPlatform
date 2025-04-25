import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  farmerId: number;
  farmerName: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  clearWishlist: () => void;
  isLoading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load wishlist data from storage on app start
  useEffect(() => {
    const loadWishlistData = async () => {
      try {
        const wishlistData = await AsyncStorage.getItem('wishlistItems');
        if (wishlistData) {
          setItems(JSON.parse(wishlistData));
        }
      } catch (error) {
        console.error('Error loading wishlist data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWishlistData();
  }, []);

  // Save to AsyncStorage whenever wishlist changes
  useEffect(() => {
    const saveWishlistData = async () => {
      try {
        await AsyncStorage.setItem('wishlistItems', JSON.stringify(items));
      } catch (error) {
        console.error('Error saving wishlist data', error);
      }
    };
    
    saveWishlistData();
  }, [items]);

  const addToWishlist = (item: WishlistItem) => {
    setItems(prevItems => {
      // Check if item already exists in wishlist
      const exists = prevItems.some(i => i.id === item.id);
      
      if (!exists) {
        return [...prevItems, item];
      }
      
      return prevItems;
    });
  };

  const removeFromWishlist = (id: number) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const isInWishlist = (id: number) => {
    return items.some(item => item.id === id);
  };

  const clearWishlist = () => {
    setItems([]);
    AsyncStorage.removeItem('wishlistItems');
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        isLoading
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
} 