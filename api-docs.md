# Annvahak Platform API Documentation

## Overview
The Annvahak Platform is a system-level, scalable direct market access platform designed to connect farmers and buyers. This API provides endpoints for user authentication, product management, order processing, and chat functionality.

## Base URL
To get a working API, please connect with the team or run backend.py locally to retrieve your API URL.

## Authentication
Authentication is handled using JWT (JSON Web Tokens). To access protected routes, you must include a valid JWT token in the `Authorization` header as follows:
```
Authorization: Bearer <token>
```

### Register
Registers a new user.

- **Endpoint:** `/api/auth/register`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string",
    "role": "farmer" or "buyer",
    "full_name": "string",
    "phone": "string",
    "address": "string" (optional)
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered successfully!",
    "token": "string",
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "role": "string",
      "full_name": "string"
    }
  }
  ```

### Login
Logs in a user and returns a JWT token.

- **Endpoint:** `/api/auth/login`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful!",
    "token": "string",
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "role": "string",
      "full_name": "string"
    }
  }
  ```

### Get Profile
Retrieves the profile of the authenticated user.

- **Endpoint:** `/api/auth/profile`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "role": "string",
      "full_name": "string",
      "phone": "string",
      "address": "string",
      "is_active": "boolean",
      "is_verified": "boolean",
      "created_at": "timestamp"
    }
  }
  ```

### Update Profile
Updates the profile of the authenticated user.

- **Endpoint:** `/api/auth/profile`
- **Method:** `PUT`
- **Request Body:**
  ```json
  {
    "full_name": "string" (optional),
    "phone": "string" (optional),
    "address": "string" (optional)
  }
  ```
- **Response:**
  ```json
  {
    "message": "Profile updated successfully!"
  }
  ```

## Products

### Get Products
Retrieves a list of approved and available products. Supports filtering by category, search term, and farmer ID.

- **Endpoint:** `/api/products`
- **Method:** `GET`
- **Query Parameters:**
  - `category`: string (optional)
  - `search`: string (optional)
  - `farmer_id`: integer (optional)
- **Response:**
  ```json
  {
    "products": [
      {
        "id": "integer",
        "name": "string",
        "description": "string",
        "category": "string",
        "price": "decimal",
        "quantity": "integer",
        "unit": "string",
        "image_url": "string",
        "is_approved": "boolean",
        "is_available": "boolean",
        "farmer_id": "integer",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "farmer_name": "string"
      }
    ]
  }
  ```

### Get All Products (Admin Only)
Retrieves a list of all products, including unapproved and unavailable ones.

- **Endpoint:** `/api/products/all`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "products": [
      {
        "id": "integer",
        "name": "string",
        "description": "string",
        "category": "string",
        "price": "decimal",
        "quantity": "integer",
        "unit": "string",
        "image_url": "string",
        "is_approved": "boolean",
        "is_available": "boolean",
        "farmer_id": "integer",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "farmer_name": "string"
      }
    ]
  }
  ```

### Get Farmer Products (Farmer Only)
Retrieves a list of products posted by the authenticated farmer.

