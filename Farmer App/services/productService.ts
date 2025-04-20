import { api, endpoints } from '../utils/api';

export interface Product {
  id: number | string;
  name: string;
  description: string;
  category: string;
  price: number;
  quantity: number;
  unit: string;
  image_url: string;
  is_approved: boolean;
  is_available: boolean;
  farmer_id: number | string;
  created_at: string;
  updated_at: string;
  farmer_name?: string;
  farmer_phone?: string;
  stock?: number;
  imageUrl?: string;
}

export const productService = {
  // For farmer's own products
  getProductsByFarmer: async (token: string) => {
    try {
      // According to the API docs, this endpoint returns the products posted by the authenticated farmer
      const response = await api.get<{ products: Product[] }>('/api/products/farmer', token);
      return response;
    } catch (error) {
      console.error('Error fetching farmer products:', error);
      return {
        success: false,
        data: { products: [] },
        message: error instanceof Error ? error.message : 'Failed to fetch farmer products'
      };
    }
  },
  
  // For all available products (public endpoint)
  getProducts: async (params?: {
    category?: string;
    search?: string;
    farmer_id?: string | number;
    page?: number;
    limit?: number;
  }) => {
    try {
      const queryString = params 
        ? `?${Object.entries(params)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
            .join('&')}`
        : '';
        
      // According to API docs, this returns all approved and available products
      const response = await api.get<{ products: Product[] }>(`${endpoints.products.list}${queryString}`);
      console.log('Products fetched:', response.data.products ? response.data.products.length : 0);
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        success: false,
        data: { products: [] },
        message: error instanceof Error ? error.message : 'Failed to fetch products'
      };
    }
  },
  
  getProductById: async (id: string) => {
    try {
      // According to API docs, this returns a single product by ID
      const response = await api.get<{ product: Product }>(endpoints.products.details(id));
      return response;
    } catch (error) {
      console.error('Error fetching product details:', error);
      return {
        success: false,
        data: { product: null as unknown as Product },
        message: error instanceof Error ? error.message : 'Failed to fetch product details'
      };
    }
  },
  
  createProduct: async (productData: FormData, token: string) => {
    try {
      // According to API docs, this creates a new product
      const response = await api.uploadForm<{ product: Product, message: string }>(endpoints.products.create, productData, token);
      return response;
    } catch (error) {
      console.error('Error creating product:', error);
      return {
        success: false,
        data: { product: null as unknown as Product, message: '' },
        message: error instanceof Error ? error.message : 'Failed to create product'
      };
    }
  },
  
  updateProduct: async (id: string, productData: FormData, token: string) => {
    try {
      // According to API docs, this updates an existing product
      const response = await api.uploadForm<{ product: Product, message: string }>(endpoints.products.update(id), productData, token);
      return response;
    } catch (error) {
      console.error('Error updating product:', error);
      return {
        success: false,
        data: { product: null as unknown as Product, message: '' },
        message: error instanceof Error ? error.message : 'Failed to update product'
      };
    }
  },
  
  deleteProduct: async (id: string, token: string) => {
    try {
      // According to API docs, this deletes a product
      const response = await api.delete<{ message: string }>(endpoints.products.delete(id), token);
      return response;
    } catch (error) {
      console.error('Error deleting product:', error);
      return {
        success: false,
        data: { message: '' },
        message: error instanceof Error ? error.message : 'Failed to delete product'
      };
    }
  },
}; 