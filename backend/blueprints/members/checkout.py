from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Products, Cart, CartItem, Order, OrderItem
from models import TrainerSession, SessionCart, SessionCartItem, Booking
from datetime import datetime
from Notifications import notify_booking_cancelled, notify_booking_confirmed, notify_new_booking, notify_order_placed, notify_session_cancelled_by_member

checkout_bp = Blueprint('checkout', __name__, url_prefix='/api/checkout')

# ==================== UNIFIED CHECKOUT ====================

@checkout_bp.route('/preview', methods=['GET'])
@jwt_required()
def preview_checkout():
    """
    Preview what will be checked out - shows both product cart and session cart
    """
    try:
        user_id = get_jwt_identity()
        
        # Get product cart
        product_cart = Cart.query.filter_by(user_id=user_id).first()
        product_items = []
        product_total = 0
        
        if product_cart:
            cart_items = CartItem.query.filter_by(cart_id=product_cart.id).all()
            for item in cart_items:
                if item.product and item.product.is_active:
                    item_total = item.product.price * item.quantity
                    product_total += item_total
                    product_items.append({
                        'type': 'product',
                        'cart_item_id': item.id,
                        'product_id': item.product_id,
                        'name': item.product.name,
                        'image': item.product.images[0] if item.product.images else None,
                        'price': item.product.price,
                        'quantity': item.quantity,
                        'item_total': item_total
                    })
        
        # Get session cart
        session_cart = SessionCart.query.filter_by(user_id=user_id).first()
        session_items = []
        session_total = 0
        
        if session_cart:
            cart_items = SessionCartItem.query.filter_by(cart_id=session_cart.id).all()
            for item in cart_items:
                session = item.session
                if session and session.is_active:
                    # Validate session is still valid
                    session_datetime = datetime.combine(session.date, session.start_time)
                    if session_datetime > datetime.now() and not session.is_full:
                        session_items.append({
                            'type': 'session',
                            'cart_item_id': item.id,
                            'session_id': session.id,
                            'name': f"{session.class_type.name} with {session.trainer.first_name} {session.trainer.last_name}",
                            'class_type': session.class_type.name,
                            'trainer_name': f"{session.trainer.first_name} {session.trainer.last_name}",
                            'date': session.date.isoformat(),
                            'start_time': session.start_time.strftime('%H:%M'),
                            'end_time': session.end_time.strftime('%H:%M'),
                            'price': session.price,
                            'spots_remaining': session.spots_remaining,
                            'item_total': session.price
                        })
                        session_total += session.price
        
        return jsonify({
            'products': {
                'items': product_items,
                'total': product_total
            },
            'sessions': {
                'items': session_items,
                'total': session_total
            },
            'grand_total': product_total + session_total,
            'total_items': len(product_items) + len(session_items)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to preview checkout: {str(e)}'}), 500


@checkout_bp.route('/process', methods=['POST'])
@jwt_required()
def process_checkout():
    """
    Process checkout for selected items (products and/or sessions)
    Body: {
        "items": {
            "product_cart_item_ids": [1, 2, 3],  // Optional
            "session_cart_item_ids": [1, 2]      // Optional
        },
        "payment_method": "credit_card",  // Simulated payment
        "card_details": {                  // Simulated - not validated
            "card_number": "4111111111111111",
            "expiry": "12/25",
            "cvv": "123"
        }
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validation
        if 'items' not in data:
            return jsonify({'error': 'items is required'}), 400
        
        product_ids = data['items'].get('product_cart_item_ids', [])
        session_ids = data['items'].get('session_cart_item_ids', [])
        
        if not product_ids and not session_ids:
            return jsonify({'error': 'No items selected for checkout'}), 400
        
        # Simulated payment validation
        if 'payment_method' not in data:
            return jsonify({'error': 'payment_method is required'}), 400
        
        # Start transaction
        order = None
        order_items = []
        bookings = []
        total_amount = 0
        
        # Process product items
        if product_ids:
            product_cart = Cart.query.filter_by(user_id=user_id).first()
            if not product_cart:
                return jsonify({'error': 'Product cart not found'}), 404
            
            for cart_item_id in product_ids:
                cart_item = CartItem.query.filter_by(
                    id=cart_item_id,
                    cart_id=product_cart.id
                ).first()
                
                if not cart_item:
                    db.session.rollback()
                    return jsonify({'error': f'Product cart item {cart_item_id} not found'}), 404
                
                if not cart_item.product or not cart_item.product.is_active:
                    db.session.rollback()
                    return jsonify({'error': f'Product "{cart_item.product.name if cart_item.product else "Unknown"}" is no longer available'}), 400
                
                item_total = cart_item.product.price * cart_item.quantity
                total_amount += item_total
                
                order_items.append({
                    'cart_item': cart_item,
                    'product': cart_item.product,
                    'quantity': cart_item.quantity,
                    'price': cart_item.product.price,
                    'total': item_total
                })
        
        # Process session items
        if session_ids:
            session_cart = SessionCart.query.filter_by(user_id=user_id).first()
            if not session_cart:
                return jsonify({'error': 'Session cart not found'}), 404
            
            for cart_item_id in session_ids:
                cart_item = SessionCartItem.query.filter_by(
                    id=cart_item_id,
                    cart_id=session_cart.id
                ).first()
                
                if not cart_item:
                    db.session.rollback()
                    return jsonify({'error': f'Session cart item {cart_item_id} not found'}), 404
                
                session = cart_item.session
                if not session or not session.is_active:
                    db.session.rollback()
                    return jsonify({'error': f'Session is no longer available'}), 400
                
                # Final validation
                session_datetime = datetime.combine(session.date, session.start_time)
                if session_datetime <= datetime.now():
                    db.session.rollback()
                    return jsonify({'error': f'Session on {session.date} at {session.start_time.strftime("%H:%M")} is in the past'}), 400
                
                if session.is_full:
                    db.session.rollback()
                    return jsonify({'error': f'Session on {session.date} at {session.start_time.strftime("%H:%M")} is now full'}), 400
                
                # Check for existing booking
                existing_booking = Booking.query.filter_by(
                    member_id=user_id,
                    session_id=session.id,
                    status='confirmed'
                ).first()
                
                if existing_booking:
                    db.session.rollback()
                    return jsonify({'error': f'You already have a booking for the session on {session.date} at {session.start_time.strftime("%H:%M")}'}), 409
                
                total_amount += session.price
                
                bookings.append({
                    'cart_item': cart_item,
                    'session': session
                })
    
        payment_success = simulate_payment(data.get('payment_method'), data.get('card_details', {}), total_amount)
        
        if not payment_success:
            return jsonify({'error': 'Payment failed. Please check your payment details.'}), 402
        
        # Create order if there are products
        if order_items:
            order = Order(
                user_id=user_id,
                total_price=sum(item['total'] for item in order_items)
            )
            db.session.add(order)
            db.session.flush()  # Get order ID
            
            # Create order items
            for item_data in order_items:
                order_item = OrderItem(
                    order_id=order.id,
                    product_id=item_data['product'].id,
                    quantity=item_data['quantity'],
                    price_at_purchase=item_data['price']
                )
                db.session.add(order_item)
                
                # Remove from cart
                db.session.delete(item_data['cart_item'])
        
        # Create bookings for sessions
        created_bookings = []
        for booking_data in bookings:
            session = booking_data['session']
            
            # Create booking
            booking = Booking(
                member_id=user_id,
                session_id=session.id,
                status='confirmed'
            )
            db.session.add(booking)
            
            # Increment session bookings count
            session.current_bookings += 1
            
            # Remove from cart
            db.session.delete(booking_data['cart_item'])
            
            # Notify user of booking confirmation
            notify_booking_confirmed(
                user_id=user_id,
                session_date=session.date,
                session_time=session.start_time.strftime('%H:%M'),
                class_name=session.class_type.name
            )

            # Notify trainer of new booking
            notify_new_booking(
                trainer_id=session.trainer_id,
                member_username=User.query.get(user_id).username,
                session_date=session.date,
                class_name=session.class_type.name
            )
            
            created_bookings.append({
                'booking_id': booking.id,
                'session_id': session.id,
                'class_type': session.class_type.name,
                'date': session.date.isoformat(),
                'start_time': session.start_time.strftime('%H:%M'),
                'end_time': session.end_time.strftime('%H:%M'),
                'trainer_name': f"{session.trainer.first_name} {session.trainer.last_name}"
            })

        # Notify user of order placement
        if order:
            notify_order_placed(
                user_id=user_id,
                order_id=order.id,
                total_price=order.total_price
            )
        
        # Commit transaction
        db.session.commit()
        
        return jsonify({
            'message': 'Checkout successful!',
            'payment_status': 'completed',
            'total_amount': total_amount,
            'order': {
                'order_id': order.id if order else None,
                'products_count': len(order_items)
            } if order else None,
            'bookings': created_bookings,
            'bookings_count': len(created_bookings)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Checkout failed: {str(e)}'}), 500


def simulate_payment(payment_method, card_details, amount):
    """
    For the simulation:
    - Always succeeds if card_number starts with "4" (Visa test cards)
    - Fails for other numbers
    """
    if payment_method == 'credit_card':
        card_number = card_details.get('card_number', '')
        
        # Simulate success for test Visa cards
        if card_number.startswith('4') and len(card_number) >= 13:
            return True
        
        # Simulate failure
        return False
    
    elif payment_method == 'paypal':
        return True
    
    elif payment_method == 'cash':
        return True
    
    # Unknown payment method
    return False


# ==================== ORDER HISTORY ====================

@checkout_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_order_history():
    """Get user's order history"""
    try:
        user_id = get_jwt_identity()
        
        orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        
        order_list = []
        for order in orders:
            order_items = OrderItem.query.filter_by(order_id=order.id).all()
            
            items = []
            for item in order_items:
                product = Products.query.get(item.product_id)
                items.append({
                    'product_id': item.product_id,
                    'product_name': product.name if product else 'Product no longer available',
                    'quantity': item.quantity,
                    'price': item.price_at_purchase,
                    'total': item.price_at_purchase * item.quantity
                })
            
            order_list.append({
                'order_id': order.id,
                'total_price': order.total_price,
                'items': items,
                'items_count': len(items),
                'created_at': order.created_at.isoformat() if order.created_at else None
            })
        
        return jsonify({
            'orders': order_list,
            'total_orders': len(order_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch order history: {str(e)}'}), 500


# ==================== BOOKING HISTORY ====================

@checkout_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_booking_history():
    """Get user's booking history"""
    try:
        user_id = get_jwt_identity()
        
        # Get bookings with optional status filter
        status = request.args.get('status')  # confirmed, cancelled, completed
        
        query = Booking.query.filter_by(member_id=user_id)
        if status:
            query = query.filter_by(status=status)
        
        bookings = query.order_by(Booking.created_at.desc()).all()
        
        booking_list = []
        for booking in bookings:
            session = booking.session
            if session:
                booking_list.append({
                    'booking_id': booking.id,
                    'session_id': session.id,
                    'class_type': session.class_type.name,
                    'trainer_name': f"{session.trainer.first_name} {session.trainer.last_name}",
                    'date': session.date.isoformat(),
                    'start_time': session.start_time.strftime('%H:%M'),
                    'end_time': session.end_time.strftime('%H:%M'),
                    'price': session.price,
                    'status': booking.status,
                    'booked_at': booking.created_at.isoformat() if booking.created_at else None
                })
        
        return jsonify({
            'bookings': booking_list,
            'total_bookings': len(booking_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch booking history: {str(e)}'}), 500


@checkout_bp.route('/bookings/<int:booking_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_booking(booking_id):
    """Cancel a booking (only if session hasn't started yet)"""
    try:
        user_id = get_jwt_identity()
        
        booking = Booking.query.get(booking_id)
        if not booking:
            return jsonify({'error': 'Booking not found'}), 404
        
        # Verify ownership
        if booking.member_id != user_id:
            return jsonify({'error': 'Unauthorized'}), 403
        
        # Check if already cancelled
        if booking.status == 'cancelled':
            return jsonify({'error': 'Booking is already cancelled'}), 400
        
        session = booking.session
        
        # Check if session hasn't started yet
        session_datetime = datetime.combine(session.date, session.start_time)
        if session_datetime <= datetime.now():
            return jsonify({'error': 'Cannot cancel a session that has already started or passed'}), 400
        
        # Cancel booking
        booking.status = 'cancelled'
        booking.updated_at = datetime.utcnow()
        
        # Decrement session bookings count
        if session.current_bookings > 0:
            session.current_bookings -= 1

        notify_booking_cancelled(
            user_id=user_id,
            session_date=session.date.isoformat(),
            class_name=session.class_type.name
        )

        notify_session_cancelled_by_member(
            trainer_id=session.trainer_id,
            class_name=session.class_type.name,
            session_date=session.date.isoformat()
        )
        
        db.session.commit()
        
        return jsonify({
            'message': 'Booking cancelled successfully',
            'booking_id': booking.id,
            'refund_amount': session.price 
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to cancel booking: {str(e)}'}), 500