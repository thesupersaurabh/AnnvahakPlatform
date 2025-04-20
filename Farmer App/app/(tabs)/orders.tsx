import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Package, ShoppingBag, Calendar, Filter, ChevronDown, IndianRupee, AlertCircle } from 'lucide-react-native';
import { api, endpoints } from '../../utils/api';

// Define interfaces based on API response structure
interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  image_url: string;
  quantity: number;
  price_per_unit: number | string;
  total_price: number | string;
  status: string;
  created_at: string;
  farmer_id?: number;
}

interface Order {
  order_id: number;
  id?: number; // Alternative field that might be in the response
  order_number: string;
  buyer_name: string;
  buyer_id: number;
  delivery_address: string;
  contact_number: string;
  order_date: string;
  created_at?: string;
  items: OrderItem[];
}

// All possible status values for filtering
const STATUS_OPTIONS = [
  { id: null, label: 'All Statuses' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Accepted', label: 'Accepted' },
  { id: 'Completed', label: 'Completed' },
  { id: 'Rejected', label: 'Rejected' }
];

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'total'>('date');
  const [statusFilterIndex, setStatusFilterIndex] = useState(0);
  const { colors, isDarkMode } = useTheme();
  const { token, isAuthenticated } = useAuth();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const fetchOrders = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch orders from API using the endpoint from our utility
      const response = await api.get<{ orders: any[] }>(
        endpoints.orders.farmer,
        token
      );
      
      if (response.success && response.data.orders) {
        console.log('Orders fetched successfully:', response.data.orders.length);
        const normalizedOrders = response.data.orders.map(normalizeOrder);
        setOrders(normalizedOrders);
        setFilteredOrders(normalizedOrders);
      } else {
        console.error('Failed to fetch orders:', response.message);
        // If the API fails, set empty orders
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // In case of error, set empty orders
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Normalize order data to handle variations in API response
  const normalizeOrder = (orderData: any): Order => {
    return {
      order_id: orderData.order_id || orderData.id || 0,
      id: orderData.id || orderData.order_id || 0,
      order_number: orderData.order_number || `#${orderData.order_id || orderData.id || '000'}`,
      buyer_name: orderData.buyer_name || 'Customer',
      buyer_id: orderData.buyer_id || 0,
      delivery_address: orderData.delivery_address || 'Not provided',
      contact_number: orderData.contact_number || 'Not provided',
      order_date: orderData.order_date || orderData.created_at || new Date().toISOString(),
      created_at: orderData.created_at || null,
      items: Array.isArray(orderData.items) ? orderData.items.map(normalizeOrderItem) : [],
    };
  };

  // Normalize order item data
  const normalizeOrderItem = (item: any): OrderItem => {
    return {
      id: item.id || 0,
      product_id: item.product_id || 0,
      product_name: item.product_name || 'Unknown Product',
      quantity: item.quantity || 0,
      price_per_unit: item.price_per_unit || 0,
      total_price: item.total_price || 0,
      image_url: item.image_url || 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=AnnVahak+Seller',
      status: item.status || 'pending',
      created_at: item.created_at || '',
      farmer_id: item.farmer_id || undefined
    };
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token, fetchOrders]);

  useEffect(() => {
    // Apply filters and sorting
    let result = [...orders];
    
    // Apply status filter
    if (statusFilter) {
      // Filter orders that have any item with the selected status
      result = result.filter(order => 
        order.items.some(item => item.status.toLowerCase() === statusFilter.toLowerCase())
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.order_date).getTime() - new Date(a.order_date).getTime();
      } else {
        // Calculate total for each order by summing up all item totals
        const totalA = calculateOrderTotal(a);
        const totalB = calculateOrderTotal(b);
        return totalB - totalA;
      }
    });
    
    setFilteredOrders(result);
  }, [orders, statusFilter, sortBy]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#f9a825';
      case 'accepted':
        return '#0288d1';
      case 'completed':
        return '#1e8e3e';
      case 'rejected':
        return '#c62828';
      default:
        return '#9E9E9E';
    }
  };


  // Calculate total order amount by summing up all items safely
  const calculateOrderTotal = (order: Order) => {
    if (!order || !order.items || !Array.isArray(order.items)) return 0;
    
    return order.items.reduce((total, item) => {
      const itemTotal = typeof item.total_price === 'string' 
        ? parseFloat(item.total_price) 
        : (item.total_price || 0);
      
      return total + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  };

  // Format currency safely
  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '₹0.00';
    return `₹${value.toFixed(2)}`;
  };

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Cycle through status filters
  const cycleStatusFilter = () => {
    const nextIndex = (statusFilterIndex + 1) % STATUS_OPTIONS.length;
    setStatusFilterIndex(nextIndex);
    setStatusFilter(STATUS_OPTIONS[nextIndex].id);
  };

  if (!fontsLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.noOrdersText, { color: colors.text }]}>
          Please login to view your orders
        </Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerContainer}>
        <Text style={[styles.header, { color: colors.text }]}>Your Orders</Text>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              // Toggle between date and amount sorting
              setSortBy(sortBy === 'date' ? 'total' : 'date');
            }}
          >
            {sortBy === 'date' ? (
              <Calendar size={16} color={colors.primary} style={{ marginRight: 6 }} />
            ) : (
              <IndianRupee size={16} color={colors.primary} style={{ marginRight: 6 }} />
            )}
            <Text style={[styles.filterText, { color: colors.text }]}>
              Sort by: {sortBy === 'date' ? 'Date' : 'Amount'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={cycleStatusFilter}
          >
            <Filter size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.filterText, { color: colors.text }]}>
              {STATUS_OPTIONS[statusFilterIndex].label}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length === 0 ? (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <AlertCircle size={64} color={colors.secondary} />
          <Text style={[styles.noOrdersText, { color: colors.text }]}>
            {statusFilter ? `No ${STATUS_OPTIONS.find(s => s.id === statusFilter)?.label || statusFilter} orders found` : 'No orders found'}
          </Text>
          <Text style={[styles.noOrdersSubtext, { color: colors.secondary }]}>
            Pull down to refresh
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.order_id.toString()}
          renderItem={({ item: order }) => (
            <TouchableOpacity
              style={[styles.orderCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/order/${order.order_id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <Text style={[styles.orderId, { color: colors.primary }]}>
                  #{order.order_number}
                </Text>
                <Text style={[styles.orderDate, { color: colors.secondary }]}>
                  {formatDate(order.order_date)}
                </Text>
              </View>
              
              <View style={[styles.divider, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]} />
              
              <View style={styles.orderDetails}>
                <View style={styles.orderInfo}>
                  <Text style={[styles.label, { color: colors.secondary }]}>Customer:</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{order.buyer_name}</Text>
                </View>
                
                <View style={styles.orderInfo}>
                  <Text style={[styles.label, { color: colors.secondary }]}>Items:</Text>
                  <Text style={[styles.value, { color: colors.text }]}>{order.items.length}</Text>
                </View>
                
                <View style={styles.orderInfo}>
                  <Text style={[styles.label, { color: colors.secondary }]}>Total:</Text>
                  <Text style={[styles.value, { color: colors.primary, fontFamily: 'Inter_600SemiBold' }]}>
                    {formatCurrency(calculateOrderTotal(order))}
                  </Text>
                </View>
              </View>
              
              <View style={styles.statusContainer}>
                <Text style={[styles.statusLabel, { color: colors.secondary }]}>Status:</Text>
                <View style={styles.statusBadgesContainer}>
                  {/* Show the statuses of all items in the order, grouped by status */}
                  {Array.from(new Set(order.items.map(item => item.status.toLowerCase())))
                    .map((status, index) => {
                      const count = order.items.filter(item => item.status.toLowerCase() === status).length;
                      return (
                        <View 
                          key={index}
                          style={[
                            styles.statusBadge, 
                            { backgroundColor: `${getStatusColor(status)}20` }
                          ]}
                        >
                          <Text 
                            style={[
                              styles.statusText, 
                              { color: getStatusColor(status) }
                            ]}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)} {count > 1 ? `(${count})` : ''}
                          </Text>
                        </View>
                      );
                    })}
                </View>
              </View>
              
              <View style={styles.orderActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: `${colors.primary}20` }]}
                  onPress={() => router.push(`/order/${order.order_id}`)}
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.ordersList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
    flex: 1,
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    marginTop: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noOrdersText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginVertical: 20,
    textAlign: 'center',
  },
  noOrdersSubtext: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
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
  orderCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  orderDetails: {
    padding: 16,
    paddingBottom: 8,
  },
  orderInfo: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    textAlign: 'right',
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  statusBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 50,
    marginRight: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  orderActions: {
    padding: 16,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  ordersList: {
    padding: 16,
    paddingTop: 8,
  },
});