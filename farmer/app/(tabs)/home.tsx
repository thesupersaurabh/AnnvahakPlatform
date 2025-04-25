import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useFonts, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { dashboardService, DashboardStats } from '../../services/dashboardService';
import { 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingBag, 
  Plus, 
  Truck, 
  ArrowUpRight, 
  MessageSquare,
  AlertCircle,
  DollarSign,
  Info
} from 'lucide-react-native';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated, user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const screenWidth = Dimensions.get('window').width - 40;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
  });

  const fetchDashboardStats = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await dashboardService.getStats(token);
      
      if (response.success) {
        setStats(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to load dashboard data');
        console.error('Error loading dashboard:', response.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchDashboardStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token, fetchDashboardStats]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  }, [fetchDashboardStats]);

  const getIconForActivityType = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag size={18} color={colors.primary} />;
      case 'message':
        return <MessageSquare size={18} color="#2196F3" />;
      case 'product':
        return <Package size={18} color="#4CAF50" />;
      case 'alert':
        return <AlertCircle size={18} color="#F44336" />;
      default:
        return <ArrowUpRight size={18} color={colors.primary} />;
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={[styles.messageText, { color: colors.text }]}>Please login to view your dashboard</Text>
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
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.messageText, { color: colors.text, marginTop: 15 }]}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  if (error || !stats) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        </View>
        <View style={styles.centerContainer}>
          <AlertCircle size={40} color="#F44336" />
          <Text style={[styles.messageText, { color: colors.text, marginTop: 15 }]}>
            {error || 'Unable to load dashboard data'}
          </Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={fetchDashboardStats}
          >
            <Text style={styles.loginButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show a simplified dashboard if no data is available for any section
  const hasNoData = stats.monthly_sales.length === 0 && 
                   stats.product_stats.length === 0 && 
                   stats.recent_activities.length === 0 &&
                   stats.total_products === 0;

  if (hasNoData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Hello, {user?.full_name?.split(' ')[0]}!
          </Text>
        </View>
        
        <View style={styles.centerContainer}>
          <Info size={40} color={colors.primary} />
          <Text style={[styles.messageText, { color: colors.text, marginTop: 15 }]}>
            No data available yet
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colors.secondary, marginBottom: 20 }]}>
            Add products, receive orders, or send messages to see your dashboard data
          </Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.card, width: '100%' }]}
              onPress={() => router.push('/product/create')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: `${colors.primary}20` }]}>
                <Plus size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Add Product</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Dashboard</Text>
        <Text style={[styles.greeting, { color: colors.text }]}>
          Hello, {user?.full_name?.split(' ')[0]}!
        </Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <View style={[styles.statIconContainer, { backgroundColor: `${colors.primary}20` }]}>
            <DollarSign size={18} color={colors.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: colors.text }]}>₹{stats.total_sales.toLocaleString()}</Text>
            <Text style={[styles.statLabel, { color: colors.secondary }]}>Total Sales</Text>
          </View>
          {stats.revenue_growth > 0 && (
            <View style={styles.statBadge}>
              <TrendingUp size={12} color="#4CAF50" />
              <Text style={styles.statGrowth}>+{stats.revenue_growth}%</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/products')}
        >
          <View style={[styles.statIconContainer, { backgroundColor: '#4CAF5020' }]}>
            <Package size={18} color="#4CAF50" />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.total_products}</Text>
            <Text style={[styles.statLabel, { color: colors.secondary }]}>Products</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/orders')}
        >
          <View style={[styles.statIconContainer, { backgroundColor: '#FFC10720' }]}>
            <ShoppingBag size={18} color="#FFC107" />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending_orders}</Text>
            <Text style={[styles.statLabel, { color: colors.secondary }]}>Pending Orders</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.statCard, { backgroundColor: colors.card }]}
          onPress={() => router.push('/(tabs)/messages')}
        >
          <View style={[styles.statIconContainer, { backgroundColor: '#2196F320' }]}>
            <MessageSquare size={18} color="#2196F3" />
          </View>
          <View style={styles.statInfo}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.new_messages}</Text>
            <Text style={[styles.statLabel, { color: colors.secondary }]}>New Messages</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/product/create')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: `${colors.primary}20` }]}>
              <Plus size={20} color={colors.primary} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/orders')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#FFC10720' }]}>
              <Truck size={20} color="#FFC107" />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Manage Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(tabs)/messages')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#2196F320' }]}>
              <MessageSquare size={20} color="#2196F3" />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sales Chart - Only show if there's data */}
      {stats.monthly_sales.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Sales</Text>
          <View style={styles.chartContainer}>
            <View style={styles.barChart}>
              {stats.monthly_sales.map((item, index) => {
                const maxAmount = Math.max(...stats.monthly_sales.map(item => item.amount));
                const barHeight = (item.amount / maxAmount) * 150;
                
                return (
                  <View key={index} style={styles.barColumn}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: barHeight, 
                          backgroundColor: colors.primary 
                        }
                      ]} 
                    />
                    <Text style={[styles.barLabel, { color: colors.secondary }]}>{item.month}</Text>
                    <Text style={[styles.barValue, { color: colors.text }]}>
                      ₹{(item.amount / 1000).toFixed(1)}k
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Top Products - Only show if there's data */}
      {stats.product_stats.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Products</Text>
          <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
            <View style={styles.barChart}>
              {stats.product_stats.map((item, index) => {
                const maxSold = Math.max(...stats.product_stats.map(item => item.sold));
                const barHeight = maxSold > 0 ? (item.sold / maxSold) * 150 : 30;
                
                return (
                  <View key={index} style={styles.barColumn}>
                    <View 
                      style={[
                        styles.bar, 
                        { 
                          height: barHeight, 
                          backgroundColor: '#4CAF50' 
                        }
                      ]} 
                    />
                    <Text style={[styles.barLabel, { color: colors.secondary }]}>{item.name}</Text>
                    <Text style={[styles.barValue, { color: colors.text }]}>{item.sold}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Recent Activities - Only show if there's data */}
      {stats.recent_activities.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activities</Text>
          <View style={[styles.activitiesContainer, { backgroundColor: colors.card }]}>
            {stats.recent_activities.map(activity => (
              <TouchableOpacity 
                key={activity.id}
                style={styles.activityItem}
                onPress={() => {
                  // Navigate based on activity type
                  switch (activity.type) {
                    case 'order':
                      router.push('/(tabs)/orders');
                      break;
                    case 'message':
                      router.push('/(tabs)/messages');
                      break;
                    case 'product':
                      router.push('/(tabs)/home');
                      break;
                    default:
                      break;
                  }
                }}
              >
                <View style={styles.activityIconContainer}>
                  {getIconForActivityType(activity.type)}
                </View>
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.text }]}>{activity.title}</Text>
                  <Text style={[styles.activityDescription, { color: colors.secondary }]}>{activity.description}</Text>
                </View>
                <Text style={[styles.activityTime, { color: colors.secondary }]}>{activity.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Show message if no data sections are available */}
      {stats.monthly_sales.length === 0 && 
       stats.product_stats.length === 0 && 
       stats.recent_activities.length === 0 && (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.emptyStateContainer}>
            <Info size={30} color={colors.primary} />
            <Text style={[styles.emptyStateText, { color: colors.text, marginTop: 10 }]}>
              No detailed data available yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.secondary }]}>
              Continue using the platform to see more insights
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.versionText, { color: colors.secondary }]}>
          AnnVahak Seller v1.0.0
        </Text>
      </View>
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
  title: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statInfo: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statGrowth: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontFamily: 'Inter_600SemiBold',
  },
  section: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '31%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginTop: 15,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    paddingTop: 15,
    marginBottom: 10,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  bar: {
    width: 20,
    borderRadius: 4,
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  barValue: {
    fontSize: 10,
    marginTop: 2,
  },
  activitiesContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  activityTime: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  emptyStateContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  versionText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
}); 