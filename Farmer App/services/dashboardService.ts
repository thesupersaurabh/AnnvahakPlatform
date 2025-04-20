import { api } from '../utils/api';

export interface Product {
  id: string | number;
  name: string;
  is_approved: boolean;
  is_available: boolean;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string | number;
  total_price: number;
  status: string;
}

export interface Order {
  order_number: string;
  buyer_name: string;
  order_date: string;
  items: OrderItem[];
}

export interface Conversation {
  user: {
    full_name: string;
  };
  unread_count: number;
  latest_message?: {
    created_at: string;
  };
}

export interface DashboardStats {
  total_sales: number;
  total_products: number;
  pending_orders: number;
  new_messages: number;
  revenue_growth: number;
  monthly_sales: {
    month: string;
    amount: number;
  }[];
  product_stats: {
    name: string;
    sold: number;
  }[];
  recent_activities: {
    id: number;
    type: 'order' | 'message' | 'product' | 'alert';
    time: string;
    title: string;
    description: string;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const dashboardService = {
  getStats: async (token: string): Promise<{
    success: boolean;
    data: DashboardStats | null;
    message?: string;
  }> => {
    try {
      // Making API calls to aggregate dashboard data
      const [productsResponse, ordersResponse, messagesResponse] = await Promise.all([
        // Get farmer products
        api.get<{products: Product[]}>('/api/products/farmer', token),
        // Get farmer orders
        api.get<{orders: Order[]}>('/api/orders/farmer', token),
        // Get conversations
        api.get<{conversations: Conversation[]}>('/api/chats/conversations', token)
      ]);

      // Check if any of the requests failed
      if (!productsResponse.success || !ordersResponse.success) {
        console.error('Error fetching dashboard data:', 
          !productsResponse.success ? productsResponse.message : ordersResponse.message);
        
        throw new Error('Failed to fetch dashboard data');
      }

      // Extract data from responses
      const products = productsResponse.data.products || [];
      const orders = ordersResponse.data.orders || [];
      const conversations = messagesResponse.success ? (messagesResponse.data.conversations || []) : [];

      // Process the data
      const totalProducts = products.length;
      
      // Calculate total sales and pending orders
      let totalSales = 0;
      let pendingOrdersCount = 0;
      
      // Collect all order items for sales calculation
      const allOrderItems = orders.flatMap((order: Order) => order.items || []);
      
      // Count items with different statuses
      for (const item of allOrderItems) {
        totalSales += item.total_price || 0;
        
        if (item.status === 'pending') {
          pendingOrdersCount++;
        }
      }

      // Count unread messages
      const unreadMessages = conversations.reduce((sum: number, conv: Conversation) => sum + (conv.unread_count || 0), 0);

      // No monthly sales historical data available from API - return empty array
      const monthlySales: {month: string, amount: number}[] = [];
      
      // Revenue growth cannot be calculated without historical data
      const revenueGrowth = 0;

      // Product stats for top selling products
      const productStats = products
        .map((product: Product) => ({
          name: product.name,
          sold: allOrderItems.filter((item: OrderItem) => item.product_id === product.id).length
        }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);

      // Add a function to generate unique IDs for activities
      const generateUniqueId = (() => {
        let counter = 0;
        return () => {
          counter += 1;
          return counter;
        };
      })();

      // Recent activities - only include real data
      const recentActivities: Array<{
        id: number;
        type: 'order' | 'message' | 'product' | 'alert';
        time: string;
        title: string;
        description: string;
      }> = [];

      // Add recent order activities
      orders.slice(0, 2).forEach((order, i) => {
        recentActivities.push({
          id: generateUniqueId(),
          type: 'order' as const,
          time: new Date(order.order_date || Date.now()).toLocaleDateString(),
          title: 'New Order Received',
          description: `Order #${order.order_number} from ${order.buyer_name}`
        });
      });

      // Add message activities if available
      conversations.slice(0, 1).forEach((conv, i) => {
        recentActivities.push({
          id: generateUniqueId(),
          type: 'message' as const,
          time: conv.latest_message ? new Date(conv.latest_message.created_at).toLocaleDateString() : 'Recently',
          title: 'New Message',
          description: `${conv.user.full_name} sent you a message`
        });
      });

      // Add product activities
      products.filter((p: Product) => p.is_approved).slice(0, 1).forEach((product, i) => {
        recentActivities.push({
          id: generateUniqueId(),
          type: 'product' as const,
          time: new Date(product.updated_at || Date.now()).toLocaleDateString(),
          title: 'Product Update',
          description: `Your ${product.name} listing was approved`
        });
      });

      // Construct the dashboard stats - only using real data
      const dashboardStats: DashboardStats = {
        total_sales: totalSales,
        total_products: totalProducts,
        pending_orders: pendingOrdersCount,
        new_messages: unreadMessages,
        revenue_growth: revenueGrowth,
        monthly_sales: monthlySales,
        product_stats: productStats,
        recent_activities: recentActivities
      };

      return {
        success: true,
        data: dashboardStats
      };
    } catch (error) {
      console.error('Error in dashboard service:', error);
      
      // Return null data instead of mock data on error
      return {
        success: false,
        data: null,
        message: error instanceof Error ? error.message : 'Failed to fetch dashboard data'
      };
    }
  }
}; 