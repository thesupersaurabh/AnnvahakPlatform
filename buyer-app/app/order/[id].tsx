import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCw, MessageCircle, Phone, MapPin, Clock, Tag, Truck } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { Stack } from 'expo-router';

// Custom function to format relative time instead of using date-fns
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
};

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  image_url: string;
  farmer_id: number;
  farmer_name: string;
  farmer_phone: string;
}

interface DeliveryAddress {
  id: number;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  landmark?: string;
}

interface OrderTrackingEvent {
  status: string;
  timestamp: string;
  description: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
  delivery_address?: DeliveryAddress | string;
  payment_method?: string;
  payment_mode?: string;
  created_at: string;
  updated_at: string;
  tracking_events?: OrderTrackingEvent[];
}

export default function OrderDetails() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { token, isAuthenticated } = useAuth();
  const { colors, isDarkMode } = useTheme();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchOrder();
    } else {
      router.replace('/(auth)/login');
    }
  }, [id, isAuthenticated, token]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setOrder(data.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      Alert.alert('Error', 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrder();
    setRefreshing(false);
  }, [id, token]);

  const handleContactFarmer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessageFarmer = (phone: string) => {
    Linking.openURL(`sms:${phone}`);
  };

  const getStatusColor = (status: string | undefined): string => {
    if (!status) return colors.secondary;
    
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B'; // Amber
      case 'processing':
        return '#3B82F6'; // Blue
      case 'shipped':
        return '#8B5CF6'; // Purple
      case 'delivered':
        return '#10B981'; // Green
      case 'completed':
        return '#10B981'; // Green
      case 'cancelled':
        return '#EF4444'; // Red
      default:
        return colors.secondary;
    }
  };

  const getDeliveryStatusText = (status: string | undefined): string => {
    if (!status) return 'Processing';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Order Placed';
      case 'accepted':
        return 'Order Accepted';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Order not found</Text>
        <TouchableOpacity 
          style={[styles.backToOrdersButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <Text style={styles.backToOrdersText}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
          title: "Order Details"
        }} 
      />
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.background }]}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>Order #{order.order_number}</Text>
          
          <View style={{ width: 40 }} />
        </View>

        {/* Order Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(order.status) }]}>
          <View style={styles.statusContent}>
            <Text style={styles.statusText}>{getDeliveryStatusText(order.status)}</Text>
            <Text style={styles.statusDate}>
              {formatRelativeTime(new Date(order.updated_at))}
            </Text>
          </View>
        </View>

        {/* Order Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Order Summary</Text>
          </View>
          
          <View style={styles.orderInfoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Tag size={16} color={colors.secondary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.secondary }]}>Order ID</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>#{order.order_number}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Clock size={16} color={colors.secondary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.secondary }]}>Placed On</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {new Date(order.created_at).toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={styles.orderInfoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Truck size={16} color={colors.secondary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.secondary }]}>Delivery Status</Text>
              <Text style={[styles.infoValue, { color: getStatusColor(order.status) }]}>
                {order.status ? order.status.toUpperCase() : 'PROCESSING'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Tag size={16} color={colors.secondary} />
              </View>
              <Text style={[styles.infoLabel, { color: colors.secondary }]}>Payment Mode</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {order.payment_mode ? order.payment_mode.toUpperCase() : 'COD'}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items Card */}
        {order.items && order.items.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Order Items</Text>
            </View>
            
            {order.items.map((item, index) => (
              <View key={item.id || index} style={[styles.orderItem, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.productImageContainer}
                  onPress={() => router.push({
                    pathname: '/product/[id]',
                    params: { id: item.product_id }
                  })}
                >
                  <Image 
                    source={{ uri: item.image_url || 'https://via.placeholder.com/70' }}
                    style={styles.productImage}
                  />
                </TouchableOpacity>
                <View style={styles.itemDetails}>
                  <TouchableOpacity
                    onPress={() => router.push({
                      pathname: '/product/[id]',
                      params: { id: item.product_id }
                    })}
                    activeOpacity={0.7}
                  >
                    <View style={styles.nameRow}>
                      <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                        {item.product_name || 'Product'}
                      </Text>
                      <Text style={[styles.viewDetailsText, { color: colors.primary }]}>
                        View
                      </Text>
                    </View>
                    <Text style={[styles.itemQuantity, { color: colors.secondary }]}>
                      {item.quantity || 1} x ₹{item.price_per_unit || 0}/{(item.quantity || 1) > 1 ? 'units' : 'unit'}
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.farmerInfo}>
                    <Text style={[styles.farmerName, { color: colors.secondary }]}>
                      Sold by: {item.farmer_name || 'Farmer'}
                    </Text>
                    
                    {item.farmer_phone && (
                      <View style={styles.contactButtons}>
                        <TouchableOpacity 
                          style={[styles.contactButton, { backgroundColor: colors.background }]}
                          onPress={() => handleContactFarmer(item.farmer_phone)}
                        >
                          <Phone size={16} color={colors.primary} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.contactButton, { backgroundColor: colors.background }]}
                          onPress={() => handleMessageFarmer(item.farmer_phone)}
                        >
                          <MessageCircle size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={[styles.itemPrice, { color: colors.text }]}>₹{item.total_price || 0}</Text>
              </View>
            ))}
            
            <View style={[styles.totalSection, { borderTopColor: colors.border }]}>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.secondary }]}>Subtotal</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>₹{order.total_amount || 0}</Text>
              </View>
              
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: colors.secondary }]}>Delivery Fee</Text>
                <Text style={[styles.totalValue, { color: colors.text }]}>₹0</Text>
              </View>
              
              <View style={styles.grandTotalRow}>
                <Text style={[styles.grandTotalLabel, { color: colors.text }]}>Total Amount</Text>
                <Text style={[styles.grandTotalValue, { color: colors.primary }]}>₹{order.total_amount || 0}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Order Items</Text>
            </View>
            <View style={styles.emptyItems}>
              <Text style={[styles.emptyItemsText, { color: colors.secondary }]}>No items in this order</Text>
            </View>
          </View>
        )}

        {/* Delivery Address Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Delivery Address</Text>
          </View>
          
          <View style={styles.addressContent}>
            <View style={styles.addressIconContainer}>
              <MapPin size={20} color={colors.primary} />
            </View>
            
            <View style={styles.addressDetails}>
              {order.delivery_address ? (
                typeof order.delivery_address === 'string' ? (
                  <Text style={[styles.addressText, { color: colors.text }]}>
                    {order.delivery_address}
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.addressText, { color: colors.text }]}>
                      {order.delivery_address.street || 'No street address provided'}
                    </Text>
                    <Text style={[styles.addressText, { color: colors.text }]}>
                      {order.delivery_address.city || ''}{order.delivery_address.city ? ', ' : ''}
                      {order.delivery_address.state || ''} {order.delivery_address.zipcode || ''}
                    </Text>
                    {order.delivery_address.landmark && (
                      <Text style={[styles.landmarkText, { color: colors.secondary }]}>
                        Landmark: {order.delivery_address.landmark}
                      </Text>
                    )}
                  </>
                )
              ) : (
                <Text style={[styles.addressText, { color: colors.text }]}>
                  Address information not available
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Order Tracking Card */}
        {order.tracking_events && order.tracking_events.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Order Tracking</Text>
            </View>
            
            <View style={styles.trackingTimeline}>
              {order.tracking_events.map((event, index) => {
                const eventsLength = order.tracking_events?.length || 0;
                return (
                  <View key={index} style={styles.trackingEvent}>
                    <View style={[
                      styles.timelineDot, 
                      { backgroundColor: getStatusColor(event.status) }
                    ]} />
                    
                    {index < eventsLength - 1 && (
                      <View style={[
                        styles.timelineLine, 
                        { backgroundColor: colors.border }
                      ]} />
                    )}
                    
                    <View style={styles.eventDetails}>
                      <Text style={[styles.eventStatus, { color: colors.text }]}>
                        {event.status ? event.status.toUpperCase() : 'UPDATE'}
                      </Text>
                      <Text style={[styles.eventTime, { color: colors.secondary }]}>
                        {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                      </Text>
                      <Text style={[styles.eventDescription, { color: colors.text }]}>
                        {event.description || 'Order status updated'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.border }]}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Back to Orders</Text>
          </TouchableOpacity>
          
          {(!order.status || order.status.toLowerCase() !== 'cancelled') && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
              onPress={() => Alert.alert(
                'Cancel Order',
                'Please contact our support team to cancel this order.',
                [
                  { text: 'OK', style: 'cancel' }
                ]
              )}
            >
              <Text style={styles.actionButtonTextWhite}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 20,
  },
  backToOrdersButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backToOrdersText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  statusBanner: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  statusDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },
  card: {
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoIconContainer: {
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  orderItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
    flex: 1,
    paddingRight: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  farmerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerName: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  contactButtons: {
    flexDirection: 'row',
  },
  contactButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 10,
  },
  totalSection: {
    padding: 16,
    borderTopWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  totalValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  grandTotalLabel: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
  },
  addressContent: {
    flexDirection: 'row',
    padding: 16,
  },
  addressIconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressDetails: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  landmarkText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  paymentContent: {
    padding: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  paymentLabel: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  paymentValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  paymentStatus: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  trackingTimeline: {
    padding: 16,
  },
  trackingEvent: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
    marginRight: 12,
  },
  timelineLine: {
    position: 'absolute',
    left: 5,
    top: 18,
    width: 2,
    height: '100%',
  },
  eventDetails: {
    flex: 1,
  },
  eventStatus: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 30,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  actionButtonTextWhite: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  emptyItems: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  emptyPayment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPaymentText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  viewDetailsText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
  },
}); 