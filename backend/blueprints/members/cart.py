from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Products, Cart, CartItem
from sqlalchemy import func

cart_bp = Blueprint('cart', __name__, url_prefix='/api/cart')

# ==================== CART MANAGEMENT ====================

@cart_bp.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    """Get current user's cart with all items"""
    try:
        user_id = get_jwt_identity()
        
        # Get or create cart for user
        cart = Cart.query.filter_by(user_id=user_id).first()
        
        if not cart:
            return jsonify({
                'cart_id': None,
                'items': [],
                'total_items': 0,
                'total_price': 0
            }), 200
        
        # Get cart items with product details
        cart_items = CartItem.query.filter_by(cart_id=cart.id).all()
        
        items = []
        total_price = 0
        
        for item in cart_items:
            if item.product and item.product.is_active:
                item_total = item.product.price * item.quantity
                total_price += item_total
                
                items.append({
                    'id': item.id,
                    'product_id': item.product_id,
                    'product_name': item.product.name,
                    'product_image': item.product.images[0] if item.product.images else None,
                    'price': item.product.price,
                    'quantity': item.quantity,
                    'item_total': item_total
                })
        
        return jsonify({
            'cart_id': cart.id,
            'items': items,
            'total_items': len(items),
            'total_price': total_price,
            'created_at': cart.created_at.isoformat() if cart.created_at else None
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch cart: {str(e)}'}), 500


@cart_bp.route('/cart/add', methods=['POST'])
@jwt_required()
def add_to_cart():
    """
    Add a product to cart
    Body: {
        "product_id": 1,
        "quantity": 1
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validation
        if 'product_id' not in data:
            return jsonify({'error': 'product_id is required'}), 400
        
        product_id = data['product_id']
        quantity = data.get('quantity', 1)
        
        if quantity < 1:
            return jsonify({'error': 'quantity must be at least 1'}), 400
        
        # Check if product exists and is active
        product = Products.query.filter_by(id=product_id, is_active=True).first()
        if not product:
            return jsonify({'error': 'Product not found or unavailable'}), 404
        
        # Get or create cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()
        
        # Check if product already in cart
        cart_item = CartItem.query.filter_by(
            cart_id=cart.id,
            product_id=product_id
        ).first()
        
        if cart_item:
            # Update quantity
            cart_item.quantity += quantity
        else:
            # Create new cart item
            cart_item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity
            )
            db.session.add(cart_item)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Product added to cart successfully',
            'cart_item': {
                'id': cart_item.id,
                'product_id': cart_item.product_id,
                'quantity': cart_item.quantity
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add to cart: {str(e)}'}), 500


@cart_bp.route('/cart/update/<int:cart_item_id>', methods=['PUT'])
@jwt_required()
def update_cart_item(cart_item_id):
    """
    Update cart item quantity
    Body: {
        "quantity": 2
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'quantity' not in data:
            return jsonify({'error': 'quantity is required'}), 400
        
        quantity = data['quantity']
        
        if quantity < 1:
            return jsonify({'error': 'quantity must be at least 1'}), 400
        
        # Get cart item and verify ownership
        cart_item = CartItem.query.get(cart_item_id)
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        # Verify user owns this cart item
        cart = Cart.query.get(cart_item.cart_id)
        if not cart or cart.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Update quantity
        cart_item.quantity = quantity
        db.session.commit()
        
        return jsonify({
            'message': 'Cart item updated successfully',
            'cart_item': {
                'id': cart_item.id,
                'product_id': cart_item.product_id,
                'quantity': cart_item.quantity
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update cart item: {str(e)}'}), 500


@cart_bp.route('/cart/remove/<int:cart_item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_cart(cart_item_id):
    """Remove an item from cart"""
    try:
        user_id = get_jwt_identity()
        
        # Get cart item and verify ownership
        cart_item = CartItem.query.get(cart_item_id)
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        # Verify user owns this cart item
        cart = Cart.query.get(cart_item.cart_id)
        if not cart or cart.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Remove item
        db.session.delete(cart_item)
        db.session.commit()
        
        return jsonify({'message': 'Item removed from cart successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to remove item: {str(e)}'}), 500


@cart_bp.route('/cart/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    """Clear all items from user's cart"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            return jsonify({'message': 'Cart is already empty'}), 200
        
        # Delete all cart items
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
        
        return jsonify({'message': 'Cart cleared successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to clear cart: {str(e)}'}), 500