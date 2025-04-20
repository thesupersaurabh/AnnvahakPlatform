import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { ArrowLeft, Package, ChevronRight, Filter, Search } from 'lucide-react-native';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { api, endpoints } from '../../utils/api';

interface Order {
  id: number;
  buyer_name: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number;
  created_at: string;
  items_count: number;
}

export default function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });
  
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      // This is a placeholder - in a real app, you would fetch from your API
      // using the endpoints.orders.list route
      
      // Simulating API call
      setTimeout(() => {
        const mockOrders: Order[] = [
          {
            id: 1001,
            buyer_name: 'Rahul Sharma',
            status: 'pending',
            total_amount: 2500,
            created_at: new Date().toISOString(),
            items_count: 3
          },
          {
            id: 1002,
            buyer_name: 'Priya Patel',
            status: 'processing',
            total_amount: 1800,
            created_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
            items_count: 2
          },
          {
            id: 1003,
            buyer_name: 'Amit Kumar',
            status: 'shipped',
            total_amount: 3200,
            created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            items_count: 4
          },
          {
            id: 1004,
            buyer_name: 'Neha Gupta',
            status: 'delivered',
            total_amount: 1200,
            created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
            items_count: 1
          }
        ];
        
        setOrders(mockOrders);
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, fetchOrders]);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);
  
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'processing':
        return '#2196F3';
      case 'shipped':
        return '#9C27B0';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#F44336';
      default:
        return '#757575';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  if (!fontsLoaded) {
    return null;
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }}
      />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Orders</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loaderText, { color: colors.text }]}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Package size={60} color={colors.secondary} style={{ marginBottom: 20 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Orders Yet</Text>
              <Text style={[styles.emptySubtitle, { color: colors.secondary }]}>
                You haven't received any orders yet
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.orderCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/order/${item.id}`)}
            >
              <View style={styles.orderHeader}>
                <View>
                  <Text style={[styles.orderId, { color: colors.text }]}>Order #{item.id}</Text>
                  <Text style={[styles.orderDate, { color: colors.secondary }]}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.orderDetails}>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.secondary }]}>Customer</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{item.buyer_name}</Text>
                </View>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.secondary }]}>Items</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{item.items_count}</Text>
                </View>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.secondary }]}>Total</Text>
                  <Text style={[styles.detailValue, { color: colors.primary }]}>₹{item.total_amount}</Text>
                </View>
                <ChevronRight size={20} color={colors.secondary} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
  },
  filterButton: {
    padding: 8,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  orderCard: {
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  orderId: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
}); 