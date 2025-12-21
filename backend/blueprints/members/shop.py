from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from models import db, Products, ProductCategory, Equipments, EqipmentCategory, Cart, CartItem, User
from sqlalchemy import func

shop_bp = Blueprint('shop', __name__, url_prefix='/api/shop')

# ==================== PRODUCTS ====================

@shop_bp.route('/products', methods=['GET'])
def get_products():
    """
    Get all active products with optional filtering and pagination
    Query params:
    - page: page number (default 1)
    - per_page: items per page (default 12)
    - category_id: filter by category
    - search: search in name and description
    - min_price: minimum price
    - max_price: maximum price
    - min_rating: minimum rating
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', type=str)
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    min_rating = request.args.get('min_rating', type=float)
    
    try:
        # Base query - only active products
        query = Products.query.filter_by(is_active=True)
        
        # Apply filters
        if category_id:
            query = query.filter_by(product_category_id=category_id)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Products.name.ilike(search_term),
                    Products.description.ilike(search_term)
                )
            )
        
        if min_price is not None:
            query = query.filter(Products.price >= min_price)
        
        if max_price is not None:
            query = query.filter(Products.price <= max_price)
        
        if min_rating is not None:
            query = query.filter(Products.rating >= min_rating)
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        products = [{
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'rating': p.rating,
            'price': p.price,
            'images': p.images,
            'category_id': p.product_category_id,
            'category_name': p.category.name if p.category else None,
            'created_at': p.created_at.isoformat() if p.created_at else None
        } for p in pagination.items]
        
        return jsonify({
            'products': products,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch products: {str(e)}'}), 500


@shop_bp.route('/products/<int:product_id>', methods=['GET'])
def get_product_detail(product_id):
    """Get detailed information about a single product"""
    try:
        product = Products.query.filter_by(id=product_id, is_active=True).first()
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        return jsonify({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'rating': product.rating,
            'price': product.price,
            'images': product.images,
            'category_id': product.product_category_id,
            'category_name': product.category.name if product.category else None,
            'category_slug': product.category.slug if product.category else None,
            'created_at': product.created_at.isoformat() if product.created_at else None,
            'updated_at': product.updated_at.isoformat() if product.updated_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch product: {str(e)}'}), 500


@shop_bp.route('/product-categories', methods=['GET'])
def get_product_categories():
    """Get all product categories"""
    try:
        categories = ProductCategory.query.all()
        
        return jsonify({
            'categories': [{
                'id': c.id,
                'name': c.name,
                'slug': c.slug,
                'product_count': len(c.products)
            } for c in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch categories: {str(e)}'}), 500


# ==================== EQUIPMENT ====================

@shop_bp.route('/equipments', methods=['GET'])
def get_equipments():
    """
    Get all active equipment with optional filtering and pagination
    Query params:
    - page: page number (default 1)
    - per_page: items per page (default 12)
    - category_id: filter by category
    - search: search in name and description
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 12, type=int)
    category_id = request.args.get('category_id', type=int)
    search = request.args.get('search', type=str)
    
    try:
        # Base query - only active equipment
        query = Equipments.query.filter_by(is_active=True)
        
        # Apply filters
        if category_id:
            query = query.filter_by(equipment_category_id=category_id)
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                db.or_(
                    Equipments.name.ilike(search_term),
                    Equipments.description.ilike(search_term)
                )
            )
        
        # Paginate
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        equipments = [{
            'id': e.id,
            'name': e.name,
            'description': e.description,
            'images': e.images,
            'category_id': e.equipment_category_id,
            'category_name': e.category.name if e.category else None,
            'created_at': e.created_at.isoformat() if e.created_at else None
        } for e in pagination.items]
        
        return jsonify({
            'equipments': equipments,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch equipments: {str(e)}'}), 500


@shop_bp.route('/equipments/<int:equipment_id>', methods=['GET'])
def get_equipment_detail(equipment_id):
    """Get detailed information about a single equipment"""
    try:
        equipment = Equipments.query.filter_by(id=equipment_id, is_active=True).first()
        
        if not equipment:
            return jsonify({'error': 'Equipment not found'}), 404
        
        return jsonify({
            'id': equipment.id,
            'name': equipment.name,
            'description': equipment.description,
            'images': equipment.images,
            'category_id': equipment.equipment_category_id,
            'category_name': equipment.category.name if equipment.category else None,
            'category_slug': equipment.category.slug if equipment.category else None,
            'created_at': equipment.created_at.isoformat() if equipment.created_at else None,
            'updated_at': equipment.updated_at.isoformat() if equipment.updated_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch equipment: {str(e)}'}), 500


@shop_bp.route('/equipment-categories', methods=['GET'])
def get_equipment_categories():
    """Get all equipment categories"""
    try:
        categories = EqipmentCategory.query.all()
        
        return jsonify({
            'categories': [{
                'id': c.id,
                'name': c.name,
                'slug': c.slug,
                'equipment_count': len(c.equipments)
            } for c in categories]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch categories: {str(e)}'}), 500

