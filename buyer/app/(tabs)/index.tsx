import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, RefreshControl, TextInput, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { Search, ShoppingCart, Heart, RefreshCw, Moon, Sun } from 'lucide-react-native';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  image_url: string;
  is_approved: boolean;
  is_available: boolean;
  farmer_id: number;
  created_at: string;
  updated_at: string;
  farmer_name: string;
}

const categories = [
  { id: 'all', name: 'All' },
  { id: 'vegetables', name: 'Vegetables' },
  { id: 'fruits', name: 'Fruits' },
  { id: 'grains', name: 'Grains' },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const { addToCart, totalItems } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Check authentication and redirect if needed
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, authLoading]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const fetchProducts = async () => {
    try {
      console.log("API URL:", process.env.EXPO_PUBLIC_API_URL);
      
      const url = new URL(`${process.env.EXPO_PUBLIC_API_URL}/api/products`);
      if (selectedCategory !== 'all') {
        url.searchParams.append('category', selectedCategory);
      }
      
      if (searchQuery) {
        url.searchParams.append('search', searchQuery);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        console.error('API error:', await response.text());
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Products fetched:", data.products?.length || 0);
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);
  
  // Debounced search
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        fetchProducts();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [selectedCategory, searchQuery]);

  const handleAddToCart = (product: Product) => {
    // Remove from wishlist if present
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    }
    
    // Add to cart
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      unit: product.unit,
      imageUrl: product.image_url,
      farmerId: product.farmer_id,
      farmerName: product.farmer_name
    });
  };
  
  const toggleWishlist = (product: Product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        imageUrl: product.image_url,
        farmerId: product.farmer_id,
        farmerName: product.farmer_name
      });
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]} 
      onLayout={onLayoutRootView}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>Explore</Text>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.background }]}
              onPress={toggleTheme}
            >
              {isDarkMode ? (
                <Sun size={20} color={colors.text} />
              ) : (
                <Moon size={20} color={colors.text} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.background }]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <RefreshCw size={20} color={colors.text} />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cartButton, { backgroundColor: colors.background }]}
              onPress={() => router.push('/(tabs)/cart')}
            >
              <ShoppingCart size={24} color={colors.text} />
              {totalItems > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalItems}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={[styles.searchBar, { backgroundColor: colors.background }]}>
          <Search size={20} color={colors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={colors.secondary} style={styles.searchSpinner} />
          )}
        </View>
      </View>
      
      <View style={[styles.categories, { backgroundColor: colors.card }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryItem,
                { backgroundColor: isDarkMode ? '#2c2c2c' : '#f5f5f5' },
                selectedCategory === category.id && 
                  [styles.categorySelected, { backgroundColor: colors.primary }]
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={[
                styles.categoryText,
                { color: colors.secondary },
                selectedCategory === category.id && 
                  [styles.categoryTextSelected, { color: isDarkMode ? colors.text : '#fff' }]
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.secondary }]}>No products found</Text>
        </View>
      ) : (
        <View style={styles.productsGrid}>
          {products.map((product) => (
            <View key={product.id} style={[styles.productCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                style={[styles.wishlistButton, { backgroundColor: colors.card }]}
                onPress={() => toggleWishlist(product)}
              >
                <Heart 
                  size={18} 
                  color={isInWishlist(product.id) ? "#FF4D4F" : colors.secondary}
                  fill={isInWishlist(product.id) ? "#FF4D4F" : "none"}
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.productCardTouchable}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <Image 
                  source={{ uri: product.image_url }}
                  style={styles.productImage}
                />
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, { color: colors.text }]}>{product.name}</Text>
                  <Text style={[styles.productPrice, { color: colors.text }]}>₹{product.price}/{product.unit}</Text>
                  <Text style={[styles.farmerName, { color: colors.secondary }]}>{product.farmer_name}</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.addToCartButton, { backgroundColor: colors.primary }]}
                onPress={() => handleAddToCart(product)}
              >
                <ShoppingCart size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4D4F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  searchSpinner: {
    marginLeft: 8,
  },
  categories: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categorySelected: {
    backgroundColor: '#1a1a1a',
  },
  categoryText: {
    fontFamily: 'Inter_400Regular',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: '#666',
  },
  productsGrid: {
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  productCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: '1.5%',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  productCardTouchable: {
    width: '100%',
  },
  wishlistButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 4,
  },
  productPrice: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  farmerName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
  addToCartButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#1a1a1a',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});