- **Endpoint:** `/api/products/farmer`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "products": [
      {
        "id": "integer",
        "name": "string",
        "description": "string",
        "category": "string",
        "price": "decimal",
        "quantity": "integer",
        "unit": "string",
        "image_url": "string",
        "is_approved": "boolean",
        "is_available": "boolean",
        "farmer_id": "integer",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
  }
  ```

### Create Product (Farmer Only)
Creates a new product. The product will be pending approval until an admin approves it.

- **Endpoint:** `/api/products`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "name": "string",
    "description": "string",
    "category": "string",
    "price": "decimal",
    "quantity": "integer",
    "unit": "string",
    "image_url": "string" (optional)
  }
  ```
- **Response:**
  ```json
  {
    "message": "Product created successfully! Waiting for admin approval.",
    "product": {
      "id": "integer",
      "name": "string",
      "description": "string",
      "category": "string",
      "price": "decimal",
      "quantity": "integer",
      "unit": "string",
      "image_url": "string",
      "is_approved": "boolean",
      "is_available": "boolean",
      "farmer_id": "integer",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
  ```

### Get Product
Retrieves a product by ID.

- **Endpoint:** `/api/products/<product_id>`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "product": {
      "id": "integer",
      "name": "string",
      "description": "string",
      "category": "string",
      "price": "decimal",
      "quantity": "integer",
      "unit": "string",
      "image_url": "string",
      "is_approved": "boolean",
      "is_available": "boolean",
      "farmer_id": "integer",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "farmer_name": "string",
      "farmer_phone": "string"
    }
  }
  ```

### Update Product
Updates a product. Only the farmer who posted the product or an admin can update it.

- **Endpoint:** `/api/products/<product_id>`
- **Method:** `PUT`
- **Request Body:**
  ```json
  {
    "name": "string" (optional),
    "description": "string" (optional),
    "category": "string" (optional),
    "price": "decimal" (optional),
    "quantity": "integer" (optional),
    "unit": "string" (optional),
    "image_url": "string" (optional),
    "is_available": "boolean" (optional),
    "is_approved": "boolean" (optional, admin only)
  }
  ```
- **Response:**
  ```json
  {
    "message": "Product updated successfully!",
    "product": {
      "id": "integer",
      "name": "string",
      "description": "string",
      "category": "string",
      "price": "decimal",
      "quantity": "integer",
      "unit": "string",
      "image_url": "string",
      "is_approved": "boolean",
      "is_available": "boolean",
      "farmer_id": "integer",
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  }
  ```

### Delete Product
Deletes a product. Only the farmer who posted the product or an admin can delete it.

- **Endpoint:** `/api/products/<product_id>`
- **Method:** `DELETE`
- **Response:**
  ```json
  {
    "message": "Product deleted successfully!"
  }
  ```

### Approve Product (Admin Only)
Approves a product.

- **Endpoint:** `/api/products/approve/<product_id>`
- **Method:** `PUT`
- **Response:**
  ```json
  {
    "message": "Product approved successfully!"
  }
  ```

## Orders

### Create Order (Buyer Only)
Creates a new order.

- **Endpoint:** `/api/orders`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "items": [
      {
        "product_id": "integer",
        "quantity": "integer"
      }
    ],
    "delivery_address": "string",
    "contact_number": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Order placed successfully!",
    "order": {
      "id": "integer",
      "order_number": "string",
      "total_amount": "decimal",
      "status": "string"
    }
  }
  ```

### Get Buyer Orders (Buyer Only)
Retrieves a list of orders placed by the authenticated buyer.

- **Endpoint:** `/api/orders/buyer`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "orders": [
      {
        "id": "integer",
        "order_number": "string",
        "total_amount": "decimal",
        "status": "string",
        "delivery_address": "string",
        "contact_number": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "items": [
          {
            "id": "integer",
            "product_id": "integer",
            "product_name": "string",
            "image_url": "string",
            "quantity": "integer",
            "price_per_unit": "decimal",
            "total_price": "decimal",
            "status": "string",
            "created_at": "timestamp"
          }
        ]
      }
    ]
  }
  ```

### Get Farmer Orders (Farmer Only)
Retrieves a list of orders that include products posted by the authenticated farmer.

- **Endpoint:** `/api/orders/farmer`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "orders": [
      {
        "order_id": "integer",
        "order_number": "string",
        "buyer_name": "string",
        "buyer_id": "integer",
        "delivery_address": "string",
        "contact_number": "string",
        "order_date": "timestamp",
        "items": [
          {
            "id": "integer",
            "product_id": "integer",
            "product_name": "string",
            "image_url": "string",
            "quantity": "integer",
            "price_per_unit": "decimal",
            "total_price": "decimal",
            "status": "string",
            "created_at": "timestamp"
          }
        ]
      }
    ]
  }
  ```

