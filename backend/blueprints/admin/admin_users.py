from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Trainer, Membership, Booking, ProductRating, EquipmentRating
from sqlalchemy import or_, func, and_
from datetime import datetime, date

admin_users_bp = Blueprint('admin_users', __name__, url_prefix='/api/admin/users')

# Helper function to check if current user is admin
def check_admin_role(user_id):
    """Check if user has admin role"""
    user = User.query.get(user_id)
    if not user or user.role != 'Admin':
        return False
    return True

@admin_users_bp.route('/', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users with pagination and filters"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        role = request.args.get('role')  # Filter by role: Member, Trainer, Admin
        is_active = request.args.get('is_active')  # Filter by active status
        search = request.args.get('search')  # Search by name or email

        query = User.query

        # Apply filters
        if role:
            query = query.filter(User.role == role)
        
        if is_active is not None:
            active_bool = is_active.lower() == 'true'
            query = query.filter(User.is_active == active_bool)
        
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                or_(
                    User.email.ilike(search_pattern),
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern)
                )
            )

        # Paginate
        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        users_data = []
        for user in pagination.items:
            user_dict = {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
                'gender': user.gender,
                'role': user.role,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None,
                'updated_at': user.updated_at.isoformat() if user.updated_at else None
            }
            users_data.append(user_dict)

        return jsonify({
            'users': users_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500


@admin_users_bp.route('/<user_id>', methods=['GET'])
@jwt_required()
def get_user_detail(user_id):
    """Get detailed information about a specific user"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user_data = {
            'user_id': user.user_id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone': user.phone,
            'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
            'gender': user.gender,
            'role': user.role,
            'is_active': user.is_active,
            'created_at': user.created_at.isoformat() if user.created_at else None,
            'updated_at': user.updated_at.isoformat() if user.updated_at else None
        }

        # Add trainer-specific info if user is a trainer
        if user.role == 'Trainer' and user.trainer_profile:
            trainer = user.trainer_profile
            user_data['trainer_info'] = {
                'trainer_id': trainer.trainer_id,
                'years_of_experience': trainer.years_of_experience,
                'hourly_rate': float(trainer.hourly_rate) if trainer.hourly_rate else None,
                'specialization': trainer.specialization,
                'bio': trainer.bio,
                'height': float(trainer.height) if trainer.height else None,
                'weight': float(trainer.weight) if trainer.weight else None,
                'profile_picture_url': trainer.profile_picture_url,
                'certifications': trainer.certifications
            }

        # Add membership info if user has active membership
        active_membership = Membership.query.filter(
            and_(
                Membership.user_id == user_id,
                Membership.is_active == True
            )
        ).first()

        if active_membership:
            user_data['membership'] = {
                'id': active_membership.id,
                'type': active_membership.membership_type,
                'start_date': active_membership.start_date.isoformat(),
                'end_date': active_membership.end_date.isoformat(),
                'is_active': active_membership.is_active
            }

        # Add booking count
        booking_count = Booking.query.filter_by(member_id=user_id).count()
        user_data['total_bookings'] = booking_count

        return jsonify(user_data), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch user details: {str(e)}'}), 500

@admin_users_bp.route('/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """Update user information"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json() or {}

        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'date_of_birth' in data:
            user.date_of_birth = datetime.fromisoformat(data['date_of_birth']).date()
        if 'gender' in data and data['gender'] in ['Male', 'Female', 'Other']:
            user.gender = data['gender']
        if 'role' in data and data['role'] in ['Member', 'Trainer', 'Admin']:
            user.role = data['role']
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        
        # Update password if provided
        if 'password' in data:
            if not data['password'] or len(data['password'].strip()) < 6:
                return jsonify({'error': 'Password must be at least 6 characters'}), 400
            user.set_password(data['password'])

        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500


@admin_users_bp.route('/<user_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_user(user_id):
    """Deactivate a user account"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.is_active = False
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'User deactivated successfully',
            'user_id': user_id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to deactivate user: {str(e)}'}), 500


@admin_users_bp.route('/<user_id>/activate', methods=['POST'])
@jwt_required()
def activate_user(user_id):
    """Activate a user account"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.is_active = True
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'User activated successfully',
            'user_id': user_id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to activate user: {str(e)}'}), 500

@admin_users_bp.route('/trainers', methods=['GET'])
@jwt_required()
def get_all_trainers():
    """Get all trainers with their profiles"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search')

        query = User.query.filter(User.role == 'Trainer')

        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                or_(
                    User.email.ilike(search_pattern),
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern)
                )
            )

        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        trainers_data = []
        for user in pagination.items:
            trainer_dict = {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }

            if user.trainer_profile:
                trainer = user.trainer_profile
                trainer_dict['trainer_info'] = {
                    'trainer_id': trainer.trainer_id,
                    'years_of_experience': trainer.years_of_experience,
                    'hourly_rate': float(trainer.hourly_rate) if trainer.hourly_rate else None,
                    'specialization': trainer.specialization,
                    'profile_picture_url': trainer.profile_picture_url
                }

            trainers_data.append(trainer_dict)

        return jsonify({
            'trainers': trainers_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch trainers: {str(e)}'}), 500


@admin_users_bp.route('/trainers/<trainer_id>', methods=['PUT'])
@jwt_required()
def update_trainer_profile(trainer_id):
    """Update trainer profile information"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        trainer = Trainer.query.get(trainer_id)
        if not trainer:
            return jsonify({'error': 'Trainer not found'}), 404

        data = request.get_json() or {}

        # Update trainer-specific fields
        if 'years_of_experience' in data:
            trainer.years_of_experience = data['years_of_experience']
        if 'hourly_rate' in data:
            trainer.hourly_rate = data['hourly_rate']
        if 'specialization' in data:
            trainer.specialization = data['specialization']
        if 'bio' in data:
            trainer.bio = data['bio']
        if 'height' in data:
            trainer.height = data['height']
        if 'weight' in data:
            trainer.weight = data['weight']
        if 'profile_picture_url' in data:
            trainer.profile_picture_url = data['profile_picture_url']
        if 'certifications' in data:
            trainer.certifications = data['certifications']

        trainer.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Trainer profile updated successfully',
            'trainer_id': trainer_id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update trainer profile: {str(e)}'}), 500

@admin_users_bp.route('/members', methods=['GET'])
@jwt_required()
def get_all_members():
    """Get all members with their membership info"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        search = request.args.get('search')
        has_membership = request.args.get('has_membership')  # Filter by membership status

        query = User.query.filter(User.role == 'Member')

        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                or_(
                    User.email.ilike(search_pattern),
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern)
                )
            )

        pagination = query.order_by(User.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        members_data = []
        for user in pagination.items:
            member_dict = {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'is_active': user.is_active,
                'created_at': user.created_at.isoformat() if user.created_at else None
            }

            # Get active membership
            active_membership = Membership.query.filter(
                and_(
                    Membership.user_id == user.user_id,
                    Membership.is_active == True
                )
            ).first()

            if active_membership:
                member_dict['membership'] = {
                    'id': active_membership.id,
                    'type': active_membership.membership_type,
                    'start_date': active_membership.start_date.isoformat(),
                    'end_date': active_membership.end_date.isoformat(),
                    'is_active': active_membership.is_active
                }
            else:
                member_dict['membership'] = None

            # Filter by membership status if requested
            if has_membership is not None:
                has_membership_bool = has_membership.lower() == 'true'
                if has_membership_bool and not active_membership:
                    continue
                if not has_membership_bool and active_membership:
                    continue

            # Get booking count
            booking_count = Booking.query.filter_by(member_id=user.user_id).count()
            member_dict['total_bookings'] = booking_count

            members_data.append(member_dict)

        return jsonify({
            'members': members_data,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': len(members_data),
                'pages': pagination.pages
            }
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch members: {str(e)}'}), 500


@admin_users_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_statistics():
    """Get overall user statistics"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        total_users = User.query.count()
        total_members = User.query.filter(User.role == 'Member').count()
        total_trainers = User.query.filter(User.role == 'Trainer').count()
        total_admins = User.query.filter(User.role == 'Admin').count()
        
        active_users = User.query.filter(User.is_active == True).count()
        inactive_users = User.query.filter(User.is_active == False).count()

        # Active memberships
        active_memberships = Membership.query.filter(Membership.is_active == True).count()

        # Total bookings
        total_bookings = Booking.query.count()

        return jsonify({
            'total_users': total_users,
            'total_members': total_members,
            'total_trainers': total_trainers,
            'total_admins': total_admins,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'active_memberships': active_memberships,
            'total_bookings': total_bookings
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch statistics: {str(e)}'}), 500

@admin_users_bp.route('/<user_id>/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings(user_id):
    """Get all bookings for a specific user"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        bookings = Booking.query.filter_by(member_id=user_id).order_by(Booking.created_at.desc()).all()

        bookings_data = []
        for booking in bookings:
            booking_dict = {
                'id': booking.id,
                'session_id': booking.session_id,
                'status': booking.status,
                'created_at': booking.created_at.isoformat() if booking.created_at else None,
                'updated_at': booking.updated_at.isoformat() if booking.updated_at else None
            }
            
            if booking.session:
                session = booking.session
                booking_dict['session_details'] = {
                    'date': session.date.isoformat() if session.date else None,
                    'start_time': session.start_time.isoformat() if session.start_time else None,
                    'end_time': session.end_time.isoformat() if session.end_time else None,
                    'price': session.price
                }

            bookings_data.append(booking_dict)

        return jsonify({
            'user_id': user_id,
            'bookings': bookings_data,
            'total': len(bookings_data)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch user bookings: {str(e)}'}), 500


@admin_users_bp.route('/<user_id>/ratings', methods=['GET'])
@jwt_required()
def get_user_ratings(user_id):
    """Get all ratings given by a specific user"""
    try:
        current_user_id = get_jwt_identity()
        if not check_admin_role(current_user_id):
            return jsonify({'error': 'Admin access required'}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        product_ratings = ProductRating.query.filter_by(user_id=user_id).all()
        equipment_ratings = EquipmentRating.query.filter_by(user_id=user_id).all()

        ratings_data = {
            'product_ratings': [],
            'equipment_ratings': []
        }

        for rating in product_ratings:
            ratings_data['product_ratings'].append({
                'id': rating.id,
                'product_id': rating.product_id,
                'rating': rating.rating,
                'review': rating.review,
                'created_at': rating.created_at.isoformat() if rating.created_at else None
            })

        for rating in equipment_ratings:
            ratings_data['equipment_ratings'].append({
                'id': rating.id,
                'equipment_id': rating.equipment_id,
                'rating': rating.rating,
                'review': rating.review,
                'created_at': rating.created_at.isoformat() if rating.created_at else None
            })

        return jsonify({
            'user_id': user_id,
            'ratings': ratings_data,
            'total_product_ratings': len(ratings_data['product_ratings']),
            'total_equipment_ratings': len(ratings_data['equipment_ratings'])
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to fetch user ratings: {str(e)}'}), 500