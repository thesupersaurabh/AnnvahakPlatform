import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useCart, CartItem } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ChevronLeft, ChevronRight, Minus, Plus, Trash2, RefreshCw, Moon, Sun, Heart } from 'lucide-react-native';

// Extend the User interface to include address and phone
interface ExtendedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name: string;
  address?: string;
  phone?: string;
}

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const { token, isAuthenticated, user } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  // Define all functions first
  const processOrder = async () => {
    setLoading(true);
    try {
      // Prepare order data
      const orderItems = items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
      }));

      // Determine which address and phone to use
      const finalDeliveryAddress = useSavedAddress && user?.address ? user.address : deliveryAddress;
      const finalContactNumber = useSavedAddress && user?.phone ? user.phone : contactNumber;

      // Send order request
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          delivery_address: finalDeliveryAddress,
          contact_number: finalContactNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear cart and show success message
        clearCart();
        Alert.alert(
          'Order Placed Successfully',
          `Your order #${data.order.order_number} has been placed.`,
          [{ text: 'View Orders', onPress: () => router.push('/(tabs)/orders') }]
        );
      } else {
        Alert.alert('Order Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Cart Empty', 'Please add some items to your cart first');
      return;
    }

    if (!deliveryAddress.trim()) {
      Alert.alert('Missing Information', 'Please enter a delivery address');
      return;
    }

    if (!contactNumber.trim()) {
      Alert.alert('Missing Information', 'Please enter a contact number');
      return;
    }

    if (!token || !user) {
      Alert.alert('Authentication Required', 'You need to login to place an order.');
      router.push('/(auth)/login');
      return;
    }
    
    // Process the order directly without updating profile
    processOrder();
  };

  const refreshCart = () => {
    setRefreshing(true);
    // In a real app you might want to re-fetch cart items
    // For now, just simulate a refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const moveToWishlist = (item: CartItem) => {
    // Add to wishlist
    addToWishlist({
      id: item.productId,
      name: item.name,
      price: item.price,
      unit: item.unit,
      imageUrl: item.imageUrl,
      farmerId: item.farmerId,
      farmerName: item.farmerName
    });
    
    // Remove from cart
    removeFromCart(item.productId);
    
    Alert.alert('Success', 'Item moved to wishlist');
  };

  // Move useEffect after all function declarations
  useEffect(() => {
    if (user) {
      if (user.address) {
        setDeliveryAddress(user.address);
        setUseSavedAddress(true);
      }
      if (user.phone) {
        setContactNumber(user.phone);
      }
    }
  }, [user]);

  if (!fontsLoaded) {
    return null;
  }

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, isDarkMode && styles.darkContainer]}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1594708767771-a5e9d3c1b779' }}
          style={styles.emptyImage}
        />
        <Text style={[styles.emptyTitle, isDarkMode && styles.darkText]}>Your cart is empty</Text>
        <Text style={[styles.emptySubtitle, isDarkMode && styles.darkText]}>Explore our products and add items to your cart</Text>
        <TouchableOpacity 
          style={styles.shopButton} 
          onPress={() => router.push('/(tabs)')}
        >
          <Text style={styles.shopButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.header, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>My Cart</Text>
        <TouchableOpacity onPress={() => {
          Alert.alert(
            'Clear Cart',
            'Are you sure you want to clear your cart?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', onPress: () => clearCart(), style: 'destructive' }
            ]
          );
        }}>
          <Text style={[styles.clearButton, isDarkMode && { color: '#ff6b6b' }]}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, isDarkMode && styles.darkCartItem]}>
            <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={[styles.itemName, isDarkMode && styles.darkText]}>{item.name}</Text>
              <Text style={[styles.itemPrice, isDarkMode && styles.darkText]}>₹{item.price}/{item.unit}</Text>
              <Text style={[styles.farmerName, isDarkMode && { color: '#aaa' }]}>Sold by: {item.farmerName}</Text>
              
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={[styles.quantityButton, isDarkMode && styles.darkQuantityButton]}
                  onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                >
                  <Minus size={16} color={isDarkMode ? "#fff" : "#666"} />
                </TouchableOpacity>
                
                <Text style={[styles.quantityText, isDarkMode && styles.darkText]}>{item.quantity}</Text>
                
                <TouchableOpacity 
                  style={[styles.quantityButton, isDarkMode && styles.darkQuantityButton]}
                  onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                >
                  <Plus size={16} color={isDarkMode ? "#fff" : "#666"} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.wishlistButton}
                  onPress={() => moveToWishlist(item)}
                >
                  <Heart size={18} color="#FF4D4F" fill={isInWishlist(item.productId) ? "#FF4D4F" : "none"} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeFromCart(item.productId)}
                >
                  <Trash2 size={18} color="#FF4D4F" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.deliverySection, isDarkMode && styles.darkDeliverySection]}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Delivery Information</Text>
            
            {user?.address && user?.phone && (
              <View style={styles.savedAddressOption}>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox, 
                      useSavedAddress && styles.checkboxChecked,
                      isDarkMode && { borderColor: '#aaa' }
                    ]}
                    onPress={() => {
                      setUseSavedAddress(!useSavedAddress);
                      if (!useSavedAddress) {
                        // If toggling to use saved address, update fields with saved values
                        setDeliveryAddress(user.address || '');
                        setContactNumber(user.phone || '');
                      }
                    }}
                  >
                    {useSavedAddress && <Text style={styles.checkMark}>✓</Text>}
                  </TouchableOpacity>
                  <Text style={[styles.checkboxLabel, isDarkMode && { color: '#aaa' }]}>
                    Use saved address and contact
                  </Text>
                </View>
                
                {useSavedAddress ? (
                  <View style={styles.savedAddressInfo}>
                    <Text style={[styles.savedAddressText, isDarkMode && { color: '#aaa' }]}>
                      Address: {user.address}
                    </Text>
                    <Text style={[styles.savedAddressText, isDarkMode && { color: '#aaa' }]}>
                      Phone: {user.phone}
                    </Text>
                  </View>
                ) : (
                  // Only show input fields if user has unchecked "Use saved address"
                  <>
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#aaa' }]}>Delivery Address</Text>
                    <TextInput
                      style={[styles.input, isDarkMode && styles.darkInput]}
                      value={deliveryAddress}
                      onChangeText={setDeliveryAddress}
                      placeholder="Enter your delivery address"
                      placeholderTextColor={isDarkMode ? "#777" : "#999"}
                      multiline
                    />
                    
                    <Text style={[styles.inputLabel, isDarkMode && { color: '#aaa' }]}>Contact Number</Text>
                    <TextInput
                      style={[styles.input, isDarkMode && styles.darkInput]}
                      value={contactNumber}
                      onChangeText={setContactNumber}
                      placeholder="Enter your contact number"
                      placeholderTextColor={isDarkMode ? "#777" : "#999"}
                      keyboardType="phone-pad"
                    />
                  </>
                )}
              </View>
            )}
            
            {/* Only show input fields if user doesn't have saved address or phone */}
            {(!user?.address || !user?.phone) && (
              <>
                <Text style={[styles.inputLabel, isDarkMode && { color: '#aaa' }]}>Delivery Address</Text>
                <TextInput
                  style={[styles.input, isDarkMode && styles.darkInput]}
                  value={deliveryAddress}
                  onChangeText={setDeliveryAddress}
                  placeholder="Enter your delivery address"
                  placeholderTextColor={isDarkMode ? "#777" : "#999"}
                  multiline
                />
                
                <Text style={[styles.inputLabel, isDarkMode && { color: '#aaa' }]}>Contact Number</Text>
                <TextInput
                  style={[styles.input, isDarkMode && styles.darkInput]}
                  value={contactNumber}
                  onChangeText={setContactNumber}
                  placeholder="Enter your contact number"
                  placeholderTextColor={isDarkMode ? "#777" : "#999"}
                  keyboardType="phone-pad"
                />
              </>
            )}
          </View>
        }
      />

      <View style={[styles.footer, isDarkMode && styles.darkFooter]}>
        <View style={styles.priceRow}>
          <Text style={[styles.priceLabel, isDarkMode && { color: '#aaa' }]}>Total:</Text>
          <Text style={[styles.priceValue, isDarkMode && styles.darkText]}>₹{totalAmount.toFixed(2)}</Text>
        </View>
        
        <TouchableOpacity 
          style={[styles.checkoutButton, loading && styles.disabledButton]} 
          onPress={placeOrder}
          disabled={loading}
        >
          <Text style={styles.checkoutText}>
            {loading ? 'Processing...' : 'Place Order'}
          </Text>
          {!loading && <ChevronRight size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 60,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },
  darkText: {
    color: '#fff',
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginRight: 10,
  },
  clearButton: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#FF4D4F',
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkCartItem: {
    backgroundColor: '#1e1e1e',
    shadowColor: '#000',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },
  farmerName: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkQuantityButton: {
    backgroundColor: '#333',
  },
  quantityText: {
    marginHorizontal: 15,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  wishlistButton: {
    marginLeft: 10,
    padding: 5,
  },
  removeButton: {
    marginLeft: 'auto',
    padding: 5,
  },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 40,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkFooter: {
    backgroundColor: '#1e1e1e',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priceLabel: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  priceValue: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  checkoutButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginRight: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
    borderRadius: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  shopButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    minWidth: 200,
    alignItems: 'center',
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  deliverySection: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkDeliverySection: {
    backgroundColor: '#1e1e1e',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#333',
    color: '#fff',
  },
  savedAddressOption: {
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1a1a1a',
  },
  checkMark: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
  savedAddressInfo: {
    marginTop: 5,
  },
  savedAddressText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
}); 