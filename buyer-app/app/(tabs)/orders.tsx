import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { RefreshCw } from 'lucide-react-native';
import { router } from 'expo-router';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  image_url: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
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
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/orders/buyer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [token]);

  if (!fontsLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>My Orders</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, isDarkMode && styles.darkText]}>Please login to view your orders</Text>
          <TouchableOpacity 
            style={styles.loginButton}
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
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>My Orders</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#1a1a1a"} />
        </View>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.container, isDarkMode && styles.darkContainer]}>
        <View style={[styles.header, isDarkMode && styles.darkHeader]}>
          <Text style={[styles.title, isDarkMode && styles.darkText]}>My Orders</Text>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
            onPress={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#666"} />
            ) : (
              <RefreshCw size={20} color={isDarkMode ? "#fff" : "#666"} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, isDarkMode && styles.darkText]}>You haven't placed any orders yet</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.loginButtonText}>Shop Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, isDarkMode && styles.darkContainer]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.headerWithRefresh, isDarkMode && styles.darkHeader]}>
        <Text style={[styles.title, isDarkMode && styles.darkText]}>My Orders</Text>
        <TouchableOpacity 
          style={[styles.refreshButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={isDarkMode ? "#fff" : "#666"} />
          ) : (
            <RefreshCw size={20} color={isDarkMode ? "#fff" : "#666"} />
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.orderList}>
        {orders.map((order) => (
          <View key={order.id} style={[styles.orderCard, isDarkMode && styles.darkOrderCard]}>
            <View style={[styles.orderHeader, isDarkMode && { borderBottomColor: '#333' }]}>
              <Text style={[styles.orderNumber, isDarkMode && styles.darkText]}>Order #{order.order_number}</Text>
              <Text style={[
                styles.orderStatus,
                order.status === 'completed' && styles.statusCompleted,
                order.status === 'pending' && styles.statusPending,
              ]}>
                {order.status.toUpperCase()}
              </Text>
            </View>

            {order.items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Image 
                  source={{ uri: item.image_url }}
                  style={styles.productImage}
                />
                <View style={styles.itemDetails}>
                  <Text style={[styles.productName, isDarkMode && styles.darkText]}>{item.product_name}</Text>
                  <Text style={[styles.itemQuantity, isDarkMode && { color: '#aaa' }]}>
                    {item.quantity} x ₹{item.price_per_unit}
                  </Text>
                </View>
                <Text style={[styles.itemTotal, isDarkMode && styles.darkText]}>₹{item.total_price}</Text>
              </View>
            ))}

            <View style={[styles.orderFooter, isDarkMode && { borderTopColor: '#333' }]}>
              <Text style={[styles.totalLabel, isDarkMode && { color: '#aaa' }]}>Total Amount</Text>
              <Text style={[styles.totalAmount, isDarkMode && styles.darkText]}>₹{order.total_amount}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  headerWithRefresh: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  darkHeader: {
    backgroundColor: '#1e1e1e',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: '#1a1a1a',
  },
  darkText: {
    color: '#fff',
  },
  orderList: {
    padding: 15,
  },
  orderCard: {
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
  darkOrderCard: {
    backgroundColor: '#1e1e1e',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderNumber: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#1a1a1a',
  },
  orderStatus: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#e6f4ea',
    color: '#1e8e3e',
  },
  statusPending: {
    backgroundColor: '#fef7e6',
    color: '#f9a825',
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  itemQuantity: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1a1a1a',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#666',
  },
  totalAmount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    color: '#1a1a1a',
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
    backgroundColor: '#1a1a1a',
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
  shopButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: 200,
    alignItems: 'center',
  },
});