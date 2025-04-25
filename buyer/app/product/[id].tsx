import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, MessageCircle, Heart, ShoppingCart, RefreshCw } from 'lucide-react-native';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

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
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { token, isAuthenticated, user } = useAuth();
  const { colors } = useTheme();

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
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/products/${id}`);
      const data = await response.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!token || !user) {
      Alert.alert('Authentication Required', 'You need to login to make a purchase');
      router.push('/(auth)/login');
      return;
    }

    // Add product to cart first
    if (product) {
      addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        unit: product.unit,
        imageUrl: product.image_url,
        farmerId: product.farmer_id,
        farmerName: product.farmer_name
      });
      
      // Navigate directly to cart page
      router.push('/(tabs)/cart');
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    
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
      Alert.alert('Success', 'Product added to wishlist');
    }
  };
  
  const increaseQuantity = () => {
    if (!product) return;
    if (quantity < product.quantity) {
      setQuantity(quantity + 1);
    } else {
      Alert.alert('Maximum Limit', `Only ${product.quantity} units available`);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProduct();
    setRefreshing(false);
  }, [id]);

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity 
          style={styles.backToHomeButton}
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.backToHomeText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#1a1a1a" />
            ) : (
              <RefreshCw size={22} color="#1a1a1a" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={toggleWishlist}
          >
            <Heart 
              size={24} 
              color={isInWishlist(product.id) ? "#FF4D4F" : "#1a1a1a"}
              fill={isInWishlist(product.id) ? "#FF4D4F" : "none"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Image 
        source={{ uri: product.image_url }}
        style={styles.productImage}
      />

      <View style={styles.content}>
        <View style={styles.titleSection}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>₹{product.price}/{product.unit}</Text>
        </View>

        <Text style={styles.description}>{product.description}</Text>
        
        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{quantity}</Text>
            
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={increaseQuantity}
              disabled={quantity >= product.quantity}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
            
            <Text style={styles.availableText}>
              {product.quantity} {product.unit}s available
            </Text>
          </View>
        </View>

        <View style={styles.farmerSection}>
          <Text style={styles.sectionTitle}>Seller Information</Text>
          <View style={styles.farmerInfo}>
            <View style={styles.farmerAvatar}>
              <Text style={styles.farmerAvatarText}>
                {product.farmer_name?.charAt(0)}
              </Text>
            </View>
            <View style={styles.farmerDetails}>
              <Text style={styles.farmerName}>{product.farmer_name}</Text>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={() => router.push(`/chat/${product.farmer_id}`)}
              >
                <MessageCircle size={20} color="#1a1a1a" />
                <Text style={styles.chatButtonText}>Chat with Seller</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => {
              // Remove from wishlist if present
              if (isInWishlist(product.id)) {
                removeFromWishlist(product.id);
              }
              
              addToCart({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                unit: product.unit,
                imageUrl: product.image_url,
                farmerId: product.farmer_id,
                farmerName: product.farmer_name
              });
              
              Alert.alert('Success', 'Product added to cart');
            }}
          >
            <ShoppingCart size={20} color="#fff" />
            <Text style={styles.cartButtonText}>Add to Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.buyButton}
            onPress={handleBuyNow}
          >
            <Text style={styles.buyButtonText}>
              Buy Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
  },
  backToHomeButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  backToHomeText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    height: 400,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },
  description: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    lineHeight: 24,
    marginBottom: 24,
  },
  quantitySection: {
    marginBottom: 24,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  availableText: {
    marginLeft: 15,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  farmerSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmerAvatarText: {
    color: '#fff',
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  farmerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  farmerName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#1a1a1a',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  cartButton: {
    flex: 1,
    backgroundColor: '#666',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginRight: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 8,
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});