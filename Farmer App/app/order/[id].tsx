import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ChevronLeft, CheckCircle, XCircle, Truck, Loader2, PackageCheck, AlertTriangle, MessageCircle } from 'lucide-react-native';
import { api, endpoints } from '../../utils/api';

// Interface definitions based on the API documentation
interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_per_unit: number | string;
  total_price: number | string;
  image_url: string;
  status: string;
  created_at: string;
  farmer_id?: number;
  unit?: string;
  category?: string;
  product_description?: string;
}

interface Order {
  id: number;
  order_id?: number; // Alternative field name that might be used
  order_number: string;
  buyer_name: string;
  buyer_id: number;
  delivery_address: string;
  contact_number: string;
  order_date: string | null;
  created_at?: string;
  updated_at?: string;
  items: OrderItem[];
  total_amount?: number;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  payment_id?: string;
  expected_delivery_date?: string;
  notes?: string;
}

// Available status options with corresponding labels and colors - exactly matching backend
const STATUS_OPTIONS = [
  { id: 'pending', label: 'Pending', color: '#f9a825', icon: Loader2 },
  { id: 'accepted', label: 'Accepted', color: '#0288d1', icon: CheckCircle },
  { id: 'completed', label: 'Completed', color: '#1e8e3e', icon: PackageCheck },
  { id: 'rejected', label: 'Rejected', color: '#c62828', icon: XCircle },
];

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, isAuthenticated, user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (isAuthenticated && token && id) {
      fetchOrderDetails();
    } else if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, token, id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to view order details');
        router.replace('/(auth)/login');
        return;
      }
      
      const response = await api.get<{ order: Order }>(
        endpoints.orders.details(id as string),
        token
      );
      
      if (response.success && response.data.order) {
        console.log('Order details fetched successfully');
        
        // Normalize the order object structure
        const normalizedOrder = normalizeOrder(response.data.order);
        setOrder(normalizedOrder);
      } else {
        console.error('Failed to fetch order details:', response.message);
        Alert.alert('Error', response.message || 'Failed to load order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  // Normalize order data to handle variations in API response
  const normalizeOrder = (orderData: any): Order => {
    // Make sure order properties exist with fallbacks for varying API responses
    return {
      id: orderData.id || orderData.order_id || 0,
      order_id: orderData.order_id || orderData.id || 0,
      order_number: orderData.order_number || `#${orderData.id || orderData.order_id || '000'}`,
      buyer_name: orderData.buyer_name || 'Customer',
      buyer_id: orderData.buyer_id || 0,
      delivery_address: orderData.delivery_address || 'Not provided',
      contact_number: orderData.contact_number || 'Not provided',
      order_date: orderData.order_date || orderData.created_at || null,
      created_at: orderData.created_at || null,
      updated_at: orderData.updated_at || null,
      total_amount: orderData.total_amount || 0,
      status: orderData.status || 'pending',
      items: (orderData.items || []).map((item: any) => normalizeOrderItem(item)),
      payment_method: orderData.payment_method || null,
      payment_status: orderData.payment_status || null,
      payment_id: orderData.payment_id || null,
      expected_delivery_date: orderData.expected_delivery_date || null,
      notes: orderData.notes || null,
    };
  };

  // Normalize order item data
  const normalizeOrderItem = (item: any): OrderItem => {
    // Ensure price_per_unit is always a valid number or numeric string
    let pricePerUnit = 0;
    if (item.price_per_unit !== undefined && item.price_per_unit !== null) {
      pricePerUnit = item.price_per_unit;
    }
    
    // Ensure total_price is always a valid number or numeric string
    let totalPrice = 0;
    if (item.total_price !== undefined && item.total_price !== null) {
      totalPrice = item.total_price;
    }
    
    // Normalize status to match our STATUS_OPTIONS format
    // The backend uses lowercase, but we display with proper case
    let statusValue = item.status || 'pending';
    // Find matching status option regardless of case
    const statusOption = STATUS_OPTIONS.find(
      opt => opt.id.toLowerCase() === statusValue.toLowerCase()
    );
    // Use the exact id from our options to ensure consistency
    if (statusOption) {
      statusValue = statusOption.id;
    }
    
    return {
      id: item.id || 0,
      product_id: item.product_id || 0,
      product_name: item.product_name || 'Unknown Product',
      quantity: item.quantity || 0,
      price_per_unit: pricePerUnit,
      total_price: totalPrice,
      image_url: item.image_url || 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=AnnVahak+Seller',
      status: statusValue,
      created_at: item.created_at || '',
      farmer_id: item.farmer_id || undefined,
      unit: item.unit || null,
      category: item.category || null,
      product_description: item.product_description || null,
    };
  };
  
  const getStatusColor = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.id === status.toLowerCase());
    return option ? option.color : '#f9a825';
  };
  
  const getStatusIcon = (status: string) => {
    const option = STATUS_OPTIONS.find(opt => opt.id === status.toLowerCase());
    return option ? option.icon : Loader2;
  };
  
  const getStatusLabel = (status: string) => {
    // Find the status option to get the proper display label
    const option = STATUS_OPTIONS.find(opt => opt.id === status.toLowerCase());
    return option ? option.label : 'Unknown';
  };
  
  const handleUpdateStatus = async (itemId: number, status: string) => {
    if (!token) return;
    
    // Validate that status is one of the valid options
    const isValidStatus = STATUS_OPTIONS.some(option => option.id === status);
    if (!isValidStatus) {
      Alert.alert('Error', 'Invalid status value');
      return;
    }
    
    try {
      setUpdatingItemId(itemId);
      
      // Status is already in the correct format for the API
      let statusValue = status;
      
      // Log available status options
      console.log('Available status options:', STATUS_OPTIONS.map(opt => opt.id));
      console.log('Currently set status:', getStatusLabel(status));
      console.log(`Updating order item ${itemId} status to: "${statusValue}"`);
      console.log('Full Request payload:', { status: statusValue });
      
      const response = await api.put<{ message: string }>(
        endpoints.orders.updateItemStatus(itemId.toString()),
        { status: statusValue },
        token
      );
      
      if (response.success) {
        console.log('Status update successful:', response);
        // Update local state
        if (order) {
          const updatedItems = order.items.map(item => 
            item.id === itemId ? { ...item, status: statusValue } : item
          );
          setOrder({ ...order, items: updatedItems });
        }
        
        Alert.alert('Success', response.message || `Item status updated to ${getStatusLabel(statusValue)}`);
      } else {
        console.error('Status update failed:', response);
        console.error('Status update error details:', response);
        console.error('Status update error message:', response.message);
        console.error('Status update error data:', response.data);
        
        Alert.alert('Error', response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating item status:', error);
      // Try to extract and display a more specific error message
      let errorMessage = 'Failed to update status. Please try again.';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = (error as any).message || errorMessage;
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setUpdatingItemId(null);
      setShowStatusPicker(false);
      setSelectedItemId(null);
    }
  };
  
  const showStatusOptions = (itemId: number) => {
    setSelectedItemId(itemId);
    setShowStatusPicker(true);
  };

  // Format currency in a safe way
  const formatCurrency = (value: number | string | undefined) => {
    if (value === undefined || value === null) return '₹0.00';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (isNaN(numValue)) return '₹0.00';
    
    return `₹${numValue.toFixed(2)}`;
  };

  // Format date in a safe way
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not available';
    
    try {
      return new Date(dateString).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Handle contacting the buyer
  const handleContactBuyer = () => {
    if (!order || !order.buyer_id) {
      Alert.alert('Error', 'Buyer information not available');
      return;
    }
    
    router.push(`/chat/${order.buyer_id}`);
  };

  // Toggle item expanded state
  const toggleItemExpanded = (itemId: number) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centerContainer]}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#000"} />
        <Text style={[styles.loadingText, isDarkMode && { color: '#fff' }]}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer, styles.centerContainer]}>
        <Stack.Screen options={{ title: 'Order Not Found' }} />
        <AlertTriangle size={48} color={isDarkMode ? "#f5f5f5" : "#c62828"} />
        <Text style={[styles.errorText, isDarkMode && { color: '#fff' }]}>Order not found or you don't have access</Text>
        <TouchableOpacity 
          style={styles.backHomeButton}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Text style={styles.backHomeButtonText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Filter items to only show items from this farmer
  const myItems = order.items.filter(item => {
    // If we have the farmer_id on the item, filter by that
    if (item.farmer_id && user?.id) {
      return item.farmer_id === user.id;
    }
    // Otherwise show all items (fallback)
    return true;
  });

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Stack.Screen 
        options={{
          title: order ? `Order #${order.order_number}` : 'Order Details',
          headerTintColor: isDarkMode ? '#fff' : '#000',
          headerStyle: {
            backgroundColor: isDarkMode ? '#1e1e1e' : '#fff',
          },
          headerShadowVisible: false,
        }} 
      />
      
      <ScrollView style={styles.content}>
        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Order Information</Text>
          <TouchableOpacity 
              style={[styles.contactButton, { backgroundColor: colors.primary + '20' }]}
              onPress={handleContactBuyer}
          >
              <MessageCircle size={16} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.contactButtonText, { color: colors.primary }]}>
                Contact Buyer
              </Text>
          </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Order Date:</Text>
            <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>
              {formatDate(order.order_date)}
            </Text>
        </View>

          {order.expected_delivery_date && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Expected Delivery:</Text>
              <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>
                {formatDate(order.expected_delivery_date)}
            </Text>
          </View>
          )}

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Buyer:</Text>
            <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>{order.buyer_name}</Text>
        </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Contact:</Text>
            <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>{order.contact_number}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Delivery Address:</Text>
            <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>{order.delivery_address}</Text>
            </View>
            
          {order.payment_method && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Payment Method:</Text>
              <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>
                {order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1)}
              </Text>
              </View>
          )}

          {order.payment_status && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Payment Status:</Text>
              <View style={[
                styles.paymentStatusBadge,
                { backgroundColor: order.payment_status.toLowerCase() === 'paid' ? '#4caf5020' : '#f9a82520' }
              ]}>
                <Text style={{
                  color: order.payment_status.toLowerCase() === 'paid' ? '#4caf50' : '#f9a825',
                  fontSize: 12,
                  fontFamily: 'Inter_600SemiBold',
                }}>
                  {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
              </Text>
            </View>
          </View>
          )}

          {order.total_amount && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Order Total:</Text>
              <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }, styles.totalAmount]}>
                {formatCurrency(order.total_amount)}
              </Text>
            </View>
          )}

          {order.notes && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, isDarkMode && styles.darkSecondaryText]}>Notes:</Text>
              <Text style={[styles.infoValue, isDarkMode && { color: '#fff' }]}>{order.notes}</Text>
              </View>
          )}
        </View>

        <View style={[styles.card, isDarkMode && styles.darkCard]}>
          <Text style={[styles.sectionTitle, isDarkMode && { color: '#fff' }]}>Your Products in this Order</Text>
          
          {myItems.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <AlertTriangle size={40} color={isDarkMode ? "#f5f5f5" : "#f9a825"} />
              <Text style={[styles.emptyText, isDarkMode && styles.darkSecondaryText]}>
                You don't have any products in this order
              </Text>
            </View>
          ) : (
            myItems.map((item) => {
              const isExpanded = expandedItems.includes(item.id);
              return (
                <View key={item.id} style={styles.itemRow}>
                <TouchableOpacity
                    style={styles.itemContent}
                    onPress={() => toggleItemExpanded(item.id)}
                    activeOpacity={0.7}
                >
                  <Image 
                      source={{ uri: item.image_url || 'https://dummyimage.com/400x300' }}
                    style={styles.productImage}
                      resizeMode="cover"
                    />
                    
                    <View style={styles.itemInfo}>
                      <Text style={[styles.productName, isDarkMode && { color: '#fff' }]}>
                        {item.product_name}
                      </Text>
                      
                      <View style={styles.productDetails}>
                        <Text style={[styles.itemQuantity, isDarkMode && styles.darkSecondaryText]}>
                          {item.quantity} x {formatCurrency(item.price_per_unit)}
                      </Text>
                        
                        {item.unit && (
                          <Text style={[styles.itemUnit, isDarkMode && styles.darkSecondaryText]}>
                            Unit: {item.unit}
                    </Text>
                        )}
                        
                        {item.category && (
                          <Text style={[styles.itemCategory, isDarkMode && styles.darkSecondaryText]}>
                            Category: {item.category}
                          </Text>
                    )}
                  </View>
                      
                      <View style={styles.itemBottomRow}>
                        <View style={[
                          styles.statusBadge,
                          { backgroundColor: `${getStatusColor(item.status)}20` }
                        ]}>
                          {React.createElement(getStatusIcon(item.status), { 
                            size: 14, 
                            color: getStatusColor(item.status),
                            style: { marginRight: 4 }
                          })}
                          <Text style={[
                            styles.statusText,
                            { color: getStatusColor(item.status) }
                          ]}>
                            {getStatusLabel(item.status)}
                          </Text>
              </View>
              
                        <Text style={[styles.itemPrice, isDarkMode && { color: '#fff' }]}>
                          {formatCurrency(item.total_price)}
                        </Text>
              </View>
              
                      {isExpanded && item.product_description && (
                        <View style={styles.expandedContent}>
                          <Text style={[styles.descriptionTitle, isDarkMode && { color: '#fff' }]}>
                            Product Description:
                          </Text>
                          <Text style={[styles.descriptionText, isDarkMode && styles.darkSecondaryText]}>
                            {item.product_description}
                          </Text>
          </View>
        )}

                      <TouchableOpacity 
                        style={[styles.updateStatusButton, { borderColor: getStatusColor(item.status) }]}
                        onPress={() => showStatusOptions(item.id)}
                        disabled={updatingItemId === item.id}
                      >
                        {updatingItemId === item.id ? (
                          <ActivityIndicator size="small" color={getStatusColor(item.status)} />
                        ) : (
                          <Text style={[styles.updateStatusText, { color: getStatusColor(item.status) }]}>
                            Update Status
                      </Text>
                    )}
                      </TouchableOpacity>
            </View>
                  </TouchableOpacity>
                  </View>
                );
            })
          )}
        </View>
      </ScrollView>
      
      {/* Status Picker Modal */}
      <Modal
        visible={showStatusPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={[styles.modalTitle, isDarkMode && { color: '#fff' }]}>Update Order Status</Text>
            
            <FlatList
              data={STATUS_OPTIONS}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
          <TouchableOpacity 
                  style={[
                    styles.statusOption,
                    isDarkMode && styles.darkStatusOption
                  ]}
                  onPress={() => {
                    if (selectedItemId !== null) {
                      handleUpdateStatus(selectedItemId, item.id);
                    }
                  }}
                >
                  {React.createElement(item.icon, { 
                    size: 20, 
                    color: item.color,
                    style: { marginRight: 12 }
                  })}
                  <Text style={[styles.statusOptionText, { color: item.color }]}>
                    {item.label}
                  </Text>
          </TouchableOpacity>
              )}
              contentContainerStyle={styles.statusList}
            />
          
            <TouchableOpacity 
              style={[styles.cancelButton, isDarkMode && styles.darkCancelButton]}
              onPress={() => setShowStatusPicker(false)}
            >
              <Text style={[styles.cancelButtonText, isDarkMode && { color: '#fff' }]}>Cancel</Text>
            </TouchableOpacity>
        </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: '#666',
    textAlign: 'center',
    marginVertical: 20,
  },
  darkSecondaryText: {
    color: '#aaa',
  },
  backHomeButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  backHomeButtonText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  darkCard: {
    backgroundColor: '#1e1e1e',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  contactButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#333',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  itemRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 16,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 6,
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginBottom: 8,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  updateStatusButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateStatusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  darkModalContent: {
    backgroundColor: '#1e1e1e',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusList: {
    paddingBottom: 20,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  darkStatusOption: {
    borderBottomColor: '#2c2c2c',
  },
  statusOptionText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  cancelButton: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
    alignItems: 'center',
  },
  darkCancelButton: {
    borderTopColor: '#2c2c2c',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#666',
  },
  paymentStatusBadge: {
    padding: 4,
    borderRadius: 4,
  },
  totalAmount: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
  },
  productDetails: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  itemUnit: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginTop: 4,
  },
  itemCategory: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: '#666',
    marginTop: 4,
  },
  expandedContent: {
    marginTop: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#333',
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: '#666',
  },
}); 