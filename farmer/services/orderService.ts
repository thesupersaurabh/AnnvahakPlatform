import { api, endpoints } from '../utils/api';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export const orderService = {
  getOrders: async (token: string) => {
    return api.get<{
      data: Order[];
      total: number;
    }>(endpoints.orders.list, token);
  },
  
  getOrderById: async (id: string, token: string) => {
    return api.get<Order>(endpoints.orders.details(id), token);
  },
  
  updateOrderStatus: async (id: string, status: Order['status'], token: string) => {
    return api.put<Order>(endpoints.orders.updateStatus(id), { status }, token);
  }
}; 