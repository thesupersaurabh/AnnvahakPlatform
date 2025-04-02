#!/usr/bin/env python3
# Annvahak Platform - Flask API
# A system-level, scalable direct market access platform

import os
import json
import datetime
import uuid
import jwt
import bcrypt
import time
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key_change_in_production')
app.config['JWT_EXPIRATION_DELTA'] = datetime.timedelta(days=7)

# Configure CORS
CORS(app, resources={r"/*": {"origins": "*"}})  # Restrict in production

# Configure Rate Limiting
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200000 per day", "50000 per hour"]
)

# Database Configuration
DB_CONFIG = {
    'dbname': os.environ.get('DB_NAME'),
    'user': os.environ.get('DB_USER'),
    'password': os.environ.get('DB_PASSWORD'),
    'host': os.environ.get('DB_HOST'),
    'port': os.environ.get('DB_PORT')
}
# Database Connection Pool
try:
    db_pool = ThreadedConnectionPool(
        minconn=1,
        maxconn=10,
        **DB_CONFIG
    )
except psycopg2.Error as e:
    print(f"Error connecting to PostgreSQL: {e}")
    raise

# Helper function to get database connection from pool
def get_db_connection():
    if not hasattr(g, 'db_conn'):
        g.db_conn = db_pool.getconn()
    return g.db_conn

# Return connection to the pool when request is done
@app.teardown_appcontext
def close_db_connection(exception):
    if hasattr(g, 'db_conn'):
        db_pool.putconn(g.db_conn)

# Initialize database tables
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create Users Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'farmer', 'buyer')),
        full_name VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create Products Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        category VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        quantity INTEGER NOT NULL,
        unit VARCHAR(20) NOT NULL,
        image_url TEXT,
        is_approved BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        farmer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create Orders Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        buyer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
        total_amount DECIMAL(10, 2) NOT NULL,
        delivery_address TEXT,
        contact_number VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create Order Items Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        farmer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price_per_unit DECIMAL(10, 2) NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Create Chats Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    conn.commit()
    cursor.close()

# Initialize database on startup
with app.app_context():
    init_db() 

