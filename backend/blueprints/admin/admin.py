from flask import Blueprint, request, jsonify
from functools import wraps
from flask_jwt_extended import jwt_required, get_jwt_identity
import jwt
from datetime import datetime, timedelta
from models import Membership, db, Products, ProductCategory, Equipments, EqipmentCategory, User
from sqlalchemy import and_, or_

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

# Add a test endpoint to check JWT
@admin_bp.route('/test-auth', methods=['GET'])
@jwt_required()
def test_auth():
    """Test endpoint to verify JWT is working"""
    current_user = get_jwt_identity()
    return jsonify({
        'message': 'Authentication successful',
        'user': current_user
    }), 200

# Products CRUD Operations
@admin_bp.route('/product-categories', methods=['POST'])
@jwt_required()
def create_product_category():
    """Create a new product category"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        name = data.get('name')
        slug = data.get('slug')

        if not name:
            return jsonify({'error': 'name is required'}), 400

        # simple slug generation if not provided
        base_slug = (slug or name).strip().lower().replace(' ', '-')
        unique_slug = base_slug
        idx = 1
        while ProductCategory.query.filter_by(slug=unique_slug).first():
            unique_slug = f"{base_slug}-{idx}"
            idx += 1

        # ensure name unique
        if ProductCategory.query.filter_by(name=name).first():
            return jsonify({'error': 'category name already exists'}), 400

        category = ProductCategory(name=name, slug=unique_slug)
        db.session.add(category)
        db.session.commit()
        return jsonify({
            'message': 'Product category created successfully',
            'category': {
                'id': category.id,
                'name': category.name,
                'slug': category.slug
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create category: {str(e)}'}), 500

@admin_bp.route('/products', methods=['GET'])
@jwt_required()
def get_products():
    """Get all products with pagination"""
    try:
        current_user = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category_id = request.args.get('category_id', type=int)
        
        query = Products.query
        
        if category_id:
            query = query.filter_by(product_category_id=category_id)
        
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
            'is_active': p.is_active,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'updated_at': p.updated_at.isoformat() if p.updated_at else None
        } for p in pagination.items]
        
        return jsonify({
            'products': products,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch products: {str(e)}'}), 500


@admin_bp.route('/products/<int:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """Get single product by ID"""
    try:
        current_user = get_jwt_identity()
        product = Products.query.get_or_404(product_id)
        
        return jsonify({
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'rating': product.rating,
            'price': product.price,
            'images': product.images,
            'category_id': product.product_category_id,
            'category_name': product.category.name if product.category else None,
            'is_active': product.is_active,
            'created_at': product.created_at.isoformat() if product.created_at else None,
            'updated_at': product.updated_at.isoformat() if product.updated_at else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/products', methods=['POST'])
@jwt_required()
def create_product():
    """Create new product"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'description', 'price', 'product_category_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify category exists
        category = ProductCategory.query.get(data['product_category_id'])
        if not category:
            return jsonify({'error': 'Invalid product category'}), 400
        
        product = Products(
            name=data['name'],
            description=data['description'],
            price=float(data['price']),
            rating=float(data.get('rating', 0.0)),
            images=data.get('images', []),
            product_category_id=data['product_category_id'],
            is_active=data.get('is_active', True)
        )
        
        db.session.add(product)
        db.session.commit()
        
        return jsonify({
            'message': 'Product created successfully',
            'product': {
                'id': product.id,
                'name': product.name,
                'price': product.price
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create product: {str(e)}'}), 500


@admin_bp.route('/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update existing product"""
    try:
        current_user = get_jwt_identity()
        product = Products.query.get_or_404(product_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = float(data['price'])
        if 'rating' in data:
            product.rating = float(data['rating'])
        if 'images' in data:
            product.images = data['images']
        if 'product_category_id' in data:
            # Verify category exists
            category = ProductCategory.query.get(data['product_category_id'])
            if not category:
                return jsonify({'error': 'Invalid product category'}), 400
            product.product_category_id = data['product_category_id']
        if 'is_active' in data:
            product.is_active = data['is_active']
        
        product.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Product updated successfully',
            'product': {
                'id': product.id,
                'name': product.name,
                'price': product.price
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update product: {str(e)}'}), 500


@admin_bp.route('/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    """Delete product (soft delete by setting is_active to False)"""
    try:
        current_user = get_jwt_identity()
        product = Products.query.get_or_404(product_id)
        
        # Soft delete
        product.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete product: {str(e)}'}), 500


# ==================== EQUIPMENTS CRUD ====================

@admin_bp.route('/equipment-categories', methods=['POST'])
@jwt_required()
def create_equipment_category():
    """Create a new equipment category"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json() or {}
        name = data.get('name')
        slug = data.get('slug')

        if not name:
            return jsonify({'error': 'name is required'}), 400

        # Simple slug generation if not provided
        base_slug = (slug or name).strip().lower().replace(' ', '-')
        unique_slug = base_slug
        idx = 1
        while EqipmentCategory.query.filter_by(slug=unique_slug).first():
            unique_slug = f"{base_slug}-{idx}"
            idx += 1

        # Ensure name unique
        if EqipmentCategory.query.filter_by(name=name).first():
            return jsonify({'error': 'category name already exists'}), 400

        category = EqipmentCategory(name=name, slug=unique_slug)
        db.session.add(category)
        db.session.commit()
        
        return jsonify({
            'message': 'Equipment category created successfully',
            'category': {
                'id': category.id,
                'name': category.name,
                'slug': category.slug
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create category: {str(e)}'}), 500

@admin_bp.route('/equipments', methods=['GET'])
@jwt_required()
def get_equipments():
    """Get all equipments with pagination"""
    try:
        current_user = get_jwt_identity()
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 10, type=int)
        category_id = request.args.get('category_id', type=int)
        
        query = Equipments.query
        
        if category_id:
            query = query.filter_by(equipment_category_id=category_id)
        
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        
        equipments = [{
            'id': e.id,
            'name': e.name,
            'description': e.description,
            'images': e.images,
            'category_id': e.equipment_category_id,
            'category_name': e.category.name if e.category else None,
            'is_active': e.is_active,
            'created_at': e.created_at.isoformat() if e.created_at else None,
            'updated_at': e.updated_at.isoformat() if e.updated_at else None
        } for e in pagination.items]
        
        return jsonify({
            'equipments': equipments,
            'total': pagination.total,
            'pages': pagination.pages,
            'current_page': page
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch equipments: {str(e)}'}), 500


@admin_bp.route('/equipments/<int:equipment_id>', methods=['GET'])
@jwt_required()
def get_equipment(equipment_id):
    """Get single equipment by ID"""
    try:
        current_user = get_jwt_identity()
        equipment = Equipments.query.get_or_404(equipment_id)
        
        return jsonify({
            'id': equipment.id,
            'name': equipment.name,
            'description': equipment.description,
            'images': equipment.images,
            'category_id': equipment.equipment_category_id,
            'category_name': equipment.category.name if equipment.category else None,
            'is_active': equipment.is_active,
            'created_at': equipment.created_at.isoformat() if equipment.created_at else None,
            'updated_at': equipment.updated_at.isoformat() if equipment.updated_at else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@admin_bp.route('/equipments', methods=['POST'])
@jwt_required()
def create_equipment():
    """Create new equipment"""
    try:
        current_user = get_jwt_identity()
        data = request.get_json()
        
        # Validation
        required_fields = ['name', 'description', 'equipment_category_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Verify category exists
        category = EqipmentCategory.query.get(data['equipment_category_id'])
        if not category:
            return jsonify({'error': 'Invalid equipment category'}), 400
        
        equipment = Equipments(
            name=data['name'],
            description=data['description'],
            images=data.get('images', []),
            equipment_category_id=data['equipment_category_id'],
            is_active=data.get('is_active', True)
        )
        
        db.session.add(equipment)
        db.session.commit()
        
        return jsonify({
            'message': 'Equipment created successfully',
            'equipment': {
                'id': equipment.id,
                'name': equipment.name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create equipment: {str(e)}'}), 500


@admin_bp.route('/equipments/<int:equipment_id>', methods=['PUT'])
@jwt_required()
def update_equipment(equipment_id):
    """Update existing equipment"""
    try:
        current_user = get_jwt_identity()
        equipment = Equipments.query.get_or_404(equipment_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            equipment.name = data['name']
        if 'description' in data:
            equipment.description = data['description']
        if 'images' in data:
            equipment.images = data['images']
        if 'equipment_category_id' in data:
            # Verify category exists
            category = EqipmentCategory.query.get(data['equipment_category_id'])
            if not category:
                return jsonify({'error': 'Invalid equipment category'}), 400
            equipment.equipment_category_id = data['equipment_category_id']
        if 'is_active' in data:
            equipment.is_active = data['is_active']
        
        equipment.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Equipment updated successfully',
            'equipment': {
                'id': equipment.id,
                'name': equipment.name
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update equipment: {str(e)}'}), 500


@admin_bp.route('/equipments/<int:equipment_id>', methods=['DELETE'])
@jwt_required()
def delete_equipment(equipment_id):
    """Delete equipment (soft delete by setting is_active to False)"""
    try:
        current_user = get_jwt_identity()
        equipment = Equipments.query.get_or_404(equipment_id)
        
        # Soft delete
        equipment.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Equipment deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete equipment: {str(e)}'}), 500


# ==================== UTILITY ENDPOINTS ====================

@admin_bp.route('/product-categories', methods=['GET'])
@jwt_required()
def get_product_categories():
    """Get all product categories"""
    try:
        current_user = get_jwt_identity()
        categories = ProductCategory.query.all()
        return jsonify({
            'categories': [{
                'id': c.id,
                'name': c.name,
                'slug': c.slug
            } for c in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch categories: {str(e)}'}), 500


@admin_bp.route('/equipment-categories', methods=['GET'])
@jwt_required()
def get_equipment_categories():
    """Get all equipment categories"""
    try:
        current_user = get_jwt_identity()
        categories = EqipmentCategory.query.all()
        return jsonify({
            'categories': [{
                'id': c.id,
                'name': c.name,
                'slug': c.slug
            } for c in categories]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to fetch categories: {str(e)}'}), 500
    


# ==================== ADMIN ENDPOINTS ====================

@admin_bp.route('/admin/all', methods=['GET'])
@jwt_required()
def admin_get_all_memberships():
    """Admin: Get all memberships with filtering"""
    try:
        user_id = get_jwt_identity()
        
        # Check if admin
        user = User.query.filter_by(user_id=user_id).first()
        if not user or user.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Query parameters for filtering
        status = request.args.get('status')  # active, expired, all
        membership_type = request.args.get('type')
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        query = Membership.query
        
        # Filter by type
        if membership_type:
            query = query.filter_by(membership_type=membership_type)
        
        # Filter by status
        today = datetime.now().date()
        if status == 'active':
            query = query.filter(
                and_(
                    Membership.is_active == True,
                    Membership.end_date >= today
                )
            )
        elif status == 'expired':
            query = query.filter(Membership.end_date < today)
        
        # Paginate
        paginated = query.order_by(Membership.created_at.desc()).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        memberships = []
        for membership in paginated.items:
            user = User.query.filter_by(user_id=membership.user_id).first()
            is_expired = membership.end_date < today
            
            memberships.append({
                'id': membership.id,
                'user_id': membership.user_id,
                'user_name': f"{user.first_name} {user.last_name}" if user else 'Unknown',
                'user_email': user.email if user else 'Unknown',
                'type': membership.membership_type,
                'start_date': membership.start_date.isoformat(),
                'end_date': membership.end_date.isoformat(),
                'is_active': membership.is_active,
                'is_expired': is_expired,
                'created_at': membership.created_at.isoformat() if membership.created_at else None
            })
        
        return jsonify({
            'memberships': memberships,
            'total': paginated.total,
            'page': page,
            'per_page': per_page,
            'total_pages': paginated.pages
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch memberships: {str(e)}'}), 500


@admin_bp.route('/admin/user/<string:user_id>', methods=['GET'])
@jwt_required()
def admin_get_user_memberships(user_id):
    """Admin: Get specific user's membership history"""
    try:
        admin_id = get_jwt_identity()
        
        # Check if admin
        admin = User.query.filter_by(user_id=admin_id).first()
        if not admin or admin.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Check if user exists
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        memberships = Membership.query.filter_by(
            user_id=user_id
        ).order_by(Membership.created_at.desc()).all()
        
        today = datetime.now().date()
        history = []
        for membership in memberships:
            is_expired = membership.end_date < today
            
            history.append({
                'id': membership.id,
                'type': membership.membership_type,
                'start_date': membership.start_date.isoformat(),
                'end_date': membership.end_date.isoformat(),
                'is_active': membership.is_active,
                'is_expired': is_expired,
                'created_at': membership.created_at.isoformat() if membership.created_at else None
            })
        
        return jsonify({
            'user': {
                'user_id': user.user_id,
                'name': f"{user.first_name} {user.last_name}",
                'email': user.email
            },
            'memberships': history,
            'total': len(history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch user memberships: {str(e)}'}), 500


@admin_bp.route('/admin/<int:membership_id>/extend', methods=['POST'])
@jwt_required()
def admin_extend_membership(membership_id):
    """
    Admin: Extend a membership
    Body: {
        "days": 30
    }
    """
    try:
        admin_id = get_jwt_identity()
        
        # Check if admin
        admin = User.query.filter_by(user_id=admin_id).first()
        if not admin or admin.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        membership = Membership.query.get(membership_id)
        if not membership:
            return jsonify({'error': 'Membership not found'}), 404
        
        data = request.get_json()
        if 'days' not in data:
            return jsonify({'error': 'days is required'}), 400
        
        days = data['days']
        if not isinstance(days, int) or days <= 0:
            return jsonify({'error': 'days must be a positive integer'}), 400
        
        old_end_date = membership.end_date
        membership.end_date = old_end_date + timedelta(days=days)
        
        db.session.commit()
        
        return jsonify({
            'message': f'Membership extended by {days} days',
            'membership_id': membership.id,
            'old_end_date': old_end_date.isoformat(),
            'new_end_date': membership.end_date.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to extend membership: {str(e)}'}), 500


@admin_bp.route('/admin/<int:membership_id>/cancel', methods=['POST'])
@jwt_required()
def admin_cancel_membership(membership_id):
    """Admin: Cancel a user's membership immediately"""
    try:
        admin_id = get_jwt_identity()
        
        # Check if admin
        admin = User.query.filter_by(user_id=admin_id).first()
        if not admin or admin.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        membership = Membership.query.get(membership_id)
        if not membership:
            return jsonify({'error': 'Membership not found'}), 404
        
        if not membership.is_active:
            return jsonify({'error': 'Membership is already cancelled'}), 400
        
        membership.is_active = False
        
        db.session.commit()
        
        return jsonify({
            'message': 'Membership cancelled successfully',
            'membership_id': membership.id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to cancel membership: {str(e)}'}), 500

