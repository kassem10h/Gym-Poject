from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Membership
from datetime import datetime, timedelta

membership_bp = Blueprint('membership', __name__, url_prefix='/api/membership')

# Membership plans configuration
MEMBERSHIP_PLANS = {
    'Monthly': {
        'price': 50.0,
        'duration_days': 30,
        'description': 'Access to all gym facilities for 30 days'
    },
    'Quarterly': {
        'price': 135.0,  # 10% discount
        'duration_days': 90,
        'description': 'Access to all gym facilities for 90 days'
    },
    'Yearly': {
        'price': 480.0,  # 20% discount
        'duration_days': 365,
        'description': 'Access to all gym facilities for 1 year'
    },
    'Premium': {
        'price': 100.0,
        'duration_days': 30,
        'description': 'Premium access with personal training sessions included'
    },
    'Student': {
        'price': 35.0,
        'duration_days': 30,
        'description': 'Student discount membership (ID verification required)'
    }
}


# ==================== MEMBER ENDPOINTS ====================

@membership_bp.route('/plans', methods=['GET'])
def get_membership_plans():
    """Get all available membership plans"""
    try:
        plans = []
        for plan_type, details in MEMBERSHIP_PLANS.items():
            plans.append({
                'type': plan_type,
                'price': details['price'],
                'duration_days': details['duration_days'],
                'description': details['description']
            })
        
        return jsonify({
            'plans': plans,
            'total_plans': len(plans)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch plans: {str(e)}'}), 500


@membership_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_membership():
    """Get user's current active membership"""
    try:
        user_id = get_jwt_identity()
        
        # Get active membership
        membership = Membership.query.filter_by(
            user_id=user_id,
            is_active=True
        ).order_by(Membership.end_date.desc()).first()
        
        if not membership:
            return jsonify({
                'has_membership': False,
                'message': 'No active membership found'
            }), 200
        
        # Check if expired
        today = datetime.now().date()
        is_expired = membership.end_date < today
        days_remaining = (membership.end_date - today).days if not is_expired else 0
        
        return jsonify({
            'has_membership': True,
            'membership': {
                'id': membership.id,
                'type': membership.membership_type,
                'start_date': membership.start_date.isoformat(),
                'end_date': membership.end_date.isoformat(),
                'is_active': membership.is_active,
                'is_expired': is_expired,
                'days_remaining': days_remaining,
                'created_at': membership.created_at.isoformat() if membership.created_at else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch membership: {str(e)}'}), 500


@membership_bp.route('/history', methods=['GET'])
@jwt_required()
def get_membership_history():
    """Get user's membership history"""
    try:
        user_id = get_jwt_identity()
        
        memberships = Membership.query.filter_by(
            user_id=user_id
        ).order_by(Membership.created_at.desc()).all()
        
        history = []
        for membership in memberships:
            today = datetime.now().date()
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
            'memberships': history,
            'total': len(history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch membership history: {str(e)}'}), 500


@membership_bp.route('/purchase', methods=['POST'])
@jwt_required()
def purchase_membership():
    """
    Purchase or renew membership
    Body: {
        "membership_type": "Monthly",
        "payment_method": "credit_card",
        "card_details": {
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
        if 'membership_type' not in data:
            return jsonify({'error': 'membership_type is required'}), 400
        
        membership_type = data['membership_type']
        if membership_type not in MEMBERSHIP_PLANS:
            return jsonify({'error': f'Invalid membership type. Available: {", ".join(MEMBERSHIP_PLANS.keys())}'}), 400
        
        if 'payment_method' not in data:
            return jsonify({'error': 'payment_method is required'}), 400
        
        plan = MEMBERSHIP_PLANS[membership_type]
        
        # Simulate payment
        payment_success = simulate_payment(
            data.get('payment_method'),
            data.get('card_details', {}),
            plan['price']
        )
        
        if not payment_success:
            return jsonify({'error': 'Payment failed. Please check your payment details.'}), 402
        
        # Get current active membership
        current_membership = Membership.query.filter_by(
            user_id=user_id,
            is_active=True
        ).order_by(Membership.end_date.desc()).first()
        
        today = datetime.now().date()
        
        # Determine start date
        if current_membership and current_membership.end_date >= today:
            # Extend from current end date
            start_date = current_membership.end_date + timedelta(days=1)
            # Deactivate old membership
            current_membership.is_active = False
        else:
            # Start from today
            start_date = today
            # Deactivate any old memberships
            if current_membership:
                current_membership.is_active = False
        
        # Calculate end date
        end_date = start_date + timedelta(days=plan['duration_days'])
        
        # Create new membership
        new_membership = Membership(
            user_id=user_id,
            membership_type=membership_type,
            start_date=start_date,
            end_date=end_date,
            is_active=True
        )
        
        db.session.add(new_membership)
        db.session.commit()
        
        return jsonify({
            'message': 'Membership purchased successfully!',
            'payment_status': 'completed',
            'amount_paid': plan['price'],
            'membership': {
                'id': new_membership.id,
                'type': new_membership.membership_type,
                'start_date': new_membership.start_date.isoformat(),
                'end_date': new_membership.end_date.isoformat(),
                'duration_days': plan['duration_days']
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to purchase membership: {str(e)}'}), 500


@membership_bp.route('/cancel', methods=['POST'])
@jwt_required()
def cancel_membership():
    """
    Cancel current active membership
    Membership remains active until end_date
    """
    try:
        user_id = get_jwt_identity()
        
        # Get current active membership
        membership = Membership.query.filter_by(
            user_id=user_id,
            is_active=True
        ).order_by(Membership.end_date.desc()).first()
        
        if not membership:
            return jsonify({'error': 'No active membership to cancel'}), 404
        
        today = datetime.now().date()
        
        # Check if already expired
        if membership.end_date < today:
            return jsonify({'error': 'Membership has already expired'}), 400
        
        # Mark as inactive (but keeps access until end_date)
        membership.is_active = False
        
        db.session.commit()
        
        days_remaining = (membership.end_date - today).days
        
        return jsonify({
            'message': 'Membership cancelled successfully',
            'membership_id': membership.id,
            'access_until': membership.end_date.isoformat(),
            'days_remaining': days_remaining,
            'note': f'You will have access until {membership.end_date.isoformat()}'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to cancel membership: {str(e)}'}), 500

# ==================== HELPER FUNCTIONS ====================

def simulate_payment(payment_method, card_details, amount):
    """
    Simulate payment processing
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