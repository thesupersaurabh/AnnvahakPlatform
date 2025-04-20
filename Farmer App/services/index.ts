import { authService } from './authService';
import { productService, Product } from './productService';
import { orderService, Order, OrderItem } from './orderService';
import { messageService, Message, Conversation } from './messageService';
import { dashboardService, DashboardStats } from './dashboardService';
import { ApiResponse, PaginatedResponse, ListParams, ApiError } from './types';

export {
  // Services
  authService,
  productService,
  orderService,
  messageService,
  dashboardService,
  
  // Types
  Product,
  Order,
  OrderItem,
  Message,
  Conversation,
  DashboardStats,
  
  // Common types
  ApiResponse,
  PaginatedResponse,
  ListParams,
  ApiError
}; 