"""
Authentication Blueprint - Login and Signup
Fixed to use flask-jwt-extended consistently
"""
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models import db, User
import uuid

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def generate_uuid():
    return str(uuid.uuid4())


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Register a new user (Member or Trainer only)
    
    Expected JSON body:
    {
        "email": "user@example.com",
        "password": "password123",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1234567890",  # optional
        "date_of_birth": "1990-01-01",  # optional, format: YYYY-MM-DD
        "gender": "Male",  # optional: Male, Female, Other
        "role": "Member"  # required: Member or Trainer only
    }
    """
    data = request.get_json()
    
    # Validation - Required fields
    required_fields = ['email', 'password', 'first_name', 'last_name', 'role']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate role - only Member or Trainer allowed during signup
    role = data['role']
    if role not in ['Member', 'Trainer']:
        return jsonify({'error': 'Only Member or Trainer roles are allowed for signup'}), 400
    
    # Validate gender if provided
    if 'gender' in data and data['gender'] not in ['Male', 'Female', 'Other', None]:
        return jsonify({'error': 'Gender must be Male, Female, or Other'}), 400
    
    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 409
    
    # Validate email format (basic check)
    if '@' not in data['email'] or '.' not in data['email']:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Validate password strength (basic check)
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters long'}), 400
    
    try:
        # Parse date of birth if provided
        date_of_birth = None
        if 'date_of_birth' in data and data['date_of_birth']:
            try:
                date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Create new user
        new_user = User(
            user_id=generate_uuid(),
            email=data['email'].lower().strip(),
            first_name=data['first_name'].strip(),
            last_name=data['last_name'].strip(),
            phone=data.get('phone', '').strip() if data.get('phone') else None,
            date_of_birth=date_of_birth,
            gender=data.get('gender'),
            role=role,
            is_active=True
        )
        
        # Set password (will be hashed automatically)
        new_user.set_password(data['password'])
        
        # Add to database
        db.session.add(new_user)
        db.session.commit()
        
        # Generate JWT token using flask-jwt-extended
        token = create_access_token(
            identity=new_user.user_id,
            additional_claims={
                'email': new_user.email,
                'role': new_user.role
            }
        )
        
        return jsonify({
            'message': 'User registered successfully',
            'token': token,
            'user': {
                'user_id': new_user.user_id,
                'email': new_user.email,
                'first_name': new_user.first_name,
                'last_name': new_user.last_name,
                'role': new_user.role
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user (Member or Trainer only - Admin cannot login through this endpoint)
    
    Expected JSON body:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    
    Returns:
    - JWT token
    - User information including role
    - Frontend should handle redirection based on role
    """
    data = request.get_json()
    
    # Validation
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        # Find user by email
        user = User.query.filter_by(email=data['email'].lower().strip()).first()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Verify password
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Prevent Admin from logging in through this endpoint
        if user.role == 'Admin':
            return jsonify({'error': 'Admin accounts cannot login through this endpoint'}), 403
        
        # Only allow Member and Trainer
        if user.role not in ['Member', 'Trainer']:
            return jsonify({'error': 'Invalid user role'}), 403
        
        # Generate JWT token using flask-jwt-extended
        token = create_access_token(
            identity=user.user_id,
            additional_claims={
                'email': user.email,
                'role': user.role
            }
        )
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'role': user.role,
                'gender': user.gender,
                'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """
    Verify if the JWT token is valid and return user info
    Used by frontend to check authentication status
    
    Headers:
    Authorization: Bearer <token>
    """
    try:
        # Get current user ID from token
        user_id = get_jwt_identity()
        
        # Get user from database
        user = User.query.filter_by(user_id=user_id, is_active=True).first()
        
        if not user:
            return jsonify({'error': 'User not found or inactive'}), 404
        
        return jsonify({
            'valid': True,
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Verification failed: {str(e)}', 'valid': False}), 401


@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """
    Separate admin login endpoint
    Admin accounts must use this endpoint specifically
    
    Expected JSON body:
    {
        "email": "admin@example.com",
        "password": "adminpassword"
    }
    """
    data = request.get_json()
    
    # Validation
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        # Find user by email
        user = User.query.filter_by(email=data['email'].lower().strip()).first()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check if user is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Verify password
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Only allow Admin role
        if user.role != 'Admin':
            return jsonify({'error': 'This endpoint is for admin accounts only'}), 403
        
        # Generate JWT token using flask-jwt-extended
        token = create_access_token(
            identity=user.user_id,
            additional_claims={
                'email': user.email,
                'role': user.role
            }
        )
        
        return jsonify({
            'message': 'Admin login successful',
            'token': token,
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500