### Get All Orders (Admin Only)
Retrieves a list of all orders.

- **Endpoint:** `/api/orders`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "orders": [
      {
        "id": "integer",
        "order_number": "string",
        "total_amount": "decimal",
        "status": "string",
        "delivery_address": "string",
        "contact_number": "string",
        "created_at": "timestamp",
        "updated_at": "timestamp",
        "items": [
          {
            "id": "integer",
            "product_id": "integer",
            "product_name": "string",
            "image_url": "string",
            "quantity": "integer",
            "price_per_unit": "decimal",
            "total_price": "decimal",
            "status": "string",
            "created_at": "timestamp"
          }
        ]
      }
    ]
  }
  ```

### Get Order
Retrieves an order by ID.

- **Endpoint:** `/api/orders/<order_id>`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "order": {
      "id": "integer",
      "order_number": "string",
      "total_amount": "decimal",
      "status": "string",
      "delivery_address": "string",
      "contact_number": "string",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "items": [
        {
          "id": "integer",
          "product_id": "integer",
          "product_name": "string",
          "image_url": "string",
          "quantity": "integer",
          "price_per_unit": "decimal",
          "total_price": "decimal",
          "status": "string",
          "created_at": "timestamp"
        }
      ]
    }
  }
  ```

### Update Order Item Status
Updates the status of an order item.

- **Endpoint:** `/api/orders/item/<item_id>/status`
- **Method:** `PUT`
- **Request Body:**
  ```json
  {
    "status": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Order item status updated successfully!"
  }
  ```

## Chats

### Send Message
Sends a message to another user.

- **Endpoint:** `/api/chats/send`
- **Method:** `POST`
- **Request Body:**
  ```json
  {
    "receiver_id": "integer",
    "message": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Message sent successfully!",
    "chat": {
      "id": "integer",
      "sender_id": "integer",
      "receiver_id": "integer",
      "message": "string",
      "is_read": "boolean",
      "created_at": "timestamp"
    }
  }
  ```

### Get Conversation
Retrieves a conversation with another user.

- **Endpoint:** `/api/chats/<user_id>`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "other_user": {
      "id": "integer",
      "role": "string",
      "full_name": "string"
    },
    "messages": [
      {
        "id": "integer",
        "sender_id": "integer",
        "receiver_id": "integer",
        "message": "string",
        "is_read": "boolean",
        "created_at": "timestamp"
      }
    ]
  }
  ```

### Get Conversations
Retrieves a list of conversations.

- **Endpoint:** `/api/chats/conversations`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "conversations": [
      {
        "user": {
          "id": "integer",
          "username": "string",
          "full_name": "string",
          "role": "string"
        },
        "latest_message": {
          "message": "string",
          "sender_id": "integer",
          "created_at": "timestamp"
        },
        "unread_count": "integer"
      }
    ]
  }
  ```

## User Management (Admin Only)

### Get All Users
Retrieves a list of all users.

- **Endpoint:** `/api/admin/users`
- **Method:** `GET`
- **Query Parameters:**
  - `role`: string (optional)
- **Response:**
  ```json
  {
    "users": [
      {
        "id": "integer",
        "username": "string",
        "email": "string",
        "role": "string",
        "full_name": "string",
        "phone": "string",
        "address": "string",
        "is_active": "boolean",
        "is_verified": "boolean",
        "created_at": "timestamp",
        "updated_at": "timestamp"
      }
    ]
  }
  ```

### Update User Status
Updates the status of a user.

- **Endpoint:** `/api/admin/users/<user_id>`
- **Method:** `PUT`
- **Request Body:**
  ```json
  {
    "is_active": "boolean" (optional),
    "is_verified": "boolean" (optional)
  }
  ```
- **Response:**
  ```json
  {
    "message": "User status updated successfully!"
  }
  ```

---

This documentation provides a comprehensive overview of the Annvahak Platform API. For more information or support, please contact the API administrator.
