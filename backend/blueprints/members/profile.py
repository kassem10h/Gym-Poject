from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User
from datetime import datetime

profile_bp = Blueprint('users', __name__, url_prefix='/api/users')

def validate_user_data(data, is_update=False):
    """Validate user input data"""
    errors = []
    
    if not is_update:
        required_fields = ['email', 'password', 'first_name', 'last_name', 'role']
        for field in required_fields:
            if field not in data or not data[field]:
                errors.append(f'{field} is required')
    
    if 'email' in data and data['email']:
        if '@' not in data['email']:
            errors.append('Invalid email format')
    
    if 'role' in data and data['role'] not in ['Member', 'Trainer', 'Admin']:
        errors.append('Role must be Member, Trainer, or Admin')
    
    if 'gender' in data and data['gender'] and data['gender'] not in ['Male', 'Female', 'Other']:
        errors.append('Gender must be Male, Female, or Other')
    
    if 'date_of_birth' in data and data['date_of_birth']:
        try:
            datetime.strptime(data['date_of_birth'], '%Y-%m-%d')
        except ValueError:
            errors.append('Date of birth must be in YYYY-MM-DD format')
    
    return errors

def user_to_dict(user, include_sensitive=False):
    """Convert user object to dictionary"""
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
    
    return user_dict


# ==================== USER PROFILE CRUD ====================

@profile_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_current_user_profile():
    """Get current logged-in user's profile"""
    try:
        user_id = get_jwt_identity()
        
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user_to_dict(user)), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch profile: {str(e)}'}), 500


@profile_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_current_user_profile():
    """
    Update current user's profile
    Body: {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "date_of_birth": "1990-01-01",
        "gender": "Male"
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate data
        errors = validate_user_data(data, is_update=True)
        if errors:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        # Get user
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'date_of_birth' in data:
            user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        if 'gender' in data:
            user.gender = data['gender']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user_to_dict(user)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update profile: {str(e)}'}), 500


@profile_bp.route('/profile/password', methods=['PUT'])
@jwt_required()
def change_password():
    """
    Change current user's password
    Body: {
        "current_password": "oldpass123",
        "new_password": "newpass456"
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validation
        if 'current_password' not in data or 'new_password' not in data:
            return jsonify({'error': 'current_password and new_password are required'}), 400
        
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        # Get user
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Verify current password
        if not user.check_password(data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Set new password
        user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to change password: {str(e)}'}), 500


# ==================== ADMIN OPERATIONS ====================

@profile_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (Admin only)"""
    try:
        user_id = get_jwt_identity()
        current_user = User.query.filter_by(user_id=user_id).first()
        
        if not current_user or current_user.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Get query parameters for filtering
        role = request.args.get('role')
        is_active = request.args.get('is_active')
        
        query = User.query
        
        if role:
            query = query.filter_by(role=role)
        if is_active is not None:
            query = query.filter_by(is_active=is_active.lower() == 'true')
        
        users = query.all()
        
        return jsonify({
            'total': len(users),
            'users': [user_to_dict(user) for user in users]
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch users: {str(e)}'}), 500


@profile_bp.route('/users/<user_id>', methods=['GET'])
@jwt_required()
def get_user_by_id(user_id):
    """Get specific user by ID (Admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(user_id=current_user_id).first()
        
        if not current_user or current_user.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user_to_dict(user)), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch user: {str(e)}'}), 500


@profile_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user():
    """
    Create a new user (Admin only)
    Body: {
        "email": "user@example.com",
        "password": "password123",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "date_of_birth": "1990-01-01",
        "gender": "Male",
        "role": "Member"
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(user_id=current_user_id).first()
        
        if not current_user or current_user.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate data
        errors = validate_user_data(data, is_update=False)
        if errors:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        # Check if email already exists
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        new_user = User(
            email=data['email'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            phone=data.get('phone'),
            gender=data.get('gender'),
            role=data['role']
        )
        
        if 'date_of_birth' in data and data['date_of_birth']:
            new_user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        
        new_user.set_password(data['password'])
        
        db.session.add(new_user)
        db.session.commit()
        
        return jsonify({
            'message': 'User created successfully',
            'user': user_to_dict(new_user)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to create user: {str(e)}'}), 500


@profile_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """
    Update a user (Admin only)
    Body: {
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",
        "role": "Trainer",
        "is_active": true
    }
    """
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(user_id=current_user_id).first()
        
        if not current_user or current_user.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        data = request.get_json()
        
        # Validate data
        errors = validate_user_data(data, is_update=True)
        if errors:
            return jsonify({'error': 'Validation failed', 'details': errors}), 400
        
        # Get user to update
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Update fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'date_of_birth' in data and data['date_of_birth']:
            user.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        if 'gender' in data:
            user.gender = data['gender']
        if 'role' in data:
            user.role = data['role']
        if 'is_active' in data:
            user.is_active = data['is_active']
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user_to_dict(user)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update user: {str(e)}'}), 500


@profile_bp.route('/users/<user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    """Delete a user (Admin only) - Soft delete by setting is_active to False"""
    try:
        current_user_id = get_jwt_identity()
        current_user = User.query.filter_by(user_id=current_user_id).first()
        
        if not current_user or current_user.role != 'Admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Prevent self-deletion
        if current_user_id == user_id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        user = User.query.filter_by(user_id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Soft delete
        user.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'User deactivated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete user: {str(e)}'}), 500