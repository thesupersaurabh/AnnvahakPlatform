import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, RefreshControl, ScrollView, TextInput } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Plus, Search, Filter, ChevronDown, AlertTriangle } from 'lucide-react-native';
import { productService } from '../../services/productService';

interface Product {
  id: string | number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  image_url: string;
  is_approved: boolean;
  is_available: boolean;
}

export default function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'price' | 'name'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { colors, isDarkMode } = useTheme();
  const { token, isAuthenticated } = useAuth();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const fetchProducts = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError(null);
    
    try {
      // Use the farmer-specific products endpoint since we're in the farmer's dashboard
      const response = await productService.getProductsByFarmer(token);
      
      if (response.success && response.data.products) {
        const products = response.data.products;
        console.log(`Farmer products fetched: ${products.length}`);
        
        // Map API response to the Product interface used in this component
        const mappedProducts = products.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || 'Uncategorized',
          price: item.price,
          quantity: item.quantity || item.stock || 0,
          unit: item.unit || 'kg', // Default unit if not provided
          image_url: item.image_url || item.imageUrl || 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=AnnVahak+Seller',
          is_approved: item.is_approved || false,
          is_available: item.is_available || false
        }));
        
        setProducts(mappedProducts);
        setFilteredProducts(mappedProducts);
      } else {
        setError(response.message || 'Failed to load products');
        console.error('Error loading farmer products:', response.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token, fetchProducts]);

  useEffect(() => {
    // Apply filters and sorting
    let result = [...products];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.category.toLowerCase().includes(query)
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      result = result.filter(product => product.category === categoryFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'price') {
        return a.price - b.price;
      } else {
        return 0;
      }
    });
    
    setFilteredProducts(result);
  }, [products, categoryFilter, sortBy, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  const getStatusColor = (isApproved: boolean, isAvailable: boolean) => {
    if (!isApproved) return '#FFC107'; // Pending
    if (!isAvailable) return '#9E9E9E'; // Unavailable
    return '#4CAF50'; // Active
  };

  const getStatusText = (isApproved: boolean, isAvailable: boolean) => {
    if (!isApproved) return 'Pending';
    if (!isAvailable) return 'Unavailable';
    return 'Active';
  };

  const navigateToAddProduct = () => {
    router.push('/product/create');
  };

  // Extract unique categories from products
  const categories = [...new Set(products.map(product => product.category))];

  if (!fontsLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Products</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>Please login to view your products</Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Products</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.messageText, { color: colors.text, marginTop: 15 }]}>Loading products...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Your Products</Text>
        </View>
        <View style={styles.centerContainer}>
          <AlertTriangle size={40} color="#F44336" />
          <Text style={[styles.messageText, { color: colors.text, marginTop: 15 }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={fetchProducts}
          >
            <Text style={styles.loginButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.text }]}>Your Products</Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={navigateToAddProduct}
          >
            <Plus size={18} color="#FFF" />
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Search size={18} color={colors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        {/* Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            <TouchableOpacity 
              style={[
                styles.categoryPill, 
                { backgroundColor: categoryFilter === null ? colors.primary : `${colors.primary}20` }
              ]}
              onPress={() => setCategoryFilter(null)}
            >
              <Text 
                style={[
                  styles.categoryText, 
                  { color: categoryFilter === null ? '#fff' : colors.primary }
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            
            {categories.map(category => (
              <TouchableOpacity 
                key={category}
                style={[
                  styles.categoryPill, 
                  { backgroundColor: categoryFilter === category ? colors.primary : `${colors.primary}20` }
                ]}
                onPress={() => setCategoryFilter(category)}
              >
                <Text 
                  style={[
                    styles.categoryText, 
                    { color: categoryFilter === category ? '#fff' : colors.primary }
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity 
            style={[styles.sortButton, { backgroundColor: colors.card }]}
            onPress={() => {
              // Toggle between name and price sorting
              setSortBy(sortBy === 'name' ? 'price' : 'name');
            }}
          >
            <Filter size={14} color={colors.text} />
            <Text style={[styles.sortText, { color: colors.text }]}>
              Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
            </Text>
            <ChevronDown size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.productCard, { backgroundColor: colors.card }]}
            onPress={() => router.push(`/product/${item.id}`)}
          >
            <Image
              source={{ uri: item.image_url }}
              style={styles.productImage}
              resizeMode="cover"
            />
            <View style={styles.productInfo}>
              <View style={styles.productNameRow}>
                <Text style={[styles.productName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <View 
                  style={[
                    styles.statusBadge, 
                    { backgroundColor: `${getStatusColor(item.is_approved, item.is_available)}20` }
                  ]}
                >
                  <Text 
                    style={[styles.statusText, { color: getStatusColor(item.is_approved, item.is_available) }]}
                  >
                    {getStatusText(item.is_approved, item.is_available)}
                  </Text>
                </View>
              </View>
              
              <Text style={[styles.categoryLabel, { color: colors.secondary }]}>
                {item.category}
              </Text>
              
              <View style={styles.productDetails}>
                <Text style={[styles.productPrice, { color: colors.text }]}>
                  ₹{item.price}/{item.unit}
                </Text>
                <Text style={[styles.stockLabel, { color: colors.secondary }]}>
                  Stock: {item.quantity} {item.unit}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {products.length === 0 
                ? "You don't have any products yet. Add your first product!" 
                : "No products match your filters."}
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={navigateToAddProduct}
            >
              <Plus size={16} color="#FFF" style={styles.emptyButtonIcon} />
              <Text style={styles.emptyButtonText}>
                Add Product
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
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
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontFamily: 'Inter_600SemiBold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    height: 24,
  },
  searchText: {
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoriesScroll: {
    flex: 1,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  sortText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginHorizontal: 4,
  },
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  productCard: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productInfo: {
    flex: 1,
    padding: 12,
  },
  productNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  stockLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    borderRadius: 12,
    padding: 16,
    width: 200,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyButtonIcon: {
    marginRight: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
}); 