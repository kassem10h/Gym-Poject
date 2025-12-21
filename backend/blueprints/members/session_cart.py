from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, TrainerSession, SessionCart, SessionCartItem
from datetime import datetime, date

session_cart_bp = Blueprint('session_cart', __name__, url_prefix='/api/session-cart')

# ==================== SESSION CART MANAGEMENT ====================

@session_cart_bp.route('/', methods=['GET'])
@jwt_required()
def get_session_cart():
    """Get current user's session cart with all items"""
    try:
        user_id = get_jwt_identity()
        
        # Verify user is a member
        user = User.query.get(user_id)
        if not user or user.role != 'Member':
            return jsonify({'error': 'Unauthorized - Members only'}), 403
        
        # Get or create session cart for user
        cart = SessionCart.query.filter_by(user_id=user_id).first()
        
        if not cart:
            return jsonify({
                'cart_id': None,
                'items': [],
                'total_items': 0,
                'total_price': 0
            }), 200
        
        # Get cart items with session details
        cart_items = SessionCartItem.query.filter_by(cart_id=cart.id).all()
        
        items = []
        total_price = 0
        
        for item in cart_items:
            session = item.session
            if session and session.is_active:
                # Check if session is still available and not in the past
                session_datetime = datetime.combine(session.date, session.start_time)
                if session_datetime > datetime.now() and not session.is_full:
                    items.append({
                        'cart_item_id': item.id,
                        'session_id': session.id,
                        'class_type': session.class_type.name,
                        'trainer_name': f"{session.trainer.first_name} {session.trainer.last_name}",
                        'date': session.date.isoformat(),
                        'start_time': session.start_time.strftime('%H:%M'),
                        'end_time': session.end_time.strftime('%H:%M'),
                        'price': session.price,
                        'spots_remaining': session.spots_remaining,
                        'added_at': item.created_at.isoformat() if item.created_at else None
                    })
                    total_price += session.price
                else:
                    # Remove invalid items (past sessions or full sessions)
                    db.session.delete(item)
        
        db.session.commit()
        
        return jsonify({
            'cart_id': cart.id,
            'items': items,
            'total_items': len(items),
            'total_price': total_price,
            'created_at': cart.created_at.isoformat() if cart.created_at else None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to fetch session cart: {str(e)}'}), 500


@session_cart_bp.route('/add', methods=['POST'])
@jwt_required()
def add_to_session_cart():
    """
    Add a session to cart
    Body: {
        "session_id": 1
    }
    """
    try:
        user_id = get_jwt_identity()
        
        # Verify user is a member
        user = User.query.get(user_id)
        if not user or user.role != 'Member':
            return jsonify({'error': 'Unauthorized - Members only'}), 403
        
        data = request.get_json()
        
        # Validation
        if 'session_id' not in data:
            return jsonify({'error': 'session_id is required'}), 400
        
        session_id = data['session_id']
        
        # Check if session exists and is active
        session = TrainerSession.query.filter_by(id=session_id, is_active=True).first()
        if not session:
            return jsonify({'error': 'Session not found or unavailable'}), 404
        
        # Check if session is in the past
        session_datetime = datetime.combine(session.date, session.start_time)
        if session_datetime <= datetime.now():
            return jsonify({'error': 'Cannot book a session in the past'}), 400
        
        # Check if session is full
        if session.is_full:
            return jsonify({'error': 'This session is already full'}), 400
        
        # Get or create session cart
        cart = SessionCart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = SessionCart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()
        
        # Check if session already in cart
        existing_item = SessionCartItem.query.filter_by(
            cart_id=cart.id,
            session_id=session_id
        ).first()
        
        if existing_item:
            return jsonify({'error': 'This session is already in your cart'}), 409
        
        # Check if user already has a booking for this session
        from models import Booking
        existing_booking = Booking.query.filter_by(
            member_id=user_id,
            session_id=session_id,
            status='confirmed'
        ).first()
        
        if existing_booking:
            return jsonify({'error': 'You have already booked this session'}), 409
        
        # Check for time conflicts with other sessions in cart
        cart_items = SessionCartItem.query.filter_by(cart_id=cart.id).all()
        for item in cart_items:
            other_session = item.session
            if other_session.date == session.date:
                # Check for time overlap
                if not (session.end_time <= other_session.start_time or 
                       session.start_time >= other_session.end_time):
                    return jsonify({
                        'error': f'Time conflict: You already have a "{other_session.class_type.name}" session in your cart from {other_session.start_time.strftime("%H:%M")} to {other_session.end_time.strftime("%H:%M")} on this date'
                    }), 409
        
        # Create new cart item
        cart_item = SessionCartItem(
            cart_id=cart.id,
            session_id=session_id
        )
        db.session.add(cart_item)
        db.session.commit()
        
        return jsonify({
            'message': 'Session added to cart successfully',
            'cart_item': {
                'cart_item_id': cart_item.id,
                'session_id': session.id,
                'class_type': session.class_type.name,
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'price': session.price
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to add session to cart: {str(e)}'}), 500


@session_cart_bp.route('/remove/<int:cart_item_id>', methods=['DELETE'])
@jwt_required()
def remove_from_session_cart(cart_item_id):
    """Remove a session from cart"""
    try:
        user_id = get_jwt_identity()
        
        # Get cart item and verify ownership
        cart_item = SessionCartItem.query.get(cart_item_id)
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        # Verify user owns this cart item
        cart = SessionCart.query.get(cart_item.cart_id)
        if not cart or cart.user_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Remove item
        db.session.delete(cart_item)
        db.session.commit()
        
        return jsonify({'message': 'Session removed from cart successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to remove session: {str(e)}'}), 500


@session_cart_bp.route('/clear', methods=['DELETE'])
@jwt_required()
def clear_session_cart():
    """Clear all sessions from user's cart"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's session cart
        cart = SessionCart.query.filter_by(user_id=user_id).first()
        if not cart:
            return jsonify({'message': 'Session cart is already empty'}), 200
        
        # Delete all cart items
        SessionCartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
        
        return jsonify({'message': 'Session cart cleared successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to clear session cart: {str(e)}'}), 500


# ==================== BROWSE AVAILABLE SESSIONS ====================

@session_cart_bp.route('/available', methods=['GET'])
@jwt_required()
def get_available_sessions():
    """
    Get all available sessions for booking
    Query params:
        - class_type_id: Filter by class type
        - date_from: Filter sessions from this date (YYYY-MM-DD)
        - date_to: Filter sessions until this date (YYYY-MM-DD)
    """
    try:
        user_id = get_jwt_identity()
        
        # Base query - only active sessions in the future that aren't full
        query = TrainerSession.query.filter(
            TrainerSession.is_active == True,
            TrainerSession.date >= date.today()
        )
        
        # Apply filters
        class_type_id = request.args.get('class_type_id', type=int)
        if class_type_id:
            query = query.filter(TrainerSession.class_type_id == class_type_id)
        
        date_from = request.args.get('date_from')
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                query = query.filter(TrainerSession.date >= date_from_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_from format. Use YYYY-MM-DD'}), 400
        
        date_to = request.args.get('date_to')
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                query = query.filter(TrainerSession.date <= date_to_obj)
            except ValueError:
                return jsonify({'error': 'Invalid date_to format. Use YYYY-MM-DD'}), 400
        
        # Order by date and time
        sessions = query.order_by(
            TrainerSession.date.asc(),
            TrainerSession.start_time.asc()
        ).all()
        
        # Get user's existing bookings and cart items
        from models import Booking
        user_bookings = {b.session_id for b in Booking.query.filter_by(
            member_id=user_id,
            status='confirmed'
        ).all()}
        
        cart = SessionCart.query.filter_by(user_id=user_id).first()
        cart_session_ids = set()
        if cart:
            cart_session_ids = {item.session_id for item in SessionCartItem.query.filter_by(
                cart_id=cart.id
            ).all()}
        
        available_sessions = []
        for session in sessions:
            # Skip if user already booked or in cart
            if session.id in user_bookings or session.id in cart_session_ids:
                continue
            
            # Skip if full
            if session.is_full:
                continue
            
            available_sessions.append({
                'id': session.id,
                'class_type': session.class_type.name,
                'class_type_id': session.class_type_id,
                'trainer_name': f"{session.trainer.first_name} {session.trainer.last_name}",
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'price': session.price,
                'max_members': session.max_members,
                'spots_remaining': session.spots_remaining,
                'is_full': session.is_full
            })
        
        return jsonify({
            'sessions': available_sessions,
            'total': len(available_sessions)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch available sessions: {str(e)}'}), 500