# Authentication Middleware & Helpers
def generate_jwt(user_id, role):
    """Generate JWT token for authenticated users"""
    payload = {
        'exp': datetime.datetime.utcnow() + app.config['JWT_EXPIRATION_DELTA'],
        'iat': datetime.datetime.utcnow(),
        'sub': user_id,
        'role': role
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def token_required(f):
    """Decorator to protect routes that require authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Token is missing!'}), 401

        if not token:
            return jsonify({'message': 'Token is missing!'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = {
                'id': data['sub'],
                'role': data['role']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

def role_required(roles):
    """Decorator to check user roles"""
    def decorator(f):
        @wraps(f)
        def decorated_function(current_user, *args, **kwargs):
            if current_user['role'] not in roles:
                return jsonify({'message': 'Permission denied!'}), 403
            return f(current_user, *args, **kwargs)
        return decorated_function
    return decorator

@app.route('/', methods=['GET'])
def get_root():
    return jsonify({'message': 'Welcome to the Annvahak API!'}), 200

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
@limiter.limit("20/hour")
def register():
    data = request.get_json()
    
    # Validate input data
    required_fields = ['username', 'email', 'password', 'role', 'full_name', 'phone']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Validate role
    if data['role'] not in ['farmer', 'buyer']:
        return jsonify({'message': 'Invalid role. Must be farmer or buyer'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Check if username or email already exists
    cursor.execute("SELECT * FROM users WHERE username = %s OR email = %s", 
                  (data['username'], data['email']))
    existing_user = cursor.fetchone()
    
    if existing_user:
        cursor.close()
        return jsonify({'message': 'Username or email already exists!'}), 409
    
    # Hash the password
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Insert new user
    try:
        cursor.execute(
            '''INSERT INTO users (username, email, password, role, full_name, phone, address) 
               VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id''',
            (data['username'], data['email'], hashed_password, data['role'], 
             data['full_name'], data['phone'], data.get('address', ''))
        )
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        # Generate JWT token
        token = generate_jwt(user_id, data['role'])
        
        return jsonify({
            'message': 'User registered successfully!',
            'token': token,
            'user': {
                'id': user_id,
                'username': data['username'],
                'email': data['email'],
                'role': data['role'],
                'full_name': data['full_name']
            }
        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error creating user: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("20/hour")
def login():
    data = request.get_json()
    
    # Validate input data
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'message': 'Username and password are required!'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Get user by username
    cursor.execute("SELECT * FROM users WHERE username = %s", (data['username'],))
    user = cursor.fetchone()
    cursor.close()
    
    if not user:
        return jsonify({'message': 'Invalid username or password!'}), 401
    
    # Check if user is active
    if not user['is_active']:
        return jsonify({'message': 'Your account has been deactivated. Please contact support.'}), 403
    
    # Verify password
    if bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
        # Generate JWT token
        token = generate_jwt(user['id'], user['role'])
        
        return jsonify({
            'message': 'Login successful!',
            'token': token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'full_name': user['full_name']
            }
        }), 200
    else:
        return jsonify({'message': 'Invalid username or password!'}), 401

@app.route('/api/auth/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cursor.execute("SELECT id, username, email, role, full_name, phone, address, is_active, is_verified, created_at FROM users WHERE id = %s", 
                  (current_user['id'],))
    user = cursor.fetchone()
    cursor.close()
    
    if not user:
        return jsonify({'message': 'User not found!'}), 404
    
    # Convert to dictionary for JSON serialization
    user_dict = dict(user)
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    return jsonify({
        'user': user_dict
    }), 200

@app.route('/api/auth/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fields that are allowed to be updated
    allowed_fields = ['full_name', 'phone', 'address']
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        return jsonify({'message': 'No valid fields to update!'}), 400
    
    try:
        # Construct update query dynamically
        query = "UPDATE users SET " + ", ".join([f"{key} = %s" for key in update_data.keys()]) + ", updated_at = CURRENT_TIMESTAMP WHERE id = %s"
        values = list(update_data.values()) + [current_user['id']]
        
        cursor.execute(query, values)
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'message': 'User not found!'}), 404
        
        return jsonify({'message': 'Profile updated successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error updating profile: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/auth/change-password', methods=['PUT'])
@token_required
def change_password(current_user):
    data = request.get_json()
    
    # Validate input data
    if not data or not data.get('current_password') or not data.get('new_password'):
        return jsonify({'message': 'Current password and new password are required!'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get user with password
        cursor.execute("SELECT * FROM users WHERE id = %s", (current_user['id'],))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found!'}), 404
        
        # Verify current password
        if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user['password'].encode('utf-8')):
            return jsonify({'message': 'Current password is incorrect!'}), 401
        
        # Hash the new password
        hashed_password = bcrypt.hashpw(data['new_password'].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Update the password
        cursor.execute(
            "UPDATE users SET password = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (hashed_password, current_user['id'])
        )
        conn.commit()
        
        return jsonify({'message': 'Password updated successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        print(f"Password change error: {str(e)}")
        return jsonify({'message': f'Error updating password: {str(e)}'}), 500
    finally:
        cursor.close()

# Product Routes
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Get query parameters for filtering
    category = request.args.get('category')
    search = request.args.get('search')
    farmer_id = request.args.get('farmer_id')
    
    # Base query - only return approved and available products by default
    query = "SELECT p.*, u.full_name as farmer_name FROM products p JOIN users u ON p.farmer_id = u.id WHERE p.is_approved = true AND p.is_available = true"
    params = []
    
    # Add filters if provided
    if category:
        query += " AND p.category = %s"
        params.append(category)
    
    if search:
        query += " AND (p.name ILIKE %s OR p.description ILIKE %s)"
        search_term = f"%{search}%"
        params.extend([search_term, search_term])
    
    if farmer_id:
        query += " AND p.farmer_id = %s"
        params.append(farmer_id)
    
    query += " ORDER BY p.created_at DESC"
    
    cursor.execute(query, params)
    products = cursor.fetchall()
    cursor.close()
    
    # Convert to list of dictionaries for JSON serialization
    products_list = []
    for product in products:
        product_dict = dict(product)
        product_dict['created_at'] = product_dict['created_at'].isoformat()
        product_dict['updated_at'] = product_dict['updated_at'].isoformat()
        products_list.append(product_dict)
    
    return jsonify({'products': products_list}), 200

@app.route('/api/products/all', methods=['GET'])
@token_required
@role_required(['admin'])
def get_all_products(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cursor.execute(
        '''SELECT p.*, u.full_name as farmer_name FROM products p 
           JOIN users u ON p.farmer_id = u.id 
           ORDER BY p.created_at DESC'''
    )
    products = cursor.fetchall()
    cursor.close()
    
    # Convert to list of dictionaries for JSON serialization
    products_list = []
    for product in products:
        product_dict = dict(product)
        product_dict['created_at'] = product_dict['created_at'].isoformat()
        product_dict['updated_at'] = product_dict['updated_at'].isoformat()
        products_list.append(product_dict)
    
    return jsonify({'products': products_list}), 200

@app.route('/api/products/farmer', methods=['GET'])
@token_required
@role_required(['farmer'])
def get_farmer_products(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cursor.execute("SELECT * FROM products WHERE farmer_id = %s ORDER BY created_at DESC", (current_user['id'],))
    products = cursor.fetchall()
    cursor.close()
    
    # Convert to list of dictionaries for JSON serialization
    products_list = []
    for product in products:
        product_dict = dict(product)
        product_dict['created_at'] = product_dict['created_at'].isoformat()
        product_dict['updated_at'] = product_dict['updated_at'].isoformat()
        products_list.append(product_dict)
    
    return jsonify({'products': products_list}), 200

@app.route('/api/products', methods=['POST'])
@token_required
@role_required(['farmer','admin'])
def create_product(current_user):
    data = request.get_json()
    
    # Validate input data
    required_fields = ['name', 'description', 'category', 'price', 'quantity', 'unit']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        cursor.execute(
            '''INSERT INTO products (name, description, category, price, quantity, unit, image_url, farmer_id) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id''',
            (data['name'], data['description'], data['category'], data['price'], 
             data['quantity'], data['unit'], data.get('image_url', ''), current_user['id'])
        )
        product_id = cursor.fetchone()[0]
        conn.commit()
        
        # Get the newly created product
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        product = cursor.fetchone()
        
        product_dict = dict(product)
        product_dict['created_at'] = product_dict['created_at'].isoformat()
        product_dict['updated_at'] = product_dict['updated_at'].isoformat()
        
        return jsonify({
            'message': 'Product created successfully! Waiting for admin approval.',
            'product': product_dict
        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error creating product: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cursor.execute(
        '''SELECT p.*, u.full_name as farmer_name, u.phone as farmer_phone 
           FROM products p JOIN users u ON p.farmer_id = u.id 
           WHERE p.id = %s''', 
        (product_id,)
    )
    product = cursor.fetchone()
    cursor.close()
    
    if not product:
        return jsonify({'message': 'Product not found!'}), 404
    
    # Convert to dictionary for JSON serialization
    product_dict = dict(product)
    product_dict['created_at'] = product_dict['created_at'].isoformat()
    product_dict['updated_at'] = product_dict['updated_at'].isoformat()
    
    return jsonify({'product': product_dict}), 200

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    # First check if the product exists and belongs to the user
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
    product = cursor.fetchone()
    
    if not product:
        cursor.close()
        return jsonify({'message': 'Product not found!'}), 404
    
    # Check permissions: farmer can only edit their own products, admin can edit any
    if current_user['role'] == 'farmer' and product['farmer_id'] != current_user['id']:
        cursor.close()
        return jsonify({'message': 'You do not have permission to edit this product!'}), 403
    
    # Only admin and farmer roles can update products
    if current_user['role'] not in ['admin', 'farmer']:
        cursor.close()
        return jsonify({'message': 'Permission denied!'}), 403
    
    data = request.get_json()
    
    # Fields that are allowed to be updated
    allowed_fields = ['name', 'description', 'category', 'price', 'quantity', 'unit', 'image_url', 'is_available']
    # Admin can also update approval status
    if current_user['role'] == 'admin':
        allowed_fields.append('is_approved')
    
    update_data = {k: v for k, v in data.items() if k in allowed_fields}
    
    if not update_data:
        cursor.close()
        return jsonify({'message': 'No valid fields to update!'}), 400
    
    try:
        # Construct update query dynamically
        query = "UPDATE products SET " + ", ".join([f"{key} = %s" for key in update_data.keys()]) 
        query += ", updated_at = CURRENT_TIMESTAMP WHERE id = %s"
        values = list(update_data.values()) + [product_id]
        
        cursor.execute(query, values)
        conn.commit()
        
        # Get the updated product
        cursor.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        updated_product = cursor.fetchone()
        
        product_dict = dict(updated_product)
        product_dict['created_at'] = product_dict['created_at'].isoformat()
        product_dict['updated_at'] = product_dict['updated_at'].isoformat()
        
        return jsonify({
            'message': 'Product updated successfully!',
            'product': product_dict
        }), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error updating product: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    # First check if the product exists and belongs to the user
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT farmer_id FROM products WHERE id = %s", (product_id,))
    product = cursor.fetchone()
    
    if not product:
        cursor.close()
        return jsonify({'message': 'Product not found!'}), 404
    
    # Check permissions: farmer can only delete their own products, admin can delete any
    if current_user['role'] == 'farmer' and product[0] != current_user['id']:
        cursor.close()
        return jsonify({'message': 'You do not have permission to delete this product!'}), 403
    
    # Only admin and farmer roles can delete products
    if current_user['role'] not in ['admin', 'farmer']:
        cursor.close()
        return jsonify({'message': 'Permission denied!'}), 403
    
    try:
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'message': 'Product not found!'}), 404
        
        return jsonify({'message': 'Product deleted successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error deleting product: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/products/approve/<int:product_id>', methods=['PUT'])
@token_required
@role_required(['admin'])
def approve_product(current_user, product_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "UPDATE products SET is_approved = true, updated_at = CURRENT_TIMESTAMP WHERE id = %s", 
            (product_id,)
        )
        conn.commit()
        
        if cursor.rowcount == 0:
            return jsonify({'message': 'Product not found!'}), 404
        
        return jsonify({'message': 'Product approved successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error approving product: {str(e)}'}), 500
    finally:
        cursor.close()

# Order Routes
@app.route('/api/orders', methods=['POST'])
@token_required
@role_required(['buyer'])
def create_order(current_user):
    data = request.get_json()
    
    # Validate input data
    required_fields = ['items', 'delivery_address', 'contact_number']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Validate items structure
    if not isinstance(data['items'], list) or len(data['items']) == 0:
        return jsonify({'message': 'Items must be a non-empty array!'}), 400
    
    for item in data['items']:
        if not all(k in item for k in ('product_id', 'quantity')):
            return jsonify({'message': 'Each item must contain product_id and quantity!'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # First verify all products exist, are approved, and have sufficient quantity
        product_details = []
        for item in data['items']:
            cursor.execute(
                '''SELECT p.*, u.id as farmer_id FROM products p 
                   JOIN users u ON p.farmer_id = u.id 
                   WHERE p.id = %s AND p.is_approved = true AND p.is_available = true''', 
                (item['product_id'],)
            )
            product = cursor.fetchone()
            
            if not product:
                conn.rollback()
                return jsonify({'message': f'Product with ID {item["product_id"]} not found or not available!'}), 404
            
            if product['quantity'] < item['quantity']:
                conn.rollback()
                return jsonify({'message': f'Insufficient quantity for product {product["name"]}!'}), 400
            
            product_details.append({
                'product': dict(product),
                'quantity': item['quantity'],
                'total_price': float(product['price']) * item['quantity']
            })
        
        # Calculate total order amount
        total_amount = sum(item['total_price'] for item in product_details)
        
        # Generate a unique order number
        order_number = f"ORD-{int(time.time())}-{current_user['id']}"
        
        # Create the order
        cursor.execute(
            '''INSERT INTO orders (order_number, buyer_id, total_amount, delivery_address, contact_number) 
               VALUES (%s, %s, %s, %s, %s) RETURNING id''',
            (order_number, current_user['id'], total_amount, data['delivery_address'], data['contact_number'])
        )
        order_id = cursor.fetchone()[0]
        
        # Create order items and update product quantities
        for item in product_details:
            product = item['product']
            quantity = item['quantity']
            
            cursor.execute(
                '''INSERT INTO order_items 
                   (order_id, product_id, farmer_id, quantity, price_per_unit, total_price) 
                   VALUES (%s, %s, %s, %s, %s, %s)''',
                (order_id, product['id'], product['farmer_id'], quantity, product['price'], item['total_price'])
            )
            
            # Update product quantity
            cursor.execute(
                "UPDATE products SET quantity = quantity - %s WHERE id = %s",
                (quantity, product['id'])
            )
        
        conn.commit()
        
        return jsonify({
            'message': 'Order placed successfully!',
            'order': {
                'id': order_id,
                'order_number': order_number,
                'total_amount': total_amount,
                'status': 'pending'
            }
        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error creating order: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/orders/buyer', methods=['GET'])
@token_required
@role_required(['buyer'])
def get_buyer_orders(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get all orders for the buyer
        cursor.execute(
            '''SELECT * FROM orders WHERE buyer_id = %s ORDER BY created_at DESC''',
            (current_user['id'],)
        )
        orders = cursor.fetchall()
        
        orders_list = []
        for order in orders:
            # Get order items for each order
            cursor.execute(
                '''SELECT oi.*, p.name as product_name, p.image_url, u.full_name as farmer_name 
                   FROM order_items oi 
                   JOIN products p ON oi.product_id = p.id 
                   JOIN users u ON oi.farmer_id = u.id 
                   WHERE oi.order_id = %s''',
                (order['id'],)
            )
            items = cursor.fetchall()
            
            # Convert order to dictionary
            order_dict = dict(order)
            order_dict['created_at'] = order_dict['created_at'].isoformat()
            order_dict['updated_at'] = order_dict['updated_at'].isoformat()
            
            # Convert items to list of dictionaries
            items_list = []
            for item in items:
                item_dict = dict(item)
                item_dict['created_at'] = item_dict['created_at'].isoformat()
                items_list.append(item_dict)
            
            order_dict['items'] = items_list
            orders_list.append(order_dict)
        
        return jsonify({'orders': orders_list}), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching orders: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/orders/farmer', methods=['GET'])
@token_required
@role_required(['farmer'])
def get_farmer_orders(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get all order items for the farmer
        cursor.execute(
            '''SELECT oi.*, o.order_number, o.delivery_address, o.contact_number, 
                      o.created_at as order_date, p.name as product_name, p.image_url,
                      u.full_name as buyer_name, u.id as buyer_id
               FROM order_items oi 
               JOIN orders o ON oi.order_id = o.id 
               JOIN products p ON oi.product_id = p.id 
               JOIN users u ON o.buyer_id = u.id 
               WHERE oi.farmer_id = %s
               ORDER BY o.created_at DESC''',
            (current_user['id'],)
        )
        order_items = cursor.fetchall()
        
        # Group by order
        orders_map = {}
        for item in order_items:
            order_id = item['order_id']
            
            if order_id not in orders_map:
                orders_map[order_id] = {
                    'order_id': order_id,
                    'order_number': item['order_number'],
                    'buyer_name': item['buyer_name'],
                    'buyer_id': item['buyer_id'],
                    'delivery_address': item['delivery_address'],
                    'contact_number': item['contact_number'],
                    'order_date': item['order_date'].isoformat(),
                    'items': []
                }
            
            # Add item to order
            item_dict = {
                'id': item['id'],
                'product_id': item['product_id'],
                'product_name': item['product_name'],
                'image_url': item['image_url'],
                'quantity': item['quantity'],
                'price_per_unit': float(item['price_per_unit']),
                'total_price': float(item['total_price']),
                'status': item['status'],
                'created_at': item['created_at'].isoformat()
            }
            
            orders_map[order_id]['items'].append(item_dict)
        
        # Convert to list
        orders_list = list(orders_map.values())
        
        return jsonify({'orders': orders_list}), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching orders: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/orders', methods=['GET'])
@token_required
@role_required(['admin'])
def get_all_orders(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get all orders
        cursor.execute(
            '''SELECT o.*, u.full_name as buyer_name FROM orders o 
               JOIN users u ON o.buyer_id = u.id 
               ORDER BY o.created_at DESC'''
        )
        orders = cursor.fetchall()
        
        orders_list = []
        for order in orders:
            # Get order items for each order
            cursor.execute(
                '''SELECT oi.*, p.name as product_name, p.image_url, u.full_name as farmer_name 
                   FROM order_items oi 
                   JOIN products p ON oi.product_id = p.id 
                   JOIN users u ON oi.farmer_id = u.id 
                   WHERE oi.order_id = %s''',
                (order['id'],)
            )
            items = cursor.fetchall()
            
            # Convert order to dictionary
            order_dict = dict(order)
            order_dict['created_at'] = order_dict['created_at'].isoformat()
            order_dict['updated_at'] = order_dict['updated_at'].isoformat()
            
            # Convert items to list of dictionaries
            items_list = []
            for item in items:
                item_dict = dict(item)
                item_dict['created_at'] = item_dict['created_at'].isoformat()
                items_list.append(item_dict)
            
            order_dict['items'] = items_list
            orders_list.append(order_dict)
        
        return jsonify({'orders': orders_list}), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching orders: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/orders/<int:order_id>', methods=['GET'])
@token_required
def get_order(current_user, order_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # First check if the order exists
        cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        
        if not order:
            return jsonify({'message': 'Order not found!'}), 404
        
        # Check permissions based on role
        if current_user['role'] == 'buyer' and order['buyer_id'] != current_user['id']:
            return jsonify({'message': 'You do not have permission to view this order!'}), 403
        
        if current_user['role'] == 'farmer':
            # Check if the farmer has any items in this order
            cursor.execute(
                "SELECT COUNT(*) FROM order_items WHERE order_id = %s AND farmer_id = %s",
                (order_id, current_user['id'])
            )
            count = cursor.fetchone()[0]
            
            if count == 0:
                return jsonify({'message': 'You do not have permission to view this order!'}), 403
        
        # Get order details
        cursor.execute(
            '''SELECT o.*, u.full_name as buyer_name FROM orders o 
               JOIN users u ON o.buyer_id = u.id 
               WHERE o.id = %s''',
            (order_id,)
        )
        order = cursor.fetchone()
        
        # Get order items
        cursor.execute(
            '''SELECT oi.*, p.name as product_name, p.image_url, u.full_name as farmer_name 
               FROM order_items oi 
               JOIN products p ON oi.product_id = p.id 
               JOIN users u ON oi.farmer_id = u.id 
               WHERE oi.order_id = %s''',
            (order_id,)
        )
        items = cursor.fetchall()
        
        # Convert order to dictionary
        order_dict = dict(order)
        order_dict['created_at'] = order_dict['created_at'].isoformat()
        order_dict['updated_at'] = order_dict['updated_at'].isoformat()
        
        # Convert items to list of dictionaries
        items_list = []
        for item in items:
            item_dict = dict(item)
            item_dict['created_at'] = item_dict['created_at'].isoformat()
            items_list.append(item_dict)
        
        order_dict['items'] = items_list
        
        return jsonify({'order': order_dict}), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching order: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/orders/item/<int:item_id>/status', methods=['PUT'])
@token_required
@role_required(['farmer', 'admin'])
def update_order_item_status(current_user, item_id):
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({'message': 'Status field is required!'}), 400
    
    if data['status'] not in ['pending', 'accepted', 'rejected', 'completed']:
        return jsonify({'message': 'Invalid status value!'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # First check if the order item exists
        cursor.execute("SELECT * FROM order_items WHERE id = %s", (item_id,))
        item = cursor.fetchone()
        
        if not item:
            return jsonify({'message': 'Order item not found!'}), 404
        
        # Check permissions for farmer
        if current_user['role'] == 'farmer' and item['farmer_id'] != current_user['id']:
            return jsonify({'message': 'You do not have permission to update this order item!'}), 403
        
        # Update the order item status
        cursor.execute(
            "UPDATE order_items SET status = %s WHERE id = %s",
            (data['status'], item_id)
        )
        
        # If all items in the order are completed, update the order status
        if data['status'] == 'completed':
            cursor.execute(
                '''SELECT COUNT(*) FROM order_items 
                   WHERE order_id = %s AND status != 'completed' ''',
                (item['order_id'],)
            )
            remaining_items = cursor.fetchone()[0]
            
            if remaining_items == 0:
                cursor.execute(
                    "UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (item['order_id'],)
                )
        
        # If an item is rejected, update the order status if needed
        if data['status'] == 'rejected':
            cursor.execute(
                '''SELECT COUNT(*) FROM order_items 
                   WHERE order_id = %s AND status != 'rejected' ''',
                (item['order_id'],)
            )
            non_rejected_items = cursor.fetchone()[0]
            
            if non_rejected_items == 0:
                cursor.execute(
                    "UPDATE orders SET status = 'rejected', updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (item['order_id'],)
                )
        
        conn.commit()
        
        return jsonify({'message': 'Order item status updated successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error updating order item status: {str(e)}'}), 500
    finally:
        cursor.close()

# Chat Routes
@app.route('/api/chats/send', methods=['POST'])
@token_required
@role_required(['farmer', 'buyer', 'admin'])
def send_message(current_user):
    data = request.get_json()
    
    # Log the incoming request for debugging
    print(f"Chat request from user {current_user['id']} (role: {current_user['role']})")
    print(f"Request data: {data}")
    
    # Validate input data
    required_fields = ['receiver_id', 'message']
    for field in required_fields:
        if field not in data:
            print(f"Missing required field: {field}")
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Validate that receiver_id is an integer
        try:
            receiver_id = int(data['receiver_id'])
        except (ValueError, TypeError):
            print(f"Invalid receiver_id: {data['receiver_id']}")
            return jsonify({'message': 'Invalid receiver_id - must be an integer'}), 400
            
        # First check if receiver exists
        cursor.execute("SELECT id, role FROM users WHERE id = %s", (receiver_id,))
        receiver = cursor.fetchone()
        
        if not receiver:
            print(f"Receiver not found: {receiver_id}")
            return jsonify({'message': 'Receiver not found!'}), 404
        
        print(f"Sending message to receiver {receiver_id} (role: {receiver['role']})")
        
        # Note: the 'admin_override' parameter from the frontend is accepted but not needed
        # since we now allow all user types to communicate with each other
        
        # Insert message
        cursor.execute(
            '''INSERT INTO chats (sender_id, receiver_id, message) 
               VALUES (%s, %s, %s) RETURNING id, created_at''',
            (current_user['id'], receiver_id, data['message'])
        )
        result = cursor.fetchone()
        conn.commit()
        
        chat_response = {
            'message': 'Message sent successfully!',
            'chat': {
                'id': result['id'],
                'sender_id': current_user['id'],
                'receiver_id': receiver_id,
                'message': data['message'],
                'is_read': False,
                'created_at': result['created_at'].isoformat()
            }
        }
        
        print(f"Message sent successfully: {chat_response}")
        return jsonify(chat_response), 201
    
    except Exception as e:
        conn.rollback()
        print(f"Error sending message: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error sending message: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/chats/<int:user_id>', methods=['GET'])
@token_required
def get_conversation(current_user, user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # First check if the other user exists
        cursor.execute("SELECT id, role, full_name FROM users WHERE id = %s", (user_id,))
        other_user = cursor.fetchone()
        
        if not other_user:
            return jsonify({'message': 'User not found!'}), 404
        
        # Get conversation messages (both sent and received)
        cursor.execute(
            '''SELECT c.*, 
                  sender.full_name as sender_name, 
                  receiver.full_name as receiver_name
               FROM chats c
               JOIN users sender ON c.sender_id = sender.id
               JOIN users receiver ON c.receiver_id = receiver.id
               WHERE (c.sender_id = %s AND c.receiver_id = %s) 
                  OR (c.sender_id = %s AND c.receiver_id = %s)
               ORDER BY c.created_at ASC''',
            (current_user['id'], user_id, user_id, current_user['id'])
        )
        messages = cursor.fetchall()
        
        # Mark messages as read if they were sent to the current user
        unread_ids = []
        for message in messages:
            if message['receiver_id'] == current_user['id'] and not message['is_read']:
                unread_ids.append(message['id'])
        
        if unread_ids:
            cursor.execute(
                "UPDATE chats SET is_read = true WHERE id = ANY(%s)",
                (unread_ids,)
            )
            conn.commit()
        
        # Convert to list of dictionaries for JSON serialization
        messages_list = []
        for message in messages:
            message_dict = dict(message)
            message_dict['created_at'] = message_dict['created_at'].isoformat()
            messages_list.append(message_dict)
        
        return jsonify({
            'other_user': {
                'id': other_user['id'],
                'role': other_user['role'],
                'full_name': other_user['full_name']
            },
            'messages': messages_list
        }), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching conversation: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/chats/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get list of users the current user has chatted with
        cursor.execute(
            '''SELECT DISTINCT 
                  CASE 
                     WHEN sender_id = %s THEN receiver_id 
                     ELSE sender_id 
                  END as user_id
               FROM chats
               WHERE sender_id = %s OR receiver_id = %s''',
            (current_user['id'], current_user['id'], current_user['id'])
        )
        user_ids = [row['user_id'] for row in cursor.fetchall()]
        
        if not user_ids:
            return jsonify({'conversations': []}), 200
        
        conversations = []
        for user_id in user_ids:
            # Get user info
            cursor.execute(
                "SELECT id, username, full_name, role FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            
            # Get the most recent message
            cursor.execute(
                '''SELECT * FROM chats
                   WHERE (sender_id = %s AND receiver_id = %s) 
                      OR (sender_id = %s AND receiver_id = %s)
                   ORDER BY created_at DESC
                   LIMIT 1''',
                (current_user['id'], user_id, user_id, current_user['id'])
            )
            latest_message = cursor.fetchone()
            
            # Count unread messages
            cursor.execute(
                '''SELECT COUNT(*) FROM chats
                   WHERE sender_id = %s AND receiver_id = %s AND is_read = false''',
                (user_id, current_user['id'])
            )
            unread_count = cursor.fetchone()[0]
            
            conversations.append({
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'full_name': user['full_name'],
                    'role': user['role']
                },
                'latest_message': {
                    'message': latest_message['message'],
                    'sender_id': latest_message['sender_id'],
                    'created_at': latest_message['created_at'].isoformat()
                },
                'unread_count': unread_count
            })
        
        # Sort by latest message date
        conversations.sort(key=lambda x: x['latest_message']['created_at'], reverse=True)
        
        return jsonify({'conversations': conversations}), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching conversations: {str(e)}'}), 500
    finally:
        cursor.close()

# User Management Routes (Admin)
@app.route('/api/admin/users', methods=['GET'])
@token_required
@role_required(['admin'])
def get_all_users(current_user):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Get query parameters for filtering
    role = request.args.get('role')
    
    try:
        # Base query
        query = '''SELECT id, username, email, role, full_name, phone, address, 
                         is_active, is_verified, created_at, updated_at 
                  FROM users'''
        params = []
        
        # Add filters if provided
        if role:
            query += " WHERE role = %s"
            params.append(role)
        
        query += " ORDER BY created_at DESC"
        
        cursor.execute(query, params)
        users = cursor.fetchall()
        
        # Convert to list of dictionaries for JSON serialization
        users_list = []
        for user in users:
            user_dict = dict(user)
            user_dict['created_at'] = user_dict['created_at'].isoformat()
            user_dict['updated_at'] = user_dict['updated_at'].isoformat()
            users_list.append(user_dict)
        
        return jsonify({'users': users_list}), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching users: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@token_required
@role_required(['admin'])
def update_user_active_status(current_user, user_id):
    data = request.get_json()
    
    # Validate input data
    if not any(field in data for field in ['is_active', 'is_verified']):
        return jsonify({'message': 'At least one of is_active or is_verified must be provided!'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # First check if the user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found!'}), 404
        
        # Construct update query dynamically
        update_fields = []
        params = []
        
        if 'is_active' in data:
            update_fields.append("is_active = %s")
            params.append(data['is_active'])
        
        if 'is_verified' in data:
            update_fields.append("is_verified = %s")
            params.append(data['is_verified'])
        
        update_fields.append("updated_at = CURRENT_TIMESTAMP")
        
        query = "UPDATE users SET " + ", ".join(update_fields) + " WHERE id = %s"
        params.append(user_id)
        
        cursor.execute(query, params)
        conn.commit()
        
        return jsonify({'message': 'User status updated successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error updating user status: {str(e)}'}), 500
    finally:
        cursor.close()

# Add initial admin user
def create_admin_user():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Check if admin already exists
    cursor.execute("SELECT * FROM users WHERE role = 'admin'")
    admin = cursor.fetchone()
    
    if admin:
        cursor.close()
        return
    
    # Create admin user
    admin_password = bcrypt.hashpw('admin123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        cursor.execute(
            '''INSERT INTO users (username, email, password, role, full_name, is_active, is_verified) 
               VALUES (%s, %s, %s, %s, %s, %s, %s)''',
            ('admin', 'admin@annvahak.com', admin_password, 'admin', 'Admin User', True, True)
        )
        conn.commit()
        print("Admin user created successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error creating admin user: {str(e)}")
    finally:
        cursor.close()

# Add some test data
def add_test_data():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if we already have some data
        cursor.execute("SELECT COUNT(*) FROM users WHERE role != 'admin'")
        user_count = cursor.fetchone()[0]
        
        if user_count > 0:
            cursor.close()
            return
        
        # Create test farmers
        farmers = [
            {
                'username': 'farmer1',
                'email': 'farmer1@example.com',
                'password': bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                'role': 'farmer',
                'full_name': 'Farmer One',
                'phone': '9876543210',
                'address': 'Farm Address 1'
            },
            {
                'username': 'farmer2',
                'email': 'farmer2@example.com',
                'password': bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                'role': 'farmer',
                'full_name': 'Farmer Two',
                'phone': '9876543211',
                'address': 'Farm Address 2'
            }
        ]
        
        farmer_ids = []
        for farmer in farmers:
            cursor.execute(
                '''INSERT INTO users (username, email, password, role, full_name, phone, address, is_active, is_verified) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id''',
                (farmer['username'], farmer['email'], farmer['password'], farmer['role'], 
                 farmer['full_name'], farmer['phone'], farmer['address'], True, True)
            )
            farmer_ids.append(cursor.fetchone()[0])
        
        # Create test buyers
        buyers = [
            {
                'username': 'buyer1',
                'email': 'buyer1@example.com',
                'password': bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                'role': 'buyer',
                'full_name': 'Buyer One',
                'phone': '9876543212',
                'address': 'Buyer Address 1'
            },
            {
                'username': 'buyer2',
                'email': 'buyer2@example.com',
                'password': bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
                'role': 'buyer',
                'full_name': 'Buyer Two',
                'phone': '9876543213',
                'address': 'Buyer Address 2'
            }
        ]
        
        buyer_ids = []
        for buyer in buyers:
            cursor.execute(
                '''INSERT INTO users (username, email, password, role, full_name, phone, address, is_active, is_verified) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id''',
                (buyer['username'], buyer['email'], buyer['password'], buyer['role'], 
                 buyer['full_name'], buyer['phone'], buyer['address'], True, True)
            )
            buyer_ids.append(cursor.fetchone()[0])
        
        # Create test products
        products = [
            {
                'name': 'Fresh Tomatoes',
                'description': 'Freshly harvested tomatoes, perfect for salads and cooking.',
                'category': 'Vegetables',
                'price': 50.00,
                'quantity': 100,
                'unit': 'kg',
                'image_url': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea',
                'farmer_id': farmer_ids[0],
                'is_approved': True
            },
            {
                'name': 'Organic Potatoes',
                'description': 'Organic potatoes grown without pesticides.',
                'category': 'Vegetables',
                'price': 40.00,
                'quantity': 200,
                'unit': 'kg',
                'image_url': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655',
                'farmer_id': farmer_ids[0],
                'is_approved': True
            },
            {
                'name': 'Fresh Apples',
                'description': 'Sweet and juicy apples picked right from the orchard.',
                'category': 'Fruits',
                'price': 80.00,
                'quantity': 150,
                'unit': 'kg',
                'image_url': 'https://images.unsplash.com/photo-1576179638-9bcd0470a88b',
                'farmer_id': farmer_ids[1],
                'is_approved': True
            },
            {
                'name': 'Organic Rice',
                'description': 'Pesticide-free rice grown with natural farming methods.',
                'category': 'Grains',
                'price': 60.00,
                'quantity': 300,
                'unit': 'kg',
                'image_url': 'https://images.unsplash.com/photo-1536746953245-9cc94ccd791f',
                'farmer_id': farmer_ids[1],
                'is_approved': True
            }
        ]
        
        for product in products:
            cursor.execute(
                '''INSERT INTO products (name, description, category, price, quantity, unit, image_url, farmer_id, is_approved, is_available) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)''',
                (product['name'], product['description'], product['category'], product['price'], 
                 product['quantity'], product['unit'], product['image_url'], product['farmer_id'], 
                 product['is_approved'], True)
            )
        
        # Create test chat messages
        chats = [
            {
                'sender_id': buyer_ids[0],
                'receiver_id': farmer_ids[0],
                'message': 'Hello, are the tomatoes still available?'
            },
            {
                'sender_id': farmer_ids[0],
                'receiver_id': buyer_ids[0],
                'message': 'Yes, they are! How many kg would you like?'
            },
            {
                'sender_id': buyer_ids[0],
                'receiver_id': farmer_ids[1],
                'message': 'Hi, do you ship the apples to Mumbai?'
            },
            {
                'sender_id': farmer_ids[1],
                'receiver_id': buyer_ids[0],
                'message': 'Yes, we do offer shipping to Mumbai.'
            }
        ]
        
        for chat in chats:
            cursor.execute(
                '''INSERT INTO chats (sender_id, receiver_id, message, is_read) 
                   VALUES (%s, %s, %s, %s)''',
                (chat['sender_id'], chat['receiver_id'], chat['message'], True)
            )
        
        conn.commit()
        print("Test data added successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error adding test data: {str(e)}")
    finally:
        cursor.close()

# Initialize admin and test data
with app.app_context():
    create_admin_user()
    add_test_data()

# Add a new admin-specific route for product creation with farmer selection
@app.route('/api/admin/products', methods=['POST'])
@token_required
@role_required(['admin'])
def admin_create_product(current_user):
    data = request.get_json()
    
    # Validate input data
    required_fields = ['name', 'description', 'category', 'price', 'quantity', 'unit', 'farmer_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'Missing required field: {field}'}), 400
    
    # Validate farmer exists
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Check if farmer exists and has farmer role
        cursor.execute("SELECT id, role FROM users WHERE id = %s", (data['farmer_id'],))
        farmer = cursor.fetchone()
        
        if not farmer:
            return jsonify({'message': 'Farmer not found!'}), 404
        
        if farmer['role'] != 'farmer':
            return jsonify({'message': 'Selected user is not a farmer!'}), 400
        
        # Insert the product with admin approval automatically set
        cursor.execute(
            '''INSERT INTO products (name, description, category, price, quantity, unit, image_url, farmer_id, is_approved, is_available) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id''',
            (data['name'], data['description'], data['category'], data['price'], 
             data['quantity'], data['unit'], data.get('image_url', ''), data['farmer_id'],
             True, data.get('is_available', True))  # Auto-approve products created by admin
        )
        product_id = cursor.fetchone()[0]
        conn.commit()
        
        # Get the newly created product
        cursor.execute(
            '''SELECT p.*, u.full_name as farmer_name FROM products p 
               JOIN users u ON p.farmer_id = u.id 
               WHERE p.id = %s''', 
            (product_id,)
        )
        product = cursor.fetchone()
        
        product_dict = dict(product)
        product_dict['created_at'] = product_dict['created_at'].isoformat()
        product_dict['updated_at'] = product_dict['updated_at'].isoformat()
        
        return jsonify({
            'message': 'Product created successfully!',
            'product': product_dict
        }), 201
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error creating product: {str(e)}'}), 500
    finally:
        cursor.close()

# User management routes for admin actions seen in the screenshot
@app.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@token_required
@role_required(['admin'])
def update_user_role(current_user, user_id):
    data = request.get_json()
    
    if 'role' not in data:
        return jsonify({'message': 'Role is required!'}), 400
    
    # Validate role value
    if data['role'] not in ['admin', 'farmer', 'buyer']:
        return jsonify({'message': 'Invalid role! Must be admin, farmer, or buyer.'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found!'}), 404
        
        # Update user role
        cursor.execute(
            "UPDATE users SET role = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (data['role'], user_id)
        )
        conn.commit()
        
        return jsonify({'message': f'User role updated to {data["role"]} successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error updating user role: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/admin/users/<int:user_id>/status', methods=['PUT'])
@token_required
@role_required(['admin'])
def update_user_status(current_user, user_id):
    data = request.get_json()
    
    if 'status' not in data:
        return jsonify({'message': 'Status is required!'}), 400
    
    # Validate status value
    if data['status'] not in ['active', 'inactive']:
        return jsonify({'message': 'Invalid status! Must be active or inactive.'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found!'}), 404
        
        # Update user status
        is_active = data['status'] == 'active'
        cursor.execute(
            "UPDATE users SET is_active = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (is_active, user_id)
        )
        conn.commit()
        
        return jsonify({'message': f'User status updated to {data["status"]} successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error updating user status: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
@role_required(['admin'])
def delete_user(current_user, user_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found!'}), 404
        
        # Delete user
        cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
        conn.commit()
        
        return jsonify({'message': 'User deleted successfully!'}), 200
    
    except Exception as e:
        conn.rollback()
        return jsonify({'message': f'Error deleting user: {str(e)}'}), 500
    finally:
        cursor.close()

# Get detailed user information for view button
@app.route('/api/admin/users/<int:user_id>', methods=['GET'])
@token_required
@role_required(['admin'])
def get_user_details(current_user, user_id):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get user details
        cursor.execute(
            '''SELECT id, username, email, role, full_name, phone, address, 
                    is_active, is_verified, created_at, updated_at 
               FROM users WHERE id = %s''', 
            (user_id,)
        )
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'message': 'User not found!'}), 404
        
        # Add user stats (products if farmer, orders if buyer)
        user_dict = dict(user)
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        user_dict['updated_at'] = user_dict['updated_at'].isoformat()
        
        # Get additional stats based on role
        if user['role'] == 'farmer':
            cursor.execute(
                "SELECT COUNT(*) FROM products WHERE farmer_id = %s",
                (user_id,)
            )
            user_dict['products_count'] = cursor.fetchone()[0]
            
            cursor.execute(
                "SELECT COUNT(*) FROM order_items WHERE farmer_id = %s",
                (user_id,)
            )
            user_dict['orders_count'] = cursor.fetchone()[0]
            
        elif user['role'] == 'buyer':
            cursor.execute(
                "SELECT COUNT(*) FROM orders WHERE buyer_id = %s",
                (user_id,)
            )
            user_dict['orders_count'] = cursor.fetchone()[0]
        
        return jsonify({'user': user_dict}), 200
    
    except Exception as e:
        return jsonify({'message': f'Error fetching user details: {str(e)}'}), 500
    finally:
        cursor.close()

# Reports API Endpoints
@app.route('/api/admin/reports/sales', methods=['GET'])
@token_required
@role_required(['admin'])
def get_sales_reports(current_user):
    time_range = request.args.get('timeRange', 'week')
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Initialize data
        total_sales = 0
        avg_order_value = 0
        order_count = 0
        conversion_rate = 3.2  # This would normally be calculated
        
        # Initialize percent changes (simulated)
        percent_changes = {
            'total': 12.5,
            'avgOrderValue': 3.2,
            'orderCount': 8.7,
            'conversionRate': 0.5
        }
        
        # Get time period based on time_range
        date_clause = ""
        if time_range == 'day':
            date_clause = "AND o.created_at >= CURRENT_DATE"
        elif time_range == 'week':
            date_clause = "AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'"
        elif time_range == 'month':
            date_clause = "AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'"
        elif time_range == 'year':
            date_clause = "AND o.created_at >= CURRENT_DATE - INTERVAL '365 days'"
            
        # Get order metrics
        cursor.execute(
            f"""
            SELECT 
                COUNT(*) as count, 
                COALESCE(SUM(total_amount), 0) as total,
                COALESCE(AVG(total_amount), 0) as avg
            FROM orders o
            WHERE 1=1 {date_clause}
            """
        )
        
        result = cursor.fetchone()
        if result:
            order_count = result['count']
            total_sales = result['total']
            avg_order_value = result['avg'] if result['count'] > 0 else 0
            
        # Get sales by date
        if time_range == 'day':
            # Hourly for the current day
            cursor.execute(
                """
                SELECT 
                    date_trunc('hour', created_at) as date,
                    COALESCE(SUM(total_amount), 0) as sales
                FROM orders
                WHERE created_at >= CURRENT_DATE
                GROUP BY date_trunc('hour', created_at)
                ORDER BY date_trunc('hour', created_at)
                """
            )
        elif time_range == 'week':
            # Daily for the week
            cursor.execute(
                """
                SELECT 
                    date_trunc('day', created_at) as date,
                    COALESCE(SUM(total_amount), 0) as sales
                FROM orders
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
                GROUP BY date_trunc('day', created_at)
                ORDER BY date_trunc('day', created_at)
                """
            )
        elif time_range == 'month':
            # Daily for the month
            cursor.execute(
                """
                SELECT 
                    date_trunc('day', created_at) as date,
                    COALESCE(SUM(total_amount), 0) as sales
                FROM orders
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY date_trunc('day', created_at)
                ORDER BY date_trunc('day', created_at)
                """
            )
        else:
            # Monthly for the year
            cursor.execute(
                """
                SELECT 
                    date_trunc('month', created_at) as date,
                    COALESCE(SUM(total_amount), 0) as sales
                FROM orders
                WHERE created_at >= CURRENT_DATE - INTERVAL '365 days'
                GROUP BY date_trunc('month', created_at)
                ORDER BY date_trunc('month', created_at)
                """
            )
            
        sales_by_date = cursor.fetchall()
        sales_by_date_list = []
        
        for item in sales_by_date:
            sales_by_date_list.append({
                'date': item['date'].isoformat(),
                'sales': float(item['sales'])
            })
            
        # Calculate previous period percent changes
        # For a real application, we would calculate these based on previous periods
        
        return jsonify({
            'totalSales': float(total_sales),
            'avgOrderValue': float(avg_order_value),
            'orderCount': order_count,
            'conversionRate': conversion_rate,
            'percentChanges': percent_changes,
            'salesByDate': sales_by_date_list
        }), 200
        
    except Exception as e:
        print(f"Error in sales report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error generating report: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/admin/reports/products', methods=['GET'])
@token_required
@role_required(['admin'])
def get_product_reports(current_user):
    time_range = request.args.get('timeRange', 'week')
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get time period based on time_range
        date_clause = ""
        if time_range == 'day':
            date_clause = "AND p.created_at >= CURRENT_DATE"
        elif time_range == 'week':
            date_clause = "AND p.created_at >= CURRENT_DATE - INTERVAL '7 days'"
        elif time_range == 'month':
            date_clause = "AND p.created_at >= CURRENT_DATE - INTERVAL '30 days'"
        elif time_range == 'year':
            date_clause = "AND p.created_at >= CURRENT_DATE - INTERVAL '365 days'"
            
        # Get top products (by sales or by quantity)
        cursor.execute(
            f"""
            SELECT p.name, COALESCE(SUM(oi.quantity), 0) as sales
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            LEFT JOIN orders o ON oi.order_id = o.id
            WHERE 1=1 {date_clause}
            GROUP BY p.name
            ORDER BY sales DESC
            LIMIT 10
            """
        )
        
        top_products = cursor.fetchall()
        top_products_list = []
        
        for product in top_products:
            top_products_list.append({
                'name': product['name'],
                'sales': product['sales']
            })
            
        # Get category breakdown
        cursor.execute(
            f"""
            SELECT 
                p.category as name,
                COUNT(*) as count
            FROM products p
            WHERE 1=1 {date_clause}
            GROUP BY p.category
            ORDER BY count DESC
            """
        )
        
        categories = cursor.fetchall()
        categories_list = []
        
        for category in categories:
            categories_list.append({
                'name': category['name'],
                'count': category['count']
            })
            
        return jsonify({
            'topProducts': top_products_list,
            'categories': categories_list
        }), 200
        
    except Exception as e:
        print(f"Error in product report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error generating report: {str(e)}'}), 500
    finally:
        cursor.close()

@app.route('/api/admin/reports/users', methods=['GET'])
@token_required
@role_required(['admin'])
def get_user_reports(current_user):
    time_range = request.args.get('timeRange', 'week')
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    try:
        # Get overall user counts
        cursor.execute(
            """
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN role = 'farmer' THEN 1 END) as farmers,
                COUNT(CASE WHEN role = 'buyer' THEN 1 END) as buyers
            FROM users
            WHERE role != 'admin'
            """
        )
        
        user_counts = cursor.fetchone()
        
        # Get time period based on time_range for growth data
        date_range = "1 month"
        interval_unit = "day"
        
        if time_range == 'day':
            date_range = "1 day"
            interval_unit = "hour"
        elif time_range == 'week':
            date_range = "7 days"
            interval_unit = "day"
        elif time_range == 'month':
            date_range = "1 month"
            interval_unit = "day"
        elif time_range == 'year':
            date_range = "1 year"
            interval_unit = "month"
            
        # Get user growth over time
        cursor.execute(
            f"""
            SELECT 
                to_char(date_trunc('{interval_unit}', created_at), 'Mon DD') as month,
                COUNT(*) as count
            FROM users
            WHERE created_at >= CURRENT_DATE - INTERVAL '{date_range}'
            GROUP BY date_trunc('{interval_unit}', created_at)
            ORDER BY date_trunc('{interval_unit}', created_at)
            """
        )
        
        growth_data = cursor.fetchall()
        growth_list = []
        
        for item in growth_data:
            growth_list.append({
                'month': item['month'],
                'count': item['count']
            })
            
        return jsonify({
            'totalUsers': user_counts['total'],
            'farmers': user_counts['farmers'],
            'buyers': user_counts['buyers'],
            'growth': growth_list
        }), 200
        
    except Exception as e:
        print(f"Error in user report: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': f'Error generating report: {str(e)}'}), 500
    finally:
        cursor.close()

# Main entry point
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) 
