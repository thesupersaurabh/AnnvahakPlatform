import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Edit } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Stack } from 'expo-router';
import { api, endpoints } from '../../utils/api';

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
  farmer_phone: string;
}

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { token, isAuthenticated, user } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ product: Product }>(
        endpoints.products.details(id as string)
      );
      
      if (response.success && response.data && response.data.product) {
        setProduct(response.data.product);
      } else {
        Alert.alert('Error', response.message || 'Failed to load product details');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', error.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = () => {
    if (product) {
      router.push(`/product/edit/${product.id}`);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProduct();
    setRefreshing(false);
  }, [id]);

  if (!fontsLoaded || loading) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
            title: "Product Details"
          }} 
        />
        <View style={[styles.loadingContainer, isDarkMode && { backgroundColor: '#121212' }]}>
          <ActivityIndicator size="large" color={isDarkMode ? "#f5f5f5" : "#1a1a1a"} />
        </View>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Stack.Screen 
          options={{
            headerShown: false,
            title: "Product Details"
          }} 
        />
        <View style={[styles.errorContainer, isDarkMode && { backgroundColor: '#121212' }]}>
          <Text style={[styles.errorText, isDarkMode && { color: '#f5f5f5' }]}>Product not found</Text>
          <TouchableOpacity 
            style={styles.backToHomeButton}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Text style={styles.backToHomeText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Determine if the current user is the farmer who created this product
  const isProductOwner = user && user.id === product.farmer_id;

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          title: "Product Details"
        }} 
      />
      <View style={[styles.container, isDarkMode ? { backgroundColor: '#121212' } : { backgroundColor: colors.background }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={[styles.backButton, isDarkMode && styles.darkBackButton]}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={isDarkMode ? "#f5f5f5" : "#1a1a1a"} />
            </TouchableOpacity>
            
            <View style={styles.headerRight}>
              {isProductOwner && (
                <TouchableOpacity 
                  style={[styles.iconButton, isDarkMode && styles.darkIconButton]}
                  onPress={handleEditProduct}
                >
                  <Edit size={20} color={isDarkMode ? "#f5f5f5" : "#1a1a1a"} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <Image
            source={{ uri: product.image_url }}
            style={styles.productImage}
            resizeMode="cover"
          />
          
          <View style={styles.productInfo}>
            <View style={styles.titleRow}>
              <Text style={[styles.productName, isDarkMode && { color: '#f5f5f5' }]}>
                {product.name}
              </Text>
              
              <View style={[
                styles.statusBadge, 
                { backgroundColor: product.is_approved ? 
                    (product.is_available ? '#4CAF5020' : '#9E9E9E20') 
                    : '#FFC10720' 
                }
              ]}>
                <Text style={[
                  styles.statusText, 
                  { color: product.is_approved ? 
                      (product.is_available ? '#4CAF50' : '#9E9E9E')
                      : '#FFC107'
                  }
                ]}>
                  {product.is_approved ? 
                    (product.is_available ? 'Active' : 'Unavailable') 
                    : 'Pending Approval'
                  }
                </Text>
              </View>
            </View>
            
            <Text style={[styles.categoryText, isDarkMode && { color: '#b0b0b0' }]}>
              Category: {product.category}
            </Text>
            
            <Text style={[styles.priceText, isDarkMode && { color: '#f5f5f5' }]}>
              ₹{product.price}/{product.unit}
            </Text>
            
            <Text style={[styles.stockText, isDarkMode && { color: '#b0b0b0' }]}>
              Available Stock: {product.quantity} {product.unit}
            </Text>
            
            <Text style={[styles.descriptionTitle, isDarkMode && { color: '#f5f5f5' }]}>
              Description
            </Text>
            
            <Text style={[styles.descriptionText, isDarkMode && { color: '#b0b0b0' }]}>
              {product.description || 'No description available'}
            </Text>
            
            {/* Only show farmer info if the user is not the owner */}
            {!isProductOwner && (
              <View style={styles.farmerInfoSection}>
                <Text style={[styles.sectionTitle, isDarkMode && { color: '#f5f5f5' }]}>
                  About the Farmer
                </Text>
                
                <View style={styles.farmerInfo}>
                  <Text style={[styles.farmerName, isDarkMode && { color: '#f5f5f5' }]}>
                    {product.farmer_name}
                  </Text>
                  
                  <Text style={[styles.farmerPhone, isDarkMode && { color: '#b0b0b0' }]}>
                    Phone: {product.farmer_phone || 'Not available'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
        
        {isProductOwner && (
          <View style={[styles.bottomActions, isDarkMode && { backgroundColor: '#1e1e1e', borderTopColor: '#333' }]}>
            <TouchableOpacity 
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={handleEditProduct}
            >
              <Edit size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Edit Product</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  backToHomeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHomeText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkBackButton: {
    backgroundColor: '#2a2a2a',
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkIconButton: {
    backgroundColor: '#2a2a2a',
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  productInfo: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#4CAF5020',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: '#4CAF50',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  priceText: {
    fontSize: 22,
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  stockText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontFamily: 'Inter_400Regular',
  },
  descriptionTitle: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#666',
    marginBottom: 20,
    fontFamily: 'Inter_400Regular',
  },
  farmerInfoSection: {
    marginTop: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 12,
  },
  farmerInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  farmerName: {
    fontSize: 16,
    color: '#1a1a1a',
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  farmerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontFamily: 'Inter_400Regular',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  }
});