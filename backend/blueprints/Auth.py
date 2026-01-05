from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from models import db, User, Trainer
import uuid
from Notifications import notify_admin_new_trainer_application

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def generate_uuid():
    return str(uuid.uuid4())


@auth_bp.route('/signup', methods=['POST'])
def signup():
    """
    Register a new user (Member or Trainer only)
    Trainers will be created as INACTIVE and need to complete profile
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
            is_active=(False)
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
                'role': new_user.role,
                'is_active': new_user.is_active,
                'needs_profile': (role == 'Trainer')  # Frontend flag
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500

@auth_bp.route('/trainer/complete-profile', methods=['POST'])
@jwt_required()
def complete_trainer_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    try:
        user = User.query.filter_by(user_id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role != 'Trainer':
            return jsonify({'error': 'Only trainers can complete this profile'}), 403
        
        existing_trainer = Trainer.query.filter_by(user_id=user_id).first()
        if existing_trainer:
            return jsonify({'error': 'Trainer profile already exists'}), 409
        
        trainer = Trainer(
            trainer_id=generate_uuid(),
            user_id=user_id,
            years_of_experience=data.get('years_of_experience'),
            hourly_rate=data.get('hourly_rate'),
            specialization=data.get('specialization'),
            bio=data.get('bio'),
            height=data.get('height'),
            weight=data.get('weight'),
            certifications=data.get('certifications')
        )

        notify_admin_new_trainer_application(
            admin_id='90a89c93-2095-4582-b684-12b1e4edb337',
            trainer_name=f"{user.first_name} {user.last_name}"
        )
        
        db.session.add(trainer)
        db.session.commit()
        
        return jsonify({
            'message': 'Trainer profile completed successfully',
            'user': { 
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active
            },
            'trainer': {
                'trainer_id': trainer.trainer_id,
                'years_of_experience': trainer.years_of_experience,
                'hourly_rate': float(trainer.hourly_rate) if trainer.hourly_rate else None,
                'specialization': trainer.specialization
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to complete profile: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user (Member or Trainer only - Admin cannot login through this endpoint)
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
        
        # Verify password
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Prevent Admin from logging in through this endpoint
        if user.role == 'Admin':
            return jsonify({'error': 'Admin accounts cannot login through this endpoint'}), 403
        
        # Only allow Member and Trainer
        if user.role not in ['Member', 'Trainer']:
            return jsonify({'error': 'Invalid user role'}), 403
        
        # Check if trainer needs to complete profile
        needs_profile = False
        if user.role == 'Trainer' and not user.is_active:
            trainer = Trainer.query.filter_by(user_id=user.user_id).first()
            needs_profile = (trainer is None)
        
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
                'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
                'is_active': user.is_active,
                'needs_profile': needs_profile
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """
    Verify if the JWT token is valid and return user info
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        needs_profile = False
        if user.role == 'Trainer' and not user.is_active:
            trainer = Trainer.query.filter_by(user_id=user.user_id).first()
            needs_profile = (trainer is None)
        
        return jsonify({
            'valid': True,
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'needs_profile': needs_profile
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Verification failed: {str(e)}', 'valid': False}), 401


@auth_bp.route('/admin/login', methods=['POST'])
def admin_login():
    """
    Separate admin login endpoint
    """
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    try:
        user = User.query.filter_by(email=data['email'].lower().strip()).first()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        if not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if user.role != 'Admin':
            return jsonify({'error': 'This endpoint is for admin accounts only'}), 403
        
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

    
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    Get current logged-in user information
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.filter_by(user_id=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'user_id': user.user_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'role': user.role,
                'gender': user.gender,
                'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
                'is_active': user.is_active
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve user info: {str(e)}'}), 500